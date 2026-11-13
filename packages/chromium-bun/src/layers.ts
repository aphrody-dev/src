import type { SovereignLayer, SovereignLayerId } from "./types.ts";

export const SOVEREIGN_LAYERS: Record<SovereignLayerId, SovereignLayer> = {
  1: {
    id: 1,
    name: "POSIX",
    codename: "posix_contract",
    description:
      "Portable Operating System Interface (IEEE 1003.1 standard), file descriptors, standard streams, basic syscall contract.",
    canonicalSource: "IEEE / Open Group POSIX standard",
    roleInStack:
      "Lowest universal userland abstraction contract ensuring portable descriptor, process, and thread semantics across hosts.",
  },
  2: {
    id: 2,
    name: "Unix",
    codename: "unix_philosophy",
    description:
      "Everything is a file descriptor, composable text pipelines, process forks, signal handling, and stream multiplexing.",
    canonicalSource: "Bell Labs Unix / 4.4BSD / Single UNIX Specification",
    roleInStack:
      "Architectural ethos for composability, stream pipes, file abstraction, and modular tool separation.",
  },
  3: {
    id: 3,
    name: "Linux",
    codename: "linux_kernel",
    description:
      "High-performance kernel scheduler, zero-copy splice/sendfile, io_uring, epoll, namespaces, and low-level memory mappings.",
    canonicalSource: "git.kernel.org / third_party/linux (Linux 7.4-rc2)",
    roleInStack:
      "Kernel execution foundation providing high-throughput I/O primitives, driver interfaces, and memory virtualization.",
  },
  4: {
    id: 4,
    name: "GNU",
    codename: "gnu_userland",
    description:
      "Canonical userland utility suites, modernized in high-performance Rust via uutils (coreutils, findutils, diffutils).",
    canonicalSource: "uutils/coreutils (~/.local/bin/coreutils)",
    roleInStack:
      "Standard CLI command suite and shell execution binaries providing pure native memory-safe utilities.",
  },
  5: {
    id: 5,
    name: "Chromium",
    codename: "chromium_native_heavyweight",
    description:
      "Undefeated native C++/SIMD/GPU subsystems: Dawn (WebGPU D3D12/Vulkan), Skia 2D rendering, Blink LayoutNG, V8 Heavy JIT, CC Compositor, Material 3 Color Pipeline, and Siso/GN/Autoninja build engines.",
    canonicalSource:
      "chromium.org / third_party/chromium/src + third_party/depot_tools",
    roleInStack:
      "GPU accelerated rasterization, WebGPU hardware compute, high-complexity typography/rendering, and parallel native build orchestration.",
  },
  6: {
    id: 6,
    name: "Bun",
    codename: "bun_sovereign_runtime",
    description:
      "Modern sovereign JavaScript/TypeScript engine built on JavaScriptCore (WebKit) in Rust. Eliminates Node/NPM/Webpack/Rollup/Terser/Babel/Prettier/Jest bloat with zero external dependencies, native bun check typechecking, bun fmt formatter (286x faster than Prettier), bun build, bun test, and bun:sqlite.",
    canonicalSource: "oven-sh/bun (Bun 1.4.4 full Rust)",
    roleInStack:
      "Universal application runtime, native ultra-fast bundler (Bun.build), typechecker (bun check), formatter (bun fmt), transpiler (Bun.Transpiler), unit test runner (bun test), embedded database (bun:sqlite, Bun.SQL), network server (Bun.serve), and fast shell (Bun.$).",
  },
};

export function getLayer(id: SovereignLayerId): SovereignLayer {
  return SOVEREIGN_LAYERS[id];
}

export function getAllLayers(): SovereignLayer[] {
  return Object.values(SOVEREIGN_LAYERS);
}
