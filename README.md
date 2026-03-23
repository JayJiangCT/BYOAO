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
  <a href="#quick-start">Quick Start</a> · <a href="#what-you-get">What You Get</a> · <a href="#ai-inside-obsidian">AI Inside Obsidian</a> · <a href="#tools--skills">Tools & Skills</a> · <a href="#vault-structure">Vault Structure</a>
</p>

---

## What is BYOAO?

BYOAO is an [OpenCode](https://opencode.ai) plugin that turns [Obsidian](https://obsidian.md) into an AI-driven knowledge OS. One command creates a structured knowledge base — with templates, a glossary, AI routing, and community plugins — all pre-configured and ready to use.

**Local-first.** Your data stays on your machine. No cloud sync, no vendor lock-in.

**AI-native.** Every vault ships with `AGENT.md` — a routing index that lets AI agents navigate your knowledge graph without RAG infrastructure.

**Zero-config.** `byoao init` handles everything: vault structure, Obsidian templates, MCP servers, and even installs [Agent Client](https://github.com/RAIT-09/obsidian-agent-client) so you can chat with AI directly inside Obsidian.

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

### 2. Create Your Vault

```bash
# Interactive mode — guided setup with role selection
byoao init
```

<!-- TODO: Add screenshot of byoao init output with spinner + checkmarks -->
<!-- ![byoao init](docs/assets/byoao-init.png) -->

`byoao init` does all of this in one step:
- Creates the vault directory structure
- Copies 6 note templates (Meeting, Daily, Decision, Investigation, Feature Doc, Sprint Handoff)
- Generates `AGENT.md`, `Glossary.md`, `Start Here.md`
- Configures Atlassian MCP server
- Downloads and installs **BRAT** (plugin manager) + **Agent Client** (AI in Obsidian)
- Pre-configures OpenCode as the default AI agent

You can also use flags for scripting:

```bash
byoao init --team "My Team" --preset pm-tpm
```

### 3. Open in Obsidian

1. Open Obsidian → **Manage vaults** → **Open folder as vault**
2. When prompted, click **"Trust author and enable plugins"**

<!-- TODO: Add screenshot of trust dialog -->
<!-- ![Trust plugins](docs/assets/obsidian-trust.png) -->

3. Verify that **Agent Client** and **BRAT** are both enabled:

<!-- TODO: Add screenshot of community plugins page -->
<!-- ![Plugins enabled](docs/assets/obsidian-plugins-enabled.png) -->

4. Read **"Start Here.md"** — your vault orientation guide

---

## What You Get

After `byoao init`, your vault includes:

| Component | Description |
|-----------|-------------|
| **6 note templates** | Meeting Notes, Daily Note, Decision Record, Investigation, Feature Doc, Sprint Handoff |
| **Team knowledge graph** | People notes, project notes, glossary — all connected via `[[wikilinks]]` |
| **AI routing** | `AGENT.md` lets AI agents navigate your vault without RAG |
| **Agent Client plugin** | Chat with AI directly inside Obsidian, with `@[[note]]` references |
| **BRAT plugin manager** | Keeps Agent Client updated automatically |
| **MCP integration** | Atlassian (Jira/Confluence) pre-configured |
| **Vault health tools** | `byoao status` and `vault-doctor` to catch broken links and missing metadata |

---

## AI Inside Obsidian

BYOAO auto-installs the **Agent Client** plugin — so you can talk to AI agents without leaving Obsidian.

### Chat with Context

Click the Agent Client icon in the right sidebar to open a conversation panel. Use `@` to reference any note:

```
"Summarize the decisions from @[[2026-03-20 Weekly]]"
"Compare @[[Feature Doc A]] and @[[Feature Doc B]]"
"Who on the team is working on @[[API Migration]]?"
```

### Auto-Mention Mode

Toggle auto-mention (`Cmd+P` → "Agent Client: Toggle Auto-Mention") to automatically include the current note as context in every message.

### Multi-Agent Support

Switch between AI agents from the command palette:

| Agent | Description |
|-------|-------------|
| **OpenCode** | Default — full BYOAO tool integration |
| **Claude Code** | Anthropic's CLI agent |
| **Gemini CLI** | Google's CLI agent |

### Session History

Conversations are automatically saved as vault notes — every AI interaction becomes part of your knowledge base.

---

## Tools & Skills

### OpenCode Tools

Use these in any OpenCode session from within your vault:

| Tool | What It Does |
|------|-------------|
| `byoao_init_vault` | Create a vault with preset-driven structure, templates, and plugins |
| `byoao_add_member` | Add a team member note + wire wikilinks in team index and AGENT.md |
| `byoao_add_project` | Add a project note + wire wikilinks |
| `byoao_add_glossary_term` | Append a term to the Glossary table |
| `byoao_vault_status` | Scan vault health: note count, wikilinks, broken links |
| `byoao_vault_doctor` | Full diagnostic: missing frontmatter, orphan notes, AGENT.md drift |

### Skills

| Skill | What It Does |
|-------|-------------|
| `/init-knowledge-base` | 4-phase interactive vault setup |
| `/system-explainer` | Explain codebases in plain language |
| `/enrich-document` | Auto-add frontmatter and wikilinks to unstructured notes |
| `/vault-doctor` | Diagnose vault health and suggest fixes |

### Plugin Hooks

| Hook | Behavior |
|------|----------|
| `system.transform` | Injects `AGENT.md` into every LLM conversation for vault-aware responses |
| `session.idle` | Suggests BYOAO commands via toast when idle |

---

## Vault Structure

```
{Team} Workspace/
├── .obsidian/
│   └── plugins/
│       ├── obsidian42-brat/      # Plugin manager (auto-installed)
│       └── agent-client/         # AI chat plugin (auto-installed)
├── Inbox/                        # Quick captures, unprocessed notes
├── Projects/                     # One note per active project
├── Sprints/                      # Sprint handoff documents
├── Knowledge/
│   ├── concepts/                 # Deep-dive concept notes
│   ├── templates/                # 6 note templates (Cmd+T)
│   └── Glossary.md               # Domain terminology
├── People/                       # Team roster + member notes
├── Systems/                      # AI-generated codebase explanations
├── Archive/                      # Completed / deprecated
├── Daily/                        # Daily notes
├── AGENT.md                      # AI routing index
├── CLAUDE.md                     # AI routing (Claude Code compatible)
└── Start Here.md                 # Human onboarding guide
```

> **Key idea:** Folders are suggestions. The real structure lives in frontmatter (`type`, `status`, `tags`) and `[[wikilinks]]`. AI agents navigate by metadata, not folder paths.

---

## Preset System

BYOAO uses a two-layer preset architecture: **common** (shared by all roles) + **role overlay** (role-specific directories, templates, plugins, and MCP servers).

| Preset | Directories | Templates | Plugins | Status |
|--------|------------|-----------|---------|--------|
| **PM / TPM** | Projects, Sprints | Feature Doc, Sprint Handoff | Agent Client | Available |
| **Engineer** | — | — | — | Coming soon |
| **Designer** | — | — | — | Coming soon |

Presets are defined in `src/assets/presets/`. Each preset's `preset.json` declares:
- Extra directories and templates
- MCP servers to auto-configure
- Obsidian community plugins to auto-install

---

## CLI Reference

```bash
byoao install                          # Set up BYOAO plugin in OpenCode
byoao install -y -g                    # Non-interactive, global install
byoao uninstall                        # Remove plugin (vaults untouched)
byoao init                             # Interactive vault creation
byoao init --team "X" --preset pm-tpm  # Flag-based creation
byoao status <path>                    # Check vault health
byoao check-obsidian                   # Verify Obsidian installation
```

---

## Architecture

```
byoao/
├── src/
│   ├── index.ts              # Plugin entry — tools, hooks
│   ├── plugin-config.ts      # Zod schemas (VaultConfig, PresetConfig)
│   ├── cli/                  # CLI: install, init, status, check-obsidian
│   ├── tools/                # 6 OpenCode tools
│   ├── skills/               # 4 skill definitions
│   ├── hooks/                # system.transform + idle suggestions
│   ├── vault/                # Core: create, status, doctor, mcp, obsidian-plugins
│   └── assets/
│       └── presets/
│           ├── common/       # Shared templates, AGENT.md, .obsidian config
│           └── pm-tpm/       # PM/TPM preset
├── package.json
└── vitest.config.ts          # 78 tests across 10 files
```

### Key Design Decisions

| Decision | Choice | Why |
|----------|--------|-----|
| Integration | OpenCode Plugin API | Native tool registration, no MCP overhead |
| Knowledge Retrieval | Agentic Retrieval | LLM-driven search, zero infrastructure (no RAG) |
| Plugin Management | BRAT + direct download | Auto-install with update management |
| Vault Structure | Frontmatter + Wikilinks | Graph-native — AI navigates by metadata |
| CLI | Interactive TUI + flag mode | Guided setup for humans, scriptable for CI |

---

## Documentation

- **[Trial Guide](docs/trial-guide.md)** — 15-minute hands-on walkthrough (in Chinese)
- **[Usage Guide](docs/usage-guide.md)** — Comprehensive reference for users and developers
- **[MVP Test Guide](docs/mvp-test-guide.md)** — Systematic testing checklist

---

## Roadmap

- [x] PM/TPM preset with 6 templates
- [x] Atlassian MCP auto-configuration
- [x] Obsidian plugin auto-install (BRAT + Agent Client)
- [x] 78 tests across 10 files
- [ ] Engineer and Designer presets
- [ ] Model provider auto-configuration (Gemini OAuth, Copilot)
- [ ] Team-sharable config (shared Skills + individual API keys)

---

## License

MIT
