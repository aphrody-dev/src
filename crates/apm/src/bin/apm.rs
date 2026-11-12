//! `apm` command-line entry point.

use std::path::PathBuf;
use std::process::ExitCode;

use aphrody_apm::compile;
use aphrody_apm::install;
use clap::Parser;
use clap::Subcommand;

#[derive(Parser)]
#[command(
    name = "apm",
    version,
    about = "Agent Package Manager (Rust port of microsoft/apm)"
)]
struct Cli {
    /// Project root (defaults to the current directory).
    #[arg(long, global = true)]
    root: Option<PathBuf>,
    #[command(subcommand)]
    command: Cmd,
}

#[derive(Subcommand)]
enum Cmd {
    /// Resolve dependencies, deploy primitives and write apm.lock.yaml.
    Install {
        /// Target(s): claude, copilot (alias vscode/agents), agent-skills, all. Comma-separated allowed.
        #[arg(long, short)]
        target: Vec<String>,
        /// Ignore locked commits and re-resolve refs.
        #[arg(long)]
        update: bool,
        /// Also install devDependencies.
        #[arg(long)]
        dev: bool,
    },
    /// Generate AGENTS.md (copilot) / CLAUDE.md (claude) from instructions.
    Compile {
        #[arg(long, short)]
        target: Vec<String>,
    },
}

fn main() -> ExitCode {
    let cli = Cli::parse();
    // The CLI (not the library) legitimately defaults to the process working directory.
    #[allow(clippy::disallowed_methods)]
    let root = match cli.root.map_or_else(std::env::current_dir, Ok) {
        Ok(r) => r,
        Err(e) => {
            eprintln!("error: {e}");
            return ExitCode::FAILURE;
        }
    };
    let result = match cli.command {
        Cmd::Install {
            target,
            update,
            dev,
        } => install::install(
            &root,
            &install::InstallOptions {
                targets: target,
                update,
                include_dev: dev,
            },
        )
        .map(|r| {
            println!(
                "Installed {} package(s) for target(s) {}: {} file(s) deployed",
                r.packages.len(),
                r.targets.join(", "),
                r.deployed_files
            );
            for t in &r.unsupported_targets {
                eprintln!("warning: target '{t}' is not supported by this port; skipped");
            }
            if !r.removed.is_empty() {
                println!("Removed {} stale path(s)", r.removed.len());
            }
        }),
        Cmd::Compile { target } => compile::compile(&root, &target).map(|files| {
            for f in files {
                println!("Wrote {}", f.display());
            }
        }),
    };
    match result {
        Ok(()) => ExitCode::SUCCESS,
        Err(e) => {
            eprintln!("error: {e:#}");
            ExitCode::FAILURE
        }
    }
}
