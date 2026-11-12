# Rust stack: north star

Goal (owner, 2026-11-12): the best CLI, scripting language, shell, kernel and browser, and the whole
modern software and web stack in Rust. Never from scratch: fork the strongest existing Rust project
per layer, and prove perfect compatibility against the upstream project's own test suite.

| Layer | Upstream to match | Rust base (fork or depend) | Compatibility oracle |
|---|---|---|---|
| CLI / toolkit | Bun CLI, GNU tools | `ay` on the Bun fork crates (docs/AY_ON_BUN.md) | Bun install/shell tests |
| Shell | bash, Bun Shell | brush (bash-compatible), `bun_shell_parser` | bash `tests/`, Oils spec tests |
| Scripting | bash, TS scripts | Bun shell syntax + nushell; TS stays on Bun | same + Bun tests |
| coreutils, find, diff, sed | GNU | uutils (coreutils, findutils, diffutils, sed) | GNU test suites (uutils runs them) |
| grep, find UX | GNU grep | ripgrep, fd | GNU grep tests where flags overlap |
| libc | glibc | c-ward / relibc (evaluate) | libc-test, glibc `make check` |
| Kernel | Linux | Rust-for-Linux in-tree drivers; Asterinas (Linux ABI) as research | LTP, kselftest |
| Init, sudo, time | systemd, sudo, ntpd | sudo-rs, ntpd-rs; systemd stays until a candidate exists | upstream regression tests |
| Browser | Chromium | Chromium with its Rust components (fontations, png, qr, mojo-rs), Servo/Blitz for new engines | WPT, Chromium `content_browsertests` |
| JS runtime | Node, Bun | Bun fork (Rust port, `third_party/bun`) | Node test suite, Bun tests |
| Build | ninja, gn, make, cmake | n2 (aphrody-dev/n2), gn kept, cargo | ninja tests, Chromium build parity |
| depot_tools | gclient, git-cl, vpython | `ay gclient`, gix, uv (docs/DEPOT_TOOLS_RUST.md) | `gclient revinfo` identical output |
| Git | git | gitoxide, jj (aphrody-dev forks) | git `t/` suite subset used by us |
| SSH | OpenSSH | russh, russh-sftp (`ay ssh`, aphrody-dev forks) | OpenSSH `regress/` |
| TLS / crypto | OpenSSL, BoringSSL | rustls + aws-lc-rs/ring, rustls-openssl-compat (libssl ABI) | BoGo, tlsfuzzer |
| VPN | WireGuard | boringtun (aphrody-dev fork) | wireguard-go interop |
| DNS | BIND, unbound | hickory-dns | DNS conformance (dnsperf, RFC test vectors) |
| HTTP edge / proxy | nginx, Cloudflare | pingora, hyper, axum | h2spec, h3spec, nginx config parity |
| Containers | Docker, runc | youki (OCI runtime), bollard, oci-client | opencontainers runtime-tools |
| Cloud CLIs | wrangler, gh, gcloud, vercel | `ay cloud` on REST APIs, workers-rs, octocrab, google-cloud-rust | API contract tests |
| JS tooling (Vercel, Google, Microsoft) | webpack, tsc, eslint | turbopack/turborepo, oxc, typescript-go (Go) | test262, TS conformance |
| Python tooling | pip, flake8 | uv, ruff | upstream suites |
| Editor / terminal | VS Code, xterm | zed, helix, alacritty-class terminals | vttest, LSP conformance |
| Windows | Win32, .NET, MSYS2 | windows-rs, uutils on Windows, gnullvm (docs/WINDOWS_UNIX_TOOLCHAIN.md) | MS samples, Wine conformance |
| Wayland | libwayland, wlroots | smithay, wayland-rs | wlcs |

Rules: one canonical fork per layer under `aphrody-dev`, pinned in `src.lock.json`; patches kept
upstreamable; a layer counts as replaced only when its oracle passes in CI.
