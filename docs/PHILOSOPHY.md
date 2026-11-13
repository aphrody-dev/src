# Philosophie de src

Ce que src reprend de chaque modèle, ce qu'il refuse, et pourquoi. Marquage : [V] vérifié dans la source citée le 2026-11-12, [NV] non vérifié (à sourcer avant d'en dépendre). La structure qui en découle est dans [ARCHITECTURE.md](ARCHITECTURE.md).

## 1. Chromium (gn, DEPS/gclient, //base, components, checkdeps, Mojo)

| Principe | Source | Adopté | Rejeté / adapté |
|---|---|---|---|
| Fichiers DEPS par répertoire : `+` autorise, `-` interdit, `!` autorisé mais à retirer (avertissement en presubmit) | `third_party/chromium/src/buildtools/checkdeps/README.md` @ef68a767 [V] | Adapté : format maison `DEPS.rules` (pas le DEPS Python), mêmes préfixes `+`/`-`/`!` et même héritage vers le bas, plus deux ajouts absents de Chromium : `layer = N` et les lignes `sous/dossier: directive` ; gate `scripts/checkdeps.ts` | Granularité unité (crate ou package) et pas fichier `#include` : Cargo et bun déclarent déjà les arêtes dans leurs manifestes |
| Les components ne dépendent pas des couches hautes (`//chrome`, `//content/shell`…), peuvent dépendre des basses (`//base`, `//net`, `//mojo`, `//ui`), et entre eux seulement si c'est explicite dans DEPS | `components/README.md` [V] | Oui : couches L0 à L5, dépendance vers le bas libre, latérale libre mais sans cycle, vers le haut interdite (seul `!` + ticket la tolère, `+` ne lève qu'un `-`) | Chromium autorise les arêtes entre components par `+` ; chez nous `+` ne franchit jamais une couche vers le haut |
| `//base` : petite bibliothèque commune, code hors src.git ne l'utilise pas ; en Rust, « very small crates, split up by function » | `base/README.md` [V] | Oui : L1 base = crates petites, sans code propre à un OS (pas de `cfg(target_os)` ni windows-rs) et sans dépendance vers un service ; des primitives génériques de domaine (CAS, erreurs, tokens) y sont admises | Pas de copie de l'API C++ de base : on prend std + crates.io épinglés |
| gclient DEPS : chaque dépendance externe épinglée par commit de 40 caractères | `DEPS` racine, gate ARCH-014 d'archguard [V] | Oui (DEPS racine existant, `src.lock.json`) | Pas de `hooks` Python arbitraires : les hooks passent par `just` |
| Mojo : interfaces typées (`.mojom`) entre processus/services | `docs/mojo_and_services.md` [V] | L'idée : toute frontière de processus a un schéma versionné (proto pour Lore, JSON Schema/MCP pour l'agent, C ABI versionnée `core_abi_version()`) | Mojo lui-même : trop lié à //base et au sandbox Chromium |
| gn + siso/ninja pour le build | `crates/factory` (F4) | Seulement pour construire Chromium (factory) | Pas de gn pour le reste : cargo et bun suffisent, un second système de build dupliquerait le graphe |

## 2. bun

| Principe | Source | Adopté | Rejeté |
|---|---|---|---|
| Binaire unique : `bun build --compile` produit un exécutable autonome | `third_party/bun/docs/compiler/executables.mdx` @9dda375 [V] | Oui : `ay` multicall (un binaire, sous-commandes), `aphrody` CLI unique | — |
| Tout intégré (test, fmt, bundler, sqlite, ffi, shell) | doc bun 1.4.4 (skill `bun`) [V] | Oui : aucun outil tiers JS si bun le fait ; gate checkdeps écrit en bun, pas de dépendance npm | turbo, eslint, prettier, vitest : refusés tant que bun couvre le besoin |
| Démarrage rapide, coût mesuré | — | Oui : les gates (checkdeps < 1 s) tournent sans compilation | — |
| Langage d'implémentation (bun est écrit en Zig et C++ ; on ne lui attribue aucun portage Rust) | — | Choix propre à src, pas repris de bun : le code natif first-party est Rust (unification cargo + LLVM) : le code natif first-party est Rust ; C++ seulement via la toolchain LLVM partagée | Pas de Zig first-party |

## 3. Noyau Linux (upstream)

| Principe | Source | Adopté | Rejeté |
|---|---|---|---|
| « We don't cause regressions », première règle | docs.kernel.org/admin-guide/reporting-regressions.html [V] | Oui : une fusion ne fait jamais baisser le nombre de tests verts ; une régression se corrige ou se revert | — |
| Un changement logique par patch, et le tree compile et tourne après chaque patch (bisect) | docs.kernel.org/process/submitting-patches.html [V] | Oui : petits commits sur main, chacun passe `just check` ; pas de force-push | Pas de série de patchs par mail |
| MAINTAINERS + `get_maintainer.pl` : copier les mainteneurs du sous-système | idem [V], `third_party/linux/MAINTAINERS` | Oui : `MAINTAINERS` racine (format kernel, champs M/S/F/X), `just maintainer <chemin>` ; M: peut nommer un agent ou une skill | — |
| Revue sur liste de diffusion | idem | L'esprit : toute modification de doc d'architecture passe une revue externe archivée (`docs/reviews/`) | Le canal mail : remplacé par revue d'agent + archive versionnée |
| Coding style | `Documentation/process/coding-style.rst` [NV, non relu] | rustfmt / `bun fmt` comme seul style, sans débat | Le style C du kernel |

