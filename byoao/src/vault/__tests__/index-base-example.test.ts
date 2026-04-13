import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "fs-extra";
import path from "node:path";
import os from "node:os";
import { copyIndexBaseExampleIfMissing } from "../index-base-example.js";
import { getCommonDir } from "../preset.js";

describe("copyIndexBaseExampleIfMissing", () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "byoao-index-base-"));
  });

  afterEach(async () => {
    await fs.remove(tmpDir);
  });

  it("copies INDEX.base.example when INDEX.base is missing", async () => {
    const commonDir = getCommonDir();
    const copied = await copyIndexBaseExampleIfMissing(tmpDir, commonDir);
    expect(copied).toBe(true);
    const content = await fs.readFile(path.join(tmpDir, "INDEX.base"), "utf-8");
    expect(content).toContain("file.inFolder");
  });

  it("does not overwrite an existing INDEX.base", async () => {
    const dest = path.join(tmpDir, "INDEX.base");
    await fs.writeFile(dest, "preserve-me", "utf-8");
    const commonDir = getCommonDir();
    const copied = await copyIndexBaseExampleIfMissing(tmpDir, commonDir);
    expect(copied).toBe(false);
    expect(await fs.readFile(dest, "utf-8")).toBe("preserve-me");
  });
});
