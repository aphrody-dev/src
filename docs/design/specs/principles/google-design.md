# Google Design : principes de design

Spec `google-design.principles`, domaine `principles`, sources vérifiées le 2026-11-13. Version machine : `google-design.json` (schéma `../spec.schema.json`), mêmes règles à l'identique.

Licence : articles de design.google sous conditions Google (propriétaire, aucune licence libre). Contenu reformulé dans nos mots : aucune phrase recopiée, aucune citation, aucune image. 69 règles tirées de 26 articles.

Niveaux : MUST / MUST-NOT impératifs (accessibilité, intégrité des données), SHOULD / SHOULD-NOT recommandés, MAY optionnels.

## Accessibilité

- `gd.a11y.contrast-by-default` (MUST) Livrer un contraste élevé par défaut pour tout texte et tout élément interactif : au moins 4,5:1 pour le texte courant et 3:1 pour le grand texte, sans attendre qu'un réglage le demande. — [source](https://design.google/library/designing-global-accessibility-part-iii)
- `gd.a11y.not-color-alone` (MUST-NOT) Ne jamais transmettre un état ou une information par la seule couleur : doubler par un contour, un motif, un indicateur, un texte ou un retour haptique. — [source](https://design.google/library/designing-global-accessibility-part-iii)
- `gd.a11y.icon-with-label` (SHOULD) Accompagner les icônes d'un libellé texte, en priorité sur la navigation et les appels à l'action. — [source](https://design.google/library/designing-global-accessibility-part-iii)
- `gd.a11y.touch-target-48` (MUST) Donner à chaque cible tactile une zone active d'au moins 48 × 48 dp, même si le visuel est plus petit. — [source](https://design.google/library/designing-global-accessibility-part-iii)
- `gd.a11y.zoom-200` (MUST) Garder l'interface utilisable avec un agrandissement jusqu'à 200 % : aucun texte tronqué, aucun chevauchement. — [source](https://design.google/library/designing-global-accessibility-part-iii)
- `gd.a11y.assistive-tech-in-loop` (MUST) Tester régulièrement les parcours principaux avec les technologies d'assistance et les réglages d'accessibilité du système activés, pendant le développement et pas seulement en fin de projet. — [source](https://design.google/library/designing-global-accessibility-part-2)
- `gd.a11y.announce-status` (MUST) Exposer aux lecteurs d'écran les indicateurs de progression et changements d'état avec un texte alternatif qui dit ce qui se passe. — [source](https://design.google/library/designing-global-accessibility-part-2)

## Inclusion mondiale et appareils modestes

- `gd.global.local-formats` (MUST) Afficher dates, heures, adresses et numéros de téléphone au format local, sans troncature ni débordement. — [source](https://design.google/library/designing-global-accessibility-part-iii)
- `gd.global.color-meaning-varies` (SHOULD-NOT) Ne pas supposer qu'une couleur a le même sens partout (le rouge n'évoque pas l'alerte dans toutes les cultures) ; s'appuyer sur des signaux non chromatiques. — [source](https://design.google/library/designing-global-accessibility-part-iii)
- `gd.global.modest-devices` (SHOULD) Concevoir et tester pour des appareils modestes : écran 480 × 800 px ou moins de 4 pouces, stockage réduit, processeur lent, système ancien ; proposer un paquet léger. — [source](https://design.google/library/designing-global-accessibility-part-2)
- `gd.global.data-frugality` (SHOULD) Réduire la consommation de données (vidéo, visuels lourds, rafraîchissement automatique) et donner à l'utilisateur visibilité et contrôle sur les fonctions gourmandes. — [source](https://design.google/library/designing-global-accessibility-part-2)

## Hors ligne et connectivité faible

- `gd.offline.mark-available` (SHOULD) Signaler par une icône accompagnée d'un libellé quels contenus restent utilisables hors ligne, y compris quand l'appareil est encore connecté. — [source](https://design.google/library/offline-design)
- `gd.offline.no-connection-state` (SHOULD) En l'absence de réseau, afficher un état explicite (icône et texte court) plutôt qu'un écran vide ou une erreur générique. — [source](https://design.google/library/offline-design)
- `gd.offline.show-download-size` (SHOULD) Indiquer la taille du fichier à côté de toute action de téléchargement, pour que l'utilisateur arbitre son forfait. — [source](https://design.google/library/offline-design)
- `gd.offline.download-progress` (SHOULD) Pendant un téléchargement, montrer la progression et le temps restant, permettre pause et annulation, puis confirmer la fin. — [source](https://design.google/library/offline-design)
- `gd.offline.queue-and-notify` (SHOULD) Mettre en file les requêtes faites sans réseau, les exécuter au retour de la connexion et prévenir l'utilisateur par un message bref. — [source](https://design.google/library/offline-design)
- `gd.offline.keep-form-input` (MUST) Conserver localement la saisie des formulaires pour qu'une coupure réseau ne fasse jamais perdre ce qui a été tapé. — [source](https://design.google/library/designing-global-accessibility-part-2)

## Thème sombre

- `gd.dark.dark-gray-surface` (SHOULD) En thème sombre, utiliser un gris très foncé plutôt qu'un noir pur pour les surfaces. — [source](https://design.google/library/material-design-dark-theme)
- `gd.dark.soft-text` (SHOULD) Écrire le texte en gris clair plutôt qu'en blanc pur sur fond sombre afin de limiter le bavement lumineux des petits caractères. — [source](https://design.google/library/material-design-dark-theme)
- `gd.dark.desaturate-accents` (SHOULD) Désaturer et recalibrer en luminosité les couleurs d'accent pour le fond sombre, en gardant leur identité. — [source](https://design.google/library/material-design-dark-theme)
- `gd.dark.elevation-by-tone` (SHOULD) Exprimer l'élévation en thème sombre par des surfaces de plus en plus claires plutôt que par des ombres. — [source](https://design.google/library/material-design-dark-theme)
- `gd.dark.content-first-chrome` (SHOULD) Quand l'écran sert à afficher le contenu de l'utilisateur (photos, articles), garder une interface neutre et peu contrastée qui ne modifie ni ne concurrence ce contenu. — [source](https://design.google/library/material-design-dark-theme)

## Couleur

- `gd.color.tonal-pairs` (SHOULD) Construire la palette comme une échelle tonale régulière et associer chaque rôle à un ton complémentaire qui garantit la lisibilité, quelle que soit la couleur source. — [source](https://design.google/library/sounds-good)
- `gd.color.user-source` (MAY) Laisser l'utilisateur choisir la couleur source du thème (choix manuel ou extraction depuis son fond d'écran) et la propager à toute l'interface. — [source](https://design.google/library/sounds-good)

## Densité d'écran

- `gd.density.independent-units` (MUST) Spécifier toutes les dimensions en unités indépendantes de la densité (dp, pt, px CSS) et fournir les ressources matricielles pour chaque multiplicateur de densité ciblé. — [source](https://design.google/library/demystifying-density)

## Mouvement

- `gd.motion.guide-focus` (SHOULD) Employer le mouvement pour orienter : désigner un point focal, déplacer les éléments partagés vers leur nouvelle place lors d'une transition. — [source](https://design.google/library/making-motion-meaningful)
- `gd.motion.natural-easing` (SHOULD) Réagir sans délai à l'entrée de l'utilisateur, accélérer et ralentir progressivement, sans départ ni arrêt brusques. — [source](https://design.google/library/making-motion-meaningful)
- `gd.motion.symbolic-bulk-change` (SHOULD) Pour un changement de masse (suppression multiple dans une grille), préférer un mouvement collectif simple et un fondu à des trajectoires individuelles qui se croisent. — [source](https://design.google/library/making-motion-meaningful)

## Lisibilité et typographie variable

- `gd.type.variable-font` (SHOULD) Préférer une police variable unique aux multiples fichiers statiques pour couvrir graisses et chasses, et réduire le poids téléchargé. — [source](https://design.google/library/variable-fonts-are-here-to-stay)
- `gd.type.optical-size` (SHOULD) Laisser actif le dimensionnement optique automatique pour que titres, corps et légendes utilisent le dessin adapté à leur taille. — [source](https://design.google/library/variable-fonts-are-here-to-stay)
- `gd.type.loose-spacing` (SHOULD) Éviter l'interlettrage serré en texte de lecture ; un espacement plus large réduit l'encombrement visuel et les lettres « effacées ». — [source](https://design.google/library/lexend-readability)
- `gd.type.distinct-glyphs` (SHOULD) Choisir des caractères où i, l, j et 1 se distinguent sans ambiguïté. — [source](https://design.google/library/lexend-readability)
- `gd.type.reader-control` (SHOULD) Permettre au lecteur d'ajuster police, taille et espacement : aucun réglage typographique ne convient à tous. — [source](https://design.google/library/lexend-readability)

## Son et haptique

- `gd.sensory.justify-feedback` (SHOULD) N'ajouter un son ou une vibration que s'il apporte une information utile à l'utilisateur ; le silence est le choix par défaut. — [source](https://design.google/library/ux-sound-haptic-material-design)
- `gd.sensory.frequency-discretion` (SHOULD) Plus une interaction est fréquente, plus son retour sonore ou haptique doit être discret. — [source](https://design.google/library/ux-sound-haptic-material-design)
- `gd.sensory.haptic-rhythm` (SHOULD) Coder l'information haptique par le rythme, l'intensité et la texture, et la synchroniser avec le son et le visuel pour signaler une progression. — [source](https://design.google/library/ux-sound-haptic-material-design)
- `gd.sensory.silent-modes` (MUST) Garantir que toute information transmise par le son reste disponible en modes silencieux et vibreur. — [source](https://design.google/library/ux-sound-haptic-material-design)
- `gd.sensory.short-notifications` (SHOULD) Concevoir des sons de notification courts, nets et non envahissants, et des alarmes dont le volume peut monter progressivement. — [source](https://design.google/library/creating-consistency-one-pixel-at-a-time)

## Conversation et voix

- `gd.voice.voice-or-tap` (SHOULD) Avant de concevoir une interaction vocale, vérifier qu'elle est plus adaptée qu'un simple geste tactile. — [source](https://design.google/library/conversation-design-intro)
- `gd.voice.natural-variants` (SHOULD) Accepter les nombreuses formulations naturelles d'une même intention (oui, d'accord, bien sûr…) plutôt qu'une commande figée. — [source](https://design.google/library/conversation-design-intro)
- `gd.voice.three-items` (SHOULD) Limiter toute liste énoncée à voix haute à trois éléments, puis proposer d'en entendre davantage. — [source](https://design.google/library/rule-of-three)
- `gd.voice.offload-to-screen` (SHOULD) Sur un appareil avec écran, énoncer les premiers éléments et afficher la liste complète à l'écran. — [source](https://design.google/library/rule-of-three)
- `gd.voice.dialect-coverage` (MUST) Évaluer la reconnaissance vocale avec des locuteurs représentatifs des accents et variétés de langue visés ; un utilisateur ne doit pas avoir à changer sa façon de parler pour être compris. — [source](https://design.google/library/racial-equity-everyday-products)

## IA et UX

- `gd.ai.human-need-first` (SHOULD) Partir d'un besoin humain réel avant de choisir l'apprentissage automatique ; si une personne experte ne sait pas accomplir la tâche, le modèle non plus. — [source](https://design.google/library/ux-ai)
- `gd.ai.concept-budget` (SHOULD) Plus la fonction est nouvelle ou dynamique, plus l'interface doit reposer sur des schémas familiers et fiables. — [source](https://design.google/library/ux-ai)
- `gd.ai.prototype-real-content` (SHOULD) Prototyper l'expérience avec le vrai contenu des utilisateurs plutôt qu'attendre un modèle opérationnel ou tester sur des données factices. — [source](https://design.google/library/ux-ai)
- `gd.ai.on-device` (SHOULD) Traiter localement quand c'est possible et ne rien faire sortir de l'appareil sans décision de l'utilisateur. — [source](https://design.google/library/ux-ai)
- `gd.ai.explain-capabilities` (SHOULD) Expliquer dès la prise en main ce que le système fait bien et comment l'utiliser, au lieu de le présenter comme magique. — [source](https://design.google/library/control-and-simplicity)
- `gd.ai.manual-override` (SHOULD) Laisser à l'utilisateur la décision finale et une commande manuelle complète en plus de l'automatisme, avec des réglages fins accessibles un niveau plus bas. — [source](https://design.google/library/control-and-simplicity)

## Retour d'état et modèles mentaux

- `gd.feedback.true-state` (MUST) Faire refléter à chaque indicateur l'état réel du système, jamais la seule intention de la commande envoyée. — [source](https://design.google/library/user-friendly)
- `gd.feedback.no-alarm-flood` (SHOULD-NOT) Ne pas déclencher une avalanche d'alertes simultanées ni réutiliser un même signal pour plusieurs sens ; regrouper, hiérarchiser, donner un sens unique à chaque signal. — [source](https://design.google/library/user-friendly)
- `gd.feedback.spatial-mapping` (SHOULD) Organiser les commandes pour qu'elles reproduisent la structure du système piloté, afin que l'utilisateur s'en forme un modèle mental juste. — [source](https://design.google/library/user-friendly)

## Expressivité (M3 Expressive)

- `gd.expressive.emphasize-key-action` (SHOULD) Rendre l'action principale plus grande, plus colorée et proche de l'endroit où elle sert, au lieu de la noyer parmi les commandes secondaires. — [source](https://design.google/library/expressive-material-design-google-research)
- `gd.expressive.keep-core-patterns` (MUST-NOT) Ne pas sacrifier les schémas d'interaction établis (liste structurée, libellés d'action) à l'effet visuel : l'expressivité ne compense jamais un manque de clarté. — [source](https://design.google/library/expressive-material-design-google-research)
- `gd.expressive.fit-context` (SHOULD) Doser l'expressivité selon le domaine et le public (plus calme pour la banque) et partir des parcours critiques avant de choisir les effets. — [source](https://design.google/library/expressive-material-design-google-research)
- `gd.expressive.feeling-with-purpose` (SHOULD) Utiliser forme, couleur, taille, mouvement et contenant pour hiérarchiser et grouper, de façon à susciter une émotion sans retomber dans un minimalisme froid. — [source](https://design.google/library/minimal-meaningful)

## Cohérence de système, simplicité

- `gd.system.shared-foundation` (SHOULD) Dériver toutes les variantes (thème, langue, densité, taille d'écran, accessibilité) d'une même fondation de règles et de tokens plutôt que de concevoir chaque contexte isolément. — [source](https://design.google/library/sounds-good)
- `gd.system.every-element-purpose` (SHOULD) Justifier chaque élément affiché par une fonction ; retirer ce qui n'en a pas. — [source](https://design.google/library/is-it-good-design)
- `gd.system.clear-north` (SHOULD) Indiquer dès l'écran d'entrée une direction principale évidente plutôt que plusieurs appels concurrents. — [source](https://design.google/library/no-such-thing-offline)

## Bien-être numérique

- `gd.wellbeing.context-not-shame` (SHOULD-NOT) Ne pas présenter les mesures d'usage (temps d'écran) comme un reproche ni de façon prescriptive ; les situer dans leur contexte et laisser la personne décider. — [source](https://design.google/library/designing-for-digital-wellbeing)
- `gd.wellbeing.healthy-defaults` (SHOULD) Intégrer de bons réglages par défaut (interruptions limitées, calme la nuit) plutôt que de reporter l'effort sur l'utilisateur. — [source](https://design.google/library/designing-for-digital-wellbeing)
- `gd.wellbeing.tone-by-stakes` (SHOULD) Adapter le ton aux enjeux : sobre et direct pour une alerte sérieuse, encourageant pour un objectif d'activité. — [source](https://design.google/library/the-goal-behind-the-goal)
- `gd.wellbeing.insight-headers` (SHOULD) Coiffer chaque graphique d'une phrase qui en donne la conclusion et l'action possible, plutôt que d'aligner des chiffres bruts. — [source](https://design.google/library/the-goal-behind-the-goal)

## Revue de design

- `gd.review.problem-first` (SHOULD) Ouvrir chaque revue de design par un accord sur le problème à résoudre, puis juger chaque détail à l'aune de ce problème. — [source](https://design.google/library/reviewing-the-design-review)
- `gd.review.stage-questions` (SHOULD) Adapter les questions au stade : problème et utilisateur au début, hiérarchie, schémas et mouvement en milieu, fidélité, à-coups, textes, accessibilité et internationalisation après implémentation. — [source](https://design.google/library/reviewing-the-design-review)
- `gd.review.real-build` (SHOULD) Mener la revue finale sur un vrai build, sur les appareils cibles, dans plusieurs tailles d'écran et orientations. — [source](https://design.google/library/reviewing-the-design-review)

## Recherche UX et inclusion

- `gd.research.homework-first` (SHOULD) Avant le terrain, étudier les recommandations d'accessibilité et essayer soi-même les technologies d'assistance (lecteur d'écran, clavier seul). — [source](https://design.google/library/designers-guide-accessibility-research)
- `gd.research.diverse-participants` (SHOULD) Recruter des participants variés en âge, capacités, aisance technique, pays et appareils, et tester aussi bien les fonctions isolées que le parcours complet. — [source](https://design.google/library/designers-guide-accessibility-research)
- `gd.research.with-not-for` (SHOULD) Associer les communautés concernées, notamment sous-représentées, à l'idéation, la recherche, la conception, les tests et la communication. — [source](https://design.google/library/building-for-everyone)

## Sources

- https://design.google/library/designing-global-accessibility-part-2 : Google Terms of Service (propriétaire, reformulé)
- https://design.google/library/designing-global-accessibility-part-iii : Google Terms of Service (propriétaire, reformulé)
- https://design.google/library/designers-guide-accessibility-research : Google Terms of Service (propriétaire, reformulé)
- https://design.google/library/offline-design : Google Terms of Service (propriétaire, reformulé)
- https://design.google/library/material-design-dark-theme : Google Terms of Service (propriétaire, reformulé)
- https://design.google/library/sounds-good : Google Terms of Service (propriétaire, reformulé)
- https://design.google/library/demystifying-density : Google Terms of Service (propriétaire, reformulé)
- https://design.google/library/making-motion-meaningful : Google Terms of Service (propriétaire, reformulé)
- https://design.google/library/variable-fonts-are-here-to-stay : Google Terms of Service (propriétaire, reformulé)
- https://design.google/library/lexend-readability : Google Terms of Service (propriétaire, reformulé)
- https://design.google/library/ux-sound-haptic-material-design : Google Terms of Service (propriétaire, reformulé)
- https://design.google/library/creating-consistency-one-pixel-at-a-time : Google Terms of Service (propriétaire, reformulé)
- https://design.google/library/conversation-design-intro : Google Terms of Service (propriétaire, reformulé)
- https://design.google/library/rule-of-three : Google Terms of Service (propriétaire, reformulé)
- https://design.google/library/racial-equity-everyday-products : Google Terms of Service (propriétaire, reformulé)
- https://design.google/library/ux-ai : Google Terms of Service (propriétaire, reformulé)
- https://design.google/library/control-and-simplicity : Google Terms of Service (propriétaire, reformulé)
- https://design.google/library/user-friendly : Google Terms of Service (propriétaire, reformulé)
- https://design.google/library/expressive-material-design-google-research : Google Terms of Service (propriétaire, reformulé)
- https://design.google/library/minimal-meaningful : Google Terms of Service (propriétaire, reformulé)
- https://design.google/library/is-it-good-design : Google Terms of Service (propriétaire, reformulé)
- https://design.google/library/no-such-thing-offline : Google Terms of Service (propriétaire, reformulé)
- https://design.google/library/designing-for-digital-wellbeing : Google Terms of Service (propriétaire, reformulé)
- https://design.google/library/the-goal-behind-the-goal : Google Terms of Service (propriétaire, reformulé)
- https://design.google/library/reviewing-the-design-review : Google Terms of Service (propriétaire, reformulé)
- https://design.google/library/building-for-everyone : Google Terms of Service (propriétaire, reformulé)
