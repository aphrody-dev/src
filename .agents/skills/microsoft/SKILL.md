---
name: microsoft
description: Method and references for any Microsoft topic (Windows, DirectX/D3D12, .NET 10/11, C#, MSVC/STL, Microsoft's Rust, WinUI/WinAppSDK, Edge/WebGPU, Azure, GitHub org microsoft). Use BEFORE asserting a Microsoft version, API, feature, date or recommendation: the model's knowledge is assumed stale (it is November 2026).
---

# Microsoft: truth protocol

1. **Never from memory.** Every version, API or feature comes from a source consulted in the session and dated.
2. Source order:
   1. Local code: `C:\Users\aphro\nt\vendor\<repo>`, clones of the Microsoft repositories. Read the exact file and cite path + commit date.
   2. Microsoft Learn MCP: `microsoft_docs_search` then `microsoft_docs_fetch`; `microsoft_code_sample_search` for code.
   3. Live API: `bun ${CLAUDE_PLUGIN_ROOT}/skills/microsoft/scripts/facts.ts <out.json>` queries NuGet, crates.io, GitHub releases, .NET release-metadata and chromestatus. `bun .../edge-webplatform.ts` reads the Edge release notes (WebGPU, WASM).
   4. GitHub index: `C:\Users\aphro\nt\docs\ms\data\repos.json`, about 16,900 repositories from 16 organizations, sorted by last push; regenerate with msdex (archive `nt-archive`).
   5. `gh api` for a specific repository, branch or file (e.g. `gh api repos/dotnet/runtimelab/branches`).
3. On conflict (docs vs code vs release), report the conflict and prefer: published release > code > docs. Examples observed: the WinAppSDK roadmap is stale; chromestatus shows "Proposed" for features already shipped.
4. Check the **installed** version (`windows-machine` skill) before recommending a tool.

## Dated facts (2026-11-12)

Details in `nt/docs/research/facts.json` and `nt/docs/plan/00-analyse.md`.

| Topic                    | State                                                                                                                                                                                                                |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| .NET                     | 11.0.0 GA (2026-11-10, STS), 10.0.15 LTS; C# 15 (unions, closed hierarchies); CoreCLR and NativeAOT on WASM; Runtime Async; x86-64-v2 minimum, R2R targets x86-64-v3 on Windows                                      |
| D3D12                    | Agility SDK 1.620.2 stable, 1.722.1 preview; SM 6.10 and DXR 2.0 in preview only; DXC v1.9.2609; work graphs from Windows 11 24H2 (WDDM 3.2); `D3D12SDKVersion` export required; C++ = the only "supported" language |
| C++                      | MSVC STL: C++23 (82 papers), `import std`; C++26 almost absent                                                                                                                                                       |
| Rust MS                  | windows-rs repo 0.100/0.101 (`windows` on crates.io stuck at 0.62.2 → use the repo); prefer `windows-bindgen` to the umbrella crates; wdk 0.5.0; hyperlight 0.19; openvmm v0.4.0; mxc v1.0.1; litebox v0.1.0; nvx    |
| Web                      | Edge 157 / Chrome 158 stable; WebGPU: Immediates (Edge 150), subgroup size control (152), `buffer_view` (153), fragment depth (156), atomic vec2u (157)                                                              |
| WinUI                    | WinAppSDK 2.6.5; WinUI sources published (MIT), code contributions not open                                                                                                                                          |
| Rust build (MS practice) | edit: `panic = "immediate-abort"` + `build-std`; mxc/sudo: CFG, CET, crt-static; openvmm: lto fat, `codegen-units = 1`                                                                                               |

## Rust in Windows

Full investigation: `C:\Users\aphro\nt\docs\research\rust-in-windows.md`. The Windows Security Book (Learn) announces the extension of Rust in the kernel. Microsoft-signed Rust binaries on the local build: `win32kbase_rs.sys`, `wesp.sys`, `wesp_elam.sys`, DWriteCore, Sense ATP, sudo, and others.

## Installed Microsoft plugins (user scope)

dotnet, dotnet-msbuild, dotnet-nuget, dotnet-test, dotnet-diag, dotnet-upgrade, dotnet11, dotnet-advanced (marketplace `dotnet-agent-skills`); windbg, winui, winappcli (`win-dev-skills`); azure (`azure-skills`); azure-sdk-{dotnet,typescript,rust} (`skills`); microsoft-docs (Learn MCP). Prefer their skills for execution, and this skill for fact checking.
