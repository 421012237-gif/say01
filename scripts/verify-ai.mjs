import assert from "node:assert/strict";

await import("../ai-coach.js");
const ai = globalThis.SayAi;

assert.equal(ai.MODEL, "gemini-2.5-flash-lite");
assert.deepEqual(Object.keys(ai.SCENARIOS).sort(), ["cafe", "rescue", "shopping", "social", "travel", "work"]);

const normalized = ai.normalizeResponse({ reply_en: "  Sounds good!  ", reply_zh: " 好的！ " });
assert.equal(normalized.reply_en, "Sounds good!");
assert.ok(normalized.feedback_zh);
assert.ok(normalized.memory_en);

const fenced = ai.parseJsonText('```json\n{"reply_en":"Nice!","reply_zh":"很好"}\n```');
assert.equal(fenced.reply_en, "Nice!");

const request = ai.buildGeminiRequest({
  sceneId: "cafe",
  history: [{ role: "model", text: "What can I get for you?" }],
  userText: "Coffee please",
  memories: [{ en: "No sugar, please.", zh: "请不要糖。" }]
});
assert.equal(request.generationConfig.responseMimeType, "application/json");
assert.match(request.systemInstruction.parts[0].text, /Correct at most ONE/);
assert.match(request.contents[0].parts[0].text, /No sugar, please/);

const payload = {
  candidates: [{ content: { parts: [{ text: JSON.stringify({
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
  }) }] } }]
};

let directRequest;
const response = await ai.requestCoach({
  settings: { mode: "gemini", apiKey: "test-key-long-enough" },
  sceneId: "cafe",
  history: [],
  userText: "Coffee please",
  memories: [],
  fetchImpl: async (url, options) => {
    directRequest = { url, options };
    return { ok: true, json: async () => payload };
  }
});
assert.match(directRequest.url, /gemini-2\.5-flash-lite:generateContent$/);
assert.equal(directRequest.options.headers["x-goog-api-key"], "test-key-long-enough");
assert.equal(response.hint_en, "Iced, please.");

assert.equal(ai.proxyUrlAllowed("https://demo.workers.dev"), true);
assert.equal(ai.proxyUrlAllowed("http://demo.workers.dev"), false);
assert.equal(ai.proxyUrlAllowed("https://example.com/collect"), false);

await assert.rejects(
  ai.requestCoach({
    settings: { mode: "gemini", apiKey: "test-key-long-enough" },
    sceneId: "cafe",
    history: [],
    userText: "Hello",
    memories: [],
    fetchImpl: async () => ({ ok: false, status: 429, json: async () => ({ error: { message: "quota" } }) })
  }),
  /AI_HTTP_429/
);

console.log("AI coach verification passed: prompt, JSON parsing, direct request, proxy allowlist, and error handling.");
