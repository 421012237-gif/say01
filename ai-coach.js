(function attachSayAi(global) {
  "use strict";

  const PROVIDER = "阿里云百炼";
  const MODEL = "qwen3.7-plus";
  const VOICE_MODEL = "Kokoro-82M INT8 · af_sky";

  const SCENARIOS = {
    cafe: {
      persona: "MIA / BARISTA",
      title: "咖啡店临场",
      goal: "完成一次自然点单，并接住一个追问。",
      openerEn: "Hey! What can I get for you today?",
      openerZh: "嗨！今天想喝点什么？"
    },
    travel: {
      persona: "MIA / LOCAL",
      title: "城市问路临场",
      goal: "问到方向，再自然确认一次。",
      openerEn: "Hi! Do you need some help?",
      openerZh: "嗨！需要帮忙吗？"
    },
    social: {
      persona: "MIA / NEW FRIEND",
      title: "社交破冰临场",
      goal: "互相认识，并让话题多走一步。",
      openerEn: "Hey! I'm Mia. What's your name?",
      openerZh: "嗨！我是 Mia。你叫什么名字？"
    },
    shopping: {
      persona: "MIA / STAFF",
      title: "逛店购物临场",
      goal: "问清颜色或尺码，再做决定。",
      openerEn: "Hey! Let me know if you need any help.",
      openerZh: "嗨！需要帮忙就告诉我。"
    },
    work: {
      persona: "MIA / TEAMMATE",
      title: "工作初见临场",
      goal: "完成介绍，并提出一个简单请求。",
      openerEn: "Hi, welcome to the team! I'm Mia.",
      openerZh: "嗨，欢迎加入团队！我是 Mia。"
    },
    rescue: {
      persona: "MIA / STRANGER",
      title: "听不懂时临场",
      goal: "听不懂也别沉默，主动让对话慢下来。",
      openerEn: "Hey! How's everything going today?",
      openerZh: "嗨！今天一切都还顺利吗？"
    }
  };

  const RESPONSE_FIELDS = [
    "reply_en",
    "reply_zh",
    "feedback_zh",
    "fix_from",
    "fix_to",
    "fix_zh",
    "hint_en",
    "hint_zh",
    "memory_en",
    "memory_zh"
  ];

  function cleanText(value, maxLength) {
    return String(value || "")
      .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, maxLength);
  }

  function stripCodeFence(text) {
    const trimmed = String(text || "").trim();
    return trimmed.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
  }

  function parseJsonText(text) {
    const stripped = stripCodeFence(text);
    try {
      return JSON.parse(stripped);
    } catch {
      const start = stripped.indexOf("{");
      const end = stripped.lastIndexOf("}");
      if (start >= 0 && end > start) return JSON.parse(stripped.slice(start, end + 1));
      throw new Error("AI_RESPONSE_INVALID");
    }
  }

  function normalizeResponse(raw) {
    const source = raw && typeof raw === "object" ? raw : {};
    const result = {};
    RESPONSE_FIELDS.forEach(field => {
      const limit = field.endsWith("_en") || field === "fix_from" || field === "fix_to" ? 140 : 180;
      result[field] = cleanText(source[field], limit);
    });
    if (!result.reply_en) throw new Error("AI_RESPONSE_EMPTY");
    if (!result.feedback_zh) result.feedback_zh = "意思接住了，继续开口就很好。";
    if (!result.hint_en) result.hint_en = "One more thing, please.";
    if (!result.hint_zh) result.hint_zh = "再补充一件事就好。";
    if (!result.memory_en) result.memory_en = result.fix_to || result.hint_en || result.reply_en;
    if (!result.memory_zh) result.memory_zh = result.fix_zh || result.hint_zh || result.reply_zh;
    return result;
  }

  function extractQwenResponse(payload) {
    const content = payload?.choices?.[0]?.message?.content;
    const text = Array.isArray(content)
      ? content.map(part => part?.text || "").join("")
      : String(content || "");
    if (!text) {
      const reason = payload?.choices?.[0]?.finish_reason || payload?.error?.code || "EMPTY";
      throw new Error(`AI_NO_CANDIDATE:${reason}`);
    }
    return normalizeResponse(parseJsonText(text));
  }

  function proxyUrlAllowed(value) {
    try {
      const url = new URL(value, global.location?.origin || "https://localhost");
      return url.protocol === "https:" && !url.username && !url.password;
    } catch {
      return false;
    }
  }

  function connectionHeaders(settings) {
    const headers = { "Content-Type": "application/json" };
    const accessToken = cleanText(settings?.accessToken, 300);
    if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
    return headers;
  }

  async function readError(response, prefix = "AI_HTTP") {
    let detail = "";
    try {
      const payload = await response.json();
      detail = cleanText(payload?.error?.message || payload?.error || payload?.message, 180);
    } catch {}
    const error = new Error(`${prefix}_${response.status}${detail ? `:${detail}` : ""}`);
    error.status = response.status;
    throw error;
  }

  function assertConnection(settings) {
    if (!proxyUrlAllowed(settings?.proxyUrl)) throw new Error("AI_PROXY_INVALID");
    if (cleanText(settings?.accessToken, 300).length < 24) throw new Error("AI_ACCESS_TOKEN_MISSING");
  }

  async function requestCoach({ settings, sceneId, history, userText, memories, learnerProfile, fetchImpl }) {
    const fetcher = fetchImpl || global.fetch?.bind(global);
    if (!fetcher) throw new Error("AI_FETCH_UNAVAILABLE");
    const safeText = cleanText(userText, 180);
    if (!safeText) throw new Error("AI_INPUT_EMPTY");
    assertConnection(settings);

    const response = await fetcher(settings.proxyUrl, {
      method: "POST",
      headers: connectionHeaders(settings),
      body: JSON.stringify({
        version: "2",
        action: "coach",
        sceneId,
        history: (history || []).slice(-10),
        userText: safeText,
        memories: (memories || []).slice(-5),
        learnerProfile: { interest: cleanText(learnerProfile?.interest, 30) }
      })
    });
    if (!response.ok) await readError(response);
    const payload = await response.json();
    if (payload?.choices) return extractQwenResponse(payload);
    return normalizeResponse(payload);
  }

  global.SayAi = Object.freeze({
    PROVIDER,
    MODEL,
    VOICE_MODEL,
    SCENARIOS,
    cleanText,
    normalizeResponse,
    parseJsonText,
    extractQwenResponse,
    proxyUrlAllowed,
    connectionHeaders,
    requestCoach
  });
})(typeof window !== "undefined" ? window : globalThis);
