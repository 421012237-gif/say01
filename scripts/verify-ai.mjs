import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";

await import("../ai-coach.js");
const ai = globalThis.SayAi;

assert.equal(ai.PROVIDER, "阿里云百炼");
assert.equal(ai.MODEL, "qwen3.7-plus");
assert.equal(ai.VOICE_MODEL, "Kokoro-82M INT8 · af_sky");
assert.deepEqual(Object.keys(ai.SCENARIOS).sort(), ["cafe", "rescue", "shopping", "social", "travel", "work"]);

const projectRoot = resolve(import.meta.dirname, "..");
const [appSource, gradleSource, activitySource, nativeConfigSource, localVoiceSource, htmlSource, modelStat, aarStat] = await Promise.all([
  readFile(resolve(projectRoot, "app.js"), "utf8"),
  readFile(resolve(projectRoot, "android/app/build.gradle"), "utf8"),
  readFile(resolve(projectRoot, "android/app/src/main/java/com/say01/english/MainActivity.java"), "utf8"),
  readFile(resolve(projectRoot, "android/app/src/main/java/com/say01/english/SayAiConfigPlugin.java"), "utf8"),
  readFile(resolve(projectRoot, "android/app/src/main/java/com/say01/english/SayLocalVoicePlugin.java"), "utf8"),
  readFile(resolve(projectRoot, "index.html"), "utf8"),
  stat(resolve(projectRoot, "android/app/src/main/assets/kokoro-int8-en-v0_19/model.int8.onnx")),
  stat(resolve(projectRoot, "android/app/libs/sherpa-onnx-1.13.6.aar"))
]);
assert.ok(gradleSource.includes("ELEVEN_AI_PROXY_URL") && gradleSource.includes("ELEVEN_AI_ACCESS_TOKEN"));
assert.ok(gradleSource.includes("sherpa-onnx-1.13.6") && gradleSource.includes("arm64-v8a"));
assert.ok(activitySource.includes("registerPlugin(SayAiConfigPlugin.class)"));
assert.ok(activitySource.includes("registerPlugin(SayLocalVoicePlugin.class)"));
assert.ok(nativeConfigSource.includes('@CapacitorPlugin(name = "SayAiConfig")'));
assert.ok(localVoiceSource.includes('@CapacitorPlugin(name = "SayLocalVoice")'));
assert.ok(localVoiceSource.includes('VOICE = "af_sky"') && localVoiceSource.includes("SPEAKER_ID = 4"));
assert.ok(modelStat.size > 100_000_000 && aarStat.size > 40_000_000);
assert.ok(appSource.includes("hydrateNativeAiConnection") && appSource.includes("aiConnectionManaged"));
assert.ok(appSource.includes("SayLocalVoice") && !appSource.includes("requestSpeech"));
assert.ok(htmlSource.includes("data-manual-ai") && htmlSource.includes('id="aiSetupCopy"'));
assert.ok(htmlSource.includes('id="testLocalVoice"'));

const normalized = ai.normalizeResponse({ reply_en: "  Sounds good!  ", reply_zh: " 好的！ " });
assert.equal(normalized.reply_en, "Sounds good!");
assert.ok(normalized.feedback_zh);
assert.ok(normalized.memory_en);

const fenced = ai.parseJsonText('```json\n{"reply_en":"Nice!","reply_zh":"很好"}\n```');
assert.equal(fenced.reply_en, "Nice!");

const qwenPayload = {
  choices: [{ message: { content: JSON.stringify({
    reply_en: "Hot or iced?",
    reply_zh: "热的还是冰的？",
    feedback_zh: "表达清楚。",
    fix_from: "",
    fix_to: "",
    fix_zh: "",
    hint_en: "Iced, please.",
    hint_zh: "请给我冰的。",
    memory_en: "Iced, please.",
    memory_zh: "请给我冰的。"
  }) } }]
};
assert.equal(ai.extractQwenResponse(qwenPayload).reply_en, "Hot or iced?");

const settings = {
  proxyUrl: "https://say01-api.example.com/",
  accessToken: "test-access-token-24-characters",
  consent: true
};

let coachRequest;
const coachResponse = await ai.requestCoach({
  settings,
  sceneId: "cafe",
  history: [],
  userText: "Coffee please",
  memories: [],
  learnerProfile: { interest: "trends" },
  fetchImpl: async (url, options) => {
    coachRequest = { url, options };
    return { ok: true, json: async () => qwenPayload };
  }
});
assert.equal(coachRequest.url, settings.proxyUrl);
assert.equal(coachRequest.options.headers.Authorization, `Bearer ${settings.accessToken}`);
assert.equal(JSON.parse(coachRequest.options.body).action, "coach");
assert.equal(JSON.parse(coachRequest.options.body).learnerProfile.interest, "trends");
assert.equal(coachResponse.hint_en, "Iced, please.");
assert.equal(ai.connectionHeaders(settings).Authorization, `Bearer ${settings.accessToken}`);

assert.equal(ai.proxyUrlAllowed("https://say01.cn-beijing.fcapp.run"), true);
assert.equal(ai.proxyUrlAllowed("https://api.example.com/say01"), true);
assert.equal(ai.proxyUrlAllowed("http://api.example.com/say01"), false);
assert.equal(ai.proxyUrlAllowed("https://name:secret@example.com/say01"), false);

await assert.rejects(
  ai.requestCoach({
    settings,
    sceneId: "cafe",
    history: [],
    userText: "Hello",
    memories: [],
    fetchImpl: async () => ({ ok: false, status: 429, json: async () => ({ error: "quota" }) })
  }),
  /AI_HTTP_429/
);

await assert.rejects(
  ai.requestCoach({ settings: { proxyUrl: settings.proxyUrl, accessToken: "short" }, sceneId: "cafe", history: [], userText: "Hello", memories: [] }),
  /AI_ACCESS_TOKEN_MISSING/
);

console.log("AI client verification passed: Bailian text model, proxy auth, Qwen JSON, embedded Kokoro girl voice, HTTPS policy, and errors.");
