// Fetches the third-party inputs of the brand build, pinned and verified (no network in `ay brand build`):
//  - Material Symbols Rounded SVGs from google/material-design-icons at a fixed commit: the 48 px fill 1
//    glyph of every product tile (symbols/<name>.svg) and the 24 px outline and fill SVGs of every
//    [symbols] name (symbols/24/), committed, Apache-2.0 (symbols/NOTICE);
//  - the Material Symbols Rounded variable font and its codepoints (gen-cache/, git blob verified);
//  - the [[font]] files of brand.toml from google/fonts at a fixed commit, each verified against its git
//    blob SHA-1, with its OFL.txt, refused unless it is SIL OFL 1.1 without a Reserved Font Name.
// Usage: bun assets/brand/fetch.ts
import { existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const ROOT = import.meta.dir;
const SYMBOLS_COMMIT = "10ecc14790612ca8fd164e3f4ffe9c16fc50d5b7";
const SYMBOLS_FONT =
  "variablefont/MaterialSymbolsRounded%5BFILL,GRAD,opsz,wght%5D";
const SYMBOLS_FONT_BLOB = "ff99804f914a1db645bcf066dafa9449d9196f8d";
const SYMBOLS_CODEPOINTS_BLOB = "00d0111f220582144a76a352fd62d62b7e421e70";
const FONTS_COMMIT = "bd8f81ddb5c74d5c8897b36ad88b440266245103";

type Manifest = {
  brand: { font_file: string };
  product: { symbol: string }[];
  symbols: { names: string[]; font_file: string; codepoints_file: string };
  font: { id: string; path: string; blob: string }[];
};

function gitBlobSha1(bytes: Uint8Array): string {
  const h = new Bun.CryptoHasher("sha1");
  h.update(`blob ${bytes.length}\0`);
  h.update(bytes);
  return h.digest("hex");
}

async function get(url: string): Promise<Uint8Array> {
  for (let i = 0; ; i++) {
    const res = await fetch(url);
    if (res.ok) return new Uint8Array(await res.arrayBuffer());
    if (i === 2) throw new Error(`${url}: HTTP ${res.status}`);
  }
}

// Writes `out` from `url` unless it already holds the blob `sha1`.
async function pinned(out: string, url: string, sha1: string): Promise<void> {
  if (
    existsSync(out) &&
    gitBlobSha1(new Uint8Array(await Bun.file(out).arrayBuffer())) === sha1
  )
    return;
  const bytes = await get(url);
  const got = gitBlobSha1(bytes);
  if (got !== sha1) throw new Error(`${url}: blob ${got}, expected ${sha1}`);
  await Bun.write(out, bytes);
}

const m = Bun.TOML.parse(
  await Bun.file(join(ROOT, "brand.toml")).text(),
) as Manifest;
const raw = (repo: string, commit: string, path: string) =>
  `https://raw.githubusercontent.com/${repo}/${commit}/${path}`;
const icons = (name: string, file: string) =>
  raw(
    "google/material-design-icons",
    SYMBOLS_COMMIT,
    `symbols/web/${name}/materialsymbolsrounded/${file}`,
  );

mkdirSync(join(ROOT, "symbols", "24"), { recursive: true });
for (const s of [...new Set(m.product.map((p) => p.symbol))].sort()) {
  await Bun.write(
    join(ROOT, "symbols", `${s}.svg`),
    await get(icons(s, `${s}_fill1_48px.svg`)),
  );
}
for (const s of m.symbols.names) {
  await Bun.write(
    join(ROOT, "symbols", "24", `${s}.svg`),
    await get(icons(s, `${s}_24px.svg`)),
  );
  await Bun.write(
    join(ROOT, "symbols", "24", `${s}-fill.svg`),
    await get(icons(s, `${s}_fill1_24px.svg`)),
  );
}
console.log(
  `symbols ${m.symbols.names.length} x 2 at ${SYMBOLS_COMMIT.slice(0, 12)}`,
);

mkdirSync(join(ROOT, "gen-cache", "fonts"), { recursive: true });
const mds = (ext: string) =>
  raw("google/material-design-icons", SYMBOLS_COMMIT, `${SYMBOLS_FONT}.${ext}`);
await pinned(join(ROOT, m.symbols.font_file), mds("ttf"), SYMBOLS_FONT_BLOB);
await pinned(
  join(ROOT, m.symbols.codepoints_file),
  mds("codepoints"),
  SYMBOLS_CODEPOINTS_BLOB,
);
console.log(`symbols font ${SYMBOLS_FONT_BLOB}`);

const url = (path: string) =>
  raw(
    "google/fonts",
    FONTS_COMMIT,
    path.replace(/\[/g, "%5B").replace(/\]/g, "%5D"),
  );
for (const f of m.font) {
  await pinned(
    join(ROOT, "gen-cache", "fonts", `${f.id}.ttf`),
    url(f.path),
    f.blob,
  );
  const ofl = new TextDecoder().decode(
    await get(url(f.path.replace(/[^/]+$/, "OFL.txt"))),
  );
  if (!ofl.includes("SIL Open Font License, Version 1.1"))
    throw new Error(`${f.id}: not SIL OFL 1.1`);
  if (/Reserved Font Name/i.test(ofl.split("-----")[0] ?? ""))
    throw new Error(`${f.id}: declares a Reserved Font Name`);
  await Bun.write(join(ROOT, "gen-cache", "fonts", `${f.id}-OFL.txt`), ofl);
  console.log(`font ${f.id} ${f.blob}`);
}
// The brand font of the SVG text outlining is the google-sans-flex file above.
await Bun.write(
  join(ROOT, m.brand.font_file),
  Bun.file(join(ROOT, "gen-cache", "fonts", "google-sans-flex.ttf")),
);

// CC0 studio HDRI of the [environment] section (Poly Haven, 1k OpenEXR), pinned by sha256.
const ENV_URL =
  "https://dl.polyhaven.org/file/ph-assets/HDRIs/exr/1k/studio_small_09_1k.exr";
const ENV_SHA256 =
  "44dcbed056512ecd8afd2a3d7ba73d2dd4c24694d0c72005fafcb2469bbc8fd4";
const env = (m as unknown as { environment?: { file: string } }).environment;
if (env) {
  const out = join(ROOT, env.file);
  mkdirSync(join(out, ".."), { recursive: true });
  const sha256 = (b: Uint8Array) =>
    new Bun.CryptoHasher("sha256").update(b).digest("hex");
  if (
    !existsSync(out) ||
    sha256(new Uint8Array(await Bun.file(out).arrayBuffer())) !== ENV_SHA256
  ) {
    const bytes = await get(ENV_URL);
    if (sha256(bytes) !== ENV_SHA256)
      throw new Error(`${ENV_URL}: sha256 mismatch`);
    await Bun.write(out, bytes);
  }
  console.log(`environment ${ENV_SHA256.slice(0, 16)}`);
}
