# Revue Gemini 4 Carbon High : PHILOSOPHY.md + ARCHITECTURE.md (2026-11-12)

Soumis : docs/PHILOSOPHY.md et docs/ARCHITECTURE.md sections 1-8 (commit 0f7a5a0), via claude-in-chrome sur gemini.google.com, mode Carbon High. Verdict brut ci-dessous ; corrections appliquées listées en fin.

Note : 13,5 / 20 — La gouvernance (couches explicites, gestion de la dette par ! et tickets, refus de multiplier les systèmes de build) est solide et lisible, mais plusieurs contradictions de couches, angles morts inter-langages et oublis dans les gates CI empêchent l'application mécanique des règles annoncées.

[Erreur factuelle — PHILOSOPHY.md §6] Turborepo n'est pas limité au JS. Turborepo est agnostique du langage et cache n'importe quelle tâche ou sortie déclarée dans turbo.json (y compris Cargo).Correction : Justifier son rejet par la granularité : sccache met en cache chaque unité de compilation rustc (partagée entre crates), là où Turbo ne cache qu'au niveau du package et imposerait de dupliquer le graphe Cargo dans des package.json factices.

[Erreur factuelle — PHILOSOPHY.md §2] Bun ne réécrit pas son cœur Zig/C++ en Rust. Ce point marqué [NV] est inexact : Bun reste écrit en Zig et C++ (JavaScriptCore) sans portage interne vers Rust.Correction : Supprimer cette ligne et assumer le « tout Rust natif, zéro Zig » comme un choix propre à src (unification autour de Cargo et LLVM).

[Erreur factuelle — PHILOSOPHY.md §1 & ARCHITECTURE.md §2] checkdeps n'est pas repris « tel quel ». Le checkdeps de Chromium analyse les #include via des fichiers Python DEPS (include_rules) et n'a aucune notion numérique de layer = N.Correction : Remplacer « Oui, tel quel » par « Adapté : format maison DEPS.rules ajoutant layer = N et sous/dossier: directive aux préfixes +/-/! de Chromium ».

[Incohérence inter-docs — PHILOSOPHY.md §1, §4, §5, §7 vs ARCHITECTURE.md §1] Pollution de L1 (base) par l'OS et les domaines. PHILOSOPHY.md définit L1 comme « sans dépendance de domaine » (§1), réserve runtime-adapter à la HAL L2 (§4), et cantonne cfg(target_os) (§5) ainsi que windows-rs (§7) à L2 uniquement. Or ARCHITECTURE.md §1 place en L1 :

des modules intrinsèquement liés à l'OS (crates/sys, crates/net, packages/machine, packages/runtime-adapter), impossibles à écrire sans cfg(target_os) ni windows-rs ;

des crates métier (lore-_, depot-_, aphrody-design-_, gamescope-core).Correction : Remonter sys, net, machine et runtime-adapter en L2 (ou scinder sys sous L2 en autorisant cfg(target_os) en L1), et déplacer les crates lore-_, depot-_, aphrody-design-_ et gamescope-core en L2/L3.

[Incohérence interne — ARCHITECTURE.md §1, §2 & §5] Dépendance montante packages/core (L1) → crates/core-capi (L2) et règle C ABI incohérente. @aphrody/core (L1) charge core-capi (L2) via bun:ffi, créant une arête montante L1 → L2. De plus, §2 place toute C ABI « une couche au-dessus de ce qu'elle expose », mais range ffi et lore-capi (exposant L3) en L5 au lieu de L4 — ce qui interdit à agent (L4) de les utiliser sans infraction montante.Correction : Placer une C ABI dans la même couche que ce qu'elle expose (core-capi en L1 ou @aphrody/core en L2 ; ffi et lore-capi en L3), ou réserver L5 aux seuls binaires finaux.

