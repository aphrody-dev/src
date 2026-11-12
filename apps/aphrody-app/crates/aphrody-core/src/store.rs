//! Content-addressed Blake3 block store, WAL journal and path-based VFS behind
//! a [`Storage`] trait. Backends: [`MemStorage`] everywhere, [`FileStorage`]
//! natively; the wasm crate provides an OPFS backend.

use crate::MaybeSend;
use serde::{Deserialize, Serialize};
use std::collections::BTreeMap;

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum StorageError {
    Io(String),
    InvalidKey(String),
    NotFound(String),
    Corrupt(String),
    Invalid(String),
}

impl core::fmt::Display for StorageError {
    fn fmt(&self, f: &mut core::fmt::Formatter<'_>) -> core::fmt::Result {
        match self {
            StorageError::Io(s) => write!(f, "io error: {s}"),
            StorageError::InvalidKey(s) => write!(f, "invalid key: {s}"),
            StorageError::NotFound(s) => write!(f, "not found: {s}"),
            StorageError::Corrupt(s) => write!(f, "corrupt data: {s}"),
            StorageError::Invalid(s) => write!(f, "invalid argument: {s}"),
        }
    }
}

impl std::error::Error for StorageError {}
pub type StorageResult<T> = Result<T, StorageError>;

/// Flat key/value storage with `/`-separated keys.
pub trait Storage: MaybeSend {
    fn get(&self, key: &str) -> StorageResult<Option<Vec<u8>>>;
    fn put(&mut self, key: &str, value: &[u8]) -> StorageResult<()>;
    fn append(&mut self, key: &str, value: &[u8]) -> StorageResult<()>;
    fn delete(&mut self, key: &str) -> StorageResult<bool>;
    fn list(&self, prefix: &str) -> StorageResult<Vec<String>>;
    fn flush(&mut self) -> StorageResult<()> {
        Ok(())
    }
}

impl<T: Storage + ?Sized> Storage for Box<T> {
    fn get(&self, key: &str) -> StorageResult<Option<Vec<u8>>> {
        (**self).get(key)
    }
    fn put(&mut self, key: &str, value: &[u8]) -> StorageResult<()> {
        (**self).put(key, value)
    }
    fn append(&mut self, key: &str, value: &[u8]) -> StorageResult<()> {
        (**self).append(key, value)
    }
    fn delete(&mut self, key: &str) -> StorageResult<bool> {
        (**self).delete(key)
    }
    fn list(&self, prefix: &str) -> StorageResult<Vec<String>> {
        (**self).list(prefix)
    }
    fn flush(&mut self) -> StorageResult<()> {
        (**self).flush()
    }
}

pub fn validate_key(key: &str) -> StorageResult<()> {
    let bad = key.is_empty()
        || key.starts_with('/')
        || key.ends_with('/')
        || key.contains(['\\', ':', '\0'])
        || key.split('/').any(|s| s.is_empty() || s == "." || s == "..");
    if bad { Err(StorageError::InvalidKey(key.to_string())) } else { Ok(()) }
}

#[derive(Default, Clone, Debug)]
pub struct MemStorage {
    map: BTreeMap<String, Vec<u8>>,
}

impl MemStorage {
    pub fn new() -> Self {
        Self::default()
    }
    pub fn len(&self) -> usize {
        self.map.len()
    }
    pub fn is_empty(&self) -> bool {
        self.map.is_empty()
    }
}

impl Storage for MemStorage {
    fn get(&self, key: &str) -> StorageResult<Option<Vec<u8>>> {
        validate_key(key)?;
        Ok(self.map.get(key).cloned())
    }
    fn put(&mut self, key: &str, value: &[u8]) -> StorageResult<()> {
        validate_key(key)?;
        self.map.insert(key.to_string(), value.to_vec());
        Ok(())
    }
    fn append(&mut self, key: &str, value: &[u8]) -> StorageResult<()> {
        validate_key(key)?;
        self.map.entry(key.to_string()).or_default().extend_from_slice(value);
        Ok(())
    }
    fn delete(&mut self, key: &str) -> StorageResult<bool> {
        validate_key(key)?;
        Ok(self.map.remove(key).is_some())
    }
    fn list(&self, prefix: &str) -> StorageResult<Vec<String>> {
        Ok(self.map.keys().filter(|k| k.starts_with(prefix)).cloned().collect())
    }
}

