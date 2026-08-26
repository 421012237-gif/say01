const APP_VERSION = "2.6.0";
const BUILD_DATE = "2026-08-26";
const STORAGE_KEY = "xiaobai-english-v2";
const LEGACY_KEY = "xiaobai-english-v1";
const AI_SETTINGS_KEY = "say01-ai-connection-v1";
const REVIEW_INTERVALS = [1, 3, 7, 14, 30];
const DAILY_TARGETS = { 3: 1, 5: 2, 10: 3 };
const STAGE = Object.freeze({ NEW: 0, HEARD: 1, IMITATED: 2, RECALLED: 3, VARIED: 4 });
const INTEREST_LABELS = Object.freeze({ trends: "潮流穿搭", music: "音乐夜生活", creative: "创意展览", daily: "真实日常" });
const APP_AI_DAILY_LIMIT = 20;

// 变化表达只用于用户真正会说的话。通过目标句后，再替换一个现实信息。
const PHRASE_VARIATIONS = {
  "cafe-2": { en: "A tea, please.", zh: "请给我一杯茶。", hint: "把 coffee 换成 tea" },
  "cafe-4": { en: "Hot, please. No sugar.", zh: "请给我热的，不要糖。", hint: "把 iced 换成 hot" },
  "cafe-5": { en: "That's all. Thanks.", zh: "就这些，谢谢。", hint: "用更短的 thanks 收尾" },
  "travel-1": { en: "Excuse me. Where is the bus stop?", zh: "不好意思，公交站在哪里？", hint: "把 station 换成 bus stop" },
  "travel-3": { en: "Thanks for your help.", zh: "谢谢你的帮助。", hint: "把 Thank you 换成 Thanks" },
  "travel-4": { en: "Two tickets, please.", zh: "请给我两张票。", hint: "把 one 换成 two" },
  "travel-5": { en: "How much are they?", zh: "这些多少钱？", hint: "从一个物品换成多个" },
  "social-1": { en: "Hey. I'm {name}.", zh: "嗨，我是{name}。", hint: "把 Hi 换成更轻松的 Hey" },
  "social-3": { en: "What city are you from?", zh: "你来自哪个城市？", hint: "把 where 换成具体问城市" },
  "social-5": { en: "I'm learning English online.", zh: "我正在网上学英语。", hint: "多加一个 online" },
  "shopping-1": { en: "Excuse me. Do you have this in pink?", zh: "不好意思，这款有粉色的吗？", hint: "把 black 换成你喜欢的 pink" },
  "shopping-3": { en: "Large, please.", zh: "请给我大码。", hint: "把 medium 换成 large" },
  "shopping-4": { en: "How much are these?", zh: "这些多少钱？", hint: "从一个商品换成多个" },
  "shopping-5": { en: "I think I'll take it.", zh: "我想我要了。", hint: "加上 I think，让决定更自然" },
  "work-1": { en: "Hey. I'm {name}. I just joined.", zh: "嗨，我是{name}，我刚加入。", hint: "用 just joined 表达刚加入" },
  "work-3": { en: "Could you show me?", zh: "你可以演示给我看吗？", hint: "把 help me 换成 show me" },
  "work-5": { en: "Thanks. I really appreciate it.", zh: "谢谢，我真的很感激。", hint: "加上 really 表达更真诚" },
  "rescue-1": { en: "Sorry. I didn't catch that.", zh: "不好意思，我刚才没听清。", hint: "换一种真实的补救说法" },
  "rescue-2": { en: "Could you speak more slowly?", zh: "你可以说得再慢一点吗？", hint: "用更完整的礼貌问法" },
  "rescue-3": { en: "Could you say that again?", zh: "你可以再说一遍吗？", hint: "把 Can 换成 Could" },
  "rescue-5": { en: "Yes. Exactly.", zh: "对，完全正确。", hint: "用 Exactly 做自然确认" }
};

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
    phraseProgress: {},
    learnedAt: {},
    reviews: {},
    spelling: {},
    aiMemories: [],
    best: 0,
    bestTotal: 0,
    days: [],
    todayKnown: {},
    dailyEvidence: {},
    aiUsageByDate: {},
    lastBackupAt: "",
    lastSeenVersion: "",
    rate: .68,
    metrics: { openings: 0, audioPlays: 0, recordings: 0, comparisons: 0, recognitions: 0, speechChecks: 0, speechPasses: 0, listeningChecks: 0, listeningPasses: 0, recallPasses: 0, variationPasses: 0, skips: 0, roleplays: 0, reviewAnswers: 0, quizzes: 0, spellingAttempts: 0, spellingWins: 0, aiSessions: 0, aiTurns: 0, aiReviews: 0, diagnosticRuns: 0, activeDates: [] },
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
  const rawProgress = merged.phraseProgress && typeof merged.phraseProgress === "object" ? merged.phraseProgress : {};
  merged.phraseProgress = Object.fromEntries(Object.entries(rawProgress).filter(([id]) => validIds.has(id)).map(([id, item]) => [id, {
    stage: Math.max(STAGE.NEW, Math.min(STAGE.VARIED, Number(item?.stage) || STAGE.NEW)),
    attempts: Math.max(0, Math.min(999, Number(item?.attempts) || 0)),
    imitatePasses: Math.max(0, Math.min(99, Number(item?.imitatePasses) || 0)),
    recallPasses: Math.max(0, Math.min(99, Number(item?.recallPasses) || 0)),
    variationPasses: Math.max(0, Math.min(99, Number(item?.variationPasses) || 0)),
    listeningPasses: Math.max(0, Math.min(99, Number(item?.listeningPasses) || 0)),
    firstTryPassed: item?.firstTryPassed === true,
    lastOutcome: ["pass", "understood", "almost", "retry", "uncertain"].includes(item?.lastOutcome) ? item.lastOutcome : "",
    weakWord: String(item?.weakWord || "").replace(/[^a-z'-]/gi, "").slice(0, 30),
    updatedAt: /^\d{4}-\d{2}-\d{2}$/.test(item?.updatedAt || "") ? item.updatedAt : "",
    legacy: item?.legacy === true
  }]));
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
  merged.dailyEvidence = Object.fromEntries(Object.entries(merged.dailyEvidence && typeof merged.dailyEvidence === "object" ? merged.dailyEvidence : {}).filter(([date, values]) => /^\d{4}-\d{2}-\d{2}$/.test(date) && Array.isArray(values)).map(([date, values]) => [date, [...new Set(values.map(value => String(value).slice(0, 80)))].slice(-100)]));
  merged.aiUsageByDate = Object.fromEntries(Object.entries(merged.aiUsageByDate && typeof merged.aiUsageByDate === "object" ? merged.aiUsageByDate : {}).filter(([date]) => /^\d{4}-\d{2}-\d{2}$/.test(date)).map(([date, count]) => [date, Math.max(0, Math.min(1000, Number(count) || 0))]));
  merged.lastBackupAt = /^\d{4}-\d{2}-\d{2}$/.test(merged.lastBackupAt || "") ? merged.lastBackupAt : "";
  merged.lastSeenVersion = String(merged.lastSeenVersion || "").slice(0, 24);
  merged.best = Math.max(0, Math.min(5, Number(merged.best) || 0));
  merged.bestTotal = Math.max(0, Math.min(5, Number(merged.bestTotal) || 0));
  merged.metrics = Object.assign(emptyState().metrics, merged.metrics || {});
  merged.metrics.activeDates = Array.isArray(merged.metrics.activeDates) ? [...new Set(merged.metrics.activeDates)] : [];
  ["openings", "audioPlays", "recordings", "comparisons", "recognitions", "speechChecks", "speechPasses", "listeningChecks", "listeningPasses", "recallPasses", "variationPasses", "skips", "roleplays", "reviewAnswers", "quizzes", "spellingAttempts", "spellingWins", "aiSessions", "aiTurns", "aiReviews", "diagnosticRuns"].forEach(key => { merged.metrics[key] = Math.max(0, Math.min(1000000, Number(merged.metrics[key]) || 0)); });
  merged.migrations = Array.isArray(merged.migrations) ? merged.migrations.slice(-20) : [];
  if (merged.profile) {
    merged.profile.name = cleanName(merged.profile.name) || "Alex";
    merged.profile.goal = courseOrders[merged.profile.goal] ? merged.profile.goal : "daily";
    merged.profile.minutes = [3, 5, 10].includes(Number(merged.profile.minutes)) ? Number(merged.profile.minutes) : 5;
    merged.profile.interest = INTEREST_LABELS[merged.profile.interest] ? merged.profile.interest : "trends";
  }
  merged.known.forEach(id => {
    if (!merged.phraseProgress[id]) merged.phraseProgress[id] = { stage: STAGE.NEW, attempts: 0, imitatePasses: 0, recallPasses: 0, variationPasses: 0, listeningPasses: 0, firstTryPassed: false, lastOutcome: "", weakWord: "", updatedAt: "", legacy: true };
    if (!merged.learnedAt[id]) merged.learnedAt[id] = localDateKey();
    if (!merged.reviews[id]) merged.reviews[id] = { level: 0, due: addDays(localDateKey(), 1) };
  });
  Object.entries(merged.phraseProgress).forEach(([id, progress]) => {
    const ref = phraseRefById(id);
    const required = ref?.line?.speaker === "YOU" ? STAGE.RECALLED : STAGE.HEARD;
    if (progress.stage >= required && !merged.known.includes(id)) merged.known.push(id);
  });
  return merged;
}

function migrateLegacy() {
  try {
    const legacy = JSON.parse(localStorage.getItem(LEGACY_KEY));
    if (!legacy) return null;
    const next = emptyState();
    next.profile = { name: "Alex", goal: "daily", minutes: 5, interest: "trends" };
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
let speechCheckSerial = 0;
let browserSpeechCheck = null;
let activeOriginalAudio = null;
let practiceMode = "imitate";
let audioPlayedForCurrent = false;
let listeningUnlockedForCurrent = false;
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
let aiInputWasSpeech = false;
let activeAiVoiceButton = null;
let aiVoiceAvailable = null;
let currentAiReviewId = null;
let deferredInstall = null;
let toastTimer = null;
let diagnosticText = "";

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
  markActive();
}

function orderedScenes() {
  const order = courseOrders[state.profile?.goal || "daily"];
  return order.map(sceneById);
}

function blankPhraseProgress() {
  return { stage: STAGE.NEW, attempts: 0, imitatePasses: 0, recallPasses: 0, variationPasses: 0, listeningPasses: 0, firstTryPassed: false, lastOutcome: "", weakWord: "", updatedAt: "", legacy: false };
}

function progressFor(id) {
  if (!state.phraseProgress[id]) state.phraseProgress[id] = blankPhraseProgress();
  return state.phraseProgress[id];
}

function isUserLine(refOrLine) {
  const line = refOrLine?.line || refOrLine;
  return line?.speaker === "YOU";
}

function requiredStage(refOrLine) {
  return isUserLine(refOrLine) ? STAGE.RECALLED : STAGE.HEARD;
}

function taskCompleted(ref) {
  return progressFor(ref.line.id).stage >= requiredStage(ref);
}

function taskMastered(ref) {
  return progressFor(ref.line.id).stage >= (isUserLine(ref) && PHRASE_VARIATIONS[ref.line.id] ? STAGE.VARIED : requiredStage(ref));
}

function completedSceneCount() {
  return scenes.filter(scene => scene.lines.every((line, index) => taskMastered({ scene, line, index }))).length;
}

function abilityCounts() {
  const refs = allPhraseRefs();
  return {
    heard: refs.filter(ref => !isUserLine(ref) && progressFor(ref.line.id).stage >= STAGE.HEARD).length,
    imitated: refs.filter(ref => isUserLine(ref) && progressFor(ref.line.id).stage >= STAGE.IMITATED).length,
    recalled: refs.filter(ref => isUserLine(ref) && progressFor(ref.line.id).stage >= STAGE.RECALLED).length,
    varied: refs.filter(ref => isUserLine(ref) && progressFor(ref.line.id).stage >= STAGE.VARIED).length
  };
}

function markActive() {
  const today = localDateKey();
  if (!state.days.includes(today)) state.days.push(today);
  if (!state.metrics.activeDates.includes(today)) state.metrics.activeDates.push(today);
}

function registerEvidence(id, stage) {
  const today = localDateKey();
  state.dailyEvidence[today] = state.dailyEvidence[today] || [];
  const key = `${id}:${stage}`;
  if (!state.dailyEvidence[today].includes(key)) state.dailyEvidence[today].push(key);
  markActive();
}

function recordCapability(ref, stage, details = {}) {
  const progress = progressFor(ref.line.id);
  const previous = progress.stage;
  progress.attempts = Math.min(999, progress.attempts + (details.attempt === false ? 0 : 1));
  progress.lastOutcome = details.outcome || progress.lastOutcome;
  progress.weakWord = details.weakWord || "";
  if (details.firstTryPassed === true) progress.firstTryPassed = true;
  if (stage === STAGE.HEARD && !isUserLine(ref)) progress.listeningPasses = Math.min(99, progress.listeningPasses + 1);
  if (stage === STAGE.IMITATED) progress.imitatePasses = Math.min(99, progress.imitatePasses + 1);
  if (stage === STAGE.RECALLED) progress.recallPasses = Math.min(99, progress.recallPasses + 1);
  if (stage === STAGE.VARIED) progress.variationPasses = Math.min(99, progress.variationPasses + 1);
  progress.stage = Math.max(progress.stage, stage);
  progress.updatedAt = localDateKey();
  progress.legacy = false;
  // 每天同一能力最多记一次；复习时再次真实开口也算当天证据，不只记录首次升级。
  registerEvidence(ref.line.id, stage);

  if (progress.stage >= requiredStage(ref) && !state.known.includes(ref.line.id)) {
    state.known.push(ref.line.id);
    state.learnedAt[ref.line.id] = localDateKey();
    state.reviews[ref.line.id] = { level: 0, due: addDays(localDateKey(), 1) };
  }
}

function dailyGoal() { return DAILY_TARGETS[state.profile?.minutes || 5] || 2; }

function dailyEvidenceCount(date = localDateKey()) {
  return new Set((state.dailyEvidence[date] || []).filter(value => /:(2|3|4)$/.test(value))).size;
}

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
  return Object.entries(state.dailyEvidence).filter(([date]) => date >= start && date <= localDateKey()).flatMap(([, values]) => values).filter(value => /:(2|3|4)$/.test(value)).length;
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
    const index = scene.lines.findIndex((line, index) => !taskCompleted({ scene, line, index }));
    if (index >= 0) return { scene, line: scene.lines[index], index };
  }
  return dueRefs()[0] || { scene: orderedScenes()[0], line: orderedScenes()[0].lines[0], index: 0 };
}

