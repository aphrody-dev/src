# Repositories that stay private: remediation

No history was rewritten and no force-push was done. The commands below are to be run after validation, on a fresh mirror clone (fr2), then `git push --force --mirror`, which rewrites history. Before any switch to public, rerun `gitleaks git --redact` on the result.

## aphrody-labs/shenron

1. Revoke the key in the Stripe dashboard (test mode, Developers > API keys > Roll key), whether or not there is a purge.
2. Affected commits:
   - `sk_test_`/`pk_test_` key: introduced by `a2671e1e` (2026-10-28, feat(stripe)), removed by `14cbbe07` (2026-11-01). HEAD is clean (`git grep`: 0);
   - build `apps/site/.next-ui-preview/**`: added by `3ffae86d` (2026-10-16) and untracked by `5ad418d0` (2026-10-16). `.gitignore` already covers it (line 106).
3. Purge:
   ```sh
   git clone --mirror https://github.com/aphrody-labs/shenron.git && cd shenron.git
   # replacements.txt: one line per value, in the format `<exact sk_test_… value>==>REDACTED_STRIPE_TEST_KEY`
   #   (do the same for pk_test_; extract the values via `git show a2671e1e:apps/site/src/lib/stripe.ts`, without committing them anywhere)
   git filter-repo --replace-text ../replacements.txt
   git filter-repo --path apps/site/.next-ui-preview --invert-paths
   gitleaks git . --redact
   git push --force --mirror
   ```
4. Then: delete `replacements.txt`, ask the other clones to start again from scratch, and check GitHub forks and PRs (the `refs/pull/*` refs keep the old objects: go through GitHub support to get the cached objects purged).
5. The audit item on the rights to the scraped Dragon Ball content (`data/catalogues/pages/*.html`) also remains; it concerns intellectual property, not secrets.

## aphrody-dev/mesh-vn (archived)

- `generated/wg-win.conf` and `src/generator.ts` (commit `2f81bf77`, still present at HEAD `8e07397`) contain a real **WireGuard private key** (44 characters, Windows workstation interface), as well as the public IPs of the fr1 and usa hubs.
- Remediation:
  1. regenerate the workstation key pair (`wg genkey | tee priv | wg pubkey`), update the public key on the fr1 and usa peers, then remove the old one;
  2. stop producing a key in code: `generator.ts` must read the key from the environment or from an ignored file, and `generated/` must go into `.gitignore`;
  3. purge:
     ```sh
     gh api -X PATCH repos/aphrody-dev/mesh-vn -F archived=false
     git clone --mirror https://github.com/aphrody-dev/mesh-vn.git && cd mesh-vn.git
     git filter-repo --path generated/wg-win.conf --invert-paths
     # replacements.txt: `<old private key>==>REDACTED_WG_PRIVATE_KEY`
     git filter-repo --replace-text ../replacements.txt
     gitleaks git . --redact && git push --force --mirror
     gh api -X PATCH repos/aphrody-dev/mesh-vn -F archived=true
     ```
  4. then make it public.

## aphrody-labs/UnrealEngine, aphrody-dev/UnrealEngine

These repositories stay private permanently, and the owner cannot lift this constraint: the code is under the Epic EULA, and they are forks of `EpicGames/UnrealEngine`, a private upstream that GitHub forbids making public. No remediation is possible.

## Outside GitHub

- `third_party/` subfolders under the Steam SDK license, AGPL or without a license: never integrate them (vendoring) into a public repository or crate (audit §2).
- `@aphrody/epic-games` (npm) and the `steam-depot` crate: do not publish them (see NPM.md and CRATES.md).
