package com.say01.english;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "SayAiConfig")
public class SayAiConfigPlugin extends Plugin {

    @PluginMethod
    public void get(PluginCall call) {
        String proxyUrl = BuildConfig.ELEVEN_AI_PROXY_URL == null ? "" : BuildConfig.ELEVEN_AI_PROXY_URL.trim();
        String accessToken = BuildConfig.ELEVEN_AI_ACCESS_TOKEN == null ? "" : BuildConfig.ELEVEN_AI_ACCESS_TOKEN.trim();

        JSObject result = new JSObject();
        result.put("proxyUrl", proxyUrl);
        result.put("accessToken", accessToken);
        result.put("configured", proxyUrl.startsWith("https://") && accessToken.length() >= 24);
        call.resolve(result);
    }
}