function nextUserPhraseRef() {
  for (const scene of orderedScenes()) {
    const index = scene.lines.findIndex((line, index) => isUserLine(line) && progressFor(line.id).stage < STAGE.RECALLED);
    if (index >= 0) return { scene, line: scene.lines[index], index };
  }
  return nextPhraseRef();
}

function updateAll() {
  const today = localDateKey();
  const todayCount = dailyEvidenceCount(today);
  const target = dailyGoal();
  const due = dueRefs().length + dueAiMemories().length;
  const weekCount = weeklyKnownCount();
  const next = nextPhraseRef();
  const nextOutput = nextUserPhraseRef();
  const counts = abilityCounts();
  const nextIncompleteScene = orderedScenes().find(scene => !scene.lines.every((line, index) => taskCompleted({ scene, line, index }))) || orderedScenes()[0];

  $("streakCount").textContent = streakCount();
  $("minutesLabel").textContent = `${state.profile?.minutes || 5} MIN`;
  $("missionNumber").textContent = String(counts.recalled + 1).padStart(2, "0");
  $("heroEnglish").textContent = displayText(nextOutput.line.en);
  $("heroChinese").textContent = displayText(nextOutput.line.zh);
  $("heroSpellEcho").textContent = `${INTEREST_LABELS[state.profile?.interest || "trends"]} · YOUR TURN`;
  $("continueBtn").dataset.scene = next.scene.id;
  $("continueBtn").dataset.phrase = next.index;
  $("continueBtn").textContent = counts.recalled ? "继续今天的真实开口 →" : "第一步 · 先听对方再开口 →";
  $("dailyGoalLabel").textContent = `目标 ${target} 次真实开口`;
  $("todayProgressText").textContent = `${Math.min(todayCount, target)} / ${target}`;
  $("todayProgressFill").style.width = `${Math.min(todayCount / target * 100, 100)}%`;
  $("dueCount").textContent = due;
  $("weekKnown").textContent = weekCount;
  $("quizBest").textContent = state.best ? `${state.best}/${state.bestTotal || 5}` : "—";
  renderWeekDots(weekCount);
  $("weeklyCopy").textContent = weekCount >= 8 ? "本周真实开口目标完成。挑一句放进 AI 对话。" : `再完成 ${Math.max(0, 8 - weekCount)} 次有效开口，不靠点下一句刷进度。`;
  $("nextSceneNumber").textContent = String(orderedScenes().indexOf(nextIncompleteScene) + 1).padStart(2, "0");
  $("nextSceneTitle").textContent = nextIncompleteScene.title;
  $("nextSceneDesc").textContent = nextIncompleteScene.desc;
  $("nextSceneBtn").dataset.scene = nextIncompleteScene.id;

  $("reviewDueLarge").textContent = due;
  $("reviewKnownLarge").textContent = counts.recalled;
  $("reviewNextLarge").textContent = nextReviewLabel();
  $("profileKnown").textContent = counts.heard;
  $("profileDone").textContent = completedSceneCount();
  $("profileSpelling").textContent = counts.varied;
  $("profileReview").textContent = counts.recalled;
  $("profileRecordings").textContent = counts.imitated;
  $("localMetrics").textContent = `真实能力：听懂对方 ${counts.heard} 句 · 跟读通过 ${counts.imitated} 句 · 脱稿说出 ${counts.recalled} 句 · 变化表达 ${counts.varied} 句。过程记录：播放 ${state.metrics.audioPlays} 次 · 语音判断 ${state.metrics.speechChecks} 次 · 跳过 ${state.metrics.skips} 次 · AI ${state.metrics.aiTurns} 回合 · 有效学习 ${state.metrics.activeDates.length} 天。重复点击和原始识别文字不计入掌握。`;

  if (state.profile) {
    $("profileName").value = state.profile.name;
    $("goalSelect").value = state.profile.goal;
    $("minutesSelect").value = String(state.profile.minutes);
    $("interestSelect").value = state.profile.interest || "trends";
  }
  $("rateSelect").value = String(state.rate || .68);
  $("appVersionLabel").textContent = `V${APP_VERSION}`;
  $("buildDateLabel").textContent = BUILD_DATE;
  $("backupStatus").textContent = state.lastBackupAt
    ? `最近一次导出：${state.lastBackupAt}。覆盖安装通常保留；卸载前仍建议再导出一次。`
    : (state.metrics.activeDates.length >= 3 ? "你已经有连续学习证据，建议现在导出一次；卸载 App 会丢失本机记录。" : "开始形成能力记录后，这里会提醒你备份。 ");
  renderAiMemoryReview();
  renderAiConnectionStatus();
  renderLessonList();
}

