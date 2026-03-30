<p align="center">
  <pre align="center">
  ██████╗ ██╗   ██╗ ██████╗   ██╗    ██████╗
  ██╔══██╗╚██╗ ██╔╝██╔═══██╗ ████╗  ██╔═══██╗
  ██████╔╝ ╚████╔╝ ██║   ██║██╔══██╗██║   ██║
  ██╔══██╗  ╚██╔╝  ██║   ██║██║  ██║██║   ██║
  ██████╔╝   ██║   ╚██████╔╝██║  ██║╚██████╔╝
  ╚═════╝    ╚═╝    ╚═════╝ ╚═╝  ╚═╝ ╚═════╝
  </pre>
  <strong>Build Your Own AI OS</strong>
  <br/>
  <em>Turn Obsidian into an AI-powered personal knowledge graph</em>
  <br/><br/>
  <a href="https://www.npmjs.com/package/@jayjiang/byoao"><img src="https://img.shields.io/npm/v/@jayjiang/byoao?style=flat-square" alt="npm version"></a>
  <a href="https://github.com/JayJiangCT/BYOAO/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue?style=flat-square" alt="license"></a>
  <br/><br/>
  <a href="#quick-start">Quick Start</a> · <a href="#what-you-get">What You Get</a> · <a href="#the-weave-loop">The /weave Loop</a> · <a href="#tools--skills">Tools & Skills</a> · <a href="#vault-structure">Vault Structure</a>
</p>

---

## What is BYOAO?

