//! `ay rt`: install, list, select and run language runtimes (docs/AY_RUNTIMES.md).
//!
//! Python goes through uv, which already manages CPython, free-threaded CPython, PyPy, GraalPy
//! and Pyodide builds; RustPython (no CPython) is built from the aphrody-dev fork with cargo.
//! Bun versions, canary and forks live in `tools_dir/bun/<version>`. Version files use the
//! formats other tools read: `.python-version` (uv, pyenv) and `.bun-version` (setup-bun).

use std::path::{Path, PathBuf};
use std::process::Command;

use clap::{Parser, Subcommand};

pub const RUSTPYTHON_REPO: &str = "https://github.com/aphrody-dev/RustPython";

#[derive(Parser, Debug)]
#[command(
    name = "ay rt",
    about = "Runtimes: Python engines on uv and RustPython, Bun versions, package managers, PyTorch"
)]
struct Cli {
    #[command(subcommand)]
    cmd: Cmd,
}

#[derive(Subcommand, Debug)]
enum Cmd {
    /// Installed runtimes and the active ones
    Ls,
    /// Install `python[@version]` or `bun[@version|canary]`
    Install {
        spec: String,
        /// Python engine: cpython, freethreaded, pypy, graalpy, pyodide, rustpython
        #[arg(long, default_value = "cpython")]
        engine: String,
        /// Build from this git URL or local path (forks); RustPython and Bun
        #[arg(long)]
        from: Option<String>,
    },
    /// Select a version for this project (`.python-version`, `.bun-version`) or globally
    Use {
        spec: String,
        #[arg(long)]
        engine: Option<String>,
        #[arg(long)]
        global: bool,
    },
    /// Run a runtime: `ay rt run python@3.15 -- script.py`, `ay rt run bun@canary -- x.ts`
    Run {
        spec: String,
        #[arg(long)]
        engine: Option<String>,
        #[arg(last = true)]
        args: Vec<String>,
    },
    /// Install another package manager: `python poetry|pdm|pip|hatch`, `js npm|pnpm|yarn`
    Pm { lang: String, name: String },
    /// Install PyTorch with the wheel backend for this machine (`uv --torch-backend`)
    Torch {
        /// auto (detect the CUDA driver), cpu, cu130, cu129, ...
        #[arg(long, default_value = "auto")]
        backend: String,
        /// Extra packages (torchvision, torchaudio)
        #[arg(long = "with")]
        with: Vec<String>,
    },
}

/// `python@3.15` -> (`python`, Some(`3.15`)).
pub fn split_spec(spec: &str) -> (&str, Option<&str>) {
    match spec.split_once('@') {
        Some((n, v)) if !v.is_empty() => (n, Some(v)),
        Some((n, _)) => (n, None),
        None => (spec, None),
    }
}

/// The request uv understands for an engine and version (`pypy@3.11`, `3.15t`, `graalpy`).
pub fn uv_request(engine: &str, version: Option<&str>) -> Result<String, String> {
    Ok(match (engine, version) {
        ("cpython", Some(v)) => v.to_string(),
        ("cpython", None) => "cpython".to_string(),
        ("freethreaded", Some(v)) => format!("{}t", v.trim_end_matches('t')),
        ("freethreaded", None) => "3t".to_string(),
        ("pypy" | "graalpy" | "pyodide", Some(v)) => format!("{engine}@{v}"),
        ("pypy" | "graalpy" | "pyodide", None) => engine.to_string(),
        (e, _) => return Err(format!("unknown Python engine {e}")),
    })
}

/// Bun release asset for an `ay up` platform key.
pub fn bun_asset(platform: &str) -> Option<&'static str> {
    Some(match platform {
        "windows-x86_64" => "bun-windows-x64.zip",
        "linux-x86_64" => "bun-linux-x64.zip",
        "linux-aarch64" => "bun-linux-aarch64.zip",
        "macos-x86_64" => "bun-darwin-x64.zip",
        "macos-aarch64" => "bun-darwin-aarch64.zip",
        _ => return None,
    })
}

pub fn bun_tag(version: &str) -> String {
    if version == "canary" {
        "canary".into()
    } else {
        format!("bun-v{}", version.trim_start_matches('v'))
    }
}

fn exe(name: &str) -> String {
    if cfg!(windows) {
        format!("{name}.exe")
    } else {
        name.to_string()
    }
}

fn status(program: &str, args: &[String]) -> Result<i32, String> {
    Command::new(program)
        .args(args)
        .status()
        .map(|s| s.code().unwrap_or(1))
        .map_err(|e| format!("{program}: {e}"))
}

fn tools_dir() -> Result<PathBuf, String> {
    let (m, _) = up::manifest::load(None, None)?;
    Ok(m.tools_dir())
}

fn bun_dir(version: &str) -> Result<PathBuf, String> {
    Ok(tools_dir()?.join("bun").join(version))
}

