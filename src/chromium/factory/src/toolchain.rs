//! Chromium toolchain pinned by `third_party/toolchain-<milestone>.toml` (clang+lld+`llvm-*`, llvm
//! code coverage, llvmobjdump, rust-toolchain; prebuilts repacked as content-addressed .tar.zst on
//! R2). `install` fetches, verifies size + sha256 + blake3, extracts where Chromium's
//! `update.py` / `update_rust.py` would, and writes a stamp; `doctor` checks stamps and binaries.

use std::io::Read as _;
use std::path::{Path, PathBuf};

use serde::Deserialize;

use crate::run::{Cmd, Runner};

#[derive(Debug, Clone, Deserialize)]
pub struct Manifest {
    pub toolchain: Pins,
    #[serde(rename = "file", default)]
    pub files: Vec<File>,
}

#[derive(Debug, Clone, Deserialize)]
pub struct Pins {
    pub chromium: String,
    pub clang_revision: String,
    pub clang_sub_revision: u32,
    pub rust_revision: String,
    pub rust_sub_revision: u32,
    pub clang_version: String,
    pub rustc_version: String,
    pub r2_bucket: String,
}

#[derive(Debug, Clone, Deserialize)]
pub struct File {
    pub platform: String,
    pub package: String,
    pub r2_key: String,
    pub size: u64,
    pub sha256: String,
    pub blake3: String,
}

/// Stamp written next to an installed package: `<package> <blake3>`.
pub const STAMP: &str = ".aphrody-toolchain";

impl Manifest {
    pub fn parse(s: &str) -> Result<Self, String> {
        toml::from_str(s).map_err(|e| format!("toolchain manifest: {e}"))
    }

    pub fn load(p: &Path) -> Result<Self, String> {
        Self::parse(&std::fs::read_to_string(p).map_err(|e| format!("{}: {e}", p.display()))?)
    }

    /// Expected `cr_build_revision` of third_party/llvm-build/Release+Asserts.
    pub fn clang_stamp(&self) -> String {
        format!("{}-{}", self.toolchain.clang_revision, self.toolchain.clang_sub_revision)
    }

    /// Substring expected in third_party/rust-toolchain/VERSION.
    pub fn rust_stamp(&self) -> String {
        format!("{}-{}", self.toolchain.rust_revision, self.toolchain.rust_sub_revision)
    }

    pub fn for_platform(&self, platform: &str) -> Vec<&File> {
        self.files.iter().filter(|f| f.platform == platform).collect()
    }
}

/// Extraction dir under `src/` (same layout as `tools/clang/scripts/update.py` and
/// `tools/rust/update_rust.py`).
pub fn dest(package: &str) -> &'static str {
    if package.starts_with("rust-toolchain-") {
        "third_party/rust-toolchain"
    } else {
        "third_party/llvm-build/Release+Asserts"
    }
}

/// sha256 and blake3 (hex) of a file, one pass.
pub fn hashes(p: &Path) -> Result<(u64, String, String), String> {
    use sha2::Digest as _;
    let mut f = std::fs::File::open(p).map_err(|e| format!("{}: {e}", p.display()))?;
    let (mut s, mut b, mut n) = (sha2::Sha256::new(), blake3::Hasher::new(), 0u64);
    let mut buf = vec![0u8; 1 << 20];
    loop {
        let k = f.read(&mut buf).map_err(|e| format!("{}: {e}", p.display()))?;
        if k == 0 {
            break;
        }
        s.update(&buf[..k]);
        b.update(&buf[..k]);
        n += k as u64;
    }
    Ok((n, hex::encode(s.finalize()), b.finalize().to_hex().to_string()))
}

pub fn verify(p: &Path, f: &File) -> Result<(), String> {
    let (n, sha, b3) = hashes(p)?;
    if n != f.size || sha != f.sha256 || b3 != f.blake3 {
        return Err(format!(
            "{}: size/sha256/blake3 = {n}/{sha}/{b3}, manifest {}/{}/{}",
            p.display(),
            f.size,
            f.sha256,
            f.blake3
        ));
    }
    Ok(())
}

