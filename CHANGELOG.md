# Changelog

All notable changes to BYOAO (`@jayjiang/byoao`) are documented in this file.

## [v2.0.11] — 2026-04-15

### Fixes
- **Build script**: `rmSync` the skills output directory before copying so renamed or deleted skills (e.g. `diagnose → mise`) no longer linger in the tarball from previous builds. v2.0.10 shipped with a stale `diagnose/` directory alongside `mise/`.

---

## [v2.0.10] — 2026-04-15

### Skills
- **`/mise`** (renamed from `/diagnose`): Vault structural health check — frontmatter coverage, broken links, orphan notes, AGENTS.md/SCHEMA.md drift, v2 agent directories, and configuration. Renamed to fit the kitchen/cooking theme ("mise en place" = everything in its place). All references updated across guide, templates, and vault assets.

### Infrastructure
- **`.gitignore`**: Added `.claude/commands/`, `.claude/settings.json`, and `.envrc` to prevent local developer tooling from being committed.

---

## [v2.0.9] — 2026-04-13

### New Features
- **`byoao init` (interactive)**: Two-step flow — choose **Personal** (core LLM Wiki / `minimal`) or **Work** (team-oriented presets). Work use case shows presets tagged with `initOfferWhen: work` (e.g. PM/TPM); multiple options open a second preset list (including minimal without team integrations).
- **`--preset`**: When provided on the command line, skips the use-case and interactive preset prompts and uses the given preset directly.

### Improvements
- **Preset model**: `listPresetsDetailed()`, `filterPresetsForInitUseCase()`, and optional **`initOfferWhen`** in preset `plugin.json` (PM/TPM set to `work`).
- **Vault diagnosis**: **`getVaultDiagnosis`** reports an **info**-level note when **`Knowledge/`** exists but contains no Markdown (BYOAO v1 legacy path; v2 uses root agent folders).

### Documentation
- **Getting started & CLI reference (EN/ZH)**: Document the Personal/Work init flow, optional domain step, MCP selection after preset choice, post-create AI provider prompt, and `--preset` behavior.
- **Troubleshooting (EN/ZH)**: Explain the empty **`Knowledge/`** diagnostic and that the folder can be removed if unused.

### Infrastructure
- **Tests**: `preset-init-filter` unit tests; extended coverage for plugin-config, doctor, MCP, and Obsidian plugins.

---

## [v2.0.8] — 2026-04-13

### New Features
- **Vault `INDEX.base` on init / upgrade**: When the vault root has no **`INDEX.base`**, **`byoao init`** and **`byoao upgrade`** copy **`INDEX.base.example`** idempotently ([`copyIndexBaseExampleIfMissing`](byoao/src/vault/index-base-example.ts)).

### Skills
- **`/ask`**: **`INDEX.base`** as canonical Bases wiki index; read for scope, then **`obsidian properties`** / **`search`** / **`tags`** / **`backlinks`**; no duplicate static **`INDEX.md`**; no delegating vault Q&A to generic exploration subagents.
- **`/wiki`**: Step **3a** (Bases + template copy) and **3b** (CLI inventory; chat-only markdown fallback without default **`INDEX.md`**); Step **4** with **INDEX.base vs CLI** responsibility table, six-view pattern, and template hints.
- **`/cook`**, **`/connect`**, **`/trace`**, **`/ideas`**, **`/diagnose`**: Wording aligned with Bases-first index and CLI mirroring.

### Improvements
- **`INDEX.base.example`**: Shipped reference Bases YAML — global **`filters.or`** over agent folders, formulas (`type_label`, `days_since_update`, `backlink_count`), **`properties.displayName`** (including **`file.name`**), optional **`summaries`** on views, six views; Recently Updated uses **`limit`** only (no **`groupBy`** on raw **`updated`**); header comments for YAML quoting.
- **Bundled `obsidian-cli` skill**: Subsection on Bases (`.base`) files vs CLI retrieval.

### Documentation
- **Troubleshooting (EN/ZH)**: Agent read **`INDEX.base`** but cannot list rows — Base definition on disk vs live table; fix via Bases scope + CLI commands.
- **Core concepts & getting started (EN/ZH)**: Reference layout, Bases YAML / function references, **`obsidian search` vs Bases**, **`domain`** and **`SCHEMA.md`**, init copy behavior.
- **`docs-site/docs/byoao/`**: Internal review notes for the INDEX.base / wiki rollout.
- **`README`**, **`AGENTS.md.hbs`**, **`Start Here.md.hbs`**, **`init-vault` tool**, **idle suggestion**: Copy and messaging for **`INDEX.base`**.

---

## [v2.0.7] — 2026-04-10

### Improvements
- **CLI banner**: Pixel-style **BYOAO** wordmark with ear row, TrueColor fur tone, and `npm run generate:logo-art` to sync `byoao_logo.js` → `src/cli/byoao-logo-art.ts`.
- **TUI colors**: Tagline gradient, progress markers, spinner, help text accents, and progress bars use a unified warm earth palette aligned with the banner (replaces generic cyan/green/yellow/red defaults).

### Documentation
- **README**: Header uses the project banner image (`.github/readme-banner.png`) instead of ASCII art.

---

## [v2.0.6] — 2026-04-10

### Improvements
- **`byoao upgrade`**: Refreshes **`~/.config/opencode/skills`** from the current package when that directory exists (global `install -g` layout), including when the vault manifest already matches the CLI—so global skills do not stay stale after an npm upgrade. Vault skill copy errors skip global sync. CLI prints a line when global skills are synced.
- **`byoao install`**: Uses shared **`copyBundledSkillsToOpenCodeSkillsDir`** (Obsidian + BYOAO) with one progress step; legacy `commands/` cleanup unchanged.

### Documentation
- **CLI reference & troubleshooting (EN/ZH)**: Global vs vault skills, upgrade behavior, `--force`, and install location hint for project-only mode.

---

## [v2.0.5] — 2026-04-10

### Skills
- **`/cook`**: Read `SCHEMA.md` before tagging new pages; new **Step 5 — Sync SCHEMA.md** requires updating tag/domain taxonomy in the same cook cycle when new `tags` or `domain` values appear on agent pages (Obsidian CLI; preserve unrelated sections). Report SCHEMA changes in the cook summary; skill description and key principles updated accordingly.

---

## [v2.0.4] — 2026-04-10

### New Features
- **`byoao sync-docs`**: Inserts packaged **Knowledge Retrieval (Q&A)** and **SCHEMA Retrieval** sections into existing vault `AGENTS.md` / `SCHEMA.md` when missing (safe merge; `--dry-run` supported). Does not overwrite whole files.

### Documentation
- **Troubleshooting (EN/ZH)**: Corrected what `byoao upgrade` does vs root docs; documented `sync-docs` as the preferred path for template updates.
- **CLI reference (EN/ZH)**: Added `sync-docs`; clarified that `upgrade` does not refresh vault-root `AGENTS.md` / `SCHEMA.md` content.

---

## [v2.0.3] — 2026-04-10

### Documentation
- **Vault templates**: `AGENTS.md.hbs` now includes a **Knowledge Retrieval (Q&A)** summary (INDEX.base → SCHEMA.md → Obsidian CLI search/read, prioritization, wikilink grounding) with `/ask` as the authoritative protocol.
- **SCHEMA.md template**: Added a **Retrieval** section cross-linking to that AGENTS summary and `/ask`.
- **Guides**: English and Chinese `core-concepts.md` document how the retrieval chain relates to progressive disclosure.

---

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
