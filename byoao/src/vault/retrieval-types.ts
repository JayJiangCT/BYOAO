/** Status codes for retrieval tool responses. */
export type RetrievalStatus =
  | "ok"
  | "no_results"
  | "fallback_used"
  | "runtime_unavailable"
  | "error";

/** A single result item returned by a retrieval tool. */
export interface RetrievalResultItem {
  /** Note title (basename without .md) */
  title: string;
  /** Vault-relative path */
  path: string;
  /** Canonical note name for follow-up calls */
  file: string;
  /** Context snippet (max 240 chars) */
  snippet?: string;
  /** Optional metadata (counts, tags, property values) */
  metadata?: Record<string, unknown>;
}

/** Normalized response shape for all BYOAO retrieval tools. */
export interface RetrievalResult {
  /** Obsidian CLI command family used */
  mode: string;
  /** Targeted vault name or path */
  vault: string;
  /** Outcome status */
  status: RetrievalStatus;
  /** Short human-readable summary */
  summary: string;
  /** Result items */
  results: RetrievalResultItem[];
  /** Whether results were truncated */
  truncated: boolean;
  /** Total matches before truncation (if known) */
  totalMatches?: number;
  /** Fallback mechanism used, or "none" */
  fallback: string;
  /** Optional diagnostic notes */
  diagnostics: string[];
}

/** Default maximum number of results to return. */
export const DEFAULT_RESULT_LIMIT = 20;

/** Default maximum snippet length per result (characters). */
export const MAX_SNIPPET_LENGTH = 240;
