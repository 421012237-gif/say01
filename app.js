const APP_VERSION = "2.4.2";
const STORAGE_KEY = "xiaobai-english-v2";
const LEGACY_KEY = "xiaobai-english-v1";
const AI_SETTINGS_KEY = "say01-ai-connection-v1";
const REVIEW_INTERVALS = [1, 3, 7, 14, 30];
const DAILY_TARGETS = { 3: 3, 5: 5, 10: 8 };

// 每句只绑定一个“声音—字母—意思”钩子，避免把零基础学习变成整页默写。
const SPELLING_FOCUS = {
  "cafe-1": { word: "get", before: "", gap: "g", after: "et", sound: "GET /ɡet/", clue: "g 发 /g/，后面是 et", options: ["g", "j", "k"] },
  "cafe-2": { word: "coffee", before: "co", gap: "ff", after: "ee", sound: "COF · FEE", clue: "中间双 f，结尾双 e", options: ["ff", "f", "ph"] },
  "cafe-3": { word: "iced", before: "ice", gap: "d", after: "", sound: "ICED /aɪst/", clue: "ice 后面补 d，变成“冰的”", options: ["d", "t", "ed"] },
  "cafe-4": { word: "sugar", before: "su", gap: "g", after: "ar", sound: "SU · GAR", clue: "中间是 g，不是 j", options: ["g", "j", "gg"] },
  "cafe-5": { word: "thank", before: "", gap: "th", after: "ank", sound: "THANK /θæŋk/", clue: "开头 th：舌尖轻碰牙齿", options: ["th", "t", "s"] },
  "travel-1": { word: "station", before: "sta", gap: "tion", after: "", sound: "STA · TION", clue: "结尾 tion 常读 /ʃən/", options: ["tion", "shun", "sion"] },
  "travel-2": { word: "straight", before: "str", gap: "aigh", after: "t", sound: "STRAIGHT /streɪt/", clue: "中间 aigh，最后还有 t", options: ["aigh", "ai", "ei"] },
  "travel-3": { word: "help", before: "he", gap: "l", after: "p", sound: "HELP /help/", clue: "听见 /l/，写一个 l", options: ["l", "ll", "r"] },
  "travel-4": { word: "ticket", before: "tic", gap: "k", after: "et", sound: "TICK · ET", clue: "tic 后再补一个 k", options: ["k", "c", "ck"] },
  "travel-5": { word: "much", before: "mu", gap: "ch", after: "", sound: "MUCH /mʌtʃ/", clue: "结尾 /tʃ/ 写 ch", options: ["ch", "tch", "sh"] },
  "social-1": { word: "hi", before: "", gap: "h", after: "i", sound: "HI /haɪ/", clue: "开头轻轻送气：h", options: ["h", "wh", "j"] },
  "social-2": { word: "meet", before: "m", gap: "ee", after: "t", sound: "MEET /miːt/", clue: "长音 /iː/ 在这里写 ee", options: ["ee", "e", "ea"] },
  "social-3": { word: "where", before: "", gap: "wh", after: "ere", sound: "WHERE /wer/", clue: "问“哪里”，开头是 wh", options: ["wh", "w", "h"] },
  "social-4": { word: "China", before: "Ch", gap: "i", after: "na", sound: "CHI · NA", clue: "Chi 中间是 i", options: ["i", "ai", "e"] },
  "social-5": { word: "English", before: "Eng", gap: "l", after: "ish", sound: "ENG · LISH", clue: "Eng 和 ish 中间连一个 l", options: ["l", "ll", "r"] },
  "shopping-1": { word: "black", before: "bl", gap: "a", after: "ck", sound: "BLACK /blæk/", clue: "中间短音 /æ/ 写 a", options: ["a", "e", "u"] },
  "shopping-2": { word: "size", before: "s", gap: "i", after: "ze", sound: "SIZE /saɪz/", clue: "中间 i 在这里读 /aɪ/", options: ["i", "y", "ai"] },
  "shopping-3": { word: "medium", before: "me", gap: "di", after: "um", sound: "ME · DI · UM", clue: "中间一拍写 di", options: ["di", "de", "dee"] },
  "shopping-4": { word: "much", before: "mu", gap: "ch", after: "", sound: "MUCH /mʌtʃ/", clue: "结尾 /tʃ/ 写 ch", options: ["ch", "tch", "sh"] },
  "shopping-5": { word: "take", before: "t", gap: "a", after: "ke", sound: "TAKE /teɪk/", clue: "a_e 让 a 读自己的名字", options: ["a", "ai", "e"] },
  "work-1": { word: "new", before: "n", gap: "ew", after: "", sound: "NEW /njuː/", clue: "结尾 /uː/ 在这里写 ew", options: ["ew", "oo", "u"] },
  "work-2": { word: "welcome", before: "wel", gap: "come", after: "", sound: "WEL · COME", clue: "wel 后接完整的 come", options: ["come", "cam", "cum"] },
  "work-3": { word: "could", before: "c", gap: "oul", after: "d", sound: "COULD /kʊd/", clue: "看见 oul，但只听到短短一拍", options: ["oul", "oo", "ol"] },
  "work-4": { word: "course", before: "c", gap: "our", after: "se", sound: "COURSE /kɔːrs/", clue: "中间写 our", options: ["our", "or", "oor"] },
  "work-5": { word: "appreciate", before: "ap", gap: "pre", after: "ciate", sound: "AP · PRE · CI · ATE", clue: "ap 后面接 pre", options: ["pre", "pri", "per"] },
  "rescue-1": { word: "sorry", before: "so", gap: "rr", after: "y", sound: "SOR · RY", clue: "中间双 r", options: ["rr", "r", "wr"] },
  "rescue-2": { word: "speak", before: "sp", gap: "ea", after: "k", sound: "SPEAK /spiːk/", clue: "长音 /iː/ 在这里写 ea", options: ["ea", "ee", "e"] },
  "rescue-3": { word: "again", before: "a", gap: "gai", after: "n", sound: "A · GAIN", clue: "中间连写 gai", options: ["gai", "gei", "ga"] },
  "rescue-4": { word: "mean", before: "m", gap: "ea", after: "n", sound: "MEAN /miːn/", clue: "长音 /iː/ 在这里写 ea", options: ["ea", "ee", "e"] },
  "rescue-5": { word: "right", before: "r", gap: "igh", after: "t", sound: "RIGHT /raɪt/", clue: "中间 igh，最后还有 t", options: ["igh", "ai", "ie"] }
};

const scenes = [
  {
    id: "cafe",
    goal: "daily",
    title: "咖啡店点单",
    desc: "从开口到完成点单",
    context: "你走进一家咖啡店，店员准备帮你点单。",
    lines: [
      { id: "cafe-1", speaker: "STAFF", en: "Hi. What can I get for you?", zh: "你好，想要点什么？", pron: "嗨。沃特 看 爱 盖特 佛 优？", rhythm: ["Hi", "what", "can I", "GET", "for you"], when: "店员主动问你需要什么时。", mission: "先只听懂关键词 get 和 you，不必逐字翻译。" },
      { id: "cafe-2", speaker: "YOU", en: "A coffee, please.", zh: "请给我一杯咖啡。", pron: "额 靠菲，普利兹。", rhythm: ["a", "COF-fee", "please"], when: "直接告诉店员你想要的饮品。", mission: "今天买饮料时，在心里完整说一遍这句话。" },
      { id: "cafe-3", speaker: "STAFF", en: "Hot or iced?", zh: "热的还是冰的？", pron: "浩特 奥 爱斯特？", rhythm: ["HOT", "or", "ICED"], when: "店员确认温度时。", mission: "听示范三遍，只抓住 hot 和 iced 两个词。" },
      { id: "cafe-4", speaker: "YOU", en: "Iced, please. No sugar.", zh: "请给我冰的，不要糖。", pron: "爱斯特，普利兹。耨 修格。", rhythm: ["ICED", "please", "no", "SU-gar"], when: "确认冰饮并说明不要糖。", mission: "把 iced 换成 hot，再分别说一遍。" },
      { id: "cafe-5", speaker: "YOU", en: "That's all. Thank you.", zh: "就这些，谢谢。", pron: "再次 奥。三克 优。", rhythm: ["that's", "ALL", "THANK", "you"], when: "点完以后自然结束对话。", mission: "下一次完成任何点单后，尝试用 That's all 收尾。" }
    ]
  },
  {
    id: "travel",
    goal: "travel",
    title: "城市出行",
    desc: "问路、找到车站、买票",
    context: "你在陌生城市找车站，随后需要购买一张票。",
    lines: [
      { id: "travel-1", speaker: "YOU", en: "Excuse me. Where is the station?", zh: "不好意思，车站在哪里？", pron: "依克斯丘兹 米。外尔 依兹 泽 斯得神？", rhythm: ["ex-CUSE me", "WHERE", "is the", "STA-tion"], when: "礼貌地拦住别人问车站位置。", mission: "先练 Excuse me，让开口不再突兀。" },
      { id: "travel-2", speaker: "LOCAL", en: "Go straight.", zh: "一直往前走。", pron: "勾 斯追特。", rhythm: ["GO", "STRAIGHT"], when: "别人给你最常见的直行指示。", mission: "听示范后，用手指向前方并说一遍。" },
      { id: "travel-3", speaker: "YOU", en: "Thank you for your help.", zh: "谢谢你的帮助。", pron: "三克 优 佛 优 海尔普。", rhythm: ["THANK you", "for your", "HELP"], when: "别人帮你指路以后。", mission: "把这句和普通 Thank you 对比着说。" },
      { id: "travel-4", speaker: "YOU", en: "One ticket, please.", zh: "请给我一张票。", pron: "万 提克特，普利兹。", rhythm: ["ONE", "TICK-et", "please"], when: "在人工窗口买一张票。", mission: "把 one 换成 two，练习买两张票。" },
      { id: "travel-5", speaker: "YOU", en: "How much is it?", zh: "多少钱？", pron: "豪 马吃 依兹 依特？", rhythm: ["how MUCH", "is it"], when: "没有看清价格，想确认金额时。", mission: "看到任意商品价格时，先自己问一遍。" }
    ]
  },
  {
    id: "social",
    goal: "social",
    title: "社交破冰",
    desc: "认识新朋友，不让对话停住",
    context: "你在活动现场第一次认识一位新朋友。",
    lines: [
      { id: "social-1", speaker: "YOU", en: "Hi. I'm {name}.", zh: "你好，我是{name}。", pron: "嗨。爱姆 {name}。", rhythm: ["Hi", "I'M", "{name}"], when: "第一次见面，先告诉对方自己的名字。", mission: "换成自己的真实名字，连说三遍。" },
      { id: "social-2", speaker: "OTHER", en: "Nice to meet you.", zh: "很高兴认识你。", pron: "奈斯 图 米特 优。", rhythm: ["NICE", "to", "MEET you"], when: "交换名字以后最自然的回应。", mission: "对着镜子微笑着说一遍，练习表情和声音一起出现。" },
      { id: "social-3", speaker: "YOU", en: "Where are you from?", zh: "你来自哪里？", pron: "外尔 啊 优 弗若姆？", rhythm: ["WHERE", "are you", "FROM"], when: "想继续了解刚认识的人。", mission: "注意 are you 在真实语速里会连得很快。" },
      { id: "social-4", speaker: "OTHER", en: "I'm from China.", zh: "我来自中国。", pron: "爱姆 弗若姆 拆一那。", rhythm: ["I'M", "from", "CHI-na"], when: "别人询问你来自哪里时。", mission: "把 China 换成自己的城市英文名再说一次。" },
      { id: "social-5", speaker: "YOU", en: "I'm learning English.", zh: "我正在学英语。", pron: "爱姆 勒宁 英格利诗。", rhythm: ["I'm", "LEARN-ing", "ENG-lish"], when: "想坦然告诉对方自己还是学习者。", mission: "把它当成允许自己说错的开场白。" }
    ]
  },
  {
    id: "shopping",
    goal: "daily",
    title: "逛店购物",
    desc: "问颜色、尺码和价格",
    context: "你在服装店看到喜欢的款式，准备确认颜色和尺码。",
    lines: [
      { id: "shopping-1", speaker: "YOU", en: "Excuse me. Do you have this in black?", zh: "不好意思，这款有黑色的吗？", pron: "依克斯丘兹 米。度 优 海夫 迪斯 因 布莱克？", rhythm: ["ex-CUSE me", "do you HAVE", "this in", "BLACK"], when: "拿着一件商品询问其他颜色。", mission: "把 black 换成 white，再说一遍。" },
      { id: "shopping-2", speaker: "STAFF", en: "What size do you need?", zh: "你需要什么尺码？", pron: "沃特 赛兹 度 优 尼德？", rhythm: ["what SIZE", "do you", "NEED"], when: "店员继续确认你的尺码。", mission: "只听 size 和 need，也能抓住问题意思。" },
      { id: "shopping-3", speaker: "YOU", en: "Medium, please.", zh: "请给我中码。", pron: "米迪恩，普利兹。", rhythm: ["ME-di-um", "please"], when: "告诉店员你需要中码。", mission: "根据自己需要，把 Medium 换成 Small 或 Large。" },
      { id: "shopping-4", speaker: "YOU", en: "How much is it?", zh: "这个多少钱？", pron: "豪 马吃 依兹 依特？", rhythm: ["how MUCH", "is it"], when: "商品没有明显价格标签时。", mission: "看到喜欢的东西，先自己问价格再看标签。" },
      { id: "shopping-5", speaker: "YOU", en: "I'll take it.", zh: "我要了。", pron: "爱哦 忒克 依特。", rhythm: ["I'll", "TAKE it"], when: "试完以后决定购买。", mission: "把它和 I like it 连起来说：喜欢，然后决定买。" }
    ]
  },
  {
    id: "work",
    goal: "work",
    title: "工作初见",
    desc: "介绍自己、请求帮助、开始协作",
    context: "你第一天加入一个新团队，正在认识同事。",
    lines: [
      { id: "work-1", speaker: "YOU", en: "Hi. I'm {name}. I'm new here.", zh: "你好，我是{name}，我是新来的。", pron: "嗨。爱姆 {name}。爱姆 纽 希尔。", rhythm: ["Hi", "I'm", "{name}", "I'm NEW", "HERE"], when: "第一天进入新团队时做简短介绍。", mission: "把整句分成两口气说，不追求一次说完。" },
      { id: "work-2", speaker: "OTHER", en: "Welcome to the team.", zh: "欢迎加入团队。", pron: "外尔肯 图 泽 提姆。", rhythm: ["WEL-come", "to the", "TEAM"], when: "同事欢迎你加入时。", mission: "听到 welcome 就知道对方在表达欢迎。" },
      { id: "work-3", speaker: "YOU", en: "Could you help me?", zh: "你可以帮我一下吗？", pron: "库德 优 海尔普 米？", rhythm: ["could you", "HELP me"], when: "需要同事帮你完成一件事。", mission: "先说 Excuse me，再接这句话。" },
      { id: "work-4", speaker: "OTHER", en: "Of course.", zh: "当然可以。", pron: "额夫 阔斯。", rhythm: ["of COURSE"], when: "对方表示愿意帮忙。", mission: "把它当成 Yes 的更自然替代。" },
      { id: "work-5", speaker: "YOU", en: "Thank you. I appreciate it.", zh: "谢谢，我很感谢。", pron: "三克 优。爱 额普瑞西诶特 依特。", rhythm: ["THANK you", "I ap-PRE-ci-ate it"], when: "别人真正帮到你以后表达感谢。", mission: "先掌握 Thank you，后半句慢慢跟读即可。" }
    ]
  },
  {
    id: "rescue",
    goal: "daily",
    title: "听不懂时",
    desc: "让对话慢下来，而不是沉默",
    context: "对方说得太快，你需要礼貌地争取理解时间。",
    lines: [
      { id: "rescue-1", speaker: "YOU", en: "Sorry. I don't understand.", zh: "不好意思，我没听懂。", pron: "骚瑞。爱 冬特 安德斯坦德。", rhythm: ["SOR-ry", "I don't", "un-der-STAND"], when: "完全没有理解对方的意思。", mission: "说不懂不是失败，而是在继续对话；大声说一遍。" },
      { id: "rescue-2", speaker: "YOU", en: "Please speak slowly.", zh: "请说慢一点。", pron: "普利兹 斯比克 斯洛利。", rhythm: ["please", "SPEAK", "SLOW-ly"], when: "知道对方在说什么，但语速太快。", mission: "把 slowly 拉长一点说，帮助对方理解你的需求。" },
      { id: "rescue-3", speaker: "YOU", en: "Can you say that again?", zh: "你能再说一遍吗？", pron: "看 优 塞 载特 额根？", rhythm: ["can you", "SAY that", "a-GAIN"], when: "想请对方完整重复一遍。", mission: "跟着示范把 can you 连起来读。" },
      { id: "rescue-4", speaker: "OTHER", en: "Do you mean this?", zh: "你的意思是这个吗？", pron: "度 优 明 迪斯？", rhythm: ["do you", "MEAN", "THIS"], when: "对方尝试确认你的意思。", mission: "抓住 mean 这个表示“意思是”的词。" },
      { id: "rescue-5", speaker: "YOU", en: "Yes. That's right.", zh: "是的，没错。", pron: "耶斯。再次 赖特。", rhythm: ["YES", "that's", "RIGHT"], when: "对方终于理解正确时。", mission: "点头并说完整句，让声音和动作一起形成记忆。" }
    ]
  }
];

