// Mesure agent-desktop : latence et taille des snapshots UIA par fenêtre et variante.
// bun packages/machine/src/desktop-bench.ts <window-id>[=label] ... [--runs N] [--timeout-ms MS]
// Sortie : une ligne JSON par mesure (stdout), à reporter dans docs/.
const argv = Bun.argv.slice(2);
const opt = (k: string, d: number) => {
  const i = argv.indexOf(k);
  return i >= 0 ? Number(argv.splice(i, 2)[1]) : d;
};
const runs = opt("--runs", 3);
const timeoutMs = opt("--timeout-ms", 3000);
const targets = argv.map((a) => {
  const [id, label] = a.split("=");
  return { id, label: label ?? id };
});

const variants: Record<string, string[]> = {
  default: [],
  depth30: ["--max-depth", "30"],
  "compact-i-depth30": ["--compact", "-i", "--max-depth", "30"],
};
const INTERACTIVE = new Set([
  "button",
  "link",
  "textfield",
  "combobox",
  "checkbox",
  "menuitem",
  "tab",
  "listitem",
  "treeitem",
]);

type Node = { role?: string; children?: Node[]; ref?: string };
const walk = (
  n: Node,
  acc: { nodes: number; inter: number; depth: number },
  d = 1,
) => {
  acc.nodes++;
  if (n.role && INTERACTIVE.has(n.role)) acc.inter++;
  acc.depth = Math.max(acc.depth, d);
  for (const c of n.children ?? []) walk(c, acc, d + 1);
  return acc;
};

for (const t of targets)
  for (const [v, flags] of Object.entries(variants))
    for (let r = 1; r <= runs; r++) {
      const t0 = performance.now();
      const p = Bun.spawnSync([
        "agent-desktop.exe",
        "snapshot",
        "--window-id",
        t.id,
        "--timeout-ms",
        String(timeoutMs),
        ...flags,
      ]);
      const ms = Math.round(performance.now() - t0);
      const out = p.stdout.toString();
      let rec: Record<string, unknown> = {
        target: t.label,
        variant: v,
        run: r,
        ms,
        bytes: out.length,
      };
      try {
        const j = JSON.parse(out);
        if (j.ok) {
          const a = walk(j.data.tree, { nodes: 0, inter: 0, depth: 0 });
          rec = {
            ...rec,
            refs: j.data.ref_count,
            complete: j.data.complete,
            ...a,
          };
        } else rec.error = j.error?.code;
      } catch {
        rec.error = "unparsable";
      }
      console.log(JSON.stringify(rec));
    }
