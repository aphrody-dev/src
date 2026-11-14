//! Workstation bootstrap steps absorbed from `install.ps1` / `install.sh`: config files,
//! directory links, build steps and repository clones from `src.lock.json`.
//!
//! Every item is idempotent. `ay up --check` reports them; `ay up --bootstrap` applies them.
//! Config files are created when missing and never overwritten (drift is reported).
//!
//! Paths and arguments are templates: `~` (home), `{repo}` (repository root), `{bin}`
//! (`bin_dir`), `{config}` (`%APPDATA%` on Windows, `$XDG_CONFIG_HOME` or `~/.config`
//! elsewhere), `{exe}` (`.exe` on Windows, empty elsewhere).

use crate::manifest::{expand_home, home_dir};
use serde::Deserialize;
use std::path::{Path, PathBuf};
use std::process::Command;

#[derive(Debug, Clone, Copy, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum Os {
    Windows,
    Unix,
}

impl Os {
    pub fn matches(os: Option<Os>) -> bool {
        match os {
            None => true,
            Some(Os::Windows) => cfg!(windows),
            Some(Os::Unix) => cfg!(unix),
        }
    }
}

#[derive(Debug, Clone, Deserialize, PartialEq)]
#[serde(deny_unknown_fields)]
pub struct FileSpec {
    pub name: String,
    pub path: String,
    pub content: String,
    #[serde(default)]
    pub os: Option<Os>,
}

#[derive(Debug, Clone, Deserialize, PartialEq)]
#[serde(deny_unknown_fields)]
pub struct LinkSpec {
    pub name: String,
    /// The link to create.
    pub path: String,
    /// The existing directory it points to.
    pub target: String,
    #[serde(default)]
    pub os: Option<Os>,
}

#[derive(Debug, Clone, Deserialize, PartialEq)]
#[serde(deny_unknown_fields)]
pub struct StepSpec {
    pub name: String,
    /// argv; argv[0] is resolved through `bin_dir` and PATH.
    pub run: Vec<String>,
    #[serde(default)]
    pub cwd: Option<String>,
    /// The step is done when this path exists.
    pub creates: String,
    /// Skip (not fail) when this file is absent, e.g. `{repo}/infra/go.mod`.
    #[serde(default)]
    pub when: Option<String>,
    #[serde(default)]
    pub os: Option<Os>,
}

/// Values substituted into templates.
#[derive(Debug, Clone)]
pub struct Vars {
    pub repo: Option<PathBuf>,
    pub bin: PathBuf,
}

fn config_dir() -> PathBuf {
    let var = if cfg!(windows) {
        "APPDATA"
    } else {
        "XDG_CONFIG_HOME"
    };
    std::env::var_os(var)
        .filter(|v| !v.is_empty())
        .map(PathBuf::from)
        .unwrap_or_else(|| home_dir().join(".config"))
}

fn slash(p: &Path) -> String {
    p.display().to_string().replace('\\', "/")
}

impl Vars {
    /// Expand a template; `None` when it needs `{repo}` and there is no repository.
    pub fn expand(&self, template: &str) -> Option<String> {
        if template.contains("{repo}") && self.repo.is_none() {
            return None;
        }
        let repo = self.repo.as_deref().map(slash).unwrap_or_default();
        let s = template
            .replace("{repo}", &repo)
            .replace("{bin}", &slash(&self.bin))
            .replace("{config}", &slash(&config_dir()))
            .replace("{exe}", std::env::consts::EXE_SUFFIX);
        Some(s)
    }

