# Workstation Inventory (APHRODY)

Read-only inventory of the Windows 11 developer workstation, taken 2026-11-12. Nothing was
deleted, moved or reconfigured while producing it. Secret material (`.env`, credential, token
and key files) is reported by name and count only.

Hardware (from `ay sys --json`): ASUS ROG STRIX G35CA, Intel Core i7-13700F (16 cores, 24
threads), DDR5-5800 (4 slots, 256 GiB max), NVIDIA GPU with 12 GiB VRAM (CUDA visible to
`llama-bench`), UEFI with Secure Boot, Hyper-V root partition. OS: Windows 11 Pro 26H1, build
28120.3302. Drives: `C:` 747 GB used / 205 GB free; `G:` is the Google Drive virtual drive
("Mon Drive", 758 GB) and was not scanned.

## 1. Installed developer tooling

### 1.1 PATH directories

PATH holds 82 entries. Resolution order matters for the duplicates below; the relevant order is:

1. `C:\Program Files\OpenSSH`, `C:\WINDOWS\System32`, `System32\OpenSSH` (system)
2. `C:\Program Files\LLVM\bin`, Go, MSVC 14.51, Windows SDK 10.0.26100, `dotnet`, `nodejs`, Git `cmd`
3. `~/.cargo/bin`, `~/.deno/bin`, `~/.local/bin`, `WinGet\Links`
4. Nushell, Android SDK (10 entries), Ghidra, Python 3.14
5. `C:\Program Files\Git\usr\bin`, `Git\bin`, `nodejs` (second time), Android Studio
6. `~/.bun/bin`, hermes, agy, several `WinGet\Packages\...` directories, glab, rclone, Blender,
   `~/.dotnet/tools`, 7-Zip, protobuf, x64dbg, DIE, PE-bear, retdec, Google Cloud SDK,
   gemini-api, Docker Desktop, GitHub Copilot CLI, Mitos, `~/bin`, Antigravity IDE

Defects:

- `C:\src\depot_tools` is on the machine PATH but does not exist; depot_tools lives at
  `C:\src\third_party\depot_tools` (removed root alias, see `var/reorg/`).
- `C:\Program Files\nodejs` appears twice.
- `~/go/bin` does not exist (Go binaries are not installed with `go install` here).
- `~/.bun/bin` comes after `WinGet\Links` and Git `usr\bin`, so every name that also exists
  there resolves away from Bun's copy (notably `bun` itself).
- No Scoop (`~/scoop`) or Chocolatey (`C:\ProgramData\chocolatey`) installation exists.

### 1.2 Executables per user directory

| Directory         | Count | Source                              | Contents                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| ----------------- | ----- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `~/.local/bin`    | 134   | manual / `just install-*` / uv tool | first-party CLIs (`ay`, `frg`, `gds`, `wck`, `graphify`, `src-deploy`, `ai-os`, `env-kit`, `triad`, `ske`, `nie`, `yolo`, `rust-stack`, `ring3-agent`, `unix-distro`, `wslg-rs`, `omarchy-wsl`, `gamescope-rs`, ...), `claude`, `codex`, `agy`, `node.exe` (copy of Node 26.13.0), Python 3.15 (`python3.15`, `python3.15t`), OpenSSH client copies, `hadolint`, `helm`, `kind`, `kustomize`, `llama-*`, `whisper-cli`, `supabase`, `ovhcloud`, `gws`, `rtk`, `nuget`, `pigz`, `procdump`, Android RE wrappers (`apktool`, `jadx`, `bundletool`, `apksigner`), Ghidra/WinDbg wrappers; `ruff`, `ty`, `maturin`, `meson`, `ninja` are uv tool shims (`AppData\Roaming\uv\tools`) |
| `~/.cargo/bin`    | 62    | rustup + `cargo install`            | toolchain proxies and 31 crates (table 1.4)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `~/.bun/bin`      | 93    | `bun add -g`                        | 63 global packages (table 1.5)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `WinGet\Links`    | 130   | winget                              | uutils coreutils (about 90 names), `bat`, `fd`, `rg`, `dust`, `dua`, `eza`, `fzf`, `delta`, `sd`, `just`, `jj`, `hyperfine`, `tokei`, `watchexec`, `zoxide`, `yq`, `uv`, `zig`, `cmake`, `ninja`, `make`, `sccache`, `caddy`, `cloudflared`, `rclone`, `ffmpeg`, `stripe`, `xh`, `yara`, `ugrep`, `tmux`, `wt`, `git-wt`, `bun`, `cutter`, `android`, `es`                                                                                                                                                                                                                                                                                                                      |
| `~/bin`           | 4     | manual                              | `node`, `node.cmd` (wrapper to Program Files Node), `xh`, `xhs`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `~/.deno/bin`     | 2     | Deno installer                      | `deno.exe` 2.9.8, `deno.old.exe`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `~/.dotnet/tools` | 1     | `dotnet tool`                       | `pwsh` 7.6.9                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |

Vendor CLI directories on PATH: hermes (`hermes`, `hermes-acp`), `AppData\Local\agy\bin\agy.exe`,
Mitos (`ms.cmd`), GitHub Copilot CLI 1.0.107, `gemini-api`, Antigravity IDE, Nushell 0.116.1 (with
plugins and its own `less`), Android CLI, retdec (27 tools in `~/.local/opt/retdec`), k6 2.3.0.

### 1.3 Versions of the main tools (first match on PATH wins)

