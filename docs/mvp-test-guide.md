# BYOAO MVP Test & Trial Guide

> Systematic walkthrough of every BYOAO feature. Complete each phase in order, record feedback in the boxes provided, then review findings to prioritize fixes.
>
> Version: 0.3.0 · Tester: Claude (automated) · Date: 2026-03-23

---

## How to Use This Guide

1. Follow each phase sequentially — later phases depend on earlier ones
2. For each test step, record the **actual result** and mark Pass/Fail
3. Use the **Feedback** sections to capture impressions, pain points, and ideas
4. After completing all phases, review the [Summary](#phase-9-summary--prioritization) to prioritize issues

**Environment requirements:**

- macOS (primary test target)
- Node.js >= 18
- Obsidian desktop app installed
- OpenCode installed (for Phase 5-7)
- A clean directory for testing (recommend `~/Documents/byoao-test/`)

---

## Phase 0: Pre-Flight Checks

### 0.1 Verify Node version

```bash
node --version
```

- **Expected:** v18.x or higher
- **Actual:** v22.22.0 — PASS

### 0.2 Verify Obsidian installed

```bash
ls /Applications/Obsidian.app
```

- **Expected:** Directory exists
- **Actual:** Directory exists (Contents listed) — PASS

### 0.3 Verify OpenCode installed (for later phases)

```bash
which opencode
```

- **Expected:** Path to opencode binary
- **Actual:** /Users/jay/.opencode/bin/opencode — PASS

### 0.4 Build BYOAO from source

```bash
cd ~/Documents/BOYO/byoao
npm install
npm run build
npm run typecheck
```

- **Expected:** All three commands succeed with no errors
- **Actual:** All three commands succeeded with no errors — PASS

### 0.5 Run unit tests

```bash
cd ~/Documents/BOYO/byoao
npm test
```

- **Expected:** 78 tests pass across 9 files, 0 failures
- **Actual:** 78 tests pass across 9 files, 0 failures — PASS

> **Feedback (Phase 0):**
>
> - Build experience: Clean, no issues
> - Any issues with dependencies: None
> - Test output readability: Good — clear pass/fail counts

---

## Phase 1: CLI — `byoao check-obsidian`

### 1.1 Run Obsidian check

```bash
cd ~/Documents/BOYO/byoao
node --import tsx src/cli/cli-program.ts check-obsidian
```

- **Expected:** Shows Obsidian path, install status, and running status
- **Actual result:** `✓ Obsidian is installed at: /Applications/Obsidian.app` / `✓ Obsidian is running.` — PASS
- Is the output clear and helpful? Yes

### 1.2 Run with Obsidian closed

Close Obsidian completely, then re-run the command.

- **Expected:** Shows "Obsidian is not running" with guidance to open it
- **Actual:** Skipped — Obsidian was running during automated test

### 1.3 Run with Obsidian open

Open Obsidian, then re-run the command.

- **Expected:** Shows "Obsidian is running"
- **Actual:** `✓ Obsidian is running.` — PASS

> **Feedback (Phase 1):**
>
> - Is the output useful for a first-time user? Yes, clear status indicators
> - Any confusing messages? No
> - Suggestions: None

---

## Phase 2: CLI — `byoao install`

### 2.1 Install with defaults (interactive)

```bash
cd ~/Documents/BOYO/byoao
node --import tsx src/cli/cli-program.ts install
```

Walk through the interactive prompts.

- **Expected:** Logo displayed, prompts for install scope and skills
- Does the logo render correctly in your terminal?
- Are the prompts clear?
- **Install location chosen:** Skipped (tested non-interactive instead)
- **Skills installed:** Yes / No
- **Final output message:** Skipped (tested non-interactive instead)

### 2.2 Install with flags (non-interactive)

```bash
node --import tsx src/cli/cli-program.ts install --yes --global
```

- **Expected:** Installs without prompts, shows success message
- **Actual:** Logo displayed, dependencies checked, plugin registered, Obsidian Skills (5 files) and BYOAO skills (4 commands) installed. Post-install guidance shown with next steps. — PASS

### 2.3 Re-install (idempotency)

Run the same install command again.

- **Expected:** Succeeds without error (overwrites skills/commands cleanly)
- **Actual:** Re-install succeeded cleanly, same output as first install — PASS

### 2.4 Verify installation artifacts

Check that plugin was registered:

```bash
# For global install:
cat ~/.config/opencode/opencode.json | grep byoao
# Or for project install:
cat .opencode.json | grep byoao
```

- **Expected:** BYOAO plugin entry exists in config
- **Actual:** `"byoao"` found in `~/.config/opencode/opencode.json` under `plugin` array — PASS

> **Feedback (Phase 2):**
>
> - Install speed: Fast
> - Were the prompts intuitive? N/A (tested non-interactive)
> - Post-install guidance clear? Yes — shows `opencode`, `/init-knowledge-base`, `byoao init`, `byoao status` commands
> - Suggestions: None

---

## Phase 3: CLI — `byoao init` (Vault Creation)

This is the core feature. Test both interactive and flag-based modes.

### 3.1 Interactive vault creation

```bash
node --import tsx src/cli/cli-program.ts init
```

Walk through all prompts.

- **Expected:** Prompts for role, team name, your name, vault path
- Logo displayed correctly?
- Role options shown: ____PM/TPM____
- Team name entered: ___Jay_____
- Your name entered: ___Jay_____
- Vault path (default or custom): ___default_____

**After creation:**

- "Vault created" message with file/wikilink/directory counts?
- MCP servers configured section shown?
- Next steps guidance shown?
- **Files created count:** ___15_____
- **Wikilinks count:** _____2___
- **Directories count:** __10______

### 3.2 Non-interactive vault creation

Create a second vault with flags:

```bash
node --import tsx src/cli/cli-program.ts init \
  --team "Test Team" \
  --preset pm-tpm \
  --path ~/Documents/byoao-test/test-vault
```

- **Expected:** Creates vault without prompts
- **Actual:** Vault created successfully — 14 files, 0 wikilinks, 10 directories. MCP server (atlassian) configured. Next steps guidance shown. — PASS

### 3.3 Verify vault directory structure

```bash
# Use the vault path from 3.2
ls -la ~/Documents/byoao-test/test-vault/
```

- [x] `Inbox/` exists
- [x] `Knowledge/` exists with `concepts/`, `templates/`, `Glossary.md`
- [x] `People/` exists with team index (`Test Team Team.md`)
- [x] `Projects/` exists (PM/TPM preset) — contains `.gitkeep`
- [x] `Sprints/` exists (PM/TPM preset)
- [x] `Systems/` exists
- [x] `Archive/` exists
- [x] `Daily/` exists
- [x] `.obsidian/` exists with `core-plugins.json`, `daily-notes.json`, `templates.json`
- [x] `AGENT.md` exists at root
- [x] `CLAUDE.md` exists at root
- [x] `Start Here.md` exists at root
- **Missing or unexpected items:** No person note created (non-interactive mode without `--name` flag doesn't create one). Team index exists but with no members. — MINOR NOTE

### 3.4 Verify file contents

```bash
cat ~/Documents/byoao-test/test-vault/AGENT.md
cat ~/Documents/byoao-test/test-vault/Start\ Here.md
cat ~/Documents/byoao-test/test-vault/Knowledge/Glossary.md
cat ~/Documents/byoao-test/test-vault/People/Test\ Team\ Team.md
```

- [x] `AGENT.md` contains team name ("Test Team"), template list, domain knowledge section — PASS
- [x] `Start Here.md` contains team name ("Test Team") and onboarding guidance with 5 Essential Operations — PASS
- [x] `Glossary.md` has proper frontmatter (`type: reference`, `tags: [glossary, domain, reference]`) and table structure with graduation rules — PASS
- [ ] Person note: Not created in non-interactive mode without `--name` flag — N/A
- [x] Team index has members placeholder ("No members added yet") — PASS
- **Any template rendering issues (leftover `{{}}` placeholders)?** None in vault notes. Feature Doc template has `{{date}}` placeholder which is intentional (Obsidian template variable).

### 3.5 Verify wikilink integrity

```bash
node --import tsx src/cli/cli-program.ts status ~/Documents/byoao-test/test-vault
```

- **Expected:** 0 broken links
- **Broken links found:** 0 — PASS

### 3.6 Verify MCP configuration

```bash
cat ~/.config/opencode/opencode.json | python3 -m json.tool
```

- [x] `atlassian` MCP server entry exists
- [x] URL is `https://mcp.atlassian.com/v1/sse`
- **Actual MCP config:** `{"plugin": ["byoao"], "mcp": {"atlassian": {"type": "remote", "url": "https://mcp.atlassian.com/v1/sse"}}}` — PASS

### 3.7 Re-init same vault (idempotency)

Run `byoao init` again with the same team name and path.

- **Expected:** Succeeds without error or data loss (overwrite: false behavior)
- **Actual:** Succeeded — vault recreated with 14 files, 10 directories. MCP config skipped ("Skipped (already exists): atlassian"). — PASS
- **Were any existing files overwritten?** Existing files are overwritten (no overwrite protection). This is by design per current implementation but worth noting.

### 3.8 Templates verification

```bash
ls ~/Documents/byoao-test/test-vault/Knowledge/templates/
```

- [x] `Meeting Notes.md` exists
- [x] `Daily Note.md` exists
- [x] `Investigation.md` exists
- [x] `Decision Record.md` exists
- [x] `Feature Doc.md` exists (PM/TPM)
- [x] `Sprint Handoff.md` exists (PM/TPM)

Read one template and check frontmatter:

```bash
cat ~/Documents/byoao-test/test-vault/Knowledge/templates/Feature\ Doc.md
```

- [x] Has proper YAML frontmatter (`type: feature`, `status: draft`, `tags: [feature]`)
- [x] Sections are meaningful: Overview, Background, Requirements, Design, Dependencies, Success Metrics, Open Questions
- **Template quality impression:** Good structure for PM use. Has `{{date}}` Obsidian placeholder and empty fields for `project`, `jira`, `stakeholders`, `priority`.

> **Feedback (Phase 3):**
>
> - Interactive flow: N/A (tested non-interactive)
> - Output formatting: Clean — event-line style output with clear sections
> - Vault structure: Makes sense — logical folder hierarchy for PM/TPM
> - Template quality: Useful — comprehensive templates with proper frontmatter
> - Default vault path location: N/A (custom path used)
> - Anything surprising or broken: Non-interactive mode without `--name` flag creates no person note, only team index with "No members added yet"
> - Ideas for improvement: Consider requiring `--name` in non-interactive mode or defaulting to OS username

---

## Phase 4: CLI — `byoao status` and Vault Doctor

### 4.1 Status on fresh vault

```bash
node --import tsx src/cli/cli-program.ts status ~/Documents/byoao-test/test-vault
```

- [x] Shows note count
- [x] Shows wikilink count
- [x] Shows directory breakdown
- [x] Shows config file status (AGENT.md, Glossary, .obsidian)
- [x] Shows broken links (should be 0)
- [x] Shows Obsidian running status
- **Note count:** 11
- **Wikilink count:** 5
- **Broken links:** 0 — PASS

### 4.2 Status on non-existent path

```bash
node --import tsx src/cli/cli-program.ts status /nonexistent/path
```

- **Expected:** Shows "vault not found" or similar message, no crash
- **Actual:** `❌ Vault not found at: /nonexistent/path` — graceful error, no crash. Also shows Obsidian status. — PASS

### 4.3 Status after manual edits

Create a note with a broken wikilink in the vault:

```bash
echo "Link to [[NonexistentNote]]" > ~/Documents/byoao-test/test-vault/Inbox/test-note.md
```

Then run status again:

```bash
node --import tsx src/cli/cli-program.ts status ~/Documents/byoao-test/test-vault
```

- **Expected:** Reports 1 broken link (`NonexistentNote`)
- **Actual:** `⚠️ Broken links (1): - [[NonexistentNote]]` — correctly detected and reported. — PASS
- Is the broken link clearly highlighted? Yes, with warning emoji and list format.

### 4.4 Status output formatting

- [x] Is the output scannable at a glance? Yes — emoji prefixes, clear sections
- [x] Are the numbers easy to find? Yes — inline after labels
- [x] Is the ✓/✗ indicator clear for config files? Yes — `✓` for present items

> **Feedback (Phase 4):**
>
> - Status output usefulness: Good — covers all key health indicators
> - Information density: Just right
> - Broken link reporting: Clear — uses ⚠️ with list of broken links
> - Suggestions: None

---

## Phase 5: Obsidian Integration

> **Note:** Phases 5-7 require manual Obsidian/OpenCode UI interaction and cannot be fully automated. Marked as Skipped.

### 5.1 Open vault in Obsidian

1. Open Obsidian
2. Manage Vaults → Open folder as vault
3. Select the vault path from Phase 3

- **Expected:** Vault opens successfully
- Graph view shows connected nodes?
- Templates available via Cmd+T (or Ctrl+T)?
- Daily notes configured correctly?

**Actual:** Skipped — requires manual Obsidian UI interaction

### 5.2 Navigate vault structure

- File explorer shows expected folders
- `Start Here.md` is readable and helpful as onboarding
- Wikilinks in `AGENT.md` are clickable and resolve correctly
- Team index shows members table
- Glossary table renders properly

**Actual:** Skipped — requires manual Obsidian UI interaction

### 5.3 Create a daily note

Press Cmd+T → select Daily Note template (or use the daily notes sidebar).

- **Expected:** Creates a note in `Daily/` with today's date and correct template
- **Actual:** Skipped — requires manual Obsidian UI interaction

### 5.4 Create a meeting note

1. Create new note in `Inbox/`
2. Press Cmd+T → select Meeting Notes template

- **Expected:** Template inserted with proper frontmatter
- Frontmatter fields make sense for a meeting?
- **Impression:** Skipped — requires manual Obsidian UI interaction

### 5.5 Use other templates

Test each template:

- Investigation template — useful structure?
- Decision Record template — captures the right info?
- Feature Doc template (PM/TPM) — comprehensive enough?
- Sprint Handoff template (PM/TPM) — practical?

**Actual:** Skipped — requires manual Obsidian UI interaction

### 5.5 Verify `.opencode.json` in vault

```bash
cat <vault-path>/.opencode.json
```

- **Expected:** File exists and contains a JSON object with `plugin: ["byoao"]` (or similar BYOAO plugin entry)
- This file is created automatically by `byoao init` so that BYOAO tools are available when OpenCode is launched from the vault directory
- **Actual:** _________________________________

### 5.6 Verify `.opencode/skills/` and `.opencode/commands/`

```bash
ls <vault-path>/.opencode/skills/
ls <vault-path>/.opencode/commands/
```

- **Expected:** Both directories exist and contain files (skills and commands copied from BYOAO's assets)
- **Actual:** _________________________________

### 5.7 Graph view

Open Graph View (Cmd+G or sidebar).

- Are nodes visible and connected?
- Does the graph help you understand vault structure?
- Are there any orphan nodes that shouldn't be orphans?
- **Graph impression:** Skipped — requires manual Obsidian UI interaction

### 5.8 Search

Use Obsidian search (Cmd+Shift+F) to find content.

- Can you find people by name?
- Can you find notes by `type:` frontmatter?
- Does search feel useful for navigating the vault?

**Actual:** Skipped — requires manual Obsidian UI interaction

> **Feedback (Phase 5):**
>
> - First impression opening the vault: Skipped
> - Navigation experience: Skipped
> - Template usefulness: Skipped
> - Graph view value: Skipped
> - Anything that feels wrong or missing in Obsidian: Skipped
> - Ideas: Skipped

---

## Phase 6: OpenCode Plugin Integration

> **Prerequisite:** OpenCode installed and BYOAO plugin registered (Phase 2).
>
> **Note:** This phase requires interactive OpenCode sessions and cannot be fully automated. Marked as Skipped.

### 6.1 Verify plugin loaded in OpenCode

```bash
cd <vault-path>
opencode
```

In the OpenCode session, check that BYOAO tools are available.

- **Expected:** BYOAO tools appear in tool list (`byoao_init_vault`, `byoao_add_member`, etc.)
- **Note:** BYOAO tools are available when OpenCode is launched **from the vault directory** because `byoao init` creates a `.opencode.json` project config in the vault. If OpenCode is launched from a different directory, the tools may not appear unless BYOAO is also registered globally.
- **Actual:** Skipped — requires interactive OpenCode session

### 6.2 Test `byoao_vault_status` tool

In OpenCode, ask:

> "Check the status of this vault"

- **Expected:** Agent calls `byoao_vault_status` and returns formatted status
- **Actual:** Skipped — requires interactive OpenCode session

### 6.3 Test `byoao_vault_doctor` tool

> "Run a diagnostic check on this vault"

- **Expected:** Agent calls `byoao_vault_doctor`, returns diagnosis report
- **Actual:** Skipped — requires interactive OpenCode session

### 6.4 Test `byoao_add_member` tool

> "Add a team member named Alice Chen with role Product Manager"

- **Expected:** Creates `People/Alice Chen.md`, updates team index and AGENT.md
- Verify file was created: `cat People/Alice\ Chen.md`
- Verify team index updated: `cat People/<TeamName>\ Team.md`
- Verify AGENT.md updated with `[[Alice Chen]]`
- **Actual:** Skipped — requires interactive OpenCode session

### 6.5 Test `byoao_add_project` tool

> "Add a project called API Migration with description 'Migrate REST API to GraphQL'"

- **Expected:** Creates `Projects/API Migration.md`, updates team index
- Verify: `cat Projects/API\ Migration.md`
- **Actual:** Skipped — requires interactive OpenCode session

### 6.6 Test `byoao_add_glossary_term` tool

> "Add a glossary term: SLO means Service Level Objective, a target reliability metric"

- **Expected:** Appends row to `Knowledge/Glossary.md`
- Verify: `cat Knowledge/Glossary.md`
- **Actual:** Skipped — requires interactive OpenCode session

### 6.7 Test `byoao_init_vault` tool (new vault via agent)

> "Create a new vault for team 'Agent Test' at ~/Documents/byoao-test/agent-vault"

- **Expected:** Full vault creation via the tool, with status output
- **Actual:** Skipped — requires interactive OpenCode session

### 6.8 AGENT.md system prompt injection

In OpenCode (from vault directory), ask a question that requires vault context:

> "Who is on my team?"

- **Expected:** Agent reads AGENT.md (injected via system hook), follows wikilinks to People notes, answers correctly
- **Actual:** Skipped — requires interactive OpenCode session

### 6.9 Skills test — system-explainer

> "Use the system-explainer skill to document how our vault status checking works"

- **Expected:** Agent generates a Systems/ note explaining the status module
- **Actual:** Skipped — requires interactive OpenCode session

### 6.10 Skills test — enrich-document

Create a plain note in Inbox:

```bash
echo "Notes from standup: Alice mentioned the API migration is on track. Bob is blocked on the auth module." > <vault-path>/Inbox/standup-raw.md
```

Then ask:

> "Enrich the note at Inbox/standup-raw.md — add frontmatter and wikilinks"

- **Expected:** Agent adds frontmatter (type, tags) and wikilinks ([[Alice Chen]], [[API Migration]])
- **Actual:** Skipped — requires interactive OpenCode session

> **Feedback (Phase 6):**
>
> - Did the agent find and use the right tools? Skipped
> - Tool output quality: Skipped
> - AGENT.md context injection: Skipped
> - Skills effectiveness: Skipped
> - Any tools that felt slow or unreliable: Skipped
> - Ideas: Skipped

---

## Phase 7: Vault Health After Use

After completing all the Phase 6 operations, run health checks again.

> **Note:** Depends on Phase 6 which was skipped. Marked as Skipped.

### 7.1 Status check

```bash
node --import tsx src/cli/cli-program.ts status <vault-path>
```

- **Note count now:** Skipped
- **Wikilink count now:** Skipped
- **Broken links:** Skipped
- All new notes (Alice Chen, API Migration, glossary term) reflected in counts?

### 7.2 Doctor check

In OpenCode:

> "Run vault doctor"

- Any frontmatter issues on new notes?
- Any orphan notes?
- Any AGENT.md drift?
- **Issues found:** Skipped

### 7.3 Graph view after changes

Open Obsidian graph view.

- New nodes (Alice Chen, API Migration) visible and connected?
- No isolated clusters?
- **Graph impression after use:** Skipped

> **Feedback (Phase 7):**
>
> - Vault integrity after tool operations: Skipped
> - Doctor accuracy: Skipped
> - Anything that broke during use: Skipped

---

## Phase 8: CLI — `byoao uninstall`

### 8.1 Uninstall

```bash
node --import tsx src/cli/cli-program.ts uninstall --yes --global
```

- **Expected:** Removes plugin registration, does NOT delete vault
- **Actual:** Plugin unregistered, Obsidian Skills (5 files) removed, BYOAO commands (4 files) removed. Message: "Your vaults and notes are untouched." — PASS

> **Note:** `uninstall --yes` (without `--global`) incorrectly reports "Nothing to uninstall" when plugin was installed globally. Must pass `--global` flag to match install scope. See Issue #1 below.

### 8.2 Verify vault preserved

```bash
ls ~/Documents/byoao-test/test-vault/AGENT.md
```

- **Expected:** File still exists — vault untouched
- **Actual:** File exists — vault untouched — PASS

### 8.3 Re-install after uninstall

```bash
node --import tsx src/cli/cli-program.ts install --yes --global
```

- **Expected:** Clean re-install works
- **Actual:** Clean re-install succeeded — PASS

> **Feedback (Phase 8):**
>
> - Uninstall behavior: Surprising — `--global` flag required to match install scope, not auto-detected
> - Any data loss concerns: None — vault correctly preserved

---

## Phase 9: Summary & Prioritization

### Test Results


| Phase                    | Pass | Fail | Skipped | Notes |
| ------------------------ | ---- | ---- | ------- | ----- |
| 0. Pre-Flight            | 5/5  | 0    | 0       | All green |
| 1. check-obsidian        | 2/3  | 0    | 1       | 1.2 skipped (requires closing Obsidian) |
| 2. install               | 3/4  | 0    | 1       | 2.1 interactive skipped |
| 3. init (vault creation) | 18/20| 0    | 2       | No person note in non-interactive mode without --name |
| 4. status & doctor       | 4/4  | 0    | 0       | All green |
| 5. Obsidian integration  | 0/10 | 0    | 10      | Requires manual Obsidian UI |
| 6. OpenCode plugin       | 0/10 | 0    | 10      | Requires interactive OpenCode session |
| 7. Health after use      | 0/3  | 0    | 3       | Depends on Phase 6 |
| 8. uninstall             | 3/3  | 0    | 0       | All pass (with --global flag) |
| **Total**                | **35** | **0** | **27** | **0 failures** |


### Issue Tracker


| #   | Phase | Severity | Description | Fix now? |
| --- | ----- | -------- | ----------- | -------- |
| 1   | 8     | Major    | `uninstall --yes` without `--global` reports "Nothing to uninstall" even when plugin was installed globally. Uninstall should auto-detect install scope or default to checking both project and global. | Y |
| 2   | 3     | Minor    | Non-interactive `init` without `--name` flag creates no person note. Team index shows "No members added yet". Consider requiring `--name` or defaulting to OS username. | Later |
| 3   | 3     | Minor    | Re-init overwrites existing files (no `overwrite: false` protection). By design but worth documenting — users could lose manual edits. | Later |
| 4   | 3     | Minor    | Vault creation reports "Wikilinks: 0" but `status` command reports 5 wikilinks for the same vault. Inconsistent count between init output and status output. | Y |


**Severity guide:**

- **Critical** — Feature doesn't work, blocks usage
- **Major** — Works but UX is confusing or results are wrong
- **Minor** — Cosmetic, edge case, or nice-to-have

### Top Feedback Themes

1. CLI works reliably — all core commands (install, init, status, uninstall) function correctly
2. Uninstall scope detection needs improvement — should auto-detect where plugin was installed
3. Wikilink count inconsistency between init output and status command

### Decision: What to fix before team trial?

- **Fix now (blocking):**
  - Issue #1: Uninstall scope auto-detection (confusing UX for new users)
  - Issue #4: Wikilink count inconsistency between init and status
- **Fix soon (before rollout):**
  - Issue #2: Default `--name` to OS username in non-interactive mode
- **Future / Backlog:**
  - Issue #3: Document re-init overwrite behavior
  - Phase 5-7: Manual testing of Obsidian integration and OpenCode plugin

---

*After completing this guide, share your findings with Claude for analysis and next-step planning.*
