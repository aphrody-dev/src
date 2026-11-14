//! `ay bun watch`: one poll of every upstream source, diffed against the previous state.

use super::{WatchArgs, bold, dim, error, iso_from_unix, iso_now, state_path, str_of, warn};
use serde_json::{Map, Value, json};
use std::collections::{BTreeMap, BTreeSet};
use std::path::{Path, PathBuf};
use std::process::{Command, Stdio};

pub const SCHEMA: &str = "bun-watch/1";
const UPSTREAM: &str = "oven-sh/bun";
const FORK: &str = "aphrody-labs/bun";
/// Files whose blob hash is tracked on upstream main: contributor guide and Windows build guide.
pub const DOCS: &[&str] = &[
    "CONTRIBUTING.md",
    "docs/project/contributing.mdx",
    "docs/project/building-windows.mdx",
    "LATEST",
];
const BLOG_FEED: &str = "https://bun.com/rss.xml";
const NPM: &str = "https://registry.npmjs.org";
const CRATES: &str = "https://crates.io/api/v1/crates";
/// Request caps, so a first run or a long gap stays within the unauthenticated rate limit.
const MAX_FILES: usize = 40;
const MAX_PR_FILES: usize = 40;
const MAX_ISSUE_REFS: usize = 20;

// ----------------------------------------------------------------------------------------------
// HTTP

/// GitHub REST client over `up::fetch::request`: token from GH_TOKEN / GITHUB_TOKEN, else
/// `gh auth token`; conditional requests with the ETags of the previous run.
pub struct Gh {
    token: Option<String>,
    pub calls: u32,
}

fn gh_token() -> Option<String> {
    if let Some(t) = ["GH_TOKEN", "GITHUB_TOKEN"].iter().find_map(|k| std::env::var(k).ok().filter(|v| !v.is_empty())) {
        return Some(t);
    }
    let out = Command::new("gh").args(["auth", "token"]).stdin(Stdio::null()).stderr(Stdio::null()).output().ok()?;
    let t = String::from_utf8_lossy(&out.stdout).trim().to_string();
    (out.status.success() && !t.is_empty()).then_some(t)
}

/// What a GET returned: `None` body on 304 Not Modified.
pub struct Got {
    pub etag: Option<String>,
    pub body: Option<Value>,
}

impl Gh {
    pub fn new() -> Gh {
        Gh { token: gh_token(), calls: 0 }
    }

    pub fn authenticated(&self) -> bool {
        self.token.is_some()
    }

    /// Raw bytes of an authenticated GET (artifact zips, job logs); redirects drop the token.
    pub fn raw(&mut self, url: &str) -> Result<Vec<u8>, String> {
        let auth = self.token.as_ref().map(|t| format!("Bearer {t}"));
        let mut headers: Vec<(&str, &str)> = vec![("Accept", "application/vnd.github+json")];
        if let Some(a) = &auth {
            headers.push(("Authorization", a.as_str()));
        }
        self.calls += 1;
        up::fetch::get(url, &headers).map_err(|(_, m)| m)
    }

    pub fn get(&mut self, path: &str, etag: Option<&str>) -> Result<Got, String> {
        let url = if path.starts_with("https://") { path.to_string() } else { format!("https://api.github.com/{path}") };
        let auth = self.token.as_ref().map(|t| format!("Bearer {t}"));
        let mut headers: Vec<(&str, &str)> = vec![("Accept", "application/vnd.github+json")];
        if let Some(a) = &auth {
            headers.push(("Authorization", a.as_str()));
        }
        if let Some(e) = etag {
            headers.push(("If-None-Match", e));
        }
        self.calls += 1;
        let r = up::fetch::request(&url, &headers)?;
        decode(&url, r)
    }
}

fn decode(url: &str, r: up::fetch::Reply) -> Result<Got, String> {
    let short = url.split('?').next().unwrap_or(url);
    match r.status {
        304 => Ok(Got { etag: r.etag, body: None }),
        200..=299 => {
            let body = serde_json::from_slice(&r.body).unwrap_or_else(|_| Value::String(String::from_utf8_lossy(&r.body).into_owned()));
            Ok(Got { etag: r.etag, body: Some(body) })
        }
        code => {
            let text = String::from_utf8_lossy(&r.body);
            let msg = serde_json::from_str::<Value>(&text).ok().map(|v| str_of(&v, "message").to_string()).unwrap_or_default();
            let hint = if code == 403 || code == 429 { " (rate limit? set GH_TOKEN or run `gh auth login`)" } else { "" };
            Err(format!("HTTP {code} for {short}: {msg}{hint}"))
        }
    }
}

/// Plain GET (npm, crates.io, bun.com) with an optional ETag.
fn get_url(url: &str, accept: &str, etag: Option<&str>) -> Result<(Option<String>, Option<Vec<u8>>), String> {
    let mut headers = vec![("Accept", accept)];
    if let Some(e) = etag {
        headers.push(("If-None-Match", e));
    }
    let r = up::fetch::request(url, &headers)?;
    match r.status {
        304 => Ok((r.etag, None)),
        200..=299 => Ok((r.etag, Some(r.body))),
        code => Err(format!("HTTP {code} for {}", url.split('?').next().unwrap_or(url))),
    }
}

fn json_url(url: &str) -> Result<Value, String> {
    let (_, body) = get_url(url, "application/json", None)?;
    serde_json::from_slice(&body.unwrap_or_default()).map_err(|e| format!("{url}: {e}"))
}

/// Percent-encode a path for a query string (keeps `/` and the unreserved set).
pub fn encode(s: &str) -> String {
    s.bytes()
        .map(|b| match b {
            b'A'..=b'Z' | b'a'..=b'z' | b'0'..=b'9' | b'-' | b'_' | b'.' | b'~' | b'/' => (b as char).to_string(),
            _ => format!("%{b:02X}"),
        })
        .collect()
}

// ----------------------------------------------------------------------------------------------
// Context

struct Cx {
    gh: Gh,
    prev: Value,
    next: Map<String, Value>,
    /// Lower bound for "since the last run" queries.
    since: String,
    errors: Vec<Value>,
}

impl Cx {
    fn prev_etag(&self, url: &str) -> Option<String> {
        self.prev.pointer("/etags").and_then(|e| e.get(url)).and_then(Value::as_str).map(str::to_string)
    }

    fn keep_etag(&mut self, url: &str, etag: Option<String>) {
        let tags = self.next.entry("etags").or_insert_with(|| json!({}));
        if let (Some(obj), Some(e)) = (tags.as_object_mut(), etag) {
            obj.insert(url.to_string(), Value::String(e));
        }
    }

