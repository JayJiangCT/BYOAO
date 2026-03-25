import {
  findOpencodeConfig,
  readOpencodeConfig,
  writeOpencodeConfig,
} from "./opencode-config.js";

const GEMINI_AUTH_PLUGIN = "opencode-gemini-auth";

export type ProviderChoice = "copilot" | "gemini";

export interface ConfigureProviderResult {
  provider: ProviderChoice;
  configPath: string;
  pluginAdded: boolean;
  pluginSkipped: boolean;
  projectIdSet: boolean;
  projectIdSkipped: boolean;
}

/**
 * Configure an AI provider in the global OpenCode config.
 * For Gemini: adds the auth plugin and projectId.
 * For Copilot: no config changes needed (built-in provider).
 * Idempotent — skips entries that already exist.
 */
export async function configureProvider(
  provider: ProviderChoice,
  gcpProjectId?: string
): Promise<ConfigureProviderResult> {
  const configPath = findOpencodeConfig();

  if (provider === "copilot") {
    return {
      provider: "copilot",
      configPath,
      pluginAdded: false,
      pluginSkipped: false,
      projectIdSet: false,
      projectIdSkipped: false,
    };
  }

  // Gemini requires a projectId
  if (!gcpProjectId) {
    throw new Error("GCP Project ID is required for Google Gemini provider");
  }

  const config = await readOpencodeConfig();

  // 1. Add plugin
  const plugins = (config.plugin as string[] | undefined) || [];
  let pluginAdded = false;
  let pluginSkipped = false;
  const hasPlugin = plugins.some((p) => p.startsWith(GEMINI_AUTH_PLUGIN));
  if (hasPlugin) {
    pluginSkipped = true;
  } else {
    plugins.push(GEMINI_AUTH_PLUGIN);
    config.plugin = plugins;
    pluginAdded = true;
  }

  // 2. Set provider.google.options.projectId
  const providerConfig = (config.provider as Record<string, unknown>) || {};
  const googleConfig =
    (providerConfig.google as Record<string, unknown>) || {};
  const googleOptions =
    (googleConfig.options as Record<string, unknown>) || {};

  let projectIdSet = false;
  let projectIdSkipped = false;
  if (googleOptions.projectId) {
    projectIdSkipped = true;
  } else {
    googleOptions.projectId = gcpProjectId;
    projectIdSet = true;
  }

  googleConfig.options = googleOptions;
  providerConfig.google = googleConfig;
  config.provider = providerConfig;

  if (pluginAdded || projectIdSet) {
    await writeOpencodeConfig(config);
  }

  return {
    provider: "gemini",
    configPath,
    pluginAdded,
    pluginSkipped,
    projectIdSet,
    projectIdSkipped,
  };
}
