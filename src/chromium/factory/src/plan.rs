//! Pure planners: config + version → commands. No I/O here except reading directory listings passed
//! in by the caller, so every step is unit-tested and printable with `--dry-run`.

use std::path::Path;

use crate::config::Config;
use crate::run::Cmd;

fn path_env(cfg: &Config) -> String {
    let cur = std::env::var("PATH").unwrap_or_else(|_| "/usr/local/bin:/usr/bin:/bin".into());
    format!("{}:{cur}", cfg.depot_tools.display())
}

fn depot(cfg: &Config, program: &str) -> Cmd {
    Cmd::new(cfg.depot_tools.join(program).display().to_string())
        .env("PATH", path_env(cfg))
        // Unattended runs must not self-update depot_tools mid-build.
        .env("DEPOT_TOOLS_UPDATE", "0")
}

/// `sync`: fetch (first time), pin src to the release tag, then sync deps. gclient sync stays the
/// default until `ay gclient sync --apply --populate-cache --cipd` is validated on a copy (F3).
pub fn sync(cfg: &Config, version: &str, have_src: bool) -> Vec<Cmd> {
    let src = cfg.src();
    let src_s = src.display().to_string();
    let mut v = Vec::new();
    if !have_src {
        v.push(depot(cfg, "fetch").args(["--nohooks", "--no-history", "chromium"]).cwd(&cfg.root));
    }
    v.push(Cmd::new("git").args([
        "-C".into(),
        src_s.clone(),
        "fetch".into(),
        "--depth".into(),
        "1".into(),
        "origin".into(),
        format!("refs/tags/{version}:refs/tags/{version}"),
    ]));
    v.push(Cmd::new("git").args([
        "-C".into(),
        src_s,
        "-c".into(),
        "advice.detachedHead=false".into(),
        "checkout".into(),
        "-f".into(),
        format!("tags/{version}"),
    ]));
    if cfg.sync_with_ay {
        v.push(
            Cmd::new(cfg.ay.display().to_string())
                .args(["gclient", "sync", "--apply", "--populate-cache", "--cipd", "-j", "24"])
                .cwd(&cfg.root)
                .env("PATH", path_env(cfg)),
        );
    } else {
        v.push(
            depot(cfg, "gclient")
                .args(["sync", "-D", "--force", "--nohooks", "--no-history", "--with_tags"])
                .cwd(&cfg.root),
        );
    }
    v
}

/// DEPS hooks through `ay gclient runhooks` (F3: same 118 hooks as gclient, 0 diff).
pub fn runhooks(cfg: &Config) -> Cmd {
    Cmd::new(cfg.ay.display().to_string())
        .args(["gclient", "runhooks"])
        .cwd(&cfg.root)
        .env("PATH", path_env(cfg))
}

pub fn revinfo(cfg: &Config) -> Cmd {
    Cmd::new(cfg.ay.display().to_string()).args(["gclient", "revinfo"]).cwd(&cfg.root)
}

/// `.gclient` with `checkout_pgo_profiles` (`chrome_pgo_phase = 2` needs the profile).
pub fn gclient_with_pgo(dot_gclient: &str) -> Option<String> {
    if dot_gclient.contains("checkout_pgo_profiles") {
        return None;
    }
    dot_gclient
        .contains("\"custom_vars\": {},")
        .then(|| dot_gclient.replace("\"custom_vars\": {},", "\"custom_vars\": {\"checkout_pgo_profiles\": True},"))
}

pub const GEN_MARK: &str = "# --- aphrody-factory (generated, do not edit) ---";

/// args.gn = curated args + execution mode. `use_remoteexec` only flips siso rule remoting
/// (build/config/siso/main.star) and asserts (clang.gni), not compile command lines.
pub fn args_gn(base: &str, remote: bool) -> String {
    let base = base.split(GEN_MARK).next().unwrap_or(base).trim_end();
    format!("{base}\n\n{GEN_MARK}\nuse_siso = true\nuse_remoteexec = {remote}\n")
}

pub fn gn_gen(cfg: &Config) -> Cmd {
    Cmd::new(cfg.src().join("buildtools/linux64/gn").display().to_string())
        .args(["gen".into(), cfg.out().display().to_string()])
        .cwd(cfg.src())
}

/// siso invocation. Remote: `NativeLink` over the mesh without TLS (flags verified with
/// `siso ninja -help`, v1.6.5); offline: local cache only.
pub fn siso(cfg: &Config, remote: bool, local_jobs: u32) -> Cmd {
    let mut c = Cmd::new(cfg.src().join("third_party/siso/cipd/siso").display().to_string())
        .args(["ninja".into(), "-C".into(), cfg.out().display().to_string()])
        .cwd(cfg.src());
    if remote {
        c = c.args([
            format!("-reapi_address={}", cfg.reapi.address),
            format!("-reapi_instance={}", cfg.reapi.instance),
            "-reapi_insecure".into(),
            format!("-project={}", cfg.reapi.project),
            "-re_cache_enable_write".into(),
            format!("-local_jobs={local_jobs}"),
            format!("-remote_jobs={}", cfg.reapi.remote_jobs),
        ]);
    } else {
        c = c.args(["--offline".into(), "-local_cache_enable".into(), format!("-local_jobs={local_jobs}")]);
    }
    c.arg(cfg.target.clone())
}

