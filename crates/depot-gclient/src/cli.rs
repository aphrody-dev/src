//! `ay gclient ...` and `ay fetch ...`.

use crate::edit::{self, DepsEditor};
use crate::sync::{self, Action, PlanOptions};
use crate::tree::{Client, Options, find_root, render_revinfo};
use crate::{Error, Result, fetch};
use clap::{Args, Parser, Subcommand};
use std::path::{Path, PathBuf};

#[derive(Parser, Debug)]
#[command(about = "gclient in Rust: DEPS evaluation, revinfo, getdep/setdep, sync on gitoxide")]
struct Gclient {
    #[command(subcommand)]
    cmd: Cmd,
}

#[derive(Args, Debug, Default, Clone)]
struct TreeArgs {
    /// Override the deps OS list (comma-separated, `all` for every OS), like `gclient --deps`
    #[arg(long = "deps")]
    deps_os: Option<String>,
    /// gclient root (default: the nearest ancestor holding .gclient)
    #[arg(long)]
    root: Option<PathBuf>,
}

#[derive(Subcommand, Debug)]
enum Cmd {
    /// Print `name: url@revision` for every dependency, as `gclient revinfo`
    Revinfo {
        #[command(flatten)]
        tree: TreeArgs,
        /// Only dependencies matching this URL or path (repeatable)
        #[arg(long)]
        filter: Vec<String>,
        /// Skip a dependency type: git, cipd or gcs (repeatable)
        #[arg(long = "ignore-dep-type")]
        ignore_dep_type: Vec<String>,
        /// Write `{name: {url, rev}}` JSON to this path (`-` for stdout)
        #[arg(long = "output-json")]
        output_json: Option<String>,
    },
    /// Print variables (`--var`) or revisions (`-r path` or `-r path:package`) from a DEPS file
    Getdep {
        #[arg(long = "var")]
        vars: Vec<String>,
        #[arg(short = 'r', long = "revision")]
        revisions: Vec<String>,
        #[arg(long = "deps-file", default_value = "DEPS")]
        deps_file: PathBuf,
    },
    /// Set variables (`--var name=value`) or revisions (`-r path@rev`, `-r path:package@version`)
    Setdep {
        #[arg(long = "var")]
        vars: Vec<String>,
        #[arg(short = 'r', long = "revision")]
        revisions: Vec<String>,
        #[arg(long = "deps-file", default_value = "DEPS")]
        deps_file: PathBuf,
        /// Do not update gitlinks for `git_dependencies = 'SYNC'` / `'SUBMODULES'`
        #[arg(long)]
        no_gitlinks: bool,
    },
    /// Plan (default) or apply a sync of git dependencies on gitoxide
    Sync {
        #[command(flatten)]
        tree: TreeArgs,
        /// Execute the plan (default is a dry run)
        #[arg(long)]
        apply: bool,
        /// Parallel checkouts
        #[arg(short = 'j', long, default_value_t = 8)]
        jobs: usize,
        /// Restrict to these dependency paths or path prefixes (repeatable)
        #[arg(long)]
        only: Vec<String>,
        /// Also clone missing solutions
        #[arg(long)]
        with_solutions: bool,
        /// Run `cipd ensure` for CIPD packages with the official client
        #[arg(long)]
        cipd: bool,
        /// Show up-to-date entries too
        #[arg(short, long)]
        verbose: bool,
    },
    /// List DEPS hooks with their resolved action, cwd and whether their condition holds
    Hooks {
        #[command(flatten)]
        tree: TreeArgs,
    },
    /// Print the gclient root directory
    Root,
}

#[derive(Parser, Debug)]
#[command(about = "Write .gclient for a fetch config and sync it (dry run unless --apply)")]
struct Fetch {
    /// Config name (chromium, v8, webrtc, ...), see --list
    config: Option<String>,
    /// Config properties, e.g. --target_os=android
    #[arg(trailing_var_arg = true, allow_hyphen_values = true)]
    props: Vec<String>,
    /// List known configs
    #[arg(long)]
    list: bool,
    /// Write .gclient and sync
    #[arg(long)]
    apply: bool,
    #[arg(short = 'j', long, default_value_t = 8)]
    jobs: usize,
}

