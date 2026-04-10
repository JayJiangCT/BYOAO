import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "fs-extra";
import path from "node:path";
import os from "node:os";
import {
  copyBundledSkillsToOpenCodeSkillsDir,
  resolveBundledAssetsRoot,
} from "../copy-bundled-skills.js";

let tmpDir: string;

beforeEach(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "byoao-copy-skills-"));
});

afterEach(async () => {
  await fs.remove(tmpDir);
});

describe("copyBundledSkillsToOpenCodeSkillsDir", () => {
  it("copies BYOAO skills and optionally Obsidian skills into target dir", async () => {
    const dest = path.join(tmpDir, "skills");
    const withObsidian = await copyBundledSkillsToOpenCodeSkillsDir(dest, {
      includeObsidianSkills: true,
    });
    expect(withObsidian.byoaoSkills).toBeGreaterThan(0);
    expect(withObsidian.obsidianSkills).toBeGreaterThan(0);
    expect(await fs.pathExists(path.join(dest, "cook", "SKILL.md"))).toBe(true);

    const dest2 = path.join(tmpDir, "skills2");
    const byoaoOnly = await copyBundledSkillsToOpenCodeSkillsDir(dest2, {
      includeObsidianSkills: false,
    });
    expect(byoaoOnly.byoaoSkills).toBeGreaterThan(0);
    expect(byoaoOnly.obsidianSkills).toBe(0);
  });
});

describe("resolveBundledAssetsRoot", () => {
  it("returns a path where obsidian-skills exists", () => {
    const root = resolveBundledAssetsRoot();
    expect(fs.existsSync(path.join(root, "obsidian-skills"))).toBe(true);
  });
});
