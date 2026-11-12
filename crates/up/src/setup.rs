//! `ay up --setup`: wire provider CLIs from the repository `.env` without prompting.
//!
//! Secrets are read from the process environment first, then `<root>/.env` (dotenvy, the
//! process environment is not modified). They are passed to child processes through their
//! environment or stdin only, and every line printed is scrubbed of their values.

use crate::probe;
use std::collections::BTreeMap;
use std::io::Write;
use std::path::{Path, PathBuf};
use std::process::{Command, Stdio};

const HOSTINGER_VMS: &str = "https://developers.hostinger.com/api/vps/v1/virtual-machines";

/// Values from the environment and `.env`, never printed.
pub struct Secrets {
    file: BTreeMap<String, String>,
    pub env_file: Option<PathBuf>,
}

impl Secrets {
    pub fn load(root: Option<&Path>) -> Secrets {
        let path = root.map(|r| r.join(".env")).filter(|p| p.is_file());
        let file = path
            .as_deref()
            .and_then(|p| dotenvy::from_path_iter(p).ok())
            .map(|iter| iter.flatten().collect())
            .unwrap_or_default();
        Secrets {
            file,
            env_file: path,
        }
    }

    #[cfg(test)]
    pub fn from_pairs(pairs: &[(&str, &str)]) -> Secrets {
        Secrets {
            file: pairs
                .iter()
                .map(|(k, v)| (k.to_string(), v.to_string()))
                .collect(),
            env_file: None,
        }
    }

    pub fn get(&self, key: &str) -> Option<String> {
        std::env::var(key)
            .ok()
            .filter(|v| !v.is_empty())
            .or_else(|| self.file.get(key).filter(|v| !v.is_empty()).cloned())
    }

    /// First key of `keys` that has a value.
    pub fn first(&self, keys: &[&str]) -> Option<(String, String)> {
        keys.iter()
            .find_map(|k| self.get(k).map(|v| (k.to_string(), v)))
    }

    /// Replace secret values in `text` with `****`: every `.env` value of 20+ chars, and any
    /// value (8+ chars) whose key names a credential, from `.env` or the environment.
    /// Plain settings such as `USERPROFILE` stay readable.
    pub fn scrub(&self, text: &str) -> String {
        let mut out = text.to_string();
        let from_file = self.file.iter().map(|(k, v)| (k.clone(), v.clone(), true));
        let from_env = std::env::vars().map(|(k, v)| (k, v, false));
        for (key, value, in_file) in from_file.chain(from_env) {
            let secret =
                value.len() >= 8 && (is_secret_key(&key) || (in_file && value.len() >= 20));
            if secret && out.contains(&value) {
                out = out.replace(&value, "****");
            }
        }
        out
    }
}

/// Key names that hold credentials (`GH_TOKEN`, `OVH_APPLICATION_SECRET`, `DATABASE_URL`, ...).
pub fn is_secret_key(key: &str) -> bool {
    let k = key.to_ascii_uppercase();
    [
        "TOKEN",
        "SECRET",
        "KEY",
        "PASSWORD",
        "PASSWD",
        "CREDENTIAL",
        "AUTH",
        "PRIVATE",
        "DSN",
        "DATABASE_URL",
        "COOKIE",
        "SESSION",
    ]
    .iter()
    .any(|w| k.contains(w))
}

#[derive(Debug, Clone, PartialEq)]
pub struct Row {
    pub provider: &'static str,
    pub credential: String,
    pub ok: bool,
    pub detail: String,
}

/// `alice@example.com` -> `a***@example.com`; other strings keep their first two chars.
pub fn mask_identity(s: &str) -> String {
    let s = s.trim();
    match s.split_once('@') {
        Some((local, domain)) => format!("{}***@{domain}", local.chars().next().unwrap_or('*')),
        None if s.chars().count() > 4 => format!("{}***", s.chars().take(2).collect::<String>()),
        None => "***".into(),
    }
}

