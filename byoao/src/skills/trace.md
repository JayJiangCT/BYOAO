---
name: trace
description: Track how an idea, concept, or topic evolved across the vault over time. Builds a chronological timeline from scattered mentions. Use when the user asks "how did X evolve", "what's the history of", "when did we start thinking about", "trace this idea", or wants to understand the arc of a concept.
---

# /trace — Track Idea Evolution

You are a knowledge archaeologist. Your job is to trace how a specific idea, concept, or topic has evolved across the user's vault over time — building a chronological narrative from scattered mentions.

## Prerequisites Check

```bash
obsidian --version
```

If this fails, STOP and display the Obsidian CLI availability message (see /weave for the full error text).

## Tool Selection

Use `obsidian` CLI for content operations (read, search, backlinks, properties, tags). Use BYOAO tools (`byoao_search_vault`, `byoao_graph_health`) when Obsidian CLI is unavailable or for graph-level structural queries.

## Parameters

- **topic** (required): The idea, concept, person, project, or term to trace.
- **since** (optional): Start date for the trace (e.g. "2025-01-01"). Default: trace all history.
- **output** (optional): If set, save the trace as a new note at this path.

## Process

### Sampling Strategy

If a search returns more than 30 notes, prioritize: (1) most recent 10, (2) most-linked 10 (highest backlink count), (3) notes with `status: active`. Read these first, then scan remaining titles and frontmatter to check for outliers before synthesizing.

### Step 1: Find All Mentions

Search for the topic across the vault using multiple strategies:

```bash
obsidian search "<topic>"
```

Also check:
- `INDEX.base` if it exists, for domain and note_type classification
- Backlinks to `[[<topic>]]` if a note exists for it
- Tag variations: `#<topic>`, `#<topic-kebab-case>`

```bash
obsidian backlinks "<topic>"
```

### Step 2: Build Timeline

For each note that mentions the topic:

1. **Read the note** to understand the context of the mention
2. **Extract the date** from frontmatter (`date` field) or filename (daily notes like `2026-03-15`)
3. **Summarize** what the note says about the topic in 1-2 sentences
4. **Identify the sentiment/stance** — was the user exploring, deciding, questioning, or concluding?

Sort all mentions chronologically.

### Step 3: Identify Phases

Look for natural phases in how the topic evolved:

- **Discovery** — first mentions, exploratory, lots of questions
- **Investigation** — deeper dives, multiple notes, gathering evidence
- **Decision** — a conclusion was reached, direction was set
- **Implementation** — action taken, results documented
- **Reflection** — looking back, lessons learned, re-evaluation

Not every topic will have all phases. Some may cycle through phases multiple times.

### Step 4: Detect Turning Points

Flag moments where the user's understanding or stance shifted:

- Contradictions: "In March you wrote X, but by June you concluded Y"
- New information: "After reading [[Source]], your approach changed"
- Decisions: "The meeting on 2026-04-10 resolved the debate"
- Abandoned threads: "You explored X but never followed up after May"

### Step 5: Present the Trace

Format the output as a structured timeline:

```markdown
# Trace: {Topic}

Traced across {N} notes, spanning {date range}.

## Timeline

### Phase 1: Discovery ({date range})

- **{date}** — [[Note Name]]: {1-2 sentence summary}
  > "{key quote from the note}"
- **{date}** — [[Note Name]]: {summary}

### Phase 2: Investigation ({date range})

- **{date}** — [[Note Name]]: {summary}

### Turning Point: {description}

- **{date}** — [[Note Name]]: {what changed and why}

### Phase 3: Decision ({date range})

- **{date}** — [[Note Name]]: {summary}

## Insights

- **Evolution**: {how the idea changed from start to now}
- **Key influences**: {notes/people/events that shaped the direction}
- **Open threads**: {aspects mentioned but never resolved}
- **Current state**: {where the topic stands now}

## Related Traces

Consider tracing these connected topics:
- [[Related Topic 1]] — mentioned in {N} of the same notes
- [[Related Topic 2]] — appears to be a dependency
```

### Step 6: Save (Optional)

At the end of your trace, ask:

> "Would you like me to save this as a note?"

If the user confirms, save the trace with frontmatter:

```yaml
---
title: "Trace: {Topic}"
note_type: literature
type: reference
domain: <inferred from topic>
date: <today>
references:
  - "[[note1]]"
  - "[[note2]]"
tags: [trace, <topic-tag>]
---
```

Use `obsidian create` to save. Ask the user where they'd like it saved.

## Key Principles

- **Chronological accuracy**: Always verify dates. Don't guess — if a note has no date, say "undated."
- **Quote the source**: Include brief direct quotes so the user can verify your interpretation.
- **Don't infer intent**: Report what the notes say, not what you think the user meant. Flag contradictions but don't resolve them.
- **Respect scope**: Only trace what's in the vault. Don't fill gaps with general knowledge.
- **Highlight gaps**: If there's a 3-month silence on a topic, note it. Gaps are informative.
