import { tool } from "@opencode-ai/plugin/tool";
import {
  findOpencodeConfig,
  readOpencodeConfig,
  writeOpencodeConfig,
} from "../vault/opencode-config.js";

export const byoao_switch_provider = tool({
  description:
    "Switch the AI model/provider in OpenCode config. Updates the default model used for AI conversations. " +
    "Use when the user wants to change their AI provider (e.g., from Copilot to Gemini) or switch to a different model.",
  args: {
    model: tool.schema
      .string()
      .describe(
        'Model to switch to in "provider/model" format (e.g., "github-copilot/claude-sonnet-4-20250514", "google/gemini-2.5-pro")'
      ),
    smallModel: tool.schema
      .string()
      .optional()
      .describe(
        'Optional small model for lightweight tasks like title generation (e.g., "github-copilot/gpt-4o-mini")'
      ),
  },
  async execute(args) {
    const configPath = findOpencodeConfig();
    const config = await readOpencodeConfig();

    const previousModel = (config.model as string) || "(default)";
    config.model = args.model;

    if (args.smallModel) {
      config.small_model = args.smallModel;
    }

    await writeOpencodeConfig(config);

    let output = `✓ Model switched: ${previousModel} → ${args.model}`;
    if (args.smallModel) {
      output += `\n  Small model: ${args.smallModel}`;
    }
    output += `\n  Config: ${configPath}`;
    output += `\n\n⚠ The model change takes effect on the next OpenCode session.`;
    output += `\n  If the new model requires authentication, run: opencode auth login`;

    return output;
  },
});
