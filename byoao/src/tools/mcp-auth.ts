import { tool } from "@opencode-ai/plugin/tool";
import { spawn, execSync } from "node:child_process";
import path from "node:path";
import os from "node:os";
import { readOpencodeConfig } from "../vault/opencode-config.js";

/**
 * Find the opencode binary. In ACP context, $PATH may not include it.
 */
function findOpencodeBinary(): string {
  const candidates = [
    path.join(os.homedir(), ".opencode/bin/opencode"),
    "/usr/local/bin/opencode",
  ];
  for (const p of candidates) {
    try {
      execSync(`test -x "${p}"`, { stdio: "pipe" });
      return p;
    } catch {
      // not found
    }
  }
  return "opencode";
}

/**
 * Determine auth method based on MCP server type.
 * - remote (e.g. Atlassian) → opencode mcp auth (OAuth)
 * - local (e.g. BigQuery Toolbox) → gcloud auth application-default login
 */
async function getAuthMethod(serviceName: string): Promise<"opencode-oauth" | "gcloud-adc" | "unknown"> {
  try {
    const config = await readOpencodeConfig();
    const mcp = config.mcp as Record<string, { type?: string }> | undefined;
    if (!mcp?.[serviceName]) return "unknown";

    const serverType = mcp[serviceName].type;
    if (serverType === "remote") return "opencode-oauth";
    if (serverType === "local") return "gcloud-adc";
    return "unknown";
  } catch {
    return "unknown";
  }
}

function runCommand(command: string, args: string[], timeoutMs = 120_000): Promise<{ code: number; stdout: string; stderr: string }> {
  return new Promise((resolve) => {
    const child = spawn(command, args, {
      stdio: ["pipe", "pipe", "pipe"],
      env: { ...process.env },
    });

    let stdout = "";
    let stderr = "";

    child.stdout?.on("data", (d) => { stdout += d.toString(); });
    child.stderr?.on("data", (d) => { stderr += d.toString(); });

    const timeout = setTimeout(() => {
      child.kill();
      resolve({ code: -1, stdout, stderr: "timeout" });
    }, timeoutMs);

    child.on("close", (code) => {
      clearTimeout(timeout);
      resolve({ code: code ?? 1, stdout, stderr });
    });

    child.on("error", (err) => {
      clearTimeout(timeout);
      resolve({ code: -1, stdout, stderr: err.message });
    });
  });
}

const RESTART_MSG =
  "IMPORTANT: The current session needs to be restarted to load the MCP tools.\n" +
  'Tell the user to click the "..." menu in the Agent Client panel → "Restart agent", then retry their request.';

export const byoao_mcp_auth = tool({
  description:
    "Authenticate with an MCP service (e.g. Atlassian, BigQuery). " +
    "Use when an MCP tool call fails with auth errors (401, 403, unauthorized, token expired), " +
    "or when the user asks to connect/reconnect a service. " +
    "For Atlassian: uses OpenCode OAuth. For BigQuery: uses gcloud ADC.",
  args: {
    service: tool.schema
      .string()
      .describe(
        'Name of the MCP service to authenticate (e.g., "atlassian", "bigquery").',
      ),
  },
  async execute(args) {
    const serviceName = args.service.toLowerCase().trim();
    const method = await getAuthMethod(serviceName);

    if (method === "unknown") {
      return `✗ Unknown service "${serviceName}". Check your MCP configuration.`;
    }

    // BigQuery and other local/stdio servers using Google ADC
    if (method === "gcloud-adc") {
      const result = await runCommand("gcloud", ["auth", "application-default", "login"]);

      if (result.code === 0) {
        return `✓ Google Cloud authentication completed for "${serviceName}".\n${RESTART_MSG}`;
      } else if (result.stderr === "timeout") {
        return (
          `⏱ Authentication timed out for "${serviceName}".\n` +
          "The browser window may still be open — complete the login there, " +
          'then click "..." → "Restart agent".'
        );
      } else {
        return (
          `✗ Google Cloud authentication failed for "${serviceName}".\n` +
          `Detail: ${(result.stderr || result.stdout || "(no output)").trim()}\n\n` +
          "The user may need to run in terminal:\n" +
          "  gcloud auth application-default login"
        );
      }
    }

    // Atlassian and other remote OAuth servers
    const opencodeBin = findOpencodeBinary();
    const result = await runCommand(opencodeBin, ["mcp", "auth", serviceName]);

    if (result.code === 0) {
      return `✓ Successfully authenticated with "${serviceName}".\n${RESTART_MSG}`;
    } else if (result.stderr === "timeout") {
      return (
        `⏱ Authentication timed out for "${serviceName}".\n` +
        "The browser window may still be open — complete the login there, " +
        'then click "..." → "Restart agent".'
      );
    } else {
      return (
        `✗ Authentication failed for "${serviceName}" (exit code ${result.code}).\n` +
        `Detail: ${(result.stderr || result.stdout || "(no output)").trim()}\n\n` +
        "The user may need to:\n" +
        '1. Click "..." → "Restart agent" to retry\n' +
        "2. Or run in terminal: opencode mcp auth " + serviceName
      );
    }
  },
});
