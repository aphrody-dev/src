// Adaptateurs de @aphrody/design : projette tokens/tokens.json (lui-même issu de assets/brand/brand.toml) vers les
// formats de thème des cibles retenues par docs/ui/ECOSYSTEM-AUDIT.md. Aucun composant copié : uniquement des tokens.
// `bun run src/adapters.ts` écrit tokens/adapters/ ; `--check` échoue si une sortie dériverait.
// Formats vérifiés en amont le 2026-11-13 (commits dans ECOSYSTEM-AUDIT.md) :
//   Tailwind v4 @theme (tailwindlabs/tailwindcss), shadcn/ui variables CSS (shadcn-ui/ui), MUI createTheme colorSchemes
//   (mui/material-ui), Angular Material mat.theme + $overrides (angular/components, schematic theme-color),
//   Compose lightColorScheme (androidx material3 1.4.0), Flutter ColorScheme (flutter/flutter), Fluent v9 BrandVariants
//   (microsoft/fluentui packages/tokens), WinUI 3 SystemAccentColor*, gpui-kit .theme-schema.json (longbridge/gpui-kit),
//   webui-tokens (microsoft/webui crates/webui-tokens).
import { join } from "node:path";
import { argbFromHex, Hct, hexFromArgb } from "@material/material-color-utilities";
import { dynamicScheme } from "./schemes.ts";

const pkg = join(import.meta.dir, "..");
const out = join(pkg, "tokens", "adapters");
const check = process.argv.includes("--check");
const t = await Bun.file(join(pkg, "tokens", "tokens.json")).json();

type Mode = keyof typeof t.color & string;
const MODES = Object.keys(t.color) as Mode[];
const C = (mode: Mode) => t.color[mode] as Record<string, string>;
const src = t.source;
const header = (c: string, end = "") =>
  `${c} Généré par packages/design/src/adapters.ts depuis tokens/tokens.json (assets/brand/brand.toml, seed ${src.seed}, ${src.variant}, MCU ${src["material-color-utilities"]}). Ne pas éditer.${end}\n`;

// --- utilitaires de couleur ---
const rgb = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
const hex2 = (n: number) => Math.round(n).toString(16).padStart(2, "0").toUpperCase();
/** Couche d'état M3 : `layer` posé sur `base` à l'opacité `o` (hover 0.08, pressed 0.12...). */
const over = (base: string, layer: string, o: number) => {
  const [a, b] = [rgb(base), rgb(layer)];
  return `#${a.map((x, i) => hex2(x + (b[i] - x) * o)).join("")}`;
};
const alpha = (hex: string, o: number) => `${hex}${hex2(o * 255)}`;
const st = (k: string) => Number(t.state[`${k}-state-layer-opacity`]);
const camel = (k: string) => k.replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase());
const px = (k: string) => parseFloat(t.shape[`corner-${k}`]);
const rem = (x: string) => parseFloat(x) * (x.endsWith("rem") ? 16 : 1);
const neutral = (tone: number) => t.palettes.neutral[String(tone)] as string;
/** Couleur lisible sur un fond : ton neutre 10 ou 99 selon le ton HCT du fond. */
const onColor = (bg: string) => (Hct.fromInt(argbFromHex(bg)).tone >= 60 ? neutral(10) : neutral(99));
const bolt: string = t.custom.bolt;
const light = dynamicScheme(src.seed, src.variant, false, 0);
const tone = (palette: "primaryPalette" | "secondaryPalette" | "tertiaryPalette" | "neutralPalette" | "neutralVariantPalette" | "errorPalette", n: number) =>
  hexFromArgb(light[palette].tone(n)).toUpperCase();

