import fs from "fs-extra";
import path from "node:path";

/**
 * Detect whether a directory is (or is inside) a BYOAO vault.
 * Returns the vault root path if detected, null otherwise.
 *
 * A directory is a BYOAO vault if:
 * - .obsidian/ exists AND AGENT.md exists, OR
 * - .obsidian/ exists AND Knowledge/Glossary.md exists
 *
 * Checks the given directory and its immediate parent.
 */
export function detectVaultContext(dir: string): string | null {
  const candidates = [dir, path.dirname(dir)];

  for (const candidate of candidates) {
    if (!fs.existsSync(candidate)) continue;

    const hasObsidian = fs.existsSync(path.join(candidate, ".obsidian"));
    if (!hasObsidian) continue;

    const hasAgentMd = fs.existsSync(path.join(candidate, "AGENT.md"));
    const hasGlossary = fs.existsSync(
      path.join(candidate, "Knowledge", "Glossary.md")
    );

    if (hasAgentMd || hasGlossary) {
      return candidate;
    }
  }

  return null;
}
