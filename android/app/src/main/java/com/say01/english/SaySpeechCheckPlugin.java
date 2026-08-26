package com.say01.english;

import android.Manifest;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.speech.RecognitionListener;
import android.speech.RecognizerIntent;
import android.speech.SpeechRecognizer;
import android.provider.Settings;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

import java.util.ArrayList;
import java.util.Locale;

@CapacitorPlugin(
    name = "SaySpeechCheck",
    permissions = @Permission(alias = "microphone", strings = { Manifest.permission.RECORD_AUDIO })
)
public class SaySpeechCheckPlugin extends Plugin {

    private static final long RECOGNITION_TIMEOUT_MS = 16000L;
    private final Handler mainHandler = new Handler(Looper.getMainLooper());

    private SpeechRecognizer recognizer;
    private PluginCall activeCall;
    private Runnable timeoutTask;

    @PluginMethod
    public void status(PluginCall call) {
        mainHandler.post(() -> {
            JSObject result = new JSObject();
            result.put("available", SpeechRecognizer.isRecognitionAvailable(getContext()));
            result.put("provider", "android-system");
            result.put("mayUseNetwork", true);
            call.resolve(result);
        });
    }

    @PluginMethod
    public void check(PluginCall call) {
        if (getPermissionState("microphone") != PermissionState.GRANTED) {
            requestPermissionForAlias("microphone", call, "microphonePermissionResult");
            return;
        }
        startRecognition(call);
    }

    @PluginMethod
    public void openAppSettings(PluginCall call) {
        mainHandler.post(() -> {
            try {
                Intent intent = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
                intent.setData(Uri.parse("package:" + getContext().getPackageName()));
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                getContext().startActivity(intent);
                JSObject result = new JSObject();
                result.put("ok", true);
                call.resolve(result);
            } catch (RuntimeException error) {
                call.reject("APP_SETTINGS_UNAVAILABLE", error);
            }
        });
    }

    @PermissionCallback
    public void microphonePermissionResult(PluginCall call) {
        if (getPermissionState("microphone") != PermissionState.GRANTED) {
            call.reject("MICROPHONE_PERMISSION_DENIED");
            return;
        }
        startRecognition(call);
    }

    @PluginMethod
    public void cancel(PluginCall call) {
        mainHandler.post(() -> {
            PluginCall pending = activeCall;
            cleanupRecognizer(true);
            if (pending != null) pending.reject("SPEECH_CANCELLED");
            JSObject result = new JSObject();
            result.put("ok", true);
            call.resolve(result);
        });
    }

    private void startRecognition(PluginCall call) {
        mainHandler.post(() -> {
            if (activeCall != null) {
                call.reject("SPEECH_RECOGNIZER_BUSY");
                return;
            }
            if (!SpeechRecognizer.isRecognitionAvailable(getContext())) {
                call.reject("SPEECH_RECOGNIZER_UNAVAILABLE");
                return;
            }

            activeCall = call;
            recognizer = SpeechRecognizer.createSpeechRecognizer(getContext());
            recognizer.setRecognitionListener(new RecognitionListener() {
                @Override public void onReadyForSpeech(Bundle params) {}
                @Override public void onBeginningOfSpeech() {}
                @Override public void onRmsChanged(float rmsdB) {}
                @Override public void onBufferReceived(byte[] buffer) {}
                @Override public void onEndOfSpeech() {}
                @Override public void onPartialResults(Bundle partialResults) {}
                @Override public void onEvent(int eventType, Bundle params) {}

                @Override
                public void onError(int error) {
                    PluginCall pending = activeCall;
                    String code = errorCode(error);
                    cleanupRecognizer(false);
                    if (pending != null) pending.reject(code);
                }

                @Override
                public void onResults(Bundle results) {
                    PluginCall pending = activeCall;
                    ArrayList<String> matches = results.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION);
                    float[] confidences = results.getFloatArray(SpeechRecognizer.CONFIDENCE_SCORES);
                    cleanupRecognizer(false);
                    if (pending == null) return;
                    if (matches == null || matches.isEmpty()) {
                        pending.reject("SPEECH_NO_MATCH");
                        return;
                    }

                    JSObject response = new JSObject();
                    response.put("transcript", matches.get(0));
                    response.put("alternatives", new JSArray(matches));
                    response.put("confidence", confidences != null && confidences.length > 0 ? confidences[0] : -1f);
                    response.put("provider", "android-system");
                    response.put("mayUseNetwork", true);
                    pending.resolve(response);
                }
            });

            try {
                Intent intent = new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH);
                intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM);
                intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE, Locale.US.toLanguageTag());
                intent.putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, Math.max(1, Math.min(5, call.getInt("maxResults", 1))));
                intent.putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, false);
                intent.putExtra(RecognizerIntent.EXTRA_PROMPT, "Say the English sentence");
                recognizer.startListening(intent);
            } catch (RuntimeException error) {
                PluginCall pending = activeCall;
                cleanupRecognizer(true);
                if (pending != null) pending.reject("SPEECH_RECOGNIZER_START_FAILED", error);
                return;
            }

            timeoutTask = () -> {
                PluginCall pending = activeCall;
                cleanupRecognizer(true);
                if (pending != null) pending.reject("SPEECH_TIMEOUT");
            };
            mainHandler.postDelayed(timeoutTask, RECOGNITION_TIMEOUT_MS);
        });
    }

    private String errorCode(int error) {
        switch (error) {
            case SpeechRecognizer.ERROR_INSUFFICIENT_PERMISSIONS: return "MICROPHONE_PERMISSION_DENIED";
            case SpeechRecognizer.ERROR_NETWORK:
            case SpeechRecognizer.ERROR_NETWORK_TIMEOUT: return "SPEECH_NETWORK_ERROR";
            case SpeechRecognizer.ERROR_NO_MATCH: return "SPEECH_NO_MATCH";
            case SpeechRecognizer.ERROR_RECOGNIZER_BUSY: return "SPEECH_RECOGNIZER_BUSY";
            case SpeechRecognizer.ERROR_SPEECH_TIMEOUT: return "SPEECH_TIMEOUT";
            case SpeechRecognizer.ERROR_AUDIO: return "SPEECH_AUDIO_ERROR";
            default: return "SPEECH_SERVICE_ERROR_" + error;
        }
    }

    private void cleanupRecognizer(boolean cancel) {
        if (timeoutTask != null) mainHandler.removeCallbacks(timeoutTask);
        timeoutTask = null;
        if (recognizer != null) {
            try {
                if (cancel) recognizer.cancel();
                else recognizer.stopListening();
            } catch (RuntimeException ignored) {}
            recognizer.destroy();
        }
        recognizer = null;
        activeCall = null;
    }

    @Override
    protected void handleOnDestroy() {
        mainHandler.post(() -> {
            PluginCall pending = activeCall;
            cleanupRecognizer(true);
            if (pending != null) pending.reject("SPEECH_CANCELLED");
        });
        super.handleOnDestroy();
    }
}
