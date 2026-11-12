//! Workspace inheritance (`edition.workspace = true`) is accepted only when the
//! root `[workspace.package]` value itself satisfies the rule.

use archguard::constants::{manifest_inherits, workspace_package_value};
use std::fs;

#[test]
fn detects_dotted_and_inline_inheritance() {
    assert!(manifest_inherits(
        "[package]\nedition.workspace = true\n",
        "edition"
    ));
    assert!(manifest_inherits(
        "[package]\nversion = { workspace = true }\n",
        "version"
    ));
    assert!(!manifest_inherits(
        "[package]\nedition = \"2024\"\n",
        "edition"
    ));
    assert!(!manifest_inherits(
        "# edition.workspace = true\n",
        "edition"
    ));
    assert!(!manifest_inherits(
        "[package]\nversion.workspace = true\n",
        "edition"
    ));
}

#[test]
fn reads_only_the_workspace_package_table() {
    let dir = std::env::temp_dir().join(format!("archguard-ws-{}", std::process::id()));
    fs::create_dir_all(&dir).unwrap();
    fs::write(
        dir.join("Cargo.toml"),
        "[workspace]\nmembers = []\n\n[package]\nedition = \"2021\"\n\n[workspace.package]\nversion = \"0.2.0\"\nedition = \"2024\"\n",
    )
    .unwrap();
    assert_eq!(
        workspace_package_value(&dir, "edition").as_deref(),
        Some("2024")
    );
    assert_eq!(
        workspace_package_value(&dir, "version").as_deref(),
        Some("0.2.0")
    );
    assert_eq!(workspace_package_value(&dir, "rust-version"), None);

    fs::write(
        dir.join("Cargo.toml"),
        "[workspace.package]\nedition = \"2021\"\n",
    )
    .unwrap();
    assert_eq!(
        workspace_package_value(&dir, "edition").as_deref(),
        Some("2021")
    );
    fs::remove_dir_all(&dir).unwrap();
}