function renderWeekDots(count) {
  $("weekDots").innerHTML = Array.from({ length: 8 }, (_, index) => `<span class="week-dot ${index < count ? "filled" : ""}" aria-hidden="true"></span>`).join("");
  $("weekDots").setAttribute("aria-label", `本周已完成 ${count} 次有效开口，目标 8 次`);
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
    const completed = scene.lines.filter((line, index) => taskCompleted({ scene, line, index })).length;
    const mastered = scene.lines.filter((line, index) => taskMastered({ scene, line, index })).length;
    const done = mastered === scene.lines.length;
    return `<button class="lesson-card ${done ? "done" : ""}" type="button" data-scene="${scene.id}"><span class="lesson-icon">${done ? "✓" : String(orderIndex + 1).padStart(2, "0")}</span><span><h3>${scene.title}</h3><p>${scene.desc} · 完成 ${completed}/${scene.lines.length} · 稳定 ${mastered}/${scene.lines.length}</p></span><span class="lesson-status">${done ? "✓" : "›"}</span></button>`;
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
  const ref = { scene, line, index: currentPhraseIndex };
  const progress = progressFor(line.id);
  const userTurn = isUserLine(line);
  practiceMode = "imitate";
  audioPlayedForCurrent = progress.stage >= STAGE.IMITATED;
  listeningUnlockedForCurrent = progress.stage >= STAGE.HEARD;
  $("lessonNumber").textContent = `SCENE ${String(orderedScenes().indexOf(scene) + 1).padStart(2, "0")}`;
  $("lessonName").textContent = scene.title;
  $("lessonStep").textContent = `${currentPhraseIndex + 1} / ${scene.lines.length}`;
  $("lessonContext").textContent = scene.context;
  $("speakerBadge").textContent = line.speaker;
  $("phraseIndex").textContent = `LINE ${String(currentPhraseIndex + 1).padStart(2, "0")}`;
  $("phraseTaskType").textContent = userTurn ? "YOUR TURN / 轮到你开口" : "LISTEN FIRST / 先听懂对方";
  $("lessonSteps").innerHTML = userTurn
    ? "<span><b>1</b>听示范</span><span><b>2</b>跟读检查</span><span><b>3</b>隐藏英文说</span>"
    : "<span><b>1</b>听对方</span><span><b>2</b>选主要意思</span><span><b>3</b>继续</span>";
  $("capabilityStatus").textContent = capabilityStageLabel(ref);
  $("capabilityEvidence").textContent = capabilityEvidenceCopy(ref);
  $("phraseEnglish").classList.toggle("concealed-text", userTurn ? !audioPlayedForCurrent : !listeningUnlockedForCurrent);
  $("phraseEnglish").textContent = userTurn
    ? (audioPlayedForCurrent ? displayText(line.en) : "先听声音，不看英文")
    : (listeningUnlockedForCurrent ? displayText(line.en) : "先听对方，再选主要意思");
  $("phraseChinese").textContent = userTurn
    ? displayText(line.zh)
    : (listeningUnlockedForCurrent ? displayText(line.zh) : "字幕会在听懂后出现");
  $("phrasePronounce").textContent = `近似音：${displayText(line.pron)}`;
  $("phraseRhythm").innerHTML = line.rhythm.map(part => `<span class="${/[A-Z]{2}/.test(part) ? "stress" : ""}">${escapeHtml(displayText(part))}</span>`).join("");
  $("phraseWhen").textContent = line.when;
  $("phraseMission").textContent = personalizedMission(ref);
  $("prevPhrase").textContent = currentPhraseIndex ? "← 上一句" : "← 场景表";
  $("knownBtn").disabled = !taskCompleted(ref);
  $("knownBtn").textContent = taskCompleted(ref)
    ? (!userTurn ? "听懂主要意思 · 下一句 →" : (taskMastered(ref) ? "已经能真实使用 · 下一句 →" : "本次通过 · 下一句 →"))
    : (userTurn ? "脱稿说出后继续 →" : "选对主要意思后继续 →");
  $("audioStatus").textContent = ["social-1", "work-1"].includes(line.id) ? "示范会在名字处停一下，轮到你说自己的名字" : "等待播放";
  $("pronunciationDetails").open = false;
  $("recordPanel").hidden = !userTurn;
  $("listeningCheck").hidden = userTurn;
  $("speechNextActions").hidden = true;
  $("variationCue").hidden = true;
  $("openMicSettings").hidden = true;
  if (userTurn) {
    $("recordTitle").textContent = progress.stage >= STAGE.IMITATED ? "现在不看英文，再说一次" : "说一句，马上知道手机有没有听清";
    $("recognizeBtn").textContent = progress.stage >= STAGE.IMITATED ? "🎙 先跟读检查" : "🎙 说一句 · 马上判断";
    renderSpeechNextActions(ref);
  } else {
    renderListeningCheck(ref);
  }
  renderSpelling(ref);
  renderTranscript(scene);
}

