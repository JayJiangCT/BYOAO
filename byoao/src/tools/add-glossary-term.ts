import { tool } from "@opencode-ai/plugin/tool";
import { addGlossaryTerm } from "../vault/glossary.js";

export const byoao_add_glossary_term = tool({
  description:
    "Add a new term to the vault's Glossary.md. Appends a row to the Core Terms table.",
  args: {
    vaultPath: tool.schema.string().describe("Path to the Obsidian vault"),
    term: tool.schema.string().describe("The domain term to add"),
    definition: tool.schema.string().describe("Brief definition (1-2 sentences)"),
  },
  async execute(args) {
    const result = await addGlossaryTerm({
      vaultPath: args.vaultPath,
      term: args.term,
      definition: args.definition,
    });

    return `✓ Added glossary term: ${result.termAdded}\n  File: ${result.glossaryPath}`;
  },
});