| Tool                               | Version                                      | Resolved path                                            | Source                                                                                     |
| ---------------------------------- | -------------------------------------------- | -------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| ay                                 | 0.2.0                                        | `~/.local/bin/ay.exe`                                    | `just install-ay`                                                                          |
| bun                                | 1.4.4                                        | `WinGet\Links\bun.exe` (also `~/.bun/bin`, same version) | winget `Oven-sh.Bun` and Bun installer                                                     |
| node / npm npx                     | 26.13.0 / 11.20.0                            | `C:\Program Files\nodejs`                                | winget `OpenJS.NodeJS.LTS`                                                                 |
| deno                               | 2.9.8                                        | `~/.deno/bin`                                            | installer                                                                                  |
| git                                | 2.56.0.windows.4                             | `C:\Program Files\Git\cmd`                               | winget `Git.Git`                                                                           |
| gh                                 | 2.102.0                                      | `C:\Program Files\GitHub CLI`                            | winget `GitHub.cli` (registered twice)                                                     |
| glab                               | 1.123.0                                      | `AppData\Local\Programs\glab`                            | winget                                                                                     |
| jj                                 | 0.46.0                                       | `WinGet\Links`                                           | winget                                                                                     |
| cargo / rustc                      | 1.101.0-nightly (2026-10-27 / 2026-11-03)    | `~/.cargo/bin`                                           | rustup (`Rustlang.Rustup`)                                                                 |
| go                                 | 1.27.0                                       | `C:\Program Files\Go`                                    | winget `GoLang.Go`                                                                         |
| python                             | 3.14.7                                       | `AppData\Local\Programs\Python\Python314`                | winget; plus 3.15.2 in `~/.local/bin`, uv-managed 3.12.15                                  |
| uv                                 | 0.13.7                                       | `WinGet\Links`                                           | winget                                                                                     |
| clang / LLVM                       | 23.1.4                                       | `C:\Program Files\LLVM\bin`                              | winget                                                                                     |
| MSVC                               | 14.51.36231 (VS Build Tools 18)              | Program Files (x86)                                      | winget (VS 2022 Build Tools, VS 2026 Build Tools, Community 2026, Community 2026 Insiders) |
| dotnet                             | 11.0.100-rc.3 (also SDK 10.0.300, 10.0.403)  | `C:\Program Files\dotnet`                                | winget                                                                                     |
| java                               | OpenJDK 25.0.4.1                             | Microsoft JDK                                            | winget                                                                                     |
| cmake                              | 4.4.4                                        | `WinGet\Links`                                           | winget                                                                                     |
| ninja                              | 1.13.2 (kitware fork in `~/.local/bin` wins) | `~/.local/bin`                                           | uv tool; plus winget                                                                       |
| zig                                | 0.17.0                                       | `WinGet\Links`                                           | winget                                                                                     |
| just                               | 1.58.0                                       | `WinGet\Links`                                           | winget                                                                                     |
| fd / rg / dust                     | 10.5.0 / 15.2.0 / 1.2.5                      | `WinGet\Links` (rg is shadowed, see 1.6)                 | winget                                                                                     |
| sccache                            | 0.18.0                                       | `WinGet\Links`                                           | winget                                                                                     |
| docker                             | 29.9.2                                       | Docker Desktop `resources\bin`                           | Docker Desktop                                                                             |
| kubectl                            | 1.36.1                                       | Docker Desktop `resources\bin`                           | Docker Desktop                                                                             |
| helm / kind / kustomize / hadolint | 4.3.1 / 0.33.0 / 5.8.3 / 2.15.1              | `~/.local/bin`                                           | manual download                                                                            |
| gcloud                             | Cloud SDK 588.0.0                            | Program Files (x86)                                      | winget                                                                                     |
| caddy / cloudflared                | 2.11.9 / 2026.10.7                           | `WinGet\Links`                                           | winget                                                                                     |
| vercel / wrangler                  | 65.11.0 / 4.157.0                            | `~/.bun/bin`                                             | bun global                                                                                 |
| supabase                           | 2.121.0                                      | `~/.local/bin/supabase.exe`                              | manual                                                                                     |
| tsc / biome                        | 7.0.2 / 2.6.6                                | `~/.bun/bin`                                             | bun global                                                                                 |
| claude                             | 2.1.318                                      | `~/.local/bin`                                           | native installer                                                                           |
| codex                              | 0.162.0-alpha.17.2                           | `~/.local/bin/codex.cmd`                                 | manual                                                                                     |
| gemini / opencode                  | 0.66.0 / 2.2.5                               | `~/.bun/bin`                                             | bun global                                                                                 |
| copilot                            | 1.0.107                                      | `AppData\Local\GitHubCopilotCLI`                         | installer                                                                                  |
| pwsh                               | 7.6.9                                        | WindowsApps (Store), also `~/.dotnet/tools`              | winget `Microsoft.PowerShell` + dotnet tool                                                |
| ruff / ty / maturin / meson        | 0.17.4 / 0.0.100 / 1.16.0 / 1.12.1           | `~/.local/bin`                                           | uv tool                                                                                    |
| CUDA                               | 13.4 on PATH (13.3 also installed)           | Program Files                                            | winget                                                                                     |

First-party binaries in `~/.local/bin` reporting a version: `ai-os` 1.0.0, `agy` 1.5.5,
`agent-browser` 0.42.0, `agent-desktop` 1.2.0, `bpt` 1.0.0, `env-kit`, `src-deploy` /
`dpl` 1.27.0, `nie` 1.4.8, `ie` / `rosegriffon` 1.4.8, `rust-stack` 0.1.0, `ske` 1.0.0,
`triad` 1.0.0, `wck` 1.0.0, `sagy` (agy-studio 2.0.0), `rtk` 0.51.0, `gws` 0.22.5,
`llama-cli` / `llama-server` 0.9.0-dev, `whisper-cli` 1.9.5-dev, `coreutils` / `uutils` 0.12.0.
`frg`, `gds`, `graphify`, `n2b`, `r3d`, `ring3-agent`, `unix-distro` do not implement
`--version`; `yolo` and `ovhcloud` did not answer within 5 s.

### 1.4 `cargo install --list` (31 crates)

ast-grep 0.51.1, binwalk 3.1.0, brush-shell 0.4.0, cargo-audit 0.22.2, cargo-benchcmp 0.4.5,
cargo-bloat 0.12.1, cargo-criterion 1.1.0, cargo-deny 0.20.2, cargo-edit 0.13.14, cargo-hack
0.6.46, cargo-leptos 0.3.11, cargo-machete 0.9.2, cargo-ndk 4.1.2, cargo-nextest 0.9.151,
cargo-outdated 0.19.0, cargo-shear 1.14.0, cargo-sweep 0.8.0, cargo-watch 8.5.3, cargo-wdk
0.2.0, cargo-workspaces 0.4.2, cargo-xwin 0.23.1, cargo-zigbuild 0.24.1, eza 0.23.5, findutils
0.11.0 (`find`, `xargs`, `locate`, `updatedb`), gitoxide 0.61.0 (`gix`, `ein`), rust-script
0.36.0, shenron-mcp 1.4.5 (installed from `C:\src\shenron\crates\shenron-mcp`, a path that no
longer exists; the crate now lives under `apps/shenron`), tree-sitter-cli 0.27.2,
wasm-bindgen-cli 0.2.129, wasm-pack 0.15.0, xwin 0.10.0.

