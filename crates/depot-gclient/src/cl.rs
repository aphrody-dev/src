//! `ay cl`: the `git cl` commands Chromium contributors use, on jj and Gerrit REST.
//!
//! - `upload` maps `git cl upload` flags onto `jj gerrit upload` (jj 0.46), which pushes to
//!   `refs/for/<branch>` with a `Change-Id` trailer and sets reviewers, CC, labels, topic,
//!   hashtags and WIP through push options, as `git cl` does.
//! - `status` and `issue` read the `Change-Id` trailers of local commits and query Gerrit
//!   (`/changes/?q=change:<id>`), authenticated with `.gitcookies` when present.
//!
//! A git checkout without `.jj` is colocated first (`jj git init --colocate`), which keeps
//! the git repository usable by git, gclient and gix.

use std::path::{Path, PathBuf};
use std::process::Command;

use clap::{Parser, Subcommand};

#[derive(Parser, Debug)]
#[command(
    name = "ay cl",
    about = "git cl on jj and Gerrit REST: upload, status, issue"
)]
struct Cli {
    #[command(subcommand)]
    cmd: Cmd,
}

#[derive(Subcommand, Debug)]
enum Cmd {
    /// Upload commits for review (`git cl upload`)
    Upload {
        /// Reviewers, comma separated or repeated
        #[arg(short = 'r', long = "reviewers", value_delimiter = ',')]
        reviewers: Vec<String>,
        /// CC, comma separated or repeated
        #[arg(long = "cc", value_delimiter = ',')]
        cc: Vec<String>,
        /// Patchset title (`-t`)
        #[arg(short = 't', long = "title")]
        title: Option<String>,
        /// Commit-Queue+1 (`--cq-dry-run`, `-d`)
        #[arg(short = 'd', long = "cq-dry-run")]
        cq_dry_run: bool,
        /// Commit-Queue+2 (`--use-commit-queue`, `-c`)
        #[arg(short = 'c', long = "use-commit-queue")]
        use_commit_queue: bool,
        /// Upload as work in progress
        #[arg(long)]
        wip: bool,
        #[arg(long)]
        topic: Option<String>,
        #[arg(long = "hashtag")]
        hashtags: Vec<String>,
        /// Target branch (`-b`, `--target_branch`), default main
        #[arg(short = 'b', long = "target-branch", alias = "target_branch")]
        target_branch: Option<String>,
        /// jj revset to upload (default: jj's default for `gerrit upload`)
        #[arg(long = "revision")]
        revision: Option<String>,
        /// Show what would be pushed
        #[arg(long)]
        dry_run: bool,
        /// Accepted for `git cl` compatibility (no prompts here)
        #[arg(short = 'f', long = "force", hide = true)]
        _force: bool,
        #[arg(short = 'y', hide = true)]
        _yes: bool,
    },
    /// Review state of local changes (`git cl status`)
    Status {
        /// jj revset of local commits
        #[arg(long = "revision", default_value = "trunk()..@")]
        revision: String,
        /// Gerrit base URL (default: derived from the origin remote)
        #[arg(long = "gerrit-url")]
        gerrit_url: Option<String>,
    },
    /// Print the Gerrit URL of the current change (`git cl issue`)
    Issue {
        #[arg(long = "revision", default_value = "@-")]
        revision: String,
        #[arg(long = "gerrit-url")]
        gerrit_url: Option<String>,
    },
}

/// `https://chromium.googlesource.com/chromium/src.git` ->
/// (`https://chromium-review.googlesource.com`, `chromium/src`).
pub fn gerrit_for_remote(url: &str) -> Option<(String, String)> {
    let rest = url
        .strip_prefix("https://")
        .or_else(|| url.strip_prefix("sso://"))?;
    let (host, path) = rest.split_once('/')?;
    let path = path
        .trim_start_matches("a/")
        .trim_end_matches('/')
        .trim_end_matches(".git");
    let review = match host.strip_suffix(".googlesource.com") {
        Some(name) if !name.ends_with("-review") => format!("{name}-review.googlesource.com"),
        Some(_) => host.to_string(),
        None => host.to_string(),
    };
    Some((format!("https://{review}"), path.to_string()))
}

/// The `.gitcookies` cookie for `host` (Netscape format), as a `Cookie` header value.
pub fn cookie_for(text: &str, host: &str) -> Option<String> {
    text.lines()
        .filter(|l| !l.starts_with('#') || l.starts_with("#HttpOnly_"))
        .filter_map(|l| {
            let f: Vec<&str> = l.trim_start_matches("#HttpOnly_").split('\t').collect();
            (f.len() >= 7).then(|| (f[0], f[5], f[6]))
        })
        .find(|(domain, _, _)| {
            let d = domain.trim_start_matches('.');
            host == d || (domain.starts_with('.') && host.ends_with(&format!(".{d}")))
        })
        .map(|(_, name, value)| format!("{name}={value}"))
}

