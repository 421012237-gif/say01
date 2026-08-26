package com.say01.english;

import android.content.res.AssetManager;
import android.media.AudioAttributes;
import android.media.AudioFormat;
import android.media.AudioManager;
import android.media.AudioTrack;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.k2fsa.sherpa.onnx.GeneratedAudio;
import com.k2fsa.sherpa.onnx.OfflineTts;
import com.k2fsa.sherpa.onnx.OfflineTtsConfig;
import com.k2fsa.sherpa.onnx.OfflineTtsKokoroModelConfig;
import com.k2fsa.sherpa.onnx.OfflineTtsModelConfig;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.Arrays;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicLong;

@CapacitorPlugin(name = "SayLocalVoice")
public class SayLocalVoicePlugin extends Plugin {

    private static final String MODEL_DIR = "kokoro-int8-en-v0_19";
    private static final String DATA_DIR = MODEL_DIR + "/espeak-ng-data";
    private static final String ENGINE = "Kokoro-82M INT8";
    private static final String VOICE = "af_sky";
    private static final int SPEAKER_ID = 4;

    private final ExecutorService speechExecutor = Executors.newSingleThreadExecutor();
    private final AtomicLong requestSerial = new AtomicLong();
    private final Handler mainHandler = new Handler(Looper.getMainLooper());
    private final Object audioLock = new Object();

    private volatile OfflineTts tts;
    private AudioTrack activeTrack;
    private PluginCall activePlaybackCall;

    @PluginMethod
    public void status(PluginCall call) {
        JSObject result = new JSObject();
        result.put("available", Arrays.asList(Build.SUPPORTED_ABIS).contains("arm64-v8a"));
        result.put("offline", true);
        result.put("engine", ENGINE);
        result.put("voice", VOICE);
        result.put("initialized", tts != null);
        call.resolve(result);
    }

    @PluginMethod
    public void speak(PluginCall call) {
        String text = sanitize(call.getString("text", ""));
        if (text.isEmpty()) {
            call.reject("LOCAL_TTS_INPUT_EMPTY");
            return;
        }

        float speed = Math.max(0.82f, Math.min(1.12f, call.getFloat("speed", 0.96f)));
        long serial = requestSerial.incrementAndGet();
        mainHandler.post(() -> finishPlayback(false));

        speechExecutor.execute(() -> {
            try {
                OfflineTts engine = ensureTts();
                GeneratedAudio audio = engine.generate(text, SPEAKER_ID, speed);
                if (serial != requestSerial.get()) {
                    resolveCancelled(call);
                    return;
                }
                float[] samples = audio.getSamples();
                if (samples == null || samples.length == 0 || audio.getSampleRate() <= 0) {
                    rejectOnMain(call, "LOCAL_TTS_GENERATION_EMPTY", null);
                    return;
                }
                mainHandler.post(() -> playSamples(call, serial, samples, audio.getSampleRate()));
            } catch (Throwable error) {
                if (serial != requestSerial.get()) resolveCancelled(call);
                else rejectOnMain(call, "LOCAL_TTS_FAILED", error);
            }
        });
    }

    @PluginMethod
    public void stop(PluginCall call) {
        requestSerial.incrementAndGet();
        mainHandler.post(() -> {
            finishPlayback(false);
            JSObject result = new JSObject();
            result.put("ok", true);
            call.resolve(result);
        });
    }

    private OfflineTts ensureTts() throws IOException {
        if (tts != null) return tts;
        synchronized (this) {
            if (tts != null) return tts;

            File dataDir = new File(getContext().getFilesDir(), "local-tts/" + DATA_DIR);
            File ready = new File(dataDir, ".ready-v1");
            if (!ready.isFile()) {
                copyAssetTree(DATA_DIR, dataDir);
                if (!ready.createNewFile() && !ready.isFile()) {
                    throw new IOException("Could not mark local voice data ready");
                }
            }

            OfflineTtsKokoroModelConfig kokoro = new OfflineTtsKokoroModelConfig();
            kokoro.setModel(MODEL_DIR + "/model.int8.onnx");
            kokoro.setVoices(MODEL_DIR + "/voices.bin");
            kokoro.setTokens(MODEL_DIR + "/tokens.txt");
            kokoro.setDataDir(dataDir.getAbsolutePath());
            kokoro.setLengthScale(1.0f);

            OfflineTtsModelConfig model = new OfflineTtsModelConfig();
            model.setKokoro(kokoro);
            model.setNumThreads(Math.max(2, Math.min(4, Runtime.getRuntime().availableProcessors() / 2)));
            model.setDebug(false);
            model.setProvider("cpu");

            OfflineTtsConfig config = new OfflineTtsConfig();
            config.setModel(model);
            config.setMaxNumSentences(1);
            config.setSilenceScale(0.22f);

            tts = new OfflineTts(getContext().getAssets(), config);
            return tts;
        }
    }

