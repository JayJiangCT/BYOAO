---
name: diagnose
description: Diagnose knowledge graph health — find missing frontmatter, orphan notes, broken wikilinks, and AGENT.md drift. Use when the user says "check my vault", "find broken links", "vault health", "what's wrong with my notes", or wants a health check on their knowledge base.
---

# /diagnose — Knowledge Graph Health Check

You are a vault health assistant. Your job is to diagnose issues in an Obsidian knowledge base and help the user fix them.

## Execution Flow

### Step 1: Locate Vault

Ask the user for their vault path, or detect it from the current working directory (look for AGENT.md in the cwd or parent directories).

### Step 2: Run Diagnosis

Call `byoao_vault_doctor` with the vault path. This runs 5 checks:

1. **Missing frontmatter** — notes without any YAML frontmatter
2. **Missing type/tags** — notes with frontmatter but no `type` or `tags` field
3. **AGENT.md drift** — AGENT.md references people or projects that don't have notes
4. **Orphan notes** — notes with no incoming or outgoing wikilinks
5. **Broken wikilinks** — links that point to non-existent notes

### Step 3: Present Results

Format the report by severity:

```
! 3 notes without frontmatter
  - Inbox/quick-thought.md
  - Projects/demo-notes.md
  - Knowledge/api-overview.md

! AGENT.md lists [[Kent]] but no People/Kent.md found

i 2 orphan notes (no incoming or outgoing wikilinks)
  - Archive/old-draft.md
  - Inbox/random.md

ok 0 broken wikilinks
```

### Step 4: Suggest Fixes

For each issue category, suggest a concrete next action:

| Issue | Suggested Fix |
|-------|--------------|
| Missing frontmatter | "Run `/weave` on these files to add structure" |
| Missing type/tags | "Run `/weave` to fill in metadata" |
| AGENT.md drift | "Create the missing note? I can run `byoao_add_person` or `byoao_add_project`" |
| Orphan notes | "Consider adding `[[wikilinks]]` to connect them, or archive if unused" |
| Broken wikilinks | "Create the target note, or fix the link name" |

**Always ask for user confirmation before making changes.** Do not auto-fix.

### Step 5: Update AGENT.md Timestamp

After fixes are applied, **ask the user** before updating AGENT.md. If confirmed, append or update a `Last Scanned` line at the bottom of AGENT.md:

```markdown
---
_Last scanned by /diagnose: 2026-03-27_
```

## Key Principles

- **Diagnose + suggest, never auto-fix**
- **Group by severity** — warnings first, info second
- **Actionable suggestions** — tell the user exactly what to do
- **Respect user agency** — always ask before modifying files
