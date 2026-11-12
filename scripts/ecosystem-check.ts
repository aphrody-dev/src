// Fails if any tree-sitter / LLVM / GPU / firmware clone under third_party/ lacks an
// ECOSYSTEM.toml record, a non-empty used_by, or a pinned sha matching the checkout.
// Usage: bun scripts/ecosystem-check.ts [--no-sha]
import { readdirSync, existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = join(import.meta.dir, "..");
const tp = join(root, "third_party");
const manifest = join(tp, "ECOSYSTEM.toml");
const SCOPE =
  /^(tree-sitter.*|llvm-.*|SPIRV-.*|circt|triton|Polygeist|mesa|edk2|coreboot)$/;
const KINDS = new Set(["grammar", "toolchain", "gpu", "firmware"]);
const errors: string[] = [];

if (!existsSync(manifest)) {
  console.error(`missing ${manifest}`);
  process.exit(1);
}
type Entry = {
  path: string;
  sha: string;
  kind: string;
  used_by: string[];
  status: string;
};
const doc = Bun.TOML.parse(readFileSync(manifest, "utf8")) as {
  entry?: Record<string, Entry>;
};
const entries = doc.entry ?? {};
const byPath = new Map(
  Object.entries(entries).map(([k, e]) => [e.path, { k, ...e }]),
);

for (const [k, e] of Object.entries(entries)) {
  if (!e.path || !existsSync(join(root, e.path)))
    errors.push(`${k}: path ${e.path} absent`);
  if (!KINDS.has(e.kind))
    errors.push(`${k}: kind '${e.kind}' not in ${[...KINDS].join("|")}`);
  if (!Array.isArray(e.used_by) || e.used_by.length === 0)
    errors.push(`${k}: no used_by`);
  if (!/^[0-9a-f]{40}$/.test(e.sha ?? "")) errors.push(`${k}: bad sha`);
  if (!e.status) errors.push(`${k}: no status`);
}

for (const d of readdirSync(tp, { withFileTypes: true })) {
  if (!d.isDirectory() || !SCOPE.test(d.name)) continue;
  const rel = `third_party/${d.name}`;
  const e = byPath.get(rel);
  if (!e) {
    errors.push(`${rel}: no ECOSYSTEM.toml record`);
    continue;
  }
  if (!process.argv.includes("--no-sha")) {
    const head = Bun.spawnSync([
      "git",
      "-C",
      join(root, rel),
      "rev-parse",
      "HEAD",
    ])
      .stdout.toString()
      .trim();
    if (head && head !== e.sha)
      errors.push(`${rel}: sha ${e.sha} != HEAD ${head}`);
  }
}

if (errors.length) {
  console.error(errors.join("\n"));
  console.error(`ecosystem-check: ${errors.length} error(s)`);
  process.exit(1);
}
console.log(`ecosystem-check: ${byPath.size} entries ok`);
