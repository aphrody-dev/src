//! `ay bun`: upstream watch of oven-sh/bun for the aphrody-labs/bun fork.
//!
//! `ay bun watch` polls GitHub (main, pull requests, `windows` issues, contributor and Windows
//! build docs, stable and canary releases with per-asset digests), the bun.com blog feed, npm
//! (`bun`, `@oven/bun-*`) and crates.io, diffs it against the state of the previous run, and
//! crosses the fork's own commits (`upstream/main..origin/main` in third_party/bun) with the
//! upstream commits, pull requests and issues touching the same files. `ay bun bump` proposes
//! the Bun version bumps (src.lock.json, tools.toml, package.json, workflows); `--write` applies.
//! `ay bun watch --install-schedule` registers the watch with Task Scheduler or a systemd user
//! timer. State: `~/.local/share/ay/bun-watch/state.json` (same data root as `ay ai`).

pub mod bump;
pub mod install;
pub mod schedule;
pub mod watch;

use serde_json::Value;
use std::io::IsTerminal;
use std::path::PathBuf;

const ABOUT: &str = "Upstream watch of oven-sh/bun for the aphrody-labs/bun fork";

const WATCH_EXAMPLES: &str = "\
Examples:
  ay bun watch                          what changed upstream since the last run
  ay bun watch --json                   same report as JSON (schema bun-watch/1)
  ay bun watch --apply                  also list the version bumps it would make
  ay bun watch --dry-run                report without saving the state
  ay bun watch --install-schedule       run every 6 h (Task Scheduler / systemd user timer)
  ay bun watch --install-schedule --every 2
  ay bun watch --remove-schedule";

const INSTALL_EXAMPLES: &str = "\
Examples:
  ay bun install --fork                 last green `aphrody windows` run of aphrody-labs/bun main
  ay bun install --fork --run 43352418966
  ay bun install --fork --activate      also make it ~/.bun/bin/bun (old one kept as bun.previous)";

const BUMP_EXAMPLES: &str = "\
Examples:
  ay bun bump                 propose the bumps to the latest stable release
  ay bun bump --to 1.4.5      propose a given version
  ay bun bump --write         apply them (src.lock.json, tools.toml, package.json, workflows)";

#[derive(clap::Args, Debug, PartialEq, Default, Clone)]
pub struct BunArgs {
    #[command(subcommand)]
    pub cmd: Option<BunCmd>,
}

#[derive(clap::Subcommand, Debug, PartialEq, Clone)]
pub enum BunCmd {
    /// Report what changed in oven-sh/bun since the last run and what touches the fork's patches
    #[command(after_help = WATCH_EXAMPLES)]
    Watch(WatchArgs),
    /// Propose the Bun version bumps in the monorepo; --write applies them
    #[command(after_help = BUMP_EXAMPLES)]
    Bump(BumpArgs),
    /// Install the aphrody-labs/bun CI build as bun@fork (ay rt), sha256-checked; --activate puts it in ~/.bun/bin
    #[command(after_help = INSTALL_EXAMPLES)]
    Install(InstallArgs),
}

#[derive(clap::Args, Debug, PartialEq, Default, Clone)]
pub struct WatchArgs {
    /// Print the report as JSON
    #[arg(long)]
    pub json: bool,
    /// Also propose the version bumps (`ay bun bump`), without writing them
    #[arg(long)]
    pub apply: bool,
    /// Do not save the state (the next run reports the same changes again)
    #[arg(long)]
    pub dry_run: bool,
    /// State file (default ~/.local/share/ay/bun-watch/state.json, or $AY_BUN_WATCH_STATE)
    #[arg(long, value_name = "FILE")]
    pub state: Option<PathBuf>,
    /// Fork checkout (default <repo>/third_party/bun); read only, never fetched
    #[arg(long, value_name = "DIR")]
    pub checkout: Option<PathBuf>,
    /// Register the watch as a scheduled task (Windows) or systemd user timer (Linux)
    #[arg(long, conflicts_with_all = ["remove_schedule", "json", "apply"])]
    pub install_schedule: bool,
    /// Remove the scheduled task or timer
    #[arg(long, conflicts_with_all = ["json", "apply"])]
    pub remove_schedule: bool,
    /// Hours between scheduled runs
    #[arg(long, value_name = "HOURS", default_value_t = 6, value_parser = clap::value_parser!(u32).range(1..=168))]
    pub every: u32,
}

#[derive(clap::Args, Debug, PartialEq, Default, Clone)]
pub struct BumpArgs {
    /// Target version (default: the latest stable release of oven-sh/bun)
    #[arg(long, value_name = "VERSION")]
    pub to: Option<String>,
    /// Apply the edits (default: only list them)
    #[arg(long)]
    pub write: bool,
    /// Print the proposals as JSON
    #[arg(long)]
    pub json: bool,
}

#[derive(clap::Args, Debug, PartialEq, Default, Clone)]
pub struct InstallArgs {
    /// The fork's build (the only source: stable and canary come from `ay rt install bun@<v>`)
    #[arg(long, required = true)]
    pub fork: bool,
    /// Workflow run id (default: the last successful run on main)
    #[arg(long, value_name = "ID")]
    pub run: Option<u64>,
    /// Copy it to ~/.bun/bin/bun, keeping the previous binary as bun.previous
    #[arg(long)]
    pub activate: bool,
    /// Print the result as JSON
    #[arg(long)]
    pub json: bool,
}

