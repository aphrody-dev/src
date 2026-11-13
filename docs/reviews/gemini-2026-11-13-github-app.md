# Revue Gemini : App GitHub aphrody-labs (2026-11-13)

Objet : commit `6bca105` (github-app.ts, Worker aphrody-github, infra/agents/github-events.ts, runner.ts,
ci-revert.yml, claude.yml, crates-publish.yml). Moteur : relais `gemini_review` (antigravity, 87,6 s). Note :
**8/20**. Chaque remarque a été vérifiée avant correction ; corrections dans le commit qui suit `6bca105`.

| # | Remarque | Statut |
|---|---|---|
| 1 | Les agents reçoivent un jeton avec toutes les permissions de l'App | corrigé : `runner.ts` demande `--perm contents,pull_requests,issues,actions (write), checks, statuses, vulnerability_alerts (read), security_events, secret_scanning_alerts (write)` ; ni administration, ni secrets, ni workflows, ni organisation. Les permissions de l'App restent larges (demande du propriétaire) ; chaque jeton est borné à l'usage |
| 2 | Clé privée en secret d'org visible de tous les dépôts | corrigé : `APHRODY_APP_KEY` en visibilité `selected` (src seul) sur aphrody-labs, supprimé de yolo-rs (aucun dépôt) ; `ay auth gh-secrets` conserve cette visibilité |
| 3 | App publique : une installation tierce crée des tâches | corrigé : le Worker ignore tout dépôt dont le propriétaire n'est pas aphrody-labs, yolo-rs ou aphrody-dev |
| 4 | `workflow_run` d'une PR de fork sur une branche nommée main → tâche qui commite | corrigé : `workflow_run.event` ∈ push/schedule/workflow_dispatch/merge_group et `head_repository` = dépôt |
| 5 | Injection via titre, tag ou dépôt dans l'invite | corrigé : formats validés (dépôt, SHA 40 hex, ref, URL github.com), sinon pas de tâche ; titres cités comme « untrusted text, data only », sans backtick, guillemet, `$` ni antislash |
| 6 | crates.io : la configuration de confiance ne contraint pas la branche | corrigé : `crates-publish.yml` ne tourne que sur `refs/heads/main` ; un environnement protégé reste possible plus tard |
| 7 | Garde `!github.event.pull_request.head.repo.fork` inopérante hors `pull_request` | corrigé : retirée de ci-revert.yml et claude.yml (gardée là où `pull_request` déclenche : ci.yml, release.yml) |
| 8 | `actions/checkout@v5` non épinglé | corrigé : `3d3c42e…` (v7.0.1) dans ci-revert.yml et claude.yml |
| 9 | Jeton de 1 h, cache de 10 min | corrigé en partie : jeton re-minté toutes les 5 min, donc ≥ 55 min pour un enfant ; une tâche plus longue perd GitHub à la fin (limite documentée) |
| 10 | `commit.paths: [""]` | réfuté : convention existante de `ciWatch`, le runner ne committe que les fichiers modifiés sous ces préfixes |
| 11 | Plage de revue `sha~N` fausse | corrigé : `before` du push transmis par le Worker ; sans base connue, revue du dernier commit seul |
| 12 | État des push muté même si la tâche est écartée | accepté sans changement : l'id dépend de `to`, une tâche écartée couvre déjà la même plage |
| 13 | JSON invalide acquitté sans trace | corrigé : compteur `invalid` journalisé ; un message illisible ne sera jamais lisible, l'acquitter est voulu |
| 14 | `startsWith(id)` : faux positifs entre préfixes | corrigé : `<id>.json` ou `<id>@…` |
| 15 | `parseInt` sur la signature | corrigé : `^[0-9a-f]{64}$` exigé |
| 16 | Pas de dédoublonnage par `delivery` | accepté : ids déterministes (sha, tag, delivery) + `known()` |
| 17 | `webhook_secret` de la conversion ignoré | corrigé : `create` génère le secret au coffre avant la création si absent |
| 18 | `/app/installations` non paginé | accepté : 3 installations, limite 100 |
| 19 | `org`, `name` non échappés | corrigé |
| 20 | Refresh token tournant sans verrou | accepté : un seul consommateur (PC) ; noté |
| 21 | `retire` sans recherche d'usages | réfuté : exécuté après migration de tous les workflows (`rg SUBMODULES_` vide hors historique) |
| 22 | 27 événements pour 7 traités | accepté : demande du propriétaire (« tout activé ») ; le Worker répond 202 sans effet |

