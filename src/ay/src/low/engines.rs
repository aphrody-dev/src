//! `ay engines`: the engines facade of `packages/chromium-bun/src/engines` (one registry for
//! browsers, automation tools, JS engines and WebGPU implementations), run in place by bun. `ay`
//! adds two views on top of it and keeps no engine list of its own:
//! - `ay engines js [--json]`: the rows of `matrix` whose role is `js-engine` or `gpu`
//!   (V8, JavaScriptCore, Dawn, wgpu as registered there);
//! - `ay engines build <id>...`: engines the registry builds on fr1 from the Chromium checkout
//!   (`install.via = build, host = fr1`) are built by `ay chromium build` with their ninja target.
//!
//! Everything else (`list`, `matrix`, `channels`, `path`, `install`, `launch`) goes to the facade.

use std::process::Command;

const FACADE: &str = "packages/chromium-bun/src/engines/cli.ts";

/// Ninja targets of the Chromium checkout for engines built on fr1 (`//v8:d8`, Dawn's end2end
/// suite, which links Dawn and Tint).
pub fn chromium_target(id: &str) -> Option<&'static str> {
    match id {
        "v8" => Some("d8"),
        "dawn" => Some("dawn_end2end_tests"),
        _ => None,
    }
}

fn facade_status(args: &[String]) -> i32 {
    let root = crate::repo_root();
    let cli = root.join(FACADE);
    if !cli.is_file() {
        eprintln!("ay engines: {} not found (set SRC_ROOT to the monorepo root)", cli.display());
        return 127;
    }
    crate::status_of(Command::new(crate::exec::locate("bun")).arg(cli).args(args).current_dir(&root).env("SRC_ROOT", &root))
}

/// Rows of the facade's `matrix --json` whose role is a JS engine or a GPU backend.
pub fn js_rows(matrix: &serde_json::Value) -> Vec<serde_json::Value> {
    matrix
        .as_array()
        .into_iter()
        .flatten()
        .filter(|r| matches!(r["role"].as_str(), Some("js-engine" | "gpu")))
        .cloned()
        .collect()
}

fn js(json: bool) -> i32 {
    let text = match rt::combo::facade(&["matrix", "--json"]) {
        Ok(t) => t,
        Err(e) => {
            eprintln!("ay engines js: {e}");
            return 1;
        }
    };
    let matrix: serde_json::Value = match serde_json::from_str(&text) {
        Ok(v) => v,
        Err(e) => {
            eprintln!("ay engines js: matrix --json: {e}");
            return 1;
        }
    };
    let rows = js_rows(&matrix);
    if json {
        println!("{}", serde_json::to_string_pretty(&rows).unwrap_or_default());
        return 0;
    }
    let s = |v: &serde_json::Value| v.as_str().unwrap_or("-").to_string();
    for r in &rows {
        println!(
            "{:<16} {:<9} {:<8} latest {:<14} installed {:<14} {}",
            s(&r["id"]),
            s(&r["role"]),
            s(&r["language"]),
            s(&r["latest"]),
            s(&r["installed"]),
            s(&r["third_party"])
        );
    }
    0
}

fn build(ids: &[String]) -> i32 {
    let mut targets = Vec::new();
    let mut passthrough = Vec::new();
    for a in ids {
        if a.starts_with('-') {
            passthrough.push(a.clone());
        } else if let Some(t) = chromium_target(a) {
            targets.push(t.to_string());
        } else {
            eprintln!("ay engines build: {a} is not built from the Chromium checkout (v8, dawn); see `ay engines list`");
            return 2;
        }
    }
    if targets.is_empty() {
        eprintln!("ay engines build: give v8 and/or dawn");
        return 2;
    }
    let argv: Vec<String> =
        std::iter::once("chromium".to_string()).chain(passthrough).chain(std::iter::once("build".to_string())).chain(targets).collect();
    crate::run(&argv)
}

pub fn run(args: &[String]) -> i32 {
    match args.first().map(String::as_str) {
        Some("js") => js(args.iter().any(|a| a == "--json")),
        Some("build") => build(&args[1..]),
        Some("--help" | "-h" | "help") => {
            println!(
                "ay engines: browsers, automation, JS engines and WebGPU from one registry ({FACADE})\n\n\
                 Usage: ay engines <list|matrix|channels|path|install|launch|js|build> [args]\n\n\
                 Examples:\n  ay engines list --json\n  ay engines matrix\n  ay engines js            V8, JavaScriptCore, Dawn, wgpu\n  \
                 ay engines path chrome@beta\n  ay engines install chrome@stable\n  ay engines launch chrome@stable --port 9222\n  \
                 ay engines build v8 dawn --detach   d8 and dawn_end2end_tests on fr1 (ay chromium build)"
            );
            0
        }
        _ => facade_status(args),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn js_view_filters_by_role() {
        let m = serde_json::json!([
            {"id": "v8", "role": "js-engine"}, {"id": "dawn", "role": "gpu"},
            {"id": "chrome@stable", "role": "browser"}, {"id": "wgpu", "role": "gpu"}
        ]);
        let ids: Vec<_> = js_rows(&m).iter().map(|r| r["id"].as_str().unwrap().to_string()).collect();
        assert_eq!(ids, ["v8", "dawn", "wgpu"]);
    }

    #[test]
    fn chromium_targets() {
        assert_eq!(chromium_target("v8"), Some("d8"));
        assert_eq!(chromium_target("dawn"), Some("dawn_end2end_tests"));
        assert_eq!(chromium_target("wgpu"), None);
        assert_eq!(build(&["wgpu".into()]), 2);
    }
}
