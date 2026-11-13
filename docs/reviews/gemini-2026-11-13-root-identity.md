# Revue Gemini 4 Carbon High : identity.toml, racine, doublons, pin-001 (2026-11-13)

Chat : https://gemini.google.com/app/8325bf746a99c899 (suite de la revue de fusion à 12,5/20, [verdict](gemini-2026-11-13-merge.md)). Entrée : résumé des corrections, identity.toml, scripts/identity.ts, crates/xtask/src/manifests.rs, diffs de docs/ARCHITECTURE*.md, IDENTITY.md, context.ts, corelib, WSLg, conformance.

## Tour 1 : 14,5/20

Défauts relevés (résumé fidèle, classés par Gemini) :

- P0 tv-* encore LGPL en L1, pas de `-crates/tv-ffmpeg`, pas de contrôle CI de la configuration FFmpeg.
- P0 adblock : `Request::new(url, url, "other")` rend toute requête first-party (règles `$third-party`, `$script`... inopérantes) ; `split_once("##")` jette le domaine des règles cosmétiques ciblées.
- P0 identity.ts : quand le scope n'a pas changé, ni les dépendances d'un autre scope ni un nom arbitraire `@aphrody/x` ne sont détectés ; `tomlField` ignore les commentaires en ligne et casse un tableau multiligne.
- P1 manifests.rs : `docs/patches/series` lit `third_party/` (non versionné) ; `gitlinks()` avale l'échec de git ; pas de dérive inverse ; `apps/rosegriffon` en dérive.
- P1 corelib en L1 malgré wgpu et nom `sovereign-corelib` ; `cfg(windows)` de smithay-wayland-wire et wslg-cli = coquille vide sur Linux (§6).
- P1 context.ts : `substr()` neutralise l'index ; pagination OFFSET hors transaction ; recall() filtrerait encore après LIMIT.
- P1 checkdeps sans Python ni arêtes apps/nt.
- P2 `ay conformance channels` (--help, dossier parent) ; docs : octet 0x1A, racine `.lore`/`Cargo.toml` en §6, §11-§12 en anglais avec repos.tsv/M0, IDENTITY.md périmé.

## Suites données (commit ceea776)

- tv-* : réfuté, déjà corrigé avant la revue (licence du workspace, exception WTFPL ciblée, `-crates/tv-ffmpeg` + `+` dans tv-cli). Ajouté : test `ffmpeg_build_is_lgpl` (gate de distribution, `--ignored`). Constat : le FFmpeg d'Arch sur prd est `--enable-gpl` (§11).
- adblock : `check_request(url, source_url, request_type)`, cosmétiques génériques seuls + `hide_selectors_for(page)` via `url_cosmetic_resources`. Tests $third-party et règle ciblée.
- identity.ts : noms attendus déterministes, clés `workspace:` vérifiées, comparaison TOML parsée, réécriture des tableaux multilignes ; scripts/identity.test.ts.
- manifests.rs : `ls_files_stage` en Result, series sans third_party/, dérive inverse.
- corelib -> `aphrody-corelib`, L3. smithay-wayland-wire et cosmic-compat portables (seuls Hyper-V et D3D12 en cfg(windows)) ; dx12-winui-core et l'hôte wslg-cli Windows par nature (§6, TICKET dx12-001).
- context.ts : plage indexable, index (scope, at, rid), pagination keyset en transaction. Réfuté : recall() n'a pas d'autre requête candidate que `list()` (masquée en SQL).
- checkdeps : unités uv, `uv run pytest` dans test-affected. Réfuté : apps/nt n'a aucune arête de build vers crates/* ou infra/*.
- conformance channels : --help, argument inconnu, create_dir_all ; doublon `infra/scripts/chrome-channels.sh` supprimé.
- docs : 0x1A, §6, §11-§12 en français avec la règle `third_party/patches/`, IDENTITY.md.
- Reste : dérive `apps/rosegriffon` (gitlink ff692b5 vs verrou f5d61f9), produit hors périmètre : `ay lock` par son propriétaire.

## Tour 2 : 16,5/20 (commit ceea776)

Plus aucun P0. P1 : identity.ts (dépendance `workspace:` erronée invisible à scope constant, workspaces limités à packages/*, commentaires TOML contenant un guillemet, clés mortes), web.rs (procéduraux et exceptions cosmétiques hors moteur, hosts tabulés ou IPv6, ABI C sans check_request), tv-ffmpeg (LGPL-3.0 acceptée par `starts_with("LGPL")`, test ignoré non câblé, confinement seulement dans crates/). P2 : dérive inverse tolérant un arbre fusionné encore épinglé, dx12-winui-core hors [workspace.dependencies], channels écrasant une plateforme par une autre, exception third_party/ non écrite dans l'invariant 4, gates de apps/nt.
Réfutations acceptées : recall() (candidats via list() masqué en SQL), apps/nt sans arête ; partiellement : chrome-channels.toml comme pin suivi (à écrire dans l'invariant 4, fait).

Suites (2b4e6d1, 04f9d6f, 783b12d) : cibles `workspace:` en ensemble fermé, globs `workspaces` (écart réel trouvé : infra/ffi-bridge renommé @aphrody/ffi-bridge), préfixe de crate appliqué avec [naming.crate_names], commentaires TOML par balayage ; cosmétique entièrement déléguée à adblock (url_cosmetic_resources + hidden_class_id_selectors), hosts tab/IPv6 ; FFmpeg « LGPL version 2.1 » sans --enable-version3, non-distribution de tv-* prouvée par dist-workspace.toml ; -crates/tv-ffmpeg et -crates/lore-error-set* à la racine de DEPS.rules ; dérive inverse stricte ; WSLg au workspace ; pins chrome par plateforme ; .obj/.lib/.exp de infra/winnt-sdk retirés ; tickets nt-001, dx12-001 ; §4/§11 : patchs dans des forks aphrody-labs épinglés par rev.

## Tour 3 : 18/20 (commits 2b4e6d1..783b12d)

Aucun P0. Restes P1 : ABI C (crates/ffi) qui évalue tout en tiers et calcule les sélecteurs cosmétiques par requête au lieu de deux fonctions (check_request, cosmetic) ; identity.ts qui ne réécrit pas les clés Cargo `aphrody-x = {...}` / `aphrody-x.workspace` lors d'un changement de crate_prefix, ni les crates/aphrody-design-_, ni les imports TS `@scope/` ; infra/ffi-bridge hors packages/ et sens de nt-001 (L2 -> L5). P2 : channels (CRLF, nom de plateforme), exécution de nt-001 et dx12-001.
Réfutations acceptées : non-distribution de tv-_ ; gates de apps/nt dans nt.yml ; retrait des clés mortes. Réfutée : direction de nt-001 (corrigée).

Suites (addb9bc) : nt-001 réécrit en sens descendant (DLL partagée en L2, apps/nt et unix-distro.ts en dépendent ; ffi-bridge rejoint packages/) ; channels : plateforme validée, comparaison sans CRLF ; collisions de noms de workspace refusées ; dépôt déplacé chez aphrody-labs suivi par `[product].repo_org` (le gate identity a détecté la copie modifiée à la main).
Reste ouvert : ABI C adblock en deux fonctions (crates/ffi, fichier tenu par un autre agent), renommage complet sur changement de crate_prefix (clés Cargo, design-*, imports TS), exécution de nt-001 / dx12-001, dérive gitlink apps/rosegriffon.
