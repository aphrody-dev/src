//! Locate installed tools and read their versions.

use crate::manifest::{Layout, Manifest, SourceKind, Tool};
use crate::version;
use std::cmp::Ordering;
use std::path::{Path, PathBuf};
use std::process::{Command, Stdio};

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum State {
    /// Installed at the pinned version.
    Ok,
    /// Installed and newer than the pin (left alone).
    Ahead,
    /// Installed, older than the pin.
    Outdated,
    Missing,
    /// Installed but the version could not be read.
    Unknown,
    /// No asset for this platform.
    Unsupported,
}

impl State {
    pub fn label(self) -> &'static str {
        match self {
            State::Ok => "ok",
            State::Ahead => "ahead",
            State::Outdated => "outdated",
            State::Missing => "missing",
            State::Unknown => "unknown",
            State::Unsupported => "n/a",
        }
    }

    /// Whether `ay up` acts on it and `ay up --check` fails on it.
    pub fn needs_action(self) -> bool {
        matches!(self, State::Outdated | State::Missing)
    }
}

#[derive(Debug, Clone, PartialEq)]
pub struct Probe {
    pub name: String,
    pub want: String,
    pub have: Option<String>,
    pub path: Option<PathBuf>,
    pub state: State,
    /// Other copies on PATH and same-name shims that win for cmd/PowerShell. Informational.
    pub notes: Vec<String>,
}

/// Every file on `dirs` that a shell could run as `name`, in resolution order, deduplicated
/// by canonical path (WinGet `Links` are symlinks into the package directory).
pub fn all_hits(name: &str, dirs: &[PathBuf]) -> Vec<PathBuf> {
    let mut seen = std::collections::BTreeSet::new();
    let mut hits = Vec::new();
    for dir in dirs {
        if let Some(hit) = find_in(name, std::slice::from_ref(dir)) {
            let key = std::fs::canonicalize(&hit).unwrap_or_else(|_| hit.clone());
            if seen.insert(key) {
                hits.push(hit);
            }
        }
    }
    hits
}

/// Notes for `chosen`: a different file that wins plain name resolution (a `.cmd` shim
/// shadowing the real `.exe`), and further copies later on PATH.
pub fn path_notes(chosen: &Path, hits: &[PathBuf]) -> Vec<String> {
    let same = |a: &Path, b: &Path| {
        std::fs::canonicalize(a)
            .ok()
            .zip(std::fs::canonicalize(b).ok())
            .is_some_and(|(x, y)| x == y)
            || a == b
    };
    let mut notes = Vec::new();
    if let Some(first) = hits.first().filter(|f| !same(f, chosen)) {
        notes.push(format!(
            "shadowed by {} for cmd/PowerShell callers",
            first.display()
        ));
    }
    for other in hits.iter().skip(1).filter(|h| !same(h, chosen)) {
        notes.push(format!("duplicate at {}", other.display()));
    }
    notes
}

/// Search `dirs` for `name`, honouring `PATHEXT` on Windows (`gcloud` -> `gcloud.cmd`).
pub fn find_in(name: &str, dirs: &[PathBuf]) -> Option<PathBuf> {
    find_with(name, dirs, false)
}

/// Like [`find_in`], but with `exe_only` a Windows lookup only accepts `<name>.exe`: a binary
/// tool must not be confused with an unrelated `.cmd` shim of the same name.
pub fn find_with(name: &str, dirs: &[PathBuf], exe_only: bool) -> Option<PathBuf> {
    let exts: Vec<String> = if cfg!(windows) && exe_only {
        vec![".exe".into()]
    } else if cfg!(windows) {
        let pathext = std::env::var("PATHEXT").unwrap_or_else(|_| ".COM;.EXE;.BAT;.CMD".into());
        pathext
            .split(';')
            .filter(|e| !e.is_empty())
            .map(|e| e.to_ascii_lowercase())
            .collect()
    } else {
        vec![String::new()]
    };
    for dir in dirs {
        for ext in &exts {
            let candidate = dir.join(format!("{name}{ext}"));
            if candidate.is_file() {
                return Some(candidate);
            }
        }
    }
    None
}

/// `bin_dir` first (what `ay up` manages), then `PATH`.
pub fn search_dirs(bin_dir: &Path) -> Vec<PathBuf> {
    let mut dirs = vec![bin_dir.to_path_buf()];
    if let Some(path) = std::env::var_os("PATH") {
        dirs.extend(std::env::split_paths(&path));
    }
    dirs
}

pub fn which(name: &str, bin_dir: &Path) -> Option<PathBuf> {
    find_in(name, &search_dirs(bin_dir))
}

/// Run `argv` and return stdout + stderr. argv[0] is `program` when given, else resolved
/// through `bin_dir` and PATH.
pub fn run_capture(argv: &[String], bin_dir: &Path, program: Option<&Path>) -> Option<String> {
    let (head, rest) = argv.split_first()?;
    let program = program
        .map(Path::to_path_buf)
        .or_else(|| which(head, bin_dir))
        .unwrap_or_else(|| PathBuf::from(head));
    let out = Command::new(program)
        .args(rest)
        .stdin(Stdio::null())
        .output()
        .ok()?;
    let mut text = String::from_utf8_lossy(&out.stdout).into_owned();
    text.push_str(&String::from_utf8_lossy(&out.stderr));
    Some(text)
}

