# Fusion: OpenClaw + Hermes ecosystems -> aphrody-labs/agent

Listed 2026-11-12 with `gh api orgs/openclaw/repos` (non-archived) and `gh api orgs/NousResearch/repos` (agent-related).
Forks: aphrody-labs/openclaw and aphrody-labs/hermes-agent (branch `windows-native`, see C:\src\docs\agents\WINDOWS-NATIVE-PORT.md, 16eea3d).
Status: done / partial / todo / skip (out of scope: macOS/Apple-only, org ops, forks of upstream tools we already fork).

## Rules
- OpenClaw (TS): moved to bun only (bun install/test/build, Bun.serve, Bun.$, bun:sqlite, bun:ffi, Bun.file, workers). Remove pnpm/node/tsx/vitest/esbuild, polyfills and utils that bun or `packages/core` already provide.
- Hermes (Python): stays under uv (`python/`), calls the core through pyo3 (crates) or bun:ffi; logic that duplicates OpenClaw goes into the shared TS modules.
- Home: one `~/.agent` (`agent init`), templates merged from OpenClaw workspace templates and Hermes SOUL.

## Core

| Repo | Target module | Status |
|---|---|---|
| openclaw/openclaw (agent loop, tools, memory, sessions) | packages/core (all reads through core/context.ts) | partial (loop, tools, memory, skills, heartbeat, home, context) |
| openclaw/openclaw (gateway, channels, plugins SDK) | packages/gateway, packages/plugins | todo |
| openclaw/openclaw docs/reference/templates | packages/core/templates/home | done |
| NousResearch/hermes-agent agent/, tools/ (memory, skills, learning loop, cron, compression) | packages/core + python/hermes | partial (skill lint/usage/curation, cron, memory) |
| NousResearch/hermes-agent acp_adapter | packages/gateway (ACP) | todo |
| NousResearch/hermes-agent SOUL / persona | templates/home/SOUL.md | done |
| openclaw/openclaw-windows-node, openclaw-windows-packaging (C#) | crates/windows (windows-rs) + MSIX in packaging/ | todo |
| openclaw/ocm (Rust manager) | crates/ocm | todo |

## Skills, plugins, registry

| Repo | Target | Status |
|---|---|---|
| openclaw/clawhub (skill + plugin registry) | packages/hub (client) + Workers deploy | todo |
| openclaw/agent-skills | skills/ (bundled) | todo |
| openclaw/clawscan (skill security scan, Go) | packages/hub scan (TS port) | todo |
| openclaw/babelfish (plugins from other agent apps) | packages/plugins compat | todo |
| openclaw/catalog (model catalog) | packages/core model catalog | todo |
| openclaw/kitchen-sink, plugin-inspector, crabpot, tidepool | packages/plugins test fixtures | todo |
| NousResearch/hermes-official-plugins, hermes-labs-plugins, hermes-example-plugins | python/plugins + plugin bridge | todo |
| NousResearch/hermes-plugin-{honcho,mem0,openviking,supermemory,retaindb,byterover} | memory provider interface in core | todo |
| NousResearch/hermes-plugin-{backsearch,sprites,solstice}, hermes-nvidia, hermes-collective-wisdom | plugins | todo |
| NousResearch/hermes-agent-self-evolution | core learning loop | todo |

## Protocols, tools, runtime libs

| Repo | Target | Status |
|---|---|---|
| openclaw/acpx (ACP client) | packages/gateway ACP | todo |
| openclaw/mcporter (MCP as TS API) | packages/mcp client | todo |
| openclaw/turnwire (MCP relay, Go) | packages/mcp relay | todo |
| openclaw/lobster (workflow shell) | packages/core workflows (Vercel Workflow) | todo |
| openclaw/libterminal | packages/tui | todo |
| openclaw/fs-safe, proc-safe, proxyline | core sandbox/fs (bun-native) | todo |
| openclaw/clawrouter (provider router) | core/model.ts + AI Gateway | partial |
| openclaw/clawpdf, ffmpeg-wasm, libopus-wasm, rastermill | packages/media | todo |
| openclaw/carapace (design tokens) | apps/web | todo |
| openclaw/collab, cookbook, uirouter, reef, hermit, krillswitch, crabhelm, openclaw-atif | evaluate per repo | todo |

## Channels and crawlers

| Repo | Target | Status |
|---|---|---|
| openclaw/wacli, wacrawl, telecrawl, slacrawl, discrawl, imsgcrawl, notcrawl, graincrawl, photoscrawl, gitcrawl, birdclaw, crawlkit (Go) | packages/gateway channels via Chat SDK + packages/crawl (TS, bun:sqlite) | todo |
| openclaw/crabline (mock channel server) | gateway tests | todo |
| openclaw/clickclack, clawdex, clawgo, esp-openclaw-node (C) | evaluate (esp node -> firmware/) | todo |
| openclaw/gogcli, goplaces, spogo, remindctl | tools via MCP | todo |

## Eval, ops

| Repo | Target | Status |
|---|---|---|
| openclaw/Kova, clawgrit-reports, openclaw-rtt | bench/ | todo |
| NousResearch/hermes-toolperf-evals, hermes-compression-eval, harbor-fork | evals/ | todo |
| openclaw/crabbox, crabfleet, clawpatch, clawsweeper* , octopool, releases, release-workflows, telemetry, docs, ask-molty, community, rfcs, homebrew-tap, nix-openclaw*, openclaw-ansible, openclaw-enterprise | skip or infra/ later | skip |
| openclaw/bun, WebKit | already forked (aphrody-labs/bun) | skip |
| openclaw/Peekaboo, AXorcist, Swabble, Tachikoma, imsg, crawlbar, openclaw-facetime | macOS-only | skip |
| NousResearch/NemoClaw (OpenClaw in NVIDIA OpenShell) | sandbox backend | todo |
| NousResearch/RL, tinker-atropos, vllm, lighteval, Hermes-Function-Calling | inference/training, out of agent core | skip |
| NousResearch/autonovel, pokemon-agent, cline, nousflash-agents, local_generative_agents, agent-governance-toolkit, hermes-paperclip-adapter | examples / evaluate | skip |
