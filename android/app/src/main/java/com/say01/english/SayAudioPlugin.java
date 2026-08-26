package com.say01.english;

import android.content.res.AssetFileDescriptor;
import android.media.AudioAttributes;
import android.media.MediaPlayer;
import android.media.PlaybackParams;
import android.os.Build;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "SayAudio")
public class SayAudioPlugin extends Plugin {

    private MediaPlayer player;
    private PluginCall pendingCall;

    @PluginMethod
    public void play(PluginCall call) {
        String file = call.getString("file", "");
        float rate = Math.max(0.55f, Math.min(1.25f, call.getFloat("rate", 1f)));

        if (!file.matches("[a-z0-9-]+\\.m4a")) {
            call.reject("Invalid bundled audio file");
            return;
        }

        getActivity().runOnUiThread(() -> {
            finishPending(false);
            try (AssetFileDescriptor descriptor = getContext().getAssets().openFd("public/audio/" + file)) {
                pendingCall = call;
                player = new MediaPlayer();
                player.setAudioAttributes(
                    new AudioAttributes.Builder()
                        .setUsage(AudioAttributes.USAGE_MEDIA)
                        .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
                        .build()
                );
                player.setDataSource(descriptor.getFileDescriptor(), descriptor.getStartOffset(), descriptor.getLength());
                player.setVolume(1f, 1f);
                player.setOnCompletionListener(mediaPlayer -> finishPending(true));
                player.setOnErrorListener((mediaPlayer, what, extra) -> {
                    finishPending(false);
                    return true;
                });
                player.prepare();
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && Math.abs(rate - 1f) > 0.01f) {
                    try {
                        PlaybackParams params = player.getPlaybackParams();
                        params.setPitch(1f);
                        params.setSpeed(rate);
                        player.setPlaybackParams(params);
                    } catch (RuntimeException ignored) {}
                }
                player.start();
            } catch (Exception error) {
                if (pendingCall == call) {
                    finishPending(false);
                } else {
                    call.reject("Bundled audio could not play", error);
                }
            }
        });
    }

    @PluginMethod
    public void stop(PluginCall call) {
        getActivity().runOnUiThread(() -> {
            finishPending(false);
            JSObject result = new JSObject();
            result.put("ok", true);
            call.resolve(result);
        });
    }

    private void finishPending(boolean ok) {
        if (player != null) {
            player.setOnCompletionListener(null);
            player.setOnErrorListener(null);
            try {
                player.stop();
            } catch (IllegalStateException ignored) {}
            player.release();
            player = null;
        }
        if (pendingCall != null) {
            JSObject result = new JSObject();
            result.put("ok", ok);
            pendingCall.resolve(result);
            pendingCall = null;
        }
    }

    @Override
    protected void handleOnDestroy() {
        finishPending(false);
        super.handleOnDestroy();
    }
}
