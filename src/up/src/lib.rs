//! `ay up`: keep the toolchain declared in `tools.toml` installed and current.
//!
//! - `ay up` installs missing tools and updates outdated ones into `~/.local/bin`
//!   (or `tools_dir` for whole-tree tools, Bun's global dir for Bun packages).
//! - `ay up --check` reports only and exits 1 when anything is missing or outdated.
//! - `ay up --list` prints the manifest.
//! - `ay up --setup` wires provider CLIs (gh, wrangler, gcloud, ovhcloud, Hostinger API)
//!   from the repository `.env` and prints a masked status table.
//! - `ay up --bootstrap` also applies the workstation steps absorbed from install.ps1 /
//!   install.sh: config files, directory links, local builds, missing clones, `ay doctor`.
//! - `ay up --assets <DIR>` prints the content-hashed R2 manifest for a wasm/CDN build.

pub mod archive;
pub mod assets;
pub mod bootstrap;
pub mod fetch;
pub mod install;
pub mod manifest;
pub mod probe;
pub mod setup;
pub mod shim;
pub mod version;

use manifest::{Manifest, Origin};
use probe::Probe;
use std::path::{Path, PathBuf};

#[derive(clap::Args, Debug, PartialEq, Default, Clone)]
pub struct UpArgs {
    /// Report only; exit 1 when a tool is missing or outdated
    #[arg(long, conflicts_with_all = ["list", "setup"])]
    pub check: bool,
    /// List the tools in the manifest with their sources
    #[arg(long, conflicts_with = "setup")]
    pub list: bool,
    /// Wire provider CLIs from the repository .env (never prints values)
    #[arg(long)]
    pub setup: bool,
    /// Also apply config files, links, local builds and clones, then run `ay doctor`
    #[arg(long, conflicts_with_all = ["check", "list", "setup"])]
    pub bootstrap: bool,
    /// Show what would be installed without downloading
    #[arg(long)]
    pub dry_run: bool,
    /// Print the content-hashed publish manifest (JSON) for a wasm/CDN build directory
    #[arg(long, value_name = "DIR", conflicts_with_all = ["check", "list", "setup"])]
    pub assets: Option<PathBuf>,
    /// Release label recorded in the --assets manifest
    #[arg(long, value_name = "LABEL", requires = "assets")]
    pub release: Option<String>,
    /// Manifest path (default: $AY_TOOLS_MANIFEST, <repo>/tools.toml, then the embedded copy)
    #[arg(long, value_name = "PATH")]
    pub manifest: Option<PathBuf>,
    /// Only these tools
    #[arg(value_name = "TOOL")]
    pub tools: Vec<String>,
}

/// Repository root holding `src.lock.json`: `$SRC_ROOT`, else the nearest ancestor of the
/// current directory, else none (hosts without a checkout).
pub fn find_root() -> Option<PathBuf> {
    if let Some(root) = std::env::var_os("SRC_ROOT").filter(|v| !v.is_empty()) {
        return Some(PathBuf::from(root));
    }
    let cwd = std::env::current_dir().ok()?;
    cwd.ancestors()
        .find(|d| d.join("src.lock.json").is_file())
        .map(Path::to_path_buf)
}

fn select<'a>(m: &'a Manifest, names: &[String]) -> Result<Vec<&'a manifest::Tool>, String> {
    if names.is_empty() {
        return Ok(m.tools.iter().collect());
    }
    names
        .iter()
        .map(|n| {
            m.tools
                .iter()
                .find(|t| &t.name == n)
                .ok_or_else(|| format!("unknown tool `{n}` (see ay up --list)"))
        })
        .collect()
}

pub fn status_table(probes: &[Probe]) -> String {
    let rows: Vec<[String; 5]> =
        std::iter::once(["TOOL", "WANT", "HAVE", "STATE", "PATH"].map(String::from))
            .chain(probes.iter().map(|p| {
                [
                    p.name.clone(),
                    p.want.clone(),
                    p.have.clone().unwrap_or_else(|| "-".into()),
                    p.state.label().to_string(),
                    p.path
                        .as_ref()
                        .map(|x| x.display().to_string())
                        .unwrap_or_else(|| "-".into()),
                ]
            }))
            .collect();
    let widths: Vec<usize> = (0..4)
        .map(|i| rows.iter().map(|r| r[i].len()).max().unwrap_or(0))
        .collect();
    rows.iter()
        .map(|r| {
            format!(
                "{:<w0$}  {:<w1$}  {:<w2$}  {:<w3$}  {}\n",
                r[0],
                r[1],
                r[2],
                r[3],
                r[4],
                w0 = widths[0],
                w1 = widths[1],
                w2 = widths[2],
                w3 = widths[3]
            )
        })
        .collect()
}

