import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { systemTransformHook } from "../system-transform.js";
import * as vaultDetect from "../../vault/vault-detect.js";
import * as opencodeConfig from "../../vault/opencode-config.js";
import * as obsidianCli from "../../vault/obsidian-cli.js";

/** Minimal input matching OpenCode's system.transform hook (model is required). */
const transformInput = { model: null as unknown };

describe("systemTransformHook", () => {
  beforeEach(() => {
    vi.spyOn(vaultDetect, "detectVaultContext").mockReturnValue(
      "/tmp/BYOAO-TestVault"
    );
    vi.spyOn(opencodeConfig, "readOpencodeConfig").mockResolvedValue({});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("injects CLI-first strategy when Obsidian CLI is available", async () => {
    vi.spyOn(obsidianCli, "isObsidianCliAvailable").mockReturnValue(true);

    const output = { system: [] as string[] };
    await systemTransformHook(transformInput, output);

    const injected = output.system.join("\n");

    expect(injected).toContain("### Scope");
    expect(injected).toContain("ALWAYS use Obsidian CLI first");
    expect(injected).toContain("Inside the vault");
    expect(injected).toContain("/tmp/BYOAO-TestVault/");
    expect(injected).toContain("byoao_search_vault");
    expect(injected).toContain("obsidian properties sort=count counts");
    expect(injected).toContain("obsidian backlinks");
    expect(injected).toContain("Only fall back to find/grep");
    expect(injected).toContain("Outside the vault");
  });

  it("injects fallback strategy when Obsidian CLI is not available", async () => {
    vi.spyOn(obsidianCli, "isObsidianCliAvailable").mockReturnValue(false);

    const output = { system: [] as string[] };
    await systemTransformHook(transformInput, output);

    const injected = output.system.join("\n");

    expect(injected).toContain("### Scope");
    expect(injected).toContain("Obsidian CLI is NOT available");
    expect(injected).toContain("find, grep, read");
    expect(injected).toContain("byoao_search_vault");
    expect(injected).toContain("byoao_note_read");
    expect(injected).toContain("byoao_graph_health");
    expect(injected).not.toContain("ALWAYS use Obsidian CLI first");
    expect(injected).not.toContain("obsidian properties sort=count counts");
  });

  it("skips navigation strategy when no vault is detected", async () => {
    vi.spyOn(vaultDetect, "detectVaultContext").mockReturnValue(null);

    const output = { system: [] as string[] };
    await systemTransformHook(transformInput, output);

    const injected = output.system.join("\n");
    expect(injected).not.toContain("BYOAO Navigation Strategy");
  });
});
