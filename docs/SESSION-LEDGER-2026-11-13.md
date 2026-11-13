# Session ledger, 2026-11-13

Statuses: done / partial / not started / owned (another session reports on it). Rows of the first table were checked by file, `git` and `gh api`. Rows of the two other tables are request themes read from those sessions; only the listed artifact was checked to exist, the work itself was not audited. Requests about accounts, credentials and identity are left out on purpose: this repository is public.

## Session src-10 (Epic, media, games)

| # | Request (abridged) | Status | Proof |
| :--- | :--- | :--- | :--- |
| 1 | Set up the whole Epic Games surface (API, SDK, CLI, skills, MCP, practices) from real sources | done | `docs/epic/RESOURCES.md`, skill `epic-games`, commits `6797a38b` to `4d8457aa`, review in `docs/reviews/gemini-2026-11-13-epic-resources.md` |
| 2 | No stubs, only real resources | done | `packages/epic-games` removed (`2b1a28fe`) |
| 3 | Continuous update of forks, commits and branches, plus news | partial | `upstream-sync.yml` and the fr1 `fork-sync.timer` run every 6 h, `docs/epic/snapshot.json`; no news feed |
| 4 | Fork the bevyengine organisation, freeze dependencies, refactor on Unreal, interop matrices | partial | 18 forks tracked and synced; bump, refactor and matrices not started |
| 5 | Media libraries matrix and a root C folder importing and exporting everything | partial | `docs/games/MEDIA-STACK.md`; no root folder (`docs/games/PLAN.md`, conflict 4); first graph of FFmpeg libavutil |
| 6 | Coordinate with the other sessions | partial | scopes exchanged by messages; no joint run |
| 7 | Prove that the chosen runners and images fit their load | partial | `docs/infra/RUNNERS.md`: light jobs measured, compile-heavy jobs not |
| 8 | Fact-check with Context7 and the `ay` CLI | partial | one claim checked; `ay arch check --strict`, `ay manifests verify` and `ay doctor` fail |
| 9 | Fork storytold, set up Unreal, Bevy, media and ArtCraft | partial | 32 forks plus `egui`, `storytold-winit`, `storytold-wgpu` (`97724e26`); `docs/games/ARTCRAFT.md`; no setup or deployment |
| 10 | Capture apps, design system, public API and dependencies | partial | API reference, stack and `craft-ui` read; one home-page screenshot outside git; no capture of the apps |
| 11 | Refactor src into a game engine and creative suite, flatten Storyteller, Craft, Bevy and media | not started | `docs/games/PLAN.md` section 5; goal stopped by the owner |
| 12 | Correct the plan, design system, README and project memory | done | this commit |
| 13 | UI framework is free if the result is good-looking, optimized and functional | done (decision recorded) | `docs/ui/STACK.md`, `docs/games/PLAN.md` |

Error of this session, corrected here: the first plan was written without reading `Cargo.toml`, `docs/ui/STACK.md`, `docs/tv` and `src.lock.json`, and contradicted them.

## Session labs-1b

| Theme | Status | Artifact seen |
| :--- | :--- | :--- |
| Merge labs, nt and tv into src | owned | `apps/nt`, `crates/tv-*`, README section "Labs" |
| Shell setup shared across shells | owned | `docs/shell`, `packages/shell-matrix` |
| Follow-up of the review of the merge (identity, root, duplicates, pins) | owned | `identity.toml` |
| Install on workstation and servers, container images | owned | `infra/docker`, `docs/infra/DEPLOY.md` |
| Multi-agent orchestration across hosts | owned | `packages/ai-os/docs/ORCHESTRATOR.md` |
| unixwin | owned | `apps/unixwin`, `infra/unixwin`, `docs/unixwin` |
| Dependencies, fleet load balancing, reboot survival | owned | not checked |
| Organisation model | owned | `docs/ALPHABET.md` |
| Closing, canary release, freeze | owned | `.github/workflows/canary.yml` |
| Stop of agents | owned | not checked |

## Session nt-d6

| Theme | Status | Artifact seen |
| :--- | :--- | :--- |
| No human in the loop everywhere | owned | `plugins/aphrody-nhitl` |
| Inference providers | owned | `infra/ai/ai.toml`, `ay ai` |
| Browser automation, engines and runtimes | owned | `ay engines`, `ay rt` |
| Install channels and toolchain | owned | `ay up` |
| Bun fork, documentation migration, upstream compatibility | owned | `ay bun`, `ay docs`, `ay upstream`, `docs/upstream` |
| Steam and Linux gaming surface | owned | `docs/gaming/OWNERSHIP.md`, `crates/steam-depot`, `ay steam` |
| Vault | owned | `docs/infra/VAULT.md`, `ay vault` |
| GitHub App | owned | `docs/infra/GITHUB-APP.md` |
| Linux kernel and packages | owned | `ay linux`, `ay pkg` |
| Review automation | owned | `docs/reviews/auto` |
| Site content, caches, cleanup of servers | owned | not checked |
| Stop of agents | owned | not checked |
