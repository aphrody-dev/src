#!/usr/bin/env bun
// `ay linux` and `ay pkg` (docs/linux/OWNERSHIP.md): kernel patchsets, kernel builds off the PC, and the
// unified package recipes (one recipe -> every distro format).

import {
  mkdirSync,
  rmSync,
  writeFileSync,
  chmodSync,
  readFileSync,
  existsSync,
} from "node:fs";
import { dirname, join, resolve } from "node:path";
import { tmpdir } from "node:os";
import {
  liveStatus,
  loadPatchsets,
  writePins,
  type Live,
} from "./patchsets.ts";
import {
  FORMATS,
  formatsOf,
  generate,
  loadDistros,
  loadRecipes,
  matrix,
  type Format,
} from "./recipe.ts";
import { buildEnv, loadKernels, shellEnv } from "./kernel.ts";

const USAGE = `ay linux <commande>
  status [--json] [--group g] [--record]   versions amont en direct vs épinglées (infra/linux/patchsets.toml)
  sync [--write] [--push]                  déplace les épingles ; rejoue les piles Linux (ay upstream sync)
  patch <status|sync|check|export> [...]   piles de patchs Linux d'ay upstream (linux-cachyos, ...)
  flavors                                  saveurs de noyau (infra/linux/kernels.toml)
  build <saveur> [--host fr1|ci] [--run|--env]  build noyau sur fr1 (préemptible) ou CI ; jamais sur le PC
ay pkg <commande>
  list                                     recettes et cibles
  matrix [--json] [--all]                  paires recette x distro construites en CI
  gen <recette|all> [--target f,..] [--out dir]   génère PKGBUILD, debian/, APKBUILD, ebuild, Android.bp, nix, Dockerfile
  build <recette> --distro <d> [--out dir] construit et teste dans le conteneur de la distro (Linux, CI)
  check                                    génère tout dans un dossier temporaire (validation)`;

export const LINUX_STACKS = [
  "linux-cachyos",
  "cachyos-pkgbuilds",
  "kernel-patches",
  "liquorix",
  "scx",
];

type Opts = { args: string[]; flags: Set<string>; values: Map<string, string> };

export function parse(argv: string[]): Opts {
  const o: Opts = { args: [], flags: new Set(), values: new Map() };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]!;
    if (!a.startsWith("--")) o.args.push(a);
    else if (a.includes("="))
      o.values.set(a.slice(2, a.indexOf("=")), a.slice(a.indexOf("=") + 1));
    else if (
      ["--host", "--target", "--out", "--distro", "--group"].includes(a) &&
      i + 1 < argv.length
    )
      o.values.set(a.slice(2), argv[++i]!);
    else o.flags.add(a.slice(2));
  }
  return o;
}

export function repoRoot(): string {
  if (process.env.SRC_ROOT) return resolve(process.env.SRC_ROOT);
  let dir = process.cwd();
  for (;;) {
    if (
      existsSync(join(dir, "src.lock.json")) ||
      existsSync(join(dir, "identity.toml"))
    )
      return dir;
    const up = resolve(dir, "..");
    if (up === dir) return process.cwd();
    dir = up;
  }
}

function upstream(root: string, args: string[]): number {
  const r = Bun.spawnSync(
    ["bun", join(root, "packages", "upstream", "src", "cli.ts"), ...args],
    {
      stdio: ["inherit", "inherit", "inherit"],
      env: { ...process.env, SRC_ROOT: root },
    },
  );
  return r.exitCode ?? 1;
}

function printLive(list: Live[]) {
  const mark = { ok: "=", behind: "->", excluded: "x", error: "!" } as const;
  for (const p of list) {
    const right =
      p.state === "error"
        ? p.error
        : p.state === "excluded"
          ? (p.excluded ?? "archivé en amont")
          : p.latest;
    console.log(
      `${p.group.padEnd(11)} ${p.name.padEnd(26)} ${(p.pinned || "-").padEnd(14)} ${mark[p.state].padEnd(2)} ${right ?? "?"}`,
    );
  }
}

function writeOut(
  dir: string,
  files: Record<string, string | Uint8Array>,
  modes: Record<string, number>,
) {
  rmSync(dir, { recursive: true, force: true });
  for (const [p, c] of Object.entries(files)) {
    const f = join(dir, p);
    mkdirSync(dirname(f), { recursive: true });
    writeFileSync(f, c);
    if (modes[p]) chmodSync(f, modes[p]!);
  }
}

