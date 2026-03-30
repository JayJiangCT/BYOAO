[← Back to Index](index.md) | [中文](../zh/workflows.md)

# Workflows

Real scenarios showing how to use BYOAO day-to-day. Each workflow introduces the relevant skills in context.

---

## 1. First Weave — Connecting Your Notes

**When:** You've just created your KB and have some notes (imported or freshly written).

**Steps:**

1. Make sure your vault is open in Obsidian with CLI enabled
2. Open the Agent Client panel
3. Run `/weave`
4. Review the proposed changes — frontmatter additions, wikilinks, Glossary terms
5. Confirm to apply
6. Press `Cmd+G` to see the graph

**What to expect:**
- Notes get frontmatter: `type`, `domain`, `tags`, `references`
- Plain text mentions of people/projects become `[[wikilinks]]`
- Recurring concepts are suggested as Glossary terms
- A summary shows: "Enriched 23 files, added 87 wikilinks, 5 new Glossary terms"

**Tips:**
- Run /weave on a small batch first (use `folder=Daily/`) to see how it works
- Check the backups at `.byoao/backups/` if you want to undo
- Re-run /weave anytime — it's idempotent (won't duplicate existing links)

---

## 2. Weekly Review — Keeping the Graph Fresh

**When:** You've been writing notes all week and want to integrate them into the graph.

**Steps:**

1. Run `/weave` to connect this week's notes
2. Run `/diagnose` to check vault health

```
/weave
/diagnose
```

**What /diagnose reports:**
- Notes without frontmatter (new, unprocessed notes)
- Orphan notes (not connected to anything)
- Broken wikilinks (links to non-existent notes)
- AGENT.md drift (references to notes that don't exist)

**Follow-up actions:**
- For orphan notes: decide if they should be connected or archived
- For broken links: create the missing note or fix the link
- For missing frontmatter: /weave will handle this on the next run

---

## 3. Tracing an Idea — How Did My Thinking Evolve?

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

## 4. Discovering Hidden Patterns — What Am I Missing?

**When:** Your vault has 50+ notes and you want to see the big picture.

**Steps:**

```
/emerge
```

**What you get:**
- **Recurring unanswered questions** — "You've asked 'what's the migration timeline?' in 4 notes but never answered it"
- **Implicit decisions** — "Notes shifted from Option A to Option B around April, but no decision record exists"
- **Forgotten threads** — "'Data mesh' appears in 6 notes between Jan-Mar but hasn't been mentioned since"
- **Cross-domain connections** — "Your 'payments' and 'auth' notes both reference 'rate limiting' but never link to each other"
- **Structural observations** — most connected note, busiest domain, potential blind spots

**When to use:**
- Monthly — as a "vault retrospective"
- When starting a new quarter — what patterns emerged?
- When feeling stuck — let the vault show you what you've been circling around

**Tips:**
- Use `scope=Projects/` to focus on a specific area
- Use `depth=deep` for thorough analysis (reads every note, takes longer)

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

## Building a Routine

Here's a rhythm that works well:

| Frequency | Action | Skill |
|-----------|--------|-------|
| Daily | Write a daily note, capture meetings and ideas | — |
| Weekly | Connect new notes, check health | `/weave` + `/diagnose` |
| When curious | Trace how a topic evolved | `/trace` |
| Monthly | Look for patterns across the vault | `/emerge` |
| As needed | Bridge two topics you're working on | `/connect` |

The goal is not to run every skill every day. Write freely, weave weekly, think monthly.

---

**← Previous:** [Core Concepts](core-concepts.md) | **Next:** [Skills Reference](skills-reference.md) →