fn exit(r: Result<i32>, name: &str) -> i32 {
    match r {
        Ok(c) => c,
        Err(e) => {
            eprintln!("{name}: {e}");
            1
        }
    }
}

fn parse<P: Parser>(name: &str, args: &[String]) -> std::result::Result<P, i32> {
    P::try_parse_from(std::iter::once(name.to_string()).chain(args.iter().cloned())).map_err(|e| {
        let code = if e.use_stderr() { 2 } else { 0 };
        let _ = e.print();
        code
    })
}

/// `ay gclient <args>`.
pub fn run_gclient(name: &str, args: &[String]) -> i32 {
    match parse::<Gclient>(name, args) {
        Ok(g) => exit(gclient(g.cmd), name),
        Err(c) => c,
    }
}

/// `ay fetch <args>`.
pub fn run_fetch(name: &str, args: &[String]) -> i32 {
    match parse::<Fetch>(name, args) {
        Ok(f) => exit(fetch_cmd(f), name),
        Err(c) => c,
    }
}

fn locate(root: Option<&Path>) -> Result<PathBuf> {
    if let Some(r) = root {
        return Ok(r.to_path_buf());
    }
    let cwd = std::env::current_dir()?;
    find_root(&cwd)
        .ok_or_else(|| Error::new("client not configured; no .gclient found (see `ay fetch`)"))
}

fn load(t: &TreeArgs, ignore: Vec<String>) -> Result<Client> {
    let root = locate(t.root.as_deref())?;
    Client::load(
        &root,
        Options {
            deps_os: t.deps_os.clone(),
            ignore_dep_types: ignore,
            ..Default::default()
        },
    )
}

/// Built-in vars from the enclosing gclient checkout, if any (getdep/setdep use them).
fn builtin_for(deps_file: &Path) -> Option<crate::Dict> {
    let dir = deps_file
        .parent()
        .filter(|p| !p.as_os_str().is_empty())
        .map(Path::to_path_buf)
        .unwrap_or_else(|| PathBuf::from("."));
    let dir = dir.canonicalize().ok()?;
    let root = find_root(&dir)?;
    let text = std::fs::read_to_string(root.join(".gclient")).ok()?;
    // Built-ins do not depend on DEPS contents; an empty tree is enough.
    let c = Client::from_config(
        &root,
        &text,
        Options {
            skip_deps: true,
            ..Default::default()
        },
    )
    .ok()?;
    Some(c.builtin_vars(0))
}

