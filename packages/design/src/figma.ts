// Emits the Figma Plugin API script that syncs tokens/figma-variables.json into a Figma file
// (idempotent find-or-create by name). Run it through the Figma MCP `use_figma` tool,
// skills figma-use + figma-generate-library, then commit the file key in tokens/figma.json.
// Usage : bun run src/figma.ts [--modes N]   (N = mode limit of the plan : Starter 1, Professional 4)
import { join } from "node:path";

const pkg = join(import.meta.dir, "..");
const vars = await Bun.file(join(pkg, "tokens/figma-variables.json")).json();
const i = process.argv.indexOf("--modes");
const limit = i > 0 ? Number(process.argv[i + 1]) : 4;

// Split collections whose mode count exceeds the plan limit.
const collections: any[] = [];
for (const c of vars.collections) {
  for (let k = 0; k < c.modes.length; k += limit) {
    const modes = c.modes.slice(k, k + limit);
    const name =
      c.modes.length > limit ? `${c.name} / ${modes.join(", ")}` : c.name;
    collections.push({
      ...c,
      name,
      modes,
      variables: c.variables.map((v: any) => ({
        ...v,
        values: Object.fromEntries(modes.map((m: string) => [m, v.values[m]])),
      })),
    });
  }
}

const scopesFor = (name: string, type: string) => {
  if (type === "FLOAT") return ["CORNER_RADIUS"];
  if (name.startsWith("Palettes/")) return [];
  if (/\/On |Outline/.test(name))
    return /Outline/.test(name)
      ? ["STROKE_COLOR"]
      : ["TEXT_FILL", "SHAPE_FILL"];
  return ["FRAME_FILL", "SHAPE_FILL", "STROKE_COLOR"];
};
const hex = (c: any) =>
  "#" +
  [c.r, c.g, c.b]
    .map((x: number) =>
      Math.round(x * 255)
        .toString(16)
        .padStart(2, "0"),
    )
    .join("");
for (const c of collections)
  for (const v of c.variables) {
    v.scopes = scopesFor(v.name, v.type);
    if (v.type === "COLOR")
      v.values = Object.fromEntries(
        Object.entries(v.values).map(([m, x]) => [m, hex(x)]),
      );
  }

const scopeTable: string[][] = [];
const sid = (sc: string[]) => {
  const k = JSON.stringify(sc);
  let i = scopeTable.findIndex((x) => JSON.stringify(x) === k);
  if (i < 0) i = scopeTable.push(sc) - 1;
  return i;
};
const compact = collections
  .filter((c) => !c.name.startsWith("M3 Palettes"))
  .map((c) => {
    const prefix = c.variables[0].name.split("/")[0] + "/";
    return [
      c.name,
      c.modes,
      c.variables[0].type,
      prefix,
      c.variables.map((v: any) => [
        v.name.slice(prefix.length),
        v.codeSyntax?.WEB?.replace(/^var\(--md-sys-(.*)\)$/, "$1") ?? "",
        sid(v.scopes),
        c.modes.map((m: string) =>
          v.type === "COLOR" ? String(v.values[m]).slice(1) : v.values[m],
        ),
      ]),
    ];
  });
const script = `const SCOPES = ${JSON.stringify(scopeTable)};
const DATA = ${JSON.stringify(compact)};
const rgb = (h) => ({ r: parseInt(h.slice(0, 2), 16) / 255, g: parseInt(h.slice(2, 4), 16) / 255, b: parseInt(h.slice(4, 6), 16) / 255, a: 1 });
const existing = await figma.variables.getLocalVariableCollectionsAsync();
const all = await figma.variables.getLocalVariablesAsync();
const report = [];
for (const [cname, modes, type, prefix, vars] of DATA) {
  let col = existing.find((x) => x.name === cname);
  if (!col) { col = figma.variables.createVariableCollection(cname); col.renameMode(col.modes[0].modeId, modes[0]); }
  for (const m of modes.slice(1)) if (!col.modes.some((x) => x.name === m)) col.addMode(m);
  const ids = modes.map((m) => col.modes.find((x) => x.name === m).modeId);
  for (const [name, web, scope, values] of vars) {
    const full = prefix + name;
    const v = all.find((x) => x.name === full && x.variableCollectionId === col.id) ?? figma.variables.createVariable(full, col, type);
    v.scopes = SCOPES[scope];
    if (web) v.setVariableCodeSyntax("WEB", "var(--md-sys-" + web + ")");
    values.forEach((val, i) => v.setValueForMode(ids[i], type === "COLOR" ? rgb(val) : val));
  }
  const wanted = new Set(vars.map(([n]) => prefix + n));
  const stale = all.filter((x) => x.variableCollectionId === col.id && !wanted.has(x.name)).map((x) => x.name);
  report.push({ collection: col.name, id: col.id, modes: col.modes.map((x) => x.name), variables: vars.length, stale });
}
return { report };
`;
await Bun.write(join(pkg, "tokens/figma-sync.js"), script);
console.log(
  `tokens/figma-sync.js : ${collections.length} collections, limite ${limit} modes`,
);
