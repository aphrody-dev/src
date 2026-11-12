# Dépôts qui restent privés : remédiation

Aucun historique n'a été réécrit et aucun force-push n'a été fait. Les commandes ci-dessous sont à lancer après validation, sur un clone mirror frais (fr2), puis `git push --force --mirror`, ce qui réécrit l'historique. Avant tout passage en public, relancer `gitleaks git --redact` sur le résultat.

## aphrody-labs/shenron

1. Révoquer la clé dans le dashboard Stripe (mode test, Developers > API keys > Roll key), qu'il y ait purge ou non.
2. Commits concernés :
   - clé `sk_test_`/`pk_test_` : introduite par `a2671e1e` (2026-10-28, feat(stripe)), retirée par `14cbbe07` (2026-11-01). Le HEAD est propre (`git grep` : 0) ;
   - build `apps/site/.next-ui-preview/**` : ajouté par `3ffae86d` (2026-10-16) et retiré du suivi par `5ad418d0` (2026-10-16). `.gitignore` le couvre déjà (ligne 106).
3. Purge :
   ```sh
   git clone --mirror https://github.com/aphrody-labs/shenron.git && cd shenron.git
   # replacements.txt : une ligne par valeur, au format `<valeur exacte sk_test_…>==>REDACTED_STRIPE_TEST_KEY`
   #   (prendre la même chose pour pk_test_ ; extraire les valeurs via `git show a2671e1e:apps/site/src/lib/stripe.ts`, sans les commiter nulle part)
   git filter-repo --replace-text ../replacements.txt
   git filter-repo --path apps/site/.next-ui-preview --invert-paths
   gitleaks git . --redact
   git push --force --mirror
   ```
4. Puis : supprimer `replacements.txt`, demander aux autres clones de reprendre à partir de zéro, et vérifier les forks et les PR GitHub (les refs `refs/pull/*` gardent les anciens objets : passer par le support GitHub pour faire purger les objets en cache).
5. Reste aussi le point de l'audit sur les droits du contenu Dragon Ball aspiré (`data/catalogues/pages/*.html`), qui relève de la propriété intellectuelle et non des secrets.

## aphrody-dev/mesh-vn (archivé)

- `generated/wg-win.conf` et `src/generator.ts` (commit `2f81bf77`, encore présents au HEAD `8e07397`) contiennent une **clé privée WireGuard** réelle (44 caractères, interface du poste Windows), ainsi que les IP publiques des hubs fr1 et usa.
- Remédiation :
  1. regénérer la paire de clés du poste (`wg genkey | tee priv | wg pubkey`), mettre à jour la clé publique chez les pairs fr1 et usa, puis retirer l'ancienne ;
  2. ne plus produire de clé dans le code : `generator.ts` doit lire la clé dans l'environnement ou dans un fichier ignoré, et `generated/` doit aller dans `.gitignore` ;
  3. purger :
     ```sh
     gh api -X PATCH repos/aphrody-dev/mesh-vn -F archived=false
     git clone --mirror https://github.com/aphrody-dev/mesh-vn.git && cd mesh-vn.git
     git filter-repo --path generated/wg-win.conf --invert-paths
     # replacements.txt : `<ancienne clé privée>==>REDACTED_WG_PRIVATE_KEY`
     git filter-repo --replace-text ../replacements.txt
     gitleaks git . --redact && git push --force --mirror
     gh api -X PATCH repos/aphrody-dev/mesh-vn -F archived=true
     ```
  4. passer ensuite en public.

## aphrody-labs/UnrealEngine, aphrody-dev/UnrealEngine

Ces dépôts restent privés de façon définitive, et le propriétaire ne peut pas lever cette contrainte : le code est sous EULA Epic, et ce sont des forks de `EpicGames/UnrealEngine`, un amont privé que GitHub interdit de rendre public. Aucune remédiation n'est possible.

## Hors GitHub

- Sous-dossiers `third_party/` sous licence Steam SDK, AGPL ou sans licence : ne jamais les intégrer (vendoring) dans un dépôt ou une crate publics (audit §2).
- `@aphrody/epic-games` (npm) et la crate `steam-depot` : ne pas les publier (voir NPM.md et CRATES.md).
