import path from "node:path";
import { isObsidianCliAvailable, execObsidianCmd } from "./obsidian-cli.js";
import type { RetrievalResult, RetrievalResultItem } from "./retrieval-types.js";
import { DEFAULT_RESULT_LIMIT } from "./retrieval-types.js";

type HealthCheck = "orphans" | "unresolved" | "deadends";
const ALL_CHECKS: HealthCheck[] = ["orphans", "unresolved", "deadends"];

interface GraphHealthInput {
  vaultPath: string;
  check?: "all" | HealthCheck;
  limit?: number;
}

/** Parse CLI output lines into result items for a given check type. */
function parseCheckOutput(
  check: HealthCheck,
  output: string
): RetrievalResultItem[] {
  const lines = output.split("\n").filter((l) => l.trim().length > 0);
  return lines.map((line) => {
    const trimmed = line.trim();
    // For orphans/deadends: output is file paths
    // For unresolved: output is link target names
    const isPath = trimmed.includes("/") || trimmed.endsWith(".md");
    const title = isPath ? path.basename(trimmed, ".md") : trimmed;

    return {
      title,
      path: isPath ? trimmed : "",
      file: title,
      metadata: { check },
    };
  });
}

/**
 * Run graph health diagnostics using Obsidian CLI.
 * Returns runtime_unavailable if CLI is not available — no internal fallback.
 */
export async function getGraphHealth(
  input: GraphHealthInput
): Promise<RetrievalResult> {
  const { vaultPath, check = "all", limit = DEFAULT_RESULT_LIMIT } = input;
  const mode = "graph-health";
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

  // 2. Determine which checks to run
  const checks: HealthCheck[] = check === "all" ? ALL_CHECKS : [check];

  // 3. Run each check and collect results
  const allItems: RetrievalResultItem[] = [];
  const diagnostics: string[] = [];

  for (const checkType of checks) {
    const cliResult = execObsidianCmd([checkType, "--vault", vaultPath]);

    if (!cliResult.success) {
      diagnostics.push(
        `${checkType} check failed: ${cliResult.error ?? "unknown error"}`
      );
      continue;
    }

    if (cliResult.output.trim().length > 0) {
      allItems.push(...parseCheckOutput(checkType, cliResult.output));
    }
  }

  // 4. Build response
  if (allItems.length === 0 && diagnostics.length === 0) {
    return {
      ...base,
      status: "no_results",
      summary: "No issues found — vault graph is healthy",
      results: [],
      truncated: false,
      diagnostics,
    };
  }

  const truncated = allItems.length > limit;
  const results = allItems.slice(0, limit);

  return {
    ...base,
    status: allItems.length > 0 ? "ok" : "no_results",
    summary: `Found ${allItems.length} graph issues across ${checks.join(", ")} checks`,
    results,
    truncated,
    totalMatches: allItems.length,
    diagnostics,
  };
}
