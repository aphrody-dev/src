# CLAUDE.md

Guidance for Claude Code (`claude.ai/code`). Canonical contract: [`AGENTS.md`](./AGENTS.md) + [`.agents/SOUL.md`](./.agents/SOUL.md).

@AGENTS.md
@.agents/SOUL.md

## Key Conventions

- **Central Core (`src/`)**: Pure C (`-std=gnu11`), Assembly, and WebAssembly 3.0 (`src/Makefile`, `src/include/ay/sys.h`). Specs and roadmap live in `docs/native/`.
- **Polyglot Tooling**: `crates/*` (Rust 2024, `ay` CLI) and `packages/*` (Bun `@aphrody/*`, `ai-os` sole AI/MCP owner) bind to `src/` via C ABI (`extern "C"`, `bun:ffi`, and WebAssembly).
- **Root & Hygiene**: Root directories follow `crates/archguard/src/constants.rs` and `.gitignore` allowlist. Zero emojis, zero AI attribution, zero `.env` leaks, zero `C:\Windows\System32` mutations.
- **Builds**: C and WebAssembly targets in `src/` compile locally in < 4s via `clang` + `wasm-ld` + `wasi-sdk` + `wasm-opt`; heavy Rust workspace builds run on `fr1` or CI (`ci.yml`). Never run bare `bun test` at root (target specific packages, e.g. `bun test packages/core`).

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
- MCP: `~/.claude.json` is the only server list; the relay re-exports it to other agents (`/mcp`), Claude uses `/mcp/core`. `claude mcp remove` drops stored OAuth, so change servers through `toolchain.toml`.
- Leftover `.git/rebase-merge/` holding only `autostash`: `git stash store -m orphan <sha>` then remove the dir before rebasing.
- Never `cmd //c ...` from the Bash tool (niubash opens an interactive cmd and hangs): remove a junction with `bun -e` (`fs.unlinkSync`, fallback `fs.rmdirSync`).
- Relay code changes load only after `pwsh -NoProfile -c "Restart-Service AphrodyRelay -Force"` (service runs `packages/ai-os/src/relay/cli.ts serve` from source; killing the bun child is not enough).
- VPS update (`/srv/src` on vps, prd, cdn): `git fetch -q --no-recurse-submodules origin main && git merge --ff-only FETCH_HEAD`. Blocked by a file identical to upstream: `git checkout FETCH_HEAD -- <file>`. Blocked by a submodule upstream absorbed: `git submodule deinit -f <path>` only if it is clean and its HEAD is on a remote branch.
- Gemini review when the relay fails (Antigravity credits, no relay Chrome session): gemini.google.com through claude-in-chrome; insert long text with `document.execCommand("insertText")` (synthetic paste is ignored, page CSP blocks fetch to localhost).
- R2 listing: `cf r2 buckets list`, `cf r2 objects list --bucket-name <b>` (discover others with `cf cli search`).