function capabilityStageLabel(ref) {
  const stage = progressFor(ref.line.id).stage;
  if (!isUserLine(ref)) return stage >= STAGE.HEARD ? "已听懂主要意思 ✓" : "等待听力判断";
  if (stage >= STAGE.VARIED) return "已经会变化表达 ✓";
  if (stage >= STAGE.RECALLED) return "已经能脱稿说出 ✓";
  if (stage >= STAGE.IMITATED) return "跟读已被手机听清";
  if (progressFor(ref.line.id).legacy) return "旧版接触过 · 需要重新验证";
  return "先听，再开口";
}

function capabilityEvidenceCopy(ref) {
  const progress = progressFor(ref.line.id);
  if (!isUserLine(ref)) return progress.stage >= STAGE.HEARD ? "不是背台词：你已经抓住对方意图" : "先听声音，再选对方主要意思";
  if (progress.stage >= STAGE.VARIED) return "已完成跟读、脱稿和替换真实信息";
  if (progress.stage >= STAGE.RECALLED) return "本次可以继续；再变化一次才算稳定使用";
  if (progress.stage >= STAGE.IMITATED) return "下一步隐藏英文，证明不是照着读";
  return "完整英文会在听完示范后出现";
}

function personalizedMission(ref) {
  const base = ref.line.mission;
  const interest = state.profile?.interest || "trends";
  const extras = {
    trends: "把其中一个词换成你真的会在潮流店里用的信息。",
    music: "想象在音乐现场或和新朋友聊天时把它说出来。",
    creative: "想象在展览、工作室或创意活动中自然接上这句。",
    daily: "今天遇到相似画面时，在心里不看提示说一次。"
  };
  return `${base} ${extras[interest]}`;
}

function renderListeningCheck(ref) {
  const complete = progressFor(ref.line.id).stage >= STAGE.HEARD;
  $("listeningFeedback").textContent = complete ? "主要意思已经听懂，可以继续。" : (audioPlayedForCurrent ? "选一个最接近的意思。" : "先点上面的粉色播放按钮。");
  if (complete) {
    $("listeningOptions").innerHTML = `<button type="button" class="choice correct" disabled>${escapeHtml(displayText(ref.line.zh))}</button>`;
    return;
  }
  const alternatives = shuffled(allPhraseRefs().filter(item => item.line.id !== ref.line.id).map(item => displayText(item.line.zh)).filter((value, index, list) => list.indexOf(value) === index)).slice(0, 2);
  const options = shuffled([displayText(ref.line.zh), ...alternatives]);
  $("listeningOptions").innerHTML = options.map(value => `<button class="choice" type="button" data-listening-correct="${value === displayText(ref.line.zh)}" ${audioPlayedForCurrent ? "" : "disabled"}>${escapeHtml(value)}</button>`).join("");
  $("listeningOptions").querySelectorAll("[data-listening-correct]").forEach(button => button.addEventListener("click", () => answerListening(ref, button)));
}

function answerListening(ref, button) {
  state.metrics.listeningChecks++;
  const progress = progressFor(ref.line.id);
  const firstTry = progress.attempts === 0;
  if (button.dataset.listeningCorrect !== "true") {
    progress.attempts = Math.min(999, progress.attempts + 1);
    progress.lastOutcome = "retry";
    progress.updatedAt = localDateKey();
    button.disabled = true;
    button.classList.add("wrong");
    $("listeningFeedback").textContent = "不是这个意思。再听一次，只抓最重要的两个词。";
    markActive();
    saveState(false);
    return;
  }
  state.metrics.listeningPasses++;
  recordCapability(ref, STAGE.HEARD, { outcome: "pass", firstTryPassed: firstTry });
  listeningUnlockedForCurrent = true;
  saveState(false);
  renderPhrase();
  toast("听懂的是对方意图，不要求你背对方台词。");
}

function renderSpeechNextActions(ref) {
  const progress = progressFor(ref.line.id);
  const variation = PHRASE_VARIATIONS[ref.line.id];
  $("speechNextActions").hidden = progress.stage < STAGE.IMITATED;
  $("startRecallBtn").hidden = progress.stage < STAGE.IMITATED || progress.stage >= STAGE.RECALLED;
  $("startVariationBtn").hidden = !variation || progress.stage < STAGE.RECALLED || progress.stage >= STAGE.VARIED;
}

