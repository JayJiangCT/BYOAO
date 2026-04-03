import { fs } from "../lib/cjs-modules.js";
import path from "node:path";
import { execSync } from "node:child_process";
import type { PresetConfig } from "../plugin-config.js";

const BRAT_PLUGIN_ID = "obsidian42-brat";
const BRAT_REPO = "TfTHacker/obsidian42-brat";
const REQUIRED_ASSETS = ["main.js", "manifest.json"];
const OPTIONAL_ASSETS = ["styles.css"];
const FETCH_TIMEOUT_MS = 30_000;

export interface ConfigurePluginsResult {
  bratNewlyInstalled: boolean;
  pluginsAdded: string[];
  pluginsSkipped: string[];
  errors: Array<{ pluginId: string; error: string }>;
}

function getHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github.v3+json",
  };
  const token = process.env.GITHUB_TOKEN;
  if (token) {
    headers.Authorization = `token ${token}`;
  }
  return headers;
}

function getReleaseUrl(repo: string, version: string): string {
  if (version === "latest") {
    return `https://api.github.com/repos/${repo}/releases/latest`;
  }
  return `https://api.github.com/repos/${repo}/releases/tags/${version}`;
}

async function fetchWithTimeout(url: string, options: RequestInit = {}): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Resolve command names to absolute paths in plugin config.
 * Obsidian GUI apps don't inherit terminal PATH, so commands like "opencode"
 * must be resolved to their full path (e.g., "/Users/jay/.opencode/bin/opencode").
 */
function resolveCommandPaths(config: Record<string, unknown>): Record<string, unknown> {
  const result = { ...config };

  // Resolve command in customAgents array
  if (Array.isArray(result.customAgents)) {
    result.customAgents = (result.customAgents as Array<Record<string, unknown>>).map((agent) => {
      if (typeof agent.command === "string" && !agent.command.startsWith("/")) {
        try {
          const resolved = execSync(`which ${agent.command}`, { encoding: "utf-8" }).trim();
          if (resolved) {
            return { ...agent, command: resolved };
          }
        } catch {
          // Command not found — leave as-is
        }
      }
      return agent;
    });
  }

  return result;
}

/**
 * Download a plugin from GitHub Releases into .obsidian/plugins/<id>/.
 * Caller must check if plugin already exists before calling.
 * Throws on failure.
 */
async function downloadPlugin(
  pluginId: string,
  repo: string,
  version: string,
  pluginsDir: string,
  config?: Record<string, unknown>
): Promise<void> {
  const headers = getHeaders();

  // 1. Fetch release metadata
  const releaseUrl = getReleaseUrl(repo, version);
  const releaseRes = await fetchWithTimeout(releaseUrl, { headers });

  if (!releaseRes.ok) {
    const msg = releaseRes.status === 403
      ? "GitHub API rate limited — try setting GITHUB_TOKEN env var"
      : `GitHub API error: ${releaseRes.status} ${releaseRes.statusText}`;
    throw new Error(msg);
  }

  const release = (await releaseRes.json()) as {
    assets: Array<{ name: string; browser_download_url: string }>;
  };

  // 2. Validate required assets
  const assetMap = new Map(release.assets.map((a) => [a.name, a.browser_download_url]));
  const missingRequired = REQUIRED_ASSETS.filter((name) => !assetMap.has(name));
  if (missingRequired.length > 0) {
    throw new Error(`Plugin release missing required assets: ${missingRequired.join(", ")}`);
  }

  // 3. Download assets
  const pluginDir = path.join(pluginsDir, pluginId);
  await fs.ensureDir(pluginDir);
  const allAssets = [...REQUIRED_ASSETS, ...OPTIONAL_ASSETS];

  for (const assetName of allAssets) {
    const url = assetMap.get(assetName);
    if (!url) continue;
    const assetRes = await fetchWithTimeout(url, { headers });
    if (assetRes.ok) {
      const content = await assetRes.text();
      await fs.writeFile(path.join(pluginDir, assetName), content);
    }
  }

  // 4. Write plugin config if provided, resolving command paths to absolute
  if (config) {
    const resolved = resolveCommandPaths(config);
    await fs.writeJson(path.join(pluginDir, "data.json"), resolved, { spaces: 2 });
  }
}

