//! `ay bun watch --install-schedule` / `--remove-schedule`: run the watch every N hours.
//!
//! Windows: a Task Scheduler task `ay-bun-watch` registered with `schtasks /Create /XML`
//! (no PowerShell), S4U logon (runs hidden, logged on or not), falling back to an interactive
//! token when S4U is refused. Linux: `ay-bun-watch.service` + `.timer`, user units (system
//! units for root), the same layout `ay ai service` uses. Each run leaves `state.json` and
//! `report.json` in ~/.local/share/ay/bun-watch.

use super::{WatchArgs, error, warn};
use std::path::{Path, PathBuf};
use std::process::{Command, Stdio};

pub const NAME: &str = "ay-bun-watch";

fn xml_escape(s: &str) -> String {
    s.replace('&', "&amp;").replace('<', "&lt;").replace('>', "&gt;").replace('"', "&quot;")
}

fn quote(a: &str) -> String {
    if a.contains([' ', '"']) { format!("\"{}\"", a.replace('"', "\\\"")) } else { a.to_string() }
}

/// Task Scheduler definition: every `hours` from a past boundary (missed runs start when the
/// machine is back), below-normal priority, 30 minute limit, one instance at a time.
pub fn task_xml(user: &str, logon: &str, exe: &str, args: &[String], workdir: &str, hours: u32) -> String {
    let args_text = args.iter().map(|a| quote(a)).collect::<Vec<_>>().join(" ");
    format!(
        r#"<?xml version="1.0" encoding="UTF-16"?>
<Task version="1.4" xmlns="http://schemas.microsoft.com/windows/2004/02/mit/task">
  <RegistrationInfo><Description>ay bun watch: upstream watch of oven-sh/bun every {hours} h</Description></RegistrationInfo>
  <Triggers><TimeTrigger><Repetition><Interval>PT{hours}H</Interval><StopAtDurationEnd>false</StopAtDurationEnd></Repetition><StartBoundary>2026-01-01T00:00:00</StartBoundary><Enabled>true</Enabled></TimeTrigger></Triggers>
  <Principals><Principal id="Author"><UserId>{user}</UserId><LogonType>{logon}</LogonType><RunLevel>LeastPrivilege</RunLevel></Principal></Principals>
  <Settings>
    <MultipleInstancesPolicy>IgnoreNew</MultipleInstancesPolicy>
    <DisallowStartIfOnBatteries>false</DisallowStartIfOnBatteries>
    <StopIfGoingOnBatteries>false</StopIfGoingOnBatteries>
    <StartWhenAvailable>true</StartWhenAvailable>
    <RunOnlyIfNetworkAvailable>true</RunOnlyIfNetworkAvailable>
    <Hidden>true</Hidden>
    <ExecutionTimeLimit>PT30M</ExecutionTimeLimit>
    <Priority>7</Priority>
  </Settings>
  <Actions Context="Author"><Exec><Command>{exe}</Command><Arguments>{args}</Arguments><WorkingDirectory>{workdir}</WorkingDirectory></Exec></Actions>
</Task>
"#,
        user = xml_escape(user),
        logon = logon,
        exe = xml_escape(exe),
        args = xml_escape(&args_text),
        workdir = xml_escape(workdir),
    )
}

/// systemd service (oneshot, niced) and timer (every `hours`, first run 5 min after boot).
pub fn systemd_units(exe: &str, args: &[String], workdir: &str, hours: u32) -> (String, String) {
    let exec = std::iter::once(exe.to_string()).chain(args.iter().map(|a| quote(a))).collect::<Vec<_>>().join(" ");
    let service = format!(
        "[Unit]\nDescription=ay bun watch (upstream watch of oven-sh/bun)\nAfter=network-online.target\nWants=network-online.target\n\n[Service]\nType=oneshot\nWorkingDirectory={workdir}\nExecStart={exec}\nNice=19\nIOSchedulingClass=idle\nTimeoutStartSec=30min\n"
    );
    let timer = format!(
        "[Unit]\nDescription=ay bun watch every {hours} h\n\n[Timer]\nOnBootSec=5min\nOnUnitActiveSec={hours}h\nRandomizedDelaySec=10min\nUnit={NAME}.service\n\n[Install]\nWantedBy=timers.target\n"
    );
    (service, timer)
}

