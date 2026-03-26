import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../obsidian-cli.js", () => ({
  isObsidianCliAvailable: vi.fn(),
  execObsidianCmd: vi.fn(),
}));

import { readNote } from "../note-read.js";
import { isObsidianCliAvailable, execObsidianCmd } from "../obsidian-cli.js";

const mockIsAvailable = vi.mocked(isObsidianCliAvailable);
const mockExecCmd = vi.mocked(execObsidianCmd);

beforeEach(() => {
  vi.resetAllMocks();
});

describe("readNote", () => {
  it("returns runtime_unavailable when CLI is not available", async () => {
    mockIsAvailable.mockReturnValue(false);

    const result = await readNote({ vaultPath: "/vault", file: "MyNote" });
    expect(result.status).toBe("runtime_unavailable");
    expect(result.mode).toBe("read");
    expect(result.diagnostics).toContain("Obsidian CLI not available");
  });

  it("returns runtime_unavailable when CLI command fails", async () => {
    mockIsAvailable.mockReturnValue(true);
    mockExecCmd.mockReturnValue({
      success: false,
      output: "",
      error: "Note not found",
    });

    const result = await readNote({ vaultPath: "/vault", file: "Missing" });
    expect(result.status).toBe("runtime_unavailable");
    expect(result.diagnostics[0]).toContain("Note not found");
  });

  it("returns note content as a single result item", async () => {
    mockIsAvailable.mockReturnValue(true);
    mockExecCmd.mockReturnValue({
      success: true,
      output: "---\ntype: project\ntags: [active]\n---\n\n# Refund Automation\n\nProject details here.",
    });

    const result = await readNote({ vaultPath: "/vault", file: "Refund Automation" });
    expect(result.status).toBe("ok");
    expect(result.results).toHaveLength(1);
    expect(result.results[0].title).toBe("Refund Automation");
    expect(result.results[0].file).toBe("Refund Automation");
    expect(result.results[0].snippet).toContain("Project details here");
  });

  it("returns no_results when CLI returns empty output", async () => {
    mockIsAvailable.mockReturnValue(true);
    mockExecCmd.mockReturnValue({ success: true, output: "" });

    const result = await readNote({ vaultPath: "/vault", file: "Empty" });
    expect(result.status).toBe("no_results");
    expect(result.results).toHaveLength(0);
  });

  it("passes vault path and file to CLI correctly", async () => {
    mockIsAvailable.mockReturnValue(true);
    mockExecCmd.mockReturnValue({ success: true, output: "content" });

    await readNote({ vaultPath: "/my/vault", file: "My Note" });
    expect(mockExecCmd).toHaveBeenCalledWith([
      "read",
      "--vault",
      "/my/vault",
      "My Note",
    ]);
  });

  it("truncates snippet for very long notes", async () => {
    mockIsAvailable.mockReturnValue(true);
    const longContent = "a".repeat(500);
    mockExecCmd.mockReturnValue({ success: true, output: longContent });

    const result = await readNote({ vaultPath: "/vault", file: "Long" });
    expect(result.results[0].snippet!.length).toBeLessThanOrEqual(240);
  });
});
