---
paths:
  - "byoao/**/*.ts"
---

# Coding Standards

- **All imports must include `.js` extensions** — TS is configured as ESM (`"module": "ESNext"`).
- **`src/index.ts` must export ONLY `BYOAOPlugin`** — OpenCode treats every export as a plugin instance.
- **All paths are relative to `byoao/`**, not the repo root.
- **Use Zod schemas** in `src/plugin-config.ts` for all config validation (`VaultConfig`, `PresetConfig`, `Member`, `Project`, `GlossaryEntry`).
- **Use Handlebars** (`.hbs` files) for templates — they render AGENTS.md, glossary, and vault scaffolding.
- **Parse frontmatter with `gray-matter`** for note metadata; extract wikilinks via regex for graph structure.