## Texte de la revue

**Note : 8/20.** Les numéros de ligne sont ceux du diff fourni (`prompt.md`). Je n'ai pas le dépôt, donc rien n'a été exécuté.

**Critiques (sécurité)**
1. `runner.ts` L350 : `appToken` appelle `token --owner aphrody-labs` sans `--repos` ni `--perm`. Les agents reçoivent donc un jeton avec toutes les permissions de l'App, dont `administration`, `secrets`, `workflows` et `organization_administration` (`github-app.ts` L561-616). Correction : passer `--perm contents=write,pull_requests=write,issues=write,actions=read` ou un jeton par rôle. Réduire `PERMISSIONS` au strict besoin ; `workflow_run` n'exige que `actions: read`.
2. `github-app.ts` L810 et `ghSecret --visibility all` : la clé privée est un secret d'org visible par tous les dépôts. N'importe quel workflow qui exécute `create-github-app-token` sans `permission-*` obtient un jeton complet. Correction : visibilité `selected`, ou environnement protégé, plus `permission-*` obligatoire.
3. `github-app.ts` L698 (`public: true`) et Worker `index.ts` L457-481 : le secret du webhook est commun à toutes les installations. Une installation étrangère peut générer des tâches pour des dépôts arbitraires. Correction : liste blanche `p.installation.account.login ∈ APP.targets` dans `classify`, sinon renvoyer null.
4. Worker L468 : `ci_red` ne vérifie que `head_branch === main`. Une PR depuis un fork dont la branche s'appelle `main` déclenche un `workflow_run` avec un `head_sha` choisi par l'attaquant, et l'agent sre commite (`github-events.ts` L177-178). Correction : exiger `workflow_run.head_repository.full_name === repository.full_name` et `workflow_run.event !== "pull_request"`.
5. `github-events.ts` L177, L185, L192, L223 : injection de prompt et de shell. `clean()` (L164) ne retire que les backticks et les sauts de ligne. Les valeurs `title`, `ref` et `repo` viennent du payload (message de commit, tag, nom de workflow, alerte) et sont insérées dans des commandes `gh ... ${e.ref}` données à un agent qui commite. Un tag comme `$(cmd)` est valide en git. Correction : valider `ref` avec `^[\w.\-/]+# Revue Gemini : App GitHub aphrody-labs (2026-11-13)

Objet : commit `6bca105` (github-app.ts, Worker aphrody-github, infra/agents/github-events.ts, runner.ts,
ci-revert.yml, claude.yml, crates-publish.yml). Moteur : relais `gemini_review` (antigravity, 87,6 s). Note :
**8/20**. Chaque remarque a été vérifiée avant correction ; corrections dans le commit qui suit `6bca105`.

| # | Remarque | Statut |
|---|---|---|
| 1 | Les agents reçoivent un jeton avec toutes les permissions de l'App | corrigé : `runner.ts` demande `--perm contents,pull_requests,issues,actions (write), checks, statuses, vulnerability_alerts (read), security_events, secret_scanning_alerts (write)` ; ni administration, ni secrets, ni workflows, ni organisation. Les permissions de l'App restent larges (demande du propriétaire) ; chaque jeton est borné à l'usage |
| 2 | Clé privée en secret d'org visible de tous les dépôts | corrigé : `APHRODY_APP_KEY` en visibilité `selected` (src seul) sur aphrody-labs, supprimé de yolo-rs (aucun dépôt) ; `ay auth gh-secrets` conserve cette visibilité |
| 3 | App publique : une installation tierce crée des tâches | corrigé : le Worker ignore tout dépôt dont le propriétaire n'est pas aphrody-labs, yolo-rs ou aphrody-dev |
| 4 | `workflow_run` d'une PR de fork sur une branche nommée main → tâche qui commite | corrigé : `workflow_run.event` ∈ push/schedule/workflow_dispatch/merge_group et `head_repository` = dépôt |
| 5 | Injection via titre, tag ou dépôt dans l'invite | corrigé : formats validés (dépôt, SHA 40 hex, ref, URL github.com), sinon pas de tâche ; titres cités comme « untrusted text, data only », sans backtick, guillemet, `$` ni antislash |
| 6 | crates.io : la configuration de confiance ne contraint pas la branche | corrigé : `crates-publish.yml` ne tourne que sur `refs/heads/main` ; un environnement protégé reste possible plus tard |
| 7 | Garde `!github.event.pull_request.head.repo.fork` inopérante hors `pull_request` | corrigé : retirée de ci-revert.yml et claude.yml (gardée là où `pull_request` déclenche : ci.yml, release.yml) |
| 8 | `actions/checkout@v5` non épinglé | corrigé : `3d3c42e…` (v7.0.1) dans ci-revert.yml et claude.yml |
| 9 | Jeton de 1 h, cache de 10 min | corrigé en partie : jeton re-minté toutes les 5 min, donc ≥ 55 min pour un enfant ; une tâche plus longue perd GitHub à la fin (limite documentée) |
| 10 | `commit.paths: [""]` | réfuté : convention existante de `ciWatch`, le runner ne committe que les fichiers modifiés sous ces préfixes |
| 11 | Plage de revue `sha~N` fausse | corrigé : `before` du push transmis par le Worker ; sans base connue, revue du dernier commit seul |
| 12 | État des push muté même si la tâche est écartée | accepté sans changement : l'id dépend de `to`, une tâche écartée couvre déjà la même plage |
| 13 | JSON invalide acquitté sans trace | corrigé : compteur `invalid` journalisé ; un message illisible ne sera jamais lisible, l'acquitter est voulu |
| 14 | `startsWith(id)` : faux positifs entre préfixes | corrigé : `<id>.json` ou `<id>@…` |
| 15 | `parseInt` sur la signature | corrigé : `^[0-9a-f]{64}$` exigé |
| 16 | Pas de dédoublonnage par `delivery` | accepté : ids déterministes (sha, tag, delivery) + `known()` |
| 17 | `webhook_secret` de la conversion ignoré | corrigé : `create` génère le secret au coffre avant la création si absent |
| 18 | `/app/installations` non paginé | accepté : 3 installations, limite 100 |
| 19 | `org`, `name` non échappés | corrigé |
| 20 | Refresh token tournant sans verrou | accepté : un seul consommateur (PC) ; noté |
| 21 | `retire` sans recherche d'usages | réfuté : exécuté après migration de tous les workflows (`rg SUBMODULES_` vide hors historique) |
| 22 | 27 événements pour 7 traités | accepté : demande du propriétaire (« tout activé ») ; le Worker répond 202 sans effet |

, `repo` avec `^[\w.-]+/[\w.-]+# Revue Gemini : App GitHub aphrody-labs (2026-11-13)