Rust toolchains (`~/.rustup`, 8.0 GiB): `nightly` (default, 2.9 GiB), `nightly-2026-09-15`
(3.3 GiB), `stable` (955 MiB), `1.99.1` (885 MiB).

### 1.5 `bun pm ls -g` (63 top-level packages, 3282 installed)

CLIs: @ast-grep/cli 0.45.3, @axe-core/cli, @biomejs/biome 2.6.6, componentize-js, jco,
@gltf-transform/cli, @google-cloud/gcloud-mcp, @google/gemini-cli 0.66.0, @lhci/cli,
@microsoft/learn-cli, @mikro-orm/cli, @open-pets/cli, @opencode/cli 2.2.5, @swc/cli,
@typescript/native-preview, agent-browser 0.41.2, agent-desktop 1.1.0, auth, cf, context-mode,
ctx7, drizzle-kit, esbuild, firebase-tools 15.35.0, hostinger-api-mcp 3.38.3, html-validate,
jscodeshift, json-schema-to-typescript, lighthouse 13.6.0, lightningcss-cli, linkinator,
neonctl 8.22.0, next-sitemap, nodemon, nx 23.2.1, oxlint 1.92.0, pa11y, playwright 1.65.0,
prisma 8.0.0-rc.19, psi, repomix, serve, shadcn 4.22.0, sharp-cli, size-limit, svgo,
typescript 7.0.2, typescript-language-server, ui-ux-pro-max-cli, unlighthouse, vercel 65.11.0,
vite 8.3.2, wasm-pack 0.15.0, wrangler 4.157.0.
Libraries installed globally for no CLI benefit: @swc/core, @types/node, axe-core,
chrome-launcher, exa-js, mitata, puppeteer-core, tinybench, web-vitals,
@material-design-icons/scripts.

### 1.6 `winget list` summary

329 lines, 194 packages with source `winget`. No Scoop or Chocolatey. Groups:

- Languages and runtimes: Bun, Node.js LTS, Go 1.27.0, Python 3.14.7 + Launcher, Rustup, Zig,
  OpenJDK 25, .NET SDK 10.0.300, 10.0.403 and 11.0.100-rc.3, .NET runtimes 6.0.36, 8.0.14,
  8.0.21, 8.0.22, ASP.NET Core 8 and 10, Desktop runtimes 8 and 10 (two each).
- Build: LLVM, CMake, Ninja, make (ezwinports), NSIS, Visual Studio Build Tools 2022, Build
  Tools 2026, Community 2026, Community 2026 Insiders, Windows SDK 10.0.26100 (two builds) and
  10.0.28000, WDK 10.0.28000, GDK, Vulkan SDK 1.4.363.0, CUDA 13.3 and 13.4, Nsight Compute
  2026.2.0 and 2026.3.0, protobuf, sccache.
- CLI utilities (Rust-first): uutils coreutils and diffutils, ripgrep, fd, bat, eza, dust,
  dua, delta, sd, tokei, hyperfine, watchexec, zoxide, just, jj, worktrunk, yazi, zellij,
  helix, nushell, carapace, uv, xh, yq, jq, fzf, ugrep, zstd, tmux-windows, psmux, gsudo.
- Cloud and network: GitHub CLI (listed twice), glab, Google Cloud SDK, cloudflared, Caddy,
  rclone, Stripe CLI, act, k6, WireGuard, OpenSSH Preview, OpenSSL 4.1.0, SSHFS-Win, WinFsp,
  Nmap 7.80, Wireshark 4.6.8.
- Reverse engineering: Rizin, Cutter, x64dbg, ILSpy, ImHex, PE-bear, Detect It Easy, YARA,
  WinDbg, QEMU.
- Desktop and media: 7-Zip, FFmpeg, ImageMagick, Blender, VLC, Obsidian, Figma, Figma Agent,
  Google Chrome and Canary, Brave Nightly, Google Drive, Windows Terminal, PowerShell,
  Antigravity and Antigravity IDE, Android Studio, Android CLI, GitHub Copilot app, games
  (Steam, EA app, Epic Games Launcher), vendor (Logitech G HUB, Intel DSA, PresentMon,
  ViGEm Bus).
- About 60 entries are Visual C++ redistributables and WindowsAppRuntime versions (normal).

### 1.7 Duplicates and shadowing

144 command names exist in more than one PATH directory. Most are harmless overlaps between
uutils coreutils (`WinGet\Links`) and Git for Windows `usr\bin`; coreutils wins because
`WinGet\Links` comes first. The ones that matter:

