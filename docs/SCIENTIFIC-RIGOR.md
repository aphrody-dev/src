# Rigueur des chiffres (règles du monorepo)

S'applique à toute la doc, aux messages de commit, aux PR et aux rapports d'agents.

1. Chaque chiffre est l'un des deux :
   - une **mesure** : valeur, méthode (outil, commande, machine, date), n ;
   - une **borne ou un calcul** : formule écrite, entrées mesurées citées, hypothèses listées.
2. Aucune estimation sans étiquette. Une valeur non vérifiée porte `[NV]` et dit ce qui manque pour la vérifier. Une valeur de scénario (« si L = 30 min ») est présentée comme scénario, jamais comme résultat.
3. Intervalles systématiques : IC 95 % (bootstrap, Wilson pour les proportions, bootstrap par blocs pour les séries autocorrélées) ou min/max quand n est trop petit. Pour n < 10, donner les valeurs brutes et dire que l'échantillon ne permet pas de conclure.
4. Benchmarks : warmup (style hyperfine, ≥ 3 runs jetés), n ≥ 30 quand c'est faisable (sinon donner n et la raison), rapporter médiane + IQR ou moyenne ± IC. Préciser la charge de la machine pendant la mesure (`uptime`), la version des outils et le commit.
5. Reproductible : le script ou la commande exacte est versionné (`tools/…`, `scripts/…`), avec ses entrées et, si possible, la sortie brute (`results/`). Graine fixée pour tout tirage aléatoire.
6. Un modèle est validé contre une mesure indépendante (hindcast, validation croisée) et son erreur est publiée. Un test circulaire est signalé comme tel.
7. Limites écrites à côté du résultat : biais connus, ce qui n'est pas mesuré, conditions hors domaine.
8. Sources en conflit : les deux valeurs et leurs sources sont citées, sans arbitrage silencieux.
9. Travail lourd (builds, bootstrap, gros parsing) sur les serveurs (`nice`), jamais sur le PC local ; fichiers temporaires hors du dépôt.

Référence d'application : `docs/CHROMIUM-FACTORY.md`, section « Modèle et bornes », et `tools/build-model/`.
