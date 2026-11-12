# `@aphrody/env-kit` — Sovereign Monorepo Environment & Secret Architecture

Zero-dependency cross-language environment loader, secret redaction guard, and unified editor/CLI credential synchronizer for `C:\src`.

## Security Model

1. **Master Secret Vault (`C:\src\.env`)**: Locked via Windows NTFS ACLs (`inheritance:r`, explicit Full Control strictly restricted to `$env:USERNAME`, `NT AUTHORITY\SYSTEM`, and `BUILTIN\Administrators`).
2. **Global Git Guard**: `C:\src\.gitignore` and global `core.excludesFile` (`~/.gitignore_global`) block `.env`, `.env.*` (except `!.env.example`), `.dev.vars`, `*.pem`, `*.key`, and `.credentials.json` across every repository on the machine.
3. **Zero-Leakage Redaction**: Every language loader masks credentials (`SET [len=N]`) or `[REDACTED]` on `inspect`, `JSON.stringify`, `Debug`/`Display`, `repr()`, `fmt.Stringer`, and `__tostring`.

## CLI Usage (`env-kit`)

Installed at `C:\Users\aphro\.local\bin\env-kit.exe` (`env-kit.cmd` shim):

```powershell
env-kit doctor                       # Masked audit of all credentials, NTFS ACLs, and editors
env-kit accounts status [--json]     # 3-principal gcloud configs, rclone, and 10 org provider surfaces
env-kit accounts init-gcloud         # Idempotently configure ai-yoyo, owner-yohan, org-contact, sa-automation
env-kit accounts switch <principal>  # Switch active gcloud config (<ai|owner|org|sa>)
env-kit accounts iam-bindings        # Print idempotent IAM policy bindings for project aphrody (#468000409790)
env-kit set <KEY> <VALUE>            # Propagate secret to C:\src\.env + Windows User Env + OpenCode/Zed/Pi
env-kit nuget-set-key <API_KEY>      # Set NUGET_API_KEY across .env and Windows User Env
env-kit sync-editors                 # Sync OpenCode, Zed, and Pi provider & MCP configs
env-kit sync-gh                      # Sync active `gh auth token` into GITHUB_TOKEN & GH_TOKEN
env-kit dev-vars <workerDir>         # Generate gitignored .dev.vars for Cloudflare `wrangler dev`
env-kit vercel-env [dir] [--write]   # Export masked Vercel env summary or .env.local
env-kit exec -- <command> [args...]  # Run any binary with C:\src\.env injected
```

## Multi-Language Loaders

| Language / Runtime            | Path                                                      | Native CLI Flag / Usage                                                  |
| :---------------------------- | :-------------------------------------------------------- | :----------------------------------------------------------------------- |
| **Bun v1.4.4 / TypeScript**   | `C:\src\packages\env-kit\src\index.ts`                    | `bun --env-file=C:/src/.env` or `loadMonorepoEnv({ service, required })` |
| **Rust 2024 (`aphrody-env`)** | `C:\src\packages\env-kit\loaders\rust`                    | `aphrody_env::load_monorepo_env(LoadOptions::default())`                 |
| **Python 3.12+ / `uv`**       | `C:\src\packages\env-kit\loaders\python\sovereign_env.py` | `uv run --env-file C:/src/.env` or `sovereign_env.load_monorepo_env()`   |
| **C11 / C++23**               | `C:\src\packages\env-kit\loaders\cpp\sovereign_env.hpp`   | `sovereign_env::load()` / `sovereign_env_load_file(NULL, 0)`             |
| **.NET 10/11 C#**             | `C:\src\packages\env-kit\loaders\dotnet\SovereignEnv.cs`  | `Aphrody.EnvKit.SovereignEnv.Load()`                                     |
| **Go 1.24+**                  | `C:\src\packages\env-kit\loaders\go\envkit.go`            | `envkit.Load()`                                                          |
| **Lua 5.1+ / LuaJIT**         | `C:\src\packages\env-kit\loaders\lua\sovereign_env.lua`   | `require("sovereign_env").load()` (via `LUA_PATH`)                       |
| **PowerShell / POSIX**        | `C:\src\packages\env-kit\loaders\shell\load-env.ps1`      | `. C:\src\packages\env-kit\loaders\shell\load-env.ps1` / `. load-env.sh` |
