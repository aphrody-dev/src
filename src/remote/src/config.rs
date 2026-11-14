//! Minimal `~/.ssh/config` reader: the subset `ay ssh` needs to resolve a Host alias.
//!
//! Supported: `Host` patterns (`*`, `?`, `!negation`, several per line), `Match all`,
//! `Include` (relative to `~/.ssh`, globs in the file name), and the keywords HostName, User,
//! Port, IdentityFile (accumulates), IdentitiesOnly, HostKeyAlias, UserKnownHostsFile,
//! StrictHostKeyChecking, ConnectTimeout. As in OpenSSH the first value obtained wins.

use std::path::{Path, PathBuf};

/// Everything needed to connect to one host.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct HostConfig {
    /// The name the user typed (alias or literal host).
    pub alias: String,
    pub hostname: String,
    pub user: Option<String>,
    pub port: u16,
    pub identity_files: Vec<PathBuf>,
    pub identities_only: bool,
    /// Name looked up in known_hosts instead of `hostname`.
    pub host_key_alias: Option<String>,
    pub known_hosts_files: Vec<PathBuf>,
    /// `StrictHostKeyChecking accept-new` (or `no`) in the config.
    pub accept_new: bool,
    pub connect_timeout_secs: Option<u64>,
}

impl HostConfig {
    /// The name recorded in known_hosts: `HostKeyAlias`, else the HostName.
    pub fn known_hosts_name(&self) -> &str {
        self.host_key_alias.as_deref().unwrap_or(&self.hostname)
    }
}

/// One `Host` (or `Match all`) block.
#[derive(Debug, Clone, Default)]
struct Block {
    patterns: Vec<String>,
    options: Vec<(String, String)>,
}

/// A parsed config file with its includes expanded in place.
#[derive(Debug, Clone, Default)]
pub struct SshConfig {
    blocks: Vec<Block>,
    home: PathBuf,
}

/// The user's home directory (`USERPROFILE` on Windows, `HOME` elsewhere).
pub fn home_dir() -> PathBuf {
    std::env::home_dir().unwrap_or_else(|| PathBuf::from("."))
}

/// Expand a leading `~` and `%d` the way ssh does for file paths.
pub fn expand_tilde(raw: &str, home: &Path) -> PathBuf {
    let raw = raw.replace("%d", &home.to_string_lossy());
    if raw == "~" {
        home.to_path_buf()
    } else if let Some(rest) = raw.strip_prefix("~/").or_else(|| raw.strip_prefix("~\\")) {
        home.join(rest)
    } else {
        PathBuf::from(raw)
    }
}

/// Glob match with `*` and `?`, case-insensitive (host names are).
pub fn glob_match(pattern: &str, text: &str) -> bool {
    fn go(p: &[u8], t: &[u8]) -> bool {
        match (p.first(), t.first()) {
            (None, None) => true,
            (Some(b'*'), _) => go(&p[1..], t) || (!t.is_empty() && go(p, &t[1..])),
            (Some(b'?'), Some(_)) => go(&p[1..], &t[1..]),
            (Some(a), Some(b)) if a.eq_ignore_ascii_case(b) => go(&p[1..], &t[1..]),
            _ => false,
        }
    }
    go(pattern.as_bytes(), text.as_bytes())
}

/// OpenSSH pattern-list semantics: any negated match rejects, otherwise any positive match accepts.
pub fn patterns_match<S: AsRef<str>>(patterns: &[S], host: &str) -> bool {
    let mut matched = false;
    for p in patterns {
        let p = p.as_ref();
        if let Some(neg) = p.strip_prefix('!') {
            if glob_match(neg, host) {
                return false;
            }
        } else if glob_match(p, host) {
            matched = true;
        }
    }
    matched
}

/// Split a config line into keyword and value (`Key value`, `Key=value`, quoted values).
fn split_line(line: &str) -> Option<(String, String)> {
    let line = line.trim();
    if line.is_empty() || line.starts_with('#') {
        return None;
    }
    let idx = line.find(|c: char| c.is_whitespace() || c == '=')?;
    let key = line[..idx].to_ascii_lowercase();
    let value = line[idx..]
        .trim_start_matches(|c: char| c.is_whitespace() || c == '=')
        .trim();
    let value = value
        .strip_prefix('"')
        .and_then(|v| v.strip_suffix('"'))
        .unwrap_or(value);
    Some((key, value.to_string()))
}

/// Split a value into words, honoring double quotes.
fn words(value: &str) -> Vec<String> {
    let mut out = Vec::new();
    let mut cur = String::new();
    let mut quoted = false;
    for c in value.chars() {
        match c {
            '"' => quoted = !quoted,
            c if c.is_whitespace() && !quoted => {
                if !cur.is_empty() {
                    out.push(std::mem::take(&mut cur));
                }
            }
            c => cur.push(c),
        }
    }
    if !cur.is_empty() {
        out.push(cur);
    }
    out
}

