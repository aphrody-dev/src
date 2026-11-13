# Material 3 — mouvement

Vérifié le 2026-11-13. Contenu m3.material.io : propriétaire (conditions Google), règles reformulées, seules les valeurs factuelles sont reprises. Valeurs de tokens : sources Apache-2.0 citées. Version machine : [material-3.json](material-3.json) (schéma [spec.schema.json](../spec.schema.json)).

## Sources

- https://github.com/material-components/material-web/blob/37aa14b843dcaeb3a46f898679fa6fcd109b1905/tokens/versions/latest/sass/_md-sys-motion.scss — Apache-2.0
- https://github.com/androidx/androidx/blob/d63050babdc5d58081a3d3f3e0f9454e027ea5bf/compose/material3/material3/src/commonMain/kotlin/androidx/compose/material3/tokens/StandardMotionTokens.kt — Apache-2.0
- https://github.com/androidx/androidx/blob/d63050babdc5d58081a3d3f3e0f9454e027ea5bf/compose/material3/material3/src/commonMain/kotlin/androidx/compose/material3/tokens/ExpressiveMotionTokens.kt — Apache-2.0
- https://m3.material.io/styles/motion/overview/how-it-works — Google Terms of Service (propriétaire, reformulé ; valeurs factuelles seules)
- https://m3.material.io/styles/motion/overview/specs — Google Terms of Service (propriétaire, reformulé ; valeurs factuelles seules)
- https://m3.material.io/styles/motion/easing-and-duration/tokens-specs — Google Terms of Service (propriétaire, reformulé ; valeurs factuelles seules)
- https://m3.material.io/styles/motion/easing-and-duration/applying-easing-and-duration — Google Terms of Service (propriétaire, reformulé ; valeurs factuelles seules)
- https://m3.material.io/styles/motion/transitions/transition-patterns — Google Terms of Service (propriétaire, reformulé ; valeurs factuelles seules)
- https://m3.material.io/styles/motion/transitions/applying-transitions — Google Terms of Service (propriétaire, reformulé ; valeurs factuelles seules)

## Règles