#[cfg(not(target_arch = "wasm32"))]
pub use file::FileStorage;

#[cfg(not(target_arch = "wasm32"))]
mod file {
    use super::*;
    use std::fs;
    use std::io::Write;
    use std::path::{Path, PathBuf};

    /// Directory-backed storage. `put` writes a temp file then renames it.
    #[derive(Debug, Clone)]
    pub struct FileStorage {
        root: PathBuf,
    }

    fn io<E: std::fmt::Display>(e: E) -> StorageError {
        StorageError::Io(e.to_string())
    }

    impl FileStorage {
        pub fn open(root: impl Into<PathBuf>) -> StorageResult<Self> {
            let root = root.into();
            fs::create_dir_all(&root).map_err(io)?;
            Ok(FileStorage { root })
        }

        fn path(&self, key: &str) -> StorageResult<PathBuf> {
            validate_key(key)?;
            Ok(key.split('/').fold(self.root.clone(), |p, s| p.join(s)))
        }

        fn walk(dir: &Path, prefix: &str, out: &mut Vec<String>) -> StorageResult<()> {
            let Ok(rd) = fs::read_dir(dir) else { return Ok(()) };
            for e in rd {
                let e = e.map_err(io)?;
                let name = e.file_name().to_string_lossy().to_string();
                if name.ends_with(".tmp") {
                    continue;
                }
                let key = if prefix.is_empty() { name } else { format!("{prefix}/{name}") };
                if e.file_type().map_err(io)?.is_dir() {
                    Self::walk(&e.path(), &key, out)?;
                } else {
                    out.push(key);
                }
            }
            Ok(())
        }
    }

    impl Storage for FileStorage {
        fn get(&self, key: &str) -> StorageResult<Option<Vec<u8>>> {
            match fs::read(self.path(key)?) {
                Ok(b) => Ok(Some(b)),
                Err(e) if e.kind() == std::io::ErrorKind::NotFound => Ok(None),
                Err(e) => Err(io(e)),
            }
        }
        fn put(&mut self, key: &str, value: &[u8]) -> StorageResult<()> {
            let p = self.path(key)?;
            if let Some(parent) = p.parent() {
                fs::create_dir_all(parent).map_err(io)?;
            }
            let tmp = p.with_extension("tmp");
            fs::write(&tmp, value).map_err(io)?;
            fs::rename(&tmp, &p).map_err(io)
        }
        fn append(&mut self, key: &str, value: &[u8]) -> StorageResult<()> {
            let p = self.path(key)?;
            if let Some(parent) = p.parent() {
                fs::create_dir_all(parent).map_err(io)?;
            }
            let mut f = fs::OpenOptions::new().create(true).append(true).open(p).map_err(io)?;
            f.write_all(value).map_err(io)?;
            f.sync_data().map_err(io)
        }
        fn delete(&mut self, key: &str) -> StorageResult<bool> {
            match fs::remove_file(self.path(key)?) {
                Ok(()) => Ok(true),
                Err(e) if e.kind() == std::io::ErrorKind::NotFound => Ok(false),
                Err(e) => Err(io(e)),
            }
        }
        fn list(&self, prefix: &str) -> StorageResult<Vec<String>> {
            let mut out = Vec::new();
            Self::walk(&self.root, "", &mut out)?;
            out.retain(|k| k.starts_with(prefix));
            out.sort();
            Ok(out)
        }
    }
}

// --------------------------------------------------------------------- Hash

#[derive(Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct Hash(pub [u8; 32]);

impl Hash {
    pub fn of(data: &[u8]) -> Hash {
        Hash(*blake3::hash(data).as_bytes())
    }
    pub fn to_hex(&self) -> String {
        const H: &[u8; 16] = b"0123456789abcdef";
        let mut s = String::with_capacity(64);
        for b in self.0 {
            s.push(H[(b >> 4) as usize] as char);
            s.push(H[(b & 15) as usize] as char);
        }
        s
    }
    pub fn from_hex(s: &str) -> Option<Hash> {
        if s.len() != 64 || !s.is_ascii() {
            return None;
        }
        let mut out = [0u8; 32];
        for (i, o) in out.iter_mut().enumerate() {
            *o = u8::from_str_radix(&s[i * 2..i * 2 + 2], 16).ok()?;
        }
        Some(Hash(out))
    }
}

