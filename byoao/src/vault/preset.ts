import { fs } from "../lib/cjs-modules.js";
import path from "node:path";
import {
  PresetConfigSchema,
  type PresetConfig,
  type InitOfferWhen,
} from "../plugin-config.js";

function getPresetsDir(): string {
  // When running from dist/ (bundled): dist/assets/presets
  const distAssets = path.resolve(import.meta.dirname, "assets", "presets");
  // When running from dist/ via tsc only: ../assets/presets
  const srcPresets = path.resolve(import.meta.dirname, "..", "assets", "presets");
  // When running from src/ via tsx: ../../src/assets/presets
  const devPresets = path.resolve(import.meta.dirname, "..", "..", "src", "assets", "presets");

  if (fs.existsSync(distAssets)) return distAssets;
  if (fs.existsSync(srcPresets)) return srcPresets;
  if (fs.existsSync(devPresets)) return devPresets;
  throw new Error(
    `Cannot find presets directory. Looked in:\n  ${distAssets}\n  ${srcPresets}\n  ${devPresets}`
  );
}

export type PresetListEntry = {
  name: string;
  displayName: string;
  description: string;
  initOfferWhen: InitOfferWhen;
};

function readAllPresetEntries(): PresetListEntry[] {
  const presetsDir = getPresetsDir();
  const entries = fs.readdirSync(presetsDir, { withFileTypes: true });
  const presets: PresetListEntry[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory() || entry.name === "common") continue;
    const configPath = path.join(presetsDir, entry.name, "preset.json");
    if (!fs.existsSync(configPath)) continue;
    const raw = fs.readJsonSync(configPath);
    const parsed = PresetConfigSchema.parse(raw);
    presets.push({
      name: parsed.name,
      displayName: parsed.displayName,
      description: parsed.description,
      initOfferWhen: parsed.initOfferWhen,
    });
  }

  return presets;
}

export function listPresets(): { name: string; displayName: string; description: string }[] {
  return readAllPresetEntries().map(({ name, displayName, description }) => ({
    name,
    displayName,
    description,
  }));
}

/** Full preset rows for interactive init filtering. */
export function listPresetsDetailed(): PresetListEntry[] {
  return readAllPresetEntries();
}

/** Presets shown after user picks Personal or Work in interactive init. */
export function filterPresetsForInitUseCase(
  presets: PresetListEntry[],
  useCase: "personal" | "work",
): PresetListEntry[] {
  return presets.filter(
    (p) => p.initOfferWhen === "always" || p.initOfferWhen === useCase,
  );
}

export function loadPreset(name: string): {
  config: PresetConfig;
  presetsDir: string;
} {
  const presetsDir = getPresetsDir();
  const presetDir = path.join(presetsDir, name);
  const configPath = path.join(presetDir, "preset.json");

  if (!fs.existsSync(configPath)) {
    const available = listPresets().map((p) => p.name);
    throw new Error(
      `Preset "${name}" not found. Available presets: ${available.join(", ")}`
    );
  }

  const raw = fs.readJsonSync(configPath);
  const config = PresetConfigSchema.parse(raw);
  return { config, presetsDir };
}

export function getCommonDir(): string {
  return path.join(getPresetsDir(), "common");
}
