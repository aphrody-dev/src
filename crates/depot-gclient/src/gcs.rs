//! GCS dependencies (`dep_type: 'gcs'`), as `gclient.GcsDependency` does them, with the
//! download going through the content-addressed store (`depot-cas`, after Lore).
//!
//! On-disk contract kept byte for byte with upstream, so `gclient sync` and `ay gclient
//! sync` can alternate on one checkout:
//! - artifact: `<output_dir>/<output_file>`, default `.<object_name with / and \ as _>`
//! - `.<prefix>_hash`: the sha256 and a newline; `<prefix>` also has `.` as `_`
//! - `.<prefix>_is_first_class_gcs`: `1` and a newline
//! - `.<prefix>_content_names`: `json.dumps(tar.getnames())` or the zip name list
//!
//! Upstream copies with `gsutil cp`; public buckets are plain HTTPS objects at
//! `storage.googleapis.com`, which is what gsutil reads too. A cached sha256 is
//! hydrated from the store without network.

use std::fs::{self, File};
use std::io::{self, BufReader, Read};
use std::path::{Component, Path, PathBuf};

use crate::{Error, Result};

/// One object of a GCS dependency.
#[derive(Debug, Clone, PartialEq)]
pub struct GcsObject {
    pub bucket: String,
    pub object_name: String,
    pub sha256sum: String,
    pub size_bytes: i64,
    pub output_file: Option<String>,
}

const SCM_METADATA: [&str; 2] = [".git", ".jj"];
pub const MIGRATION_TOGGLE_FILE_SUFFIX: &str = "_is_first_class_gcs";

/// `_IsAbsOrDrive`: absolute on any OS, UNC, or drive-relative (`C:foo`).
fn is_abs_or_drive(p: &str) -> bool {
    let b = p.as_bytes();
    p.starts_with('/')
        || p.starts_with('\\')
        || (b.len() >= 2 && b[1] == b':' && b[0].is_ascii_alphabetic())
}

/// `_StartsWithScmMetadata`.
fn starts_with_scm_metadata(rel: &str) -> bool {
    let rel = rel.replace('\\', "/");
    rel.split('/')
        .find(|p| !p.is_empty() && *p != ".")
        .map(|first| {
            let f = first.trim_end_matches(['.', ' ']).to_ascii_lowercase();
            SCM_METADATA.contains(&f.as_str())
        })
        .unwrap_or(false)
}

impl GcsObject {
    pub fn url(&self) -> String {
        format!("gs://{}/{}", self.bucket, self.object_name)
    }

    /// Public HTTPS location of the object (what `gsutil cp` reads for public buckets).
    pub fn https_url(&self) -> String {
        let mut enc = String::new();
        for b in self.object_name.bytes() {
            if b.is_ascii_alphanumeric() || b"-_.~/".contains(&b) {
                enc.push(b as char);
            } else {
                enc.push_str(&format!("%{b:02X}"));
            }
        }
        format!("https://storage.googleapis.com/{}/{enc}", self.bucket)
    }

    pub fn gcs_file_name(&self) -> String {
        self.object_name.replace(['/', '\\'], "_")
    }

    pub fn file_prefix(&self) -> String {
        self.gcs_file_name().replace('.', "_")
    }

    /// `artifact_output_file`, relative to the output dir, validated as upstream does.
    pub fn artifact_name(&self) -> Result<String> {
        let out = self
            .output_file
            .clone()
            .unwrap_or_else(|| format!(".{}", self.gcs_file_name()));
        let clean = out.replace('\\', "/");
        let parts: Vec<&str> = clean.split('/').collect();
        let blank = |p: &str| p.trim_end_matches(['.', ' ']).is_empty();
        if is_abs_or_drive(&clean)
            || blank(parts.last().copied().unwrap_or(""))
            || parts.iter().any(|p| !p.is_empty() && *p != "." && blank(p))
            || starts_with_scm_metadata(&clean)
        {
            return Err(Error::new(format!("Invalid output_file path: {out}")));
        }
        Ok(out)
    }

    pub fn hash_file(&self) -> String {
        format!(".{}_hash", self.file_prefix())
    }

    pub fn content_names_file(&self) -> String {
        format!(".{}_content_names", self.file_prefix())
    }

    /// `download_from_google_storage.construct_migration_file_name`.
    pub fn migration_toggle_file(&self) -> String {
        format!(".{}{MIGRATION_TOGGLE_FILE_SUFFIX}", self.file_prefix())
    }

