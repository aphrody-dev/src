//! Dependency resolution and materialization into `apm_modules/`.
//!
//! Breadth-first walk of `dependencies.apm` (shallowest declaration wins,
//! cycles cut by unique key), mirroring `deps/apm_resolver.py`. Local paths
//! are copied to `apm_modules/_local/<name>` (transitive ones under a
//! `sha256(anchored_path)[:12]` parent slot, as in `materialization.py`).
//! Git sources are fetched by shelling out to the `git` CLI (`gix` is not
//! vendored in this workspace).

use std::collections::HashSet;
use std::collections::VecDeque;
use std::fs;
use std::path::Component;
use std::path::Path;
use std::path::PathBuf;
use std::process::Command;

use anyhow::Context;
use anyhow::Result;
use anyhow::bail;

use crate::hash;
use crate::lockfile::LockFile;
use crate::manifest::Manifest;
use crate::reference::DependencyReference;

#[derive(Debug, Clone)]
pub struct ResolvedPackage {
    pub reference: DependencyReference,
    pub key: String,
    pub depth: i64,
    /// `repo_url` of the declaring package (None for direct deps).
    pub resolved_by: Option<String>,
    /// Declaring package's unique key (transitive local deps).
    pub declaring_parent: Option<String>,
    /// Project-relative normalized path of a transitive local dep.
    pub anchored_local_path: Option<String>,
    pub install_path: PathBuf,
    /// Original source dir (local) or materialized dir (git).
    pub source_dir: PathBuf,
    pub manifest: Option<Manifest>,
    pub resolved_commit: Option<String>,
    pub is_dev: bool,
}

impl ResolvedPackage {
    pub fn name(&self) -> String {
        self.manifest
            .as_ref()
            .map_or_else(|| self.reference.package_dir_name(), |m| m.name.clone())
    }
    /// `PackageType` detection from the materialized tree.
    pub fn package_type(&self) -> &'static str {
        let p = &self.install_path;
        let apm = p.join("apm.yml").is_file();
        let skill = p.join("SKILL.md").is_file();
        match (apm, skill) {
            (true, true) => "hybrid",
            (true, false) => "apm_package",
            (false, true) => "claude_skill",
            _ if p.join("skills").is_dir() => "skill_bundle",
            _ if p.join("hooks").join("hooks.json").is_file() => "hook_package",
            _ if p.join("plugin.json").is_file() || p.join(".claude-plugin").is_dir() => {
                "marketplace_plugin"
            }
            _ => "invalid",
        }
    }
}

/// Lexically normalize a path (no filesystem access), posix separators.
pub fn normalize_rel(p: &Path) -> String {
    let mut parts: Vec<String> = Vec::new();
    for c in p.components() {
        match c {
            Component::CurDir => {}
            Component::ParentDir => {
                if parts.last().is_some_and(|l| l != "..") {
                    parts.pop();
                } else {
                    parts.push("..".into());
                }
            }
            Component::Normal(s) => parts.push(s.to_string_lossy().into_owned()),
            Component::RootDir | Component::Prefix(_) => {
                parts.push(c.as_os_str().to_string_lossy().replace('\\', "/"));
            }
        }
    }
    parts.join("/")
}

fn expand_home(p: &str) -> PathBuf {
    if let Some(rest) = p.strip_prefix("~/").or_else(|| p.strip_prefix("~\\"))
        && let Some(home) = std::env::var_os("HOME").or_else(|| std::env::var_os("USERPROFILE"))
    {
        return PathBuf::from(home).join(rest);
    }
    PathBuf::from(p)
}

/// Copy a package tree, skipping `.git`, `apm_modules`, symlinks and Python bytecode caches.
pub fn copy_tree(src: &Path, dst: &Path) -> Result<()> {
    if dst.exists() {
        fs::remove_dir_all(dst).with_context(|| format!("clearing {}", dst.display()))?;
    }
    fs::create_dir_all(dst)?;
    fn walk(src: &Path, dst: &Path, top: bool) -> Result<()> {
        for e in fs::read_dir(src)?.flatten() {
            let ft = e.file_type()?;
            let name = e.file_name();
            let n = name.to_string_lossy();
            if ft.is_symlink()
                || n == ".git"
                || n == "__pycache__"
                || (top && (n == "apm_modules" || n == hash::PIN_MARKER))
            {
                continue;
            }
            let to = dst.join(&name);
            if ft.is_dir() {
                fs::create_dir_all(&to)?;
                walk(&e.path(), &to, false)?;
            } else if ft.is_file() {
                fs::copy(e.path(), &to)?;
            }
        }
        Ok(())
    }
    walk(src, dst, true)
}