| Name                                                                      | Copies (first wins)                                                                                         | Problem                                                                                                                                                                                                                                           |
| ------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `rg`                                                                      | `~/.local/bin/rg.cmd`, `WinGet\Links\rg.exe` (ripgrep 15.2.0)                                               | `rg.cmd` runs the Rose Griffon Bun CLI (`ie` v1.4.8) via `bun run apps/rosegriffon/apps/cli/src/index.ts`. Any `rg` from cmd, Bun `$`, or `just` gets the Rose Griffon CLI, not ripgrep. `ie.cmd` and `rosegriffon.cmd` already provide that CLI. |
| `bun` / `bunx`                                                            | `WinGet\Links` 1.4.4, `~/.bun/bin` 1.4.4                                                                    | Two installs; `bun upgrade` updates `~/.bun/bin` while PATH resolves the winget copy, so they will drift.                                                                                                                                         |
| `node`                                                                    | `Program Files\nodejs` 26.13.0, `~/.local/bin/node.exe` (identical 100 MB copy), `~/bin/node.cmd` (wrapper) | Three entry points for one version.                                                                                                                                                                                                               |
| `npx`                                                                     | `Program Files\nodejs` (npm 11.20.0), `~/.bun/bin/npx.cmd` (Bun 1.4.4)                                      | Program Files wins, so `npx` is npm, not Bun.                                                                                                                                                                                                     |
| `python`                                                                  | Python 3.14.7, WindowsApps Store alias; plus `python3.15` in `~/.local/bin`, uv cpython 3.12.15             | Store alias should be disabled; three interpreters.                                                                                                                                                                                               |
| `pwsh`                                                                    | Store (WindowsApps, twice) 7.6.9, `~/.dotnet/tools/pwsh` 7.6.9                                              | dotnet tool copy is redundant.                                                                                                                                                                                                                    |
| `ssh`, `scp`, `sftp`, `ssh-add`, `ssh-agent`, `ssh-keygen`, `ssh-keyscan` | `Program Files\OpenSSH` (winget Preview), `System32\OpenSSH`, `~/.local/bin` copies, Git `usr\bin`          | Four OpenSSH builds; `ssh` resolves to the Preview, `ssh-add` / `ssh-agent` / `ssh-keygen` to the in-box build, so client and agent can come from different versions.                                                                             |
| `ast-grep` / `sg`                                                         | `~/.cargo/bin` 0.51.1, `~/.bun/bin` 0.45.3                                                                  | Bun copy is six minors behind.                                                                                                                                                                                                                    |
| `agent-browser` / `agent-desktop`                                         | `~/.local/bin` 0.42.0 / 1.2.0, `~/.bun/bin` 0.41.2 / 1.1.0                                                  | Stale Bun globals.                                                                                                                                                                                                                                |
| `wasm-pack`                                                               | `~/.cargo/bin`, `~/.bun/bin` (both 0.15.0)                                                                  | Duplicate.                                                                                                                                                                                                                                        |
| `eza`                                                                     | `~/.cargo/bin` 0.23.5, winget                                                                               | Duplicate.                                                                                                                                                                                                                                        |
| `ninja`                                                                   | `~/.local/bin` (uv, kitware 1.13.2), winget 1.13.2                                                          | Duplicate.                                                                                                                                                                                                                                        |
| `xh` / `xhs`                                                              | winget 0.26.2, `~/bin` 0.26.3                                                                               | Duplicate, versions differ.                                                                                                                                                                                                                       |
| `supabase`                                                                | `~/.local/bin/supabase.exe` 2.121.0, `~/.local/bin/supabase-go.exe` (same), `~/.bun/bin/supabase.cmd`       | The Bun shim points to `~/.yolo/cloud-cli/...`, which does not exist (broken).                                                                                                                                                                    |
| `find`, `xargs`, `locate`                                                 | System32 `find.exe` wins over `~/.cargo/bin` (uutils findutils) and Git                                     | Cargo findutils is unreachable as `find` from cmd and pwsh.                                                                                                                                                                                       |
| `sort`, `more`, `hostname`, `whoami`, `expand`, `comm`, `timeout`, `tar`  | System32 wins over coreutils                                                                                | Expected; use `coreutils <cmd>` when GNU semantics are needed.                                                                                                                                                                                    |
| `coreutils` / `uutils`                                                    | `~/.local/bin/coreutils.exe`, `~/.local/bin/uutils.exe`, winget `uutils.coreutils`                          | Three copies of uutils 0.12.0.                                                                                                                                                                                                                    |
| `gh`                                                                      | one binary, but winget registers `GitHub.cli` twice                                                         | Stale ARP entry.                                                                                                                                                                                                                                  |
| `android`                                                                 | `AppData\AndroidCLI`, SDK `cmdline-tools`, winget link                                                      | Three copies.                                                                                                                                                                                                                                     |
| `less`                                                                    | Nushell's `less.exe` wins over Git's `less`                                                                 | Surprising pager inside Git Bash.                                                                                                                                                                                                                 |
| helix                                                                     | winget `Helix.Helix`, `~/.local/opt/helix` via `hx.cmd`                                                     | Two installs.                                                                                                                                                                                                                                     |
| ffmpeg, rclone, cutter                                                    | `WinGet\Links` plus the raw `WinGet\Packages` dir on PATH                                                   | PATH entries for package dirs are redundant once the link exists.                                                                                                                                                                                 |

Shim duplication and dead files in `~/.local/bin`:

- `.cmd` wrappers that only forward to the `.exe` next to them: `env-kit`, `frg`, `ske`,
  `knowledge-engine` (also `ske.exe`), `triad`, `wck` (plus `web-check.exe`, the same binary),
  `rust-stack`, `rsk`, `unix-distro`, `wslg-rs`, `omarchy-wsl`, `aphrody-app`, `dpl`.
- Backup binaries totalling about 870 MB: `ai-os.{bak,new,old,prev}.exe` (4 x 110 MB),
  `env-kit.old.exe`, `frg.old.exe`, `triad.old.exe` (110 MB each), `ay.old.exe`,
  `depot.old.exe`, `depot-graph.old.exe`, `gitingest.old.exe`, `archguard.old.exe`,
  `xtk.old.exe`; plus `~/.deno/bin/deno.old.exe`.
- Broken shims: `graphify.cmd` (calls `depot-graph.exe`, which no longer exists; `graphify.exe`
  wins anyway), `unx.cmd` (`C:\src\crates\unix\target\release\unix-distro.exe`, missing),
  `wlg.cmd` (`C:\src\crates\wayland\target\release\wslg-rs.exe`, missing),
  `ast-grep-server.exe` (expects `~/.local/opt/cpython-aphrody-3.12.15`, missing),
  `~/.bun/bin/supabase.cmd` (missing `~/.yolo`).
- `bun run` shims that execute repo sources directly, so they break when the path moves:
  `gds`, `aphrody-pm`, `apm`, `arn`, `brain`, `vn`, `bpt`, `ie`, `rosegriffon`, `rg`, `labs`
  (`third_party/labs`).

## 2. Projects and git repositories outside `C:\src`

Scanned with `fd -H -I -t d '^\.git$'` over `C:\labs`, `C:\crates_backup`, `C:\VulkanSDK` and
`C:\Users\aphro` (excluding `node_modules`, `target`, `third_party`, cargo registry and
rustup); 72 repositories found. Project roots without `.git` were searched with `fd` for
`Cargo.toml`, `package.json`, `go.mod`, `pyproject.toml` (depth 4): only editor extensions.
`G:` (Google Drive) was not scanned.

