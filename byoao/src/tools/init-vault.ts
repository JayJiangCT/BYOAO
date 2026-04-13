import { tool } from "@opencode-ai/plugin/tool";
import { createVault } from "../vault/create.js";
import { checkObsidian, formatObsidianStatus } from "../vault/obsidian-check.js";
import { VaultConfigSchema } from "../plugin-config.js";
import path from "node:path";
import os from "node:os";

export const byoao_init_vault = tool({
  description:
    "Create an LLM Wiki knowledge base in Obsidian. Sets up agent directories (entities/, concepts/, comparisons/, queries/), SCHEMA.md, log.md, INDEX.base (from INDEX.base.example when missing), and AI routing (AGENTS.md). Your existing notes become raw material for /cook.",
  args: {
    kbName: tool.schema.string().describe("Knowledge base name (e.g. \"Jay's KB\")"),
    ownerName: tool.schema.string().optional().describe("Owner's name"),
    vaultPath: tool.schema
      .string()
      .optional()
      .describe(
        "Where to create the vault. Defaults to ~/Documents/{kbName}"
      ),
    preset: tool.schema
      .string()
      .optional()
      .describe("Work profile (default: 'minimal'). Use 'pm-tpm' for PM/TPM with Atlassian + BigQuery."),
    wikiDomain: tool.schema
      .string()
      .optional()
      .describe("What domain this knowledge base covers (e.g. 'AI/ML research', 'product management')"),
  },
  async execute(args) {
    const obsidianStatus = checkObsidian();
    if (!obsidianStatus.installed) {
      return `${formatObsidianStatus(obsidianStatus)}\n\nPlease install Obsidian first, then try again.`;
    }

    const resolvedPath =
      args.vaultPath ||
      path.join(os.homedir(), "Documents", args.kbName);

    const config = VaultConfigSchema.parse({
      kbName: args.kbName,
      ownerName: args.ownerName || "",
      vaultPath: resolvedPath,
      preset: args.preset || "minimal",
      wikiDomain: args.wikiDomain || "",
    });

    const result = await createVault(config);

    let output = `✓ Knowledge base created at: ${result.vaultPath}\n`;
    output += `  Files created: ${result.filesCreated}\n`;
    output += `  Wikilinks: ${result.wikilinksCreated}\n`;
    output += `  Directories: ${result.directories.length}`;

    if (result.mcpResult) {
      if (result.mcpResult.serversAdded.length > 0) {
        output += `\n\n✓ MCP servers configured:`;
        for (const name of result.mcpResult.serversAdded) {
          output += `\n  Added: ${name}`;
        }
      }
      if (result.mcpResult.serversSkipped.length > 0) {
        for (const name of result.mcpResult.serversSkipped) {
          output += `\n  Skipped (already exists): ${name}`;
        }
      }
      output += `\n  Config: ${result.mcpResult.configPath}`;
    }

    if (result.pluginsResult) {
      output += `\n\n✓ Obsidian plugins installed:`;
      if (result.pluginsResult.bratNewlyInstalled) {
        output += `\n  BRAT: newly installed (plugin manager)`;
      }
      if (result.pluginsResult.pluginsAdded.length > 0) {
        for (const name of result.pluginsResult.pluginsAdded) {
          output += `\n  Added: ${name}`;
        }
      }
      if (result.pluginsResult.pluginsSkipped.length > 0) {
        for (const name of result.pluginsResult.pluginsSkipped) {
          output += `\n  Skipped (already installed): ${name}`;
        }
      }
      if (result.pluginsResult.errors.length > 0) {
        for (const err of result.pluginsResult.errors) {
          output += `\n  ⚠ ${err.pluginId}: ${err.error}`;
        }
      }
      if (obsidianStatus.running && result.pluginsResult.pluginsAdded.length > 0) {
        output += `\n  ⚠ Obsidian is running — restart it to activate new plugins`;
      }
    }

    if (result.providerResult) {
      output += `\n\n✓ AI provider configured: ${result.providerResult.provider}`;
      if (result.providerResult.pluginAdded) {
        output += `\n  Plugin added: opencode-gemini-auth`;
      }
      if (result.providerResult.pluginSkipped) {
        output += `\n  Plugin skipped (already installed)`;
      }
      if (result.providerResult.projectIdSet) {
        output += `\n  GCP Project configured`;
      }
      if (result.providerResult.projectIdSkipped) {
        output += `\n  GCP Project skipped (already configured)`;
      }
      if (!result.providerResult.provider || result.providerResult.provider === "copilot") {
        output += `\n  ℹ Run "opencode auth login" in terminal to complete authentication`;
      }
    }

    if (!obsidianStatus.running) {
      output += `\n\n${formatObsidianStatus(obsidianStatus)}`;
      output += `\n\nAfter opening Obsidian, use "Open folder as vault" → select "${result.vaultPath}"`;
    } else {
      output += `\n\nOpen in Obsidian: "Open folder as vault" → select "${result.vaultPath}"`;
    }

    if (result.initMode === "existing" || result.initMode === "obsidian-vault") {
      output += `\n\n→ Next step: run /cook now — it will scan your existing notes, identify entities and concepts, and compile them into structured knowledge pages.`;
    } else {
      output += `\n\n→ Next step: add a few notes, then run /cook to compile them into knowledge pages. See "Start Here" in the vault for details.`;
    }

    return output;
  },
});
