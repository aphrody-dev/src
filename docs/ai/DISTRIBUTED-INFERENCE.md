# Tissu d'inférence distribué

Relevés et mesures du 2026-11-13. Ce document couvre trois choses : ce qui existe en novembre 2026, ce qui a été retenu pour la flotte (PC RTX 4070, fr1, fr2, prd, second hôte GPU Windows), et ce qui a été mesuré. Mise en œuvre : `infra/ai/fabric.toml`, `infra/ai/fabric/node.sh`, `packages/ai-os/src/fabric/`, `ay ai fabric`.

## 1. Comparatif (sources vues le 2026-11-13)

| Projet | État relevé | Windows + CUDA | CPU seul | Transport | Sur un WAN |
|---|---|---|---|---|---|
| **llama.cpp RPC** (`ggml-rpc-server`, `--rpc`) | release `b12340` du 2026-11-13 01:13 UTC, commit `8954f19`. Derniers commits de `tools/rpc` : `6122b56` (2026-11-10, échec propre sur endpoint injoignable), `7e42b95` (2026-11-05) | binaires officiels `win-cuda-13.5-x64` et `cudart` (digests GitHub), RTX 4070 vue en `CUDA0` | oui (`ubuntu-x64`) | TCP brut, sans authentification ni chiffrement. Le README le dit : « fragile and insecure, never run the RPC server on an open network ». RDMA seulement en RoCEv2 ou Thunderbolt 5 | répartition par couches (`-sm layer`, `-ts`), un aller-retour réseau par appareil distant et par jeton. Cache de tenseurs côté serveur (`-c`, FNV-64, seuil 10 Mio, `HASH_THRESHOLD` de `ggml-rpc.cpp`) |
| llama-server, mode routeur | `tools/server/README.md` : `--models-dir`, `--models-preset`, `--models-max` (défaut 4), `--models-memory-margin` (déchargement LRU selon la mémoire) | oui | oui | HTTP local | routeur multi-modèles sur un seul hôte, pas de répartition entre hôtes |
| exo (`exo-explore/exo`) | v1.0.71 du 2026-04-23, push le 2026-11-06 | non : macOS (MLX) et Linux. Le README précise qu'exo tourne « on CPU on Linux » | Linux seulement | découverte sur le réseau local, RDMA Thunderbolt | conçu pour un LAN de Mac. Mac et Linux ne se joignent pas (builds MLX différents) |
| distributed-llama (`b4rtaz`) | v0.17.1 du 2026-11-10 | Windows oui, CPU et Vulkan expérimental, pas de CUDA | oui | TCP, parallélisme de tenseurs | 1, 2, 4… 2^n nœuds seulement, synchronisation à chaque couche, inadapté aux RTT mesurés sur la flotte (§6) |
| LocalAI (`mudler/LocalAI`) | v4.12.1 du 2026-10-23 | aucun binaire Windows (assets : linux, darwin) | oui | P2P libp2p à jeton partagé. Le mode « worker » enveloppe le RPC de llama.cpp (PR #2324) | le mode fédéré route une requête entière vers un seul nœud, ce qui est utile contre la charge mais ne permet pas un modèle plus gros que le plus gros nœud |
| vLLM | v0.33.0rc3 du 2026-11-02 | doc d'installation : « does not support Windows natively » (WSL) | roue CPU (déjà dans `ai.toml`, non servie sur prd) | Ray + NCCL. La doc : NCCL en `NET/Socket` « is not efficient » ; InfiniBand recommandé | parallélisme de pipeline possible, mais environnement identique exigé sur chaque nœud |
| SGLang | v0.5.23 du 2026-11-02 | Linux | non pertinent | NCCL | même profil que vLLM |
| GPUStack | v2.3.1 du 2026-11-11 | « Only Linux is supported for GPUStack worker nodes » (WSL2 conseillé) | serveur oui | gestionnaire de vLLM, SGLang, TensorRT-LLM | orchestration de cluster, sans modèle réparti sur WAN |
| Petals | v2.2.0 du 2023-09-06, dernier push le 2024-09-07 | – | – | – | abandonné |
| Ollama | v0.40.16 du 2026-11-09 | oui | oui | – | pas de répartition. La PR #16137 « add ggml RPC backend » est ouverte, non fusionnée |

Chez aphrody-labs et dans src : pas de fork de llama.cpp (`third_party/forks.txt`, `third_party/`). `tools.toml` installe la build Vulkan `12317` officielle. `infra/docker/compose.yaml` retire `llama` de prd depuis `769c6c3` (règle du 2026-11-13). `ai.toml` ne sert ni vLLM ni mistral.rs sur prd (`4dd23e5`). Aucun dépôt à forker : on prend les binaires officiels vérifiés par digest, comme l'exige l'ordre de mission du 2026-11-13 (compilation en CI du fork ou binaires officiels vérifiés, jamais sur le PC ; règle reprise dans `CLAUDE.md` : « Nothing compiles on the workstation »).

## 2. Architecture retenue

llama.cpp RPC. C'est le seul projet qui réunit Windows et CUDA (moteur principal), des nœuds Linux en CPU seul, une API OpenAI déjà consommée par ai-os, et des binaires officiels vérifiables.

```
PC (Windows, RTX 4070)                       WireGuard uniquement
  llama-server coordinateur 127.0.0.1:8090 ── --rpc ──> fr1 10.200.77.1:50052   (si aucun build)
  CUDA0 : l'essentiel des couches            ── --rpc ──> prd 10.200.78.1:50052   (lien direct /30, plafonné)
  ai-os llm_models : fabric/<alias>          ── --rpc ──> gpu2 <wg>:50052         (dès qu'il répond)
                                                         fr2 (désactivé : proxy prioritaire, 11 Go)
```

- **Coordinateur** : `llama-server` CUDA sur le PC, lié à `127.0.0.1:8090`. Les logits restent sur le PC : avec `-ngl 999`, la tête de sortie est sur CUDA0, et seul l'état caché traverse le réseau, soit `n_embd × 4` octets (f32) par jeton et par frontière : 6 Kio pour gemma-4-E2B (`n_embd = 1536`), 4 Kio pour Qwen3-0.6B (1024), 20 Kio pour un modèle à `n_embd = 5120` (classe 14-32B).
- **Nœuds Linux** (`node.sh`) : `ggml-rpc-server` officiel `b12340` (sha256 vérifié) dans l'unité transitoire `aphrody-rpc`, avec `CPUQuota`, `MemoryMax`, `MemorySwapMax=0`, `Nice=19`, `IOSchedulingClass=idle`, `CPUWeight=10` et `OOMScoreAdjust=900`. Le serveur écoute uniquement sur l'adresse WireGuard (`-H`, jamais `0.0.0.0`). Une table nft `inet aphrody_rpc` rejette toute source autre que le coordinateur (`10.200.77.2`, `10.200.78.2`) et le nœud lui-même. Aucun port public, aucun passage par Cloudflare.
- **Admission et retrait** : la condition est vérifiée avant le démarrage, puis toutes les `watch_s` secondes par le chien de garde de l'unité. Quand elle tombe, le rpc-server s'arrête et la raison est écrite dans `/run/aphrody-rpc.state`.
  - fr1 (`no-build`) : aucun processus `ninja|siso|reproxy|clang|rustc|ld.lld`, et charge inférieure à nproc/2.
  - prd (`prd`) : charge inférieure à nproc/2 (en cours d'exécution, on ignore nos propres fils, plafonnés par CPUQuota), `shenron-chat-v2` (`127.0.0.1:8799/health`) à 200, MemAvailable ≥ MemoryMax + 2 Gio, et `flock -n /var/lock/aphrody-heavy.lock` pris pendant toute la vie de l'unité. Le tissu compte donc comme l'unique travail lourd de prd et n'attend jamais le verrou.
  - fr2 (`proxy`) : nginx actif et charge inférieure à nproc/2. Désactivé par défaut.
- **Santé et bascule** : `orch/health.ts` enregistre chaque nœud (hôte = nœud, fournisseur `fabric-rpc`). Un nœud en échec (ssh, installation, port muet) est mis en refroidissement et écarté au `up` suivant. Un refus par condition (code 75) n'est pas compté comme une panne. Le modèle servi apparaît dans `llm_models` et `llm_ask` sous `fabric/<alias>` (`llm/models.ts`, `AI_FABRIC_URL`). Si le coordinateur tombe, le fournisseur `fabric` disparaît de la liste et `orch/select.ts` bascule sur les autres (llamacpp `:8080`, ollama, distants). `fabric up --local` relance le coordinateur sur le GPU seul.
- **Répartition** : `share` par nœud, traduit en `-ts` dans l'ordre des appareils de llama.cpp (nœuds RPC d'abord, puis CUDA0, vu dans le journal `llama_prepare_model_devices`). Sans part, llama.cpp répartit selon la mémoire libre. Il confierait alors l'essentiel des couches au CPU de fr1 (47 033 Mio libres annoncés contre 11 106 Mio pour la 4070), ce qu'on a observé avant de corriger.

### Cache de modèles, montages, swap

- **Pas de montage réseau pour les poids.** Le lien montant du PC est mesuré à 145 Kio/s par ssh public, et 30 à 54 Kio/s par WireGuard. Un `mmap` à travers SMB, NFS, SSHFS ou `rclone mount` lirait les pages à ce débit. La donnée doit descendre vers le PC (environ 7 Mio/s mesurés depuis Hugging Face), jamais en monter.
- **Cache dédupliqué par contenu** : un GGUF est identifié par son sha256 (oid LFS de Hugging Face, ou digest de blob Ollama). Sur le PC, `~/.local/share/ay/ai/` tient des liens durs vers les blobs d'Ollama (`ay ai`, `{ollama_gguf:}`) : aucune seconde copie. Sur chaque nœud, `node.sh warm` tire le GGUF depuis `url` dans `/var/cache/aphrody-models` au débit du centre de données, le vérifie, puis le charge une fois sur la boucle locale. Le cache de tenseurs de rpc-server (`/var/cache/aphrody-rpc`, SSD) se remplit ainsi, et au chargement suivant le coordinateur n'envoie que les empreintes des tenseurs de plus de 10 Mio. Les tenseurs plus petits passent toujours par le réseau : sur un petit modèle (gemma-4-E2B, couches de 4 à 9 Mio), le gain est partiel. Calcul, non mesuré : un tenseur FFN de Qwen3-14B (5120 × 17408, Q4_K à 4,5 bits) pèse environ 48 Mio, donc plus que le seuil. Le chargement d'un tel modèle devrait ne transporter que des empreintes pour l'essentiel de ses poids.
- **Swap et zram** : refusés pour l'inférence (`MemorySwapMax=0`). Le 2026-11-13, le swap de prd est plein (16/16 Gio). Faire échanger des poids ou un cache KV ne ferait que retarder l'OOM tout en ralentissant shenron.
- **Tunnels** : WireGuard existant (hub fr1 `wg1`, lien direct PC↔prd `prod` 10.200.78.0/30). Les tunnels Cloudflare (`docs/infra/CLOUDFLARE-ONE.md`) servent aux interfaces d'administration. Ils ne transportent pas le RPC, dont le protocole n'a pas d'authentification.

## 3. Mémoire disponible et choix de modèles

| Hôte | Apport admissible | Mémoire pour le tissu |
|---|---|---|
| PC | RTX 4070 12 Go (11,1 Gio libres, dont une partie prise par le llamacpp Vulkan `:8080` s'il tourne) | ~10 Gio VRAM + RAM pour les embeddings mappés |
| fr1 | 12 cœurs, 45 Gio (43 libres), uniquement hors build | `memory_max = 24G` |
| prd | 8 cœurs, 31 Gio, plafond `200%` CPU | `memory_max = 6G` |
| fr2 | 6 cœurs, 11 Gio | 2 Gio (désactivé) |
| gpu2 | inconnu | à mesurer à l'intégration |

- **≤ 10 Gio** (gemma-4-E2B, 8B en Q4_K_M) : GPU seul. Le tissu ne sert ici que de démonstration et de bascule.
- **10 à 34 Gio** (gemma 4 / Qwen 27-32B en Q4_K_M) : GPU plus fr1 hors build. Le débit est borné par l'aller-retour WAN de chaque jeton (voir les mesures). C'est le seul moyen de servir ces modèles sans un second GPU.
- **Au-delà** : seulement avec gpu2. Ni prd (6 Gio) ni fr2 n'apportent une capacité utile ; prd reste un appoint de démonstration.

## 4. Intégrer le second hôte GPU Windows

Au 2026-11-13, il est absent de `infra/deploy.toml`, `infra/agents/fleet.toml`, `docs/infra/*`, `~/.ssh/config`, et des pairs WireGuard documentés (fr1 `wg1`, prd `prod`). Il n'est donc pas joignable. Le nœud `gpu2` de `fabric.toml` est prêt (`reach = ""`). Pour l'intégrer :

1. Pair WireGuard : une adresse dans 10.200.77.0/24 (par exemple `.6`) sur le hub fr1 (`wg1`), à déclarer dans `docs/infra/FLEET.md` et `deploy.toml`.
2. Pilote NVIDIA avec CUDA UMD ≥ 13.5 (`nvidia-smi`) et bun. Le binaire `win-cuda-13.5-x64` est récupéré et vérifié par `ai-os fabric node gpu2`.
3. Dans `fabric.toml`, renseigner `bind` et `reach` avec l'adresse WireGuard, et `share` selon la VRAM.
4. Démarrer `ai-os fabric node gpu2` au boot (tâche planifiée, comme les services de `ay ai service`), puis ouvrir le port 50052 dans le pare-feu Windows. Si gpu2 est un pair du hub fr1 (`wg1`), le coordinateur arrive depuis 10.200.77.2, qui sera la seule source autorisée. S'il a un lien direct avec le PC, il faut autoriser l'adresse du PC sur ce lien.
5. Au `ay ai fabric up` suivant, le nœud est admis dès que son port répond. Il sort de la liste s'il ne répond plus.

## 5. Utilisation

```sh
ay ai fabric up [--only fr1,prd] [--split 1,7] [--local] [--no-warm] [--model qwen3-0.6b]   # ou : ai-os fabric up
ay ai fabric ensure        # bascule : coordinateur muet -> up avec les nœuds encore admis, sinon GPU seul (tâche planifiée)
ay ai fabric warm          # nœuds : GGUF local vérifié, cache de tenseurs rempli
ay ai fabric status        # coordinateur, nœuds : condition, charge, MemoryPeak/CPUUsageNSec de l'unité
ay ai fabric bench --tokens 128
ay ai fabric down
```

## 6. Mesures du 2026-11-13

Les binaires sont les officiels `b12340`, avec des sha256 identiques aux digests GitHub (`gh api repos/ggml-org/llama.cpp/releases/tags/b12340 --jq '.assets[]|.name+" "+.digest'`) :
- `llama-b12340-bin-win-cuda-13.5-x64.zip` : `31013c2a0d7ed93489862613a08f34658861996741b310ee3fa9e27ec139642b`
- `cudart-llama-bin-win-cuda-13.5-x64.zip` : `c2bf4cc202bfbaaa7a0b75f5082457c3811326947bb216059b72839d844e9cba`
- `llama-b12340-bin-ubuntu-x64.tar.gz` : `5bc0276548147e56aa03f97b201b1cb3b43cbda6e388f1f2f4c8d82b56313856`

RTT mesurés depuis le PC :
- vers fr1 : `ping 10.200.77.1`, 49 à 74 ms, moyenne 61 ms ; `ss -ti` côté fr1 sur la connexion RPC, `minrtt` 25 ms et `rtt` 28 ms ;
- vers fr2 : 149 ms (`ping 10.200.77.3`, par le hub) ;
- vers prd : 169 ms par le hub, et 74 à 136 ms par le lien direct `10.200.78.1`.

Échantillons : 3 ou 4 requêtes par configuration, ce qui est peu. Pilote 621.14 (CUDA UMD 13.5). Requête : `ai-os fabric bench` (température 0, `ignore_eos`), débits lus dans `timings` de llama-server.

| Configuration | Modèle | Génération (tok/s) | Prompt (tok/s) | Chargement |
|---|---|---|---|---|
| GPU seul (RTX 4070) | gemma-4-E2B Q4_K_M | 170 / 178 / 181 / 180 (128 jetons) | 178-285 | 3 s |
| GPU seul | Qwen3-0.6B Q4_K_M | 420 / 417 / 446 / 465 (64 jetons) | 317-418 | < 2 s |
| GPU + fr2 (1/28 des couches, `-ts 1,27`) | Qwen3-0.6B Q4_K_M | 6,0 / 2,5 / 2,3 (32 jetons) | 3,4-7,7 | 178 s |
| GPU + fr1 (1/35, `-ts 1,34`) | gemma-4-E2B Q4_K_M | génération interrompue au bout de 7 min (voir plus bas) | 1,0-2,0 | 326 s (51,5 Mo poussés) |

- **Débit réparti / GPU seul ≈ 1/70 à 1/200.** Le rapport compare la seule configuration complète, GPU + fr2 sur Qwen3-0.6B (6,0 à 2,3 tok/s), au GPU seul sur le même modèle (417 à 465 tok/s). Une seule couche distante suffit à produire cet écart. Chaque jeton paie un aller-retour WireGuard (25 à 60 ms mesurés vers fr1) et la remontée de l'état caché par le lien montant du PC. Trafic mesuré sur le socket de fr2 (`bytes_received`/`bytes_sent` avant et après) pendant les 3 requêtes : 931 Ko montants et 877 Ko descendants. Les 3 requêtes comptent 3 × 32 jetons générés plus environ 3 × 20 jetons de prompt, soit ~156 jetons, d'où ~6 Ko par jeton. C'est cohérent avec `n_embd × 4` = 4 Kio plus l'en-tête des commandes RPC. Ce n'est pas le volume qui limite mais la latence par jeton.
- **gemma-4-E2B ne se répartit pas.** La génération est restée sous 0,15 tok/s, avec un prompt à 1 tok/s. Cause probable, non vérifiée au niveau des octets : les modèles Gemma « E » partagent le cache KV entre couches, et les couches CUDA relisent alors à chaque jeton un KV posé sur l'appareil distant. Sur fr2, avec la même part d'une couche, Qwen3 a donné 2 à 6 tok/s. Consigne provisoire, tant qu'un second modèle Gemma n'a pas été testé : servir en priorité des architectures sans partage de KV (Qwen3, Llama, Mistral).
- **Lien montant du PC** : 145 Kio/s par ssh public et 30 à 54 Kio/s par WireGuard, contre environ 7 Mio/s en descente (Hugging Face, 3,1 Go en 370 s). D'où `warm` : sur fr1, le GGUF est tiré en 1 min environ, et 897 Mio de tenseurs de plus de 10 Mio ont été mis en cache localement en 6 s.
- **Retrait automatique observé (un événement)** : sur fr1, un build `rustc` (toolchain nightly-2026-11-12, crates `syn`, `rustls`, `reqwest`) était en cours, avec une charge de 28,4 puis 53,8. À 02:48:03 UTC, au premier passage du chien de garde qui l'a vu, le rpc-server s'est arrêté (`/run/aphrody-rpc.state` : « retrait… »). L'unité consigne alors « Consumed 13.348s CPU time over 12min 32s wall clock time, 3G memory peak », sous `MemoryMax` 24G. llama.cpp arrête alors le coordinateur (« Remote RPC server crashed »), le fournisseur `fabric` disparaît de `llm_models`, et `ai-os fabric ensure` relance un coordinateur GPU seul. fr1 est alors refusé (refroidissement `fabric-rpc`), prd aussi (« charge 4.30 >= 4 »), et gpu2 n'est pas déclaré.
- **Plafonds sur fr2** (`proxy`) pendant le test : `CPUQuotaPerSecUSec=1s` (100 %), `MemoryMax=2147483648`, `MemoryPeak=100425728` (96 Mio), 4,3 s de CPU au total, nginx actif, charge 0,21 à 0,49 pour 6 cœurs.
- **prd surveillé** pendant les deux essais (toutes les 3 s : charge, verrou lourd, `shenron-chat-v2`, unité `aphrody-rpc`). Charge entre 3,70 et 4,29 pour un seuil de 4, verrou `/var/lock/aphrody-heavy.lock` tenu par un autre travail, `8799/health` toujours à 200, aucune unité `aphrody-rpc`. prd a été refusé à chaque admission. Après les essais, la charge de prd monte à 113,9 (1 min) sans aucune unité du tissu présente. Ce n'était pas le cas d'utilisation de prd, qui reste un appoint borné à 2 cœurs et 6 Gio.

Conclusion :
- Ce qui est démontré :
  - génération répartie réelle GPU + VPS (Qwen3-0.6B sur fr2) ;
  - exposition limitée à WireGuard, avec filtre nft ;
  - plafonds systemd tenus (fr2) ;
  - retrait automatique sur build (fr1) ;
  - refus de prd par la règle ;
  - bascule vers le GPU seul.
- Ce qui ne l'est pas : un modèle de 14 à 32B réparti (cas d'usage du §3, non mesuré), et la cause de la charge de 113,9 sur prd. Aucune unité du tissu n'y tournait, mais l'auteur de cette charge n'a pas été identifié.
- Sur les liens actuels, le tissu ne sert qu'à charger un modèle que la 4070 ne peut pas contenir. Il n'accélère jamais un modèle qui y tient.
- Hypothèse : un gain de débit demanderait gpu2 sur le même réseau local que le PC, ou un lien montant plus rapide.

## 7. Revue

Verdict 1 de Gemini, le 2026-11-13, par le relais `gemini_review` (moteur antigravity, 33 s) : **13/20**. Seize défauts relevés, traités comme suit dans cette version :

- Comparaisons et chiffres :
  - Qwen3 rattaché à fr2, et non à fr1.
  - Méthode du rapport 1/70 à 1/200 donnée.
  - Calcul des ~6 Ko par jeton détaillé, avec la formule `n_embd × 4` par modèle.
  - RTT mesurés listés par nœud, avec leur commande.
  - Digests complets.
- Affirmations requalifiées :
  - Taille FFN d'un 14B présentée comme un calcul, non mesuré.
  - Consigne Gemma marquée provisoire.
  - Retrait sur fr1 décrit comme un événement unique, avec son contexte.
  - « Sûr » et « opérationnel » remplacés par la liste de ce qui est démontré et de ce qui ne l'est pas.
  - gpu2 et le gain de débit présentés comme des hypothèses.
- Précisions :
  - Source de la règle « binaires officiels ».
  - Adresse source du pare-feu de gpu2 selon le lien.
- Non traités dans cette version :
  - Numérotation (§5/§6) : déjà conforme dans le fichier. L'écart venait de la version condensée envoyée à Gemini.
  - Mesure d'un 14B ou plus.
  - Second modèle Gemma : hors de portée du lien montant actuel.