// --- correspondance sémantique unique (modèle shadcn, repris tel quel par gpui-kit) -> rôles M3 ---
const SEMANTIC: Record<string, string> = {
  background: "surface",
  foreground: "on-surface",
  card: "surface-container-low",
  "card-foreground": "on-surface",
  popover: "surface-container",
  "popover-foreground": "on-surface",
  primary: "primary",
  "primary-foreground": "on-primary",
  secondary: "secondary-container",
  "secondary-foreground": "on-secondary-container",
  muted: "surface-container-high",
  "muted-foreground": "on-surface-variant",
  accent: "surface-container-highest",
  "accent-foreground": "on-surface",
  destructive: "error",
  "destructive-foreground": "on-error",
  border: "outline-variant",
  input: "outline",
  ring: "primary",
  "chart-1": "primary",
  "chart-2": "tertiary",
  "chart-3": "secondary",
  "chart-4": "primary-fixed-dim",
  "chart-5": "tertiary-fixed-dim",
  sidebar: "surface-container-low",
  "sidebar-foreground": "on-surface-variant",
  "sidebar-primary": "primary",
  "sidebar-primary-foreground": "on-primary",
  "sidebar-accent": "secondary-container",
  "sidebar-accent-foreground": "on-secondary-container",
  "sidebar-border": "outline-variant",
  "sidebar-ring": "primary",
};

// Rôles *-dim de la spec 2025 (primary-dim...) : absents de Compose, Flutter et Angular Material.
const DIM2025 = /^(primary|secondary|tertiary|error)-dim$/;

const files: Record<string, string> = {};
const v = (role: string) => `var(--md-sys-color-${role})`;
const block = (sel: string, lines: string[]) => `${sel} {\n${lines.map((l) => `  ${l}`).join("\n")}\n}`;

// 1. Tailwind CSS v4 : @theme inline sur les variables de tokens.css (le mode suit tokens.css, data-theme et media).
const typeNames = Object.keys(t.typescale);
files["tailwind.css"] = `${header("/*", " */")}/* Usage : @import "tailwindcss"; @import "@aphrody/design/tokens.css"; @import "<ce fichier>"; puis bg-primary, text-on-surface, rounded-md, text-body-large. */
${block("@theme inline", [
  "--color-*: initial;",
  ...Object.keys(C("light")).map((k) => `--color-${k}: ${v(k)};`),
  "--color-bolt: var(--aphrody-bolt);",
  "--font-sans: var(--md-ref-typeface-plain);",
  "--font-display: var(--md-ref-typeface-brand);",
  "--font-mono: var(--md-ref-typeface-code);",
  "--radius-*: initial;",
  ...Object.keys(t.shape).map((k) => `--radius-${k.replace("corner-", "")}: var(--md-sys-shape-${k});`),
  ...typeNames.flatMap((n) => [
    `--text-${n}: var(--md-sys-typescale-${n}-size);`,
    `--text-${n}--line-height: var(--md-sys-typescale-${n}-line-height);`,
    `--text-${n}--letter-spacing: var(--md-sys-typescale-${n}-tracking);`,
    `--text-${n}--font-weight: var(--md-sys-typescale-${n}-weight);`,
  ]),
  ...Object.keys(t.motion).filter((k) => k.startsWith("easing-")).map((k) => `--ease-${k.slice(7)}: var(--md-sys-motion-${k});`),
])}
`;

// 2. shadcn/ui : variables attendues par les composants (globals.css), pointées sur les rôles M3, puis @theme inline.
files["shadcn.css"] = `${header("/*", " */")}/* Transition seulement (sous-modules rosegriffon/shenron) : les couleurs shadcn deviennent les rôles M3 de la marque. */
${block(":root", [...Object.entries(SEMANTIC).map(([k, r]) => `--${k}: ${v(r)};`), `--radius: var(--md-sys-shape-corner-medium);`])}
${block("@theme inline", [
  ...Object.keys(SEMANTIC).map((k) => `--color-${k}: var(--${k});`),
  "--radius-sm: calc(var(--radius) - 4px);",
  "--radius-md: calc(var(--radius) - 2px);",
  "--radius-lg: var(--radius);",
  "--radius-xl: calc(var(--radius) + 4px);",
])}
`;

