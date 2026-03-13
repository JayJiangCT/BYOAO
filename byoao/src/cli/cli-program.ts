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
  .description(
    "Build Your Own AI OS — turn Obsidian into an AI-powered knowledge graph.\n\n" +
    "Quick start:\n" +
    "  1. byoao install        Set up BYOAO plugin in OpenCode\n" +
    "  2. byoao init           Create your team's knowledge base\n" +
    "  3. byoao status <path>  Check vault health\n\n" +
    "For more info visit https://github.com/JayJiangCT/BYOAO"
  )
  .version("0.2.0");

// ── byoao install ────────────────────────────────────────────────
program
  .command("install")
  .description(
    "Set up BYOAO plugin in OpenCode — registers the plugin, copies Obsidian Skills " +
    "and BYOAO commands so they are available in your AI agent sessions"
  )
  .option("-g, --global", "Install globally so BYOAO works in every project", false)
  .option("-y, --yes", "Skip interactive prompts, use defaults", false)
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

// ── byoao init ───────────────────────────────────────────────────
program
  .command("init")
  .description(
    "Create a new Obsidian knowledge base for your team — sets up folders, templates, " +
    "glossary, and an AI routing index (AGENT.md). Opens the vault in Obsidian when done."
  )
  .option("--team <name>", "Team name (skips interactive prompt)")
  .option("--path <path>", "Where to create the vault (default: ~/Documents/<team> Workspace)")
  .option("--preset <name>", "Role preset — determines folder structure and templates (default: pm-tpm)")
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

        // 3. Your name (creates your own People note)
        const { yourName } = await inquirer.prompt([{
          type: "input",
          name: "yourName",
          message: "Your name:",
          validate: (v: string) => v.trim() ? true : "Your name is required",
        }]);
        if (yourName.trim()) {
          members.push({ name: yourName.trim(), role: presetName === "pm-tpm" ? "PM/TPM" : "Team Member" });
        }

        // 4. Vault path
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
      projects: [],
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

    console.log();
    printEventDetail("Next steps:");
    printEventDetail("  1. Open Obsidian → Manage vaults → Open folder as vault");
    printEventDetail(`     ${result.vaultPath}`);
    printEventDetail('  2. Read "Start Here.md" — it explains the vault structure');
    printEventDetail("  3. Start adding notes — meeting notes, project docs, daily notes");
    printEventDetail(`  4. When ready for AI features: cd "${result.vaultPath}" && opencode`);
  });

// ── byoao status ─────────────────────────────────────────────────
program
  .command("status")
  .description(
    "Check the health of an existing vault — note count, directory structure, " +
    "broken [[wikilinks]], and Obsidian connection status"
  )
  .argument("<path>", "Path to the vault folder")
  .action(async (vaultPath: string) => {
    const resolvedPath = path.resolve(vaultPath);
    const status = await getVaultStatus(resolvedPath);
    console.log(formatVaultStatus(status));

    console.log("\n--- Obsidian ---");
    const obsidianStatus = checkObsidian();
    console.log(formatObsidianStatus(obsidianStatus));
  });

// ── byoao check-obsidian ────────────────────────────────────────
program
  .command("check-obsidian")
  .description("Verify that Obsidian is installed and running on this machine")
  .action(() => {
    const status = checkObsidian();
    console.log(formatObsidianStatus(status));
  });

program.parse();
