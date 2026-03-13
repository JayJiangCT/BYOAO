import { tool } from "@opencode-ai/plugin/tool";
import { createVault } from "../vault/create.js";
import { checkObsidian, formatObsidianStatus } from "../vault/obsidian-check.js";
import { VaultConfigSchema } from "../plugin-config.js";
import path from "node:path";
import os from "node:os";

export const byoao_init_vault = tool({
  description:
    "Create a fully configured Obsidian vault for any team. Creates directory structure, templates, glossary, agent routing file, and optional people/project notes with wikilinks. Checks that Obsidian is installed first.",
  args: {
    teamName: tool.schema.string().describe("Team name (e.g. 'HDR Operations')"),
    vaultPath: tool.schema
      .string()
      .optional()
      .describe(
        "Where to create the vault. Defaults to ~/Documents/{teamName} Workspace"
      ),
    members: tool.schema
      .array(
        tool.schema.object({
          name: tool.schema.string().describe("Person's name"),
          role: tool.schema.string().optional().describe("Person's role"),
        })
      )
      .optional()
      .describe("Team members to create people notes for"),
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
      .describe("Role preset (default: 'pm-tpm')"),
  },
  async execute(args) {
    // Check Obsidian first
    const obsidianStatus = checkObsidian();
    if (!obsidianStatus.installed) {
      return `${formatObsidianStatus(obsidianStatus)}\n\nPlease install Obsidian first, then try again.`;
    }

    const resolvedPath =
      args.vaultPath ||
      path.join(os.homedir(), "Documents", `${args.teamName} Workspace`);

    const config = VaultConfigSchema.parse({
      teamName: args.teamName,
      vaultPath: resolvedPath,
      members: args.members || [],
      projects: args.projects || [],
      glossaryEntries: args.glossaryEntries || [],
      jiraHost: args.jiraHost || "",
      jiraProject: args.jiraProject || "",
      preset: args.preset || "pm-tpm",
    });

    const result = await createVault(config);

    let output = `✓ Vault created at: ${result.vaultPath}\n`;
    output += `  Files created: ${result.filesCreated}\n`;
    output += `  Wikilinks: ${result.wikilinksCreated}\n`;
    output += `  Directories: ${result.directories.length}`;

    if (!obsidianStatus.running) {
      output += `\n\n${formatObsidianStatus(obsidianStatus)}`;
      output += `\n\nAfter opening Obsidian, use "Open folder as vault" → select "${result.vaultPath}"`;
    } else {
      output += `\n\nOpen in Obsidian: "Open folder as vault" → select "${result.vaultPath}"`;
    }

    return output;
  },
});
