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

### Step 5: Update AGENTS.md

Read the current `AGENTS.md`:

```bash
obsidian read "AGENTS"
```

Update the note count and topic count. The AGENTS.md file should contain a line like:

```markdown
本知识库包含 **X 个主题**，共 **Y 条笔记**。
```

Update X with the number of unique `domain` values and Y with the total note count. Use `obsidian append` or file edit to make this change.

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
