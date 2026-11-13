//! `ay bun install --fork`: the aphrody-labs/bun build of the `aphrody windows` workflow
//! (.github/workflows/aphrody-windows.yml on main), installed reproducibly.
//!
//! 1. the last successful run on main, or `--run <id>`;
//! 2. its `bun-<os>-x64` artifact (holding `bun-<os>-x64.zip`, folder `bun-<os>-x64/bun[.exe]`);
//! 3. the zip's sha256 checked against the `build` job output, read from the log of the test
//!    job (`echo "<sha256>  dist/bun-windows-x64.zip" | sha256sum -c`); without it the hash and
//!    the run's `head_sha` are printed;
//! 4. registered as `bun@fork` through `ay rt install bun@fork --from <exe>`
//!    (`<tools_dir>/bun/fork/`), with `aphrody-run.json` (run, commit, sha256) beside it;
//! 5. `--activate` copies it to `~/.bun/bin/bun[.exe]`, keeping the old one as
//!    `bun.previous[.exe]` (as `bun upgrade` does), then checks `bun --revision`.

use super::watch::Gh;
use super::{InstallArgs, error, str_of, warn};
use serde_json::{Value, json};
use std::path::{Path, PathBuf};
use std::process::Command;

pub const REPO: &str = "aphrody-labs/bun";
pub const WORKFLOW: &str = "aphrody-windows.yml";

/// Artifact name for this OS, or None where the workflow builds nothing.
pub fn artifact_name() -> Option<&'static str> {
    if cfg!(windows) {
        Some("bun-windows-x64")
    } else if cfg!(all(target_os = "linux", target_arch = "x86_64")) {
        Some("bun-linux-x64")
    } else {
        None
    }
}

fn exe(name: &str) -> String {
    format!("{name}{}", std::env::consts::EXE_SUFFIX)
}

/// The sha256 the workflow recorded for `zip`, from a job log line
/// `echo "<sha256>  dist/<zip>" | sha256sum -c` (expressions are expanded in the log).
pub fn sha_from_log(log: &str, zip: &str) -> Option<String> {
    let needle = format!("  dist/{zip}");
    log.match_indices(&needle).find_map(|(i, _)| {
        let start = i.checked_sub(64)?;
        let h = log.get(start..i)?;
        h.bytes().all(|b| b.is_ascii_hexdigit()).then(|| h.to_ascii_lowercase())
    })
}

fn find_run(gh: &mut Gh, id: Option<u64>) -> Result<Value, String> {
    match id {
        Some(id) => gh.get(&format!("repos/{REPO}/actions/runs/{id}"), None)?.body.ok_or_else(|| "empty run".into()),
        None => {
            let list = gh
                .get(&format!("repos/{REPO}/actions/workflows/{WORKFLOW}/runs?branch=main&status=success&per_page=1"), None)?
                .body
                .unwrap_or_default();
            list.pointer("/workflow_runs/0").cloned().ok_or_else(|| format!("no successful run of {WORKFLOW} on {REPO} main"))
        }
    }
}

fn expected_sha(gh: &mut Gh, run_id: u64, zip: &str) -> Option<String> {
    let jobs = gh.get(&format!("repos/{REPO}/actions/runs/{run_id}/jobs?per_page=100"), None).ok()?.body?;
    for job in jobs["jobs"].as_array()? {
        let id = job["id"].as_u64()?;
        if let Ok(log) = gh.raw(&format!("https://api.github.com/repos/{REPO}/actions/jobs/{id}/logs")) {
            if let Some(h) = sha_from_log(&String::from_utf8_lossy(&log), zip) {
                return Some(h);
            }
        }
    }
    None
}

fn extract(name: &str, data: &[u8], want: &str) -> Result<Vec<u8>, String> {
    let entries = up::archive::entries(name, data)?;
    entries
        .iter()
        .find(|e| e.path.file_name().and_then(|f| f.to_str()) == Some(want))
        .map(|e| e.data.clone())
        .ok_or_else(|| format!("{want} not in {name}"))
}

fn tools_dir() -> Result<PathBuf, String> {
    Ok(up::manifest::load(None, None)?.0.tools_dir())
}

fn bun_home_bin() -> PathBuf {
    super::home().join(".bun").join("bin")
}

/// Copy `src` to ~/.bun/bin/bun, the previous binary kept as bun.previous; restored if the
/// new one does not answer `--revision`.
fn activate(src: &Path) -> Result<String, String> {
    let dir = bun_home_bin();
    std::fs::create_dir_all(&dir).map_err(|e| format!("{}: {e}", dir.display()))?;
    let dest = dir.join(exe("bun"));
    let previous = dir.join(exe("bun.previous"));
    let had = dest.is_file();
    if had {
        let _ = std::fs::remove_file(&previous);
        // A running bun.exe can be renamed on Windows, not overwritten.
        std::fs::rename(&dest, &previous).map_err(|e| format!("{} -> {}: {e}", dest.display(), previous.display()))?;
    }
    std::fs::copy(src, &dest).map_err(|e| format!("{}: {e}", dest.display()))?;
    match Command::new(&dest).arg("--revision").output() {
        Ok(o) if o.status.success() => Ok(String::from_utf8_lossy(&o.stdout).trim().to_string()),
        other => {
            let why = match other {
                Ok(o) => String::from_utf8_lossy(&o.stderr).trim().to_string(),
                Err(e) => e.to_string(),
            };
            let _ = std::fs::remove_file(&dest);
            if had {
                let _ = std::fs::rename(&previous, &dest);
            }
            Err(format!("{} --revision failed ({why}); previous binary restored", dest.display()))
        }
    }
}

