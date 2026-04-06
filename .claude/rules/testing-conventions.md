---
paths:
  - "byoao/**/__tests__/*.ts"
  - "byoao/**/*.test.ts"
---

# Testing Conventions

- Use `npx vitest run` for all tests, or `npx vitest run <path>` for a single file.
- Use `fs.mkdtemp` for temporary test directories.
- Clean up temp dirs in `afterEach`.
- Mock external dependencies with `vi.mock()` (mcp, obsidian-plugins, provider, etc.).
- Place test files in `__tests__/` directories adjacent to the code under test.
