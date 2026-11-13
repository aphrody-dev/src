// Plugin bun : `import svg from "m3:icon/rounded/<nom>?size=24&fill=1"` renvoie le SVG Material Symbols
// Rounded (Apache-2.0) en chaîne, colorié par currentColor. Source unique : la sortie de `ay brand build`
// (assets/brand/gen/symbols/svg/, sous-ensemble [symbols] de brand.toml, optimisé par usvg) ; un nom
// absent de brand.toml est une erreur de build, pas un téléchargement.
import type { BunPlugin } from "bun";
import { join } from "node:path";

const ROOT = join(
  import.meta.dir,
  "..",
  "..",
  "..",
  "assets",
  "brand",
  "gen",
  "symbols",
  "svg",
);

export async function symbolSvg(
  style: string,
  name: string,
  size = 24,
  fill = false,
): Promise<string> {
  if (style !== "rounded" || !/^[a-z0-9_]+$/.test(name))
    throw new Error(
      `symbole invalide : ${style}/${name} (seul rounded est généré)`,
    );
  const file = Bun.file(join(ROOT, `${name}${fill ? "-fill" : ""}.svg`));
  if (!(await file.exists()))
    throw new Error(
      `symbole absent de assets/brand/gen/symbols : ${name} (ajouter à [symbols] de brand.toml, puis ay brand build)`,
    );
  const svg = await file.text();
  return svg.replace(
    / width="\d+" height="\d+"/,
    ` width="${size}" height="${size}"`,
  );
}

/** Noms des symboles générés (sous-ensemble [symbols] de brand.toml), triés. */
export async function generatedSymbols(): Promise<string[]> {
  const json = (await Bun.file(
    join(ROOT, "..", "symbols.json"),
  ).json()) as Record<string, unknown>;
  return Object.keys(json).sort();
}

export const symbolsPlugin: BunPlugin = {
  name: "aphrody-design-symbols",
  setup(build) {
    build.onResolve({ filter: /^m3:icon\// }, (a) => ({
      path: a.path,
      namespace: "m3-icon",
    }));
    build.onLoad({ filter: /.*/, namespace: "m3-icon" }, async (a) => {
      const [path, query = ""] = a.path.slice("m3:icon/".length).split("?");
      const [style, name] = path.split("/");
      const q = new URLSearchParams(query);
      const svg = await symbolSvg(
        style,
        name,
        Number(q.get("size") ?? 24),
        q.get("fill") === "1",
      );
      return {
        contents: `export default ${JSON.stringify(svg)};`,
        loader: "js",
      };
    });
  },
};
