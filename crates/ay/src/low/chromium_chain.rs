//! `ay chromium`: the Chromium build chain (depot_tools, gclient, gn, autoninja) of the gclient
//! checkout on the build host. Builds and syncs run only there: on fr1, `ay chromium` runs the
//! steps itself; anywhere else it sends the same script to fr1 over `ay ssh` (crate
//! aphrody-remote, russh). The local tools of the PC checkout `third_party/chromium` stay where
//! they are: `ay gclient`, `ay gn`, `ay ninja`, `ay fetch` (docs/DEPOT_TOOLS_RUST.md).
//!
//! Settings come from `infra/chromium-factory/factory.toml` (root, depot_tools, out_name, target,
//! args), the file the factory on fr1 reads too; the compiler is the checkout's own clang, lld and
//! rustc (`ay chromium toolchain` shows them next to ay's rustc, docs/llvm/UNIFIED-TOOLCHAIN.md).

use std::path::{Path, PathBuf};

const EXAMPLES: &str = "\
Examples:
  ay chromium status                     checkout version, out dirs, depot_tools, load (on fr1)
  ay chromium sync                       gclient sync -D --force --nohooks --no-history --with_tags, runhooks
  ay chromium gn                         gn gen out/<out_name> with infra/chromium-factory/args/<out_name>.gn
  ay chromium gn args out/labs_agent --list=is_official_build
  ay chromium build                      autoninja -C out/<out_name> <target> (headless_shell)
  ay chromium build d8 dawn_end2end_tests --detach
  ay chromium autoninja -C out/labs_agent chrome
  ay chromium toolchain                  clang, lld and rustc of the checkout vs ay's rustc
  ay chromium --dry-run build            print the script and the host, run nothing";

#[derive(clap::Args, Debug, PartialEq)]
#[command(after_help = EXAMPLES)]
pub struct ChromiumArgs {
    /// Fleet node that builds Chromium
    #[arg(long, global = true, default_value = "fr1")]
    pub host: String,
    /// Output directory name under src/out (default: out_name of factory.toml)
    #[arg(long, global = true)]
    pub out: Option<String>,
    /// Print the host and the script, run nothing
    #[arg(long, global = true)]
    pub dry_run: bool,
    /// Run in the background on the host (nohup, log under the checkout root); print the log path
    #[arg(long, global = true)]
    pub detach: bool,
    /// Monorepo root (default: $SRC_ROOT, else the enclosing checkout)
    #[arg(long, global = true)]
    pub root: Option<PathBuf>,
    #[command(subcommand)]
    pub cmd: ChromiumCmd,
}

#[derive(clap::Subcommand, Debug, PartialEq)]
pub enum ChromiumCmd {
    /// Version of the checkout, out dirs, depot_tools tools, disk and load
    Status,
    /// gclient sync (extra flags appended) then gclient runhooks
    Sync {
        /// Skip `gclient runhooks`
        #[arg(long)]
        no_hooks: bool,
        #[arg(trailing_var_arg = true, allow_hyphen_values = true)]
        extra: Vec<String>,
    },
    /// `gn gen out/<out>` (args.gn from the factory when missing); with arguments, `gn <args>`
    Gn {
        #[arg(trailing_var_arg = true, allow_hyphen_values = true)]
        args: Vec<String>,
    },
    /// gn gen when needed, then autoninja -C out/<out> <targets> (default: target of factory.toml)
    Build { targets: Vec<String> },
    /// autoninja with these arguments (-C out/<out> added when absent)
    Autoninja {
        #[arg(trailing_var_arg = true, allow_hyphen_values = true)]
        args: Vec<String>,
    },
    /// The checkout's clang, lld and rustc, and their LLVM next to the host's rustc
    Toolchain,
}

/// Values of `infra/chromium-factory/factory.toml` that the chain uses.
#[derive(Debug, Clone, PartialEq)]
pub struct Factory {
    pub root: String,
    pub factory: String,
    pub depot_tools: String,
    pub out_name: String,
    pub target: String,
    pub args: String,
}

impl Default for Factory {
    fn default() -> Self {
        Self {
            root: "/srv/chromium".into(),
            factory: "/srv/chromium/factory".into(),
            depot_tools: "$HOME/depot_tools".into(),
            out_name: "labs_agent".into(),
            target: "headless_shell".into(),
            args: "args/labs_agent.gn".into(),
        }
    }
}

