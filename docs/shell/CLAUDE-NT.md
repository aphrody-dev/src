# Claude Code → noyau NT : couches, latences, interaction « humaine » (2026-11-12)

Sources : code.claude.com/docs (computer-use, setup, env-vars), Microsoft Learn (UI Automation caching/threading, MCP on Windows / ODR), `gh api` (repos cités). [NV] = non vérifié.

## 1. Ce qui éloigne Claude Code de NT aujourd'hui

| Couche | Coût / problème | Source |
|---|---|---|
| Claude Code (binaire Bun/JS) → outil Bash | un processus shell par commande + rejeu du snapshot | docs setup [V], snapshot observé |
| bash.exe (Git Bash = MSYS2) | émulation POSIX (fork émulé, cygpath) | remplacé par niubash 1.5.0 : 16,3 ms vs 19,2 ms (nt-03) |
| outil PowerShell | démarrage pwsh lourd | désactivé (CLAUDE_CODE_USE_POWERSHELL_TOOL=0) |
| CreateProcessW par commande | coût de création de processus Windows + scan Defender | exclusions Defender déjà posées ; mesure par commande [NV] (source introuvable: mesure locale requise) |
| sortie via pipes, pas ConPTY | pas de TTY ; sortie tronquée à BASH_MAX_OUTPUT_LENGTH (30000 par défaut, max 150000) | docs env-vars [V] |
| GUI | `computer-use` du CLI = **macOS seulement** ; sous Windows uniquement dans Claude Desktop | docs computer-use [V] |
| captures d'écran | downscale + aller-retour modèle : méthode la plus lente, utilisée en dernier recours (MCP > Bash > Chrome > computer use) | docs computer-use [V] |

## 2. Voie la plus directe vers « tout Windows comme un humain »

Ordre de précision imposé par Claude Code lui-même : MCP > Bash > Claude in Chrome > computer use. Donc la cible est un **serveur MCP natif persistant** qui parle à Win32/UIA, pas des captures d'écran.

| Besoin | API NT/Win32 (Learn) | Note latence |
|---|---|---|
| lire l'UI | UI Automation `IUIAutomation` + **CacheRequest** (bulk fetch, 1 appel inter-processus pour N propriétés) | sans cache : 1 appel cross-process par propriété [V] |
| réagir aux changements | événements UIA (`AddAutomationEventHandler`) avec cache request, sur thread non-UI | évite le polling [V] |
| texte | `TextRange::GetText(-1)` par blocs | pas de cache pour TextPattern [V] |
| agir | patterns UIA (Invoke, Value, Toggle) ; fallback `SendInput` | Invoke sans souris [V learn.microsoft.com uiauto-implementinginvoke] ; sans focus [NV] (source introuvable: Learn ne le garantit pas) |
| voir | Windows.Graphics.Capture / DXGI Desktop Duplication, seulement si UIA ne suffit pas | [NV] (source introuvable: non recherché, hors périmètre réseau léger) |
| découverte d'outils | MCP on Windows : ODR `odr.exe mcp list/add`, connecteurs File Explorer et Settings ; build ≥ 26220.7262 (ce PC : 28120) | serveurs contenus par défaut ; non packagés = « Reduce protections for agent connectors » [V] |

## 3. Existant (gh api, forks aphrody-labs)

| Dépôt | Langage | État | Usage |
|---|---|---|---|
| CursorTouch/Windows-MCP (11,5k ★, push 2026-11-12) | Python | actif | référence fonctionnelle UIA + input ; Python = latence de démarrage, à réécrire |
| microsoft/UFO (10,2k ★) | Python | actif | agent UIA + vision Microsoft, modèle d'arbre de contrôle |
| microsoft/mcp-on-windows-samples | JS/C# | 2026-06 | enregistrement ODR, hôte MCP |
| microsoft/winappCli (+ skill `winappcli:winapp-ui-automation` installée) | — | actif | inspection/clic UI déjà disponible dans cette session |
| microsoft/windows-rs | Rust | actif | bindings UIA/Win32 pour la réécriture |
| microsoft/WinAppDriver | — | gelé 2025-04 | à ignorer |

## 4. Plan (haut niveau ; implémentation bas niveau = session nt-03)

1. `crates/winmcp` (Rust, windows-rs depuis le dépôt, stdio MCP, processus unique persistant) : `tree` (UIA cache, TreeScope_Subtree, filtre control view), `find`, `invoke`, `set_value`, `type`, `key`, `focus`, `windows`, `capture` (WGC), `watch` (événements UIA → notifications MCP).
2. Enregistrer dans Claude Code (`claude mcp add winmcp -- winmcp.exe`) et dans l'ODR (`odr mcp add manifest.json`).
3. Bench : latence d'un aller-retour `tree` + `invoke` vs Windows-MCP (Python) vs captures ; objectif < 50 ms par action [objectif, non mesuré].
4. Shell : garder niubash comme bash.exe ; mesurer le coût par commande (snapshot + CreateProcess) et tester `CLAUDE_CODE_SHELL_PREFIX` / `CLAUDE_ENV_FILE` pour le réduire.
5. GUI pur (jeux, canvas) : seulement là, captures + SendInput.

## 5. Décision : agent-desktop (vercel-labs) au lieu de winmcp (2026-11-12)

nt-03 a branché `agent-desktop mcp --headed` 1.2.0 (Rust, 67 outils, cache UIA + Windows.Graphics.Capture dans le source) et `agent-browser mcp` 0.42.0 dans Claude Code (scope user). `crates/winmcp` est abandonné : on assemble et on patche le fork aphrody-labs/agent-desktop.

Bench aller-retour MCP `tools/call` (tools/bench-mcp/bench.ts, bun, stdio persistant, médiane, ce PC) :

| Outil | médiane | p90 | réponse |
|---|---|---|---|
| initialize | 7,3 ms | — | — |
| desktop_version | 9,7 ms | 10,3 ms | 463 o |
| desktop_clipboard_get | 10,0 ms | 10,3 ms | 1 Ko |
| desktop_list_windows | 25,5 ms | 27,7 ms | 1,6 Ko |
| desktop_snapshot (WindowsTerminal, interactive_only) | 90,6 ms | 95,6 ms | 13 Ko |
| desktop_screenshot (écran 2560x1440) | 313 ms | 333 ms | 368 Ko |

Constats : un plancher d'environ 10 ms même pour `desktop_version`, qui ne fait rien, donc un surcoût côté serveur par appel (cause inconnue) ; le mode MCP ne fait pas gagner de temps par rapport au CLI (list_windows 25,5 vs 25,7 ms) ; la capture d'écran coûte 30 fois plus qu'un snapshot UIA. Priorités de patch : plancher par appel, capture (format/échelle, réutiliser le frame pool), snapshot ciblé. ODR bloqué : `odr mcp list` → « MCP surface is not enabled ».

## 6. État bas niveau (nt-03, 2026-11-12)
Claude Code tourne en admin (intégrité S-1-16-12288) ; Sudo for Windows Inline, ConsentPromptBehaviorAdmin=0 (élévation sans invite) ; profil WT Niubash elevate=true par défaut. Reproductible via C:\src\configuration (README, shell.dsc.winget, machine.export.dsc.winget 161 paquets, apply-user.ts --check, forks-aphrody-labs.sh). Surface MCP Windows / fonctionnalités agentiques : non activées, décision du propriétaire.
