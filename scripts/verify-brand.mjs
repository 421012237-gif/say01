import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import sharp from "sharp";

const root = resolve(import.meta.dirname, "..");
const checks = [
  ["index.html", ["十一说", "ELEVEN SAYS", "brand-mark\" aria-hidden=\"true\">11"]],
  ["manifest.webmanifest", ["十一说｜成年人的第一句英语", "\"short_name\": \"十一说\""]],
  ["capacitor.config.json", ["\"appName\": \"十一说\"", "\"appId\": \"com.say01.english\""]],
  ["android/app/src/main/res/values/strings.xml", ["<string name=\"app_name\">十一说</string>"]],
  ["icon.svg", [">11</text>", ">ELEVEN SAYS</text>"]]
];

for (const [file, expected] of checks) {
  const source = await readFile(resolve(root, file), "utf8");
  for (const text of expected) {
    if (!source.includes(text)) throw new Error(`${file} is missing brand token: ${text}`);
  }
}

const splashPath = resolve(root, "android/app/src/main/res/drawable-port-xxxhdpi/splash.png");
const splashPixel = await sharp(splashPath).extract({ left: 0, top: 0, width: 1, height: 1 }).removeAlpha().raw().toBuffer();
if (![8, 7, 10].every((value, index) => Math.abs(splashPixel[index] - value) <= 2)) {
  throw new Error("Android light-mode splash must keep the #08070A dark background.");
}

console.log("Brand verification passed: 十一说 / ELEVEN SAYS, dark Android splash, and upgrade-compatible app ID.");
