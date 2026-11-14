//! Content-addressed artifact store, after EpicGames/lore's storage layer.
//!
//! What is taken from Lore (`lore-storage`, MIT):
//! - Files are cut into content-defined fragments with `fastcdc::v2020` at Lore's
//!   parameters (32 KiB minimum, 64 KiB expected, 256 KiB maximum, normalization
//!   level 1), so a fragment boundary here is a fragment boundary in Lore.
//! - Fragments are named by their blake3 hash, stored once, zstd-compressed at
//!   Lore's default level (6), and never rewritten (immutable store).
//! - A file is a manifest: the ordered fragment list. Materializing a file from the
//!   store ("hydration") needs no network.
//!
//! What is added for depot_tools: manifests are indexed by the file's sha256, the
//! id that DEPS GCS entries, CIPD and `ay up` already pin. Two Chromium checkouts,
//! or two sysroot versions that share most of their bytes, share fragments.
//!
//! Layout under the root: `fragments/<2 hex>/<64 hex>` (zstd frames) and
//! `files/<sha256>` (text manifest: `sha256 size` header, then `blake3 length` lines).

use std::fs::{self, File};
use std::io::{self, BufReader, BufWriter, Read, Write};
use std::path::{Path, PathBuf};

use sha2::{Digest, Sha256};

/// Lore `FRAGMENT_SIZE_MINIMUM` (lore-storage/src/concurrency.rs).
pub const FRAGMENT_MIN: u32 = 32 * 1024;
/// Lore `FRAGMENT_SIZE_EXPECTED` (lore-base/src/types/mod.rs).
pub const FRAGMENT_AVG: u32 = 64 * 1024;
/// Lore `FRAGMENT_SIZE_THRESHOLD` (lore-base/src/types/mod.rs).
pub const FRAGMENT_MAX: u32 = 256 * 1024;
/// Lore `ZSTD_DEFAULT_LEVEL` (lore-storage/src/compress.rs).
pub const ZSTD_LEVEL: i32 = 6;

/// One fragment of a file.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Fragment {
    pub id: blake3::Hash,
    pub len: u32,
}

/// A file as an ordered list of fragments.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Manifest {
    pub sha256: String,
    pub size: u64,
    pub fragments: Vec<Fragment>,
}

/// What an ingest added to the store.
#[derive(Debug, Default, Clone, Copy, PartialEq, Eq)]
pub struct IngestStats {
    pub fragments: usize,
    /// Fragments already present (deduplicated).
    pub reused: usize,
    pub bytes: u64,
}

pub struct Store {
    root: PathBuf,
}

/// `$DEPOT_CAS`, else `%LOCALAPPDATA%\depot_tools\cas` (next to the gclient git cache),
/// else `$XDG_CACHE_HOME/depot_tools/cas`, else `~/.cache/depot_tools/cas`.
pub fn default_root() -> PathBuf {
    if let Some(p) = std::env::var_os("DEPOT_CAS").filter(|v| !v.is_empty()) {
        return PathBuf::from(p);
    }
    let base = if cfg!(windows) {
        std::env::var_os("LOCALAPPDATA").map(PathBuf::from)
    } else {
        std::env::var_os("XDG_CACHE_HOME")
            .map(PathBuf::from)
            .or_else(|| std::env::var_os("HOME").map(|h| PathBuf::from(h).join(".cache")))
    };
    base.unwrap_or_else(std::env::temp_dir)
        .join("depot_tools")
        .join("cas")
}

pub fn sha256_file(path: &Path) -> io::Result<(String, u64)> {
    let mut f = BufReader::with_capacity(1 << 20, File::open(path)?);
    let mut h = Sha256::new();
    let mut buf = vec![0u8; 1 << 20];
    let mut n = 0u64;
    loop {
        let r = f.read(&mut buf)?;
        if r == 0 {
            break;
        }
        h.update(&buf[..r]);
        n += r as u64;
    }
    Ok((hex(&h.finalize()), n))
}

fn hex(bytes: &[u8]) -> String {
    const D: &[u8; 16] = b"0123456789abcdef";
    let mut s = String::with_capacity(bytes.len() * 2);
    for b in bytes {
        s.push(D[(b >> 4) as usize] as char);
        s.push(D[(b & 15) as usize] as char);
    }
    s
}

fn valid_sha256(s: &str) -> bool {
    s.len() == 64
        && s.bytes()
            .all(|b| b.is_ascii_hexdigit() && !b.is_ascii_uppercase())
}

fn bad(msg: impl Into<String>) -> io::Error {
    io::Error::new(io::ErrorKind::InvalidData, msg.into())
}

