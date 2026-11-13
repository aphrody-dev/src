//! Bun's documentation inside `ay`: `ay docs sync` imports three sources into one SQLite FTS5 index,
//! `ay docs bun <query>` searches it (text or `--json` for agents), `ay docs show` prints a page,
//! `ay docs stats` describes the index, `ay docs schedule` keeps it fresh.
//!
//! Sources (each tagged in the index):
//! - `fork`: the md/mdx tree of the aphrody-labs/bun checkout (`third_party/bun/docs`), with the
//!   fork commit recorded;
//! - `upstream`: `https://bun.com/llms-full.txt`, split into its pages (`# Title` + `Source: URL`),
//!   plus the page count of `https://bun.com/llms.txt`;
//! - `skills`: every `bun*` agent skill under `~/.claude/skills` and `<repo>/.agents/skills`.
//!
//! Sync is incremental: a document is rewritten only when its wyhash (the bun crate flattened in
//! `aphrody-bun-flat`) changes, and documents gone from a source are deleted. `sync` is the command
//! shared by the scheduled task and the upstream watch (`ay bun watch`): run it after the fork or
//! bun.com moves. Plan: docs/ay/MIGRATION.md.

pub mod schedule;

use bun_flat::sort_by_number::SortByNumber;
use bun_flat::wyhash::Wyhash;
use rusqlite::{OptionalExtension, params};
/// Re-exported so callers need no direct rusqlite dependency.
pub use rusqlite::Connection;
use serde_json::{Value, json};
use std::collections::HashSet;
use std::path::{Path, PathBuf};
use std::time::{Instant, SystemTime, UNIX_EPOCH};

/// JSON schema tags of the machine outputs.
pub const SYNC_SCHEMA: &str = "ay-docs-sync/1";
pub const SEARCH_SCHEMA: &str = "ay-docs-search/1";
pub const STATS_SCHEMA: &str = "ay-docs-stats/1";

pub const LLMS_TXT: &str = "https://bun.com/llms.txt";
pub const LLMS_FULL: &str = "https://bun.com/llms-full.txt";
const DOCS_BASE: &str = "https://bun.com/docs/";

/// Source tags.
pub const SOURCES: &[&str] = &["fork", "upstream", "skills"];

/// Where things are.
#[derive(Debug, Clone)]
pub struct Config {
    /// The SQLite index.
    pub db: PathBuf,
    /// Monorepo root (`third_party/bun`, `.agents/skills`), if known.
    pub repo: Option<PathBuf>,
    /// Home directory (`~/.claude/skills`).
    pub home: Option<PathBuf>,
}

impl Config {
    /// `$AY_DOCS_DB`, else `<repo>/var/index/docs.db`, else `~/.local/share/ay/docs.db`.
    pub fn new(repo: Option<PathBuf>) -> Self {
        let home = std::env::var_os("USERPROFILE")
            .or_else(|| std::env::var_os("HOME"))
            .filter(|v| !v.is_empty())
            .map(PathBuf::from);
        let db = std::env::var_os("AY_DOCS_DB")
            .filter(|v| !v.is_empty())
            .map(PathBuf::from)
            .or_else(|| repo.as_ref().map(|r| r.join("var").join("index").join("docs.db")))
            .or_else(|| home.as_ref().map(|h| h.join(".local").join("share").join("ay").join("docs.db")))
            .unwrap_or_else(|| PathBuf::from("docs.db"));
        Self { db, repo, home }
    }

    pub fn fork_root(&self) -> Option<PathBuf> {
        self.repo.as_ref().map(|r| r.join("third_party").join("bun"))
    }

    /// `bun*` skill directories.
    pub fn skill_dirs(&self) -> Vec<PathBuf> {
        let mut roots = Vec::new();
        if let Some(h) = &self.home {
            roots.push(h.join(".claude").join("skills"));
        }
        if let Some(r) = &self.repo {
            roots.push(r.join(".agents").join("skills"));
        }
        let mut dirs: Vec<PathBuf> = roots
            .iter()
            .flat_map(|root| std::fs::read_dir(root).into_iter().flatten().flatten())
            .filter(|e| e.file_name().to_string_lossy().starts_with("bun") && e.path().is_dir())
            .map(|e| e.path())
            .collect();
        dirs.sort();
        dirs
    }
}

