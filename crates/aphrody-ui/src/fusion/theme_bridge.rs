// SPDX-License-Identifier: Apache-2.0
//! Unified multi-theme bridge mapping the 9 monorepo presets onto M3 `DynamicScheme` roles
//! and exporting ready-to-consume token tables for GPUI-Kit, Dioxus/Blitz CSS, NSH, WinUI 3,
//! Hyprland `.conf`, and Ratatui/ANSI targets.

use std::collections::BTreeMap;

use serde::{Deserialize, Serialize};

use crate::color::{
    color_math::{blue, green, hex_from_argb, red},
    scheme::{DynamicScheme, Role, Variant},
    theme::{ThemeExport, ThemeRequest},
};
use crate::shared::YoloThemePreset;

/// Canonical 9-preset family shared by Rust (`aphrody-ui`), `packages/design`, Figma variables,
/// Hyprland/Omarchy, and all GPUI/Dioxus/WinUI/TUI targets.
#[derive(Clone, Copy, Debug, Default, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "kebab-case")]
pub enum FusionThemePreset {
    #[default]
    Aphrody,
    M3,
    Fluent,
    Hyprland,
    Omarchy,
    Catppuccin,
    CachyOs,
    Nord,
    Gruvbox,
}

/// Declarative seed, variant, and default luminance mode for a [`FusionThemePreset`].
#[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize)]
pub struct ThemePresetSpec {
    pub id: &'static str,
    pub display_name: &'static str,
    pub seed_hex: &'static str,
    pub seed_argb: u32,
    pub variant: &'static str,
    pub default_dark: bool,
    pub corner_radius_px: u16,
    pub gap_px: u16,
    pub focus_ring_px: u16,
}

impl FusionThemePreset {
    /// Ordered list of all 9 presets.
    pub const ALL: [Self; 9] = [
        Self::Aphrody,
        Self::M3,
        Self::Fluent,
        Self::Hyprland,
        Self::Omarchy,
        Self::Catppuccin,
        Self::CachyOs,
        Self::Nord,
        Self::Gruvbox,
    ];

