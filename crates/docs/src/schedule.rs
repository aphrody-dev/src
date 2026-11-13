//! `ay docs schedule`: run `ay docs sync` every N hours with Task Scheduler (Windows) or a systemd
//! user timer (Linux). The task runs the `ay` that installed it, with `--root` so it does not
//! depend on the working directory.

use std::path::Path;
use std::process::Command;

pub const TASK: &str = "ay-docs-sync";

/// argv of the scheduled command.
pub fn sync_argv(ay: &Path, root: Option<&Path>) -> Vec<String> {
    let mut v = vec![ay.to_string_lossy().into_owned(), "docs".into(), "sync".into(), "--quiet".into()];
    if let Some(r) = root {
        v.push("--root".into());
        v.push(r.to_string_lossy().into_owned());
    }
    v
}

fn quote_windows(arg: &str) -> String {
    if arg.contains([' ', '\t', '"']) { format!("\"{}\"", arg.replace('"', "\\\"")) } else { arg.to_string() }
}

/// `schtasks /Create` arguments.
pub fn schtasks_create(argv: &[String], hours: u32) -> Vec<String> {
    // conhost --headless: ay.exe is a console binary; without it every run flashes a console window.
    let tr = std::iter::once("conhost.exe --headless".to_string())
        .chain(argv.iter().map(|a| quote_windows(a)))
        .collect::<Vec<_>>()
        .join(" ");
    ["/Create", "/F", "/SC", "HOURLY", "/MO", &hours.to_string(), "/TN", TASK, "/TR", &tr]
        .iter()
        .map(|s| s.to_string())
        .collect()
}

/// systemd user units (service, timer).
pub fn systemd_units(argv: &[String], hours: u32) -> (String, String) {
    let exec = argv
        .iter()
        .map(|a| if a.contains(' ') { format!("\"{a}\"") } else { a.clone() })
        .collect::<Vec<_>>()
        .join(" ");
    (
        format!("[Unit]\nDescription=ay docs sync (Bun docs index)\n\n[Service]\nType=oneshot\nNice=19\nExecStart={exec}\n"),
        format!(
            "[Unit]\nDescription=ay docs sync every {hours} h\n\n[Timer]\nOnBootSec=10min\nOnUnitActiveSec={hours}h\nPersistent=true\n\n[Install]\nWantedBy=timers.target\n"
        ),
    )
}

fn run(program: &str, args: &[String]) -> Result<(), String> {
    let out = Command::new(program).args(args).output().map_err(|e| format!("{program}: {e}"))?;
    if out.status.success() {
        Ok(())
    } else {
        Err(format!("{program} {}: {}{}", args.join(" "), String::from_utf8_lossy(&out.stdout).trim(), String::from_utf8_lossy(&out.stderr).trim()))
    }
}

/// Install (or replace) the schedule. Returns a one-line description.
pub fn install(ay: &Path, root: Option<&Path>, hours: u32) -> Result<String, String> {
    let argv = sync_argv(ay, root);
    if cfg!(windows) {
        run("schtasks", &schtasks_create(&argv, hours))?;
        return Ok(format!("Task Scheduler: {TASK} every {hours} h"));
    }
    let home = std::env::var_os("HOME").ok_or("HOME is not set")?;
    let dir = Path::new(&home).join(".config/systemd/user");
    std::fs::create_dir_all(&dir).map_err(|e| format!("{}: {e}", dir.display()))?;
    let (service, timer) = systemd_units(&argv, hours);
    std::fs::write(dir.join(format!("{TASK}.service")), service).map_err(|e| e.to_string())?;
    std::fs::write(dir.join(format!("{TASK}.timer")), timer).map_err(|e| e.to_string())?;
    run("systemctl", &["--user".into(), "daemon-reload".into()])?;
    run("systemctl", &["--user".into(), "enable".into(), "--now".into(), format!("{TASK}.timer")])?;
    Ok(format!("systemd user timer: {TASK}.timer every {hours} h"))
}

/// Remove the schedule.
pub fn remove() -> Result<String, String> {
    if cfg!(windows) {
        run("schtasks", &["/Delete".into(), "/F".into(), "/TN".into(), TASK.into()])?;
        return Ok(format!("removed Task Scheduler task {TASK}"));
    }
    let _ = run("systemctl", &["--user".into(), "disable".into(), "--now".into(), format!("{TASK}.timer")]);
    if let Some(home) = std::env::var_os("HOME") {
        let dir = Path::new(&home).join(".config/systemd/user");
        for ext in ["service", "timer"] {
            let _ = std::fs::remove_file(dir.join(format!("{TASK}.{ext}")));
        }
    }
    let _ = run("systemctl", &["--user".into(), "daemon-reload".into()]);
    Ok(format!("removed systemd user timer {TASK}.timer"))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn task_definitions() {
        let argv = sync_argv(Path::new("C:/Users/a b/ay.exe"), Some(Path::new("C:/src")));
        assert_eq!(argv[1..], ["docs", "sync", "--quiet", "--root", "C:/src"]);
        let a = schtasks_create(&argv, 6);
        assert_eq!(a[..8], ["/Create", "/F", "/SC", "HOURLY", "/MO", "6", "/TN", TASK]);
        assert_eq!(a[9], "conhost.exe --headless \"C:/Users/a b/ay.exe\" docs sync --quiet --root C:/src");
        let (svc, timer) = systemd_units(&sync_argv(Path::new("/home/u/.local/bin/ay"), None), 12);
        assert!(svc.contains("ExecStart=/home/u/.local/bin/ay docs sync --quiet\n"));
        assert!(timer.contains("OnUnitActiveSec=12h"));
    }
}
