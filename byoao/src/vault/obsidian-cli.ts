import { execFileSync, execSync } from "node:child_process";
import { platform } from "node:os";

export interface ObsidianCliResult {
  success: boolean;
  output: string;
  error?: string;
}

/** Cached result of CLI availability check. */
let _cliAvailableCache: boolean | null = null;

/**
 * Check if Obsidian is running (and thus its CLI is usable).
 * Uses `pgrep` on macOS / Linux, which checks process existence
 * without sending IPC to the app — avoids triggering window focus.
 */
export function isObsidianCliAvailable(): boolean {
  // Return cached result on subsequent calls
  if (_cliAvailableCache !== null) return _cliAvailableCache;

  const os = platform();

  try {
    if (os === "darwin") {
      execSync("pgrep -x Obsidian", { stdio: "pipe", timeout: 3000 });
      _cliAvailableCache = true;
    } else if (os === "linux") {
      execSync("pgrep -x obsidian", { stdio: "pipe", timeout: 3000 });
      _cliAvailableCache = true;
    } else if (os === "win32") {
      const result = execSync(
        'tasklist /FI "IMAGENAME eq Obsidian.exe" /NH',
        { stdio: "pipe", timeout: 3000, encoding: "utf-8" }
      );
      _cliAvailableCache = result.includes("Obsidian.exe");
    } else {
      _cliAvailableCache = false;
    }
  } catch {
    _cliAvailableCache = false;
  }

  return _cliAvailableCache;
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
