//! Conformance harness: reads `conformance/upstreams.toml`, fetches each pinned
//! upstream as a `gh` tarball (no git), and writes `conformance/results/<suite>.json`.
//! M0: no runner exists yet, so every suite reports `total = 0` (docs/ROADMAP.md).

pub mod channels;
pub mod cli;

use std::collections::BTreeMap;
use std::path::Path;
use std::path::PathBuf;
use std::process::Command;

use serde::Deserialize;
use serde::Serialize;

#[derive(Debug, Deserialize)]
pub struct Upstream {
    pub repo: String,
    pub commit: String,
    pub license: String,
    pub pinned_on: String,
}

#[derive(Debug, Deserialize)]
pub struct Suite {
    pub id: String,
    pub upstream: String,
    pub paths: Vec<String>,
}

#[derive(Debug, Deserialize)]
pub struct Pins {
    pub upstream: BTreeMap<String, Upstream>,
    pub suite: Vec<Suite>,
}

#[derive(Debug, Default, Serialize, Deserialize, PartialEq)]
pub struct DirResult {
    pub total: u64,
    pub passed: u64,
}

#[derive(Debug, Serialize, Deserialize, PartialEq)]
pub struct SuiteResult {
    pub suite: String,
    pub upstream_commit: String,
    pub aphrody_commit: String,
    pub target: String,
    pub total: u64,
    pub passed: u64,
    pub failed: u64,
    pub skipped: u64,
    pub blocked: u64,
    pub duration_ms: u64,
    pub by_dir: BTreeMap<String, DirResult>,
}

impl Pins {
    pub fn parse(src: &str) -> Result<Self, String> {
        let pins: Pins = toml::from_str(src).map_err(|e| format!("upstreams.toml: {e}"))?;
        for s in &pins.suite {
            if !pins.upstream.contains_key(&s.upstream) {
                return Err(format!(
                    "suite '{}': unknown upstream '{}'",
                    s.id, s.upstream
                ));
            }
        }
        for (k, u) in &pins.upstream {
            if u.commit.len() != 40 || !u.commit.bytes().all(|b| b.is_ascii_hexdigit()) {
                return Err(format!("upstream '{k}': commit must be a full 40-hex sha"));
            }
        }
        Ok(pins)
    }

    pub fn load(root: &Path) -> Result<Self, String> {
        let p = root.join("conformance/upstreams.toml");
        let src = std::fs::read_to_string(&p).map_err(|e| format!("{}: {e}", p.display()))?;
        Self::parse(&src)
    }

    pub fn suite(&self, id: &str) -> Result<&Suite, String> {
        self.suite
            .iter()
            .find(|s| s.id == id)
            .ok_or_else(|| format!("unknown suite '{id}'"))
    }
}

fn run_cmd(cmd: &mut Command) -> Result<Vec<u8>, String> {
    let out = cmd.output().map_err(|e| format!("{cmd:?}: {e}"))?;
    if !out.status.success() {
        return Err(format!(
            "{cmd:?} failed: {}",
            String::from_utf8_lossy(&out.stderr).trim()
        ));
    }
    Ok(out.stdout)
}

/// Download the suite's upstream tarball at its pinned commit with `gh` (no git)
/// and extract only the suite paths into `conformance/upstream/<suite>/`.
pub fn fetch(root: &Path, pins: &Pins, suite: &Suite) -> Result<PathBuf, String> {
    let up = &pins.upstream[&suite.upstream];
    let base = root.join("conformance/upstream");
    let dir = base.join(&suite.id);
    let stamp = dir.join(".commit");
    if std::fs::read_to_string(&stamp).is_ok_and(|s| s.trim() == up.commit) {
        return Ok(dir);
    }
    std::fs::create_dir_all(&base).map_err(|e| e.to_string())?;
    let tgz = base.join(format!("{}.tar.gz", up.commit));
    let api = format!("repos/{}/tarball/{}", up.repo, up.commit);
    let data = run_cmd(Command::new("gh").args(["api", &api]))?;
    std::fs::write(&tgz, data).map_err(|e| e.to_string())?;
    let list = run_cmd(Command::new("tar").arg("-tzf").arg(&tgz))?;
    let prefix = String::from_utf8_lossy(&list)
        .lines()
        .next()
        .and_then(|l| l.split('/').next())
        .map(str::to_owned)
        .ok_or("empty tarball")?;
    let _ = std::fs::remove_dir_all(&dir);
    std::fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    let mut tar = Command::new("tar");
    tar.arg("-xzf")
        .arg(&tgz)
        .arg("-C")
        .arg(&dir)
        .arg("--strip-components=1");
    tar.args(suite.paths.iter().map(|p| format!("{prefix}/{p}")));
    let res = run_cmd(&mut tar);
    let _ = std::fs::remove_file(&tgz);
    res?;
    std::fs::write(&stamp, &up.commit).map_err(|e| e.to_string())?;
    Ok(dir)
}

/// Revision of this repository. Lore replaces git; until the Lore workspace is
/// wired in, the revision comes from `APHRODY_REVISION`.
fn aphrody_commit(_root: &Path) -> String {
    std::env::var("APHRODY_REVISION").unwrap_or_else(|_| "unknown".into())
}

/// Run a suite. M0 has no runner, so the result is an empty report.
pub fn run(root: &Path, pins: &Pins, suite: &Suite, target: &str) -> SuiteResult {
    SuiteResult {
        suite: suite.id.clone(),
        upstream_commit: pins.upstream[&suite.upstream].commit.clone(),
        aphrody_commit: aphrody_commit(root),
        target: target.into(),
        total: 0,
        passed: 0,
        failed: 0,
        skipped: 0,
        blocked: 0,
        duration_ms: 0,
        by_dir: BTreeMap::new(),
    }
}

pub fn write_result(root: &Path, r: &SuiteResult) -> Result<PathBuf, String> {
    let dir = root.join("conformance/results");
    std::fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    let p = dir.join(format!("{}.json", r.suite));
    let json = serde_json::to_string_pretty(r).map_err(|e| e.to_string())?;
    std::fs::write(&p, json + "\n").map_err(|e| e.to_string())?;
    Ok(p)
}

#[cfg(test)]
mod tests {
    use super::*;

    fn repo_root() -> PathBuf {
        Path::new(env!("CARGO_MANIFEST_DIR")).join("../..")
    }

    #[test]
    fn pins_file_has_eleven_suites() {
        let pins = Pins::load(&repo_root()).unwrap();
        assert_eq!(pins.suite.len(), 11);
        for s in &pins.suite {
            assert!(!s.paths.is_empty(), "{}", s.id);
            let exp = repo_root().join(format!("conformance/expected/{}.txt", s.id));
            assert!(exp.exists(), "missing {}", exp.display());
        }
    }

    #[test]
    fn rejects_branch_ref() {
        let src = r#"
[upstream.x]
repo = "a/b"
commit = "main"
license = "MIT"
pinned_on = "2026-11-12"
[[suite]]
id = "s"
upstream = "x"
paths = ["a"]
"#;
        assert!(Pins::parse(src).is_err());
    }

    #[test]
    fn empty_result_roundtrips() {
        let pins = Pins::load(&repo_root()).unwrap();
        let r = run(&repo_root(), &pins, pins.suite("bun").unwrap(), "test");
        let json = serde_json::to_string(&r).unwrap();
        assert_eq!(serde_json::from_str::<SuiteResult>(&json).unwrap(), r);
    }
}
