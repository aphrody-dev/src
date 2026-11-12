use archguard::{
    build_monorepo_graph, format_human_report, run_audit, AuditConfig, RULES, VERSION,
};
use argh::FromArgs;
use std::fs;
use std::path::PathBuf;
use std::process;

#[derive(FromArgs, PartialEq, Debug)]
/// Sovereign Monorepo Architecture, Domain-Purity, Boundary & Hygiene Auditor (archguard)
struct Cli {
    #[argh(subcommand)]
    sub: Option<SubCmd>,

    /// target monorepo root directory (default: $SRC_ROOT, else nearest src.lock.json ancestor, else C:\src or /src)
    #[argh(option)]
    root: Option<String>,

    /// emit structured deterministic JSON report
    #[argh(switch)]
    json: bool,

    /// print compact one-line summary
    #[argh(switch)]
    quiet: bool,

    /// treat warnings as hard errors
    #[argh(switch)]
    strict: bool,

    /// filter to a specific rule ID (e.g. ARCH-001) or category
    #[argh(option)]
    rule: Option<String>,

    /// print version and exit
    #[argh(switch, short = 'v')]
    version: bool,
}

#[derive(FromArgs, PartialEq, Debug)]
#[argh(subcommand)]
enum SubCmd {
    Check(CheckCmd),
    Rules(RulesCmd),
    Graph(GraphCmd),
}

#[derive(FromArgs, PartialEq, Debug)]
/// run full architectural & domain-purity verification across the monorepo
#[argh(subcommand, name = "check")]
struct CheckCmd {
    /// target monorepo root directory (default: $SRC_ROOT, else nearest src.lock.json ancestor, else C:\src or /src)
    #[argh(option)]
    root: Option<String>,

    /// emit structured deterministic JSON report
    #[argh(switch)]
    json: bool,

    /// print compact one-line summary
    #[argh(switch)]
    quiet: bool,

    /// treat warnings as hard errors
    #[argh(switch)]
    strict: bool,

    /// filter to a specific rule ID (e.g. ARCH-001) or category
    #[argh(option)]
    rule: Option<String>,
}

#[derive(FromArgs, PartialEq, Debug)]
/// list all enforced architectural rules and severity levels
#[argh(subcommand, name = "rules")]
struct RulesCmd {
    /// emit rules list as JSON
    #[argh(switch)]
    json: bool,
}

#[derive(FromArgs, PartialEq, Debug)]
/// generate monorepo architecture dependency graph (Mermaid, DOT, or JSON)
#[argh(subcommand, name = "graph")]
struct GraphCmd {
    /// target monorepo root directory (default: $SRC_ROOT, else nearest src.lock.json ancestor, else C:\src or /src)
    #[argh(option)]
    root: Option<String>,

    /// output format: mermaid (default), dot, or json
    #[argh(option, default = "String::from(\"mermaid\")")]
    format: String,

    /// optional file path to write output to
    #[argh(option, short = 'o')]
    output: Option<String>,
}

/// Resolution order: `$SRC_ROOT`, then the nearest ancestor of the current
/// directory holding `src.lock.json` (works in any checkout or container), then
/// the platform default.
fn default_root() -> PathBuf {
    if let Some(root) = std::env::var_os("SRC_ROOT").filter(|v| !v.is_empty()) {
        return PathBuf::from(root);
    }
    if let Ok(cwd) = std::env::current_dir() {
        if let Some(found) = cwd.ancestors().find(|dir| dir.join("src.lock.json").is_file()) {
            return found.to_path_buf();
        }
    }
    if cfg!(windows) {
        PathBuf::from(r"C:\src")
    } else {
        PathBuf::from("/src")
    }
}

fn main() {
    let raw_args: Vec<String> = std::env::args().skip(1).collect();
    if raw_args.iter().any(|a| a == "--version" || a == "-V") {
        println!("archguard v{VERSION} (Rust 2024 Sovereign Monorepo Architecture Gate)");
        return;
    }

    let cli: Cli = argh::from_env();
    if cli.version {
        println!("archguard v{VERSION} (Rust 2024 Sovereign Monorepo Architecture Gate)");
        return;
    }

    match cli.sub {
        Some(SubCmd::Rules(r)) => {
            if r.json || cli.json {
                println!(
                    "{}",
                    serde_json::to_string_pretty(&RULES).unwrap_or_else(|_| "[]".into())
                );
            } else {
                println!("ARCHGUARD v{VERSION} — Enforced Architectural Rules:");
                println!("{:<10} {:<8} {:<36} {}", "RULE", "DEFAULT", "CATEGORY", "SUMMARY");
                println!("{}", "-".repeat(110));
                for rule in RULES {
                    println!(
                        "{:<10} {:<8} {:<36} {}",
                        rule.id,
                        rule.default_severity.as_str(),
                        rule.category,
                        rule.summary
                    );
                }
            }
        }
        Some(SubCmd::Graph(g)) => {
            let root_path = g.root.or(cli.root).map(PathBuf::from).unwrap_or_else(default_root);
            let graph = build_monorepo_graph(&root_path);
            let rendered = match g.format.to_ascii_lowercase().as_str() {
                "dot" => graph.to_dot(),
                "json" => graph.to_json(),
                _ => graph.to_mermaid(),
            };

            if let Some(out_file) = g.output {
                let out_p = PathBuf::from(out_file);
                if let Some(parent) = out_p.parent() {
                    let _ = fs::create_dir_all(parent);
                }
                if let Err(e) = fs::write(&out_p, &rendered) {
                    eprintln!("Error writing graph output to {}: {}", out_p.display(), e);
                    process::exit(1);
                }
                println!("Graph written to {}", out_p.display());
            } else {
                print!("{rendered}");
            }
        }
        Some(SubCmd::Check(c)) => {
            execute_check(
                c.root.or(cli.root),
                c.json || cli.json,
                c.quiet || cli.quiet,
                c.strict || cli.strict,
                c.rule.or(cli.rule),
            );
        }
        None => {
            execute_check(cli.root, cli.json, cli.quiet, cli.strict, cli.rule);
        }
    }
}

fn execute_check(
    root: Option<String>,
    json: bool,
    quiet: bool,
    strict: bool,
    only_rule: Option<String>,
) {
    let config = AuditConfig {
        root: root.map(PathBuf::from).unwrap_or_else(default_root),
        strict,
        only_rule,
        check_docs_emojis: true,
    };

    let report = run_audit(&config);

    if json {
        println!(
            "{}",
            serde_json::to_string_pretty(&report).unwrap_or_else(|_| "{}".into())
        );
    } else if quiet {
        println!(
            "archguard v{}: {} ({} scanned, {} errors, {} warnings, {:.1}ms)",
            report.version,
            if report.clean { "PASS" } else { "FAIL" },
            report.scanned_files,
            report.error_count,
            report.warning_count,
            report.duration_ms
        );
    } else {
        print!("{}", format_human_report(&report));
    }

    if !report.clean {
        process::exit(1);
    }
}
