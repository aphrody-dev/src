---
name: gh-fork
description: Fork upstream repositories into the aphrody-labs org (or aphrody-dev) and register them in third_party/forks.txt. Use for any "fork X" request, upstream tracking, vendoring.
---

1. Check what exists: `gh api repos/aphrody-labs/<repo> --jq .full_name` and `rg -i <repo> third_party/forks.txt`.
2. Fork: `gh repo fork <owner>/<repo> --org aphrody-labs --clone=false --default-branch-only`.
3. Verify: `gh api repos/aphrody-labs/<repo>` piped to `jaq -r '.full_name + " fork=" + (.fork|tostring) + " parent=" + .parent.full_name'` (gh `--jq` breaks on quotes under the Windows shell).
4. Add `<owner>/<repo> <language>` to `third_party/forks.txt` (format: see its header line; no duplicate). No separate clone: the code lives in `third_party/<name>` of the monorepo, pinned in `src.lock.json`.
