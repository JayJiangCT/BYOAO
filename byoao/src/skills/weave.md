---
name: weave
description: Scan vault notes, enrich with frontmatter + wikilinks, maintain the Glossary, create hub notes — building a connected knowledge graph. Use when the user says "connect my notes", "add links", "enrich", "organize my vault", "run weave", or after importing new files into the vault.
---

# /weave — Connect Your Notes

You are a knowledge graph builder. Your job is to scan vault notes, enrich them with frontmatter and wikilinks, maintain the Glossary as an entity dictionary, and create hub notes for frequently referenced topics — turning scattered files into an interconnected knowledge graph.

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
| `AGENT.md` | BYOAO-managed file |
| `Knowledge/templates/` | Template files — not user content |

Also respect `.byoaoignore` if present (same format as `.gitignore`).

Report skipped non-markdown files at the end: "Skipped N non-markdown files".

## Process

Execute these steps in order. Be explicit about each tool call — different LLM providers must execute this consistently.

### Step 1: Load Glossary

```bash
obsidian read "Knowledge/Glossary.md"
```

Parse the Glossary table. Extract all existing terms — these are automatic wikilink candidates for every file you scan.

### Step 2: Build Vault Map

```bash
obsidian list
```

This gives you the full list of notes. Also run:

```bash
obsidian properties sort=count counts
```

This reveals the vault's structure — which properties are used, how many notes have frontmatter.

### Step 3: Scan Target Files

For each markdown file in scope (respecting exclusion rules):

#### 3a. Read the file

```bash
obsidian read "<note name>"
```

#### 3b. Identify entities

Scan the content for:
- **People names** — proper nouns that appear to be people
- **Project/product names** — capitalized multi-word phrases that recur
- **Domain concepts** — technical terms, acronyms, recurring themes
- **Tool/system names** — software, services, platforms mentioned
- **Dates and events** — meetings, deadlines, milestones

#### 3c. Cross-reference against Glossary + existing notes

For each entity found:
1. Is it already a Glossary term? → Mark as wikilink candidate
2. Does a vault note with this name exist? → Mark as wikilink candidate
3. Is it a new, unrecognized entity? → Track for Glossary suggestion (Step 5)

#### 3d. Propose frontmatter

If the file has no frontmatter, or has incomplete frontmatter, propose additions:

```yaml
---
title: "<inferred from content or filename>"
type: "<inferred: meeting, idea, reference, daily, project, person, etc>"
date: <if identifiable from content>
domain: "<knowledge area: analytics, infrastructure, design, etc>"
references:
  - "[[Related Note]]"
  - "[[Glossary]]"
tags: [<relevant tags>]
status: <draft | active | completed | archived>
---
```

**Frontmatter preservation rules:**
- **Never overwrite** existing fields
- **Only add** missing fields
- **Merge arrays** — if file has `tags: [meeting]` and you suggest `tags: [meeting, migration]`, result is `[meeting, migration]`
- **Warn on conflicts** — if existing value seems wrong, note it but don't change it

#### 3e. Propose wikilinks

Convert plain text mentions to `[[wikilinks]]`:
- Glossary terms → `[[Term]]`
- Existing note names → `[[Note Name]]`
- People → `[[Person Name]]`

Rules:
- Only link the **first occurrence** of each term in a file
- Don't link inside code blocks, frontmatter, or existing wikilinks
- Don't link common English words even if they happen to match a note name
- Preserve the original text when the casing differs: `rate limiting` → `[[Rate Limiting|rate limiting]]`

### Step 4: Backup Before Modification

Before modifying any file, create a backup:

```bash
mkdir -p .byoao/backups/<timestamp>
cp "<file path>" ".byoao/backups/<timestamp>/<filename>"
```

Use the current date-time as the timestamp (e.g., `2026-03-27T20-45`).

This is critical for existing folder adoption (Mode B) where files are user-created and irreplaceable.

### Step 5: Apply Changes

For each file with proposed changes:
1. Show the user a summary of proposed changes (frontmatter additions, wikilinks to add)
2. Wait for confirmation before applying
3. Apply changes using file edit tools

### Step 6: Glossary Maintenance

After scanning all files, analyze entity frequency:

**New term suggestions:**
- An entity appears in 3+ files but is not in the Glossary
- Present each suggestion: "'Kafka' mentioned in 8 notes. Add to Glossary? (Y/n)"
- For confirmed terms, use `byoao_add_glossary_term` to add them

**Auto-graduation suggestions:**
- A Glossary term is referenced by 5+ notes
- Suggest creating a standalone concept note in `Knowledge/`
- The concept note gets auto-generated frontmatter:
  ```yaml
  domain: <from Glossary>
  references:
    - "[[note1]]"
    - "[[note2]]"
  ```
- Update the Glossary entry to link to the concept note

### Step 7: Hub Note Creation

Identify entities that are frequently mentioned but have no corresponding note:
- "12 files mention 'Payment Migration' but no note exists — create it?"
- Hub notes aggregate references and provide a landing page for the topic
- Hub note template:

```markdown
---
title: "<Topic>"
type: reference
domain: "<inferred domain>"
references:
  - "[[note1]]"
  - "[[note2]]"
tags: [hub]
status: active
---

# <Topic>

(Auto-created by /weave — this topic is mentioned across multiple notes)

## Referenced In

- [[note1]] — <brief context>
- [[note2]] — <brief context>
```

### Step 8: Report

After all changes are applied, provide a summary:

```
Weave complete:
- Scanned: N files
- Enriched: N files (frontmatter + wikilinks)
- Wikilinks added: N
- Glossary terms added: N
- Hub notes created: N
- Concept notes graduated: N
- Orphaned files (no links): N
- Skipped: N non-markdown files
- Backups: .byoao/backups/<timestamp>/
```

## Single File Mode

When `file=` is provided, run the same process but only for that one file. Still read the Glossary and check for cross-references, but skip Steps 6-7 (Glossary maintenance and hub note creation are batch operations).

## Important Guidelines

- **Be conservative**: When in doubt about a wikilink or frontmatter value, skip it. False positives degrade trust.
- **Ask, don't assume**: Always present changes for user confirmation before applying.
- **Preserve user content**: Never delete, rewrite, or reorganize existing text. Only add metadata and convert mentions to links.
- **Domain inference**: Use Glossary domains and existing note domains to infer the domain for new notes. Consistency matters.
- **Idempotent**: Running /weave twice on the same file should not add duplicate wikilinks or frontmatter fields.
