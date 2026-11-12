# ay as runtime manager: Python, JS, native, AI

Goal (owner, 2026-11-12): `ay` is a Python and a Bun with neither CPython nor JSC built in. It installs
runtimes, switches versions and engines, adds extensions, uses forks or other package managers, and
provides what Chromium, Linux, PyTorch, CUDA, llama.cpp, whisper.cpp, Ollama and Docker need.
Constraint: reuse existing Rust projects (docs/RUST_STACK.md), never rewrite from scratch.

## Evidence (checked 2026-11-12)

| Need | Existing project | State | Use |
|---|---|---|---|
| Python versions, engines | uv 0.13.7 (astral-sh/uv, 92k stars): `uv python install` for cpython, cpython+freethreaded, pypy, graalpy, pyodide | installed, CPython 3.15.2 and 3.15.2t present | engine and version backend |
| Python packages, locks | uv (pip, PEP 751, PEP 723, workspaces); `pyx` registry | installed | default package manager |
| PyTorch and CUDA wheels | `uv pip install --torch-backend auto\|cpu\|cu130..` | installed | `ay rt torch` |
| Python parser, linter, types | ruff (`ruff_python_parser`, already used by `ay gclient`), ty | in use | `ay py check` |
| Python without CPython | RustPython (22k stars, full interpreter, no releases), pydantic/monty (subset, sandbox, Ruff parser, 0.0.23) | source only | engines `rustpython`, `monty` built from aphrody-dev forks |
| Python extensions in Rust | PyO3 + maturin | upstream | build extensions; PyO3 embeds CPython, so it is the CPython engine path only |
| CPython builds | astral-sh/python-build-standalone | used by uv | nothing to add |
| JS without JSC | Bun fork crates (docs/AY_ON_BUN.md): 70 of 136 crates free of JSC | plan | `ay` itself |
| JS engines | Bun (JSC), Node (V8), Deno (V8), Boa and Nova (Rust) | upstream | engines for `ay rt use js` |
| JS package managers | bun install (Rust port in the fork), npm, pnpm, yarn | upstream | `ay rt pm` |
| Version managers | mise (jdx, 36k, MIT), proto (moonrepo, MIT, WASM plugins) | not installed | reference for backends; `ay rt` keeps uv and bun as backends instead of a third manager |
| llama.cpp, whisper.cpp, Ollama | upstream releases | `ay up` installs them (Vulkan builds; CUDA builds from source on fr1) | done |
| Docker | Docker Desktop on Windows; youki, bollard (RUST_STACK.md) | installed | `ay rt docker` checks, no rewrite |

## Command surface

| Command | Backend | Notes |
|---|---|---|
| `ay rt ls` | uv, bun, `tools_dir` | every engine and version, active one marked |
| `ay rt install python@3.15 [--engine cpython\|freethreaded\|pypy\|graalpy\|pyodide]` | `uv python install` | |
| `ay rt install python --engine rustpython\|monty [--from <git url or path>]` | cargo build of the fork | no CPython anywhere |
| `ay rt use python@3.15` | `.python-version` (uv format) | per project; `--global` writes uv's default |
| `ay rt install bun@<version>\|canary [--from <fork>]` | GitHub release or Bun fork build | `tools_dir/bun/<version>` |
| `ay rt use bun@<version>` | `.bun-version` (setup-bun format) | |
| `ay rt pm python uv\|pip\|poetry\|pdm` | `uv tool install` | uv stays the resolver |
| `ay rt pm js bun\|npm\|pnpm\|yarn` | `bun add -g` | |
| `ay rt torch [--backend auto\|cpu\|cu130]` | `uv pip install torch --torch-backend` | CUDA picked from the driver |
| `ay rt run <runtime>@<version> -- args` | resolved binary | used by hooks and CI |

## Phases

1. Done: `ay rt ls|install|use|run|pm|torch` (crates/rt). Bun downloads are checked against the GitHub asset digest (the canary SHASUMS256.txt lags behind its binaries), then SHASUMS256.txt.
2. RustPython: `ay rt install python --engine rustpython` builds aphrody-dev/RustPython (3.15.0 alpha, no CPython). Next: Monty; CPython conformance via `test/` subsets.
3. `ay` as `python`/`bun` multicall names through the shim layer of `ay up` (crates/up/src/shim.rs).
4. Bun fork crates without JSC (docs/AY_ON_BUN.md phases) replace the Bun binary for install and run.
