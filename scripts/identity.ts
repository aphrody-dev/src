#!/usr/bin/env bun
// identity: identity.toml is the single source of the product identity; this script checks and
// rewrites every manifest that copies it (docs/ARCHITECTURE-ROOT.md invariant 5).
//
//   bun scripts/identity.ts check [--root DIR]   exit 1 on drift (gate in `just check` and CI)
//   bun scripts/identity.ts apply [--root DIR]   rewrite the derived fields from identity.toml
//   bun scripts/identity.ts get <dotted.key>     print one value (recipes, CI)
//
// Derived fields:
// - Cargo.toml [workspace.package] authors/repository/homepage; crates/ay package and [[bin]] name;
// - crates/*/Cargo.toml package names: `<dir>` or `<crate_prefix><dir>` (crates.io collisions,
//   docs/NAMING.md), except [naming.crate_names]; renames follow every `package = "..."` key;
// - npm: every bun workspace (root package.json `workspaces` globs) is named `<scope>/<dir>`
//   (`<scope>/<binary>` for [products.*], `<scope>/monorepo` at the root), and every `workspace:`
//   dependency must name one of them.
// TOML values are compared parsed (comments, multi-line arrays); JSON is rewritten as objects.
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";

export type Identity = {
  product: {
    name: string;
    display: string;
    repo: string;
    repo_org?: "main" | "lab";
  };
  cli: { binary: string; crate: string };
  naming: {
    npm_scope: string;
    crate_prefix: string;
    crate_names?: Record<string, string>;
  };
  orgs: { main: string; lab: string };
  domains: { root: string; home: string; git: string; contact: string };
  products?: Record<string, { binary: string; path: string }>;
};

/** Nearest ancestor of `from` holding identity.toml, else $SRC_ROOT. */
export function findRoot(from = process.cwd()): string {
  for (let d = resolve(from); ; d = dirname(d)) {
    if (existsSync(join(d, "identity.toml"))) return d;
    if (dirname(d) === d) break;
  }
  if (process.env.SRC_ROOT) return process.env.SRC_ROOT;
  throw new Error(
    "identity.toml not found above the working directory and SRC_ROOT unset",
  );
}

export const loadIdentity = (root: string) =>
  Bun.TOML.parse(readFileSync(join(root, "identity.toml"), "utf8")) as Identity;

export const repoUrl = (id: Identity) =>
  `https://github.com/${id.orgs[id.product.repo_org ?? "main"]}/${id.product.repo}`;

type Edit = {
  file: string;
  what: string;
  have: string;
  want: string;
  apply: (s: string) => string;
};

/** Split a TOML line into code and comment: `#` inside "basic" (with \ escapes) or 'literal' strings is code. */
export function splitComment(line: string): [string, string] {
  let quote: string | undefined;
  for (let i = 0; i < line.length; i++) {
    const c = line[i]!;
    if (quote) {
      if (quote === '"' && c === "\\") i++;
      else if (c === quote) quote = undefined;
    } else if (c === '"' || c === "'") quote = c;
    else if (c === "#") return [line.slice(0, i), line.slice(i)];
  }
  return [line, ""];
}

/** Net `[` minus `]` outside strings and comments. */
function bracketDepth(line: string): number {
  let depth = 0;
  let quote: string | undefined;
  const [code] = splitComment(line);
  for (let i = 0; i < code.length; i++) {
    const c = code[i]!;
    if (quote) {
      if (quote === '"' && c === "\\") i++;
      else if (c === quote) quote = undefined;
    } else if (c === '"' || c === "'") quote = c;
    else if (c === "[") depth++;
    else if (c === "]") depth--;
  }
  return depth;
}

/** Value of `[table] key` read by the TOML parser. */
function tomlGet(text: string, table: string, key: string): unknown {
  const doc = Bun.TOML.parse(text) as Record<string, any>;
  let t: any = doc;
  for (const k of table.replace(/^\[+|\]+$/g, "").split(".")) t = t?.[k];
  return Array.isArray(t) ? t[0]?.[key] : t?.[key]; // [[bin]]: first entry
}

