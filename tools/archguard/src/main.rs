use archguard::{AuditConfig, RULES, VERSION, format_human_report, run_audit};
use argh::FromArgs;
use std::path::PathBuf;
use std::process;

#[derive(FromArgs, PartialEq, Debug)]
/// Sovereign Monorepo Architecture, Domain-Purity, Boundary & Hygiene Auditor (archguard)
struct Cli {
    #[argh(subcommand)]
    sub: Option<SubCmd>,

    /// target monorepo root directory (default: C:\src)
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
}

#[derive(FromArgs, PartialEq, Debug)]
/// run full architectural & domain-purity verification across the monorepo
#[argh(subcommand, name = "check")]
struct CheckCmd {
    /// target monorepo root directory (default: C:\src)
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

fn default_root() -> PathBuf {
    if cfg!(windows) {
        PathBuf::from(r"C:\src")
    } else {
        PathBuf::from("/src")
    }
}

fn main() {
    // Support `--version` directly before argh if passed alone
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
                println!("{:<10} {:<8} {:<28} {}", "RULE", "DEFAULT", "CATEGORY", "SUMMARY");
                println!("{}", "-".repeat(100));
                for rule in RULES {
                    println!(
                        "{:<10} {:<8} {:<28} {}",
                        rule.id,
                        rule.default_severity.as_str(),
                        rule.category,
                        rule.summary
                    );
                }
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
