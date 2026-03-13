# Role Preset System Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make BYOAO role-agnostic by introducing a config-driven preset system (common + role overlay), removing numbered directory prefixes, adding vault-doctor, interactive TUI, plugin hooks, and Obsidian CLI integration.

**Architecture:** Two-phase delivery. Phase 1 restructures assets into `presets/common/` + `presets/pm-tpm/`, refactors `create.ts` to load preset config and merge layers, updates all hard-coded PM/TPM references, adds interactive TUI to `vault init`, and removes numbered directory prefixes. Phase 2 adds `obsidian-cli.ts` wrapper, `vault-doctor` tool/skill, plugin hooks (system.transform + session.idle), and migrates post-init operations to use Obsidian CLI.

**Tech Stack:** TypeScript (ESM), `@opencode-ai/plugin`, Commander.js, Inquirer.js, Handlebars, Zod, Chalk, fs-extra, gray-matter

**Spec:** `docs/superpowers/specs/2026-03-12-role-preset-system-design.md`

---

## File Structure

### New Files

| File | Responsibility |
|------|---------------|
| `src/vault/preset.ts` | Load `preset.json`, validate with Zod, resolve paths, list available presets |
| `src/vault/obsidian-cli.ts` | Wrapper for `obsidian` CLI commands — exec, JSON parse, availability check |
| `src/vault/doctor.ts` | 5 diagnostic checks (frontmatter, type/tags, agent drift, orphans, broken links) |
| `src/tools/vault-doctor.ts` | OpenCode tool wrapper for `getVaultDiagnosis()` |
| `src/skills/vault-doctor.md` | `/vault-doctor` slash command definition |
| `src/hooks/system-transform.ts` | Read AGENT.md from cwd, mutate `output.system` array (OpenCode plugin mutating hook pattern) |
| `src/hooks/idle-suggestions.ts` | Listen for session.idle, suggest commands via toast |
| `src/assets/presets/common/AGENT.md.hbs` | Common AGENT.md skeleton with `{{{ROLE_SECTION}}}` slot |
| `src/assets/presets/common/Start Here.md.hbs` | Updated with Quick Win section + non-prefixed folder names |
| `src/assets/presets/common/Glossary.md.hbs` | Moved from vault-templates/ |
| `src/assets/presets/common/obsidian/` | Moved from vault-templates/obsidian/ |
| `src/assets/presets/common/templates/` | 4 universal templates: Daily Note, Meeting Notes, Decision Record, Investigation |
| `src/assets/presets/pm-tpm/preset.json` | PM/TPM preset config |
| `src/assets/presets/pm-tpm/agent-section.hbs` | PM/TPM-specific AGENT.md section (projects, sprints) |
| `src/assets/presets/pm-tpm/templates/` | 2 PM-specific templates: Feature Doc, Sprint Handoff |

### Modified Files

| File | What Changes |
|------|-------------|
| `src/vault/create.ts` | Load preset via `loadPreset()`, merge common+preset dirs/templates, two-layer AGENT.md, non-prefixed dirs |
| `src/vault/status.ts` | Update `topDirs` to non-prefixed names; Phase 2: use Obsidian CLI |
| `src/vault/member.ts` | Phase 2: use `obsidian create` + `obsidian property:set` with fs fallback |
| `src/vault/project.ts` | Phase 2: same pattern as member.ts |
| `src/vault/glossary.ts` | Phase 2: use `obsidian read` + `obsidian append` with fs fallback |
| `src/plugin-config.ts` | Add `PresetConfigSchema`, `VaultDoctorSchema`, optional `preset` field to `VaultConfigSchema` |
| `src/index.ts` | Register `vault_doctor` tool; add hooks (system.transform, event) |
| `src/cli/cli-program.ts` | Add `--preset` flag; add interactive TUI flow when no flags |
| `src/cli/installer.ts` | Remove web-clipper auto-install; update tagline; 4 skills (was 3) |
| `src/cli/ui.ts` | Add `printEvent()` / `printEventDetail()` for event-line style |
| `src/skills/init-knowledge-base.md` | Replace "PM/TPM team" with generic role language |
| `src/skills/system-explainer.md` | Replace "TPM-friendly" with "clear, non-jargon"; update `50-Systems/` → `Systems/` |
| `package.json` | Bump version 0.1.0 → 0.2.0; update description |

### Removed

| Path | Why |
|------|-----|
| `src/assets/vault-templates/` | Replaced by `src/assets/presets/` |

---

## Chunk 1: Phase 1 — Preset System + Directory Restructure

### Task 1: Add Preset Zod Schema

**Files:**
- Modify: `src/plugin-config.ts`

- [ ] **Step 1: Add PresetConfigSchema to plugin-config.ts**

Add after `VaultStatusSchema` (line 55):

```typescript
// --- Preset System ---

export const PresetConfigSchema = z.object({
  name: z.string().min(1),
  displayName: z.string().min(1),
  description: z.string(),
  directories: z.array(z.string()).default([]),
  agentDescription: z.string(),
  frontmatterExtras: z.record(z.string(), z.array(z.string())).default({}),
  templates: z.array(z.string()).default([]),
});

export type PresetConfig = z.infer<typeof PresetConfigSchema>;
```

- [ ] **Step 2: Add optional `preset` field to VaultConfigSchema**

In `VaultConfigSchema` (line 18-26), add after `jiraProject`:

```typescript
preset: z.string().default("pm-tpm"),
```

- [ ] **Step 3: Add VaultDoctorSchema**

```typescript
export const VaultDoctorSchema = z.object({
  vaultPath: z.string(),
});

export type VaultDoctorInput = z.infer<typeof VaultDoctorSchema>;
```

- [ ] **Step 4: Build and verify**

Run: `cd /Users/jay/Documents/BOYO/byoao && npm run build`
Expected: No errors

- [ ] **Step 5: Commit**

```bash
git add src/plugin-config.ts
git commit -m "feat: add PresetConfig and VaultDoctor Zod schemas"
```

---

### Task 2: Create Preset Loader

**Files:**
- Create: `src/vault/preset.ts`

- [ ] **Step 1: Create preset.ts**

```typescript
import fs from "fs-extra";
import path from "node:path";
import { PresetConfigSchema, type PresetConfig } from "../plugin-config.js";

function getPresetsDir(): string {
  const srcPresets = path.resolve(import.meta.dirname, "..", "assets", "presets");
  const distPresets = path.resolve(
    import.meta.dirname, "..", "..", "src", "assets", "presets"
  );
  if (fs.existsSync(srcPresets)) return srcPresets;
  if (fs.existsSync(distPresets)) return distPresets;
  throw new Error(
    `Cannot find presets directory. Looked in:\n  ${srcPresets}\n  ${distPresets}`
  );
}

export function listPresets(): { name: string; displayName: string; description: string }[] {
  const presetsDir = getPresetsDir();
  const entries = fs.readdirSync(presetsDir, { withFileTypes: true });
  const presets: { name: string; displayName: string; description: string }[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory() || entry.name === "common") continue;
    const configPath = path.join(presetsDir, entry.name, "preset.json");
    if (!fs.existsSync(configPath)) continue;
    const raw = fs.readJsonSync(configPath);
    const parsed = PresetConfigSchema.parse(raw);
    presets.push({
      name: parsed.name,
      displayName: parsed.displayName,
      description: parsed.description,
    });
  }

  return presets;
}

export function loadPreset(name: string): {
  config: PresetConfig;
  presetsDir: string;
} {
  const presetsDir = getPresetsDir();
  const presetDir = path.join(presetsDir, name);
  const configPath = path.join(presetDir, "preset.json");

  if (!fs.existsSync(configPath)) {
    const available = listPresets().map((p) => p.name);
    throw new Error(
      `Preset "${name}" not found. Available presets: ${available.join(", ")}`
    );
  }

  const raw = fs.readJsonSync(configPath);
  const config = PresetConfigSchema.parse(raw);
  return { config, presetsDir };
}

export function getCommonDir(): string {
  return path.join(getPresetsDir(), "common");
}
```

