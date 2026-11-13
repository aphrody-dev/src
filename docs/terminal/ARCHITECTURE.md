# Pile terminal centrale : intelligent-terminal

Relevé du 2026-11-13 sur `third_party/intelligent-terminal` (fork `aphrody-labs/intelligent-terminal`,
amont `microsoft/intelligent-terminal`, commit `5a4876de63bc`, 2026-11-13, licence MIT, langage GitHub C++).
intelligent-terminal est la base de l'interface utilisateur, de l'émulation de terminal et l'exemple C++ de
référence de la pile first party, à côté de Chromium (`third_party/chromium`).

## Architecture relevée dans le code

| Couche | Emplacement amont | Technologie |
|---|---|---|
| Hôte console, ConPTY | `src/host`, `src/server`, `src/winconpty` | C++ (OpenConsole/conhost hérité de Windows Terminal) |
| Émulation VT | `src/terminal/parser`, `src/terminal/adapter`, `src/terminal/input` | machine d'états VT, dispatch ECMA-48/xterm |
| Tampon texte | `src/buffer/out`, `src/types`, `src/til` | C++, `oss/chromium` (`base/numerics`, commit Chromium `d8710dd9`), `oss/interval_tree`, `oss/pcg`, `oss/wyhash`, `oss/stb` |
| Rendu | `src/renderer/atlas` (AtlasEngine), `src/renderer/gdi`, `src/renderer/uia` | Direct3D 11, Direct2D, DirectWrite, HLSL ; GDI ; UI Automation |
| Cœur et contrôle | `src/cascadia/TerminalCore`, `src/cascadia/TerminalControl`, `src/cascadia/TerminalConnection` (`ConptyConnection`) | C++/WinRT, IDL |
| Application | `src/cascadia/TerminalApp`, `src/cascadia/TerminalSettingsModel`, `src/cascadia/TerminalSettingsEditor`, `src/cascadia/WindowsTerminal` | WinUI 2 (`Microsoft.UI.Xaml` 2.8.4) en îlots XAML (`IslandWindow`), WebView2 |
| Agents | `src/cascadia/TerminalApp/AgentPane*`, `SharedWta.cpp`, `TerminalProtocol/TerminalProtocol.idl`, `WindowsTerminal/TerminalProtocolComServer.cpp` | serveur COM `IProtocolServer`, CLI `wtcli` |
| Orchestrateur WTA | `tools/wta` (182 fichiers `.rs`, edition 2021, toolchain `ms-prod-1.93`) | Rust : ACP (`agent-client-protocol` 1.3), ratatui 0.30, crossterm 0.29, tui-markdown 0.3.11, tokio, windows-sys 0.61, tracelogging |
| Installeur | `installer/bootstrap` (Rust), MSIX `src/cascadia/CascadiaPackage` | Rust, MSBuild |

Flux : `WindowsTerminal.exe` lance `wta-master` (pool de CLI d'agents ACP sur stdio) et un `wta-helper` par
onglet dans un `ConptyConnection` ordinaire ; le C++ ne parle pas ACP ; le contrôle du terminal passe par
COM `IProtocolServer` (`AGENTS.md` amont).

Dépendances absorbées dans `third_party/` (forks aphrody-labs, `packages/machine/src/forks.ts`) :

| Source | Dépendances |
|---|---|
| `vcpkg.json` (baseline `927f62e4`) | `fmt` 12.1.0, `GSL` 4.2.2, `jsoncpp` 1.9.6, `CLI11` 2.6.1, `cmark` 0.31.1 ; `vcpkg` déjà présent |
| `dep/nuget/packages.config` | `cppwinrt` (2.0.250303.1), `wil` (1.0.250325.1), `microsoft-ui-xaml` (2.8.4, déjà présent) ; WebView2, TAEF, PGO-Helpers : binaires NuGet sans source publique |
| `tools/wta/Cargo.toml` | `acp-rust-sdk` (crate `agent-client-protocol`), `agent-client-protocol` (spec), `ratatui`, `crossterm`, `tui-markdown` |
| `installer/bootstrap/Cargo.toml` | aucune dépendance (std seul) |
| Base amont | `terminal` (`microsoft/terminal`, dont `microsoft/intelligent-terminal` est issu ; référence de rebase) |

## Place dans src

- Code amont : `third_party/intelligent-terminal` (aucune copie dans `apps/`, `crates/` ou `packages/` : rien n'est
  recodé). Épinglé par `src.lock.json` (`ay lock --lock-only`) ; `just terminal-prd` construit les forks à ces commits.
- Chromium : `third_party/chromium` (solution gclient, Chromium 160.0.8158.0, `src` à `ef68a767`, 2026-11-11)
  reste le moteur web ; intelligent-terminal n'en embarque que `base/numerics` dans `oss/chromium`. Sur prd, la
  validation C++ utilise le clang/lld système (Arch Linux) ; elle ne produit aucun binaire consommé par le build
  Windows (MSBuild, vcpkg, NuGet).
- Pile UI existante : `crates/dx12-winui-core` (Rust, `windows`) et `third_party/windows-rs` (monorepo,
  `MERGED.toml`) côté Rust natif ; `third_party/microsoft-ui-xaml`, `third_party/WindowsAppSDK`,
  `third_party/webui`, `third_party/fluentui`, `third_party/fast` côté UI Microsoft ; `third_party/wterm`,
  `third_party/ghostty-web`, `third_party/opentui`, `third_party/edit`, `third_party/terminal-control`,
  `third_party/inshellisense` côté terminal web, TUI et shell. intelligent-terminal est la référence C++ ;
  WTA est la référence Rust TUI (ratatui/crossterm) de cette pile.

## Construction

Jamais sur le poste.

| Cible | Où | Commande |
|---|---|---|
| WindowsTerminal.exe, wta.exe, installer/bootstrap, tests C++ et Rust | CI GitHub du fork (`PR CI`, `windows-2025-vs2026`, `workflow_dispatch` sur `main`) | `just terminal-ci`, puis `just terminal-ci-status` (le run apparaît quelques secondes après) |
| Validation Linux C++23 de fmt, jsoncpp, CLI11, cmark (GSL, header-only : configuré seulement) | prd, `nice -n 19`, `ionice -c 3`, 4 CPU (`taskset`) | `just terminal-prd cpp` |
| Validation Linux de ratatui, crossterm, tui-markdown, agent-client-protocol, terminal-control (Zig 0.15.2 privé) | prd | `just terminal-prd rust` |
| Avancer le fork sur l'amont, rafraîchir tous les forks de `forks.ts`, réépingler | poste (gh, bun, `ay lock`) | `just terminal-sync` |

WTA n'est pas vérifié sur prd : `ring` (via reqwest/rustls) compile du C qui exige les en-têtes CRT MSVC
(`assert.h` introuvable avec clang-cl seul, essai du 2026-11-13) ; la CI Windows du fork le couvre.

Script prd : `infra/fleet/bin/terminal-prd-build.sh` (dépôt de travail `~/terminal-stack`, verrou `flock`,
`git clean -fdx` à chaque synchronisation ; `JOBS`, `TERMINAL_WORK` et `PINS` surchargeables).
