import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "fs-extra";
import path from "node:path";
import os from "node:os";
import { addGlossaryTerm } from "../glossary.js";

let tmpDir: string;

beforeEach(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "byoao-glossary-"));
  await fs.ensureDir(path.join(tmpDir, "Knowledge"));
});

afterEach(async () => {
  await fs.remove(tmpDir);
});

const GLOSSARY_TEMPLATE = `---
title: "Test Glossary"
type: reference
tags: [glossary]
---

# Test Glossary

## Core Terms

| Term | Definition |
|------|-----------|
| **API** | Application programming interface |

---

## How to Add a New Term

Just add it.
`;

describe("addGlossaryTerm", () => {
  it("appends term to existing Core Terms table", async () => {
    await fs.writeFile(
      path.join(tmpDir, "Knowledge/Glossary.md"),
      GLOSSARY_TEMPLATE
    );

    const result = await addGlossaryTerm({
      vaultPath: tmpDir,
      term: "SDK",
      definition: "Software development kit",
    });

    expect(result.termAdded).toBe("SDK");

    const content = await fs.readFile(
      path.join(tmpDir, "Knowledge/Glossary.md"),
      "utf-8"
    );
    expect(content).toContain("**SDK**");
    expect(content).toContain("Software development kit");
    // Original term still present
    expect(content).toContain("**API**");
  });

  it("throws when Glossary.md does not exist", async () => {
    await expect(
      addGlossaryTerm({
        vaultPath: tmpDir,
        term: "Test",
        definition: "A test",
      })
    ).rejects.toThrow("Glossary not found");
  });
});