    /// `IsDownloadNeeded`.
    pub fn download_needed(&self, out_dir: &Path) -> Result<bool> {
        let artifact = out_dir.join(self.artifact_name()?);
        let hash = out_dir.join(self.hash_file());
        let toggle = out_dir.join(self.migration_toggle_file());
        let is_link = |p: &Path| {
            fs::symlink_metadata(p)
                .map(|m| m.file_type().is_symlink())
                .unwrap_or(false)
        };
        if [&artifact, &hash, &toggle].iter().any(|p| is_link(p)) {
            return Ok(true);
        }
        if !artifact.exists() || !toggle.exists() {
            return Ok(true);
        }
        Ok(match fs::read_to_string(&hash) {
            Ok(s) => s.trim_end() != self.sha256sum,
            Err(_) => true,
        })
    }
}

/// `json.dumps(list_of_str)` with Python's defaults (`", "` separator, `ensure_ascii`).
pub fn python_json_list(names: &[String]) -> String {
    let mut s = String::from("[");
    for (i, n) in names.iter().enumerate() {
        if i > 0 {
            s.push_str(", ");
        }
        s.push('"');
        for c in n.chars() {
            match c {
                '"' => s.push_str("\\\""),
                '\\' => s.push_str("\\\\"),
                '\n' => s.push_str("\\n"),
                '\r' => s.push_str("\\r"),
                '\t' => s.push_str("\\t"),
                '\u{8}' => s.push_str("\\b"),
                '\u{c}' => s.push_str("\\f"),
                c if (c as u32) < 0x20 || (c as u32) > 0x7e => {
                    let mut buf = [0u16; 2];
                    for u in c.encode_utf16(&mut buf) {
                        s.push_str(&format!("\\u{u:04x}"));
                    }
                }
                c => s.push(c),
            }
        }
        s.push('"');
    }
    s.push(']');
    s
}

/// `WriteToFile`: replace links, write content and a newline.
fn write_marker(path: &Path, content: &str) -> io::Result<()> {
    if fs::symlink_metadata(path)
        .map(|m| m.file_type().is_symlink())
        .unwrap_or(false)
    {
        fs::remove_file(path)?;
    }
    fs::write(path, format!("{content}\n"))
}

#[derive(Debug, Clone, Copy, PartialEq)]
enum Compression {
    None,
    Gzip,
    Xz,
    Bzip2,
}

fn sniff(path: &Path) -> io::Result<Compression> {
    let mut magic = [0u8; 6];
    let mut f = File::open(path)?;
    let n = f.read(&mut magic)?;
    let m = &magic[..n];
    Ok(if m.starts_with(&[0x1f, 0x8b]) {
        Compression::Gzip
    } else if m.starts_with(&[0xfd, b'7', b'z', b'X', b'Z', 0]) {
        Compression::Xz
    } else if m.starts_with(b"BZh") {
        Compression::Bzip2
    } else {
        Compression::None
    })
}

fn open_decoded(path: &Path, c: Compression) -> io::Result<Box<dyn Read>> {
    let f = BufReader::with_capacity(1 << 20, File::open(path)?);
    Ok(match c {
        Compression::None => Box::new(f),
        Compression::Gzip => Box::new(flate2::read::MultiGzDecoder::new(f)),
        Compression::Xz => Box::new(lzma_rust2::XzReader::new(f, true)),
        Compression::Bzip2 => {
            return Err(io::Error::new(
                io::ErrorKind::Unsupported,
                "bzip2 tar archives are not supported",
            ));
        }
    })
}

