---
name: gh-fork
description: Fork upstream repositories into the aphrody-labs org (or aphrody-dev) and register them in third_party/forks.txt. Use for any "fork X" request, upstream tracking, vendoring.
---

1. Check what exists: `gh api repos/aphrody-labs/<repo> --jq .full_name` and `rg -i <repo> C:/labs/third_party/forks.txt`.
2. Fork: `gh repo fork <owner>/<repo> --org aphrody-labs --clone=false --default-branch-only 2>&1 | tail -1`.
3. Verify: `gh api repos/aphrody-labs/<repo> --jq '.full_name+" fork="+(.fork|tostring)+" parent="+.parent.full_name'`.
4. Add `<owner>/<repo> <language>` to third_party/forks.txt (no duplicate). No local clone unless needed: the code lives in third_party/<name> of the monorepo.
