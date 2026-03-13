import { execSync } from "node:child_process";
import { platform } from "node:os";

export interface OpenCodeStatus {
  installed: boolean;
  version: string | null;
  installCommands: { label: string; command: string }[];
}

export function checkOpenCode(): OpenCodeStatus {
  const installCommands = getInstallCommands();

  try {
    const result = execSync("opencode version", {
      timeout: 5000,
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    }).trim();

    return {
      installed: true,
      version: result || "unknown",
      installCommands,
    };
  } catch {
    // Also try just checking if the binary exists
    try {
      execSync("which opencode", {
        timeout: 3000,
        encoding: "utf-8",
        stdio: ["pipe", "pipe", "pipe"],
      });
      return { installed: true, version: "unknown", installCommands };
    } catch {
      // Not installed
    }
  }

  return { installed: false, version: null, installCommands };
}

function getInstallCommands(): { label: string; command: string }[] {
  const os = platform();
  const commands: { label: string; command: string }[] = [];

  if (os === "darwin") {
    commands.push({
      label: "Homebrew",
      command: "brew install opencode-ai/tap/opencode",
    });
  }

  commands.push({
    label: "curl (official installer)",
    command: "curl -fsSL https://opencode.ai/install | bash",
  });

  commands.push({
    label: "npm",
    command: "npm install -g opencode-ai",
  });

  return commands;
}

export function formatOpenCodeStatus(status: OpenCodeStatus): string {
  if (status.installed) {
    return `✓ OpenCode is installed (${status.version})`;
  }

  const lines = [
    "⚠️ OpenCode is NOT installed.",
    "   Available install methods:",
  ];
  for (const cmd of status.installCommands) {
    lines.push(`   - ${cmd.label}: ${cmd.command}`);
  }
  return lines.join("\n");
}
