/**
 * CHROMIUM UPSTREAM VS BUN FULL-STACK RUNTIME PARITY PRELOAD
 * Generated automatically by bun-parity (bpt patch)
 * Target: Bun v1.4.4
 * Artifact: dist/chromium-parity-preload.ts
 */

// @bun
// src/polyfills/scheduler.ts
class TaskPriorityChangeEvent extends Event {
  previousPriority;
  constructor(type, init) {
    super(type, init);
    this.previousPriority = init?.previousPriority ?? "user-visible";
  }
}

class TaskSignal extends AbortSignal {
  _priority;
  constructor(priority = "user-visible") {
    super();
    this._priority = priority;
  }
  get priority() {
    return this._priority;
  }
  _setPriority(newPriority) {
    if (this._priority === newPriority)
      return;
    const previousPriority = this._priority;
    this._priority = newPriority;
    const event = new TaskPriorityChangeEvent("prioritychange", {
      previousPriority
    });
    this.dispatchEvent(event);
  }
}

class TaskController extends AbortController {
  _taskSignal;
  constructor(init) {
    super();
    this._taskSignal = new TaskSignal(init?.priority ?? "user-visible");
  }
  get signal() {
    return this._taskSignal;
  }
  setPriority(priority) {
    if (this._taskSignal.aborted)
      return;
    this._taskSignal._setPriority(priority);
  }
}
var PRIORITY_WEIGHTS = {
  "user-blocking": 3,
  "user-visible": 2,
  background: 1
};

class PrioritizedScheduler {
  _taskId = 0;
  _queue = [];
  _flushing = false;
  _enqueue(task) {
    this._queue.push(task);
    this._sortQueue();
    this._scheduleFlush();
  }
  _sortQueue() {
    this._queue.sort((a, b) => {
      const weightDiff = PRIORITY_WEIGHTS[b.priority] - PRIORITY_WEIGHTS[a.priority];
      if (weightDiff !== 0)
        return weightDiff;
      return a.id - b.id;
    });
  }
  _scheduleFlush() {
    if (this._flushing)
      return;
    this._flushing = true;
    queueMicrotask(() => this._flush());
  }
  _flush() {
    try {
      while (this._queue.length > 0) {
        const task = this._queue.shift();
        if (task.signal?.aborted) {
          const reason = task.signal.reason ?? new DOMException("The task was aborted", "AbortError");
          task.reject(reason);
          continue;
        }
        try {
          const result = task.fn();
          task.resolve(result);
        } catch (err) {
          task.reject(err);
        }
      }
    } finally {
      this._flushing = false;
      if (this._queue.length > 0) {
        this._scheduleFlush();
      }
    }
  }
  postTask(callback, options) {
    if (typeof callback !== "function") {
      return Promise.reject(new TypeError("callback must be a function"));
    }
    const priority = options?.priority ?? (options?.signal instanceof TaskSignal ? options.signal.priority : "user-visible");
    const delay = options?.delay ?? 0;
    const signal = options?.signal;
    if (signal?.aborted) {
      const reason = signal.reason ?? new DOMException("The task was aborted", "AbortError");
      return Promise.reject(reason);
    }
    return new Promise((resolve, reject) => {
      const taskId = ++this._taskId;
      const scheduleAction = () => {
        if (signal?.aborted) {
          const reason = signal.reason ?? new DOMException("The task was aborted", "AbortError");
          reject(reason);
          return;
        }
        const task = {
          id: taskId,
          priority,
          fn: callback,
          resolve,
          reject,
          signal
        };
        if (signal instanceof TaskSignal) {
          const onPriorityChange = () => {
            task.priority = signal.priority;
            this._sortQueue();
          };
          signal.addEventListener("prioritychange", onPriorityChange, {
            once: false
          });
        }
        if (signal) {
          const onAbort = () => {
            const idx = this._queue.indexOf(task);
            if (idx !== -1) {
              this._queue.splice(idx, 1);
            }
            const reason = signal.reason ?? new DOMException("The task was aborted", "AbortError");
            reject(reason);
          };
          signal.addEventListener("abort", onAbort, { once: true });
        }
        this._enqueue(task);
      };
      if (delay > 0) {
        const timer = setTimeout(scheduleAction, delay);
        if (signal) {
          signal.addEventListener("abort", () => {
            clearTimeout(timer);
            const reason = signal.reason ?? new DOMException("The task was aborted", "AbortError");
            reject(reason);
          }, { once: true });
        }
      } else {
        scheduleAction();
      }
    });
  }
  yield() {
    return new Promise((resolve) => {
      setTimeout(resolve, 0);
    });
  }
}
function installScheduler(target = globalThis) {
  const schedulerInstance = new PrioritizedScheduler;
  if (!target.scheduler) {
    Object.defineProperty(target, "scheduler", {
      value: schedulerInstance,
      writable: true,
      configurable: true
    });
  }
  if (!target.TaskController) {
    Object.defineProperty(target, "TaskController", {
      value: TaskController,
      writable: true,
      configurable: true
    });
  }
  if (!target.TaskSignal) {
    Object.defineProperty(target, "TaskSignal", {
      value: TaskSignal,
      writable: true,
      configurable: true
    });
  }
  if (!target.TaskPriorityChangeEvent) {
    Object.defineProperty(target, "TaskPriorityChangeEvent", {
      value: TaskPriorityChangeEvent,
      writable: true,
      configurable: true
    });
  }
  return target.scheduler;
}

