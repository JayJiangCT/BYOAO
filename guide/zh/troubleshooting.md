<!-- Translated from en/troubleshooting.md | Last synced: 2026-04-09 -->

[← 返回目录](index.md) | [English](../en/troubleshooting.md)

# 故障排除

常见问题及解决方案。

---

## Obsidian 设置问题

### Obsidian CLI 不可用

**症状：** /cook 或其他技能报错 "Obsidian CLI is not available."

**解决：**
1. 确保 Obsidian 正在运行且知识库已打开
2. 进入 **Settings** → **General** → 滚动到 **Advanced** → 启用 **Command line interface**

![在 Obsidian General 设置中启用 CLI](../assets/obsidian-general-cli.png)

3. 在终端验证：`obsidian --version`
4. 如果找不到命令，重启 Obsidian 后再试

> CLI 开关仅在 Obsidian 运行时生效。如果关闭 Obsidian，CLI 将不可用。

---

### INDEX.base 打不开 / 显示 "Unknown file type"

**症状：** 在 Obsidian 中点击 `INDEX.base` 没有反应或显示错误。

**解决：** 需要启用 **Bases** 核心插件。

1. 进入 **Settings** → **Core plugins**
2. 找到 **Bases** 并启用

![Core plugins — 启用 Bases](../assets/obsidian-core-plugins-1.png)

---

### Agent 读了 INDEX.base 却仍然列不出页面

**症状：** 你（或 AI Agent）执行了 `obsidian read file="INDEX.base"`，期望输出里直接出现笔记标题，但看到的是 YAML、视图或过滤条件。

**原因：** `INDEX.base` 是 **Obsidian Bases** 索引文件。磁盘上存的是 **定义**，Obsidian 在应用里把它求值为带路径、标签、日期、反向链接等列的实时表格；CLI 的 **`read` 返回的是该定义**，不是渲染后的行。

**处理：**

1. 把 **`INDEX.base`** 当作权威 wiki 索引：从中理解路径与属性范围，再用 **`obsidian properties`**（如按 `type=entity` / `concept` / `comparison` / `query`）、**`obsidian search`**、**`obsidian tags`**、**`obsidian backlinks`** 列举和遍历与 Base 中一致的笔记。
2. 完整遵循 **`/ask`** 技能（其中写明了 Bases + CLI 流程）。
3. 知识地图变化大时运行 **`/wiki`**，检查 Base 的查询、视图与列是否仍匹配。

---

### 侧边栏看不到 Frontmatter

**症状：** Agent 页面有 YAML frontmatter 但侧边栏看不到元数据字段。

**解决：** 启用 **Properties view** 核心插件。

1. 进入 **Settings** → **Core plugins**
2. 向下滚动，启用 **Properties view**

![Core plugins — 启用 Properties view](../assets/obsidian-core-plugins-2.png)

Properties view 在侧边栏以结构化面板显示 `type`、`tags`、`sources` 等 frontmatter 字段。

---

### 图片散落在笔记旁边

**症状：** 粘贴或拖拽图片到 Obsidian 时，图片落在笔记所在文件夹而不是专用文件夹。

**解决：** 配置附件文件夹：

1. 进入 **Settings** → **Files and links**
2. 将 **Default location for new attachments** 设为 **"In the folder specified below"**
3. 在 **Attachment folder path** 中输入 `Attachments`

![Files and links — 附件文件夹设置](../assets/obsidian-files-and-links.png)

---

### 必需核心插件清单

首次打开知识库后，在 **Settings** → **Core plugins** 中确认以下插件已启用：

| 插件 | 用途 | 默认状态 |
|------|------|----------|
| **Backlinks** | 查看 agent 页面的入站链接 | 开启 |
| **Bases** | 打开 `INDEX.base` 知识地图 | 开启 |
| **Canvas** | vault 中的画布文件 | 开启 |
| **Command palette** | `Cmd+P` 命令访问 | 开启 |
| **Properties view** | 侧边栏查看 frontmatter | 开启 |

如有禁用，直接打开即可，无需重启。

---

## Agent Client 问题

### Agent Client 卡在 "Connecting to OpenCode..."

**症状：** Obsidian 中的 Agent Client 面板一直显示 "Connecting to OpenCode..."，无法连接。

