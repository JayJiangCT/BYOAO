import { fs } from "../lib/cjs-modules.js";
import path from "node:path";
import { stat } from "node:fs/promises";
import { matter } from "../lib/cjs-modules.js";

export type DiagnosticCategory =
  | "frontmatter"
  | "orphan"
  | "agent-drift"
  | "broken-link"
  | "contradiction";

const LLM_WIKI_V2_AGENT_DIRS = ["entities", "concepts", "comparisons", "queries"] as const;

function isAgentWikiPage(relativePath: string): boolean {
  const top = relativePath.split(path.sep)[0];
  return (LLM_WIKI_V2_AGENT_DIRS as readonly string[]).includes(top);
}

export interface DiagnosticIssue {
  severity: "warning" | "info";
  category: DiagnosticCategory;
  file?: string;
  message: string;
}

export interface DiagnosticReport {
  summary: {
    totalNotes: number;
    healthyNotes: number;
    issueCount: number;
  };
  issues: DiagnosticIssue[];
}

/** Recursively collect all .md files (excluding .obsidian) */
async function collectMarkdownFiles(dir: string): Promise<string[]> {
  const results: string[] = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === ".obsidian" || entry.name === ".git") continue;
      results.push(...(await collectMarkdownFiles(fullPath)));
    } else if (entry.name.endsWith(".md")) {
      results.push(fullPath);
    }
  }
  return results;
}

