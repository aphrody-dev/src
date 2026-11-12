use serde::{Deserialize, Serialize};
use std::path::{Path, PathBuf};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum RenderTarget {
    Html,
    Dioxus,
    Gpui,
}

impl RenderTarget {
    pub fn parse(raw: &str) -> Result<Self, String> {
        match raw.trim().to_ascii_lowercase().as_str() {
            "html" | "ssr" => Ok(Self::Html),
            "dioxus" | "rsx" => Ok(Self::Dioxus),
            "gpui" | "zed" => Ok(Self::Gpui),
            other => Err(format!(
                "unsupported ui target '{other}' (expected html, dioxus, or gpui)"
            )),
        }
    }

    pub fn file_extension(self) -> &'static str {
        match self {
            Self::Html => "html",
            Self::Dioxus | Self::Gpui => "rs",
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum ThemeMode {
    AphrodyDark,
    AphrodyLight,
    Fluent2Dark,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum Variant {
    Primary,
    Secondary,
    Outline,
    Ghost,
    Danger,
    Success,
}

impl Variant {
    pub fn css_class(self) -> &'static str {
        match self {
            Self::Primary => "rs-variant-primary",
            Self::Secondary => "rs-variant-secondary",
            Self::Outline => "rs-variant-outline",
            Self::Ghost => "rs-variant-ghost",
            Self::Danger => "rs-variant-danger",
            Self::Success => "rs-variant-success",
        }
    }

    pub fn gpui_method(self) -> &'static str {
        match self {
            Self::Primary => "primary",
            Self::Secondary => "secondary",
            Self::Outline => "outline",
            Self::Ghost => "ghost",
            Self::Danger => "danger",
            Self::Success => "success",
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "kind", rename_all = "snake_case")]
pub enum UiPrimitive {
    Button {
        id: String,
        label: String,
        variant: Variant,
        disabled: bool,
    },
    Card {
        title: String,
        subtitle: Option<String>,
        body: String,
        footer: Option<String>,
    },
    Badge {
        label: String,
        variant: Variant,
    },
    Input {
        id: String,
        placeholder: String,
        value: String,
        input_type: String,
    },
    Dialog {
        id: String,
        title: String,
        description: String,
        confirm_label: String,
    },
    Tabs {
        id: String,
        tabs: Vec<(String, String)>,
        active_index: usize,
    },
    Table {
        headers: Vec<String>,
        rows: Vec<Vec<String>>,
    },
    CommandPalette {
        placeholder: String,
        commands: Vec<(String, String)>,
    },
    Toast {
        title: String,
        detail: String,
        variant: Variant,
    },
    Sidebar {
        brand: String,
        items: Vec<(String, String, bool)>,
    },
    TerminalPane {
        title: String,
        cwd: String,
        lines: Vec<String>,
    },
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ComponentSpec {
    pub slug: &'static str,
    pub struct_name: &'static str,
    pub category: &'static str,
    pub description: &'static str,
    pub targets: [&'static str; 3],
}

pub const REGISTRY_COMPONENTS: &[ComponentSpec] = &[
    ComponentSpec {
        slug: "button",
        struct_name: "Button",
        category: "Action",
        description: "OKLCH/HCT tactile action button with Fluent 2 focus ring and M3 state layer.",
        targets: ["html", "dioxus", "gpui"],
    },
    ComponentSpec {
        slug: "card",
        struct_name: "Card",
        category: "Surface",
        description: "Elevated Acrylic/Mica container with header, body, and footer slots.",
        targets: ["html", "dioxus", "gpui"],
    },
    ComponentSpec {
        slug: "badge",
        struct_name: "Badge",
        category: "Status",
        description: "Compact status pill with semantic OKLCH chroma tokens.",
        targets: ["html", "dioxus", "gpui"],
    },
    ComponentSpec {
        slug: "input",
        struct_name: "Input",
        category: "Form",
        description: "Zero-JS accessible text input with crisp 1px border and accent ring.",
        targets: ["html", "dioxus", "gpui"],
    },
    ComponentSpec {
        slug: "dialog",
        struct_name: "Dialog",
        category: "Overlay",
        description: "Native HTML <dialog> / Dioxus portal / GPUI modal overlay.",
        targets: ["html", "dioxus", "gpui"],
    },
    ComponentSpec {
        slug: "tabs",
        struct_name: "Tabs",
        category: "Navigation",
        description: "Segmented control & panel switcher with keyboard navigation.",
        targets: ["html", "dioxus", "gpui"],
    },
    ComponentSpec {
        slug: "table",
        struct_name: "Table",
        category: "Data",
        description: "Dense tabular grid with sticky header and monospace numeric alignment.",
        targets: ["html", "dioxus", "gpui"],
    },
    ComponentSpec {
        slug: "command-palette",
        struct_name: "CommandPalette",
        category: "Navigation",
        description: "Ctrl+K instant action launcher with keybinding hints.",
        targets: ["html", "dioxus", "gpui"],
    },
    ComponentSpec {
        slug: "toast",
        struct_name: "Toast",
        category: "Feedback",
        description: "Non-blocking notification banner with semantic border accent.",
        targets: ["html", "dioxus", "gpui"],
    },
    ComponentSpec {
        slug: "sidebar",
        struct_name: "Sidebar",
        category: "Layout",
        description: "Collapsible navigation rail with active indicator.",
        targets: ["html", "dioxus", "gpui"],
    },
    ComponentSpec {
        slug: "terminal-pane",
        struct_name: "TerminalPane",
        category: "Developer",
        description: "Monospace ring-buffer terminal surface for coding agents.",
        targets: ["html", "dioxus", "gpui"],
    },
];

pub fn theme_css_tokens(mode: ThemeMode) -> &'static str {
    match mode {
        ThemeMode::AphrodyDark | ThemeMode::Fluent2Dark => {
            r#":root, [data-theme="aphrody-dark"] {
  /* OKLCH + Material 3 HCT + Fluent 2 Surface Tokens */
  --rs-bg: oklch(0.145 0.014 265);
  --rs-surface-1: oklch(0.185 0.016 265);
  --rs-surface-2: oklch(0.225 0.018 265);
  --rs-surface-3: oklch(0.268 0.020 265);
  --rs-fg: oklch(0.955 0.008 265);
  --rs-fg-muted: oklch(0.715 0.016 265);
  --rs-border: oklch(0.305 0.020 265);
  --rs-primary: oklch(0.685 0.165 255);
  --rs-primary-fg: oklch(0.135 0.015 265);
  --rs-secondary: oklch(0.275 0.025 265);
  --rs-secondary-fg: oklch(0.935 0.010 265);
  --rs-success: oklch(0.720 0.170 152);
  --rs-danger: oklch(0.645 0.200 25);
  --rs-ring: oklch(0.685 0.165 255 / 0.45);
  --rs-radius-sm: 6px;
  --rs-radius-md: 10px;
  --rs-radius-lg: 14px;
  --rs-font-sans: "Inter", "Segoe UI Variable Text", system-ui, -apple-system, sans-serif;
  --rs-font-mono: "JetBrains Mono", "Cascadia Code", Consolas, monospace;
}
.rs-card { background: var(--rs-surface-1); border: 1px solid var(--rs-border); border-radius: var(--rs-radius-lg); padding: 16px; color: var(--rs-fg); box-shadow: 0 8px 24px rgba(0,0,0,0.28); }
.rs-card-title { font-size: 0.98rem; font-weight: 600; margin: 0 0 4px 0; letter-spacing: -0.01em; }
.rs-card-sub { font-size: 0.80rem; color: var(--rs-fg-muted); margin: 0 0 10px 0; }
.rs-card-body { font-size: 0.88rem; line-height: 1.5; color: var(--rs-fg); }
.rs-card-footer { margin-top: 12px; padding-top: 10px; border-top: 1px solid var(--rs-border); font-size: 0.78rem; color: var(--rs-fg-muted); }
.rs-btn { display: inline-flex; align-items: center; justify-content: center; gap: 6px; font-family: var(--rs-font-sans); font-size: 0.84rem; font-weight: 600; padding: 7px 14px; border-radius: var(--rs-radius-sm); border: 1px solid transparent; cursor: pointer; transition: filter 120ms ease, border-color 120ms ease; }
.rs-btn:focus-visible { outline: 2px solid var(--rs-ring); outline-offset: 2px; }
.rs-btn:disabled { opacity: 0.48; cursor: not-allowed; }
.rs-variant-primary { background: var(--rs-primary); color: var(--rs-primary-fg); }
.rs-variant-secondary { background: var(--rs-secondary); color: var(--rs-secondary-fg); border-color: var(--rs-border); }
.rs-variant-outline { background: transparent; color: var(--rs-fg); border-color: var(--rs-border); }
.rs-variant-ghost { background: transparent; color: var(--rs-fg-muted); }
.rs-variant-danger { background: var(--rs-danger); color: #fff; }
.rs-variant-success { background: var(--rs-success); color: #07130c; }
.rs-badge { display: inline-flex; align-items: center; padding: 2px 8px; border-radius: 999px; font-size: 0.72rem; font-weight: 600; letter-spacing: 0.01em; }
.rs-input { width: 100%; box-sizing: border-box; background: var(--rs-bg); color: var(--rs-fg); border: 1px solid var(--rs-border); border-radius: var(--rs-radius-sm); padding: 8px 11px; font-size: 0.86rem; font-family: var(--rs-font-sans); }
.rs-input:focus { outline: none; border-color: var(--rs-primary); box-shadow: 0 0 0 3px var(--rs-ring); }
.rs-table { width: 100%; border-collapse: collapse; font-size: 0.82rem; }
.rs-table th, .rs-table td { text-align: left; padding: 8px 10px; border-bottom: 1px solid var(--rs-border); }
.rs-table th { color: var(--rs-fg-muted); font-weight: 600; background: var(--rs-surface-2); }
.rs-terminal { background: oklch(0.115 0.010 265); border: 1px solid var(--rs-border); border-radius: var(--rs-radius-md); padding: 12px; font-family: var(--rs-font-mono); font-size: 0.79rem; color: oklch(0.89 0.04 160); overflow-x: auto; }
.rs-sidebar { background: var(--rs-surface-1); border-right: 1px solid var(--rs-border); padding: 14px 10px; display: flex; flex-direction: column; gap: 4px; }
.rs-nav-item { padding: 7px 10px; border-radius: var(--rs-radius-sm); color: var(--rs-fg-muted); text-decoration: none; font-size: 0.84rem; display: block; }
.rs-nav-item[data-active="true"] { background: var(--rs-surface-2); color: var(--rs-fg); font-weight: 600; }
.rs-toast { border: 1px solid var(--rs-border); border-left: 3px solid var(--rs-primary); background: var(--rs-surface-2); border-radius: var(--rs-radius-sm); padding: 10px 12px; }"#
        }
        ThemeMode::AphrodyLight => {
            r#":root, [data-theme="aphrody-light"] {
  --rs-bg: oklch(0.985 0.004 265);
  --rs-surface-1: oklch(1.000 0.000 0);
  --rs-surface-2: oklch(0.955 0.006 265);
  --rs-surface-3: oklch(0.920 0.008 265);
  --rs-fg: oklch(0.165 0.015 265);
  --rs-fg-muted: oklch(0.460 0.016 265);
  --rs-border: oklch(0.875 0.010 265);
  --rs-primary: oklch(0.520 0.185 255);
  --rs-primary-fg: oklch(0.990 0.002 265);
  --rs-secondary: oklch(0.945 0.008 265);
  --rs-secondary-fg: oklch(0.205 0.015 265);
  --rs-success: oklch(0.560 0.165 152);
  --rs-danger: oklch(0.550 0.210 25);
  --rs-ring: oklch(0.520 0.185 255 / 0.30);
}"#
        }
    }
}

pub fn default_primitive_for_slug(slug: &str) -> Result<UiPrimitive, String> {
    match slug.trim().to_ascii_lowercase().as_str() {
        "button" => Ok(UiPrimitive::Button {
            id: "btn-launch".to_string(),
            label: "Deploy Sovereign Node".to_string(),
            variant: Variant::Primary,
            disabled: false,
        }),
        "card" => Ok(UiPrimitive::Card {
            title: "Inference Telemetry".to_string(),
            subtitle: Some("Ring-3 + TensorZero Router".to_string()),
            body: "Blake3 prompt cache active. Sub-millisecond token dispatch.".to_string(),
            footer: Some("Updated 0ms ago".to_string()),
        }),
        "badge" => Ok(UiPrimitive::Badge {
            label: "PURE RUST".to_string(),
            variant: Variant::Success,
        }),
        "input" => Ok(UiPrimitive::Input {
            id: "model-query".to_string(),
            placeholder: "Ask local or cloud model...".to_string(),
            value: String::new(),
            input_type: "text".to_string(),
        }),
        "dialog" => Ok(UiPrimitive::Dialog {
            id: "dlg-apikey".to_string(),
            title: "Issue Scoped API Key".to_string(),
            description: "Generate a Blake3-hashed sk_sov_ bearer key.".to_string(),
            confirm_label: "Generate Key".to_string(),
        }),
        "tabs" => Ok(UiPrimitive::Tabs {
            id: "workspace-tabs".to_string(),
            tabs: vec![
                ("chat".to_string(), "Chat Workspace".to_string()),
                ("gateway".to_string(), "LLM Gateway".to_string()),
                ("auth".to_string(), "Better-Auth IAM".to_string()),
            ],
            active_index: 0,
        }),
        "table" => Ok(UiPrimitive::Table {
            headers: vec![
                "Provider".to_string(),
                "Endpoint".to_string(),
                "Status".to_string(),
            ],
            rows: vec![
                vec![
                    "ring3-agent".to_string(),
                    "127.0.0.1:8787".to_string(),
                    "READY".to_string(),
                ],
                vec![
                    "ollama".to_string(),
                    "127.0.0.1:11434".to_string(),
                    "STANDBY".to_string(),
                ],
            ],
        }),
        "command-palette" | "commandpalette" | "command" => Ok(UiPrimitive::CommandPalette {
            placeholder: "Type a command or search models...".to_string(),
            commands: vec![
                ("Switch Model".to_string(), "Ctrl+M".to_string()),
                ("New Session".to_string(), "Ctrl+N".to_string()),
                ("Issue sk_sov_ Key".to_string(), "Ctrl+K".to_string()),
            ],
        }),
        "toast" => Ok(UiPrimitive::Toast {
            title: "Cache Hit".to_string(),
            detail: "Served deterministically via Blake3 digest.".to_string(),
            variant: Variant::Success,
        }),
        "sidebar" => Ok(UiPrimitive::Sidebar {
            brand: "rust-stack".to_string(),
            items: vec![
                ("Workspace".to_string(), "/chat".to_string(), true),
                ("Models".to_string(), "/v1/models".to_string(), false),
                ("Components".to_string(), "/api/ui/components".to_string(), false),
            ],
        }),
        "terminal-pane" | "terminalpane" | "terminal" => Ok(UiPrimitive::TerminalPane {
            title: "rsc coding-agent".to_string(),
            cwd: "C:\\src\\crates\\rust-stack".to_string(),
            lines: vec![
                "$ cargo test --release".to_string(),
                "test result: ok. 0 failed; 100% pure rust".to_string(),
            ],
        }),
        other => Err(format!(
            "unknown component '{other}'. Available: button, card, badge, input, dialog, tabs, table, command-palette, toast, sidebar, terminal-pane"
        )),
    }
}

impl UiPrimitive {
    pub fn render(&self, target: RenderTarget) -> String {
        match target {
            RenderTarget::Html => self.render_html(),
            RenderTarget::Dioxus => self.render_dioxus(),
            RenderTarget::Gpui => self.render_gpui(),
        }
    }

    pub fn render_html(&self) -> String {
        match self {
            Self::Button {
                id,
                label,
                variant,
                disabled,
            } => {
                let dis = if *disabled { " disabled" } else { "" };
                format!(
                    r#"<button id="{}" class="rs-btn {}" type="button"{}>{}</button>"#,
                    escape_html(id),
                    variant.css_class(),
                    dis,
                    escape_html(label)
                )
            }
            Self::Card {
                title,
                subtitle,
                body,
                footer,
            } => {
                let mut out = String::with_capacity(256 + title.len() + body.len());
                out.push_str(r#"<section class="rs-card"><h3 class="rs-card-title">"#);
                push_escaped(&mut out, title);
                out.push_str("</h3>");
                if let Some(sub) = subtitle {
                    out.push_str(r#"<p class="rs-card-sub">"#);
                    push_escaped(&mut out, sub);
                    out.push_str("</p>");
                }
                out.push_str(r#"<div class="rs-card-body">"#);
                push_escaped(&mut out, body);
                out.push_str("</div>");
                if let Some(ft) = footer {
                    out.push_str(r#"<footer class="rs-card-footer">"#);
                    push_escaped(&mut out, ft);
                    out.push_str("</footer>");
                }
                out.push_str("</section>");
                out
            }
            Self::Badge { label, variant } => format!(
                r#"<span class="rs-badge {}">{}</span>"#,
                variant.css_class(),
                escape_html(label)
            ),
            Self::Input {
                id,
                placeholder,
                value,
                input_type,
            } => format!(
                r#"<input id="{}" class="rs-input" type="{}" placeholder="{}" value="{}" />"#,
                escape_html(id),
                escape_html(input_type),
                escape_html(placeholder),
                escape_html(value)
            ),
            Self::Dialog {
                id,
                title,
                description,
                confirm_label,
            } => format!(
                r#"<dialog id="{}" class="rs-card"><h3 class="rs-card-title">{}</h3><p class="rs-card-sub">{}</p><form method="dialog"><button class="rs-btn rs-variant-primary" type="submit">{}</button></form></dialog>"#,
                escape_html(id),
                escape_html(title),
                escape_html(description),
                escape_html(confirm_label)
            ),
            Self::Tabs {
                id,
                tabs,
                active_index,
            } => {
                let mut btns = String::new();
                for (idx, (key, label)) in tabs.iter().enumerate() {
                    let cls = if idx == *active_index {
                        "rs-btn rs-variant-primary"
                    } else {
                        "rs-btn rs-variant-ghost"
                    };
                    btns.push_str(&format!(
                        r#"<button role="tab" data-tab="{}" aria-selected="{}" class="{}">{}</button>"#,
                        escape_html(key),
                        idx == *active_index,
                        cls,
                        escape_html(label)
                    ));
                }
                format!(
                    r#"<div id="{}" role="tablist" class="rs-tabs">{}</div>"#,
                    escape_html(id),
                    btns
                )
            }
            Self::Table { headers, rows } => {
                let mut h = String::new();
                for col in headers {
                    h.push_str("<th>");
                    push_escaped(&mut h, col);
                    h.push_str("</th>");
                }
                let mut b = String::new();
                for row in rows {
                    b.push_str("<tr>");
                    for cell in row {
                        b.push_str("<td>");
                        push_escaped(&mut b, cell);
                        b.push_str("</td>");
                    }
                    b.push_str("</tr>");
                }
                format!(
                    r#"<table class="rs-table"><thead><tr>{h}</tr></thead><tbody>{b}</tbody></table>"#
                )
            }
            Self::CommandPalette {
                placeholder,
                commands,
            } => {
                let mut items = String::new();
                for (name, shortcut) in commands {
                    items.push_str(&format!(
                        r#"<li style="display:flex;justify-content:space-between;padding:6px 4px;"><span>{}</span><kbd>{}</kbd></li>"#,
                        escape_html(name),
                        escape_html(shortcut)
                    ));
                }
                format!(
                    r#"<div class="rs-card" role="combobox"><input class="rs-input" type="search" placeholder="{}" /><ul style="list-style:none;margin:8px 0 0;padding:0;">{}</ul></div>"#,
                    escape_html(placeholder),
                    items
                )
            }
            Self::Toast {
                title,
                detail,
                variant,
            } => format!(
                r#"<div role="status" class="rs-toast" data-variant="{}"><strong>{}</strong><div style="font-size:0.8rem;opacity:0.85;">{}</div></div>"#,
                variant.css_class(),
                escape_html(title),
                escape_html(detail)
            ),
            Self::Sidebar { brand, items } => {
                let mut nav = String::new();
                for (label, href, active) in items {
                    nav.push_str(&format!(
                        r#"<a class="rs-nav-item" href="{}" data-active="{}">{}</a>"#,
                        escape_html(href),
                        active,
                        escape_html(label)
                    ));
                }
                format!(
                    r#"<aside class="rs-sidebar"><div style="font-weight:700;padding:4px 10px 10px;">{}</div>{}</aside>"#,
                    escape_html(brand),
                    nav
                )
            }
            Self::TerminalPane { title, cwd, lines } => {
                let mut body = String::new();
                for line in lines {
                    push_escaped(&mut body, line);
                    body.push('\n');
                }
                format!(
                    r#"<div class="rs-terminal"><div style="opacity:0.65;margin-bottom:6px;">{} [{}]</div><pre style="margin:0;">{}</pre></div>"#,
                    escape_html(title),
                    escape_html(cwd),
                    body.trim_end()
                )
            }
        }
    }

    pub fn render_dioxus(&self) -> String {
        match self {
            Self::Button {
                id,
                label,
                variant,
                disabled,
            } => format!(
                r#"use dioxus::prelude::*;

#[component]
pub fn SovereignButton(on_click: EventHandler<MouseEvent>) -> Element {{
    rsx! {{
        button {{
            id: "{id}",
            class: "rs-btn {cls}",
            disabled: {disabled},
            onclick: move |evt| on_click.call(evt),
            "{label}"
        }}
    }}
}}
"#,
                cls = variant.css_class(),
            ),
            Self::Card {
                title,
                subtitle,
                body,
                footer,
            } => {
                let sub_str = subtitle.as_deref().unwrap_or("");
                let foot_str = footer.as_deref().unwrap_or("");
                format!(
                    r#"use dioxus::prelude::*;

#[component]
pub fn SovereignCard() -> Element {{
    rsx! {{
        section {{ class: "rs-card",
            h3 {{ class: "rs-card-title", "{title}" }}
            p {{ class: "rs-card-sub", "{sub_str}" }}
            div {{ class: "rs-card-body", "{body}" }}
            footer {{ class: "rs-card-footer", "{foot_str}" }}
        }}
    }}
}}
"#
                )
            }
            other => {
                let ssr = other.render_html().replace('"', "\\\"");
                format!(
                    r#"use dioxus::prelude::*;

#[component]
pub fn SovereignPrimitive() -> Element {{
    rsx! {{
        div {{ dangerous_inner_html: "{ssr}" }}
    }}
}}
"#
                )
            }
        }
    }

    pub fn render_gpui(&self) -> String {
        match self {
            Self::Button {
                id,
                label,
                variant,
                disabled,
            } => format!(
                r#"use gpui::{{App, IntoElement, ParentElement, RenderOnce, Window}};
use gpui_component::{{Disableable as _, button::{{Button, ButtonVariants as _}}}};

#[derive(IntoElement)]
pub struct SovereignButtonView;

impl RenderOnce for SovereignButtonView {{
    fn render(self, _window: &mut Window, _cx: &mut App) -> impl IntoElement {{
        Button::new("{id}")
            .{method}()
            .label("{label}")
            .disabled({disabled})
    }}
}}
"#,
                method = variant.gpui_method(),
            ),
            Self::Card {
                title,
                subtitle,
                body,
                footer,
            } => {
                let sub = subtitle.as_deref().unwrap_or("");
                let ft = footer.as_deref().unwrap_or("");
                format!(
                    r#"use gpui::{{App, IntoElement, ParentElement, RenderOnce, Styled, Window, div, px}};
use gpui_component::{{ActiveTheme as _, v_flex}};

#[derive(IntoElement)]
pub struct SovereignCardView;

impl RenderOnce for SovereignCardView {{
    fn render(self, _window: &mut Window, cx: &mut App) -> impl IntoElement {{
        let theme = cx.theme();
        v_flex()
            .gap(px(6.0))
            .p(px(16.0))
            .rounded(px(12.0))
            .bg(theme.background)
            .border_1()
            .border_color(theme.border)
            .child(div().text_sm().child("{title}"))
            .child(div().text_xs().text_color(theme.muted_foreground).child("{sub}"))
            .child(div().text_sm().child("{body}"))
            .child(div().text_xs().text_color(theme.muted_foreground).child("{ft}"))
    }}
}}
"#
                )
            }
            _ => {
                let slug_comment = serde_json::to_string(self).unwrap_or_default();
                format!(
                    r#"use gpui::{{App, IntoElement, ParentElement, RenderOnce, Styled, Window, div, px}};
use gpui_component::{{ActiveTheme as _, v_flex}};

// AST Spec: {slug_comment}
#[derive(IntoElement)]
pub struct SovereignComponentView;

impl RenderOnce for SovereignComponentView {{
    fn render(self, _window: &mut Window, cx: &mut App) -> impl IntoElement {{
        let theme = cx.theme();
        v_flex()
            .p(px(12.0))
            .rounded(px(8.0))
            .bg(theme.background)
            .border_1()
            .border_color(theme.border)
            .child(div().child("rust-stack gpui-component surface"))
    }}
}}
"#
                )
            }
        }
    }
}

pub fn render_card_fast(title: &str, body: &str) -> String {
    let mut out = String::with_capacity(112 + title.len() + body.len());
    out.push_str(r#"<section class="rs-card"><h3 class="rs-card-title">"#);
    push_escaped(&mut out, title);
    out.push_str(r#"</h3><div class="rs-card-body">"#);
    push_escaped(&mut out, body);
    out.push_str("</div></section>");
    out
}

pub fn add_component_to_dir(
    slug: &str,
    target: RenderTarget,
    out_dir: &Path,
) -> Result<(PathBuf, String), String> {
    let primitive = default_primitive_for_slug(slug)?;
    let rendered = primitive.render(target);
    std::fs::create_dir_all(out_dir)
        .map_err(|e| format!("failed to create output directory {}: {e}", out_dir.display()))?;
    let clean_slug = slug.trim().replace('-', "_");
    let filename = format!("{clean_slug}.{}", target.file_extension());
    let full_path = out_dir.join(filename);
    std::fs::write(&full_path, &rendered)
        .map_err(|e| format!("failed to write component {}: {e}", full_path.display()))?;
    Ok((full_path, rendered))
}

pub fn escape_html(input: &str) -> String {
    let mut out = String::with_capacity(input.len());
    push_escaped(&mut out, input);
    out
}

fn push_escaped(out: &mut String, input: &str) {
    for ch in input.chars() {
        match ch {
            '&' => out.push_str("&amp;"),
            '<' => out.push_str("&lt;"),
            '>' => out.push_str("&gt;"),
            '"' => out.push_str("&quot;"),
            '\'' => out.push_str("&#39;"),
            _ => out.push(ch),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn renders_all_11_components_across_html_dioxus_gpui() {
        assert_eq!(REGISTRY_COMPONENTS.len(), 11);
        for spec in REGISTRY_COMPONENTS {
            let prim = default_primitive_for_slug(spec.slug).unwrap();
            let html = prim.render(RenderTarget::Html);
            let dx = prim.render(RenderTarget::Dioxus);
            let gpui = prim.render(RenderTarget::Gpui);
            assert!(!html.is_empty());
            assert!(dx.contains("rsx!"));
            assert!(gpui.contains("RenderOnce"));
        }
    }

    #[test]
    fn escapes_xss_in_fast_card() {
        let html = render_card_fast("<script>alert(1)</script>", "a & b");
        assert!(html.contains("&lt;script&gt;"));
        assert!(html.contains("a &amp; b"));
        assert!(!html.contains("<script>"));
    }
}
