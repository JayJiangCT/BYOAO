import { fs } from "../lib/cjs-modules.js";
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

export type InitMode = "fresh" | "existing" | "obsidian-vault";

/**
 * Determine the init mode for a target path:
 * - "obsidian-vault": .obsidian/ already exists — adopt with safety
 * - "existing": folder has .md files but no .obsidian/
 * - "fresh": empty or non-existent directory
 */
export function detectInitMode(targetPath: string): InitMode {
  if (!fs.existsSync(targetPath)) return "fresh";

  const hasObsidian = fs.existsSync(path.join(targetPath, ".obsidian"));
  if (hasObsidian) return "obsidian-vault";

  // Check for existing .md files (non-recursive, just top-level + one depth)
  try {
    const entries = fs.readdirSync(targetPath, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isFile() && entry.name.endsWith(".md")) return "existing";
      if (entry.isDirectory() && !entry.name.startsWith(".")) {
        const subEntries = fs.readdirSync(path.join(targetPath, entry.name));
        if (subEntries.some((f) => f.endsWith(".md"))) return "existing";
      }
    }
  } catch {
    // Can't read directory — treat as fresh
  }

  return "fresh";
}