/// Write `data` to `dest` through a sibling temp file and a rename, so readers never
/// see a partial object.
fn write_atomic(
    dest: &Path,
    write: impl FnOnce(&mut BufWriter<File>) -> io::Result<()>,
) -> io::Result<()> {
    let dir = dest.parent().ok_or_else(|| bad("no parent directory"))?;
    fs::create_dir_all(dir)?;
    let tmp = dir.join(format!(
        ".tmp-{}-{}",
        std::process::id(),
        dest.file_name().and_then(|n| n.to_str()).unwrap_or("obj")
    ));
    {
        let mut w = BufWriter::new(File::create(&tmp)?);
        write(&mut w)?;
        w.flush()?;
    }
    match fs::rename(&tmp, dest) {
        Ok(()) => Ok(()),
        // Another writer stored the same immutable object first.
        Err(_) if dest.exists() => fs::remove_file(&tmp),
        Err(e) => {
            let _ = fs::remove_file(&tmp);
            Err(e)
        }
    }
}

impl Store {
    pub fn open(root: impl Into<PathBuf>) -> io::Result<Store> {
        let root = root.into();
        fs::create_dir_all(root.join("fragments"))?;
        fs::create_dir_all(root.join("files"))?;
        Ok(Store { root })
    }

    pub fn root(&self) -> &Path {
        &self.root
    }

    fn fragment_path(&self, id: &blake3::Hash) -> PathBuf {
        let h = id.to_hex();
        self.root.join("fragments").join(&h[..2]).join(h.as_str())
    }

    fn manifest_path(&self, sha256: &str) -> PathBuf {
        self.root.join("files").join(sha256)
    }

    /// Cut `path` into fragments, store the new ones and index the file by sha256.
    pub fn ingest(&self, path: &Path) -> io::Result<(Manifest, IngestStats)> {
        let reader = BufReader::with_capacity(1 << 20, File::open(path)?);
        let chunker = fastcdc::v2020::StreamCDC::with_level(
            reader,
            FRAGMENT_MIN as usize,
            FRAGMENT_AVG as usize,
            FRAGMENT_MAX as usize,
            fastcdc::v2020::Normalization::Level1,
        );
        let mut sha = Sha256::new();
        let mut stats = IngestStats::default();
        let mut fragments = Vec::new();
        let mut size = 0u64;
        for chunk in chunker {
            let chunk = chunk.map_err(|e| io::Error::other(e.to_string()))?;
            sha.update(&chunk.data);
            size += chunk.length as u64;
            let id = blake3::hash(&chunk.data);
            let dest = self.fragment_path(&id);
            stats.fragments += 1;
            stats.bytes += chunk.length as u64;
            if dest.exists() {
                stats.reused += 1;
            } else {
                let packed = zstd::bulk::compress(&chunk.data, ZSTD_LEVEL)?;
                write_atomic(&dest, |w| w.write_all(&packed))?;
            }
            fragments.push(Fragment {
                id,
                len: chunk.length as u32,
            });
        }
        let manifest = Manifest {
            sha256: hex(&sha.finalize()),
            size,
            fragments,
        };
        self.write_manifest(&manifest)?;
        Ok((manifest, stats))
    }

    fn write_manifest(&self, m: &Manifest) -> io::Result<()> {
        let dest = self.manifest_path(&m.sha256);
        if dest.exists() {
            return Ok(());
        }
        write_atomic(&dest, |w| {
            writeln!(w, "{} {}", m.sha256, m.size)?;
            for f in &m.fragments {
                writeln!(w, "{} {}", f.id.to_hex(), f.len)?;
            }
            Ok(())
        })
    }

    /// The manifest for a file with this sha256, when every fragment is present.
    pub fn lookup(&self, sha256: &str) -> Option<Manifest> {
        if !valid_sha256(sha256) {
            return None;
        }
        let text = fs::read_to_string(self.manifest_path(sha256)).ok()?;
        let mut lines = text.lines();
        let (sha, size) = lines.next()?.split_once(' ')?;
        if sha != sha256 {
            return None;
        }
        let size: u64 = size.parse().ok()?;
        let mut fragments = Vec::new();
        for line in lines {
            let (id, len) = line.split_once(' ')?;
            let f = Fragment {
                id: blake3::Hash::from_hex(id).ok()?,
                len: len.parse().ok()?,
            };
            if !self.fragment_path(&f.id).is_file() {
                return None;
            }
            fragments.push(f);
        }
        let total: u64 = fragments.iter().map(|f| f.len as u64).sum();
        (total == size).then_some(Manifest {
            sha256: sha256.to_string(),
            size,
            fragments,
        })
    }

