# Reproducible agent tooling (skills, plugins, MCP)

Date: 2026-11-13. Source of truth: `infra/agents/toolchain.toml`. Applier: `packages/machine/src/toolchain.ts` (called by `packages/machine/src/apply-user.ts` on the PC; `just agents-sync [--check]`).

## Cause of the defect

- Claude Code loads `.agents/skills` (42 skills at the time) only for a session launched in `C:\src`. Launched elsewhere (`C:\Users\aphro\nt`, neutral folder, fleet runners), it only saw the 12 folders of `~/.claude/skills`, placed by hand.
- Plugins, marketplaces and MCPs were installed by hand, without a manifest: nothing reproduced them on another machine.
- `C:\Users\aphro\nt` is an empty leftover (an empty `C` subfolder). What still points to it: the `projects` entry of `~/.claude.json`, the memory folder `~/.claude/projects/C--Users-aphro-nt` and two comments (`packages/machine/shell.dsc.winget`, `packages/shell-matrix/src/cases.ts`, real target: `apps/nt/docs/research/shell-replacement.md`).

## Mechanism (no link, no copy in the repository)

- Root marketplace `aphrody`: `.claude-plugin/marketplace.json`, at the root of src. It replaces `plugins/.claude-plugin/marketplace.json` (`claude plugin marketplace add C:\src` repoints it without uninstalling its plugins). Codex reads the same file (`.claude-plugin/marketplace.json` is one of the paths of `codex-rs/core-plugins/src/marketplace.rs`, openai/codex@aa5f492031f7).
- Plugin `aphrody-skills`: its root is `.agents` (manifest `.agents/.claude-plugin/plugin.json`, Gemini extension `.agents/gemini-extension.json`). Its skills are `.agents/skills`, the single source. Each CLI keeps a copy in its own cache: Claude in `~/.claude/plugins/cache/aphrody/aphrody-skills/<sha>`, Codex in `~/.codex/plugins/cache`, agy in `~/.gemini/config/plugins`. The applier copies again as soon as the HEAD of src changes (`refresh = true`, state in `~/.cache/aphrody/agents-sync.json`).
- The 9 generic skills of `~/.claude/skills` are now in `.agents/skills`: bun, bun-ffi, fleet, gh-fork, learn, llvm-toolchain, microsoft, r2, tree-sitter. Three remain specific to the PC (`[[skill.private]]`, outside the public repository): windows-machine, chrome, shell.
- aphrody-labs forks pinned by sha in the marketplace: `vercel-agent-skills` (vercel-labs/agent-skills@1a2c79d4e6c4), `web-quality-skills` (addyosmani/web-quality-skills@afa8da942115: Lighthouse, Core Web Vitals). The Stitch skills are provided by `.agents/skills/stitch-*`, the `web-design-guidelines` copy by vercel-agent-skills: the duplicates are removed.
- Settings: only the CLIs modify them (`claude plugin marketplace add|install|enable|disable|update`, `claude mcp add|remove`, `codex plugin marketplace add`, `codex plugin add`, `agy plugin install`, `gemini extensions link`). The applier never rewrites `settings.json`. MCP state is read from `~/.claude.json`, without writing to it.
- Secrets: `secrets = ["NAME"]` on an MCP entry. The server is launched by `bun packages/env-kit/src/cli.ts secret exec NAME -- <cmd>`, so that the value goes through neither settings nor argv. hostinger-api had its token in plain text in `~/.claude.json`: the entry was replaced.
- Forbidden links: `[cleanup] link_dirs`. The applier removes any symlink or junction that points to a skill already provided by aphrody-skills (16 links removed from `~/.gemini/skills` on 2026-11-13).

## Targets per agent

| Agent | Mechanism | Verification |
|---|---|---|
| Claude Code | marketplace `aphrody` + plugins `[[claude.plugin]]`, MCP `[[claude.mcp]]`, pinned skills `[[claude.skill]]` | `claude plugin list`, `claude mcp list`, `claude -p --output-format stream-json --verbose` (init event, `skills` field) |
| Codex | `codex plugin marketplace add <src>` + `codex plugin add aphrody-skills@aphrody` (only local sources are listed by Codex) | `codex plugin list` |
| agy | `agy plugin install <plugin folder>` (local source, or Claude cache for a GitHub plugin); vercel-agent-skills refused (no manifest) | `agy plugin list --json` |
| Gemini CLI | `gemini extensions link <src>/.agents` | CLI absent from the PC and the fleet on 2026-11-13 |

