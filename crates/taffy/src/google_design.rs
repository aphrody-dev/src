//! # Google Design System (Material Design 3 Expressive) Engine
//!
//! Provides a complete layout token, color system, typography scale, component style factory,
//! and modern framework integration bridge (Dioxus, GPUI / Zed, Longbridge) based on:
//! - [Google Design](https://design.google/)
//! - [Material Design 3](https://m3.material.io/)
//! - [Material Expressive Guidelines](https://design.google/library/material-expressive/)

#[cfg(not(feature = "std"))]
use alloc::{
    format,
    string::String,
    vec::Vec,
};

#[cfg(feature = "std")]
use std::{
    format,
    string::String,
    vec::Vec,
};

use crate::{
    geometry::{Rect, Size},
    style::{AlignItems, Display, FlexDirection, JustifyContent, Style},
    ExpandedDimension, ExpandedLengthPercentageAuto,
};
use crate::style_helpers::{auto, length, percent, zero};

#[cfg(feature = "grid")]
use crate::style_helpers::evenly_sized_tracks;

/// Canonical Material Design 3 Window Size Classes.
/// Used to trigger responsive layout shifts across phone, foldable, tablet, desktop, and ultra-wide screens.
#[derive(Debug, Copy, Clone, PartialEq, Eq, PartialOrd, Ord, Hash)]
#[cfg_attr(feature = "serde", derive(serde::Serialize, serde::Deserialize))]
pub enum WindowSizeClass {
    /// Compact screens: < 600dp (e.g. mobile phones in portrait).
    Compact,
    /// Medium screens: 600dp..840dp (e.g. small tablets, foldables).
    Medium,
    /// Expanded screens: 840dp..1200dp (e.g. large tablets, small laptops).
    Expanded,
    /// Large screens: 1200dp..1600dp (e.g. desktop monitors).
    Large,
    /// Extra large screens: >= 1600dp (e.g. ultra-wide and 4K displays).
    ExtraLarge,
}

impl WindowSizeClass {
    /// Determines the window size class from viewport width in dp/px.
    pub fn from_width(width: f32) -> Self {
        if width < 600.0 {
            Self::Compact
        } else if width < 840.0 {
            Self::Medium
        } else if width < 1200.0 {
            Self::Expanded
        } else if width < 1600.0 {
            Self::Large
        } else {
            Self::ExtraLarge
        }
    }

    /// Number of grid columns for this window class (4, 8, or 12).
    pub const fn grid_columns(&self) -> u16 {
        match self {
            Self::Compact => 4,
            Self::Medium => 8,
            Self::Expanded | Self::Large | Self::ExtraLarge => 12,
        }
    }

    /// Outer margin in dp for this window class (16dp or 24dp).
    pub const fn margin_dp(&self) -> f32 {
        match self {
            Self::Compact => 16.0,
            Self::Medium | Self::Expanded | Self::Large | Self::ExtraLarge => 24.0,
        }
    }

    /// Gutter / gap in dp for this window class (16dp or 24dp).
    pub const fn gutter_dp(&self) -> f32 {
        match self {
            Self::Compact => 16.0,
            Self::Medium | Self::Expanded | Self::Large | Self::ExtraLarge => 24.0,
        }
    }

    /// Whether navigation should collapse to a bottom bar or expand to a navigation rail / drawer.
    pub const fn prefers_navigation_rail(&self) -> bool {
        match self {
            Self::Compact => false,
            Self::Medium | Self::Expanded | Self::Large | Self::ExtraLarge => true,
        }
    }
}

/// Canonical Material 3 adaptive layout patterns.
#[derive(Debug, Copy, Clone, PartialEq, Eq)]
pub enum CanonicalLayoutType {
    /// Supporting pane layout: primary pane accompanied by a supporting sidebar pane.
    SupportingPane,
    /// List-detail layout: list of items alongside the selected item's detail view.
    ListDetail,
    /// Feed layout: vertically centered stream of cards or articles.
    Feed,
}

/// Color token representing RGBA color values with full conversions.
#[derive(Debug, Copy, Clone, PartialEq, Eq, Hash)]
#[cfg_attr(feature = "serde", derive(serde::Serialize, serde::Deserialize))]
pub struct M3Color {
    /// Red channel (0-255).
    pub r: u8,
    /// Green channel (0-255).
    pub g: u8,
    /// Blue channel (0-255).
    pub b: u8,
    /// Alpha channel (0-255).
    pub a: u8,
}

