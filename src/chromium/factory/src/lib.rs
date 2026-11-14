//! Chromium factory (phase F4, docs/CHROMIUM-FACTORY.md): replaces chromium-factory.sh.
//!
//! `aphrody-factory <sync|gen|build|publish|all|status|doctor|toolchain> [options]`, later `ay
//! factory` through [`tool_main`]. Reads third_party/chrome-channels.toml through
//! `aphrody_conformance::channels` (no second parser), drives git/gclient (or `ay gclient`), gn,
//! siso with `NativeLink` REAPI flags and rclone. Each step is keyed in a state file and skipped when
//! already done for the same inputs, so an interrupted run resumes where it stopped.

pub mod config;
pub mod doctor;
pub mod metrics;
pub mod plan;
pub mod run;
pub mod state;
pub mod toolchain;

use std::ffi::OsString;
use std::path::PathBuf;
use std::time::Instant;

use aphrody_conformance::channels;
use config::Config;
use run::{Cmd, Record, Real, Runner};
use state::State;

pub const USAGE: &str = "\
usage: aphrody-factory <command> [options]

commands:
  sync        pin src to the channel tag, gclient sync (or ay gclient sync), ay gclient runhooks
  gen         write out/<out_name>/args.gn (curated args + exec mode) and gn gen
  build       doctor, then siso ninja (NativeLink REAPI unless --offline), record metrics
  publish     tar.zst of headless_shell runtime files + manifest, rclone to R2
  all         sync, doctor, gen, build, publish (resumes at the first unfinished step)
  status      channel, state file, out dir, last build summary
  doctor      pre-build checks (disk, RAM, competing builds, NativeLink, workers, toolchain pins)
  toolchain   install|check the toolchain of third_party/toolchain-<milestone>.toml from R2

options:
  --channel <stable|beta|dev|canary>   default stable
  --config <factory.toml>              default <exe dir>/factory.toml
  --dry-run                            print commands, change nothing
  --force                              redo steps already recorded as done
  --offline                            build without NativeLink (siso --offline -local_cache_enable)
  --refresh-channels                   sync: regenerate chrome-channels.toml first
  --platform <linux-x64|windows-x64>   toolchain: default linux-x64
  --skip-doctor                        build: do not gate on doctor
";

#[derive(Debug, Default, PartialEq)]
pub struct Opts {
    pub cmd: String,
    pub sub: Option<String>,
    pub channel: String,
    pub config: Option<PathBuf>,
    pub dry_run: bool,
    pub force: bool,
    pub offline: bool,
    pub refresh_channels: bool,
    pub skip_doctor: bool,
    pub platform: String,
}

pub fn parse_args(args: &[OsString]) -> Result<Opts, String> {
    let mut o = Opts { channel: "stable".into(), platform: "linux-x64".into(), ..Default::default() };
    let mut it = args.iter().map(|a| a.to_string_lossy().into_owned());
    while let Some(a) = it.next() {
        let mut val = |n: &str| it.next().ok_or_else(|| format!("{n} needs a value"));
        match a.as_str() {
            "--channel" => o.channel = val("--channel")?,
            "--config" => o.config = Some(val("--config")?.into()),
            "--platform" => o.platform = val("--platform")?,
            "--dry-run" | "-n" => o.dry_run = true,
            "--force" => o.force = true,
            "--offline" => o.offline = true,
            "--refresh-channels" => o.refresh_channels = true,
            "--skip-doctor" => o.skip_doctor = true,
            "-h" | "--help" | "help" => o.cmd = "help".into(),
            s if s.starts_with('-') => return Err(format!("unknown option {s}")),
            s if o.cmd.is_empty() => o.cmd = s.into(),
            s if o.sub.is_none() => o.sub = Some(s.into()),
            s => return Err(format!("unexpected argument {s}")),
        }
    }
    if o.cmd.is_empty() {
        o.cmd = "help".into();
    }
    Ok(o)
}

