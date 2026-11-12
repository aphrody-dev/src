use std::path::{Path, PathBuf};
use std::process::Command;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorktreeInfo {
    pub path: PathBuf,
    pub head_commit: String,
    pub branch: Option<String>,
    pub is_bare: bool,
    pub is_locked: bool,
    pub is_prunable: bool,
}

pub struct WorktreeManager;

impl WorktreeManager {
    /// `git worktree list` on gitoxide: the main worktree, then the linked ones.
    pub fn list(repo_path: &Path) -> Result<Vec<WorktreeInfo>, String> {
        let repo = gix::discover(repo_path).map_err(|e| format!("Failed to open repository: {e}"))?;
        let main = repo.main_repo().map_err(|e| format!("Failed to open main worktree: {e}"))?;
        let describe = |r: &gix::Repository| -> (String, Option<String>) {
            let head = r.head_id().map(|id| id.to_string()).unwrap_or_default();
            let branch = r
                .head_name()
                .ok()
                .flatten()
                .map(|n| n.as_bstr().to_string().trim_start_matches("refs/heads/").to_string());
            (head, branch)
        };
        let mut worktrees = Vec::new();
        let (head, branch) = describe(&main);
        worktrees.push(WorktreeInfo {
            path: main.work_dir().map(Path::to_path_buf).unwrap_or_else(|| main.git_dir().to_path_buf()),
            head_commit: head,
            branch,
            is_bare: main.is_bare(),
            is_locked: false,
            is_prunable: false,
        });
        for proxy in main.worktrees().map_err(|e| format!("Failed to list worktrees: {e}"))? {
            let is_locked = proxy.is_locked();
            let base = proxy.base().ok();
            let is_prunable = base.as_ref().is_none_or(|b| !b.exists());
            let (head, branch) = match proxy.into_repo_with_possibly_inaccessible_worktree() {
                Ok(r) => describe(&r),
                Err(_) => (String::new(), None),
            };
            worktrees.push(WorktreeInfo {
                path: base.unwrap_or_default(),
                head_commit: head,
                branch,
                is_bare: false,
                is_locked,
                is_prunable,
            });
        }
        Ok(worktrees)
    }

    pub fn add(
        repo_path: &Path,
        dest_path: &Path,
        branch_name: &str,
        create_new: bool,
    ) -> Result<WorktreeInfo, String> {
        let mut args = vec!["worktree".to_string(), "add".to_string()];

        if create_new {
            args.push("-b".to_string());
            args.push(branch_name.to_string());
        }

        args.push(dest_path.to_string_lossy().to_string());

        if !create_new {
            args.push(branch_name.to_string());
        }

        let output = Command::new("git")
            .current_dir(repo_path)
            .args(&args)
            .output()
            .map_err(|e| format!("Failed to run git worktree add: {}", e))?;

        if !output.status.success() {
            let err = String::from_utf8_lossy(&output.stderr);
            return Err(format!("git worktree add failed: {}", err));
        }

        let head = crate::gitx::rev_parse(dest_path, "HEAD")?;

        Ok(WorktreeInfo {
            path: dest_path.to_path_buf(),
            head_commit: head,
            branch: Some(branch_name.to_string()),
            is_bare: false,
            is_locked: false,
            is_prunable: false,
        })
    }

    pub fn remove(repo_path: &Path, worktree_path: &Path, force: bool) -> Result<(), String> {
        let mut args = vec!["worktree", "remove"];
        if force {
            args.push("--force");
        }
        let path_str = worktree_path.to_string_lossy();
        args.push(&path_str);

        let output = Command::new("git")
            .current_dir(repo_path)
            .args(&args)
            .output()
            .map_err(|e| format!("Failed to remove worktree: {}", e))?;

        if !output.status.success() {
            let err = String::from_utf8_lossy(&output.stderr);
            return Err(format!("git worktree remove failed: {}", err));
        }

        Ok(())
    }

    pub fn prune(repo_path: &Path) -> Result<(), String> {
        let output = Command::new("git")
            .current_dir(repo_path)
            .args(["worktree", "prune"])
            .output()
            .map_err(|e| format!("Failed to prune worktrees: {}", e))?;

        if !output.status.success() {
            let err = String::from_utf8_lossy(&output.stderr);
            return Err(format!("git worktree prune failed: {}", err));
        }

        Ok(())
    }
}
