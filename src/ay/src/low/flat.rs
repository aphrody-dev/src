//! `ay flat` (resync of src/bun-flat from the bun fork), and the commands the flattened crates
//! back: `ay hash` (wyhash) and `ay time` (HdrHistogram percentiles).

use bun_flat::histogram::Histogram;
use bun_flat::sync::{self, Manifest};
use bun_flat::wyhash::{Wyhash, Wyhash11};
use std::io::Read;
use std::path::{Path, PathBuf};
use std::process::{Command, Stdio};
use std::time::Instant;

#[derive(clap::Args, Debug, PartialEq)]
#[command(after_help = "Examples:\n  ay flat list\n  ay flat check            fails when src/bun-flat and the fork disagree\n  ay flat sync             regenerate from third_party/bun at HEAD, record the commit\n  ay flat check --fork third_party/diffutils     manifest src/diffutils-flat/flat.toml\n  ay flat list --fork third_party/x --manifest path/to/flat.toml")]
pub struct FlatArgs {
    /// Monorepo root (default: $SRC_ROOT, else the enclosing checkout)
    #[arg(long, global = true)]
    pub root: Option<PathBuf>,
    /// Fork checkout (default: <root>/third_party/bun)
    #[arg(long, global = true)]
    pub fork: Option<PathBuf>,
    /// flat.toml of the fork (default: <root>/crates/<fork directory>-flat/flat.toml)
    #[arg(long, global = true)]
    pub manifest: Option<PathBuf>,
    #[command(subcommand)]
    pub cmd: FlatCmd,
}

#[derive(clap::Subcommand, Debug, PartialEq)]
pub enum FlatCmd {
    /// Modules, upstream crates, files, licenses
    List {
        #[arg(long)]
        json: bool,
    },
    /// Regenerate the modules from the fork's HEAD and record the commit in flat.toml
    Sync {
        /// Show what would change, write nothing
        #[arg(long)]
        dry_run: bool,
    },
    /// Compare the modules with the fork at the recorded commit; report upstream changes since
    Check {
        /// Fail (exit 3) when the fork is not checked out instead of skipping
        #[arg(long)]
        strict: bool,
    },
}

/// (flat crate directory, flat.toml, fork checkout). A relative `--fork` / `--manifest` is taken from the root.
fn dirs(root: Option<PathBuf>, fork: Option<PathBuf>, manifest: Option<PathBuf>) -> (PathBuf, PathBuf, PathBuf) {
    let root = root.unwrap_or_else(crate::repo_root);
    let fork = root.join(fork.unwrap_or_else(|| PathBuf::from("third_party").join("bun")));
    let manifest = match manifest {
        Some(m) => root.join(m),
        None => {
            let name = fork.file_name().map(|n| n.to_string_lossy().into_owned()).unwrap_or_default();
            root.join("src").join(format!("{name}-flat")).join(sync::MANIFEST)
        }
    };
    let crate_dir = manifest.parent().map(Path::to_path_buf).unwrap_or_default();
    (crate_dir, manifest, fork)
}

/// Load the manifest and refuse it when a license is missing, NOASSERTION or off the deny.toml
/// allow-list, or when the fork has no license file (a fork that is not checked out is left to `check`).
fn load(root: &Path, manifest_path: &Path, fork: &Path) -> Result<Manifest, String> {
    let m = Manifest::load_file(manifest_path)?;
    let deny = root.join("deny.toml");
    let text = std::fs::read_to_string(&deny).map_err(|e| format!("{}: {e}", deny.display()))?;
    m.check_licenses(&sync::allow_list(&text)?)?;
    if fork.join(".git").exists() {
        sync::fork_license_file(fork)?;
    }
    Ok(m)
}

pub fn run_flat(a: FlatArgs) -> i32 {
    let root = a.root.clone().unwrap_or_else(crate::repo_root);
    let (crate_dir, manifest_path, fork) = dirs(Some(root.clone()), a.fork, a.manifest);
    let manifest = match load(&root, &manifest_path, &fork) {
        Ok(m) => m,
        Err(e) => {
            eprintln!("ay flat: {e}");
            return 2;
        }
    };
    match a.cmd {
        FlatCmd::List { json } => list(&manifest, &crate_dir, json),
        FlatCmd::Sync { dry_run } => resync(&manifest, &crate_dir, &fork, dry_run),
        FlatCmd::Check { strict } => check(&manifest, &crate_dir, &fork, strict),
    }
}

fn lines(path: &Path) -> usize {
    std::fs::read_to_string(path).map(|t| t.lines().count()).unwrap_or(0)
}

