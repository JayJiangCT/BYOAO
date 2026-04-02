# BYOAO v0.9.0 — OpenCode skill discovery & scoped vault retrieval

## EN

### Summary

This release aligns bundled Obsidian agent skills with OpenCode’s expected layout, refines the system prompt so retrieval rules respect **in-vault vs out-of-vault** scope, and adds automated coverage for the system-transform hook.

### What’s new

**OpenCode-compatible skill paths** — Obsidian skills shipped with BYOAO are now installed under `.opencode/skills/<name>/SKILL.md` (vault `init` and global `install`), matching OpenCode’s agent skill discovery. `byoao uninstall` removes both the new layout and legacy flat `.md` files. Vault upgrade / manifest scanning understands the new paths.

**Navigation strategy — scoped retrieval** — The `experimental.chat.system.transform` hook injects **BYOAO Navigation Strategy** with a **Scope** section: inside the detected vault, prefer Obsidian CLI and BYOAO tools; outside the vault, built-in tools (e.g. grep, read, bash) are explicitly allowed.

**Tests** — `hooks/__tests__/system-transform.test.ts` asserts injection behavior and absence of the old blanket “never use grep” wording for vault sessions.

### Upgrade notes

- Re-run **`byoao install`** (or **`byoao init`** on new vaults) so skills land in the `skills/<name>/SKILL.md` layout. Existing vaults can use **`byoao upgrade`** where applicable.
- After updating the npm package, ensure OpenCode loads the new plugin build (clear or refresh `~/.cache/opencode/node_modules/@jayjiang/byoao` if you rely on the cache).

### Breaking changes

- **On-disk layout** for bundled Obsidian skills under `.opencode/skills/` changes from `*.md` at the skills root to per-skill directories with `SKILL.md`. Manifest and upgrade logic target the new layout; legacy flat files are cleaned up on uninstall.

---

## CN

### 概要

本版本将随 BYOAO 分发的 Obsidian Agent Skills 与 OpenCode 要求的目录结构对齐，在系统提示中区分 **库内 / 库外** 检索策略，并为 system-transform 增加自动化测试。

### 更新内容

**符合 OpenCode 的 skill 路径** — `byoao install` 与 `byoao init` 现将技能安装到 `.opencode/skills/<name>/SKILL.md`。`byoao uninstall` 会同时清理新目录结构与旧的扁平 `*.md`。`upgrade` 与 manifest 扫描已适配新路径。

**导航策略 — 分范围检索** — system-transform 注入的 **BYOAO Navigation Strategy** 增加 **Scope**：在检测到的 vault 内优先 Obsidian CLI 与 BYOAO 工具；在 vault 外允许使用 grep、read、bash 等内置工具。

**测试** — `system-transform.test.ts` 校验注入内容与旧版「禁止使用 grep」表述的移除。

### 升级说明

- 请重新执行 **`byoao install`**（或对新库执行 **`byoao init`**）以生成 `skills/<name>/SKILL.md` 布局；已有库可按需使用 **`byoao upgrade`**。
- 更新 npm 包后，请确认 OpenCode 加载的是新构建的插件（若使用缓存目录，可同步或刷新 `~/.cache/opencode/node_modules/@jayjiang/byoao`）。

### 破坏性变更

- `.opencode/skills/` 下随包分发的 Obsidian skills 从根目录 `*.md` 改为 `skills/<name>/SKILL.md`。manifest 与升级逻辑面向新布局；卸载时会移除遗留扁平文件。