- [ ] **Step 2: Build and verify**

Run: `npm run build`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/vault/preset.ts
git commit -m "feat: add preset loader with Zod validation"
```

---

### Task 3: Restructure Assets — Create Preset Directories

This task moves files from `src/assets/vault-templates/` into `src/assets/presets/common/` and `src/assets/presets/pm-tpm/`.

**Files:**
- Create: `src/assets/presets/common/` (move from vault-templates)
- Create: `src/assets/presets/pm-tpm/` (new preset config + PM-specific templates)
- Remove: `src/assets/vault-templates/` (after migration)

- [ ] **Step 1: Create common preset directory structure**

```bash
cd /Users/jay/Documents/BOYO/byoao
mkdir -p src/assets/presets/common/obsidian
mkdir -p src/assets/presets/common/templates
mkdir -p src/assets/presets/pm-tpm/templates
```

- [ ] **Step 2: Move obsidian config to common**

```bash
cp -r src/assets/vault-templates/obsidian/* src/assets/presets/common/obsidian/
```

- [ ] **Step 3: Move universal templates to common (4 files)**

These templates are role-agnostic:

```bash
cp src/assets/vault-templates/templates/Daily\ Note.md src/assets/presets/common/templates/
cp src/assets/vault-templates/templates/Meeting\ Notes.md src/assets/presets/common/templates/
cp src/assets/vault-templates/templates/Decision\ Record.md src/assets/presets/common/templates/
cp src/assets/vault-templates/templates/Investigation.md src/assets/presets/common/templates/
```

- [ ] **Step 4: Move PM-specific templates to pm-tpm (2 files)**

```bash
cp src/assets/vault-templates/templates/Feature\ Doc.md src/assets/presets/pm-tpm/templates/
cp src/assets/vault-templates/templates/Sprint\ Handoff.md src/assets/presets/pm-tpm/templates/
```

- [ ] **Step 5: Create common AGENT.md.hbs with role section slot**

Create `src/assets/presets/common/AGENT.md.hbs`:

```markdown
# {{TEAM_NAME}} Workspace

{{{AGENT_DESCRIPTION}}}

## Navigation

- Search by frontmatter: `type`, `status`, `team`, `tags`
- Follow `[[wikilinks]]` to traverse knowledge graph
- `Knowledge/` for domain reference
- `People/` for team roster

## Domain Knowledge

- [[Glossary]] — centralized term reference (start here for any domain question)

### Concept Notes (Knowledge/concepts/)

Complex domain concepts with rich wikilinks. Created as terms graduate from the Glossary.

{{{ROLE_SECTION}}}

## Team (People/)

{{{TEAM_TABLE}}}

## Templates (Knowledge/templates/)

Use Obsidian's template plugin (Ctrl/Cmd+T) to insert:
{{{TEMPLATE_LIST}}}
```

- [ ] **Step 6: Create pm-tpm agent-section.hbs**

Create `src/assets/presets/pm-tpm/agent-section.hbs`:

```markdown
## Active Projects (Projects/)

{{{PROJECTS}}}

{{#if HAS_JIRA}}
## JIRA

- Host: {{JIRA_HOST}}
- Project: {{JIRA_PROJECT}}
{{/if}}

## Sprint Cycle

- 2-week sprints
- Adjust dates and cadence to match your team
```

- [ ] **Step 7: Create pm-tpm preset.json**

Create `src/assets/presets/pm-tpm/preset.json`:

```json
{
  "name": "pm-tpm",
  "displayName": "PM / TPM",
  "description": "Project tracking, sprint cycles, stakeholder management",
  "directories": ["Projects", "Sprints"],
  "agentDescription": "PM/TPM knowledge base",
  "frontmatterExtras": {
    "project": ["jira", "stakeholders", "priority"],
    "sprint": ["sprint-dates", "jira-board"]
  },
  "templates": ["Feature Doc.md", "Sprint Handoff.md"]
}
```

- [ ] **Step 8: Update Start Here.md.hbs for non-prefixed dirs + Quick Win**

Create `src/assets/presets/common/Start Here.md.hbs` with updated folder names and a Quick Win section. Key changes from original:
- Remove all `00-`, `10-`, `20-`, `30-`, `40-`, `50-`, `60-` prefixes in folder references
- Add Quick Win section after "5 Essential Operations"
- `30-Knowledge/templates/` → `Knowledge/templates/`
- `10-Projects/` → `Projects/`
- `40-People/` → `People/`
- etc.

```markdown
---
title: Start Here
type: reference
status: active
tags: [onboarding]
---

# Welcome to {{TEAM_NAME}} Workspace

This is a **knowledge base** for the {{TEAM_NAME}} team, built in [Obsidian](https://obsidian.md). Everything here — notes, terms, people, projects — is connected through links and searchable properties.

This guide teaches by doing. Each section uses the features it describes.

---

## 5 Essential Operations

### 1. Follow a Wikilink

See the double-bracket link below? Click it to jump to that note.

> Try it: [[Glossary]]

Every `[[link]]` in this vault connects two notes. These connections build a knowledge graph you can visualize (see operation 5).

### 2. Quick Switch

Press `Cmd+O` (Mac) or `Ctrl+O` (Windows) to open the quick switcher. Start typing any note name.

> Try it: `Cmd+O` → type any project name

### 3. Insert a Template

Press `Cmd+T` to insert a template into the current note. Templates live in `Knowledge/templates/` and give you consistent structure.

> Try it: Create a new note (`Cmd+N`), then `Cmd+T` → choose "Meeting Notes"

### 4. Search by Property

Every note has **frontmatter** — the YAML block between `---` at the top. You can search by any property.

> Try it: Open search (`Cmd+Shift+F`) → type `[type: feature]` to find all feature docs

Common properties: `type`, `status`, `team`, `project`, `stakeholders`, `tags`.

### 5. Graph View

Press `Cmd+G` to see how all notes connect visually. Nodes are notes, edges are wikilinks.

> Try it: `Cmd+G` → zoom into the cluster around [[{{TEAM_NAME}} Team]]

---

## Quick Win: See AI in Action

Want to see what BYOAO can do? Try this in OpenCode:

1. Create a new note in `Inbox/` — paste any messy text (meeting notes, brainstorm, etc.)
2. Run `/enrich-document` in OpenCode
3. Watch: frontmatter appears, wikilinks connect to existing notes, structure emerges

This is the core loop — write freely, let AI structure it.

---

## Your First 10 Minutes

1. Open [[Glossary]] — scan the term tables to orient yourself on domain language
2. Pick any project in `Projects/` — follow links to people and concepts
3. Open Graph View (`Cmd+G`) — see the full knowledge map
4. Create a Daily Note (`Cmd+T` → Daily Note) — start capturing your own notes
5. Read `AGENT.md` to see how AI agents navigate this vault

---

## Folder Map

| Folder | Purpose |
|--------|---------|
| `Inbox` | Drop zone for unprocessed notes |
| `Projects` | One note per active project |
| `Sprints` | Sprint handoff documents |
| `Knowledge` | Domain reference, glossary, concept notes, templates |
| `People` | One note per team member + team index |
| `Systems` | Codebase explanations (generated by AI agents) |
| `Archive` | Completed or deprecated notes |
| `Daily` | Daily notes (auto-created by template) |

> **Note:** Folders are suggestions, not structure. Feel free to reorganize — the real knowledge graph lives in frontmatter and wikilinks.

---

## For AI Agents

This vault is designed for both humans and AI agents. See `AGENT.md` (or `CLAUDE.md`) at the vault root for routing instructions, project index, and team roster.
```

- [ ] **Step 9: Move Glossary.md.hbs to common**

```bash
cp src/assets/vault-templates/Glossary.md.hbs src/assets/presets/common/Glossary.md.hbs
```

- [ ] **Step 10: Remove old vault-templates directory**

```bash
rm -rf src/assets/vault-templates
```

- [ ] **Step 11: Build to verify asset paths don't break**

Run: `npm run build`
Expected: Compiles (runtime errors expected until create.ts is refactored)

- [ ] **Step 12: Commit**

```bash
git add -A src/assets/presets/ && git rm -r src/assets/vault-templates/
git commit -m "refactor: restructure assets into presets/common + presets/pm-tpm"
```

---

### Task 4: Refactor create.ts — Preset-Based Vault Creation

**Files:**
- Modify: `src/vault/create.ts`

This is the core refactor. Replace hard-coded directories and template paths with preset-driven logic.

- [ ] **Step 1: Rewrite create.ts**

Replace the entire file content. Key changes:
- Import `loadPreset`, `getCommonDir` from `preset.ts`
- Replace `DIRECTORIES` constant with common + preset merge
- Replace `getAssetsDir()` with `getCommonDir()` and preset dir
- Two-layer AGENT.md rendering (common skeleton + preset agent-section)
- Non-prefixed directory names
- Build template list from common + preset templates

```typescript
import fs from "fs-extra";
import path from "node:path";
import { renderTemplate, today } from "./template.js";
import { loadPreset, getCommonDir } from "./preset.js";
import type { VaultConfig } from "../plugin-config.js";

// Common directories shared by all presets
const COMMON_DIRECTORIES = [
  "Inbox",
  "Knowledge",
  "Knowledge/concepts",
  "Knowledge/templates",
  "People",
  "Systems",
  "Archive",
  "Daily",
];

export interface CreateVaultResult {
  vaultPath: string;
  filesCreated: number;
  wikilinksCreated: number;
  directories: string[];
}

export async function createVault(config: VaultConfig): Promise<CreateVaultResult> {
  const { teamName, vaultPath, members, projects, glossaryEntries, jiraHost, jiraProject, preset } = config;
  const presetName = preset ?? "pm-tpm"; // Fallback if config wasn't parsed through Zod
  const { config: presetConfig, presetsDir } = loadPreset(presetName);
  const commonDir = getCommonDir();
  const presetDir = path.join(presetsDir, presetName);
  let filesCreated = 0;
  let wikilinksCreated = 0;

  // Merge directories: common + preset-specific
  const allDirectories = [...COMMON_DIRECTORIES, ...presetConfig.directories];

  // 1. Create directories
  for (const dir of allDirectories) {
    await fs.ensureDir(path.join(vaultPath, dir));
  }

  // 2. Copy .obsidian config from common
  await fs.ensureDir(path.join(vaultPath, ".obsidian"));
  const obsidianSrc = path.join(commonDir, "obsidian");
  if (await fs.pathExists(obsidianSrc)) {
    await fs.copy(obsidianSrc, path.join(vaultPath, ".obsidian"), { overwrite: false });
    filesCreated += (await fs.readdir(obsidianSrc)).length;
  }

  // 3. Copy note templates: common first, then preset overlay
  const templateDest = path.join(vaultPath, "Knowledge/templates");
  const allTemplateNames: string[] = [];

  // Common templates
  const commonTemplatesDir = path.join(commonDir, "templates");
  if (await fs.pathExists(commonTemplatesDir)) {
    const files = await fs.readdir(commonTemplatesDir);
    for (const file of files) {
      await fs.copy(
        path.join(commonTemplatesDir, file),
        path.join(templateDest, file),
        { overwrite: false }
      );
      allTemplateNames.push(file.replace(/\.md$/, ""));
      filesCreated++;
    }
  }

  // Preset templates
  const presetTemplatesDir = path.join(presetDir, "templates");
  if (await fs.pathExists(presetTemplatesDir)) {
    const files = await fs.readdir(presetTemplatesDir);
    for (const file of files) {
      await fs.copy(
        path.join(presetTemplatesDir, file),
        path.join(templateDest, file),
        { overwrite: false }
      );
      allTemplateNames.push(file.replace(/\.md$/, ""));
      filesCreated++;
    }
  }

  // 4. Generate Glossary.md
  const glossaryTemplate = await fs.readFile(
    path.join(commonDir, "Glossary.md.hbs"),
    "utf-8"
  );
  let glossaryRows = "";
  if (glossaryEntries.length > 0) {
    glossaryRows = glossaryEntries
      .map((e) => `| **${e.term}** | ${e.definition} |`)
      .join("\n");
  }
  const glossaryContent = renderTemplate(glossaryTemplate, {
    TEAM_NAME: teamName,
    date: today(),
    GLOSSARY_ENTRIES: glossaryRows,
  });
  await fs.writeFile(path.join(vaultPath, "Knowledge/Glossary.md"), glossaryContent);
  filesCreated++;

  // 5. Generate Start Here.md
  const startHereTemplate = await fs.readFile(
    path.join(commonDir, "Start Here.md.hbs"),
    "utf-8"
  );
  const startHereContent = renderTemplate(startHereTemplate, { TEAM_NAME: teamName });
  await fs.writeFile(path.join(vaultPath, "Start Here.md"), startHereContent);
  filesCreated++;

  // 6. Generate AGENT.md (two-layer: common skeleton + preset section)
  const agentSkeletonTemplate = await fs.readFile(
    path.join(commonDir, "AGENT.md.hbs"),
    "utf-8"
  );

  // Render preset agent-section
  let roleSection = "";
  const agentSectionPath = path.join(presetDir, "agent-section.hbs");
  if (await fs.pathExists(agentSectionPath)) {
    const agentSectionTemplate = await fs.readFile(agentSectionPath, "utf-8");

    let projectsList: string;
    if (projects.length > 0) {
      projectsList = projects
        .map((p) => `- [[${p.name}]] — ${p.description}`)
        .join("\n");
      wikilinksCreated += projects.length;
    } else {
      projectsList = "(No projects added yet — create notes in Projects/)";
    }

    roleSection = renderTemplate(agentSectionTemplate, {
      PROJECTS: projectsList,
      JIRA_HOST: jiraHost,
      JIRA_PROJECT: jiraProject,
      HAS_JIRA: jiraHost && jiraProject,
    });
  }

  // Build team table
  let teamTable: string;
  if (members.length > 0) {
    const rows = members.map((m) => `| [[${m.name}]] | ${m.role} |`).join("\n");
    teamTable = `| Name | Role |\n|------|------|\n${rows}`;
    wikilinksCreated += members.length;
  } else {
    teamTable = "(No members added yet — create notes in People/)";
  }

  // Build template list string
  const templateList = allTemplateNames.map((t) => `- ${t}`).join("\n");

  const agentContent = renderTemplate(agentSkeletonTemplate, {
    TEAM_NAME: teamName,
    AGENT_DESCRIPTION: presetConfig.agentDescription,
    ROLE_SECTION: roleSection,
    TEAM_TABLE: teamTable,
    TEMPLATE_LIST: templateList,
  });
  await fs.writeFile(path.join(vaultPath, "AGENT.md"), agentContent);
  await fs.writeFile(path.join(vaultPath, "CLAUDE.md"), agentContent);
  filesCreated += 2;

  // 7. Create people notes
  for (const member of members) {
    const content = `---
title: "${member.name}"
type: person
team: "${teamName}"
role: "${member.role}"
status: active
tags: [person]
---

# ${member.name}

**Role**: ${member.role}
**Team**: ${teamName}
`;
    await fs.writeFile(path.join(vaultPath, `People/${member.name}.md`), content);
    filesCreated++;
  }

  // 8. Create project notes
  for (const project of projects) {
    const content = `---
title: "${project.name}"
type: feature
status: active
date: ${today()}
team: "${teamName}"
jira: ""
stakeholders: []
priority: ""
tags: [project]
---

# ${project.name}

${project.description}
`;
    await fs.writeFile(path.join(vaultPath, `Projects/${project.name}.md`), content);
    filesCreated++;
  }

  // 9. Create team index (always, since Start Here.md links to it)
  {
    let teamIndexContent = `---
title: "${teamName} Team"
type: reference
team: "${teamName}"
tags: [team]
---

# ${teamName} Team

## Members

`;
    if (members.length > 0) {
      teamIndexContent += "| Name | Role |\n|------|------|\n";
      teamIndexContent += members.map((m) => `| [[${m.name}]] | ${m.role} |`).join("\n");
      wikilinksCreated += members.length;
    } else {
      teamIndexContent += "(No members added yet)";
    }

    teamIndexContent += "\n\n## Active Projects\n\n";
    if (projects.length > 0) {
      teamIndexContent += projects
        .map((p) => `- [[${p.name}]] — ${p.description}`)
        .join("\n");
      wikilinksCreated += projects.length;
    } else {
      teamIndexContent += "(No projects added yet)";
    }
    teamIndexContent += "\n";

    await fs.writeFile(
      path.join(vaultPath, `People/${teamName} Team.md`),
      teamIndexContent
    );
    filesCreated++;
  }

  // 10. Create .gitkeep in empty directories
  const dirsNeedingGitkeep = [
    "Inbox",
    "Knowledge/concepts",
    "Systems",
    "Archive",
    "Daily",
  ];
  // Add preset-specific dirs if they're empty
  for (const dir of presetConfig.directories) {
    dirsNeedingGitkeep.push(dir);
  }
  if (projects.length === 0 && presetConfig.directories.includes("Projects")) {
    // Already in list from preset dirs
  }

  for (const dir of dirsNeedingGitkeep) {
    const dirPath = path.join(vaultPath, dir);
    if (await fs.pathExists(dirPath)) {
      const files = await fs.readdir(dirPath);
      if (files.length === 0) {
        await fs.writeFile(path.join(dirPath, ".gitkeep"), "");
      }
    }
  }

  return {
    vaultPath,
    filesCreated,
    wikilinksCreated,
    directories: allDirectories,
  };
}
```

- [ ] **Step 2: Build and verify**

Run: `npm run build`
Expected: No errors

- [ ] **Step 3: Smoke test vault creation**

```bash
rm -rf /tmp/byoao-preset-test
node dist/cli/cli-program.js vault init --team "TestTeam" --path /tmp/byoao-preset-test
```

Expected: Vault created with non-prefixed dirs (Inbox, Projects, Knowledge, People, etc.)

- [ ] **Step 4: Verify vault status shows 0 broken links**

```bash
node dist/cli/cli-program.js vault status /tmp/byoao-preset-test
```

Expected: 0 broken links, correct directory names

- [ ] **Step 5: Commit**

```bash
git add src/vault/create.ts
git commit -m "refactor: preset-driven vault creation with two-layer AGENT.md"
```

---

### Task 5: Update status.ts — Non-Prefixed Directory Names

**Files:**
- Modify: `src/vault/status.ts`

- [ ] **Step 1: Update topDirs array**

In `getVaultStatus()`, find the section that counts notes per directory. Replace numbered directory names:

```
"00-Inbox" → "Inbox"
"10-Projects" → "Projects"
"20-Sprints" → "Sprints"
"30-Knowledge" → "Knowledge"
"40-People" → "People"
"50-Systems" → "Systems"
"60-Archive" → "Archive"
"Daily" → "Daily"  (unchanged)
```

- [ ] **Step 2: Build and verify**

Run: `npm run build`

- [ ] **Step 3: Verify with new vault**

```bash
node dist/cli/cli-program.js vault status /tmp/byoao-preset-test
```

Expected: All directories recognized, counts displayed correctly

- [ ] **Step 4: Commit**

```bash
git add src/vault/status.ts
git commit -m "fix: update status to use non-prefixed directory names"
```

---

### Task 6: Update Hard-Coded PM/TPM References

**Files:**
- Modify: `src/index.ts` (line 1 comment)
- Modify: `src/cli/cli-program.ts` (line 16 description)
- Modify: `src/tools/init-vault.ts` (line 10 description)
- Modify: `src/skills/init-knowledge-base.md` (line 8)
- Modify: `src/skills/system-explainer.md` (lines 3, 8, 17)
- Modify: `package.json` (lines 4, 26)

- [ ] **Step 1: Update src/index.ts comment**

Change any "PM/TPM" in the top comment to "BYOAO" or role-agnostic language.

- [ ] **Step 2: Update src/cli/cli-program.ts description**

Line 16: `.description(...)` — change to `"Build Your Own AI OS — Obsidian + AI Agent"`

- [ ] **Step 3: Update src/cli/ui.ts tagline**

The `printGettingStarted()` function (line 131) has `"Build Your Own AI OS — Obsidian + AI Agent"` — this was already updated in the logo task. Verify it says `"Build Your Own AI OS — Obsidian + AI Agent"` and not the old PM/TPM tagline. If already correct, skip.

- [ ] **Step 4: Update src/tools/init-vault.ts description**

Change tool description from PM/TPM-specific to role-agnostic. Add `preset` parameter to the tool's args schema:

```typescript
preset: tool.schema.string().optional().describe("Role preset (default: 'pm-tpm')"),
```

Pass it through to `createVault()`.

- [ ] **Step 5: Update init-knowledge-base.md**

Line 8: Change "for a PM/TPM team" → "for any team". Make the skill ask which role preset to use.

- [ ] **Step 6: Update system-explainer.md**

- Line 3: "TPM-friendly language" → "clear, non-jargon language"
- Line 8: "for TPMs" → "for knowledge workers"
- Line 17: `50-Systems/` → `Systems/`
- Line 40: `50-Systems/` → `Systems/`

- [ ] **Step 7: Update package.json**

- `"description"`: "Build Your Own AI OS — Obsidian + AI Agent"
- Version: `"0.1.0"` → `"0.2.0"`
- Keywords: remove "pm", "tpm"; add "knowledge-os", "preset"

- [ ] **Step 8: Build and verify**

Run: `npm run build`
Expected: No errors

- [ ] **Step 9: Commit**

```bash
git add src/index.ts src/cli/cli-program.ts src/tools/init-vault.ts \
  src/skills/init-knowledge-base.md src/skills/system-explainer.md package.json
git commit -m "refactor: remove hard-coded PM/TPM references, make role-agnostic"
```

---

### Task 7: Update Installer — Remove Web Clipper, Update Tagline

**Files:**
- Modify: `src/cli/installer.ts`

- [ ] **Step 1: Remove web-clipper auto-install**

Find the web-clipper installation section (around lines 245-283) and remove it entirely. Replace with a recommendation in the getting-started output.

- [ ] **Step 2: Update getting-started items**

In the `printGettingStarted()` call, add web clipper as a recommendation:

```typescript
printGettingStarted([
  { cmd: "byoao vault init", desc: "Create a knowledge base" },
  { cmd: "byoao vault status <path>", desc: "Check vault health" },
]);
printInfo("Recommended: Obsidian Web Clipper → https://obsidian.md/clipper");
```

- [ ] **Step 3: Update installer to copy 4 skills (was 3)**

When vault-doctor.md is created (Task in Phase 2), the installer will need to copy it too. For now, just ensure the skills copy logic handles any `.md` files in `src/skills/`.

- [ ] **Step 4: Build and verify**

Run: `npm run build`

- [ ] **Step 5: Smoke test install**

```bash
node dist/cli/cli-program.js install -y --project-dir /tmp/byoao-install-test
```

Expected: No web-clipper step, new tagline shown, skills copied

- [ ] **Step 6: Commit**

```bash
git add src/cli/installer.ts
git commit -m "refactor: remove web-clipper auto-install, update tagline"
```

---

### Task 8: Add Event-Line UI Functions

**Files:**
- Modify: `src/cli/ui.ts`

- [ ] **Step 1: Add event-line rendering functions**

Add after the existing functions:

```typescript
/** Print an event-line marker: ● label */
export function printEvent(label: string): void {
  console.log(`  ${chalk.cyan("●")} ${chalk.bold(label)}`);
}

