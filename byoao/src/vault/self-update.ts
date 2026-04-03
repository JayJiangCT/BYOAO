import { execSync } from "node:child_process";
import { semver } from "../lib/cjs-modules.js";

// Replaced at build time by esbuild (build.mjs define option)
declare const __PKG_VERSION__: string;
const PKG_VERSION: string = __PKG_VERSION__;

// ── Constants ───────────────────────────────────────────────────

const PACKAGE_NAME = "@jayjiang/byoao";
const REGISTRY_TIMEOUT_MS = 5_000;

// ── Version Check ───────────────────────────────────────────────

export interface CliUpdateCheck {
  current: string;
  latest: string;
  updateAvailable: boolean;
}

/**
 * Check npm registry for a newer version of the CLI.
 * Uses `npm view` so it inherits the user's registry/proxy config.
 * Returns updateAvailable=false on any failure (timeout, network, etc.).
 */
export async function checkForCliUpdate(): Promise<CliUpdateCheck> {
  const current = PKG_VERSION;
  let latest: string;

  try {
    const raw = execSync(`npm view ${PACKAGE_NAME} version`, {
      timeout: REGISTRY_TIMEOUT_MS,
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    });
    latest = raw.trim();
  } catch {
    return { current, latest: current, updateAvailable: false };
  }

  if (!semver.valid(latest)) {
    return { current, latest: current, updateAvailable: false };
  }

  return {
    current,
    latest,
    updateAvailable: semver.lt(current, latest),
  };
}

// ── Self Update ─────────────────────────────────────────────────

export interface SelfUpdateResult {
  success: boolean;
  error?: string;
}

/**
 * Install a specific version of the CLI globally via npm.
 * Never runs sudo — on permission errors, returns the manual command.
 */
export async function selfUpdateCli(
  targetVersion: string
): Promise<SelfUpdateResult> {
  const installCmd = `npm install -g ${PACKAGE_NAME}@${targetVersion}`;

  try {
    execSync(installCmd, {
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    });
    return { success: true };
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : String(err);

    if (message.includes("EACCES") || message.includes("permission denied")) {
      return {
        success: false,
        error:
          `Permission denied. Run manually:\n  sudo ${installCmd}`,
      };
    }

    return {
      success: false,
      error:
        `Update failed. Run manually:\n  ${installCmd}\n\n${message}`,
    };
  }
}
