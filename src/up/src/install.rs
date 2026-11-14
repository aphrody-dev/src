//! Install or update one tool. Everything lands under the user's home (`bin_dir`,
//! `tools_dir`, Bun's global directory, rustup's `~/.cargo`); system directories are refused.

use crate::archive;
use crate::fetch;
use crate::manifest::{Layout, Manifest, SourceKind, Tool};
use crate::probe::{self, Probe, State};
use std::path::{Path, PathBuf};
use std::process::Command;

/// Credentials and context an install may need. Values are never printed.
#[derive(Debug, Default, Clone)]
pub struct Context {
    pub github_token: Option<String>,
    pub dry_run: bool,
}

/// Refuse anything under the Windows directory or the usual system prefixes.
pub fn is_system_dir(path: &Path) -> bool {
    let s = path
        .to_string_lossy()
        .replace('\\', "/")
        .to_ascii_lowercase();
    let windir = std::env::var("WINDIR")
        .unwrap_or_else(|_| "C:\\Windows".into())
        .replace('\\', "/")
        .to_ascii_lowercase();
    let unix_system = [
        "/usr/", "/bin/", "/sbin/", "/lib/", "/etc/", "/opt/", "/system/",
    ];
    s.starts_with(&format!("{windir}/"))
        || s == windir
        || s.contains("/program files")
        || unix_system
            .iter()
            .any(|p| s.starts_with(p) || format!("{s}/") == *p)
}

fn exe_name(name: &str) -> String {
    format!("{name}{}", std::env::consts::EXE_SUFFIX)
}

/// Write `data` to `dest` atomically enough for a running executable: the current file is
/// renamed to `.old` first (Windows cannot overwrite a running binary).
pub fn place_file(dest: &Path, data: &[u8], executable: bool) -> Result<(), String> {
    if is_system_dir(dest) {
        return Err(format!(
            "refusing to write into a system directory: {}",
            dest.display()
        ));
    }
    if let Some(parent) = dest.parent() {
        std::fs::create_dir_all(parent).map_err(|e| format!("{}: {e}", parent.display()))?;
    }
    let tmp = dest.with_extension("ay-new");
    std::fs::write(&tmp, data).map_err(|e| format!("{}: {e}", tmp.display()))?;
    #[cfg(unix)]
    if executable {
        use std::os::unix::fs::PermissionsExt;
        std::fs::set_permissions(&tmp, std::fs::Permissions::from_mode(0o755))
            .map_err(|e| e.to_string())?;
    }
    #[cfg(not(unix))]
    let _ = executable;
    if dest.exists() {
        let old = dest.with_extension("ay-old");
        let _ = std::fs::remove_file(&old);
        std::fs::rename(dest, &old).map_err(|e| format!("move aside {}: {e}", dest.display()))?;
        let _ = std::fs::remove_file(&old);
    }
    std::fs::rename(&tmp, dest).map_err(|e| format!("{}: {e}", dest.display()))
}

/// Download the platform asset and check it against the pinned or published sha256.
/// Returns the bytes, the asset file name and whether a checksum was verified.
fn download(tool: &Tool, platform: &str, ctx: &Context) -> Result<(Vec<u8>, String, bool), String> {
    let asset = tool
        .asset(platform)
        .ok_or_else(|| format!("{}: no asset for {platform}", tool.name))?;
    let url = tool
        .download_url(platform)
        .ok_or_else(|| format!("{}: no download URL", tool.name))?;
    let file_name = asset.rsplit('/').next().unwrap_or(&asset).to_string();
    let data = match (tool.source, tool.repo.as_deref()) {
        (SourceKind::Github, Some(repo)) => {
            fetch::github_asset(repo, &tool.tag(), &asset, ctx.github_token.as_deref())?
        }
        _ => fetch::get(&url, &[]).map_err(|(_, m)| m)?,
    };
    let expected = match (tool.sha256.get(platform), &tool.checksum) {
        (Some(pinned), _) => Some(pinned.to_ascii_lowercase()),
        (None, Some(template)) => {
            let target = crate::manifest::expand(template, &tool.version)
                .replace("{asset}", &file_name)
                .replace("{url}", &url);
            let text = if target.contains("://") {
                fetch::get(&target, &[]).map_err(|(_, m)| m)?
            } else {
                let repo = tool.repo.as_deref().ok_or("checksum asset without repo")?;
                fetch::github_asset(repo, &tool.tag(), &target, ctx.github_token.as_deref())?
            };
            let text = String::from_utf8_lossy(&text);
            Some(
                fetch::checksum_for(&text, &file_name)
                    .ok_or_else(|| format!("{}: {file_name} not listed in {target}", tool.name))?,
            )
        }
        (None, None) => None,
    };
    if let Some(hash) = &expected {
        fetch::verify(&data, hash, &file_name)?;
    }
    Ok((data, file_name, expected.is_some()))
}

