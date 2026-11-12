//! `ay vpy`: run Python with a Chromium vpython environment on uv.
//!
//! Upstream `vpython3` (luci-go) is already uv-backed: a spec is a `vpython.toml`
//! (`requires-python` + `dependencies`) or a PEP 723 `# /// script` block, locked by a sibling
//! `<spec>.uv.lock` in pip-compile format with hashes. This crate finds the spec the same way and
//! runs `uv run --no-project` with the lock, using the system `uv`. Locks that pin Chromium-built
//! wheels (`+chromium.N` versions, served only by Chromium's wheel index) go to upstream
//! `vpython3` unless `--index-url` names that index.

use std::path::{Path, PathBuf};
use std::process::Command;

/// A resolved environment specification.
#[derive(Debug, Clone, PartialEq)]
pub struct Spec {
    /// The file that declares the environment (`vpython.toml` or the script itself).
    pub source: PathBuf,
    pub requires_python: Option<String>,
    pub dependencies: Vec<String>,
    /// `<source>.uv.lock`, when present.
    pub lock: Option<PathBuf>,
}

impl Spec {
    /// Whether the lock (or the dependency list) pins Chromium-built wheels.
    pub fn needs_chromium_index(&self) -> bool {
        let lock_text = self
            .lock
            .as_ref()
            .and_then(|l| std::fs::read_to_string(l).ok())
            .unwrap_or_default();
        lock_text.contains("+chromium") || self.dependencies.iter().any(|d| d.contains("+chromium"))
    }
}

/// Parse a `vpython.toml` body.
pub fn parse_toml(text: &str, source: &Path) -> Result<Spec, String> {
    let v: toml::Table = text
        .parse()
        .map_err(|e| format!("{}: {e}", source.display()))?;
    let requires_python = v
        .get("requires-python")
        .and_then(|x| x.as_str())
        .map(str::to_string);
    let dependencies = v
        .get("dependencies")
        .and_then(|x| x.as_array())
        .map(|a| {
            a.iter()
                .filter_map(|d| d.as_str().map(str::to_string))
                .collect()
        })
        .unwrap_or_default();
    Ok(Spec {
        source: source.to_path_buf(),
        requires_python,
        dependencies,
        lock: lock_for(source),
    })
}

/// The TOML inside a PEP 723 `# /// script` ... `# ///` block, if the script has one.
pub fn pep723_block(script: &str) -> Option<String> {
    let mut lines = script
        .lines()
        .skip_while(|l| l.trim_end() != "# /// script");
    lines.next()?;
    let mut body = String::new();
    for l in lines {
        if l.trim_end() == "# ///" {
            return Some(body);
        }
        let content = l.strip_prefix("# ").or_else(|| l.strip_prefix('#'))?;
        body.push_str(content);
        body.push('\n');
    }
    None
}

fn lock_for(source: &Path) -> Option<PathBuf> {
    let mut name = source.file_name()?.to_os_string();
    name.push(".uv.lock");
    let p = source.with_file_name(name);
    p.is_file().then_some(p)
}

