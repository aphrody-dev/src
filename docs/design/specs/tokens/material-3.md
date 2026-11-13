# Material 3 — tokens

Vérifié le 2026-11-13. Contenu m3.material.io : propriétaire (conditions Google), règles reformulées, seules les valeurs factuelles sont reprises. Valeurs de tokens : sources Apache-2.0 citées. Version machine : [material-3.json](material-3.json) (schéma [spec.schema.json](../spec.schema.json)).

## Sources

- https://github.com/material-components/material-web/tree/37aa14b843dcaeb3a46f898679fa6fcd109b1905/tokens/versions/latest/sass — Apache-2.0
- https://github.com/aphrody-labs/src/tree/main/packages/google-design/upstream/material-color-utilities/typescript/dynamiccolor/color_spec_2021.ts — Apache-2.0
- https://m3.material.io/styles/color/roles — Google Terms of Service (propriétaire, reformulé ; valeurs factuelles seules)
- https://m3.material.io/styles/color/system/how-the-system-works — Google Terms of Service (propriétaire, reformulé ; valeurs factuelles seules)
- https://m3.material.io/styles/color/choosing-a-scheme — Google Terms of Service (propriétaire, reformulé ; valeurs factuelles seules)
- https://m3.material.io/styles/color/static/baseline — Google Terms of Service (propriétaire, reformulé ; valeurs factuelles seules)
- https://m3.material.io/styles/typography/type-scale-tokens — Google Terms of Service (propriétaire, reformulé ; valeurs factuelles seules)
- https://m3.material.io/styles/shape/corner-radius-scale — Google Terms of Service (propriétaire, reformulé ; valeurs factuelles seules)
- https://m3.material.io/styles/elevation/tokens — Google Terms of Service (propriétaire, reformulé ; valeurs factuelles seules)
- https://m3.material.io/styles/elevation/applying-elevation — Google Terms of Service (propriétaire, reformulé ; valeurs factuelles seules)
- https://m3.material.io/foundations/interaction/states/state-layers — Google Terms of Service (propriétaire, reformulé ; valeurs factuelles seules)
- https://m3.material.io/foundations/interaction/states/applying-states — Google Terms of Service (propriétaire, reformulé ; valeurs factuelles seules)
- https://m3.material.io/styles/spacing/tokens — Google Terms of Service (propriétaire, reformulé ; valeurs factuelles seules)
- https://m3.material.io/foundations/layout/breakpoints/overview — Google Terms of Service (propriétaire, reformulé ; valeurs factuelles seules)
- https://m3.material.io/foundations/design-tokens/overview — Google Terms of Service (propriétaire, reformulé ; valeurs factuelles seules)
- https://github.com/material-components/material-web/blob/37aa14b843dcaeb3a46f898679fa6fcd109b1905/tokens/versions/latest/sass/_md-sys-color.scss — Apache-2.0
- https://github.com/material-components/material-web/blob/37aa14b843dcaeb3a46f898679fa6fcd109b1905/tokens/versions/latest/sass/_md-sys-typescale-emphasized.scss — Apache-2.0
- https://m3.material.io/foundations/writing/text-resizing — Google Terms of Service (propriétaire, reformulé ; valeurs factuelles seules)

## Règles

