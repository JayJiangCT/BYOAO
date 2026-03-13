import fs from "fs-extra";
import path from "node:path";
import matter from "gray-matter";
import { today } from "./template.js";
import type { AddMemberInput } from "../plugin-config.js";

export interface AddMemberResult {
  filePath: string;
  wikilinksAdded: number;
}

export async function addMember(input: AddMemberInput): Promise<AddMemberResult> {
  const { vaultPath, name, role, team } = input;
  let wikilinksAdded = 0;

  // 1. Create person note
  const personPath = path.join(vaultPath, `People/${name}.md`);
  if (await fs.pathExists(personPath)) {
    throw new Error(`Person note already exists: ${personPath}`);
  }

  const content = `---
title: "${name}"
type: person
team: "${team}"
role: "${role}"
status: active
tags: [person]
---

# ${name}

**Role**: ${role}
**Team**: ${team}
`;
  await fs.writeFile(personPath, content);

  // 2. Update team index if it exists
  const teamFiles = await fs.readdir(path.join(vaultPath, "People"));
  const teamIndexFile = teamFiles.find((f) => f.endsWith("Team.md"));

  if (teamIndexFile) {
    const teamIndexPath = path.join(vaultPath, "People", teamIndexFile);
    let teamContent = await fs.readFile(teamIndexPath, "utf-8");

    // Add to members table
    const tableRow = `| [[${name}]] | ${role} |`;
    if (teamContent.includes("|------|------|")) {
      // Insert after the table header separator
      teamContent = teamContent.replace(
        /(^\|------|------\|$)/m,
        `$1\n${tableRow}`
      );
      wikilinksAdded++;
    }

    await fs.writeFile(teamIndexPath, teamContent);
  }

  // 3. Update AGENT.md wikilinks
  for (const agentFile of ["AGENT.md", "CLAUDE.md"]) {
    const agentPath = path.join(vaultPath, agentFile);
    if (await fs.pathExists(agentPath)) {
      let agentContent = await fs.readFile(agentPath, "utf-8");

      // Replace placeholder if present
      if (agentContent.includes("(No members added yet")) {
        const table = `| Name | Role |\n|------|------|\n| [[${name}]] | ${role} |`;
        agentContent = agentContent.replace(
          /\(No members added yet[^)]*\)/,
          table
        );
        wikilinksAdded++;
      } else if (agentContent.includes("|------|------|")) {
        // Find the team table section and add a row
        const teamSectionMatch = agentContent.match(
          /## Team[^\n]*\n[\s\S]*?(\|------|------\|[^\n]*(?:\n\|[^\n]*)*)/
        );
        if (teamSectionMatch) {
          const existingTable = teamSectionMatch[1];
          const newTable = existingTable + `\n| [[${name}]] | ${role} |`;
          agentContent = agentContent.replace(existingTable, newTable);
          wikilinksAdded++;
        }
      }

      await fs.writeFile(agentPath, agentContent);
    }
  }

  return { filePath: personPath, wikilinksAdded };
}
