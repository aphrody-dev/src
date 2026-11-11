---
name: ai-os-posix-nix-wasm
description: Sole Monorepo AI Ownership (@aphrody/ai-os v2.1) covering POSIX/Unix VFS OS for LLMs, NixOS /nix/store derivations, embedded Rust/Zig WASM32 + WebGPU WGSL kernels, fused protocols (Vercel UIMessageStream, Anthropic, OpenAI, DeepMind Gemma 4, GGUF, MCP), and the Objective Stack Benchmark Engine.
---

# Sovereign AI-OS v2.1 (`C:\src\packages\ai-os`)

`ai-os` (`C:\Users\aphro\.local\bin\ai-os.exe`) is the **sole AI and MCP owner** of the `C:\src` monorepo. Every package (`packages/agy`, `packages/ai-triad`, `packages/pi-opencode`, `packages/env-kit`, `n2b`, `apps/*`) consumes `@aphrody/ai-os` instead of spawning duplicate MCP servers or fragmented AI SDKs.

## 1. Stack Selection Law
1. **Tier 1 (Default Mandatory)**: Always build in **Rust 2024 (`Cargo` + `wasm32-unknown-unknown`)** or **TypeScript (`Bun v1.4.4` + Vercel/WebGPU compatible)** first.
2. **Tier 2 (Empirical Promotion Only)**: Extend to **C/C++ CUDA 13.4 `sm_89`**, **Zig `ReleaseFast`**, **Python (`uv` + JAX/Optax/Tunix)**, **Go 1.27**, or **.NET NativeAOT** strictly when `ai-os benchmark` proves `> 15%` empirical superiority.

## 2. Core CLI Commands
```powershell
# POSIX/Unix OS for LLMs & Decision Models (uutils + brush + just-bash + litebox VFS)
ai-os posix "cat /etc/os-release | grep PRETTY_NAME"
ai-os posix "ls /nix/store | wc -l"

# NixOS Content-Addressed Store & Vendor Distillation (39 aphrody-dev repos + polyglot manifests)
ai-os nix distill
ai-os nix status
ai-os nix generations
ai-os nix gc

# Objective Compute & LLM Provider Benchmark
ai-os benchmark --write

# Embedded WASM32 (Rust 4.6 KB + Zig 7.7 KB) & WebGPU WGSL Doctor
ai-os wasm-doctor

# Single Context-Optimized MCP Server (Default or Minimal Pi-Sudo Profile)
ai-os mcp-stdio
ai-os mcp-stdio --profile minimal
```

## 3. Fused Protocols on `:4318`
- **MCP 2025-03-26**: `POST /mcp` + `ai-os mcp-stdio`
- **Vercel AI SDK v5/v6 UIMessageStream SSE**: `POST /v1/vercel/stream` (`x-vercel-ai-ui-message-stream: v1`)
- **Anthropic Messages API**: `POST /v1/messages`
- **OpenAI Chat / Responses / Embeddings**: `POST /v1/chat/completions`, `POST /v1/responses`, `POST /v1/embeddings`
- **Google A2A JSON-RPC**: `GET /.well-known/agent.json`, `POST /a2a`
- **POSIX / Nix / Benchmark HTTP APIs**: `/api/posix`, `/api/nix`, `/api/wasm`, `/api/benchmark`
