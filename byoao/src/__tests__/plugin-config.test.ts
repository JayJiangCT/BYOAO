import { describe, it, expect } from "vitest";
import { VaultConfigSchema, PresetConfigSchema } from "../plugin-config.js";

describe("VaultConfigSchema", () => {
  it("validates minimal config with defaults", () => {
    const result = VaultConfigSchema.parse({
      kbName: "My KB",
      vaultPath: "/tmp/vault",
    });
    expect(result.kbName).toBe("My KB");
    expect(result.ownerName).toBe("");
    expect(result.preset).toBe("minimal");
    expect(result.wikiDomain).toBe("");
    expect(result.compilationMode).toBe("review");
  });

  it("rejects missing kbName", () => {
    expect(() =>
      VaultConfigSchema.parse({ vaultPath: "/tmp" })
    ).toThrow();
  });

  it("rejects empty kbName", () => {
    expect(() =>
      VaultConfigSchema.parse({ kbName: "", vaultPath: "/tmp" })
    ).toThrow();
  });

  it("rejects missing vaultPath", () => {
    expect(() =>
      VaultConfigSchema.parse({ kbName: "KB" })
    ).toThrow();
  });

  it("validates full config", () => {
    const result = VaultConfigSchema.parse({
      kbName: "Alpha KB",
      ownerName: "Alice",
      vaultPath: "/v",
      preset: "pm-tpm",
      wikiDomain: "AI/ML research",
      compilationMode: "auto",
    });
    expect(result.ownerName).toBe("Alice");
    expect(result.preset).toBe("pm-tpm");
    expect(result.wikiDomain).toBe("AI/ML research");
    expect(result.compilationMode).toBe("auto");
  });
});

describe("PresetConfigSchema", () => {
  it("validates minimal preset with defaults", () => {
    const result = PresetConfigSchema.parse({
      name: "test",
      displayName: "Test Preset",
      description: "A test",
      agentDescription: "Test agent",
    });
    expect(result.directories).toEqual([]);
    expect(result.mcpServers).toEqual({});
    expect(result.templates).toEqual([]);
    expect(result.frontmatterExtras).toEqual({});
  });

  it("validates mcpServers field", () => {
    const result = PresetConfigSchema.parse({
      name: "test",
      displayName: "Test",
      description: "d",
      agentDescription: "a",
      mcpServers: {
        atlassian: {
          type: "remote",
          url: "https://mcp.atlassian.com/v1/sse",
        },
      },
    });
    expect(result.mcpServers.atlassian.type).toBe("remote");
  });

  it("rejects invalid mcpServers url", () => {
    expect(() =>
      PresetConfigSchema.parse({
        name: "test",
        displayName: "Test",
        description: "d",
        agentDescription: "a",
        mcpServers: {
          bad: { type: "remote", url: "not-a-url" },
        },
      })
    ).toThrow();
  });

  it("rejects missing required fields", () => {
    expect(() =>
      PresetConfigSchema.parse({ name: "test" })
    ).toThrow();
  });

  it("validates obsidianPlugins field", () => {
    const result = PresetConfigSchema.parse({
      name: "test",
      displayName: "Test",
      description: "d",
      agentDescription: "a",
      obsidianPlugins: {
        "obsidian-agent-client": {
          repo: "RAIT-09/obsidian-agent-client",
          version: "latest",
        },
      },
    });
    expect(result.obsidianPlugins["obsidian-agent-client"].repo).toBe(
      "RAIT-09/obsidian-agent-client"
    );
    expect(result.obsidianPlugins["obsidian-agent-client"].version).toBe("latest");
  });

  it("defaults obsidianPlugins to empty object", () => {
    const result = PresetConfigSchema.parse({
      name: "test",
      displayName: "Test",
      description: "d",
      agentDescription: "a",
    });
    expect(result.obsidianPlugins).toEqual({});
  });

  it("defaults version to latest", () => {
    const result = PresetConfigSchema.parse({
      name: "test",
      displayName: "Test",
      description: "d",
      agentDescription: "a",
      obsidianPlugins: {
        "my-plugin": { repo: "owner/repo" },
      },
    });
    expect(result.obsidianPlugins["my-plugin"].version).toBe("latest");
  });

  it("rejects invalid repo format in obsidianPlugins", () => {
    expect(() =>
      PresetConfigSchema.parse({
        name: "test",
        displayName: "Test",
        description: "d",
        agentDescription: "a",
        obsidianPlugins: {
          "bad": { repo: "not-a-valid-repo" },
        },
      })
    ).toThrow();
  });
});
