#!/usr/bin/env node
import { Command } from "commander";
import { install } from "./installer.js";
import { printLogo, printVersion, printEvent, printEventDetail, printEventDone } from "./ui.js";
import { createVault } from "../vault/create.js";
import { getVaultStatus, formatVaultStatus } from "../vault/status.js";
import { checkObsidian, formatObsidianStatus } from "../vault/obsidian-check.js";
import { listPresets } from "../vault/preset.js";
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
  .option("--team <name>", "Team name")
  .option("--path <path>", "Vault location")
  .option("--preset <name>", "Role preset (default: pm-tpm)")
  .action(async (opts) => {
    // Check Obsidian first
    const obsidianStatus = checkObsidian();
    if (!obsidianStatus.installed) {
      console.log(formatObsidianStatus(obsidianStatus));
      console.log("\nPlease install Obsidian first, then try again.");
      process.exit(1);
    }

    let teamName = opts.team;
    let vaultPath = opts.path;
    let presetName = opts.preset || "pm-tpm";
    let members: { name: string; role: string }[] = [];
    let projects: { name: string; description: string }[] = [];

    // Interactive TUI when --team is not provided and stdout is TTY
    if (!teamName && process.stdout.isTTY) {
      try {
        const { default: inquirer } = await import("inquirer");

        printEvent("Creating a new knowledge base");
        console.log();

        // 1. Role selection
        const presets = listPresets();
        const { selectedPreset } = await inquirer.prompt([{
          type: "list",
          name: "selectedPreset",
          message: "Choose your role",
          choices: [
            ...presets.map(p => ({
              name: `${p.displayName} — ${p.description}`,
              value: p.name,
            })),
            new inquirer.Separator(),
            { name: "Engineer (coming soon)", disabled: true },
            { name: "Designer (coming soon)", disabled: true },
          ],
        }]);
        presetName = selectedPreset;

        // 2. Team name
        const teamAnswer = await inquirer.prompt([{
          type: "input",
          name: "teamName",
          message: "Team name:",
          validate: (v: string) => v.trim() ? true : "Team name is required",
        }]);
        teamName = teamAnswer.teamName;

        // 3. Vault path
        const defaultPath = path.join(os.homedir(), "Documents", `${teamName} Workspace`);
        const { pathChoice } = await inquirer.prompt([{
          type: "list",
          name: "pathChoice",
          message: "Vault location",
          choices: [
            { name: `Use default (${defaultPath})`, value: "default" },
            { name: "Choose custom path", value: "custom" },
          ],
        }]);
        vaultPath = defaultPath;
        if (pathChoice === "custom") {
          const { customPath } = await inquirer.prompt([{
            type: "input",
            name: "customPath",
            message: "Custom path:",
          }]);
          vaultPath = customPath;
        }

        // 4. Members loop
        let addingMembers = true;
        while (addingMembers) {
          const { action } = await inquirer.prompt([{
            type: "list",
            name: "action",
            message: `Team members (${members.length} added)`,
            choices: [
              { name: "Add a member", value: "add" },
              { name: "Done", value: "done" },
            ],
          }]);
          if (action === "done") break;
          const { name, role } = await inquirer.prompt([
            { type: "input", name: "name", message: "Name:" },
            { type: "input", name: "role", message: "Role:", default: "" },
          ]);
          if (name.trim()) members.push({ name: name.trim(), role: role.trim() || "Team Member" });
        }

        // 5. Projects loop
        let addingProjects = true;
        while (addingProjects) {
          const { action } = await inquirer.prompt([{
            type: "list",
            name: "action",
            message: `Projects (${projects.length} added)`,
            choices: [
              { name: "Add a project", value: "add" },
              { name: "Done", value: "done" },
            ],
          }]);
          if (action === "done") break;
          const { name, description } = await inquirer.prompt([
            { type: "input", name: "name", message: "Project name:" },
            { type: "input", name: "description", message: "Description:", default: "" },
          ]);
          if (name.trim()) projects.push({ name: name.trim(), description: description.trim() || "" });
        }
      } catch {
        // inquirer not available — fall through to require --team
        if (!teamName) {
          console.error("Error: --team flag is required in non-interactive mode");
          process.exit(1);
        }
      }
    }

    if (!teamName) {
      console.error("Error: --team flag is required");
      process.exit(1);
    }

    vaultPath = vaultPath || path.join(os.homedir(), "Documents", `${teamName} Workspace`);

    const config = VaultConfigSchema.parse({
      teamName,
      vaultPath,
      members,
      projects,
      preset: presetName,
    });

    printEvent(`Creating vault for "${teamName}"`);
    const result = await createVault(config);
    console.log();
    printEventDone("Vault created");
    printEventDetail(`Path: ${result.vaultPath}`);
    printEventDetail(`Files: ${result.filesCreated}`);
    printEventDetail(`Wikilinks: ${result.wikilinksCreated}`);
    printEventDetail(`Directories: ${result.directories.length}`);

    if (!obsidianStatus.running) {
      console.log();
      console.log(formatObsidianStatus(obsidianStatus));
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