fn git(args: &[&str], cwd: Option<&Path>) -> Result<String> {
    let mut cmd = Command::new("git");
    cmd.args(args).env("GIT_TERMINAL_PROMPT", "0");
    if let Some(c) = cwd {
        cmd.current_dir(c);
    }
    let out = cmd
        .output()
        .context("running git (is it installed and on PATH?)")?;
    if !out.status.success() {
        bail!(
            "git {} failed: {}",
            args.join(" "),
            String::from_utf8_lossy(&out.stderr).trim()
        );
    }
    Ok(String::from_utf8_lossy(&out.stdout).trim().to_owned())
}

fn looks_like_sha(r: &str) -> bool {
    (7..=40).contains(&r.len()) && r.bytes().all(|c| c.is_ascii_hexdigit())
}

/// Fetch `url` at `reference` (or a pinned `commit`) into `dest`; returns the HEAD commit.
pub fn git_fetch(
    url: &str,
    reference: Option<&str>,
    commit: Option<&str>,
    dest: &Path,
) -> Result<String> {
    if dest.exists() {
        fs::remove_dir_all(dest)?;
    }
    if let Some(p) = dest.parent() {
        fs::create_dir_all(p)?;
    }
    let d = dest.to_string_lossy().into_owned();
    match (commit, reference) {
        (Some(c), _) => {
            git(&["init", "-q", &d], None)?;
            git(&["remote", "add", "origin", url], Some(dest))?;
            if git(&["fetch", "-q", "--depth", "1", "origin", c], Some(dest)).is_err() {
                git(&["fetch", "-q", "origin"], Some(dest))?;
            }
            git(&["checkout", "-q", c], Some(dest))?;
        }
        (None, Some(r)) if looks_like_sha(r) => {
            git(&["clone", "-q", url, &d], None)?;
            git(&["checkout", "-q", r], Some(dest))?;
        }
        (None, Some(r)) => {
            git(
                &["clone", "-q", "--depth", "1", "--branch", r, url, &d],
                None,
            )?;
        }
        (None, None) => {
            git(&["clone", "-q", "--depth", "1", url, &d], None)?;
        }
    }
    git(&["rev-parse", "HEAD"], Some(dest))
}

pub struct Resolver<'a> {
    pub project_root: &'a Path,
    pub apm_modules: PathBuf,
    pub existing_lock: Option<&'a LockFile>,
    /// Ignore locked commits and re-resolve refs.
    pub update: bool,
    pub include_dev: bool,
}

struct Pending {
    reference: DependencyReference,
    depth: i64,
    parent: Option<(String, String, PathBuf, bool)>, // (parent repo_url, parent key, parent source dir, parent is local)
    is_dev: bool,
}

