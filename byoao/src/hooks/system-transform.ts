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
 * Lightweight navigation strategy injected into the system prompt.
 * CLI command reference is handled by obsidian-skills (kepano/obsidian-skills).
 * This hook only teaches the agent WHY and WHEN to use specific patterns.
 */
function buildNavigationStrategy(vaultPath: string): string {
  return [
    "\n---",
    "## BYOAO Navigation Strategy",
    "",
    `You are in a BYOAO knowledge base at: ${vaultPath}`,
    "Use the Obsidian CLI (see /obsidian-cli skill) for all vault queries.",
    "Never use grep/cat/ls for vault content — Obsidian CLI is graph-aware.",
    "",
    "### Navigation Pattern (Progressive Disclosure)",
    "",
    "1. Read [[Glossary]] first — the entity dictionary for this knowledge base.",
    "   Every term is a key concept the user cares about.",
    "2. Use `obsidian properties sort=count counts` to understand vault structure",
    "3. Search by `domain` property or tags to find relevant notes",
    "4. Read the `references` frontmatter of found notes for deeper context",
    "5. Use `obsidian backlinks` to discover related notes the user didn't mention",
    "6. Chain: Glossary → domain notes → references → backlinks → details",
    "",
    "### Key Frontmatter Fields",
    "",
    "| Field        | Purpose                                          |",
    "|-------------|--------------------------------------------------|",
    "| `domain`    | Knowledge area — use to find related notes       |",
    "| `references`| Related notes — follow for deeper context        |",
    "| `type`      | Note kind (meeting, idea, reference, daily, etc) |",
    "| `tags`      | Flexible categorization                          |",
  ].join("\n");
}

/**
 * Hook: inject AGENT.md and vault navigation strategy into system prompt.
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

  // 2. Inject navigation strategy (lightweight — CLI syntax is obsidian-skills' job)
  const vaultPath = detectVaultContext(process.cwd());
  if (vaultPath) {
    output.system.push(buildNavigationStrategy(vaultPath));
  }
}
