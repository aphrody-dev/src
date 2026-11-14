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
const mockup = {
  $schema: "https://www.figma.com/plugin-api/",
  fileKey: "2xsZi5wLPAYLGNCLZ2ZJUv",
  generatedFrom: "packages/design/src/figma.ts",
  themePresets: [
    "aphrody",
    "m3",
    "fluent",
    "hyprland",
    "omarchy",
    "catppuccin",
    "cachyos",
    "nord",
    "gruvbox",
  ],
  pages: [
    {
      name: "01 Foundations & 9 Themes",
      description:
        "Material 3 HCT DynamicScheme 49 roles, M3 Shape radii, spacing scale, and 9 synced monorepo themes.",
      frames: [
        {
          name: "Theme Swatches Matrix (9 Presets x Light/Dark)",
          layoutMode: "VERTICAL",
          itemSpacing: 16,
          fillVariable: "Schemes/Surface",
          strokeVariable: "Schemes/Outline Variant",
          radiusVariable: "Corner/Large",
        },
        {
          name: "Typography & Core Web Vitals Scale",
          layoutMode: "VERTICAL",
          itemSpacing: 12,
          fillVariable: "Schemes/Surface Container Low",
          strokeVariable: "Schemes/Outline Variant",
          radiusVariable: "Corner/Medium",
        },
      ],
    },
    {
      name: "02 Shared Rust Components",
      description:
        "23 aphrody-ui::fusion primitives across 6 variable-bound AutoLayout ComponentSets (Taffy, Dioxus 0.8, GPUI-Kit, NSH, Ratatui, WinUI 3).",
      frames: [
        {
          name: "Shared Component Library",
          layoutMode: "HORIZONTAL",
          itemSpacing: 24,
          fillVariable: "Schemes/Surface",
          strokeVariable: "Schemes/Outline Variant",
          radiusVariable: "Corner/Large",
        },
      ],
    },
    {
      name: "03 Wayland-in-Browser & Intelligent Terminal",
      description:
        "4 Canonical Pages (StudioWorkspace, IntelligentTerminal, WaylandBrowserCompositor, DesignSystemGallery) across 11 RenderTargets without VM.",
      frames: [
        {
          name: "Intelligent Terminal (nsh + niubash + CachyOS)",
          layoutMode: "VERTICAL",
          itemSpacing: 12,
          fillVariable: "Schemes/Surface Container Lowest",
          strokeVariable: "Schemes/Outline",
          radiusVariable: "Corner/Large",
        },
        {
          name: "Wayland-in-Browser Compositor (Smithay + WebGPU + Dwindle)",
          layoutMode: "HORIZONTAL",
          itemSpacing: 12,
          fillVariable: "Schemes/Surface",
          strokeVariable: "Schemes/Primary",
          radiusVariable: "Corner/Medium",
        },
      ],
    },
  ],
  componentSets: [
    {
      name: "Button",
      page: "02 Shared Rust Components",
      layoutMode: "HORIZONTAL",
      itemSpacing: 8,
      paddingHorizontal: 20,
      paddingVertical: 10,
      fillVariable: "Schemes/Primary",
      textVariable: "Schemes/On Primary",
      strokeVariable: "Schemes/Outline Variant",
      radiusVariable: "Corner/Full",
      variants: [
        "Variant=Filled, State=Enabled",
        "Variant=Filled, State=Hover",
        "Variant=Tonal, State=Enabled",
        "Variant=Outlined, State=Enabled",
      ],
    },
    {
      name: "CommandPalette",
      page: "02 Shared Rust Components",
      layoutMode: "VERTICAL",
      itemSpacing: 8,
      paddingHorizontal: 16,
      paddingVertical: 12,
      fillVariable: "Schemes/Surface Container High",
      textVariable: "Schemes/On Surface",
      strokeVariable: "Schemes/Primary",
      radiusVariable: "Corner/Large",
      variants: [
        "Platform=DesktopPopup, State=Open",
        "Platform=MobileBottomSheet, State=Open",
      ],
    },
    {
      name: "NavigationRail",
      page: "02 Shared Rust Components",
      layoutMode: "VERTICAL",
      itemSpacing: 12,
      paddingHorizontal: 12,
      paddingVertical: 16,
      fillVariable: "Schemes/Surface Container Low",
      textVariable: "Schemes/On Surface Variant",
      strokeVariable: "Schemes/Outline Variant",
      radiusVariable: "Corner/None",
      variants: [
        "Density=Compact, Mode=Expanded",
        "Density=Compact, Mode=Collapsed",
      ],
    },
    {
      name: "StatusBar",
      page: "02 Shared Rust Components",
      layoutMode: "HORIZONTAL",
      itemSpacing: 16,
      paddingHorizontal: 12,
      paddingVertical: 6,
      fillVariable: "Schemes/Surface Container High",
      textVariable: "Schemes/On Surface",
      strokeVariable: "Schemes/Outline Variant",
      radiusVariable: "Corner/None",
      variants: ["Mode=Workspace", "Mode=Compositor"],
    },
    {
      name: "TerminalPane",
      page: "02 Shared Rust Components",
      layoutMode: "VERTICAL",
      itemSpacing: 4,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fillVariable: "Schemes/Surface Container Lowest",
      textVariable: "Schemes/On Surface",
      strokeVariable: "Schemes/Outline",
      radiusVariable: "Corner/Medium",
      variants: ["Focus=Active", "Focus=Inactive"],
    },
    {
      name: "WaylandSurfaceSlot",
      page: "02 Shared Rust Components",
      layoutMode: "VERTICAL",
      itemSpacing: 8,
      paddingHorizontal: 12,
      paddingVertical: 12,
      fillVariable: "Schemes/Surface Container",
      textVariable: "Schemes/On Primary Container",
      strokeVariable: "Schemes/Primary",
      radiusVariable: "Corner/Medium",
      variants: [
        "Tiling=DwindleMaster",
        "Tiling=DwindleStack",
        "Tiling=Monocle",
      ],
    },
  ],
};

