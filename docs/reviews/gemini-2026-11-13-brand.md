# Revue Gemini : identité Aphrody (2026-11-13)

Moteur : Gemini via le relais (`gemini_ask`, engine `agy`) ; la voie web était indisponible (session Google absente du Chrome du relais), `gemini_review` a expiré. Objet : monogramme, tuiles produit, tokens M3, DESIGN.md, README de profil aphrody-labs et aphrody-dev, CV vitrine anonyme. Gemini n'a lu que la description, pas les fichiers.

Note : **11/20**.

## Défauts relevés et suite donnée

| # | Défaut | Suite |
| :-- | :-- | :-- |
| 1 | Contour de 1,6 dp autour de l'éclair illisible sous 24 px | Corrigé : variante petite taille (`small()`), découpe ramenée à 1 dp de chaque côté sous 48 px |
| 2 | `paint-order` ignoré par certains moteurs | Corrigé : découpe et remplissage en deux tracés distincts dans `src/mark.svg` |
| 3 | Contraste ambre sur primary limite | Accepté : l'éclair est un élément graphique séparé par une découpe, pas du texte ; le glyphe blanc reste à 4,5:1 minimum (test) |
| 4 | Zone de protection, taille minimale | Documenté dans les commentaires de `assets/brand/src/mark.svg` et `tile.svg` (tuile 48 dp, variante sous 48 px) |
| 5 | Glyphe 30 dp en collision avec l'encoche | Corrigé : glyphe ramené à 28 dp (zone utile 12,3 à 35,7), encoche à partir de x = 37 |
| 6 | Écrêtage HCT chroma 56 | Sans objet : les teintes produit sont résolues par le solveur HCT de `aphrody-design-tokens` et contrôlées par test (blanc à 4,5:1 minimum) |
| 7 | ay et aphrody.com de même teinte | Corrigé : aphrody.com 290, ai-os 322 |
| 8 | Encoche ambre peu visible sur les tuiles rouges | Accepté au-dessus de 48 px ; encoche retirée en dessous |
| 9 | Jeu de rôles M3 incomplet | Sans objet : `aphrody-brand` lit `packages/design/tokens/tokens.json` (49 rôles, six modes, Material Color Utilities 0.4.0), source unique du système `ui-system` |
| 10 | Licence de Google Sans Flex | Vérifiée : OFL 1.1 sans Reserved Font Name (`google/fonts` `ofl/googlesansflex`, commit `bd8f81dd`), texte vectorisé, marque non reprise (assets/brand/LICENSE) |
| 11 | Échelles typo et mouvement | Couvert par `packages/design` (typescale, motion, state) |
| 12 | Format DESIGN.md alpha | DESIGN.md unique : `packages/design/DESIGN.md` (format de `third_party/design-md/docs/spec.md`) ; `aphrody-brand` ne génère plus de DESIGN.md ni de tokens |
| 13 | Chiffres figés des cartes | Date et source imprimées sur la carte ; régénération par `bun docs/profile/stats.ts` puis `ay brand build` |
| 14 | `<picture>`, `alt`, `<title>` | Corrigé : `<title>` ajouté aux cartes de stats ; `<picture>` et `alt` déjà présents |
| 15 | auth.aphrody.com comme contact | Maintenu : contact public exigé par le propriétaire (connexion Aphrody OAuth) |
| 16 | État des PR à générer depuis l'API | `docs/profile/stats.json` garde l'état ; tableau daté du 2026-11-13 |
| 17 | CV anonyme et trous TODO | Voulu : vitrine sans identité civile ; champs TODO(owner) visibles jusqu'à décision du propriétaire ; aucun chemin local |
| 18 | « 100 % originaux » contre Material Symbols | Formulation exacte déjà dans assets/brand/LICENSE et symbols/NOTICE |
| 19 | Encoche bruyante en petite taille | Corrigé avec 1 et 8 |
| 20 | Critères d'acceptation | Tests de la crate : contraste du glyphe sur 24 teintes, lecture ICO, gabarits, rendu ; `cargo test -p aphrody-brand` vert sur fr1 |
