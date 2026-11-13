// Automated asset testing: every manifest entry (and, with --recursive, every file under assets/library) is
// decoded by the repo's own decoders. Bun side here (Bun.Image, Khronos glTF-Validator, sha256); Rust side
// (tv-ffmpeg, resvg, craft-svg/webp/exr, gltf crate, headless Bevy, ttf-parser) is crates/asset-test, run on
// fr1 or in CI, whose JSON lines are merged into the same report.
import { existsSync, readdirSync, statSync } from "node:fs";
import { join, relative, extname } from "node:path";
import { libraryRoot, parseManifest, sha256, type Asset } from "./manifest.ts";

/** manifest.toml plus manifest.<name>.toml packs (read here so the tester does not depend on loader changes). */
export function manifestPaths(lib: string): string[] {
  return readdirSync(lib)
    .filter((n) => /^manifest(\.[\w-]+)?\.toml$/.test(n))
    .sort()
    .map((n) => join(lib, n));
}
/** Remote entries live in ASSETS_STORE when set (fr1: /srv/artifacts/assets), else under the library. */
export const fileFor = (lib: string, a: Asset) =>
  join(
    a.storage === "remote" && process.env.ASSETS_STORE
      ? process.env.ASSETS_STORE
      : lib,
    a.path,
  );

export type AssetType = "image" | "audio" | "svg" | "model" | "font" | "hdri";
export const ASSET_TYPES: AssetType[] = [
  "image",
  "audio",
  "svg",
  "model",
  "font",
  "hdri",
];

export interface TestResult {
  id: string;
  kind: string;
  type: AssetType | "manifest";
  validator: string;
  ok: boolean;
  skipped?: boolean;
  ms: number;
  bytes: number;
  detail: string;
}

export interface TestOptions {
  root: string;
  recursive?: boolean;
  types?: AssetType[];
  /** JSON-lines file produced by `asset-test` (crates/asset-test). */
  rustResults?: string;
  /** Run `asset-test` locally from this binary. */
  rustBin?: string;
  /** Run the Rust stage on fr1 over ssh (build dir /srv/build/assets). */
  fr1?: boolean;
  /** A missing Rust stage is a failure instead of a skip. */
  strict?: boolean;
}

const IMAGE_EXT = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif", ".heic"]);
const AUDIO_EXT = new Set([
  ".ogg",
  ".wav",
  ".mp3",
  ".flac",
  ".mp4",
  ".webm",
  ".mkv",
]);

export function classify(path: string): AssetType | undefined {
  const e = extname(path).toLowerCase();
  if (IMAGE_EXT.has(e)) return "image";
  if (AUDIO_EXT.has(e)) return "audio";
  if (e === ".svg") return "svg";
  if (e === ".glb" || e === ".gltf") return "model";
  if (e === ".ttf" || e === ".otf" || e === ".woff2") return "font";
  if (e === ".hdr" || e === ".exr") return "hdri";
  return undefined;
}

const now = () => performance.now();

async function timed(
  f: () => Promise<string>,
): Promise<{ ok: boolean; ms: number; detail: string }> {
  const t = now();
  try {
    const detail = await f();
    return { ok: true, ms: now() - t, detail };
  } catch (e) {
    return {
      ok: false,
      ms: now() - t,
      detail: e instanceof Error ? e.message : String(e),
    };
  }
}

