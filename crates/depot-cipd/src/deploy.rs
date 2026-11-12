//! The site root layout of luci-go `cipd/client/cipd/deployer`, so that the official
//! client reads back what is deployed here and the other way round.
//!
//! ```text
//! <root>/.cipd/pkgs/<n>/description.json         {"subdir", "package_name"}
//! <root>/.cipd/pkgs/<n>/.lock                    empty, the Go client's fslock
//! <root>/.cipd/pkgs/<n>/_current.txt             instance id (Windows)
//! <root>/.cipd/pkgs/<n>/_current -> <iid>        symlink (elsewhere)
//! <root>/.cipd/pkgs/<n>/<iid>/.cipdpkg/manifest.json
//! <root>/<subdir>/...                            deployed files
//! ```
//!
//! Windows only knows `copy` mode (`pkg.PickInstallMode`): files are written into the site
//! root and the instance directory keeps only the manifest; there are no junctions or
//! symlinks. Elsewhere the default `symlink` mode extracts into the instance directory and
//! links each file from the site root through `_current`.

use std::collections::HashSet;
use std::fs::{self, File, OpenOptions};
use std::io::{self, BufReader, Read, Write};
use std::path::{Component, Path, PathBuf};
use std::time::{Duration, SystemTime};

use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};

use crate::ensure_file::{Paranoid, clean_rel};
use crate::{Error, Result, iid};

pub const SITE_SERVICE_DIR: &str = ".cipd";
const PKGS: &str = "pkgs";
const DESCRIPTION: &str = "description.json";
const CURRENT_TXT: &str = "_current.txt";
const CURRENT_LINK: &str = "_current";
const LOCK: &str = ".lock";
/// `pkg.ServiceDir` and `pkg.ManifestName`.
const PKG_SERVICE_DIR: &str = ".cipdpkg";
const MANIFEST: &str = ".cipdpkg/manifest.json";

/// `pkg.Manifest`; field order and `omitempty` match the Go struct.
#[derive(Debug, Clone, Default, PartialEq, Eq, Serialize, Deserialize)]
pub struct Manifest {
    #[serde(default)]
    pub format_version: String,
    #[serde(default)]
    pub package_name: String,
    #[serde(default, skip_serializing_if = "String::is_empty")]
    pub version_file: String,
    #[serde(default, skip_serializing_if = "String::is_empty")]
    pub install_mode: String,
    #[serde(default, skip_serializing_if = "String::is_empty")]
    pub actual_install_mode: String,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub files: Vec<FileInfo>,
}

/// `pkg.FileInfo`.
#[derive(Debug, Clone, Default, PartialEq, Eq, Serialize, Deserialize)]
pub struct FileInfo {
    pub name: String,
    #[serde(default)]
    pub size: u64,
    #[serde(default, skip_serializing_if = "is_false")]
    pub executable: bool,
    #[serde(default, skip_serializing_if = "is_false")]
    pub writable: bool,
    #[serde(default, skip_serializing_if = "is_zero")]
    pub modtime: i64,
    #[serde(default, skip_serializing_if = "String::is_empty")]
    pub win_attrs: String,
    #[serde(default, skip_serializing_if = "String::is_empty")]
    pub symlink: String,
    #[serde(default, skip_serializing_if = "String::is_empty")]
    pub hash: String,
}

fn is_false(b: &bool) -> bool {
    !*b
}

fn is_zero(n: &i64) -> bool {
    *n == 0
}

#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
struct Description {
    #[serde(default, skip_serializing_if = "String::is_empty")]
    subdir: String,
    #[serde(default, skip_serializing_if = "String::is_empty")]
    package_name: String,
}

/// A `.cipd/pkgs/<n>` directory.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Deployed {
    pub dir: PathBuf,
    pub subdir: String,
    pub package: String,
    /// Instance id `_current` points to, if any.
    pub current: Option<String>,
}

fn pkgs_dir(root: &Path) -> PathBuf {
    root.join(SITE_SERVICE_DIR).join(PKGS)
}

