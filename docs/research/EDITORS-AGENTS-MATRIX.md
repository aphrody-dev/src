# Éditeurs, IDE, agents et TUI : matrice pondérée (2026-11-12)

Données brutes : `editors-agents.json` (même dossier). [V] = vérifié en session (gh api, binaire local, hyperfine). [NV] = non vérifié (jugement ou connaissance antérieure). Toutes les notes 0-5 sont [NV] ; stars, licence, release, commits 90 j et temps de démarrage sont [V].

## Index
1. Méthode et poids
2. Éditeurs
3. Qualité IDE Rust + TS
4. Agents autonomes
5. TUI d'agents
6. Classement global
7. Recommandation pour la stack
8. Conflits de sources

## 1. Méthode
- Poids (total 100) : perf 10, mem 5, DX Rust/TS 12, LSP/tree-sitter 8, MCP 10, autonomie 10, extensibilité 8, licence 8, Windows natif 10, Linux 5, activité 8, coût 6. Score = Σ(poids×note)/500 ×100.
- Activité : `gh api repos/{r}/commits?since=2026-08-14` (branche par défaut, dernière page du Link).
- Démarrage : `hyperfine -N -w2 -r5 '<bin> --version'`, Windows 11 build 28120, i7-13700F [V].

## 2. Éditeurs
| Rang | Outil | Score | Stars | Licence | Release | Commits 90 j | Local |
|---|---|---|---|---|---|---|---|
| 1 | VS Code | 84.4 | 195 331 | MIT | 1.146.0 (2026-11-11) | 8 150 | non |
| 2 | Zed | 83.8 | 94 822 | GPL/AGPL/Apache (NOASSERTION) | v1.28.1 (2026-11-11) | 1 303 | config env-kit, absent du PATH |
| 3 | Neovim | 79.2 | 103 624 | Apache/Vim | v0.12.6 (2026-10-09) | 1 031 | non |
| 4 | Cursor | 72.2 [NV] | - | propriétaire | - | - | non |
| 5 | Windsurf | 66.2 [NV] | - | propriétaire | - | - | non |
| 6 | JetBrains RustRover/WebStorm | 65.6 [NV] | - | propriétaire | - | - | non |
| 7 | Helix | 62.4 | 46 894 | MPL-2.0 | 25.07.1 (2025-07-18) | 20 | oui, 16.1 ms |
| 8 | Lapce | 54.0 | 39 009 | Apache-2.0 | v0.4.6 (2026-01-21) | 17 | non |
| 9 | Visual Studio 2026 | 50.4 [NV] | - | propriétaire | - | - | non vérifié |
| 10 | Fleet | 38.4 [NV] | - | propriétaire | - | - | non |

## 3. Qualité IDE Rust + TS
| Rang | Composant | Score | Release | Commits 90 j | Local |
|---|---|---|---|---|---|
| 1 | rust-analyzer | 77.4 | 2026-11-09 | 891 | proxy rustup présent, composant absent sur la nightly épinglée [V] |
| 2 | tsgo (TS 7 natif) | 73.0 | typescript/v7.0.2 (2026-07-08), repo archivé [V] | 36 | 7.0.0-dev.20260707.2, 55.2 ms |
| 3 | typescript-language-server | 70.2 | v6.0.3 (2026-11-02) | 42 | 6.0.3, 62.7 ms |
| 4 | bun inspector | 59.4 [NV] | - | - | bun installé |
| 5 | codelldb | 56.6 | v1.12.3 (2026-08-23) | 6 | lldb.cmd seulement |

Formatage/lint : `bun fmt` / `bun check` couvrent ; Biome inutile.

## 4. Agents autonomes
| Rang | Agent | Score | Stars | Licence | Release | Commits 90 j |
|---|---|---|---|---|---|---|
| 1 | Claude Code | 86.4 | 155 429 | propriétaire | v2.1.322 (2026-11-10) | 252 (repo public non-source) |
| 2 | Codex CLI | 83.8 | 135 034 | Apache-2.0 | rust-v0.167.2 (2026-11-11) | 4 171 |
| 3 | Goose | 80.2 | 56 498 | Apache-2.0 | v1.59.0 (2026-11-10) | 631 |
| 4 | Cline | 77.0 | 71 562 | Apache-2.0 | v4.1.26 | 770 |
| 5 | OpenClaw | 74.2 | 394 404 | MIT | v2026.11.3 (2026-11-10) | 48 740 |
| 6 | Hermes Agent | 72.2 | 262 932 | MIT | v0.23.1 (2026-11-10) | 46 966 |
| 7 | Gemini CLI | 69.0 | 108 801 | Apache-2.0 | v0.68.0 | 252 |
| 8 | OpenHands | 65.6 | 93 340 | MIT | v1.40.0 (2026-11-12) | 1 054 |
| 9 | Roo Code | 64.6 | 24 240 | Apache-2.0 | v3.54.0, archivé [V] | 0 |
| 10 | Aider | 50.0 | 50 092 | Apache-2.0 | v0.86.0 (2025-08-09) | 0 |
| 11 | Devin-like (SaaS) | 44.4 [NV] | - | propriétaire | - | - |

