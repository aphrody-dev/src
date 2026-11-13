/**
 * Windows Package Manager. winget has no search REST API for the community repository: the client
 * itself downloads the signed source package (an MSIX, a zip64 archive) whose Public/index.db is a
 * SQLite database of every package. This driver does the same and queries that database.
 */

import { Database } from "bun:sqlite";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "fs";
import { join } from "path";
import { getBytes, LIMIT, SourceError, type DriverContext } from "../http";
import type { StorePackage } from "../types";

export const WINGET_SOURCE =
  "https://cdn.winget.microsoft.com/cache/source2.msix";
const TTL_MS = 24 * 3600_000;

/** Reads one entry of a zip or zip64 archive (stored or deflate). */
export async function unzipEntry(
  buf: Uint8Array,
  suffix: string,
): Promise<Uint8Array> {
  const dv = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  let e = buf.length - 22;
  while (e >= 0 && dv.getUint32(e, true) !== 0x06054b50) e--;
  if (e < 0) throw new SourceError("bad_payload", "not a zip archive");
  let n = dv.getUint16(e + 10, true);
  let p = dv.getUint32(e + 16, true);
  if (p === 0xffffffff || n === 0xffff) {
    const z = Number(dv.getBigUint64(e - 20 + 8, true));
    n = Number(dv.getBigUint64(z + 32, true));
    p = Number(dv.getBigUint64(z + 48, true));
  }
  for (let i = 0; i < n; i++) {
    const method = dv.getUint16(p + 10, true);
    let cs = dv.getUint32(p + 20, true);
    let us = dv.getUint32(p + 24, true);
    const nl = dv.getUint16(p + 28, true);
    const xl = dv.getUint16(p + 30, true);
    const cl = dv.getUint16(p + 32, true);
    let lo = dv.getUint32(p + 42, true);
    const name = new TextDecoder().decode(buf.subarray(p + 46, p + 46 + nl));
    if (name.endsWith(suffix)) {
      let q = p + 46 + nl;
      const end = q + xl;
      while (q < end) {
        const id = dv.getUint16(q, true);
        const sz = dv.getUint16(q + 2, true);
        if (id === 1) {
          let o = q + 4;
          if (us === 0xffffffff)
            ((us = Number(dv.getBigUint64(o, true))), (o += 8));
          if (cs === 0xffffffff)
            ((cs = Number(dv.getBigUint64(o, true))), (o += 8));
          if (lo === 0xffffffff) lo = Number(dv.getBigUint64(o, true));
        }
        q += 4 + sz;
      }
      const start =
        lo + 30 + dv.getUint16(lo + 26, true) + dv.getUint16(lo + 28, true);
      const data = buf.subarray(start, start + cs);
      if (method === 0) return data;
      if (method !== 8)
        throw new SourceError(
          "bad_payload",
          `zip method ${method} unsupported`,
        );
      return new Uint8Array(
        await new Response(
          new Blob([
            new Uint8Array(
              data.buffer as ArrayBuffer,
              data.byteOffset,
              data.byteLength,
            ),
          ])
            .stream()
            .pipeThrough(new DecompressionStream("deflate-raw")),
        ).arrayBuffer(),
      );
    }
    p += 46 + nl + xl + cl;
  }
  throw new SourceError("bad_payload", `${suffix} not found in archive`);
}

interface Row {
  id: string;
  name: string;
  moniker: string | null;
  latest_version: string;
}

export function queryWinget(db: Database, query: string): StorePackage[] {
  const like = `%${query.replace(/[\\%_]/g, "\\$&")}%`;
  const rows = db
    .query(
      `SELECT id, name, moniker, latest_version FROM packages
       WHERE id LIKE $q ESCAPE '\\' OR name LIKE $q ESCAPE '\\' OR moniker LIKE $q ESCAPE '\\'
       ORDER BY (lower(name) = lower($raw) OR lower(moniker) = lower($raw)) DESC, length(name) ASC
       LIMIT ${LIMIT}`,
    )
    .all({ $q: like, $raw: query }) as Row[];
  return rows.map((r) => ({
    id: `winget-${r.id}`,
    name: r.name,
    ecosystem: "winget" as const,
    version: r.latest_version,
    description: "",
    author: r.id.split(".")[0],
    url: `https://winget.run/pkg/${r.id.replace(".", "/")}`,
    installCmd: `winget install --id ${r.id} -e`,
    tags: [r.id, ...(r.moniker ? [r.moniker] : [])],
  }));
}

let memo: { db: Database; at: number } | undefined;
let loading: Promise<Database> | undefined;

async function load(ctx: DriverContext): Promise<Database> {
  const file = join(ctx.cacheDir, "winget-index.db");
  let at = Date.now();
  if (existsSync(file) && Date.now() - statSync(file).mtimeMs < TTL_MS) {
    at = statSync(file).mtimeMs;
  } else {
    const msix = await getBytes(ctx, WINGET_SOURCE, 90_000);
    const bytes = await unzipEntry(msix, "Public/index.db");
    mkdirSync(ctx.cacheDir, { recursive: true });
    writeFileSync(file, bytes);
  }
  // bun:sqlite has no deserialize(); the cached file is the serialized database.
  const db = new Database(file, { readonly: true });
  memo = { db, at };
  return db;
}

/** Index ready, else the download keeps going in the background and the caller is told to retry. */
async function openIndex(
  ctx: DriverContext,
  waitMs = 12_000,
): Promise<Database> {
  if (memo && Date.now() - memo.at < TTL_MS) return memo.db;
  const p = (loading ??= load(ctx).finally(() => (loading = undefined)));
  let timer: ReturnType<typeof setTimeout>;
  const late = new Promise<never>((_, reject) => {
    timer = setTimeout(
      () =>
        reject(
          new SourceError(
            "timeout",
            "the winget index (4 MB) is still downloading; retry in a few seconds",
          ),
        ),
      waitMs,
    );
  });
  try {
    return await Promise.race([p, late]);
  } finally {
    clearTimeout(timer!);
  }
}

export async function searchWingetPackages(
  query: string,
  ctx: DriverContext,
): Promise<StorePackage[]> {
  return queryWinget(await openIndex(ctx), query);
}
