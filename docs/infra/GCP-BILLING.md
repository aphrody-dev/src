# Facturation Google Cloud gérée par agents

État au 2026-11-13. Outils : `env-kit billing status|plan|apply|lift|relink`, outil relais `billing_status`,
fonction `billing-cap` (`infra/gcp/billing-agent/cap-function`), compte de service `billing-agent@aphrody`.

## 1. Règles Google vérifiées en direct (2026-11-13)

| Sujet | Règle | Source |
|---|---|---|
| Crédits du codelab | Obtenus via le lien d'échange de l'atelier ou le lien « compte de facturation d'essai » ; s'appliquent au compte Google connecté au moment de l'échange ; valables six mois ou jusqu'à épuisement ; projet à lier au compte de facturation d'essai créé. | [codelab cloud-codelab-credits](https://codelabs.developers.google.com/codelabs/cloud-codelab-credits?hl=fr) |
| Portée d'un crédit | Un crédit s'applique à **un seul compte de facturation**. | [Developer Program Benefits FAQ](https://developers.google.com/profile/help/benefits) |
| Transfert | Un crédit appliqué ne peut pas être déplacé vers un autre compte de facturation ; « Credits may be applied only to Customer's own Account and are not transferable » (Supplemental Terms, Google Cloud Credits Program). Les crédits payants ne sont pas transférables non plus. | [FAQ](https://developers.google.com/profile/help/benefits), [Credits Program terms](https://cloud.google.com/terms/open-source-software-tos), [Paid Credit terms](https://cloud.google.com/terms/supplemental-paid-credit) |
| Conséquence | Le seul « partage » possible : lier les projets au compte de facturation qui porte le crédit. Un projet n'a qu'un compte de facturation à la fois ; le changer ne déplace pas les crédits. | [billing-access](https://docs.cloud.google.com/billing/docs/how-to/billing-access) |
| Solde et expiration des crédits | Aucune API publique : page Billing > Credits de la console (liste des crédits promotionnels, y compris expirés). | [resolve-issues](https://docs.cloud.google.com/billing/docs/how-to/resolve-issues) |
| Rôles | `billing.admin` : tout sauf créer le compte (lie/délie, exports, rôles). `billing.user` : lier des projets au compte. `billing.projectManager` (sur le projet) : lier/délier ce projet, sans accès aux ressources. `billing.costsManager` : budgets et export des coûts, pas de liaison. `billing.viewer` : lecture des coûts. Lier = `resourcemanager.projects.createBillingAssignment` côté projet + `billing.resourceAssociations.create` côté compte. | [billing-access](https://docs.cloud.google.com/billing/docs/how-to/billing-access) |
| Sous-comptes | Réservés aux revendeurs (comptes maîtres) ; le compte Aphrody n'en a aucun (`subAccounts` vide). | API `billingAccounts/{id}/subAccounts` |
| Plafonnement programmatique | Budget → Pub/Sub → fonction qui appelle `updateProjectBillingInfo` avec `billingAccountName: ""`. Couper la facturation arrête tous les services du projet, des ressources peuvent être supprimées, et le délai des notifications laisse passer des frais. | [disable-billing-with-notifications](https://docs.cloud.google.com/billing/docs/how-to/disable-billing-with-notifications) |
| Spend caps natifs | GA le 2026-10-13. Un budget = un projet + un service éligible (Gemini API `AEFD-7695-64FA`, Agent Platform/Vertex `C7E2-9256-1C43`, Cloud Run `152E-C115-5142`, Cloud Run functions `29E7-DA93-CA13`), mensuel, sur coût brut estimé (crédits non déduits). Au dépassement : nouvel usage du service suspendu, rien supprimé ; levée manuelle (`spendCap.inputState=AWAITING_NEXT_PERIOD`) ou automatique au mois suivant. Pas de topic Pub/Sub possible (erreur API « Spend Caps cannot configure PubSub notification topics »). | [budgets-spend-caps](https://docs.cloud.google.com/billing/docs/how-to/budgets-spend-caps), [budget-api-spend-cap](https://docs.cloud.google.com/billing/docs/how-to/budget-api-spend-cap), [blog GA](https://cloud.google.com/blog/topics/cost-management/google-cloud-spend-caps-now-generally-available) |
| Anomalies | Détection GA (2025-10-30), e-mails aux admins de facturation par défaut ; notification Pub/Sub et seuils réglables dans la console (Billing > Anomalies, `billing.admin` requis) ; s'applique à tout le compte. Budgets et anomalies gratuits, Pub/Sub au tarif standard. | [manage-anomalies](https://docs.cloud.google.com/billing/docs/how-to/manage-anomalies), [programmatic notifications](https://docs.cloud.google.com/billing/docs/how-to/budgets-programmatic-notifications) |
| Export BigQuery | Configuration de l'export uniquement dans la console (Billing > Billing export) ; jeu de données à créer d'avance. | [export-data-bigquery](https://docs.cloud.google.com/billing/docs/how-to/export-data-bigquery) |

## 2. Inventaire (lecture seule, 2026-11-13)

| Compte gcloud | Comptes de facturation visibles | Projets |
|---|---|---|
| `<owner-google>` | **ouvert : `017AB5-0FC923-9CCFE5` « Aphrody » (EUR, org `rose-griffonfr` 270161163915, seul admin : <owner-google>)** ; fermés : 013952-…, 0185BA-…, 01FE8F-… (Paiement de Firebase), 01C99E-… (rgfr), 01E22C-… (My Maps), 01EBC5-… (Mon compte de facturation) | 13 projets ; facturation active : `aphrody`, `inagle` (sur 017AB5) ; `propane-tranquility-hmhkk` sur `019873-C7F8B9-B9F0C6` (dossier géré par Google, compte non visible) ; les 10 autres sans facturation |
| `<ai-google>` | aucun | aucun |
| `yolo-automation@aphrody` (SA) | aucun | `aphrody` |
| `admin-sa@rgfr-8927d` (SA) | requête bloquée (délai) | - |
| `contact@aphrody.com` | configuration `org-contact` sans identifiant ; connexion ouverte le 2026-11-13 | - |

Crédits : aucun compte ouvert autre que 017AB5 ; aucun compte d'essai issu du codelab n'existe sur les comptes connectés,
donc les crédits du codelab n'ont pas été échangés (ou l'ont été sur un compte non connecté). Solde/expiration des crédits
de 017AB5 : page console bloquée tant que la validation en deux étapes n'est pas activée sur le compte qui l'ouvre
(« Google Cloud access blocked », exigence 2SV depuis le 2025-05-13).

## 3. Partage et liaisons

- Compte principal : `<owner-google>` (seul `billing.admin` du compte ouvert, propriétaire de l'org qui le porte).
  `contact@aphrody.com` n'administre aucun compte de facturation visible.
- `aphrody` et `inagle` sont déjà sur 017AB5, le seul compte ouvert : aucune liaison à changer.
- Répartition multi-comptes : sans objet tant qu'il n'existe qu'un compte ouvert. Dès qu'un crédit est échangé
  (nouveau compte d'essai), `env-kit billing plan` le voit ; on y lie des projets `aphrody-<usage>` avec
  `env-kit billing relink <projet> <compte>` pour le consommer avant expiration.

## 4. Facturation gérée par agents (en place)

- **Compte de service** `billing-agent@aphrody.iam.gserviceaccount.com`, sans clé.
  - Accès : impersonation par `<owner-google>` (`iam.serviceAccountTokenCreator`), OIDC GitHub
    (`iam.workloadIdentityUser` pour `principalSet://…/workloadIdentityPools/github/attribute.repository_owner/aphrody-labs`).
  - Compte de facturation : `billing.costsManager`, `billing.viewer`.
  - Projets `aphrody`, `inagle` : `billing.projectManager`, `browser`, `compute.viewer`, `recommender.viewer`,
    `aiplatform.viewer`, `artifactregistry.reader` ; `aphrody` seul : `logging.viewer`, `logging.logWriter`,
    `serviceusage.serviceUsageConsumer`, `bigquery.jobUser`, `run.invoker` sur le service `billing-cap`,
    `pubsub.subscriber` sur `billing-alerts-agent`.
- **Pub/Sub** : topic `projects/aphrody/topics/billing-alerts`, abonnement `billing-alerts-agent` (7 j).
- **Budgets d'alerte** (seuils 50/90/100 % réel + 100 % prévu, vers Pub/Sub, crédits inclus) :
  `account-aphrody-50eur-month` (compte entier, existant, rebranché), `project-aphrody-40eur-month`,
  `project-inagle-5eur-month`.
- **Spend caps natifs** (coupent le service, ne suppriment rien, se lèvent seuls le 1er du mois) :
  `cap-aphrody-aiplatform-30eur`, `cap-aphrody-gemini-api-10eur`, `cap-aphrody-run-5eur`,
  `cap-aphrody-functions-5eur`, `cap-inagle-gemini-api-5eur`, `cap-inagle-aiplatform-5eur`.
- **Fonction `billing-cap`** (Cloud Run functions, `us-central1`, nodejs24 — bun n'est pas un runtime géré —, 128 Mi,
  1 instance max, sans dépendance) déclenchée par `billing-alerts`. Coupe la facturation d'un projet seulement si
  le budget s'appelle `project-<id>-<N>eur-month`, que le coût dépasse le montant et que `<id>` est dans `CAP_PROJECTS`
  (actuellement `inagle`, `DRY_RUN=0`). `aphrody` reste en alerte seule : la coupure arrêterait la production
  (Firebase, Vertex de `litellm-prd`) ; ses services IA/Run sont tenus par les spend caps natifs.
  Testée : message publié, journal `sous le plafond`. Réactivation : `env-kit billing relink <projet>`.
- **Export BigQuery** : jeu de données `aphrody:billing_export` (US) créé, lisible par `billing-agent` ; stockage
  et requêtes dans le niveau gratuit BigQuery. L'activation de l'export reste un clic console.
- **Commande** `env-kit billing` (`packages/env-kit/src/billing.ts`) :
  `status` (comptes, liaisons, budgets, état des caps, dernière dépense notifiée), `plan`/`apply` (budget manquant par
  projet facturé au plafond de `.agents/owner-rules.json` sinon 5 EUR, rebranchement Pub/Sub, ressources inactives :
  VM arrêtées, disques détachés, IP réservées, recommandations Idle*, endpoints Vertex), `lift <cap>`, `relink`.
  `--owner` utilise le compte propriétaire au lieu de l'impersonation.
- **Relais** : outil `billing_status` (`packages/ai-os/src/relay/tools.ts`).
- **Règles propriétaire** : `.agents/owner-rules.json` absent → aucune dépense nouvelle. Forme lue :
  `{"billing": {"projectCapsEur": {"<projet>": N}, "hardCap": ["<projet>"], "allowNewSpend": false}}`.

## 5. Optimisation (2026-11-13)

- Aucune VM, aucun disque, aucune IP statique, aucun endpoint Vertex dans `aphrody` ; Compute désactivé dans `inagle` :
  rien à arrêter.
- Artifact Registry `europe-west3/rpbey` : 14,0 Go, inchangé depuis le 2026-06-10, environ 1,4 USD/mois. Politique de
  nettoyage posée **en dry-run** (garde 5 versions récentes, supprimerait au-delà de 90 j) : elle ne supprime rien,
  elle journalise ce qu'elle ferait. Passage en réel = décision du propriétaire.
- Buckets `aphrody` : `aphrody_cloudbuild` 1,43 Gio (sources Cloud Build), `aphrody-yolo-archive` 696 Mio,
  autres négligeables. Laissés en l'état (pas de suppression).
- Anomalies : e-mails par défaut aux admins de facturation ; routage Pub/Sub vers `billing-alerts` = clic console.

## 6. Reste au propriétaire (clics)

1. Activer la validation en deux étapes sur `<owner-google>` (la console Cloud est bloquée sans 2SV), puis
   ouvrir https://console.cloud.google.com/billing/017AB5-0FC923-9CCFE5/credits/all pour voir solde et expiration.
2. Échanger les crédits du codelab avec le compte voulu (lien de la page codelab) ; ensuite `env-kit billing plan`.
3. Billing > Billing export > BigQuery : activer « Standard », « Detailed » et « Pricing » vers `aphrody:billing_export`.
4. Billing > Anomalies > Manage anomalies : notifications Pub/Sub vers `projects/aphrody/topics/billing-alerts`.
5. Terminer la connexion `gcloud auth login contact@aphrody.com` ouverte par l'automatisation.
