import { join, normalize, isAbsolute } from "node:path";
import {
  existsSync,
  readdirSync,
  statSync,
  renameSync,
  mkdirSync,
  rmSync,
  createWriteStream,
} from "node:fs";
import { dirname } from "node:path";
import { hashFile } from "./util.ts";

/** SPDX identifiers whose terms allow redistribution in a public repository. */
export const ALLOWED_LICENSES = new Set([
  "CC0-1.0",
  "MIT",
  "Apache-2.0",
  "ISC",
  "OFL-1.1",
  "Unlicense",
  "0BSD",
]);

export const GIT_SIZE_CAP = 5 * 1024 * 1024;

export type Storage = "git" | "remote";

export interface Asset {
  id: string;
  kind: string;
  path: string;
  url: string;
  license: string;
  sha256: string;
  author: string;
  attribution: string;
  storage: Storage;
}

export const libraryRoot = (root: string) => join(root, "assets", "library");

/** Where remote (non-git) files live: `ASSETS_STORE` (e.g. /srv/artifacts/assets on fr1) or the library itself. */
export const storeRoot = (root: string) =>
  process.env.ASSETS_STORE || libraryRoot(root);

export const fileOf = (root: string, a: Asset) =>
  join(a.storage === "remote" ? storeRoot(root) : libraryRoot(root), a.path);

/** Manifest files: manifest.toml plus manifest.<name>.toml (remote packs). */
export function manifestFiles(root: string): string[] {
  const lib = libraryRoot(root);
  if (!existsSync(lib)) return [];
  return readdirSync(lib)
    .filter((n) => /^manifest(\.[\w-]+)?\.toml$/.test(n))
    .sort()
    .map((n) => join(lib, n));
}

export async function loadAll(root: string): Promise<Asset[]> {
  const out: Asset[] = [];
  for (const f of manifestFiles(root))
    out.push(...parseManifest(await Bun.file(f).text()));
  return out;
}

export async function sha256(data: Uint8Array): Promise<string> {
  const h = new Bun.CryptoHasher("sha256");
  h.update(data);
  return h.digest("hex");
}

/**
 * `[[pack]]` keeps big remote manifests small: shared fields once, then
 * `files = ["rel/path|sha256", "rel/path|sha256|https://full/url"]`.
 * url = url_base + rel/path unless a full url is given; id = id_base + "/" + rel/path.
 */
function expandPack(p: Record<string, unknown>): Record<string, unknown>[] {
  const files = (p.files ?? []) as string[];
  return files.map((line) => {
    const [rel = "", hash = "", url] = line.split("|");
    return {
      id: `${p.id_base}/${rel}`,
      kind: p.kind,
      path: `${p.path_base ?? ""}${rel}`,
      url: url ?? `${p.url_base}${rel}`,
      license: p.license,
      sha256: hash,
      author: p.author,
      attribution: p.attribution,
      storage: p.storage ?? "remote",
    };
  });
}

export function parseManifest(text: string): Asset[] {
  const doc = Bun.TOML.parse(text) as {
    asset?: Record<string, unknown>[];
    pack?: Record<string, unknown>[];
  };
  const raw = [...(doc.asset ?? []), ...(doc.pack ?? []).flatMap(expandPack)];
  return raw.map((a) => ({
    id: String(a.id ?? ""),
    kind: String(a.kind ?? ""),
    path: String(a.path ?? ""),
    url: String(a.url ?? ""),
    license: String(a.license ?? ""),
    sha256: String(a.sha256 ?? ""),
    author: String(a.author ?? ""),
    attribution: String(a.attribution ?? ""),
    storage: (a.storage ?? "git") as Storage,
  }));
}

