#!/usr/bin/env node
import { Command } from "commander";
import { install, uninstall } from "./installer.js";
import { printLogo, printVersion, printEvent, printEventDetail, printEventCheck, printEventDone, printWarning, startSpinner } from "./ui.js";
import { createVault } from "../vault/create.js";
import { getVaultStatus, formatVaultStatus } from "../vault/status.js";
import { checkObsidian, formatObsidianStatus } from "../vault/obsidian-check.js";
import { listPresets } from "../vault/preset.js";
import { VaultConfigSchema } from "../plugin-config.js";
import { spawn } from "node:child_process";
import path from "node:path";
import os from "node:os";

const AUTH_COMMANDS: Record<string, { args: string[] }> = {
  copilot: { args: ["auth", "login", "-p", "github-copilot"] },
  gemini: {
    args: ["auth", "login", "-p", "google", "-m", "OAuth with Google (Gemini CLI)"],
  },
};

function getAuthCommand(provider: string): string {
  const cmd = AUTH_COMMANDS[provider];
  if (!cmd) return `opencode auth login`;
  return `opencode ${cmd.args.join(" ")}`;
}

function runProviderAuth(provider: string): Promise<boolean> {
  const cmd = AUTH_COMMANDS[provider];
  if (!cmd) return Promise.resolve(false);

  return new Promise((resolve) => {
    const child = spawn("opencode", cmd.args, {
      stdio: "inherit",
      env: { ...process.env },
    });

    child.on("close", (code) => {
      resolve(code === 0);
    });

    child.on("error", () => {
      resolve(false);
    });
  });
}

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
  .version("0.3.0");

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
    printVersion("0.3.0");

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

// ── byoao uninstall ──────────────────────────────────────────────
program
  .command("uninstall")
  .description(
    "Remove BYOAO plugin from OpenCode — unregisters the plugin and removes copied " +
    "skills and commands. Your vaults and notes are not affected."
  )
  .option("-g, --global", "Uninstall from global config", false)
  .option("-y, --yes", "Skip confirmation prompt", false)
  .option("--project-dir <path>", "Project directory (default: current directory)")
  .action(async (opts) => {
    if (!opts.yes && process.stdout.isTTY) {
      try {
        const { default: inquirer } = await import("inquirer");
        const { confirm } = await inquirer.prompt([{
          type: "confirm",
          name: "confirm",
          message: "Uninstall BYOAO? (your vaults and notes will not be affected)",
          default: true,
        }]);
        if (!confirm) {
          console.log("Cancelled.");
          return;
        }
      } catch {
        // inquirer not available — proceed
      }
    }

    await uninstall({
      global: opts.global,
      projectDir: opts.projectDir,
    });
  });