fn gclient(cmd: Cmd) -> Result<i32> {
    match cmd {
        Cmd::Root => {
            println!("{}", locate(None)?.display());
            Ok(0)
        }
        Cmd::Revinfo {
            tree,
            filter,
            ignore_dep_type,
            output_json,
        } => {
            let c = load(&tree, ignore_dep_type)?;
            let entries = c.revinfo(&filter);
            match output_json.as_deref() {
                None => print!("{}", render_revinfo(&entries)),
                Some(dest) => {
                    let mut d = crate::Dict::new();
                    for (name, url) in &entries {
                        let (u, r) = match url.as_deref().map(crate::tree::split_url_revision) {
                            Some((u, r)) => (
                                crate::Value::Str(u.into()),
                                r.map(|r| crate::Value::Str(r.into()))
                                    .unwrap_or(crate::Value::None),
                            ),
                            None => (crate::Value::None, crate::Value::None),
                        };
                        let mut e = crate::Dict::new();
                        e.insert("url", u);
                        e.insert("rev", r);
                        d.insert(name.clone(), crate::Value::Dict(e));
                    }
                    let json = fetch::to_json(&crate::Value::Dict(d));
                    if dest == "-" {
                        println!("{json}");
                    } else {
                        std::fs::write(dest, json)?;
                    }
                }
            }
            Ok(0)
        }
        Cmd::Getdep {
            vars,
            revisions,
            deps_file,
        } => {
            let content = std::fs::read_to_string(&deps_file).map_err(|e| {
                Error::new(format!(
                    "DEPS file {} does not exist: {e}",
                    deps_file.display()
                ))
            })?;
            let name = deps_file.display().to_string();
            let builtin = builtin_for(&deps_file);
            for v in vars {
                println!("{}", edit::get_var(&content, &name, &v, builtin.as_ref())?);
            }
            for r in revisions {
                match edit::get_revision(&content, &name, &r, builtin.as_ref())? {
                    Some(rev) => println!("{rev}"),
                    None => println!("None"),
                }
            }
            Ok(0)
        }
        Cmd::Setdep {
            vars,
            revisions,
            deps_file,
            no_gitlinks,
        } => {
            if vars.is_empty() && revisions.is_empty() {
                return Err(Error::new(
                    "You must specify at least one variable or revision to modify.",
                ));
            }
            let content = std::fs::read_to_string(&deps_file)?;
            let name = deps_file.display().to_string();
            let builtin = builtin_for(&deps_file);
            let mut ed = DepsEditor::new(content.clone(), name.clone(), builtin.as_ref());
            for v in &vars {
                let (k, val) = v
                    .split_once('=')
                    .filter(|(k, v)| !k.is_empty() && !v.is_empty())
                    .ok_or_else(|| {
                        Error::new(format!(
                            "Wrong var format: {v} should be of the form name=value."
                        ))
                    })?;
                ed.set_var(k, val)?;
            }
            let mut gitlinks = Vec::new();
            for r in &revisions {
                let (dep, rev) = r
                    .rsplit_once('@')
                    .filter(|(d, v)| !d.is_empty() && !v.is_empty())
                    .ok_or_else(|| {
                        Error::new(format!(
                            "Wrong dep format: {r} should be of the form dep@rev."
                        ))
                    })?;
                match dep.split_once(':') {
                    Some((path, pkg)) => ed.set_cipd(path, pkg, rev)?,
                    None => {
                        ed.set_revision(dep, rev)?;
                        gitlinks.push((dep.to_string(), rev.to_string()));
                    }
                }
            }
            let scope = crate::eval::exec(&content, &name, None, builtin.as_ref())?;
            std::fs::write(&deps_file, ed.into_content())?;
            let mode = scope.get_str("git_dependencies").unwrap_or("DEPS");
            if !no_gitlinks && matches!(mode, "SYNC" | "SUBMODULES") {
                let dir = deps_file
                    .parent()
                    .filter(|p| !p.as_os_str().is_empty())
                    .map(Path::to_path_buf)
                    .unwrap_or_else(|| PathBuf::from("."));
                let dir = dir.canonicalize()?;
                let solution = dir
                    .file_name()
                    .map(|n| n.to_string_lossy().to_string())
                    .unwrap_or_default();
                for (dep, rev) in gitlinks {
                    // DEPS keys carry the solution prefix (`src/...`); the gitlink path does not.
                    let rel = dep.strip_prefix(&format!("{solution}/")).unwrap_or(&dep);
                    if gix::ObjectId::from_hex(rev.as_bytes()).is_err() {
                        continue;
                    }
                    match edit::update_gitlink(&dir, rel, &rev) {
                        Ok(true) => {}
                        Ok(false) => {
                            eprintln!("note: {rel} is not a gitlink; only DEPS was updated")
                        }
                        Err(e) => {
                            eprintln!("Warning: gitlinks won't be updated: {e}");
                            break;
                        }
                    }
                }
            }
            Ok(0)
        }
        Cmd::Hooks { tree } => {
            let c = load(&tree, Vec::new())?;
            for h in c.hooks() {
                let on = c.hook_enabled(h)?;
                let cwd = h
                    .cwd
                    .strip_prefix(&c.root_dir)
                    .unwrap_or(&h.cwd)
                    .display()
                    .to_string();
                println!(
                    "{} {:<40} cwd={} {}",
                    if on { "run " } else { "skip" },
                    h.name.as_deref().unwrap_or("-"),
                    if cwd.is_empty() { "." } else { &cwd },
                    h.action.join(" ")
                );
            }
            Ok(0)
        }
        Cmd::Sync {
            tree,
            apply,
            jobs,
            only,
            with_solutions,
            cipd,
            verbose,
        } => {
            let c = load(&tree, Vec::new())?;
            let plan = sync::plan(
                &c,
                &PlanOptions {
                    only,
                    include_solutions: with_solutions,
                },
            );
            let shown: Vec<_> = plan
                .iter()
                .filter(|p| verbose || p.action != Action::UpToDate)
                .cloned()
                .collect();
            print!("{}", sync::render_plan(&shown));
            let count = |a: fn(&Action) -> bool| plan.iter().filter(|p| a(&p.action)).count();
            println!(
                "{} deps: {} up to date, {} clone, {} fetch, {} checkout, {} blocked, {} cipd, {} gcs",
                plan.len(),
                count(|a| *a == Action::UpToDate),
                count(|a| *a == Action::Clone),
                count(|a| *a == Action::Fetch),
                count(|a| *a == Action::Checkout),
                count(|a| matches!(a, Action::Blocked(_))),
                count(|a| *a == Action::Cipd),
                count(|a| *a == Action::Gcs),
            );
            if !apply {
                println!("dry run; pass --apply to execute");
                return Ok(0);
            }
            let done = sync::execute(&plan, jobs, &|line| println!("{line}"));
            let failed = done.iter().filter(|d| d.result.is_err()).count();
            if cipd && plan.iter().any(|p| p.action == Action::Cipd) {
                let ensure = sync::cipd_ensure_file(&c, &plan);
                let file = c.root_dir.join(".cipd").join("ay_ensure_file.txt");
                std::fs::create_dir_all(file.parent().unwrap_or(&c.root_dir))?;
                std::fs::write(&file, ensure)?;
                let code = run_cipd(&[
                    "ensure",
                    "-root",
                    &c.root_dir.to_string_lossy(),
                    "-ensure-file",
                    &file.to_string_lossy(),
                ]);
                if code != 0 {
                    return Ok(code);
                }
            }
            Ok(if failed == 0 { 0 } else { 1 })
        }
    }
}

