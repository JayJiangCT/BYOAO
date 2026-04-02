[← Back to Index](index.md) | [中文](../zh/skills-reference.md)

# Skills Reference

All 6 AI skills available in BYOAO. Run these in the Agent Client panel inside Obsidian.

> **Prerequisite:** All skills require the Obsidian CLI to be enabled. See [Getting Started](getting-started.md#step-3-open-in-obsidian).

---

## /weave — Connect Notes into a Knowledge Graph

**What it does:** Scans vault notes, adds frontmatter + wikilinks, maintains the Glossary, creates hub notes.

**How to run:**

```
/weave                    # Scan entire vault
/weave folder=Daily/      # Scan a specific folder
/weave file=my-note.md    # Process a single file
```

**Process:**
1. Reads Glossary to load known entities
2. Scans files (respects exclusion rules)
3. Identifies entities: people, projects, concepts, tools
4. Proposes frontmatter additions (never overwrites existing fields)
5. Proposes wikilinks (first occurrence only, not inside code blocks)
6. Backs up files before modification
7. After scan: suggests new Glossary terms (3+ file mentions) and hub notes
8. Reports summary: files enriched, wikilinks added, terms suggested

**Key behaviors:**
- Idempotent — running twice won't duplicate links
- Preserves existing frontmatter — only adds missing fields, merges arrays
- Backs up to `.byoao/backups/<timestamp>/`
- Skips: `.obsidian/`, `.git/`, templates, AGENT.md, binary files

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

## /emerge — Surface Hidden Patterns

**What it does:** Analyzes the vault to find patterns, contradictions, and insights that no single note explicitly states.

**How to run:**

```
/emerge                        # Quick scan of entire vault
/emerge scope=Projects/        # Focus on a folder
/emerge depth=deep             # Read every note (thorough but slower)
```

**Parameters:**
- `scope` (optional) — limit to a folder, domain, or tag
- `depth` (optional) — "quick" (default) or "deep"
- `output` (optional) — save findings as a note

**Patterns it detects:**
- Recurring unanswered questions
- Implicit decisions (direction changed without a decision record)
- Convergent threads heading toward the same conclusion
- Forgotten threads that went silent
- Expertise gaps (topics referenced but never explored deeply)
- Contradictions across notes

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

## /diagnose — Check Knowledge Graph Health

**What it does:** Runs 5 diagnostic checks on your vault and suggests fixes.

**How to run:**

```
/diagnose
```

**Checks performed:**
1. Missing frontmatter — notes without YAML metadata
2. Missing type/tags — notes with incomplete frontmatter
3. AGENT.md drift — references to notes that don't exist
4. Orphan notes — no incoming or outgoing wikilinks
5. Broken wikilinks — links to non-existent notes

**Fix suggestions:** Each issue gets a concrete action (run /weave, create a note, fix a link). Always asks before making changes.

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
