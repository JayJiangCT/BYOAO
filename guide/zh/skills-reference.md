<!-- Translated from en/skills-reference.md | Last synced: 2026-03-29 -->

[← 返回目录](index.md) | [English](../en/skills-reference.md)

# 技能参考

BYOAO 的所有 AI 技能。在 Obsidian 的 Agent Client 面板中运行。

> **前提条件：** 所有技能都需要 Obsidian CLI 已启用。参见 [快速上手](getting-started.md#第三步在-obsidian-中打开)。

---

## /cook — 将笔记编译为知识

**功能：** 读取你的笔记和外部来源，提炼为 `entities/`、`concepts/`、`comparisons/` 和 `queries/` 中的结构化知识页面。

**运行方式：**

```
/cook                     # 增量 — 上次 cook 以来新增/修改的笔记
/cook --all               # 全量 — 重新读取知识库中所有笔记
/cook "Feature A"         # 定向 — 匹配关键词的笔记
/cook path/to/note.md     # 定向 — 特定笔记
```

**流程：**
1. 读取目标笔记（默认增量模式）
2. 识别实体（具名事物）和概念（抽象想法）
3. 与已有 agent 页面匹配
4. 创建新页面或更新已有页面
5. 检查来源之间的矛盾
6. 更新 INDEX.base 和 log.md
7. 以自然语言报告变更摘要

**关键行为：**
- 绝不修改用户笔记 — 只在 agent 目录中创建/更新页面
- 检测矛盾并标记等待审查
- 以自然语言报告："更新了 2 个已有页面，创建了 1 个新概念页面"
- 遵循 SCHEMA.md 中的页面阈值

---

## /health — 审计知识库质量

**功能：** 扫描 agent 维护的目录，检查结构性问题并按严重程度分组报告。

**运行方式：**

```
/health
```

**检查项目：**
1. 孤立页面 — 没有入站 wikilinks
2. 断裂的 wikilinks — 链接到不存在的目标
3. 陈旧内容 — `updated` 日期落后最新来源超过 90 天
4. Frontmatter 违规 — 缺失必填字段
5. 标签分类漂移 — 使用了 SCHEMA.md 中未定义的标签
6. 超大页面 — 建议拆分的候选（超过 200 行）

**修复建议：** 每个问题附带具体操作（运行 /cook、修复链接、拆分页面）。修改前始终征求确认。

---

## /prep — 丰富 Frontmatter 和交叉引用

**功能：** 扫描所有用户笔记，丰富 frontmatter，建议 wikilinks 和交叉引用。同时作为 Obsidian CLI 可用性的前提检查。

**运行方式：**

```
/prep                     # 扫描整个知识库
/prep folder=Daily/       # 扫描特定文件夹
```

**流程：**
1. 验证 Obsidian CLI 可用
2. 扫描用户笔记中缺失的 frontmatter
3. 建议 frontmatter 添加（title、date、type、tags）
4. 建议到已有 agent 页面的 wikilinks
5. 报告丰富摘要

---

## /organize — 重新整理知识库目录

**功能：** 分析已有的 frontmatter 元数据，提出合理的目录结构方案，然后使用 `obsidian move` 安全执行移动 — 自动更新所有反向链接。

**运行方式：**

```
/organize                    # 分析整个知识库并提出移动建议
/organize dry-run            # 只展示建议，不执行
/organize scope=Projects/    # 只整理特定目录
/organize aggressive         # 同时建议合并已有结构
```

**前提条件：** 先运行 `/prep` — `/organize` 需要 `type` frontmatter 来决定文件归属。

**流程：**
1. 通过 `obsidian list` 和 frontmatter 分析当前结构
2. 根据 `type` 将文件映射到目标目录
3. 展示分组的前后对比摘要，等待你的批准
4. 使用 `obsidian move` 执行移动（自动更新所有 wikilinks）
5. 验证无断裂链接

**关键行为：**
- 保守策略 — 只建议明确有益的移动
- 不打散完整的文件组（例如 sprint 目录中的关联文件保持在一起）
- 所有移动必须经用户批准 — 不会自动执行
- 使用 `obsidian move` 而非 `mv`，确保反向链接安全更新

---

## /trace — 追踪想法演变

**功能：** 构建某个主题在笔记中随时间演变的时间线。

**运行方式：**

```
/trace topic="rate limiting"
/trace topic="迁移" since="2026-01-01"
```

**参数：**
- `topic`（必填）— 要追踪的想法、概念或术语
- `since`（可选）— 限定搜索的起始日期
- `output`（可选）— 将追踪结果保存为新笔记

**输出包含：**
- 按日期排列的时间线，附带笔记引用
- 阶段识别：发现 → 调研 → 决策 → 实施
- 理解发生转变的转折点
- 未闭合的线索（提及后被放弃）
- 值得追踪的相关主题

---

## /connect — 桥接两个领域

**功能：** 通过知识库的链接图谱，发现两个主题之间的隐藏关系。

**运行方式：**

```
/connect from="支付" to="认证"
```

**参数：**
- `from`（必填）— 第一个主题
- `to`（必填）— 第二个主题
- `output`（可选）— 将连接图谱保存为笔记

**发现内容：**
- 同时讨论两个主题的共同笔记
- 参与两个领域的共同人物
- 共同标签和领域
- 连接它们的图谱路径（最多 3 跳）
- 强度评估：强、中、弱

**如果未找到连接：** 如实报告，并建议如何创建连接。

---

## /mise — 全面知识库健康检查

**功能：** 对整个知识库进行结构性审计 — 检查 frontmatter 覆盖率、断裂链接、孤立笔记、AGENTS.md/SCHEMA.md 漂移及配置。范围比 `/health` 更广，后者只检查 agent 维护的目录。

**运行方式：**

```
/mise
/mise focus=frontmatter   # 只检查 frontmatter 覆盖率
/mise focus=links         # 只检查断裂的 wikilinks
/mise focus=config        # 只检查知识库配置
```

**检查项目：**
1. Frontmatter 覆盖率 — 缺少 YAML 元数据或必填字段的笔记
2. 断裂的 wikilinks — 链接到不存在文件（全库范围）
3. 孤立笔记 — 没有入站 wikilinks（用户笔记和 agent 页面）
4. AGENTS.md / SCHEMA.md 漂移 — 过时引用或不匹配的标签分类
5. v2 agent 目录 — 验证 `entities/`、`concepts/`、`comparisons/`、`queries/` 是否存在
6. 配置检查 — `.obsidian/`、`.opencode/`、`log.md`、`INDEX.base`

**输出：** 结构化报告，附整体健康评分（Good / Fair / Needs attention）以及每个问题的具体修复建议。修改前始终征求确认。

---

## /ideas — 生成可行动的想法

**功能：** 深度扫描知识库，跨领域组合洞察，提出有证据支撑的具体想法。

**运行方式：**

```
/ideas                         # 跨所有领域的想法
/ideas focus="infrastructure"  # 聚焦特定领域
/ideas count=3                 # 限制为 3 个想法
```

**生成的想法类型：**
- **综合** — 将两条已有线索组合成新东西
- **缺口** — 知识库暗示需要但尚不存在的东西
- **连接** — 两个应该沟通的人/项目
- **放大** — 将小想法扩大规模
- **质疑** — 挑战知识库中默认的假设

**核心规则：** 每个想法必须引用 2+ 条笔记，并包含具体下一步。

---

## /challenge — 压力测试你的想法

**功能：** 取一个信念或决定，用你自己的知识库严格检验 — 寻找反证、矛盾和未陈述的假设。

**运行方式：**

```
/challenge belief="我们应该用微服务架构"
/challenge belief="[[决策记录]]" strength=gentle
```

**参数：**
- `belief`（必填）— 要挑战的陈述或笔记引用
- `strength`（可选）— "gentle" 或 "rigorous"（默认）

**发现内容：**
- 支持证据（先公平评估）
- 笔记中的直接矛盾
- 立场随时间的变化
- 未陈述的假设
- 缺失的视角

**输出：** 置信度评级（强 / 中 / 弱 / 被反驳）附带证据和需要思考的问题。

---

## /drift — 检测意图与行动的差距

**功能：** 对比你说要做的事和实际做的事，使用日记和项目文档进行分析。

**运行方式：**

```
/drift                         # 最近 30 天，所有领域
/drift period=60d              # 最近 60 天
/drift focus="API 迁移"        # 聚焦特定项目
```

**参数：**
- `period`（可选）— "7d"、"30d"（默认）、"60d"、"90d"
- `focus`（可选）— 聚焦的项目、领域或目标

**跟踪的分类：**
- **对齐** — 意图已执行
- **延迟** — 进度落后
- **漂移** — 走向了不同方向
- **放弃** — 提出但从未行动
- **涌现** — 未计划但发生了的工作

**检测的模式：** 优先级置换、范围蔓延、精力泄漏、目标放弃、涌现优先级。

---

**← 上一步：** [常见场景](workflows.md) | **下一步：** [CLI 参考](cli-reference.md) →