fn site_path(root: &Path, subdir: &str, name: &str) -> PathBuf {
    let mut p = root.to_path_buf();
    for c in subdir
        .split('/')
        .chain(name.split('/'))
        .filter(|c| !c.is_empty())
    {
        p.push(c);
    }
    p
}

/// `getCurrentInstanceID`.
pub fn read_current(pkg_dir: &Path) -> Option<String> {
    let id = if cfg!(windows) {
        fs::read_to_string(pkg_dir.join(CURRENT_TXT))
            .ok()?
            .trim()
            .to_string()
    } else {
        fs::read_link(pkg_dir.join(CURRENT_LINK))
            .ok()?
            .to_string_lossy()
            .into_owned()
    };
    iid::is_valid(&id).then_some(id)
}

fn write_current(pkg_dir: &Path, instance_id: &str) -> Result<()> {
    if cfg!(windows) {
        write_atomic(&pkg_dir.join(CURRENT_TXT), instance_id.as_bytes())?;
    } else {
        let link = pkg_dir.join(CURRENT_LINK);
        let tmp = pkg_dir.join(format!("{CURRENT_LINK}.tmp"));
        let _ = fs::remove_file(&tmp);
        symlink(Path::new(instance_id), &tmp)?;
        fs::rename(&tmp, &link)?;
    }
    Ok(())
}

/// `readManifest`.
pub fn read_manifest(instance_dir: &Path) -> Result<Manifest> {
    let p = instance_dir.join(PKG_SERVICE_DIR).join("manifest.json");
    let text = fs::read(&p)
        .map_err(|e| Error::new(format!("opening manifest file {}: {e}", p.display())))?;
    Ok(serde_json::from_slice(&text)?)
}

fn read_description(dir: &Path) -> Option<Description> {
    if let Ok(b) = fs::read(dir.join(DESCRIPTION)) {
        return serde_json::from_slice(&b).ok();
    }
    // Pre-1.4 package directory: recover the name from the current manifest.
    let current = read_current(dir)?;
    let m = read_manifest(&dir.join(&current)).ok()?;
    let d = Description {
        subdir: String::new(),
        package_name: m.package_name,
    };
    let _ = write_atomic(
        &dir.join(DESCRIPTION),
        serde_json::to_string_pretty(&d).ok()?.as_bytes(),
    );
    Some(d)
}

/// `resolveValidPackageDirs`: every package directory, junk and duplicates removed as the
/// Go client does.
pub fn find_deployed(root: &Path) -> Vec<Deployed> {
    let Ok(rd) = fs::read_dir(pkgs_dir(root)) else {
        return Vec::new();
    };
    let mut all: Vec<(Description, PathBuf)> = Vec::new();
    for e in rd.flatten() {
        let dir = e.path();
        if !dir.is_dir() {
            continue;
        }
        match read_description(&dir) {
            Some(d) => all.push((d, dir)),
            None => {
                let _ = remove_tree(&dir);
            }
        }
    }
    let key = |p: &PathBuf| {
        let n = p
            .file_name()
            .map(|n| n.to_string_lossy().into_owned())
            .unwrap_or_default();
        (n.len(), n)
    };
    all.sort_by(|a, b| {
        (&a.0.subdir, &a.0.package_name, key(&a.1)).cmp(&(
            &b.0.subdir,
            &b.0.package_name,
            key(&b.1),
        ))
    });
    let mut out: Vec<Deployed> = Vec::new();
    for (d, dir) in all {
        if out
            .last()
            .is_some_and(|l| l.subdir == d.subdir && l.package == d.package_name)
        {
            let _ = remove_tree(&dir);
            continue;
        }
        out.push(Deployed {
            current: read_current(&dir),
            dir,
            subdir: d.subdir,
            package: d.package_name,
        });
    }
    out
}