/// One document ready for the index.
#[derive(Debug, Clone, PartialEq)]
pub struct Doc {
    pub path: String,
    pub url: Option<String>,
    pub file: Option<String>,
    pub title: String,
    pub description: String,
    pub body: String,
}

/// Open (and create) the index.
pub fn open(db: &Path) -> rusqlite::Result<Connection> {
    if let Some(dir) = db.parent() {
        let _ = std::fs::create_dir_all(dir);
    }
    let conn = Connection::open(db)?;
    conn.execute_batch(
        "PRAGMA journal_mode=WAL;
         PRAGMA synchronous=NORMAL;
         CREATE TABLE IF NOT EXISTS docs(
           id INTEGER PRIMARY KEY, source TEXT NOT NULL, path TEXT NOT NULL, url TEXT, file TEXT,
           title TEXT NOT NULL, description TEXT NOT NULL, hash INTEGER NOT NULL, bytes INTEGER NOT NULL,
           UNIQUE(source, path));
         CREATE VIRTUAL TABLE IF NOT EXISTS docs_fts USING fts5(title, description, body, tokenize='porter unicode61');
         CREATE TABLE IF NOT EXISTS meta(key TEXT PRIMARY KEY, value TEXT NOT NULL);",
    )?;
    Ok(conn)
}

fn now_unix() -> u64 {
    SystemTime::now().duration_since(UNIX_EPOCH).map(|d| d.as_secs()).unwrap_or(0)
}

fn set_meta(conn: &Connection, key: &str, value: &str) -> rusqlite::Result<()> {
    conn.execute("INSERT INTO meta(key, value) VALUES(?1, ?2) ON CONFLICT(key) DO UPDATE SET value = excluded.value", params![key, value])?;
    Ok(())
}

fn get_meta(conn: &Connection, key: &str) -> Option<String> {
    conn.query_row("SELECT value FROM meta WHERE key = ?1", [key], |r| r.get(0)).optional().ok().flatten()
}

/// Content hash used for change detection (bun's wyhash, final4 variant, seed 0).
pub fn content_hash(doc: &Doc) -> u64 {
    let mut h = Wyhash::init(0);
    for part in [doc.title.as_bytes(), doc.description.as_bytes(), doc.body.as_bytes(), doc.url.as_deref().unwrap_or("").as_bytes()] {
        h.update(part);
        h.update(&[0]);
    }
    h.final_()
}

/// Counts of one source's sync.
#[derive(Debug, Default, Clone, PartialEq)]
pub struct Counts {
    pub added: usize,
    pub updated: usize,
    pub unchanged: usize,
    pub removed: usize,
}

