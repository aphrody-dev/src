#!/usr/bin/env bun
// ay-index: recursive tree-sitter index of src (+ third_party/vendor clones) into sqlite + JSON,
// then skill/doc generation from it.
//   bun packages/core/src/cli.ts index [root] [--all] [--include a,b] [--db path] [--json path]
//   bun packages/core/src/cli.ts gen [root] [--db path]
//   bun packages/core/src/cli.ts users <needle> [--db path]
import { mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { parseArgs } from "node:util";
import { indexEach, loadCore } from "./ffi.ts";
import { generate } from "./generate.ts";
import { classification, openStore, usersOf, writeFiles } from "./store.ts";

const { values, positionals } = parseArgs({
  args: Bun.argv.slice(2),
  allowPositionals: true,
  options: {
    all: { type: "boolean", default: false },
    include: { type: "string" },
    db: { type: "string" },
    json: { type: "string" },
  },
});

const [cmd = "index", arg] = positionals;
const root = resolve(
  cmd === "users"
    ? "."
    : (arg ?? process.env.SRC_ROOT ?? join(import.meta.dir, "..", "..", "..")),
);
const dbPath = values.db ?? join(root, "var", "index", "core.db");
mkdirSync(dirname(dbPath), { recursive: true });
const db = openStore(dbPath);

if (cmd === "index") {
  const core = loadCore();
  if (!core) {
    console.error(
      "aphrody_core_capi introuvable : cargo build -p aphrody-core-capi --release (sur prd)",
    );
    process.exit(2);
  }
  const t0 = performance.now();
  const batch: Parameters<typeof writeFiles>[1] extends Iterable<infer T>
    ? T[]
    : never = [];
  const stats = indexEach(
    root,
    (f) => {
      batch.push(f);
      if (batch.length >= 2000) writeFiles(db, batch.splice(0));
    },
    { includes: values.include?.split(","), followIgnore: !values.all },
  );
  writeFiles(db, batch);
  const totalMs = Math.round(performance.now() - t0);
  db.prepare(
    "INSERT OR REPLACE INTO meta VALUES ('root', ?), ('stats', ?), ('indexed_at', ?)",
  ).run(
    root,
    JSON.stringify({ ...stats, total_ms: totalMs }),
    new Date().toISOString(),
  );
  const summary = {
    root,
    lib: core.path,
    ...stats,
    total_ms: totalMs,
    classes: classification(db).slice(0, 200),
  };
  await Bun.write(
    values.json ?? join(dirname(dbPath), "index.json"),
    JSON.stringify(summary, null, 1),
  );
  console.log(JSON.stringify({ ...stats, total_ms: totalMs, db: dbPath }));
} else if (cmd === "gen") {
  for (const r of await generate(db, root))
    console.log(`${r.skill}: ${r.cited} fichiers testés -> ${r.skillPath}`);
} else if (cmd === "users") {
  if (!arg) throw new Error("usage: users <needle>");
  for (const p of usersOf(db, arg)) console.log(p);
} else {
  console.error(`commande inconnue: ${cmd}`);
  process.exit(1);
}
