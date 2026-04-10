import { fs } from "../lib/cjs-modules.js";
import path from "node:path";
import { getCommonDir } from "./preset.js";

const AGENTS_RETRIEVAL_MARKER = "## Knowledge Retrieval (Q&A)";
const AGENTS_INSERT_BEFORE = "## Available Skills";
const SCHEMA_RETRIEVAL_MARKER = "## Retrieval";

/** Slice from start heading up to (but not including) end heading. */
function extractSection(template: string, start: string, end: string): string | null {
  const i = template.indexOf(start);
  if (i === -1) return null;
  const j = template.indexOf(end, i + start.length);
  if (j === -1) return null;
  return template.slice(i, j).trimEnd();
}

function extractSchemaRetrievalBlock(template: string): string | null {
  const i = template.indexOf(SCHEMA_RETRIEVAL_MARKER);
  if (i === -1) return null;
  return template.slice(i).trimEnd();
}

export type RootDocSyncStatus =
  | "unchanged"
  | "updated"
  | "skipped-missing-file"
  | "skipped-missing-template"
  | "skipped-no-anchor";

export interface SyncRootDocsResult {
  agents: RootDocSyncStatus;
  schema: RootDocSyncStatus;
  dryRun: boolean;
}

/**
 * Merge packaged template sections into vault-root AGENTS.md and SCHEMA.md when
 * they are missing. Does not replace whole files — only inserts known blocks so
 * existing user edits stay intact.
 */
export async function syncRootDocsFromTemplates(
  vaultPath: string,
  options?: { dryRun?: boolean },
): Promise<SyncRootDocsResult> {
  const dryRun = options?.dryRun ?? false;
  const commonDir = getCommonDir();
  const agentsTemplatePath = path.join(commonDir, "AGENTS.md.hbs");
  const schemaTemplatePath = path.join(commonDir, "SCHEMA.md.hbs");

  let agents: RootDocSyncStatus = "unchanged";
  let schema: RootDocSyncStatus = "unchanged";

  const agentsVaultPath = path.join(vaultPath, "AGENTS.md");
  const schemaVaultPath = path.join(vaultPath, "SCHEMA.md");

  if (await fs.pathExists(agentsTemplatePath)) {
    const template = await fs.readFile(agentsTemplatePath, "utf-8");
    const block = extractSection(template, AGENTS_RETRIEVAL_MARKER, AGENTS_INSERT_BEFORE);

    if (!block) {
      agents = "skipped-missing-template";
    } else if (!(await fs.pathExists(agentsVaultPath))) {
      agents = "skipped-missing-file";
    } else {
      let content = await fs.readFile(agentsVaultPath, "utf-8");
      if (content.includes(AGENTS_RETRIEVAL_MARKER)) {
        agents = "unchanged";
      } else {
        const idx = content.indexOf(AGENTS_INSERT_BEFORE);
        if (idx === -1) {
          agents = "skipped-no-anchor";
        } else {
          const insert = `\n\n${block}\n\n`;
          content = content.slice(0, idx) + insert + content.slice(idx);
          if (!dryRun) {
            await fs.writeFile(agentsVaultPath, content, "utf-8");
          }
          agents = "updated";
        }
      }
    }
  } else {
    agents = "skipped-missing-template";
  }

  if (await fs.pathExists(schemaTemplatePath)) {
    const template = await fs.readFile(schemaTemplatePath, "utf-8");
    const block = extractSchemaRetrievalBlock(template);

    if (!block) {
      schema = "skipped-missing-template";
    } else if (!(await fs.pathExists(schemaVaultPath))) {
      schema = "skipped-missing-file";
    } else {
      let content = await fs.readFile(schemaVaultPath, "utf-8");
      if (content.includes(SCHEMA_RETRIEVAL_MARKER)) {
        schema = "unchanged";
      } else {
        const next = `${content.trimEnd()}\n\n${block}\n`;
        if (!dryRun) {
          await fs.writeFile(schemaVaultPath, next, "utf-8");
        }
        schema = "updated";
      }
    }
  } else {
    schema = "skipped-missing-template";
  }

  return { agents, schema, dryRun };
}