/// Upstream probing: an explicit spec, else the script's PEP 723 block, else the nearest
/// `vpython.toml` from the script's directory (or `start`) upwards.
pub fn find_spec(
    explicit: Option<&Path>,
    script: Option<&Path>,
    start: &Path,
) -> Result<Option<Spec>, String> {
    if let Some(p) = explicit {
        let text = std::fs::read_to_string(p).map_err(|e| format!("{}: {e}", p.display()))?;
        return parse_toml(&text, p).map(Some);
    }
    if let Some(s) = script
        && let Ok(text) = std::fs::read_to_string(s)
        && let Some(block) = pep723_block(&text)
    {
        return parse_toml(&block, s).map(Some);
    }
    let dir = script
        .and_then(Path::parent)
        .filter(|p| !p.as_os_str().is_empty())
        .unwrap_or(start);
    let dir = dir
        .canonicalize()
        .map(|p| PathBuf::from(p.to_string_lossy().trim_start_matches(r"\\?\").to_string()))
        .unwrap_or_else(|_| dir.to_path_buf());
    for d in dir.ancestors() {
        let p = d.join("vpython.toml");
        if p.is_file() {
            let text = std::fs::read_to_string(&p).map_err(|e| format!("{}: {e}", p.display()))?;
            return parse_toml(&text, &p).map(Some);
        }
    }
    Ok(None)
}

/// The `uv run` argv (without the program) for `spec` and the Python arguments.
pub fn uv_args(
    spec: Option<&Spec>,
    python_args: &[String],
    index_url: Option<&str>,
) -> Vec<String> {
    let mut a = vec!["run".to_string(), "--no-project".to_string()];
    if let Some(s) = spec {
        if let Some(rp) = &s.requires_python {
            a.extend(["--python".into(), rp.clone()]);
        }
        match &s.lock {
            Some(lock) => a.extend([
                "--with-requirements".into(),
                lock.to_string_lossy().into_owned(),
            ]),
            None => {
                for d in &s.dependencies {
                    a.extend(["--with".into(), d.clone()]);
                }
            }
        }
    }
    if let Some(i) = index_url {
        a.extend(["--index-url".into(), i.to_string()]);
    }
    a.push("python".into());
    a.extend(python_args.iter().cloned());
    a
}

struct Args {
    spec: Option<PathBuf>,
    index_url: Option<String>,
    print: bool,
    upstream: bool,
    python: Vec<String>,
}

fn parse_args(args: &[String]) -> Result<Args, String> {
    let mut out = Args {
        spec: None,
        index_url: std::env::var("AY_VPY_INDEX_URL").ok(),
        print: false,
        upstream: false,
        python: Vec::new(),
    };
    let mut it = args.iter();
    while let Some(a) = it.next() {
        match a.as_str() {
            "--vpy-spec" | "-vpython-spec" => {
                out.spec = Some(it.next().ok_or("--vpy-spec needs a path")?.into())
            }
            "--index-url" => {
                out.index_url = Some(it.next().ok_or("--index-url needs a URL")?.clone())
            }
            "--print" => out.print = true,
            "--upstream" => out.upstream = true,
            "--" => {
                out.python.extend(it.by_ref().cloned());
            }
            _ => {
                out.python.push(a.clone());
                out.python.extend(it.by_ref().cloned());
            }
        }
    }
    Ok(out)
}

const USAGE: &str = "usage: ay vpy [--vpy-spec FILE] [--index-url URL] [--print] [--upstream] [--] [python args...]
Runs Python in the vpython environment of the script (PEP 723 block) or the nearest vpython.toml,
on uv with the committed .uv.lock. --print shows the uv command; --upstream runs depot_tools vpython3.
Locks with +chromium wheels need Chromium's wheel index (--index-url or $AY_VPY_INDEX_URL),
otherwise upstream vpython3 is used.";

/// `ay vpy <args>`. Returns the exit code.
pub fn run(name: &str, args: &[String]) -> i32 {
    if args.first().is_some_and(|a| a == "--help" || a == "-h") {
        println!("{USAGE}");
        return 0;
    }
    let a = match parse_args(args) {
        Ok(a) => a,
        Err(e) => {
            eprintln!("{name}: {e}");
            return 2;
        }
    };
    let cwd = std::env::current_dir().unwrap_or_else(|_| PathBuf::from("."));
    let script = a
        .python
        .first()
        .filter(|s| !s.starts_with('-'))
        .map(PathBuf::from)
        .filter(|p| p.is_file());
    let spec = match find_spec(a.spec.as_deref(), script.as_deref(), &cwd) {
        Ok(s) => s,
        Err(e) => {
            eprintln!("{name}: {e}");
            return 1;
        }
    };
    let upstream = a.upstream
        || (a.index_url.is_none() && spec.as_ref().is_some_and(Spec::needs_chromium_index));
    if upstream {
        let mut fwd = Vec::new();
        if let Some(p) = &a.spec {
            fwd.extend([
                "-vpython-spec".to_string(),
                p.to_string_lossy().into_owned(),
            ]);
        }
        fwd.extend(a.python.iter().cloned());
        if a.print {
            println!("depot_tools vpython3 {}", fwd.join(" "));
            return 0;
        }
        return depot_core::DepotTools::run_passthrough("vpython3", &fwd).unwrap_or_else(|e| {
            eprintln!("{name}: {e}");
            127
        });
    }
    let uv = uv_args(spec.as_ref(), &a.python, a.index_url.as_deref());
    if a.print {
        println!("uv {}", uv.join(" "));
        return 0;
    }
    match Command::new("uv").args(&uv).status() {
        Ok(s) => s.code().unwrap_or(1),
        Err(e) => {
            eprintln!("{name}: cannot run uv: {e}");
            127
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn chromium_src() -> Option<PathBuf> {
        let p = Path::new(env!("CARGO_MANIFEST_DIR")).join("../../third_party/chromium/src");
        p.join("vpython.toml").is_file().then_some(p)
    }

    #[test]
    fn pep723_block_is_extracted() {
        let s = "#!/usr/bin/env vpython3\n# /// script\n# requires-python = '>=3.11'\n# dependencies = ['mcp==1.9.4']\n# ///\nprint(1)\n";
        let spec = parse_toml(&pep723_block(s).unwrap(), Path::new("x.py")).unwrap();
        assert_eq!(spec.requires_python.as_deref(), Some(">=3.11"));
        assert_eq!(spec.dependencies, ["mcp==1.9.4"]);
        assert!(pep723_block("print(1)\n").is_none());
    }

    #[test]
    fn uv_command_uses_the_lock() {
        let spec = Spec {
            source: "vpython.toml".into(),
            requires_python: Some(">=3.11,<3.12".into()),
            dependencies: vec!["six==1.17.0".into()],
            lock: Some("vpython.toml.uv.lock".into()),
        };
        assert_eq!(
            uv_args(Some(&spec), &["-c".into(), "pass".into()], None).join(" "),
            "run --no-project --python >=3.11,<3.12 --with-requirements vpython.toml.uv.lock python -c pass"
        );
        let unlocked = Spec { lock: None, ..spec };
        assert!(uv_args(Some(&unlocked), &[], None).contains(&"six==1.17.0".to_string()));
    }

    /// The real specs in the Chromium checkout: the root one needs Chromium's wheel index, the
    /// MCP servers one resolves from PyPI.
    #[test]
    fn chromium_specs() {
        let Some(src) = chromium_src() else {
            return eprintln!("skip: no chromium checkout");
        };
        let root = find_spec(None, None, &src).unwrap().unwrap();
        assert!(root.dependencies.len() > 50);
        assert!(root.lock.is_some() && root.needs_chromium_index());
        let mcp = find_spec(None, None, &src.join("build/mcp_servers"))
            .unwrap()
            .unwrap();
        assert!(
            mcp.source.ends_with("build/mcp_servers/vpython.toml")
                || mcp.source.ends_with(r"build\mcp_servers\vpython.toml")
        );
        assert!(!mcp.needs_chromium_index());
    }
}
