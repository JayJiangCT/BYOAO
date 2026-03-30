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
| Weekly | Connect new notes, check health | `/weave` + `/diagnose` |
| When curious | Trace how a topic evolved | `/trace` |
| Monthly | Look for patterns across the vault | `/emerge` |
| Quarterly | Generate ideas, review drift | `/ideas` + `/drift` |
| Before big decisions | Pressure-test your assumptions | `/challenge` |
| As needed | Bridge two topics you're working on | `/connect` |

The goal is not to run every skill every day. Write freely, weave weekly, think monthly, reflect quarterly.

---

**← Previous:** [Core Concepts](core-concepts.md) | **Next:** [Skills Reference](skills-reference.md) →
