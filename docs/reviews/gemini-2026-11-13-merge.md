# Revue Gemini 4 Carbon High : fusion labs/nt/tv (2026-11-13)

Chat : https://gemini.google.com/app/8325bf746a99c899. Entrée : docs/ARCHITECTURE.md §1-§8 et §11 (état 486b2f0) + arbre fd -d 2 et fichiers racine. Note : **12,5/20**.

## Suites données

- Appliqué : crates/tv-* repassées en MIT OR Apache-2.0 (FFmpeg lié dynamiquement, LGPL-2.1 §6) ; deny.toml n'autorise WTFPL que pour ffmpeg-next/ffmpeg-sys-next ; `-crates/tv-ffmpeg` dans crates/DEPS.rules, relevé par `+` dans crates/tv-cli ; §5 packages/core en L2 ; browser/ retiré de §1 (absorbé dans infra/chromium-factory).
- Réfuté : « .env suivi dans le dépôt public » : .env, attention_is_all_you_need_full_llm_markdown.md et .claude/worktrees sont locaux et ignorés (`git ls-files` vide).
- TODO (hors périmètre de la fusion, autres propriétaires) : identity.toml absent ; fichiers « à fondre » de la racine ; doublons corelib/core, aphrody-cli/ay, lore-error-set vs thiserror, depot-vpython vs uv ; tools/ et infra/ à aplatir ; arêtes apps/nt et Python dans checkdeps ; pin-001 ; franciser §11-§12 ; vérification CI de la config FFmpeg (sans --enable-gpl/nonfree).

## Verdict brut

Gemini said
1. Note : 12,5 / 20

L'ossature cible est solide (modèle L0–L5 inspiré de NT/Chromium, checkdeps avec directive use pour dlopen, séparation C ABI L2/L3 avec versionnage core_abi_version, deny.toml et suites de conformité hors arbre). En revanche, la triple fusion du 2026-11-13 laisse passer une erreur juridique majeure de licence LGPL en couche L1, une racine de dépôt public polluée (dont un .env), des doublons directs de l'amont et plusieurs contradictions frontales entre docs/ARCHITECTURE.md et l'arbre réel.

2. Défauts concrets

Contresens juridique LGPL-2.1 sur crates/tv-* et contamination de L1 (§1 et §11) :

Licencier les crates internes tv-core, tv-i18n, tv-ffmpeg et tv-cli en LGPL-2.1-or-later parce que tv-ffmpeg lie dynamiquement libav* est une erreur : la LGPL-2.1 (§6) autorise expressément le code appelant lié dynamiquement à rester sous MIT OR Apache-2.0. Passer tv-core et tv-i18n en LGPL-2.1+ viole la licence du dépôt et introduit du copyleft en L1 base, où toute crate L1–L5 peut les lier statiquement (rlib) sans blocage par défaut de checkdeps.

§11 mentionne ffmpeg-next (WTFPL) alors que WTFPL est absente de Allowed dependency licenses.

Aucune vérification CI ne garantit que les binaires FFmpeg (infra/vcpkg ou système) sont compilés sans --enable-gpl ni --enable-nonfree.

L'isolation « seuls tv-* peuvent dépendre de tv-ffmpeg » n'est décrite qu'en prose en §11 : sans -crates/tv-ffmpeg dans /DEPS.rules, tout L2–L5 peut dépendre de tv-ffmpeg.

Fuite et désordre à la racine d'un monorepo public (## Fichiers racine vs §4 et §6) :

Présence d'un fichier .env à la racine d'un dépôt public, d'un dump hors-sujet attention_is_all_you_need_full_llm_markdown.md et de .claude/worktrees (état de travail local).

identity.toml, présenté en §4 et §6 comme la source unique du renommage automatisé, est absent de la racine.

Les 12 fichiers marqués « À fondre ailleurs » en §4 sont toujours à la racine, accompagnés de 3 systèmes CI concurrents (.github/workflows, cloudbuild.yaml, .gitlab-ci.yml), de 4 mécanismes de manifestes externes (src.lock.json, DEPS, .gitmodules, .repo/manifests) et de 4 dossiers de scripts (scripts/, .agents/scripts, infra/scripts, tools/labs-scripts), en violation directe de §6 (remplacement des .sh/.ps1 par just).

Contradictions internes dans docs/ARCHITECTURE.md :

packages/core en L2 vs L1 : placé en L2 dans §1 et §2, mais toujours marqué (@aphrody/core, L1) dans le tableau de §5 (ce qui constituerait une arête montante interdite L1 → L2 vers crates/core-capi).

Patchs third_party/ : §4 stipule third_party/ = upstream ... sans patch local, tandis que §11 autorise third_party/patches/ et que docs/patches figure dans l'arbre.

