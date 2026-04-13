import { fs } from "../lib/cjs-modules.js";
import path from "node:path";
import { renderTemplate, today } from "./template.js";
import { loadPreset, getCommonDir } from "./preset.js";
import { configureMcp, type ConfigureMcpResult, type ConfigureMcpOptions } from "./mcp.js";
import { configureObsidianPlugins, type ConfigurePluginsResult } from "./obsidian-plugins.js";
import { configureProvider, type ConfigureProviderResult } from "./provider.js";
import { writeManifest, type InstalledFiles } from "./manifest.js";
import type { VaultConfig, PresetConfig } from "../plugin-config.js";
import { detectInitMode } from "./vault-detect.js";
import { copyIndexBaseExampleIfMissing } from "./index-base-example.js";

function countWikilinks(content: string): number {
  const stripped = content
    .replace(/```[\s\S]*?```/g, "")
    .replace(/`[^`]+`/g, "");
  const matches = stripped.match(/\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g);
  return matches ? matches.length : 0;
}

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

interface McpServiceInfo {
  name: string;
  description: string;
}

interface CreateContext {
  vaultPath: string;
  kbName: string;
  commonDir: string;
  preserveObsidian: boolean;
  filesCreated: number;
  directories: string[];
  installedFiles: InstalledFiles;
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

export async function createMinimalCore(ctx: CreateContext): Promise<void> {
  // Copy .obsidian config from common (skip if preserving existing vault config)
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

  // Generate Start Here.md
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
 * Create LLM Wiki core: 4 agent directories, SCHEMA.md, log.md.
 * Always runs regardless of preset — this is built-in BYOAO capability.
 */
export async function createLlmWikiCore(ctx: CreateContext, wikiDomain: string = ""): Promise<void> {
  const agentDirs = ["entities", "concepts", "comparisons", "queries"];
  for (const dir of agentDirs) {
    const dirPath = path.join(ctx.vaultPath, dir);
    if (!(await fs.pathExists(dirPath))) {
      await fs.ensureDir(dirPath);
      ctx.filesCreated++;
      ctx.directories.push(dir);
    }
  }

  // Create SCHEMA.md from template
  const schemaTemplatePath = path.join(ctx.commonDir, "SCHEMA.md.hbs");
  if (await fs.pathExists(schemaTemplatePath)) {
    const schemaTemplate = await fs.readFile(schemaTemplatePath, "utf-8");
    const schemaContent = renderTemplate(schemaTemplate, {
      KB_NAME: ctx.kbName,
      WIKI_DOMAIN: wikiDomain || "",
    });
    const schemaPath = path.join(ctx.vaultPath, "SCHEMA.md");
    if (!(await fs.pathExists(schemaPath))) {
      await fs.writeFile(schemaPath, schemaContent);
      ctx.filesCreated++;
    }
  }

  // Create log.md
  const logContent = `# Agent Activity Log

Entries are appended here during /cook operations.

`;
  const logPath = path.join(ctx.vaultPath, "log.md");
  if (!(await fs.pathExists(logPath))) {
    await fs.writeFile(logPath, logContent);
    ctx.filesCreated++;
  }

  if (await copyIndexBaseExampleIfMissing(ctx.vaultPath, ctx.commonDir)) {
    ctx.filesCreated++;
  }
}

export async function createAgentsMd(
  ctx: CreateContext,
  ownerName: string,
  presetConfig: PresetConfig,
  presetDir: string,
): Promise<void> {
  const agentsTemplate = await fs.readFile(
    path.join(ctx.commonDir, "AGENTS.md.hbs"),
    "utf-8",
  );

  let roleSection = "";
  const agentSectionPath = path.join(presetDir, "agent-section.hbs");
  if (await fs.pathExists(agentSectionPath)) {
    const agentSectionTemplate = await fs.readFile(agentSectionPath, "utf-8");
    roleSection = renderTemplate(agentSectionTemplate, {
      PROJECTS: "(Use /cook to discover projects from your notes)",
      JIRA_HOST: "",
      JIRA_PROJECT: "",
      HAS_JIRA: false,
    });
  }

  const agentsContent = renderTemplate(agentsTemplate, {
    KB_NAME: ctx.kbName,
    OWNER_NAME: ownerName,
    ROLE_SECTION: roleSection,
  });

  const agentsMdPath = path.join(ctx.vaultPath, "AGENTS.md");
  if (!(await fs.pathExists(agentsMdPath))) {
    await fs.writeFile(agentsMdPath, agentsContent);
    ctx.filesCreated++;
  }
}

export async function applyPresetOverlay(
  ctx: CreateContext,
  presetConfig: PresetConfig,
  presetDir: string,
): Promise<string[]> {
  for (const dir of presetConfig.directories) {
    await fs.ensureDir(path.join(ctx.vaultPath, dir));
  }
  ctx.directories.push(...presetConfig.directories);

  const allTemplateNames: string[] = [];

  const presetTemplatesDir = path.join(presetDir, "templates");
  if (await fs.pathExists(presetTemplatesDir)) {
    const templateDest = path.join(ctx.vaultPath, "templates");
    await fs.ensureDir(templateDest);
    const files = await fs.readdir(presetTemplatesDir);
    for (const file of files) {
      await fs.copy(
        path.join(presetTemplatesDir, file),
        path.join(templateDest, file),
        { overwrite: false },
      );
      allTemplateNames.push(file.replace(/\.md$/, ""));
      ctx.filesCreated++;
      ctx.installedFiles.templates.push(`templates/${file}`);
    }
  }

  return allTemplateNames;
}

// ---------------------------------------------------------------------------
// Main orchestrator
// ---------------------------------------------------------------------------

export async function createVault(config: VaultConfig): Promise<CreateVaultResult> {
  const { kbName, vaultPath, preset } = config;
  const presetName = preset ?? "minimal";
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

  // 1. Create minimal core (.obsidian, Start Here)
  await createMinimalCore(ctx);

  // 2. Create LLM Wiki core (agent dirs, SCHEMA.md, log.md) — always, regardless of preset
  await createLlmWikiCore(ctx, config.wikiDomain);

  // 3. Apply preset overlay (role-specific dirs + templates)
  await applyPresetOverlay(ctx, presetConfig, presetDir);

  // 4. Generate AGENTS.md
  await createAgentsMd(ctx, config.ownerName, presetConfig, presetDir);

  // 5. Configure vault as OpenCode project (plugin + skills + commands)
  await configureOpenCodeProject(ctx.vaultPath, ctx.installedFiles);

  // 6. Configure MCP servers in global OpenCode config
  const mcpOptions: ConfigureMcpOptions = {};
  if (config.mcpSkip && config.mcpSkip.length > 0) {
    mcpOptions.skip = config.mcpSkip;
  }
  if (config.gcpProjectId) {
    mcpOptions.vars = { GCP_PROJECT_ID: config.gcpProjectId };
  }
  const mcpResult = await configureMcp(presetConfig, mcpOptions);

  // 7. Install Obsidian community plugins from preset
  const pluginsResult = await configureObsidianPlugins(ctx.vaultPath, presetConfig);

  // 8. Configure AI provider in global OpenCode config
  let providerResult: ConfigureProviderResult | null = null;
  if (config.provider && config.provider !== "skip") {
    providerResult = await configureProvider(
      config.provider,
      config.provider === "gemini" ? config.gcpProjectId : undefined,
    );
  }

  // 9. Write BYOAO manifest
  await writeManifest(ctx.vaultPath, presetName, ctx.installedFiles);

  // 10. Count wikilinks from all generated markdown files
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

async function configureOpenCodeProject(
  vaultPath: string,
  installedFiles: InstalledFiles,
): Promise<void> {
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

  const byoaoSkillsSrc = path.join(assetsDir, "skills");

  if (await fs.pathExists(byoaoSkillsSrc)) {
    const entries = await fs.readdir(byoaoSkillsSrc, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const srcSkill = path.join(byoaoSkillsSrc, entry.name, "SKILL.md");
        if (await fs.pathExists(srcSkill)) {
          const destDir = path.join(skillsDest, entry.name);
          await fs.ensureDir(destDir);
          await fs.copy(srcSkill, path.join(destDir, "SKILL.md"), { overwrite: true });
          installedFiles.skills.push(`.opencode/skills/${entry.name}/SKILL.md`);
        }
      }
    }
  }
}

function resolveAssetsDir(): string {
  // When running from dist/ (bundled): dist/assets
  const distAssets = path.resolve(import.meta.dirname, "assets");
  // When running from dist/ via tsc only: ../assets
  const srcAssets = path.resolve(import.meta.dirname, "..", "assets");
  // When running from src/ via tsx: ../../src/assets
  const devAssets = path.resolve(import.meta.dirname, "..", "..", "src", "assets");

  if (fs.existsSync(distAssets)) return distAssets;
  if (fs.existsSync(srcAssets)) return srcAssets;
  if (fs.existsSync(devAssets)) return devAssets;
  return distAssets;
}
