[← Back to Index](index.md) | [中文](../zh/cli-reference.md)

# CLI Reference

All BYOAO command-line commands.

---

## byoao install

Register the BYOAO plugin in OpenCode and install Obsidian Skills.

```bash
byoao install              # Interactive — asks location + skills
byoao install -y -g        # Non-interactive, global install
byoao install --no-skills  # Skip Obsidian Skills
```

| Flag | Description |
|------|-------------|
| `-g, --global` | Install globally (all projects) |
| `-y, --yes` | Skip interactive prompts |
| `--no-skills` | Skip installing Obsidian Skills |
| `--project-dir <path>` | Project directory (default: cwd) |

---

## byoao uninstall

Remove the BYOAO plugin from OpenCode. Vaults and notes are not affected.

```bash
byoao uninstall
byoao uninstall -g -y    # Non-interactive, global
```

| Flag | Description |
|------|-------------|
| `-g, --global` | Uninstall from global config |
| `-y, --yes` | Skip confirmation |
| `--project-dir <path>` | Project directory (default: cwd) |

---

## byoao init

Create a new knowledge base or adopt an existing folder.

```bash
# Interactive (recommended)
byoao init

# Adopt existing folder
byoao init --from ~/Documents/my-notes

# Non-interactive with flags
byoao init --kb "My KB" --name "Jay" --preset pm-tpm
```

| Flag | Description |
|------|-------------|
| `--kb <name>` | Knowledge base name (required in non-interactive mode) |
| `--name <name>` | Your name (default: OS username) |
| `--path <path>` | Vault location (default: ~/Documents/{kb name}) |
| `--from <path>` | Adopt an existing folder as a knowledge base |
| `--preset <name>` | Preset: `minimal` (default) or `pm-tpm` |
| `--provider <name>` | AI provider: `copilot`, `gemini`, or `skip` |
| `--gcp-project <id>` | GCP Project ID (required with `--provider=gemini`) |

**Mode detection:**
- Empty or non-existent path → **Mode A** (fresh KB)
- Path with `.md` files → **Mode B** (adopt existing, confirms with user)
- Path with `.obsidian/` → **Mode B** with `.obsidian/` preservation

---

## byoao status

Check the health of a vault: agent page count by type, broken links, INDEX.base completeness.

```bash
byoao status              # Check current directory
byoao status ~/my-kb      # Check specific path
```

| Argument | Description |
|----------|-------------|
| `[path]` | Vault path (default: current directory) |

---

## byoao upgrade

Upgrade the BYOAO CLI and vault infrastructure (OpenCode skills, Obsidian plugin config, etc.) to the latest version. Root `AGENTS.md` / `SCHEMA.md` are not overwritten; use **`byoao sync-docs`** to merge missing template sections into existing vaults.

The command runs in two phases: first it checks for a newer CLI version on npm and offers to update it, then it upgrades the vault content. If the CLI is updated, the process exits and you run `byoao upgrade` again to complete the vault upgrade.

```bash
byoao upgrade             # Upgrade CLI + vault in current directory
byoao upgrade ~/my-kb     # Upgrade CLI + specific vault
byoao upgrade --dry-run   # Preview changes without applying
byoao upgrade --skip-cli  # Only upgrade vault, skip CLI update
```

| Flag | Description |
|------|-------------|
| `-y, --yes` | Skip confirmation prompts |
| `--dry-run` | Show plan without executing |
| `--force` | Run even if versions match |
| `--skip-cli` | Skip CLI self-update, only upgrade vault |
| `--preset <name>` | Override preset during bootstrap |

---

## byoao sync-docs

Insert packaged sections into vault-root **`AGENTS.md`** and **`SCHEMA.md`** when they are missing (for example **Knowledge Retrieval (Q&A)** and **Retrieval**). Safe merge: does not replace whole files or delete your edits. Run from the vault root (or pass the vault path).

```bash
byoao sync-docs              # Current directory vault
byoao sync-docs ~/my-kb      # Specific vault
byoao sync-docs --dry-run    # Show what would change; no writes
```

| Flag | Description |
|------|-------------|
| `--dry-run` | Preview only; do not modify files |

**Note:** `AGENTS.md` must contain a `## Available Skills` heading so the tool knows where to insert the retrieval block. If you removed or renamed it, merge manually from the package templates.

---

## byoao check-obsidian

Verify that Obsidian is installed and running.

```bash
byoao check-obsidian
```

Reports: installed (yes/no), running (yes/no), version, vaults directory.

---

## byoao logs

View and manage BYOAO error logs. Errors from tools, hooks, and CLI commands are automatically recorded to `~/.byoao/logs/error.log`.

```bash
byoao logs                # Show recent 20 entries
byoao logs --tail 50      # Show recent 50 entries
byoao logs --json         # Output raw JSON (for scripting)
byoao logs --export ~/Desktop/byoao-logs.txt   # Export to file
byoao logs --clear        # Clear all logs
```

| Flag | Description |
|------|-------------|
| `--tail <n>` | Number of recent entries to show (default: 20) |
| `--export <path>` | Export logs to a file (includes system info header) |
| `--clear` | Clear all log files |
| `--json` | Output entries as raw JSON lines |

**Export format:** The exported file includes a header with BYOAO version, Node version, and OS info — useful when sharing logs for debugging.

---

**← Previous:** [Skills Reference](skills-reference.md) | **Next:** [Troubleshooting](troubleshooting.md) →
