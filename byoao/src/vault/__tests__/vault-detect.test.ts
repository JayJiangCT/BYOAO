import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "fs-extra";
import path from "node:path";
import os from "node:os";
import { detectVaultContext } from "../vault-detect.js";

let tmpDir: string;

beforeEach(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "byoao-detect-"));
});

afterEach(async () => {
  await fs.remove(tmpDir);
});

describe("detectVaultContext", () => {
  it("returns vault path when .obsidian/ and AGENT.md exist", async () => {
    await fs.ensureDir(path.join(tmpDir, ".obsidian"));
    await fs.writeFile(path.join(tmpDir, "AGENT.md"), "# Agent");

    const result = detectVaultContext(tmpDir);
    expect(result).toBe(tmpDir);
  });

  it("returns vault path when .obsidian/ and Knowledge/Glossary.md exist", async () => {
    await fs.ensureDir(path.join(tmpDir, ".obsidian"));
    await fs.ensureDir(path.join(tmpDir, "Knowledge"));
    await fs.writeFile(path.join(tmpDir, "Knowledge/Glossary.md"), "# Glossary");

    const result = detectVaultContext(tmpDir);
    expect(result).toBe(tmpDir);
  });

  it("returns null when .obsidian/ is missing", async () => {
    await fs.writeFile(path.join(tmpDir, "AGENT.md"), "# Agent");

    const result = detectVaultContext(tmpDir);
    expect(result).toBeNull();
  });

  it("returns null when .obsidian/ exists but no AGENT.md or Glossary", async () => {
    await fs.ensureDir(path.join(tmpDir, ".obsidian"));

    const result = detectVaultContext(tmpDir);
    expect(result).toBeNull();
  });

  it("checks parent directory when target is a subdirectory", async () => {
    await fs.ensureDir(path.join(tmpDir, ".obsidian"));
    await fs.writeFile(path.join(tmpDir, "AGENT.md"), "# Agent");
    const subDir = path.join(tmpDir, "Projects");
    await fs.ensureDir(subDir);

    const result = detectVaultContext(subDir);
    expect(result).toBe(tmpDir);
  });

  it("returns null for a completely empty directory", async () => {
    const result = detectVaultContext(tmpDir);
    expect(result).toBeNull();
  });

  it("returns null for non-existent path", async () => {
    const result = detectVaultContext("/nonexistent/path/12345");
    expect(result).toBeNull();
  });
});
