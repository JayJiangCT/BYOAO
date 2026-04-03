# Changelog

All notable changes to BYOAO (`@jayjiang/byoao`) are documented in this file.

## [v1.0.0-rc-2] - 2026-04-02

### Fixed

- **CLI (`byoao init --from`)**: When adopting an existing directory (`existing` or `obsidian-vault` init modes), the knowledge base name is derived from the folder basename without showing the interactive “Knowledge base name” prompt. Creating a fresh vault is unchanged. `--kb` still overrides the name when provided.

## [v1.0.0-rc] - 2026-04-02

First 1.0 release candidate: onboarding overhaul, `/organize` skill, mandatory date frontmatter.
