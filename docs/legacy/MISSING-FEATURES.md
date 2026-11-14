# Fonctionnalites legacy absentes (aphrody, ay, bun fork)

Genere le 2026-11-14. Sources restaurees sur fr1 (`/home/legacy`), analyse en lecture seule. Statut = missing / partial / present vs etat courant. Effort = estimation non mesuree.

## Restore locations (fr1)

| Chemin | Contenu |
|---|---|
| `/home/legacy/git/*.git` | miroirs `--mirror` de 31 repos aphrody-labs : bun-os, bun-distribution, yolo, yolo-bun, yolo-hub, yolo-os, yolo-rs, yolo-engine, yolo-vps(-dup-labs), yolo-backend, yolo-ui, yolo-web, yolo-ai, yolo-re, yolo-zig, yolo-cross, yolo-stack, yolo-plugins, yolo-vendor, yolo-cloudflare, google-bun, wii-os, ai-os, bun-plugins, bun-parity, chromium-bun, aphrody-app, aphrody-m3, aphrody-web-archive |
| `/home/legacy/git/bun` | clone de aphrody-labs/bun, branche `legacy/bun-1.4.6` = fd9d7a224b83 (2026-10-17), `origin/main` = b6c3f857f7 |
| `/home/legacy/npm/_<scope>_<pkg>/package` | 201 tarballs npm (latest) de yohan971, hors binaires de plateforme ; `_bun-video-5` = @aphrody/bun-video@1.4.4-video.5 |
| `/home/legacy/crates/<crate>` | 13 crates crates.io (bun-os-*, bunos-*, bun_host, bun_env_cookie, bun-steam, bun_browser_dom/extract) |
| `/home/legacy/local/bun-1.4.6` | binaire bun 1.4.6-canary.1+fd9d7a224 copie de `~/build/tools`, dumps `api_*.txt` (Object.getOwnPropertyNames(Bun)/process) et `h1`/`h2` (`--help`) |
| R2 | rien de pertinent restaure : `bun-lib`, `aphrody-video` = vitrines statiques/posters, `bun-os-private` vide, `aphrody-archive` = sauvegardes fleet chiffrees (.age) |

Repo `aphrody-labs/bun` : main = upstream rebase (251 commits propres), `legacy/bun-1.4.6` a 1366 commits que main n'a pas ; diff arbre : 47281 fichiers ajoutes cote legacy, 74179 cote main, 5021 modifies.

## 1. Bun fork (aphrody-labs/bun main)

Mesure : `bun --help` et `Object.getOwnPropertyNames(Bun)` sur fr1, bun-1.4.6 legacy vs `/usr/local/bin/bun` 1.4.5-canary.1+6db952080 (flotte). Main n'ajoute que `--aot`, `--cpu-prof`/`--heap-prof`, `check`, `compile` (upstream). Tous les repertoires ci-dessous existent dans `legacy/bun-1.4.6:src/` et sont absents de `origin/main:src/` (`git ls-tree`).