// 3. MUI (Material UI v9) : options de createTheme (colorSchemes clair/sombre, valeurs littérales exigées par MUI).
const fontStack: string = t.typeface.plain;
const ts = (n: string) => {
  const p = t.typescale[n];
  return { fontFamily: fontStack, fontSize: p.size, lineHeight: p["line-height"], letterSpacing: p.tracking, fontWeight: Number(p.weight) };
};
const muiPalette = (m: Mode) => {
  const c = C(m);
  return {
    primary: { main: c.primary, contrastText: c["on-primary"] },
    secondary: { main: c.secondary, contrastText: c["on-secondary"] },
    info: { main: c.tertiary, contrastText: c["on-tertiary"] },
    error: { main: c.error, contrastText: c["on-error"] },
    warning: { main: bolt, contrastText: onColor(bolt) },
    background: { default: c.surface, paper: c["surface-container-low"] },
    text: { primary: c["on-surface"], secondary: c["on-surface-variant"] },
    divider: c["outline-variant"],
  };
};
const MUI_TYPE: Record<string, string> = {
  h1: "display-large", h2: "display-medium", h3: "display-small", h4: "headline-large", h5: "headline-medium", h6: "headline-small",
  subtitle1: "title-medium", subtitle2: "title-small", body1: "body-large", body2: "body-medium", button: "label-large", caption: "body-small", overline: "label-small",
};
files["mui.json"] = JSON.stringify({
  $comment: header("").trim() + " Usage : createTheme({ cssVariables: true, ...json }).",
  colorSchemes: { light: { palette: muiPalette("light") }, dark: { palette: muiPalette("dark") } },
  shape: { borderRadius: px("medium") },
  typography: { fontFamily: fontStack, ...Object.fromEntries(Object.entries(MUI_TYPE).map(([k, n]) => [k, ts(n)])) },
}, null, 2) + "\n";

// 4. Angular Material (v19+) : palettes au format du schematic theme-color, rôles exacts via $overrides -> tokens.css.
const HUE_TONES = [0, 10, 20, 25, 30, 35, 40, 50, 60, 70, 80, 90, 95, 98, 99, 100];
const NEUTRAL_TONES = [...HUE_TONES, 4, 6, 12, 17, 22, 24, 87, 92, 94, 96].sort((a, b) => a - b);
const PAL = { primary: "primaryPalette", secondary: "secondaryPalette", tertiary: "tertiaryPalette", neutral: "neutralPalette", "neutral-variant": "neutralVariantPalette", error: "errorPalette" } as const;
const scssPal = (name: keyof typeof PAL) =>
  `  ${name}: (\n${(name === "neutral" ? NEUTRAL_TONES : HUE_TONES).map((n) => `    ${n}: ${tone(PAL[name], n)},`).join("\n")}\n  ),`;
const ngRoles = Object.keys(C("light")).filter((k) => !DIM2025.test(k));
files["_angular-theme.scss"] = `${header("//")}// Usage : @use '@angular/material' as mat; @use '<ce fichier>' as aphrody;
//   html { color-scheme: light dark; @include mat.theme((color: (primary: aphrody.$primary-palette, tertiary: aphrody.$tertiary-palette),
//     typography: aphrody.$font, density: 0), $overrides: aphrody.$overrides); }   (charger aussi @aphrody/design/tokens.css)
@use 'sass:map';

$_palettes: (
${(Object.keys(PAL) as (keyof typeof PAL)[]).map(scssPal).join("\n")}
);

$_rest: (
  secondary: map.get($_palettes, secondary),
  neutral: map.get($_palettes, neutral),
  neutral-variant: map.get($_palettes, neutral-variant),
  error: map.get($_palettes, error),
);

$primary-palette: map.merge(map.get($_palettes, primary), $_rest);
$tertiary-palette: map.merge(map.get($_palettes, tertiary), $_rest);
$font: ${JSON.stringify(t.typeface.plain.split(",")[0].replace(/"/g, ""))};

// Rôles M3 exacts du DynamicScheme (variante ${src.variant}) : les tons fixes du mixin sont remplacés par tokens.css.
$overrides: (
${ngRoles.map((k) => `  ${k}: ${v(k)},`).join("\n")}
  surface-tint: ${v("primary")},
  surface-variant: ${v("surface-container-highest")},
  shadow: ${neutral(0)},
  scrim: ${neutral(0)},
);
`;

