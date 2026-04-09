# 在 Claude Code 中使用 BYOAO

BYOAO 是基于 OpenCode 插件构建的，但 LLM Wiki vault 结构是平台无关的 —— 纯 Markdown 文件、wikilinks、YAML frontmatter。通过设置 `.claude/` 目录，你可以在 Claude Code 中使用 BYOAO vault。

## 前置要求

- 已创建的 BYOAO vault（通过 `byoao init` 创建）
- 已安装 [Claude Code](https://code.claude.com)
- Obsidian 已启用 CLI（设置 → 通用 → 高级 → 命令行界面）

## 快速设置

### 1. 创建 `.claude/CLAUDE.md`

Claude Code 读取 `CLAUDE.md` 而不是 `AGENTS.md`。创建一个导入现有 BYOAO 代理指南的文件：

```markdown
# BYOAO Knowledge Base

@../AGENTS.md
@../SCHEMA.md

## Claude Code Notes

- Use Obsidian CLI for all note operations (see rules/obsidian-cli.md)
- User notes are read-only — only agent directories are writable
- Run `/cook` to compile notes into knowledge pages
- Run `/health` to audit knowledge page quality
```

放在 `.claude/CLAUDE.md`（推荐）或 vault 根目录的 `CLAUDE.md`。`@` 导入语法可以引入 `AGENTS.md` 和 `SCHEMA.md` 而无需复制内容。

### 2. 创建路径特定规则

Claude Code 支持通过 `.claude/rules/` 将规则限定到特定文件路径。这可以强制执行 BYOAO 的「用户笔记只读、Agent 页面可写」模型。

**`.claude/rules/obsidian-cli.md`** — 始终加载：

```markdown
# Obsidian CLI

Use Obsidian CLI for all note operations:
- `obsidian read file="..."` to read notes
- `obsidian search query="..."` to search
- `obsidian create file="..." content="..."` to create
- `obsidian list` to list notes

Do not use bash (cat, grep, find, sed) to manipulate note files directly.
Obsidian CLI correctly maintains wikilinks, frontmatter, and file relationships.
```

**`.claude/rules/user-notes-readonly.md`** — 仅在处理用户笔记时加载：

```markdown
---
paths:
  - "**/*.md"
  - "!entities/**"
  - "!concepts/**"
  - "!comparisons/**"
  - "!queries/**"
  - "!SCHEMA.md"
  - "!log.md"
---

# User Notes Are Read-Only

These notes are raw material for knowledge compilation via /cook.
- Read them to extract entities, concepts, and relationships
- Do not modify, rename, or delete them
- Use Obsidian CLI for reading: `obsidian read file="..."`
```

**`.claude/rules/agent-pages.md`** — 仅在处理 Agent 页面时加载：

```markdown
---
paths:
  - "entities/**/*.md"
  - "concepts/**/*.md"
  - "comparisons/**/*.md"
  - "queries/**/*.md"
---

# Agent-Maintained Pages

These are compiled knowledge pages. You can create and update them.

## Rules
- Read SCHEMA.md for tag taxonomy and page conventions before creating pages
- Every page must have frontmatter: title, date, created, updated, type, tags, sources
- Every page must have at least 2 outbound wikilinks
- When updating, check for contradictions — never silently overwrite
- Append an entry to log.md after modifying pages
- Use Obsidian CLI for all operations
```

### 3. 安装 Skills

BYOAO 需要两组 skills：**Obsidian skills**（用于与 vault 交互）和 **BYOAO skills**（用于知识编译）。

#### Obsidian Skills

安装 [kepano/obsidian-skills](https://github.com/kepano/obsidian-skills) 作为 Claude Code 插件。在 Claude Code 会话中运行：

```
/plugin marketplace add kepano/obsidian-skills
/plugin install obsidian@obsidian-skills
```

这会让 Claude 获得 Obsidian CLI、Markdown、Bases、JSON Canvas 和 Defuddle skills。

#### BYOAO Skills

将 BYOAO 专有的 skills（`/cook`、`/health`、`/prep`、`/trace` 等）复制到 `.claude/skills/`：

```bash
for f in .opencode/commands/*.md; do
  name=$(basename "$f" .md)
  mkdir -p ".claude/skills/$name"
  cp "$f" ".claude/skills/$name/SKILL.md"
done
```

或使用符号链接：

```bash
for f in .opencode/commands/*.md; do
  name=$(basename "$f" .md)
  mkdir -p ".claude/skills/$name"
  ln -s "../../../$f" ".claude/skills/$name/SKILL.md"
done
```

所有 skills 的调用方式相同：`/cook`、`/health`、`/trace` 等。

### 4. 配置 MCP 服务器（可选）

如果使用 `pm-tpm` 预设，需要在 `.claude/settings.json` 中配置 Atlassian 和 BigQuery：

```json
{
  "mcpServers": {
    "atlassian": {
      "type": "url",
      "url": "https://mcp.atlassian.com/v1/sse"
    },
    "bigquery": {
      "command": "npx",
      "args": ["-y", "@toolbox-sdk/server", "--prebuilt=bigquery", "--stdio"],
      "env": {
        "BIGQUERY_PROJECT": "your-project-id"
      }
    }
  }
}
```

Claude Code 原生处理 MCP 认证，不需要 `byoao_mcp_auth`。

### 5. Obsidian 集成

在 Obsidian 中安装 **Claudian** 社区插件，将 Claude Code 嵌入侧边栏。配置时指向 vault 根目录。

## 最终目录结构

```
your-vault/
├── AGENTS.md                       # 共享的 Agent 指南（BYOAO 生成）
├── SCHEMA.md                       # 标签分类体系
├── log.md                          # Agent 活动日志
├── entities/                       # Agent 页面
├── concepts/
├── comparisons/
├── queries/
├── .claude/
│   ├── CLAUDE.md                   # 导入 AGENTS.md + SCHEMA.md
│   ├── settings.json               # MCP 服务器（可选）
│   ├── settings.local.json         # 个人覆盖配置（gitignore）
│   ├── rules/
│   │   ├── obsidian-cli.md         # Obsidian CLI 使用规则
│   │   ├── user-notes-readonly.md  # 用户笔记只读
│   │   └── agent-pages.md          # Agent 页面规范
│   └── skills/
│       ├── cook/SKILL.md           # 知识编译
│       ├── health/SKILL.md         # 健康检查
│       └── .../SKILL.md            # 其他 BYOAO skills
├── .opencode/                      # OpenCode 配置（现有）
│   └── commands/
└── .opencode.json
```

`.claude/` 和 `.opencode/` 可以共存，各平台读取各自的配置。

## 个人偏好

不需要提交到版本控制的偏好设置，可以在 vault 根目录创建 `CLAUDE.local.md` 并添加到 `.gitignore`。它会与 `CLAUDE.md` 一起加载。

机器级别的设置使用 `.claude/settings.local.json`。

## 自动记忆

Claude Code 的自动记忆功能开箱即用。笔记存储在 `~/.claude/projects/<project>/memory/` —— 与 vault 分开。`MEMORY.md` 的前 200 行在会话启动时加载。使用 `/memory` 命令浏览和编辑。

## 与 OpenCode 的关键区别

| 方面 | OpenCode | Claude Code |
|------|----------|-------------|
| Agent 指南 | `AGENTS.md`（通过 hook 注入） | `.claude/CLAUDE.md`（导入 `@../AGENTS.md`） |
| 规则 | 动态（基于 hook） | 静态（`.claude/rules/*.md` 支持路径限定） |
| Skills | `.opencode/commands/` | `.claude/skills/<name>/SKILL.md` |
| MCP 配置 | 插件自动处理 | `.claude/settings.json` |
| 认证恢复 | `byoao_mcp_auth` 工具 | 原生支持（不需要） |

## 故障排除

**Claude 不遵循规则？**
- 运行 `/memory` 确认哪些文件被加载
- 检查 `.claude/CLAUDE.md` 是否存在且导入正确
- 验证 rules 中的路径模式是否匹配文件结构

**找不到 Skills？**
- 确保每个 skill 在 `.claude/skills/<name>/SKILL.md`（例如 `.claude/skills/cook/SKILL.md`）
- 如果使用符号链接，检查文件权限

**Obsidian CLI 不可用？**
- 先打开 Obsidian
- 启用 CLI：设置 → 通用 → 高级 → 命令行界面
- 验证：`obsidian --version`
