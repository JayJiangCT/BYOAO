import { fs } from "../lib/cjs-modules.js";
import path from "node:path";
import {
  readManifest,
  writeManifest,
  getPackageVersion,
  type Manifest,
  type InstalledFiles,
} from "./manifest.js";
import { loadPreset, getCommonDir } from "./preset.js";
import { renderTemplate } from "./template.js";
import { detectVaultContext } from "./vault-detect.js";

// ── Constants ───────────────────────────────────────────────────

const OBSIDIAN_CONFIG_FILES = ["core-plugins.json"];

// ── Types ───────────────────────────────────────────────────────

export interface UpgradePlanItem {
  /** Relative path from vault root */
  file: string;
  /** What to do with this file */
  action: "add" | "update" | "deprecated";
  /** Which infrastructure category */
  category: "skills" | "commands" | "obsidianConfig" | "templates";
}

export interface UpgradePlan {
  fromVersion: string;
  toVersion: string;
  items: UpgradePlanItem[];
}

export interface UpgradeVaultResult {
  fromVersion: string;
  toVersion: string;
  added: string[];
  updated: string[];
  deprecated: string[];
  errors: Array<{ file: string; error: string }>;
  dryRun: boolean;
}

export interface UpgradeOptions {
  preset?: string;
  dryRun?: boolean;
  force?: boolean;
}

// ── Scanning ────────────────────────────────────────────────────

/** Scan vault for installed infrastructure files. Returns relative paths. */
export async function scanInstalledAssets(
  vaultPath: string
): Promise<InstalledFiles> {
  const skills = await scanSkillDirs(vaultPath);
  const commands = await scanDir(vaultPath, ".opencode/commands", ".md");
  const templates = await scanDir(vaultPath, "Knowledge/templates", ".md");

  const obsidianConfig: string[] = [];
  for (const file of OBSIDIAN_CONFIG_FILES) {
    const abs = path.join(vaultPath, ".obsidian", file);
    if (await fs.pathExists(abs)) {
      obsidianConfig.push(`.obsidian/${file}`);
    }
  }

  return { skills, commands, obsidianConfig, templates };
}

async function scanDir(
  vaultPath: string,
  relDir: string,
  ext: string
): Promise<string[]> {
  const absDir = path.join(vaultPath, relDir);
  if (!(await fs.pathExists(absDir))) return [];

  const files = await fs.readdir(absDir);
  return files
    .filter((f) => f.endsWith(ext))
    .map((f) => `${relDir}/${f}`);
}

/** Scan skills in the OpenCode skills/<name>/SKILL.md layout. */
async function scanSkillDirs(vaultPath: string): Promise<string[]> {
  const skillsRoot = path.join(vaultPath, ".opencode", "skills");
  if (!(await fs.pathExists(skillsRoot))) return [];

  const results: string[] = [];
  const entries = await fs.readdir(skillsRoot, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory()) {
      const skillMd = path.join(skillsRoot, entry.name, "SKILL.md");
      if (await fs.pathExists(skillMd)) {
        results.push(`.opencode/skills/${entry.name}/SKILL.md`);
      }
    }
  }
  return results;
}

// ── Bootstrap ───────────────────────────────────────────────────

const DEFAULT_PRESET = "minimal";

/** Bootstrap a manifest for vaults created before the manifest existed. */
export async function bootstrapManifest(
  vaultPath: string,
  preset?: string
): Promise<Manifest> {
  const installedFiles = await scanInstalledAssets(vaultPath);
  await writeManifest(vaultPath, preset ?? DEFAULT_PRESET, installedFiles, "0.0.0");
  const manifest = await readManifest(vaultPath);
  return manifest!;
}

// ── Types for package asset resolution ──────────────────────────

export interface PackageAssetEntry {
  relativePath: string;
  sourcePath: string;
}

export interface PackageAssets {
  skills: PackageAssetEntry[];
  commands: PackageAssetEntry[];
  obsidianConfig: PackageAssetEntry[];
  templates: PackageAssetEntry[];
}

// ── Plan Building ───────────────────────────────────────────────

