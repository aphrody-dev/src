//! Chromium tooling: the depot_tools entry points rewritten in Rust (`ay gclient`, `ay fetch`,
//! `ay vpy`, `ay cipd ensure`) and the upstream binaries `ay` locates and runs (other `ay cipd`
//! subcommands, `ay ninja`, `ay gn`).
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
    Cl,
}

pub fn run(tool: Tool, args: &[String]) -> i32 {
    match tool {
        Tool::Gclient => depot_gclient::cli::run_gclient("ay gclient", args),
        Tool::Fetch => depot_gclient::cli::run_fetch("ay fetch", args),
        Tool::Vpy => depot_vpython::run("ay vpy", args),
        // `ensure` in Rust (src/depot/cipd), other subcommands through the Go client.
        Tool::Cipd => depot_cipd::cli::run(args, &|a| {
            depot_core::DepotTools::run_passthrough("cipd", a).unwrap_or_else(|e| {
                eprintln!("cipd: {e}");
                127
            })
        }),
        Tool::Ninja => depot_core::build_tools::run_ninja(args),
        Tool::Gn => depot_core::build_tools::run_gn(args),
        Tool::Cl => depot_gclient::cl::run_cl("ay cl", args),
    }
}
