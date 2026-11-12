//! Archive handling: `.zip`, `.tar.gz` / `.tgz`, `.tar.xz`, or a bare executable.

use std::io::{Cursor, Read};
use std::path::{Component, Path, PathBuf};

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Kind {
    Zip,
    TarGz,
    TarXz,
    /// The download is the executable itself.
    Raw,
}

pub fn kind_of(name: &str) -> Kind {
    let lower = name.to_ascii_lowercase();
    if lower.ends_with(".zip") {
        Kind::Zip
    } else if lower.ends_with(".tar.gz") || lower.ends_with(".tgz") {
        Kind::TarGz
    } else if lower.ends_with(".tar.xz") || lower.ends_with(".txz") {
        Kind::TarXz
    } else {
        Kind::Raw
    }
}

/// One regular file from an archive: its normalized relative path, bytes and Unix mode.
#[derive(Debug)]
pub struct Entry {
    pub path: PathBuf,
    pub data: Vec<u8>,
    pub mode: Option<u32>,
}

/// Reject absolute paths and `..` so an archive cannot write outside its destination.
fn safe_relative(path: &Path) -> Option<PathBuf> {
    let mut out = PathBuf::new();
    for c in path.components() {
        match c {
            Component::Normal(p) => out.push(p),
            Component::CurDir => {}
            _ => return None,
        }
    }
    (!out.as_os_str().is_empty()).then_some(out)
}

fn tar_entries<R: Read>(reader: R) -> Result<Vec<Entry>, String> {
    let mut archive = tar::Archive::new(reader);
    let mut out = Vec::new();
    for entry in archive.entries().map_err(|e| format!("tar: {e}"))? {
        let mut entry = entry.map_err(|e| format!("tar: {e}"))?;
        if !entry.header().entry_type().is_file() {
            continue;
        }
        let raw = entry
            .path()
            .map_err(|e| format!("tar path: {e}"))?
            .into_owned();
        let Some(path) = safe_relative(&raw) else {
            continue;
        };
        let mode = entry.header().mode().ok();
        let mut data = Vec::new();
        entry
            .read_to_end(&mut data)
            .map_err(|e| format!("tar read: {e}"))?;
        out.push(Entry { path, data, mode });
    }
    Ok(out)
}

/// Every regular file in the archive. `name` is the download file name (selects the format).
pub fn entries(name: &str, data: &[u8]) -> Result<Vec<Entry>, String> {
    match kind_of(name) {
        Kind::Zip => {
            let mut zip =
                zip::ZipArchive::new(Cursor::new(data)).map_err(|e| format!("zip: {e}"))?;
            let mut out = Vec::new();
            for i in 0..zip.len() {
                let mut file = zip.by_index(i).map_err(|e| format!("zip: {e}"))?;
                if file.is_dir() {
                    continue;
                }
                let Some(path) = file.enclosed_name().and_then(|p| safe_relative(&p)) else {
                    continue;
                };
                let mode = file.unix_mode();
                let mut buf = Vec::new();
                file.read_to_end(&mut buf)
                    .map_err(|e| format!("zip read: {e}"))?;
                out.push(Entry {
                    path,
                    data: buf,
                    mode,
                });
            }
            Ok(out)
        }
        Kind::TarGz => tar_entries(flate2::read::GzDecoder::new(Cursor::new(data))),
        Kind::TarXz => tar_entries(lzma_rust2::XzReader::new(Cursor::new(data), true)),
        Kind::Raw => Ok(vec![Entry {
            path: PathBuf::from(name),
            data: data.to_vec(),
            mode: Some(0o755),
        }]),
    }
}

/// The file whose name is `exe` (any directory depth), preferring the shallowest match.
pub fn find_executable<'a>(entries: &'a [Entry], exe: &str) -> Option<&'a Entry> {
    entries
        .iter()
        .filter(|e| {
            e.path
                .file_name()
                .is_some_and(|n| n.to_string_lossy().eq_ignore_ascii_case(exe))
        })
        .min_by_key(|e| e.path.components().count())
}

