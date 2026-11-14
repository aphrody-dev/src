//! Git read paths on gitoxide, in place of the `git` binary: the subset of subcommands that our
//! workflows call and gix covers (see docs/DEPOT_TOOLS_RUST.md, "Replacing Git for Windows").
//! `ay git rev-parse | branch --show-current | remote | rev-list --count | status | log |
//! config --get` route here.

use gix::bstr::ByteSlice;
use std::collections::HashSet;
use std::path::Path;

fn open(path: &Path) -> Result<gix::Repository, String> {
    gix::discover(path).map_err(|e| format!("{}: {e}", path.display()))
}

/// `git rev-parse <spec>`.
pub fn rev_parse(path: &Path, spec: &str) -> Result<String, String> {
    let repo = open(path)?;
    repo.rev_parse_single(spec)
        .map(|id| id.to_string())
        .map_err(|e| format!("{spec}: {e}"))
}

/// `git rev-parse --abbrev-ref HEAD` (`HEAD` when detached) / `git branch --show-current`
/// (empty when detached).
pub fn current_branch(path: &Path) -> Result<Option<String>, String> {
    let repo = open(path)?;
    let name = repo.head_name().map_err(|e| e.to_string())?;
    Ok(name.map(|n| n.shorten().to_str_lossy().into_owned()))
}

/// `git remote -v` (fetch URLs), in name order.
pub fn remotes(path: &Path) -> Result<Vec<(String, String)>, String> {
    let repo = open(path)?;
    // Read `remote.<name>.url` directly: `find_remote` also validates refspecs and rewrites,
    // and rejects remotes that git itself lists.
    // `remote_names()` applies gix's section trust filter, which drops the repository's own
    // config on some Windows ownership setups; list the sections from the merged config instead.
    let config = repo.config_snapshot();
    let mut names: Vec<String> = config
        .plumbing()
        .sections_by_name("remote")
        .into_iter()
        .flatten()
        .filter_map(|s| {
            s.header()
                .subsection_name()
                .map(|n| n.to_str_lossy().into_owned())
        })
        .collect();
    names.sort();
    names.dedup();
    let mut out = Vec::new();
    for name in names {
        if let Some(url) = config.string(format!("remote.{name}.url").as_str()) {
            out.push((name, url.to_str_lossy().into_owned()));
        }
    }
    Ok(out)
}

/// `git remote get-url <name>`.
pub fn remote_url(path: &Path, name: &str) -> Result<Option<String>, String> {
    Ok(remotes(path)?
        .into_iter()
        .find(|(n, _)| n == name)
        .map(|(_, u)| u))
}

fn ancestors(repo: &gix::Repository, tip: gix::ObjectId) -> Result<HashSet<gix::ObjectId>, String> {
    let mut set = HashSet::new();
    for info in repo.rev_walk([tip]).all().map_err(|e| e.to_string())? {
        set.insert(info.map_err(|e| e.to_string())?.id);
    }
    Ok(set)
}

/// `git rev-list --left-right --count <left>...<right>`: (only in left, only in right).
pub fn left_right_count(path: &Path, left: &str, right: &str) -> Result<(usize, usize), String> {
    let repo = open(path)?;
    let l = repo
        .rev_parse_single(left)
        .map_err(|e| format!("{left}: {e}"))?
        .detach();
    let r = repo
        .rev_parse_single(right)
        .map_err(|e| format!("{right}: {e}"))?
        .detach();
    let (ls, rs) = (ancestors(&repo, l)?, ancestors(&repo, r)?);
    Ok((ls.difference(&rs).count(), rs.difference(&ls).count()))
}

/// One line of `git log --format='%H%x09%an%x09%s'`.
#[derive(Debug, Clone, PartialEq)]
pub struct LogEntry {
    pub id: String,
    pub author: String,
    pub time: i64,
    pub subject: String,
}