const courseOrders = {
  daily: ["cafe", "shopping", "social", "rescue", "travel", "work"],
  travel: ["travel", "rescue", "cafe", "social", "shopping", "work"],
  social: ["social", "cafe", "rescue", "shopping", "travel", "work"],
  work: ["work", "social", "rescue", "cafe", "travel", "shopping"]
};

const legacyEnglish = [
  ["Hi.", "Hello.", "Good morning.", "See you."],
  ["My name is Alex.", "Nice to meet you.", "Where are you from?", "I am from China."],
  ["A coffee, please.", "I want water.", "No sugar, please.", "Thank you."],
  ["Where is the station?", "One ticket, please.", "I need help.", "How much is it?"],
  ["I like this.", "Do you have black?", "Too expensive.", "I will take it."],
  ["Sorry.", "I do not understand.", "Please speak slowly.", "Can you say that again?"]
];

const $ = id => document.getElementById(id);
const allPhraseRefs = () => scenes.flatMap(scene => scene.lines.map((line, index) => ({ scene, line, index })));
const phraseRefById = id => allPhraseRefs().find(ref => ref.line.id === id);
const sceneById = id => scenes.find(scene => scene.id === id);

function isNativeAndroid() {
  return window.Capacitor?.getPlatform?.() === "android";
}

function localDateKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function parseLocalDate(key) {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d, 12);
}

function addDays(key, count) {
  const date = parseLocalDate(key);
  date.setDate(date.getDate() + count);
  return localDateKey(date);
}

function emptyState() {
  return {
    schema: APP_VERSION,
    profile: null,
    known: [],
    learnedAt: {},
    reviews: {},
    spelling: {},
    aiMemories: [],
    best: 0,
    days: [],
    todayKnown: {},
    rate: .68,
    metrics: { openings: 0, audioPlays: 0, recordings: 0, comparisons: 0, recognitions: 0, roleplays: 0, reviewAnswers: 0, quizzes: 0, spellingAttempts: 0, spellingWins: 0, aiSessions: 0, aiTurns: 0, aiReviews: 0, activeDates: [] },
    migrations: []
  };
}

function cleanName(value) {
  return String(value || "").replace(/[<>&"']/g, "").trim().slice(0, 18);
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"]/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[character]));
}

function sanitizeState(raw) {
  const base = emptyState();
  const merged = Object.assign(base, raw || {});
  merged.known = Array.isArray(merged.known) ? [...new Set(merged.known.filter(id => phraseRefById(id)))] : [];
  merged.days = Array.isArray(merged.days) ? [...new Set(merged.days)] : [];
  const validIds = new Set(allPhraseRefs().map(ref => ref.line.id));
  merged.learnedAt = Object.fromEntries(Object.entries(merged.learnedAt && typeof merged.learnedAt === "object" ? merged.learnedAt : {}).filter(([id, date]) => validIds.has(id) && /^\d{4}-\d{2}-\d{2}$/.test(date)));
  merged.reviews = Object.fromEntries(Object.entries(merged.reviews && typeof merged.reviews === "object" ? merged.reviews : {}).filter(([id, review]) => validIds.has(id) && review && /^\d{4}-\d{2}-\d{2}$/.test(review.due || "")).map(([id, review]) => [id, { level: Math.max(0, Math.min(4, Number(review.level) || 0)), due: review.due, successes: Math.max(0, Number(review.successes) || 0), lapses: Math.max(0, Number(review.lapses) || 0), lastMs: Math.max(0, Number(review.lastMs) || 0) }]));
  merged.spelling = Object.fromEntries(Object.entries(merged.spelling && typeof merged.spelling === "object" ? merged.spelling : {}).filter(([id]) => validIds.has(id)).map(([id, item]) => [id, { wins: Math.max(0, Math.min(99, Number(item?.wins) || 0)), attempts: Math.max(0, Math.min(999, Number(item?.attempts) || 0)), lastSeen: /^\d{4}-\d{2}-\d{2}$/.test(item?.lastSeen || "") ? item.lastSeen : localDateKey() }]));
  merged.aiMemories = (Array.isArray(merged.aiMemories) ? merged.aiMemories : []).slice(-30).map(item => ({
    id: String(item?.id || `ai-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`).slice(0, 80),
    en: String(item?.en || "").replace(/[<>]/g, "").trim().slice(0, 140),
    zh: String(item?.zh || "").replace(/[<>]/g, "").trim().slice(0, 180),
    sceneId: sceneById(item?.sceneId) ? item.sceneId : "social",
    level: Math.max(0, Math.min(4, Number(item?.level) || 0)),
    due: /^\d{4}-\d{2}-\d{2}$/.test(item?.due || "") ? item.due : addDays(localDateKey(), 1),
    createdAt: /^\d{4}-\d{2}-\d{2}$/.test(item?.createdAt || "") ? item.createdAt : localDateKey()
  })).filter(item => item.en);
  merged.todayKnown = Object.fromEntries(Object.entries(merged.todayKnown && typeof merged.todayKnown === "object" ? merged.todayKnown : {}).filter(([date, ids]) => /^\d{4}-\d{2}-\d{2}$/.test(date) && Array.isArray(ids)).map(([date, ids]) => [date, [...new Set(ids.filter(id => validIds.has(id)))]]));
  merged.metrics = Object.assign(emptyState().metrics, merged.metrics || {});
  merged.metrics.activeDates = Array.isArray(merged.metrics.activeDates) ? [...new Set(merged.metrics.activeDates)] : [];
  ["openings", "audioPlays", "recordings", "comparisons", "recognitions", "roleplays", "reviewAnswers", "quizzes", "spellingAttempts", "spellingWins", "aiSessions", "aiTurns", "aiReviews"].forEach(key => { merged.metrics[key] = Math.max(0, Math.min(1000000, Number(merged.metrics[key]) || 0)); });
  merged.migrations = Array.isArray(merged.migrations) ? merged.migrations.slice(-20) : [];
  if (merged.profile) {
    merged.profile.name = cleanName(merged.profile.name) || "Alex";
    merged.profile.goal = courseOrders[merged.profile.goal] ? merged.profile.goal : "daily";
    merged.profile.minutes = [3, 5, 10].includes(Number(merged.profile.minutes)) ? Number(merged.profile.minutes) : 5;
  }
  merged.known.forEach(id => {
    if (!merged.learnedAt[id]) merged.learnedAt[id] = localDateKey();
    if (!merged.reviews[id]) merged.reviews[id] = { level: 0, due: addDays(localDateKey(), 1) };
  });
  return merged;
}

function migrateLegacy() {
  try {
    const legacy = JSON.parse(localStorage.getItem(LEGACY_KEY));
    if (!legacy) return null;
    const next = emptyState();
    next.profile = { name: "Alex", goal: "daily", minutes: 5 };
    next.best = Number(legacy.best || 0);
    next.rate = Number(legacy.rate || .68);
    next.migrations.push({ from: "v1", to: APP_VERSION, date: localDateKey() });
    (legacy.known || []).forEach(oldId => {
      const [sceneIndex, phraseIndex] = oldId.split("-").map(Number);
      const oldEnglish = legacyEnglish[sceneIndex]?.[phraseIndex];
      if (!oldEnglish) return;
      const normalized = oldEnglish.replace("I am ", "I'm ").replace("I will ", "I'll ");
      const match = allPhraseRefs().find(ref => ref.line.en === oldEnglish || ref.line.en === normalized || ref.line.en.includes(oldEnglish.replace(/\.$/, "")));
      if (match && !next.known.includes(match.line.id)) next.known.push(match.line.id);
    });
    return sanitizeState(next);
  } catch { return null; }
}

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved) return sanitizeState(saved);
  } catch {}
  return migrateLegacy() || emptyState();
}

