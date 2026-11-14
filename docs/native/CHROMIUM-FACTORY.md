# Usine Chromium : état actuel et refonte (2026-11-12)

## Inventaire vérifié

| Brique                                                                  | Où                                  | Ce que ça fait                                                                                                                              | Langage                     |
| ----------------------------------------------------------------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------- |
| infra/chromium-factory/chromium-factory.sh                              | labs → fr1 /srv/chromium/factory    | refresh channels, `gclient sync -D --nohooks --no-history`, runhooks, `gn gen`, `autoninja headless_shell`, publish R2                      | bash + depot_tools (Python) |
| infra/chromium-factory/cros-factory.sh                                  | labs → fr1                          | `repo init/sync` release-R157, `cros build-packages`, `cros build-image` (flags vérifiés dans chromite), publish R2                         | bash + chromite (Python)    |
| aphrody x channels                                                      | labs crates/conformance/channels.rs | versions Stable/Beta/Dev/Canary + DEPS (v8, skia, dawn, angle…), clang, rust                                                                | Rust                        |
| ay gclient (depot-gclient)                                              | src crates                          | DEPS/.gclient eval, revinfo, getdep/setdep, **sync sur gitoxide** (`--apply`, `-j`, `--populate-cache`), hooks/runhooks, GCS ; CIPD délégué | Rust                        |
| depot-cipd, depot-vpython (`ay vpy`), depot-cas (FastCDC, d'après Lore) | src crates                          | client CIPD, specs vpython sur uv, store content-addressed                                                                                  | Rust                        |
| Builder                                                                 | fr1                                 | **siso v1.6.5** (Go) en local exec seulement ; 12 cœurs ; sccache/ccache présents mais non branchés                                         | Go                          |
| Machines                                                                | mesh WireGuard 10.200.77.0/24       | fr1 12c/45G, prd 8c/31G/340G libres, fr2 6c/11G/33G                                                                                         | —                           |

Mesure : labs_agent Stable 157 = 41 164 actions, ~28 400 faites en 2 h 22 sur fr1 seul (build froid calculé p = 12 : [4,49 ; 4,63] h + link final, voir « Modèle et bornes »).

## Leviers de vitesse (par gain attendu)

1. **Exécution + cache distants REAPI en Rust : NativeLink** (TraceMachina/nativelink, Rust, push 2026-11-12). siso parle REAPI nativement : `-reapi_address`, `-reapi_instance`, `-reapi_insecure`, `-re_cache_enable_write` (vérifié `siso ninja -help` sur fr1). Scheduler + CAS sur fr1, workers fr1 + prd + fr2 (26 cœurs au lieu de 12) via le mesh, sans TLS (réseau privé). Le cache d'actions rend les rebuilds Stable→Beta→Dev et les re-runs quasi gratuits pour tout ce qui n'a pas changé (third_party).
2. **siso `-local_cache_enable`** : gratuit, immédiat, utile en attendant 1.
3. **Sync en Rust** : `ay gclient sync --apply --populate-cache -j 24` (gitoxide, cache git partagé par alternates) à la place de `gclient sync` Python ; runhooks via `ay gclient runhooks` + `ay vpy`. Sync incrémental entre canaux = fetch des seuls objets manquants.
4. **Artefacts** : sortie publiée dans depot-cas (FastCDC) + R2 au lieu de zstd -19 entier : seuls les fragments changés remontent.
5. **Builds par composant** : v8 (d8, wasm), dawn (tint, dawn_end2end), skia (dm, viewer) en cibles GN séparées dans le même out/ partagé → profitent du même cache REAPI.

## Remplacement Rust (cible)

| Étape             | Avant                                 | Après                                                                                                                               |
| ----------------- | ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| orchestration     | chromium-factory.sh / cros-factory.sh | `aphrody-factory` (crates/factory, lib + bin mince, futur `ay factory`), lit chrome-channels.toml via aphrody-conformance::channels |
| channels          | channels.rs                           | idem (déjà Rust)                                                                                                                    |
| sync              | gclient (Python)                      | ay gclient (Rust)                                                                                                                   |
| hooks / vpython   | gclient runhooks / vpython3           | ay gclient runhooks / ay vpy (Rust ; les scripts de hooks restent Python, c'est le contenu de Chromium)                             |
| gn                | gn (C++)                              | gn conservé (pas d'équivalent Rust ; binaire CIPD)                                                                                  |
| exécution         | siso local (Go)                       | siso → **NativeLink (Rust)** ; n2 (Rust ninja, dernier push 2025-11) écarté : pas de REAPI ni de support siso                       |
| cache compilateur | —                                     | cache d'actions NativeLink (sccache inutile en plus)                                                                                |
| publication       | rclone + zstd                         | depot-cas + R2                                                                                                                      |
| ChromiumOS        | chromite (Python)                     | gardé : cros/chromite n'a pas d'équivalent ; seul l'orchestrateur passe en Rust                                                     |

## Plan révisé (après revue critique)

Chaque phase se ferme sur une mesure, pas sur une intention.

| Phase                 | Contenu                                                                                                                                                      | Critère de sortie (mesuré)                                                               |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------- |
| F0 baseline           | build labs_agent 157 local (siso), publish R2, comparaison vs chrome-headless-shell 157                                                                      | durée totale, taille headless_shell, démarrage ; publiés dans docs/native/bench                 |
| F1 REAPI              | corriger le « Permission denied » sur les workers durcis ; ajouter un worker fr1 après F0 ; rebuild depuis un out/ vide avec use_remoteexec=true             | 100 % des actions sans erreur ; durée froide vs F0 ; rebuild à vide avec cache AC > 95 % |
| F2 canaux             | Beta 158 puis Dev 159 sur le même cache                                                                                                                      | durée vs F1 froid ; taux de cache par canal                                              |
| F3 sync Rust          | `ay gclient revinfo` identique à `gclient revinfo` sur 157, puis `ay gclient sync --apply --populate-cache` sur une copie                                    | diff revinfo vide ; durée de sync vs gclient                                             |
| F4 orchestrateur Rust | `aphrody-factory {sync,gen,build,publish,all,status,doctor,toolchain}` (crates/factory, futur `ay factory`) remplace chromium-factory.sh, appelé par systemd | mêmes artefacts R2 ; script supprimé après un `all` complet                              |
| F5 composants         | cibles v8 (d8), dawn (tint, dawn_end2end_tests), skia (dm) dans le même out/                                                                                 | temps incrémental par composant grâce au cache                                           |
| F6 ChromiumOS         | build-packages + build-image amd64-generic (en file derrière F0), publish R2                                                                                 | image bootable en QEMU                                                                   |

Hors périmètre, volontairement : réécrire gn, siso ou chromite en Rust (aucun gain mesurable, coût énorme). n2 écarté (pas de REAPI).

## F1 REAPI : résultats (2026-11-12)

- Cause racine du « Permission denied (os error 13) » : systemd 262 (prd, Arch) monte le StateDirectory DynamicUser (`/var/lib/private`) en `noexec,nosuid,idmapped` dans le namespace du service. Le bit exec est bien conservé (NativeLink garde les exécutables en 0555 dans `cas.exec/`), c'est le montage qui bloque `execve`. Reproduit avec `systemd-run -p DynamicUser=yes -p StateDirectory=nativelink …` : clang → EACCES ; avec `-p ExecPaths=/var/lib/private/nativelink` → OK. fr2 (systemd 261) n'était pas concerné.
- Correctif (`infra/chromium-factory/nativelink/deploy.sh`) : `ExecPaths=/var/lib/private/nativelink` sur l'unité worker ; DynamicUser, ProtectSystem=strict, ProtectHome=read-only, NoNewPrivileges conservés (pas de root).
- Redéployé : server fr1, workers prd (80 GB de cache) et fr2 (20 GB) actifs.
- Test (fr1, `nice -n 19`, `out/re-test`, use_remoteexec=true) : `sys_info.o` + `file_path.o` → remote:1 (exécuté sur fr2, exit 0), cache:1, 0 erreur ; second run après suppression des .o (`rand_util.o`, `sys_info.o`, `file_path.o`) → cache:3 remote:0, 0 erreur reapi.
- Restent à faire : worker fr1 (F0 `chromium-factory-build` relancé et actif au moment du test) ; rebuild complet depuis un out/ vide pour mesurer la durée froide et le taux AC.

## F3 résultats (2026-11-12)

Checkout 157 sur fr1 (`/srv/chromium`, `src@4b3d0dab`, `custom_vars checkout_pgo_profiles`). `ay` 0.2.0 compilé sur prd (cargo 1.99.1, `-p aphrody --bin ay`, arbre de travail C:\src incluant le `sync.rs` modifié non commité, 188 s), copié en `fr1:~/bin/ay` (sha256 `8f34cad7…`). Mesures en `nice -n 19` pendant un build Chromium (load ~16), sorties dans `fr1:~/f3/`.

| Commande                             | Python gclient | `ay gclient` | Diff                                                              |
| ------------------------------------ | -------------- | ------------ | ----------------------------------------------------------------- |
| `revinfo` (trié, 251 lignes)         | 24,1 s         | 0,058 s      | 0 ligne                                                           |
| hooks (118, run/skip + cwd + action) | 28,0 s ¹       | 0,048 s      | 0 ligne                                                           |
| `getdep` (5 `--var`, 3 `-r`)         | 0,89 s         | 0,038 s      | 0 ligne (même erreur sur un `-r path:pkg` CIPD invalide)          |
| `sync` dry-run                       | —              | 0,94 s       | 250 deps : 218 git à jour, 0 clone/fetch/checkout, 32 CIPD listés |

¹ Python n'a pas de commande de listing : `~/f3/pyhooks.py` charge l'arbre comme `revinfo` puis imprime `GetHooks()` au format `ay`. `gclient flatten` est inutilisable ici (AssertionError sur `chromium_revision` dans `third_party/dawn`).

Aucun écart, donc aucun patch depot-gclient. Restent pour F3 : `sync --apply --populate-cache` sur une copie, et `--cipd` (le plan sans `--cipd` liste les 32 paquets sans les traiter).

## Leçons et corrections (F0 interrompu, 2026-11-12)

Sources : `out/labs_agent-157.0.8103.78/siso_metrics{.0,}.json` (jq sur fr1, `nice -n 19`), `siso_output.0`, `siso_failed_commands.0.sh`, `/tmp/siso.*.INFO`, `journalctl -u chromium-factory-build|cros-factory-sync|nativelink-server|nativelink-worker`, `gn args --list --short`, `gn path`.

Mesures

| Point                            | Valeur                                                                                                                                                                                                                                                                            |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Run 1                            | 13:02:41 → 15:59:07 (2 h 56), 29 714 steps (29 507 exec locaux, 207 no-exec), 1 j 0 h 05 CPU                                                                                                                                                                                      |
| Run 2                            | 16:21:50 → 16:36:31 (14 min 53), 1 414 steps sur 11 005 restants, 2 h 40 CPU                                                                                                                                                                                                      |
| Répartition exec (run 1, cœur·s) | cxx 20 890 actions / 123 616 s (89 %) ; actions GN Python 4 183 / 12 147 s (8,7 %) ; rust (rlib, macro, bin) 253 / ~2 600 s ; cc 2 896 / 848 s ; link 19 / 350 s ; alink 1 131 / 33 s                                                                                             |
| Par répertoire (cxx+cc)          | blink/renderer 50 837 s (37 %, 4 213 obj) ; v8 ~23 700 s (base 12 504, torque 6 283, compiler 3 877) ; blink/public 3 832 ; perfetto 3 790 ; net 4 736 ; dawn 3 269 ; vulkan-validation-layers 1 580 (248 obj)                                                                    |
| Actions les plus longues         | document.o 104 s / 2,97 GB ; maglev-inlining.o 94 s ; maglev-compiler.o 91 s ; libcore (sysroot Rust) 219 s                                                                                                                                                                       |
| Cache                            | 0 % : `--offline` sans `-local_cache_enable`, aucun REAPI. Test out/re-test : 2e run 3/3 hits AC                                                                                                                                                                                  |
| RAM                              | pic service 19,8 GiB + 649 MiB swap (run 1, pendant le repo sync ChromiumOS) ; run 2 14,1 GiB ; RSS max d'une action 2,97 GB                                                                                                                                                      |
| Efficacité CPU                   | 12 slots locaux occupés (siso `Local:12`) mais user+sys moyen 8,3–8,7 cœurs par tranche de 15 min (≈ 70 %) ; cause non vérifiée (I/O ou steal VPS ; steal = 0 au repos)                                                                                                           |
| Échecs                           | 0 erreur de compilation. 3 cxx blink tués par l'arrêt de 15:59 (`spawn helper: EOF`). 174 lignes `failed to get digest from FS` (scan, sans effet)                                                                                                                                |
| Démarrages ratés                 | 13:00:20 assert `headless_enable_commands` vs `headless_use_embedded_resources` (headless/BUILD.gn:23, args écrits de mémoire) ; 16:21:05 `HOME: unbound variable` (systemd-run sans User, `set -u`)                                                                              |
| Temps perdu                      | 22 min d'arrêt 15:59 → 16:21 + 3 actions tuées ; repo sync ChromiumOS en parallèle 14:08 → 15:17 (11 min CPU seulement, mais 14,2 GiB → swap) ; builds siso de test 15:31–15:40 et 16:23–16:26                                                                                    |
| NativeLink                       | server : 17 `Some requested entity was not found` (execution), 10 canaux worker fermés (redémarrages du correctif ExecPaths), 3 actions tuées, avertissement `deprecated map format` (bytestream). Workers prd et fr2 reconnectés à 16:22:46. MemAvailable : prd 5 GiB, fr2 6 GiB |

Corrections

- args (`infra/chromium-factory/args/labs_agent.gn`, chaque arg vérifié par `gn args --list`) : `dawn_enable_vulkan_validation_layers = false` (dépendance data seule de headless_shell d'après `gn path`, défaut true sur Linux, dawn_features.gni:177). Le reste est conservé : official/ThinLTO/CFI/PGO sont le produit ; le profil PGO arrive au sync, pas au build. `enable_nacl` et `use_jumbo_build` n'existent plus en 157. printing/pdf/vr/screen_ai/on_device_translation pèsent moins de 70 cœur·s chacun. trace_processor vient de base → libperfetto (export JSON du tracing CDP), conservé.
- `use_siso`/`use_remoteexec` ne sont plus dans le fichier : `aphrody-factory gen` les ajoute selon le mode. `use_remoteexec` ne bascule que le remoting des règles siso (build/config/siso/main.star:39) et un assert (clang.gni:100) ; les lignes de commande ne changent pas, donc les ~31 000 sorties locales restent valides (à confirmer avec siso_explain au premier run).
- out/ stable `out/labs_agent` (le dossier versionné est renommé une fois par `gen`) : le cache ThinLTO (`thin_lto_enable_cache` vaut true par défaut, `$root_out_dir/thinlto-cache`, build/config/compiler/BUILD.gn:784-789) et l'état siso survivent aux montées de version.
- siso (flags de `siso ninja -help` v1.6.5) : `-reapi_address=10.200.77.1:50051 -reapi_instance=main -reapi_insecure -project=aphrody -re_cache_enable_write -local_jobs=4 -remote_jobs=26`. Hors ligne : `--offline -local_cache_enable -local_jobs=<nproc>`.
- NativeLink : bytestream au format tableau (`[{ instance_name: "main", cas_store: "CAS" }]`, NativeLink 1.8.5 `ServicesConfig.bytestream: Vec<WithInstanceName<ByteStreamConfig>>`). Workers dimensionnés sur la RAM (`deploy.sh worker <ip> <cache> [jobs]`, défaut MemAvailable / 2,5 GiB plafonné à nproc) : fr1 10, prd 4, fr2 3, soit 17 slots distants.
- Sérialisation : unités systemd avec `ExecCondition` croisées (chromium-factory vs cros-factory), verrou pid dans `aphrody-factory`, et `doctor` en FAIL si siso, ninja, cros_sdk, repo, emerge ou gclient tournent déjà.
- Publication : on ajoute `icudtl.dat`, `vk_swiftshader_icd.json` et `hyphen-data/` (le script bash ne les prenait pas), plus un manifeste JSON (sha256, blake3) publié à côté du tar.zst.

Vulkan validation layers : −248 actions, 1 580 cœur·s mesurés au run 1 (cxx+cc du répertoire).

## Modèle et bornes (work/span, 2026-11-12)

Remplace les « gains attendus » estimés. Code : `tools/build-model/` (Rust ; `cargo test` vérifie DP, bornes et simulation sur DAG synthétiques à réponse connue et sur 300 DAG aléatoires). Reproduction : `tools/build-model/run.sh`. Sortie brute : `tools/build-model/results/2026-11-12-report.txt`. Règles : `docs/SCIENTIFIC-RIGOR.md`.

Entrées (mesurées)

| Entrée                       | Source                                                                                                                                                                                   | Valeur                                                                                                                                                   |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| DAG                          | `siso query graph` (fr1, graphe actuel, `dawn_enable_vulkan_validation_layers=false`), fermeture arrière de `headless_shell`, arêtes = inputs + implicit + order-only                    | 62 034 nœuds dont 21 819 phony (poids 0) ; 40 215 actions                                                                                                |
| Poids mesurés                | `run_nanos` de siso_metrics, run 1 + run 2 (run 2 prioritaire)                                                                                                                           | 31 124 actions                                                                                                                                           |
| Normalisation                | processus en vol mesurés (exec_start/exec_nanos) : jusqu'à 25 pendant les 50 premières minutes du run 1, 12 ensuite ; poids × min(1, 12/c) au milieu de l'action (partage de processeur) | 10 011 / 29 714 steps corrigés ; 140 339 → 127 095 slot·s                                                                                                |
| Imputation                   | actions non exécutées : tirage dans la distribution empirique classe (cxx/cc/link/alink/rust/action/copy) × répertoire 2 niveaux, repli 1 niveau puis classe, n ≥ 5                      | 9 091 actions = 22,6 % des actions, 29,2 % de T1                                                                                                         |
| Efficacité CPU η             | rusage enfant (utime+stime) réparti par minute, run 1, n = 176 min                                                                                                                       | 8,02 cœurs effectifs [IC 95 % bootstrap par blocs de 15 min : 7,54–8,54], médiane 8,44, IQR 7,80–8,81 ; η = 0,669 [0,629–0,712] ; ρ = ΣCPU/Σslot = 0,605 |
| Vitesse par cœur             | boucle awk 2·10⁷ itérations, n = 10 par hôte, médiane                                                                                                                                    | fr1 1 549 ms, prd 1 438 ms (load 11–38 pendant la mesure), fr2 1 893 ms → s = 1,077 (prd), 0,819 (fr2)                                                   |
| Action distante              | re-test, 1 action sur fr2                                                                                                                                                                | exec 1,34 s contre 5,23 s en local sous charge ; input_fetch à froid 11,07 s (n = 1 : insuffisant pour un facteur, sert de borne)                        |
| Réseau fr1 → prd (WireGuard) | 5 × 32 MiB via ssh, 1 × 105 MB                                                                                                                                                           | 28,9–154,7 Mbit/s, médiane 100,6 ; RTT 8,4 ms (n = 20)                                                                                                   |
| Sorties                      | `*.o` dans out/                                                                                                                                                                          | 25 362 fichiers, 2,41 GB, moyenne 94,9 kB → overhead chaud o = 2 RTT + 94,9 kB / 100,6 Mbit/s ≈ 0,025 s                                                  |
| Cache AC                     | re-test, 2e run                                                                                                                                                                          | 3/3 hits, Wilson 95 % [0,438 ; 1] ; coût d'un hit 0,178 s (n = 3)                                                                                        |

Formules

- T1 = Σ w(v) ; T∞ = plus long chemin pondéré (DP en ordre topologique : f(v) = w(v) + max f(u), u → v).
- p slots identiques, ordonnancement glouton (Graham/Brent) : max(T1/p, T∞) ≤ Tp ≤ T1/p + T∞.
- Slots hétérogènes de vitesses s_i et overhead o_i (durée w/s_i + o_i) : Tp ≥ max(T1/Σs_i, T∞/s_max) ; Tp ≤ Σd/p + CP(d) avec d = w/s_min + o_max (argument de Graham en unités d ; vérifié par les tests sur DAG aléatoires).
- Unité : slot·s de fr1 à 12 processus en vol. Pool REAPI : fr1 14 slots (4 local + 10 worker sur 12 cœurs → s = 12/14), prd 4, fr2 3. Trois jeux : `mid` s = ratio du micro-bench, o = 0,025 s ; `opt` s = ratio / 0,668 (action distante sans contention : durée = CPU ; 0,668 = ΣCPU/Σw normalisé) ; `coldcas` s = ratio, o = 11,07 s (CAS froid à chaque action, pire cas).
- Cache : w_h = h·c_hit + (1−h)·w ; link final toujours exécuté (hypothèse [NV] : link local, hors cache).
- Incertitude : bootstrap B = 1 000 sur les durées imputées (graine 20261112), percentiles 2,5/50/97,5. Les durées mesurées sont fixes : le bruit d'un run à l'autre n'est pas capturé.

Résultats (bornes = [basse ; haute], médianes bootstrap ; « sim » = glouton chemin critique simulé, médiane [IC 95 %])

| Scénario                             | T1                    | T∞              | p = 12 (fr1 seul)                       | pool `mid`                              | pool `opt`                  | pool `coldcas`              |
| ------------------------------------ | --------------------- | --------------- | --------------------------------------- | --------------------------------------- | --------------------------- | --------------------------- |
| Fin du 157 (9 091 actions restantes) | 15,77 h [15,30–16,23] | 117 s [86–276]  | [1,31 ; 1,35] h, sim 1,32 h [1,28–1,36] | [0,84 ; 0,96] h, sim 0,84 h [0,82–0,88] | [0,71 ; 0,92] h, sim 0,72 h | [0,84 ; 2,33] h, sim 1,06 h |
| Build froid complet (40 215 actions) | 53,93 h [53,49–54,37] | 479 s [468–637] | [4,49 ; 4,63] h, sim 4,50 h [4,46–4,54] | [2,87 ; 3,31] h, sim 2,88 h [2,86–2,91] | [2,44 ; 3,17] h, sim 2,45 h | [2,87 ; 9,38] h, sim 3,63 h |

Les IC des bornes sont dans le rapport brut (largeur ≤ ±3 %). Ces chiffres excluent le coût réel du link final.

Link final (`headless_shell`, ThinLTO + CFI + PGO) : jamais exécuté, imputé à 13,8 s (moyenne des 50 links mesurés, max 161 s), ce qui le sous-estime très probablement. Il est en bout de chaîne : T∞ et les deux bornes augmentent d'au plus L. Sensibilité (valeurs de scénario, non mesurées) :

| L       | fin du 157, p = 12 | fin du 157, `mid` | froid, p = 12   | froid, `mid`    |
| ------- | ------------------ | ----------------- | --------------- | --------------- |
| 600 s   | [1,33 ; 1,50] h    | [0,85 ; 1,15] h   | [4,51 ; 4,81] h | [2,88 ; 3,53] h |
| 1 800 s | [1,35 ; 1,87] h    | [0,87 ; 1,57] h   | [4,54 ; 5,17] h | [2,90 ; 3,95] h |
| 3 600 s | [1,40 ; 2,41] h    | [0,94 ; 2,21] h   | [4,58 ; 5,71] h | [2,93 ; 4,59] h |

Rebuild avec cache (pool `mid`, link hors cache) : h = 1 → [383 ; 504] s ; h = 0,95 → [881 ; 1 066] s ; h = 0,438 (borne basse Wilson) → [5 980 ; 6 921] s ; plus L dans les trois cas. Avec n = 3, h reste indéterminé dans [0,44 ; 1] : l'échantillon est trop petit pour conclure. Vulkan validation layers : déjà absentes du graphe actuel (les 11 005 − 1 414 = 9 591 restants du run 2 deviennent 9 091).

Validation (hindcast du run 1, 13:02 → 15:59, 29 714 steps, durée réelle 10 576 s)

- Bornes p = 12 sur le sous-graphe du run 1 : [10 591 ; 11 029] s ; la durée réelle est 0,14 % sous la borne basse, signe que la normalisation 12/c au milieu de l'action est approximative.
- Durée prédite (glouton FIFO, poids mesurés) : 10 735 s, erreur +1,5 % ; priorité chemin critique : +0,1 %.
- Validation croisée (50 % des durées remplacées par tirage dans les pools de l'autre moitié, 20 répétitions) : erreur de durée médiane +1,6 % [min +0,1 ; max +3,9].
- Fraction de travail terminé au cours du temps : écart max 0,003. Ce test est en partie circulaire (la normalisation utilise le profil de concurrence réel) et ne valide que l'hypothèse de saturation.
- Fraction d'actions terminées : écart max 0,37, moyen 0,21. Le modèle ne prédit pas l'ordre de siso (beaucoup de petites actions au début), seulement la durée totale.

Limites

- Link final non mesuré : il domine T∞ dès qu'il dépasse ~2 min. Le link ThinLTO est multi-thread, son coût en slot·s est sous-compté (1 slot). [NV]
- Les 9 091 actions restantes sont imputées à 100 % : les IC supposent qu'elles ressemblent aux actions déjà faites de même classe et même répertoire.
- Vitesses distantes : micro-bench mono-cœur, pas une compilation ; prd était chargé (load 11–38 sur 8 cœurs) et peut faire moins que `mid`. Une seule action distante mesurée. Débit fr2 ↔ fr1 non mesuré (seulement fr1 → prd).
- `opt` (zéro contention côté worker) et `coldcas` (CAS froid à chaque action) sont des bornes de scénario, pas des prédictions.
- Non modélisés : gn gen, scandeps (~0,1 s/action hors slot), téléchargements CAS autres que les sorties.
- Le hindcast utilise le run qui fournit les poids (sauf la CV).

## Runbook automatisé (F4, `aphrody-factory`)

Crate `crates/factory` (package `aphrody-factory`, lib + bin mince ; `tool_main(&[OsString]) -> i32` pour `ay factory`). Les canaux sont lus via `aphrody_conformance::channels::parse_toml`, sans second parseur. Pour `sync`, gclient reste le défaut ; `ay gclient sync --apply --populate-cache --cipd` est derrière `sync_with_ay` tant que F3 ne l'a pas validé. `ay gclient runhooks` et `revinfo` sont appelés directement (F3 : 0 diff).

| Commande                                     | Effet                                                                                                                                                                                                                                                                                                                                                                           |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `doctor`                                     | disque src ≥ 40 GiB et CAS ≥ 160 GiB, MemAvailable ≥ 16 GiB, pas de build concurrent, outils (siso, gn, ay, gclient, rclone), NativeLink :50051/:50061, workers connectés (`ss` sur :50061), toolchain conforme à `third_party/toolchain-<milestone>.toml` (cr_build_revision, VERSION rust, `clang --version`, `rustc --version`, stamps blake3), checkout sur le tag du canal |
| `sync [--refresh-channels]`                  | fetch au premier passage, tag du canal, `checkout_pgo_profiles`, gclient sync, install-build-deps une seule fois, `ay gclient runhooks`, `revinfo-<ver>.txt`                                                                                                                                                                                                                    |
| `gen`                                        | `out/labs_agent/args.gn` = args + bloc généré (`use_siso`, `use_remoteexec`), `gn gen`                                                                                                                                                                                                                                                                                          |
| `build [--offline] [--skip-doctor]`          | doctor (bloquant en FAIL), siso avec les flags REAPI, résumé de siso_metrics.json dans l'état                                                                                                                                                                                                                                                                                   |
| `publish`                                    | tar `zstd -T0 -19` + manifeste JSON → `r2-chromium:aphrody-chromium/labs_agent/<ver>/linux-x64.{tar.zst,json}`                                                                                                                                                                                                                                                                  |
| `all`                                        | sync → gen → build → publish ; chaque étape a une clé (version + hash des entrées) dans `/srv/chromium/factory-state.json` et n'est pas rejouée sans `--force`                                                                                                                                                                                                                  |
| `status`                                     | canal, état, out/, dernier résumé de build                                                                                                                                                                                                                                                                                                                                      |
| `toolchain install` / `check` `[--platform]` | rclone depuis R2, vérification taille + sha256 + blake3, extraction dans `third_party/llvm-build/Release+Asserts` et `third_party/rust-toolchain`, stamp `.aphrody-toolchain`                                                                                                                                                                                                   |

Déploiement sur fr1 (pas fait : rien n'est activé tant que le build est arrêté)

1. prd : `cargo build --release -p aphrody-factory`, copie vers `fr1:/srv/chromium/factory/bin/aphrody-factory` (même glibc 2.44).
2. fr1 : `infra/chromium-factory/{factory.toml,args/,systemd/}` et `third_party/{chrome-channels.toml,toolchain-157.toml}` dans `/srv/chromium/factory/`.
3. Redéployer le server (bytestream) : `deploy.sh server`. Worker fr1 : `deploy.sh worker 10.200.77.1 100000000000 10`. Workers prd et fr2 : `deploy.sh worker 10.200.77.1 <cache> 4` ou `3`.
4. `aphrody-factory doctor`, puis `aphrody-factory all`, ou l'unité `chromium-factory.service` avec son timer.

Validation : `cargo test -p aphrody-factory` sur prd, 21 tests OK, clippy sans avertissement sur la crate. `doctor` lancé en lecture seule sur fr1 : disque, RAM, outils, NativeLink et toolchain 157 OK ; prd et fr2 connectés ; fr1 sans worker (attendu).