impl M3Color {
    /// Creates a new RGBA color.
    pub const fn from_rgba(r: u8, g: u8, b: u8, a: u8) -> Self {
        Self { r, g, b, a }
    }

    /// Creates a new RGB color with alpha = 255.
    pub const fn from_rgb(r: u8, g: u8, b: u8) -> Self {
        Self { r, g, b, a: 255 }
    }

    /// Creates a color from a 24-bit hex literal (e.g. 0x4285F4).
    pub const fn from_hex(hex: u32) -> Self {
        Self {
            r: ((hex >> 16) & 0xFF) as u8,
            g: ((hex >> 8) & 0xFF) as u8,
            b: (hex & 0xFF) as u8,
            a: 255,
        }
    }

    /// Converts to [f32; 4] normalized (0.0 to 1.0) for GPU shaders / WebGPU / Vulkan.
    pub fn to_f32_rgba(&self) -> [f32; 4] {
        [
            self.r as f32 / 255.0,
            self.g as f32 / 255.0,
            self.b as f32 / 255.0,
            self.a as f32 / 255.0,
        ]
    }

    /// Formats as CSS hex string, e.g. "#4285f4".
    pub fn to_css_hex(&self) -> String {
        if self.a == 255 {
            format!("#{:02x}{:02x}{:02x}", self.r, self.g, self.b)
        } else {
            format!("#{:02x}{:02x}{:02x}{:02x}", self.r, self.g, self.b, self.a)
        }
    }

    /// Formats as CSS rgba() string.
    pub fn to_css_rgba(&self) -> String {
        format!(
            "rgba({}, {}, {}, {:.3})",
            self.r,
            self.g,
            self.b,
            self.a as f32 / 255.0
        )
    }
}

/// Official Google Brand Palette tokens.
pub mod google_brand {
    use super::M3Color;
    /// Google Blue (#4285F4)
    pub const GOOGLE_BLUE: M3Color = M3Color::from_hex(0x4285F4);
    /// Google Red (#EA4335)
    pub const GOOGLE_RED: M3Color = M3Color::from_hex(0xEA4335);
    /// Google Yellow (#FBBC05)
    pub const GOOGLE_YELLOW: M3Color = M3Color::from_hex(0xFBBC05);
    /// Google Green (#34A853)
    pub const GOOGLE_GREEN: M3Color = M3Color::from_hex(0x34A853);
    /// Google Dark Surface (#202124)
    pub const GOOGLE_DARK_SURFACE: M3Color = M3Color::from_hex(0x202124);
    /// Google Light Surface (#FFFFFF)
    pub const GOOGLE_LIGHT_SURFACE: M3Color = M3Color::from_hex(0xFFFFFF);
}

