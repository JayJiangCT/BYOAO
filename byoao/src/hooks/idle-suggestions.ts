/**
 * Returns a suggestion string for BYOAO commands.
 * MVP: simple rotation. Future: context-aware.
 */
export function getIdleSuggestion(): string | null {
  const suggestions = [
    "Tip: run /weave to connect your notes with frontmatter and wikilinks",
    "Tip: run /trace to see how an idea evolved over time",
    "Tip: run /emerge to discover patterns across your notes",
    "Tip: run /connect to bridge two topics using your vault's link graph",
    "Tip: run /ideas to generate actionable insights from your vault",
    "Tip: run /challenge to pressure-test a belief against your own notes",
    "Tip: run /drift to compare intentions vs actions over the past month",
    "Tip: run /diagnose to check knowledge graph health",
    "Tip: run /explain to document a codebase system in your vault",
  ];
  const idx = new Date().getMinutes() % suggestions.length;
  return suggestions[idx];
}
