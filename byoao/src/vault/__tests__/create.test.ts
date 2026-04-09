import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import fs from "fs-extra";
import path from "node:path";
import os from "node:os";
import {
  createVault,
  createMinimalCore,
  createLlmWikiCore,
  applyPresetOverlay,
  createAgentsMd,
} from "../create.js";
import { detectInitMode } from "../vault-detect.js";
import type { VaultConfig } from "../../plugin-config.js";

vi.mock("../mcp.js", () => ({
  configureMcp: vi.fn().mockResolvedValue(null),
}));

vi.mock("../obsidian-plugins.js", () => ({
  configureObsidianPlugins: vi.fn().mockResolvedValue(null),
}));

vi.mock("../provider.js", () => ({
  configureProvider: vi.fn().mockResolvedValue(null),
}));

let tmpDir: string;

beforeEach(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "byoao-create-"));
});

afterEach(async () => {
  await fs.remove(tmpDir);
});

function makeConfig(overrides: Partial<VaultConfig> = {}): VaultConfig {
  return {
    kbName: "TestKB",
    ownerName: "",
    vaultPath: path.join(tmpDir, "vault"),
    preset: "minimal",
    provider: "skip",
    gcpProjectId: "",
    mcpSkip: [],
    wikiDomain: "",
    compilationMode: "review",
    ...overrides,
  };
}