/// Full Material Design 3 Expressive Color Scheme (Light & Dark).
#[derive(Debug, Clone, PartialEq, Eq)]
#[cfg_attr(feature = "serde", derive(serde::Serialize, serde::Deserialize))]
pub struct M3ColorScheme {
    /// Main brand accent color.
    pub primary: M3Color,
    /// Text/icon color on primary.
    pub on_primary: M3Color,
    /// Container background using primary tint.
    pub primary_container: M3Color,
    /// Text/icon on primary container.
    pub on_primary_container: M3Color,
    /// Secondary accent color.
    pub secondary: M3Color,
    /// Text/icon on secondary.
    pub on_secondary: M3Color,
    /// Container background using secondary tint.
    pub secondary_container: M3Color,
    /// Text/icon on secondary container.
    pub on_secondary_container: M3Color,
    /// Tertiary accent color.
    pub tertiary: M3Color,
    /// Text/icon on tertiary.
    pub on_tertiary: M3Color,
    /// Container background using tertiary tint.
    pub tertiary_container: M3Color,
    /// Text/icon on tertiary container.
    pub on_tertiary_container: M3Color,
    /// Error alert color.
    pub error: M3Color,
    /// Text/icon on error.
    pub on_error: M3Color,
    /// Error container.
    pub error_container: M3Color,
    /// Text/icon on error container.
    pub on_error_container: M3Color,
    /// Background surface color.
    pub surface: M3Color,
    /// Content color on surface.
    pub on_surface: M3Color,
    /// Alternative surface tone.
    pub surface_variant: M3Color,
    /// Content color on surface variant.
    pub on_surface_variant: M3Color,
    /// Lowest container elevation surface.
    pub surface_container_lowest: M3Color,
    /// Low container elevation surface.
    pub surface_container_low: M3Color,
    /// Standard container elevation surface.
    pub surface_container: M3Color,
    /// High container elevation surface.
    pub surface_container_high: M3Color,
    /// Highest container elevation surface.
    pub surface_container_highest: M3Color,
    /// Strong outline boundary.
    pub outline: M3Color,
    /// Soft outline boundary / divider.
    pub outline_variant: M3Color,
    /// Canvas background.
    pub background: M3Color,
    /// Content color on background.
    pub on_background: M3Color,
    /// Inverted surface for snackbars/tooltips.
    pub inverse_surface: M3Color,
    /// Content on inverse surface.
    pub inverse_on_surface: M3Color,
    /// Inverse primary accent.
    pub inverse_primary: M3Color,
    /// Backdrop scrim color.
    pub scrim: M3Color,
    /// Elevation shadow color.
    pub shadow: M3Color,
}

impl M3ColorScheme {
    /// Canonical Google Material 3 Expressive Light Color Scheme.
    pub fn light() -> Self {
        Self {
            primary: M3Color::from_hex(0x005AC1),
            on_primary: M3Color::from_hex(0xFFFFFF),
            primary_container: M3Color::from_hex(0xD8E2FF),
            on_primary_container: M3Color::from_hex(0x001A41),
            secondary: M3Color::from_hex(0x575E71),
            on_secondary: M3Color::from_hex(0xFFFFFF),
            secondary_container: M3Color::from_hex(0xDBE2F9),
            on_secondary_container: M3Color::from_hex(0x141B2C),
            tertiary: M3Color::from_hex(0x715573),
            on_tertiary: M3Color::from_hex(0xFFFFFF),
            tertiary_container: M3Color::from_hex(0xFBD7FC),
            on_tertiary_container: M3Color::from_hex(0x29132D),
            error: M3Color::from_hex(0xBA1A1A),
            on_error: M3Color::from_hex(0xFFFFFF),
            error_container: M3Color::from_hex(0xFFDAD6),
            on_error_container: M3Color::from_hex(0x410002),
            surface: M3Color::from_hex(0xFAF9FD),
            on_surface: M3Color::from_hex(0x191C20),
            surface_variant: M3Color::from_hex(0xE1E2EC),
            on_surface_variant: M3Color::from_hex(0x44474F),
            surface_container_lowest: M3Color::from_hex(0xFFFFFF),
            surface_container_low: M3Color::from_hex(0xF4F3F7),
            surface_container: M3Color::from_hex(0xEEE8F4),
            surface_container_high: M3Color::from_hex(0xE8E2EC),
            surface_container_highest: M3Color::from_hex(0xE2DCE6),
            outline: M3Color::from_hex(0x74777F),
            outline_variant: M3Color::from_hex(0xC4C6D0),
            background: M3Color::from_hex(0xFEF7FF),
            on_background: M3Color::from_hex(0x1D1B20),
            inverse_surface: M3Color::from_hex(0x2F3036),
            inverse_on_surface: M3Color::from_hex(0xF1F0F7),
            inverse_primary: M3Color::from_hex(0xADC6FF),
            scrim: M3Color::from_rgba(0, 0, 0, 128),
            shadow: M3Color::from_rgba(0, 0, 0, 40),
        }
    }

