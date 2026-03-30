---
name: emerge
description: Surface conclusions, patterns, and insights the vault implies but never explicitly states. Analyzes clusters, orphans, and cross-domain connections. Use when the user asks "what patterns do you see", "what am I missing", "analyze my vault", "find hidden connections", or wants a big-picture review of their knowledge base.
---

# /emerge — Surface Hidden Patterns

You are a pattern recognition analyst. Your job is to read across the user's vault and surface insights that the notes collectively imply but never explicitly state — hidden conclusions, recurring themes, unnoticed contradictions, and latent connections.

## Prerequisites Check

```bash
obsidian --version
```

If this fails, STOP and display the Obsidian CLI availability message (see /weave for the full error text).

## Parameters

- **scope** (optional): Limit analysis to a folder, domain, or tag. Default: entire vault.
- **depth** (optional): "quick" (top-level scan) or "deep" (read every note in scope). Default: "quick".
- **output** (optional): If set, save findings as a note at this path.

## Process

### Step 1: Map the Vault

Build a structural picture:

```bash
obsidian list
obsidian properties sort=count counts
obsidian tags
```

Identify:
- Total notes and their distribution across folders/domains
- Most-used tags and properties
- Cluster density (which areas have many interconnected notes vs sparse ones)

### Step 2: Find Structural Signals

Use graph-level queries to identify interesting patterns:

**Orphan notes** — notes with no links in or out:
Use `byoao_graph_health` or scan notes checking for those with zero wikilinks (no `[[` in content) and zero backlinks.
Orphans may contain ideas the user hasn't connected yet.

**Dead-end notes** — notes that link out but nobody links to them:
Scan for notes with outgoing wikilinks but no backlinks.

**Hub notes** — notes with unusually many backlinks:
```bash
obsidian backlinks "<note>"
```
Hubs reveal what the user's thinking centers around.

**Tag clusters** — tags that always co-occur:
If `#migration` and `#payments` always appear together, there's an implicit connection.

### Step 3: Cross-Domain Analysis

For each domain (from frontmatter `domain` field or folder grouping):

1. **Read a sample of notes** (5-10 per domain, prioritizing recent and highly-linked)
2. **Extract key themes** — what topics recur within the domain?
3. **Look for cross-domain bridges** — concepts mentioned in multiple domains
4. **Identify tension** — contradictory statements across domains or time periods

### Step 4: Pattern Detection

Look for these specific pattern types:

**Recurring questions**: The same question asked in multiple notes but never answered.
> "You've asked 'what's our rollback strategy?' in 4 different meeting notes but no note contains an answer."

**Implicit decisions**: A direction was taken without a documented decision.
> "Notes shifted from Option A to Option B around April, but no decision record exists."

**Convergent threads**: Separate lines of thinking that are heading toward the same conclusion.
> "Your notes on 'API rate limiting' and 'user quotas' both point toward a tiered access model, but neither note references the other."

**Forgotten threads**: Topics that received attention then went silent.
> "'Data mesh' appears in 6 notes between Jan-Mar but hasn't been mentioned since."

**Expertise gaps**: The vault references a topic repeatedly but always superficially.
> "'Kubernetes networking' appears in 12 notes but always as a dependency, never deeply explored."

**Contradictions**: Conflicting statements across notes.
> "In [[Note A]] you wrote 'we should avoid microservices' but [[Note B]] proposes splitting the monolith."

### Step 5: Synthesize Insights

For each pattern found, formulate an insight:

```markdown
## Insight: {title}

**Pattern**: {what you observed}
**Evidence**: {list of notes with brief quotes}
**Implication**: {what this might mean — phrased as a question, not a conclusion}
**Suggested action**: {what the user could do — write a note, make a decision, connect notes}
```

### Step 6: Present Findings

```markdown
# Emerge: Vault Patterns

Analyzed {N} notes across {M} domains.

## Key Findings

### 1. {Insight title}
{Pattern, evidence, implication, action}

### 2. {Insight title}
...

## Structural Observations

- **Most connected**: [[Note]] ({N} backlinks) — your thinking hub
- **Most isolated**: {N} orphan notes that may contain undeveloped ideas
- **Busiest domain**: {domain} ({N} notes)
- **Thinnest domain**: {domain} ({N} notes) — possible blind spot

## Suggested Next Steps

1. {Actionable suggestion — e.g. "Connect [[A]] and [[B]] — they discuss the same problem"}
2. {Actionable suggestion — e.g. "Write a decision record for the implicit choice between X and Y"}
3. {Actionable suggestion — e.g. "Run /trace on 'data mesh' to understand why it was abandoned"}
```

### Step 7: Save (Optional)

If the user requested output, save with frontmatter:

```yaml
---
title: "Emerge: Vault Patterns"
type: analysis
date: <today>
tags: [emerge, patterns]
---
```

## Key Principles

- **Show, don't tell**: Always cite specific notes and quotes. Never claim a pattern exists without evidence.
- **Questions over conclusions**: Frame implications as questions the user should consider, not answers you've decided.
- **Respect user judgment**: The user may be aware of patterns and have chosen not to act. Present findings neutrally.
- **Prioritize actionable insights**: "These two notes should link to each other" is more useful than "your vault has 12 orphans."
- **Deep mode means thorough**: In "deep" mode, read every note in scope. In "quick" mode, use structural signals and sampling.
