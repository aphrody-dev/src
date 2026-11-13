// Third-party runtime files of /os, downloaded at build time and verified by SHA-256 (vendor.lock.json).
// Nothing here is committed: files land in apps/aphrody/var/os-vendor (gitignored) and are copied to dist/os/vendor.
// Licenses and sources are listed in docs/games/BROWSER-OS.md.
import { existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";

interface Entry {
  url: string;
  sha256: string;
  /** Output path under the vendor dir; for a zip, `extract` lists the members to keep. */
  out?: string;
  extract?: Record<string, string>;
}
const lock = (await Bun.file(
  join(import.meta.dir, "vendor.lock.json"),
).json()) as Record<string, Entry>;

const hex = (b: ArrayBuffer) =>
  [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, "0")).join("");
const sha = async (b: Uint8Array) =>
  hex(await crypto.subtle.digest("SHA-256", b as BufferSource));

/** Minimal zip reader (central directory, stored or deflate). */
async function unzip(buf: Uint8Array): Promise<Map<string, Uint8Array>> {
  const dv = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  let eocd = buf.length - 22;
  while (eocd >= 0 && dv.getUint32(eocd, true) !== 0x06054b50) eocd--;
  if (eocd < 0) throw new Error("zip: no end of central directory");
  const n = dv.getUint16(eocd + 10, true);
  let p = dv.getUint32(eocd + 16, true);
  const out = new Map<string, Uint8Array>();
  for (let i = 0; i < n; i++) {
    const method = dv.getUint16(p + 10, true);
    const csize = dv.getUint32(p + 20, true);
    const nameLen = dv.getUint16(p + 28, true);
    const extraLen = dv.getUint16(p + 30, true);
    const commentLen = dv.getUint16(p + 32, true);
    const lho = dv.getUint32(p + 42, true);
    const name = new TextDecoder().decode(
      buf.subarray(p + 46, p + 46 + nameLen),
    );
    p += 46 + nameLen + extraLen + commentLen;
    if (name.endsWith("/")) continue;
    const start =
      lho + 30 + dv.getUint16(lho + 26, true) + dv.getUint16(lho + 28, true);
    const raw = buf.subarray(start, start + csize);
    out.set(
      name,
      method === 0
        ? raw
        : new Uint8Array(
            await new Response(
              new Blob([raw as BlobPart])
                .stream()
                .pipeThrough(new DecompressionStream("deflate-raw")),
            ).arrayBuffer(),
          ),
    );
  }
  return out;
}

export async function fetchVendor(dir: string): Promise<string[]> {
  const log: string[] = [];
  for (const [id, e] of Object.entries(lock)) {
    const marker = join(dir, `.${id}.sha256`);
    if (existsSync(marker) && (await Bun.file(marker).text()) === e.sha256) {
      log.push(`vendor ${id}: cached`);
      continue;
    }
    const res = await fetch(e.url);
    if (!res.ok) throw new Error(`vendor ${id}: ${e.url} -> ${res.status}`);
    const bytes = new Uint8Array(await res.arrayBuffer());
    const got = await sha(bytes);
    if (got !== e.sha256)
      throw new Error(`vendor ${id}: sha256 ${got} != pinned ${e.sha256}`);
    const write = async (rel: string, data: Uint8Array) => {
      const f = join(dir, rel);
      mkdirSync(dirname(f), { recursive: true });
      await Bun.write(f, data);
    };
    if (e.extract) {
      const files = await unzip(bytes);
      for (const [from, to] of Object.entries(e.extract)) {
        const d = files.get(from);
        if (!d)
          throw new Error(`vendor ${id}: ${from} missing from the archive`);
        await write(to, d);
      }
    } else await write(e.out!, bytes);
    await Bun.write(marker, e.sha256);
    log.push(`vendor ${id}: ${bytes.length} B verified`);
  }
  return log;
}