/// Replace the documents of `source` with `docs`, touching only what changed.
pub fn apply(conn: &mut Connection, source: &str, docs: &[Doc]) -> rusqlite::Result<Counts> {
    let tx = conn.transaction()?;
    let mut counts = Counts::default();
    let mut seen = HashSet::new();
    {
        let mut find = tx.prepare_cached("SELECT id, hash FROM docs WHERE source = ?1 AND path = ?2")?;
        for doc in docs {
            if !seen.insert(doc.path.as_str()) {
                continue;
            }
            let hash = content_hash(doc) as i64;
            let found: Option<(i64, i64)> = find.query_row(params![source, doc.path], |r| Ok((r.get(0)?, r.get(1)?))).optional()?;
            let id = match found {
                Some((_, old)) if old == hash => {
                    counts.unchanged += 1;
                    continue;
                }
                Some((id, _)) => {
                    tx.execute(
                        "UPDATE docs SET url = ?2, file = ?3, title = ?4, description = ?5, hash = ?6, bytes = ?7 WHERE id = ?1",
                        params![id, doc.url, doc.file, doc.title, doc.description, hash, doc.body.len() as i64],
                    )?;
                    tx.execute("DELETE FROM docs_fts WHERE rowid = ?1", [id])?;
                    counts.updated += 1;
                    id
                }
                None => {
                    tx.execute(
                        "INSERT INTO docs(source, path, url, file, title, description, hash, bytes) VALUES(?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
                        params![source, doc.path, doc.url, doc.file, doc.title, doc.description, hash, doc.body.len() as i64],
                    )?;
                    counts.added += 1;
                    tx.last_insert_rowid()
                }
            };
            tx.execute(
                "INSERT INTO docs_fts(rowid, title, description, body) VALUES(?1, ?2, ?3, ?4)",
                params![id, doc.title, doc.description, doc.body],
            )?;
        }
        let mut stale = Vec::new();
        let mut all = tx.prepare("SELECT id, path FROM docs WHERE source = ?1")?;
        for row in all.query_map([source], |r| Ok((r.get::<_, i64>(0)?, r.get::<_, String>(1)?)))? {
            let (id, path) = row?;
            if !seen.contains(path.as_str()) {
                stale.push(id);
            }
        }
        for id in stale {
            tx.execute("DELETE FROM docs WHERE id = ?1", [id])?;
            tx.execute("DELETE FROM docs_fts WHERE rowid = ?1", [id])?;
            counts.removed += 1;
        }
    }
    tx.commit()?;
    Ok(counts)
}

/// Frontmatter (`---` block) as (key, value) pairs and the rest of the text.
pub fn split_frontmatter(text: &str) -> (Vec<(String, String)>, &str) {
    let t = text.strip_prefix('\u{feff}').unwrap_or(text);
    let Some(rest) = t.strip_prefix("---\n").or_else(|| t.strip_prefix("---\r\n")) else {
        return (Vec::new(), t);
    };
    let Some(end) = rest.find("\n---") else {
        return (Vec::new(), t);
    };
    let block = &rest[..end];
    let after = rest[end + 4..].trim_start_matches(['\r', '\n']);
    let pairs = block
        .lines()
        .filter_map(|l| {
            let (k, v) = l.split_once(':')?;
            if k.starts_with(' ') {
                return None;
            }
            let v = v.trim().trim_matches(|c| c == '"' || c == '\'');
            Some((k.trim().to_string(), v.to_string()))
        })
        .collect();
    (pairs, after)
}

fn first_heading(body: &str) -> Option<String> {
    body.lines().find_map(|l| l.strip_prefix("# ").map(|t| t.trim().to_string()))
}

/// MDX module lines (`import`, `export`) carry no prose.
fn strip_mdx(body: &str) -> String {
    body.lines()
        .filter(|l| !(l.starts_with("import ") || l.starts_with("export ")))
        .collect::<Vec<_>>()
        .join("\n")
}

fn walk(dir: &Path, exts: &[&str], out: &mut Vec<PathBuf>) {
    let Ok(rd) = std::fs::read_dir(dir) else { return };
    for e in rd.flatten() {
        let p = e.path();
        let name = e.file_name();
        if name == "node_modules" || name.to_string_lossy().starts_with('.') {
            continue;
        }
        if p.is_dir() {
            walk(&p, exts, out);
        } else if p.extension().and_then(|x| x.to_str()).is_some_and(|x| exts.contains(&x)) {
            out.push(p);
        }
    }
}

fn rel_slash(path: &Path, base: &Path) -> String {
    path.strip_prefix(base).unwrap_or(path).to_string_lossy().replace('\\', "/")
}

