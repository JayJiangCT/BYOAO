import fs from "fs-extra";
import path from "node:path";
import { renderTemplate, today } from "./template.js";
import { loadPreset, getCommonDir } from "./preset.js";
import { configureMcp, type ConfigureMcpResult } from "./mcp.js";
import { configureObsidianPlugins, type ConfigurePluginsResult } from "./obsidian-plugins.js";
import { configureProvider, type ConfigureProviderResult } from "./provider.js";
import { writeManifest, type InstalledFiles } from "./manifest.js";
import type { VaultConfig } from "../plugin-config.js";

function countWikilinks(content: string): number {
  const stripped = content
    .replace(/```[\s\S]*?```/g, "")
    .replace(/`[^`]+`/g, "");
  const matches = stripped.match(/\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g);
  return matches ? matches.length : 0;
}

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
  mcpResult: ConfigureMcpResult | null;
  pluginsResult: ConfigurePluginsResult | null;
  providerResult: ConfigureProviderResult | null;
}

export async function createVault(config: VaultConfig): Promise<CreateVaultResult> {
  const { teamName, vaultPath, members, projects, glossaryEntries, jiraHost, jiraProject, preset } = config;
  const presetName = preset ?? "pm-tpm"; // Fallback if config wasn't parsed through Zod
  const { config: presetConfig, presetsDir } = loadPreset(presetName);
  const commonDir = getCommonDir();
  const presetDir = path.join(presetsDir, presetName);
  let filesCreated = 0;
  const installedFiles: InstalledFiles = {
    skills: [],
    commands: [],
    obsidianConfig: [],
    templates: [],
  };

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
    const obsidianFiles = await fs.readdir(obsidianSrc);
    for (const f of obsidianFiles) {
      installedFiles.obsidianConfig.push(`.obsidian/${f}`);
    }
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
      installedFiles.templates.push(`Knowledge/templates/${file}`);
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
      installedFiles.templates.push(`Knowledge/templates/${file}`);
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
  const glossaryPath = path.join(vaultPath, "Knowledge/Glossary.md");
  if (!(await fs.pathExists(glossaryPath))) {
    await fs.writeFile(glossaryPath, glossaryContent);
    filesCreated++;
  }

  // 5. Generate Start Here.md
  const startHereTemplate = await fs.readFile(
    path.join(commonDir, "Start Here.md.hbs"),
    "utf-8"
  );
  const startHereContent = renderTemplate(startHereTemplate, { TEAM_NAME: teamName });
  const startHerePath = path.join(vaultPath, "Start Here.md");
  if (!(await fs.pathExists(startHerePath))) {
    await fs.writeFile(startHerePath, startHereContent);
    filesCreated++;
  }

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

  // Build team table
  let teamTable: string;
  if (members.length > 0) {
    const rows = members.map((m) => `| [[${m.name}]] | ${m.role} |`).join("\n");
    teamTable = `| Name | Role |\n|------|------|\n${rows}`;

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
    JIRA_PROJECT: jiraProject,
    HAS_JIRA: !!(jiraHost && jiraProject),
  });
  const agentMdPath = path.join(vaultPath, "AGENT.md");
  const claudeMdPath = path.join(vaultPath, "CLAUDE.md");
  if (!(await fs.pathExists(agentMdPath))) {
    await fs.writeFile(agentMdPath, agentContent);
    filesCreated++;
  }
  if (!(await fs.pathExists(claudeMdPath))) {
    await fs.writeFile(claudeMdPath, agentContent);
    filesCreated++;
  }

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
    const memberPath = path.join(vaultPath, `People/${member.name}.md`);
    if (!(await fs.pathExists(memberPath))) {
      await fs.writeFile(memberPath, content);
      filesCreated++;
    }
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
    const projectPath = path.join(vaultPath, `Projects/${project.name}.md`);
    if (!(await fs.pathExists(projectPath))) {
      await fs.writeFile(projectPath, content);
      filesCreated++;
    }
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

    const teamIndexPath = path.join(vaultPath, `People/${teamName} Team.md`);
    if (!(await fs.pathExists(teamIndexPath))) {
      await fs.writeFile(teamIndexPath, teamIndexContent);
      filesCreated++;
    }
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

  for (const dir of dirsNeedingGitkeep) {
    const dirPath = path.join(vaultPath, dir);
    if (await fs.pathExists(dirPath)) {
      const files = await fs.readdir(dirPath);
      if (files.length === 0) {
        await fs.writeFile(path.join(dirPath, ".gitkeep"), "");
      }
    }
  }

  // 11. Configure vault as OpenCode project (plugin + skills + commands)
  await configureOpenCodeProject(vaultPath, installedFiles);

  // 12. Configure MCP servers in global OpenCode config
  const mcpResult = await configureMcp(presetConfig);

  // 13. Install Obsidian community plugins from preset
  const pluginsResult = await configureObsidianPlugins(vaultPath, presetConfig);

  // 14. Configure AI provider in global OpenCode config
  let providerResult: ConfigureProviderResult | null = null;
  if (config.provider && config.provider !== "skip") {
    providerResult = await configureProvider(
      config.provider,
      config.provider === "gemini" ? config.gcpProjectId : undefined
    );
  }

  // 15. Write BYOAO manifest
  await writeManifest(vaultPath, presetName, installedFiles);

  // 16. Count wikilinks from all generated markdown files
  let wikilinksCreated = 0;
  const entries = await fs.readdir(vaultPath, { recursive: true });
  for (const entry of entries) {
    const entryStr = String(entry);
    if (entryStr.endsWith(".md") && !entryStr.startsWith(".obsidian")) {
      const content = await fs.readFile(path.join(vaultPath, entryStr), "utf-8");
      wikilinksCreated += countWikilinks(content);
    }
  }

  return {
    vaultPath,
    filesCreated,
    wikilinksCreated,
    directories: allDirectories,
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
  if (!plugins.includes("byoao")) {
    plugins.push("byoao");
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
        await fs.copy(
          path.join(obsidianSkillsSrc, file),
          path.join(skillsDest, file),
          { overwrite: true }
        );
        installedFiles.skills.push(`.opencode/skills/${file}`);
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
          { overwrite: true }
        );
        installedFiles.commands.push(`.opencode/commands/${file}`);
      }
    }
  }
}

function resolveAssetsDir(): string {
  const srcAssets = path.resolve(import.meta.dirname, "..", "assets");
  const distAssets = path.resolve(
    import.meta.dirname, "..", "..", "src", "assets"
  );
  if (fs.existsSync(srcAssets)) return srcAssets;
  if (fs.existsSync(distAssets)) return distAssets;
  return srcAssets;
}
