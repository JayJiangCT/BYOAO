import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";

let tmpDir: string;
let logModule: typeof import("../logger.js");

beforeEach(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "byoao-logger-"));
  vi.stubEnv("BYOAO_LOG_DIR", tmpDir);
  vi.resetModules();
  logModule = await import("../logger.js");
});

afterEach(async () => {
  vi.unstubAllEnvs();
  await fs.rm(tmpDir, { recursive: true, force: true });
});

describe("log", () => {
  it("writes an entry and reads it back", async () => {
    await logModule.log("error", "tool:vault-status", "something broke", {
      error: new Error("boom"),
      context: { vault: "/tmp/test" },
    });

    const entries = await logModule.readLogs();
    expect(entries).toHaveLength(1);
    expect(entries[0].level).toBe("error");
    expect(entries[0].source).toBe("tool:vault-status");
    expect(entries[0].message).toBe("something broke");
    expect(entries[0].stack).toContain("boom");
    expect(entries[0].context).toEqual({ vault: "/tmp/test" });
    expect(entries[0].ts).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it("produces valid JSONL", async () => {
    await logModule.log("error", "tool:a", "first");
    await logModule.log("warn", "hook:b", "second");

    const raw = await fs.readFile(path.join(tmpDir, "error.log"), "utf-8");
    const lines = raw.trim().split("\n");
    expect(lines).toHaveLength(2);
    for (const line of lines) {
      expect(() => JSON.parse(line)).not.toThrow();
    }
  });

  it("does not throw when logger itself fails", async () => {
    // Make log dir read-only so appendFile fails
    await fs.chmod(tmpDir, 0o444);
    await expect(
      logModule.log("error", "test", "should not throw"),
    ).resolves.toBeUndefined();
    // Restore permissions for cleanup
    await fs.chmod(tmpDir, 0o755);
  });
});

describe("readLogs", () => {
  it("returns the most recent N entries", async () => {
    for (let i = 0; i < 10; i++) {
      await logModule.log("error", "test", `msg-${i}`);
    }
    const entries = await logModule.readLogs(3);
    expect(entries).toHaveLength(3);
    expect(entries[0].message).toBe("msg-7");
    expect(entries[2].message).toBe("msg-9");
  });

  it("returns empty array when no log file exists", async () => {
    const entries = await logModule.readLogs();
    expect(entries).toEqual([]);
  });
});

describe("clearLogs", () => {
  it("removes all log entries", async () => {
    await logModule.log("error", "test", "hello");
    await logModule.clearLogs();
    const entries = await logModule.readLogs();
    expect(entries).toEqual([]);
  });
});

describe("exportLogs", () => {
  it("returns raw log content as string", async () => {
    await logModule.log("error", "test", "export-me");
    const exported = await logModule.exportLogs();
    expect(exported).toContain("export-me");
    expect(exported).toContain('"level":"error"');
  });

  it("returns empty string when no logs exist", async () => {
    const exported = await logModule.exportLogs();
    expect(exported).toBe("");
  });
});

describe("rotation", () => {
  it("rotates when file exceeds max size", async () => {
    // Write enough data to exceed 512 KB
    const bigMessage = "x".repeat(1024);
    for (let i = 0; i < 520; i++) {
      await logModule.log("error", "test", bigMessage);
    }

    const rotatedPath = path.join(tmpDir, "error.log.1");
    const rotatedExists = await fs
      .access(rotatedPath)
      .then(() => true)
      .catch(() => false);
    expect(rotatedExists).toBe(true);

    // Current log file should be smaller than max
    const currentStat = await fs.stat(path.join(tmpDir, "error.log"));
    expect(currentStat.size).toBeLessThan(512 * 1024);
  });
});

describe("concurrent writes", () => {
  it("produces valid JSONL under concurrent writes", async () => {
    const promises = Array.from({ length: 20 }, (_, i) =>
      logModule.log("error", "test", `concurrent-${i}`),
    );
    await Promise.all(promises);

    const raw = await fs.readFile(path.join(tmpDir, "error.log"), "utf-8");
    const lines = raw.trim().split("\n");
    expect(lines).toHaveLength(20);
    for (const line of lines) {
      expect(() => JSON.parse(line)).not.toThrow();
    }
  });
});

describe("sanitizeArgs", () => {
  it("keeps safe fields and strips sensitive ones", () => {
    const result = logModule.sanitizeArgs({
      vaultPath: "/tmp/vault",
      name: "Alice",
      query: "secret search",
      content: "note body text",
      definition: "glossary def",
      provider: "gemini",
    });
    expect(result).toEqual({
      vaultPath: "/tmp/vault",
      name: "Alice",
      provider: "gemini",
    });
  });

  it("returns empty object for non-object input", () => {
    expect(logModule.sanitizeArgs(null)).toEqual({});
    expect(logModule.sanitizeArgs("string")).toEqual({});
    expect(logModule.sanitizeArgs(42)).toEqual({});
  });
});

describe("sanitizeStack", () => {
  it("keeps stack frames and strips content lines", () => {
    const stack = [
      "YAMLException: bad indentation",
      "    secret-project: classified",
      "    ^",
      "    at Parser.parse (gray-matter/index.js:10:5)",
      "    at Object.execute (src/tools/foo.ts:20:3)",
    ].join("\n");
    const result = logModule.sanitizeStack(stack);
    expect(result).toContain("YAMLException: bad indentation");
    expect(result).toContain("at Parser.parse");
    expect(result).not.toContain("secret-project");
    expect(result).not.toContain("    ^");
  });

  it("returns undefined for undefined input", () => {
    expect(logModule.sanitizeStack(undefined)).toBeUndefined();
  });
});
