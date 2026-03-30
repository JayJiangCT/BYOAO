import os from "node:os";
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
 * Resolve `~/` and `~/.byoao/` prefixes in a path to absolute form.
 */
function resolveHomePath(p: string): string {
  if (p.startsWith("~/") || p === "~") {
    return p.replace("~", os.homedir());
  }
  return p;
}

/**
 * Replace `${VAR}` placeholders in env values using the provided variables map.
 */
function resolveEnvVars(
  env: Record<string, string>,
  vars: Record<string, string>,
): Record<string, string> {
  const resolved: Record<string, string> = {};
  for (const [key, value] of Object.entries(env)) {
    resolved[key] = value.replace(/\$\{(\w+)\}/g, (_match, name) => vars[name] ?? "");
  }
  return resolved;
}

/**
 * Build the OpenCode MCP config entry for a server.
 * - remote: pass through as-is
 * - local: resolve ~ paths in command array, replace env var placeholders
 */
function buildServerConfig(
  serverConfig: PresetConfig["mcpServers"][string],
  vars: Record<string, string> = {},
): Record<string, unknown> {
  if (serverConfig.type === "remote") {
    return { type: serverConfig.type, url: serverConfig.url };
  }

  // local (stdio)
  const result: Record<string, unknown> = {
    type: serverConfig.type,
    command: serverConfig.command.map(resolveHomePath),
  };

  if (serverConfig.environment) {
    result.environment = resolveEnvVars(serverConfig.environment, vars);
  }

  return result;
}

export interface ConfigureMcpOptions {
  /** Variables to substitute in env placeholders, e.g. { GCP_PROJECT_ID: "my-project" } */
  vars?: Record<string, string>;
  /** Server names to skip (user deselected in init flow) */
  skip?: string[];
}

/**
 * Merge a preset's MCP servers into the global OpenCode config.
 * Preserves existing entries — only adds servers not already configured.
 */
export async function configureMcp(
  presetConfig: PresetConfig,
  options: ConfigureMcpOptions = {},
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
  const skipSet = new Set(options.skip ?? []);

  for (const [name, serverConfig] of Object.entries(mcpServers)) {
    if (skipSet.has(name)) {
      serversSkipped.push(name);
    } else if (existingMcp[name]) {
      serversSkipped.push(name);
    } else {
      existingMcp[name] = buildServerConfig(serverConfig, options.vars ?? {});
      serversAdded.push(name);
    }
  }

  if (serversAdded.length > 0) {
    config.mcp = existingMcp;
    await writeOpencodeConfig(config);
  }

  return { configPath, serversAdded, serversSkipped };
}
