//! `gclient sync` on gitoxide: a planner that compares the evaluated tree with the disk, and an
//! executor that clones from the depot_tools git cache (objects shared through
//! `objects/info/alternates`, like `git clone --shared`), fetches what the cache lacks, and checks
//! out the pinned revision detached. Dry run unless the caller asks to apply.
//!
//! CIPD packages are delegated to the official `cipd` client (`cipd ensure`), as gclient does;
//! GCS objects are listed but not downloaded here.

use crate::tree::{Client, DepKind, split_url_revision};
use crate::{Error, Result};
use std::path::{Path, PathBuf};
use std::sync::Mutex;
use std::sync::atomic::{AtomicBool, AtomicUsize, Ordering};

/// What sync has to do for one dependency.
#[derive(Debug, Clone, PartialEq)]
pub enum Action {
    /// Not on disk: create the repository, then check out.
    Clone,
    /// On disk, revision missing locally: fetch, then check out.
    Fetch,
    /// On disk with the object present: check out.
    Checkout,
    /// Already at the pinned revision.
    UpToDate,
    /// A branch-tracking entry (no `@revision`), left alone when present.
    Unpinned,
    /// On disk but not a git checkout, or has local changes.
    Blocked(String),
    /// CIPD package for `cipd ensure`.
    Cipd,
    /// GCS object (not handled by this executor).
    Gcs,
}

#[derive(Debug, Clone)]
pub struct PlanItem {
    pub name: String,
    pub path: PathBuf,
    pub url: String,
    pub revision: Option<String>,
    /// HEAD on disk, when it is a git checkout.
    pub current: Option<String>,
    /// The depot_tools git cache mirror for `url`, when it exists.
    pub mirror: Option<PathBuf>,
    pub action: Action,
    /// Fetch into `mirror` before checking out (`PlanOptions::populate_cache`).
    pub populate: bool,
    /// The object, for `Action::Gcs`.
    pub gcs: Option<crate::gcs::GcsObject>,
}

/// `git_cache.Mirror.UrlToCacheDir`.
pub fn cache_dir_name(url: &str) -> String {
    let mut norm = match url.split_once("://") {
        Some((_, rest)) => rest.to_string(),
        None => url.to_string(),
    };
    if let Some(s) = norm.strip_suffix(".git") {
        norm = s.to_string();
    }
    norm = norm
        .replace("googlesource.com/a/", "googlesource.com/")
        .to_lowercase();
    norm.replace(':', "__")
        .replace('-', "--")
        .replace(['/', '\\'], "-")
}

/// Selection of dependencies to plan.
#[derive(Debug, Clone, Default)]
pub struct PlanOptions {
    /// Only these names (exact, or a path prefix such as `src/third_party`).
    pub only: Vec<String>,
    /// Include the solutions themselves.
    pub include_solutions: bool,
    /// Fetch pinned revisions into the shared git cache first (`git cache populate`), so
    /// every checkout of the same URL reuses one copy of the objects.
    pub populate_cache: bool,
}

fn selected(name: &str, only: &[String]) -> bool {
    only.is_empty()
        || only.iter().any(|o| {
            name == o
                || name
                    .strip_prefix(o.as_str())
                    .is_some_and(|r| r.starts_with('/') || r.starts_with(':'))
        })
}

fn head_of(path: &Path) -> Option<(gix::Repository, Option<String>)> {
    let repo = gix::open(path).ok()?;
    // A path inside a parent checkout resolves to its own `.git` only when that exists.
    if repo
        .workdir()
        .map(|w| w != path && w.canonicalize().ok() != path.canonicalize().ok())
        .unwrap_or(true)
    {
        return None;
    }
    let head = repo.head_id().ok().map(|id| id.to_string());
    Some((repo, head))
}

