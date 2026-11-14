# Geist : composants

Réécriture dans nos mots de pages propriétaires Vercel (aucune phrase, image, SVG ni fichier de police recopié ; seuls les faits sont repris). Dans src, la cible web reste Material 3 (skill ui-system) ; Geist sert de référence de qualité. Règles transverses d'interface : skill vercel-agent-skills:web-design-guidelines, non dupliquée.

Spec `geist.components`, domaine `components`, sources lues le 2026-11-13. Version machine : `geist.json` (schéma `../spec.schema.json`).

## Sources et licences

- https://vercel.com/geist/introduction : Propriétaire Vercel (https://vercel.com/legal/terms) : lecture seule ; noms de props et valeurs repris comme faits, descriptions réécrites, aucun code ni asset
- https://vercel.com/geist/<composant> : Propriétaire Vercel : 75 pages lues en text/markdown le 2026-11-13

## Règles

| id                              | niveau   | règle                                                                                                                                                                                                                                                               | valeur                                                      | source                                            |
| ------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- | ------------------------------------------------- |
| `geist.comp.package`            | MAY      | Les composants Geist sont publiés pour React sous @vercel/geistcn ; dans src ils ne sont pas une dépendance (cible web = Material Web), seulement une référence de comportement.                                                                                    |                                                             | https://vercel.com/geist/introduction             |
| `geist.comp.button-vs-link`     | MUST     | Bouton pour une action qui modifie un état ; lien stylé en bouton pour une navigation qui change l'URL ; menu ou bouton scindé quand plusieurs actions liées partagent une ligne.                                                                                   |                                                             | https://vercel.com/geist/button                   |
| `geist.comp.button-label`       | SHOULD   | Le libellé nomme le résultat (verbe + objet : Deploy Project, Invite Member), jamais un verbe nu ni OK/Confirm ; un bouton destructif et son toast se répondent (Delete Project puis Project deleted).                                                              |                                                             | https://vercel.com/geist/button                   |
| `geist.comp.loading-in-place`   | MUST     | État de chargement porté par le contrôle lui-même : il reste focusable, garde son libellé et annonce l'occupation (aria-busy) au lieu d'être remplacé par un spinner.                                                                                               |                                                             | https://vercel.com/geist/button                   |
| `geist.comp.disabled-explained` | SHOULD   | Désactiver seulement si l'action est impossible maintenant (entrée manquante, droits) et expliquer pourquoi dans une infobulle.                                                                                                                                     |                                                             | https://vercel.com/geist/button                   |
| `geist.comp.icon-only-name`     | MUST     | Tout contrôle icône seule porte un nom accessible qui décrit l'action et sa cible (Copy deployment URL), pas l'icône ; un contrôle avec texte visible ne reçoit pas d'aria-label.                                                                                   |                                                             | https://vercel.com/geist/button                   |
| `geist.comp.hover-delay`        | SHOULD   | Infobulles et cartes contextuelles s'ouvrent au survol et au focus clavier après un délai d'environ 150 ms pour ne pas clignoter lors d'un balayage ; Échap ferme et rend le focus au déclencheur.                                                                  | 150ms                                                       | https://vercel.com/geist/tooltip                  |
| `geist.comp.overlay-focus`      | MUST     | Modale, tiroir, panneau latéral, calendrier et listes déroulantes piègent le focus pendant l'ouverture et le rendent au déclencheur à la fermeture ; le titre est relié par aria-labelledby.                                                                        |                                                             | https://vercel.com/geist/modal                    |
| `geist.comp.cancel-literal`     | SHOULD   | Le bouton de renoncement d'une modale s'appelle littéralement Cancel (Annuler) pour rester stable d'un flux destructif à l'autre.                                                                                                                                   |                                                             | https://vercel.com/geist/modal                    |
| `geist.comp.destructive-gate`   | MUST     | Une suppression irréversible exige la saisie exacte d'une phrase de confirmation ; la phrase et le champ sont exclus de la traduction automatique (translate=no) pour que la comparaison exacte reste possible.                                                     |                                                             | https://vercel.com/geist/destructive-action-modal |
| `geist.comp.live-regions`       | MUST     | Toasts, erreurs asynchrones, chargements et décomptes de résultats s'annoncent en aria-live polite ; assertive est réservé aux erreurs bloquantes.                                                                                                                  |                                                             | https://vercel.com/geist/toast                    |
| `geist.comp.toast-no-nav`       | MUST-NOT | Ne pas placer de navigation essentielle dans un toast : il disparaît avant d'être atteint au clavier.                                                                                                                                                               |                                                             | https://vercel.com/geist/toast                    |
| `geist.comp.group-fieldset`     | MUST     | Cases à cocher, radios et choiceboxes liés sont regroupés dans fieldset + legend ; une case de sélection de ligne sans libellé visible reçoit un aria-label nommant la ligne.                                                                                       |                                                             | https://vercel.com/geist/checkbox                 |
| `geist.comp.color-not-only`     | MUST     | La couleur n'est jamais le seul signal (sélection, seuil, statut) : texte, coche ou titre redondant obligatoire.                                                                                                                                                    |                                                             | https://vercel.com/geist/status-dot               |
| `geist.comp.reduced-motion`     | MUST     | Spinners, points de chargement, squelettes et vidéos en lecture auto respectent prefers-reduced-motion ; un seul indicateur animé par ligne.                                                                                                                        |                                                             | https://vercel.com/geist/loading-dots             |
| `geist.comp.progress-throttle`  | SHOULD   | Limiter la mise à jour d'aria-valuenow d'une barre de progression à environ une fois par seconde.                                                                                                                                                                   | 1s                                                          | https://vercel.com/geist/progress                 |
| `geist.comp.keyboard-menus`     | MUST     | Menus : flèches haut/bas, Début/Fin, Entrée/Espace, recherche par première lettre (le libellé visible vient en premier), Échap ferme ; menu contextuel ouvrable par Maj+F10 ou touche menu, un seul niveau de sous-menu pour les actions destructives.              |                                                             | https://vercel.com/geist/menu                     |
| `geist.comp.tabs-keys`          | MUST     | Onglets : flèches gauche/droite déplacent le focus, Entrée/Espace activent, anneau de focus visible sur l'onglet actif, aria-label sur la liste si aucun titre visible.                                                                                             |                                                             | https://vercel.com/geist/tabs                     |
| `geist.comp.decorative-frames`  | MUST     | Cadres de présentation (navigateur, téléphone, couverture de livre, guides de grille) sont aria-hidden et sans contrôle focusable ; le sens est porté par l'image interne et son texte alternatif.                                                                  |                                                             | https://vercel.com/geist/browser                  |
| `geist.comp.sheet-measures`     | SHOULD   | Panneau latéral en variante inset par défaut : marge 12 px, coins 16 px, hauteur pleine, largeur maximale 512 px ; bouton Close visible car un clic extérieur ne ferme pas.                                                                                         | {"margin":"12px","radius":"16px","maxWidth":"512px"}        | https://vercel.com/geist/sheet                    |
| `geist.comp.avatar-pairing`     | SHOULD   | Taille d'avatar accordée au texte voisin : 20-24 px avec label-14, 32 px avec label-16, 48-64 px en en-tête ou onboarding.                                                                                                                                          | {"label-14":"20-24px","label-16":"32px","header":"48-64px"} | https://vercel.com/geist/avatar                   |
| `geist.comp.url-state`          | SHOULD   | Les filtres de liste vivent dans l'URL (partage, rechargement, précédent/suivant).                                                                                                                                                                                  |                                                             | https://vercel.com/geist/filter-params            |
| `geist.comp.web-guidelines`     | MUST     | Les règles transverses d'interface (focus, cibles, formulaires, contenu, performance perçue) ne sont pas dupliquées ici : appliquer la skill vercel-agent-skills:web-design-guidelines (fork aphrody-labs/agent-skills, .agents/skills/web-design-guidelines). |                                                             | https://vercel.com/design/guidelines              |