// src/polyfills/locks.ts
class LockManager {
  _reqId = 0;
  _held = new Map;
  _pending = [];
  _clientId = "bun-process-" + Math.random().toString(36).slice(2, 9);
  async request(name, callbackOrOptions, maybeCallback) {
    if (!name || typeof name !== "string") {
      throw new TypeError("Lock name must be a non-empty string");
    }
    if (name.startsWith("-")) {
      throw new DOMException("Lock name cannot start with '-'", "NotSupportedError");
    }
    let options = {};
    let callback;
    if (typeof callbackOrOptions === "function") {
      callback = callbackOrOptions;
    } else {
      options = callbackOrOptions ?? {};
      if (typeof maybeCallback !== "function") {
        throw new TypeError("callback must be a function");
      }
      callback = maybeCallback;
    }
    const mode = options.mode ?? "exclusive";
    const ifAvailable = options.ifAvailable ?? false;
    const steal = options.steal ?? false;
    const signal = options.signal;
    if (steal && mode !== "exclusive") {
      throw new DOMException("steal option requires exclusive mode", "NotSupportedError");
    }
    if (steal && ifAvailable) {
      throw new DOMException("steal and ifAvailable cannot both be true", "NotSupportedError");
    }
    if (signal?.aborted) {
      const reason = signal.reason ?? new DOMException("The lock request was aborted", "AbortError");
      return Promise.reject(reason);
    }
    const active = this._held.get(name) ?? [];
    const hasPending = this._pending.some((p) => p.name === name);
    const canAcquireNow = steal || !hasPending && (active.length === 0 || mode === "shared" && active.every((a) => a.lock.mode === "shared"));
    if (!canAcquireNow && ifAvailable) {
      return callback(null);
    }
    if (steal) {
      for (const entry of active) {
        entry.resolveRelease();
      }
      this._held.delete(name);
    }
    let resolveRelease;
    const releasePromise = new Promise((res) => {
      resolveRelease = res;
    });
    const lockObj = { mode, name };
    const entry = {
      lock: lockObj,
      clientId: this._clientId,
      releasePromise,
      resolveRelease
    };
    if (canAcquireNow) {
      const currentActive = this._held.get(name) ?? [];
      currentActive.push(entry);
      this._held.set(name, currentActive);
    } else {
      await new Promise((resolve, reject) => {
        const req = {
          id: ++this._reqId,
          name,
          mode,
          clientId: this._clientId,
          signal,
          grant: () => {
            const currentActive = this._held.get(name) ?? [];
            currentActive.push(entry);
            this._held.set(name, currentActive);
            resolve();
          },
          reject: (err) => reject(err)
        };
        if (signal) {
          const onAbort = () => {
            const idx = this._pending.indexOf(req);
            if (idx !== -1) {
              this._pending.splice(idx, 1);
            }
            const reason = signal.reason ?? new DOMException("The lock request was aborted", "AbortError");
            reject(reason);
          };
          signal.addEventListener("abort", onAbort, { once: true });
        }
        this._pending.push(req);
      });
    }
    try {
      return await callback(lockObj);
    } finally {
      resolveRelease();
      const list = this._held.get(name);
      if (list) {
        const idx = list.indexOf(entry);
        if (idx !== -1) {
          list.splice(idx, 1);
        }
        if (list.length === 0) {
          this._held.delete(name);
        }
      }
      this._processPending(name);
    }
  }
  _processPending(name) {
    const active = this._held.get(name) ?? [];
    if (active.some((a) => a.lock.mode === "exclusive")) {
      return;
    }
    const pendingForName = this._pending.filter((p) => p.name === name);
    if (pendingForName.length === 0)
      return;
    const first = pendingForName[0];
    if (first.mode === "exclusive") {
      if (active.length === 0) {
        const idx = this._pending.indexOf(first);
        if (idx !== -1) {
          this._pending.splice(idx, 1);
          first.grant();
        }
      }
    } else {
      while (this._pending.length > 0) {
        const nextIdx = this._pending.findIndex((p) => p.name === name && p.mode === "shared");
        if (nextIdx === -1)
          break;
        const [next] = this._pending.splice(nextIdx, 1);
        next.grant();
      }
    }
  }
  async query() {
    const held = [];
    for (const [name, list] of this._held.entries()) {
      for (const entry of list) {
        held.push({
          name,
          mode: entry.lock.mode,
          clientId: entry.clientId
        });
      }
    }
    const pending = this._pending.map((p) => ({
      name: p.name,
      mode: p.mode,
      clientId: p.clientId
    }));
    return { held, pending };
  }
}
function installLocks(target = globalThis) {
  if (!target.navigator) {
    target.navigator = {};
  }
  if (!target.LockManager) {
    Object.defineProperty(target, "LockManager", {
      value: LockManager,
      writable: true,
      configurable: true
    });
  }
  if (!target.navigator.locks) {
    const lockManager = new LockManager;
    Object.defineProperty(target.navigator, "locks", {
      value: lockManager,
      writable: true,
      configurable: true
    });
    return lockManager;
  }
  return target.navigator.locks;
}

