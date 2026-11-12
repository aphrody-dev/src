//! Conformance tests against the upstream checkout (microsoft/apm @ 1a6c1df).
//!
//! Set `APM_UPSTREAM` to the checkout; defaults to `C:\src\third_party\ai\microsoft_apm`.
//! Tests are skipped (pass with a note) when the checkout is absent.

use std::fs;
use std::path::Path;
use std::path::PathBuf;

use aphrody_apm::hash;
use aphrody_apm::install::InstallOptions;
use aphrody_apm::install::install;
use aphrody_apm::lockfile::LockFile;
use aphrody_apm::manifest::Includes;
use aphrody_apm::manifest::Manifest;
use aphrody_apm::resolve::copy_tree;
use aphrody_apm::yaml::DumpOptions;
use aphrody_apm::yaml::Value;
use aphrody_apm::yaml::{self};

fn upstream() -> Option<PathBuf> {
    let p = std::env::var_os("APM_UPSTREAM").map_or_else(
        || PathBuf::from(r"C:\src\third_party\ai\microsoft_apm"),
        PathBuf::from,
    );
    if p.join("apm.yml").is_file() {
        Some(p)
    } else {
        eprintln!("skipping: upstream checkout not found at {}", p.display());
        None
    }
}

fn fixture(root: &Path, parts: &[&str]) -> PathBuf {
    let mut p = root.join("tests").join("fixtures").join("spec-conformance");
    for x in parts {
        p.push(x);
    }
    p
}

#[test]
fn repo_manifest_parses() {
    let Some(up) = upstream() else { return };
    let m = Manifest::load(&up.join("apm.yml")).unwrap();
    assert_eq!(m.name, "apm");
    assert_eq!(m.version, "0.10.0");
    assert_eq!(m.includes, Some(Includes::Auto));
    assert_eq!(m.targets, vec!["copilot"]);
    assert_eq!(m.apm.len(), 5);
    assert!(m.apm.iter().all(|d| d.is_local));
    assert!(m.mcp.is_empty() && m.scripts.is_empty());
    // Serialize -> parse is a fixed point and preserves the document.
    let again = Manifest::parse(&m.to_yaml()).unwrap();
    assert_eq!(again.raw, m.raw);
    assert_eq!(again.to_yaml(), m.to_yaml());
}

#[test]
fn repo_lockfile_round_trips() {
    // The committed lockfile was written by apm 0.31.0, whose `to_dict` put
    // `content_hash` before `declaring_parent`; 1a6c1df's `to_dict` (ported here)
    // moved it after `anchored_local_path`. So: same document, same lines,
    // byte-identical once that one key-order change is accounted for.
    let Some(up) = upstream() else { return };
    let original = fs::read_to_string(up.join("apm.lock.yaml")).unwrap();
    let mut lock = LockFile::from_yaml(&original).unwrap();
    assert_eq!(lock.dependencies.len(), 11);
    let emitted = lock.to_yaml();
    assert_eq!(
        yaml::parse(&emitted).unwrap(),
        yaml::parse(&original).unwrap()
    );
    let mut a: Vec<&str> = original.lines().collect();
    let mut b: Vec<&str> = emitted.lines().collect();
    a.sort_unstable();
    b.sort_unstable();
    let only_a: Vec<_> = a.iter().filter(|l| !b.contains(l)).take(5).collect();
    let only_b: Vec<_> = b.iter().filter(|l| !a.contains(l)).take(5).collect();
    assert!(
        a == b,
        "line multisets differ: upstream-only {only_a:?} ours-only {only_b:?} ({} vs {})",
        a.len(),
        b.len()
    );
    assert_eq!(
        LockFile::from_yaml(&emitted).unwrap().to_yaml(),
        emitted,
        "fixed point"
    );
    // Entries without declaring_parent are byte-identical in place.
    let reordered = original.replace("\r\n", "\n");
    let fix = |s: &str| -> String {
        // move each `  content_hash:` line below a following `  anchored_local_path:` line
        let lines: Vec<&str> = s.lines().collect();
        let mut out: Vec<&str> = Vec::new();
        let mut i = 0;
        while i < lines.len() {
            if lines[i].starts_with("  content_hash:")
                && lines
                    .get(i + 1)
                    .is_some_and(|l| l.starts_with("  declaring_parent:"))
                && lines
                    .get(i + 2)
                    .is_some_and(|l| l.starts_with("  anchored_local_path:"))
            {
                out.extend([lines[i + 1], lines[i + 2], lines[i]]);
                i += 3;
            } else {
                out.push(lines[i]);
                i += 1;
            }
        }
        format!("{}\n", out.join("\n"))
    };
    let original = fix(&reordered);
    if emitted != original {
        let (a, b): (Vec<&str>, Vec<&str>) =
            (original.lines().collect(), emitted.lines().collect());
        let i = a
            .iter()
            .zip(&b)
            .position(|(x, y)| x != y)
            .unwrap_or(a.len().min(b.len()));
        panic!(
            "first difference at line {}:\n upstream: {:?}\n ours:     {:?}",
            i + 1,
            a.get(i),
            b.get(i)
        );
    }
}

