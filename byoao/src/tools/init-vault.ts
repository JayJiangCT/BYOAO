import { tool } from "@opencode-ai/plugin/tool";
import { createVault } from "../vault/create.js";
import { checkObsidian, formatObsidianStatus } from "../vault/obsidian-check.js";
import { VaultConfigSchema } from "../plugin-config.js";
import path from "node:path";
import os from "node:os";

export const byoao_init_vault = tool({
  description:
    "Create a personal knowledge base in Obsidian. Creates directory structure, templates, glossary, agent routing file (AGENTS.md), and optional people/project notes with wikilinks. Checks that Obsidian is installed first.",
  args: {
    kbName: tool.schema.string().describe("Knowledge base name (e.g. \"Jay's KB\")"),
    ownerName: tool.schema.string().optional().describe("Owner's name"),
    vaultPath: tool.schema
      .string()
      .optional()
      .describe(
        "Where to create the vault. Defaults to ~/Documents/{kbName}"
      ),
    members: tool.schema
      .array(
        tool.schema.object({
          name: tool.schema.string().describe("Person's name"),
          role: tool.schema.string().optional().describe("Person's role"),
        })
      )
      .optional()
      .describe("People to create notes for"),
    projects: tool.schema
      .array(
        tool.schema.object({
          name: tool.schema.string().describe("Project name"),
          description: tool.schema.string().optional().describe("One-line description"),
        })
      )
      .optional()
      .describe("Active projects to create project notes for"),
    glossaryEntries: tool.schema
      .array(
        tool.schema.object({
          term: tool.schema.string().describe("Domain term"),
          definition: tool.schema.string().describe("Brief definition"),
        })
      )
      .optional()
      .describe("Domain terms to add to the glossary"),
    jiraHost: tool.schema
      .string()
      .optional()
      .describe("JIRA host (e.g. 'mycompany.atlassian.net')"),
    jiraProject: tool.schema
      .string()
      .optional()
      .describe("JIRA project key (e.g. 'HDR')"),
    preset: tool.schema
      .string()
      .optional()
      .describe("Role preset (default: 'minimal'). Use 'pm-tpm' for project management."),
  },
  async execute(args) {
    // Check Obsidian first
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
      members: args.members || [],
      projects: args.projects || [],
      glossaryEntries: args.glossaryEntries || [],
      jiraHost: args.jiraHost || "",
      jiraProject: args.jiraProject || "",
      preset: args.preset || "minimal",
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
      output += `\n\n→ Next step: run /weave now — it will scan your existing notes, add frontmatter metadata (including dates), create wikilinks between related content, and build your Glossary from frequently mentioned concepts.`;
    } else {
      output += `\n\n→ Next step: add a few notes, then run /weave to connect them into a knowledge graph. See "Start Here" in the vault for details.`;
    }

    return output;
  },
});
