#!/usr/bin/env bun
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  type Asset,
  checkEntries,
  fetchAsset,
  fileOf,
  libraryRoot,
  loadAll,
  manifestFiles,
  renderAttribution,
  verify,
  verifyGenerated,
} from "./manifest.ts";
import { bundle, bundleDir } from "./bundle.ts";
import { type OptRecord, optDir, optimize } from "./optimize.ts";
import { checkTargets, parseTargets, publish, targetsFile } from "./publish.ts";
import {
  checkRepos,
  fetchRepo,
  parseRepos,
  renderRepos,
  reposFile,
  scanOrg,
} from "./repos.ts";
import {
  PACKS,
  ambientcgItems,
  fontItems,
  importPack,
  polyhavenItems,
} from "./sources.ts";
import { pool, run, which } from "./util.ts";
import { renderIconAttribution, syncIcons } from "./icons.ts";
import {
  exportJson,
  search as searchGames,
  syncEpic,
  syncSteam,
} from "./games.ts";

const root = process.env.SRC_ROOT ?? join(import.meta.dir, "..", "..", "..");
const [cmd = "list", ...args] = Bun.argv.slice(2);
const flag = (n: string) => args.includes(`--${n}`);
const opt = (n: string) =>
  args.find((a) => a.startsWith(`--${n}=`))?.slice(n.length + 3);
const num = (n: string, d: number) => Number(opt(n) ?? d);
const pos = args.filter((a) => !a.startsWith("--"));
const jobs = num("jobs", 8);

if (!manifestFiles(root).length) {
  console.error(`no manifest in ${libraryRoot(root)}`);
  process.exit(2);
}
const assets = await loadAll(root);
const pick = (all = true): Asset[] => {
  const sel = assets.filter(
    (a) =>
      (!opt("kind") || a.kind === opt("kind")) &&
      (!opt("id") || a.id.startsWith(opt("id")!)) &&
      (!opt("match") || a.path.includes(opt("match")!)) &&
      (all || flag("all") || a.storage === "git" || flag("remote")),
  );
  return opt("limit") ? sel.slice(0, num("limit", sel.length)) : sel;
};
const loadTargets = () => {
  const f = targetsFile(root);
  return existsSync(f) ? parseTargets(readFileSync(f, "utf8")) : [];
};
const loadRepos = () =>
  existsSync(reposFile(root))
    ? parseRepos(readFileSync(reposFile(root), "utf8"))
    : [];
const fmtMB = (n: number) => `${(n / 1048576).toFixed(1)} MB`;

async function doOptimize() {
  const r = await optimize(root, pick(), { jobs: Math.min(jobs, 6) });
  const inB = r.records.reduce((n, x) => n + x.srcBytes, 0);
  const outB = r.records.reduce((n, x) => n + x.bytes, 0);
  console.log(
    `optimized ${r.records.length} (built ${r.built}, cached ${r.cached}), ${fmtMB(inB)} -> ${fmtMB(outB)} (outputs counted per format)`,
  );
  for (const x of r.failed.slice(0, 20))
    console.error(`failed ${x.recipe} ${x.id}: ${x.reason}`);
  if (r.failed.length) {
    console.error(`${r.failed.length} failed`);
    process.exitCode = 1;
  }
  return r;
}

function doBundle() {
  const f = join(optDir(root), "optimized.json");
  const records = existsSync(f)
    ? (JSON.parse(readFileSync(f, "utf8")) as OptRecord[])
    : [];
  const man = bundle(root, {
    records,
    optDir: optDir(root),
    raw: flag("raw") ? pick() : [],
    prefix: opt("prefix"),
  });
  console.log(
    `bundle ${Object.keys(man.entries).length} entries -> ${bundleDir(root)}`,
  );
  return man;
}

async function doPublish(names: string[]) {
  const ts = loadTargets();
  const sel = flag("all") ? ts : ts.filter((t) => names.includes(t.name));
  if (!sel.length)
    throw new Error(
      `no target selected (known: ${ts.map((t) => t.name).join(", ") || "none"})`,
    );
  const f = join(bundleDir(root), "assets-manifest.json");
  if (!existsSync(f))
    throw new Error("no bundle: run `ay assets bundle` first");
  const man = JSON.parse(readFileSync(f, "utf8"));
  let bad = 0;
  for (const t of sel) {
    const r = await publish(root, bundleDir(root), man, t, {
      dryRun: flag("dry-run"),
    });
    console.log(
      `${r.target}\t${r.state}\t${r.files} files\t${fmtMB(r.bytes)}${r.detail ? `\t${r.detail}` : ""}`,
    );
    if (r.state === "error") bad++;
  }
  process.exitCode = bad ? 1 : 0;
}