fn cookies_file() -> Option<PathBuf> {
    let configured = Command::new("git")
        .args(["config", "--get", "http.cookiefile"])
        .output()
        .ok()
        .filter(|o| o.status.success())
        .map(|o| String::from_utf8_lossy(&o.stdout).trim().to_string())
        .filter(|s| !s.is_empty())
        .map(PathBuf::from);
    configured.or_else(|| {
        std::env::var_os(if cfg!(windows) { "USERPROFILE" } else { "HOME" })
            .map(|h| PathBuf::from(h).join(".gitcookies"))
    })
}

fn jj(args: &[&str]) -> Result<String, String> {
    let out = Command::new("jj")
        .args(args)
        .output()
        .map_err(|e| format!("jj: {e}"))?;
    if !out.status.success() {
        return Err(String::from_utf8_lossy(&out.stderr).trim().to_string());
    }
    Ok(String::from_utf8_lossy(&out.stdout).into_owned())
}

fn ensure_jj(dir: &Path) -> Result<(), String> {
    let mut cur = Some(dir);
    while let Some(d) = cur {
        if d.join(".jj").is_dir() {
            return Ok(());
        }
        if d.join(".git").exists() {
            eprintln!("colocating jj with the git checkout in {}", d.display());
            let st = Command::new("jj")
                .args(["git", "init", "--colocate"])
                .current_dir(d)
                .status()
                .map_err(|e| format!("jj: {e}"))?;
            return if st.success() {
                Ok(())
            } else {
                Err("jj git init --colocate failed".into())
            };
        }
        cur = d.parent();
    }
    Err("not inside a git or jj repository".into())
}

#[derive(Debug, PartialEq)]
pub struct LocalChange {
    pub change_id: Option<String>,
    pub subject: String,
}

const TEMPLATE: &str = r#"trailers.filter(|t| t.key() == "Change-Id").map(|t| t.value()).join(",") ++ "\t" ++ description.first_line() ++ "\n""#;

pub fn parse_local(text: &str) -> Vec<LocalChange> {
    text.lines()
        .filter(|l| !l.is_empty())
        .map(|l| {
            let (id, subject) = l.split_once('\t').unwrap_or(("", l));
            LocalChange {
                change_id: id
                    .split(',')
                    .next()
                    .filter(|s| !s.is_empty())
                    .map(str::to_string),
                subject: subject.to_string(),
            }
        })
        .collect()
}

fn gerrit(url: Option<String>) -> Result<(String, String), String> {
    if let Some(u) = url {
        return Ok((u.trim_end_matches('/').to_string(), String::new()));
    }
    let remotes = jj(&["git", "remote", "list"])?;
    let origin = remotes
        .lines()
        .find_map(|l| l.strip_prefix("origin "))
        .ok_or("no origin remote")?;
    gerrit_for_remote(origin.trim())
        .ok_or_else(|| format!("cannot derive a Gerrit host from {origin}"))
}

/// One change from Gerrit's `/changes/` query: (number, status, subject, project).
fn query(base: &str, change_id: &str) -> Result<Option<(u64, String, String, String)>, String> {
    let host = base.trim_start_matches("https://");
    let cookie = cookies_file()
        .and_then(|p| std::fs::read_to_string(p).ok())
        .and_then(|t| cookie_for(&t, host));
    let prefix = if cookie.is_some() { "/a" } else { "" };
    let url = format!("{base}{prefix}/changes/?q=change:{change_id}");
    let mut req = ureq::get(&url);
    if let Some(c) = &cookie {
        req = req.header("Cookie", c);
    }
    let body = req
        .call()
        .map_err(|e| format!("{url}: {e}"))?
        .into_body()
        .read_to_string()
        .map_err(|e| e.to_string())?;
    // Gerrit prefixes JSON with `)]}'` against XSSI.
    let json = body.trim_start_matches(")]}'").trim_start();
    let v: serde_json::Value = serde_json::from_str(json).map_err(|e| e.to_string())?;
    Ok(v.as_array().and_then(|a| a.first()).map(|c| {
        let s = |k: &str| {
            c.get(k)
                .and_then(|x| x.as_str())
                .unwrap_or_default()
                .to_string()
        };
        (
            c.get("_number").and_then(|n| n.as_u64()).unwrap_or(0),
            s("status"),
            s("subject"),
            s("project"),
        )
    }))
}