**解决：**
1. 按 `Cmd+P` → 输入 "Reload app without saving" → 回车
2. 重新打开 Agent Client 面板
3. 如果仍然无法连接，完全关闭 Obsidian 后重新打开
4. 在终端验证 OpenCode 是否正常：`cd /path/to/vault && opencode acp`
5. 如果看到配置错误，检查 `~/.config/opencode/opencode.json` 是否有无效条目

---

### Obsidian 插件未显示

**症状：** `byoao init` 后 Agent Client 或 BRAT 未出现。

**解决：**
1. 首次打开知识库时，点击 **"Trust author and enable plugins"**（信任作者并启用插件）
2. 前往 **Settings** → **Community plugins** 确认已启用
3. 如果 `byoao init` 期间 Obsidian 正在运行，重启 Obsidian 或使用 **Cmd+P** → "Reload app without saving"

---

### 插件在 OpenCode 中未加载

**症状：** BYOAO 工具未出现在 OpenCode 会话中。

**解决：**
1. 检查 BYOAO 是否已注册：在 `.opencode.json`（项目级别）或 `~/.config/opencode/opencode.json`（全局）中查找 `"byoao"`
2. 重新运行 `byoao install` 注册
3. 安装后重启 OpenCode

---

## 知识库问题

### /cook 找不到我的笔记

**可能原因：**

- **文件被排除：** /cook 跳过 `.obsidian/`、`.git/`、`node_modules/`、agent 目录、AGENTS.md 和二进制文件
- **错误的知识库：** 确保在 Obsidian 中打开了正确的知识库
- **非 Markdown 文件：** /cook 只处理 `.md` 文件。PDF、图片等文件会被跳过
- **已经处理：** 增量模式下，/cook 只处理上次运行后修改的笔记。使用 `/cook --all` 重新读取所有内容

---

### AGENTS.md 看起来不对或缺少部分

**`byoao upgrade` 实际会做什么：** 当 `.byoao/manifest.json` 里记录的知识库 BYOAO **版本低于**当前安装的 CLI 时，才会同步打包进来的基础设施（例如 `.opencode/skills/`）。若两者版本已经一致（例如都是 2.0.3），会提示知识库已是最新，**不会对知识库文件做修改**。

**重要：** `byoao upgrade` **不会**覆盖库根目录的 **`AGENTS.md`** 和 **`SCHEMA.md`**。这两个文件只在 **`byoao init`** 时按模板生成一次，之后视为你的内容，避免覆盖自定义修改和分类。

**全局 vs 库内 skills：** `byoao install -g` 会把技能装到 `~/.config/opencode/skills`；`byoao init` 还会在 **`{知识库}/.opencode/skills`** 再拷一份。升级 npm 里的 `byoao` 后，在**知识库根目录**执行 **`byoao upgrade`**：需要时会更新库内副本；**只要本机已有** `~/.config/opencode/skills`，每次成功执行都会用当前包**刷新该目录**（即使提示 vault 已与 CLI 同版本）。若要强制重拷库内 `.opencode/skills`，用 **`byoao upgrade --force`**。

**最省事 — `byoao sync-docs`：** 在知识库根目录执行 `byoao sync-docs`（可加 `--dry-run` 先看会改什么）。若缺少对应标题，会自动插入包里的 **Knowledge Retrieval (Q&A)**（`AGENTS.md`）和 **Retrieval**（`SCHEMA.md`），不整文件覆盖。注意 `AGENTS.md` 里需保留 `## Available Skills` 标题，工具才能把检索小节插在它的前面。

