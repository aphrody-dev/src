# Revue Gemini : runtime d'aphrody.app (analytics, speed insights, images, edge config)

- Date : 2026-11-13
- Moteur : relais `gemini_review` (antigravity), 32,8 s
- Objet : `packages/deploy/src/runtime.ts` (extrait commenté soumis)
- Note : **11/20**

## Défauts relevés et suite donnée

| #   | Défaut                                                        | Suite                                                                                                   |
| --- | ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| 1   | Chemin d'image encodé (`%2e%2e`, `//`, `\`) non rejeté        | Corrigé : chemin limité à `[A-Za-z0-9._-]` par segment, segments `.`/`..` refusés ; test hostile ajouté |
| 2   | Repli non optimisé mis en cache un an                         | Corrigé : repli en `max-age=300`, jamais dans le cache immuable                                         |
| 3   | Format de sortie non filtré, pas de try/catch autour d'Images | Corrigé : liste blanche AVIF/WebP/PNG/JPEG, try/catch, repli sur l'original                             |
| 4   | Pas de limite de taille d'entrée                              | Corrigé : 20 Mio au plus, au-delà l'original est servi                                                  |
| 5   | `q` libre (1..100) : 100 variantes par image                  | Corrigé : `q` arrondi à 50, 75 ou 90                                                                    |
| 6   | `Vary: Accept` redondant                                      | Conservé : la réponse dépend d'`Accept` (négociation AVIF/WebP), le navigateur doit le savoir           |
| 7   | Pas d'ETag sur l'image transformée                            | Non traité : réponse immuable par commit, cache d'un an                                                 |
| 8   | Taille du beacon mesurée en caractères, après lecture         | Corrigé : `Content-Length` d'abord, puis octets UTF-8                                                   |
| 9   | Beacons acceptés de n'importe quelle origine                  | Corrigé : `Origin` et `Sec-Fetch-Site` doivent être same-origin (403 sinon) ; test ajouté               |
| 10  | Écriture DO bloquante                                         | Corrigé : `ctx.waitUntil` avec `catch`                                                                  |
| 11  | Filtre de robots contournable                                 | Documenté comme filtrage au mieux ; UA vide rejeté                                                      |
| 14  | `insights.js` en cache une heure                              | Corrigé : `max-age=600, stale-while-revalidate=86400`                                                   |
| 15  | Lecture publique d'edge config sans cache CDN                 | Partiel : `cache-control: public, max-age=10` et cache d'isolat de 10 s                                 |
| 16  | Écriture d'edge config non atomique                           | Non traité : écriture réservée au propriétaire (Access ou jeton)                                        |
| 17  | Purge et comptage à chaque beacon                             | Corrigé : purge une fois par jour et par instance ; index `(day, metric, v)`                            |
| 19  | INP approché présenté comme INP                               | Corrigé : libellé « INP approché » et explication dans le tableau de bord                               |
| 20  | Tests sur `bun:sqlite` au lieu du runtime Workers             | Non traité : vérifications en direct (AVIF 200, chemin encodé 400, beacon d'une autre origine 403)      |

## Vérification après correction

- `bun test` (packages/deploy) : 17 réussis, 0 échec.
- En direct sur aphrody.com : `/_aphrody/image?url=/shots/aphrody-app.webp&w=640&q=80` en `image/avif` (21 580 octets), `url=/%2e%2e/x.png` en 400, beacon avec `Origin: https://evil.example` en 403.