/// Compare the tree with the disk.
pub fn plan(client: &Client, opts: &PlanOptions) -> Vec<PlanItem> {
    let solutions: Vec<String> = client.solutions().map(|s| s.name.clone()).collect();
    let mut out = Vec::new();
    for idx in client.processed() {
        let n = &client.nodes[idx];
        if !selected(&n.name, &opts.only)
            || (!opts.include_solutions && solutions.contains(&n.name))
        {
            continue;
        }
        let Some(full) = n.url.clone() else { continue };
        let path = client.root_dir.join(&n.deps_key);
        let item = |action, url: String, revision: Option<String>, current, mirror| PlanItem {
            name: n.name.clone(),
            path: path.clone(),
            url,
            revision,
            current,
            mirror,
            action,
            populate: false,
            gcs: None,
        };
        match &n.kind {
            DepKind::Cipd { .. } => out.push(item(Action::Cipd, full, None, None, None)),
            DepKind::Gcs {
                bucket,
                object_name,
                sha256sum,
                size_bytes,
                output_file,
            } => {
                let obj = crate::gcs::GcsObject {
                    bucket: bucket.clone(),
                    object_name: object_name.clone(),
                    sha256sum: sha256sum.clone(),
                    size_bytes: *size_bytes,
                    output_file: output_file.clone(),
                };
                let action = match obj.download_needed(&path) {
                    Ok(false) => Action::UpToDate,
                    Ok(true) => Action::Gcs,
                    Err(e) => Action::Blocked(e.to_string()),
                };
                out.push(PlanItem {
                    gcs: Some(obj),
                    ..item(action, full, None, None, None)
                });
            }
            DepKind::Root => {}
            DepKind::Git => {
                let (url, rev) = split_url_revision(&full);
                let (url, rev) = (url.to_string(), rev.map(str::to_string));
                let mirror = client
                    .cache_dir
                    .as_ref()
                    .map(|c| c.join(cache_dir_name(&url)))
                    .filter(|m| {
                        opts.populate_cache
                            || m.join("objects").is_dir()
                            || m.join(".git/objects").is_dir()
                    });
                let action;
                let mut current = None;
                if !path.join(".git").exists() {
                    action = if path.is_dir()
                        && std::fs::read_dir(&path)
                            .map(|mut d| d.next().is_some())
                            .unwrap_or(false)
                    {
                        Action::Blocked("directory exists and is not a git checkout".into())
                    } else {
                        Action::Clone
                    };
                } else if let Some((repo, head)) = head_of(&path) {
                    current = head.clone();
                    action = match &rev {
                        None => Action::Unpinned,
                        Some(r) if head.as_deref() == Some(r.as_str()) => Action::UpToDate,
                        Some(r) => match gix::ObjectId::from_hex(r.as_bytes()) {
                            Ok(id) if repo.find_object(id).is_ok() => Action::Checkout,
                            Ok(_) => Action::Fetch,
                            Err(_) => Action::Fetch, // a ref name, resolved after fetching
                        },
                    };
                } else {
                    action = Action::Blocked("cannot open the git repository".into());
                }
                let populate = opts.populate_cache
                    && mirror.is_some()
                    && rev.is_some()
                    && matches!(action, Action::Clone | Action::Fetch);
                out.push(PlanItem {
                    populate,
                    ..item(action, url, rev, current, mirror)
                });
            }
        }
    }
    out
}

/// Render the plan as aligned text.
pub fn render_plan(items: &[PlanItem]) -> String {
    let mut s = String::new();
    for it in items {
        let what = match &it.action {
            Action::Clone => format!(
                "clone    {}@{}",
                it.url,
                it.revision.as_deref().unwrap_or("HEAD")
            ),
            Action::Fetch => format!(
                "fetch    {} -> {}",
                short(it.current.as_deref()),
                it.revision.as_deref().unwrap_or("?")
            ),
            Action::Checkout => format!(
                "checkout {} -> {}",
                short(it.current.as_deref()),
                it.revision.as_deref().unwrap_or("?")
            ),
            Action::UpToDate => "ok".to_string(),
            Action::Unpinned => format!("unpinned {}", it.url),
            Action::Blocked(why) => format!("blocked  {why}"),
            Action::Cipd => format!("cipd     {}", it.url),
            Action::Gcs => format!("gcs      {}", it.url),
        };
        let cache = if it.mirror.is_some() && matches!(it.action, Action::Clone | Action::Fetch) {
            " (cache)"
        } else {
            ""
        };
        s.push_str(&format!("{:<60} {what}{cache}\n", it.name));
    }
    s
}