/** Rewrite `key = <value>` in `[table]` (header may carry a comment; value may span lines). */
export function tomlSet(
  text: string,
  table: string,
  key: string,
  value: string,
): string {
  const lines = text.split("\n");
  const header = (l: string) => splitComment(l)[0].trim();
  const start = lines.findIndex((l) => header(l) === table);
  if (start < 0) throw new Error(`${table} not found`);
  for (
    let i = start + 1;
    i < lines.length && !/^\s*\[/.test(header(lines[i]!));
    i++
  ) {
    if (!new RegExp(`^\\s*${key}\\s*=`).test(lines[i]!)) continue;
    let end = i;
    let depth = bracketDepth(lines[i]!);
    while (depth > 0 && end + 1 < lines.length)
      depth += bracketDepth(lines[++end]!);
    const comment = splitComment(lines[end]!)[1];
    lines.splice(
      i,
      end - i + 1,
      `${key} = ${value}${comment ? ` ${comment}` : ""}`,
    );
    return lines.join("\n");
  }
  throw new Error(`${table} ${key} not found`);
}

const DEP_FIELDS = [
  "dependencies",
  "devDependencies",
  "peerDependencies",
  "optionalDependencies",
];
const reEscape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Directories of the bun workspaces (root package.json `workspaces`, array or `{ packages }`). */
function workspaceDirs(root: string): string[] {
  const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
  const globs: string[] = Array.isArray(pkg.workspaces)
    ? pkg.workspaces
    : (pkg.workspaces?.packages ?? []);
  const dirs = new Set<string>();
  for (const g of globs)
    for (const f of new Bun.Glob(`${g}/package.json`).scanSync({
      cwd: root,
      onlyFiles: true,
    }))
      dirs.add(dirname(f).replaceAll("\\", "/"));
  return [...dirs].sort();
}

export function plan(root: string, id = loadIdentity(root)): Edit[] {
  const edits: Edit[] = [];
  const read = (f: string) => readFileSync(join(root, f), "utf8");
  const tomlEdit = (
    file: string,
    table: string,
    key: string,
    want: unknown,
  ) => {
    const have = tomlGet(read(file), table, key);
    if (have !== undefined && JSON.stringify(have) !== JSON.stringify(want))
      edits.push({
        file,
        what: `${table} ${key}`,
        have: JSON.stringify(have),
        want: JSON.stringify(want),
        apply: (s) => tomlSet(s, table, key, JSON.stringify(want)),
      });
  };
  tomlEdit("Cargo.toml", "[workspace.package]", "authors", [id.orgs.main]);
  tomlEdit("Cargo.toml", "[workspace.package]", "repository", repoUrl(id));
  tomlEdit(
    "Cargo.toml",
    "[workspace.package]",
    "homepage",
    `https://${id.domains.home}`,
  );
  tomlEdit("crates/ay/Cargo.toml", "[package]", "name", id.cli.crate);
  tomlEdit("crates/ay/Cargo.toml", "[[bin]]", "name", id.cli.binary);
  tomlEdit("crates/ay/Cargo.toml", "[package]", "repository", repoUrl(id));

  // Crates: <dir> or <crate_prefix><dir>; a rename follows every `package = "..."` key.
  const prefix = id.naming.crate_prefix;
  const fixed = id.naming.crate_names ?? {};
  const crateFiles = existsSync(join(root, "crates"))
    ? readdirSync(join(root, "crates"))
        .map((d) => `crates/${d}/Cargo.toml`)
        .filter((f) => existsSync(join(root, f)))
    : [];
  const cargoFiles = ["Cargo.toml", ...crateFiles];
  for (const file of crateFiles) {
    const dir = basename(dirname(file));
    const name = (Bun.TOML.parse(read(file)) as any).package?.name as
      string | undefined;
    if (!name || dir === "ay") continue;
    const want = fixed[dir] ?? (name === dir ? dir : `${prefix}${dir}`);
    if (name === want) continue;
    tomlEdit(file, "[package]", "name", want);
    const re = new RegExp(`(package\\s*=\\s*)"${reEscape(name)}"`, "g");
    for (const other of cargoFiles)
      if (read(other).match(re))
        edits.push({
          file: other,
          what: `package = "${name}"`,
          have: name,
          want,
          apply: (s) => s.replace(re, `$1"${want}"`),
        });
  }

  // npm: expected names never depend on the current ones.
  const scope = id.naming.npm_scope;
  const products = Object.values(id.products ?? {});
  const pkgs = [
    "package.json",
    ...workspaceDirs(root).map((d) => `${d}/package.json`),
  ];
  const expected = pkgs.map((file) => {
    const pkg = JSON.parse(read(file));
    const product = products.find((p) => `${p.path}/package.json` === file);
    const want = `${scope}/${file === "package.json" ? "monorepo" : product ? product.binary : basename(dirname(file))}`;
    return { file, pkg, want };
  });
  const byName = new Map(expected.map((e) => [String(e.pkg.name), e.want]));
  const valid = new Set(expected.map((e) => e.want));
  if (valid.size !== expected.length) {
    const seen = new Map<string, string>();
    for (const e of expected) {
      const prev = seen.get(e.want);
      if (prev)
        edits.push({
          file: e.file,
          what: "name collision",
          have: `${e.want} (also ${prev})`,
          want: "one workspace per name",
          apply: () => {
            throw new Error(`${e.file} and ${prev} would both be ${e.want}`);
          },
        });
      seen.set(e.want, e.file);
    }
  }
  for (const { file, pkg, want } of expected) {
    const renames: [string, string, string][] = []; // [field, from, to]
    for (const field of DEP_FIELDS)
      for (const [dep, spec] of Object.entries<string>(pkg[field] ?? {})) {
        if (!String(spec).startsWith("workspace:")) continue;
        const target = byName.get(dep) ?? dep;
        if (!valid.has(target))
          edits.push({
            file,
            what: `${field} ${dep}`,
            have: dep,
            want: "a workspace package",
            apply: () => {
              throw new Error(
                `${file}: ${field} ${dep} names no workspace package`,
              );
            },
          });
        else if (dep !== target) renames.push([field, dep, target]);
      }
    if (pkg.name === want && !renames.length) continue;
    edits.push({
      file,
      what: pkg.name === want ? "workspace dependency names" : "name",
      have: [pkg.name, ...renames.map((r) => r[1])].join(", "),
      want: [want, ...renames.map((r) => r[2])].join(", "),
      apply: (s) => {
        const o = JSON.parse(s);
        o.name = want;
        for (const [field, from, to] of renames)
          o[field] = Object.fromEntries(
            Object.entries(o[field]).map(([k, v]) => [k === from ? to : k, v]),
          );
        return `${JSON.stringify(o, null, 2)}\n`;
      },
    });
  }
  return edits;
}

function main(argv: string[]) {
  const i = argv.indexOf("--root");
  const root = i >= 0 ? resolve(argv[i + 1]!) : findRoot();
  const id = loadIdentity(root);
  const cmd =
    argv.find((a, j) => !a.startsWith("--") && (i < 0 || j !== i + 1)) ??
    "check";
  if (cmd === "get") {
    const key = argv[argv.indexOf("get") + 1] ?? "";
    const v =
      key === "repo_url"
        ? repoUrl(id)
        : key.split(".").reduce<any>((o, k) => o?.[k], id);
    if (v === undefined || typeof v === "object") {
      console.error(`identity: no scalar ${key}`);
      return 2;
    }
    console.log(String(v));
    return 0;
  }
  const edits = plan(root, id);
  if (cmd === "check") {
    for (const e of edits)
      console.error(`identity: ${e.file} ${e.what}: ${e.have} != ${e.want}`);
    if (!edits.length) console.log("identity: manifests match identity.toml");
    return edits.length ? 1 : 0;
  }
  if (cmd === "apply") {
    for (const [file, es] of Map.groupBy(edits, (e) => e.file)) {
      const p = join(root, file);
      writeFileSync(
        p,
        es.reduce((s, e) => e.apply(s), readFileSync(p, "utf8")),
      );
      for (const e of es)
        console.log(`identity: ${file} ${e.what}: ${e.have} -> ${e.want}`);
    }
    return 0;
  }
  console.error(
    "usage: bun scripts/identity.ts check|apply|get <key> [--root DIR]",
  );
  return 2;
}

if (import.meta.main) process.exit(main(Bun.argv.slice(2)));
