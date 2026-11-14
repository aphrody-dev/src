//! Live versions of kernel patchsets, distro kernels, and GPU stacks (`infra/linux/patchsets.toml`).

use anyhow::{Context, Result, bail};
use regex::Regex;
use serde::{Deserialize, Serialize};
use std::cmp::Ordering;
use std::collections::BTreeMap;
use std::fs;
use std::path::Path;
use std::process::Command;
use std::time::Duration;

pub const PATCHSETS_REL_PATH: &str = "infra/linux/patchsets.toml";

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct Patchset {
    #[serde(default)]
    pub name: String,
    pub group: String,
    pub method: String,
    #[serde(default)]
    pub pinned: String,
    pub repo: Option<String>,
    pub path: Option<String>,
    pub vars: Option<Vec<String>>,
    pub pattern: Option<String>,
    pub project: Option<String>,
    pub url: Option<String>,
    pub channel: Option<String>,
    pub fork: Option<String>,
    pub excluded: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
pub struct LivePatchset {
    #[serde(flatten)]
    pub spec: Patchset,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub latest: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub archived: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<String>,
    pub state: &'static str,
}

#[derive(Debug, Deserialize)]
struct PatchsetsDoc {
    patchset: Option<BTreeMap<String, Patchset>>,
}

/// Load every `[patchset.<name>]` entry from `infra/linux/patchsets.toml`.
pub fn load_patchsets(root: &Path) -> Result<Vec<Patchset>> {
    let path = root.join(PATCHSETS_REL_PATH);
    let raw = fs::read_to_string(&path)
        .with_context(|| format!("failed to read {}", path.display()))?;
    let doc: PatchsetsDoc = toml::from_str(&raw)
        .with_context(|| format!("failed to parse {}", path.display()))?;
    Ok(doc
        .patchset
        .unwrap_or_default()
        .into_iter()
        .map(|(name, mut p)| {
            p.name = name;
            p
        })
        .collect())
}

fn split_numeric_parts(s: &str) -> Vec<i64> {
    s.split(|c: char| !c.is_ascii_digit())
        .filter(|part| !part.is_empty())
        .filter_map(|part| part.parse::<i64>().ok())
        .collect()
}

/// Numeric-aware version comparison (`7.10` > `7.9`, `18-7.3` > `17-6.18`, `20261104` > `20251001`).
pub fn cmp_version(a: &str, b: &str) -> Ordering {
    let pa = split_numeric_parts(a);
    let pb = split_numeric_parts(b);
    let max_len = pa.len().max(pb.len());
    for i in 0..max_len {
        let va = pa.get(i).copied().unwrap_or(-1);
        let vb = pb.get(i).copied().unwrap_or(-1);
        match va.cmp(&vb) {
            Ordering::Equal => continue,
            non_eq => return non_eq,
        }
    }
    a.cmp(b)
}

/// Return the highest capture group (or full match) matched by `pattern` across `names`.
pub fn highest(names: &[String], pattern: &str) -> Result<Option<String>> {
    let re = Regex::new(pattern).with_context(|| format!("invalid pattern '{pattern}'"))?;
    let mut hits: Vec<String> = names
        .iter()
        .filter_map(|n| {
            let caps = re.captures(n)?;
            let m = caps.get(1).or_else(|| caps.get(0))?;
            Some(m.as_str().to_string())
        })
        .collect();
    hits.sort_by(|a, b| cmp_version(a, b));
    Ok(hits.pop())
}

/// Extract `_major=7.3` and `_minor=4` style variables from a PKGBUILD -> `"7.3.4"`.
pub fn pkgbuild_version(text: &str, vars: &[String]) -> Option<String> {
    let mut parts = Vec::with_capacity(vars.len());
    for var in vars {
        let pat = format!(r#"(?m)^{}=["']?([^"'\s#]+)"#, regex::escape(var));
        let re = Regex::new(&pat).ok()?;
        let cap = re.captures(text)?.get(1)?.as_str().to_string();
        parts.push(cap);
    }
    Some(parts.join("."))
}

fn agent() -> ureq::Agent {
    ureq::Agent::config_builder()
        .timeout_global(Some(Duration::from_secs(15)))
        .http_status_as_error(false)
        .build()
        .into()
}

fn resolve_gh_token() -> Option<String> {
    if let Ok(t) = std::env::var("GH_TOKEN")
        && !t.trim().is_empty()
    {
        return Some(t.trim().to_string());
    }
    if let Ok(t) = std::env::var("GITHUB_TOKEN")
        && !t.trim().is_empty()
    {
        return Some(t.trim().to_string());
    }
    let out = Command::new("gh").args(["auth", "token"]).output().ok()?;
    if out.status.success() {
        let s = String::from_utf8_lossy(&out.stdout).trim().to_string();
        if !s.is_empty() {
            return Some(s);
        }
    }
    None
}

fn http_text(url: &str, accept: Option<&str>, bearer: Option<&str>) -> Result<String> {
    let mut req = agent().get(url).header("user-agent", "aphrody-ay-linux");
    if let Some(a) = accept {
        req = req.header("accept", a);
    }
    if let Some(b) = bearer {
        req = req.header("authorization", &format!("Bearer {b}"));
    }
    let mut resp = req.call().with_context(|| format!("GET {url}"))?;
    let status = resp.status().as_u16();
    let body = resp
        .body_mut()
        .with_config()
        .limit(64 << 20)
        .read_to_string()
        .unwrap_or_default();
    if status >= 400 {
        bail!("{url}: HTTP {status}");
    }
    Ok(body)
}

fn gh_json<T: for<'de> Deserialize<'de>>(path: &str, token: Option<&str>) -> Result<T> {
    let url = format!("https://api.github.com/{path}");
    let body = http_text(&url, Some("application/vnd.github+json"), token)?;
    serde_json::from_str(&body).with_context(|| format!("GitHub JSON parse failed for {path}"))
}

fn ls_remote_heads(url: &str) -> Result<Vec<String>> {
    let out = Command::new("git")
        .args(["ls-remote", "--heads", url])
        .output()
        .with_context(|| format!("git ls-remote {url}"))?;
    if !out.status.success() {
        bail!(
            "git ls-remote {}: {}",
            url,
            String::from_utf8_lossy(&out.stderr).trim()
        );
    }
    Ok(String::from_utf8_lossy(&out.stdout)
        .lines()
        .filter_map(|line| line.split_once("\trefs/heads/").map(|(_, b)| b.to_string()))
        .collect())
}

fn extract_hrefs(html: &str) -> Vec<String> {
    let re = Regex::new(r#"href=["']([^"']+)["']"#).expect("valid href regex");
    re.captures_iter(html)
        .filter_map(|c| c.get(1).map(|m| m.as_str().to_string()))
        .collect()
}

fn percent_encode_project(project: &str) -> String {
    project.replace('/', "%2F")
}

/// Fetch the latest upstream version/state for a single patchset entry.
pub fn latest_of(p: &Patchset, gh_token: Option<&str>) -> Result<(Option<String>, Option<bool>)> {
    match p.method.as_str() {
        "kernel-org" => {
            #[derive(Deserialize)]
            struct Release {
                moniker: String,
                version: String,
            }
            #[derive(Deserialize)]
            struct ReleasesDoc {
                releases: Vec<Release>,
            }
            let body = http_text("https://www.kernel.org/releases.json", None, None)?;
            let doc: ReleasesDoc = serde_json::from_str(&body)?;
            let channel = p.channel.as_deref().unwrap_or("");
            let mut versions: Vec<String> = doc
                .releases
                .into_iter()
                .filter(|r| r.moniker == channel)
                .map(|r| r.version)
                .collect();
            versions.sort_by(|a, b| cmp_version(a, b));
            Ok((versions.pop(), None))
        }
        "github-pkgbuild" => {
            let repo = p.repo.as_deref().context("missing repo")?;
            let path = p.path.as_deref().context("missing path")?;
            let url = format!("https://api.github.com/repos/{repo}/contents/{path}");
            let raw = http_text(&url, Some("application/vnd.github.raw"), gh_token)?;
            let vars = p.vars.as_deref().unwrap_or(&[]);
            Ok((pkgbuild_version(&raw, vars), None))
        }
        method @ ("github-dirs" | "github-files") => {
            #[derive(Deserialize)]
            struct Entry {
                name: String,
                #[serde(rename = "type")]
                kind: String,
            }
            let repo = p.repo.as_deref().context("missing repo")?;
            let subpath = p.path.as_deref().unwrap_or("");
            let api_path = format!("repos/{repo}/contents/{subpath}");
            let list: Vec<Entry> = gh_json(&api_path, gh_token)?;
            let want_type = if method == "github-dirs" { "dir" } else { "file" };
            let names: Vec<String> = list
                .into_iter()
                .filter(|e| e.kind == want_type)
                .map(|e| e.name)
                .collect();
            let pattern = p.pattern.as_deref().context("missing pattern")?;
            Ok((highest(&names, pattern)?, None))
        }
        "github-branches" => {
            #[derive(Deserialize)]
            struct Branch {
                name: String,
            }
            let repo = p.repo.as_deref().context("missing repo")?;
            let mut names = Vec::new();
            for page in 1..=10 {
                let batch: Vec<Branch> =
                    gh_json(&format!("repos/{repo}/branches?per_page=100&page={page}"), gh_token)?;
                let len = batch.len();
                names.extend(batch.into_iter().map(|b| b.name));
                if len < 100 {
                    break;
                }
            }
            let pattern = p.pattern.as_deref().context("missing pattern")?;
            Ok((highest(&names, pattern)?, None))
        }
        "github-release" => {
            #[derive(Deserialize)]
            struct Meta {
                archived: bool,
            }
            #[derive(Deserialize)]
            struct Rel {
                tag_name: String,
            }
            #[derive(Deserialize)]
            struct Tag {
                name: String,
            }
            let repo = p.repo.as_deref().context("missing repo")?;
            let meta: Meta = gh_json(&format!("repos/{repo}"), gh_token)?;
            if let Ok(rel) = gh_json::<Rel>(&format!("repos/{repo}/releases/latest"), gh_token) {
                Ok((Some(rel.tag_name), Some(meta.archived)))
            } else {
                let tags: Vec<Tag> = gh_json(&format!("repos/{repo}/tags?per_page=1"), gh_token)?;
                Ok((tags.into_iter().next().map(|t| t.name), Some(meta.archived)))
            }
        }
        "gitlab-tags" => {
            #[derive(Deserialize)]
            struct Tag {
                name: String,
            }
            let project = p.project.as_deref().context("missing project")?;
            let url = format!(
                "https://gitlab.com/api/v4/projects/{}/repository/tags?per_page=100",
                percent_encode_project(project)
            );
            let body = http_text(&url, None, None)?;
            let tags: Vec<Tag> = serde_json::from_str(&body)?;
            let names: Vec<String> = tags.into_iter().map(|t| t.name).collect();
            let pattern = p.pattern.as_deref().context("missing pattern")?;
            Ok((highest(&names, pattern)?, None))
        }
        "git-heads" => {
            let url = p.url.as_deref().context("missing url")?;
            let heads = ls_remote_heads(url)?;
            let pattern = p.pattern.as_deref().context("missing pattern")?;
            Ok((highest(&heads, pattern)?, None))
        }
        "cuda-redist" => {
            let url = p.url.as_deref().context("missing url")?;
            let hrefs = extract_hrefs(&http_text(url, None, None)?);
            Ok((highest(&hrefs, r"^redistrib_([0-9.]+)\.json$")?, None))
        }
        "html-dirs" => {
            let url = p.url.as_deref().context("missing url")?;
            let pattern = p.pattern.as_deref().context("missing pattern")?;
            let hrefs = extract_hrefs(&http_text(url, None, None)?);
            Ok((highest(&hrefs, pattern)?, None))
        }
        other => bail!("unknown patchset method '{other}'"),
    }
}

/// Evaluate live status across a slice of patchsets.
pub fn live_status(list: &[Patchset]) -> Vec<LivePatchset> {
    let token = resolve_gh_token();
    list.iter()
        .map(|p| match latest_of(p, token.as_deref()) {
            Ok((latest, archived)) => {
                if p.excluded.is_some() || archived == Some(true) {
                    LivePatchset {
                        spec: p.clone(),
                        latest,
                        archived,
                        error: None,
                        state: "excluded",
                    }
                } else {
                    let state = match &latest {
                        Some(l) if l != &p.pinned => "behind",
                        _ => "ok",
                    };
                    LivePatchset {
                        spec: p.clone(),
                        latest,
                        archived,
                        error: None,
                        state,
                    }
                }
            }
            Err(e) => LivePatchset {
                spec: p.clone(),
                latest: None,
                archived: None,
                error: Some(e.to_string()),
                state: if p.excluded.is_some() {
                    "excluded"
                } else {
                    "error"
                },
            },
        })
        .collect()
}

/// Rewrite `pinned = "..."` in place inside `infra/linux/patchsets.toml` preserving comments and ordering.
pub fn write_pins(root: &Path, moved: &[(String, String)]) -> Result<usize> {
    let file = root.join(PATCHSETS_REL_PATH);
    let content = fs::read_to_string(&file)?;
    let trailing_nl = content.ends_with('\n');
    let mut lines: Vec<String> = content.lines().map(ToString::to_string).collect();
    let mut updated = 0usize;

    for (name, latest) in moved {
        let target_header = format!("[patchset.{name}]");
        let mut in_section = false;
        for line in &mut lines {
            let trimmed = line.trim();
            if trimmed.starts_with('[') && trimmed.ends_with(']') {
                in_section = trimmed == target_header;
                continue;
            }
            if in_section && trimmed.starts_with("pinned = ") {
                *line = format!("pinned = \"{latest}\"");
                updated += 1;
                break;
            }
        }
    }

    let mut joined = lines.join("\n");
    if trailing_nl {
        joined.push('\n');
    }
    fs::write(&file, joined)?;
    Ok(updated)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn versions_compare_and_pkgbuild_vars() {
        assert_eq!(cmp_version("7.10", "7.9"), Ordering::Greater);
        assert_eq!(cmp_version("18-7.3", "17-6.18"), Ordering::Greater);
        assert_eq!(
            highest(
                &[
                    "7.3/main".into(),
                    "7.10/main".into(),
                    "6.18/main".into(),
                    "x".into()
                ],
                r"^(\d+\.\d+)/main$"
            )
            .unwrap()
            .as_deref(),
            Some("7.10")
        );
        assert_eq!(
            highest(
                &[
                    "redistrib_13.4.3.json".into(),
                    "redistrib_13.5.0.json".into()
                ],
                r"^redistrib_([0-9.]+)\.json$"
            )
            .unwrap()
            .as_deref(),
            Some("13.5.0")
        );
        assert_eq!(
            pkgbuild_version(
                "_major=7.3\n_minor=4\n#_minorc=5\n",
                &["_major".into(), "_minor".into()]
            )
            .as_deref(),
            Some("7.3.4")
        );
        assert_eq!(
            pkgbuild_version("_major=7.3\n", &["_major".into(), "_minor".into()]),
            None
        );
    }

    #[test]
    fn registry_loads_and_pins_are_rewritten_in_place() {
        let root = Path::new(env!("CARGO_MANIFEST_DIR")).join("../..");
        let list = load_patchsets(&root).expect("load patchsets.toml");
        assert_eq!(
            list.iter()
                .find(|p| p.name == "cachyos")
                .and_then(|p| p.repo.as_deref()),
            Some("CachyOS/linux-cachyos")
        );
        assert!(
            list.iter()
                .find(|p| p.name == "clear")
                .and_then(|p| p.excluded.as_deref())
                .is_some()
        );

        let dir = std::env::temp_dir().join("aphrody_omarchy_patchsets_test");
        let _ = fs::remove_dir_all(&dir);
        fs::create_dir_all(dir.join("infra").join("linux")).unwrap();
        fs::copy(
            root.join(PATCHSETS_REL_PATH),
            dir.join(PATCHSETS_REL_PATH),
        )
        .unwrap();

        let count = write_pins(
            &dir,
            &[
                ("cachyos".into(), "7.4.1".into()),
                ("cachyos-patches".into(), "7.5".into()),
            ],
        )
        .unwrap();
        assert_eq!(count, 2);
        let after = load_patchsets(&dir).unwrap();
        assert_eq!(
            after.iter().find(|p| p.name == "cachyos").unwrap().pinned,
            "7.4.1"
        );
        assert_eq!(
            after
                .iter()
                .find(|p| p.name == "cachyos-patches")
                .unwrap()
                .pinned,
            "7.5"
        );
        assert_eq!(
            after.iter().find(|p| p.name == "zen").unwrap().pinned,
            list.iter().find(|p| p.name == "zen").unwrap().pinned
        );
        let _ = fs::remove_dir_all(&dir);
    }
}
