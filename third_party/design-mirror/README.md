# design-mirror

Miroir texte des sources de design sous licence libre, produit par `bun scripts/design-mirror.ts mirror` (sur fr1, robots.txt respecté, 1 requête par site toutes les 0,8 s, markdown servi nativement par le site via `Accept: text/markdown`).

| Site | Licence (vérifiée le 2026-11-13) | Pages |
|---|---|---|
| web.dev | CC BY 4.0 (texte), Apache 2.0 (code) | 348 |
| developer.chrome.com | CC BY 4.0 (texte), Apache 2.0 (code) | 245 |

Chaque fichier porte en tête `source_url`, `fetched`, `lastmod`, `sha256` (du corps), `license`, `attribution`. Modification : images et avatars retirés. `MANIFEST.json` par site ; `bun scripts/design-mirror.ts check` revérifie les sha256.

Sources propriétaires (m3.material.io, material.io, design.google, vercel.com) : aucun contenu ici, seulement l'index des URLs dans `docs/design/index/` et les specs réécrites dans `docs/design/specs/`. Configuration : `docs/design/sources.toml`.