    /// Carry the previous value of `key` over (the source failed or answered 304).
    fn carry(&mut self, key: &str) {
        if let Some(v) = self.prev.get(key) {
            self.next.insert(key.to_string(), v.clone());
        }
    }

    fn fail(&mut self, source: &str, msg: String, carry: &[&str]) -> Value {
        for k in carry {
            self.carry(k);
        }
        self.errors.push(json!({"source": source, "message": msg}));
        json!({"error": msg})
    }
}

fn first_line(s: &str) -> String {
    s.lines().next().unwrap_or("").trim().to_string()
}

fn arr(v: &Value) -> &[Value] {
    v.as_array().map(Vec::as_slice).unwrap_or(&[])
}

// ----------------------------------------------------------------------------------------------
// Sources

fn commit_entry(c: &Value) -> Value {
    let msg = c.pointer("/commit/message").and_then(Value::as_str).unwrap_or("");
    let title = first_line(msg);
    let author = c.pointer("/author/login").and_then(Value::as_str).or_else(|| c.pointer("/commit/author/name").and_then(Value::as_str)).unwrap_or("");
    json!({
        "sha": str_of(c, "sha"),
        "date": c.pointer("/commit/committer/date").and_then(Value::as_str).unwrap_or(""),
        "author": author,
        "title": title,
        "pr": pr_suffix(&title),
    })
}

/// `fix: x (#12345)` -> 12345 (the squash-merge convention of oven-sh/bun).
pub fn pr_suffix(title: &str) -> Option<u64> {
    let t = title.trim_end();
    let inner = t.strip_suffix(')')?;
    let start = inner.rfind("(#")?;
    inner[start + 2..].parse().ok()
}

fn main_commits(cx: &mut Cx) -> Result<Value, String> {
    let branch = cx.gh.get(&format!("repos/{UPSTREAM}/branches/main"), None)?.body.unwrap_or_default();
    let head = branch.pointer("/commit/sha").and_then(Value::as_str).ok_or("no main head")?.to_string();
    let previous = cx.prev.get("main_sha").and_then(Value::as_str).map(str::to_string);
    let mut out = json!({"head": head, "previous": previous, "commits": [], "total": 0, "files": []});
    match previous.as_deref() {
        Some(p) if p == head => {}
        Some(p) => {
            let cmp = cx.gh.get(&format!("repos/{UPSTREAM}/compare/{p}...{head}"), None)?.body.unwrap_or_default();
            let mut commits: Vec<Value> = arr(&cmp["commits"]).iter().map(commit_entry).collect();
            commits.reverse();
            out["total"] = cmp.get("total_commits").cloned().unwrap_or(json!(commits.len()));
            out["commits"] = Value::Array(commits);
            out["files"] = Value::Array(arr(&cmp["files"]).iter().map(|f| f["filename"].clone()).collect());
        }
        None => {
            let list = cx.gh.get(&format!("repos/{UPSTREAM}/commits?sha=main&per_page=20"), None)?.body.unwrap_or_default();
            let commits: Vec<Value> = arr(&list).iter().map(commit_entry).collect();
            out["first_run"] = json!(true);
            out["total"] = json!(commits.len());
            out["commits"] = Value::Array(commits);
        }
    }
    cx.next.insert("main_sha".into(), json!(head));
    Ok(out)
}

fn pr_entry(p: &Value) -> Value {
    json!({
        "number": p["number"],
        "title": str_of(p, "title"),
        "user": p.pointer("/user/login").and_then(Value::as_str).unwrap_or(""),
        "created_at": str_of(p, "created_at"),
        "updated_at": str_of(p, "updated_at"),
        "merged_at": p["merged_at"],
        "draft": p["draft"],
    })
}

fn pulls(cx: &mut Cx) -> Result<Value, String> {
    let since = cx.since.clone();
    let open = cx.gh.get(&format!("repos/{UPSTREAM}/pulls?state=open&sort=updated&direction=desc&per_page=100"), None)?.body.unwrap_or_default();
    let open: Vec<Value> = arr(&open).iter().filter(|p| str_of(p, "updated_at") > since.as_str()).map(pr_entry).collect();
    let closed = cx.gh.get(&format!("repos/{UPSTREAM}/pulls?state=closed&sort=updated&direction=desc&per_page=100"), None)?.body.unwrap_or_default();
    let merged: Vec<Value> = arr(&closed)
        .iter()
        .filter(|p| p["merged_at"].as_str().is_some_and(|m| m > since.as_str()))
        .map(pr_entry)
        .collect();
    let opened: Vec<Value> = open.iter().filter(|p| str_of(p, "created_at") > since.as_str()).cloned().collect();
    Ok(json!({"since": since, "opened": opened, "updated_open": open, "merged": merged}))
}

fn windows_issues(cx: &mut Cx) -> Result<Value, String> {
    let since = cx.since.clone();
    let url = format!("repos/{UPSTREAM}/issues?labels=windows&state=all&sort=updated&direction=desc&per_page=100&since={since}");
    let list = cx.gh.get(&url, None)?.body.unwrap_or_default();
    let items: Vec<Value> = arr(&list)
        .iter()
        .filter(|i| i.get("pull_request").is_none())
        .map(|i| {
            let kind = if str_of(i, "created_at") > since.as_str() {
                "new"
            } else if i["closed_at"].as_str().is_some_and(|c| c > since.as_str()) {
                "closed"
            } else {
                "updated"
            };
            json!({"number": i["number"], "title": str_of(i, "title"), "state": str_of(i, "state"), "kind": kind, "updated_at": str_of(i, "updated_at")})
        })
        .collect();
    Ok(json!({"label": "windows", "since": since, "issues": items}))
}

fn docs(cx: &mut Cx) -> Value {
    let mut out = vec![];
    let mut hashes = Map::new();
    for path in DOCS {
        let url = format!("repos/{UPSTREAM}/contents/{path}?ref=main");
        let previous = cx.prev.pointer("/docs").and_then(|d| d.get(*path)).and_then(Value::as_str).map(str::to_string);
        let etag = cx.prev_etag(&url);
        match cx.gh.get(&url, etag.as_deref()) {
            Ok(got) => {
                let sha = match &got.body {
                    Some(b) => str_of(b, "sha").to_string(),
                    None => previous.clone().unwrap_or_default(),
                };
                cx.keep_etag(&url, got.etag);
                let changed = previous.as_deref().is_some_and(|p| p != sha);
                out.push(json!({"path": path, "sha": sha, "previous": previous, "changed": changed}));
                hashes.insert(path.to_string(), json!(sha));
            }
            Err(e) => {
                if let Some(p) = previous {
                    hashes.insert(path.to_string(), json!(p));
                }
                cx.errors.push(json!({"source": format!("docs {path}"), "message": e}));
            }
        }
    }
    cx.next.insert("docs".into(), Value::Object(hashes));
    Value::Array(out)
}

