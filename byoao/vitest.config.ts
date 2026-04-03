import { defineConfig } from "vitest/config";
import { readFileSync } from "node:fs";

const pkg = JSON.parse(readFileSync("package.json", "utf-8")) as { version: string };

export default defineConfig({
  define: {
    // Mirrors the esbuild define used in build.mjs
    __PKG_VERSION__: JSON.stringify(pkg.version),
  },
  test: {
    root: "src",
  },
});