/// Link `target` as `link` (symlink; on Windows falls back to the PATH hint when symlinks
/// need Developer Mode).
fn link(target: &Path, link: &Path) -> Result<(), String> {
    let _ = std::fs::remove_file(link);
    #[cfg(unix)]
    let res = std::os::unix::fs::symlink(target, link);
    #[cfg(windows)]
    let res = std::os::windows::fs::symlink_file(target, link);
    res.map_err(|e| {
        format!(
            "link {} -> {}: {e}; add {} to PATH instead",
            link.display(),
            target.display(),
            target
                .parent()
                .map(|p| p.display().to_string())
                .unwrap_or_default()
        )
    })
}

/// Resolve `bin/gcloud` inside a tree to the file that exists for this OS
/// (`gcloud.exe`, `gcloud.cmd` on Windows).
fn tree_bin(root: &Path, rel: &str) -> Option<PathBuf> {
    let base = root.join(rel);
    let candidates: &[&str] = if cfg!(windows) {
        &[".exe", ".cmd", ".bat", ""]
    } else {
        &[""]
    };
    candidates
        .iter()
        .map(|ext| PathBuf::from(format!("{}{ext}", base.display())))
        .find(|p| p.is_file())
}

fn install_archive(
    tool: &Tool,
    m: &Manifest,
    platform: &str,
    ctx: &Context,
) -> Result<String, String> {
    let (data, file_name, verified) = download(tool, platform, ctx)?;
    let mut entries = archive::entries(&file_name, &data)?;
    let bin_dir = m.bin_dir();
    let mut placed = Vec::new();
    match tool.layout {
        Layout::Bin => {
            for bin in &tool.bin {
                let exe = exe_name(bin);
                let entry = if archive::kind_of(&file_name) == archive::Kind::Raw {
                    entries.first()
                } else {
                    archive::find_executable(&entries, &exe)
                };
                let entry = entry.ok_or_else(|| format!("{file_name}: no {exe} inside"))?;
                let dest = bin_dir.join(&exe);
                place_file(&dest, &entry.data, true)?;
                placed.push(dest.display().to_string());
            }
        }
        Layout::Tree => {
            archive::strip_common_root(&mut entries);
            let root = m.tools_dir().join(&tool.name).join(&tool.version);
            if is_system_dir(&root) {
                return Err(format!(
                    "refusing to unpack into a system directory: {}",
                    root.display()
                ));
            }
            for e in &entries {
                let exec = e.mode.is_some_and(|m| m & 0o111 != 0);
                place_file(&root.join(&e.path), &e.data, exec)?;
            }
            for bin in &tool.bin {
                let target = tree_bin(&root, bin)
                    .ok_or_else(|| format!("{}: {bin} missing after unpack", tool.name))?;
                let name = target.file_name().map(|n| n.to_owned()).unwrap_or_default();
                let dest = bin_dir.join(name);
                std::fs::create_dir_all(&bin_dir).map_err(|e| e.to_string())?;
                if crate::shim::needed(&target) {
                    crate::shim::write(&target, &dest)?;
                } else {
                    let _ = std::fs::remove_file(crate::shim::shim_file(&dest));
                    link(&target, &dest)?;
                }
                placed.push(format!("{} -> {}", dest.display(), target.display()));
            }
        }
    }
    let check = if verified {
        "sha256 ok"
    } else {
        "no checksum published"
    };
    Ok(format!("{} ({check})", placed.join(", ")))
}

fn run_status(mut cmd: Command, what: &str) -> Result<(), String> {
    let status = cmd.status().map_err(|e| format!("{what}: {e}"))?;
    if status.success() {
        Ok(())
    } else {
        Err(format!("{what}: exit {}", status.code().unwrap_or(-1)))
    }
}

fn install_bun(tool: &Tool, m: &Manifest) -> Result<String, String> {
    let bun = probe::which("bun", &m.bin_dir())
        .ok_or("bun is not installed (install it first: ay up bun)")?;
    let package = tool.package.as_deref().ok_or("no package")?;
    let spec = format!("{package}@{}", tool.version);
    let mut cmd = Command::new(bun);
    cmd.args(["add", "--global", &spec]);
    run_status(cmd, &format!("bun add --global {spec}"))?;
    Ok(format!("bun global {spec}"))
}

fn install_with_installer(
    tool: &Tool,
    m: &Manifest,
    platform: &str,
    ctx: &Context,
    existing: bool,
) -> Result<String, String> {
    if let Some(update) = tool.update.as_ref().filter(|_| existing) {
        let (head, rest) = update.split_first().ok_or("empty update command")?;
        let program = probe::which(head, &m.bin_dir()).unwrap_or_else(|| PathBuf::from(head));
        let mut cmd = Command::new(program);
        cmd.args(rest);
        run_status(cmd, &update.join(" "))?;
        return Ok(update.join(" "));
    }
    let (data, file_name, verified) = download(tool, platform, ctx)?;
    let dir = std::env::temp_dir().join(format!("ay-up-{}-{}", tool.name, std::process::id()));
    let path = dir.join(&file_name);
    place_file(&path, &data, true)?;
    let mut cmd = Command::new(&path);
    cmd.args(&tool.args);
    let result = run_status(cmd, &file_name);
    let _ = std::fs::remove_dir_all(&dir);
    result?;
    Ok(format!(
        "{file_name} {} ({})",
        tool.args.join(" "),
        if verified {
            "sha256 ok"
        } else {
            "no checksum published"
        }
    ))
}

