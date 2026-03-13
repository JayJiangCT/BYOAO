import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
import { platform } from "node:os";

export interface ObsidianStatus {
  installed: boolean;
  running: boolean;
  appPath: string | null;
  downloadUrl: string;
}

const OBSIDIAN_DOWNLOAD_URL = "https://obsidian.md/download";

function getMacAppPaths(): string[] {
  return [
    "/Applications/Obsidian.app",
    `${process.env.HOME}/Applications/Obsidian.app`,
  ];
}

function getLinuxPaths(): string[] {
  return [
    "/usr/bin/obsidian",
    "/usr/local/bin/obsidian",
    "/snap/bin/obsidian",
    `${process.env.HOME}/.local/bin/obsidian`,
  ];
}

function findInstallPath(): string | null {
  const os = platform();

  if (os === "darwin") {
    for (const p of getMacAppPaths()) {
      if (existsSync(p)) return p;
    }
    // Also check via mdfind (Spotlight)
    try {
      const result = execSync('mdfind "kMDItemCFBundleIdentifier == md.obsidian"', {
        timeout: 5000,
        encoding: "utf-8",
      }).trim();
      if (result) return result.split("\n")[0];
    } catch {
      // Spotlight may not be available
    }
  } else if (os === "linux") {
    for (const p of getLinuxPaths()) {
      if (existsSync(p)) return p;
    }
    // Check via which
    try {
      const result = execSync("which obsidian", {
        timeout: 3000,
        encoding: "utf-8",
      }).trim();
      if (result) return result;
    } catch {
      // Not found
    }
  } else if (os === "win32") {
    const localAppData = process.env.LOCALAPPDATA || "";
    const winPath = `${localAppData}\\Obsidian\\Obsidian.exe`;
    if (existsSync(winPath)) return winPath;
  }

  return null;
}

function isRunning(): boolean {
  const os = platform();
  try {
    if (os === "darwin") {
      const result = execSync("pgrep -x Obsidian", {
        timeout: 3000,
        encoding: "utf-8",
      }).trim();
      return result.length > 0;
    } else if (os === "linux") {
      const result = execSync("pgrep -x obsidian", {
        timeout: 3000,
        encoding: "utf-8",
      }).trim();
      return result.length > 0;
    } else if (os === "win32") {
      const result = execSync("tasklist /FI \"IMAGENAME eq Obsidian.exe\" /NH", {
        timeout: 3000,
        encoding: "utf-8",
      });
      return result.includes("Obsidian.exe");
    }
  } catch {
    // pgrep returns exit code 1 if no match — that's expected
  }
  return false;
}

export function checkObsidian(): ObsidianStatus {
  const appPath = findInstallPath();
  return {
    installed: appPath !== null,
    running: isRunning(),
    appPath,
    downloadUrl: OBSIDIAN_DOWNLOAD_URL,
  };
}

export function formatObsidianStatus(status: ObsidianStatus): string {
  const lines: string[] = [];

  if (!status.installed) {
    lines.push("⚠️ Obsidian is NOT installed.");
    lines.push(`   Download it from: ${status.downloadUrl}`);
    lines.push("   After installing, open Obsidian and create or open a vault.");
    return lines.join("\n");
  }

  lines.push(`✓ Obsidian is installed at: ${status.appPath}`);

  if (!status.running) {
    lines.push("⚠️ Obsidian is NOT currently running.");
    lines.push("   Please open Obsidian before working with vaults.");
    if (status.appPath && platform() === "darwin") {
      lines.push(`   Run: open "${status.appPath}"`);
    }
  } else {
    lines.push("✓ Obsidian is running.");
  }

  return lines.join("\n");
}