## Composants (75)

### Address Input

Source : https://vercel.com/geist/address-input

- Variantes : recherche + édition ; recherche en direct ; saisie manuelle ; recherche indisponible
- États : validation ; warning

### Avatar

Source : https://vercel.com/geist/avatar

- Variantes : seul ; groupe empilé ; chevauchement fixe ; git ; icône personnalisée ; lettre ; placeholder
- Mesures : size = 14, 16, 24, 32, 48, 90

### Badge

Source : https://vercel.com/geist/badge

- Variantes : gray ; blue ; purple ; amber ; red ; pink ; green ; teal ; inverted ; trial ; turbo ; avec icône ; pill
- Mesures : size = sm, md, lg

### Banner

Source : https://vercel.com/geist/banner

- Variantes : pleine largeur du conteneur

### Book

Source : https://vercel.com/geist/book

- Variantes : simple ; stripe ; couleur, icône ou illustration personnalisée ; texturé ; responsive
- Accessibilité : couverture décorative, titre porté par le titre sous-jacent ; focus sur le lien, pas sur la couverture

### Breadcrumbs

Source : https://vercel.com/geist/breadcrumbs

- Variantes : text ; menu
- États : actif ; désactivé

### Browser

Source : https://vercel.com/geist/browser

- Variantes : cadre navigateur autour d'une capture ou d'un contenu
- Accessibilité : cadre aria-hidden ; alt descriptif sur la capture ; aucun faux contrôle focusable