struct Output {
    ok: bool,
    text: String,
}

fn run(
    bin_dir: &Path,
    argv: &[&str],
    env: &[(&str, &str)],
    remove: &[&str],
    stdin: Option<&str>,
) -> Output {
    let Some(program) = probe::which(argv[0], bin_dir) else {
        return Output {
            ok: false,
            text: format!("{} not installed (ay up {})", argv[0], argv[0]),
        };
    };
    let mut cmd = Command::new(program);
    cmd.args(&argv[1..])
        .stdout(Stdio::piped())
        .stderr(Stdio::piped());
    cmd.stdin(if stdin.is_some() {
        Stdio::piped()
    } else {
        Stdio::null()
    });
    for k in remove {
        cmd.env_remove(k);
    }
    for (k, v) in env {
        cmd.env(k, v);
    }
    let child = cmd.spawn();
    let mut child = match child {
        Ok(c) => c,
        Err(e) => {
            return Output {
                ok: false,
                text: format!("{}: {e}", argv[0]),
            };
        }
    };
    if let (Some(input), Some(mut pipe)) = (stdin, child.stdin.take()) {
        let _ = pipe.write_all(input.as_bytes());
    }
    match child.wait_with_output() {
        Ok(out) => {
            let mut text = String::from_utf8_lossy(&out.stdout).into_owned();
            text.push_str(&String::from_utf8_lossy(&out.stderr));
            Output {
                ok: out.status.success(),
                text,
            }
        }
        Err(e) => Output {
            ok: false,
            text: e.to_string(),
        },
    }
}

/// First non-empty line, trimmed, for failure details.
fn first_line(text: &str) -> String {
    text.lines()
        .map(str::trim)
        .find(|l| !l.is_empty())
        .unwrap_or("no output")
        .chars()
        .take(100)
        .collect()
}

fn gh_account(text: &str) -> Option<String> {
    let line = text.lines().find(|l| l.contains("Logged in to"))?;
    let after = line.split(" account ").nth(1)?;
    after.split_whitespace().next().map(str::to_string)
}

fn check_gh(s: &Secrets, bin: &Path) -> Row {
    const TOKENS: &[&str] = &["GH_TOKEN", "GITHUB_TOKEN"];
    let token = s.first(TOKENS);
    let credential = token
        .as_ref()
        .map(|(k, _)| format!("{k} set"))
        .unwrap_or_else(|| "GH_TOKEN missing".into());
    // Stored credentials first; the env token would mask them.
    let mut status = run(
        bin,
        &["gh", "auth", "status", "--hostname", "github.com"],
        &[],
        TOKENS,
        None,
    );
    let mut wired = "";
    if let Some((_, value)) = token.as_ref().filter(|_| !status.ok) {
        let login = run(
            bin,
            &[
                "gh",
                "auth",
                "login",
                "--hostname",
                "github.com",
                "--with-token",
            ],
            &[],
            TOKENS,
            Some(value),
        );
        if login.ok {
            wired = ", stored from .env";
            status = run(
                bin,
                &["gh", "auth", "status", "--hostname", "github.com"],
                &[],
                TOKENS,
                None,
            );
        }
    }
    let detail = match (status.ok, gh_account(&status.text)) {
        (true, Some(account)) => format!("logged in as {account}{wired}"),
        (true, None) => format!("authenticated{wired}"),
        (false, _) => s.scrub(&first_line(&status.text)),
    };
    Row {
        provider: "github (gh)",
        credential,
        ok: status.ok,
        detail,
    }
}

