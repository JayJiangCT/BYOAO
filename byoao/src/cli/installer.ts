import fs from "fs-extra";
import path from "node:path";
import os from "node:os";
import { execSync } from "node:child_process";
import { checkObsidian } from "../vault/obsidian-check.js";
import { checkOpenCode } from "../vault/opencode-check.js";
import { checkGcloud } from "../vault/toolbox.js";
import {
  printSectionHeader,
  printProgress,
  printProgressWithBar,
  printGettingStarted,
  printFooter,
  printBlank,
  printWarning,
  printInfo,
} from "./ui.js";

const OPENCODE_CONFIG_PATHS = [
  // Global config
  path.join(os.homedir(), ".config/opencode/opencode.json"),
  // Legacy path
  path.join(os.homedir(), ".config/opencode/.opencode.json"),
];

function findOpencodeConfig(): string | null {
  for (const p of OPENCODE_CONFIG_PATHS) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

export interface InstallOptions {
  global: boolean;
  installSkills: boolean;
  projectDir?: string;
}

/** Prompt user to install a missing dependency. Returns true if installed successfully. */
async function promptInstallDependency(
  name: string,
  installCommands: { label: string; command: string }[],
  interactive: boolean
): Promise<boolean> {
  if (!interactive) return false;

  try {
    const { default: inquirer } = await import("inquirer");

    const { shouldInstall } = await inquirer.prompt([
      {
        type: "confirm",
        name: "shouldInstall",
        message: `${name} is not installed. Would you like to install it now?`,
        default: true,
      },
    ]);

    if (!shouldInstall) return false;

    // Let user pick install method if there are multiple options
    let command: string;
    if (installCommands.length === 1) {
      command = installCommands[0].command;
    } else {
      const { method } = await inquirer.prompt([
        {
          type: "list",
          name: "method",
          message: "Install method:",
          choices: installCommands.map((c) => ({
            name: `${c.label}: ${c.command}`,
            value: c.command,
          })),
        },
      ]);
      command = method;
    }

    console.log(`\nRunning: ${command}\n`);
    execSync(command, { stdio: "inherit", timeout: 120_000 });
    console.log("");
    return true;
  } catch {
    return false;
  }
}

export async function install(
  options: InstallOptions,
  interactive = true
): Promise<void> {
  // ── 1. Check dependencies ─────────────────────────────────────
  printSectionHeader("Checking dependencies...");

  let openCodeStatus = checkOpenCode();

  if (!openCodeStatus.installed) {
    printProgress("OpenCode", "warn", "not installed");

    const installed = await promptInstallDependency(
      "OpenCode",
      openCodeStatus.installCommands,
      interactive
    );

    if (installed) {
      // Re-check after installation so plugin registration works
      openCodeStatus = checkOpenCode();
      if (!openCodeStatus.installed) {
        printProgress("OpenCode", "ok", "installed (restart terminal to use)");
        printInfo(
          "Open a new terminal window, or run: source ~/.zshrc"
        );
      } else {
        printProgress("OpenCode", "ok", "installed");
      }
    } else {
      printWarning(
        "OpenCode is required for the plugin to work."
      );
      printInfo(
        "You can still use the standalone CLI (byoao init, byoao status)."
      );
      printInfo("To install OpenCode later, run one of:");
      for (const cmd of openCodeStatus.installCommands) {
        printInfo(`  ${cmd.label}: ${cmd.command}`);
      }
    }
  } else {
    const version = openCodeStatus.version
      ? `v${openCodeStatus.version}`
      : "installed";
    printProgressWithBar(`OpenCode ${version}`, "ok", 100);
  }

  const obsidianStatus = checkObsidian();

  if (!obsidianStatus.installed) {
    printProgress("Obsidian", "warn", "not installed");

    const installed = await promptInstallDependency(
      "Obsidian",
      [{ label: "Download", command: `open ${obsidianStatus.downloadUrl}` }],
      interactive
    );

    if (installed) {
      printProgress(
        "Obsidian",
        "ok",
        "download page opened — install it, then re-run `byoao install`"
      );
    } else {
      printWarning(
        `Obsidian is required for vault operations. Install from: ${obsidianStatus.downloadUrl}`
      );
    }
    printBlank();
    printInfo("Re-run `byoao install` after installing Obsidian.");
    return;
  }

  const obsidianDetail = obsidianStatus.running ? "running" : "installed, not running";
  printProgress(`Obsidian`, "ok", obsidianDetail);

  // ── Optional: gcloud CLI ──
  const gcloudStatus = checkGcloud();
  if (gcloudStatus.installed) {
    printProgress(`gcloud CLI`, "ok", `v${gcloudStatus.version}`);
  } else {
    printProgress(`gcloud CLI`, "skip", "not installed (optional — needed for BigQuery)");
  }

  printBlank();

  // ── 2. Install components ─────────────────────────────────────
  printSectionHeader("Installing components...");

  let totalSteps = 2; // plugin + byoao skills
  if (options.installSkills) totalSteps++;
  let completedSteps = 0;

  // ── 2a. Register plugin in opencode.json ──────────────────────
  if (openCodeStatus.installed) {
    let configPath: string;

    if (options.global) {
      configPath =
        findOpencodeConfig() ||
        path.join(os.homedir(), ".config/opencode/opencode.json");
    } else {
      const dir = options.projectDir || process.cwd();
      configPath = path.join(dir, ".opencode.json");
    }

    await fs.ensureDir(path.dirname(configPath));

    let config: Record<string, unknown> = {};
    if (await fs.pathExists(configPath)) {
      try {
        config = await fs.readJson(configPath);
      } catch {
        // Invalid JSON — start fresh
      }
    }

    const plugins = (config.plugin as string[] | undefined) || [];
    if (!plugins.includes("@jayjiang/byoao")) {
      plugins.push("@jayjiang/byoao");
      config.plugin = plugins;
      await fs.writeJson(configPath, config, { spaces: 2 });
    }

    completedSteps++;
    const pct = Math.round((completedSteps / totalSteps) * 100);
    printProgressWithBar("Plugin registered", "ok", pct);
  } else {
    completedSteps++;
    printProgress("Plugin registration", "skip", "OpenCode not installed");
  }

  // ── 2b. Install Obsidian Skills ───────────────────────────────
  if (options.installSkills) {
    const skillsDir = options.global
      ? path.join(os.homedir(), ".config/opencode/skills")
      : path.join(options.projectDir || process.cwd(), ".opencode/skills");

    await fs.ensureDir(skillsDir);

    const assetsDir = resolveAssetsDir();
    const obsidianSkillsSrc = path.join(assetsDir, "obsidian-skills");

    if (await fs.pathExists(obsidianSkillsSrc)) {
      const skillFiles = await fs.readdir(obsidianSkillsSrc);
      let installedCount = 0;
      for (const file of skillFiles) {
        if (file.endsWith(".md")) {
          const skillName = file.replace(/\.md$/, "");
          const destDir = path.join(skillsDir, skillName);
          await fs.ensureDir(destDir);
          await fs.copy(
            path.join(obsidianSkillsSrc, file),
            path.join(destDir, "SKILL.md"),
            { overwrite: true }
          );
          installedCount++;
        }
      }
      completedSteps++;
      const pct = Math.round((completedSteps / totalSteps) * 100);
      printProgressWithBar(
        "Obsidian Skills",
        "ok",
        pct,
        `${installedCount} files`
      );
    } else {
      completedSteps++;
      printProgress("Obsidian Skills", "warn", "not found in assets");
    }
  }

  // ── 2c. Install BYOAO skills ─────────────────────────────────
  const skillsDestDir = options.global
    ? path.join(os.homedir(), ".config/opencode/commands")
    : path.join(options.projectDir || process.cwd(), ".opencode/commands");

  await fs.ensureDir(skillsDestDir);
  const byoaoSkillsSrc = path.join(resolveAssetsDir(), "..", "skills");

  if (await fs.pathExists(byoaoSkillsSrc)) {
    const skillFiles = await fs.readdir(byoaoSkillsSrc);
    let installedCount = 0;
    for (const file of skillFiles) {
      if (file.endsWith(".md")) {
        await fs.copy(
          path.join(byoaoSkillsSrc, file),
          path.join(skillsDestDir, file),
          { overwrite: true }
        );
        installedCount++;
      }
    }
    completedSteps++;
    printProgressWithBar(
      "BYOAO skills",
      "ok",
      100,
      `${installedCount} commands`
    );
  } else {
    completedSteps++;
    printProgressWithBar("BYOAO skills", "ok", 100, "0 commands");
  }

  // ── Getting Started ───────────────────────────────────────────
  const gettingStartedItems: { cmd: string; desc: string }[] = [
    { cmd: "byoao init", desc: "# Create a knowledge base" },
    { cmd: "byoao status <path>", desc: "# Check vault health" },
  ];

  printGettingStarted(gettingStartedItems);
  printInfo("Recommended: Obsidian Web Clipper → https://obsidian.md/clipper");

  printFooter("https://github.com/JayJiangCT/BYOAO");

  if (!obsidianStatus.running) {
    printWarning("Don't forget to open Obsidian before creating a vault.");
    printBlank();
  }
}

export async function uninstall(
  options: { global: boolean; projectDir?: string },
  interactive = true
): Promise<void> {
  printSectionHeader("Uninstalling BYOAO...");

  let removedItems: string[] = [];

  // ── 1. Remove plugin from opencode.json ─────────────────────
  // Always check both global and project locations so uninstall works
  // regardless of which --global flag was used during install.
  const configCandidates: string[] = [];
  for (const p of OPENCODE_CONFIG_PATHS) {
    configCandidates.push(p);
  }
  const dir = options.projectDir || process.cwd();
  configCandidates.push(path.join(dir, ".opencode.json"));

  for (const configPath of configCandidates) {
    if (await fs.pathExists(configPath)) {
      try {
        const config = await fs.readJson(configPath);
        const plugins = (config.plugin as string[] | undefined) || [];
        const idx = plugins.indexOf("@jayjiang/byoao");
        if (idx !== -1) {
          plugins.splice(idx, 1);
          config.plugin = plugins;
          await fs.writeJson(configPath, config, { spaces: 2 });
          removedItems.push(`Plugin unregistered from ${configPath}`);
        }
      } catch {
        // Invalid JSON — skip
      }
    }
  }

  // ── 2. Remove Obsidian Skills ───────────────────────────────
  // Check both global and project skill dirs
  const skillsDirs = [
    path.join(os.homedir(), ".config/opencode/skills"),
    path.join(options.projectDir || process.cwd(), ".opencode/skills"),
  ];

  const assetsDir = resolveAssetsDir();
  const obsidianSkillsSrc = path.join(assetsDir, "obsidian-skills");

  if (await fs.pathExists(obsidianSkillsSrc)) {
    let removedCount = 0;
    const skillFiles = await fs.readdir(obsidianSkillsSrc);
    for (const skillsDir of skillsDirs) {
      if (!(await fs.pathExists(skillsDir))) continue;
      for (const file of skillFiles) {
        if (file.endsWith(".md")) {
          const skillName = file.replace(/\.md$/, "");
          // New layout: skills/<name>/SKILL.md
          const destDir = path.join(skillsDir, skillName);
          if (await fs.pathExists(destDir)) {
            await fs.remove(destDir);
            removedCount++;
          }
          // Legacy layout: skills/<name>.md
          const legacyDest = path.join(skillsDir, file);
          if (await fs.pathExists(legacyDest)) {
            await fs.remove(legacyDest);
            removedCount++;
          }
        }
      }
    }
    if (removedCount > 0) {
      removedItems.push(`Obsidian Skills (${removedCount} files)`);
    }
  }

  // ── 3. Remove BYOAO commands ────────────────────────────────
  const commandsDirs = [
    path.join(os.homedir(), ".config/opencode/commands"),
    path.join(options.projectDir || process.cwd(), ".opencode/commands"),
  ];

  const byoaoSkillsSrc = path.join(assetsDir, "..", "skills");

  if (await fs.pathExists(byoaoSkillsSrc)) {
    let removedCount = 0;
    const skillFiles = await fs.readdir(byoaoSkillsSrc);
    for (const commandsDir of commandsDirs) {
      if (!(await fs.pathExists(commandsDir))) continue;
      for (const file of skillFiles) {
        if (file.endsWith(".md")) {
          const dest = path.join(commandsDir, file);
          if (await fs.pathExists(dest)) {
            await fs.remove(dest);
            removedCount++;
          }
        }
      }
    }
    if (removedCount > 0) {
      removedItems.push(`BYOAO commands (${removedCount} files)`);
    }
  }

  // ── Summary ─────────────────────────────────────────────────
  if (removedItems.length === 0) {
    printInfo("Nothing to uninstall — BYOAO was not found.");
  } else {
    for (const item of removedItems) {
      printProgress(item, "ok", "removed");
    }
    printBlank();
    printInfo("BYOAO has been uninstalled. Your vaults and notes are untouched.");
  }
}

function resolveAssetsDir(): string {
  const srcAssets = path.resolve(import.meta.dirname, "..", "assets");
  const distAssets = path.resolve(
    import.meta.dirname,
    "..",
    "..",
    "src",
    "assets"
  );
  if (fs.existsSync(srcAssets)) return srcAssets;
  if (fs.existsSync(distAssets)) return distAssets;
  return srcAssets;
}
