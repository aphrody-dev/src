//! `ay cipd`: `ensure` runs in Rust, every other subcommand (and any `ensure` flag not
//! handled here) goes to the official client from depot_tools. `CIPD_FORCE_GO=1` sends
//! everything to the Go client.

use std::io::Read;
use std::path::PathBuf;

use crate::{EnsureOptions, LogLevel, ensure, ensure_file};

#[derive(Debug, Default, PartialEq, Eq)]
struct EnsureArgs {
    root: Option<String>,
    ensure_file: Option<String>,
    service_url: Option<String>,
    max_threads: Option<usize>,
    log_level: Option<LogLevel>,
    json_output: Option<String>,
}

/// Go `flag` syntax (`-name value`, `-name=value`, `--name`). `None` when an argument is not
/// one of ours, so the Go client handles it.
fn parse_ensure(args: &[String]) -> Option<EnsureArgs> {
    let mut a = EnsureArgs::default();
    let mut it = args.iter();
    while let Some(arg) = it.next() {
        let flag = arg.strip_prefix("--").or_else(|| arg.strip_prefix('-'))?;
        let (name, inline) = match flag.split_once('=') {
            Some((n, v)) => (n, Some(v.to_string())),
            None => (flag, None),
        };
        let value = match inline {
            Some(v) => v,
            None => it.next()?.clone(),
        };
        match name {
            "root" => a.root = Some(value),
            "ensure-file" => a.ensure_file = Some(value),
            "service-url" => a.service_url = Some(value),
            "max-threads" => a.max_threads = Some(value.parse().ok()?),
            "log-level" => a.log_level = Some(LogLevel::parse(&value)?),
            "json-output" => a.json_output = Some(value),
            // The Go client's instance cache; ours is depot-cas.
            "cache-dir" => {}
            _ => return None,
        }
    }
    Some(a)
}

/// Run `cipd <args>`: `ensure` here, the rest through `go_client` (the caller's way to run
/// the official client, e.g. `depot_core::DepotTools::run_passthrough("cipd", args)`).
pub fn run(args: &[String], go_client: &dyn Fn(&[String]) -> i32) -> i32 {
    let force_go = std::env::var_os("CIPD_FORCE_GO").is_some_and(|v| !v.is_empty() && v != "0");
    if !force_go
        && args.first().map(String::as_str) == Some("ensure")
        && let Some(a) = parse_ensure(&args[1..])
    {
        return run_ensure(a, args, go_client);
    }
    go_client(args)
}

fn run_ensure(a: EnsureArgs, args: &[String], go_client: &dyn Fn(&[String]) -> i32) -> i32 {
    let Some(path) = a.ensure_file.as_deref() else {
        eprintln!("Error: '-ensure-file' is required.");
        return 1;
    };
    let text = if path == "-" {
        let mut s = String::new();
        if let Err(e) = std::io::stdin().read_to_string(&mut s) {
            eprintln!("Error: reading the ensure file from stdin: {e}");
            return 1;
        }
        s
    } else {
        match std::fs::read_to_string(path) {
            Ok(s) => s,
            Err(e) => {
                eprintln!("Error: opening the ensure file {path}: {e}");
                return 1;
            }
        }
    };
    let file = match ensure_file::parse(&text) {
        Ok(f) => f,
        Err(e) => return fail(&a, &e.to_string()),
    };
    if file.resolved_versions.is_some() {
        // $ResolvedVersions files are only read by the Go client.
        return go_client(args);
    }
    let mut opts = EnsureOptions::new(PathBuf::from(a.root.as_deref().unwrap_or(".")));
    opts.service_url = a.service_url.clone();
    if let Some(n) = a.max_threads.filter(|n| *n > 0) {
        opts.max_threads = n;
    }
    opts.log = a.log_level.unwrap_or_default();
    match ensure(&file, &opts) {
        Ok(report) => {
            if let Some(out) = &a.json_output {
                let body = serde_json::to_string_pretty(&report.json()).unwrap_or_default();
                if let Err(e) = std::fs::write(out, body) {
                    eprintln!("Error: writing {out}: {e}");
                    return 1;
                }
            }
            0
        }
        Err(e) => fail(&a, &e.to_string()),
    }
}

fn fail(a: &EnsureArgs, msg: &str) -> i32 {
    eprintln!("Error: {msg}");
    if let Some(out) = &a.json_output {
        let body = serde_json::json!({ "error": msg, "result": null });
        let _ = std::fs::write(out, serde_json::to_string_pretty(&body).unwrap_or_default());
    }
    1
}

#[cfg(test)]
mod tests {
    use super::*;

    fn s(v: &[&str]) -> Vec<String> {
        v.iter().map(|x| x.to_string()).collect()
    }

    #[test]
    fn ensure_flags() {
        let a = parse_ensure(&s(&[
            "-root",
            "C:/b",
            "--ensure-file=e.txt",
            "-log-level",
            "error",
            "-max-threads",
            "4",
            "-json-output",
            "o.json",
        ]))
        .unwrap();
        assert_eq!(a.root.as_deref(), Some("C:/b"));
        assert_eq!(a.ensure_file.as_deref(), Some("e.txt"));
        assert_eq!(a.log_level, Some(LogLevel::Error));
        assert_eq!(a.max_threads, Some(4));
        assert_eq!(a.json_output.as_deref(), Some("o.json"));
        // Unknown flags, positional arguments and bad values go to the Go client.
        assert_eq!(parse_ensure(&s(&["-root", "x", "-verbose"])), None);
        assert_eq!(parse_ensure(&s(&["pos"])), None);
        assert_eq!(parse_ensure(&s(&["-log-level", "loud"])), None);
        assert_eq!(parse_ensure(&s(&["-root"])), None);
    }
}
