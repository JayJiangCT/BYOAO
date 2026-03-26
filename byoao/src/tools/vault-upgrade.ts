import { tool } from "@opencode-ai/plugin/tool";
import { upgradeVault, type UpgradeVaultResult } from "../vault/upgrade.js";

function formatUpgradeResult(result: UpgradeVaultResult): string {
  const lines: string[] = [];

  if (result.dryRun) {
    lines.push("Upgrade plan (dry run — no changes made):");
    lines.push("");
    lines.push(`From v${result.fromVersion} → v${result.toVersion}`);
  } else if (
    result.added.length === 0 &&
    result.updated.length === 0 &&
    result.deprecated.length === 0 &&
    result.errors.length === 0
  ) {
    return `Vault is already at v${result.toVersion} — nothing to upgrade. Use force option to re-run.`;
  } else {
    lines.push(`Vault upgraded from v${result.fromVersion} to v${result.toVersion}`);
  }

  if (result.added.length > 0) {
    lines.push("");
    lines.push(`${result.dryRun ? "Would add" : "Added"} (${result.added.length}):`);
    for (const f of result.added) {
      lines.push(`  + ${f}`);
    }
  }

  if (result.updated.length > 0) {
    lines.push("");
    lines.push(`${result.dryRun ? "Would update" : "Updated"} (${result.updated.length}):`);
    for (const f of result.updated) {
      lines.push(`  ~ ${f}`);
    }
  }

  if (result.deprecated.length > 0) {
    lines.push("");
    lines.push(`Deprecated (${result.deprecated.length}):`);
    for (const f of result.deprecated) {
      lines.push(`  ○ ${f} (no longer shipped, left on disk)`);
    }
  }

  if (result.errors.length > 0) {
    lines.push("");
    lines.push(`Errors (${result.errors.length}):`);
    for (const e of result.errors) {
      lines.push(`  ✗ ${e.file}: ${e.error}`);
    }
  }

  if (!result.dryRun && result.errors.length === 0) {
    lines.push("");
    lines.push("Manifest updated.");
  }

  return lines.join("\n");
}

export const byoao_vault_upgrade = tool({
  description:
    "Upgrade a BYOAO Obsidian vault to the latest version. Updates skills, " +
    "commands, templates, and Obsidian config to match the current BYOAO package.",
  args: {
    vaultPath: tool.schema
      .string()
      .describe("Absolute path to the Obsidian vault"),
    dryRun: tool.schema
      .boolean()
      .optional()
      .describe(
        "If true, return the upgrade plan without executing. Defaults to false."
      ),
    force: tool.schema
      .boolean()
      .optional()
      .describe(
        "If true, run even if versions match or on downgrade. Defaults to false."
      ),
  },
  async execute(args) {
    const result = await upgradeVault(args.vaultPath, {
      dryRun: args.dryRun,
      force: args.force,
    });
    return formatUpgradeResult(result);
  },
});
