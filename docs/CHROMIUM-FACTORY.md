# Usine Chromium : état actuel et refonte (2026-11-12)

## Inventaire vérifié

| Brique | Où | Ce que ça fait | Langage |
|---|---|---|---|
| browser/factory/chromium-factory.sh | labs → fr1 /srv/chromium/factory | refresh channels, `gclient sync -D --nohooks --no-history`, runhooks, `gn gen`, `autoninja headless_shell`, publish R2 | bash + depot_tools (Python) |
| browser/factory/cros-factory.sh | labs → fr1 | `repo init/sync` release-R157, `cros build-packages`, `cros build-image` (flags vérifiés dans chromite), publish R2 | bash + chromite (Python) |
| aphrody x channels | labs crates/conformance/channels.rs | versions Stable/Beta/Dev/Canary + DEPS (v8, skia, dawn, angle…), clang, rust | Rust |
| ay gclient (depot-gclient) | src crates | DEPS/.gclient eval, revinfo, getdep/setdep, **sync sur gitoxide** (`--apply`, `-j`, `--populate-cache`), hooks/runhooks, GCS ; CIPD délégué | Rust |
| depot-cipd, depot-vpython (`ay vpy`), depot-cas (FastCDC, d'après Lore) | src crates | client CIPD, specs vpython sur uv, store content-addressed | Rust |
| Builder | fr1 | **siso v1.6.5** (Go) en local exec seulement ; 12 cœurs ; sccache/ccache présents mais non branchés | Go |
| Machines | mesh WireGuard 10.200.77.0/24 | fr1 12c/45G, prd 8c/31G/340G libres, fr2 6c/11G/33G | — |

Mesure : labs_agent Stable 157 = 41 164 actions, ~28 400 faites en 2 h 22 sur fr1 seul (≈ 3,4 h estimé pour un build froid).

## Leviers de vitesse (par gain attendu)

1. **Exécution + cache distants REAPI en Rust : NativeLink** (TraceMachina/nativelink, Rust, push 2026-11-12). siso parle REAPI nativement : `-reapi_address`, `-reapi_instance`, `-reapi_insecure`, `-re_cache_enable_write` (vérifié `siso ninja -help` sur fr1). Scheduler + CAS sur fr1, workers fr1 + prd + fr2 (26 cœurs au lieu de 12) via le mesh, sans TLS (réseau privé). Le cache d'actions rend les rebuilds Stable→Beta→Dev et les re-runs quasi gratuits pour tout ce qui n'a pas changé (third_party).
2. **siso `-local_cache_enable`** : gratuit, immédiat, utile en attendant 1.
3. **Sync en Rust** : `ay gclient sync --apply --populate-cache -j 24` (gitoxide, cache git partagé par alternates) à la place de `gclient sync` Python ; runhooks via `ay gclient runhooks` + `ay vpy`. Sync incrémental entre canaux = fetch des seuls objets manquants.
4. **Artefacts** : sortie publiée dans depot-cas (FastCDC) + R2 au lieu de zstd -19 entier : seuls les fragments changés remontent.
5. **Builds par composant** : v8 (d8, wasm), dawn (tint, dawn_end2end), skia (dm, viewer) en cibles GN séparées dans le même out/ partagé → profitent du même cache REAPI.

## Remplacement Rust (cible)

| Étape | Avant | Après |
|---|---|---|
| orchestration | chromium-factory.sh / cros-factory.sh | `aphrody x factory {sync,gen,build,publish,status}` (crates/factory, Rust), lit chrome-channels.toml en typé |
| channels | channels.rs | idem (déjà Rust) |
| sync | gclient (Python) | ay gclient (Rust) |
| hooks / vpython | gclient runhooks / vpython3 | ay gclient runhooks / ay vpy (Rust ; les scripts de hooks restent Python, c'est le contenu de Chromium) |
| gn | gn (C++) | gn conservé (pas d'équivalent Rust ; binaire CIPD) |
| exécution | siso local (Go) | siso → **NativeLink (Rust)** ; n2 (Rust ninja, dernier push 2025-11) écarté : pas de REAPI ni de support siso |
| cache compilateur | — | cache d'actions NativeLink (sccache inutile en plus) |
| publication | rclone + zstd | depot-cas + R2 |
| ChromiumOS | chromite (Python) | gardé : cros/chromite n'a pas d'équivalent ; seul l'orchestrateur passe en Rust |

## Plan révisé (après revue critique)

Chaque phase se ferme sur une mesure, pas sur une intention.

| Phase | Contenu | Critère de sortie (mesuré) |
|---|---|---|
| F0 baseline | build labs_agent 157 local (siso), publish R2, comparaison vs chrome-headless-shell 157 | durée totale, taille headless_shell, démarrage ; publiés dans docs/bench |
| F1 REAPI | corriger le « Permission denied » sur les workers durcis ; ajouter un worker fr1 après F0 ; rebuild depuis un out/ vide avec use_remoteexec=true | 100 % des actions sans erreur ; durée froide vs F0 ; rebuild à vide avec cache AC > 95 % |
| F2 canaux | Beta 158 puis Dev 159 sur le même cache | durée vs F1 froid ; taux de cache par canal |
| F3 sync Rust | `ay gclient revinfo` identique à `gclient revinfo` sur 157, puis `ay gclient sync --apply --populate-cache` sur une copie | diff revinfo vide ; durée de sync vs gclient |
| F4 orchestrateur Rust | `aphrody x factory {sync,gen,build,publish,status}` remplace les deux scripts, appelé par systemd | mêmes artefacts R2 ; scripts supprimés |
| F5 composants | cibles v8 (d8), dawn (tint, dawn_end2end_tests), skia (dm) dans le même out/ | temps incrémental par composant grâce au cache |
| F6 ChromiumOS | build-packages + build-image amd64-generic (en file derrière F0), publish R2 | image bootable en QEMU |

Hors périmètre, volontairement : réécrire gn, siso ou chromite en Rust (aucun gain mesurable, coût énorme). n2 écarté (pas de REAPI).
