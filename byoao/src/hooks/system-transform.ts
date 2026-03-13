import fs from "fs-extra";
import path from "node:path";

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
 * Hook: inject AGENT.md into system prompt.
 * Mutating pattern — modifies output.system in place.
 */
export async function systemTransformHook(
  _input: { sessionID?: string; model: unknown },
  output: { system: string[] }
): Promise<void> {
  const agentMd = readAgentMdFromCwd();
  if (agentMd) {
    output.system.push(
      `\n---\n## BYOAO Vault Context (from AGENT.md)\n\n${agentMd}`
    );
  }
}
