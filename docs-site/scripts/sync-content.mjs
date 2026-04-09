#!/usr/bin/env node

/**
 * Syncs guide/ content into docs-site/content/ for Quartz to build.
 *
 * - Copies guide/en/*.md  → content/en/
 * - Copies guide/zh/*.md  → content/zh/
 * - Copies guide/assets/* → content/assets/
 * - Transforms relative markdown links for Quartz compatibility
 * - Adjusts image paths from ../assets/ to /assets/
 * - Ensures frontmatter has a title field
 */

import { cpSync, mkdirSync, readdirSync, readFileSync, writeFileSync, rmSync, existsSync } from "node:fs"
import { join, dirname, basename } from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, "..", "..")
const GUIDE = join(ROOT, "guide")
const CONTENT = join(__dirname, "..", "content")

function ensureCleanDir(dir) {
  if (existsSync(dir)) rmSync(dir, { recursive: true })
  mkdirSync(dir, { recursive: true })
}

function transformMarkdown(content, lang) {
  let out = content

  // Fix image paths: ../assets/foo.png → /assets/foo.png
  out = out.replace(/\(\.\.\/assets\//g, "(/assets/")
  out = out.replace(/!\[([^\]]*)\]\(\.\.\/assets\//g, "![$1](/assets/")

  // Remove navigation headers like "[← Back to Index](index.md) | [中文](../zh/...)"
  out = out.replace(/^\[.*?←.*?\]\(.*?\).*\n/m, "")

  // Remove bottom navigation like "**← Previous:** ... | **Next:** ..."
  out = out.replace(/\n---\n\n\*\*←.*$/s, "")
  out = out.replace(/\n---\n\n\*\*下一步.*$/s, "")
  out = out.replace(/\n---\n\n\*\*← 上一步.*$/s, "")

  // Fix cross-language links: (../zh/foo.md) → (/zh/foo)  and  (../en/foo.md) → (/en/foo)
  out = out.replace(/\(\.\.\/zh\/([^)]+)\.md\)/g, "(/zh/$1)")
  out = out.replace(/\(\.\.\/en\/([^)]+)\.md\)/g, "(/en/$1)")

  // Fix same-directory links: (foo.md) → (/en/foo) or (/zh/foo)
  out = out.replace(/\(([a-z0-9-]+)\.md\)/g, `(/${lang}/$1)`)
  // Fix same-directory links with anchor: (foo.md#bar) → (/en/foo#bar)
  out = out.replace(/\(([a-z0-9-]+)\.md(#[^)]+)\)/g, `(/${lang}/$1$2)`)

  // Ensure frontmatter exists; add title from first H1 if missing
  if (!out.startsWith("---")) {
    const h1Match = out.match(/^#\s+(.+)$/m)
    const title = h1Match ? h1Match[1] : basename("untitled")
    out = `---\ntitle: "${title}"\n---\n\n${out}`
  } else {
    // Check if frontmatter has a title
    const fmEnd = out.indexOf("---", 3)
    if (fmEnd !== -1) {
      const fm = out.substring(0, fmEnd)
      if (!fm.includes("title:")) {
        const h1Match = out.match(/^#\s+(.+)$/m)
        const title = h1Match ? h1Match[1] : "Untitled"
        out = out.substring(0, 3) + `\ntitle: "${title}"` + out.substring(3)
      }
    }
  }

  return out
}

function syncLang(lang) {
  const srcDir = join(GUIDE, lang)
  const destDir = join(CONTENT, lang)
  mkdirSync(destDir, { recursive: true })

  const files = readdirSync(srcDir).filter((f) => f.endsWith(".md"))
  for (const file of files) {
    const raw = readFileSync(join(srcDir, file), "utf-8")
    const transformed = transformMarkdown(raw, lang)
    writeFileSync(join(destDir, file), transformed, "utf-8")
  }
  console.log(`  ${lang}/ — ${files.length} files`)
}

function syncAssets() {
  const srcDir = join(GUIDE, "assets")
  const destDir = join(CONTENT, "assets")
  if (!existsSync(srcDir)) return

  mkdirSync(destDir, { recursive: true })
  cpSync(srcDir, destDir, { recursive: true })

  const count = readdirSync(destDir).length
  console.log(`  assets/ — ${count} files`)
}

function createLandingPage() {
  const landing = `---
title: "BYOAO Guide"
---

# BYOAO Guide

> **Build Your Own AI-powered Obsidian** — Turn Obsidian into an LLM Wiki knowledge base.

Choose your language:

- **[English Documentation](/en/index)**
- **[中文文档](/zh/index)**

---

## What is BYOAO?

BYOAO turns your Obsidian vault into an AI-compiled knowledge base. Write notes freely — the AI compiles them into structured, cross-referenced knowledge pages.

**Key features:**
- **LLM Wiki** — AI compiles your notes into entities, concepts, comparisons, and queries
- **Obsidian-native** — wikilinks, frontmatter, graph view
- **AI-native** — \`AGENTS.md\` guides AI agents without RAG
- **Brownfield** — installs alongside existing notes, no migration needed

## Quick Links

| Topic | EN | 中文 |
|-------|-----|------|
| Getting Started | [Getting Started](/en/getting-started) | [快速上手](/zh/getting-started) |
| Core Concepts | [Core Concepts](/en/core-concepts) | [核心概念](/zh/core-concepts) |
| Workflows | [Workflows](/en/workflows) | [常见场景](/zh/workflows) |
| Skills Reference | [Skills Reference](/en/skills-reference) | [技能参考](/zh/skills-reference) |
| CLI Reference | [CLI Reference](/en/cli-reference) | [CLI 参考](/zh/cli-reference) |
| Troubleshooting | [Troubleshooting](/en/troubleshooting) | [故障排除](/zh/troubleshooting) |
| Claude Code Setup | [Claude Code](/en/claude-code-setup) | [Claude Code](/zh/claude-code-setup) |

> Inspired by [Andrej Karpathy's LLM Wiki](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f)
`
  writeFileSync(join(CONTENT, "index.md"), landing, "utf-8")
  console.log("  index.md — landing page")
}

console.log("Syncing guide/ → docs-site/content/")
ensureCleanDir(CONTENT)
syncLang("en")
syncLang("zh")
syncAssets()
createLandingPage()
console.log("Done.")
