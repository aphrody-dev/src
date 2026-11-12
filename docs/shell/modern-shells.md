# Shells modernes / structurés (état 2026-11-12)

Source commune des chiffres : `gh api repos/<repo>` et `/releases/latest`, interrogés le 2026-11-12. Contributeurs = pagination `contributors?anon=1` (approx.). « NV » = non vérifié dans cette passe.

## Maturité

| Shell | Repo | Étoiles | Dernière release | Dernier push | Licence | Contrib. |
|---|---|---|---|---|---|---|
| nushell | nushell/nushell | 41006 | 0.117.0 (2026-11-10) | 2026-11-12 | MIT | ~987 |
| fish 4.x (Rust) | fish-shell/fish-shell | 34456 | 4.9.3 (2026-09-08) | 2026-11-11 | GPL-2 (NOASSERTION) | ~1291 |
| xonsh | xonsh/xonsh | 9698 | 0.25.0 (2026-10-22) | 2026-11-09 | BSD-2 (NOASSERTION) | NV |
| elvish | elves/elvish | 6399 | v0.21.0 (2024-08-14) | 2026-03-31 | BSD-2 | ~99 |
| Amber | amber-lang/amber | 5247 | 0.6.0-alpha (2026-04-27) | 2026-11-12 | LGPL-3 | ~57 |
| oils (OSH/YSH) | oils-for-unix/oils | 3402 | pas de GH release (tarballs oils.pub) | 2026-11-02 | Apache-2 (NOASSERTION) | NV |
| murex | lmorg/murex | 1928 | v7.4.2002 (2026-11-10) | 2026-11-10 | GPL-2 | ~22 |
| ion (Redox) | redox-os/ion | 1660 | pas de release GH (miroir GitLab Redox) | 2026-11-03 | MIT | NV |
| closh | dundalek/closh | 1627 | v0.5.0 (2020-06-01) | 2022-12-05 | EPL-1 | NV |
| NGS | ngs-lang/ngs | 1520 | v0.2.17 (2025-04-05) | 2026-11-09 | GPL-3 | NV |
| Oh | michaelmacinnis/oh | 1380 | v0.8.3 (2023-09-14) | 2023-09-19 | MIT | NV |
| Hush | hush-shell/hush | 690 | aucune release GH | 2024-05-18 | MIT | NV |
| ABS | abs-lang/abs | 610 | 2.7.2 (2025-04-27) | 2025-04-27 | MIT | NV |
| es | wryun/es-shell | 375 | v0.10.0 (2026-02-16) | 2026-11-01 | domaine public-like (NOASSERTION) | NV |
| Marcel | geophile/marcel | 359 | v0.38.0 (2026-10-18) | 2026-10-18 | GPL-3 | NV |
| rc (Byron) | rakitzis/rc | 330 | aucune release GH | 2026-04-24 | zlib-like (NOASSERTION) | NV |
| Rash | rash-sh/rash | 257 | v3.0.0 (2026-10-08) | 2026-11-11 | GPL-3 | NV |
| Koi | introuvable sur GitHub (seul `sibarum/koine-shell`, 0 étoile) | - | - | - | - | NV |
| PowerShell (réf., exclu) | PowerShell/PowerShell | 56127 | v7.7.0 (2026-11-10) | 2026-11-12 | MIT | - |

## Modèle et fonctions

