//! `ay ssh`: exec, cp, hosts, check.

use std::path::{Path, PathBuf};
use std::time::{Duration, Instant};

use anyhow::{Result, anyhow, bail};
use clap::{Parser, Subcommand};

use crate::config::{HostConfig, SshConfig};
use crate::fleet::{self, Node, Target};
use crate::session::{CONNECT_FAILURE, ConnectOptions, Output, Session};

#[derive(Parser, Debug)]
#[command(about = "Pure-Rust SSH client for the fleet (no OpenSSH binary)")]
struct Cli {
    #[command(subcommand)]
    cmd: Cmd,
}

#[derive(clap::Args, Debug, Clone, Default)]
struct Common {
    /// Trust and record host keys missing from known_hosts (a mismatch is still refused)
    #[arg(long, global = true)]
    accept_new: bool,
    /// Connect timeout in seconds when ~/.ssh/config sets no ConnectTimeout
    #[arg(long, global = true, default_value_t = 10)]
    timeout: u64,
    /// Remote user (overrides ~/.ssh/config)
    #[arg(short = 'l', long, global = true)]
    user: Option<String>,
}

#[derive(Subcommand, Debug)]
enum Cmd {
    /// Run a command on one or more hosts: `exec <host|all|a,b> -- <cmd...>`
    Exec {
        /// Node name (usa, fr1, fr2), ssh alias (prd, vps, cdn), `all`, or a comma list
        targets: String,
        /// Command and arguments, joined with spaces as ssh(1) does
        #[arg(required = true, trailing_var_arg = true, allow_hyphen_values = true)]
        command: Vec<String>,
        #[command(flatten)]
        common: Common,
    },
    /// Copy over SFTP: `cp <local> <host>:<path>` or `cp <host>:<path> <local>`
    Cp {
        src: String,
        dst: String,
        #[command(flatten)]
        common: Common,
    },
    /// List fleet nodes (deploy.toml) and their resolved ssh settings
    Hosts,
    /// Connect, authenticate and run `uname -srm` on every node (or the given targets)
    Check {
        #[arg(default_value = "all")]
        targets: String,
        #[command(flatten)]
        common: Common,
    },
}

impl Common {
    fn options(&self) -> ConnectOptions {
        ConnectOptions {
            accept_new: self.accept_new,
            timeout: Duration::from_secs(self.timeout),
            user: self.user.clone(),
        }
    }
}

/// Everything resolution needs: the fleet and the parsed ssh config.
struct Ctx {
    nodes: Vec<Node>,
    ssh: SshConfig,
}

impl Ctx {
    fn host_for(&self, t: &Target) -> HostConfig {
        let mut h = self.ssh.resolve(&t.alias);
        if h.user.is_none() {
            h.user = t
                .node
                .as_ref()
                .and_then(|n| self.nodes.iter().find(|x| &x.name == n))
                .and_then(|n| n.ssh_user.clone());
        }
        h
    }
}

/// Entry point for `ay ssh`; `root` is the repository root holding deploy.toml.
pub fn run(prog: &str, args: &[String], root: &Path) -> i32 {
    let argv = std::iter::once(prog.to_string()).chain(args.iter().cloned());
    let cli = match Cli::try_parse_from(argv) {
        Ok(c) => c,
        Err(e) => {
            let code = if e.use_stderr() { 2 } else { 0 };
            let _ = e.print();
            return code;
        }
    };
    let nodes = match fleet::load_nodes(root) {
        Ok(n) => n,
        Err(e) => {
            eprintln!("{prog}: {e:#}");
            return 2;
        }
    };
    let ctx = Ctx {
        nodes,
        ssh: SshConfig::load_default(),
    };
    let rt = match tokio::runtime::Builder::new_multi_thread()
        .enable_all()
        .build()
    {
        Ok(rt) => rt,
        Err(e) => {
            eprintln!("{prog}: tokio runtime: {e}");
            return 1;
        }
    };
    let result = rt.block_on(async {
        match cli.cmd {
            Cmd::Exec {
                targets,
                command,
                common,
            } => exec(&ctx, &targets, &command.join(" "), &common).await,
            Cmd::Cp { src, dst, common } => copy(&ctx, &src, &dst, &common).await,
            Cmd::Hosts => {
                hosts(&ctx);
                Ok(0)
            }
            Cmd::Check { targets, common } => check(&ctx, &targets, &common).await,
        }
    });
    match result {
        Ok(code) => code,
        Err(e) => {
            eprintln!("{prog}: {e:#}");
            CONNECT_FAILURE
        }
    }
}