fn rustpython_dir() -> Result<PathBuf, String> {
    Ok(tools_dir()?.join("rustpython"))
}

/// The `sha256:` digest GitHub records for a release asset.
fn github_digest(repo: &str, tag: &str, asset: &str) -> Option<String> {
    let url = format!("https://api.github.com/repos/{repo}/releases/tags/{tag}");
    let body = up::fetch::get(&url, &[]).ok()?;
    let v: serde_json::Value = serde_json::from_slice(&body).ok()?;
    v.get("assets")?
        .as_array()?
        .iter()
        .find(|a| a.get("name").and_then(|n| n.as_str()) == Some(asset))?
        .get("digest")?
        .as_str()?
        .strip_prefix("sha256:")
        .map(str::to_string)
}

/// The tag of the newest Bun release, as a version (`1.4.4`).
fn latest_bun() -> Result<String, String> {
    let body = up::fetch::get(
        "https://api.github.com/repos/oven-sh/bun/releases/latest",
        &[],
    )
    .map_err(|(_, m)| m)?;
    let text = String::from_utf8_lossy(&body);
    let tag = text
        .split("\"tag_name\"")
        .nth(1)
        .and_then(|r| r.split('"').nth(1))
        .ok_or("no tag_name in the latest Bun release")?;
    Ok(tag.trim_start_matches("bun-v").to_string())
}

fn install_bun(version: &str, from: Option<&str>) -> Result<String, String> {
    let version = if version == "latest" && from.is_none() {
        latest_bun()?
    } else {
        version.to_string()
    };
    let version = version.as_str();
    let dest = bun_dir(version)?;
    if let Some(src) = from {
        // A fork build (third_party/bun, `bun bd`): register its binary under this version.
        let p = Path::new(src);
        if !p.is_file() {
            return Err(format!("--from {src}: give the path of a built bun binary"));
        }
        std::fs::create_dir_all(&dest).map_err(|e| e.to_string())?;
        std::fs::copy(p, dest.join(exe("bun"))).map_err(|e| e.to_string())?;
        return Ok(format!("bun {version} from {src}"));
    }
    let platform = up::manifest::current_platform();
    let asset = bun_asset(&platform).ok_or_else(|| format!("no Bun build for {platform}"))?;
    let tag = bun_tag(version);
    let data = up::fetch::github_asset("oven-sh/bun", &tag, asset, None)?;
    // GitHub's per-asset digest first: the canary SHASUMS256.txt lags behind its binaries.
    let digest = github_digest("oven-sh/bun", &tag, asset);
    let sums = || {
        up::fetch::github_asset("oven-sh/bun", &tag, "SHASUMS256.txt", None)
            .ok()
            .and_then(|b| up::fetch::checksum_for(&String::from_utf8_lossy(&b), asset))
    };
    let verified = match digest.or_else(sums) {
        Some(sum) => {
            up::fetch::verify(&data, &sum, asset)?;
            true
        }
        None => false,
    };
    let entries = up::archive::entries(asset, &data)?;
    let bin =
        up::archive::find_executable(&entries, &exe("bun")).ok_or("bun not in the archive")?;
    up::install::place_file(&dest.join(exe("bun")), &bin.data, true)?;
    Ok(format!(
        "bun {version} -> {}{}",
        dest.display(),
        if verified {
            " (sha256 verified)"
        } else {
            " (no checksum published)"
        }
    ))
}

fn install_rustpython(from: Option<&str>) -> Result<i32, String> {
    let root = rustpython_dir()?;
    let mut args: Vec<String> = vec![
        "install".into(),
        "--locked".into(),
        "--root".into(),
        root.display().to_string(),
    ];
    match from {
        Some(p) if Path::new(p).is_dir() => args.extend(["--path".into(), p.into()]),
        Some(url) => args.extend(["--git".into(), url.into()]),
        None => args.extend(["--git".into(), RUSTPYTHON_REPO.into()]),
    }
    args.push("rustpython".into());
    eprintln!("cargo {}", args.join(" "));
    status("cargo", &args)
}

fn rustpython_bin() -> Result<PathBuf, String> {
    Ok(rustpython_dir()?.join("bin").join(exe("rustpython")))
}

/// The bun binary for a version: installed copy, or the default `bun` when it matches.
fn bun_for(version: Option<&str>) -> Result<PathBuf, String> {
    match version {
        None => Ok(PathBuf::from("bun")),
        Some(v) => {
            let p = bun_dir(v)?.join(exe("bun"));
            if p.is_file() {
                Ok(p)
            } else {
                Err(format!(
                    "bun {v} is not installed; run `ay rt install bun@{v}`"
                ))
            }
        }
    }
}