    /// Canonical Google Material 3 Expressive Dark Color Scheme.
    pub fn dark() -> Self {
        Self {
            primary: M3Color::from_hex(0xADC6FF),
            on_primary: M3Color::from_hex(0x002E69),
            primary_container: M3Color::from_hex(0x004494),
            on_primary_container: M3Color::from_hex(0xD8E2FF),
            secondary: M3Color::from_hex(0xBFC6DC),
            on_secondary: M3Color::from_hex(0x293041),
            secondary_container: M3Color::from_hex(0x3F4759),
            on_secondary_container: M3Color::from_hex(0xDBE2F9),
            tertiary: M3Color::from_hex(0xDEBCDF),
            on_tertiary: M3Color::from_hex(0x402843),
            tertiary_container: M3Color::from_hex(0x583E5B),
            on_tertiary_container: M3Color::from_hex(0xFBD7FC),
            error: M3Color::from_hex(0xFFB4AB),
            on_error: M3Color::from_hex(0x690005),
            error_container: M3Color::from_hex(0x93000A),
            on_error_container: M3Color::from_hex(0xFFDAD6),
            surface: M3Color::from_hex(0x111318),
            on_surface: M3Color::from_hex(0xE2E2E9),
            surface_variant: M3Color::from_hex(0x44474F),
            on_surface_variant: M3Color::from_hex(0xC4C6D0),
            surface_container_lowest: M3Color::from_hex(0x0C0E13),
            surface_container_low: M3Color::from_hex(0x191C20),
            surface_container: M3Color::from_hex(0x1D2024),
            surface_container_high: M3Color::from_hex(0x282A2F),
            surface_container_highest: M3Color::from_hex(0x33353A),
            outline: M3Color::from_hex(0x8E9099),
            outline_variant: M3Color::from_hex(0x44474F),
            background: M3Color::from_hex(0x141218),
            on_background: M3Color::from_hex(0xE6E0E9),
            inverse_surface: M3Color::from_hex(0xE2E2E9),
            inverse_on_surface: M3Color::from_hex(0x2F3036),
            inverse_primary: M3Color::from_hex(0x005AC1),
            scrim: M3Color::from_rgba(0, 0, 0, 180),
            shadow: M3Color::from_rgba(0, 0, 0, 90),
        }
    }
}

/// Canonical Material Design 3 typography style definition.
#[derive(Debug, Copy, Clone, PartialEq)]
#[cfg_attr(feature = "serde", derive(serde::Serialize, serde::Deserialize))]
pub struct M3TextStyle {
    /// Font size in pixels/points.
    pub font_size: f32,
    /// Line height in pixels/points.
    pub line_height: f32,
    /// Tracking / letter spacing in pixels.
    pub letter_spacing: f32,
    /// Standard CSS font weight (e.g. 400 for Regular, 500 for Medium, 700 for Bold).
    pub font_weight: u16,
}

/// The 15 canonical Material Design 3 Expressive Typography roles.
#[derive(Debug, Clone, PartialEq)]
#[cfg_attr(feature = "serde", derive(serde::Serialize, serde::Deserialize))]
pub struct M3TypographyScale {
    /// Display Large: 57px / 64px line-height.
    pub display_large: M3TextStyle,
    /// Display Medium: 45px / 52px line-height.
    pub display_medium: M3TextStyle,
    /// Display Small: 36px / 44px line-height.
    pub display_small: M3TextStyle,
    /// Headline Large: 32px / 40px line-height.
    pub headline_large: M3TextStyle,
    /// Headline Medium: 28px / 36px line-height.
    pub headline_medium: M3TextStyle,
    /// Headline Small: 24px / 32px line-height.
    pub headline_small: M3TextStyle,
    /// Title Large: 22px / 28px line-height.
    pub title_large: M3TextStyle,
    /// Title Medium: 16px / 24px line-height.
    pub title_medium: M3TextStyle,
    /// Title Small: 14px / 20px line-height.
    pub title_small: M3TextStyle,
    /// Body Large: 16px / 24px line-height.
    pub body_large: M3TextStyle,
    /// Body Medium: 14px / 20px line-height.
    pub body_medium: M3TextStyle,
    /// Body Small: 12px / 16px line-height.
    pub body_small: M3TextStyle,
    /// Label Large: 14px / 20px line-height.
    pub label_large: M3TextStyle,
    /// Label Medium: 12px / 16px line-height.
    pub label_medium: M3TextStyle,
    /// Label Small: 11px / 16px line-height.
    pub label_small: M3TextStyle,
}

