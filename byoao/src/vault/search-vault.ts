import path from "node:path";
import { isObsidianCliAvailable, execObsidianCmd } from "./obsidian-cli.js";
import type { RetrievalResult, RetrievalResultItem } from "./retrieval-types.js";
import { DEFAULT_RESULT_LIMIT, MAX_SNIPPET_LENGTH } from "./retrieval-types.js";

interface SearchVaultInput {
  vaultPath: string;
  query: string;
  limit?: number;
}

/**
 * Search vault notes using Obsidian CLI search:context.
 * Returns runtime_unavailable if CLI is not available — no internal fallback.
 */
export async function searchVault(input: SearchVaultInput): Promise<RetrievalResult> {
  const { vaultPath, query, limit = DEFAULT_RESULT_LIMIT } = input;
  const mode = "search:context";
  const base: Pick<RetrievalResult, "mode" | "vault" | "fallback"> = {
    mode,
    vault: vaultPath,
    fallback: "none",
  };

  // 1. Check CLI availability
  if (!isObsidianCliAvailable()) {
    return {
      ...base,
      status: "runtime_unavailable",
      summary: "Obsidian CLI not available",
      results: [],
      truncated: false,
      diagnostics: ["Obsidian CLI not available"],
    };
  }

  // 2. Execute search:context
  const cliResult = execObsidianCmd([
    "search:context",
    "--vault",
    vaultPath,
    query,
  ]);

  if (!cliResult.success) {
    return {
      ...base,
      status: "runtime_unavailable",
      summary: "Obsidian CLI command failed",
      results: [],
      truncated: false,
      diagnostics: [cliResult.error ?? "Unknown CLI error"],
    };
  }

  // 3. Parse output lines (format: path/to/note.md:context line)
  const lines = cliResult.output.split("\n").filter((l) => l.trim().length > 0);

  if (lines.length === 0) {
    return {
      ...base,
      status: "no_results",
      summary: `No matches for "${query}"`,
      results: [],
      truncated: false,
      diagnostics: [],
    };
  }

  // 4. Build result items
  const allItems: RetrievalResultItem[] = [];
  for (const line of lines) {
    const colonIdx = line.indexOf(":");
    if (colonIdx === -1) continue;

    const filePath = line.substring(0, colonIdx);
    const snippet = line.substring(colonIdx + 1).trim();
    const title = path.basename(filePath, ".md");

    allItems.push({
      title,
      path: filePath,
      file: title,
      snippet: snippet.length > MAX_SNIPPET_LENGTH
        ? snippet.substring(0, MAX_SNIPPET_LENGTH)
        : snippet,
    });
  }

  // 5. Apply limit
  const truncated = allItems.length > limit;
  const results = allItems.slice(0, limit);

  return {
    ...base,
    status: "ok",
    summary: `${allItems.length} matching notes for "${query}"`,
    results,
    truncated,
    totalMatches: allItems.length,
    diagnostics: [],
  };
}