[Incohérence inter-docs — PHILOSOPHY.md Règles 1-2 vs ARCHITECTURE.md §2] Autorisation permanente d'arêtes montantes via +chemin. PHILOSOPHY.md interdit toute dépendance vers le haut (Règle 1) hors dette temporaire ! avec ticket (Règle 2), tandis que ARCHITECTURE.md §2 autorise +chemin vers le haut (« exception assumée »), ouvrant la porte à des cycles inter-couches (L4 → L5 via + combiné à L5 → L4 implicite).Correction : Interdire + vers une couche supérieure (réserver + au déblocage d'un - descendant ou latéral) ; n'autoriser une arête montante que sous ! + ticket, avec détection de cycles sur le graphe global (pas uniquement latéral).

[Incohérence interne — ARCHITECTURE.md §4, §5 & §6] Règle identity.toml contredite par §4 et §5. §6 proscrit tout nom de produit en dur, mais :

identity.toml et src.lock.json manquent dans l'arborescence racine de §4 ;

§5 fige aphrody hors des manifestes réécrits par ay identity apply (aphrody_core.h, symboles C aphrody_grammar_*, variable APHRODY_GRAMMARS) ;

§5 écrit dans var/index/core.db alors que §4 classe var/ dans « À fondre ailleurs ».Correction : Ajouter identity.toml et src.lock.json à §4, neutraliser les identifiants C/env (core.h, core_grammar_*, SRC_GRAMMARS), et loger core.db sous XDG_CACHE_HOME / %LOCALAPPDATA%.

[Règle non applicable — PHILOSOPHY.md §2 vs ARCHITECTURE.md §5] Exécutable autonome bun build --compile vs bun:ffi (dlopen). Le chargeur dynamique de l'OS (dlopen / LoadLibrary) ne peut pas charger la cdylib core-capi depuis la mémoire interne d'un binaire compilé par Bun : la bibliothèque partagée doit exister sur le système de fichiers (extraction au lancement qui échoue sur un /tmp monté en noexec).Correction : Spécifier l'extraction de la cdylib vers un cache disque vérifié par BLAKE3, ou compiler le binaire multicall ay directement en Rust en liant crates/core statiquement.

[Règle non applicable — ARCHITECTURE.md §4, §5 & §6] Incompatibilité Cranelift / LTO LLVM / windows-msvc. §4 active cranelift en dev, §5 annonce la LTO inter-langages LLVM sur core-capi, et §6 impose windows-msvc. Or Cranelift court-circuite LLVM (incompatible avec -Clinker-plugin-lto et au support SEH windows-msvc limité), et la LTO ne s'applique qu'entre Rust et le C compilé dans core-capi (tree-sitter), jamais à travers bun:ffi.Correction : Limiter Cranelift au profil dev sur linux-gnu hors cdylib, préciser que la LTO vise rustc + clang en release à l'intérieur de core-capi, et trancher clang-cl vs cl.exe sur Windows.

[Lacune critique — ARCHITECTURE.md §2 & §3] Angles morts de checkdeps.ts et just test-affected (FFI, Python, dev-dependencies). En ne lisant que Cargo.toml et package.json :

modifier crates/core ou crates/core-capi ne déclenche pas bun test sur packages/core dans just test-affected (brisant la garantie sans régression) ;

la pile Python (agent/pyproject.toml, pyo3 agent-py, pytest, uv.lock absent de §4) échappe totalement à checkdeps et test-affected (noter aussi vpython en L3 alors que uv est imposé en §6 de PHILOSOPHY.md) ;

les [dev-dependencies] et [build-dependencies] ne sont pas distinguées : utiliser bench, conformance ou xtask (L3) pour tester/construire L1 ou L2 provoquera une erreur montante ou un cycle.Correction : Déclarer les arêtes FFI/pyo3 dans DEPS.rules, parser pyproject.toml, ajouter uv run pytest à test-affected, et exclure ou typer séparément les dev-dependencies dans checkdeps.