| Path                                                        | Remote                                                                                                                        | Last commit           | Size                         | Duplicated in `C:\src` / aphrody-dev                                                                                                                                                                                  |
| ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | --------------------- | ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `C:\labs`                                                   | none (no remote)                                                                                                              | 2026-11-12, 2 commits | 18 MiB (17 MiB `target`)     | No. "Aphrody Labs" Rust workspace (`crates/cli`, binary `aphrody`). Not in `C:\src`, no aphrody-dev repo. Unrelated to `C:\src\third_party\labs` (a Vercel mirror plus Bun benchmark harness, also without a remote). |
| `C:\crates_backup`                                          | not a repo                                                                                                                    | dir dated 2026-11-11  | 18 MiB                       | 51 of 52 crates (`aphrody-nie-*`, `aphrody-softraster`, `shenron-gpu`, `shenron-re`, `yolo-re-core`) exist under `apps/rosegriffon/crates` or `apps/shenron/crates`. Only `criware` exists nowhere else.              |
| `~/lfs-git`                                                 | git.linuxfromscratch.org/lfs.git                                                                                              | 2026-11-06            | 25 MiB                       | No (upstream LFS book).                                                                                                                                                                                               |
| `~/ComfyUI`                                                 | github.com/comfyanonymous/ComfyUI                                                                                             | 2026-11-04            | 4.6 GiB                      | No (upstream, with models/venv).                                                                                                                                                                                      |
| `AppData\Local\hermes\hermes-agent`                         | github.com/NousResearch/hermes-agent                                                                                          | 2026-11-03            | 3.5 GiB for all of `hermes`  | No (vendor install).                                                                                                                                                                                                  |
| `~/.gemini/antigravity-cli/brain/.../yolo-ui-inspect`       | github.com/yolo-rs/yolo-ui                                                                                                    | 2026-11-09            | small                        | Agent scratch clone; `yolo` lives at `apps/yolo`.                                                                                                                                                                     |
| `~/.gemini/antigravity-cli/brain/.../repos/yolo-re`         | github.com/yolo-rs/yolo-re                                                                                                    | 2026-11-08            | small                        | Agent scratch clone.                                                                                                                                                                                                  |
| `~/.local/share/android-docs/git/*` (7 repos)               | android.googlesource.com (`platform/build`, `build/soong`, `art`, `bionic`, `system/sepolicy`, `tools/repohooks`, `manifest`) | 2025-03-26            | part of `~/.local` (8.2 GiB) | Reference mirrors; candidates for `third_party/docs-ecosystem`.                                                                                                                                                       |
| `~/.claude/plugins/marketplaces/claude-plugins-official`    | anthropics/claude-plugins-official                                                                                            | 2026-11-12            | small                        | Tool-managed.                                                                                                                                                                                                         |
| `AppData\Local\copilot\marketplaces\*` (5)                  | GitHub Copilot marketplaces                                                                                                   | n/a                   | small                        | Tool-managed.                                                                                                                                                                                                         |
| `AppData\Local\vcpkg\registries\git`                        | none, dirty                                                                                                                   | n/a                   | 129 MiB                      | Tool-managed cache.                                                                                                                                                                                                   |
| `~/.cargo/git/checkouts/*` (3), `~/.cargo/advisory-db*` (2) | crates                                                                                                                        | n/a                   | 327 MiB                      | Cargo caches.                                                                                                                                                                                                         |
| `AppData\Local\Temp\*` (about 45)                           | none                                                                                                                          | n/a                   | under 400 MiB                | Test leftovers: 33 `fix-loop-*`, 40 `remote-dev-*`, 33 `skills-*`, 14 `tmp.*`, `smchk` (224 MiB target), `pytest-of-aphro`, `sync-checkouts-*`.                                                                       |

Other profile directories of note: `~/apps/shenron-crunchyroll` (empty),
`~/agent-workspace`, `~/cloudscraper`, `~/hyerv`, `~/hyperv`, `~/public` (empty or near
empty), `~/Documents` (2.2 GiB, including an Obsidian vault). `.yolo` is referenced by a shim
but no longer exists.

Secret-bearing locations (names and counts only, contents not read): `~/.ssh` (17 files),
`~/config/secrets` (2), `~/.aphrody/secrets` (1), `~/.commons/secrets` (1), and a plaintext
recovery-codes text file under `~/Documents/github` (1). Move the last one into a password
manager.

aphrody-dev GitHub has 42 repositories (gh repo list). None correspond to `C:\labs`,
`C:\crates_backup/criware`, or `third_party/labs`.

## 3. Disk usage hotspots on `C:`

