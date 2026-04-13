import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "fs-extra";
import path from "node:path";
import os from "node:os";
import { getVaultDiagnosis } from "../doctor.js";

let tmpDir: string;

beforeEach(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "byoao-doctor-"));
});

afterEach(async () => {
  await fs.remove(tmpDir);
});

function writeNote(name: string, content: string) {
  return fs.writeFile(path.join(tmpDir, name), content);
}

function noteWithFrontmatter(fields: Record<string, unknown>, body = "") {
  const yaml = Object.entries(fields)
    .map(([k, v]) => {
      if (Array.isArray(v)) return `${k}: [${v.join(", ")}]`;
      return `${k}: ${v}`;
    })
    .join("\n");
  return `---\n${yaml}\n---\n\n${body}`;
}

describe("getVaultDiagnosis", () => {
  it("reports zero issues for a clean vault", async () => {
    await fs.ensureDir(path.join(tmpDir, "entities"));
    await fs.ensureDir(path.join(tmpDir, "concepts"));
    await fs.ensureDir(path.join(tmpDir, "comparisons"));
    await fs.ensureDir(path.join(tmpDir, "queries"));
    await writeNote(
      "SCHEMA.md",
      noteWithFrontmatter(
        { type: "reference", tags: ["wiki"] },
        "# Schema\n\nSee [[note]]\n"
      )
    );
    await writeNote(
      "log.md",
      noteWithFrontmatter(
        { type: "reference", tags: ["wiki"] },
        "# Log\n\nSee [[note]]\n"
      )
    );
    await writeNote(
      "note.md",
      noteWithFrontmatter(
        { type: "reference", tags: ["test"] },
        "See [[other]]\n"
      )
    );
    await writeNote(
      "other.md",
      noteWithFrontmatter(
        { type: "reference", tags: ["test"] },
        "Back to [[note]]\n"
      )
    );

    const report = await getVaultDiagnosis(tmpDir);
    expect(report.issues).toHaveLength(0);
    expect(report.summary.totalNotes).toBe(4);
    expect(report.summary.healthyNotes).toBe(4);
  });

  it("reports missing frontmatter", async () => {
    await writeNote("bare.md", "# No frontmatter\n\nJust text.");

    const report = await getVaultDiagnosis(tmpDir);
    const fmIssues = report.issues.filter((i) => i.category === "frontmatter");
    expect(fmIssues.length).toBeGreaterThanOrEqual(1);
    expect(fmIssues[0].message).toContain("Missing frontmatter");
  });

  it("reports missing type field", async () => {
    await writeNote(
      "no-type.md",
      noteWithFrontmatter({ tags: ["test"] }, "Content")
    );

    const report = await getVaultDiagnosis(tmpDir);
    const typeIssue = report.issues.find((i) =>
      i.message.includes("Missing `type`")
    );
    expect(typeIssue).toBeDefined();
    expect(typeIssue!.severity).toBe("warning");
  });

  it("reports missing tags field", async () => {
    await writeNote(
      "no-tags.md",
      noteWithFrontmatter({ type: "reference" }, "Content")
    );

    const report = await getVaultDiagnosis(tmpDir);
    const tagsIssue = report.issues.find((i) =>
      i.message.includes("Missing `tags`")
    );
    expect(tagsIssue).toBeDefined();
    expect(tagsIssue!.severity).toBe("info");
  });

  it("reports orphan notes", async () => {
    await writeNote(
      "orphan.md",
      noteWithFrontmatter({ type: "reference", tags: ["test"] }, "No links.")
    );

    const report = await getVaultDiagnosis(tmpDir);
    const orphanIssues = report.issues.filter((i) => i.category === "orphan");
    expect(orphanIssues).toHaveLength(1);
    expect(orphanIssues[0].file).toBe("orphan.md");
  });

  it("reports broken wikilinks", async () => {
    await writeNote(
      "source.md",
      noteWithFrontmatter(
        { type: "reference", tags: ["test"] },
        "Links to [[nonexistent]]"
      )
    );

    const report = await getVaultDiagnosis(tmpDir);
    const brokenLinks = report.issues.filter(
      (i) => i.category === "broken-link"
    );
    expect(brokenLinks).toHaveLength(1);
    expect(brokenLinks[0].message).toContain("[[nonexistent]]");
  });

  it("reports AGENT.md drift", async () => {
    await fs.ensureDir(path.join(tmpDir, "entities"));
    await fs.ensureDir(path.join(tmpDir, "concepts"));
    await fs.ensureDir(path.join(tmpDir, "comparisons"));
    await fs.ensureDir(path.join(tmpDir, "queries"));
    await writeNote(
      "SCHEMA.md",
      noteWithFrontmatter({ type: "reference", tags: ["wiki"] }, "[[Alice]]")
    );
    await writeNote(
      "log.md",
      noteWithFrontmatter({ type: "reference", tags: ["wiki"] }, "[[Alice]]")
    );
    await writeNote("AGENT.md", "Team: [[Alice]] and [[Bob]]");
    await fs.ensureDir(path.join(tmpDir, "People"));
    await writeNote(
      "People/Alice.md",
      noteWithFrontmatter({ type: "person", tags: ["person"] })
    );
    // Bob doesn't exist

    const report = await getVaultDiagnosis(tmpDir);
    const driftIssues = report.issues.filter(
      (i) => i.category === "agent-drift"
    );
    expect(driftIssues).toHaveLength(1);
    expect(driftIssues[0].message).toContain("[[Bob]]");
  });

  it("skips template files", async () => {
    await fs.ensureDir(path.join(tmpDir, "Knowledge/templates"));
    await fs.writeFile(
      path.join(tmpDir, "Knowledge/templates/Template.md"),
      "# No frontmatter template"
    );

    const report = await getVaultDiagnosis(tmpDir);
    const templateIssues = report.issues.filter(
      (i) => i.file?.startsWith("Knowledge/templates/")
    );
    expect(templateIssues).toHaveLength(0);
  });

  it("info when empty legacy Knowledge folder exists", async () => {
    await fs.ensureDir(path.join(tmpDir, "Knowledge"));
    const report = await getVaultDiagnosis(tmpDir);
    const legacy = report.issues.filter(
      (i) =>
        i.severity === "info" &&
        i.message.includes("Knowledge/") &&
        i.message.includes("v1 legacy"),
    );
    expect(legacy).toHaveLength(1);
  });
});