const script = `const SCOPES = ${JSON.stringify(scopeTable)};
const DATA = ${JSON.stringify(compact)};
const MOCKUP = ${JSON.stringify(mockup)};
const rgb = (h) => ({ r: parseInt(h.slice(0, 2), 16) / 255, g: parseInt(h.slice(2, 4), 16) / 255, b: parseInt(h.slice(4, 6), 16) / 255, a: 1 });
const existing = await figma.variables.getLocalVariableCollectionsAsync();
const all = await figma.variables.getLocalVariablesAsync();
const report = [];
const varByName = new Map();
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
    varByName.set(full, v);
  }
  const wanted = new Set(vars.map(([n]) => prefix + n));
  const stale = all.filter((x) => x.variableCollectionId === col.id && !wanted.has(x.name)).map((x) => x.name);
  report.push({ collection: col.name, id: col.id, modes: col.modes.map((x) => x.name), variables: vars.length, stale });
}
const bindFill = (node, vname) => {
  const v = varByName.get(vname);
  if (!v) return;
  const paint = figma.variables.setBoundVariableForPaint({ type: "SOLID", color: { r: 0, g: 0, b: 0 } }, "color", v);
  node.fills = [paint];
};
const bindStroke = (node, vname) => {
  const v = varByName.get(vname);
  if (!v) return;
  const paint = figma.variables.setBoundVariableForPaint({ type: "SOLID", color: { r: 0, g: 0, b: 0 } }, "color", v);
  node.strokes = [paint];
  node.strokeWeight = 1;
};
const bindRadius = (node, vname) => {
  const v = varByName.get(vname);
  if (v) node.setBoundVariable("cornerRadius", v);
};
const pageMap = new Map();
for (const p of MOCKUP.pages) {
  let page = figma.root.children.find((n) => n.type === "PAGE" && n.name === p.name);
  if (!page) { page = figma.createPage(); page.name = p.name; }
  pageMap.set(p.name, page);
}
const syncedSets = [];
for (const cs of MOCKUP.componentSets) {
  const page = pageMap.get(cs.page) ?? figma.currentPage;
  let setNode = page.children.find((n) => n.type === "COMPONENT_SET" && n.name === cs.name);
  if (!setNode) {
    const comps = cs.variants.map((vname) => {
      const c = figma.createComponent();
      c.name = vname;
      c.layoutMode = cs.layoutMode;
      c.itemSpacing = cs.itemSpacing;
      c.paddingLeft = cs.paddingHorizontal;
      c.paddingRight = cs.paddingHorizontal;
      c.paddingTop = cs.paddingVertical;
      c.paddingBottom = cs.paddingVertical;
      bindFill(c, cs.fillVariable);
      bindStroke(c, cs.strokeVariable);
      bindRadius(c, cs.radiusVariable);
      page.appendChild(c);
      return c;
    });
    setNode = figma.combineAsVariants(comps, page);
    setNode.name = cs.name;
  }
  syncedSets.push({ name: setNode.name, variants: cs.variants.length });
}
return { fileKey: MOCKUP.fileKey, report, pages: Array.from(pageMap.keys()), componentSets: syncedSets };
`;
await Bun.write(
  join(pkg, "tokens/figma-mockup.json"),
  JSON.stringify(mockup, null, 2) + "\n",
);
await Bun.write(join(pkg, "tokens/figma-sync.js"), script);
console.log(
  `tokens/figma-sync.js + figma-mockup.json : ${collections.length} collections, ${mockup.pages.length} pages, ${mockup.componentSets.length} componentSets, limite ${limit} modes`,
);
