---
name: github-workflow
description: GitHub upstream developer workflow reference covering gh CLI, git hygiene, GitHub Actions CI/CD, Releases, PR management, and GitHub Packages (ghcr.io).
---

# GitHub Workflow & Upstream Collaboration

## GitHub CLI (`gh`) Essentials

- Authentication:
  ```bash
  gh auth status
  gh auth token
  ```
- Repository operations:
  ```bash
  gh repo view <owner>/<repo>
  gh repo clone <owner>/<repo>
  gh repo fork <owner>/<repo> --clone
  ```
- Pull Requests & Issues:
  ```bash
  gh pr list --state open
  gh pr create --title "feat: summary" --body "Detailed PR description"
  gh pr checkout <PR_NUMBER>
  gh pr merge <PR_NUMBER> --squash
  gh issue list
  ```
- Releases & Assets:
  ```bash
  gh release list
  gh release create v1.0.0 ./dist/* --title "Release v1.0.0" --notes "Release notes"
  ```
- Actions & Runs:
  ```bash
  gh run list --limit 10
  gh run view <RUN_ID> --log
  gh workflow run <WORKFLOW_FILE>
  ```

## Git Conventions

- Commit subject: `<area>: <what changed>` or a Conventional Commits type (`feat:`, `fix:`, `docs:`, `perf:`, `refactor:`, `test:`, `chore:`); see `git log --oneline`.
- Work directly on `main` (no branches, no worktrees); never stash on the shared tree. Sync with the remote: `git fetch aphrody main --no-tags` then `git merge --no-edit aphrody/main`; push with a bare `git push`.
- `gh api ... --jq` with quotes breaks under the Windows shell: pipe the output to `jaq`.
- Container Registry: `ghcr.io/<owner>/<image>:<tag>` authenticated via `gh auth token | docker login ghcr.io -u <username> --password-stdin`.