/** Static checks, no filesystem: every entry needs license, hash, source and a safe path. */
export function checkEntries(assets: Asset[]): string[] {
  const errs: string[] = [];
  const ids = new Set<string>();
  const paths = new Set<string>();
  for (const a of assets) {
    const w = a.id || "<no id>";
    if (!a.id) errs.push("entry without id");
    if (ids.has(a.id)) errs.push(`${w}: duplicate id`);
    ids.add(a.id);
    if (paths.has(a.path)) errs.push(`${w}: duplicate path`);
    paths.add(a.path);
    if (!a.license) errs.push(`${w}: missing SPDX license`);
    else if (!ALLOWED_LICENSES.has(a.license))
      errs.push(`${w}: license ${a.license} not allowed`);
    if (!/^[0-9a-f]{64}$/.test(a.sha256))
      errs.push(`${w}: missing or invalid sha256`);
    if (!a.author) errs.push(`${w}: missing author`);
    if (!a.attribution) errs.push(`${w}: missing attribution`);
    if (!/^https:\/\//.test(a.url)) errs.push(`${w}: url must be https`);
    if (a.storage !== "git" && a.storage !== "remote")
      errs.push(`${w}: storage must be git or remote`);
    const p = normalize(a.path).replaceAll("\\", "/");
    if (
      !a.path ||
      isAbsolute(a.path) ||
      p.startsWith("..") ||
      p.includes("/../")
    )
      errs.push(`${w}: unsafe path`);
  }
  return errs;
}

function walk(dir: string, base = ""): string[] {
  const out: string[] = [];
  for (const n of readdirSync(dir)) {
    const rel = base ? `${base}/${n}` : n;
    if (statSync(join(dir, n)).isDirectory())
      out.push(...walk(join(dir, n), rel));
    else out.push(rel);
  }
  return out;
}

/** Full verification against the files on disk. */
export async function verify(root: string, assets: Asset[]): Promise<string[]> {
  const lib = libraryRoot(root);
  const errs = checkEntries(assets);
  for (const a of assets) {
    const f = fileOf(root, a);
    if (!existsSync(f)) {
      if (a.storage === "git") errs.push(`${a.id}: file missing (${a.path})`);
      continue;
    }
    const size = statSync(f).size;
    if (a.storage === "git" && size > GIT_SIZE_CAP)
      errs.push(
        `${a.id}: ${size} bytes exceeds the 5 MB git cap, use storage = "remote"`,
      );
    if ((await hashFile(f)) !== a.sha256) errs.push(`${a.id}: sha256 mismatch`);
  }
  if (existsSync(lib)) {
    const known = new Set(assets.map((a) => a.path));
    for (const f of walk(lib)) {
      if (
        /^manifest(\.[\w-]+)?\.toml$|^(ATTRIBUTION\.md|\.gitignore|repos\.toml)$/.test(
          f,
        ) ||
        f.startsWith("remote/")
      )
        continue;
      if (!known.has(f)) errs.push(`unlisted file ${f}`);
    }
  }
  return errs;
}

/**
 * Download one pinned asset. Resumable: bytes go to `<file>.part`, a re-run continues
 * with a Range request; the file only appears once its sha256 matches.
 */
export async function fetchAsset(
  root: string,
  a: Asset,
): Promise<"ok" | "cached"> {
  const f = fileOf(root, a);
  if (existsSync(f) && (await hashFile(f)) === a.sha256) return "cached";
  mkdirSync(dirname(f), { recursive: true });
  const part = `${f}.part`;
  for (let attempt = 0; attempt < 3; attempt++) {
    const have = existsSync(part) ? statSync(part).size : 0;
    const res = await fetch(a.url, {
      headers: have ? { range: `bytes=${have}-` } : {},
      redirect: "follow",
    });
    if (res.status === 416) {
      rmSync(part, { force: true });
      continue;
    }
    if (!res.ok) throw new Error(`${a.id}: HTTP ${res.status}`);
    const resumed = res.status === 206;
    if (!resumed) rmSync(part, { force: true });
    const out = createWriteStream(part, { flags: resumed ? "a" : "w" });
    try {
      for await (const chunk of res.body as unknown as AsyncIterable<Uint8Array>)
        if (!out.write(chunk)) await new Promise((r) => out.once("drain", r));
    } catch (e) {
      out.destroy();
      if (attempt === 2) throw new Error(`${a.id}: ${String(e)}`);
      continue;
    }
    await new Promise((r) => out.end(r));
    if ((await hashFile(part)) === a.sha256) {
      renameSync(part, f);
      return "ok";
    }
    rmSync(part, { force: true });
  }
  throw new Error(`${a.id}: sha256 mismatch after download`);
}

/** Group entries by (license, attribution, author) for ATTRIBUTION.md. */
export function renderAttribution(assets: Asset[]): string {
  const groups = new Map<string, Asset[]>();
  for (const a of assets) {
    const k = `${a.license}\t${a.attribution.split(";")[0]}\t${a.author}`;
    groups.set(k, [...(groups.get(k) ?? []), a]);
  }
  let out =
    "# Attribution\n\nGenerated by `ay assets attribution` from `manifest*.toml`. Every entry is redistributable (CC0-1.0, MIT, Apache-2.0, OFL-1.1).\n";
  for (const [k, items] of [...groups].sort()) {
    const [license, what, author] = k.split("\t");
    out += `\n## ${what}\n\n- License: ${license}\n- Author: ${author}\n- Files: ${items.length} (${items[0]!.storage === "remote" ? "remote, not committed" : "committed"}); source ${new URL(items[0]!.url).host}\n`;
    // Big remote packs: the manifest is the file list.
    if (items.length <= 50)
      out += items.map((i) => `  - \`${i.path}\``).join("\n") + "\n";
  }
  return out;
}
