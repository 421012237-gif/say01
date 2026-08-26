import assert from "node:assert/strict";
import {
  CHAT_MODEL,
  buildQwenRequest,
  extractQwenCoachResponse
} from "../server/bailian-proxy/core.mjs";
import { callCoach, readConfig } from "../server/bailian-proxy/server.mjs";

const clientPayload = {
  sceneId: "cafe",
  history: [{ role: "model", text: "What can I get for you?" }],
  userText: "Coffee please",
  memories: [{ en: "No sugar, please.", zh: "请不要糖。" }]
};

const request = buildQwenRequest(clientPayload);
assert.equal(request.model, CHAT_MODEL);
assert.equal(request.enable_thinking, false);
assert.equal(request.response_format.type, "json_schema");
assert.equal(request.response_format.json_schema.strict, true);
assert.match(request.messages[0].content, /Correct at most ONE/);
assert.match(request.messages[0].content, /No sugar, please/);
assert.equal(request.messages.at(-1).content, "Coffee please");

const resultBody = {
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
};
const qwenPayload = { choices: [{ message: { content: JSON.stringify(resultBody) } }], usage: { prompt_tokens: 500, completion_tokens: 80 } };
assert.equal(extractQwenCoachResponse(qwenPayload).memory_en, "Iced, please.");

const config = readConfig({
  DASHSCOPE_API_KEY: "sk-test-only",
  DASHSCOPE_BASE_URL: "https://llm-test.cn-beijing.maas.aliyuncs.com/compatible-mode/v1",
  SAY01_ACCESS_TOKEN: "test-access-token-24-characters",
  SAY01_ALLOWED_ORIGINS: "https://421012237-gif.github.io,http://localhost"
});
assert.match(config.chatUrl, /chat\/completions$/);
assert.ok(config.allowedOrigins.has("http://localhost"));
assert.equal(Object.hasOwn(config, "ttsUrl"), false);

let chatCall;
const coach = await callCoach(clientPayload, config, async (url, options) => {
  chatCall = { url, options };
  return new Response(JSON.stringify(qwenPayload), { status: 200, headers: { "Content-Type": "application/json" } });
});
assert.equal(coach.reply_en, "Hot or iced?");
assert.equal(chatCall.options.headers.Authorization, "Bearer sk-test-only");
assert.equal(JSON.parse(chatCall.options.body).model, CHAT_MODEL);

console.log("Bailian proxy verification passed: fixed text model, JSON Schema, auth config, and coach call; speech stays on-device.");
