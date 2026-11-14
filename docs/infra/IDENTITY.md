# Identity

## Name

Single source: [`identity.toml`](../../identity.toml) at the repository root (`just identity check` gates it, `just identity apply` rewrites the copies; docs/core/ARCHITECTURE-ROOT.md invariant 5). This section only explains the values.

- **Brand**: Aphrody Labs, home `labs.aphrody.com` (`[domains].home`); `aphrody-dev` is the main org, `aphrody-labs` the lab org (this repository `github.com/aphrody-labs/src` since 2026-11-13, `[product].repo_org`; forks, products under `apps/`).
- **Binary**: `ay` (`[cli].binary`), package `aphrody` (`[cli].crate`, src/ay). The former labs binary `aphrody` (crates/aphrody-cli) is now `ay conformance`.
- **Crates**: a member keeps its directory name unless it would collide on crates.io; then it takes `[naming].crate_prefix` (`aphrody-`). Names are never re-prefixed on a move.
- **npm**: `[naming].npm_scope` (`@aphrody/*`); sub-products in `[products.*]` are `<scope>/<binary>` (`@aphrody/ai-os`).

## Availability evidence (2026-11-12)

| Check                           | Result                                                                             |
| ------------------------------- | ---------------------------------------------------------------------------------- |
| crates.io `aphrody` (exact)     | not published; search `q=aphrody` returns 191 crates, none named exactly `aphrody` |
| npm `aphrody` (unscoped, exact) | not published                                                                      |
| npm scope `@aphrody`            | owned by the project owner: 652 packages, all published by `<npm-owner>`           |
| crates.io `aphrody-*`           | about 190 older crates already published by the owner                              |

Names already taken by the owner's older crates and therefore not reused: `aphrody-render`,
`aphrody-engine`, `aphrody-web` (the members are `renderer`, `js` and `webapi` instead). Before adding a
member, check `https://crates.io/api/v1/crates/aphrody-<dir>`.

## Domains

- `labs.aphrody.com`: homepage and documentation. On 2026-11-12 the name existed in the `aphrody.com`
  zone without address records.
- Planned paths: `https://labs.aphrody.com/` (docs) and `https://labs.aphrody.com/conformance/`
  (dashboard), self-hosted.

## What the owner must do

Created: forks `aphrody-labs/lore`, `aphrody-labs/UnrealEngine` (private). Nothing published.

| Registry  | Item                                     | Notes                                                                                                            |
| --------- | ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| GitHub    | repository `aphrody-labs/src`            | this monorepo (moved from `aphrody-dev/src` on 2026-11-13); `aphrody-labs/labs` was merged into it on 2026-11-12 |
| crates.io | crate `aphrody`                          | names are held only by publishing; publish `src/ay` 0.0.x when ready (`publish = false` until then)           |
| npm       | `@aphrody/cli` and per-platform packages | scope already owned; publish with the first binary release                                                       |
| DNS       | `labs.aphrody.com` records               | homepage and conformance dashboard                                                                               |

## Anonymous public identity

`aphrody-dev` is an anonymous public identity. Public channels only: mail on `aphrody.com` (`contact@`,
`security@`, `noreply@`), GitHub `aphrody-dev` and `aphrody-labs`, Discord, X, Cloudflare, Resend, the Aphrody
OAuth app and the contact section of `aphrody.com` (`identity.toml` `[contact]`).

- Never in the repository, logs or reports: real name, personal mailbox, phone, postal address, photo. Personal
  Google accounts are vault keys (`APHRODY_OWNER_GOOGLE_ACCOUNT`, `APHRODY_AI_GOOGLE_ACCOUNT`), read by
  `personalAccount()` (packages/env-kit/src/accounts.ts); gcloud configurations are `owner` and `ai-agent`.
- Commits: `aphrody-dev <324927936+aphrody-dev@users.noreply.github.com>` on the PC and on every fleet user.
- Inbound mail: OVH MX today; Cloudflare Email Routing rules for the three addresses are declared in
  `infra/cloudflare/cloudflare.toml` (`[email_routing]`, `bun infra/cloudflare/cf.ts plan email`).
- History is not rewritten: older commits still carry personal data (audit 2026-11-13, docs/reviews/INDEX.md).

## Rules

- Upstream code enters only through `third_party/` (vendored fork, pinned in `vendor.lock`, license kept). Unreal Engine code never goes to a public repository.
- No AI or tool attribution in commits, tags or release notes. No emojis in code, docs or commits.
