# Windows 11 and Unix toolchain

How the monorepo builds and runs on Windows 11 and Linux without MSYS2, MinGW or Cygwin, and how the
WSL pieces (`crates/unix`, `crates/wayland`) fit. Every claim below is checked against the cited
documentation or the local machine; anything not implemented is listed as such.

Replaces `MICROSOFT_NT_MINGW_WSL_PROTON_DX12_WASM_120FPS_PLAN.md` (removed: it described components
that do not exist, such as a clean-room mingw-w64 replacement and a locked 120 FPS DX12-to-WebGPU path).

## 1. Compilers and targets

| Host | Default Rust target | Linker | Notes |
|---|---|---|---|
| Windows 11 | `x86_64-pc-windows-msvc` | MSVC `link.exe` or `rust-lld` | The only Windows target used for first-party code. |
| Windows, MinGW ABI needed | `x86_64-pc-windows-gnullvm` | LLVM (`lld`, `libunwind`), no GCC | Use instead of `x86_64-pc-windows-gnu`, which pulls in a MinGW-w64 GCC toolchain. Not installed by default. |
| Linux | `x86_64-unknown-linux-gnu` / `-musl` | system `cc` / static musl | musl is the container target (`Dockerfile` builder stage). |
| Linux -> Windows | `x86_64-pc-windows-msvc` | `cargo xwin` | Downloads the MSVC CRT and Windows SDK; no Wine, no MinGW. |
| Any -> Linux/macOS | various | `cargo zigbuild` | Zig as the C linker for cross builds. |

`cargo-xwin` and `cargo-zigbuild` are installed in `~/.cargo/bin`. Cross-compilation presets belong in
`src build --target` (see `docs/CONSOLIDATION_PLAN.md`), not in ad hoc scripts.

## 2. Userland without MSYS2

Git for Windows ships an MSYS2 runtime (`/usr/bin` in Git Bash). First-party tooling must not depend
on it. The replacements are native Rust binaries:

| MSYS2 / GNU tool | Rust replacement | Status on this machine |
|---|---|---|
| coreutils (`ls`, `cp`, `sort`, ...) | uutils `coreutils` multicall, built with `--features windows` | 0.12.0 via winget (`WinGet/Links/ls.exe`) |
| findutils (`find`, `xargs`, `locate`) | uutils `findutils` | 0.11.0 in `~/.cargo/bin` |
| diffutils | uutils `diffutils` | installed via winget |
| bash | `brush` (bash-compatible shell) | 0.4.0 in `~/.cargo/bin` |
| grep | `ripgrep` | installed; call it by full path from Bun (see memory note on `rg.cmd`) |

Install and audit these from one manifest with `unix-distro userland status|install`
(`crates/unix`). The `justfile` uses `sh` on Unix and `pwsh` on Windows, so no recipe needs Git Bash.

## 3. WSL2 distribution

`crates/unix` generates an Arch Linux based WSL2 distribution (CachyOS kernel patches from
`third_party/cachyos/kernel-patches/<series>/`, Omarchy themes from `third_party/omacom/omarchy/themes/`).
Generated configuration follows the documented keys only:

- `.wslconfig` `[wsl2]`: `networkingMode` (`nat`, `mirrored`, ...), `dnsTunneling`, `autoProxy`,
  `firewall`, `memory`, `processors`, `kernel`, `guiApplications`. Path values need escaped backslashes.
  Source: https://learn.microsoft.com/windows/wsl/wsl-config
- Mirrored networking needs Windows 11 22H2 or later and gives IPv6, `127.0.0.1` to Windows services,
  and multicast. Source: https://learn.microsoft.com/windows/wsl/networking
- Distribution packaging (`wsl --install --from-file`, `/etc/wsl-distribution.conf`):
  https://learn.microsoft.com/windows/wsl/build-custom-distro

Memory and processor counts are derived from the probed host or passed as flags; nothing is hardcoded
to one machine.

## 4. Replacing WSLg

WSLg runs Weston (Wayland compositor) plus an RDP channel to show Linux windows on the Windows
desktop; Linux GPU access goes through `/dev/dxg` and Mesa's d3d12 driver
(https://learn.microsoft.com/windows/wsl/tutorials/gpu-compute, `MESA_D3D12_DEFAULT_ADAPTER_NAME`).
Constraints that shape any replacement:

- **The compositor must run in the Linux guest.** Smithay's backends (drm, udev, libinput, gbm, egl)
  are Linux-only, and Windows `AF_UNIX` does not pass file descriptors, which Wayland requires.
- **Hyper-V sockets carry streams only.** Microsoft documents them as "Data stream only" and "No block
  memory (not the best for backup/video)". They suit control and input traffic, not zero-copy frames.
  The Linux guest is addressed with the VSOCK template GUID `00000000-facb-11e6-bd58-64006a7986d3`,
  where the first field is the port.
  Source: https://learn.microsoft.com/windows-server/virtualization/hyper-v/make-integration-service
- **The host side is a presenter**, not a compositor: a Windows process that receives frames and input
  and shows them with DXGI/D3D12 and DirectComposition.

`crates/wayland` holds the pieces that exist today (layout engine, wire codec, D3D12/DXGI host code);
its README lists what is not implemented yet.

## 5. Rules

- No `msys-2.0.dll`, `cygwin1.dll` or MinGW GCC in any first-party build path.
- No committed binaries (`.dll`, `.lib`, `.exe`) under `crates/`.
- Windows API code uses the `windows` / `windows-sys` crates; check signatures with Context7
  (`/microsoft/windows-rs`) and behaviour with Microsoft Learn.
- Never write to `C:\Windows\System32`; user binaries go to `~/.local/bin`.
