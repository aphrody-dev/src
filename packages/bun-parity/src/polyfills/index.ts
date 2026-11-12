/**
 * Consolidated Chromium Web Standards Polyfill Suite for Bun
 */

import {
  installScheduler,
  PrioritizedScheduler,
  TaskController,
  TaskSignal,
} from "./scheduler.ts";
import { installLocks, LockManager } from "./locks.ts";
import {
  installTrustedTypes,
  TrustedTypePolicyFactory,
} from "./trusted-types.ts";
import { installCaches, CacheStorage } from "./cache-storage.ts";
import { installCompression } from "./compression.ts";
import { installMime, BunChromiumMime } from "./mime.ts";
import { installDns, BunChromiumDNS } from "./doh.ts";

export {
  installScheduler,
  PrioritizedScheduler,
  TaskController,
  TaskSignal,
  installLocks,
  LockManager,
  installTrustedTypes,
  TrustedTypePolicyFactory,
  installCaches,
  CacheStorage,
  installCompression,
  installMime,
  BunChromiumMime,
  installDns,
  BunChromiumDNS,
};

export interface ChromiumParityInstalled {
  scheduler: PrioritizedScheduler;
  locks: LockManager;
  trustedTypes: TrustedTypePolicyFactory;
  caches: CacheStorage;
  mime: typeof BunChromiumMime;
  dns: typeof BunChromiumDNS;
}

export function installAllChromiumPolyfills(
  target: any = globalThis,
): ChromiumParityInstalled {
  // 1. Prioritized Task Scheduling (scheduler.postTask, scheduler.yield)
  const scheduler = installScheduler(target);

  // 2. Web Locks API (navigator.locks.request, query)
  const locks = installLocks(target);

  // 3. Trusted Types API (trustedTypes.createPolicy, TrustedHTML...)
  const trustedTypes = installTrustedTypes(target);

  // 4. W3C Cache API (caches.open, put, match) backed by bun:sqlite
  const caches = installCaches(target);

  // 5. Extended CompressionStream ('zstd', 'br')
  installCompression(target);

  // 6. Chromium MIME Table Augmentation
  installMime(target);

  // 7. DNS-over-HTTPS (RFC 8484) & Type 65 HTTPS ALPN
  installDns(target);

  // 8. TC39 Error.isError
  if (typeof (Error as any).isError !== "function") {
    Object.defineProperty(Error, "isError", {
      value: (err: unknown): err is Error =>
        err instanceof Error ||
        Object.prototype.toString.call(err) === "[object Error]",
      writable: true,
      configurable: true,
    });
  }

  return {
    scheduler,
    locks,
    trustedTypes,
    caches,
    mime: BunChromiumMime,
    dns: BunChromiumDNS,
  };
}