impl M3TypographyScale {
    /// Canonical Google Material 3 typography specifications.
    pub fn standard() -> Self {
        Self {
            display_large: M3TextStyle {
                font_size: 57.0,
                line_height: 64.0,
                letter_spacing: -0.25,
                font_weight: 400,
            },
            display_medium: M3TextStyle {
                font_size: 45.0,
                line_height: 52.0,
                letter_spacing: 0.0,
                font_weight: 400,
            },
            display_small: M3TextStyle {
                font_size: 36.0,
                line_height: 44.0,
                letter_spacing: 0.0,
                font_weight: 400,
            },
            headline_large: M3TextStyle {
                font_size: 32.0,
                line_height: 40.0,
                letter_spacing: 0.0,
                font_weight: 400,
            },
            headline_medium: M3TextStyle {
                font_size: 28.0,
                line_height: 36.0,
                letter_spacing: 0.0,
                font_weight: 400,
            },
            headline_small: M3TextStyle {
                font_size: 24.0,
                line_height: 32.0,
                letter_spacing: 0.0,
                font_weight: 400,
            },
            title_large: M3TextStyle {
                font_size: 22.0,
                line_height: 28.0,
                letter_spacing: 0.0,
                font_weight: 400,
            },
            title_medium: M3TextStyle {
                font_size: 16.0,
                line_height: 24.0,
                letter_spacing: 0.15,
                font_weight: 500,
            },
            title_small: M3TextStyle {
                font_size: 14.0,
                line_height: 20.0,
                letter_spacing: 0.1,
                font_weight: 500,
            },
            body_large: M3TextStyle {
                font_size: 16.0,
                line_height: 24.0,
                letter_spacing: 0.5,
                font_weight: 400,
            },
            body_medium: M3TextStyle {
                font_size: 14.0,
                line_height: 20.0,
                letter_spacing: 0.25,
                font_weight: 400,
            },
            body_small: M3TextStyle {
                font_size: 12.0,
                line_height: 16.0,
                letter_spacing: 0.4,
                font_weight: 400,
            },
            label_large: M3TextStyle {
                font_size: 14.0,
                line_height: 20.0,
                letter_spacing: 0.1,
                font_weight: 500,
            },
            label_medium: M3TextStyle {
                font_size: 12.0,
                line_height: 16.0,
                letter_spacing: 0.5,
                font_weight: 500,
            },
            label_small: M3TextStyle {
                font_size: 11.0,
                line_height: 16.0,
                letter_spacing: 0.5,
                font_weight: 500,
            },
        }
    }
}

/// Material Design 3 standard dp spacing scale.
pub mod m3_spacing {
    /// 0dp
    pub const DP_0: f32 = 0.0;
    /// 4dp
    pub const DP_4: f32 = 4.0;
    /// 8dp
    pub const DP_8: f32 = 8.0;
    /// 12dp
    pub const DP_12: f32 = 12.0;
    /// 16dp
    pub const DP_16: f32 = 16.0;
    /// 20dp
    pub const DP_20: f32 = 20.0;
    /// 24dp
    pub const DP_24: f32 = 24.0;
    /// 32dp
    pub const DP_32: f32 = 32.0;
    /// 40dp
    pub const DP_40: f32 = 40.0;
    /// 48dp (Google touch target recommendation)
    pub const DP_48: f32 = 48.0;
    /// 56dp (Standard FAB diameter)
    pub const DP_56: f32 = 56.0;
    /// 64dp
    pub const DP_64: f32 = 64.0;
}

/// Material Design 3 Corner Radius Scale.
#[derive(Debug, Copy, Clone, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub enum M3CornerRadius {
    /// 0dp (Square)
    None,
    /// 4dp
    ExtraSmall,
    /// 8dp
    Small,
    /// 12dp
    Medium,
    /// 16dp
    Large,
    /// 28dp
    ExtraLarge,
    /// 9999dp (Full pill)
    Full,
}

impl M3CornerRadius {
    /// Radius value in dp.
    pub const fn to_dp(&self) -> f32 {
        match self {
            Self::None => 0.0,
            Self::ExtraSmall => 4.0,
            Self::Small => 8.0,
            Self::Medium => 12.0,
            Self::Large => 16.0,
            Self::ExtraLarge => 28.0,
            Self::Full => 9999.0,
        }
    }
}

