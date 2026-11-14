// SPDX-License-Identifier: Apache-2.0
/**
 * @aphrody/chromium-bun — Dual-Runtime Architecture Bridge (Host Bun JSC/WebKit <-> Guest Browser V8)
 * Consolidated from `yolo-rs/yolo-web/packages/bun-v8-bridge` & `packages/chromium`.
 * Forks only (aphrody-labs, third_party/forks.txt); V8 and lol-html have no fork and are not listed.
 */

export type RuntimePlane = "host-bun-webkit" | "guest-browser-v8";

export interface ForkedRepoEntry {
  readonly name: string;
  readonly fullName: `aphrody-labs/${string}`;
  readonly upstream: string;
  readonly url: `https://github.com/aphrody-labs/${string}`;
  readonly plane: RuntimePlane;
  readonly category:
    "runtime" | "js-engine" | "v8-binding" | "native-dep" | "build-tool";
  readonly pinnedCommit?: string;
  readonly description: string;
}

export const BUN_CHROMIUM_UPSTREAM_REPOS: readonly ForkedRepoEntry[] = [
  {
    name: "bun",
    fullName: "aphrody-labs/bun",
    upstream: "oven-sh/bun",
    url: "https://github.com/aphrody-labs/bun",
    plane: "host-bun-webkit",
    category: "runtime",
    description:
      "Full-Rust Bun v1.4.4 runtime (~200 crates in src/* + C++ WebKit/JSC): bundler, test runner, linter, formatter, package manager, and Cranelift AoT compiler",
  },
  {
    name: "WebKit",
    fullName: "aphrody-labs/WebKit",
    upstream: "oven-sh/WebKit",
    url: "https://github.com/aphrody-labs/WebKit",
    plane: "host-bun-webkit",
    category: "js-engine",
    pinnedCommit: "4d45755fed4aeef19e95beb90d3d0c884a2812bd",
    description:
      "Bun's patched Apple WebKit / JavaScriptCore fork with Riptide GC, B3/FTL JIT, SIMD, and AoT runtime facts",
  },
  {
    name: "aphrody-v8",
    fullName: "aphrody-labs/rusty_v8",
    upstream: "denoland/rusty_v8",
    url: "https://github.com/aphrody-labs/rusty_v8",
    plane: "guest-browser-v8",
    category: "v8-binding",
    description:
      "Replicated in crates/aphrody-v8 + third_party/rusty_v8: Rust FFI & C ABI bindings to V8 Isolates, Contexts, SnapshotCreator, and Inspector",
  },
  {
    name: "aphrody-cef",
    fullName: "aphrody-labs/src",
    upstream: "tauri-apps/cef-rs",
    url: "https://github.com/aphrody-labs/src",
    plane: "guest-browser-v8",
    category: "v8-binding",
    description:
      "Replicated in crates/aphrody-cef: CEF App, OSR RenderHandler, and Browser lifecycle unified onto crates/aphrody-v8",
  },
] as const;

export interface V8IsolateOptions {
  maxOldSpaceSizeMb?: number;
  maxSemiSpaceSizeMb?: number;
  exposeGc?: boolean;
  harmony?: boolean;
  jitless?: boolean;
  singleThreaded?: boolean;
  watchdogBudgetMs?: number;
  customFlags?: readonly string[];
}

const DISALLOWED_V8_FLAGS = new Set([
  "--allow-natives-syntax",
  "--No-sandbox",
  "--no-sandbox",
  "--disable-web-security",
]);

export class V8PageIsolateConfig {
  private readonly options: {
    maxOldSpaceSizeMb?: number;
    maxSemiSpaceSizeMb?: number;
    exposeGc: boolean;
    harmony: boolean;
    jitless: boolean;
    singleThreaded: boolean;
    watchdogBudgetMs: number;
    customFlags: string[];
  };
  private platformStarted = false;

