import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const audioRoot = resolve(projectRoot, "audio");
const appSource = readFileSync(resolve(projectRoot, "app.js"), "utf8");
const focusBlock = appSource.match(/const SPELLING_FOCUS = \{([\s\S]*?)\n\};/);
if (!focusBlock) throw new Error("Could not find SPELLING_FOCUS in app.js");

const focusIds = [...focusBlock[1].matchAll(/^\s*"([a-z]+-\d+)":/gm)].map(match => match[1]);
if (focusIds.length !== 30) throw new Error(`Expected 30 spelling hooks, found ${focusIds.length}`);

for (const id of focusIds) {
  const path = resolve(audioRoot, `word-${id}.m4a`);
  if (!existsSync(path)) throw new Error(`Missing spelling audio: ${path}`);
}

const files = readdirSync(audioRoot).filter(file => file.endsWith(".m4a")).sort();
const sentenceFiles = files.filter(file => !file.startsWith("word-"));
const wordFiles = files.filter(file => file.startsWith("word-"));
if (sentenceFiles.length !== 30 || wordFiles.length !== 30) {
  throw new Error(`Expected 30 sentence + 30 word files, found ${sentenceFiles.length} + ${wordFiles.length}`);
}

let shortest = { file: "", duration: Infinity };
let longest = { file: "", duration: 0 };

function readDuration(path) {
  const audio = readFileSync(path);
  const marker = Buffer.from("mvhd");
  const typeOffset = audio.indexOf(marker);
  if (typeOffset < 4) return Number.NaN;

  const version = audio[typeOffset + 4];
  if (version === 0) {
    const timescale = audio.readUInt32BE(typeOffset + 16);
    const duration = audio.readUInt32BE(typeOffset + 20);
    return timescale ? duration / timescale : Number.NaN;
  }
  if (version === 1) {
    const timescale = audio.readUInt32BE(typeOffset + 24);
    const duration = audio.readBigUInt64BE(typeOffset + 28);
    return timescale ? Number(duration) / timescale : Number.NaN;
  }
  return Number.NaN;
}

for (const file of files) {
  const path = resolve(audioRoot, file);
  if (statSync(path).size < 4000) throw new Error(`Audio file is unexpectedly small: ${file}`);
  const duration = readDuration(path);
  if (!Number.isFinite(duration) || duration < 0.3 || duration > 8) {
    throw new Error(`Invalid duration for ${file}: ${duration}`);
  }
  if (duration < shortest.duration) shortest = { file, duration };
  if (duration > longest.duration) longest = { file, duration };
}

console.log(`Audio verified: ${sentenceFiles.length} sentence + ${wordFiles.length} spelling files.`);
console.log(`Duration range: ${shortest.duration.toFixed(2)}s (${shortest.file}) to ${longest.duration.toFixed(2)}s (${longest.file}).`);
