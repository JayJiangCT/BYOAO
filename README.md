# BYOAO — Build Your Own AI OS

> 本地优先的 AI 办公助手系统，让 PM/TPM 通过自然语言完成需求分析、状态报告、系统理解等日常任务。

## 核心价值

把分散在 Confluence、BigQuery、Codebase、Obsidian 中的信息，通过 AI Agent 统一调度，降低 PM/TPM 的信息获取和文档生产成本。

## 架构概览

```
👤 PM/TPM
 ├── /command 或自然语言 → OpenCode TUI → LLM Engine (Gemini/Claude)
 └── 🌐 Web Clipper (浏览器) → clip 到 Obsidian Vault

LLM Engine 调度:
 ├── Obsidian Skills → Vault 读写 / 知识图谱遍历
 ├── Atlassian MCP  → Confluence / Jira 数据
 ├── BigQuery MCP   → 数据仓库查询
 └── Local Repos    → 代码系统理解 (file read + grep)

数据层:
 ├── ⭐ Obsidian Vault — 本地知识图谱 (documents as graph nodes)
 ├── Local Repo Clones — 服务代码库
 ├── Confluence / Jira — 公司知识与项目管理
 └── BigQuery — 数据仓库
```

> 在 Obsidian 中打开 `BYOAO-Architecture.canvas` 查看交互式架构图。

## 关键设计决策

| 决策 | 选择 | 理由 |
|------|------|------|
| 集成环境 | OpenCode (开源 TUI) | 多模型支持、MCP 原生、Custom Commands |
| 知识检索 | Agentic Retrieval (无 RAG) | LLM 多轮迭代检索，零基础设施，Obsidian CLI 提供图谱遍历 |
| Obsidian 能力 | [kepano/obsidian-skills](https://github.com/kepano/obsidian-skills) | 官方维护，5 个 SKILL.md，无需自建 MCP |
| 信息采集 | Web Clipper + Custom Templates | 浏览器端一键 clip，AI 自动摘要和打 tag |
| 代码理解 | CLAUDE.md baseline + Local Clone | 工程师用 `/init` 生成 overview，agent 按需读代码 |

## 项目结构

```
BYOAO/
├── BYOAO-Plan.md                    # 完整架构与实施计划
├── BYOAO-Architecture.canvas        # Obsidian Canvas 架构图
├── .opencode/
│   ├── commands/                    # Custom Commands (Skills)
│   │   └── system-explainer.md      # 代码系统解释器
│   └── templates/
│       └── web-clipper/             # Web Clipper 模板 (可导入)
│           ├── confluence-page.json
│           ├── jira-issue.json
│           ├── general-article.json
│           └── meeting-notes.json
├── references/                      # 调研文档
│   ├── BYOAO Open Research Questions.md
│   ├── Codebase Knowledge Layer - Open Questions.md
│   ├── Digital Knowledge Architecture_...md
│   ├── Obsidian CLI Commands Reference.md
│   └── Obsidian Web Clipper Practical Guide.md
└── .obsidian/                       # Obsidian vault 配置
```

## MVP 实施阶段

| Phase | 内容 | 天数 |
|-------|------|------|
| **Phase 1** — Foundation | OpenCode 安装、配置、hello-boyo 验证 | 3 天 |
| **Phase 2** — Obsidian + Web Clipper | Skills 安装、Vault 结构、Web Clipper 模板、enrich-document | 5 天 |
| **Phase 3** — Requirements Analysis | Atlassian MCP 配置、requirements-analysis command | 6 天 |
| **Phase 4** — Polish & Distribution | Setup wizard、skill-creator、E2E 测试、团队试用准备 | 5 天 |

详见 `BYOAO-Plan.md` 中的 Gantt 图和各 Phase 详细任务。

## 信息采集三通道

| 通道 | 触发者 | 数据源 | 落地位置 |
|------|--------|--------|---------|
| **Web Clipper** | TPM 手动 (浏览器) | 网页、Confluence、Jira | `00-Inbox/` |
| **Atlassian MCP** | Agent (TPM 提问) | Confluence/Jira API | `10-Projects/` |
| **system-explainer** | Agent (TPM 提问) | Local repo clones + baseline | `50-Systems/` |

## 快速开始

### 前置要求

- [Obsidian](https://obsidian.md/) 桌面应用
- [Obsidian Web Clipper](https://obsidian.md/clipper) 浏览器扩展
- [OpenCode](https://github.com/opencode-ai/opencode) (TUI)
- Gemini API key 或 Vertex AI 访问权限

### 本地开发

```bash
# Clone
git clone https://github.com/JayJiangCT/BYOAO.git
cd BYOAO

# 用 Obsidian 打开此目录作为 Vault
# 查看 BYOAO-Architecture.canvas 和 BYOAO-Plan.md

# 导入 Web Clipper 模板
# 浏览器 → Web Clipper 设置 → Import → 选择 .opencode/templates/web-clipper/*.json
```

## 参与贡献

目前处于 MVP 试验阶段。欢迎通过 Issues 讨论架构决策和实施方案。

关键讨论文档：
- `references/BYOAO Open Research Questions.md` — 整体开放问题
- `references/Codebase Knowledge Layer - Open Questions.md` — 代码知识层待决事项

## License

Private — 内部团队使用。