describe("createVault", () => {
  it("creates LLM Wiki agent directories", async () => {
    const result = await createVault(makeConfig());
    const vp = result.vaultPath;

    expect(await fs.pathExists(path.join(vp, "entities"))).toBe(true);
    expect(await fs.pathExists(path.join(vp, "concepts"))).toBe(true);
    expect(await fs.pathExists(path.join(vp, "comparisons"))).toBe(true);
    expect(await fs.pathExists(path.join(vp, "queries"))).toBe(true);
    expect(result.directories).toContain("entities");
    expect(result.directories).toContain("concepts");
  });

  it("creates SCHEMA.md and log.md", async () => {
    const result = await createVault(makeConfig());
    const vp = result.vaultPath;

    expect(await fs.pathExists(path.join(vp, "SCHEMA.md"))).toBe(true);
    expect(await fs.pathExists(path.join(vp, "log.md"))).toBe(true);
  });

  it("generates AGENTS.md", async () => {
    const result = await createVault(makeConfig());
    const vp = result.vaultPath;

    expect(await fs.pathExists(path.join(vp, "AGENTS.md"))).toBe(true);
  });

  it("generates Start Here.md", async () => {
    const result = await createVault(makeConfig());
    const vp = result.vaultPath;

    expect(await fs.pathExists(path.join(vp, "Start Here.md"))).toBe(true);
    const startHere = await fs.readFile(path.join(vp, "Start Here.md"), "utf-8");
    expect(startHere).toContain("TestKB");
  });

  it("does not create People/ or Knowledge/ directories", async () => {
    const result = await createVault(makeConfig());
    const vp = result.vaultPath;

    expect(await fs.pathExists(path.join(vp, "People"))).toBe(false);
    expect(await fs.pathExists(path.join(vp, "Knowledge"))).toBe(false);
  });

  it("returns correct filesCreated count", async () => {
    const result = await createVault(makeConfig());
    // At minimum: obsidian configs + Start Here + SCHEMA.md + log.md + AGENTS.md + agent dirs
    expect(result.filesCreated).toBeGreaterThanOrEqual(6);
  });

  it("writes .byoao/manifest.json after vault creation", async () => {
    const result = await createVault(makeConfig());
    const vp = result.vaultPath;

    const manifestPath = path.join(vp, ".byoao", "manifest.json");
    expect(await fs.pathExists(manifestPath)).toBe(true);

    const manifest = await fs.readJson(manifestPath);
    expect(manifest.version).toBeDefined();
    expect(manifest.preset).toBe("minimal");
    expect(manifest.infrastructure.skills.length).toBeGreaterThan(0);
    expect(manifest.infrastructure.commands.length).toBeGreaterThan(0);
  });

  it("minimal preset creates only LLM Wiki core directories", async () => {
    const config = makeConfig({ preset: "minimal" });
    const result = await createVault(config);

    expect(result.directories).toContain("entities");
    expect(result.directories).toContain("concepts");
    expect(result.directories).toContain("comparisons");
    expect(result.directories).toContain("queries");
    expect(result.directories).not.toContain("Projects");
    expect(result.directories).not.toContain("Sprints");
  });

  it("pm-tpm preset includes Projects and Sprints on top of LLM Wiki core", async () => {
    const config = makeConfig({ preset: "pm-tpm" });
    const result = await createVault(config);

    expect(result.directories).toContain("entities");
    expect(result.directories).toContain("concepts");
    expect(result.directories).toContain("Projects");
    expect(result.directories).toContain("Sprints");
  });

  it("preserves existing .obsidian/ when initializing in an Obsidian vault", async () => {
    const vp = path.join(tmpDir, "vault");
    await fs.ensureDir(path.join(vp, ".obsidian"));
    await fs.writeFile(path.join(vp, ".obsidian", "custom-theme.json"), '{"custom": true}');
    await fs.writeFile(path.join(vp, "existing-note.md"), "# My Note\n\nHello");

    const config = makeConfig({ preset: "minimal" });
    const result = await createVault(config);

    const customTheme = await fs.readFile(path.join(vp, ".obsidian", "custom-theme.json"), "utf-8");
    expect(customTheme).toContain('"custom": true');

    expect(await fs.pathExists(path.join(vp, "AGENTS.md"))).toBe(true);
    expect(await fs.pathExists(path.join(vp, "Start Here.md"))).toBe(true);
    expect(await fs.pathExists(path.join(vp, "SCHEMA.md"))).toBe(true);

    const existingNote = await fs.readFile(path.join(vp, "existing-note.md"), "utf-8");
    expect(existingNote).toContain("My Note");
  });

  it("does not overwrite existing Start Here.md", async () => {
    const vp = path.join(tmpDir, "vault");
    await fs.ensureDir(vp);
    await fs.writeFile(path.join(vp, "Start Here.md"), "# My Custom Start");

    const config = makeConfig({ preset: "minimal" });
    await createVault(config);

    const startHere = await fs.readFile(path.join(vp, "Start Here.md"), "utf-8");
    expect(startHere).toBe("# My Custom Start");
  });

  it("includes wikiDomain in SCHEMA.md when provided", async () => {
    const config = makeConfig({ wikiDomain: "AI/ML research" });
    const result = await createVault(config);
    const vp = result.vaultPath;

    const schema = await fs.readFile(path.join(vp, "SCHEMA.md"), "utf-8");
    expect(schema).toContain("AI/ML research");
  });
});

describe("detectInitMode", () => {
  it("returns 'fresh' for non-existent path", () => {
    expect(detectInitMode(path.join(tmpDir, "nonexistent"))).toBe("fresh");
  });

  it("returns 'fresh' for empty directory", async () => {
    const emptyDir = path.join(tmpDir, "empty");
    await fs.ensureDir(emptyDir);
    expect(detectInitMode(emptyDir)).toBe("fresh");
  });

  it("returns 'existing' when .md files are present", async () => {
    const dir = path.join(tmpDir, "notes");
    await fs.ensureDir(dir);
    await fs.writeFile(path.join(dir, "note.md"), "# Hello");
    expect(detectInitMode(dir)).toBe("existing");
  });

  it("returns 'obsidian-vault' when .obsidian/ exists", async () => {
    const dir = path.join(tmpDir, "vault");
    await fs.ensureDir(path.join(dir, ".obsidian"));
    expect(detectInitMode(dir)).toBe("obsidian-vault");
  });
});
