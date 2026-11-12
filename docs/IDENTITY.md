# Identity

## Name

- **Brand**: Aphrody Labs, home `labs.aphrody.com`, the lab of Aphrody (`aphrody-dev` is the main org, like `vercel`;
  `aphrody-labs` is the lab org, like `vercel-labs`).
- **Binary**: `aphrody`.
- **Crates**: `aphrody` (the CLI) and `aphrody-<dir>` for each workspace member.
- **npm**: `@aphrody/*` (platform binaries as optionalDependencies, per OS and arch).
- **Repository**: `github.com/aphrody-labs/labs` (private, in the `aphrody-labs` organization, the lab org; `aphrody-dev` is the main org).

## Availability evidence (2026-11-12)

| Check | Result |
|---|---|
| crates.io `aphrody` (exact) | not published; search `q=aphrody` returns 191 crates, none named exactly `aphrody` |
| npm `aphrody` (unscoped, exact) | not published |
| npm scope `@aphrody` | owned by the project owner: 652 packages, all published by `yohan971` |
| crates.io `aphrody-*` | about 190 older crates already published by the owner |

Names already taken by the owner's older crates and therefore not reused: `aphrody-render`,
`aphrody-engine`, `aphrody-web` (the members are `renderer`, `js` and `webapi` instead). Before adding a
member, check `https://crates.io/api/v1/crates/aphrody-<dir>`.

## Domains

- `labs.aphrody.com`: homepage and documentation. On 2026-11-12 the name existed in the `aphrody.com`
  zone without address records.
- Planned paths: `https://labs.aphrody.com/` (docs) and `https://labs.aphrody.com/conformance/`
  (dashboard), self-hosted.

## What the owner must do

Created: `aphrody-labs/labs` (private), forks `aphrody-labs/lore`, `aphrody-labs/UnrealEngine` (private). Nothing published.

| Registry | Item | Notes |
|---|---|---|
| GitHub | repository `aphrody-labs/labs` | created, private, empty; the source of truth is Lore |
| crates.io | crate `aphrody` | names are held only by publishing; publish `crates/cli` 0.0.x when ready (`publish = false` until then) |
| npm | `@aphrody/cli` and per-platform packages | scope already owned; publish with the first binary release |
| DNS | `labs.aphrody.com` records | homepage and conformance dashboard |

## Rules

- Upstream code enters only through `third_party/` (vendored fork, pinned in `vendor.lock`, license kept). Unreal Engine code never goes to a public repository.
- No AI or tool attribution in commits, tags or release notes. No emojis in code, docs or commits.