// 5. Jetpack Compose (androidx.compose.material3 >= 1.4.0) : ColorScheme x6, Shapes, Typography.
const COMPOSE_EXTRA = (c: Record<string, string>): Record<string, string> => ({
  surfaceVariant: c["surface-container-highest"],
  surfaceTint: c.primary,
  scrim: neutral(0),
});
const argb = (hex: string) => `0xFF${hex.slice(1)}`;
const composeArgs = (m: Mode) => {
  const c = C(m);
  const roles = Object.fromEntries(Object.entries(c).filter(([k]) => !DIM2025.test(k)).map(([k, x]) => [camel(k), x]));
  return Object.entries({ ...roles, ...COMPOSE_EXTRA(c) }).map(([k, x]) => `        ${k} = Color(${argb(x)}),`).join("\n");
};
const sp = (x: string) => `${+rem(x).toFixed(4)}.sp`.replace(/^(-?\d+)\.sp$/, "$1.sp");
files["Theme.kt"] = `${header("//")}// Usage : MaterialTheme(colorScheme = AphrodyTheme.light, shapes = AphrodyTheme.shapes, typography = AphrodyTheme.typography) { ... }
// Police : charger Google Sans Flex (OFL) dans l'app et la passer à TextStyle(fontFamily = ...).
package com.aphrody.design

import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.ColorScheme
import androidx.compose.material3.Shapes
import androidx.compose.material3.Typography
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

object AphrodyTheme {
${MODES.map((m) => `    val ${camel(m)}: ColorScheme = ${m.startsWith("dark") ? "darkColorScheme" : "lightColorScheme"}(\n${composeArgs(m)}\n    )`).join("\n\n")}

    val bolt = Color(${argb(bolt)})

    val shapes = Shapes(
${["extra-small", "small", "medium", "large", "extra-large"].map((k) => `        ${camel(k)} = RoundedCornerShape(${px(k)}.dp),`).join("\n")}
    )

    val typography = Typography(
${typeNames.map((n) => { const p = t.typescale[n]; return `        ${camel(n)} = TextStyle(fontSize = ${sp(p.size)}, lineHeight = ${sp(p["line-height"])}, letterSpacing = (${sp(p.tracking)}), fontWeight = FontWeight(${p.weight})),`; }).join("\n")}
    )
}
`;

// 6. Flutter (Material 3) : ColorScheme x6 (sans les rôles dépréciés background/surfaceVariant), TextTheme, formes, durées.
const FLUTTER_RENAME: Record<string, string> = { inverseOnSurface: "onInverseSurface" };
const FLUTTER_SKIP = new Set(["background", "onBackground"]);
const flutterArgs = (m: Mode) => {
  const c = C(m);
  const roles = Object.entries(c).filter(([k]) => !DIM2025.test(k)).map(([k, x]) => [FLUTTER_RENAME[camel(k)] ?? camel(k), x] as const).filter(([k]) => !FLUTTER_SKIP.has(k));
  return [...roles, ["shadow", neutral(0)], ["scrim", neutral(0)], ["surfaceTint", c.primary]].map(([k, x]) => `  ${k}: Color(${argb(x)}),`).join("\n");
};
const num = (x: number) => String(+x.toFixed(4));
files["aphrody_theme.dart"] = `${header("//")}// Usage : MaterialApp(theme: aphrodyTheme(aphrodyLight), darkTheme: aphrodyTheme(aphrodyDark), highContrastTheme: aphrodyTheme(aphrodyLightHighContrast), ...)
// Police : déclarer Google Sans Flex (OFL) dans pubspec.yaml sous ce nom de famille.
import 'package:flutter/material.dart';

${MODES.map((m) => `const ColorScheme aphrody${camel(`-${m}`).replace(/^./, (c) => c.toUpperCase())} = ColorScheme(\n  brightness: Brightness.${m.startsWith("dark") ? "dark" : "light"},\n${flutterArgs(m)}\n);`).join("\n\n")}

const Color aphrodyBolt = Color(${argb(bolt)});

const TextTheme aphrodyTextTheme = TextTheme(
${typeNames.map((n) => { const p = t.typescale[n]; const s = rem(p.size); return `  ${camel(n)}: TextStyle(fontSize: ${num(s)}, height: ${num(rem(p["line-height"]) / s)}, letterSpacing: ${num(rem(p.tracking))}, fontWeight: FontWeight.w${p.weight}),`; }).join("\n")}
);

abstract final class AphrodyShape {
${Object.keys(t.shape).filter((k) => k !== "corner-full").map((k) => `  static const double ${camel(k)} = ${num(px(k.replace("corner-", "")))};`).join("\n")}
}

abstract final class AphrodyMotion {
${Object.entries(t.motion).filter(([k]) => k.startsWith("duration")).map(([k, x]) => `  static const Duration ${camel(k)} = Duration(milliseconds: ${parseInt(x as string)});`).join("\n")}
}

ThemeData aphrodyTheme(ColorScheme scheme) => ThemeData(
      colorScheme: scheme,
      textTheme: aphrodyTextTheme,
      fontFamily: ${JSON.stringify(t.typeface.plain.split(",")[0].replace(/"/g, ""))},
    );
`;