/** Print event-line detail (indented under event) */
export function printEventDetail(text: string): void {
  console.log(`    ${text}`);
}

/** Print a completed event: ◆ label */
export function printEventDone(label: string): void {
  console.log(`  ${chalk.green("◆")} ${chalk.bold(label)}`);
}
```

- [ ] **Step 2: Build and verify**

Run: `npm run build`

- [ ] **Step 3: Commit**

```bash
git add src/cli/ui.ts
git commit -m "feat: add event-line UI helpers (printEvent, printEventDetail, printEventDone)"
```

---

### Task 9: Add Interactive TUI to `vault init`

**Files:**
- Modify: `src/cli/cli-program.ts`

- [ ] **Step 1: Add --preset flag to vault init**

Add option: `.option("--preset <name>", "Role preset (default: pm-tpm)")` to the vault init command.

- [ ] **Step 2: Add interactive flow when no --team flag**

When `--team` is not provided and stdout is a TTY, launch interactive Inquirer prompts:

1. Show event marker `● Creating a new knowledge base`
2. Prompt: role selection (from `listPresets()`, disabled items for "coming soon")
3. Prompt: team name (required input)
4. Prompt: vault path (default: `~/Documents/{teamName} Workspace`, or custom)
5. Prompt: team members loop (name + role, repeating until "Done")
6. Prompt: projects loop (name + description, repeating until "Done")
7. Call `createVault()` with collected config
8. Show results with event-line style

Import `listPresets` from `../vault/preset.js` and `inquirer` for prompts.

Key logic:

```typescript
import inquirer from "inquirer";
import { listPresets } from "../vault/preset.js";
import { printEvent, printEventDetail, printEventDone } from "./ui.js";

