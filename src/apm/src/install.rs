//! `apm install`: resolve, materialize, deploy, write `apm.lock.yaml`.

use std::collections::BTreeSet;
use std::fs;
use std::path::Path;
use std::path::PathBuf;

use anyhow::Context;
use anyhow::Result;
use anyhow::bail;
use indexmap::IndexMap;

use crate::deploy::Deployed;
use crate::deploy::PackageScope;
use crate::deploy::{self};
use crate::hash;
use crate::lockfile::DeploymentRow;
use crate::lockfile::LockFile;
use crate::lockfile::LockedDependency;
use crate::manifest::Manifest;
use crate::manifest::normalize_target;
use crate::resolve::ResolvedPackage;
use crate::resolve::Resolver;
use crate::targets::Target;
use crate::targets::{self};
use crate::yaml::Value;

pub const LOCKFILE_NAME: &str = "apm.lock.yaml";
/// Upstream release this port tracks (written as `apm_version`).
pub const APM_VERSION: &str = "0.35.1";

#[derive(Debug, Clone, Default)]
pub struct InstallOptions {
    /// `--target` override (comma-separated values allowed).
    pub targets: Vec<String>,
    pub update: bool,
    pub include_dev: bool,
}

#[derive(Debug, Default)]
pub struct InstallReport {
    pub packages: Vec<String>,
    pub deployed_files: usize,
    pub targets: Vec<&'static str>,
    pub unsupported_targets: Vec<String>,
    pub removed: Vec<String>,
}

fn resolve_targets(
    root: &Path,
    manifest: &Manifest,
    cli: &[String],
) -> Result<(Vec<Target>, Vec<String>)> {
    let mut explicit = Vec::new();
    for t in cli
        .iter()
        .flat_map(|s| s.split(','))
        .map(str::trim)
        .filter(|s| !s.is_empty())
    {
        explicit.push(normalize_target(t)?);
    }
    if explicit.is_empty() {
        explicit.clone_from(&manifest.targets);
    }
    let was_explicit = !explicit.is_empty();
    let (ts, unsupported) = targets::active_targets(root, &explicit);
    if was_explicit {
        // An explicitly selected target creates its root (`apm install --target claude`).
        for t in &ts {
            fs::create_dir_all(root.join(t.root_dir))?;
        }
    }
    Ok((ts, unsupported))
}

fn files_and_hashes(d: &[Deployed]) -> (Vec<String>, IndexMap<String, String>) {
    let mut files = Vec::new();
    let mut hashes = IndexMap::new();
    for x in d {
        if !files.contains(&x.path) {
            files.push(x.path.clone());
        }
        if let Some(h) = &x.hash {
            hashes.insert(x.path.clone(), h.clone());
        }
    }
    (files, hashes)
}

fn locked_entry(p: &ResolvedPackage, deployed: &[Deployed]) -> LockedDependency {
    let mut d = LockedDependency::default();
    let r = &p.reference;
    d.set_str("repo_url", &r.repo_url);
    if let Some(a) = &r.alias {
        d.set_str("alias", a);
    }
    if let Some(m) = &p.manifest {
        d.set_str("name", &m.name);
    }
    if let Some(h) = r
        .host
        .as_deref()
        .filter(|h| *h != crate::reference::DEFAULT_HOST)
    {
        d.set_str("host", h);
    }
    if let Some(c) = &p.resolved_commit {
        d.set_str("resolved_commit", c);
    }
    if let Some(rf) = &r.reference {
        d.set_str("resolved_ref", rf);
    }
    if let Some(m) = &p.manifest {
        d.set_str("version", &m.version);
    }
    if let Some(v) = &r.virtual_path {
        d.set_str("virtual_path", v);
        d.set("is_virtual", Value::Bool(true));
    }
    d.set("depth", Value::Int(p.depth));
    if let Some(by) = &p.resolved_by {
        d.set_str("resolved_by", by);
    }
    d.set_str("package_type", p.package_type());
    let (files, hashes) = files_and_hashes(deployed);
    d.set(
        "deployed_files",
        Value::Seq(files.into_iter().map(Value::Str).collect()),
    );
    d.set(
        "deployed_file_hashes",
        Value::Map(
            hashes
                .into_iter()
                .map(|(k, v)| (k, Value::Str(v)))
                .collect(),
        ),
    );
    if r.is_local {
        d.set_str("source", "local");
        d.set_str("local_path", r.local_path.clone().unwrap_or_default());
    }
    if let Some(dp) = &p.declaring_parent {
        d.set_str("declaring_parent", dp);
    }
    if let Some(a) = &p.anchored_local_path {
        d.set_str("anchored_local_path", a);
    }
    d.set_str("content_hash", hash::package_hash(&p.install_path));
    if p.is_dev {
        d.set("is_dev", Value::Bool(true));
    }
    if !r.skills.is_empty() {
        d.set(
            "skill_subset",
            Value::Seq(r.skills.iter().map(Value::str).collect()),
        );
    }
    if let Some(l) = p.manifest.as_ref().and_then(|m| m.license.clone()) {
        d.set_str("declared_license", l);
    }
    d
}

fn rows_for(owner: &str, deployed: &[Deployed], rows: &mut IndexMap<String, DeploymentRow>) {
    for x in deployed {
        let mut row = DeploymentRow {
            kind: "project-relative".into(),
            target: x.target.into(),
            value: x.path.clone(),
            runtime: None,
            scope: "project".into(),
            owners: vec![],
            active_owner: owner.into(),
            content_hash: x.hash.clone(),
        };
        let key = row.key();
        let mut owners = rows.get(&key).map(|r| r.owners.clone()).unwrap_or_default();
        owners.retain(|o| o != owner);
        owners.push(owner.into());
        row.owners = owners;
        rows.insert(key, row);
    }
}

