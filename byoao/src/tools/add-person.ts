import { tool } from "@opencode-ai/plugin/tool";
import { addMember } from "../vault/member.js";

export const byoao_add_person = tool({
  description:
    "Add a person note to an existing vault. Creates a person note in People/ and updates the team index and AGENT.md wikilinks.",
  args: {
    vaultPath: tool.schema.string().describe("Path to the Obsidian vault"),
    name: tool.schema.string().describe("Person's full name"),
    role: tool.schema.string().optional().describe("Person's role/title"),
    team: tool.schema.string().optional().describe("Team or KB name"),
  },
  async execute(args) {
    const result = await addMember({
      vaultPath: args.vaultPath,
      name: args.name,
      role: args.role || "",
      team: args.team || "",
    });

    return `Added person: ${args.name}\n  File: ${result.filePath}\n  Wikilinks updated: ${result.wikilinksAdded}`;
  },
});
