import { tool } from "@opencode-ai/plugin/tool";
import { getGraphHealth } from "../vault/graph-health.js";

export const byoao_graph_health = tool({
  description:
    "Diagnose Obsidian vault graph health — find orphan notes (no links in or out), unresolved links (broken wikilinks), and dead-end notes. Uses Obsidian CLI for vault-aware analysis.",
  args: {
    vaultPath: tool.schema.string().describe("Absolute path to the Obsidian vault"),
    check: tool.schema
      .enum(["all", "orphans", "unresolved", "deadends"])
      .optional()
      .describe(
        "Which check to run: 'all' (default), 'orphans', 'unresolved', or 'deadends'"
      ),
    limit: tool.schema
      .number()
      .optional()
      .describe("Maximum number of results to return (default: 20)"),
  },
  async execute(args) {
    const result = await getGraphHealth({
      vaultPath: args.vaultPath,
      check: args.check as "all" | "orphans" | "unresolved" | "deadends" | undefined,
      limit: args.limit,
    });
    return JSON.stringify(result, null, 2);
  },
});