pub fn run(a: BunArgs) -> i32 {
    match a.cmd {
        Some(BunCmd::Watch(w)) if w.install_schedule || w.remove_schedule => schedule::run(&w),
        Some(BunCmd::Watch(w)) => watch::run(&w),
        Some(BunCmd::Bump(b)) => bump::run(&b),
        Some(BunCmd::Install(i)) => install::run(&i),
        None => {
            println!("{ABOUT}\n\nUsage: ay bun <command>\n\nCommands:\n  watch   what changed upstream since the last run (--json, --apply, --install-schedule)\n  bump    propose the Bun version bumps (--write applies)\n  install --fork   install the fork's CI build as bun@fork (--activate)\n\nRun `ay bun <command> --help` for its options and examples.");
            0
        }
    }
}

// ----------------------------------------------------------------------------------------------
// Shared helpers

fn home() -> PathBuf {
    std::env::var_os(if cfg!(windows) { "USERPROFILE" } else { "HOME" })
        .filter(|v| !v.is_empty())
        .map(PathBuf::from)
        .unwrap_or_else(|| PathBuf::from("."))
}

/// `~/.local/share/ay/bun-watch` (the data root `ay ai` and `ay up` use).
pub fn state_dir() -> PathBuf {
    home().join(".local").join("share").join("ay").join("bun-watch")
}

pub fn state_path(given: &Option<PathBuf>) -> PathBuf {
    given
        .clone()
        .or_else(|| std::env::var_os("AY_BUN_WATCH_STATE").filter(|v| !v.is_empty()).map(PathBuf::from))
        .unwrap_or_else(|| state_dir().join("state.json"))
}

/// Colors only on a terminal, never with `NO_COLOR` set (https://no-color.org).
fn color(stream_is_tty: bool) -> bool {
    stream_is_tty && std::env::var_os("NO_COLOR").is_none_or(|v| v.is_empty())
}

pub fn warn(msg: &str) {
    if color(std::io::stderr().is_terminal()) {
        eprintln!("\x1b[33mwarn\x1b[0m: {msg}");
    } else {
        eprintln!("warn: {msg}");
    }
}

pub fn error(msg: &str) {
    if color(std::io::stderr().is_terminal()) {
        eprintln!("\x1b[31merror\x1b[0m: {msg}");
    } else {
        eprintln!("error: {msg}");
    }
}

/// Dim text on a terminal (secondary columns of the report).
pub fn dim(s: &str) -> String {
    if color(std::io::stdout().is_terminal()) { format!("\x1b[2m{s}\x1b[0m") } else { s.to_string() }
}

pub fn bold(s: &str) -> String {
    if color(std::io::stdout().is_terminal()) { format!("\x1b[1m{s}\x1b[0m") } else { s.to_string() }
}

/// UTC now as `YYYY-MM-DDTHH:MM:SSZ` (GitHub's format, so strings compare in time order).
pub fn iso_now() -> String {
    let secs = std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).map(|d| d.as_secs()).unwrap_or(0);
    iso_from_unix(secs)
}

pub fn iso_from_unix(secs: u64) -> String {
    let days = (secs / 86_400) as i64;
    let rem = secs % 86_400;
    // Civil date from days since 1970-01-01 (Howard Hinnant's algorithm).
    let z = days + 719_468;
    let era = z.div_euclid(146_097);
    let doe = z - era * 146_097;
    let yoe = (doe - doe / 1460 + doe / 36_524 - doe / 146_096) / 365;
    let doy = doe - (365 * yoe + yoe / 4 - yoe / 100);
    let mp = (5 * doy + 2) / 153;
    let d = doy - (153 * mp + 2) / 5 + 1;
    let m = if mp < 10 { mp + 3 } else { mp - 9 };
    let y = yoe + era * 400 + i64::from(m <= 2);
    format!("{y:04}-{m:02}-{d:02}T{:02}:{:02}:{:02}Z", rem / 3600, rem % 3600 / 60, rem % 60)
}

/// `bun-v1.4.4` -> `[1, 4, 4]`; None for canary or anything else.
pub fn parse_version(s: &str) -> Option<Vec<u64>> {
    let v = s.trim().trim_start_matches("bun-v").trim_start_matches('v');
    let parts: Option<Vec<u64>> = v.split('.').map(|p| p.parse().ok()).collect();
    parts.filter(|p| p.len() == 3)
}

pub fn str_of<'a>(v: &'a Value, key: &str) -> &'a str {
    v.get(key).and_then(Value::as_str).unwrap_or("")
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn iso_dates() {
        assert_eq!(iso_from_unix(0), "1970-01-01T00:00:00Z");
        // 2026-11-13T00:32:35Z (canary bun-windows-x64.zip republish, GitHub API).
        assert_eq!(iso_from_unix(1_794_529_955), "2026-11-13T00:32:35Z");
        assert_eq!(iso_from_unix(951_782_400), "2000-02-29T00:00:00Z");
    }

    #[test]
    fn versions() {
        assert_eq!(parse_version("bun-v1.4.4"), Some(vec![1, 4, 4]));
        assert_eq!(parse_version("1.10.0"), Some(vec![1, 10, 0]));
        assert_eq!(parse_version("canary"), None);
        assert!(parse_version("1.4.10") > parse_version("1.4.9"));
    }

    #[derive(clap::Parser)]
    struct T {
        #[command(flatten)]
        a: BunArgs,
    }

    #[test]
    fn install_routing() {
        use clap::Parser;
        let t = T::try_parse_from(["bun", "install", "--fork", "--run", "42", "--activate"]).unwrap();
        assert_eq!(t.a.cmd, Some(BunCmd::Install(InstallArgs { fork: true, run: Some(42), activate: true, json: false })));
        assert!(T::try_parse_from(["bun", "install"]).is_err(), "--fork is required");
        assert!(T::try_parse_from(["bun", "install", "--fork", "--run", "x"]).is_err());
    }
}
