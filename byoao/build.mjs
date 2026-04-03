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
import { readFileSync, writeFileSync, createReadStream } from "node:fs";

const pkg = JSON.parse(readFileSync("package.json", "utf-8"));

// Step 1: TypeScript compilation
console.log("tsc…");
execSync("npx tsc", { stdio: "inherit" });

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
  // Inline the package version so self-update.ts doesn't need require("package.json")
  define: {
    __PKG_VERSION__: JSON.stringify(pkg.version),
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

console.log("Build complete.");