/// Material Design 3 Elevation levels.
#[derive(Debug, Copy, Clone, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub enum M3Elevation {
    /// Level 0: 0dp elevation.
    Level0,
    /// Level 1: 1dp elevation.
    Level1,
    /// Level 2: 3dp elevation.
    Level2,
    /// Level 3: 6dp elevation.
    Level3,
    /// Level 4: 8dp elevation.
    Level4,
    /// Level 5: 12dp elevation.
    Level5,
}

impl M3Elevation {
    /// Elevation in dp.
    pub const fn to_dp(&self) -> f32 {
        match self {
            Self::Level0 => 0.0,
            Self::Level1 => 1.0,
            Self::Level2 => 3.0,
            Self::Level3 => 6.0,
            Self::Level4 => 8.0,
            Self::Level5 => 12.0,
        }
    }
}

/// Material Design 3 Spring Motion physics parameters.
#[derive(Debug, Copy, Clone, PartialEq)]
pub struct M3SpringMotion {
    /// Spring stiffness.
    pub stiffness: f32,
    /// Damping ratio.
    pub damping: f32,
    /// Mass.
    pub mass: f32,
}

impl M3SpringMotion {
    /// Emphasized spring motion for interactive gestures and spatial transitions.
    pub const EMPHASIZED: Self = Self {
        stiffness: 700.0,
        damping: 30.0,
        mass: 1.0,
    };

    /// Standard spring motion for subtle element state adjustments.
    pub const STANDARD: Self = Self {
        stiffness: 1000.0,
        damping: 40.0,
        mass: 1.0,
    };
}

/// Helper constructors returning ready-to-use `taffy::Style` for Google Design Material 3 components.
pub mod components {
    use super::*;

    /// Constructs a Google Search Bar style (584px max width, 48px height, pill radius, flex row, centered).
    pub fn m3_search_bar_style() -> Style {
        Style {
            display: Display::Flex,
            flex_direction: FlexDirection::Row,
            align_items: AlignItems::CENTER,
            size: Size {
                width: length(584.0),
                height: length(48.0),
            },
            max_size: Size {
                width: length(584.0),
                height: auto(),
            },
            min_size: Size {
                width: auto(),
                height: length(48.0),
            },
            padding: Rect {
                left: length(16.0),
                right: length(16.0),
                top: zero(),
                bottom: zero(),
            },
            ..Default::default()
        }
    }

    /// Constructs a Material 3 Navigation Rail style (80dp width, full height, flex column, centered items).
    pub fn m3_navigation_rail_style() -> Style {
        Style {
            display: Display::Flex,
            flex_direction: FlexDirection::Column,
            align_items: AlignItems::CENTER,
            size: Size {
                width: length(80.0),
                height: percent(1.0),
            },
            min_size: Size {
                width: length(80.0),
                height: auto(),
            },
            padding: Rect {
                left: zero(),
                right: zero(),
                top: length(16.0),
                bottom: length(16.0),
            },
            gap: Size {
                width: zero(),
                height: length(12.0),
            },
            ..Default::default()
        }
    }

    /// Constructs a Material 3 Bento Grid container style with `columns` equal tracks and `gap` spacing.
    #[cfg(feature = "grid")]
    pub fn m3_bento_grid_style(columns: u16, gap: f32) -> Style {
        Style {
            display: Display::Grid,
            grid_template_columns: evenly_sized_tracks(columns),
            gap: Size {
                width: length(gap),
                height: length(gap),
            },
            ..Default::default()
        }
    }

    /// Constructs a Material 3 Card style (16dp internal padding, flex column).
    pub fn m3_card_style() -> Style {
        Style {
            display: Display::Flex,
            flex_direction: FlexDirection::Column,
            padding: Rect {
                left: length(16.0),
                right: length(16.0),
                top: length(16.0),
                bottom: length(16.0),
            },
            ..Default::default()
        }
    }

    /// Constructs a Google Design Material 3 compliant touch button style.
    /// Strictly guarantees minimum 48x48dp dimensions (WCAG 2.2 AA & Google M3 touch target rules).
    pub fn m3_touch_button_style() -> Style {
        Style {
            display: Display::Flex,
            flex_direction: FlexDirection::Row,
            justify_content: JustifyContent::CENTER,
            align_items: AlignItems::CENTER,
            min_size: Size {
                width: length(48.0),
                height: length(48.0),
            },
            padding: Rect {
                left: length(24.0),
                right: length(24.0),
                top: length(10.0),
                bottom: length(10.0),
            },
            ..Default::default()
        }
    }

