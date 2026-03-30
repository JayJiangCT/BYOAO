/**
 * Returns a suggestion string for BYOAO commands.
 * MVP: simple rotation. Future: context-aware.
 */
export function getIdleSuggestion(): string | null {
  const suggestions = [
    "Tip: run /diagnose to check knowledge graph health",
    "Tip: run /weave to connect your notes with frontmatter and wikilinks",
    "Tip: run /explain to document a codebase system in your vault",
    "Tip: run /trace to see how an idea evolved over time",
    "Tip: run /emerge to discover patterns across your notes",
    "Tip: run /connect to bridge two topics using your vault's link graph",
  ];
  const idx = new Date().getMinutes() % suggestions.length;
  return suggestions[idx];
}
