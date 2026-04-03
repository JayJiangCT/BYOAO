import { fs } from "../lib/cjs-modules.js";
import path from "node:path";
import os from "node:os";

const OPENCODE_CONFIG_PATHS = [
  path.join(os.homedir(), ".config/opencode/opencode.json"),
  path.join(os.homedir(), ".config/opencode/.opencode.json"),
];

/** Find the first existing OpenCode config file, or return the default path. */
export function findOpencodeConfig(): string {
  for (const p of OPENCODE_CONFIG_PATHS) {
    if (fs.existsSync(p)) return p;
  }
  return OPENCODE_CONFIG_PATHS[0];
}

/** Read the OpenCode config, returning empty object if missing or invalid. */
export async function readOpencodeConfig(): Promise<Record<string, unknown>> {
  const configPath = findOpencodeConfig();
  if (await fs.pathExists(configPath)) {
    try {
      return await fs.readJson(configPath);
    } catch {
      // Invalid JSON — return empty
    }
  }
  return {};
}

/** Write the OpenCode config, ensuring the directory exists. */
export async function writeOpencodeConfig(
  config: Record<string, unknown>
): Promise<string> {
  const configPath = findOpencodeConfig();
  await fs.ensureDir(path.dirname(configPath));
  await fs.writeJson(configPath, config, { spaces: 2 });
  return configPath;
}