Measured with `dust -d 4 -b -r -P -X C:\Windows C:\` (736 GiB counted outside `C:\Windows`)
plus `dust -d 0`/`-d 1` on the individual directories. Sizes are apparent sizes as reported by dust.

### 3.1 Top 30 directories

| #   | Directory                                                               | Size                                                       | Kind                                        |
| --- | ----------------------------------------------------------------------- | ---------------------------------------------------------- | ------------------------------------------- |
| 1   | `C:\Program Files\Epic Games\UE_5.8`                                    | 70 GiB                                                     | Unreal Engine 5.8                           |
| 2   | `C:\Program Files (x86)\Steam\steamapps\common`                         | 63 GiB                                                     | games                                       |
| 3   | `C:\src\third_party\chromium\src`                                       | 48 GiB                                                     | gclient checkout                            |
| 4   | `~/.bun/install/global/node_modules`                                    | 26 GiB, of which `.old_modules-8902401b49212a52` is 20 GiB | Bun globals plus an abandoned previous tree |
| 5   | `pagefile.sys`                                                          | 24 GiB                                                     | system                                      |
| 6   | `AppData\Local\Docker` (`docker_data.vhdx` 24.3 GB)                     | 24 GiB                                                     | Docker Desktop disk                         |
| 7   | `AppData\Local\Google\DriveFS`                                          | 23 GiB                                                     | Google Drive local cache                    |
| 8   | `AppData\Local\depot_tools\git_cache`                                   | 23 GiB                                                     | Chromium git cache                          |
| 9   | `AppData\Local\Android\Sdk`                                             | 23 GiB                                                     | Android SDK, emulator, images               |
| 10  | `C:\src\apps\rosegriffon\target`                                        | 23 GiB                                                     | Rust target                                 |
| 11  | `C:\src\target` (19 GiB `debug`)                                        | 20 GiB                                                     | root workspace target                       |
| 12  | `C:\Program Files\WindowsApps`                                          | 17 GiB                                                     | Store apps                                  |
| 13  | `C:\ProgramData\Microsoft\Windows\Containers`                           | 16 GiB                                                     | Windows container / sandbox layers          |
| 14  | `~/.android/avd` (`bun_pixel_api37` 8.6 GiB, `Aphrody_Play_37` 6.5 GiB) | 15 GiB                                                     | emulator images                             |
| 15  | `C:\Program Files\Microsoft Visual Studio\18\Insiders`                  | 14 GiB                                                     | VS Community 2026 Insiders                  |
| 16  | `C:\src\packages\ai-os\submodules`                                      | 10 GiB                                                     | ai-os submodules                            |
| 17  | `C:\src\third_party\n2b` (6.8 GiB `vendor`)                             | 10 GiB                                                     | upstream                                    |
| 18  | `AppData\Roaming\Claude\vm_bundles`                                     | 9.3 GiB                                                    | Claude Desktop VM                           |
| 19  | `AppData\Local\ay-target`                                               | 9.3 GiB                                                    | Rust target (ay builds)                     |
| 20  | `AppData\Local\Aphrody\cache\cargo-target`                              | 8.7 GiB                                                    | Rust target                                 |
| 21  | `~/.rustup/toolchains`                                                  | 8.0 GiB                                                    | 4 toolchains                                |
| 22  | `C:\Program Files\NVIDIA GPU Computing Toolkit\CUDA\v13.4`              | 7.9 GiB                                                    | CUDA                                        |
| 23  | `C:\src\third_party\taffy\target`                                       | 7.8 GiB                                                    | Rust target inside `third_party`            |
| 24  | `C:\Program Files (x86)\Windows Kits\10`                                | 7.7 GiB                                                    | SDK/WDK, 4.0 GiB debuggers                  |
| 25  | `C:\src\var\legacy` (`yolo-rs` 4.8 GiB)                                 | 7.2 GiB                                                    | legacy archive                              |
| 26  | `AppData\Local\Temp`                                                    | 7.1 GiB                                                    | temp                                        |
| 27  | `AppData\Roaming\Locally Uncensored`                                    | 6.8 GiB                                                    | local model app data                        |
| 28  | `C:\Program Files\dotnet`                                               | 6.3 GiB                                                    | 3 SDKs, many packs                          |
| 29  | `AppData\Local\Google\Chrome\User Data`                                 | 6.1 GiB                                                    | browser profile                             |
| 30  | `AppData\Local\Mozilla\sccache`                                         | 5.4 GiB                                                    | sccache                                     |

Next tier: `ProgramData\Package Cache` 5.2 GiB, `Microsoft SDKs` 5.2 GiB, `ComfyUI` 4.6 GiB
(4.4 GiB venv), `uv\cache` 4.4 GiB, `Program Files (x86)\Microsoft Visual Studio\18\BuildTools`
3.9 GiB, `bun\install\cache` 3.8 GiB, `crates\rust-stack\target` 3.8 GiB, Android Studio 3.7
GiB, `hermes` 3.5 GiB, `packages\ai-os\python\.venv` 3.4 GiB, `koharu` 3.2 GiB,
`crates\corelib\target` 2.7 GiB, `.cargo\registry` 2.0 GiB, `.nuget` 1.9 GiB.

All Rust `target` directories together (found through `CACHEDIR.TAG`): about 79 GiB
(rosegriffon 23, root 20, ay-target 9.3, Aphrody cache 8.7, taffy 7.8, rust-stack 3.8,
corelib 2.7, smaller ones under 1 GiB each).

### 3.2 Reclaimable caches and cleanup commands (not executed)

| Item                          | Approx. gain           | Command                                                                                                                                                                                                                                          |
| ----------------------------- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Abandoned Bun global tree     | 20 GiB                 | `Remove-Item -Recurse -Force "$HOME\.bun\install\global\node_modules\.old_modules-8902401b49212a52"`                                                                                                                                             |
| Bun install cache             | 3.8 GiB                | `bun pm cache rm`                                                                                                                                                                                                                                |
| Root workspace target         | 20 GiB                 | `cargo clean --manifest-path C:\src\Cargo.toml` (or `cargo sweep --time 14` to keep recent artifacts)                                                                                                                                            |
| Rose Griffon target           | 23 GiB                 | `cargo clean --manifest-path C:\src\apps\rosegriffon\Cargo.toml`                                                                                                                                                                                 |
| ay and Aphrody shared targets | 18 GiB                 | `Remove-Item -Recurse -Force "$env:LOCALAPPDATA\ay-target","$env:LOCALAPPDATA\Aphrody\cache\cargo-target"`                                                                                                                                       |
| taffy target in third_party   | 7.8 GiB                | `cargo clean --manifest-path C:\src\third_party\taffy\Cargo.toml`                                                                                                                                                                                |
| Other crate targets           | 7 GiB                  | `cargo clean` in `crates\rust-stack`, `crates\corelib`, `crates\bench`, `packages\ai-os\native\sovereign-polyglot-ffi`; `Remove-Item -Recurse "$env:TEMP\smchk"`                                                                                 |
| Unused rustup toolchain       | 3.3 GiB                | `rustup toolchain uninstall nightly-2026-09-15-x86_64-pc-windows-msvc`                                                                                                                                                                           |
| Cargo registry and git caches | 1 to 2 GiB             | `cargo cache --autoclean` (needs `cargo install cargo-cache`) or remove `~/.cargo/registry/src` (re-extracted on demand)                                                                                                                         |
| sccache                       | 5.4 GiB                | `sccache --stop-server; Remove-Item -Recurse -Force "$env:LOCALAPPDATA\Mozilla\sccache\cache"` (or lower `SCCACHE_CACHE_SIZE`)                                                                                                                   |
| Docker images and build cache | 16 GiB inside the vhdx | `docker builder prune -a; docker image prune -a`, then compact: `wsl --shutdown; Optimize-VHD -Path "$env:LOCALAPPDATA\Docker\wsl\disk\docker_data.vhdx" -Mode Full` (admin, Hyper-V module) or Docker Desktop, Troubleshoot, Clean / Purge data |
| depot_tools git cache         | up to 23 GiB           | `third_party/chromium/.gclient` sets `cache_dir` to this path; keep it while the Chromium checkout is synced, otherwise `Remove-Item -Recurse -Force "$env:LOCALAPPDATA\depot_tools\git_cache"`                                                  |
| Android AVDs                  | up to 15 GiB           | `avdmanager delete avd -n bun_pixel_api37` (or `Aphrody_Play_37`) for an emulator no longer in use; `sdkmanager --uninstall` for unused system images                                                                                            |
| uv cache                      | 4.4 GiB                | `uv cache prune` (or `uv cache clean`)                                                                                                                                                                                                           |
| npm caches                    | 0.5 GiB                | `npm cache clean --force`                                                                                                                                                                                                                        |
| Gradle                        | 0.2 GiB                | `Remove-Item -Recurse "$HOME\.gradle\caches"`                                                                                                                                                                                                    |
| NuGet                         | 2.1 GiB                | `dotnet nuget locals all --clear`                                                                                                                                                                                                                |
| pip                           | none present           | (no `AppData\Local\pip\Cache`)                                                                                                                                                                                                                   |
| Go build cache                | 0.2 GiB                | `go clean -cache`                                                                                                                                                                                                                                |
| Temp test leftovers           | 0.6 GiB                | `Remove-Item -Recurse -Force $env:TEMP\fix-loop-*,$env:TEMP\remote-dev-*,$env:TEMP\skills-*,$env:TEMP\tmp.*,$env:TEMP\sync-checkouts-*,$env:TEMP\pytest-of-aphro`                                                                                |
| `~/.local/bin` backups        | 0.9 GiB                | `Remove-Item "$HOME\.local\bin\*.old.exe","$HOME\.local\bin\*.bak.exe","$HOME\.local\bin\*.new.exe","$HOME\.local\bin\*.prev.exe"`                                                                                                               |
| Google Drive cache            | up to 23 GiB           | Google Drive settings, Preferences, change "Mirror files" to "Stream files" or lower the cache; do not delete `DriveFS` by hand                                                                                                                  |
| Claude Desktop VM bundle      | 9.3 GiB                | Claude Desktop settings (remove the local VM) if Cowork is not used; the service is already disabled                                                                                                                                             |
| VS Insiders                   | 14 GiB                 | `winget uninstall Microsoft.VisualStudio.Community.Insiders` if VS Community 2026 is enough                                                                                                                                                      |
| Windows component store       | variable               | `Dism /Online /Cleanup-Image /StartComponentCleanup` (admin)                                                                                                                                                                                     |

Low-risk total without touching active checkouts, emulators or Drive: about 125 GiB (Bun old
tree 20, Rust targets 79, Docker 16, sccache 5, uv 4, toolchain 3), less whatever the next
builds recreate.

## 4. Virtualization, containers, tasks and services

- WSL (`wsl -l -v`): one distro, `docker-desktop` (Running, WSL 2). No user distro is
  registered, although `omarchy-wsl`, `unix-distro`, `wslg-rs` and `unx`/`wlg` shims exist in
  `~/.local/bin`. A `wslc` session disk (`AppData\Local\wslc\...\storage.vhdx`, 0.6 GB) exists.
- Docker Desktop 29.9.2: contexts `default` (`npipe:////./pipe/docker_engine`) and
  `desktop-linux` (active). 9 images (5.98 GB, 4.33 GB reclaimable): `rosegriffon/cron`
  (2.76 GB), `rosegriffon/core` (1.7 GB), `rosegriffon/model-serve`, `aphrody/monorepo-runtime:local`
  (290 MB), `rust:1-alpine3.24` and `rust:1-alpine3.22` (1.39 / 1.35 GB), `alpine:3.22`,
  `oven/bun:1.4.4-alpine`, `nginxinc/nginx-unprivileged:1.29-alpine`. No containers, no volumes.
  Build cache 18.35 GB (11.98 GB reclaimable). Backing disk
  `AppData\Local\Docker\wsl\disk\docker_data.vhdx` is 24.3 GB.
