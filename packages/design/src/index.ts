// @aphrody/design : tokens Material 3 générés depuis assets/brand/brand.toml (voir src/build.ts).
import tokens from "../tokens/tokens.json";

export { tokens };
export type Mode = keyof typeof tokens.color;
export type Role = keyof typeof tokens.color.light;

/** Hex d'un rôle M3 (ex. role("primary", "dark")). */
export const role = (name: Role, mode: Mode = "light"): string => tokens.color[mode][name];

/** Séquence SGR 24 bits pour un rôle (TUI), avant-plan ou fond. */
export function ansi(name: Role, mode: Mode = "dark", bg = false): string {
  const h = role(name, mode);
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  return `\u001b[${bg ? 48 : 38};2;${r};${g};${b}m`;
}
export const RESET = "\u001b[0m";
