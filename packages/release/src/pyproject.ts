#!/usr/bin/env bun
// pyproject.toml of a PyO3 crate without one, on stdout (used by .github/workflows/pypi-publish.yml).
//   bun packages/release/src/pyproject.ts src/agent/py > src/agent/py/pyproject.toml
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { pyproject } from "./plan.ts";

const root = join(import.meta.dir, "..", "..", "..");
const crate = process.argv[2] ?? "";
const cfg = Bun.TOML.parse(
  readFileSync(join(import.meta.dir, "..", "release.toml"), "utf8"),
) as any;
const ws = (
  Bun.TOML.parse(readFileSync(join(root, "Cargo.toml"), "utf8")) as any
).workspace.package;
const ct = (
  Bun.TOML.parse(readFileSync(join(root, crate, "Cargo.toml"), "utf8")) as any
).package;
const version = typeof ct.version === "string" ? ct.version : ws.version;
process.stdout.write(
  pyproject(
    cfg.pypi.dist_name?.[crate] ?? ct.name,
    version,
    ct.description ?? ct.name,
    cfg.repo,
  ),
);