- Kubernetes: `kubectl` 1.36.1 from Docker Desktop, `~/.kube/config` present, `kind` 0.33.0.
- Hyper-V: the host runs as hypervisor root; `Get-VM` returns no VMs. Claude Desktop keeps a
  VM bundle (`AppData\Roaming\Claude\vm_bundles\claudevm.bundle`, rootfs 7.5 GB); its
  `CoworkVMService` is disabled. Windows container sandboxes under
  `ProgramData\Microsoft\Windows\Containers` total about 1 GB.
- Scheduled tasks: none named aphrody, yolo, src or sccache. The only developer tasks are Git
  for Windows maintenance (hourly, daily, weekly), registered for `maintenance.repo =
C:/src/depot` and `C:/src/bun`, both removed root aliases; those runs now fail silently.
- Services that are ours or developer-facing: `ssh-agent` (Running, Auto), `sshd` (Stopped,
  Auto), `WSLService` (Running), `WinFsp.Launcher` (Running, for SSHFS-Win). No Aphrody, Caddy,
  cloudflared, sccache or WireGuard tunnel services are installed.

## 5. Recommendations

### 5.1 Uninstall or remove as duplicate

1. Rename or delete `~/.local/bin/rg.cmd`; `ie` and `rosegriffon` already expose the Rose
   Griffon CLI. This restores ripgrep for cmd, Bun `$` and `just` recipes.
2. Pick one Bun: keep the `ay up` managed copy in `~/.local/bin` (tools.toml), then
   `winget uninstall Oven-sh.Bun` and drop `~/.bun/bin/bun.exe` (keep `~/.bun/bin` for globals).
3. Node: keep the winget LTS; delete `~/.local/bin/node.exe` and `~/bin/node{,.cmd}`.
4. OpenSSH: keep one build. Either uninstall `Microsoft.OpenSSH.Preview` or move it before
   `System32\OpenSSH`; delete the copies in `~/.local/bin` (`ssh*.exe`, `scp`, `sftp`).
5. Delete the abandoned `~/.bun/install/global/node_modules/.old_modules-8902401b49212a52`
   (20 GiB, see 3.2). Bun globals duplicated by better copies: `bun remove -g @ast-grep/cli agent-browser
agent-desktop wasm-pack`, plus the library-only globals (`@swc/core`, `@types/node`,
   `axe-core`, `chrome-launcher`, `exa-js`, `mitata`, `puppeteer-core`, `tinybench`,
   `web-vitals`, `@material-design-icons/scripts`).
6. Cargo/winget overlaps: `cargo uninstall eza` (keep winget) or the reverse; `cargo uninstall
findutils` (unreachable behind System32 `find`); one of `~/.local/bin/{coreutils,uutils}.exe`
   given winget `uutils.coreutils`; one `ninja`; `~/bin/xh*` versus winget `xh`; one helix.
