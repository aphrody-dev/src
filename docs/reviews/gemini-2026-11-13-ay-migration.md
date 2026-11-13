# Revue Gemini (relais, moteur antigravity) : docs/ay/MIGRATION.md et crates/bun-flat (2026-11-13)

Score : 12/20. Contenu soumis : résumé des sections 1 à 9 du plan (la revue n'a pas lu `sync.rs`).

| # | Remarque | Statut |
|---|---|---|
| 1 | détection textuelle de `bun_x::` non aplati (alias, macros, `extern crate`) | partiel : lignes de commentaire ignorées, test négatif ajouté (`foreign_paths_outside_comments`) ; la compilation de `aphrody-bun-flat` reste la garantie finale (un chemin manquant ne compile pas) |
| 2 | renommage textuel, `ay flat check` ne compare que la régénération | réfuté en partie : les tests amont (vecteurs wyhash de wangyi-fudan, tests de sort_by_number) sont aplatis et tournent dans `cargo test -p aphrody-bun-flat` |
| 3 | `#![feature]` remonté sans épingle | la racine épingle `nightly-2026-11-12` (rust-toolchain.toml) ; la compilation CI échoue si la feature disparaît |
| 4 | arête moteur JS de `bun_install`, licences C | déjà au plan (AY_ON_BUN.md §2, §4 : règle archguard sur `cargo tree`) ; licences C : tableau §2 d'après LICENSE.md du fork |
| 5 | équivalence de la build C/C++ de `crates/bun-sys` | TODO lot 2 : flags tirés de `build.ninja` du fork, comparaison `nm` |
| 6 | budgets taille/temps avant le lot 2 | TODO lot 2 (mesure `ay time` déjà outillée) |
| 8 | LTO croisé promis malgré LLVM 24 vs 23 | le plan le conditionne au règlement du conflit (§6, §8) |
| 9 | FTS5 non testé, tokenizer anglais | réfuté : le test `incremental_apply_search_show_stats` crée la table FTS5 ; la doc Bun est anglaise, seuls les skills sont en français |
| 10 | découpage de llms-full.txt fragile (`#` en bloc de code) | corrigé : blocs ``` ignorés, test ajouté ; vérifié 319 pages, 0 faux titre sur le fichier du 2026-11-13 |
| 11 | clé d'hôte, échappement, reprise `--detach` | réfuté : aphrody-remote vérifie known_hosts ; arguments quotés en POSIX (`sh_quote`, testé) ; le journal détaché est sous `<root>/ay-chromium-<cmd>.log` |
| 13 | `install` hors d'échelle | noté : lot 5 séparé, preuve de AY_ON_BUN.md phase 4 |
