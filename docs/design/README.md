# docs/design : sources de design de référence

Sources, licences et mode (`sources.toml`, vérifié en ligne le 2026-11-13) ; outil `bun scripts/design-mirror.ts index|mirror|check` (sur fr1, robots.txt respecté, débit limité).

| Site                                                  | Licence constatée                       | Mode                     | URLs indexées |
| ----------------------------------------------------- | --------------------------------------- | ------------------------ | ------------- |
| m3.material.io                                        | conditions Google, aucune licence libre | index + specs réécrites  | 375           |
| material.io                                           | conditions Google, aucune licence libre | index + specs réécrites  | 370           |
| design.google                                         | conditions Google                       | index + specs réécrites  | 296           |
| vercel.com (geist, docs front, produits)              | Vercel Terms, propriétaire              | index + specs réécrites  | 195           |
| web.dev (a11y, perf, CWV, SEO, wasm)                  | CC BY 4.0 / Apache 2.0                  | miroir texte (348 pages) | 354           |
| developer.chrome.com (Lighthouse, CrUX, WebGPU, wasm) | CC BY 4.0 / Apache 2.0                  | miroir texte (245 pages) | 248           |

- `index/<site>.json` : URLs, sections, lastmod, licence et preuve.
- `../../third_party/design-mirror/<site>/` : markdown, en-tête url/date/sha256/licence, `MANIFEST.json`.
- `specs/<domaine>/<source>.{md,json}` : règles normatives réécrites (schéma `specs/spec.schema.json`, 441 règles) :
  tokens (material-3, geist), components (material-3 : 36, geist : 75), motion (material-3), a11y (material-3, web), seo (web), perf (core-web-vitals, vercel-frontend), gpu-wasm (webgpu-wasm), principles (google-design).
- Skills : `.agents/skills/{material-3,google-design,vercel-geist,web-a11y-seo-cwv,webgpu-wasm-ui}` (plugin aphrody-skills, `just agents-sync`).
- Recherche : `ai-os brain design` indexe specs, index et miroir dans le Context store (`~/.agent/memory.sqlite`, scope `design`) ; `ai-os brain absorb` l'inclut.

Cible UI de src inchangée : `packages/design` et la skill ui-system ; ces specs servent de référence et de contrôle.