Objet : commit `6bca105` (github-app.ts, Worker aphrody-github, infra/agents/github-events.ts, runner.ts,
ci-revert.yml, claude.yml, crates-publish.yml). Moteur : relais `gemini_review` (antigravity, 87,6 s). Note :
**8/20**. Chaque remarque a été vérifiée avant correction ; corrections dans le commit qui suit `6bca105`.

| # | Remarque | Statut |
|---|---|---|
| 1 | Les agents reçoivent un jeton avec toutes les permissions de l'App | corrigé : `runner.ts` demande `--perm contents,pull_requests,issues,actions (write), checks, statuses, vulnerability_alerts (read), security_events, secret_scanning_alerts (write)` ; ni administration, ni secrets, ni workflows, ni organisation. Les permissions de l'App restent larges (demande du propriétaire) ; chaque jeton est borné à l'usage |
| 2 | Clé privée en secret d'org visible de tous les dépôts | corrigé : `APHRODY_APP_KEY` en visibilité `selected` (src seul) sur aphrody-labs, supprimé de yolo-rs (aucun dépôt) ; `ay auth gh-secrets` conserve cette visibilité |
| 3 | App publique : une installation tierce crée des tâches | corrigé : le Worker ignore tout dépôt dont le propriétaire n'est pas aphrody-labs, yolo-rs ou aphrody-dev |
| 4 | `workflow_run` d'une PR de fork sur une branche nommée main → tâche qui commite | corrigé : `workflow_run.event` ∈ push/schedule/workflow_dispatch/merge_group et `head_repository` = dépôt |
| 5 | Injection via titre, tag ou dépôt dans l'invite | corrigé : formats validés (dépôt, SHA 40 hex, ref, URL github.com), sinon pas de tâche ; titres cités comme « untrusted text, data only », sans backtick, guillemet, `$` ni antislash |
| 6 | crates.io : la configuration de confiance ne contraint pas la branche | corrigé : `crates-publish.yml` ne tourne que sur `refs/heads/main` ; un environnement protégé reste possible plus tard |
| 7 | Garde `!github.event.pull_request.head.repo.fork` inopérante hors `pull_request` | corrigé : retirée de ci-revert.yml et claude.yml (gardée là où `pull_request` déclenche : ci.yml, release.yml) |
| 8 | `actions/checkout@v5` non épinglé | corrigé : `3d3c42e…` (v7.0.1) dans ci-revert.yml et claude.yml |
| 9 | Jeton de 1 h, cache de 10 min | corrigé en partie : jeton re-minté toutes les 5 min, donc ≥ 55 min pour un enfant ; une tâche plus longue perd GitHub à la fin (limite documentée) |
| 10 | `commit.paths: [""]` | réfuté : convention existante de `ciWatch`, le runner ne committe que les fichiers modifiés sous ces préfixes |
| 11 | Plage de revue `sha~N` fausse | corrigé : `before` du push transmis par le Worker ; sans base connue, revue du dernier commit seul |
| 12 | État des push muté même si la tâche est écartée | accepté sans changement : l'id dépend de `to`, une tâche écartée couvre déjà la même plage |
| 13 | JSON invalide acquitté sans trace | corrigé : compteur `invalid` journalisé ; un message illisible ne sera jamais lisible, l'acquitter est voulu |
| 14 | `startsWith(id)` : faux positifs entre préfixes | corrigé : `<id>.json` ou `<id>@…` |
| 15 | `parseInt` sur la signature | corrigé : `^[0-9a-f]{64}$` exigé |
| 16 | Pas de dédoublonnage par `delivery` | accepté : ids déterministes (sha, tag, delivery) + `known()` |
| 17 | `webhook_secret` de la conversion ignoré | corrigé : `create` génère le secret au coffre avant la création si absent |
| 18 | `/app/installations` non paginé | accepté : 3 installations, limite 100 |
| 19 | `org`, `name` non échappés | corrigé |
| 20 | Refresh token tournant sans verrou | accepté : un seul consommateur (PC) ; noté |
| 21 | `retire` sans recherche d'usages | réfuté : exécuté après migration de tous les workflows (`rg SUBMODULES_` vide hors historique) |
| 22 | 27 événements pour 7 traités | accepté : demande du propriétaire (« tout activé ») ; le Worker répond 202 sans effet |

