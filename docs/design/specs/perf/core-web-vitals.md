# Core Web Vitals et performance de chargement

Spec `web.core-web-vitals` · domaine `perf` · sources lues le 2026-11-13 · JSON : [`core-web-vitals.json`](./core-web-vitals.json) (schéma `../spec.schema.json`).

Seuils, méthode de mesure et remèdes pour LCP, INP et CLS (plus FCP et TTFB en diagnostic). S'applique à toute page servie par src (bun, WebUI, Workers). Le terrain (p75, RUM et CrUX) fait foi ; le labo (Lighthouse 13, DevTools) sert au diagnostic.

Synthèse normative réécrite ; aucun passage recopié. Textes sources sous CC BY 4.0 (code Apache 2.0), © Google LLC et auteurs cités, sauf WCAG 2.2 (W3C Document License, cité par numéro).

Niveaux : MUST, MUST-NOT, SHOULD, SHOULD-NOT, MAY au sens de la RFC 2119.

## Règles

| id | niveau | règle | valeur | source |
|---|---|---|---|---|
| `web.cwv.p75` | MUST | Évaluer chaque métrique au 75e centile des chargements de page mesurés sur le terrain, séparément pour mobile et desktop. | `{"percentile":75,"segments":["mobile","desktop"]}` | [lien](https://web.dev/articles/vitals) |
| `web.cwv.pass-all-three` | MUST | Une page n'est conforme que si LCP, INP et CLS sont tous trois dans la zone « bonne » au p75 ; la page est « mauvaise » pour une métrique dès que 25 % des vues franchissent le seuil mauvais. | `{"poor_share_trigger":0.25}` | [lien](https://web.dev/articles/defining-core-web-vitals-thresholds) |
| `web.cwv.lcp-threshold` | MUST | LCP au p75 inférieur ou égal à 2500 ms ; au-delà de 4000 ms la page est mauvaise. | `{"good_ms":2500,"poor_above_ms":4000}` | [lien](https://web.dev/articles/defining-core-web-vitals-thresholds) |
| `web.cwv.inp-threshold` | MUST | INP au p75 inférieur ou égal à 200 ms ; entre 200 et 500 ms à améliorer ; au-delà de 500 ms mauvais. | `{"good_ms":200,"poor_above_ms":500}` | [lien](https://web.dev/articles/inp) |
| `web.cwv.cls-threshold` | MUST | CLS au p75 inférieur ou égal à 0,1 ; au-delà de 0,25 mauvais. | `{"good":0.1,"poor_above":0.25}` | [lien](https://web.dev/articles/defining-core-web-vitals-thresholds) |
| `web.cwv.fcp-threshold` | SHOULD | FCP au p75 inférieur ou égal à 1800 ms ; au-delà de 3000 ms mauvais. Métrique de diagnostic, hors Core Web Vitals. | `{"good_ms":1800,"poor_above_ms":3000}` | [lien](https://web.dev/articles/fcp) |
| `web.cwv.ttfb-threshold` | SHOULD | TTFB au p75 inférieur ou égal à 800 ms ; au-delà de 1800 ms mauvais. Diagnostic : l'objectif réel est de laisser FCP et LCP dans le vert. | `{"good_ms":800,"poor_above_ms":1800}` | [lien](https://web.dev/articles/ttfb) |
| `web.cwv.no-fid` | MUST-NOT | Ne plus viser ni rapporter FID comme métrique de réactivité : INP l'a remplacé parmi les métriques stables. |  | [lien](https://web.dev/articles/vitals) |
| `web.cwv.inp-computation` | SHOULD | Calculer INP avec la bibliothèque web-vitals plutôt qu'à la main ; l'algorithme écarte la pire interaction par tranche de 50 et l'API Event Timing ne remonte par défaut que les événements de plus de 104 ms (minimum réglable 16 ms). | `{"ignore_one_per_interactions":50,"event_timing_default_threshold_ms":104,"event_timing_min_threshold_ms":16}` | [lien](https://web.dev/articles/inp) |
| `web.cwv.cls-session-window` | MUST | Interpréter CLS comme la pire rafale de décalages : écarts de moins de 1 s, fenêtre de 5 s au plus ; les décalages survenant dans les 500 ms suivant une saisie utilisateur sont exclus. | `{"gap_ms":1000,"window_max_ms":5000,"recent_input_ms":500}` | [lien](https://web.dev/articles/cls) |
| `web.cwv.lcp-breakdown` | SHOULD | Répartir le LCP en quatre sous-parties et viser environ 40 % TTFB, moins de 10 % de délai avant chargement, environ 40 % de chargement de la ressource, moins de 10 % de délai de rendu ; ce sont des repères, pas des seuils. | `{"ttfb_pct":40,"resource_load_delay_pct_max":10,"resource_load_duration_pct":40,"element_render_delay_pct_max":10}` | [lien](https://web.dev/articles/optimize-lcp) |
| `web.cwv.lcp-discoverable` | MUST | La ressource LCP doit être découvrable dans le HTML initial (img/srcset ou preload) et commencer à charger dès que possible, sans dépendre d'un script. |  | [lien](https://web.dev/articles/optimize-lcp) |
| `web.cwv.lcp-fetchpriority` | SHOULD | Marquer l'image LCP avec fetchpriority="high" ; abaisser au besoin la priorité des scripts de fin de body. |  | [lien](https://web.dev/articles/fetch-priority) |
| `web.cwv.lcp-not-lazy` | MUST-NOT | Ne pas appliquer loading="lazy" à l'image LCP ni aux images du premier écran ; le lazy-loading natif reste recommandé pour le reste. |  | [lien](https://web.dev/articles/lcp-lazy-loading) |
| `web.cwv.lcp-same-origin` | SHOULD | Servir la ressource LCP depuis l'origine du document ; sinon preconnect vers l'origine tierce (CDN d'images compris). |  | [lien](https://web.dev/articles/optimize-lcp) |
| `web.cwv.preload-order` | SHOULD | Ordonner les preloads : un preload en en-tête HTTP passe avant tout ; preloads de polices en fin de head ; preloads d'images (priorité basse ou moyenne par défaut) placés par rapport aux scripts async. |  | [lien](https://web.dev/articles/fetch-priority) |
| `web.cwv.ttfb-remedies` | SHOULD | Réduire TTFB : hébergement adapté, CDN, contenu mis en cache, aucune chaîne de redirections, HTML streamé, service worker, 103 Early Hints pour les ressources critiques ; instrumenter avec Server-Timing. |  | [lien](https://web.dev/articles/optimize-ttfb) |
| `web.cwv.img-dimensions` | MUST | Donner width et height (ou aspect-ratio) à chaque image et vidéo pour réserver la place avant chargement. |  | [lien](https://web.dev/articles/optimize-cls) |
| `web.cwv.reserve-late-content` | MUST | Réserver l'espace des publicités, embeds et contenus tardifs ; charger le contenu nouveau sur action explicite (« Charger plus ») ; si le contenu met plus de 500 ms, réserver la place dans ce délai. | `{"reserve_within_ms":500}` | [lien](https://web.dev/articles/optimize-cls) |
| `web.cwv.composited-animations` | MUST-NOT | Ne pas animer top, left ni les propriétés qui relancent la mise en page ; animer transform/translate, qui ne compte pas dans CLS. |  | [lien](https://web.dev/articles/optimize-cls) |
| `web.cwv.font-format` | MUST | Polices en WOFF2 uniquement, auto-hébergées et sous-ensemblées ; ne jamais incorporer le fichier de police en base64 dans le CSS. |  | [lien](https://web.dev/learn/performance/optimize-web-fonts) |
| `web.cwv.font-display` | SHOULD | Utiliser font-display: optional (police utilisée seulement si elle arrive en 100 ms) pour supprimer le décalage, ou swap avec une pile de repli explicite et size-adjust/ascent-override/descent-override/line-gap-override ; précharger les polices critiques. | `{"optional_block_ms":100}` | [lien](https://web.dev/articles/optimize-cls) |
| `web.cwv.long-task` | MUST | Aucune tâche du thread principal ne doit dépasser 50 ms ; au-delà, la portion excédentaire est du temps bloquant. | `{"long_task_ms":50}` | [lien](https://web.dev/articles/optimize-long-tasks) |
| `web.cwv.yield` | SHOULD | Céder la main avec await scheduler.yield() (continuation prioritaire), avec repli setTimeout(0) détecté par globalThis.scheduler?.yield ; dans les boucles, céder environ toutes les 50 ms plutôt qu'à chaque itération. | `{"yield_deadline_ms":50,"support":{"chrome":129,"firefox":142,"safari":"non"}}` | [lien](https://web.dev/articles/optimize-long-tasks) |
| `web.cwv.no-isinputpending` | MUST-NOT | Ne pas utiliser navigator.scheduling.isInputPending() pour décider quand céder. |  | [lien](https://web.dev/articles/optimize-long-tasks) |
| `web.cwv.inp-phases` | SHOULD | Traiter les trois phases d'une interaction : délai d'entrée (pas de tâche longue concurrente), callbacks d'événement (travail critique d'abord, le reste différé), délai de présentation (DOM réduit, rendu minimal) ; chaque iframe a son propre thread principal. |  | [lien](https://web.dev/articles/optimize-inp) |
| `web.cwv.loaf` | SHOULD | En RUM, attribuer les interactions lentes avec les entrées long-animation-frame (Chrome 123+, détection de fonctionnalité obligatoire) ; blockingDuration somme les tâches de plus de 50 ms, l'attribution par script couvre les scripts de plus de 5 ms. | `{"chrome":123,"blocking_task_ms":50,"script_attribution_min_ms":5}` | [lien](https://developer.chrome.com/docs/web-platform/long-animation-frames) |
| `web.cwv.content-visibility` | SHOULD | Appliquer content-visibility: auto avec contain-intrinsic-size aux sections hors écran longues ; ne pas appeler d'API DOM qui force le rendu de ces sections ; bénéfice direct sur INP au démarrage. | `{"support":{"chrome":85,"firefox":125,"safari":18}}` | [lien](https://web.dev/articles/content-visibility) |
| `web.cwv.bfcache-no-unload` | MUST-NOT | Ne jamais enregistrer d'écouteur unload ; utiliser pagehide/visibilitychange. |  | [lien](https://web.dev/articles/bfcache) |
| `web.cwv.bfcache-no-store` | SHOULD-NOT | Éviter Cache-Control: no-store sur le document principal hors pages réellement sensibles ; fermer les connexions ouvertes au pagehide, éviter window.opener, rafraîchir les données périmées au pageshow persisté. |  | [lien](https://web.dev/articles/bfcache) |
| `web.cwv.bfcache-measure` | SHOULD | Mesurer le taux de restauration bfcache et diagnostiquer les refus avec PerformanceNavigationTiming.notRestoredReasons (Chrome 123+), sans dépendre du texte des raisons ; compter chaque restauration comme une visite distincte (LCP = delta pageshow → frame suivante, INP remis à 0). | `{"notrestoredreasons_chrome":123}` | [lien](https://developer.chrome.com/docs/web-platform/bfcache-notrestoredreasons) |
| `web.cwv.speculation-rules` | SHOULD | Précharger ou prérendre les navigations probables via des règles de spéculation document avec eagerness moderate (survol 200 ms desktop ou pointerdown) ; réserver immediate aux listes courtes ; tenir compte du coût réseau, mémoire et CPU. | `{"moderate_hover_ms":200,"eager_hover_ms_desktop":10}` | [lien](https://developer.chrome.com/docs/web-platform/prerender-pages) |
| `web.cwv.speculation-limits` | MUST | Respecter les plafonds Chrome : immediate 50 prefetch / 10 prerender ; eager et moderate 2/2 sur desktop, 6/2 sur mobile ; conservative 2/2 (FIFO). Chrome n'exécute aucune spéculation avec Save-Data, économiseur d'énergie sur batterie faible, contrainte mémoire, réglage désactivé ou onglet en arrière-plan. | `{"immediate":{"prefetch":50,"prerender":10},"eager_moderate_desktop":{"prefetch":2,"prerender":2},"eager_moderate_mobile":{"prefetch":6,"prerender":2},"conservative":{"prefetch":2,"prerender":2}}` | [lien](https://developer.chrome.com/docs/web-platform/prerender-pages) |
| `web.cwv.crux-plus-rum` | SHOULD | Compléter CrUX (Chrome seul, utilisateurs consentants, sans iOS) par une mesure RUM propre ; ne pas s'attendre à des chiffres identiques. |  | [lien](https://web.dev/articles/crux-and-rum-differences) |
| `web.cwv.rum-hygiene` | MUST | La mesure RUM rapporte des distributions (jamais des moyennes), envoie au bon moment, ne crée aucune tâche longue et utilise des API non bloquantes ; versionner les changements pour corréler. |  | [lien](https://web.dev/articles/vitals-field-measurement-best-practices) |
| `web.cwv.lab-insights` | SHOULD | En labo, lire les insights Lighthouse 13 / DevTools (lcp-discovery-insight, lcp-phases-insight, interaction-to-next-paint-insight, cls-culprits-insight, document-latency-insight, render-blocking-insight, image-delivery-insight, font-display-insight) ; le labo ne remplace pas le p75 terrain. |  | [lien](https://developer.chrome.com/blog/lighthouse-13-0) |

## Conflits et réserves relevés

- web.dev/articles/vitals écrit le seuil CLS « 0.1. » (point parasite) ; la valeur 0,1 est confirmée par web.dev/articles/cls et defining-core-web-vitals-thresholds.
- scheduler.yield() : Chrome 129 et Firefox 142, Safari non pris en charge selon optimize-long-tasks ; le repli setTimeout reste obligatoire.
- La page optimize-long-tasks (mise à jour le 2024-12-19) affiche aussi isInputPending (Chrome 87, Firefox et Safari non) : la page déconseille l'API malgré son support Chromium.
- Lighthouse 13 (blog du 2025-10-10) a retiré lcp-lazy-loaded et prioritize-lcp-image au profit de lcp-discovery-insight ; les pages d'audit historiques indexées pour DCC sont donc partiellement obsolètes.
- La spec ne reprend pas l'heuristique mobile eager/moderate (modifiée en août 2025 et janvier 2026 selon prerender-pages, mise à jour le 2026-10-29) : seules les limites chiffrées sont normatives.

## Sources

- <https://web.dev/articles/vitals> — CC-BY-4.0 (texte), Apache-2.0 (code)
- <https://web.dev/articles/defining-core-web-vitals-thresholds> — CC-BY-4.0 (texte), Apache-2.0 (code)
- <https://web.dev/articles/lcp> — CC-BY-4.0 (texte), Apache-2.0 (code)
- <https://web.dev/articles/inp> — CC-BY-4.0 (texte), Apache-2.0 (code)
- <https://web.dev/articles/cls> — CC-BY-4.0 (texte), Apache-2.0 (code)
- <https://web.dev/articles/fcp> — CC-BY-4.0 (texte), Apache-2.0 (code)
- <https://web.dev/articles/ttfb> — CC-BY-4.0 (texte), Apache-2.0 (code)
- <https://web.dev/articles/optimize-lcp> — CC-BY-4.0 (texte), Apache-2.0 (code)
- <https://web.dev/articles/optimize-inp> — CC-BY-4.0 (texte), Apache-2.0 (code)
- <https://web.dev/articles/optimize-cls> — CC-BY-4.0 (texte), Apache-2.0 (code)
- <https://web.dev/articles/optimize-ttfb> — CC-BY-4.0 (texte), Apache-2.0 (code)
- <https://web.dev/articles/optimize-long-tasks> — CC-BY-4.0 (texte), Apache-2.0 (code)
- <https://web.dev/articles/fetch-priority> — CC-BY-4.0 (texte), Apache-2.0 (code)
- <https://web.dev/articles/lcp-lazy-loading> — CC-BY-4.0 (texte), Apache-2.0 (code)
- <https://web.dev/articles/browser-level-image-lazy-loading> — CC-BY-4.0 (texte), Apache-2.0 (code)
- <https://web.dev/learn/performance/optimize-web-fonts> — CC-BY-4.0 (texte), Apache-2.0 (code)
- <https://web.dev/articles/bfcache> — CC-BY-4.0 (texte), Apache-2.0 (code)
- <https://web.dev/articles/content-visibility> — CC-BY-4.0 (texte), Apache-2.0 (code)
- <https://web.dev/articles/crux-and-rum-differences> — CC-BY-4.0 (texte), Apache-2.0 (code)
- <https://web.dev/articles/vitals-field-measurement-best-practices> — CC-BY-4.0 (texte), Apache-2.0 (code)
- <https://developer.chrome.com/docs/web-platform/long-animation-frames> — CC-BY-4.0 (texte), Apache-2.0 (code)
- <https://developer.chrome.com/docs/web-platform/prerender-pages> — CC-BY-4.0 (texte), Apache-2.0 (code)
- <https://developer.chrome.com/docs/web-platform/bfcache-notrestoredreasons> — CC-BY-4.0 (texte), Apache-2.0 (code)
- <https://developer.chrome.com/docs/crux/methodology/metrics> — CC-BY-4.0 (texte), Apache-2.0 (code)
- <https://developer.chrome.com/blog/lighthouse-13-0> — CC-BY-4.0 (texte), Apache-2.0 (code)