async fn exec(ctx: &Ctx, spec: &str, command: &str, common: &Common) -> Result<i32> {
    let targets = fleet::resolve_targets(spec, &ctx.nodes)?;
    let opts = common.options();
    if targets.len() == 1 {
        let t = &targets[0];
        let session = Session::connect(ctx.host_for(t), &opts).await?;
        let code = session.exec(command, &mut Output::raw()).await?;
        session.close().await;
        return Ok(code);
    }
    let width = targets.iter().map(|t| t.label.len()).max().unwrap_or(0);
    let mut tasks = Vec::new();
    for t in &targets {
        let (host, opts, label, command) = (
            ctx.host_for(t),
            opts.clone(),
            t.label.clone(),
            command.to_string(),
        );
        tasks.push(tokio::spawn(async move {
            let mut out = Output::prefixed(&label, width);
            match Session::connect(host, &opts).await {
                Ok(s) => {
                    let code = match s.exec(&command, &mut out).await {
                        Ok(c) => c,
                        Err(e) => {
                            out.note(&format!("{e:#}"));
                            CONNECT_FAILURE
                        }
                    };
                    s.close().await;
                    code
                }
                Err(e) => {
                    out.note(&format!("{e:#}"));
                    CONNECT_FAILURE
                }
            }
        }));
    }
    let mut first_failure = 0;
    for (t, task) in targets.iter().zip(tasks) {
        let code = task.await.unwrap_or(CONNECT_FAILURE);
        if code != 0 {
            eprintln!("ay ssh: {} exited {code}", t.label);
            if first_failure == 0 {
                first_failure = code;
            }
        }
    }
    Ok(first_failure)
}

/// `host:path` -> Some((host, path)). A single-letter prefix is a Windows drive, not a host.
fn split_remote(spec: &str) -> Option<(&str, &str)> {
    let (host, path) = spec.split_once(':')?;
    if host.len() <= 1 || host.contains(['/', '\\']) {
        return None;
    }
    Some((host, path))
}

async fn copy(ctx: &Ctx, src: &str, dst: &str, common: &Common) -> Result<i32> {
    let opts = common.options();
    match (split_remote(src), split_remote(dst)) {
        (None, Some((spec, path))) => {
            let local = PathBuf::from(src);
            if !local.is_file() {
                bail!("{src}: not a file");
            }
            let mut code = 0;
            for t in fleet::resolve_targets(spec, &ctx.nodes)? {
                let result = async {
                    let s = Session::connect(ctx.host_for(&t), &opts).await?;
                    let r = s.upload(&local, path).await;
                    s.close().await;
                    r
                }
                .await;
                match result {
                    Ok((target, bytes)) => println!(
                        "{} -> {}:{target} ({bytes} bytes)",
                        local.display(),
                        t.label
                    ),
                    Err(e) => {
                        eprintln!("ay ssh: {}: {e:#}", t.label);
                        code = 1;
                    }
                }
            }
            Ok(code)
        }
        (Some((spec, path)), None) => {
            let targets = fleet::resolve_targets(spec, &ctx.nodes)?;
            let [t] = targets.as_slice() else {
                bail!("download takes exactly one source host")
            };
            let s = Session::connect(ctx.host_for(t), &opts).await?;
            let r = s.download(path, Path::new(dst)).await;
            s.close().await;
            let (target, bytes) = r?;
            println!("{}:{path} -> {} ({bytes} bytes)", t.label, target.display());
            Ok(0)
        }
        (Some(_), Some(_)) => Err(anyhow!(
            "remote-to-remote copy is not supported; copy through a local file"
        )),
        (None, None) => Err(anyhow!("one side must be <host>:<path>")),
    }
}

fn table(rows: &[Vec<String>]) {
    let cols = rows.iter().map(Vec::len).max().unwrap_or(0);
    let widths: Vec<usize> = (0..cols)
        .map(|c| {
            rows.iter()
                .filter_map(|r| r.get(c))
                .map(|s| s.chars().count())
                .max()
                .unwrap_or(0)
        })
        .collect();
    for r in rows {
        let line: Vec<String> = r
            .iter()
            .enumerate()
            .map(|(i, s)| format!("{s:<w$}", w = widths[i]))
            .collect();
        println!("{}", line.join("  ").trim_end());
    }
}

fn key_names(h: &HostConfig) -> String {
    let names: Vec<String> = h
        .identity_files
        .iter()
        .filter_map(|p| p.file_name().map(|n| n.to_string_lossy().into_owned()))
        .collect();
    if names.is_empty() {
        "-".into()
    } else {
        names.join(",")
    }
}

