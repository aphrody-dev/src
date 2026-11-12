# agent

Unified agent stack (core, memory, skills, surfaces, inference). See `docs/ARCHITECTURE.md` and `docs/ROADMAP.md`.

```sh
bun install
bun test packages
AGENT_MODEL=anthropic:claude-opus-5-5 bun packages/core/src/cli.ts run "summarize README.md into notes.md"
```

License: MIT OR Apache-2.0. Third-party notices in `NOTICE` and `licenses/`.