/// `packagePath(allocate=true)`: the smallest free numeric slot under `.cipd/pkgs`.
fn allocate(root: &Path, subdir: &str, package: &str) -> Result<PathBuf> {
    let base = pkgs_dir(root);
    fs::create_dir_all(&base)?;
    let used: HashSet<u64> = find_deployed(root)
        .iter()
        .filter_map(|d| d.dir.file_name()?.to_str()?.parse().ok())
        .collect();
    let desc = serde_json::to_string_pretty(&Description {
        subdir: subdir.into(),
        package_name: package.into(),
    })?;
    for n in 0u64.. {
        if used.contains(&n) {
            continue;
        }
        let dir = base.join(n.to_string());
        match fs::create_dir(&dir) {
            Ok(()) => {
                write_atomic(&dir.join(DESCRIPTION), desc.as_bytes())?;
                return Ok(dir);
            }
            Err(e) if e.kind() == io::ErrorKind::AlreadyExists => continue,
            Err(e) => return Err(e.into()),
        }
    }
    unreachable!()
}

fn symlink(target: &Path, link: &Path) -> io::Result<()> {
    #[cfg(unix)]
    {
        std::os::unix::fs::symlink(target, link)
    }
    #[cfg(windows)]
    {
        std::os::windows::fs::symlink_file(target, link)
    }
}

fn write_atomic(path: &Path, data: &[u8]) -> io::Result<()> {
    let tmp = path.with_extension("ay-tmp");
    fs::write(&tmp, data)?;
    fs::rename(&tmp, path)
}

/// Remove a file or symlink, clearing the read-only bit the deployer sets on Windows.
fn remove_file(p: &Path) -> io::Result<()> {
    match fs::remove_file(p) {
        Err(e) if e.kind() == io::ErrorKind::PermissionDenied => {
            if let Ok(m) = fs::symlink_metadata(p) {
                let mut perm = m.permissions();
                #[allow(clippy::permissions_set_readonly_false)]
                perm.set_readonly(false);
                fs::set_permissions(p, perm)?;
            }
            fs::remove_file(p)
        }
        r => r,
    }
}

/// `remove_dir_all` that copes with read-only files.
pub fn remove_tree(p: &Path) -> io::Result<()> {
    let Ok(m) = fs::symlink_metadata(p) else {
        return Ok(());
    };
    if !m.is_dir() {
        return remove_file(p);
    }
    for e in fs::read_dir(p)? {
        let e = e?;
        if e.file_type()?.is_dir() {
            remove_tree(&e.path())?;
        } else {
            remove_file(&e.path())?;
        }
    }
    fs::remove_dir(p)
}

/// Clear whatever sits at `p` so a new file can be created there.
fn clear_dest(p: &Path) -> io::Result<()> {
    match fs::symlink_metadata(p) {
        Ok(m) if m.is_dir() => remove_tree(p),
        Ok(_) => remove_file(p),
        Err(_) => Ok(()),
    }
}

/// `removeEmptyTrees`: drop now-empty directories from `dir` up to `stop` (inclusive).
fn prune_empty(dir: &Path, stop: &Path, root: &Path) {
    let mut d = dir.to_path_buf();
    while d.starts_with(stop) && d != root {
        if fs::remove_dir(&d).is_err() {
            break;
        }
        if d == stop || !d.pop() {
            break;
        }
    }
}

/// What a zip entry carries, decoded as Go's `archive/zip` does (`FileHeader.Mode`,
/// deprecated `FileHeader.ModTime`).
struct EntryAttrs {
    executable: bool,
    writable: bool,
    symlink: bool,
    win_attrs: u32,
    modtime: i64,
}

