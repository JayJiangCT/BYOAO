---
name: byoao-conventions
description: Use when creating or modifying notes in a BYOAO-structured vault. Enforces frontmatter, directory placement, wikilinks, and naming conventions.
---

# BYOAO Document Conventions

You MUST follow these conventions when creating or modifying any note in this vault.

## Pre-Flight Checklist

Before creating any note:

1. Read `AGENT.md` — check the Document Conventions section for vault-specific rules
2. Check `Knowledge/Glossary.md` — know the domain terminology before writing
3. Identify the correct template — match your note type to a template below
4. Verify the target directory — place the file according to its `type`

## Creating Notes with Templates

ALWAYS use `obsidian create` when a matching template exists:

```
obsidian create name="Feature Name" template="Feature Doc" path="Projects/"
obsidian create name="Sprint N Handoff" template="Sprint Handoff" path="Sprints/"
obsidian create name="Meeting Title" template="Meeting Notes"
obsidian create name="Investigation Title" template="Investigation"
obsidian create name="Decision Title" template="Decision Record"
obsidian create name="YYYY-MM-DD" template="Daily Note" path="Daily/"
```

If no template matches, construct frontmatter manually:

```yaml
---
title: "Note Title"
type: reference
status: draft
date: YYYY-MM-DD
tags: []
---
```

## Required Frontmatter

Every note MUST have these fields:

| Field | Values |
|-------|--------|
| `title` | Descriptive title |
| `type` | `feature`, `sprint-handoff`, `meeting`, `investigation`, `decision`, `daily`, `reference`, `person` |
| `status` | `draft`, `active`, `completed`, `archived` |
| `date` | YYYY-MM-DD |
| `tags` | Array of relevant tags |

Additional fields by type:

| type | Additional Fields |
|------|-------------------|
| `feature` | `project`, `jira`, `stakeholders`, `priority` |
| `sprint-handoff` | `sprint`, `sprint-dates`, `jira-board` |
| `meeting` | `participants`, `meeting-type` |
| `investigation` | `jira`, `hypothesis` |
| `decision` | `decision`, `decided-by` |
| `person` | `team`, `role` |

## Directory Placement

ALWAYS place files in the directory matching their type. Refer to the Document Conventions section in `AGENT.md` for the authoritative type-to-directory mapping for this vault.

| type | Directory |
|------|-----------|
| `feature` | `Projects/` |
| `sprint-handoff` | `Sprints/` |
| `daily` | `Daily/` |
| `reference` | `Knowledge/` |
| `person` | `People/` |
| `meeting` | Within relevant project or sprint folder |
| `investigation` | Within relevant project folder |
| `decision` | Within relevant project folder |

## Wikilink Rules

ALWAYS use wikilinks for:

- People → `[[Person Name]]`
- Projects → `[[Project Name]]`
- Domain terms → check `[[Glossary]]` first, link if present
- Teams → link to the team index note in `People/`

## File Naming

- Use Title Case or kebab-case for file names
- JIRA tickets: use the project key prefix (e.g., `PROJ-1234-Description.md`)
- No special characters, no leading/trailing spaces

## Post-Creation Verification

After creating or modifying a note, verify:

1. All required frontmatter fields are present and correct
2. File is in the correct directory for its type
3. People and project mentions use `[[wikilinks]]`
4. Domain terms reference `[[Glossary]]`
