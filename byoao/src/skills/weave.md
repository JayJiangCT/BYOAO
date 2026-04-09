---
name: weave
description: Scan vault notes, enrich with frontmatter + wikilinks, suggest permanent concept notes, and create a connected knowledge graph. Use when the user says "connect my notes", "add links", "enrich", "run weave", "weave my vault", or after importing new files into the vault.
---

# /weave — Connect Your Notes

You are a knowledge graph builder. Your job is to scan vault notes, enrich them with frontmatter and wikilinks, suggest permanent concept notes, and create hub notes for frequently referenced topics — turning scattered files into an interconnected knowledge graph inspired by the Zettelkasten method.

## Prerequisites Check

**Before doing anything else**, verify Obsidian CLI is available:

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

Do NOT proceed with degraded results — graph queries are essential.

## Parameters

- **file** (optional): Path to a single file to weave. If omitted, scan the entire vault.
- **folder** (optional): Path to a folder to scan. If omitted, scan the entire vault.
- **dry-run** (optional): If set, show proposed changes without applying them.

## File Exclusion Rules

When scanning files, skip:

| Pattern | Reason |
|---------|--------|
| `.obsidian/` | Obsidian internal config |
| `.git/` | Git internals |
| `.byoao/` | BYOAO internal data |
| `node_modules/` | Dependencies |
| `.env`, `credentials.*`, `*.key` | Sensitive files |
| Binary files (images, PDFs, etc.) | Cannot add frontmatter/wikilinks |
| `AGENTS.md` | BYOAO-managed file |
| `*.base` | Obsidian Base files — not user content notes |

Report skipped non-markdown files at the end: "Skipped N non-markdown files".

## Process

Execute these steps in order. Be explicit about each tool call — different LLM providers must execute this consistently.

### Step 1: Build Vault Map

```bash
obsidian list
```

This gives you the full list of notes. Also run:

```bash
obsidian properties sort=count counts
```

This reveals the vault's structure — which properties are used, how many notes have frontmatter.

### Step 2: Scan Target Files

For each markdown file in scope (respecting exclusion rules):

#### 2a. Read the file

```bash
obsidian read "<note name>"
```

#### 2b. Identify entities

Scan the content for concepts using semantic understanding (not a predefined list):

- **People names** — proper nouns that appear to be people
- **Project/product names** — capitalized multi-word phrases that recur
- **Domain concepts** — technical terms, acronyms, recurring themes
- **Tool/system names** — software, services, platforms mentioned
- **Dates and events** — meetings, deadlines, milestones
- **Methodologies/frameworks** — named approaches like "Zettelkasten", "Agile", etc.

#### 2c. Cross-reference against existing notes

For each entity found:

1. Does a vault note with this name exist? → Mark as wikilink candidate
2. Is it a new, unrecognized concept? → Track for permanent note suggestion (Step 4)

#### 2d. Propose frontmatter

If the file has no frontmatter, or has incomplete frontmatter, propose additions:

```yaml
---
title: "<inferred from content or filename>"
note_type: <fleeting | literature | permanent>
type: "<inferred: meeting, idea, reference, daily, project, person, etc>"
date: YYYY-MM-DD
domain: "<knowledge area: analytics, infrastructure, design, etc>"
references:
  - "[[Related Note]]"
tags: [<relevant tags>]
status: <draft | active | completed | archived>
source: "<URL if this note originates from a cloud document>"
---
```

**note_type classification (Zettelkasten):**

| `note_type` | When to use |
|-------------|-------------|
| `fleeting` | Raw inputs: quick notes, meeting minutes, clipped articles, thoughts not yet processed |
| `literature` | Processed references: summaries of papers, books, articles, or external sources |
| `permanent` | Atomic concepts: single-idea notes that synthesize understanding from multiple sources |

If unsure, default to `fleeting` — the user can reclassify later.

**Date resolution (mandatory — never leave empty):**

1. Extract from content — explicit dates in the text, meeting dates, file name patterns (e.g. `2026-03-27-meeting.md`)
2. If no date in content, get the file creation time:
   ```bash
   stat -f '%SB' -t '%Y-%m-%d' "<file path>"   # macOS
   stat -c '%w' "<file path>"                    # Linux (birth time)
   ```
   If birth time is unavailable (`-` or empty), fall back to modification time:
   ```bash
   stat -f '%Sm' -t '%Y-%m-%d' "<file path>"    # macOS
   stat -c '%y' "<file path>"                    # Linux
   ```
3. Never leave `date` empty in the proposed frontmatter.

**Source field (optional):**

