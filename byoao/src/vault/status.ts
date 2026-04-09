import { fs } from "../lib/cjs-modules.js";
import path from "node:path";

export interface VaultStatus {
  exists: boolean;
  vaultPath: string;
  noteCount: number;
  wikilinkCount: number;
  brokenLinks: string[];
  directories: Record<string, number>;
  hasObsidianConfig: boolean;
  hasAgentMd: boolean;
  /** LLM Wiki v2: markdown page counts per agent-maintained directory */
  agentPages: {
    entities: number;
    concepts: number;
    comparisons: number;
    queries: number;
  };
  /** LLM Wiki v2: SCHEMA.md present at vault root */
  hasSchema: boolean;
  /** LLM Wiki v2: log.md present at vault root */
  hasLog: boolean;
  /** LLM Wiki v2: INDEX.base (Obsidian Base) present at vault root */
  hasIndexBase: boolean;
}

async function countFilesInDir(dirPath: string, ext = ".md"): Promise<number> {
  if (!(await fs.pathExists(dirPath))) return 0;
  const files = await fs.readdir(dirPath);
  return files.filter((f) => f.endsWith(ext)).length;
}

async function getAllMarkdownFiles(dirPath: string): Promise<string[]> {
  const results: string[] = [];

  async function walk(dir: string) {
    if (!(await fs.pathExists(dir))) return;
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        // Skip .obsidian and hidden dirs
        if (!entry.name.startsWith(".")) {
          await walk(fullPath);
        }
      } else if (entry.name.endsWith(".md")) {
        results.push(fullPath);
      }
    }
  }

  await walk(dirPath);
  return results;
}

function extractWikilinks(content: string): string[] {
  // Strip code blocks and inline code before extracting wikilinks
  const stripped = content
    .replace(/```[\s\S]*?```/g, "")   // fenced code blocks
    .replace(/`[^`]+`/g, "");          // inline code
  const matches = stripped.match(/\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g);
  if (!matches) return [];
  return matches.map((m) => m.replace(/\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/, "$1"));
}

export async function getVaultStatus(vaultPath: string): Promise<VaultStatus> {
  const exists = await fs.pathExists(vaultPath);
  if (!exists) {
    return {
      exists: false,
      vaultPath,
      noteCount: 0,
      wikilinkCount: 0,
      brokenLinks: [],
      directories: {},
      hasObsidianConfig: false,
      hasAgentMd: false,
      agentPages: { entities: 0, concepts: 0, comparisons: 0, queries: 0 },
      hasSchema: false,
      hasLog: false,
      hasIndexBase: false,
    };
  }

  const allFiles = await getAllMarkdownFiles(vaultPath);
  const noteNames = new Set(
    allFiles.map((f) => path.basename(f, ".md"))
  );

  // Count wikilinks and find broken ones
  let wikilinkCount = 0;
  const brokenLinksSet = new Set<string>();

  for (const file of allFiles) {
    const content = await fs.readFile(file, "utf-8");
    const links = extractWikilinks(content);
    wikilinkCount += links.length;

    for (const link of links) {
      if (!noteNames.has(link)) {
        brokenLinksSet.add(link);
      }
    }
  }

  // Count per directory
  const directories: Record<string, number> = {};
  const topDirs = [
    "Inbox",
    "Projects",
    "Sprints",
    "Knowledge",
    "People",
    "Systems",
    "Archive",
    "Daily",
  ];
  for (const dir of topDirs) {
    const dirPath = path.join(vaultPath, dir);
    if (await fs.pathExists(dirPath)) {
      const files = await getAllMarkdownFiles(dirPath);
      directories[dir] = files.length;
    }
  }

  const agentDirNames = ["entities", "concepts", "comparisons", "queries"] as const;
  const agentPages = {
    entities: 0,
    concepts: 0,
    comparisons: 0,
    queries: 0,
  };
  for (const name of agentDirNames) {
    const dirPath = path.join(vaultPath, name);
    const mdFiles = await getAllMarkdownFiles(dirPath);
    agentPages[name] = mdFiles.length;
  }

  return {
    exists: true,
    vaultPath,
    noteCount: allFiles.length,
    wikilinkCount,
    brokenLinks: Array.from(brokenLinksSet),
    directories,
    hasObsidianConfig: await fs.pathExists(path.join(vaultPath, ".obsidian")),
    hasAgentMd: await fs.pathExists(path.join(vaultPath, "AGENTS.md")) ||
                await fs.pathExists(path.join(vaultPath, "AGENT.md")),
    agentPages,
    hasSchema: await fs.pathExists(path.join(vaultPath, "SCHEMA.md")),
    hasLog: await fs.pathExists(path.join(vaultPath, "log.md")),
    hasIndexBase: await fs.pathExists(path.join(vaultPath, "INDEX.base")),
  };
}

export function formatVaultStatus(status: VaultStatus): string {
  if (!status.exists) {
    return `❌ Vault not found at: ${status.vaultPath}`;
  }

  const lines: string[] = [
    `📂 Vault: ${status.vaultPath}`,
    `📝 Notes: ${status.noteCount}`,
    `🔗 Wikilinks: ${status.wikilinkCount}`,
    "",
    "Directory breakdown:",
  ];

  for (const [dir, count] of Object.entries(status.directories)) {
    lines.push(`  ${dir}: ${count} notes`);
  }

  lines.push("");
  lines.push(`Config: ${status.hasObsidianConfig ? "✓" : "✗"} .obsidian/`);
  lines.push(`Agent:  ${status.hasAgentMd ? "✓" : "✗"} AGENTS.md`);
  lines.push("");
  lines.push("LLM Wiki v2 (agent pages):");
  lines.push(
    `  entities: ${status.agentPages.entities} · concepts: ${status.agentPages.concepts} · comparisons: ${status.agentPages.comparisons} · queries: ${status.agentPages.queries}`
  );
  lines.push(
    `  SCHEMA.md: ${status.hasSchema ? "✓" : "✗"} · log.md: ${status.hasLog ? "✓" : "✗"} · INDEX.base: ${status.hasIndexBase ? "✓" : "✗"}`
  );

  if (status.brokenLinks.length > 0) {
    lines.push("");
    lines.push(`⚠️ Broken links (${status.brokenLinks.length}):`);
    for (const link of status.brokenLinks.slice(0, 10)) {
      lines.push(`  - [[${link}]]`);
    }
    if (status.brokenLinks.length > 10) {
      lines.push(`  ... and ${status.brokenLinks.length - 10} more`);
    }
  } else {
    lines.push("\n✓ No broken links");
  }

  return lines.join("\n");
}