let state = loadState();
let currentSceneId = scenes[0].id;
let currentPhraseIndex = 0;
let quizItems = [];
let quizIndex = 0;
let quizScore = 0;
let quizLocked = false;
let reviewedThisQuiz = new Set();
let selectedWords = [];
let mediaRecorder = null;
let mediaStream = null;
let recordingChunks = [];
let recordingUrl = null;
let activeOriginalAudio = null;
let questionStartedAt = 0;
let roleSceneId = null;
let roleIndex = 0;
let roleRecorder = null;
let roleStream = null;
let roleChunks = [];
let roleUrls = new Map();
let roleReplaying = false;
let roleCompletedLogged = false;
let aiConnectionManaged = false;
let nativeAiConfigPromise = null;
let aiSettings = loadAiSettings();
let aiSceneId = null;
let aiHistory = [];
let aiTurnCount = 0;
let aiLastResult = null;
let aiBusy = false;
let aiRecognition = null;
let activeAiAudio = null;
let aiVoiceAvailable = null;
let currentAiReviewId = null;
let deferredInstall = null;
let toastTimer = null;

function saveState(render = true) {
  state.schema = APP_VERSION;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  if (render) updateAll();
}

function displayText(text) {
  const name = state.profile?.name || "Alex";
  return String(text).replaceAll("{name}", name);
}

