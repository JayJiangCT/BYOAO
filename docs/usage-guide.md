# BYOAO Usage Guide

> **Build Your Own AI OS** — An Obsidian-based knowledge management system for AI-augmented teams.
>
> Version: 0.3.0 · Last updated: 2026-03-23

---

## Table of Contents

- [Overview](#overview)
- [Part 1: Getting Started](#part-1-getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Creating Your First Vault](#creating-your-first-vault)
  - [Opening in Obsidian](#opening-in-obsidian)
- [Part 2: Daily Usage](#part-2-daily-usage)
  - [Vault Structure](#vault-structure)
  - [Working with Notes](#working-with-notes)
  - [Using Templates](#using-templates)
  - [Managing Team Members](#managing-team-members)
  - [Managing Projects](#managing-projects)
  - [Managing Glossary Terms](#managing-glossary-terms)
  - [Vault Health Checks](#vault-health-checks)
  - [Vault Doctor (Diagnostics)](#vault-doctor-diagnostics)
- [Part 3: AI Integration](#part-3-ai-integration)
  - [AGENT.md — The AI Routing Index](#agentmd--the-ai-routing-index)
  - [OpenCode Plugin Tools](#opencode-plugin-tools)
  - [OpenCode Skills](#opencode-skills)
  - [MCP Server Auto-Configuration](#mcp-server-auto-configuration)
  - [Obsidian Plugin Auto-Install](#obsidian-plugin-auto-install)
  - [Using Agent Client](#using-agent-client)
  - [Hooks](#hooks)
- [Part 4: Architecture & Extension](#part-4-architecture--extension)
  - [Project Structure](#project-structure)
  - [The Preset System](#the-preset-system)
  - [Creating a New Preset](#creating-a-new-preset)
  - [Frontmatter Schema](#frontmatter-schema)
  - [Wikilink Strategy](#wikilink-strategy)
  - [Template Rendering](#template-rendering)
  - [Testing](#testing)
  - [Building & Development](#building--development)
- [CLI Reference](#cli-reference)
- [Tool Reference](#tool-reference)
- [Troubleshooting](#troubleshooting)

---

## Overview

BYOAO turns Obsidian into a team knowledge base that AI agents can navigate. Instead of scattering context across Slack, Jira, Confluence, and Google Docs, you maintain a single vault of interconnected notes — structured with frontmatter and wikilinks so both humans and AI can find what they need.

**Key principles:**

- **Local-first, privacy-respecting** — your vault lives on your machine
- **Documents as graph nodes** — structure comes from frontmatter + wikilinks, not folder hierarchy
- **Agentic retrieval** — AI navigates the vault via AGENT.md and wikilinks (no RAG pipeline)
- **Preset-driven** — role-specific templates and directory structures (PM/TPM, with more coming)

---

## Part 1: Getting Started

### Prerequisites

| Requirement | Details |
|-------------|---------|
| **Node.js** | v18+ |
| **Obsidian** | Desktop app installed ([download](https://obsidian.md)) |
| **OpenCode** | For AI integration (optional for vault creation) |

BYOAO checks for Obsidian before creating a vault. Run `byoao check-obsidian` to verify.

### Installation

Install the BYOAO CLI and register the OpenCode plugin:

```bash
# Install globally
npm install -g @jayjiang/byoao

# Register the plugin with OpenCode
byoao install
```

**Install options:**

| Flag | Description |
|------|-------------|
| `-g, --global` | Install globally (all projects) vs. project-only |
| `-y, --yes` | Skip interactive prompts, use defaults |
| `--no-skills` | Skip installing Obsidian Skills |
| `--project-dir <path>` | Specify project directory |

Without flags, `byoao install` runs an interactive prompt asking about install scope and skill installation.

**Uninstalling:**

```bash
byoao uninstall          # Remove from project config
byoao uninstall --global # Remove from global config
```

> Note: Uninstall removes the plugin registration only. It does **not** delete your vaults or notes.

### Creating Your First Vault

**Interactive mode** (recommended for first-time setup):

```bash
byoao init
```

This walks you through:

1. **Role selection** — PM/TPM (more roles coming)
2. **Team name** — e.g., "Platform Ops"
3. **Your name** — creates your personal People note
4. **Vault location** — defaults to `~/Documents/<TeamName> Workspace`

**Non-interactive mode:**

```bash
byoao init --team "Platform Ops" --preset pm-tpm --path ~/Vaults/platform
```

**What happens during init:**

1. Checks Obsidian is installed
2. Creates the directory structure
3. Copies `.obsidian/` config (core plugins, templates, daily notes)
4. Copies common and preset-specific templates
5. Generates `Glossary.md`, `AGENT.md`, `CLAUDE.md`, `Start Here.md`
6. Creates People and Project notes (if provided)
7. Creates the team index (`People/<TeamName> Team.md`)
8. Configures MCP servers from the preset (e.g., Atlassian for PM/TPM)
9. Auto-downloads and configures BRAT + Agent Client Obsidian plugins
10. Creates `.opencode.json` and `.opencode/skills/` + `.opencode/commands/` so BYOAO tools are available when OpenCode is launched from the vault

A loading spinner is shown during vault creation, and each completed step is marked with a ✓ indicator in the output.

### Opening in Obsidian

After vault creation:

1. Open Obsidian
2. Click **"Open another vault"** (or Manage Vaults → Open folder as vault)
3. Select the vault directory (e.g., `~/Documents/Platform Ops Workspace`)

Your vault is ready — start with `Start Here.md` for an orientation.

---

## Part 2: Daily Usage

### Vault Structure

```
<TeamName> Workspace/
├── .obsidian/                          # Obsidian config (auto-generated)
│   └── plugins/
│       ├── agent-client/               # Agent Client plugin (auto-installed)
│       └── obsidian42-brat/            # BRAT plugin manager (auto-installed)
├── .opencode.json                      # OpenCode project config (BYOAO tools available from vault)
├── .opencode/
│   ├── skills/                         # BYOAO skills for OpenCode
│   └── commands/                       # BYOAO commands for OpenCode
├── Inbox/                              # Drop zone for unprocessed notes
├── Knowledge/
│   ├── concepts/                       # Domain concept deep-dives
│   ├── templates/                      # Note templates (Cmd+T in Obsidian)
│   └── Glossary.md                     # Team terminology table
├── People/
│   ├── <Person>.md                     # One note per team member
│   └── <Team> Team.md                  # Team roster index
├── Projects/                           # (PM/TPM preset)
├── Sprints/                            # (PM/TPM preset)
├── Systems/                            # Codebase explanations (AI-generated)
├── Daily/                              # Daily notes
├── Archive/                            # Completed/deprecated notes
├── AGENT.md                            # AI routing index
├── CLAUDE.md                           # Copy of AGENT.md
└── Start Here.md                       # Onboarding guide
```

> **Folders are suggestions, not rigid structure.** What matters is frontmatter and wikilinks — Obsidian's graph and search work regardless of where a file sits.

### Working with Notes

Every note should have **frontmatter** with at least a `type` and `tags` field:

```yaml
---
type: reference
tags: [architecture, backend]
---
```

Connect notes with **wikilinks**: `[[Person Name]]`, `[[Project Name]]`, `[[Concept]]`.

The vault is a graph. The more links between notes, the easier it is for both humans (via graph view) and AI (via AGENT.md traversal) to navigate.

### Using Templates

In Obsidian, press **Cmd+T** (or Ctrl+T) to insert a template. Available templates:

**Common (all presets):**

| Template | Type | Use case |
|----------|------|----------|
| Meeting Notes | `meeting` | Agenda, notes, decisions, action items |
| Daily Note | `daily` | Daily log with morning/afternoon/evening sections |
| Investigation | `investigation` | Problem → timeline → root cause → resolution |
| Decision Record | `decision` | Context, decision, consequences, alternatives |

**PM/TPM preset:**

| Template | Type | Use case |
|----------|------|----------|
| Feature Doc | `feature` | Requirements, design, dependencies, success metrics |
| Sprint Handoff | `sprint` | Sprint cycle documentation |

### Managing Team Members

Add a new team member via the CLI tool (in OpenCode):

```
/byoao_add_member vaultPath="/path/to/vault" name="Alice Chen" role="Product Lead" team="Platform"
```

This:
- Creates `People/Alice Chen.md` with proper frontmatter
- Adds a row to `People/<Team> Team.md`
- Updates wikilinks in `AGENT.md` and `CLAUDE.md`

### Managing Projects

```
/byoao_add_project vaultPath="/path/to/vault" name="API Redesign" description="Modernize REST to GraphQL"
```

This:
- Creates `Projects/API Redesign.md` with frontmatter
- Updates the team index and AGENT.md

### Managing Glossary Terms

```
/byoao_add_glossary_term vaultPath="/path/to/vault" term="SLO" definition="Service Level Objective — a target reliability metric"
```

Appends the term to the Core Terms table in `Knowledge/Glossary.md`.

### Vault Health Checks

Quick overview of vault state:

```bash
byoao status ~/Documents/Platform\ Ops\ Workspace
```

Output includes:
- Total note count
- Wikilink count + broken links
- Notes per directory
- Config file status (`.obsidian/`, `AGENT.md`, `Glossary.md`)
- Obsidian running status

### Vault Doctor (Diagnostics)

Deep diagnostic scan (available as OpenCode tool):

```
/byoao_vault_doctor vaultPath="/path/to/vault"
```

Checks for:

| Category | Severity | What it finds |
|----------|----------|---------------|
| `frontmatter` | warning | Missing frontmatter or missing `type` field |
| `frontmatter` | info | Missing `tags` field |
| `agent-drift` | warning | AGENT.md links to non-existent notes |
| `orphan` | info | Notes with no incoming or outgoing wikilinks |
| `broken-link` | warning | Wikilinks pointing to missing notes |

Template files in `Knowledge/templates/` are excluded from checks.

---

## Part 3: AI Integration

### AGENT.md — The AI Routing Index

`AGENT.md` is the entry point for AI agents navigating your vault. It contains:

- Team roster with wikilinks to People notes
- Active projects with wikilinks
- Available templates
- Role-specific context (from the preset's `agent-section.hbs`)

When an AI agent needs to find information, it reads `AGENT.md` first, then follows wikilinks to relevant notes. This is **agentic retrieval** — no embedding database or RAG pipeline required.

`CLAUDE.md` is an identical copy, ensuring compatibility across different AI tools.

### OpenCode Plugin Tools

When BYOAO is installed as an OpenCode plugin, these tools become available in your AI sessions:

| Tool | Description |
|------|-------------|
| `byoao_init_vault` | Create a new vault (same as `byoao init`) |
| `byoao_add_member` | Add a team member note |
| `byoao_add_project` | Add a project note |
| `byoao_add_glossary_term` | Add a term to the glossary |
| `byoao_vault_status` | Check vault health metrics |
| `byoao_vault_doctor` | Run diagnostic scan |

### OpenCode Skills

Three AI skills are installed with BYOAO (from [kepano/obsidian-skills](https://github.com/kepano/obsidian-skills)):

| Skill | What it does |
|-------|-------------|
| `init-knowledge-base` | Bootstrap vault structures from scratch |
| `system-explainer` | Document a codebase system as a vault note |
| `enrich-document` | Add frontmatter + wikilinks to unstructured notes |

Use these in OpenCode by name (e.g., "use the system-explainer skill to document our auth module").

### MCP Server Auto-Configuration

Presets can declare MCP (Model Context Protocol) servers. During `byoao init`, these servers are automatically merged into your OpenCode config at `~/.config/opencode/opencode.json`.

The PM/TPM preset includes:

- **Atlassian MCP** — Jira and Confluence integration via `https://mcp.atlassian.com/v1/sse`

Merge behavior:
- Existing servers are **never overwritten** (idempotent)
- Only new servers are added
- Other config fields are preserved

### Obsidian Plugin Auto-Install

During `byoao init`, two Obsidian plugins are automatically downloaded and configured in the vault's `.obsidian/plugins/` directory:

| Plugin | ID | Purpose |
|--------|----|---------|
| BRAT | `obsidian42-brat` | Beta plugin manager — handles Agent Client version updates |
| Agent Client | `agent-client` | Chat interface inside Obsidian, pre-configured to launch OpenCode |

After init, you need to enable the plugins in Obsidian:

1. Open the vault in Obsidian
2. If prompted with "Restricted mode" — click **Turn off restricted mode** (trust this vault)
3. Go to Settings → Community plugins → confirm BRAT and Agent Client are toggled on

> If Obsidian was already open when you ran `byoao init`, restart Obsidian (or use `Cmd+P` → "Reload app without saving") to load the new plugins.

**Path resolution:** The Agent Client is pre-configured with the absolute path to the `opencode` binary (e.g., `/Users/jay/.opencode/bin/opencode`). This is necessary because GUI apps launched from Obsidian do not inherit your terminal's `PATH`.

### Using Agent Client

Agent Client is a chat panel embedded in Obsidian that talks to OpenCode (or other AI agents). BYOAO pre-configures it with OpenCode as the default agent.

**Opening the panel:**

Click the Agent Client icon in the right sidebar, or use `Cmd+P` → search "Agent Client".

**Referencing notes with `@`:**

Use `@` syntax to include vault notes as context in your conversation:

```
"Summarize the decisions from @[[2026-03-20 Weekly Sync]]"
"Compare the requirements in @[[Feature Doc A]] vs @[[Feature Doc B]]"
```

**Auto-Mention mode:**

Enable Auto-Mention to automatically attach the currently open note to every message — useful when you want to ask questions about the note you're reading:

`Cmd+P` → "Agent Client: Toggle Auto-Mention"

**Switching agents:**

`Cmd+P` → "Agent Client: Switch Agent" to switch between OpenCode, Claude Code, Gemini CLI, etc.

**BYOAO tools from Agent Client:**

When OpenCode is launched from the vault directory, all BYOAO tools (`byoao_add_member`, `byoao_add_project`, etc.) are available. The vault's `.opencode.json` ensures this happens automatically when Agent Client starts a session.

### Hooks

BYOAO registers two hooks with OpenCode:

**System Transform Hook** — Automatically injects `AGENT.md` (or `CLAUDE.md`) from the current working directory into the AI's system prompt. This gives the AI instant context about your team, projects, and vault structure.

**Idle Suggestion Hook** — Displays rotating tips during idle moments in OpenCode (e.g., "Tip: Run vault-doctor to check vault health").

---

## Part 4: Architecture & Extension

### Project Structure

```
byoao/
├── src/
│   ├── index.ts                 # Plugin entry point (tool + hook registration)
│   ├── plugin-config.ts         # Zod schemas (VaultConfig, PresetConfig)
│   ├── cli/
│   │   ├── cli-program.ts       # CLI commands (install, uninstall, init, status, check-obsidian)
│   │   ├── installer.ts         # Install/uninstall logic
│   │   └── ui.ts                # Terminal UI (logo, event markers, progress bar)
│   ├── tools/
│   │   ├── init-vault.ts        # byoao_init_vault tool
│   │   ├── add-member.ts        # byoao_add_member tool
│   │   ├── add-project.ts       # byoao_add_project tool
│   │   ├── add-glossary.ts      # byoao_add_glossary_term tool
│   │   ├── vault-status.ts      # byoao_vault_status tool
│   │   └── vault-doctor.ts      # byoao_vault_doctor tool
│   ├── vault/
│   │   ├── create.ts            # Vault creation orchestration
│   │   ├── preset.ts            # Preset loading + listing
│   │   ├── mcp.ts               # MCP server auto-configuration
│   │   ├── doctor.ts            # Diagnostic scanning
│   │   ├── status.ts            # Vault health metrics
│   │   ├── member.ts            # Add member operation
│   │   ├── project.ts           # Add project operation
│   │   ├── glossary.ts          # Add glossary term
│   │   ├── obsidian-check.ts    # Obsidian detection (macOS/Linux/Windows)
│   │   └── template.ts          # Handlebars rendering + date helpers
│   ├── hooks/
│   │   ├── system-transform.ts  # AGENT.md injection hook
│   │   └── idle-suggestions.ts  # Idle toast hook
│   ├── skills/                  # Obsidian Skills (cloned from kepano/obsidian-skills)
│   ├── assets/
│   │   ├── presets/
│   │   │   ├── common/          # Shared templates, obsidian config, AGENT.md.hbs
│   │   │   └── pm-tpm/          # PM/TPM preset (preset.json, templates, agent-section.hbs)
│   │   └── obsidian-skills/     # Installed skill files
│   └── __tests__/               # Plugin config tests
│       └── vault/__tests__/     # Vault operation tests
├── vitest.config.ts
├── tsconfig.json
└── package.json
```

### The Preset System

Presets define role-specific vault configurations. Each preset lives in `src/assets/presets/<name>/` and contains:

| File | Purpose |
|------|---------|
| `preset.json` | Metadata, directories, frontmatter extras, MCP servers, template list |
| `agent-section.hbs` | Handlebars partial injected into AGENT.md |
| `templates/*.md` | Role-specific note templates |

**preset.json schema:**

```json
{
  "name": "pm-tpm",
  "displayName": "PM / TPM",
  "description": "For product and program managers",
  "directories": ["Projects", "Sprints"],
  "agentDescription": "PM/TPM knowledge base",
  "frontmatterExtras": {
    "project": ["jira", "stakeholders", "priority"],
    "sprint": ["sprint-dates", "jira-board"]
  },
  "templates": ["Feature Doc.md", "Sprint Handoff.md"],
  "mcpServers": {
    "atlassian": {
      "type": "remote",
      "url": "https://mcp.atlassian.com/v1/sse"
    }
  }
}
```

Validated at runtime by `PresetConfigSchema` (Zod).

### Creating a New Preset

1. Create a directory: `src/assets/presets/<preset-name>/`
2. Add `preset.json` with the schema above
3. Add `agent-section.hbs` — Handlebars template for the AGENT.md role section
4. Add templates in a `templates/` subdirectory
5. The preset is automatically discoverable via `listPresets()`

**Available template variables** (Handlebars context):

- `{{teamName}}` — Team name
- `{{today}}` — Current date (YYYY-MM-DD)
- `{{#each members}}` — Array of `{name, role}`
- `{{#each projects}}` — Array of `{name, description}`
- `{{#each glossaryEntries}}` — Array of `{term, definition}`
- `{{#if jiraHost}}` / `{{jiraProject}}` — Jira config

### Frontmatter Schema

All generated notes follow consistent frontmatter patterns:

| Note type | Required fields | Optional fields |
|-----------|----------------|-----------------|
| Person | `type: person`, `tags: [person]`, `status: active` | `team`, `role` |
| Project | `type: feature`, `tags: [project]`, `status: active`, `date` | `jira`, `stakeholders`, `priority`, `team` |
| Meeting | `type: meeting`, `tags: [meeting]`, `status: active` | `participants`, `meeting-type` |
| Daily | `type: daily`, `tags: [daily]`, `date` | — |
| Decision | `type: decision`, `tags: [decision]`, `date` | `decision` (summary) |
| Investigation | `type: investigation`, `tags: [investigation]`, `date` | — |
| Reference | `type: reference` | `tags` |
| Team index | `type: reference`, `tags: [team]` | `team` |

### Wikilink Strategy

BYOAO maintains **zero broken wikilinks** in generated vaults:

- Links are only created when the target note exists
- `add_member` and `add_project` update wikilinks in 3 places: the note itself, the team index, and AGENT.md/CLAUDE.md
- Vault Doctor detects broken links and AGENT.md drift post-creation
- Aliased links (`[[Target|display text]]`) are supported and tracked

### Template Rendering

BYOAO uses [Handlebars](https://handlebarsjs.com/) for template rendering with `noEscape` mode (no HTML escaping — important for markdown content).

Key function: `renderTemplate(template, context)` in `src/vault/template.ts`

Helper: `today()` — returns current date as `YYYY-MM-DD`

### Testing

78 tests across 9 files using [Vitest](https://vitest.dev/):

```bash
cd byoao
npm test
```

| Test file | Coverage |
|-----------|----------|
| `plugin-config.test.ts` | Zod schema validation |
| `vault/create.test.ts` | Full vault creation flow |
| `vault/doctor.test.ts` | All diagnostic categories |
| `vault/glossary.test.ts` | Glossary term operations |
| `vault/mcp.test.ts` | MCP config merge + idempotency |
| `vault/member.test.ts` | Member creation + wikilink updates |
| `vault/status.test.ts` | Status metrics + formatting |
| `vault/template.test.ts` | Handlebars rendering |
| `hooks/idle-suggestions.test.ts` | Idle tip rotation |

All tests use temporary directories (`os.tmpdir()`) and clean up after themselves.

### Building & Development

```bash
cd byoao

npm run build        # TypeScript → dist/
npm run dev          # Run CLI via tsx (no build step)
npm run test         # Run test suite
npm run typecheck    # Type check without emitting
```

**Key dependencies:**

| Package | Purpose |
|---------|---------|
| `@opencode-ai/plugin` | OpenCode plugin SDK |
| `commander` | CLI framework |
| `fs-extra` | File operations |
| `gray-matter` | Frontmatter parsing |
| `handlebars` | Template rendering |
| `inquirer` | Interactive prompts |
| `zod` | Schema validation |
| `chalk` | Terminal colors |

---

## CLI Reference

| Command | Description |
|---------|-------------|
| `byoao install` | Register plugin with OpenCode |
| `byoao uninstall` | Remove plugin registration |
| `byoao init` | Create a new vault |
| `byoao status [path]` | Check vault health |
| `byoao check-obsidian` | Verify Obsidian installation |

Run `byoao <command> --help` for detailed flag information.

## Tool Reference

| Tool | Args | Description |
|------|------|-------------|
| `byoao_init_vault` | `teamName`, `vaultPath?`, `members?`, `projects?`, `glossaryEntries?`, `jiraHost?`, `jiraProject?`, `preset?` | Create a vault |
| `byoao_add_member` | `vaultPath`, `name`, `role?`, `team?` | Add team member |
| `byoao_add_project` | `vaultPath`, `name`, `description?`, `team?` | Add project |
| `byoao_add_glossary_term` | `vaultPath`, `term`, `definition` | Add glossary term |
| `byoao_vault_status` | `vaultPath` | Health metrics |
| `byoao_vault_doctor` | `vaultPath` | Diagnostic scan |

---

## Troubleshooting

**"Obsidian not found"** during `byoao init`
→ Install Obsidian from [obsidian.md](https://obsidian.md) and run `byoao check-obsidian` to verify.

**Vault not showing in Obsidian**
→ In Obsidian: Manage Vaults → Open folder as vault → select the workspace directory.

**Broken wikilinks after manual edits**
→ Run `byoao status <path>` to list broken links, or use `/byoao_vault_doctor` for detailed diagnostics.

**MCP servers not configured**
→ Check `~/.config/opencode/opencode.json`. If the server already existed, it was intentionally skipped (idempotent behavior).

**"Already exists" when adding a member**
→ A note for that person already exists in `People/`. Edit it directly in Obsidian instead.

**Agent Client: "Command Not Found" error**
→ The `opencode` binary path configured in Agent Client is an absolute path resolved at init time. If you moved or reinstalled OpenCode, re-run `byoao init` to refresh the path. GUI apps launched from Obsidian do not inherit your terminal's `PATH`, so a full path is required.

**Agent Client: "Session Creation Failed"**
→ Confirm OpenCode is installed and functional by running `which opencode` in a terminal. If OpenCode is not installed, Agent Client cannot start a session.

**BYOAO tools missing from OpenCode (only /init, /review, /compact visible)**
→ The vault was likely created before `.opencode.json` support was added. Re-run `byoao init` on a fresh vault directory, or manually create `.opencode.json` in the vault directory following the same format as your global OpenCode config. When OpenCode is launched from the vault directory, it picks up the project-level `.opencode.json` which includes the BYOAO plugin.

---

*This guide is maintained alongside the BYOAO codebase. It is updated with each release.*
