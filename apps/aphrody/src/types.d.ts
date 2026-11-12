/**
 * Native Bun, Node & Web Ambient Types
 * Strictly zero external npm dependencies!
 */

declare global {
  const Bun: any;
  const Buffer: any;
  const process: any;

  interface ImportMeta {
    dir: string;
    url: string;
  }
}

declare module "bun" {
  export const serve: any;
  export const gzipSync: any;
  export const nanoseconds: any;
  export const build: any;
}

declare module "bun:test" {
  export const describe: (name: string, fn: () => void | Promise<void>) => void;
  export const it: (name: string, fn: () => void | Promise<void>) => void;
  export const expect: (actual: any) => any;
  export const beforeEach: (fn: () => void | Promise<void>) => void;
  export const afterEach: (fn: () => void | Promise<void>) => void;
}

declare module "bun:sqlite" {
  export class Database {
    constructor(path?: string, options?: any);
    exec(query: string): void;
    run(query: string, ...params: any[]): any;
    query<ReturnType = any, ParamsType = any>(
      query: string,
    ): {
      all(...params: any[]): ReturnType[];
      get(...params: any[]): ReturnType | null;
      run(...params: any[]): any;
    };
    prepare<ReturnType = any, ParamsType = any>(query: string): any;
    transaction<T extends (...args: any[]) => any>(fn: T): T;
    close(): void;
  }
}

declare module "fs" {
  export function existsSync(path: string): boolean;
  export function readFileSync(path: string, encoding?: string): any;
  export function writeFileSync(
    path: string,
    data: any,
    encoding?: string,
  ): void;
  export function mkdirSync(path: string, options?: any): any;
  export function statSync(path: string): any;
}

declare module "path" {
  export function join(...paths: string[]): string;
  export function resolve(...paths: string[]): string;
}
