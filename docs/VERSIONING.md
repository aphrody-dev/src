# Versioning and release channels (frozen 2026-11-13)

Frozen: changing this file needs a tribunal verdict in `docs/reviews/INDEX.md`. Enforced by
`ay arch check` (ARCH-013) and `.github/workflows/canary.yml`.

## Two numbers, one source each

| Number | Format | Source of truth | Who uses it | Model |
|---|---|---|---|---|
| Product (`ay`, every crate) | SemVer `MAJOR.MINOR.PATCH` | `[workspace.package] version` in `Cargo.toml`; crates use `version.workspace = true` | binaries, `ay self-update`, dist | Rust, Bun |
| Platform train (monorepo snapshot) | CalVer `YYYY.MM.PATCH` | `version` in root `package.json` | sites, images, fleet deploys | Chromium milestone, Linux release |

No other version is authored by hand: JS packages under `apps/`/`packages/` are private and keep
their own SemVer only for tooling; generated files read the two sources above.

## Channels (Chromium / Rust / Bun)

| Channel | Cadence | Version string | Where | Equivalent |
|---|---|---|---|---|
| canary | every green `ci` run on main + daily 03:00 UTC | `X.Y.Z-canary.<run>+<sha7>` | GitHub prerelease `canary` (rolling), `~/.local/bin/ay-canary` on fr1 | Chromium Canary, Rust nightly, Bun canary |
| beta | Monday of week 5 of a train | tag `vX.Y.0-rc.N` (weekly N) | GitHub prerelease, fr2 then prd | Linux `-rcN`, Rust beta, Chrome Beta |
| stable | end of a 6-week train | tag `vX.Y.0` | GitHub Release (dist), `ay self-update` | Rust stable, Chrome Stable |
| patch | any time, fixes only | tag `vX.Y.Z` (Z>0) | same as stable | Linux stable `x.y.z`, Chrome respin |

- Train: 6 weeks (Rust). Weeks 1-4 = merge window on main (Linux), weeks 5-6 = rc weekly; only
  fixes land in the release delta, features keep landing on main for the next train (no branches:
  the rc tag points to a main commit, patches are new main commits re-tagged).
- MINOR bumps once per train. MAJOR bumps only on a protocol/ABI break (Rust edition rule) or when
  MINOR would pass 19 (Linux 'fingers and toes' rule). PATCH resets at each MINOR.
- Platform CalVer: `YYYY.MM` = month of the stable tag, `PATCH` = deploy count in that month.
- Rollout ring for every channel promotion: fr1 (factory) -> fr2 (edge) -> prd (production),
  each gated by `just ping` and `just cluster-proof`; rollback = redeploy the previous tag.

## Commands

| Action | Command |
|---|---|
| Health of the fleet and public endpoints | `just ping` |
| Canary now | `gh workflow run canary.yml` (or wait for the next green `ci`) |
| rc / stable | bump `Cargo.toml` + `tools.toml` `ay` pin, commit on main, tag `vX.Y.Z[-rc.N]`; `release.yml` (dist) builds |
