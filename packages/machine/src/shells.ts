// Couche partagée des shells : env.toml -> env.{sh,ps1,nu,fish}, complétions `ay` (spec carapace, fish, nu)
// générées depuis `ay --help`, stubs/copier de manifest.toml, contrôle de shells.lock.toml et de HKCU.
// Usage : bun packages/machine/src/shells.ts [--gen | --check] [--only nu,fish,bash,pwsh,carapace]
//   (aucun)  génère + installe (idempotent)     --gen  génère seulement     --check  rapporte l'écart (code 1)
// Appelé aussi par apply-user.ts (export `shells`). Windows et Linux (flotte : bun présent).
import {
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { hostname } from "node:os";
import { dirname, join, normalize } from "node:path";

const SH = join(import.meta.dir, "..", "shells");
const WIN = process.platform === "win32";
const HOME = (WIN ? process.env.USERPROFILE : process.env.HOME) ?? "";
const HEADER =
  "généré par packages/machine/src/shells.ts depuis shells/env.toml — ne pas éditer";

type Plat = "windows" | "linux";
type VarDef = { all?: string; windows?: string; linux?: string };
type EnvToml = {
  var: Record<string, VarDef>;
  path: Partial<Record<Plat | "front", string[]>>;
  persist?: Partial<Record<Plat, Record<string, string>>>;
};
type Part = { lit: string } | { home: true } | { ref: string };

const envToml = (): EnvToml =>
  Bun.TOML.parse(readFileSync(join(SH, "env.toml"), "utf8")) as EnvToml;

function parts(v: string): Part[] {
  const out: Part[] = [];
  for (const [i, s] of v.split(/\{([A-Za-z_][A-Za-z0-9_]*)\}/).entries()) {
    if (i % 2 === 0) {
      if (s) out.push({ lit: s });
    } else out.push(s === "home" ? { home: true } : { ref: s });
  }
  return out;
}

const vars = (e: EnvToml, p: Plat) =>
  Object.entries(e.var).flatMap(([name, d]) => {
    const v = d[p] ?? d.all;
    return v === undefined ? [] : [{ name, value: parts(v) }];
  }) as { name: string; value: Part[] }[];

// --- émetteurs -------------------------------------------------------------------------------------------

const sq = (s: string) => `'${s.replaceAll("'", `'\\''`)}'`;

function emitSh(e: EnvToml): string {
  const val = (ps: Part[]) =>
    ps
      .map((x) =>
        "lit" in x ? sq(x.lit) : "home" in x ? `"$_ay_h"` : `"\${${x.ref}}"`,
      )
      .join("");
  const branch = (p: Plat) => {
    const l: string[] = [];
    for (const v of vars(e, p)) l.push(`  export ${v.name}=${val(v.value)}`);
    const front = new Set(e.path.front ?? []);
    for (const d of [...(e.path[p] ?? [])].reverse())
      l.push(`  _ay_pp ${val(parts(d))}${front.has(d) ? " m" : ""}`);
    return l.join("\n");
  };
  return `# ${HEADER}
# Famille bash (bash, niubash, Git Bash, brush). Idempotent, builtins seulement, sûr en non interactif.
# PATH Windows : ';' + C:/x (niubash, brush natif) ; Git Bash (BASH=/usr/bin/*) : ':' + /c/x ; Linux : ':'.
case \${OSTYPE-} in msys* | cygwin* | windows*) _ay_os=w ;; *) if [ -n "\${WINDIR-}" ]; then _ay_os=w; else _ay_os=l; fi ;; esac
_ay_s=: _ay_g=
if [ "$_ay_os" = w ]; then
  _ay_h=\${USERPROFILE-}
  case \${BASH-} in /usr/bin/* | /bin/*) _ay_g=1 ;; *) _ay_s=';' ;; esac
else
  _ay_h=$HOME
fi
# Ajoute $1 en tête de PATH s'il existe et n'y est pas ; avec $2 (m), le déplace en tête s'il y est.
# Appartenance par \`case\` : \${PATH//…} coûte 40-100 ms par appel sous niubash 1.5.0 (PATH long) ;
# déplacement (préfixe/suffixe) seulement pour les entrées « front » qui ne sont pas déjà en tête.
_ay_pp() {
  local d=\${1//\\\\//} b x q="$_ay_s$PATH$_ay_s"
  [ -d "$d" ] || return 0
  if [ -n "$_ay_g" ]; then b=\${d:0:1}; d="/\${b,,}\${d:2}"; b=$d; else b=\${d//\\//\\\\}; fi
  case $q in
    *"$_ay_s$d$_ay_s"* | *"$_ay_s$b$_ay_s"*)
      [ -n "\${2-}" ] || return 0
      case $q in "$_ay_s$d$_ay_s"* | "$_ay_s$b$_ay_s"*) return 0 ;; esac
      # Retrait par préfixe/suffixe (%% et #*), rapides sous niubash, au lieu de \${q//…}.
      for x in "$d" "$b"; do
        case $q in *"$_ay_s$x$_ay_s"*) q="\${q%%"$_ay_s$x$_ay_s"*}$_ay_s\${q#*"$_ay_s$x$_ay_s"}" ;; esac
      done
      q=\${q#"$_ay_s"}; PATH=\${q%"$_ay_s"} ;;
  esac
  PATH="$d\${PATH:+$_ay_s$PATH}"
}
if [ "$_ay_os" = w ]; then
${branch("windows")}
else
${branch("linux")}
fi
export PATH
unset _ay_os _ay_s _ay_g _ay_h
unset -f _ay_pp
`;
}

function emitPs1(e: EnvToml): string {
  const val = (ps: Part[]) =>
    ps
      .map((x) =>
        "lit" in x
          ? `'${x.lit.replaceAll("'", "''")}'`
          : "home" in x
            ? "$_ayH"
            : `$env:${x.ref}`,
      )
      .join(" + ") || "''";
  const branch = (p: Plat) => {
    const l: string[] = [];
    for (const v of vars(e, p)) l.push(`  $env:${v.name} = ${val(v.value)}`);
    l.push(
      `  $_ayD = @(${(e.path[p] ?? []).map((d) => `(${val(parts(d))})`).join(", ")})`,
    );
    return l.join("\n");
  };
  return `# ${HEADER}
# pwsh 7 et Windows PowerShell 5.1 : $env:* seulement ; aucune cmdlet (pas de chargement de module),
# aucun sous-processus ni réseau ; idempotent. PATH en une passe : dossiers existants de env.toml en tête,
# puis le PATH hérité sans doublons (comparaison insensible à la casse, \\ final ignoré).
$_ayW = $env:OS -eq 'Windows_NT'
if ($_ayW) { $_ayH = $env:USERPROFILE } else { $_ayH = $env:HOME }
if ($_ayW) {
${branch("windows")}
} else {
${branch("linux")}
}
$_ayS = [IO.Path]::PathSeparator
$_ayL = [Collections.Generic.List[string]]::new()
$_ayK = [Collections.Generic.HashSet[string]]::new([StringComparer]::OrdinalIgnoreCase)
foreach ($_ayX in $_ayD) { if ([IO.Directory]::Exists($_ayX) -and $_ayK.Add($_ayX.TrimEnd('\\'))) { $_ayL.Add($_ayX) } }
foreach ($_ayX in $env:PATH.Split($_ayS)) { if ($_ayX -and $_ayK.Add($_ayX.TrimEnd('\\'))) { $_ayL.Add($_ayX) } }
$env:PATH = [string]::Join($_ayS, $_ayL)
$_ayW = $null; $_ayH = $null; $_ayD = $null; $_ayS = $null; $_ayL = $null; $_ayK = $null; $_ayX = $null
`;
}

function emitNu(e: EnvToml): string {
  const val = (ps: Part[]) => {
    const xs = ps.map((x) => {
      if ("lit" in x) {
        if (x.lit.includes("'"))
          throw new Error(`apostrophe non supportée pour nu : ${x.lit}`);
        return `'${x.lit}'`;
      }
      return "home" in x ? "$h" : `$env.${x.ref}`;
    });
    return xs.length === 1 ? xs[0] : `([${xs.join(" ")}] | str join)`;
  };
  const branch = (p: Plat) => {
    const l: string[] = [];
    for (const v of vars(e, p)) l.push(`    $env.${v.name} = ${val(v.value)}`);
    l.push(`    [${(e.path[p] ?? []).map((d) => val(parts(d))).join(" ")}]`);
    return l.join("\n");
  };
  return `# ${HEADER}
# nushell 0.117 : sourcé par nu/env.nu. Idempotent ; PATH : entrée existante déplacée en tête.
do --env {
  let h = $nu.home-dir
  let dirs = if $nu.os-info.name == "windows" {
${branch("windows")}
  } else {
${branch("linux")}
  }
  let key = {|x| $x | str lowercase | str replace -a '\\' '/' | str trim -r -c '/' }
  let add = $dirs | where {|d| $d | path exists }
  let keys = $add | each $key
  $env.PATH = $add ++ ($env.PATH | where {|x| (do $key $x) not-in $keys })
}
`;
}

function emitFish(e: EnvToml): string {
  const val = (ps: Part[]) =>
    ps
      .map((x) =>
        "lit" in x ? sq(x.lit) : "home" in x ? `"$HOME"` : `"$${x.ref}"`,
      )
      .join("") || "''";
  const l: string[] = [];
  for (const v of vars(e, "linux")) l.push(`set -gx ${v.name} ${val(v.value)}`);
  const dirs = (e.path.linux ?? []).map((d) => val(parts(d)));
  // fish_add_path : -g global, -P modifie $PATH (pas fish_user_paths), -m déplace l'existant ; dossiers absents ignorés.
  if (dirs.length) l.push(`fish_add_path -gPm ${dirs.join(" ")}`);
  return `# ${HEADER}
# fish 4.x (Linux seulement : pas de build Windows natif amont). Sourcé par fish/config.fish.
${l.join("\n")}
`;
}

// --- complétions `ay` depuis clap --help -----------------------------------------------------------------

type Opt = { short?: string; long?: string; value: boolean; desc: string };
type Cmd = { name: string; desc: string; opts: Opt[]; cmds: Cmd[] };

function help(argv: string[]): string | null {
  const r = Bun.spawnSync(argv, {
    stdout: "pipe",
    stderr: "pipe",
    timeout: 5000,
  });
  const out = r.stdout.toString();
  return r.exitCode === 0 && /Usage:/.test(out) ? out : null;
}

function parseHelp(text: string): {
  cmds: { name: string; desc: string }[];
  opts: Opt[];
} {
  const cmds: { name: string; desc: string }[] = [];
  const opts: Opt[] = [];
  let sec = "";
  // argh (ay arch) : options à valeur visibles seulement dans la ligne Usage (`--root <root>`).
  const usage = text.match(/^Usage:.*$/m)?.[0] ?? "";
  const valued = new Set([...usage.matchAll(/(--[\w-]+) </g)].map((x) => x[1]));
  for (const line of text.split(/\r?\n/)) {
    const h = line.match(/^(\w[\w ]*):\s*$/);
    if (h) {
      sec = h[1];
      continue;
    }
    if (sec === "Commands") {
      const m = line.match(/^ {2}([a-z][\w-]*)(?:\s{2,}(.*))?$/);
      if (m && m[1] !== "help")
        cmds.push({ name: m[1], desc: (m[2] ?? "").trim() });
    } else if (sec === "Options") {
      const m = line.match(
        /^ {2,6}(?:(-[A-Za-z0-9]),? ?)?(--[\w-]+)?(?:, [\w-]+)?((?:[ =][<[][^\s]*)*)\s*(.*)$/,
      );
      if (m && (m[1] || m[2]))
        opts.push({
          short: m[1],
          long: m[2],
          value: !!m[3].trim() || (!!m[2] && valued.has(m[2])),
          desc: m[4].trim(),
        });
    }
  }
  return { cmds, opts };
}

function crawl(
  ay: string,
  path: string[],
  desc: string,
  depth: number,
): Cmd | null {
  const text = help([ay, ...path, "--help"]);
  if (!text) return null;
  const p = parseHelp(text);
  const cmds =
    depth < 3
      ? p.cmds.flatMap((c) => {
          const sub = crawl(ay, [...path, c.name], c.desc, depth + 1);
          return sub
            ? [sub]
            : [{ name: c.name, desc: c.desc, opts: [], cmds: [] }];
        })
      : p.cmds.map((c) => ({ name: c.name, desc: c.desc, opts: [], cmds: [] }));
  return {
    name: path.at(-1) ?? "ay",
    desc: desc || text.split(/\r?\n/)[0].trim(),
    opts: p.opts,
    cmds,
  };
}

function carapaceSpec(c: Cmd): unknown {
  const flags: Record<string, string> = {};
  for (const o of c.opts)
    flags[[o.short, o.long].filter(Boolean).join(", ") + (o.value ? "=" : "")] =
      o.desc;
  return {
    name: c.name,
    description: c.desc,
    ...(c.opts.length ? { flags } : {}),
    ...(c.cmds.length ? { commands: c.cmds.map(carapaceSpec) } : {}),
  };
}

function fishCompl(root: Cmd): string {
  const q = (s: string) =>
    `'${s.replaceAll("\\", "\\\\").replaceAll("'", "\\'")}'`;
  const l = [
    `# ${HEADER.replace("shells/env.toml", "`ay --help`")}`,
    "complete -c ay -f",
  ];
  const walk = (c: Cmd, chain: string[]) => {
    const names = c.cmds.map((x) => x.name).join(" ");
    const here = chain.length
      ? `__fish_seen_subcommand_from ${chain.at(-1)}${names ? `; and not __fish_seen_subcommand_from ${names}` : ""}`
      : names
        ? `not __fish_seen_subcommand_from ${names}`
        : "true";
    for (const s of c.cmds)
      l.push(`complete -c ay -n ${q(here)} -a ${s.name} -d ${q(s.desc)}`);
    for (const o of c.opts) {
      const f = [
        o.short ? `-s ${o.short.slice(1)}` : "",
        o.long ? `-l ${o.long.slice(2)}` : "",
        o.value ? "-r" : "",
      ];
      l.push(
        `complete -c ay -n ${q(here)} ${f.filter(Boolean).join(" ")} -d ${q(o.desc)}`,
      );
    }
    for (const s of c.cmds) walk(s, [...chain, s.name]);
  };
  walk(root, []);
  return `${l.join("\n")}\n`;
}

function nuExterns(root: Cmd): string {
  const l = [
    `# ${HEADER.replace("shells/env.toml", "`ay --help`")}`,
    "# Signatures externes : complétion native nushell des sous-commandes et options de `ay`.",
  ];
  const walk = (c: Cmd, chain: string[]) => {
    const name = ["ay", ...chain].join(" ");
    const sig = c.opts.map((o) => {
      const flag = o.long
        ? `${o.long}${o.short ? `(${o.short})` : ""}`
        : o.short!;
      return `  ${flag}${o.value ? ": string" : ""}  # ${o.desc.replaceAll("\n", " ")}`;
    });
    l.push(
      `export extern "${name}" [`,
      ...sig,
      ...(c.cmds.length ? [] : ["  ...args: string"]),
      "]",
    );
    for (const s of c.cmds) walk(s, [...chain, s.name]);
  };
  walk(root, []);
  return `${l.join("\n")}\n`;
}

// --- moteur ----------------------------------------------------------------------------------------------

type Results = string[];

function expand(p: string): string {
  const appdata = process.env.APPDATA ?? "";
  const config = process.env.XDG_CONFIG_HOME ?? join(HOME, ".config");
  const out = p
    .replace(/^~(?=[\\/]|$)/, HOME)
    .replaceAll("{appdata}", appdata)
    .replaceAll("{localappdata}", process.env.LOCALAPPDATA ?? "")
    .replaceAll("{config}", config)
    .replaceAll("{home}", HOME);
  return WIN ? normalize(out) : out;
}

const read = (f: string) => (existsSync(f) ? readFileSync(f, "utf8") : null);

function put(
  res: Results,
  check: boolean,
  file: string,
  content: string,
  label: string,
) {
  const ok = read(file) === content;
  res.push(`${ok ? "ok  " : check ? "DIFF" : "set "} ${label}`);
  if (!ok && !check) {
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, content);
  }
}

function generate(res: Results, check: boolean) {
  const e = envToml();
  const lf = (s: string) => s.replace(/\r\n/g, "\n");
  put(res, check, join(SH, "env.sh"), lf(emitSh(e)), "shells/env.sh");
  put(res, check, join(SH, "env.ps1"), lf(emitPs1(e)), "shells/env.ps1");
  put(res, check, join(SH, "env.nu"), lf(emitNu(e)), "shells/env.nu");
  put(res, check, join(SH, "env.fish"), lf(emitFish(e)), "shells/env.fish");
  const ay = Bun.which("ay");
  if (!ay) {
    res.push(
      "info ay absent : complétions ay non régénérées (fichiers du dépôt utilisés)",
    );
    return;
  }
  const root = crawl(ay, [], "Aphrody monorepo CLI", 0);
  if (!root) return void res.push("DIFF ay --help illisible");
  put(
    res,
    check,
    join(SH, "completions", "ay.yaml"),
    `${JSON.stringify(carapaceSpec(root), null, 2)}\n`,
    "shells/completions/ay.yaml (carapace)",
  );
  put(
    res,
    check,
    join(SH, "completions", "ay.fish"),
    fishCompl(root),
    "shells/completions/ay.fish",
  );
  put(
    res,
    check,
    join(SH, "completions", "ay.nu"),
    nuExterns(root),
    "shells/completions/ay.nu",
  );
}

type Link = {
  shell: string;
  src: string;
  dst: string | Partial<Record<Plat, string>>;
  mode: "source" | "copy";
};

function stub(shell: string, src: string): string {
  const p = src.replaceAll("\\", "/");
  const tag = "géré par packages/machine/src/shells.ts (manifest.toml)";
  switch (shell) {
    case "nu":
      return `# ${tag}\nsource '${p}'\n`;
    case "fish":
      return `# ${tag}\nsource '${p}'\n`;
    case "pwsh":
    case "powershell":
      return `# ${tag}\n. '${p.replaceAll("'", "''")}'\n`;
    default:
      return `# ${tag}\n. "${p}"\n`;
  }
}

function links(res: Results, check: boolean, only?: string[]) {
  const m = Bun.TOML.parse(readFileSync(join(SH, "manifest.toml"), "utf8")) as {
    link?: Link[];
  };
  const plat: Plat = WIN ? "windows" : "linux";
  for (const l of m.link ?? []) {
    const d = typeof l.dst === "string" ? l.dst : l.dst[plat];
    if (!d || (only && !only.includes(l.shell))) continue;
    const dst = expand(d);
    const src = join(SH, l.src);
    if (!existsSync(src)) {
      res.push(`DIFF ${l.src} absent (manifest)`);
      continue;
    }
    const content =
      l.mode === "copy" ? readFileSync(src, "utf8") : stub(l.shell, src);
    put(res, check, dst, content, `${l.mode} ${l.src} -> ${dst}`);
  }
}

// Caches d'init nushell dans le dossier vendor/autoload (mécanisme amont : chargé après config.nu).
function nuCaches(res: Results, check: boolean) {
  const nu = Bun.which("nu");
  if (!nu) return;
  const r = Bun.spawnSync([nu, "-n", "-c", "$nu.vendor-autoload-dirs | last"], {
    stdout: "pipe",
  });
  const dir = r.stdout.toString().trim();
  if (!dir) return;
  const gens: [string, string[]][] = [
    ["ay-zoxide.nu", ["zoxide", "init", "nushell"]],
    ["ay-carapace.nu", ["carapace", "_carapace", "nushell"]],
  ];
  for (const [file, argv] of gens) {
    const exe = Bun.which(argv[0]);
    const f = join(dir, file);
    if (!exe) {
      res.push(`info ${argv[0]} absent : ${file} non généré`);
      continue;
    }
    if (check) {
      res.push(`${existsSync(f) ? "ok  " : "DIFF"} nu autoload ${file}`);
      continue;
    }
    const out = Bun.spawnSync([exe, ...argv.slice(1)], {
      stdout: "pipe",
    }).stdout.toString();
    put(res, false, f, out, `nu autoload ${file}`);
  }
  // Ancienne config à plat (remplacée par le dépôt + autoload) : purge.
  const old = process.env.APPDATA
    ? join(process.env.APPDATA, "nushell")
    : join(HOME, ".config", "nushell");
  for (const f of [
    "carapace.nu",
    "zoxide.nu",
    "config.nu.before-cwd-fix.bak",
  ]) {
    const p = join(old, f);
    if (existsSync(p)) {
      res.push(`${check ? "DIFF" : "rm  "} ${p} (obsolète)`);
      if (!check) rmSync(p);
    }
  }
}

type LockEntry = {
  version: string;
  expect?: string;
  verify?: string[];
  path?: Record<string, string>;
  b3sum?: Record<string, string>;
  hosts?: string[];
};

const HOSTS: Record<string, string> = {
  srv2116886: "prd",
  bunos: "fr2",
  "vps-203bea89": "fr1",
};

function lock(res: Results) {
  const t = Bun.TOML.parse(
    readFileSync(join(SH, "shells.lock.toml"), "utf8"),
  ) as { shell: Record<string, LockEntry> };
  const host = WIN
    ? "pc"
    : (process.env.AY_HOST ?? HOSTS[hostname()] ?? hostname());
  const arch = process.arch === "arm64" ? "aarch64" : "x86_64";
  const key = `${WIN ? "windows" : "linux"}-${arch}`;
  const b3 = Bun.which("b3sum");
  for (const [name, s] of Object.entries(t.shell)) {
    if (s.hosts && !s.hosts.includes(host)) continue;
    const raw = s.path?.[key];
    if (!raw) continue;
    const exe = expand(raw);
    if (!existsSync(exe)) {
      res.push(`DIFF lock ${name} ${s.version} : ${exe} absent`);
      continue;
    }
    const v = Bun.spawnSync([exe, ...(s.verify ?? ["--version"])], {
      stdout: "pipe",
      stderr: "pipe",
      timeout: 5000,
    });
    const vout = v.stdout.toString() + v.stderr.toString();
    const want = s.expect ?? s.version;
    const vok = vout.includes(want);
    const sum = s.b3sum?.[WIN ? key : host];
    let hok = true;
    if (sum && b3)
      hok =
        Bun.spawnSync([b3, "--no-names", exe], { stdout: "pipe" })
          .stdout.toString()
          .trim() === sum;
    res.push(
      `${vok && hok ? "ok  " : "DIFF"} lock ${name} ${want}${vok ? "" : ` (version: ${vout.split("\n")[0].trim()})`}${hok ? "" : " (b3sum diffère)"}`,
    );
  }
}

const run = (argv: string[]) =>
  Bun.spawnSync(argv, { stdout: "pipe", stderr: "pipe" });
const winExpand = (s: string) =>
  s
    .replace(/%USERPROFILE%/gi, HOME)
    .replace(/%LOCALAPPDATA%/gi, process.env.LOCALAPPDATA ?? "");
const pathKey = (s: string) =>
  winExpand(s).replaceAll("/", "\\").replace(/\\+$/, "").toLowerCase();

// HKCU\Environment : variables [persist.windows] (setx : écrit et diffuse WM_SETTINGCHANGE) et
// tête du PATH utilisateur [persist_path] (reg add REG_EXPAND_SZ, reste du PATH conservé).
function persist(res: Results, check: boolean) {
  if (!WIN) return;
  const e = envToml() as EnvToml & { persist_path?: { windows?: string[] } };
  const q = run(["reg", "query", "HKCU\\Environment"]).stdout.toString();
  const have = new Map<string, string>();
  for (const line of q.split(/\r?\n/)) {
    const m = line.match(/^\s+(\S+)\s+REG_(?:EXPAND_)?SZ\s+(.*)$/);
    if (m) have.set(m[1].toLowerCase(), m[2].trim());
  }
  for (const [k, raw] of Object.entries(e.persist?.windows ?? {})) {
    const v = expand(raw);
    const cur = have.get(k.toLowerCase());
    const ok = cur !== undefined && winExpand(cur) === v;
    res.push(
      `${ok ? "ok  " : check ? "DIFF" : "set "} HKCU\\Environment ${k}=${v}${ok ? "" : ` (actuel: ${cur ?? "absent"})`}`,
    );
    if (!ok && !check) run(["setx", k, v]);
  }
  const front = (e.persist_path?.windows ?? []).map(expand);
  if (!front.length) return;
  const cur = (have.get("path") ?? "").split(";").filter(Boolean);
  const keys = new Set(front.map(pathKey));
  const next = [
    ...front.filter((d) => existsSync(d)),
    ...cur.filter((x) => !keys.has(pathKey(x))),
  ];
  const ok =
    next.slice(0, front.length).map(pathKey).join(";") ===
    cur.slice(0, front.length).map(pathKey).join(";");
  res.push(
    `${ok ? "ok  " : check ? "DIFF" : "set "} HKCU\\Environment Path : tête = ${front.join(" ; ")}`,
  );
  if (!ok && !check)
    run([
      "reg",
      "add",
      "HKCU\\Environment",
      "/v",
      "Path",
      "/t",
      "REG_EXPAND_SZ",
      "/d",
      next.join(";"),
      "/f",
    ]);
}

// Windows Terminal : [terminal] de manifest.toml comparé à settings.json (lecture seule).
function terminal(res: Results) {
  if (!WIN) return;
  const m = Bun.TOML.parse(readFileSync(join(SH, "manifest.toml"), "utf8")) as {
    terminal?: {
      default?: string;
      profile?: Record<string, Record<string, string | boolean>>;
    };
  };
  const f = join(
    process.env.LOCALAPPDATA ?? "",
    "Packages",
    "Microsoft.WindowsTerminal_8wekyb3d8bbwe",
    "LocalState",
    "settings.json",
  );
  if (!m.terminal || !existsSync(f)) return;
  const wt = Bun.JSONC.parse(readFileSync(f, "utf8")) as {
    defaultProfile?: string;
    profiles: { list: Record<string, unknown>[] };
  };
  const list = wt.profiles?.list ?? [];
  const byName = new Map(list.map((p) => [p.name as string, p]));
  if (m.terminal.default) {
    const ok =
      (
        byName.get(m.terminal.default)?.guid as string | undefined
      )?.toLowerCase() === wt.defaultProfile?.toLowerCase();
    res.push(
      `${ok ? "ok  " : "DIFF"} Windows Terminal defaultProfile = ${m.terminal.default}`,
    );
  }
  for (const [name, want] of Object.entries(m.terminal.profile ?? {})) {
    const p = byName.get(name);
    const bad = Object.entries(want).filter(([k, v]) => {
      const have =
        p?.[k] ?? (k === "hidden" || k === "elevate" ? false : undefined);
      return typeof v === "string" && k === "commandline"
        ? String(have ?? "").toLowerCase() !== expand(v).toLowerCase()
        : have !== v;
    });
    res.push(
      `${p && !bad.length ? "ok  " : "DIFF"} Windows Terminal profil ${name}${p ? bad.map(([k, v]) => ` ${k}≠${v}`).join("") : " absent"}`,
    );
  }
}

// Binaires en double ([[duplicate]] du lock) : retirés sans --check.
function duplicates(res: Results, check: boolean) {
  if (!WIN) return;
  const t = Bun.TOML.parse(
    readFileSync(join(SH, "shells.lock.toml"), "utf8"),
  ) as {
    duplicate?: { path: string; why: string; run: string[] }[];
  };
  for (const d of t.duplicate ?? []) {
    const p = expand(d.path);
    if (!existsSync(p)) {
      res.push(`ok   doublon absent : ${p}`);
      continue;
    }
    res.push(
      `${check ? "DIFF" : "rm  "} doublon ${p} (${d.why}) : ${d.run.join(" ")}`,
    );
    if (!check) {
      const r = run(d.run);
      if (r.exitCode !== 0)
        res.push(
          `DIFF échec ${d.run.join(" ")} : ${r.stderr.toString().trim().split("\n")[0]}`,
        );
    }
  }
}

// Dossiers épinglés de env.toml qui n'existent plus (JDK, SDK) : écart à signaler.
function pins(res: Results) {
  const e = envToml();
  const p: Plat = WIN ? "windows" : "linux";
  for (const v of vars(e, p)) {
    if (v.value.some((x) => "ref" in x)) continue;
    const s = v.value.map((x) => ("lit" in x ? x.lit : HOME)).join("");
    if (
      /^(?:[A-Za-z]:\\|\/)/.test(s) &&
      /_HOME$|_DIR$|_INSTALL$|_ROOT$/.test(v.name) &&
      !existsSync(s)
    )
      res.push(`info ${v.name}=${s} absent`);
  }
}

// only : restreint les [[link]] déployés à ces shells (ex. ["nu", "fish", "carapace"]).
export function shells(opts: {
  check: boolean;
  genOnly?: boolean;
  only?: string[];
}): Results {
  const res: Results = [];
  generate(res, opts.check);
  if (opts.genOnly) return res;
  links(res, opts.check, opts.only);
  nuCaches(res, opts.check);
  lock(res);
  persist(res, opts.check);
  duplicates(res, opts.check);
  terminal(res);
  pins(res);
  return res;
}

if (import.meta.main) {
  const check = process.argv.includes("--check");
  const i = process.argv.indexOf("--only");
  const only = i > 0 ? process.argv[i + 1]?.split(",") : undefined;
  const res = shells({ check, genOnly: process.argv.includes("--gen"), only });
  console.log(res.join("\n"));
  process.exit(check && res.some((r) => r.startsWith("DIFF")) ? 1 : 0);
}