#[test]
fn synthesized_ledger_matches_upstream_rows() {
    // The ledger the reader would synthesize from legacy views has the same
    // locators/owners/hashes as the stored rows (modulo `.agents/` attribution).
    let Some(up) = upstream() else { return };
    let lock = LockFile::from_yaml(&fs::read_to_string(up.join("apm.lock.yaml")).unwrap()).unwrap();
    let stored = lock.deployments.clone().unwrap();
    let synth = lock.synthesize_deployments();
    assert_eq!(stored.len(), synth.len());
    let key = |r: &aphrody_apm::lockfile::DeploymentRow| {
        (r.value.clone(), r.owners.clone(), r.content_hash.clone())
    };
    let mut a: Vec<_> = stored.iter().map(key).collect();
    let mut b: Vec<_> = synth.iter().map(key).collect();
    a.sort();
    b.sort();
    assert_eq!(a, b);
}

#[test]
fn local_package_content_hashes_match_lockfile() {
    let Some(up) = upstream() else { return };
    let lock = LockFile::from_yaml(&fs::read_to_string(up.join("apm.lock.yaml")).unwrap()).unwrap();
    let tmp = tempfile::tempdir().unwrap();
    let mut checked = 0;
    for d in &lock.dependencies {
        let rel = d.str("anchored_local_path").map_or_else(
            || {
                d.str("local_path")
                    .unwrap()
                    .trim_start_matches("./")
                    .to_owned()
            },
            str::to_owned,
        );
        let src = up.join(&rel);
        let dst = tmp.path().join(checked.to_string());
        copy_tree(&src, &dst).unwrap();
        assert_eq!(
            Some(hash::package_hash(&dst).as_str()),
            d.str("content_hash"),
            "content_hash of {rel}"
        );
        checked += 1;
    }
    assert_eq!(checked, 11);
}

/// Copy the upstream project inputs (manifest, `.apm/`, local packages) and run `apm install`.
#[test]
fn install_reproduces_upstream_deployed_files() {
    let Some(up) = upstream() else { return };
    let tmp = tempfile::tempdir().unwrap();
    let root = tmp.path();
    fs::copy(up.join("apm.yml"), root.join("apm.yml")).unwrap();
    copy_tree(&up.join(".apm"), &root.join(".apm")).unwrap();
    copy_tree(&up.join("packages"), &root.join("packages")).unwrap();
    let report = install(root, &InstallOptions::default()).unwrap();
    assert_eq!(report.targets, vec!["copilot"]);
    assert_eq!(report.packages.len(), 11);

    let theirs =
        LockFile::from_yaml(&fs::read_to_string(up.join("apm.lock.yaml")).unwrap()).unwrap();
    let ours =
        LockFile::from_yaml(&fs::read_to_string(root.join("apm.lock.yaml")).unwrap()).unwrap();
    for t in &theirs.dependencies {
        let key = t.unique_key();
        let o = ours
            .get_dependency(&key)
            .unwrap_or_else(|| panic!("missing {key}"));
        for field in [
            "repo_url",
            "name",
            "version",
            "package_type",
            "source",
            "local_path",
            "depth",
            "resolved_by",
            "declaring_parent",
            "anchored_local_path",
            "content_hash",
            "deployed_files",
            "deployed_file_hashes",
        ] {
            assert_eq!(
                o.to_value().get(field),
                t.to_value().get(field),
                "{key}: {field}"
            );
        }
    }
    // Project-local primitives: compare the skill subtree (instructions/agents
    // under .github are committed in upstream and include link rewriting).
    let skills = |files: &[String]| {
        files
            .iter()
            .filter(|f| f.starts_with(".agents/skills/"))
            .cloned()
            .collect::<Vec<_>>()
    };
    assert_eq!(
        skills(&ours.local_deployed_files),
        skills(&theirs.local_deployed_files)
    );
    for f in skills(&ours.local_deployed_files)
        .iter()
        .filter(|f| ours.local_deployed_file_hashes.contains_key(*f))
    {
        assert_eq!(
            ours.local_deployed_file_hashes.get(f),
            theirs.local_deployed_file_hashes.get(f),
            "{f}"
        );
    }
    // Second install is idempotent.
    let first = fs::read(root.join("apm.lock.yaml")).unwrap();
    install(root, &InstallOptions::default()).unwrap();
    assert_eq!(first, fs::read(root.join("apm.lock.yaml")).unwrap());
}

// ---- tests/spec_conformance ports ---------------------------------------------------------

/// `test_round_trip.py::_canonical_yaml`.
fn canonical(v: &Value) -> String {
    yaml::dump(
        v,
        DumpOptions {
            sort_keys: true,
            allow_unicode: false,
            width: 120,
        },
    )
}