### Button

Source : https://vercel.com/geist/button

- Variantes : default (primaire) ; secondary ; tertiary ; error ; warning ; shape square/circle/rounded ; rounded + shadow (marketing) ; préfixe/suffixe ; ButtonLink ; CustomButton (couleurs par état)
- États : repos ; survol ; actif ; loading ; disabled
- Mesures : size = tiny, small, medium (défaut), large
- Accessibilité : icône seule : svgOnly + aria-label obligatoires ; type HTML porté par typeName, type visuel par type

### Calendar

Source : https://vercel.com/geist/calendar

- Variantes : date ; plage ; horizontal ; compact ; empilé ; préréglages ; fuseau épinglé ; bornes min/max
- Mesures : size = small, défaut
- Accessibilité : focus piégé dans le popover ; flèches jour, Maj+flèche semaine, PgPréc/PgSuiv mois ; plage annoncée en aria-live polite

### Checkbox

Source : https://vercel.com/geist/checkbox

- États : non coché ; coché ; indéterminé ; désactivé
- Accessibilité : fieldset + legend ; zone de clic étendue au label

### Choicebox

Source : https://vercel.com/geist/choicebox

- Variantes : radio (choix unique) ; checkbox (choix multiple) ; contenu personnalisé ; blue ; trial
- États : sélectionné ; désactivé
- Accessibilité : fieldset + legend ; flèches en choix unique, Espace en multiple ; coche d'angle en plus de la bordure

### Clearable Input

Source : https://vercel.com/geist/clearable-input

- Variantes : avec label ; avec raccourci ⌘K ; callback d'effacement
- États : rempli ; vide ; désactivé
- Accessibilité : Échap efface la valeur

### Code

Source : https://vercel.com/geist/code

- Variantes : extrait coloré

### Code Block

Source : https://vercel.com/geist/code-block

- Variantes : avec ou sans nom de fichier ; lignes surlignées ; lignes ajoutées/retirées ; lignes référencées ; sélecteur de langage (liste ou onglets) ; sans numéros de ligne

### Collapse

Source : https://vercel.com/geist/collapse

- Variantes : simple ; multiple ; small
- États : replié ; déplié
- Accessibilité : déclencheur button avec aria-expanded et aria-controls ; Entrée/Espace basculent ; contenu replié gardé dans le DOM (hidden) pour la recherche

### Combobox

Source : https://vercel.com/geist/combobox

- Variantes : contrôlé ; non contrôlé ; effaçable ; icônes préfixe/suffixe ; largeur d'entrée ou de liste personnalisée ; message vide personnalisé ; dans une modale ou un panneau
- États : désactivé ; erreur
- Mesures : size = small, défaut, large
- Accessibilité : label frère relié par htmlFor ou aria-label sur la racine ; focus piégé dans le popover

### Command Menu

Source : https://vercel.com/geist/command-menu

- Variantes : plein écran ; séparateurs ; suffixe
- Accessibilité : nombre de résultats en aria-live polite ; haut/bas, Entrée, Échap ; Retour arrière sur champ vide dépile la page ; raccourci affiché en Kbd

### Context Card

Source : https://vercel.com/geist/context-card