impl SshConfig {
    /// Load `~/.ssh/config`; a missing file yields an empty config.
    pub fn load_default() -> Self {
        let home = home_dir();
        Self::load(&home.join(".ssh").join("config"), &home)
    }

    pub fn load(path: &Path, home: &Path) -> Self {
        let mut cfg = SshConfig {
            blocks: vec![Block {
                patterns: vec!["*".into()],
                ..Block::default()
            }],
            home: home.into(),
        };
        cfg.read_file(path, 0);
        cfg
    }

    /// Parse from a string (tests, or a config held in memory).
    pub fn parse(text: &str, home: &Path) -> Self {
        let mut cfg = SshConfig {
            blocks: vec![Block {
                patterns: vec!["*".into()],
                ..Block::default()
            }],
            home: home.into(),
        };
        cfg.read_str(text, 0);
        cfg
    }

    fn read_file(&mut self, path: &Path, depth: usize) {
        if depth > 8 {
            return;
        }
        if let Ok(text) = std::fs::read_to_string(path) {
            self.read_str(&text, depth);
        }
    }

    fn read_str(&mut self, text: &str, depth: usize) {
        for line in text.lines() {
            let Some((key, value)) = split_line(line) else {
                continue;
            };
            match key.as_str() {
                "host" => self.blocks.push(Block {
                    patterns: words(&value),
                    options: Vec::new(),
                }),
                "match" => {
                    // Only `Match all` is understood; other criteria never match.
                    let pats = if value.trim().eq_ignore_ascii_case("all") {
                        vec!["*".into()]
                    } else {
                        Vec::new()
                    };
                    self.blocks.push(Block {
                        patterns: pats,
                        options: Vec::new(),
                    });
                }
                "include" => {
                    for w in words(&value) {
                        for file in self.include_targets(&w) {
                            // Includes inherit the current block context in OpenSSH; keep it simple
                            // and correct for the common case by starting files in a match-all block.
                            let current = self
                                .blocks
                                .last()
                                .map(|b| b.patterns.clone())
                                .unwrap_or_default();
                            self.read_file(&file, depth + 1);
                            self.blocks.push(Block {
                                patterns: current,
                                options: Vec::new(),
                            });
                        }
                    }
                }
                _ => {
                    if let Some(block) = self.blocks.last_mut() {
                        block.options.push((key, value));
                    }
                }
            }
        }
    }

    fn include_targets(&self, raw: &str) -> Vec<PathBuf> {
        let path = expand_tilde(raw, &self.home);
        let path = if path.is_absolute() {
            path
        } else {
            self.home.join(".ssh").join(path)
        };
        let name = path
            .file_name()
            .map(|n| n.to_string_lossy().into_owned())
            .unwrap_or_default();
        if !name.contains(['*', '?']) {
            return vec![path];
        }
        let Some(dir) = path.parent() else {
            return Vec::new();
        };
        let mut out: Vec<PathBuf> = std::fs::read_dir(dir)
            .into_iter()
            .flatten()
            .flatten()
            .filter(|e| glob_match(&name, &e.file_name().to_string_lossy()))
            .map(|e| e.path())
            .collect();
        out.sort();
        out
    }

    /// Concrete (wildcard-free, non-negated) Host names, in file order.
    pub fn aliases(&self) -> Vec<String> {
        let mut out: Vec<String> = Vec::new();
        for b in &self.blocks {
            for p in &b.patterns {
                if !p.contains(['*', '?', '!']) && !out.iter().any(|o| o.eq_ignore_ascii_case(p)) {
                    out.push(p.clone());
                }
            }
        }
        out
    }

