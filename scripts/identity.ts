#!/usr/bin/env bun
// identity: identity.toml is the single source of the product identity; this script checks and
// rewrites every manifest that copies it (docs/ARCHITECTURE-ROOT.md invariant 5).
//
//   bun scripts/identity.ts check [--root DIR]   exit 1 on drift (gate in `just check`)
//   bun scripts/identity.ts apply [--root DIR]   rewrite the derived fields from identity.toml
//   bun scripts/identity.ts get <dotted.key>     print one value (recipes, CI)
//
// Derived fields: Cargo.toml [workspace.package] authors/repository/homepage; crates/ay package
// name and [[bin]] name; root and packages/*/package.json names; `workspace:` dependency keys;
// sub-products ([products.*]) package names. Values are compared parsed (comments, multi-line arrays).
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

export type Identity = {
  product: { name: string; display: string; repo: string };
  cli: { binary: string; crate: string };
  naming: {
    npm_scope: string;
    crate_prefix: string;
    env_prefix: string;
    symbol_prefix: string;
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
  `https://github.com/${id.orgs.main}/${id.product.repo}`;

type Edit = {
  file: string;
  what: string;
  have: string;
  want: string;
  apply: (s: string) => string;
};

/** Value of `[table] key` read by the TOML parser (multi-line arrays and comments included). */
function tomlGet(text: string, table: string, key: string): unknown {
  const doc = Bun.TOML.parse(text) as Record<string, any>;
  const path = table.replace(/^\[+|\]+$/g, "").split(".");
  let t: any = doc;
  for (const k of path) t = t?.[k];
  return Array.isArray(t) ? t[0]?.[key] : t?.[key]; // [[bin]]: first entry
}

/** Rewrite `key = <value>` in `[table]`; the old value may span lines (arrays) and carry a comment. */
function tomlSet(
  text: string,
  table: string,
  key: string,
  value: string,
): string {
  const lines = text.split("\n");
  const start = lines.findIndex((l) => l.trim() === table);
  if (start < 0) throw new Error(`${table} not found`);
  for (let i = start + 1; i < lines.length && !/^\s*\[/.test(lines[i]!); i++) {
    if (!new RegExp(`^\\s*${key}\\s*=`).test(lines[i]!)) continue;
    let end = i;
    const rest = lines[i]!.replace(/^[^=]*=\s*/, "");
    if (rest.startsWith("[")) {
      let depth = 0;
      for (end = i; end < lines.length; end++) {
        for (const c of lines[end]!.replace(/"[^"]*"/g, "").replace(/#.*$/, ""))
          depth += c === "[" ? 1 : c === "]" ? -1 : 0;
        if (depth <= 0) break;
      }
    }
    const comment = lines[end]!.match(/\s+#[^"]*$/)?.[0] ?? "";
    lines.splice(i, end - i + 1, `${key} = ${value}${comment}`);
    return lines.join("\n");
  }
  throw new Error(`${table} ${key} not found`);
}

const q = (s: string) => JSON.stringify(s);
const DEP_FIELDS = [
  "dependencies",
  "devDependencies",
  "peerDependencies",
  "optionalDependencies",
];

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

  // npm: the expected name never depends on the current one: <scope>/monorepo at the root,
  // <scope>/<binary> for a [products.*] entry, <scope>/<directory> otherwise.
  const scope = id.naming.npm_scope;
  const products = Object.values(id.products ?? {});
  const pkgs = [
    "package.json",
    ...readdirSync(join(root, "packages"))
      .map((d) => `packages/${d}/package.json`)
      .filter((f) => existsSync(join(root, f))),
  ];
  const names = new Map<string, string>(); // current name -> expected name, for dependency keys
  const expected = pkgs.map((file) => {
    const pkg = JSON.parse(read(file));
    const product = products.find((p) => `${p.path}/package.json` === file);
    const want = `${scope}/${file === "package.json" ? "monorepo" : product ? product.binary : file.split("/")[1]}`;
    names.set(String(pkg.name), want);
    return { file, pkg, want };
  });
  for (const { file, pkg, want } of expected) {
    if (pkg.name !== want)
      edits.push({
        file,
        what: "name",
        have: pkg.name,
        want,
        apply: (s) => s.replace(`"name": ${q(pkg.name)}`, `"name": ${q(want)}`),
      });
    // Workspace dependencies must use the expected name of the package they point to.
    for (const field of DEP_FIELDS)
      for (const [dep, spec] of Object.entries<string>(pkg[field] ?? {})) {
        if (!String(spec).startsWith("workspace:")) continue;
        const target =
          names.get(dep) ??
          (dep.startsWith(`${scope}/`)
            ? dep
            : `${scope}/${dep.split("/").pop()}`);
        if (dep !== target)
          edits.push({
            file,
            what: `${field} key`,
            have: dep,
            want: target,
            apply: (s) => s.replace(`${q(dep)}:`, `${q(target)}:`),
          });
      }
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
    const byFile = Map.groupBy(edits, (e) => e.file);
    for (const [file, es] of byFile) {
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
