/**
 * Ambient type declarations for Bun and Node core modules
 * Enables 100% zero-dependency pure Bun type checking
 */

declare namespace Bun {
  const version: string;
  function file(path: string | URL, options?: any): any;
  function sleep(ms: number): Promise<void>;
  function build(options: any): Promise<any>;
  function spawn(args: string[], options?: any): any;
  const stringWidth: (s: string) => number;
  const dns: any;
}

declare const process: {
  argv: string[];
  exit(code?: number): never;
};

interface ImportMeta {
  dir: string;
  path: string;
}

declare module "bun:sqlite" {
  export class Database {
    constructor(filename?: string, options?: any);
    run(sql: string, ...params: any[]): void;
    prepare(sql: string): {
      get(...params: any[]): any;
      all(...params: any[]): any[];
      run(...params: any[]): { changes: number; lastInsertRowid: number };
    };
    transaction<T extends (...args: any[]) => any>(fn: T): T;
  }
}

declare module "bun:test" {
  export function describe(name: string, fn: () => void): void;
  export function test(name: string, fn: () => void | Promise<void>): void;
  export function beforeAll(fn: () => void | Promise<void>): void;
  export function afterAll(fn: () => void | Promise<void>): void;
  export function expect(actual: any): any;
}

declare module "node:fs" {
  export function existsSync(path: any): boolean;
  export function readFileSync(path: any, options?: any): any;
  export function writeFileSync(path: any, data: any, options?: any): void;
  export function mkdirSync(path: any, options?: any): any;
  export function readdirSync(path: any, options?: any): any[];
  export function unlinkSync(path: any): void;
}

declare module "node:path" {
  export function join(...paths: string[]): string;
  export function dirname(path: string): string;
  export function basename(path: string, ext?: string): string;
  export function resolve(...paths: string[]): string;
}

declare module "node:child_process" {
  export function execSync(command: string, options?: any): any;
}
