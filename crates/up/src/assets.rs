//! Content-hashed asset manifests for wasm and CDN files published to R2.
//!
//! Every file under a build directory gets an immutable key `<stem>.<hash12>.<ext>` (first 12
//! hex chars of its sha256), so uploads never overwrite a live object and caches can be
//! `immutable`. `manifest.json` maps logical paths to those keys; it is the only object that
//! changes per release. Uploading is left to `wrangler r2 object put` (docs/INSTALL_UPDATE.md).

use crate::fetch::sha256_hex;
use serde::Serialize;
use std::collections::BTreeMap;
use std::path::Path;

pub const SCHEMA: u32 = 1;

#[derive(Debug, Clone, Serialize, PartialEq)]
pub struct Asset {
    /// Immutable object key: `<dir>/<stem>.<hash12>.<ext>`.
    pub key: String,
    pub sha256: String,
    pub size: u64,
    pub content_type: &'static str,
}

#[derive(Debug, Clone, Serialize, PartialEq)]
pub struct AssetManifest {
    pub schema: u32,
    /// Release label, e.g. the app version or commit.
    pub release: String,
    /// Logical path (forward slashes) -> asset.
    pub assets: BTreeMap<String, Asset>,
}

pub fn content_type(path: &str) -> &'static str {
    match path
        .rsplit('.')
        .next()
        .unwrap_or("")
        .to_ascii_lowercase()
        .as_str()
    {
        "wasm" => "application/wasm",
        "js" | "mjs" => "text/javascript",
        "css" => "text/css",
        "html" => "text/html",
        "json" | "map" => "application/json",
        "svg" => "image/svg+xml",
        "png" => "image/png",
        "jpg" | "jpeg" => "image/jpeg",
        "webp" => "image/webp",
        "avif" => "image/avif",
        "woff2" => "font/woff2",
        "txt" => "text/plain",
        _ => "application/octet-stream",
    }
}

/// `pkg/app_bg.wasm` + hash -> `pkg/app_bg.<hash12>.wasm`.
pub fn hashed_key(logical: &str, sha256: &str) -> String {
    let short = &sha256[..12.min(sha256.len())];
    let (dir, file) = match logical.rsplit_once('/') {
        Some((d, f)) => (format!("{d}/"), f),
        None => (String::new(), logical),
    };
    match file.rsplit_once('.') {
        Some((stem, ext)) if !stem.is_empty() => format!("{dir}{stem}.{short}.{ext}"),
        _ => format!("{dir}{file}.{short}"),
    }
}

/// Hash every regular file under `dir` (sorted, deterministic).
pub fn plan(dir: &Path, release: &str) -> Result<AssetManifest, String> {
    let mut assets = BTreeMap::new();
    let mut stack = vec![dir.to_path_buf()];
    while let Some(current) = stack.pop() {
        let entries =
            std::fs::read_dir(&current).map_err(|e| format!("{}: {e}", current.display()))?;
        for entry in entries.flatten() {
            let path = entry.path();
            let ft = entry.file_type().map_err(|e| e.to_string())?;
            if ft.is_dir() {
                stack.push(path);
            } else if ft.is_file() {
                let rel = path
                    .strip_prefix(dir)
                    .map_err(|e| e.to_string())?
                    .to_string_lossy()
                    .replace('\\', "/");
                if rel == "manifest.json" {
                    continue;
                }
                let data = std::fs::read(&path).map_err(|e| format!("{}: {e}", path.display()))?;
                let sha256 = sha256_hex(&data);
                let asset = Asset {
                    key: hashed_key(&rel, &sha256),
                    size: data.len() as u64,
                    content_type: content_type(&rel),
                    sha256,
                };
                assets.insert(rel, asset);
            }
        }
    }
    Ok(AssetManifest {
        schema: SCHEMA,
        release: release.to_string(),
        assets,
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn keys_carry_the_hash() {
        let h = "0123456789abcdef".repeat(4);
        assert_eq!(
            hashed_key("pkg/app_bg.wasm", &h),
            "pkg/app_bg.0123456789ab.wasm"
        );
        assert_eq!(hashed_key("app.min.js", &h), "app.min.0123456789ab.js");
        assert_eq!(hashed_key("LICENSE", &h), "LICENSE.0123456789ab");
        assert_eq!(hashed_key(".nojekyll", &h), ".nojekyll.0123456789ab");
    }

    #[test]
    fn plan_is_deterministic_and_skips_the_manifest() {
        let dir = tempfile::tempdir().unwrap();
        std::fs::create_dir_all(dir.path().join("pkg")).unwrap();
        std::fs::write(dir.path().join("pkg/app_bg.wasm"), b"\0asm").unwrap();
        std::fs::write(dir.path().join("index.js"), b"export {}").unwrap();
        std::fs::write(dir.path().join("manifest.json"), b"{}").unwrap();
        let a = plan(dir.path(), "v1").unwrap();
        let b = plan(dir.path(), "v1").unwrap();
        assert_eq!(a, b);
        assert_eq!(
            a.assets.keys().collect::<Vec<_>>(),
            vec!["index.js", "pkg/app_bg.wasm"]
        );
        let wasm = &a.assets["pkg/app_bg.wasm"];
        assert_eq!(wasm.content_type, "application/wasm");
        assert_eq!(wasm.size, 4);
        assert!(wasm.key.starts_with("pkg/app_bg.") && wasm.key.ends_with(".wasm"));
        assert_eq!(wasm.sha256, sha256_hex(b"\0asm"));
    }
}