## 4. Windows NT

| Principe | Source | Adopté | Rejeté |
|---|---|---|---|
| Couche Executive (objets, mémoire, processus, E/S, configuration) dans ntoskrnl ; les pilotes et la HAL n'en font pas partie | learn.microsoft.com/windows-hardware/drivers/kernel/windows-kernel-mode-executive-support-library [V] | Oui : L2 « plateforme » = notre HAL (Windows, Linux, Cloudflare, Vercel derrière une interface) ; L3 « services » = notre Executive | — |
| E/S en couches : le gestionnaire d'E/S transforme une demande en IRP routé à travers une pile de pilotes, chacun traite puis passe au suivant | learn.microsoft.com/…/overview-of-the-windows-i-o-model [V] | Le modèle de requête : un appel traverse les couches de haut en bas, jamais l'inverse ; les adaptateurs de plateforme sont empilables (runtime-adapter) | Les IRP eux-mêmes |
| Gestionnaire d'objets + handles + contrôle d'accès par le security reference monitor à l'ouverture | learn.microsoft.com/…/example-i-o-request---an-overview [V] | L'idée pour l'agent : une ressource s'obtient par handle avec des droits vérifiés à l'ouverture (outils MCP, secrets env-kit) | Pas d'implémentation d'ACL NT hors Windows |
| Stabilité de l'ABI exposée | [NV] | Oui pour nos C ABI (`core_abi_version`) : on ajoute, on ne casse pas | — |

## 5. cargo / crates.io

| Principe | Source | Adopté | Rejeté |
|---|---|---|---|
| Workspace unique, `[workspace.dependencies]` | `Cargo.toml` racine [V] | Oui : une version par dépendance | — |
| Features additives : activer une feature ne doit pas retirer de fonctionnalité ni introduire de changement incompatible SemVer ; unification par union | doc.rust-lang.org/cargo/reference/features.html [V] | Oui : pas de feature qui désactive ; les choix de plateforme passent par `cfg(target_os)` en L2 | — |
| SemVer et publication crates.io | doc cargo `semver.md` [NV, non relu] | SemVer pour les crates publiables ; `publish = false` par défaut | Publier des crates internes non stabilisées |

## 6. Monorepo moderne (Turborepo, just, bun workspaces, uv)

| Principe | Source | Adopté | Rejeté |
|---|---|---|---|
| Graphe de tâches + filtre par changement + cache distant ; le cache distant est implémentable par tout serveur HTTP suivant l'API Remote Cache (endpoints v8) | turborepo.dev/docs/core-concepts/remote-caching [V] | Le graphe : `checkdeps --affected REF` calcule unités touchées + dépendants transitifs ; `just test-affected` teste seulement celles-là | turbo : refusé. Il peut cacher n'importe quelle tâche déclarée, mais au grain du package : il faudrait redéclarer le graphe Cargo dans turbo.json/package.json, alors que sccache cache déjà au grain de l'unité de compilation rustc. Il ajouterait un binaire, une config et un second graphe. Le cache distant R2 vaut pour cargo/sccache (TICKET taskgraph-001), pas pour turbo |
| just comme point d'entrée | `justfile` [V] | Oui : `just check`, `just checkdeps`, `just affected` | Makefiles, scripts .sh/.ps1 |
| bun workspaces, uv pour Python | `package.json`, `packages/ai-os/python/pyproject.toml` [V] | Oui | npm/pnpm/yarn, pip |

## 7. FFI / interop et toolchain LLVM

| Principe | Source | Adopté | Rejeté |
|---|---|---|---|
| C ABI générée par cbindgen | `crates/core-capi` (cbindgen.toml) [V] | Oui : une seule frontière native, versionnée | Bindings écrits à la main |
| bun:ffi pour consommer la C ABI | `packages/core` [V] | Oui | napi tant que bun:ffi suffit (napi = Node, ABI plus lourde) |
| pyo3 pour Python | `crates/agent-py` [V] | Oui, côté agent seulement | — |
| windows-rs depuis le dépôt (pas crates.io) + windows-bindgen | consigne propriétaire | Oui, en L2 uniquement | `winapi`, bindings ad hoc |
| Toolchain LLVM partagée (clang, lld, rustc sur le même LLVM) pour la LTO inter-langages | `docs/llvm/` | Oui comme cible L0 | Conflit ouvert MSVC vs LLVM pour nt (non tranché ici) |

## Règles qui en découlent

1. Une dépendance va vers une couche inférieure ou latérale, jamais vers le haut ; les cycles sont interdits. Contrôlé par `just checkdeps` (CI).
2. Toute exception est écrite dans un `DEPS.rules` avec `!` et un ticket ; elle s'affiche en avertissement jusqu'à sa suppression.
3. Pas de régression, commits bisectables, revue archivée.
4. Une frontière de processus ou de langage a un schéma versionné (C ABI, proto, MCP).
5. Pas d'outil ajouté si bun, cargo ou just le font déjà.
