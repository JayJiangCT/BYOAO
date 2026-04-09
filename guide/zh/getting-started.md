<!-- Translated from en/getting-started.md | Last synced: 2026-03-29 -->

[← 返回目录](index.md) | [English](../en/getting-started.md)

# 快速上手

从零开始，大约 10 分钟建立一个 LLM Wiki 知识库。

## 你需要准备

在使用 BYOAO 之前，需要安装以下三样东西：

### 1. Obsidian（笔记应用）

从 [obsidian.md](https://obsidian.md/) 下载最新版本并安装。这是你写笔记和浏览知识库的地方。

### 2. Node.js 18+（JavaScript 运行环境）

Node.js 是一个让你能运行 BYOAO 安装程序的工具。它自带 `npm`（Node 包管理器），这是你安装 BYOAO 时要用到的命令。

**安装步骤：**
1. 访问 [nodejs.org](https://nodejs.org/)
2. 下载 **LTS**（Long Term Support，长期支持）版本 — 这是稳定的推荐版本
3. 运行安装程序，按提示操作（全部选择默认即可）

**验证安装成功：** 打开终端，运行：

```bash
node --version
```

你应该看到类似 `v20.x.x` 或 `v22.x.x` 的输出（18 或更高版本都可以）。

> **什么是终端？**
> - **Mac：** 打开 **Terminal**（按 `Cmd+Space`，输入 "Terminal"，回车）
> - **Windows：** 打开 **PowerShell**（按 `Win+X`，选择 "Windows PowerShell"）
> - 终端只在下面的安装步骤中需要用到。安装完成后，所有操作都在 Obsidian 内进行。

### 3. OpenCode（AI 引擎）

OpenCode 是驱动 BYOAO 技能的 AI 工具。安装好 Node.js 后，可以通过 npm 安装 OpenCode：

```bash
npm install -g opencode
```

或者从 [opencode.ai](https://opencode.ai) 下载。

> **`npm install -g` 是什么意思？** `npm` 是随 Node.js 一起安装的包管理器。`-g` 标志表示"全局安装"，这样这个命令就可以在电脑上的任何位置使用，而不仅限于某一个文件夹。

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

1. **你的名字** — 用于 AGENTS.md，让 AI 知道这是谁的知识库
2. **知识库名称** — 默认 "{名字}'s KB"
3. **存储位置** — 默认 `~/Documents/{知识库名}`
4. **添加工作预设？** — 选 "minimal" 创建纯 LLM Wiki，选 "PM/TPM" 添加 Atlassian 和 BigQuery MCP 服务
5. **连接外部服务？** — 选了 PM/TPM 后，选择启用哪些 MCP 服务（Atlassian、BigQuery）。BigQuery 会提示输入 GCP Project ID 并自动完成认证
6. **设置 AI 提供商？** — 现在认证或稍后操作

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
├── entities/            # Agent 编译：人物、组织、项目
├── concepts/            # Agent 编译：方法、规则、决策
├── comparisons/         # Agent 编译：并列分析
├── queries/             # Agent 编译：有价值的问答
├── SCHEMA.md            # 标签分类和约定
├── INDEX.base           # 知识地图（Obsidian Base 视图）
├── log.md               # 操作日志
├── AGENTS.md            # AI 导航索引
└── Start Here.md        # 入门引导
```

就这些 — 4 个 agent 目录和几个文件。你已有的笔记保持原位不动。

## 第三步：在 Obsidian 中打开

> **重要提示：** 请从 [obsidian.md](https://obsidian.md/) 下载最新版本的 Obsidian。BYOAO 依赖近期版本中的功能（Bases、Properties view、CLI）。

1. 打开 Obsidian → **管理仓库** → **打开文件夹作为仓库** → 选择你的知识库路径
2. 出现提示时，点击 **"信任作者并启用插件"**
3. 阅读 **"Start Here.md"** 了解基本操作

### 配置 Obsidian 设置

打开知识库后，进入 **设置**（左下角齿轮图标），按以下步骤配置：

#### General → Command Line Interface

滚动到 **Advanced** 区域，启用 **Command line interface**：

![Obsidian General 设置 — 启用 Command line interface](../assets/obsidian-general-cli.png)

> **为什么要启用 CLI？** BYOAO 的技能通过 Obsidian CLI 来搜索、读取反向链接和查询知识库。没有它，/cook 等技能无法运行。

#### Core Plugins

进入 **Core plugins**，确保以下插件已 **启用**：

- **Backlinks** — 显示从其他文件到当前文件的链接
- **Bases** — 按属性编辑、排序和过滤文件的自定义视图（`INDEX.base` 需要此功能）
- **Canvas** — 在无限画布上排列和连接笔记
- **Command palette** — 通过 `Cmd+P` 快速访问命令

![Core plugins — Backlinks, Bases, Canvas, Command palette](../assets/obsidian-core-plugins-1.png)

还要确认 **Properties view** 已启用（在列表更下方）：

![Core plugins — Properties view](../assets/obsidian-core-plugins-2.png)

Properties view 在侧边栏显示 frontmatter 元数据，方便你查看和编辑 agent 页面上的 `type`、`tags`、`sources` 等字段。

#### Files and Links → 附件设置

进入 **Files and links**，找到 **Default location for new attachments** 下拉菜单，选择 **"In the folder specified below"**。然后在 **Attachment folder path** 中输入 `Attachments`：

![Files and links — 附件文件夹设置](../assets/obsidian-files-and-links.png)

这样图片和其他附件会存放在专用的 `Attachments/` 文件夹中，而不是散落在笔记旁边。

## 第四步：运行 /cook

打开 **Agent Client** 面板（右侧栏图标），输入：

```
/cook
```

这是奇迹发生的地方。/cook 读取你的笔记并编译结构化知识：
- 为跨笔记提到的人物、项目和产品创建实体页面
- 为方法、规则和决策创建概念页面
- 检测笔记之间的矛盾并标记等待审查
- 更新 INDEX.base（知识地图）和 log.md
- 以自然语言报告变更摘要

运行后，按 `Cmd+G` 打开图谱视图，看看你的笔记如何与 agent 编译的知识页面连接。

## 推荐：Obsidian Web Clipper

安装 **[Obsidian Web Clipper](https://obsidian.md/clipper)** 将浏览器变成知识采集工具。Web Clipper 可以将文章、研究论文、参考资料等网页内容直接保存到你的知识库中，转换为干净的 Markdown 文件。

**对 BYOAO 的意义：** 剪藏的页面会成为 `/cook` 的原始素材。AI 在编译时会同时读取你的笔记和网页剪藏，从中提取实体、概念和关联关系。

### 安装

为你的浏览器安装扩展：[Chrome](https://obsidian.md/clipper) | [Safari](https://obsidian.md/clipper) | [Firefox](https://obsidian.md/clipper) | [Edge](https://obsidian.md/clipper) | [Arc](https://obsidian.md/clipper) | [Brave](https://obsidian.md/clipper)

### 配置 BYOAO 剪藏模板

Web Clipper 支持自定义模板，可以自动填充 frontmatter。为你的 BYOAO 知识库创建一个：

1. 打开 Web Clipper 设置（点击扩展图标 → 齿轮图标）
2. 创建新模板，使用以下设置：

| 设置项 | 值 |
|--------|-----|
| **Template name** | BYOAO Article |
| **Note name** | `{{title}}` |
| **Note location** | `Clippings`（或你喜欢的任何文件夹） |
| **Vault** | 你的 BYOAO 知识库 |

3. 在模板正文中使用：

```markdown
---
title: "{{title}}"
date: {{date}}
type: reference
tags:
  - clippings
  - {{#if author}}{{author}}{{/if}}
sources:
  - "{{url}}"
author: "{{author}}"
---

{{content}}
```

现在当你剪藏网页时，它会带着正确的 frontmatter 保存到知识库中 — 等待 `/cook` 处理。

### 工作流程：剪藏 → Cook → 知识

1. 正常浏览网页。发现值得保存的内容时，点击 Web Clipper 图标
2. 可以先高亮关键段落再剪藏（高亮内容会被保留）
3. 网页以 Markdown 文件保存到知识库的 `Clippings/` 文件夹
4. 下次运行 `/cook` 时，AI 会读取你的剪藏并提取实体、概念和关联到知识库
5. 原始剪藏作为来源引用保留 — agent 页面会链接回它

> **小贴士：** 在 Web Clipper 中设置[自动匹配规则](https://obsidian.md/clipper)，为不同网站自动使用不同模板（如文章模板、论文模板、食谱模板等）。

## 接下来

- **[核心概念](core-concepts.md)** — 了解 BYOAO 的工作原理
- **[常见场景](workflows.md)** — 第一次 cook、每周回顾、追踪想法
- **[技能参考](skills-reference.md)** — 所有 AI 技能详解

---

**下一步：** [核心概念](core-concepts.md) →
