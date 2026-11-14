---
name: rust-crates-io
description: Live crates.io API, sparse index protocol (index.crates.io), and verified crate versions grounded in rust-lang/crates.io and aphrody-labs/crates.io.
---

# crates.io Registry and Live API

Fork: `aphrody-labs/crates.io` (parent: `rust-lang/crates.io`, default branch: `main`, registered in `third_party/forks.txt`).

## Sparse Index Protocol (`https://index.crates.io/`)

Cargo reads crate metadata over HTTP without cloning the git index:

- Config endpoint: `GET https://index.crates.io/config.json` returns `{"dl":"https://static.crates.io/crates","api":"https://crates.io"}`.
- Crate metadata path:
  - 1-char name: `/1/<name>`
  - 2-char name: `/2/<name>`
  - 3-char name: `/3/<first-char>/<name>`
  - 4+ char name: `/<first-2>/<next-2>/<name>` (example: `https://index.crates.io/se/rd/serde`)
- Response format: newline-delimited JSON (one JSON object per published version with `name`, `vers`, `deps`, `cksum`, `features`, `yanked`, `rust_version`, `pubtime`).

## Live REST API (`https://crates.io/api/v1/`)

Always send a descriptive `User-Agent` header per crates.io API policy:

```bash
# Query single crate metadata
curl -s -H "User-Agent: aphrody-src-agent/1.0" "https://crates.io/api/v1/crates/serde"

# Query top crates by downloads
curl -s -H "User-Agent: aphrody-src-agent/1.0" "https://crates.io/api/v1/crates?sort=downloads&per_page=10"
```

## Verified Crate Versions (2026-11-14)

Key workspace crates (`max_stable_version` from live `crates.io/api/v1/crates/<name>`):

- `serde`: `1.0.229`
- `tokio`: `1.54.1`
- `reqwest`: `0.13.5`
- `jiff`: `0.2.43`
- `oxc`: `0.158.0`
- `bevy`: `0.20.1`
- `rustls`: `0.23.46` (`newest_version`: `0.24.0-dev.3`)
- `windows`: `0.62.2`
- `cargo-deny`: `0.20.2`

Top downloaded crates on crates.io (`sort=downloads`):

- `hashbrown`: `0.17.1`
- `syn`: `3.0.10`
- `getrandom`: `0.4.3`
- `bitflags`: `2.13.2`
- `rand_core`: `0.10.1`
- `rand`: `0.10.3`
- `libc`: `0.2.191`
- `base64`: `0.23.1`
- `quote`: `1.0.47`
- `proc-macro2`: `1.0.107`

## Publishing Checklist

```bash
cargo publish --dry-run -p <crate>
cargo publish -p <crate>
```

Verify secret scan is clean before publishing public crates from `C:\src`.
