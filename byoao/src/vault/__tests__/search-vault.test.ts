import { describe, it, expect, vi, beforeEach } from "vitest";
import type { ObsidianCliResult } from "../obsidian-cli.js";
import type { RetrievalResult } from "../retrieval-types.js";

// Mock obsidian-cli before importing the module under test
vi.mock("../obsidian-cli.js", () => ({
  isObsidianCliAvailable: vi.fn(),
  execObsidianCmd: vi.fn(),
}));

import { searchVault } from "../search-vault.js";
import { isObsidianCliAvailable, execObsidianCmd } from "../obsidian-cli.js";

const mockIsAvailable = vi.mocked(isObsidianCliAvailable);
const mockExecCmd = vi.mocked(execObsidianCmd);

beforeEach(() => {
  vi.resetAllMocks();
});

describe("searchVault", () => {
  it("returns runtime_unavailable when CLI is not available", async () => {
    mockIsAvailable.mockReturnValue(false);

    const result = await searchVault({ vaultPath: "/vault", query: "test" });
    expect(result.status).toBe("runtime_unavailable");
    expect(result.mode).toBe("search:context");
    expect(result.fallback).toBe("none");
    expect(result.diagnostics).toContain("Obsidian CLI not available");
  });

  it("returns runtime_unavailable when CLI command fails", async () => {
    mockIsAvailable.mockReturnValue(true);
    mockExecCmd.mockReturnValue({
      success: false,
      output: "",
      error: "Vault not found",
    });

    const result = await searchVault({ vaultPath: "/vault", query: "test" });
    expect(result.status).toBe("runtime_unavailable");
    expect(result.diagnostics[0]).toContain("Vault not found");
  });

  it("returns no_results when CLI returns empty output", async () => {
    mockIsAvailable.mockReturnValue(true);
    mockExecCmd.mockReturnValue({ success: true, output: "" });

    const result = await searchVault({ vaultPath: "/vault", query: "test" });
    expect(result.status).toBe("no_results");
    expect(result.results).toHaveLength(0);
  });

  it("parses CLI output into structured results", async () => {
    mockIsAvailable.mockReturnValue(true);
    mockExecCmd.mockReturnValue({
      success: true,
      output: [
        "Projects/Refund Automation.md:Owner handoff for refund automation workflow",
        "Daily/2026-03-20.md:Discussed refund automation timeline with team",
      ].join("\n"),
    });

    const result = await searchVault({ vaultPath: "/vault", query: "refund" });
    expect(result.status).toBe("ok");
    expect(result.results).toHaveLength(2);
    expect(result.results[0].title).toBe("Refund Automation");
    expect(result.results[0].path).toBe("Projects/Refund Automation.md");
    expect(result.results[0].file).toBe("Refund Automation");
    expect(result.results[0].snippet).toContain("refund automation");
  });

  it("respects the limit parameter", async () => {
    mockIsAvailable.mockReturnValue(true);
    const lines = Array.from({ length: 30 }, (_, i) =>
      `Notes/note${i}.md:content line ${i}`
    );
    mockExecCmd.mockReturnValue({ success: true, output: lines.join("\n") });

    const result = await searchVault({
      vaultPath: "/vault",
      query: "content",
      limit: 5,
    });
    expect(result.results).toHaveLength(5);
    expect(result.truncated).toBe(true);
    expect(result.totalMatches).toBe(30);
  });

  it("truncates snippets to MAX_SNIPPET_LENGTH", async () => {
    mockIsAvailable.mockReturnValue(true);
    const longLine = "a".repeat(500);
    mockExecCmd.mockReturnValue({
      success: true,
      output: `Notes/long.md:${longLine}`,
    });

    const result = await searchVault({ vaultPath: "/vault", query: "a" });
    expect(result.results[0].snippet!.length).toBeLessThanOrEqual(240);
  });

  it("passes vault path and query to CLI correctly", async () => {
    mockIsAvailable.mockReturnValue(true);
    mockExecCmd.mockReturnValue({ success: true, output: "" });

    await searchVault({ vaultPath: "/my/vault", query: "hello world" });
    expect(mockExecCmd).toHaveBeenCalledWith([
      "search:context",
      "--vault",
      "/my/vault",
      "hello world",
    ]);
  });
});
