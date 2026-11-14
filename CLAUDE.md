# CLAUDE.md

Guidance for Claude Code (`claude.ai/code`). Canonical contract: [`AGENTS.md`](./AGENTS.md) + [`.agents/SOUL.md`](./.agents/SOUL.md).

@AGENTS.md
@.agents/SOUL.md

## Key Conventions

- Layout, scope and execution rules: `AGENTS.md` (imported above); not repeated here.
- C and WebAssembly targets in `src/` build locally in < 4s (`src/Makefile`); heavy Rust workspace builds run on `fr1` or CI (`ci.yml`).
- Never run bare `bun test` at root: target a package (`bun test packages/core`).

## Essential Commands

```sh
wasm-validate --enable-all target/sys/aysys.wasm apps/aphrody/public/wayland.wasm
bun test packages/core/test/sys.test.ts
bun scripts/checkdeps.ts
bun fmt && bun check
just agents-sync --check   # agent tooling drift (infra/agents/toolchain.toml): plugins, MCP, skills; without --check = apply
bun packages/ai-os/src/brain/cli.ts sync   # global CLAUDE.md + memory index -> agy, Codex, OpenCode prompts
```

## Gotchas (Windows shell)

- `gh api ... --jq '<expr with quotes/pipes>'` breaks (gh is a cmd shim): pipe to `jaq` instead.
- `git pull` aborts on `would clobber existing tag` or push is rejected: `git fetch aphrody main --no-tags` then `git merge --no-edit aphrody/main` (works on the dirty shared tree; never stash or `--autostash`, other sessions share it).
- Committing a file another session also edited: stage only your hunks with context (`git diff -- <file>` filtered, `git apply --cached`), never `git add` the whole file; `--unidiff-zero` misplaces pure insertions, so re-read `git diff --cached` before committing.
- MCP: Claude Code declares only `relay` (`/mcp/core`), `cloudflare`, `cloudflare-docs`. `rea`, `agent-desktop`, `agent-browser` sit behind the relay: `hub_tools` (list, search, schema) then `hub_call` with `<server>__<tool>`; where a skill names an `mcp__rea__*` tool, call it that way. Change servers in `infra/agents/toolchain.toml` (`claude mcp remove` drops stored OAuth).
- Leftover `.git/rebase-merge/` holding only `autostash`: `git stash store -m orphan <sha>` then remove the dir before rebasing.
- Headless Claude from a shell: `claude -p "..." < /dev/null`; without it the CLI waits 3 s for stdin on every run (measured 2026-11-14).
- Never `cmd //c ...` from the Bash tool (niubash opens an interactive cmd and hangs): remove a junction with `bun -e` (`fs.unlinkSync`, fallback `fs.rmdirSync`).
- Relay code changes load only after `pwsh -NoProfile -c "Restart-Service AphrodyRelay -Force"` (service runs `packages/ai-os/src/relay/cli.ts serve` from source; killing the bun child is not enough).
- VPS update (`/srv/src` on vps, prd, cdn): `git fetch -q --no-recurse-submodules origin main && git merge --ff-only FETCH_HEAD`. Blocked by a file identical to upstream: `git checkout FETCH_HEAD -- <file>`. Blocked by a submodule upstream absorbed: `git submodule deinit -f <path>` only if it is clean and its HEAD is on a remote branch.
- Gemini review when the relay fails (Antigravity credits, no relay Chrome session): gemini.google.com through claude-in-chrome; insert long text with `document.execCommand("insertText")` (synthetic paste is ignored, page CSP blocks fetch to localhost).
- R2 listing: `cf r2 buckets list`, `cf r2 objects list --bucket-name <b>` (discover others with `cf cli search`).