    /// Kebab-case canonical identifier matching `packages/design/src/themes.ts`.
    #[must_use]
    pub const fn id(self) -> &'static str {
        match self {
            Self::Aphrody => "aphrody",
            Self::M3 => "m3",
            Self::Fluent => "fluent",
            Self::Hyprland => "hyprland",
            Self::Omarchy => "omarchy",
            Self::Catppuccin => "catppuccin",
            Self::CachyOs => "cachyos",
            Self::Nord => "nord",
            Self::Gruvbox => "gruvbox",
        }
    }

    /// Parses a preset identifier case-insensitively (accepts `yolo-*` aliases).
    #[must_use]
    pub fn from_id(raw: &str) -> Option<Self> {
        match raw.trim().to_ascii_lowercase().as_str() {
            "aphrody" | "yolo-aphrody" => Some(Self::Aphrody),
            "m3" | "material" | "material3" | "yolo-m3" => Some(Self::M3),
            "fluent" | "fluent2" | "winui" | "winui3" | "yolo-fluent" => Some(Self::Fluent),
            "hyprland" | "hypr" | "hyprwm" | "yolo-hyprland" => Some(Self::Hyprland),
            "omarchy" | "tokyo-night" | "omacom" | "yolo-omarchy" => Some(Self::Omarchy),
            "catppuccin" | "catppuccin-mocha" | "mocha" => Some(Self::Catppuccin),
            "cachyos" | "cachy" | "cachy-os" => Some(Self::CachyOs),
            "nord" | "arctic" => Some(Self::Nord),
            "gruvbox" | "gruvbox-dark" => Some(Self::Gruvbox),
            _ => None,
        }
    }

    /// Static specification matching `packages/design/src/themes.ts`.
    #[must_use]
    pub const fn spec(self) -> ThemePresetSpec {
        match self {
            Self::Aphrody => ThemePresetSpec {
                id: "aphrody",
                display_name: "Aphrody (Material 3 Vibrant)",
                seed_hex: "#3355FF",
                seed_argb: 0xFF33_55FF,
                variant: "vibrant",
                default_dark: false,
                corner_radius_px: 12,
                gap_px: 12,
                focus_ring_px: 2,
            },
            Self::M3 => ThemePresetSpec {
                id: "m3",
                display_name: "Google Material Design 3",
                seed_hex: "#6750A4",
                seed_argb: 0xFF67_50A4,
                variant: "tonal-spot",
                default_dark: false,
                corner_radius_px: 12,
                gap_px: 12,
                focus_ring_px: 2,
            },
            Self::Fluent => ThemePresetSpec {
                id: "fluent",
                display_name: "Microsoft Fluent 2 (WinUI 3)",
                seed_hex: "#0078D4",
                seed_argb: 0xFF00_78D4,
                variant: "content",
                default_dark: false,
                corner_radius_px: 8,
                gap_px: 12,
                focus_ring_px: 2,
            },
            Self::Hyprland => ThemePresetSpec {
                id: "hyprland",
                display_name: "Hyprland Wayland Compositor",
                seed_hex: "#00E5FF",
                seed_argb: 0xFF00_E5FF,
                variant: "vibrant",
                default_dark: true,
                corner_radius_px: 12,
                gap_px: 12,
                focus_ring_px: 2,
            },
            Self::Omarchy => ThemePresetSpec {
                id: "omarchy",
                display_name: "Omacom Omarchy (Tokyo Night)",
                seed_hex: "#7AA2F7",
                seed_argb: 0xFF7A_A2F7,
                variant: "tonal-spot",
                default_dark: true,
                corner_radius_px: 10,
                gap_px: 12,
                focus_ring_px: 2,
            },
            Self::Catppuccin => ThemePresetSpec {
                id: "catppuccin",
                display_name: "Catppuccin Mocha",
                seed_hex: "#CBA6F7",
                seed_argb: 0xFFCB_A6F7,
                variant: "tonal-spot",
                default_dark: true,
                corner_radius_px: 12,
                gap_px: 12,
                focus_ring_px: 2,
            },
            Self::CachyOs => ThemePresetSpec {
                id: "cachyos",
                display_name: "CachyOS Kernel Accent",
                seed_hex: "#00CC88",
                seed_argb: 0xFF00_CC88,
                variant: "vibrant",
                default_dark: true,
                corner_radius_px: 10,
                gap_px: 12,
                focus_ring_px: 2,
            },
            Self::Nord => ThemePresetSpec {
                id: "nord",
                display_name: "Nord Arctic Frost",
                seed_hex: "#88C0D0",
                seed_argb: 0xFF88_C0D0,
                variant: "neutral",
                default_dark: true,
                corner_radius_px: 8,
                gap_px: 12,
                focus_ring_px: 2,
            },
            Self::Gruvbox => ThemePresetSpec {
                id: "gruvbox",
                display_name: "Gruvbox Retro Warm",
                seed_hex: "#FABD2F",
                seed_argb: 0xFFFA_BD2F,
                variant: "expressive",
                default_dark: true,
                corner_radius_px: 6,
                gap_px: 12,
                focus_ring_px: 2,
            },
        }
    }

    /// Maps into the crate-wide [`YoloThemePreset`] taxonomy.
    #[must_use]
    pub const fn to_yolo(self) -> YoloThemePreset {
        match self {
            Self::Aphrody => YoloThemePreset::Aphrody,
            Self::M3 => YoloThemePreset::M3,
            Self::Fluent => YoloThemePreset::Fluent,
            Self::Hyprland => YoloThemePreset::Hyprland,
            Self::Omarchy | Self::Catppuccin | Self::CachyOs | Self::Nord | Self::Gruvbox => {
                YoloThemePreset::Omarchy
            }
        }
    }

    /// Converts from an existing [`YoloThemePreset`].
    #[must_use]
    pub const fn from_yolo(yolo: YoloThemePreset) -> Self {
        match yolo {
            YoloThemePreset::Aphrody => Self::Aphrody,
            YoloThemePreset::M3 | YoloThemePreset::Neutral | YoloThemePreset::Chromium => Self::M3,
            YoloThemePreset::Fluent | YoloThemePreset::Apple => Self::Fluent,
            YoloThemePreset::Hyprland => Self::Hyprland,
            YoloThemePreset::Omarchy => Self::Omarchy,
        }
    }

    /// Builds a validated M3 [`ThemeRequest`] for this preset.
    #[must_use]
    pub fn theme_request(self) -> ThemeRequest {
        let spec = self.spec();
        ThemeRequest::parse(Some(spec.seed_hex), Some(spec.variant), Some(0.0))
            .unwrap_or_else(|_| {
                ThemeRequest::new(spec.seed_argb, Variant::TonalSpot, 0.0)
                    .expect("opaque seed with zero contrast")
            })
    }

    /// Resolves all 49 M3 semantic roles for `dark` luminance mode.
    #[must_use]
    pub fn scheme(self, dark: bool) -> DynamicScheme {
        self.theme_request().scheme(dark)
    }
}

