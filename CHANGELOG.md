# Changelog

All notable changes to BYOAO (`@jayjiang/byoao`) are documented in this file.

## [v2.0.2] — 2026-04-09

### Bug Fixes
- Fixed `byoao install -g` not migrating old `~/.config/opencode/commands/` to `skills/<name>/SKILL.md`
- Fixed deprecated v1 commands (`weave.md`, `emerge.md`) not cleaned up from global commands directory

---

## [v2.0.1] — 2026-04-09

### Skills Restructure
- **Skills directory layout**: Migrated from flat `.opencode/commands/<name>.md` to Agent Skills standard `.opencode/skills/<name>/SKILL.md`
- **Description optimization**: All 12 skill descriptions rewritten per skill-creator guidelines — front-loaded purpose, explicit trigger phrases and activation contexts
- **Automatic migration**: `byoao upgrade` migrates old `commands/` layout to `skills/` automatically; cleans up empty `commands/` directory

### Documentation
- **Obsidian Web Clipper**: Added setup guide and workflow for [Web Clipper](https://obsidian.md/clipper) — clip articles, research, and references directly into the vault as `/cook` raw material
- **Claude Code setup**: Updated skill copy commands and directory structure to reflect new `skills/<name>/SKILL.md` layout
- **README**: Added `/ask` skill to the skills table; added Web Clipper recommendation

### Bug Fixes
- Fixed `byoao install` writing BYOAO skills to deprecated `commands/` path instead of `skills/<name>/SKILL.md`
- Fixed `byoao init` vault creation installing BYOAO skills to `commands/` instead of `skills/`

---

## [v2.0.0] — 2026-04-09

### Breaking Changes
- **LLM Wiki architecture**: Replaced Zettelkasten model with LLM-compiled knowledge base — built into BYOAO core
- **Removed `/weave`**: Replaced by `/cook` (knowledge compilation) and `/prep` (graph enrichment)
- **Removed `/emerge`**: Pattern discovery merged into `/cook` (contradiction detection) and `/health` (orphan/drift analysis)
- **Removed `byoao_add_person`, `byoao_add_project`, `byoao_graph_health` tools**: Replaced by `/cook` and `/health` skills
- **Removed common templates**: Human-authored note templates no longer shipped in `common/`
- **Removed `Glossary.md`**: Replaced by `SCHEMA.md` tag taxonomy
- **Removed `Members` and `Projects` from config**: Now handled as user notes that `/cook` digests
- **Removed dead modules**: `note-read.ts`, `search-vault.ts`, `retrieval-types.ts` (replaced by Obsidian CLI)
- **Default preset changed**: `pm-tpm` → `minimal`

### New Features
- **LLM Wiki as built-in core**: Every vault gets agent directories, `SCHEMA.md`, `log.md` — regardless of preset
- **`/cook`**: Core knowledge compilation skill — reads raw notes, creates/updates entity and concept pages
- **`/health`**: Knowledge page health check — orphans, broken links, stale content, contradictions
- **`/prep`**: Prerequisites check + graph enrichment (frontmatter scanning, cross-reference suggestions)
- **Four agent directories**: `entities/`, `concepts/`, `comparisons/`, `queries/`
- **`SCHEMA.md`**: Tag taxonomy and domain conventions at vault root
- **`log.md`**: Agent activity log for `/cook` operations
- **`wikiDomain`**: Optional vault config field for domain-specific knowledge compilation
- **`compilationMode`**: Agent autonomy level (`auto` vs `review`)
- **v1→v2 upgrade path**: `byoao upgrade` migrates v1 vaults (creates agent dirs, SCHEMA.md, deprecates v1 files)

### Improvements
- **Presets are now role overlays**: `minimal` (core only) and `pm-tpm` (Atlassian + BigQuery) layer on top of built-in LLM Wiki
- **CLI init flow**: Updated prompts — "Choose your work profile:", optional wikiDomain input
- **vault-doctor**: Now checks agent directory structure, SCHEMA.md, log.md, contradiction frontmatter
- **vault-status**: Reports agent page counts per directory, v2 marker presence
- **System transform hook**: Injects AGENTS.md + SCHEMA.md + MCP auth guidance
- **Idle suggestions**: Updated to v2 skills (/cook, /health, /prep)
- **All retained skills**: Updated vocabulary (entities/concepts/comparisons/queries, SCHEMA.md, INDEX.base)
- **Documentation**: All guides (EN + ZH) rewritten for v2 architecture

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
