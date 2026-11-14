# Bun 1.4.5 canary (fork aphrody-labs/bun)

Snapshot of `oven-sh/bun` `main` (the 1.4.5 canary; the latest stable release is 1.4.4, 2026-10-22), on top of the fork `third_party/bun` (25 own patches, 0 behind upstream on 2026-11-14).

- Refresh: `gh repo sync aphrody-labs/bun -b main`, `git -C third_party/bun pull --ff-only`, then `bun scripts/upstream-scan.ts bun --days 30`.

| File | Source |
|---|---|
| `PRS.md`, `data/prs.json` | PRs merged on main (30 days) and open PRs (latest 300), `gh pr list` |
| `COMMITS.md` | `git log` main over 30 days |
| `RELEASES.md` | latest 60 GitHub releases (full notes) |
| `BLOG.md` | `https://bun.com/rss.xml` feed |
| `WORKSPACE.md` | `packages/` (plugins, bun-types, usockets/uws, inspector) and Rust crates (`src/*`, `packages/*`) |
| `graph/GRAPH_REPORT.md`, `graph/ARCHITECTURE.mermaid`, `graph/graph.svg` | `ay graph build -o docs/bun/graph third_party/bun` (985,887 nodes, 2,080,599 edges) |

The raw graphs (650 to 830 MB) stay local (`.gitignore`); queries: `ay graph query|path|explain`, `ay graph mcp`. Official docs: `third_party/bun/docs`, and `ay docs bun <query>`.

Fork tooling: Rust `nightly-2026-09-15` (the fork's `rust-toolchain.toml`) is installed with rustfmt, clippy and rust-analyzer; the full build (Zig, WebKit, LLVM) runs on fr1.
