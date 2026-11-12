import type { BenchmarkRecord, ContestantMetric } from "../types.ts";
import { Database } from "bun:sqlite";

export function benchmarkCategoryE(): BenchmarkRecord[] {
  const records: BenchmarkRecord[] = [];

  // 1. Compression Benchmark (zstd vs gzip vs deflate on 2MB payload)
  {
    const samplePayload = Buffer.from(
      JSON.stringify({
        architecture: "6-Layer Sovereign Stack",
        layers: ["POSIX", "Unix", "Linux", "GNU", "Chromium", "Bun"],
        components: Array.from({ length: 500 }, (_, i) => ({
          id: i,
          token: `kColorRefPrimary${i % 100}`,
          hex: `#${(i * 1234567).toString(16).slice(0, 6).padStart(6, "0")}`,
          metadata:
            "Chromium Views Material 3 Dynamic Mixer & Bun Full Rust Engine",
        })),
      }).repeat(25),
    );
    const dataSizeMB = samplePayload.length / (1024 * 1024);
    const iterations = 10;

    // Zstandard (Bun.zstdCompressSync)
    const zstdStart = performance.now();
    let zstdSize = 0;
    for (let i = 0; i < iterations; i++) {
      const out = Bun.zstdCompressSync(samplePayload);
      zstdSize = out.length;
    }
    const zstdDuration = (performance.now() - zstdStart) / iterations;
    const zstdThroughput = Number(
      (dataSizeMB / (zstdDuration / 1000)).toFixed(1),
    );

    // Deflate (Bun.deflateSync)
    const deflateStart = performance.now();
    let deflateSize = 0;
    for (let i = 0; i < iterations; i++) {
      const out = Bun.deflateSync(samplePayload);
      deflateSize = out.length;
    }
    const deflateDuration = (performance.now() - deflateStart) / iterations;
    const deflateThroughput = Number(
      (dataSizeMB / (deflateDuration / 1000)).toFixed(1),
    );

    // Gzip (Bun.gzipSync)
    const gzipStart = performance.now();
    let gzipSize = 0;
    for (let i = 0; i < iterations; i++) {
      const out = Bun.gzipSync(samplePayload);
      gzipSize = out.length;
    }
    const gzipDuration = (performance.now() - gzipStart) / iterations;
    const gzipThroughput = Number(
      (dataSizeMB / (gzipDuration / 1000)).toFixed(1),
    );

    const contestants: ContestantMetric[] = [
      {
        name: "Bun.zstdCompressSync (Facebook Zstandard)",
        throughputMBs: zstdThroughput,
        rawDurationMs: zstdDuration,
        details: {
          compressedSize: zstdSize,
          ratio: (samplePayload.length / zstdSize).toFixed(1),
        },
      },
      {
        name: "Bun.deflateSync (Raw Deflate)",
        throughputMBs: deflateThroughput,
        rawDurationMs: deflateDuration,
        details: {
          compressedSize: deflateSize,
          ratio: (samplePayload.length / deflateSize).toFixed(1),
        },
      },
      {
        name: "Bun.gzipSync (RFC 1952 Gzip)",
        throughputMBs: gzipThroughput,
        rawDurationMs: gzipDuration,
        details: {
          compressedSize: gzipSize,
          ratio: (samplePayload.length / gzipSize).toFixed(1),
        },
      },
    ];

    contestants.sort((a, b) => b.throughputMBs! - a.throughputMBs!);
    const winner = contestants[0];
    const runnerUp = contestants[1];
    const speedupFactor = Number(
      (winner.throughputMBs! / runnerUp.throughputMBs!).toFixed(2),
    );

    records.push({
      id: "compression_throughput",
      category: "E_COMPRESSION_DB",
      title: "In-Process Compression Throughput (2MB Multi-Module Payload)",
      contestants,
      winner: winner.name,
      runnerUp: runnerUp.name,
      speedupFactor,
      primaryMetric: `${winner.throughputMBs} MB/s`,
      winnerLayer: 6, // Bun Rust / Native compression
      summary: `Compression pipeline: ${winner.name} achieved ${winner.throughputMBs} MB/s (${speedupFactor}x over ${runnerUp.name}).`,
    });
  }

  // 2. High-Performance Hashing (wyhash vs crc32 vs blake2b vs sha256)
  {
    const hashData = Buffer.from(
      "sovereign_depot_chromium_bun_hash_test_vector_payload_".repeat(200),
    ); // ~10KB
    const iterations = 50_000;

    // wyhash
    const wyStart = performance.now();
    for (let i = 0; i < iterations; i++) {
      Bun.hash.wyhash(hashData);
    }
    const wyDuration = performance.now() - wyStart;
    const wyOps = (iterations / wyDuration) * 1000;

    // crc32
    const crcStart = performance.now();
    for (let i = 0; i < iterations; i++) {
      Bun.hash.crc32(hashData);
    }
    const crcDuration = performance.now() - crcStart;
    const crcOps = (iterations / crcDuration) * 1000;

    // blake2b256
    const blakeStart = performance.now();
    for (let i = 0; i < iterations; i++) {
      const h = new Bun.CryptoHasher("blake2b256");
      h.update(hashData);
      h.digest();
    }
    const blakeDuration = performance.now() - blakeStart;
    const blakeOps = (iterations / blakeDuration) * 1000;

    // sha256
    const shaStart = performance.now();
    for (let i = 0; i < iterations; i++) {
      const h = new Bun.CryptoHasher("sha256");
      h.update(hashData);
      h.digest();
    }
    const shaDuration = performance.now() - shaStart;
    const shaOps = (iterations / shaDuration) * 1000;

    const contestants: ContestantMetric[] = [
      {
        name: "Bun.hash.wyhash (Non-crypto SIMD Hash)",
        opsPerSec: Math.round(wyOps),
        rawDurationMs: wyDuration,
      },
      {
        name: "Bun.hash.crc32 (Hardware CRC32)",
        opsPerSec: Math.round(crcOps),
        rawDurationMs: crcDuration,
      },
      {
        name: "Bun.CryptoHasher('blake2b256')",
        opsPerSec: Math.round(blakeOps),
        rawDurationMs: blakeDuration,
      },
      {
        name: "Bun.CryptoHasher('sha256')",
        opsPerSec: Math.round(shaOps),
        rawDurationMs: shaDuration,
      },
    ];

    contestants.sort((a, b) => b.opsPerSec! - a.opsPerSec!);
    const winner = contestants[0];
    const runnerUp = contestants[1];
    const speedupFactor = Number(
      (winner.opsPerSec! / runnerUp.opsPerSec!).toFixed(2),
    );

    records.push({
      id: "hashing_throughput",
      category: "E_COMPRESSION_DB",
      title:
        "Hashing Algorithm Performance (wyhash vs crc32 vs blake2b vs sha256)",
      contestants,
      winner: winner.name,
      runnerUp: runnerUp.name,
      speedupFactor,
      primaryMetric: `${Math.round(winner.opsPerSec! / 1000)}k ops/sec`,
      winnerLayer: 6,
      summary: `Hash calculation: ${winner.name} achieved ${Math.round(winner.opsPerSec! / 1000)}k ops/sec (${speedupFactor}x over ${runnerUp.name}).`,
    });
  }

  // 3. SQLite In-Process Prepared Batch Operations (bun:sqlite)
  {
    const db = new Database(":memory:");
    db.run("PRAGMA journal_mode = WAL;");
    db.run("PRAGMA synchronous = NORMAL;");
    db.run(
      "CREATE TABLE webui_components (id INTEGER PRIMARY KEY, name TEXT, token TEXT, size_bytes INT);",
    );
    db.run("CREATE INDEX idx_comp_token ON webui_components(token);");

    const rowCount = 10_000;

    // Batch Insert with Prepared Statement in Transaction
    const insertStmt = db.prepare(
      "INSERT INTO webui_components (name, token, size_bytes) VALUES (?, ?, ?)",
    );
    const insertStart = performance.now();
    db.transaction(() => {
      for (let i = 0; i < rowCount; i++) {
        insertStmt.run(
          `cr-component-${i}`,
          `kColorRefPrimary${i % 50}`,
          1024 + i,
        );
      }
    })();
    const insertDuration = performance.now() - insertStart;
    const insertOps = (rowCount / insertDuration) * 1000;

    // Indexed Select Queries with Prepared Statement
    const selectStmt = db.prepare(
      "SELECT * FROM webui_components WHERE token = ? LIMIT 10",
    );
    const selectStart = performance.now();
    for (let i = 0; i < 5_000; i++) {
      selectStmt.all(`kColorRefPrimary${i % 50}`);
    }
    const selectDuration = performance.now() - selectStart;
    const selectOps = (5_000 / selectDuration) * 1000;

    db.close();

    records.push({
      id: "sqlite_batch_transactions",
      category: "E_COMPRESSION_DB",
      title: "bun:sqlite WAL Mode In-Process Prepared Batch Operations",
      contestants: [
        {
          name: "bun:sqlite Batch Insert (Prepared Statement in Transaction)",
          opsPerSec: Math.round(insertOps),
          rawDurationMs: insertDuration,
          details: { rows: rowCount, durationMs: insertDuration.toFixed(2) },
        },
        {
          name: "bun:sqlite Indexed Select Query (Prepared Statement)",
          opsPerSec: Math.round(selectOps),
          rawDurationMs: selectDuration,
          details: { queries: 5000, durationMs: selectDuration.toFixed(2) },
        },
      ],
      winner: "bun:sqlite Batch Insert (Prepared Statement in Transaction)",
      speedupFactor: 1.0,
      primaryMetric: `${Math.round(insertOps)} inserts/sec`,
      winnerLayer: 6,
      summary: `In-memory SQLite: executed ${rowCount} prepared inserts at ${Math.round(insertOps)} inserts/sec and ${Math.round(selectOps)} queries/sec with zero external C dependencies.`,
    });
  }

  return records;
}
