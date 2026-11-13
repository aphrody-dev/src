import type { DependencyAudit } from "../types.ts";

export const CHROMIUM_DEPENDENCY_AUDIT: DependencyAudit[] = [
  {
    name: "node-and-webui-toolchain",
    relPath: "third_party/node",
    verdict: "PURGE_FOR_BUN",
    rationale:
      "Chromium bundles an 89.9 MB Node.exe binary and uses slow Python scripts wrapping Rollup, Terser, and tsc to bundle WebUI. Bun natively provides Bun.build and Bun.Transpiler written in Rust, delivering 20-50x faster bundling with zero npm dependencies.",
    replacementOrNativePath:
      "Bun.build({ entrypoints, minify: true, sourcemap: 'external' }) + new Bun.Transpiler()",
    layer: 6,
  },
  {
    name: "typescript-tsc-and-prettier",
    relPath: "third_party/node/node_modules (tsc, prettier, eslint)",
    verdict: "PURGE_FOR_BUN",
    rationale:
      "Slow Node-based TypeScript compilation (tsc) and formatting (prettier) replaced by Bun's native Rust-powered `bun check` and `bun fmt` (286x faster than Prettier).",
    replacementOrNativePath: "bun check + bun fmt",
    layer: 6,
  },
  {
    name: "node-test-runners",
    relPath: "third_party/node/node_modules (mocha, karma, jest)",
    verdict: "PURGE_FOR_BUN",
    rationale:
      "Node-based test suites incur high process startup time and large node_modules footprints. Replaced by Bun's built-in test runner with instant startup and Jest-compatible API.",
    replacementOrNativePath: "bun test",
    layer: 6,
  },
  {
    name: "sqlite-tooling",
    relPath: "third_party/sqlite",
    verdict: "PURGE_FOR_BUN",
    rationale:
      "External Python/Node CLI scripting for SQLite database queries and migrations is replaced by Bun's zero-overhead in-process bun:sqlite / Bun.SQL engine with compiled WAL, prepared statements, and custom functions.",
    replacementOrNativePath: "import { Database } from 'bun:sqlite'; Bun.SQL",
    layer: 6,
  },
  {
    name: "compression-scripts",
    relPath:
      "third_party/zlib, third_party/brotli, third_party/zstd (build-time tooling)",
    verdict: "PURGE_FOR_BUN",
    rationale:
      "Build-time compression in Chromium invokes Python subprocesses for brotli/gzip/zstd. Bun provides synchronous multi-GB/s native compression methods in-process.",
    replacementOrNativePath:
      "Bun.zstdCompressSync(), Bun.gzipSync(), Bun.deflateSync()",
    layer: 6,
  },
  {
    name: "hashing-and-checksums",
    relPath: "tools/build / third_party hash scripts",
    verdict: "PURGE_FOR_BUN",
    rationale:
      "Python/Node scripts calculating file manifests and cache keys replaced by Bun's SIMD-accelerated wyhash, crc32, and native CryptoHasher.",
    replacementOrNativePath:
      "Bun.hash.wyhash(), Bun.hash.crc32(), new Bun.CryptoHasher('sha256')",
    layer: 6,
  },
  {
    name: "file-globbing",
    relPath: "ui/webui/resources/tools (glob, globby)",
    verdict: "PURGE_FOR_BUN",
    rationale:
      "Path discovery and resource inclusion across large WebUI trees replaced by Bun's native Rust-implemented glob engine with extglob and brace expansion support.",
    replacementOrNativePath: "new Bun.Glob('**/*').scanSync()",
    layer: 6,
  },
  {
    name: "semver-resolution",
    relPath: "third_party/node/node_modules/semver",
    verdict: "PURGE_FOR_BUN",
    rationale:
      "Dependency range matching replaced by Bun's zero-allocation native semver parser.",
    replacementOrNativePath: "Bun.semver.satisfies(), Bun.semver.order()",
    layer: 6,
  },
  {
    name: "ansi-terminal-styling",
    relPath: "third_party/node/node_modules/chalk",
    verdict: "PURGE_FOR_BUN",
    rationale:
      "CLI output colorization in tooling scripts replaced by Bun's native color helper.",
    replacementOrNativePath: "Bun.color('hex', 'ansi')",
    layer: 6,
  },
  {
    name: "test-http-mock-servers",
    relPath: "tools/python (SimpleHTTPServer / WebUI test servers)",
    verdict: "PURGE_FOR_BUN",
    rationale:
      "Chromium invokes Python test servers that are slow to spawn and single-threaded. Bun.serve provides a 150k+ req/sec HTTP and WebSocket engine out of the box.",
    replacementOrNativePath:
      "Bun.serve({ fetch(req) { ... }, websocket: { ... } })",
    layer: 6,
  },
  {
    name: "subprocess-shell-scripts",
    relPath: "tools/run_tests.py, build/*.sh, build/*.bat wrappers",
    verdict: "PURGE_FOR_BUN",
    rationale:
      "Disjoint shell and Python script orchestration replaced by Bun's cross-platform native tagged-template shell DSL.",
    replacementOrNativePath: "import { $ } from 'bun'",
    layer: 6,
  },
  {
    name: "dawn-webgpu",
    relPath: "third_party/dawn",
    verdict: "KEEP_CHROMIUM_NATIVE",
    rationale:
      "Google Dawn is the canonical cross-platform C++ WebGPU implementation targeting D3D12, Vulkan, and Metal. Native RTX 4070 Ada Lovelace sm_89 execution.",
    replacementOrNativePath:
      "Native WGPU C++ / Direct FFI Bridge (third_party/chromium/src/third_party/dawn)",
    layer: 5,
  },
  {
    name: "skia-2d-graphics",
    relPath: "third_party/skia",
    verdict: "KEEP_CHROMIUM_NATIVE",
    rationale:
      "Undefeated 2D vector graphics rasterizer with GPU acceleration, SkParagraph, and SkUnicode font layout.",
    replacementOrNativePath:
      "Native Skia C++ Library (third_party/chromium/src/third_party/skia)",
    layer: 5,
  },
  {
    name: "blink-engine",
    relPath: "third_party/blink",
    verdict: "KEEP_CHROMIUM_NATIVE",
    rationale:
      "LayoutNG, CSS compute, DOM hierarchy, and web standards rendering pipeline.",
    replacementOrNativePath:
      "Blink LayoutNG / Platform (third_party/chromium/src/third_party/blink)",
    layer: 5,
  },
  {
    name: "v8-heavy-jit",
    relPath: "v8",
    verdict: "KEEP_CHROMIUM_NATIVE",
    rationale:
      "V8 multi-tier JIT (TurboFan, Maglev, Liftoff WASM) optimized for long-running compute and deep browser engine integration.",
    replacementOrNativePath: "V8 Engine C++ Core (third_party/chromium/src/v8)",
    layer: 5,
  },
  {
    name: "chromium-compositor-cc",
    relPath: "cc",
    verdict: "KEEP_CHROMIUM_NATIVE",
    rationale:
      "Tile management, layer tree synchronization, and hardware-accelerated direct composition scheduler.",
    replacementOrNativePath: "CC Compositor Tree (third_party/chromium/src/cc)",
    layer: 5,
  },
  {
    name: "ui-views-and-color",
    relPath: "ui/views, ui/color",
    verdict: "KEEP_CHROMIUM_NATIVE",
    rationale:
      "Chromium native desktop UI hierarchy and Material 3 ColorPipeline (sys/ref tokens, dynamic tonal palettes).",
    replacementOrNativePath:
      "Native Views & ColorProvider (third_party/chromium/src/ui/color, third_party/chromium/src/ui/views)",
    layer: 5,
  },
  {
    name: "siso-gn-autoninja",
    relPath: "build/ + third_party/depot_tools",
    verdict: "KEEP_CHROMIUM_NATIVE",
    rationale:
      "Chromium next-generation build orchestration: Siso (Go/Rust Ninja replacement), GN metabuild, and autoninja.",
    replacementOrNativePath:
      "Siso / GN Toolchain (third_party/depot_tools/siso.bat, third_party/chromium/src/buildtools/win/gn.exe)",
    layer: 5,
  },
  {
    name: "google-highway-simd",
    relPath: "third_party/highway",
    verdict: "KEEP_CHROMIUM_NATIVE",
    rationale:
      "Performance-portable C++ SIMD library targeting AVX2 on Intel Core i7-13700F with compile-time zero overhead.",
    replacementOrNativePath:
      "Native Highway SIMD (third_party/chromium/src/third_party/highway)",
    layer: 5,
  },
  {
    name: "dav1d-av1-decoder",
    relPath: "third_party/dav1d",
    verdict: "KEEP_CHROMIUM_NATIVE",
    rationale: "Best-in-class hand-crafted assembly AV1 video decoder.",
    replacementOrNativePath:
      "Native dav1d AV1 Decoder (third_party/chromium/src/third_party/dav1d)",
    layer: 5,
  },
  {
    name: "harfbuzz-text-shaping",
    relPath: "third_party/harfbuzz-ng",
    verdict: "KEEP_CHROMIUM_NATIVE",
    rationale:
      "Canonical OpenType text shaping engine required for world-class typography and complex script rendering.",
    replacementOrNativePath:
      "Native HarfBuzz (third_party/chromium/src/third_party/harfbuzz)",
    layer: 5,
  },
  {
    name: "boringssl-cryptography",
    relPath: "third_party/boringssl",
    verdict: "KEEP_CHROMIUM_NATIVE",
    rationale:
      "Google's hardened crypto library with assembly implementations of TLS 1.3, AES-GCM, and Post-Quantum cryptography.",
    replacementOrNativePath:
      "Native BoringSSL (third_party/chromium/src/third_party/boringssl)",
    layer: 5,
  },
];
