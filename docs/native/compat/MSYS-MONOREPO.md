# MSYS2 / MinGW-w64 distribution repo (C:\msys)

Standalone repo `aphrody-labs/msys`: source/metadata distribution (Arch + CachyOS + MSYS2 + Windows-native bridges). Not a runtime: no MSYS2 install, nothing on PATH, no local build, no WSL.

- Design (layers 0-8, tree, 13 ADRs, checklist): `C:\msys\docs\ARCHITECTURE.md`; ADRs `C:\msys\docs\adr\`.
- Layers: `identity.toml`/`pins.toml` -> `toolchains/` -> `runtimes/` -> `environments/envs.toml` -> `buildsys/` (makepkg ISA profiles, devtools) -> `repos/{core,extra,mingw}` -> `formats/` (pacman, vcpkg, winget, nuget, psgallery, msix, xmap) + `compat/{posix,windows}` -> `distribution/` (keyring, mirrors, images, settings).
- Cross map pacman/vcpkg/winget/NuGet/PSGallery (top 300 by reverse deps): `C:\msys\formats\xmap\XMAP.md` (`bun tools/xmap.ts`).
- Verification: `just check` (`tools/check-structure.ts`: tree == ARCHITECTURE.md, no orphans, no dup with src pins).
- References (not copied): see `C:\msys\pins.toml` (src third_party: mingw-w64, CachyOS-PKGBUILDS, pacman, git, vcpkg, winget-pkgs, DSC, PowerShell, WindowsAppSDK, windows-rs...; labs vcpkg triplets, toolchain pin). src/third_party wins on conflict.
