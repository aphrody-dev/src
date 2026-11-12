import { describe, expect, it } from "bun:test";
import {
  runRichards,
  runNavierStokes,
  runRayTrace,
  runJsonParseSerialize,
  getWasmModule,
} from "../src/benchmarks/category-a-engines.ts";
import { benchmarkCategoryB } from "../src/benchmarks/category-b-os-posix.ts";
import { benchmarkCategoryC } from "../src/benchmarks/category-c-shells.ts";
import { benchmarkCategoryD } from "../src/benchmarks/category-d-build.ts";
import { benchmarkCategoryE } from "../src/benchmarks/category-e-compression-db.ts";

describe("Empirical Public Benchmark Proof-of-Concept Suite", () => {
  describe("Category A: Compute & Engines", () => {
    it("should execute Richards OS simulation kernel", () => {
      const res = runRichards(5);
      expect(typeof res).toBe("number");
      expect(res).toBeGreaterThan(0);
    });

    it("should execute NavierStokes 2D fluid simulation", () => {
      const res = runNavierStokes(16, 5);
      expect(typeof res).toBe("number");
      expect(res).toBeGreaterThan(0);
    });

    it("should execute RayTrace 3D sphere ray tracer", () => {
      const hits = runRayTrace(100);
      expect(typeof hits).toBe("number");
      expect(hits).toBeGreaterThan(0);
    });

    it("should execute JSON parse & serialize kernel", () => {
      const chars = runJsonParseSerialize(50);
      expect(typeof chars).toBe("number");
      expect(chars).toBeGreaterThan(0);
    });

    it("should execute compiled WebAssembly compute kernel", () => {
      const { compute } = getWasmModule();
      const val = compute(100);
      expect(typeof val).toBe("number");
    });
  });

  describe("Category B: OS & POSIX Micro-benchmarks", () => {
    it("should run filesystem, zero-copy, and pipe benchmarks", async () => {
      const records = await benchmarkCategoryB();
      expect(records.length).toBeGreaterThanOrEqual(4);

      const zeroCopy = records.find((r) => r.id === "zero_copy_memory");
      expect(zeroCopy).toBeDefined();
      expect(zeroCopy?.winnerLayer).toBe(3); // Linux memory model

      const pipe = records.find((r) => r.id === "pipe_stream_throughput");
      expect(pipe).toBeDefined();
      expect(pipe?.winnerLayer).toBe(2); // Unix streams
    });
  });

  describe("Category C: Shell Startup Hyperfine Benchmark", () => {
    it("should run shell startup comparison with valid winner", async () => {
      const records = await benchmarkCategoryC();
      expect(records.length).toBe(1);
      const shellRecord = records[0];
      expect(shellRecord.contestants.length).toBeGreaterThanOrEqual(4);
      expect(shellRecord.winner).toBeDefined();
      expect(shellRecord.speedupFactor).toBeGreaterThanOrEqual(1.0);
    }, 15_000);
  });

  describe("Category D: Build & Bundler Toolchain Benchmark", () => {
    it("should bundle Chromium WebUI components and transpile TypeScript", async () => {
      const records = await benchmarkCategoryD();
      expect(records.length).toBe(3);

      const bundler = records.find((r) => r.id === "webui_bundler_poc");
      expect(bundler).toBeDefined();
      expect(bundler?.winnerLayer).toBe(6);

      const transpiler = records.find((r) => r.id === "transpiler_throughput");
      expect(transpiler).toBeDefined();
      expect(transpiler?.winnerLayer).toBe(6);
    });
  });

  describe("Category E: Compression, SQLite & Hashing Benchmark", () => {
    it("should execute zstd compression, wyhash/crc32, and bun:sqlite transactions", () => {
      const records = benchmarkCategoryE();
      expect(records.length).toBe(3);

      const compression = records.find(
        (r) => r.id === "compression_throughput",
      );
      expect(compression).toBeDefined();
      expect(compression?.winner).toContain("zstd");

      const hashing = records.find((r) => r.id === "hashing_throughput");
      expect(hashing).toBeDefined();

      const sqlite = records.find((r) => r.id === "sqlite_batch_transactions");
      expect(sqlite).toBeDefined();
      expect(sqlite?.winner).toContain("sqlite");
    });
  });
});
