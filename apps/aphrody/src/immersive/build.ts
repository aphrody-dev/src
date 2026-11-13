// Build step of the immersive stage: texture set from assets/library (512 px WebP via Bun.Image), the home
// and play bundles. Called from apps/aphrody/build.ts.
import { existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";

export const STAGE_MATERIALS: { name: string; dir: string }[] = [
  { name: "aerial_grass_rock", dir: "textures/polyhaven/aerial_grass_rock" },
  { name: "aerial_rocks_02", dir: "textures/polyhaven/aerial_rocks_02" },
];
const MAPS: [string, string][] = [
  ["diff", "diff"],
  ["nor", "nor_gl"],
  ["rough", "rough"],
];

export async function buildImmersive(
  root: string,
  dist: string,
  entries: Record<string, string>,
): Promise<string[]> {
  const log: string[] = [];
  const lib = join(root, "..", "..", "assets", "library");
  const out = join(dist, "stage");
  mkdirSync(out, { recursive: true });
  for (const m of STAGE_MATERIALS)
    for (const [suffix, src] of MAPS) {
      const from = join(lib, m.dir, `${m.name}_${src}_1k.jpg`);
      if (!existsSync(from))
        throw new Error(`stage texture missing in the asset library: ${from}`);
      const bytes = await new Bun.Image(await Bun.file(from).bytes())
        .resize(512, 512)
        .webp({ quality: 82 })
        .toBuffer();
      await Bun.write(join(out, `${m.name}_${suffix}.webp`), bytes);
      log.push(`stage/${m.name}_${suffix}.webp ${bytes.byteLength} B`);
    }
  const audio = join(out, "audio");
  mkdirSync(audio, { recursive: true });
  for (const f of ["rollover1.ogg", "click1.ogg"]) {
    const from = join(lib, "audio", "ui", f);
    if (!existsSync(from))
      throw new Error(`stage sound missing in the asset library: ${from}`);
    await Bun.write(join(audio, f), Bun.file(from));
    log.push(`stage/audio/${f}`);
  }
  for (const [name, entry] of Object.entries(entries)) {
    const r = await Bun.build({
      entrypoints: [join(root, "src", "immersive", entry)],
      outdir: dist,
      naming: name,
      minify: true,
      target: "browser",
      format: "esm",
    });
    if (!r.success)
      throw new Error(`immersive bundle ${name}: ${r.logs.join("\n")}`);
    log.push(`${name} ${r.outputs[0]!.size} B`);
  }
  return log;
}
