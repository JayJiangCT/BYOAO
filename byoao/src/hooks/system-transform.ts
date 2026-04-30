import { fs } from "../lib/cjs-modules.js";
import path from "node:path";
import { log } from "../lib/logger.js";
import { detectVaultContext } from "../vault/vault-detect.js";
import { readOpencodeConfig } from "../vault/opencode-config.js";

function readVaultMarkdown(vaultPath: string, fileName: string): string | null {
  const full = path.join(vaultPath, fileName);
  if (!fs.existsSync(full)) return null;
  try {
    return fs.readFileSync(full, "utf-8");
  } catch {
    void log("warn", "hook:system-transform", `Failed to read ${fileName}`, {
      context: { path: full },
    }).catch(() => {});
    return null;
  }
}

/**
 * Build MCP auth failure guidance for the system prompt.
 * Only returns content when MCP servers are configured in OpenCode config.
 */
async function buildMcpAuthGuidance(): Promise<string | null> {
  try {
    const config = await readOpencodeConfig();
    const mcp = config.mcp as Record<string, unknown> | undefined;
    if (!mcp || Object.keys(mcp).length === 0) return null;

    const serviceNames = Object.keys(mcp);

    return [
      "\n---",
      "## MCP Services — IMPORTANT",
      "",
      `This vault has MCP services configured: ${serviceNames.join(", ")}.`,
      "",
      "### STRICT Rules — you MUST follow these",
      "",
      "1. NEVER use bash, npx, curl, web fetch, or any workaround to access MCP services.",
      "   MCP tools are the ONLY way to interact with these services.",
      "2. **When ANY MCP tool call FAILS for ANY reason** — including auth errors, missing",
      "   credentials, token expired, permission denied, 401, 403, or connection issues —",
      "   you MUST call `byoao_mcp_auth` with the service name as your IMMEDIATE next action.",
      "   Do NOT explain the error to the user. Do NOT suggest manual commands.",
      "   Do NOT ask the user to check anything. Just call `byoao_mcp_auth`.",
      "3. After auth completes, tell the user to check if the MCP connection indicator is now green.",
      "   - If green: They can retry their request.",
      "   - If NOT green: Tell them to click \"...\" → \"Restart agent\" to reload the connection.",
      "",
      "### Service names for `byoao_mcp_auth`",
      "",
      serviceNames.includes("atlassian")
        ? '- **"atlassian"**: for Jira, Confluence, any `atlassian.net` URL'
        : "",
      serviceNames.includes("bigquery")
        ? '- **"bigquery"**: for SQL queries, data analysis, BigQuery'
        : "",
    ].filter(Boolean).join("\n");
  } catch {
    void log("warn", "hook:system-transform", "Failed to build MCP auth guidance").catch(() => {});
    return null;
  }
}

/**
 * Hook: inject AGENTS.md, SCHEMA.md, and MCP auth guidance into system prompt.
 * Mutating pattern — modifies output.system in place.
 */
export async function systemTransformHook(
  _input: { sessionID?: string; model: unknown },
  output: { system: string[] }
): Promise<void> {
  const vaultPath = detectVaultContext(process.cwd());
  if (vaultPath) {
    let agentsTitle = "## AGENTS.md";
    let agents = readVaultMarkdown(vaultPath, "AGENTS.md");
    if (!agents) {
      agents = readVaultMarkdown(vaultPath, "AGENT.md");
      if (agents) agentsTitle = "## AGENT.md";
    }
    if (agents) {
      output.system.push(`\n---\n${agentsTitle}\n\n${agents}`);
    }

    const schema = readVaultMarkdown(vaultPath, "SCHEMA.md");
    if (schema) {
      output.system.push(`\n---\n## SCHEMA.md\n\n${schema}`);
    }
  }

  const mcpGuidance = await buildMcpAuthGuidance();
  if (mcpGuidance) {
    output.system.push(mcpGuidance);
  }
}