/// The fork's md/mdx pages, with their bun.com URLs.
pub fn fork_docs(fork: &Path) -> Vec<Doc> {
    let docs_dir = fork.join("docs");
    let mut files = Vec::new();
    walk(&docs_dir, &["md", "mdx"], &mut files);
    files.sort();
    files
        .iter()
        .filter_map(|f| {
            let text = std::fs::read_to_string(f).ok()?;
            let rel = rel_slash(f, &docs_dir);
            let (front, body) = split_frontmatter(&text);
            let get = |k: &str| front.iter().find(|(key, _)| key == k).map(|(_, v)| v.clone());
            let slug = rel.rsplit_once('.').map_or(rel.as_str(), |(s, _)| s);
            Some(Doc {
                path: format!("docs/{rel}"),
                url: Some(format!("{DOCS_BASE}{slug}")),
                file: Some(f.to_string_lossy().into_owned()),
                title: get("title").or_else(|| first_heading(body)).unwrap_or_else(|| slug.to_string()),
                description: get("description").unwrap_or_default(),
                body: strip_mdx(body),
            })
        })
        .collect()
}

/// Pages of `llms-full.txt`: each starts with `# Title` and a `Source: <url>` line.
pub fn split_llms_full(text: &str) -> Vec<Doc> {
    let lines: Vec<&str> = text.lines().collect();
    // A `# ` line inside a fenced code block is shell or Python, not a page title.
    let mut fenced = false;
    let mut starts = Vec::new();
    for (i, line) in lines.iter().enumerate() {
        if line.trim_start().starts_with("```") {
            fenced = !fenced;
        } else if !fenced && line.starts_with("# ") && lines.get(i + 1).is_some_and(|n| n.starts_with("Source: ")) {
            starts.push(i);
        }
    }
    starts
        .iter()
        .enumerate()
        .map(|(n, &i)| {
            let end = starts.get(n + 1).copied().unwrap_or(lines.len());
            let url = lines[i + 1]["Source: ".len()..].trim().to_string();
            let body = lines[i + 2..end].join("\n");
            let description = body.split("\n\n").map(str::trim).find(|p| !p.is_empty()).unwrap_or("").to_string();
            let path = url.split_once("://").map_or(url.as_str(), |(_, r)| r.split_once('/').map_or("", |(_, p)| p)).to_string();
            Doc { path, url: Some(url), file: None, title: lines[i][2..].trim().to_string(), description, body }
        })
        .collect()
}

/// Number of page links in `llms.txt`.
pub fn count_llms_links(text: &str) -> usize {
    text.lines().filter(|l| l.trim_start().starts_with("- [")).count()
}

/// Every markdown file of the `bun*` skills.
pub fn skill_docs(dirs: &[PathBuf]) -> Vec<Doc> {
    let mut docs = Vec::new();
    for dir in dirs {
        let name = dir.file_name().map(|n| n.to_string_lossy().into_owned()).unwrap_or_default();
        let mut files = Vec::new();
        walk(dir, &["md", "mdx"], &mut files);
        files.sort();
        for f in files {
            let Ok(text) = std::fs::read_to_string(&f) else { continue };
            let (front, body) = split_frontmatter(&text);
            let get = |k: &str| front.iter().find(|(key, _)| key == k).map(|(_, v)| v.clone());
            let rel = rel_slash(&f, dir);
            docs.push(Doc {
                path: format!("{name}/{rel}"),
                url: None,
                file: Some(f.to_string_lossy().into_owned()),
                title: get("name").map(|n| format!("skill {n}")).or_else(|| first_heading(body)).unwrap_or_else(|| format!("{name}/{rel}")),
                description: get("description").unwrap_or_default(),
                body: body.to_string(),
            });
        }
    }
    docs
}

fn fetch(url: &str) -> Result<String, String> {
    let mut resp = ureq::get(url)
        .header("User-Agent", concat!("ay-docs/", env!("CARGO_PKG_VERSION")))
        .call()
        .map_err(|e| format!("{url}: {e}"))?;
    resp.body_mut()
        .with_config()
        .limit(64 * 1024 * 1024)
        .read_to_string()
        .map_err(|e| format!("{url}: {e}"))
}

fn git_head(dir: &Path) -> Option<String> {
    let out = std::process::Command::new("git").arg("-C").arg(dir).args(["rev-parse", "HEAD"]).output().ok()?;
    out.status.success().then(|| String::from_utf8_lossy(&out.stdout).trim().to_string())
}

