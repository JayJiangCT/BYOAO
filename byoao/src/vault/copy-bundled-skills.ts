import { fs } from "../lib/cjs-modules.js";
import path from "node:path";

export interface CopyBundledSkillsResult {
  obsidianSkills: number;
  byoaoSkills: number;
}

export interface CopyBundledSkillsOptions {
  /** When false, only BYOAO skills under assets/skills are copied (matches `byoao install --no-skills`). Default true. */
  includeObsidianSkills?: boolean;
}

/** Resolve bundled `assets/` root (obsidian-skills, presets, etc.). */
export function resolveBundledAssetsRoot(): string {
  const distAssets = path.resolve(import.meta.dirname, "assets");
  const srcAssets = path.resolve(import.meta.dirname, "..", "assets");
  const devAssets = path.resolve(import.meta.dirname, "..", "..", "src", "assets");

  if (fs.existsSync(distAssets)) return distAssets;
  if (fs.existsSync(srcAssets)) return srcAssets;
  if (fs.existsSync(devAssets)) return devAssets;
  return distAssets;
}

/** Resolve bundled BYOAO skills root (`assets/skills` in package layout). */
export function resolveBundledByoaoSkillsRoot(): string {
  const distSkills = path.resolve(import.meta.dirname, "assets", "skills");
  const srcSkills = path.resolve(import.meta.dirname, "..", "skills");
  const devSkills = path.resolve(import.meta.dirname, "..", "..", "src", "skills");

  if (fs.existsSync(distSkills)) return distSkills;
  if (fs.existsSync(srcSkills)) return srcSkills;
  if (fs.existsSync(devSkills)) return devSkills;
  return distSkills;
}

/**
 * Copy Obsidian + BYOAO bundled skills into an OpenCode skills directory (overwrite per file).
 * Does not delete unrelated skill folders the user may have added.
 */
export async function copyBundledSkillsToOpenCodeSkillsDir(
  targetSkillsRoot: string,
  options?: CopyBundledSkillsOptions,
): Promise<CopyBundledSkillsResult> {
  const includeObsidian = options?.includeObsidianSkills !== false;
  await fs.ensureDir(targetSkillsRoot);

  const assetsRoot = resolveBundledAssetsRoot();
  const byoaoSkillsRoot = resolveBundledByoaoSkillsRoot();

  let obsidianSkills = 0;
  let byoaoSkills = 0;

  if (includeObsidian) {
    const obsidianSrc = path.join(assetsRoot, "obsidian-skills");
    if (fs.existsSync(obsidianSrc)) {
      for (const file of fs.readdirSync(obsidianSrc)) {
        if (!file.endsWith(".md")) continue;
        const skillName = file.replace(/\.md$/, "");
        const destDir = path.join(targetSkillsRoot, skillName);
        await fs.ensureDir(destDir);
        await fs.copy(
          path.join(obsidianSrc, file),
          path.join(destDir, "SKILL.md"),
          { overwrite: true },
        );
        obsidianSkills++;
      }
    }
  }

  if (fs.existsSync(byoaoSkillsRoot)) {
    const entries = await fs.readdir(byoaoSkillsRoot, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const srcSkill = path.join(byoaoSkillsRoot, entry.name, "SKILL.md");
      if (await fs.pathExists(srcSkill)) {
        const destDir = path.join(targetSkillsRoot, entry.name);
        await fs.ensureDir(destDir);
        await fs.copy(srcSkill, path.join(destDir, "SKILL.md"), { overwrite: true });
        byoaoSkills++;
      }
    }
  }

  return { obsidianSkills, byoaoSkills };
}
