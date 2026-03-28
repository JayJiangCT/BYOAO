import fs from "fs-extra";
import path from "node:path";
import matter from "gray-matter";
import { isObsidianCliAvailable, execObsidianCmd } from "./obsidian-cli.js";

export interface DiagnosticIssue {
  severity: "warning" | "info";
  category: "frontmatter" | "orphan" | "agent-drift" | "broken-link";
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

    if (!hasIssue) healthyNotes++;
  }

  // Check 3: AGENT.md drift
  const agentPath = path.join(vaultPath, "AGENT.md");
  if (await fs.pathExists(agentPath)) {
    const agentContent = await fs.readFile(agentPath, "utf-8");
    const agentLinks = extractWikilinks(agentContent);
    for (const linkTarget of agentLinks) {
      if (!noteNames.has(linkTarget)) {
        issues.push({
          severity: "warning",
          category: "agent-drift",
          message: `AGENT.md links to [[${linkTarget}]] but no matching note found`,
        });
      }
    }
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
    if (relativePath === "AGENT.md") continue;

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