#[test]
fn req_cf_001_round_trip_is_fixed_point() {
    let Some(up) = upstream() else { return };
    for parts in [
        ["manifest", "valid-minimal.yml"],
        ["manifest", "x-extension-roundtrip.yml"],
        ["lockfile", "round-trip-unknown-fields.yml"],
        ["lockfile", "v2-with-registry.yml"],
        ["policy", "valid-extends.yml"],
    ] {
        let doc1 = yaml::parse(&fs::read_to_string(fixture(&up, &parts)).unwrap()).unwrap();
        let c1 = canonical(&doc1);
        let doc2 = yaml::parse(&c1).unwrap();
        assert_eq!(doc1, doc2, "{parts:?}");
        assert_eq!(c1, canonical(&doc2), "{parts:?}");
    }
}

#[test]
fn req_mf_003_missing_name_rejected() {
    let Some(up) = upstream() else { return };
    assert!(Manifest::load(&fixture(&up, &["manifest", "invalid-missing-name.yml"])).is_err());
    assert!(Manifest::load(&fixture(&up, &["manifest", "valid-minimal.yml"])).is_ok());
}

#[test]
fn req_mf_020_anchor_alias_rejected() {
    let Some(up) = upstream() else { return };
    assert!(
        Manifest::load(&fixture(
            &up,
            &["manifest", "invalid-yaml-anchor-alias.yml"]
        ))
        .is_err()
    );
}

#[test]
fn req_mf_019_ext_001_extension_keys_preserved() {
    let Some(up) = upstream() else { return };
    let m = Manifest::load(&fixture(&up, &["manifest", "x-extension-roundtrip.yml"])).unwrap();
    assert_eq!(
        m.raw.get("default_host").and_then(Value::as_str),
        Some("github.com")
    );
    let again = Manifest::parse(&m.to_yaml()).unwrap();
    assert_eq!(again.raw, m.raw);
    assert!(
        again.raw.contains_key("x-acme-telemetry")
            && again.raw.contains_key("x-vendor-experimental")
    );
}

#[test]
fn req_lk_004_005_v1_and_v2_lockfiles_parse() {
    let Some(up) = upstream() else { return };
    let v1 = LockFile::from_yaml(
        &fs::read_to_string(fixture(&up, &["lockfile", "v1-git-only.yml"])).unwrap(),
    )
    .unwrap();
    assert!(v1.dependencies[0].str("resolved_commit").is_some());
    let mut v2 = LockFile::from_yaml(
        &fs::read_to_string(fixture(&up, &["lockfile", "v2-with-registry.yml"])).unwrap(),
    )
    .unwrap();
    assert_eq!(v2.lockfile_version, "2");
    assert!(
        v2.dependencies[0]
            .str("resolved_hash")
            .unwrap()
            .starts_with("sha256:")
    ); // req-lk-013
    assert!(v2.to_yaml().starts_with("lockfile_version: '2'\n")); // registry source keeps v2
}

#[test]
fn req_lk_011_unknown_dependency_fields_round_trip() {
    let Some(up) = upstream() else { return };
    let mut l = LockFile::from_yaml(
        &fs::read_to_string(fixture(&up, &["lockfile", "round-trip-unknown-fields.yml"])).unwrap(),
    )
    .unwrap();
    let out = l.to_yaml();
    for k in [
        "tree_sha256: sha256:a1b2",
        "future_field_unknown_in_v01: preserved",
        "x-acme-attestation-id: att-9876",
    ] {
        assert!(out.contains(k), "{k} missing from:\n{out}");
    }
    let again = LockFile::from_yaml(&out).unwrap().to_yaml();
    assert_eq!(out, again);
}

#[test]
fn req_lk_022_materialization_spelling_does_not_change_sort_order() {
    let Some(up) = upstream() else { return };
    let mut l = LockFile::from_yaml(
        &fs::read_to_string(fixture(
            &up,
            &["lockfile", "materialization-sort-exclusion.yml"],
        ))
        .unwrap(),
    )
    .unwrap();
    let doc = yaml::parse(&l.to_yaml()).unwrap();
    let deps = doc.get("dependencies").and_then(Value::as_seq).unwrap();
    let canonical: Vec<String> = deps
        .iter()
        .map(|d| {
            d.get("repo_url")
                .and_then(Value::as_str)
                .unwrap()
                .to_owned()
        })
        .collect();
    let mut sorted = canonical.clone();
    sorted.sort();
    assert_eq!(canonical, sorted);
    let display: Vec<String> = deps
        .iter()
        .filter_map(|d| {
            d.get("materialization_repo_url")
                .and_then(Value::as_str)
                .map(str::to_owned)
        })
        .collect();
    let mut dsorted = display.clone();
    dsorted.sort();
    assert_ne!(display, dsorted);
}
