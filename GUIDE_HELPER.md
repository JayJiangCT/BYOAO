# BYOAO v0.7 Guide Helper / 使用引导

A bilingual guide for getting started with BYOAO v0.7.

双语使用引导，帮助快速上手 BYOAO v0.7。

---

## EN: Quick Start

### 1. Install

```bash
npm install -g @jayjiang/byoao
byoao install
```

### 2. Create a Knowledge Base

```bash
# Fresh KB (interactive)
byoao init

# Adopt an existing folder
byoao init --from ~/Documents/my-notes
```

The init flow asks:
1. **Your name** — used in AGENT.md
2. **Knowledge base name** — defaults to "{Name}'s KB"
3. **Vault location** — defaults to ~/Documents/{KB name}
4. **Work preset?** — optional PM/TPM overlay (adds Projects/, Sprints/)
5. **AI provider?** — optional auth setup

### 3. Open in Obsidian

1. Open Obsidian → **Manage vaults** → **Open folder as vault** → select your KB path
2. Enable Obsidian CLI: **Settings** → **General** → **Advanced** → **Command-line interface**
3. Read **"Start Here.md"** for orientation

### 4. Connect Your Notes

Open the Agent Client panel and run:

```
/weave
```

This scans your notes, adds frontmatter + wikilinks, maintains the Glossary, and creates hub notes. Run it after adding new content to keep the knowledge graph growing.

### 5. Think With Your Vault (new in v0.7)

Once you have a connected knowledge graph, use the thinking tools:

```
/trace topic="rate limiting"     — see how this idea evolved over time
/emerge                          — discover hidden patterns across all notes
/connect from="payments" to="auth" — find the bridge between two topics
```

### All Skills

| Command | What it does |
|---------|-------------|
| `/weave` | Connect notes into a knowledge graph |
| `/trace` | Track how an idea evolved over time |
| `/emerge` | Discover hidden patterns and forgotten threads |
| `/connect` | Bridge two seemingly unrelated topics |
| `/diagnose` | Check knowledge graph health |
| `/explain` | Explain a codebase system in plain language |

### Vault Structure (Minimal)

```
{KB Name}/
  .obsidian/           # Obsidian config + plugins
  Daily/               # Daily notes
  Knowledge/
    templates/         # Note templates (Cmd+T)
    Glossary.md        # Entity dictionary (maintained by /weave)
  AGENT.md             # AI navigation index
  Start Here.md        # Onboarding guide
```

### What Changed in v0.7

- `/trace` — chronological timeline of how any concept evolved across your notes
- `/emerge` — surfaces recurring questions, implicit decisions, contradictions, forgotten threads
- `/connect` — finds shared notes, people, tags, and graph paths between two topics

---

## CN: 快速上手

### 1. 安装

```bash
npm install -g @jayjiang/byoao
byoao install
```

### 2. 创建知识库

```bash
# 全新知识库（交互式）
byoao init

# 采纳已有文件夹
byoao init --from ~/Documents/my-notes
```

初始化流程会询问：
1. **你的名字** — 用于 AGENT.md
2. **知识库名称** — 默认 "{名字}'s KB"
3. **存储位置** — 默认 ~/Documents/{知识库名}
4. **添加工作预设？** — 可选的 PM/TPM 叠加（添加 Projects/, Sprints/）
5. **设置 AI 提供商？** — 可选的认证设置

### 3. 在 Obsidian 中打开

1. 打开 Obsidian → **管理仓库** → **打开文件夹作为仓库** → 选择你的知识库路径
2. 启用 Obsidian CLI：**设置** → **通用** → **高级** → **命令行界面**
3. 阅读 **"Start Here.md"** 了解基本操作

### 4. 连接你的笔记

打开 Agent Client 面板，运行：

```
/weave
```

这会扫描你的笔记，添加 frontmatter + wikilinks，维护 Glossary，并创建 hub notes。每次添加新内容后运行，让知识图谱持续生长。

### 5. 用知识库思考（v0.7 新功能）

当知识图谱建立起来后，使用思维工具：

```
/trace topic="限流策略"          — 追踪这个想法如何随时间演变
/emerge                          — 发现笔记中隐藏的模式
/connect from="支付" to="认证"   — 找到两个主题之间的桥梁
```

### 全部技能

| 命令 | 功能 |
|------|------|
| `/weave` | 将笔记编织成知识图谱 |
| `/trace` | 追踪一个想法如何随时间演变 |
| `/emerge` | 发现隐藏的模式和被遗忘的线索 |
| `/connect` | 连接两个看似无关的主题 |
| `/diagnose` | 检查知识图谱健康状况 |
| `/explain` | 用通俗语言解释代码库系统 |

### 知识库结构（极简模式）

```
{知识库名}/
  .obsidian/           # Obsidian 配置 + 插件
  Daily/               # 每日笔记
  Knowledge/
    templates/         # 笔记模板 (Cmd+T)
    Glossary.md        # 实体字典（由 /weave 维护）
  AGENT.md             # AI 导航索引
  Start Here.md        # 入门引导
```

### v0.7 新增内容

- `/trace` — 按时间线追踪任何概念在笔记中的演变，识别发现→调查→决策等阶段
- `/emerge` — 发现反复出现的未回答问题、隐含决策、矛盾、被遗忘的线索
- `/connect` — 通过共同笔记、人物、标签和图谱路径，找到两个主题间的联系