function renderSpelling(ref) {
  const focus = spellingFocus(ref);
  const progress = progressFor(ref.line.id);
  const needsRepair = isUserLine(ref) && focus && (progress.attempts >= 2 || progress.weakWord === focus.word || (state.spelling[ref.line.id]?.attempts || 0) > 0);
  if (!needsRepair) { $("spellLock").hidden = true; return; }
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

async function stopAllPlayback() {
  if (activeOriginalAudio) {
    const audio = activeOriginalAudio;
    activeOriginalAudio = null;
    audio.pause();
    audio.removeAttribute("src");
  }
  try { await nativeAudioPlugin()?.stop?.(); } catch {}
  if ("speechSynthesis" in window) speechSynthesis.cancel();
  try { await stopAiVoice(); } catch {}
  const playback = $("recordingPlayback");
  if (playback && !playback.paused) playback.pause();
}

function waitMs(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function speakCurrent(rate) {
  const scene = sceneById(currentSceneId);
  const ref = { scene, line: scene.lines[currentPhraseIndex], index: currentPhraseIndex };
  const controls = [$("lessonStartAudio"), $("slowSoundBtn"), $("normalSoundBtn")];
  controls.forEach(button => { button.disabled = true; button.classList.add("is-playing"); });
  $("audioStatus").textContent = "🔊 正在播放…如果没听到，请先按手机侧边音量＋";
  const played = await playOriginal(ref, rate, true);
  if (played) {
    markActive();
    saveState(false);
    audioPlayedForCurrent = true;
    if (isUserLine(ref)) {
      $("phraseEnglish").textContent = displayText(ref.line.en);
      $("phraseEnglish").classList.remove("concealed-text");
      $("capabilityEvidence").textContent = progressFor(ref.line.id).stage >= STAGE.IMITATED ? capabilityEvidenceCopy(ref) : "现在跟着示范说一次；通过后还要隐藏英文再说";
    } else {
      renderListeningCheck(ref);
    }
  }
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
  markActive();
  saveState();
}

function cleanupRecording() {
  speechCheckSerial++;
  if (browserSpeechCheck) {
    try { browserSpeechCheck.abort(); } catch {}
    browserSpeechCheck = null;
  }
  if ($("recognizeBtn")?.classList.contains("listening")) {
    window.Capacitor?.Plugins?.SaySpeechCheck?.cancel?.().catch(() => {});
  }
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
    $("recognizeBtn").disabled = false;
    $("recognizeBtn").classList.remove("listening");
    $("recognizeBtn").textContent = "🎙 说一句 · 马上判断";
    $("recognitionResult").textContent = "声音可能由手机提供的语音识别服务联网处理；十一说不保存录音和识别文字。";
    $("speechFeedback").hidden = true;
    $("speechFeedback").className = "speech-feedback";
    $("speechWordDiff").replaceChildren();
    $("speechOutcome").textContent = "";
    $("speechNextStep").textContent = "";
    $("speechNextActions").hidden = true;
    $("variationCue").hidden = true;
    $("openMicSettings").hidden = true;
    $("knownBtn")?.classList.remove("speech-ready");
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
  const ref = currentSpeechRef();
  if (value === "close" && recordingUrl && isUserLine(ref)) {
    const stage = practiceMode === "variation" ? STAGE.VARIED : practiceMode === "recall" ? STAGE.RECALLED : STAGE.IMITATED;
    recordCapability(ref, stage, { outcome: "understood" });
    if (stage === STAGE.RECALLED) state.metrics.recallPasses++;
    if (stage === STAGE.VARIED) state.metrics.variationPasses++;
    saveState(false);
    $("capabilityStatus").textContent = capabilityStageLabel(ref);
    $("capabilityEvidence").textContent = `${capabilityEvidenceCopy(ref)} · 本次来自你的诚实自评`;
    $("knownBtn").disabled = !taskCompleted(ref);
    $("knownBtn").textContent = taskCompleted(ref) ? "诚实自评通过 · 下一句 →" : "脱稿说出后继续 →";
    renderSpeechNextActions(ref);
  } else if (value === "again" && state.known.includes(ref.line.id)) {
    const review = state.reviews[ref.line.id] || { level: 0, due: addDays(localDateKey(), 1) };
    review.due = addDays(localDateKey(), 1);
    review.selfGrade = value;
    state.reviews[ref.line.id] = review;
    saveState(false);
  }
  toast(value === "again" ? "已安排明天再练，不需要现在硬撑。" : "已按你的诚实自评记录；没有冒充专业发音分。");
}

function nativeSpeechCheckPlugin() {
  return isNativeAndroid() ? window.Capacitor?.Plugins?.SaySpeechCheck : null;
}

function speechCheckErrorMessage(error) {
  const code = String(error?.message || error || "").toUpperCase();
  if (code.includes("PERMISSION") || code.includes("NOT-ALLOWED")) return "没有获得麦克风权限。允许后再点一次；拒绝也不影响其他学习。";
  if (code.includes("NO_MATCH")) return "这次没有听清。离手机近一点，慢慢说一遍就好。";
  if (code.includes("TIMEOUT") || code.includes("NO-SPEECH")) return "没有听到完整句子。点一下按钮后再开始说。";
  if (code.includes("NETWORK")) return "手机语音识别暂时连不上网络；固定课程和录音回放仍可使用。";
  if (code.includes("BUSY")) return "手机还在处理上一遍，等一秒再试。";
  if (code.includes("UNAVAILABLE") || code.includes("NOT-SUPPORTED")) return "这台手机没有可用的语音识别服务；可以继续使用下面的录音对比。";
  return "这次没有识别成功。可以再试一次，或使用下面的录音对比。";
}

function currentSpeechRef() {
  const scene = sceneById(currentSceneId);
  return { scene, line: scene.lines[currentPhraseIndex], index: currentPhraseIndex };
}

function currentSpeechTarget(ref) {
  if (practiceMode === "variation" && PHRASE_VARIATIONS[ref.line.id]) return displayText(PHRASE_VARIATIONS[ref.line.id].en);
  return displayText(ref.line.en);
}

function renderSpeechEvaluation(evaluation, confidence = -1) {
  const ref = currentSpeechRef();
  const feedback = $("speechFeedback");
  feedback.hidden = false;
  const lowConfidence = confidence >= 0 && confidence < 0.35;
  const outcome = lowConfidence ? "uncertain" : evaluation.outcome;
  feedback.className = `speech-feedback ${outcome}`;
  $("recognitionResult").textContent = `手机听到：${evaluation.transcript || "—"}`;
  $("speechWordDiff").replaceChildren(...evaluation.words.map(item => {
    const token = document.createElement("span");
    token.className = item.status;
    token.textContent = item.word;
    return token;
  }));

  const passed = !lowConfidence && ["pass", "understood"].includes(evaluation.outcome);
  if (lowConfidence) {
    $("speechOutcome").textContent = "这次判断不确定";
    $("speechNextStep").textContent = "系统识别置信度太低，不把它算成通过。离手机近一点，再说一次。";
  } else if (passed && practiceMode === "variation") {
    $("speechOutcome").textContent = "变化表达完成 ✓";
    $("speechNextStep").textContent = "你不是背答案，而是已经会替换真实信息。";
  } else if (passed && practiceMode === "recall") {
    $("speechOutcome").textContent = "不看英文也说出来了 ✓";
    $("speechNextStep").textContent = PHRASE_VARIATIONS[ref.line.id] ? "本次已经能继续；再换一个真实信息，就升级为稳定使用。" : "这句已经有主动回忆证据，可以继续。";
  } else if (evaluation.outcome === "pass") {
    $("speechOutcome").textContent = "手机听清了这次跟读 ✓";
    $("speechNextStep").textContent = "这还不是掌握。下一步隐藏英文，再说一次。";
  } else if (evaluation.outcome === "understood") {
    $("speechOutcome").textContent = "核心意思听清了 ✓";
    $("speechNextStep").textContent = "不追求播音腔。现在隐藏英文，再证明自己不是照着读。";
  } else if (evaluation.outcome === "almost") {
    $("speechOutcome").textContent = evaluation.focusWord ? `差一个关键点：${evaluation.focusWord}` : "已经接近了，再慢一点";
    $("speechNextStep").textContent = evaluation.focusWord ? `点上面的“听慢速”，只盯住粉色的 ${evaluation.focusWord}，然后再说一次。` : "点上面的“听慢速”，再说一次。";
  } else {
    $("speechOutcome").textContent = "这次还没听完整";
    $("speechNextStep").textContent = evaluation.focusWord ? `先只练粉色的 ${evaluation.focusWord}，再放回整句。` : "先听一遍慢速示范，再说短一点也可以。";
  }

  state.metrics.speechChecks++;
  state.metrics.recognitions++;
  const progress = progressFor(ref.line.id);
  if (passed) {
    state.metrics.speechPasses++;
    if (practiceMode === "variation") {
      state.metrics.variationPasses++;
      recordCapability(ref, STAGE.VARIED, { outcome, weakWord: "", firstTryPassed: progress.attempts === 0 });
    } else if (practiceMode === "recall") {
      state.metrics.recallPasses++;
      recordCapability(ref, STAGE.RECALLED, { outcome, weakWord: "", firstTryPassed: progress.attempts === 0 });
    } else {
      recordCapability(ref, STAGE.IMITATED, { outcome, weakWord: "", firstTryPassed: progress.attempts === 0 });
    }
  } else {
    progress.attempts = Math.min(999, progress.attempts + 1);
    progress.lastOutcome = outcome;
    progress.weakWord = evaluation.focusWord || "";
    progress.updatedAt = localDateKey();
    markActive();
  }
  saveState(false);
  $("capabilityStatus").textContent = capabilityStageLabel(ref);
  $("capabilityEvidence").textContent = capabilityEvidenceCopy(ref);
  $("knownBtn").disabled = !taskCompleted(ref);
  $("knownBtn").textContent = taskCompleted(ref) ? (taskMastered(ref) ? "已经能真实使用 · 下一句 →" : "本次通过 · 下一句 →") : "脱稿说出后继续 →";
  renderSpeechNextActions(ref);
  renderSpelling(ref);
  updateAll();
}

function browserSpeechResult(serial) {
  const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!Recognition) return Promise.reject(new Error("SPEECH_RECOGNIZER_UNAVAILABLE"));
  return new Promise((resolve, reject) => {
    const recognition = new Recognition();
    browserSpeechCheck = recognition;
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = event => {
      if (serial !== speechCheckSerial) return;
      const alternatives = Array.from(event.results[0], item => item.transcript).filter(Boolean);
      browserSpeechCheck = null;
      resolve({ transcript: alternatives[0] || "", alternatives, confidence: Number(event.results[0]?.[0]?.confidence ?? -1) });
    };
    recognition.onerror = event => {
      browserSpeechCheck = null;
      reject(new Error(String(event.error || "SPEECH_SERVICE_ERROR")));
    };
    recognition.onend = () => { if (browserSpeechCheck === recognition) browserSpeechCheck = null; };
    recognition.start();
  });
}

async function startSpeechRecognition() {
  if (!window.SaySpeechCheck?.evaluate) {
    $("recognitionResult").textContent = "判断模块还没有加载完成，请关闭 App 后重开一次。";
    return;
  }
  const serial = ++speechCheckSerial;
  const ref = currentSpeechRef();
  const { scene, line } = ref;
  if (!isUserLine(ref)) return;
  if (practiceMode === "imitate" && !audioPlayedForCurrent) {
    $("recognitionResult").textContent = "先点上面的粉色播放按钮听一遍，再开始跟说。";
    $("lessonStartAudio").scrollIntoView({ block: "center", behavior: "smooth" });
    return;
  }
  const target = currentSpeechTarget(ref);
  const button = $("recognizeBtn");
  button.disabled = true;
  button.classList.add("listening");
  button.textContent = "正在准备麦克风…";
  $("recognitionResult").textContent = "正在停止 App 自己的声音，避免把示范音算成你的回答。";
  $("speechFeedback").hidden = true;

  try {
    await stopAllPlayback();
    await waitMs(420);
    button.textContent = "正在听…说完停一下";
    $("recognitionResult").textContent = practiceMode === "imitate" ? "现在跟着刚才的示范说。正常说完即可，不需要喊。" : "现在不看英文说出来；说完停一下。";
    const plugin = nativeSpeechCheckPlugin();
    const result = plugin ? await plugin.check({ language: "en-US", maxResults: 1 }) : await browserSpeechResult(serial);
    if (serial !== speechCheckSerial || currentSceneId !== scene.id || scene.lines[currentPhraseIndex]?.id !== line.id) return;
    const ignoreWords = line.en.includes("{name}") ? [state.profile?.name || "Alex"] : [];
    // 只用系统第一候选，避免从多个候选里挑最像答案的一项制造乐观结果。
    renderSpeechEvaluation(window.SaySpeechCheck.evaluate(target, [result.transcript], { ignoreWords }), Number(result.confidence ?? -1));
  } catch (error) {
    if (serial !== speechCheckSerial || String(error?.message || error).includes("SPEECH_CANCELLED")) return;
    $("recognitionResult").textContent = speechCheckErrorMessage(error);
    const code = String(error?.message || error).toUpperCase();
    $("openMicSettings").hidden = !isNativeAndroid() || !(code.includes("PERMISSION") || code.includes("NOT-ALLOWED"));
  } finally {
    if (serial === speechCheckSerial) {
      button.disabled = false;
      button.classList.remove("listening");
      button.textContent = practiceMode === "variation" ? "🎙 说出变化后的句子" : practiceMode === "recall" ? "🎙 不看英文 · 再说一次" : "🎙 再说一次 · 重新判断";
    }
  }
}

function startRecallMode() {
  const ref = currentSpeechRef();
  practiceMode = "recall";
  $("phraseEnglish").textContent = "英文已经隐藏 · 先自己想起来";
  $("phraseEnglish").classList.add("concealed-text");
  $("variationCue").hidden = true;
  $("speechFeedback").hidden = true;
  $("speechNextActions").hidden = true;
  $("recognitionResult").textContent = `只看中文“${displayText(ref.line.zh)}”，不看英文说一次。`;
  $("recognizeBtn").textContent = "🎙 不看英文 · 现在说";
  $("recognizeBtn").scrollIntoView({ block: "center", behavior: "smooth" });
}

function startVariationMode() {
  const ref = currentSpeechRef();
  const variation = PHRASE_VARIATIONS[ref.line.id];
  if (!variation) return;
  practiceMode = "variation";
  $("phraseEnglish").textContent = "换一个真实信息 · 英文不显示";
  $("phraseEnglish").classList.add("concealed-text");
  $("variationChinese").textContent = displayText(variation.zh);
  $("variationHint").textContent = variation.hint;
  $("variationCue").hidden = false;
  $("speechFeedback").hidden = true;
  $("speechNextActions").hidden = true;
  $("recognitionResult").textContent = "根据粉色提示换一个信息，不要重复背原句。";
  $("recognizeBtn").textContent = "🎙 说出变化后的句子";
  $("recognizeBtn").scrollIntoView({ block: "center", behavior: "smooth" });
}

function advanceCurrentPhrase() {
  const scene = sceneById(currentSceneId);
  const line = scene.lines[currentPhraseIndex];
  const ref = { scene, line, index: currentPhraseIndex };
  if (!taskCompleted(ref)) {
    toast(isUserLine(ref) ? "先完成一次不看英文的开口；也可以明确选择跳过。" : "先听声音并选对主要意思；也可以明确选择跳过。");
    const target = isUserLine(ref) ? $("recordPanel") : $("listeningCheck");
    target.scrollIntoView({ block: "center", behavior: "smooth" });
    return;
  }
  if (currentPhraseIndex < scene.lines.length - 1) {
    currentPhraseIndex++;
    renderPhrase();
  } else {
    toast(completedSceneCount() ? "这个场景有真实能力证据了。下一次进入 AI 处理变化。" : "本轮场景走完了；未稳定的句子会在复习里回来。");
    showLessonIndex();
  }
}

function skipCurrentPhrase() {
  const scene = sceneById(currentSceneId);
  const line = scene.lines[currentPhraseIndex];
  state.metrics.skips++;
  markActive();
  saveState(false);
  toast("已跳过，不计入掌握，也不会偷偷增加进度。");
  if (currentPhraseIndex < scene.lines.length - 1) {
    currentPhraseIndex++;
    renderPhrase();
  } else {
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
    ? "十一说已经连好 qwen3.7-plus；Mia 少女声直接在手机本地生成。你只需确认联网说明，之后直接进入现实场景。"
    : "qwen3.7-plus 负责接话，Mia 少女声在手机本地生成。长期 API Key 只放在你的服务端，不进入网页或 APK。";
  const voiceTestButton = $("testLocalVoice");
  const localVoiceReady = Boolean(localAiVoicePlugin()?.speak);
  voiceTestButton.disabled = !localVoiceReady;
  voiceTestButton.dataset.idleLabel = localVoiceReady ? "▶ 先试听本地 Mia 少女声" : "本地少女声仅 Android APK 可用";
  voiceTestButton.textContent = voiceTestButton.dataset.idleLabel;
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
  aiInputWasSpeech = false;
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
  $("aiStatus").textContent = `轮到你。可以打字，也可以点“说给 AI 听” · 今日还可用 ${Math.max(0, APP_AI_DAILY_LIMIT - aiTurnsToday())} 回合。`;
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

function localAiVoicePlugin() {
  return window.Capacitor?.Plugins?.SayLocalVoice || null;
}

function resetAiVoiceButton(button) {
  if (!button) return;
  button.classList.remove("playing");
  button.textContent = button.dataset.idleLabel || "▶ 再听一次";
}

async function stopAiVoice() {
  const plugin = localAiVoicePlugin();
  try { await plugin?.stop?.(); } catch {}
  activeAiVoiceButton = null;
  document.querySelectorAll(".ai-voice-button.playing").forEach(button => {
    resetAiVoiceButton(button);
  });
  const setupButton = $("testLocalVoice");
  if (setupButton?.classList.contains("playing")) resetAiVoiceButton(setupButton);
}

async function playAiVoice(english, button, automatic = false) {
  const plugin = localAiVoicePlugin();
  if (!plugin?.speak) {
    button.disabled = true;
    button.textContent = "本地少女声仅 Android APK 可用";
    return;
  }
  await stopAiVoice();
  activeAiVoiceButton = button;
  button.classList.add("playing");
  button.textContent = "Mia 正在本地准备…";
  const finish = () => {
    if (activeAiVoiceButton !== button) return;
    activeAiVoiceButton = null;
    button.dataset.idleLabel = "▶ 再听一次本地少女声";
    resetAiVoiceButton(button);
  };
  try {
    const result = await plugin.speak({ text: english, speed: 0.96 });
    if (result?.ok === false && activeAiVoiceButton === button) {
      finish();
      return;
    }
    finish();
  } catch (error) {
    if (activeAiVoiceButton === button) {
      finish();
      button.textContent = automatic ? "▶ 点一下重试本地少女声" : "本地少女声加载失败 · 点我重试";
    }
    if (!automatic) throw error;
  }
}

function addAiVoiceControl(bubble, english) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "ai-voice-button";
  if (!localAiVoicePlugin()?.speak) {
    aiVoiceAvailable = false;
    button.textContent = "本地少女声仅 Android APK 可用";
    button.disabled = true;
    bubble.appendChild(button);
    return;
  }
  aiVoiceAvailable = true;
  button.dataset.idleLabel = "▶ 听 Mia 本地少女声";
  button.textContent = button.dataset.idleLabel;
  button.disabled = false;
  bubble.appendChild(button);
  button.addEventListener("click", () => playAiVoice(english, button).catch(() => {}));
  playAiVoice(english, button, true).catch(() => {});
}

function setAiBusy(busy) {
  aiBusy = busy;
  const capped = aiTurnsToday() >= APP_AI_DAILY_LIMIT;
  $("aiSendBtn").disabled = busy || aiTurnCount >= 8 || capped;
  $("aiMicBtn").disabled = busy || aiTurnCount >= 8 || capped;
  $("aiHintBtn").disabled = busy;
  $("aiUserInput").disabled = busy || aiTurnCount >= 8;
  $("aiSendBtn").textContent = busy ? "AI 正在接话…" : capped ? "今日 AI 已到安全上限" : "发出去 →";
}

function aiMemoryTargets() {
  return [...(state.aiMemories || [])].sort((a, b) => String(a.due).localeCompare(String(b.due))).slice(0, 5);
}

function recordAiTransfer(userText) {
  const scene = sceneById(aiSceneId);
  if (!scene || !aiInputWasSpeech) return;
  for (let index = 0; index < scene.lines.length; index++) {
    const line = scene.lines[index];
    if (!isUserLine(line)) continue;
    const ref = { scene, line, index };
    const target = window.SaySpeechCheck.evaluate(displayText(line.en), [userText], { ignoreWords: line.en.includes("{name}") ? [state.profile?.name || "Alex"] : [] });
    const variation = PHRASE_VARIATIONS[line.id];
    const varied = variation ? window.SaySpeechCheck.evaluate(displayText(variation.en), [userText], { ignoreWords: variation.en.includes("{name}") ? [state.profile?.name || "Alex"] : [] }) : null;
    if (varied && ["pass", "understood"].includes(varied.outcome)) {
      recordCapability(ref, STAGE.VARIED, { outcome: varied.outcome, weakWord: "" });
      break;
    }
    if (["pass", "understood"].includes(target.outcome)) {
      recordCapability(ref, STAGE.RECALLED, { outcome: target.outcome, weakWord: "" });
      break;
    }
  }
}

function aiTurnsToday() {
  return Number(state.aiUsageByDate[localDateKey()] || 0);
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
  if (aiTurnsToday() >= APP_AI_DAILY_LIMIT) {
    $("aiStatus").textContent = `今天的 AI 安全上限是 ${APP_AI_DAILY_LIMIT} 回合，已经到达。基础课程、本地声音和复习仍可继续。`;
    return;
  }
  const userText = window.SayAi?.cleanText($("aiUserInput").value, 180) || "";
  if (!userText) {
    $("aiStatus").textContent = "先说或写一句简单英语，哪怕只有两个词也可以。";
    return;
  }
  $("aiUserInput").value = "";
  const inputWasSpeech = aiInputWasSpeech;
  aiInputWasSpeech = false;
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
      learnerProfile: { interest: state.profile?.interest || "trends" },
      fetchImpl: (url, options) => fetch(url, { ...options, signal: controller.signal })
    });
    aiLastResult = result;
    aiHistory.push({ role: "model", text: result.reply_en });
    aiTurnCount++;
    state.metrics.aiTurns++;
    state.aiUsageByDate[localDateKey()] = aiTurnsToday() + 1;
    aiInputWasSpeech = inputWasSpeech;
    recordAiTransfer(userText);
    aiInputWasSpeech = false;
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
      $("aiStatus").textContent = `意思已经接住。今天 AI 还可用 ${Math.max(0, APP_AI_DAILY_LIMIT - aiTurnsToday())} 回合。`;
    }
    saveState();
  } catch (error) {
    aiHistory.pop();
    bubble.remove();
    $("aiUserInput").value = userText;
    aiInputWasSpeech = inputWasSpeech;
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

async function startAiSpeechRecognition() {
  if (aiBusy) return;
  $("aiMicBtn").disabled = true;
  $("aiMicBtn").textContent = "正在准备…";
  $("aiStatus").textContent = "正在停止 Mia 的声音，避免把 AI 自己的话当成你的回答。";
  try {
    await stopAllPlayback();
    await waitMs(420);
    $("aiMicBtn").textContent = "正在听…";
    $("aiStatus").textContent = "说一句英语，停下来后会填进输入框；你确认后再发送。";
    const plugin = nativeSpeechCheckPlugin();
    let transcript = "";
    if (plugin?.check) {
      const result = await plugin.check({ language: "en-US", maxResults: 1 });
      transcript = result?.transcript || "";
    } else {
      const result = await browserSpeechResult(++speechCheckSerial);
      transcript = result?.transcript || "";
    }
    $("aiUserInput").value = transcript;
    aiInputWasSpeech = Boolean(transcript);
    $("aiStatus").textContent = transcript ? "这是手机听到的文字。先看一眼，可以修改或重说，再点“发出去”。" : "这次没有听到文字，可以重试或直接打字。";
  } catch (error) {
    $("aiStatus").textContent = speechCheckErrorMessage(error);
  } finally {
    $("aiMicBtn").disabled = aiBusy || aiTurnCount >= 8;
    $("aiMicBtn").textContent = "● 说给 AI 听";
  }
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
  markActive();
  currentAiReviewId = null;
  saveState();
}

function quizPool() {
  const due = shuffled(dueRefs());
  const known = shuffled(state.known.map(phraseRefById).filter(Boolean));
  const unique = [];
  [...due, ...known].forEach(ref => { if (!unique.some(item => item.line.id === ref.line.id)) unique.push(ref); });
  if (!unique.length) return [];
  return unique.slice(0, 5);
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
  if (!isUserLine(ref)) return "listening";
  const progress = progressFor(ref.line.id);
  const spellingNeedsRepair = Boolean(spellingFocus(ref)) && (progress.weakWord || (state.spelling[ref.line.id]?.attempts || 0) > 0);
  return spellingNeedsRepair && index % 3 === 2 ? "spelling" : "recall";
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
  const total = quizItems.length;
  $("quizStep").textContent = `${quizIndex + 1} / ${total}`;
  $("quizProgress").style.width = `${quizIndex / total * 100}%`;
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
  $("quizInteraction").innerHTML = `<button class="button acid-button full" id="quizSpeakRecall" type="button">🎙 不看英文 · 现在说</button><button class="text-button full" id="revealAnswer" type="button">语音不可用 · 改用诚实自评</button>`;
  $("quizSpeakRecall").addEventListener("click", () => startQuizSpeechRecall(ref));
  $("revealAnswer").addEventListener("click", () => renderQuizRecallFallback(ref));
}

async function startQuizSpeechRecall(ref) {
  if (quizLocked) return;
  const button = $("quizSpeakRecall");
  button.disabled = true;
  button.textContent = "正在准备麦克风…";
  try {
    await stopAllPlayback();
    await waitMs(420);
    button.textContent = "正在听…说完停一下";
    const plugin = nativeSpeechCheckPlugin();
    const result = plugin ? await plugin.check({ language: "en-US", maxResults: 1 }) : await browserSpeechResult(++speechCheckSerial);
    const evaluation = window.SaySpeechCheck.evaluate(displayText(ref.line.en), [result.transcript], { ignoreWords: ref.line.en.includes("{name}") ? [state.profile?.name || "Alex"] : [] });
    const lowConfidence = Number(result.confidence ?? -1) >= 0 && Number(result.confidence) < 0.35;
    const correct = !lowConfidence && ["pass", "understood"].includes(evaluation.outcome);
    quizLocked = true;
    if (correct) {
      recordCapability(ref, STAGE.RECALLED, { outcome: evaluation.outcome, weakWord: "" });
      state.metrics.recallPasses++;
    }
    $("quizInteraction").innerHTML = `<div class="recall-answer"><small>手机听到</small><strong lang="en">${escapeHtml(evaluation.transcript || "—")}</strong></div>`;
    finishQuizAnswer(correct, ref, correct ? "不看英文也说出来了。" : (lowConfidence ? "这次系统判断不确定，不算通过。" : `这次重点再练：${evaluation.focusWord || displayText(ref.line.en)}`), 900);
  } catch {
    renderQuizRecallFallback(ref);
  }
}

function renderQuizRecallFallback(ref) {
  $("quizInteraction").innerHTML = `<div class="recall-answer"><strong lang="en">${escapeHtml(displayText(ref.line.en))}</strong><span>${escapeHtml(displayText(ref.line.zh))}</span></div><div class="self-grade"><button class="button light" type="button" data-grade="false">刚才没说出来</button><button class="button acid-button" type="button" data-grade="true">刚才确实说出来了</button></div>`;
  $("quizInteraction").querySelectorAll("[data-grade]").forEach(button => button.addEventListener("click", () => {
    if (quizLocked) return;
    quizLocked = true;
    const correct = button.dataset.grade === "true";
    if (correct) recordCapability(ref, STAGE.RECALLED, { outcome: "understood" });
    finishQuizAnswer(correct, ref, correct ? "按你的诚实自评记录为主动想起。" : "没关系，明天会更早再见到它。", 500);
  }));
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
    if (quizIndex < quizItems.length) renderQuizQuestion();
    else finishQuiz();
  }, delay);
}