fn stamp_ok(dir: &Path, f: &File) -> bool {
    std::fs::read_to_string(dir.join(STAMP))
        .is_ok_and(|s| s.lines().any(|l| l == format!("{} {}", f.package, f.blake3)))
}

/// Fetch + verify + extract every package of `platform` missing or stale under `src`. Idempotent:
/// a package whose stamp matches is skipped. The clang package replaces Release+Asserts (as
/// update.py does); the others are layered on top.
pub fn install(
    m: &Manifest,
    platform: &str,
    src: &Path,
    cache: &Path,
    remote: &str,
    r: &mut dyn Runner,
) -> Result<Vec<String>, String> {
    let mut done = Vec::new();
    let mut files = m.for_platform(platform);
    if files.is_empty() {
        return Err(format!("no toolchain files for {platform}"));
    }
    // clang first: it resets the directory the others extend.
    files.sort_by_key(|f| !f.package.starts_with("clang-"));
    for f in files {
        let dir = src.join(dest(&f.package));
        if stamp_ok(&dir, f) {
            continue;
        }
        let name = f.r2_key.rsplit('/').next().unwrap_or(&f.r2_key);
        let tar = cache.join(name);
        if r.dry() || hashes(&tar).ok().is_none_or(|(n, s, b)| n != f.size || s != f.sha256 || b != f.blake3) {
            r.run(&Cmd::new("rclone").args([
                "copyto".into(),
                format!("{remote}:{}/{}", m.toolchain.r2_bucket, f.r2_key),
                tar.display().to_string(),
            ]))?;
        }
        if !r.dry() {
            verify(&tar, f)?;
        }
        let fresh = f.package.starts_with("clang-") || f.package.starts_with("rust-toolchain-");
        if fresh && !r.dry() && dir.exists() {
            std::fs::remove_dir_all(&dir).map_err(|e| format!("{}: {e}", dir.display()))?;
        }
        if !r.dry() {
            std::fs::create_dir_all(&dir).map_err(|e| format!("{}: {e}", dir.display()))?;
        }
        r.run(&Cmd::new("tar").args([
            "--zstd".into(),
            "-xf".into(),
            tar.display().to_string(),
            "-C".into(),
            dir.display().to_string(),
        ]))?;
        if !r.dry() {
            let mut s = std::fs::read_to_string(dir.join(STAMP)).unwrap_or_default();
            s.push_str(&format!("{} {}\n", f.package, f.blake3));
            std::fs::write(dir.join(STAMP), s).map_err(|e| e.to_string())?;
        }
        done.push(f.package.clone());
    }
    Ok(done)
}

/// Toolchain findings for `doctor`: (ok, message).
pub fn check(m: &Manifest, src: &Path, r: &mut dyn Runner) -> Vec<(bool, String)> {
    let mut out = Vec::new();
    let llvm = src.join("third_party/llvm-build/Release+Asserts");
    let rust = src.join("third_party/rust-toolchain");
    let rev = std::fs::read_to_string(llvm.join("cr_build_revision")).unwrap_or_default();
    out.push((
        rev.trim() == m.clang_stamp(),
        format!("clang cr_build_revision {:?} (manifest {})", rev.trim(), m.clang_stamp()),
    ));
    let ver = std::fs::read_to_string(rust.join("VERSION")).unwrap_or_default();
    out.push((
        ver.contains(&m.rust_stamp()),
        format!("rust-toolchain VERSION has {}", m.rust_stamp()),
    ));
    let clang = bin_version(r, llvm.join("bin/clang"));
    out.push((
        clang.as_deref().is_some_and(|a| crate::doctor::version_matches(a, &m.toolchain.clang_version)),
        format!("clang --version {:?} (manifest {:?})", clang, m.toolchain.clang_version),
    ));
    let rustc = bin_version(r, rust.join("bin/rustc"));
    out.push((
        rustc.as_deref().is_some_and(|a| crate::doctor::version_matches(a, &m.toolchain.rustc_version)),
        format!("rustc --version {:?} (manifest {:?})", rustc, m.toolchain.rustc_version),
    ));
    for f in m.for_platform("linux-x64") {
        let dir = src.join(dest(&f.package));
        if dir.join(STAMP).exists() {
            out.push((stamp_ok(&dir, f), format!("stamp {} blake3 {}", f.package, &f.blake3[..16])));
        }
    }
    out
}

