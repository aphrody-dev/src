---
name: sovereign-env-auth
description: Safe cross-language loading of C:\src\.env (Bun, Rust, uv/Python, C/C++, .NET, Go, Lua, Vercel, Cloudflare) and automated credential management across gh, npm, crates.io, PyPI, NuGet, gcloud, Figma, Neon, OpenCode, Zed, and Pi without leaking secrets.
---

# Sovereign `.env` & Multi-Registry Auth (`C:\src\packages\env-kit`)

Activate this skill whenever wiring environment variables, API keys, cloud/registry tokens, or editor AI provider configs (`OpenCode`, `Zed`, `Pi`, `Antigravity`).

## Mandatory Safety Rules
1. **Zero Secret Echo**: Never print raw values from `C:\src\.env` in terminal output, logs, or commits. Always use `env-kit doctor` for masked status checks.
2. **Cross-Language Loading**:
   - **Bun / TS**: `bun --env-file=C:/src/.env run ...` or `import { loadMonorepoEnv } from "C:/src/packages/env-kit/src/index.ts"`.
   - **Rust**: Use crate `sovereign-env` (`C:\src\packages\env-kit\loaders\rust`) with `SecretString` redaction.
   - **Python / `uv`**: `uv run --env-file C:/src/.env ...` or `C:\src\packages\env-kit\loaders\python\sovereign_env.py`.
   - **Cloudflare Workers**: Generate gitignored `.dev.vars` via `env-kit dev-vars <projectDir>`.
   - **All AI Editors**: Run `env-kit set <KEY> <VALUE>` followed by `env-kit sync-editors` to propagate keys to `C:\src\.env`, User Env, `OpenCode`, `Zed`, and `Pi`.