fn check_wrangler(s: &Secrets, bin: &Path) -> Row {
    let token = s.get("CLOUDFLARE_API_TOKEN");
    let account = s.get("CLOUDFLARE_ACCOUNT_ID");
    let credential = match (&token, &account) {
        (Some(_), Some(_)) => "CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID set".to_string(),
        (None, _) => "CLOUDFLARE_API_TOKEN missing".into(),
        (_, None) => "CLOUDFLARE_ACCOUNT_ID missing".into(),
    };
    let (Some(token), Some(account)) = (token, account) else {
        return Row {
            provider: "cloudflare (wrangler)",
            credential,
            ok: false,
            detail: "set both in .env".into(),
        };
    };
    let env = [
        ("CLOUDFLARE_API_TOKEN", token.as_str()),
        ("CLOUDFLARE_ACCOUNT_ID", account.as_str()),
        ("WRANGLER_SEND_METRICS", "false"),
    ];
    let out = run(bin, &["wrangler", "whoami"], &env, &[], None);
    let lower = out.text.to_ascii_lowercase();
    let ok =
        out.ok && !lower.contains("not authenticated") && !lower.contains("you are not logged in");
    let detail = if ok {
        "API token valid (env)".into()
    } else {
        s.scrub(&first_line(&out.text))
    };
    Row {
        provider: "cloudflare (wrangler)",
        credential,
        ok,
        detail,
    }
}

fn check_gcloud(s: &Secrets, bin: &Path) -> Row {
    let key_file = s
        .get("GOOGLE_APPLICATION_CREDENTIALS")
        .filter(|p| Path::new(p).is_file());
    let credential = if key_file.is_some() {
        "GOOGLE_APPLICATION_CREDENTIALS set"
    } else {
        "active account"
    }
    .to_string();
    let get_account = || {
        run(
            bin,
            &["gcloud", "config", "get-value", "account"],
            &[],
            &[],
            None,
        )
    };
    let mut out = get_account();
    let account = |o: &Output| {
        o.text
            .lines()
            .map(str::trim)
            .find(|l| l.contains('@'))
            .map(str::to_string)
    };
    let mut wired = "";
    if let Some(path) = key_file.as_ref().filter(|_| account(&out).is_none()) {
        let flag = format!("--key-file={path}");
        if run(
            bin,
            &[
                "gcloud",
                "auth",
                "activate-service-account",
                &flag,
                "--quiet",
            ],
            &[],
            &[],
            None,
        )
        .ok
        {
            wired = ", service account activated";
            out = get_account();
        }
    }
    match account(&out) {
        Some(a) => Row {
            provider: "google cloud (gcloud)",
            credential,
            ok: true,
            detail: format!("active account {}{wired}", mask_identity(&a)),
        },
        None => Row {
            provider: "google cloud (gcloud)",
            credential,
            ok: false,
            detail: if out.ok {
                "no active account (gcloud auth login)".into()
            } else {
                s.scrub(&first_line(&out.text))
            },
        },
    }
}

fn check_ovh(s: &Secrets, bin: &Path) -> Row {
    let conf = crate::manifest::home_dir().join(".ovh.conf");
    if !conf.is_file() {
        return Row {
            provider: "ovhcloud",
            credential: "~/.ovh.conf missing".into(),
            ok: false,
            detail: "create it with ovhcloud login".into(),
        };
    }
    let out = run(
        bin,
        &["ovhcloud", "account", "get", "-o", "nichandle"],
        &[],
        &[],
        None,
    );
    let nic = out
        .text
        .lines()
        .map(|l| l.trim().trim_matches('"'))
        .find(|l| !l.is_empty())
        .map(str::to_string);
    let detail = match (&nic, out.ok) {
        (Some(n), true) => format!("account {}", mask_identity(n)),
        _ => s.scrub(&first_line(&out.text)),
    };
    Row {
        provider: "ovhcloud",
        credential: "~/.ovh.conf present".into(),
        ok: out.ok,
        detail,
    }
}