The `hosts` field is pc, prd, fr1 or fr2 (absent: all). On Linux, the host is read from `HOST=` in `/etc/fleet/resilience.conf` and the root is that of the checkout running the applier.

## Measurements of 2026-11-13 (PC)

- `claude -p` session launched from a neutral folder: 207 skills, including 69 aphrody-skills (before: 12 user skills, and no src skill outside `C:\src`), 21 plugins, 13 MCPs (hostinger-api connected via env-kit).
- agy: aphrody-skills (69 skills) and web-quality-skills (6). Codex: aphrody-skills installed and enabled (69 skills).
- `just agents-sync --check`: no gap.

## Automatic execution

- Single front: `ay agents install|sync|check|list` (crates/ay, bun route to `packages/machine/src/toolchain.ts`), `just agents-sync [check]`. The other `ay agents` verbs remain the ai-os orchestrator.
- PC: tasks `\\Aphrody\\AgentsSync` (every hour) and `\\Aphrody\\AgentsSyncLogon` (at logon), set up by `infra/agents/install-pc.sh`; `apply-user.ts` also calls the applier.
- Fleet: `infra/fleet/bin/agents-sync.sh` launched by `aphrody-agents-sync.timer` (every hour, after `src-checkout-update`). It applies for root and agent from `/srv/src`; `SRC_SPARSE` contains `.agents`, `.claude-plugin`, `plugins` and `packages/machine`. Everything is pushed by `fleet-resilience-remote.sh`. A user without any agent is skipped (root on fr2).
- HTTP secrets: `headers = { Header = "SECRET" }` sets a `headersHelper` (`packages/machine/src/mcp-headers.ts`) that reads the env-kit vault at launch. `DEVELOPERKNOWLEDGE_API_KEY` now lives only in the vault: it was removed from `HKCU\\Environment` and serves the `developer-knowledge` server (connected). The homonymous server of the google-cloud-developer plugin, which expects the env variable, still fails.

## Measurements of 2026-11-13 (`check`: 0 gap everywhere)

| Host | User | Claude (active plugins, MCP) | Codex | agy |
|---|---|---|---|---|
| pc | aphro | 21 plugins, 14 MCP; neutral `claude -p`: 207 skills including 69 aphrody-skills | aphrody-skills | aphrody-skills 69, web-quality-skills 6 |
| prd | root | 17, 7 | aphrody-skills | aphrody-skills 69, web-quality-skills 6 |
| prd | agent | 17, 7; `claude -p` in /tmp: 197 skills including 69 aphrody-skills | aphrody-skills | absent |
| fr1 | root | 17, 7 (Claude moved from 2.1.96 to 2.1.323, agy to 1.5.8) | absent | aphrody-skills 69, web-quality-skills 6 |
| fr1 | agent | 20, 7 | aphrody-skills | absent |
| fr2 | agent | 17, 8 | aphrody-skills | absent |
| fr2 | root | no agent installed | | |

Before: 12 user skills on the PC, none on the fleet; plugins and MCPs set up by hand on the PC only.

## Decision: APM and vercel-labs/skills not adopted

- vercel-labs/skills (`npx skills`, fork aphrody-labs/skills@e781cb4d0743) installs skills by copying or linking into each agent's folders (`~/.claude/skills`, `~/.agents/skills`...). That means an out-of-cache copy per agent, or a link, both forbidden. The native marketplaces (Claude, Codex, agy) already do this work from the root marketplace.
- microsoft/apm (fork aphrody-labs/apm@1a6c1df655b7) is a Python manager (`apm.yml`, `apm install`). Porting it to bun would amount to rewriting it, and its manifest would duplicate `toolchain.toml`.
- Both forks stay pinned in `third_party/forks.txt` as reference. `toolchain.toml` and `ay agents` are the only front; to be re-examined if an agent package format common to the CLIs becomes standard.

## Remaining

- Gemini CLI: present for agent on prd (aphrody-skills extension linked), absent elsewhere.
