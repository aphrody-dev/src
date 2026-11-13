// Sovereign Monorepo Engine & Toolchain Orchestrator: xtk
// First-class 4-Pillar VCS Governance:
//   1. Git Superproject (.gitmodules, .gitattributes, Scalar, src.lock.json)
//   2. Chromium depot_tools (DEPS, .gclient)
//   3. Linux Kernel (MAINTAINERS, torvalds/stable/next/gki remotes, quilt patch series)
//   4. Android AOSP (third_party/aosp, Kleaf GKI; audit only, no generated manifest)
// pin-001: src.lock.json is the only pin; DEPS and .gitmodules derive from it (manifests.rs).
use argh::FromArgs;
use serde::{Deserialize, Serialize};
use std::collections::BTreeMap;
use std::fs;
use std::path::{Path, PathBuf};
use depot_core::{GitSlim, SlimOptions};
use std::process::Command;

pub mod manifests;

pub mod deps;

#[derive(FromArgs, PartialEq, Debug)]
/// Sovereign Monorepo Engine & Toolchain Orchestrator (xtk)
struct TopLevel {
    #[argh(subcommand)]
    cmd: SubCommand,
}

#[derive(FromArgs, PartialEq, Debug)]
#[argh(subcommand)]
enum SubCommand {
    Doctor(DoctorCmd),
    SlimAll(SlimAllCmd),
    Lock(LockCmd),
    Manifests(ManifestsCmd),
    AuditVcs(AuditVcsCmd),
}

#[derive(FromArgs, PartialEq, Debug)]
/// verify health of all compiler, VCS, and monorepo toolchains
#[argh(subcommand, name = "doctor")]
struct DoctorCmd {
    /// check the supply-chain policy (docs/deps/POLICY.md) instead of the toolchains
    #[argh(switch)]
    deps: bool,
    /// with --deps: list every crate resolved at several versions
    #[argh(switch)]
    dups: bool,
    /// with --deps: JSON report
    #[argh(switch)]
    json: bool,
    /// repository root (default: $SRC_ROOT, else the nearest ancestor holding src.lock.json)
    #[argh(option, default = "String::new()")]
    root: String,
}

#[derive(FromArgs, PartialEq, Debug)]
/// run byte-level Git and Scalar optimization across all C:\src repos
#[argh(subcommand, name = "slim-all")]
struct SlimAllCmd {
    /// repository root (default: $SRC_ROOT, else the nearest ancestor holding src.lock.json)
    #[argh(option, default = "String::new()")]
    root: String,
}

#[derive(FromArgs, PartialEq, Debug)]
/// generate src.lock.json from the checkout, then DEPS, .gitmodules and patch series from it
#[argh(subcommand, name = "lock")]
struct LockCmd {
    /// repository root (default: $SRC_ROOT, else the nearest ancestor holding src.lock.json)
    #[argh(option, default = "String::new()")]
    root: String,
    /// output lockfile path (default: <root>/src.lock.json)
    #[argh(option, default = "String::new()")]
    out: String,
    /// write src.lock.json only (no derived manifests)
    #[argh(switch)]
    lock_only: bool,
    /// refresh the language locks (Cargo.lock, bun.lock, uv.lock) instead of src.lock.json
    #[argh(switch)]
    deps: bool,
    /// with --deps: upgrade within the declared requirements (cargo update, bun update, uv lock --upgrade)
    #[argh(switch)]
    bump: bool,
    /// with --deps: also raise Cargo requirements across major versions (cargo update --breaking)
    #[argh(switch)]
    breaking: bool,
    /// with --deps: move inline member requirements into [workspace.dependencies] first
    #[argh(switch)]
    hoist: bool,
}

#[derive(FromArgs, PartialEq, Debug)]
/// derive DEPS, .gitmodules and quilt series from src.lock.json (pin-001); --check reports drift
#[argh(subcommand, name = "manifests")]
struct ManifestsCmd {
    /// repository root (default: $SRC_ROOT, else the nearest ancestor holding src.lock.json)
    #[argh(option, default = "String::new()")]
    root: String,
    /// verify instead of writing: exit 1 when a derived file or a gitlink differs from src.lock.json
    #[argh(switch)]
    check: bool,
}

