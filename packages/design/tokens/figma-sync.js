const SCOPES = [
  ["FRAME_FILL", "SHAPE_FILL", "STROKE_COLOR"],
  ["TEXT_FILL", "SHAPE_FILL"],
  ["STROKE_COLOR"],
  ["CORNER_RADIUS"],
];
const DATA = [
  [
    "M3 Schemes / Light, Dark, Light Medium Contrast, Dark Medium Contrast",
    ["Light", "Dark", "Light Medium Contrast", "Dark Medium Contrast"],
    "COLOR",
    "Schemes/",
    [
      [
        "Background",
        "color-background",
        0,
        ["fbf8ff", "11131c", "fbf8ff", "11131c"],
      ],
      [
        "On Background",
        "color-on-background",
        1,
        ["1a1b25", "e2e1ef", "1a1b25", "e2e1ef"],
      ],
      ["Surface", "color-surface", 0, ["fbf8ff", "11131c", "fbf8ff", "11131c"]],
      [
        "Surface Dim",
        "color-surface-dim",
        0,
        ["d9d9e7", "11131c", "c6c5d3", "11131c"],
      ],
      [
        "Surface Bright",
        "color-surface-bright",
        0,
        ["fbf8ff", "373843", "fbf8ff", "43444f"],
      ],
      [
        "Surface Container Lowest",
        "color-surface-container-lowest",
        0,
        ["ffffff", "0c0e17", "ffffff", "060710"],
      ],
      [
        "Surface Container Low",
        "color-surface-container-low",
        0,
        ["f4f2ff", "1a1b25", "f4f2ff", "1c1d27"],
      ],
      [
        "Surface Container",
        "color-surface-container",
        0,
        ["eeecfb", "1e1f29", "e8e7f5", "262731"],
      ],
      [
        "Surface Container High",
        "color-surface-container-high",
        0,
        ["e8e7f5", "282934", "dcdbea", "31323d"],
      ],
      [
        "Surface Container Highest",
        "color-surface-container-highest",
        0,
        ["e2e1ef", "33343f", "d1d0de", "3c3d48"],
      ],
      [
        "On Surface",
        "color-on-surface",
        1,
        ["1a1b25", "e2e1ef", "0f111a", "ffffff"],
      ],
      [
        "On Surface Variant",
        "color-on-surface-variant",
        1,
        ["444654", "c5c5d6", "343543", "dbdbec"],
      ],
      ["Outline", "color-outline", 2, ["757685", "8f8f9f", "505160", "b0b1c1"]],
      [
        "Outline Variant",
        "color-outline-variant",
        2,
        ["c5c5d6", "444654", "6b6c7b", "8e8f9f"],
      ],
      [
        "Inverse Surface",
        "color-inverse-surface",
        0,
        ["2f303a", "e2e1ef", "2f303a", "e2e1ef"],
      ],
      [
        "Inverse On Surface",
        "color-inverse-on-surface",
        0,
        ["f0effe", "2f303a", "f0effe", "282934"],
      ],
      ["Primary", "color-primary", 0, ["1242ff", "bac3ff", "0022a0", "d6daff"]],
      [
        "Primary Dim",
        "color-primary-dim",
        0,
        ["0036e8", "7387ff", "0025a8", "b4bdff"],
      ],
      [
        "On Primary",
        "color-on-primary",
        1,
        ["ffffff", "001e91", "ffffff", "001775"],
      ],
      [
        "Primary Container",
        "color-primary-container",
        0,
        ["dee0ff", "002eca", "3959ff", "7287ff"],
      ],
      [
        "On Primary Container",
        "color-on-primary-container",
        1,
        ["002eca", "dee0ff", "ffffff", "000000"],
      ],
      [
        "Primary Fixed",
        "color-primary-fixed",
        0,
        ["dee0ff", "dee0ff", "3959ff", "dee0ff"],
      ],
      [
        "Primary Fixed Dim",
        "color-primary-fixed-dim",
        0,
        ["bac3ff", "bac3ff", "0038ee", "bac3ff"],
      ],
      [
        "On Primary Fixed",
        "color-on-primary-fixed",
        1,
        ["00105c", "00105c", "ffffff", "000841"],
      ],
      [
        "On Primary Fixed Variant",
        "color-on-primary-fixed-variant",
        1,
        ["002eca", "002eca", "ffffff", "0022a0"],
      ],
      [
        "Inverse Primary",
        "color-inverse-primary",
        0,
        ["bac3ff", "1242ff", "bac3ff", "002fcd"],
      ],
      [
        "Secondary",
        "color-secondary",
        0,
        ["605a7d", "c9c1ea", "373252", "e0d7ff"],
      ],
      [
        "Secondary Dim",
        "color-secondary-dim",
        0,
        ["544e70", "d8cff8", "3a3555", "d8cff8"],
      ],
      [
        "On Secondary",
        "color-on-secondary",
        1,
        ["ffffff", "312c4c", "ffffff", "262141"],
      ],
      [
        "Secondary Container",
        "color-secondary-container",
        0,
        ["e6deff", "484264", "6f688c", "938cb2"],
      ],
      [
        "On Secondary Container",
        "color-on-secondary-container",
        1,
        ["484264", "e6deff", "ffffff", "000000"],
      ],
      [
        "Secondary Fixed",
        "color-secondary-fixed",
        0,
        ["e6deff", "e6deff", "6f688c", "e6deff"],
      ],
      [
        "Secondary Fixed Dim",
        "color-secondary-fixed-dim",
        0,
        ["c9c1ea", "c9c1ea", "565073", "c9c1ea"],
      ],
      [
        "On Secondary Fixed",
        "color-on-secondary-fixed",
        1,
        ["1c1736", "1c1736", "ffffff", "120c2b"],
      ],
      [
        "On Secondary Fixed Variant",
        "color-on-secondary-fixed-variant",
        1,
        ["484264", "484264", "ffffff", "373252"],
      ],
      [
        "Tertiary",
        "color-tertiary",
        0,
        ["6b5485", "d7bbf3", "422c5a", "ead4ff"],
      ],
      [
        "Tertiary Dim",
        "color-tertiary-dim",
        0,
        ["5f4978", "e3c6ff", "452f5d", "e3c6ff"],
      ],
      [
        "On Tertiary",
        "color-on-tertiary",
        1,
        ["ffffff", "3b2654", "ffffff", "301b48"],
      ],
      [
        "Tertiary Container",
        "color-tertiary-container",
        0,
        ["efdbff", "533d6c", "7b6395", "a086ba"],
      ],
      [
        "On Tertiary Container",
        "color-on-tertiary-container",
        1,
        ["533d6c", "efdbff", "ffffff", "000000"],
      ],
      [
        "Tertiary Fixed",
        "color-tertiary-fixed",
        0,
        ["efdbff", "efdbff", "7b6395", "efdbff"],
      ],
      [
        "Tertiary Fixed Dim",
        "color-tertiary-fixed-dim",
        0,
        ["d7bbf3", "d7bbf3", "614b7b", "d7bbf3"],
      ],
      [
        "On Tertiary Fixed",
        "color-on-tertiary-fixed",
        1,
        ["26103d", "26103d", "ffffff", "1b0532"],
      ],
      [
        "On Tertiary Fixed Variant",
        "color-on-tertiary-fixed-variant",
        1,
        ["533d6c", "533d6c", "ffffff", "422c5a"],
      ],
      ["Error", "color-error", 0, ["ba1a1a", "ffb4ab", "740006", "ffd2cc"]],
      [
        "Error Dim",
        "color-error-dim",
        0,
        ["a80710", "ff554a", "790006", "ffaca2"],
      ],
      [
        "On Error",
        "color-on-error",
        1,
        ["ffffff", "690005", "ffffff", "540003"],
      ],
      [
        "Error Container",
        "color-error-container",
        0,
        ["ffdad6", "93000a", "cf2c27", "ff5449"],
      ],
      [
        "On Error Container",
        "color-on-error-container",
        1,
        ["93000a", "ffdad6", "ffffff", "000000"],
      ],
    ],
  ],
  [
    "M3 Schemes / Light High Contrast, Dark High Contrast",
    ["Light High Contrast", "Dark High Contrast"],
    "COLOR",
    "Schemes/",
    [
      ["Background", "color-background", 0, ["fbf8ff", "11131c"]],
      ["On Background", "color-on-background", 1, ["1a1b25", "e2e1ef"]],
      ["Surface", "color-surface", 0, ["fbf8ff", "11131c"]],
      ["Surface Dim", "color-surface-dim", 0, ["b8b7c5", "11131c"]],
      ["Surface Bright", "color-surface-bright", 0, ["fbf8ff", "4e4f5b"]],
      [
        "Surface Container Lowest",
        "color-surface-container-lowest",
        0,
        ["ffffff", "000000"],
      ],
      [
        "Surface Container Low",
        "color-surface-container-low",
        0,
        ["f0effe", "1e1f29"],
      ],
      ["Surface Container", "color-surface-container", 0, ["e2e1ef", "2f303a"]],
      [
        "Surface Container High",
        "color-surface-container-high",
        0,
        ["d4d3e1", "3a3b46"],
      ],
      [
        "Surface Container Highest",
        "color-surface-container-highest",
        0,
        ["c6c5d3", "454651"],
      ],
      ["On Surface", "color-on-surface", 1, ["000000", "ffffff"]],
      [
        "On Surface Variant",
        "color-on-surface-variant",
        1,
        ["000000", "ffffff"],
      ],
      ["Outline", "color-outline", 2, ["2a2b38", "efeeff"]],
      ["Outline Variant", "color-outline-variant", 2, ["474856", "c1c1d2"]],
      ["Inverse Surface", "color-inverse-surface", 0, ["2f303a", "e2e1ef"]],
      [
        "Inverse On Surface",
        "color-inverse-on-surface",
        0,
        ["ffffff", "000000"],
      ],
      ["Primary", "color-primary", 0, ["001b86", "efeeff"]],
      ["Primary Dim", "color-primary-dim", 0, ["001266", "f0efff"]],
      ["On Primary", "color-on-primary", 1, ["ffffff", "000000"]],
      ["Primary Container", "color-primary-container", 0, ["0030d0", "b5bfff"]],
      [
        "On Primary Container",
        "color-on-primary-container",
        1,
        ["ffffff", "000532"],
      ],
      ["Primary Fixed", "color-primary-fixed", 0, ["0030d0", "dee0ff"]],
      ["Primary Fixed Dim", "color-primary-fixed-dim", 0, ["002097", "bac3ff"]],
      ["On Primary Fixed", "color-on-primary-fixed", 1, ["ffffff", "000000"]],
      [
        "On Primary Fixed Variant",
        "color-on-primary-fixed-variant",
        1,
        ["ffffff", "000841"],
      ],
      ["Inverse Primary", "color-inverse-primary", 0, ["bac3ff", "002fcd"]],
      ["Secondary", "color-secondary", 0, ["2d2847", "f3edff"]],
      ["Secondary Dim", "color-secondary-dim", 0, ["201b3a", "f4eeff"]],
      ["On Secondary", "color-on-secondary", 1, ["ffffff", "000000"]],
      [
        "Secondary Container",
        "color-secondary-container",
        0,
        ["4a4566", "c5bde6"],
      ],
      [
        "On Secondary Container",
        "color-on-secondary-container",
        1,
        ["ffffff", "0c0625"],
      ],
      ["Secondary Fixed", "color-secondary-fixed", 0, ["4a4566", "e6deff"]],
      [
        "Secondary Fixed Dim",
        "color-secondary-fixed-dim",
        0,
        ["342e4e", "c9c1ea"],
      ],
      [
        "On Secondary Fixed",
        "color-on-secondary-fixed",
        1,
        ["ffffff", "000000"],
      ],
      [
        "On Secondary Fixed Variant",
        "color-on-secondary-fixed-variant",
        1,
        ["ffffff", "120c2b"],
      ],
      ["Tertiary", "color-tertiary", 0, ["37224f", "f8ecff"]],
      ["Tertiary Dim", "color-tertiary-dim", 0, ["2a1541", "f9edff"]],
      ["On Tertiary", "color-on-tertiary", 1, ["ffffff", "000000"]],
      [
        "Tertiary Container",
        "color-tertiary-container",
        0,
        ["553f6e", "d3b8ef"],
      ],
      [
        "On Tertiary Container",
        "color-on-tertiary-container",
        1,
        ["ffffff", "14002c"],
      ],
      ["Tertiary Fixed", "color-tertiary-fixed", 0, ["553f6e", "efdbff"]],
      [
        "Tertiary Fixed Dim",
        "color-tertiary-fixed-dim",
        0,
        ["3e2956", "d7bbf3"],
      ],
      ["On Tertiary Fixed", "color-on-tertiary-fixed", 1, ["ffffff", "000000"]],
      [
        "On Tertiary Fixed Variant",
        "color-on-tertiary-fixed-variant",
        1,
        ["ffffff", "1b0532"],
      ],
      ["Error", "color-error", 0, ["600004", "ffece9"]],
      ["Error Dim", "color-error-dim", 0, ["480002", "ffedea"]],
      ["On Error", "color-on-error", 1, ["ffffff", "000000"]],
      ["Error Container", "color-error-container", 0, ["98000a", "ffaea4"]],
      [
        "On Error Container",
        "color-on-error-container",
        1,
        ["ffffff", "220001"],
      ],
    ],
  ],
  [
    "M3 Shape",
    ["Value"],
    "FLOAT",
    "Corner/",
    [
      ["Extra Large", "shape-corner-extra-large", 3, [28]],
      ["Extra Small", "shape-corner-extra-small", 3, [4]],
      ["Full", "shape-corner-full", 3, [9999]],
      ["Large", "shape-corner-large", 3, [16]],
      ["Medium", "shape-corner-medium", 3, [12]],
      ["None", "shape-corner-none", 3, [0]],
      ["Small", "shape-corner-small", 3, [8]],
    ],
  ],
];
const rgb = (h) => ({
  r: parseInt(h.slice(0, 2), 16) / 255,
  g: parseInt(h.slice(2, 4), 16) / 255,
  b: parseInt(h.slice(4, 6), 16) / 255,
  a: 1,
});
const existing = await figma.variables.getLocalVariableCollectionsAsync();
const all = await figma.variables.getLocalVariablesAsync();
const report = [];
for (const [cname, modes, type, prefix, vars] of DATA) {
  let col = existing.find((x) => x.name === cname);
  if (!col) {
    col = figma.variables.createVariableCollection(cname);
    col.renameMode(col.modes[0].modeId, modes[0]);
  }
  for (const m of modes.slice(1))
    if (!col.modes.some((x) => x.name === m)) col.addMode(m);
  const ids = modes.map((m) => col.modes.find((x) => x.name === m).modeId);
  for (const [name, web, scope, values] of vars) {
    const full = prefix + name;
    const v =
      all.find((x) => x.name === full && x.variableCollectionId === col.id) ??
      figma.variables.createVariable(full, col, type);
    v.scopes = SCOPES[scope];
    if (web) v.setVariableCodeSyntax("WEB", "var(--md-sys-" + web + ")");
    values.forEach((val, i) =>
      v.setValueForMode(ids[i], type === "COLOR" ? rgb(val) : val),
    );
  }
  const wanted = new Set(vars.map(([n]) => prefix + n));
  const stale = all
    .filter((x) => x.variableCollectionId === col.id && !wanted.has(x.name))
    .map((x) => x.name);
  report.push({
    collection: col.name,
    id: col.id,
    modes: col.modes.map((x) => x.name),
    variables: vars.length,
    stale,
  });
}
return { report };