fn entry_attrs<R: Read>(f: &zip::read::ZipFile<'_, R>, format_v1: bool) -> EntryAttrs {
    let ext = f.external_attributes();
    let (perm, symlink) = match f.system() as u8 {
        // creatorUnix, creatorMacOSX
        3 | 19 => {
            let m = ext >> 16;
            (m & 0o777, m & 0o170000 == 0o120000)
        }
        // creatorFAT, creatorNTFS, creatorVFAT
        0 | 11 | 14 => (if ext & 0x01 != 0 { 0o444 } else { 0o666 }, false),
        _ => (0, false),
    };
    let perm = if format_v1 { perm & !0o222 } else { perm };
    let modtime = f
        .last_modified()
        .map(|dt| dos_to_unix(dt.datepart(), dt.timepart()))
        .unwrap_or(0);
    EntryAttrs {
        executable: !symlink && perm & 0o100 != 0,
        writable: perm & 0o200 != 0,
        symlink,
        win_attrs: ext & 0x6,
        modtime,
    }
}

/// `msDosTimeToTime` in UTC, as Unix seconds.
fn dos_to_unix(date: u16, time: u16) -> i64 {
    if date == 0 && time == 0 {
        return 0;
    }
    let y = (date >> 9) as i64 + 1980;
    let m = ((date >> 5) & 0xf) as i64;
    let d = (date & 0x1f) as i64;
    // days_from_civil (Howard Hinnant), with Go's month normalization.
    let (y, m) = if m < 1 {
        (y - 1, m + 12)
    } else if m > 12 {
        (y + 1, m - 12)
    } else {
        (y, m)
    };
    let y2 = if m <= 2 { y - 1 } else { y };
    let era = y2.div_euclid(400);
    let yoe = y2 - era * 400;
    let mp = (m + 9) % 12;
    let doy = (153 * mp + 2) / 5 + d - 1;
    let doe = yoe * 365 + yoe / 4 - yoe / 100 + doy;
    let days = era * 146097 + doe - 719468;
    days * 86400
        + (time >> 11) as i64 * 3600
        + ((time >> 5) & 0x3f) as i64 * 60
        + (time & 0x1f) as i64 * 2
}

fn win_attrs_string(a: u32) -> String {
    let mut s = String::new();
    if a & 0x2 != 0 {
        s.push('H');
    }
    if a & 0x4 != 0 {
        s.push('S');
    }
    s
}

/// `fsDest.CreateFile` + copy: returns the size and the file hash as a SHA256 instance id.
fn write_file(dest: &Path, src: &mut dyn Read, a: &EntryAttrs) -> Result<(u64, String)> {
    if let Some(p) = dest.parent() {
        fs::create_dir_all(p)?;
    }
    clear_dest(dest)?;
    let mut oo = OpenOptions::new();
    oo.write(true).create_new(true);
    #[cfg(windows)]
    {
        use std::os::windows::fs::OpenOptionsExt;
        if a.win_attrs != 0 {
            oo.attributes(a.win_attrs);
        }
    }
    let mut f = oo.open(dest)?;
    let mut h = Sha256::new();
    let mut buf = vec![0u8; 256 * 1024];
    let mut size = 0u64;
    loop {
        let n = src.read(&mut buf)?;
        if n == 0 {
            break;
        }
        h.update(&buf[..n]);
        f.write_all(&buf[..n])?;
        size += n as u64;
    }
    if a.modtime > 0 {
        let _ = f.set_modified(SystemTime::UNIX_EPOCH + Duration::from_secs(a.modtime as u64));
    }
    drop(f);
    set_mode(dest, a.executable, a.writable)?;
    Ok((size, iid::sha256_iid(&h.finalize())))
}

/// Mode 0444/0555 plus 0222 when writable; on Windows only the read-only bit applies.
fn set_mode(p: &Path, executable: bool, writable: bool) -> io::Result<()> {
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        let mode = if executable { 0o555 } else { 0o444 } | if writable { 0o222 } else { 0 };
        fs::set_permissions(p, fs::Permissions::from_mode(mode))
    }
    #[cfg(not(unix))]
    {
        let _ = executable;
        if writable {
            return Ok(());
        }
        let mut perm = fs::metadata(p)?.permissions();
        perm.set_readonly(true);
        fs::set_permissions(p, perm)
    }
}

/// `fs.IsCleanSlashPath`.
fn is_clean_slash_path(p: &str) -> bool {
    !p.is_empty()
        && !p.contains('\\')
        && !p.starts_with('/')
        && clean_rel(p) == p
        && p != ".."
        && !p.starts_with("../")
}