- `m3.tokens.consume-not-copy` (MUST) Toute couleur, typo, forme, élévation ou durée vient d'un token système (md.sys._) ou composant (md.comp._) généré par packages/design ; aucune valeur littérale recopiée dans le code produit. — [source](https://m3.material.io/foundations/design-tokens/overview)
- `m3.tokens.naming` (MUST) Nommer les tokens selon la hiérarchie md.ref (palette brute) > md.sys (rôle sémantique) > md.comp (attribut de composant) ; le code applicatif ne référence que sys ou comp, jamais ref. — [source](https://m3.material.io/foundations/design-tokens/overview)
- `m3.color.on-pairs` (MUST) Le texte et les icônes posés sur un rôle de conteneur utilisent le rôle « on-* » correspondant (on-primary sur primary, on-secondary-container sur secondary-container, etc.) ; ne jamais croiser deux rôles non appariés. — [source](https://m3.material.io/styles/color/roles)
- `m3.color.container-not-for-text` (MUST-NOT) Les rôles *-container servent de remplissage d'éléments ; ne pas les utiliser comme couleur de texte ou d'icône. — [source](https://m3.material.io/styles/color/roles)
- `m3.color.accent-emphasis` (SHOULD) Réserver primary aux actions et éléments les plus importants, secondary aux éléments moins appuyés (sélection de navigation, action de rejet), tertiary aux petits accents contrastants (badge, mise en valeur). — [source](https://m3.material.io/styles/color/roles)
- `m3.color.surface-containers` (SHOULD) Exprimer la hiérarchie de surfaces par les cinq rôles surface-container (lowest, low, default, high, highest) plutôt que par une teinte d'élévation ; surface-tint est obsolète. — [source](https://m3.material.io/styles/elevation/tokens)
- `m3.color.outline-vs-variant` (MUST) outline délimite les cibles interactives et les champs (3:1 requis) ; outline-variant sert aux séparateurs et aux bordures décoratives de conteneurs à plusieurs éléments ; ne pas inverser ces usages. — [source](https://m3.material.io/styles/color/roles)
- `m3.color.fixed-roles` (SHOULD-NOT) Éviter les rôles *-fixed là où le contraste est critique : ils restent identiques en clair et en sombre. — [source](https://m3.material.io/styles/color/roles)
- `m3.color.background-legacy` (SHOULD-NOT) background/on-background et surface-variant sont des rôles hérités ; préférer surface, on-surface et surface-container-highest. — [source](https://github.com/material-components/material-web/blob/37aa14b843dcaeb3a46f898679fa6fcd109b1905/tokens/versions/latest/sass/_md-sys-color.scss)
- `m3.color.three-contrast-levels` (MUST) Tout thème fournit les schémas clair et sombre aux trois niveaux de contraste standard (0), moyen (0.5) et élevé (1.0), générés par Material Color Utilities depuis la couleur source ; les seuils par rôle suivent les courbes de contraste MCU. — [source](https://m3.material.io/styles/color/system/how-the-system-works)
- `m3.color.dynamic-source` (MAY) La couleur source peut venir de la marque (statique) ou du contenu/fond d'écran (dynamique) ; dans les deux cas le schéma est recalculé par MCU, jamais ajusté à la main rôle par rôle. — [source](https://m3.material.io/styles/color/choosing-a-scheme)
- `m3.type.scale` (MUST) Utiliser uniquement les 15 styles de l'échelle typographique (display, headline, title, body, label × large, medium, small) ; pas de taille ad hoc. — [source](https://m3.material.io/styles/typography/type-scale-tokens)
- `m3.type.emphasized` (MAY) La variante emphasized d'un style (graisse plus forte) sert à mettre en valeur un texte ponctuel sans changer de taille. — [source](https://github.com/material-components/material-web/blob/37aa14b843dcaeb3a46f898679fa6fcd109b1905/tokens/versions/latest/sass/_md-sys-typescale-emphasized.scss)
- `m3.type.rem` (MUST) Exprimer tailles, interlignes et approche en rem (ou sp) pour suivre le réglage de taille de texte de l'utilisateur. — [source](https://m3.material.io/foundations/writing/text-resizing)
- `m3.shape.scale` (MUST) Les rayons d'angle proviennent de l'échelle de formes (none à full) ; pas de rayon libre. — [source](https://m3.material.io/styles/shape/corner-radius-scale)
- `m3.elevation.levels` (MUST) N'employer que les six niveaux d'élévation 0 à 5 ; garder peu de niveaux distincts pour que l'ombre conserve son pouvoir d'attirer l'attention. — [source](https://m3.material.io/styles/elevation/applying-elevation)
- `m3.elevation.shadow-or-tone` (SHOULD) Rendre l'élévation par l'ombre seulement quand la séparation des surfaces l'exige ; sinon par écart de ton (surface-container-*) ou par voile (scrim). — [source](https://m3.material.io/styles/elevation/applying-elevation)
- `m3.state.layer-opacity` (MUST) Les états hover, focus, pressed et dragged se rendent par une couche d'état de la couleur du contenu (rôle on-*) à opacité fixe, posée entre conteneur et contenu. — [source](https://m3.material.io/foundations/interaction/states/state-layers)
- `m3.state.disabled` (MUST) Un élément désactivé applique l'opacité désactivée au contenu (et un conteneur atténué), ne reçoit ni focus, ni survol, ni appui, et n'a pas à atteindre les seuils de contraste. — [source](https://m3.material.io/foundations/interaction/states/applying-states)
- `m3.state.single-instance` (MUST) Au plus un élément en état focus, un en pressed et un en dragged à la fois dans une mise en page. — [source](https://m3.material.io/foundations/interaction/states/applying-states)
- `m3.state.layer-size` (SHOULD) Pour une icône ou un contrôle compact, la couche d'état fait 40dp alors que la cible interactive fait 48dp. — [source](https://m3.material.io/foundations/interaction/states/state-layers)
- `m3.spacing.scale` (SHOULD) Espacements pris sur l'échelle de base 8dp (avec sous-unités 2, 4, 6, 10, 12, 14dp) ; nommer les espacements de composant en padding/margin/gap avec positions leading/trailing/top/bottom. — [source](https://m3.material.io/styles/spacing/tokens)
- `m3.layout.breakpoints` (MUST) La mise en page s'adapte aux cinq classes de largeur de fenêtre (compact, medium, expanded, large, extra-large) avec leurs marges et nombre de volets. — [source](https://m3.material.io/foundations/layout/breakpoints/overview)

## Rôles de couleur (schéma de référence material-web 34.0.21)

Ton de référence (palette.ton) et hex du schéma de base, clair / sombre / contraste moyen / contraste élevé.

| rôle                       | clair                     | sombre                    | clair moyen               | sombre moyen              | clair élevé               | sombre élevé              |
| -------------------------- | ------------------------- | ------------------------- | ------------------------- | ------------------------- | ------------------------- | ------------------------- |
| background                 | neutral98 #fef7ff         | neutral6 #141218          | neutral98 #fef7ff         | neutral6 #141218          | neutral98 #fef7ff         | neutral6 #141218          |
| error                      | error40 #b3261e           | error80 #f2b8b5           | error30 #8c1d18           | error90 #f9dedc           | error20 #601410           | error95 #fceeee           |
| error-container            | error90 #f9dedc           | error30 #8c1d18           | error40 #b3261e           | error60 #e46962           | error30 #8c1d18           | error80 #f2b8b5           |
| inverse-on-surface         | neutral95 #f5eff7         | neutral20 #322f35         | neutral100 #fff           | neutral10 #1d1b20         | neutral100 #fff           | neutral0 #000             |
| inverse-primary            | primary80 #d0bcff         | primary40 #6750a4         | primary80 #d0bcff         | primary30 #4f378b         | primary80 #d0bcff         | primary20 #381e72         |
| inverse-surface            | neutral20 #322f35         | neutral90 #e6e0e9         | neutral20 #322f35         | neutral90 #e6e0e9         | neutral20 #322f35         | neutral90 #e6e0e9         |
| on-background              | neutral10 #1d1b20         | neutral90 #e6e0e9         | neutral0 #000             | neutral100 #fff           | neutral0 #000             | neutral100 #fff           |
| on-error                   | error100 #fff             | error20 #601410           | error100 #fff             | error10 #410e0b           | error100 #fff             | error0 #000               |
| on-error-container         | error30 #8c1d18           | error90 #f9dedc           | error100 #fff             | error0 #000               | error100 #fff             | error0 #000               |
| on-primary                 | primary100 #fff           | primary20 #381e72         | primary100 #fff           | primary10 #21005d         | primary100 #fff           | primary0 #000             |
| on-primary-container       | primary30 #4f378b         | primary90 #eaddff         | primary100 #fff           | primary0 #000             | primary100 #fff           | primary0 #000             |
| on-primary-fixed           | primary10 #21005d         | primary10 #21005d         | primary100 #fff           | primary0 #000             | primary100 #fff           | primary0 #000             |
| on-primary-fixed-variant   | primary30 #4f378b         | primary30 #4f378b         | primary100 #fff           | primary20 #381e72         | primary100 #fff           | primary0 #000             |
| on-secondary               | secondary100 #fff         | secondary20 #332d41       | secondary100 #fff         | secondary10 #1d192b       | secondary100 #fff         | secondary0 #000           |
| on-secondary-container     | secondary30 #4a4458       | secondary90 #e8def8       | secondary100 #fff         | secondary0 #000           | secondary100 #fff         | secondary0 #000           |
| on-secondary-fixed         | secondary10 #1d192b       | secondary10 #1d192b       | secondary100 #fff         | secondary0 #000           | secondary100 #fff         | secondary0 #000           |
| on-secondary-fixed-variant | secondary30 #4a4458       | secondary30 #4a4458       | secondary100 #fff         | secondary20 #332d41       | secondary100 #fff         | secondary0 #000           |
| on-surface                 | neutral10 #1d1b20         | neutral90 #e6e0e9         | neutral0 #000             | neutral100 #fff           | neutral0 #000             | neutral100 #fff           |
| on-surface-variant         | neutral-variant30 #49454f | neutral-variant80 #cac4d0 | neutral-variant20 #322f37 | neutral-variant90 #e7e0ec | neutral-variant0 #000     | neutral-variant100 #fff   |
| on-tertiary                | tertiary100 #fff          | tertiary20 #492532        | tertiary100 #fff          | tertiary10 #31111d        | tertiary100 #fff          | tertiary0 #000            |
| on-tertiary-container      | tertiary30 #633b48        | tertiary90 #ffd8e4        | tertiary100 #fff          | tertiary0 #000            | tertiary100 #fff          | tertiary0 #000            |
| on-tertiary-fixed          | tertiary10 #31111d        | tertiary10 #31111d        | tertiary100 #fff          | tertiary0 #000            | tertiary100 #fff          | tertiary0 #000            |
| on-tertiary-fixed-variant  | tertiary30 #633b48        | tertiary30 #633b48        | tertiary100 #fff          | tertiary20 #492532        | tertiary100 #fff          | tertiary0 #000            |
| outline                    | neutral-variant50 #79747e | neutral-variant60 #938f99 | neutral-variant30 #49454f | neutral-variant70 #aea9b4 | neutral-variant20 #322f37 | neutral-variant95 #f5eefa |
| outline-variant            | neutral-variant80 #cac4d0 | neutral-variant30 #49454f | neutral-variant50 #79747e | neutral-variant60 #938f99 | neutral-variant30 #49454f | neutral-variant80 #cac4d0 |
| primary                    | primary40 #6750a4         | primary80 #d0bcff         | primary30 #4f378b         | primary90 #eaddff         | primary20 #381e72         | primary95 #f6edff         |
| primary-container          | primary90 #eaddff         | primary30 #4f378b         | primary40 #6750a4         | primary60 #9a82db         | primary30 #4f378b         | primary80 #d0bcff         |
| primary-fixed              | primary90 #eaddff         | primary90 #eaddff         | primary40 #6750a4         | primary90 #eaddff         | primary30 #4f378b         | primary90 #eaddff         |
| primary-fixed-dim          | primary80 #d0bcff         | primary80 #d0bcff         | primary30 #4f378b         | primary80 #d0bcff         | primary20 #381e72         | primary80 #d0bcff         |
| scrim                      | neutral0 #000             | neutral0 #000             | neutral0 #000             | neutral0 #000             | neutral0 #000             | neutral0 #000             |
| secondary                  | secondary40 #625b71       | secondary80 #ccc2dc       | secondary30 #4a4458       | secondary90 #e8def8       | secondary20 #332d41       | secondary95 #f6edff       |
| secondary-container        | secondary90 #e8def8       | secondary30 #4a4458       | secondary40 #625b71       | secondary60 #958da5       | secondary30 #4a4458       | secondary80 #ccc2dc       |
| secondary-fixed            | secondary90 #e8def8       | secondary90 #e8def8       | secondary40 #625b71       | secondary90 #e8def8       | secondary30 #4a4458       | secondary90 #e8def8       |
| secondary-fixed-dim        | secondary80 #ccc2dc       | secondary80 #ccc2dc       | secondary30 #4a4458       | secondary80 #ccc2dc       | secondary20 #332d41       | secondary80 #ccc2dc       |
| shadow                     | neutral0 #000             | neutral0 #000             | neutral0 #000             | neutral0 #000             | neutral0 #000             | neutral0 #000             |
| surface                    | neutral98 #fef7ff         | neutral6 #141218          | neutral98 #fef7ff         | neutral6 #141218          | neutral98 #fef7ff         | neutral6 #141218          |
| surface-bright             | neutral98 #fef7ff         | neutral24 #3b383e         | neutral98 #fef7ff         | neutral24 #3b383e         | neutral98 #fef7ff         | neutral24 #3b383e         |
| surface-container          | neutral94 #f3edf7         | neutral12 #211f26         | neutral94 #f3edf7         | neutral12 #211f26         | neutral94 #f3edf7         | neutral12 #211f26         |
| surface-container-high     | neutral92 #ece6f0         | neutral17 #2b2930         | neutral92 #ece6f0         | neutral17 #2b2930         | neutral92 #ece6f0         | neutral17 #2b2930         |
| surface-container-highest  | neutral90 #e6e0e9         | neutral22 #36343b         | neutral90 #e6e0e9         | neutral22 #36343b         | neutral90 #e6e0e9         | neutral22 #36343b         |
| surface-container-low      | neutral96 #f7f2fa         | neutral10 #1d1b20         | neutral96 #f7f2fa         | neutral10 #1d1b20         | neutral96 #f7f2fa         | neutral10 #1d1b20         |
| surface-container-lowest   | neutral100 #fff           | neutral4 #0f0d13          | neutral100 #fff           | neutral4 #0f0d13          | neutral100 #fff           | neutral4 #0f0d13          |
| surface-dim                | neutral87 #ded8e1         | neutral6 #141218          | neutral87 #ded8e1         | neutral6 #141218          | neutral87 #ded8e1         | neutral6 #141218          |
| surface-tint               | primary #6750a4           | primary #d0bcff           | primary #4f378b           | primary #eaddff           | primary #381e72           | primary #f6edff           |
| surface-variant            | neutral-variant90 #e7e0ec | neutral-variant30 #49454f | neutral-variant90 #e7e0ec | neutral-variant30 #49454f | neutral-variant90 #e7e0ec | neutral-variant30 #49454f |
| tertiary                   | tertiary40 #7d5260        | tertiary80 #efb8c8        | tertiary30 #633b48        | tertiary90 #ffd8e4        | tertiary20 #492532        | tertiary95 #ffecf1        |
| tertiary-container         | tertiary90 #ffd8e4        | tertiary30 #633b48        | tertiary40 #7d5260        | tertiary60 #b58392        | tertiary30 #633b48        | tertiary80 #efb8c8        |
| tertiary-fixed             | tertiary90 #ffd8e4        | tertiary90 #ffd8e4        | tertiary40 #7d5260        | tertiary90 #ffd8e4        | tertiary30 #633b48        | tertiary90 #ffd8e4        |
| tertiary-fixed-dim         | tertiary80 #efb8c8        | tertiary80 #efb8c8        | tertiary30 #633b48        | tertiary80 #efb8c8        | tertiary20 #492532        | tertiary80 #efb8c8        |

## Paires on-*

| contenu                    | conteneur                                                 |
| -------------------------- | --------------------------------------------------------- |
| on-background              | background                                                |
| on-error                   | error                                                     |
| on-error-container         | error-container                                           |
| on-primary                 | primary                                                   |
| on-primary-container       | primary-container                                         |
| on-primary-fixed           | primary-fixed / primary-fixed-dim                         |
| on-primary-fixed-variant   | primary-fixed / primary-fixed-dim                         |
| on-secondary               | secondary                                                 |
| on-secondary-container     | secondary-container                                       |
| on-secondary-fixed         | secondary-fixed / secondary-fixed-dim                     |
| on-secondary-fixed-variant | secondary-fixed / secondary-fixed-dim                     |
| on-surface                 | surface, surface-dim, surface-bright, surface-container-* |
| on-surface-variant         | surface-container-highest (ou tout surface-*)             |
| on-tertiary                | tertiary                                                  |
| on-tertiary-container      | tertiary-container                                        |
| on-tertiary-fixed          | tertiary-fixed / tertiary-fixed-dim                       |
| on-tertiary-fixed-variant  | tertiary-fixed / tertiary-fixed-dim                       |
| inverse-on-surface         | inverse-surface                                           |
| inverse-primary            | inverse-surface                                           |

## Courbes de contraste MCU (color_spec_2021, ratio visé contre le fond)

| rôle                       | fond                | bas (-1) | standard (0) | moyen (0.5) | élevé (1) |
| -------------------------- | ------------------- | -------- | ------------ | ----------- | --------- |
| on-background              | background          | 3        | 3            | 4.5         | 7         |
| on-surface                 | highest-surface     | 4.5      | 7            | 11          | 21        |
| on-surface-variant         | highest-surface     | 3        | 4.5          | 7           | 11        |
| inverse-on-surface         | inverse-surface     | 4.5      | 7            | 11          | 21        |
| outline                    | highest-surface     | 1.5      | 3            | 4.5         | 7         |
| outline-variant            | highest-surface     | 1        | 1            | 3           | 4.5       |
| primary                    | highest-surface     | 3        | 4.5          | 7           | 7         |
| on-primary                 | primary             | 4.5      | 7            | 11          | 21        |
| primary-container          | highest-surface     | 1        | 1            | 3           | 4.5       |
| on-primary-container       | primary-container   | 3        | 4.5          | 7           | 11        |
| inverse-primary            | inverse-surface     | 3        | 4.5          | 7           | 7         |
| secondary                  | highest-surface     | 3        | 4.5          | 7           | 7         |
| on-secondary               | secondary           | 4.5      | 7            | 11          | 21        |
| secondary-container        | highest-surface     | 1        | 1            | 3           | 4.5       |
| on-secondary-container     | secondary-container | 3        | 4.5          | 7           | 11        |
| tertiary                   | highest-surface     | 3        | 4.5          | 7           | 7         |
| on-tertiary                | tertiary            | 4.5      | 7            | 11          | 21        |
| tertiary-container         | highest-surface     | 1        | 1            | 3           | 4.5       |
| on-tertiary-container      | tertiary-container  | 3        | 4.5          | 7           | 11        |
| error                      | highest-surface     | 3        | 4.5          | 7           | 7         |
| on-error                   | error               | 4.5      | 7            | 11          | 21        |
| error-container            | highest-surface     | 1        | 1            | 3           | 4.5       |
| on-error-container         | error-container     | 3        | 4.5          | 7           | 11        |
| primary-fixed              | highest-surface     | 1        | 1            | 3           | 4.5       |
| primary-fixed-dim          | highest-surface     | 1        | 1            | 3           | 4.5       |
| on-primary-fixed           | primary-fixed-dim   | 4.5      | 7            | 11          | 21        |
| on-primary-fixed-variant   | primary-fixed-dim   | 3        | 4.5          | 7           | 11        |
| secondary-fixed            | highest-surface     | 1        | 1            | 3           | 4.5       |
| secondary-fixed-dim        | highest-surface     | 1        | 1            | 3           | 4.5       |
| on-secondary-fixed         | secondary-fixed-dim | 4.5      | 7            | 11          | 21        |
| on-secondary-fixed-variant | secondary-fixed-dim | 3        | 4.5          | 7           | 11        |
| tertiary-fixed             | highest-surface     | 1        | 1            | 3           | 4.5       |
| tertiary-fixed-dim         | highest-surface     | 1        | 1            | 3           | 4.5       |
| on-tertiary-fixed          | tertiary-fixed-dim  | 4.5      | 7            | 11          | 21        |
| on-tertiary-fixed-variant  | tertiary-fixed-dim  | 3        | 4.5          | 7           | 11        |

## Échelle typographique (police Roboto par défaut ; 1rem = 16px)

| style           | graisse | taille           | interligne     | approche               | opsz | graisse emphasized |
| --------------- | ------- | ---------------- | -------------- | ---------------------- | ---- | ------------------ |
| display-large   | 400     | 3.5625rem (57px) | 4rem (64px)    | -0.015625rem (-0.25px) | 57   | 500 (axe wght 500) |
| display-medium  | 400     | 2.8125rem (45px) | 3.25rem (52px) | 0rem (0px)             | 45   | 500 (axe wght 500) |
| display-small   | 400     | 2.25rem (36px)   | 2.75rem (44px) | 0rem (0px)             | 36   | 500 (axe wght 500) |
| headline-large  | 400     | 2rem (32px)      | 2.5rem (40px)  | 0rem (0px)             | 32   | 500 (axe wght 500) |
| headline-medium | 400     | 1.75rem (28px)   | 2.25rem (36px) | 0rem (0px)             | 28   | 500 (axe wght 500) |
| headline-small  | 400     | 1.5rem (24px)    | 2rem (32px)    | 0rem (0px)             | 24   | 500 (axe wght 500) |
| title-large     | 400     | 1.375rem (22px)  | 1.75rem (28px) | 0rem (0px)             | 22   | 500 (axe wght 500) |
| title-medium    | 500     | 1rem (16px)      | 1.5rem (24px)  | 0.009375rem (0.15px)   | 16   | 700 (axe wght 600) |
| title-small     | 500     | 0.875rem (14px)  | 1.25rem (20px) | 0.00625rem (0.1px)     | 14   | 700 (axe wght 600) |
| body-large      | 400     | 1rem (16px)      | 1.5rem (24px)  | 0.03125rem (0.5px)     | 16   | 500 (axe wght 500) |
| body-medium     | 400     | 0.875rem (14px)  | 1.25rem (20px) | 0.015625rem (0.25px)   | 14   | 500 (axe wght 500) |
| body-small      | 400     | 0.75rem (12px)   | 1rem (16px)    | 0.025rem (0.4px)       | 12   | 500 (axe wght 500) |
| label-large     | 500     | 0.875rem (14px)  | 1.25rem (20px) | 0.00625rem (0.1px)     | 14   | 700 (axe wght 600) |
| label-medium    | 500     | 0.75rem (12px)   | 1rem (16px)    | 0.03125rem (0.5px)     | 12   | 700 (axe wght 600) |
| label-small     | 500     | 0.6875rem (11px) | 1rem (16px)    | 0.03125rem (0.5px)     | 11   | 700 (axe wght 600) |

## Formes (rayons)

| token                        | valeur            |
| ---------------------------- | ----------------- |
| corner-extra-extra-large     | 48px              |
| corner-extra-large           | 28px              |
| corner-extra-large-increased | 32px              |
| corner-extra-large-top       | 28px 28px 0px 0px |
| corner-extra-small           | 4px               |
| corner-extra-small-top       | 4px 4px 0px 0px   |
| corner-full                  | 9999px            |
| corner-large                 | 16px              |
| corner-large-increased       | 20px              |
| corner-large-end             | 0px 16px 16px 0px |
| corner-large-start           | 16px 0px 0px 16px |
| corner-large-top             | 16px 16px 0px 0px |
| corner-medium                | 12px              |
| corner-none                  | 0px               |
| corner-small                 | 8px               |

## Élévation

| niveau | dp   |
| ------ | ---- |
| level0 | 0dp  |
| level1 | 1dp  |
| level2 | 3dp  |
| level3 | 6dp  |
| level4 | 8dp  |
| level5 | 12dp |

## Couches d'état

| token                                                   | valeur           |
| ------------------------------------------------------- | ---------------- |
| disabled-state-layer-opacity                            | 0.38             |
| dragged-state-layer-opacity                             | 0.16             |
| focus-state-layer-opacity                               | 0.1              |
| hover-state-layer-opacity                               | 0.08             |
| pressed-state-layer-opacity                             | 0.1              |
| focus-indicator thickness / outer-offset / inner-offset | 3px / 2px / -3px |

## Espacement (md.sys.measurement)

| token    | valeur |
| -------- | ------ |
| space0   | 0dp    |
| space25  | 2dp    |
| space50  | 4dp    |
| space75  | 6dp    |
| space100 | 8dp    |
| space125 | 10dp   |
| space150 | 12dp   |
| space175 | 14dp   |
| space200 | 16dp   |
| space250 | 20dp   |
| space300 | 24dp   |
| space400 | 32dp   |
| space450 | 36dp   |
| space500 | 40dp   |
| space600 | 48dp   |
| space700 | 56dp   |
| space800 | 64dp   |
| space900 | 72dp   |

## Classes de largeur

| classe      | largeur     | marge | espaceur | volets |
| ----------- | ----------- | ----- | -------- | ------ |
| compact     | < 600dp     | 16dp  | —        | 1      |
| medium      | 600–839dp   | 24dp  | 24dp     | 1      |
| expanded    | 840–1199dp  | 24dp  | 24dp     | 1–2    |
| large       | 1200–1599dp | 24dp  | 24dp     | 2      |
| extra-large | >= 1600dp   | 24dp  | 24dp     | 2–3    |
