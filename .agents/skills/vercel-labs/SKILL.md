---
disable-model-invocation: true
name: vercel-labs
description: Index of Vercel Labs agent tools and skills. Use when choosing between agent-browser, the skills CLI, portless, opensrc, just-bash, json-render, or the vercel-labs/agent-skills guides (composition patterns, React Native, view transitions, Vercel cost/perf optimize, web design and writing guideline reviews).
---

# Vercel Labs index

Upstream: https://github.com/vercel-labs/<name>. No clone is kept in `third_party/` for these; read the version with `bun info <package>` or `gh api repos/vercel-labs/<name>/releases/latest` (pipe to `jaq`). Install JS tools with `bun add -g <package>`, never `npm`/`npx`/`bunx`.

## Tools

| Tool          | Use for                                                                              | Install / entry                                                                                   |
| ------------- | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------- |
| agent-browser | Browser automation CLI for agents (snapshot refs, click, fill, screenshot, Electron) | `bun add -g agent-browser && agent-browser install`; already installed on the PC (skill `agent-browser`) |
| skills (CLI)  | Install/manage agent skills across agents                                            | package `skills`; subcommands `add use list find check update init remove`. In this repo skills are versioned in `.agents/skills` |
| portless      | Stable `https://<name>.localhost` instead of ports                                   | `bun add -g portless`; `portless myapp <dev command>`; `portless alias api 8080`                  |
| opensrc       | Fetch/cache dependency source for agents                                             | `bun add -g opensrc`; `rg "x" $(opensrc path zod)`; `opensrc path pypi:requests`                  |
| just-bash     | In-process simulated bash for TS agents                                              | `import { Bash } from "just-bash"; new Bash()`                                                    |
| json-render   | Generative UI: catalog-constrained JSON -> React/RN/shadcn/Remotion                  | `bun add @json-render/core @json-render/react`                                                    |

Not indexed: agent-desktop (reached through the relay MCP, see skill `os-minimal-computer-use`), deepsec, fx, open-agents, scriptc, wterm.

## Skills from vercel-labs/agent-skills (sibling directories of this one)

| Skill                     | When                                                       |
| ------------------------- | ---------------------------------------------------------- |
| agent-browser             | Any web interaction via the agent-browser CLI              |
| composition-patterns      | Boolean-prop explosion, compound components, React 19 APIs |
| react-native-skills       | RN/Expo perf: lists, animations, native modules            |
| react-view-transitions    | `<ViewTransition>`, route/shared-element animations        |
| vercel-optimize           | Vercel bill / slow routes / CWV, metric-backed             |
| web-design-guidelines     | UI/a11y/UX review (fetches guidelines live)                |
| writing-guidelines        | Docs/prose style review                                    |

Not vendored: react-best-practices, deploy-to-vercel, vercel-cli-with-tokens, find-skills.