/// Entry point shared by the thin bin and the future `ay factory` (never exits the process).
pub fn tool_main(args: &[OsString]) -> i32 {
    let o = match parse_args(args) {
        Ok(o) => o,
        Err(e) => {
            eprintln!("aphrody-factory: {e}\n\n{USAGE}");
            return 2;
        }
    };
    if o.cmd == "help" {
        print!("{USAGE}");
        return 0;
    }
    let cfg_path = o.config.clone().or_else(|| {
        std::env::current_exe().ok().and_then(|e| e.parent().map(|d| d.join("factory.toml")))
    });
    let cfg = match Config::load(cfg_path.as_deref()) {
        Ok(c) => c,
        Err(e) => {
            eprintln!("aphrody-factory: {e}");
            return 2;
        }
    };
    let mut real = Real;
    let mut rec = Record::default();
    let r: &mut dyn Runner = if o.dry_run { &mut rec } else { &mut real };
    match (Factory { cfg, opts: o }).dispatch(r) {
        Ok(code) => code,
        Err(e) => {
            eprintln!("aphrody-factory: {e}");
            1
        }
    }
}

pub struct Factory {
    pub cfg: Config,
    pub opts: Opts,
}

impl Factory {
    pub fn version(&self) -> Result<String, String> {
        let p = self.cfg.channels_file();
        let src = std::fs::read_to_string(&p).map_err(|e| format!("{}: {e}", p.display()))?;
        let all = channels::parse_toml(&src)?;
        channels::find(&all, &self.opts.channel)
            .map(|c| c.chromium)
            .ok_or_else(|| format!("no channel {} in {}", self.opts.channel, p.display()))
    }

    pub fn dispatch(&self, r: &mut dyn Runner) -> Result<i32, String> {
        match self.opts.cmd.as_str() {
            "doctor" => {
                let v = self.version()?;
                Ok(self.doctor(&v, r))
            }
            "status" => self.status(),
            "toolchain" => self.toolchain(r),
            "sync" | "gen" | "build" | "publish" | "all" => self.steps(r),
            c => Err(format!("unknown command {c}\n\n{USAGE}")),
        }
    }

    fn doctor(&self, version: &str, r: &mut dyn Runner) -> i32 {
        let mut cfg = self.cfg.clone();
        cfg.reapi.enabled &= !self.opts.offline;
        let checks = doctor::run(&cfg, version, r);
        for c in &checks {
            println!("{c}");
        }
        i32::from(doctor::worst(&checks) == doctor::Level::Fail)
    }

    fn status(&self) -> Result<i32, String> {
        let v = self.version()?;
        let s = State::load(&self.cfg.state)?;
        println!("channel {} -> {v}", self.opts.channel);
        println!("out     {} (exists: {})", self.cfg.out().display(), self.cfg.out().exists());
        println!("state   {} (channel {} version {})", self.cfg.state.display(), s.channel, s.version);
        for (k, rec) in &s.steps {
            println!("  {k:<8} key={} finished={} secs={}", rec.key, rec.finished_unix, rec.secs);
        }
        if s.version != v {
            println!("  (state is for {}: next run starts over for {v})", s.version);
        }
        if let Some(b) = &s.last_build {
            println!("last build: {b}");
        }
        let live = std::fs::read_to_string(self.cfg.out().join("siso_metrics.json")).ok();
        if let Some(m) = live {
            println!("out/siso_metrics.json: {}", metrics::Summary::parse(&m));
        }
        Ok(0)
    }

    fn toolchain(&self, r: &mut dyn Runner) -> Result<i32, String> {
        let v = self.version()?;
        let milestone = v.split('.').next().unwrap_or(&v).to_owned();
        let m = toolchain::Manifest::load(&self.cfg.toolchain_manifest(&milestone))?;
        match self.opts.sub.as_deref().unwrap_or("check") {
            "install" => {
                let cache = self.cfg.root.join("toolchain-cache");
                if !r.dry() {
                    std::fs::create_dir_all(&cache).map_err(|e| e.to_string())?;
                }
                let done = toolchain::install(&m, &self.opts.platform, &self.cfg.src(), &cache, &self.cfg.publish.remote, r)?;
                println!("installed: {done:?}");
                Ok(0)
            }
            "check" => {
                let res = toolchain::check(&m, &self.cfg.src(), r);
                for (ok, d) in &res {
                    println!("{} {d}", if *ok { "OK  " } else { "FAIL" });
                }
                Ok(i32::from(res.iter().any(|(ok, _)| !ok)))
            }
            s => Err(format!("toolchain {s}: expected install|check")),
        }
    }

