# Cahier des charges (PRD) — aphrody.com, page d'accueil de la marque

| Champ           | Valeur                                                                                             |
| :-------------- | :------------------------------------------------------------------------------------------------- |
| Surface         | `https://aphrody.com/` (fr, par défaut) et `https://aphrody.com/en`                                |
| Rôle de la page | Dire qui est Aphrody, ce qu'elle fait, et mener à ses produits                                     |
| Propriétaire    | Aphrody (`contact@aphrody.com`)                                                                    |
| Runtime         | Bun 1.4.4, HTML/CSS rendus au build (`build.ts` -> `dist/`), servis par `server.ts` derrière nginx |
| Vérification    | `bun test`, `gds verify`, `gds audit-slop`, `wck dist` 100/100                                     |

## 1. Objectif

Remplacer l'ancienne page d'accueil (clone d'interface de moteur de recherche, rendue en JavaScript, avec un « Mode IA Gemini ») par une page de marque statique, lisible sans JavaScript, optimisée pour le référencement.

- La recherche reste disponible, mais sur `/search` (page secondaire, liée depuis l'en-tête).
- Aucune fonctionnalité d'IA sur aphrody.com. Règle du dépôt : seul `packages/ai-os` porte de l'IA. Le Mode IA Gemini (`/api/gemini/search`, `/search/ai-gemini`) et Local Studio (`/api/studio/*`) sont retirés. `/search/ai-gemini` répond `410 Gone`.

## 2. Public et parcours

1. **Visiteur qui découvre Aphrody** (moteur de recherche, lien partagé) : comprend en moins de 5 secondes ce qu'est Aphrody et voit la liste des produits avec leur statut.
2. **Développeur** : trouve la recherche, le catalogue de paquets et les benchmarks en un clic depuis la mosaïque.
3. **Partenaire ou association** qui cherche un prestataire : trouve ce qu'Aphrody sait faire et un contact direct.

## 3. Contenu (uniquement des faits vérifiables)

Chaque produit affiché est réel, et son statut est vérifié au moment de l'écriture (2026-11-12).

| Produit              | URL                    | Statut affiché                                | Fait vérifié                                                                                                                        |
| :------------------- | :--------------------- | :-------------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------- |
| Recherche Aphrody    | `/search`              | En ligne                                      | `/search` et `/api/q` répondent 200 en production                                                                                   |
| Catalogue de paquets | `/search/packages`     | En ligne                                      | Bun, winget, AUR, Nix, Flatpak, Play Store, WASM hub ; pages 200 en production                                                      |
| Benchmarks           | `/search/benchmarks`   | En ligne                                      | Mesures calculées à la demande par `/api/bnc` ; page 200 en production                                                              |
| aphrody.app          | `https://aphrody.app/` | En développement, pas encore ouvert au public | Dépôt `apps/aphrody-app` : mosaïque de fenêtres (dwindle, grille, défilement), rendu WebGPU, stockage local ; domaine en erreur 526 |

Interdits : témoignages, notes, chiffres d'usage, logos de clients, promesses de dates, textes de remplissage. Un produit dont l'URL ne répond pas n'est jamais présenté comme disponible. Les sites communautaires maintenus par Aphrody (DBFR, Shenron, Rose Griffon) ne sont pas des produits Aphrody et n'apparaissent pas sur la page.

## 4. Structure de la page

```text
+--------------------------------------------------------------------------+
| En-tête : Aphrody      Produits  Recherche  Contact            FR | EN   |
+--------------------------------------------------------------------------+
| H1 (phrase de marque) + paragraphe d'introduction (max 64ch)             |
+--------------------------------------+-----------------------------------+
|                                      | Recherche                         |
|  aphrody.app (tuile principale)      +-----------------+-----------------+
|                                      | Paquets         | Benchmarks      |
+--------------------------------------+-----------------+-----------------+
| Ce que fait Aphrody : 3 paragraphes courts (sites, logiciels, systèmes)  |
+--------------------------------------------------------------------------+
| Contact : adresse e-mail, ce qu'on peut demander                         |
+--------------------------------------------------------------------------+
| Pied de page : mentions, langues, liens produits                         |
+--------------------------------------------------------------------------+
```

- Mosaïque : partition « dwindle » (la tuile principale prend 3/5 de la largeur, le reste est découpé récursivement), comme `apps/aphrody-app/crates/aphrody-core/src/layout.rs`. Sous 720 px, les tuiles s'empilent.
- Une tuile est un lien unique (toute la surface est cliquable), avec nom, phrase descriptive et statut.

## 5. SEO

- `title` fr : « Aphrody — sites et logiciels web indépendants » ; en : « Aphrody — independent websites and web software ».
- `description` : une phrase factuelle sur ce que fait Aphrody et ses produits.
- Une seule balise `h1` visible. Canonical, hreflang fr-FR / en-US / x-default, Open Graph avec `og:locale`.
- JSON-LD : `Organization` (nom, url, logo, e-mail, `sameAs` limité aux URL qui répondent), `WebSite` avec `SearchAction` vers `/search`, `ItemList` des produits, `BreadcrumbList`. `Dataset` pour les benchmarks (`/api/bnc`), pas d'`aggregateRating`, pas de `SoftwareApplication` tant qu'aphrody.app n'est pas public.
- Sitemaps et `robots.txt` sans référence à Gemini.

## 6. Critères d'acceptation

| Critère                      | Cible                                                                            | Vérification              |
| :--------------------------- | :------------------------------------------------------------------------------- | :------------------------ |
| Page lisible sans JavaScript | Tout le contenu et tous les liens présents dans le HTML                          | test `home` dans `tests/` |
| LCP / CLS                    | <= 1200 ms / 0.00                                                                | `wck dist`                |
| Accessibilité                | WCAG 2.2 AA, focus visible, cibles >= 44 px                                      | `wck`, revue clavier      |
| Poids                        | HTML + CSS de la home < 30 Ko compressé, police < 60 Ko                          | taille de `dist/`         |
| Aucune trace d'IA            | 0 occurrence de « Gemini », « IA », « AI mode » sur la home et dans les sitemaps | tests                     |
| Anti-slop                    | 0 emoji, 0 formule promotionnelle                                                | `gds audit-slop`          |
