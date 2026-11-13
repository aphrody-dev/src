# Preuves : qualité des sites, 2026-11-13

Mesures prises sur les sites en ligne avec le MCP chrome-devtools (Chromium 157) : `lighthouse_audit` en mode
mobile (accessibilité, bonnes pratiques, SEO, navigation par agents ; la performance n'est pas couverte par
cet outil) et `performance_start_trace` à froid (cache ignoré) pour LCP et CLS. Rapports bruts dans `before/`
et `after/` (`*.lighthouse.json|html`, `*.trace.json.gz`, captures `*.png`).

| Site | Avant (A11y / BP / SEO / Agents) | Avant LCP, CLS | Après (A11y / BP / SEO / Agents) | Après LCP, CLS |
|---|---|---|---|---|
| aphrody.com | 90 / 100 / 100 / 67 | 169 ms, 0,30 | 100 / 100 / 100 / 100 | 236 ms, 0,00 |
| aphrody.app | 94 / 96 / 92 / 23 | CLS 0,095 (Lighthouse) | 100 / 100 / 100 / 100 | 235 ms, 0,00 |
| yolo.aphrody.app | 100 / 100 / 100 / 100 (1 audit en échec) | | 100 / 100 / 100 / 100 (0 échec) | |
| rosegriffon.fr | 100 / 100 / 100 / 100 | 972 ms, 0,37 à 768 px (0,47 dans une fenêtre medium) | 100 / 100 / 100 / 100 | 954 ms, 0,03 à 768 px |
| cdn.rosegriffon.fr | non auditable : la racine répond 404 (CDN de fichiers, pas de page) | | inchangé | |

## Causes et corrections

- aphrody.com, CLS 0,30 : échange tardif de Google Sans Flex (`display=swap`). Passé en `display=optional`
  (`packages/deploy/src/m3.ts`). Listes Material Web (`md-list-item` avec `role="listitem"` sans parent `list`
  pour axe) remplacées par des listes M3 natives ; `<dl>` corrigé ; `og:image` pointait vers un `.jpg` absent.
- aphrody.app : `robots.txt` illisible pour Lighthouse (CSP sans `connect-src`), `favicon.ico` en 404, mêmes
  listes Material Web, CLS dû à l'amélioration tardive des boutons (boîte réservée par `:not(:defined)`).
- yolo : bouton de thème avec un `aria-label` différent du texte visible (WCAG 2.5.3).
- rosegriffon.fr : en classe « medium » (600-839 px), l'espace de la barre latérale rendu côté serveur se
  refermait à l'hydratation et la marge du rail arrivait après coup. Les deux réserves passent en CSS.

Pas de capture d'écran pour rosegriffon.fr dans ce dépôt public : l'accueil montre des illustrations de
personnages tiers ; la preuve est le rapport Lighthouse et la trace (`after/rosegriffon.fr.*`). Déployé :
image `rosegriffon/website:5ba78be4` sur prd, seul le conteneur website recréé (`--no-deps`).

Contenu public réécrit sans aucune mention technique (ordre du propriétaire) ; textes passés au humanizer
(`gds audit-slop` : 0 constat sur aphrody.com fr/en et aphrody.app).

## Maquettes

- Figma : fichier « Aphrody sites - M3 (aphrody.com, aphrody.app) », https://www.figma.com/design/HCD0QhzvkvMIjnffaxg7T8
  (aphrody.com en français à 768 px, nœud 1:2 ; en anglais à 1280 px, nœud 2:2), capturés depuis le build local
  `apps/aphrody/dist` par le script de capture Figma.
- Stitch : projet 15555120843463058326 avec le système de design « Aphrody M3 » (graine #3355FF, variante
  vibrante, tertiaire #FFB300, Google Sans Flex, coins 12). Les deux générations d'écran (aphrody.com bureau,
  aphrody.app mobile) ont expiré côté relais sans produire d'écran.