[Lacune CI — PHILOSOPHY.md §2-3 vs ARCHITECTURE.md §3] just check ne garantit ni la compilation Rust ni le typage TypeScript. Bun exécute TypeScript en effaçant les types sans les vérifier, et just check (bun fmt --check, checkdeps, archguard) omet cargo fmt --check, cargo check/clippy, le typecheck TS et ay identity check. Un commit peut passer just check sans compiler, contredisant la règle de bisectabilité du noyau Linux (PHILOSOPHY.md §3).Correction : Inclure cargo fmt --check, cargo check --workspace --all-targets, tsc --noEmit (ou tsgo) et ay identity check dans just check.

[Lacune d'isolation — ARCHITECTURE.md §1, §2 & §8 (checkdeps-002)] Supprimer ARCH-017 détruit le cloisonnement horizontal entre domaines. Comme toute arête descendante est permise par défaut, retirer ARCH-017 autorise un service backend L3 (lore, depot) à importer dx12-winui-core ou steam-depot (L2), et agent (L4) à importer next ou react (L3).Correction : Traduire les frontières de domaines d'ARCH-017 en règles - dans DEPS.rules avant de supprimer ARCH-017, et sortir next/react/ui du socle L3 partagé avec les services système.

[Incohérence VCS / Workspace — ARCHITECTURE.md §2, §4, §7 & §8] Superposition de quatre mécanismes d'épinglage et statut flou de apps/_. Le dépôt cumule .lore/, DEPS (gclient, SHA-1 de 40 caractères), src.lock.json, des sous-modules (agent/) et vendored-sources, tout en exigeant un « workspace Cargo unique » (§4) alors que apps/_ sont des dépôts externes dont checkdeps « ne contrôle que la racine » (§4) — ce que contredit le ticket checkdeps-003 qui traque un cycle interne rg-db ↔ rg-types dans apps/rosegriffon.Correction : Fusionner DEPS et src.lock.json en une seule source d'épinglage, documenter [workspace] exclude pour apps/* et third_party/, ajouter uv.lock à §4, et clarifier si checkdeps inspecte ou non l'intérieur de apps/*.

[Lacune protocole — ARCHITECTURE.md §5] Vérification de core_abi_version() non imposée avant liaison des symboles. Incrémenter core_abi_version() lors d'une rupture d'ABI n'évite un crash dans bun:ffi que si @aphrody/core vérifie cette version avant de résoudre les autres symboles C.Correction : Imposer dans @aphrody/core une ouverture dlopen en deux étapes : résolution et assertion stricte sur core_abi_version() avant liaison du reste de la table FFI.

## Corrections appliquées

1. Turborepo : rejet justifié par le grain (package vs unité rustc), plus par un faux « JS seulement ».
2. bun : ligne « portage Rust » supprimée ; Rust natif présenté comme choix propre à src.
3. checkdeps : « adapté » (format maison, `layer` et `use` ajoutés), plus « tel quel ».
4. Couches : `sys`, `net`, `packages/{core,net,machine,runtime-adapter}` passés en L2 ; L1 = sans code OS ni service.
5. C ABI : `ffi`, `lore-capi` en L3 (couche du service exposé) ; directive `use` pour les arêtes bun:ffi/pyo3 (`packages/core` -> `core-capi`).
6. `+` ne peut plus lever une arête montante (script modifié) ; seul `!` + ticket ; cycles sur tout le graphe.
7. Racine : identity.toml, src.lock.json, uv.lock ajoutés ; apps/ exclus et non inspectés ; tickets identity-001, pin-001.
8. bun --compile + dlopen : distribution de la cdylib à côté ou extraite (BLAKE3) ; vérification `core_abi_version` en deux temps (abi-001).
9. Cranelift/LTO : LTO bornée à la cdylib, ticket toolchain-001.
10. `just check` : `cargo fmt --check` et `bun check -b` ajoutés ; compilation laissée à la CI (pas de build local).
11. ARCH-017 : retrait conditionné à la traduction des frontières de domaine en règles `-` (checkdeps-002).
12. Python : ticket checkdeps-004 ; dev-dependencies exemptées et documentées.

Non retenu : déplacer lore-_/depot-_/design-* hors de L1 en bloc (seules leurs primitives portables y restent ; les services sont déjà en L3).