// ── byoao init ───────────────────────────────────────────────────
program
  .command("init")
  .description(
    "Create a new Obsidian knowledge base for your team — sets up folders, templates, " +
    "glossary, and an AI routing index (AGENT.md)"
  )
  .option("--team <name>", "Team name (skips interactive prompt)")
  .option("--name <name>", "Your name — creates a person note (default: OS username in non-interactive mode)")
  .option("--path <path>", "Where to create the vault (default: ~/Documents/<team> Workspace)")
  .option("--preset <name>", "Role preset — determines folder structure and templates (default: pm-tpm)")
  .option("--provider <name>", "AI provider: copilot, gemini, or skip (default: skip in non-interactive)")
  .option("--gcp-project <id>", "GCP Project ID (required when --provider=gemini)")
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

    // In non-interactive mode, use --name flag or fall back to OS username
    if (members.length === 0) {
      const userName = opts.name || os.userInfo().username;
      if (userName) {
        members.push({ name: userName, role: presetName === "pm-tpm" ? "PM/TPM" : "Team Member" });
      }
    }

    vaultPath = vaultPath || path.join(os.homedir(), "Documents", `${teamName} Workspace`);

    const providerOpt = opts.provider || "skip";
    let gcpProjectOpt = opts.gcpProject || "";

    const config = VaultConfigSchema.parse({
      teamName,
      vaultPath,
      members,
      projects: [],
      preset: presetName,
      provider: providerOpt,
      gcpProjectId: gcpProjectOpt,
    });

    const spinner = startSpinner(`Creating vault for "${teamName}"`);
    const result = await createVault(config);
    spinner.stop(`Vault created`);
    printEventCheck(`Path: ${result.vaultPath}`);
    printEventCheck(`Files: ${result.filesCreated}`);
    printEventCheck(`Wikilinks: ${result.wikilinksCreated}`);
    printEventCheck(`Directories: ${result.directories.length}`);

    if (result.mcpResult) {
      console.log();
      printEventDone("MCP servers configured");
      if (result.mcpResult.serversAdded.length > 0) {
        for (const name of result.mcpResult.serversAdded) {
          printEventCheck(`Added: ${name}`);
        }
      }
      if (result.mcpResult.serversSkipped.length > 0) {
        for (const name of result.mcpResult.serversSkipped) {
          printEventDetail(`Skipped (already exists): ${name}`);
        }
      }
      printEventCheck(`Config: ${result.mcpResult.configPath}`);
    }

    if (result.pluginsResult) {
      console.log();
      printEventDone("Obsidian plugins installed");
      if (result.pluginsResult.bratNewlyInstalled) {
        printEventCheck("BRAT: newly installed (plugin manager)");
      } else {
        printEventDetail("BRAT: already installed");
      }
      if (result.pluginsResult.pluginsAdded.length > 0) {
        for (const name of result.pluginsResult.pluginsAdded) {
          printEventCheck(`Added: ${name}`);
        }
      }
      if (result.pluginsResult.pluginsSkipped.length > 0) {
        for (const name of result.pluginsResult.pluginsSkipped) {
          printEventDetail(`Skipped (already installed): ${name}`);
        }
      }
      if (result.pluginsResult.errors.length > 0) {
        for (const err of result.pluginsResult.errors) {
          printWarning(`${err.pluginId}: ${err.error}`);
        }
      }
      if (obsidianStatus.running && result.pluginsResult.pluginsAdded.length > 0) {
        printWarning("Obsidian is running — restart it or use 'Reload app without saving' to activate new plugins");
      }
    }

    // ── AI Provider Display (non-interactive path) ───────────────
    // This fires when --provider flag was set and createVault ran configureProvider.
    if (result.providerResult) {
      console.log();
      printEventDone(`AI provider configured: ${result.providerResult.provider}`);
      if (result.providerResult.pluginAdded) {
        printEventCheck(`Plugin added: opencode-gemini-auth`);
      }
      if (result.providerResult.pluginSkipped) {
        printEventDetail(`Plugin skipped (already installed): opencode-gemini-auth`);
      }
      if (result.providerResult.projectIdSet) {
        printEventCheck(`GCP Project: ${gcpProjectOpt}`);
      }
      if (result.providerResult.projectIdSkipped) {
        printEventDetail(`GCP Project skipped (already configured)`);
      }
      printEventCheck(`Config: ${result.providerResult.configPath}`);
    }

    // ── Interactive Provider Prompt (TTY only, --provider not set) ──
    // This is a NEW inquirer session AFTER vault creation. No conflict
    // with the earlier prompts since those are already finished.
    let providerForAuth: "copilot" | "gemini" | "skip" = config.provider;
    if (providerForAuth === "skip" && process.stdout.isTTY && !opts.provider) {
      try {
        const { default: inquirer } = await import("inquirer");
        console.log();
        const { selectedProvider } = await inquirer.prompt([{
          type: "list",
          name: "selectedProvider",
          message: "Set up AI provider (optional)",
          choices: [
            {
              name: "GitHub Copilot — authenticate via GitHub account",
              value: "copilot",
            },
            {
              name: "Google Gemini — authenticate via GCP project + Google account",
              value: "gemini",
            },
            {
              name: "Skip — configure later",
              value: "skip",
            },
          ],
        }]);
        providerForAuth = selectedProvider;

        if (providerForAuth === "gemini" && !gcpProjectOpt) {
          const { projectId } = await inquirer.prompt([{
            type: "input",
            name: "projectId",
            message: "GCP Project ID (ask your engineering lead, e.g. wonder-sandbox):",
            validate: (v: string) => v.trim() ? true : "Project ID is required for Gemini",
          }]);
          gcpProjectOpt = projectId.trim();

          // Write the Gemini config now (vault already created without it)
          const { configureProvider } = await import("../vault/provider.js");
          const lateProviderResult = await configureProvider("gemini", gcpProjectOpt);
          if (lateProviderResult) {
            printEventDone("AI provider configured: gemini");
            if (lateProviderResult.pluginAdded) {
              printEventCheck("Plugin added: opencode-gemini-auth");
            }
            printEventCheck(`GCP Project: ${gcpProjectOpt}`);
          }
        }
        // Copilot needs no config — just auth (handled below)
        if (providerForAuth === "copilot") {
          printEventDone("AI provider: Copilot (built-in, no config changes needed)");
        }
      } catch {
        // inquirer not available — skip
      }
    }

    // ── Auth Spawn (both paths) ──────────────────────────────────
    // Uses providerForAuth which is set by either:
    //   - Non-interactive: providerOpt from --provider flag
    //   - Interactive: selectedProvider from the prompt above
    if (providerForAuth !== "skip" && process.stdout.isTTY) {
      console.log();
      printEvent("Authenticating with AI provider...");
      const authSuccess = await runProviderAuth(providerForAuth);
      if (authSuccess) {
        printEventDone("Authentication complete");
      } else {
        printWarning(
          "Authentication was not completed. Your vault is ready — run this later:\n" +
          getAuthCommand(providerForAuth)
        );
      }
    }

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
  .argument("[path...]", "Path to the vault folder (default: current directory)")
  .action(async (pathParts: string[]) => {
    const resolvedPath = pathParts.length > 0 ? path.resolve(pathParts.join(" ")) : process.cwd();
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
