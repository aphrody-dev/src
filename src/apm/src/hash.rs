//! Content hashing, ported from `apm_cli/utils/content_hash.py`.

use std::fs;
use std::path::Path;
use std::path::PathBuf;

use sha2::Digest;
use sha2::Sha256;

const EXCLUDED_DIRS: [&str; 2] = [".git", "__pycache__"];
/// Cache-pin marker excluded at the package root (`install/cache_pin.py`).
pub const PIN_MARKER: &str = ".apm-pin";

pub fn sha256_hex(bytes: &[u8]) -> String {
    let d = Sha256::digest(bytes);
    d.iter().map(|b| format!("{b:02x}")).collect()
}

/// Empty/missing package hash: `sha256:` + sha256(b"").
pub fn empty_hash() -> String {
    format!("sha256:{}", sha256_hex(b""))
}

/// Sorted package-relative regular files (posix), skipping symlinks, `.git`, `__pycache__`.
pub fn package_files(root: &Path) -> Vec<String> {
    fn walk(dir: &Path, rel: &str, out: &mut Vec<String>) {
        let Ok(rd) = fs::read_dir(dir) else { return };
        for entry in rd.flatten() {
            let name = entry.file_name().to_string_lossy().into_owned();
            let Ok(ft) = entry.file_type() else { continue };
            if ft.is_symlink() {
                continue;
            }
            let child_rel = if rel.is_empty() {
                name.clone()
            } else {
                format!("{rel}/{name}")
            };
            if ft.is_dir() {
                if EXCLUDED_DIRS.contains(&name.as_str()) {
                    continue;
                }
                walk(&entry.path(), &child_rel, out);
            } else if ft.is_file() {
                if rel.is_empty() && name == PIN_MARKER {
                    continue;
                }
                out.push(child_rel);
            }
        }
    }
    let mut out = Vec::new();
    walk(root, "", &mut out);
    out.sort();
    out
}

/// `compute_package_hash`: sha256 over (posix rel path bytes + raw file bytes) for each sorted file.
pub fn package_hash(root: &Path) -> String {
    if !root.is_dir() {
        return empty_hash();
    }
    let files = package_files(root);
    if files.is_empty() {
        return empty_hash();
    }
    let mut h = Sha256::new();
    for rel in &files {
        h.update(rel.as_bytes());
        h.update(fs::read(root.join(rel)).unwrap_or_default());
    }
    format!(
        "sha256:{}",
        h.finalize()
            .iter()
            .map(|b| format!("{b:02x}"))
            .collect::<String>()
    )
}

/// Canonical bytes for per-file hashing: UTF-8 text without NUL gets CRLF -> LF.
pub fn canonical_hash_bytes(raw: &[u8]) -> Vec<u8> {
    if raw.contains(&0) {
        return raw.to_vec();
    }
    match std::str::from_utf8(raw) {
        Ok(text) => text.replace("\r\n", "\n").into_bytes(),
        Err(_) => raw.to_vec(),
    }
}

/// `compute_file_hash`: `sha256:<hex>` of the line-ending-normalized content.
pub fn file_hash(path: &Path) -> std::io::Result<String> {
    let raw = fs::read(path)?;
    Ok(format!(
        "sha256:{}",
        sha256_hex(&canonical_hash_bytes(&raw))
    ))
}

/// Collect all regular files below `dir` (absolute), sorted.
pub fn files_under(dir: &Path) -> Vec<PathBuf> {
    package_files(dir)
        .into_iter()
        .map(|r| dir.join(r))
        .collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    // Ported from tests/unit/test_content_hash.py
    #[test]
    fn empty_dir_and_missing_dir_hash_to_empty() {
        let t = tempfile::tempdir().unwrap();
        assert_eq!(package_hash(t.path()), empty_hash());
        assert_eq!(package_hash(&t.path().join("nope")), empty_hash());
    }

    #[test]
    fn hash_is_deterministic_and_content_sensitive() {
        let t = tempfile::tempdir().unwrap();
        fs::write(t.path().join("a.md"), "a").unwrap();
        fs::create_dir(t.path().join("sub")).unwrap();
        fs::write(t.path().join("sub/b.md"), "b").unwrap();
        let h1 = package_hash(t.path());
        assert_eq!(h1, package_hash(t.path()));
        assert!(h1.starts_with("sha256:") && h1.len() == 71);
        fs::write(t.path().join("a.md"), "changed").unwrap();
        assert_ne!(h1, package_hash(t.path()));
    }

    #[test]
    fn git_pycache_and_root_pin_are_excluded() {
        let t = tempfile::tempdir().unwrap();
        fs::write(t.path().join("a.md"), "a").unwrap();
        let h = package_hash(t.path());
        fs::create_dir(t.path().join(".git")).unwrap();
        fs::write(t.path().join(".git/HEAD"), "x").unwrap();
        fs::create_dir(t.path().join("__pycache__")).unwrap();
        fs::write(t.path().join("__pycache__/m.pyc"), "x").unwrap();
        fs::write(t.path().join(PIN_MARKER), "pin").unwrap();
        assert_eq!(h, package_hash(t.path()));
        fs::create_dir(t.path().join("sub")).unwrap();
        fs::write(t.path().join("sub").join(PIN_MARKER), "pin").unwrap();
        assert_ne!(h, package_hash(t.path()));
    }

    #[test]
    fn file_hash_normalizes_crlf_but_not_binary_or_bare_cr() {
        let t = tempfile::tempdir().unwrap();
        let (a, b, c, d) = (
            t.path().join("a"),
            t.path().join("b"),
            t.path().join("c"),
            t.path().join("d"),
        );
        fs::write(&a, "x\r\ny\r\n").unwrap();
        fs::write(&b, "x\ny\n").unwrap();
        fs::write(&c, "x\ry").unwrap();
        fs::write(&d, b"\0x\r\n").unwrap();
        assert_eq!(file_hash(&a).unwrap(), file_hash(&b).unwrap());
        assert_ne!(
            file_hash(&c).unwrap(),
            format!("sha256:{}", sha256_hex(b"x\ny"))
        );
        assert_eq!(
            file_hash(&d).unwrap(),
            format!("sha256:{}", sha256_hex(b"\0x\r\n"))
        );
    }
}
