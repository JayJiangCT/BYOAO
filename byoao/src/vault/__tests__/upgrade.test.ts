import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import fs from "fs-extra";
import path from "node:path";
import os from "node:os";

let tmpDir: string;

beforeEach(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "byoao-upgrade-"));
});

afterEach(async () => {
  await fs.remove(tmpDir);
});

describe("scanInstalledAssets", () => {
  it("finds skills, commands, obsidian config, and templates", async () => {
    const { scanInstalledAssets } = await import("../upgrade.js");

    // Set up vault with infrastructure files (skills/<name>/SKILL.md layout)
    await fs.ensureDir(path.join(tmpDir, ".opencode", "skills", "test"));
    await fs.writeFile(path.join(tmpDir, ".opencode", "skills", "test", "SKILL.md"), "# Skill");
    await fs.ensureDir(path.join(tmpDir, ".opencode", "commands"));
    await fs.writeFile(path.join(tmpDir, ".opencode", "commands", "cmd.md"), "# Cmd");
    await fs.ensureDir(path.join(tmpDir, ".obsidian"));
    await fs.writeFile(path.join(tmpDir, ".obsidian", "core-plugins.json"), "[]");
    await fs.ensureDir(path.join(tmpDir, "Knowledge", "templates"));
    await fs.writeFile(path.join(tmpDir, "Knowledge", "templates", "Example.md"), "# Ex");

    const result = await scanInstalledAssets(tmpDir);

    expect(result.skills).toContain(".opencode/skills/test/SKILL.md");
    expect(result.commands).toContain(".opencode/commands/cmd.md");
    expect(result.obsidianConfig).toContain(".obsidian/core-plugins.json");
    expect(result.templates).toContain("Knowledge/templates/Example.md");
  });

  it("returns empty arrays when no infrastructure exists", async () => {
    const { scanInstalledAssets } = await import("../upgrade.js");

    const result = await scanInstalledAssets(tmpDir);

    expect(result.skills).toEqual([]);
    expect(result.commands).toEqual([]);
    expect(result.obsidianConfig).toEqual([]);
    expect(result.templates).toEqual([]);
  });
});

describe("bootstrapManifest", () => {
  it("creates manifest with version 0.0.0", async () => {
    const { bootstrapManifest } = await import("../upgrade.js");
    const { readManifest } = await import("../manifest.js");

    await fs.ensureDir(path.join(tmpDir, ".obsidian"));
    await fs.writeFile(path.join(tmpDir, "AGENT.md"), "# Agent");
    await fs.ensureDir(path.join(tmpDir, ".opencode", "skills", "s"));
    await fs.writeFile(path.join(tmpDir, ".opencode", "skills", "s", "SKILL.md"), "skill");

    await bootstrapManifest(tmpDir);

    const manifest = await readManifest(tmpDir);
    expect(manifest).not.toBeNull();
    expect(manifest!.version).toBe("0.0.0");
    expect(manifest!.preset).toBe("minimal");
    expect(manifest!.infrastructure.skills).toContain(".opencode/skills/s/SKILL.md");
  });

  it("accepts preset override", async () => {
    const { bootstrapManifest } = await import("../upgrade.js");
    const { readManifest } = await import("../manifest.js");

    await bootstrapManifest(tmpDir, "custom-preset");

    const manifest = await readManifest(tmpDir);
    expect(manifest!.preset).toBe("custom-preset");
  });
});

