import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "fs-extra";
import path from "node:path";
import os from "node:os";
import { addMember } from "../member.js";

let tmpDir: string;

beforeEach(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "byoao-member-"));
  await fs.ensureDir(path.join(tmpDir, "People"));
});

afterEach(async () => {
  await fs.remove(tmpDir);
});

describe("addMember", () => {
  it("creates person note with correct frontmatter", async () => {
    const result = await addMember({
      vaultPath: tmpDir,
      name: "Alice",
      role: "Engineer",
      team: "Platform",
    });

    expect(result.filePath).toContain("People/Alice.md");

    const content = await fs.readFile(
      path.join(tmpDir, "People/Alice.md"),
      "utf-8"
    );
    expect(content).toContain("type: person");
    expect(content).toContain('team: "Platform"');
    expect(content).toContain('role: "Engineer"');
    expect(content).toContain("status: active");
  });

  it("updates team index table", async () => {
    // Create a team index file
    const teamIndexContent = `---
title: "Platform Team"
type: reference
---

# Platform Team

## Members

| Name | Role |
|------|------|

## Active Projects
`;
    await fs.writeFile(
      path.join(tmpDir, "People/Platform Team.md"),
      teamIndexContent
    );

    await addMember({
      vaultPath: tmpDir,
      name: "Bob",
      role: "PM",
      team: "Platform",
    });

    const updated = await fs.readFile(
      path.join(tmpDir, "People/Platform Team.md"),
      "utf-8"
    );
    expect(updated).toContain("[[Bob]]");
    expect(updated).toContain("PM");
  });

  it("updates AGENT.md and CLAUDE.md wikilinks", async () => {
    // Create AGENT.md and CLAUDE.md with placeholder
    const agentContent = `# Agent

## Team

(No members added yet — create notes in People/)
`;
    await fs.writeFile(path.join(tmpDir, "AGENT.md"), agentContent);
    await fs.writeFile(path.join(tmpDir, "CLAUDE.md"), agentContent);

    const result = await addMember({
      vaultPath: tmpDir,
      name: "Carol",
      role: "Designer",
      team: "Platform",
    });

    expect(result.wikilinksAdded).toBeGreaterThanOrEqual(2);

    const agent = await fs.readFile(path.join(tmpDir, "AGENT.md"), "utf-8");
    expect(agent).toContain("[[Carol]]");
    expect(agent).not.toContain("No members added yet");
  });

  it("throws when person already exists", async () => {
    await fs.writeFile(path.join(tmpDir, "People/Alice.md"), "# Alice");

    await expect(
      addMember({
        vaultPath: tmpDir,
        name: "Alice",
        role: "Eng",
        team: "T",
      })
    ).rejects.toThrow("already exists");
  });
});
