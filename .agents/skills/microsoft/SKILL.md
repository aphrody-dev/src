---
name: microsoft
description: Method and references for any Microsoft topic (Windows, DirectX/D3D12, .NET 10/11, C#, MSVC/STL, Microsoft's Rust, WinUI/WinAppSDK, Edge/WebGPU, Azure, GitHub org microsoft). Use BEFORE asserting a Microsoft version, API, feature, date or recommendation: the model's knowledge is assumed stale (it is November 2026).
---

# Microsoft: truth protocol

1. **Never from memory.** Every version, API or feature comes from a source consulted in the session and dated.
2. Source order:
   1. Local code: clones of the Microsoft repositories under `third_party/` and the `apps/nt` workspace (`apps/nt/docs/msindex/README.md`: index of the Microsoft stack proven on this machine). Read the exact file and cite path + commit date.
   2. Microsoft Learn MCP: `microsoft_docs_search` then `microsoft_docs_fetch`; `microsoft_code_sample_search` for code.
   3. Live API: `bun .agents/skills/microsoft/scripts/facts.ts <out.json>` queries NuGet, crates.io, GitHub releases, .NET release-metadata and chromestatus. `bun .agents/skills/microsoft/scripts/edge-webplatform.ts` reads the Edge release notes (WebGPU, WASM).
   4. `gh api` for a specific repository, branch or file (e.g. `gh api repos/dotnet/runtimelab/branches`), output piped to `jaq`.
3. On conflict (docs vs code vs release), report the conflict and prefer: published release > code > docs. Examples observed: the WinAppSDK roadmap is stale; chromestatus shows "Proposed" for features already shipped.
4. Check the **installed** version (`windows-machine` skill) before recommending a tool.

## Facts

Do not copy versions from this file. The last sourced snapshot (.NET, D3D12 Agility SDK, MSVC STL, windows-rs, Edge/WebGPU, WinAppSDK) is `apps/nt/docs/research/facts.json`; regenerate it with `facts.ts` before quoting a number. Known pitfalls: `windows` on crates.io lags the windows-rs repo (use the repo, prefer `windows-bindgen`); chromestatus shows "Proposed" for features already shipped.

## Rust in Windows

Investigation: `apps/nt/docs/research/rust-in-windows.md`.

## Plugins

The Learn MCP (`microsoft_docs_*`) comes from `microsoft-docs@anthropic-plugin-directory`, which `infra/agents/toolchain.toml` currently declares `state = "absent"`; when the tools are not loaded, fetch learn.microsoft.com pages with `xh`. Third-party .NET, WinUI and Azure skill plugins are not installed. Use `windows-machine` for the local install.
