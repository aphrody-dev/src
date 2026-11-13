# Consolidation bun (2026-11-13)

Remplace `CHECKOUTS-MERGE.md` (2026-11-12, historique dans git). Base du futur binaire bun unique (`NATIVE-BINARY.md`).

## Amont (vérifié en direct le 2026-11-13)

| Canal | Révision | Source |
|---|---|---|
| stable | `bun-v1.4.4` (2026-10-22), commit `38afee6c84` | `gh api repos/oven-sh/bun/releases/latest` |
| canary | `oven-sh/bun` main `9ea3c693a2` (2026-11-13 00:11 UTC, « Bump to 1.4.5 ») | `gh api repos/oven-sh/bun/commits/main` |
| WebKit | `oven-sh/WebKit` main `b553971ea8` = `WEBKIT_VERSION` de `scripts/build/deps/webkit.ts` | `gh api`, fichier du fork |

## Fork de référence

**`aphrody-labs/bun`, branche `main`** (seule branche) = canary `9ea3c693a2` + 3 commits :

| Commit | Sujet | Origine |
|---|---|---|
| `94e80d17e1` | child_process : `stream._handle` expose le fd du pipe côté parent (`setBlocking`), requis par l'API sync de TypeScript 7 | ancien `main` du fork (`9dda375835`), rebasé sans conflit |
| `6ac786d448` | build : sources bindgen relatives à la racine (ligne de commande Windows trop longue : 13 918 → 7 958 caractères) | file de patchs `yolo-cross/patches/bun/windows-codegen-relative-paths.patch`, porté à la main (le patch ne s'appliquait plus) |
| `c7b36732e0` | docs : frontmatter `title:` sur la page minifier (seule page en `name:`) | ancienne branche `aphrody/main` (`4b8463ee11`) |

Vérification : `bun test test/internal/build-codegen-declared-outputs.test.ts test/internal/build-aot-codegen-declared-outputs.test.ts` sur prd (`/srv/build/bun` à `c7b36732e0`, `nice -n 19`, `BUN_WEBKIT_PATH` = cache WebKit LTO-AOT) : 14 pass, 0 fail. Pas de compilation complète : les 4 commits amont rebasés ne touchent aucun fichier du patch child_process.

Rebase suivant : `git -C third_party/bun fetch upstream main && git rebase upstream/main && git push --force-with-lease origin main`.

## Inventaire

| Élément | Emplacement | Révision / version | Écart avec l'amont | État | Décision |
|---|---|---|---|---|---|
| Clone local | `C:\src\third_party\bun` (partial `blob:none`) | `c7b36732e0` | +3 / 0 sur canary | actif | gardé, seul clone bun du PC |
| Clone prd | `prd:/srv/build/bun` (3,2 Go, origin aphrody-labs/bun) | `c7b36732e0` (branche `main`) | +3 / 0 | actif (build) | gardé |
| Fork GitHub | `aphrody-labs/bun` | `main` `c7b36732e0` | +3 / 0 | référence | branches `aphrody/main`, `feat/linux-kernel-7.4`, `wip/feat-linux-kernel-7.4-uncommitted-2026-11-12` supprimées |
| Fork GitHub | `aphrody-dev/bun` | `main` = amont (0 / 4) ; ~15 900 branches miroir ; seule branche à nous `feat/linux-kernel-7.4` | doublon | **archivé** (références de src repointées) |
| Fork GitHub | `aphrody-labs/WebKit` (fork de oven-sh/WebKit) | `main` = amont (0 / 0) | aucun | actif | gardé ; clone `C:\src\third_party\WebKit` (`b553971e`, shallow) |
| Dépôt GitHub | `yolo-rs/yolo-bun` | `cb5d16ec45` (2026-11-08) ; file de patchs runtime vide | n/a | mort | **archivé** ; clone `var/legacy/yolo-rs/yolo-bun` supprimé |
| Dépôt GitHub | `aphrody-labs/google-bun` | `72785d3772` | pas du bun (infra Google/Chromium) | hors périmètre | gardé |
| Dépôt GitHub | `yolo-rs/google-bun` | `0e2edc9b7c` (1 commit de retard sur aphrody-labs/google-bun) | doublon | mort | **archivé** ; clone `var/legacy/yolo-rs/google-bun` supprimé |
| Dépôts GitHub | `aphrody-dev/bun-parity`, `aphrody-dev/bun-plugins`, `aphrody-dev/chromium-bun` | miroirs des paquets de src | n/a | déjà archivés | rien |
| Dépôts GitHub | `aphrody-labs/zig` (miroir codeberg), `yolo-rs/yolo-zig` | n/a | pas du bun | hors périmètre | rien |
| `yolo-rs/bun`, `aphrody-labs/bun-os`, `aphrody-labs/bun-distribution` | GitHub | 404 | n/a | n'existent plus | rien (cités par des paquets publiés, voir plus bas) |
| Org EpicGames | GitHub | aucun dépôt bun (`gh search repos --owner EpicGames bun`) | n/a | n/a | rien |

Recherche : `fd build.zig` / `src/bun.js` sur C:\src, C:\msys*, %USERPROFILE% (aucun checkout ; bun n'a plus de Zig) ; 668 `.git/config` lus sous C:\src, C:\msys64, %USERPROFILE% : seuls `third_party/bun` et `third_party/WebKit` pointent vers oven-sh.

## Patchs non rapatriés

| Patch | Où | Raison |
|---|---|---|
| `75fab05e8c` feat(kernel) : « accélérateur noyau Linux 7.4-rc2 » (crates `bun-kmod-abi`, `bun-kaccel-user` avec simulateur, module noyau, `scripts/transfer-to-fresh-org.ps1`) | ex-`aphrody/main`, `feat/linux-kernel-7.4` (aussi sur aphrody-dev/bun) | hors runtime, jamais construit ni intégré au build ; script de transfert d'org codé en dur vers `C:\src\bun` |
| `2842a5cd84` + `449a191ffc` docs/design « sovereign » (6 mdx + `docs/sovereign`) | ex-`aphrody/main`, ex-`wip/...` | pas de la doc bun |
| `4b8463ee11` liens `<...>` réécrits dans 4 pages | ex-`aphrody/main` | la forme `<url>` est valide en MDX ; seul le correctif `title:` est repris |
| `packages/bun-parity/patches/0001-mime-chromium-types.patch` | src | `audio/opus` déjà en amont ; `application/vnd.bun.aot` inventé ; `image/jxl` et `text/wgsl` exigent la table d'extensions de `MimeType.rs` et la régénération de `mime_type_list_sorted.rs` : à reprendre dans le binaire natif |
| `packages/bun-parity/patches/0002-scheduler-webapi-decl.patch` | src | vise `src/bun.js/...` (n'existe plus) ; IDL sans implémentation |

Ces fichiers restent dans `bun-parity` : `src/patcher/rust-gen.ts` les génère.

## Plugins et modules bun de src (un emplacement par fonction)

| Fonction | Emplacement unique |
|---|---|
| plugins de build (just, turbo-cache, vcs-meta, decide, m3-icons) + `bun-native.d.ts` | `packages/bun-plugins` |
| import Lua 5.2 (`.lua`, `.luac`) | `apps/rosegriffon/packages/rg-lua` (`@rosegriffon/lua-plugin`, AST + bytecode). **Doublon `packages/bun-plugins/lua-plugin.ts` et son test supprimés** (aucun importeur) |
| parité Chromium et patchs générés | `packages/bun-parity` |
| moteurs navigateur, CDP | `packages/chromium-bun` |
| adaptateur Workers / Vercel / Bun.serve | `packages/runtime-adapter` |
| IA (routage, MCP) | `packages/ai-os` |

Copies hors git dans `var/legacy` (git-ignoré, 7,4 Go) laissées en place : `yolo-rs/yolo/packages/{bun-loaders,bun-workspace,yolo-bun-plugin}`, `yolo-rs/yolo-stack/bun-plugins/`, `bunos/packages/*` (sources des paquets npm publiés).

## Paquets publiés (registres, lus en direct)

- npm (mainteneur `<npm-owner>`) : 23 paquets `@aphrody/*bun*` (1.4.6-aphrody.x à 1.4.11, publiés du 2026-10-18 au 2026-10-23), plus `@aphrody/bun-steam` 1.4.7 et `@yolo-rs/posix-bun` 0.1.2. Leur `repository` cite `aphrody-labs/bun`, `oven-sh/bun` ou `aphrody-labs/bun-distribution` (404) ; les sources sont dans `var/legacy/bunos/packages`. Aucun paquet de `packages/*` (bun-parity, bun-plugins, chromium-bun, runtime-adapter) n'est publié (404). Pas de dépréciation : le token npm local est expiré (`docs/publish/NPM.md`).
- crates.io (`aphrody-dev`, 370 crates) : 16 citent `aphrody-labs/bun` comme dépôt (`aphrody-n2b*`, `bun_git`, `bun_vt`, `bun_x`, `bun-dotnet-host`, `bun-windows-winclean`, ...), 63 `aphrody-labs/bun-distribution`, 17 `aphrody-labs/bun-os` ; aucune de ces sources n'est dans le fork actuel. Rien n'a été retiré.
- Plugins Claude Code : marketplaces locales `aphrody` (`C:\src\plugins`) et `rosegriffon-plugins` ; aucune n'embarque de binaire bun.

## Installations

| Hôte | Binaire | Version | État |
|---|---|---|---|
| PC | `~/.bun/bin/bun.exe` (premier dans le PATH) | 1.4.5-canary.1+9ea3c693a | actif ; `bun.previous.exe` / `bunx.previous.exe` (1.4.4-canary 129f3c7a8) supprimés |
| PC | WinGet `Oven-sh.Bun` | 1.4.4+38afee6c8 | masqué par `~/.bun`, gardé comme stable |
| PC | `~/.local/share/ay/tools/bun/{1.4.4,canary}` | 1.4.4+38afee6c8 / 1.4.4-canary 7f964e696 | gérés par `ay` |
| PC | `%LOCALAPPDATA%\Programs\Jan\bun.exe` | 1.4.4+38afee6c8 | embarqué par Jan |
| prd | `/usr/local/bin/bun` | 1.4.4-canary.1+7ca0042d3 | actif (14 processus) |
| prd | `/root/.bun/bin/bun` | 1.4.4-canary.1+a4c3a5eee | actif (1 processus) |
| fr2 | `~/.local/bin/bun` | 1.4.4-canary.1+7ca0042d3 | actif |
| fr2 | `~/bun144` (`b.zip`, `bm.zip`, 1.4.4) | 1.4.4+38afee6c8 | **supprimé** (aucune référence) |
| fr1 (lecture) | `~/.bun/bin/bun` | 1.4.4+38afee6c8 | non modifié |

## Références repointées vers aphrody-labs/bun

`DEPS` (`third_party/bun` @ `c7b36732e0`), `MAINTAINERS` (et retrait de `aphrody-dev/bun-parity`, archivé), `packages/chromium-bun/src/browser/bun-v8-bridge.ts`, `docs/AY_ON_BUN.md`, `docs/TOOLCHAIN_UPSTREAM_LEVERS.md`, `apps/rosegriffon/README.md` (sous-module, `490046b5`).

## Pour le binaire natif

`NATIVE-BINARY.md` prévoit un fork sur une nouvelle org à partir de `aphrody-labs/bun` `9dda375835` : partir de `c7b36732e0` (2 commits de plus, `main` réécrite par le rebase).
