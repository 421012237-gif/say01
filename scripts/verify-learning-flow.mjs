import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const [app, html, styles, localVoice, audioPlugin] = await Promise.all([
  readFile(resolve(root, "app.js"), "utf8"),
  readFile(resolve(root, "index.html"), "utf8"),
  readFile(resolve(root, "styles.css"), "utf8"),
  readFile(resolve(root, "android/app/src/main/java/com/say01/english/SayLocalVoicePlugin.java"), "utf8"),
  readFile(resolve(root, "android/app/src/main/java/com/say01/english/SayAudioPlugin.java"), "utf8")
]);

assert.match(app, /const STAGE = Object\.freeze\(\{ NEW: 0, HEARD: 1, IMITATED: 2, RECALLED: 3, VARIED: 4 \}\)/);
assert.match(app, /phraseProgress: \{\}/);
assert.match(app, /function requiredStage\(refOrLine\)/);
assert.match(app, /function recordCapability\(ref, stage/);
assert.match(app, /function advanceCurrentPhrase\(\)/);
assert.match(app, /function skipCurrentPhrase\(\)/);
assert.doesNotMatch(app, /function markCurrentKnown\(/);
assert.match(app, /legacy: true/);
assert.match(app, /APP_AI_DAILY_LIMIT = 20/);
assert.match(app, /aiUsageByDate/);
assert.match(app, /function runDiagnostics\(/);
assert.match(app, /return unique\.slice\(0, 5\)/);
assert.doesNotMatch(app, /while \(result\.length < 5\)/);
assert.doesNotMatch(app, /recordCapability\([^\n]+\{[^\n]*transcript/, "recognition transcripts must not be persisted in capability evidence");

for (const id of ["listeningCheck", "startRecallBtn", "startVariationBtn", "skipPhrase", "diagnosticList", "backupStatus", "interestSelect"]) {
  assert.ok(html.includes(`id="${id}"`), `missing product control: ${id}`);
}
assert.ok(styles.includes(".capability-strip") && styles.includes(".listening-check") && styles.includes(".diagnostic-list"));
assert.ok(localVoice.includes("void warmup(PluginCall call)") && localVoice.includes("ensureTts"));
assert.ok(audioPlugin.includes("void stop(PluginCall call)") && audioPlugin.includes("player.stop"));

console.log("Learning-flow verification passed: evidence stages, listening/recall/variation, explicit skip, migration, diagnostics, warmup, backup, and AI daily cap.");
