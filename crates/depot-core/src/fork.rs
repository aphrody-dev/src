use serde::{Deserialize, Serialize};
use std::path::Path;
use std::process::Command;

use crate::gitx;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ForkStatus {
    pub current_branch: String,
    pub origin_url: Option<String>,
    pub upstream_url: Option<String>,
    pub ahead_count: u32,
    pub behind_count: u32,
    pub has_diverged: bool,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum SyncStrategy {
    FastForwardOnly,
    Rebase,
    Merge,
}

pub struct ForkManager;

impl ForkManager {
    /// Branch, remotes and ahead/behind counts, read with gitoxide.
    pub fn get_status(repo_path: &Path) -> Result<ForkStatus, String> {
        let current_branch = gitx::current_branch(repo_path)?.unwrap_or_else(|| "HEAD".into());
        let remotes = gitx::remotes(repo_path)?;
        let url_of = |n: &str| {
            remotes
                .iter()
                .find(|(name, _)| name == n)
                .map(|(_, u)| u.clone())
        };
        let (origin_url, upstream_url) = (url_of("origin"), url_of("upstream"));

        // Ahead / behind against upstream if configured, else origin.
        let target_remote = if upstream_url.is_some() {
            "upstream"
        } else {
            "origin"
        };
        let (behind, ahead) = gitx::left_right_count(
            repo_path,
            &format!("{target_remote}/{current_branch}"),
            "HEAD",
        )
        .unwrap_or((0, 0));
        let (ahead_count, behind_count) = (ahead as u32, behind as u32);

        Ok(ForkStatus {
            current_branch,
            origin_url,
            upstream_url,
            ahead_count,
            behind_count,
            has_diverged: ahead_count > 0 && behind_count > 0,
        })
    }

    pub fn set_upstream(repo_path: &Path, url: &str) -> Result<(), String> {
        let exists = gitx::remote_url(repo_path, "upstream")?.is_some();

        let status = if exists {
            Command::new("git")
                .current_dir(repo_path)
                .args(["remote", "set-url", "upstream", url])
                .status()
        } else {
            Command::new("git")
                .current_dir(repo_path)
                .args(["remote", "add", "upstream", url])
                .status()
        };

        match status {
            Ok(st) if st.success() => Ok(()),
            _ => Err("Failed to set upstream remote".to_string()),
        }
    }

    pub fn sync_upstream(
        repo_path: &Path,
        branch: Option<&str>,
        strategy: SyncStrategy,
    ) -> Result<String, String> {
        let branch_name = match branch {
            Some(b) => b.to_string(),
            None => gitx::current_branch(repo_path)?.unwrap_or_else(|| "HEAD".into()),
        };

        // Fetch upstream
        let fetch_st = Command::new("git")
            .current_dir(repo_path)
            .args(["fetch", "upstream", &branch_name])
            .status()
            .map_err(|e| format!("Fetch failed: {}", e))?;

        if !fetch_st.success() {
            return Err(format!("Failed to fetch upstream/{}", branch_name));
        }

        let upstream_ref = format!("upstream/{}", branch_name);

        match strategy {
            SyncStrategy::FastForwardOnly => {
                let merge_out = Command::new("git")
                    .current_dir(repo_path)
                    .args(["merge", "--ff-only", &upstream_ref])
                    .output()
                    .map_err(|e| format!("Merge failed: {}", e))?;
                if !merge_out.status.success() {
                    return Err(String::from_utf8_lossy(&merge_out.stderr).to_string());
                }
                Ok(String::from_utf8_lossy(&merge_out.stdout).to_string())
            }
            SyncStrategy::Rebase => {
                let rebase_out = Command::new("git")
                    .current_dir(repo_path)
                    .args(["rebase", &upstream_ref])
                    .output()
                    .map_err(|e| format!("Rebase failed: {}", e))?;
                if !rebase_out.status.success() {
                    return Err(String::from_utf8_lossy(&rebase_out.stderr).to_string());
                }
                Ok(String::from_utf8_lossy(&rebase_out.stdout).to_string())
            }
            SyncStrategy::Merge => {
                let merge_out = Command::new("git")
                    .current_dir(repo_path)
                    .args(["merge", &upstream_ref])
                    .output()
                    .map_err(|e| format!("Merge failed: {}", e))?;
                if !merge_out.status.success() {
                    return Err(String::from_utf8_lossy(&merge_out.stderr).to_string());
                }
                Ok(String::from_utf8_lossy(&merge_out.stdout).to_string())
            }
        }
    }
}
