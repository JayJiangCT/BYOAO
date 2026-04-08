import { tool } from "@opencode-ai/plugin/tool";
import { getVaultDiagnosis } from "../vault/doctor.js";

export const byoao_vault_doctor = tool({
  description:
    "Scan an Obsidian vault and produce a diagnostic report. Checks: missing frontmatter, missing type/tags, AGENTS.md drift, orphan notes, broken wikilinks.",
  args: {
    vaultPath: tool.schema.string().describe("Absolute path to the Obsidian vault"),
  },
  async execute(args) {
    const report = await getVaultDiagnosis(args.vaultPath);

    const lines: string[] = [];
    lines.push(`Vault Diagnosis: ${report.summary.totalNotes} notes, ${report.summary.issueCount} issues`);
    lines.push("");

    // Group by category
    const byCategory = new Map<string, typeof report.issues>();
    for (const issue of report.issues) {
      const cat = byCategory.get(issue.category) || [];
      cat.push(issue);
      byCategory.set(issue.category, cat);
    }

    for (const [category, categoryIssues] of byCategory) {
      const icon = categoryIssues[0].severity === "warning" ? "⚠" : "ℹ";
      lines.push(`${icon} ${category} (${categoryIssues.length})`);
      for (const issue of categoryIssues.slice(0, 10)) {
        const file = issue.file ? ` — ${issue.file}` : "";
        lines.push(`  ${issue.message}${file}`);
      }
      if (categoryIssues.length > 10) {
        lines.push(`  ... and ${categoryIssues.length - 10} more`);
      }
      lines.push("");
    }

    if (report.issues.length === 0) {
      lines.push("✓ No issues found — vault is healthy!");
    }

    return lines.join("\n");
  },
});
