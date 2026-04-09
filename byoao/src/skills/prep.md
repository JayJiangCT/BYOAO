---
name: prep
description: >
  Shared prerequisites check — verifies Obsidian CLI is available and displays a correct
  error message with installation guidance. Referenced by all skills via "(see /prep)".
---

# /prep — Prerequisites Check

## Obsidian CLI Availability

Before using any BYOAO skill, verify the Obsidian CLI is available:

```bash
obsidian --version
```

If this fails, STOP and display:

```
Obsidian CLI is not available. The Obsidian CLI is bundled with the Obsidian
app (v1.12+) and cannot be installed separately.

1. Install or update Obsidian from: https://obsidian.md/download
2. Open Obsidian and enable the CLI:
   Settings → General → Advanced → Command-line interface
3. Make sure Obsidian is running, then try again.
```

## Graph Enrichment

Scan all user notes and enrich frontmatter, suggest cross-references.

### Step 1: Scan Notes
- Read all `.md` files outside agent directories
- Extract entities, key terms, and potential wikilink targets

### Step 2: Enrich Frontmatter
For each note missing frontmatter:
- Add `title` (from filename or first heading)
- Add `date` (from file creation time or content)
- Suggest `tags` based on content

For notes with partial frontmatter:
- Fill in missing required fields
- Never overwrite existing values

### Step 3: Suggest Cross-References
- Identify recurring terms mentioned across notes
- Suggest converting mentions to `[[wikilinks]]`
- Propose new entries for `SCHEMA.md` tag taxonomy

### Step 4: Report
Present a summary:
- Notes enriched: X
- Wikilinks suggested: Y
- New schema terms proposed: Z
Ask for approval before applying any changes.

### Key Behaviors
- Idempotent — running twice won't duplicate changes
- Never overwrites existing frontmatter values
- Asks before applying wikilink suggestions
