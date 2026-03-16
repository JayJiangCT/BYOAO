import { describe, it, expect } from "vitest";
import { VaultConfigSchema, PresetConfigSchema } from "../plugin-config.js";

describe("VaultConfigSchema", () => {
  it("validates minimal config with defaults", () => {
    const result = VaultConfigSchema.parse({
      teamName: "MyTeam",
      vaultPath: "/tmp/vault",
    });
    expect(result.teamName).toBe("MyTeam");
    expect(result.members).toEqual([]);
    expect(result.projects).toEqual([]);
    expect(result.glossaryEntries).toEqual([]);
    expect(result.preset).toBe("pm-tpm");
  });

  it("rejects missing teamName", () => {
    expect(() =>
      VaultConfigSchema.parse({ vaultPath: "/tmp" })
    ).toThrow();
  });

  it("rejects empty teamName", () => {
    expect(() =>
      VaultConfigSchema.parse({ teamName: "", vaultPath: "/tmp" })
    ).toThrow();
  });

  it("rejects missing vaultPath", () => {
    expect(() =>
      VaultConfigSchema.parse({ teamName: "Team" })
    ).toThrow();
  });

  it("validates full config", () => {
    const result = VaultConfigSchema.parse({
      teamName: "Alpha",
      vaultPath: "/v",
      members: [{ name: "A", role: "Eng" }],
      projects: [{ name: "P" }],
      glossaryEntries: [{ term: "T", definition: "D" }],
      jiraHost: "jira.example.com",
      jiraProject: "PROJ",
      preset: "pm-tpm",
    });
    expect(result.members).toHaveLength(1);
    expect(result.projects[0].description).toBe("");
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
});
