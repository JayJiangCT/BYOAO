import type { PresetConfig } from "../plugin-config.js";
import {
  findOpencodeConfig,
  readOpencodeConfig,
  writeOpencodeConfig,
} from "./opencode-config.js";

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
  const config = await readOpencodeConfig();

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
    await writeOpencodeConfig(config);
  }

  return { configPath, serversAdded, serversSkipped };
}
