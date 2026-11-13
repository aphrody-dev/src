# Aphrody Dev

Systems engineer, Rust and Bun. Public identity: GitHub [aphrody-dev](https://github.com/aphrody-dev),
organisation [aphrody-labs](https://github.com/aphrody-labs). Contact: contact@aphrody.com.

Every line below can be checked in the linked public repositories. Lines marked `TODO(owner)`
are not verifiable from the repositories and stay empty until the owner fills them; no civil
identity is published here.

## Summary

Maintainer of a single Rust and Bun monorepo, [aphrody-labs/src](https://github.com/aphrody-labs/src),
that holds a multicall developer CLI, runtimes, desktop shells, an agent stack and the
infrastructure that deploys them. Works upstream first: changes that belong to Bun or to open
agent protocols are sent to those projects as pull requests.

## Selected work (aphrody-labs/src)

| Project | What it is | Path |
| :-- | :-- | :-- |
| ay | One multicall CLI for the monorepo: architecture gate, locks, VCS tooling, Chromium tools, toolchain install, benchmarks | `crates/ay` |
| nt | A model of the machine's Windows NT, rendered entirely by the GPU on the Microsoft stack | `apps/nt` |
| ai-os | Agent core, model bridge discovered at run time, relay (MCP, A2A, ACP), gateway and TUI in one Bun package with no npm dependency | `packages/ai-os` |
| aphrody.app | Rust WebGPU/WGSL tiling desktop shell with CRDT state, OPFS storage and WebMCP tools | `apps/aphrody-app` |
| unixwin | Native Windows bash in Rust, with coreutils, an MSVC git and a package manager | `apps/unixwin` |
| Brand pipeline | `ay brand build`: outlined SVG logos and icons from the shared Material 3 tokens, ICO/PNG, social cards and ANSI banners rendered with resvg/usvg/tiny-skia | `crates/aphrody-brand` |

Monorepo languages, GitHub linguist bytes on 2026-11-13: Rust 81.1 %, Python 8.0 %, TypeScript 6.4 %,
C 1.6 %, JavaScript 1.4 % ([source](https://github.com/aphrody-labs/src)).

## Upstream contributions

Open pull requests as of 2026-11-13 (none merged yet):

- oven-sh/bun [#48787](https://github.com/oven-sh/bun/pull/48787): build, pass the `.bind.ts` schema list to the codegen scripts in a file.
- oven-sh/bun [#48786](https://github.com/oven-sh/bun/pull/48786): docs, sizes `Bun.gzipSync` and `Bun.deflateSync` give for the utils examples.
- oven-sh/bun [#48784](https://github.com/oven-sh/bun/pull/48784): build, xwin 0.10.0, which reads the current Visual Studio manifest.
- agentclientprotocol/agent-client-protocol [#2804](https://github.com/agentclientprotocol/agent-client-protocol/pull/2804): docs, `availableCommands` marked required.
- a2aproject/A2A [#2452](https://github.com/a2aproject/A2A/pull/2452): docs, required `messageId` in `Message` examples.

## Technical areas

- Rust 2024 on a pinned nightly with cross-language LTO against the shared LLVM toolchain.
- Bun as the only JavaScript runtime and toolchain (scripts, tests, bundling, FFI).
- Windows platform: windows-rs, Direct3D 12, WinUI 3; Linux fleet with systemd and nginx.
- Material 3 design systems: HCT dynamic color, tokens, accessible contrast checked in tests.

## Experience

- TODO(owner): roles and dates you choose to publish under the aphrody-dev identity.

## Education

- TODO(owner): optional; omit to stay anonymous.

## Links

- GitHub: https://github.com/aphrody-dev, https://github.com/aphrody-labs
- Sign in with Aphrody: https://auth.aphrody.com
- Discord: TODO(owner)
- X: TODO(owner)
