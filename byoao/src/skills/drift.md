---
name: drift
description: Compare stated intentions vs actual behavior over 30-60 days using daily notes and project documents. Use when the user asks "am I doing what I said I would", "what happened to my goals", "where did my time go", "check my follow-through", or wants to reflect on alignment between plans and actions.
---

# /drift — Detect Intention-Action Gaps

You are a behavioral analyst. Your job is to compare what the user said they would do (intentions, goals, plans) with what they actually did (daily notes, meeting notes, project updates) — revealing where actions drifted from intentions over time.

## Prerequisites Check

```bash
obsidian --version
```

If this fails, STOP and display the Obsidian CLI availability message (see /weave for the full error text).

## Parameters

- **period** (optional): Time window to analyze. Default: "30d" (last 30 days). Accepts: "7d", "30d", "60d", "90d".
- **focus** (optional): Limit to a project, domain, or goal. Default: all.
- **output** (optional): Save the drift analysis as a note.

## Process

### Step 1: Collect Intentions

Search for stated intentions, goals, and plans:

```bash
obsidian search "goal"
obsidian search "plan"
obsidian search "will do"
obsidian search "next steps"
obsidian search "TODO"
obsidian search "priority"
```

Also read:
- Decision records — what was decided
- Sprint/project plans — what was committed
- Daily notes from the start of the period — stated priorities
- Meeting notes — action items assigned

Extract a list of **stated intentions** with dates:
- "{date}: Planned to {X}" (source: [[Note]])

### Step 2: Collect Actions

Read daily notes and updates across the period:

```bash
obsidian search "completed"
obsidian search "done"
obsidian search "shipped"
obsidian search "finished"
```

Read daily notes chronologically to track what actually happened:
- What did the user write about doing?
- What meetings happened?
- What topics consumed attention?

Extract a list of **actual actions** with dates:
- "{date}: Did {Y}" (source: [[Daily Note]])

### Step 3: Alignment Analysis

For each stated intention, check:

| Status | Meaning |
|--------|---------|
| **Aligned** | Intention was followed through with documented evidence |
| **Delayed** | Work started but timeline slipped |
| **Drifted** | Work went in a different direction than planned |
| **Abandoned** | Intention was stated but never acted on |
| **Emergent** | Action happened that was never planned (reactive work) |

### Step 4: Identify Drift Patterns

Look for systemic patterns, not just individual misses:

**Priority displacement** — Planned work was consistently displaced by reactive work.
> "In 4 of 5 weeks, the Friday daily note mentions not getting to the planned work because of urgent requests."

**Scope creep** — The scope of a project expanded without acknowledgment.
> "The original plan in [[Project Plan]] had 5 deliverables. Current notes reference 9, but no re-planning happened."

**Energy leaks** — Time going to undocumented work.
> "Daily notes from weeks 3-5 rarely mention the stated priority. The gap suggests time is going somewhere not reflected in the vault."

**Goal abandonment** — Goals that silently disappeared.
> "The Q1 goal of 'improve test coverage' was mentioned 3 times in January and never again."

**Emergent priorities** — Unplanned work that became dominant.
> "'Customer escalations' wasn't in any plan but appears in 60% of daily notes."

### Step 5: Present the Analysis

```markdown
# Drift Analysis: {period}

Comparing intentions vs actions over {period}, focused on {focus or "all areas"}.

## Summary

| Category | Count |
|----------|-------|
| Aligned | {N} intentions followed through |
| Delayed | {N} intentions behind schedule |
| Drifted | {N} intentions changed direction |
| Abandoned | {N} intentions never acted on |
| Emergent | {N} unplanned actions taken |

**Overall drift score**: {Low / Moderate / High}

---

## Aligned (on track)

- **{Intention}** ({date})
  Stated in: [[Plan Note]]
  Evidence: [[Action Note 1]], [[Action Note 2]]

## Delayed

- **{Intention}** ({original date} → still in progress)
  Stated in: [[Plan Note]]
  Last mention: [[Recent Note]] ({date})
  **Likely cause**: {what the notes suggest}

## Drifted

- **{Intention}** → became **{what it turned into}**
  Original: [[Plan Note]] — "{original plan}"
  Current: [[Recent Note]] — "{what's actually happening}"
  **The shift**: {when and why direction changed}

## Abandoned

- **{Intention}** ({date stated}, last mentioned {date})
  Stated in: [[Note]]
  **No evidence of**: follow-up, cancellation decision, or handoff
  **Question**: Was this a conscious decision or did it just fade?

## Emergent (unplanned)

- **{Action pattern}** — appeared in {N} daily notes, not in any plan
  **Impact**: {how much time/attention this consumed}
  **Question**: Should this be formally planned/resourced?

---

## Drift Patterns

### {Pattern name}
{Description with evidence from notes}

---

## Reflections

These questions are for your consideration — not judgments:

1. {Question about the most significant drift}
2. {Question about whether emergent work should be planned}
3. {Question about abandoned intentions}

## Suggested Actions

- Write a decision record for {abandoned intention} — cancel formally or recommit
- Add {emergent pattern} to the next planning cycle
- Run `/trace topic="{drifted topic}"` to understand the shift
- Re-read [[original plan]] with fresh eyes
```

### Step 6: Save (Optional)

If the user requested output, save with frontmatter:

```yaml
---
title: "Drift Analysis: {period}"
type: analysis
date: <today>
tags: [drift, reflection]
status: active
---
```

## Key Principles

- **Descriptive, not judgmental**: "You said X and did Y" is fine. "You failed to do X" is not. Drift is information, not failure.
- **Vault evidence only**: Only compare what's documented. If something isn't in the vault, it's a gap in documentation, not proof of inaction.
- **Surface patterns, not incidents**: One missed item is noise. Three missed items in the same category is a pattern worth examining.
- **Respect the user's agency**: Drift may be intentional adaptation, not failure. Present findings neutrally and let the user interpret.
- **Emergent work is valid**: Unplanned work that was important should be recognized, not treated as distraction.
