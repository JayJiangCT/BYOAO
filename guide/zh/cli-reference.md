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

**模式检测：**
- 空路径或不存在 → **Mode A**（全新知识库）
- 路径中有 `.md` 文件 → **Mode B**（采纳已有，向用户确认）
- 路径中有 `.obsidian/` → **Mode B** 且保留 `.obsidian/` 配置

---

## byoao status

检查知识库健康：笔记数量、目录、wikilinks、断裂链接。

```bash
byoao status              # 检查当前目录
byoao status ~/my-kb      # 检查指定路径
```

| 参数 | 说明 |
|------|------|
| `[path]` | 知识库路径（默认：当前目录） |

---

## byoao upgrade

升级 BYOAO CLI 和知识库基础设施（skills、commands、模板、Obsidian 配置）到最新版本。

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
| `--force` | 即使版本一致也执行 |
| `--skip-cli` | 跳过 CLI 自我更新，仅升级知识库 |
| `--preset <name>` | 初始化时覆盖预设 |

---

## byoao check-obsidian

检查 Obsidian 是否已安装并运行。

```bash
byoao check-obsidian
```

报告：是否安装、是否运行、版本、仓库目录。

---

**← 上一步：** [技能参考](skills-reference.md) | **下一步：** [故障排除](troubleshooting.md) →