    pub fn path(&self, template: &str) -> Option<PathBuf> {
        self.expand(template)
            .map(|s| expand_home(&s).components().collect())
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ItemState {
    Ok,
    /// Present but not what the manifest would write (informational).
    Differs,
    Missing,
    /// Not applicable here (other OS, no repository, `when` file absent).
    Skipped,
}

impl ItemState {
    pub fn label(self) -> &'static str {
        match self {
            ItemState::Ok => "ok",
            ItemState::Differs => "differs",
            ItemState::Missing => "missing",
            ItemState::Skipped => "skipped",
        }
    }
}

#[derive(Debug, Clone, PartialEq)]
pub struct Item {
    pub kind: &'static str,
    pub name: String,
    pub path: Option<PathBuf>,
    pub state: ItemState,
}

/// Normalize line endings so a CRLF checkout does not count as drift.
fn same_text(a: &str, b: &str) -> bool {
    a.replace("\r\n", "\n").trim_end() == b.replace("\r\n", "\n").trim_end()
}

pub fn file_state(spec: &FileSpec, vars: &Vars) -> Item {
    let path = Os::matches(spec.os)
        .then(|| vars.path(&spec.path))
        .flatten();
    let state = match (&path, Os::matches(spec.os)) {
        (_, false) | (None, _) => ItemState::Skipped,
        (Some(p), true) => match std::fs::read_to_string(p) {
            Err(_) if !p.exists() => ItemState::Missing,
            Err(_) => ItemState::Differs,
            Ok(text) => {
                let want = vars.expand(&spec.content).unwrap_or_default();
                if same_text(&text, &want) {
                    ItemState::Ok
                } else {
                    ItemState::Differs
                }
            }
        },
    };
    Item {
        kind: "file",
        name: spec.name.clone(),
        path,
        state,
    }
}

pub fn link_state(spec: &LinkSpec, vars: &Vars) -> Item {
    let path = Os::matches(spec.os)
        .then(|| vars.path(&spec.path))
        .flatten();
    let state = match &path {
        None => ItemState::Skipped,
        Some(p) if p.exists() => ItemState::Ok,
        Some(_) => ItemState::Missing,
    };
    Item {
        kind: "link",
        name: spec.name.clone(),
        path,
        state,
    }
}

pub fn step_state(spec: &StepSpec, vars: &Vars) -> Item {
    let applies = Os::matches(spec.os)
        && spec
            .when
            .as_deref()
            .is_none_or(|w| vars.path(w).is_some_and(|p| p.exists()));
    let path = applies.then(|| vars.path(&spec.creates)).flatten();
    let state = match &path {
        None => ItemState::Skipped,
        Some(p) if p.exists() => ItemState::Ok,
        Some(_) => ItemState::Missing,
    };
    Item {
        kind: "step",
        name: spec.name.clone(),
        path,
        state,
    }
}

/// Repositories in `src.lock.json` whose checkout is missing: `(key, url, path)`.
/// Lock paths are absolute on the machine that wrote the lock; they are re-rooted on `root`.
pub fn missing_repos(lock_json: &str, root: &Path) -> Vec<(String, String, PathBuf)> {
    let Ok(lock) = serde_json::from_str::<serde_json::Value>(lock_json) else {
        return vec![];
    };
    let Some(repos) = lock.get("repositories").and_then(|r| r.as_object()) else {
        return vec![];
    };
    repos
        .iter()
        .filter_map(|(key, info)| {
            let url = info.get("url")?.as_str()?;
            if !(url.starts_with("https://") || url.starts_with("git@")) {
                return None;
            }
            let path = root.join(key.replace('\\', "/"));
            (!path.exists()).then(|| (key.clone(), url.to_string(), path))
        })
        .collect()
}

fn create_link(link: &Path, target: &Path) -> Result<(), String> {
    if let Some(parent) = link.parent() {
        std::fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }
    #[cfg(windows)]
    let res = junction::create(target, link);
    #[cfg(unix)]
    let res = std::os::unix::fs::symlink(target, link);
    res.map_err(|e| format!("link {} -> {}: {e}", link.display(), target.display()))
}

/// Apply one missing item. Returns a one-line description.
pub fn apply_file(spec: &FileSpec, vars: &Vars) -> Result<String, String> {
    let path = vars.path(&spec.path).ok_or("needs the repository")?;
    let content = vars.expand(&spec.content).ok_or("needs the repository")?;
    crate::install::place_file(&path, content.as_bytes(), false)?;
    Ok(format!("wrote {}", path.display()))
}

pub fn apply_link(spec: &LinkSpec, vars: &Vars) -> Result<String, String> {
    let link = vars.path(&spec.path).ok_or("needs the repository")?;
    let target = vars.path(&spec.target).ok_or("needs the repository")?;
    if !target.is_dir() {
        return Err(format!("target {} does not exist", target.display()));
    }
    create_link(&link, &target)?;
    Ok(format!("{} -> {}", link.display(), target.display()))
}

pub fn apply_step(spec: &StepSpec, vars: &Vars) -> Result<String, String> {
    let argv: Vec<String> = spec
        .run
        .iter()
        .map(|a| vars.expand(a).ok_or("needs the repository"))
        .collect::<Result<_, _>>()?;
    let (head, rest) = argv.split_first().ok_or("empty run")?;
    let program =
        crate::probe::which(head, &vars.bin).ok_or_else(|| format!("{head} is not installed"))?;
    let mut cmd = Command::new(program);
    cmd.args(rest);
    if let Some(cwd) = &spec.cwd {
        cmd.current_dir(vars.path(cwd).ok_or("needs the repository")?);
    }
    // sccache as rustc wrapper crashes some local builds; steps never go through it.
    cmd.env("RUSTC_WRAPPER", "");
    let status = cmd.status().map_err(|e| format!("{head}: {e}"))?;
    if status.success() {
        Ok(argv.join(" "))
    } else {
        Err(format!(
            "{}: exit {}",
            argv.join(" "),
            status.code().unwrap_or(-1)
        ))
    }
}

pub fn clone_repo(url: &str, path: &Path, bin: &Path) -> Result<String, String> {
    let git = crate::probe::which("git", bin).ok_or("git is not installed")?;
    let status = Command::new(git)
        .args(["clone", "--depth=1", "--filter=blob:none", url])
        .arg(path)
        .status()
        .map_err(|e| e.to_string())?;
    if status.success() {
        Ok(format!("cloned {url}"))
    } else {
        Err(format!(
            "git clone {url}: exit {}",
            status.code().unwrap_or(-1)
        ))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn vars(dir: &Path) -> Vars {
        Vars {
            repo: Some(dir.to_path_buf()),
            bin: dir.join("bin"),
        }
    }

    #[test]
    fn templates_expand_and_need_a_repo() {
        let v = Vars {
            repo: None,
            bin: PathBuf::from("/b"),
        };
        assert_eq!(
            v.expand("{bin}/x{exe}").unwrap(),
            format!("/b/x{}", std::env::consts::EXE_SUFFIX)
        );
        assert_eq!(v.expand("{repo}/infra"), None);
        assert!(
            v.expand("{config}/jj/config.toml")
                .unwrap()
                .ends_with("/jj/config.toml")
        );
    }

    #[test]
    fn files_are_created_once_and_drift_is_reported() {
        let dir = tempfile::tempdir().unwrap();
        let v = vars(dir.path());
        let spec = FileSpec {
            name: "cfg".into(),
            path: "{repo}/cfg/config.toml".into(),
            content: "a = 1\n".into(),
            os: None,
        };
        assert_eq!(file_state(&spec, &v).state, ItemState::Missing);
        apply_file(&spec, &v).unwrap();
        assert_eq!(file_state(&spec, &v).state, ItemState::Ok);
        std::fs::write(dir.path().join("cfg/config.toml"), "a = 2\r\n").unwrap();
        assert_eq!(file_state(&spec, &v).state, ItemState::Differs);
        let other_os = FileSpec {
            os: Some(if cfg!(windows) { Os::Unix } else { Os::Windows }),
            ..spec
        };
        assert_eq!(file_state(&other_os, &v).state, ItemState::Skipped);
    }

    #[test]
    fn links_point_at_directories() {
        let dir = tempfile::tempdir().unwrap();
        std::fs::create_dir_all(dir.path().join(".agents/skills")).unwrap();
        let v = vars(dir.path());
        let spec = LinkSpec {
            name: "skills".into(),
            path: "{repo}/.claude/skills".into(),
            target: "{repo}/.agents/skills".into(),
            os: None,
        };
        assert_eq!(link_state(&spec, &v).state, ItemState::Missing);
        apply_link(&spec, &v).unwrap();
        assert_eq!(link_state(&spec, &v).state, ItemState::Ok);
        std::fs::write(dir.path().join(".agents/skills/x.md"), "x").unwrap();
        assert!(dir.path().join(".claude/skills/x.md").is_file());
    }

    #[test]
    fn steps_skip_without_their_input() {
        let dir = tempfile::tempdir().unwrap();
        let v = vars(dir.path());
        let spec = StepSpec {
            name: "src-deploy".into(),
            run: vec!["go".into()],
            cwd: None,
            creates: "{bin}/src-deploy{exe}".into(),
            when: Some("{repo}/infra/go.mod".into()),
            os: None,
        };
        assert_eq!(step_state(&spec, &v).state, ItemState::Skipped);
        std::fs::create_dir_all(dir.path().join("infra")).unwrap();
        std::fs::write(dir.path().join("infra/go.mod"), "module x").unwrap();
        assert_eq!(step_state(&spec, &v).state, ItemState::Missing);
    }

    #[test]
    fn missing_repos_are_rerooted() {
        let dir = tempfile::tempdir().unwrap();
        std::fs::create_dir_all(dir.path().join("apps/present")).unwrap();
        let lock = r#"{"repositories": {
            "apps/present": {"url": "https://google.com/a.git", "path": "C:\\src\\apps\\present"},
            "apps/absent": {"url": "https://google.com/b.git", "path": "C:\\src\\apps\\absent"},
            "local": {"url": "C:/somewhere", "path": "C:\\src\\local"}
        }}"#;
        let missing = missing_repos(lock, dir.path());
        assert_eq!(missing.len(), 1);
        assert_eq!(missing[0].0, "apps/absent");
        assert_eq!(missing[0].2, dir.path().join("apps/absent"));
    }
}