/**
 * Download and configure Obsidian community plugins from a preset.
 * Three-step install: BRAT → plugins → BRAT registration.
 */
export async function configureObsidianPlugins(
  vaultPath: string,
  presetConfig: PresetConfig
): Promise<ConfigurePluginsResult | null> {
  const obsidianPlugins = presetConfig.obsidianPlugins;
  if (!obsidianPlugins || Object.keys(obsidianPlugins).length === 0) {
    return null;
  }

  const pluginsDir = path.join(vaultPath, ".obsidian", "plugins");
  await fs.ensureDir(pluginsDir);

  let bratNewlyInstalled = false;
  const pluginsAdded: string[] = [];
  const pluginsSkipped: string[] = [];
  const errors: Array<{ pluginId: string; error: string }> = [];

  // Step 1: Install BRAT if not present
  const bratMainJs = path.join(pluginsDir, BRAT_PLUGIN_ID, "main.js");
  if (!(await fs.pathExists(bratMainJs))) {
    try {
      await downloadPlugin(BRAT_PLUGIN_ID, BRAT_REPO, "latest", pluginsDir);
      bratNewlyInstalled = true;
    } catch (err) {
      errors.push({
        pluginId: BRAT_PLUGIN_ID,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  // Step 2: Install each preset plugin
  for (const [pluginId, pluginDef] of Object.entries(obsidianPlugins)) {
    const pluginMainJs = path.join(pluginsDir, pluginId, "main.js");

    if (await fs.pathExists(pluginMainJs)) {
      pluginsSkipped.push(pluginId);
      continue;
    }

    try {
      await downloadPlugin(
        pluginId,
        pluginDef.repo,
        pluginDef.version ?? "latest",
        pluginsDir,
        pluginDef.config
      );
      pluginsAdded.push(pluginId);
    } catch (err) {
      errors.push({
        pluginId,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  // Update community-plugins.json
  const communityPluginsPath = path.join(vaultPath, ".obsidian", "community-plugins.json");
  let communityPlugins: string[] = [];
  if (await fs.pathExists(communityPluginsPath)) {
    try {
      communityPlugins = await fs.readJson(communityPluginsPath);
    } catch {
      // Invalid JSON — start fresh
    }
  }

  // Always ensure BRAT is in community-plugins.json when plugins are declared
  // (handles edge case where BRAT dir exists but was removed from JSON)
  const bratDirExists = await fs.pathExists(path.join(pluginsDir, BRAT_PLUGIN_ID));
  const allPluginIds = [
    ...(bratNewlyInstalled || bratDirExists ? [BRAT_PLUGIN_ID] : []),
    ...pluginsAdded,
  ];
  for (const id of allPluginIds) {
    if (!communityPlugins.includes(id)) {
      communityPlugins.push(id);
    }
  }
  if (allPluginIds.length > 0) {
    await fs.writeJson(communityPluginsPath, communityPlugins, { spaces: 2 });
  }

  // Step 3: Register plugins in BRAT config
  const bratDataPath = path.join(pluginsDir, BRAT_PLUGIN_ID, "data.json");
  if (pluginsAdded.length > 0 && await fs.pathExists(path.join(pluginsDir, BRAT_PLUGIN_ID))) {
    let bratData: Record<string, unknown> = {
      pluginList: [],
      pluginSubListFrozenVersion: [],
      themesList: [],
      updateAtStartup: true,
      updateThemesAtStartup: false,
      ribbonIconEnabled: true,
      loggingEnabled: false,
    };

    if (await fs.pathExists(bratDataPath)) {
      try {
        bratData = { ...bratData, ...(await fs.readJson(bratDataPath)) };
      } catch {
        // Invalid JSON — use defaults
      }
    }

    const pluginList = (bratData.pluginList as string[]) || [];
    for (const pluginId of pluginsAdded) {
      const repo = obsidianPlugins[pluginId]?.repo;
      if (repo && !pluginList.includes(repo)) {
        pluginList.push(repo);
      }
    }
    bratData.pluginList = pluginList;
    await fs.writeJson(bratDataPath, bratData, { spaces: 2 });
  }

  return { bratNewlyInstalled, pluginsAdded, pluginsSkipped, errors };
}