fn list(m: &Manifest, crate_dir: &Path, json: bool) -> i32 {
    let rows: Vec<serde_json::Value> = m
        .modules
        .iter()
        .map(|module| {
            let file = if module.files.len() == 1 {
                crate_dir.join("src").join(format!("{}.rs", module.name))
            } else {
                crate_dir.join("src").join(&module.name).join("mod.rs")
            };
            serde_json::json!({"module": module.name, "crate": module.krate, "files": module.files, "lines": lines(&file), "license": module.license})
        })
        .collect();
    if json {
        println!("{}", serde_json::to_string_pretty(&serde_json::json!({"fork": m.fork, "commit": m.commit, "modules": rows})).unwrap_or_default());
    } else {
        println!("{}@{}", m.fork, m.commit);
        for r in &rows {
            println!("{:<16} {:<20} {:>6} lines  {}", r["module"].as_str().unwrap_or(""), r["crate"].as_str().unwrap_or(""), r["lines"], r["license"].as_str().unwrap_or(""));
        }
    }
    0
}

fn resync(m: &Manifest, crate_dir: &Path, fork: &Path, dry_run: bool) -> i32 {
    let result = sync::fork_head(fork, m).and_then(|commit| {
        let files = sync::generate(m, fork, &commit)?;
        if dry_run {
            Ok((commit, sync::differences(crate_dir, &files)))
        } else {
            sync::write(crate_dir, &files, &commit).map(|changed| (commit, changed))
        }
    });
    match result {
        Ok((commit, changed)) => {
            for c in &changed {
                println!("{} {}", if dry_run { "would write" } else { "wrote" }, c.display());
            }
            println!("{} file(s) {} from {}@{commit}", changed.len(), if dry_run { "differ" } else { "updated" }, m.fork);
            0
        }
        Err(e) => {
            eprintln!("ay flat sync: {e}");
            1
        }
    }
}

fn check(m: &Manifest, crate_dir: &Path, fork: &Path, strict: bool) -> i32 {
    if !fork.join(".git").exists() {
        eprintln!("ay flat check: {} is not checked out; skipped", fork.display());
        return if strict { 3 } else { 0 };
    }
    let files = match sync::generate_at(m, fork, &m.commit) {
        Ok(f) => f,
        Err(e) => {
            eprintln!("ay flat check: {e}");
            return 1;
        }
    };
    let diff = sync::differences(crate_dir, &files);
    for d in &diff {
        eprintln!("modified by hand or stale: {}", d.display());
    }
    let moved = sync::moved_upstream(m, fork, &m.commit).unwrap_or_default();
    for p in &moved {
        println!("changed in the fork since {}: {p} (run `ay flat sync`)", &m.commit[..m.commit.len().min(10)]);
    }
    if diff.is_empty() && moved.is_empty() {
        println!("{} matches {}@{}", crate_dir.display(), m.fork, m.commit);
    }
    if diff.is_empty() { 0 } else { 1 }
}

#[derive(clap::Args, Debug, PartialEq)]
#[command(after_help = "Examples:\n  ay hash Cargo.lock bun.lock\n  ay hash --json docs/*.md\n  echo hi | ay hash")]
pub struct HashArgs {
    /// Files (none or `-`: stdin)
    pub files: Vec<PathBuf>,
    /// Seed
    #[arg(long, default_value_t = 0)]
    pub seed: u64,
    /// The legacy Wyhash11 variant instead of wyhash final4
    #[arg(long)]
    pub legacy: bool,
    #[arg(long)]
    pub json: bool,
}

pub fn hash_bytes(bytes: &[u8], seed: u64, legacy: bool) -> u64 {
    if legacy { Wyhash11::hash(seed, bytes) } else { Wyhash::hash(seed, bytes) }
}

pub fn run_hash(a: HashArgs) -> i32 {
    let inputs: Vec<Option<&PathBuf>> =
        if a.files.is_empty() { vec![None] } else { a.files.iter().map(|f| (f.as_os_str() != std::ffi::OsStr::new("-")).then_some(f)).collect() };
    let mut rows = Vec::new();
    let mut code = 0;
    for input in inputs {
        let data = match input {
            Some(f) => std::fs::read(f).map_err(|e| format!("{}: {e}", f.display())),
            None => {
                let mut v = Vec::new();
                std::io::stdin().read_to_end(&mut v).map(|_| v).map_err(|e| format!("stdin: {e}"))
            }
        };
        let name = input.map_or("-".to_string(), |f| f.display().to_string());
        match data {
            Ok(bytes) => {
                let h = hash_bytes(&bytes, a.seed, a.legacy);
                if a.json {
                    rows.push(serde_json::json!({"file": name, "wyhash": format!("{h:016x}"), "bytes": bytes.len()}));
                } else {
                    println!("{h:016x}  {name}");
                }
            }
            Err(e) => {
                eprintln!("ay hash: {e}");
                code = 1;
            }
        }
    }
    if a.json {
        println!("{}", serde_json::to_string_pretty(&rows).unwrap_or_default());
    }
    code
}

#[derive(clap::Args, Debug, PartialEq)]
#[command(after_help = "Examples:\n  ay time -n 50 -- ay --version     startup time of ay\n  ay time -n 20 --warmup 3 --json -- bun --version")]
pub struct TimeArgs {
    /// Runs
    #[arg(short = 'n', long, default_value_t = 20, value_parser = clap::value_parser!(u32).range(1..=100_000))]
    pub runs: u32,
    /// Unmeasured runs first
    #[arg(long, default_value_t = 1)]
    pub warmup: u32,
    /// Keep the command's stdout and stderr
    #[arg(long)]
    pub show_output: bool,
    #[arg(long)]
    pub json: bool,
    /// The command
    #[arg(last = true, required = true, num_args = 1..)]
    pub command: Vec<String>,
}

