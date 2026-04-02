[← Back to Index](index.md) | [中文](../zh/getting-started.md)

# Getting Started

Get from zero to a connected knowledge base in about 10 minutes.

## What You Need

- **[Obsidian](https://obsidian.md/)** — where you write and browse notes (desktop app)
- **[OpenCode](https://opencode.ai)** — an AI coding tool that runs BYOAO's skills. Think of it as the AI engine behind the scenes. BYOAO connects Obsidian (where you write) with OpenCode (where AI skills run)
- **Node.js 18+** — needed to install the package. Check with `node --version`

> **New to the terminal?** You only need it for installation. After setup, everything happens inside Obsidian's AI panel.

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

1. **Your name** — used in AGENT.md so AI knows whose knowledge base this is
2. **Knowledge base name** — defaults to "{Name}'s KB"
3. **Vault location** — defaults to `~/Documents/{KB name}`
4. **Work preset?** — choose "No" for a minimal personal KB, or "PM/TPM" if you need Projects/Sprints folders
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
├── Daily/               # Daily notes
├── Knowledge/
│   ├── templates/       # Note templates (Meeting, Daily, Decision)
│   └── Glossary.md      # Entity dictionary (maintained by /weave)
├── AGENT.md             # AI navigation index
└── Start Here.md        # Your onboarding guide
```

That's it — 3 directories, a few files. No empty folders cluttering your vault.

## Step 3: Open in Obsidian

1. Open Obsidian → **Manage vaults** → **Open folder as vault** → select your KB path
2. When prompted, click **"Trust author and enable plugins"**
3. Enable Obsidian CLI: **Settings** → **General** → **Advanced** → **Command-line interface**
4. Read **"Start Here.md"** for a quick orientation

> **Why enable CLI?** BYOAO's skills use the Obsidian CLI to search, read backlinks, and query the knowledge graph. Without it, skills like /weave can't function.

## Step 4: Run /weave

Open the **Agent Client** panel (icon in the right sidebar) and type:

```
/weave
```

This is where the magic happens. /weave scans your notes and:
- Adds frontmatter (`title`, `date`, `type`, `domain`, `tags`, `references`) — `date` is always populated
- Adds `source` field for notes originating from cloud documents
- Converts mentions of known terms to `[[wikilinks]]`
- Suggests new Glossary entries for recurring concepts
- Creates hub notes for frequently mentioned topics
- Backs up every file before modifying it
- Suggests running `/organize` if directory restructuring would help

After it runs, press `Cmd+G` to open Graph View and see your notes connected.

## What's Next?

- **[Core Concepts](core-concepts.md)** — understand how BYOAO works under the hood
- **[Workflows](workflows.md)** — common scenarios: weekly review, tracing ideas, discovering patterns
- **[Skills Reference](skills-reference.md)** — all 9 AI skills in detail

---

**Next:** [Core Concepts](core-concepts.md) →