/// The official CIPD client from depot_tools (`.cipd_client` / `cipd`).
pub fn run_cipd(args: &[&str]) -> i32 {
    let args: Vec<String> = args.iter().map(|s| s.to_string()).collect();
    match depot_core::DepotTools::run_passthrough("cipd", &args) {
        Ok(c) => c,
        Err(e) => {
            eprintln!("cipd: {e}");
            127
        }
    }
}

fn fetch_cmd(f: Fetch) -> Result<i32> {
    if f.list || f.config.is_none() {
        for n in fetch::config_names() {
            println!("{n}");
        }
        return Ok(0);
    }
    let config = f.config.unwrap_or_default();
    let spec = fetch::spec(&config, &f.props)?;
    let cwd = std::env::current_dir()?;
    if let Some(existing) = find_root(&cwd) {
        return Err(Error::new(format!(
            "Your current directory appears to already contain, or be part of, a checkout ({}). Run `ay gclient sync` instead.",
            existing.display()
        )));
    }
    let cache = std::env::var("GIT_CACHE_PATH").ok();
    let text = fetch::gclient_text(&spec.spec, cache.as_deref());
    println!(
        "# .gclient for {config} (root: {})\n{text}",
        if spec.root.is_empty() {
            "."
        } else {
            &spec.root
        }
    );
    if !f.apply {
        println!("dry run; pass --apply to write .gclient and sync");
        return Ok(0);
    }
    std::fs::write(cwd.join(".gclient"), &text)?;
    // Solutions first, then the dependencies their DEPS files declare.
    let c = Client::load(&cwd, Options::default())?;
    let plan = sync::plan(
        &c,
        &PlanOptions {
            include_solutions: true,
            only: c.solutions().map(|s| s.name.clone()).collect(),
        },
    );
    let done = sync::execute(&plan, f.jobs, &|l| println!("{l}"));
    if done.iter().any(|d| d.result.is_err()) {
        return Ok(1);
    }
    let c = Client::load(&cwd, Options::default())?;
    let plan = sync::plan(&c, &PlanOptions::default());
    let done = sync::execute(&plan, f.jobs, &|l| println!("{l}"));
    Ok(if done.iter().all(|d| d.result.is_ok()) {
        0
    } else {
        1
    })
}
