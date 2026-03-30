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
2. Scans files (respects exclusion rules and `.byoaoignore`)
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

## /explain — Explain Codebase Systems

**What it does:** Explains codebases and systems in plain language, caching knowledge in your vault.

**How to run:**

```
/explain "How does the payment service handle refunds?"
```

**Process:**
1. Loads baseline overview from `.opencode/context/repos/`
2. Checks `Systems/` for cached knowledge
3. Reads local repo clone for details if needed
4. Synthesizes a clear explanation with Mermaid diagrams
5. Saves to `Systems/` in your vault

**Best for:** Knowledge workers who need to understand codebases without reading code directly.

---

**← Previous:** [Workflows](workflows.md) | **Next:** [CLI Reference](cli-reference.md) →
