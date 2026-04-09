[← Back to Index](index.md) | [中文](../zh/skills-reference.md)

# Skills Reference

All AI skills available in BYOAO. Run these in the Agent Client panel inside Obsidian.

> **Prerequisite:** All skills require the Obsidian CLI to be enabled. See [Getting Started](getting-started.md#step-3-open-in-obsidian).

---

## /cook — Compile Notes into Knowledge

**What it does:** Reads your notes and external sources, distills them into structured knowledge pages in `entities/`, `concepts/`, `comparisons/`, and `queries/`.

**How to run:**

```
/cook                     # Incremental — new/modified notes since last cook
/cook --all               # Full — re-read all notes in the vault
/cook "Feature A"         # Targeted — notes matching a keyword
/cook path/to/note.md     # Targeted — a specific note
```

**Process:**
1. Reads target notes (incremental by default)
2. Identifies entities (named things) and concepts (abstract ideas)
3. Matches against existing agent pages
4. Creates new pages or updates existing ones
5. Checks for contradictions across sources
6. Updates INDEX.base and log.md
7. Reports a natural-language summary of changes

**Key behaviors:**
- Never modifies user notes — only creates/updates pages in agent directories
- Detects contradictions and flags them for review
- Reports in natural language: "Updated 2 existing pages, created 1 new concept page"
- Follows page thresholds from SCHEMA.md

---

## /health — Audit Knowledge Base Quality

**What it does:** Scans agent-maintained directories for structural issues and reports grouped by severity.

**How to run:**

```
/health
```

**Checks performed:**
1. Orphan pages — no inbound wikilinks from any note
2. Broken wikilinks — links to non-existent targets
3. Stale content — `updated` date > 90 days behind most recent source
4. Frontmatter violations — missing required fields
5. Tag taxonomy drift — tags not defined in SCHEMA.md
6. Oversized pages — candidates for splitting (> 200 lines)

**Fix suggestions:** Each issue gets a concrete action (run /cook, fix a link, split a page). Always asks before making changes.

---

## /prep — Enrich Frontmatter and Cross-References

**What it does:** Scans all user notes and enriches frontmatter, suggests wikilinks and cross-references. Also serves as the prerequisites check for Obsidian CLI availability.

**How to run:**

```
/prep                     # Scan entire vault
/prep folder=Daily/       # Scan a specific folder
```

**Process:**
1. Verifies Obsidian CLI is available
2. Scans user notes for missing frontmatter
3. Suggests frontmatter additions (title, date, type, tags)
4. Suggests wikilinks to existing agent pages
5. Reports summary of enrichments

---

## /organize — Reorganize Vault Directories

**What it does:** Analyzes enriched frontmatter metadata to propose a logical directory structure, then executes moves safely using `obsidian move` — which automatically updates all backlinks.

**How to run:**

```
/organize                    # Analyze and propose moves for entire vault
/organize dry-run            # Show proposed changes without executing
/organize scope=Projects/    # Only reorganize a specific directory
/organize aggressive         # Also suggest consolidating existing structures
```

**Prerequisites:** Run `/prep` first — `/organize` needs `type` frontmatter to decide where files belong.

**Process:**
1. Analyzes current structure via `obsidian list` and frontmatter
2. Maps files to target directories based on `type`
3. Presents a grouped before/after summary for your approval
4. Executes moves using `obsidian move` (auto-updates all wikilinks)
5. Verifies no broken links remain

**Key behaviors:**
- Conservative — only suggests moves where the benefit is clear
- Never breaks coherent groups (e.g., sprint directories with related files stay together)
- User must approve all moves — nothing happens automatically
- Uses `obsidian move` instead of `mv` so all backlinks update safely

---

## /trace — Track Idea Evolution

**What it does:** Builds a chronological timeline of how a topic evolved across your notes.

**How to run:**

```
/trace topic="rate limiting"
/trace topic="migration" since="2026-01-01"
```

**Parameters:**
- `topic` (required) — the idea, concept, or term to trace
- `since` (optional) — start date to limit the search
- `output` (optional) — save the trace as a new note

**Output includes:**
- Chronological timeline with dates and note references
- Phases: Discovery → Investigation → Decision → Implementation
- Turning points where understanding shifted
- Open threads (mentioned then abandoned)
- Related topics worth tracing

---

## /connect — Bridge Two Domains

**What it does:** Finds hidden relationships between two topics using the vault's link graph.

**How to run:**

```
/connect from="payments" to="auth"
```

**Parameters:**
- `from` (required) — first topic
- `to` (required) — second topic
- `output` (optional) — save the connection map as a note

**What it finds:**
- Shared notes discussing both topics
- Shared people involved in both areas
- Shared tags and domains
- Graph paths connecting them (up to 3 hops)
- Strength assessment: strong, moderate, or weak

**If no connection found:** Reports honestly with suggestions for creating one.

---

## /diagnose — Check Knowledge Base Health

**What it does:** Runs 5 diagnostic checks on your vault and suggests fixes.

**How to run:**

```
/diagnose
```

**Checks performed:**
1. Missing frontmatter — notes without YAML metadata
2. Missing type/tags — notes with incomplete frontmatter
3. AGENTS.md drift — references to notes that don't exist
4. Orphan notes — no incoming or outgoing wikilinks
5. Broken wikilinks — links to non-existent notes

**Fix suggestions:** Each issue gets a concrete action (run /cook, create a note, fix a link). Always asks before making changes.

---

## /ideas — Generate Actionable Ideas

**What it does:** Deep vault scan that combines insights across domains to propose concrete, evidence-backed ideas.

**How to run:**

```
/ideas                         # Ideas across all domains
/ideas focus="infrastructure"  # Focus on a domain
/ideas count=3                 # Limit to 3 ideas
```

**Idea types generated:**
- **Synthesis** — Combine two existing threads into something new
- **Gap** — Something the vault implies is needed but doesn't exist
- **Connection** — Two people/projects that should be talking
- **Amplification** — Take something small and scale it
- **Challenge** — Question an assumption the vault takes for granted

**Key rule:** Every idea must cite 2+ vault notes and include a concrete next step.

---

## /challenge — Pressure-Test Your Thinking

**What it does:** Takes a belief or decision and rigorously tests it against your own vault — finding counter-evidence, contradictions, and unstated assumptions.

**How to run:**

```
/challenge belief="We should use microservices for the new platform"
/challenge belief="[[Decision Record]]" strength=gentle
```

**Parameters:**
- `belief` (required) — statement or note reference to challenge
- `strength` (optional) — "gentle" or "rigorous" (default)

**What it finds:**
- Supporting evidence (fair assessment first)
- Direct contradictions in your own notes
- Position changes over time
- Unstated assumptions
- Missing perspectives

**Output:** Confidence rating (Strong / Moderate / Weak / Contradicted) with evidence and questions to consider.

---

## /drift — Detect Intention-Action Gaps

**What it does:** Compares what you said you would do with what you actually did over a time period, using daily notes and project documents.

**How to run:**

```
/drift                         # Last 30 days, all areas
/drift period=60d              # Last 60 days
/drift focus="API migration"   # Focus on a project
```

**Parameters:**
- `period` (optional) — "7d", "30d" (default), "60d", "90d"
- `focus` (optional) — project, domain, or goal to focus on

**Categories tracked:**
- **Aligned** — intention followed through
- **Delayed** — behind schedule
- **Drifted** — went in a different direction
- **Abandoned** — stated but never acted on
- **Emergent** — unplanned work that happened

**Patterns detected:** Priority displacement, scope creep, energy leaks, goal abandonment, emergent priorities.

---

**← Previous:** [Workflows](workflows.md) | **Next:** [CLI Reference](cli-reference.md) →
