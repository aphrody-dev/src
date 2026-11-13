# Microsoft Rust repos: what we adopt

Survey 2026-11-12 of active Rust repos in `microsoft`, `Azure`, `hyperlight-dev` (`gh search repos
--language rust`, stars and last push). Forks under `aphrody-dev` only for repos we build or patch.

| Repo                                            | Stars, push        | Use in our stack                          | Action                                                     |
| ----------------------------------------------- | ------------------ | ----------------------------------------- | ---------------------------------------------------------- |
| windows-rs                                      | 12.9k, 11-11       | all Win32/WinRT bindings                  | already used (`windows` 0.62); unify on `windows-sys` 0.61 |
| coreutils                                       | 5.4k, 10-22        | Microsoft packaging of uutils for Windows | replaces MSYS2 coreutils in `tools.toml`                   |
| sudo                                            | 5.9k, 11-04        | Windows sudo                              | `ay up` tool; reference for elevation in `ay`              |
| edit                                            | 14.8k, 11-07       | terminal editor, small and fast           | `ay up` tool; TUI patterns for `ay`                        |
| windows-drivers-rs, Windows-rust-driver-samples | 1.9k, 11-10        | WDK drivers in Rust (NT kernel layer)     | fork; replaces C drivers in `crates/ring3-agent` work      |
| litebox                                         | 3.3k, 11-12        | security library OS, kernel and user mode | fork; kernel-layer research next to Asterinas              |
| openvmm (OpenHCL)                               | 2.0k, 11-12        | VMM and paravisor                         | fork; candidate VM base for Wayland/WSL replacement        |
| hyperlight, hyperlight-wasm, hyperlight-js      | 4.8k, 11-12        | embedded micro-VM sandboxes               | fork; sandbox for untrusted code in r2b and ai-os          |
| nvx, mxc                                        | 0.8k / 3.1k, 11-12 | micro-VM and policy isolation             | evaluate after hyperlight                                  |
| wassette                                        | 1.0k, 11-03        | Wasm components exposed over MCP          | evaluate for ai-os                                         |
| tgrep                                           | 3.5k, 11-04        | trigram-indexed grep server               | compare with `ay graph`; adopt if faster on `third_party/` |
| tui-test                                        | 0.3k, 11-10        | record and test TUI/CLI sessions          | test harness for `ay`                                      |
| python-environment-tools                        | 0.2k, 11-09        | fast Python env discovery                 | feeds `ay sys` toolchains                                  |
| rust_win_etw                                    | 0.1k, 11-11        | ETW logging                               | tracing backend for `ay` on Windows                        |
| dynwinrt                                        | 0.1k, 11-01        | dynamic WinRT calls                       | Bun FFI to WinRT without codegen                           |
| pdb-rs                                          | 0.1k, 10-30        | PDB parsing                               | r2b (`apps/r2b`)                                           |
| elfcore, avml                                   | 0.1k / 1.1k        | process and memory dumps                  | r2b                                                        |
| rust-symcrypt                                   | 0.1k, 10-28        | SymCrypt wrappers                         | TLS layer alternative to aws-lc-rs on Windows              |
| webui                                           | 0.1k, 11-12        | SSR without JS on the server              | already in `third_party/webui`                             |
| rust-guidelines, RustTraining                   | 0.2k / 15k         | style and training                        | referenced by docs/ECOSYSTEM_CHOICES.md                    |
| azure-sdk-for-rust, mssql-rs, service-fabric-rs | -                  | Azure only                                | not needed                                                 |

Cleanup: `third_party/n2b/vendor/microsoft/{rust,typescript}` (800 MiB, no remote) and
`node-api-dotnet` go with the n2b purge (apps/l2l/PLAN.md).
