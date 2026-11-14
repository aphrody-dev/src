---
name: env-auth
description: Safe cross-language loading of .env (Bun, Rust, uv/Python, C/C++, .NET, Go, Lua, Vercel, Cloudflare) and automated credential management across gh, npm, crates.io, PyPI, NuGet, gcloud, Figma, Neon, OpenCode, Zed, and Pi without leaking secrets.
---

# `.env` & Multi-Registry Auth (`packages/env-kit`)

Activate this skill whenever wiring environment variables, API keys, cloud/registry tokens, or editor AI provider configs (`OpenCode`, `Zed`, `Pi`, `Antigravity`).

## Mandatory Safety Rules

1. **Zero Secret Echo**: Never print raw values from `.env` in terminal output, logs, or commits. Use `env-kit doctor` or `env-kit auth status` for masked status checks (`env-kit --help` lists every command; `ay auth`, `ay secret`, `ay vault` route to the same code).
2. **Cross-Language Loading**:
   - **Bun / TS**: `bun --env-file=.env run ...` or `import { loadMonorepoEnv } from "@aphrody/env-kit"`.
   - **Rust**: Use crate `aphrody-env` (`src/env`) with `SecretString` redaction.
   - **Python / `uv`**: `uv run --env-file .env ...` or `packages/env-kit/loaders/python/sovereign_env.py` (other loaders in `packages/env-kit/loaders/`: cpp, dotnet, go, lua, shell).
   - **Cloudflare Workers**: Generate gitignored `.dev.vars` via `env-kit dev-vars <projectDir>`.
   - **All AI Editors**: Run `env-kit set <KEY> <VALUE>` followed by `env-kit sync-editors` to propagate keys to `.env`, User Env, `OpenCode`, `Zed`, and `Pi`.