  constructor(init: V8IsolateOptions = {}) {
    this.options = {
      maxOldSpaceSizeMb: init.maxOldSpaceSizeMb,
      maxSemiSpaceSizeMb: init.maxSemiSpaceSizeMb,
      exposeGc: init.exposeGc ?? false,
      harmony: init.harmony ?? false,
      jitless: init.jitless ?? false,
      singleThreaded: init.singleThreaded ?? false,
      watchdogBudgetMs: init.watchdogBudgetMs ?? 5000,
      customFlags: init.customFlags ? [...init.customFlags] : [],
    };
    this.validate();
  }

  validate(): void {
    if (this.options.maxOldSpaceSizeMb !== undefined) {
      if (
        !Number.isInteger(this.options.maxOldSpaceSizeMb) ||
        this.options.maxOldSpaceSizeMb < 16 ||
        this.options.maxOldSpaceSizeMb > 65536
      ) {
        throw new RangeError(
          `Invalid V8 maxOldSpaceSizeMb (${this.options.maxOldSpaceSizeMb}): must be an integer between 16 and 65536 MiB.`,
        );
      }
    }
    if (this.options.maxSemiSpaceSizeMb !== undefined) {
      if (
        !Number.isInteger(this.options.maxSemiSpaceSizeMb) ||
        this.options.maxSemiSpaceSizeMb < 1 ||
        this.options.maxSemiSpaceSizeMb > 1024
      ) {
        throw new RangeError(
          `Invalid V8 maxSemiSpaceSizeMb (${this.options.maxSemiSpaceSizeMb}): must be an integer between 1 and 1024 MiB.`,
        );
      }
    }
    if (
      !Number.isFinite(this.options.watchdogBudgetMs) ||
      this.options.watchdogBudgetMs < 50 ||
      this.options.watchdogBudgetMs > 300_000
    ) {
      throw new RangeError(
        `Invalid V8 watchdogBudgetMs (${this.options.watchdogBudgetMs}): must be between 50ms and 300000ms.`,
      );
    }
    for (const raw of this.options.customFlags) {
      const trimmed = raw.trim();
      if (
        !trimmed.startsWith("--") ||
        trimmed.length < 3 ||
        /\s/.test(trimmed)
      ) {
        throw new Error(
          `Invalid V8 custom flag "${raw}": must start with "--" and contain no whitespace.`,
        );
      }
      const flagName = trimmed.split("=")[0]!;
      if (DISALLOWED_V8_FLAGS.has(flagName)) {
        throw new Error(
          `Security violation: V8 flag "${flagName}" is disallowed in sandboxed guest page isolates.`,
        );
      }
    }
  }

  markPlatformStarted(): void {
    this.platformStarted = true;
  }

  isPlatformStarted(): boolean {
    return this.platformStarted;
  }

  toFlagArray(): string[] {
    const flags: string[] = [];
    if (this.options.maxOldSpaceSizeMb !== undefined) {
      flags.push(`--max-old-space-size=${this.options.maxOldSpaceSizeMb}`);
    }
    if (this.options.maxSemiSpaceSizeMb !== undefined) {
      flags.push(`--max-semi-space-size=${this.options.maxSemiSpaceSizeMb}`);
    }
    if (this.options.exposeGc) flags.push("--expose-gc");
    if (this.options.harmony) flags.push("--harmony");
    if (this.options.jitless) flags.push("--jitless");
    if (this.options.singleThreaded) flags.push("--single-threaded");
    for (const custom of this.options.customFlags) {
      const trimmed = custom.trim();
      if (!flags.includes(trimmed)) flags.push(trimmed);
    }
    return flags;
  }

  toFlagString(): string {
    return this.toFlagArray().join(" ");
  }

  getWatchdogBudgetMs(): number {
    return this.options.watchdogBudgetMs;
  }
}

export type V8ExecutionWorld = "main" | "isolated";

export interface V8PageEvaluateRequest {
  readonly expression: string;
  readonly world?: V8ExecutionWorld;
  readonly awaitPromise?: boolean;
  readonly returnByValue?: boolean;
  readonly budgetMs?: number;
}