// Inside vault init action:
const opts = cmd.opts();
if (!opts.team && process.stdout.isTTY) {
  // Interactive TUI flow
  printEvent("Creating a new knowledge base");
  console.log();

  // 1. Role selection
  const presets = listPresets();
  const { selectedPreset } = await inquirer.prompt([{
    type: "list",
    name: "selectedPreset",
    message: "Choose your role",
    choices: [
      ...presets.map(p => ({
        name: `${p.displayName} — ${p.description}`,
        value: p.name,
      })),
      new inquirer.Separator(),
      { name: "Engineer (coming soon)", disabled: true },
      { name: "Designer (coming soon)", disabled: true },
    ],
  }]);

  // 2. Team name
  const { teamName } = await inquirer.prompt([{
    type: "input",
    name: "teamName",
    message: "Team name:",
    validate: (v: string) => v.trim() ? true : "Team name is required",
  }]);

  // 3. Vault path
  const defaultPath = path.join(os.homedir(), "Documents", `${teamName} Workspace`);
  const { pathChoice } = await inquirer.prompt([{
    type: "list",
    name: "pathChoice",
    message: "Vault location",
    choices: [
      { name: `Use default (${defaultPath})`, value: "default" },
      { name: "Choose custom path", value: "custom" },
    ],
  }]);
  let vaultPath = defaultPath;
  if (pathChoice === "custom") {
    const { customPath } = await inquirer.prompt([{
      type: "input",
      name: "customPath",
      message: "Custom path:",
    }]);
    vaultPath = customPath;
  }

  // 4. Members loop
  const members: { name: string; role: string }[] = [];
  let addingMembers = true;
  while (addingMembers) {
    const { action } = await inquirer.prompt([{
      type: "list",
      name: "action",
      message: `Team members (${members.length} added)`,
      choices: [
        { name: "Add a member", value: "add" },
        { name: "Done", value: "done" },
      ],
    }]);
    if (action === "done") break;
    const { name, role } = await inquirer.prompt([
      { type: "input", name: "name", message: "Name:" },
      { type: "input", name: "role", message: "Role:", default: "" },
    ]);
    if (name.trim()) members.push({ name: name.trim(), role: role.trim() || "Team Member" });
  }

  // 5. Projects loop
  const projects: { name: string; description: string }[] = [];
  let addingProjects = true;
  while (addingProjects) {
    const { action } = await inquirer.prompt([{
      type: "list",
      name: "action",
      message: `Projects (${projects.length} added)`,
      choices: [
        { name: "Add a project", value: "add" },
        { name: "Done", value: "done" },
      ],
    }]);
    if (action === "done") break;
    const { name, description } = await inquirer.prompt([
      { type: "input", name: "name", message: "Project name:" },
      { type: "input", name: "description", message: "Description:", default: "" },
    ]);
    if (name.trim()) projects.push({ name: name.trim(), description: description.trim() || "" });
  }

  // Create vault
  // ... (same createVault call with event-line output)
}
```

- [ ] **Step 3: Preserve flag-based mode**

When `--team` IS provided (non-interactive), use existing logic with `--preset` defaulting to `"pm-tpm"`.

- [ ] **Step 4: Build and verify**

Run: `npm run build`

- [ ] **Step 5: Test interactive mode**

```bash
node dist/cli/cli-program.js vault init
```

Expected: Interactive prompts appear with event-line style

- [ ] **Step 6: Test flag mode**

```bash
rm -rf /tmp/byoao-flag-test
node dist/cli/cli-program.js vault init --team "FlagTest" --path /tmp/byoao-flag-test --preset pm-tpm
```

Expected: Vault created without prompts

- [ ] **Step 7: Commit**

```bash
git add src/cli/cli-program.ts
git commit -m "feat: add interactive TUI and --preset flag to vault init"
```

---

### Task 10: Phase 1 Integration Verification

- [ ] **Step 1: Clean build**

```bash
cd /Users/jay/Documents/BOYO/byoao && rm -rf dist && npm run build
```

- [ ] **Step 2: Test install**

```bash
node dist/cli/cli-program.js install -y --project-dir /tmp/byoao-p1-test
```

Verify: New tagline, no web-clipper, skills copied

- [ ] **Step 3: Test vault init (flag mode)**

```bash
rm -rf /tmp/byoao-p1-vault
node dist/cli/cli-program.js vault init --team "Phase1" --path /tmp/byoao-p1-vault
```

Verify:
- Non-prefixed directories: `Inbox/`, `Projects/`, `Knowledge/`, `People/`, `Systems/`, `Archive/`, `Daily/`, `Sprints/`
- `Knowledge/templates/` contains 6 templates (4 common + 2 PM)
- `AGENT.md` has two-layer structure (common skeleton + PM section)
- `Start Here.md` has Quick Win section and non-prefixed folder names

- [ ] **Step 4: Test vault status**

```bash
node dist/cli/cli-program.js vault status /tmp/byoao-p1-vault
```

Verify: 0 broken links, correct directory listing

- [ ] **Step 5: Test interactive mode**

```bash
node dist/cli/cli-program.js vault init
```

Verify: Role selection → team name → path → members → projects → vault created

- [ ] **Step 6: Test idempotent re-install**

```bash
node dist/cli/cli-program.js install -y --project-dir /tmp/byoao-p1-test
```

Verify: No duplicates, no errors

- [ ] **Step 7: Commit integration test results (if any fixes needed)**

---

## Chunk 2: Phase 2 — Obsidian CLI + vault-doctor + Hooks

### Task 11: Create Obsidian CLI Wrapper

**Files:**
- Create: `src/vault/obsidian-cli.ts`

- [ ] **Step 1: Create obsidian-cli.ts**

```typescript
import { execFileSync } from "node:child_process";