impl Factory {
    /// Top-level `key = "value"` pairs (before the first table); unknown keys are ignored.
    pub fn parse(text: &str) -> Self {
        let mut f = Self::default();
        for line in text.lines() {
            let line = line.trim();
            if line.starts_with('[') {
                break;
            }
            let Some((k, v)) = line.split_once('=') else { continue };
            let v = v.trim();
            let Some(v) = v.strip_prefix('"').and_then(|r| r.split_once('"')).map(|(s, _)| s.to_string()) else { continue };
            match k.trim() {
                "root" => f.root = v,
                "factory" => f.factory = v,
                "depot_tools" => f.depot_tools = v,
                "out_name" => f.out_name = v,
                "target" => f.target = v,
                "args" => f.args = v,
                _ => {}
            }
        }
        f
    }

    pub fn load(repo: &Path) -> Self {
        std::fs::read_to_string(repo.join("infra/chromium-factory/factory.toml")).map(|t| Self::parse(&t)).unwrap_or_default()
    }
}

/// POSIX single-quoted word.
pub fn sh_quote(s: &str) -> String {
    if !s.is_empty() && s.bytes().all(|b| b.is_ascii_alphanumeric() || b"-_./=:,+@%".contains(&b)) {
        s.to_string()
    } else {
        format!("'{}'", s.replace('\'', r"'\''"))
    }
}

fn words(v: &[String]) -> String {
    v.iter().map(|a| sh_quote(a)).collect::<Vec<_>>().join(" ")
}

/// Path that may start with `$HOME`: kept unquoted up to the first `/` so the shell expands it.
fn sh_path(p: &str) -> String {
    match p.strip_prefix("$HOME") {
        Some(rest) => format!("\"$HOME\"{}", sh_quote(rest)),
        None => sh_quote(p),
    }
}

/// The bash script for one command.
pub fn script(f: &Factory, out: &str, cmd: &ChromiumCmd) -> String {
    let src = format!("{}/src", f.root);
    let out_dir = format!("out/{out}");
    let args_file = format!("{}/{}", f.factory, f.args);
    let gen_cmd = format!(
        "mkdir -p {o} && {{ [ -f {o}/args.gn ] || cp {a} {o}/args.gn; }} && gn gen {o}",
        o = sh_quote(&out_dir),
        a = sh_quote(&args_file)
    );
    let head = format!(
        "set -euo pipefail; export PATH={dt}:\"$PATH\" DEPOT_TOOLS_UPDATE=0 DEPOT_TOOLS_METRICS=0; cd {src}",
        dt = sh_path(&f.depot_tools),
        src = sh_quote(&src)
    );
    let body = match cmd {
        ChromiumCmd::Status => format!(
            "echo \"chromium $(paste -sd. < <(cut -d= -f2 chrome/VERSION))  $(git log -1 --format='%h %cs')\"; \
             echo \"out: $(ls out 2>/dev/null | tr '\\n' ' ')\"; \
             for t in gclient gn autoninja ninja siso; do printf '%s: ' $t; command -v $t || echo missing; done; \
             df -h {root} | tail -1; uptime",
            root = sh_quote(&f.root)
        ),
        ChromiumCmd::Sync { no_hooks, extra } => {
            let mut s = format!("cd .. && gclient sync -D --force --nohooks --no-history --with_tags {}", words(extra));
            if !no_hooks {
                s.push_str(" && gclient runhooks");
            }
            s
        }
        ChromiumCmd::Gn { args } if args.is_empty() => gen_cmd,
        ChromiumCmd::Gn { args } => format!("gn {}", words(args)),
        ChromiumCmd::Build { targets } => {
            let t = if targets.is_empty() { vec![f.target.clone()] } else { targets.clone() };
            format!(
                "{{ [ -f {o}/build.ninja ] || {{ {gen_cmd}; }}; }} && nice -n 10 autoninja -C {o} {t}",
                o = sh_quote(&out_dir),
                t = words(&t)
            )
        }
        ChromiumCmd::Autoninja { args } => {
            let has_c = args.iter().any(|a| a == "-C" || a.starts_with("-C"));
            let dir = if has_c { String::new() } else { format!("-C {} ", sh_quote(&out_dir)) };
            format!("nice -n 10 autoninja {dir}{}", words(args))
        }
        ChromiumCmd::Toolchain => "for b in third_party/llvm-build/Release+Asserts/bin/clang third_party/llvm-build/Release+Asserts/bin/ld.lld; do \
             [ -x \"$b\" ] && echo \"$b: $(\"$b\" --version | head -1)\" || echo \"$b: missing\"; done; \
             r=third_party/rust-toolchain/bin/rustc; [ -x $r ] && $r -vV | sed -n 's/^\\(release\\|commit-hash\\|LLVM version\\): /checkout rustc \\1: /p' || echo \"$r: missing\"; \
             command -v rustc >/dev/null && rustc -vV | sed -n 's/^\\(release\\|LLVM version\\): /host rustc \\1: /p' || true"
            .to_string(),
    };
    format!("{head}; {body}")
}