    private void copyAssetTree(String assetPath, File target) throws IOException {
        AssetManager assets = getContext().getAssets();
        String[] children = assets.list(assetPath);
        if (children != null && children.length > 0) {
            if (!target.isDirectory() && !target.mkdirs() && !target.isDirectory()) {
                throw new IOException("Could not create " + target);
            }
            for (String child : children) {
                copyAssetTree(assetPath + "/" + child, new File(target, child));
            }
            return;
        }

        File parent = target.getParentFile();
        if (parent != null && !parent.isDirectory() && !parent.mkdirs() && !parent.isDirectory()) {
            throw new IOException("Could not create " + parent);
        }
        try (InputStream input = assets.open(assetPath); FileOutputStream output = new FileOutputStream(target)) {
            byte[] buffer = new byte[16384];
            int count;
            while ((count = input.read(buffer)) != -1) output.write(buffer, 0, count);
        }
    }

    private void playSamples(PluginCall call, long serial, float[] samples, int sampleRate) {
        if (serial != requestSerial.get()) {
            resolveCancelled(call);
            return;
        }
        finishPlayback(false);
        try {
            AudioAttributes attributes = new AudioAttributes.Builder()
                .setUsage(AudioAttributes.USAGE_MEDIA)
                .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
                .build();
            AudioFormat format = new AudioFormat.Builder()
                .setEncoding(AudioFormat.ENCODING_PCM_FLOAT)
                .setChannelMask(AudioFormat.CHANNEL_OUT_MONO)
                .setSampleRate(sampleRate)
                .build();
            AudioTrack track = new AudioTrack.Builder()
                .setAudioAttributes(attributes)
                .setAudioFormat(format)
                .setTransferMode(AudioTrack.MODE_STATIC)
                .setBufferSizeInBytes(samples.length * Float.BYTES)
                .setSessionId(AudioManager.AUDIO_SESSION_ID_GENERATE)
                .build();
            int written = track.write(samples, 0, samples.length, AudioTrack.WRITE_BLOCKING);
            if (written != samples.length) {
                track.release();
                throw new IllegalStateException("Incomplete local voice audio buffer");
            }
            synchronized (audioLock) {
                activeTrack = track;
                activePlaybackCall = call;
            }
            track.setNotificationMarkerPosition(samples.length);
            track.setPlaybackPositionUpdateListener(new AudioTrack.OnPlaybackPositionUpdateListener() {
                @Override
                public void onMarkerReached(AudioTrack audioTrack) {
                    finishPlayback(true);
                }

                @Override
                public void onPeriodicNotification(AudioTrack audioTrack) {}
            }, mainHandler);
            track.play();
            long fallbackDelayMs = Math.max(1200L, (samples.length * 1000L / sampleRate) + 1500L);
            mainHandler.postDelayed(() -> {
                synchronized (audioLock) {
                    if (activeTrack != track) return;
                }
                finishPlayback(true);
            }, fallbackDelayMs);
        } catch (Throwable error) {
            abandonPlayback(call);
            rejectOnMain(call, "LOCAL_TTS_PLAYBACK_FAILED", error);
        }
    }

    private void abandonPlayback(PluginCall expectedCall) {
        AudioTrack track = null;
        synchronized (audioLock) {
            if (activePlaybackCall == expectedCall) {
                track = activeTrack;
                activeTrack = null;
                activePlaybackCall = null;
            }
        }
        if (track != null) {
            track.setPlaybackPositionUpdateListener(null);
            try {
                track.stop();
            } catch (IllegalStateException ignored) {}
            track.release();
        }
    }

    private void finishPlayback(boolean ok) {
        AudioTrack track;
        PluginCall call;
        synchronized (audioLock) {
            track = activeTrack;
            call = activePlaybackCall;
            activeTrack = null;
            activePlaybackCall = null;
        }
        if (track != null) {
            track.setPlaybackPositionUpdateListener(null);
            try {
                track.stop();
            } catch (IllegalStateException ignored) {}
            track.release();
        }
        if (call != null) {
            JSObject result = voiceResult(ok);
            call.resolve(result);
        }
    }

    private JSObject voiceResult(boolean ok) {
        JSObject result = new JSObject();
        result.put("ok", ok);
        result.put("offline", true);
        result.put("engine", ENGINE);
        result.put("voice", VOICE);
        return result;
    }

    private void resolveCancelled(PluginCall call) {
        mainHandler.post(() -> call.resolve(voiceResult(false)));
    }

    private void rejectOnMain(PluginCall call, String message, Throwable error) {
        mainHandler.post(() -> {
            if (error == null) call.reject(message);
            else call.reject(message, error instanceof Exception ? (Exception) error : new RuntimeException(error));
        });
    }

    private String sanitize(String value) {
        String clean = String.valueOf(value == null ? "" : value)
            .replaceAll("[\\p{Cntrl}&&[^\\r\\n\\t]]", "")
            .replaceAll("\\s+", " ")
            .trim();
        return clean.substring(0, Math.min(140, clean.length()));
    }

    @Override
    protected void handleOnDestroy() {
        requestSerial.incrementAndGet();
        mainHandler.post(() -> finishPlayback(false));
        speechExecutor.execute(() -> {
            OfflineTts engine = tts;
            tts = null;
            if (engine != null) engine.release();
        });
        speechExecutor.shutdown();
        super.handleOnDestroy();
    }
}
