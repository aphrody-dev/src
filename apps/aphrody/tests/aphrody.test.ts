import { describe, expect, it } from "bun:test";
import { existsSync, readFileSync, statSync } from "fs";
import { join } from "path";
import { getSuggestions, POPULAR_SUGGESTIONS } from "../src/data/suggestions";
import { server } from "../server";
import {
  MATERIAL_LIGHT_TOKENS,
  MATERIAL_DARK_TOKENS,
  getMaterialBreakpoint,
  renderMaterialSymbol,
  MATERIAL_SYMBOLS,
} from "../src/design/material-tokens";
import {
  buildStorytoldWasmBinary,
  getStorytoldWasm,
} from "../src/suite/wasm-kernel";
import { UniversalStoreManager } from "../src/store/universal-manager";
import {
  benchmarkZeroCopyVsCopy,
  benchmarkWasmVsJs,
  benchmarkSqliteThroughput,
  pickOptimalStack,
  runBenchmarkSuite,
  CANDIDATE_STACKS,
} from "../src/benchmark/stack-picker";

const ROOT_DIR = join(import.meta.dir, "..");

describe("Aphrody Zero-External-Dependency Architecture", () => {
  it("should have ZERO external dependencies in package.json", () => {
    const pkgPath = join(ROOT_DIR, "package.json");
    const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));

    const deps = Object.keys(pkg.dependencies || {});
    const devDeps = Object.keys(pkg.devDependencies || {});

    expect(deps.length).toBe(0);
    expect(devDeps.length).toBe(0);
    expect(pkg.dependencies).toEqual({});
    expect(pkg.devDependencies).toEqual({});
  });

  it("should NOT have node_modules directory", () => {
    const nodeModulesPath = join(ROOT_DIR, "node_modules");
    expect(existsSync(nodeModulesPath)).toBe(false);
  });

  it("should NOT have bun.lock file", () => {
    const lockPath = join(ROOT_DIR, "bun.lock");
    expect(existsSync(lockPath)).toBe(false);
  });
});

describe("Aphrody build output", () => {
  const dist = join(ROOT_DIR, "dist");

  it("emits the static homepage, boot script, font and compressed copies", () => {
    for (const f of [
      "index.html",
      "en/index.html",
      "boot.js",
      "style.css",
      "atkinson-next.woff2",
      "atkinson-next-OFL.txt",
    ]) {
      expect(existsSync(join(dist, f))).toBe(true);
    }
    expect(existsSync(join(dist, "app.js"))).toBe(false);
    expect(statSync(join(dist, "index.html.gz")).size).toBeLessThan(30 * 1024);
  });

  it("homepage is the holding page generated from docs/ALPHABET.md", () => {
    const html = readFileSync(join(dist, "index.html"), "utf-8");
    expect(html).toContain("<title>Aphrody</title>");
    expect(html).not.toContain('id="root"');
    expect((html.match(/<h1[ >]/g) || []).length).toBe(1);
    for (const h of [
      "<h2>Noyau</h2>",
      "<h2>Paris</h2>",
      "<h2>Métriques publiques</h2>",
      "<h2>Investisseurs et contact</h2>",
    ])
      expect(html).toContain(h);
    for (const href of [
      'href="/search"',
      'href="mailto:contact@aphrody.com"',
      'href="https://aphrody.app/"',
      'href="https://github.com/aphrody-labs/src/tree/main/apps/nt"',
    ])
      expect(html).toContain(href);
    // Public identity is anonymous: no personal name or mailbox, only contact@aphrody.com.
    for (const banned of ["gmail.com", "Gemini", ...(Bun.env.APHRODY_PII_TERMS ?? "").split(",").filter(Boolean)])
      expect(html).not.toContain(banned);
    expect(/\p{Extended_Pictographic}/u.test(html)).toBe(false);
  });

  it("english homepage mirrors the french one", () => {
    const html = readFileSync(join(dist, "en", "index.html"), "utf-8");
    expect(html).toContain('<html lang="en">');
    expect(html).toContain("<h2>Core</h2>");
    expect(html).toContain('href="https://aphrody.com/en"');
  });
});