OpenClaw et Hermes : meilleurs en self-learning/mémoire/skills/scheduling [NV] mais Windows natif moins sûr [NV].

## 5. TUI d'agents
| Rang | TUI | Score | Licence | Release | Commits 90 j | Démarrage local |
|---|---|---|---|---|---|---|
| 1 | OpenCode | 92.0 | MIT | v1.19.5 (GitHub) | 5 616 | v2.2.7, 80.5 ms |
| 2 | Claude Code | 86.4 | propriétaire | v2.1.322 | 252 | 2.1.318, 21.2 ms |
| 3 | Codex | 83.8 | Apache-2.0 | rust-v0.167.2 | 4 171 | shim codex.cmd (non mesuré) |
| 4 | pi | 79.8 | MIT | v1.5.2 (2026-11-10) | 2 082 | pi-opencode.exe seulement |
| 5 | Crush | 79.0 | FSL (NOASSERTION) | v0.101.0 (2026-11-12) | 507 | non |
| 6 | Gemini CLI | 69.0 | Apache-2.0 | v0.68.0 | 252 | 0.66.0, 824.5 ms |
| 7 | amp | 62.4 [NV] | propriétaire | - | - | non |
| 8 | aider | 50.0 | Apache-2.0 | v0.86.0 | 0 | non |

## 6. Classement global (top 12)
OpenCode 92.0 · Claude Code 86.4 · VS Code 84.4 · Zed 83.8 · Codex 83.8 · Goose 80.2 · pi 79.8 · Neovim 79.2 · Crush 79.0 · rust-analyzer 77.4 · Cline 77.0 · OpenClaw 74.2. Liste complète triée dans le JSON.

## 7. Recommandation (bun, Rust nightly, LLVM, Windows 11 + VPS Linux, NHITL)
- Garder : Claude Code (agent principal, mettre à jour 2.1.318 → 2.1.322), OpenCode (TUI multi-modèle, configs env-kit), Codex CLI (Rust, Apache), Helix (édition terminal rapide), tsgo + typescript-language-server, lldb.
- Installer (léger) : Zed comme éditeur graphique (natif Rust, LSP, ACP/MCP) ; composant `rust-analyzer` sur la nightly épinglée (`rustup component add rust-analyzer`) ; pi CLI si le bridge pi-opencode le requiert ; mettre à jour tsgo vers 7.0.2.
- Évaluer sur le VPS Linux seulement : OpenClaw ou Hermes Agent pour l'autonomie planifiée/mémoire (NHITL 24/7), pas sur le poste Windows.
- Retirer : Gemini CLI (824 ms au démarrage, 2 versions de retard), `biome.exe` et `oxlint.exe` de ~/.bun/bin (remplacés par bun), ne pas installer Aider ni Roo Code (inactif / archivé), ni Cursor/Windsurf/Fleet/JetBrains (propriétaires, lourds).
- VS Code : ne pas installer sauf besoin de débogage codelldb graphique ; Zed couvre.

## 8. Conflits de sources
- OpenCode : binaire local v2.2.7 > dernière release GitHub v1.19.5 (canal npm/bun différent ou fork `opencode2`) [V].
- microsoft/typescript-go archivé alors que tsgo 7.0.2 publié ; emplacement du dev actuel non vérifié.
- Renommages [V] : block/goose → aaif-goose/goose, sst/opencode → anomalyco/opencode, badlogic/pi-mono → earendil-works/pi, All-Hands-AI → OpenHands.
- Claude Code : 252 commits 90 j sur un repo de packaging, pas le code source ; activité réelle sous-estimée.
- rust-analyzer : proxy présent mais composant manquant sur la toolchain épinglée.
