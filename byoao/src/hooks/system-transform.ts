import fs from "fs-extra";
import path from "node:path";
import { detectVaultContext } from "../vault/vault-detect.js";
import { readOpencodeConfig } from "../vault/opencode-config.js";
import { log } from "../lib/logger.js";

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
        void log("warn", "hook:system-transform", "Failed to read AGENT.md", {
          context: { path: candidate },
        }).catch(() => {});
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
      "3. After auth completes, tell the user to click \"...\" → \"Restart agent\".",
      "   Do NOT try to use the tools in the current session — they require a restart.",
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

  // 3. Inject MCP auth guidance (only when MCP servers are configured)
  const mcpGuidance = await buildMcpAuthGuidance();
  if (mcpGuidance) {
    output.system.push(mcpGuidance);
  }
}
