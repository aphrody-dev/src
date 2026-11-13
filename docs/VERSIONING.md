# Versioning and release channels (frozen 2026-11-13)

Frozen: changing this file needs a tribunal verdict in `docs/reviews/INDEX.md` (process rule, not checked
by code). The version rules below are checked by code: `ay release freeze --check`
(packages/release/src/freeze.ts) in `judge.yml`, `ay arch check` (ARCH-013), `canary.yml` and `release.yml` (dist).

## One version, one file

- `VERSION` (repo root, one line) is the only hand-written version of the monorepo: SemVer `MAJOR.MINOR.PATCH`.
- `ay release freeze` copies it into `Cargo.toml` `[workspace.package] version` (every crate with
  `version.workspace = true`), into the `version` of every path dependency on such a crate, and into the root
  `package.json`, then refreshes `Cargo.lock` offline. `--check` writes nothing and fails on any drift, on a
  `VERSION` that is not SemVer 2.0.0 (or carries `+build`), when origin's tags cannot be listed, or when `VERSION`
  is not above the last stable tag. `VERSION` may equal that tag only on the tagged commit itself.
- Tags: `vX.Y.Z` (stable, patch), `vX.Y.0-rc.N` (beta), rolling `canary` (prerelease). A tag always names a
  commit of main.

## Decisions

| Question | Verdict | Why |
|---|---|---|
| CalVer `2026.11.0` (package.json) or SemVer `v0.2.0` (tag) | SemVer wins; package.json now equals `VERSION` (0.3.0). CalVer survives only as the train name in release titles (`train 2026.11`), never as a version. | cargo, crates.io, npm and dist parse SemVer; a CalVer major (2026) would declare a breaking change every month to every dependent. |
| One monorepo version or one per package | One (lockstep): `ay`, every workspace crate, root package.json, tags, canary. Exception: a crate with its own `version` line (vendored, forked, `apps/*` products) or a public npm package (`@aphrody/*` without `private`) keeps its own SemVer and is bumped by `ay release` when its API changes. | Linux and Chromium ship one number; lockstep keeps path deps and `Cargo.lock` consistent with no per-crate bookkeeping. |
| SemVer of crates and npm packages | Strict SemVer, Cargo rules for `0.x` (MINOR = breaking). MINOR moves once per train, MAJOR only on a protocol/ABI break, PATCH for fixes. Pre-release suffixes: `-canary.N+sha7`, `-rc.N`. | Rust and Bun conventions; a canary `0.3.0-canary.N` sorts after the stable `0.2.0` it follows. |
| Backports | None: no release branches (owner rule: everything on main). A fix lands on main and ships forward: next canary at once, then the current rc. A patch tag `vX.Y.(Z+1)` on main is a real fix-only patch only during weeks 5-6, when main takes fixes only; outside them the fix ships in the next train (or an early rc), because a tag on main carries every commit before it. No LTS line: an LTS needs a branch. | One line of history; the 6-week train bounds how long a fix waits. |
| Public npm packages, crates with their own `version` | Independent SemVer, not gated by `freeze --check` (only lockstep fields are); `ay release` plans each against its registry. | Their consumers resolve them one by one. |

## Channels and train

| Channel | Cadence | Version | Where | Model |
|---|---|---|---|---|
| canary | every green `ci` on main + daily 03:00 UTC (newest green SHA, no-op if unchanged; never moves backwards) | `X.Y.Z-canary.<run>+<sha7>` | rolling GitHub prerelease `canary`, sha256 and git log notes; `ay-canary` on fr1 | Chromium Canary, Bun canary, Rust nightly |
| beta | weekly from week 5 | `vX.Y.0-rc.N` | GitHub prerelease built by `release.yml` (dist marks a suffixed tag as prerelease) | Linux `-rcN`, Rust beta, Chrome Beta |
| stable | end of a 6-week train | `vX.Y.0` | GitHub Release (dist), `ay self-update` | Rust stable, Chrome Stable |
| patch | fixes only | `vX.Y.Z`, Z > 0 | same as stable | Linux `x.y.z` |

- Train = 6 weeks (Rust). Weeks 1-4: merge window on main (Linux). Weeks 5-6: main is frozen to fixes
  (Linux `-rc` model), one rc per week. With no branch, a tag ships everything below it: work that is not
  ready for the train lands only behind an off-by-default flag, and a patch tag after stable carries the same
  rule.
- After a stable tag `vX.Y.0`, the next commit sets `VERSION` to `X.(Y+1).0` and runs `ay release freeze`.
- Rollout ring: fr1 (factory), then fr2 (edge), then prd (production), each gated by `just ping` (exit 1
  on an unreachable host, a `degraded` systemd or any failed unit, or an endpoint outside its allowed codes).
  Canary follows the same order: installed and run as `ay-canary` on fr1 before the prerelease is published.
  Rollback = redeploy the previous tag.

## Commands

| Action | Command |
|---|---|
| Sync every version field from `VERSION` | `ay release freeze` (`--check` = the CI gate) |
| Canary now | `gh workflow run canary.yml` |
| rc / stable / patch | edit `VERSION`, `ay release freeze`, commit on main, then on fr1 `ay release` (dry-run), `ay release publish` |
| Publishing new crates.io / npm / PyPI packages | only those approved in `.agents/owner-rules.json`; without that file `ay release` stops at the dry-run |
| Fleet and public endpoint health | `just ping` |