    /// Resolve `host` against every matching block; first value wins, IdentityFile accumulates.
    pub fn resolve(&self, host: &str) -> HostConfig {
        let mut hostname = None;
        let mut user = None;
        let mut port = None;
        let mut identity_files = Vec::new();
        let mut identities_only = None;
        let mut host_key_alias = None;
        let mut known_hosts: Option<Vec<PathBuf>> = None;
        let mut strict = None;
        let mut timeout = None;
        for b in self
            .blocks
            .iter()
            .filter(|b| patterns_match(&b.patterns, host))
        {
            for (k, v) in &b.options {
                match k.as_str() {
                    "hostname" => {
                        hostname.get_or_insert_with(|| v.replace("%h", host));
                    }
                    "user" => {
                        user.get_or_insert_with(|| v.clone());
                    }
                    "port" if port.is_none() => port = v.parse::<u16>().ok(),
                    "identityfile" => {
                        let p = expand_tilde(v, &self.home);
                        if !identity_files.contains(&p) {
                            identity_files.push(p);
                        }
                    }
                    "identitiesonly" => {
                        identities_only.get_or_insert(v.eq_ignore_ascii_case("yes"));
                    }
                    "hostkeyalias" => {
                        host_key_alias.get_or_insert_with(|| v.clone());
                    }
                    "userknownhostsfile" => {
                        known_hosts.get_or_insert_with(|| {
                            words(v)
                                .iter()
                                .map(|w| expand_tilde(w, &self.home))
                                .collect()
                        });
                    }
                    "stricthostkeychecking" => {
                        strict.get_or_insert_with(|| v.to_ascii_lowercase());
                    }
                    "connecttimeout" if timeout.is_none() => timeout = v.parse::<u64>().ok(),
                    _ => {}
                }
            }
        }
        let ssh_dir = self.home.join(".ssh");
        HostConfig {
            alias: host.to_string(),
            hostname: hostname.unwrap_or_else(|| host.to_string()),
            user,
            port: port.unwrap_or(22),
            identity_files,
            identities_only: identities_only.unwrap_or(false),
            host_key_alias,
            known_hosts_files: known_hosts
                .unwrap_or_else(|| vec![ssh_dir.join("known_hosts"), ssh_dir.join("known_hosts2")]),
            accept_new: matches!(strict.as_deref(), Some("accept-new" | "no" | "off")),
            connect_timeout_secs: timeout,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    const SAMPLE: &str = r#"
Include fleet/none_such_file

Host git github.com
    HostName github.com
    User git

Host f1p vps
    HostName 51.77.147.152
    User ubuntu
    IdentityFile ~/.ssh/id_ed25519_vn
    IdentitiesOnly yes
    ConnectTimeout 10

Host usp prd
    HostName=72.60.186.43
    User root
    IdentityFile "C:/Users/x/.ssh/hostinger_us_ed25519"
    Port 2222

Host fr1
    HostName 10.200.77.1
    HostKeyAlias fr1
    UserKnownHostsFile ~/.ssh/fleet/known_hosts
    StrictHostKeyChecking accept-new

Host * !github.com
    User fallback
    IdentityFile ~/.ssh/id_default
"#;

    fn cfg() -> SshConfig {
        SshConfig::parse(SAMPLE, Path::new("/home/me"))
    }

    #[test]
    fn resolves_alias_fields() {
        let h = cfg().resolve("vps");
        assert_eq!(h.hostname, "51.77.147.152");
        assert_eq!(h.user.as_deref(), Some("ubuntu"));
        assert_eq!(h.port, 22);
        assert!(h.identities_only);
        assert_eq!(h.connect_timeout_secs, Some(10));
        assert_eq!(
            h.identity_files,
            vec![
                PathBuf::from("/home/me/.ssh/id_ed25519_vn"),
                PathBuf::from("/home/me/.ssh/id_default")
            ]
        );
        assert_eq!(h.known_hosts_name(), "51.77.147.152");
    }

    #[test]
    fn equals_sign_quotes_and_port() {
        let h = cfg().resolve("prd");
        assert_eq!(h.hostname, "72.60.186.43");
        assert_eq!(h.user.as_deref(), Some("root"));
        assert_eq!(h.port, 2222);
        assert_eq!(
            h.identity_files[0],
            PathBuf::from("C:/Users/x/.ssh/hostinger_us_ed25519")
        );
    }

    #[test]
    fn host_key_alias_and_known_hosts_file() {
        let h = cfg().resolve("fr1");
        assert_eq!(h.known_hosts_name(), "fr1");
        assert_eq!(
            h.known_hosts_files,
            vec![PathBuf::from("/home/me/.ssh/fleet/known_hosts")]
        );
        assert!(h.accept_new);
        assert_eq!(h.user.as_deref(), Some("fallback"));
    }

    #[test]
    fn negated_pattern_and_unknown_host() {
        let gh = cfg().resolve("github.com");
        assert_eq!(gh.user.as_deref(), Some("git"));
        assert!(gh.identity_files.is_empty());
        let other = cfg().resolve("gemini.google.com");
        assert_eq!(other.hostname, "gemini.google.com");
        assert_eq!(other.user.as_deref(), Some("fallback"));
        assert!(!other.accept_new);
    }

    #[test]
    fn aliases_are_concrete_names() {
        assert_eq!(
            cfg().aliases(),
            vec!["git", "github.com", "f1p", "vps", "usp", "prd", "fr1"]
        );
    }

    #[test]
    fn glob_rules() {
        assert!(glob_match("*.google.com", "a.google.com"));
        assert!(glob_match("10.200.77.?", "10.200.77.5"));
        assert!(!glob_match("10.200.77.?", "10.200.77.15"));
        assert!(patterns_match(&["*", "!bad"], "good"));
        assert!(!patterns_match(&["*", "!bad"], "bad"));
    }
}
