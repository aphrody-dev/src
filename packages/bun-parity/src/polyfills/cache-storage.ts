/**
 * W3C Cache API implementation for Bun backed natively by zero-copy bun:sqlite
 * Spec: https://w3c.github.io/ServiceWorker/#cache-objects
 */

import { Database } from "bun:sqlite";

export interface CacheQueryOptions {
  ignoreSearch?: boolean;
  ignoreMethod?: boolean;
  ignoreVary?: boolean;
}

export interface MultiCacheQueryOptions extends CacheQueryOptions {
  cacheName?: string;
}

function normalizeRequestUrl(input: RequestInfo | URL): {
  url: string;
  method: string;
} {
  if (typeof input === "string") {
    return { url: new URL(input, "http://localhost").href, method: "GET" };
  }
  if (input instanceof URL) {
    return { url: input.href, method: "GET" };
  }
  if (input instanceof Request) {
    return { url: input.url, method: input.method.toUpperCase() };
  }
  throw new TypeError("Invalid request argument");
}

function stripSearch(urlStr: string): string {
  try {
    const u = new URL(urlStr);
    u.search = "";
    return u.href;
  } catch {
    return urlStr;
  }
}

export class Cache {
  readonly name: string;
  private readonly _db: Database;
  private readonly _cacheId: number;

  constructor(name: string, db: Database, cacheId: number) {
    this.name = name;
    this._db = db;
    this._cacheId = cacheId;
  }

