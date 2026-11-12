//! known_hosts verification (OpenSSH format): plain and hashed (`|1|salt|hash`) host fields,
//! `[host]:port` for non-standard ports, wildcard patterns, `@revoked` markers. Lines with key
//! types this build cannot parse are skipped instead of failing the whole file.

use std::io::Write;
use std::path::{Path, PathBuf};

use base64::Engine;
use base64::engine::general_purpose::STANDARD as B64;
use hmac::{Hmac, KeyInit, Mac};
use russh::keys::{HashAlg, PublicKey};
use sha1::Sha1;

use crate::config::patterns_match;

/// Result of looking a server key up in the known_hosts files.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum Verdict {
    /// A recorded key matches.
    Known { file: PathBuf, line: usize },
    /// The host is recorded with a key of the same type that differs: possible MITM.
    Mismatch { file: PathBuf, line: usize },
    /// The key is explicitly revoked.
    Revoked { file: PathBuf, line: usize },
    /// No key of this type is recorded for the host.
    Unknown,
}

/// The host field as recorded: `host` on port 22, `[host]:port` otherwise.
pub fn host_field(host: &str, port: u16) -> String {
    if port == 22 {
        host.to_string()
    } else {
        format!("[{host}]:{port}")
    }
}

fn hashed_match(entry: &str, host: &str) -> bool {
    let mut parts = entry.trim_start_matches("|1|").split('|');
    let (Some(salt), Some(hash)) = (parts.next(), parts.next()) else {
        return false;
    };
    let (Ok(salt), Ok(hash)) = (B64.decode(salt), B64.decode(hash)) else {
        return false;
    };
    let Ok(mac) = Hmac::<Sha1>::new_from_slice(&salt) else {
        return false;
    };
    mac.chain_update(host.as_bytes())
        .verify_slice(&hash)
        .is_ok()
}

fn host_matches(field: &str, host: &str) -> bool {
    if field.starts_with("|1|") {
        return field.split(',').any(|e| hashed_match(e, host));
    }
    let patterns: Vec<&str> = field.split(',').collect();
    patterns_match(&patterns, host)
}

/// Check `key` for `host:port` in `text` (the content of one known_hosts file).
pub fn check_text(text: &str, file: &Path, host: &str, port: u16, key: &PublicKey) -> Verdict {
    let wanted = host_field(host, port);
    let mut mismatch = None;
    for (idx, raw) in text.lines().enumerate() {
        let line = idx + 1;
        let raw = raw.trim();
        if raw.is_empty() || raw.starts_with('#') {
            continue;
        }
        let mut fields = raw.split_whitespace();
        let mut first = fields.next().unwrap_or_default();
        let marker = if first.starts_with('@') {
            let m = first;
            first = fields.next().unwrap_or_default();
            Some(m)
        } else {
            None
        };
        if marker == Some("@cert-authority") || !host_matches(first, &wanted) {
            continue;
        }
        let (Some(kind), Some(b64)) = (fields.next(), fields.next()) else {
            continue;
        };
        let Ok(recorded) = PublicKey::from_openssh(&format!("{kind} {b64}")) else {
            continue;
        };
        let same_key = recorded.key_data() == key.key_data();
        if marker == Some("@revoked") {
            if same_key {
                return Verdict::Revoked {
                    file: file.into(),
                    line,
                };
            }
            continue;
        }
        if same_key {
            return Verdict::Known {
                file: file.into(),
                line,
            };
        }
        if recorded.algorithm() == key.algorithm() && mismatch.is_none() {
            mismatch = Some(line);
        }
    }
    match mismatch {
        Some(line) => Verdict::Mismatch {
            file: file.into(),
            line,
        },
        None => Verdict::Unknown,
    }
}

/// Check every file in order; a revocation or match decides, a mismatch in any file rejects.
pub fn check(files: &[PathBuf], host: &str, port: u16, key: &PublicKey) -> Verdict {
    let mut mismatch = None;
    for file in files {
        let Ok(text) = std::fs::read_to_string(file) else {
            continue;
        };
        match check_text(&text, file, host, port, key) {
            v @ (Verdict::Known { .. } | Verdict::Revoked { .. }) => return v,
            v @ Verdict::Mismatch { .. } => {
                mismatch.get_or_insert(v);
            }
            Verdict::Unknown => {}
        }
    }
    mismatch.unwrap_or(Verdict::Unknown)
}