/// Bun's global package directory: `$BUN_INSTALL/install/global/node_modules`.
pub fn bun_global_modules() -> PathBuf {
    let base = std::env::var_os("BUN_INSTALL")
        .filter(|v| !v.is_empty())
        .map(PathBuf::from)
        .unwrap_or_else(|| crate::manifest::home_dir().join(".bun"));
    base.join("install").join("global").join("node_modules")
}

fn bun_package_version(package: &str) -> Option<String> {
    let manifest = bun_global_modules().join(package).join("package.json");
    let json: serde_json::Value =
        serde_json::from_str(&std::fs::read_to_string(manifest).ok()?).ok()?;
    json.get("version")?.as_str().map(str::to_string)
}

pub fn classify(want: &str, have: Option<&str>, found: bool) -> State {
    match (found, have) {
        (false, _) => State::Missing,
        (true, None) => State::Unknown,
        (true, Some(h)) => match version::compare(h, want) {
            Ordering::Less => State::Outdated,
            Ordering::Equal => State::Ok,
            Ordering::Greater => State::Ahead,
        },
    }
}

pub fn probe(tool: &Tool, manifest: &Manifest, platform: &str) -> Probe {
    let bin_dir = manifest.bin_dir();
    // Single-binary tools are real executables; tree and Bun tools may be .cmd launchers.
    let exe_only = tool.layout == Layout::Bin && tool.source != SourceKind::Bun;
    let path = find_with(tool.probe_name(), &search_dirs(&bin_dir), exe_only);
    let argv = tool.verify_argv();
    let program = path
        .as_deref()
        .filter(|_| argv.first().map(String::as_str) == Some(tool.probe_name()));
    let have = match (tool.source, &path) {
        // Bun global packages record their version; some (MCP servers) never exit on --version.
        (SourceKind::Bun, _) => tool.package.as_deref().and_then(bun_package_version),
        (_, Some(_)) => run_capture(&argv, &bin_dir, program)
            .as_deref()
            .and_then(version::extract),
        (_, None) => None,
    };
    let found = path.is_some() || (tool.source == SourceKind::Bun && have.is_some());
    let notes = path
        .as_deref()
        .map(|p| path_notes(p, &all_hits(tool.probe_name(), &search_dirs(&bin_dir))))
        .unwrap_or_default();
    let state = if !tool.supports(platform) && !found {
        State::Unsupported
    } else {
        classify(&tool.version, have.as_deref(), found)
    };
    Probe {
        name: tool.name.clone(),
        want: tool.version.clone(),
        have,
        path,
        state,
        notes,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn classification() {
        assert_eq!(classify("1.2.0", None, false), State::Missing);
        assert_eq!(classify("1.2.0", None, true), State::Unknown);
        assert_eq!(classify("1.2.0", Some("1.1.9"), true), State::Outdated);
        assert_eq!(classify("1.2.0", Some("1.2.0"), true), State::Ok);
        assert_eq!(classify("1.2.0", Some("1.3.0"), true), State::Ahead);
        assert!(State::Missing.needs_action() && State::Outdated.needs_action());
        assert!(!State::Ahead.needs_action() && !State::Unknown.needs_action());
    }

    #[test]
    fn notes_report_shadows_and_duplicates() {
        let a = tempfile::tempdir().unwrap();
        let b = tempfile::tempdir().unwrap();
        let exe = |d: &Path| d.join(if cfg!(windows) { "tool.exe" } else { "tool" });
        std::fs::write(exe(a.path()), b"1").unwrap();
        std::fs::write(exe(b.path()), b"2").unwrap();
        let dirs = vec![a.path().to_path_buf(), b.path().to_path_buf()];
        let hits = all_hits("tool", &dirs);
        assert_eq!(hits.len(), 2);
        let notes = path_notes(&exe(a.path()), &hits);
        assert_eq!(notes.len(), 1);
        assert!(notes[0].starts_with("duplicate at"), "{notes:?}");
        let shadowed = path_notes(&exe(b.path()), &hits);
        assert!(shadowed[0].starts_with("shadowed by"), "{shadowed:?}");
    }

    #[test]
    fn finds_files_in_given_dirs() {
        let dir = tempfile::tempdir().unwrap();
        let name = if cfg!(windows) {
            "fake-tool.exe"
        } else {
            "fake-tool"
        };
        std::fs::write(dir.path().join(name), b"").unwrap();
        let found = find_in("fake-tool", &[dir.path().to_path_buf()]).expect("found");
        assert_eq!(
            found
                .file_name()
                .unwrap()
                .to_string_lossy()
                .to_ascii_lowercase(),
            name
        );
        assert!(find_in("absent-tool", &[dir.path().to_path_buf()]).is_none());
    }
}