fn short(rev: Option<&str>) -> &str {
    rev.map(|r| &r[..r.len().min(12)]).unwrap_or("-")
}

/// Outcome of one executed item.
#[derive(Debug)]
pub struct Done {
    pub name: String,
    pub result: Result<String>,
}

/// Run the git items of `plan` with up to `jobs` threads. Nested checkouts run after the
/// checkouts that contain them.
pub fn execute(plan: &[PlanItem], jobs: usize, log: &(dyn Fn(&str) + Sync)) -> Vec<Done> {
    // gix runs the filters of the git config (`filter.lfs.process` after `git lfs install`).
    // googlesource mirrors do not serve LFS (HTTP 405), and gclient checkouts keep LFS
    // pointers as plain git without git-lfs does; git-lfs honors this variable.
    if std::env::var_os("GIT_LFS_SKIP_SMUDGE").is_none() {
        // SAFETY: set before any worker thread or filter process is started.
        unsafe { std::env::set_var("GIT_LFS_SKIP_SMUDGE", "1") };
    }
    let work: Vec<&PlanItem> = plan
        .iter()
        .filter(|p| {
            matches!(
                p.action,
                Action::Clone | Action::Fetch | Action::Checkout | Action::Gcs
            )
        })
        .collect();
    // Depth = how many other work items contain this path.
    let depth = |p: &PlanItem| {
        work.iter()
            .filter(|o| p.path != o.path && p.path.starts_with(&o.path))
            .count()
    };
    let max_depth = work.iter().map(|p| depth(p)).max().unwrap_or(0);
    let results = Mutex::new(Vec::new());
    for level in 0..=max_depth {
        let batch: Vec<&PlanItem> = work.iter().copied().filter(|p| depth(p) == level).collect();
        let next = AtomicUsize::new(0);
        std::thread::scope(|s| {
            for _ in 0..jobs.max(1).min(batch.len().max(1)) {
                s.spawn(|| {
                    loop {
                        let i = next.fetch_add(1, Ordering::SeqCst);
                        let Some(item) = batch.get(i) else { break };
                        let r = sync_one(item);
                        match &r {
                            Ok(msg) => log(&format!("{}: {msg}", item.name)),
                            Err(e) => log(&format!("{}: error: {e}", item.name)),
                        }
                        results
                            .lock()
                            .unwrap_or_else(|p| p.into_inner())
                            .push(Done {
                                name: item.name.clone(),
                                result: r,
                            });
                    }
                });
            }
        });
    }
    results.into_inner().unwrap_or_else(|p| p.into_inner())
}

fn gerr(e: impl std::fmt::Display) -> Error {
    Error::new(e.to_string())
}

/// The content-addressed store shared by every GCS download of this process
/// (`depot_cas::default_root`); `None` when it cannot be opened (downloads still work).
fn cas() -> Option<&'static depot_cas::Store> {
    static STORE: std::sync::OnceLock<Option<depot_cas::Store>> = std::sync::OnceLock::new();
    STORE
        .get_or_init(|| depot_cas::Store::open(depot_cas::default_root()).ok())
        .as_ref()
}

