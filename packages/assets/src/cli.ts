#!/usr/bin/env bun
import { join } from "node:path";
import { existsSync } from "node:fs";
import {
  fetchAsset,
  libraryRoot,
  parseManifest,
  renderAttribution,
  verify,
  type Asset,
} from "./manifest.ts";

const root = process.env.SRC_ROOT ?? join(import.meta.dir, "..", "..", "..");
const manifestPath = join(libraryRoot(root), "manifest.toml");
const [cmd = "list", ...args] = Bun.argv.slice(2);

if (!existsSync(manifestPath)) {
  console.error(`manifest not found: ${manifestPath}`);
  process.exit(2);
}
const assets = parseManifest(await Bun.file(manifestPath).text());
const flag = (n: string) => args.includes(`--${n}`);
const opt = (n: string) =>
  args.find((a) => a.startsWith(`--${n}=`))?.slice(n.length + 3);
const select = (): Asset[] =>
  assets.filter(
    (a) =>
      (!opt("kind") || a.kind === opt("kind")) &&
      (!opt("id") || a.id.startsWith(opt("id")!)) &&
      (flag("all") || a.storage === "git" || flag("remote")),
  );

switch (cmd) {
  case "list":
    for (const a of assets.filter(
      (x) => !opt("kind") || x.kind === opt("kind"),
    ))
      console.log(`${a.id}\t${a.kind}\t${a.license}\t${a.storage}\t${a.path}`);
    break;
  case "verify": {
    const errs = await verify(root, assets);
    for (const e of errs) console.error(e);
    console.log(`${assets.length} entries, ${errs.length} errors`);
    process.exitCode = errs.length ? 1 : 0;
    break;
  }
  case "attribution":
    await Bun.write(
      join(libraryRoot(root), "ATTRIBUTION.md"),
      renderAttribution(assets),
    );
    break;
  case "fetch": {
    let failed = 0;
    for (const a of select()) {
      try {
        console.log(`${await fetchAsset(root, a)}\t${a.id}`);
      } catch (e) {
        failed++;
        console.error(String(e));
      }
    }
    process.exitCode = failed ? 1 : 0;
    break;
  }
  default:
    console.error(
      "usage: assets list|verify|fetch|attribution [--kind=K] [--id=PREFIX] [--remote|--all]",
    );
    process.exitCode = 2;
}
