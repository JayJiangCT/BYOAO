[← Back to Index](index.md) | [中文](../zh/workflows.md)

# Workflows

Real scenarios showing how to use BYOAO day-to-day. Each workflow introduces the relevant skills in context.

---

## 1. First Cook — Compiling Your Notes

**When:** You've just created your KB and have some notes (imported or freshly written).

**Steps:**

1. Make sure your vault is open in Obsidian with CLI enabled
2. Open the Agent Client panel
3. Run `/prep` to enrich frontmatter across your notes
4. Run `/cook` to compile knowledge from your notes
5. Review the summary of changes
6. Press `Cmd+G` to see the graph

**What to expect:**
- Entity pages created for people, projects, and products mentioned across notes
- Concept pages for methods, rules, and decisions
- Contradictions detected and flagged for review
- INDEX.base and log.md updated
- A summary like: "Created 5 entity pages, 3 concept pages. 1 contradiction flagged."

**Tips:**
- Run /cook on a few core notes first (use `/cook "topic name"`) to see how it works
- Re-run /cook anytime — it's incremental (only processes new/modified notes)
- After /cook, run `/health` to check for issues

---

## 2. Organizing After Cook — Restructuring Your Vault

**When:** You've run `/prep` and your notes now have frontmatter, but files are scattered across a messy directory structure (common when adopting an existing knowledge base).

**Steps:**

1. Make sure you've already run `/prep` (the agent needs `type` metadata to decide where files belong)
2. Run `/organize` to see the proposed directory restructuring

```
/organize                    # Full vault analysis
/organize dry-run            # Preview changes without executing
/organize scope=Projects/    # Focus on a specific folder
```

3. Review the before/after summary — the agent groups moves by action (e.g. "Move 12 meeting notes to Meetings/")
4. Approve or adjust — you can accept all, reject all, or cherry-pick moves
5. The agent uses `obsidian move` for each file, which automatically updates all wikilinks

**What to expect:**
- Files reorganized by type based on frontmatter metadata
- Coherent groups stay together (a sprint folder with related files won't be split up)
- All wikilinks and backlinks update automatically — no broken references

**Tips:**
- Start with `dry-run` to see what would change before committing
- Use `scope=` to reorganize one folder at a time for more control
- The agent won't move files where the benefit is unclear — it's conservative by default

---

## 3. Weekly Review — Keeping the Knowledge Base Fresh

**When:** You've been writing notes all week and want to integrate them into the knowledge base.

**Steps:**

1. Run `/cook` to compile this week's notes into knowledge
2. Run `/health` to audit agent pages

```
/cook
/health
```

**What /health reports:**
- Orphan pages (not connected to anything)
- Broken wikilinks (links to non-existent notes)
- Stale content (outdated agent pages)
- Frontmatter violations
- Tag taxonomy drift

**Follow-up actions:**
- For orphan pages: decide if they should be connected or archived
- For broken links: fix the link or create the missing page
- For stale content: /cook will update on the next run

---

## 4. Tracing an Idea — How Did My Thinking Evolve?

**When:** You want to understand how a concept developed across your notes over time.

**Example:** You've been thinking about "API rate limiting" for months and want to see the full arc.

**Steps:**

```
/trace topic="rate limiting"
```

**What you get:**
- A chronological timeline of every note that mentions "rate limiting"
- Phases identified: Discovery → Investigation → Decision → Implementation
- Turning points flagged: "After reading [[System Design Doc]], your approach changed"
- Open threads: "You explored token buckets but never followed up after June"

**When to use:**
- Before making a decision — see what you've already explored
- When writing a retrospective — trace a project's evolution
- When onboarding someone — "here's how this decision was made"

---

## 5. Bridging Two Topics — Finding Hidden Connections

**When:** You suspect two topics are related but can't articulate how.

**Example:** You work on "payment processing" and "user onboarding" separately. Are they connected in your vault?

**Steps:**

```
/connect from="payment processing" to="user onboarding"
```

**What you get:**
- **Shared notes** — notes that discuss both topics
- **Shared people** — people involved in both areas
- **Graph paths** — how the two topics connect through intermediate notes (up to 3 hops)
- **Strength assessment** — strong, moderate, or weak connection
- **Suggested actions** — specific notes to link, hub notes to create

**When to use:**
- Cross-team collaboration — "how does my work connect to yours?"
- Strategic thinking — "what ties these initiatives together?"
- Writing — "I need to explain how A relates to B"

**If no connection is found:** That's a useful result too. It means these topics haven't intersected in your notes yet — maybe they should, maybe they shouldn't.

---

## 6. Generating Ideas — What Should I Work On Next?

**When:** Your vault has substantial content and you want creative, actionable suggestions.

**Steps:**

```
/ideas
/ideas focus="infrastructure"   # Focus on a domain
```

**What you get:**
- **Synthesis ideas** — combine two existing threads into something new
- **Gap ideas** — something the vault implies is needed but doesn't exist
- **Connection ideas** — two people/projects that should be talking
- **Amplification ideas** — take something small and scale it
- **Challenge ideas** — question an assumption the vault takes for granted

Every idea cites 2+ vault notes and includes a concrete next step.

**When to use:**
- Quarterly planning — "what opportunities does my vault reveal?"
- Feeling stuck — let the vault suggest what to work on
- Cross-domain innovation — find overlap between separate areas

---

## 7. Challenging a Belief — Am I Right About This?

**When:** You're about to make a big decision and want to test it against your own history.

**Example:** You believe "we should migrate to microservices."

**Steps:**

```
/challenge belief="we should migrate to microservices"
```

**What you get:**
- Supporting evidence from your notes (fair assessment first)
- Counter-evidence: contradictions, position changes over time
- Unstated assumptions your belief relies on
- Missing perspectives (whose viewpoint is absent?)
- Confidence rating: Strong / Moderate / Weak / Contradicted

**When to use:**
- Before major decisions — "does my vault support this?"
- Resolving disagreements — "what do my own notes say?"
- Retrospectives — "was this the right call?"

---

## 8. Detecting Drift — Am I Doing What I Said I Would?

**When:** You want to compare your stated plans with what actually happened.

**Steps:**

```
/drift                         # Last 30 days
/drift period=60d              # Last 60 days
/drift focus="API migration"   # Focus on a project
```

**What you get:**
- Each intention categorized: aligned, delayed, drifted, abandoned, or emergent
- Pattern detection: priority displacement, scope creep, goal abandonment
- Emergent work recognized (unplanned but important)
- Questions to consider (descriptive, not judgmental)

**When to use:**
- End of sprint/month — "did I follow through?"
- Quarterly review — "where did my priorities actually go?"
- When overwhelmed — "what's consuming my attention vs what I planned?"

---

## Building a Routine

Here's a rhythm that works well:

| Frequency | Action | Skill |
|-----------|--------|-------|
| Daily | Write a daily note, capture meetings and ideas | — |
| Weekly | Compile new notes, audit health | `/cook` + `/health` |
| After cook | Restructure directories if needed | `/organize` |
| When curious | Trace how a topic evolved | `/trace` |
| Quarterly | Generate ideas, review drift | `/ideas` + `/drift` |
| Before big decisions | Pressure-test your assumptions | `/challenge` |
| As needed | Bridge two topics you're working on | `/connect` |

The goal is not to run every skill every day. Write freely, cook weekly, think quarterly.

---

**← Previous:** [Core Concepts](core-concepts.md) | **Next:** [Skills Reference](skills-reference.md) →
