---
name: n2b-monorepo-migrator
description: Audit and migrate legacy Node.js, V8, Electron, VS Code, Discord, Microsoft TypeScript/Rust, node-api-dotnet, and Unreal Engine monorepos to Bun v1.4.4 Full-Rust + Rust LTO/AOT using n2b.
---

# Sovereign `n2b` Monorepo Migrator, `.NET` CoreCLR Bridge & Polyglot AST Engine

Activate this skill when auditing or transforming legacy Node/V8/Electron/VSCode/Discord/TypeScript/Microsoft/`.NET`/C++ repositories into **Bun v1.4.4** and **Rust LTO/AOT** stacks.

## Core Commands (`C:\Users\aphro\.local\bin\n2b.exe`)

- Verify host hardware, LLVM 23 / Rust / Bun toolchains, and 63 read-only vendor submodules:
  ```powershell
  n2b doctor --json
  ```
- In-process CoreCLR 10/11 (`microsoft/node-api-dotnet` Rust + Bun rewrite):
  ```powershell
  n2b dotnet doctor
  n2b dotnet bindgen --target third_party/n2b/dotnet/SovereignDotNetDemo/SovereignBridge.cs
  n2b dotnet bench
  ```
- Audit or apply Node/V8/Electron/`node-api-dotnet`/Microsoft-TS -> Bun + Rust migration (never mutates `vendor/` in-place; pass `--out-dir` for vendor sources):
  ```powershell
  n2b migrate third_party/n2b/vendor/microsoft/node-api-dotnet --json
  ```
- Analyze `-O3 -mavx2` LLVM IR and generate `bun:ffi` zero-copy C-ABI bindings:
  ```powershell
  n2b llvm third_party/n2b/migrations/ue58-sovereign/rust-kernel/src/lib.rs
  ```