    fn steps(&self, r: &mut dyn Runner) -> Result<i32, String> {
        let _lock = if r.dry() { None } else { Some(state::Lock::acquire(&self.cfg.state)?) };
        if self.opts.refresh_channels && matches!(self.opts.cmd.as_str(), "sync" | "all") && !r.dry() {
            let t = channels::fetch_toml("Linux", &format!("unix:{}", state::now()))?;
            std::fs::write(self.cfg.channels_file(), t).map_err(|e| e.to_string())?;
        }
        let version = self.version()?;
        let mut st = State::load(&self.cfg.state)?;
        st.retarget(&self.opts.channel, &version);
        let want: &[&str] = match self.opts.cmd.as_str() {
            "all" => &["sync", "gen", "build", "publish"],
            "sync" => &["sync"],
            "gen" => &["gen"],
            "build" => &["gen", "build"],
            _ => &["publish"],
        };
        for step in want {
            let key = self.step_key(step, &version);
            if !self.opts.force && st.done(step, &key) {
                println!("skip {step} ({version}, key {key}: already done)");
                continue;
            }
            // Gate the build: this session lost time to a competing cros sync, a test siso build
            // and a NativeLink worker that could not exec.
            if *step == "build" && !self.opts.skip_doctor && self.doctor(&version, r) != 0 && !r.dry() {
                return Err("doctor reported FAIL; fix it or pass --skip-doctor".into());
            }
            let t = Instant::now();
            match *step {
                "sync" => self.sync(&version, r)?,
                "gen" => self.gn_gen(&version, r)?,
                "build" => {
                    self.build(r)?;
                    if !r.dry() {
                        let m = std::fs::read_to_string(self.cfg.out().join("siso_metrics.json")).unwrap_or_default();
                        let s = metrics::Summary::parse(&m);
                        println!("build: {s}");
                        st.last_build = Some(s);
                    }
                }
                _ => self.publish(&version, r)?,
            }
            // Keys are computed after the step (publish depends on the built binary).
            let key = self.step_key(step, &version);
            st.mark(step, &key, t.elapsed().as_secs());
            if !r.dry() {
                st.save(&self.cfg.state)?;
            }
        }
        Ok(0)
    }

    fn remote(&self) -> bool {
        self.cfg.reapi.enabled && !self.opts.offline
    }

    fn args_text(&self) -> Result<String, String> {
        let p = self.cfg.factory.join(&self.cfg.args);
        let base = std::fs::read_to_string(&p).map_err(|e| format!("{}: {e}", p.display()))?;
        Ok(plan::args_gn(&base, self.remote()))
    }

    pub fn step_key(&self, step: &str, version: &str) -> String {
        match step {
            "sync" => state::key(&[version, &self.cfg.sync_with_ay.to_string()]),
            "gen" => state::key(&[version, &self.args_text().unwrap_or_default()]),
            "build" => state::key(&[version, &self.args_text().unwrap_or_default(), &self.cfg.target]),
            _ => {
                let bin = self.cfg.out().join(&self.cfg.target);
                let m = std::fs::metadata(&bin).ok();
                let stamp = m.map(|m| format!("{}:{:?}", m.len(), m.modified().ok())).unwrap_or_default();
                state::key(&[version, &stamp])
            }
        }
    }

