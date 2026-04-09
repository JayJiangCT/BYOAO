import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "fs-extra";
import path from "node:path";
import os from "node:os";

let tmpDir: string;

beforeEach(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "byoao-manifest-"));
});

afterEach(async () => {
  await fs.remove(tmpDir);
});

describe("writeManifest", () => {
  it("creates .byoao/manifest.json with correct structure", async () => {
    const { writeManifest } = await import("../manifest.js");

    const installedFiles = {
      skills: [".opencode/skills/byoao-conventions/SKILL.md"],
      commands: [".opencode/commands/vault-doctor.md"],
      obsidianConfig: [".obsidian/core-plugins.json"],
      templates: ["Knowledge/templates/Example.md"],
    };

    await writeManifest(tmpDir, "pm-tpm", installedFiles);

    const manifestPath = path.join(tmpDir, ".byoao", "manifest.json");
    expect(await fs.pathExists(manifestPath)).toBe(true);

    const manifest = await fs.readJson(manifestPath);
    expect(manifest.version).toBeDefined();
    expect(manifest.preset).toBe("pm-tpm");
    expect(manifest.createdAt).toBeDefined();
    expect(manifest.updatedAt).toBeDefined();
    expect(manifest.infrastructure.skills).toEqual([".opencode/skills/byoao-conventions/SKILL.md"]);
    expect(manifest.infrastructure.commands).toEqual([".opencode/commands/vault-doctor.md"]);
    expect(manifest.infrastructure.obsidianConfig).toEqual([".obsidian/core-plugins.json"]);
    expect(manifest.infrastructure.templates).toEqual(["Knowledge/templates/Example.md"]);
  });

  it("creates .byoao/ directory if it does not exist", async () => {
    const { writeManifest } = await import("../manifest.js");

    await writeManifest(tmpDir, "pm-tpm", {
      skills: [], commands: [], obsidianConfig: [], templates: [],
    });

    expect(await fs.pathExists(path.join(tmpDir, ".byoao"))).toBe(true);
  });
});

describe("readManifest", () => {
  it("returns parsed manifest when valid", async () => {
    const { readManifest, writeManifest } = await import("../manifest.js");

    await writeManifest(tmpDir, "pm-tpm", {
      skills: [".opencode/skills/test/SKILL.md"],
      commands: [],
      obsidianConfig: [],
      templates: [],
    });

    const result = await readManifest(tmpDir);
    expect(result).not.toBeNull();
    expect(result!.preset).toBe("pm-tpm");
    expect(result!.infrastructure.skills).toEqual([".opencode/skills/test/SKILL.md"]);
  });

  it("returns null when manifest does not exist", async () => {
    const { readManifest } = await import("../manifest.js");

    const result = await readManifest(tmpDir);
    expect(result).toBeNull();
  });

  it("returns null when manifest has invalid JSON", async () => {
    const { readManifest } = await import("../manifest.js");

    await fs.ensureDir(path.join(tmpDir, ".byoao"));
    await fs.writeFile(
      path.join(tmpDir, ".byoao", "manifest.json"),
      "{ broken json"
    );

    const result = await readManifest(tmpDir);
    expect(result).toBeNull();
  });

  it("returns null when manifest fails schema validation", async () => {
    const { readManifest } = await import("../manifest.js");

    await fs.ensureDir(path.join(tmpDir, ".byoao"));
    await fs.writeJson(
      path.join(tmpDir, ".byoao", "manifest.json"),
      { version: 123, wrong: "schema" }
    );

    const result = await readManifest(tmpDir);
    expect(result).toBeNull();
  });
});
