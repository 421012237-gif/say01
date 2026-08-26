(function attachSpeechCheck(root) {
  const FUNCTION_WORDS = new Set([
    "a", "an", "the", "am", "is", "are", "was", "were", "be", "been",
    "i", "me", "my", "you", "your", "it", "this", "that", "to", "of",
    "for", "in", "on", "at", "and", "or", "do", "does", "did", "can",
    "could", "would", "will", "please"
  ]);

  const CONTRACTIONS = [
    [/\bi['’]m\b/g, "i am"],
    [/\bi['’]ll\b/g, "i will"],
    [/\bi['’]d\b/g, "i would"],
    [/\byou['’]re\b/g, "you are"],
    [/\bwe['’]re\b/g, "we are"],
    [/\bthey['’]re\b/g, "they are"],
    [/\bit['’]s\b/g, "it is"],
    [/\bthat['’]s\b/g, "that is"],
    [/\bwhat['’]s\b/g, "what is"],
    [/\bwhere['’]s\b/g, "where is"],
    [/\bdon['’]t\b/g, "do not"],
    [/\bdoesn['’]t\b/g, "does not"],
    [/\bcan['’]t\b/g, "can not"],
    [/\bwon['’]t\b/g, "will not"]
  ];

  const HOMOPHONES = new Map([
    ["too", "to"], ["two", "to"], ["four", "for"], ["their", "there"],
    ["theyre", "there"], ["write", "right"], ["one", "1"]
  ]);

  function tokenize(value) {
    let clean = String(value || "").toLowerCase().replace(/[’]/g, "'");
    for (const [pattern, replacement] of CONTRACTIONS) clean = clean.replace(pattern, replacement);
    return clean
      .replace(/[^a-z0-9'\s-]/g, " ")
      .replace(/[-']/g, " ")
      .split(/\s+/)
      .filter(Boolean)
      .map(word => HOMOPHONES.get(word) || word);
  }

  function align(target, heard) {
    const rows = target.length + 1;
    const cols = heard.length + 1;
    const dp = Array.from({ length: rows }, () => Array(cols).fill(0));
    for (let i = target.length - 1; i >= 0; i--) {
      for (let j = heard.length - 1; j >= 0; j--) {
        dp[i][j] = target[i] === heard[j]
          ? dp[i + 1][j + 1] + 1
          : Math.max(dp[i + 1][j], dp[i][j + 1]);
      }
    }

    const matchedTarget = new Set();
    const matchedHeard = new Set();
    let i = 0;
    let j = 0;
    while (i < target.length && j < heard.length) {
      if (target[i] === heard[j]) {
        matchedTarget.add(i);
        matchedHeard.add(j);
        i++;
        j++;
      } else if (dp[i + 1][j] >= dp[i][j + 1]) {
        i++;
      } else {
        j++;
      }
    }
    return { matchedTarget, matchedHeard };
  }

  function evaluateOne(targetText, transcript, options = {}) {
    const target = tokenize(targetText);
    const heard = tokenize(transcript);
    const ignored = new Set((options.ignoreWords || []).flatMap(tokenize));
    const { matchedTarget, matchedHeard } = align(target, heard);
    const judgedIndices = target.map((_, index) => index).filter(index => !ignored.has(target[index]));
    const contentIndices = judgedIndices.filter(index => !FUNCTION_WORDS.has(target[index]));
    const matchedJudged = judgedIndices.filter(index => matchedTarget.has(index)).length;
    const matchedContent = contentIndices.filter(index => matchedTarget.has(index)).length;
    const score = judgedIndices.length ? matchedJudged / judgedIndices.length : 0;
    const contentScore = contentIndices.length ? matchedContent / contentIndices.length : score;
    const missing = judgedIndices.filter(index => !matchedTarget.has(index));
    const missingContent = missing.filter(index => !FUNCTION_WORDS.has(target[index]));
    const extraWords = heard.filter((_, index) => !matchedHeard.has(index));

    let outcome = "retry";
    if (score === 1 && extraWords.length === 0) outcome = "pass";
    else if (contentScore === 1 && score >= 0.55) outcome = "understood";
    else if (contentScore >= 0.6 || score >= 0.58) outcome = "almost";

    const focusIndex = missingContent[0] ?? missing[0] ?? -1;
    return {
      targetText: String(targetText || ""),
      transcript: String(transcript || "").trim(),
      target,
      heard,
      score,
      contentScore,
      outcome,
      focusWord: focusIndex >= 0 ? target[focusIndex] : "",
      words: target.map((word, index) => ({
        word,
        status: ignored.has(word) ? "optional" : (matchedTarget.has(index) ? "match" : "missing")
      })),
      extraWords
    };
  }

  function evaluate(targetText, transcripts, options = {}) {
    const choices = (Array.isArray(transcripts) ? transcripts : [transcripts]).filter(value => String(value || "").trim());
    if (!choices.length) return evaluateOne(targetText, "", options);
    return choices
      .map(transcript => evaluateOne(targetText, transcript, options))
      .sort((a, b) => {
        const outcomeRank = { pass: 4, understood: 3, almost: 2, retry: 1 };
        return (outcomeRank[b.outcome] - outcomeRank[a.outcome]) || (b.contentScore - a.contentScore) || (b.score - a.score);
      })[0];
  }

  const api = { tokenize, evaluate };
  root.SaySpeechCheck = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : window);