impl core::fmt::Debug for Hash {
    fn fmt(&self, f: &mut core::fmt::Formatter<'_>) -> core::fmt::Result {
        write!(f, "Hash({})", &self.to_hex()[..12])
    }
}

impl Serialize for Hash {
    fn serialize<S: serde::Serializer>(&self, s: S) -> Result<S::Ok, S::Error> {
        s.serialize_str(&self.to_hex())
    }
}

impl<'de> Deserialize<'de> for Hash {
    fn deserialize<D: serde::Deserializer<'de>>(d: D) -> Result<Self, D::Error> {
        let s = String::deserialize(d)?;
        Hash::from_hex(&s).ok_or_else(|| serde::de::Error::custom("bad hash hex"))
    }
}

// ---------------------------------------------------------------- BlockStore

pub const CHUNK_SIZE: usize = 64 * 1024;
const MANIFEST_MAGIC: &[u8; 4] = b"APHM";

pub struct BlockStore<S: Storage> {
    storage: S,
}

impl<S: Storage> BlockStore<S> {
    pub fn new(storage: S) -> Self {
        BlockStore { storage }
    }
    pub fn storage(&self) -> &S {
        &self.storage
    }
    pub fn storage_mut(&mut self) -> &mut S {
        &mut self.storage
    }
    pub fn into_storage(self) -> S {
        self.storage
    }

    fn key(h: &Hash) -> String {
        let hex = h.to_hex();
        format!("blocks/{}/{}", &hex[..2], hex)
    }

    pub fn has(&self, h: &Hash) -> StorageResult<bool> {
        Ok(self.storage.get(&Self::key(h))?.is_some())
    }

    /// Store a raw block; deduplicated by content.
    pub fn put(&mut self, data: &[u8]) -> StorageResult<Hash> {
        let h = Hash::of(data);
        let k = Self::key(&h);
        if self.storage.get(&k)?.is_none() {
            self.storage.put(&k, data)?;
        }
        Ok(h)
    }

    /// Fetch a block and verify its hash.
    pub fn get(&self, h: &Hash) -> StorageResult<Vec<u8>> {
        let data = self.storage.get(&Self::key(h))?.ok_or_else(|| StorageError::NotFound(h.to_hex()))?;
        if Hash::of(&data) != *h {
            return Err(StorageError::Corrupt(format!("block {} fails hash verification", h.to_hex())));
        }
        Ok(data)
    }

    /// Store arbitrary-size data as 64 KiB chunks plus a manifest block; the
    /// manifest hash is the blob root.
    pub fn put_blob(&mut self, data: &[u8]) -> StorageResult<Hash> {
        let mut m = Vec::with_capacity(16 + 32 * (data.len() / CHUNK_SIZE + 1));
        m.extend_from_slice(MANIFEST_MAGIC);
        m.extend_from_slice(&(data.len().div_ceil(CHUNK_SIZE) as u32).to_le_bytes());
        for chunk in data.chunks(CHUNK_SIZE) {
            m.extend_from_slice(&self.put(chunk)?.0);
        }
        m.extend_from_slice(&(data.len() as u64).to_le_bytes());
        self.put(&m)
    }

    fn parse_manifest(m: &[u8]) -> StorageResult<(Vec<Hash>, u64)> {
        let bad = || StorageError::Corrupt("bad blob manifest".into());
        if m.len() < 16 || &m[..4] != MANIFEST_MAGIC {
            return Err(bad());
        }
        let n = u32::from_le_bytes([m[4], m[5], m[6], m[7]]) as usize;
        if m.len() != 16 + 32 * n {
            return Err(bad());
        }
        let hashes = (0..n)
            .map(|i| {
                let mut h = [0u8; 32];
                h.copy_from_slice(&m[8 + 32 * i..40 + 32 * i]);
                Hash(h)
            })
            .collect();
        let mut sz = [0u8; 8];
        sz.copy_from_slice(&m[8 + 32 * n..]);
        Ok((hashes, u64::from_le_bytes(sz)))
    }

