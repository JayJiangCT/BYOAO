import { z } from "zod";

export const TaxonomyEntrySchema = z.object({
  term: z.string(),
  definition: z.string(),
  domain: z.string().default(""),
  tags: z.array(z.string()).default([]),
});

export const VaultConfigSchema = z.object({
  kbName: z.string().min(1),
  ownerName: z.string().default(""),
  vaultPath: z.string(),
  preset: z.string().default("minimal"),
  provider: z.enum(["copilot", "gemini", "skip"]).default("skip"),
  /** GCP Project ID — used for BigQuery MCP env and Gemini provider config */
  gcpProjectId: z.string().default(""),
  /** MCP server names to skip (user deselected in init flow) */
  mcpSkip: z.array(z.string()).default([]),
  /** What domain this knowledge base covers (used in SCHEMA.md generation) */
  wikiDomain: z.string().default(""),
  /** Agent autonomy level: auto = agent applies changes, review = agent reports first */
  compilationMode: z.enum(["auto", "review"]).default("review"),
});

export type TaxonomyEntry = z.infer<typeof TaxonomyEntrySchema>;
export type VaultConfig = z.infer<typeof VaultConfigSchema>;

export const VaultStatusSchema = z.object({
  vaultPath: z.string(),
});

// --- Preset System ---

/** When interactive `byoao init` may offer this preset (after Personal / Work choice). */
export const InitOfferWhenSchema = z.enum(["always", "work", "personal"]);
export type InitOfferWhen = z.infer<typeof InitOfferWhenSchema>;

export const PresetConfigSchema = z.object({
  name: z.string().min(1),
  displayName: z.string().min(1),
  description: z.string(),
  /** `always`: both Personal and Work paths; `work` / `personal`: only that init branch */
  initOfferWhen: InitOfferWhenSchema.default("always"),
  directories: z.array(z.string()).default([]),
  agentDescription: z.string(),
  frontmatterExtras: z.record(z.string(), z.array(z.string())).default({}),
  templates: z.array(z.string()).default([]),
  mcpServers: z.record(
    z.string(),
    z.discriminatedUnion("type", [
      z.object({
        type: z.literal("remote"),
        url: z.string().url(),
      }),
      z.object({
        type: z.literal("local"),
        command: z.array(z.string()).min(1),
        environment: z.record(z.string(), z.string()).optional(),
      }),
    ])
  ).default({}),
  obsidianPlugins: z.record(
    z.string(),
    z.object({
      repo: z.string().regex(/^[^/]+\/[^/]+$/, "Must be owner/repo format"),
      version: z.string().default("latest"),
      config: z.record(z.string(), z.unknown()).optional(),
    })
  ).default({}),
});

export type PresetConfig = z.infer<typeof PresetConfigSchema>;

export const VaultDoctorSchema = z.object({
  vaultPath: z.string(),
});

export type VaultDoctorInput = z.infer<typeof VaultDoctorSchema>;
