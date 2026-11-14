//! Pre-flight checks before any build: disk, RAM, conflicting builds, `NativeLink`, workers, tools,
//! toolchain pins. Each check is FAIL (blocks `build`), WARN or OK.

use std::net::{TcpStream, ToSocketAddrs};
use std::path::Path;
use std::time::Duration;

use crate::config::Config;
use crate::run::{Cmd, Runner};

#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord)]
pub enum Level {
    Ok,
    Warn,
    Fail,
}

#[derive(Debug, Clone)]
pub struct Check {
    pub level: Level,
    pub name: String,
    pub detail: String,
}

impl std::fmt::Display for Check {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        let l = match self.level {
            Level::Ok => "OK  ",
            Level::Warn => "WARN",
            Level::Fail => "FAIL",
        };
        write!(f, "{l} {:<14} {}", self.name, self.detail)
    }
}

fn c(level: Level, name: &str, detail: impl Into<String>) -> Check {
    Check { level, name: name.into(), detail: detail.into() }
}

fn gate(ok: bool, fail: Level) -> Level {
    if ok { Level::Ok } else { fail }
}

/// Free GiB from `df -Pk <path>` output.
pub fn parse_df_free_gb(out: &str) -> Option<u64> {
    let l = out.lines().nth(1)?;
    l.split_whitespace().nth(3)?.parse::<u64>().ok().map(|kb| kb / (1024 * 1024))
}

/// `MemAvailable` GiB from `/proc/meminfo`.
pub fn parse_mem_avail_gb(meminfo: &str) -> Option<u64> {
    let l = meminfo.lines().find(|l| l.starts_with("MemAvailable:"))?;
    l.split_whitespace().nth(1)?.parse::<u64>().ok().map(|kb| kb / (1024 * 1024))
}

/// Running processes (pid, comm) whose comm is in `names`, from /proc, excluding `me`.
pub fn conflicting(proc_root: &Path, names: &[String], me: u32) -> Vec<(u32, String)> {
    let Ok(rd) = std::fs::read_dir(proc_root) else { return Vec::new() };
    let mut v: Vec<(u32, String)> = rd
        .filter_map(Result::ok)
        .filter_map(|e| {
            let pid: u32 = e.file_name().to_str()?.parse().ok()?;
            let comm = std::fs::read_to_string(e.path().join("comm")).ok()?;
            // Python tools (gclient, repo) show comm=python3: also match argv[0..2] basenames.
            let cmdline = std::fs::read(e.path().join("cmdline")).unwrap_or_default();
            let mut cands = vec![comm.trim().to_owned()];
            for a in cmdline.split(|b| *b == 0).take(2) {
                let a = String::from_utf8_lossy(a);
                cands.push(a.rsplit('/').next().unwrap_or("").trim_end_matches(".py").to_owned());
            }
            let hit = cands.into_iter().find(|c| names.iter().any(|n| n == c))?;
            (pid != me).then_some((pid, hit))
        })
        .collect();
    v.sort_unstable();
    v
}

fn tcp(addr: &str) -> Result<(), String> {
    let sa = addr.to_socket_addrs().map_err(|e| e.to_string())?.next().ok_or("no address")?;
    TcpStream::connect_timeout(&sa, Duration::from_secs(3)).map(drop).map_err(|e| e.to_string())
}

fn ssh(host: &str, cmd: &str) -> Cmd {
    Cmd::new("ssh").args(["-o", "BatchMode=yes", "-o", "ConnectTimeout=5", host, cmd])
}

/// Peer IPs with an established connection to local `port` (`ss -Htn state established`).
pub fn parse_ss_peers(out: &str, port: u16) -> Vec<String> {
    let local = format!(":{port}");
    let mut v: Vec<String> = out
        .lines()
        .filter_map(|l| {
            let f: Vec<&str> = l.split_whitespace().collect();
            let (loc, peer) = (f.get(f.len().checked_sub(2)?)?, f.last()?);
            loc.ends_with(&local).then(|| peer.rsplit_once(':').map_or(*peer, |p| p.0).trim_matches(['[', ']']).to_owned())
        })
        .collect();
    v.sort();
    v.dedup();
    v
}