7. Delete stale backups in `~/.local/bin` (`*.old.exe`, `*.bak.exe`, `*.new.exe`,
   `*.prev.exe`, about 870 MB) and `~/.deno/bin/deno.old.exe`, plus broken shims
   (`graphify.cmd`, `unx.cmd`, `wlg.cmd`, `ast-grep-server.exe`, `~/.bun/bin/supabase.cmd`)
   and redundant forwarding `.cmd` files listed in 1.7.
8. Toolchain versions: CUDA 13.3 (13.4 is on PATH), Nsight Compute 2026.2.0, .NET SDK 10.0.300
   (10.0.403 supersedes it), .NET 6.0.36 runtime (EOL), VS Build Tools 2022 if nothing still
   pins MSVC 14.4x, one of VS Community 2026 / Insiders, the duplicate `GitHub.cli` ARP entry,
   and the `nightly-2026-09-15` rustup toolchain (3.3 GiB, pinned nowhere:
   `rustup toolchain uninstall nightly-2026-09-15-x86_64-pc-windows-msvc`). Keep `1.99.1`:
   `apps/shenron` and `C:\labs` pin it; `apps/rosegriffon` pins `nightly`.
9. Disable the WindowsApps `python.exe` alias (Settings, Apps, Advanced, App execution aliases)
   and remove `~/.dotnet/tools/pwsh` (`dotnet tool uninstall -g PowerShell`).
10. PATH hygiene: remove `C:\src\depot_tools` (or replace it with
    `C:\src\third_party\depot_tools`), the second `C:\Program Files\nodejs`, and the
    `WinGet\Packages\...` entries for FFmpeg, Rclone and Cutter that already have links.
11. Git maintenance: `git maintenance unregister --config-file ~/.gitconfig` for
    `C:/src/depot` and `C:/src/bun`, then `git maintenance register` for `C:/src` and
    `C:/src/third_party/bun` if background maintenance is still wanted.
12. Reinstall `shenron-mcp` from its current path: `cargo install --path
C:\src\apps\shenron\crates\shenron-mcp`.

### 5.2 Move under `ay up` management (tools.toml)

`tools.toml` currently lists ay, bun, rustup, gh, wrangler, gcloud, ovhcloud,
hostinger-api-mcp, coreutils, ripgrep, just, zig, cargo-zigbuild, dist. Suggested additions,
with preferred source:

| Tool                                                                                                                                                                      | Current source                            | Preferred `ay up` source                                                                                                                  |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| fd, dust, bat, delta, sd, hyperfine, tokei, watchexec, zoxide, eza, xh, yq, jj, fzf                                                                                       | winget (and cargo for eza)                | `github` release archives                                                                                                                 |
| uv (and through it ruff, ty, maturin, meson, ninja)                                                                                                                       | winget + uv tool                          | `github` (astral-sh/uv), then `uv tool install`                                                                                           |
| sccache, cargo-nextest, cargo-binstall, cargo-deny, cargo-audit, cargo-machete, cargo-shear, cargo-xwin, wasm-pack, wasm-bindgen-cli, tree-sitter-cli, gitoxide, ast-grep | cargo install                             | `github` release binaries (no local compile)                                                                                              |
| kubectl, helm, kind, kustomize, hadolint                                                                                                                                  | Docker Desktop / manual in `~/.local/bin` | `github` / `url`                                                                                                                          |
| caddy, cloudflared, rclone, stripe                                                                                                                                        | winget                                    | `github`                                                                                                                                  |
| deno                                                                                                                                                                      | installer                                 | `github` (denoland/deno)                                                                                                                  |
| glab                                                                                                                                                                      | winget                                    | `url` (GitLab releases)                                                                                                                   |
| vercel, neonctl, firebase-tools, supabase, biome, oxlint, typescript, playwright, shadcn                                                                                  | bun global / manual                       | `bun`                                                                                                                                     |
| go                                                                                                                                                                        | winget                                    | `url` (go.dev/dl), pinned by `src.lock.json`                                                                                              |
| node                                                                                                                                                                      | winget LTS                                | `url` (nodejs.org), only while something still needs npm                                                                                  |
| claude, codex, gemini, opencode, copilot                                                                                                                                  | mixed installers                          | leave to vendors (self-updating)                                                                                                          |
| first-party CLIs (`frg`, `gds`, `wck`, `graphify`, `src-deploy`, `ai-os`, `env-kit`, `triad`, `ske`)                                                                      | `just install-*` into `~/.local/bin`      | ship through the same dist release as `ay` (or `ay up --local` building from the workspace) so the `.old`/`.bak` copies stop accumulating |

Keep on winget (system integration, drivers or MSI only): Git, PowerShell, Visual Studio Build
Tools, Windows SDK/WDK, LLVM, CUDA, Vulkan SDK, Docker Desktop, WSL, WinFsp, SSHFS-Win,
WireGuard, OpenJDK, .NET SDK, Python (until uv-managed Python replaces it), GUI applications.

### 5.3 Absorb into `C:\src`

- `C:\labs` (Aphrody Labs Rust workspace, no remote): either create `aphrody-dev/labs` and add
  it as a submodule under `apps/labs`, or fold `crates/cli` into the root workspace as
  `crates/labs`. It must not stay an untracked root-of-drive project. Resolve the name clash
  with `third_party/labs` (rename that one, for example `third_party/vercel-labs-mirror`, or
  move its benchmark harness to `crates/bench`).
- `C:\crates_backup`: copy `criware` into `apps/rosegriffon/crates/criware` (or wherever it
  belongs) and then delete the backup; the other 51 crates already exist in the apps.
- `~/.local/share/android-docs/git/*`: pin under `third_party/docs-ecosystem` with
  `src.lock.json` entries (refreshed by `just docs-sync`) instead of free-floating clones.
- `.cmd` shims that `bun run` repo sources (`gds`, `brain`, `vn`, `bpt`, `apm`, `arn`, `ie`,
  `labs`): generate them from one place (`ay up` or a `just install-shims` recipe) so moved
  paths do not leave dead shims.
- Agent scratch clones in `~/.gemini/antigravity-cli/brain/*/scratch` (yolo-ui, yolo-re):
  nothing to absorb; `apps/yolo` is canonical. Delete when the sessions end.
