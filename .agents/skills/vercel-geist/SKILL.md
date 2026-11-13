---
name: vercel-geist
description: Référence Geist (système de design de Vercel) et bonnes pratiques de performance front de Vercel, réécrites en specs dans docs/design/specs. Utiliser pour évaluer ou concevoir une interface web dense et typographique (échelles de couleurs à rôles fixes, classes de texte, matériaux, grille, états et accessibilité des composants), fixer des objectifs Core Web Vitals, de cache ou d'images, ou pour un produit de src qui adopte explicitement Geist. Ne remplace pas ui-system : la cible web de src reste Material 3.
---

# vercel-geist

## Statut dans src

- Cible UI web : Material 3 via la skill `ui-system` (`@aphrody/design`, Material Web, Material Symbols). Geist n'y est pas une dépendance.
- Geist sert de **référence de qualité** (densité, typographie, états, grille, accessibilité) et de cible **uniquement** pour un produit qui l'adopte explicitement (décision consignée dans son README).
- vercel.com est propriétaire (https://vercel.com/legal/terms) : ne jamais copier texte, code, image, SVG, logo ou icône. Seuls les faits (noms de tokens, échelles, valeurs) sont repris.
- Police Geist : SIL OFL 1.1 (vérifié via `gh api repos/vercel/geist-font/license`, release v1.9.2). La citer et la charger depuis sa distribution officielle ; ne pas versionner ses fichiers.

## Specs (source de vérité dans src)

| Domaine | Lisible | Machine |
|---|---|---|
| Tokens : couleurs, typo, matériaux, grille, espacements | `docs/design/specs/tokens/geist.md` | `tokens/geist.json` |
| Composants : 75 fiches (variantes, tailles, états, a11y) | `docs/design/specs/components/geist.md` | `components/geist.json` |
| Perf front : CWV, images, polices, cache, rendu | `docs/design/specs/perf/vercel-frontend.md` | `perf/vercel-frontend.json` |

Schéma : `docs/design/specs/spec.schema.json`. Index des pages lues : `docs/design/index/vercel.com.json`.

## Règles essentielles

1. Couleur : le numéro de pas fixe le rôle (100-300 fonds, 400-600 bordures, 700-800 fonds forts, 900-1000 texte). Transposer en M3 : rôles `surface*`, `outline*`, `on-surface*`, jamais de valeur Geist codée en dur (`geist.color.scale-steps`).
2. Gray opaque par défaut ; transparence seulement pour ombres et voiles ; une seule bordure par arête (`geist.color.gray-vs-alpha`).
3. Typo : styles nommés groupant taille, interlignage, approche et graisse ; Label pour une ligne, Copy pour du multiligne ; aucune taille arbitraire (`geist.type.classes`).
4. Rayons limités à 6/12/16 px selon l'élévation (`geist.material.*`).
5. Composants : chargement dans le contrôle, désactivation expliquée, icône seule nommée, focus piégé puis rendu, aria-live polite, couleur jamais seule (`geist.comp.*`).
6. Perf : LCP ≤ 2,5 s, INP ≤ 200 ms, CLS ≤ 0,1 au P75 terrain ; cache CDN explicite avec stale-while-revalidate ; images AVIF/WebP sous liste blanche (`vercel.*`).

## Liens

- Règles transverses d'interface : skill `vercel-agent-skills:web-design-guidelines` (fork aphrody-labs/agent-skills, `plugins/labs/skills/web-design-guidelines`) ; ne pas dupliquer.
- Perf web générique : skills `web-quality-skills:core-web-vitals`, `cloudflare:web-perf`.
- Sources : https://vercel.com/geist/introduction, https://vercel.com/design/guidelines, https://vercel.com/docs/speed-insights/metrics, https://github.com/vercel/geist-font.
- Relire en direct (`curl -H "Accept: text/markdown"`, ~1 requête/1,5 s) avant de citer une valeur ; mettre à jour `verified` dans les JSON.