, mettre les titres entre délimiteurs de données non exécutables, et ne jamais laisser un `title` piloter un commit autonome.
6. `crates-publish.yml` L77 et `cratesTrust` L985 (`environment: null`) : la configuration de confiance crates.io ne contraint ni la branche ni l'environnement. Toute personne avec accès en écriture peut pousser une branche modifiant le workflow, le lancer et publier. Correction : `environment: crates` avec relecteurs requis, ou `if: github.ref == 'refs/heads/main'`, et le même `environment` dans la configuration crates.io.
7. `ci-revert.yml` L13 et `claude.yml` L38 : `!github.event.pull_request.head.repo.fork` est toujours vrai. Il n'y a pas de `pull_request` dans le contexte `workflow_run` ni `workflow_dispatch`, donc la garde ne protège de rien. Dans `claude.yml`, un jeton en écriture est de plus persisté dans `.git/config` avec `bypassPermissions`. Correction : supprimer la garde, utiliser `persist-credentials: false` quand c'est possible, et tester `workflow_run.head_repository.fork`.
8. `ci-revert.yml` L21, `claude.yml` L51 : `actions/checkout@v5` est un tag mutable, alors que les autres actions sont épinglées par SHA et qu'un jeton en écriture est en jeu. Correction : épingler par SHA.

