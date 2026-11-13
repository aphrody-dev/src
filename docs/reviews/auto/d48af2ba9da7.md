# Revue Gemini d48af2ba9da7

- Commit : docs/infra/RUNNERS.md : audit runners/images mesure (labels officiels, durees reelles, 22.04 deprecie, ubuntu-latest -> 26.04 en novembre) ; upstream-sync sur ubuntu-slim
- Moteur : antigravity (18110 ms)

Je ne peux pas encore vous donner de note ni de liste de défauts vérifiables : je n'ai ouvert ni le dépôt, ni le commit, ni les sources citées. Noter sans vérifier reviendrait à inventer des numéros de ligne et des faits.

Le mode /plan impose de cadrer avant d'agir. Voici ce que je propose de faire. Dites-moi si je dois changer quelque chose, sinon je démarre.

**Vérifications prévues (lecture seule)**

1. Lire `git show d48af2ba` dans `C:\src`, ainsi que `docs/infra/RUNNERS.md` et `.github/workflows/upstream-sync.yml` pour obtenir les numéros de ligne exacts.
2. Contrôler les affirmations sur les labels et les dates auprès des sources officielles, avec `gh api repos/actions/runner-images/readme` et les issues #14748 et #14254. Les points à vérifier sont :
   - `ubuntu-latest` passe à 26.04 en novembre ;
   - la dépréciation de 22.04 commence le 2026-09-17 et prend fin le 2027-04-17 ;
   - `ubuntu-slim` repose sur 24.04.5 ;
   - `windows-latest` correspond à `windows-2025-vs2026` ;
   - `windows-11-arm` existe.
3. Recompter les jobs avec `rg runs-on .github/workflows`. Le document annonce 19 jobs sur `ubuntu-latest`, 4 sur `ubuntu-22.04` et 2 sur `windows-latest`.
4. Comparer les durées mesurées avec `gh run view --json jobs`.
5. Relire `infra/docker/Dockerfile` et la liste des workflows « sans run réussi ».
6. Vérifier que `upstream-sync` fonctionne sur `ubuntu-slim` : `actions/checkout@v7`, les outils utilisés (git, gh, jq, etc.), le timeout de 30 minutes, les droits et les limites de CPU et de RAM.

**Livrable**

- Une note sur 20 avec le barème détaillé.
- Un tableau des défauts : fichier, ligne, problème, correction. Aucun compliment.

**Points de départ**

- Le tableau dit que `upstream-sync` dure 0,8 min, mais il ne donne aucune mesure pour `ubuntu-slim`. Le basculement n'est donc pas validé par un run.
- `ubuntu-slim` est annoncé comme « unverified » alors que le commit le met déjà en production.
- La ligne `ubuntu-22.04` mentionne « 4 jobs » mais ne cite qu'un seul workflow.
- Le texte conseille d'épingler `windows-2025-vs2026` tout en le qualifiant de « correct ».

Ces quatre points restent des hypothèses tant que je n'ai pas lu les sources.

Confirmez-vous que je lance l'audit en lecture seule (et rien d'autre) ? Le dépôt est-il bien dans `C:\src` avec `gh` authentifié ?
