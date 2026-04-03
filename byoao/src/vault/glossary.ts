import { fs } from "../lib/cjs-modules.js";
import path from "node:path";
import type { AddGlossaryTermInput } from "../plugin-config.js";

export interface AddGlossaryTermResult {
  glossaryPath: string;
  termAdded: string;
}

export async function addGlossaryTerm(
  input: AddGlossaryTermInput
): Promise<AddGlossaryTermResult> {
  const { vaultPath, term, definition, domain } = input;

  const glossaryPath = path.join(vaultPath, "Knowledge/Glossary.md");
  if (!(await fs.pathExists(glossaryPath))) {
    throw new Error(`Glossary not found at: ${glossaryPath}`);
  }

  let content = await fs.readFile(glossaryPath, "utf-8");

  const newRow = `| **${term}** | ${definition} | ${domain ?? ""} |`;

  // Find the glossary table (Term | Definition | Domain)
  const tableMatch = content.match(
    /(\| Term \| Definition \| Domain \|\n\|------\|-----------|--------\|\n)([\s\S]*?)(\n*$)/
  );

  if (tableMatch) {
    const [fullMatch, tableHeader, existingRows, trailing] = tableMatch;
    const updatedRows = existingRows.trim()
      ? `${existingRows.trim()}\n${newRow}`
      : newRow;
    content = content.replace(
      fullMatch,
      `${tableHeader}${updatedRows}\n`,
    );
  } else {
    // Fallback: append to end of file
    content = content.trimEnd() + `\n${newRow}\n`;
  }

  await fs.writeFile(glossaryPath, content);

  return { glossaryPath, termAdded: term };
}