function shuffled(values) {
  const copy = [...values];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function spellingFocus(ref) {
  return SPELLING_FOCUS[ref?.line?.id] || null;
}

function spellingMask(focus, complete = false) {
  if (!focus) return "";
  const gap = complete ? focus.gap : "_".repeat(Math.max(1, focus.gap.length));
  return `${focus.before}${gap}${focus.after}`;
}

function spellingWordCount() {
  return Object.values(state.spelling || {}).filter(item => item.wins > 0).length;
}

function recordSpelling(ref, correct) {
  const current = state.spelling[ref.line.id] || { wins: 0, attempts: 0, lastSeen: localDateKey() };
  state.spelling[ref.line.id] = {
    wins: Math.min(99, current.wins + (correct ? 1 : 0)),
    attempts: current.attempts + 1,
    lastSeen: localDateKey()
  };
  state.metrics.spellingAttempts++;
  if (correct) state.metrics.spellingWins++;
}

function orderedScenes() {
  const order = courseOrders[state.profile?.goal || "daily"];
  return order.map(sceneById);
}

function completedSceneCount() {
  return scenes.filter(scene => scene.lines.every(line => state.known.includes(line.id))).length;
}

function dailyGoal() { return DAILY_TARGETS[state.profile?.minutes || 5] || 5; }

function dueRefs() {
  const today = localDateKey();
  return state.known.map(phraseRefById).filter(Boolean).filter(ref => (state.reviews[ref.line.id]?.due || today) <= today);
}

function nextReviewLabel() {
  const today = localDateKey();
  const future = [...Object.values(state.reviews).map(item => item?.due), ...(state.aiMemories || []).map(item => item?.due)].filter(date => date && date > today).sort()[0];
  if (!future) return "—";
  const diff = Math.round((parseLocalDate(future) - parseLocalDate(today)) / 86400000);
  return diff === 1 ? "明天" : `${diff}天后`;
}

function weekStartKey() {
  const date = new Date();
  const day = date.getDay() || 7;
  date.setDate(date.getDate() - day + 1);
  return localDateKey(date);
}

function weeklyKnownCount() {
  const start = weekStartKey();
  return Object.values(state.learnedAt).filter(date => date >= start && date <= localDateKey()).length;
}

function streakCount() {
  const active = new Set(state.days);
  let date = new Date();
  let count = 0;
  for (let i = 0; i < 365; i++) {
    const key = localDateKey(date);
    if (active.has(key)) count++;
    else if (i !== 0) break;
    date.setDate(date.getDate() - 1);
  }
  return count;
}

function nextPhraseRef() {
  for (const scene of orderedScenes()) {
    const index = scene.lines.findIndex(line => !state.known.includes(line.id));
    if (index >= 0) return { scene, line: scene.lines[index], index };
  }
  return dueRefs()[0] || { scene: orderedScenes()[0], line: orderedScenes()[0].lines[0], index: 0 };
}

function registerLearned(id) {
  const today = localDateKey();
  state.todayKnown[today] = state.todayKnown[today] || [];
  if (!state.todayKnown[today].includes(id)) state.todayKnown[today].push(id);
  if (!state.days.includes(today)) state.days.push(today);
  if (!state.metrics.activeDates.includes(today)) state.metrics.activeDates.push(today);
}

function updateAll() {
  const today = localDateKey();
  const todayCount = state.todayKnown[today]?.length || 0;
  const target = dailyGoal();
  const due = dueRefs().length + dueAiMemories().length;
  const weekCount = weeklyKnownCount();
  const next = nextPhraseRef();
  const nextIncompleteScene = orderedScenes().find(scene => !scene.lines.every(line => state.known.includes(line.id))) || orderedScenes()[0];

  $("streakCount").textContent = streakCount();
  $("minutesLabel").textContent = `${state.profile?.minutes || 5} MIN`;
  $("missionNumber").textContent = String(state.known.length + 1).padStart(2, "0");
  $("heroEnglish").textContent = displayText(next.line.en);
  $("heroChinese").textContent = displayText(next.line.zh);
  const nextSpell = spellingFocus(next);
  $("heroSpellEcho").textContent = nextSpell ? `WORD ECHO · ${spellingMask(nextSpell)}` : "WORD ECHO · SAY IT";
  $("continueBtn").dataset.scene = next.scene.id;
  $("continueBtn").dataset.phrase = next.index;
  $("continueBtn").textContent = state.known.length ? "继续今天的练习 →" : "第一步 · 点这里开始 →";
  $("dailyGoalLabel").textContent = `目标 ${target} 句`;
  $("todayProgressText").textContent = `${Math.min(todayCount, target)} / ${target}`;
  $("todayProgressFill").style.width = `${Math.min(todayCount / target * 100, 100)}%`;
  $("dueCount").textContent = due;
  $("weekKnown").textContent = weekCount;
  $("quizBest").textContent = state.best ? `${state.best}/5` : "—";
  renderWeekDots(weekCount);
  $("weeklyCopy").textContent = weekCount >= 12 ? "本周目标完成。把其中一句真正用出去。" : `再拿下 ${12 - weekCount} 句，形成本周表达库存。`;
  $("nextSceneNumber").textContent = String(orderedScenes().indexOf(nextIncompleteScene) + 1).padStart(2, "0");
  $("nextSceneTitle").textContent = nextIncompleteScene.title;
  $("nextSceneDesc").textContent = nextIncompleteScene.desc;
  $("nextSceneBtn").dataset.scene = nextIncompleteScene.id;

  $("reviewDueLarge").textContent = due;
  $("reviewKnownLarge").textContent = state.known.length;
  $("reviewNextLarge").textContent = nextReviewLabel();
  $("profileKnown").textContent = state.known.length;
  $("profileDone").textContent = completedSceneCount();
  $("profileSpelling").textContent = spellingWordCount();
  $("profileReview").textContent = state.metrics.reviewAnswers;
  $("profileRecordings").textContent = state.metrics.recordings;
  $("localMetrics").textContent = `本机打开 ${state.metrics.openings} 次 · 播放示范 ${state.metrics.audioPlays} 次 · 完成跟读 ${state.metrics.recordings} 次 · 拼写补全 ${state.metrics.spellingWins} 次 · 对比练习 ${state.metrics.comparisons} 次 · 完整角色扮演 ${state.metrics.roleplays} 次 · AI 陪练 ${state.metrics.aiTurns} 回合 · AI 回声 ${state.metrics.aiReviews} 次 · 完成记忆检查 ${state.metrics.quizzes} 轮 · 有学习记录 ${state.metrics.activeDates.length} 天`;

  if (state.profile) {
    $("profileName").value = state.profile.name;
    $("goalSelect").value = state.profile.goal;
    $("minutesSelect").value = String(state.profile.minutes);
  }
  $("rateSelect").value = String(state.rate || .68);
  renderAiMemoryReview();
  renderAiConnectionStatus();
  renderLessonList();
}

function renderWeekDots(count) {
  $("weekDots").innerHTML = Array.from({ length: 12 }, (_, index) => `<span class="week-dot ${index < count ? "filled" : ""}" aria-hidden="true"></span>`).join("");
  $("weekDots").setAttribute("aria-label", `本周已拿下 ${count} 句，目标 12 句`);
}

function showView(name) {
  cleanupRecording();
  document.querySelectorAll(".view").forEach(view => view.classList.remove("active"));
  $(`${name}View`).classList.add("active");
  document.querySelectorAll(".nav-button").forEach(button => button.classList.toggle("active", button.dataset.view === name));
  if (name === "lessons" && $("lessonShell").hidden) showLessonIndex();
  if (name === "practice") updateAll();
  window.scrollTo({ top: 0, behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
}

function renderLessonList() {
  $("lessonList").innerHTML = orderedScenes().map((scene, orderIndex) => {
    const learned = scene.lines.filter(line => state.known.includes(line.id)).length;
    const done = learned === scene.lines.length;
    return `<button class="lesson-card ${done ? "done" : ""}" type="button" data-scene="${scene.id}"><span class="lesson-icon">${done ? "✓" : String(orderIndex + 1).padStart(2, "0")}</span><span><h3>${scene.title}</h3><p>${scene.desc} · ${learned}/${scene.lines.length} 句</p></span><span class="lesson-status">${done ? "✓" : "›"}</span></button>`;
  }).join("");
  $("lessonList").querySelectorAll(".lesson-card").forEach(button => button.addEventListener("click", () => openScene(button.dataset.scene, 0)));
}

function showLessonIndex() {
  cleanupRecording();
  $("lessonIndex").hidden = false;
  $("lessonShell").hidden = true;
  renderLessonList();
}

function openScene(sceneId, phraseIndex = 0) {
  currentSceneId = sceneId;
  currentPhraseIndex = Math.max(0, Math.min(Number(phraseIndex), sceneById(sceneId).lines.length - 1));
  showView("lessons");
  $("lessonIndex").hidden = true;
  $("lessonShell").hidden = false;
  renderPhrase();
}

function renderPhrase() {
  cleanupRecording();
  const scene = sceneById(currentSceneId);
  const line = scene.lines[currentPhraseIndex];
  $("lessonNumber").textContent = `SCENE ${String(orderedScenes().indexOf(scene) + 1).padStart(2, "0")}`;
  $("lessonName").textContent = scene.title;
  $("lessonStep").textContent = `${currentPhraseIndex + 1} / ${scene.lines.length}`;
  $("lessonContext").textContent = scene.context;
  $("speakerBadge").textContent = line.speaker;
  $("phraseIndex").textContent = `LINE ${String(currentPhraseIndex + 1).padStart(2, "0")}`;
  $("phraseEnglish").textContent = displayText(line.en);
  $("phraseChinese").textContent = displayText(line.zh);
  $("phrasePronounce").textContent = `近似音：${displayText(line.pron)}`;
  $("phraseRhythm").innerHTML = line.rhythm.map(part => `<span class="${/[A-Z]{2}/.test(part) ? "stress" : ""}">${escapeHtml(displayText(part))}</span>`).join("");
  $("phraseWhen").textContent = line.when;
  $("phraseMission").textContent = line.mission;
  $("prevPhrase").textContent = currentPhraseIndex ? "← 上一句" : "← 场景表";
  $("knownBtn").textContent = state.known.includes(line.id) ? "已拿下 · 下一句 →" : "拿下这句 · 下一句 →";
  $("audioStatus").textContent = ["social-1", "work-1"].includes(line.id) ? "示范会在名字处停一下，轮到你说自己的名字" : "等待播放";
  $("pronunciationDetails").open = false;
  renderSpelling({ scene, line, index: currentPhraseIndex });
  renderTranscript(scene);
}

function renderSpelling(ref) {
  const focus = spellingFocus(ref);
  if (!focus) { $("spellLock").hidden = true; return; }
  $("spellLock").hidden = false;
  const memory = state.spelling[ref.line.id] || { wins: 0 };
  $("spellLevel").textContent = memory.wins ? `已经撞见 ${memory.wins + 1} 次` : "第 1 次遇见";
  $("spellWord").innerHTML = `<span>${escapeHtml(focus.before)}</span><b>${"_".repeat(Math.max(1, focus.gap.length))}</b><span>${escapeHtml(focus.after)}</span>`;
  $("spellWord").classList.remove("locked");
  $("spellClue").textContent = memory.wins >= 2 ? `${focus.sound} · 先靠声音选` : `${focus.sound} · ${focus.clue}`;
  $("spellAudioStatus").textContent = "点粉色播放键，听清关键词再选";
  $("spellResult").textContent = "";
  $("spellOptions").innerHTML = shuffled(focus.options).map(option => `<button type="button" data-spell-option="${escapeHtml(option)}">${escapeHtml(option)}</button>`).join("");
  $("spellOptions").querySelectorAll("[data-spell-option]").forEach(button => button.addEventListener("click", () => answerSpelling(ref, button)));
}

function answerSpelling(ref, button) {
  const focus = spellingFocus(ref);
  if (!focus || button.disabled) return;
  const correct = button.dataset.spellOption === focus.gap;
  recordSpelling(ref, correct);
  if (!correct) {
    button.disabled = true;
    button.classList.add("wrong");
    $("spellResult").textContent = "差一点。再听一次声音，换一块。";
    $("spellAudioStatus").textContent = "再点一次播放键，重点听缺失的声音";
    saveState(false);
    return;
  }
  $("spellOptions").querySelectorAll("button").forEach(option => { option.disabled = true; option.classList.toggle("correct", option === button); });
  $("spellWord").textContent = focus.word;
  $("spellWord").classList.add("locked");
  $("spellResult").textContent = `锁住了。现在把 ${focus.word} 放回整句，大声说一遍。`;
  playSpellingWord(ref);
  saveState(false);
}

function renderTranscript(scene) {
  $("dialogueTranscript").innerHTML = scene.lines.map((line, index) => `<button class="dialogue-line ${index === currentPhraseIndex ? "active" : ""}" type="button" data-index="${index}"><span>${line.speaker}</span><span><strong lang="en">${escapeHtml(displayText(line.en))}</strong><small>${escapeHtml(displayText(line.zh))}</small></span></button>`).join("");
  $("dialogueTranscript").querySelectorAll(".dialogue-line").forEach(button => button.addEventListener("click", () => { currentPhraseIndex = Number(button.dataset.index); renderPhrase(); }));
}

function selectVoice() {
  const voices = speechSynthesis.getVoices();
  return voices.find(voice => /^en(-|_)/i.test(voice.lang) && /Ava|Emma|Jenny|Aria|Samantha|Google US English/i.test(voice.name)) || voices.find(voice => /^en(-|_)/i.test(voice.lang)) || null;
}

function bundledAudioPath(line) {
  return `audio/${line.id}.m4a`;
}

function bundledSpellingAudioPath(line) {
  return `audio/word-${line.id}.m4a`;
}

function nativeAudioPlugin() {
  return isNativeAndroid() ? window.Capacitor?.Plugins?.SayAudio : null;
}

function speakTextPromise(text, rate = .78) {
  return new Promise(resolve => {
    if (!("speechSynthesis" in window)) { resolve(false); return; }
    let settled = false;
    const finish = success => { if (settled) return; settled = true; clearTimeout(timer); resolve(success); };
    const timer = setTimeout(() => finish(false), Math.max(3500, String(text).length * 180));
    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(displayText(text));
    utterance.lang = "en-US";
    utterance.rate = rate;
    utterance.voice = selectVoice();
    utterance.onend = () => finish(true);
    utterance.onerror = () => finish(false);
    speechSynthesis.speak(utterance);
  });
}

function playAudioUrl(url, rate = 1) {
  return new Promise(resolve => {
    const audio = new Audio(new URL(url, document.baseURI).href);
    activeOriginalAudio?.pause();
    activeOriginalAudio = audio;
    audio.preload = "auto";
    audio.muted = false;
    audio.volume = 1;
    audio.playbackRate = rate;
    let settled = false;
    const finish = success => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (activeOriginalAudio === audio) activeOriginalAudio = null;
      resolve(success);
    };
    const timer = setTimeout(() => finish(false), 10000);
    audio.onended = () => finish(true);
    audio.onerror = () => finish(false);
    audio.load();
    audio.play().catch(() => finish(false));
  });
}

async function playNativeBundledAudio(path, rate) {
  const plugin = nativeAudioPlugin();
  if (!plugin) return false;
  try {
    const result = await plugin.play({ file: path.split("/").pop(), rate });
    return result?.ok !== false;
  } catch {
    return false;
  }
}

async function playOriginal(ref, rate = 1, countMetric = false) {
  const path = bundledAudioPath(ref.line);
  let played = path ? await playNativeBundledAudio(path, rate) : false;
  if (!played && path) played = await playAudioUrl(path, rate);
  if (!played) played = await speakTextPromise(ref.line.en, rate < .8 ? .62 : .9);
  if (countMetric) {
    state.metrics.audioPlays++;
    saveState(false);
  }
  return played;
}

async function speakCurrent(rate) {
  const scene = sceneById(currentSceneId);
  const ref = { scene, line: scene.lines[currentPhraseIndex], index: currentPhraseIndex };
  const controls = [$("lessonStartAudio"), $("slowSoundBtn"), $("normalSoundBtn")];
  controls.forEach(button => { button.disabled = true; button.classList.add("is-playing"); });
  $("audioStatus").textContent = "🔊 正在播放…如果没听到，请先按手机侧边音量＋";
  const played = await playOriginal(ref, rate, true);
  controls.forEach(button => { button.disabled = false; button.classList.remove("is-playing"); });
  $("audioStatus").textContent = played ? "播放完成。没听到？按手机侧边音量＋后再点一次。" : "播放失败。请确认媒体音量已打开，再重试。";
  if (!played) toast("音频播放失败，请截图这一页发给我。");
}

async function playSpellingAudio(ref) {
  const focus = spellingFocus(ref);
  if (!focus) return false;
  const path = bundledSpellingAudioPath(ref.line);
  let played = await playNativeBundledAudio(path, 1);
  if (!played) played = await playAudioUrl(path, 1);
  if (!played) played = await speakTextPromise(focus.word, .76);
  return played;
}

async function playSpellingWord(ref) {
  const focus = spellingFocus(ref);
  if (!focus) return false;
  const button = $("spellHearBtn");
  button.disabled = true;
  button.classList.add("is-playing");
  $("spellAudioStatus").textContent = `🔊 正在播放 ${focus.word}…`;
  const played = await playSpellingAudio(ref);
  button.disabled = false;
  button.classList.remove("is-playing");
  $("spellAudioStatus").textContent = played ? `听到了：${focus.word} · 现在补回字母` : "播放失败，请先把媒体音量调高后再试";
  if (!played) toast("关键词音频播放失败，请截图这一页发给我。");
  return played;
}

function speakCurrentSpellingWord() {
  const scene = sceneById(currentSceneId);
  const ref = { scene, line: scene.lines[currentPhraseIndex], index: currentPhraseIndex };
  playSpellingWord(ref);
}

function speakText(text, rate = .78) {
  if (!("speechSynthesis" in window)) return;
  speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(displayText(text));
  utterance.lang = "en-US";
  utterance.rate = rate;
  utterance.voice = selectVoice();
  speechSynthesis.speak(utterance);
}

async function toggleRecording() {
  if (mediaRecorder?.state === "recording") { mediaRecorder.stop(); return; }
  if (!navigator.mediaDevices?.getUserMedia || !("MediaRecorder" in window)) {
    toast("当前浏览器不支持本地录音，请用新版 Safari 或 Chrome。");
    return;
  }
  try {
    cleanupRecording();
    mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    recordingChunks = [];
    mediaRecorder = new MediaRecorder(mediaStream);
    mediaRecorder.ondataavailable = event => { if (event.data.size) recordingChunks.push(event.data); };
    mediaRecorder.onstop = finishRecording;
    mediaRecorder.start();
    $("recordBtn").classList.add("recording");
    $("recordBtn").textContent = "■ 停止录音";
    $("recordStatus").textContent = "正在录音…";
  } catch (error) {
    $("recordStatus").textContent = "没有获得麦克风权限";
    toast("需要允许麦克风，录音才会开始；声音不会上传。");
  }
}

function finishRecording() {
  const mime = mediaRecorder?.mimeType || "audio/webm";
  const blob = new Blob(recordingChunks, { type: mime });
  if (recordingUrl) URL.revokeObjectURL(recordingUrl);
  recordingUrl = URL.createObjectURL(blob);
  $("recordingPlayback").src = recordingUrl;
  $("recordingPlayback").hidden = false;
  $("recordBtn").classList.remove("recording");
  $("recordBtn").textContent = "● 重新录一遍";
  $("recordStatus").textContent = "已完成，可以对比示范";
  $("compareBtn").hidden = false;
  $("recordingGrade").hidden = false;
  mediaStream?.getTracks().forEach(track => track.stop());
  mediaStream = null;
  mediaRecorder = null;
  state.metrics.recordings++;
  if (!state.metrics.activeDates.includes(localDateKey())) state.metrics.activeDates.push(localDateKey());
  saveState();
}

function cleanupRecording() {
  if (mediaRecorder?.state === "recording") {
    mediaRecorder.ondataavailable = null;
    mediaRecorder.onstop = null;
    mediaRecorder.stop();
  }
  mediaStream?.getTracks().forEach(track => track.stop());
  mediaStream = null;
  mediaRecorder = null;
  recordingChunks = [];
  if (recordingUrl) URL.revokeObjectURL(recordingUrl);
  recordingUrl = null;
  if ($("recordingPlayback")) {
    $("recordingPlayback").pause();
    $("recordingPlayback").removeAttribute("src");
    $("recordingPlayback").hidden = true;
    $("recordBtn").classList.remove("recording");
    $("recordBtn").textContent = "● 开始录音";
    $("recordStatus").textContent = "等待跟读";
    $("compareBtn").hidden = true;
    $("recordingGrade").hidden = true;
    $("recognitionResult").textContent = "识别不是发音评分；部分浏览器可能使用系统在线语音服务。";
  }
}

function playElementOnce(element) {
  return new Promise(resolve => {
    element.currentTime = 0;
    element.onended = resolve;
    element.onerror = resolve;
    element.play().catch(resolve);
  });
}

async function compareRecording() {
  if (!recordingUrl) return;
  $("compareBtn").disabled = true;
  $("recordStatus").textContent = "示范…";
  const scene = sceneById(currentSceneId);
  const ref = { scene, line: scene.lines[currentPhraseIndex], index: currentPhraseIndex };
  await playOriginal(ref, 1);
  $("recordStatus").textContent = "我的录音…";
  await playElementOnce($("recordingPlayback"));
  $("recordStatus").textContent = "再听示范…";
  await playOriginal(ref, 1);
  $("recordStatus").textContent = "对比完成，自己判断是否更接近。";
  $("compareBtn").disabled = false;
  state.metrics.comparisons++;
  saveState();
}

function gradeRecording(value) {
  const line = sceneById(currentSceneId).lines[currentPhraseIndex];
  if (state.known.includes(line.id)) {
    const review = state.reviews[line.id] || { level: 0, due: addDays(localDateKey(), 1) };
    if (value === "again") review.due = addDays(localDateKey(), 1);
    review.selfGrade = value;
    state.reviews[line.id] = review;
    saveState();
  }
  toast(value === "again" ? "已安排明天再练，不需要现在硬撑。" : "很好，保留自己的判断，不使用虚假分数。");
}

function startSpeechRecognition() {
  const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!Recognition) {
    $("recognitionResult").textContent = "当前浏览器不支持语音识别；录音和回放仍可正常使用。";
    return;
  }
  const recognition = new Recognition();
  recognition.lang = "en-US";
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;
  $("recognitionResult").textContent = "正在听…请说当前英文句子。";
  recognition.onresult = event => {
    const result = event.results[0][0].transcript;
    $("recognitionResult").textContent = `浏览器听到：${result}。这只是识别结果，不是发音分数。`;
    state.metrics.recognitions++;
    saveState(false);
  };
  recognition.onerror = event => {
    $("recognitionResult").textContent = event.error === "not-allowed" ? "没有获得麦克风权限，识别未开始。" : "这次没有识别清楚，可以继续使用录音回放。";
  };
  recognition.start();
}

function markCurrentKnown() {
  const scene = sceneById(currentSceneId);
  const line = scene.lines[currentPhraseIndex];
  if (!state.known.includes(line.id)) {
    state.known.push(line.id);
    state.learnedAt[line.id] = localDateKey();
    state.reviews[line.id] = { level: 0, due: addDays(localDateKey(), 1) };
    registerLearned(line.id);
    saveState();
    toast("已进入表达库存。明天会第一次复习。");
  }
  if (currentPhraseIndex < scene.lines.length - 1) {
    currentPhraseIndex++;
    renderPhrase();
  } else {
    toast("这个真实场景已经走完。找机会用出一句。");
    showLessonIndex();
  }
}

function openRoleplay() {
  cleanupRecording();
  cleanupRoleplay(false);
  roleSceneId = currentSceneId;
  roleIndex = 0;
  roleUrls = new Map();
  roleCompletedLogged = false;
  $("roleplayOverlay").hidden = false;
  $("app").inert = true;
  $("app").setAttribute("aria-hidden", "true");
  document.body.classList.add("modal-open");
  $("roleplayStage").hidden = false;
  $("roleplayEnd").hidden = true;
  renderRoleplayLine(true);
}

function renderRoleplayLine(autoPlayPartner = false) {
  const scene = sceneById(roleSceneId);
  if (roleIndex >= scene.lines.length) { finishRoleplay(); return; }
  const line = scene.lines[roleIndex];
  const userTurn = line.speaker === "YOU";
  $("roleplayFill").style.width = `${roleIndex / scene.lines.length * 100}%`;
  $("roleSpeaker").textContent = line.speaker;
  $("roleplayTitle").textContent = scene.title;
  $("roleCue").textContent = userTurn ? "轮到你回答。先自己说，需要时再看英文提示。" : "先听对方说什么，再继续。";
  $("roleEnglish").textContent = displayText(line.en);
  $("roleEnglish").classList.toggle("concealed", userTurn);
  $("roleEnglish").setAttribute("aria-hidden", userTurn ? "true" : "false");
  $("roleChinese").textContent = displayText(line.zh);
  const focus = spellingFocus({ scene, line, index: roleIndex });
  $("roleSpellCue").hidden = !userTurn || !focus;
  $("roleSpellCue").textContent = focus ? `MEMORY ECHO · ${spellingMask(focus)}` : "";
  $("rolePlayBtn").hidden = false;
  $("rolePlayBtn").textContent = userTurn ? "▶ 听示范" : "▶ 播放对方";
  $("roleHintBtn").hidden = !userTurn;
  $("roleRecordBtn").hidden = !userTurn;
  $("roleRecordBtn").classList.remove("recording");
  $("roleRecordBtn").textContent = roleUrls.has(line.id) ? "● 重新录回答" : "● 录下我的回答";
  $("rolePlayback").hidden = true;
  $("rolePlayback").removeAttribute("src");
  $("roleStatus").textContent = userTurn ? "录下回答后继续；也可以连续点两次“继续”跳过。" : "";
  $("roleNextBtn").textContent = userTurn ? "完成我的回答 →" : "我听懂了，继续 →";
  $("roleNextBtn").dataset.skipConfirmed = "false";
  if (autoPlayPartner && !userTurn) playRoleOriginal();
}

function revealRoleHint() {
  $("roleEnglish").classList.remove("concealed");
  $("roleEnglish").setAttribute("aria-hidden", "false");
  $("roleHintBtn").hidden = true;
  const scene = sceneById(roleSceneId);
  const focus = spellingFocus({ scene, line: scene.lines[roleIndex], index: roleIndex });
  if (focus) $("roleSpellCue").textContent = `WORD LOCKED · ${focus.word}`;
}

function playRoleOriginal() {
  const scene = sceneById(roleSceneId);
  const ref = { scene, line: scene.lines[roleIndex], index: roleIndex };
  $("roleStatus").textContent = "正在播放示范…";
  playOriginal(ref, 1).then(() => { if (!$("roleplayOverlay").hidden) $("roleStatus").textContent = "播放完成。"; });
}

async function toggleRoleRecording() {
  if (roleRecorder?.state === "recording") { roleRecorder.stop(); return; }
  if (!navigator.mediaDevices?.getUserMedia || !("MediaRecorder" in window)) {
    $("roleStatus").textContent = "当前浏览器不支持本地录音，可以继续完成对话。";
    return;
  }
  try {
    roleStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    roleChunks = [];
    roleRecorder = new MediaRecorder(roleStream);
    roleRecorder.ondataavailable = event => { if (event.data.size) roleChunks.push(event.data); };
    roleRecorder.onstop = finishRoleRecording;
    roleRecorder.start();
    $("roleRecordBtn").classList.add("recording");
    $("roleRecordBtn").textContent = "■ 停止录音";
    $("roleStatus").textContent = "正在录下你的回答…";
  } catch {
    $("roleStatus").textContent = "没有获得麦克风权限；录音不会上传，可以跳过继续。";
  }
}

function finishRoleRecording() {
  const scene = sceneById(roleSceneId);
  const line = scene.lines[roleIndex];
  const blob = new Blob(roleChunks, { type: roleRecorder?.mimeType || "audio/webm" });
  const previous = roleUrls.get(line.id);
  if (previous) URL.revokeObjectURL(previous);
  const url = URL.createObjectURL(blob);
  roleUrls.set(line.id, url);
  $("rolePlayback").src = url;
  $("rolePlayback").hidden = false;
  $("roleRecordBtn").classList.remove("recording");
  $("roleRecordBtn").textContent = "● 重新录回答";
  $("roleStatus").textContent = "回答已放进这段对话。";
  roleStream?.getTracks().forEach(track => track.stop());
  roleStream = null;
  roleRecorder = null;
  state.metrics.recordings++;
  saveState();
}

function nextRoleplayLine() {
  const scene = sceneById(roleSceneId);
  const line = scene.lines[roleIndex];
  if (line.speaker === "YOU" && !roleUrls.has(line.id) && $("roleNextBtn").dataset.skipConfirmed !== "true") {
    $("roleNextBtn").dataset.skipConfirmed = "true";
    $("roleStatus").textContent = "还没有录音。再点一次继续可跳过这句。";
    return;
  }
  roleIndex++;
  renderRoleplayLine(true);
}

function finishRoleplay() {
  $("roleplayFill").style.width = "100%";
  $("roleplayStage").hidden = true;
  $("roleplayEnd").hidden = false;
  if (!roleCompletedLogged) {
    state.metrics.roleplays++;
    if (!state.metrics.activeDates.includes(localDateKey())) state.metrics.activeDates.push(localDateKey());
    roleCompletedLogged = true;
    saveState();
  }
}

async function replayRoleplay() {
  if (roleReplaying) return;
  roleReplaying = true;
  $("roleReplayAll").disabled = true;
  const scene = sceneById(roleSceneId);
  for (let index = 0; index < scene.lines.length && roleReplaying; index++) {
    const line = scene.lines[index];
    $("roleReplayStatus").textContent = `${index + 1}/${scene.lines.length} · ${line.speaker}：${displayText(line.zh)}`;
    const userRecording = line.speaker === "YOU" ? roleUrls.get(line.id) : null;
    if (userRecording) await playAudioUrl(userRecording, 1);
    else await playOriginal({ scene, line, index }, 1);
    await new Promise(resolve => setTimeout(resolve, 250));
  }
  if (roleReplaying) $("roleReplayStatus").textContent = "整段回放完成。";
  roleReplaying = false;
  $("roleReplayAll").disabled = false;
}

function restartRoleplay() {
  roleReplaying = false;
  roleIndex = 0;
  $("roleplayStage").hidden = false;
  $("roleplayEnd").hidden = true;
  renderRoleplayLine(true);
}

function cleanupRoleplay(closeOverlay = true) {
  roleReplaying = false;
  if (roleRecorder?.state === "recording") {
    roleRecorder.ondataavailable = null;
    roleRecorder.onstop = null;
    roleRecorder.stop();
  }
  roleStream?.getTracks().forEach(track => track.stop());
  roleStream = null;
  roleRecorder = null;
  roleChunks = [];
  roleUrls.forEach(url => URL.revokeObjectURL(url));
  roleUrls.clear();
  if (activeOriginalAudio) {
    const audio = activeOriginalAudio;
    activeOriginalAudio = null;
    audio.pause();
    const finish = audio.onended;
    audio.onended = null;
    if (typeof finish === "function") finish();
  }
  if ("speechSynthesis" in window) speechSynthesis.cancel();
  if (closeOverlay && $("roleplayOverlay")) {
    $("roleplayOverlay").hidden = true;
    $("app").inert = false;
    $("app").removeAttribute("aria-hidden");
    document.body.classList.remove("modal-open");
  }
}

function loadAiSettings() {
  const empty = { proxyUrl: "", accessToken: "", consent: false };
  try {
    const saved = JSON.parse(localStorage.getItem(AI_SETTINGS_KEY));
    if (!saved || typeof saved !== "object") return empty;
    const sanitized = {
      proxyUrl: String(saved.proxyUrl || "").trim().slice(0, 400),
      accessToken: String(saved.accessToken || "").trim().slice(0, 300),
      consent: saved.consent === true
    };
    if (saved.apiKey || saved.mode || Object.prototype.hasOwnProperty.call(saved, "apiKey")) {
      localStorage.setItem(AI_SETTINGS_KEY, JSON.stringify(sanitized));
    }
    return sanitized;
  } catch {
    return empty;
  }
}

async function hydrateNativeAiConnection() {
  if (!isNativeAndroid()) return false;
  const plugin = window.Capacitor?.Plugins?.SayAiConfig;
  if (!plugin?.get) return false;
  try {
    const config = await plugin.get();
    const proxyUrl = String(config?.proxyUrl || "").trim().slice(0, 400);
    const accessToken = String(config?.accessToken || "").trim().slice(0, 300);
    if (!config?.configured || !window.SayAi?.proxyUrlAllowed(proxyUrl) || accessToken.length < 24) return false;
    const persisted = loadAiSettings();
    aiConnectionManaged = true;
    aiSettings = { proxyUrl, accessToken, consent: persisted.consent === true };
    renderAiConnectionStatus();
    return true;
  } catch {
    return false;
  }
}

function ensureNativeAiConnection() {
  if (!nativeAiConfigPromise) nativeAiConfigPromise = hydrateNativeAiConnection();
  return nativeAiConfigPromise;
}

function aiIsConfigured() {
  return aiSettings.consent && window.SayAi?.proxyUrlAllowed(aiSettings.proxyUrl) && aiSettings.accessToken.length >= 24;
}

function saveAiSettings() {
  const persisted = aiConnectionManaged
    ? { proxyUrl: "", accessToken: "", consent: aiSettings.consent === true, managed: true }
    : aiSettings;
  localStorage.setItem(AI_SETTINGS_KEY, JSON.stringify(persisted));
  renderAiConnectionStatus();
}

function renderAiConnectionStatus() {
  if (!$("aiConnectionStatus")) return;
  const configureButton = $("configureAiBtn");
  const clearButton = $("clearAiConnection");
  if (configureButton) configureButton.textContent = aiConnectionManaged ? "进入 AI" : "连接 / 更换";
  if (clearButton) clearButton.hidden = aiConnectionManaged;
  if (aiConnectionManaged && !aiSettings.consent) {
    $("aiConnectionStatus").textContent = "AI 已准备好。首次进入时确认联网说明即可，不需要填写连接参数。";
    return;
  }
  if (!aiIsConfigured()) {
    $("aiConnectionStatus").textContent = "尚未连接。基础课程仍可完全离线使用。";
    return;
  }
  let host = "安全中转";
  try { host = new URL(aiSettings.proxyUrl).host; } catch {}
  $("aiConnectionStatus").textContent = `已连接 ${window.SayAi?.PROVIDER || "百炼"} ${window.SayAi?.MODEL || "qwen3.7-plus"} · ${host}。基础课程仍可离线。`;
}

async function openAiCoach(forceSetup = false) {
  await ensureNativeAiConnection();
  cleanupRecording();
  cleanupRoleplay(false);
  aiSceneId = currentSceneId || nextPhraseRef().scene.id;
  $("aiOverlay").hidden = false;
  $("app").inert = true;
  $("app").setAttribute("aria-hidden", "true");
  document.body.classList.add("modal-open");
  if ((!aiConnectionManaged && forceSetup) || !aiIsConfigured()) showAiSetup();
  else beginAiChat();
}

function showAiSetup() {
  $("aiSetup").hidden = false;
  $("aiChat").hidden = true;
  $("aiRecap").hidden = true;
  $("aiTopScene").textContent = "连接 AI 陪练";
  document.querySelectorAll("[data-manual-ai]").forEach(element => { element.hidden = aiConnectionManaged; });
  $("aiOverlayTitle").innerHTML = aiConnectionManaged ? "AI 已就位，<br>现在开口。" : "连上百炼，<br>开始接话。";
  $("aiSetupCopy").textContent = aiConnectionManaged
    ? "十一说已经连好 qwen3.7-plus 和百炼少女声。你只需确认联网说明，之后直接进入现实场景。"
    : "qwen3.7-plus 负责接话，百炼少女声负责朗读。长期 API Key 只放在你的服务端，不进入网页或 APK。";
  $("saveAiConnection").textContent = aiConnectionManaged ? "同意联网 · 开始陪练 →" : "保存连接 · 进入场景 →";
  $("aiProxyInput").value = aiSettings.proxyUrl;
  $("aiAccessTokenInput").value = "";
  $("aiAccessTokenInput").placeholder = aiSettings.accessToken ? "本机已有访问口令；留空可继续使用" : "粘贴服务端访问口令";
  $("aiConsent").checked = aiSettings.consent;
  $("aiSetupStatus").textContent = aiConnectionManaged
    ? "连接已由十一说安全配置；长期百炼 API Key 不在安装包里。"
    : (aiSettings.accessToken ? "本机已有可撤销访问口令；百炼 API Key 始终只在服务端。" : "");
}

function applyAiConnection() {
  const consent = $("aiConsent").checked;
  const proxyUrl = aiConnectionManaged ? aiSettings.proxyUrl : $("aiProxyInput").value.trim();
  const enteredToken = $("aiAccessTokenInput").value.trim();
  const accessToken = aiConnectionManaged ? aiSettings.accessToken : (enteredToken || aiSettings.accessToken);
  if (!consent) {
    $("aiSetupStatus").textContent = "请先确认联网和数据说明。";
    return;
  }
  if (!window.SayAi?.proxyUrlAllowed(proxyUrl)) {
    $("aiSetupStatus").textContent = "请输入部署完成后的 HTTPS 百炼中转地址。";
    return;
  }
  if (accessToken.length < 24) {
    $("aiSetupStatus").textContent = "访问口令至少需要 24 位；它不是百炼 API Key。";
    return;
  }
  aiSettings = { proxyUrl, accessToken, consent: true };
  aiVoiceAvailable = null;
  saveAiSettings();
  $("aiAccessTokenInput").value = "";
  beginAiChat();
}

function beginAiChat() {
  const scenario = window.SayAi?.SCENARIOS[aiSceneId] || window.SayAi?.SCENARIOS.social;
  if (!scenario) {
    $("aiSetupStatus").textContent = "AI 模块没有加载完成，请关闭后重试。";
    showAiSetup();
    return;
  }
  aiHistory = [{ role: "model", text: scenario.openerEn }];
  aiTurnCount = 0;
  aiLastResult = null;
  aiBusy = false;
  $("aiSetup").hidden = true;
  $("aiRecap").hidden = true;
  $("aiChat").hidden = false;
  $("aiTopScene").textContent = scenario.title;
  $("aiPersona").textContent = scenario.persona;
  $("aiChatTitle").textContent = scenario.title;
  $("aiSceneGoal").textContent = scenario.goal;
  $("aiChatStream").innerHTML = "";
  const openerBubble = appendAiBubble("model", scenario.openerEn, scenario.openerZh);
  addAiVoiceControl(openerBubble, scenario.openerEn);
  $("aiCoachNote").hidden = true;
  $("aiHint").hidden = true;
  $("aiUserInput").value = "";
  $("aiUserInput").disabled = false;
  setAiBusy(false);
  $("finishAiSession").textContent = "结束这轮 · 收进记忆";
  $("aiStatus").textContent = "轮到你。可以打字，也可以点“说给 AI 听”。";
  setTimeout(() => $("aiUserInput").focus(), 80);
}

function appendAiBubble(role, english, chinese = "") {
  const bubble = document.createElement("article");
  bubble.className = `ai-bubble ${role}`;
  const label = document.createElement("span");
  label.textContent = role === "user" ? "YOU" : "MIA";
  const message = document.createElement("strong");
  message.lang = "en";
  message.textContent = english;
  bubble.append(label, message);
  if (chinese) {
    const translation = document.createElement("small");
    translation.textContent = chinese;
    bubble.appendChild(translation);
  }
  $("aiChatStream").appendChild(bubble);
  bubble.scrollIntoView({ block: "nearest", behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  return bubble;
}

function stopAiVoice() {
  if (!activeAiAudio) return;
  activeAiAudio.pause();
  activeAiAudio.src = "";
  activeAiAudio = null;
  document.querySelectorAll(".ai-voice-button.playing").forEach(button => {
    button.classList.remove("playing");
    button.textContent = "▶ 听 Mia 少女声";
  });
}

async function playAiVoice(audioDataUrl, button, automatic = false) {
  stopAiVoice();
  const audio = new Audio(audioDataUrl);
  activeAiAudio = audio;
  button.classList.add("playing");
  button.textContent = "正在播放 Mia…";
  const finish = () => {
    if (activeAiAudio === audio) activeAiAudio = null;
    button.classList.remove("playing");
    button.textContent = "▶ 再听一次";
  };
  audio.onended = finish;
  audio.onerror = () => {
    finish();
    button.textContent = "声音加载失败 · 点我重试";
  };
  try {
    await audio.play();
  } catch (error) {
    finish();
    button.textContent = automatic ? "▶ 点一下听 Mia 少女声" : "▶ 再点一次播放";
    if (!automatic) throw error;
  }
}

function addAiVoiceControl(bubble, english) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "ai-voice-button";
  if (aiVoiceAvailable === false) {
    button.textContent = "少女声尚未配置";
    button.disabled = true;
    bubble.appendChild(button);
    return;
  }
  button.textContent = "Mia 少女声加载中…";
  button.disabled = true;
  bubble.appendChild(button);
  window.SayAi.requestSpeech({ settings: aiSettings, text: english })
    .then(result => {
      if (!bubble.isConnected) return;
      aiVoiceAvailable = true;
      button.disabled = false;
      button.textContent = "▶ 听 Mia 少女声";
      button.addEventListener("click", () => playAiVoice(result.audioDataUrl, button).catch(() => {}));
      playAiVoice(result.audioDataUrl, button, true).catch(() => {});
    })
    .catch(error => {
      if (!bubble.isConnected) return;
      const message = String(error?.message || "");
      if (message.includes("TTS_HTTP_501") || message.includes("TTS_HTTP_503") || message.includes("TTS_NOT_CONFIGURED")) {
        aiVoiceAvailable = false;
        button.textContent = "少女声尚未配置";
      } else {
        button.textContent = "少女声暂时没接上";
      }
      button.disabled = true;
    });
}

function setAiBusy(busy) {
  aiBusy = busy;
  $("aiSendBtn").disabled = busy || aiTurnCount >= 8;
  $("aiMicBtn").disabled = busy || aiTurnCount >= 8;
  $("aiHintBtn").disabled = busy;
  $("aiUserInput").disabled = busy || aiTurnCount >= 8;
  $("aiSendBtn").textContent = busy ? "AI 正在接话…" : "发出去 →";
}

function aiMemoryTargets() {
  return [...(state.aiMemories || [])].sort((a, b) => String(a.due).localeCompare(String(b.due))).slice(0, 5);
}

function aiErrorMessage(error) {
  const message = String(error?.message || "");
  if (!navigator.onLine) return "手机现在没有网络；基础课程仍可离线使用。";
  if (message.includes("AI_ACCESS_TOKEN_MISSING")) return "还没有服务端访问口令。到“我的 → AI 陪练连接”重新填写。";
  if (message.includes("AI_HTTP_401") || message.includes("AI_HTTP_403")) return "访问口令无效或中转服务没有权限。到“我的 → AI 陪练连接”检查连接。";
  if (message.includes("AI_HTTP_429")) return "百炼额度暂时用完，或这一分钟请求太快，稍后再试。";
  if (message.includes("AI_HTTP_400")) return "AI 没接住这次请求；换一句简单英语再试。";
  if (message.includes("AbortError")) return "AI 等得有点久，网络恢复后再发一次。";
  if (message.includes("AI_RESPONSE") || message.includes("AI_NO_CANDIDATE")) return "AI 这次回复格式不完整，再发一次就好。";
  return "AI 暂时没有接上。检查网络或连接设置后再试。";
}

async function submitAiTurn() {
  if (aiBusy || aiTurnCount >= 8) return;
  const userText = window.SayAi?.cleanText($("aiUserInput").value, 180) || "";
  if (!userText) {
    $("aiStatus").textContent = "先说或写一句简单英语，哪怕只有两个词也可以。";
    return;
  }
  $("aiUserInput").value = "";
  $("aiHint").hidden = true;
  $("aiCoachNote").hidden = true;
  const bubble = appendAiBubble("user", userText);
  aiHistory.push({ role: "user", text: userText });
  setAiBusy(true);
  $("aiStatus").textContent = "Mia 正在理解你的意思…";
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 28000);
  try {
    const result = await window.SayAi.requestCoach({
      settings: aiSettings,
      sceneId: aiSceneId,
      history: aiHistory.slice(0, -1),
      userText,
      memories: aiMemoryTargets(),
      fetchImpl: (url, options) => fetch(url, { ...options, signal: controller.signal })
    });
    aiLastResult = result;
    aiHistory.push({ role: "model", text: result.reply_en });
    aiTurnCount++;
    state.metrics.aiTurns++;
    const replyBubble = appendAiBubble("model", result.reply_en, result.reply_zh);
    addAiVoiceControl(replyBubble, result.reply_en);
    $("aiCoachFeedback").textContent = result.fix_to ? `${result.feedback_zh} 更自然：${result.fix_to}${result.fix_zh ? ` · ${result.fix_zh}` : ""}` : result.feedback_zh;
    $("aiCoachNote").hidden = false;
    $("aiHintEnglish").textContent = result.hint_en;
    $("aiHintChinese").textContent = result.hint_zh;
    $("aiHint").hidden = true;
    if (aiTurnCount >= 8) {
      $("aiStatus").textContent = "八个回合刚刚好。现在结束，把最好用的一句收进记忆。";
      $("finishAiSession").textContent = "完成 8 回合 · 收进记忆 →";
    } else {
      $("aiStatus").textContent = "意思已经接住。想不到下一句时，再点提示。";
    }
    saveState();
  } catch (error) {
    aiHistory.pop();
    bubble.remove();
    $("aiUserInput").value = userText;
    $("aiStatus").textContent = aiErrorMessage(error);
  } finally {
    clearTimeout(timeout);
    setAiBusy(false);
  }
}

function showAiHint() {
  if (aiLastResult) {
    $("aiHint").hidden = false;
    $("aiHint").scrollIntoView({ block: "nearest", behavior: "smooth" });
    return;
  }
  const scene = sceneById(aiSceneId);
  const firstUserLine = scene?.lines.find(line => line.speaker === "YOU");
  $("aiHintEnglish").textContent = firstUserLine ? displayText(firstUserLine.en) : "Hi. Nice to meet you.";
  $("aiHintChinese").textContent = firstUserLine ? displayText(firstUserLine.zh) : "你好，很高兴认识你。";
  $("aiHint").hidden = false;
}

function startAiSpeechRecognition() {
  if (aiBusy) return;
  const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!Recognition) {
    $("aiStatus").textContent = "这台手机暂不支持语音转文字，可以直接打字；课程录音仍然能用。";
    return;
  }
  aiRecognition?.abort?.();
  aiRecognition = new Recognition();
  aiRecognition.lang = "en-US";
  aiRecognition.interimResults = false;
  aiRecognition.maxAlternatives = 1;
  aiRecognition.onstart = () => {
    $("aiMicBtn").textContent = "正在听…";
    $("aiStatus").textContent = "说一句英语，停下来后会自动填进输入框。";
  };
  aiRecognition.onresult = event => {
    $("aiUserInput").value = event.results?.[0]?.[0]?.transcript || "";
    $("aiStatus").textContent = "已经听写出来，先看一眼，再点“发出去”。";
  };
  aiRecognition.onerror = () => { $("aiStatus").textContent = "这次没有听清，可以重试或直接打字。"; };
  aiRecognition.onend = () => { $("aiMicBtn").textContent = "● 说给 AI 听"; aiRecognition = null; };
  try { aiRecognition.start(); } catch { $("aiStatus").textContent = "麦克风还没准备好，稍后再点一次。"; }
}

