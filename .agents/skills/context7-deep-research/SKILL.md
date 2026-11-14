---
name: context7-deep-research
description: Research an upstream library, API or tool before using or citing it in src - Context7 docs through the relay hub, live GitHub source through gh api, and the repo itself. Use for unfamiliar APIs, version facts, or checking a doc claim.
---

# Context7 and source research

Every fact keeps its source (library id, repo plus commit, file:line, command output) and the date it was read.

## 1. Context7, through the relay hub

`context7` is a hub server declared in `infra/agents/toolchain.toml` (`[[hub.mcp]]`, `https://mcp.context7.com/mcp`, no key). Claude Code reaches it through the relay:

1. `hub_tools` with `search: "context7"` lists the tools: `context7__resolve-library-id` and `context7__query-docs`.
2. `hub_call` with `name: "context7__resolve-library-id"` and `arguments: { libraryName, query }` returns ids such as `/oven-sh/bun`.
3. `hub_call` with `name: "context7__query-docs"` and `arguments: { libraryId, query }` returns the docs.

If the `hub_*` tools are not loaded in the session, POST JSON-RPC `tools/call` to `http://127.0.0.1:8790/mcp/core`. Take the headers from `bun packages/ai-os/src/relay/headers.ts`, and never print them.

## 2. Live source, which beats docs

Docs can lag. When the source and the docs disagree, the source wins; report the conflict.

| Question | Command |
| --- | --- |
| head commit and date | `gh api repos/<o>/<r>/commits/<branch> --jq '.sha[0:10] + " " + .commit.committer.date'` |
| a file at HEAD | `gh api repos/<o>/<r>/contents/<path> --jq .content`, then base64-decode it in `bun -e` |
| releases and tags | `gh api repos/<o>/<r>/releases/latest`, `git ls-remote --tags <url>` |
| a crate | `cargo info <crate>` on fr1 |
| an npm package | `bun info <pkg>` |

Pipe JSON to `jaq` (gh `--jq` breaks on quotes under niubash).

## 3. The repo

- Search with `rg`, `fd` and `ast-grep`.
- Look up symbols with `ay code refs`.
- Read local pins in `src.lock.json`, `DEPS`, `Cargo.lock` and `bun.lock`.
- Look for local checkouts under `third_party/` (untracked, pinned).

## Output

Write the finding next to the work, in the doc or commit that uses it. Only a long survey goes to `docs/research/<topic>-<date>.md`, and it states its sources and date.