/// Wrap a script to run detached on the host, logging to `<root>/ay-chromium-<name>.log`.
pub fn detached(f: &Factory, name: &str, script: &str) -> String {
    let log = format!("{}/ay-chromium-{name}.log", f.root);
    format!(
        "nohup setsid bash -c {s} > {l} 2>&1 < /dev/null & echo \"started pid $! log {l}\"",
        s = sh_quote(script),
        l = sh_quote(&log)
    )
}

fn name(cmd: &ChromiumCmd) -> &'static str {
    match cmd {
        ChromiumCmd::Status => "status",
        ChromiumCmd::Sync { .. } => "sync",
        ChromiumCmd::Gn { .. } => "gn",
        ChromiumCmd::Build { .. } => "build",
        ChromiumCmd::Autoninja { .. } => "autoninja",
        ChromiumCmd::Toolchain => "toolchain",
    }
}

/// This machine is the build host when it holds the gclient root of factory.toml.
fn is_build_host(f: &Factory) -> bool {
    cfg!(unix) && Path::new(&f.root).join(".gclient").is_file()
}

pub fn run(a: ChromiumArgs) -> i32 {
    let repo = a.root.clone().unwrap_or_else(crate::repo_root);
    let f = Factory::load(&repo);
    let out = a.out.clone().unwrap_or_else(|| f.out_name.clone());
    let mut s = script(&f, &out, &a.cmd);
    if a.detach {
        s = detached(&f, name(&a.cmd), &s);
    }
    let local = is_build_host(&f);
    if a.dry_run {
        println!("host: {}", if local { "local" } else { a.host.as_str() });
        println!("{s}");
        return 0;
    }
    if local {
        return crate::status_of(std::process::Command::new("bash").arg("-c").arg(&s));
    }
    let remote_cmd = format!("bash -c {}", sh_quote(&s));
    remote::run("ay chromium", &["exec".to_string(), a.host.clone(), "--".to_string(), remote_cmd], &repo)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn factory_toml_top_level_keys() {
        let f = Factory::parse("root = \"/r\"\nout_name = \"x\"   # c\ndepot_tools = \"/d\"\n[reapi]\nroot = \"/no\"\n");
        assert_eq!((f.root.as_str(), f.out_name.as_str(), f.depot_tools.as_str()), ("/r", "x", "/d"));
        assert_eq!(f.target, "headless_shell");
        let repo = Path::new(env!("CARGO_MANIFEST_DIR")).join("../..");
        if repo.join("infra/chromium-factory/factory.toml").is_file() {
            assert_eq!(Factory::load(&repo).root, "/srv/chromium");
        }
    }

    #[test]
    fn quoting() {
        assert_eq!(sh_quote("out/labs_agent"), "out/labs_agent");
        assert_eq!(sh_quote("a b"), "'a b'");
        assert_eq!(sh_quote("it's"), r"'it'\''s'");
        assert_eq!(sh_path("$HOME/depot_tools"), "\"$HOME\"/depot_tools");
    }

    #[test]
    fn scripts() {
        let f = Factory::default();
        let build = script(&f, "labs_agent", &ChromiumCmd::Build { targets: vec![] });
        assert!(build.starts_with("set -euo pipefail; export PATH=\"$HOME\"/depot_tools:\"$PATH\""), "{build}");
        assert!(build.contains("cd /srv/chromium/src;"));
        assert!(build.ends_with("nice -n 10 autoninja -C out/labs_agent headless_shell"), "{build}");
        assert!(build.contains("cp /srv/chromium/factory/args/labs_agent.gn out/labs_agent/args.gn"));
        let sync = script(&f, "x", &ChromiumCmd::Sync { no_hooks: true, extra: vec!["--jobs=4".into()] });
        assert!(sync.ends_with("cd .. && gclient sync -D --force --nohooks --no-history --with_tags --jobs=4"));
        let an = script(&f, "x", &ChromiumCmd::Autoninja { args: vec!["-C".into(), "out/y".into(), "d8".into()] });
        assert!(an.ends_with("nice -n 10 autoninja -C out/y d8"));
        assert!(script(&f, "x", &ChromiumCmd::Autoninja { args: vec!["d8".into()] }).ends_with("autoninja -C out/x d8"));
        assert!(script(&f, "x", &ChromiumCmd::Gn { args: vec!["args".into(), "out/x".into(), "--list".into()] }).ends_with("; gn args out/x --list"));
        let d = detached(&f, "build", "echo 'a'");
        assert!(d.starts_with("nohup setsid bash -c 'echo '\\''a'\\''' > /srv/chromium/ay-chromium-build.log"), "{d}");
    }
}