export interface ObsidianCliResult {
  success: boolean;
  output: string;
  error?: string;
}

/**
 * Check if the `obsidian` CLI is available in PATH.
 */
export function isObsidianCliAvailable(): boolean {
  try {
    execFileSync("obsidian", ["--version"], { stdio: "pipe" });
    return true;
  } catch {
    return false;
  }
}

/**
 * Execute an Obsidian CLI command and return the result.
 * Uses execFileSync (array form) to avoid shell injection.
 * @param args - Command arguments (e.g., ["orphans", "--vault", "MyVault"])
 */
export function execObsidianCmd(args: string[]): ObsidianCliResult {
  try {
    const output = execFileSync("obsidian", args, {
      stdio: "pipe",
      encoding: "utf-8",
      timeout: 10000,
    });
    return { success: true, output: output.trim() };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, output: "", error: msg };
  }
}

/**
 * Execute an Obsidian CLI command and parse JSON output.
 */
export function execObsidianJson<T = unknown>(args: string[]): T | null {
  const result = execObsidianCmd([...args, "format=json"]);
  if (!result.success) return null;
  try {
    return JSON.parse(result.output) as T;
  } catch {
    return null;
  }
}
```

- [ ] **Step 2: Build and verify**

Run: `npm run build`

- [ ] **Step 3: Commit**

```bash
git add src/vault/obsidian-cli.ts
git commit -m "feat: add Obsidian CLI wrapper (exec, JSON parse, availability check)"
```

---

### Task 12: Create vault-doctor

**Files:**
- Create: `src/vault/doctor.ts`
- Create: `src/tools/vault-doctor.ts`
- Create: `src/skills/vault-doctor.md`

- [ ] **Step 1: Create doctor.ts with 5 diagnostic checks**

```typescript
import fs from "fs-extra";
import path from "node:path";
import matter from "gray-matter";
import { isObsidianCliAvailable, execObsidianCmd } from "./obsidian-cli.js";