/// Relative path from directory `from` to `to` (both absolute, same prefix).
fn relative(from: &Path, to: &Path) -> PathBuf {
    let f: Vec<Component> = from.components().collect();
    let t: Vec<Component> = to.components().collect();
    let common = f.iter().zip(&t).take_while(|(a, b)| a == b).count();
    let mut out = PathBuf::new();
    for _ in common..f.len() {
        out.push("..");
    }
    for c in &t[common..] {
        out.push(c.as_os_str());
    }
    out
}

/// Whether `<root>/<subdir>` has every file of the manifest; with `CheckIntegrity` also
/// whether regular files still hash to the manifest's value.
pub fn healthy(root: &Path, d: &Deployed, paranoid: Paranoid) -> bool {
    let Some(cur) = &d.current else {
        return false;
    };
    let Ok(m) = read_manifest(&d.dir.join(cur)) else {
        return false;
    };
    if paranoid == Paranoid::NotParanoid {
        return true;
    }
    m.files.iter().all(|f| {
        let p = site_path(root, &d.subdir, &f.name);
        let Ok(meta) = fs::symlink_metadata(&p) else {
            return false;
        };
        if paranoid != Paranoid::CheckIntegrity || !f.symlink.is_empty() || f.hash.is_empty() {
            return true;
        }
        let meta = if meta.file_type().is_symlink() {
            match fs::metadata(&p) {
                Ok(m) => m,
                Err(_) => return false,
            }
        } else {
            meta
        };
        meta.len() == f.size && file_hash(&p).is_some_and(|h| h == f.hash)
    })
}

fn file_hash(p: &Path) -> Option<String> {
    let mut r = BufReader::new(File::open(p).ok()?);
    let mut h = Sha256::new();
    let mut buf = vec![0u8; 256 * 1024];
    loop {
        let n = r.read(&mut buf).ok()?;
        if n == 0 {
            break;
        }
        h.update(&buf[..n]);
    }
    Some(iid::sha256_iid(&h.finalize()))
}

/// Remove files of `files` under `<root>/<subdir>` not in `keep`, then empty directories.
fn remove_site_files(root: &Path, subdir: &str, files: &[FileInfo], keep: &HashSet<String>) {
    let stop = site_path(root, subdir, "");
    let fold = |s: &str| {
        if cfg!(windows) {
            s.to_lowercase()
        } else {
            s.to_string()
        }
    };
    let mut dirs: Vec<PathBuf> = Vec::new();
    for f in files {
        if keep.contains(&fold(&f.name)) || !is_clean_slash_path(&f.name) {
            continue;
        }
        let p = site_path(root, subdir, &f.name);
        if remove_file(&p).is_ok()
            && let Some(parent) = p.parent()
        {
            dirs.push(parent.to_path_buf());
        }
    }
    dirs.sort();
    dirs.dedup();
    // Deepest first, so a parent is tried after its children.
    dirs.sort_by_key(|d| std::cmp::Reverse(d.components().count()));
    for d in dirs {
        prune_empty(&d, &stop, root);
    }
}

/// `RemoveDeployed`.
pub fn remove(root: &Path, d: &Deployed) -> Result<()> {
    if let Some(cur) = &d.current
        && let Ok(m) = read_manifest(&d.dir.join(cur))
    {
        remove_site_files(root, &d.subdir, &m.files, &HashSet::new());
    }
    remove_tree(&d.dir)?;
    Ok(())
}

