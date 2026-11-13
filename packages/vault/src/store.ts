// SPDX-License-Identifier: Apache-2.0
/**
 * Local layer, async: one encrypted file per secret, named after the environment variable it feeds.
 * Same on-disk format as the env-kit store v1 (DPAPI blob with the v1 entropy, or a systemd-creds
 * credential bound to its name), so both read each other's files.
 *
 * Values travel through memory, stdin and child environments only: never argv, never stdout.
 */

import { mkdir, readdir, readFile, rename, rm, stat, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { localStore, type LocalStoreInfo, WIN } from "./paths.ts";
import { dpapiProtect, dpapiUnprotect } from "./win/pool.ts";

/**
 * DPAPI file formats. v1 (env-kit): the raw DPAPI blob, fixed entropy "aphrody/env-kit/secret-store/v1".
 * v2: "AYD2" + DPAPI blob whose entropy is "aphrody/vault/dpapi/v2|<NAME>": a blob renamed to another
 * secret no longer decrypts. Both are read; every write is v2 (lazy migration). A raw DPAPI blob
 * starts with 01 00 00 00 (dwVersion), so the magic cannot collide.
 */
export const DPAPI_V2 = new TextEncoder().encode("AYD2");
export const entropyV2 = (name: string): Uint8Array => new TextEncoder().encode(`aphrody/vault/dpapi/v2|${name}`);
export const isDpapiV2 = (b: Uint8Array): boolean => b.byteLength > 4 && DPAPI_V2.every((c, i) => b[i] === c);

export async function dpapiEncode(name: string, data: Uint8Array): Promise<Uint8Array> {
  const blob = await dpapiProtect(data, entropyV2(name));
  const out = new Uint8Array(4 + blob.byteLength);
  out.set(DPAPI_V2);
  out.set(blob, 4);
  return out;
}

export async function dpapiDecode(name: string, file: Uint8Array): Promise<Uint8Array> {
  return isDpapiV2(file) ? dpapiUnprotect(file.subarray(4), entropyV2(name)) : dpapiUnprotect(file);
}

export const NAME = /^[A-Za-z_][A-Za-z0-9_.-]{0,127}$/;

export function assertName(name: string): void {
  if (!NAME.test(name)) throw new Error(`invalid secret name: ${JSON.stringify(name)}`);
}

const enc = new TextEncoder();
const dec = new TextDecoder();
const fileName = (info: LocalStoreInfo, name: string): string => (info.backend === "dpapi" ? `${name}.dpapi` : name);

async function mtime(p: string): Promise<number | undefined> {
  try {
    return (await stat(p)).mtimeMs;
  } catch {
    return undefined;
  }
}

/** Newest existing file among the store and its read-only fallbacks. */
async function locate(info: LocalStoreInfo, name: string): Promise<string | undefined> {
  let best: string | undefined;
  let bestAt = -1;
  for (const d of [info.dir, ...info.legacy]) {
    const p = join(d, fileName(info, name));
    const t = await mtime(p);
    if (t !== undefined && t > bestAt) [best, bestAt] = [p, t];
  }
  return best;
}

// --- systemd-creds (async spawn) ---------------------------------------------------------------

export async function creds(user: boolean, args: string[], input?: Uint8Array): Promise<Uint8Array> {
  const p = Bun.spawn(["systemd-creds", ...(user ? ["--user"] : []), ...args], {
    stdin: input ? input : "ignore",
    stdout: "pipe",
    stderr: "pipe",
  });
  const [out, err, code] = await Promise.all([new Response(p.stdout).bytes(), new Response(p.stderr).text(), p.exited]);
  // stderr of systemd-creds never contains the payload.
  if (code !== 0) throw new Error(`systemd-creds ${args[0]} failed: ${err.trim()}`);
  return out;
}

/** Encrypts bytes with the local layer only (no file): DPAPI blob or systemd-creds credential. */
export async function protect(name: string, data: Uint8Array): Promise<Uint8Array> {
  const info = localStore();
  if (info.backend === "dpapi") return dpapiEncode(name, data);
  return creds(info.backend === "systemd-creds-user", ["encrypt", `--name=${name}`, "-", "-"], data);
}

export async function unprotect(name: string, data: Uint8Array): Promise<Uint8Array> {
  const info = localStore();
  if (info.backend === "dpapi") return dpapiDecode(name, data);
  return creds(info.backend === "systemd-creds-user", ["decrypt", `--name=${name}`, "-", "-"], data);
}

// --- Public API ---------------------------------------------------------------------------------

export async function setSecret(name: string, value: string | Uint8Array): Promise<void> {
  assertName(name);
  const bytes = typeof value === "string" ? enc.encode(value) : value;
  if (!bytes.byteLength) throw new Error(`secret ${name}: empty value`);
  const info = localStore();
  await mkdir(info.dir, { recursive: true, mode: 0o700 });
  const file = join(info.dir, fileName(info, name));
  if (info.backend === "dpapi") {
    const tmp = `${file}.${process.pid}.tmp`;
    await writeFile(tmp, await dpapiEncode(name, bytes), { mode: 0o600 });
    await rename(tmp, file);
    return;
  }
  // systemd-creds writes the output file itself (0600) and binds the credential name; hidden tmp + rename.
  const tmp = join(info.dir, `.${name}.${process.pid}.tmp`);
  await creds(info.backend === "systemd-creds-user", ["encrypt", `--name=${name}`, "-", tmp], bytes);
  await rename(tmp, file);
}

export async function getSecretBytes(name: string): Promise<Uint8Array | undefined> {
  assertName(name);
  const info = localStore();
  const file = await locate(info, name);
  if (!file) return undefined;
  if (info.backend === "dpapi") return dpapiDecode(name, new Uint8Array(await readFile(file)));
  return creds(info.backend === "systemd-creds-user", ["decrypt", `--name=${name}`, file, "-"]);
}

export async function getSecret(name: string): Promise<string | undefined> {
  const b = await getSecretBytes(name);
  if (b === undefined) return undefined;
  const s = dec.decode(b);
  b.fill(0);
  return s;
}

export async function hasSecret(name: string): Promise<boolean> {
  assertName(name);
  return (await locate(localStore(), name)) !== undefined;
}

export async function listSecrets(): Promise<string[]> {
  const info = localStore();
  const names = new Set<string>();
  for (const d of [info.dir, ...info.legacy]) {
    let entries: string[] = [];
    try {
      entries = await readdir(d);
    } catch (e) {
      // Fail closed: only a missing directory means "no secret" (an empty list would revoke on the hosts).
      if ((e as NodeJS.ErrnoException).code === "ENOENT") continue;
      throw e;
    }
    for (const f of entries) {
      const n = info.backend === "dpapi" ? f.replace(/\.dpapi$/, "") : f;
      if ((info.backend !== "dpapi" || f.endsWith(".dpapi")) && NAME.test(n) && !n.startsWith(".")) names.add(n);
    }
  }
  return [...names].sort();
}

/** Removes the secret from the store and from every fallback location. */
export async function deleteSecret(name: string): Promise<boolean> {
  assertName(name);
  const info = localStore();
  let hit = false;
  for (const d of [info.dir, ...info.legacy]) {
    const p = join(d, fileName(info, name));
    if ((await mtime(p)) === undefined) continue;
    await rm(p);
    hit = true;
  }
  return hit;
}

/** Runs a child with the secrets in its environment (`exec`) or one secret on its stdin (`pipe`). */
export async function runWithSecrets(
  names: string[],
  command: string[],
  mode: "exec" | "pipe" = "exec",
): Promise<{ code: number; missing: string[] }> {
  const values = await Promise.all(names.map(async (n) => [n, await getSecret(n)] as const));
  const missing = values.filter(([, v]) => v === undefined).map(([n]) => n);
  if (missing.length) return { code: 1, missing };
  const env = mode === "exec" ? { ...process.env, ...Object.fromEntries(values) } : process.env;
  const p = Bun.spawn(command, {
    env: env as Record<string, string>,
    stdin: mode === "pipe" ? enc.encode(values[0]![1]!) : "inherit",
    stdout: "inherit",
    stderr: "inherit",
  });
  return { code: await p.exited, missing: [] };
}

/** Store first, then the environment. Never throws: a host without a store falls back to env. */
export async function resolveSecret(
  name: string,
  env: Readonly<Record<string, string | undefined>> = process.env,
): Promise<string | undefined> {
  try {
    const v = await getSecret(name);
    if (v) return v;
  } catch {
    // Store unavailable on this host.
  }
  return env[name] || undefined;
}

export { WIN };
