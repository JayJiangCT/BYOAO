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

Check the health of a vault: note count, directories, wikilinks, broken links.

```bash
byoao status              # Check current directory
byoao status ~/my-kb      # Check specific path
```

| Argument | Description |
|----------|-------------|
| `[path]` | Vault path (default: current directory) |

---

## byoao upgrade

Upgrade vault infrastructure (skills, commands, templates, Obsidian config) to the latest BYOAO version.

```bash
byoao upgrade             # Upgrade vault in current directory
byoao upgrade ~/my-kb     # Upgrade specific vault
byoao upgrade --dry-run   # Preview changes without applying
```

| Flag | Description |
|------|-------------|
| `-y, --yes` | Skip confirmation |
| `--dry-run` | Show plan without executing |
| `--force` | Run even if versions match |
| `--preset <name>` | Override preset during bootstrap |

---

## byoao check-obsidian

Verify that Obsidian is installed and running.

```bash
byoao check-obsidian
```

Reports: installed (yes/no), running (yes/no), version, vaults directory.

---

**← Previous:** [Skills Reference](skills-reference.md) | **Next:** [Troubleshooting](troubleshooting.md) →