pub fn run_time(a: TimeArgs) -> i32 {
    let once = || -> Result<(u64, i32), String> {
        let mut cmd = Command::new(&a.command[0]);
        cmd.args(&a.command[1..]);
        if !a.show_output {
            cmd.stdout(Stdio::null()).stderr(Stdio::null());
        }
        let t = Instant::now();
        let status = cmd.status().map_err(|e| format!("{}: {e}", a.command[0]))?;
        Ok((t.elapsed().as_nanos() as u64, status.code().unwrap_or(1)))
    };
    for _ in 0..a.warmup {
        if let Err(e) = once() {
            eprintln!("ay time: {e}");
            return 127;
        }
    }
    // 1 us .. 1 h, 3 significant digits.
    let Some(mut h) = Histogram::new(1_000, 3_600_000_000_000, 3) else { return 1 };
    let mut failures = 0u32;
    for _ in 0..a.runs {
        match once() {
            Ok((ns, code)) => {
                h.record(ns.max(1_000));
                if code != 0 {
                    failures += 1;
                }
            }
            Err(e) => {
                eprintln!("ay time: {e}");
                return 127;
            }
        }
    }
    let ms = |ns: u64| ns as f64 / 1e6;
    let p = |q: f64| h.value_at_percentile(q);
    if a.json {
        let v = serde_json::json!({
            "schema": "ay-time/1", "command": a.command, "runs": a.runs, "failures": failures,
            "ms": {"min": ms(h.min()), "p50": ms(p(50.0)), "p90": ms(p(90.0)), "p99": ms(p(99.0)), "max": ms(h.max()), "mean": h.mean() / 1e6, "stddev": h.stddev() / 1e6},
        });
        println!("{}", serde_json::to_string_pretty(&v).unwrap_or_default());
    } else {
        println!(
            "{}: {} runs, min {:.2} ms  p50 {:.2}  p90 {:.2}  p99 {:.2}  max {:.2}  mean {:.2} +- {:.2}{}",
            a.command.join(" "),
            a.runs,
            ms(h.min()),
            ms(p(50.0)),
            ms(p(90.0)),
            ms(p(99.0)),
            ms(h.max()),
            h.mean() / 1e6,
            h.stddev() / 1e6,
            if failures > 0 { format!("  ({failures} non-zero exits)") } else { String::new() }
        );
    }
    if failures > 0 { 1 } else { 0 }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn wyhash_matches_the_reference_vectors() {
        // wangyi-fudan/wyhash test_vector.cpp, as in the fork's own test.
        assert_eq!(hash_bytes(b"", 0, false), 0x0409638ee2bde459);
        assert_eq!(hash_bytes(b"abc", 2, false), 0x32dd92e4b2915153);
        assert_ne!(hash_bytes(b"abc", 2, true), hash_bytes(b"abc", 2, false));
    }

    #[test]
    fn manifest_of_the_checkout_parses() {
        let crate_dir = Path::new(env!("SRC_ROOT")).join("src/bun-flat");
        let m = Manifest::load(&crate_dir).unwrap();
        assert!(m.modules.iter().any(|x| x.name == "wyhash"));
        assert_eq!(m.commit.len(), 40);
    }

    #[test]
    fn manifest_path_follows_the_fork_directory() {
        let root = PathBuf::from("/r");
        let (dir, manifest, fork) = dirs(Some(root.clone()), None, None);
        assert_eq!((dir, manifest, fork), (root.join("src/bun-flat"), root.join("src/bun-flat/flat.toml"), root.join("third_party/bun")));
        let (dir, manifest, fork) = dirs(Some(root.clone()), Some("third_party/diffutils".into()), None);
        assert_eq!((dir, manifest, fork), (root.join("src/diffutils-flat"), root.join("src/diffutils-flat/flat.toml"), root.join("third_party/diffutils")));
        let (dir, manifest, _) = dirs(Some(root.clone()), Some("third_party/x".into()), Some("m/flat.toml".into()));
        assert_eq!((dir, manifest), (root.join("m"), root.join("m/flat.toml")));
    }

    /// Every flat manifest of the checkout passes the license gate against the root deny.toml.
    #[test]
    fn manifests_of_the_checkout_pass_the_license_gate() {
        let root = Path::new(env!("SRC_ROOT"));
        let allow = sync::allow_list(&std::fs::read_to_string(root.join("deny.toml")).unwrap()).unwrap();
        for entry in std::fs::read_dir(root.join("crates")).unwrap().flatten() {
            let path = entry.path().join(sync::MANIFEST);
            if path.is_file() {
                Manifest::load_file(&path).unwrap().check_licenses(&allow).unwrap_or_else(|e| panic!("{}: {e}", path.display()));
            }
        }
    }
}
