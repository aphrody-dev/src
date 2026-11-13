# bun and Chromium forks: staying compatible with upstream

Date: 2026-11-13. Command: `ay upstream` (`packages/upstream`, run by bun). Configuration: `infra/upstream/stacks.toml`. Statuses: `infra/upstream/status/<stack>.toml`.

## 1. Chosen model, based on forks that last

| Project            | Mechanism found (source read on 2026-11-13)                                                                                                                                                                                                                                                                                                                                                                                                                  | What we keep                                                                                                                       |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------- |
| Electron           | `patches/config.json` (patch folder -> repository), one `.patch` per commit, order in `.patches`; `git-import-patches` (`git am`) and `git-export-patches` (`format-patch --keep-subject --no-stat --no-signature --zero-commit --full-index`); each patch justifies its reason: temporary (link to the upstream review), build, or incompatible functional change (`electron/electron` `docs/development/patches.md`, `script/lib/git.py` as of 2026-10-15) | "series" model for Chromium; same export options (`ay upstream export`); file names by the same rule (`munge_subject_to_filename`) |
| ungoogled-chromium | `patches/series` (quilt), `upstream-fixes/` folder for fixes meant for upstream, `devutils/validate_patches.py` against the real tree                                                                                                                                                                                                                                                                                                                        | check that patches apply on upstream at each pass, explicit separation of what goes upstream                                       |
| Brave              | one `.patch` per modified Chromium file, `npm run update_patches`, `build/commands/lib/applyPatches.js`                                                                                                                                                                                                                                                                                                                                                      | rejected: one patch per file does not match a PR, and the unit here is the PR                                                      |
| Yocto              | trailer `Upstream-Status: Pending                                                                                                                                                                                                                                                                                                                                                                                                                            | Submitted [where]                                                                                                                  | Backport [where] | Denied | Inappropriate [reason]` (docs.yoctoproject.org, contributor guide, Patch Upstream Status) | status vocabulary, as is |

Two models, one per forge:

- **bun, "branch" model**: the fork's default branch (`aphrody-labs/bun` `main`) = `oven-sh/bun` `main` (the canary channel) + a linear series of commits, one commit = one patch = one potential PR. Several agents push to this branch; the stack stays readable with `git log upstream/main..origin/main`.
- **Chromium, "series" model**: `.patch` files in `infra/upstream/chromium/patches/` (order `.patches`), applied on the tip of `chromium/src` `main` in a temporary index (nothing is written to the checkout). The GitHub fork `aphrody-labs/chromium` stays a mirror advanced by fast-forward ("merge-upstream" API): contributions go through Gerrit, not through GitHub.

## 2. Statuses

| Status (`Upstream-Status`)        | Meaning             | Automatic action                           |
| --------------------------------- | ------------------- | ------------------------------------------ |
| `Pending`                         | to be proposed      | `ay upstream check` then `ay upstream pr`  |
| `Submitted [url]` + `Upstream-PR` | proposed (PR or CL) | state read live (gh api, Gerrit REST)      |
| `Backport [url]`                  | present upstream    | removed at the next `sync`                 |
| `Denied [reason]`                 | refused             | to be reworked or moved to `Inappropriate` |
| `Inappropriate [reason]`          | Aphrody-specific    | kept; `check` refuses to make a PR of it   |

The status is written in `infra/upstream/status/<stack>.toml` (key = patch name), by `ay upstream mark`. It can also live in the commit message (`--trailer`), but rewriting the shared branch for a status makes every agent rebase: the register is the default path. A merged PR is detected live; a patch that becomes empty on the new base (change already upstream) is removed, like a patch with status `Backport`.

## 3. Commands

```sh
ay upstream status [bun|chromium] [--json|--markdown] [--no-fetch]
ay upstream sync bun --push             # rejoue la pile sur l'amont ; code 3 au premier conflit, fork inchangé
ay upstream check bun [patch]           # règles de contribution de l'amont
ay upstream pr bun <patch> --lint       # tête éphémère up/<nom> = amont + ce patch seul, CI amont dessus
ay upstream pr bun <patch> --open       # ouvre la PR (refusé si check échoue ou si une PR existe déjà)
ay upstream mark bun <patch> submitted <url> --pr <url> --owner <porteur>
ay upstream gc bun                      # supprime les têtes up/* et pr/* dont la PR est fusionnée ou fermée
ay upstream export bun <dossier>        # .patch + .patches au format d'Electron
```

The stack is rebuilt with plumbing (`git merge-tree --write-tree --merge-base`, `git commit-tree`, `update-ref`, `push --force-with-lease`): no checkout, no worktree, no local branch. The lease (`--force-with-lease`) makes the push fail if an agent pushed in the meantime; the next pass resumes. After a `sync`, an agent working in a clone runs `git pull --rebase`: git drops its commits that are already present (same patch-id).

