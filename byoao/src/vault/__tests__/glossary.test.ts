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
title: Glossary
type: reference
status: active
tags: [glossary, reference]
---

# Glossary

Domain terms and key concepts in this knowledge base.
Maintained by /weave — run it to discover and add new terms.

| Term | Definition | Domain |
|------|-----------|--------|
| **API** | Application programming interface | engineering |
`;

describe("addGlossaryTerm", () => {
  it("appends term to existing glossary table", async () => {
    await fs.writeFile(
      path.join(tmpDir, "Knowledge/Glossary.md"),
      GLOSSARY_TEMPLATE
    );

    const result = await addGlossaryTerm({
      vaultPath: tmpDir,
      term: "SDK",
      definition: "Software development kit",
      domain: "engineering",
    });

    expect(result.termAdded).toBe("SDK");

    const content = await fs.readFile(
      path.join(tmpDir, "Knowledge/Glossary.md"),
      "utf-8"
    );
    expect(content).toContain("**SDK**");
    expect(content).toContain("Software development kit");
    expect(content).toContain("| engineering |");
    // Original term still present
    expect(content).toContain("**API**");
  });

  it("appends term with empty domain when domain not provided", async () => {
    await fs.writeFile(
      path.join(tmpDir, "Knowledge/Glossary.md"),
      GLOSSARY_TEMPLATE
    );

    const result = await addGlossaryTerm({
      vaultPath: tmpDir,
      term: "TDD",
      definition: "Test-driven development",
      domain: "",
    });

    expect(result.termAdded).toBe("TDD");

    const content = await fs.readFile(
      path.join(tmpDir, "Knowledge/Glossary.md"),
      "utf-8"
    );
    expect(content).toContain("**TDD**");
  });

  it("throws when Glossary.md does not exist", async () => {
    await expect(
      addGlossaryTerm({
        vaultPath: tmpDir,
        term: "Test",
        definition: "A test",
        domain: "",
      })
    ).rejects.toThrow("Glossary not found");
  });
});