BYOAO is an [OpenCode](https://opencode.ai) plugin that turns [Obsidian](https://obsidian.md) into an AI-powered personal knowledge OS. Write notes freely, then let AI connect the dots — building a knowledge graph from your scattered files.

**Local-first.** Your data stays on your machine. No cloud sync, no vendor lock-in.

**AI-native.** Every vault ships with `AGENT.md` — a routing index that lets AI agents navigate your knowledge graph without RAG infrastructure.

**Start minimal, grow organically.** `byoao init` creates just 3 directories and a few files. Structure emerges from your content via `/weave`, not from empty preset folders.

---

## Quick Start

### Prerequisites

- [Obsidian](https://obsidian.md/) desktop app
- [OpenCode](https://opencode.ai) (or any ACP-compatible AI agent)
- Node.js 18+

### 1. Install

```bash
npm install -g @jayjiang/byoao

# Register plugin + install Obsidian Skills
byoao install
```

<details>
<summary>Install from source</summary>

```bash
git clone https://github.com/JayJiangCT/BYOAO.git
cd BYOAO/byoao
npm install && npm run build && npm link
byoao install
```

</details>

### 2. Create Your Knowledge Base

```bash
# Interactive mode — guided setup
byoao init

# Or adopt an existing folder
byoao init --from ~/Documents/my-notes
```

`byoao init` creates a minimal personal KB:
- 3 directories: `Daily/`, `Knowledge/`, `Knowledge/templates/`
- `AGENT.md` (AI navigation index), `Glossary.md`, `Start Here.md`
- Note templates (Daily Note, Meeting Notes, Decision Record)
- Installs **Agent Client** plugin for AI chat inside Obsidian

Optionally add a work preset (`PM/TPM`) for Projects/, Sprints/, and work-specific templates.

### 3. Open in Obsidian

1. Open Obsidian → **Manage vaults** → **Open folder as vault**
2. Enable Obsidian CLI: **Settings** → **General** → **Advanced** → **Command-line interface**
3. Read **"Start Here.md"** for a quick orientation

### 4. Connect Your Notes

Open the Agent Client panel in Obsidian and run:

```
/weave
```

Watch: scattered files become a connected knowledge graph with frontmatter, wikilinks, and a growing Glossary.

---

## What You Get

| Component | Description |
|-----------|-------------|
| **Minimal KB structure** | Daily/, Knowledge/, templates — grows organically from your content |
| **AI routing** | `AGENT.md` with section markers lets AI agents navigate your vault |
| **Glossary** | Entity dictionary with Domain column — maintained by `/weave` |
| **Agent Client plugin** | Chat with AI directly inside Obsidian |
| **Obsidian Skills** | Full Obsidian CLI reference for AI agents (obsidian-cli, obsidian-markdown, etc.) |
| **Note templates** | Daily Note, Meeting Notes, Decision Record (+ work-specific with PM/TPM preset) |
| **Vault health tools** | `/diagnose` to catch broken links and missing metadata |

---

## The /weave Loop

`/weave` is the core value of BYOAO. It turns disconnected notes into an interconnected knowledge graph:

```
You write notes
  → /weave scans, discovers entities (people, projects, concepts)
  → Checks Glossary: term exists? → creates [[wikilink]]
                      term missing? → suggests adding to Glossary
  → Glossary grows
  → Next /weave run discovers more connections
  → Knowledge graph gets denser
```

What `/weave` does in a single run:
1. Reads Glossary to load known entities
2. Scans your files for people, projects, concepts, tools
3. Adds frontmatter (`domain`, `type`, `references`, `tags`)
4. Converts plain text mentions to `[[wikilinks]]`
5. Suggests new Glossary terms (entities appearing in 3+ files)
6. Creates hub notes for frequently mentioned topics
7. Backs up files before any modification

---

## Tools & Skills

### Skills (User-Facing)

| Skill | What It Does |
|-------|-------------|
| `/weave` | Connect notes into a knowledge graph — frontmatter, wikilinks, Glossary maintenance |
| `/trace` | Track how an idea evolved over time across your notes |
| `/emerge` | Surface hidden patterns and unnoticed connections |
| `/connect` | Bridge two seemingly unrelated topics using your link graph |
| `/diagnose` | Check knowledge graph health — missing frontmatter, orphan notes, broken links |
| `/explain` | Explain codebase systems in plain language, cached in your vault |

### OpenCode Tools (Agent-Facing)

| Tool | What It Does |
|------|-------------|
| `byoao_init_vault` | Create a vault with preset-driven structure |
| `byoao_add_person` | Add a person note + wire wikilinks |
| `byoao_add_project` | Add a project note + wire wikilinks |
| `byoao_add_glossary_term` | Append a term to the Glossary (with domain) |
| `byoao_vault_status` | Scan vault health: note count, wikilinks, broken links |
| `byoao_vault_doctor` | Full diagnostic: missing frontmatter, orphan notes, AGENT.md drift |
| `byoao_search_vault` | Text search across vault notes |
| `byoao_note_read` | Read a specific note by name |
| `byoao_graph_health` | Find orphans, unresolved links, dead ends |
| `byoao_vault_upgrade` | Upgrade vault infrastructure to latest version |

### Plugin Hooks

| Hook | Behavior |
|------|----------|
| `system.transform` | Injects `AGENT.md` + navigation strategy into every LLM conversation |
| `session.idle` | Suggests BYOAO commands via toast when idle |

---

## Vault Structure

### Minimal (default)

```
{KB Name}/
├── .obsidian/           # Obsidian config + plugins
├── Daily/               # Daily notes
├── Knowledge/
│   ├── templates/       # Note templates (Cmd+T)
│   └── Glossary.md      # Entity dictionary (maintained by /weave)
├── AGENT.md             # AI navigation index
└── Start Here.md        # Human onboarding guide
```

### With PM/TPM Preset

Adds on top of the minimal core:

```
├── Projects/            # One note per active project
├── Sprints/             # Sprint handoff documents
├── People/              # Person notes + team index
└── Knowledge/templates/ # +Feature Doc, Sprint Handoff
```

> **Key idea:** The knowledge graph (frontmatter + wikilinks) is the source of truth, not the folder structure. `/weave` builds structure from your content.

---

## Preset System

| Preset | Extra Directories | Extra Templates | Status |
|--------|------------------|----------------|--------|
| **minimal** (default) | None | None | Available |
| **PM / TPM** | Projects, Sprints | Feature Doc, Sprint Handoff | Available |

Presets are optional addons. Default init creates a minimal personal KB. Add a work preset when you need project tracking.

---

## CLI Reference

```bash
byoao install                    # Set up BYOAO plugin in OpenCode
byoao uninstall                  # Remove plugin (vaults untouched)
byoao init                       # Interactive vault creation
byoao init --from ~/notes        # Adopt an existing folder
byoao init --kb "My KB" --preset pm-tpm  # Flag-based creation
byoao status <path>              # Check vault health
byoao upgrade [path]             # Upgrade vault infrastructure
byoao check-obsidian             # Verify Obsidian installation
```

---

## Architecture

```
byoao/
├── src/
│   ├── index.ts              # Plugin entry — tools, hooks
│   ├── plugin-config.ts      # Zod schemas (VaultConfig, PresetConfig)
│   ├── cli/                  # CLI: install, init, status, upgrade
│   ├── tools/                # 11 OpenCode tools
│   ├── skills/               # 3 skills: weave, diagnose, explain
│   ├── hooks/                # system.transform + idle suggestions
│   ├── vault/                # Core: create, status, doctor, glossary, member, project
│   └── assets/
│       └── presets/
│           ├── common/       # Shared templates, AGENT.md.hbs, .obsidian config
│           ├── minimal/      # Minimal personal KB preset
│           └── pm-tpm/       # PM/TPM work preset
├── package.json
└── vitest.config.ts          # 141 tests across 17 files
```

---

## Roadmap

- [x] Personal KB with minimal preset (v0.6)
- [x] `/weave` skill — knowledge graph builder (v0.6)
- [x] Mode A/B init (fresh + existing folder adoption) (v0.6)
- [x] Obsidian Skills integration (v0.6)
- [x] `/trace` — Track how ideas evolve over time (v0.7)
- [x] `/emerge` — Surface hidden patterns (v0.7)
- [x] `/connect` — Bridge two domains (v0.7)
- [ ] `/ideas` — Generate actionable ideas across domains (v0.8)
- [ ] `/challenge` — Pressure-test beliefs using vault history (v0.8)
- [ ] `/drift` — Compare intentions vs actual behavior (v0.8)
- [ ] Engineer and Designer presets

---

## License

MIT
