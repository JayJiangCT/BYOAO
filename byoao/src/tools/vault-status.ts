import { tool } from "@opencode-ai/plugin/tool";
import { getVaultStatus, formatVaultStatus } from "../vault/status.js";
import { checkObsidian, formatObsidianStatus } from "../vault/obsidian-check.js";

export const byoao_vault_status = tool({
  description:
    "Check the health of an Obsidian vault — note count, wikilink count, broken links, directory breakdown, Obsidian installation status, and LLM Wiki v2 signals: per-directory markdown counts under entities/, concepts/, comparisons/, queries/, plus presence of SCHEMA.md, log.md, and INDEX.base at the vault root.",
  args: {
    vaultPath: tool.schema.string().describe("Path to the Obsidian vault"),
  },
  async execute(args) {
    const obsidianStatus = checkObsidian();
    const vaultStatus = await getVaultStatus(args.vaultPath);

    let output = formatVaultStatus(vaultStatus);
    output += "\n\n--- Obsidian Status ---\n";
    output += formatObsidianStatus(obsidianStatus);

    return output;
  },
});
