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
import { detectVaultContext } from "./vault-detect.js";

// ── Constants ───────────────────────────────────────────────────

const OBSIDIAN_CONFIG_FILES = [
  "core-plugins.json",
  "daily-notes.json",
  "templates.json",
];

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

const DEFAULT_PRESET = "pm-tpm";

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

// ── Asset Resolution ────────────────────────────────────────────

function resolveAssetsDir(): string {
  const srcAssets = path.resolve(import.meta.dirname, "..", "assets");
  const distAssets = path.resolve(
    import.meta.dirname, "..", "..", "src", "assets"
  );
  if (fs.existsSync(srcAssets)) return srcAssets;
  if (fs.existsSync(distAssets)) return distAssets;
  return srcAssets;
}

function resolveSkillsDir(): string {
  const srcSkills = path.resolve(import.meta.dirname, "..", "skills");
  const distSkills = path.resolve(
    import.meta.dirname, "..", "..", "src", "skills"
  );
  if (fs.existsSync(srcSkills)) return srcSkills;
  if (fs.existsSync(distSkills)) return distSkills;
  return srcSkills;
}

/** Resolve package assets for a given preset. */
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

  // 2. BYOAO commands (src/skills/) → .opencode/commands/
  if (fs.existsSync(skillsDir)) {
    for (const file of fs.readdirSync(skillsDir)) {
      if (file.endsWith(".md")) {
        commands.push({
          relativePath: `.opencode/commands/${file}`,
          sourcePath: path.join(skillsDir, file),
        });
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

  // 4. Resolve package assets and build plan
  const effectivePreset = preset ?? manifest.preset;
  const packageAssets = resolvePackageAssets(effectivePreset);
  const plan = buildUpgradePlan(vaultPath, manifest, packageAssets);

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
