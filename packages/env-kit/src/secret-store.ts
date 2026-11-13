// SPDX-License-Identifier: Apache-2.0
/**
 * OS-protected secret store shared by every tool of the monorepo (`env-kit secret`, `ay secret`,
 * `ay auth`). One encrypted file per secret, named after the environment variable it feeds:
 *
 * - Windows: DPAPI, current-user scope (`CryptProtectData`, crypt32.dll through bun:ffi), with a
 *   fixed application entropy. Files: `<src>/var/secrets/local/<NAME>.dpapi` (the vault,
 *   docs/infra/VAULT.md); the pre-vault `%LOCALAPPDATA%\aphrody\secrets` is still read (newest file
 *   wins) and is the location outside the monorepo (published package). Only this Windows account
 *   on this machine can decrypt them.
 * - Linux, root: `systemd-creds encrypt` (host key, plus TPM2 when present) into
 *   `/etc/credstore.encrypted/<NAME>`, the directory systemd searches for
 *   `LoadCredentialEncrypted=<NAME>`: a unit consumes a secret without any copy in clear.
 * - Linux, other users: `systemd-creds --user` into `~/.config/credstore.encrypted/<NAME>`.
 *
 * This synchronous API is kept for compatibility; new code uses the async `@aphrody/vault`
 * (packages/vault), which reads and writes the same files. `ENV_KIT_SECRET_DIR` overrides the directory. Values travel through memory and stdin only: never
 * argv, never stdout unless the caller pipes (`secretGet` returns the value, the CLI refuses to
 * print it to a terminal).
 */

import { spawnSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  renameSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { homedir } from "node:os";
import { join, resolve } from "node:path";

export type SecretBackend = "dpapi" | "systemd-creds" | "systemd-creds-user";

export interface SecretStoreInfo {
  backend: SecretBackend;
  dir: string;
  /** Read-only fallbacks (Windows: the pre-vault directory). */
  legacy?: string[];
}

const NAME = /^[A-Za-z_][A-Za-z0-9_.-]{0,127}$/;
const ENTROPY = new TextEncoder().encode("aphrody/env-kit/secret-store/v1");
// Format v2 (shared with packages/vault/src/store.ts): "AYD2" + DPAPI blob, entropy bound to the name.
// Both versions are read; writes are v2 (lazy migration). A raw DPAPI blob starts with 01 00 00 00.
const DPAPI_V2 = new TextEncoder().encode("AYD2");
const entropyV2 = (name: string) => new TextEncoder().encode(`aphrody/vault/dpapi/v2|${name}`);
const isV2 = (b: Uint8Array) => b.byteLength > 4 && DPAPI_V2.every((c, i) => b[i] === c);

function assertName(name: string): void {
  if (!NAME.test(name)) throw new Error(`invalid secret name: ${JSON.stringify(name)}`);
}

const isRoot = (): boolean => process.getuid?.() === 0;

export function storeInfo(): SecretStoreInfo {
  const override = process.env.ENV_KIT_SECRET_DIR;
  if (process.platform === "win32") {
    const base = process.env.LOCALAPPDATA ?? join(homedir(), "AppData", "Local");
    const old = join(base, "aphrody", "secrets");
    if (override) return { backend: "dpapi", dir: override };
    // Inside the monorepo (packages/env-kit/src): the vault; elsewhere (npm install): the old place.
    const root = process.env.SRC_ROOT ?? resolve(import.meta.dir, "..", "..", "..");
    const inRepo = existsSync(join(root, "packages", "vault", "package.json"));
    const vault = process.env.APHRODY_VAULT_DIR ?? join(root, "var", "secrets");
    return inRepo ? { backend: "dpapi", dir: join(vault, "local"), legacy: [old] } : { backend: "dpapi", dir: old };
  }
  if (process.platform === "linux") {
    if (isRoot()) return { backend: "systemd-creds", dir: override ?? "/etc/credstore.encrypted" };
    const base = process.env.XDG_CONFIG_HOME ?? join(homedir(), ".config");
    return { backend: "systemd-creds-user", dir: override ?? join(base, "credstore.encrypted") };
  }
  throw new Error(`secret store: unsupported platform ${process.platform}`);
}

const fileOf = (info: SecretStoreInfo, name: string): string =>
  join(info.dir, info.backend === "dpapi" ? `${name}.dpapi` : name);

/** Newest existing file among the store and its fallbacks (an older tool may still write there). */
function locate(info: SecretStoreInfo, name: string): string | undefined {
  let best: string | undefined;
  let at = -1;
  for (const dir of [info.dir, ...(info.legacy ?? [])]) {
    const f = fileOf({ ...info, dir }, name);
    try {
      const t = statSync(f).mtimeMs;
      if (t > at) [best, at] = [f, t];
    } catch {}
  }
  return best;
}

// --- Windows DPAPI (bun:ffi) ----------------------------------------------------------------

type Dpapi = {
  protect(data: Uint8Array, entropy?: Uint8Array): Uint8Array;
  unprotect(blob: Uint8Array, entropy?: Uint8Array): Uint8Array;
};

let dpapi: Dpapi | undefined;

function loadDpapi(): Dpapi {
  if (dpapi) return dpapi;
  const { dlopen, FFIType, ptr, toArrayBuffer } = require("bun:ffi") as typeof import("bun:ffi");
  const sig = {
    args: [FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.ptr, FFIType.u32, FFIType.ptr],
    returns: FFIType.i32,
  } as const;
  const crypt32 = dlopen("crypt32.dll", { CryptProtectData: sig, CryptUnprotectData: sig });
  const kernel32 = dlopen("kernel32.dll", {
    LocalFree: { args: [FFIType.ptr], returns: FFIType.ptr },
  });
  const CRYPTPROTECT_UI_FORBIDDEN = 0x1;
  // DATA_BLOB { DWORD cbData; BYTE *pbData; } = 16 bytes on x64 (pointer at offset 8).
  const blob = (bytes: Uint8Array): Buffer => {
    const b = Buffer.alloc(16);
    b.writeUInt32LE(bytes.byteLength, 0);
    if (bytes.byteLength) b.writeBigUInt64LE(BigInt(ptr(bytes)), 8);
    return b;
  };
  const call = (fn: "CryptProtectData" | "CryptUnprotectData", input: Uint8Array, extra: Uint8Array = ENTROPY): Uint8Array => {
    // Copy into a buffer bun owns for the duration of the call (ptr() needs a non-empty view).
    const data = new Uint8Array(Math.max(input.byteLength, 1));
    data.set(input);
    const inBlob = blob(data.subarray(0, input.byteLength));
    const entropy = blob(extra);
    const out = Buffer.alloc(16);
    const ok =
      fn === "CryptProtectData"
        ? crypt32.symbols.CryptProtectData(ptr(inBlob), null, ptr(entropy), null, null, CRYPTPROTECT_UI_FORBIDDEN, ptr(out))
        : crypt32.symbols.CryptUnprotectData(ptr(inBlob), null, ptr(entropy), null, null, CRYPTPROTECT_UI_FORBIDDEN, ptr(out));
    data.fill(0);
    if (!ok) throw new Error(`${fn} failed`);
    const len = out.readUInt32LE(0);
    const p = Number(out.readBigUInt64LE(8));
    try {
      return len ? new Uint8Array(toArrayBuffer(p as never, 0, len)).slice() : new Uint8Array();
    } finally {
      if (p) kernel32.symbols.LocalFree(p as never);
    }
  };
  dpapi = {
    protect: (d, e) => call("CryptProtectData", d, e),
    unprotect: (b, e) => call("CryptUnprotectData", b, e),
  };
  return dpapi;
}

// --- Linux systemd-creds ----------------------------------------------------------------------

function creds(info: SecretStoreInfo, args: string[], input?: Uint8Array): Uint8Array {
  const user = info.backend === "systemd-creds-user" ? ["--user"] : [];
  const r = spawnSync("systemd-creds", [...user, ...args], {
    input: input ? Buffer.from(input) : undefined,
    maxBuffer: 16 << 20,
  });
  if (r.status !== 0) {
    // stderr of systemd-creds never contains the payload.
    throw new Error(`systemd-creds ${args[0]} failed: ${String(r.stderr ?? r.error ?? "").trim()}`);
  }
  return new Uint8Array(r.stdout);
}

// --- Public API -------------------------------------------------------------------------------

export function secretSet(name: string, value: string | Uint8Array): void {
  assertName(name);
  const info = storeInfo();
  mkdirSync(info.dir, { recursive: true, mode: 0o700 });
  const bytes = typeof value === "string" ? new TextEncoder().encode(value) : value;
  if (!bytes.byteLength) throw new Error(`secret ${name}: empty value`);
  const file = fileOf(info, name);
  if (info.backend === "dpapi") {
    const tmp = `${file}.${process.pid}.tmp`;
    const blob = loadDpapi().protect(bytes, entropyV2(name));
    const out = new Uint8Array(4 + blob.byteLength);
    out.set(DPAPI_V2);
    out.set(blob, 4);
    writeFileSync(tmp, out);
    renameSync(tmp, file);
    return;
  }
  // systemd-creds writes the output file itself (0600) and binds the credential name.
  creds(info, ["encrypt", `--name=${name}`, "-", file], bytes);
}

export function secretGetBytes(name: string): Uint8Array | undefined {
  assertName(name);
  const info = storeInfo();
  const file = locate(info, name);
  if (!file) return undefined;
  if (info.backend === "dpapi") {
    const raw = new Uint8Array(readFileSync(file));
    return isV2(raw) ? loadDpapi().unprotect(raw.subarray(4), entropyV2(name)) : loadDpapi().unprotect(raw);
  }
  return creds(info, ["decrypt", `--name=${name}`, file, "-"]);
}

export function secretGet(name: string): string | undefined {
  const b = secretGetBytes(name);
  return b === undefined ? undefined : new TextDecoder().decode(b);
}

export function secretHas(name: string): boolean {
  assertName(name);
  return locate(storeInfo(), name) !== undefined;
}

export function secretList(): string[] {
  const info = storeInfo();
  const names = new Set<string>();
  for (const dir of [info.dir, ...(info.legacy ?? [])]) {
    if (!existsSync(dir)) continue;
    for (const f of readdirSync(dir)) {
      if (info.backend === "dpapi" && !f.endsWith(".dpapi")) continue;
      const n = info.backend === "dpapi" ? f.replace(/\.dpapi$/, "") : f;
      if (NAME.test(n) && !n.startsWith(".")) names.add(n);
    }
  }
  return [...names].sort();
}

export function secretDelete(name: string): boolean {
  assertName(name);
  const info = storeInfo();
  let hit = false;
  for (const dir of [info.dir, ...(info.legacy ?? [])]) {
    const file = fileOf({ ...info, dir }, name);
    if (!existsSync(file)) continue;
    rmSync(file);
    hit = true;
  }
  return hit;
}

/** Store first, then the process environment (which `loadMonorepoEnv` fills from `.env`). */
export function resolveSecret(
  name: string,
  env: Readonly<Record<string, string | undefined>> = process.env,
): string | undefined {
  try {
    const v = secretGet(name);
    if (v) return v;
  } catch {
    // Store unavailable on this host: fall back to the environment.
  }
  return env[name] || undefined;
}
