import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { systemTransformHook } from "../system-transform.js";
import * as vaultDetect from "../../vault/vault-detect.js";
import * as opencodeConfig from "../../vault/opencode-config.js";

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

  it("injects conditional Scope: vault-internal CLI vs outside-vault tools", async () => {
    const output = { system: [] as string[] };
    await systemTransformHook(transformInput, output);

    const injected = output.system.join("\n");

    expect(injected).toContain("### Scope");
    expect(injected).toContain("Inside the vault");
    expect(injected).toContain("/tmp/BYOAO-TestVault/");
    expect(injected).toContain("byoao_search_vault");
    expect(injected).toContain("byoao_note_read");
    expect(injected).toContain("byoao_graph_health");
    expect(injected).toContain("Outside the vault");
    expect(injected).toContain("freely");
    expect(injected).not.toContain("Never use grep");
  });

  it("skips navigation strategy when no vault is detected", async () => {
    vi.spyOn(vaultDetect, "detectVaultContext").mockReturnValue(null);

    const output = { system: [] as string[] };
    await systemTransformHook(transformInput, output);

    const injected = output.system.join("\n");
    expect(injected).not.toContain("BYOAO Navigation Strategy");
  });
});