    pub fn get_blob(&self, root: &Hash) -> StorageResult<Vec<u8>> {
        let (hashes, size) = Self::parse_manifest(&self.get(root)?)?;
        let mut out = Vec::with_capacity(size as usize);
        for h in hashes {
            out.extend_from_slice(&self.get(&h)?);
        }
        if out.len() as u64 != size {
            return Err(StorageError::Corrupt("blob size mismatch".into()));
        }
        Ok(out)
    }

    pub fn block_count(&self) -> StorageResult<usize> {
        Ok(self.storage.list("blocks/")?.len())
    }

    /// Delete every block not reachable from `roots` (blob roots). Returns the
    /// number of blocks removed.
    pub fn gc(&mut self, roots: &[Hash]) -> StorageResult<usize> {
        let mut live = std::collections::BTreeSet::new();
        for r in roots {
            if let Ok((chunks, _)) = Self::parse_manifest(&self.get(r)?) {
                live.extend(chunks);
            }
            live.insert(*r);
        }
        let mut removed = 0;
        for k in self.storage.list("blocks/")? {
            let hex = k.rsplit('/').next().unwrap_or("");
            if Hash::from_hex(hex).is_none_or(|h| !live.contains(&h)) && self.storage.delete(&k)? {
                removed += 1;
            }
        }
        Ok(removed)
    }
}

// ----------------------------------------------------------------------- WAL

pub const WAL_KEY: &str = "wal/journal";
const INDEX_KEY: &str = "vfs/index.json";

#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
#[serde(tag = "op", rename_all = "snake_case")]
pub enum WalRecord {
    Mkdir { path: String },
    Write { path: String, root: Hash, size: u64 },
    Remove { path: String },
}

/// Frame: `[len u32 LE][blake3(payload)[..8]][payload]`.
pub fn wal_encode(rec: &WalRecord) -> Vec<u8> {
    let payload = serde_json::to_vec(rec).expect("wal record serializes");
    let mut out = Vec::with_capacity(12 + payload.len());
    out.extend_from_slice(&(payload.len() as u32).to_le_bytes());
    out.extend_from_slice(&blake3::hash(&payload).as_bytes()[..8]);
    out.extend_from_slice(&payload);
    out
}

/// Decode records until the first torn or corrupt frame; returns the valid
/// prefix and the number of valid bytes.
pub fn wal_decode(buf: &[u8]) -> (Vec<WalRecord>, usize) {
    let mut recs = Vec::new();
    let mut off = 0;
    while off + 12 <= buf.len() {
        let len = u32::from_le_bytes([buf[off], buf[off + 1], buf[off + 2], buf[off + 3]]) as usize;
        let end = off + 12 + len;
        if end > buf.len() {
            break;
        }
        let payload = &buf[off + 12..end];
        if blake3::hash(payload).as_bytes()[..8] != buf[off + 4..off + 12] {
            break;
        }
        match serde_json::from_slice(payload) {
            Ok(r) => recs.push(r),
            Err(_) => break,
        }
        off = end;
    }
    (recs, off)
}

// ----------------------------------------------------------------------- VFS

#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
#[serde(tag = "kind", rename_all = "snake_case")]
pub enum Node {
    Dir,
    File { root: Hash, size: u64 },
}

#[derive(Clone, Debug, PartialEq, Serialize)]
pub struct DirEntry {
    pub name: String,
    pub is_dir: bool,
    pub size: u64,
}

pub struct Vfs<S: Storage> {
    blocks: BlockStore<S>,
    index: BTreeMap<String, Node>,
}

pub fn normalize_path(p: &str) -> StorageResult<String> {
    if !p.starts_with('/') {
        return Err(StorageError::Invalid(format!("path must be absolute: {p}")));
    }
    let mut parts = Vec::new();
    for s in p.split('/') {
        match s {
            "" | "." => {}
            ".." => return Err(StorageError::Invalid("'..' not allowed".into())),
            s if s.contains(['\\', '\0']) => return Err(StorageError::Invalid("bad character in path".into())),
            s => parts.push(s),
        }
    }
    Ok(if parts.is_empty() { "/".into() } else { format!("/{}", parts.join("/")) })
}

