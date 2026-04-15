---
name: mise
description: >
  Vault health check at the structural level. Checks frontmatter coverage, orphan notes,
  broken links, AGENTS.md and SCHEMA.md drift, v2 agent directories, and overall vault
  configuration. Broader than /health (which focuses on agent pages) — /mise checks the
  entire vault including user notes. Use when the user says "check my vault", "is
  everything set up correctly", "vault health", "mise", or wants a full
  structural audit beyond just agent pages.
---

# /mise — Vault Mise en Place

You are a vault doctor. Your job is to check the overall health of the vault — structure, frontmatter coverage, configuration, and consistency across both user notes and agent pages.

## Prerequisites Check

```bash
obsidian --version
```

If this fails, STOP and display the Obsidian CLI availability message (see /prep).

## Parameters

- **focus** (optional): Specific area to check — `frontmatter`, `links`, `structure`, `config`, or `all`. Default: `all`.

## Process

### Step 1: Frontmatter Coverage

```bash
obsidian properties sort=count counts
```

Report:
- Total notes with frontmatter vs. without
- Most common missing fields
- Notes with invalid frontmatter (bad dates, unknown types, etc.)
- Tag usage: how many unique tags, how many notes per tag

### Step 2: Broken Wikilinks

Scan for wikilinks that point to non-existent files:

```bash
obsidian search "\[\[.*\]\]"
```

For each wikilink found, check if the target file exists. Report broken links with:
- Source file where the broken link appears
- Target link that doesn't resolve
- Suggested fix (create the missing file or remove the link)

### Step 3: Orphan Detection

Find notes with no inbound wikilinks:

```bash
obsidian backlinks "note-name"
```

For both user notes and agent pages, identify orphans. Note that newly created notes are expected to be orphans temporarily.

### Step 4: AGENTS.md, SCHEMA.md, and v2 layout

Check if `AGENTS.md` accurately reflects the current vault state:
- Does it reference directories that no longer exist?
- Does it miss directories that were added?
- Are the skill references still valid?
- Is the navigation advice still accurate?

Check `SCHEMA.md`:
- Tag taxonomy and domain sections match how tags are actually used
- Agent directory table matches `entities/`, `concepts/`, `comparisons/`, `queries/`
- Frontmatter expectations align with v2 `type: entity | concept | comparison | query`

Verify the v2 agent directories exist and are usable: `entities/`, `concepts/`, `comparisons/`, `queries/` (note if any are missing or empty when the vault should have compiled knowledge).

### Step 5: Configuration Check

Verify vault configuration:
- `.obsidian/` directory exists and is valid
- `.opencode/` directory has current skill definitions
- `SCHEMA.md` exists and has a defined tag taxonomy
- `log.md` exists and has recent entries
- `INDEX.base` exists as the Bases wiki index (run `/wiki` to verify or improve it)

### Step 6: Present Diagnosis

```markdown
# Vault Mise en Place

Scanned {N} notes, {M} agent pages, {K} user notes.

---

## Frontmatter Coverage
- Notes with frontmatter: X/Y (Z%)
- Most common missing: {list fields}
- Unique tags: {N} (top 5: {list})

## Broken Wikilinks
- {N} broken links found:
  - [[target]] in [[source]] → file not found

## Orphan Notes
- {N} notes with no inbound links:
  - [[note-name]] — consider linking from [[suggested-source]]

## AGENTS.md / SCHEMA.md / layout
- AGENTS.md: {Up to date / Needs update} — {details if outdated}
- SCHEMA.md: {Up to date / Needs update / Missing} — {taxonomy vs usage}
- Agent dirs (`entities/`, `concepts/`, `comparisons/`, `queries/`): {OK / Missing / Issues}

## Configuration
- .obsidian/: {OK / Missing / Issues}
- .opencode/: {OK / Missing / Issues}
- log.md: {OK / Missing / {N} entries, last: {date}}
- INDEX.base: {OK / Missing / Needs update}

## Overall Health
**Score**: {Good / Fair / Needs attention}

{2-3 sentence summary of the vault's overall health and the top 2-3 issues to address}
```

## Key Principles

- **Comprehensive but prioritized.** Check everything, but surface the most important issues first.
- **Actionable findings.** Every issue should come with a suggested fix.
- **Non-destructive by default.** Report issues, don't fix them automatically.
- **Whole vault, not just agent pages.** Unlike /health which focuses on agent-maintained directories, /mise checks the entire vault.
- **Obsidian is first workbench.** All note operations go through Obsidian CLI.