/// Runtime files of `headless_shell` in `out` (names only), sorted: the binary, `*.pak`, `*.bin`
/// (V8 snapshots), `*.dat` (`icudtl.dat`, missed by the bash script), shared objects, `locales/` and
/// `hyphen-data/`.
pub fn publish_files(names: &[String]) -> Vec<String> {
    let mut v: Vec<String> = names
        .iter()
        .filter(|n| {
            n.as_str() == "headless_shell"
                || n.as_str() == "locales"
                || n.as_str() == "hyphen-data"
                || n.ends_with(".pak")
                || n.ends_with(".bin")
                || n.ends_with(".dat")
                || n.ends_with(".so")
                || n.contains(".so.")
                || n.ends_with("_icd.json")
        })
        .filter(|n| !n.starts_with("siso"))
        .cloned()
        .collect();
    v.sort();
    v
}

pub fn tarball(cfg: &Config, version: &str) -> std::path::PathBuf {
    cfg.publish.staging.join(format!("{}-{version}-linux-x64.tar.zst", cfg.out_name))
}

pub fn r2_key(cfg: &Config, version: &str, file: &str) -> String {
    format!("{}:{}/{}/{version}/{file}", cfg.publish.remote, cfg.publish.bucket, cfg.publish.prefix)
}

pub fn tar(cfg: &Config, out: &Path, files: &[String], dest: &Path) -> Cmd {
    Cmd::new("tar")
        .args([
            "-I".into(),
            format!("zstd -T0 -{}", cfg.publish.zstd_level),
            "-cf".into(),
            dest.display().to_string(),
            "-C".into(),
            out.display().to_string(),
        ])
        .args(files.iter().cloned())
        .nice(19)
}

pub fn rclone(src: &Path, dst: String) -> Cmd {
    Cmd::new("rclone").args(["copyto".into(), src.display().to_string(), dst])
}

#[cfg(test)]
mod tests {
    use super::*;

    fn cfg() -> Config {
        Config::default()
    }

    #[test]
    fn sync_plan() {
        let v = sync(&cfg(), "157.0.8103.78", false);
        assert!(v[0].program.ends_with("depot_tools/fetch"));
        assert!(v[1].args.contains(&"refs/tags/157.0.8103.78:refs/tags/157.0.8103.78".into()));
        assert!(v[3].program.ends_with("gclient"));
        assert!(v[3].env.contains(&("DEPOT_TOOLS_UPDATE".into(), "0".into())));
        let mut c = cfg();
        c.sync_with_ay = true;
        let v = sync(&c, "157.0.8103.78", true);
        assert_eq!(v.len(), 3);
        assert_eq!(v[2].args[..5], ["gclient", "sync", "--apply", "--populate-cache", "--cipd"]);
        assert_eq!(runhooks(&c).args, ["gclient", "runhooks"]);
    }

    #[test]
    fn pgo_var() {
        let g = "solutions = [{\"name\": \"src\", \"custom_vars\": {},}]";
        assert!(gclient_with_pgo(g).unwrap().contains("\"checkout_pgo_profiles\": True"));
        assert_eq!(gclient_with_pgo(&gclient_with_pgo(g).unwrap()), None);
    }

    #[test]
    fn args_are_regenerated_not_appended() {
        let a = args_gn("is_official_build = true\n", true);
        assert!(a.ends_with("use_siso = true\nuse_remoteexec = true\n"));
        let b = args_gn(&a, false);
        assert_eq!(b.matches(GEN_MARK).count(), 1);
        assert!(b.contains("use_remoteexec = false") && !b.contains("use_remoteexec = true"));
    }

    #[test]
    fn siso_flags() {
        let r = siso(&cfg(), true, 4);
        for f in ["-reapi_address=10.200.77.1:50051", "-reapi_instance=main", "-reapi_insecure", "-re_cache_enable_write", "-local_jobs=4", "-remote_jobs=26"] {
            assert!(r.args.contains(&f.to_owned()), "{f}");
        }
        assert_eq!(r.args.last().unwrap(), "headless_shell");
        let o = siso(&cfg(), false, 12);
        assert!(o.args.contains(&"--offline".to_owned()) && !o.args.iter().any(|a| a.starts_with("-reapi")));
    }

    #[test]
    fn publish_selection() {
        let n: Vec<String> = ["headless_shell", "icudtl.dat", "v8_context_snapshot.bin", "headless_lib_data.pak", "libEGL.so", "locales", "obj", "gen", "siso_metrics.json", "args.gn", "libvk_swiftshader.so", "vk_swiftshader_icd.json"]
            .map(String::from)
            .to_vec();
        assert_eq!(
            publish_files(&n),
            ["headless_lib_data.pak", "headless_shell", "icudtl.dat", "libEGL.so", "libvk_swiftshader.so", "locales", "v8_context_snapshot.bin", "vk_swiftshader_icd.json"]
        );
        assert_eq!(r2_key(&cfg(), "157", "linux-x64.tar.zst"), "r2-chromium:aphrody-chromium/labs_agent/157/linux-x64.tar.zst");
    }
}
