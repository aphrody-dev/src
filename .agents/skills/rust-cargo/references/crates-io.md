# crates.io registry and live API

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


## Publishing Checklist

```bash
cargo publish --dry-run -p <crate>
cargo publish -p <crate>
```

Verify secret scan is clean before publishing public crates from `C:\src`.

Crate versions change daily: query the API above instead of trusting any list.
