//! `aphrody` command-line entry point. Architecture stage: only `--version` and `--help`.

use std::process::ExitCode;

const NAME: &str = env!("CARGO_PKG_NAME");
const VERSION: &str = env!("CARGO_PKG_VERSION");

fn usage() -> String {
    format!(
        "{NAME} {VERSION}\n\
         \n\
         Usage: {NAME} [OPTIONS]\n\
         \n\
         Options:\n  \
           -V, --version  Print version\n  \
           -h, --help     Print help\n\
         \n\
         Commands:\n  \
           x conformance [--fetch] [suite...]  Write conformance JSON results\n\
         \n\
         Status: skeleton. Commands run, dev, build, serve, deploy are planned (docs/ROADMAP.md).\n"
    )
}

fn run(args: &[String]) -> Result<String, String> {
    match args.first().map(String::as_str) {
        Some("-V" | "--version") => Ok(format!("{NAME} {VERSION}\n")),
        None | Some("-h" | "--help") => Ok(usage()),
        Some("x") if args.get(1).map(String::as_str) == Some("channels") => channels(&args[2..]),
        Some("x") if args.get(1).map(String::as_str) == Some("conformance") => {
            conformance(&args[2..])
        }
        Some(other) => Err(format!("error: unknown argument '{other}'\n\n{}", usage())),
    }
}

/// `aphrody x conformance [--fetch] [suite...]`: write `conformance/results/<suite>.json`
/// for the named suites (all when none). M0 reports zero totals.
fn conformance(args: &[String]) -> Result<String, String> {
    use aphrody_conformance as c;
    let root = std::env::current_dir().map_err(|e| e.to_string())?;
    let pins = c::Pins::load(&root)?;
    let fetch = args.iter().any(|a| a == "--fetch");
    let ids: Vec<&str> = args
        .iter()
        .map(String::as_str)
        .filter(|a| *a != "--fetch")
        .collect();
    let suites: Vec<&c::Suite> = if ids.is_empty() {
        pins.suite.iter().collect()
    } else {
        ids.iter()
            .map(|id| pins.suite(id))
            .collect::<Result<_, _>>()?
    };
    let target = format!("{}-{}", std::env::consts::ARCH, std::env::consts::OS);
    let mut out = String::new();
    for s in suites {
        if fetch {
            c::fetch(&root, &pins, s)?;
        }
        let r = c::run(&root, &pins, s, &target);
        let p = c::write_result(&root, &r)?;
        out += &format!("{} {}/{} -> {}\n", r.suite, r.passed, r.total, p.display());
    }
    Ok(out)
}

/// `aphrody x channels [platform]`: write third_party/chrome-channels.toml (Chrome Stable/Beta/Dev/Canary).
fn channels(args: &[String]) -> Result<String, String> {
    let platform = args.first().map_or("Linux", String::as_str);
    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map_err(|e| e.to_string())?
        .as_secs();
    let toml = aphrody_conformance::channels::fetch_toml(platform, &format!("unix:{now}"))?;
    let path = std::env::current_dir()
        .map_err(|e| e.to_string())?
        .join("third_party/chrome-channels.toml");
    std::fs::write(&path, &toml).map_err(|e| format!("{}: {e}", path.display()))?;
    Ok(toml)
}

fn main() -> ExitCode {
    let args: Vec<String> = std::env::args().skip(1).collect();
    match run(&args) {
        Ok(out) => {
            print!("{out}");
            ExitCode::SUCCESS
        }
        Err(err) => {
            eprint!("{err}");
            ExitCode::from(2)
        }
    }
}

#[cfg(test)]
mod tests {
    use super::run;

    #[test]
    fn version_flag() {
        let out = run(&["--version".into()]).unwrap();
        assert_eq!(out, format!("aphrody {}\n", env!("CARGO_PKG_VERSION")));
        assert_eq!(run(&["-V".into()]).unwrap(), out);
    }

    #[test]
    fn unknown_flag_is_error() {
        assert!(run(&["--nope".into()]).is_err());
    }
}
