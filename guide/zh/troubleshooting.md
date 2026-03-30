<!-- Translated from en/troubleshooting.md | Last synced: 2026-03-29 -->

[← 返回目录](index.md) | [English](../en/troubleshooting.md)

# 故障排除

常见问题及解决方案。

---

## Obsidian CLI 不可用

**症状：** /weave 或其他技能报错 "Obsidian CLI is not available."

**解决：**
1. 确保 Obsidian 正在运行
2. 确保你的知识库在 Obsidian 中已打开
3. 启用 CLI：**设置** → **通用** → **高级** → **命令行界面**
4. 验证：在终端运行 `obsidian --version`

---

## byoao install 提示 "OpenCode not installed"

**症状：** 安装时警告找不到 OpenCode。

**解决：**
- 安装 OpenCode：`npm install -g opencode` 或访问 [opencode.ai](https://opencode.ai)
- 如果刚安装，打开一个新终端窗口（PATH 可能未更新）
- 没有 OpenCode 也可以使用 `byoao init` 和 `byoao status` — 只是 AI 技能不可用

---

## byoao init 失败

**常见原因：**

- **路径权限：** 确保对目标目录有写入权限
- **路径是文件而非目录：** 知识库路径必须是目录
- **未安装 Obsidian：** `byoao init` 会先检查 Obsidian。从 [obsidian.md](https://obsidian.md) 安装

---

## /weave 找不到我的笔记

**可能原因：**

- **文件被排除：** /weave 跳过 `.obsidian/`、`.git/`、`node_modules/`、模板、AGENT.md 和二进制文件
- **自定义排除：** 检查 `.byoaoignore` 是否有过于宽泛的规则
- **错误的知识库：** 确保在 Obsidian 中打开了正确的知识库
- **非 Markdown 文件：** /weave 只处理 `.md` 文件。PDF、图片等文件会被跳过（结束时报告数量）

---

## Glossary 术语未被链接

**可能原因：**

- **大小写不匹配：** Glossary 术语匹配有一定灵活性，但差异太大可能无法匹配。确保 Glossary 中的术语与笔记中的写法一致
- **在代码块内：** /weave 不在代码块或已有 wikilinks 内创建链接
- **已经链接：** /weave 是幂等的 — 如果术语已经是 `[[wikilink]]`，不会重复处理

---

## AGENT.md 看起来不对或缺少部分

**解决：**
- 运行 `byoao upgrade` 重新生成标记之间的 AGENT.md 区域
- `<!-- byoao:...:start/end -->` 标记之外的手动编辑会被保留
- 标记之间的内容是自动生成的 — 不要手动编辑

---

## 插件在 OpenCode 中未加载

**症状：** BYOAO 工具未出现在 OpenCode 会话中。

**解决：**
1. 检查 BYOAO 是否已注册：在 `.opencode.json`（项目级别）或 `~/.config/opencode/opencode.json`（全局）中查找 `"byoao"`
2. 重新运行 `byoao install` 注册
3. 安装后重启 OpenCode

---

## Obsidian 插件未显示

**症状：** `byoao init` 后 Agent Client 或 BRAT 未出现。

**解决：**
1. 首次打开知识库时，点击 **"信任作者并启用插件"**
2. 前往 **设置** → **第三方插件** 确认已启用
3. 如果 `byoao init` 期间 Obsidian 正在运行，重启 Obsidian 或使用 **Cmd+P** → "Reload app without saving"

---

## 备份和撤销更改

/weave 在修改文件前会在 `.byoao/backups/<timestamp>/` 创建备份。

恢复文件：
```bash
cp .byoao/backups/2026-03-29T14-30/my-note.md ./my-note.md
```

查找最新备份：
```bash
ls -la .byoao/backups/
```

---

## 还是解决不了？

- 查看 [GitHub Issues](https://github.com/JayJiangCT/BYOAO/issues) 了解已知问题
- 提交新 issue，附带：BYOAO 版本（`byoao --version`）、Node 版本（`node --version`）、操作系统、复现步骤

---

**← 上一步：** [CLI 参考](cli-reference.md)
