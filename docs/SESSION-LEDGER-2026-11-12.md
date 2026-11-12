# Ledger session 7303edb4 (2026-11-12)

Vérifié par fichier, `git`, `gh api`, registres le 2026-11-12 ~20h. Statuts : done / partial / pending / blocked / owned (agent en cours).

| # | Demande (abrégée) | Statut | Preuve |
|---|---|---|---|
| 1 | « ay = bun sans js, labs = bun avec js sans webkit, compatible vercel » | done (décision) | memory C--src/ay-is-bun-without-jsc.md, C:\labs\docs\ARCHITECTURE.md |
| 2 | réécrire labs sur EpicGames/lore, git interdit | partial | C:\labs\.lore\ (repo Lore), crates/lore-* (20 crates, non commités) ; C:\labs sans remote git |
| 3 | fork privé lore + suivre dépôts Unreal | done | gh: aphrody-labs/lore, aphrody-labs/UnrealEngine (third_party/forks.txt) |
| 4 | labs = projet privé type vercel-labs, org aphrody-labs | done | memory orgs-labs-vs-dev.md ; org aphrody-labs : 490 dépôts |
| 5 | /goal purge legacy | partial | docs/infra/CLEANUP-2026-11-12.md ; /goal bloqué par disableAllHooks à l'époque |
| 6 | absorber lore en monorepo rust nightly | partial | C:\labs\crates\lore-*, scripts/absorb-lore.sh ; non commité |
| 7 | full rust/ts/zig, forker vercel-labs + vercel actifs | done | third_party/forks.txt (154 lignes), vercel-labs.forked.log |
| 8 | explorer v8 / third_party chromium / depot_tools (agents concurrents) | partial | docs/CHROMIUM-FACTORY.md, docs/ENGINE-DECISION.md |
| 9 | refactoriser lore (bun fix, ssh, git, wireguard) | partial | crates/lore-transport, lore-fuse ; pas de build vérifié |
| 10 | récupérer gitlab, brave, helium, firefox | partial | docs/WEB-ECOSYSTEM.md ; pas de miroirs vérifiés |
| 11 | stack web (zen, apify, playwright, lighthouse, web vitals, mdn, w3c, wasm, webgpu) | partial | docs/WEB-ECOSYSTEM.md, docs/bench/ |
| 12 | labs = chromium optimisé (obscura, agent-browser, lightpanda, servo, dioxus) | partial | docs/ENGINE-DECISION.md, browser/factory/ |
| 13 | exploiter tous les MCP | done | memory use-mcp-tools-max.md |
| 14 | --dangerously-skip-permissions + workflow proactif versionné | done | settings.json skipDangerousModePermissionPrompt, outputStyle Autonome |
| 15 | retirer blocages humains | done | settings.json ; memory nhitl-max-autonomy.md |
| 16 | forker wireguard + équivalent rust | done | gh: aphrody-labs/wireguard-go (+ boringtun dans forks.txt) |
| 17 | sudo max, sans attendre | done (règle) | memory no-questions-terse.md |
| 18 | écosystème cargo-* / sccache, binaires légers, compil rapide | done | memory cargo-sccache-facts.md, .cargo/, rust-toolchain.toml |
| 19 | scanner le PC, éliminer goulots | partial | skill windows-machine ; pas de mesure post-tuning |
| 20 | refactoriser PC + fr1 en usine chromium / chromium os | owned | agent fr1 refactor en cours |
| 21 | crawler sites chromium/google/brave/helium, maj docs | partial | docs/CHROMIUM-FACTORY.md, third_party/chrome-channels.toml |
| 22 | forker microsoft/apm, vérifier ses dépendances | done | gh: aphrody-labs/apm ; crates/apm/ |
| 23 | utiliser repo vercel + plugins, refactor rust+bun | partial | plugins/labs/ |
| 24 | ni pwsh ni git bash ni msys ; vrai remplaçant git bash, wsl interdit | done | niubash 1.5.0, memory shell.md, docs/shell/MATRIX.md |
| 25 | candidats sh/bash/binutils : forker, patcher, absorber | partial | docs/shell/PLAN.md, oils-windows.md ; osh win32 non buildé |
| 26 | coopérer avec nt-03 (bas niveau) | done | messages cross-session ; nt absorbé dans src (commit e9f57ef) |
| 27 | exploiter vercel-labs/fx, wterm, skills, vcpkg, llvm, gnu | partial | infra/vcpkg/, docs/llvm/, docs/gnu/ |
| 28 | rester focus chromium | done | — |
| 29 | refactor workflow chromium v8/dawn/skia gn/ninja | partial | browser/factory/chromium-factory.sh (déployé sur vps /srv/chromium/factory) |
| 30 | fusionner nt + src + labs en un seul src | partial | C:\nt supprimé, src 4c6bf05/e9f57ef ; C:\labs encore séparé |
| 31 | review session, commit push tout, éditer plan/roadmap | partial | src : 0 commit non poussé, 10 fichiers sales ; labs : 77 entrées non commitées, pas de remote |
| 32 | rendre src + dépôts publics et publiables crates.io / npm | partial | aphrody-dev/src public ; crates.io `aphrody` 404, npm `@aphrody/ay` 404 |
| 33 | fusionner labs, ay, aphrody, yolo | pending | C:\labs toujours distinct de C:\src |
| 34 | scanner linux, libertnt, reactos, wine, mingw, chromium os | partial | docs/compat/, docs/gnu/DISTROS.md |
| 35 | arrêter de compiler sur le PC, libérer RAM/CPU/disque (PC + fr1) | done | aucun cargo/rustc/ninja/clang actif ; serveur sccache arrêté (ce ledger) ; memory builds-on-fr1.md |
| 36 | purger .claude legacy, plugins/mcp/skills inutiles | done | ~/.claude/skills : 6 skills ; memory use-mcp-tools-max.md |
| 37 | node/dotnet/bun sur LLVM partagé avec chromium/vcpkg/rust | partial (plan) | docs/llvm/UNIFIED-TOOLCHAIN.md |
| 38 | cross-compile llvm/msvc, cargo cross, xwin, zigbuild, ABI C | done (doc) | docs/llvm/CROSS-COMPILE.md, C-ABI-2026.md |
| 39 | toutes licences autorisées, aplatir | done | licenses/, clippy/deny assouplis |
| 40 | forker mingw, vcpkg, zig, rustc optimisés | partial | forks.txt, docs/llvm/TOOLCHAIN-FORKS.md |
| 41 | wine/proton/reactos via cachyos de src ; purger mingw/gnu/wine legacy | partial | src/third_party : CachyOS-PKGBUILDS, wine, mingw-w64 encore présents |
| 42 | stopper le build chromium, automatiser avec stack complète | done (stop) / pending (auto) | aucun build actif ; factory sur vps |
| 43 | dédupliquer wine/proton/mingw/msys2 | partial | docs/compat/DEDUP-2026-11-12.md |
| 44 | exploiter commits/blog bun (aot, lto, ffi), fusionner checkouts bun | partial | src/third_party/bun, docs/bun/ |
| 45 | purger sans archiver | done (règle) | memory purge-no-archive.md |
| 46 | msys en archi unix/arch + patchs cachyos sans duplication | partial | docs/compat/MSYS-MONOREPO.md |
| 47 | réécrire config claude automatisée, non bloquante, autolearning | done | hooks learn-capture/learn-nudge/learn-auto ; skill learn |
| 48 | migrer vers vercel + cloudflare, rien en dur ; vps pour build/sync/cron/bots | owned | agent migration Vercel/Cloudflare en cours |
| 49 | full review + continuer + autolearn | done | ce fichier ; memory et skills mis à jour |

## Restant (non possédé par un agent)
- Commit de C:\labs (lore + crates) et décision de fusion labs -> src (#2, #6, #30, #31, #33).
- Publication crates.io / npm (#32) : nécessite des noms réservés et un build CI distant.
- Build osh/oils win32 sur fr1 (#25), purge mingw/wine legacy de src/third_party (#41).