export interface CdpEnvelope<TParams = Record<string, unknown>> {
  readonly id: number;
  readonly method: string;
  readonly params: TParams;
  readonly meta: {
    readonly sourcePlane: "host-bun-webkit";
    readonly targetPlane: "guest-browser-v8";
    readonly world: V8ExecutionWorld;
    readonly watchdogBudgetMs: number;
  };
}

const HOST_SECRET_PATTERNS: readonly RegExp[] = [
  /\bBun\s*\.\s*(serve|spawn|spawnSync|file|write|secrets|sql|sqlite|ffi|CSRF)\b/,
  /\bprocess\s*\.\s*env\b/,
  /\bimport\s*\(\s*["']bun:/,
  /\brequire\s*\(\s*["'](bun:|node:|fs|child_process)/,
];

export class DualEngineCoordinator {
  private readonly v8Config: V8PageIsolateConfig;
  private nextCommandId = 1;
  private readonly preloadScripts: string[] = [];

  constructor(v8Config: V8PageIsolateConfig = new V8PageIsolateConfig()) {
    this.v8Config = v8Config;
  }

  getV8Config(): V8PageIsolateConfig {
    return this.v8Config;
  }

  static assertPureGuestV8Script(script: string): void {
    if (!script || script.trim().length === 0) {
      throw new Error("Guest V8 script expression cannot be empty.");
    }
    for (const pattern of HOST_SECRET_PATTERNS) {
      if (pattern.test(script)) {
        throw new Error(
          `Dual-Runtime boundary violation: Host Bun/Node symbol matched (${pattern.source}) inside a guest V8 page script.`,
        );
      }
    }
  }

  buildRuntimeEvaluate(req: V8PageEvaluateRequest): CdpEnvelope<{
    expression: string;
    awaitPromise: boolean;
    returnByValue: boolean;
    contextType: V8ExecutionWorld;
    timeout: number;
  }> {
    DualEngineCoordinator.assertPureGuestV8Script(req.expression);
    const world: V8ExecutionWorld = req.world ?? "main";
    const budgetMs = req.budgetMs ?? this.v8Config.getWatchdogBudgetMs();

    return {
      id: this.nextCommandId++,
      method: "Runtime.evaluate",
      params: {
        expression: req.expression,
        awaitPromise: req.awaitPromise ?? true,
        returnByValue: req.returnByValue ?? true,
        contextType: world,
        timeout: budgetMs,
      },
      meta: {
        sourcePlane: "host-bun-webkit",
        targetPlane: "guest-browser-v8",
        world,
        watchdogBudgetMs: budgetMs,
      },
    };
  }

  buildPreloadDocumentScript(
    source: string,
    worldName?: string,
  ): CdpEnvelope<{
    source: string;
    worldName?: string;
  }> {
    DualEngineCoordinator.assertPureGuestV8Script(source);
    this.preloadScripts.push(source);
    const world: V8ExecutionWorld = worldName ? "isolated" : "main";

    return {
      id: this.nextCommandId++,
      method: "Page.addScriptToEvaluateOnNewDocument",
      params: worldName ? { source, worldName } : { source },
      meta: {
        sourcePlane: "host-bun-webkit",
        targetPlane: "guest-browser-v8",
        world,
        watchdogBudgetMs: this.v8Config.getWatchdogBudgetMs(),
      },
    };
  }

  buildSerializedV8Call<TArgs extends readonly unknown[]>(
    fnSource: string,
    args: TArgs,
    options?: Omit<V8PageEvaluateRequest, "expression">,
  ): CdpEnvelope<{
    expression: string;
    awaitPromise: boolean;
    returnByValue: boolean;
    contextType: V8ExecutionWorld;
    timeout: number;
  }> {
    DualEngineCoordinator.assertPureGuestV8Script(fnSource);
    const serializedArgs = args.map((arg) => JSON.stringify(arg)).join(", ");
    const expression = `(${fnSource})(${serializedArgs})`;
    return this.buildRuntimeEvaluate({
      ...options,
      expression,
    });
  }

  getRegisteredPreloadScripts(): readonly string[] {
    return this.preloadScripts;
  }
}
