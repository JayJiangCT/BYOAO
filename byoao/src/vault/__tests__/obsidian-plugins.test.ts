import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import fs from "fs-extra";
import path from "node:path";
import os from "node:os";
import type { PresetConfig } from "../../plugin-config.js";

let tmpDir: string;

beforeEach(async () => {
  vi.resetModules();
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "byoao-plugins-"));
  await fs.ensureDir(path.join(tmpDir, ".obsidian"));
});

afterEach(async () => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  await fs.remove(tmpDir);
});

function makePreset(
  obsidianPlugins: PresetConfig["obsidianPlugins"] = {}
): PresetConfig {
  return {
    name: "test",
    displayName: "Test",
    description: "test preset",
    directories: [],
    agentDescription: "test",
    frontmatterExtras: {},
    templates: [],
    mcpServers: {},
    obsidianPlugins,
  };
}

function mockGitHubRelease(assets: Array<{ name: string; browser_download_url: string }>) {
  return { assets };
}

const FAKE_MAIN_JS = "console.log('plugin');";
const FAKE_MANIFEST = JSON.stringify({ id: "test-plugin", version: "1.0.0" });
const FAKE_BRAT_MAIN = "console.log('brat');";
const FAKE_BRAT_MANIFEST = JSON.stringify({ id: "obsidian42-brat", version: "1.0.0" });

// Helper: mock fetch for BRAT + one plugin (6 calls: BRAT release + 2 assets, plugin release + 2 assets)
function mockFetchForBratAndPlugin() {
  return vi.fn()
    // BRAT release metadata
    .mockResolvedValueOnce({
      ok: true,
      json: async () => mockGitHubRelease([
        { name: "main.js", browser_download_url: "https://example.com/brat/main.js" },
        { name: "manifest.json", browser_download_url: "https://example.com/brat/manifest.json" },
      ]),
    })
    // BRAT main.js
    .mockResolvedValueOnce({ ok: true, text: async () => FAKE_BRAT_MAIN })
    // BRAT manifest.json
    .mockResolvedValueOnce({ ok: true, text: async () => FAKE_BRAT_MANIFEST })
    // Plugin release metadata
    .mockResolvedValueOnce({
      ok: true,
      json: async () => mockGitHubRelease([
        { name: "main.js", browser_download_url: "https://example.com/plugin/main.js" },
        { name: "manifest.json", browser_download_url: "https://example.com/plugin/manifest.json" },
      ]),
    })
    // Plugin main.js
    .mockResolvedValueOnce({ ok: true, text: async () => FAKE_MAIN_JS })
    // Plugin manifest.json
    .mockResolvedValueOnce({ ok: true, text: async () => FAKE_MANIFEST });
}

