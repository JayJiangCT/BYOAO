---
name: organize
description: Reorganize vault directory structure using Obsidian CLI's move command, which safely updates all backlinks. Analyzes enriched frontmatter (type, domain) to propose a logical folder layout. Use when the user says "organize my vault", "reorganize files", "clean up folders", "restructure", or after running /weave on a messy vault.
---

# /organize — Vault Directory Reorganization

You are a vault organizer. Your job is to analyze the current directory structure, propose a logical reorganization based on enriched frontmatter metadata, and execute moves safely using Obsidian CLI — which automatically updates all backlinks and wikilinks.

## Prerequisites Check

**Before doing anything else:**

1. Verify Obsidian CLI is available:

```bash
obsidian --version
```

If this fails, STOP and display:

```
Obsidian CLI is not available. Please ensure:
1. Obsidian is running
2. This vault is open in Obsidian
3. CLI is enabled: Settings → General → Advanced → Command-line interface
```

2. Check that files have frontmatter (specifically `type`). Run:

```bash
obsidian properties sort=count counts
```

If `type` property has very low coverage (< 30% of notes), STOP and suggest:

```
Most files lack a `type` property — /organize needs frontmatter to
decide where files belong. Run /weave first to enrich your notes,
then come back to /organize.
```

## Parameters

- **scope** (optional): `all` (default) or a specific directory path to reorganize
- **dry-run** (optional): If set, show proposed changes without executing
- **aggressive** (optional): Also suggest consolidating existing directory structures (e.g., merge year-based sprint folders into `Sprints/`)

## File Exclusion Rules

Never move or suggest moving:

| Pattern | Reason |
|---------|--------|
| `AGENT.md` | BYOAO-managed root file |
| `Start Here.md` | BYOAO onboarding file |
| `Knowledge/Glossary.md` | BYOAO Glossary |
| `Knowledge/templates/*` | Template files |
| `.obsidian/`, `.git/`, `.byoao/` | System directories |
| `.opencode/`, `.cursor/`, `.claude/` | Tool config directories |
| `.env`, `credentials.*`, `*.key` | Sensitive files |

## Process

### Step 1: Analyze Current Structure

Build a complete picture of the vault:

```bash
obsidian list
```

Then read frontmatter for every file to build a map of `path → {type, domain, project, tags}`. Use batch reading:

```bash
obsidian read "<note name>"
```

Categorize every file into one of:
- **Has type** — can be auto-organized based on the mapping table
- **No type but in coherent directory** — already organized, leave in place
- **No type and in root/flat dir** — suggest running `/weave` first

### Step 2: Build Reorganization Map

For each file with a `type` property, determine if it should move based on this mapping:

| `type` | Target Directory | Notes |
|--------|-----------------|-------|
| `daily` | `Daily/` | |
| `meeting` | Project folder if `project` field exists, else `Meetings/` | Group by project when possible |
| `feature` | `Projects/<project>/` | Use `project` frontmatter field |
| `project` | `Projects/` | Top-level project notes |
| `sprint-handoff` | `Sprints/` | |
| `reference` | `Knowledge/` | General reference material |
| `person` | `People/` | |
| `investigation` | Project folder if `project` field exists, else `Knowledge/` | |
| `idea` | `Knowledge/` | |
| `decision` | Project folder if `project` field exists, else `Knowledge/` | |

**Smart rules — when NOT to move:**

1. **Already in the right place** — if a `type: meeting` file is already in `Meetings/` or inside a project folder, skip it
2. **Part of a coherent group** — if a file sits in `2025 Sprint/Sprint22/JIRA ticket/` alongside related files, the entire group is already organized even if the parent folder name doesn't match BYOAO conventions. Do NOT break up coherent groups
3. **Deep nesting** — if a file is 3+ levels deep in a project-specific directory, it's likely intentionally placed. Leave it unless the user explicitly asks to flatten
4. **Name collisions** — if moving a file would create a name collision in the target directory, flag it and skip

**When `aggressive` mode is enabled**, also suggest structural consolidation:
- Multiple year/sprint directories (e.g., `2025 Sprint/`, `2026 Sprint/`) → merge under `Sprints/2025/`, `Sprints/2026/`
- Scattered documentation directories → consolidate under `Knowledge/`
- This is a larger operation — always present as a separate approval step

### Step 3: Present Plan

Group proposed moves by category and show a clear summary:

```
/organize analysis complete.

## Files to move (23 of 504)

### Root files → proper directories
  HANDOVER-2026-03-04.md → Knowledge/Handovers/HANDOVER-2026-03-04.md
  HANDOVER-2026-03-02.md → Knowledge/Handovers/HANDOVER-2026-03-02.md
  BigQuery_Syntax_Guide.md → Knowledge/BigQuery_Syntax_Guide.md

### Meeting notes → Meetings/
  standup-2026-03-15.md → Meetings/standup-2026-03-15.md

### Reference docs → Knowledge/
  API_Overview.md → Knowledge/API_Overview.md

## New directories to create
  Knowledge/Handovers/
  Meetings/

## Files staying in place: 481
  (Already in coherent directory structures)

## Files without `type` (cannot auto-organize): 12
  Run /weave on these first, then re-run /organize.

Options:
  1. Approve all moves
  2. Review one-by-one
  3. Skip — make no changes
```

Wait for user response before proceeding.

### Step 4: Execute Moves

For each approved move, use `obsidian move`:

```bash
obsidian move file="HANDOVER-2026-03-04" to="Knowledge/Handovers/"
```

**Execution rules:**

- Create target directories first if they don't exist:
  ```bash
  mkdir -p "<vault path>/<target directory>"
  ```
- Execute moves one at a time and verify each succeeds
- If a move fails (name collision, file locked, etc.), log the error and continue with remaining moves
- Report progress every 10 moves: "Moved 10/23 files..."

**Why `obsidian move` instead of `mv`:**

`obsidian move` tells Obsidian to perform the move internally. Obsidian automatically updates **all wikilinks and backlinks** across the entire vault that reference the moved file. Using file system `mv` would leave broken links.

### Step 5: Verify

After all moves complete:

1. Get the updated file list:
   ```bash
   obsidian list
   ```

2. Check for broken links:
   ```bash
   byoao_graph_health
   ```

3. Report results:

```
/organize complete:
  - Moved: 23 files
  - Skipped: 0 (errors)
  - New directories created: 2
  - Broken links after moves: 0
  - Files still without `type`: 12 (run /weave to fix)
```

If any broken links are found, report them and suggest fixes.

## Important Guidelines

- **Conservative by default**: Only suggest moves where the benefit is clear. A file that's "good enough" where it is should stay
- **Never break coherent groups**: If files are organized together in a project directory, don't scatter them even if their `type` would suggest different target directories
- **User approval is mandatory**: Never move files without explicit confirmation
- **`obsidian move` only**: Never use file system `mv`, `cp`, or rename commands for vault files — only `obsidian move` and `obsidian rename` preserve link integrity
- **Idempotent**: Running /organize twice should not propose moves for files that were already correctly placed in the first run
- **Reversible**: If the user wants to undo, they can run `/organize` again with manual adjustments, or restore from git history
