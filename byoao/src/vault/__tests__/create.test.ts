import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import fs from "fs-extra";
import path from "node:path";
import os from "node:os";
import {
  createVault,
  createMinimalCore,
  applyPresetOverlay,
  createPeopleNotes,
  createProjectNotes,
  createTeamIndex,
  createAgentsMd,
} from "../create.js";
import { detectInitMode } from "../vault-detect.js";
import type { VaultConfig } from "../../plugin-config.js";

// Mock mcp.ts so we don't touch real OpenCode config
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
    members: [],
    projects: [],
    glossaryEntries: [],
    jiraHost: "",
    jiraProject: "",
    preset: "pm-tpm",
    provider: "skip",
    gcpProjectId: "",
    mcpSkip: [],
    ...overrides,
  };
}

describe("createVault", () => {
  it("creates expected directory structure", async () => {
    const result = await createVault(makeConfig());

    expect(result.directories).toContain("Knowledge");
    expect(result.directories).toContain("Daily");

    for (const dir of result.directories) {
      expect(await fs.pathExists(path.join(result.vaultPath, dir))).toBe(true);
    }
  });

  it("generates AGENTS.md (no CLAUDE.md)", async () => {
    const result = await createVault(makeConfig());
    const vp = result.vaultPath;

    expect(await fs.pathExists(path.join(vp, "AGENTS.md"))).toBe(true);
    expect(await fs.pathExists(path.join(vp, "CLAUDE.md"))).toBe(false);

    const agentContent = await fs.readFile(path.join(vp, "AGENTS.md"), "utf-8");
    expect(agentContent).toContain("TestKB");
  });

  it("generates Start Here.md and Glossary.md", async () => {
    const result = await createVault(makeConfig());
    const vp = result.vaultPath;

    expect(await fs.pathExists(path.join(vp, "Start Here.md"))).toBe(true);
    expect(
      await fs.pathExists(path.join(vp, "Knowledge/Glossary.md"))
    ).toBe(true);

    const startHere = await fs.readFile(
      path.join(vp, "Start Here.md"),
      "utf-8"
    );
    expect(startHere).toContain("TestKB");
  });

  it("creates people notes from members config", async () => {
    const config = makeConfig({
      members: [
        { name: "Alice", role: "Engineer" },
        { name: "Bob", role: "PM" },
      ],
    });
    const result = await createVault(config);
    const vp = result.vaultPath;

    const alice = await fs.readFile(path.join(vp, "People/Alice.md"), "utf-8");
    expect(alice).toContain('type: person');
    expect(alice).toContain("Engineer");

    expect(await fs.pathExists(path.join(vp, "People/Bob.md"))).toBe(true);
  });

  it("creates project notes from projects config", async () => {
    const config = makeConfig({
      projects: [{ name: "Widget", description: "Build a widget" }],
    });
    const result = await createVault(config);
    const vp = result.vaultPath;

    const widget = await fs.readFile(
      path.join(vp, "Projects/Widget.md"),
      "utf-8"
    );
    expect(widget).toContain("type: feature");
    expect(widget).toContain("Build a widget");
  });

  it("returns correct filesCreated count", async () => {
    const config = makeConfig({
      members: [{ name: "Alice", role: "Eng" }],
      projects: [{ name: "P1", description: "desc" }],
    });
    const result = await createVault(config);

    // At minimum: obsidian configs + templates + glossary + start here + agent + claude + 1 person + 1 project + team index
    expect(result.filesCreated).toBeGreaterThanOrEqual(9);
  });

  it("tracks wikilinks created for members and projects", async () => {
    const config = makeConfig({
      members: [{ name: "Alice", role: "Eng" }],
      projects: [{ name: "P1", description: "d" }],
    });
    const result = await createVault(config);

    // members wikilinks in AGENTS.md + team index, projects in AGENTS.md + team index
    expect(result.wikilinksCreated).toBeGreaterThanOrEqual(4);
  });

  it("populates wikilinks in team index", async () => {
    const config = makeConfig({
      members: [
        { name: "Alice", role: "Eng" },
        { name: "Bob", role: "PM" },
      ],
    });
    const result = await createVault(config);
    const teamIndex = await fs.readFile(
      path.join(result.vaultPath, "People/TestKB Team.md"),
      "utf-8"
    );
    expect(teamIndex).toContain("[[Alice]]");
    expect(teamIndex).toContain("[[Bob]]");
  });

  it("includes glossary entries when provided", async () => {
    const config = makeConfig({
      glossaryEntries: [{ term: "API", definition: "Application interface", domain: "engineering" }],
    });
    const result = await createVault(config);
    const glossary = await fs.readFile(
      path.join(result.vaultPath, "Knowledge/Glossary.md"),
      "utf-8"
    );
    expect(glossary).toContain("**API**");
    expect(glossary).toContain("Application interface");
  });

  it("writes .byoao/manifest.json after vault creation", async () => {
    const result = await createVault(makeConfig());
    const vp = result.vaultPath;

    const manifestPath = path.join(vp, ".byoao", "manifest.json");
    expect(await fs.pathExists(manifestPath)).toBe(true);

    const manifest = await fs.readJson(manifestPath);
    expect(manifest.version).toBeDefined();
    expect(manifest.preset).toBe("pm-tpm");
    expect(manifest.infrastructure.skills.length).toBeGreaterThan(0);
    expect(manifest.infrastructure.commands.length).toBeGreaterThan(0);
    expect(manifest.infrastructure.templates.length).toBeGreaterThan(0);
  });

  it("minimal preset creates only minimal directories", async () => {
    const config = makeConfig({ preset: "minimal" });
    const result = await createVault(config);

    expect(result.directories).toContain("Daily");
    expect(result.directories).toContain("Knowledge");
    expect(result.directories).toContain("Knowledge/templates");
    // Minimal preset should NOT create these
    expect(result.directories).not.toContain("Inbox");
    expect(result.directories).not.toContain("Systems");
    expect(result.directories).not.toContain("Archive");
  });

  it("minimal preset without members skips team index", async () => {
    const config = makeConfig({ preset: "minimal", members: [] });
    const result = await createVault(config);
    const vp = result.vaultPath;

    expect(await fs.pathExists(path.join(vp, "People"))).toBe(false);
    expect(await fs.pathExists(path.join(vp, "People/TestKB Team.md"))).toBe(false);
  });

  it("minimal preset with members creates People/ and team index", async () => {
    const config = makeConfig({
      preset: "minimal",
      members: [{ name: "Jay", role: "Owner" }],
    });
    const result = await createVault(config);
    const vp = result.vaultPath;

    expect(await fs.pathExists(path.join(vp, "People/Jay.md"))).toBe(true);
    expect(await fs.pathExists(path.join(vp, "People/TestKB Team.md"))).toBe(true);
  });

  it("pm-tpm preset includes Projects and Sprints directories", async () => {
    const config = makeConfig({ preset: "pm-tpm" });
    const result = await createVault(config);

    expect(result.directories).toContain("Projects");
    expect(result.directories).toContain("Sprints");
  });

  it("preserves existing .obsidian/ when initializing in an Obsidian vault", async () => {
    const vp = path.join(tmpDir, "vault");
    // Pre-create an existing Obsidian vault with custom config
    await fs.ensureDir(path.join(vp, ".obsidian"));
    await fs.writeFile(path.join(vp, ".obsidian", "custom-theme.json"), '{"custom": true}');
    await fs.writeFile(path.join(vp, "existing-note.md"), "# My Note\n\nHello");

    const config = makeConfig({ preset: "minimal" });
    const result = await createVault(config);

    // .obsidian/ should be untouched — custom file preserved, no BYOAO configs injected
    const customTheme = await fs.readFile(path.join(vp, ".obsidian", "custom-theme.json"), "utf-8");
    expect(customTheme).toContain('"custom": true');

    // BYOAO files should still be created
    expect(await fs.pathExists(path.join(vp, "AGENTS.md"))).toBe(true);
    expect(await fs.pathExists(path.join(vp, "Knowledge/Glossary.md"))).toBe(true);

    // Existing note should be untouched
    const existingNote = await fs.readFile(path.join(vp, "existing-note.md"), "utf-8");
    expect(existingNote).toContain("My Note");
  });

  it("does not overwrite existing AGENT.md or Start Here.md", async () => {
    const vp = path.join(tmpDir, "vault");
    await fs.ensureDir(vp);
    await fs.writeFile(path.join(vp, "AGENT.md"), "# Custom Agent Config");
    await fs.writeFile(path.join(vp, "Start Here.md"), "# My Custom Start");

    const config = makeConfig({ preset: "minimal" });
    await createVault(config);

    const agentContent = await fs.readFile(path.join(vp, "AGENT.md"), "utf-8");
    expect(agentContent).toBe("# Custom Agent Config");

    const startHere = await fs.readFile(path.join(vp, "Start Here.md"), "utf-8");
    expect(startHere).toBe("# My Custom Start");
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