| # | Feature | Source legacy (bun@fd9d7a224) | Evidence | Statut | Effort (non mesure) |
|---|---|---|---|---|---|
| B1 | `Bun.Video` + `bun video metadata/frame` (frames, audio, GIF, remux) | src/runtime/video/{Video.rs 411 l,Video.classes.ts}, src/runtime/cli/video_command.rs, src/js/eval/video.ts | `Bun.Video` dans dump legacy, absent du bun fleet ; `bun video --help` -> "Script not found" | missing | L |
| B2 | `Bun.Crawl`, `Bun.Curl`, `Bun.HTML`, `Bun.WebDetect`, `Bun.VectorIndex` | src/runtime/{crawl,curl,web_detect,vector_index}, src/js/builtins/Curl.ts | diff des cles `Bun.*` : 9 cles seulement legacy | missing | M chacun |
| B3 | `Bun.BrowserRealm`, moteur `src/browser` (608 fichiers, cef-rs) | src/browser, src/runtime/api/BrowserRealm.rs, src/js/builtins/WebView.ts | `ls-tree src/` | missing | XL |
| B4 | Terminal Rio : `Bun.RioTerminal`, `Bun.TerminalScreen`, `bun:rio` | src/rio (618 f), src/vt, src/runtime/api/{rio.rs,terminal_screen.rs}, src/js/bun/rio.ts | cles Bun.* + dirs | missing | XL |
| B5 | `bun lint`/`bun fmt` natifs "quality engine" (adapters, 6940 fichiers) + `bun rename` | src/quality | help legacy : "Lint with Bun's native quality engine" vs fleet "like ESLint" | missing | XL |
| B6 | `bun just` (justfile natif, 290 f) | src/just, src/runtime/cli/just_command.rs | help legacy `just [recipe]` | missing | M |
| B7 | `bun n2b scan/fix/migrate` (Node vers Bun) | src/migrate (116 f), packages/bun-n2b, crates/aphrody-jev | help legacy | missing | L |
| B8 | `bun mcp` (serveur MCP natif, budget de tokens) + agent_tools + `bun agent-plugin install` | src/mcp (27 f), src/agent_tools, cli/{mcp,agent_plugin}_command.rs | help legacy | missing | L |
| B9 | `bun lsp` (TS, Python, Rust, C/C++, C#) | src/lsp (32 f), cli/lsp_command.rs | help legacy | missing | L |
| B10 | `bun ssh` (client/serveur, copies, forwards) | src/ssh, cli/ssh_command.rs, vendor/russh-sftp | help legacy | missing | M |
| B11 | `bun host` / `bun env` / `bun cookie` / `bun msvc` / `bun winmd` / `bun dotnet` / `bun uv` / `bun docker` / `bun vpn` / `bun search` / `bun docs` | src/{host,env_cookie,docker,bun_vpn,google,no_window}, cli/*_command.rs | help legacy (liste des 22 sous-commandes) | missing | M chacun |
| B12 | `bun wasm build ./crate` + C ABI wasm32-wasip1-threads | src/wasm, help legacy | | missing | M |
| B13 | Modules `bun:*` : adblock, cosmic, privacy (Brave), graph (+graphx), google, windows/winrt/winui, linux, nginx, python, dotnet, wasm, chromium, obscura, yolo | src/js/bun/*.ts (20 fichiers), src/runtime/{adblock,cosmic,privacy.rs,graph_native.rs,nginx,dotnet,windows,linux,yolo} | `comm` des listings | missing | L chacun |
| B14 | busybox/coreutils uutils embarque (`Bun.spawn({argv0})`, Bun Shell applets) | src/coreutils | lib.rs en-tete | missing | M |
| B15 | vfs (index volume + edits transactionnels), workspace, workflow, file_tools, readability, libarchive, x (Twitter), privacy/adblock Brave | src/{vfs,workspace,workflow,file_tools,readability,libarchive,x,privacy,adblock} | dirs | missing | M chacun |
| B16 | vendor Brave/mullvad/uv/windows-rs/russh-sftp/find-msvc-tools ; apps/desktop, apps/mobile ; ~55 packages (bun-video, bun-os plugins, bun-fluent, bun-m3, bun-cosmic, bun-llama, bun-nginx, bun-oxc, bun-supervisor, bun-winsvc, bun-python-*, bun-dotnet*, buv, web...) | tree root legacy | `ls-tree packages/` : main n'en garde que 15 upstream | missing | L |
| B17 | Node : `repl`, `readline` (JS) | src/js/node | main a des versions .ts | present (autre forme) | - |
| B18 | `--aot`, `--cpu-prof`, `check`, `compile` | (main seulement) | help fleet | present en main, absent legacy | - |

Compte Bun fork : 16 missing, 1 present.

## 2. ay (crates/ay)

Reference : `ay --help` courant (36 commandes : arch, doctor, lock, git, graph, deploy, gaming, upstream, linux, pkg, lfs, ssh, auth/secret/vault, build, sys, up, bun, ai, docs, flat, hash, time, chromium, engines, agents, steam...). Equivalents legacy : sous-commandes bun ci-dessus et `yolo-cli`/`yolo-os` (yolo-os@de0d61a packages/yolo-cli, bunos-run, update, registry ; yolo@a9c0a73 packages/runtime).

| # | Feature legacy | Source | Statut ay | Effort |
|---|---|---|---|---|
| A1 | `ay host` : inventaire ressources + registre signe multi-machines | crate bun_host 1.4.7 (3455 l), bun src/host | partial (`ay sys` = profil machine, pas de registre signe) | M |
| A2 | `ay env` / `ay cookie` (.env, jars de cookies navigateur) | crate bun_env_cookie 1.4.7 (3425 l) | partial (`ay auth/secret/vault`, pas de jars) | M |
| A3 | `ay msvc` (MSVC + Windows SDK env) | bun cli/msvc_command.rs, vendor/find-msvc-tools | missing | S |
| A4 | `ay winmd` (bindings Rust/bun:ffi depuis metadonnees Windows) | cli/winmd_command.rs | missing (windows-bindgen dans la pile, sans commande) | M |
| A5 | `ay lsp` / `ay mcp` (serveur MCP stdio/http, outils agent) | src/lsp, src/mcp, src/agent_tools | missing (`ay graph mcp` seul) | L |
| A6 | `ay n2b` (migration Node vers Bun) | crates aphrody-n2b-* (bun-distribution), yolo crates | missing | L |
| A7 | `ay video` / `ay search` | bun video_command.rs, search_command.rs, crate bun-os-google | missing | M |
| A8 | `ay docker` (client Engine HTTP natif) | src/docker | missing (`ay deploy` delegue a just) | M |
| A9 | `ay vpn` (Mullvad) | src/bun_vpn | missing | S |
| A10 | `ay uv` / `ay dotnet` / `ay just` | cli/{uv,dotnet,just}_command.rs | partial (`ay rt` = uv/Python ; pas dotnet/just) | S |
| A11 | `cargo lfs` (LFS orchestration) | yolo-os crates/cargo-lfs | partial (`ay lfs` = bun-LFS CI, autre scope) | M |
| A12 | `yolo pkg` backends (pacman, fdroid, image-plan, verify-image-plan), `bunos-run` (apk/windows) | yolo-os packages/{yolo-cli,bunos-run} | partial (`ay pkg` recettes distro) | M |
| A13 | `update` (deps inventory, ecosystems bun/rust-doctor) | yolo-os packages/update | partial (`ay up`, `ay bun bump`) | S |
| A14 | `ay accounts` (OAuth PKCE loopback, vault, scopes) | crate aphrody-accounts (bun-os) | missing | M |

Compte ay : 9 missing, 5 partial.

## 3. Monorepo aphrody (C:\src)

Etat courant verifie par recherche de noms (`fd -t d`) dans crates/, packages/, apps/ : absence = aucun repertoire du nom. Presents : `crates/adblock-capi`, `crates/wslg-cli`, `crates/steam-depot`, `crates/cosmic-compat`, `crates/bun-flat`, `apps/rosegriffon/crates/aphrody-nie-*`, `infra/cloudflare/workers/aphrody-webos`, `packages/hyperframes` (apps/shenron), `packages/ai-os`.

| # | Feature | Source legacy | Evidence | Statut | Effort |
|---|---|---|---|---|---|
| M1 | Package `@aphrody/bun-video` (mediabunny, yt-dlp, hyperframes natif, Remotion, pipeline, watch, studio, MCP, Crunchyroll, HAR/DASH/HLS) | npm @aphrody/bun-video@1.4.4-video.5 (`src/*.ts`, 70+ modules) ; bun-video-project@1.4.7 | pas de packages/bun-video ; seul un worker showcase | missing (partial via shenron hyperframes) | L |
| M2 | bun-os : `aphrody-accounts`, `aphrody-hayro-jbig2/syntax` (PDF/JBIG2), `aphrody-themes`, `aphrody-web`, `bun-re`, `effectcraft-{color,geom,time}` | bun-os@8522911 crates/ | fd : NONE | missing | M chacun |
| M3 | Bun OS Windows : `bunos-nt-proto` (IOCTL bunos.sys), `bunos-win11-chrome` (DWM/Mica), `bunos-win11-wallpaper`, `bunos-wsl-core` | crates bunos-* 1.4.7 | fd : NONE (wslg-cli = autre) | missing | M |
| M4 | yolo-os : noyau/PID1 Bun (`bunos-init`), `aphrody-kernel*`, `aphrody-proc`, `aphrody-subsystem`, `aphrody-nu`, `aphrody-remote-desktop`, `rfb-encodings`, `bun-waydroid`, `yolo-os-{nt-driver,wayland-win,wsl-service,...}` | yolo-os@de0d61a crates/, packages/bunos-init | fd : NONE | missing | XL |
| M5 | Shell/terminal web : `aphrody-shell-{session,vfs,web}`, `aphrody-term(inal)-core/backend`, `aphrody-webos-{client,server,sessions,wasm,protocol}` | yolo-os, bun-distribution crates | seul le worker `aphrody-webos` | partial | L |
| M6 | Google/Gemini : `aphrody-gemini-web`, `aphrody-gemini-runtime`, `aphrody-google`, `aphrody-antigravity`, `aphrody-model-antigravity` | bun-distribution@d8d1f62 | seul `packages/ai-os/docs/gemini-web` | partial | L |
| M7 | NIE complet (`aphrody-nie-*` x ~45 : render3d, lua, forge, mcp, wiki, zukan, viola...) | bun-distribution crates/ | present dans apps/rosegriffon (3 verifies, reste non compare) | partial (non verifie) | - |
| M8 | n2b (`aphrody-n2b*`, `aphrody-oxc-bridge`, `@aphrody/bun-plugin-n2b`, `@aphrody/bun-plugin-oxc`, `aphrody-jev`, `aphrody-boq`) | bun-distribution crates-cited, yolo crates, npm | fd : NONE | missing | L |
| M9 | Tauri/tao forks (`aphrody-tauri-*`, `aphrody-tao`, plugins), `aphrody-next-*` (turbopack core) | yolo@a9c0a73 crates/ | fd : NONE | missing | XL |
| M10 | Hotes langage pour Bun : `bun-dotnet-host`, `bun-python-host`, `bun-windows-winclean`, `bun_git`, `bun_vt`, `bun_x`, `bun-emu-host(-sys)` | bun-distribution crates-cited | fd : NONE | missing | M chacun |
| M11 | Bindings Windows par DLL (`@aphrody/bun-windows-*` : aclui, activeds, dxcompiler, evr, ntdllk, deviceaccess, api-ms-win-*...) | npm, ~120 paquets generes | non presents | missing | M (generation) |
| M12 | Plugins/outils npm : `bun-os-plugins`, `bun-chromium`, `bun-cloudflare`, `bun-nginx`, `bun-fluent`, `bun-m3`, `bun-icons`, `bun-google`, `bun-agent-plugin`, `bun-runtime-sdk`, `bun-loaders`, `buncc`, `bun-plugin-{neon,supabase,tailwind,svelte,yaml}`, `bun-mdx-rs` | npm yohan971 | `packages/` n'en contient que : chromium-bun, bunify... | partial | M chacun |
| M13 | Apps auto (`@aphrody/auto-*` : agent, billing, mail, tenancy, store, ingest...), `animesama`, `admin-ui`, `app-ui` | npm 0.1.0 | apps/auto present (comparaison non faite) | partial (non verifie) | - |
| M14 | Android/Waydroid/Flutter store (`bun-android`, `bun-engine-android`, `bunos-flutter-store`, `iecode-web`) | yolo-os apps, npm | fd : NONE (iecode-dotnet present) | missing | L |
| M15 | `yolo-engine` (Engine/zig, `epic-games-sdk`, `yolo-cpk-stream`), `bun-gamestream`, `bun-blender` | yolo-engine@4afc22e, npm | crates/game, packages/gaming existent ; epic/cpk non compares | partial | M |
| M16 | `bun-steam` (VDF, depots, cloud, downloader, 7177 l) | crate bun-steam 1.4.7 | `crates/steam-depot` existe (recouvrement non mesure) | partial | S |

Compte monorepo : 9 missing, 5 partial, 2 non verifies (M7, M13 comptes dans partial) ; M16 partial.

## Top 10 par impact (fork bun en priorite)

1. Rio/VT terminal natif (B4) : 618+4 fichiers src/rio, src/vt.
2. `bun lint`/`fmt` quality engine (B5) : 6940 fichiers.
3. Moteur navigateur `src/browser` + `Bun.BrowserRealm` (B3) : 608 fichiers.
4. `Bun.Video` + `bun video` (B1) : requis par apps/shenron scripts/deploy/build-image.sh.
5. `bun mcp` + `bun lsp` (B8, B9) : outils agents natifs.
6. `bun just` (B6) : 290 fichiers.
7. `bun n2b` / crates n2b (B7, M8).
8. @aphrody/bun-video TS (M1) : pipeline mediabunny/yt-dlp/hyperframes.
9. Bun OS Windows (M3) + yolo-os noyau (M4).
10. Hotes .NET/Python/WinMD et modules `bun:*` (B13, B11, M10).

## Limites

Recherche de presence monorepo par nom de repertoire, pas par lecture du code courant ; les statuts partial/non verifie restent a confirmer. Efforts = estimations non mesurees. `legacy/bun-1.4.6` a ete retrouve par sha (fetch), hors toute branche distante.
