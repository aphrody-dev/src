// Génération M3 à l'exécution (graine dynamique, ex. thème par requête) et recherche de Material Symbols.
// Les sites à graine fixe consomment tokens/tokens.css ; ce module sert les cas où la graine varie.
import { hexFromArgb, MaterialDynamicColors } from "@material/material-color-utilities";
import { join } from "node:path";
import { dynamicScheme, type Variant } from "./schemes.ts";

export type { Variant };
const kebab = (s: string) => s.replace(/_/g, "-").replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
const roles = new MaterialDynamicColors().allColors.filter((c) => !c.name.endsWith("_palette_key_color"));

/** Rôles M3 d'une graine (hex #RRGGBB) pour un mode. */
export function scheme(seed: string, dark = false, variant: Variant = "tonal-spot", contrast = 0): Record<string, string> {
  if (!/^#[0-9a-fA-F]{6}$/.test(seed)) throw new Error(`graine invalide : ${seed}`);
  const s = dynamicScheme(seed, variant, dark, contrast);
  return Object.fromEntries(roles.map((c) => [kebab(c.name), hexFromArgb(c.getArgb(s)).toUpperCase()]));
}

/** CSS `--md-sys-color-*` clair + sombre (prefers-color-scheme) pour une graine. */
export function schemeCss(seed: string, variant: Variant = "tonal-spot", contrast = 0): string {
  const vars = (m: Record<string, string>) => Object.entries(m).map(([k, v]) => `--md-sys-color-${k}:${v}`).join(";");
  return `:root{${vars(scheme(seed, false, variant, contrast))}}@media (prefers-color-scheme:dark){:root{${vars(scheme(seed, true, variant, contrast))}}}`;
}

let names: string[] | undefined;
/** Noms de Material Symbols (type MaterialSymbol du paquet material-symbols). */
export async function symbolNames(): Promise<string[]> {
  if (names) return names;
  const dts = await Bun.file(join(import.meta.dir, "..", "node_modules", "material-symbols", "index.d.ts")).text();
  names = [...dts.matchAll(/^\s*"([a-z0-9_]+)",?$/gm)].map((m) => m[1]);
  return names;
}

/** Recherche par sous-chaîne, résultats exacts d'abord. */
export async function searchSymbols(q: string, limit = 24): Promise<string[]> {
  const n = q.trim().toLowerCase().replace(/[\s-]+/g, "_");
  if (!n) return (await symbolNames()).slice(0, limit);
  const all = await symbolNames();
  return [...all.filter((x) => x === n), ...all.filter((x) => x !== n && x.startsWith(n)), ...all.filter((x) => !x.startsWith(n) && x.includes(n))].slice(0, limit);
}
