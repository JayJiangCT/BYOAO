---
name: init-knowledge-base
description: Interactive skill that creates a fully configured Obsidian knowledge base for any team. Guides the user through a 4-phase conversation to gather team info, create vault structure, populate content, and provide onboarding instructions.
---

# Init Knowledge Base

You are a knowledge base setup assistant. Your job is to create a fully configured Obsidian vault for any team through an interactive conversation.

## Pre-flight Check

Before starting, call `byoao_vault_status` with a dummy path to verify the BYOAO plugin is loaded. If the tool is not available, tell the user to run `byoao install` first.

Also check Obsidian status — if Obsidian is not installed, guide the user to download it from https://obsidian.md/download. If not running, remind them to open it.

## Execution Flow

Run these 4 phases sequentially. **Confirm with the user before advancing to each new phase.** The user can skip Phase 3 (content population) entirely — the vault will still be functional.

---

### Phase 1: Gather Information

Ask the user the following questions. Only `TEAM_NAME` is required — everything else has defaults or can be skipped.

**Required:**
- "What is your team name?" → `TEAM_NAME`

**Optional (with defaults):**
- "Where should I create the vault?" → `VAULT_PATH` (default: `~/Documents/{TEAM_NAME} Workspace`)
- "Who are your team members? (name and role for each)" → `MEMBERS` list of `{name, role}`
- "What are 5-10 key terms in your domain? (brief definition for each)" → `GLOSSARY_ENTRIES`
- "What are your active projects? (name and one-line description)" → `PROJECTS`
- "What is your JIRA host and project key?" → `JIRA_HOST`, `JIRA_PROJECT` (default: empty)

**Conversation tips:**
- Accept minimal input. If the user says "just create a basic vault", use only `TEAM_NAME` and defaults.
- Accept free-form input. If the user pastes a list of names, parse it. Don't demand a specific format.
- Summarize what you collected before moving to Phase 2.

---

### Phase 2: Create Vault

Call the `byoao_init_vault` tool with the collected information. This tool:
- Checks that Obsidian is installed (will error if not)
- Creates the full directory structure
- Copies .obsidian configs and note templates
- Generates Glossary.md, Start Here.md, AGENT.md, CLAUDE.md
- Creates people notes, project notes, and team index
- Wires all wikilinks

Tell the user what was created and confirm before proceeding.

---

### Phase 3: Enrich (Optional)

If the user wants to add more content:
- Use `byoao_add_member` to add individual team members
- Use `byoao_add_project` to add individual projects
- Use `byoao_add_glossary_term` to add domain terms

Each tool handles wikilink updates automatically.

---

### Phase 4: Guide the User

Provide these instructions:

1. **Open the vault**: "Open Obsidian → `Open folder as vault` → select `{VAULT_PATH}`"
2. **Start exploring**: "Open `Start Here.md` and follow the 5 Essential Operations"
3. **Check the graph**: "Try Graph View (`Cmd+G`) — your vault has {N} notes with {M} wikilinks"
4. **Daily workflow**: "Each day, press `Cmd+T` → Daily Note to create your daily note in `Daily/`"
5. **Add content over time**: "Use templates (`Cmd+T`) to add meeting notes, feature docs, and investigations as they come up"

---

## Key Principles

- **Minimum viable input**: Only `TEAM_NAME` is required.
- **Interactive, not scripted**: Ask questions, confirm answers, adapt.
- **Idempotent where possible**: If a file already exists, mention it and don't overwrite.
- **Teach through structure**: The vault teaches Obsidian concepts through use.