// src/polyfills/trusted-types.ts
var SECRET_TOKEN = Symbol("TrustedTypeToken");

class TrustedHTML {
  _value;
  constructor(token, value) {
    if (token !== SECRET_TOKEN) {
      throw new TypeError("Illegal constructor invocation for TrustedHTML");
    }
    this._value = String(value);
  }
  toString() {
    return this._value;
  }
  toJSON() {
    return this._value;
  }
}

class TrustedScript {
  _value;
  constructor(token, value) {
    if (token !== SECRET_TOKEN) {
      throw new TypeError("Illegal constructor invocation for TrustedScript");
    }
    this._value = String(value);
  }
  toString() {
    return this._value;
  }
  toJSON() {
    return this._value;
  }
}

class TrustedScriptURL {
  _value;
  constructor(token, value) {
    if (token !== SECRET_TOKEN) {
      throw new TypeError("Illegal constructor invocation for TrustedScriptURL");
    }
    this._value = String(value);
  }
  toString() {
    return this._value;
  }
  toJSON() {
    return this._value;
  }
}

class TrustedTypePolicy {
  name;
  _options;
  constructor(token, name, options) {
    if (token !== SECRET_TOKEN) {
      throw new TypeError("Illegal constructor invocation for TrustedTypePolicy");
    }
    this.name = name;
    this._options = options;
  }
  createHTML(input, ...args) {
    if (!this._options.createHTML) {
      throw new TypeError(`Policy '${this.name}' does not implement createHTML`);
    }
    const result = this._options.createHTML(String(input), ...args);
    if (typeof result !== "string") {
      throw new TypeError(`Policy '${this.name}' createHTML returned non-string`);
    }
    return new TrustedHTML(SECRET_TOKEN, result);
  }
  createScript(input, ...args) {
    if (!this._options.createScript) {
      throw new TypeError(`Policy '${this.name}' does not implement createScript`);
    }
    const result = this._options.createScript(String(input), ...args);
    if (typeof result !== "string") {
      throw new TypeError(`Policy '${this.name}' createScript returned non-string`);
    }
    return new TrustedScript(SECRET_TOKEN, result);
  }
  createScriptURL(input, ...args) {
    if (!this._options.createScriptURL) {
      throw new TypeError(`Policy '${this.name}' does not implement createScriptURL`);
    }
    const result = this._options.createScriptURL(String(input), ...args);
    if (typeof result !== "string") {
      throw new TypeError(`Policy '${this.name}' createScriptURL returned non-string`);
    }
    return new TrustedScriptURL(SECRET_TOKEN, result);
  }
}

