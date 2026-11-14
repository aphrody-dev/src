// Généré par packages/design/src/adapters.ts depuis tokens/tokens.json (assets/brand/brand.toml, seed #135B82, vibrant, MCU 0.4.0). Ne pas éditer.
// Rust layout & theme constants shared with src/taffy and src/ui/kit.

pub const GAP_PX: f32 = 12.0;
pub const FOCUS_RING_PX: f32 = 2.0;
pub const WINDOW_RADIUS_PX: f32 = 12.0;

pub const SHAPE_EXTRA_SMALL_PX: f32 = 4.0;
pub const SHAPE_SMALL_PX: f32 = 8.0;
pub const SHAPE_MEDIUM_PX: f32 = 12.0;
pub const SHAPE_LARGE_PX: f32 = 16.0;
pub const SHAPE_EXTRA_LARGE_PX: f32 = 28.0;

/// (id, seed_hex, variant, default_dark) matching packages/design/src/themes.ts
pub const FUSION_PRESETS: &[(&str, &str, &str, bool)] = &[
    ("aphrody", "#135B82", "vibrant", false),
    ("m3", "#6750A4", "tonal-spot", false),
    ("fluent", "#0078D4", "content", false),
    ("hyprland", "#00E5FF", "vibrant", true),
    ("omarchy", "#7AA2F7", "tonal-spot", true),
    ("catppuccin", "#CBA6F7", "tonal-spot", true),
    ("cachyos", "#00CC88", "vibrant", true),
    ("nord", "#88C0D0", "neutral", true),
    ("gruvbox", "#FABD2F", "expressive", true),
];
