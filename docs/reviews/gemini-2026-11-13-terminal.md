# Revue Gemini (Carbon High) : pile terminal centrale

Chat : https://gemini.google.com/app/c55f5e4e846252c8 (2026-11-13). Objet : `docs/terminal/ARCHITECTURE.md`,
`infra/fleet/bin/terminal-prd-build.sh`, recettes `just terminal-*` (première version). Note : 11,5/20.

| # | Défaut relevé | Suite |
|---|---|---|
| 1 | `microsoft/terminal` qualifié de parent du fork | corrigé : base dont `microsoft/intelligent-terminal` est issu |
| 2 | chemins sans préfixe `src/renderer/`, `src/cascadia/` ; colonne rendu incomplète | corrigé |
| 3 | `installer/bootstrap` absent de l'inventaire | corrigé : aucune dépendance (std seul) ; construit et testé par PR CI (`pr-ci.yml` l. 205-213) |
| 4 | épinglage `src.lock.json` non appliqué sur prd ; toolchain LLVM partagée non utilisée ; build prd présenté comme build des dépendances | corrigé : `PINS` tirés de `src.lock.json` ; doc : clang/lld système, validation Linux autonome |
| 5 | `terminal-ci` mute le fork ; `terminal-sync` décrit comme git seul | corrigé : `gh repo sync` déplacé dans `terminal-sync`, description gh/bun/ay lock |
| 6 | terminal-control rattaché à tort à `tools/wta` | corrigé : en-tête du script |
| 7 | nice partiel, pas de verrou, caches hors du dossier de travail | corrigé : `taskset` + `nice 19` + `ionice -c 3` sur tout l'arbre, `flock`, `ZIG_GLOBAL_CACHE_DIR` |
| 8 | HEAD flottant, pas de `git clean` | corrigé |
| 9 | GSL sans unité compilée ; CMakeCache persistant | corrigé : `--fresh` ; GSL documenté header-only (configuré seulement) |
| 10 | extraction Zig non atomique | corrigé |
| 11 | zig build ignore `-j 4` ; toolchain non fixée ; target-dir partagé | corrigé : `taskset` sur 4 CPU, `RUSTUP_TOOLCHAIN=stable`, target-dir par dépôt |
| 12 | `rustup` masqué sous `set -e` ; `cargo check` WTA | étape retirée : `ring` exige les en-têtes CRT MSVC (essai prd : `assert.h` introuvable avec clang-cl) ; WTA couvert par PR CI |
| 13 | injection via `{{step}}`, `/tmp` fixe, `JOBS` figé | corrigé : validation de `step`/`jobs`, copie dans le home distant, paramètre `jobs` |
| 14 | `workflow_dispatch` supposé | réfuté : présent dans `pr-ci.yml` (run 43338025934 lancé ainsi) ; `gh repo sync` retiré de `terminal-ci` |
| 15 | `terminal-sync` non filtré | assumé et documenté : `forks.ts` n'a pas de filtre de périmètre |
