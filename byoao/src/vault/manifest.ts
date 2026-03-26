import fs from "fs-extra";
import path from "node:path";
import { z } from "zod";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const PKG_VERSION: string = (
  require("../../package.json") as Record<string, unknown>
).version as string;

// ── Schema ──────────────────────────────────────────────────────

const InfrastructureSchema = z.object({
  skills: z.array(z.string()).default([]),
  commands: z.array(z.string()).default([]),
  obsidianConfig: z.array(z.string()).default([]),
  templates: z.array(z.string()).default([]),
});

export const ManifestSchema = z.object({
  version: z.string(),
  preset: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  infrastructure: InfrastructureSchema,
});

export type Manifest = z.infer<typeof ManifestSchema>;

export interface InstalledFiles {
  skills: string[];
  commands: string[];
  obsidianConfig: string[];
  templates: string[];
}

// ── Constants ───────────────────────────────────────────────────

const MANIFEST_DIR = ".byoao";
const MANIFEST_FILE = "manifest.json";

// ── Functions ───────────────────────────────────────────────────

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function manifestPath(vaultPath: string): string {
  return path.join(vaultPath, MANIFEST_DIR, MANIFEST_FILE);
}

/** Read and validate the manifest. Returns null if missing or invalid. */
export async function readManifest(vaultPath: string): Promise<Manifest | null> {
  const mp = manifestPath(vaultPath);
  if (!(await fs.pathExists(mp))) return null;

  try {
    const raw = await fs.readJson(mp);
    return ManifestSchema.parse(raw);
  } catch {
    /* Corrupt JSON or schema mismatch — treat as missing */
    return null;
  }
}

/** Write the manifest to .byoao/manifest.json. */
export async function writeManifest(
  vaultPath: string,
  preset: string,
  installedFiles: InstalledFiles,
  versionOverride?: string,
): Promise<void> {
  const mp = manifestPath(vaultPath);
  const existing = await readManifest(vaultPath);

  const manifest: Manifest = {
    version: versionOverride ?? PKG_VERSION,
    preset,
    createdAt: existing?.createdAt ?? today(),
    updatedAt: today(),
    infrastructure: {
      skills: installedFiles.skills,
      commands: installedFiles.commands,
      obsidianConfig: installedFiles.obsidianConfig,
      templates: installedFiles.templates,
    },
  };

  await fs.ensureDir(path.dirname(mp));
  await fs.writeJson(mp, manifest, { spaces: 2 });
}

/** Exported for use by upgrade module to get package version. */
export function getPackageVersion(): string {
  return PKG_VERSION;
}
