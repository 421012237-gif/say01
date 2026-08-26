import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

await import("../speech-check.js");
const speech = globalThis.SaySpeechCheck;
const root = resolve(import.meta.dirname, "..");

assert.deepEqual(speech.tokenize("I'm learning English."), ["i", "am", "learning", "english"]);
assert.equal(speech.evaluate("A latte, please.", ["a latte please"]).outcome, "pass");
assert.equal(speech.evaluate("A latte, please.", ["latte please"]).outcome, "understood");
assert.equal(speech.evaluate("A latte, please.", ["a coffee please"]).focusWord, "latte");
assert.equal(speech.evaluate("Please speak slowly.", ["please speak"]).focusWord, "slowly");
assert.equal(speech.evaluate("Hi. I'm Alex.", ["hi i am"], { ignoreWords: ["Alex"] }).outcome, "pass");
assert.equal(speech.evaluate("One ticket, please.", ["one ticket please"]).outcome, "pass");
assert.notEqual(speech.evaluate("One ticket, please.", ["coffee please", "one ticket please"]).outcome, "pass");
assert.equal(speech.evaluate("One ticket, please.", ["coffee please", "one ticket please"], { chooseBestAlternative: true }).outcome, "pass");

const [activity, plugin, html, app, manifest] = await Promise.all([
  readFile(resolve(root, "android/app/src/main/java/com/say01/english/MainActivity.java"), "utf8"),
  readFile(resolve(root, "android/app/src/main/java/com/say01/english/SaySpeechCheckPlugin.java"), "utf8"),
  readFile(resolve(root, "index.html"), "utf8"),
  readFile(resolve(root, "app.js"), "utf8"),
  readFile(resolve(root, "android/app/src/main/AndroidManifest.xml"), "utf8")
]);

assert.ok(activity.includes("registerPlugin(SaySpeechCheckPlugin.class)"));
assert.ok(plugin.includes('name = "SaySpeechCheck"') && plugin.includes('alias = "microphone"'));
assert.ok(plugin.includes("SpeechRecognizer") && plugin.includes("RecognizerIntent"));
assert.ok(plugin.includes("void openAppSettings(PluginCall call)") && plugin.includes("Settings.ACTION_APPLICATION_DETAILS_SETTINGS"));
assert.ok(plugin.includes('call.getInt("maxResults", 1)'));
assert.ok(manifest.includes("android.speech.RecognitionService"));
assert.ok(html.includes('id="speechWordDiff"') && html.includes("说一句 · 马上判断"));
assert.ok(app.includes("SaySpeechCheck") && app.includes("renderSpeechEvaluation"));
assert.ok(app.includes("await stopAllPlayback()") && app.includes("maxResults: 1"));
assert.ok(app.includes("startAiSpeechRecognition") && app.includes("nativeSpeechCheckPlugin"));

console.log("Speech check verification passed: first-result-only recognition, playback stop, native AI mic, settings recovery, word alignment, and one-focus feedback.");