describe("Google Material Design 3 Parity & Symbols", () => {
  it("should define HCT tonal surface containers lowest..highest in light and dark", () => {
    expect(MATERIAL_LIGHT_TOKENS.surfaceContainerLowest).toBe("#ffffff");
    expect(MATERIAL_LIGHT_TOKENS.surfaceContainerLow).toBe("#f7f2fa");
    expect(MATERIAL_LIGHT_TOKENS.surfaceContainer).toBe("#f3edf7");
    expect(MATERIAL_LIGHT_TOKENS.surfaceContainerHigh).toBe("#ece6f0");
    expect(MATERIAL_LIGHT_TOKENS.surfaceContainerHighest).toBe("#e6e0e9");

    expect(MATERIAL_DARK_TOKENS.surfaceContainerLowest).toBe("#0f0d13");
    expect(MATERIAL_DARK_TOKENS.surfaceContainerHighest).toBe("#36343b");
    expect(MATERIAL_LIGHT_TOKENS.primary).toBe("#6750a4");
  });

  it("should accurately resolve Material 3 adaptive layout breakpoints", () => {
    expect(getMaterialBreakpoint(400)).toBe("compact"); // < 600
    expect(getMaterialBreakpoint(599)).toBe("compact");
    expect(getMaterialBreakpoint(600)).toBe("medium"); // 600..839
    expect(getMaterialBreakpoint(750)).toBe("medium");
    expect(getMaterialBreakpoint(839)).toBe("medium");
    expect(getMaterialBreakpoint(840)).toBe("expanded"); // >= 840
    expect(getMaterialBreakpoint(1440)).toBe("expanded");
  });

  it("should render crisp vector SVG Material Symbols from registry", () => {
    const icons = [
      "search",
      "menu",
      "close",
      "settings",
      "storefront",
      "rocket_launch",
      "tune",
      "speed",
      "code",
    ];
    icons.forEach((icon) => {
      expect(MATERIAL_SYMBOLS[icon]).toBeDefined();
      const svg = renderMaterialSymbol(icon, 24);
      expect(svg).toContain('<svg class="md-symbol"');
      expect(svg).toContain('viewBox="0 0 24 24"');
      expect(svg).toContain('width="24"');
    });
  });
});

describe("Storytold Pure Binary WASM SIMD Kernel", () => {
  it("should compile a valid binary WebAssembly module from byte opcodes", () => {
    const bytes = buildStorytoldWasmBinary();
    expect(bytes instanceof Uint8Array).toBe(true);
    // Magic: \0asm
    expect(bytes[0]).toBe(0x00);
    expect(bytes[1]).toBe(0x61);
    expect(bytes[2]).toBe(0x73);
    expect(bytes[3]).toBe(0x6d);
    // Version 1
    expect(bytes[4]).toBe(0x01);
  });

  it("should execute exported WebAssembly functions correctly", async () => {
    const wasm = await getStorytoldWasm();
    expect(typeof wasm.add).toBe("function");
    expect(typeof wasm.vec4_dot).toBe("function");
    expect(typeof wasm.fast_lerp).toBe("function");
    expect(typeof wasm.compute_orbit).toBe("function");

    expect(wasm.add(15, 27)).toBe(42);
    // vec4_dot: 1*1 + 2*2 + 3*3 + 4*4 = 1 + 4 + 9 + 16 = 30
    expect(wasm.vec4_dot(1, 2, 3, 4, 1, 2, 3, 4)).toBeCloseTo(30, 2);
    // fast_lerp: 10 + (30 - 10) * 0.5 = 20
    expect(wasm.fast_lerp(10, 30, 0.5)).toBeCloseTo(20, 2);
    // compute_orbit: 3.14 * 10 = 31.4
    expect(wasm.compute_orbit(3.14, 10)).toBeCloseTo(31.4, 1);
  });
});