/// What `ay docs sync` does.
#[derive(Debug, Clone, Default)]
pub struct SyncOptions {
    /// Subset of [`SOURCES`]; empty = all.
    pub sources: Vec<String>,
    /// Skip the network (`upstream`).
    pub offline: bool,
}

/// Load one source and apply it; a load failure is reported in the JSON, an index failure aborts.
fn run_source(
    conn: &mut Connection,
    report: &mut Vec<Value>,
    source: &str,
    load: impl FnOnce() -> Result<(Vec<Doc>, Value), String>,
) -> Result<(), String> {
    let t = Instant::now();
    match load() {
        Ok((docs, info)) => {
            let c = apply(conn, source, &docs).map_err(|e| format!("{source}: {e}"))?;
            report.push(json!({
                "source": source, "ok": true, "documents": docs.len(),
                "added": c.added, "updated": c.updated, "unchanged": c.unchanged, "removed": c.removed,
                "ms": t.elapsed().as_millis() as u64, "info": info,
            }));
        }
        Err(e) => report.push(json!({"source": source, "ok": false, "error": e, "ms": t.elapsed().as_millis() as u64})),
    }
    Ok(())
}

/// Run the sync and return its JSON report (schema [`SYNC_SCHEMA`]).
pub fn sync(cfg: &Config, opts: &SyncOptions) -> Result<Value, String> {
    for s in &opts.sources {
        if !SOURCES.contains(&s.as_str()) {
            return Err(format!("unknown source {s} ({})", SOURCES.join(", ")));
        }
    }
    let wanted = |s: &str| opts.sources.is_empty() || opts.sources.iter().any(|x| x == s);
    let mut conn = open(&cfg.db).map_err(|e| format!("{}: {e}", cfg.db.display()))?;
    let mut report = Vec::new();
    if wanted("fork") {
        let fork = cfg.fork_root().filter(|f| f.join("docs").is_dir());
        let commit = fork.as_deref().and_then(git_head).unwrap_or_default();
        run_source(&mut conn, &mut report, "fork", || {
            let fork = fork.clone().ok_or("third_party/bun/docs not checked out (set SRC_ROOT or --root)")?;
            Ok((fork_docs(&fork), json!({"commit": commit, "root": fork.to_string_lossy()})))
        })?;
        if !commit.is_empty() && report.last().is_some_and(|r| r["ok"] == true) {
            set_meta(&conn, "fork_commit", &commit).map_err(|e| e.to_string())?;
        }
    }
    if wanted("upstream") && !opts.offline {
        run_source(&mut conn, &mut report, "upstream", || {
            let full = fetch(LLMS_FULL)?;
            let listed = fetch(LLMS_TXT).map(|t| count_llms_links(&t)).ok();
            let pages = split_llms_full(&full);
            if pages.is_empty() {
                return Err(format!("{LLMS_FULL}: no `# Title` / `Source:` pages found"));
            }
            let info = json!({
                "llms_full_bytes": full.len(),
                "llms_full_hash": format!("{:016x}", Wyhash::hash(0, full.as_bytes())),
                "llms_txt_pages": listed,
            });
            Ok((pages, info))
        })?;
    }
    if wanted("skills") {
        let dirs = cfg.skill_dirs();
        run_source(&mut conn, &mut report, "skills", || {
            let names: Vec<String> = dirs.iter().map(|d| d.to_string_lossy().into_owned()).collect();
            Ok((skill_docs(&dirs), json!({"dirs": names})))
        })?;
    }
    let ok = report.iter().all(|r| r["ok"].as_bool() == Some(true));
    let synced = now_unix();
    set_meta(&conn, "synced_at", &synced.to_string()).map_err(|e| e.to_string())?;
    let _ = conn.execute_batch("INSERT INTO docs_fts(docs_fts) VALUES('optimize');");
    Ok(json!({"schema": SYNC_SCHEMA, "ok": ok, "db": cfg.db.to_string_lossy(), "synced_at": synced, "sources": report}))
}

