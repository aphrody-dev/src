// Build step of /gamescope: the page, the client bundle, the owner font, and the real vendor favicons and owner mark
// that the console atlas shows (nominative use, from `ay assets icons`). The wasm build itself is on the CDN.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { renderGamescope } from "./page.ts";

const ART = [
  "steam.ico",
  "epic.ico",
  "gog.png",
  "itch.ico",
  "xbox.png",
  "nintendo.png",
  "flathub.png",
  "fdroid.png",
  "googleplay.ico",
  "github.svg",
  "bevy.png",
  "artcraft.png",
];

export async function buildGamescope(
  root: string,
  dist: string,
  emit: (rel: string, content: string | Uint8Array) => void,
): Promise<string[]> {
  const repo = join(root, "..", "..");
  emit("gamescope/index.html", renderGamescope());
  const vend = join(repo, "assets", "library", "icons", "vendors");
  for (const f of ART) emit(`gamescope/art/${f}`, readFileSync(join(vend, f)));
  emit(
    "gamescope/art/owner.png",
    readFileSync(join(repo, "assets", "brand", "gen", "owner", "mark-128.png")),
  );
  emit(
    "gamescope/inter.woff2",
    readFileSync(join(repo, "assets", "brand", "gen", "fonts", "inter.woff2")),
  );
  const out = await Bun.build({
    entrypoints: [join(root, "src", "client", "gamescope.ts")],
    outdir: join(dist, "gamescope"),
    naming: "gamescope.js",
    minify: true,
    target: "browser",
    format: "esm",
  });
  if (!out.success) {
    console.error("Gamescope build failed:", out.logs);
    process.exit(1);
  }
  return [
    `- /gamescope: page, client, ${ART.length + 1} icons, font (wasm on cdn.aphrody.com/gamescope)`,
  ];
}
