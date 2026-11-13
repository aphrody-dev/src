// Build step of /os: HTML in five locales, the client bundle, logo and wallpapers from the owner assets,
// pinned third-party runtimes (vendor.ts), and the stage textures shared with the immersive build.
import {
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
} from "node:fs";
import { join } from "node:path";
import { OS_LOCALES, renderOs } from "./page.ts";
import { fetchVendor } from "./vendor.ts";

export const WALLPAPERS = [
  "aphrody-dark-mesh",
  "aphrody-dark-aurora",
  "aphrody-dark-facets",
  "aphrody-dark-stars",
  "aphrody-dark-topo",
  "ember-dark-aurora",
];

export async function buildOs(
  root: string,
  dist: string,
  emit: (rel: string, content: string | Uint8Array) => void,
): Promise<string[]> {
  const log: string[] = [];
  const repo = join(root, "..", "..");
  emit(
    "os/aphrody.svg",
    readFileSync(
      join(repo, "assets", "brand", "gen", "owner", "mark-owner-draft.min.svg"),
    ),
  );
  // Real vendor icons (favicons fetched by `ay assets icons`), shown for the products they identify.
  const vend = join(repo, "assets", "library", "icons", "vendors");
  for (const f of readdirSync(vend).filter((n) => n !== "index.json"))
    emit(`os/ico/${f}`, readFileSync(join(vend, f)));
  const games = join(root, "src", "data", "games.json");
  emit("os/games.json", existsSync(games) ? readFileSync(games) : "[]");
  for (const l of OS_LOCALES)
    emit(
      l === "en" ? "os/index.html" : `os/${l}/index.html`,
      renderOs(repo, l, ""),
    );
  const r = await Bun.build({
    entrypoints: [join(root, "src", "os", "client", "os.ts")],
    outdir: join(dist, "os"),
    naming: "os.js",
    minify: true,
    target: "browser",
    format: "esm",
  });
  if (!r.success) throw new Error(`os bundle: ${r.logs.join("\n")}`);
  log.push(`os/os.js ${r.outputs[0]!.size} B`);
  const thumbs = join(repo, "assets", "generated", "wallpapers", "thumbs");
  for (const w of WALLPAPERS) {
    const f = join(thumbs, `${w}-d.webp`);
    if (!existsSync(f)) throw new Error(`wallpaper missing: ${f}`);
    emit(`os/wall/${w}.webp`, readFileSync(f));
  }
  const vendor = join(root, "var", "os-vendor");
  mkdirSync(vendor, { recursive: true });
  log.push(...(await fetchVendor(vendor)));
  cpSync(vendor, join(dist, "os", "vendor"), {
    recursive: true,
    filter: (s) => !s.split(/[\\/]/).pop()!.startsWith("."),
  });
  return log;
}