class TrustedTypePolicyFactory {
  _policies = new Map;
  _defaultPolicy = null;
  emptyHTML = new TrustedHTML(SECRET_TOKEN, "");
  emptyScript = new TrustedScript(SECRET_TOKEN, "");
  get defaultPolicy() {
    return this._defaultPolicy;
  }
  createPolicy(name, policyOptions) {
    if (typeof name !== "string" || name.length === 0) {
      throw new TypeError("Policy name must be a non-empty string");
    }
    if (this._policies.has(name)) {
      throw new DOMException(`Policy with name '${name}' already exists`, "TypeError");
    }
    const policy = new TrustedTypePolicy(SECRET_TOKEN, name, policyOptions);
    this._policies.set(name, policy);
    if (name === "default") {
      this._defaultPolicy = policy;
    }
    return policy;
  }
  isHTML(value) {
    return value instanceof TrustedHTML;
  }
  isScript(value) {
    return value instanceof TrustedScript;
  }
  isScriptURL(value) {
    return value instanceof TrustedScriptURL;
  }
  getAttributeType(tagName, attribute, _elementNs, _attrNs) {
    const tag = tagName.toLowerCase();
    const attr = attribute.toLowerCase();
    if (tag === "script" && attr === "src" || tag === "source" && attr === "src" || tag === "iframe" && attr === "src") {
      return "TrustedScriptURL";
    }
    if (attr.startsWith("on")) {
      return "TrustedScript";
    }
    if (attr === "srcdoc") {
      return "TrustedHTML";
    }
    return null;
  }
  getPropertyType(tagName, property, _elementNs) {
    const tag = tagName.toLowerCase();
    const prop = property.toLowerCase();
    if (prop === "innerhtml" || prop === "outerhtml") {
      return "TrustedHTML";
    }
    if (tag === "script" && (prop === "text" || prop === "innertext")) {
      return "TrustedScript";
    }
    if (tag === "script" && prop === "src") {
      return "TrustedScriptURL";
    }
    return null;
  }
}
function installTrustedTypes(target = globalThis) {
  if (!target.TrustedHTML) {
    Object.defineProperty(target, "TrustedHTML", {
      value: TrustedHTML,
      writable: true,
      configurable: true
    });
  }
  if (!target.TrustedScript) {
    Object.defineProperty(target, "TrustedScript", {
      value: TrustedScript,
      writable: true,
      configurable: true
    });
  }
  if (!target.TrustedScriptURL) {
    Object.defineProperty(target, "TrustedScriptURL", {
      value: TrustedScriptURL,
      writable: true,
      configurable: true
    });
  }
  if (!target.TrustedTypePolicy) {
    Object.defineProperty(target, "TrustedTypePolicy", {
      value: TrustedTypePolicy,
      writable: true,
      configurable: true
    });
  }
  if (!target.TrustedTypePolicyFactory) {
    Object.defineProperty(target, "TrustedTypePolicyFactory", {
      value: TrustedTypePolicyFactory,
      writable: true,
      configurable: true
    });
  }
  if (!target.trustedTypes) {
    const factory = new TrustedTypePolicyFactory;
    Object.defineProperty(target, "trustedTypes", {
      value: factory,
      writable: true,
      configurable: true
    });
    return factory;
  }
  return target.trustedTypes;
}