/// `tarfile.is_tarfile`: the first 512-byte block, after decompression, is a header with
/// a valid checksum.
fn is_tarfile(path: &Path) -> io::Result<Option<Compression>> {
    let c = sniff(path)?;
    if c == Compression::Bzip2 {
        return Ok(Some(c));
    }
    let Ok(mut r) = open_decoded(path, c) else {
        return Ok(None);
    };
    let mut block = [0u8; 512];
    let mut got = 0;
    while got < 512 {
        match r.read(&mut block[got..]) {
            Ok(0) => break,
            Ok(n) => got += n,
            Err(_) => return Ok(None),
        }
    }
    if got < 512 || block.iter().all(|b| *b == 0) {
        return Ok(None);
    }
    let field = &block[148..156];
    let text: String = field
        .iter()
        .take_while(|b| **b != 0 && **b != b' ')
        .map(|b| *b as char)
        .collect();
    let Ok(stored) = u32::from_str_radix(text.trim(), 8) else {
        return Ok(None);
    };
    let unsigned: u32 = block
        .iter()
        .enumerate()
        .map(|(i, b)| {
            if (148..156).contains(&i) {
                32
            } else {
                *b as u32
            }
        })
        .sum();
    let signed: i64 = block
        .iter()
        .enumerate()
        .map(|(i, b)| {
            if (148..156).contains(&i) {
                32
            } else {
                *b as i8 as i64
            }
        })
        .sum();
    Ok((stored == unsigned || stored as i64 == signed).then_some(c))
}

fn is_zipfile(path: &Path) -> bool {
    File::open(path)
        .ok()
        .and_then(|f| zip::ZipArchive::new(BufReader::new(f)).ok())
        .is_some()
}

/// Relative path inside the output dir, or an error for absolute paths and `..` escapes.
fn safe_rel(name: &str) -> Result<PathBuf> {
    let clean = name.replace('\\', "/");
    if is_abs_or_drive(&clean) {
        return Err(Error::new(format!("archive entry is absolute: {name}")));
    }
    let mut out = PathBuf::new();
    for c in Path::new(&clean).components() {
        match c {
            Component::Normal(p) => out.push(p),
            Component::CurDir => {}
            _ => {
                return Err(Error::new(format!(
                    "archive entry leaves the output dir: {name}"
                )));
            }
        }
    }
    Ok(out)
}

/// A symlink target that stays inside the output dir (`tarfile.data_filter`).
fn link_inside(rel: &Path, target: &Path) -> bool {
    if target.is_absolute() || target.to_string_lossy().starts_with(['/', '\\']) {
        return false;
    }
    let mut depth: i64 = rel.components().count() as i64 - 1;
    for c in target.components() {
        match c {
            Component::ParentDir => depth -= 1,
            Component::Normal(_) => depth += 1,
            Component::CurDir => {}
            _ => return false,
        }
        if depth < 0 {
            return false;
        }
    }
    true
}

/// Refuse to write through a directory symlink that points out of `root`.
fn ensure_parent_inside(root: &Path, dest: &Path) -> Result<()> {
    let parent = dest.parent().unwrap_or(root);
    fs::create_dir_all(parent)?;
    let (r, p) = (fs::canonicalize(root)?, fs::canonicalize(parent)?);
    if !p.starts_with(&r) {
        return Err(Error::new(format!(
            "Refusing to write outside GCS output_dir: {}",
            dest.display()
        )));
    }
    Ok(())
}

fn extract_tar(artifact: &Path, c: Compression, out_dir: &Path) -> Result<Vec<String>> {
    // Pass 1: names and validation, before anything is written.
    let mut names = Vec::new();
    let mut tops = Vec::new();
    {
        let mut ar = tar::Archive::new(open_decoded(artifact, c)?);
        for e in ar.entries()? {
            let e = e?;
            let raw = String::from_utf8_lossy(&e.path_bytes()).into_owned();
            let kind = e.header().entry_type();
            let name = if kind.is_dir() {
                raw.trim_end_matches('/').to_string()
            } else {
                raw
            };
            let rel = safe_rel(&name)?;
            if kind.is_symlink() || kind.is_hard_link() {
                let target = e
                    .link_name()?
                    .ok_or_else(|| Error::new(format!("link without target: {name}")))?;
                let ok = if kind.is_symlink() {
                    link_inside(&rel, &target)
                } else {
                    safe_rel(&target.to_string_lossy()).is_ok()
                };
                if !ok {
                    return Err(Error::new("tarfile contains invalid entries"));
                }
            } else if !(kind.is_file() || kind.is_dir() || kind.is_contiguous())
                && !kind.is_pax_global_extensions()
            {
                return Err(Error::new(format!(
                    "tarfile contains a special file: {name}"
                )));
            }
            let mut clean = name.replace('\\', "/");
            while clean.starts_with("./") && clean.len() > 2 {
                clean = clean[2..].to_string();
            }
            tops.push(clean);
            names.push(name);
        }
    }
    if tops.iter().any(|n| starts_with_scm_metadata(n)) {
        return Err(Error::new(format!(
            "GCS object has a .git or .jj entry at its top level, which would make {} look like a checkout",
            out_dir.display()
        )));
    }
    // Pass 2: extract. mtime is not restored (upstream sets `member.mtime = None`).
    let mut ar = tar::Archive::new(open_decoded(artifact, c)?);
    ar.set_preserve_mtime(false);
    ar.set_preserve_permissions(false);
    ar.set_overwrite(true);
    for e in ar.entries()? {
        let mut e = e?;
        let name = String::from_utf8_lossy(&e.path_bytes()).into_owned();
        let rel = safe_rel(name.trim_end_matches('/'))?;
        if rel.as_os_str().is_empty() {
            continue;
        }
        let dest = out_dir.join(&rel);
        ensure_parent_inside(out_dir, &dest)?;
        if e.header().entry_type().is_hard_link() {
            let target = e.link_name()?.unwrap_or_default();
            let src = out_dir.join(safe_rel(&target.to_string_lossy())?);
            let _ = fs::remove_file(&dest);
            fs::hard_link(&src, &dest).or_else(|_| fs::copy(&src, &dest).map(|_| ()))?;
            continue;
        }
        let mode = e.header().mode().ok();
        e.unpack(&dest)?;
        #[cfg(unix)]
        if e.header().entry_type().is_file() {
            use std::os::unix::fs::PermissionsExt;
            // tarfile.data_filter: drop setuid/setgid/sticky and group/other write.
            let m = (mode.unwrap_or(0o644) & 0o755) | 0o600;
            fs::set_permissions(&dest, fs::Permissions::from_mode(m))?;
        }
        let _ = mode;
    }
    Ok(names)
}