    /// Write the file with this sha256 to `dest`, verifying every fragment and the
    /// whole-file hash. Returns `false` when the store does not have it.
    pub fn hydrate(&self, sha256: &str, dest: &Path) -> io::Result<bool> {
        let Some(m) = self.lookup(sha256) else {
            return Ok(false);
        };
        let mut sha = Sha256::new();
        write_atomic(dest, |w| {
            for f in &m.fragments {
                let packed = fs::read(self.fragment_path(&f.id))?;
                let data = zstd::bulk::decompress(&packed, f.len as usize)?;
                if data.len() != f.len as usize || blake3::hash(&data) != f.id {
                    return Err(bad(format!("corrupt fragment {}", f.id.to_hex())));
                }
                sha.update(&data);
                w.write_all(&data)?;
            }
            Ok(())
        })?;
        if hex(&sha.finalize()) != m.sha256 {
            let _ = fs::remove_file(dest);
            return Err(bad(format!("hydrated file does not match sha256 {sha256}")));
        }
        Ok(true)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    /// Deterministic pseudo-random bytes (xorshift), so boundaries are content-defined.
    fn noise(seed: u64, n: usize) -> Vec<u8> {
        let mut x = seed | 1;
        (0..n)
            .map(|_| {
                x ^= x << 13;
                x ^= x >> 7;
                x ^= x << 17;
                x as u8
            })
            .collect()
    }

    #[test]
    fn boundaries_match_whole_buffer_fastcdc() {
        let data = noise(7, 3 << 20);
        let dir = tempfile::tempdir().unwrap();
        let file = dir.path().join("blob");
        fs::write(&file, &data).unwrap();
        let store = Store::open(dir.path().join("cas")).unwrap();
        let (m, _) = store.ingest(&file).unwrap();
        let whole: Vec<u32> = fastcdc::v2020::FastCDC::with_level(
            &data,
            FRAGMENT_MIN as usize,
            FRAGMENT_AVG as usize,
            FRAGMENT_MAX as usize,
            fastcdc::v2020::Normalization::Level1,
        )
        .map(|c| c.length as u32)
        .collect();
        assert_eq!(m.fragments.iter().map(|f| f.len).collect::<Vec<_>>(), whole);
        assert!(m.fragments.iter().all(|f| f.len <= FRAGMENT_MAX));
    }

    #[test]
    fn ingest_hydrate_roundtrip_and_dedup() {
        let dir = tempfile::tempdir().unwrap();
        let store = Store::open(dir.path().join("cas")).unwrap();
        let a = noise(1, 2 << 20);
        // b = a with 100 bytes inserted in the middle: most fragments are shared.
        let mut b = a[..1 << 20].to_vec();
        b.extend_from_slice(&noise(2, 100));
        b.extend_from_slice(&a[1 << 20..]);
        let (fa, fb) = (dir.path().join("a"), dir.path().join("b"));
        fs::write(&fa, &a).unwrap();
        fs::write(&fb, &b).unwrap();
        let (ma, sa) = store.ingest(&fa).unwrap();
        let (mb, sb) = store.ingest(&fb).unwrap();
        assert_eq!(sa.reused, 0);
        assert!(sb.reused * 2 > sb.fragments, "{sb:?}");
        assert_eq!(ma.sha256, sha256_file(&fa).unwrap().0);

        let out = dir.path().join("out/b");
        assert!(store.hydrate(&mb.sha256, &out).unwrap());
        assert_eq!(fs::read(&out).unwrap(), b);
        assert!(!store.hydrate(&"0".repeat(64), &out).unwrap());
        assert!(store.lookup("not-a-hash").is_none());
    }

    #[test]
    fn corrupt_fragment_is_rejected() {
        let dir = tempfile::tempdir().unwrap();
        let store = Store::open(dir.path().join("cas")).unwrap();
        let f = dir.path().join("f");
        fs::write(&f, noise(3, 100_000)).unwrap();
        let (m, _) = store.ingest(&f).unwrap();
        let frag = store.fragment_path(&m.fragments[0].id);
        fs::write(
            &frag,
            zstd::bulk::compress(&noise(4, m.fragments[0].len as usize), 1).unwrap(),
        )
        .unwrap();
        assert!(store.hydrate(&m.sha256, &dir.path().join("x")).is_err());
    }

    #[test]
    fn empty_file() {
        let dir = tempfile::tempdir().unwrap();
        let store = Store::open(dir.path().join("cas")).unwrap();
        let f = dir.path().join("e");
        fs::write(&f, b"").unwrap();
        let (m, _) = store.ingest(&f).unwrap();
        assert_eq!(m.size, 0);
        let out = dir.path().join("e2");
        assert!(store.hydrate(&m.sha256, &out).unwrap());
        assert_eq!(fs::read(&out).unwrap(), b"");
    }
}
