---
name: sovereign-upstream
description: Canonical sovereign upstream reference covering Google Rust (argh, zerocopy), Microsoft Rust (windows-sys), Bun, Cloudflare, Unix uutils, and Git Scalar.
---

# Sovereign Canonical Upstream Reference

## Canonical Upstream Allowlist

- **Bun**: `oven-sh/bun` (`https://bun.com`, `/docs`, `/guides`, `/blog`, `/reference`)
- **Google**:
  - Rust crates: `argh` (zero-bloat CLI parsing), `zerocopy` (zero-cost memory framing), `jj` (Jujutsu VCS).
  - Ecosystem: `chromium`, `chromiumos`, `aosp`, `depot_tools`, `design.google`.
- **Microsoft**:
  - Rust crates: `windows-rs` / `windows-sys` (native Win32 / NT kernel FFI), `edit`, `openvmm`.
  - Native APIs: `kernel32.dll`, `ntdll.dll`, DirectX 12 Ultimate, WDK `10.0.28000.0`, MSVC `14.51`.
- **Cloudflare**:
  - Ecosystem: `workerd`, `workers-rs`, `pingora`, `quiche`, `foundations`, `boringtun`.
- **Unix / Kernel / GNU / uutils**:
  - Rust GNU rewrites: `uutils/coreutils`, `uutils/findutils`, `uutils/diffutils`, `uutils/procps`, `uutils/util-linux`.
  - Kernel & Git: `https://git.kernel.org/` (`pub/scm/git/git.git`), `https://www.gnu.org/software/`.

## Userland Tooling & System Hygiene

- Multi-call binaries (`coreutils.exe`, `findutils`, `diffutils`) reside in `C:\Users\aphro\.local\bin` or user WinGet links.
- `C:\Windows\System32` is strictly preserved with zero userland shims or shadowed builtins.
