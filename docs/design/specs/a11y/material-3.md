# Material 3 — accessibilité

Vérifié le 2026-11-13. Contenu m3.material.io : propriétaire (conditions Google), règles reformulées, seules les valeurs factuelles sont reprises. Valeurs de tokens : sources Apache-2.0 citées. Version machine : [material-3.json](material-3.json) (schéma [spec.schema.json](../spec.schema.json)).

## Sources

- https://m3.material.io/foundations/designing/color-contrast — Google Terms of Service (propriétaire, reformulé ; valeurs factuelles seules)
- https://m3.material.io/foundations/designing/structure — Google Terms of Service (propriétaire, reformulé ; valeurs factuelles seules)
- https://m3.material.io/foundations/designing/flow — Google Terms of Service (propriétaire, reformulé ; valeurs factuelles seules)
- https://m3.material.io/foundations/designing/elements — Google Terms of Service (propriétaire, reformulé ; valeurs factuelles seules)
- https://m3.material.io/foundations/overview/assistive-technology — Google Terms of Service (propriétaire, reformulé ; valeurs factuelles seules)
- https://m3.material.io/foundations/writing/text-resizing — Google Terms of Service (propriétaire, reformulé ; valeurs factuelles seules)
- https://m3.material.io/foundations/interaction/states/applying-states — Google Terms of Service (propriétaire, reformulé ; valeurs factuelles seules)
- https://m3.material.io/foundations/interaction/states/state-layers — Google Terms of Service (propriétaire, reformulé ; valeurs factuelles seules)
- https://m3.material.io/foundations/layout/bidirectionality-rtl — Google Terms of Service (propriétaire, reformulé ; valeurs factuelles seules)
- https://m3.material.io/foundations/usability/overview — Google Terms of Service (propriétaire, reformulé ; valeurs factuelles seules)
- https://m3.material.io/styles/color/system/how-the-system-works — Google Terms of Service (propriétaire, reformulé ; valeurs factuelles seules)
- https://github.com/material-components/material-web/blob/37aa14b843dcaeb3a46f898679fa6fcd109b1905/tokens/versions/latest/sass/_md-sys-state-focus-indicator.scss — Apache-2.0
- https://m3.material.io/foundations/layout/grids-spacing/density — Google Terms of Service (propriétaire, reformulé ; valeurs factuelles seules)
- https://m3.material.io/components/button-groups/accessibility — Google Terms of Service (propriétaire, reformulé ; valeurs factuelles seules)
- https://m3.material.io/components/lists/accessibility — Google Terms of Service (propriétaire, reformulé ; valeurs factuelles seules)
- https://m3.material.io/styles/motion/transitions/applying-transitions — Google Terms of Service (propriétaire, reformulé ; valeurs factuelles seules)
- https://m3.material.io/components/snackbar/accessibility — Google Terms of Service (propriétaire, reformulé ; valeurs factuelles seules)
- https://m3.material.io/foundations/content-design/alt-text — Google Terms of Service (propriétaire, reformulé ; valeurs factuelles seules)

## Règles

