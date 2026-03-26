import { tool } from "@opencode-ai/plugin/tool";
import { readNote } from "../vault/note-read.js";

export const byoao_note_read = tool({
  description:
    "Read a specific note from an Obsidian vault by name. Uses Obsidian CLI to resolve and read the note. Preferred over cat/Read for Obsidian vault notes.",
  args: {
    vaultPath: tool.schema.string().describe("Absolute path to the Obsidian vault"),
    file: tool.schema
      .string()
      .describe("Note name to read (without .md extension, e.g. 'Refund Automation')"),
  },
  async execute(args) {
    const result = await readNote({
      vaultPath: args.vaultPath,
      file: args.file,
    });
    return JSON.stringify(result, null, 2);
  },
});
