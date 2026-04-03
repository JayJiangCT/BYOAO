import { fs } from "../lib/cjs-modules.js";
import path from "node:path";
import { renderTemplate, today } from "./template.js";
import { loadPreset, getCommonDir } from "./preset.js";
import { configureMcp, type ConfigureMcpResult, type ConfigureMcpOptions } from "./mcp.js";
import { configureObsidianPlugins, type ConfigurePluginsResult } from "./obsidian-plugins.js";
import { configureProvider, type ConfigureProviderResult } from "./provider.js";
import { writeManifest, type InstalledFiles } from "./manifest.js";
import type { VaultConfig, PresetConfig, Member, Project, GlossaryEntry } from "../plugin-config.js";
import { detectInitMode } from "./vault-detect.js";

function countWikilinks(content: string): number {
  const stripped = content
    .replace(/```[\s\S]*?```/g, "")
    .replace(/`[^`]+`/g, "");
  const matches = stripped.match(/\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g);
  return matches ? matches.length : 0;
}

// Minimal directories: the core of every knowledge base
const MINIMAL_DIRECTORIES = [
  "Daily",
  "Knowledge",
  "Knowledge/templates",
];

export interface CreateVaultResult {
  vaultPath: string;
  filesCreated: number;
  wikilinksCreated: number;
  directories: string[];
  initMode: import("./vault-detect.js").InitMode;
  mcpResult: ConfigureMcpResult | null;
  pluginsResult: ConfigurePluginsResult | null;
  providerResult: ConfigureProviderResult | null;
}

/**
 * Mutable context passed through composable creation functions.
 */
interface McpServiceInfo {
  name: string;
  description: string;
}

interface CreateContext {
  vaultPath: string;
  kbName: string;
  commonDir: string;
  /** When true, .obsidian/ already exists — skip overwriting it */
  preserveObsidian: boolean;
  filesCreated: number;
  directories: string[];
  installedFiles: InstalledFiles;
  /** MCP services to display in Start Here.md */
  mcpServices: McpServiceInfo[];
}

function makeContext(vaultPath: string, kbName: string, preserveObsidian = false): CreateContext {
  return {
    vaultPath,
    kbName,
    commonDir: getCommonDir(),
    preserveObsidian,
    filesCreated: 0,
    directories: [],
    installedFiles: {
      skills: [],
      commands: [],
      obsidianConfig: [],
      templates: [],
    },
    mcpServices: [],
  };
}

const MCP_DISPLAY_NAMES: Record<string, { name: string; description: string }> = {
  atlassian: { name: "Atlassian", description: "Jira issues, Confluence pages" },
  bigquery: { name: "BigQuery", description: "Data warehouse queries and analysis" },
};

// ---------------------------------------------------------------------------
// Composable creation functions
// ---------------------------------------------------------------------------

/**
 * Create the minimal core: directories, .obsidian/ config, common templates,
 * Glossary.md, Start Here.md.
 */
export async function createMinimalCore(
  ctx: CreateContext,
  glossaryEntries: GlossaryEntry[] = [],
): Promise<void> {
  // 1. Create minimal directories
  for (const dir of MINIMAL_DIRECTORIES) {
    await fs.ensureDir(path.join(ctx.vaultPath, dir));
  }
  ctx.directories.push(...MINIMAL_DIRECTORIES);

  // 2. Copy .obsidian config from common (skip if preserving existing vault config)
  if (!ctx.preserveObsidian) {
    await fs.ensureDir(path.join(ctx.vaultPath, ".obsidian"));
    const obsidianSrc = path.join(ctx.commonDir, "obsidian");
    if (await fs.pathExists(obsidianSrc)) {
      await fs.copy(obsidianSrc, path.join(ctx.vaultPath, ".obsidian"), { overwrite: false });
      const obsidianFiles = await fs.readdir(obsidianSrc);
      ctx.filesCreated += obsidianFiles.length;
      for (const f of obsidianFiles) {
        ctx.installedFiles.obsidianConfig.push(`.obsidian/${f}`);
      }
    }
  }

  // 3. Copy common templates
  const templateDest = path.join(ctx.vaultPath, "Knowledge/templates");
  const commonTemplatesDir = path.join(ctx.commonDir, "templates");
  if (await fs.pathExists(commonTemplatesDir)) {
    const files = await fs.readdir(commonTemplatesDir);
    for (const file of files) {
      await fs.copy(
        path.join(commonTemplatesDir, file),
        path.join(templateDest, file),
        { overwrite: false },
      );
      ctx.filesCreated++;
      ctx.installedFiles.templates.push(`Knowledge/templates/${file}`);
    }
  }

  // 4. Generate Glossary.md
  const glossaryTemplate = await fs.readFile(
    path.join(ctx.commonDir, "Glossary.md.hbs"),
    "utf-8",
  );
  let glossaryRows = "";
  if (glossaryEntries.length > 0) {
    glossaryRows = glossaryEntries
      .map((e) => `| **${e.term}** | ${e.definition} | ${e.domain} |`)
      .join("\n");
  }
  const glossaryContent = renderTemplate(glossaryTemplate, {
    KB_NAME: ctx.kbName,
    date: today(),
    GLOSSARY_ENTRIES: glossaryRows,
  });
  const glossaryPath = path.join(ctx.vaultPath, "Knowledge/Glossary.md");
  if (!(await fs.pathExists(glossaryPath))) {
    await fs.writeFile(glossaryPath, glossaryContent);
    ctx.filesCreated++;
  }

  // 5. Generate Start Here.md
  const startHereTemplate = await fs.readFile(
    path.join(ctx.commonDir, "Start Here.md.hbs"),
    "utf-8",
  );
  const startHereContent = renderTemplate(startHereTemplate, {
    KB_NAME: ctx.kbName,
    HAS_MCP_SERVICES: ctx.mcpServices.length > 0,
    MCP_SERVICES: ctx.mcpServices,
  });
  const startHerePath = path.join(ctx.vaultPath, "Start Here.md");
  if (!(await fs.pathExists(startHerePath))) {
    await fs.writeFile(startHerePath, startHereContent);
    ctx.filesCreated++;
  }
}

/**
 * Generate AGENT.md from the common skeleton + preset section.
 */
export async function createAgentMd(
  ctx: CreateContext,
  ownerName: string,
  presetConfig: PresetConfig,
  presetDir: string,
  projects: Project[],
  jiraHost: string,
  jiraProject: string,
): Promise<void> {
  const agentSkeletonTemplate = await fs.readFile(
    path.join(ctx.commonDir, "AGENT.md.hbs"),
    "utf-8",
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
    } else {
      projectsList = "(No projects added yet — create notes in Projects/)";
    }

    roleSection = renderTemplate(agentSectionTemplate, {
      PROJECTS: projectsList,
      JIRA_HOST: jiraHost,
      JIRA_PROJECT: jiraProject,
      HAS_JIRA: !!(jiraHost && jiraProject),
    });
  }

  const agentContent = renderTemplate(agentSkeletonTemplate, {
    KB_NAME: ctx.kbName,
    OWNER_NAME: ownerName,
    ROLE_SECTION: roleSection,
  });

  const agentMdPath = path.join(ctx.vaultPath, "AGENT.md");
  if (!(await fs.pathExists(agentMdPath))) {
    await fs.writeFile(agentMdPath, agentContent);
    ctx.filesCreated++;
  }
}

/**
 * Apply preset overlay: create preset-specific directories and copy preset templates.
 * Returns the list of all template names (common + preset) for AGENT.md generation.
 */
export async function applyPresetOverlay(
  ctx: CreateContext,
  presetConfig: PresetConfig,
  presetDir: string,
): Promise<string[]> {
  // Create preset-specific directories
  for (const dir of presetConfig.directories) {
    await fs.ensureDir(path.join(ctx.vaultPath, dir));
  }
  ctx.directories.push(...presetConfig.directories);

  // Collect common template names already installed
  const templateDest = path.join(ctx.vaultPath, "Knowledge/templates");
  const allTemplateNames: string[] = [];

  // Read existing common templates (already copied by createMinimalCore)
  if (await fs.pathExists(templateDest)) {
    const existing = await fs.readdir(templateDest);
    for (const file of existing) {
      if (file.endsWith(".md")) {
        allTemplateNames.push(file.replace(/\.md$/, ""));
      }
    }
  }

  // Copy preset templates
  const presetTemplatesDir = path.join(presetDir, "templates");
  if (await fs.pathExists(presetTemplatesDir)) {
    const files = await fs.readdir(presetTemplatesDir);
    for (const file of files) {
      await fs.copy(
        path.join(presetTemplatesDir, file),
        path.join(templateDest, file),
        { overwrite: false },
      );
      allTemplateNames.push(file.replace(/\.md$/, ""));
      ctx.filesCreated++;
      ctx.installedFiles.templates.push(`Knowledge/templates/${file}`);
    }
  }

  return allTemplateNames;
}

/**
 * Create people notes from members config.
 * Ensures People/ directory exists.
 */
export async function createPeopleNotes(
  ctx: CreateContext,
  members: Member[],
): Promise<void> {
  if (members.length === 0) return;

  await fs.ensureDir(path.join(ctx.vaultPath, "People"));
  if (!ctx.directories.includes("People")) {
    ctx.directories.push("People");
  }

  for (const member of members) {
    const content = `---
title: "${member.name}"
type: person
team: "${ctx.kbName}"
role: "${member.role}"
status: active
tags: [person]
---

# ${member.name}

**Role**: ${member.role}
**Team**: ${ctx.kbName}
`;
    const memberPath = path.join(ctx.vaultPath, `People/${member.name}.md`);
    if (!(await fs.pathExists(memberPath))) {
      await fs.writeFile(memberPath, content);
      ctx.filesCreated++;
    }
  }
}

/**
 * Create project notes from projects config.
 * Ensures Projects/ directory exists.
 */
export async function createProjectNotes(
  ctx: CreateContext,
  projects: Project[],
): Promise<void> {
  if (projects.length === 0) return;

  await fs.ensureDir(path.join(ctx.vaultPath, "Projects"));
  if (!ctx.directories.includes("Projects")) {
    ctx.directories.push("Projects");
  }

  for (const project of projects) {
    const content = `---
title: "${project.name}"
type: feature
status: active
date: ${today()}
team: "${ctx.kbName}"
jira: ""
stakeholders: []
priority: ""
tags: [project]
---

# ${project.name}

${project.description}
`;
    const projectPath = path.join(ctx.vaultPath, `Projects/${project.name}.md`);
    if (!(await fs.pathExists(projectPath))) {
      await fs.writeFile(projectPath, content);
      ctx.filesCreated++;
    }
  }
}

/**
 * Create team index note in People/.
 * Only call when the vault has a People/ directory (preset includes it or members exist).
 */
export async function createTeamIndex(
  ctx: CreateContext,
  members: Member[],
  projects: Project[],
): Promise<void> {
  await fs.ensureDir(path.join(ctx.vaultPath, "People"));
  if (!ctx.directories.includes("People")) {
    ctx.directories.push("People");
  }

  let teamIndexContent = `---
title: "${ctx.kbName} Team"
type: reference
team: "${ctx.kbName}"
tags: [team]
---

# ${ctx.kbName} Team

## Members

`;
  if (members.length > 0) {
    teamIndexContent += "| Name | Role |\n|------|------|\n";
    teamIndexContent += members.map((m) => `| [[${m.name}]] | ${m.role} |`).join("\n");
  } else {
    teamIndexContent += "(No members added yet)";
  }

  teamIndexContent += "\n\n## Active Projects\n\n";
  if (projects.length > 0) {
    teamIndexContent += projects
      .map((p) => `- [[${p.name}]] — ${p.description}`)
      .join("\n");
  } else {
    teamIndexContent += "(No projects added yet)";
  }
  teamIndexContent += "\n";

  const teamIndexPath = path.join(ctx.vaultPath, `People/${ctx.kbName} Team.md`);
  if (!(await fs.pathExists(teamIndexPath))) {
    await fs.writeFile(teamIndexPath, teamIndexContent);
    ctx.filesCreated++;
  }
}

// ---------------------------------------------------------------------------
// Main orchestrator
// ---------------------------------------------------------------------------

export async function createVault(config: VaultConfig): Promise<CreateVaultResult> {
  const { kbName, vaultPath, members, projects, glossaryEntries, jiraHost, jiraProject, preset } = config;
  const presetName = preset ?? "pm-tpm"; // Fallback if config wasn't parsed through Zod
  const { config: presetConfig, presetsDir } = loadPreset(presetName);
  const presetDir = path.join(presetsDir, presetName);

  const initMode = detectInitMode(vaultPath);
  const preserveObsidian = initMode === "obsidian-vault";
  const ctx = makeContext(vaultPath, kbName, preserveObsidian);

  // Populate MCP service info for Start Here.md rendering
  const skipSet = new Set(config.mcpSkip ?? []);
  for (const name of Object.keys(presetConfig.mcpServers)) {
    if (!skipSet.has(name)) {
      const info = MCP_DISPLAY_NAMES[name] ?? { name, description: `${name} service` };
      ctx.mcpServices.push(info);
    }
  }

  // 1. Create minimal core (dirs, .obsidian, common templates, Glossary, Start Here)
  await createMinimalCore(ctx, glossaryEntries);

  // 2. Apply preset overlay (preset dirs + preset templates)
  const allTemplateNames = await applyPresetOverlay(ctx, presetConfig, presetDir);

  // 3. Generate AGENT.md
  await createAgentMd(ctx, config.ownerName, presetConfig, presetDir, projects, jiraHost, jiraProject);

  // 4. Create people notes (conditional)
  await createPeopleNotes(ctx, members);

  // 5. Create project notes (conditional)
  await createProjectNotes(ctx, projects);

  // 6. Create team index (only when preset declares People/ or members exist)
  const hasPeopleDir = presetConfig.directories.includes("People") || members.length > 0;
  if (hasPeopleDir) {
    await createTeamIndex(ctx, members, projects);
  }

  // 7. Configure vault as OpenCode project (plugin + skills + commands)
  await configureOpenCodeProject(ctx.vaultPath, ctx.installedFiles);

  // 8. Configure MCP servers in global OpenCode config
  const mcpOptions: ConfigureMcpOptions = {};
  if (config.mcpSkip && config.mcpSkip.length > 0) {
    mcpOptions.skip = config.mcpSkip;
  }
  if (config.gcpProjectId) {
    mcpOptions.vars = { GCP_PROJECT_ID: config.gcpProjectId };
  }
  const mcpResult = await configureMcp(presetConfig, mcpOptions);

  // 9. Install Obsidian community plugins from preset
  const pluginsResult = await configureObsidianPlugins(ctx.vaultPath, presetConfig);

  // 10. Configure AI provider in global OpenCode config
  let providerResult: ConfigureProviderResult | null = null;
  if (config.provider && config.provider !== "skip") {
    providerResult = await configureProvider(
      config.provider,
      config.provider === "gemini" ? config.gcpProjectId : undefined,
    );
  }

  // 11. Write BYOAO manifest
  await writeManifest(ctx.vaultPath, presetName, ctx.installedFiles);

  // 12. Count wikilinks from all generated markdown files
  let wikilinksCreated = 0;
  const entries = await fs.readdir(ctx.vaultPath, { recursive: true });
  for (const entry of entries) {
    const entryStr = String(entry);
    if (entryStr.endsWith(".md") && !entryStr.startsWith(".obsidian")) {
      const content = await fs.readFile(path.join(ctx.vaultPath, entryStr), "utf-8");
      wikilinksCreated += countWikilinks(content);
    }
  }

  return {
    vaultPath: ctx.vaultPath,
    filesCreated: ctx.filesCreated,
    wikilinksCreated,
    directories: ctx.directories,
    initMode,
    mcpResult,
    pluginsResult,
    providerResult,
  };
}

/**
 * Configure the vault directory as an OpenCode project.
 * Creates .opencode.json with BYOAO plugin registered,
 * and copies skills + commands so BYOAO tools work when
 * OpenCode is launched from the vault (including via Agent Client).
 */
async function configureOpenCodeProject(
  vaultPath: string,
  installedFiles: InstalledFiles,
): Promise<void> {
  // 1. Write .opencode.json with BYOAO plugin
  const configPath = path.join(vaultPath, ".opencode.json");
  let config: Record<string, unknown> = {};
  if (await fs.pathExists(configPath)) {
    try {
      config = await fs.readJson(configPath);
    } catch {
      // Invalid JSON — start fresh
    }
  }
  const plugins = (config.plugin as string[] | undefined) || [];
  if (!plugins.includes("@jayjiang/byoao")) {
    plugins.push("@jayjiang/byoao");
    config.plugin = plugins;
  }
  await fs.writeJson(configPath, config, { spaces: 2 });

  // 2. Copy Obsidian Skills
  const assetsDir = resolveAssetsDir();
  const obsidianSkillsSrc = path.join(assetsDir, "obsidian-skills");
  const skillsDest = path.join(vaultPath, ".opencode", "skills");

  if (await fs.pathExists(obsidianSkillsSrc)) {
    await fs.ensureDir(skillsDest);
    const files = await fs.readdir(obsidianSkillsSrc);
    for (const file of files) {
      if (file.endsWith(".md")) {
        const skillName = file.replace(/\.md$/, "");
        const destDir = path.join(skillsDest, skillName);
        await fs.ensureDir(destDir);
        await fs.copy(
          path.join(obsidianSkillsSrc, file),
          path.join(destDir, "SKILL.md"),
          { overwrite: true },
        );
        installedFiles.skills.push(`.opencode/skills/${skillName}/SKILL.md`);
      }
    }
  }

  // 3. Copy BYOAO commands
  const byoaoSkillsSrc = path.join(assetsDir, "..", "skills");
  const commandsDest = path.join(vaultPath, ".opencode", "commands");

  if (await fs.pathExists(byoaoSkillsSrc)) {
    await fs.ensureDir(commandsDest);
    const files = await fs.readdir(byoaoSkillsSrc);
    for (const file of files) {
      if (file.endsWith(".md")) {
        await fs.copy(
          path.join(byoaoSkillsSrc, file),
          path.join(commandsDest, file),
          { overwrite: true },
        );
        installedFiles.commands.push(`.opencode/commands/${file}`);
      }
    }
  }
}

function resolveAssetsDir(): string {
  const srcAssets = path.resolve(import.meta.dirname, "..", "assets");
  const distAssets = path.resolve(
    import.meta.dirname, "..", "..", "src", "assets",
  );
  if (fs.existsSync(srcAssets)) return srcAssets;
  if (fs.existsSync(distAssets)) return distAssets;
  return srcAssets;
}