/// Complete resolved theme snapshot used by every backend renderer.
#[derive(Clone, Debug, Serialize)]
pub struct ResolvedFusionTheme {
    pub preset: ThemePresetSpec,
    pub dark: bool,
    pub export: ThemeExport,
    pub primary_rgba: [u8; 4],
    pub on_primary_rgba: [u8; 4],
    pub primary_container_rgba: [u8; 4],
    pub secondary_rgba: [u8; 4],
    pub tertiary_rgba: [u8; 4],
    pub surface_rgba: [u8; 4],
    pub surface_container_rgba: [u8; 4],
    pub surface_container_high_rgba: [u8; 4],
    pub on_surface_rgba: [u8; 4],
    pub on_surface_variant_rgba: [u8; 4],
    pub outline_rgba: [u8; 4],
    pub outline_variant_rgba: [u8; 4],
    pub error_rgba: [u8; 4],
}

impl ResolvedFusionTheme {
    /// Computes concrete RGBA colors and 49 semantic tokens from `(preset, dark)`.
    #[must_use]
    pub fn resolve(preset: FusionThemePreset, dark: bool) -> Self {
        let req = preset.theme_request();
        let scheme = req.scheme(dark);
        Self {
            preset: preset.spec(),
            dark,
            export: req.export(),
            primary_rgba: argb_to_rgba(scheme.argb(Role::Primary)),
            on_primary_rgba: argb_to_rgba(scheme.argb(Role::OnPrimary)),
            primary_container_rgba: argb_to_rgba(scheme.argb(Role::PrimaryContainer)),
            secondary_rgba: argb_to_rgba(scheme.argb(Role::Secondary)),
            tertiary_rgba: argb_to_rgba(scheme.argb(Role::Tertiary)),
            surface_rgba: argb_to_rgba(scheme.argb(Role::Surface)),
            surface_container_rgba: argb_to_rgba(scheme.argb(Role::SurfaceContainer)),
            surface_container_high_rgba: argb_to_rgba(scheme.argb(Role::SurfaceContainerHigh)),
            on_surface_rgba: argb_to_rgba(scheme.argb(Role::OnSurface)),
            on_surface_variant_rgba: argb_to_rgba(scheme.argb(Role::OnSurfaceVariant)),
            outline_rgba: argb_to_rgba(scheme.argb(Role::Outline)),
            outline_variant_rgba: argb_to_rgba(scheme.argb(Role::OutlineVariant)),
            error_rgba: argb_to_rgba(scheme.argb(Role::Error)),
        }
    }

    /// Role map (`camelCase` -> `#rrggbb`) matching `dark`.
    #[must_use]
    pub fn roles(&self) -> &BTreeMap<String, String> {
        if self.dark {
            &self.export.dark
        } else {
            &self.export.light
        }
    }

    /// Exports Dioxus/Blitz CSS variables bound to `--md-sys-color-*`.
    #[must_use]
    pub fn to_css_variables(&self) -> String {
        let mut out = String::new();
        out.push_str(":root {\n");
        for (key, value) in self.roles() {
            out.push_str("  --md-sys-color-");
            out.push_str(&to_kebab(key));
            out.push_str(": ");
            out.push_str(value);
            out.push_str(";\n");
        }
        out.push_str(&format!(
            "  --aphrody-radius-window: {}px;\n  --aphrody-gap: {}px;\n  --aphrody-focus-ring: {}px;\n",
            self.preset.corner_radius_px, self.preset.gap_px, self.preset.focus_ring_px
        ));
        out.push_str("}\n");
        out
    }

    /// Exports GPUI-Kit JSON token structure compatible with `longbridge/gpui-kit`.
    #[must_use]
    pub fn to_gpui_kit_json(&self) -> serde_json::Value {
        serde_json::json!({
            "preset": self.preset.id,
            "mode": if self.dark { "dark" } else { "light" },
            "radius": self.preset.corner_radius_px,
            "gap": self.preset.gap_px,
            "colors": {
                "background": rgba_hex(self.surface_rgba),
                "foreground": rgba_hex(self.on_surface_rgba),
                "muted": rgba_hex(self.surface_container_rgba),
                "muted_foreground": rgba_hex(self.on_surface_variant_rgba),
                "primary": rgba_hex(self.primary_rgba),
                "primary_foreground": rgba_hex(self.on_primary_rgba),
                "secondary": rgba_hex(self.primary_container_rgba),
                "border": rgba_hex(self.outline_variant_rgba),
                "ring": rgba_hex(self.primary_rgba),
                "danger": rgba_hex(self.error_rgba),
            }
        })
    }

    /// Exports Longbridge NSH (`native-shell`) style palette values.
    #[must_use]
    pub fn to_nsh_styles_json(&self) -> serde_json::Value {
        serde_json::json!({
            "themeId": self.preset.id,
            "colorScheme": if self.dark { "dark" } else { "light" },
            "surfaceColor": rgba_hex(self.surface_rgba),
            "containerColor": rgba_hex(self.surface_container_high_rgba),
            "accentColor": rgba_hex(self.primary_rgba),
            "textColor": rgba_hex(self.on_surface_rgba),
            "borderColor": rgba_hex(self.outline_variant_rgba),
            "cornerRadius": self.preset.corner_radius_px,
        })
    }

