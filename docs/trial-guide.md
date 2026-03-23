# BYOAO Trial Guide

> 15 分钟上手，把 Obsidian 变成你的 AI 知识库。
>
> Version: 0.3.0-dev · 适用对象：PM/TPM

---

## 你会得到什么

完成本指南后，你将拥有：

- 一个结构化的 Obsidian 知识库，包含团队、项目、术语表
- 6 套即用模板（会议纪要、每日笔记、调研、决策记录、Feature Doc、Sprint Handoff）
- AI Agent 能直接导航的知识图谱（通过 AGENT.md + wikilinks）
- 自动配置好的 Atlassian MCP 连接
- **Agent Client 插件** — 在 Obsidian 内直接与 AI Agent 对话（自动安装 + 配置）
- **BRAT 插件管理器** — 自动管理 Agent Client 的版本更新

---

## Step 1: 安装（2 分钟）

**前提条件：**
- Node.js 18+（运行 `node --version` 确认）
- [Obsidian](https://obsidian.md) 桌面版已安装
- [OpenCode](https://opencode.ai) 已安装（AI 功能需要）

```bash
# 安装 BYOAO CLI（确保在 feat/obsidian-plugin-auto-install 分支）
cd ~/Documents/BOYO/byoao
git checkout feat/obsidian-plugin-auto-install
npm install && npm run build && npm link

# 注册插件到 OpenCode
byoao install
```

按提示选择安装范围（全局/项目级）和是否安装 Skills。看到 `✓ Plugin registered` + `✓ Obsidian Skills` + `✓ BYOAO skills` 就说明安装成功。

也可以跳过交互直接安装：

```bash
byoao install --yes --global
```

---

## Step 2: 创建知识库（1 分钟）

**交互式创建（推荐）：**

```bash
byoao init
```

按提示选择：
1. **角色** → PM / TPM
2. **团队名称** → 输入你的团队名
3. **你的名字** → 用于创建你的个人档案
4. **存储路径** → 默认 `~/Documents/<团队名> Workspace`

**或者用命令行一步到位：**

```bash
byoao init --team "你的团队名" --name "你的名字" --preset pm-tpm
```

创建完成后会显示：
- 文件数、wikilink 数、目录数
- MCP servers 配置结果
- **Obsidian 插件安装结果**（BRAT + Agent Client）
- 下一步操作指引

> **新功能：** `byoao init` 现在会自动下载并配置 BRAT 插件管理器和 Agent Client 插件。你不再需要手动安装这些插件。

> **OpenCode 项目配置：** `byoao init` 会自动在 vault 目录创建 `.opencode.json`，并复制 `.opencode/skills/` 和 `.opencode/commands/`。这样当 OpenCode 从 vault 目录启动时，BYOAO 工具会自动可用（包括通过 Agent Client 启动的 OpenCode 会话）。

---

## Step 3: 在 Obsidian 中打开（1 分钟）

1. 打开 Obsidian
2. 左下角 **管理仓库** → **打开文件夹为仓库**
3. 选择刚才创建的目录（如 `~/Documents/你的团队名 Workspace`）
4. 打开 **Start Here.md** — 这是你的入门导航

**快速熟悉键位：**

| 操作 | 快捷键 |
|------|--------|
| 快速打开笔记 | `Cmd+O` |
| 插入模板 | `Cmd+T` |
| 新建笔记 | `Cmd+N` |
| 全文搜索 | `Cmd+Shift+F` |
| 打开图谱视图 | `Cmd+G` |

---

## Step 4: 写第一条会议纪要（3 分钟）

这是最常见的日常操作，试一下完整流程：

1. `Cmd+N` 新建笔记
2. 给笔记起名，比如 `2026-03-20 周会`
3. `Cmd+T` → 选择 **Meeting Notes** 模板
4. 填写模板内容：
   - **participants**: 用 `[[名字]]` 链接到团队成员
   - **decisions**: 记录决策
   - **action-items**: 记录待办
5. 把笔记拖到 `Inbox/` 文件夹

**关键习惯：** 提到人名用 `[[张三]]`，提到项目用 `[[项目名]]`。这些 wikilink 会自动构建知识图谱。

---

## Step 5: 在 Obsidian 内直接使用 AI（5 分钟）

`byoao init` 已自动安装并配置好以下插件：

- **BRAT** — Obsidian beta 插件管理器，负责 Agent Client 的后续版本更新
- **Agent Client** — 在 Obsidian 内直接与 AI Agent 对话，已预配置 OpenCode 为默认 agent

### 5.1 启用插件

首次打开 vault 时需要启用社区插件：

1. Obsidian 会提示 "Restricted mode" — 点击 **Turn off restricted mode**（信任此 vault）
2. 前往 Settings → Community plugins
3. 确认 **BRAT** 和 **Agent Client** 都已启用（toggle 为开）

> **如果 Obsidian 在 `byoao init` 时已经打开**，需要重启 Obsidian 或 `Cmd+P` → "Reload app without saving" 来加载新插件。

### 5.2 打开 Agent Client

1. 点击右侧边栏的 **Agent Client** 图标（或 `Cmd+P` → 搜索 "Agent Client"）
2. 右侧会打开一个对话面板
3. 默认连接 OpenCode — 你可以直接开始对话

> **提示：** 如果插件没有出现，前往 Settings → Community plugins → 确认 Agent Client 已启用。

> **BYOAO 工具缺失？** 如果在 OpenCode 中只看到 `/init`、`/review`、`/compact`，没有 BYOAO 工具，说明这个 vault 是在 `.opencode.json` 支持加入之前创建的。解决方法：在新目录重新运行 `byoao init` 创建一个新 vault。

### 5.3 引用笔记 — `@` 语法

Agent Client 的核心优势是**笔记感知**。在对话中用 `@` 引用 vault 中的任何笔记：

> "总结一下 @[[2026-03-20 周会]] 的决策和待办"

> "对比 @[[Feature Doc A]] 和 @[[Feature Doc B]] 的需求差异"

> "@[[Glossary]] 里有没有关于 SLO 的定义？"

**支持的引用方式：**

| 语法 | 说明 |
|------|------|
| `@[[笔记名]]` | 引用整篇笔记内容 |
| `@notename` | 简写形式 |
| 选中文字后发送 | 自动附带选中内容作为上下文 |

### 5.4 Auto-Mention 模式

开启后，Agent Client 会**自动将当前打开的笔记**作为上下文注入每条消息。适合边看笔记边提问的场景：

1. `Cmd+P` → 搜索 "Agent Client: Toggle Auto-Mention"
2. 打开一篇项目文档
3. 直接提问："这个项目的风险点有哪些？"— AI 自动获得当前笔记内容

### 5.5 管理知识库

在 Agent Client 面板中，你可以执行所有 BYOAO 操作：

**添加团队成员：**
> "帮我添加一个团队成员：张三，角色是前端工程师"

AI 会调用 `byoao_add_member`，自动创建 `People/张三.md` 并更新团队索引。

**添加项目：**
> "添加一个项目叫 用户增长，描述是 Q2 用户增长策略落地"

**添加术语：**
> "在术语表里加一条：OKR 是 Objectives and Key Results，目标与关键成果"

**整理笔记：**

在 `Inbox/` 里放一条随手记的笔记，然后在 Agent Client 中：

> "帮我整理 @[[xxx]]，加上 frontmatter 和 wikilinks"

AI 会用 `enrich-document` skill 给笔记补上元数据和关联链接。

### 5.6 对话保存

Agent Client 会在新建对话或关闭对话时，自动将对话内容**导出为 vault 笔记**。你的每一次 AI 交互都会成为知识库的一部分。

### 5.7 切换 Agent

Agent Client 支持多种 AI Agent。通过命令面板切换：

`Cmd+P` → "Agent Client: Switch Agent"

| Agent | 说明 |
|-------|------|
| OpenCode | 默认，BYOAO 工具集成 |
| Claude Code | Anthropic 的 CLI agent |
| Gemini CLI | Google 的 CLI agent |

### 5.8 检查知识库健康

在 Agent Client 中：

> "检查一下这个知识库的状态"

或者用 CLI：

```bash
byoao status ~/Documents/你的团队名\ Workspace
```

---

## Step 6: 建立日常工作流

以下是推荐的日常使用节奏：

### 每天

- 打开 Obsidian，`Cmd+T` 创建 **Daily Note**
- 会议时用 **Meeting Notes** 模板记录
- 随手笔记先丢进 `Inbox/`

### 每周

- 回顾 `Inbox/`，整理或归档
- 运行 `byoao status` 检查是否有 broken links
- 用 AI 批量 enrich 未整理的笔记

### 每个 Sprint

- 用 **Sprint Handoff** 模板记录交接
- 用 **Feature Doc** 模板写新功能文档
- 更新术语表中的新概念

---

## 知识库结构速查

```
你的团队 Workspace/
├── Inbox/          # 收件箱 — 随手记、待整理
├── Knowledge/
│   ├── concepts/   # 领域概念深度文档
│   ├── templates/  # 笔记模板（Cmd+T 调用）
│   └── Glossary.md # 团队术语表
├── People/         # 一人一档
├── Projects/       # 一项目一档
├── Sprints/        # Sprint 文档
├── Systems/        # 系统/架构文档（AI 生成）
├── Daily/          # 每日笔记
├── Archive/        # 归档
├── AGENT.md        # AI 导航索引
└── Start Here.md   # 入门指南
```

**核心原则：** 文件夹只是建议，真正的结构来自 frontmatter（`type`, `tags`）和 wikilinks（`[[链接]]`）。Obsidian 的搜索和图谱不依赖文件夹位置。

---

## 常见问题

**Q: 我可以改文件夹结构吗？**
A: 可以。文件夹只是组织建议，BYOAO 靠 frontmatter 和 wikilinks 工作。

**Q: 手动编辑笔记会破坏什么吗？**
A: 不会。你可以自由编辑任何笔记。运行 `byoao status` 可以检查是否产生了 broken links。

**Q: 重新运行 `byoao init` 会覆盖我的笔记吗？**
A: 不会。已存在的文件会被跳过，只有新文件会被创建。

**Q: AI 是怎么知道我的团队信息的？**
A: 通过 `AGENT.md`。它是你知识库的索引文件，AI 进入目录后自动读取，然后沿着 wikilinks 导航到具体笔记。

**Q: 卸载会删除我的知识库吗？**
A: 不会。`byoao uninstall` 只移除插件注册，你的笔记完全不受影响。

**Q: Agent Client 打开时报错 "Session Creation Failed"？**
A: 确认你已安装 OpenCode 并且 `opencode` 命令在终端可用（运行 `which opencode` 确认）。BYOAO 已将 OpenCode 配置为默认 agent，但需要 OpenCode 本身已安装。

**Q: 插件没有出现在 Obsidian 中？**
A: 如果 `byoao init` 运行时 Obsidian 已经打开，需要重启 Obsidian。或者 `Cmd+P` → "Reload app without saving"。另外确认 Settings → Community plugins → Restricted mode 已关闭。

**Q: BRAT 是什么？为什么需要它？**
A: BRAT (Beta Reviewer's Auto-update Tester) 是 Obsidian 社区标准的 beta 插件管理器。Agent Client 目前还未上架 Obsidian 官方市场，通过 BRAT 管理可以自动获取版本更新。BYOAO 会自动安装和配置 BRAT，你不需要手动操作。

---

## 反馈

试用过程中遇到问题或有建议，请记录：

- 哪些操作让你觉得顺畅？
- 哪些地方让你困惑？
- 你希望增加什么功能？
- 模板是否符合你的工作场景？

反馈可以直接提 issue: https://github.com/JayJiangCT/BYOAO/issues

---

*Happy note-taking!*