fn list(m: &Manifest, origin: &Origin, platform: &str) -> i32 {
    println!("manifest: {origin}");
    println!("platform: {platform}, bin_dir: {}", m.bin_dir().display());
    for t in &m.tools {
        let from = match t.source {
            manifest::SourceKind::Github => {
                format!("github {} {}", t.repo.as_deref().unwrap_or("?"), t.tag())
            }
            manifest::SourceKind::Bun => {
                format!("bun global {}", t.package.as_deref().unwrap_or("?"))
            }
            manifest::SourceKind::Url => "url".to_string(),
            manifest::SourceKind::Installer => "installer".to_string(),
            manifest::SourceKind::Ubi => {
                format!("ubi {} {}", t.repo.as_deref().unwrap_or("?"), t.tag())
            }
        };
        let lock = t
            .lock
            .as_deref()
            .map(|k| format!(" (src.lock.json: {k})"))
            .unwrap_or_default();
        let support = if t.supports(platform) {
            ""
        } else {
            " [no asset for this platform]"
        };
        println!("  {:<18} {:<10} {from}{lock}{support}", t.name, t.version);
        if let Some(note) = &t.note {
            println!("  {:<18} {note}", "");
        }
    }
    for f in &m.files {
        println!("  file  {:<14} {}", f.name, f.path);
    }
    for l in &m.links {
        println!("  link  {:<14} {} -> {}", l.name, l.path, l.target);
    }
    for st in &m.steps {
        println!(
            "  step  {:<14} {} (creates {})",
            st.name,
            st.run.join(" "),
            st.creates
        );
    }
    0
}

fn print_notes(probes: &[Probe]) {
    for p in probes {
        for note in &p.notes {
            println!("note: {}: {note}", p.name);
        }
    }
}

/// State of every file, link and step, plus missing clones.
fn bootstrap_items(m: &Manifest, vars: &bootstrap::Vars) -> Vec<bootstrap::Item> {
    let mut items: Vec<bootstrap::Item> = m
        .files
        .iter()
        .map(|f| bootstrap::file_state(f, vars))
        .collect();
    items.extend(m.links.iter().map(|l| bootstrap::link_state(l, vars)));
    items.extend(m.steps.iter().map(|s| bootstrap::step_state(s, vars)));
    items
}

fn items_table(items: &[bootstrap::Item]) -> String {
    let rows: Vec<[String; 4]> =
        std::iter::once(["KIND", "NAME", "STATE", "PATH"].map(String::from))
            .chain(
                items
                    .iter()
                    .filter(|i| i.state != bootstrap::ItemState::Skipped)
                    .map(|i| {
                        [
                            i.kind.to_string(),
                            i.name.clone(),
                            i.state.label().to_string(),
                            i.path
                                .as_ref()
                                .map(|p| p.display().to_string())
                                .unwrap_or_default(),
                        ]
                    }),
            )
            .collect();
    let w: Vec<usize> = (0..3)
        .map(|c| rows.iter().map(|r| r[c].len()).max().unwrap_or(0))
        .collect();
    rows.iter()
        .map(|r| {
            format!(
                "{:<a$}  {:<b$}  {:<c$}  {}
",
                r[0],
                r[1],
                r[2],
                r[3],
                a = w[0],
                b = w[1],
                c = w[2]
            )
        })
        .collect()
}

/// Apply missing bootstrap items; returns the number of failures.
fn run_bootstrap(
    m: &Manifest,
    vars: &bootstrap::Vars,
    root: Option<&Path>,
    dry_run: bool,
) -> usize {
    let mut failed = 0;
    let mut report = |what: String, res: Result<String, String>| match res {
        Ok(msg) => println!("{what}: {msg}"),
        Err(e) => {
            failed += 1;
            eprintln!("{what}: error: {e}");
        }
    };
    for f in &m.files {
        if bootstrap::file_state(f, vars).state == bootstrap::ItemState::Missing {
            report(
                format!("file {}", f.name),
                if dry_run {
                    Ok("would write".into())
                } else {
                    bootstrap::apply_file(f, vars)
                },
            );
        }
    }
    for l in &m.links {
        if bootstrap::link_state(l, vars).state == bootstrap::ItemState::Missing {
            report(
                format!("link {}", l.name),
                if dry_run {
                    Ok("would link".into())
                } else {
                    bootstrap::apply_link(l, vars)
                },
            );
        }
    }
    for st in &m.steps {
        if bootstrap::step_state(st, vars).state == bootstrap::ItemState::Missing {
            report(
                format!("step {}", st.name),
                if dry_run {
                    Ok(format!("would run {}", st.run.join(" ")))
                } else {
                    bootstrap::apply_step(st, vars)
                },
            );
        }
    }
    if let Some(root) = root {
        let lock = std::fs::read_to_string(root.join("src.lock.json")).unwrap_or_default();
        for (key, url, path) in bootstrap::missing_repos(&lock, root) {
            report(
                format!("clone {key}"),
                if dry_run {
                    Ok(format!("would clone {url}"))
                } else {
                    bootstrap::clone_repo(&url, &path, &vars.bin)
                },
            );
        }
    }
    if !dry_run {
        let doctor = std::env::current_exe()
            .map_err(|e| e.to_string())
            .and_then(|exe| {
                std::process::Command::new(exe)
                    .arg("doctor")
                    .status()
                    .map_err(|e| e.to_string())
            });
        if !doctor.is_ok_and(|s| s.success()) {
            eprintln!("ay doctor reported problems");
        }
    }
    failed
}