/** Build an upgrade plan by comparing package assets against vault state. */
export function buildUpgradePlan(
  vaultPath: string,
  manifest: Manifest,
  packageAssets: PackageAssets
): UpgradePlan {
  const items: UpgradePlanItem[] = [];
  const pkgVersion = getPackageVersion();

  const categories: Array<{
    key: keyof PackageAssets;
    category: UpgradePlanItem["category"];
  }> = [
    { key: "skills", category: "skills" },
    { key: "commands", category: "commands" },
    { key: "obsidianConfig", category: "obsidianConfig" },
    { key: "templates", category: "templates" },
  ];

  for (const { key, category } of categories) {
    const shipped = packageAssets[key];
    const installed = new Set(manifest.infrastructure[key]);
    const shippedPaths = new Set(shipped.map((s) => s.relativePath));

    for (const entry of shipped) {
      const onDisk = fs.existsSync(path.join(vaultPath, entry.relativePath));
      items.push({
        file: entry.relativePath,
        action: onDisk ? "update" : "add",
        category,
      });
    }

    for (const installedPath of installed) {
      if (!shippedPaths.has(installedPath)) {
        items.push({
          file: installedPath,
          action: "deprecated",
          category,
        });
      }
    }
  }

  return {
    fromVersion: manifest.version,
    toVersion: pkgVersion,
    items,
  };
}

// ── v1→v2 migration ────────────────────────────────────────────

const LLM_WIKI_AGENT_DIRS = ["entities", "concepts", "comparisons", "queries"] as const;

const LOG_MD_PLACEHOLDER = `# Agent Activity Log

Entries are appended here during /cook operations.

`;

/** Create v2 wiki layout dirs and baseline files (idempotent). */
async function migrateV1ToV2Infrastructure(vaultPath: string): Promise<void> {
  for (const dir of LLM_WIKI_AGENT_DIRS) {
    const dirPath = path.join(vaultPath, dir);
    if (!(await fs.pathExists(dirPath))) {
      await fs.ensureDir(dirPath);
    }
  }

  const schemaPath = path.join(vaultPath, "SCHEMA.md");
  if (!(await fs.pathExists(schemaPath))) {
    const commonDir = getCommonDir();
    const schemaTemplatePath = path.join(commonDir, "SCHEMA.md.hbs");
    let content: string;
    if (await fs.pathExists(schemaTemplatePath)) {
      const schemaTemplate = await fs.readFile(schemaTemplatePath, "utf-8");
      content = renderTemplate(schemaTemplate, {
        KB_NAME: path.basename(vaultPath),
        WIKI_DOMAIN: "",
      });
    } else {
      content = `# SCHEMA

This file describes the vault knowledge schema. Update it as your model evolves.

`;
    }
    await fs.writeFile(schemaPath, content, "utf-8");
  }

  const logPath = path.join(vaultPath, "log.md");
  if (!(await fs.pathExists(logPath))) {
    await fs.writeFile(logPath, LOG_MD_PLACEHOLDER, "utf-8");
  }
}

const BYOAO_SKILL_NAMES = [
  "ask", "challenge", "connect", "cook", "diagnose", "drift",
  "health", "ideas", "organize", "prep", "trace", "wiki",
] as const;

/**
 * Migrate BYOAO skills from .opencode/commands/<name>.md to
 * .opencode/skills/<name>/SKILL.md (idempotent).
 */
async function migrateCommandsToSkills(vaultPath: string): Promise<void> {
  const commandsDir = path.join(vaultPath, ".opencode", "commands");
  if (!(await fs.pathExists(commandsDir))) return;

  const skillsDir = path.join(vaultPath, ".opencode", "skills");

  for (const name of BYOAO_SKILL_NAMES) {
    const src = path.join(commandsDir, `${name}.md`);
    if (!(await fs.pathExists(src))) continue;

    const destDir = path.join(skillsDir, name);
    const dest = path.join(destDir, "SKILL.md");
    if (await fs.pathExists(dest)) {
      await fs.remove(src);
      continue;
    }

    await fs.ensureDir(destDir);
    await fs.move(src, dest);
  }

  const remaining = await fs.readdir(commandsDir);
  if (remaining.length === 0) {
    await fs.remove(commandsDir);
  }
}

/**
 * v1 infrastructure still on disk that must appear as deprecated in the plan
 * (Knowledge/templates/*.md; legacy weave/emerge commands). Merged after
 * resolvePackageAssets + buildUpgradePlan — see mergeForcedDeprecatedIntoPlan.
 */