describe("Package catalog", () => {
  it("should search packages across all ecosystems through UniversalStoreManager", async () => {
    const manager = new UniversalStoreManager(":memory:");
    const results = await manager.search("bun", "all");
    expect(results.length).toBeGreaterThan(0);
    const names = results.map((r) => r.name.toLowerCase());
    expect(names.some((n) => n.includes("bun"))).toBe(true);
  });
});

describe("Performance, LTO, AOT & Zero-Copy Stack Benchmark & Picker Engine", () => {
  it("should benchmark Zero-Copy vs Full Copy and measure speedup", () => {
    const res = benchmarkZeroCopyVsCopy(1 * 1024 * 1024);
    expect(res.dataSizeBytes).toBe(1 * 1024 * 1024);
    expect(res.zeroCopyMemoryAllocatedBytes).toBe(0);
    expect(res.copyMemoryAllocatedBytes).toBe(1 * 1024 * 1024);
    expect(res.speedupRatio).toBeGreaterThan(1);
  });

  it("should benchmark WASM SIMD vs JS JIT vector operations", async () => {
    const res = await benchmarkWasmVsJs(20_000);
    expect(res.iterations).toBe(20_000);
    expect(res.wasmNsPerOp).toBeGreaterThan(0);
    expect(res.jsNsPerOp).toBeGreaterThan(0);
  });

  it("should benchmark bun:sqlite prepared statement throughput", async () => {
    const res = await benchmarkSqliteThroughput(1000);
    expect(res.recordsCount).toBe(1000);
    expect(res.opsPerSec).toBeGreaterThan(10_000);
  });

  it("should evaluate and pick optimal compiler stack for different workloads", () => {
    // 1. GPU Compute
    const gpuRec = pickOptimalStack({
      name: "raymarch-shader",
      workload: "bare-metal-gpu",
    });
    expect(gpuRec.recommendedStack.id).toBe("cpp-msvc-cuda");
    expect(
      gpuRec.optimalFlags.some(
        (f) => f.includes("CUDA") || f.includes("sm_89"),
      ),
    ).toBe(true);

    // 2. Portable Web / Sandbox
    const webRec = pickOptimalStack({
      name: "browser-app",
      workload: "portable-web",
    });
    expect(webRec.recommendedStack.id).toBe("wasm-simd-webgpu");

    // 3. Edge HTTP / Concurrency
    const httpRec = pickOptimalStack({
      name: "api-service",
      workload: "edge-http",
    });
    expect(httpRec.recommendedStack.id).toBe("bun-native-ffi");

    // 4. CLI / Filesystem Scanner
    const cliRec = pickOptimalStack({
      name: "tree-scanner",
      workload: "cli-scanner",
    });
    expect(cliRec.recommendedStack.id).toBe("rust-lto-fat");
    expect(cliRec.optimalFlags).toContain("-C lto=fat");
  });

  it("should run full benchmark suite and produce complete system report", async () => {
    const report = await runBenchmarkSuite();
    expect(report.hardware.cpu.length).toBeGreaterThan(0);
    expect(typeof report.hardware.gpu).toBe("string");
    expect(report.zeroCopy.speedupRatio).toBeGreaterThan(1);
    expect(report.candidateStacks.length).toBe(CANDIDATE_STACKS.length);
  });
});

