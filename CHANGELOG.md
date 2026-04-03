# Changelog

All notable changes to BYOAO (`@jayjiang/byoao`) are documented in this file.

## [v1.1.0] - 2026-04-03

### Fixed

- **Global CLI install crash**: Published CLI builds could fail immediately on `byoao install` with `ReferenceError: __PKG_VERSION__ is not defined` because `dist/vault/manifest.js` and `dist/vault/self-update.js` still contained the raw version placeholder token. The build now replaces that token across all emitted runtime JavaScript files, not just the bundled plugin entry.

### Changed

- **Build verification**: Release builds now fail fast if any unresolved package-version placeholder remains anywhere in `dist/`, preventing broken npm tarballs from being published.

## [v1.0.8] - 2026-04-03

### Fixed

- **Bun CJS/ESM interop (OpenCode plugin)**: The plugin failed to load in OpenCode 1.3.x (Bun 1.3.11) with a series of `Missing 'default' export` and `require() async module` errors caused by Bun's broken CJS interop for packages like `fs-extra`, `handlebars`, `gray-matter`, and `semver`. The fix uses two strategies:
  - **`fs-extra` removed as a runtime dependency** — replaced with native `node:fs` / `node:fs/promises` implementations (`copy`, `ensureDir`, `pathExists`, `readJson`, `writeJson`, `remove`, etc.). This eliminates the root cause: Bun treats `fs-extra`'s `exports` field as ESM and cannot load it in any mode.
  - **`handlebars`, `gray-matter`, `semver` bundled inline** — a new `build.mjs` esbuild step bundles `dist/index.js` (the OpenCode plugin entry) into a single self-contained ESM file. All CJS dependencies are inlined and do not require `createRequire` or external package resolution at load time.
- **`package.json` version at runtime**: `manifest.ts` and `self-update.ts` previously used `createRequire` to read `../../package.json` at runtime. After bundling, the relative path resolves incorrectly in the OpenCode cache. The version is now injected at build time via esbuild's `define` option (`__PKG_VERSION__`), with a matching `define` in `vitest.config.ts` so tests continue to pass.

### Changed

- **Build pipeline**: `npm run build` now runs `node build.mjs` (tsc + esbuild bundle) instead of plain `tsc`. The CLI entry (`dist/cli/cli-program.js`) is left as-is; only the plugin entry (`dist/index.js`) is re-bundled.
- **New `src/lib/cjs-modules.ts`**: Central shim that exports the native-fs `fs` object and re-exports `Handlebars`, `matter`, and `semver` with correct types. All source files that previously imported `fs-extra`, `gray-matter`, `handlebars`, or `semver` directly now import from this shim.

## [v1.0.0] - 2026-04-03

First stable release. BYOAO is the OpenCode plugin and CLI that scaffolds Obsidian vaults, ships skills and tools, and injects vault context into the agent system prompt.

### Fixed

- **OpenCode plugin resolution**: `byoao install` now adds `@jayjiang/byoao` to `dependencies` in `~/.opencode/package.json` (global) or `<project>/.opencode/package.json` (project), matching how OpenCode runs `bun install` for npm plugins. Previously only the `plugin` array in `opencode.json` / `.opencode.json` was updated, so the package could fail to resolve. `byoao uninstall` removes the dependency from those manifests.

### Changed

- **System prompt (`experimental.chat.system.transform`)**: Vault navigation guidance now checks whether the Obsidian CLI is available (`obsidian --version`). When it is, the agent is instructed to prefer Obsidian CLI first and fall back to find/grep only after CLI search returns nothing. When it is not, the prompt directs use of find/grep/read and BYOAO tools (`byoao_search_vault`, `byoao_note_read`, `byoao_graph_health`).

### Highlights from the 1.0 RC line

- Onboarding overhaul, `/organize` skill, mandatory `date` frontmatter (see **v1.0.0-rc** below).
- `byoao init --from`: adopting an existing folder skips the interactive knowledge-base name prompt when the name is inferred from the directory (see **v1.0.0-rc-2** below).

## [v1.0.0-rc-2] - 2026-04-02

### Fixed

- **CLI (`byoao init --from`)**: When adopting an existing directory (`existing` or `obsidian-vault` init modes), the knowledge base name is derived from the folder basename without showing the interactive “Knowledge base name” prompt. Creating a fresh vault is unchanged. `--kb` still overrides the name when provided.

## [v1.0.0-rc] - 2026-04-02

First 1.0 release candidate: onboarding overhaul, `/organize` skill, mandatory date frontmatter.