/// `git log -n <limit> <rev>`, first-parent order by commit time.
pub fn log(path: &Path, rev: &str, limit: usize) -> Result<Vec<LogEntry>, String> {
    let repo = open(path)?;
    let tip = repo
        .rev_parse_single(rev)
        .map_err(|e| format!("{rev}: {e}"))?
        .detach();
    let mut out = Vec::new();
    for info in repo
        .rev_walk([tip])
        .all()
        .map_err(|e| e.to_string())?
        .take(limit)
    {
        let info = info.map_err(|e| e.to_string())?;
        let commit = repo
            .find_object(info.id)
            .map_err(|e| e.to_string())?
            .into_commit();
        let c = commit.decode().map_err(|e| e.to_string())?;
        out.push(LogEntry {
            id: info.id.to_string(),
            author: c
                .author()
                .map(|a| a.name.to_str_lossy().into_owned())
                .unwrap_or_default(),
            time: c
                .committer()
                .ok()
                .and_then(|s| s.time().ok())
                .map(|t| t.seconds)
                .unwrap_or(0),
            subject: c
                .message
                .lines()
                .next()
                .map(|l| l.to_str_lossy().into_owned())
                .unwrap_or_default(),
        });
    }
    Ok(out)
}

/// `git config --get <section.key>` (also `section.subsection.key`).
pub fn config_get(path: &Path, key: &str) -> Result<Option<String>, String> {
    let repo = open(path)?;
    Ok(repo
        .config_snapshot()
        .string(key)
        .map(|v| v.to_str_lossy().into_owned()))
}

/// `git status --porcelain` for tracked files: `( M|D|T, path)` between index and worktree.
/// Untracked files and index-vs-HEAD changes are not reported (not needed by callers).
pub fn status_tracked(path: &Path) -> Result<Vec<(char, String)>, String> {
    use gix::status::index_worktree::Item;
    let repo = open(path)?;
    let iter = repo
        .status(gix::progress::Discard)
        .map_err(|e| e.to_string())?
        .index_worktree_options_mut(|o| o.dirwalk_options = None)
        .into_index_worktree_iter(Vec::new())
        .map_err(|e| e.to_string())?;
    let mut out = Vec::new();
    for item in iter {
        let item = item.map_err(|e| e.to_string())?;
        if let Item::Modification {
            rela_path, status, ..
        } = &item
        {
            use gix::status::plumbing::index_as_worktree::{Change, EntryStatus};
            let code = match status {
                EntryStatus::Change(Change::Removed) => 'D',
                EntryStatus::Change(Change::Type { .. }) => 'T',
                EntryStatus::Change(_) => 'M',
                EntryStatus::Conflict { .. } => 'U',
                _ => continue,
            };
            out.push((code, rela_path.to_str_lossy().into_owned()));
        }
    }
    out.sort_by(|a, b| a.1.cmp(&b.1));
    Ok(out)
}

