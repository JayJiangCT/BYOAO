import { execFileSync } from "node:child_process";

export interface ObsidianCliResult {
  success: boolean;
  output: string;
  error?: string;
}

/**
 * Check if the `obsidian` CLI is available in PATH.
 */
export function isObsidianCliAvailable(): boolean {
  try {
    execFileSync("obsidian", ["--version"], { stdio: "pipe" });
    return true;
  } catch {
    return false;
  }
}

/**
 * Execute an Obsidian CLI command and return the result.
 * Uses execFileSync (array form) to avoid shell injection.
 * @param args - Command arguments (e.g., ["orphans", "--vault", "MyVault"])
 */
export function execObsidianCmd(args: string[]): ObsidianCliResult {
  try {
    const output = execFileSync("obsidian", args, {
      stdio: "pipe",
      encoding: "utf-8",
      timeout: 10000,
    });
    return { success: true, output: output.trim() };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, output: "", error: msg };
  }
}

/**
 * Execute an Obsidian CLI command and parse JSON output.
 */
export function execObsidianJson<T = unknown>(args: string[]): T | null {
  const result = execObsidianCmd([...args, "format=json"]);
  if (!result.success) return null;
  try {
    return JSON.parse(result.output) as T;
  } catch {
    return null;
  }
}
