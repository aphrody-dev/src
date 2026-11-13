// Publishes assets/brand/gen to https://cdn.aphrody.com/brand/v<version>/ (R2 bucket aphrody-assets,
// worker cdn-aphrody-com), immutable:
//  1. every file of gen/manifest.json is re-hashed (sha256) and must match, and manifest.json must match
//     manifest.json.sha256: what is uploaded is exactly what the build proved;
//  2. rclone copies by content type with `--immutable --checksum`: an existing object with other bytes
//     is an error (a visual change needs a new [brand] version), identical objects are skipped;
//  3. manifest.json and its .sha256 go last, then the live manifest is fetched back and compared.
// Objects carry Cache-Control immutable; the worker adds the same header plus CORS and CORP on /brand/v*/.
// Runs on fr1 (rclone remote `r2`, see infra/fleet): bun assets/brand/publish.ts [--dry-run]
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { extname, join } from "node:path";

const GEN = join(import.meta.dir, "gen");
const REMOTE = process.env.BRAND_RCLONE_REMOTE ?? "r2:aphrody-assets";
const dry = process.argv.includes("--dry-run");
const CACHE = "public, max-age=31536000, immutable";
const TYPES: Record<string, string> = {
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/vnd.microsoft.icon",
  ".avif": "image/avif",
  ".webp": "image/webp",
  ".webm": "video/webm",
  ".woff2": "font/woff2",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json",
  ".webmanifest": "application/manifest+json",
  ".js": "text/javascript; charset=utf-8",
  ".wasm": "application/wasm",
  ".glb": "model/gltf-binary",
  ".ktx2": "image/ktx2",
  ".html": "text/html; charset=utf-8",
};
const type = (f: string) => TYPES[extname(f)] ?? "text/plain; charset=utf-8";
const sha256 = async (f: string) =>
  new Bun.CryptoHasher("sha256")
    .update(await Bun.file(f).arrayBuffer())
    .digest("hex");

const text = await Bun.file(join(GEN, "manifest.json")).text();
const pinned = (await Bun.file(join(GEN, "manifest.json.sha256")).text()).split(
  /\s+/,
)[0];
const msha = new Bun.CryptoHasher("sha256").update(text).digest("hex");
if (msha !== pinned)
  throw new Error(
    `manifest.json sha256 ${msha} != manifest.json.sha256 ${pinned}`,
  );
const manifest = JSON.parse(text) as {
  version: number;
  base: string;
  files: Record<string, { size: number; sha256: string }>;
};
for (const [f, { sha256: want }] of Object.entries(manifest.files)) {
  const got = await sha256(join(GEN, f));
  if (got !== want) throw new Error(`${f}: sha256 ${got} != manifest ${want}`);
}
const dest = `${REMOTE}/brand/v${manifest.version}`;
const groups = new Map<string, string[]>();
for (const f of Object.keys(manifest.files))
  groups.set(type(f), [...(groups.get(type(f)) ?? []), f]);

const tmp = mkdtempSync(join(tmpdir(), "brand-publish-"));
function rclone(files: string[], contentType: string): void {
  const list = join(tmp, "files.txt");
  writeFileSync(list, files.join("\n") + "\n");
  const args = [
    "rclone",
    "copy",
    GEN,
    dest,
    "--files-from",
    list,
    "--immutable",
    "--checksum",
    "--s3-no-check-bucket",
    "--header-upload",
    `Content-Type: ${contentType}`,
    "--header-upload",
    `Cache-Control: ${CACHE}`,
    "--transfers",
    "8",
    "--stats-one-line",
    "-v",
    ...(dry ? ["--dry-run"] : []),
  ];
  const r = Bun.spawnSync(args, { stdout: "inherit", stderr: "inherit" });
  if (r.exitCode !== 0)
    throw new Error(
      `rclone (${contentType}) exited ${r.exitCode}: an existing object differs (immutable) or the upload failed`,
    );
}
for (const [ct, files] of [...groups].sort(([a], [b]) => a.localeCompare(b))) {
  console.log(`${files.length} x ${ct}`);
  rclone(files, ct);
}
rclone(["manifest.json"], "application/json");
rclone(["manifest.json.sha256"], "text/plain; charset=utf-8");
rmSync(tmp, { recursive: true, force: true });
if (dry) process.exit(0);

const live = await (
  await fetch(`${manifest.base}manifest.json`, { cache: "no-store" })
).text();
const lsha = new Bun.CryptoHasher("sha256").update(live).digest("hex");
if (lsha !== msha)
  throw new Error(
    `live ${manifest.base}manifest.json sha256 ${lsha} != ${msha}`,
  );
console.log(
  `published ${Object.keys(manifest.files).length} files, manifest sha256 ${msha}, ${manifest.base}`,
);
