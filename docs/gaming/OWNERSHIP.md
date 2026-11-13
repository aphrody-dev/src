# Couche gaming : carte d'ownership (2026-11-13)

Périmètre : Steam (client, steamcmd, Steam Runtime, Steamworks), Proton, Wine, DXVK, VKD3D-Proton,
gamescope, Mesa/RADV, Vulkan, DirectX, SteamOS, Bazzite, CachyOS côté jeu (proton-cachyos,
wine-cachyos). Le noyau et les paquets CachyOS, les patchsets Linux et les images de base
appartiennent à la couche système : `docs/linux/OWNERSHIP.md`.

Commandes : `ay steam` (Rust, `crates/ay/src/low/steam.rs`) et `ay gaming` (`packages/gaming`, lancé par bun).

## 1. Une source par fonction

| Fonction | Source unique | Consommateurs |
|---|---|---|
| VDF texte et binaire, `appinfo.vdf` v39-v41, `packageinfo.vdf`, ACF, `libraryfolders.vdf`, découverte des installations, outils de compatibilité, environnement Proton, client CM/CDN et manifests de dépôts | `crates/steam-depot` (lib `bun_steam`, miroir lecture seule `aphrody-labs/steam-depot`) | `ay steam` (JSON), `apps/rosegriffon` (dépendance git), image `rg-steam-depot` sur prd |
| Données Steam en JSON pour Bun | `ay steam root/libraries/apps/vdf/compat/host/env` | `packages/gaming/src/native.ts` |
| SteamID, liens SteamDB/boutique, carte des chemins d'une app, filtre des fichiers d'identifiants | `packages/gaming/src/steam.ts` (`@aphrody/gaming`) | MCP du plugin, `ay gaming` |
| Vulkan (ICD, couches implicites et explicites), DirectX (adaptateurs DXGI, runtime D3D12, Agility SDK, DXVK/vkd3d-proton livrés par Proton) | `packages/gaming/src/{vulkan,dx}.ts` | `ay gaming layers`, `ay gaming dx`, `ay gaming status` |
| steamcmd reproductible, Proton hors Steam (umu-run ou `proton waitforexitandrun`) | `packages/gaming/src/{steamcmd,proton}.ts`, manifeste `infra/gaming/downloads.toml` | `ay gaming steamcmd`, `ay gaming run` |
| Plugin Claude Code, MCP `steam` | `apps/rosegriffon/plugins/steam` (`servers/steam-mcp.ts` importe `packages/gaming`) | Claude Code, tout client MCP |
| Skills | `apps/rosegriffon/plugins/steam/skills/*` | miroirs générés `.agents/skills/{steam-*,gaming-stack}` : `ay gaming skills sync`, contrôle `ay gaming skills check` (test de `packages/gaming`) |
| Images (Bazzite, SteamOS, CachyOS côté jeu) | `infra/gaming/images.toml` | CI, hôtes |
| Mises à jour amont des forks | `infra/upstream/stacks.d/gaming.toml` (modèle `mirror`, `packages/upstream/src/mirror.ts`) | `ay upstream sync gaming --push`, timer `aphrody-upstream` sur prd |
| Mode gamescope first-party | `crates/gamescope-{core,cli,wgsl,web-wasm}`, `infra/gamescope-web` (`ay scope`) | inchangé ; source amont `third_party/gamescope` |

## 2. Supprimé (doublons)

| Copie | Remplacée par |
|---|---|
| `crates/unix-cachyos` `ProtonWineOrchestrator` : environnement Proton figé (ntsync et anti-triche forcés à 1, noms non lus par Proton) | `bun_steam::proton::launch_plan` sur la sonde de l hôte, plus les seules options CachyOS (`CACHYOS_PROTON_OPTIONS`) |
| `apps/rosegriffon/plugins/steam/lib/steam.ts` : parseurs VDF texte/binaire, `readAppInfo`, `findSteamRoot`, `listLibraries`, `listApps`, table StateFlags | `crates/steam-depot` via `ay steam` ; SteamID, liens et chemins déplacés dans `packages/gaming/src/steam.ts` |
| `apps/rosegriffon/plugins/steam/scripts/steam-inspect.ts` | `ay steam` et `ay gaming` |
| Table StateFlags TypeScript (bits 16 à 23 absents côté Rust) | `AppManifest::state_flag_descriptions` (`crates/steam-depot/src/install.rs`), complétée |
| `.agents/skills/steam-*` copiés à la main (steam-local-inspect avait divergé) | miroirs générés depuis le plugin |

## 3. Forks et checkouts (`third_party/<nom>`, épinglés dans `src.lock.json`, liste `third_party/forks.txt`)

Un seul Wine, un seul Proton, un seul DXVK : les variantes sont des remotes du checkout et des branches
du fork, jamais des copies. Les sous-modules de Proton (wine, dxvk, vkd3d-proton, Vulkan-Headers,
Vulkan-Loader, SPIRV-Headers, glslang...) ne sont pas initialisés : les checkouts ci-dessous en tiennent lieu.