/** Extract wikilink targets from content (skip code blocks) */
function extractWikilinks(content: string): string[] {
  const stripped = content
    .replace(/```[\s\S]*?```/g, "")
    .replace(/`[^`]+`/g, "");
  const matches = stripped.match(/\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g);
  if (!matches) return [];
  return matches.map((m) => m.replace(/\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/, "$1"));
}

export async function getVaultDiagnosis(vaultPath: string): Promise<DiagnosticReport> {
  const issues: DiagnosticIssue[] = [];

  const knowledgeDir = path.join(vaultPath, "Knowledge");
  if (await fs.pathExists(knowledgeDir)) {
    const mdUnderKnowledge = await collectMarkdownFiles(knowledgeDir);
    if (mdUnderKnowledge.length === 0) {
      issues.push({
        severity: "info",
        category: "orphan",
        message:
          "Folder `Knowledge/` exists but contains no markdown files. BYOAO v2 does not use this path (v1 legacy). You can remove the folder if you do not need it.",
      });
    }
  }

  const allFiles = await collectMarkdownFiles(vaultPath);
  const noteNames = new Set(
    allFiles.map((f) => path.basename(f, ".md"))
  );
  let healthyNotes = 0;

  // Check 1 & 2: Frontmatter — missing type or tags
  for (const filePath of allFiles) {
    const relativePath = path.relative(vaultPath, filePath);
    // Skip template files
    if (relativePath.startsWith("Knowledge/templates/")) continue;

    const content = await fs.readFile(filePath, "utf-8");
    const { data } = matter(content);
    let hasIssue = false;

    if (!data || Object.keys(data).length === 0) {
      issues.push({
        severity: "warning",
        category: "frontmatter",
        file: relativePath,
        message: "Missing frontmatter — no metadata defined",
      });
      hasIssue = true;
    } else {
      if (!data.type) {
        issues.push({
          severity: "warning",
          category: "frontmatter",
          file: relativePath,
          message: "Missing `type` in frontmatter",
        });
        hasIssue = true;
      }
      if (!data.tags || (Array.isArray(data.tags) && data.tags.length === 0)) {
        issues.push({
          severity: "info",
          category: "frontmatter",
          file: relativePath,
          message: "Missing `tags` in frontmatter",
        });
        hasIssue = true;
      }
    }

    const contra = data?.contradictions;
    const contraList =
      Array.isArray(contra) &&
      contra.some((x) => x != null && String(x).trim() !== "");
    const contraStr = typeof contra === "string" && contra.trim() !== "";
    if (contraList || contraStr) {
      issues.push({
        severity: "warning",
        category: "contradiction",
        file: relativePath,
        message:
          "Note lists `contradictions` in frontmatter — review conflicting claims against linked agent pages",
      });
    }

    if (!hasIssue) healthyNotes++;
  }

  // Check 3: AGENTS.md drift (check AGENTS.md first, fallback to AGENT.md)
  let agentContent: string | null = null;
  let agentResolvedPath = path.join(vaultPath, "AGENTS.md");
  if (await fs.pathExists(agentResolvedPath)) {
    agentContent = await fs.readFile(agentResolvedPath, "utf-8");
  } else {
    agentResolvedPath = path.join(vaultPath, "AGENT.md");
    if (await fs.pathExists(agentResolvedPath)) {
      agentContent = await fs.readFile(agentResolvedPath, "utf-8");
    }
  }
  if (agentContent !== null) {
    const agentLinks = extractWikilinks(agentContent);
    for (const linkTarget of agentLinks) {
      if (!noteNames.has(linkTarget)) {
        issues.push({
          severity: "warning",
          category: "agent-drift",
          message: `AGENTS.md links to [[${linkTarget}]] but no matching note found`,
        });
      }
    }
  }

  // LLM Wiki v2: agent directories and root index files
  for (const dirName of LLM_WIKI_V2_AGENT_DIRS) {
    const dirPath = path.join(vaultPath, dirName);
    const exists = await fs.pathExists(dirPath);
    const isDir = exists && (await stat(dirPath)).isDirectory();
    if (!isDir) {
      issues.push({
        severity: "warning",
        category: "agent-drift",
        message: `LLM Wiki v2: expected agent directory \`${dirName}/\` at vault root`,
      });
    }
  }
  const schemaPath = path.join(vaultPath, "SCHEMA.md");
  if (!(await fs.pathExists(schemaPath))) {
    issues.push({
      severity: "warning",
      category: "agent-drift",
      message: "LLM Wiki v2: missing SCHEMA.md at vault root",
    });
  }
  const logMdPath = path.join(vaultPath, "log.md");
  if (!(await fs.pathExists(logMdPath))) {
    issues.push({
      severity: "warning",
      category: "agent-drift",
      message: "LLM Wiki v2: missing log.md at vault root",
    });
  }

  // Check 4: Orphan notes (no incoming or outgoing wikilinks)
  const allLinksMap = new Map<string, Set<string>>();
  const incomingLinks = new Set<string>();

  for (const filePath of allFiles) {
    const content = await fs.readFile(filePath, "utf-8");
    const links = extractWikilinks(content);
    const name = path.basename(filePath, ".md");
    allLinksMap.set(name, new Set(links));
    for (const link of links) {
      incomingLinks.add(link);
    }
  }

  for (const filePath of allFiles) {
    const relativePath = path.relative(vaultPath, filePath);
    if (relativePath.startsWith("Knowledge/templates/")) continue;
    if (relativePath === "AGENT.md" || relativePath === "AGENTS.md") continue;
    if (isAgentWikiPage(relativePath)) continue;

    const name = path.basename(filePath, ".md");
    const outgoing = allLinksMap.get(name) || new Set();
    const hasIncoming = incomingLinks.has(name);
    const hasOutgoing = outgoing.size > 0;

    if (!hasIncoming && !hasOutgoing) {
      issues.push({
        severity: "info",
        category: "orphan",
        file: relativePath,
        message: "Orphan note — no incoming or outgoing wikilinks",
      });
    }
  }

  // Check 5: Broken wikilinks
  for (const filePath of allFiles) {
    const relativePath = path.relative(vaultPath, filePath);
    const content = await fs.readFile(filePath, "utf-8");
    const links = extractWikilinks(content);
    for (const link of links) {
      if (!noteNames.has(link)) {
        issues.push({
          severity: "warning",
          category: "broken-link",
          file: relativePath,
          message: `Broken wikilink: [[${link}]]`,
        });
      }
    }
  }

  return {
    summary: {
      totalNotes: allFiles.length,
      healthyNotes,
      issueCount: issues.length,
    },
    issues,
  };
}
