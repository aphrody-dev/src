//! `ay self-update`: replace the running `ay` with the latest dist release (axoupdater).
//!
//! With a dist install receipt (installed by `aphrody-installer.sh` / `.ps1`) the receipt
//! names the source and install prefix. Without one (built from source, placed by `ay up`)
//! the source is `aphrody-dev/src` GitHub Releases and the prefix is where this binary lives.

use axoupdater::{AxoUpdater, ReleaseSource, ReleaseSourceType, UpdateRequest, Version};
use std::path::{Path, PathBuf};

pub const OWNER: &str = "aphrody-labs";
pub const REPO: &str = "src";
/// dist names artifacts and the receipt after the package.
pub const APP: &str = "aphrody";

#[derive(clap::Args, Debug, PartialEq, Default, Clone)]
pub struct SelfUpdateArgs {
    /// Only report whether a newer release exists (exit 1 when one does)
    #[arg(long)]
    pub check: bool,
    /// Install this version instead of the latest (`0.3.0`)
    #[arg(long, value_name = "VERSION")]
    pub version: Option<String>,
}

/// Install directory handed to the dist installer when there is no receipt: the directory of
/// the running binary. `install-path = "~/.local/bin"` gives the installers a flat layout, so
/// a forced directory receives the binary directly (no `bin/` appended).
pub fn install_dir(exe: &Path) -> PathBuf {
    exe.parent().unwrap_or(Path::new(".")).to_path_buf()
}

fn github_token() -> Option<String> {
    ["GH_TOKEN", "GITHUB_TOKEN"]
        .iter()
        .find_map(|k| std::env::var(k).ok().filter(|v| !v.is_empty()))
}

fn configure(args: &SelfUpdateArgs) -> Result<(AxoUpdater, &'static str), String> {
    let mut updater = AxoUpdater::new_for(APP);
    let origin = if updater.load_receipt().is_ok() {
        "install receipt"
    } else {
        let exe = std::env::current_exe().map_err(|e| format!("current exe: {e}"))?;
        let prefix = install_dir(&exe);
        let prefix = prefix
            .to_str()
            .ok_or("install path is not UTF-8")?
            .to_string();
        let current: Version = env!("CARGO_PKG_VERSION")
            .parse()
            .map_err(|e| format!("version: {e}"))?;
        updater
            .set_release_source(ReleaseSource {
                release_type: ReleaseSourceType::GitHub,
                owner: OWNER.into(),
                name: REPO.into(),
                app_name: APP.into(),
            })
            .set_install_dir(prefix);
        updater
            .set_current_version(current)
            .map_err(|e| e.to_string())?;
        "no receipt, GitHub aphrody-dev/src"
    };
    if let Some(token) = github_token() {
        updater.set_github_token(&token);
    }
    if let Some(v) = &args.version {
        updater.configure_version_specifier(UpdateRequest::SpecificVersion(
            v.trim_start_matches('v').to_string(),
        ));
    }
    Ok((updater, origin))
}

pub fn run(args: SelfUpdateArgs) -> i32 {
    let (mut updater, origin) = match configure(&args) {
        Ok(v) => v,
        Err(e) => {
            eprintln!("ay self-update: {e}");
            return 1;
        }
    };
    println!("ay {} ({origin})", env!("CARGO_PKG_VERSION"));
    if args.check {
        return match updater.is_update_needed_sync() {
            Ok(true) => {
                println!("a newer release is available: run `ay self-update`");
                1
            }
            Ok(false) => {
                println!("up to date");
                0
            }
            Err(e) => {
                eprintln!("ay self-update: {e}");
                1
            }
        };
    }
    match updater.run_sync() {
        Ok(Some(result)) => {
            println!(
                "updated to {} ({}) in {}",
                result.new_version, result.new_version_tag, result.install_prefix
            );
            0
        }
        Ok(None) => {
            println!("up to date");
            0
        }
        Err(e) => {
            eprintln!("ay self-update: {e}");
            eprintln!(
                "hint: `ay up ay` installs the pinned release from tools.toml, including private releases with GH_TOKEN"
            );
            1
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn install_dir_is_the_binary_directory() {
        assert_eq!(
            install_dir(Path::new("/home/u/.local/bin/ay")),
            PathBuf::from("/home/u/.local/bin")
        );
    }
}