/// Let `ubi` pick and unpack the release asset for this OS/arch at the pinned tag.
fn install_ubi(tool: &Tool, m: &Manifest, ctx: &Context) -> Result<String, String> {
    let repo = tool.repo.as_deref().ok_or("no repo")?;
    let bin_dir = m.bin_dir();
    if is_system_dir(&bin_dir) {
        return Err(format!(
            "refusing to write into a system directory: {}",
            bin_dir.display()
        ));
    }
    std::fs::create_dir_all(&bin_dir).map_err(|e| format!("{}: {e}", bin_dir.display()))?;
    let tag = tool.tag();
    let runtime = tokio::runtime::Builder::new_current_thread()
        .enable_all()
        .build()
        .map_err(|e| format!("tokio runtime: {e}"))?;
    let mut placed = Vec::new();
    for exe in &tool.bin {
        let file = exe_name(exe);
        let mut builder = ubi::UbiBuilder::new()
            .project(repo)
            .tag(&tag)
            .exe(exe)
            .rename_exe_to(&file)
            .install_dir(&bin_dir);
        if let Some(matching) = tool.matching.get(std::env::consts::OS) {
            builder = builder.matching(matching);
        }
        if let Some(token) = &ctx.github_token {
            builder = builder.token(token);
        }
        let mut ubi = builder.build().map_err(|e| format!("{}: {e}", tool.name))?;
        runtime
            .block_on(ubi.install_binary())
            .map_err(|e| format!("{} {tag}: {e:#}", tool.name))?;
        placed.push(bin_dir.join(&file).display().to_string());
    }
    Ok(format!(
        "{} (ubi {repo} {tag}, no checksum verification)",
        placed.join(", ")
    ))
}

/// Bring one tool to its pinned version. `probe` is its current state.
pub fn install(
    tool: &Tool,
    m: &Manifest,
    platform: &str,
    probe: &Probe,
    ctx: &Context,
) -> Result<String, String> {
    if !probe.state.needs_action() {
        return Ok("nothing to do".into());
    }
    if ctx.dry_run {
        let how = match tool.source {
            SourceKind::Bun => format!(
                "bun add --global {}@{}",
                tool.package.as_deref().unwrap_or(&tool.name),
                tool.version
            ),
            SourceKind::Ubi => format!(
                "ubi {} {} (asset picked for {platform})",
                tool.repo.as_deref().unwrap_or("?"),
                tool.tag()
            ),
            _ => tool
                .download_url(platform)
                .unwrap_or_else(|| "no asset".into()),
        };
        return Ok(format!(
            "would install {} {} from {how}",
            tool.name, tool.version
        ));
    }
    if !tool.supports(platform) {
        return Err(format!("{}: no asset for {platform}", tool.name));
    }
    match tool.source {
        SourceKind::Github | SourceKind::Url => install_archive(tool, m, platform, ctx),
        SourceKind::Bun => install_bun(tool, m),
        SourceKind::Ubi => install_ubi(tool, m, ctx),
        SourceKind::Installer => {
            install_with_installer(tool, m, platform, ctx, probe.state == State::Outdated)
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn system_directories_are_refused() {
        assert!(is_system_dir(Path::new("C:\\Windows\\System32\\rg.exe")) || !cfg!(windows));
        assert!(is_system_dir(Path::new("/usr/local/bin/rg")));
        assert!(is_system_dir(Path::new(
            "C:/Program Files/GitHub CLI/gh.exe"
        )));
        assert!(!is_system_dir(Path::new("/home/ubuntu/.local/bin/rg")));
        assert!(!is_system_dir(Path::new("C:/Users/me/.local/bin/rg.exe")));
        let err = place_file(Path::new("/usr/bin/ay-test"), b"x", true).unwrap_err();
        assert!(err.contains("system directory"));
    }

    #[test]
    fn place_file_replaces_existing() {
        let dir = tempfile::tempdir().unwrap();
        let dest = dir.path().join("bin").join(exe_name("tool"));
        place_file(&dest, b"one", true).unwrap();
        place_file(&dest, b"two", true).unwrap();
        assert_eq!(std::fs::read(&dest).unwrap(), b"two");
        let leftovers: Vec<_> = std::fs::read_dir(dest.parent().unwrap())
            .unwrap()
            .flatten()
            .collect();
        assert_eq!(leftovers.len(), 1, "no .ay-new / .ay-old left behind");
    }

    #[test]
    fn dry_run_reports_source() {
        let m = Manifest::parse(crate::manifest::EMBEDDED).unwrap();
        let just = m.tools.iter().find(|t| t.name == "just").unwrap();
        let p = Probe {
            name: "just".into(),
            want: just.version.clone(),
            have: None,
            path: None,
            state: State::Missing,
            notes: vec![],
        };
        let ctx = Context {
            dry_run: true,
            ..Context::default()
        };
        let msg = install(just, &m, "linux-x86_64", &p, &ctx).unwrap();
        assert!(
            msg.contains("https://github.com/casey/just/releases/download/"),
            "{msg}"
        );
    }
}