function finishQuiz() {
  const total = quizItems.length || 1;
  const ratio = quizScore / total;
  $("quizBox").hidden = true;
  $("resultBox").hidden = false;
  $("resultScore").textContent = `${quizScore}/${total}`;
  $("resultMessage").textContent = ratio === 1 ? "状态拉满。现在选一句，今天真的用出去。" : ratio >= .6 ? "记忆正在变稳。答错的表达会更早回来。" : "不需要硬背；跟读一遍，明天再见。";
  const previousTotal = state.bestTotal || 5;
  const previousRatio = (state.best || 0) / previousTotal;
  if (!state.best || ratio > previousRatio || (ratio === previousRatio && total > previousTotal)) {
    state.best = quizScore;
    state.bestTotal = total;
  }
  state.metrics.quizzes++;
  markActive();
  saveState();
}

function exportProgress() {
  state.lastBackupAt = localDateKey();
  saveState(false);
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

async function openMicrophoneSettings() {
  const plugin = nativeSpeechCheckPlugin();
  if (!plugin?.openAppSettings) {
    toast("请到手机设置 → 应用 → 十一说 → 权限 → 麦克风开启。");
    return;
  }
  try { await plugin.openAppSettings(); } catch { toast("请手动到系统应用权限里开启麦克风。"); }
}

async function runDiagnostics() {
  const button = $("runDiagnostics");
  button.disabled = true;
  button.textContent = "正在检查…";
  await ensureNativeAiConnection();
  const results = { audio: "可用", speech: "不可用", voice: "仅 Android APK", ai: "未连接" };
  results.audio = nativeAudioPlugin() || typeof Audio !== "undefined" ? "可用" : "不可用";
  try {
    const status = await nativeSpeechCheckPlugin()?.status?.();
    results.speech = status?.available ? "Android 原生识别可用" : ((window.SpeechRecognition || window.webkitSpeechRecognition) ? "网页识别可用" : "不可用");
  } catch { results.speech = "检查失败"; }
  try {
    const status = await localAiVoicePlugin()?.status?.();
    results.voice = status?.available ? (status.initialized ? "本地少女声已预热" : "本地少女声可用 · 首次需准备") : "当前设备不可用";
  } catch { results.voice = "当前设备不可用"; }
  if (aiIsConfigured()) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    try {
      const response = await fetch(aiSettings.proxyUrl, { headers: window.SayAi.connectionHeaders(aiSettings), signal: controller.signal });
      results.ai = response.ok ? `百炼已连通 · 今日 ${aiTurnsToday()}/${APP_AI_DAILY_LIMIT} 回合` : `连接异常 ${response.status}`;
    } catch { results.ai = "暂时无法连通"; }
    clearTimeout(timeout);
  }
  $("diagnosticList").innerHTML = `<span>课程音频：${results.audio}</span><span>手机语音识别：${results.speech}</span><span>本地少女声：${results.voice}</span><span>百炼 AI：${results.ai}</span>`;
  diagnosticText = `十一说 V${APP_VERSION} (${BUILD_DATE})\n课程音频：${results.audio}\n手机语音识别：${results.speech}\n本地少女声：${results.voice}\n百炼 AI：${results.ai}\n平台：${isNativeAndroid() ? "Android APK" : navigator.userAgent}`;
  state.metrics.diagnosticRuns++;
  saveState(false);
  button.disabled = false;
  button.textContent = "重新检查当前手机";
}