fn extract_zip(artifact: &Path, out_dir: &Path) -> Result<Vec<String>> {
    let mut z = zip::ZipArchive::new(BufReader::new(File::open(artifact)?))
        .map_err(|e| Error::new(format!("zip: {e}")))?;
    // Keep the archive's order (`ZipFile.namelist()`).
    let mut ordered = Vec::with_capacity(z.len());
    for i in 0..z.len() {
        let f = z
            .by_index_raw(i)
            .map_err(|e| Error::new(format!("zip: {e}")))?;
        ordered.push(
            f.name()
                .map_err(|e| Error::new(format!("zip: {e}")))?
                .into_owned(),
        );
    }
    for n in &ordered {
        let cleaned = n.replace('\\', "/");
        if cleaned.is_empty() || is_abs_or_drive(&cleaned) || cleaned.split('/').any(|p| p == "..")
        {
            return Err(Error::new("zipfile contains invalid entries"));
        }
    }
    if ordered.iter().any(|n| starts_with_scm_metadata(n)) {
        return Err(Error::new(
            "GCS object has a .git or .jj entry at its top level",
        ));
    }
    for i in 0..z.len() {
        let mut f = z.by_index(i).map_err(|e| Error::new(format!("zip: {e}")))?;
        let rel = safe_rel(&f.name().map_err(|e| Error::new(format!("zip: {e}")))?)?;
        let dest = out_dir.join(&rel);
        if f.is_dir() {
            fs::create_dir_all(&dest)?;
            continue;
        }
        ensure_parent_inside(out_dir, &dest)?;
        let mut w = File::create(&dest)?;
        io::copy(&mut f, &mut w)?;
    }
    Ok(ordered)
}

/// Fetch the object into `dest` (store first, then HTTPS). Returns whether GCS marked
/// it executable (`x-goog-meta-executable: 1`), `None` when that is unknown.
fn fetch(obj: &GcsObject, store: Option<&depot_cas::Store>, dest: &Path) -> Result<Option<bool>> {
    if let Some(s) = store
        && s.hydrate(&obj.sha256sum, dest)?
    {
        return Ok(None);
    }
    let url = obj.https_url();
    let agent: ureq::Agent = ureq::Agent::config_builder()
        .user_agent(concat!("ay-gclient/", env!("CARGO_PKG_VERSION")))
        .timeout_connect(Some(std::time::Duration::from_secs(20)))
        .build()
        .into();
    let resp = agent.get(&url).call().map_err(|e| match e {
        ureq::Error::StatusCode(c) => Error::new(format!("HTTP {c} for {url}")),
        e => Error::new(format!("{url}: {e}")),
    })?;
    let exec = resp
        .headers()
        .get("x-goog-meta-executable")
        .and_then(|v| v.to_str().ok())
        .map(|v| v.trim() == "1");
    let tmp = dest.with_extension("ay-download");
    {
        let mut w = File::create(&tmp)?;
        io::copy(&mut resp.into_body().into_reader(), &mut w)?;
    }
    fs::rename(&tmp, dest)?;
    Ok(exec)
}

