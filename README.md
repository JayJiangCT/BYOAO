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
  <em>Turn Obsidian into your team's AI-powered knowledge graph</em>
  <br/><br/>
  <a href="https://www.npmjs.com/package/@jayjiang/byoao"><img src="https://img.shields.io/npm/v/@jayjiang/byoao?style=flat-square" alt="npm version"></a>
  <a href="https://github.com/JayJiangCT/BYOAO/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue?style=flat-square" alt="license"></a>
  <br/><br/>
  <a href="#quick-start">Quick Start</a> · <a href="#tools">Tools</a> · <a href="#skills">Skills</a> · <a href="#vault-structure">Vault Structure</a>
</p>

---

## What is BYOAO?

BYOAO is an [OpenCode](https://opencode.ai) plugin that turns [Obsidian](https://obsidian.md) into an AI-driven knowledge OS. It generates and manages structured knowledge bases — vaults where every note is a graph node, connected by frontmatter metadata and `[[wikilinks]]`.

```
You → OpenCode TUI → BYOAO Plugin → Obsidian Vault (local knowledge graph)
                                   → Atlassian MCP (Jira / Confluence)
                                   → BigQuery MCP (data warehouse)
```

**Local-first.** Your data stays on your machine. No cloud sync, no vendor lock-in.

**Role-agnostic.** Choose a preset (PM/TPM, Engineer, Designer...) and get a vault tailored to your workflows.

**AI-native.** Every vault ships with `AGENT.md` — a routing index that lets AI agents navigate your knowledge graph without RAG infrastructure.

---

## Quick Start

### Prerequisites

- [Obsidian](https://obsidian.md/) desktop app
- [OpenCode](https://opencode.ai) (recommended) or any compatible AI agent harness
- Node.js 20+

### Install

```bash
npm install -g @jayjiang/byoao

# Interactive installer — registers plugin, copies skills
byoao install
```

<details>
<summary>Install from source</summary>

```bash
git clone https://github.com/JayJiangCT/BYOAO.git
cd BYOAO/byoao
npm install && npm run build
node dist/cli/cli-program.js install
```

</details>

### Create Your First Vault

```bash
# Interactive mode — guided TUI with role selection
byoao init

# Or flag mode for scripting
byoao init --team "My Team" --preset pm-tpm
```

Then register it in Obsidian:

1. Open Obsidian → **Manage vaults** → **Open folder as vault**
2. Read **"Start Here.md"** — it explains the vault structure
3. Start adding notes — meeting notes, project docs, daily notes
4. When ready for AI features, `cd` into your vault and run `opencode`

---

## Tools

| Tool | What It Does |
|------|-------------|
| `byoao_init_vault` | Create a vault with preset-driven directory structure, templates, glossary, and AI routing |
| `byoao_add_member` | Add a team member note + wire wikilinks in team index and AGENT.md |
| `byoao_add_project` | Add a project note + wire wikilinks |
| `byoao_add_glossary_term` | Append a term to the Glossary table |
| `byoao_vault_status` | Scan vault health: note count, wikilinks, broken links, Obsidian status |
| `byoao_vault_doctor` | Full diagnostic: missing frontmatter, orphan notes, AGENT.md drift, broken links |

## Skills

| Skill | What It Does |
|-------|-------------|
| `/init-knowledge-base` | 4-phase interactive vault setup: gather info → create vault → populate → onboard |
| `/system-explainer` | Explain codebases in plain language using 3-layer knowledge (baseline → code → cache) |
| `/enrich-document` | Auto-add frontmatter and wikilinks to unstructured notes |
| `/vault-doctor` | Diagnose vault health and suggest targeted fixes |

## Plugin Hooks

| Hook | Behavior |
|------|----------|
| `system.transform` | Injects `AGENT.md` into every LLM conversation for vault-aware responses |
| `session.idle` | Suggests BYOAO commands via toast after conversations end |

---

## Vault Structure

```
{Team} Workspace/
├── Inbox/                    # Quick captures, unprocessed notes
├── Projects/                 # One note per active project
├── Sprints/                  # Sprint handoff documents
├── Knowledge/                # Domain reference
│   ├── concepts/             # Deep-dive concept notes
│   └── templates/            # 6 note templates (Daily, Meeting, Decision, Investigation, Feature Doc, Sprint Handoff)
├── People/                   # Team roster + member notes
├── Systems/                  # AI-generated codebase explanations
├── Archive/                  # Completed / deprecated
├── Daily/                    # Daily notes
├── AGENT.md                  # AI routing index (projects, team, glossary)
├── CLAUDE.md                 # Same as AGENT.md (for Claude Code)
├── Start Here.md             # Human onboarding (5 operations + Quick Win)
└── Knowledge/Glossary.md     # Domain terminology
```

> **Key idea:** Folders are suggestions. The real structure lives in frontmatter (`type`, `status`, `team`, `tags`) and `[[wikilinks]]`. AI agents navigate by metadata, not by folder paths.

---

## Preset System

BYOAO uses a two-layer preset architecture: **common** (shared by all roles) + **role overlay** (role-specific directories, templates, and AGENT.md sections).

| Preset | Directories | Templates | Status |
|--------|------------|-----------|--------|
| **PM / TPM** | Projects, Sprints | Feature Doc, Sprint Handoff | Available |
| **Engineer** | — | — | Coming soon |
| **Designer** | — | — | Coming soon |

Presets are defined by a simple `preset.json` — adding a new role is as easy as creating a new directory under `src/assets/presets/`.

---

## Architecture

```
byoao/
├── src/
│   ├── index.ts              # Plugin entry — tools, hooks
│   ├── plugin-config.ts      # Zod schemas (VaultConfig, PresetConfig, VaultDoctor)
│   ├── cli/                  # CLI: install, init (interactive TUI), status
│   ├── tools/                # 6 OpenCode tools
│   ├── skills/               # 4 skill definitions (.md)
│   ├── hooks/                # system.transform + idle suggestions
│   ├── vault/                # Core library: create, status, doctor, preset, obsidian-cli
│   └── assets/
│       └── presets/
│           ├── common/       # Shared templates, AGENT.md skeleton, .obsidian config
│           └── pm-tpm/       # PM/TPM preset: preset.json, agent-section, templates
├── package.json
└── tsconfig.json
```

### Key Design Decisions

| Decision | Choice | Why |
|----------|--------|-----|
| Integration | OpenCode Plugin API | Native tool registration, no MCP overhead |
| Knowledge Retrieval | Agentic Retrieval | LLM-driven multi-round search, zero infrastructure (no RAG) |
| Obsidian Skills | [kepano/obsidian-skills](https://github.com/kepano/obsidian-skills) | 5 official SKILL.md files for CLI, Markdown, Bases, Canvas, Defuddle |
| Vault Structure | Frontmatter + Wikilinks | Graph-native — AI navigates by metadata, not folder paths |
| CLI | Interactive TUI + flag mode | Guided setup for humans, scriptable for CI |

---

## CLI Reference

```bash
byoao install                          # Set up BYOAO plugin in OpenCode
byoao install -y -g                    # Non-interactive, global install
byoao init                             # Interactive vault creation (TUI)
byoao init --team "X" --preset pm-tpm  # Flag-based creation
byoao status <path>                    # Check vault health
byoao check-obsidian                   # Verify Obsidian installation
```

---

## Roadmap

- [x] Publish to npm
- [ ] Engineer and Designer presets
- [ ] Atlassian MCP integration (Jira/Confluence)
- [ ] Obsidian CLI integration for post-init operations
- [ ] Team-sharable config (shared Skills + individual API keys)

---

## License

MIT
