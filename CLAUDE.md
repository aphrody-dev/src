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
- Committing a file another session also edited: stage only your hunks (`git diff -U0 -- <file>` filtered, `git apply --cached --unidiff-zero`), never `git add` the whole file.
- MCP: `~/.claude.json` is the only server list; the relay re-exports it to other agents (`/mcp`), Claude uses `/mcp/core`. `claude mcp remove` drops stored OAuth, so change servers through `toolchain.toml`.
- Leftover `.git/rebase-merge/` holding only `autostash`: `git stash store -m orphan <sha>` then remove the dir before rebasing.
- R2 listing: `cf r2 buckets list`, `cf r2 objects list --bucket-name <b>` (discover others with `cf cli search`).