/// `DownloadGoogleStorage` for one object.
pub fn sync_object(
    obj: &GcsObject,
    out_dir: &Path,
    store: Option<&depot_cas::Store>,
) -> Result<String> {
    if !obj.download_needed(out_dir)? {
        return Ok("up to date".into());
    }
    let artifact_name = obj.artifact_name()?;
    let artifact = out_dir.join(&artifact_name);
    for f in [
        obj.hash_file(),
        artifact_name.clone(),
        obj.migration_toggle_file(),
        obj.content_names_file(),
    ] {
        let p = out_dir.join(f);
        if fs::symlink_metadata(&p).is_ok() {
            fs::remove_file(&p)?;
        }
    }
    fs::create_dir_all(out_dir)?;
    ensure_parent_inside(out_dir, &artifact)?;
    let from_store = store.is_some_and(|s| s.lookup(&obj.sha256sum).is_some());
    let exec = fetch(obj, store, &artifact)?;

    let (sha, size) = depot_cas::sha256_file(&artifact)?;
    if sha != obj.sha256sum {
        return Err(Error::new(format!(
            "sha256sum does not match calculated hash. {} vs {sha}",
            obj.sha256sum
        )));
    }
    if size as i64 != obj.size_bytes {
        return Err(Error::new(format!(
            "size_bytes does not match calculated size bytes. {} vs {size}",
            obj.size_bytes
        )));
    }
    if let Some(s) = store
        && !from_store
    {
        s.ingest(&artifact)?;
    }

    let mut extracted = 0;
    if let Some(c) = is_tarfile(&artifact)? {
        let names = extract_tar(&artifact, c, out_dir)?;
        extracted = names.len();
        write_marker(
            &out_dir.join(obj.content_names_file()),
            &python_json_list(&names),
        )?;
    } else if is_zipfile(&artifact) {
        let names = extract_zip(&artifact, out_dir)?;
        extracted = names.len();
        write_marker(
            &out_dir.join(obj.content_names_file()),
            &python_json_list(&names),
        )?;
    }
    #[cfg(unix)]
    if exec == Some(true) {
        use std::os::unix::fs::PermissionsExt;
        let m = fs::metadata(&artifact)?.permissions().mode();
        fs::set_permissions(&artifact, fs::Permissions::from_mode(m | 0o111))?;
    }
    let _ = exec;
    write_marker(&out_dir.join(obj.hash_file()), &sha)?;
    write_marker(&out_dir.join(obj.migration_toggle_file()), "1")?;
    Ok(format!(
        "{} {} bytes{}{}",
        if from_store { "hydrated" } else { "downloaded" },
        size,
        if extracted > 0 {
            format!(", {extracted} entries")
        } else {
            String::new()
        },
        if from_store { "" } else { ", stored" }
    ))
}

#[cfg(test)]
mod tests {
    use super::*;

    fn obj(name: &str, sha: &str, size: i64) -> GcsObject {
        GcsObject {
            bucket: "b".into(),
            object_name: name.into(),
            sha256sum: sha.into(),
            size_bytes: size,
            output_file: None,
        }
    }

    #[test]
    fn marker_names_match_upstream() {
        let o = obj("Linux_x64/clang-llvmorg-21.tar.xz", "x", 0);
        assert_eq!(
            o.artifact_name().unwrap(),
            ".Linux_x64_clang-llvmorg-21.tar.xz"
        );
        assert_eq!(o.hash_file(), ".Linux_x64_clang-llvmorg-21_tar_xz_hash");
        assert_eq!(
            o.migration_toggle_file(),
            ".Linux_x64_clang-llvmorg-21_tar_xz_is_first_class_gcs"
        );
        assert_eq!(
            o.content_names_file(),
            ".Linux_x64_clang-llvmorg-21_tar_xz_content_names"
        );
        assert_eq!(o.url(), "gs://b/Linux_x64/clang-llvmorg-21.tar.xz");
    }