export interface DiagnosticIssue {
  severity: "warning" | "info";
  category: "frontmatter" | "orphan" | "agent-drift" | "broken-link";
  file?: string;
  message: string;
}

export interface DiagnosticReport {
  summary: {
    totalNotes: number;
    healthyNotes: number;
    issueCount: number;
  };
  issues: DiagnosticIssue[];
}

/** Recursively collect all .md files (excluding .obsidian) */
async function collectMarkdownFiles(dir: string): Promise<string[]> {
  const results: string[] = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === ".obsidian" || entry.name === ".git") continue;
      results.push(...(await collectMarkdownFiles(fullPath)));
    } else if (entry.name.endsWith(".md")) {
      results.push(fullPath);
    }
  }
  return results;
}

/** Extract wikilink targets from content (skip code blocks) */
function extractWikilinks(content: string): string[] {
  const stripped = content
    .replace(/```[\s\S]*?```/g, "")
    .replace(/`[^`]+`/g, "");
  const matches = stripped.match(/\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g);
  if (!matches) return [];
  return matches.map((m) => m.replace(/\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/, "$1"));
}

export async function getVaultDiagnosis(vaultPath: string): Promise<DiagnosticReport> {
  const issues: DiagnosticIssue[] = [];
  const allFiles = await collectMarkdownFiles(vaultPath);
  const noteNames = new Set(
    allFiles.map((f) => path.basename(f, ".md"))
  );
  let healthyNotes = 0;

  // Check 1 & 2: Frontmatter — missing type or tags
  for (const filePath of allFiles) {
    const relativePath = path.relative(vaultPath, filePath);
    // Skip template files
    if (relativePath.startsWith("Knowledge/templates/")) continue;

    const content = await fs.readFile(filePath, "utf-8");
    const { data } = matter(content);
    let hasIssue = false;

    if (!data || Object.keys(data).length === 0) {
      issues.push({
        severity: "warning",
        category: "frontmatter",
        file: relativePath,
        message: "Missing frontmatter — no metadata defined",
      });
      hasIssue = true;
    } else {
      if (!data.type) {
        issues.push({
          severity: "warning",
          category: "frontmatter",
          file: relativePath,
          message: "Missing `type` in frontmatter",
        });
        hasIssue = true;
      }
      if (!data.tags || (Array.isArray(data.tags) && data.tags.length === 0)) {
        issues.push({
          severity: "info",
          category: "frontmatter",
          file: relativePath,
          message: "Missing `tags` in frontmatter",
        });
        hasIssue = true;
      }
    }

    if (!hasIssue) healthyNotes++;
  }

  // Check 3: AGENT.md drift
  const agentPath = path.join(vaultPath, "AGENT.md");
  if (await fs.pathExists(agentPath)) {
    const agentContent = await fs.readFile(agentPath, "utf-8");
    const agentLinks = extractWikilinks(agentContent);
    for (const linkTarget of agentLinks) {
      if (!noteNames.has(linkTarget)) {
        issues.push({
          severity: "warning",
          category: "agent-drift",
          message: `AGENT.md links to [[${linkTarget}]] but no matching note found`,
        });
      }
    }
  }

  // Check 4: Orphan notes (no incoming or outgoing wikilinks)
  const allLinksMap = new Map<string, Set<string>>();
  const incomingLinks = new Set<string>();

  for (const filePath of allFiles) {
    const content = await fs.readFile(filePath, "utf-8");
    const links = extractWikilinks(content);
    const name = path.basename(filePath, ".md");
    allLinksMap.set(name, new Set(links));
    for (const link of links) {
      incomingLinks.add(link);
    }
  }

  for (const filePath of allFiles) {
    const relativePath = path.relative(vaultPath, filePath);
    if (relativePath.startsWith("Knowledge/templates/")) continue;
    if (relativePath === "AGENT.md" || relativePath === "CLAUDE.md") continue;

    const name = path.basename(filePath, ".md");
    const outgoing = allLinksMap.get(name) || new Set();
    const hasIncoming = incomingLinks.has(name);
    const hasOutgoing = outgoing.size > 0;

    if (!hasIncoming && !hasOutgoing) {
      issues.push({
        severity: "info",
        category: "orphan",
        file: relativePath,
        message: "Orphan note — no incoming or outgoing wikilinks",
      });
    }
  }

  // Check 5: Broken wikilinks
  for (const filePath of allFiles) {
    const relativePath = path.relative(vaultPath, filePath);
    const content = await fs.readFile(filePath, "utf-8");
    const links = extractWikilinks(content);
    for (const link of links) {
      if (!noteNames.has(link)) {
        issues.push({
          severity: "warning",
          category: "broken-link",
          file: relativePath,
          message: `Broken wikilink: [[${link}]]`,
        });
      }
    }
  }

  return {
    summary: {
      totalNotes: allFiles.length,
      healthyNotes,
      issueCount: issues.length,
    },
    issues,
  };
}
```

- [ ] **Step 2: Create vault-doctor tool**

Create `src/tools/vault-doctor.ts`:

```typescript
import { tool } from "@opencode-ai/plugin";
import { getVaultDiagnosis } from "../vault/doctor.js";

export const byoao_vault_doctor = tool({
  description:
    "Scan an Obsidian vault and produce a diagnostic report. Checks: missing frontmatter, missing type/tags, AGENT.md drift, orphan notes, broken wikilinks.",
  args: {
    vaultPath: tool.schema.string().describe("Absolute path to the Obsidian vault"),
  },
  async execute(args) {
    const report = await getVaultDiagnosis(args.vaultPath);

    const lines: string[] = [];
    lines.push(`Vault Diagnosis: ${report.summary.totalNotes} notes, ${report.summary.issueCount} issues`);
    lines.push("");

    // Group by category
    const byCategory = new Map<string, typeof report.issues>();
    for (const issue of report.issues) {
      const cat = byCategory.get(issue.category) || [];
      cat.push(issue);
      byCategory.set(issue.category, cat);
    }

    for (const [category, categoryIssues] of byCategory) {
      const icon = categoryIssues[0].severity === "warning" ? "⚠" : "ℹ";
      lines.push(`${icon} ${category} (${categoryIssues.length})`);
      for (const issue of categoryIssues.slice(0, 10)) {
        const file = issue.file ? ` — ${issue.file}` : "";
        lines.push(`  ${issue.message}${file}`);
      }
      if (categoryIssues.length > 10) {
        lines.push(`  ... and ${categoryIssues.length - 10} more`);
      }
      lines.push("");
    }

    if (report.issues.length === 0) {
      lines.push("✓ No issues found — vault is healthy!");
    }

    return lines.join("\n");
  },
});
```

- [ ] **Step 3: Create vault-doctor skill**

Create `src/skills/vault-doctor.md`:

```markdown
---
name: vault-doctor
description: Diagnose vault health — find missing frontmatter, orphan notes, broken wikilinks, and AGENT.md drift. Suggests fixes and asks for confirmation before making changes.
---

# Vault Doctor

You are a vault health assistant. Your job is to diagnose issues in an Obsidian vault and help the user fix them.

## Execution Flow

### Step 1: Locate Vault

Ask the user for their vault path, or detect it from the current working directory (look for AGENT.md in the cwd or parent directories).

### Step 2: Run Diagnosis

Call `byoao_vault_doctor` with the vault path. This runs 5 checks:

1. **Missing frontmatter** — notes without any YAML frontmatter
2. **Missing type/tags** — notes with frontmatter but no `type` or `tags` field
3. **AGENT.md drift** — AGENT.md references people or projects that don't have notes
4. **Orphan notes** — notes with no incoming or outgoing wikilinks
5. **Broken wikilinks** — links that point to non-existent notes

### Step 3: Present Results

Format the report by severity:

```
⚠ 3 notes without frontmatter
  - Inbox/quick-thought.md
  - Projects/demo-notes.md
  - Knowledge/api-overview.md

⚠ AGENT.md lists [[Kent]] but no People/Kent.md found

ℹ 2 orphan notes (no incoming or outgoing wikilinks)
  - Archive/old-draft.md
  - Inbox/random.md

✓ 0 broken wikilinks
```

### Step 4: Suggest Fixes

For each issue category, suggest a concrete next action:

| Issue | Suggested Fix |
|-------|--------------|
| Missing frontmatter | "Run `/enrich-document` on these files to add structure" |
| Missing type/tags | "Run `/enrich-document` to fill in metadata" |
| AGENT.md drift | "Create the missing note? I can run `byoao_add_member` or `byoao_add_project`" |
| Orphan notes | "Consider adding `[[wikilinks]]` to connect them, or archive if unused" |
| Broken wikilinks | "Create the target note, or fix the link name" |

**Always ask for user confirmation before making changes.** Do not auto-fix.

### Step 5: Update AGENT.md Timestamp

After fixes are applied (with user consent), append or update a `Last Scanned` line at the bottom of AGENT.md:

```markdown
---
_Last scanned by vault-doctor: 2026-03-13_
```

## Key Principles

- **Diagnose + suggest, never auto-fix**
- **Group by severity** — warnings first, info second
- **Actionable suggestions** — tell the user exactly what to do
- **Respect user agency** — always ask before modifying files
```

- [ ] **Step 4: Register vault-doctor in index.ts**

Add import and register in tool object:

```typescript
import { byoao_vault_doctor } from "./tools/vault-doctor.js";

// In the return object:
tool: {
  byoao_init_vault,
  byoao_add_member,
  byoao_add_project,
  byoao_add_glossary_term,
  byoao_vault_status,
  byoao_vault_doctor,
},
```

- [ ] **Step 5: Build and verify**

Run: `npm run build`

- [ ] **Step 6: Smoke test vault-doctor on a test vault**

```bash
node -e "
import { getVaultDiagnosis } from './dist/vault/doctor.js';
const report = await getVaultDiagnosis('/tmp/byoao-p1-vault');
console.log(JSON.stringify(report, null, 2));
"
```

Expected: JSON report with summary and issues array

- [ ] **Step 7: Commit**

```bash
git add src/vault/doctor.ts src/tools/vault-doctor.ts src/skills/vault-doctor.md src/index.ts
git commit -m "feat: add vault-doctor tool, skill, and diagnostic engine"
```

---

### Task 13: Add Plugin Hooks

**Files:**
- Create: `src/hooks/system-transform.ts`
- Create: `src/hooks/idle-suggestions.ts`
- Modify: `src/index.ts`

- [ ] **Step 1: Create system-transform.ts**

**IMPORTANT:** OpenCode plugin hooks use a **mutating pattern** — `(input, output) => Promise<void>`. They do NOT return values. The hook modifies `output.system` array in place.

Verified signature from `@opencode-ai/plugin/dist/index.d.ts` (line 197-202):
```typescript
"experimental.chat.system.transform"?: (input: {
    sessionID?: string;
    model: Model;
}, output: {
    system: string[];
}) => Promise<void>;
```

Create `src/hooks/system-transform.ts`:

```typescript
import fs from "fs-extra";
import path from "node:path";

/**
 * Read AGENT.md from the current working directory.
 * Returns the content if found, null otherwise.
 */
export function readAgentMdFromCwd(): string | null {
  const candidates = [
    path.join(process.cwd(), "AGENT.md"),
    path.join(process.cwd(), "..", "AGENT.md"),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      try {
        return fs.readFileSync(candidate, "utf-8");
      } catch {
        return null;
      }
    }
  }

  return null;
}

/**
 * Hook: inject AGENT.md into system prompt.
 * Mutating pattern — modifies output.system in place.
 */
export async function systemTransformHook(
  _input: { sessionID?: string; model: unknown },
  output: { system: string[] }
): Promise<void> {
  const agentMd = readAgentMdFromCwd();
  if (agentMd) {
    output.system.push(
      `\n---\n## BYOAO Vault Context (from AGENT.md)\n\n${agentMd}`
    );
  }
}
```

- [ ] **Step 2: Create idle-suggestions.ts**

```typescript
/**
 * Returns a suggestion string for BYOAO commands.
 * MVP: simple rotation. Future: context-aware.
 */
