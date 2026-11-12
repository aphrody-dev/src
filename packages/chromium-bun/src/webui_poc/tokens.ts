// Material 3 Tokens derived from Chromium ui/color/color_id.h and ref_color_mixer.cc
export const Material3Tokens = {
  // Reference Palettes
  refPrimary0: "#000000",
  refPrimary10: "#001f2a",
  refPrimary40: "#006782",
  refPrimary80: "#60d4fe",
  refPrimary99: "#fbfcfe",
  refPrimary100: "#ffffff",

  // System Tokens
  sysPrimary: "var(--cr-sys-primary, #006782)",
  sysOnPrimary: "var(--cr-sys-on-primary, #ffffff)",
  sysPrimaryContainer: "var(--cr-sys-primary-container, #bde9ff)",
  sysOnPrimaryContainer: "var(--cr-sys-on-primary-container, #001f2a)",
  sysSurface: "var(--cr-sys-surface, #fbfcfe)",
  sysOnSurface: "var(--cr-sys-on-surface, #191c1d)",
  sysSurfaceVariant: "var(--cr-sys-surface-variant, #dbe4e8)",
  sysOutline: "var(--cr-sys-outline, #70787d)",
} as const;

export type Material3TokenKey = keyof typeof Material3Tokens;

export function getCssVariables(): string {
  return Object.entries(Material3Tokens)
    .map(
      ([key, val]) =>
        `--cr-${key.replace(/([A-Z])/g, "-$1").toLowerCase()}: ${val};`,
    )
    .join("\n");
}