// 7. Fluent 2 (React v9, Web Components v3) : BrandVariants 10..160 depuis la palette primaire, plus rôles exacts.
const BRANDS = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120, 130, 140, 150, 160];
const fluentOverrides = (m: Mode) => {
  const c = C(m);
  return {
    colorBrandBackground: c.primary,
    colorBrandBackgroundHover: over(c.primary, c["on-primary"], st("hover")),
    colorBrandBackgroundPressed: over(c.primary, c["on-primary"], st("pressed")),
    colorBrandBackground2: c["primary-container"],
    colorBrandForeground1: c.primary,
    colorBrandForeground2: c["on-primary-container"],
    colorBrandStroke1: c.primary,
    colorCompoundBrandBackground: c.primary,
    colorNeutralForeground1: c["on-surface"],
    colorNeutralForeground2: c["on-surface-variant"],
    colorNeutralForegroundOnBrand: c["on-primary"],
    colorNeutralBackground1: c.surface,
    colorNeutralBackground2: c["surface-container-low"],
    colorNeutralBackground3: c["surface-container"],
    colorNeutralStroke1: c.outline,
    colorNeutralStroke2: c["outline-variant"],
    colorStrokeFocus2: c.primary,
    colorPaletteRedBackground3: c.error,
    colorPaletteRedForeground1: c.error,
    fontFamilyBase: fontStack,
    fontFamilyMonospace: t.typeface.code,
    borderRadiusSmall: `${px("extra-small")}px`,
    borderRadiusMedium: `${px("small")}px`,
    borderRadiusLarge: `${px("medium")}px`,
    borderRadiusXLarge: `${px("large")}px`,
  };
};
files["fluent.json"] = JSON.stringify({
  $comment: header("").trim() + " Usage : const theme = { ...createLightTheme(json.brand), ...json.light } (createDarkTheme / json.dark).",
  // Fluent : 10 = le plus sombre, 160 = le plus clair ; ton HCT 5 + 6 par cran (80 ~ ton 47, proche de primary ton 40).
  brand: Object.fromEntries(BRANDS.map((b, i) => [b, tone("primaryPalette", 5 + 6 * i)])),
  light: fluentOverrides("light"),
  dark: fluentOverrides("dark"),
  highContrastLight: fluentOverrides("light-high-contrast"),
  highContrastDark: fluentOverrides("dark-high-contrast"),
}, null, 2) + "\n";

