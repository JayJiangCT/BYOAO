/**
 * Returns a suggestion string for BYOAO commands.
 * MVP: simple rotation. Future: context-aware.
 */
export function getIdleSuggestion(): string | null {
  const suggestions = [
    "Tip: run /diagnose to check knowledge graph health",
    "Tip: run /weave to connect your notes with frontmatter and wikilinks",
    "Tip: run /explain to document a codebase system in your vault",
  ];
  const idx = new Date().getMinutes() % suggestions.length;
  return suggestions[idx];
}