/// One search hit.
#[derive(Debug, Clone, PartialEq)]
pub struct Hit {
    pub source: String,
    pub path: String,
    pub url: Option<String>,
    pub file: Option<String>,
    pub title: String,
    pub snippet: String,
    pub score: f64,
}

impl Hit {
    pub fn json(&self) -> Value {
        json!({"source": self.source, "path": self.path, "url": self.url, "file": self.file, "title": self.title, "snippet": self.snippet, "score": self.score})
    }
}

/// Query words (letters, digits, `_`), lowercased.
pub fn tokens(query: &str) -> Vec<String> {
    query
        .split(|c: char| !(c.is_alphanumeric() || c == '_'))
        .filter(|t| !t.is_empty())
        .map(str::to_lowercase)
        .collect()
}

/// FTS5 MATCH expression: every word quoted, the last one as a prefix; AND or OR.
pub fn match_expr(words: &[String], any: bool) -> String {
    let parts: Vec<String> = words
        .iter()
        .enumerate()
        .map(|(i, w)| if i + 1 == words.len() { format!("\"{w}\"*") } else { format!("\"{w}\"") })
        .collect();
    parts.join(if any { " OR " } else { " " })
}

/// Search: bm25 (title 10, description 4, body 1), then a title-match boost, one hit per URL
/// (the fork copy wins over the bun.com copy of the same page), `limit` hits.
pub fn search(conn: &Connection, query: &str, source: Option<&str>, limit: usize) -> rusqlite::Result<Vec<Hit>> {
    let words = tokens(query);
    if words.is_empty() {
        return Ok(Vec::new());
    }
    let mut hits = Vec::new();
    for any in [false, true] {
        let mut stmt = conn.prepare_cached(
            "SELECT d.source, d.path, d.url, d.file, d.title,
                    snippet(docs_fts, 2, '[', ']', '...', 14), bm25(docs_fts, 10.0, 4.0, 1.0)
             FROM docs_fts JOIN docs d ON d.id = docs_fts.rowid
             WHERE docs_fts MATCH ?1 AND (?2 IS NULL OR d.source = ?2)
             ORDER BY bm25(docs_fts, 10.0, 4.0, 1.0) LIMIT ?3",
        )?;
        let rows = stmt.query_map(params![match_expr(&words, any), source, (limit * 4).max(20) as i64], |r| {
            Ok(Hit {
                source: r.get(0)?,
                path: r.get(1)?,
                url: r.get(2)?,
                file: r.get(3)?,
                title: r.get(4)?,
                snippet: r.get::<_, String>(5)?.replace('\n', " "),
                score: r.get(6)?,
            })
        })?;
        hits = rows.collect::<rusqlite::Result<Vec<_>>>()?;
        if !hits.is_empty() || words.len() == 1 {
            break;
        }
    }
    let mut hits = merge_by_url(hits);
    rank(&mut hits, &words);
    hits.truncate(limit);
    Ok(hits)
}

/// One hit per URL: the fork's copy (else bun.com's) carries the best score of the group.
fn merge_by_url(hits: Vec<Hit>) -> Vec<Hit> {
    let mut out: Vec<Hit> = Vec::with_capacity(hits.len());
    let mut at: std::collections::HashMap<String, usize> = std::collections::HashMap::new();
    for h in hits {
        let Some(url) = h.url.clone() else {
            out.push(h);
            continue;
        };
        match at.get(&url) {
            Some(&i) => {
                let best = out[i].score.min(h.score);
                if source_order(&h.source) < source_order(&out[i].source) {
                    out[i] = h;
                }
                out[i].score = best;
            }
            None => {
                at.insert(url, out.len());
                out.push(h);
            }
        }
    }
    out
}

fn source_order(source: &str) -> u64 {
    match source {
        "fork" => 0,
        "upstream" => 1,
        _ => 2,
    }
}