    /// Constructs a Floating Action Button (FAB) style (56x56dp minimum size).
    pub fn m3_fab_style() -> Style {
        Style {
            display: Display::Flex,
            justify_content: JustifyContent::CENTER,
            align_items: AlignItems::CENTER,
            size: Size {
                width: length(56.0),
                height: length(56.0),
            },
            min_size: Size {
                width: length(56.0),
                height: length(56.0),
            },
            ..Default::default()
        }
    }

    /// Constructs a Supporting Pane adaptive layout pair: (Container Style, Main Content Style, Supporting Pane Style).
    pub fn m3_supporting_pane_style(window_class: WindowSizeClass) -> (Style, Style, Style) {
        let is_stacked = matches!(window_class, WindowSizeClass::Compact);
        let container = Style {
            display: Display::Flex,
            flex_direction: if is_stacked {
                FlexDirection::Column
            } else {
                FlexDirection::Row
            },
            size: Size {
                width: percent(1.0),
                height: percent(1.0),
            },
            gap: Size {
                width: length(window_class.gutter_dp()),
                height: length(window_class.gutter_dp()),
            },
            margin: Rect {
                left: length(window_class.margin_dp()),
                right: length(window_class.margin_dp()),
                top: length(window_class.margin_dp()),
                bottom: length(window_class.margin_dp()),
            },
            ..Default::default()
        };

        let main = Style {
            display: Display::Flex,
            flex_grow: 1.0,
            size: Size {
                width: if is_stacked { percent(1.0) } else { auto() },
                height: auto(),
            },
            ..Default::default()
        };

        let supporting = Style {
            display: Display::Flex,
            size: Size {
                width: if is_stacked {
                    percent(1.0)
                } else {
                    length(360.0)
                },
                height: auto(),
            },
            min_size: Size {
                width: if is_stacked { auto() } else { length(320.0) },
                height: auto(),
            },
            ..Default::default()
        };

        (container, main, supporting)
    }

    /// Constructs a List-Detail adaptive layout pair: (Container Style, List Pane Style, Detail Pane Style).
    pub fn m3_list_detail_style(window_class: WindowSizeClass) -> (Style, Style, Style) {
        let is_stacked = matches!(window_class, WindowSizeClass::Compact);
        let container = Style {
            display: Display::Flex,
            flex_direction: if is_stacked {
                FlexDirection::Column
            } else {
                FlexDirection::Row
            },
            size: Size {
                width: percent(1.0),
                height: percent(1.0),
            },
            gap: Size {
                width: length(window_class.gutter_dp()),
                height: length(window_class.gutter_dp()),
            },
            margin: Rect {
                left: length(window_class.margin_dp()),
                right: length(window_class.margin_dp()),
                top: length(window_class.margin_dp()),
                bottom: length(window_class.margin_dp()),
            },
            ..Default::default()
        };

        let list = Style {
            display: Display::Flex,
            size: Size {
                width: if is_stacked {
                    percent(1.0)
                } else {
                    length(360.0)
                },
                height: percent(1.0),
            },
            ..Default::default()
        };

        let detail = Style {
            display: Display::Flex,
            flex_grow: 1.0,
            size: Size {
                width: if is_stacked { percent(1.0) } else { auto() },
                height: percent(1.0),
            },
            ..Default::default()
        };

        (container, list, detail)
    }

    /// Constructs a Feed layout style (vertically centered stream, max-width 720dp).
    pub fn m3_feed_style() -> Style {
        Style {
            display: Display::Flex,
            flex_direction: FlexDirection::Column,
            align_items: AlignItems::CENTER,
            size: Size {
                width: percent(1.0),
                height: auto(),
            },
            max_size: Size {
                width: length(720.0),
                height: auto(),
            },
            margin: Rect {
                left: auto(),
                right: auto(),
                top: zero(),
                bottom: zero(),
            },
            ..Default::default()
        }
    }
}

pub use components::*;

