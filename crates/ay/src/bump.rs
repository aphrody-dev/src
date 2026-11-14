//! `ay bump`: unified monorepo auto-bump orchestrator combining:
//! - `bun pm` (`bun pm pkg get`, `bun outdated`, `bun update`, `bun pm hash`) for JS/TS & catalog pins,
//! - `depot_tools` rs (`depot_gclient::eval`, `depot_gclient::deps`, `depot_gclient::edit::DepsEditor`) for Chromium `DEPS` & `third_party/` pins,
//! - `crates.io` (`cargo update --dry-run` / `cargo update`) for Cargo workspace dependencies,
//! - `ay bun bump` for Bun runtime toolchain pins (`src.lock.json`, `tools.toml`, `package.json`, workflows).

use clap::Args;
use serde_json::{Value, json};
use std::collections::BTreeSet;
use std::path::Path;
use std::process::{Command, Stdio};

#[derive(Args, Debug, PartialEq, Default, Clone)]
pub struct BumpArgs {
    /// Apply the proposed bumps (default: dry-run proposal only)
    #[arg(long)]
    pub write: bool,
    /// Print the report as JSON
    #[arg(long)]
    pub json: bool,
    /// Restrict to comma-separated subsystems: bun, pm, depot, cargo (default: all)
    #[arg(long, value_name = "LIST")]
    pub only: Option<String>,
    /// Target Bun runtime version (passed to `ay bun bump --to`)
    #[arg(long, value_name = "VERSION")]
    pub to: Option<String>,
    /// Check remote git HEADs for DEPS entries via `git ls-remote`
    #[arg(long)]
    pub remotes: bool,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum Scope {
    Bun,
    Pm,
    Depot,
    Cargo,
}

pub fn parse_scopes(only: Option<&str>) -> BTreeSet<Scope> {
    let mut set = BTreeSet::new();
    match only {
        None => {
            set.insert(Scope::Bun);
            set.insert(Scope::Pm);
            set.insert(Scope::Depot);
            set.insert(Scope::Cargo);
        }
        Some(raw) => {
            for part in raw.split(',').map(|s| s.trim().to_ascii_lowercase()) {
                match part.as_str() {
                    "bun" => {
                        set.insert(Scope::Bun);
                    }
                    "pm" | "bun-pm" | "npm" => {
                        set.insert(Scope::Pm);
                    }
                    "depot" | "gclient" | "deps" | "chromium" => {
                        set.insert(Scope::Depot);
                    }
                    "cargo" | "crates" | "crates.io" => {
                        set.insert(Scope::Cargo);
                    }
                    _ => {}
                }
            }
        }
    }
    set
}

impl Ord for Scope {
    fn cmp(&self, other: &Self) -> std::cmp::Ordering {
        self.rank().cmp(&other.rank())
    }
}

impl PartialOrd for Scope {
    fn partial_cmp(&self, other: &Self) -> Option<std::cmp::Ordering> {
        Some(self.cmp(other))
    }
}

impl Scope {
    fn rank(&self) -> u8 {
        match self {
            Scope::Bun => 0,
            Scope::Pm => 1,
            Scope::Depot => 2,
            Scope::Cargo => 3,
        }
    }
}

fn run_capture(program: &str, args: &[&str], cwd: &Path) -> (i32, String, String) {
    match Command::new(program)
        .args(args)
        .current_dir(cwd)
        .stdin(Stdio::null())
        .output()
    {
        Ok(o) => (
            o.status.code().unwrap_or(1),
            String::from_utf8_lossy(&o.stdout).into_owned(),
            String::from_utf8_lossy(&o.stderr).into_owned(),
        ),
        Err(e) => (127, String::new(), e.to_string()),
    }
}

/// Inspect and optionally bump JS/TS catalog & workspace packages via `bun pm`.
pub fn bump_bun_pm(root: &Path, write: bool) -> Value {
    let (_code_pkg, pkg_out, _pkg_err) =
        run_capture("bun", &["pm", "pkg", "get", "workspaces.catalog"], root);
    let catalog: Value = serde_json::from_str(pkg_out.trim()).unwrap_or(Value::Null);
    let catalog_count = catalog.as_object().map(|m| m.len()).unwrap_or(0);

    let (code_outdated, out_stdout, out_stderr) = run_capture("bun", &["outdated"], root);
    let outdated_lines: Vec<String> = out_stdout
        .lines()
        .map(str::trim)
        .filter(|l| !l.is_empty() && !l.starts_with("bun outdated"))
        .map(str::to_string)
        .collect();

    let (update_code, update_out) = if write {
        let (c, so, se) = run_capture("bun", &["update"], root);
        let (_hc, h_out, _) = run_capture("bun", &["pm", "hash"], root);
        (c, format!("{so}{se}\nlockfile_hash={}", h_out.trim()))
    } else {
        (0, String::new())
    };

    json!({
        "tool": "bun pm",
        "catalog_entries": catalog_count,
        "outdated_exit": code_outdated,
        "outdated": outdated_lines,
        "outdated_stderr": out_stderr.trim(),
        "written": write && update_code == 0,
        "update_exit": update_code,
        "update_output": update_out.trim(),
    })
}

/// Inspect and optionally sync/bump `DEPS` pins via Pure-Rust `depot_tools` (`depot_gclient`).
pub fn bump_depot_deps(root: &Path, write: bool, check_remotes: bool) -> Value {
    let deps_path = root.join("DEPS");
    let Ok(content) = std::fs::read_to_string(&deps_path) else {
        return json!({
            "tool": "depot-gclient",
            "present": false,
            "deps_count": 0,
            "updates": [],
            "written": false,
        });
    };

    let parsed = match depot_gclient::deps::parse(&content, "DEPS", None, None) {
        Ok(scope) => scope
            .get("deps")
            .and_then(depot_gclient::Value::as_dict)
            .cloned()
            .unwrap_or_default(),
        Err(e) => {
            return json!({
                "tool": "depot-gclient",
                "present": true,
                "error": e.to_string(),
                "written": false,
            });
        }
    };

    let lock_json: Value = std::fs::read(root.join("src.lock.json"))
        .ok()
        .and_then(|b| serde_json::from_slice(&b).ok())
        .unwrap_or(Value::Null);
    let lock_repos = lock_json.get("repositories").and_then(Value::as_object);

    let mut updates = Vec::new();
    let mut editor = write.then(|| depot_gclient::edit::DepsEditor::new(content.as_str(), "DEPS", None));

    for (path, entry) in parsed.iter() {
        let Some(dep) = entry.as_dict() else {
            continue;
        };
        if dep.get("dep_type").and_then(depot_gclient::Value::as_str) != Some("git") {
            continue;
        }
        // Standardized git deps carry `url` = "<repo>@<revision>" (gclient `Dependency.ParseDepsFile`).
        let Some(url_rev) = dep.get("url").and_then(depot_gclient::Value::as_str) else {
            continue;
        };
        let (url, pinned) = url_rev.rsplit_once('@').unwrap_or((url_rev, ""));
        let mut target_rev = lock_repos
            .and_then(|m| m.get(path))
            .and_then(|r| r.get("commit"))
            .and_then(Value::as_str)
            .map(str::to_string);

        if check_remotes {
            let (rc, out, _) = run_capture("git", &["ls-remote", url, "HEAD"], root);
            if rc == 0 {
                if let Some(sha) = out.split_whitespace().next() {
                    target_rev = Some(sha.to_string());
                }
            }
        }

        if let Some(next) = target_rev {
            if !next.is_empty() && !pinned.is_empty() && next != pinned {
                if let Some(ed) = editor.as_mut() {
                    let _ = ed.set_revision(path, &next);
                }
                updates.push(json!({
                    "path": path,
                    "url": url,
                    "from": pinned,
                    "to": next,
                }));
            }
        }
    }

    let mut wrote = false;
    if write && !updates.is_empty() {
        if let Some(ed) = editor {
            if std::fs::write(&deps_path, ed.content()).is_ok() {
                wrote = true;
            }
        }
    }

    json!({
        "tool": "depot-gclient",
        "present": true,
        "deps_count": parsed.len(),
        "updates": updates,
        "written": wrote,
    })
}

/// Check or bump `Cargo.lock` against `crates.io` (`cargo update --dry-run` / `cargo update`).
pub fn bump_cargo_crates(root: &Path, write: bool) -> Value {
    let args: &[&str] = if write {
        &["update"]
    } else {
        &["update", "--dry-run"]
    };
    let (code, stdout, stderr) = run_capture("cargo", args, root);
    let changes: Vec<String> = stderr
        .lines()
        .chain(stdout.lines())
        .map(str::trim)
        .filter(|l| l.starts_with("Updating ") || l.starts_with("Adding ") || l.starts_with("Removing "))
        .map(str::to_string)
        .collect();

    json!({
        "tool": "cargo (crates.io)",
        "exit": code,
        "changes": changes,
        "written": write && code == 0,
    })
}

pub fn run(a: BumpArgs) -> i32 {
    let root = crate::repo_root();
    let scopes = parse_scopes(a.only.as_deref());
    let mut report = serde_json::Map::new();
    let mut exit_code = 0;

    if scopes.contains(&Scope::Bun) {
        let bun_args = crate::bun::BumpArgs {
            to: a.to.clone(),
            write: a.write,
            json: true,
        };
        let mut gh = crate::bun::watch::Gh::new();
        let target = match &bun_args.to {
            Some(v) => Ok(v.trim_start_matches("bun-v").trim_start_matches('v').to_string()),
            None => gh
                .get("repos/oven-sh/bun/releases/latest", None)
                .map(|g| {
                    crate::bun::str_of(&g.body.unwrap_or_default(), "tag_name")
                        .trim_start_matches("bun-v")
                        .to_string()
                }),
        };
        match target {
            Ok(to) => {
                let release = gh
                    .get(&format!("repos/oven-sh/bun/releases/tags/bun-v{to}"), None)
                    .ok()
                    .and_then(|g| g.body);
                let mut out = crate::bun::bump::proposals_json(&root, &to, release.as_ref());
                if a.write {
                    let edits: Vec<crate::bun::bump::Edit> = out["edits"]
                        .as_array()
                        .into_iter()
                        .flatten()
                        .map(|e| crate::bun::bump::Edit {
                            file: crate::bun::str_of(e, "file").into(),
                            line: e["line"].as_u64().unwrap_or(0) as usize,
                            before: crate::bun::str_of(e, "before").into(),
                            after: crate::bun::str_of(e, "after").into(),
                        })
                        .collect();
                    if crate::bun::bump::apply(&root, &edits).is_ok() {
                        out["written"] = json!(true);
                    }
                }
                report.insert("bun".into(), out);
            }
            Err(e) => {
                report.insert("bun".into(), json!({ "error": e }));
                exit_code = 1;
            }
        }
    }

    if scopes.contains(&Scope::Pm) {
        report.insert("bun_pm".into(), bump_bun_pm(&root, a.write));
    }

    if scopes.contains(&Scope::Depot) {
        report.insert("depot_gclient".into(), bump_depot_deps(&root, a.write, a.remotes));
    }

    if scopes.contains(&Scope::Cargo) {
        report.insert("cargo".into(), bump_cargo_crates(&root, a.write));
    }

    let root_val = Value::Object(report);
    if a.json {
        println!("{}", serde_json::to_string_pretty(&root_val).unwrap_or_default());
    } else {
        if let Some(b) = root_val.get("bun") {
            print!("{}", crate::bun::bump::render(b));
        }
        if let Some(pm) = root_val.get("bun_pm") {
            println!(
                "bun-pm    catalog={} outdated={} written={}",
                pm["catalog_entries"],
                pm["outdated"].as_array().map(|v| v.len()).unwrap_or(0),
                pm["written"]
            );
        }
        if let Some(dp) = root_val.get("depot_gclient") {
            println!(
                "depot     deps={} updates={} written={}",
                dp["deps_count"],
                dp["updates"].as_array().map(|v| v.len()).unwrap_or(0),
                dp["written"]
            );
        }
        if let Some(cg) = root_val.get("cargo") {
            println!(
                "cargo     changes={} written={}",
                cg["changes"].as_array().map(|v| v.len()).unwrap_or(0),
                cg["written"]
            );
        }
    }
    exit_code
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn scope_parsing_covers_all_and_aliases() {
        assert_eq!(parse_scopes(None).len(), 4);
        assert_eq!(parse_scopes(Some("pm,depot")), BTreeSet::from([Scope::Pm, Scope::Depot]));
        assert_eq!(parse_scopes(Some("crates.io,gclient")), BTreeSet::from([Scope::Cargo, Scope::Depot]));
    }
}
