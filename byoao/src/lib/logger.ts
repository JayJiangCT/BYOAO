import { join } from "node:path";
import { homedir } from "node:os";
import {
  appendFile,
  stat,
  rename,
  mkdir,
  readFile,
  unlink,
} from "node:fs/promises";

// Allow override via env for testing
const LOG_DIR = process.env.BYOAO_LOG_DIR || join(homedir(), ".byoao", "logs");
const LOG_FILE = join(LOG_DIR, "error.log");
const MAX_LOG_SIZE = 512 * 1024; // 512 KB
const ROTATED_FILE = join(LOG_DIR, "error.log.1");

export type LogLevel = "error" | "warn";

export interface LogEntry {
  ts: string;
  level: LogLevel;
  source: string;
  message: string;
  stack?: string;
  context?: Record<string, unknown>;
}

/** Fields safe to include in logs (paths and identifiers, not content). */
const SAFE_FIELDS = new Set([
  "vaultPath",
  "vault",
  "path",
  "filePath",
  "configPath",
  "name",
  "role",
  "category",
  "preset",
  "provider",
]);

/** Filter tool args to only include safe fields. */
export function sanitizeArgs(args: unknown): Record<string, unknown> {
  if (!args || typeof args !== "object") return {};
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(args as Record<string, unknown>)) {
    if (SAFE_FIELDS.has(key) && typeof value === "string") {
      result[key] = value;
    }
  }
  return result;
}

/** Strip content preview lines from stack traces, keep only frames. */
export function sanitizeStack(stack?: string): string | undefined {
  if (!stack) return undefined;
  const lines = stack.split("\n");
  return lines
    .filter((line, i) => i === 0 || /^\s+at\s/.test(line))
    .join("\n");
}

let dirEnsured = false;

async function ensureLogDir(): Promise<void> {
  if (dirEnsured) return;
  await mkdir(LOG_DIR, { recursive: true });
  dirEnsured = true;
}

async function rotateIfNeeded(): Promise<void> {
  try {
    const s = await stat(LOG_FILE);
    if (s.size >= MAX_LOG_SIZE) {
      await rename(LOG_FILE, ROTATED_FILE);
    }
  } catch {
    // File does not exist yet — no rotation needed
  }
}

// Promise chain serializes all writes to prevent JSONL corruption
let writeChain = Promise.resolve();

/** Write a single log entry. */
export async function log(
  level: LogLevel,
  source: string,
  message: string,
  options?: { error?: Error; context?: Record<string, unknown> },
): Promise<void> {
  writeChain = writeChain.then(async () => {
    try {
      await ensureLogDir();
      await rotateIfNeeded();
      const entry: LogEntry = {
        ts: new Date().toISOString(),
        level,
        source,
        message,
        ...(options?.error?.stack && {
          stack: sanitizeStack(options.error.stack),
        }),
        ...(options?.context && { context: options.context }),
      };
      await appendFile(LOG_FILE, JSON.stringify(entry) + "\n");
    } catch {
      // Logger failure must never affect the main flow
    }
  });
  return writeChain;
}

/** Read the most recent N log entries (default 50). */
export async function readLogs(limit = 50): Promise<LogEntry[]> {
  try {
    const content = await readFile(LOG_FILE, "utf-8");
    const lines = content.trim().split("\n").filter(Boolean);
    const entries = lines.map((line) => JSON.parse(line) as LogEntry);
    return entries.slice(-limit);
  } catch {
    return [];
  }
}

/** Return raw log file content as a string. */
export async function exportLogs(): Promise<string> {
  try {
    return await readFile(LOG_FILE, "utf-8");
  } catch {
    return "";
  }
}

/** Clear all log files. */
export async function clearLogs(): Promise<void> {
  try {
    await unlink(LOG_FILE);
  } catch {
    // File may not exist
  }
  try {
    await unlink(ROTATED_FILE);
  } catch {
    // File may not exist
  }
  dirEnsured = false;
}
