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
import { createRequire } from "node:module";
import path from "node:path";
import os from "node:os";
import { upgradeVault } from "../vault/upgrade.js";
import { detectVaultContext, detectInitMode } from "../vault/vault-detect.js";
import { loadPreset } from "../vault/preset.js";

const require = createRequire(import.meta.url);
const PKG_VERSION: string = (require("../../package.json") as Record<string, unknown>).version as string;

/**
 * Run `opencode auth login` — launches the interactive provider selector.
 * The old `-p <provider>` flag was removed in newer opencode versions;
 * the CLI now presents a built-in picker when called without arguments.
 */
function runProviderAuth(): Promise<boolean> {
  return new Promise((resolve) => {
    const child = spawn("opencode", ["auth", "login"], {
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
  .version(PKG_VERSION);

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
    printVersion(PKG_VERSION);

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
    "Create a personal knowledge base — sets up folders, templates, " +
    "glossary, and an AI routing index (AGENT.md). Works with empty " +
    "directories or adopts existing folders."
  )
  .option("--kb <name>", "Knowledge base name (skips interactive prompt)")
  .option("--name <name>", "Your name (default: OS username in non-interactive mode)")
  .option("--path <path>", "Where to create the vault (default: ~/Documents/<kb name>)")
  .option("--from <path>", "Adopt an existing folder as a knowledge base")
  .option("--preset <name>", "Role preset — determines folder structure and templates (default: minimal)")
  .option("--provider <name>", "AI provider: copilot, gemini, or skip (default: skip in non-interactive)")
  .option("--gcp-project <id>", "GCP Project ID for BigQuery")
  .option("--mcp-skip <names...>", "MCP servers to skip (comma-separated)")
  .action(async (opts) => {
    // Check Obsidian first
    const obsidianStatus = checkObsidian();
    if (!obsidianStatus.installed) {
      console.log(formatObsidianStatus(obsidianStatus));
      console.log("\nPlease install Obsidian first, then try again.");
      process.exit(1);
    }

    let kbName = opts.kb;
    let ownerName = opts.name || "";
    let vaultPath = opts.path || opts.from;
    let presetName = opts.preset || "minimal";
    let members: { name: string; role: string }[] = [];
    let mcpSkip: string[] = opts.mcpSkip || [];
    let gcpProjectId = opts.gcpProject || "";

    // Interactive TUI when --kb is not provided and stdout is TTY
    if (!kbName && process.stdout.isTTY) {
      try {
        const { default: inquirer } = await import("inquirer");

        // Auto-detect mode from --from or cwd
        const targetForDetection = opts.from || vaultPath;
        const initMode = targetForDetection ? detectInitMode(path.resolve(targetForDetection)) : "fresh";

        if (initMode === "existing" || initMode === "obsidian-vault") {
          const resolvedFrom = path.resolve(targetForDetection);
          const fileCount = (await import("fs-extra")).default.readdirSync(resolvedFrom, { recursive: true })
            .filter((f) => String(f).endsWith(".md")).length;

          printEvent("Adopting existing folder as knowledge base");
          console.log();

          if (initMode === "obsidian-vault") {
            printEventDetail("Detected existing Obsidian vault — .obsidian/ config will be preserved");
          }

          const { confirmAdopt } = await inquirer.prompt([{
            type: "confirm",
            name: "confirmAdopt",
            message: `Detected ${fileCount} markdown files. Set up this folder as a knowledge base?`,
            default: true,
          }]);
          if (!confirmAdopt) {
            console.log("Cancelled.");
            return;
          }
          vaultPath = resolvedFrom;
        } else {
          printEvent("Creating a new knowledge base");
          console.log();
        }

        // 1. Your name
        const { yourName } = await inquirer.prompt([{
          type: "input",
          name: "yourName",
          message: "Your name:",
          validate: (v: string) => v.trim() ? true : "Your name is required",
        }]);
        ownerName = yourName.trim();

        // 2. Knowledge base name
        const defaultKbName = vaultPath
          ? path.basename(vaultPath)
          : `${ownerName}'s KB`;
        const { enteredKbName } = await inquirer.prompt([{
          type: "input",
          name: "enteredKbName",
          message: "Knowledge base name:",
          default: defaultKbName,
          validate: (v: string) => v.trim() ? true : "Name is required",
        }]);
        kbName = enteredKbName.trim();

        // 3. Vault path (skip if adopting existing folder)
        if (!vaultPath) {
          const defaultPath = path.join(os.homedir(), "Documents", kbName);
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
        }

        // 4. Optional work preset
        const presets = listPresets().filter(p => p.name !== "minimal");
        if (presets.length > 0) {
          const { selectedPreset } = await inquirer.prompt([{
            type: "list",
            name: "selectedPreset",
            message: "Add a work preset? (optional)",
            choices: [
              { name: "No — start with a minimal personal KB", value: "minimal" },
              ...presets.map(p => ({
                name: `${p.displayName} — ${p.description}`,
                value: p.name,
              })),
            ],
          }]);
          presetName = selectedPreset;
        }

        // 5. MCP service selection (only if preset has MCP servers)
        if (presetName !== "minimal") {
          const { config: presetCfg } = loadPreset(presetName);
          const mcpEntries = Object.entries(presetCfg.mcpServers);
          if (mcpEntries.length > 0) {
            const mcpDisplayNames: Record<string, string> = {
              atlassian: "Atlassian (Jira / Confluence)",
              bigquery: "BigQuery (data warehouse queries)",
            };

            const { selectedMcp } = await inquirer.prompt([{
              type: "checkbox",
              name: "selectedMcp",
              message: "Which services do you want to connect?",
              choices: mcpEntries.map(([name]) => ({
                name: mcpDisplayNames[name] || name,
                value: name,
                checked: true,
              })),
            }]);

            const selectedSet = new Set(selectedMcp as string[]);
            mcpSkip = mcpEntries
              .map(([name]) => name)
              .filter((name) => !selectedSet.has(name));

            // BigQuery setup: collect GCP Project ID (auth is lazy — handled at runtime)
            if (selectedSet.has("bigquery")) {
              const { projectId } = await inquirer.prompt([{
                type: "input",
                name: "projectId",
                message: "GCP Project ID:",
                default: "wonder-raw-prod",
              }]);
              gcpProjectId = projectId.trim();
              printEventCheck(`BigQuery configured for project: ${gcpProjectId}`);
              printEventDetail("Authentication will happen when you first use BigQuery in Obsidian.");
            }
          }
        }

        // Create owner as a member if a preset with People/ is selected
        if (ownerName && presetName !== "minimal") {
          members.push({ name: ownerName, role: presetName === "pm-tpm" ? "PM/TPM" : "Team Member" });
        }
      } catch {
        // inquirer not available — fall through to require --kb
        if (!kbName) {
          console.error("Error: --kb flag is required in non-interactive mode");
          process.exit(1);
        }
      }
    }

    if (!kbName) {
      console.error("Error: --kb flag is required");
      process.exit(1);
    }

    // In non-interactive mode, use --name flag or fall back to OS username
    if (!ownerName) {
      ownerName = os.userInfo().username || "";
    }

    vaultPath = vaultPath || path.join(os.homedir(), "Documents", kbName);

    const providerOpt = opts.provider || "skip";

    const config = VaultConfigSchema.parse({
      kbName,
      ownerName,
      vaultPath,
      members,
      projects: [],
      preset: presetName,
      provider: providerOpt,
      gcpProjectId,
      mcpSkip,
    });

    const spinner = startSpinner(`Creating knowledge base "${kbName}"`);
    const result = await createVault(config);
    spinner.stop(`Knowledge base ready`);
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
        printEventCheck(`GCP Project: ${config.gcpProjectId}`);
      }
      if (result.providerResult.projectIdSkipped) {
        printEventDetail(`GCP Project skipped (already configured)`);
      }
      printEventCheck(`Config: ${result.providerResult.configPath}`);
    }

    // ── Auth Prompt (TTY only) ─────────────────────────────────
    let wantsAuth = config.provider !== "skip";
    if (!wantsAuth && process.stdout.isTTY && !opts.provider) {
      try {
        const { default: inquirer } = await import("inquirer");
        console.log();
        const { doAuth } = await inquirer.prompt([{
          type: "confirm",
          name: "doAuth",
          message: "Set up AI provider now? (you can always run 'opencode auth login' later)",
          default: true,
        }]);
        wantsAuth = doAuth;
      } catch {
        // inquirer not available — skip
      }
    }

    if (wantsAuth && process.stdout.isTTY) {
      console.log();
      printEvent("Launching AI provider authentication...");
      const authSuccess = await runProviderAuth();
      if (authSuccess) {
        printEventDone("Authentication complete");
      } else {
        printWarning(
          "Authentication was not completed. Your vault is ready — run this later:\n" +
          "opencode auth login"
        );
      }
    }

    // ── Onboarding sequence ──────────────────────────────────
    console.log();
    printEventDone(`Knowledge base ready at ${result.vaultPath}`);
    console.log();
    printEventDetail("Next steps:");
    printEventDetail("  1. Open Obsidian → Manage vaults → Open folder as vault");
    printEventDetail(`     ${result.vaultPath}`);
    printEventDetail("  2. Enable Obsidian CLI: Settings → General → Advanced → Command-line interface");
    printEventDetail('  3. Read "Start Here.md" for a quick orientation');
    printEventDetail("  4. Open the Agent Client panel and run /weave to connect your notes");
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

// ── byoao upgrade ────────────────────────────────────────────────
program
  .command("upgrade")
  .argument("[path]", "Path to vault root (default: detect from current directory)")
  .description(
    "Upgrade vault infrastructure to the latest BYOAO version — updates skills, " +
    "commands, templates, and Obsidian config"
  )
  .option("-y, --yes", "Skip confirmation prompt", false)
  .option("--dry-run", "Show upgrade plan without executing", false)
  .option("--force", "Run even if versions match or on downgrade", false)
  .option("--preset <name>", "Override preset during bootstrap (ignored if manifest exists)")
  .action(async (vaultArg, opts) => {
    printLogo();
    printVersion(PKG_VERSION);

    // 1. Detect vault
    const targetPath = vaultArg ?? process.cwd();
    const vaultRoot = detectVaultContext(targetPath);
    if (!vaultRoot) {
      printWarning("No BYOAO vault found. Run `byoao init` to create one.");
      process.exit(1);
    }

    printEvent("Upgrading vault");
    printEventDetail(`Vault: ${vaultRoot}`);

    try {
      // Try dry run first to show the plan
      const preview = await upgradeVault(vaultRoot, {
        preset: opts.preset,
        dryRun: true,
        force: opts.force,
      });

      // Up-to-date check
      if (
        preview.added.length === 0 &&
        preview.updated.length === 0 &&
        preview.deprecated.length === 0
      ) {
        printEventDone(`Vault is already up to date at v${preview.toVersion}`);
        if (!opts.force) return;
      }

      printEventDetail(`From v${preview.fromVersion} → v${preview.toVersion}`);
      console.log();

      // Show plan
      printEvent("Upgrade plan");
      for (const f of preview.added) {
        printEventDetail(`+ ${path.basename(f)}  (add → ${getCategoryLabel(f)})`);
      }
      for (const f of preview.updated) {
        printEventDetail(`~ ${path.basename(f)}  (update → ${getCategoryLabel(f)})`);
      }
      for (const f of preview.deprecated) {
        printEventDetail(`○ ${path.basename(f)}  (deprecated → ${getCategoryLabel(f)})`);
      }

      const total = preview.added.length + preview.updated.length + preview.deprecated.length;
      console.log();
      printEventDetail(
        `${total} changes (${preview.added.length} add, ${preview.updated.length} update, ${preview.deprecated.length} deprecated)`
      );

      if (opts.dryRun) return;

      // Confirm
      if (!opts.yes && process.stdout.isTTY) {
        try {
          const { default: inquirer } = await import("inquirer");
          const { proceed } = await inquirer.prompt([{
            type: "confirm",
            name: "proceed",
            message: "Proceed with upgrade?",
            default: true,
          }]);
          if (!proceed) {
            console.log("Cancelled.");
            return;
          }
        } catch {
          // inquirer not available — proceed
        }
      }

      console.log();
      const spinner = startSpinner("Upgrading vault...");

      const result = await upgradeVault(vaultRoot, {
        preset: opts.preset,
        force: opts.force,
      });

      spinner.stop("Upgrade complete");

      if (result.added.length > 0) {
        printEventCheck(`${result.added.length} files added`);
      }
      if (result.updated.length > 0) {
        printEventCheck(`${result.updated.length} files updated`);
      }
      if (result.errors.length > 0) {
        for (const e of result.errors) {
          printWarning(`Failed: ${e.file} (${e.error})`);
        }
        printWarning("Re-run upgrade to retry failed files");
      }
      printEventCheck(`Manifest updated to v${result.toVersion}`);
      console.log();
      printEventDone("Done");

      if (result.errors.length > 0) process.exit(1);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      printWarning(msg);
      process.exit(1);
    }
  });

function getCategoryLabel(filePath: string): string {
  if (filePath.startsWith(".opencode/skills/")) return "skills";
  if (filePath.startsWith(".opencode/commands/")) return "commands";
  if (filePath.startsWith(".obsidian/")) return "obsidian config";
  if (filePath.startsWith("Knowledge/templates/")) return "templates";
  return "other";
}

program.parse();
