# Next.js canary (fork aphrody-labs/next.js)

Base de travail pour patcher Next.js : Modern Web Guidance, Lighthouse 100, Bun AOT (`apps/shenron/apps/server`).

- Source : `third_party/next.js` (clone partiel `blob:none`, branche `canary`, remotes `origin` = aphrody-labs, `upstream` = vercel), entrée `nextjs` de `third_party/ECOSYSTEM.toml`.
- Rafraîchir : `gh repo sync aphrody-labs/next.js -b canary`, `git -C third_party/next.js pull`, puis `bun packages/upstream/src/upstream-scan.ts nextjs --days 30`.

## Contenu

| Fichier | Source |
|---|---|
| `PRS.md`, `data/prs.json` | PR fusionnées sur canary (30 j) et PR ouvertes (300 dernières), `gh pr list` |
| `COMMITS.md` | `git log` canary sur 30 j |
| `RELEASES.md` | 60 dernières releases GitHub (notes complètes) |
| `BLOG.md` | flux `https://nextjs.org/feed.xml` |
| `WORKSPACE.md` | paquets npm, plugins/outils, crates Rust (`crates/`, `turbopack/crates/`) |
| `graph/GRAPH_REPORT.md`, `graph/ARCHITECTURE.mermaid`, `graph/graph.svg` | `ay graph build -o docs/nextjs/graph third_party/next.js` (197 690 nœuds, 330 475 arêtes, 23 s) |

`graph.json`, `graph.html`, `graph.graphml` et `cypher.txt` (120 à 150 Mo chacun) restent locaux (`.gitignore`) ; requêtes : `ay graph query|path|explain`, ou `ay graph mcp`.

La documentation officielle est dans le fork : `third_party/next.js/docs` (`01-app`, `02-pages`, `03-architecture`, `04-community`).

## Outillage du fork

- Rust : `nightly-2026-11-13` (`rust-toolchain.toml` du fork) avec rustfmt, clippy, rust-analyzer, miri.
- JS : le dépôt impose `pnpm@12.9.1` ; exécuté sans installation globale via `bunx pnpm@12.9.1` (exception limitée au fork, Bun ne lit pas ses scripts de workspace).
- Build natif lourd (`next-swc`, Turbopack) : sur fr1, pas sur le PC.
- Audit : `bunx lighthouse <url>`, `wck <path> --spec=lh|cwv|mwg`.
