#!/usr/bin/env node
/**
 * Reads `byoao_logo.js` (const ansiArtLines = [...]) and writes `src/cli/byoao-logo-art.ts`.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const srcPath = path.join(root, "byoao_logo.js");
const outPath = path.join(root, "src/cli/byoao-logo-art.ts");

const raw = fs.readFileSync(srcPath, "utf8");
const m = raw.match(/const ansiArtLines = (\[[\s\S]*?\]);/);
if (!m) {
  console.error("Could not find const ansiArtLines = [...] in byoao_logo.js");
  process.exit(1);
}
const lines = new Function(`return ${m[1]}`)();
const header =
  "/** ANSI art for the BYOAO CLI banner. Source: `byoao_logo.js`. Regenerate: `npm run generate:logo-art`. */\n";
const body = `export const BYOAO_LOGO_LINES: readonly string[] = ${JSON.stringify(lines, null, 2)};\n`;
fs.writeFileSync(outPath, header + body, "utf8");
console.log(`Wrote ${lines.length} lines → ${path.relative(root, outPath)}`);