/// Arguments of the scheduled run: the checkout and the state file are pinned at install time.
pub fn scheduled_args(w: &WatchArgs, checkout: &Path) -> Vec<String> {
    let mut a = vec!["bun".to_string(), "watch".into(), "--checkout".into(), checkout.display().to_string()];
    if let Some(s) = &w.state {
        a.extend(["--state".into(), s.display().to_string()]);
    }
    a
}

fn capture(prog: &str, args: &[String]) -> (i32, String) {
    match Command::new(prog).args(args).stdin(Stdio::null()).output() {
        Ok(o) => (o.status.code().unwrap_or(1), format!("{}{}", String::from_utf8_lossy(&o.stdout), String::from_utf8_lossy(&o.stderr)).trim().to_string()),
        Err(e) => (127, format!("{prog}: {e}")),
    }
}

fn s(v: &[&str]) -> Vec<String> {
    v.iter().map(|x| x.to_string()).collect()
}

fn windows(w: &WatchArgs, exe: &str, args: &[String], workdir: &str) -> i32 {
    if w.remove_schedule {
        let (c, out) = capture("schtasks", &s(&["/Delete", "/TN", NAME, "/F"]));
        if c != 0 {
            error(&format!("schtasks /Delete: {out}"));
            return 1;
        }
        println!("{NAME}: scheduled task removed");
        return 0;
    }
    let user = format!("{}\\{}", std::env::var("USERDOMAIN").unwrap_or_default(), std::env::var("USERNAME").unwrap_or_default());
    let file = std::env::temp_dir().join(format!("{NAME}.xml"));
    let mut last = String::new();
    for logon in ["S4U", "InteractiveToken"] {
        let xml = task_xml(&user, logon, exe, args, workdir, w.every);
        let mut bytes = vec![0xFF, 0xFE];
        bytes.extend(xml.encode_utf16().flat_map(u16::to_le_bytes));
        if let Err(e) = std::fs::write(&file, bytes) {
            error(&format!("{}: {e}", file.display()));
            return 1;
        }
        let (c, out) = capture("schtasks", &["/Create".into(), "/TN".into(), NAME.into(), "/XML".into(), file.display().to_string(), "/F".into()]);
        if c == 0 {
            let _ = std::fs::remove_file(&file);
            if logon != "S4U" {
                warn(&format!("S4U refused ({last}); the task runs only while {user} is logged on"));
            }
            println!("{NAME}: every {} h as {user} ({logon}): {exe} {}", w.every, args.join(" "));
            println!("report: {}", super::state_dir().join("report.json").display());
            return 0;
        }
        last = out;
    }
    let _ = std::fs::remove_file(&file);
    error(&format!("schtasks /Create: {last}"));
    1
}

fn systemd_scope() -> (Vec<String>, PathBuf) {
    let root = std::env::var("USER").map(|u| u == "root").unwrap_or(false) || super::home() == Path::new("/root");
    if root { (vec![], PathBuf::from("/etc/systemd/system")) } else { (vec!["--user".into()], super::home().join(".config/systemd/user")) }
}

fn systemctl(scope: &[String], args: &[&str]) -> (i32, String) {
    let all: Vec<String> = scope.iter().cloned().chain(args.iter().map(|a| a.to_string())).collect();
    capture("systemctl", &all)
}

