declare module "node:fs" {
  export function existsSync(path: string): boolean;
  export function readFileSync(path: string, encoding: "utf8"): string;
  export function writeFileSync(
    path: string,
    data: string | Uint8Array,
    encoding?: "utf8",
  ): void;
  export function mkdirSync(
    path: string,
    options?: { recursive?: boolean; mode?: number },
  ): string | undefined;
  export function chmodSync(path: string, mode: number): void;
  export function mkdtempSync(prefix: string): string;
  export function rmSync(
    path: string,
    options?: { recursive?: boolean; force?: boolean },
  ): void;
}

declare module "node:path" {
  export interface ParsedPath {
    root: string;
    dir: string;
    base: string;
    ext: string;
    name: string;
  }
  export function join(...paths: string[]): string;
  export function resolve(...paths: string[]): string;
  export function dirname(path: string): string;
  export function basename(path: string, suffix?: string): string;
  export function parse(path: string): ParsedPath;
}

declare module "node:os" {
  export function homedir(): string;
  export function tmpdir(): string;
}

declare module "node:child_process" {
  export interface SpawnSyncOptions {
    cwd?: string;
    encoding?: "utf8" | string;
    env?: Record<string, string | undefined>;
    stdio?: "ignore" | "inherit" | "pipe" | Array<string>;
    shell?: boolean;
    windowsHide?: boolean;
    windowsVerbatimArguments?: boolean;
  }
  export interface SpawnSyncReturns {
    pid: number;
    output: Array<string | null>;
    stdout: string;
    stderr: string;
    status: number | null;
    signal: string | null;
    error?: Error;
  }
  export function spawnSync(
    command: string,
    args?: readonly string[],
    options?: SpawnSyncOptions,
  ): SpawnSyncReturns;
}

declare module "bun:test" {
  export interface Matchers<T = unknown> {
    toBe(expected: T): void;
    toEqual(expected: unknown): void;
    toContain(item: unknown): void;
    toThrow(error?: string | RegExp | Error): void;
    toBeUndefined(): void;
    toBeDefined(): void;
    toBeTruthy(): void;
    toBeFalsy(): void;
    toBeGreaterThan(n: number): void;
    toBeGreaterThanOrEqual(n: number): void;
    not: Matchers<T>;
  }
  export function describe(name: string, fn: () => void): void;
  export function test(
    name: string,
    fn: () => void | Promise<void>,
    timeout?: number,
  ): void;
  export function it(
    name: string,
    fn: () => void | Promise<void>,
    timeout?: number,
  ): void;
  export function expect<T = unknown>(actual: T): Matchers<T>;
  export function beforeAll(fn: () => void | Promise<void>): void;
  export function afterAll(fn: () => void | Promise<void>): void;
}

interface ImportMeta {
  readonly main?: boolean;
  readonly path: string;
  readonly dir: string;
  readonly url: string;
}

declare const process: {
  readonly platform: string;
  readonly argv: string[];
  readonly env: Record<string, string | undefined>;
  cwd(): string;
  exit(code?: number): never;
};

declare namespace Bun {
  function write(
    destination: string,
    input: string | Uint8Array,
  ): Promise<number>;
  function inspect(value: unknown): string;
  function spawnSync(
    cmd: string[],
    options?: {
      cwd?: string;
      env?: Record<string, string | undefined>;
    },
  ): {
    exitCode: number;
    stdout: Uint8Array;
    stderr: Uint8Array;
    success: boolean;
  };
}