fn sync_one(item: &PlanItem) -> Result<String> {
    if let (Action::Gcs, Some(obj)) = (&item.action, &item.gcs) {
        return crate::gcs::sync_object(obj, &item.path, cas());
    }
    let fresh = item.action == Action::Clone;
    let mut populated = false;
    if item.populate
        && let (Some(m), Some(rev)) = (&item.mirror, &item.revision)
    {
        populated = populate_mirror(m, &item.url, rev)?;
    }
    if fresh && item.revision.is_none() {
        // A solution or branch-tracking dep: a regular clone of the default branch.
        let interrupt = AtomicBool::new(false);
        let mut prep = gix::prepare_clone(item.url.as_str(), &item.path).map_err(gerr)?;
        let (mut co, _) = prep
            .fetch_then_checkout(gix::progress::Discard, &interrupt)
            .map_err(gerr)?;
        let (repo, _) = co
            .main_worktree(gix::progress::Discard, &interrupt)
            .map_err(gerr)?;
        return Ok(format!(
            "cloned {}",
            repo.head_id().map(|i| i.to_string()).unwrap_or_default()
        ));
    }
    let repo = if fresh {
        init_checkout(item)?
    } else {
        gix::open(&item.path).map_err(gerr)?
    };
    let rev = item.revision.as_deref().unwrap_or("HEAD");
    let mut fetched = false;
    let mut repo = repo;
    if resolve(&repo, rev).is_none()
        && !fresh
        && item.mirror.is_some()
        && add_mirror_alternate(&repo, item)?
    {
        // The cache mirror may already hold the commit; no transfer needed then.
        repo = gix::open(&item.path).map_err(gerr)?;
    }
    let id = match resolve(&repo, rev) {
        Some(id) => id,
        None => {
            fetch(&repo, &item.url, rev)?;
            fetched = true;
            resolve(&repo, rev)
                .ok_or_else(|| Error::new(format!("{rev} not found after fetching {}", item.url)))?
        }
    };
    if !fresh && repo.is_dirty().map_err(gerr)? {
        return Err(Error::new("local changes; commit or discard them first"));
    }
    checkout(&repo, id, fresh)?;
    Ok(format!(
        "{}{}{}",
        if populated { "cache populated, " } else { "" },
        if fetched { "fetched, " } else { "" },
        id
    ))
}