/// Parse a `sha256sum` file into name -> hex.
pub fn shasums(text: &str) -> BTreeMap<String, String> {
    text.lines()
        .filter_map(|l| {
            let mut it = l.split_whitespace();
            let h = it.next()?;
            let n = it.next()?.trim_start_matches('*');
            (h.len() == 64).then(|| (n.to_string(), h.to_ascii_lowercase()))
        })
        .collect()
}

/// Release summary: assets with GitHub digests, and whether SHASUMS256.txt lags behind them.
pub fn release_summary(rel: &Value, sums: Option<&BTreeMap<String, String>>) -> Value {
    let mut assets = Map::new();
    let mut sums_at = None;
    for a in arr(&rel["assets"]) {
        let name = str_of(a, "name");
        if name == "SHASUMS256.txt" {
            sums_at = Some(str_of(a, "updated_at").to_string());
        }
        assets.insert(name.to_string(), json!({"digest": a["digest"], "updated_at": str_of(a, "updated_at"), "size": a["size"]}));
    }
    let binaries = || assets.iter().filter(|(n, _)| !n.starts_with("SHASUMS"));
    let newer: Vec<Value> = match &sums_at {
        Some(at) => binaries().filter(|(_, a)| str_of(a, "updated_at") > at.as_str()).map(|(n, _)| json!(n)).collect(),
        None => vec![],
    };
    let newest = binaries().map(|(_, a)| str_of(a, "updated_at").to_string()).max().unwrap_or_default();
    let mismatched: Vec<Value> = match sums {
        Some(s) => binaries()
            .filter_map(|(n, a)| {
                let digest = a["digest"].as_str()?.strip_prefix("sha256:")?;
                match s.get(n) {
                    Some(listed) if listed != digest => Some(json!({"asset": n, "shasums": listed, "digest": digest})),
                    None => Some(json!({"asset": n, "shasums": null, "digest": digest})),
                    _ => None,
                }
            })
            .collect(),
        None => vec![],
    };
    let stale = !newer.is_empty() || !mismatched.is_empty();
    json!({
        "tag": str_of(rel, "tag_name"),
        "name": str_of(rel, "name"),
        "published_at": str_of(rel, "published_at"),
        "assets": assets,
        "shasums": {"updated_at": sums_at, "newest_asset": newest, "assets_newer": newer, "mismatched": mismatched, "stale": stale},
    })
}

/// Assets whose digest changed (republished under the same name) or that appeared.
pub fn changed_assets(prev: &Value, cur: &Value) -> Vec<Value> {
    let Some(assets) = cur["assets"].as_object() else { return vec![] };
    if prev.is_null() || str_of(prev, "tag") != str_of(cur, "tag") {
        return vec![];
    }
    assets
        .iter()
        .filter_map(|(n, a)| {
            let old = prev.pointer(&format!("/assets/{}", n.replace('~', "~0").replace('/', "~1"))).map(|p| p["digest"].clone());
            match old {
                Some(o) if o == a["digest"] => None,
                o => Some(json!({"asset": n, "previous": o, "digest": a["digest"], "updated_at": a["updated_at"]})),
            }
        })
        .collect()
}

fn releases(cx: &mut Cx) -> Value {
    let mut out = Map::new();
    let mut keep = Map::new();
    for (key, path) in [("stable", format!("repos/{UPSTREAM}/releases/latest")), ("canary", format!("repos/{UPSTREAM}/releases/tags/canary"))] {
        let previous = cx.prev.pointer(&format!("/releases/{key}")).cloned().unwrap_or(Value::Null);
        let etag = cx.prev_etag(&path).filter(|_| !previous.is_null());
        match cx.gh.get(&path, etag.as_deref()) {
            Ok(Got { etag, body: None }) => {
                cx.keep_etag(&path, etag);
                let mut v = previous.clone();
                v["changed"] = json!([]);
                v["not_modified"] = json!(true);
                out.insert(key.into(), v);
                keep.insert(key.into(), previous);
            }
            Ok(Got { etag, body: Some(rel) }) => {
                cx.keep_etag(&path, etag);
                let sums_url = arr(&rel["assets"]).iter().find(|a| str_of(a, "name") == "SHASUMS256.txt").map(|a| str_of(a, "browser_download_url").to_string());
                let sums = sums_url.and_then(|u| match up::fetch::get(&u, &[]) {
                    Ok(b) => Some(shasums(&String::from_utf8_lossy(&b))),
                    Err((_, m)) => {
                        cx.errors.push(json!({"source": format!("releases {key} SHASUMS256.txt"), "message": m}));
                        None
                    }
                });
                let summary = release_summary(&rel, sums.as_ref());
                let mut v = summary.clone();
                v["changed"] = Value::Array(changed_assets(&previous, &summary));
                v["previous_tag"] = previous.get("tag").cloned().unwrap_or(Value::Null);
                out.insert(key.into(), v);
                keep.insert(key.into(), summary);
            }
            Err(e) => {
                if !previous.is_null() {
                    keep.insert(key.into(), previous);
                }
                cx.errors.push(json!({"source": format!("releases {key}"), "message": e.clone()}));
                out.insert(key.into(), json!({"error": e}));
            }
        }
    }
    cx.next.insert("releases".into(), Value::Object(keep));
    Value::Object(out)
}

fn tag_text(item: &str, tag: &str) -> String {
    let open = format!("<{tag}>");
    let close = format!("</{tag}>");
    let Some(s) = item.find(&open) else { return String::new() };
    let rest = &item[s + open.len()..];
    let text = &rest[..rest.find(&close).unwrap_or(rest.len())];
    let text = text.trim().trim_start_matches("<![CDATA[").trim_end_matches("]]>");
    text.replace("&amp;", "&").replace("&lt;", "<").replace("&gt;", ">").replace("&quot;", "\"").replace("&#39;", "'")
}

/// `<item>` entries of an RSS 2.0 feed: title, link, pubDate.
pub fn rss_items(xml: &str) -> Vec<Value> {
    xml.split("<item>")
        .skip(1)
        .map(|it| {
            let it = &it[..it.find("</item>").unwrap_or(it.len())];
            json!({"title": tag_text(it, "title"), "link": tag_text(it, "link"), "date": tag_text(it, "pubDate")})
        })
        .collect()
}

