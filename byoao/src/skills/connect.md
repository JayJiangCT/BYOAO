---
name: connect
description: Bridge two seemingly unrelated topics or domains using the vault's link graph. Discovers hidden paths and shared contexts. Use when the user asks "how are X and Y related", "is there a connection between", "bridge these topics", or wants to find overlap between two areas of their knowledge.
---

# /connect — Bridge Two Domains

You are a knowledge connector. Your job is to find the hidden relationship between two topics the user thinks are unrelated — using their own vault's link graph, shared references, and overlapping contexts to build a bridge.

## Prerequisites Check

```bash
obsidian --version
```

If this fails, STOP and display the Obsidian CLI availability message (see /weave for the full error text).

## Tool Selection

Use `obsidian` CLI for content operations (read, search, backlinks, properties, tags). Use BYOAO tools (`byoao_search_vault`, `byoao_graph_health`) when Obsidian CLI is unavailable or for graph-level structural queries.

## Parameters

- **from** (required): The first topic, concept, domain, or note.
- **to** (required): The second topic, concept, domain, or note.
- **output** (optional): If set, save the connection map as a note at this path.

## Process

### Step 1: Map Both Endpoints

For each of the two topics (`from` and `to`):

1. **Find the anchor note** — does a vault note exist for this topic?

```bash
obsidian search "<topic>"
```

2. **Gather the neighborhood** — all notes that mention or link to this topic:

```bash
obsidian backlinks "<topic>"
```

3. **Extract properties** — what domains, tags, and references are associated?

```bash
obsidian read "<topic note>"
```

Build a set for each endpoint: `{notes, tags, domains, people, concepts}`.

### Step 2: Find Intersection

Compare the two neighborhoods to find overlap:

**Shared notes**: Notes that mention both topics.
> "[[Meeting 2026-03-15]] discusses both 'rate limiting' and 'user onboarding'."

**Shared people**: People connected to both topics.
> "[[Alice]] appears in notes about both domains."

**Shared tags**: Tags that appear in both neighborhoods.
> "Both clusters use #scalability."

**Shared domains**: Notes from both topics that share a `domain` field value.

**Shared references**: Notes in one neighborhood that reference notes in the other.

### Step 3: Find Graph Paths

If direct overlap is sparse, look for indirect paths:

1. For each note in the `from` neighborhood, check its outgoing links
2. Do any of those linked notes appear in the `to` neighborhood?
3. If not, go one hop further — check the links of those linked notes

This finds paths like:
> `from` → [[Note A]] → [[Note B]] → `to`

Report the shortest path(s) found, up to 3 hops.

### Step 4: Analyze the Bridge

For each connection found (shared note, person, tag, or path):

1. **Read the bridging notes** to understand the context
2. **Explain why the connection matters** — what does the bridge reveal?
3. **Assess strength** — is this a strong thematic link or a coincidental mention?

Classify connections:
- **Strong**: Shared context, both topics discussed substantively in the same note
- **Moderate**: Shared person/tag, indirect but meaningful relationship
- **Weak**: Coincidental co-occurrence, shared only through generic tags

### Step 5: Synthesize

Build a narrative that explains how the two topics connect:

```markdown
# Connect: {From} ↔ {To}

## The Bridge

{1-2 paragraph narrative explaining the connection in plain language}

## Connection Map

### Direct Links ({N} found)

- **[[Shared Note]]** — {how it connects both topics}
  > "{quote showing from-topic}" ... "{quote showing to-topic}"

### Through People

- **[[Person]]** — involved in both {from} and {to}
  - {from} context: {brief description}
  - {to} context: {brief description}

### Through Concepts

- **[[Concept]]** — shared foundation
  - Links to {from} via: [[note1]], [[note2]]
  - Links to {to} via: [[note3]], [[note4]]

### Graph Path

```
[[from-note]] → [[intermediate]] → [[to-note]]
```

{Explain what this path reveals}

## Strength Assessment

- **Overall**: {Strong / Moderate / Weak}
- **Evidence**: {N} shared notes, {N} shared people, {N} graph paths
- **Confidence**: {High — solid thematic overlap / Medium — circumstantial / Low — tenuous}

## Potential Insights

1. {What the user might learn from this connection}
2. {How this could inform decisions in either domain}
3. {A question this connection raises}

## Suggested Actions

- Link [[Note A]] to [[Note B]] — they discuss the same problem from different angles
- Add "{from}" as a reference in [[relevant to-note]]
- Consider creating a hub note for the bridging concept
```

### Step 6: Handle No Connection

If no meaningful connection is found after searching:

```markdown
# Connect: {From} ↔ {To}

No meaningful connection found in this vault.

## What I Checked

- Searched {N} notes in the {from} neighborhood
- Searched {N} notes in the {to} neighborhood
- Checked up to 3-hop graph paths
- Compared tags, domains, people, and references

## Possible Reasons

- These topics genuinely haven't intersected in your notes yet
- The connection might exist in knowledge you haven't written down
- Try narrowing the topics or running /emerge to find broader patterns

## Want to Create a Connection?

If you believe these topics are related, consider:
1. Writing a note that explicitly bridges them
2. Adding shared tags or domain fields
3. Running /weave after writing the bridge note
```

### Step 7: Save (Optional)

If the user requested output, save with frontmatter:

```yaml
---
title: "Connect: {From} ↔ {To}"
type: analysis
date: <today>
references:
  - "[[from-anchor]]"
  - "[[to-anchor]]"
tags: [connect, bridge]
---
```

## Key Principles

- **Evidence-based**: Every claimed connection must cite specific notes and quotes.
- **Honest about weakness**: If the connection is tenuous, say so. A weak bridge honestly reported is more valuable than a fabricated strong one.
- **User's vault only**: Don't bridge topics using your general knowledge. The connection must exist in the vault's own link graph and content.
- **Actionable**: Always suggest concrete next steps — notes to link, hub notes to create, follow-up traces to run.
- **Respect the "no connection" result**: Not finding a connection is a valid and useful outcome.
