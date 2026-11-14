//! `ay ninja` and `ay gn`: the build-tool choice autoninja and gn.py make, without Python.
//!
//! Siso, GN and the Clang prebuilts stay upstream binaries; for local Ninja builds `n2` (the
//! Rust Ninja) is used when it is on `PATH`, else `ninja`.

use crate::DepotTools;
use std::path::{Path, PathBuf};
use std::process::Command;

/// The source root of an output directory: the nearest ancestor holding `.gn`.
pub fn source_root(dir: &Path) -> Option<PathBuf> {
    let dir = dir.canonicalize().ok()?;
    dir.ancestors()
        .find(|d| d.join(".gn").is_file())
        .map(Path::to_path_buf)
}

/// `use_siso` / `use_remoteexec` as written in `args.gn` (`None` when unset).
fn gn_bool(args_gn: &str, key: &str) -> Option<bool> {
    let mut v = None;
    for line in args_gn.lines() {
        let line = line.split('#').next().unwrap_or_default();
        if let Some((k, val)) = line.split_once('=')
            && k.trim() == key
        {
            match val.trim() {
                "true" => v = Some(true),
                "false" => v = Some(false),
                _ => {}
            }
        }
    }
    v
}

/// autoninja's decision: `use_siso` in args.gn, else the project default (`.sisoenv` plus
/// `use_siso = true` in `.gn` or `build_with_chromium = true` in gclient_args.gni, or an output
/// directory that already has `.siso_deps`), unless the directory is a Ninja one.
pub fn use_siso(output_dir: &Path) -> bool {
    let args = std::fs::read_to_string(output_dir.join("args.gn")).unwrap_or_default();
    if let Some(v) = gn_bool(&args, "use_siso") {
        return v;
    }
    let Some(root) = source_root(output_dir) else {
        return false;
    };
    if !root.join("build/config/siso/.sisoenv").exists() {
        return false;
    }
    let dot_gn = std::fs::read_to_string(root.join(".gn")).unwrap_or_default();
    let default = gn_bool(&dot_gn, "use_siso") == Some(true)
        || std::fs::read_to_string(root.join("build/config/gclient_args.gni"))
            .is_ok_and(|s| s.contains("build_with_chromium = true"))
        || output_dir.join(".siso_deps").exists();
    default && !output_dir.join(".ninja_deps").exists()
}

/// `$AY_NINJA`, else `n2` on PATH, else `ninja`.
pub fn ninja_program() -> PathBuf {
    if let Some(p) = std::env::var_os("AY_NINJA") {
        return PathBuf::from(p);
    }
    find_in_path("n2")
        .unwrap_or_else(|| find_in_path("ninja").unwrap_or_else(|| PathBuf::from("ninja")))
}

pub fn find_in_path(name: &str) -> Option<PathBuf> {
    let exts: &[&str] = if cfg!(windows) {
        &[".exe", ".cmd", ".bat", ""]
    } else {
        &[""]
    };
    std::env::split_paths(&std::env::var_os("PATH")?)
        .flat_map(|d| exts.iter().map(move |e| d.join(format!("{name}{e}"))))
        .find(|p| p.is_file())
}

/// The `-C <dir>` of a Ninja command line.
pub fn output_dir(args: &[String]) -> PathBuf {
    let mut it = args.iter();
    while let Some(a) = it.next() {
        if a == "-C" {
            return it
                .next()
                .map(PathBuf::from)
                .unwrap_or_else(|| PathBuf::from("."));
        }
        if let Some(d) = a.strip_prefix("-C") {
            return PathBuf::from(d);
        }
    }
    PathBuf::from(".")
}

fn status(cmd: &mut Command) -> i32 {
    match cmd.status() {
        Ok(s) => s.code().unwrap_or(1),
        Err(e) => {
            eprintln!("ay: cannot run {:?}: {e}", cmd.get_program());
            127
        }
    }
}

/// `ay ninja <ninja args>`: Siso output directories go to upstream autoninja (Siso and its
/// remote-execution flags stay upstream); everything else runs n2/ninja directly.
pub fn run_ninja(args: &[String]) -> i32 {
    let out = output_dir(args);
    if use_siso(&out) {
        return DepotTools::run_passthrough("autoninja", args).unwrap_or_else(|e| {
            eprintln!("ay ninja: {e}");
            127
        });
    }
    status(Command::new(ninja_program()).args(args))
}

fn platform_dir() -> &'static str {
    if cfg!(windows) {
        "win"
    } else if cfg!(target_os = "macos") {
        if cfg!(target_arch = "aarch64") {
            "mac_arm64"
        } else {
            "mac"
        }
    } else if cfg!(target_arch = "aarch64") {
        "linux64-arm64"
    } else {
        "linux64"
    }
}

/// gn.py's `FindGnTool`: `buildtools/<platform>/gn/gn`, then `buildtools/<platform>/gn`, then
/// `third_party/gn/gn` under the source root of `start`.
pub fn gn_path(start: &Path) -> Option<PathBuf> {
    let root = source_root(start)?;
    let exe = std::env::consts::EXE_SUFFIX;
    let bt = root.join("buildtools").join(platform_dir());
    [
        bt.join("gn").join(format!("gn{exe}")),
        bt.join(format!("gn{exe}")),
        root.join("third_party/gn").join(format!("gn{exe}")),
    ]
    .into_iter()
    .find(|p| p.is_file())
}

/// `ay gn <args>`: the checkout's CIPD-managed gn binary.
pub fn run_gn(args: &[String]) -> i32 {
    let cwd = std::env::current_dir().unwrap_or_else(|_| PathBuf::from("."));
    match gn_path(&cwd) {
        Some(gn) => status(Command::new(gn).args(args)),
        None => {
            eprintln!(
                "ay gn: no gn binary under buildtools/{} of a source root (.gn) above {}",
                platform_dir(),
                cwd.display()
            );
            1
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn args_gn_flags() {
        let a = "is_debug = false\nuse_siso = true # comment\n# use_siso = false\n";
        assert_eq!(gn_bool(a, "use_siso"), Some(true));
        assert_eq!(gn_bool(a, "use_remoteexec"), None);
        assert_eq!(
            output_dir(&["-C".into(), "out/x".into(), "chrome".into()]),
            PathBuf::from("out/x")
        );
        assert_eq!(output_dir(&["-Cout/y".into()]), PathBuf::from("out/y"));
    }

    #[test]
    fn chromium_gn_binary() {
        let src = Path::new(env!("SRC_ROOT")).join("third_party/chromium/src");
        if !src.join(".gn").is_file() {
            return eprintln!("skip: no chromium checkout");
        }
        assert_eq!(
            source_root(&src.join("base")).unwrap(),
            src.canonicalize().unwrap()
        );
        // buildtools/<platform>/gn comes from CIPD; it exists after a gclient sync.
        if let Some(gn) = gn_path(&src) {
            assert!(gn.starts_with(src.canonicalize().unwrap()));
        }
    }
}