/// Entry point for `ay up`. Returns the process exit code.
pub fn run(args: UpArgs) -> i32 {
    if let Some(dir) = &args.assets {
        return match assets::plan(dir, args.release.as_deref().unwrap_or("dev"))
            .and_then(|m| serde_json::to_string_pretty(&m).map_err(|e| e.to_string()))
        {
            Ok(json) => {
                println!("{json}");
                0
            }
            Err(e) => {
                eprintln!("ay up --assets: {e}");
                1
            }
        };
    }
    let root = find_root();
    let (m, origin) = match manifest::load(args.manifest.as_deref(), root.as_deref()) {
        Ok(v) => v,
        Err(e) => {
            eprintln!("ay up: {e}");
            return 2;
        }
    };
    let platform = manifest::current_platform();
    if args.list {
        return list(&m, &origin, &platform);
    }
    let secrets = setup::Secrets::load(root.as_deref());
    if args.setup {
        if let Some(path) = &secrets.env_file {
            println!("credentials: {} (values never printed)", path.display());
        } else {
            println!("credentials: process environment only (no .env found)");
        }
        let rows = setup::check_all(&secrets, &m.bin_dir());
        print!("{}", setup::table(&rows));
        return if rows.iter().all(|r| r.ok) { 0 } else { 1 };
    }
    let tools = match select(&m, &args.tools) {
        Ok(t) => t,
        Err(e) => {
            eprintln!("ay up: {e}");
            return 2;
        }
    };
    let probes: Vec<Probe> = tools
        .iter()
        .map(|t| probe::probe(t, &m, &platform))
        .collect();
    let vars = bootstrap::Vars {
        repo: root.clone(),
        bin: m.bin_dir(),
    };
    if args.check {
        println!("manifest: {origin} ({platform})");
        print!("{}", status_table(&probes));
        print_notes(&probes);
        let pending = probes.iter().filter(|p| p.state.needs_action()).count();
        println!("{pending} tool(s) missing or outdated");
        let items = bootstrap_items(&m, &vars);
        if items
            .iter()
            .any(|i| i.state != bootstrap::ItemState::Skipped)
        {
            println!(
                "
bootstrap items (applied by ay up --bootstrap, not part of the exit code):"
            );
            print!("{}", items_table(&items));
        }
        return if pending == 0 { 0 } else { 1 };
    }
    let ctx = install::Context {
        github_token: secrets.first(&["GH_TOKEN", "GITHUB_TOKEN"]).map(|(_, v)| v),
        dry_run: args.dry_run,
    };
    let mut failed = 0;
    let mut finals = Vec::new();
    for (tool, p) in tools.iter().zip(&probes) {
        if !p.state.needs_action() {
            finals.push(p.clone());
            continue;
        }
        println!("{} {} -> {}", p.state.label(), tool.name, tool.version);
        match install::install(tool, &m, &platform, p, &ctx) {
            Ok(msg) => println!("  {}", secrets.scrub(&msg)),
            Err(e) => {
                failed += 1;
                eprintln!("  error: {}", secrets.scrub(&e));
            }
        }
        finals.push(if args.dry_run {
            p.clone()
        } else {
            probe::probe(tool, &m, &platform)
        });
    }
    print!("{}", status_table(&finals));
    print_notes(&finals);
    if args.bootstrap {
        failed += run_bootstrap(&m, &vars, root.as_deref(), args.dry_run);
    }
    let pending = finals.iter().filter(|p| p.state.needs_action()).count();
    if failed > 0 || (!args.dry_run && pending > 0) {
        eprintln!("ay up: {failed} failed, {pending} still missing or outdated");
        1
    } else {
        0
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use probe::State;

    #[test]
    fn select_rejects_unknown_tools() {
        let m = Manifest::parse(manifest::EMBEDDED).unwrap();
        assert_eq!(select(&m, &[]).unwrap().len(), m.tools.len());
        assert_eq!(select(&m, &["just".into()]).unwrap()[0].name, "just");
        assert!(
            select(&m, &["nope".into()])
                .unwrap_err()
                .contains("unknown tool")
        );
    }

    #[test]
    fn table_has_header_and_rows() {
        let p = Probe {
            name: "rg".into(),
            want: "15.2.0".into(),
            have: None,
            path: None,
            state: State::Missing,
            notes: vec![],
        };
        let t = status_table(&[p]);
        assert!(t.lines().next().unwrap().starts_with("TOOL"));
        assert!(t.contains("missing"));
    }
}