pub fn run_cl(name: &str, args: &[String]) -> i32 {
    let cli =
        match Cli::try_parse_from(std::iter::once(name.to_string()).chain(args.iter().cloned())) {
            Ok(c) => c,
            Err(e) => {
                let _ = e.print();
                return if e.use_stderr() { 2 } else { 0 };
            }
        };
    let cwd = std::env::current_dir().unwrap_or_else(|_| PathBuf::from("."));
    if let Err(e) = ensure_jj(&cwd) {
        eprintln!("{name}: {e}");
        return 2;
    }
    let result = match cli.cmd {
        Cmd::Upload {
            reviewers,
            cc,
            title,
            cq_dry_run,
            use_commit_queue,
            wip,
            topic,
            hashtags,
            target_branch,
            revision,
            dry_run,
            ..
        } => {
            let mut a: Vec<String> = vec!["gerrit".into(), "upload".into()];
            if let Some(r) = revision {
                a.extend(["-r".into(), r]);
            }
            a.extend(["-b".into(), target_branch.unwrap_or_else(|| "main".into())]);
            for r in reviewers.into_iter().filter(|r| !r.is_empty()) {
                a.extend(["--reviewer".into(), r]);
            }
            for c in cc.into_iter().filter(|c| !c.is_empty()) {
                a.extend(["--cc".into(), c]);
            }
            if let Some(t) = title {
                a.extend(["-m".into(), t]);
            }
            if use_commit_queue {
                a.push("--label=Commit-Queue+2".into());
            } else if cq_dry_run {
                a.push("--label=Commit-Queue+1".into());
            }
            if wip {
                a.push("--wip".into());
            }
            if let Some(t) = topic {
                a.extend(["--topic".into(), t]);
            }
            for h in hashtags {
                a.extend(["--hashtag".into(), h]);
            }
            if dry_run {
                a.push("--dry-run".into());
            }
            Command::new("jj")
                .args(&a)
                .status()
                .map_err(|e| format!("jj: {e}"))
                .map(|s| s.code().unwrap_or(1))
        }
        Cmd::Status {
            revision,
            gerrit_url,
        } => (|| {
            let (base, _) = gerrit(gerrit_url)?;
            let local = parse_local(&jj(&[
                "log",
                "--no-graph",
                "-r",
                &revision,
                "-T",
                TEMPLATE,
            ])?);
            for c in local {
                let Some(id) = &c.change_id else {
                    println!("{:<10} {:<8} {}", "-", "local", c.subject);
                    continue;
                };
                match query(&base, id)? {
                    Some((n, status, _subject, project)) => {
                        println!(
                            "{n:<10} {status:<8} {}  {base}/c/{project}/+/{n}",
                            c.subject
                        )
                    }
                    None => println!("{:<10} {:<8} {}", "-", "unsent", c.subject),
                }
            }
            Ok(0)
        })(),
        Cmd::Issue {
            revision,
            gerrit_url,
        } => (|| {
            let (base, _) = gerrit(gerrit_url)?;
            let local = parse_local(&jj(&[
                "log",
                "--no-graph",
                "-r",
                &revision,
                "-T",
                TEMPLATE,
            ])?);
            let id = local
                .first()
                .and_then(|c| c.change_id.clone())
                .ok_or("no Change-Id on that revision; upload it first")?;
            match query(&base, &id)? {
                Some((n, _, _, project)) => {
                    println!("Issue number: {n} ({base}/c/{project}/+/{n})")
                }
                None => println!("Issue number: None ({id} not on {base})"),
            }
            Ok(0)
        })(),
    };
    match result {
        Ok(code) => code,
        Err(e) => {
            eprintln!("{name}: {e}");
            1
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn gerrit_hosts() {
        assert_eq!(
            gerrit_for_remote("https://chromium.googlesource.com/chromium/src.git"),
            Some((
                "https://chromium-review.googlesource.com".into(),
                "chromium/src".into()
            ))
        );
        assert_eq!(
            gerrit_for_remote("https://chromium.googlesource.com/a/v8/v8"),
            Some((
                "https://chromium-review.googlesource.com".into(),
                "v8/v8".into()
            ))
        );
        assert_eq!(
            gerrit_for_remote("https://gerrit.example.org/proj").map(|g| g.0),
            Some("https://gerrit.example.org".into())
        );
    }

    #[test]
    fn gitcookies() {
        let t = "# comment\n.googlesource.com\tTRUE\t/\tTRUE\t2147483647\to\tgit-me.example.com=1//abc\n";
        assert_eq!(
            cookie_for(t, "chromium-review.googlesource.com").as_deref(),
            Some("o=git-me.example.com=1//abc")
        );
        assert_eq!(cookie_for(t, "example.org"), None);
    }

    #[test]
    fn local_changes() {
        let v = parse_local("Iabc\tFix thing\n\tNo id yet\n");
        assert_eq!(v[0].change_id.as_deref(), Some("Iabc"));
        assert_eq!(
            v[1],
            LocalChange {
                change_id: None,
                subject: "No id yet".into()
            }
        );
    }
}