/// Final order: bm25 (lower is better) minus a boost when the title holds every query word, the
/// fork before bun.com before skills on ties. One u64 key per hit, sorted by bun's sort_by_number.
pub fn rank(hits: &mut [Hit], words: &[String]) {
    hits.sort_by_u64(|h| {
        let title = h.title.to_lowercase();
        let boost = if words.iter().all(|w| title.contains(w.as_str())) { 8.0 } else { 0.0 };
        let tie = source_order(&h.source);
        let s = (h.score - boost + 1.0e6).max(0.0);
        (((s * 1.0e4) as u64) << 2) | tie
    });
}

/// `ay docs bun --json` payload.
pub fn search_json(cfg: &Config, conn: &Connection, query: &str, hits: &[Hit]) -> Value {
    json!({
        "schema": SEARCH_SCHEMA,
        "query": query,
        "db": cfg.db.to_string_lossy(),
        "fork_commit": get_meta(conn, "fork_commit"),
        "synced_at": get_meta(conn, "synced_at").and_then(|v| v.parse::<u64>().ok()),
        "results": hits.iter().map(Hit::json).collect::<Vec<_>>(),
    })
}

/// A page by path (exact, then suffix) or URL: (source, path, url, title, body).
pub fn show(conn: &Connection, key: &str) -> rusqlite::Result<Option<(String, String, Option<String>, String, String)>> {
    let (source, key) = match key.split_once(':') {
        Some((s, k)) if SOURCES.contains(&s) => (Some(s), k),
        _ => (None, key),
    };
    conn.query_row(
        "SELECT d.source, d.path, d.url, d.title, f.body FROM docs d JOIN docs_fts f ON f.rowid = d.id
         WHERE (?2 IS NULL OR d.source = ?2) AND (d.path = ?1 OR d.url = ?1 OR d.path LIKE '%' || ?1 OR d.path LIKE '%' || ?1 || '.md%')
         ORDER BY d.path = ?1 DESC, d.url = ?1 DESC, CASE d.source WHEN 'fork' THEN 0 WHEN 'upstream' THEN 1 ELSE 2 END, length(d.path)
         LIMIT 1",
        params![key, source],
        |r| Ok((r.get(0)?, r.get(1)?, r.get(2)?, r.get(3)?, r.get(4)?)),
    )
    .optional()
}

/// `ay docs stats` payload (schema [`STATS_SCHEMA`]).
pub fn stats(cfg: &Config, conn: &Connection) -> rusqlite::Result<Value> {
    let mut stmt = conn.prepare("SELECT source, count(*), sum(bytes) FROM docs GROUP BY source ORDER BY source")?;
    let sources = stmt
        .query_map([], |r| Ok(json!({"source": r.get::<_, String>(0)?, "documents": r.get::<_, i64>(1)?, "bytes": r.get::<_, i64>(2)?})))?
        .collect::<rusqlite::Result<Vec<_>>>()?;
    Ok(json!({
        "schema": STATS_SCHEMA,
        "db": cfg.db.to_string_lossy(),
        "db_bytes": std::fs::metadata(&cfg.db).map(|m| m.len()).unwrap_or(0),
        "fork_commit": get_meta(conn, "fork_commit"),
        "synced_at": get_meta(conn, "synced_at").and_then(|v| v.parse::<u64>().ok()),
        "sources": sources,
    }))
}

#[cfg(test)]
mod tests {
    use super::*;

    fn doc(path: &str, title: &str, body: &str) -> Doc {
        Doc { path: path.into(), url: Some(format!("{DOCS_BASE}{path}")), file: None, title: title.into(), description: String::new(), body: body.into() }
    }

    #[test]
    fn frontmatter_and_mdx() {
        let (front, body) = split_frontmatter("---\ntitle: \"bunfig.toml\"\ndescription: Configure Bun\n---\n\nimport X from 'y';\n# H\ntext");
        assert_eq!(front, [("title".to_string(), "bunfig.toml".to_string()), ("description".to_string(), "Configure Bun".to_string())]);
        assert_eq!(strip_mdx(body), "# H\ntext");
        assert_eq!(split_frontmatter("# no front").0, Vec::<(String, String)>::new());
    }