    #[test]
    fn output_file_validation() {
        let mut o = obj("a", "x", 0);
        for bad in ["/abs", "C:foo", ".git/x", "dir/..", "x/. ", "\\\\unc\\x"] {
            o.output_file = Some(bad.into());
            assert!(o.artifact_name().is_err(), "{bad}");
        }
        o.output_file = Some("sub/file.bin".into());
        assert_eq!(o.artifact_name().unwrap(), "sub/file.bin");
    }

    #[test]
    fn json_like_python() {
        let v = vec!["a".to_string(), "./b/c".into(), "é\"".into()];
        let bs = char::from(92);
        let want = format!(r#"["a", "./b/c", "{bs}u00e9{bs}""]"#);
        assert_eq!(python_json_list(&v), want);
    }

    #[test]
    fn symlink_containment() {
        assert!(link_inside(Path::new("a/b"), Path::new("../c")));
        assert!(!link_inside(Path::new("a/b"), Path::new("../../c")));
        assert!(!link_inside(Path::new("a"), Path::new("/etc/passwd")));
    }

    fn tar_xz(entries: &[(&str, &[u8])]) -> Vec<u8> {
        let mut b = tar::Builder::new(Vec::new());
        for (name, data) in entries {
            let mut h = tar::Header::new_gnu();
            h.set_size(data.len() as u64);
            h.set_mode(0o755);
            h.set_entry_type(tar::EntryType::Regular);
            // Raw name bytes: the builder would refuse "../x", which is what a hostile
            // archive carries.
            h.as_old_mut().name[..name.len()].copy_from_slice(name.as_bytes());
            h.set_cksum();
            b.append(&h, *data).unwrap();
        }
        let raw = b.into_inner().unwrap();
        let mut w =
            lzma_rust2::XzWriter::new(Vec::new(), lzma_rust2::XzOptions::with_preset(1)).unwrap();
        io::Write::write_all(&mut w, &raw).unwrap();
        w.finish().unwrap()
    }

    #[test]
    fn hydrate_extract_and_mark() {
        let dir = tempfile::tempdir().unwrap();
        let store = depot_cas::Store::open(dir.path().join("cas")).unwrap();
        let data = tar_xz(&[("./bin/tool", b"#!/bin/sh\n"), ("lib/x.so", b"elf")]);
        let src = dir.path().join("src.tar.xz");
        fs::write(&src, &data).unwrap();
        let (m, _) = store.ingest(&src).unwrap();
        let o = obj("Linux/sysroot.tar.xz", &m.sha256, data.len() as i64);
        let out = dir.path().join("out");

        let msg = sync_object(&o, &out, Some(&store)).unwrap();
        assert!(msg.starts_with("hydrated"), "{msg}");
        assert_eq!(fs::read(out.join("bin/tool")).unwrap(), b"#!/bin/sh\n");
        assert_eq!(fs::read(out.join("lib/x.so")).unwrap(), b"elf");
        assert_eq!(
            fs::read_to_string(out.join(o.hash_file())).unwrap(),
            format!("{}\n", m.sha256)
        );
        assert_eq!(
            fs::read_to_string(out.join(o.migration_toggle_file())).unwrap(),
            "1\n"
        );
        assert_eq!(
            fs::read_to_string(out.join(o.content_names_file())).unwrap(),
            "[\"./bin/tool\", \"lib/x.so\"]\n"
        );
        assert_eq!(sync_object(&o, &out, Some(&store)).unwrap(), "up to date");

        let wrong = GcsObject {
            size_bytes: 1,
            ..o.clone()
        };
        fs::remove_file(out.join(o.hash_file())).unwrap();
        assert!(
            sync_object(&wrong, &out, Some(&store))
                .unwrap_err()
                .to_string()
                .contains("size_bytes")
        );
    }

    #[test]
    fn rejects_scm_metadata_and_escapes() {
        let dir = tempfile::tempdir().unwrap();
        let store = depot_cas::Store::open(dir.path().join("cas")).unwrap();
        for entries in [
            &[(".git/config", &b"x"[..])][..],
            &[("../evil", &b"x"[..])][..],
        ] {
            let data = tar_xz(entries);
            let src = dir.path().join("t.tar.xz");
            fs::write(&src, &data).unwrap();
            let (m, _) = store.ingest(&src).unwrap();
            let o = obj("t.tar.xz", &m.sha256, data.len() as i64);
            assert!(sync_object(&o, &dir.path().join("o"), Some(&store)).is_err());
        }
    }
}