/// `ay git <sub>` for the gix-backed subcommands. `None` when `args` is not one of them, so the
/// caller falls through to its other commands.
pub fn run(args: &[String]) -> Option<i32> {
    let sub = args.first()?.as_str();
    let rest: Vec<&str> = args[1..].iter().map(String::as_str).collect();
    let cwd = std::env::current_dir().unwrap_or_else(|_| ".".into());
    let print_err = |e: String| {
        eprintln!("ay git {sub}: {e}");
        1
    };
    let code = match (sub, rest.as_slice()) {
        ("rev-parse", ["--abbrev-ref", "HEAD"]) => match current_branch(&cwd) {
            Ok(b) => {
                println!("{}", b.unwrap_or_else(|| "HEAD".into()));
                0
            }
            Err(e) => print_err(e),
        },
        ("rev-parse", [flag, spec]) if flag.starts_with("--short") => {
            let n: usize = flag
                .strip_prefix("--short=")
                .and_then(|v| v.parse().ok())
                .unwrap_or(7);
            match rev_parse(&cwd, spec) {
                Ok(id) => {
                    println!("{}", &id[..n.min(id.len())]);
                    0
                }
                Err(e) => print_err(e),
            }
        }
        ("rev-parse", specs) if !specs.is_empty() && specs.iter().all(|s| !s.starts_with('-')) => {
            for s in specs {
                match rev_parse(&cwd, s) {
                    Ok(id) => println!("{id}"),
                    Err(e) => return Some(print_err(e)),
                }
            }
            0
        }
        ("branch", ["--show-current"]) => match current_branch(&cwd) {
            Ok(b) => {
                println!("{}", b.unwrap_or_default());
                0
            }
            Err(e) => print_err(e),
        },
        ("remote", [] | ["-v"]) => match remotes(&cwd) {
            Ok(rs) => {
                for (n, u) in rs {
                    if rest.is_empty() {
                        println!("{n}");
                    } else {
                        println!("{n}\t{u} (fetch)");
                    }
                }
                0
            }
            Err(e) => print_err(e),
        },
        ("remote", ["get-url", name]) => match remote_url(&cwd, name) {
            Ok(Some(u)) => {
                println!("{u}");
                0
            }
            Ok(None) => print_err(format!("No such remote '{name}'")),
            Err(e) => print_err(e),
        },
        ("rev-list", ["--left-right", "--count", range]) if range.contains("...") => {
            let (l, r) = range.split_once("...").unwrap_or_default();
            match left_right_count(&cwd, l, if r.is_empty() { "HEAD" } else { r }) {
                Ok((a, b)) => {
                    println!("{a}\t{b}");
                    0
                }
                Err(e) => print_err(e),
            }
        }
        ("config", ["--get", key]) => match config_get(&cwd, key) {
            Ok(Some(v)) => {
                println!("{v}");
                0
            }
            Ok(None) => 1,
            Err(e) => print_err(e),
        },
        ("status", ["--porcelain"] | ["--short"]) => match status_tracked(&cwd) {
            Ok(items) => {
                for (c, p) in items {
                    println!(" {c} {p}");
                }
                0
            }
            Err(e) => print_err(e),
        },
        ("log", flags) => {
            let mut n = 10usize;
            let mut rev = "HEAD";
            for f in flags {
                if let Some(v) = f
                    .strip_prefix("-n")
                    .or_else(|| f.strip_prefix("--max-count="))
                {
                    n = v.parse().unwrap_or(n);
                } else if let Some(v) = f
                    .strip_prefix('-')
                    .filter(|v| v.chars().all(|c| c.is_ascii_digit()) && !v.is_empty())
                {
                    n = v.parse().unwrap_or(n);
                } else if f.starts_with('-') {
                    return None; // a format we do not reproduce: let the caller say so
                } else {
                    rev = f;
                }
            }
            match log(&cwd, rev, n) {
                Ok(entries) => {
                    for e in entries {
                        println!("{} {}", &e.id[..12], e.subject);
                    }
                    0
                }
                Err(e) => print_err(e),
            }
        }
        _ => return None,
    };
    Some(code)
}

#[cfg(test)]
mod tests {
    use super::*;

    /// The monorepo itself: HEAD resolves, the branch and remotes read without `git`.
    #[test]
    fn reads_this_repository() {
        let root = Path::new(env!("SRC_ROOT"));
        let head = rev_parse(&root, "HEAD").unwrap();
        assert_eq!(head.len(), 40);
        let log = log(&root, "HEAD", 3).unwrap();
        assert_eq!(log[0].id, head);
        assert!(log.len() <= 3);
        let _ = current_branch(&root).unwrap();
        let _ = remotes(&root).unwrap();
        assert_eq!(left_right_count(&root, "HEAD", "HEAD").unwrap(), (0, 0));
        assert!(run(&["frobnicate".into()]).is_none());
    }
}