**手动合并：** 从 [仓库](https://github.com/JayJiangCT/BYOAO) 的 `byoao/src/assets/presets/common/` 下模板，或 `node_modules/@jayjiang/byoao/` 中复制段落，粘贴进你的 `AGENTS.md`、`SCHEMA.md`。

---

### 撤销 agent 页面更改

Agent 页面位于 `entities/`、`concepts/`、`comparisons/` 和 `queries/` 中。由于 /cook 绝不修改你自己的笔记，你可以安全地删除任何 agent 页面，然后重新运行 `/cook` 来重新生成。

查看最近的变更，检查 `log.md` 或运行：
```bash
byoao logs
```

---

## 安装问题

### 终端提示 "command not found: node" 或 "command not found: npm"

**症状：** 尝试安装 BYOAO 时，终端提示找不到 `node` 或 `npm` 命令。

**解决：**
1. 你需要先安装 Node.js。访问 [nodejs.org](https://nodejs.org/)，下载 **LTS** 版本
2. 运行安装程序 — 它会同时安装 `node` 和 `npm`
3. **安装完成后，关闭并重新打开终端**（终端需要刷新 PATH 环境变量）
4. 验证：`node --version` 应该输出 `v18.x.x` 或更高版本

**安装后仍然不行？**
- **Mac：** 尝试打开新的 Terminal 窗口。如果使用 zsh，运行 `source ~/.zshrc`
- **Windows：** 完全关闭 PowerShell 并重新打开。如果仍然失败，重启电脑

---

### 运行 npm install -g 时提示 "EACCES permission denied"

**症状：** `npm install -g @jayjiang/byoao` 因权限错误而失败。

**解决（Mac/Linux）：**
```bash
sudo npm install -g @jayjiang/byoao
```
输入电脑密码即可。`sudo` 命令以管理员权限运行安装。

**解决（Windows）：** 右键点击 PowerShell，选择「以管理员身份运行」，然后重试安装命令。

**更好的长期方案：** 配置 npm 全局安装不需要 sudo：
```bash
mkdir -p ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.zshrc
source ~/.zshrc
```

---

### byoao install 提示 "OpenCode not installed"

**症状：** 安装时警告找不到 OpenCode。

**解决：**
- 安装 OpenCode：`npm install -g opencode` 或访问 [opencode.ai](https://opencode.ai)
- 如果刚安装，打开一个新终端窗口（PATH 可能未更新）
- 没有 OpenCode 也可以使用 `byoao init` 和 `byoao status` — 只是 AI 技能不可用

---

### byoao init 失败

**常见原因：**

- **路径权限：** 确保对目标目录有写入权限
- **路径是文件而非目录：** 知识库路径必须是目录
- **未安装 Obsidian：** `byoao init` 会先检查 Obsidian。从 [obsidian.md](https://obsidian.md) 安装

---

## MCP 服务问题

### MCP 服务连接过期（Atlassian / BigQuery）

**症状：** Agent 提示 "Atlassian connection failed" 或 BigQuery 查询返回认证错误。

**解决：**
1. 点击 Agent Client 面板右上角 "..." 菜单 → **Restart agent**
2. 浏览器会弹出重新认证页面
3. Google 服务请确保选择正确的 Google 账号（工作账号，非个人账号）
4. 完成登录后返回 Obsidian
5. 让 agent 重试之前的请求

如果仍然不行，完全重启 Obsidian。

---

### BigQuery：需要认证

**症状：** Agent 提示 BigQuery 工具不可用，或查询时返回认证错误。

BigQuery 认证是延迟触发的 —— 当你第一次让 agent 查询 BigQuery 时，它会通过 `byoao_mcp_auth` 工具自动调用 `gcloud auth application-default login`。

**解决：**
1. 确保已安装 gcloud CLI：https://cloud.google.com/sdk/docs/install
2. 让 agent 执行一个 BigQuery 查询 —— 它应该会自动调用 `byoao_mcp_auth`
3. 在弹出的浏览器窗口中完成 Google 登录
4. 点击 "..." → **Restart agent**，然后重试

---

## 查看错误日志

如果遇到问题但不确定原因：

```bash
byoao logs
```

这会显示工具、hook 和 CLI 命令的最近错误。如需将日志分享给开发者：

```bash
byoao logs --export ~/Desktop/byoao-logs.txt
```

导出的文件包含 BYOAO 版本、Node 版本和操作系统信息。分享前请检查文件内容，确保不含敏感信息。

更多选项见 [CLI 参考 — byoao logs](cli-reference.md#byoao-logs)。

---

## 还是解决不了？

- 运行 `byoao logs --export ~/Desktop/byoao-logs.txt` 并将文件附在报告中
- 查看 [GitHub Issues](https://github.com/JayJiangCT/BYOAO/issues) 了解已知问题
- 提交新 issue，附带：BYOAO 版本（`byoao --version`）、Node 版本（`node --version`）、操作系统、复现步骤

---

**← 上一步：** [CLI 参考](cli-reference.md)
