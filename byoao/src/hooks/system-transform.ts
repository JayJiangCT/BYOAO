import fs from "fs-extra";
import path from "node:path";
import { detectVaultContext } from "../vault/vault-detect.js";
import { readOpencodeConfig } from "../vault/opencode-config.js";
import { isObsidianCliAvailable } from "../vault/obsidian-cli.js";
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
 *
 * Adapts instructions based on whether the Obsidian CLI is actually available,
 * so the agent is never told to use a tool that doesn't exist.
 */
function buildNavigationStrategy(vaultPath: string): string {
  const cliAvailable = isObsidianCliAvailable();

  const header = [
    "\n---",
    "## BYOAO Navigation Strategy",
    "",
    "### Scope",
    "",
    `This session is connected to a BYOAO knowledge base at: \`${vaultPath}\``,
    "",
  ];

  const scopeLines = cliAvailable
    ? [
        `- **Inside the vault** (\`${vaultPath}/\` and its subdirectories): **ALWAYS use Obsidian CLI first** (see /obsidian-cli skill) or BYOAO tools (\`byoao_search_vault\`, \`byoao_note_read\`, \`byoao_graph_health\`). Obsidian CLI is graph-aware and understands wikilinks, backlinks, and frontmatter — grep/cat/find do not. Only fall back to find/grep when Obsidian CLI returns no results for a given query.`,
        `- **Outside the vault** (code repositories, config files, system paths, etc.): use any appropriate tool (grep, cat, read, bash, etc.) freely.`,
      ]
    : [
        `- **Obsidian CLI is NOT available** (either not installed or Obsidian is not running). Use built-in tools (find, grep, read) to access vault notes at \`${vaultPath}/\`.`,
        `- BYOAO tools (\`byoao_search_vault\`, \`byoao_note_read\`, \`byoao_graph_health\`) are still available and preferred over raw find/grep when possible.`,
        `- **Outside the vault** (code repositories, config files, system paths, etc.): use any appropriate tool freely.`,
      ];

  const navigationSteps = cliAvailable
    ? [
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
        "If an Obsidian CLI search returns no results, retry with find/grep as a fallback.",
      ]
    : [
        "### Navigation Pattern (Progressive Disclosure)",
        "",
        "1. Read [[Glossary]] first — the entity dictionary for this knowledge base.",
        "   Every term is a key concept the user cares about.",
        "2. Use `byoao_search_vault` or grep frontmatter fields to understand vault structure",
        "3. Search by `domain` property or tags to find relevant notes",
        "4. Read the `references` frontmatter of found notes for deeper context",
        "5. Use grep for `[[note name]]` patterns to discover backlinks manually",
        "6. Chain: Glossary → domain notes → references → backlinks → details",
      ];

  const footer = [
    "",
    "### Key Frontmatter Fields",
    "",
    "| Field        | Purpose                                          |",
    "|-------------|--------------------------------------------------|",
    "| `domain`    | Knowledge area — use to find related notes       |",
    "| `references`| Related notes — follow for deeper context        |",
    "| `type`      | Note kind (meeting, idea, reference, daily, etc) |",
    "| `tags`      | Flexible categorization                          |",
    "",
    "### Vault Health",
    "",
    "If you notice broken wikilinks, orphan notes, or missing frontmatter while working,",
    "suggest that the user run `/diagnose` to get a full vault health report.",
  ];

  return [...header, ...scopeLines, "", ...navigationSteps, ...footer].join("\n");
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