impl Resolver<'_> {
    pub fn resolve(&self, root: &Manifest) -> Result<Vec<ResolvedPackage>> {
        let mut queue: VecDeque<Pending> = root
            .apm
            .iter()
            .map(|r| Pending {
                reference: r.clone(),
                depth: 1,
                parent: None,
                is_dev: false,
            })
            .collect();
        if self.include_dev {
            queue.extend(root.dev_apm.iter().map(|r| Pending {
                reference: r.clone(),
                depth: 1,
                parent: None,
                is_dev: true,
            }));
        }
        let mut seen: HashSet<String> = HashSet::new();
        let mut out = Vec::new();
        while let Some(p) = queue.pop_front() {
            if let Some(why) = &p.reference.unsupported {
                bail!("{}: {why}", p.reference.repo_url);
            }
            let pkg = self.materialize(&p)?;
            if !seen.insert(pkg.key.clone()) {
                continue;
            }
            if let Some(m) = &pkg.manifest {
                for child in &m.apm {
                    queue.push_back(Pending {
                        reference: child.clone(),
                        depth: p.depth + 1,
                        parent: Some((
                            pkg.reference.repo_url.clone(),
                            pkg.key.clone(),
                            pkg.source_dir.clone(),
                            pkg.reference.is_local,
                        )),
                        is_dev: p.is_dev,
                    });
                }
            }
            out.push(pkg);
        }
        Ok(out)
    }

    fn materialize(&self, p: &Pending) -> Result<ResolvedPackage> {
        let r = &p.reference;
        let resolved_by = p.parent.as_ref().map(|(u, ..)| u.clone());
        if r.is_local {
            let lp = r.local_path.clone().unwrap_or_default();
            let (source_dir, declaring_parent, anchored) = match &p.parent {
                None => (self.project_root.join(expand_home(&lp)), None, None),
                Some((_, parent_key, parent_dir, parent_local)) => {
                    if !parent_local {
                        bail!(
                            "Remote package {parent_key} declares local dependency {lp}; local paths are only allowed in local packages"
                        );
                    }
                    let src = parent_dir.join(expand_home(&lp));
                    let rel = src
                        .strip_prefix(self.project_root)
                        .map_or_else(|_| normalize_rel(&src), normalize_rel);
                    (src, Some(parent_key.clone()), Some(rel))
                }
            };
            if !source_dir.is_dir() {
                bail!(
                    "Local dependency path not found: {} ({})",
                    lp,
                    source_dir.display()
                );
            }
            let name = r.package_dir_name();
            let install_path = match &anchored {
                Some(a) => self
                    .apm_modules
                    .join("_local")
                    .join(&hash::sha256_hex(a.as_bytes())[..12])
                    .join(&name),
                None => self.apm_modules.join("_local").join(&name),
            };
            copy_tree(&source_dir, &install_path)?;
            let manifest = load_optional_manifest(&install_path)?;
            let key = match &anchored {
                Some(a) => format!("local:{a}"),
                None => lp,
            };
            return Ok(ResolvedPackage {
                reference: r.clone(),
                key,
                depth: p.depth,
                resolved_by,
                declaring_parent,
                anchored_local_path: anchored,
                install_path,
                source_dir,
                manifest,
                resolved_commit: None,
                is_dev: p.is_dev,
            });
        }

        let key = r.unique_key();
        let locked_commit = if self.update {
            None
        } else {
            self.existing_lock
                .and_then(|l| l.get_dependency(&key))
                .filter(|d| d.str("resolved_ref") == r.reference.as_deref())
                .and_then(|d| d.str("resolved_commit").map(str::to_owned))
        };
        let mut install_path = self.apm_modules.clone();
        if let Some(a) = &r.alias {
            install_path.push(a);
        } else {
            for seg in r.repo_url.split('/') {
                install_path.push(seg);
            }
            if let Some(v) = &r.virtual_path {
                if v.ends_with(".md") {
                    install_path.push(v.rsplit('/').next().unwrap_or(v).trim_end_matches(".md"));
                } else {
                    for seg in v.split('/') {
                        install_path.push(seg);
                    }
                }
            }
        }
        let commit = if r.is_virtual {
            let tmp = self
                .apm_modules
                .join(".tmp")
                .join(&hash::sha256_hex(key.as_bytes())[..12]);
            let c = git_fetch(
                &r.clone_url(),
                r.reference.as_deref(),
                locked_commit.as_deref(),
                &tmp,
            )?;
            let vp = r.virtual_path.as_deref().unwrap_or("");
            let src = tmp.join(vp);
            if src.is_dir() {
                copy_tree(&src, &install_path)?;
            } else if src.is_file() {
                if install_path.exists() {
                    fs::remove_dir_all(&install_path)?;
                }
                fs::create_dir_all(&install_path)?;
                fs::copy(&src, install_path.join(src.file_name().unwrap_or_default()))?;
            } else {
                bail!("Path '{vp}' not found in {}", r.clone_url());
            }
            let _ = fs::remove_dir_all(&tmp);
            c
        } else {
            let c = git_fetch(
                &r.clone_url(),
                r.reference.as_deref(),
                locked_commit.as_deref(),
                &install_path,
            )?;
            let _ = fs::remove_dir_all(install_path.join(".git"));
            c
        };
        let manifest = load_optional_manifest(&install_path)?;
        Ok(ResolvedPackage {
            reference: r.clone(),
            key,
            depth: p.depth,
            resolved_by,
            declaring_parent: None,
            anchored_local_path: None,
            source_dir: install_path.clone(),
            install_path,
            manifest,
            resolved_commit: Some(commit),
            is_dev: p.is_dev,
        })
    }
}

fn load_optional_manifest(dir: &Path) -> Result<Option<Manifest>> {
    let p = dir.join("apm.yml");
    if p.is_file() {
        Ok(Some(Manifest::load(&p)?))
    } else {
        Ok(None)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn normalize_relative_paths() {
        assert_eq!(normalize_rel(Path::new("packages/a/../b")), "packages/b");
        assert_eq!(normalize_rel(Path::new("./x/./y")), "x/y");
    }
}