- `m3.motion.springs-first` (SHOULD) Animer les composants et interactions avec le système physique à ressorts (M3 Expressive, mai 2025) ; le couple easing + durée reste un repli, encore employé pour les transitions de page, mais n'évolue plus. — [source](https://m3.material.io/styles/motion/overview/how-it-works)
- `m3.motion.scheme` (SHOULD) Choisir un schéma de mouvement au niveau du produit : expressive (rebond, défaut recommandé, moments clés) ou standard (sans rebond marqué, produits utilitaires) ; les tokens de ressort ne portent pas le nom du schéma. — [source](https://m3.material.io/styles/motion/overview/how-it-works)
- `m3.motion.spatial-vs-effects` (MUST) Ressorts spatial pour position, taille, rotation et rayon d'angle (dépassement autorisé) ; ressorts effects pour couleur et opacité (aucun dépassement, amortissement 1). — [source](https://m3.material.io/styles/motion/overview/how-it-works)
- `m3.motion.speed` (SHOULD) Vitesse default par défaut ; fast pour les petits éléments (bouton, switch) ; slow pour les animations plein écran. — [source](https://m3.material.io/styles/motion/overview/how-it-works)
- `m3.motion.component-defaults` (SHOULD) Le mouvement interne des composants repose sur les deux ressorts fast-spatial et fast-effects du schéma courant. — [source](https://m3.material.io/styles/motion/overview/how-it-works)
- `m3.motion.web-curves` (MAY) Sur le web sans moteur de ressorts, approcher chaque ressort par la courbe de Bézier et la durée de conversion publiées, uniquement pour les animations non interrompues et sans geste. — [source](https://m3.material.io/styles/motion/overview/specs)
- `m3.motion.easing-pairs` (SHOULD) En repli easing + durée : emphasized pour les transitions principales, standard pour les petites transitions utilitaires ; decelerate à l'entrée, accelerate à la sortie, selon les couples de référence. — [source](https://m3.material.io/styles/motion/easing-and-duration/applying-easing-and-duration)
- `m3.motion.css-emphasized-fallback` (MUST) En CSS, emphasized (courbe à deux segments) n'existe pas en cubic-bezier : utiliser standard en repli, ou une fonction linear() échantillonnée. — [source](https://m3.material.io/styles/motion/easing-and-duration/tokens-specs)
- `m3.motion.transition-patterns` (SHOULD) Choisir le motif de transition selon la relation entre vues : transformation de conteneur, avant/arrière, latéral, niveau supérieur, entrée/sortie ; squelettes pour le chargement. — [source](https://m3.material.io/styles/motion/transitions/transition-patterns)
- `m3.motion.reduced-motion` (MUST) Respecter la préférence de réduction des animations (prefers-reduced-motion, réglage OS) : remplacer déplacements et rebonds par un fondu court ou un changement immédiat. — [source](https://m3.material.io/styles/motion/transitions/applying-transitions)

## Ressorts (androidx tokens v0_14_0)

| token | standard amortissement / raideur | expressive amortissement / raideur | courbe web expressive | courbe web standard |
|---|---|---|---|---|
| md.sys.motion.spring.fast.spatial | 0.9 / 1400 | 0.6 / 800 | cubic-bezier(0.42, 1.67, 0.21, 0.90), 350ms | cubic-bezier(0.27, 1.06, 0.18, 1.00), 350ms |
| md.sys.motion.spring.fast.effects | 1 / 3800 | 1 / 3800 | cubic-bezier(0.31, 0.94, 0.34, 1.00), 150ms | cubic-bezier(0.31, 0.94, 0.34, 1.00), 150ms |
| md.sys.motion.spring.default.spatial | 0.9 / 700 | 0.8 / 380 | cubic-bezier(0.38, 1.21, 0.22, 1.00), 500ms | cubic-bezier(0.27, 1.06, 0.18, 1.00), 500ms |
| md.sys.motion.spring.default.effects | 1 / 1600 | 1 / 1600 | cubic-bezier(0.34, 0.80, 0.34, 1.00), 200ms | cubic-bezier(0.34, 0.80, 0.34, 1.00), 200ms |
| md.sys.motion.spring.slow.spatial | 0.9 / 300 | 0.8 / 200 | cubic-bezier(0.39, 1.29, 0.35, 0.98), 650ms | cubic-bezier(0.27, 1.06, 0.18, 1.00), 750ms |
| md.sys.motion.spring.slow.effects | 1 / 800 | 1 / 800 | cubic-bezier(0.34, 0.88, 0.34, 1.00), 300ms | cubic-bezier(0.34, 0.88, 0.34, 1.00), 300ms |

## Easing

| token | valeur |
|---|---|
| easing-emphasized-accelerate | cubic-bezier(0.3, 0, 0.8, 0.15) |
| easing-emphasized-decelerate | cubic-bezier(0.05, 0.7, 0.1, 1) |
| easing-legacy | cubic-bezier(0.4, 0, 0.2, 1) |
| easing-legacy-accelerate | cubic-bezier(0.4, 0, 1, 1) |
| easing-legacy-decelerate | cubic-bezier(0, 0, 0.2, 1) |
| easing-linear | cubic-bezier(0, 0, 1, 1) |
| easing-standard | cubic-bezier(0.2, 0, 0, 1) |
| easing-standard-accelerate | cubic-bezier(0.3, 0, 1, 1) |
| easing-standard-decelerate | cubic-bezier(0, 0, 0, 1) |
| easing-emphasized | path M 0,0 C 0.05,0 0.133333,0.06 0.166666,0.4 C 0.208333,0.82 0.25,1 1,1 (repli CSS : easing-standard) |

## Durées

| token | valeur |
|---|---|
| duration-short1 | 50ms |
| duration-short2 | 100ms |
| duration-short3 | 150ms |
| duration-short4 | 200ms |
| duration-medium1 | 250ms |
| duration-medium2 | 300ms |
| duration-medium3 | 350ms |
| duration-medium4 | 400ms |
| duration-long1 | 450ms |
| duration-long2 | 500ms |
| duration-long3 | 550ms |
| duration-long4 | 600ms |
| duration-extra-long1 | 700ms |
| duration-extra-long2 | 800ms |
| duration-extra-long3 | 900ms |
| duration-extra-long4 | 1000ms |

## Couples easing + durée

| easing | durée | usage |
|---|---|---|
| emphasized | 500ms | début et fin à l'écran |
| emphasized-decelerate | 400ms | entrée à l'écran |
| emphasized-accelerate | 200ms | sortie de l'écran |
| standard | 300ms | début et fin à l'écran |
| standard-decelerate | 250ms | entrée à l'écran |
| standard-accelerate | 200ms | sortie de l'écran |
