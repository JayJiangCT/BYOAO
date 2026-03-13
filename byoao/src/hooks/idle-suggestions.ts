/**
 * Returns a suggestion string for BYOAO commands.
 * MVP: simple rotation. Future: context-aware.
 */
export function getIdleSuggestion(): string | null {
  const suggestions = [
    "Tip: run /vault-doctor to check vault health",
    "Tip: run /enrich-document to add frontmatter and wikilinks to a note",
    "Tip: run /system-explainer to document a codebase system in your vault",
  ];
  const idx = new Date().getMinutes() % suggestions.length;
  return suggestions[idx];
}
