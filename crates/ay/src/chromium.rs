//! Chromium tooling: the depot_tools entry points rewritten in Rust (`ay gclient`, `ay fetch`,
//! `ay vpy`) and the upstream binaries `ay` locates and runs (`ay cipd`, `ay ninja`, `ay gn`).
//! Plan and status: docs/DEPOT_TOOLS_RUST.md.

/// Which tool a `Route::Chromium` runs.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Tool {
    Gclient,
    Fetch,
    Vpy,
    Cipd,
    Ninja,
    Gn,
}

pub fn run(tool: Tool, args: &[String]) -> i32 {
    match tool {
        Tool::Gclient => depot_gclient::cli::run_gclient("ay gclient", args),
        Tool::Fetch => depot_gclient::cli::run_fetch("ay fetch", args),
        Tool::Vpy => depot_vpython::run("ay vpy", args),
        Tool::Cipd => {
            let a: Vec<&str> = args.iter().map(String::as_str).collect();
            depot_gclient::cli::run_cipd(&a)
        }
        Tool::Ninja => depot_core::build_tools::run_ninja(args),
        Tool::Gn => depot_core::build_tools::run_gn(args),
    }
}