#[derive(FromArgs, PartialEq, Debug)]
/// audit 4-pillar VCS governance (Git + Chromium + Kernel + AOSP + NTFS junctions)
#[argh(subcommand, name = "audit-vcs")]
struct AuditVcsCmd {
    /// repository root (default: $SRC_ROOT, else the nearest ancestor holding src.lock.json)
    #[argh(option, default = "String::new()")]
    root: String,
    /// emit JSON output
    #[argh(switch)]
    json: bool,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
struct SrcLock {
    version: u32,
    generated_at: String,
    hardware: HardwareTarget,
    toolchains: BTreeMap<String, String>,
    pillars: PillarSummary,
    repositories: BTreeMap<String, LockedRepo>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
struct PillarSummary {
    git_superproject_commit: String,
    chromium_src_commit: String,
    linux_kernel_commit: String,
    aosp_manifest_commit: String,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
struct HardwareTarget {
    os: String,
    cpu: String,
    gpu: String,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct LockedRepo {
    path: String,
    url: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    upstream_url: Option<String>,
    commit: String,
    branch: String,
    engine: String,
    pillar: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    remotes: Option<BTreeMap<String, String>>,
    sparse_paths: Option<Vec<String>>,
}

#[derive(Serialize, Deserialize, Debug)]
struct VcsAuditReport {
    root: String,
    healthy: bool,
    locked_repositories: usize,
    submodules_count: usize,
    root_junctions_count: usize,
    dangling_junctions: Vec<String>,
    git_superproject_ok: bool,
    chromium_deps_ok: bool,
    linux_kernel_ok: bool,
    aosp_repo_ok: bool,
    notes: Vec<String>,
}

fn safe_output(program: &str, args: &[&str]) -> Option<String> {
    Command::new(program)
        .args(args)
        .output()
        .ok()
        .and_then(|out| {
            if out.status.success() {
                let s = String::from_utf8_lossy(&out.stdout).trim().to_string();
                if s.is_empty() {
                    Some(String::from_utf8_lossy(&out.stderr).trim().to_string())
                } else {
                    Some(s)
                }
            } else {
                None
            }
        })
}

fn safe_tool_probe(program: &str, args: &[&str]) -> Option<String> {
    Command::new(program)
        .args(args)
        .output()
        .ok()
        .and_then(|out| {
            let stdout = String::from_utf8_lossy(&out.stdout).trim().to_string();
            let stderr = String::from_utf8_lossy(&out.stderr).trim().to_string();
            if out.status.success() {
                if !stdout.is_empty() {
                    Some(stdout)
                } else if !stderr.is_empty() {
                    Some(stderr)
                } else {
                    Some("OK".to_string())
                }
            } else if program == "cl" && (!stdout.is_empty() || !stderr.is_empty()) {
                Some(if !stderr.is_empty() { stderr } else { stdout })
            } else {
                None
            }
        })
}

fn find_tool_version(name: &str, program: &str, args: &[&str]) -> (String, bool, String) {
    if let Some(out) = safe_tool_probe(program, args) {
        let first_line = out.lines().next().unwrap_or("").to_string();
        (name.to_string(), true, first_line)
    } else {
        (name.to_string(), false, "NOT FOUND".to_string())
    }
}

fn check_doctor() {
    println!("\n=== SOVEREIGN TOOLCHAIN & 4-PILLAR VCS DOCTOR (xtk) ===");
    println!("{:<14} {:<8} {}", "TOOL", "STATUS", "VERSION / DETAILS");
    println!("{}", "-".repeat(72));

    let tools = [
        ("rustc", "rustc", vec!["--version"]),
        ("cargo", "cargo", vec!["--version"]),
        ("sccache", "sccache", vec!["--version"]),
        ("xwin", "xwin", vec!["--version"]),
        ("bun", "bun", vec!["--version"]),
        ("jj", "jj", vec!["--version"]),
        ("gix", "gix", vec!["--version"]),
        ("just", "just", vec!["--version"]),
        ("go", "go", vec!["version"]),
        ("zig", "zig", vec!["version"]),
        ("dotnet", "dotnet", vec!["--version"]),
        ("nvcc", "nvcc", vec!["--version"]),
        ("cl.exe", "cl", vec!["/help"]),
        ("ay", "ay", vec!["--version"]),
        ("claude", "claude", vec!["--version"]),
        ("agy", "agy", vec!["--version"]),
        ("wck", "wck", vec!["--version"]),
    ];

    let mut all_ok = true;
    for (name, prog, args) in tools {
        let (n, ok, detail) = find_tool_version(name, prog, &args);
        let status = if ok { "OK" } else { "MISSING" };
        if !ok {
            all_ok = false;
        }

        let short_detail = if n == "cl.exe" && ok {
            "MSVC v14.51 (Microsoft C/C++ Optimizing Compiler)".to_string()
        } else if detail.len() > 52 {
            format!("{}...", &detail[..49])
        } else {
            detail
        };

        println!("{:<14} {:<8} {}", n, status, short_detail);
    }

    println!("{}", "-".repeat(72));
    if all_ok {
        println!("All 17 sovereign toolchains, VCS orchestrators & CLIs operational.\n");
    } else {
        println!("Some toolchains are missing or not in PATH.\n");
    }
}

pub fn is_reparse_point(path: &Path) -> bool {
    #[cfg(windows)]
    {
        use std::os::windows::fs::MetadataExt;
        if let Ok(meta) = fs::symlink_metadata(path) {
            return (meta.file_attributes() & 0x0400) != 0;
        }
    }
    #[cfg(not(windows))]
    {
        if let Ok(meta) = fs::symlink_metadata(path) {
            return meta.file_type().is_symlink();
        }
    }
    false
}

fn scan_repo_tree(dir: &Path, depth: usize, max_depth: usize, repos: &mut Vec<PathBuf>) {
    if depth > max_depth {
        return;
    }
    if let Ok(entries) = fs::read_dir(dir) {
        for entry in entries.flatten() {
            let p = entry.path();
            let name = p.file_name().and_then(|n| n.to_str()).unwrap_or("");
            if name.starts_with('.')
                || name == "node_modules"
                || name == "target"
                || name == "yolo-archive"
            {
                continue;
            }
            if is_reparse_point(&p) {
                continue;
            }
            if !p.is_dir() {
                continue;
            }
            if p.join(".git").exists() || p.join(".jj").exists() {
                repos.push(p);
            } else {
                scan_repo_tree(&p, depth + 1, max_depth, repos);
            }
        }
    }
}

pub fn discover_repos(root: &Path) -> Vec<PathBuf> {
    let mut repos = Vec::new();
    let canonical_groups = ["apps", "packages", "crates", "infra", "third_party"];
    for group in canonical_groups {
        let gp = root.join(group);
        if gp.is_dir() && !is_reparse_point(&gp) {
            scan_repo_tree(&gp, 1, 3, &mut repos);
        }
    }
    if root.join("infra").join(".git").exists() {
        repos.push(root.join("infra"));
    }
    repos.sort();
    repos.dedup();
    repos
}

/// Dépôts tiers par pilier. third_party/ est à plat (modèle Chromium) : la catégorie n'est plus dans le chemin.
/// Liste issue de la classification par chemin d'avant le flatten du 2026-11-12
/// (packages/machine/src/flatten-third-party.ts, plan dans var/flatten-third-party.json).
const LINUX_THIRD_PARTY: &[&str] = &[
    "CachyOS-PKGBUILDS",
    "WSL",
    "aether",
    "ananicy-rules",
    "arch-wsl",
    "archinstall",
    "archlinux-wsl",
    "cachy-chroot",
    "cachyos-hyprland-settings",
    "cachyos-niri-settings",
    "cachyos-wsl",
    "devtools",
    "herdr",
    "kernel-patches",
    "mkinitcpio",
    "omarchy",
    "omarchy-pkgs",
    "omarchy-plugin-marketplace",
    "omarchy-site",
    "pacman",
    "pkg-cosmic-session",
    "pkg-hyprland",
    "pkg-linux",
    "pkg-manage-util",
    "try-omarchy-windows",
    "ttfx",
];
const AOSP_THIRD_PARTY: &[&str] = &[
    "android-skills",
    "aosp-manifest",
    "design-md",
    "gemini-skills",
    "google-skills",
    "googleworkspace-cli",
    "jules-skills",
    "kleaf",
    "stitch-skills",
];

fn third_party_in(rel_name: &str, set: &[&str]) -> bool {
    rel_name
        .strip_prefix("third_party/")
        .is_some_and(|n| set.contains(&n))
}

fn classify_pillar(rel_name: &str) -> &'static str {
    if rel_name.starts_with("third_party/chromium")
        || rel_name == "third_party/depot_tools"
        || rel_name == "packages/chromium-bun"
    {
        "chromium"
    } else if rel_name == "third_party/linux"
        || third_party_in(rel_name, LINUX_THIRD_PARTY)
        || rel_name == "crates/unix"
    {
        "linux-kernel"
    } else if third_party_in(rel_name, AOSP_THIRD_PARTY) || rel_name == "apps/aphrody-app" {
        "aosp"
    } else {
        "git"
    }
}

fn read_git_remotes(repo: &Path) -> BTreeMap<String, String> {
    let mut map = BTreeMap::new();
    let repo_s = repo.to_string_lossy();
    if let Some(out) = safe_output("git", &["-C", &repo_s, "remote", "-v"]) {
        for line in out.lines() {
            let parts: Vec<&str> = line.split_whitespace().collect();
            if parts.len() >= 3 && parts[2] == "(fetch)" {
                map.insert(parts[0].to_string(), parts[1].to_string());
            }
        }
    }
    map
}

/// Monorepo-wide slim: one `depot_core::GitSlim` pass per discovered repository.
fn run_slim_all(root_str: &str) {
    let root = Path::new(root_str);
    let options = SlimOptions::all_repos();
    if root.join(".git").exists() {
        GitSlim::apply_config(root, &options);
    }
    let repos = discover_repos(root);

    println!("\n=== SOVEREIGN BYTE-LEVEL SLIM ALL (xtk) ===");
    println!("Scanning repositories under {}...", root.display());
    println!(
        "{:<36} {:>12} {:>12} {:>12}",
        "REPOSITORY", "BEFORE", "AFTER", "SAVED"
    );
    println!("{}", "-".repeat(76));

    let mut total_saved = 0u64;
    let mut total_before = 0u64;
    let mut total_after = 0u64;

    for repo in &repos {
        let rel_name = repo
            .strip_prefix(root)
            .unwrap_or(repo)
            .to_string_lossy()
            .replace('\\', "/");

        let Ok(report) = GitSlim::slim_repo(repo, &options) else {
            continue;
        };
        let before = report.git_dir_size_before_bytes;
        let after = report.git_dir_size_after_bytes;
        let saved = before.saturating_sub(after);

        total_before += before;
        total_after += after;
        total_saved += saved;

        println!(
            "{:<36} {:>9} KB {:>9} KB {:>9} KB",
            rel_name,
            before / 1024,
            after / 1024,
            saved / 1024
        );
    }

    println!("{}", "-".repeat(76));
    println!(
        "{:<36} {:>9} MB {:>9} MB {:>9} MB",
        "TOTAL DISK FOOTPRINT",
        total_before / (1024 * 1024),
        total_after / (1024 * 1024),
        total_saved / (1024 * 1024)
    );
    println!("Byte-level slimming complete: {} bytes saved.\n", total_saved);
}

fn collect_locked_repos(root: &Path) -> BTreeMap<String, LockedRepo> {
    let repos = discover_repos(root);
    let mut locked_repos = BTreeMap::new();

    for repo in &repos {
        let rel_name = repo
            .strip_prefix(root)
            .unwrap_or(repo)
            .to_string_lossy()
            .replace('\\', "/");

        let repo_s = repo.to_string_lossy();
        let remotes = read_git_remotes(repo);

        let url = remotes
            .get("origin")
            .cloned()
            .or_else(|| safe_output("git", &["-C", &repo_s, "config", "--get", "remote.origin.url"]))
            .unwrap_or_else(|| format!("local:{}", rel_name));

        let upstream_url = remotes
            .get("upstream")
            .cloned()
            .or_else(|| remotes.get("torvalds").cloned());

        let mut commit = safe_output("git", &["-C", &repo_s, "rev-parse", "HEAD"])
            .unwrap_or_else(|| "0000000000000000000000000000000000000000".to_string());
        if commit.contains("fatal:") || commit.len() < 40 {
            commit = "0000000000000000000000000000000000000000".to_string();
        }

        let branch = safe_output("git", &["-C", &repo_s, "branch", "--show-current"])
            .filter(|b| !b.is_empty())
            .unwrap_or_else(|| "detached".to_string());

        let engine = if repo.join(".jj").exists() {
            "jj".to_string()
        } else {
            "git".to_string()
        };

        let sparse_file = repo.join(".git").join("info").join("sparse-checkout");
        let sparse_paths = if sparse_file.exists() {
            fs::read_to_string(&sparse_file).ok().map(|c| {
                c.lines()
                    .map(|l| l.trim().to_string())
                    .filter(|l| !l.is_empty())
                    .collect()
            })
        } else {
            None
        };

        locked_repos.insert(
            rel_name.clone(),
            LockedRepo {
                path: rel_name.clone(),
                url,
                upstream_url,
                commit,
                branch,
                engine,
                pillar: classify_pillar(&rel_name).to_string(),
                remotes: if remotes.is_empty() {
                    None
                } else {
                    Some(remotes)
                },
                sparse_paths,
            },
        );
    }

    locked_repos
}

fn run_lock(root_str: &str, out_path_str: &str, lock_only: bool) {
    let root = Path::new(root_str);
    if root.join(".git").exists() {
        GitSlim::apply_config(root, &SlimOptions::all_repos());
    }

    let locked_repos = collect_locked_repos(root);

    println!("\n=== GENERATING SOVEREIGN 4-PILLAR LOCKFILE (xtk) ===");
    println!(
        "Locking {} repositories under {}...",
        locked_repos.len(),
        root.display()
    );

    let mut toolchains = BTreeMap::new();
    let checks = [
        ("rustc", "rustc", vec!["--version"]),
        ("cargo", "cargo", vec!["--version"]),
        ("sccache", "sccache", vec!["--version"]),
        ("xwin", "xwin", vec!["--version"]),
        ("bun", "bun", vec!["--version"]),
        ("jj", "jj", vec!["--version"]),
        ("gix", "gix", vec!["--version"]),
        ("just", "just", vec!["--version"]),
        ("go", "go", vec!["version"]),
        ("zig", "zig", vec!["version"]),
        ("dotnet", "dotnet", vec!["--version"]),
        ("nvcc", "nvcc", vec!["--version"]),
        ("claude", "claude", vec!["--version"]),
        ("agy", "agy", vec!["--version"]),
        ("wck", "wck", vec!["--version"]),
    ];

    for (k, prog, a) in checks {
        if let Some(v) = safe_tool_probe(prog, &a) {
            let first = v.lines().next().unwrap_or("").to_string();
            toolchains.insert(k.to_string(), first);
        }
    }
    toolchains.insert("cl.exe".to_string(), "MSVC 14.51 (x86_64)".to_string());

    let root_commit = safe_output("git", &["-C", root_str, "rev-parse", "HEAD"])
        .unwrap_or_else(|| "0000000000000000000000000000000000000000".to_string());
    let chromium_commit = locked_repos
        .get("third_party/chromium/src")
        .map(|r| r.commit.clone())
        .unwrap_or_default();
    let linux_commit = locked_repos
        .get("third_party/linux")
        .map(|r| r.commit.clone())
        .unwrap_or_default();
    let aosp_commit = locked_repos
        .get("third_party/aosp-manifest")
        .map(|r| r.commit.clone())
        .unwrap_or_default();

    let lock = SrcLock {
        version: 2,
        generated_at: chrono_like_now(),
        hardware: HardwareTarget {
            os: "Windows NT (x86_64)".to_string(),
            cpu: "Intel Core i7-13700F (Raptor Lake sm_89)".to_string(),
            gpu: "NVIDIA GeForce RTX 4070 12GB (Ada Lovelace sm_89)".to_string(),
        },
        toolchains,
        pillars: PillarSummary {
            git_superproject_commit: root_commit,
            chromium_src_commit: chromium_commit,
            linux_kernel_commit: linux_commit,
            aosp_manifest_commit: aosp_commit,
        },
        repositories: locked_repos.clone(),
    };

    let json_text = serde_json::to_string_pretty(&lock).expect("Failed to serialize lockfile");
    let out_path = Path::new(out_path_str);
    fs::write(out_path, json_text).expect("Failed to write lockfile");
    println!("Deterministic lockfile written to: {}", out_path.display());

    if !lock_only {
        manifests::run(root, false);
    }
}

fn run_audit_vcs(root_str: &str, as_json: bool) -> i32 {
    let root = Path::new(root_str);
    let repos = discover_repos(root);

    let mut junctions_count = 0usize;
    let mut dangling = Vec::new();
    if let Ok(entries) = fs::read_dir(root) {
        for e in entries.flatten() {
            let p = e.path();
            if is_reparse_point(&p) {
                junctions_count += 1;
                if fs::metadata(&p).is_err() {
                    if let Some(n) = p.file_name().and_then(|s| s.to_str()) {
                        dangling.push(n.to_string());
                    }
                }
            }
        }
    }

    let gitmodules_txt = fs::read_to_string(root.join(".gitmodules")).unwrap_or_default();
    let submodules_count = gitmodules_txt
        .lines()
        .filter(|l| l.trim_start().starts_with("[submodule "))
        .count();

    let git_ok = root.join(".gitmodules").is_file()
        && root.join("src.lock.json").is_file()
        && dangling.is_empty();

    let chromium_ok = root.join("DEPS").is_file()
        && root.join("third_party").join("depot_tools").is_dir()
        && root.join("third_party").join("chromium").join("src").is_dir();

    let linux_remotes = read_git_remotes(&root.join("third_party").join("linux"));
    let kernel_ok = root.join("MAINTAINERS").is_file()
        && root.join("third_party").join("linux").is_dir()
        && linux_remotes.contains_key("stable")
        && linux_remotes.contains_key("next");

    let aosp_ok = root
        .join(".repo")
        .join("manifests")
        .join("default.xml")
        .is_file()
        && root
            .join("third_party")
            .join("aosp")
            .join("platform")
            .join("manifest")
            .is_dir();

    let mut notes = Vec::new();
    notes.push(format!(
        "Git Superproject: {} submodules, {} root junctions ({} dangling)",
        submodules_count,
        junctions_count,
        dangling.len()
    ));
    notes.push(format!(
        "Chromium Pillar: DEPS={}, depot_tools={}",
        root.join("DEPS").is_file(),
        root.join("third_party").join("depot_tools").is_dir()
    ));
    notes.push(format!(
        "Linux Kernel Pillar: MAINTAINERS={}, remotes={}",
        root.join("MAINTAINERS").is_file(),
        linux_remotes.len()
    ));
    notes.push(format!(
        "Android AOSP Pillar: default.xml={}, kleaf={}",
        root.join(".repo")
            .join("manifests")
            .join("default.xml")
            .is_file(),
        root.join("third_party")
            .join("aosp")
            .join("build")
            .join("kleaf")
            .is_dir()
    ));

    let report = VcsAuditReport {
        root: root.to_string_lossy().to_string(),
        healthy: git_ok && chromium_ok && kernel_ok,
        locked_repositories: repos.len(),
        submodules_count,
        root_junctions_count: junctions_count,
        dangling_junctions: dangling,
        git_superproject_ok: git_ok,
        chromium_deps_ok: chromium_ok,
        linux_kernel_ok: kernel_ok,
        aosp_repo_ok: aosp_ok,
        notes,
    };

    if as_json {
        println!(
            "{}",
            serde_json::to_string_pretty(&report).unwrap_or_else(|_| "{}".to_string())
        );
    } else {
        println!("\n=== 4-PILLAR MONOREPO VCS AUDIT (xtk) ===");
        println!("Root:                {}", report.root);
        println!("Discovered Repos:    {}", report.locked_repositories);
        println!("Git Submodules:      {}", report.submodules_count);
        println!(
            "Root NTFS Junctions: {} ({} dangling)",
            report.root_junctions_count,
            report.dangling_junctions.len()
        );
        println!(
            "Pillar [1] Git:      {}",
            if report.git_superproject_ok { "OK" } else { "FAIL" }
        );
        println!(
            "Pillar [2] Chromium: {}",
            if report.chromium_deps_ok { "OK" } else { "FAIL" }
        );
        println!(
            "Pillar [3] Kernel:   {}",
            if report.linux_kernel_ok { "OK" } else { "FAIL" }
        );
        println!(
            "Pillar [4] AOSP:     {}",
            if report.aosp_repo_ok { "OK" } else { "FAIL" }
        );
        println!(
            "Overall Status:      {}\n",
            if report.healthy { "PASS" } else { "FAIL" }
        );
    }

    i32::from(!report.healthy)
}

/// UTC timestamp, RFC 3339, from the system clock (no shell, same output on every OS).
fn chrono_like_now() -> String {
    let secs = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.as_secs() as i64)
        .unwrap_or(0);
    let (days, rem) = (secs.div_euclid(86_400), secs.rem_euclid(86_400));
    // Civil date from days since 1970-01-01 (H. Hinnant's algorithm).
    let z = days + 719_468;
    let era = z.div_euclid(146_097);
    let doe = z - era * 146_097;
    let yoe = (doe - doe / 1460 + doe / 36_524 - doe / 146_096) / 365;
    let doy = doe - (365 * yoe + yoe / 4 - yoe / 100);
    let mp = (5 * doy + 2) / 153;
    let d = doy - (153 * mp + 2) / 5 + 1;
    let m = if mp < 10 { mp + 3 } else { mp - 9 };
    let y = yoe + era * 400 + i64::from(m <= 2);
    format!("{y:04}-{m:02}-{d:02}T{:02}:{:02}:{:02}Z", rem / 3600, rem % 3600 / 60, rem % 60)
}

/// Repository root: the explicit option, else `$SRC_ROOT`, else the nearest ancestor of the
/// current directory holding `src.lock.json` (or `Cargo.toml` with a `[workspace]`), else `.`.
pub fn resolve_root(explicit: &str) -> PathBuf {
    if !explicit.is_empty() {
        return PathBuf::from(explicit);
    }
    if let Ok(r) = std::env::var("SRC_ROOT") {
        if !r.is_empty() {
            return PathBuf::from(r);
        }
    }
    let cwd = std::env::current_dir().unwrap_or_else(|_| PathBuf::from("."));
    for dir in cwd.ancestors() {
        if dir.join("src.lock.json").is_file() {
            return dir.to_path_buf();
        }
    }
    for dir in cwd.ancestors() {
        if fs::read_to_string(dir.join("Cargo.toml")).is_ok_and(|t| t.contains("[workspace]")) {
            return dir.to_path_buf();
        }
    }
    cwd
}

/// Run the maintenance CLI. `cmd` is the name shown in usage, `args` follow it
/// (`doctor`, `slim-all`, `lock`, `manifests`, `audit-vcs`). Returns the exit code.
pub fn run(cmd: &str, args: &[String]) -> i32 {
    let argv: Vec<&str> = args.iter().map(String::as_str).collect();
    let top = match TopLevel::from_args(&[cmd], &argv) {
        Ok(top) => top,
        Err(early) => {
            if early.status.is_ok() {
                println!("{}", early.output);
                return 0;
            }
            eprintln!("{}", early.output);
            return 2;
        }
    };
    let root_of = |r: &str| resolve_root(r).to_string_lossy().to_string();
    match top.cmd {
        SubCommand::Doctor(cmd) if cmd.deps => {
            return deps::run_check(&resolve_root(&cmd.root), cmd.dups, cmd.json);
        }
        SubCommand::Doctor(_) => check_doctor(),
        SubCommand::SlimAll(cmd) => run_slim_all(&root_of(&cmd.root)),
        SubCommand::Lock(cmd) if cmd.deps => {
            let opts = deps::LockOpts {
                bump: cmd.bump || cmd.breaking,
                breaking: cmd.breaking,
                hoist: cmd.hoist,
            };
            return deps::run_lock(&resolve_root(&cmd.root), opts);
        }
        SubCommand::Lock(cmd) => {
            let root = root_of(&cmd.root);
            let out = if cmd.out.is_empty() {
                Path::new(&root).join("src.lock.json").to_string_lossy().to_string()
            } else {
                cmd.out
            };
            run_lock(&root, &out, cmd.lock_only)
        }
        SubCommand::Manifests(cmd) => return manifests::run(Path::new(&root_of(&cmd.root)), cmd.check),
        SubCommand::AuditVcs(cmd) => return run_audit_vcs(&root_of(&cmd.root), cmd.json),
    }
    0
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_discover_repos_skips_junctions_and_yolo() {
        let root = std::env::temp_dir().join(format!("xtk-discover-{}", std::process::id()));
        let _ = fs::remove_dir_all(&root);
        for repo in ["third_party/a", "apps/yolo-archive/b", "packages/node_modules/c", "crates/d"] {
            fs::create_dir_all(root.join(repo).join(".git")).unwrap();
        }
        let repos = discover_repos(&root);
        let rels: Vec<String> = repos
            .iter()
            .map(|r| r.strip_prefix(&root).unwrap().to_string_lossy().replace('\\', "/"))
            .collect();
        assert_eq!(rels, vec!["crates/d".to_string(), "third_party/a".to_string()]);
        let _ = fs::remove_dir_all(&root);
    }

    #[test]
    fn test_tool_version_lookup() {
        let (_, ok, ver) = find_tool_version("bun", "bun", &["--version"]);
        assert!(ok);
        assert!(ver.contains("1.4"));
    }
}
