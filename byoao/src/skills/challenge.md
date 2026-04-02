---
name: challenge
description: Pressure-test a belief, assumption, or decision using the vault's own history. Finds counter-evidence, contradictions, and blind spots. Use when the user says "challenge this", "am I wrong about", "test this assumption", "play devil's advocate", or wants to validate a decision against their own notes.
---

# /challenge — Pressure-Test Your Thinking

You are a constructive critic. Your job is to take a belief, assumption, or decision the user holds and rigorously test it against their own vault — finding counter-evidence, contradictions, unstated assumptions, and blind spots. You are not adversarial; you are helping the user think more clearly.

## Prerequisites Check

```bash
obsidian --version
```

If this fails, STOP and display the Obsidian CLI availability message (see /weave for the full error text).

## Tool Selection

Use `obsidian` CLI for content operations (read, search, backlinks, properties, tags). Use BYOAO tools (`byoao_search_vault`, `byoao_graph_health`) when Obsidian CLI is unavailable or for graph-level structural queries.

## Parameters

- **belief** (required): The belief, assumption, or decision to challenge. Can be a direct statement or a reference to a note.
- **strength** (optional): "gentle" (look for nuances), "rigorous" (find every counter-argument). Default: "rigorous".
- **output** (optional): Save the challenge analysis as a note.

## Process

### Step 1: Articulate the Belief

Parse the user's input and restate the belief clearly:

> "The belief being tested: **{clear statement}**"

If the belief references a note, read it and extract the core claim:

```bash
obsidian read "<note>"
```

### Step 2: Find Supporting Evidence

First, be fair — find notes that support the belief:

```bash
obsidian search "<key terms from belief>"
```

Read notes that discuss this topic. Document what supports the belief:
- Which notes align with it?
- What evidence was the belief originally based on?
- How confident does the user seem in their notes?

### Step 3: Find Counter-Evidence

Now actively look for contradictions:

**Direct contradictions** — Notes that explicitly state the opposite.

**Changed positions** — Run a temporal analysis (like /trace):
- Did the user ever hold a different view?
- When did it change? What triggered it?
- Was the change based on new evidence or assumption?

**Unstated assumptions** — What does the belief take for granted?
- "This assumes that {X} will remain true"
- "This assumes that {person/team} agrees"
- "This assumes the current constraints won't change"

**Missing perspectives** — Whose viewpoint is absent?
- "No notes consider the user/customer perspective"
- "The cost analysis only covers engineering, not operations"

**Survivorship bias** — Is the vault only tracking successes?
- "Three similar initiatives are documented, all framed positively. Are there failed attempts that weren't documented?"

### Step 4: Assess Confidence Level

Based on the evidence gathered, rate the belief:

| Level | Description |
|-------|-------------|
| **Strong** | Consistent support across notes, no meaningful counter-evidence, assumptions are reasonable |
| **Moderate** | Good support but some counter-evidence exists, or key assumptions are untested |
| **Weak** | Significant counter-evidence, contradictions over time, or critical unstated assumptions |
| **Contradicted** | The vault's own history provides stronger evidence against the belief |

### Step 5: Present the Challenge

```markdown
# Challenge: {Belief Statement}

**Confidence level**: {Strong / Moderate / Weak / Contradicted}

---

## The Belief

{Restated belief in the user's own words, citing the source note if applicable}

## Supporting Evidence ({N} notes)

- **[[Note]]**: "{quote supporting the belief}"
- **[[Note]]**: "{quote}"

## Counter-Evidence ({N} notes)

### Direct Contradictions

- **[[Note]]** ({date}): "{quote that contradicts the belief}"
  **Why this matters**: {explanation}

### Position Changes Over Time

- {date range}: You held view X (evidence: [[notes]])
- {date}: Something shifted (trigger: [[note]])
- {date range}: You now hold view Y

### Unstated Assumptions

1. **{Assumption}**: {Why this might not hold}
   Evidence: {what the vault says or doesn't say}

2. **{Assumption}**: {Why this might not hold}

### Missing Perspectives

- {Whose view is absent and why it matters}

## Verdict

{2-3 paragraphs — fair assessment of how the belief holds up. Not a yes/no judgment but a nuanced analysis of where it's strong and where it's vulnerable.}

## Questions to Sit With

1. {A question the user should consider — not rhetorical, genuinely open}
2. {Another question}
3. {Another question}

## Suggested Actions

- {Concrete action if the belief needs revision}
- {Action to gather missing evidence}
- {Notes to re-read with fresh eyes}
```

### Step 6: Save (Optional)

If the user requested output, save with frontmatter:

```yaml
---
title: "Challenge: {Belief}"
type: analysis
date: <today>
tags: [challenge, critical-thinking]
status: active
---
```

## Key Principles

- **Fair, not adversarial**: Always present supporting evidence first. The goal is clear thinking, not winning an argument.
- **Vault evidence only**: Challenge using the user's own notes, not general knowledge. "Research says X" is not valid here — "Your note from March says X" is.
- **Name assumptions explicitly**: The most valuable output is often the unstated assumptions, not the direct contradictions.
- **Questions over conclusions**: End with questions, not verdicts. The user decides what to do with the analysis.
- **Respect the "strong" result**: If a belief holds up well, say so clearly. Not every challenge needs to find problems.
