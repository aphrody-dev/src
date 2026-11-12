//! `ay`: the monorepo's multicall CLI. Each command forwards its arguments to the library
//! that owns the logic (archguard, xtk, depot-cli, aphrody-remote, stack-bench) or to an
//! external engine (`src-deploy`, `gamescope-rs`). See docs/NAMING.md for the command table.
//! `ay build` drives cargo itself (see [`build`]).

use clap::{Parser, Subcommand};
use std::path::PathBuf;
use std::process::Command;

pub mod build;
pub mod chromium;
mod exec;
pub mod self_update;

/// Arguments forwarded verbatim to the command's own parser (including `--help`).
#[derive(clap::Args, Debug, PartialEq)]
pub struct Rest {
    #[arg(trailing_var_arg = true, allow_hyphen_values = true)]
    pub args: Vec<String>,
}

#[derive(Parser, Debug)]
#[command(name = "ay", version, about = "Aphrody monorepo CLI", disable_help_subcommand = true)]
struct Cli {
    #[command(subcommand)]
    command: Cmd,
}

#[derive(Subcommand, Debug, PartialEq)]
pub enum Cmd {
    /// Architecture gate ARCH-001..017: check, rules, graph
    #[command(disable_help_flag = true)]
    Arch(Rest),
    /// Toolchain doctor
    #[command(disable_help_flag = true)]
    Doctor(Rest),
    /// Regenerate src.lock.json, DEPS, .repo manifest and MAINTAINERS
    #[command(disable_help_flag = true)]
    Lock(Rest),
    /// Generate governance manifests; `ay manifests verify` checks them
    #[command(disable_help_flag = true)]
    Manifests(Rest),
    /// VCS tooling: worktree, fork, slim [--all], clone, gix, forge, audit, depot_tools shims, ...
    #[command(disable_help_flag = true)]
    Git(Rest),
    /// Repository digest for LLM context
    #[command(disable_help_flag = true)]
    Ingest(Rest),
    /// Tree-sitter code graph: `ay graph <path>` builds; build, query, path, explain, mcp
    #[command(disable_help_flag = true)]
    Graph(Rest),
    /// Deploy engine (runs the Go `src-deploy` binary)
    #[command(disable_help_flag = true)]
    Deploy(Rest),
    /// Hardware and compiler benchmarks (Windows)
    #[command(disable_help_flag = true)]
    Bench(Rest),
    /// Gamescope mode (runs the `gamescope-rs` binary)
    #[command(disable_help_flag = true)]
    Scope(Rest),
    /// Pure-Rust SSH (russh): exec <host|all|a,b> -- cmd, cp, hosts, check
    #[command(disable_help_flag = true)]
    Ssh(Rest),
    /// gclient in Rust: revinfo, getdep, setdep, sync (gitoxide), hooks, root
    #[command(disable_help_flag = true)]
    Gclient(Rest),
    /// Write .gclient for a depot_tools fetch config (chromium, v8, webrtc, ...) and sync it
    #[command(disable_help_flag = true)]
    Fetch(Rest),
    /// vpython on uv: run Python in a vpython.toml / PEP 723 environment
    #[command(disable_help_flag = true)]
    Vpy(Rest),
    /// git cl on jj and Gerrit REST: upload, status, issue
    #[command(disable_help_flag = true)]
    Cl(Rest),
    /// Official CIPD client from depot_tools
    #[command(disable_help_flag = true)]
    Cipd(Rest),
    /// autoninja logic: n2 or ninja locally, upstream autoninja for Siso output directories
    #[command(disable_help_flag = true)]
    Ninja(Rest),
    /// The checkout's gn binary (buildtools/<platform>/gn)
    #[command(disable_help_flag = true)]
    Gn(Rest),
    /// Build the workspace for a cross-compilation preset (--list shows toolchain status)
    Build(build::BuildArgs),
    /// Machine profile: OS, firmware/SMBIOS, CPUID, PCI, GPUs, disks, virtualization, toolchains
    Sys(SysArgs),
    /// Install and update the toolchain from tools.toml: --check, --list, --setup
    Up(up::UpArgs),
    /// Update `ay` itself from the dist GitHub Releases (axoupdater)
    SelfUpdate(self_update::SelfUpdateArgs),
}

