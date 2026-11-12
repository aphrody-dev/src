# Famille POSIX/Bourne — état au 2026-11-12

Légende : [V] vérifié (source citée), [NV] non vérifié (mémoire, à confirmer). Dates commit via `gh api repos/<r>/commits?per_page=1` le 2026-11-12.

## Synthèse

| Shell | Origine | Licence | Langage / LOC (ordre) | Dernière release | Dernier commit | Windows natif |
|---|---|---|---|---|---|---|
| Thompson sh | 1971, Ken Thompson [V en.wikipedia Thompson_shell] | historique (Unix V1-V6) | C/asm, ~1k | — | — | non |
| Bourne sh | 1979 (V7), Stephen Bourne [V en.wikipedia Bourne_shell] | CDDL via OpenSolaris puis schilytools [V en.wikipedia Bourne_shell] | C (macros ALGOL), ~5k | — | — | non |
| bash | 1989-06-08, Brian Fox ; mainteneur Chet Ramey [V en.wikipedia Bash] | GPL-3.0+ | C, ~150k [NV] (source introuvable: pas de miroir GitHub interrogeable, cgit savannah en timeout) | bash-5.3 [V git.savannah.gnu.org/git/bash.git tags] (2025-07-30 [V ftp.gnu.org/gnu/bash listing]) | n/d (dépôt savannah) | non (MSYS2/Cygwin seulement) |
| dash | 1997, Herbert Xu (port Debian d'ash NetBSD) [NV] (source introuvable: Wikipedia Almquist_shell ne donne pas l'année ; Xu confirmé par COPYING) | BSD (Berkeley, Almquist) + mksignames.c GPL [V dash COPYING] | C, ~15k [NV] (source introuvable: pas de stats de langage sur git.kernel.org) | v0.5.13.6 [V git.kernel.org dash tags] | n/d | non |
| ksh88 | 1983/1988, David Korn (Bell Labs) [V en.wikipedia KornShell] | propriétaire AT&T | C | — | — | non (MKS Toolkit = clone commercial) |
| ksh93u+m | ksh93 1993 Korn ; fork u+m mai 2020 Martijn Dekker [V en.wikipedia KornShell] | EPL-2.0 [V ksh93/ksh] | C, ~4,5 Mo de C (~150k lignes estimées) avec libast [V gh api languages] | v1.0.10, 2024-08-01 [V gh releases] | c3d1c750ab, 2026-11-11 [V] | non (UWIN historique, mort) [NV] (source introuvable: Wikipedia KornShell sans mention UWIN exploitable) |
| mksh | 2002, Thorsten Glaser (MirBSD), dérivé pdksh [NV] (source introuvable: page Wikipedia mksh absente ; dérivation pdksh confirmée par tag pdksh-5_2_14 du miroir) | MirOS (permissive ISC-like) [V MirBSD/mksh sh.h] | C, ~940 Ko (~30k lignes estimées) [V gh api languages] | R59c [V mirbsd.org/mksh.htm + tags miroir] | 3417528231, 2026-02-15 [V MirBSD/mksh miroir] | partiel : port Win32 natif contribué, basé sur R39 (ancien) [V mirbsd.org/mksh.htm] |
| pdksh / OpenBSD ksh | pdksh 1987 Eric Gisin ; OpenBSD ksh = suite | domaine public [V ibara/oksh README] | C, ~640 Ko (~20k lignes estimées) [V gh api languages] | oksh-7.9, 2026-06-10 [V ibara/oksh] | 15f69e430e, 2026-06-10 [V] | non |
| zsh | 1990, Paul Falstad [V en.wikipedia Z_shell] | MIT-like (« zsh licence ») | C, ~3,8 Mo (~130k lignes estimées, corrigé de ~200k) [V gh api languages] | zsh-5.9.2 (tag) [V zsh-users/zsh] | b13bbf2aca, 2026-11-10 [V] | non (Cygwin/MSYS2) |
| yash | 2007+, Yuki Watanabe (magicant) [NV] (source introuvable: repo GitHub créé 2012-11-24, migré ; pas de page Wikipedia) | GPL-2.0 [V] | C, ~1,5 Mo (~50k lignes estimées) [V gh api languages] | 2.61, 2026-03-03 [V gh releases] | 2172cdace3, 2026-11-07 [V] | non |
| busybox ash | 1989 Kenneth Almquist (ash) → BusyBox 1995 Bruce Perens [V en.wikipedia Almquist_shell, BusyBox] | GPL-2.0 | C, ash.c 14 871 lignes [V raw mirror/busybox master] | 1_36_1 sur miroir ; upstream git.busybox.net a 1_37_0 et 1_38_0 [V git ls-remote] | 371fe9f71d, 2024-07-13 (miroir figé) [V mirror/busybox] | non |
| busybox-w32 | Ron Yorston (frippery.org), page frippery datée 2013-02-15 [V frippery.org/busybox] | GPL-2.0 | C (MinGW), idem busybox | FRP-5857 [V frippery.org/busybox] ; tag TIG_1_23_0 [V] | b47ab56a76, 2026-11-12 [V rmyorston/busybox-w32] | **oui, natif Win32 (MinGW), exe unique 626-707 Ko selon variante [V frippery.org/busybox]** |
| toybox sh | 2006 Rob Landley ; sh (toysh) en cours depuis ~2019 [NV] (source introuvable: date non cherchée dans l'historique git) | 0BSD [V] | C, sh.c 5 466 lignes [V raw landley/toybox toys/pending/sh.c] | 0.8.15 (tag) [V landley/toybox] | 6a0c0ef5ee, 2026-10-06 [V] | non |
| Oils (OSH/YSH) | 2016 (repo créé 2016-11-15), Andy Chu [V gh api] | Apache-2.0 [V LICENSE.txt] | Python typé → C++ (mycpp), ~100k [NV] (source introuvable: gh languages dominé par code vendored) | 0.38.0 [V oils.pub/release/latest] | d114978ca4, 2026-11-02 [V oils-for-unix/oils] | non (WSL/Cygwin seulement) [NV] (source introuvable: README sans mention Windows) |
| schily bosh | Jörg Schilling, Bourne SVr4 repris ~2015 ; Schilling †2021, maintenance communautaire schilytools [V codeberg.org/schilytools] | CDDL | C, ~20k [NV] (source introuvable: non mesuré) | schilytools 2024-03-21 [V codeberg API tags] (codeberg.org/schilytools) | n/d | non |

## Conformité, compat bash, particularités

| Shell | POSIX | Compat bash | Fonctions avancées / peu connues | Démarrage |
|---|---|---|---|---|
| Thompson sh | pré-POSIX | aucune | `if`/`goto` externes ; pas de variables | — |
| Bourne sh | base de POSIX.2 | faible | here-docs, `trap`, fonctions (SVR2) | — |
| bash | bonne en `--posix`/`set -o posix` | référence | builtins chargeables (`enable -f`, `examples/loadables`), `coproc`, `BASH_XTRACEFD`, `${var@Q}`, `compgen`, funsub `${ cmd; }` et `${| cmd; }` (5.3) [V tiswww.case.edu/php/chet/bash/NEWS] | ~1-3 ms Linux [NV] (source introuvable: aucun benchmark publié consulté, mesure locale exclue) |
| dash | très bonne, minimale | faible (pas de tableaux, `[[`) | sert /bin/sh Debian/Ubuntu ; le plus rapide | ~0.5 ms [NV] (source introuvable: aucun benchmark publié consulté, mesure locale exclue) |
| ksh93u+m | bonne | moyenne (bash a copié ksh) | fonctions discipline (`x.get`/`x.set`/`x.unset`), types (`typeset -T`), variables composées, arith flottante, `getopts` auto-doc, builtins `.so` (`builtin -f`), namespaces | rapide [NV] (source introuvable: aucun benchmark publié consulté, mesure locale exclue) |
| mksh | bonne | moyenne | `mksh -T` / mode Android (/system/bin/sh Android), `print -R`, `${x@#}` hash, R-éd. `bind`, très compact ; « mksh tree » = arbre AST interne affichable [NV] (source introuvable: doc upstream non explicite) | ~1 ms [NV] (source introuvable: aucun benchmark publié consulté, mesure locale exclue) |
| OpenBSD ksh | bonne | faible | sh système OpenBSD, emacs/vi editing | rapide |
| zsh | partielle (`emulate sh`) | moyenne-bonne (`emulate bash` partiel) | ZLE (widgets), `zmodload` (zsh/zpty, zsh/net/tcp, zsh/datetime, zsh/curses), glob qualifiers `*(.om[1])`, `zcompile`, `zparseopts`, `zstyle` | 5-50 ms selon config [NV] (source introuvable: aucun benchmark publié consulté, mesure locale exclue) |
| yash | **la plus stricte** (`--posixly-correct`) | faible | prédiction de commandes, complétion programmable, suite de tests POSIX très complète | rapide [NV] (source introuvable: aucun benchmark publié consulté, mesure locale exclue) |
| busybox ash | bonne | partielle (`[[`, `${x//}`, `local`, tableaux non) | applets intégrés (NOFORK), `-X` exec applets | très rapide |
| busybox-w32 | idem ash | idem | chemins Windows, `$PATH` `;`, `/c/...` → `C:\`, applets internes, pas de fork (émulation `forkshell` par re-exec) [V ash.c busybox-w32], `drop` / `cdrive`, ligne de commande ConPTY OK [NV] (source introuvable: `drop` = miscutils/drop.c [V], `cdrive` et ConPTY non trouvés) | rapide (pas de fork) [NV] (source introuvable: aucun benchmark publié consulté, mesure locale exclue) |
| toybox sh | en cours, incomplète | objectif bash-like | vise remplacer mksh sur Android | — |
| OSH / YSH | OSH : bonne (spec tests vs bash/dash/mksh/zsh) | **OSH = objectif compat bash maximal** ; YSH = nouveau langage | parser statique, `osh -n` arbre AST, JSON/J8 natif, `shopt --set ysh:upgrade`, erreurs strictes (`strict:all`) | ~ bash [NV] (source introuvable: aucun benchmark publié consulté, mesure locale exclue) |
| bosh | bonne (certifiée vis-à-vis SVR4) | faible | historique éditeur, alias persistants, `repeat`, `obosh` mode Bourne pur | rapide [NV] (source introuvable: aucun benchmark publié consulté, mesure locale exclue) |

## Points clés pour notre cas (Windows sans MSYS)

- Seul **busybox-w32** est un shell POSIX natif Win32 mature de cette famille ; candidat crédible comme `sh.exe` pour `CLAUDE_CODE_GIT_BASH_PATH`, mais pas bash : snapshot Claude (`declare -f`, `shopt`, `export -p`) non supporté intégralement (`shopt` absent : 0 occurrence dans ash.c busybox-w32 [V raw master]) ; `declare -f` [NV, à tester] (source introuvable: comportement runtime, test local requis).
- Tous les autres nécessitent couche POSIX (Cygwin/MSYS2/WSL) → exclus par contrainte.
- brush (Rust, hors famille C) reste le seul visant compat bash en natif Windows.

## Sources

- https://github.com/ksh93/ksh , https://github.com/MirBSD/mksh , https://github.com/zsh-users/zsh , https://github.com/magicant/yash , https://github.com/oils-for-unix/oils , https://github.com/rmyorston/busybox-w32 , https://github.com/landley/toybox , https://github.com/mirror/busybox , https://github.com/ibara/oksh (gh api, 2026-11-12)
- git.savannah.gnu.org/git/bash.git, git.kernel.org/pub/scm/utils/dash/dash.git (ls-remote tags, 2026-11-12)
- Consultés : en.wikipedia (raw), ftp.gnu.org, tiswww.case.edu, git.busybox.net, frippery.org/busybox, oils.pub, codeberg.org/schilytools, mirbsd.org/mksh.htm
