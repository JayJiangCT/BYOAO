---

## title: BYOAO Open Research Questions
tags:
  - byoao
  - research
  - open-questions
date: 2026-03-11
status: pending

# BYOAO 待调研问题清单

> 背景：BYOAO 选择 Obsidian 作为本地知识库的核心接口，Agent 通过 Obsidian CLI 访问本地知识（图谱、搜索、元数据），通过 MCP 访问云端知识（Confluence、BigQuery）。以下问题直接影响架构设计。

---

## Q1: Obsidian CLI 的运行时依赖

**核心问题**: Obsidian CLI 需要 Obsidian 桌面应用正在运行才能工作吗？

**为什么重要**:

- 如果必须开着 Obsidian 才能用 CLI，那 Agent 的本地知识能力完全依赖于用户是否打开了 Obsidian
- 对于自动化场景（定时索引、CI/CD 触发）会成为障碍
- 影响团队推广：能否要求所有 PM 始终运行 Obsidian？

**需要验证**:

- 关闭 Obsidian 后，执行 `obsidian search query="test"` 看是否报错
- 是否有 headless 模式或后台服务模式
- 如果必须运行，是否可以最小化到后台运行

---

## Q2: 语义搜索的 Gap 如何弥补

**核心问题**: CLI 的 `search` 是关键词匹配，无法处理语义相似（如"客户流失" vs "churn rate"）。这个 gap 怎么补？

**候选方案**:


| 方案                           | 优点                   | 缺点                        | 需要验证                |
| ---------------------------- | -------------------- | ------------------------- | ------------------- |
| **Smart Connections 插件**     | 已有本地向量嵌入，零代码         | 插件质量？是否可通过 CLI `eval` 调用？ | 安装测试搜索质量            |
| **自建 sqlite-vec 向量搜索**       | 完全控制，不依赖插件           | 需要自建索引、嵌入、MCP server      | 评估开发量               |
| **Obsidian `eval` + 内部 API** | 可能访问 Obsidian 内部搜索索引 | API 不稳定？文档少？              | 测试 `eval` 能调用哪些 API |


**需要验证**:

- 安装 Smart Connections 插件，测试语义搜索质量
- 测试 `obsidian eval code="app.vault.search('...')"` 或类似 API 是否可行
- 如果用 Smart Connections，能否通过 `eval` 命令调用其搜索接口

---

## Q3: 知识入口 — 什么内容应该在 Vault 里

**核心问题**: PM 的工作产出散落在 Confluence、Google Docs、Jira 等处。Vault 里应该放什么？

**思考维度**:


| 内容类型            | 是否放 Vault | 理由                            |
| --------------- | --------- | ----------------------------- |
| 会议笔记、个人思考       | 是         | 快速记录，Obsidian 最擅长             |
| BYOAO 生成的分析/报告   | 是         | Agent 输出落地，方便回溯               |
| Confluence 页面副本 | ？         | Agent 可通过 MCP 直接访问，是否需要本地副本？  |
| 项目决策记录          | ？         | 团队共享的放 Confluence，个人的放 Vault？ |
| 模板/方法论          | 是         | Agent 生成文档时参考                 |


**需要想清楚**:

- Vault 和 Confluence 之间是否需要双向同步？还是各管各的？
- Agent 同时搜索 Vault + Confluence 时，如何去重/合并结果？
- PM 是否愿意在两个地方维护内容？（如果答案是"不愿意"，那 Vault 应该尽量轻量）

---

## Q4: Obsidian 对非技术用户的上手成本

**核心问题**: PM/TPM（非工程师）能否快速上手 Obsidian？最大的阻力是什么？

**需要调研**:

- 让 1-2 个 PM 试用 Obsidian 一周，收集反馈
- 最小可用配置是什么？（只装哪些插件、只教哪些操作）
- 是否需要 Starter Vault（预配置好的模板库）来降低门槛
- 对比 Obsidian 和 PM 现有工具（Confluence、Notion）的体验差异，找出核心摩擦点

---

## 调研优先级建议


| 优先级 | 问题             | 理由                              |
| --- | -------------- | ------------------------------- |
| P0  | Q1 (CLI 运行时依赖) | 如果 CLI 必须 Obsidian 运行，直接影响架构可行性 |
| P0  | Q2 (语义搜索)      | 决定是否自建 RAG 还是用现有插件              |
| P1  | Q3 (知识入口)      | 影响 Vault 设计和用户工作流               |
| P1  | Q4 (上手成本)      | 影响推广策略，但可以边做边调整                 |


