import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../obsidian-cli.js", () => ({
  isObsidianCliAvailable: vi.fn(),
  execObsidianCmd: vi.fn(),
}));

import { getGraphHealth } from "../graph-health.js";
import { isObsidianCliAvailable, execObsidianCmd } from "../obsidian-cli.js";

const mockIsAvailable = vi.mocked(isObsidianCliAvailable);
const mockExecCmd = vi.mocked(execObsidianCmd);

beforeEach(() => {
  vi.resetAllMocks();
});

describe("getGraphHealth", () => {
  it("returns runtime_unavailable when CLI is not available", async () => {
    mockIsAvailable.mockReturnValue(false);

    const result = await getGraphHealth({ vaultPath: "/vault" });
    expect(result.status).toBe("runtime_unavailable");
    expect(result.mode).toBe("graph-health");
    expect(result.diagnostics).toContain("Obsidian CLI not available");
  });

  it("runs all three checks by default", async () => {
    mockIsAvailable.mockReturnValue(true);
    mockExecCmd.mockReturnValue({ success: true, output: "" });

    await getGraphHealth({ vaultPath: "/vault" });
    expect(mockExecCmd).toHaveBeenCalledTimes(3);
    expect(mockExecCmd).toHaveBeenCalledWith(["orphans", "--vault", "/vault"]);
    expect(mockExecCmd).toHaveBeenCalledWith(["unresolved", "--vault", "/vault"]);
    expect(mockExecCmd).toHaveBeenCalledWith(["deadends", "--vault", "/vault"]);
  });

  it("runs only the specified check", async () => {
    mockIsAvailable.mockReturnValue(true);
    mockExecCmd.mockReturnValue({ success: true, output: "" });

    await getGraphHealth({ vaultPath: "/vault", check: "orphans" });
    expect(mockExecCmd).toHaveBeenCalledTimes(1);
    expect(mockExecCmd).toHaveBeenCalledWith(["orphans", "--vault", "/vault"]);
  });

  it("returns no_results when vault is healthy", async () => {
    mockIsAvailable.mockReturnValue(true);
    mockExecCmd.mockReturnValue({ success: true, output: "" });

    const result = await getGraphHealth({ vaultPath: "/vault" });
    expect(result.status).toBe("no_results");
    expect(result.results).toHaveLength(0);
    expect(result.summary).toContain("No issues");
  });

  it("parses orphan results into structured items", async () => {
    mockIsAvailable.mockReturnValue(true);
    mockExecCmd.mockImplementation((args) => {
      if (args[0] === "orphans") {
        return {
          success: true,
          output: "Projects/Abandoned.md\nInbox/Random.md",
        };
      }
      return { success: true, output: "" };
    });

    const result = await getGraphHealth({ vaultPath: "/vault" });
    expect(result.status).toBe("ok");
    const orphans = result.results.filter(
      (r) => r.metadata?.check === "orphans"
    );
    expect(orphans).toHaveLength(2);
    expect(orphans[0].title).toBe("Abandoned");
    expect(orphans[0].path).toBe("Projects/Abandoned.md");
  });

  it("parses unresolved links into structured items", async () => {
    mockIsAvailable.mockReturnValue(true);
    mockExecCmd.mockImplementation((args) => {
      if (args[0] === "unresolved") {
        return { success: true, output: "Missing Note\nAnother Missing" };
      }
      return { success: true, output: "" };
    });

    const result = await getGraphHealth({ vaultPath: "/vault" });
    const unresolved = result.results.filter(
      (r) => r.metadata?.check === "unresolved"
    );
    expect(unresolved).toHaveLength(2);
    expect(unresolved[0].title).toBe("Missing Note");
  });

  it("continues when one check fails but others succeed", async () => {
    mockIsAvailable.mockReturnValue(true);
    mockExecCmd.mockImplementation((args) => {
      if (args[0] === "orphans") {
        return { success: false, output: "", error: "timeout" };
      }
      return { success: true, output: "Inbox/note.md" };
    });

    const result = await getGraphHealth({ vaultPath: "/vault" });
    // Should still return results from successful checks
    expect(result.results.length).toBeGreaterThan(0);
    expect(result.diagnostics).toContain("orphans check failed: timeout");
  });

  it("respects the limit parameter", async () => {
    mockIsAvailable.mockReturnValue(true);
    const lines = Array.from({ length: 30 }, (_, i) => `Notes/note${i}.md`);
    mockExecCmd.mockReturnValue({ success: true, output: lines.join("\n") });

    const result = await getGraphHealth({
      vaultPath: "/vault",
      check: "orphans",
      limit: 5,
    });
    expect(result.results).toHaveLength(5);
    expect(result.truncated).toBe(true);
  });
});
