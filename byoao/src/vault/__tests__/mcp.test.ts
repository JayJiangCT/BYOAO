import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import fs from "fs-extra";
import path from "node:path";
import os from "node:os";
import type { PresetConfig } from "../../plugin-config.js";

let tmpDir: string;
let configPath: string;

beforeEach(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "byoao-mcp-"));
  configPath = path.join(tmpDir, ".config/opencode/opencode.json");
  await fs.ensureDir(path.dirname(configPath));

  // Mock os.homedir() to point at our temp dir
  vi.spyOn(os, "homedir").mockReturnValue(tmpDir);
});

afterEach(async () => {
  vi.restoreAllMocks();
  // Re-import to clear module cache with mocked homedir
  vi.resetModules();
  await fs.remove(tmpDir);
});

async function loadConfigureMcp() {
  const mod = await import("../mcp.js");
  return mod.configureMcp;
}

function makePreset(
  mcpServers: PresetConfig["mcpServers"] = {}
): PresetConfig {
  return {
    name: "test",
    displayName: "Test",
    description: "test preset",
    directories: [],
    agentDescription: "test",
    frontmatterExtras: {},
    templates: [],
    mcpServers,
  };
}

describe("configureMcp", () => {
  it("returns null when preset has no mcpServers", async () => {
    const configureMcp = await loadConfigureMcp();
    const result = await configureMcp(makePreset());
    expect(result).toBeNull();
  });

  it("adds servers to empty config", async () => {
    const configureMcp = await loadConfigureMcp();
    const preset = makePreset({
      atlassian: { type: "remote", url: "https://mcp.atlassian.com/v1/sse" },
    });

    const result = await configureMcp(preset);
    expect(result).not.toBeNull();
    expect(result!.serversAdded).toContain("atlassian");
    expect(result!.serversSkipped).toHaveLength(0);

    const written = await fs.readJson(configPath);
    expect(written.mcp.atlassian.url).toBe(
      "https://mcp.atlassian.com/v1/sse"
    );
  });

  it("skips servers that already exist (idempotent)", async () => {
    // Pre-populate config
    await fs.writeJson(configPath, {
      mcp: {
        atlassian: { type: "remote", url: "https://existing.example.com" },
      },
    });

    const configureMcp = await loadConfigureMcp();
    const preset = makePreset({
      atlassian: { type: "remote", url: "https://mcp.atlassian.com/v1/sse" },
    });

    const result = await configureMcp(preset);
    expect(result!.serversSkipped).toContain("atlassian");
    expect(result!.serversAdded).toHaveLength(0);

    // Original URL preserved
    const written = await fs.readJson(configPath);
    expect(written.mcp.atlassian.url).toBe("https://existing.example.com");
  });

  it("preserves other config fields when writing", async () => {
    await fs.writeJson(configPath, {
      theme: "dark",
      mcp: {},
    });

    const configureMcp = await loadConfigureMcp();
    const preset = makePreset({
      linear: { type: "remote", url: "https://mcp.linear.app" },
    });

    await configureMcp(preset);

    const written = await fs.readJson(configPath);
    expect(written.theme).toBe("dark");
    expect(written.mcp.linear).toBeDefined();
  });
});
