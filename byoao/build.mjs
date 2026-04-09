/**
 * Two-step build:
 * 1. tsc — type-checks + compiles all TypeScript to dist/
 * 2. esbuild — re-bundles dist/index.js (the OpenCode plugin entry) into a
 *    single self-contained ESM file so that CJS dependencies (handlebars,
 *    gray-matter, semver) are inlined and do not need createRequire in Bun.
 *
 * The CLI entry (dist/cli/cli-program.js) is left as-is because it runs in
 * Node.js where normal require() / ESM interop works fine.
 */
import { execSync } from "node:child_process";
import { build } from "esbuild";
import { readFileSync, writeFileSync, readdirSync, statSync, cpSync } from "node:fs";
import path from "node:path";

const pkg = JSON.parse(readFileSync("package.json", "utf-8"));
const PKG_VERSION_LITERAL = JSON.stringify(pkg.version);
const VERSION_TOKEN = /\b__PKG_VERSION__\b/g;

function walkJsFiles(dir) {
  const entries = readdirSync(dir);
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry);
    const stats = statSync(fullPath);

    if (stats.isDirectory()) {
      files.push(...walkJsFiles(fullPath));
      continue;
    }

    if (stats.isFile() && fullPath.endsWith(".js")) {
      files.push(fullPath);
    }
  }

  return files;
}

function inlinePackageVersion(distDir) {
  for (const file of walkJsFiles(distDir)) {
    const source = readFileSync(file, "utf-8");
    VERSION_TOKEN.lastIndex = 0;
    if (!VERSION_TOKEN.test(source)) continue;

    VERSION_TOKEN.lastIndex = 0;
    const next = source.replace(VERSION_TOKEN, PKG_VERSION_LITERAL);
    writeFileSync(file, next);
  }
}

function assertNoVersionPlaceholders(distDir) {
  const unresolved = [];

  for (const file of walkJsFiles(distDir)) {
    const source = readFileSync(file, "utf-8");
    VERSION_TOKEN.lastIndex = 0;
    if (VERSION_TOKEN.test(source)) {
      unresolved.push(file);
    }
  }

  if (unresolved.length > 0) {
    console.error("Unresolved __PKG_VERSION__ placeholders:");
    for (const file of unresolved) {
      console.error(`  - ${file}`);
    }
    process.exit(1);
  }
}

// Step 1: TypeScript compilation
console.log("tsc…");
execSync("npx tsc", { stdio: "inherit" });

// Step 1.5: Inline package version in all runtime JS files emitted by tsc
console.log("inline package version…");
inlinePackageVersion("dist");

// Step 1.6: Copy BYOAO skills to dist/assets/skills/
console.log("copy BYOAO skills…");
const skillsSrc = "src/skills";
const skillsDst = "dist/assets/skills";
if (readdirSync("src/skills").some((f) => f.endsWith(".md"))) {
  cpSync(skillsSrc, skillsDst, { recursive: true, force: true });
}

// Step 2: Bundle dist/index.js with esbuild
console.log("esbuild bundle for OpenCode plugin entry…");
const result = await build({
  entryPoints: ["dist/index.js"],
  outfile: "dist/index.js",
  bundle: true,
  format: "esm",
  platform: "node",
  allowOverwrite: true,
  // Keep node: builtins external — they are always available
  external: [
    "node:*",
    // Keep @opencode-ai/sdk external — it's provided by the host
    "@opencode-ai/sdk",
  ],
  // Keep the bundle path aligned with the rest of dist/ so all entrypoints resolve
  // the same package version string at runtime.
  define: {
    __PKG_VERSION__: PKG_VERSION_LITERAL,
  },
  // Suppress the banner that esbuild adds (it can break ESM strict mode)
  banner: {},
  metafile: false,
  // Tree-shake to keep the bundle small
  treeShaking: true,
  // Preserve top-level comments / license notices
  legalComments: "none",
});

if (result.errors.length) {
  console.error("esbuild errors:", result.errors);
  process.exit(1);
}

// Step 3: Prepend the original comment so OpenCode recognises it
const current = readFileSync("dist/index.js", "utf-8");
if (!current.startsWith("// BYOAO")) {
  writeFileSync(
    "dist/index.js",
    "// BYOAO — Build Your Own AI OS — plugin for OpenCode\n" + current,
  );
}

console.log("verify build output…");
assertNoVersionPlaceholders("dist");

console.log("Build complete.");
