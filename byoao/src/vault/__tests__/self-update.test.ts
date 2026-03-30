import { describe, it, expect, vi, beforeEach } from "vitest";
import { execSync } from "node:child_process";

vi.mock("node:child_process", async (importOriginal) => {
  const actual = await importOriginal<typeof import("node:child_process")>();
  return { ...actual, execSync: vi.fn() };
});

const mockedExecSync = vi.mocked(execSync);

describe("checkForCliUpdate", () => {
  beforeEach(() => {
    vi.resetModules();
    mockedExecSync.mockReset();
  });

  it("detects update when registry has newer version", async () => {
    mockedExecSync.mockReturnValue("9.9.9\n");
    const { checkForCliUpdate } = await import("../self-update.js");
    const result = await checkForCliUpdate();

    expect(result.updateAvailable).toBe(true);
    expect(result.latest).toBe("9.9.9");
    expect(mockedExecSync).toHaveBeenCalledWith(
      "npm view @jayjiang/byoao version",
      expect.objectContaining({ timeout: 5_000 }),
    );
  });

  it("returns no update when versions match", async () => {
    const { checkForCliUpdate } = await import("../self-update.js");
    // First call to discover the current version
    mockedExecSync.mockReturnValue("0.0.1\n");
    const probe = await checkForCliUpdate();
    // Now mock registry to return the same version as current
    mockedExecSync.mockReturnValue(probe.current + "\n");
    const result = await checkForCliUpdate();
    expect(result.updateAvailable).toBe(false);
  });

  it("returns no update when current is higher (e.g. local dev)", async () => {
    mockedExecSync.mockReturnValue("0.0.1\n");
    const { checkForCliUpdate } = await import("../self-update.js");
    const result = await checkForCliUpdate();

    expect(result.updateAvailable).toBe(false);
  });

  it("returns no update on timeout", async () => {
    mockedExecSync.mockImplementation(() => {
      throw new Error("ETIMEDOUT");
    });
    const { checkForCliUpdate } = await import("../self-update.js");
    const result = await checkForCliUpdate();

    expect(result.updateAvailable).toBe(false);
  });

  it("returns no update on network error", async () => {
    mockedExecSync.mockImplementation(() => {
      throw new Error("ENOTFOUND");
    });
    const { checkForCliUpdate } = await import("../self-update.js");
    const result = await checkForCliUpdate();

    expect(result.updateAvailable).toBe(false);
  });

  it("returns no update on invalid version output", async () => {
    mockedExecSync.mockReturnValue("not-a-version\n");
    const { checkForCliUpdate } = await import("../self-update.js");
    const result = await checkForCliUpdate();

    expect(result.updateAvailable).toBe(false);
  });
});

describe("selfUpdateCli", () => {
  beforeEach(() => {
    mockedExecSync.mockReset();
  });

  it("returns success when npm install succeeds", async () => {
    mockedExecSync.mockReturnValue("");
    const { selfUpdateCli } = await import("../self-update.js");
    const result = await selfUpdateCli("1.0.0");

    expect(result.success).toBe(true);
    expect(mockedExecSync).toHaveBeenCalledWith(
      "npm install -g @jayjiang/byoao@1.0.0",
      expect.anything(),
    );
  });

  it("returns permission error with sudo hint on EACCES", async () => {
    mockedExecSync.mockImplementation(() => {
      throw new Error("EACCES: permission denied");
    });
    const { selfUpdateCli } = await import("../self-update.js");
    const result = await selfUpdateCli("1.0.0");

    expect(result.success).toBe(false);
    expect(result.error).toContain("sudo");
    expect(result.error).toContain("npm install -g @jayjiang/byoao@1.0.0");
  });

  it("returns generic error with manual command on other failures", async () => {
    mockedExecSync.mockImplementation(() => {
      throw new Error("npm ERR! command not found");
    });
    const { selfUpdateCli } = await import("../self-update.js");
    const result = await selfUpdateCli("1.0.0");

    expect(result.success).toBe(false);
    expect(result.error).toContain("npm install -g @jayjiang/byoao@1.0.0");
    expect(result.error).toContain("command not found");
  });
});
