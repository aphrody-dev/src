# Linux kernel upstream (2026-11-14)

Pages the owner pointed at (2026-11-14): linuxfoundation.org, kernel.org (`/pub`, git, mirrors, docs), linux.com, the source.android.com kernel pages (architecture, building-kernels), github.com/google/kernel-research, and the ChromeOS "Linux on ChromeOS deep dive".

## Live state (queried from fr2)

kernel.org `releases.json`, latest_stable = 7.3.4:

| Moniker | Version | Released | EOL |
| --- | --- | --- | --- |
| mainline | 7.4-rc2 | 2026-11-09 | no |
| stable | 7.3.4 | 2026-11-10 | no |
| stable | 7.2.15 | 2026-11-01 | yes |
| longterm | 6.18.63 | 2026-11-10 | no |
| longterm | 6.12.117 | 2026-11-10 | no |
| longterm | 6.6.162 | 2026-11-06 | no |
| longterm | 6.1.192 | 2026-11-06 | no |
| longterm | 5.15.225 | 2026-11-06 | no |
| longterm | 5.10.274 | 2026-11-06 | no |
| linux-next | next-20261113 | 2026-11-13 | no |

Android GKI, branches of `android.googlesource.com/kernel/common`: android-mainline, android18-7.3, android17-6.18, android16-6.12, android15-6.6, android14-6.1, android14-5.15, android13-5.15, android13-5.10, android12-5.10, android12-5.4, android11-5.4.

ChromeOS, branches of `chromium.googlesource.com/chromiumos/third_party/kernel`: chromeos-6.12 (newest), chromeos-6.6, chromeos-6.1, chromeos-5.15, chromeos-5.10, chromeos-5.4, and older.

github.com/google/kernel-research: kernelCTF exploit research tooling (libxdk, kxdb_tool, rop_generator, image_db, image_runner); last push 2026-10-28. Tracked as a source only.

## Real-time sources for trackers

- `https://www.kernel.org/releases.json` and `https://www.kernel.org/feeds/kdist.xml`.
- `https://cdn.kernel.org/pub/linux/kernel/v<N>.x/sha256sums.asc`, signed by the kernel.org autosigner.
- git.kernel.org: torvalds/linux, stable/linux, next/linux-next.
- Gitiles `+refs?format=JSON` for Android GKI and the ChromeOS kernel.
- docs.kernel.org (Rust for Linux: `rust/`, `Documentation/rust/`).

## GNU/Linux system role

In docs/native/gnu/OS.md the kernel row means: Linux upstream (stable or LTS, GKI and ChromeOS variants) is the reference kernel of the GNU system Aphrody ships, and `src/kernel` holds its own kernel-style C layer on the `sys.h` ABI.
