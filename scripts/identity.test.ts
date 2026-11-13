import { expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { plan } from "./identity";

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
env_prefix = "X_"
symbol_prefix = "x_"
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

function repo(scope: string, org: string) {
  const r = mkdtempSync(join(tmpdir(), "identity-"));
  for (const d of ["crates/ay", "packages/ai", "packages/core"])
    mkdirSync(join(r, d), { recursive: true });
  writeFileSync(join(r, "identity.toml"), identity(scope, org));
  writeFileSync(
    join(r, "Cargo.toml"),
    `[workspace.package]\nauthors = [\n  "old-org", # owner\n]\nrepository = "https://github.com/old-org/src" # repo\nhomepage = "https://labs.x.org"\n`,
  );
  writeFileSync(
    join(r, "crates/ay/Cargo.toml"),
    `[package]\nname = "x"\nrepository = "https://github.com/old-org/src"\n\n[[bin]]\nname = "xy"\n`,
  );
  writeFileSync(
    join(r, "package.json"),
    JSON.stringify({ name: "@x/monorepo" }, null, 2),
  );
  writeFileSync(
    join(r, "packages/core/package.json"),
    JSON.stringify({ name: "@x/core" }, null, 2),
  );
  writeFileSync(
    join(r, "packages/ai/package.json"),
    JSON.stringify(
      {
        name: "@x/whatever",
        dependencies: {
          "@x/core": "workspace:*",
          "@stale/core": "workspace:*",
          zod: "^4",
        },
      },
      null,
      2,
    ),
  );
  return r;
}

test("identity: drift is found from identity.toml alone, apply converges", () => {
  const r = repo("@x", "new-org");
  const edits = plan(r);
  const what = edits.map((e) => `${e.file} ${e.what}`).sort();
  expect(what).toEqual([
    "Cargo.toml [workspace.package] authors",
    "Cargo.toml [workspace.package] repository",
    "crates/ay/Cargo.toml [package] repository",
    "packages/ai/package.json dependencies key",
    "packages/ai/package.json name",
  ]);
  for (const [file, es] of Map.groupBy(edits, (e) => e.file)) {
    const p = join(r, file);
    writeFileSync(
      p,
      es.reduce((s, e) => e.apply(s), readFileSync(p, "utf8")),
    );
  }
  expect(plan(r)).toEqual([]);
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