async function linux(root: string, o: Opts): Promise<number> {
  const cmd = o.args[0];
  switch (cmd) {
    case "status": {
      const group = o.values.get("group");
      const live = await liveStatus(
        loadPatchsets(root).filter((p) => !group || p.group === group),
      );
      if (o.flags.has("json")) console.log(JSON.stringify(live, null, 2));
      else printLive(live);
      if (o.flags.has("record")) {
        const f = join(root, "var", "linux", "status.json");
        mkdirSync(dirname(f), { recursive: true });
        writeFileSync(
          f,
          JSON.stringify({ at: new Date().toISOString(), live }, null, 2) +
            "\n",
        );
      }
      return live.some((p) => p.state === "error") ? 1 : 0;
    }
    case "sync": {
      const live = await liveStatus(loadPatchsets(root));
      const moved = live
        .filter((p) => p.state === "behind" && p.latest)
        .map((p) => ({ name: p.name, latest: p.latest! }));
      for (const m of moved) console.log(`${m.name} -> ${m.latest}`);
      if (o.flags.has("write"))
        console.log(
          `${writePins(root, moved)} épingle(s) écrite(s) dans infra/linux/patchsets.toml`,
        );
      return upstream(root, [
        "sync",
        LINUX_STACKS.join(","),
        ...(o.flags.has("push") ? ["--push"] : []),
      ]);
    }
    case "patch": {
      const sub = o.args[1] ?? "status";
      const rest = o.args.slice(2);
      if (sub === "status")
        return upstream(root, [
          "status",
          ...(rest.length ? rest : LINUX_STACKS),
          ...[...o.flags].map((f) => `--${f}`),
        ]);
      return upstream(root, [
        sub,
        ...(rest.length ? rest : [LINUX_STACKS.join(",")]),
        ...[...o.flags].map((f) => `--${f}`),
      ]);
    }
    case "flavors": {
      const k = loadKernels(root);
      for (const f of k.flavors)
        console.log(
          `${f.name.padEnd(14)} ${Object.entries(f.env)
            .map(([n, v]) => `${n}=${v}`)
            .join(" ")}`,
        );
      return 0;
    }
    case "build": {
      const flavor = o.args[1];
      if (!flavor) throw new Error("ay linux build <saveur>");
      const host = (o.values.get("host") ?? "fr1") as "fr1" | "ci";
      if (host !== "fr1" && host !== "ci")
        throw new Error("--host fr1 | ci (jamais le PC ni prd)");
      const env = buildEnv(loadKernels(root), flavor, host);
      if (o.flags.has("env")) {
        // Environment of kernel.sh, for the CI job (written to $GITHUB_ENV).
        for (const [k, v] of Object.entries(env)) console.log(`${k}=${v}`);
        return 0;
      }
      if (host === "ci") {
        const cmd = [
          "gh",
          "workflow",
          "run",
          "linux-kernel.yml",
          "-R",
          "aphrody-labs/src",
          "-f",
          `flavor=${flavor}`,
        ];
        console.log(cmd.join(" "));
        return o.flags.has("run")
          ? (Bun.spawnSync(cmd, { stdio: ["inherit", "inherit", "inherit"] })
              .exitCode ?? 1)
          : 0;
      }
      const script = readFileSync(
        join(root, "infra", "linux", "build", "kernel.sh"),
        "utf8",
      );
      // kernel.sh goes over stdin, then runs detached in a transient user unit (nice 19, idle I/O).
      const remote = `f=$(mktemp -t aphrody-kernel.XXXXXX) && cat > "$f" && ${shellEnv(env)} systemd-run --user --collect --unit=aphrody-kernel-${flavor} --nice=19 -p IOSchedulingClass=idle -E FLAVOR -E IMAGE -E HOST -E LLVM_DIR -E KNOBS sh "$f"`;
      console.log(`ssh vps "${remote}" < infra/linux/build/kernel.sh`);
      if (!o.flags.has("run")) return 0;
      const r = Bun.spawnSync(["ssh", "vps", remote], {
        stdin: new TextEncoder().encode(script),
        stdio: [undefined, "inherit", "inherit"],
      });
      if (r.exitCode === 0)
        console.log(
          `suivi : ssh vps journalctl --user -fu aphrody-kernel-${flavor}`,
        );
      return r.exitCode ?? 1;
    }
    default:
      console.error(USAGE);
      return 2;
  }
}