/// Append `host key` to `file` (creating it and its directory if needed).
pub fn learn(file: &Path, host: &str, port: u16, key: &PublicKey) -> std::io::Result<()> {
    if let Some(dir) = file.parent() {
        std::fs::create_dir_all(dir)?;
    }
    let line = key.to_openssh().map_err(std::io::Error::other)?;
    // `to_openssh` appends the comment; known_hosts lines carry only type and blob.
    let mut parts = line.split_whitespace();
    let (kind, blob) = (
        parts.next().unwrap_or_default(),
        parts.next().unwrap_or_default(),
    );
    let needs_newline = std::fs::read(file)
        .map(|b| !b.is_empty() && !b.ends_with(b"\n"))
        .unwrap_or(false);
    let mut f = std::fs::OpenOptions::new()
        .create(true)
        .append(true)
        .open(file)?;
    if needs_newline {
        writeln!(f)?;
    }
    writeln!(f, "{} {kind} {blob}", host_field(host, port))
}

/// `SHA256:...` fingerprint (public information, safe to print).
pub fn fingerprint(key: &PublicKey) -> String {
    key.fingerprint(HashAlg::Sha256).to_string()
}

#[cfg(test)]
mod tests {
    use super::*;

    use russh::keys::ssh_key::public::{Ed25519PublicKey, KeyData};

    /// Deterministic public keys (no private material involved).
    fn key(seed: u8) -> PublicKey {
        PublicKey::new(KeyData::Ed25519(Ed25519PublicKey([seed; 32])), "")
    }

    fn line(seed: u8) -> String {
        let s = key(seed).to_openssh().unwrap();
        s.split_whitespace().take(2).collect::<Vec<_>>().join(" ")
    }

    #[test]
    fn plain_match_mismatch_unknown() {
        let (a, b) = (line(1), line(2));
        let text =
            format!("# c\n10.0.0.1 {a}\nother {b}\n10.0.0.2 ssh-mldsa44-ed25519 AAAAnotparsable\n");
        let f = Path::new("kh");
        assert_eq!(
            check_text(&text, f, "10.0.0.1", 22, &key(1)),
            Verdict::Known {
                file: f.into(),
                line: 2
            }
        );
        assert_eq!(
            check_text(&text, f, "10.0.0.1", 22, &key(2)),
            Verdict::Mismatch {
                file: f.into(),
                line: 2
            }
        );
        assert_eq!(
            check_text(&text, f, "10.0.0.2", 22, &key(1)),
            Verdict::Unknown
        );
        assert_eq!(
            check_text(&text, f, "nowhere", 22, &key(1)),
            Verdict::Unknown
        );
    }

    #[test]
    fn port_and_patterns() {
        let (a, b) = (line(1), line(2));
        let text = format!("[h]:2222 {a}\n*.fleet,!bad.fleet {b}\n");
        let f = Path::new("kh");
        assert!(matches!(
            check_text(&text, f, "h", 2222, &key(1)),
            Verdict::Known { .. }
        ));
        assert_eq!(check_text(&text, f, "h", 22, &key(1)), Verdict::Unknown);
        assert!(matches!(
            check_text(&text, f, "a.fleet", 22, &key(2)),
            Verdict::Known { .. }
        ));
        assert_eq!(
            check_text(&text, f, "bad.fleet", 22, &key(2)),
            Verdict::Unknown
        );
    }

    #[test]
    fn hashed_hosts() {
        let salt = [7u8; 20];
        let mac = Hmac::<Sha1>::new_from_slice(&salt)
            .unwrap()
            .chain_update(b"10.9.9.9")
            .finalize()
            .into_bytes();
        let a = line(1);
        let text = format!("|1|{}|{} {a}\n", B64.encode(salt), B64.encode(mac));
        let f = Path::new("kh");
        assert!(matches!(
            check_text(&text, f, "10.9.9.9", 22, &key(1)),
            Verdict::Known { .. }
        ));
        assert_eq!(
            check_text(&text, f, "10.9.9.8", 22, &key(1)),
            Verdict::Unknown
        );
    }

    #[test]
    fn revoked_wins() {
        let a = line(1);
        let text = format!("@revoked * {a}\nh {a}\n");
        assert!(matches!(
            check_text(&text, Path::new("kh"), "h", 22, &key(1)),
            Verdict::Revoked { .. }
        ));
    }

    #[test]
    fn learn_then_known() {
        let dir = std::env::temp_dir().join(format!("aphrody-remote-kh-{}", std::process::id()));
        let file = dir.join("known_hosts");
        let _ = std::fs::remove_file(&file);
        learn(&file, "h", 2200, &key(1)).unwrap();
        assert!(matches!(
            check(std::slice::from_ref(&file), "h", 2200, &key(1)),
            Verdict::Known { line: 1, .. }
        ));
        let _ = std::fs::remove_dir_all(&dir);
    }
}
