#!/usr/bin/env node
import { Command } from "commander";
import { install } from "./installer.js";
import { printLogo, printVersion } from "./ui.js";
import { createVault } from "../vault/create.js";
import { getVaultStatus, formatVaultStatus } from "../vault/status.js";
import { checkObsidian, formatObsidianStatus } from "../vault/obsidian-check.js";
import { VaultConfigSchema } from "../plugin-config.js";
import path from "node:path";
import os from "node:os";

const program = new Command();

program
  .name("byoao")
  .description("Build Your Own AI OS — Obsidian + AI Agent")
  .version("0.2.0");

// ── byoao install ────────────────────────────────────────────────
program
  .command("install")
  .description("Install BYOAO plugin into OpenCode")
  .option("-g, --global", "Install globally (all projects)", false)
  .option("-y, --yes", "Skip interactive prompts, use defaults/flags", false)
  .option("--no-skills", "Skip installing Obsidian Skills")
  .option("--project-dir <path>", "Project directory (default: current directory)")
  .action(async (opts) => {
    printLogo();
    printVersion("0.2.0");

    let installGlobal = opts.global;
    let installSkills = opts.skills !== false;

    // Interactive prompts unless --yes flag is set
    if (!opts.yes) try {
      const { default: inquirer } = await import("inquirer");
      const answers = await inquirer.prompt([
        {
          type: "list",
          name: "location",
          message: "Install location:",
          choices: [
            { name: "global (all projects)", value: "global" },
            { name: "project-only (current directory)", value: "project" },
          ],
          default: installGlobal ? "global" : "project",
        },
        {
          type: "confirm",
          name: "skills",
          message: "Install Obsidian Skills? (obsidian-cli, obsidian-markdown, etc.)",
          default: true,
        },
      ]);

      installGlobal = answers.location === "global";
      installSkills = answers.skills;
    } catch {
      // inquirer not available — use CLI flags
    }

    await install(
      {
        global: installGlobal,
        installSkills,
        projectDir: opts.projectDir,
      },
      !opts.yes
    );
  });

// ── byoao vault init ────────────────────────────────────────────
program
  .command("vault")
  .description("Vault management commands")
  .command("init")
  .description("Create a new Obsidian vault for a team")
  .requiredOption("--team <name>", "Team name")
  .option("--path <path>", "Vault location")
  .action(async (opts) => {
    // Check Obsidian first
    const obsidianStatus = checkObsidian();
    if (!obsidianStatus.installed) {
      console.log(formatObsidianStatus(obsidianStatus));
      console.log("\nPlease install Obsidian first, then try again.");
      process.exit(1);
    }

    const vaultPath =
      opts.path || path.join(os.homedir(), "Documents", `${opts.team} Workspace`);

    const config = VaultConfigSchema.parse({
      teamName: opts.team,
      vaultPath,
    });

    console.log(`Creating vault for "${opts.team}" at ${vaultPath}...`);
    const result = await createVault(config);
    console.log(`\n✓ Vault created!`);
    console.log(`  Path: ${result.vaultPath}`);
    console.log(`  Files: ${result.filesCreated}`);
    console.log(`  Directories: ${result.directories.length}`);

    if (!obsidianStatus.running) {
      console.log(`\n${formatObsidianStatus(obsidianStatus)}`);
    }
    console.log(`\nNext: Open Obsidian → "Open folder as vault" → select "${result.vaultPath}"`);
  });

// ── byoao vault status ──────────────────────────────────────────
// We need to add status as a sibling command under vault
// Commander's nested commands require a parent command object
const vaultCmd = program.commands.find((c) => c.name() === "vault");

if (vaultCmd) {
  vaultCmd
    .command("status")
    .description("Check vault health")
    .argument("<path>", "Path to the vault")
    .action(async (vaultPath: string) => {
      const resolvedPath = path.resolve(vaultPath);
      const status = await getVaultStatus(resolvedPath);
      console.log(formatVaultStatus(status));

      console.log("\n--- Obsidian ---");
      const obsidianStatus = checkObsidian();
      console.log(formatObsidianStatus(obsidianStatus));
    });
}

// ── byoao check-obsidian ────────────────────────────────────────
program
  .command("check-obsidian")
  .description("Check if Obsidian is installed and running")
  .action(() => {
    const status = checkObsidian();
    console.log(formatObsidianStatus(status));
  });

program.parse();
