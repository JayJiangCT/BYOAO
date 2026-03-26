import fs from "fs-extra";
import path from "node:path";
import { detectVaultContext } from "../vault/vault-detect.js";

/**
 * Read AGENT.md from the current working directory.
 * Returns the content if found, null otherwise.
 */
export function readAgentMdFromCwd(): string | null {
  const candidates = [
    path.join(process.cwd(), "AGENT.md"),
    path.join(process.cwd(), "..", "AGENT.md"),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      try {
        return fs.readFileSync(candidate, "utf-8");
      } catch {
        return null;
      }
    }
  }

  return null;
}

/**
 * Hook: inject AGENT.md and vault retrieval context into system prompt.
 * Mutating pattern — modifies output.system in place.
 */
export async function systemTransformHook(
  _input: { sessionID?: string; model: unknown },
  output: { system: string[] }
): Promise<void> {
  // 1. Inject AGENT.md content
  const agentMd = readAgentMdFromCwd();
  if (agentMd) {
    output.system.push(
      `\n---\n## BYOAO Vault Context (from AGENT.md)\n\n${agentMd}`
    );
  }

  // 2. Inject vault retrieval tool guidance
  const vaultPath = detectVaultContext(process.cwd());
  if (vaultPath) {
    output.system.push(
      [
        "\n---",
        "## BYOAO Vault Retrieval Context",
        "",
        `You are in a BYOAO Obsidian vault at: ${vaultPath}`,
        "For vault knowledge queries (notes, tags, links, properties, graph health), prefer the BYOAO vault tools:",
        "- byoao_search_vault — text search across vault notes",
        "- byoao_note_read — read a specific note by name",
        "- byoao_graph_health — find orphans, unresolved links, dead ends",
        "",
        "Use grep/rg only for source code searches or when BYOAO tools return runtime_unavailable.",
      ].join("\n")
    );
  }
}
