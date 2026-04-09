---
name: wiki
description: Generate INDEX.base knowledge graph at vault root and update AGENTS.md with current stats. Use when the user says "generate index", "build wiki", "update INDEX", "create knowledge map", or wants a visual overview of their vault.
---

# /wiki — Generate Knowledge Index

You are a knowledge cartographer. Your job is to generate an `INDEX.base` file at the vault root that serves as the knowledge graph entry point, and update `AGENTS.md` with current vault statistics.

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

## Process

### Step 1: Build Vault Map

```bash
obsidian list
```

```bash
obsidian properties sort=count counts
```

This gives you the full list of notes and their frontmatter distribution.

### Step 2: Read Existing INDEX.base (if any)

If `INDEX.base` already exists, read it to understand the current structure:

```bash
obsidian read "INDEX"
```

### Step 3: Analyze Knowledge Structure

Group notes by their `domain` frontmatter field. For notes without `domain`, infer it from content. Count:
- Total notes
- Notes by `domain` (topics)
- Notes by `note_type` (fleeting, literature, permanent)
- Most frequently referenced concepts

### Step 4: Generate INDEX.base

Create or overwrite `INDEX.base` at the vault root. Use Obsidian CLI to create the file:

```bash
obsidian create name="INDEX" content="<YAML content>" silent overwrite
```

The content should be valid YAML for an Obsidian Base:

```yaml
filters:
  not:
    - 'note_type == ""'
formulas: {}
properties:
  note_type:
    displayName: Type
  domain:
    displayName: Domain
views:
  - type: table
    name: "All Notes"
    groupBy:
      property: domain
      direction: ASC
    order:
      - file.name
      - note_type
      - domain
      - tags
      - date
  - type: cards
    name: "Gallery"
    groupBy:
      property: note_type
      direction: ASC
    order:
      - file.name
      - note_type
      - domain
      - date
```

**IMPORTANT:** The YAML must be properly formatted. Use single quotes for formulas containing special characters. Ensure proper indentation (2 spaces).

### Step 5: Generate AGENTS.md

Read the current `AGENTS.md` (if it exists):

```bash
obsidian read "AGENTS"
```

Generate a complete `AGENTS.md` that serves as the agent's entry point for the vault. Use `obsidian create` with `overwrite`:

```bash
obsidian create path="AGENTS.md" content="<content>" overwrite silent
```

The AGENTS.md must contain these sections:

**Header**
```markdown
# BYOAO — Build Your Own AI OS

This knowledge base contains **M topics** and **N indexed notes**.
```

**Usage**
```markdown
## Usage

- `/weave` — Scan notes, enrich with frontmatter and wikilinks, build the knowledge graph
- `/wiki` — Regenerate the INDEX.base knowledge map
- `/organize` — Suggest a directory structure based on frontmatter metadata
```

**Current Stats**
```markdown
## Current Stats

- Total notes: {total}
- Indexed notes (have note_type): {indexed}
- Topics (domain): {domain1}, {domain2}, ...
- Pending notes (need weave): {pending}
```

**Interacting with the Vault** — This is critical. The agent must always prefer Obsidian CLI:
```markdown
## Working with this Vault

When you need to interact with notes, always use Obsidian CLI first:

| Task | Command |
|------|---------|
| Search notes | `obsidian search query="keyword"` |
| Read a note | `obsidian read file="Note Name"` |
| Create a new note | `obsidian create name="Note Title" content="# Content"` |
| Create note in folder | `obsidian create path="Folder/Note.md" content="# Content"` |
| Append to a note | `obsidian append file="Note" content="New content"` |
| Add frontmatter | `obsidian prepend file="Note" content='---
title: "Title"
note_type: fleeting
domain: Topic
date: YYYY-MM-DD
tags: [tag1]
---

'` |
| Rename/move a note | `obsidian move path="Old.md" to="NewFolder/New.md"` |
| List backlinks | `obsidian backlinks file="Note"` |
| Check links | `obsidian links file="Note"` |
| List all files | `obsidian files ext=md` |
| Check unresolved links | `obsidian unresolved total` |
| Open random note | `obsidian random` |

For multi-line content, use `\\n` for newlines in the `content=` parameter.
```

**Creating New Notes** — explicit guidance:
```markdown
## Creating New Notes

When asked to write, research, or document something:

1. **Search first** — `obsidian search query="topic"` to check if a relevant note already exists
2. **Read existing notes** — `obsidian read file="Note"` to understand what's already captured
3. **Create with frontmatter** — always include proper YAML frontmatter when creating:
   ```
   obsidian create name="New Note" content='---
   title: "New Note"
   note_type: fleeting
   domain: YourDomain
   date: YYYY-MM-DD
   tags: [relevant-tags]
   ---

   # New Note

   Content here...
   '
   ```
4. **Link to existing notes** — use `[[wikilink]]` syntax to connect new notes to existing ones
5. **Use `/weave` after bulk creation** — to enrich and connect the new notes to the graph
```

**Footer**
```markdown
---
*Generated by /wiki skill*
```

### Step 6: Report

```
Wiki index generated:
- INDEX.base: created/updated at vault root
- Notes indexed: N
- Topics: M (by domain)
- AGENTS.md: updated with new counts
```

Suggest the user open `INDEX.base` in Obsidian to view the knowledge graph in table or card view.

## Important Guidelines

- **INDEX.base is a query, not static content** — it dynamically displays notes based on frontmatter. The file itself only contains the query configuration.
- **Only index notes with `note_type`** — notes without this field are not yet processed by `/weave` and should not appear in the index.
- **Preserve custom views** — if the user has added custom views to `INDEX.base`, merge new views rather than overwriting.
- **Idempotent** — running `/wiki` multiple times should produce the same result without duplication.