fn blog(cx: &mut Cx) -> Result<Value, String> {
    let etag = cx.prev_etag(BLOG_FEED);
    let seen: BTreeSet<String> = arr(cx.prev.get("blog").unwrap_or(&Value::Null)).iter().filter_map(|v| v.as_str().map(str::to_string)).collect();
    let (etag, body) = get_url(BLOG_FEED, "application/rss+xml", etag.as_deref())?;
    cx.keep_etag(BLOG_FEED, etag);
    let Some(body) = body else {
        cx.carry("blog");
        return Ok(json!({"new": [], "not_modified": true}));
    };
    let items = rss_items(&String::from_utf8_lossy(&body));
    let first = seen.is_empty();
    let new: Vec<Value> = items.iter().filter(|i| !first && !seen.contains(str_of(i, "link"))).cloned().collect();
    let links: Vec<Value> = items.iter().take(100).map(|i| i["link"].clone()).collect();
    cx.next.insert("blog".into(), Value::Array(links));
    Ok(json!({"new": new, "latest": items.first().cloned()}))
}

fn npm(cx: &mut Cx) -> Result<Value, String> {
    // `scope:oven` is the documented qualifier; on 2026-11-13 it returned 0 objects, so the
    // text query `@oven/bun` is the fallback (filtered to the @oven scope).
    let mut query = "scope:oven";
    let mut found = json_url(&format!("{NPM}/-/v1/search?text=scope:oven&size=250"))?;
    if found["total"].as_u64().unwrap_or(0) == 0 {
        query = "@oven/bun";
        found = json_url(&format!("{NPM}/-/v1/search?text=%40oven%2Fbun&size=250"))?;
    }
    let prev = cx.prev.get("npm").cloned().unwrap_or(json!({}));
    let mut versions = Map::new();
    for o in arr(&found["objects"]) {
        let name = o.pointer("/package/name").and_then(Value::as_str).unwrap_or("");
        if name.starts_with("@oven/") {
            versions.insert(name.into(), o.pointer("/package/version").cloned().unwrap_or(Value::Null));
        }
    }
    let tags = json_url(&format!("{NPM}/-/package/bun/dist-tags"))?;
    for (tag, v) in tags.as_object().into_iter().flatten() {
        versions.insert(format!("bun@{tag}"), v.clone());
    }
    let changed: Vec<Value> = versions
        .iter()
        .filter(|(n, v)| prev.as_object().is_some_and(|p| !p.is_empty() && p.get(*n) != Some(*v)))
        .map(|(n, v)| json!({"name": n, "version": v, "previous": prev.get(n)}))
        .collect();
    let out = json!({"query": query, "packages": versions.len(), "dist_tags": tags, "changed": changed});
    cx.next.insert("npm".into(), Value::Object(versions));
    Ok(out)
}

/// Crates named after bun (`bun`, `bun-*`, `*-bun`, `*_bun_*`, `bunjs`, ...).
pub fn bun_named(name: &str) -> bool {
    name.split(['-', '_']).any(|w| w == "bun" || w == "bunjs" || w == "oven")
}

fn crates(cx: &mut Cx) -> Result<Value, String> {
    let mut versions = Map::new();
    let by_keyword = json_url(&format!("{CRATES}?keyword=bun&per_page=100"))?;
    let by_text = json_url(&format!("{CRATES}?q=bun&sort=recent-updates&per_page=100"))?;
    for c in arr(&by_keyword["crates"]).iter().chain(arr(&by_text["crates"]).iter().filter(|c| bun_named(str_of(c, "name")))) {
        versions.insert(str_of(c, "name").to_string(), json!({"version": c["max_version"], "updated_at": c["updated_at"]}));
    }
    let prev = cx.prev.get("crates").cloned().unwrap_or(json!({}));
    let first = prev.as_object().is_none_or(|p| p.is_empty());
    let changed: Vec<Value> = versions
        .iter()
        .filter(|(n, v)| !first && prev.get(*n).map(|p| &p["version"]) != Some(&v["version"]))
        .map(|(n, v)| json!({"name": n, "version": v["version"], "previous": prev.get(n).map(|p| p["version"].clone())}))
        .collect();
    let out = json!({"crates": versions.len(), "changed": changed});
    cx.next.insert("crates".into(), Value::Object(versions));
    Ok(out)
}

// ----------------------------------------------------------------------------------------------
// Fork cross-check

#[derive(Debug, Clone, PartialEq)]
pub struct ForkCommit {
    pub sha: String,
    pub title: String,
    pub body: String,
    pub files: Vec<String>,
}

fn git(dir: &Path, args: &[&str]) -> Option<String> {
    let out = Command::new("git").arg("-C").arg(dir).args(args).stdin(Stdio::null()).stderr(Stdio::null()).output().ok()?;
    out.status.success().then(|| String::from_utf8_lossy(&out.stdout).into_owned())
}

/// `git log --format=%x1e%H%x1f%s%x1f%b%x1f --name-only` output.
pub fn parse_fork_log(text: &str) -> Vec<ForkCommit> {
    text.split('\x1e')
        .filter_map(|rec| {
            let mut f = rec.splitn(4, '\x1f');
            let sha = f.next()?.trim().to_string();
            if sha.is_empty() {
                return None;
            }
            let title = f.next().unwrap_or("").trim().to_string();
            let body = f.next().unwrap_or("").trim().to_string();
            let files = f.next().unwrap_or("").lines().map(str::trim).filter(|l| !l.is_empty()).map(str::to_string).collect();
            Some(ForkCommit { sha, title, body, files })
        })
        .collect()
}

/// Upstream issue numbers a commit message cites: `#123`, `oven-sh/bun#123`, issue or pull URLs.
pub fn issue_refs(text: &str) -> Vec<u64> {
    let mut out = BTreeSet::new();
    let bytes = text.as_bytes();
    for (i, _) in text.match_indices('#') {
        let prev_ok = i == 0 || !bytes[i - 1].is_ascii_alphanumeric() || text[..i].ends_with("oven-sh/bun");
        let digits: String = text[i + 1..].chars().take_while(char::is_ascii_digit).collect();
        if prev_ok && !digits.is_empty() {
            if let Ok(n) = digits.parse() {
                out.insert(n);
            }
        }
    }
    for pat in ["github.com/oven-sh/bun/issues/", "github.com/oven-sh/bun/pull/"] {
        for (i, _) in text.match_indices(pat) {
            let digits: String = text[i + pat.len()..].chars().take_while(char::is_ascii_digit).collect();
            if let Ok(n) = digits.parse() {
                out.insert(n);
            }
        }
    }
    out.into_iter().collect()
}

struct ForkLog {
    source: &'static str,
    commits: Vec<ForkCommit>,
    base: String,
    base_date: String,
    notes: Vec<String>,
}

