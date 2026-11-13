// Checks assets/brand/gen after `ay brand build` (fr1): every file of manifest.json has its sha256,
// nothing outside the manifest, every URL of fonts.css / symbols.css / srcset.json resolves, every
// glTF validates (gltf-transform validate, Khronos validator) and every symbol of brand.toml is in the
// sprite. Reproducibility: `just brand` builds twice on fr1 and compares the two manifest sha256.
// Usage: bun assets/brand/check.ts
import { readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const GEN = join(import.meta.dir, "gen");
const fail: string[] = [];
const sha256 = async (f: string) => new Bun.CryptoHasher("sha256").update(await Bun.file(f).arrayBuffer()).digest("hex");
const text = await Bun.file(join(GEN, "manifest.json")).text();
const manifest = JSON.parse(text) as { files: Record<string, { size: number; sha256: string }> };
const pinned = (await Bun.file(join(GEN, "manifest.json.sha256")).text()).split(/\s+/)[0];
if (new Bun.CryptoHasher("sha256").update(text).digest("hex") !== pinned) fail.push("manifest.json != manifest.json.sha256");

for (const [f, { size, sha256: want }] of Object.entries(manifest.files)) {
  const p = join(GEN, f);
  if (!(await Bun.file(p).exists())) fail.push(`${f}: missing`);
  else if (statSync(p).size !== size || (await sha256(p)) !== want) fail.push(`${f}: size or sha256 differs`);
}
const walk = (d: string): string[] => readdirSync(d).flatMap((n) => (statSync(join(d, n)).isDirectory() ? walk(join(d, n)) : [join(d, n)]));
for (const f of walk(GEN).map((p) => relative(GEN, p).replaceAll("\\", "/"))) {
  if (!(f in manifest.files) && f !== "manifest.json" && f !== "manifest.json.sha256") fail.push(`${f}: not in manifest.json`);
}

for (const css of ["fonts/fonts.css", "symbols/symbols.css"]) {
  const dir = css.split("/")[0];
  for (const [, url] of (await Bun.file(join(GEN, css)).text()).matchAll(/url\(([^)]+)\)/g)) {
    if (!(`${dir}/${url}` in manifest.files)) fail.push(`${css}: ${url} not generated`);
  }
}
const srcset = (await Bun.file(join(GEN, "img/srcset.json")).json()) as Record<string, { avif: string; webp: string }>;
for (const [key, s] of Object.entries(srcset)) {
  for (const part of [...s.avif.split(", "), ...s.webp.split(", ")]) {
    if (!(part.split(" ")[0]! in manifest.files)) fail.push(`srcset ${key}: ${part}`);
  }
}

const brand = Bun.TOML.parse(await Bun.file(join(import.meta.dir, "brand.toml")).text()) as { symbols?: { names: string[] } };
const sprite = await Bun.file(join(GEN, "symbols/sprite.svg")).text();
for (const n of brand.symbols?.names ?? []) {
  for (const id of [n, `${n}-fill`]) if (!sprite.includes(`<symbol id="${id}"`)) fail.push(`sprite: ${id} missing`);
}

for (const glb of Object.keys(manifest.files).filter((f) => f.endsWith(".glb"))) {
  const r = Bun.spawnSync(["gltf-transform", "validate", join(GEN, glb)], { stdout: "pipe", stderr: "pipe" });
  const out = (r.stdout.toString() + r.stderr.toString()).replace(/\x1b\[[0-9;]*m/g, "");
  // Report sections ERROR / WARNING / INFO / HINT; only errors fail (the Khronos validator has no
  // decoder for EXT_meshopt_compression and KHR_texture_basisu and says so as warnings).
  if (r.exitCode !== 0 || !/ERROR\s+[\s\S]*?No errors found/.test(out)) fail.push(`${glb}: gltf-transform validate\n${out}`);
}

if (fail.length) {
  console.error(fail.join("\n"));
  process.exit(1);
}
console.log(`ok: ${Object.keys(manifest.files).length} files, manifest sha256 ${pinned}`);
