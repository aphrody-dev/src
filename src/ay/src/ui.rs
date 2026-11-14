// SPDX-License-Identifier: Apache-2.0
//! `ay ui`: inspect shared themes, components, targets, and render canonical fusion pages.

use aphrody_ui::fusion::{
    CanonicalPage, FusionThemePreset, RenderTarget, UiKind, ecosystem_manifest,
    render_page_to_target,
};

/// Executes `ay ui <subcommand> [args...]`, returning a POSIX-style exit code.
pub fn run(args: &[String]) -> i32 {
    if args.is_empty() || matches!(args[0].as_str(), "--help" | "-h" | "help") {
        print_help();
        return 0;
    }

    let json_flag = args.iter().any(|a| a == "--json");
    match args[0].as_str() {
        "targets" => cmd_targets(json_flag),
        "presets" => cmd_presets(json_flag),
        "components" => cmd_components(json_flag),
        "manifest" => {
            let m = ecosystem_manifest();
            println!(
                "{}",
                serde_json::to_string_pretty(&m).unwrap_or_else(|_| "{}".to_owned())
            );
            0
        }
        "render" => cmd_render(&args[1..]),
        other => {
            eprintln!("ay ui: unknown subcommand `{other}`");
            print_help();
            2
        }
    }
}

fn cmd_targets(json_flag: bool) -> i32 {
    if json_flag {
        let items: Vec<_> = RenderTarget::ALL
            .iter()
            .map(|t| {
                let (w, h) = t.default_viewport();
                serde_json::json!({
                    "id": t.id(),
                    "nsh_platform": t.nsh_platform(),
                    "default_viewport": [w, h],
                })
            })
            .collect();
        println!(
            "{}",
            serde_json::to_string_pretty(&items).unwrap_or_else(|_| "[]".to_owned())
        );
    } else {
        for t in RenderTarget::ALL {
            let (w, h) = t.default_viewport();
            println!("{:<16} {:>4.0}x{:<4.0}  {:?}", t.id(), w, h, t.nsh_platform());
        }
    }
    0
}

fn cmd_presets(json_flag: bool) -> i32 {
    if json_flag {
        let items: Vec<_> = FusionThemePreset::ALL.iter().map(|p| p.spec()).collect();
        println!(
            "{}",
            serde_json::to_string_pretty(&items).unwrap_or_else(|_| "[]".to_owned())
        );
    } else {
        for p in FusionThemePreset::ALL {
            let s = p.spec();
            println!(
                "{:<12} {}  variant={:<10} mode={}  {}",
                s.id,
                s.seed_hex,
                s.variant,
                if s.default_dark { "dark" } else { "light" },
                s.display_name
            );
        }
    }
    0
}

fn cmd_components(json_flag: bool) -> i32 {
    if json_flag {
        let items: Vec<_> = UiKind::ALL
            .iter()
            .map(|c| {
                serde_json::json!({
                    "id": c.id(),
                    "aria_role": c.aria_role(),
                    "html_tag": c.html_tag(),
                })
            })
            .collect();
        println!(
            "{}",
            serde_json::to_string_pretty(&items).unwrap_or_else(|_| "[]".to_owned())
        );
    } else {
        for c in UiKind::ALL {
            println!("{:<22} role={:<12} tag=<{}>", c.id(), c.aria_role(), c.html_tag());
        }
    }
    0
}

fn cmd_render(args: &[String]) -> i32 {
    let mut page = CanonicalPage::StudioWorkspace;
    let mut target = RenderTarget::Tui;
    let mut preset = FusionThemePreset::Aphrody;
    let mut dark_override: Option<bool> = None;
    let mut width: Option<f32> = None;
    let mut height: Option<f32> = None;
    let mut json_flag = false;

    let mut i = 0usize;
    while i < args.len() {
        match args[i].as_str() {
            "--page" if i + 1 < args.len() => {
                let Some(parsed) = CanonicalPage::from_id(&args[i + 1]) else {
                    eprintln!("ay ui render: unknown page `{}`", args[i + 1]);
                    return 2;
                };
                page = parsed;
                i += 2;
            }
            "--target" if i + 1 < args.len() => {
                let Some(parsed) = RenderTarget::from_id(&args[i + 1]) else {
                    eprintln!("ay ui render: unknown target `{}`", args[i + 1]);
                    return 2;
                };
                target = parsed;
                i += 2;
            }
            "--preset" if i + 1 < args.len() => {
                let Some(parsed) = FusionThemePreset::from_id(&args[i + 1]) else {
                    eprintln!("ay ui render: unknown preset `{}`", args[i + 1]);
                    return 2;
                };
                preset = parsed;
                i += 2;
            }
            "--dark" => {
                dark_override = Some(true);
                i += 1;
            }
            "--light" => {
                dark_override = Some(false);
                i += 1;
            }
            "--width" if i + 1 < args.len() => {
                let Ok(val) = args[i + 1].parse::<f32>() else {
                    eprintln!("ay ui render: invalid width `{}`", args[i + 1]);
                    return 2;
                };
                width = Some(val);
                i += 2;
            }
            "--height" if i + 1 < args.len() => {
                let Ok(val) = args[i + 1].parse::<f32>() else {
                    eprintln!("ay ui render: invalid height `{}`", args[i + 1]);
                    return 2;
                };
                height = Some(val);
                i += 2;
            }
            "--json" => {
                json_flag = true;
                i += 1;
            }
            other => {
                eprintln!("ay ui render: unexpected argument `{other}`");
                return 2;
            }
        }
    }

    let dark = dark_override.unwrap_or_else(|| preset.spec().default_dark);
    match render_page_to_target(page, preset, dark, target, width, height) {
        Ok(frame) => {
            if json_flag {
                println!(
                    "{}",
                    serde_json::to_string_pretty(&frame).unwrap_or_else(|_| "{}".to_owned())
                );
            } else {
                print!("{}", frame.payload);
            }
            0
        }
        Err(err) => {
            eprintln!("ay ui render: {err}");
            1
        }
    }
}

fn print_help() {
    println!(
        "ay ui: unified multi-target UI framework\n\
         \n\
         Subcommands:\n\
           targets [--json]     List all 11 native render targets\n\
           presets [--json]     List all 9 synced theme presets\n\
           components [--json]  List all 23 shared UI primitives\n\
           manifest             Print fused ecosystem upstream/fork manifest\n\
           render [--page <p>] [--target <t>] [--preset <name>] [--dark|--light] [--width W] [--height H] [--json]"
    );
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn ay_ui_subcommands_succeed() {
        let s = |items: &[&str]| items.iter().map(|v| (*v).to_owned()).collect::<Vec<_>>();
        assert_eq!(run(&s(&["targets"])), 0);
        assert_eq!(run(&s(&["presets", "--json"])), 0);
        assert_eq!(run(&s(&["components"])), 0);
        assert_eq!(run(&s(&["manifest"])), 0);
        assert_eq!(
            run(&s(&[
                "render",
                "--page",
                "intelligent-terminal",
                "--target",
                "tui",
                "--preset",
                "omarchy",
                "--dark",
                "--width",
                "960",
                "--height",
                "540",
            ])),
            0
        );
        assert_eq!(run(&s(&["render", "--target", "invalid"])), 2);
    }
}