/// `DeployInstance`: deploy the instance zip at `zip_path` as `package`/`instance_id` into
/// `<root>/<subdir>`, replacing whatever version of the package is there.
pub fn deploy(
    root: &Path,
    subdir: &str,
    package: &str,
    instance_id: &str,
    zip_path: &Path,
    override_copy: bool,
    existing: Option<&Deployed>,
) -> Result<()> {
    fs::create_dir_all(site_path(root, subdir, ""))?;
    let pkg_dir = match existing {
        Some(d) => d.dir.clone(),
        None => allocate(root, subdir, package)?,
    };
    let lock = pkg_dir.join(LOCK);
    if !lock.exists() {
        File::create(&lock)?;
    }

    let mut zip = zip::ZipArchive::new(BufReader::new(File::open(zip_path)?))?;
    let mut manifest: Manifest = {
        let mut f = zip
            .by_name(MANIFEST)
            .map_err(|_| Error::new(format!("bad CIPD package: no {MANIFEST} file")))?;
        let mut s = Vec::new();
        f.read_to_end(&mut s)?;
        serde_json::from_slice(&s)?
    };
    let format_v1 = manifest.format_version == "1";
    manifest.actual_install_mode = if override_copy {
        "copy".into()
    } else {
        manifest.install_mode.clone()
    };
    // pkg.PickInstallMode
    let copy_mode = cfg!(windows) || manifest.actual_install_mode == "copy";

    let prev_id = existing.and_then(|d| d.current.clone());
    let prev_manifest = prev_id
        .as_ref()
        .and_then(|p| read_manifest(&pkg_dir.join(p)).ok())
        .unwrap_or_default();

    let inst_dir = pkg_dir.join(instance_id);
    remove_tree(&inst_dir)?;
    fs::create_dir_all(inst_dir.join(PKG_SERVICE_DIR))?;
    let target_base = if copy_mode {
        site_path(root, subdir, "")
    } else {
        inst_dir.clone()
    };
    let target = |name: &str| {
        let mut p = target_base.clone();
        p.extend(name.split('/'));
        p
    };

    let mut files: Vec<FileInfo> = Vec::new();
    for i in 0..zip.len() {
        let mut f = zip.by_index(i)?;
        let name = f.name()?.into_owned();
        if name.starts_with(&format!("{SITE_SERVICE_DIR}/"))
            || name.starts_with(&format!("{PKG_SERVICE_DIR}/"))
            || name.ends_with('/')
        {
            continue;
        }
        if !is_clean_slash_path(&name) {
            return Err(Error::new(format!(
                "bad CIPD package: invalid file name {name:?}"
            )));
        }
        let a = entry_attrs(&f, format_v1);
        let dest = target(&name);
        if a.symlink {
            let mut t = String::new();
            f.read_to_string(&mut t)?;
            if !t.starts_with('/') {
                let dir = name.rsplit_once('/').map(|(d, _)| d).unwrap_or("");
                let joined = clean_rel(&format!("{dir}/{t}"));
                if joined == ".." || joined.starts_with("../") {
                    return Err(Error::new(format!(
                        "{name:?}: relative symlink is pointing outside of the destination dir"
                    )));
                }
            }
            if let Some(p) = dest.parent() {
                fs::create_dir_all(p)?;
            }
            clear_dest(&dest)?;
            symlink(
                &PathBuf::from(t.replace('/', std::path::MAIN_SEPARATOR_STR)),
                &dest,
            )?;
            files.push(FileInfo {
                name,
                writable: a.writable,
                modtime: a.modtime,
                win_attrs: win_attrs_string(a.win_attrs),
                symlink: t,
                ..Default::default()
            });
            continue;
        }
        let (size, hash) = write_file(&dest, &mut f, &a)?;
        files.push(FileInfo {
            name,
            size,
            executable: a.executable,
            writable: a.writable,
            modtime: a.modtime,
            win_attrs: win_attrs_string(a.win_attrs),
            hash,
            ..Default::default()
        });
    }
    if !manifest.version_file.is_empty() {
        if !is_clean_slash_path(&manifest.version_file) {
            return Err(Error::new(format!(
                "invalid version_file: {}",
                manifest.version_file
            )));
        }
        #[derive(Serialize)]
        struct VersionFile<'a> {
            package_name: &'a str,
            instance_id: &'a str,
        }
        let blob = serde_json::to_string_pretty(&VersionFile {
            package_name: &manifest.package_name,
            instance_id,
        })?;
        let a = EntryAttrs {
            executable: false,
            writable: false,
            symlink: false,
            win_attrs: 0,
            modtime: 0,
        };
        let (size, hash) = write_file(&target(&manifest.version_file), &mut blob.as_bytes(), &a)?;
        files.push(FileInfo {
            name: manifest.version_file.clone(),
            size,
            hash,
            ..Default::default()
        });
    }

    if !copy_mode {
        // addToSiteRoot in symlink mode: <root>/<subdir>/<f> -> ../.cipd/pkgs/<n>/_current/<f>
        for f in &files {
            let dest = site_path(root, subdir, &f.name);
            let mut t = pkg_dir.join(CURRENT_LINK);
            t.extend(f.name.split('/'));
            let parent = dest.parent().unwrap_or(root);
            fs::create_dir_all(parent)?;
            clear_dest(&dest)?;
            symlink(&relative(parent, &t), &dest)?;
        }
    }

    manifest.files = files;
    let mpath = inst_dir.join(PKG_SERVICE_DIR).join("manifest.json");
    let ro = EntryAttrs {
        executable: false,
        writable: false,
        symlink: false,
        win_attrs: 0,
        modtime: 0,
    };
    write_file(
        &mpath,
        &mut serde_json::to_string_pretty(&manifest)?.as_bytes(),
        &ro,
    )?;
    write_current(&pkg_dir, instance_id)?;

    if let Some(prev) = &prev_id
        && prev != instance_id
    {
        let _ = remove_tree(&pkg_dir.join(prev));
    }
    if !prev_manifest.files.is_empty() {
        let fold = |s: &str| {
            if cfg!(windows) {
                s.to_lowercase()
            } else {
                s.to_string()
            }
        };
        let mut keep: HashSet<String> = HashSet::new();
        for f in &manifest.files {
            // A kept file keeps its parent directories too.
            let mut p = f.name.as_str();
            keep.insert(fold(p));
            while let Some((d, _)) = p.rsplit_once('/') {
                keep.insert(fold(d));
                p = d;
            }
        }
        remove_site_files(root, subdir, &prev_manifest.files, &keep);
    }
    if copy_mode {
        // Only the manifest stays in the instance directory.
        remove_empty_dirs(&inst_dir);
    }
    Ok(())
}