// 8. WinUI 3 / WinAppSDK : ResourceDictionary (couleur d'accentuation système redéfinie + rôles M3 en Color et brushes).
const xamlColors = (m: Mode, ind: string) => {
  const c = C(m);
  const accent = [["SystemAccentColorDark3", 20], ["SystemAccentColorDark2", 30], ["SystemAccentColorDark1", 40], ["SystemAccentColor", 50], ["SystemAccentColorLight1", 60], ["SystemAccentColorLight2", 70], ["SystemAccentColorLight3", 80]] as const;
  return [
    ...accent.map(([k, n]) => `${ind}<Color x:Key="${k}">${tone("primaryPalette", n)}</Color>`),
    ...Object.entries(c).map(([k, x]) => `${ind}<Color x:Key="Md${camel(`-${k}`)}Color">${x}</Color>`),
    ...Object.keys(c).map((k) => `${ind}<SolidColorBrush x:Key="Md${camel(`-${k}`)}Brush" Color="{ThemeResource Md${camel(`-${k}`)}Color}" />`),
  ].join("\n");
};
files["winui.xaml"] = `<!--${header("").replace(/\n$/, "")} Usage : fusionner ms-appx:///aphrody/winui.xaml dans Application.Resources (MergedDictionaries). -->
<ResourceDictionary
    xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
    xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml">
    <ResourceDictionary.ThemeDictionaries>
${([["Light", "light"], ["Dark", "dark"], ["HighContrast", "dark-high-contrast"]] as const).map(([k, m]) => `        <ResourceDictionary x:Key="${k}">\n${xamlColors(m, "            ")}\n        </ResourceDictionary>`).join("\n")}
    </ResourceDictionary.ThemeDictionaries>
    <Color x:Key="AphrodyBoltColor">${bolt}</Color>
    <FontFamily x:Key="AphrodyFontFamily">${t.typeface.plain.split(",")[0].replace(/"/g, "")}</FontFamily>
</ResourceDictionary>
`;

