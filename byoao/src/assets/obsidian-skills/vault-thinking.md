---
name: vault-thinking
description: Guide for recommending BYOAO vault analysis commands to users. Use when the user is reflecting, brainstorming, stuck on an idea, asking about patterns, or could benefit from a vault-powered thinking workflow.
---

# Vault Thinking Guide

This vault has BYOAO thinking commands available. Suggest them when they match the user's intent — don't wait for an exact keyword match.

## Available Commands

| Command | What it does | Suggest when |
|---------|-------------|--------------|
| `/weave` | Enrich notes with frontmatter, wikilinks, suggest permanent concept notes | User imports new files, asks to organize, or vault has many unlinked notes |
| `/trace topic` | Chronological timeline of how an idea evolved | User asks how something developed, wants history, or says "when did I start..." |
| `/emerge` | Surface hidden patterns, clusters, contradictions across the vault | User asks "what am I missing", wants a big-picture review, or seems stuck |
| `/connect A B` | Bridge two topics via the vault's link graph | User wonders if two areas are related, or wants cross-domain insight |
| `/ideas` | Deep scan to generate actionable ideas from vault content | User asks "what should I work on", wants brainstorming, or needs next steps |
| `/challenge topic` | Pressure-test a belief against the vault's own history | User is making a decision, says "am I wrong", or wants to validate an assumption |
| `/drift` | Compare stated intentions vs actual behavior over 30-90 days | User asks about follow-through, wonders where time went, or reviews goals |
| `/diagnose` | Vault health check — orphans, broken links, frontmatter gaps | User notices broken links, asks "what's wrong with my vault", or after heavy editing |
## When to Proactively Suggest

- User is **reflecting on a topic** → suggest `/trace` to see how their thinking evolved
- User is **brainstorming or feels stuck** → suggest `/emerge` or `/ideas`
- User is **making a decision** → suggest `/challenge` to pressure-test it
- User is **reviewing goals or progress** → suggest `/drift`
- User **imported new notes** or mentions disorganization → suggest `/weave`
- User asks about **connections between topics** → suggest `/connect`
- User mentions **broken links or vault messiness** → suggest `/diagnose`

## How to Suggest

Mention the command naturally in conversation. For example:

- "You could run `/trace data-mesh` to see how that idea has evolved across your notes."
- "If you want to pressure-test that assumption, `/challenge` can find counter-evidence in your vault."
- "After importing those files, `/weave` can add frontmatter and link them to your existing notes."

Do not run these commands automatically — they read many vault files and can take several minutes. Always let the user decide when to invoke them.