fn hosts(ctx: &Ctx) {
    let mut rows = vec![
        ["NODE", "ALIAS", "USER", "HOSTNAME", "PORT", "KEY", "ROLE"]
            .map(String::from)
            .to_vec(),
    ];
    for n in &ctx.nodes {
        let t = Target {
            label: n.name.clone(),
            alias: n.ssh_alias.clone(),
            node: Some(n.name.clone()),
        };
        let h = ctx.host_for(&t);
        rows.push(vec![
            n.name.clone(),
            n.ssh_alias.clone(),
            h.user.clone().unwrap_or_else(|| "-".into()),
            h.hostname.clone(),
            h.port.to_string(),
            key_names(&h),
            n.role.clone().unwrap_or_else(|| "-".into()),
        ]);
    }
    table(&rows);
    let extra: Vec<String> =
        // Node names resolve to their deploy.toml alias, so a same-named Host block is never used.
        ctx.ssh
            .aliases()
            .into_iter()
            .filter(|a| !ctx.nodes.iter().any(|n| n.ssh_alias.eq_ignore_ascii_case(a) || n.name.eq_ignore_ascii_case(a)))
            .collect();
    if !extra.is_empty() {
        println!("\nother ~/.ssh/config hosts: {}", extra.join(" "));
    }
}

async fn check(ctx: &Ctx, spec: &str, common: &Common) -> Result<i32> {
    let targets = fleet::resolve_targets(spec, &ctx.nodes)?;
    let opts = common.options();
    let mut tasks = Vec::new();
    for t in &targets {
        let (host, opts) = (ctx.host_for(t), opts.clone());
        tasks.push(tokio::spawn(async move {
            let started = Instant::now();
            let addr = format!(
                "{}@{}:{}",
                host.user.clone().unwrap_or_default(),
                host.hostname,
                host.port
            );
            let res = async {
                let s = Session::connect(host, &opts).await?;
                let auth = s
                    .auth
                    .split(" SHA256:")
                    .next()
                    .unwrap_or_default()
                    .to_string();
                let uname = s.capture("uname -srm").await;
                s.close().await;
                Ok::<_, anyhow::Error>((auth, uname?))
            }
            .await;
            (addr, started.elapsed(), res)
        }));
    }
    let mut rows = vec![
        ["NODE", "ALIAS", "ADDRESS", "AUTH", "TIME", "RESULT"]
            .map(String::from)
            .to_vec(),
    ];
    let mut failed = 0;
    for (t, task) in targets.iter().zip(tasks) {
        let (addr, took, res) = task.await.map_err(|e| anyhow!("task: {e}"))?;
        let (auth, result) = match res {
            Ok((auth, uname)) => (auth, format!("ok  {uname}")),
            Err(e) => {
                failed += 1;
                ("-".to_string(), format!("FAIL  {e:#}"))
            }
        };
        rows.push(vec![
            t.label.clone(),
            t.alias.clone(),
            addr,
            auth,
            format!("{}ms", took.as_millis()),
            result,
        ]);
    }
    table(&rows);
    Ok(if failed == 0 { 0 } else { 1 })
}

#[cfg(test)]
mod tests {
    use super::*;

    fn parse(line: &str) -> Cmd {
        Cli::try_parse_from(std::iter::once("ay ssh").chain(line.split_whitespace()))
            .expect("parse")
            .cmd
    }

    #[test]
    fn exec_takes_everything_after_the_separator() {
        let Cmd::Exec {
            targets,
            command,
            common,
        } = parse("exec all --accept-new -- ls -la /tmp")
        else {
            panic!()
        };
        assert_eq!(targets, "all");
        assert_eq!(command, ["ls", "-la", "/tmp"]);
        assert!(common.accept_new);
        let Cmd::Exec { command, .. } = parse("exec prd uname -a") else {
            panic!()
        };
        assert_eq!(command, ["uname", "-a"]);
    }

    #[test]
    fn check_defaults_to_all() {
        let Cmd::Check { targets, .. } = parse("check") else {
            panic!()
        };
        assert_eq!(targets, "all");
        assert!(matches!(parse("hosts"), Cmd::Hosts));
    }

    #[test]
    fn remote_spec_vs_windows_paths() {
        assert_eq!(split_remote("prd:/tmp/x"), Some(("prd", "/tmp/x")));
        assert_eq!(split_remote("fr1,fr2:/tmp/"), Some(("fr1,fr2", "/tmp/")));
        assert_eq!(split_remote(r"C:\src\file"), None);
        assert_eq!(split_remote("./a:b"), None);
        assert_eq!(split_remote("plain"), None);
    }

    #[test]
    fn usage_errors() {
        assert_eq!(
            run("ay ssh", &["exec".into(), "prd".into()], Path::new(".")),
            2
        );
        assert_eq!(run("ay ssh", &["nope".into()], Path::new(".")), 2);
    }
}