fn mirror_objects(mirror: &Path) -> String {
    let objects = if mirror.join("objects").is_dir() {
        mirror.join("objects")
    } else {
        mirror.join(".git/objects")
    };
    let p = objects.canonicalize().unwrap_or(objects);
    p.to_string_lossy()
        .trim_start_matches(r"\\?\")
        .replace('\\', "/")
}

/// Append the cache mirror to `objects/info/alternates` unless it is listed. Returns whether
/// the file changed. Local fetches through gix would spawn `git-upload-pack`; alternates keep
/// the cache usable without a git binary.
fn add_mirror_alternate(repo: &gix::Repository, item: &PlanItem) -> Result<bool> {
    let Some(m) = &item.mirror else {
        return Ok(false);
    };
    let line = mirror_objects(m);
    let info = repo.objects.store_ref().path().join("info");
    std::fs::create_dir_all(&info)?;
    let file = info.join("alternates");
    let current = std::fs::read_to_string(&file).unwrap_or_default();
    if current
        .lines()
        .any(|l| l.trim().eq_ignore_ascii_case(&line))
    {
        return Ok(false);
    }
    let mut text = current;
    if !text.is_empty() && !text.ends_with('\n') {
        text.push('\n');
    }
    text.push_str(&line);
    text.push('\n');
    std::fs::write(&file, text)?;
    Ok(true)
}

/// `gix init`, origin remote, and alternates into the cache mirror.
fn init_checkout(item: &PlanItem) -> Result<gix::Repository> {
    std::fs::create_dir_all(&item.path)?;
    let repo = gix::init(&item.path).map_err(gerr)?;
    let config = repo.git_dir().join("config");
    let mut text = std::fs::read_to_string(&config).unwrap_or_default();
    text.push_str(&format!(
        "[remote \"origin\"]\n\turl = {}\n\tfetch = +refs/heads/*:refs/remotes/origin/*\n",
        item.url
    ));
    std::fs::write(&config, text)?;
    add_mirror_alternate(&repo, item)?;
    // Re-open so the object database sees the alternates.
    gix::open(&item.path).map_err(gerr)
}

fn resolve(repo: &gix::Repository, rev: &str) -> Option<gix::ObjectId> {
    if let Ok(id) = gix::ObjectId::from_hex(rev.as_bytes()) {
        return repo.find_object(id).ok().map(|o| o.id);
    }
    for candidate in [
        rev.to_string(),
        format!("refs/remotes/origin/{rev}"),
        format!(
            "refs/remotes/origin/{}",
            rev.trim_start_matches("refs/heads/")
        ),
    ] {
        if let Ok(id) = repo.rev_parse_single(candidate.as_str()) {
            return Some(id.detach());
        }
    }
    None
}

/// `git cache populate` for one pinned revision: create the bare mirror with the
/// layout `git_cache.Mirror` uses (origin, `+refs/heads/*:refs/heads/*`) when missing, then
/// fetch only the pin, kept alive by `refs/ay/pins/<id>`. Upstream `git cache populate`
/// can run on the same mirror afterwards. Returns whether anything was fetched.
fn populate_mirror(mirror: &Path, url: &str, rev: &str) -> Result<bool> {
    if !mirror.join("objects").is_dir() {
        std::fs::create_dir_all(mirror)?;
        let repo = gix::init_bare(mirror).map_err(gerr)?;
        let config = repo.git_dir().join("config");
        let mut text = std::fs::read_to_string(&config).unwrap_or_default();
        text.push_str(&format!(
            "[remote \"origin\"]
	url = {url}
	fetch = +refs/heads/*:refs/heads/*
"
        ));
        std::fs::write(&config, text)?;
    }
    let repo = gix::open(mirror).map_err(gerr)?;
    let pinned = gix::ObjectId::from_hex(rev.as_bytes()).ok();
    if pinned.is_some_and(|id| repo.find_object(id).is_ok()) {
        return Ok(false);
    }
    let dest = match pinned {
        Some(id) => format!("refs/ay/pins/{id}"),
        None => "refs/heads/*".to_string(),
    };
    fetch_into(&repo, url, rev, &dest)?;
    Ok(true)
}

fn fetch(repo: &gix::Repository, url: &str, rev: &str) -> Result<()> {
    fetch_into(repo, url, rev, "refs/ay/pinned")
}

fn fetch_into(repo: &gix::Repository, url: &str, rev: &str, pin_ref: &str) -> Result<()> {
    use gix::remote::Direction;
    // Gerrit and GitHub serve any reachable commit by id, so a pinned dep fetches just that.
    let specs = if gix::ObjectId::from_hex(rev.as_bytes()).is_ok() {
        vec![format!("+{rev}:{pin_ref}")]
    } else if pin_ref.ends_with("/*") {
        vec![format!("+refs/heads/*:{pin_ref}")]
    } else {
        vec!["+refs/heads/*:refs/remotes/origin/*".to_string()]
    };
    let remote = repo
        .remote_at(url)
        .map_err(gerr)?
        .with_refspecs(specs.iter().map(String::as_str), Direction::Fetch)
        .map_err(gerr)?;
    let interrupt = AtomicBool::new(false);
    remote
        .connect(Direction::Fetch)
        .map_err(gerr)?
        .prepare_fetch(gix::progress::Discard, Default::default())
        .map_err(gerr)?
        .receive(gix::progress::Discard, &interrupt)
        .map_err(gerr)?;
    Ok(())
}

/// Check out `id`'s tree, remove files the old index tracked that the new one does not, write
/// the index and detach HEAD at `id`.
fn checkout(repo: &gix::Repository, id: gix::ObjectId, fresh: bool) -> Result<()> {
    use gix::refs::transaction::{Change, LogChange, PreviousValue, RefEdit, RefLog};
    let workdir = repo
        .workdir()
        .ok_or_else(|| Error::new("bare repository"))?
        .to_path_buf();
    let tree = repo
        .find_object(id)
        .map_err(gerr)?
        .peel_to_tree()
        .map_err(gerr)?
        .id;
    let mut index = repo.index_from_tree(&tree).map_err(gerr)?;

    if !fresh && let Ok(old) = repo.open_index() {
        // Remove what the new tree drops or changes: checkout writes the new index but does not
        // delete files the old index tracked.
        let new_entries: std::collections::HashMap<
            Vec<u8>,
            (gix::ObjectId, gix::index::entry::Mode),
        > = index
            .entries()
            .iter()
            .map(|e| (e.path(&index).to_vec(), (e.id, e.mode)))
            .collect();
        for e in old.entries() {
            let p = e.path(&old);
            let unchanged = new_entries
                .get(p.as_ref() as &[u8])
                .is_some_and(|(id, mode)| *id == e.id && *mode == e.mode);
            if !unchanged && e.mode != gix::index::entry::Mode::COMMIT {
                let rel = String::from_utf8_lossy(p).to_string();
                let _ = std::fs::remove_file(workdir.join(&rel));
            }
        }
    }

    // The repository config drives filters and capabilities (core.autocrlf, symlinks), as
    // `git checkout` would.
    let mut opts = repo
        .checkout_options(gix::worktree::stack::state::attributes::Source::IdMapping)
        .map_err(gerr)?;
    opts.destination_is_initially_empty = false;
    opts.overwrite_existing = true;
    opts.thread_limit = Some(1);
    let interrupt = AtomicBool::new(false);
    let objects = repo.objects.clone().into_arc().map_err(gerr)?;
    gix::worktree::state::checkout(
        &mut index,
        &workdir,
        objects,
        &gix::progress::Discard,
        &gix::progress::Discard,
        &interrupt,
        opts,
    )
    .map_err(gerr)?;
    index.write(Default::default()).map_err(gerr)?;
    // The HEAD reflog needs a committer; hosts and CI runners without user.name/user.email get a fallback
    // (gitoxide.committer.*Fallback only applies when nothing is configured).
    let mut repo = repo.clone();
    {
        use gix::config::tree::gitoxide::Committer;
        let mut cfg = repo.config_snapshot_mut();
        cfg.set_value(&Committer::NAME_FALLBACK, "ay gclient")
            .map_err(gerr)?;
        cfg.set_value(&Committer::EMAIL_FALLBACK, "ay-gclient@localhost")
            .map_err(gerr)?;
    }
    repo.edit_reference(RefEdit {
        change: Change::Update {
            log: LogChange {
                mode: RefLog::AndReference,
                force_create_reflog: false,
                message: "ay gclient sync".into(),
            },
            expected: PreviousValue::Any,
            new: gix::refs::Target::Object(id),
        },
        name: "HEAD".try_into().map_err(gerr)?,
        deref: false,
    })
    .map_err(gerr)?;
    Ok(())
}

/// The ensure file for the CIPD packages of `plan` (`CipdRoot.ensure_file_content`), relative
/// to `root`.
pub fn cipd_ensure_file(client: &Client, plan: &[PlanItem]) -> String {
    let mut by_dir: std::collections::BTreeMap<String, Vec<(String, String)>> = Default::default();
    for it in plan.iter().filter(|p| p.action == Action::Cipd) {
        if let Some(n) = client.nodes.iter().find(|n| n.name == it.name)
            && let DepKind::Cipd { package, version } = &n.kind
        {
            by_dir
                .entry(n.deps_key.clone())
                .or_default()
                .push((package.clone(), version.clone()));
        }
    }
    let mut s = String::from("$ParanoidMode CheckPresence\n$OverrideInstallMode copy\n\n");
    for (dir, pkgs) in by_dir {
        s.push_str(&format!("@Subdir {dir}\n"));
        for (p, v) in pkgs {
            s.push_str(&format!("{p} {v}\n"));
        }
        s.push('\n');
    }
    s
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn cache_names_match_git_cache() {
        assert_eq!(
            cache_dir_name("https://chromium.googlesource.com/chromium/src.git"),
            "chromium.googlesource.com-chromium-src"
        );
        assert_eq!(
            cache_dir_name("https://chromium.googlesource.com/angle/angle.git"),
            "chromium.googlesource.com-angle-angle"
        );
        assert_eq!(
            cache_dir_name("https://chromium.googlesource.com/a/cast_core/public"),
            "chromium.googlesource.com-cast_core-public"
        );
        assert_eq!(cache_dir_name("https://host/foo-bar"), "host-foo--bar");
    }

    fn commit_files(
        repo: &gix::Repository,
        files: &[(&str, &str)],
        parents: Vec<gix::ObjectId>,
    ) -> gix::ObjectId {
        let mut entries: Vec<gix::objs::tree::Entry> = files
            .iter()
            .map(|(name, body)| gix::objs::tree::Entry {
                mode: gix::objs::tree::EntryKind::Blob.into(),
                filename: (*name).into(),
                oid: repo.write_blob(body.as_bytes()).unwrap().detach(),
            })
            .collect();
        entries.sort_by(|a, b| a.filename.cmp(&b.filename));
        let tree = repo
            .write_object(&gix::objs::Tree { entries })
            .unwrap()
            .detach();
        // Explicit identity: CI runners have no git user.name/user.email.
        let sig = gix::actor::SignatureRef {
            name: "test".into(),
            email: "test@example.invalid".into(),
            time: "0 +0000",
        };
        repo.commit_as(sig, sig, "refs/heads/main", "c", tree, parents)
            .unwrap()
            .detach()
    }

    /// Moving an existing checkout to another commit must leave exactly the new tree: shrunk
    /// files truncated, dropped files removed.
    #[test]
    fn checkout_replaces_existing_tree() {
        let dir = std::env::temp_dir().join(format!("depot-gclient-sync-{}", std::process::id()));
        let _ = std::fs::remove_dir_all(&dir);
        let repo = gix::init(&dir).unwrap();
        let a = commit_files(
            &repo,
            &[
                ("f.txt", "a much longer first version\n"),
                ("gone.txt", "x\n"),
            ],
            vec![],
        );
        let b = commit_files(&repo, &[("f.txt", "short\n"), ("new.txt", "n\n")], vec![a]);
        checkout(&repo, a, true).unwrap();
        assert_eq!(
            std::fs::read_to_string(dir.join("gone.txt")).unwrap(),
            "x\n"
        );
        let repo = gix::open(&dir).unwrap();
        checkout(&repo, b, false).unwrap();
        assert_eq!(
            std::fs::read_to_string(dir.join("f.txt")).unwrap(),
            "short\n"
        );
        assert!(!dir.join("gone.txt").exists());
        assert_eq!(std::fs::read_to_string(dir.join("new.txt")).unwrap(), "n\n");
        let repo = gix::open(&dir).unwrap();
        assert_eq!(repo.head_id().unwrap().detach(), b);
        assert!(!repo.is_dirty().unwrap());
        assert!(
            std::fs::read_to_string(dir.join(".git/HEAD"))
                .unwrap()
                .ends_with('\n')
        );
        let _ = std::fs::remove_dir_all(&dir);
    }

    #[test]
    fn selection_by_prefix() {
        assert!(selected("src/third_party/a", &["src/third_party".into()]));
        assert!(!selected("src/third_party_x", &["src/third_party".into()]));
        assert!(selected("src/tool:pkg", &["src/tool".into()]));
    }
}
