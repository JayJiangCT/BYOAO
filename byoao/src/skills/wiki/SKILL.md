---
name: wiki
description: >
  Generate and maintain INDEX.base — the dynamic knowledge map for v2 agent pages (type:
  entity, concept, comparison, query). Uses Obsidian Base queries to list agent-maintained
  pages; SCHEMA.md defines tag taxonomy. Use when the user says "update the index",
  "refresh the knowledge map", "show me the wiki", "what's in the knowledge base",
  "rebuild INDEX.base", or wants to see the current state of compiled knowledge.
---

# /wiki — Knowledge Map

**Metaphor:** The menu board — shows what's been prepared and what's on offer.

## Purpose

Generate and maintain `INDEX.base`, the dynamic knowledge map that lists all agent-maintained pages grouped by v2 `type` (`entity`, `concept`, `comparison`, `query`). Unlike static index files, INDEX.base uses Obsidian Base queries to stay current automatically. Use `SCHEMA.md` for tag taxonomy when summarizing or grouping entries.

## Process

### Step 1: Prerequisites Check

```bash
obsidian --version
```

If this fails, STOP and display the Obsidian CLI availability message (see /prep).

### Step 2: Read SCHEMA.md

```bash
obsidian read file="SCHEMA.md"
```

Understand the current tag taxonomy, domain definitions, and page conventions.

### Step 3: Generate INDEX.base Content

Query all agent-maintained pages by v2 frontmatter `type` (`entity`, `concept`, `comparison`, `query`) so each page is listed under the correct section:

```bash
obsidian properties type=entity
obsidian properties type=concept
obsidian properties type=comparison
obsidian properties type=query
```

For each type, compile entries with:
- Page name (as wikilink)
- Title from frontmatter
- Brief summary (from content's first paragraph or definition section)
- Tags and domain

Format by section:

```markdown
# Knowledge Index

## Entities
- [[feature-a]] — Response time monitoring feature (tags: monitoring, backend)
- [[zhang-san]] — Senior engineer on Feature A team (tags: team, engineering)

## Concepts
- [[response-time-metrics]] — Why median replaced avg for trigger calculation (tags: metrics, decisions)
- [[search-trigger-rules]] — Search trigger rule design principles (tags: search, configuration)

## Comparisons
- [[avg-vs-median-for-trigger]] — Side-by-side analysis of avg vs median as trigger metrics (tags: metrics, decisions)

## Queries
- [[why-did-we-choose-median]] — "Why did we choose median over avg?" — detailed answer (tags: metrics, history)
```

### Step 4: Check Obsidian Base Configuration

INDEX.base relies on Obsidian Base (saved search) configuration. Verify:

1. The Base query covers all four agent directories
2. The query filters by `type` frontmatter field
3. Results are grouped by type

If the Base doesn't exist or is misconfigured, guide the user to set it up:
- Open Obsidian → Bases → Create new base
- Name it "Knowledge Index"
- Query: `path:entities/ OR path:concepts/ OR path:comparisons/ OR path:queries/`
- Group by: `type`

### Step 5: Present the Index

Show the current INDEX.base content to the user:

```markdown
# Knowledge Index

Generated on YYYY-MM-DD

Total pages: N (X entities, Y concepts, Z comparisons, W queries)

## By Domain
- backend: N pages
- frontend: M pages
- infrastructure: K pages

## Most Connected
- [[page-name]] — N inbound links
- [[page-name]] — M inbound links

## Recently Updated
- [[page-name]] — updated YYYY-MM-DD
- [[page-name]] — updated YYYY-MM-DD
```

### Step 6: Suggest Gaps

Based on the index, identify knowledge gaps:
- Entity mentioned in multiple concepts but no entity page exists
- Concept referenced in entity pages but no concept page exists
- Domains with very few pages (under-represented areas)
- Tags used frequently but no corresponding concept page

## Key Principles

- **INDEX.base is dynamic.** The Obsidian Base query keeps it current — no manual regeneration needed on every cook cycle.
- **Summary quality.** Each entry's one-line summary should be genuinely informative, not just the page title repeated.
- **Navigation first.** INDEX.base exists to help humans find knowledge quickly. Structure it for scanning, not completeness.
- **Obsidian is first workbench.** All note operations go through Obsidian CLI.
- **Agent pages only.** INDEX.base covers only `entities/`, `concepts/`, `comparisons/`, `queries/` — not user notes.