| Shell | Langage impl. | Données | Script | Complétion / LSP | Plugins | Windows natif |
|---|---|---|---|---|---|---|
| nushell | Rust | structuré (tables, records, types) | langage propre typé, pas POSIX | complétions externes (carapace), `nu --lsp` intégré | plugins binaires (protocole JSON/MsgPack stdio, `nu_plugin`) | oui, MSI/winget, 1re classe |
| fish 4.x | Rust (port terminé en 4.0, 2025-02) | texte | propre, pas POSIX | autosuggestions, complétions générées depuis man pages ; LSP tiers (fish-lsp) | fonctions/`fisher` | non officiel ; Cygwin/MSYS/WSL seulement (NV pour natif) |
| xonsh | Python | objets Python + texte | sur-ensemble Python | prompt-toolkit ; LSP tiers NV | xontribs (pip) | oui (Python Windows) |
| elvish | Go | structuré (listes, maps, lambdas) ; pipelines de valeurs | propre, fonctionnel | complétion programmable ; `elvish -lsp` | modules `use` | oui, binaire Windows officiel |
| murex | Go | typé (JSON, YAML, CSV… méta-type par pipe) | propre | autocomplete depuis man/`--help` ; LSP NV | modules/packages `murex-package` | oui (binaire Windows) |
| oils OSH/YSH | C++ traduit depuis Python typé (mycpp) | texte + JSON/J8 en YSH | OSH = bash compat ; YSH = nouveau langage | complétion bash-compat ; LSP NV | - | non (POSIX requis ; Cygwin NV) |
| ion | Rust | texte + tableaux/maps typés | propre | basique | - | non (Redox/Unix) |
| Amber | Rust | compile vers bash | langage typé type ECMAScript → bash | LSP (amber-lsp, NV version) | - | compilateur OK ; sortie exige bash (brush possible, NV) |
| NGS | C | structuré (objets, JSON) | langage général orienté ops | NV | NV | non (Unix) |
| Marcel | Python | objets Python en pipeline | ops + Python | NV | - | non (Linux/macOS) |
| Rash | Rust | texte/YAML | scripts déclaratifs type Ansible (Jinja/MiniJinja) | - | modules intégrés | NV |
| Hush | Rust | structuré (valeurs Lua-like) | Lua-like + blocs commande | - | - | NV, projet dormant |
| ABS | Go | valeurs typées | langage de script, backticks shell | - | - | oui (binaire) |
| closh | Clojure/ClojureScript | données EDN + texte | Clojure + syntaxe bash | - | - | NV, inactif |
| Oh | Go | texte + valeurs Scheme-like | Lisp-like, environnements first-class | - | - | NV |
| es / rc | C | texte, listes | rc (Plan 9) ; es = rc + fonctions de 1re classe | readline | - | pas de port natif connu ; Plan 9 port via plan9port (Unix) ; NV |
| PowerShell | .NET | objets .NET | propre | PSReadLine, LSP via PowerShellEditorServices | modules PSGallery | natif (exclu par contrainte) |

## Fonctions peu connues (sources : docs projet, NV sauf mention)

- nushell : `polars` plugin (DataFrames), `explore` TUI, `nu --mcp` serveur MCP (ajouté ~0.106, NV), `stor` (SQLite en mémoire), sortie `to nuon`.
- elvish : pipelines de valeurs + octets séparés, `-lsp`, web UI `elvish -web` retiré (NV), éditeur `navigation mode`.
- murex : pipes typés, `tread`/`try` avec gestion d'erreurs stderr, prévisualisation man inline (F1).
- fish 4.x : binaire autonome avec fonctions embarquées (4.x, NV), `abbr --function`, paste bracketed, sans dépendance ncurses.
- oils : `ysh` avec JSON8, `--tool syntax-tree`, `osh` exécute plus de bash réel que la plupart (spec tests publics).
- xonsh : mode Python ou subprocess détecté à l'analyse, `@$(cmd)`, `!()` CommandPipeline objet.
- Amber : génère du bash vérifiable ; utile pour scripts sous brush, sous réserve compat (NV).
- es : `%pipe`, `%create` hooks redéfinissables (spawning remplaçable en script).
- rc : syntaxe Plan 9 minimale ; pas de build Windows natif trouvé.

## Pertinence pour la contrainte (bash.exe pour Claude Code)

- Aucun de ces shells n'exécute le snapshot bash de Claude Code (fonctions, `shopt`, `export -p`) sauf oils OSH (non natif Windows).
- Structurés natifs Windows utilisables à côté : nushell, elvish, murex, xonsh. Aucun ne remplace brush comme `CLAUDE_CODE_GIT_BASH_PATH`.
- Amber est un générateur de bash, pas un shell ; compatible avec brush à valider.