fn remove_empty_dirs(dir: &Path) {
    if let Ok(rd) = fs::read_dir(dir) {
        for e in rd.flatten() {
            if e.file_type().is_ok_and(|t| t.is_dir()) {
                remove_empty_dirs(&e.path());
                let _ = fs::remove_dir(e.path());
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::io::Cursor;
    use zip::write::SimpleFileOptions;

    const IID_A: &str = "HVCRGHnt4bB-ZbwODJv2TSsDvc9t5VVbTldyuOT4x3oC";
    const IID_B: &str = "03X72e-T2obdkyf-j53et5BK6dIa1zqsBWGnXPNll7MC";

    fn make_zip(
        dir: &Path,
        name: &str,
        files: &[(&str, &str)],
        version_file: Option<&str>,
    ) -> PathBuf {
        let mut w = zip::ZipWriter::new(Cursor::new(Vec::new()));
        let opts = SimpleFileOptions::default()
            .system(zip::System::Unix)
            .unix_permissions(0o755);
        for (n, body) in files {
            w.start_file(*n, opts).unwrap();
            w.write_all(body.as_bytes()).unwrap();
        }
        let mut m = serde_json::json!({"format_version": "1.1", "package_name": "test/pkg"});
        if let Some(v) = version_file {
            m["version_file"] = v.into();
        }
        w.start_file(MANIFEST, SimpleFileOptions::default())
            .unwrap();
        w.write_all(m.to_string().as_bytes()).unwrap();
        let bytes = w.finish().unwrap().into_inner();
        let p = dir.join(name);
        fs::write(&p, bytes).unwrap();
        p
    }

    #[test]
    fn deploy_update_remove() {
        let t = tempfile::tempdir().unwrap();
        let root = t.path().join("root");
        let a = make_zip(
            t.path(),
            "a.zip",
            &[("bin/tool", "v1"), ("old.txt", "x")],
            Some(".versions/tool.cipd_version"),
        );
        deploy(&root, "sub/dir", "test/pkg", IID_A, &a, true, None).unwrap();

        let d = find_deployed(&root);
        assert_eq!(d.len(), 1);
        assert_eq!(d[0].dir, root.join(".cipd/pkgs/0"));
        assert_eq!(
            (d[0].subdir.as_str(), d[0].package.as_str()),
            ("sub/dir", "test/pkg")
        );
        assert_eq!(d[0].current.as_deref(), Some(IID_A));
        assert_eq!(
            fs::read_to_string(root.join("sub/dir/bin/tool")).unwrap(),
            "v1"
        );
        let vf: serde_json::Value = serde_json::from_slice(
            &fs::read(root.join("sub/dir/.versions/tool.cipd_version")).unwrap(),
        )
        .unwrap();
        assert_eq!(vf["instance_id"], IID_A);
        let m = read_manifest(&d[0].dir.join(IID_A)).unwrap();
        assert_eq!(m.actual_install_mode, "copy");
        assert_eq!(
            m.files.iter().map(|f| f.name.as_str()).collect::<Vec<_>>(),
            ["bin/tool", "old.txt", ".versions/tool.cipd_version"]
        );
        assert!(m.files[0].executable && m.files[0].writable);
        assert!(healthy(&root, &d[0], Paranoid::CheckIntegrity));
        assert_eq!(
            fs::read_to_string(d[0].dir.join(DESCRIPTION)).unwrap(),
            "{\n  \"subdir\": \"sub/dir\",\n  \"package_name\": \"test/pkg\"\n}"
        );

        fs::remove_file(root.join("sub/dir/old.txt")).unwrap();
        assert!(healthy(&root, &d[0], Paranoid::NotParanoid));
        assert!(!healthy(&root, &d[0], Paranoid::CheckPresence));

        let b = make_zip(t.path(), "b.zip", &[("bin/tool", "v2")], None);
        deploy(&root, "sub/dir", "test/pkg", IID_B, &b, true, Some(&d[0])).unwrap();
        let d = find_deployed(&root);
        assert_eq!(d[0].current.as_deref(), Some(IID_B));
        assert_eq!(
            fs::read_to_string(root.join("sub/dir/bin/tool")).unwrap(),
            "v2"
        );
        assert!(!root.join("sub/dir/.versions").exists());
        assert!(!d[0].dir.join(IID_A).exists());

        remove(&root, &d[0]).unwrap();
        assert!(find_deployed(&root).is_empty());
        assert!(!root.join("sub/dir").exists());
    }

    #[test]
    fn junk_and_slots() {
        let t = tempfile::tempdir().unwrap();
        let root = t.path();
        fs::create_dir_all(root.join(".cipd/pkgs/0")).unwrap();
        let a = make_zip(root, "a.zip", &[("f", "1")], None);
        deploy(root, "", "test/pkg", IID_A, &a, true, None).unwrap();
        // The junk slot 0 was removed and reused.
        let d = find_deployed(root);
        assert_eq!(d.len(), 1);
        assert_eq!(d[0].dir, root.join(".cipd/pkgs/0"));
        deploy(root, "other", "test/pkg", IID_A, &a, true, None).unwrap();
        assert_eq!(find_deployed(root).len(), 2);
        assert!(root.join(".cipd/pkgs/1").is_dir());
    }

    #[test]
    fn dos_times() {
        // 2024-02-29 13:45:58 UTC
        let date = ((2024 - 1980) << 9) | (2 << 5) | 29;
        let time = (13 << 11) | (45 << 5) | 29;
        assert_eq!(dos_to_unix(date, time), 1709214358);
        assert_eq!(dos_to_unix(0, 0), 0);
    }
}
