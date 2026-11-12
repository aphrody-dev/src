//! CIPD client in Rust: `cipd ensure` as gclient runs it, behaving as luci-go's
//! `cipd/client/cipd` so the official Go client accepts the site root as-is and the other
//! way round.
//!
//! - [`ensure_file`]: ensure-file grammar, `${platform}`/`${os}`/`${arch}` templates, name,
//!   subdir and version validation.
//! - [`iid`]: instance ids (`base64url(digest || algo)`, legacy SHA1 hex) and their sha256.
//! - [`api`]: `cipd.Repository/ResolveVersion` and `GetInstanceURL` over pRPC JSON.
//! - [`deploy`]: the `.cipd/pkgs/<n>` layout, copy and symlink install modes.
//!
//! Instance zips go through depot-cas, keyed by the sha256 the instance id encodes, and tag
//! resolutions are cached next to it, so re-ensuring a package already seen needs no network.

pub mod api;
pub mod cli;
pub mod deploy;
pub mod ensure_file;
pub mod iid;

use std::collections::BTreeMap;
use std::fs;
use std::path::{Path, PathBuf};

use sha2::{Digest, Sha256};

pub use ensure_file::{EnsureFile, Paranoid, Platform};

#[derive(Debug)]
pub struct Error(String);

impl Error {
    pub fn new(msg: impl Into<String>) -> Error {
        Error(msg.into())
    }
}

impl std::fmt::Display for Error {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.write_str(&self.0)
    }
}

impl std::error::Error for Error {}

impl From<std::io::Error> for Error {
    fn from(e: std::io::Error) -> Error {
        Error(e.to_string())
    }
}

impl From<zip::result::ZipError> for Error {
    fn from(e: zip::result::ZipError) -> Error {
        Error(format!("zip: {e}"))
    }
}

impl From<serde_json::Error> for Error {
    fn from(e: serde_json::Error) -> Error {
        Error(format!("json: {e}"))
    }
}

pub type Result<T> = std::result::Result<T, Error>;

/// `-log-level`.
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Default)]
pub enum LogLevel {
    Debug,
    #[default]
    Info,
    Warning,
    Error,
}

impl LogLevel {
    pub fn parse(s: &str) -> Option<LogLevel> {
        match s {
            "debug" => Some(LogLevel::Debug),
            "info" => Some(LogLevel::Info),
            "warning" => Some(LogLevel::Warning),
            "error" => Some(LogLevel::Error),
            _ => None,
        }
    }

    fn log(self, at: LogLevel, msg: impl AsRef<str>) {
        if at >= self {
            eprintln!("[cipd] {}", msg.as_ref());
        }
    }
}

pub struct EnsureOptions {
    pub root: PathBuf,
    /// `-service-url`; else the file's `$ServiceURL`; else the public backend.
    pub service_url: Option<String>,
    pub max_threads: usize,
    pub log: LogLevel,
    /// Store root; `None` for `depot_cas::default_root()`.
    pub store: Option<PathBuf>,
}

