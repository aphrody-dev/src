import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";

/** Run `fn` over `items` with at most `n` in flight; results keep input order. */
export async function pool<T, R>(
  items: T[],
  n: number,
  fn: (item: T, i: number) => Promise<R>,
): Promise<R[]> {
  const out = new Array<R>(items.length);
  let next = 0;
  const worker = async () => {
    for (;;) {
      const i = next++;
      if (i >= items.length) return;
      out[i] = await fn(items[i]!, i);
    }
  };
  await Promise.all(
    Array.from({ length: Math.min(n, items.length) }, () => worker()),
  );
  return out;
}

export function hashFile(
  path: string,
  algo: "sha256" | "sha384" = "sha256",
  enc: "hex" | "base64" = "hex",
): Promise<string> {
  return new Promise((res, rej) => {
    const h = createHash(algo);
    createReadStream(path)
      .on("data", (c) => h.update(c))
      .on("end", () => res(h.digest(enc)))
      .on("error", rej);
  });
}

export const hashBytes = (
  b: Uint8Array,
  algo: "sha256" | "sha384" = "sha256",
  enc: "hex" | "base64" = "hex",
) => createHash(algo).update(b).digest(enc);

/** Absolute path of an executable on PATH, or null. */
export const which = (name: string): string | null => Bun.which(name);

export async function run(
  cmd: string[],
  opts: { cwd?: string; env?: Record<string, string>; nice?: boolean } = {},
): Promise<{ ok: boolean; out: string; err: string }> {
  const argv =
    opts.nice && process.platform !== "win32" ? ["nice", ...cmd] : cmd;
  const p = Bun.spawn(argv, {
    cwd: opts.cwd,
    env: { ...process.env, ...opts.env },
    stdout: "pipe",
    stderr: "pipe",
  });
  const [out, err] = await Promise.all([
    new Response(p.stdout).text(),
    new Response(p.stderr).text(),
  ]);
  return { ok: (await p.exited) === 0, out, err };
}

export const posix = (p: string) => p.replaceAll("\\", "/");

/** Sorted-key JSON so generated files are byte-stable. */
export function stableJson(v: unknown): string {
  const sort = (x: unknown): unknown =>
    Array.isArray(x)
      ? x.map(sort)
      : x && typeof x === "object"
        ? Object.fromEntries(
            Object.entries(x as Record<string, unknown>)
              .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
              .map(([k, val]) => [k, sort(val)]),
          )
        : x;
  return JSON.stringify(sort(v), null, 2) + "\n";
}