/// Remove files a previous install deployed that this install no longer produces.
fn remove_stale(root: &Path, old: &LockFile, current: &BTreeSet<String>) -> Vec<String> {
    let mut previous: BTreeSet<String> = old.local_deployed_files.iter().cloned().collect();
    for d in &old.dependencies {
        previous.extend(d.deployed_files());
    }
    let mut removed = Vec::new();
    // Files first, then directories deepest-first.
    let mut dirs = Vec::new();
    for p in previous.difference(current) {
        if p.contains("..") || p.starts_with('/') || p.contains("://") {
            continue;
        }
        let abs = root.join(p);
        if abs.is_file() {
            if fs::remove_file(&abs).is_ok() {
                removed.push(p.clone());
            }
        } else if abs.is_dir() {
            dirs.push((p.clone(), abs));
        }
    }
    dirs.sort_by_key(|(p, _)| std::cmp::Reverse(p.len()));
    for (p, abs) in dirs {
        if fs::remove_dir_all(&abs).is_ok() {
            removed.push(p);
        }
    }
    removed
}

pub fn install(project_root: &Path, opts: &InstallOptions) -> Result<InstallReport> {
    let manifest_path = project_root.join("apm.yml");
    if !manifest_path.is_file() {
        bail!(
            "No apm.yml found in {}. Run 'apm init' first.",
            project_root.display()
        );
    }
    let manifest = Manifest::load(&manifest_path)?;
    let lock_path = project_root.join(LOCKFILE_NAME);
    let old_lock = LockFile::read(&lock_path)?;
    let (targets, unsupported) = resolve_targets(project_root, &manifest, &opts.targets)?;

    let resolver = Resolver {
        project_root,
        apm_modules: project_root.join("apm_modules"),
        existing_lock: old_lock.as_ref(),
        update: opts.update,
        include_dev: opts.include_dev,
    };
    let packages = resolver.resolve(&manifest)?;

    let mut lock = LockFile {
        apm_version: Some(APM_VERSION.into()),
        ..LockFile::default()
    };
    if let Some(old) = &old_lock {
        lock.sections.clone_from(&old.sections);
    }
    let mut rows: IndexMap<String, DeploymentRow> = IndexMap::new();
    let mut current: BTreeSet<String> = BTreeSet::new();
    let mut report = InstallReport {
        targets: targets.iter().map(|t| t.name).collect(),
        unsupported_targets: unsupported,
        ..InstallReport::default()
    };

    for p in &packages {
        let skill_name = p.reference.alias.clone().unwrap_or_else(|| {
            p.install_path
                .file_name()
                .map(|n| n.to_string_lossy().into_owned())
                .unwrap_or_default()
        });
        let deployed = deploy::deploy_package(
            project_root,
            PackageScope {
                package_dir: &p.install_path,
                package_name: &skill_name,
                is_dependency: true,
            },
            &targets,
        )
        .with_context(|| format!("deploying {}", p.key))?;
        current.extend(deployed.iter().map(|d| d.path.clone()));
        rows_for(&p.key, &deployed, &mut rows);
        report.deployed_files += deployed.iter().filter(|d| d.hash.is_some()).count();
        report.packages.push(p.key.clone());
        lock.add_dependency(locked_entry(p, &deployed));
    }

    // The project's own `.apm/` primitives (owner ".").
    let local = deploy::deploy_package(
        project_root,
        PackageScope {
            package_dir: project_root,
            package_name: &manifest.name,
            is_dependency: false,
        },
        &targets,
    )?;
    current.extend(local.iter().map(|d| d.path.clone()));
    rows_for(".", &local, &mut rows);
    report.deployed_files += local.iter().filter(|d| d.hash.is_some()).count();
    let (files, hashes) = files_and_hashes(&local);
    lock.local_deployed_files = files;
    lock.local_deployed_file_hashes = hashes;
    lock.deployments = Some(rows.into_values().collect());

    if let Some(old) = &old_lock {
        report.removed = remove_stale(project_root, old, &current);
    }
    lock.write(&lock_path)?;
    Ok(report)
}

/// Paths of installed package directories, from the lockfile.
pub fn installed_package_dirs(project_root: &Path, lock: &LockFile) -> Vec<PathBuf> {
    let modules = project_root.join("apm_modules");
    lock.sorted_dependencies()
        .iter()
        .filter_map(|d| {
            let p = if d.str("source") == Some("local") {
                let name = d
                    .repo_url()
                    .strip_prefix("_local/")
                    .unwrap_or(d.repo_url())
                    .to_owned();
                match d.str("anchored_local_path") {
                    Some(a) if d.str("declaring_parent").is_some() => modules
                        .join("_local")
                        .join(&hash::sha256_hex(a.as_bytes())[..12])
                        .join(name),
                    _ => modules.join("_local").join(name),
                }
            } else if let Some(a) = d.str("alias") {
                modules.join(a)
            } else {
                let mut p = modules.clone();
                d.repo_url().split('/').for_each(|s| p.push(s));
                if let Some(v) = d.str("virtual_path") {
                    if v.ends_with(".md") {
                        p.push(v.rsplit('/').next().unwrap_or(v).trim_end_matches(".md"));
                    } else {
                        v.split('/').for_each(|s| p.push(s));
                    }
                }
                p
            };
            p.is_dir().then_some(p)
        })
        .collect()
}