/// `clang --version` / `rustc --version` first line vs the manifest string: the manifest drops
/// vendor details (clang: repo URL; rustc: the Chromium suffix), so require the same leading
/// `<tool> version` words and every long hex token (commit hashes) of the manifest.
pub fn version_matches(actual: &str, expected: &str) -> bool {
    if actual.starts_with(expected) {
        return true;
    }
    let head = |s: &str| s.split(" (").next().unwrap_or(s).to_owned();
    let hexes = expected
        .split(|c: char| !c.is_ascii_hexdigit())
        .filter(|t| t.len() >= 12);
    head(actual) == head(expected) && hexes.clone().count() > 0 && hexes.into_iter().all(|h| actual.contains(h))
}

/// All checks. `version` = channel version the build will use (toolchain manifest milestone).
pub fn run(cfg: &Config, version: &str, r: &mut dyn Runner) -> Vec<Check> {
    let mut v = Vec::new();
    let src = cfg.src();

    v.push(c(
        gate(std::env::var_os("HOME").is_some(), Level::Warn),
        "env",
        "HOME set (systemd-run without User= left HOME unset: `HOME: unbound variable`, 16:21:05)",
    ));

    for (name, path, min) in [
        ("disk src", src.as_path(), cfg.doctor.min_free_gb_src),
        ("disk cas", cfg.doctor.cas_path.as_path(), cfg.doctor.min_free_gb_cas),
    ] {
        let free = r.output(&Cmd::new("df").args(["-Pk".into(), path.display().to_string()]));
        match free.ok().as_deref().and_then(parse_df_free_gb) {
            Some(g) => v.push(c(gate(g >= min, Level::Fail), name, format!("{g} GiB free on {} (min {min})", path.display()))),
            None => v.push(c(Level::Fail, name, format!("df {} failed", path.display()))),
        }
    }

    let mem = std::fs::read_to_string("/proc/meminfo").ok();
    match mem.as_deref().and_then(parse_mem_avail_gb) {
        Some(g) => v.push(c(
            gate(g >= cfg.doctor.min_mem_avail_gb, Level::Fail),
            "ram",
            format!("{g} GiB available (min {}; F0 peak 19.8 GiB, max cxx RSS 2.97 GB)", cfg.doctor.min_mem_avail_gb),
        )),
        None => v.push(c(Level::Warn, "ram", "no /proc/meminfo")),
    }

    let busy = conflicting(Path::new("/proc"), &cfg.doctor.conflicting, std::process::id());
    v.push(c(
        gate(busy.is_empty(), Level::Fail),
        "concurrency",
        if busy.is_empty() { "no competing build/sync".into() } else { format!("running: {busy:?}") },
    ));

    for tool in [
        src.join("third_party/siso/cipd/siso"),
        src.join("buildtools/linux64/gn"),
        cfg.ay.clone(),
        cfg.depot_tools.join("gclient"),
    ] {
        v.push(c(gate(tool.exists(), Level::Fail), "tool", tool.display().to_string()));
    }
    v.push(c(
        gate(r.output(&Cmd::new("rclone").arg("version")).is_ok(), Level::Warn),
        "tool",
        "rclone (publish, toolchain)",
    ));

    if cfg.reapi.enabled {
        for (name, addr) in [("nativelink", &cfg.reapi.address), ("worker_api", &cfg.reapi.worker_api)] {
            let res = tcp(addr);
            v.push(c(gate(res.is_ok(), Level::Fail), name, format!("{addr} {}", res.err().unwrap_or_else(|| "reachable".into()))));
        }
        let port = cfg.reapi.worker_api.rsplit(':').next().and_then(|p| p.parse().ok()).unwrap_or(50061);
        let ss = r.output(&Cmd::new("ss").args(["-Htn", "state", "established"])).unwrap_or_default();
        let peers = parse_ss_peers(&ss, port);
        let mut live = 0;
        for w in &cfg.workers {
            let ok = peers.contains(&w.addr);
            live += u32::from(ok) * w.jobs;
            let mem = if w.local {
                std::fs::read_to_string("/proc/meminfo").ok().as_deref().and_then(parse_mem_avail_gb)
            } else {
                w.ssh.as_deref().and_then(|h| r.output(&ssh(h, "cat /proc/meminfo")).ok()).as_deref().and_then(parse_mem_avail_gb)
            };
            let mem_ok = mem.is_none_or(|g| g >= w.min_mem_gb);
            let mem_s = mem.map_or_else(|| "n/a".into(), |g| format!("{g} GiB"));
            v.push(c(
                gate(ok && mem_ok, Level::Warn),
                "worker",
                format!("{} {} connected={ok} mem_avail={mem_s} (min {}) jobs={}", w.name, w.addr, w.min_mem_gb, w.jobs),
            ));
        }
        v.push(c(
            gate(live > 0, Level::Fail),
            "workers",
            format!("{live} remote slots live; siso -remote_jobs={}", cfg.reapi.remote_jobs),
        ));
    }

    let milestone = version.split('.').next().unwrap_or(version);
    let mp = cfg.toolchain_manifest(milestone);
    match crate::toolchain::Manifest::load(&mp) {
        Ok(m) => {
            v.push(c(
                gate(m.toolchain.chromium == version, Level::Warn),
                "toolchain",
                format!("manifest for {} (building {version})", m.toolchain.chromium),
            ));
            for (ok, d) in crate::toolchain::check(&m, &src, r) {
                v.push(c(gate(ok, Level::Fail), "toolchain", d));
            }
        }
        Err(e) => v.push(c(Level::Warn, "toolchain", format!("no manifest: {e}"))),
    }

    let head = r.output(&Cmd::new("git").args(["-C".into(), src.display().to_string(), "describe".into(), "--tags".into(), "--exact-match".into()]));
    let head = head.unwrap_or_default();
    v.push(c(
        gate(head.trim() == version, Level::Warn),
        "checkout",
        format!("src at {:?}, channel wants {version} (run `sync`)", head.trim()),
    ));
    v
}