export function getIdleSuggestion(): string | null {
  const suggestions = [
    "Tip: run /vault-doctor to check vault health",
    "Tip: run /enrich-document to add frontmatter and wikilinks to a note",
    "Tip: run /system-explainer to document a codebase system in your vault",
  ];
  const idx = new Date().getMinutes() % suggestions.length;
  return suggestions[idx];
}
```

- [ ] **Step 3: Update index.ts to register hooks**

**Key points verified from `@opencode-ai/plugin/dist/index.d.ts`:**
- `Plugin` type: `(input: PluginInput) => Promise<Hooks>` — the plugin function receives `input` which has `client`
- `event` hook: `(input: { event: Event }) => Promise<void>` — receives `{ event }` NOT `event` directly, NO `client` param
- To access `client.tui.showToast()`, capture `client` from the outer plugin function's `input` argument via closure

```typescript
// BYOAO — Build Your Own AI OS plugin for OpenCode
// NOTE: Do NOT export other functions from this file!
// OpenCode treats ALL exports as plugin instances and calls them.

import type { Plugin } from "@opencode-ai/plugin";
import { byoao_init_vault } from "./tools/init-vault.js";
import { byoao_add_member } from "./tools/add-member.js";
import { byoao_add_project } from "./tools/add-project.js";
import { byoao_add_glossary_term } from "./tools/add-glossary-term.js";
import { byoao_vault_status } from "./tools/vault-status.js";
import { byoao_vault_doctor } from "./tools/vault-doctor.js";
import { systemTransformHook } from "./hooks/system-transform.js";
import { getIdleSuggestion } from "./hooks/idle-suggestions.js";