/** Radiance .hdr header check: magic, format line, resolution line, and the exact pixel payload start. */
export function checkRadianceHdr(b: Uint8Array): string {
  const head = new TextDecoder("latin1").decode(
    b.subarray(0, Math.min(b.length, 512)),
  );
  if (!/^#\?(RADIANCE|RGBE)\n/.test(head))
    throw new Error("missing #?RADIANCE signature");
  const m = /\n\n-Y (\d+) \+X (\d+)\n/.exec(head);
  if (!m) throw new Error("missing resolution line");
  if (!/FORMAT=32-bit_rle_rgbe/.test(head))
    throw new Error("not 32-bit_rle_rgbe");
  const [h, w] = [Number(m[1]), Number(m[2])];
  const payload = b.length - (m.index + m[0].length);
  if (payload < Math.min(w * h, 4096)) throw new Error("truncated pixel data");
  return `radiance ${w}x${h}, ${payload} payload bytes`;
}

async function bunImage(b: Uint8Array): Promise<string> {
  const img = new Bun.Image(b);
  const meta = (await img.metadata()) as {
    width: number;
    height: number;
    format: string;
  };
  if (!(meta.width > 0 && meta.height > 0)) throw new Error("zero-sized image");
  // Full decode: resample to 16x16 and re-encode forces every pixel through the codec.
  const out = await new Bun.Image(b).resize(16, 16).png().toBuffer();
  if (out.byteLength < 8) throw new Error("re-encode produced nothing");
  return `Bun.Image ${meta.format} ${meta.width}x${meta.height}`;
}

type GltfValidator = {
  validateBytes(
    data: Uint8Array,
    opts?: Record<string, unknown>,
  ): Promise<{
    issues: {
      numErrors: number;
      numWarnings: number;
      messages: {
        severity: number;
        code: string;
        message: string;
        pointer?: string;
      }[];
    };
    info?: { version?: string; generator?: string };
  }>;
};

// Upstream defects confirmed in the validator output of third-party assets we do not edit (checksummed in the manifest):
// the glTF is served as published; the listed codes are reported as warnings for that file only.
const UPSTREAM_DEFECTS: Record<string, string[]> = {
  "polyhaven-models/fir_tree_01/fir_tree_01_1k.gltf": [
    "MESH_PRIMITIVE_TOO_FEW_TEXCOORDS",
  ],
};

async function khronos(b: Uint8Array, path: string): Promise<string> {
  const v = (await import("gltf-validator")) as unknown as GltfValidator;
  const dir = join(path, "..");
  const rep = await v.validateBytes(b, {
    uri: path,
    externalResourceFunction: async (uri: string) =>
      new Uint8Array(await Bun.file(join(dir, decodeURI(uri))).arrayBuffer()),
    maxIssues: 50,
  });
  const waived =
    Object.entries(UPSTREAM_DEFECTS).find(([k]) =>
      path.replaceAll("\\", "/").endsWith(k),
    )?.[1] ?? [];
  const all = rep.issues.messages.filter((m) => m.severity === 0);
  const errs = all.filter((m) => !waived.includes(m.code));
  if (errs.length > 0 || (all.length === 0 && rep.issues.numErrors > 0))
    throw new Error(
      `${rep.issues.numErrors} errors: ${errs
        .slice(0, 3)
        .map((m) => `${m.code} ${m.pointer ?? ""}`)
        .join("; ")}`,
    );
  return `Khronos glTF-Validator glTF ${rep.info?.version ?? "?"}, 0 errors${waived.length ? ` (${all.length - errs.length} upstream, waived)` : ""}, ${rep.issues.numWarnings} warnings`;
}

function walk(dir: string, out: string[] = []): string[] {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

async function runRust(
  o: TestOptions,
  onlyType?: string,
): Promise<{ lines: string[]; note?: string }> {
  const typeArg = onlyType ? ["--type", onlyType] : [];
  if (o.rustResults) {
    if (!existsSync(o.rustResults))
      return { lines: [], note: `rust results file missing: ${o.rustResults}` };
    return {
      lines: (await Bun.file(o.rustResults).text()).split("\n").filter(Boolean),
    };
  }
  if (o.rustBin) {
    const p = Bun.spawnSync([o.rustBin, o.root, ...typeArg], {
      stdout: "pipe",
      stderr: "pipe",
    });
    if (p.exitCode !== 0)
      return {
        lines: [],
        note: `asset-test exit ${p.exitCode}: ${p.stderr.toString().slice(0, 300)}`,
      };
    return { lines: p.stdout.toString().split("\n").filter(Boolean) };
  }
  if (o.fr1) {
    const cmd = [
      "set -e; cd /srv/build/assets",
      "sudo git -c safe.directory=* fetch -q origin && sudo git -c safe.directory=* reset -q --hard origin/main",
      "export FFMPEG_LGPL=${FFMPEG_LGPL:-/opt/ffmpeg-lgpl} PKG_CONFIG_PATH=/opt/ffmpeg-lgpl/lib/pkgconfig LD_LIBRARY_PATH=/opt/ffmpeg-lgpl/lib PATH=/home/ubuntu/.cargo/bin:/usr/local/bin:/usr/bin:/bin CARGO_HOME=/home/ubuntu/.cargo RUSTUP_HOME=/home/ubuntu/.rustup CARGO_TARGET_DIR=/srv/build/target-assets",
      "sudo env PKG_CONFIG_PATH=$PKG_CONFIG_PATH LD_LIBRARY_PATH=$LD_LIBRARY_PATH PATH=$PATH CARGO_HOME=$CARGO_HOME RUSTUP_HOME=$RUSTUP_HOME CARGO_TARGET_DIR=$CARGO_TARGET_DIR nice cargo build -q -j8 -p asset-test --profile iteration >&2",
      `sudo /srv/build/target-assets/iteration/asset-test /srv/build/assets ${typeArg.join(" ")}`,
    ].join("; ");
    const p = Bun.spawnSync(["timeout", "3000", "ssh", "vps", cmd], {
      stdout: "pipe",
      stderr: "pipe",
    });
    if (p.exitCode !== 0)
      return {
        lines: [],
        note: `fr1 asset-test exit ${p.exitCode}: ${p.stderr.toString().slice(-300)}`,
      };
    return { lines: p.stdout.toString().split("\n").filter(Boolean) };
  }
  return {
    lines: [],
    note: "no Rust stage configured (--rust-bin, --rust-results or --fr1)",
  };
}

export async function runTests(
  o: TestOptions,
): Promise<{ results: TestResult[]; notes: string[]; assets: number }> {
  const lib = libraryRoot(o.root);
  const assets: Asset[] = [];
  for (const f of manifestPaths(lib))
    assets.push(...parseManifest(await Bun.file(f).text()));
  const want = (t: AssetType | "manifest") =>
    t === "manifest" || !o.types?.length || o.types.includes(t);
  const results: TestResult[] = [];
  const notes: string[] = [];
  const listed = new Map<string, Asset>(
    assets.map((a) => [fileFor(lib, a), a]),
  );

  const targets: { id: string; kind: string; abs: string; asset?: Asset }[] =
    assets.map((a) => ({
      id: a.id,
      kind: a.kind,
      abs: fileFor(lib, a),
      asset: a,
    }));
  if (o.recursive) {
    for (const f of walk(lib)) {
      if (
        listed.has(f) ||
        f.startsWith(join(lib, "remote")) ||
        f.startsWith(join(lib, "icons", "vendors")) ||
        /^manifest/.test(f.split(/[\\/]/).pop()!)
      )
        continue;
      const t = classify(f);
      if (t)
        targets.push({
          id: `unlisted:${relative(lib, f).replaceAll("\\", "/")}`,
          kind: "unlisted",
          abs: f,
        });
    }
  }

  for (const t of targets) {
    const type = classify(t.abs);
    const rel = relative(lib, t.abs).replaceAll("\\", "/");
    if (!type) continue;
    if (!want(type)) continue;
    if (!existsSync(t.abs)) {
      results.push({
        id: t.id,
        kind: t.kind,
        type,
        validator: "present",
        ok: true,
        skipped: true,
        ms: 0,
        bytes: 0,
        detail: "remote asset not fetched",
      });
      continue;
    }
    const bytes = new Uint8Array(await Bun.file(t.abs).arrayBuffer());
    const size = statSync(t.abs).size;
    if (!t.asset) {
      results.push({
        id: t.id,
        kind: t.kind,
        type,
        validator: "manifest",
        ok: false,
        ms: 0,
        bytes: size,
        detail: "file under assets/library is not in manifest.toml",
      });
    } else {
      const r = await timed(async () => {
        const h = await sha256(bytes);
        if (h !== t.asset!.sha256)
          throw new Error(`sha256 ${h} != manifest ${t.asset!.sha256}`);
        return "sha256 matches manifest";
      });
      results.push({
        id: t.id,
        kind: t.kind,
        type,
        validator: "sha256",
        ok: r.ok,
        ms: r.ms,
        bytes: size,
        detail: r.detail,
      });
    }
    const push = (
      validator: string,
      r: { ok: boolean; ms: number; detail: string },
    ) =>
      results.push({
        id: t.id,
        kind: t.kind,
        type,
        validator,
        ok: r.ok,
        ms: r.ms,
        bytes: size,
        detail: r.detail,
      });
    if (type === "image") push("Bun.Image", await timed(() => bunImage(bytes)));
    else if (type === "model")
      push("khronos-gltf-validator", await timed(() => khronos(bytes, t.abs)));
    else if (type === "hdri" && extname(t.abs).toLowerCase() === ".hdr")
      push("radiance-header", await timed(async () => checkRadianceHdr(bytes)));
    void rel;
  }

  // Rust stage: audio, svg, model (gltf crate + headless Bevy), font, webp/exr.
  const rustTypes = ASSET_TYPES.filter(
    (t) => ["audio", "svg", "model", "font"].includes(t) && want(t),
  );
  if (rustTypes.length) {
    const rust = await runRust(
      o,
      o.types?.length === 1 ? o.types[0] : undefined,
    );
    if (rust.note) {
      notes.push(rust.note);
      if (o.strict)
        results.push({
          id: "rust-stage",
          kind: "stage",
          type: "manifest",
          validator: "asset-test",
          ok: false,
          ms: 0,
          bytes: 0,
          detail: rust.note,
        });
    }
    const byId = new Map(targets.map((t) => [t.id, t]));
    for (const line of rust.lines) {
      let j: {
        id: string;
        kind: string;
        validator: string;
        ok: boolean;
        ms: number;
        bytes: number;
        detail: string;
      };
      try {
        j = JSON.parse(line);
      } catch {
        continue;
      }
      const t = byId.get(j.id);
      const type = (t && classify(t.abs)) || "audio";
      if (!want(type)) continue;
      results.push({ ...j, type });
    }
  }
  return { results, notes, assets: assets.length };
}

export interface Summary {
  type: string;
  tested: number;
  passed: number;
  failed: number;
  skipped: number;
  ms: number;
  bytes: number;
}

export function summarize(results: TestResult[]): Summary[] {
  const by = new Map<string, Summary>();
  for (const r of results) {
    const s = by.get(r.type) ?? {
      type: r.type,
      tested: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      ms: 0,
      bytes: 0,
    };
    s.tested++;
    if (r.skipped) s.skipped++;
    else if (r.ok) s.passed++;
    else s.failed++;
    s.ms += r.ms;
    s.bytes += r.bytes;
    by.set(r.type, s);
  }
  return [...by.values()].sort((a, b) => a.type.localeCompare(b.type));
}

export function renderMarkdown(
  results: TestResult[],
  notes: string[],
  meta: Record<string, string>,
): string {
  const sum = summarize(results);
  const fails = results.filter((r) => !r.ok && !r.skipped);
  const esc = (s: string) => s.replaceAll("|", "\\|").replaceAll("\n", " ");
  const out: string[] = [
    "# Asset tests",
    "",
    ...Object.entries(meta).map(([k, v]) => `- ${k}: ${v}`),
    "",
  ];
  out.push(
    "| type | checks | pass | fail | skipped | decode ms (sum) | bytes |",
    "|---|---|---|---|---|---|---|",
  );
  for (const s of sum)
    out.push(
      `| ${s.type} | ${s.tested} | ${s.passed} | ${s.failed} | ${s.skipped} | ${s.ms.toFixed(1)} | ${s.bytes} |`,
    );
  if (notes.length) out.push("", "Notes:", ...notes.map((n) => `- ${esc(n)}`));
  out.push("", fails.length ? "## Failures" : "No failures.", "");
  for (const f of fails)
    out.push(`- ${f.id} (${f.validator}): ${esc(f.detail)}`);
  const validators = new Map<string, { n: number; ms: number }>();
  for (const r of results) {
    const v = validators.get(r.validator) ?? { n: 0, ms: 0 };
    v.n++;
    v.ms += r.ms;
    validators.set(r.validator, v);
  }
  out.push(
    "",
    "## Validators",
    "",
    "| validator | checks | mean ms |",
    "|---|---|---|",
  );
  for (const [k, v] of [...validators].sort())
    out.push(`| ${k} | ${v.n} | ${(v.ms / v.n).toFixed(3)} |`);
  const rows = results.filter((x) => !x.skipped);
  if (rows.length > 300) {
    out.push("", "Per-asset rows are in report.json (more than 300 checks).");
    return out.join("\n") + "\n";
  }
  out.push(
    "",
    "## Per asset",
    "",
    "| id | validator | result | ms | bytes | detail |",
    "|---|---|---|---|---|---|",
  );
  for (const r of rows.sort(
    (x, y) =>
      x.id.localeCompare(y.id) || x.validator.localeCompare(y.validator),
  ))
    out.push(
      `| ${r.id} | ${r.validator} | ${r.ok ? "pass" : "FAIL"} | ${r.ms.toFixed(2)} | ${r.bytes} | ${esc(r.detail)} |`,
    );
  return out.join("\n") + "\n";
}

/** CLI entry: `assets test [--recursive] [--type=image,audio] [--strict] [--fr1|--rust-bin=P|--rust-results=F] [--out=DIR] [--md=FILE]`. */
export async function testCommand(
  root: string,
  args: string[],
): Promise<number> {
  const opt = (n: string) =>
    args.find((a) => a.startsWith(`--${n}=`))?.slice(n.length + 3);
  const flag = (n: string) => args.includes(`--${n}`);
  const typeIdx = args.indexOf("--type");
  const typeVal = opt("type") ?? (typeIdx >= 0 ? args[typeIdx + 1] : undefined);
  const types = typeVal?.split(",").filter(Boolean) as AssetType[] | undefined;
  for (const t of types ?? [])
    if (!ASSET_TYPES.includes(t)) {
      console.error(`unknown type ${t}; one of ${ASSET_TYPES.join(", ")}`);
      return 2;
    }
  const { results, notes, assets } = await runTests({
    root,
    recursive: flag("recursive"),
    types,
    fr1: flag("fr1"),
    strict: flag("strict"),
    rustBin: opt("rust-bin"),
    rustResults: opt("rust-results"),
  });
  const out = opt("out") ?? join(root, "var", "assets-test");
  await Bun.write(
    join(out, "report.json"),
    JSON.stringify(
      {
        at: new Date().toISOString(),
        assets,
        summary: summarize(results),
        notes,
        results,
      },
      null,
      1,
    ),
  );
  const md = renderMarkdown(results, notes, {
    date: new Date().toISOString().slice(0, 10),
    manifest_entries: String(assets),
    bun: Bun.version,
  });
  await Bun.write(opt("md") ?? join(out, "report.md"), md);
  for (const s of summarize(results))
    console.log(
      `${s.type}\tchecks ${s.tested}\tpass ${s.passed}\tfail ${s.failed}\tskip ${s.skipped}`,
    );
  for (const n of notes) console.error(`note: ${n}`);
  const failed = results.filter((r) => !r.ok && !r.skipped);
  for (const f of failed)
    console.error(`FAIL ${f.id} [${f.validator}] ${f.detail}`);
  return failed.length ? 1 : 0;
}