    fn sync(&self, version: &str, r: &mut dyn Runner) -> Result<(), String> {
        let have_src = self.cfg.src().join(".git").exists();
        for c in plan::sync(&self.cfg, version, have_src) {
            r.run(&c)?;
            // .gclient exists after `fetch`; add the PGO profile var before gclient sync.
            if c.args.first().map(String::as_str) == Some("-C") && c.args.iter().any(|a| a == "checkout") {
                let g = self.cfg.root.join(".gclient");
                if let Some(new) = std::fs::read_to_string(&g).ok().as_deref().and_then(plan::gclient_with_pgo) {
                    if r.dry() {
                        println!("[dry-run] set checkout_pgo_profiles in {}", g.display());
                    } else {
                        std::fs::write(&g, new).map_err(|e| e.to_string())?;
                    }
                }
            }
        }
        let marker = self.cfg.root.join(".build-deps-done");
        if !marker.exists() {
            r.run(&Cmd::new("sudo").args([
                self.cfg.src().join("build/install-build-deps.sh").display().to_string(),
                "--no-prompt".into(),
                "--no-chromeos-fonts".into(),
            ]))?;
            if !r.dry() {
                std::fs::write(&marker, "").map_err(|e| e.to_string())?;
            }
        }
        if self.cfg.ay.exists() || r.dry() {
            r.run(&plan::runhooks(&self.cfg))?;
            let rev = r.output(&plan::revinfo(&self.cfg))?;
            if !r.dry() {
                let p = self.cfg.root.join(format!("revinfo-{version}.txt"));
                std::fs::write(&p, rev).map_err(|e| format!("{}: {e}", p.display()))?;
            }
        } else {
            eprintln!("warning: {} missing, falling back to gclient runhooks", self.cfg.ay.display());
            r.run(&Cmd::new(self.cfg.depot_tools.join("gclient").display().to_string()).arg("runhooks").cwd(&self.cfg.root))?;
        }
        Ok(())
    }

    fn gn_gen(&self, version: &str, r: &mut dyn Runner) -> Result<(), String> {
        let out = self.cfg.out();
        // Adopt the versioned out dir of the bash era once (keeps its objects and ThinLTO cache).
        let legacy = self.cfg.src().join("out").join(format!("{}-{version}", self.cfg.out_name));
        if !out.exists() && legacy.exists() {
            if r.dry() {
                println!("[dry-run] mv {} {}", legacy.display(), out.display());
            } else {
                std::fs::rename(&legacy, &out).map_err(|e| e.to_string())?;
            }
        }
        let args = self.args_text()?;
        if r.dry() {
            println!("[dry-run] write {}/args.gn:\n{args}", out.display());
        } else {
            std::fs::create_dir_all(&out).map_err(|e| e.to_string())?;
            std::fs::write(out.join("args.gn"), args).map_err(|e| e.to_string())?;
        }
        r.run(&plan::gn_gen(&self.cfg))
    }

    fn build(&self, r: &mut dyn Runner) -> Result<(), String> {
        let remote = self.remote();
        let jobs = if remote {
            self.cfg.reapi.local_jobs
        } else {
            std::thread::available_parallelism().map_or(12, |n| u32::try_from(n.get()).unwrap_or(12))
        };
        r.run(&plan::siso(&self.cfg, remote, jobs))
    }