/// Drop the single top-level directory most archives wrap their contents in.
pub fn strip_common_root(entries: &mut [Entry]) {
    let first = |p: &Path| p.components().next().map(|c| c.as_os_str().to_owned());
    let Some(root) = entries.first().and_then(|e| first(&e.path)) else {
        return;
    };
    let all_nested = entries
        .iter()
        .all(|e| e.path.components().count() > 1 && first(&e.path).as_ref() == Some(&root));
    if all_nested {
        for e in entries.iter_mut() {
            e.path = e.path.components().skip(1).collect();
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::io::Write;

    fn tar_bytes(files: &[(&str, &[u8])]) -> Vec<u8> {
        let mut builder = tar::Builder::new(Vec::new());
        for (path, data) in files {
            let mut header = tar::Header::new_gnu();
            header.set_size(data.len() as u64);
            header.set_mode(0o755);
            header.set_cksum();
            builder.append_data(&mut header, path, *data).unwrap();
        }
        builder.into_inner().unwrap()
    }

    #[test]
    fn formats_by_name() {
        assert_eq!(kind_of("a.ZIP"), Kind::Zip);
        assert_eq!(kind_of("a.tar.gz"), Kind::TarGz);
        assert_eq!(kind_of("a.tgz"), Kind::TarGz);
        assert_eq!(kind_of("a.tar.xz"), Kind::TarXz);
        assert_eq!(kind_of("rustup-init.exe"), Kind::Raw);
    }

    #[test]
    fn reads_tar_gz_and_finds_nested_binary() {
        let tar = tar_bytes(&[("gh_1/LICENSE", b"MIT"), ("gh_1/bin/gh", b"ELF")]);
        let mut gz = flate2::write::GzEncoder::new(Vec::new(), flate2::Compression::fast());
        gz.write_all(&tar).unwrap();
        let entries = entries("gh.tar.gz", &gz.finish().unwrap()).unwrap();
        let gh = find_executable(&entries, "gh").expect("gh");
        assert_eq!(gh.data, b"ELF");
        assert_eq!(gh.mode, Some(0o755));
    }

    #[test]
    fn reads_tar_xz() {
        let tar = tar_bytes(&[("zig-1/zig", b"bin"), ("zig-1/lib/std.zig", b"std")]);
        let mut w =
            lzma_rust2::XzWriter::new(Vec::new(), lzma_rust2::XzOptions::with_preset(1)).unwrap();
        w.write_all(&tar).unwrap();
        let xz = w.finish().unwrap();
        let mut entries = entries("zig.tar.xz", &xz).unwrap();
        strip_common_root(&mut entries);
        let paths: Vec<_> = entries.iter().map(|e| e.path.clone()).collect();
        assert_eq!(
            paths,
            vec![PathBuf::from("zig"), PathBuf::from("lib").join("std.zig")]
        );
    }

    #[test]
    fn reads_zip() {
        let mut buf = Cursor::new(Vec::new());
        {
            let mut w = zip::ZipWriter::new(&mut buf);
            let opts = zip::write::SimpleFileOptions::default();
            w.start_file("just.exe", opts).unwrap();
            w.write_all(b"MZ").unwrap();
            w.start_file("README.md", opts).unwrap();
            w.write_all(b"doc").unwrap();
            w.finish().unwrap();
        }
        let entries = entries("just.zip", buf.get_ref()).unwrap();
        assert_eq!(find_executable(&entries, "JUST.EXE").unwrap().data, b"MZ");
        assert!(find_executable(&entries, "rg.exe").is_none());
    }

    #[test]
    fn rejects_escaping_paths() {
        assert_eq!(safe_relative(Path::new("../etc/passwd")), None);
        assert_eq!(safe_relative(Path::new("/abs")), None);
        assert_eq!(
            safe_relative(Path::new("./a/b")),
            Some(PathBuf::from("a").join("b"))
        );
    }

    #[test]
    fn strip_keeps_flat_archives() {
        let mut flat = vec![Entry {
            path: "rg".into(),
            data: vec![],
            mode: None,
        }];
        strip_common_root(&mut flat);
        assert_eq!(flat[0].path, PathBuf::from("rg"));
    }
}
