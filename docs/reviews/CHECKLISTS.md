# Listes de contrôle des revues

Défauts récurrents distillés des verdicts de `docs/reviews/` (gemini-_, judge-_, consistency-_, facts-_, vault-*, auto/), 2026-11-13. Une entrée = un défaut vu dans au moins deux verdicts, ou de gravité haute (sécurité, perte de données, injection). `ai-os review` injecte dans chaque revue les sections dont le sujet correspond aux fichiers revus (motifs `topics` de `packages/ai-os/config/review.json`) ; `ai-os review mine` recompte les notes des verdicts. Ajouter une entrée ici quand un défaut revient.

## bun-ts

- [ ] Toute recherche par clé venant de l'extérieur (nom d'outil, sous-commande, id de CLI) passe par `Object.hasOwn` ou une `Map`, jamais par `obj[k]` nu (`constructor`, `toString`) (sources: gemini-2026-11-13-ai-os.md, 9f5240b8f1f6.md)
- [ ] Aucun `parseArgs`, `throw` ou E/S au niveau du module : exporter `main(argv)` et l'appeler sous `if (import.meta.main)` (sources: 9f5240b8f1f6.md, ad0eca921e22.md, ae7bde973904.md, c8d7c8bf9698.md, dece87e0dadc.md)
- [ ] Toute écriture de config, d'état ou de secret se fait dans un fichier temporaire puis `rename`, avec `mode: 0o600` dès la création (pas de `chmod` après coup) (sources: gemini-2026-11-13-relay-oauth.md, ad0eca921e22.md, ae7bde973904.md, vault-2026-11-13-gemini.md, gemini-2026-11-13-fr2-cloudflare.md)
- [ ] Tout `Bun.spawn`/`spawnSync` d'une CLI externe a un `timeout` et contrôle `exitCode === 0` ; `Bun.serve` fixe `idleTimeout` explicitement (10 s par défaut) (sources: gemini-2026-11-13-ai-os.md, ad0eca921e22.md, gemini-2026-11-13-orch.md)
- [ ] Les nombres venant de l'utilisateur ou de l'env passent `Number.isFinite`, une borne `> 0`, et la chaîne vide est refusée (`Number("") === 0`) (sources: ae7bde973904.md, 9f5240b8f1f6.md, gemini-2026-11-13-orch.md, gemini-2026-11-13-ai-os.md, gemini-2026-11-12-agent-context-ts.md)
- [ ] Pas de `new RegExp(entrée)` sans échappement, pas de `LIKE '%x%'` sans `ESCAPE`, et `replace(re, () => s)` quand le texte de remplacement n'est pas fiable (`$&`, `$1`) (sources: gemini-2026-11-13-ai-os.md, gemini-2026-11-13-orch.md, 9f5240b8f1f6.md)
- [ ] `JSON.parse` est toujours sous `try/catch`, et une réponse HTTP 200 non JSON ou contenant `error` est rejetée, pas lue comme un texte vide (sources: gemini-2026-11-13-orch.md, gemini-2026-11-13-ai-os.md)
- [ ] SQLite : les filtres de scope ou de masque sont en SQL avant `LIMIT`, sur un index composite, avec `busy_timeout` ; une transaction couvre insertion + vérification + suppression, et aucun `substr()` ne neutralise l'index (sources: gemini-2026-11-12-agent-context-ts.md, gemini-2026-11-13-root-identity.md, 9f5240b8f1f6.md, ae7bde973904.md, ad0eca921e22.md)
- [ ] Les gros fichiers (`.jsonl`, transcripts) sont lus en flux après un filtre de taille et de type, jamais en entier par `.text()`, et sans zstd 19 sur un fichier entier en RAM (sources: 9f5240b8f1f6.md, 4fa51945a406.md, ae7bde973904.md, ad0eca921e22.md)
- [ ] Tests hermétiques : aucun `C:\`, aucune valeur propre au poste (version gn, OS), `Bun.write` attendu, `tmpdir` nettoyé, et `bun test` ne lance ni `cargo` ni `go` (sources: judge-2026-11-13-chromium-bun.md, judge-2026-11-13-env-kit.md, judge-2026-11-13-apps-aphrody.md, ad0eca921e22.md)
- [ ] `bun install --frozen-lockfile` en CI, et un diff de `bun.lock` ne contient que des workspaces liés au sujet du commit (sources: gemini-2026-11-13-npm-publish.md, judge-2026-11-13-apps-aphrody.md, 6797a38b56a8.md)

## rust

- [ ] `rust-toolchain.toml` épingle `nightly-AAAA-MM-JJ` (pas `nightly` nu), avec un `rust-version` du `Cargo.toml` cohérent avec le commentaire (sources: facts-2026-11-13.md, consistency-2026-11-13.md, gemini-2026-11-13-ay-migration.md, gemini-2026-11-13-unixwin.md)
- [ ] Aucun `cargo build/test --workspace` sur le PC ni sur fr1 hors Chromium/LLVM : Rust passe par `gh workflow run ci.yml` + `gh run watch --exit-status` (sources: judge-2026-11-13-justfile.md, judge-2026-11-13-env-kit.md, consistency-2026-11-13.md, gemini-2026-11-12-architecture-root.md)
- [ ] Les fonctions qui appellent git ou des E/S renvoient `Result` : aucune erreur de `git ls-files`/`readdir` avalée en liste vide (sources: gemini-2026-11-13-root-identity.md, vault-2026-11-13-gemini.md)
- [ ] `cfg(windows)` est réservé au code réellement Windows (Hyper-V, D3D12), et chaque branche `cfg` est testée par un job sur l'OS cible (sources: gemini-2026-11-13-root-identity.md, gemini-2026-11-13-unixwin.md)
- [ ] Un renommage de crate est prouvé par la compilation, pas par une recherche textuelle, et réécrit aussi les clés `x.workspace = true` et `x = {...}` (sources: gemini-2026-11-13-ay-migration.md, gemini-2026-11-13-root-identity.md)
- [ ] Pas de LTO inter-langages annoncée tant que la version LLVM de rustc et celle de clang diffèrent (sources: gemini-2026-11-13-ay-migration.md, facts-2026-11-13.md, gemini-2026-11-12-philosophy-architecture.md)
- [ ] Les crates internes sont en `MIT OR Apache-2.0`, chaque exception de licence est ciblée par crate dans `deny.toml`, un confinement est écrit `-crates/x` dans `DEPS.rules` (pas seulement en prose), et la CI vérifie que FFmpeg n'est pas `--enable-gpl` (sources: gemini-2026-11-13-merge.md, gemini-2026-11-13-root-identity.md, gemini-2026-11-12-philosophy-architecture.md)
- [ ] Les linkers et outils cités existent dans le dépôt (pas de `zig-cc` fantôme), et le linker passe par `CARGO_TARGET_<TRIPLE>_LINKER`, pas par un chemin absolu (sources: judge-2026-11-13-apps-aphrody.md, gemini-2026-11-13-terminal.md)
- [ ] Chaque crate de `apps/*` est couverte par `cargo test` + `clippy` dans un workflow (sources: judge-2026-11-13-apps-aphrody.md, gemini-2026-11-12-philosophy-architecture.md)

## shell-justfile

- [ ] Aucune interpolation `{{param}}` de texte libre dans une ligne shell : passer par un paramètre exporté `$var` ou par argv (sources: judge-2026-11-13-justfile.md, gemini-2026-11-13-terminal.md, gemini-2026-11-13-orch.md)
- [ ] Toute valeur envoyée dans `ssh` est filtrée par une regex de liste blanche (`error()` sinon) ou quotée par `sh_quote` avant l'appel (sources: judge-2026-11-13-justfile.md, vault-2026-11-13-gemini.md, gemini-2026-11-13-orch.md, gemini-2026-11-13-ay-migration.md)
- [ ] `set -o pipefail` est actif ; aucun `| head` ni `<(...)` ne masque l'échec ; aucun `a && b` sous `set -e` (utiliser `if`) ; `jq -er` plutôt que `jq -r` (sources: gemini-2026-11-13-fleet-resilience.md, gemini-2026-11-13-orch.md, gemini-2026-11-13-npm-publish.md, gemini-2026-11-13-terminal.md, vault-2026-11-13-gemini.md)
- [ ] Aucun `>/dev/null 2>&1` sur une étape d'installation : l'état est vérifié ensuite (timer `active`, outils présents) (sources: vault-2026-11-13-gemini.md, judge-2026-11-13-ci.md)
- [ ] Les scripts concurrents prennent `flock` sur tout le script ; les échanges de dossiers se font par `mv -T` ; un verrou périmé n'est repris que si le PID détenteur est mort (sources: vault-2026-11-13-gemini.md, gemini-2026-11-13-terminal.md, gemini-2026-11-13-unixwin.md, gemini-2026-11-13-agent-first.md)
- [ ] Après un checkout : commit exact (pas de HEAD flottant), `git status --porcelain --untracked-files=no` vide, `git clean` (sources: gemini-2026-11-13-terminal.md, gemini-2026-11-13-unixwin.md)
- [ ] Toute suppression ou purge passe par une vérification préalable (blob relu, octets comparés) ; la purge n'a lieu qu'après un backup valide et garde les N plus récents ; une restauration n'écrase pas `/usr`, `passwd` ni `shadow` (sources: gemini-2026-11-13-fleet-resilience.md, 9f5240b8f1f6.md, ae7bde973904.md)
- [ ] Un remplacement de binaire se fait par copie en `*.new`, contrôle sha256, puis renommage avec restauration ; l'ancien fichier prend un nom unique `*.old-<horodatage>` (sources: gemini-2026-11-13-unixwin.md, vault-2026-11-13-gemini.md)
- [ ] `gh workflow run` est toujours suivi de `gh run watch --exit-status` (sources: gemini-2026-11-13-upstream-stack.md, judge-2026-11-13-justfile.md)
- [ ] Chaque recette ne cite que des paquets, chemins et liens existants (pas de recette fantôme ni morte) (sources: judge-2026-11-13-justfile.md, consistency-2026-11-13.md)

## ci

- [ ] `cancel-in-progress: ${{ github.event_name == 'pull_request' }}` : jamais d'annulation sur main (sources: judge-2026-11-13-ci.md, gemini-2026-11-13-agent-first.md)
- [ ] `runs-on: ubuntu-latest` ; fr1 seulement pour Chromium/LLVM, ni prd ni fr2 ; une étape du judge refuse tout autre `runs-on` fr1 (sources: judge-2026-11-13-ci.md, consistency-2026-11-13.md, judge-2026-11-13-justfile.md)
- [ ] Une étape par suite de tests avec `if: ${{ !cancelled() }}` : le premier paquet rouge ne masque pas les suivants (sources: judge-2026-11-13-ci.md)
- [ ] Toutes les actions sont épinglées par SHA, avec la même version dans tous les workflows (`checkout`, bun épinglé), et les plugins de marketplace ont un `ref`/`sha` (sources: gemini-2026-11-13-npm-publish.md, gemini-2026-11-13-upstream-stack.md, judge-2026-11-13-ci.md, 6797a38b56a8.md)
- [ ] Chaque paquet qui a des tests a `bun check` + `bun test` dans un workflow ; un typecheck rouge bloque (sources: judge-2026-11-13-chromium-bun.md, judge-2026-11-13-apps-aphrody.md, judge-2026-11-13-env-kit.md)
- [ ] La porte rapide lance `cargo metadata --locked --no-deps`, pour détecter les commits partiels (Cargo.toml absent) (sources: judge-2026-11-13-ci.md)
- [ ] `gh run list` montre au moins un succès du workflow, et `ci-revert`/LKGR a déjà été déclenché réellement (sources: judge-2026-11-13-ci.md, gemini-2026-11-13-agent-first.md)
- [ ] Entrées de workflow validées : chemins (absolu, `..`, `package.json` absent), dist-tag `^[a-z][a-z0-9._-]*$` ; `npm view` ne continue que sur E404 (sources: gemini-2026-11-13-npm-publish.md)
- [ ] Une étape refuse un JSON de config qui commence par le BOM `EF BB BF` (sources: 57a7ba24017c.md, 8a56fe8bd140.md)

## infra-fleet

- [ ] Les rôles cités suivent `deploy.toml` : fr1 = builds Chromium/LLVM, fr2 = proxy/CDN, prd = production (sources: judge-2026-11-13-chromium-bun.md, judge-2026-11-13-ci.md, consistency-2026-11-13.md, gemini-2026-11-13-upstream-stack.md)
- [ ] Aucune compilation ni test lourd sur le PC (sources: consistency-2026-11-13.md, judge-2026-11-13-justfile.md, judge-2026-11-13-env-kit.md, gemini-2026-11-12-architecture-root.md)
- [ ] Les runners d'agents tournent sous l'utilisateur `agent` sans sudo (`runuser`), jamais en root et jamais avec `IS_SANDBOX=1` (sources: gemini-2026-11-13-agent-first.md, gemini-2026-11-13-aphrody-nhitl.md, gemini-2026-11-13-upstream-stack.md)
- [ ] Les unités ont `MemoryHigh`/`MemoryMax`, `Nice`/`ionice`/`taskset` sur tout l'arbre, et un exit 137/143 donne `killed`, pas une relance (sources: gemini-2026-11-13-agent-first.md, gemini-2026-11-13-terminal.md, gemini-2026-11-13-unixwin.md)
- [ ] Timers : `Persistent=true` et `OnBootSec=`, service `enable` au boot ; en mode `--user` : linger et `XDG_RUNTIME_DIR` (sources: gemini-2026-11-13-fr2-cloudflare.md, vault-2026-11-13-gemini.md, gemini-2026-11-13-upstream.md)
- [ ] Chaque retour arrière est une commande exécutée et vérifiée (unité `active` N s après le restart, sinon `reset` sur l'ancien commit), pas un `sed` qui sort en 0 sans rien changer (sources: gemini-2026-11-13-fleet-resilience.md, gemini-2026-11-12-cloudflare-one.md, gemini-2026-11-13-fr2-cloudflare.md, gemini-2026-11-13-upstream-stack.md)
- [ ] Les épingles sont des commits de tags résolus par `git/ref/tags` (tags annotés déréférencés), et `src.lock.json` est réellement appliqué sur l'hôte (sources: gemini-2026-11-13-upstream-stack.md, gemini-2026-11-13-terminal.md, facts-2026-11-13.md)
- [ ] L'ingress vise un port local stable, pas `green_port` ; `compose up --wait` n'est pas présenté comme un blue/green (sources: gemini-2026-11-13-fr2-cloudflare.md, gemini-2026-11-13-upstream-stack.md)
- [ ] Les échecs de heal, de sync ou de tâche planifiée écrivent `state/last-error.json` et alertent un canal défini (sources: gemini-2026-11-13-fleet-resilience.md, vault-2026-11-13-gemini.md, gemini-2026-11-13-agent-first.md)
- [ ] Un checkout partagé n'a qu'un `git pull` et qu'une tâche éditrice à la fois (verrou `checkout.lock`) (sources: gemini-2026-11-13-agent-first.md, gemini-2026-11-13-orch.md)
- [ ] `deploy.toml` et les configs d'hôte ne contiennent aucun chemin `C:/` (sources: judge-2026-11-13-apps-aphrody.md, consistency-2026-11-13.md)

## cloudflare

- [ ] Le filtrage d'origine couvre IPv4 et IPv6, TCP et UDP 443, et `proof.ts` sonde aussi l'adresse v6 (sources: gemini-2026-11-13-fr2-cloudflare.md)
- [ ] Jamais `tcp dport 22` dans les plages Cloudflare : cloudflared joint sshd en local (sources: gemini-2026-11-13-fr2-cloudflare.md)
- [ ] admin, console et control sont derrière une app Access avant toute exposition ; aucun hôte de test public sans Access (sources: gemini-2026-11-13-fr2-cloudflare.md, gemini-2026-11-12-cloudflare-one.md)
- [ ] Custom AOP propre à la zone (pas l'AOP partagé), avec SNI == Host vérifié (sources: gemini-2026-11-13-fr2-cloudflare.md)
- [ ] Ingress tunnel direct vers prd : aucun aller-retour CF vers fr2 vers CF, aucun vhost de repli rebouclé vers Cloudflare (sources: gemini-2026-11-12-cloudflare-one.md, gemini-2026-11-13-fr2-cloudflare.md)
- [ ] Le SSH navigateur exige `TrustedUserCAKeys` dans sshd ; WARP retire 10.0.0.0/8 du split tunnel (sources: gemini-2026-11-12-cloudflare-one.md, gemini-2026-11-13-fr2-cloudflare.md)
- [ ] Un jeton de service par hôte et par sens ; les clients daemon/CLI utilisent un Service Token, pas une redirection 302 interactive (sources: gemini-2026-11-13-fr2-cloudflare.md, gemini-2026-11-12-cloudflare-one.md)
- [ ] Le jeton de tunnel passe par `--token-file %d/...` (jamais `--token` en argv), et cloudflared vient du paquet APT (sources: gemini-2026-11-13-fr2-cloudflare.md, gemini-2026-11-12-cloudflare-one.md)
- [ ] `cf.ts` sort en code 1 si `CLOUDFLARE_API_TOKEN` est défini mais invalide, sans repli silencieux vers OAuth (sources: gemini-2026-11-13-fr2-cloudflare.md)
- [ ] La preuve fige le code HTTP attendu par hôte (aucun 502 toléré) et inclut un test négatif hors flotte ; un `curl` à vide ne vaut pas validation (sources: gemini-2026-11-13-fr2-cloudflare.md, gemini-2026-11-12-cloudflare-one.md)
- [ ] `wrangler.toml` ne mélange pas `pages_build_output_dir` et `[assets]` ; wrangler est appelé à une version épinglée (sources: judge-2026-11-13-apps-aphrody.md, facts-2026-11-13.md)

## security

- [ ] SSRF : DNS en échec = refus, IPv6 qui encapsule de l'IPv4 refusée (`::ffff:`, `64:ff9b::`, `2002::`, Teredo), redirections manuelles revalidées à chaque saut, taille plafonnée (sources: judge-2026-11-13-chromium-bun.md, gemini-2026-11-13-relay-oauth.md)
- [ ] Jetons et cookies comparés par `timingSafeEqual` ; le cookie contient un HMAC du jeton, pas le jeton (sources: gemini-2026-11-13-relay-oauth.md, gemini-2026-11-13-ai-os.md)
- [ ] Chaque route HTTP, webhooks compris, exige l'authentification ; un POST d'état exige `Sec-Fetch-Site: same-origin` ou un `Origin` identique (sources: gemini-2026-11-13-ai-os.md, gemini-2026-11-13-relay-oauth.md)
- [ ] Aucun secret en argv ni dans l'historique du shell (`ps`, `/proc/<pid>/cmdline`) : passer par stdin, un fichier ou l'env (sources: gemini-2026-11-13-fr2-cloudflare.md, gemini-2026-11-13-ai-os.md, 6797a38b56a8.md)
- [ ] Confinement de chemin : `relative(resolve(root), out)` refusé s'il commence par `..` ou si `isAbsolute`, comparaison en minuscules sous win32 ; `cwd` des outils confiné (sources: 9f5240b8f1f6.md, ad0eca921e22.md, ae7bde973904.md, gemini-2026-11-13-ai-os.md, gemini-2026-11-13-npm-publish.md)
- [ ] Les secrets sont retirés avant stockage, avant envoi à un embedder distant et avant copie vers une autre CLI (CLAUDE.md vers GEMINI.md) (sources: gemini-2026-11-12-agent-context-ts.md, gemini-2026-11-12-agent-architecture-fusion.md, 9f5240b8f1f6.md)
- [ ] Les chemins de sécurité échouent fermés : une erreur hors ENOENT lève une exception, ni liste vide ni révocation totale (sources: vault-2026-11-13-gemini.md, judge-2026-11-13-chromium-bun.md, judge-2026-11-13-aphrody-nhitl.md)
- [ ] Les titres et sources injectés dans un prompt sont débarrassés de `\r`, `\n` et `#` en tête (sources: gemini-2026-11-12-agent-context-ts.md)
- [ ] Réception d'archive : MANIFEST avec `seq` monotone (anti-rejeu), MANIFEST vide refusé, liens symboliques et physiques refusés dans le tar (sources: vault-2026-11-13-gemini.md)
- [ ] Aucune identité, adresse mail, IP publique ou UUID dans un dépôt public : config non suivie + `*.example` anonymisé (sources: judge-2026-11-13-env-kit.md, gemini-2026-11-12-cloudflare-one.md, 6797a38b56a8.md)
- [ ] Redirections OAuth avec fragment refusées ; en-tête JWT (`alg`, `typ`) vérifié ; tirage par rejet pour les codes (pas de biais de modulo) (sources: gemini-2026-11-13-relay-oauth.md)

## nhitl-agents

- [ ] Le filtre de commandes est présenté comme garde-fou, pas comme frontière ; la frontière OS (WSL2 sandbox, compte dédié + Job Object) est un chantier suivi (sources: judge-2026-11-13-aphrody-nhitl.md, gemini-2026-11-13-aphrody-nhitl.md, gemini-2026-11-13-nhitl.md)
- [ ] Normaliser avant de comparer : verbe dé-échappé (`r\m`), jokers sur les noms de secrets (`.e?v`), variables expansées, préfixes `busybox`/`toybox`, pipe ou here-string vers un shell, `-EncodedCommand` décodé puis réanalysé (sources: judge-2026-11-13-aphrody-nhitl.md, gemini-2026-11-13-nhitl.md, gemini-2026-11-13-aphrody-nhitl.md)
- [ ] Hook PreToolUse des shells en `block` avec un délai borné ; un fail-open éventuel est explicite et documenté (sources: judge-2026-11-13-aphrody-nhitl.md, gemini-2026-11-13-aphrody-nhitl.md, 57a7ba24017c.md)
- [ ] `hooks.json` en UTF-8 sans BOM, chemin relatif, noms d'outils tirés d'un payload réellement capturé, avec un test de refus (sources: 57a7ba24017c.md, 8a56fe8bd140.md, 4fa51945a406.md)
- [ ] Les modes sans permission (`bypassPermissions`, `always-proceed`, `yolo`) ne s'écrivent que derrière un drapeau explicite ; ne jamais écraser `disableYoloMode: true` ; documenter la commande de retour arrière (sources: 9f5240b8f1f6.md, ae7bde973904.md, 8a56fe8bd140.md, c8d7c8bf9698.md, 4fa51945a406.md)
- [ ] Les lanceurs sont en `bun --no-env-file` : le `.env` du checkout ne passe pas au processus enfant (`ANTHROPIC_API_KEY`) (sources: gemini-2026-11-13-aphrody-nhitl.md, judge-2026-11-13-env-kit.md)
- [ ] Aucun modèle en dur (`--model`, `claude/default` par défaut pour un agent outillé) : découverte à l'exécution (sources: consistency-2026-11-13.md, gemini-2026-11-13-ai-os.md)
- [ ] Erreurs classées sur un statut structuré (stderr, JSON), pas sur le texte de l'agent ; quota et limite de débit distingués ; `Retry-After` en date géré ; refroidissement par modèle (sources: gemini-2026-11-13-orch.md, gemini-2026-11-13-agent-first.md)
- [ ] Un rôle éditeur sans CLI finit `failed` (jamais `done` sans diff) ; une étape sautée n'est jamais un succès (sources: gemini-2026-11-13-agent-first.md, gemini-2026-11-13-orch.md)
- [ ] Un livrable sans verdict archivé porte « Statut : non validé, dernier score N/20 » en tête (sources: 8a56fe8bd140.md, c8d7c8bf9698.md, dece87e0dadc.md, ae7bde973904.md)
- [ ] Commit atomique : le diff ne contient que le sujet du message, et le message ne revendique ni correctif ni preuve absents du diff (sources: 6797a38b56a8.md, ae7bde973904.md, 57a7ba24017c.md, 9f5240b8f1f6.md, judge-2026-11-13-ci.md)

## docs-facts

- [ ] Chaque version, date ou SHA est revérifiée sur une source live (`gh api`, registre) et datée (sources: facts-2026-11-13.md, 4fa51945a406.md, 6797a38b56a8.md, gemini-2026-11-12-editors-agents-matrix.md)
- [ ] Recompter les décomptes et les sommes (CNAME, totaux avant/après) (sources: gemini-2026-11-13-fr2-cloudflare.md, gemini-2026-11-12-architecture-root.md, 8a56fe8bd140.md, c8d7c8bf9698.md)
- [ ] Aucun chemin absolu (`C:\src`, `C:/Users/...`, `file:///`) dans les docs, skills et configs : chemins relatifs à la racine (sources: consistency-2026-11-13.md, facts-2026-11-13.md, judge-2026-11-13-apps-aphrody.md, judge-2026-11-13-env-kit.md, gemini-2026-11-12-cloudflare-one.md, 57a7ba24017c.md)
- [ ] Les listes de paquets, crates et chemins correspondent à `ls` / `git ls-files` (aucun paquet fusionné ou fantôme) (sources: consistency-2026-11-13.md, facts-2026-11-13.md, gemini-2026-11-12-ecosystem-toml.md, gemini-2026-11-13-merge.md, 6797a38b56a8.md)
- [ ] Les docs sœurs ne se contredisent pas (couche L1/L2, §x contre §y, ARCHITECTURE contre FUSION) (sources: gemini-2026-11-12-agent-architecture-fusion.md, gemini-2026-11-13-merge.md, gemini-2026-11-12-targets.md, consistency-2026-11-13.md)
- [ ] L'état cible et l'état déployé sont séparés (« fait » contre « planifié », « objectif non réalisé ») (sources: gemini-2026-11-13-upstream-stack.md, gemini-2026-11-13-fr2-cloudflare.md, facts-2026-11-13.md)
- [ ] Chaque « corrigé » ou « preuve consignée » renvoie à un code, un test ou une sortie brute présents dans le dépôt (commande, code de sortie, hash) (sources: 57a7ba24017c.md, ad0eca921e22.md, 8a56fe8bd140.md, ae7bde973904.md)
- [ ] Aucun temps relatif (« dans les 15 dernières minutes ») : horodatage absolu (sources: 8a56fe8bd140.md, c8d7c8bf9698.md)
- [ ] Les hypothèses (« likely », « unverified ») vont dans une section « À confirmer » et ne sont jamais citées comme faits (sources: 4fa51945a406.md, dece87e0dadc.md, 6797a38b56a8.md)
- [ ] Le document est entièrement en français, titre compris (sources: gemini-2026-11-13-merge.md, gemini-2026-11-13-root-identity.md, 8a56fe8bd140.md)
- [ ] Chercher U+200B, U+00A0 et les caractères de contrôle sur le fichier brut avant de conclure (grief souvent réfuté, voir INDEX) (sources: gemini-2026-11-12-architecture-root.md, gemini-2026-11-12-cloudflare-one.md, gemini-2026-11-12-editors-agents-matrix.md, gemini-2026-11-13-fr2-cloudflare.md)
- [ ] La revue porte sur le fichier brut complet ou le diff complet, pas sur un résumé tronqué ou des extraits (sources: INDEX.md, gemini-2026-11-13-ay-migration.md, gemini-2026-11-13-unixwin.md)

## chromium-google

- [ ] La version Stable de Chromium, `CLANG_REVISION` et `RUST_REVISION` sont relevées sur chromiumdash et le tag, à la date du document (sources: facts-2026-11-13.md, gemini-2026-11-12-targets.md)
- [ ] Le support d'une cible LLVM se prouve par un build et un link, pas par la présence dans `Triple.h` ; les backends expérimentaux sont séparés (sources: gemini-2026-11-12-targets.md, INDEX.md)
- [ ] Deux toolchains (LLVM de Chromium contre LLVM de rustc) sont déclarées comme telles, sans promesse de toolchain unique (sources: facts-2026-11-13.md, gemini-2026-11-13-ay-migration.md)
- [ ] Les forks sont dans aphrody-labs (pas aphrody-dev), chaque entrée vérifiée par `gh api` (404 = retirer) (sources: judge-2026-11-13-chromium-bun.md, consistency-2026-11-13.md)
- [ ] La voie CDP `navigate` du crawler intercepte les requêtes (`Fetch.requestPaused`), sinon la garde SSRF ne la couvre pas (sources: judge-2026-11-13-chromium-bun.md)
- [ ] Les en-têtes de bench (matériel, OS) sont mesurés au tir, pas constants ; pas de mesure `--version` à travers un shim `.cmd` (sources: judge-2026-11-13-chromium-bun.md, gemini-2026-11-12-editors-agents-matrix.md)
- [ ] agy n'écrit que dans `~/.gemini/config/` (le legacy `antigravity-cli/` est signalé ou purgé) ; `trustedWorkspaces` normalisé (`resolve` + minuscules) avant dédoublonnage (sources: 4fa51945a406.md, 57a7ba24017c.md, 8a56fe8bd140.md)
- [ ] Chaque passe consigne le modèle et le canal exacts (moteur, modèle, conversation) ; une passe sans moteur identifié ne vaut pas validation (sources: c8d7c8bf9698.md, dece87e0dadc.md, judge-2026-11-13-apps-aphrody.md, gemini-2026-11-13-relay-oauth.md)