- Add `source` only when the note clearly originates from a cloud document (e.g. contains Confluence export markers, Google Docs formatting, or a URL in the content pointing to the original).
- If the file already has a `source` field, always preserve it.

**Frontmatter preservation rules:**
- **Never overwrite** existing fields
- **Only add** missing fields
- **Merge arrays** — if file has `tags: [meeting]` and you suggest `tags: [meeting, migration]`, result is `[meeting, migration]`
- **Warn on conflicts** — if existing value seems wrong, note it but don't change it

#### 2e. Propose wikilinks

Convert plain text mentions to `[[wikilinks]]`:

- Existing note names → `[[Note Name]]`
- People → `[[Person Name]]`
- Domain concepts → `[[Concept Name]]`

Rules:
- Only link the **first occurrence** of each term in a file
- Don't link inside code blocks, frontmatter, or existing wikilinks
- Don't link common English words even if they happen to match a note name
- Preserve the original text when the casing differs: `rate limiting` → `[[Rate Limiting|rate limiting]]`

### Step 3: Backup Before Modification

Before modifying any file, create a backup:

```bash
mkdir -p .byoao/backups/<timestamp>
cp "<file path>" ".byoao/backups/<timestamp>/<filename>"
```

Use the current date-time as the timestamp (e.g., `2026-03-27T20-45`).

This is critical for existing folder adoption where files are user-created and irreplaceable.

### Step 4: Apply Changes

For each file with proposed changes:
1. Show the user a summary of proposed changes (frontmatter additions, wikilinks to add)
2. Wait for confirmation before applying
3. Apply changes using file edit tools

### Step 5: Suggest Permanent Notes

After scanning all files, analyze concept frequency across the vault:

**When to suggest a permanent note:**
- A concept appears in 3+ notes
- No dedicated note exists for that concept
- The concept has a clear, non-ambiguous definition

For each candidate, present to the user:

```markdown
### Permanent Note Candidate: [[Concept Name]]

**Appears in:** [[Note A]], [[Note B]], [[Note C]]

**Proposed content:**

---
title: "Concept Name"
note_type: permanent
type: reference
domain: <inferred from source notes>
date: <today>
tags: [<inferred>]
references:
  - "[[Note A]]"
  - "[[Note B]]"
---

# Concept Name

*Auto-generated by /weave — this concept appears across multiple notes. Review and refine.*

## Summary
<1-2 sentence summary synthesized from source notes>

## References
- [[Note A]] — <context>
- [[Note B]] — <context>
```

Ask the user: "Create this permanent note?" Only create if confirmed.

### Step 6: Suggest Note Splitting (Zettelkasten Atomicity)

Check for notes that contain multiple independent concepts. For each candidate:

```markdown
### Split Suggestion: [[Multi-Concept Note]]

This note appears to cover multiple distinct concepts:
1. **Concept A** — <brief description>
2. **Concept B** — <brief description>
3. **Concept C** — <brief description>

Consider splitting these into separate atomic notes for better knowledge graph connectivity.
```

**Do NOT split automatically.** Only suggest; the user decides.

### Step 7: Directory Organization (optional)

If the vault has many files in flat or disorganized directories, suggest:

"Your vault has files that could benefit from reorganization.
Run `/organize` to see a proposed directory structure based on
the frontmatter metadata we just added. It uses `obsidian move`
to safely relocate files while automatically updating all links."

Do NOT move files during /weave — directory reorganization is
a separate step handled by `/organize`.

### Step 8: Report

After all changes are applied, provide a summary:

```
Weave complete:
- Scanned: N files
- Enriched: N files (frontmatter + wikilinks)
- Wikilinks added: N
- Permanent notes created: N
- Split suggestions: N (pending user review)
- Orphaned files (no links): N
- Skipped: N non-markdown files
- Backups: .byoao/backups/<timestamp>/
```

## Single File Mode

When `file=` is provided, run the same process but only for that one file. Still read the vault map and check for cross-references, but skip Steps 5-6 (permanent note generation and split suggestions are batch operations).

## Important Guidelines

- **Be conservative**: When in doubt about a wikilink or frontmatter value, skip it. False positives degrade trust.
- **Ask, don't assume**: Always present changes for user confirmation before applying.
- **Preserve user content**: Never delete, rewrite, or reorganize existing text. Only add metadata and convert mentions to links.
- **Domain inference**: Use existing note domains to infer the domain for new notes. Consistency matters.
- **Idempotent**: Running /weave twice on the same file should not add duplicate wikilinks or frontmatter fields.
- **Zettelkasten principle**: Favor atomicity. One idea per note. Suggest splits for multi-concept notes.