const BYOAOPlugin: Plugin = async (ctx) => {
  // Capture client from plugin context for use in hooks via closure
  const { client } = ctx;

  return {
    tool: {
      byoao_init_vault,
      byoao_add_member,
      byoao_add_project,
      byoao_add_glossary_term,
      byoao_vault_status,
      byoao_vault_doctor,
    },
    "experimental.chat.system.transform": systemTransformHook,
    event: async ({ event }) => {
      if (event.type === "session.idle") {
        const suggestion = getIdleSuggestion();
        if (suggestion) {
          client.tui.showToast({
            title: "BYOAO",
            message: suggestion,
            variant: "info",
            duration: 5000,
          });
        }
      }
    },
  };
};

export default BYOAOPlugin;
```

**Note:** The `event` hook receives `{ event: Event }` (nested), and `client` is accessed via closure from the plugin's `PluginInput` context — NOT from a hook parameter. The `experimental.chat.system.transform` hook is experimental and may change in future OpenCode versions.

- [ ] **Step 4: Build and verify**

Run: `npm run build`
Expected: No errors (type errors possible — check Plugin type and adjust hook signatures)

- [ ] **Step 5: Commit**

```bash
mkdir -p src/hooks
git add src/hooks/system-transform.ts src/hooks/idle-suggestions.ts src/index.ts
git commit -m "feat: add plugin hooks — system.transform (AGENT.md injection) + session.idle (toast suggestions)"
```

---

### Task 14: Phase 2 Integration Verification

- [ ] **Step 1: Clean build**

```bash
cd /Users/jay/Documents/BOYO/byoao && rm -rf dist && npm run build
```

- [ ] **Step 2: Full install test**

```bash
rm -rf /tmp/byoao-final-test
node dist/cli/cli-program.js install -y --project-dir /tmp/byoao-final-test
```

Verify:
- OΛO logo with gradient
- New tagline: "Build Your Own AI OS — Obsidian + AI Agent"
- No web-clipper step
- 4 skills copied (init-knowledge-base, system-explainer, enrich-document, vault-doctor)
- 5 obsidian skills

- [ ] **Step 3: Full vault creation test**

```bash
rm -rf /tmp/byoao-final-vault
node dist/cli/cli-program.js vault init --team "FinalTest" --path /tmp/byoao-final-vault
```

Verify:
- Non-prefixed directories
- Two-layer AGENT.md (common skeleton + PM section)
- Start Here.md has Quick Win section
- 6 templates in Knowledge/templates/

- [ ] **Step 4: Vault status**

```bash
node dist/cli/cli-program.js vault status /tmp/byoao-final-vault
```

Verify: 0 broken links

- [ ] **Step 5: Vault doctor test — clean vault baseline**

```bash
node -e "
import { getVaultDiagnosis } from './dist/vault/doctor.js';
const r = await getVaultDiagnosis('/tmp/byoao-final-vault');
console.log('Notes:', r.summary.totalNotes);
console.log('Issues:', r.summary.issueCount);
for (const i of r.issues) console.log(' ', i.severity, i.category, i.file || '', i.message);
"
```

Verify: Clean vault should have minimal issues

- [ ] **Step 6: Vault doctor test — missing frontmatter detection (spec item 8)**

```bash
echo "Just some text without frontmatter" > /tmp/byoao-final-vault/Inbox/bare-note.md
node -e "
import { getVaultDiagnosis } from './dist/vault/doctor.js';
const r = await getVaultDiagnosis('/tmp/byoao-final-vault');
const fm = r.issues.filter(i => i.category === 'frontmatter' && i.file?.includes('bare-note'));
console.log('Frontmatter issues for bare-note:', fm.length);
fm.forEach(i => console.log(' ', i.message));
"
```

Expected: At least 1 frontmatter issue for `Inbox/bare-note.md`

- [ ] **Step 7: Vault doctor test — AGENT.md drift detection (spec item 9)**

```bash
# Add a fake person to AGENT.md without creating a People/ note
echo '| [[Ghost Person]] | Unknown |' >> /tmp/byoao-final-vault/AGENT.md
node -e "
import { getVaultDiagnosis } from './dist/vault/doctor.js';
const r = await getVaultDiagnosis('/tmp/byoao-final-vault');
const drift = r.issues.filter(i => i.category === 'agent-drift');
console.log('Agent drift issues:', drift.length);
drift.forEach(i => console.log(' ', i.message));
"
```

Expected: Agent drift issue for `[[Ghost Person]]`

- [ ] **Step 8: Vault doctor test — orphan note detection (spec item 10)**

```bash
# Create a disconnected note (no wikilinks in or out)
cat > /tmp/byoao-final-vault/Inbox/orphan-test.md << 'EOF'
---
title: Orphan Test
type: note
tags: [test]
---

This note has no wikilinks.
EOF
node -e "
import { getVaultDiagnosis } from './dist/vault/doctor.js';
const r = await getVaultDiagnosis('/tmp/byoao-final-vault');
const orphans = r.issues.filter(i => i.category === 'orphan' && i.file?.includes('orphan-test'));
console.log('Orphan issues for orphan-test:', orphans.length);
orphans.forEach(i => console.log(' ', i.message));
"
```

Expected: Orphan issue for `Inbox/orphan-test.md`

- [ ] **Step 9: Version check**

```bash
node -e "import pkg from './package.json' assert { type: 'json' }; console.log(pkg.version);"
```

Expected: `0.2.0`

- [ ] **Step 10: Final commit if any fixes needed**
