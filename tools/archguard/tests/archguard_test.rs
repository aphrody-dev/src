use archguard::{AuditConfig, Severity, run_audit};
use std::fs;
use std::path::{Path, PathBuf};
use std::sync::atomic::{AtomicUsize, Ordering};

static COUNTER: AtomicUsize = AtomicUsize::new(0);

struct TempWorkspace {
    root: PathBuf,
}

impl TempWorkspace {
    fn new(label: &str) -> Self {
        let id = COUNTER.fetch_add(1, Ordering::SeqCst);
        let dir = std::env::temp_dir().join(format!(
            "archguard_test_{}_{}_{}",
            label,
            std::process::id(),
            id
        ));
        let _ = fs::remove_dir_all(&dir);
        fs::create_dir_all(dir.join("crates")).unwrap();
        fs::create_dir_all(dir.join("packages")).unwrap();
        fs::create_dir_all(dir.join("apps")).unwrap();
        fs::create_dir_all(dir.join("infra")).unwrap();
        fs::create_dir_all(dir.join("tools")).unwrap();
        fs::create_dir_all(dir.join("docs")).unwrap();
        fs::write(dir.join("infra/go.mod"), "module aphrody/infra\ngo 1.27\n").unwrap();
        Self { root: dir }
    }

    fn write(&self, rel: &str, content: &str) {
        let p = self.root.join(rel);
        if let Some(parent) = p.parent() {
            fs::create_dir_all(parent).unwrap();
        }
        fs::write(p, content).unwrap();
    }

    fn path(&self) -> &Path {
        &self.root
    }
}

impl Drop for TempWorkspace {
    fn drop(&mut self) {
        let _ = fs::remove_dir_all(&self.root);
    }
}

#[test]
fn clean_minimal_monorepo_passes_with_zero_findings() {
    let ws = TempWorkspace::new("clean");
    ws.write(
        "crates/demo-crate/Cargo.toml",
        "[package]\nname = \"demo-crate\"\nversion = \"0.1.0\"\nedition = \"2024\"\n",
    );
    ws.write(
        "crates/demo-crate/src/lib.rs",
        "pub fn add(a: i32, b: i32) -> i32 { a + b }\n",
    );
    ws.write(
        "packages/demo-pkg/package.json",
        "{\n  \"name\": \"@aphrody/demo-pkg\",\n  \"version\": \"1.0.0\",\n  \"dependencies\": {},\n  \"devDependencies\": {}\n}\n",
    );
    ws.write(
        "packages/demo-pkg/src/index.ts",
        "export const ok = true;\n",
    );

    let report = run_audit(&AuditConfig {
        root: ws.path().to_path_buf(),
        strict: true,
        only_rule: None,
        check_docs_emojis: true,
    });

    assert!(
        report.clean,
        "expected clean report, got: {:?}",
        report.findings
    );
    assert_eq!(report.error_count, 0);
    assert_eq!(report.warning_count, 0);
}

#[test]
fn detects_typescript_and_npm_files_inside_rust_crate_arch_001() {
    let ws = TempWorkspace::new("ts_in_crate");
    ws.write(
        "crates/bad-crawler/Cargo.toml",
        "[package]\nname = \"bad-crawler\"\nversion = \"0.1.0\"\nedition = \"2024\"\n",
    );
    ws.write("crates/bad-crawler/src/main.rs", "fn main() {}\n");
    ws.write(
        "crates/bad-crawler/crawler.ts",
        "export const leakedTsInCrate = 1;\n",
    );
    ws.write("crates/bad-crawler/package.json", "{\"name\": \"wrong\"}\n");

    let report = run_audit(&AuditConfig {
        root: ws.path().to_path_buf(),
        strict: false,
        only_rule: None,
        check_docs_emojis: true,
    });

    assert!(!report.clean);
    let arch001: Vec<_> = report
        .findings
        .iter()
        .filter(|f| f.rule_id == "ARCH-001")
        .collect();
    assert_eq!(
        arch001.len(),
        2,
        "should flag both crawler.ts and package.json"
    );
    assert!(arch001.iter().all(|f| f.severity == Severity::Error));
}

