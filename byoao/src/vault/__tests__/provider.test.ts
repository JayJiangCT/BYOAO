import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import fs from "fs-extra";
import path from "node:path";
import os from "node:os";

let tmpDir: string;
let configPath: string;

beforeEach(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "byoao-provider-"));
  configPath = path.join(tmpDir, ".config/opencode/opencode.json");
  await fs.ensureDir(path.dirname(configPath));
  vi.spyOn(os, "homedir").mockReturnValue(tmpDir);
});

afterEach(async () => {
  vi.restoreAllMocks();
  vi.resetModules();
  await fs.remove(tmpDir);
});

async function loadConfigureProvider() {
  const mod = await import("../provider.js");
  return mod.configureProvider;
}

describe("configureProvider", () => {
  it("returns no-op result for copilot (no config changes needed)", async () => {
    const configureProvider = await loadConfigureProvider();
    const result = await configureProvider("copilot");
    expect(result).not.toBeNull();
    expect(result!.provider).toBe("copilot");
    expect(result!.pluginAdded).toBe(false);
    expect(result!.projectIdSet).toBe(false);
  });

  it("adds gemini plugin and projectId to empty config", async () => {
    const configureProvider = await loadConfigureProvider();
    const result = await configureProvider("gemini", "wonder-sandbox");
    expect(result).not.toBeNull();
    expect(result!.provider).toBe("gemini");
    expect(result!.pluginAdded).toBe(true);
    expect(result!.projectIdSet).toBe(true);

    const written = await fs.readJson(configPath);
    expect(written.plugin).toContain("opencode-gemini-auth");
    expect(written.provider.google.options.projectId).toBe("wonder-sandbox");
  });

  it("skips gemini plugin if already present (idempotent)", async () => {
    await fs.writeJson(configPath, {
      plugin: ["opencode-gemini-auth"],
      provider: { google: { options: { projectId: "existing-project" } } },
    });

    const configureProvider = await loadConfigureProvider();
    const result = await configureProvider("gemini", "new-project");
    expect(result!.pluginSkipped).toBe(true);
    expect(result!.projectIdSkipped).toBe(true);

    // Original projectId preserved
    const written = await fs.readJson(configPath);
    expect(written.provider.google.options.projectId).toBe("existing-project");
  });

  it("preserves other config fields when writing", async () => {
    await fs.writeJson(configPath, {
      theme: "dark",
      mcp: { atlassian: { type: "remote", url: "https://example.com" } },
    });

    const configureProvider = await loadConfigureProvider();
    await configureProvider("gemini", "wonder-sandbox");

    const written = await fs.readJson(configPath);
    expect(written.theme).toBe("dark");
    expect(written.mcp.atlassian.url).toBe("https://example.com");
    expect(written.provider.google.options.projectId).toBe("wonder-sandbox");
  });

  it("throws if gemini selected without projectId", async () => {
    const configureProvider = await loadConfigureProvider();
    await expect(configureProvider("gemini")).rejects.toThrow(
      "GCP Project ID is required"
    );
  });

  it("adds gemini plugin to existing plugin array", async () => {
    await fs.writeJson(configPath, {
      plugin: ["superpowers@git+https://github.com/obra/superpowers.git"],
    });

    const configureProvider = await loadConfigureProvider();
    await configureProvider("gemini", "wonder-sandbox");

    const written = await fs.readJson(configPath);
    expect(written.plugin).toContain("opencode-gemini-auth");
    expect(written.plugin).toContain(
      "superpowers@git+https://github.com/obra/superpowers.git"
    );
  });
});
