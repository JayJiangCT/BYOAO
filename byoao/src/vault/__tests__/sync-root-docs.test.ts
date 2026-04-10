import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "fs-extra";
import path from "node:path";
import os from "node:os";
import { syncRootDocsFromTemplates } from "../sync-root-docs.js";

let tmpDir: string;

beforeEach(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "byoao-sync-docs-"));
});

afterEach(async () => {
  await fs.remove(tmpDir);
});

describe("syncRootDocsFromTemplates", () => {
  it("inserts Knowledge Retrieval section before Available Skills when missing", async () => {
    const vault = path.join(tmpDir, "vault");
    await fs.ensureDir(vault);
    const agents = `# AI Agent Guide

## Operating Rules
Use CLI.

## Available Skills
- /cook
`;
    await fs.writeFile(path.join(vault, "AGENTS.md"), agents, "utf-8");
    await fs.writeFile(
      path.join(vault, "SCHEMA.md"),
      "# SCHEMA\n\n## Custom Fields\n\nNone.\n",
      "utf-8",
    );

    const result = await syncRootDocsFromTemplates(vault);
    expect(result.agents).toBe("updated");

    const out = await fs.readFile(path.join(vault, "AGENTS.md"), "utf-8");
    expect(out).toContain("## Knowledge Retrieval (Q&A)");
    expect(out.indexOf("## Knowledge Retrieval")).toBeLessThan(out.indexOf("## Available Skills"));
  });

  it("does not duplicate AGENTS section when already present", async () => {
    const vault = path.join(tmpDir, "vault2");
    await fs.ensureDir(vault);
    const agents = `## Knowledge Retrieval (Q&A)\n\nAlready here.\n\n## Available Skills\n`;
    await fs.writeFile(path.join(vault, "AGENTS.md"), agents, "utf-8");
    await fs.writeFile(path.join(vault, "SCHEMA.md"), "# S\n", "utf-8");

    const result = await syncRootDocsFromTemplates(vault);
    expect(result.agents).toBe("unchanged");
  });

  it("appends SCHEMA Retrieval section when missing", async () => {
    const vault = path.join(tmpDir, "vault3");
    await fs.ensureDir(vault);
    await fs.writeFile(path.join(vault, "AGENTS.md"), "## Available Skills\n", "utf-8");
    await fs.writeFile(path.join(vault, "SCHEMA.md"), "# SCHEMA\n\n## Custom Fields\n\nx\n", "utf-8");

    const result = await syncRootDocsFromTemplates(vault);
    expect(result.schema).toBe("updated");
    const out = await fs.readFile(path.join(vault, "SCHEMA.md"), "utf-8");
    expect(out).toContain("## Retrieval");
  });

  it("dryRun does not write AGENTS", async () => {
    const vault = path.join(tmpDir, "vault4");
    await fs.ensureDir(vault);
    const original = "## Operating Rules\nx\n\n## Available Skills\n";
    await fs.writeFile(path.join(vault, "AGENTS.md"), original, "utf-8");
    await fs.writeFile(path.join(vault, "SCHEMA.md"), "# S\n", "utf-8");

    await syncRootDocsFromTemplates(vault, { dryRun: true });
    const out = await fs.readFile(path.join(vault, "AGENTS.md"), "utf-8");
    expect(out).toBe(original);
  });
});