async function collectV1DeprecatedInfrastructureItems(
  vaultPath: string,
): Promise<UpgradePlanItem[]> {
  const items: UpgradePlanItem[] = [];
  const templatesDir = path.join(vaultPath, "Knowledge", "templates");
  if (await fs.pathExists(templatesDir)) {
    const files = await fs.readdir(templatesDir);
    for (const f of files) {
      if (f.endsWith(".md")) {
        items.push({
          file: `Knowledge/templates/${f}`,
          action: "deprecated",
          category: "templates",
        });
      }
    }
  }
  for (const cmd of ["weave.md", "emerge.md"] as const) {
    const rel = `.opencode/commands/${cmd}`;
    if (await fs.pathExists(path.join(vaultPath, rel))) {
      items.push({
        file: rel,
        action: "deprecated",
        category: "commands",
      });
    }
  }
  return items;
}

/** Prefer forced deprecation over add/update for the same path (v1 removals). */
function mergeForcedDeprecatedIntoPlan(
  items: UpgradePlanItem[],
  forced: UpgradePlanItem[],
): UpgradePlanItem[] {
  const forcedFiles = new Set(forced.map((i) => i.file));
  const filtered = items.filter(
    (i) => !(forcedFiles.has(i.file) && (i.action === "add" || i.action === "update")),
  );
  const byFile = new Map<string, UpgradePlanItem>(filtered.map((i) => [i.file, i]));
  for (const f of forced) {
    byFile.set(f.file, f);
  }
  return [...byFile.values()];
}

// ── Asset Resolution ────────────────────────────────────────────

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
  return distAssets; // will fail downstream with a clear error
}

function resolveSkillsDir(): string {
  // When running from dist/ (bundled): dist/assets/skills
  const distSkills = path.resolve(import.meta.dirname, "assets", "skills");
  // When running from dist/ via tsc only: ../skills
  const srcSkills = path.resolve(import.meta.dirname, "..", "skills");
  // When running from src/ via tsx: ../../src/skills
  const devSkills = path.resolve(import.meta.dirname, "..", "..", "src", "skills");

  if (fs.existsSync(distSkills)) return distSkills;
  if (fs.existsSync(srcSkills)) return srcSkills;
  if (fs.existsSync(devSkills)) return devSkills;
  return distSkills;
}

/**
 * Resolve package assets for a given preset.
 * Legacy v1 paths (Knowledge/templates/*.md, weave/emerge commands on disk) are
 * folded into the upgrade plan's deprecated items by collectV1DeprecatedInfrastructureItems.
 */
function resolvePackageAssets(preset: string): PackageAssets {
  const assetsDir = resolveAssetsDir();
  const skillsDir = resolveSkillsDir();
  const commonDir = getCommonDir();

  const skills: PackageAssetEntry[] = [];
  const commands: PackageAssetEntry[] = [];
  const obsidianConfig: PackageAssetEntry[] = [];
  const templates: PackageAssetEntry[] = [];

  // 1. Obsidian skills → .opencode/skills/<name>/SKILL.md
  const obsidianSkillsDir = path.join(assetsDir, "obsidian-skills");
  if (fs.existsSync(obsidianSkillsDir)) {
    for (const file of fs.readdirSync(obsidianSkillsDir)) {
      if (file.endsWith(".md")) {
        const skillName = file.replace(/\.md$/, "");
        skills.push({
          relativePath: `.opencode/skills/${skillName}/SKILL.md`,
          sourcePath: path.join(obsidianSkillsDir, file),
        });
      }
    }
  }

  // 2. BYOAO skills (src/skills/<name>/SKILL.md) → .opencode/skills/<name>/SKILL.md
  if (fs.existsSync(skillsDir)) {
    for (const entry of fs.readdirSync(skillsDir, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        const skillMd = path.join(skillsDir, entry.name, "SKILL.md");
        if (fs.existsSync(skillMd)) {
          skills.push({
            relativePath: `.opencode/skills/${entry.name}/SKILL.md`,
            sourcePath: skillMd,
          });
        }
      }
    }
  }

  // 3. Obsidian config from common
  const obsidianSrcDir = path.join(commonDir, "obsidian");
  if (fs.existsSync(obsidianSrcDir)) {
    for (const file of OBSIDIAN_CONFIG_FILES) {
      const srcPath = path.join(obsidianSrcDir, file);
      if (fs.existsSync(srcPath)) {
        obsidianConfig.push({
          relativePath: `.obsidian/${file}`,
          sourcePath: srcPath,
        });
      }
    }
  }

  // 4. Templates: common + preset
  const commonTemplatesDir = path.join(commonDir, "templates");
  if (fs.existsSync(commonTemplatesDir)) {
    for (const file of fs.readdirSync(commonTemplatesDir)) {
      if (file.endsWith(".md")) {
        templates.push({
          relativePath: `Knowledge/templates/${file}`,
          sourcePath: path.join(commonTemplatesDir, file),
        });
      }
    }
  }

  try {
    const { presetsDir } = loadPreset(preset);
    const presetTemplatesDir = path.join(presetsDir, preset, "templates");
    if (fs.existsSync(presetTemplatesDir)) {
      for (const file of fs.readdirSync(presetTemplatesDir)) {
        if (file.endsWith(".md")) {
          templates.push({
            relativePath: `Knowledge/templates/${file}`,
            sourcePath: path.join(presetTemplatesDir, file),
          });
        }
      }
    }
  } catch {
    /* Preset not found — use common templates only */
  }

  return { skills, commands, obsidianConfig, templates };
}