switch (cmd) {
  case "list":
    for (const a of pick())
      console.log(`${a.id}\t${a.kind}\t${a.license}\t${a.storage}\t${a.path}`);
    break;
  case "verify": {
    const errs = [
      ...(await verify(root, assets)),
      ...(await verifyGenerated(root)),
    ];
    errs.push(...checkTargets(loadTargets()), ...checkRepos(loadRepos()));
    for (const e of errs.slice(0, 200)) console.error(e);
    console.log(
      `${assets.length} entries, ${loadRepos().length} repos, ${loadTargets().length} targets, ${errs.length} errors`,
    );
    process.exitCode = errs.length ? 1 : 0;
    break;
  }
  case "check": {
    const errs = checkEntries(assets);
    for (const e of errs.slice(0, 200)) console.error(e);
    console.log(`${assets.length} entries, ${errs.length} errors`);
    process.exitCode = errs.length ? 1 : 0;
    break;
  }
  case "attribution":
    await Bun.write(
      join(libraryRoot(root), "ATTRIBUTION.md"),
      renderAttribution(assets) + renderIconAttribution(root),
    );
    break;
  case "icons": {
    const r = await syncIcons(root, pos[0]);
    for (const x of r.ok)
      console.log(`${x.id}\t${x.file}\t${x.bytes}\t${x.origin}`);
    for (const f of r.failed) console.error(`failed ${f}`);
    await Bun.write(
      join(libraryRoot(root), "ATTRIBUTION.md"),
      renderAttribution(assets) + renderIconAttribution(root),
    );
    process.exitCode = r.failed.length ? 1 : 0;
    break;
  }
  case "games": {
    if (pos[0] === "sync") {
      const steam = await syncSteam(root, num("limit", 60));
      const epic = await syncEpic(root);
      console.log(
        `steam ${steam}, epic ${epic}, exported ${await exportJson(root)}`,
      );
    } else if (pos[0] === "search")
      for (const g of searchGames(root, pos.slice(1).join(" ")))
        console.log(`${g.store}\t${g.name}\t${g.genres}\t${g.url}`);
    else {
      console.error("usage: assets games sync [--limit=60] | search <text>");
      process.exitCode = 2;
    }
    break;
  }
  case "fetch": {
    if (flag("repos")) {
      const rs = loadRepos().filter(
        (r) => !opt("id") || r.id.startsWith(opt("id")!),
      );
      let failed = 0;
      await pool(rs, Math.min(jobs, 4), async (r) => {
        try {
          console.log(`${await fetchRepo(root, r)}\t${r.id}`);
        } catch (e) {
          failed++;
          console.error(String(e));
        }
      });
      process.exitCode = failed ? 1 : 0;
      break;
    }
    let failed = 0;
    let done = 0;
    const sel = pick(false);
    await pool(sel, jobs, async (a) => {
      try {
        const s = await fetchAsset(root, a);
        if (s === "ok" && ++done % 50 === 0) console.log(`${done} downloaded`);
      } catch (e) {
        failed++;
        console.error(String(e));
      }
    });
    console.log(
      `fetch: ${sel.length} selected, ${done} downloaded, ${failed} failed`,
    );
    process.exitCode = failed ? 1 : 0;
    break;
  }
  case "import": {
    const name = pos[0] ?? "";
    const limit = num("limit", 200);
    const meta = PACKS[name];
    if (!meta) throw new Error(`pack: ${Object.keys(PACKS).join(", ")}`);
    let items;
    if (name === "polyhaven-textures")
      items = await polyhavenItems("textures", limit, opt("res") ?? "1k");
    else if (name === "polyhaven-hdris")
      items = await polyhavenItems("hdris", limit, opt("res") ?? "1k");
    else if (name === "polyhaven-models")
      items = await polyhavenItems("models", limit, opt("res") ?? "1k");
    else if (name === "ambientcg")
      items = await ambientcgItems(limit, opt("attr") ?? "1K-JPG");
    else {
      const f = await fontItems(limit);
      items = f.items;
    }
    console.log(`${name}: ${items.length} files listed`);
    const r = await importPack(root, name, meta, items, { jobs });
    console.log(
      `${r.pack}: ${r.files} new (${fmtMB(r.bytes)}), ${r.skippedExisting} already in manifest, ${r.failed} failed`,
    );
    process.exitCode = r.failed ? 1 : 0;
    break;
  }
  case "scan": {
    const owner = opt("owner") ?? "EpicGames";
    const r = await scanOrg(owner, opt("kind") === "users" ? "users" : "orgs");
    console.log(
      `${owner}: ${r.included.length} included, ${r.excluded.length} excluded`,
    );
    if (flag("write")) {
      const keep = loadRepos().filter((x) => !x.id.startsWith(`${owner}/`));
      const all = [...keep, ...r.included].sort((a, b) =>
        a.id < b.id ? -1 : 1,
      );
      await Bun.write(reposFile(root), renderRepos(all));
      await Bun.write(
        join(root, "docs", "epic", `EXCLUDED-${owner}.json`),
        JSON.stringify(r.excluded, null, 2) + "\n",
      );
    } else
      for (const x of r.excluded)
        console.log(`excluded\t${x.id}\t${x.license}\t${x.reason}`);
    break;
  }
  case "optimize":
    await doOptimize();
    break;
  case "bundle":
    doBundle();
    break;
  case "publish":
    await doPublish(pos);
    break;
  case "targets":
    for (const t of loadTargets())
      console.log(
        `${t.name}\t${t.type}\t${t.external ? "external" : "internal"}\t${t.public_url ?? ""}`,
      );
    break;
  case "tools": {
    let missing = 0;
    const ver = async (t: string) => {
      const flag =
        t === "cwebp" ? "-version" : t === "gltfpack" ? "-h" : "--version";
      const r = await run([t, flag]);
      return ((r.out || r.err).split(/\r?\n/).find((l) => /\d/.test(l)) ?? "")
        .trim()
        .slice(0, 60);
    };
    for (const t of [
      "cwebp",
      "avifenc",
      "toktx",
      "gltfpack",
      "opusenc",
      "ffmpeg",
      "rclone",
      "tar",
      "ssh",
    ]) {
      const p = which(t);
      if (!p) missing++;
      console.log(`${t}\t${p ? await ver(t) : "MISSING"}`);
    }
    for (const m of ["svgo", "wawoff2"])
      console.log(
        `${m}\t${(await Bun.file(join(import.meta.dir, "..", "..", "..", "node_modules", m, "package.json")).json()).version} (in-process)`,
      );
    process.exitCode = missing ? 1 : 0;
    break;
  }
  case "run": {
    // fetch -> optimize -> bundle -> publish (targets after --to=a,b; absent = no publish)
    const sel = pick(false);
    await pool(sel, jobs, (a) =>
      fetchAsset(root, a).catch((e) => void console.error(String(e))),
    );
    await doOptimize();
    doBundle();
    if (opt("to")) await doPublish(opt("to")!.split(","));
    break;
  }
  case "test":
    process.exitCode = await (
      await import("./test.ts")
    ).testCommand(root, args);
    break;
  case "gen":
    process.exitCode = await Bun.spawn(
      ["bun", "run", join(import.meta.dir, "gen", "gen.ts"), ...args],
      {
        stdio: ["inherit", "inherit", "inherit"],
      },
    ).exited;
    break;
  case "retest":
    process.exitCode = await (
      await import("./retest.ts")
    ).retestCommand(root, args);
    break;
  default:
    console.error(
      "usage: ay assets gen <stills|svg|brand|textures|video|gif|index|validate|all>; test|retest [--recursive] [--type=T] [--strict] [--fr1]; list|check|verify|attribution|fetch [--repos]|import <pack>|scan|optimize|bundle|publish <target>|targets|tools|run\n" +
        "  filters: --kind=K --id=PREFIX --match=SUBSTR --limit=N --remote|--all --jobs=N --limit=N --dry-run --raw --prefix=P --to=a,b\n" +
        "  env: SRC_ROOT, ASSETS_STORE (remote store dir)",
    );
    process.exitCode = 2;
}