fn ls() -> Result<i32, String> {
    println!("python (uv):");
    let _ = status(
        "uv",
        &["python".into(), "list".into(), "--only-installed".into()],
    );
    let rp = rustpython_bin()?;
    if rp.is_file() {
        println!("  rustpython  {}", rp.display());
    }
    println!("bun:");
    let active = Command::new("bun")
        .arg("--version")
        .output()
        .ok()
        .map(|o| String::from_utf8_lossy(&o.stdout).trim().to_string());
    println!("  default     {}", active.as_deref().unwrap_or("not found"));
    if let Ok(rd) = std::fs::read_dir(tools_dir()?.join("bun")) {
        for e in rd.flatten() {
            println!(
                "  {:<11} {}",
                e.file_name().to_string_lossy(),
                e.path().display()
            );
        }
    }
    for (file, what) in [(".python-version", "python"), (".bun-version", "bun")] {
        if let Ok(v) = std::fs::read_to_string(file) {
            println!("project {what}: {}", v.trim());
        }
    }
    Ok(0)
}

pub fn run(name: &str, args: &[String]) -> i32 {
    let cli =
        match Cli::try_parse_from(std::iter::once(name.to_string()).chain(args.iter().cloned())) {
            Ok(c) => c,
            Err(e) => {
                let _ = e.print();
                return if e.use_stderr() { 2 } else { 0 };
            }
        };
    let r = match cli.cmd {
        Cmd::Ls => ls(),
        Cmd::Install { spec, engine, from } => match split_spec(&spec) {
            ("python", _) if engine == "rustpython" => install_rustpython(from.as_deref()),
            ("python", v) => uv_request(&engine, v)
                .and_then(|req| status("uv", &["python".into(), "install".into(), req])),
            ("bun", v) => install_bun(v.unwrap_or("latest"), from.as_deref()).map(|m| {
                println!("{m}");
                0
            }),
            (other, _) => Err(format!("unknown runtime {other} (python, bun)")),
        },
        Cmd::Use {
            spec,
            engine,
            global,
        } => match split_spec(&spec) {
            ("python", v) => {
                uv_request(engine.as_deref().unwrap_or("cpython"), v).and_then(|req| {
                    let mut a = vec!["python".into(), "pin".into(), req];
                    if global {
                        a.push("--global".into());
                    }
                    status("uv", &a)
                })
            }
            ("bun", Some(v)) => bun_for(Some(v)).and_then(|_| {
                std::fs::write(".bun-version", format!("{v}\n"))
                    .map(|_| 0)
                    .map_err(|e| e.to_string())
            }),
            (other, _) => Err(format!("cannot select {other}; give runtime@version")),
        },
        Cmd::Run { spec, engine, args } => match split_spec(&spec) {
            ("python", _) if engine.as_deref() == Some("rustpython") => {
                rustpython_bin().and_then(|b| status(&b.to_string_lossy(), &args))
            }
            ("python", v) => (|| {
                let mut a: Vec<String> = vec!["run".into(), "--no-project".into()];
                if let Some(v) = v {
                    a.extend([
                        "--python".into(),
                        uv_request(engine.as_deref().unwrap_or("cpython"), Some(v))?,
                    ]);
                }
                a.push("python".into());
                a.extend(args);
                status("uv", &a)
            })(),
            ("bun", v) => bun_for(v).and_then(|b| status(&b.to_string_lossy(), &args)),
            (other, _) => Err(format!("unknown runtime {other}")),
        },
        Cmd::Pm { lang, name } => match lang.as_str() {
            "python" | "py" => status("uv", &["tool".into(), "install".into(), name]),
            "js" | "node" => status("bun", &["add".into(), "-g".into(), name]),
            other => Err(format!("unknown language {other} (python, js)")),
        },
        Cmd::Torch { backend, with } => {
            let mut a: Vec<String> = vec!["pip".into(), "install".into(), "torch".into()];
            a.extend(with);
            a.extend(["--torch-backend".into(), backend]);
            status("uv", &a)
        }
    };
    match r {
        Ok(c) => c,
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
    fn specs_and_engines() {
        assert_eq!(split_spec("python@3.15"), ("python", Some("3.15")));
        assert_eq!(split_spec("bun"), ("bun", None));
        assert_eq!(uv_request("cpython", Some("3.15")).unwrap(), "3.15");
        assert_eq!(uv_request("freethreaded", Some("3.15")).unwrap(), "3.15t");
        assert_eq!(uv_request("pypy", Some("3.11")).unwrap(), "pypy@3.11");
        assert_eq!(uv_request("graalpy", None).unwrap(), "graalpy");
        assert!(uv_request("jython", None).is_err());
    }

    #[test]
    fn bun_releases() {
        assert_eq!(bun_tag("1.4.4"), "bun-v1.4.4");
        assert_eq!(bun_tag("canary"), "canary");
        assert_eq!(bun_asset("windows-x86_64"), Some("bun-windows-x64.zip"));
        assert_eq!(bun_asset("freebsd-x86_64"), None);
    }
}