fn check_hostinger(s: &Secrets) -> Row {
    let Some(token) = s.get("HOSTINGER_API_TOKEN") else {
        return Row {
            provider: "hostinger",
            credential: "HOSTINGER_API_TOKEN missing".into(),
            ok: false,
            detail: "set it in .env".into(),
        };
    };
    let auth = format!("Bearer {token}");
    let (ok, detail) = match crate::fetch::get(
        HOSTINGER_VMS,
        &[("Authorization", &auth), ("Accept", "application/json")],
    ) {
        Ok(body) => {
            let vms = serde_json::from_slice::<serde_json::Value>(&body)
                .ok()
                .and_then(|v| v.as_array().map(Vec::len));
            (
                true,
                match vms {
                    Some(n) => format!("API 200, {n} VPS"),
                    None => "API 200".into(),
                },
            )
        }
        Err((0, msg)) => (false, s.scrub(&msg)),
        Err((code, _)) => (false, format!("API {code}")),
    };
    Row {
        provider: "hostinger",
        credential: "HOSTINGER_API_TOKEN set".into(),
        ok,
        detail,
    }
}

pub fn check_all(s: &Secrets, bin_dir: &Path) -> Vec<Row> {
    vec![
        check_gh(s, bin_dir),
        check_wrangler(s, bin_dir),
        check_gcloud(s, bin_dir),
        check_ovh(s, bin_dir),
        check_hostinger(s),
    ]
}

pub fn table(rows: &[Row]) -> String {
    let mut lines = vec![(
        "PROVIDER".to_string(),
        "CREDENTIAL".to_string(),
        "STATUS".to_string(),
        "DETAIL".to_string(),
    )];
    for r in rows {
        lines.push((
            r.provider.to_string(),
            r.credential.clone(),
            if r.ok { "ok" } else { "FAIL" }.to_string(),
            r.detail.clone(),
        ));
    }
    let w0 = lines.iter().map(|l| l.0.len()).max().unwrap_or(0);
    let w1 = lines.iter().map(|l| l.1.len()).max().unwrap_or(0);
    let w2 = lines.iter().map(|l| l.2.len()).max().unwrap_or(0);
    lines
        .iter()
        .map(|(a, b, c, d)| format!("{a:<w0$}  {b:<w1$}  {c:<w2$}  {d}\n"))
        .collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn masking() {
        assert_eq!(mask_identity("alice@example.com"), "a***@example.com");
        assert_eq!(mask_identity("ab12345-ovh"), "ab***");
        assert_eq!(mask_identity("abc"), "***");
    }

    #[test]
    fn scrub_removes_secret_values() {
        let s = Secrets::from_pairs(&[
            ("HOSTINGER_API_TOKEN", "s3cr3t-value-123"),
            ("SHORT", "abc"),
        ]);
        assert_eq!(
            s.scrub("error: token s3cr3t-value-123 rejected"),
            "error: token **** rejected"
        );
        assert_eq!(
            s.scrub("abc stays"),
            "abc stays",
            "short values are not scrubbed"
        );
        assert_eq!(s.get("HOSTINGER_API_TOKEN_NOT_SET_ANYWHERE"), None);
        let paths = Secrets::from_pairs(&[("SRC_HOME", "C:/src/apps")]);
        assert_eq!(
            paths.scrub("wrote C:/src/apps/x"),
            "wrote C:/src/apps/x",
            "short non-secret values stay"
        );
        assert!(
            is_secret_key("OVH_APPLICATION_SECRET")
                && is_secret_key("gh_token")
                && !is_secret_key("USERPROFILE")
        );
    }

    #[test]
    fn parses_gh_status() {
        let text =
            "github.com\n  Logged in to github.com account octo (keyring)\n  - Token: gho_****";
        assert_eq!(gh_account(text).as_deref(), Some("octo"));
        assert_eq!(gh_account("not logged in"), None);
    }

    #[test]
    fn table_never_contains_values() {
        let rows = vec![Row {
            provider: "hostinger",
            credential: "HOSTINGER_API_TOKEN set".into(),
            ok: true,
            detail: "API 200".into(),
        }];
        let t = table(&rows);
        assert!(t.starts_with("PROVIDER"));
        assert!(t.contains("hostinger") && t.contains("ok"));
    }
}