#[test]
fn detects_cargo_toml_or_unscoped_name_or_npm_lock_in_package_arch_003() {
    let ws = TempWorkspace::new("bad_pkg");
    ws.write(
        "packages/unscoped/package.json",
        "{\n  \"name\": \"plain-unscoped-name\",\n  \"version\": \"0.1.0\",\n  \"dependencies\": { \"lodash\": \"^4.17.21\" }\n}\n",
    );
    ws.write(
        "packages/unscoped/Cargo.toml",
        "[package]\nname = \"wrong\"\n",
    );
    ws.write("packages/unscoped/package-lock.json", "{}\n");
    ws.write("packages/unscoped/src/rogue.rs", "pub fn bad() {}\n");

    let report = run_audit(&AuditConfig {
        root: ws.path().to_path_buf(),
        strict: false,
        only_rule: Some("ARCH-003".into()),
        check_docs_emojis: true,
    });

    assert!(!report.clean);
    assert!(
        report.findings.len() >= 4,
        "expected unscoped name, npm dep, Cargo.toml, package-lock.json, and rogue.rs findings; got {:?}",
        report.findings
    );
}

#[test]
fn detects_pure_rust_app_typescript_violation_and_aphrody_npm_violation_arch_004() {
    let ws = TempWorkspace::new("apps_contract");
    ws.write(
        "apps/aphrody-app/Cargo.toml",
        "[workspace]\nresolver = \"2\"\n",
    );
    ws.write(
        "apps/aphrody-app/server.ts",
        "Bun.serve({ fetch() { return new Response('bad'); } });\n",
    );
    ws.write(
        "apps/aphrody/package.json",
        "{\n  \"name\": \"aphrody\",\n  \"dependencies\": { \"express\": \"5.0.0\" }\n}\n",
    );
    ws.write("apps/aphrody/bun.lock", "# forbidden lockfile\n");

    let report = run_audit(&AuditConfig {
        root: ws.path().to_path_buf(),
        strict: false,
        only_rule: Some("ARCH-004".into()),
        check_docs_emojis: true,
    });

    assert!(!report.clean);
    assert_eq!(report.findings.len(), 3);
}

#[test]
fn detects_rogue_root_directory_system32_mutation_secret_env_and_emojis() {
    let ws = TempWorkspace::new("hygiene_and_boundaries");
    fs::create_dir_all(ws.path().join("rogue_top_dir")).unwrap();
    ws.write("packages/leak/.env", "SECRET=1234567890\n");
    ws.write(
        "packages/leak/package.json",
        "{\n  \"name\": \"@aphrody/leak\",\n  \"dependencies\": {}\n}\n",
    );
    ws.write(
        "packages/leak/install.ps1",
        "Copy-Item ./foo.exe C:\\Windows\\System32\\foo.exe\n",
    );
    ws.write("packages/leak/slop.md", "# Bad Doc \u{1F680}\n");

    let report = run_audit(&AuditConfig {
        root: ws.path().to_path_buf(),
        strict: false,
        only_rule: None,
        check_docs_emojis: true,
    });

    assert!(!report.clean);
    let ids: Vec<&str> = report.findings.iter().map(|f| f.rule_id.as_str()).collect();
    assert!(
        ids.contains(&"ARCH-005"),
        "missing rogue root dir check: {ids:?}"
    );
    assert!(
        ids.contains(&"ARCH-007"),
        "missing System32 mutation check: {ids:?}"
    );
    assert!(
        ids.contains(&"ARCH-008"),
        "missing .env leak check: {ids:?}"
    );
    assert!(ids.contains(&"ARCH-009"), "missing emoji check: {ids:?}");
}

#[test]
fn report_blake3_is_deterministic_across_identical_runs() {
    let ws = TempWorkspace::new("deterministic");
    ws.write(
        "crates/alpha/Cargo.toml",
        "[package]\nname = \"alpha\"\nversion = \"0.1.0\"\nedition = \"2024\"\n",
    );
    ws.write("crates/alpha/bad.ts", "const x = 1;\n");

    let cfg = AuditConfig {
        root: ws.path().to_path_buf(),
        strict: false,
        only_rule: None,
        check_docs_emojis: true,
    };
    let r1 = run_audit(&cfg);
    let r2 = run_audit(&cfg);
    assert_eq!(r1.report_blake3, r2.report_blake3);
    assert_eq!(r1.findings, r2.findings);
}

