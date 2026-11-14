---
name: upstream-sources
description: Where upstream projects are pinned, forked and tracked in src (src.lock.json, third_party/forks.txt, infra/upstream/stacks.toml, ay upstream) and the canonical upstream repos for Bun, Google, Microsoft, Cloudflare and uutils. Use before absorbing, forking, bumping or citing an upstream.
---

# Upstream sources

## Where the state lives

- Pins: `src.lock.json` (one entry per `third_party/<name>`, with upstream URL and fork); regenerate derived files with `ay lock`.
- Forks: `third_party/forks.txt` (`owner/repo language`, forks live in the `aphrody-labs` org; skill `gh-fork` to add one).
- Tracking and patch stacks: `infra/upstream/stacks.toml` and `infra/upstream/stacks.d/*.toml`; run `ay upstream status` (`ay upstream --help` for sync, check, pr, export).
- Chromium stack pins: `third_party/chrome-channels.toml`, `third_party/toolchain-157.toml`; Chromium `DEPS` at the repo root.
- Absorbed code and flattening: `docs/native/deps/`. Dependencies follow the newest upstream, including canary, nightly and pre-release.
- Verify a version or commit at the source (`gh api`, `git ls-remote`, the clone in `third_party/`) before citing it.

## Canonical upstream repos

- Bun: `oven-sh/bun` (https://bun.com: docs, guides, blog, reference).
- Google: `chromium`, `v8`, `skia`, `dawn`, `depot_tools`, `aosp`, `design.google`; Rust crates `argh`, `zerocopy`; `jj` (Jujutsu).
- Microsoft: `windows-rs` (`windows`, `windows-sys`, `windows-bindgen`), `edit`, `openvmm`, `litebox`; Win32/NT APIs from `kernel32.dll`, `ntdll.dll`, DirectX 12.
- Cloudflare: `workerd`, `workers-rs`, `pingora`, `quiche`, `foundations`, `boringtun`.
- Unix: `uutils/coreutils`, `uutils/findutils`, `uutils/diffutils`, `uutils/procps`, `uutils/util-linux`; kernel and git at https://git.kernel.org/, GNU at https://www.gnu.org/software/.

## Hygiene

User-level tools (multi-call `coreutils.exe`, `diffutils`, ...) install in `~/.local/bin` or `~/.cargo/bin`; `C:\Windows\System32` is never modified and gets no shims.