describe("configureObsidianPlugins", () => {
  it("returns null when preset has no obsidianPlugins", async () => {
    const { configureObsidianPlugins } = await import("../obsidian-plugins.js");
    const result = await configureObsidianPlugins(tmpDir, makePreset());
    expect(result).toBeNull();
  });

  it("installs BRAT automatically when plugins declared", async () => {
    vi.stubGlobal("fetch", mockFetchForBratAndPlugin());
    const { configureObsidianPlugins } = await import("../obsidian-plugins.js");
    const result = await configureObsidianPlugins(tmpDir, makePreset({
      "test-plugin": { repo: "owner/test-plugin", version: "latest" },
    }));

    expect(result!.bratNewlyInstalled).toBe(true);
    expect(await fs.pathExists(path.join(tmpDir, ".obsidian/plugins/obsidian42-brat/main.js"))).toBe(true);
    expect(await fs.pathExists(path.join(tmpDir, ".obsidian/plugins/obsidian42-brat/manifest.json"))).toBe(true);
  });

  it("skips BRAT when already installed", async () => {
    // Pre-create BRAT
    const bratDir = path.join(tmpDir, ".obsidian/plugins/obsidian42-brat");
    await fs.ensureDir(bratDir);
    await fs.writeFile(path.join(bratDir, "main.js"), "existing-brat");

    // Only need plugin fetch (3 calls: release + 2 assets)
    const mockFetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockGitHubRelease([
          { name: "main.js", browser_download_url: "https://example.com/plugin/main.js" },
          { name: "manifest.json", browser_download_url: "https://example.com/plugin/manifest.json" },
        ]),
      })
      .mockResolvedValueOnce({ ok: true, text: async () => FAKE_MAIN_JS })
      .mockResolvedValueOnce({ ok: true, text: async () => FAKE_MANIFEST });
    vi.stubGlobal("fetch", mockFetch);

    const { configureObsidianPlugins } = await import("../obsidian-plugins.js");
    const result = await configureObsidianPlugins(tmpDir, makePreset({
      "test-plugin": { repo: "owner/test-plugin", version: "latest" },
    }));

    expect(result!.bratNewlyInstalled).toBe(false);
    // BRAT not overwritten
    const bratContent = await fs.readFile(path.join(bratDir, "main.js"), "utf-8");
    expect(bratContent).toBe("existing-brat");
  });

  it("downloads and installs plugin files", async () => {
    vi.stubGlobal("fetch", mockFetchForBratAndPlugin());
    const { configureObsidianPlugins } = await import("../obsidian-plugins.js");
    const result = await configureObsidianPlugins(tmpDir, makePreset({
      "test-plugin": { repo: "owner/test-plugin", version: "latest" },
    }));

    expect(result!.pluginsAdded).toContain("test-plugin");
    expect(await fs.pathExists(path.join(tmpDir, ".obsidian/plugins/test-plugin/main.js"))).toBe(true);
    expect(await fs.pathExists(path.join(tmpDir, ".obsidian/plugins/test-plugin/manifest.json"))).toBe(true);
  });

  it("writes data.json when config provided", async () => {
    vi.stubGlobal("fetch", mockFetchForBratAndPlugin());
    const { configureObsidianPlugins } = await import("../obsidian-plugins.js");
    await configureObsidianPlugins(tmpDir, makePreset({
      "test-plugin": {
        repo: "owner/test-plugin",
        version: "latest",
        config: { defaultAgent: "opencode" },
      },
    }));

    const dataJson = await fs.readJson(
      path.join(tmpDir, ".obsidian/plugins/test-plugin/data.json")
    );
    expect(dataJson.defaultAgent).toBe("opencode");
  });

  it("does not write data.json when config undefined", async () => {
    vi.stubGlobal("fetch", mockFetchForBratAndPlugin());
    const { configureObsidianPlugins } = await import("../obsidian-plugins.js");
    await configureObsidianPlugins(tmpDir, makePreset({
      "test-plugin": { repo: "owner/test-plugin", version: "latest" },
    }));

    expect(await fs.pathExists(
      path.join(tmpDir, ".obsidian/plugins/test-plugin/data.json")
    )).toBe(false);
  });

  it("updates community-plugins.json with BRAT and plugin", async () => {
    vi.stubGlobal("fetch", mockFetchForBratAndPlugin());
    const { configureObsidianPlugins } = await import("../obsidian-plugins.js");
    await configureObsidianPlugins(tmpDir, makePreset({
      "test-plugin": { repo: "owner/test-plugin", version: "latest" },
    }));

    const plugins = await fs.readJson(
      path.join(tmpDir, ".obsidian/community-plugins.json")
    );
    expect(plugins).toContain("obsidian42-brat");
    expect(plugins).toContain("test-plugin");
  });

  it("registers plugin in BRAT data.json pluginList", async () => {
    vi.stubGlobal("fetch", mockFetchForBratAndPlugin());
    const { configureObsidianPlugins } = await import("../obsidian-plugins.js");
    await configureObsidianPlugins(tmpDir, makePreset({
      "test-plugin": { repo: "owner/test-plugin", version: "latest" },
    }));

    const bratData = await fs.readJson(
      path.join(tmpDir, ".obsidian/plugins/obsidian42-brat/data.json")
    );
    expect(bratData.pluginList).toContain("owner/test-plugin");
  });

  it("preserves existing BRAT pluginList entries", async () => {
    const bratDir = path.join(tmpDir, ".obsidian/plugins/obsidian42-brat");
    await fs.ensureDir(bratDir);
    await fs.writeFile(path.join(bratDir, "main.js"), "brat");
    await fs.writeJson(path.join(bratDir, "data.json"), {
      pluginList: ["other/existing-plugin"],
      updateAtStartup: true,
    });

    const mockFetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockGitHubRelease([
          { name: "main.js", browser_download_url: "https://example.com/main.js" },
          { name: "manifest.json", browser_download_url: "https://example.com/manifest.json" },
        ]),
      })
      .mockResolvedValueOnce({ ok: true, text: async () => FAKE_MAIN_JS })
      .mockResolvedValueOnce({ ok: true, text: async () => FAKE_MANIFEST });
    vi.stubGlobal("fetch", mockFetch);

    const { configureObsidianPlugins } = await import("../obsidian-plugins.js");
    await configureObsidianPlugins(tmpDir, makePreset({
      "new-plugin": { repo: "owner/new-plugin", version: "latest" },
    }));

    const bratData = await fs.readJson(path.join(bratDir, "data.json"));
    expect(bratData.pluginList).toContain("other/existing-plugin");
    expect(bratData.pluginList).toContain("owner/new-plugin");
    expect(bratData.updateAtStartup).toBe(true);
  });

  it("deduplicates BRAT pluginList", async () => {
    const bratDir = path.join(tmpDir, ".obsidian/plugins/obsidian42-brat");
    await fs.ensureDir(bratDir);
    await fs.writeFile(path.join(bratDir, "main.js"), "brat");
    await fs.writeJson(path.join(bratDir, "data.json"), {
      pluginList: ["owner/test-plugin"],
    });

    const mockFetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockGitHubRelease([
          { name: "main.js", browser_download_url: "https://example.com/main.js" },
          { name: "manifest.json", browser_download_url: "https://example.com/manifest.json" },
        ]),
      })
      .mockResolvedValueOnce({ ok: true, text: async () => FAKE_MAIN_JS })
      .mockResolvedValueOnce({ ok: true, text: async () => FAKE_MANIFEST });
    vi.stubGlobal("fetch", mockFetch);

    const { configureObsidianPlugins } = await import("../obsidian-plugins.js");
    await configureObsidianPlugins(tmpDir, makePreset({
      "test-plugin": { repo: "owner/test-plugin", version: "latest" },
    }));

    const bratData = await fs.readJson(path.join(bratDir, "data.json"));
    const count = bratData.pluginList.filter((r: string) => r === "owner/test-plugin").length;
    expect(count).toBe(1);
  });

  it("skips already-installed plugins (idempotent)", async () => {
    const pluginDir = path.join(tmpDir, ".obsidian/plugins/test-plugin");
    await fs.ensureDir(pluginDir);
    await fs.writeFile(path.join(pluginDir, "main.js"), "existing");

    vi.stubGlobal("fetch", mockFetchForBratAndPlugin());
    const { configureObsidianPlugins } = await import("../obsidian-plugins.js");
    const result = await configureObsidianPlugins(tmpDir, makePreset({
      "test-plugin": { repo: "owner/test-plugin", version: "latest" },
    }));

    expect(result!.pluginsSkipped).toContain("test-plugin");
    expect(result!.pluginsAdded).not.toContain("test-plugin");
    const content = await fs.readFile(path.join(pluginDir, "main.js"), "utf-8");
    expect(content).toBe("existing");
  });

  it("preserves existing community-plugins.json entries", async () => {
    await fs.writeJson(
      path.join(tmpDir, ".obsidian/community-plugins.json"),
      ["existing-plugin"]
    );

    vi.stubGlobal("fetch", mockFetchForBratAndPlugin());
    const { configureObsidianPlugins } = await import("../obsidian-plugins.js");
    await configureObsidianPlugins(tmpDir, makePreset({
      "new-plugin": { repo: "owner/new-plugin", version: "latest" },
    }));

    const plugins = await fs.readJson(
      path.join(tmpDir, ".obsidian/community-plugins.json")
    );
    expect(plugins).toContain("existing-plugin");
  });

  it("records error on download failure, continues", async () => {
    // BRAT succeeds
    const mockFetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockGitHubRelease([
          { name: "main.js", browser_download_url: "https://example.com/brat/main.js" },
          { name: "manifest.json", browser_download_url: "https://example.com/brat/manifest.json" },
        ]),
      })
      .mockResolvedValueOnce({ ok: true, text: async () => FAKE_BRAT_MAIN })
      .mockResolvedValueOnce({ ok: true, text: async () => FAKE_BRAT_MANIFEST })
      // Plugin fails
      .mockResolvedValueOnce({ ok: false, status: 404, statusText: "Not Found" });
    vi.stubGlobal("fetch", mockFetch);

    const { configureObsidianPlugins } = await import("../obsidian-plugins.js");
    const result = await configureObsidianPlugins(tmpDir, makePreset({
      "bad-plugin": { repo: "owner/bad-plugin", version: "latest" },
    }));

    expect(result!.errors).toHaveLength(1);
    expect(result!.errors[0].pluginId).toBe("bad-plugin");
    expect(result!.pluginsAdded).toHaveLength(0);
  });

  it("BRAT failure does not block plugin install", async () => {
    // BRAT fails
    const mockFetch = vi.fn()
      .mockResolvedValueOnce({ ok: false, status: 404, statusText: "Not Found" })
      // Plugin succeeds
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockGitHubRelease([
          { name: "main.js", browser_download_url: "https://example.com/main.js" },
          { name: "manifest.json", browser_download_url: "https://example.com/manifest.json" },
        ]),
      })
      .mockResolvedValueOnce({ ok: true, text: async () => FAKE_MAIN_JS })
      .mockResolvedValueOnce({ ok: true, text: async () => FAKE_MANIFEST });
    vi.stubGlobal("fetch", mockFetch);

    const { configureObsidianPlugins } = await import("../obsidian-plugins.js");
    const result = await configureObsidianPlugins(tmpDir, makePreset({
      "test-plugin": { repo: "owner/test-plugin", version: "latest" },
    }));

    expect(result!.bratNewlyInstalled).toBe(false);
    expect(result!.pluginsAdded).toContain("test-plugin");
  });

  it("errors on missing required assets", async () => {
    // BRAT succeeds
    const mockFetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockGitHubRelease([
          { name: "main.js", browser_download_url: "https://example.com/brat/main.js" },
          { name: "manifest.json", browser_download_url: "https://example.com/brat/manifest.json" },
        ]),
      })
      .mockResolvedValueOnce({ ok: true, text: async () => FAKE_BRAT_MAIN })
      .mockResolvedValueOnce({ ok: true, text: async () => FAKE_BRAT_MANIFEST })
      // Plugin has no main.js
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockGitHubRelease([
          { name: "styles.css", browser_download_url: "https://example.com/styles.css" },
        ]),
      });
    vi.stubGlobal("fetch", mockFetch);

    const { configureObsidianPlugins } = await import("../obsidian-plugins.js");
    const result = await configureObsidianPlugins(tmpDir, makePreset({
      "incomplete": { repo: "owner/incomplete", version: "latest" },
    }));

    expect(result!.errors).toHaveLength(1);
    expect(result!.errors[0].error).toContain("missing required assets");
  });

  it("uses GITHUB_TOKEN when available", async () => {
    vi.stubEnv("GITHUB_TOKEN", "test-token-123");
    vi.stubGlobal("fetch", mockFetchForBratAndPlugin());

    const { configureObsidianPlugins } = await import("../obsidian-plugins.js");
    await configureObsidianPlugins(tmpDir, makePreset({
      "test-plugin": { repo: "owner/test-plugin", version: "latest" },
    }));

    const firstCall = vi.mocked(fetch).mock.calls[0];
    expect(firstCall[1]!.headers).toHaveProperty("Authorization", "token test-token-123");
  });

  it("supports version pinning", async () => {
    vi.stubGlobal("fetch", mockFetchForBratAndPlugin());

    const { configureObsidianPlugins } = await import("../obsidian-plugins.js");
    await configureObsidianPlugins(tmpDir, makePreset({
      "test-plugin": { repo: "owner/test-plugin", version: "1.2.0" },
    }));

    // 4th call is the plugin release fetch (after 3 BRAT calls)
    const pluginReleaseCall = vi.mocked(fetch).mock.calls[3];
    expect(pluginReleaseCall[0]).toContain("/releases/tags/1.2.0");
  });

  it("times out after 30 seconds on hanging request", async () => {
    // Mock a fetch that rejects when the signal aborts (mimicking real fetch behavior)
    const mockFetch = vi.fn().mockImplementation((_url: string, opts?: RequestInit) =>
      new Promise((_resolve, reject) => {
        if (opts?.signal) {
          const signal = opts.signal as AbortSignal;
          if (signal.aborted) {
            reject(new DOMException("The operation was aborted.", "AbortError"));
            return;
          }
          signal.addEventListener("abort", () => {
            reject(new DOMException("The operation was aborted.", "AbortError"));
          });
        }
        // Otherwise never resolves
      })
    );
    vi.stubGlobal("fetch", mockFetch);

    // Override AbortController to trigger immediately for test speed
    const originalAbort = globalThis.AbortController;
    vi.stubGlobal("AbortController", class {
      controller = new originalAbort();
      signal = this.controller.signal;
      abort() { this.controller.abort(); }
    });

    // Patch the module's FETCH_TIMEOUT_MS by using a short setTimeout
    // We can't easily patch the const, but since we replaced AbortController
    // and the setTimeout still fires after 30s, let's just force immediate abort.
    // Instead, override setTimeout to fire immediately for our test.
    const origSetTimeout = globalThis.setTimeout;
    vi.stubGlobal("setTimeout", (fn: () => void, _ms?: number) => origSetTimeout(fn, 1));

    const { configureObsidianPlugins } = await import("../obsidian-plugins.js");
    const result = await configureObsidianPlugins(tmpDir, makePreset({
      "test-plugin": { repo: "owner/test-plugin", version: "latest" },
    }));

    // Both BRAT and plugin should have errors due to timeout/abort
    expect(result!.errors.length).toBeGreaterThanOrEqual(1);
    vi.stubGlobal("AbortController", originalAbort);
    vi.stubGlobal("setTimeout", origSetTimeout);
  }, 10_000);
});
