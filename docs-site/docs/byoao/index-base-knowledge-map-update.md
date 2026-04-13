---
title: INDEX.base 知识地图：参考模板与 /wiki 技能更新（2026-04）
description: 评审稿 — 模板小修、技能 3a/3b、指南补全、init/upgrade 自动下发 INDEX.base
date: 2026-04-13
---

> **状态：评审落实稿**  
> 反映评审反馈后的实现；与 `CHANGELOG.md` Unreleased、`guide/*/core-concepts.md`、`byoao/src/skills/wiki/SKILL.md` 交叉一致。

## 背景与目标

将 **Bases 作为活的 wiki 索引**（YAML + 公式 + 视图），避免把 Base 降级成「纯配置」再用另一份静态列表装内容。Agent 侧仍 **`obsidian read INDEX.base`** 定范围，**CLI 不重算公式**。

## `INDEX.base.example`（模板）

**路径**：`byoao/src/assets/presets/common/INDEX.base.example`

| 评审项 | 处理 |
|--------|------|
| **`file.name` 列显示名** | `properties.file.name.displayName: Name` |
| **Recently Updated** | 仅 `limit: 10` + `order` 前置 `updated`；**不对**原始 `updated` 做 `groupBy`（避免一行一组） |
| **公式引号** | 三条公式统一为 YAML **单引号**包裹；文件头 **# 注释** 提示内含双引号时的写法 |
| **`summaries`** | All Pages、Entities 视图增加 `formula.backlink_count: Average`（示例级统计行） |

## `/wiki` 技能

- **Step 3a**：Bases 优先 — `INDEX.base` 缺失时从 **`INDEX.base.example`** 复制；说明 **`byoao init` / `upgrade` 已自动复制**；`cp` 路径提示。  
- **Step 3b**：`obsidian properties` 盘点；**无 Bases 时**仅在对话中输出 markdown 大纲，**默认不写** `INDEX.md`。  
- **Step 4**：**INDEX.base vs CLI** 职责表；全局 filters、公式、`file.name` displayName、六视图、Recently Updated 注意点、`summaries` 可选。

## 用户指南（core-concepts 中英）

在「参考布局」下增补：

- **Bases YAML / 函数来源** — 指向自带 **obsidian-bases** 技能与 Obsidian Bases 文档。  
- **`obsidian search` vs Bases** — 浏览/范围 vs 全文与库外笔记。  
- **`domain` 与 `SCHEMA.md`** — 按 domain 分组需 frontmatter 与 SCHEMA 一致。

## `byoao init` / `byoao upgrade`

- 新增 [`byoao/src/vault/index-base-example.ts`](https://github.com/JayJiangCT/BYOAO/blob/main/byoao/src/vault/index-base-example.ts)：`copyIndexBaseExampleIfMissing` — **仅当库根无 `INDEX.base`** 时从 example 拷贝（**幂等**）。  
- **`createLlmWikiCore`**（init）与 **`migrateV1ToV2Infrastructure`**（upgrade）中调用。

## 测试

- `create.test.ts`：新库存在 **`INDEX.base`** 且含 `file.inFolder`。  
- **`index-base-example.test.ts`**：缺失时拷贝、已存在时不覆盖。

## `CHANGELOG.md`

Unreleased 下 **Skills & docs** 小节已按现有列表风格追加子条（example 小修、wiki 3a/3b、init/upgrade、core-concepts 增补）。

## 相关路径速查

| 用途 | 路径 |
|------|------|
| 示例 Bases YAML | `byoao/src/assets/presets/common/INDEX.base.example` |
| 拷贝辅助函数 | `byoao/src/vault/index-base-example.ts` |
| /wiki | `byoao/src/skills/wiki/SKILL.md` |
| /ask | `byoao/src/skills/ask/SKILL.md` |
| obsidian-bases 参考 | `byoao/src/assets/obsidian-skills/obsidian-bases.md` |
