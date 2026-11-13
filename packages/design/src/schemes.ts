// Variantes DynamicScheme de Material Color Utilities, partagées par les générateurs (adapters.ts ; build.ts et runtime.ts
// peuvent l'importer au lieu de redéclarer la table).
import {
  argbFromHex,
  Hct,
  SchemeContent,
  SchemeExpressive,
  SchemeFidelity,
  SchemeMonochrome,
  SchemeNeutral,
  SchemeTonalSpot,
  SchemeVibrant,
  type DynamicScheme,
} from "@material/material-color-utilities";

export type Variant = "tonal-spot" | "vibrant" | "expressive" | "content" | "fidelity" | "monochrome" | "neutral";

export const SCHEMES: Record<Variant, new (h: Hct, dark: boolean, contrast: number) => DynamicScheme> = {
  "tonal-spot": SchemeTonalSpot,
  vibrant: SchemeVibrant,
  expressive: SchemeExpressive,
  content: SchemeContent,
  fidelity: SchemeFidelity,
  monochrome: SchemeMonochrome,
  neutral: SchemeNeutral,
};

/** DynamicScheme d'une graine hex pour une variante, un mode et un contraste (0, 0.5, 1). */
export function dynamicScheme(seed: string, variant: string, dark = false, contrast = 0): DynamicScheme {
  const S = SCHEMES[variant as Variant];
  if (!S) throw new Error(`variante inconnue : ${variant}`);
  return new S(Hct.fromInt(argbFromHex(seed)), dark, contrast);
}
