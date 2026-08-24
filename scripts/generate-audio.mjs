import { execFileSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const audioRoot = resolve(projectRoot, "audio");
const voice = process.env.SAY01_AUDIO_VOICE || "Eddy (English (US))";

// Punctuation is deliberately performance-oriented: questions lift, friendly replies
// breathe, and rescue phrases stay calm. The visible lesson copy remains unchanged.
const sentenceLines = [
  ["cafe-1", "Hi! What can I get for you?", 178],
  ["cafe-2", "A coffee, please.", 174],
  ["cafe-3", "Hot, or iced?", 174],
  ["cafe-4", "Iced, please. No sugar.", 170],
  ["cafe-5", "That's all. Thank you!", 172],
  ["travel-1", "Excuse me. Where is the station?", 174],
  ["travel-2", "Go straight.", 176],
  ["travel-3", "Thank you for your help!", 170],
  ["travel-4", "One ticket, please.", 172],
  ["travel-5", "How much is it?", 174],
  ["social-2", "Nice to meet you!", 172],
  ["social-3", "Where are you from?", 174],
  ["social-4", "I'm from China.", 172],
  ["social-5", "I'm learning English.", 170],
  ["shopping-1", "Excuse me. Do you have this in black?", 174],
  ["shopping-2", "What size do you need?", 176],
  ["shopping-3", "Medium, please.", 172],
  ["shopping-4", "How much is it?", 174],
  ["shopping-5", "I'll take it!", 172],
  ["work-2", "Welcome to the team!", 174],
  ["work-3", "Could you help me?", 172],
  ["work-4", "Of course!", 172],
  ["work-5", "Thank you. I appreciate it.", 168],
  ["rescue-1", "Sorry. I don't understand.", 164],
  ["rescue-2", "Please, speak slowly.", 160],
  ["rescue-3", "Can you say that again?", 166],
  ["rescue-4", "Do you mean this?", 170],
  ["rescue-5", "Yes. That's right!", 170]
];

const spellingWords = [
  ["cafe-1", "get"], ["cafe-2", "coffee"], ["cafe-3", "iced"], ["cafe-4", "sugar"], ["cafe-5", "thank"],
  ["travel-1", "station"], ["travel-2", "straight"], ["travel-3", "help"], ["travel-4", "ticket"], ["travel-5", "much"],
  ["social-1", "hi"], ["social-2", "meet"], ["social-3", "where"], ["social-4", "China"], ["social-5", "English"],
  ["shopping-1", "black"], ["shopping-2", "size"], ["shopping-3", "medium"], ["shopping-4", "much"], ["shopping-5", "take"],
  ["work-1", "new"], ["work-2", "welcome"], ["work-3", "could"], ["work-4", "course"], ["work-5", "appreciate"],
  ["rescue-1", "sorry"], ["rescue-2", "speak"], ["rescue-3", "again"], ["rescue-4", "mean"], ["rescue-5", "right"]
];

mkdirSync(audioRoot, { recursive: true });

function generate(fileName, text, rate) {
  execFileSync("say", [
    "-v", voice,
    "-r", String(rate),
    "-o", resolve(audioRoot, fileName),
    "--data-format=aac",
    "--bit-rate=64000",
    text
  ], { stdio: "inherit" });
}

for (const [id, text, rate] of sentenceLines) generate(`${id}.m4a`, text, rate);
for (const [id, word] of spellingWords) generate(`word-${id}.m4a`, word, word.length > 8 ? 152 : 160);

console.log(`Generated ${sentenceLines.length} sentence files and ${spellingWords.length} spelling files with ${voice}.`);
