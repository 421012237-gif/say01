import { createServer } from "node:http";
import { timingSafeEqual } from "node:crypto";
import { fileURLToPath } from "node:url";
import {
  CHAT_MODEL,
  TTS_MODEL,
  TTS_VOICE,
  buildQwenRequest,
  buildTtsRequest,
  cleanText,
  extractQwenCoachResponse
} from "./core.mjs";

const DEFAULT_ORIGINS = [
  "https://421012237-gif.github.io",
  "http://localhost",
  "https://localhost",
  "capacitor://localhost"
];

function required(value, name) {
  const result = String(value || "").trim();
  if (!result) throw new Error(`${name} is required`);
  return result;
}

function httpsUrl(value, name) {
  const url = new URL(required(value, name));
  if (url.protocol !== "https:") throw new Error(`${name} must use https`);
  return url.toString().replace(/\/$/, "");
}

export function readConfig(env = process.env) {
  const accessToken = required(env.SAY01_ACCESS_TOKEN, "SAY01_ACCESS_TOKEN");
  if (accessToken.length < 24) throw new Error("SAY01_ACCESS_TOKEN must be at least 24 characters");
  const baseUrl = httpsUrl(env.DASHSCOPE_BASE_URL || "https://dashscope.aliyuncs.com/compatible-mode/v1", "DASHSCOPE_BASE_URL");
  const ttsUrl = env.DASHSCOPE_TTS_URL ? httpsUrl(env.DASHSCOPE_TTS_URL, "DASHSCOPE_TTS_URL") : "";
  const origins = String(env.SAY01_ALLOWED_ORIGINS || "").split(",").map(value => value.trim()).filter(Boolean);
  return {
    apiKey: required(env.DASHSCOPE_API_KEY, "DASHSCOPE_API_KEY"),
    accessToken,
    chatUrl: `${baseUrl}/chat/completions`,
    ttsUrl,
    ttsVoice: cleanText(env.SAY01_TTS_VOICE || TTS_VOICE, 100),
    allowedOrigins: new Set(origins.length ? origins : DEFAULT_ORIGINS),
    requestsPerMinute: Math.min(120, Math.max(10, Number(env.SAY01_REQUESTS_PER_MINUTE) || 30))
  };
}

function secureEqual(left, right) {
  const a = Buffer.from(String(left || ""));
  const b = Buffer.from(String(right || ""));
  return a.length === b.length && timingSafeEqual(a, b);
}

function bearerToken(request) {
  const value = String(request.headers.authorization || "");
  return value.startsWith("Bearer ") ? value.slice(7).trim() : "";
}

function json(response, status, body, origin = "") {
  response.statusCode = status;
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.setHeader("Cache-Control", "no-store");
  response.setHeader("X-Content-Type-Options", "nosniff");
  if (origin) {
    response.setHeader("Access-Control-Allow-Origin", origin);
    response.setHeader("Vary", "Origin");
  }
  response.end(JSON.stringify(body));
}

async function readJsonBody(request, limit = 16384) {
  const chunks = [];
  let total = 0;
  for await (const chunk of request) {
    total += chunk.length;
    if (total > limit) throw new Error("REQUEST_TOO_LARGE");
    chunks.push(chunk);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw new Error("REQUEST_JSON_INVALID");
  }
}

async function upstreamJson(response) {
  let payload = null;
  try { payload = await response.json(); } catch {}
  if (!response.ok) {
    const error = new Error(`UPSTREAM_HTTP_${response.status}`);
    error.status = response.status;
    error.code = cleanText(payload?.error?.code || payload?.code, 80);
    throw error;
  }
  return payload;
}

export async function callCoach(payload, config, fetchImpl = fetch) {
  const response = await fetchImpl(config.chatUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(buildQwenRequest(payload)),
    signal: AbortSignal.timeout(25000)
  });
  const upstream = await upstreamJson(response);
  const result = extractQwenCoachResponse(upstream);
  const usage = upstream?.usage || {};
  console.info(JSON.stringify({ event: "coach", model: CHAT_MODEL, inputTokens: usage.prompt_tokens || 0, outputTokens: usage.completion_tokens || 0 }));
  return result;
}

