// Plugin bun : `import svg from "m3:icon/<outlined|rounded|sharp>/<nom>?size=24&fill=1"` renvoie le SVG
// Material Symbols (paquet @material-symbols/svg-400, Apache-2.0) en chaîne, colorié par currentColor.
import type { BunPlugin } from "bun";
import { join } from "node:path";

const ROOT = join(import.meta.dir, "..", "node_modules", "@material-symbols", "svg-400");
const STYLES = new Set(["outlined", "rounded", "sharp"]);

export async function symbolSvg(style: string, name: string, size = 24, fill = false): Promise<string> {
  if (!STYLES.has(style) || !/^[a-z0-9_]+$/.test(name)) throw new Error(`symbole invalide : ${style}/${name}`);
  const file = Bun.file(join(ROOT, style, `${name}${fill ? "-fill" : ""}.svg`));
  if (!(await file.exists())) throw new Error(`symbole absent de @material-symbols/svg-400 : ${style}/${name}`);
  const svg = await file.text();
  return svg.replace(/ width="\d+" height="\d+"/, "").replace("<svg ", `<svg width="${size}" height="${size}" fill="currentColor" aria-hidden="true" `);
}

export const symbolsPlugin: BunPlugin = {
  name: "aphrody-design-symbols",
  setup(build) {
    build.onResolve({ filter: /^m3:icon\// }, (a) => ({ path: a.path, namespace: "m3-icon" }));
    build.onLoad({ filter: /.*/, namespace: "m3-icon" }, async (a) => {
      const [path, query = ""] = a.path.slice("m3:icon/".length).split("?");
      const [style, name] = path.split("/");
      const q = new URLSearchParams(query);
      const svg = await symbolSvg(style, name, Number(q.get("size") ?? 24), q.get("fill") === "1");
      return { contents: `export default ${JSON.stringify(svg)};`, loader: "js" };
    });
  },
};
