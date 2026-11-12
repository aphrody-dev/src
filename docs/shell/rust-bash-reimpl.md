Réimplémentations de bash et shells Rust — remplacer Git Bash pour Claude Code (Windows)

Date : 2026-11-12. Sources GitHub via `gh api` le même jour. [NV] = non vérifié.

## Panorama

| Projet | Langage | Compat bash | Windows natif | Étoiles / activité | Source |
|---|---|---|---|---|---|
| brush (reubeno/brush) | Rust | élevée (2 500+ cas comparés à bash) | « Preview » x86_64/aarch64 | 2310, push 2026-11-12, v0.4.0 du 2026-05-03 | repo@f550117d8e, README |
| Oils OSH | Python → C++ traduit | très élevée (spec tests) | non officiel ; [NV] build MinGW/WSL seulement (source introuvable: README sans mention Windows) | 3402, push 2026-11-02 | oils-for-unix/oils README |
| rusty_bash (shellgei) | Rust | partielle, projet éducatif | Unix only (CI Linux/macOS seulement) [V shellgei/rusty_bash README] | 243, push 2026-11-01 | shellgei/rusty_bash |
| nushell | Rust | aucune (langage propre) | oui | 41006 | nushell/nushell |
| fish | Rust (depuis 4.0) | aucune (syntaxe propre) | non natif (WSL, Cygwin ou MSYS2) [V fish-shell README.rst] | 34456 | fish-shell/fish-shell |
| uutils coreutils | Rust | pas de `sh` | oui | 24360 | uutils/coreutils |
| « shy », « rush » | — | introuvables (404 sur noms supposés) | — | — | gh api 2026-11-12 |
| busybox-w32 (ash) | C, MinGW natif | POSIX + extensions bash partielles (pas de builtin `declare` : 0 occurrence dans ash.c [V raw busybox-w32 master]) | oui, sans MSYS | 902, tag TIG_1_23_0 | rmyorston/busybox-w32 |
| w64devkit | busybox-w32 + GCC | idem ash | oui | 5002, v2.11.0 2026-10-29 | skeeto/w64devkit |
| bash MinGW/MSVC natif | C | bash complet | pas de port maintenu sans couche POSIX (MSYS2/Cygwin requis) [NV] (source introuvable: absence non prouvable par recherche) | — | — |

Note : microsoft/coreutils (« Coreutils for Windows », créé 2026-05-15, 5375 ★) est cité par brush comme compagnon recommandé.

## brush : architecture (repo@f550117d8e)

| Crate | Rôle |
|---|---|
| brush-parser | tokenizer/parser bash → AST |
| brush-core | exécution, expansions, variables, jobs, traps |
| brush-builtins / brush-coreutils-builtins / brush-experimental-builtins | builtins (option : coreutils intégrés) |
| brush-interactive | readline/édition, prompt |
| brush-shell | binaire, `tests/cases` (suite compat YAML) |
| brush-test-harness, brush-bundled-tests, e2e, fuzz | tests |

Compat : suite de 2 500+ cas comparant stdout/stderr/exit/FS avec bash, exécutée sur Linux/macOS uniquement ; Windows = build + checks + petite suite spécifique (README). Taux de réussite publié : non chiffré dans le README, voir brush.sh/reference/compatibility [V page en ligne, aucun taux chiffré trouvé]. Manquants déclarés : `select`, `wait -n`, `disown`, certains traps.

## Issues brush ouvertes pertinentes (2026-11-12)

| # | Sujet | Impact snapshot / Claude |
|---|---|---|
| 1086 | alias avec quotes | `alias -p` du snapshot mal relu |
| 1397 | alias imbriqués | idem |
| 1580 | `declare -f` réindente heredocs/chaînes multilignes | fonctions corrompues au re-sourcing |
| 1569 | brace expansion dans `declare/local/export` | rare |
| 1581 | `globstar` accepté mais `**` non récursif | `shopt -s globstar` silencieusement faux |
| 1585 | `${v:=w}` avec `declare -u/-l` | rare |
| 1540 (PR) | trap EXIT en sous-shell | traps |
| 1268 (PR) | `trap -p` signaux ignorés | traps |
| 1662, 1294 (PR) | blocage process substitution | `<(...)` |
| 1359 | Windows : pipe bloque > 4096 caractères | critique (sorties longues) |
| 1317 | Windows : PATHEXT résolu mais lancé non résolu (npx → os error 193) | critique (.cmd/.bat) |
| 1251 | Windows : chemin relatif après `cd` non résolu | important |
| 1295 (PR) | quoting des arguments externes Windows | important |
| 1372 (PR) | erreurs avec CR | scripts CRLF |
| 1239 | binaires Windows publiés | distribution |
| 1174 (PR) | `wait` imprime statut job | bruit |

37 issues ouvertes matchent « windows » (search API).

## Gap list brush vs besoins Claude Code

| Besoin | État brush | Gravité |
|---|---|---|
| Sourcing snapshot (fonctions, `alias`, `shopt -p`, `export -p`) | OK si non tronqué (87 fonctions testées localement) ; #1086/#1397/#1580 | moyen |
| Snapshot tronqué ~70927 o | comportement Claude, pas brush : réduire fonctions exportées | moyen |
| Pipelines | OK ; Windows #1359 (> 4 Ko bloque) | élevé |
| Redirections `>`, `2>&1`, `/dev/null` | OK ; `/dev/null` mappé vers NUL [V brush-core/src/sys/windows/fs.rs open_null_file] | faible |
| Heredocs / here-strings | OK, sauf via `declare -f` (#1580) | moyen |
| Sous-shells `( )`, `$( )` | OK ; traps EXIT sous-shell (#1540) | faible |
| Process substitution | blocages (#1662, #1294) ; Windows [NV] (nécessite Windows propre ; brush main échoue `bash-procsub` dans shell-matrix, 2026-11-12) | moyen |
| Jobs en fond `&`, `wait` | partiel ; `wait -n`, `disown` absents ; contrôle de jobs Windows limité | moyen |
| Signaux / traps | partiel (« some traps » manquants) ; pas de SIGINT POSIX sous Windows | moyen |
| Codes de sortie | OK (comparés par la suite) | faible |
| PATH avec chemins Windows (`C:\...`, `;`) | fonctionnel ; PATHEXT défectueux (#1317), cwd relatif (#1251) | élevé |
| Quoting args vers .exe | correction en cours (#1295) | élevé |
| Conversion `cygpath` (`/c/x` ↔ `C:\x`) | absente : aucun équivalent ; prévoir fonction/outil (`cygpath` shim Rust) | élevé |
| CRLF dans scripts | #1372 | faible |

## Conclusion

- brush reste le seul bash Rust crédible pour Windows natif ; risques bloquants : #1359, #1317, #1295, absence de cygpath.
- Plan B sans MSYS : busybox-w32 `sh.exe` (natif, mature, gère `C:/` ; compat bash partielle, snapshot à valider).
- OSH, rusty_bash, nushell, fish : non adaptés (pas de Windows natif ou pas de syntaxe bash).