// 9. GPUI : thème gpui-kit (ex-gpui-component), schéma .theme-schema.json ; tokens.rs reste la source pour GPUI nu.
const gpuiColors = (m: Mode) => {
  const c = C(m);
  const s = Object.fromEntries(Object.entries(SEMANTIC).map(([k, r]) => [k, c[r]]));
  const hov = (bg: string, fg: string) => over(c[bg], c[fg], st("hover"));
  const act = (bg: string, fg: string) => over(c[bg], c[fg], st("pressed"));
  return {
    background: s.background, foreground: s.foreground, border: s.border, ring: s.ring, caret: c.primary, "input.border": s.input,
    "accent.background": s.accent, "accent.foreground": s["accent-foreground"],
    "primary.background": c.primary, "primary.foreground": c["on-primary"], "primary.hover.background": hov("primary", "on-primary"), "primary.active.background": act("primary", "on-primary"),
    "secondary.background": c["secondary-container"], "secondary.foreground": c["on-secondary-container"], "secondary.hover.background": hov("secondary-container", "on-secondary-container"), "secondary.active.background": act("secondary-container", "on-secondary-container"),
    "danger.background": c.error, "danger.foreground": c["on-error"], "danger.hover.background": hov("error", "on-error"), "danger.active.background": act("error", "on-error"),
    "info.background": c["primary-container"], "info.foreground": c["on-primary-container"], "info.hover.background": hov("primary-container", "on-primary-container"), "info.active.background": act("primary-container", "on-primary-container"),
    "warning.background": bolt, "warning.foreground": onColor(bolt), "warning.hover.background": over(bolt, onColor(bolt), st("hover")), "warning.active.background": over(bolt, onColor(bolt), st("pressed")),
    "muted.background": s.muted, "muted.foreground": s["muted-foreground"],
    "popover.background": s.popover, "popover.foreground": s["popover-foreground"],
    "link": c.primary, "link.hover": c.primary, "link.active": c.primary,
    "list.background": c.surface, "list.hover.background": hov("surface", "on-surface"), "list.active.background": c["secondary-container"], "list.active.border": c.primary, "list.even.background": c["surface-container-lowest"], "list.head.background": c["surface-container"],
    "table.background": c.surface, "table.hover.background": hov("surface", "on-surface"), "table.active.background": c["secondary-container"], "table.active.border": c.primary, "table.even.background": c["surface-container-lowest"], "table.head.background": c["surface-container"], "table.head.foreground": c["on-surface-variant"], "table.row.border": c["outline-variant"],
    "tab_bar.background": c["surface-container"], "tab.background": c["surface-container"], "tab.foreground": c["on-surface-variant"], "tab.active.background": c.surface, "tab.active.foreground": c["on-surface"],
    "title_bar.background": c["surface-container"], "title_bar.border": c["outline-variant"],
    "sidebar.background": s.sidebar, "sidebar.foreground": s["sidebar-foreground"], "sidebar.border": s["sidebar-border"], "sidebar.primary.background": s["sidebar-primary"], "sidebar.primary.foreground": s["sidebar-primary-foreground"], "sidebar.accent.background": s["sidebar-accent"], "sidebar.accent.foreground": s["sidebar-accent-foreground"],
    "scrollbar.thumb.background": c.outline, "scrollbar.thumb.hover.background": c["on-surface-variant"],
    "selection.background": alpha(c.primary, 0.3), "skeleton.background": c["surface-container-high"], "progress.bar.background": c.primary,
    "slider.background": c.primary, "slider.thumb.background": c.primary, "switch.background": c["surface-container-highest"], "switch.thumb.background": c.outline,
    "drag.border": c.primary, "drop_target.background": alpha(c.primary, st("dragged")), overlay: alpha(neutral(0), 0.32), "window.border": c["outline-variant"],
    "chart.1": s["chart-1"], "chart.2": s["chart-2"], "chart.3": s["chart-3"], "chart.4": s["chart-4"], "chart.5": s["chart-5"],
    "base.red": c.error, "base.yellow": bolt,
  };
};
const gpuiHighlight = (m: Mode) => {
  const c = C(m);
  return {
    "editor.background": c.surface, "editor.foreground": c["on-surface"], "editor.active_line.background": c["surface-container-low"],
    "editor.line_number": c["on-surface-variant"], "editor.active_line_number": c["on-surface"],
  };
};
const title = (k: string) => k.split("-").map((w) => w[0].toUpperCase() + w.slice(1)).join(" ");
files["gpui-kit.json"] = JSON.stringify({
  $schema: "https://github.com/longbridge/gpui-kit/raw/refs/heads/main/.theme-schema.json",
  name: "Aphrody M3",
  author: "aphrody-labs",
  url: "https://github.com/aphrody-labs/src/tree/main/packages/design",
  themes: MODES.map((m) => ({
    name: `Aphrody M3 ${title(m)}`,
    mode: m.startsWith("dark") ? "dark" : "light",
    "font.family": t.typeface.plain.split(",")[0].replace(/"/g, ""),
    "mono_font.family": "Google Sans Code",
    radius: px("small"),
    "radius.lg": px("large"),
    colors: gpuiColors(m),
    highlight: gpuiHighlight(m),
  })),
}, null, 2) + "\n";

// 10. Microsoft WebUI : fichier multi-thème de webui-tokens ({ themes: { <mode>: { <token sans --> : valeur } } }).
const shared = {
  "md-ref-typeface-brand": t.typeface.brand, "md-ref-typeface-plain": t.typeface.plain, "md-ref-typeface-code": t.typeface.code, "aphrody-bolt": bolt,
  ...Object.fromEntries(typeNames.flatMap((n) => Object.entries(t.typescale[n]).map(([k, x]) => [`md-sys-typescale-${n}-${k}`, x]))),
  ...Object.fromEntries(Object.entries(t.shape).map(([k, x]) => [`md-sys-shape-${k}`, x])),
  ...Object.fromEntries(Object.entries(t.motion).map(([k, x]) => [`md-sys-motion-${k}`, x])),
  ...Object.fromEntries(Object.entries(t.state).map(([k, x]) => [`md-sys-state-${k}`, x])),
};
files["webui-tokens.json"] = JSON.stringify({
  themes: Object.fromEntries(MODES.map((m) => [m, { ...Object.fromEntries(Object.entries(C(m)).map(([k, x]) => [`md-sys-color-${k}`, x])), ...shared }])),
}, null, 2) + "\n";

// --- écriture / vérification ---
let drift = 0;
for (const [f, content] of Object.entries(files)) {
  const path = join(out, f);
  const file = Bun.file(path);
  if ((await file.exists()) && (await file.text()) === content) continue;
  drift++;
  if (check) console.error(`dérive : ${path}`);
  else await Bun.write(path, content);
}
if (check && drift) process.exit(1);
console.log(`${check ? "vérifié" : "écrit"} : ${Object.keys(files).length} adaptateurs dans tokens/adapters`);
