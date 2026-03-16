import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import fs from "fs-extra";
import path from "node:path";
import os from "node:os";
import { createVault } from "../create.js";
import type { VaultConfig } from "../../plugin-config.js";

// Mock mcp.ts so we don't touch real OpenCode config
vi.mock("../mcp.js", () => ({
  configureMcp: vi.fn().mockResolvedValue(null),
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
    teamName: "TestTeam",
    vaultPath: path.join(tmpDir, "vault"),
    members: [],
    projects: [],
    glossaryEntries: [],
    jiraHost: "",
    jiraProject: "",
    preset: "pm-tpm",
    ...overrides,
  };
}

describe("createVault", () => {
  it("creates expected directory structure", async () => {
    const result = await createVault(makeConfig());

    expect(result.directories).toContain("Inbox");
    expect(result.directories).toContain("Knowledge");
    expect(result.directories).toContain("People");
    expect(result.directories).toContain("Projects");
    expect(result.directories).toContain("Sprints");

    for (const dir of result.directories) {
      expect(await fs.pathExists(path.join(result.vaultPath, dir))).toBe(true);
    }
  });

  it("generates AGENT.md and CLAUDE.md", async () => {
    const result = await createVault(makeConfig());
    const vp = result.vaultPath;

    expect(await fs.pathExists(path.join(vp, "AGENT.md"))).toBe(true);
    expect(await fs.pathExists(path.join(vp, "CLAUDE.md"))).toBe(true);

    const agentContent = await fs.readFile(path.join(vp, "AGENT.md"), "utf-8");
    expect(agentContent).toContain("TestTeam");
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
    expect(startHere).toContain("TestTeam");
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

    // members wikilinks in AGENT.md + team index, projects in AGENT.md + team index
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
      path.join(result.vaultPath, "People/TestTeam Team.md"),
      "utf-8"
    );
    expect(teamIndex).toContain("[[Alice]]");
    expect(teamIndex).toContain("[[Bob]]");
  });

  it("includes glossary entries when provided", async () => {
    const config = makeConfig({
      glossaryEntries: [{ term: "API", definition: "Application interface" }],
    });
    const result = await createVault(config);
    const glossary = await fs.readFile(
      path.join(result.vaultPath, "Knowledge/Glossary.md"),
      "utf-8"
    );
    expect(glossary).toContain("**API**");
    expect(glossary).toContain("Application interface");
  });
});