fn bin_version(r: &mut dyn Runner, bin: PathBuf) -> Option<String> {
    let o = r.output(&Cmd::new(bin.display().to_string()).arg("--version")).ok()?;
    o.lines().next().map(|l| l.trim().to_owned()).filter(|l| !l.is_empty())
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::run::Record;

    const M: &str = r#"
[toolchain]
chromium = "157.0.8103.78"
clang_revision = "llvmorg-24-init-7747-g62397f8b"
clang_sub_revision = 67
rust_revision = "1edd55dc"
rust_sub_revision = 1125
clang_version = "clang version 24.0.0git"
rustc_version = "rustc 1.100.0-nightly"
llvm_version = "24.0.0"
r2_bucket = "aphrody-chromium"
r2_prefix = "toolchain/157/"

[[file]]
platform = "linux-x64"
package = "rust-toolchain-1edd55dc-1125"
r2_key = "toolchain/157/linux-x64/rust.abc.tar.zst"
size = 3
sha256 = "x"
blake3 = "y"

[[file]]
platform = "linux-x64"
package = "clang-llvmorg-24-67"
r2_key = "toolchain/157/linux-x64/clang.def.tar.zst"
size = 3
sha256 = "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad"
blake3 = "6437b3ac38465133ffb63b75273a8db548c558465d79db03fd359c6cd5bd9d85"
"#;

    #[test]
    fn parses_and_maps() {
        let m = Manifest::parse(M).unwrap();
        assert_eq!(m.clang_stamp(), "llvmorg-24-init-7747-g62397f8b-67");
        assert_eq!(m.rust_stamp(), "1edd55dc-1125");
        assert_eq!(m.for_platform("linux-x64").len(), 2);
        assert_eq!(dest("rust-toolchain-1"), "third_party/rust-toolchain");
        assert_eq!(dest("llvmobjdump-x"), "third_party/llvm-build/Release+Asserts");
    }

    #[test]
    fn verifies_hashes() {
        let m = Manifest::parse(M).unwrap();
        let d = tempfile::tempdir().unwrap();
        let p = d.path().join("f");
        std::fs::write(&p, "abc").unwrap();
        verify(&p, &m.files[1]).unwrap();
        assert!(verify(&p, &m.files[0]).is_err());
    }

    #[test]
    fn install_plans_clang_first() {
        let m = Manifest::parse(M).unwrap();
        let d = tempfile::tempdir().unwrap();
        let mut r = Record::default();
        let done = install(&m, "linux-x64", d.path(), d.path(), "r2-chromium", &mut r).unwrap();
        assert_eq!(done[0], "clang-llvmorg-24-67");
        assert_eq!(r.cmds[0].args[1], "r2-chromium:aphrody-chromium/toolchain/157/linux-x64/clang.def.tar.zst");
        assert_eq!(r.cmds.len(), 4);
    }

    #[test]
    fn check_reads_stamps() {
        let m = Manifest::parse(M).unwrap();
        let d = tempfile::tempdir().unwrap();
        let llvm = d.path().join("third_party/llvm-build/Release+Asserts");
        std::fs::create_dir_all(&llvm).unwrap();
        std::fs::write(llvm.join("cr_build_revision"), "llvmorg-24-init-7747-g62397f8b-67\n").unwrap();
        let mut r = Record { replies: vec![("clang".into(), "clang version 24.0.0git\nTarget: x".into())], ..Default::default() };
        let c = check(&m, d.path(), &mut r);
        assert!(c[0].0 && !c[1].0 && c[2].0 && !c[3].0);
    }
}