fn parents(path: &str) -> Vec<String> {
    let mut out = Vec::new();
    let mut cur = String::new();
    let segs: Vec<&str> = path.split('/').filter(|s| !s.is_empty()).collect();
    for s in segs.iter().take(segs.len().saturating_sub(1)) {
        cur.push('/');
        cur.push_str(s);
        out.push(cur.clone());
    }
    out
}

impl<S: Storage> Vfs<S> {
    /// Open a VFS: load the last checkpoint, then replay the WAL over it.
    pub fn open(storage: S) -> StorageResult<Self> {
        let mut blocks = BlockStore::new(storage);
        let mut index = match blocks.storage().get(INDEX_KEY)? {
            Some(b) => serde_json::from_slice(&b).map_err(|e| StorageError::Corrupt(e.to_string()))?,
            None => BTreeMap::new(),
        };
        if let Some(wal) = blocks.storage().get(WAL_KEY)? {
            let (recs, valid) = wal_decode(&wal);
            for rec in &recs {
                Self::apply(&mut index, rec);
            }
            if valid < wal.len() {
                // Drop the torn tail so later appends are not hidden behind it.
                blocks.storage_mut().put(WAL_KEY, &wal[..valid])?;
            }
        }
        Ok(Vfs { blocks, index })
    }

    fn apply(index: &mut BTreeMap<String, Node>, rec: &WalRecord) {
        match rec {
            WalRecord::Mkdir { path } => {
                for p in parents(path) {
                    index.entry(p).or_insert(Node::Dir);
                }
                index.entry(path.clone()).or_insert(Node::Dir);
            }
            WalRecord::Write { path, root, size } => {
                for p in parents(path) {
                    index.entry(p).or_insert(Node::Dir);
                }
                index.insert(path.clone(), Node::File { root: *root, size: *size });
            }
            WalRecord::Remove { path } => {
                let prefix = format!("{path}/");
                index.retain(|k, _| k != path && !k.starts_with(&prefix));
            }
        }
    }

    fn log(&mut self, rec: WalRecord) -> StorageResult<()> {
        self.blocks.storage_mut().append(WAL_KEY, &wal_encode(&rec))?;
        Self::apply(&mut self.index, &rec);
        Ok(())
    }

    pub fn mkdir_p(&mut self, path: &str) -> StorageResult<()> {
        let path = normalize_path(path)?;
        if path == "/" {
            return Ok(());
        }
        if matches!(self.index.get(&path), Some(Node::File { .. })) {
            return Err(StorageError::Invalid(format!("{path} is a file")));
        }
        self.log(WalRecord::Mkdir { path })
    }

    pub fn write(&mut self, path: &str, data: &[u8]) -> StorageResult<Hash> {
        let path = normalize_path(path)?;
        if path == "/" || matches!(self.index.get(&path), Some(Node::Dir)) {
            return Err(StorageError::Invalid(format!("{path} is a directory")));
        }
        if parents(&path).iter().any(|p| matches!(self.index.get(p), Some(Node::File { .. }))) {
            return Err(StorageError::Invalid("a parent component is a file".into()));
        }
        // Blocks are durable before the journal record that references them.
        let root = self.blocks.put_blob(data)?;
        self.log(WalRecord::Write { path, root, size: data.len() as u64 })?;
        Ok(root)
    }

    pub fn read(&self, path: &str) -> StorageResult<Vec<u8>> {
        let path = normalize_path(path)?;
        match self.index.get(&path) {
            Some(Node::File { root, .. }) => self.blocks.get_blob(root),
            Some(Node::Dir) => Err(StorageError::Invalid(format!("{path} is a directory"))),
            None => Err(StorageError::NotFound(path)),
        }
    }

    pub fn remove(&mut self, path: &str) -> StorageResult<bool> {
        let path = normalize_path(path)?;
        if path == "/" {
            return Err(StorageError::Invalid("cannot remove root".into()));
        }
        if !self.index.contains_key(&path) {
            return Ok(false);
        }
        self.log(WalRecord::Remove { path })?;
        Ok(true)
    }

