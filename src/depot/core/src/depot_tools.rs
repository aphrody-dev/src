//! Locate depot_tools and run its upstream entry points (the ones that stay upstream: `cipd`,
//! `gn`, `siso`, `autoninja`, `fetch`, `gclient`, `repo`) by full path, so they work without
//! depot_tools on `PATH`.

use serde::{Deserialize, Serialize};
use std::path::{Path, PathBuf};
use std::process::Command;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DepotToolsInfo {
    pub root_path: Option<PathBuf>,
    pub gclient_found: bool,
    pub repo_found: bool,
    pub cipd_found: bool,
    pub autoninja_found: bool,
    pub siso_found: bool,
    pub fetch_found: bool,
    pub git_cache_dir: Option<PathBuf>,
}

pub struct DepotTools;

/// The monorepo root: `$SRC_ROOT`, else the nearest ancestor of the working directory holding
/// src.lock.json. Same on Windows and Linux (no hardcoded `C:\src`).
pub fn src_root() -> Option<PathBuf> {
    std::env::var_os("SRC_ROOT")
        .filter(|v| !v.is_empty())
        .map(PathBuf::from)
        .or_else(|| {
            let cwd = std::env::current_dir().ok()?;
            cwd.ancestors()
                .find(|d| d.join("src.lock.json").is_file())
                .map(Path::to_path_buf)
        })
}

/// The user's home directory: `%USERPROFILE%` on Windows, `$HOME` elsewhere.
pub fn home_dir() -> Option<PathBuf> {
    let key = if cfg!(windows) { "USERPROFILE" } else { "HOME" };
    std::env::var_os(key).filter(|v| !v.is_empty()).map(PathBuf::from)
}

/// Candidate roots, most specific first: `$DEPOT_TOOLS_PATH`, `<$SRC_ROOT or the nearest
/// ancestor with src.lock.json>/third_party/depot_tools`, a `PATH` entry holding gclient.py,
/// `C:\depot_tools`.
fn candidates() -> Vec<PathBuf> {
    let mut out = Vec::new();
    if let Some(p) = std::env::var_os("DEPOT_TOOLS_PATH") {
        out.push(PathBuf::from(p));
    }
    if let Some(r) = src_root() {
        out.push(r.join("third_party").join("depot_tools"));
    }
    out.push(Path::new(env!("SRC_ROOT")).join("third_party/depot_tools"));
    if let Some(path) = std::env::var_os("PATH") {
        out.extend(std::env::split_paths(&path));
    }
    if cfg!(windows) {
        out.push(PathBuf::from(r"C:\depot_tools"));
    }
    out
}

impl DepotTools {
    /// The depot_tools checkout to use, if any.
    pub fn root() -> Option<PathBuf> {
        candidates()
            .into_iter()
            .find(|p| p.join("gclient.py").is_file())
    }

    pub fn detect() -> DepotToolsInfo {
        let root_path = Self::root();
        let has = |names: &[&str]| {
            root_path
                .as_ref()
                .is_some_and(|r| names.iter().any(|n| r.join(n).exists()))
        };
        DepotToolsInfo {
            gclient_found: has(&["gclient.bat", "gclient"]),
            repo_found: has(&["repo", "repo_launcher"]),
            cipd_found: has(&["cipd.bat", "cipd"]),
            autoninja_found: has(&["autoninja.bat", "autoninja"]),
            siso_found: has(&["siso.bat", "siso.py"]),
            fetch_found: has(&["fetch.bat", "fetch.py"]),
            git_cache_dir: git_cache_dir().filter(|p| p.exists()),
            root_path,
        }
    }

    /// The wrapper script for `tool` inside depot_tools (`<tool>.bat` on Windows).
    pub fn wrapper(tool: &str) -> Option<PathBuf> {
        let root = Self::root()?;
        let names: &[String] = if cfg!(windows) {
            &[format!("{tool}.bat"), tool.to_string()]
        } else {
            &[tool.to_string()]
        };
        names.iter().map(|n| root.join(n)).find(|p| p.is_file())
    }

    /// Run a depot_tools entry point by full path with inherited stdio; returns its exit code.
    pub fn run_passthrough(tool: &str, args: &[String]) -> Result<i32, String> {
        let wrapper = Self::wrapper(tool)
            .ok_or_else(|| format!("{tool}: depot_tools not found (set DEPOT_TOOLS_PATH)"))?;
        let mut cmd = if cfg!(windows)
            && wrapper
                .extension()
                .is_some_and(|e| e.eq_ignore_ascii_case("bat"))
        {
            let mut c = Command::new("cmd");
            c.arg("/C").arg(&wrapper);
            c
        } else {
            Command::new(&wrapper)
        };
        // depot_tools wrappers must not update themselves under us.
        cmd.args(args).env("DEPOT_TOOLS_UPDATE", "0");
        let status = cmd
            .status()
            .map_err(|e| format!("Failed to execute {}: {e}", wrapper.display()))?;
        Ok(status.code().unwrap_or(1))
    }
}

/// `$GIT_CACHE_PATH`, else depot_tools' default `%LOCALAPPDATA%\depot_tools\git_cache`.
pub fn git_cache_dir() -> Option<PathBuf> {
    if let Some(p) = std::env::var_os("GIT_CACHE_PATH") {
        return Some(PathBuf::from(p));
    }
    std::env::var_os("LOCALAPPDATA").map(|a| PathBuf::from(a).join("depot_tools").join("git_cache"))
}
