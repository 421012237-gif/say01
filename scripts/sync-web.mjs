import { cp, mkdir, rm } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const targetRoot = resolve(projectRoot, "app-web");
const files = [
  "index.html",
  "styles.css",
  "ai-coach.js",
  "app.js",
  "manifest.webmanifest",
  "icon.svg",
  "icon-192.png",
  "icon-512.png",
  "apple-touch-icon.png",
  "sw.js"
];

await rm(targetRoot, { recursive: true, force: true });
await mkdir(targetRoot, { recursive: true });

for (const file of files) {
  await cp(resolve(projectRoot, file), resolve(targetRoot, file));
}

await cp(resolve(projectRoot, "audio"), resolve(targetRoot, "audio"), { recursive: true });
console.log(`Synced ${files.length} web files and audio assets to ${targetRoot}`);