    pub fn stat(&self, path: &str) -> StorageResult<Option<Node>> {
        let path = normalize_path(path)?;
        Ok(if path == "/" { Some(Node::Dir) } else { self.index.get(&path).cloned() })
    }

    pub fn list(&self, dir: &str) -> StorageResult<Vec<DirEntry>> {
        let dir = normalize_path(dir)?;
        if dir != "/" && !matches!(self.index.get(&dir), Some(Node::Dir)) {
            return Err(StorageError::NotFound(dir));
        }
        let prefix = if dir == "/" { "/".to_string() } else { format!("{dir}/") };
        Ok(self
            .index
            .iter()
            .filter_map(|(k, n)| {
                let rest = k.strip_prefix(&prefix)?;
                if rest.is_empty() || rest.contains('/') {
                    return None;
                }
                Some(match n {
                    Node::Dir => DirEntry { name: rest.into(), is_dir: true, size: 0 },
                    Node::File { size, .. } => DirEntry { name: rest.into(), is_dir: false, size: *size },
                })
            })
            .collect())
    }

    /// Write the index snapshot and truncate the journal.
    pub fn checkpoint(&mut self) -> StorageResult<()> {
        let bytes = serde_json::to_vec(&self.index).map_err(|e| StorageError::Corrupt(e.to_string()))?;
        self.blocks.storage_mut().put(INDEX_KEY, &bytes)?;
        self.blocks.storage_mut().delete(WAL_KEY)?;
        self.blocks.storage_mut().flush()
    }

    /// Drop blocks no file references. Returns the number removed.
    pub fn gc(&mut self) -> StorageResult<usize> {
        let roots: Vec<Hash> = self
            .index
            .values()
            .filter_map(|n| if let Node::File { root, .. } = n { Some(*root) } else { None })
            .collect();
        self.blocks.gc(&roots)
    }

    pub fn blocks(&self) -> &BlockStore<S> {
        &self.blocks
    }

