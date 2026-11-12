# npm : état de préparation (2026-11-12)

Vérifié sur fr2 avec `bun pm pack --dry-run` (bun 1.4.4) sur l'arbre `C:\src-merge` (branche merge/labs, 06ebcae ; même liste de 16 paquets que `C:\src\packages`). La disponibilité des noms a été lue sur `registry.npmjs.org`. C:\labs ne contient aucun package.json suivi (hors third_party), donc aucun paquet npm.

## Propriété du scope @aphrody

- `npm whoami` en local renvoie **401** : le token de `~/.npmrc` est expiré ou révoqué. La propriété n'a donc pas pu être confirmée directement.
- Indices : `@aphrody/web` (1.4.7) et `@aphrody/yolo` (3.2.0) ont pour seul mainteneur `yohan971` (adresse @live.fr). `@aphrody/yolo` déclare `repository: aphrody-code/YOLO` et `author: aphrody-code`. Il s'agit très probablement du compte du propriétaire.
- À faire : `npm login`, puis `npm whoami` (doit répondre `yohan971`) et `npm org ls aphrody`.

## Paquets (packages/*)

| Paquet | Version | private | license | repository | pack dry-run | Nom sur npm |
|---|---|---|---|---|---|---|
| @aphrody/agy | 2.0.0 | non | – | – | OK, 13 fichiers, 97,6 KB | libre |
| @aphrody/ai-os | 2.1.0 | non | – | – | OK, 76 fichiers, 5,1 MB | libre |
| @aphrody/ai-triad | 1.0.0 | non | – | – | OK, 23 fichiers, 206,9 KB | libre |
| @aphrody/brain | 0.1.0 | **oui** | – | – | OK, 6 fichiers | libre |
| @aphrody/bun-parity | 1.0.0 | non | MIT | – | OK, 36 fichiers | libre |
| @aphrody/bun-plugins | 1.0.0 | non | – | – | OK, 15 fichiers | libre |
| @aphrody/chromium-bun | 2.1.0 | non | – | – | OK, 41 fichiers | libre |
| @aphrody/env-kit | 1.0.0 | non | – | – | OK, 26 fichiers | libre |
| @aphrody/epic-games | 0.1.0 | non | – | – | OK, 10 fichiers | libre, **ne pas publier** |
| @aphrody/forge | 1.1.0 | non | – | – | OK, 22 fichiers | libre |
| @aphrody/google-design | 2.0.0 | **oui** | – | – | OK, 172 fichiers, **33,7 MB** | libre |
| @aphrody/knowledge-engine | 1.0.0 | non | – | – | OK, 18 fichiers | libre |
| @aphrody/machine | 0.1.0 | **oui** | – | – | OK, 8 fichiers | libre |
| @aphrody/pi-opencode | 1.0.0 | non | – | – | OK, 15 fichiers | libre |
| @aphrody/shell-matrix | 0.1.0 | **oui** | – | – | OK, 4 fichiers | libre |
| @aphrody/wck | 1.0.0 | non | – | – | OK, 17 fichiers | libre |

Les 16 passent `pack --dry-run`, et aucune dépendance `workspace:`/`file:`/`link:` ne bloquerait la publication.

## Correctifs nécessaires

1. `license` : ajoutée (`MIT OR Apache-2.0`) aux 15 paquets qui n'en ont pas, et `repository` (`aphrody-dev/src`, avec `directory`) aux 16, dans `src-publish-fields.patch`.
2. `@aphrody/epic-games` : ne pas le publier. Il embarque le client secret du launcher Epic (audit §1), ce que les CGU Epic interdisent. Le patch le passe en `"private": true`.
3. Les 4 paquets en `private: true` (brain, google-design, machine, shell-matrix) sont refusés par `npm publish`. Il faut une décision du propriétaire. google-design (33,7 MB) contient des assets Google, dont la licence est à vérifier avant toute publication.
4. Les paquets npm de aphrody-labs/aphrody-m3 sont tous déjà en `private: true` sauf identity, web-to-tauri, scaffold et m3-fonts. Leurs métadonnées ont été corrigées dans le dépôt (3e1dcf5).
5. Publication ensuite par `bun publish` (ou `npm publish --access public`), une fois le scope confirmé.