/// Integration bridge connecting `taffy::Style` to Dioxus RSX inline CSS representations.
pub struct DioxusStyleBridge;

impl DioxusStyleBridge {
    /// Generates a CSS style string suitable for Dioxus `style: "..."` RSX attribute.
    pub fn to_css_style(style: &Style) -> String {
        let mut css = String::new();

        // Display
        match style.display {
            Display::Flex => css.push_str("display: flex; "),
            Display::Grid => css.push_str("display: grid; "),
            Display::Block => css.push_str("display: block; "),
            Display::None => css.push_str("display: none; "),
            _ => {}
        }

        // Flex Direction
        #[cfg(feature = "flexbox")]
        match style.flex_direction {
            FlexDirection::Row => css.push_str("flex-direction: row; "),
            FlexDirection::Column => css.push_str("flex-direction: column; "),
            FlexDirection::RowReverse => css.push_str("flex-direction: row-reverse; "),
            FlexDirection::ColumnReverse => css.push_str("flex-direction: column-reverse; "),
        }

        // Width & Height
        match style.size.width.expand() {
            ExpandedDimension::Length(w) => css.push_str(&format!("width: {w:.1}px; ")),
            ExpandedDimension::Percent(p) => css.push_str(&format!("width: {:.1}%; ", p * 100.0)),
            _ => {}
        }

        match style.size.height.expand() {
            ExpandedDimension::Length(h) => css.push_str(&format!("height: {h:.1}px; ")),
            ExpandedDimension::Percent(p) => css.push_str(&format!("height: {:.1}%; ", p * 100.0)),
            _ => {}
        }

        // Min Width & Height
        match style.min_size.width.expand() {
            ExpandedLengthPercentageAuto::Length(w) => css.push_str(&format!("min-width: {w:.1}px; ")),
            _ => {}
        }
        match style.min_size.height.expand() {
            ExpandedLengthPercentageAuto::Length(h) => css.push_str(&format!("min-height: {h:.1}px; ")),
            _ => {}
        }

        css
    }
}

/// Integration bridge mapping `taffy::Layout` to GPUI (Zed / Longbridge) bounds primitives.
pub struct GpuiLayoutBridge;

impl GpuiLayoutBridge {
    /// Converts a `taffy::Layout` to a GPUI-compatible bounds tuple: `(origin_x, origin_y, width, height)`.
    pub fn to_gpui_bounds(layout: &crate::tree::Layout) -> (f32, f32, f32, f32) {
        (
            layout.location.x,
            layout.location.y,
            layout.size.width,
            layout.size.height,
        )
    }

    /// Converts an `M3Color` into a normalized RGBA tuple `(r, g, b, a)` suitable for GPUI `rgba()`.
    pub fn to_gpui_rgba(color: &M3Color) -> (f32, f32, f32, f32) {
        let [r, g, b, a] = color.to_f32_rgba();
        (r, g, b, a)
    }
}

/// Integration bridge mapping Material Design 3 tokens into Longbridge `gpui-component` semantic tokens.
pub struct LongbridgeThemeBridge;

impl LongbridgeThemeBridge {
    /// Maps an `M3ColorScheme` to Longbridge / GPUI theme color key-value pairs.
    pub fn to_theme_tokens(scheme: &M3ColorScheme) -> Vec<(&'static str, String)> {
        let mut tokens = Vec::with_capacity(12);
        tokens.push(("primary", scheme.primary.to_css_hex()));
        tokens.push(("on-primary", scheme.on_primary.to_css_hex()));
        tokens.push(("primary-container", scheme.primary_container.to_css_hex()));
        tokens.push(("on-primary-container", scheme.on_primary_container.to_css_hex()));
        tokens.push(("secondary", scheme.secondary.to_css_hex()));
        tokens.push(("on-secondary", scheme.on_secondary.to_css_hex()));
        tokens.push(("surface", scheme.surface.to_css_hex()));
        tokens.push(("on-surface", scheme.on_surface.to_css_hex()));
        tokens.push(("surface-container", scheme.surface_container.to_css_hex()));
        tokens.push(("outline", scheme.outline.to_css_hex()));
        tokens.push(("background", scheme.background.to_css_hex()));
        tokens.push(("error", scheme.error.to_css_hex()));
        tokens
    }
}
