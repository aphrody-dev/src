// Fetches the third-party inputs of the brand build, pinned and verified:
//  - Material Symbols Rounded (fill 1, 48 px) from google/material-design-icons at a fixed commit,
//    written to assets/brand/symbols/ (committed, Apache-2.0, see symbols/NOTICE);
//  - Google Sans Flex (variable TTF, SIL OFL 1.1) from google/fonts at a fixed commit, verified against its git blob
//    SHA-1, written to assets/brand/gen-cache/ (not committed).
// Usage: bun assets/brand/fetch.ts
import { mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";

const ROOT = import.meta.dir;
const SYMBOLS_COMMIT = "10ecc14790612ca8fd164e3f4ffe9c16fc50d5b7";
const FONTS_COMMIT = "bd8f81ddb5c74d5c8897b36ad88b440266245103";
const FONTS_PATH = "ofl/googlesansflex/GoogleSansFlex%5BROND,opsz,slnt,wdth,wght%5D.ttf";
const FONT_BLOB_SHA1 = "1d8d8ae5a7c6d0e48312d2a0a478bad92caee73a";

function gitBlobSha1(bytes: Uint8Array): string {
  const h = new Bun.CryptoHasher("sha1");
  h.update(`blob ${bytes.length}\0`);
  h.update(bytes);
  return h.digest("hex");
}

async function get(url: string): Promise<Uint8Array> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
  return new Uint8Array(await res.arrayBuffer());
}

const manifest = Bun.TOML.parse(await Bun.file(join(ROOT, "brand.toml")).text()) as {
  product: { symbol: string }[];
};
const symbols = [...new Set(manifest.product.map((p) => p.symbol))].sort();
mkdirSync(join(ROOT, "symbols"), { recursive: true });
for (const s of symbols) {
  const out = join(ROOT, "symbols", `${s}.svg`);
  const url = `https://raw.githubusercontent.com/google/material-design-icons/${SYMBOLS_COMMIT}/symbols/web/${s}/materialsymbolsrounded/${s}_fill1_48px.svg`;
  await Bun.write(out, await get(url));
  console.log(`symbol ${s}`);
}

mkdirSync(join(ROOT, "gen-cache"), { recursive: true });
const fontOut = join(ROOT, "gen-cache", "GoogleSansFlex.ttf");
if (!existsSync(fontOut) || gitBlobSha1(new Uint8Array(await Bun.file(fontOut).arrayBuffer())) !== FONT_BLOB_SHA1) {
  const font = await get(`https://raw.githubusercontent.com/google/fonts/${FONTS_COMMIT}/${FONTS_PATH}`);
  const sha = gitBlobSha1(font);
  if (sha !== FONT_BLOB_SHA1) throw new Error(`Google Sans Flex: blob ${sha}, expected ${FONT_BLOB_SHA1}`);
  await Bun.write(fontOut, font);
}
console.log(`font ${FONT_BLOB_SHA1}`);