function storeAiMemory(result) {
  const en = window.SayAi?.cleanText(result?.memory_en || result?.fix_to || result?.reply_en, 140) || "";
  const zh = window.SayAi?.cleanText(result?.memory_zh || result?.fix_zh || result?.reply_zh, 180) || "";
  if (!en) return null;
  const existing = state.aiMemories.find(item => item.en.toLowerCase() === en.toLowerCase());
  if (existing) {
    existing.zh = zh || existing.zh;
    existing.sceneId = aiSceneId;
    existing.due = addDays(localDateKey(), 1);
    return existing;
  }
  const item = { id: `ai-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, en, zh, sceneId: aiSceneId, level: 0, due: addDays(localDateKey(), 1), createdAt: localDateKey() };
  state.aiMemories = [...state.aiMemories.slice(-29), item];
  return item;
}

function finishAiSession() {
  if (aiBusy) return;
  if (!aiLastResult || aiTurnCount < 1) {
    $("aiStatus").textContent = "先和 Mia 说一句，再结束这轮。";
    return;
  }
  const memory = storeAiMemory(aiLastResult);
  state.metrics.aiSessions++;
  if (!state.metrics.activeDates.includes(localDateKey())) state.metrics.activeDates.push(localDateKey());
  if (!state.days.includes(localDateKey())) state.days.push(localDateKey());
  saveState();
  $("aiChat").hidden = true;
  $("aiRecap").hidden = false;
  $("aiRecapEnglish").textContent = memory?.en || aiLastResult.reply_en;
  $("aiRecapChinese").textContent = memory?.zh || aiLastResult.reply_zh;
  $("aiTopScene").textContent = "本轮完成";
}

function closeAiCoach() {
  aiRecognition?.abort?.();
  aiRecognition = null;
  stopAiVoice();
  $("aiOverlay").hidden = true;
  $("app").inert = false;
  $("app").removeAttribute("aria-hidden");
  document.body.classList.remove("modal-open");
  aiHistory = [];
  aiLastResult = null;
  aiTurnCount = 0;
  aiBusy = false;
}

function clearAiConnection() {
  if (aiConnectionManaged) {
    toast("AI 已由十一说安全配置，不需要手动删除连接。");
    return;
  }
  if (!aiSettings.accessToken && !aiSettings.proxyUrl) {
    toast("本机没有保存 AI 连接。");
    return;
  }
  if (!confirm("确定删除这台手机保存的百炼中转地址和访问口令吗？学习进度和 AI 记忆句不会删除。")) return;
  stopAiVoice();
  localStorage.removeItem(AI_SETTINGS_KEY);
  aiSettings = loadAiSettings();
  aiVoiceAvailable = null;
  renderAiConnectionStatus();
  toast("本机 AI 连接已经删除。");
}

function dueAiMemories() {
  const today = localDateKey();
  return (state.aiMemories || []).filter(item => (item.due || today) <= today);
}

function renderAiMemoryReview() {
  if (!$("aiMemoryPanel")) return;
  const due = dueAiMemories();
  $("aiMemoryCount").textContent = due.length ? `${due.length} DUE` : `${state.aiMemories.length} SAVED`;
  if (!due.length) {
    currentAiReviewId = null;
    $("aiMemoryCard").hidden = true;
    $("aiMemoryEmpty").hidden = false;
    if (state.aiMemories.length) {
      const next = [...state.aiMemories].sort((a, b) => String(a.due).localeCompare(String(b.due)))[0];
      $("aiMemoryEmpty").textContent = `今天没有到期。下一句会在 ${next.due} 自然回来。`;
    } else {
      $("aiMemoryEmpty").textContent = "完成一次 AI 对话后，它会替你挑一句最值得复用的话。";
    }
    return;
  }
  const current = due.find(item => item.id === currentAiReviewId) || due[0];
  currentAiReviewId = current.id;
  $("aiMemoryEmpty").hidden = true;
  $("aiMemoryCard").hidden = false;
  $("aiMemoryCue").textContent = `${sceneById(current.sceneId)?.title || "现实场景"} · 先回想你上次带走的那一句。`;
  $("aiMemoryEnglish").textContent = current.en;
  $("aiMemoryChinese").textContent = current.zh;
  $("aiMemoryAnswer").hidden = true;
  $("revealAiMemory").hidden = false;
}

function revealAiMemory() {
  if (!currentAiReviewId) return;
  $("revealAiMemory").hidden = true;
  $("aiMemoryAnswer").hidden = false;
}

function gradeAiMemory(grade) {
  const item = state.aiMemories.find(memory => memory.id === currentAiReviewId);
  if (!item) return;
  if (grade === "good") {
    item.level = Math.min(4, item.level + 1);
    item.due = addDays(localDateKey(), REVIEW_INTERVALS[item.level] || 30);
    toast("记住了。它会隔一段时间再回来。");
  } else {
    item.level = 0;
    item.due = addDays(localDateKey(), 1);
    toast("没关系，明天换个场景再碰一次。");
  }
  state.metrics.aiReviews++;
  currentAiReviewId = null;
  saveState();
}

function quizPool() {
  const due = shuffled(dueRefs());
  const known = shuffled(state.known.map(phraseRefById).filter(Boolean));
  const unique = [];
  [...due, ...known].forEach(ref => { if (!unique.some(item => item.line.id === ref.line.id)) unique.push(ref); });
  if (!unique.length) return [];
  const result = [...unique];
  while (result.length < 5) result.push(unique[result.length % unique.length]);
  return result.slice(0, 5);
}

function startQuiz() {
  quizItems = quizPool();
  if (!quizItems.length) {
    toast("先拿下一句，再回来复习。");
    const next = nextPhraseRef();
    openScene(next.scene.id, next.index);
    return;
  }
  quizIndex = 0;
  quizScore = 0;
  quizLocked = false;
  reviewedThisQuiz = new Set();
  $("quizStart").hidden = true;
  $("resultBox").hidden = true;
  $("quizBox").hidden = false;
  renderQuizQuestion();
}

function quizModeFor(ref, index) {
  const modes = ["translation", "listening", "spelling", "recall", "ordering"];
  const words = cleanWords(displayText(ref.line.en));
  if (modes[index] === "spelling" && !spellingFocus(ref)) return "translation";
  return modes[index] === "ordering" && words.length < 2 ? "translation" : modes[index];
}

function cleanWords(text) { return text.replace(/[.,?!]/g, "").split(/\s+/).filter(Boolean); }

function renderQuizQuestion() {
  quizLocked = false;
  selectedWords = [];
  questionStartedAt = performance.now();
  const ref = quizItems[quizIndex];
  const mode = quizModeFor(ref, quizIndex);
  const modeNames = { translation: "看中文 · 选英文", listening: "听示范 · 选意思", spelling: "听声音 · 补拼写", ordering: "重组句子", recall: "主动回忆" };
  $("quizMode").textContent = modeNames[mode];
  $("quizStep").textContent = `${quizIndex + 1} / 5`;
  $("quizProgress").style.width = `${quizIndex / 5 * 100}%`;
  $("quizFeedback").textContent = "";
  $("quizPrompt").innerHTML = "";
  $("quizInteraction").innerHTML = "";
  if (mode === "translation") renderTranslationQuestion(ref);
  if (mode === "listening") renderListeningQuestion(ref);
  if (mode === "spelling") renderSpellingQuestion(ref);
  if (mode === "ordering") renderOrderingQuestion(ref);
  if (mode === "recall") renderRecallQuestion(ref);
}

function alternativeRefs(target, key) {
  const seen = new Set([displayText(target.line[key])]);
  return shuffled(allPhraseRefs()).filter(ref => {
    const value = displayText(ref.line[key]);
    if (seen.has(value)) return false;
    seen.add(value);
    return true;
  }).slice(0, 2);
}

function renderTranslationQuestion(ref) {
  $("quizPrompt").innerHTML = `<div><small>下面中文怎么说？</small><strong>${escapeHtml(displayText(ref.line.zh))}</strong></div>`;
  const options = shuffled([ref, ...alternativeRefs(ref, "en")]);
  $("quizInteraction").innerHTML = options.map(option => `<button class="choice" type="button" data-correct="${option.line.id === ref.line.id}">${escapeHtml(displayText(option.line.en))}</button>`).join("");
  $("quizInteraction").querySelectorAll(".choice").forEach(button => button.addEventListener("click", () => gradeChoice(button, button.dataset.correct === "true", ref, displayText(ref.line.en))));
}

function renderListeningQuestion(ref) {
  $("quizPrompt").innerHTML = `<div><small>听英文，选出对应意思</small><button class="button listen-main" id="quizListen" type="button">▶ 播放英文</button></div>`;
  const options = shuffled([ref, ...alternativeRefs(ref, "zh")]);
  $("quizInteraction").innerHTML = options.map(option => `<button class="choice" type="button" data-correct="${option.line.id === ref.line.id}">${escapeHtml(displayText(option.line.zh))}</button>`).join("");
  $("quizListen").addEventListener("click", () => playOriginal(ref, .88));
  $("quizInteraction").querySelectorAll(".choice").forEach(button => button.addEventListener("click", () => gradeChoice(button, button.dataset.correct === "true", ref, displayText(ref.line.zh))));
  setTimeout(() => playOriginal(ref, .88), 200);
}

function renderSpellingQuestion(ref) {
  const focus = spellingFocus(ref);
  $("quizPrompt").innerHTML = `<div><small>${escapeHtml(displayText(ref.line.zh))}</small><button class="quiz-spell-sound" id="quizSpellSound" type="button" aria-label="播放关键词">▶</button><strong class="quiz-spell-word" lang="en">${escapeHtml(spellingMask(focus))}</strong></div>`;
  $("quizInteraction").innerHTML = shuffled(focus.options).map(option => `<button class="choice spell-choice" type="button" data-spell="${escapeHtml(option)}">${escapeHtml(option)}</button>`).join("");
  $("quizSpellSound").addEventListener("click", () => playSpellingAudio(ref));
  $("quizInteraction").querySelectorAll("[data-spell]").forEach(button => button.addEventListener("click", () => {
    if (quizLocked) return;
    quizLocked = true;
    const correct = button.dataset.spell === focus.gap;
    recordSpelling(ref, correct);
    $("quizInteraction").querySelectorAll("[data-spell]").forEach(option => {
      option.disabled = true;
      if (option.dataset.spell === focus.gap) option.classList.add("correct");
    });
    if (!correct) button.classList.add("wrong");
    $("quizPrompt").querySelector(".quiz-spell-word").textContent = focus.word;
    finishQuizAnswer(correct, ref, correct ? `锁住 ${focus.word}，把它说回整句。` : `这一块是 ${focus.gap}：${focus.word}`);
  }));
  setTimeout(() => playSpellingAudio(ref), 180);
}

function gradeChoice(button, correct, ref, correctText) {
  if (quizLocked) return;
  quizLocked = true;
  $("quizInteraction").querySelectorAll(".choice").forEach(choice => {
    choice.disabled = true;
    if (choice.textContent === correctText) choice.classList.add("correct");
  });
  if (!correct) button.classList.add("wrong");
  finishQuizAnswer(correct, ref, correct ? "记住了。" : `正确答案：${correctText}`);
}

function renderOrderingQuestion(ref) {
  const words = cleanWords(displayText(ref.line.en));
  $("quizPrompt").innerHTML = `<div><small>按顺序拼出这句话</small><strong>${escapeHtml(displayText(ref.line.zh))}</strong></div>`;
  $("quizInteraction").innerHTML = `<div class="answer-bank" id="answerBank" aria-label="已选择单词"></div><div class="word-bank" id="wordBank" aria-label="待选择单词"></div><button class="button primary full" id="checkOrder" type="button">检查顺序</button>`;
  const shuffledWords = shuffled(words.map((word, index) => ({ word, key: `${index}-${word}` })));
  const available = [...shuffledWords];
  function draw() {
    $("answerBank").innerHTML = selectedWords.map(item => `<button class="word-chip" type="button" data-key="${escapeHtml(item.key)}">${escapeHtml(item.word)}</button>`).join("");
    $("wordBank").innerHTML = available.filter(item => !selectedWords.some(selected => selected.key === item.key)).map(item => `<button class="word-chip" type="button" data-key="${escapeHtml(item.key)}">${escapeHtml(item.word)}</button>`).join("");
    $("answerBank").querySelectorAll(".word-chip").forEach(button => button.addEventListener("click", () => { selectedWords = selectedWords.filter(item => item.key !== button.dataset.key); draw(); }));
    $("wordBank").querySelectorAll(".word-chip").forEach(button => button.addEventListener("click", () => { const item = available.find(value => value.key === button.dataset.key); selectedWords.push(item); draw(); }));
  }
  draw();
  $("checkOrder").addEventListener("click", () => {
    if (quizLocked) return;
    if (selectedWords.length !== words.length) { $("quizFeedback").textContent = "先把所有单词放进去。"; return; }
    quizLocked = true;
    const correct = selectedWords.map(item => item.word.toLowerCase()).join(" ") === words.map(word => word.toLowerCase()).join(" ");
    finishQuizAnswer(correct, ref, correct ? "顺序正确。" : `正确顺序：${words.join(" ")}`);
  });
}

function renderRecallQuestion(ref) {
  $("quizPrompt").innerHTML = `<div><small>先在心里或大声说出来</small><strong>${escapeHtml(displayText(ref.line.zh))}</strong></div>`;
  $("quizInteraction").innerHTML = `<button class="button light full" id="revealAnswer" type="button">想好后，显示答案</button>`;
  $("revealAnswer").addEventListener("click", () => {
    $("quizInteraction").innerHTML = `<div class="recall-answer"><strong lang="en">${escapeHtml(displayText(ref.line.en))}</strong><span>${escapeHtml(displayText(ref.line.zh))}</span></div><div class="self-grade"><button class="button light" type="button" data-grade="false">还不熟</button><button class="button acid-button" type="button" data-grade="true">我记得</button></div>`;
    $("quizInteraction").querySelectorAll("[data-grade]").forEach(button => button.addEventListener("click", () => {
      if (quizLocked) return;
      quizLocked = true;
      const correct = button.dataset.grade === "true";
      finishQuizAnswer(correct, ref, correct ? "主动想起来了。" : "没关系，明天会更早再见到它。", 500);
    }));
  });
}

function scheduleReview(ref, correct, elapsedMs) {
  if (!state.known.includes(ref.line.id) || reviewedThisQuiz.has(ref.line.id)) return;
  reviewedThisQuiz.add(ref.line.id);
  const current = state.reviews[ref.line.id] || { level: 0, due: localDateKey(), successes: 0, lapses: 0 };
  const fastEnough = elapsedMs <= 9000;
  const level = correct ? Math.min(current.level + (fastEnough ? 1 : 0), REVIEW_INTERVALS.length - 1) : 0;
  state.reviews[ref.line.id] = {
    level,
    due: addDays(localDateKey(), REVIEW_INTERVALS[level]),
    successes: (current.successes || 0) + (correct ? 1 : 0),
    lapses: (current.lapses || 0) + (correct ? 0 : 1),
    lastMs: Math.round(elapsedMs)
  };
}

function finishQuizAnswer(correct, ref, message, delay = 1100) {
  if (correct) quizScore++;
  scheduleReview(ref, correct, performance.now() - questionStartedAt);
  state.metrics.reviewAnswers++;
  $("quizFeedback").textContent = message;
  saveState(false);
  setTimeout(() => {
    quizIndex++;
    if (quizIndex < 5) renderQuizQuestion();
    else finishQuiz();
  }, delay);
}

function finishQuiz() {
  $("quizBox").hidden = true;
  $("resultBox").hidden = false;
  $("resultScore").textContent = `${quizScore}/5`;
  $("resultMessage").textContent = quizScore === 5 ? "状态拉满。现在选一句，今天真的用出去。" : quizScore >= 3 ? "记忆正在变稳。答错的表达会更早回来。" : "不需要硬背；跟读一遍，明天再见。";
  state.best = Math.max(state.best || 0, quizScore);
  state.metrics.quizzes++;
  if (!state.metrics.activeDates.includes(localDateKey())) state.metrics.activeDates.push(localDateKey());
  saveState();
}

function exportProgress() {
  const payload = { app: "十一说", appId: "com.say01.english", version: APP_VERSION, exportedAt: new Date().toISOString(), state };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `十一说进度-${localDateKey()}.json`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 500);
  toast("进度文件已经导出。");
}

function importProgress(file) {
  if (!file || file.size > 1024 * 1024) {
    toast("进度文件不能超过 1MB。");
    $("importFile").value = "";
    return;
  }
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(reader.result);
      const incoming = parsed.state || parsed;
      if (!incoming || typeof incoming !== "object" || !Array.isArray(incoming.known) || incoming.known.length > 100 || (incoming.profile && typeof incoming.profile !== "object")) throw new Error("invalid");
      state = sanitizeState(incoming);
      state.migrations.push({ from: String(parsed.version || incoming.schema || "unknown"), to: APP_VERSION, date: localDateKey() });
      saveState();
      showView("home");
      toast("进度已经恢复。");
    } catch { toast("这个文件不是有效的十一说进度。"); }
    $("importFile").value = "";
  };
  reader.readAsText(file);
}

function calendarDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const h = String(date.getHours()).padStart(2, "0");
  const min = String(date.getMinutes()).padStart(2, "0");
  return `${y}${m}${d}T${h}${min}00`;
}

function createCalendarReminder() {
  const start = new Date();
  start.setDate(start.getDate() + 1);
  start.setHours(9, 0, 0, 0);
  const duration = state.profile?.minutes || 5;
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//ELEVEN-SAYS//Daily Practice//ZH",
    "BEGIN:VEVENT",
    `UID:xiaobai-english-${Date.now()}@local`,
    `DTSTART:${calendarDate(start)}`,
    "RRULE:FREQ=DAILY",
    `DURATION:PT${duration}M`,
    "SUMMARY:十一说｜今天开口一句",
    `DESCRIPTION:用 ${duration} 分钟完成一句真实英语表达。无需连续完美，只要今天开口。`,
    "END:VEVENT",
    "END:VCALENDAR"
  ].join("\r\n");
  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "十一说每日提醒.ics";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 500);
  toast("日历提醒文件已生成，打开后确认添加即可。");
}

function showToastInstallHelp() {
  if (isNativeAndroid()) {
    toast("你现在就在十一说安卓 App 里。");
    return;
  }
  const isiOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  $("installTip").hidden = false;
  $("installTip").textContent = isiOS ? "iPhone：点 Safari 底部的分享按钮，再选择“添加到主屏幕”。" : "Android：打开浏览器右上角菜单，选择“添加到主屏幕”或“安装应用”。";
}

function configureRuntimeSurface() {
  if (!isNativeAndroid()) return;
  document.documentElement.classList.add("native-android");
  const installButton = $("installBtn");
  const setting = installButton.closest(".setting-row");
  setting.querySelector("strong").textContent = "安卓 App 已安装";
  setting.querySelector("small").textContent = "学习记录保存在这个 App 的本机空间";
  installButton.textContent = "已安装";
  installButton.disabled = true;
  $("installTip").hidden = false;
  $("installTip").textContent = "网页版与 App 的进度彼此独立；需要迁移时使用下方导入 / 导出。";
}

function toast(message) {
  $("toast").textContent = message;
  $("toast").classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => $("toast").classList.remove("show"), 2200);
}

function setupOnboarding() {
  if (state.profile) return;
  $("onboarding").hidden = false;
  $("app").inert = true;
  $("app").setAttribute("aria-hidden", "true");
  document.body.classList.add("modal-open");
}

function selectExclusive(container, button, selector) {
  container.querySelectorAll(selector).forEach(item => {
    const selected = item === button;
    item.classList.toggle("selected", selected);
    item.setAttribute("aria-pressed", String(selected));
  });
}

function finishOnboarding() {
  const goal = $("onboardingGoals").querySelector(".selected").dataset.goal;
  const minutes = Number($("onboardingTimes").querySelector(".selected").dataset.minutes);
  const name = cleanName($("onboardingName").value) || "Alex";
  state.profile = { name, goal, minutes };
  $("onboarding").hidden = true;
  $("app").inert = false;
  $("app").removeAttribute("aria-hidden");
  document.body.classList.remove("modal-open");
  saveState();
  toast(`${name}，先从今天最能用的一句开始。`);
}

function saveSettings() {
  state.profile = state.profile || { name: "Alex", goal: "daily", minutes: 5 };
  state.profile.name = cleanName($("profileName").value) || "Alex";
  state.profile.goal = $("goalSelect").value;
  state.profile.minutes = Number($("minutesSelect").value);
  state.rate = Number($("rateSelect").value);
  saveState();
  toast("学习节奏已更新。");
}

function bindEvents() {
  document.querySelectorAll(".nav-button").forEach(button => button.addEventListener("click", () => showView(button.dataset.view)));
  document.querySelectorAll("[data-go]").forEach(button => button.addEventListener("click", () => showView(button.dataset.go)));
  $("continueBtn").addEventListener("click", event => openScene(event.currentTarget.dataset.scene, event.currentTarget.dataset.phrase));
  $("nextSceneBtn").addEventListener("click", event => openScene(event.currentTarget.dataset.scene, 0));
  $("backToLessons").addEventListener("click", showLessonIndex);
  $("prevPhrase").addEventListener("click", () => { if (currentPhraseIndex > 0) { currentPhraseIndex--; renderPhrase(); } else showLessonIndex(); });
  $("knownBtn").addEventListener("click", markCurrentKnown);
  $("slowSoundBtn").addEventListener("click", () => speakCurrent(.72));
  $("normalSoundBtn").addEventListener("click", () => speakCurrent(1));
  $("lessonStartAudio").addEventListener("click", () => speakCurrent(1));
  $("spellHearBtn").addEventListener("click", speakCurrentSpellingWord);
  $("recordBtn").addEventListener("click", toggleRecording);
  $("compareBtn").addEventListener("click", compareRecording);
  document.querySelectorAll("[data-record-grade]").forEach(button => button.addEventListener("click", () => gradeRecording(button.dataset.recordGrade)));
  $("recognizeBtn").addEventListener("click", startSpeechRecognition);
  $("startRoleplay").addEventListener("click", openRoleplay);
  $("closeRoleplay").addEventListener("click", () => cleanupRoleplay(true));
  $("roleFinish").addEventListener("click", () => cleanupRoleplay(true));
  $("rolePlayBtn").addEventListener("click", playRoleOriginal);
  $("roleHintBtn").addEventListener("click", revealRoleHint);
  $("roleRecordBtn").addEventListener("click", toggleRoleRecording);
  $("roleNextBtn").addEventListener("click", nextRoleplayLine);
  $("roleReplayAll").addEventListener("click", replayRoleplay);
  $("roleRestart").addEventListener("click", restartRoleplay);
  $("startAiCoach").addEventListener("click", () => openAiCoach(false));
  $("closeAiCoach").addEventListener("click", closeAiCoach);
  $("cancelAiSetup").addEventListener("click", closeAiCoach);
  $("saveAiConnection").addEventListener("click", applyAiConnection);
  $("aiSendBtn").addEventListener("click", submitAiTurn);
  $("aiMicBtn").addEventListener("click", startAiSpeechRecognition);
  $("aiHintBtn").addEventListener("click", showAiHint);
  $("aiUserInput").addEventListener("keydown", event => {
    if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); submitAiTurn(); }
  });
  $("finishAiSession").addEventListener("click", finishAiSession);
  $("closeAiRecap").addEventListener("click", closeAiCoach);
  $("configureAiBtn").addEventListener("click", () => openAiCoach(true));
  $("clearAiConnection").addEventListener("click", clearAiConnection);
  $("revealAiMemory").addEventListener("click", revealAiMemory);
  document.querySelectorAll("[data-ai-memory-grade]").forEach(button => button.addEventListener("click", () => gradeAiMemory(button.dataset.aiMemoryGrade)));
  $("startQuiz").addEventListener("click", startQuiz);
  $("retryQuiz").addEventListener("click", startQuiz);
  $("saveSettings").addEventListener("click", saveSettings);
  $("rateSelect").addEventListener("change", () => speakText("Hello. Nice to meet you.", Number($("rateSelect").value)));
  $("exportBtn").addEventListener("click", exportProgress);
  $("importBtn").addEventListener("click", () => $("importFile").click());
  $("importFile").addEventListener("change", event => { if (event.target.files[0]) importProgress(event.target.files[0]); });
  $("calendarBtn").addEventListener("click", createCalendarReminder);
  $("resetBtn").addEventListener("click", () => {
    if (!confirm("确定清空全部学习记录吗？建议先导出一份备份。")) return;
    state = emptyState();
    localStorage.removeItem(STORAGE_KEY);
    saveState();
    $("onboarding").hidden = false;
    $("app").inert = true;
    $("app").setAttribute("aria-hidden", "true");
    document.body.classList.add("modal-open");
    showView("home");
  });
  $("installBtn").addEventListener("click", async () => {
    if (isNativeAndroid()) { showToastInstallHelp(); return; }
    if (!deferredInstall) { showToastInstallHelp(); return; }
    deferredInstall.prompt();
    await deferredInstall.userChoice;
    deferredInstall = null;
  });
  $("onboardingGoals").querySelectorAll("[data-goal]").forEach(button => button.addEventListener("click", () => selectExclusive($("onboardingGoals"), button, "[data-goal]")));
  $("onboardingTimes").querySelectorAll("[data-minutes]").forEach(button => button.addEventListener("click", () => selectExclusive($("onboardingTimes"), button, "[data-minutes]")));
  $("finishOnboarding").addEventListener("click", finishOnboarding);
  $("reloadUpdate").addEventListener("click", () => location.reload());
  window.addEventListener("beforeinstallprompt", event => { event.preventDefault(); deferredInstall = event; });
  window.addEventListener("beforeunload", () => { cleanupRecording(); cleanupRoleplay(false); aiRecognition?.abort?.(); });
}

function setupServiceWorker() {
  if (isNativeAndroid() || !("serviceWorker" in navigator) || !location.protocol.startsWith("http")) return;
  const hadController = Boolean(navigator.serviceWorker.controller);
  navigator.serviceWorker.register("sw.js").then(registration => {
    registration.update().catch(() => {});
    registration.addEventListener("updatefound", () => {
      const worker = registration.installing;
      worker?.addEventListener("statechange", () => {
        if (worker.state === "installed" && navigator.serviceWorker.controller) $("updateBanner").hidden = false;
      });
    });
  }).catch(() => {});
  navigator.serviceWorker.addEventListener("controllerchange", () => { if (hadController) $("updateBanner").hidden = false; });
}

function initialize() {
  bindEvents();
  configureRuntimeSurface();
  state.metrics.openings++;
  saveState(false);
  updateAll();
  setupOnboarding();
  setupServiceWorker();
  void ensureNativeAiConnection();
  if ("speechSynthesis" in window) window.speechSynthesis.addEventListener?.("voiceschanged", selectVoice, { once: true });
}

initialize();
