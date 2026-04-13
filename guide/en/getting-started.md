[← Back to Index](index.md) | [中文](../zh/getting-started.md)

# Getting Started

Get from zero to an LLM Wiki knowledge base in about 10 minutes.

## What You Need

Three things need to be installed before you can use BYOAO:

### 1. Obsidian (note-taking app)

Download the latest version from [obsidian.md](https://obsidian.md/) and install it. This is where you write notes and browse your knowledge base.

### 2. Node.js 18+ (JavaScript runtime)

Node.js is a tool that lets you run BYOAO's installer. It also comes with `npm` (Node Package Manager), which is the command you'll use to install BYOAO.

**How to install:**
1. Go to [nodejs.org](https://nodejs.org/)
2. Download the **LTS** (Long Term Support) version — this is the stable, recommended version
3. Run the installer and follow the prompts (accept all defaults)

**Verify it worked:** Open a terminal and run:

```bash
node --version
```

You should see something like `v20.x.x` or `v22.x.x` (any version 18 or higher is fine).

> **What is a terminal?**
> - **Mac:** Open **Terminal** (press `Cmd+Space`, type "Terminal", press Enter)
> - **Windows:** Open **PowerShell** (press `Win+X`, select "Windows PowerShell")
> - You only need the terminal for the installation steps below. After setup, everything happens inside Obsidian.

### 3. OpenCode (AI engine)

OpenCode is the AI tool that powers BYOAO's skills. Once you have Node.js installed, you can install OpenCode via npm:

```bash
npm install -g opencode
```

Or download it from [opencode.ai](https://opencode.ai).

> **What does `npm install -g` mean?** `npm` is the package manager that came with Node.js. The `-g` flag means "install globally" so the command is available everywhere on your computer, not just in one folder.

## Step 1: Install BYOAO

```bash
npm install -g @jayjiang/byoao
```

Then register the plugin and install Obsidian Skills:

```bash
byoao install
```

This does two things:
1. Registers BYOAO as an OpenCode plugin
2. Installs Obsidian Skills (obsidian-cli, obsidian-markdown, etc.) so AI can interact with your vault

<details>
<summary>Install from source (for developers)</summary>

```bash
git clone https://github.com/JayJiangCT/BYOAO.git
cd BYOAO/byoao
npm install && npm run build && npm link
byoao install
```

</details>

## Step 2: Create Your Knowledge Base

```bash
byoao init
```

The interactive setup asks:

1. **Your name** — used in AGENTS.md so AI knows whose knowledge base this is
2. **Knowledge base name** — defaults to "{Name}'s KB"
3. **Vault location** — defaults to `~/Documents/{KB name}`
4. **Work preset?** — choose "minimal" for a pure LLM Wiki, or "PM/TPM" to add Atlassian and BigQuery MCP services
5. **Connected services?** — if you chose PM/TPM, select which MCP services to enable (Atlassian, BigQuery). BigQuery will prompt for your GCP Project ID and handle authentication automatically
6. **Set up AI provider?** — optionally authenticate now, or do it later

### Already have notes?

Adopt an existing folder instead:

```bash
byoao init --from ~/Documents/my-notes
```

BYOAO detects your existing files and injects its structure alongside them. If the folder is already an Obsidian vault (`.obsidian/` exists), your config is preserved — BYOAO never overwrites your plugins, themes, or hotkeys.

### What gets created

For a minimal KB:

```
{KB Name}/
├── .obsidian/           # Obsidian config + Agent Client plugin
├── entities/            # Agent-compiled: people, orgs, projects
├── concepts/            # Agent-compiled: methods, rules, decisions
├── comparisons/         # Agent-compiled: side-by-side analyses
├── queries/             # Agent-compiled: valuable Q&A
├── SCHEMA.md            # Tag taxonomy and conventions
├── INDEX.base           # Knowledge map (Bases; copied from package template when missing on init)
├── log.md               # Action log
├── AGENTS.md            # AI navigation index
└── Start Here.md        # Your onboarding guide
```

That's it — 4 agent directories and a few files. Your existing notes stay exactly where they are.

## Step 3: Open in Obsidian

> **Important:** Download the latest version of Obsidian from [obsidian.md](https://obsidian.md/). BYOAO requires features available in recent versions (Bases, Properties view, CLI).

1. Open Obsidian → **Manage vaults** → **Open folder as vault** → select your KB path
2. When prompted, click **"Trust author and enable plugins"**
3. Read **"Start Here.md"** for a quick orientation

### Configure Obsidian Settings

After opening your vault, go to **Settings** (gear icon in the bottom-left) and configure the following:

#### General → Command Line Interface

Scroll down to the **Advanced** section and enable **Command line interface**:

![Obsidian General settings — enable Command line interface](../assets/obsidian-general-cli.png)

> **Why enable CLI?** BYOAO's skills use the Obsidian CLI to search, read backlinks, and query the knowledge base. Without it, skills like /cook can't function.

#### Core Plugins

Go to **Core plugins** and make sure the following are **enabled**:

- **Backlinks** — show links from other files to the current file
- **Bases** — custom views for editing, sorting, and filtering files by properties (required for `INDEX.base`)
- **Canvas** — arrange and connect notes on an infinite canvas
- **Command palette** — quick command access via `Cmd+P`

![Core plugins — Backlinks, Bases, Canvas, Command palette](../assets/obsidian-core-plugins-1.png)

Also verify that **Properties view** is enabled (further down the list):

![Core plugins — Properties view](../assets/obsidian-core-plugins-2.png)

Properties view shows frontmatter metadata in the sidebar, making it easy to inspect and edit `type`, `tags`, `sources`, and other fields on agent pages.

#### Files and Links → Attachment Settings

Go to **Files and links**, find the **Default location for new attachments** dropdown, and select **"In the folder specified below"**. Then set **Attachment folder path** to `Attachments`:

![Files and links — attachment folder settings](../assets/obsidian-files-and-links.png)

This keeps images and other attachments in a dedicated `Attachments/` folder instead of scattering them alongside your notes.

## Step 4: Run /cook

Open the **Agent Client** panel (icon in the right sidebar) and type:

```
/cook
```

This is where the magic happens. /cook reads your notes and compiles structured knowledge:
- Creates entity pages for people, projects, and products mentioned across notes
- Creates concept pages for methods, rules, and decisions
- Detects contradictions across your notes and flags them for review
- Updates INDEX.base (knowledge map) and log.md
- Reports a natural-language summary of what changed

After it runs, press `Cmd+G` to open Graph View and see your notes connected to agent-compiled knowledge pages.

## Recommended: Obsidian Web Clipper

Install **[Obsidian Web Clipper](https://obsidian.md/clipper)** to turn your browser into a knowledge capture tool. Web Clipper saves articles, research papers, recipes, references — anything on the web — directly into your vault as clean Markdown.

**Why it matters for BYOAO:** Clipped pages become raw material for `/cook`. The AI reads them alongside your own notes and compiles structured knowledge — entities, concepts, and connections — from everything you've captured.

### Install

Add the extension for your browser: [Chrome](https://obsidian.md/clipper) | [Safari](https://obsidian.md/clipper) | [Firefox](https://obsidian.md/clipper) | [Edge](https://obsidian.md/clipper) | [Arc](https://obsidian.md/clipper) | [Brave](https://obsidian.md/clipper)

### Set Up a BYOAO Clipping Template

Web Clipper supports custom templates that auto-apply frontmatter. Create one for your BYOAO vault:

1. Open Web Clipper settings (click the extension icon → gear icon)
2. Create a new template with these settings:

| Setting | Value |
|---------|-------|
| **Template name** | BYOAO Article |
| **Note name** | `{{title}}` |
| **Note location** | `Clippings` (or any folder you prefer) |
| **Vault** | Your BYOAO vault |

3. In the template body, use:

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

Now when you clip a page, it lands in your vault with proper frontmatter — ready for `/cook` to process.

### Workflow: Clip → Cook → Knowledge

1. Browse the web normally. When you find something worth keeping, click the Web Clipper icon
2. Optionally highlight key passages before clipping (highlights are preserved)
3. The page saves to your vault as a Markdown file in `Clippings/`
4. On your next `/cook` cycle, the AI reads your clippings and extracts entities, concepts, and connections into the knowledge base
5. The original clipping stays as a source reference — agent pages link back to it

> **Tip:** Set up [auto-apply rules](https://obsidian.md/clipper) in Web Clipper to automatically use different templates for different sites (e.g., one for articles, one for research papers, one for recipes).

## What's Next?

- **[Core Concepts](core-concepts.md)** — understand how BYOAO works under the hood
- **[Workflows](workflows.md)** — common scenarios: first cook, weekly review, tracing ideas
- **[Skills Reference](skills-reference.md)** — all AI skills in detail

---

**Next:** [Core Concepts](core-concepts.md) →