function genAll(
  root: string,
  name: string,
  targets: Format[] | undefined,
  out: string,
): string[] {
  const recipes = loadRecipes(root).filter(
    (r) => name === "all" || r.name === name,
  );
  if (!recipes.length)
    throw new Error(`recette « ${name} » introuvable dans infra/pkg/recipes`);
  const distros = loadDistros(root);
  const done: string[] = [];
  for (const r of recipes)
    for (const f of formatsOf(r).filter(
      (f) => !targets || targets.includes(f),
    )) {
      const d = distros.find((x) => x.format === f);
      const g = generate(root, r, f, d);
      writeOut(join(out, r.name, f), g.files, g.modes);
      done.push(`${r.name}/${f}`);
    }
  return done;
}

async function pkg(root: string, o: Opts): Promise<number> {
  const cmd = o.args[0];
  switch (cmd) {
    case "list": {
      for (const r of loadRecipes(root))
        console.log(
          `${r.name.padEnd(22)} ${r.version}-${r.release}  ${formatsOf(r).join(" ")}`,
        );
      return 0;
    }
    case "matrix": {
      const m = matrix(
        loadRecipes(root),
        loadDistros(root),
        !o.flags.has("all"),
      );
      if (o.flags.has("json")) console.log(JSON.stringify({ include: m }));
      else
        for (const x of m)
          console.log(
            `${x.recipe.padEnd(22)} ${x.distro.padEnd(9)} ${x.format}`,
          );
      return 0;
    }
    case "gen": {
      const t = o.values.get("target")?.split(",") as Format[] | undefined;
      for (const f of t ?? [])
        if (!FORMATS.includes(f))
          throw new Error(`cible ${f} : ${FORMATS.join(", ")}`);
      const out = resolve(o.values.get("out") ?? join(root, "var", "pkg"));
      for (const x of genAll(root, o.args[1] ?? "all", t, out))
        console.log(`${x} -> ${join(out, x)}`);
      return 0;
    }
    case "check": {
      const out = join(tmpdir(), `ay-pkg-check-${process.pid}`);
      try {
        const done = genAll(root, "all", undefined, out);
        console.log(`${done.length} sortie(s) générée(s) : ${done.join(" ")}`);
      } finally {
        rmSync(out, { recursive: true, force: true });
      }
      return 0;
    }
    case "build": {
      const name = o.args[1];
      const dn = o.values.get("distro");
      if (!name || !dn) throw new Error("ay pkg build <recette> --distro <d>");
      if (process.platform !== "linux")
        throw new Error(
          "ay pkg build : Linux seulement (CI ubuntu-latest) ; rien ne se construit sur le PC",
        );
      const d = loadDistros(root).find((x) => x.name === dn);
      if (!d)
        throw new Error(`distro « ${dn} » absente de infra/pkg/distros.toml`);
      const r = loadRecipes(root).find((x) => x.name === name);
      if (!r) throw new Error(`recette « ${name} » introuvable`);
      const dir = resolve(
        o.values.get("out") ?? join(root, "var", "pkg", name, d.name),
      );
      const g = generate(root, r, d.format, d);
      writeOut(dir, g.files, g.modes);
      const cmd =
        d.format === "docker" || !d.image
          ? ["sh", join(dir, "build.sh")]
          : [
              "docker",
              "run",
              "--rm",
              "-v",
              `${dir}:/w`,
              d.image,
              "sh",
              "/w/build.sh",
            ];
      console.log(cmd.join(" "));
      return (
        Bun.spawnSync(cmd, { stdio: ["inherit", "inherit", "inherit"] })
          .exitCode ?? 1
      );
    }
    default:
      console.error(USAGE);
      return 2;
  }
}

export async function main(argv: string[]): Promise<number> {
  const top = argv[0] === "pkg" ? "pkg" : "linux";
  const o = parse(top === "pkg" ? argv.slice(1) : argv);
  if (!o.args[0] || o.args[0] === "help" || o.flags.has("help")) {
    console.log(USAGE);
    return o.args[0] ? 0 : 2;
  }
  const root = repoRoot();
  return top === "pkg" ? pkg(root, o) : linux(root, o);
}

if (import.meta.main) {
  try {
    process.exitCode = await main(process.argv.slice(2));
  } catch (e) {
    console.error(
      `ay ${process.argv[2] === "pkg" ? "pkg" : "linux"}: ${(e as Error).message}`,
    );
    process.exitCode = 1;
  }
}
