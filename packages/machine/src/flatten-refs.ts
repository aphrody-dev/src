// Deuxième passe du flatten : réécrit les références restantes aux anciens chemins third_party/<cat>/<dépôt>,
// quel que soit le séparateur (/ ou \) et sans exiger de / final (DEPS, manifestes, code, docs, liens file:///).
// Source : var/flatten-third-party.json (écrit par flatten-third-party.ts --apply).
// Usage (racine du dépôt) : bun packages/machine/src/flatten-refs.ts [--apply]
// Les références à une catégorie seule (third_party/<cat>/) sont listées : elles n'ont pas d'équivalent unique.
import { join } from "node:path";

const repo = join(import.meta.dir, "..", "..", "..");
const apply = process.argv.includes("--apply");
const plan = (await Bun.file(
  join(repo, "var", "flatten-third-party.json"),
).json()) as {
  moves: { from: string; to: string }[];
  drops: { d: string; keep: string }[];
};
const pairs = [
  ...plan.moves.map((m) => [m.from, m.to] as const),
  ...plan.drops.map((x) => [x.d, x.keep] as const),
].sort((a, b) => b[0].length - a[0].length);
const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const rules = pairs.map(([from, to]) => ({
  re: new RegExp(
    `${from.split("/").map(esc).join("([/\\\\]+)")}(?![A-Za-z0-9_.-])`,
    "g",
  ),
  to: to.split("/"),
}));
const cats = [...new Set(pairs.map(([f]) => f.split("/")[1]!))];
const catRe = new RegExp(
  `third_party[/\\\\]+(${cats.map(esc).join("|")})(?![A-Za-z0-9_.-])`,
);

// Fichiers suivis (sous-modules compris) qui citent une catégorie ; exclus : amonts, verrous et fichiers générés.
const grep = Bun.spawnSync(
  [
    "git",
    "grep",
    "--recurse-submodules",
    "-l",
    "-E",
    `third_party[/\\\\]+(${cats.join("|")})([/\\\\]|$|[^A-Za-z0-9_.-])`,
    "--",
    ".",
    ":!third_party",
    ":!src.lock.json",
    ":!var",
    ":!DEPS",
    ":!.repo",
    ":!docs/core/ARCHITECTURE-ROOT.md",
    ":!packages/machine",
  ],
  { cwd: repo },
);
const files = grep.stdout.toString().split("\n").filter(Boolean);
let changed = 0;
let count = 0;
const leftovers: string[] = [];
for (const f of files) {
  const abs = join(repo, f);
  const before = await Bun.file(abs).text();
  let text = before;
  for (const r of rules)
    text = text.replace(r.re, (...m) => {
      count++;
      const sep = typeof m[1] === "string" ? m[1] : "/";
      return r.to.join(sep);
    });
  for (const line of text.split("\n"))
    if (catRe.test(line)) leftovers.push(`${f}: ${line.trim().slice(0, 160)}`);
  if (text !== before) {
    changed++;
    if (apply) await Bun.write(abs, text);
  }
}
console.log(
  `${files.length} fichiers examinés, ${changed} modifiés, ${count} références réécrites${apply ? "" : " (simulation)"}`,
);
console.log(`références de catégorie restantes : ${leftovers.length}`);
for (const l of leftovers) console.log(`  ${l}`);