export async function callTts(text, config, fetchImpl = fetch) {
  if (!config.ttsUrl) {
    const error = new Error("TTS_NOT_CONFIGURED");
    error.status = 503;
    throw error;
  }
  const response = await fetchImpl(config.ttsUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(buildTtsRequest(text, { voice: config.ttsVoice })),
    signal: AbortSignal.timeout(30000)
  });
  const upstream = await upstreamJson(response);
  const audioUrl = String(upstream?.output?.audio?.url || "");
  if (!/^https?:\/\//i.test(audioUrl)) throw new Error("TTS_AUDIO_URL_INVALID");
  const audioResponse = await fetchImpl(audioUrl, { signal: AbortSignal.timeout(20000) });
  if (!audioResponse.ok) throw new Error(`TTS_AUDIO_HTTP_${audioResponse.status}`);
  const bytes = Buffer.from(await audioResponse.arrayBuffer());
  if (!bytes.length || bytes.length > 1500000) throw new Error("TTS_AUDIO_SIZE_INVALID");
  console.info(JSON.stringify({ event: "tts", model: TTS_MODEL, characters: upstream?.usage?.characters || cleanText(text, 140).length }));
  return {
    audioDataUrl: `data:audio/mpeg;base64,${bytes.toString("base64")}`,
    model: TTS_MODEL,
    voice: config.ttsVoice
  };
}

function clientAddress(request) {
  return cleanText(String(request.headers["x-forwarded-for"] || request.socket?.remoteAddress || "unknown").split(",")[0], 80);
}

function rateAllowed(store, key, limit, now = Date.now()) {
  const windowId = Math.floor(now / 60000);
  const current = store.get(key);
  if (!current || current.windowId !== windowId) {
    store.set(key, { windowId, count: 1 });
    return true;
  }
  current.count += 1;
  return current.count <= limit;
}

export function createHandler(config, { fetchImpl = fetch, rateStore = new Map() } = {}) {
  return async function handler(request, response) {
    const origin = String(request.headers.origin || "");
    const allowedOrigin = origin && config.allowedOrigins.has(origin) ? origin : "";
    if (origin && !allowedOrigin) return json(response, 403, { error: "ORIGIN_NOT_ALLOWED" });

    if (request.method === "OPTIONS") {
      response.statusCode = 204;
      response.setHeader("Access-Control-Allow-Origin", allowedOrigin);
      response.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type");
      response.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
      response.setHeader("Access-Control-Max-Age", "600");
      response.end();
      return;
    }

    if (request.method === "GET") {
      return json(response, 200, { ok: true, provider: "aliyun-bailian", model: CHAT_MODEL, tts: Boolean(config.ttsUrl) }, allowedOrigin);
    }
    if (request.method !== "POST") return json(response, 405, { error: "METHOD_NOT_ALLOWED" }, allowedOrigin);
    if (!secureEqual(bearerToken(request), config.accessToken)) return json(response, 401, { error: "ACCESS_DENIED" }, allowedOrigin);
    if (!rateAllowed(rateStore, clientAddress(request), config.requestsPerMinute)) return json(response, 429, { error: "RATE_LIMITED" }, allowedOrigin);

    try {
      const payload = await readJsonBody(request);
      if (payload?.version !== "2") return json(response, 400, { error: "VERSION_UNSUPPORTED" }, allowedOrigin);
      if (payload.action === "coach") {
        const result = await callCoach(payload, config, fetchImpl);
        return json(response, 200, result, allowedOrigin);
      }
      if (payload.action === "tts") {
        const result = await callTts(payload.text, config, fetchImpl);
        return json(response, 200, result, allowedOrigin);
      }
      return json(response, 400, { error: "ACTION_INVALID" }, allowedOrigin);
    } catch (error) {
      const message = String(error?.message || "");
      const status = error?.status === 503 ? 503
        : message.includes("TOO_LARGE") ? 413
          : message.includes("INVALID") || message.includes("EMPTY") ? 400
            : error?.status === 429 ? 429
              : error?.status === 401 || error?.status === 403 ? 502
                : 502;
      console.error(JSON.stringify({ event: "proxy_error", status, code: cleanText(message, 100) }));
      return json(response, status, { error: status === 503 ? "TTS_NOT_CONFIGURED" : status === 429 ? "UPSTREAM_RATE_LIMITED" : "UPSTREAM_UNAVAILABLE" }, allowedOrigin);
    }
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const config = readConfig();
  const port = Number(process.env.PORT) || 9000;
  createServer(createHandler(config)).listen(port, "0.0.0.0", () => {
    console.info(`十一说 Bailian proxy listening on ${port}; model=${CHAT_MODEL}; tts=${Boolean(config.ttsUrl)}`);
  });
}
