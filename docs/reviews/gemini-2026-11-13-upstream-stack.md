# Revue Gemini : docs/infra/UPSTREAM-STACK.md (2026-11-13)

Modèle : Gemini 4 Carbon High (gemini.google.com, Chrome du propriétaire, claude-in-chrome). Note : **5/20**
(versions/sources 1/4, cohérence upstream 1,5/4, rollback 0,5/4, sécurité 1/4, rôles 1/4).

## Constats et suite donnée

| # | Constat | Suite |
|---|---|---|
| 1 | commits = têtes de branche, pas les commits des tags cités | corrigé : commits résolus par `git/ref/tags` (+ déréférencement des tags annotés) |
| 2 | VictoriaMetrics ne stocke pas de logs | corrigé : VictoriaLogs v1.53.0 pour les logs, VictoriaMetrics pour les métriques |
| 3 | Garage (AGPL) retenu alors que Loki (AGPL) est écarté | corrigé : politique de licences explicite (OSI permissive, MPL ; AGPL et BUSL écartées), Garage écarté |
| 4 | `compose up --wait` n'est pas un blue/green, pas de retour automatique | documenté (limite) ; proposition Wowu/docker-rollout v0.14 + tag précédent consigné sur l'hôte |
| 5 | `gh workflow run` rend la main avant le build | corrigé pour `just docker-build` (`gh run watch --exit-status`) ; `docker-smoke` signalé |
| 6 | retour arrière vers un Artifact Registry « supprimé » | réfuté : seul le fichier `cloudbuild.yaml` est supprimé, le dépôt `bunos` n'est pas touché ; précisé |
| 7 | état déployé et cible mêlés | corrigé : colonne = release de référence, épingle déployée = lock, écarts au §3 ; ligne Vercel « aucun outil retenu » |
| 8 | `env_file` visible par `docker inspect` | documenté, proposition `secrets:` de compose |
| 9 | actions épinglées par tags mutables | proposition (commits des tags fournis) |
| 10 | varnish : mauvais slug ; forgejo hors GitHub | varnishcache/varnish-cache vérifié : archivé aussi ; forgejo noté hébergé sur Codeberg |
| 11 | nginx/nginx ne publierait pas de release GitHub | réfuté : `releases/latest` renvoie release-1.31.8 (gh api, 2026-11-13) |
| 12 | repli IPv4 = mauvais diagnostic d'un 404 | maintenu : même URL, `curl -4` 200 et `curl -6` 404 depuis fr1, 200 depuis prd et le PC |
| 13 | agents qui compilent en root sur prd, nativelink sur fr2, edge sur fr1, `agent_runner` cassé | hors périmètre, transmis en §3 aux chantiers résilience et cluster |
| 14 | toolchains-lock.ts + bootstrap = gestionnaire maison, remplacer par jdx/mise | non retenu dans ce chantier (lock déjà vérifié par sommes amont, chantier deps) |