    fn publish(&self, version: &str, r: &mut dyn Runner) -> Result<(), String> {
        let out = self.cfg.out();
        let names: Vec<String> = std::fs::read_dir(&out)
            .map(|rd| rd.filter_map(Result::ok).map(|e| e.file_name().to_string_lossy().into_owned()).collect())
            .unwrap_or_default();
        let files = plan::publish_files(&names);
        if !r.dry() && !files.contains(&self.cfg.target) {
            return Err(format!("{} not built in {}", self.cfg.target, out.display()));
        }
        let tb = plan::tarball(&self.cfg, version);
        if !r.dry() {
            std::fs::create_dir_all(&self.cfg.publish.staging).map_err(|e| e.to_string())?;
        }
        r.run(&plan::tar(&self.cfg, &out, &files, &tb))?;
        let man = tb.with_extension("json");
        if !r.dry() {
            let (size, sha256, blake3) = toolchain::hashes(&tb)?;
            let j = serde_json::json!({
                "version": version, "channel": self.opts.channel, "target": self.cfg.target,
                "size": size, "sha256": sha256, "blake3": blake3, "files": files,
            });
            std::fs::write(&man, serde_json::to_string_pretty(&j).map_err(|e| e.to_string())?).map_err(|e| e.to_string())?;
        }
        r.run(&plan::rclone(&tb, plan::r2_key(&self.cfg, version, "linux-x64.tar.zst")))?;
        r.run(&plan::rclone(&man, plan::r2_key(&self.cfg, version, "linux-x64.json")))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn os(v: &[&str]) -> Vec<OsString> {
        v.iter().map(OsString::from).collect()
    }

    #[test]
    fn parses_cli() {
        let o = parse_args(&os(&["build", "--channel", "beta", "--offline", "-n"])).unwrap();
        assert_eq!((o.cmd.as_str(), o.channel.as_str(), o.offline, o.dry_run), ("build", "beta", true, true));
        assert_eq!(parse_args(&os(&["toolchain", "install"])).unwrap().sub.as_deref(), Some("install"));
        assert_eq!(parse_args(&[]).unwrap().cmd, "help");
        assert!(parse_args(&os(&["--bogus"])).is_err());
        assert!(parse_args(&os(&["--channel"])).is_err());
        assert_eq!(tool_main(&os(&["help"])), 0);
        assert_eq!(tool_main(&os(&["--nope"])), 2);
    }

    fn fixture() -> (tempfile::TempDir, Factory) {
        let d = tempfile::tempdir().unwrap();
        let fac = d.path().join("factory");
        std::fs::create_dir_all(fac.join("third_party")).unwrap();
        std::fs::create_dir_all(fac.join("args")).unwrap();
        std::fs::write(fac.join("third_party/chrome-channels.toml"), "[channel.stable]\nchromium = \"157.0.8103.78\"\nv8 = \"15.7\"\n").unwrap();
        std::fs::write(fac.join("args/labs_agent.gn"), "is_official_build = true\n").unwrap();
        let cfg = Config {
            root: d.path().join("root"),
            factory: fac,
            state: d.path().join("state.json"),
            ..Config::default()
        };
        let opts = parse_args(&os(&["all", "--dry-run", "--skip-doctor"])).unwrap();
        (d, Factory { cfg, opts })
    }

    #[test]
    fn dry_run_all_plans_every_step() {
        let (_d, f) = fixture();
        assert_eq!(f.version().unwrap(), "157.0.8103.78");
        let mut r = Record::default();
        assert_eq!(f.dispatch(&mut r).unwrap(), 0);
        let progs: Vec<&str> = r.cmds.iter().map(|c| c.program.rsplit('/').next().unwrap()).collect();
        for p in ["fetch", "git", "gclient", "sudo", "ay", "gn", "siso", "tar", "rclone"] {
            assert!(progs.contains(&p), "{p} missing in {progs:?}");
        }
        let siso = r.cmds.iter().find(|c| c.program.ends_with("siso")).unwrap();
        assert!(siso.args.contains(&"-reapi_insecure".to_owned()));
        assert!(!f.cfg.state.exists(), "dry-run must not write state");
    }

    #[test]
    fn steps_are_skipped_when_done() {
        let (_d, mut f) = fixture();
        let v = f.version().unwrap();
        let mut st = State::default();
        st.retarget("stable", &v);
        st.mark("sync", &f.step_key("sync", &v), 1);
        st.mark("gen", &f.step_key("gen", &v), 1);
        st.save(&f.cfg.state).unwrap();
        f.opts = parse_args(&os(&["build", "--dry-run", "--skip-doctor"])).unwrap();
        let mut r = Record::default();
        f.dispatch(&mut r).unwrap();
        assert!(!r.cmds.iter().any(|c| c.program.ends_with("/gn")), "gen must be skipped");
        assert!(r.cmds.iter().any(|c| c.program.ends_with("/siso")));
        // Changing the exec mode changes args.gn, hence the gen key.
        f.opts.offline = true;
        assert_ne!(f.step_key("gen", &v), st.steps["gen"].key);
    }
}
