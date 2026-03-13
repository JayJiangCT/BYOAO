import fs from "fs-extra";
import path from "node:path";
import type { AddGlossaryTermInput } from "../plugin-config.js";

export interface AddGlossaryTermResult {
  glossaryPath: string;
  termAdded: string;
}

export async function addGlossaryTerm(
  input: AddGlossaryTermInput
): Promise<AddGlossaryTermResult> {
  const { vaultPath, term, definition } = input;

  const glossaryPath = path.join(vaultPath, "Knowledge/Glossary.md");
  if (!(await fs.pathExists(glossaryPath))) {
    throw new Error(`Glossary not found at: ${glossaryPath}`);
  }

  let content = await fs.readFile(glossaryPath, "utf-8");

  // Find the Core Terms table and append a new row
  const newRow = `| **${term}** | ${definition} |`;

  // Find the last row in the Core Terms table (after |------|-----------|)
  const tableMatch = content.match(
    /(## Core Terms\n\n\| Term \| Definition \|\n\|------|-----------\|\n)([\s\S]*?)(\n\n---|\n\n##|\n*$)/
  );

  if (tableMatch) {
    const [fullMatch, tableHeader, existingRows, tableEnd] = tableMatch;
    const updatedRows = existingRows.trim()
      ? `${existingRows.trim()}\n${newRow}`
      : newRow;
    content = content.replace(
      fullMatch,
      `${tableHeader}${updatedRows}\n${tableEnd}`
    );
  } else {
    // Fallback: just append before the "How to Add" section
    if (content.includes("## How to Add a New Term")) {
      content = content.replace(
        "## How to Add a New Term",
        `${newRow}\n\n## How to Add a New Term`
      );
    } else {
      content += `\n${newRow}\n`;
    }
  }

  await fs.writeFile(glossaryPath, content);

  return { glossaryPath, termAdded: term };
}
