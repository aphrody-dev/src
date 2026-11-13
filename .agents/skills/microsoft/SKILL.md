---
name: microsoft
description: Méthode et références pour tout sujet Microsoft (Windows, DirectX/D3D12, .NET 10/11, C#, MSVC/STL, Rust de Microsoft, WinUI/WinAppSDK, Edge/WebGPU, Azure, GitHub org microsoft). Utiliser AVANT d'affirmer une version, une API, une feature, une date ou une recommandation Microsoft : les connaissances du modèle sont réputées périmées (on est en novembre 2026).
---

# Microsoft : protocole de vérité

1. **Jamais de mémoire.** Toute version, API ou feature vient d'une source consultée dans la session et datée.
2. Ordre des sources :
   1. Code local : `C:\Users\aphro\nt\vendor\<repo>`, clones des dépôts Microsoft. Lire le fichier exact et citer chemin + date de commit.
   2. Microsoft Learn MCP : `microsoft_docs_search` puis `microsoft_docs_fetch` ; `microsoft_code_sample_search` pour le code.
   3. API live : `bun ${CLAUDE_PLUGIN_ROOT}/skills/microsoft/scripts/facts.ts <out.json>` interroge NuGet, crates.io, releases GitHub, release-metadata .NET et chromestatus. `bun .../edge-webplatform.ts` lit les notes de version Edge (WebGPU, WASM).
   4. Index GitHub : `C:\Users\aphro\nt\docs\ms\data\repos.json`, environ 16 900 dépôts de 16 organisations, triés par dernier push ; régénérer avec msdex (archive `nt-archive`).
   5. `gh api` pour un dépôt, une branche ou un fichier précis (ex. `gh api repos/dotnet/runtimelab/branches`).
3. En cas de conflit (doc vs code vs release), signaler le conflit et privilégier : release publiée > code > doc. Exemples relevés : la roadmap WinAppSDK est périmée ; chromestatus affiche « Proposed » pour des features déjà livrées.
4. Vérifier la version **installée** (`windows-machine` skill) avant de recommander un outil.

## Faits datés (2026-11-12)

Détail dans `nt/docs/research/facts.json` et `nt/docs/plan/00-analyse.md`.

| Sujet | État |
|---|---|
| .NET | 11.0.0 GA (2026-11-10, STS), 10.0.15 LTS ; C# 15 (unions, hiérarchies fermées) ; CoreCLR et NativeAOT en WASM ; Runtime Async ; x86-64-v2 minimum, R2R vise x86-64-v3 sous Windows |
| D3D12 | Agility SDK 1.620.2 stable, 1.722.1 preview ; SM 6.10 et DXR 2.0 en preview seulement ; DXC v1.9.2609 ; work graphs dès Windows 11 24H2 (WDDM 3.2) ; export `D3D12SDKVersion` requis ; C++ = seul langage « supporté » |
| C++ | MSVC STL : C++23 (82 papiers), `import std` ; C++26 quasi absent |
| Rust MS | windows-rs repo 0.100/0.101 (`windows` sur crates.io bloqué à 0.62.2 → utiliser le repo) ; préférer `windows-bindgen` aux crates umbrella ; wdk 0.5.0 ; hyperlight 0.19 ; openvmm v0.4.0 ; mxc v1.0.1 ; litebox v0.1.0 ; nvx |
| Web | Edge 157 / Chrome 158 stables ; WebGPU : Immediates (Edge 150), subgroup size control (152), `buffer_view` (153), fragment depth (156), atomic vec2u (157) |
| WinUI | WinAppSDK 2.6.5 ; sources WinUI publiées (MIT), contributions de code non ouvertes |
| Build Rust (pratique MS) | edit : `panic = "immediate-abort"` + `build-std` ; mxc/sudo : CFG, CET, crt-static ; openvmm : lto fat, `codegen-units = 1` |

## Rust dans Windows

Enquête complète : `C:\Users\aphro\nt\docs\research\rust-in-windows.md`. Le Windows Security Book (Learn) annonce l'extension de Rust dans le noyau. Binaires Rust signés Microsoft sur le build local : `win32kbase_rs.sys`, `wesp.sys`, `wesp_elam.sys`, DWriteCore, Sense ATP, sudo, et d'autres.

## Plugins Microsoft installés (scope user)

dotnet, dotnet-msbuild, dotnet-nuget, dotnet-test, dotnet-diag, dotnet-upgrade, dotnet11, dotnet-advanced (marketplace `dotnet-agent-skills`) ; windbg, winui, winappcli (`win-dev-skills`) ; azure (`azure-skills`) ; azure-sdk-{dotnet,typescript,rust} (`skills`) ; microsoft-docs (Learn MCP). Préférer leurs skills pour l'exécution, et ce skill pour la vérification des faits.
