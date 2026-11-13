// Digest du journal d'apprentissage + inventaire mémoire. --done : vide le journal traité. --count : nb d'entrées.
import { readFileSync, writeFileSync, readdirSync, existsSync } from "node:fs";
const H = process.env.USERPROFILE ?? process.env.HOME!;
const J = `${H}/.claude/learning/journal.jsonl`;
const recs = existsSync(J)
  ? readFileSync(J, "utf8")
      .split("\n")
      .filter(Boolean)
      .flatMap((l) => {
        try {
          return [JSON.parse(l)];
        } catch {
          return [];
        }
      })
  : [];
if (process.argv.includes("--count")) {
  console.log(recs.length);
  process.exit(0);
}
if (process.argv.includes("--done")) {
  writeFileSync(J, "");
  console.log(`journal vidé (${recs.length})`);
  process.exit(0);
}
const by = new Map<string, any[]>();
for (const r of recs)
  (by.get(r.cwd ?? "?") ?? by.set(r.cwd ?? "?", []).get(r.cwd ?? "?")!).push(r);
const top = (xs: string[], n = 10) =>
  [
    ...xs.reduce(
      (m, x) => m.set(x, (m.get(x) ?? 0) + 1),
      new Map<string, number>(),
    ),
  ]
    .sort((a, b) => b[1] - a[1])
    .slice(0, n);
for (const [cwd, rs] of by) {
  console.log(`## ${cwd} (${rs.length} entrées)`);
  for (const k of ["fixes", "errors", "recovered"]) {
    const t = top(
      rs.flatMap((r) => r[k] ?? []).map((s: string) => s.slice(0, 140)),
    );
    if (t.length)
      console.log(`${k}:\n` + t.map(([s, n]) => `  ${n}x ${s}`).join("\n"));
  }
}
console.log("## mémoires");
const P = `${H}/.claude/projects`;
for (const p of readdirSync(P)) {
  const m = `${P}/${p}/memory`;
  if (!existsSync(m)) continue;
  const fs = readdirSync(m).filter(
    (f) => f.endsWith(".md") && f !== "MEMORY.md",
  );
  if (!fs.length) continue;
  console.log(`${p}:`);
  for (const f of fs) {
    const d =
      /description:\s*"?(.*?)"?\s*$/m.exec(
        readFileSync(`${m}/${f}`, "utf8"),
      )?.[1] ?? "";
    console.log(`  ${f}: ${d.slice(0, 110)}`);
  }
}