#[test]
fn distinguishes_synthetic_redaction_test_fixtures_from_live_tokens_arch_008() {
    let ws = TempWorkspace::new("secret_fixtures");
    ws.write(
        "packages/sec/package.json",
        "{\n  \"name\": \"@aphrody/sec\",\n  \"dependencies\": {}\n}\n",
    );
    ws.write(
        "packages/sec/tests/redact.test.ts",
        "const fakeAnthropic = \"sk-ant-api03-SUPERSECRET1234567890ABCDEF\";\n",
    );
    ws.write(
        "packages/sec/src/leak.ts",
        "const liveKey = \"ghp_RealLookingTokenValue9876543210ABCDEF\";\n",
    );

    let report = run_audit(&AuditConfig {
        root: ws.path().to_path_buf(),
        strict: true,
        only_rule: Some("ARCH-008".into()),
        check_docs_emojis: true,
    });

    assert_eq!(report.findings.len(), 1, "got: {:?}", report.findings);
    assert_eq!(report.findings[0].path, "packages/sec/src/leak.ts");
}

#[test]
fn detects_tools_domain_violations_and_stale_atlas_links_arch_011_012() {
    let ws = TempWorkspace::new("tools_and_atlas");
    ws.write(
        "tools/bad-tool/Cargo.toml",
        "[package]\nname = \"bad-tool\"\nversion = \"0.1.0\"\nedition = \"2024\"\n",
    );
    ws.write("tools/bad-tool/src/main.rs", "fn main() {}\n");
    ws.write("tools/bad-tool/stray.ts", "export const bad = 1;\n");

    ws.write(
        "docs/MONOREPO_ATLAS.md",
        "| [deleted-crate](file:///C:/src/crates/deleted-crate) |\n",
    );

    let report = run_audit(&AuditConfig {
        root: ws.path().to_path_buf(),
        strict: true,
        only_rule: None,
        check_docs_emojis: true,
    });

    let ids: Vec<&str> = report.findings.iter().map(|f| f.rule_id.as_str()).collect();
    assert!(
        ids.contains(&"ARCH-011"),
        "expected ARCH-011 finding, got: {ids:?}"
    );
    assert!(
        ids.contains(&"ARCH-012"),
        "expected ARCH-012 finding, got: {ids:?}"
    );
}

#[test]
fn detects_missing_or_invalid_version_in_package_or_crate_arch_013() {
    let ws = TempWorkspace::new("versioning");
    ws.write(
        "packages/no-ver/package.json",
        "{\n  \"name\": \"@aphrody/no-ver\",\n  \"dependencies\": {}\n}\n",
    );
    ws.write(
        "crates/bad-ver/Cargo.toml",
        "[package]\nname = \"bad-ver\"\nversion = \"not-a-semver\"\nedition = \"2024\"\n",
    );
    ws.write("crates/bad-ver/src/lib.rs", "pub fn ok() {}\n");

    let report = run_audit(&AuditConfig {
        root: ws.path().to_path_buf(),
        strict: true,
        only_rule: Some("ARCH-013".into()),
        check_docs_emojis: true,
    });

    assert!(!report.clean);
    let arch013: Vec<_> = report
        .findings
        .iter()
        .filter(|f| f.rule_id == "ARCH-013")
        .collect();
    assert_eq!(
        arch013.len(),
        2,
        "expected 2 versioning findings, got: {arch013:?}"
    );
}

#[test]
fn detects_chromium_deps_non_sha1_and_unnormalized_paths_arch_014() {
    let ws = TempWorkspace::new("chromium_deps");
    ws.write(
        "DEPS",
        "deps = {\n  'apps/aphrody/': 'https://github.com/aphrody-dev/aphrody.git@not-a-40-char-sha',\n}\n",
    );

    let report = run_audit(&AuditConfig {
        root: ws.path().to_path_buf(),
        strict: true,
        only_rule: Some("ARCH-014".into()),
        check_docs_emojis: true,
    });

    assert!(!report.clean);
    let arch014: Vec<_> = report
        .findings
        .iter()
        .filter(|f| f.rule_id == "ARCH-014")
        .collect();
    assert!(
        arch014.len() >= 2,
        "expected trailing slash and non-sha1 findings, got: {arch014:?}"
    );
}

