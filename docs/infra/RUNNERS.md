# CI runners and images: fit to real load (audit 2026-11-13)

Sources: `gh api repos/actions/runner-images/readme` and `images/ubuntu-slim/ubuntu-slim-Readme.md` (official labels and announcements); job durations measured from the last successful run of each workflow (`gh run view --json jobs`, aphrody-labs/src, 2026-11-13); `rg runs-on .github/workflows`; `infra/docker/Dockerfile`.

## What the labels are today

- `ubuntu-latest` = Ubuntu 24.04 x64; GitHub announces it moves to Ubuntu 26.04 in November 2026 (runner-images#14748). 26.04 and 26.04 Arm64 are GA (`ubuntu-26.04`, `ubuntu-26.04-arm`).
- Ubuntu 22.04 images: deprecation began 2026-09-17, fully unsupported 2027-04-17 (runner-images#14254).
- `ubuntu-slim`: Ubuntu 24.04.5 image with a reduced toolset (bash, node, python); CPU/RAM limits are not stated in the image readme (unverified).
- `windows-latest` = `windows-2025` = `windows-2025-vs2026`; `windows-11-arm` exists for Arm64.

## Inventory and measured load

| Runner                                         | Jobs                                                                                                                    | Measured duration                | Fit                                                                                                                                                     |
| :--------------------------------------------- | :---------------------------------------------------------------------------------------------------------------------- | :------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ubuntu-latest` (19 jobs)                      | upstream-sync 0.8 min, deploy 0.4, gcp-oidc 0.2, npm-publish 0.3, ci-revert 0.1, linux-pkg matrix 0.2-1.0, nt linux 0.3 | under 1 min, no compilation      | Oversized for these: candidates for `ubuntu-slim`. Implicit version change in November 2026: pin `ubuntu-24.04` or move to `ubuntu-26.04` deliberately. |
| `ubuntu-24.04` (`release.yml`, since 0bf012b7) | cargo-dist plan/build/host/announce                                                                                     | no successful run in the last 15 | Moved off 22.04 (unsupported 2027-04-17); recorded as a manual patch in dist-workspace.toml.                                                            |
| `windows-2025-vs2026`                          | nt windows 4.6 min, interop 1.7, hal                                                                                    | real MSVC/WinUI work             | Correct: only image with VS 2026.                                                                                                                       |
| `windows-latest` (2 jobs)                      | ai-os, deps Windows build                                                                                               | no successful run in the last 15 | Same image as `windows-2025-vs2026`; pin the explicit label for reproducibility.                                                                        |
| `[self-hosted, fr1]`                           | ci.yml (Rust)                                                                                                           | no successful run in the last 15 | Matches the fleet rule (fr1 = factory). Owned by the labs-1b session (runner and CI on fr1).                                                            |

Workflows with no successful run in their last 15: ai-os, ci, claude, crates-publish, deps, hal, images, judge, jules, linux-kernel, release. Their failures come before runner choice and must be fixed first; the runner fit of their jobs is not measured.

## Container images (`infra/docker/Dockerfile`)

- Runtimes: `alpine:${ALPINE_VERSION}`, `oven/bun:*-alpine`, `golang:*-alpine*`; heavy toolchain: `archlinux:${ARCH_TAG}` (`dev`). This matches the policy (Alpine light, Arch heavy, never Debian/Ubuntu for our images).
- `linux-images.yml` builds `base-debian` and `linux-pkg.yml` tests `ubuntu`/`debian` targets: these are distribution targets of the packages being tested, not runtime images, so they do not break the policy.

## Trial

- `upstream-sync.yml` moved to `ubuntu-slim` on 2026-11-13: run succeeded in 60 s (48 s on `ubuntu-latest`). Works for API-only jobs; whether it is cheaper was not verified on a billing page.

## Not proven

"Best fit" is only shown here for the measured light jobs (under 1 min on a full runner). Compile-heavy jobs have no successful run to measure; no CPU/RAM limit of `ubuntu-slim` was read, so moving jobs there needs one measured run each.
