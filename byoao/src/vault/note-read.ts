import { isObsidianCliAvailable, execObsidianCmd } from "./obsidian-cli.js";
import type { RetrievalResult } from "./retrieval-types.js";
import { MAX_SNIPPET_LENGTH } from "./retrieval-types.js";

interface ReadNoteInput {
  vaultPath: string;
  file: string;
}

/**
 * Read a note from the vault using Obsidian CLI.
 * Returns runtime_unavailable if CLI is not available — no internal fallback.
 */
export async function readNote(input: ReadNoteInput): Promise<RetrievalResult> {
  const { vaultPath, file } = input;
  const mode = "read";
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

  // 2. Execute read command
  const cliResult = execObsidianCmd(["read", "--vault", vaultPath, file]);

  if (!cliResult.success) {
    return {
      ...base,
      status: "runtime_unavailable",
      summary: `Failed to read note "${file}"`,
      results: [],
      truncated: false,
      diagnostics: [cliResult.error ?? "Unknown CLI error"],
    };
  }

  // 3. Handle empty output
  const content = cliResult.output.trim();
  if (content.length === 0) {
    return {
      ...base,
      status: "no_results",
      summary: `Note "${file}" is empty or not found`,
      results: [],
      truncated: false,
      diagnostics: [],
    };
  }

  // 4. Build result — full content as snippet (truncated for the summary item)
  const snippet =
    content.length > MAX_SNIPPET_LENGTH
      ? content.substring(0, MAX_SNIPPET_LENGTH)
      : content;

  return {
    ...base,
    status: "ok",
    summary: `Read note "${file}" (${content.length} chars)`,
    results: [
      {
        title: file,
        path: "",
        file,
        snippet,
      },
    ],
    truncated: false,
    diagnostics: [],
  };
}