- `m3.a11y.target-size` (MUST) Toute cible tactile offre une zone d’activation d’au moins 48 × 48dp (environ 9 mm physiques ; 48 × 48 px CSS sur le web), même si l’élément visible (icône 24dp, bouton XS/S, case) est plus petit : la zone déborde du visuel. — [source](https://m3.material.io/foundations/designing/structure)
- `m3.a11y.pointer-target` (SHOULD) Les cibles pour pointeur (souris, stylet) font au moins 44 × 44dp. — [source](https://m3.material.io/foundations/designing/structure)
- `m3.a11y.target-spacing` (SHOULD) Séparer les cibles voisines d’au moins 8dp pour équilibrer densité et précision. — [source](https://m3.material.io/foundations/designing/structure)
- `m3.a11y.density-keeps-targets` (MUST) Une densité accrue ou une mise à l'échelle des composants ne réduit jamais la cible interactive sous 48 × 48dp ; les commandes qui rétablissent la densité par défaut gardent la taille de cible standard. — [source](https://m3.material.io/foundations/layout/grids-spacing/density)
- `m3.a11y.text-contrast` (MUST) Contraste du texte contre son fond : au moins 4.5:1 pour le texte courant, 3:1 pour le grand texte (18pt normal ou 14pt gras et plus). — [source](https://m3.material.io/foundations/designing/color-contrast)
- `m3.a11y.non-text-contrast` (MUST) Icônes porteuses de sens, bordures de champs et conteneurs de boutons regroupés atteignent 3:1 contre le fond ; un élément isolé et très saillant (FAB) en est dispensé pour son conteneur. — [source](https://m3.material.io/foundations/designing/color-contrast)
- `m3.a11y.disabled-contrast-exempt` (MAY) Les éléments désactivés sont exemptés des seuils de contraste, mais doivent rester identifiables comme désactivés par un autre moyen que la seule couleur (attribut disabled, aria-disabled). — [source](https://m3.material.io/foundations/interaction/states/applying-states)
- `m3.a11y.color-not-only` (MUST-NOT) Ne jamais transmettre une information (erreur, sélection, statut) par la seule couleur : ajouter texte, icône, forme ou motif. — [source](https://m3.material.io/foundations/designing/color-contrast)
- `m3.a11y.user-contrast` (SHOULD) Proposer les niveaux de contraste standard, moyen et élevé générés par le système de couleur, en suivant le réglage de contraste de l'OS (prefers-contrast) quand il existe. — [source](https://m3.material.io/styles/color/system/how-the-system-works)
- `m3.a11y.focus-visible` (MUST) Tout élément interactif atteint au clavier affiche un indicateur de focus en anneau, visible seulement pour la navigation clavier (focus-visible), d'épaisseur 3dp décalé de 2dp vers l'extérieur, en couleur secondary. — [source](https://m3.material.io/foundations/interaction/states/applying-states)
- `m3.a11y.focus-order` (MUST) L ordre de tabulation suit l’ordre de lecture (ordre du DOM) et la hiérarchie visuelle ; définir le focus initial de chaque écran et des composants à plusieurs éléments interactifs ; un seul élément porte le focus à la fois. — [source](https://m3.material.io/foundations/designing/flow)
- `m3.a11y.focus-composite` (SHOULD) Dans un groupe composite (barre d'onglets, barre de navigation, liste, menu, groupe de boutons segmentés), Tab entre et sort du groupe, les flèches déplacent le focus à l'intérieur (roving tabindex). — [source](https://m3.material.io/components/button-groups/accessibility)
- `m3.a11y.focus-return` (MUST) À l’ouverture d’un dialogue, le focus va à son premier élément interactif et Tab y circule en boucle ; à la fermeture ou l’annulation, le focus revient à l’élément déclencheur. Une snackbar ne piège jamais le focus. — [source](https://m3.material.io/foundations/designing/flow)
- `m3.a11y.structure-headings` (MUST) Sur le web, structurer chaque page en repères ARIA (en-tête, navigation, principal, complémentaire, pied) et en titres hiérarchisés avec un seul h1 pour le titre de page, dans un ordre de lecture logique. — [source](https://m3.material.io/foundations/designing/structure)
- `m3.a11y.accessible-name` (MUST) Chaque contrôle a un nom accessible : texte visible de préférence, sinon libellé (aria-label) pour les boutons icônes, FAB et chips sans texte ; une icône purement décorative est masquée aux technologies d'assistance. — [source](https://m3.material.io/foundations/designing/elements)
- `m3.a11y.semantic-roles` (MUST) Utiliser les éléments natifs ou les rôles ARIA qui correspondent au comportement (button, link, checkbox, switch, radio, tab, slider, dialog, menu, listbox) et exposer leur état (checked, selected, expanded, pressed, disabled). — [source](https://m3.material.io/foundations/designing/elements)
- `m3.a11y.assistive-tech` (MUST) Toute fonction est utilisable au clavier (ou D-pad), au lecteur d'écran, par contacteur et à la voix ; aucune action n'exige exclusivement un geste ou un survol. — [source](https://m3.material.io/foundations/overview/assistive-technology)
- `m3.a11y.gesture-alternative` (MUST) Toute action atteinte par geste (balayage d’un élément de liste, glisser) a aussi un accès visible ou accessible, par exemple un bouton « plus » ou un menu. — [source](https://m3.material.io/components/lists/accessibility)
- `m3.a11y.text-resize` (MUST) L'interface supporte un agrandissement du texte jusqu'à 200 % au moins sans perte de contenu ni de fonction : conteneurs qui grandissent en hauteur, rembourrages horizontaux constants, retour à la ligne plutôt que troncature. — [source](https://m3.material.io/foundations/writing/text-resizing)
- `m3.a11y.single-scroll-axis` (SHOULD) Privilégier un défilement vertical unique ; ne pas imposer de défilement dans deux directions à la fois, y compris texte agrandi. — [source](https://m3.material.io/foundations/writing/text-resizing)
- `m3.a11y.rtl-mirroring` (MUST) Prendre en charge les langues de droite à gauche : miroir de la mise en page et des icônes directionnelles, direction et alignement RTL du texte ; ne pas inverser ce qui garde une orientation fixe (graphiques, adresses électroniques, lecture média, horloges). — [source](https://m3.material.io/foundations/layout/bidirectionality-rtl)
- `m3.a11y.reduced-motion` (MUST) Si la réduction des animations est activée, les transitions passent à un fondu court ou s'appliquent sans mouvement, sans rebond ni parallaxe. — [source](https://m3.material.io/styles/motion/transitions/applying-transitions)
- `m3.a11y.timeouts` (SHOULD) Une snackbar avec action ne se ferme pas seule ; sans action, elle peut disparaître après 4 à 10 s, mais l’information doit aussi apparaître dans la page (libellé « Enregistré » à la place de « Enregistrer »). — [source](https://m3.material.io/components/snackbar/accessibility)
- `m3.a11y.hierarchy` (SHOULD) Rendre l'action principale la plus grande et la plus contrastée, limiter la quantité d'informations simultanées et grouper les éléments liés pour réduire la charge cognitive. — [source](https://m3.material.io/foundations/usability/overview)
- `m3.a11y.alt-text` (MUST) Les images porteuses d'information ont un texte alternatif qui décrit leur fonction ; les images décoratives ont un texte alternatif vide. — [source](https://m3.material.io/foundations/content-design/alt-text)
