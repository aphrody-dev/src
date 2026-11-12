/**
 * W3C Web Locks API implementation for Bun
 * Spec: https://w3c.github.io/web-locks/
 */

export type LockMode = "exclusive" | "shared";

export interface Lock {
  readonly mode: LockMode;
  readonly name: string;
}

export interface LockOptions {
  mode?: LockMode;
  ifAvailable?: boolean;
  steal?: boolean;
  signal?: AbortSignal;
}

export interface LockInfo {
  name: string;
  mode: LockMode;
  clientId: string;
}

export interface LockManagerSnapshot {
  held: LockInfo[];
  pending: LockInfo[];
}

interface ActiveLockEntry {
  lock: Lock;
  clientId: string;
  releasePromise: Promise<void>;
  resolveRelease: () => void;
}

interface QueuedLockRequest {
  id: number;
  name: string;
  mode: LockMode;
  clientId: string;
  signal?: AbortSignal;
  grant: () => void;
  reject: (err: any) => void;
}

export class LockManager {
  private _reqId = 0;
  private _held: Map<string, ActiveLockEntry[]> = new Map();
  private _pending: QueuedLockRequest[] = [];
  private readonly _clientId =
    "bun-process-" + Math.random().toString(36).slice(2, 9);

  async request<T>(
    name: string,
    callbackOrOptions: LockOptions | ((lock: Lock | null) => Promise<T> | T),
    maybeCallback?: (lock: Lock | null) => Promise<T> | T,
  ): Promise<T> {
    if (!name || typeof name !== "string") {
      throw new TypeError("Lock name must be a non-empty string");
    }
    if (name.startsWith("-")) {
      throw new DOMException(
        "Lock name cannot start with '-'",
        "NotSupportedError",
      );
    }

    let options: LockOptions = {};
    let callback: (lock: Lock | null) => Promise<T> | T;

    if (typeof callbackOrOptions === "function") {
      callback = callbackOrOptions;
    } else {
      options = callbackOrOptions ?? {};
      if (typeof maybeCallback !== "function") {
        throw new TypeError("callback must be a function");
      }
      callback = maybeCallback;
    }

    const mode: LockMode = options.mode ?? "exclusive";
    const ifAvailable = options.ifAvailable ?? false;
    const steal = options.steal ?? false;
    const signal = options.signal;

    if (steal && mode !== "exclusive") {
      throw new DOMException(
        "steal option requires exclusive mode",
        "NotSupportedError",
      );
    }
    if (steal && ifAvailable) {
      throw new DOMException(
        "steal and ifAvailable cannot both be true",
        "NotSupportedError",
      );
    }

    if (signal?.aborted) {
      const reason =
        signal.reason ??
        new DOMException("The lock request was aborted", "AbortError");
      return Promise.reject(reason);
    }

    // Check availability
    const active = this._held.get(name) ?? [];
    const hasPending = this._pending.some((p) => p.name === name);
    const canAcquireNow =
      steal ||
      (!hasPending &&
        (active.length === 0 ||
          (mode === "shared" &&
            active.every((a) => a.lock.mode === "shared"))));

    if (!canAcquireNow && ifAvailable) {
      // Cannot acquire immediately, ifAvailable is true
      return callback(null);
    }

    if (steal) {
      // Preempt any currently held locks
      for (const entry of active) {
        entry.resolveRelease();
      }
      this._held.delete(name);
    }

    let resolveRelease!: () => void;
    const releasePromise = new Promise<void>((res) => {
      resolveRelease = res;
    });

    const lockObj: Lock = { mode, name };
    const entry: ActiveLockEntry = {
      lock: lockObj,
      clientId: this._clientId,
      releasePromise,
      resolveRelease,
    };

    if (canAcquireNow) {
      // Synchronously claim lock
      const currentActive = this._held.get(name) ?? [];
      currentActive.push(entry);
      this._held.set(name, currentActive);
    } else {
      // Wait until lock is granted by queue
      await new Promise<void>((resolve, reject) => {
        const req: QueuedLockRequest = {
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
          reject: (err) => reject(err),
        };

        if (signal) {
          const onAbort = () => {
            const idx = this._pending.indexOf(req);
            if (idx !== -1) {
              this._pending.splice(idx, 1);
            }
            const reason =
              signal.reason ??
              new DOMException("The lock request was aborted", "AbortError");
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
      // Release lock
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

      // Check next pending locks
      this._processPending(name);
    }
  }

  private _processPending(name: string) {
    const active = this._held.get(name) ?? [];
    if (active.some((a) => a.lock.mode === "exclusive")) {
      return; // Exclusive lock still held
    }

    const pendingForName = this._pending.filter((p) => p.name === name);
    if (pendingForName.length === 0) return;

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
      // Grant all contiguous shared requests
      while (this._pending.length > 0) {
        const nextIdx = this._pending.findIndex(
          (p) => p.name === name && p.mode === "shared",
        );
        if (nextIdx === -1) break;
        const [next] = this._pending.splice(nextIdx, 1);
        next.grant();
      }
    }
  }

  async query(): Promise<LockManagerSnapshot> {
    const held: LockInfo[] = [];
    for (const [name, list] of this._held.entries()) {
      for (const entry of list) {
        held.push({
          name,
          mode: entry.lock.mode,
          clientId: entry.clientId,
        });
      }
    }

    const pending: LockInfo[] = this._pending.map((p) => ({
      name: p.name,
      mode: p.mode,
      clientId: p.clientId,
    }));

    return { held, pending };
  }
}

export function installLocks(target: any = globalThis): LockManager {
  if (!target.navigator) {
    target.navigator = {};
  }

  if (!target.LockManager) {
    Object.defineProperty(target, "LockManager", {
      value: LockManager,
      writable: true,
      configurable: true,
    });
  }

  if (!target.navigator.locks) {
    const lockManager = new LockManager();
    Object.defineProperty(target.navigator, "locks", {
      value: lockManager,
      writable: true,
      configurable: true,
    });
    return lockManager;
  }

  return target.navigator.locks;
}
