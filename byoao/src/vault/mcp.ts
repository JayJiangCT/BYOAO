import fs from "fs-extra";
import path from "node:path";
import os from "node:os";
import type { PresetConfig } from "../plugin-config.js";

const OPENCODE_CONFIG_PATHS = [
  path.join(os.homedir(), ".config/opencode/opencode.json"),
  path.join(os.homedir(), ".config/opencode/.opencode.json"),
];

function findOpencodeConfig(): string {
  for (const p of OPENCODE_CONFIG_PATHS) {
    if (fs.existsSync(p)) return p;
  }
  // Default to primary path if none exists yet
  return OPENCODE_CONFIG_PATHS[0];
}

export interface ConfigureMcpResult {
  configPath: string;
  serversAdded: string[];
  serversSkipped: string[];
}

/**
 * Merge a preset's MCP servers into the global OpenCode config.
 * Preserves existing entries — only adds servers not already configured.
 */
export async function configureMcp(
  presetConfig: PresetConfig
): Promise<ConfigureMcpResult | null> {
  const mcpServers = presetConfig.mcpServers;
  if (!mcpServers || Object.keys(mcpServers).length === 0) {
    return null;
  }

  const configPath = findOpencodeConfig();
  await fs.ensureDir(path.dirname(configPath));

  let config: Record<string, unknown> = {};
  if (await fs.pathExists(configPath)) {
    try {
      config = await fs.readJson(configPath);
    } catch {
      // Invalid JSON — start fresh
    }
  }

  const existingMcp = (config.mcp as Record<string, unknown>) || {};
  const serversAdded: string[] = [];
  const serversSkipped: string[] = [];

  for (const [name, serverConfig] of Object.entries(mcpServers)) {
    if (existingMcp[name]) {
      serversSkipped.push(name);
    } else {
      existingMcp[name] = serverConfig;
      serversAdded.push(name);
    }
  }

  if (serversAdded.length > 0) {
    config.mcp = existingMcp;
    await fs.writeJson(configPath, config, { spaces: 2 });
  }

  return { configPath, serversAdded, serversSkipped };
}
