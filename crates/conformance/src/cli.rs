//! `ay conformance` (absorbed from the former `aphrody` binary of crates/aphrody-cli):
//!
//! - `ay conformance [--fetch] [suite...]`: write `conformance/results/<suite>.json` (all suites when none);
//! - `ay conformance channels [platform]`: write `third_party/chrome-channels.toml` (Chrome Stable/Beta/Dev/Canary).

use std::path::Path;

pub const USAGE: &str =
    "usage: ay conformance [--fetch] [suite...]\n       ay conformance channels [platform]\n";

/// Run against the repository `root`; returns the text to print, or an error message (exit 2).
pub fn run(root: &Path, args: &[String]) -> Result<String, String> {
    match args.first().map(String::as_str) {
        Some("-h" | "--help") => Ok(USAGE.to_string()),
        Some("channels") => channels(root, &args[1..]),
        _ => suites(root, args),
    }
}

fn suites(root: &Path, args: &[String]) -> Result<String, String> {
    let pins = crate::Pins::load(root)?;
    let fetch = args.iter().any(|a| a == "--fetch");
    let ids: Vec<&str> = args
        .iter()
        .map(String::as_str)
        .filter(|a| *a != "--fetch")
        .collect();
    if let Some(bad) = ids.iter().find(|a| a.starts_with('-')) {
        return Err(format!("error: unknown argument '{bad}'\n\n{USAGE}"));
    }
    let selected: Vec<&crate::Suite> = if ids.is_empty() {
        pins.suite.iter().collect()
    } else {
        ids.iter()
            .map(|id| pins.suite(id))
            .collect::<Result<_, _>>()?
    };
    let target = format!("{}-{}", std::env::consts::ARCH, std::env::consts::OS);
    let mut out = String::new();
    for s in selected {
        if fetch {
            crate::fetch(root, &pins, s)?;
        }
        let r = crate::run(root, &pins, s, &target);
        let p = crate::write_result(root, &r)?;
        out += &format!("{} {}/{} -> {}\n", r.suite, r.passed, r.total, p.display());
    }
    Ok(out)
}

fn channels(root: &Path, args: &[String]) -> Result<String, String> {
    let platform = match args.first().map(String::as_str) {
        Some("-h" | "--help") => return Ok(USAGE.to_string()),
        Some(p) if p.starts_with('-') => {
            return Err(format!("error: unknown argument '{p}'\n\n{USAGE}"));
        }
        Some(p) => p,
        None => "Linux",
    };
    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map_err(|e| e.to_string())?
        .as_secs();
    let toml = crate::channels::fetch_toml(platform, &format!("unix:{now}"))?;
    // Tracked pin file (third_party/ holds the pins of upstream projects, ARCHITECTURE.md §4).
    let path = root.join("third_party/chrome-channels.toml");
    if let Some(dir) = path.parent() {
        std::fs::create_dir_all(dir).map_err(|e| format!("{}: {e}", dir.display()))?;
    }
    std::fs::write(&path, &toml).map_err(|e| format!("{}: {e}", path.display()))?;
    Ok(toml)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn help_and_unknown_flag() {
        let root = Path::new(".");
        assert_eq!(run(root, &["--help".into()]).unwrap(), USAGE);
        assert!(run(root, &["--nope".into()]).is_err());
        assert_eq!(
            run(root, &["channels".into(), "--help".into()]).unwrap(),
            USAGE
        );
        assert!(run(root, &["channels".into(), "--nope".into()]).is_err());
    }
}
