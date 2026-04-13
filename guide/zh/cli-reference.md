<!-- Translated from en/cli-reference.md | Last synced: 2026-03-29 -->

[← 返回目录](index.md) | [English](../en/cli-reference.md)

# CLI 参考

BYOAO 的所有命令行命令。

---

## byoao install

在 OpenCode 中注册 BYOAO 插件并安装 Obsidian Skills。

```bash
byoao install              # 交互式 — 询问位置和 skills
byoao install -y -g        # 非交互式，全局安装
byoao install --no-skills  # 跳过 Obsidian Skills
```

| 参数 | 说明 |
|------|------|
| `-g, --global` | 全局安装（所有项目） |
| `-y, --yes` | 跳过交互提示 |
| `--no-skills` | 跳过安装 Obsidian Skills |
| `--project-dir <path>` | 项目目录（默认：当前目录） |

---

## byoao uninstall

从 OpenCode 移除 BYOAO 插件。知识库和笔记不受影响。

```bash
byoao uninstall
byoao uninstall -g -y    # 非交互式，全局
```

| 参数 | 说明 |
|------|------|
| `-g, --global` | 从全局配置卸载 |
| `-y, --yes` | 跳过确认 |
| `--project-dir <path>` | 项目目录（默认：当前目录） |

---

## byoao init

创建新知识库或采纳已有文件夹。

```bash
# 交互式（推荐）
byoao init

# 采纳已有文件夹
byoao init --from ~/Documents/my-notes

# 非交互式，使用参数
byoao init --kb "My KB" --name "Jay" --preset pm-tpm
```

| 参数 | 说明 |
|------|------|
| `--kb <name>` | 知识库名称（非交互模式必填） |
| `--name <name>` | 你的名字（默认：系统用户名） |
| `--path <path>` | 存储位置（默认：~/Documents/{知识库名}） |
| `--from <path>` | 采纳已有文件夹作为知识库 |
| `--preset <name>` | 预设：`minimal`（默认）或 `pm-tpm` |
| `--provider <name>` | AI 提供商：`copilot`、`gemini` 或 `skip` |
| `--gcp-project <id>` | GCP 项目 ID（`--provider=gemini` 时必填） |

**交互式预设：** 未传 **`--preset`** 时，CLI 会先问**主要用途**（Personal / Work），再在 Work 场景下按需展示**工作向预设**列表。传入 **`--preset`** 会跳过上述提问，本次初始化固定使用该预设。

**模式检测：**
- 空路径或不存在 → **Mode A**（全新知识库）
- 路径中有 `.md` 文件 → **Mode B**（采纳已有，向用户确认）
- 路径中有 `.obsidian/` → **Mode B** 且保留 `.obsidian/` 配置

---

## byoao status

检查知识库健康：agent 页面按类型计数、断裂链接、INDEX.base 完整性。

```bash
byoao status              # 检查当前目录
byoao status ~/my-kb      # 检查指定路径
```

| 参数 | 说明 |
|------|------|
| `[path]` | 知识库路径（默认：当前目录） |

---

## byoao upgrade

升级 BYOAO CLI 和知识库基础设施（会更新**当前知识库**下的 `.opencode/skills/`、Obsidian 插件配置等）。若本机已存在 **`~/.config/opencode/skills`**（曾执行过 **`byoao install -g`**），在 vault 升级**成功且无复制错误**时，会**顺带用当前包里的技能覆盖刷新**该全局目录，避免全局 skills 长期过期。**不会**覆盖库根 `AGENTS.md` / `SCHEMA.md`；老库补模板请用 **`byoao sync-docs`**。

命令分两阶段执行：先检查 npm 上是否有更新的 CLI 版本并提示更新，然后升级知识库内容。如果 CLI 更新成功，进程会退出，再次运行 `byoao upgrade` 即可完成知识库升级。

```bash
byoao upgrade             # 升级 CLI + 当前目录的知识库
byoao upgrade ~/my-kb     # 升级 CLI + 指定知识库
byoao upgrade --dry-run   # 预览变更，不执行
byoao upgrade --skip-cli  # 仅升级知识库，跳过 CLI 更新
```

| 参数 | 说明 |
|------|------|
| `-y, --yes` | 跳过确认提示 |
| `--dry-run` | 只显示计划，不执行 |
| `--force` | 即使版本一致也执行（重拷 vault 内 skills；若存在全局目录仍会同步 `~/.config/opencode/skills`） |
| `--skip-cli` | 跳过 CLI 自我更新，仅升级知识库 |
| `--preset <name>` | 初始化时覆盖预设 |

---

## byoao sync-docs

在库根的 **`AGENTS.md`**、**`SCHEMA.md`** 中**仅当缺少**对应章节时，插入当前包里的模板段落（例如 **Knowledge Retrieval (Q&A)**、**Retrieval**）。属于安全合并：不整文件覆盖、不删除你已有内容。在知识库根目录执行（或传入路径）。

```bash
byoao sync-docs              # 当前目录所在知识库
byoao sync-docs ~/my-kb      # 指定知识库
byoao sync-docs --dry-run    # 只预览，不写文件
```

| 参数 | 说明 |
|------|------|
| `--dry-run` | 仅预览，不修改文件 |

**说明：** `AGENTS.md` 里需要保留 `## Available Skills` 标题，工具才能把检索小节插在它前面。若你已删掉或改名该标题，请手动从包内模板合并。

---

## byoao check-obsidian

检查 Obsidian 是否已安装并运行。

```bash
byoao check-obsidian
```

报告：是否安装、是否运行、版本、仓库目录。

---

## byoao logs

查看和管理 BYOAO 错误日志。工具、hook 和 CLI 命令的错误会自动记录到 `~/.byoao/logs/error.log`。

```bash
byoao logs                # 显示最近 20 条
byoao logs --tail 50      # 显示最近 50 条
byoao logs --json         # 输出原始 JSON（便于脚本处理）
byoao logs --export ~/Desktop/byoao-logs.txt   # 导出到文件
byoao logs --clear        # 清空所有日志
```

| 参数 | 说明 |
|------|------|
| `--tail <n>` | 显示最近 N 条（默认：20） |
| `--export <path>` | 导出日志到文件（包含系统信息头） |
| `--clear` | 清空所有日志文件 |
| `--json` | 以原始 JSON 行格式输出 |

**导出格式：** 导出的文件包含 BYOAO 版本、Node 版本和操作系统信息——方便分享日志用于排障。

---

**← 上一步：** [技能参考](skills-reference.md) | **下一步：** [故障排除](troubleshooting.md) →