fn install(a: &InstallArgs) -> Result<Value, String> {
    let artifact = artifact_name().ok_or_else(|| format!("{WORKFLOW} builds no artifact for {}-{}", std::env::consts::OS, std::env::consts::ARCH))?;
    let zip = format!("{artifact}.zip");
    let mut gh = Gh::new();
    if !gh.authenticated() {
        return Err("artifact downloads need a token: set GH_TOKEN or run `gh auth login`".into());
    }
    let run = find_run(&mut gh, a.run)?;
    let run_id = run["id"].as_u64().ok_or("run without id")?;
    let head_sha = str_of(&run, "head_sha").to_string();
    if a.run.is_some() && str_of(&run, "conclusion") != "success" {
        warn(&format!("run {run_id} concluded {}", str_of(&run, "conclusion")));
    }
    let arts = gh.get(&format!("repos/{REPO}/actions/runs/{run_id}/artifacts?per_page=100"), None)?.body.unwrap_or_default();
    let art = arts["artifacts"]
        .as_array()
        .and_then(|l| l.iter().find(|x| str_of(x, "name") == artifact))
        .ok_or_else(|| format!("run {run_id} has no artifact {artifact} (expired after 30 days, or not built for this OS)"))?;
    if art["expired"].as_bool() == Some(true) {
        return Err(format!("artifact {artifact} of run {run_id} has expired"));
    }
    let outer = gh.raw(str_of(art, "archive_download_url"))?;
    let inner = extract("artifact.zip", &outer, &zip)?;
    let sha = up::fetch::sha256_hex(&inner);
    let expected = expected_sha(&mut gh, run_id, &zip);
    let verified = match &expected {
        Some(e) if *e == sha => true,
        Some(e) => return Err(format!("{zip}: sha256 {sha} differs from the build output {e} (run {run_id})")),
        None => {
            warn(&format!("no sha256 found in the logs of run {run_id}; {zip} sha256 {sha}, commit {head_sha}"));
            false
        }
    };
    let bin = extract(&zip, &inner, &exe("bun"))?;
    let tmp = std::env::temp_dir().join(format!("ay-bun-fork-{run_id}"));
    std::fs::create_dir_all(&tmp).map_err(|e| e.to_string())?;
    let tmp_bin = tmp.join(exe("bun"));
    std::fs::write(&tmp_bin, &bin).map_err(|e| format!("{}: {e}", tmp_bin.display()))?;
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        let _ = std::fs::set_permissions(&tmp_bin, std::fs::Permissions::from_mode(0o755));
    }
    let code = rt::run("ay rt", &["install".into(), "bun@fork".into(), "--from".into(), tmp_bin.display().to_string()]);
    let _ = std::fs::remove_dir_all(&tmp);
    if code != 0 {
        return Err(format!("ay rt install bun@fork failed ({code})"));
    }
    let fork_dir = tools_dir()?.join("bun").join("fork");
    let provenance = json!({
        "repo": REPO, "workflow": WORKFLOW, "run": run_id, "run_url": str_of(&run, "html_url"),
        "head_sha": head_sha, "artifact": artifact, "zip_sha256": sha, "verified": verified,
        "bun_sha256": up::fetch::sha256_hex(&bin),
    });
    let _ = std::fs::write(fork_dir.join("aphrody-run.json"), serde_json::to_string_pretty(&provenance).unwrap_or_default());
    let mut out = provenance;
    out["installed"] = json!(fork_dir.join(exe("bun")).display().to_string());
    if a.activate {
        out["revision"] = json!(activate(&fork_dir.join(exe("bun")))?);
        out["activated"] = json!(bun_home_bin().join(exe("bun")).display().to_string());
    }
    Ok(out)
}

pub fn run(a: &InstallArgs) -> i32 {
    match install(a) {
        Ok(v) if a.json => {
            println!("{}", serde_json::to_string_pretty(&v).unwrap_or_default());
            0
        }
        Ok(v) => {
            println!(
                "bun@fork <- {} run {} ({}), commit {}\n  {} sha256 {} {}\n  installed {}",
                REPO,
                v["run"],
                str_of(&v, "run_url"),
                str_of(&v, "head_sha"),
                str_of(&v, "artifact"),
                str_of(&v, "zip_sha256"),
                if v["verified"].as_bool() == Some(true) { "(matches the build job)" } else { "(not verified)" },
                str_of(&v, "installed")
            );
            if let Some(act) = v.get("activated") {
                println!("  activated {} ({})", act.as_str().unwrap_or(""), str_of(&v, "revision"));
            }
            0
        }
        Err(e) => {
            error(&e);
            1
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn sha_from_the_test_job_log() {
        let sha = "0ef66ce49c07fd162207a0c67306fdd890859bebd0031122ac5c1a55b7fd7475";
        let log = format!("2026-11-13T01:00:00.0Z ##[group]Run echo \"{sha}  dist/bun-windows-x64.zip\" | sha256sum -c\n2026-11-13T01:00:01.0Z dist/bun-windows-x64.zip: OK\n");
        assert_eq!(sha_from_log(&log, "bun-windows-x64.zip").as_deref(), Some(sha));
        assert_eq!(sha_from_log("echo \"  dist/bun-windows-x64.zip\"", "bun-windows-x64.zip"), None);
        assert_eq!(sha_from_log(&log, "bun-linux-x64.zip"), None);
    }
}