#[derive(clap::Args, Debug, PartialEq, Default)]
pub struct SysArgs {
    /// Full profile as JSON (schema `sys::SCHEMA_VERSION`)
    #[arg(long)]
    pub json: bool,
    /// Keep serials, UUIDs and public addresses (local use only, never agent context)
    #[arg(long)]
    pub ids: bool,
    /// Skip probing toolchain versions
    #[arg(long)]
    pub no_tools: bool,
}

/// Depot subcommands that live under `ay graph`.
const GRAPH_SUBCOMMANDS: &[&str] = &["build", "query", "path", "explain", "mcp"];

/// A resolved invocation: which library (or external program) runs and with what arguments.
#[derive(Debug, PartialEq)]
pub enum Route {
    Arch(Vec<String>),
    Xtk(Vec<String>),
    Depot(&'static str, Vec<String>),
    Bench(Vec<String>),
    External(&'static str, Vec<String>),
    Ssh(Vec<String>),
    Chromium(chromium::Tool, Vec<String>),
    Build(build::BuildArgs),
    Sys(SysArgs),
    Up(up::UpArgs),
    SelfUpdate(self_update::SelfUpdateArgs),
}

fn prefixed(head: &[&str], rest: &[String]) -> Vec<String> {
    head.iter().map(|s| s.to_string()).chain(rest.iter().cloned()).collect()
}

/// Map a parsed command to its route. Pure, so it is unit-tested without side effects.
pub fn route(cmd: Cmd) -> Route {
    match cmd {
        Cmd::Arch(r) => Route::Arch(r.args),
        Cmd::Doctor(r) => Route::Xtk(prefixed(&["doctor"], &r.args)),
        Cmd::Lock(r) => Route::Xtk(prefixed(&["lock"], &r.args)),
        Cmd::Manifests(r) => match r.args.first().map(String::as_str) {
            Some("verify") => Route::Depot("ay", prefixed(&["manifests"], &r.args[1..])),
            _ => Route::Xtk(prefixed(&["manifests"], &r.args)),
        },
        Cmd::Git(r) => {
            let first = r.args.first().map(String::as_str);
            if first == Some("slim") && r.args.iter().any(|a| a == "--all") {
                let rest: Vec<String> = r.args[1..].iter().filter(|a| *a != "--all").cloned().collect();
                Route::Xtk(prefixed(&["slim-all"], &rest))
            } else if first == Some("audit") {
                Route::Xtk(prefixed(&["audit-vcs"], &r.args[1..]))
            } else {
                Route::Depot("ay git", r.args)
            }
        }
        Cmd::Ingest(r) => Route::Depot("ay", prefixed(&["ingest"], &r.args)),
        Cmd::Graph(r) => match r.args.first().map(String::as_str) {
            Some(sub) if GRAPH_SUBCOMMANDS.contains(&sub) || sub == "--help" => {
                Route::Depot("ay", prefixed(&["graph"], &r.args))
            }
            _ => Route::Depot("ay", prefixed(&["graph", "build"], &r.args)),
        },
        Cmd::Deploy(r) => Route::External("src-deploy", r.args),
        Cmd::Bench(r) => Route::Bench(r.args),
        Cmd::Scope(r) => Route::External("gamescope-rs", r.args),
        Cmd::Ssh(r) => Route::Ssh(r.args),
        Cmd::Gclient(r) => Route::Chromium(chromium::Tool::Gclient, r.args),
        Cmd::Fetch(r) => Route::Chromium(chromium::Tool::Fetch, r.args),
        Cmd::Vpy(r) => Route::Chromium(chromium::Tool::Vpy, r.args),
        Cmd::Cl(r) => Route::Chromium(chromium::Tool::Cl, r.args),
        Cmd::Cipd(r) => Route::Chromium(chromium::Tool::Cipd, r.args),
        Cmd::Ninja(r) => Route::Chromium(chromium::Tool::Ninja, r.args),
        Cmd::Gn(r) => Route::Chromium(chromium::Tool::Gn, r.args),
        Cmd::Build(b) => Route::Build(b),
        Cmd::Sys(s) => Route::Sys(s),
        Cmd::Up(u) => Route::Up(u),
        Cmd::SelfUpdate(a) => Route::SelfUpdate(a),
    }
}

fn run_sys(a: SysArgs) -> i32 {
    let profile = sys::probe(sys::Options { skip_toolchains: a.no_tools, include_identifiers: a.ids });
    if a.json {
        match serde_json::to_string_pretty(&profile) {
            Ok(s) => println!("{s}"),
            Err(e) => {
                eprintln!("ay sys: {e}");
                return 1;
            }
        }
    } else {
        print!("{}", profile.summary());
    }
    0
}

fn run_route(route: Route) -> i32 {
    match route {
        Route::Arch(args) => archguard::cli::run("ay arch", &args),
        Route::Xtk(args) => xtk::run("ay", &args),
        Route::Depot(name, args) => depot_cli::run(name, &args),
        Route::Bench(args) => run_bench(&args),
        Route::External(program, args) => exec::run_external(program, &args),
        Route::Ssh(args) => remote::run("ay ssh", &args, &repo_root()),
        Route::Chromium(tool, args) => chromium::run(tool, &args),
        Route::Build(args) => build::run(args),
        Route::Sys(args) => run_sys(args),
        Route::Up(args) => up::run(args),
        Route::SelfUpdate(args) => self_update::run(args),
    }
}

#[cfg(windows)]
fn run_bench(args: &[String]) -> i32 {
    stack_bench::cli::run("ay bench", args)
}

#[cfg(not(windows))]
fn run_bench(_args: &[String]) -> i32 {
    eprintln!("ay bench: the benchmark suite measures Win32 APIs and only runs on Windows");
    1
}

/// Entry point: `args` excludes argv[0]. Returns the process exit code.
pub fn run(args: &[String]) -> i32 {
    let argv = std::iter::once("ay".to_string()).chain(args.iter().cloned());
    let cli = match Cli::try_parse_from(argv) {
        Ok(cli) => cli,
        Err(err) => {
            let code = if err.use_stderr() { 2 } else { 0 };
            let _ = err.print();
            return code;
        }
    };
    run_route(route(cli.command))
}

/// Repository root: `$SRC_ROOT`, else the nearest ancestor of the current directory that holds
/// `src.lock.json`, else the current directory.
pub fn repo_root() -> PathBuf {
    if let Some(root) = std::env::var_os("SRC_ROOT").filter(|v| !v.is_empty()) {
        return PathBuf::from(root);
    }
    let cwd = std::env::current_dir().unwrap_or_else(|_| PathBuf::from("."));
    cwd.ancestors()
        .find(|dir| dir.join("src.lock.json").is_file())
        .map(PathBuf::from)
        .unwrap_or(cwd)
}

/// Spawn `cmd`, inherit stdio, return its exit code (127 when it cannot start).
pub fn status_of(cmd: &mut Command) -> i32 {
    match cmd.status() {
        Ok(status) => status.code().unwrap_or(1),
        Err(err) => {
            eprintln!("ay: cannot run {:?}: {err}", cmd.get_program());
            127
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn parse(line: &str) -> Route {
        let argv = std::iter::once("ay").chain(line.split_whitespace());
        route(Cli::try_parse_from(argv).expect("parse").command)
    }

    fn v(items: &[&str]) -> Vec<String> {
        items.iter().map(|s| s.to_string()).collect()
    }

    #[test]
    fn arch_forwards_flags_and_help() {
        assert_eq!(parse("arch check --strict --root ."), Route::Arch(v(&["check", "--strict", "--root", "."])));
        assert_eq!(parse("arch --help"), Route::Arch(v(&["--help"])));
    }

    #[test]
    fn xtk_commands() {
        assert_eq!(parse("doctor"), Route::Xtk(v(&["doctor"])));
        assert_eq!(parse("lock --lock-only"), Route::Xtk(v(&["lock", "--lock-only"])));
        assert_eq!(parse("manifests"), Route::Xtk(v(&["manifests"])));
        assert_eq!(parse("manifests verify ."), Route::Depot("ay", v(&["manifests", "."])));
    }

    #[test]
    fn git_slim_all_uses_the_monorepo_pass() {
        assert_eq!(parse("git slim --all --root X"), Route::Xtk(v(&["slim-all", "--root", "X"])));
        assert_eq!(parse("git slim crates/x"), Route::Depot("ay git", v(&["slim", "crates/x"])));
        assert_eq!(parse("git audit --json"), Route::Xtk(v(&["audit-vcs", "--json"])));
        assert_eq!(parse("git worktree list ."), Route::Depot("ay git", v(&["worktree", "list", "."])));
    }

    #[test]
    fn graph_defaults_to_build() {
        assert_eq!(parse("graph src -o out"), Route::Depot("ay", v(&["graph", "build", "src", "-o", "out"])));
        assert_eq!(parse("graph query Foo ."), Route::Depot("ay", v(&["graph", "query", "Foo", "."])));
        assert_eq!(parse("ingest . -f json"), Route::Depot("ay", v(&["ingest", ".", "-f", "json"])));
    }

    #[test]
    fn external_engines() {
        assert_eq!(parse("deploy up --all"), Route::External("src-deploy", v(&["up", "--all"])));
        assert_eq!(parse("scope serve-web"), Route::External("gamescope-rs", v(&["serve-web"])));
    }

    #[test]
    fn chromium_tools() {
        use chromium::Tool;
        assert_eq!(parse("gclient revinfo --deps all"), Route::Chromium(Tool::Gclient, v(&["revinfo", "--deps", "all"])));
        assert_eq!(parse("fetch --list"), Route::Chromium(Tool::Fetch, v(&["--list"])));
        assert_eq!(parse("vpy -c pass"), Route::Chromium(Tool::Vpy, v(&["-c", "pass"])));
        assert_eq!(parse("ninja -C out/x chrome"), Route::Chromium(Tool::Ninja, v(&["-C", "out/x", "chrome"])));
        assert_eq!(parse("cipd version"), Route::Chromium(Tool::Cipd, v(&["version"])));
        assert_eq!(parse("gn gen out/x"), Route::Chromium(Tool::Gn, v(&["gen", "out/x"])));
    }

    #[test]
    fn ssh_forwards_everything() {
        assert_eq!(parse("ssh exec all -- uname -srm"), Route::Ssh(v(&["exec", "all", "--", "uname", "-srm"])));
        assert_eq!(parse("ssh --help"), Route::Ssh(v(&["--help"])));
        assert_eq!(parse("ssh cp a prd:/tmp/"), Route::Ssh(v(&["cp", "a", "prd:/tmp/"])));
    }

    #[test]
    fn build_parses_targets_and_cargo_args() {
        let Route::Build(b) = parse("build -t wasm32 --target linux-musl --release -- -p ffi") else {
            panic!("not a build route");
        };
        assert_eq!(b.targets, v(&["wasm32", "linux-musl"]));
        assert!(b.release && !b.list && !b.dry_run);
        assert_eq!(b.cargo_args, v(&["-p", "ffi"]));
        assert_eq!(run(&v(&["build", "--target", "nope-nope", "--dry-run"])), 2);
    }

    #[test]
    fn sys_flags() {
        assert_eq!(parse("sys --json --no-tools"), Route::Sys(SysArgs { json: true, ids: false, no_tools: true }));
        assert_eq!(parse("sys"), Route::Sys(SysArgs::default()));
    }

    #[test]
    fn up_and_self_update_flags() {
        let Route::Up(u) = parse("up --check just ripgrep") else { panic!("not up") };
        assert!(u.check && !u.list && !u.setup);
        assert_eq!(u.tools, v(&["just", "ripgrep"]));
        assert_eq!(parse("up"), Route::Up(up::UpArgs::default()));
        let Route::Up(u) = parse("up --setup") else { panic!("not up") };
        assert!(u.setup);
        assert_eq!(run(&v(&["up", "--check", "--list"])), 2, "conflicting flags");
        assert_eq!(run(&v(&["up", "--list", "--manifest", "no/such/tools.toml"])), 2);
        assert_eq!(parse("self-update --check"), Route::SelfUpdate(self_update::SelfUpdateArgs { check: true, version: None }));
        assert_eq!(
            parse("self-update --version 0.3.0"),
            Route::SelfUpdate(self_update::SelfUpdateArgs { check: false, version: Some("0.3.0".into()) })
        );
    }

    #[test]
    fn unknown_command_is_a_usage_error() {
        assert_eq!(run(&v(&["nope"])), 2);
    }
}
