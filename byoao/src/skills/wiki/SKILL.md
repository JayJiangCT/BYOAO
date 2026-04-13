---
name: wiki
description: >
  Generate and maintain INDEX.base — the Obsidian Bases wiki index for v2 agent pages
  (type: entity, concept, comparison, query). Uses Obsidian CLI to inventory pages and
  SCHEMA.md for taxonomy; agents retrieve via the same property/search graph the Base
  evaluates in the UI. Use when the user says "update the index", "refresh the knowledge map",
  "show me the wiki", "what's in the knowledge base", "rebuild INDEX.base", or wants the
  current compiled knowledge overview.
---

# /wiki — Knowledge Map

**Metaphor:** The menu board — shows what's been prepared and what's on offer.

## Purpose

**`INDEX.base` is the vault wiki index.** In Obsidian, Bases runs a live query and renders each matching note as a row with rich metadata (frontmatter fields, paths, backlinks, dates — whatever columns you configure). That dynamic association model **is** the index; do not duplicate it with a separate static markdown catalog.

**Preferred vs fallback:** **Bases + `INDEX.base`** is the preferred index. A **markdown outline in chat** (below) is only a **fallback** when the user has no Bases / no `INDEX.base` (e.g. core plugin off, or vault not yet opened in Obsidian) — it is not a second on-disk index file.

For **CLI and AI**, there is no separate index file to maintain beyond `INDEX.base`: use **`obsidian properties`**, **`obsidian search`**, **`obsidian tags`**, and **`obsidian backlinks`** to traverse the same knowledge the Base surfaces. Run `obsidian help` for the latest commands.

`SCHEMA.md` defines tag taxonomy when summarizing or grouping entries.

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

### Step 3: Index source (Bases first, markdown outline as fallback)

#### Step 3a — Bases / `INDEX.base` (preferred)

1. If the vault has no **`INDEX.base`** at the root, install the template: copy **`INDEX.base.example`** from the BYOAO package to **`INDEX.base`** (same directory as `AGENTS.md`). **`byoao init`** / **`byoao upgrade`** already perform this copy when the file is missing — only copy manually if the user skipped init or removed the file.
   - **Repo path:** `byoao/src/assets/presets/common/INDEX.base.example`
   - **After `npm install`:** `node_modules/@jayjiang/byoao/src/assets/presets/common/INDEX.base.example`
   - **Shell (from vault root, adjust source path):** `cp /path/to/INDEX.base.example ./INDEX.base`
2. Ask the user to open **`INDEX.base`** in Obsidian (Bases core plugin on). If YAML errors appear, fix quoting or formulas per the bundled **obsidian-bases** skill.

#### Step 3b — CLI inventory (always useful; also fallback summary)

Run:

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
- Tags, domain, `updated` — the same dimensions Bases can show as columns

**If Bases is unavailable:** Present the inventory in your reply as a structured markdown outline (`# Knowledge Index` → `## Entities` → bullet list, etc.). **Do not** save that outline as a permanent `INDEX.md` unless the user explicitly asks. When the user enables Bases later, **`INDEX.base`** remains the canonical index.

### Step 4: Ensure `INDEX.base` matches that scope

Verify or refine the Base at vault root. Prefer a **rich Bases layout** (global scope + formulas + multiple views) over four minimal tables with only 2–4 columns.

**Reference template:** **`INDEX.base.example`** under preset `common/` (`byoao/src/assets/presets/common/INDEX.base.example` in the repo; `node_modules/@jayjiang/byoao/src/assets/presets/common/INDEX.base.example` when installed).

**Division of responsibilities — `INDEX.base` vs CLI**

| Layer | Role |
|-------|------|
| **`INDEX.base` (Obsidian)** | Live query, grouping, formulas (staleness, backlink count, labels), column display names — **human** scanning and **definition of scope** (which folders / types count as “compiled wiki”). |
| **Obsidian CLI** | **Does not** evaluate Base formulas. Agents **read** `INDEX.base` to learn filters/paths, then use **`obsidian properties`** (by `type`, etc.), **`obsidian search`**, **`obsidian tags`**, **`obsidian backlinks`** to list and read notes in the **same** scope. |

1. **Global scope (recommended)** — Top-level **`filters`** with `or:` so every view inherits the same universe, e.g. `file.inFolder("entities")`, … `file.inFolder("queries")`. Avoid relying only on per-view `type == "entity"` without folder scope. Search-style alternative: `path:entities/ OR …` if your Bases version supports it.

2. **Formulas (optional but valuable)** — e.g. `type_label`, `days_since_update` from frontmatter `updated`, `backlink_count` from `file.backlinks.length` (confirm syntax for your Obsidian version).

3. **`properties` + `displayName`** — Include **`file.name`** (e.g. displayName `"Name"`) plus `title`, `domain`, `tags`, `updated`, `status`, and `formula.*` fields.

4. **Views (suggested six)** — All Pages (`groupBy: type`); Entities / Concepts (`type` filter + `groupBy: domain`); Comparisons; Queries; **Recently Updated** — use **`limit`** and put **`updated` first in `order`**; **do not** `groupBy` raw `updated` (timestamps are too granular). Optional **`summaries`** (e.g. average of `formula.backlink_count` on wide tables).

5. **YAML** — Keep formula strings consistently quoted; see comments at the top of **`INDEX.base.example`**.

If the Base doesn't exist or is misconfigured, guide the user to create it in Obsidian or copy **`INDEX.base.example`** as above.

**Reading via CLI:** `obsidian read file="INDEX.base"` returns the **on-disk definition**; it **defines** the live index Obsidian evaluates — use it to align CLI queries with paths and properties.

### Step 5: Present the index to the user

Show a markdown summary in your reply (totals, sections by type, sample lines) — **chat output**; not a substitute for **`INDEX.base`** when Bases is enabled.

### Step 6: Suggest gaps

Based on the inventory, identify knowledge gaps:

- Entity mentioned in multiple concepts but no entity page exists
- Concept referenced in entity pages but no concept page exists
- Domains with very few pages (under-represented areas)
- Tags used frequently but no corresponding concept page

## Key Principles

- **One index on disk:** **`INDEX.base`** when Bases is on; use **`INDEX.base.example`** as the default layout. Chat markdown is fallback only.
- **Summary quality.** Each entry's one-line summary should be genuinely informative, not just the page title repeated.
- **Navigation first.** Structure the Base and your summary for scanning, not exhaustive prose.
- **Obsidian is first workbench.** All note operations go through Obsidian CLI.
- **Agent pages only** in this index: `entities/`, `concepts/`, `comparisons/`, `queries/` — not arbitrary user notes.
