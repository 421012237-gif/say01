package com.say01.english;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(SayAudioPlugin.class);
        registerPlugin(SayAiConfigPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
