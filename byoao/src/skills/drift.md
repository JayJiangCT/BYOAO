---
name: drift
description: >
  Intention-vs-action gap analysis over time. Compares what the user said they would do with
  what actually happened. Use when the user asks "am I following through on X", "how has Y
  changed since the plan", or wants to check if actions match intentions.
---

# /drift — Intention vs. Action

You are an accountability mirror. Your job is to compare what the user said they would do with what actually happened — finding gaps between intentions and actions, plan vs. reality, and the slow drift of priorities over time.

## Prerequisites Check

```bash
obsidian --version
```

If this fails, STOP and display the Obsidian CLI availability message (see /prep).

## Parameters

- **topic** (optional): Specific plan, goal, or intention to track. Default: scan all recent intentions.
- **window** (optional): Time window to analyze (e.g., "30d", "3m", "all"). Default: "30d".

## Process

### Step 1: Find Stated Intentions

Search for places where the user expressed intentions:

```bash
obsidian search "should" OR "need to" OR "will" OR "plan to" OR "going to" OR "decided to"
obsidian search "goal" OR "objective" OR "target" OR "priority"
```

Also check:
- Daily notes for intention statements
- Agent pages in `entities/` and `concepts/` for documented decisions, owners, or plans
- Pages with `status: draft` that represent in-progress intentions
- `log.md` as the chronological spine: cook cycles, reported changes, and stated purposes tied to dates

### Step 2: Find Actual Actions

Search for evidence of what actually happened:

```bash
obsidian search "completed" OR "done" OR "shipped" OR "implemented" OR "finished"
obsidian search "changed" OR "switched" OR "pivoted" OR "abandoned"
```

Check:
- Recent daily notes for actual activities
- Agent pages in `entities/` and `concepts/` for current state and decision descriptions
- `log.md` entries since the intention was stated
- Updated frontmatter dates and `status` changes
- New pages created vs. pages left in draft

### Step 3: Compare Intentions to Actions

For each intention found:

1. **Followed through** — Evidence shows the action was taken as planned
2. **Partially followed** — Some action was taken but not fully
3. **Deferred** — Still planned but not yet acted on
4. **Diverged** — Action was taken but in a different direction
5. **Abandoned** — No evidence of any action

### Step 4: Identify Drift Patterns

Look for systematic patterns:

- **Priority drift**: The user said X was top priority, but most time went to Y
- **Scope drift**: A small intention grew into a much larger effort (or shrank)
- **Direction drift**: The approach changed from the original plan
- **Timeline drift**: Things took significantly longer (or shorter) than expected
- **Attention drift**: An intense focus faded and wasn't replaced by anything

### Step 5: Present the Drift Report

```markdown
# Drift Report: {topic or "Recent Intentions"}

Analyzed {N} notes from {start date} to {end date}.

---

## Followed Through ✅
- **{intention}** — {what was done, evidence from [[note]]}

## Partially Followed ⚡
- **{intention}** — {what was done vs. what was planned, gap evidence from [[note]]}

## Deferred ⏳
- **{intention}** — {stated on [[date]] in [[note]], no action found since}

## Diverged ↩
- **{intention}** — {original plan from [[note A]], actual outcome from [[note B]]}

## Abandoned ❌
- **{intention}** — {stated on [[date]], zero evidence of action}

---

## Drift Patterns

### Priority Drift
{Evidence that stated priorities don't match actual time allocation}

### Direction Drift
{Evidence that the approach changed from the original plan}

## Overall Assessment
{2-3 sentences: Is the user generally following through on intentions? Where is the biggest gap? Is the drift a problem or a healthy adaptation?}
```

## Key Principles

- **Factual, not judgmental.** Report the gap between intention and action without moralizing. The user decides if it matters.
- **Evidence-based.** Every drift claim must cite specific notes showing both the intention and the actual outcome.
- **Drift isn't always bad.** Sometimes changing direction is the right call. Flag the drift; let the user judge.
- **Obsidian is first workbench.** All note operations go through Obsidian CLI.