fn fork_local(dir: &Path) -> Option<ForkLog> {
    let log = git(dir, &["log", "--format=%x1e%H%x1f%s%x1f%b%x1f", "--name-only", "upstream/main..origin/main"])?;
    let base = git(dir, &["merge-base", "upstream/main", "origin/main"])?.trim().to_string();
    let base_date = git(dir, &["log", "-1", "--format=%cI", &base])?.trim().to_string();
    Some(ForkLog { source: "checkout", commits: parse_fork_log(&log), base, base_date, notes: vec![] })
}

fn fork_api(cx: &mut Cx) -> Result<ForkLog, String> {
    let owner = FORK.split('/').next().unwrap_or("aphrody-labs");
    let cmp = cx.gh.get(&format!("repos/{UPSTREAM}/compare/main...{owner}:bun:main"), None)?.body.unwrap_or_default();
    let mut commits = vec![];
    for c in arr(&cmp["commits"]) {
        let sha = str_of(c, "sha");
        let full = cx.gh.get(&format!("repos/{FORK}/commits/{sha}"), None)?.body.unwrap_or_default();
        let msg = full.pointer("/commit/message").and_then(Value::as_str).unwrap_or("");
        let (title, body) = msg.split_once('\n').unwrap_or((msg, ""));
        commits.push(ForkCommit {
            sha: sha.to_string(),
            title: title.trim().to_string(),
            body: body.trim().to_string(),
            files: arr(&full["files"]).iter().map(|f| str_of(f, "filename").to_string()).collect(),
        });
    }
    let base = cmp.pointer("/merge_base_commit/sha").and_then(Value::as_str).unwrap_or("").to_string();
    let base_date = cmp.pointer("/merge_base_commit/commit/committer/date").and_then(Value::as_str).unwrap_or("").to_string();
    Ok(ForkLog { source: "github", commits, base, base_date, notes: vec![] })
}

fn fork(cx: &mut Cx, checkout: &Path, open_prs: &[Value]) -> Result<Value, String> {
    let mut log = match fork_local(checkout) {
        Some(l) => l,
        None => {
            let mut l = fork_api(cx)?;
            l.notes.push(format!("{}: no usable checkout (remotes origin/upstream), compared through the GitHub API", checkout.display()));
            l
        }
    };
    if log.source == "checkout" {
        // The checkout is read only here; say when its remote-tracking refs lag behind GitHub.
        for (remote, repo) in [("upstream", UPSTREAM), ("origin", FORK)] {
            let local = git(checkout, &["rev-parse", &format!("{remote}/main")]).unwrap_or_default().trim().to_string();
            if let Ok(Got { body: Some(b), .. }) = cx.gh.get(&format!("repos/{repo}/branches/main"), None) {
                let live = b.pointer("/commit/sha").and_then(Value::as_str).unwrap_or("");
                if !live.is_empty() && live != local {
                    log.notes.push(format!("{remote}/main in the checkout is {} but {repo} main is {} (git fetch {remote})", &local[..local.len().min(10)], &live[..live.len().min(10)]));
                }
            }
        }
    }
    let files: BTreeSet<String> = log.commits.iter().flat_map(|c| c.files.iter().cloned()).collect();
    // Upstream commits after the merge base touching the fork's files.
    let mut upstream_by_file: BTreeMap<String, Vec<Value>> = BTreeMap::new();
    for f in files.iter().take(MAX_FILES) {
        let url = format!("repos/{UPSTREAM}/commits?sha=main&path={}&since={}&per_page=20", encode(f), log.base_date);
        let list = cx.gh.get(&url, None)?.body.unwrap_or_default();
        let hits: Vec<Value> = arr(&list).iter().filter(|c| str_of(c, "sha") != log.base).map(commit_entry).collect();
        if !hits.is_empty() {
            upstream_by_file.insert(f.clone(), hits);
        }
    }
    // Open pull requests updated since the last run touching the same files.
    let mut prs_by_file: BTreeMap<String, Vec<Value>> = BTreeMap::new();
    for p in open_prs.iter().take(MAX_PR_FILES) {
        let n = p["number"].as_u64().unwrap_or(0);
        let list = cx.gh.get(&format!("repos/{UPSTREAM}/pulls/{n}/files?per_page=100"), None)?.body.unwrap_or_default();
        for f in arr(&list).iter().map(|f| str_of(f, "filename")) {
            if files.contains(f) {
                prs_by_file.entry(f.to_string()).or_default().push(json!({"number": n, "title": p["title"]}));
            }
        }
    }
    // Upstream pull requests that cite the issues the fork fixes.
    let mut issues = vec![];
    let refs: BTreeSet<u64> = log.commits.iter().flat_map(|c| issue_refs(&format!("{}\n{}", c.title, c.body))).collect();
    for n in refs.into_iter().take(MAX_ISSUE_REFS) {
        let issue = cx.gh.get(&format!("repos/{UPSTREAM}/issues/{n}"), None)?.body.unwrap_or_default();
        let timeline = cx.gh.get(&format!("repos/{UPSTREAM}/issues/{n}/timeline?per_page=100"), None)?.body.unwrap_or_default();
        let prs: Vec<Value> = arr(&timeline)
            .iter()
            .filter(|e| str_of(e, "event") == "cross-referenced")
            .filter_map(|e| e.pointer("/source/issue"))
            .filter(|i| i.get("pull_request").is_some() && i.pointer("/repository/full_name").and_then(Value::as_str) == Some(UPSTREAM))
            .map(|i| json!({"number": i["number"], "title": str_of(i, "title"), "state": str_of(i, "state"), "merged_at": i.pointer("/pull_request/merged_at")}))
            .collect();
        issues.push(json!({"number": n, "title": str_of(&issue, "title"), "state": str_of(&issue, "state"), "is_pr": issue.get("pull_request").is_some(), "prs": prs}));
    }
    let commits: Vec<Value> = log
        .commits
        .iter()
        .map(|c| {
            let upstream: Vec<Value> = c.files.iter().filter_map(|f| upstream_by_file.get(f).map(|h| json!({"file": f, "commits": h}))).collect();
            let prs: Vec<Value> = c.files.iter().filter_map(|f| prs_by_file.get(f).map(|h| json!({"file": f, "prs": h}))).collect();
            json!({"sha": c.sha, "title": c.title, "files": c.files, "issues": issue_refs(&format!("{}\n{}", c.title, c.body)), "upstream_commits": upstream, "open_prs": prs})
        })
        .collect();
    Ok(json!({
        "source": log.source,
        "checkout": checkout.display().to_string(),
        "merge_base": log.base,
        "merge_base_date": log.base_date,
        "ahead": log.commits.len(),
        "commits": commits,
        "issues": issues,
        "notes": log.notes,
        "truncated_files": files.len() > MAX_FILES,
    }))
}

