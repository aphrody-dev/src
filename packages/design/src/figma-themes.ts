// Emits the Figma Plugin API script that syncs tokens/themes.json into a Figma file: one collection per theme and
// mode (Starter plan = one mode per collection), key roles only. Run it through the Figma MCP `use_figma` tool.
// Usage : bun run src/figma-themes.ts > tokens/figma-themes-sync.js
import { join } from "node:path";

const data = await Bun.file(join(import.meta.dir, "../tokens/themes.json")).json();
const ROLES = ["primary", "on-primary", "secondary", "on-secondary", "tertiary", "error", "background", "on-background", "surface", "on-surface", "surface-container", "outline", "outline-variant"];
const cols = Object.entries<any>(data.themes).flatMap(([n, t]) =>
  (["light", "dark"] as const).map((m) => [`Theme ${n} ${m}`, ROLES.map((r) => [r, t[m][r].slice(1)])]),
);
console.log(`const DATA = ${JSON.stringify(cols)};
const rgb = (h) => ({ r: parseInt(h.slice(0, 2), 16) / 255, g: parseInt(h.slice(2, 4), 16) / 255, b: parseInt(h.slice(4, 6), 16) / 255 });
const cs = await figma.variables.getLocalVariableCollectionsAsync();
const all = await figma.variables.getLocalVariablesAsync();
const out = [];
for (const [name, vars] of DATA) {
  const col = cs.find((c) => c.name === name) ?? figma.variables.createVariableCollection(name);
  for (const [r, hex] of vars) {
    const full = "Themes/" + r;
    const v = all.find((x) => x.name === full && x.variableCollectionId === col.id) ?? figma.variables.createVariable(full, col, "COLOR");
    v.scopes = /^on-|outline/.test(r) ? (r.startsWith("outline") ? ["STROKE_COLOR"] : ["TEXT_FILL", "SHAPE_FILL"]) : ["FRAME_FILL", "SHAPE_FILL"];
    v.setVariableCodeSyntax("WEB", "var(--md-sys-color-" + r + ")");
    v.setValueForMode(col.modes[0].modeId, rgb(hex));
  }
  out.push(name);
}
return { collections: out.length, vars: DATA[0][1].length };`);
