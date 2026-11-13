// Build step of /os: HTML in five locales, the client bundle, pet and wallpapers from the owner assets,
// pinned third-party runtimes (vendor.ts), and the stage textures shared with the immersive build.
import { cpSync, existsSync, mkdirSync, readFileSync } from "node:fs";
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

/** Volt (assets/brand/pet/pet.svg) with fixed colours for a plain <img>. */
function petSvg(src: string): string {
  const map: Record<string, string> = {
    body: "#7fd0ff",
    body_dark: "#3d7ea6",
    face: "#1d1a2b",
    eye: "#FFB300",
    bolt: "#FFB300",
    mouth: "M42 59Q48 63 54 59",
    extras: "",
    style: "",
    state: "idle",
    root_t: "",
    arm_l_t: "",
    arm_r_t: "",
    eyes_t: "",
    bolt_op: "1",
  };
  return readFileSync(src, "utf8").replace(
    /\{(\w+)\}/g,
    (_, k: string) => map[k] ?? "",
  );
}

export async function buildOs(
  root: string,
  dist: string,
  emit: (rel: string, content: string | Uint8Array) => void,
): Promise<string[]> {
  const log: string[] = [];
  const repo = join(root, "..", "..");
  const pet = join(repo, "assets", "brand", "pet", "pet.svg");
  if (!existsSync(pet)) throw new Error(`pet artwork missing: ${pet}`);
  emit("os/pet.svg", petSvg(pet));
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