// ----------------------------------------------------------------------------------------------
// Run

pub fn load_state(path: &Path) -> Value {
    std::fs::read(path).ok().and_then(|b| serde_json::from_slice(&b).ok()).filter(Value::is_object).unwrap_or_else(|| json!({}))
}

fn save(path: &Path, v: &Value) -> Result<(), String> {
    if let Some(dir) = path.parent() {
        std::fs::create_dir_all(dir).map_err(|e| format!("{}: {e}", dir.display()))?;
    }
    let tmp = path.with_extension("json.tmp");
    let text = serde_json::to_string_pretty(v).map_err(|e| e.to_string())?;
    std::fs::write(&tmp, text).map_err(|e| format!("{}: {e}", tmp.display()))?;
    std::fs::rename(&tmp, path).map_err(|e| format!("{}: {e}", path.display()))
}

pub fn checkout_dir(given: &Option<PathBuf>) -> PathBuf {
    given.clone().unwrap_or_else(|| crate::repo_root().join("third_party").join("bun"))
}

/// Poll every source. `state` is the previous state; returns (report, next state).
pub fn poll(prev: Value, checkout: &Path) -> (Value, Value) {
    let now = iso_now();
    let week_ago = {
        let secs = std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).map(|d| d.as_secs()).unwrap_or(0);
        iso_from_unix(secs.saturating_sub(7 * 86_400))
    };
    let previous_run = prev.get("last_run").and_then(Value::as_str).map(str::to_string);
    let mut cx = Cx { gh: Gh::new(), since: previous_run.clone().unwrap_or(week_ago), prev, next: Map::new(), errors: vec![] };
    let main = main_commits(&mut cx).unwrap_or_else(|e| cx.fail("main", e, &["main_sha"]));
    let pulls = pulls(&mut cx).unwrap_or_else(|e| cx.fail("pulls", e, &[]));
    let issues = windows_issues(&mut cx).unwrap_or_else(|e| cx.fail("issues", e, &[]));
    let docs = docs(&mut cx);
    let releases = releases(&mut cx);
    let blog = blog(&mut cx).unwrap_or_else(|e| cx.fail("blog", e, &["blog"]));
    let npm = npm(&mut cx).unwrap_or_else(|e| cx.fail("npm", e, &["npm"]));
    let crates = crates(&mut cx).unwrap_or_else(|e| cx.fail("crates", e, &["crates"]));
    let open: Vec<Value> = arr(&pulls["updated_open"]).to_vec();
    let fork = fork(&mut cx, checkout, &open).unwrap_or_else(|e| cx.fail("fork", e, &[]));
    // A source that failed keeps the previous lower bound, so its changes are not skipped.
    let since_ok = cx.errors.iter().all(|e| !matches!(str_of(e, "source"), "pulls" | "issues"));
    cx.next.insert("schema".into(), json!(SCHEMA));
    let last_run = if since_ok { now.clone() } else { cx.since.clone() };
    cx.next.insert("last_run".into(), json!(last_run));
    let report = json!({
        "schema": SCHEMA,
        "now": now,
        "previous_run": previous_run,
        "authenticated": cx.gh.authenticated(),
        "github_requests": cx.gh.calls,
        "main": main,
        "pulls": pulls,
        "windows_issues": issues,
        "docs": docs,
        "releases": releases,
        "blog": blog,
        "npm": npm,
        "crates": crates,
        "fork": fork,
        "errors": cx.errors,
    });
    (report, Value::Object(cx.next))
}

pub fn run(a: &WatchArgs) -> i32 {
    let path = state_path(&a.state);
    let prev = load_state(&path);
    let (mut report, next) = poll(prev, &checkout_dir(&a.checkout));
    if a.apply {
        let root = crate::repo_root();
        let stable = report.pointer("/releases/stable").cloned().unwrap_or(Value::Null);
        report["bumps"] = match super::parse_version(str_of(&stable, "tag")) {
            Some(_) => super::bump::proposals_json(&root, str_of(&stable, "tag").trim_start_matches("bun-v"), Some(&stable)),
            None => json!({"error": "no stable release in this poll"}),
        };
    }
    if !a.dry_run {
        if let Err(e) = save(&path, &next) {
            error(&format!("state: {e}"));
            return 1;
        }
        let _ = save(&path.with_file_name("report.json"), &report);
    }
    if a.json {
        println!("{}", serde_json::to_string_pretty(&report).unwrap_or_default());
    } else {
        print!("{}", render(&report));
        for e in arr(&report["errors"]) {
            error(&format!("{}: {}", str_of(e, "source"), str_of(e, "message")));
        }
        for n in arr(&report["fork"]["notes"]) {
            warn(n.as_str().unwrap_or(""));
        }
        for (k, r) in report["releases"].as_object().into_iter().flatten() {
            if r.pointer("/shasums/stale").and_then(Value::as_bool) == Some(true) {
                warn(&stale_line(k, r));
            }
        }
    }
    if arr(&report["errors"]).is_empty() { 0 } else { 1 }
}

// ----------------------------------------------------------------------------------------------
// Text report

fn short(sha: &str) -> &str {
    &sha[..sha.len().min(10)]
}

fn day(ts: &str) -> &str {
    &ts[..ts.len().min(10)]
}

pub fn stale_line(key: &str, r: &Value) -> String {
    let s = &r["shasums"];
    format!(
        "{key} {}: SHASUMS256.txt ({}) is older than {} assets (newest {}); {} hashes differ from the GitHub digests: verify with the per-asset digest",
        str_of(r, "tag"),
        s["updated_at"].as_str().unwrap_or("missing"),
        arr(&s["assets_newer"]).len(),
        str_of(s, "newest_asset"),
        arr(&s["mismatched"]).len()
    )
}

fn row(out: &mut String, label: &str, text: &str) {
    out.push_str(&format!("{} {text}\n", bold(&format!("{label:<9}"))));
}