#[test]
fn detects_linux_maintainers_nonexistent_pattern_and_broken_patch_series_arch_015() {
    let ws = TempWorkspace::new("linux_maintainers");
    ws.write(
        "MAINTAINERS",
        "FOO SUBSYSTEM\nM: John Doe <john@example.com>\nS: Supported\nF: crates/non_existent_folder/\n",
    );
    ws.write("docs/patches/series", "missing-patch.patch -p1\n");

    let report = run_audit(&AuditConfig {
        root: ws.path().to_path_buf(),
        strict: true,
        only_rule: Some("ARCH-015".into()),
        check_docs_emojis: true,
    });

    assert!(!report.clean);
    let arch015: Vec<_> = report
        .findings
        .iter()
        .filter(|f| f.rule_id == "ARCH-015")
        .collect();
    assert!(
        arch015.len() >= 2,
        "expected MAINTAINERS F: and patch series findings, got: {arch015:?}"
    );
}

#[test]
fn detects_bun_binding_gyp_and_legacy_postinstall_arch_016() {
    let ws = TempWorkspace::new("bun_speed");
    ws.write(
        "packages/bad-gyp/package.json",
        "{\n  \"name\": \"@aphrody/bad-gyp\",\n  \"version\": \"1.0.0\",\n  \"scripts\": { \"postinstall\": \"node-gyp rebuild\" }\n}\n",
    );
    ws.write("packages/bad-gyp/binding.gyp", "{}\n");

    let report = run_audit(&AuditConfig {
        root: ws.path().to_path_buf(),
        strict: true,
        only_rule: Some("ARCH-016".into()),
        check_docs_emojis: true,
    });

    assert!(!report.clean);
    let arch016: Vec<_> = report
        .findings
        .iter()
        .filter(|f| f.rule_id == "ARCH-016")
        .collect();
    assert_eq!(
        arch016.len(),
        2,
        "expected binding.gyp and postinstall findings, got: {arch016:?}"
    );
}

#[test]
fn detects_upward_layer_dependency_and_cycles_in_graph_arch_017() {
    let ws = TempWorkspace::new("graph_boundaries");
    // Package A depends on Package B, Package B depends on Package A (Cycle)
    ws.write(
        "packages/pkg-a/package.json",
        "{\n  \"name\": \"@aphrody/pkg-a\",\n  \"version\": \"1.0.0\",\n  \"dependencies\": { \"@aphrody/pkg-b\": \"workspace:*\" }\n}\n",
    );
    ws.write(
        "packages/pkg-b/package.json",
        "{\n  \"name\": \"@aphrody/pkg-b\",\n  \"version\": \"1.0.0\",\n  \"dependencies\": { \"@aphrody/pkg-a\": \"workspace:*\" }\n}\n",
    );

    let report = run_audit(&AuditConfig {
        root: ws.path().to_path_buf(),
        strict: true,
        only_rule: Some("ARCH-017".into()),
        check_docs_emojis: true,
    });

    assert!(!report.clean);
    let arch017: Vec<_> = report
        .findings
        .iter()
        .filter(|f| f.rule_id == "ARCH-017")
        .collect();
    assert!(
        !arch017.is_empty(),
        "expected cycle finding in ARCH-017, got: {arch017:?}"
    );
    assert!(
        arch017
            .iter()
            .any(|f| f.message.contains("Cyclic dependency detected"))
    );
}

#[test]
fn generates_architecture_graph_mermaid_dot_and_json() {
    let ws = TempWorkspace::new("graph_export");
    ws.write(
        "crates/unix-uutils/Cargo.toml",
        "[package]\nname = \"unix\"\nversion = \"0.1.0\"\nedition = \"2024\"\n",
    );
    ws.write(
        "packages/core/package.json",
        "{\n  \"name\": \"@aphrody/core\",\n  \"version\": \"1.0.0\",\n  \"dependencies\": {}\n}\n",
    );

    let graph = archguard::build_monorepo_graph(ws.path());
    let mermaid = graph.to_mermaid();
    let dot = graph.to_dot();
    let json = graph.to_json();

    assert!(mermaid.contains("flowchart TD"));
    assert!(dot.contains("digraph MonorepoArchitecture"));
    assert!(json.contains("\"nodes\":"));
}
