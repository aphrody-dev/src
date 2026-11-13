---
name: ui-ux-pro-max
description: Base de connaissances UI/UX interrogeable (BM25, bun) - 120 règles UX et accessibilité, règles d'interface app/native, styles, types de produit, structures de landing, choix de graphiques, familles Google Fonts filtrables OFL, règles three.js et WinUI. Utiliser après ui-system pour décider d'une structure, d'un style ou d'un état d'interaction, et pour la checklist avant livraison. Absorbe nextlevelbuilder/ui-ux-pro-max-skill (MIT) réécrit pour bun et la pile src.
license: MIT
metadata:
  upstream: "nextlevelbuilder/ui-ux-pro-max-skill@6ae86f61f520 (fork aphrody-labs/ui-ux-pro-max-skill)"
---

# ui-ux-pro-max

Conseils, jamais autorité : `ui-system` (tokens M3, Material Web, GPUI, WebUI, Zig) gagne en cas de conflit. Aucune couleur, police ni classe Tailwind des résultats n'est recopiée ; une suggestion de style ou de palette se traduit en variante M3 (`brand.toml`) ou en composition, pas en CSS maison.

## Recherche

```bash
S=C:/src/.agents/skills/ui-ux-pro-max/scripts/search.ts
bun $S "developer tool dashboard dark" --brief          # produit + style + landing + ux + chart (1 résultat chacun)
bun $S "keyboard focus modal" --domain ux               # une préoccupation = un domaine
bun $S "geometric sans variable" --domain google-fonts --ofl
bun $S "dispose memory" --stack threejs                 # piles : threejs, winui
bun $S "<requête>" --json -n 5
```

Domaines : `ux` (règles UX/a11y, défaut), `web` (interface app/native : zones sûres, cibles tactiles), `style`, `product`, `landing`, `chart`, `google-fonts`. Requête courte (2 à 5 termes, une intention). Zéro résultat : une seule reformulation ou un `--domain` explicite, puis dire qu'aucune donnée ne correspond ; ne rien inventer.

## Correspondance avec la pile

| Résultat upstream | Traduction src |
|---|---|
| Palette, couleur hex, « Primary » | rôle M3 `--md-sys-color-*` ; teinte de marque = `assets/brand/brand.toml` |
| Paire de polices, Tailwind config | Google Sans Flex (marque) ; `google-fonts --ofl` seulement pour une famille secondaire, livrée en woff2 depuis un fork OFL |
| Icônes (Lucide, Heroicons, Phosphor) | Material Symbols Rounded (`<md-icon>`) |
| Code React/Next/shadcn/Tailwind | Material Web (`<md-*>`) servi par bun, GPUI ou WebUI ; garder la règle, réécrire l'exemple |
| GSAP, Framer Motion | `--md-sys-motion-*`, View Transitions, `prefers-reduced-motion` |
| `--stack threejs` | complète la skill `threejs-webgpu` |
| `--stack winui` | desktop Windows seulement si la surface relève de nt (WinUI 3) |

## Priorités (ordre de vérification)

1. Accessibilité : contraste 4,5:1 (AA vérifié par `bun test --cwd packages/design`), focus visible, libellés, clavier.
2. Interaction : cibles 44x44 px min (48 dp en M3), retour de chargement, pas d'état au survol seul.
3. Performance : objectifs internes src CLS 0, LCP < 1,2 s, INP < 50 ms (seuils « bons » Core Web Vitals : LCP 2,5 s, INP 200 ms, CLS 0,1) ; espace réservé aux médias.

Scores BM25 non comparables d'un domaine à l'autre : `--brief` juxtapose, ne classe pas.
4. Style : un seul langage visuel par surface, cohérent avec le type de produit (`--domain product`).
5. Mise en page : mobile d'abord, aucun défilement horizontal, zoom jamais bloqué.
6. Typographie et couleur : 16 px de base, interligne 1,5, tokens sémantiques seuls.
7. Mouvement : sens porté par l'animation, sortie plus rapide que l'entrée, mouvement réduit respecté.
8. Formulaires : libellé visible, erreur au champ, aide en ligne.
9. Navigation : retour prévisible, liens profonds, 5 entrées max en barre basse.
10. Graphiques : légende, infobulles, sens jamais porté par la couleur seule (skill `dataviz` pour le rendu).

Texte complet des règles : `references/quick-reference.md` ; règles d'app et checklist avant livraison : `references/pro-rules.md` (upstream, anglais).

## Avant livraison

Parcourir la checklist de `references/pro-rules.md`, puis `gds audit-slop <chemin>` et la skill `humanizer` sur le texte d'interface, puis revue Gemini (`mcp__relay__gemini_review`), verdict dans `docs/reviews/`.

## Données

`data/` : sous-ensemble upstream (MIT, `LICENSE`) - `ux-guidelines`, `app-interface`, `styles`, `products`, `landing`, `charts`, `google-fonts` (+ `google-font-licenses.json`, révision google/fonts `038b637d`), `stacks/threejs`, `stacks/winui`, `data-provenance.json`. Retirés car hors pile : palettes hex, paires Tailwind, icônes tierces, GSAP, performance React, piles web JS. Mise à jour : `git -C C:/src/third_party/ui-ux-pro-max-skill pull`, recopier les mêmes fichiers.