pub fn render(r: &Value) -> String {
    let mut o = String::new();
    o.push_str(&format!("bun watch  {}  {}\n\n", str_of(r, "now"), dim(&format!("previous {}", r["previous_run"].as_str().unwrap_or("none (first run)")))));
    let m = &r["main"];
    if m.get("error").is_none() {
        let commits = arr(&m["commits"]);
        let head = short(str_of(m, "head"));
        let label = if m["first_run"].as_bool() == Some(true) {
            format!("{head}, last {} commits (first run)", commits.len())
        } else if commits.is_empty() {
            format!("{head}, no new commit")
        } else {
            format!("{} new commits {}..{head}", m["total"], short(m["previous"].as_str().unwrap_or("")))
        };
        row(&mut o, "main", &label);
        for c in commits.iter().take(30) {
            o.push_str(&format!("  {} {} {}\n", short(str_of(c, "sha")), dim(&format!("{} {:<14}", day(str_of(c, "date")), str_of(c, "author"))), str_of(c, "title")));
        }
        if commits.len() > 30 {
            o.push_str(&format!("  {}\n", dim(&format!("... {} more (--json)", commits.len() - 30))));
        }
    }
    let p = &r["pulls"];
    if p.get("error").is_none() {
        row(&mut o, "pulls", &format!("{} merged, {} opened, {} open updated", arr(&p["merged"]).len(), arr(&p["opened"]).len(), arr(&p["updated_open"]).len()));
        for (tag, list) in [("merged", &p["merged"]), ("opened", &p["opened"])] {
            for x in arr(list).iter().take(15) {
                o.push_str(&format!("  #{:<6} {} {}\n", x["number"], dim(&format!("{tag:<6}")), str_of(x, "title")));
            }
        }
    }
    let i = &r["windows_issues"];
    if i.get("error").is_none() {
        let list = arr(&i["issues"]);
        let count = |k: &str| list.iter().filter(|x| str_of(x, "kind") == k).count();
        row(&mut o, "issues", &format!("label windows: {} new, {} closed, {} updated", count("new"), count("closed"), count("updated")));
        for x in list.iter().filter(|x| str_of(x, "kind") != "updated").take(20) {
            o.push_str(&format!("  #{:<6} {} {}\n", x["number"], dim(&format!("{:<6}", str_of(x, "kind"))), str_of(x, "title")));
        }
    }
    let docs = arr(&r["docs"]);
    let changed: Vec<&Value> = docs.iter().filter(|d| d["changed"].as_bool() == Some(true)).collect();
    row(&mut o, "docs", &if changed.is_empty() { format!("{} files unchanged", docs.len()) } else { format!("{} changed", changed.len()) });
    for d in changed {
        o.push_str(&format!("  {} {} -> {}\n", str_of(d, "path"), short(d["previous"].as_str().unwrap_or("")), short(str_of(d, "sha"))));
    }
    for (k, rel) in r["releases"].as_object().into_iter().flatten() {
        if let Some(e) = rel.get("error") {
            row(&mut o, k, &format!("error {e}"));
            continue;
        }
        let assets = rel["assets"].as_object().map(Map::len).unwrap_or(0);
        let newest = str_of(&rel["shasums"], "newest_asset").to_string();
        let mut text = format!("{} {} assets, published {}, newest asset {}", str_of(rel, "tag"), assets, day(str_of(rel, "published_at")), newest);
        if rel["previous_tag"].as_str().is_some_and(|t| t != str_of(rel, "tag")) {
            text.push_str(&format!(" (was {})", str_of(rel, "previous_tag")));
        }
        row(&mut o, k, &text);
        for c in arr(&rel["changed"]).iter().take(40) {
            o.push_str(&format!("  {} {}\n", str_of(c, "asset"), dim(&format!("republished {} {}", str_of(c, "updated_at"), str_of(c, "digest")))));
        }
    }
    let b = &r["blog"];
    if b.get("error").is_none() {
        let new = arr(&b["new"]);
        let latest = b.get("latest").filter(|l| !l.is_null()).map(|l| format!(", latest {}", str_of(l, "title"))).unwrap_or_default();
        row(&mut o, "blog", &format!("{} new post(s){latest}", new.len()));
        for x in new {
            o.push_str(&format!("  {} {}\n", str_of(x, "title"), dim(str_of(x, "link"))));
        }
    }
    let n = &r["npm"];
    if n.get("error").is_none() {
        let tags = n["dist_tags"].as_object().map(|t| t.iter().map(|(k, v)| format!("{k} {}", v.as_str().unwrap_or(""))).collect::<Vec<_>>().join(", ")).unwrap_or_default();
        row(&mut o, "npm", &format!("bun {tags}; {} packages ({}), {} changed", n["packages"], str_of(n, "query"), arr(&n["changed"]).len()));
        for c in arr(&n["changed"]).iter().take(20) {
            o.push_str(&format!("  {} {} -> {}\n", str_of(c, "name"), c["previous"].as_str().unwrap_or("new"), c["version"].as_str().unwrap_or("")));
        }
    }
    let c = &r["crates"];
    if c.get("error").is_none() {
        row(&mut o, "crates", &format!("{} bun crates on crates.io, {} new or bumped", c["crates"], arr(&c["changed"]).len()));
        for x in arr(&c["changed"]).iter().take(20) {
            o.push_str(&format!("  {} {} -> {}\n", str_of(x, "name"), x["previous"].as_str().unwrap_or("new"), x["version"].as_str().unwrap_or("")));
        }
    }
    let f = &r["fork"];
    if f.get("error").is_none() {
        row(&mut o, "fork", &format!("{FORK} main: {} commits ahead of {UPSTREAM} main (base {}, {})", f["ahead"], short(str_of(f, "merge_base")), str_of(f, "source")));
        for c in arr(&f["commits"]) {
            o.push_str(&format!("  {} {} {}\n", short(str_of(c, "sha")), str_of(c, "title"), dim(&format!("({} files)", arr(&c["files"]).len()))));
            for u in arr(&c["upstream_commits"]) {
                for uc in arr(&u["commits"]) {
                    o.push_str(&format!("    upstream {} {} {}\n", short(str_of(uc, "sha")), str_of(u, "file"), dim(str_of(uc, "title"))));
                }
            }
            for u in arr(&c["open_prs"]) {
                for pr in arr(&u["prs"]) {
                    o.push_str(&format!("    open PR #{} {} {}\n", pr["number"], str_of(u, "file"), dim(str_of(pr, "title"))));
                }
            }
        }
        for is in arr(&f["issues"]) {
            let prs: Vec<String> = arr(&is["prs"])
                .iter()
                .map(|p| format!("#{} {}", p["number"], if p["merged_at"].is_string() { "merged" } else { str_of(p, "state") }))
                .collect();
            let prs = if prs.is_empty() { "no upstream PR".to_string() } else { format!("upstream PRs {}", prs.join(", ")) };
            o.push_str(&format!("  issue #{} {}: {prs} {}\n", is["number"], str_of(is, "state"), dim(str_of(is, "title"))));
        }
    }
    if let Some(b) = r.get("bumps") {
        o.push_str(&super::bump::render(b));
    }
    o.push_str(&format!("\n{}\n", dim(&format!("{} GitHub requests{}", r["github_requests"], if r["authenticated"].as_bool() == Some(true) { "" } else { ", unauthenticated" }))));
    o
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn pr_numbers_from_squash_titles() {
        assert_eq!(pr_suffix("fix(windows): spawn (#48701)"), Some(48701));
        assert_eq!(pr_suffix("no number"), None);
        assert_eq!(pr_suffix("x (#abc)"), None);
    }

    #[test]
    fn issue_references() {
        assert_eq!(issue_refs("Fixes #39747, see oven-sh/bun#39760 and https://github.com/oven-sh/bun/issues/1"), vec![1, 39747, 39760]);
        assert_eq!(issue_refs("color #fff and a#12"), Vec::<u64>::new());
    }

    #[test]
    fn fork_log_parsing() {
        let text = "\x1eabc\x1fchild_process: fd\x1fFixes #39747\n\x1f\n\nsrc/a.rs\nsrc/b.ts\n\x1edef\x1fdocs: x\x1f\x1f\n\ndocs/y.mdx\n";
        let log = parse_fork_log(text);
        assert_eq!(log.len(), 2);
        assert_eq!(log[0].files, vec!["src/a.rs", "src/b.ts"]);
        assert_eq!(log[0].body, "Fixes #39747");
        assert_eq!(log[1].title, "docs: x");
        assert_eq!(log[1].files, vec!["docs/y.mdx"]);
    }

    /// The canary release on 2026-11-13: bun-windows-x64.zip republished at 00:32:15Z while
    /// SHASUMS256.txt still dated from 2026-11-12T14:12:01Z with the old hash.
    #[test]
    fn stale_shasums_detected() {
        let rel = json!({"tag_name": "canary", "assets": [
            {"name": "bun-windows-x64.zip", "updated_at": "2026-11-13T00:32:15Z", "digest": "sha256:77792f0669a79904e1424ac632eac4e85676f8ad8c8024ae823d2eebbcabfd3f"},
            {"name": "bun-linux-x64.zip", "updated_at": "2026-11-12T14:00:00Z", "digest": "sha256:1111111111111111111111111111111111111111111111111111111111111111"},
            {"name": "SHASUMS256.txt", "updated_at": "2026-11-12T14:12:01Z", "digest": "sha256:699f"},
            {"name": "SHASUMS256.txt.asc", "updated_at": "2026-11-12T14:12:02Z", "digest": null}
        ]});
        let sums = shasums("0ef66ce49c07fd162207a0c67306fdd890859bebd0031122ac5c1a55b7fd7475  bun-windows-x64.zip\n1111111111111111111111111111111111111111111111111111111111111111  bun-linux-x64.zip\n");
        let s = release_summary(&rel, Some(&sums));
        assert_eq!(s["shasums"]["stale"], json!(true));
        assert_eq!(s["shasums"]["assets_newer"], json!(["bun-windows-x64.zip"]));
        assert_eq!(arr(&s["shasums"]["mismatched"]).len(), 1);
        assert_eq!(s["shasums"]["newest_asset"], json!("2026-11-13T00:32:15Z"));
        let fresh = shasums("77792f0669a79904e1424ac632eac4e85676f8ad8c8024ae823d2eebbcabfd3f  bun-windows-x64.zip\n1111111111111111111111111111111111111111111111111111111111111111  bun-linux-x64.zip\n");
        let rel_ok = json!({"tag_name": "bun-v1.4.4", "assets": [
            {"name": "bun-windows-x64.zip", "updated_at": "2026-10-22T10:00:00Z", "digest": "sha256:77792f0669a79904e1424ac632eac4e85676f8ad8c8024ae823d2eebbcabfd3f"},
            {"name": "bun-linux-x64.zip", "updated_at": "2026-10-22T10:00:00Z", "digest": "sha256:1111111111111111111111111111111111111111111111111111111111111111"},
            {"name": "SHASUMS256.txt", "updated_at": "2026-10-22T10:05:00Z"}
        ]});
        assert_eq!(release_summary(&rel_ok, Some(&fresh))["shasums"]["stale"], json!(false));
        // A republished asset shows up as changed against the previous poll.
        let before = release_summary(&rel_ok, Some(&fresh));
        let mut after_rel = rel_ok.clone();
        after_rel["assets"][0]["digest"] = json!("sha256:2222222222222222222222222222222222222222222222222222222222222222");
        let after = release_summary(&after_rel, Some(&fresh));
        let changed = changed_assets(&before, &after);
        assert_eq!(changed.len(), 1);
        assert_eq!(changed[0]["asset"], json!("bun-windows-x64.zip"));
    }

    #[test]
    fn rss_feed() {
        let xml = "<rss><channel><title>bun.com</title><item>\n<title>Bun v1.4.4</title>\n<link>https://bun.com/blog/bun-v1.4.4</link><pubDate>Thu, 22 Oct 2026 10:00:00 GMT</pubDate></item><item><title><![CDATA[A &amp; B]]></title><link>https://bun.com/blog/x</link></item></channel></rss>";
        let items = rss_items(xml);
        assert_eq!(items.len(), 2);
        assert_eq!(items[0]["link"], json!("https://bun.com/blog/bun-v1.4.4"));
        assert_eq!(items[1]["title"], json!("A & B"));
    }

    #[test]
    fn crate_names() {
        assert!(bun_named("bun-cli") && bun_named("chaste-bun") && bun_named("bun") && bun_named("aphrody_bun_macro"));
        assert!(!bun_named("bundle-standard-core") && !bun_named("bungeeoxide"));
    }

    #[test]
    fn query_encoding() {
        assert_eq!(encode("src/a b+c.rs"), "src/a%20b%2Bc.rs");
    }

    #[test]
    fn report_renders_without_network() {
        let r = json!({"now": "2026-11-13T02:00:00Z", "previous_run": null, "main": {"head": "9ea3c693a2", "commits": [], "first_run": true},
            "pulls": {"merged": [], "opened": [], "updated_open": []}, "windows_issues": {"issues": [{"number": 1, "kind": "new", "title": "t"}]},
            "docs": [{"path": "CONTRIBUTING.md", "changed": true, "previous": "aaa", "sha": "bbb"}], "releases": {}, "blog": {"new": []},
            "npm": {"error": "x"}, "crates": {"crates": 3, "changed": []}, "fork": {"ahead": 0, "commits": [], "issues": []}, "github_requests": 3, "authenticated": false});
        let text = render(&r);
        assert!(text.contains("first run") && text.contains("CONTRIBUTING.md aaa -> bbb") && text.contains("unauthenticated"));
    }
}