fn linux(w: &WatchArgs, exe: &str, args: &[String], workdir: &str) -> i32 {
    let (scope, dir) = systemd_scope();
    let timer = format!("{NAME}.timer");
    if w.remove_schedule {
        let _ = systemctl(&scope, &["disable", "--now", &timer]);
        let _ = std::fs::remove_file(dir.join(&timer));
        let _ = std::fs::remove_file(dir.join(format!("{NAME}.service")));
        let _ = systemctl(&scope, &["daemon-reload"]);
        println!("{NAME}: timer removed");
        return 0;
    }
    let (service, timer_text) = systemd_units(exe, args, workdir, w.every);
    let write = |name: String, text: &str| std::fs::create_dir_all(&dir).and_then(|_| std::fs::write(dir.join(&name), text)).map_err(|e| format!("{}: {e}", dir.join(&name).display()));
    if let Err(e) = write(format!("{NAME}.service"), &service).and_then(|_| write(timer.clone(), &timer_text)) {
        error(&e);
        return 1;
    }
    let _ = systemctl(&scope, &["daemon-reload"]);
    let (c, out) = systemctl(&scope, &["enable", "--now", &timer]);
    if c != 0 {
        error(&format!("systemctl enable --now {timer}: {out}"));
        return 1;
    }
    if !scope.is_empty() {
        let user = std::env::var("USER").unwrap_or_default();
        let linger = Path::new("/var/lib/systemd/linger").join(&user).exists();
        if !linger {
            warn(&format!("user timers stop at logout without lingering (loginctl enable-linger {user})"));
        }
    }
    println!("{NAME}: every {} h ({}): {exe} {}", w.every, dir.display(), args.join(" "));
    println!("report: {}", super::state_dir().join("report.json").display());
    0
}

pub fn run(w: &WatchArgs) -> i32 {
    let exe = match std::env::current_exe() {
        Ok(p) => p.display().to_string(),
        Err(e) => {
            error(&format!("current exe: {e}"));
            return 1;
        }
    };
    let checkout = std::path::absolute(super::watch::checkout_dir(&w.checkout)).unwrap_or_else(|_| super::watch::checkout_dir(&w.checkout));
    let args = scheduled_args(w, &checkout);
    let workdir = crate::repo_root().display().to_string();
    if cfg!(windows) {
        windows(w, &exe, &args, &workdir)
    } else if cfg!(target_os = "linux") {
        linux(w, &exe, &args, &workdir)
    } else {
        error("scheduling is implemented for Task Scheduler (Windows) and systemd (Linux)");
        1
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn task_definition() {
        let args = s(&["bun", "watch", "--checkout", "C:\\src\\third_party\\bun"]);
        let xml = task_xml("PC\\me", "S4U", "C:\\Users\\me\\.local\\bin\\ay.exe", &args, "C:\\src", 6);
        assert!(xml.contains("<Interval>PT6H</Interval>"));
        assert!(xml.contains("<LogonType>S4U</LogonType>"));
        assert!(xml.contains("<Arguments>bun watch --checkout C:\\src\\third_party\\bun</Arguments>"));
        assert!(xml.contains("<UserId>PC\\me</UserId>"));
        assert!(xml.contains("<Hidden>true</Hidden>"));
    }

    #[test]
    fn systemd_definition() {
        let (service, timer) = systemd_units("/root/.local/bin/ay", &s(&["bun", "watch", "--checkout", "/src/third party/bun"]), "/src", 2);
        assert!(service.contains("Type=oneshot"));
        assert!(service.contains("ExecStart=/root/.local/bin/ay bun watch --checkout \"/src/third party/bun\""));
        assert!(timer.contains("OnUnitActiveSec=2h") && timer.contains("Unit=ay-bun-watch.service") && timer.contains("WantedBy=timers.target"));
    }

    #[test]
    fn scheduled_arguments_pin_paths() {
        let w = WatchArgs { state: Some(PathBuf::from("/tmp/s.json")), every: 6, ..Default::default() };
        assert_eq!(scheduled_args(&w, Path::new("/src/third_party/bun")), s(&["bun", "watch", "--checkout", "/src/third_party/bun", "--state", "/tmp/s.json"]));
    }
}