// src/polyfills/cache-storage.ts
import { Database } from "bun:sqlite";
function normalizeRequestUrl(input) {
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
function stripSearch(urlStr) {
  try {
    const u = new URL(urlStr);
    u.search = "";
    return u.href;
  } catch {
    return urlStr;
  }
}

class Cache {
  name;
  _db;
  _cacheId;
  constructor(name, db, cacheId) {
    this.name = name;
    this._db = db;
    this._cacheId = cacheId;
  }
  async put(request, response) {
    const { url, method } = normalizeRequestUrl(request);
    if (method !== "GET") {
      throw new TypeError("Cache.put only supports GET requests");
    }
    if (response.status === 206) {
      throw new TypeError("Cannot cache partial 206 responses");
    }
    const headersObj = {};
    response.headers.forEach((v, k) => {
      headersObj[k.toLowerCase()] = v;
    });
    const bodyBuffer = await response.clone().arrayBuffer();
    const bodyUint8 = new Uint8Array(bodyBuffer);
    const now = Date.now();
    this._db.transaction(() => {
      this._db.prepare("DELETE FROM cache_entries WHERE cache_id = ? AND url = ?").run(this._cacheId, url);
      this._db.prepare(`INSERT INTO cache_entries
           (cache_id, url, method, status, status_text, headers_json, body, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run(this._cacheId, url, method, response.status, response.statusText, JSON.stringify(headersObj), bodyUint8, now);
    })();
  }
  async add(request) {
    const res = await fetch(request);
    if (!res.ok) {
      throw new TypeError("Request failed with status " + res.status);
    }
    await this.put(request, res);
  }
  async addAll(requests) {
    const responses = await Promise.all(requests.map((r) => fetch(r).then((res) => {
      if (!res.ok) {
        throw new TypeError("Request failed with status " + res.status);
      }
      return res;
    })));
    for (let i = 0;i < requests.length; i++) {
      await this.put(requests[i], responses[i]);
    }
  }
  async match(request, options) {
    const matches = await this.matchAll(request, options);
    return matches[0];
  }
  async matchAll(request, options) {
    let entries = [];
    if (!request) {
      entries = this._db.prepare("SELECT * FROM cache_entries WHERE cache_id = ? ORDER BY id ASC").all(this._cacheId);
    } else {
      const { url } = normalizeRequestUrl(request);
      if (options?.ignoreSearch) {
        const targetClean = stripSearch(url);
        const allEntries = this._db.prepare("SELECT * FROM cache_entries WHERE cache_id = ?").all(this._cacheId);
        entries = allEntries.filter((e) => stripSearch(e.url) === targetClean);
      } else {
        entries = this._db.prepare("SELECT * FROM cache_entries WHERE cache_id = ? AND url = ?").all(this._cacheId, url);
      }
    }
    const results = [];
    for (const row of entries) {
      const headers = JSON.parse(row.headers_json);
      const res = new Response(row.body ? row.body : null, {
        status: row.status,
        statusText: row.status_text,
        headers
      });
      results.push(res);
    }
    return results;
  }
  async delete(request, options) {
    const { url } = normalizeRequestUrl(request);
    let deletedCount = 0;
    if (options?.ignoreSearch) {
      const targetClean = stripSearch(url);
      const allEntries = this._db.prepare("SELECT id, url FROM cache_entries WHERE cache_id = ?").all(this._cacheId);
      const toDelete = allEntries.filter((e) => stripSearch(e.url) === targetClean);
      for (const row of toDelete) {
        this._db.prepare("DELETE FROM cache_entries WHERE id = ?").run(row.id);
        deletedCount++;
      }
    } else {
      const res = this._db.prepare("DELETE FROM cache_entries WHERE cache_id = ? AND url = ?").run(this._cacheId, url);
      deletedCount = res.changes;
    }
    return deletedCount > 0;
  }
  async keys(request, options) {
    let entries = [];
    if (!request) {
      entries = this._db.prepare("SELECT url, method FROM cache_entries WHERE cache_id = ? ORDER BY id ASC").all(this._cacheId);
    } else {
      const { url } = normalizeRequestUrl(request);
      if (options?.ignoreSearch) {
        const targetClean = stripSearch(url);
        const allEntries = this._db.prepare("SELECT url, method FROM cache_entries WHERE cache_id = ?").all(this._cacheId);
        entries = allEntries.filter((e) => stripSearch(e.url) === targetClean);
      } else {
        entries = this._db.prepare("SELECT url, method FROM cache_entries WHERE cache_id = ? AND url = ?").all(this._cacheId, url);
      }
    }
    return entries.map((e) => new Request(e.url, { method: e.method }));
  }
}

class CacheStorage {
  _db;
  _cacheMap = new Map;
  constructor(dbPath = ":memory:") {
    this._db = new Database(dbPath, { create: true });
    this._initSchema();
  }
  _initSchema() {
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
  async open(cacheName) {
    if (typeof cacheName !== "string" || cacheName.length === 0) {
      throw new TypeError("cacheName must be a non-empty string");
    }
    let cache = this._cacheMap.get(cacheName);
    if (cache)
      return cache;
    let row = this._db.prepare("SELECT id FROM caches WHERE name = ?").get(cacheName);
    if (!row) {
      this._db.prepare("INSERT INTO caches (name) VALUES (?)").run(cacheName);
      row = this._db.prepare("SELECT id FROM caches WHERE name = ?").get(cacheName);
    }
    cache = new Cache(cacheName, this._db, row.id);
    this._cacheMap.set(cacheName, cache);
    return cache;
  }
  async has(cacheName) {
    const row = this._db.prepare("SELECT 1 FROM caches WHERE name = ?").get(cacheName);
    return !!row;
  }
  async delete(cacheName) {
    const row = this._db.prepare("SELECT id FROM caches WHERE name = ?").get(cacheName);
    if (!row)
      return false;
    this._db.transaction(() => {
      this._db.prepare("DELETE FROM cache_entries WHERE cache_id = ?").run(row.id);
      this._db.prepare("DELETE FROM caches WHERE id = ?").run(row.id);
    })();
    this._cacheMap.delete(cacheName);
    return true;
  }
  async keys() {
    const rows = this._db.prepare("SELECT name FROM caches ORDER BY id ASC").all();
    return rows.map((r) => r.name);
  }
  async match(request, options) {
    if (options?.cacheName) {
      const cache = await this.open(options.cacheName);
      return cache.match(request, options);
    }
    const allCacheNames = await this.keys();
    for (const name of allCacheNames) {
      const cache = await this.open(name);
      const res = await cache.match(request, options);
      if (res)
        return res;
    }
    return;
  }
}
function installCaches(target = globalThis) {
  if (!target.Cache) {
    Object.defineProperty(target, "Cache", {
      value: Cache,
      writable: true,
      configurable: true
    });
  }
  if (!target.CacheStorage) {
    Object.defineProperty(target, "CacheStorage", {
      value: CacheStorage,
      writable: true,
      configurable: true
    });
  }
  if (!target.caches) {
    const cacheStorage = new CacheStorage(":memory:");
    Object.defineProperty(target, "caches", {
      value: cacheStorage,
      writable: true,
      configurable: true
    });
    return cacheStorage;
  }
  return target.caches;
}

// src/polyfills/compression.ts
var NativeCompressionStream = globalThis.CompressionStream;
var NativeDecompressionStream = globalThis.DecompressionStream;
function normalizeFormat(format) {
  const lower = String(format).toLowerCase();
  if (lower === "br")
    return "brotli";
  return lower;
}

class ParityCompressionStream {
  readable;
  writable;
  format;
  constructor(format) {
    this.format = String(format);
    const normalized = normalizeFormat(format);
    const nativeStream = new NativeCompressionStream(normalized);
    this.readable = nativeStream.readable;
    this.writable = nativeStream.writable;
  }
}

class ParityDecompressionStream {
  readable;
  writable;
  format;
  constructor(format) {
    this.format = String(format);
    const normalized = normalizeFormat(format);
    const nativeStream = new NativeDecompressionStream(normalized);
    this.readable = nativeStream.readable;
    this.writable = nativeStream.writable;
  }
}
function installCompression(target = globalThis) {
  const OrigCS = target.CompressionStream;
  if (OrigCS) {
    const WrappedCS = function(format) {
      const normalized = normalizeFormat(format);
      return new OrigCS(normalized);
    };
    WrappedCS.prototype = OrigCS.prototype;
    Object.defineProperty(target, "CompressionStream", {
      value: WrappedCS,
      writable: true,
      configurable: true
    });
  } else {
    Object.defineProperty(target, "CompressionStream", {
      value: ParityCompressionStream,
      writable: true,
      configurable: true
    });
  }
  const OrigDS = target.DecompressionStream;
  if (OrigDS) {
    const WrappedDS = function(format) {
      const normalized = normalizeFormat(format);
      return new OrigDS(normalized);
    };
    WrappedDS.prototype = OrigDS.prototype;
    Object.defineProperty(target, "DecompressionStream", {
      value: WrappedDS,
      writable: true,
      configurable: true
    });
  } else {
    Object.defineProperty(target, "DecompressionStream", {
      value: ParityDecompressionStream,
      writable: true,
      configurable: true
    });
  }
}

// src/polyfills/mime.ts
var CHROMIUM_MIME_MAP = {
  wgsl: "text/wgsl",
  jxl: "image/jxl",
  avif: "image/avif",
  webp: "image/webp",
  apng: "image/apng",
  svg: "image/svg+xml",
  svgz: "image/svg+xml",
  webmanifest: "application/manifest+json",
  wasm: "application/wasm",
  crx: "application/x-chrome-extension",
  xhtml: "application/xhtml+xml",
  xht: "application/xhtml+xml",
  xhtm: "application/xhtml+xml",
  opus: "audio/opus",
  mka: "audio/matroska",
  mkv: "video/matroska",
  weba: "audio/webm",
  webm: "video/webm",
  flac: "audio/flac",
  wav: "audio/wav",
  m4a: "audio/x-m4a",
  mp4: "video/mp4",
  m4v: "video/mp4",
  ogv: "video/ogg",
  ogm: "video/ogg",
  woff2: "font/woff2",
  woff: "font/woff",
  vtt: "text/vtt",
  csv: "text/csv",
  mjs: "text/javascript",
  js: "text/javascript",
  css: "text/css",
  html: "text/html",
  htm: "text/html",
  bunaot: "application/vnd.bun.aot"
};

class ChromiumMimeRegistry {
  _table = new Map;
  _reverseTable = new Map;
  constructor() {
    for (const [ext, mime] of Object.entries(CHROMIUM_MIME_MAP)) {
      this.register(ext, mime);
    }
  }
  register(extension, mimeType) {
    const ext = extension.toLowerCase().replace(/^\./, "");
    this._table.set(ext, mimeType);
    if (!this._reverseTable.has(mimeType)) {
      this._reverseTable.set(mimeType, ext);
    }
  }
  getType(pathOrExt) {
    if (!pathOrExt)
      return;
    const clean = pathOrExt.toLowerCase();
    const lastDot = clean.lastIndexOf(".");
    const ext = lastDot !== -1 ? clean.slice(lastDot + 1) : clean;
    return this._table.get(ext);
  }
  getExtension(mimeType) {
    return this._reverseTable.get(mimeType.toLowerCase());
  }
  getAll() {
    const out = {};
    for (const [k, v] of this._table.entries()) {
      out[k] = v;
    }
    return out;
  }
}
var BunChromiumMime = new ChromiumMimeRegistry;
function installMime(target = globalThis) {
  if (!target.BunChromiumMime) {
    Object.defineProperty(target, "BunChromiumMime", {
      value: BunChromiumMime,
      writable: true,
      configurable: true
    });
  }
  const bunObj = target.Bun;
  if (bunObj && typeof bunObj.file === "function") {
    const origFile = bunObj.file;
    const patchedFile = function(path, options) {
      const f = origFile.call(bunObj, path, options);
      if (typeof path === "string") {
        const lastDot = path.lastIndexOf(".");
        if (lastDot !== -1) {
          const ext = path.slice(lastDot + 1).toLowerCase();
          const augmentedMime = BunChromiumMime.getType(ext);
          if (augmentedMime && f.type === "application/octet-stream") {
            return new Proxy(f, {
              get(t, prop, receiver) {
                if (prop === "type")
                  return augmentedMime;
                return Reflect.get(t, prop, receiver);
              }
            });
          }
        }
      }
      return f;
    };
    try {
      bunObj.file = patchedFile;
    } catch {}
  }
}

// src/polyfills/doh.ts
var DNS_RECORD_TYPE_MAP = {
  A: 1,
  NS: 2,
  CNAME: 5,
  PTR: 12,
  MX: 15,
  TXT: 16,
  AAAA: 28,
  SVCB: 64,
  HTTPS: 65
};
var DOH_PROVIDERS = {
  cloudflare: "https://cloudflare-dns.com/dns-query",
  google: "https://dns.google/dns-query"
};
function buildDnsWireQuery(domain, typeNum) {
  const parts = domain.replace(/\.$/, "").split(".");
  let domainByteLen = 1;
  for (const part of parts) {
    domainByteLen += 1 + part.length;
  }
  const packet = new Uint8Array(12 + domainByteLen + 4);
  const view = new DataView(packet.buffer);
  const txId = Math.floor(Math.random() * 65535);
  view.setUint16(0, txId, false);
  view.setUint16(2, 256, false);
  view.setUint16(4, 1, false);
  view.setUint16(6, 0, false);
  view.setUint16(8, 0, false);
  view.setUint16(10, 0, false);
  let offset = 12;
  for (const part of parts) {
    packet[offset++] = part.length;
    for (let i = 0;i < part.length; i++) {
      packet[offset++] = part.charCodeAt(i);
    }
  }
  packet[offset++] = 0;
  view.setUint16(offset, typeNum, false);
  offset += 2;
  view.setUint16(offset, 1, false);
  return packet;
}

class BunChromiumDNS {
  static async resolveDoH(domain, type = "A", options = {}) {
    const providerUrl = options.provider && DOH_PROVIDERS[options.provider] ? DOH_PROVIDERS[options.provider] : options.provider || DOH_PROVIDERS.cloudflare;
    const typeNum = DNS_RECORD_TYPE_MAP[type] ?? 1;
    if (options.wireFormat) {
      try {
        const wireQuery = buildDnsWireQuery(domain, typeNum);
        const controller = new AbortController;
        const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? 5000);
        const res = await fetch(providerUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/dns-message",
            Accept: "application/dns-message"
          },
          body: wireQuery,
          signal: controller.signal
        });
        clearTimeout(timeout);
        if (res.ok) {}
      } catch {}
    }
    const url = new URL(providerUrl);
    url.searchParams.set("name", domain);
    url.searchParams.set("type", type);
    const controller = new AbortController;
    const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? 5000);
    try {
      const res = await fetch(url.toString(), {
        headers: { Accept: "application/dns-json" },
        signal: controller.signal
      });
      clearTimeout(timeout);
      if (!res.ok) {
        throw new Error(`DoH query failed with status: ${res.status}`);
      }
      const json = await res.json();
      if (!json.Answer || !Array.isArray(json.Answer)) {
        return [];
      }
      return json.Answer.map((ans) => ({
        name: ans.name,
        type: ans.type,
        typeName: Object.keys(DNS_RECORD_TYPE_MAP).find((k) => DNS_RECORD_TYPE_MAP[k] === ans.type) ?? String(ans.type),
        TTL: ans.TTL,
        data: ans.data
      }));
    } catch (err) {
      clearTimeout(timeout);
      throw err;
    }
  }
  static async resolveHTTPS(domain, options = {}) {
    const answers = await this.resolveDoH(domain, "HTTPS", options);
    const results = [];
    for (const ans of answers) {
      if (ans.type !== 65)
        continue;
      const raw = ans.data;
      const tokens = raw.split(/\s+/);
      const priority = parseInt(tokens[0] || "1", 10);
      const targetName = tokens[1] || ".";
      const alpn = [];
      const ipv4Hints = [];
      const ipv6Hints = [];
      for (let i = 2;i < tokens.length; i++) {
        const token = tokens[i];
        if (token.startsWith("alpn=")) {
          const list = token.slice(5).split(",");
          alpn.push(...list);
        } else if (token.startsWith("ipv4hint=")) {
          const list = token.slice(9).split(",");
          ipv4Hints.push(...list);
        } else if (token.startsWith("ipv6hint=")) {
          const list = token.slice(9).split(",");
          ipv6Hints.push(...list);
        }
      }
      results.push({
        priority,
        targetName,
        alpn,
        ipv4Hints,
        ipv6Hints,
        raw
      });
    }
    return results;
  }
  static async happyEyeballs(domain, _port = 443) {
    const [ipv4Answers, ipv6Answers] = await Promise.all([
      this.resolveDoH(domain, "A").catch(() => []),
      this.resolveDoH(domain, "AAAA").catch(() => [])
    ]);
    const v4 = ipv4Answers[0]?.data;
    const v6 = ipv6Answers[0]?.data;
    if (v6 && !v4)
      return { winner: "IPv6", address: v6 };
    if (v4 && !v6)
      return { winner: "IPv4", address: v4 };
    if (v4 && v6) {
      return { winner: "IPv4", address: v4 };
    }
    throw new Error(`Could not resolve dual-stack addresses for ${domain}`);
  }
}
function installDns(target = globalThis) {
  if (!target.BunChromiumDNS) {
    Object.defineProperty(target, "BunChromiumDNS", {
      value: BunChromiumDNS,
      writable: true,
      configurable: true
    });
  }
  const bunObj = target.Bun;
  if (bunObj?.dns) {
    if (!bunObj.dns.resolveDoH) {
      bunObj.dns.resolveDoH = BunChromiumDNS.resolveDoH.bind(BunChromiumDNS);
    }
    if (!bunObj.dns.resolveHTTPS) {
      bunObj.dns.resolveHTTPS = BunChromiumDNS.resolveHTTPS.bind(BunChromiumDNS);
    }
  }
}

// src/polyfills/index.ts
function installAllChromiumPolyfills(target = globalThis) {
  const scheduler = installScheduler(target);
  const locks = installLocks(target);
  const trustedTypes = installTrustedTypes(target);
  const caches = installCaches(target);
  installCompression(target);
  installMime(target);
  installDns(target);
  if (typeof Error.isError !== "function") {
    Object.defineProperty(Error, "isError", {
      value: (err) => err instanceof Error || Object.prototype.toString.call(err) === "[object Error]",
      writable: true,
      configurable: true
    });
  }
  return {
    scheduler,
    locks,
    trustedTypes,
    caches,
    mime: BunChromiumMime,
    dns: BunChromiumDNS
  };
}

// src/preload-entry.ts
var installedParity = installAllChromiumPolyfills(globalThis);
export {
  BunChromiumDNS,
  BunChromiumMime,
  CacheStorage,
  LockManager,
  PrioritizedScheduler,
  TaskController,
  TaskSignal,
  TrustedTypePolicyFactory,
  installAllChromiumPolyfills,
  installCaches,
  installCompression,
  installDns,
  installLocks,
  installMime,
  installScheduler,
  installTrustedTypes,
  installedParity
};