impl EnsureOptions {
    pub fn new(root: impl Into<PathBuf>) -> EnsureOptions {
        EnsureOptions {
            root: root.into(),
            service_url: None,
            max_threads: 8,
            log: LogLevel::Info,
            store: None,
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Pin {
    pub subdir: String,
    pub package: String,
    pub instance_id: String,
}

#[derive(Debug, Default)]
pub struct Report {
    /// Every package of the ensure file that applies here, resolved.
    pub pins: Vec<Pin>,
    /// Installed, updated or repaired.
    pub deployed: Vec<Pin>,
    /// `(subdir, package)` removed because the ensure file no longer lists them.
    pub removed: Vec<(String, String)>,
    /// Instances hydrated from the store / downloaded.
    pub from_store: usize,
    pub downloaded: usize,
}

impl Report {
    /// The `-json-output` document of the Go client (`{"result": {subdir: [pins]}}`).
    pub fn json(&self) -> serde_json::Value {
        let mut by: BTreeMap<&str, Vec<serde_json::Value>> = BTreeMap::new();
        for p in &self.pins {
            by.entry(&p.subdir)
                .or_default()
                .push(serde_json::json!({ "package": p.package, "instance_id": p.instance_id }));
        }
        serde_json::json!({ "result": by })
    }
}

/// Map `f` over `items` on up to `threads` scoped threads, keeping the order.
fn par_map<T: Sync, R: Send>(items: &[T], threads: usize, f: impl Fn(&T) -> R + Sync) -> Vec<R> {
    let threads = threads.clamp(1, items.len().max(1));
    let next = std::sync::atomic::AtomicUsize::new(0);
    let mut out: Vec<Option<R>> = (0..items.len()).map(|_| None).collect();
    let slots = std::sync::Mutex::new(&mut out);
    std::thread::scope(|s| {
        for _ in 0..threads {
            s.spawn(|| {
                loop {
                    let i = next.fetch_add(1, std::sync::atomic::Ordering::Relaxed);
                    if i >= items.len() {
                        break;
                    }
                    let r = f(&items[i]);
                    slots.lock().unwrap()[i] = Some(r);
                }
            });
        }
    });
    out.into_iter()
        .map(|r| r.expect("every slot filled"))
        .collect()
}

/// Tag resolutions (`key:value` versions are immutable on the backend) cached on disk under
/// `<store>/cipd/versions/`, like the Go client's `tagcache.db`.
struct VersionCache {
    dir: PathBuf,
}

impl VersionCache {
    fn path(&self, service: &str, package: &str, version: &str) -> PathBuf {
        let key = Sha256::digest(format!("{service}\n{package}\n{version}").as_bytes());
        self.dir.join(iid::to_hex(&key))
    }

    fn get(&self, service: &str, package: &str, version: &str) -> Option<String> {
        let text = fs::read_to_string(self.path(service, package, version)).ok()?;
        let mut l = text.lines();
        (l.next()? == package && l.next()? == version)
            .then(|| l.next().map(str::to_string))
            .flatten()
            .filter(|i| iid::is_valid(i))
    }

    fn put(&self, service: &str, package: &str, version: &str, instance_id: &str) {
        let p = self.path(service, package, version);
        if fs::create_dir_all(&self.dir).is_ok() {
            let tmp = p.with_extension("tmp");
            if fs::write(&tmp, format!("{package}\n{version}\n{instance_id}\n")).is_ok() {
                let _ = fs::rename(&tmp, &p);
            }
        }
    }
}

/// Fetch one instance zip into `dest`: store first, then the backend (verified, ingested).
fn fetch(
    client: &api::Client,
    store: Option<&depot_cas::Store>,
    package: &str,
    instance_id: &str,
    dest: &Path,
) -> Result<bool> {
    let Some(sha) = iid::sha256_hex(instance_id) else {
        return Err(Error::new(format!(
            "{package}:{instance_id}: only SHA256 instance ids are supported (set CIPD_FORCE_GO=1 for the Go client)"
        )));
    };
    if let Some(s) = store
        && s.hydrate(&sha, dest).unwrap_or(false)
    {
        return Ok(true);
    }
    let url = client.instance_url(package, instance_id)?;
    let got = client.download(&url, dest)?;
    if got != sha {
        let _ = fs::remove_file(dest);
        return Err(Error::new(format!(
            "{package}:{instance_id}: downloaded sha256 {got} does not match"
        )));
    }
    if let Some(s) = store {
        let _ = s.ingest(dest);
    }
    Ok(false)
}

/// `cipd ensure`: make `<root>` hold exactly the packages of `file`.
pub fn ensure(file: &EnsureFile, opts: &EnsureOptions) -> Result<Report> {
    let log = opts.log;
    fs::create_dir_all(&opts.root)?;
    let root = std::path::absolute(&opts.root)?;
    let wanted = ensure_file::expand(file, &Platform::current())?;
    let service = opts
        .service_url
        .clone()
        .or_else(|| file.service_url.clone())
        .unwrap_or_else(|| api::DEFAULT_SERVICE_URL.to_string());
    let client = api::Client::new(&service);
    let store =
        depot_cas::Store::open(opts.store.clone().unwrap_or_else(depot_cas::default_root)).ok();
    let cache = store.as_ref().map(|s| VersionCache {
        dir: s.root().join("cipd").join("versions"),
    });

    // Resolve versions (instance ids as-is, tags through the cache).
    let resolved = par_map(&wanted, opts.max_threads, |w| -> Result<String> {
        if iid::is_valid(&w.version) {
            return Ok(w.version.clone());
        }
        let tag = ensure_file::is_tag(&w.version);
        if tag
            && let Some(id) = cache
                .as_ref()
                .and_then(|c| c.get(client.service_url(), &w.package, &w.version))
        {
            log.log(
                LogLevel::Debug,
                format!("Version cache hit for {}@{} - {id}", w.package, w.version),
            );
            return Ok(id);
        }
        let id = client
            .resolve_version(&w.package, &w.version)
            .map_err(|e| {
                Error::new(format!(
                    "failed to resolve {}@{} (line {}): {e}",
                    w.package, w.version, w.line
                ))
            })?;
        if tag && let Some(c) = &cache {
            c.put(client.service_url(), &w.package, &w.version, &id);
        }
        Ok(id)
    });
    let mut report = Report::default();
    let mut errors = Vec::new();
    for (w, r) in wanted.iter().zip(resolved) {
        match r {
            Ok(id) => report.pins.push(Pin {
                subdir: w.subdir.clone(),
                package: w.package.clone(),
                instance_id: id,
            }),
            Err(e) => errors.push(e.to_string()),
        }
    }
    if !errors.is_empty() {
        return Err(Error::new(errors.join("\n")));
    }

    // Plan against what is deployed.
    let deployed = deploy::find_deployed(&root);
    let find = |subdir: &str, package: &str| {
        deployed
            .iter()
            .find(|d| d.subdir == subdir && d.package == package)
    };
    let mut todo: Vec<(Pin, Option<deploy::Deployed>)> = Vec::new();
    for p in &report.pins {
        match find(&p.subdir, &p.package) {
            Some(d) if d.current.as_deref() == Some(p.instance_id.as_str()) => {
                if !deploy::healthy(&root, d, file.paranoid) {
                    log.log(
                        LogLevel::Info,
                        format!("Repairing {}:{} in /{}", p.package, p.instance_id, p.subdir),
                    );
                    todo.push((p.clone(), Some(d.clone())));
                }
            }
            d => todo.push((p.clone(), d.cloned())),
        }
    }
    let to_remove: Vec<&deploy::Deployed> = deployed
        .iter()
        .filter(|d| {
            !report
                .pins
                .iter()
                .any(|p| p.subdir == d.subdir && p.package == d.package)
        })
        .collect();
    if todo.is_empty() && to_remove.is_empty() {
        log.log(LogLevel::Info, "Everything is up-to-date.");
        return Ok(report);
    }

    for d in to_remove {
        log.log(
            LogLevel::Info,
            format!(
                "Removing {} from {}(/{})",
                d.package,
                root.display(),
                d.subdir
            ),
        );
        deploy::remove(&root, d)?;
        report.removed.push((d.subdir.clone(), d.package.clone()));
    }

    let tmp = root.join(deploy::SITE_SERVICE_DIR).join("tmp");
    fs::create_dir_all(&tmp)?;
    let fetched = par_map(&todo, opts.max_threads, |(p, _)| {
        let dest = tmp.join(format!("{}.zip", p.instance_id));
        let r = fetch(&client, store.as_ref(), &p.package, &p.instance_id, &dest);
        if let Ok(cached) = &r {
            let how = if *cached {
                "from the store"
            } else {
                "from the backend"
            };
            log.log(
                LogLevel::Info,
                format!("Fetched {}:{} {how}", p.package, p.instance_id),
            );
        }
        r.map(|c| (c, dest))
    });
    let mut result = Ok(());
    for ((p, existing), f) in todo.iter().zip(fetched) {
        let (cached, zip) = match f {
            Ok(v) => v,
            Err(e) => {
                errors.push(e.to_string());
                continue;
            }
        };
        if cached {
            report.from_store += 1;
        } else {
            report.downloaded += 1;
        }
        log.log(
            LogLevel::Info,
            format!(
                "Deploying {}:{} into {}(/{}){}",
                p.package,
                p.instance_id,
                root.display(),
                p.subdir,
                if file.override_copy {
                    " (copy-mode override)"
                } else {
                    ""
                }
            ),
        );
        let r = deploy::deploy(
            &root,
            &p.subdir,
            &p.package,
            &p.instance_id,
            &zip,
            file.override_copy,
            existing.as_ref(),
        );
        let _ = fs::remove_file(&zip);
        match r {
            Ok(()) => report.deployed.push(p.clone()),
            Err(e) => errors.push(format!(
                "failed to deploy {}:{}: {e}",
                p.package, p.instance_id
            )),
        }
    }
    let _ = fs::remove_dir(&tmp);
    if !errors.is_empty() {
        result = Err(Error::new(errors.join("\n")));
    }
    result?;
    log.log(LogLevel::Info, "All changes applied.");
    Ok(report)
}
