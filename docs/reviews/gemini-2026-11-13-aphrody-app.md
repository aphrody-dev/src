# Revue Gemini 2026-11-13 : aphrody.app (packages/deploy : worker.ts, serve.ts, access.ts)

Relais `gemini_review` (moteur antigravity), extraits relus sans exécution. Note : **11/20**.

| # | Défaut | Statut |
|---|---|---|
| 1 | `_state.json` en lecture-modification-écriture sans CAS (promote, finalize concurrents) | TODO : Durable Object par projet ou `onlyIf.etagMatches` ; mitigé aujourd'hui par un seul écrivain (CI, `concurrency: deploy-main`) |
| 2 | PUT files : `decodeURIComponent` sans try, filtre `..` incomplet, `x-cache-control` libre | corrigé (segments validés, 400 sur encodage invalide, longueur bornée, en-tête retiré) |
| 3 | Clé de cache non normalisée, ignore les en-têtes `extra` | corrigé (chemin décodé puis ré-encodé, `extra` dans la clé) ; repli `index.html` immuable : sans effet, une deployment ne change jamais |
| 4 | 304 strict (ETag faibles, listes) | TODO |
| 5 | `res.headers.set` sur réponse immuable | réfuté : `fromR2` construit un `new Response`, en-têtes modifiables (tests verts) |
| 6 | CSRF : Origin absent accepté | corrigé (Origin égal, sinon `Sec-Fetch-Site: same-origin` exigé) |
| 7 | `iss` optionnel, `nbf` ignoré | corrigé (`iss` exigé, `nbf`, 30 s de tolérance) |
| 8 | certs non rechargés sur `kid` inconnu | TODO |
| 9 | API de lecture et previews publiques | assumé : dépôt public, previews publiques par conception (noindex) ; journaux authentifiés |
| 10 | `fetch(req)` en passthrough | réfuté : seul le zone aphrody.app route vers le Worker ; les noms explicites (tunnel, R2) doivent garder leur origine |
| 11 | pointeur en cache 5 s par isolate | assumé et documenté (rollback visible sous 5 s) |
| 12 | longueur de clé R2 non bornée | corrigé côté écriture (512) |
