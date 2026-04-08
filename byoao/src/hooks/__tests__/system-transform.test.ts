import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { systemTransformHook } from "../system-transform.js";
import * as vaultDetect from "../../vault/vault-detect.js";
import * as opencodeConfig from "../../vault/opencode-config.js";

/** Minimal input matching OpenCode's system.transform hook (model is required). */
const transformInput = { model: null as unknown };

describe("systemTransformHook", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("injects MCP auth guidance when MCP servers are configured", async () => {
    vi.spyOn(vaultDetect, "detectVaultContext").mockReturnValue("/tmp/test-vault");
    vi.spyOn(opencodeConfig, "readOpencodeConfig").mockResolvedValue({
      mcp: {
        atlassian: { command: "atlassian-mcp" },
        bigquery: { command: "bigquery-mcp" },
      },
    });

    const output = { system: [] as string[] };
    await systemTransformHook(transformInput, output);

    const injected = output.system.join("\n");
    expect(injected).toContain("MCP Services — IMPORTANT");
    expect(injected).toContain("atlassian");
    expect(injected).toContain("bigquery");
    expect(injected).toContain("byoao_mcp_auth");
    expect(injected).toContain("STRICT Rules");
  });

  it("does not inject MCP guidance when no MCP servers are configured", async () => {
    vi.spyOn(vaultDetect, "detectVaultContext").mockReturnValue("/tmp/test-vault");
    vi.spyOn(opencodeConfig, "readOpencodeConfig").mockResolvedValue({});

    const output = { system: [] as string[] };
    await systemTransformHook(transformInput, output);

    expect(output.system).toEqual([]);
  });

  it("still injects MCP auth guidance even when no vault is detected", async () => {
    vi.spyOn(vaultDetect, "detectVaultContext").mockReturnValue(null);
    vi.spyOn(opencodeConfig, "readOpencodeConfig").mockResolvedValue({
      mcp: { atlassian: { command: "test" } },
    });

    const output = { system: [] as string[] };
    await systemTransformHook(transformInput, output);

    const injected = output.system.join("\n");
    expect(injected).toContain("MCP Services — IMPORTANT");
    expect(injected).toContain("atlassian");
  });

  it("does not inject AGENT.md content", async () => {
    vi.spyOn(vaultDetect, "detectVaultContext").mockReturnValue("/tmp/test-vault");
    vi.spyOn(opencodeConfig, "readOpencodeConfig").mockResolvedValue({
      mcp: { atlassian: { command: "test" } },
    });

    const output = { system: [] as string[] };
    await systemTransformHook(transformInput, output);

    const injected = output.system.join("\n");
    expect(injected).not.toContain("BYOAO Vault Context");
    expect(injected).not.toContain("from AGENT.md");
  });

  it("does not inject navigation strategy", async () => {
    vi.spyOn(vaultDetect, "detectVaultContext").mockReturnValue("/tmp/test-vault");
    vi.spyOn(opencodeConfig, "readOpencodeConfig").mockResolvedValue({
      mcp: { atlassian: { command: "test" } },
    });

    const output = { system: [] as string[] };
    await systemTransformHook(transformInput, output);

    const injected = output.system.join("\n");
    expect(injected).not.toContain("BYOAO Navigation Strategy");
    expect(injected).not.toContain("Progressive Disclosure");
    expect(injected).not.toContain("obsidian properties");
    expect(injected).not.toContain("ALWAYS use Obsidian CLI first");
  });
});