`ay bun watch` (upstream watch: commits, PRs, issues, versions) stays separate: it says what upstream does, `ay upstream` keeps our patches on top of it.

## 4. Exception to branches

Owner rule: no branch in our repositories, everything on the default branch. GitHub requires a head branch to open a PR from a fork. Exception, limited to that:

- refs `up/<name>` (those of `ay upstream pr`) and `pr/<name>` (pushed by hand by other agents) on the fork only, never in `src`;
- each one is generated from a patch of the stack, = `upstream` + that single patch (message without our trailers);
- `ay upstream gc` (run after each `sync`) deletes it as soon as the PR is merged or closed.

On the Chromium side, `git cl upload` requires a local branch with an upstream: ephemeral local branch `up-<name>` in fr1's checkout, never pushed to a fork, deleted after merge or abandonment.

## 5. CI and schedule

| What                                                  | Where                                                                                                                                                                                      | When                                                            | Load                                                                                                                                                             |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `sync bun --push` then `gc bun`                       | prd, user `agent`, `~/agents/src` (`infra/upstream/install.sh`, unit `aphrody-upstream.timer`)                                                                                             | every day 05:30 UTC (+ 0 to 20 min)                             | git only, `Nice=19`, idle I/O                                                                                                                                    |
| `sync chromium --push` (series check + GitHub mirror) | fr1, user `ubuntu`, checkout `/srv/chromium/src`                                                                                                                                           | same timer                                                      | fetch + temporary index                                                                                                                                          |
| build and tests of the Chromium subset                | fr1, `infra/upstream/chromium-verify.sh`, dedicated checkout `/srv/chromium/upstream` (never the factory's)                                                                                | after each change of the series; does nothing while it is empty | `nice -n 19 ionice -c3`, NativeLink pool; targets = test executables that depend on the touched files (`gn refs --testonly`), at most 8, then `git cl presubmit` |
| bun upstream CI on the ephemeral head                 | the fork's GitHub Actions: `format.yml`, `lint.yml`, `rust-lints.yml`, `source-lints.yml` from oven-sh/bun, enabled on `aphrody-labs/bun` on 2026-11-13 and run by `ay upstream pr --lint` | before each PR                                                  | GitHub runners                                                                                                                                                   |
| full bun build and tests                              | oven-sh's Buildkite once the PR is open; on the fork side, the `native` and `aphrody windows` workflows (native build and bun Windows agents)                                              | at PR time                                                      | —                                                                                                                                                                |
| `ay upstream` tests                                   | `.github/workflows/ci.yml` (`bun test packages/upstream`)                                                                                                                                  | every push to `src`                                             | —                                                                                                                                                                |

Nothing compiles on the workstation.

## 6. Contribution rules checked by `check`

- **bun** (`oven-sh/bun` `9ea3c693a2`): no CLA or DCO. PR template: "What does this PR do?", "How did you verify your code works?" (`.github/pull_request_template.md`); the body is taken from the message, the `Tested:` paragraph fills the second section. `on-slop.yml` closes PRs that do not verify that the problem exists or do not test the fix: `check` requires a `Tested:` paragraph and a test under `test/` as soon as `src/` changes. Format and lints: the upstream workflows, run on the head.
- **Chromium** (`docs/contributing.md`, `agents/ai_policy.md` as of 2026-11-11): Google individual CLA, entry in `AUTHORS` in the first CL (no `aphrody.com` entry today), description at 72 columns, `Bug:` or `Fixed:` footer, `git cl format`, `git cl presubmit`, `git cl upload` to chromium-review.googlesource.com. The AI policy requires that the human behind the account reviews, understands and answers reviewers personally; it recommends flagging the parts written with an AI tool.
- **common** (`AGENTS.md`): no emoji, no AI attribution, no secret, subject of at most 72 characters.

Exception to `AGENTS.md` (decision of 2026-11-13, also recorded in `AGENTS.md`): for an upstream contribution, the upstream project's policy prevails when it requires it. Each Chromium CL carries an `AI assistance: <tool, parts concerned>` paragraph in its description; `check` requires it for Chromium (rule `cr-ai-note`) and does not apply the AI attribution ban there, which remains in force for bun and everywhere else. The owner reviews each CL, sends it and answers reviewers personally: unavoidable human requirement, recorded in the NHITL index (`packages/ai-os/src/nhitl/ledger.json`, status `inevitable`, along with the CLA signature).

## 7. State of the stacks (2026-11-13 03:30 UTC, `ay upstream status --markdown`)

bun: `aphrody-labs/bun` = `oven-sh/bun` `9ea3c693a2` ("Bump to 1.4.5") + 15 patches; the minifier docs patch (no visible effect: the published page already has its title) was removed from the fork on 2026-11-13.

| #        | Patch                                                                                            | Status                     | Review                              | Owner        |
| -------- | ------------------------------------------------------------------------------------------------ | -------------------------- | ----------------------------------- | ------------ |
| 1        | child_process: expose the parent-end pipe fd through stream._handle                              | proposed (port)            | oven-sh/bun#39760 (robobun), open   | upstream     |
| 2        | build: pass the .bind.ts schema list to the codegen scripts in a file                            | proposed                   | oven-sh/bun#48787, open (section 8) | upstream     |
| 4, 5, 15 | ci: native release build ; ci(native): sysroot ; ci(native): dispatch only                       | Aphrody-specific (fork CI) | -                                   | native build |
| 6        | upgrade: unpack the Windows release in-process and check canary downloads against the API digest | to be proposed             | -                                   | bun Windows  |
| 7        | completions: print the script for bash, zsh and fish on Windows (Fixes #25042)                   | to be proposed             | -                                   | bun Windows  |
| 8        | sys(windows): report ENOENT for an empty path                                                    | proposed (port)            | oven-sh/bun#38052, open             | upstream     |
| 9        | node:fs: resolve a relative path that normalizes to nothing to the cwd on Windows                | proposed (port)            | oven-sh/bun#45410, open             | upstream     |
| 10       | import.meta.main: compare the main module's key as a URL in every executable                     | proposed (port)            | oven-sh/bun#48698, open             | upstream     |
| 11       | shell: skip a dead bin link for the script words bun, bunx and node (Windows)                    | proposed (port)            | oven-sh/bun#45742, open             | upstream     |
| 12       | ci(aphrody): cross-compile bun.exe for Windows x64 and run the fork's Windows regression tests   | Aphrody-specific           | -                                   | bun Windows  |
| 13       | build: xwin 0.10.0, which reads the current Visual Studio manifest                               | proposed                   | oven-sh/bun#48784, open             | bun Windows  |
| 14       | docs: sizes Bun.gzipSync and Bun.deflateSync give for the utils examples                         | proposed                   | oven-sh/bun#48786, open             | bun audit    |

Linux stacks (2026-11-13): `linux-cachyos` (1 patch, `_llvm_prefix`), `cachyos-pkgbuilds`, `kernel-patches`, `liquorix`, `scx` (empty series), "series" model, patches in `infra/upstream/patches/<stack>/`, synchronized on prd with bun; patchsets tracked without a fork in `infra/linux/patchsets.toml` (`docs/linux/PATCHSETS.md`).

No `bunx-sh/bun` stack: org abandoned by the owner on 2026-11-13.

Chromium: empty series; `aphrody-labs/chromium` `main` was 908 commits behind, fast-forwarded on 2026-11-13 (0/0 since).

## 8. Fixes proposed by this stack

**bun, list of `.bind.ts` schemas in a file.** On a Windows host, the codegen rules of `scripts/build/codegen.ts` go through `cmd /c`, limited to 8191 characters (Microsoft Learn, "Command prompt (Cmd.exe) command-line string limitation"; measured here: 8,100 accepted, 8,200 refused, "La ligne de commande est trop longue."). `bun scripts/build.ts --configure-only --profile=release` on Windows 11 build 28120, checkout `C:\src\third_party\bun`, 150 schemas: expanded commands of the bindgen edge and of the built-ins table = 11,602 and 11,537 characters on upstream `main`; 8,152 and 8,087 with the fork's old patch (relative paths, 39-character margin); 686 and 621 with the list in a file (`--sources=@<file>`, read by `argParse`), whatever the number of schemas. New test in `test/internal/build-codegen-declared-outputs.test.ts`. The fork's relative-path patch was replaced by this one, at the same place. PR: https://github.com/oven-sh/bun/pull/48787; the upstream format, lint, source-lints and clippy workflows pass on the head in the fork.

Rejected (no PR): the minifier docs patch (no visible effect, removed from the fork); no Chromium CL as long as no defect is reproduced and measured on the tip.

## 9. Conflict during `sync`

`sync` stops at the first patch that no longer applies, writes `var/upstream/<stack>/last-sync.json` (patch, conflicting files, number of patches replayed) and leaves the fork as is; the systemd unit fails. Resolution, by the patch owner: replay the patch by hand on `upstream/main` in a clone, push it in its place on the default branch, or remove it if upstream solved the problem differently; then `ay upstream sync <stack> --push`.

## 10. Communication

Drafts in `var/agents/outbox/upstream-2026-11-13/` (blog post, X post, wiki page, site page). `.agents/owner-rules.json` does not exist: nothing is published on X, the blog or the site. PR and issue messages accompany the contribution and go out with it.