// ── Upgrade Execution ───────────────────────────────────────────

/** Upgrade a BYOAO vault's infrastructure files to the current package version. */
export async function upgradeVault(
  vaultPath: string,
  options?: UpgradeOptions
): Promise<UpgradeVaultResult> {
  const { preset, dryRun = false, force = false } = options ?? {};

  // 1. Validate this is a BYOAO vault
  const detectedPath = detectVaultContext(vaultPath);
  if (!detectedPath) {
    throw new Error(
      `No BYOAO vault detected at "${vaultPath}". Expected .obsidian/ and AGENTS.md.`
    );
  }

  // 2. Read or bootstrap manifest
  let manifest = await readManifest(vaultPath);
  if (!manifest) {
    manifest = await bootstrapManifest(vaultPath, preset);
  }

  const pkgVersion = getPackageVersion();
  const fromVersion = manifest.version;

  // 3. Check if upgrade needed
  if (fromVersion === pkgVersion && !force) {
    return {
      fromVersion,
      toVersion: pkgVersion,
      added: [],
      updated: [],
      deprecated: [],
      errors: [],
      dryRun,
    };
  }

  // 3b. Migrate AGENT.md → AGENTS.md if legacy file exists
  const legacyAgentMd = path.join(vaultPath, "AGENT.md");
  const newAgentsMd = path.join(vaultPath, "AGENTS.md");
  if (!dryRun && await fs.pathExists(legacyAgentMd) && !await fs.pathExists(newAgentsMd)) {
    await fs.rename(legacyAgentMd, newAgentsMd);
  }

  // 3c. v1→v2 vault layout (agent dirs, SCHEMA.md, log.md)
  if (!dryRun) {
    await migrateV1ToV2Infrastructure(vaultPath);
  }

  // 3d. Migrate .opencode/commands/ → .opencode/skills/<name>/SKILL.md
  if (!dryRun) {
    await migrateCommandsToSkills(vaultPath);
  }

  // 4. Resolve package assets and build plan
  const effectivePreset = preset ?? manifest.preset;
  const packageAssets = resolvePackageAssets(effectivePreset);
  let plan = buildUpgradePlan(vaultPath, manifest, packageAssets);
  plan = {
    ...plan,
    items: mergeForcedDeprecatedIntoPlan(
      plan.items,
      await collectV1DeprecatedInfrastructureItems(vaultPath),
    ),
  };

  // 5. Execute plan (or dry run)
  const added: string[] = [];
  const updated: string[] = [];
  const deprecated: string[] = [];
  const errors: Array<{ file: string; error: string }> = [];

  if (!dryRun) {
    // Build lookup from relativePath → sourcePath
    const sourceMap = new Map<string, string>();
    for (const category of ["skills", "commands", "obsidianConfig", "templates"] as const) {
      for (const entry of packageAssets[category]) {
        sourceMap.set(entry.relativePath, entry.sourcePath);
      }
    }

    for (const item of plan.items) {
      try {
        if (item.action === "add" || item.action === "update") {
          const source = sourceMap.get(item.file);
          if (source) {
            const dest = path.join(vaultPath, item.file);
            await fs.ensureDir(path.dirname(dest));
            await fs.copy(source, dest, { overwrite: true });
            if (item.action === "add") {
              added.push(item.file);
            } else {
              updated.push(item.file);
            }
          }
        } else if (item.action === "deprecated") {
          deprecated.push(item.file);
        }
      } catch (err) {
        errors.push({
          file: item.file,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    // 6. Update manifest with new version and current file list
    const installedFiles = await scanInstalledAssets(vaultPath);
    await writeManifest(vaultPath, effectivePreset, installedFiles);
  }

  return {
    fromVersion,
    toVersion: pkgVersion,
    added,
    updated,
    deprecated,
    errors,
    dryRun,
  };
}