  async put(request: RequestInfo | URL, response: Response): Promise<void> {
    const { url, method } = normalizeRequestUrl(request);
    if (method !== "GET") {
      throw new TypeError("Cache.put only supports GET requests");
    }
    if (response.status === 206) {
      throw new TypeError("Cannot cache partial 206 responses");
    }

    const headersObj: Record<string, string> = {};
    response.headers.forEach((v, k) => {
      headersObj[k.toLowerCase()] = v;
    });

    const bodyBuffer = await response.clone().arrayBuffer();
    const bodyUint8 = new Uint8Array(bodyBuffer);

    const now = Date.now();

    this._db.transaction(() => {
      // Remove any existing entry for this exact url
      this._db
        .prepare("DELETE FROM cache_entries WHERE cache_id = ? AND url = ?")
        .run(this._cacheId, url);

      // Insert new cache entry
      this._db
        .prepare(
          `INSERT INTO cache_entries
           (cache_id, url, method, status, status_text, headers_json, body, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .run(
          this._cacheId,
          url,
          method,
          response.status,
          response.statusText,
          JSON.stringify(headersObj),
          bodyUint8,
          now,
        );
    })();
  }

  async add(request: RequestInfo | URL): Promise<void> {
    const res = await fetch(request as any);
    if (!res.ok) {
      throw new TypeError("Request failed with status " + res.status);
    }
    await this.put(request, res);
  }

  async addAll(requests: (RequestInfo | URL)[]): Promise<void> {
    const responses = await Promise.all(
      requests.map((r) =>
        fetch(r as any).then((res) => {
          if (!res.ok) {
            throw new TypeError("Request failed with status " + res.status);
          }
          return res;
        }),
      ),
    );

    for (let i = 0; i < requests.length; i++) {
      await this.put(requests[i], responses[i]);
    }
  }

  async match(
    request: RequestInfo | URL,
    options?: CacheQueryOptions,
  ): Promise<Response | undefined> {
    const matches = await this.matchAll(request, options);
    return matches[0];
  }

  async matchAll(
    request?: RequestInfo | URL,
    options?: CacheQueryOptions,
  ): Promise<Response[]> {
    let entries: any[] = [];

    if (!request) {
      entries = this._db
        .prepare(
          "SELECT * FROM cache_entries WHERE cache_id = ? ORDER BY id ASC",
        )
        .all(this._cacheId) as any[];
    } else {
      const { url } = normalizeRequestUrl(request);
      if (options?.ignoreSearch) {
        const targetClean = stripSearch(url);
        const allEntries = this._db
          .prepare("SELECT * FROM cache_entries WHERE cache_id = ?")
          .all(this._cacheId) as any[];
        entries = allEntries.filter((e) => stripSearch(e.url) === targetClean);
      } else {
        entries = this._db
          .prepare("SELECT * FROM cache_entries WHERE cache_id = ? AND url = ?")
          .all(this._cacheId, url) as any[];
      }
    }

    const results: Response[] = [];
    for (const row of entries) {
      const headers = JSON.parse(row.headers_json);
      const res = new Response(row.body ? row.body : null, {
        status: row.status,
        statusText: row.status_text,
        headers,
      });
      results.push(res);
    }

    return results;
  }

  async delete(
    request: RequestInfo | URL,
    options?: CacheQueryOptions,
  ): Promise<boolean> {
    const { url } = normalizeRequestUrl(request);
    let deletedCount = 0;

    if (options?.ignoreSearch) {
      const targetClean = stripSearch(url);
      const allEntries = this._db
        .prepare("SELECT id, url FROM cache_entries WHERE cache_id = ?")
        .all(this._cacheId) as any[];
      const toDelete = allEntries.filter(
        (e) => stripSearch(e.url) === targetClean,
      );
      for (const row of toDelete) {
        this._db.prepare("DELETE FROM cache_entries WHERE id = ?").run(row.id);
        deletedCount++;
      }
    } else {
      const res = this._db
        .prepare("DELETE FROM cache_entries WHERE cache_id = ? AND url = ?")
        .run(this._cacheId, url);
      deletedCount = res.changes;
    }

    return deletedCount > 0;
  }

  async keys(
    request?: RequestInfo | URL,
    options?: CacheQueryOptions,
  ): Promise<Request[]> {
    let entries: any[] = [];

    if (!request) {
      entries = this._db
        .prepare(
          "SELECT url, method FROM cache_entries WHERE cache_id = ? ORDER BY id ASC",
        )
        .all(this._cacheId) as any[];
    } else {
      const { url } = normalizeRequestUrl(request);
      if (options?.ignoreSearch) {
        const targetClean = stripSearch(url);
        const allEntries = this._db
          .prepare("SELECT url, method FROM cache_entries WHERE cache_id = ?")
          .all(this._cacheId) as any[];
        entries = allEntries.filter((e) => stripSearch(e.url) === targetClean);
      } else {
        entries = this._db
          .prepare(
            "SELECT url, method FROM cache_entries WHERE cache_id = ? AND url = ?",
          )
          .all(this._cacheId, url) as any[];
      }
    }

    return entries.map((e) => new Request(e.url, { method: e.method }));
  }
}

export class CacheStorage {
  private _db: Database;
  private _cacheMap = new Map<string, Cache>();

  constructor(dbPath: string = ":memory:") {
    this._db = new Database(dbPath, { create: true });
    this._initSchema();
  }

  private _initSchema() {
    this._db.run("PRAGMA journal_mode = WAL;");
    this._db.run(`
      CREATE TABLE IF NOT EXISTS caches (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL
      );
    `);
    this._db.run(`
      CREATE TABLE IF NOT EXISTS cache_entries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        cache_id INTEGER NOT NULL REFERENCES caches(id) ON DELETE CASCADE,
        url TEXT NOT NULL,
        method TEXT NOT NULL,
        status INTEGER NOT NULL,
        status_text TEXT NOT NULL,
        headers_json TEXT NOT NULL,
        body BLOB,
        created_at INTEGER NOT NULL
      );
    `);
    this._db.run(`
      CREATE INDEX IF NOT EXISTS idx_entries_cache_url ON cache_entries(cache_id, url);
    `);
  }

  async open(cacheName: string): Promise<Cache> {
    if (typeof cacheName !== "string" || cacheName.length === 0) {
      throw new TypeError("cacheName must be a non-empty string");
    }

    let cache = this._cacheMap.get(cacheName);
    if (cache) return cache;

    let row = this._db
      .prepare("SELECT id FROM caches WHERE name = ?")
      .get(cacheName) as { id: number } | undefined;

    if (!row) {
      this._db.prepare("INSERT INTO caches (name) VALUES (?)").run(cacheName);
      row = this._db
        .prepare("SELECT id FROM caches WHERE name = ?")
        .get(cacheName) as {
        id: number;
      };
    }

    cache = new Cache(cacheName, this._db, row.id);
    this._cacheMap.set(cacheName, cache);
    return cache;
  }

  async has(cacheName: string): Promise<boolean> {
    const row = this._db
      .prepare("SELECT 1 FROM caches WHERE name = ?")
      .get(cacheName);
    return !!row;
  }

  async delete(cacheName: string): Promise<boolean> {
    const row = this._db
      .prepare("SELECT id FROM caches WHERE name = ?")
      .get(cacheName) as { id: number } | undefined;

    if (!row) return false;

    this._db.transaction(() => {
      this._db
        .prepare("DELETE FROM cache_entries WHERE cache_id = ?")
        .run(row.id);
      this._db.prepare("DELETE FROM caches WHERE id = ?").run(row.id);
    })();

    this._cacheMap.delete(cacheName);
    return true;
  }

  async keys(): Promise<string[]> {
    const rows = this._db
      .prepare("SELECT name FROM caches ORDER BY id ASC")
      .all() as {
      name: string;
    }[];
    return rows.map((r) => r.name);
  }

  async match(
    request: RequestInfo | URL,
    options?: MultiCacheQueryOptions,
  ): Promise<Response | undefined> {
    if (options?.cacheName) {
      const cache = await this.open(options.cacheName);
      return cache.match(request, options);
    }

    const allCacheNames = await this.keys();
    for (const name of allCacheNames) {
      const cache = await this.open(name);
      const res = await cache.match(request, options);
      if (res) return res;
    }
    return undefined;
  }
}

export function installCaches(target: any = globalThis): CacheStorage {
  if (!target.Cache) {
    Object.defineProperty(target, "Cache", {
      value: Cache,
      writable: true,
      configurable: true,
    });
  }

  if (!target.CacheStorage) {
    Object.defineProperty(target, "CacheStorage", {
      value: CacheStorage,
      writable: true,
      configurable: true,
    });
  }

  if (!target.caches) {
    const cacheStorage = new CacheStorage(":memory:");
    Object.defineProperty(target, "caches", {
      value: cacheStorage,
      writable: true,
      configurable: true,
    });
    return cacheStorage;
  }

  return target.caches;
}
