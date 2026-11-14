# NHITL VCS & GitHub Forge Specification (`docs/native/VCS-FORGE.md`)

Canonical reference for repository identity, zero-PAT GitHub App authentication, submodules, worktrees, issues, pull requests, and upstream forks in `aphrody-labs/aphrody`.

## 1. Repository & Remote Topology

- **Canonical GitHub Repository**: `https://github.com/aphrody-labs/aphrody` (defined in [identity.toml](file:///C:/src/identity.toml), validated across Cargo and Bun manifests via [identity.ts](file:///C:/src/scripts/identity.ts)).
- **Local Git Remotes**:
  - `aphrody` (`branch.main.remote = aphrody`): `https://github.com/aphrody-labs/aphrody.git`
  - `origin`: `https://github.com/aphrody-labs/aphrody.git` (compatibility alias for scripts expecting `origin`)
  - `all`: multi-push remote mirroring to GitHub (`aphrody-labs/aphrody`), GitLab (`aphrody-dev/src`), and Cloud Source Repositories.
- **PreToolUse Hooks Disabled**: `.agents/hooks.json`, `~/.gemini/config/hooks.json`, and `plugins/aphrody-nhitl/hooks/hooks.json` run with zero `PreToolUse` interception so CLI and forge commands execute without per-command hook latency.

## 2. NHITL GitHub App Authentication (`aphrody-labs`)

Every Git and GitHub API operation runs without Personal Access Tokens (PATs) and without interactive browser logins via the `aphrody-labs` GitHub App (`App ID: 5738700`, `Client ID: Iv23lijoWSPaWmQVMB8e`, `Installation: 181463765`):

- **Secret Vault**: `APHRODY_APP_KEY` and `APHRODY_APP_CLIENT_ID` are stored encrypted at rest via Windows DPAPI ([secret-store.ts](file:///C:/src/packages/env-kit/src/secret-store.ts)) on workstations and `systemd-creds --user` on Linux fleet hosts (`fr1`, `fr2`, `prd`).
- **Token Minter & Cache**: [gh-token.ts](file:///C:/src/infra/agents/gh-token.ts) signs a short-lived RS256 App JWT, exchanges it for a 1-hour installation token (`var/agents/state/gh-token.json`, `0600`), refreshes 10 minutes before expiry, and refuses to print raw tokens to a TTY.
- **Transparent Wiring**:
  - **Git HTTPS**: `git config --global credential.https://github.com.helper "!bun C:/src/infra/agents/gh-token.ts git"`
  - **GitHub CLI**: `~/.local/bin/gh.cmd` and `~/.local/bin/gh` inject `GH_TOKEN` / `GITHUB_TOKEN` automatically before invoking the native `gh` binary.

## 3. Unified VCS & Forge CLI (`ay-vcs` / `just vcs`)

[vcs.ts](file:///C:/src/scripts/vcs.ts) (`ay-vcs` in `~/.local/bin` or `just vcs <domain>`) provides deterministic, scriptable (`--json`) commands backed by the `aphrody-labs` GitHub App, Git 2.56 (`--filter=blob:none`), Gitoxide (`gix` 0.61), and Jujutsu (`jj` 0.46):

| Domain            | Commands                                                        | Behavior                                                                                                                                                                                                                                                       |
| :---------------- | :-------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Auth**          | `just vcs auth`                                                 | Verifies live GitHub App token minting, `aphrody-labs/aphrody` metadata, installation repo count, and `git ls-remote aphrody HEAD`.                                                                                                                            |
| **Submodules**    | `just vcs submodules status\|init\|sync\|verify`                | Audits `.gitmodules` (`apps/rosegriffon`, `apps/shenron`) against gitlinks (`160000`) and [src.lock.json](file:///C:/src/src.lock.json); initializes shallow/blobless checkouts (`--depth 1`) and fast-forwards cleanly.                                       |
| **Worktrees**     | `just vcs worktree list\|add <name> [ref]\|rm <name>\|prune`    | Isolates ephemeral detached or branched checkouts strictly inside gitignored `.worktrees/<name>`, surfaces colocated `jj workspace list` state, and prunes stale metadata without touching the root `main` tree.                                               |
| **Issues**        | `just vcs issue list\|view <n>\|create --title T\|close <n>`    | Queries, creates, and closes issues directly via GitHub REST API v2022-11-28 as `aphrody-labs[bot]` (`--json` supported).                                                                                                                                      |
| **Pull Requests** | `just vcs pr list\|view <n>\|checks <n>\|create ...\|merge <n>` | Lists/creates PRs, inspects commit `check-runs` CI conclusions (non-zero exit on red checks), and performs server-side squash/rebase merges.                                                                                                                   |
| **Forks**         | `just vcs fork audit\|sync <repo\|--all>\|add <owner/repo>`     | Audits [forks.txt](file:///C:/src/third_party/forks.txt) against `aphrody-labs/*` with bounded concurrency, syncs forks server-side via `POST /repos/aphrody-labs/<fork>/merge-upstream` (zero local clone), and forks + registers new upstreams idempotently. |
