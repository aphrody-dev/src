//! Low-level commands of `ay` for Bun and Chromium, one module each, merged into the top-level
//! command table with `#[command(flatten)]` so `lib.rs` carries a single variant for all of them:
//! - `ay docs`: Bun's docs (fork md/mdx, bun.com llms-full.txt, bun skills) in a SQLite FTS5 index;
//! - `ay flat`, `ay hash`, `ay time`: the Rust crates of the bun fork flattened into
//!   `src/bun-flat`, their resync, and the commands they back (wyhash, HdrHistogram);
//! - `ay chromium`: depot_tools, gclient, gn and autoninja of the Chromium checkout on the build
//!   host (fr1), delegated over `ay ssh` from any other machine;
//! - `ay engines`: the engines facade of `packages/chromium-bun` (V8, JavaScriptCore, Dawn, wgpu,
//!   browsers), run by bun, plus `ay engines js` and `ay engines build`;
//! - `ay agents`: the ai-os orchestrator (`orch`), run by bun;
//! - `ay steam`: Steam data of the host as JSON over `src/steam` (docs/gaming/OWNERSHIP.md).
//!
//! Plan and status: docs/ay/MIGRATION.md.

pub mod agents;
pub mod chromium_chain;
pub mod docs;
pub mod engines;
pub mod flat;
pub mod steam;

#[derive(clap::Subcommand, Debug, PartialEq)]
pub enum LowCmd {
    /// Bun docs in ay: sync (fork md/mdx, bun.com llms-full.txt, skills), bun <query> [--json], show, stats, schedule
    Docs(docs::DocsArgs),
    /// Rust crates of the bun fork flattened into src/bun-flat: list, sync, check
    Flat(flat::FlatArgs),
    /// wyhash (bun's hash) of files or stdin
    Hash(flat::HashArgs),
    /// Run a command N times and print p50/p90/p99 wall time (bun's HdrHistogram)
    Time(flat::TimeArgs),
    /// Chromium build chain on fr1: status, sync, gn, build, autoninja, toolchain (delegated over ay ssh)
    Chromium(chromium_chain::ChromiumArgs),
    /// Engines facade (V8, JavaScriptCore, Dawn, wgpu, browsers): list, matrix, js, path, install, launch, build
    #[command(disable_help_flag = true)]
    Engines(crate::Rest),
    /// ai-os orchestrator (packages/ai-os, `orch`): run <workflow.json>, plan "<goal>", lifecycle --task ... ; agent toolchain: install, sync, check, list (packages/machine/src/toolchain.ts)
    #[command(disable_help_flag = true)]
    Agents(crate::Rest),
    /// Steam data as JSON (src/steam): root, libraries, apps, vdf, compat, host, env
    Steam(steam::SteamArgs),
}

pub fn run(cmd: LowCmd) -> i32 {
    match cmd {
        LowCmd::Docs(a) => docs::run(a),
        LowCmd::Flat(a) => flat::run_flat(a),
        LowCmd::Hash(a) => flat::run_hash(a),
        LowCmd::Time(a) => flat::run_time(a),
        LowCmd::Chromium(a) => chromium_chain::run(a),
        LowCmd::Engines(r) => engines::run(&r.args),
        LowCmd::Agents(r) => agents::run(&r.args),
        LowCmd::Steam(a) => steam::run_steam(a),
    }
}