async function copyDiagnostics() {
  if (!diagnosticText) await runDiagnostics();
  try {
    await navigator.clipboard.writeText(diagnosticText);
    toast("诊断信息已复制，不包含 API Key、访问口令或识别文字。");
  } catch {
    toast("系统不允许自动复制，可以截图这一块发给我。");
  }
}

function showVersionNotice() {
  if (state.lastSeenVersion === APP_VERSION) return;
  $("updateBanner").dataset.mode = "version";
  $("updateBanner").querySelector("span").textContent = `V${APP_VERSION}：进度只认真实开口证据`;
  $("reloadUpdate").textContent = "知道了";
  $("updateBanner").hidden = false;
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
  const interest = $("onboardingInterests").querySelector(".selected").dataset.interest;
  const name = cleanName($("onboardingName").value) || "Alex";
  state.profile = { name, goal, minutes, interest: INTEREST_LABELS[interest] ? interest : "trends" };
  $("onboarding").hidden = true;
  $("app").inert = false;
  $("app").removeAttribute("aria-hidden");
  document.body.classList.remove("modal-open");
  saveState();
  showVersionNotice();
  toast(`${name}，先从今天最能用的一句开始。`);
}

function saveSettings() {
  state.profile = state.profile || { name: "Alex", goal: "daily", minutes: 5, interest: "trends" };
  state.profile.name = cleanName($("profileName").value) || "Alex";
  state.profile.goal = $("goalSelect").value;
  state.profile.minutes = Number($("minutesSelect").value);
  state.profile.interest = $("interestSelect").value;
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
  $("knownBtn").addEventListener("click", advanceCurrentPhrase);
  $("skipPhrase").addEventListener("click", skipCurrentPhrase);
  $("slowSoundBtn").addEventListener("click", () => speakCurrent(.72));
  $("normalSoundBtn").addEventListener("click", () => speakCurrent(1));
  $("lessonStartAudio").addEventListener("click", () => speakCurrent(1));
  $("spellHearBtn").addEventListener("click", speakCurrentSpellingWord);
  $("recordBtn").addEventListener("click", toggleRecording);
  $("compareBtn").addEventListener("click", compareRecording);
  document.querySelectorAll("[data-record-grade]").forEach(button => button.addEventListener("click", () => gradeRecording(button.dataset.recordGrade)));
  $("recognizeBtn").addEventListener("click", startSpeechRecognition);
  $("startRecallBtn").addEventListener("click", startRecallMode);
  $("startVariationBtn").addEventListener("click", startVariationMode);
  $("openMicSettings").addEventListener("click", openMicrophoneSettings);
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
  $("testLocalVoice").addEventListener("click", event => {
    const button = event.currentTarget;
    playAiVoice("Hey! I'm Mia. Ready to make English feel natural?", button).catch(() => {});
  });
  $("aiSendBtn").addEventListener("click", submitAiTurn);
  $("aiMicBtn").addEventListener("click", startAiSpeechRecognition);
  $("aiHintBtn").addEventListener("click", showAiHint);
  $("aiUserInput").addEventListener("keydown", event => {
    if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); submitAiTurn(); }
  });
  $("aiUserInput").addEventListener("input", event => { if (event.isTrusted) aiInputWasSpeech = false; });
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
  $("runDiagnostics").addEventListener("click", runDiagnostics);
  $("copyDiagnostics").addEventListener("click", copyDiagnostics);
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
  $("onboardingInterests").querySelectorAll("[data-interest]").forEach(button => button.addEventListener("click", () => selectExclusive($("onboardingInterests"), button, "[data-interest]")));
  $("finishOnboarding").addEventListener("click", finishOnboarding);
  $("reloadUpdate").addEventListener("click", () => {
    if ($("updateBanner").dataset.mode === "version") {
      state.lastSeenVersion = APP_VERSION;
      saveState(false);
      $("updateBanner").hidden = true;
      return;
    }
    location.reload();
  });
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
        if (worker.state === "installed" && navigator.serviceWorker.controller) {
          $("updateBanner").dataset.mode = "update";
          $("updateBanner").querySelector("span").textContent = "新版已经准备好";
          $("reloadUpdate").textContent = "立即更新";
          $("updateBanner").hidden = false;
        }
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
  if (state.profile) showVersionNotice();
  setupServiceWorker();
  void ensureNativeAiConnection();
  if (isNativeAndroid()) setTimeout(() => localAiVoicePlugin()?.warmup?.().catch(() => {}), 1800);
  if ("speechSynthesis" in window) window.speechSynthesis.addEventListener?.("voiceschanged", selectVoice, { once: true });
}

initialize();
