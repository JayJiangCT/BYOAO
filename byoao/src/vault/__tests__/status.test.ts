import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "fs-extra";
import path from "node:path";
import os from "node:os";
import { getVaultStatus, formatVaultStatus, type VaultStatus } from "../status.js";

let tmpDir: string;

beforeEach(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "byoao-status-"));
});

afterEach(async () => {
  await fs.remove(tmpDir);
});

describe("getVaultStatus", () => {
  it("returns exists: false for non-existent path", async () => {
    const status = await getVaultStatus("/nonexistent/path");
    expect(status.exists).toBe(false);
    expect(status.noteCount).toBe(0);
  });

  it("counts markdown files", async () => {
    await fs.ensureDir(path.join(tmpDir, "People"));
    await fs.writeFile(path.join(tmpDir, "note1.md"), "# Note 1");
    await fs.writeFile(path.join(tmpDir, "People/alice.md"), "# Alice");
    await fs.writeFile(path.join(tmpDir, "readme.txt"), "not markdown");

    const status = await getVaultStatus(tmpDir);
    expect(status.noteCount).toBe(2);
  });

  it("counts wikilinks and detects broken ones", async () => {
    await fs.ensureDir(path.join(tmpDir, "People"));
    await fs.writeFile(
      path.join(tmpDir, "note1.md"),
      "See [[Alice]] and [[Bob]]"
    );
    await fs.writeFile(path.join(tmpDir, "People/Alice.md"), "# Alice");

    const status = await getVaultStatus(tmpDir);
    expect(status.wikilinkCount).toBe(2);
    expect(status.brokenLinks).toContain("Bob");
    expect(status.brokenLinks).not.toContain("Alice");
  });

  it("extracts aliased wikilinks", async () => {
    await fs.writeFile(
      path.join(tmpDir, "note.md"),
      "See [[Alice|team lead]]"
    );

    const status = await getVaultStatus(tmpDir);
    expect(status.wikilinkCount).toBe(1);
    expect(status.brokenLinks).toContain("Alice");
  });

  it("ignores wikilinks inside code blocks", async () => {
    const content = [
      "Real link: [[Alice]]",
      "```",
      "[[InCodeBlock]]",
      "```",
      "Inline: `[[InlineCode]]`",
    ].join("\n");
    await fs.writeFile(path.join(tmpDir, "note.md"), content);

    const status = await getVaultStatus(tmpDir);
    expect(status.wikilinkCount).toBe(1);
    expect(status.brokenLinks).toEqual(["Alice"]);
  });

  it("reports directory breakdown for known dirs", async () => {
    await fs.ensureDir(path.join(tmpDir, "People"));
    await fs.ensureDir(path.join(tmpDir, "Projects"));
    await fs.writeFile(path.join(tmpDir, "People/a.md"), "# A");
    await fs.writeFile(path.join(tmpDir, "People/b.md"), "# B");
    await fs.writeFile(path.join(tmpDir, "Projects/x.md"), "# X");

    const status = await getVaultStatus(tmpDir);
    expect(status.directories["People"]).toBe(2);
    expect(status.directories["Projects"]).toBe(1);
  });

  it("detects config files", async () => {
    await fs.ensureDir(path.join(tmpDir, ".obsidian"));
    await fs.ensureDir(path.join(tmpDir, "Knowledge"));
    await fs.writeFile(path.join(tmpDir, "AGENT.md"), "# Agent");
    await fs.writeFile(
      path.join(tmpDir, "Knowledge/Glossary.md"),
      "# Glossary"
    );

    const status = await getVaultStatus(tmpDir);
    expect(status.hasObsidianConfig).toBe(true);
    expect(status.hasAgentMd).toBe(true);
    expect(status.hasGlossary).toBe(true);
  });

  it("reports false for missing config files", async () => {
    await fs.writeFile(path.join(tmpDir, "note.md"), "# Note");

    const status = await getVaultStatus(tmpDir);
    expect(status.hasObsidianConfig).toBe(false);
    expect(status.hasAgentMd).toBe(false);
    expect(status.hasGlossary).toBe(false);
  });
});

describe("formatVaultStatus", () => {
  it("formats non-existent vault", () => {
    const status: VaultStatus = {
      exists: false,
      vaultPath: "/fake/path",
      noteCount: 0,
      wikilinkCount: 0,
      brokenLinks: [],
      directories: {},
      hasObsidianConfig: false,
      hasAgentMd: false,
      hasGlossary: false,
    };
    expect(formatVaultStatus(status)).toContain("not found");
  });

  it("formats existing vault with stats", () => {
    const status: VaultStatus = {
      exists: true,
      vaultPath: "/my/vault",
      noteCount: 10,
      wikilinkCount: 25,
      brokenLinks: [],
      directories: { People: 3, Projects: 2 },
      hasObsidianConfig: true,
      hasAgentMd: true,
      hasGlossary: false,
    };
    const output = formatVaultStatus(status);
    expect(output).toContain("Notes: 10");
    expect(output).toContain("Wikilinks: 25");
    expect(output).toContain("People: 3 notes");
    expect(output).toContain("✓");
    expect(output).toContain("No broken links");
  });

  it("formats broken links section", () => {
    const status: VaultStatus = {
      exists: true,
      vaultPath: "/my/vault",
      noteCount: 5,
      wikilinkCount: 10,
      brokenLinks: ["Missing1", "Missing2"],
      directories: {},
      hasObsidianConfig: false,
      hasAgentMd: false,
      hasGlossary: false,
    };
    const output = formatVaultStatus(status);
    expect(output).toContain("Broken links (2)");
    expect(output).toContain("[[Missing1]]");
  });
});