    #[test]
    fn llms_full_pages() {
        let text = "# Bytecode Caching\nSource: https://bun.com/docs/bundler/bytecode\n\nSpeed up startup\n\n## Usage\nbun build --bytecode\n# Not a page\n```sh\n# CSS\nSource: not a page either\n```\n# CSS\nSource: https://bun.com/docs/bundler/css\n\nCSS bundler\n";
        let pages = split_llms_full(text);
        assert_eq!(pages.len(), 2);
        assert_eq!(pages[0].title, "Bytecode Caching");
        assert_eq!(pages[0].path, "docs/bundler/bytecode");
        assert_eq!(pages[0].description, "Speed up startup");
        assert!(pages[0].body.contains("# Not a page"));
        assert_eq!(pages[1].url.as_deref(), Some("https://bun.com/docs/bundler/css"));
        assert_eq!(count_llms_links("# Bun\n- [a](x): y\n- [b](z)\ntext"), 2);
    }

    #[test]
    fn query_expressions() {
        assert_eq!(tokens("Bun.serve() websocket"), ["bun", "serve", "websocket"]);
        assert_eq!(match_expr(&tokens("bun serve"), false), "\"bun\" \"serve\"*");
        assert_eq!(match_expr(&tokens("a b"), true), "\"a\" OR \"b\"*");
        assert!(tokens("\"*()").is_empty());
    }

    #[test]
    fn incremental_apply_search_show_stats() {
        let dir = tempfile::tempdir().unwrap();
        let cfg = Config { db: dir.path().join("docs.db"), repo: None, home: None };
        let mut conn = open(&cfg.db).unwrap();
        let a = vec![
            doc("docs/runtime/bunfig", "bunfig.toml", "Configure the package manager registry"),
            doc("docs/api/http", "HTTP server", "Bun.serve starts a server with websocket support"),
        ];
        assert_eq!(apply(&mut conn, "fork", &a).unwrap(), Counts { added: 2, ..Counts::default() });
        assert_eq!(apply(&mut conn, "fork", &a).unwrap(), Counts { unchanged: 2, ..Counts::default() });
        let b = vec![doc("docs/api/http", "HTTP server", "Bun.serve starts a server; routes too")];
        assert_eq!(apply(&mut conn, "fork", &b).unwrap(), Counts { updated: 1, removed: 1, ..Counts::default() });
        apply(&mut conn, "upstream", &[doc("docs/api/http", "HTTP server", "Bun.serve routes upstream copy")]).unwrap();

        let hits = search(&conn, "serve routes", None, 10).unwrap();
        assert_eq!(hits.len(), 1, "same URL is returned once");
        assert_eq!(hits[0].source, "fork");
        assert!(hits[0].snippet.contains("[routes]"), "{}", hits[0].snippet);
        assert!(search(&conn, "registry", None, 10).unwrap().is_empty(), "removed page is gone");
        assert_eq!(search(&conn, "serv", Some("upstream"), 10).unwrap()[0].source, "upstream");
        assert_eq!(search(&conn, "nothingmatches serve", None, 10).unwrap().len(), 1, "falls back to OR");

        let page = show(&conn, "api/http").unwrap().unwrap();
        assert_eq!((page.0.as_str(), page.3.as_str()), ("fork", "HTTP server"));
        assert_eq!(show(&conn, "upstream:docs/api/http").unwrap().unwrap().0, "upstream");
        let s = stats(&cfg, &conn).unwrap();
        assert_eq!(s["sources"].as_array().unwrap().len(), 2);
    }

    #[test]
    fn rank_prefers_title_matches() {
        let mut hits = vec![
            Hit { source: "fork".into(), path: "a".into(), url: None, file: None, title: "Other".into(), snippet: String::new(), score: -5.0 },
            Hit { source: "upstream".into(), path: "b".into(), url: None, file: None, title: "Bun Shell".into(), snippet: String::new(), score: -4.0 },
        ];
        rank(&mut hits, &tokens("shell"));
        assert_eq!(hits[0].path, "b");
    }
}
