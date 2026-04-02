<p align="center">
  <pre align="center">
  ██████╗ ██╗   ██╗ ██████╗   ██╗    ██████╗
  ██╔══██╗╚██╗ ██╔╝██╔═══██╗ ████╗  ██╔═══██╗
  ██████╔╝ ╚████╔╝ ██║   ██║██╔══██╗██║   ██║
  ██╔══██╗  ╚██╔╝  ██║   ██║██║  ██║██║   ██║
  ██████╔╝   ██║   ╚██████╔╝██║  ██║╚██████╔╝
  ╚═════╝    ╚═╝    ╚═════╝ ╚═╝  ╚═╝ ╚═════╝
  </pre>
  <strong>Build Your Own AI OS</strong>
  <br/>
  <em>Turn Obsidian into an AI-powered personal knowledge graph</em>
  <br/><br/>
  <a href="https://www.npmjs.com/package/@jayjiang/byoao"><img src="https://img.shields.io/npm/v/@jayjiang/byoao?style=flat-square" alt="npm version"></a>
  <a href="https://github.com/JayJiangCT/BYOAO/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue?style=flat-square" alt="license"></a>
</p>

---

## What is BYOAO?

BYOAO is an [OpenCode](https://opencode.ai) plugin that turns [Obsidian](https://obsidian.md) into an AI-powered personal knowledge OS. Write notes freely, then let AI connect the dots — building a knowledge graph from your scattered files.

- **Local-first** — your data stays on your machine
- **AI-native** — `AGENT.md` lets AI agents navigate your knowledge graph without RAG
- **Start minimal** — 3 directories, structure emerges from your content via `/weave`

## Quick Start

```bash
npm install -g @jayjiang/byoao
byoao install
byoao init
```

Then open in Obsidian, enable CLI, and run `/weave` to connect your notes.

**[Read the full guide](guide/en/index.md)** for detailed setup and usage.

## What You Get

| Component | Description |
|-----------|-------------|
| `/weave` | Connect notes into a knowledge graph — frontmatter, wikilinks, Glossary |
| `/organize` | Reorganize vault directories safely via Obsidian CLI |
| `/trace` | Track how an idea evolved over time |
| `/emerge` | Surface hidden patterns across your notes |
| `/connect` | Bridge two seemingly unrelated topics |
| `/ideas` | Generate actionable ideas from your vault |
| `/challenge` | Pressure-test a belief against your own notes |
| `/drift` | Compare stated intentions vs actual behavior |
| `/diagnose` | Check knowledge graph health |

## Documentation

- **[English Guide](guide/en/index.md)** — Full documentation
- **[中文文档](guide/zh/index.md)** — 完整中文文档

## Roadmap

- [x] Personal KB with minimal preset (v0.6)
- [x] `/weave` — knowledge graph builder (v0.6)
- [x] Mode A/B init — fresh + existing folder adoption (v0.6)
- [x] `/trace`, `/emerge`, `/connect` — thinking tools (v0.7)
- [x] `/ideas`, `/challenge`, `/drift` — proactive intelligence (v0.8)
- [ ] Engineer and Designer presets

## License

MIT
