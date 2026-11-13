import { expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { plan, splitComment } from "./identity";

const identity = (scope: string, org: string) => `[product]
name = "x"
display = "X"
repo = "src"
[cli]
binary = "xy"
crate = "x"
[naming]
npm_scope = "${scope}"
crate_prefix = "x-"
[naming.crate_names]
legacy = "old-legacy"
[orgs]
main = "${org}"   # main org
lab = "lab"
[domains]
root = "x.org"
home = "labs.x.org"
git = "git.x.org"
contact = "c@x.org"
[products.agent]
binary = "agent"
path = "packages/ai"
`;

function repo(scope: string, org: string, aiDeps: Record<string, string>) {
  const r = mkdtempSync(join(tmpdir(), "identity-"));
  const w = (f: string, s: string) => {
    mkdirSync(join(r, f, ".."), { recursive: true });
    writeFileSync(join(r, f), s);
  };
  w("identity.toml", identity(scope, org));
  w(
    "Cargo.toml",
    `[workspace.package]\nauthors = [\n  "old-org", # owner\n]\nrepository = "https://github.com/old-org/src" # repo\nhomepage = "https://labs.x.org"\n`,
  );
  w(
    "crates/ay/Cargo.toml",
    `[package]\nname = "x"\nrepository = "https://github.com/old-org/src"\n\n[[bin]]\nname = "xy"\n`,
  );
  w(
    "crates/net/Cargo.toml",
    `[package] # net crate\nname = "y-net" # "quoted # hash"\n`,
  );
  w("crates/legacy/Cargo.toml", `[package]\nname = "old-legacy"\n`);
  w(
    "crates/use/Cargo.toml",
    `[package]\nname = "use"\n\n[dependencies]\nnet = { package = "y-net", path = "../net" }\n`,
  );
  w(
    "package.json",
    JSON.stringify(
      { name: "@x/monorepo", workspaces: ["packages/*"] },
      null,
      2,
    ),
  );
  w("packages/core/package.json", JSON.stringify({ name: "@x/core" }, null, 2));
  w(
    "packages/ai/package.json",
    JSON.stringify({ name: "@x/whatever", dependencies: aiDeps }, null, 2),
  );
  return r;
}

const applyAll = (r: string) => {
  for (const [file, es] of Map.groupBy(plan(r), (e) => e.file)) {
    const p = join(r, file);
    writeFileSync(
      p,
      es.reduce((s, e) => e.apply(s), readFileSync(p, "utf8")),
    );
  }
};

test("identity: TOML comments are split outside strings only", () => {
  expect(splitComment(`name = "a # b" # c`)).toEqual([
    `name = "a # b" `,
    "# c",
  ]);
  expect(splitComment(`k = 'x#y' # "q"`)).toEqual([`k = 'x#y' `, `# "q"`]);
  expect(splitComment(`k = "a\\"#" # z`)).toEqual([`k = "a\\"#" `, "# z"]);
});

test("identity: a workspace dependency naming no workspace package fails at constant scope", () => {
  const r = repo("@x", "old-org", {
    "@x/core": "workspace:*",
    "@x/gone": "workspace:*",
  });
  const bad = plan(r).filter((e) => e.what === "dependencies @x/gone");
  expect(bad.length).toBe(1);
  expect(() => bad[0]!.apply("")).toThrow("names no workspace package");
});

test("identity: crate prefix, comments, multi-line arrays, npm names; apply converges", () => {
  const r = repo("@x", "new-org", { "@x/core": "workspace:*", zod: "^4" });
  const what = plan(r)
    .map((e) => `${e.file} ${e.what}`)
    .sort();
  expect(what).toEqual([
    "Cargo.toml [workspace.package] authors",
    "Cargo.toml [workspace.package] repository",
    "crates/ay/Cargo.toml [package] repository",
    "crates/net/Cargo.toml [package] name",
    'crates/use/Cargo.toml package = "y-net"',
    "packages/ai/package.json name",
  ]);
  applyAll(r);
  expect(plan(r)).toEqual([]);
  expect(readFileSync(join(r, "crates/net/Cargo.toml"), "utf8")).toBe(
    `[package] # net crate\nname = "x-net" # "quoted # hash"\n`,
  );
  expect(readFileSync(join(r, "crates/use/Cargo.toml"), "utf8")).toContain(
    `package = "x-net"`,
  );
  const cargo = readFileSync(join(r, "Cargo.toml"), "utf8");
  expect(Bun.TOML.parse(cargo)).toEqual({
    workspace: {
      package: {
        authors: ["new-org"],
        repository: "https://github.com/new-org/src",
        homepage: "https://labs.x.org",
      },
    },
  });
  expect(cargo).toContain("# repo");
  expect(
    JSON.parse(readFileSync(join(r, "packages/ai/package.json"), "utf8")),
  ).toEqual({
    name: "@x/agent",
    dependencies: { "@x/core": "workspace:*", zod: "^4" },
  });
});

test("identity: a scope change renames packages and their workspace dependency keys", () => {
  const r = repo("@n", "old-org", { "@x/core": "workspace:*" });
  applyAll(r);
  expect(plan(r)).toEqual([]);
  expect(
    JSON.parse(readFileSync(join(r, "packages/ai/package.json"), "utf8")),
  ).toEqual({
    name: "@n/agent",
    dependencies: { "@n/core": "workspace:*" },
  });
});
