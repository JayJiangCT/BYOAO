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
    initOfferWhen: "always",
    directories: [],
    agentDescription: "test",
    frontmatterExtras: {},
    templates: [],
    mcpServers,
    obsidianPlugins: {},
  };
}

describe("configureMcp", () => {
  it("returns null when preset has no mcpServers", async () => {
    const configureMcp = await loadConfigureMcp();
    const result = await configureMcp(makePreset());
    expect(result).toBeNull();
  });

  it("adds remote servers to empty config", async () => {
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

  it("adds local servers with resolved env vars", async () => {
    const configureMcp = await loadConfigureMcp();
    const preset = makePreset({
      bigquery: {
        type: "local",
        command: ["npx", "-y", "@toolbox-sdk/server", "--prebuilt=bigquery", "--stdio"],
        environment: { BIGQUERY_PROJECT: "${GCP_PROJECT_ID}" },
      },
    });

    const result = await configureMcp(preset, {
      vars: { GCP_PROJECT_ID: "my-project-123" },
    });

    expect(result!.serversAdded).toContain("bigquery");

    const written = await fs.readJson(configPath);
    const bq = written.mcp.bigquery;
    expect(bq.type).toBe("local");
    expect(bq.command).toEqual(["npx", "-y", "@toolbox-sdk/server", "--prebuilt=bigquery", "--stdio"]);
    expect(bq.environment.BIGQUERY_PROJECT).toBe("my-project-123");
  });

  it("resolves ~ in local command paths", async () => {
    const configureMcp = await loadConfigureMcp();
    const preset = makePreset({
      custom: {
        type: "local",
        command: ["~/.local/bin/tool", "--config", "~/.config/tool.yaml"],
      },
    });

    const result = await configureMcp(preset);
    expect(result!.serversAdded).toContain("custom");

    const written = await fs.readJson(configPath);
    expect(written.mcp.custom.command[0]).toBe(path.join(tmpDir, ".local/bin/tool"));
    expect(written.mcp.custom.command[2]).toBe(path.join(tmpDir, ".config/tool.yaml"));
  });

  it("skips servers that already exist (idempotent)", async () => {
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

  it("skips servers in the skip list", async () => {
    const configureMcp = await loadConfigureMcp();
    const preset = makePreset({
      atlassian: { type: "remote", url: "https://mcp.atlassian.com/v1/sse" },
      bigquery: {
        type: "local",
        command: ["npx", "-y", "@toolbox-sdk/server", "--prebuilt=bigquery", "--stdio"],
      },
    });

    const result = await configureMcp(preset, { skip: ["bigquery"] });
    expect(result!.serversAdded).toEqual(["atlassian"]);
    expect(result!.serversSkipped).toEqual(["bigquery"]);

    const written = await fs.readJson(configPath);
    expect(written.mcp.atlassian).toBeDefined();
    expect(written.mcp.bigquery).toBeUndefined();
  });

  it("handles local server without environment", async () => {
    const configureMcp = await loadConfigureMcp();
    const preset = makePreset({
      tool: {
        type: "local",
        command: ["/usr/local/bin/tool", "--flag"],
      },
    });

    const result = await configureMcp(preset);
    expect(result!.serversAdded).toContain("tool");

    const written = await fs.readJson(configPath);
    expect(written.mcp.tool.command).toEqual(["/usr/local/bin/tool", "--flag"]);
    expect(written.mcp.tool.environment).toBeUndefined();
  });
});