describe("Aphrody HTTP Server & Endpoints", () => {
  it("should serve index.html at GET / with 200 OK and security headers", async () => {
    const req = new Request("http://localhost:3000/");
    const res = await server.fetch(req);
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/html");
    expect(res.headers.get("x-content-type-options")).toBe("nosniff");
    expect(res.headers.get("x-frame-options")).toBe("SAMEORIGIN");
    expect(res.headers.get("content-security-policy")).toBeDefined();

    const text = await res.text();
    expect(text).toContain("Aphrody développe des logiciels web");
    expect(res.headers.get("link")).toContain("atkinson-next.woff2");
  });

  it("should serve autocomplete JSON at GET /api/complete?q=aphrody", async () => {
    const req = new Request("http://localhost:3000/api/complete?q=aphrody");
    const res = await server.fetch(req);
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("application/json");

    const data = await res.json();
    expect(data.query).toBe("aphrody");
    expect(Array.isArray(data.suggestions)).toBe(true);
    expect(data.suggestions.length).toBeGreaterThan(0);
  });

  it("should serve Store search results at GET /api/store/search?q=bun", async () => {
    const req = new Request("http://localhost:3000/api/store/search?q=bun");
    const res = await server.fetch(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.query).toBe("bun");
    expect(Array.isArray(data.packages)).toBe(true);
    expect(data.packages.length).toBeGreaterThan(0);
  });

  it("should run and return benchmark report at GET /api/bench", async () => {
    const req = new Request("http://localhost:3000/api/bench");
    const res = await server.fetch(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.hardware).toBeDefined();
    expect(data.zeroCopy).toBeDefined();
    expect(data.sqlite).toBeDefined();
  });

  it("removed endpoints are gone: suite APIs 404, former AI pages 410", async () => {
    for (const p of [
      "/api/gemini/search?q=x",
      "/api/studio/daemons",
      "/api/search?q=x",
      "/api/workspace/mail",
      "/api/store/generations",
    ]) {
      const res = await server.fetch(new Request("http://localhost:3000" + p));
      expect(res.status).toBe(404);
    }
    for (const p of ["/search/ai-gemini", "/en/search/ai-gemini"]) {
      const res = await server.fetch(new Request("http://localhost:3000" + p));
      expect(res.status).toBe(410);
    }
    // No route handles it any more; the static fallback answers 405 to a POST.
    const install = await server.fetch(
      new Request("http://localhost:3000/api/store/install", {
        method: "POST",
        body: "{}",
      }),
    );
    expect([404, 405]).toContain(install.status);
  });

  it("should serve health check at GET /healthz and /ok", async () => {
    const req = new Request("http://localhost:3000/ok");
    const res = await server.fetch(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.status).toBe("healthy");
  });

  it("should serve short 3-7 char routes (/api/q, /api/pm, /api/bnc)", async () => {
    const qRes = await server.fetch(
      new Request("http://localhost:3000/api/q?q=bun"),
    );
    expect(qRes.status).toBe(200);
    const qData = await qRes.json();
    expect(qData.suggestions.length).toBeGreaterThan(0);

    const pmRes = await server.fetch(
      new Request("http://localhost:3000/api/pm?q=bun"),
    );
    expect(pmRes.status).toBe(200);
    const pmData = await pmRes.json();
    expect(pmData.packages.length).toBeGreaterThan(0);

    const bncRes = await server.fetch(
      new Request("http://localhost:3000/api/bnc"),
    );
    expect(bncRes.status).toBe(200);
  });

  it("should serve static crawler files (/robots.txt, /sitemap.xml, /llms.txt)", async () => {
    const rRes = await server.fetch(
      new Request("http://localhost:3000/robots.txt"),
    );
    expect(rRes.status).toBe(200);
    expect(await rRes.text()).toContain("User-agent: *");

    const sRes = await server.fetch(
      new Request("http://localhost:3000/sitemap.xml"),
    );
    expect(sRes.status).toBe(200);
    expect(await sRes.text()).toContain("<sitemapindex");

    const lRes = await server.fetch(
      new Request("http://localhost:3000/llms.txt"),
    );
    expect(lRes.status).toBe(200);
    expect(await lRes.text()).toContain("# Aphrody");
  });
});

describe("Hosting manifests", () => {
  it("ships no hand-written host manifest besides wrangler.toml (others come from scripts/deploy-target.ts)", () => {
    for (const f of [
      "vercel.json",
      "netlify.toml",
      "fly.toml",
      "app.yaml",
      "firebase.json",
    ])
      expect(existsSync(join(ROOT_DIR, f))).toBe(false);
  });
});