- Variantes : side top/right/bottom/left ; align start/center/end ; render prop
- États : fermée ; ouverte au survol ou au focus
- Accessibilité : déclencheur garde son nom ; Échap ferme et rend le focus

### Context Menu

Source : https://vercel.com/geist/context-menu

- Variantes : éléments lien ; préfixe/suffixe
- États : élément désactivé
- Accessibilité : ouvrable au clavier (Maj+F10, touche menu) ; un seul niveau pour le destructif

### Copy Button

Source : https://vercel.com/geist/copy-button

- États : repos ; copié (retour visuel)

### Description

Source : https://vercel.com/geist/description

- Variantes : titre + sous-titre ; texte à droite ; ellipse

### Destructive Action Modal

Source : https://vercel.com/geist/destructive-action-modal

- Variantes : irréversible (bande d'avertissement) ; réversible
- États : loading ; erreur
- Accessibilité : champ relié à l'invite par aria-labelledby ; translate=no sur la phrase ; icône d'avertissement aria-hidden

### Destructive Confirmation Input

Source : https://vercel.com/geist/destructive-confirmation-input

- États : vide ; correspondance ; erreur
- Accessibilité : aria-labelledby vers l'invite, pas d'aria-label séparé

### Dots Menu

Source : https://vercel.com/geist/dots-menu

- Variantes : menu de débordement trois points
- États : désactivé ; élément désactivé
- Mesures : size = plusieurs tailles (valeurs non publiées en clair)

### Drawer

Source : https://vercel.com/geist/drawer

- Variantes : hauteur par défaut ; hauteur personnalisée
- Accessibilité : focus piégé et rendu ; Échap et geste retour mobile ferment ; défilement du body verrouillé

### Empty State

Source : https://vercel.com/geist/empty-state

- Variantes : blank slate ; informatif

### Entity

Source : https://vercel.com/geist/entity

- Variantes : deux colonnes contenu/actions ; avec squelette ; avec liste ; liste + case à cocher ; fill ; classes de colonnes

### Error

Source : https://vercel.com/geist/error

- Variantes : label par défaut ; label personnalisé ; sans label ; propriété error
- Mesures : size = small, défaut, large
- Accessibilité : erreur asynchrone en aria-live polite, assertive si bloquante

### Error Card

Source : https://vercel.com/geist/error-card

- Variantes : titre + message

### Feedback

Source : https://vercel.com/geist/feedback

- Variantes : popover ; inline ; avec select ; métadonnées ; préfixe/suffixe
- États : émotion choisie ; envoyé

### Fieldset

Source : https://vercel.com/geist/fieldset

- Variantes : avec ou sans titre ; avec ou sans pied d'actions ; highlight ; secondary ; type error ; type warning ; mur de désactivation
- États : désactivé ; erreur ; avertissement

### File Tree

Source : https://vercel.com/geist/file-tree

- Variantes : dossiers repliables ; types de fichier lambda/edge-function/middleware
- États : replié ; déplié

### Filter Params

Source : https://vercel.com/geist/filter-params

- Variantes : suggestions ; IA ; filtres en lecture seule ; filtres persistants
- Accessibilité : libellés de filtre et d'option explicites

### Gauge

Source : https://vercel.com/geist/gauge

- Variantes : label ; échelle de couleurs par défaut ; plage de couleurs personnalisée ; couleur secondaire ; priorité d'arc
- États : déterminé ; indéterminé
- Mesures : size = tiny, small, medium, large
- Accessibilité : role=progressbar avec aria-valuemin/max/now ; nom via aria-labelledby du label voisin ; seuil jamais signalé par la seule couleur

### Grid

Source : https://vercel.com/geist/grid

- Variantes : sans cellules ; auto ; cellules solid ; responsive sm/md/lg ; guides de lignes ou de colonnes masqués ; cellules superposées ; croix ; pointillés ; GridPage
- Accessibilité : guides aria-hidden ; contraste des guides ≥ 3:1

### Input

Source : https://vercel.com/geist/input

- Variantes : préfixe/suffixe (stylés ou non) ; recherche ; ⌘K ; label ; préfixe arrondi
- États : repos ; focus ; désactivé ; erreur
- Mesures : size = small, medium, large
- Accessibilité : label texte exige un id ; placeholder de recherche nomme la portée

### JSON View

Source : https://vercel.com/geist/json-view

- Variantes : une ligne ; intégré ; retour à la ligne ; replié ; surligné
- Accessibilité : arbre : flèches entre nœuds, Entrée/Espace basculent, Début/Fin ; texte sélectionnable conservé

### Keyboard Input

Source : https://vercel.com/geist/keyboard-input

- Variantes : modificateurs ; combinaison ; small

### Label

Source : https://vercel.com/geist/label

- Variantes : seul ; avec input ; casse libre (bypass)

### Load More Button

Source : https://vercel.com/geist/load-more-button

- Variantes : sans écart ; sans rayon ; texte personnalisé
- États : repos ; loading

### Loading Dots

Source : https://vercel.com/geist/loading-dots

- Variantes : seul ; avec texte
- Mesures : size = sm, md, lg
- Accessibilité : aria-live polite sur le conteneur ; points décoratifs sans aria-label

### Menu

Source : https://vercel.com/geist/menu

- Variantes : avec chevron ; éléments lien ; déclencheur personnalisé ; préfixe/suffixe ; sections ; position (ex. left-start) ; élément error
- États : élément désactivé ; élément verrouillé
- Accessibilité : haut/bas, Début/Fin, Entrée/Espace, recherche par lettre ; focus rendu au déclencheur

### Middle Truncate

Source : https://vercel.com/geist/middle-truncate

- Variantes : troncature centrale conservant début et fin
- Accessibilité : chaîne complète exposée comme nom accessible

### Modal

Source : https://vercel.com/geist/modal

- Variantes : défaut ; sticky ; bouton unique ; inset ; feuille mobile avec champs
- États : actions désactivées ; focus initial contrôlé ; erreur interne
- Accessibilité : aria-labelledby vers le titre ; focus gardé dedans après erreur, rendu au déclencheur après succès ; toasts compatibles avec le piège de focus

### Multi Select

Source : https://vercel.com/geist/multi-select

- Variantes : actions de sélection ; contrôlé
- Accessibilité : case de chaque ligne nommée (Select us-east-1) ; déclencheur nommé même à zéro sélection ; focus piégé puis rendu

### Note

Source : https://vercel.com/geist/note

- Variantes : info (défaut) ; success ; error ; warning ; secondary ; violet ; cyan ; avec action ; label ; icône personnalisée
- États : désactivé
- Mesures : size = small, défaut

### Pagination

Source : https://vercel.com/geist/pagination

- Variantes : précédent/suivant

### Phone

Source : https://vercel.com/geist/phone

- Variantes : cadre téléphone autour d'une capture
- Accessibilité : cadre aria-hidden ; alt décrivant l'écran ; vidéo auto : reduced-motion + affiche

### Pie Gauge

Source : https://vercel.com/geist/pie-gauge

- Variantes : couleurs (ex. blue-900, amber-900, red-900)
- Mesures : size = 16px par défaut, 13px en surface compacte

### Progress

Source : https://vercel.com/geist/progress

- Variantes : max personnalisé ; couleurs dynamiques ; secondary/success/warning/error ; jalons (stops) ; largeurs ; hauteurs
- Accessibilité : role=progressbar ; aria-valuenow limité à ~1/s ; chaque jalon nommé

### Project Banner

Source : https://vercel.com/geist/project-banner

- Variantes : défaut ; success ; warning ; error

### Radio

Source : https://vercel.com/geist/radio

- Variantes : groupe ; headless ; standalone
- États : sélectionné ; désactivé ; requis
- Mesures : size = small, défaut
- Accessibilité : fieldset + legend ; radio isolé nommé par aria-label ; anneau de focus natif conservé

### Relative Time Card

Source : https://vercel.com/geist/relative-time-card

- Variantes : popover heure locale

### Scroller

Source : https://vercel.com/geist/scroller

- Variantes : vertical ; horizontal ; libre ; avec boutons
- Accessibilité : ordre DOM = ordre de lecture ; boutons nommés avec direction et contenu ; élément focalisé ramené dans la vue

### Search Input

Source : https://vercel.com/geist/search-input

- Variantes : ⌘K ; préfixe personnalisé
- États : désactivé ; loading

### Select

Source : https://vercel.com/geist/select

- Variantes : préfixe/suffixe ; label ; options
- États : désactivé ; erreur ; requis
- Mesures : size = small, défaut, large

### Separator

Source : https://vercel.com/geist/separator

- Variantes : horizontal ; vertical ; inset
- Mesures : inset = 1px réservé à chaque extrémité, gray-400 opaque

### Sheet

Source : https://vercel.com/geist/sheet

- Variantes : inset (défaut) ; edge ; secondary ; side gauche/droite/haut/bas
- Mesures : margin = 12px ; radius = 16px ; maxWidth = 512px
- Accessibilité : focus piégé et rendu à la ligne déclenchante ; bouton Close visible ; aria-labelledby vers le titre

### Show More

Source : https://vercel.com/geist/show-more

- Variantes : avec ou sans bordure
- États : replié ; déplié

### Skeleton

Source : https://vercel.com/geist/skeleton

- Variantes : largeur fixe ; hauteur de boîte ; enveloppe d'enfants ; pill ; rounded ; squared ; sans animation ; bouton
- Accessibilité : aria-busy sur la région, fin annoncée sur le conteneur cible ; aucun contrôle focusable dedans

### Slider

Source : https://vercel.com/geist/slider

- Variantes : label ; plage avec champs ; validation au relâchement
- États : désactivé

### Snippet

Source : https://vercel.com/geist/snippet

- Variantes : inversé ; multiligne ; sans invite ; success/error/warning ; valeur secrète
- États : copié (contrôlable)

### Spinner

Source : https://vercel.com/geist/spinner

- Variantes : couleurs
- Mesures : size = sm, md, lg, xl, 2xl, 3xl, 4xl
- Accessibilité : aria-busy sur l'élément en cours ; déclencheur reste focusable

### Split Button

Source : https://vercel.com/geist/split-button

- Variantes : alignement du menu ; icône ; titre avec icône

### Status Dot

Source : https://vercel.com/geist/status-dot

- Variantes : seul ; avec label
- États : états de déploiement (chacun avec titre distinct)
- Accessibilité : aria-label composé automatiquement, ne pas remplacer ; aria-hidden si le texte voisin nomme déjà l'état

### Switch

Source : https://vercel.com/geist/switch

- Variantes : sélecteur segmenté ; pleine largeur ; infobulle ; icône
- États : sélectionné ; désactivé
- Mesures : size = small, défaut, large

### Table

Source : https://vercel.com/geist/table

- Variantes : basique ; zébrée ; bordée ; interactive ; complète ; virtualisée
- Accessibilité : table HTML sémantique

### Tabs

Source : https://vercel.com/geist/tabs

- Variantes : défaut ; secondary ; avec icônes
- États : actif ; désactivé (global ou par onglet)
- Accessibilité : flèches gauche/droite, Entrée/Espace ; aria-label de la liste sans titre visible

### Text With Copy Button

Source : https://vercel.com/geist/text-with-copy-button

- Variantes : défaut ; small + tertiary

### Textarea

Source : https://vercel.com/geist/textarea

- Variantes : nombre de lignes
- États : désactivé ; erreur ; lecture seule
- Mesures : size = small, medium, large

### Theme Switcher

Source : https://vercel.com/geist/theme-switcher

- Variantes : système/clair/sombre ; small
- États : désactivé

### Toast

Source : https://vercel.com/geist/toast

- Variantes : multiligne ; JSX ; lien ; persistant (preserve) ; action ; annuler (undo) ; success ; warning ; error
- Accessibilité : région aria-live polite ; pas de navigation principale dedans

### Toggle

Source : https://vercel.com/geist/toggle

- Variantes : couleur personnalisée (amber, red) ; avec label
- États : activé ; désactivé (off) ; disabled
- Mesures : size = défaut, medium, large

### Tooltip

Source : https://vercel.com/geist/tooltip

- Variantes : position top/bottom/left/right ; sans délai ; alignement de boîte ; contenu personnalisé ; type success/error/warning/violet
- Mesures : delay = ~150ms ; material = material-tooltip (6px, pointe)
- Accessibilité : déclencheur icône nommé par aria-label ; Échap ferme et rend le focus

### Video

Source : https://vercel.com/geist/video

- Variantes : boucle (défaut) ; sans boucle ; sans contrôles
- États : chargement différé