| Checkout | Fork aphrody-labs | Amont | Licence (vérifiée le 2026-11-13) | Variantes |
|---|---|---|---|---|
| `Proton` | `Proton` | ValveSoftware/Proton `proton_11.0` | BSD-3-Clause (`LICENSE.proton`), chaque composant sous sa licence | branches `cachyos_main` (CachyOS/proton-cachyos), `ge` (GloriousEggroll/proton-ge-custom) |
| `wine` | `wine` (préexistant, parent wine-mirror/wine) | WineHQ `master` | LGPL-2.1+ | branches `proton_11.0` (ValveSoftware/wine), `cachyos_11.0` (CachyOS/wine-cachyos, dernière `cachyos_11.0_<date>/main`) |
| `dxvk` | `dxvk` | doitsujin/dxvk | Zlib | remote `valve` (ValveSoftware/dxvk) |
| `vkd3d-proton` | `vkd3d-proton` | HansKristian-Work/vkd3d-proton | LGPL-2.1 | |
| `gamescope` | `gamescope` | ValveSoftware/gamescope | BSD-2-Clause | |
| `mesa` (RADV, lavapipe, NVK) | non forké (amont GitLab, aucun patch) | gitlab.freedesktop.org/mesa/mesa | MIT | |
| `Vulkan-Headers`, `Vulkan-Loader`, `Vulkan-ValidationLayers`, `Vulkan-Tools` | idem | KhronosGroup | Apache-2.0 (Headers : Apache-2.0 OR MIT) | |
| `SPIRV-Headers`, `SPIRV-Tools`, `SPIRV-Cross`, `SPIRV-LLVM-Translator` | non forkés (préexistants) | KhronosGroup | Apache-2.0 / MIT | |
| `DirectX-Headers`, `DirectXShaderCompiler` | préexistants | microsoft | MIT, NCSA (LLVM Release License) | |
| `bazzite` | `bazzite` | ublue-os/bazzite | Apache-2.0 | |
| `steamos-manager` | `steamos-manager` (miroir poussé) | gitlab.steamos.cloud/holo/steamos-manager | MIT | |
| `steam-runtime-tools` (pressure-vessel) | `steam-runtime-tools` (miroir poussé) | gitlab.steamos.cloud/steamrt/steam-runtime-tools | LGPL-2.1+ (et MIT, Apache-2.0, Zlib par fichier) | |
| `steam-devices` | `steam-devices` | ValveSoftware/steam-devices | MIT | |
| `GameNetworkingSockets` | `GameNetworkingSockets` | ValveSoftware | BSD-3-Clause | |
| `umu-launcher` | `umu-launcher` | Open-Wine-Components | GPL-3.0 | |
| `MangoHud`, `gamemode` | idem | flightlessmango, FeralInteractive | MIT, BSD-3-Clause | |
| `steamroom` | préexistant | landaire/steamroom | MIT OR Apache-2.0 | dépendance de `crates/steam-depot` |
| `steamkit`, `steam-vent`, `steamlocate-rs`, `steamworks-rs`, `steamappinfo`, `steam-protobufs`, `steamtracking`, `valvepython-steam`, `steamctl`, `node-steam-*`, `steam-lancache-prefill`, `steam-rs` | non forkés (référence, `crates/steam-depot/UPSTREAM.md`) | divers | GPL/LGPL : lecture seule, jamais copiés | |

CachyOS (noyau `linux-cachyos`, `CachyOS-PKGBUILDS`) : couche système, `docs/linux/OWNERSHIP.md`.

## 4. Exclu pour cause de licence

Jamais forké, vendorisé, commité ni redistribué ; seulement wrappers, manifestes de téléchargement
officiels (`infra/gaming/downloads.toml`), documentation et skills :

- client Steam, `steamcmd` (téléchargé depuis `steamcdn-a.akamaihd.net` par `ay gaming steamcmd install`, taille contrôlée) ;
- builds Proton et Steam Linux Runtime distribués par Steam (apps 1493710, 2180100, 3658110, 2805730, 2348590, 1628350, 1391110, 1070560), installés par steamcmd sous le compte de l'utilisateur ;
- images SteamOS (`steamdeck-repair-latest.img.bz2`, lien seulement) ;
- SDK Steamworks (licence partenaire ; `third_party/steamworks-rs` ne sert que de référence d'en-têtes) ;
- ValveSoftware/steamlink-sdk (aucune licence publiée), ValveSoftware/steam-runtime (images construites à partir de paquets sous licences diverses : seuls ses scripts sont lus en amont, rien n'est repris), ValveSoftware/SteamOS et steam-for-linux (dépôts de tickets, sans code).

## 5. Reste hors de cette couche

- `apps/shenron` (`packages/dbxv2/src/steamcmd.ts`, `crates/shenron-re/src/steam.rs`) et `apps/rosegriffon/apps/iecode-dotnet/Core/Steam` (client de dépôts C#) : code produit dans leurs sous-modules ; à converger sur `ay gaming steamcmd` et `crates/steam-depot` par leurs propriétaires. `apps/rosegriffon/crates/yolo-re-core` consomme déjà `bun_steam`.
- La stack docker `rosegriffon-stack` sur prd (`rg-steam-depot`, `rg-steam-initial`) et son jeton : propriétaire rosegriffon, non modifiés.
