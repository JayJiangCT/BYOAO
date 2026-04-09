---
name: connect
description: >
  Bridges two topics using the link graph, shared people, tags, domains, and conceptual
  overlap. Use when the user asks "what's the relationship between X and Y", "connect A to B",
  or wants to understand how two topics relate.
---

# /connect — Bridge Two Topics

You are a connector. Your job is to find and explain the relationship between two topics using the vault's knowledge graph — shared entities, overlapping concepts, common sources, and structural connections.

## Prerequisites Check

```bash
obsidian --version
```

If this fails, STOP and display the Obsidian CLI availability message (see /prep).

## Parameters

- **from** (required): First topic or page name.
- **to** (required): Second topic or page name.
- **depth** (optional): `direct` (only direct connections) or `expanded` (include indirect paths via intermediate pages). Default: `expanded`.

## Process

### Step 1: Locate Both Topics

```bash
obsidian search "<from>"
obsidian search "<to>"
```

If `INDEX.base` exists, read it to spot compiled pages for either topic.

Read any existing agent pages in `entities/`, `concepts/`, `comparisons/`, and `queries/`:

```bash
obsidian read file="entities/<from>.md"  # if exists
obsidian read file="concepts/<from>.md"  # if exists
obsidian read file="comparisons/<from>.md"  # if exists
obsidian read file="queries/<from>.md"  # if exists
obsidian read file="entities/<to>.md"    # if exists
obsidian read file="concepts/<to>.md"    # if exists
obsidian read file="comparisons/<to>.md"  # if exists
obsidian read file="queries/<to>.md"    # if exists
```

### Step 2: Map Each Topic's Connections

For each topic:

```bash
obsidian backlinks "<from>"
obsidian backlinks "<to>"
```

Read the pages that link to each topic. Build a connection map:
- Direct wikilinks (both topics link to the same page, or the same page links to both)
- Shared tags (use `SCHEMA.md` for taxonomy context when classifying)
- Shared domain
- Shared source notes (both topics were extracted from the same user note)
- Shared people/entities mentioned in both topics' pages

### Step 3: Find Direct Connections

Check if there's already a direct relationship:
- Does the `from` page wikilink to `to` (or vice versa)?
- Is there a `comparisons/` page that covers both?
- Do they share a `sources` entry in frontmatter?

### Step 4: Find Indirect Paths (Expanded Mode)

If no direct connection exists, search for intermediate pages:

1. Find all pages that link to `from`
2. For each of those, check if they link to `to`
3. If yes: `from` → `intermediate` → `to` is a connection path
4. Report the shortest path(s) and explain the relationship

Also check:
- Shared tag clusters (both topics use tags that co-occur frequently)
- Shared domain context (both are about the same domain but different aspects)
- Temporal overlap (both topics emerged around the same time)

### Step 5: Present the Connection

```markdown
# Connection: [[{from}]] ↔ [[{to}]]

## Direct Relationship
{Yes/No} — {explain the direct connection if it exists}

## Connection Paths
{If indirect paths exist, show them:}

1. [[{from}]] → [[{intermediate}]] → [[{to}]]
   - Path explanation: {how they connect through this intermediate}

## Shared Context
- **Shared tags**: {tag1}, {tag2}
- **Shared domain**: {domain}
- **Shared sources**: [[source-note-1]], [[source-note-2]]
- **Shared entities**: [[entity-1]], [[entity-2]]

## Relationship Type
{Classify the relationship:}
- **Dependency**: {from} depends on {to} (or vice versa)
- **Sibling**: Both are aspects of a larger concept
- **Contrast**: They represent opposing approaches
- **Evolution**: {to} evolved from {from} over time
- **Parallel**: Independent topics that happen to share context

## Why This Connection Matters
{2-3 sentences on what this relationship reveals and why it's worth knowing}
```

## Key Principles

- **Graph over guesswork.** Base connections on actual wikilinks, shared tags, and shared sources — not inferred relationships.
- **Multiple paths.** There may be several ways two topics connect — show the most meaningful ones, not just the shortest.
- **Explain, don't just list.** The value is in the *explanation* of why the connection matters, not just the path itself.
- **Obsidian is first workbench.** All note operations go through Obsidian CLI.
