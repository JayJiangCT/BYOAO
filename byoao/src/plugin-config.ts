import { z } from "zod";

export const MemberSchema = z.object({
  name: z.string(),
  role: z.string().default(""),
});

export const ProjectSchema = z.object({
  name: z.string(),
  description: z.string().default(""),
});

export const GlossaryEntrySchema = z.object({
  term: z.string(),
  definition: z.string(),
});

export const VaultConfigSchema = z.object({
  teamName: z.string().min(1),
  vaultPath: z.string(),
  members: z.array(MemberSchema).default([]),
  projects: z.array(ProjectSchema).default([]),
  glossaryEntries: z.array(GlossaryEntrySchema).default([]),
  jiraHost: z.string().default(""),
  jiraProject: z.string().default(""),
  preset: z.string().default("pm-tpm"),
});

export type Member = z.infer<typeof MemberSchema>;
export type Project = z.infer<typeof ProjectSchema>;
export type GlossaryEntry = z.infer<typeof GlossaryEntrySchema>;
export type VaultConfig = z.infer<typeof VaultConfigSchema>;

export const AddMemberSchema = z.object({
  vaultPath: z.string(),
  name: z.string(),
  role: z.string().default(""),
  team: z.string().default(""),
});

export const AddProjectSchema = z.object({
  vaultPath: z.string(),
  name: z.string(),
  description: z.string().default(""),
  team: z.string().default(""),
});

export const AddGlossaryTermSchema = z.object({
  vaultPath: z.string(),
  term: z.string(),
  definition: z.string(),
});

export const VaultStatusSchema = z.object({
  vaultPath: z.string(),
});

// --- Preset System ---

export const PresetConfigSchema = z.object({
  name: z.string().min(1),
  displayName: z.string().min(1),
  description: z.string(),
  directories: z.array(z.string()).default([]),
  agentDescription: z.string(),
  frontmatterExtras: z.record(z.string(), z.array(z.string())).default({}),
  templates: z.array(z.string()).default([]),
  mcpServers: z.record(
    z.string(),
    z.object({
      type: z.literal("remote"),
      url: z.string().url(),
    })
  ).default({}),
});

export type PresetConfig = z.infer<typeof PresetConfigSchema>;

export const VaultDoctorSchema = z.object({
  vaultPath: z.string(),
});

export type VaultDoctorInput = z.infer<typeof VaultDoctorSchema>;

export type AddMemberInput = z.infer<typeof AddMemberSchema>;
export type AddProjectInput = z.infer<typeof AddProjectSchema>;
export type AddGlossaryTermInput = z.infer<typeof AddGlossaryTermSchema>;
