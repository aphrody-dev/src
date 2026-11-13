---
name: vercel-labs
description: Index of Vercel Labs agent tools and skills. Use when choosing between agent-browser, skills CLI (npx skills), portless, opensrc, just-bash, json-render, or the vercel-labs/agent-skills guides (composition patterns, React Native, view transitions, Vercel cost/perf optimize, web design and writing guideline reviews). Triggers on "install a skill", "npx skills", "browser automation CLI", "named localhost URLs", "read a package's source", "sandboxed bash for agents", "generative UI from JSON".
---

# Vercel Labs index

Sources: local clones `C:\src\third_party\labs\vercel-labs\*` (commit/date = `git log -1`, checked 2026-11-12). Versions from each `package.json` in the clone, not npm registry (registry latest unverified).

## Tools

| Tool          | Use for                                                                              | Install / entry                                                                                                             | Version @ commit                   | License                      |
| ------------- | ------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------- | ---------------------------------- | ---------------------------- |
| agent-browser | Browser automation CLI for agents (snapshot refs, click, fill, screenshot, Electron) | `npm i -g agent-browser && agent-browser install` (`--with-deps` on Linux); no install: `npx agent-browser open google.com` | 0.42.0 @ d129226 (2026-11-10)      | see ../agent-browser/LICENSE |
| skills (CLI)  | Install/manage agent skills across agents                                            | `npx skills add <owner/repo>[@ref] [--skill <name>] [-a claude-code]`; subcommands `use list find check update init remove` | 1.8.0 @ 1d2bf37 (2026-11-10)       | MIT                          |
| portless      | Stable `https://<name>.localhost` instead of ports                                   | `npm i -g portless`; `portless myapp next dev`; `portless alias api 8080`; skill: `npx skills add vercel-labs/portless`     | 0.17.0 @ 72b5548 (2026-11-10)      | Apache-2.0                   |
| opensrc       | Fetch/cache dependency source for agents                                             | `npm i -g opensrc`; `rg "x" $(opensrc path zod)`; `opensrc path pypi:requests`                                              | 0.7.3 @ b51de60 (2026-09-16)       | Apache-2.0                   |
| just-bash     | In-process simulated bash for TS agents                                              | `import { Bash } from "just-bash"; new Bash()`                                                                              | 3.6.0 @ 7a2a7a5 (2026-10-22)       | Apache-2.0                   |
| json-render   | Generative UI: catalog-constrained JSON -> React/RN/shadcn/Remotion                  | `npm i @json-render/core @json-render/react`                                                                                | core 0.22.0 @ 1819412 (2026-11-04) | Apache-2.0                   |

Not indexed (clones present, not reviewed): agent-desktop, deepsec, fx, open-agents, scriptc, wterm.

## Bundled skills (this directory)

| Skill dir                      | name                          | When                                                       |
| ------------------------------ | ----------------------------- | ---------------------------------------------------------- |
| skills/agent-browser/          | agent-browser                 | Any web interaction via the agent-browser CLI              |
| skills/composition-patterns/   | vercel-composition-patterns   | Boolean-prop explosion, compound components, React 19 APIs |
| skills/react-native-skills/    | vercel-react-native-skills    | RN/Expo perf: lists, animations, native modules            |
| skills/react-view-transitions/ | vercel-react-view-transitions | `<ViewTransition>`, route/shared-element animations        |
| skills/vercel-optimize/        | vercel-optimize               | Vercel bill / slow routes / CWV, metric-backed             |
| skills/web-design-guidelines/  | web-design-guidelines         | UI/a11y/UX review (fetches guidelines live)                |
| skills/writing-guidelines/     | writing-guidelines            | Docs/prose style review                                    |

Skipped (already in installed `vercel` plugin): react-best-practices (`vercel:react-best-practices`), deploy-to-vercel (`vercel:deploy`), vercel-cli-with-tokens (`vercel:vercel-cli`), skills/find-skills (use `npx skills find`).

agent-skills upstream: `npx skills add vercel-labs/agent-skills` @ 1a2c79d (2026-10-27), MIT (README). Notices: each skill dir `LICENSE`, `references/LICENSE-skills-cli.txt`.