describe("buildUpgradePlan", () => {
  it("marks missing files as add and existing files as update", async () => {
    const { buildUpgradePlan } = await import("../upgrade.js");

    // Vault has one skill on disk (new layout)
    await fs.ensureDir(path.join(tmpDir, ".opencode", "skills", "existing"));
    await fs.writeFile(
      path.join(tmpDir, ".opencode", "skills", "existing", "SKILL.md"),
      "old content"
    );

    const manifest = {
      version: "0.3.0",
      preset: "pm-tpm",
      createdAt: "2026-03-20",
      updatedAt: "2026-03-20",
      infrastructure: {
        skills: [".opencode/skills/existing/SKILL.md"],
        commands: [],
        obsidianConfig: [],
        templates: [],
      },
    };

    const packageAssets = {
      skills: [
        { relativePath: ".opencode/skills/existing/SKILL.md", sourcePath: "/fake/existing.md" },
        { relativePath: ".opencode/skills/new/SKILL.md", sourcePath: "/fake/new.md" },
      ],
      commands: [],
      obsidianConfig: [],
      templates: [],
    };

    const plan = buildUpgradePlan(tmpDir, manifest, packageAssets);

    const addItem = plan.items.find((i) => i.file === ".opencode/skills/new/SKILL.md");
    const updateItem = plan.items.find((i) => i.file === ".opencode/skills/existing/SKILL.md");

    expect(addItem).toBeDefined();
    expect(addItem!.action).toBe("add");
    expect(updateItem).toBeDefined();
    expect(updateItem!.action).toBe("update");
  });

  it("marks files in manifest but not in package as deprecated", async () => {
    const { buildUpgradePlan } = await import("../upgrade.js");

    const manifest = {
      version: "0.3.0",
      preset: "pm-tpm",
      createdAt: "2026-03-20",
      updatedAt: "2026-03-20",
      infrastructure: {
        skills: [".opencode/skills/removed/SKILL.md"],
        commands: [],
        obsidianConfig: [],
        templates: [],
      },
    };

    const packageAssets = {
      skills: [],
      commands: [],
      obsidianConfig: [],
      templates: [],
    };

    const plan = buildUpgradePlan(tmpDir, manifest, packageAssets);

    const deprecated = plan.items.find((i) => i.file === ".opencode/skills/removed/SKILL.md");
    expect(deprecated).toBeDefined();
    expect(deprecated!.action).toBe("deprecated");
  });
});

describe("upgradeVault", () => {
  it("returns up-to-date result when versions match", async () => {
    vi.resetModules();
    const { writeManifest, getPackageVersion } = await import("../manifest.js");
    const version = getPackageVersion();

    await fs.ensureDir(path.join(tmpDir, ".obsidian"));
    await fs.writeFile(path.join(tmpDir, "AGENT.md"), "# Agent");
    await writeManifest(tmpDir, "pm-tpm", {
      skills: [], commands: [], obsidianConfig: [], templates: [],
    });

    const { upgradeVault } = await import("../upgrade.js");
    const result = await upgradeVault(tmpDir, { skipGlobalSkillsSync: true });

    expect(result.fromVersion).toBe(version);
    expect(result.toVersion).toBe(version);
    expect(result.added).toEqual([]);
    expect(result.updated).toEqual([]);
  });

  it("proceeds when force is true even if versions match", async () => {
    vi.resetModules();
    const { writeManifest } = await import("../manifest.js");

    await fs.ensureDir(path.join(tmpDir, ".obsidian"));
    await fs.writeFile(path.join(tmpDir, "AGENT.md"), "# Agent");
    await writeManifest(tmpDir, "pm-tpm", {
      skills: [], commands: [], obsidianConfig: [], templates: [],
    });

    const { upgradeVault } = await import("../upgrade.js");
    const result = await upgradeVault(tmpDir, { force: true, skipGlobalSkillsSync: true });

    expect(result.dryRun).toBe(false);
  });

  it("returns dry-run result without modifying files", async () => {
    vi.resetModules();

    await fs.ensureDir(path.join(tmpDir, ".obsidian"));
    await fs.writeFile(path.join(tmpDir, "AGENT.md"), "# Agent");

    const { bootstrapManifest } = await import("../upgrade.js");
    await bootstrapManifest(tmpDir);

    vi.resetModules();
    const { upgradeVault } = await import("../upgrade.js");
    const result = await upgradeVault(tmpDir, { dryRun: true });

    expect(result.dryRun).toBe(true);
    const { readManifest } = await import("../manifest.js");
    const manifest = await readManifest(tmpDir);
    expect(manifest!.version).toBe("0.0.0");
  });

  it("bootstraps manifest when none exists", async () => {
    vi.resetModules();

    await fs.ensureDir(path.join(tmpDir, ".obsidian"));
    await fs.writeFile(path.join(tmpDir, "AGENT.md"), "# Agent");

    const { upgradeVault } = await import("../upgrade.js");
    const result = await upgradeVault(tmpDir, { force: true, skipGlobalSkillsSync: true });

    expect(result.fromVersion).toBe("0.0.0");
  });

  it("throws when vault path is not a BYOAO vault", async () => {
    vi.resetModules();
    const { upgradeVault } = await import("../upgrade.js");

    await expect(upgradeVault(tmpDir)).rejects.toThrow(
      /No BYOAO vault detected/
    );
  });
});
