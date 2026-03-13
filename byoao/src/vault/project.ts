import fs from "fs-extra";
import path from "node:path";
import { today } from "./template.js";
import type { AddProjectInput } from "../plugin-config.js";

export interface AddProjectResult {
  filePath: string;
  wikilinksAdded: number;
}

export async function addProject(input: AddProjectInput): Promise<AddProjectResult> {
  const { vaultPath, name, description, team } = input;
  let wikilinksAdded = 0;

  // 1. Create project note
  const projectPath = path.join(vaultPath, `Projects/${name}.md`);
  if (await fs.pathExists(projectPath)) {
    throw new Error(`Project note already exists: ${projectPath}`);
  }

  const content = `---
title: "${name}"
type: feature
status: active
date: ${today()}
team: "${team}"
jira: ""
stakeholders: []
priority: ""
tags: [project]
---

# ${name}

${description}
`;
  await fs.writeFile(projectPath, content);

  // 2. Update team index if it exists
  const peoplePath = path.join(vaultPath, "People");
  if (await fs.pathExists(peoplePath)) {
    const teamFiles = await fs.readdir(peoplePath);
    const teamIndexFile = teamFiles.find((f) => f.endsWith("Team.md"));

    if (teamIndexFile) {
      const teamIndexPath = path.join(peoplePath, teamIndexFile);
      let teamContent = await fs.readFile(teamIndexPath, "utf-8");

      const projectLine = `- [[${name}]] — ${description}`;
      if (teamContent.includes("(No projects added yet)")) {
        teamContent = teamContent.replace("(No projects added yet)", projectLine);
      } else if (teamContent.includes("## Active Projects")) {
        // Append to the projects section
        teamContent = teamContent.replace(
          /(## Active Projects\n\n)([\s\S]*?)(\n\n|$)/,
          `$1$2\n${projectLine}$3`
        );
      }
      wikilinksAdded++;
      await fs.writeFile(teamIndexPath, teamContent);
    }
  }

  // 3. Update AGENT.md wikilinks
  for (const agentFile of ["AGENT.md", "CLAUDE.md"]) {
    const agentPath = path.join(vaultPath, agentFile);
    if (await fs.pathExists(agentPath)) {
      let agentContent = await fs.readFile(agentPath, "utf-8");

      const projectLine = `- [[${name}]] — ${description}`;
      if (agentContent.includes("(No projects added yet")) {
        agentContent = agentContent.replace(
          /\(No projects added yet[^)]*\)/,
          projectLine
        );
        wikilinksAdded++;
      } else if (agentContent.includes("## Active Projects")) {
        agentContent = agentContent.replace(
          /(## Active Projects[^\n]*\n\n)([\s\S]*?)(\n\n|$)/,
          `$1$2\n${projectLine}$3`
        );
        wikilinksAdded++;
      }

      await fs.writeFile(agentPath, agentContent);
    }
  }

  return { filePath: projectPath, wikilinksAdded };
}
