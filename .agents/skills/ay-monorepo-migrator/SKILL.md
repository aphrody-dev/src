---
name: ay-monorepo-migrator
description: Audit and migrate legacy Node.js, V8, Electron, VS Code, Discord, Microsoft TypeScript/Rust, node-api-dotnet, and Unreal Engine monorepos to Bun v1.4.4 Full-Rust + Rust LTO/AOT using ay (`crates/depot-migrate`).
---

# Aphrody `ay` Monorepo Migrator, `.NET` CoreCLR Bridge & Polyglot AST Engine

Activate this skill when auditing or transforming legacy Node/V8/Electron/VSCode/Discord/TypeScript/Microsoft/`.NET`/C++ repositories into **Bun v1.4.4** and **Rust LTO/AOT** stacks.

## Core Commands (`ay`)

- Inspect CoreCLR `.NET` bindgen + `hostfxr` compatibility (`crates/depot-migrate::dotnet`):
  ```powershell
  ay migrate <dotnet-dir> --dotnet --dry-run
  ```
- Audit or apply Node/V8/Electron/`node-api-dotnet`/Lua 5.1 -> Bun + Rust migration (`crates/depot-migrate`):
  ```powershell
  ay migrate <target-dir> --dry-run
  ```
- Inspect LLVM IR optimization & SIMD vectorization (`crates/depot-migrate::llvm`):
  ```powershell
  ay migrate <target-dir> --llvm --dry-run
  ```