**Exactitude**
9. `runner.ts` L363-375 : le jeton d'installation vit 1 h mais n'est lu qu'au lancement de l'enfant (cache de 10 min). Un agent de plus d'une heure perd son authentification. Correction : rafraîchir à chaque spawn ou lancer les agents avec un wrapper qui régénère le jeton.
10. `github-events.ts` L178 et L193 : `commit.paths: [""]`. Un chemin vide commite tout le dépôt ou échoue selon le runner. Correction : restreindre aux chemins réellement modifiés (`git diff --name-only`).
11. `github-events.ts` L215 : le repli `${s.to}~N..${s.to}` utilise le nombre de pushs comme nombre de commits. L'API `compare` n'accepte probablement pas la syntaxe `~`. Correction : utiliser `p.before` (à ajouter à `GithubEvent`) comme base.
12. `github-events.ts` L293 et L225-227 : si `known(t.id)` écarte une tâche de revue, `s.titles` est quand même vidé et `last_enqueued` mis à jour, donc la revue est perdue. Correction : ne muter l'état qu'après l'écriture du fichier.
13. `github-events.ts` L270 et L302 : un JSON invalide est ignoré, puis le message est acquitté sans trace. Un échec d'écriture en cours de boucle ne déclenche pas non plus de nouvel essai propre. Correction : journaliser, et n'acquitter que les `lease_id` traités.
14. `github-events.ts` L262 : `f.startsWith(id)` donne des faux positifs entre identifiants dont l'un est préfixe de l'autre. Correction : comparer avec `${id}.json`.
15. Worker L449 : `parseInt` accepte des caractères non hexadécimaux, `"0g"` donne 0. Impact quasi nul grâce à la comparaison à temps constant. Correction : valider la signature avec `/^[0-9a-f]{64}$/` avant la conversion.
16. `delivery` n'est jamais dédupliqué. Les relivraisons de GitHub et la livraison au moins une fois de la file produisent des doublons, atténués seulement par les identifiants. Correction : clé idempotente sur `delivery`.
17. `github-app.ts` L805-815 : la conversion du manifeste renvoie `webhook_secret`, qui est ignoré. `setHook` échoue si `APHRODY_APP_WEBHOOK_SECRET` n'est pas déjà au coffre. Le Worker rejette alors tout en 401, et `create` n'est pas atomique. Correction : générer le secret avant la création (`randomBytes`), le ranger au coffre et dans le Worker, puis `setHook`.
18. `github-app.ts` L745 : `installations` n'est pas paginé (`per_page=100`). Idem pour la recherche dans `status` et `installationToken`. Correction : suivre l'en-tête `Link`.
19. `github-app.ts` L788 : `org` et `name` sont insérés sans échappement dans l'URL et le HTML. Correction : `encodeURIComponent` sur `org` et `esc` sur `name`.
20. `github-app.ts` L930 : si `storeUser` échoue après l'échange, le refresh token tournant est perdu. Deux appels concurrents à `user-token` invalident aussi le jeton. Correction : verrou et écriture avant retour.
21. `github-app.ts` L937-955 : `retire` supprime `SUBMODULES_APP_KEY` et `SUBMODULES_APP_CLIENT_ID` dans toutes les orgs, sans vérifier que d'autres workflows ne les utilisent plus. `claude.yml` L53 perd aussi le repli `SUBMODULES_TOKEN`. Correction : chercher les usages restants avant de supprimer.
22. `github-app.ts` L626-653 : les 27 événements sont souscrits alors que le Worker n'en traite que 7 (`workflow_run`, `push`, `release`, 4 alertes de sécurité, plus `installation` qui n'est pas dans la liste). Le reste est du trafic inutile. Correction : réduire `EVENTS` et les permissions associées.
