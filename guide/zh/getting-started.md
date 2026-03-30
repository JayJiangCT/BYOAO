<!-- Translated from en/getting-started.md | Last synced: 2026-03-29 -->

[← 返回目录](index.md) | [English](../en/getting-started.md)

# 快速上手

从零开始，大约 10 分钟建立一个互联的知识库。

## 你需要准备

- **[Obsidian](https://obsidian.md/)** — 你写笔记和浏览的地方（桌面应用）
- **[OpenCode](https://opencode.ai)** — 运行 BYOAO 技能的 AI 工具。可以理解为幕后的 AI 引擎。BYOAO 连接 Obsidian（你写笔记的地方）和 OpenCode（AI 技能运行的地方）
- **Node.js 18+** — 安装所需。运行 `node --version` 检查

> **不太熟悉终端？** 只有安装时需要用到终端。设置完成后，一切操作都在 Obsidian 的 AI 面板中进行。

## 第一步：安装 BYOAO

```bash
npm install -g @jayjiang/byoao
```

然后注册插件并安装 Obsidian Skills：

```bash
byoao install
```

这会做两件事：
1. 将 BYOAO 注册为 OpenCode 插件
2. 安装 Obsidian Skills（obsidian-cli、obsidian-markdown 等），让 AI 能与你的知识库交互

<details>
<summary>从源码安装（开发者）</summary>

```bash
git clone https://github.com/JayJiangCT/BYOAO.git
cd BYOAO/byoao
npm install && npm run build && npm link
byoao install
```

</details>

## 第二步：创建知识库

```bash
byoao init
```

交互式设置会依次询问：

1. **你的名字** — 用于 AGENT.md，让 AI 知道这是谁的知识库
2. **知识库名称** — 默认 "{名字}'s KB"
3. **存储位置** — 默认 `~/Documents/{知识库名}`
4. **添加工作预设？** — 选 "No" 创建极简个人知识库，选 "PM/TPM" 添加 Projects/Sprints 文件夹
5. **设置 AI 提供商？** — 现在认证或稍后操作

### 已有笔记？

可以采纳已有文件夹：

```bash
byoao init --from ~/Documents/my-notes
```

BYOAO 检测已有文件，在其基础上注入结构。如果文件夹已经是 Obsidian 仓库（`.obsidian/` 存在），你的配置会被完整保留 — BYOAO 绝不会覆盖你的插件、主题或快捷键。

### 创建了什么

极简知识库的结构：

```
{知识库名}/
├── .obsidian/           # Obsidian 配置 + Agent Client 插件
├── Daily/               # 每日笔记
├── Knowledge/
│   ├── templates/       # 笔记模板（会议、日记、决策记录）
│   └── Glossary.md      # 实体字典（由 /weave 维护）
├── AGENT.md             # AI 导航索引
└── Start Here.md        # 入门引导
```

就这些 — 3 个目录，几个文件。没有一堆空文件夹。

## 第三步：在 Obsidian 中打开

1. 打开 Obsidian → **管理仓库** → **打开文件夹作为仓库** → 选择你的知识库路径
2. 出现提示时，点击 **"信任作者并启用插件"**
3. 启用 Obsidian CLI：**设置** → **通用** → **高级** → **命令行界面**
4. 阅读 **"Start Here.md"** 了解基本操作

> **为什么要启用 CLI？** BYOAO 的技能通过 Obsidian CLI 来搜索、读取反向链接和查询知识图谱。没有它，/weave 等技能无法运行。

## 第四步：运行 /weave

打开 **Agent Client** 面板（右侧栏图标），输入：

```
/weave
```

这是奇迹发生的地方。/weave 扫描你的笔记并：
- 添加 frontmatter（type、domain、tags、references）
- 将已知术语的提及转换为 `[[wikilinks]]`
- 为反复出现的概念建议新的 Glossary 条目
- 为高频提及的主题创建 hub notes
- 修改前自动备份每个文件

运行后，按 `Cmd+G` 打开图谱视图，看看你的笔记是如何连接的。

## 接下来

- **[核心概念](core-concepts.md)** — 了解 BYOAO 的工作原理
- **[常见场景](workflows.md)** — 每周回顾、追踪想法、发现模式
- **[技能参考](skills-reference.md)** — 6 个 AI 技能详解

---

**下一步：** [核心概念](core-concepts.md) →