    pub fn into_storage(self) -> S {
        self.blocks.into_storage()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn hash_hex_roundtrip_and_known_vector() {
        let h = Hash::of(b"");
        assert_eq!(h.to_hex(), "af1349b9f5f9a1a6a0404dea36dcc9499bcb25c9adc112b7cc9a93cae41f3262");
        assert_eq!(Hash::from_hex(&h.to_hex()), Some(h));
        assert_eq!(Hash::from_hex("zz"), None);
    }

    #[test]
    fn blockstore_dedup_and_verify() {
        let mut b = BlockStore::new(MemStorage::new());
        let h1 = b.put(b"abc").unwrap();
        let h2 = b.put(b"abc").unwrap();
        assert_eq!(h1, h2);
        assert_eq!(b.block_count().unwrap(), 1);
        assert_eq!(b.get(&h1).unwrap(), b"abc");
        // corrupt in place
        let key = format!("blocks/{}/{}", &h1.to_hex()[..2], h1.to_hex());
        b.storage_mut().put(&key, b"xyz").unwrap();
        assert!(matches!(b.get(&h1), Err(StorageError::Corrupt(_))));
    }

    #[test]
    fn blob_chunking_roundtrip() {
        let mut b = BlockStore::new(MemStorage::new());
        let data: Vec<u8> = (0..(CHUNK_SIZE * 2 + 123)).map(|i| (i * 31 % 251) as u8).collect();
        let root = b.put_blob(&data).unwrap();
        assert_eq!(b.get_blob(&root).unwrap(), data);
        assert_eq!(b.block_count().unwrap(), 4);
        let e = b.put_blob(b"").unwrap();
        assert!(b.get_blob(&e).unwrap().is_empty());
    }

    #[test]
    fn key_validation() {
        let mut m = MemStorage::new();
        for bad in ["", "/a", "a/", "a//b", "a/../b", "a\\b", "c:x"] {
            assert!(m.put(bad, b"x").is_err(), "{bad}");
        }
        assert!(m.put("a/b", b"x").is_ok());
    }

    #[test]
    fn vfs_basic_tree() {
        let mut v = Vfs::open(MemStorage::new()).unwrap();
        v.write("/home/user/a.txt", b"hello").unwrap();
        v.write("/home/user/b.txt", b"world!").unwrap();
        v.mkdir_p("/tmp").unwrap();
        assert_eq!(v.read("/home/user/a.txt").unwrap(), b"hello");
        let l = v.list("/home/user").unwrap();
        assert_eq!(l.iter().map(|e| e.name.as_str()).collect::<Vec<_>>(), ["a.txt", "b.txt"]);
        assert_eq!(v.list("/").unwrap().len(), 2);
        assert!(v.write("/home", b"x").is_err());
        assert!(v.write("/home/user/a.txt/x", b"x").is_err());
        assert!(v.read("/nope").is_err());
        assert!(v.read("/../etc").is_err());
        assert!(v.remove("/home").unwrap());
        assert!(v.read("/home/user/a.txt").is_err());
        assert!(!v.remove("/home").unwrap());
    }

    #[test]
    fn wal_recovery_without_checkpoint() {
        let mut v = Vfs::open(MemStorage::new()).unwrap();
        v.write("/a", b"one").unwrap();
        v.write("/d/b", b"two").unwrap();
        v.remove("/a").unwrap();
        // "crash": reopen from storage only, no checkpoint
        let v2 = Vfs::open(v.into_storage()).unwrap();
        assert!(v2.read("/a").is_err());
        assert_eq!(v2.read("/d/b").unwrap(), b"two");
    }

    #[test]
    fn wal_torn_tail_is_ignored() {
        let mut v = Vfs::open(MemStorage::new()).unwrap();
        v.write("/ok", b"fine").unwrap();
        let mut s = v.into_storage();
        let torn = wal_encode(&WalRecord::Remove { path: "/ok".into() });
        s.append(WAL_KEY, &torn[..torn.len() - 3]).unwrap();
        let v2 = Vfs::open(s).unwrap();
        assert_eq!(v2.read("/ok").unwrap(), b"fine", "torn remove must not apply");
        // after reopening, the torn tail was truncated, so a valid append is visible
        let mut s = v2.into_storage();
        s.append(WAL_KEY, &wal_encode(&WalRecord::Mkdir { path: "/later".into() })).unwrap();
        let v3 = Vfs::open(s).unwrap();
        assert!(v3.stat("/later").unwrap().is_some());
        // corrupt checksum stops replay
        let mut s = v3.into_storage();
        let mut bad = wal_encode(&WalRecord::Mkdir { path: "/x".into() });
        bad[5] ^= 0xFF;
        s.append(WAL_KEY, &bad).unwrap();
        assert!(Vfs::open(s).unwrap().stat("/x").unwrap().is_none());
    }

    #[test]
    fn checkpoint_truncates_wal_and_gc_reclaims() {
        let mut v = Vfs::open(MemStorage::new()).unwrap();
        v.write("/f", b"first version").unwrap();
        v.write("/f", b"second").unwrap();
        v.checkpoint().unwrap();
        assert!(v.blocks().storage().get(WAL_KEY).unwrap().is_none());
        let before = v.blocks().block_count().unwrap();
        let removed = v.gc().unwrap();
        assert!(removed >= 2 && v.blocks().block_count().unwrap() == before - removed);
        let v2 = Vfs::open(v.into_storage()).unwrap();
        assert_eq!(v2.read("/f").unwrap(), b"second");
    }

    #[cfg(not(target_arch = "wasm32"))]
    #[test]
    fn file_backend_roundtrip() {
        let dir = std::env::temp_dir().join(format!("aphrody-fs-test-{}", std::process::id()));
        let _ = std::fs::remove_dir_all(&dir);
        {
            let mut v = Vfs::open(FileStorage::open(&dir).unwrap()).unwrap();
            v.write("/docs/readme.md", b"# aphrody").unwrap();
            v.checkpoint().unwrap();
            v.write("/docs/later.md", b"after checkpoint").unwrap();
        }
        let v = Vfs::open(FileStorage::open(&dir).unwrap()).unwrap();
        assert_eq!(v.read("/docs/readme.md").unwrap(), b"# aphrody");
        assert_eq!(v.read("/docs/later.md").unwrap(), b"after checkpoint");
        let _ = std::fs::remove_dir_all(&dir);
    }
}