    /// Exports Hyprland compositor `hyprland.conf` variable assignments (`general`, `decoration`).
    #[must_use]
    pub fn to_hyprland_conf(&self) -> String {
        let active_start = rgba_hex_no_hash(self.primary_rgba);
        let active_end = rgba_hex_no_hash(self.tertiary_rgba);
        let inactive = rgba_hex_no_hash(self.outline_variant_rgba);
        let shadow = rgba_hex_no_hash(self.surface_container_rgba);
        format!(
            "# aphrody-ui fusion theme: {id} ({mode})\n\
$aphrody_surface = rgb({surf})\n\
$aphrody_on_surface = rgb({on_surf})\n\
general {{\n\
    gaps_in = {half_gap}\n\
    gaps_out = {gap}\n\
    border_size = {ring}\n\
    col.active_border = rgb({active_start}) rgb({active_end}) 45deg\n\
    col.inactive_border = rgb({inactive})\n\
}}\n\
decoration {{\n\
    rounding = {radius}\n\
    shadow {{\n\
        color = rgba({shadow}ee)\n\
    }}\n\
}}\n",
            id = self.preset.id,
            mode = if self.dark { "dark" } else { "light" },
            surf = rgba_hex_no_hash(self.surface_rgba),
            on_surf = rgba_hex_no_hash(self.on_surface_rgba),
            half_gap = self.preset.gap_px / 2,
            gap = self.preset.gap_px,
            ring = self.preset.focus_ring_px,
            active_start = active_start,
            active_end = active_end,
            inactive = inactive,
            radius = self.preset.corner_radius_px,
            shadow = shadow,
        )
    }

    /// Exports WinUI 3 XAML `ResourceDictionary` entries bound to Mica/Fluent roles.
    #[must_use]
    pub fn to_winui_xaml_resources(&self) -> String {
        format!(
            "<ResourceDictionary xmlns=\"http://schemas.microsoft.com/winfx/2006/xaml/presentation\" xmlns:x=\"http://schemas.microsoft.com/winfx/2006/xaml\">\n\
  <Color x:Key=\"SystemAccentColor\">{accent}</Color>\n\
  <SolidColorBrush x:Key=\"ApplicationPageBackgroundThemeBrush\" Color=\"{surf}\" />\n\
  <SolidColorBrush x:Key=\"CardBackgroundFillColorDefaultBrush\" Color=\"{card}\" />\n\
  <SolidColorBrush x:Key=\"TextFillColorPrimaryBrush\" Color=\"{fg}\" />\n\
  <SolidColorBrush x:Key=\"ControlStrokeColorDefaultBrush\" Color=\"{border}\" />\n\
  <CornerRadius x:Key=\"ControlCornerRadius\">{radius}</CornerRadius>\n\
</ResourceDictionary>\n",
            accent = rgba_hex(self.primary_rgba),
            surf = rgba_hex(self.surface_rgba),
            card = rgba_hex(self.surface_container_high_rgba),
            fg = rgba_hex(self.on_surface_rgba),
            border = rgba_hex(self.outline_variant_rgba),
            radius = self.preset.corner_radius_px,
        )
    }

    /// Exports 24-bit ANSI escape sequences for CLI/terminal headers under this preset.
    #[must_use]
    pub fn to_ansi_header_banner(&self, title: &str) -> String {
        let [br, bg, bb, _] = self.primary_rgba;
        let [fr, fg, fb, _] = self.on_primary_rgba;
        format!(
            "\x1b[48;2;{br};{bg};{bb}m\x1b[38;2;{fr};{fg};{fb}m\x1b[1m {title} [{id}] \x1b[0m",
            id = self.preset.id
        )
    }
}

#[must_use]
pub(crate) const fn argb_to_rgba(argb: u32) -> [u8; 4] {
    [
        red(argb),
        green(argb),
        blue(argb),
        ((argb >> 24) & 0xFF) as u8,
    ]
}

#[must_use]
pub(crate) fn rgba_hex(c: [u8; 4]) -> String {
    let argb =
        (u32::from(c[3]) << 24) | (u32::from(c[0]) << 16) | (u32::from(c[1]) << 8) | u32::from(c[2]);
    hex_from_argb(argb)
}

#[must_use]
fn rgba_hex_no_hash(c: [u8; 4]) -> String {
    format!("{:02x}{:02x}{:02x}", c[0], c[1], c[2])
}

#[must_use]
fn to_kebab(camel: &str) -> String {
    let mut out = String::with_capacity(camel.len() + 4);
    for ch in camel.chars() {
        if ch.is_ascii_uppercase() {
            out.push('-');
            out.push(ch.to_ascii_lowercase());
        } else {
            out.push(ch);
        }
    }
    out
}
