//! Executable shims for tools that need their own directory at run time.
//!
//! A Windows symlink to `llama-cli.exe` starts the program, but the loader looks for its DLLs
//! next to the link, not the target, so the tool fails before `main`. Instead `ay up` places a
//! hard link (or copy) of the `ay` binary named after the tool, plus a `<name>.shim` file in
//! Scoop's format (`path = "C:\...\llama-cli.exe"`, optional `args = ...`). When `ay` starts
//! under a name other than `ay` and finds that file, it runs the target with the extra and the
//! given arguments and returns its exit code. Scoop's own shims read the same files.

use std::path::{Path, PathBuf};

/// The `.shim` file next to an executable.
pub fn shim_file(exe: &Path) -> PathBuf {
    exe.with_extension("shim")
}

/// Parse Scoop's shim format: `path = "..."` and an optional `args = ...` line.
pub fn parse(text: &str) -> Option<(PathBuf, Vec<String>)> {
    let mut path = None;
    let mut args = Vec::new();
    for line in text.lines() {
        let Some((k, v)) = line.split_once('=') else {
            continue;
        };
        let v = v.trim().trim_matches('"');
        match k.trim() {
            "path" => path = Some(PathBuf::from(v)),
            "args" => args = v.split_whitespace().map(str::to_string).collect(),
            _ => {}
        }
    }
    path.map(|p| (p, args))
}

/// When this process is a shim (not named `ay`, with a sibling `.shim` file), run the target
/// and return its exit code.
pub fn run_if_shim() -> Option<i32> {
    let exe = std::env::current_exe().ok()?;
    let stem = exe.file_stem()?.to_str()?;
    if stem.eq_ignore_ascii_case("ay") {
        return None;
    }
    let (target, extra) = parse(&std::fs::read_to_string(shim_file(&exe)).ok()?)?;
    let status = std::process::Command::new(&target)
        .args(extra)
        .args(std::env::args_os().skip(1))
        .status();
    Some(match status {
        Ok(s) => s.code().unwrap_or(1),
        Err(e) => {
            eprintln!("{stem}: {}: {e}", target.display());
            127
        }
    })
}

/// Install `dest` as a shim for `target`: hard link of the running `ay` (copy when the link
/// fails, e.g. across volumes) and the `.shim` file.
pub fn write(target: &Path, dest: &Path) -> Result<(), String> {
    let me = std::env::current_exe().map_err(|e| e.to_string())?;
    let _ = std::fs::remove_file(dest);
    if std::fs::hard_link(&me, dest).is_err() {
        std::fs::copy(&me, dest).map_err(|e| format!("shim {}: {e}", dest.display()))?;
    }
    std::fs::write(
        shim_file(dest),
        format!("path = \"{}\"\n", target.display()),
    )
    .map_err(|e| format!("shim {}: {e}", dest.display()))
}

/// Whether `target` needs a shim rather than a symlink: on Windows, when DLLs sit next to it.
pub fn needed(target: &Path) -> bool {
    cfg!(windows)
        && target
            .parent()
            .and_then(|d| std::fs::read_dir(d).ok())
            .is_some_and(|rd| {
                rd.flatten().any(|e| {
                    e.path()
                        .extension()
                        .is_some_and(|x| x.eq_ignore_ascii_case("dll"))
                })
            })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn scoop_format() {
        let (p, a) = parse("path = \"C:/t/llama-cli.exe\"\nargs = -ngl 99\n").unwrap();
        assert_eq!(p, PathBuf::from("C:/t/llama-cli.exe"));
        assert_eq!(a, vec!["-ngl", "99"]);
        assert!(parse("args = x\n").is_none());
    }
}
