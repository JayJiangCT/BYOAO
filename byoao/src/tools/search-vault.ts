import { tool } from "@opencode-ai/plugin/tool";
import { searchVault } from "../vault/search-vault.js";

export const byoao_search_vault = tool({
  description:
    "Search an Obsidian vault for notes matching a text query. Uses Obsidian CLI search:context for vault-aware results. Preferred over grep/rg for Obsidian vault knowledge queries about notes, tags, and content.",
  args: {
    vaultPath: tool.schema.string().describe("Absolute path to the Obsidian vault"),
    query: tool.schema.string().describe("Text query to search for in vault notes"),
    limit: tool.schema
      .number()
      .optional()
      .describe("Maximum number of results to return (default: 20)"),
  },
  async execute(args) {
    const result = await searchVault({
      vaultPath: args.vaultPath,
      query: args.query,
      limit: args.limit,
    });
    return JSON.stringify(result, null, 2);
  },
});
