# Using BYOAO with Claude Code

BYOAO is built as an OpenCode plugin, but the LLM Wiki vault is platform-agnostic — plain markdown, wikilinks, YAML frontmatter. You can use a BYOAO vault with Claude Code by setting up the `.claude/` directory.

## Prerequisites

- A BYOAO vault (created via `byoao init`)
- [Claude Code](https://code.claude.com) installed
- Obsidian with CLI enabled (Settings → General → Advanced → Command-line interface)

## Quick Setup

### 1. Create `.claude/CLAUDE.md`

Claude Code reads `CLAUDE.md`, not `AGENTS.md`. Create a file that imports your existing BYOAO agent guide:

```markdown
# BYOAO Knowledge Base

@../AGENTS.md
@../SCHEMA.md

## Claude Code Notes

- Use Obsidian CLI for all note operations (see rules/obsidian-cli.md)
- User notes are read-only — only agent directories are writable
- Run `/cook` to compile notes into knowledge pages
- Run `/health` to audit knowledge page quality
```

Place this at `.claude/CLAUDE.md` (preferred) or at the vault root as `CLAUDE.md`. The `@` import syntax pulls in `AGENTS.md` and `SCHEMA.md` without duplicating content.

### 2. Create Path-Specific Rules

Claude Code supports scoping rules to specific file paths via `.claude/rules/`. This enforces BYOAO's "user notes read-only, agent pages writable" model.

**`.claude/rules/obsidian-cli.md`** — Always loaded:

```markdown
# Obsidian CLI

Use Obsidian CLI for all note operations:
- `obsidian read file="..."` to read notes
- `obsidian search query="..."` to search
- `obsidian create file="..." content="..."` to create
- `obsidian list` to list notes

Do not use bash (cat, grep, find, sed) to manipulate note files directly.
Obsidian CLI correctly maintains wikilinks, frontmatter, and file relationships.
```

**`.claude/rules/user-notes-readonly.md`** — Only loaded when working with user notes:

```markdown
---
paths:
  - "**/*.md"
  - "!entities/**"
  - "!concepts/**"
  - "!comparisons/**"
  - "!queries/**"
  - "!SCHEMA.md"
  - "!log.md"
---

# User Notes Are Read-Only

These notes are raw material for knowledge compilation via /cook.
- Read them to extract entities, concepts, and relationships
- Do not modify, rename, or delete them
- Use Obsidian CLI for reading: `obsidian read file="..."`
```

**`.claude/rules/agent-pages.md`** — Only loaded when working with agent pages:

```markdown
---
paths:
  - "entities/**/*.md"
  - "concepts/**/*.md"
  - "comparisons/**/*.md"
  - "queries/**/*.md"
---

# Agent-Maintained Pages

These are compiled knowledge pages. You can create and update them.

## Rules
- Read SCHEMA.md for tag taxonomy and page conventions before creating pages
- Every page must have frontmatter: title, date, created, updated, type, tags, sources
- Every page must have at least 2 outbound wikilinks
- When updating, check for contradictions — never silently overwrite
- Append an entry to log.md after modifying pages
- Use Obsidian CLI for all operations
```

### 3. Copy Skills

BYOAO skills work with Claude Code. Copy them to `.claude/commands/`:

```bash
mkdir -p .claude/commands
cp .opencode/commands/*.md .claude/commands/
```

Or use symlinks:

```bash
mkdir -p .claude/commands
for f in .opencode/commands/*.md; do
  ln -s "../../$f" ".claude/commands/$(basename $f)"
done
```

Skills are invoked the same way: `/cook`, `/health`, `/trace`, etc.

### 4. Configure MCP Servers (Optional)

If you use the `pm-tpm` preset with Atlassian and BigQuery, configure them in `.claude/settings.json`:

```json
{
  "mcpServers": {
    "atlassian": {
      "type": "url",
      "url": "https://mcp.atlassian.com/v1/sse"
    },
    "bigquery": {
      "command": "npx",
      "args": ["-y", "@toolbox-sdk/server", "--prebuilt=bigquery", "--stdio"],
      "env": {
        "BIGQUERY_PROJECT": "your-project-id"
      }
    }
  }
}
```

Claude Code handles MCP authentication natively — no `byoao_mcp_auth` needed.

### 5. Obsidian Integration

Install the **Claudian** community plugin in Obsidian to embed Claude Code in the sidebar. Configure it to point to your vault root.

## Resulting Directory Structure

```
your-vault/
├── AGENTS.md                       # Shared agent guide (BYOAO-generated)
├── SCHEMA.md                       # Tag taxonomy
├── log.md                          # Agent activity log
├── entities/                       # Agent pages
├── concepts/
├── comparisons/
├── queries/
├── .claude/
│   ├── CLAUDE.md                   # Imports AGENTS.md + SCHEMA.md
│   ├── settings.json               # MCP servers (optional)
│   ├── settings.local.json         # Personal overrides (gitignored)
│   └── rules/
│       ├── obsidian-cli.md         # Obsidian CLI usage
│       ├── user-notes-readonly.md  # Read-only user notes
│       └── agent-pages.md          # Agent page conventions
├── .opencode/                      # OpenCode config (existing)
│   ├── skills/
│   └── commands/
└── .opencode.json
```

Both `.claude/` and `.opencode/` can coexist. Each platform reads its own configuration.

## Personal Preferences

For preferences that shouldn't be committed to version control, create `CLAUDE.local.md` at the vault root and add it to `.gitignore`. It loads alongside `CLAUDE.md` and is treated the same way.

For per-machine settings, use `.claude/settings.local.json`.

## Auto Memory

Claude Code's auto memory works automatically. Notes are stored at `~/.claude/projects/<project>/memory/` — separate from the vault. The first 200 lines of `MEMORY.md` load at session start. Use `/memory` to browse and edit.

## Key Differences from OpenCode

| Aspect | OpenCode | Claude Code |
|--------|----------|-------------|
| Agent guide | `AGENTS.md` (injected by hook) | `.claude/CLAUDE.md` (imports `@../AGENTS.md`) |
| Rules | Dynamic (hook-based) | Static (`.claude/rules/*.md` with path scoping) |
| Skills | `.opencode/commands/` | `.claude/commands/` |
| MCP config | Plugin handles it | `.claude/settings.json` |
| Auth recovery | `byoao_mcp_auth` tool | Native (not needed) |

## Troubleshooting

**Claude not following rules?**
- Run `/memory` to verify which files are loaded
- Check that `.claude/CLAUDE.md` exists and imports are correct
- Verify path patterns in rules match your file structure

**Skills not found?**
- Ensure skills are in `.claude/commands/` (not `.claude/skills/`)
- Check file permissions if using symlinks

**Obsidian CLI not available?**
- Open Obsidian first
- Enable CLI: Settings → General → Advanced → Command-line interface
- Verify: `obsidian --version`
