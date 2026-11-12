use std::path::{Path, PathBuf};
use std::process::Command;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SlimOptions {
    pub enable_fsmonitor: bool,
    pub enable_untracked_cache: bool,
    pub enable_many_files: bool,
    pub index_version_4: bool,
    pub write_commit_graph: bool,
    pub write_multi_pack_index: bool,
    pub repack_pack_reuse: bool,
    pub register_scalar: bool,
    /// protocol v2, parallel fetch, 8 submodule fetch jobs, rerere.
    #[serde(default)]
    pub network_tuning: bool,
    /// `git reflog expire --expire=now --all` then `git prune --expire=now`.
    #[serde(default)]
    pub prune_unreachable: bool,
}

impl Default for SlimOptions {
    fn default() -> Self {
        Self {
            enable_fsmonitor: true,
            enable_untracked_cache: true,
            enable_many_files: true,
            index_version_4: true,
            write_commit_graph: true,
            write_multi_pack_index: true,
            repack_pack_reuse: true,
            register_scalar: true,
            network_tuning: false,
            prune_unreachable: false,
        }
    }
}

impl SlimOptions {
    /// Preset for slimming every repository of the monorepo in one pass (`ay git slim --all`):
    /// no per-repo scalar registration, network tuning on, unreachable objects pruned.
    pub fn all_repos() -> Self {
        Self {
            register_scalar: false,
            network_tuning: true,
            prune_unreachable: true,
            ..Self::default()
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SlimReport {
    pub repo_path: PathBuf,
    pub git_dir_size_before_bytes: u64,
    pub git_dir_size_after_bytes: u64,
    pub scalar_registered: bool,
    pub optimizations_applied: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CloneOptions {
    pub url: String,
    pub dest: PathBuf,
    pub branch: Option<String>,
    pub depth: Option<u32>,
    pub blobless: bool,
    pub treeless: bool,
    pub no_tags: bool,
    pub single_branch: bool,
    pub sparse_paths: Vec<String>,
}

impl Default for CloneOptions {
    fn default() -> Self {
        Self {
            url: String::new(),
            dest: PathBuf::new(),
            branch: None,
            depth: None,
            blobless: true,
            treeless: false,
            no_tags: true,
            single_branch: true,
            sparse_paths: Vec::new(),
        }
    }
}

pub struct GitSlim;

impl GitSlim {
    pub fn measure_dir_size(path: &Path) -> u64 {
        walkdir::WalkDir::new(path)
            .into_iter()
            .filter_map(|e| e.ok())
            .filter_map(|e| e.metadata().ok())
            .filter(|m| m.is_file())
            .map(|m| m.len())
            .sum()
    }

    /// Apply the Scalar-grade `git config` keys selected by `options`; returns what was set.
    pub fn apply_config(repo_path: &Path, options: &SlimOptions) -> Vec<String> {
        let net = options.network_tuning;
        let config_pairs = [
            (options.enable_fsmonitor, "core.fsmonitor", "true"),
            (options.enable_untracked_cache, "core.untrackedCache", "true"),
            (options.enable_many_files, "feature.manyFiles", "true"),
            (options.index_version_4, "index.version", "4"),
            (options.write_commit_graph, "fetch.writeCommitGraph", "true"),
            (options.write_commit_graph, "gc.writeCommitGraph", "true"),
            (true, "maintenance.auto", "true"),
            (options.repack_pack_reuse, "pack.allowPackReuse", "multi"),
            (net, "protocol.version", "2"),
            (net, "fetch.parallel", "0"),
            (net, "submodule.fetchJobs", "8"),
            (net, "rerere.enabled", "true"),
        ];

        let mut applied = Vec::new();
        for (enabled, key, val) in config_pairs {
            if !enabled {
                continue;
            }
            let ok = Command::new("git")
                .current_dir(repo_path)
                .args(["config", key, val])
                .output()
                .is_ok_and(|o| o.status.success());
            if ok {
                applied.push(format!("git config {} = {}", key, val));
            }
        }
        applied
    }

    pub fn slim_repo(repo_path: &Path, options: &SlimOptions) -> Result<SlimReport, String> {
        let git_dir = repo_path.join(".git");
        if !git_dir.exists() {
            return Err(format!("Not a git repository: {}", repo_path.display()));
        }

        let size_before = Self::measure_dir_size(&git_dir);
        let mut applied = Vec::new();
        let mut scalar_registered = false;

        // Try scalar registration first if requested
        if options.register_scalar {
            let status = Command::new("scalar")
                .args(["register", repo_path.to_str().unwrap_or(".")])
                .status();
            if let Ok(st) = status {
                if st.success() {
                    scalar_registered = true;
                    applied.push("scalar register (automated background maintenance)".to_string());
                }
            }
        }

        // Configure high-performance git engine settings (Scalar-grade flags)
        applied.extend(Self::apply_config(repo_path, options));

        if options.prune_unreachable {
            for args in [&["reflog", "expire", "--expire=now", "--all"][..], &["prune", "--expire=now"][..]] {
                let ok = Command::new("git")
                    .current_dir(repo_path)
                    .args(args)
                    .output()
                    .is_ok_and(|o| o.status.success());
                if ok {
                    applied.push(format!("git {}", args.join(" ")));
                }
            }
        }

        // Write reachable commit graph
        if options.write_commit_graph {
            let out = Command::new("git")
                .current_dir(repo_path)
                .args(["commit-graph", "write", "--reachable", "--changed-paths"])
                .status();
            if let Ok(st) = out {
                if st.success() {
                    applied.push("commit-graph write --reachable --changed-paths".to_string());
                }
            }
        }

        // Write multi-pack-index
        if options.write_multi_pack_index {
            let out = Command::new("git")
                .current_dir(repo_path)
                .args(["multi-pack-index", "write"])
                .status();
            if let Ok(st) = out {
                if st.success() {
                    applied.push("multi-pack-index write".to_string());
                }
            }
        }

        let size_after = Self::measure_dir_size(&git_dir);

        Ok(SlimReport {
            repo_path: repo_path.to_path_buf(),
            git_dir_size_before_bytes: size_before,
            git_dir_size_after_bytes: size_after,
            scalar_registered,
            optimizations_applied: applied,
        })
    }

    pub fn clone_minimal(opts: &CloneOptions) -> Result<SlimReport, String> {
        let mut args = vec!["clone".to_string()];

        if opts.blobless {
            args.push("--filter=blob:none".to_string());
        } else if opts.treeless {
            args.push("--filter=tree:0".to_string());
        }

        if opts.no_tags {
            args.push("--no-tags".to_string());
        }

        if opts.single_branch {
            args.push("--single-branch".to_string());
        }

        if let Some(ref branch) = opts.branch {
            args.push("-b".to_string());
            args.push(branch.clone());
        }

        if let Some(depth) = opts.depth {
            args.push(format!("--depth={}", depth));
        }

        if !opts.sparse_paths.is_empty() {
            args.push("--sparse".to_string());
        }

        args.push(opts.url.clone());
        args.push(opts.dest.to_string_lossy().to_string());

        let status = Command::new("git")
            .args(&args)
            .status()
            .map_err(|e| format!("Failed to run git clone: {}", e))?;

        if !status.success() {
            return Err("git clone failed".to_string());
        }

        // If sparse paths were specified, set them
        if !opts.sparse_paths.is_empty() {
            let mut sparse_args = vec!["sparse-checkout", "set"];
            for p in &opts.sparse_paths {
                sparse_args.push(p.as_str());
            }
            let _ = Command::new("git")
                .current_dir(&opts.dest)
                .args(&sparse_args)
                .status();
        }

        // Apply slim optimizations
        Self::slim_repo(&opts.dest, &SlimOptions::default())
    }
}