Collage brut depuis C:\labs et cibles fantômes : §1 référence browser/ en L5 (inexistant dans l'arbre), et §11 reste rédigé en anglais au milieu d'une spécification en français tout en citant repos.tsv et un jalon M0 absents de la racine.

Violations des règles « pas de doublon de l'amont », « rien de legacy » et « layout plat » :

Doublons et legacy : lore-error-set et lore-error-set-macro en L1 dupliquent thiserror / la crate amont error_set ; depot-vpython réimplémente le wrapper Python legacy de Chromium alors que le dépôt a standardisé uv (§4) ; crates/core et crates/corelib coexistent en L1 sans partage des rôles documenté en §5.

Éparpillement hors crates/* et packages/* : logique dédoublée entre crates/factory, tools/factory et infra/chromium-factory, entre crates/lore* et tools/lore, entre crates/bench et tools/bench-mcp, et entre crates/ffi, infra/ffi-bridge et infra/cshared (en plus de plugins/labs et du sous-arbre agent/crates + agent/packages).

Identité en dur et doublons de surfaces : coexistence de crates/ay et crates/aphrody-cli, de apps/aphrody, apps/aphrody-app et apps/yolo, de 8 crates préfixées aphrody-* (contraire à §6), et de crates aux noms ultra-génériques (core, sys, net, rt, ffi, ui, next, react) sujets aux collisions de résolution Cargo.

Pollution de L1/L2 et angle mort de checkdeps sur apps/nt :

L2 fourre-tout : dx12-winui-core couple du HAL graphique (DirectX 12, L2) avec un framework UI applicatif (WinUI 3, L3/L5) ; unix-cachyos, unix-omarchy, unix-distro et steam-depot relèvent de profils d'OS ou de services tiers (L3/L5) et non du HAL. En L1, tv-i18n embarque un préfixe métier tv dans //base.

Coupure du graphe d'impact vers apps/nt : apps/nt (WinUI 3 / .NET 11 / C++23 / Bun) est exclu du workspace Cargo et checkdeps n'analyse ni .csproj ni CMake/vcpkg ni l'intérieur de apps/*. Sans directives use exhaustives dans /DEPS.rules, modifier crates/dx12-winui-core ou infra/winnt-sdk ne déclenche pas apps/nt dans just affected / just test-affected.

3. Corrections prioritaires

Nettoyer la racine publique immédiatement : retirer .env du suivi Git (et révoquer les clés exposées le cas échéant), supprimer attention_is_all_you_need_full_llm_markdown.md, .claude/worktrees et .repo/, créer identity.toml, et déplacer Dockerfile, compose.yaml, cloudbuild.yaml, .gitlab-ci.yml, flake.nix, *.ps1, *.sh et les *.toml d'outillage dans infra/.

Rectifier la licence et le cloisonnement de tv-* : repasser crates/tv-* sous MIT OR Apache-2.0, déclarer WTFPL uniquement en exception ciblée pour ffmpeg-next/ffmpeg-sys-next dans deny.toml, vérifier en CI que avutil_configuration() ne contient ni --enable-gpl ni --enable-nonfree, et ajouter -crates/tv-ffmpeg dans /DEPS.rules (relevé par +crates/tv-ffmpeg dans les seuls consommateurs autorisés).

Supprimer les doublons L1/CLI et le legacy : fusionner crates/corelib dans crates/core, remplacer lore-error-set(-macro) par thiserror, supprimer crates/depot-vpython au profit de uv, et absorber crates/aphrody-cli dans crates/ay.

Corriger le découpage L1/L2 : scinder dx12-winui-core en primitive GPU L2 (dx12-hal) et hôte WinUI 3 L3/L5, remonter unix-cachyos, unix-omarchy, unix-distro et steam-depot en L3, et extraire les ressources métier de tv-i18n hors de L1 (en s'appuyant sur icu4x ou fluent sans moteur maison).

Aplatir tools/, plugins/ et infra/ dans les workspaces : rapatrier tout le code compilé/TS de tools/{factory,lore,bench-mcp}, infra/{ffi-bridge,cshared,cmd,internal} et plugins/labs vers crates/* et packages/*, pour ne garder dans tools/ et infra/ que les pins binaires L0 et la configuration déclarative.

Câbler apps/nt et Python dans checkdeps et just test-affected : déclarer dans /DEPS.rules toutes les arêtes apps/nt: use ... (crates/dx12-*, infra/winnt-sdk, infra/vcpkg, packages/*) et étendre scripts/checkdeps.ts + just test-affected à pyproject.toml (uv run pytest) ainsi qu'au déclenchement des tests .NET 11/C++23 de apps/nt.

Unifier les manifestes externes (pin-001) et trancher la politique de patchs : faire de src.lock.json l'unique source générant DEPS et .gitmodules (ay manifests --check en gate CI), et aligner §4 sur §11 en interdisant toute modification directe sous third_party/ hors patchs Cargo/vcpkg tracés dans third_party/patches/ (zéro MPL-2.0).

Mettre docs/ARCHITECTURE.md en cohérence stricte : corriger packages/core en L2 dans §5, retirer browser/ de §1 (ou créer le dossier correspondant), franciser §11–§12 et purger les références orphelines (repos.tsv,
