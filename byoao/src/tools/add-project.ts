import { tool } from "@opencode-ai/plugin/tool";
import { addProject } from "../vault/project.js";

export const byoao_add_project = tool({
  description:
    "Add a new project note to an existing vault. Creates a project note in 10-Projects/ and updates the team index and AGENT.md wikilinks.",
  args: {
    vaultPath: tool.schema.string().describe("Path to the Obsidian vault"),
    name: tool.schema.string().describe("Project name"),
    description: tool.schema
      .string()
      .optional()
      .describe("One-line project description"),
    team: tool.schema.string().optional().describe("Team name"),
  },
  async execute(args) {
    const result = await addProject({
      vaultPath: args.vaultPath,
      name: args.name,
      description: args.description || "",
      team: args.team || "",
    });

    return `✓ Added project: ${args.name}\n  File: ${result.filePath}\n  Wikilinks updated: ${result.wikilinksAdded}`;
  },
});