pub fn worst(v: &[Check]) -> Level {
    v.iter().map(|c| c.level).max().unwrap_or(Level::Ok)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parsers() {
        let df = "Filesystem 1024-blocks Used Available Capacity Mounted on\n/dev/sda1 304087040 173015040 127926272 58% /\n";
        assert_eq!(parse_df_free_gb(df), Some(122));
        assert_eq!(parse_mem_avail_gb("MemTotal: 48162488 kB\nMemAvailable: 38797312 kB\n"), Some(37));
        assert_eq!(parse_df_free_gb(""), None);
    }

    #[test]
    fn finds_conflicting_processes() {
        let d = tempfile::tempdir().unwrap();
        for (pid, comm) in [("10", "siso"), ("11", "bash"), ("12", "repo"), ("x", "siso")] {
            std::fs::create_dir_all(d.path().join(pid)).unwrap();
            std::fs::write(d.path().join(pid).join("comm"), format!("{comm}\n")).unwrap();
        }
        std::fs::create_dir_all(d.path().join("13")).unwrap();
        std::fs::write(d.path().join("13/comm"), "python3\n").unwrap();
        std::fs::write(d.path().join("13/cmdline"), "python3\0/h/depot_tools/gclient.py\0sync\0").unwrap();
        let names = vec!["siso".to_owned(), "repo".to_owned(), "gclient".to_owned()];
        assert_eq!(
            conflicting(d.path(), &names, 12),
            vec![(10, "siso".to_owned()), (13, "gclient".to_owned())]
        );
    }

    #[test]
    fn workers_and_versions() {
        // `ss -Htn state established` on fr1, 2026-11-12 (prd and fr2 connected).
        let ss = "0      0      10.200.77.1:50061 10.200.77.5:58650\n0      0      10.200.77.1:50061 10.200.77.3:27466\n0 0 10.200.77.1:50051 10.200.77.9:1\n";
        assert_eq!(parse_ss_peers(ss, 50061), ["10.200.77.3", "10.200.77.5"]);
        // Real fr1 outputs vs third_party/toolchain-157.toml.
        assert!(version_matches(
            "clang version 24.0.0git (https://chromium.googlesource.com/a/external/github.com/llvm/llvm-project 86922d51225db089fffb99475eefc4904f79e3c8)",
            "clang version 24.0.0git (llvm-project 86922d51225db089fffb99475eefc4904f79e3c8)"
        ));
        assert!(version_matches(
            "rustc 1.100.0-nightly (1edd55dcf 2026-09-09) (1edd55dcfcd573872c727fa3e086369a71661ee0-1125-llvmorg-24-init-7747-g62397f8b chromium)",
            "rustc 1.100.0-nightly (1edd55dcf 2026-09-09)"
        ));
        assert!(!version_matches(
            "clang version 24.0.0git (llvm-project 0000000000000000000000000000000000000000)",
            "clang version 24.0.0git (llvm-project 86922d51225db089fffb99475eefc4904f79e3c8)"
        ));
        assert!(!version_matches("clang version 23.0.0", "clang version 24.0.0git"));
    }

    #[test]
    fn worst_level() {
        assert_eq!(worst(&[c(Level::Ok, "a", ""), c(Level::Warn, "b", "")]), Level::Warn);
        assert_eq!(worst(&[]), Level::Ok);
    }
}
