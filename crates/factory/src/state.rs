//! Resumable, idempotent steps: a step is skipped when its record carries the same key (version +
//! input hash). Written atomically (tmp + rename) after every step, so an interrupted run resumes at
//! the first unfinished step. A pid lock forbids two factory runs at once.

use std::collections::BTreeMap;
use std::io::Write as _;
use std::path::{Path, PathBuf};

use serde::{Deserialize, Serialize};

#[derive(Debug, Default, Clone, Serialize, Deserialize, PartialEq)]
pub struct State {
    pub channel: String,
    pub version: String,
    pub steps: BTreeMap<String, StepRecord>,
    /// Last build summary from `siso_metrics.json`.
    pub last_build: Option<crate::metrics::Summary>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct StepRecord {
    pub key: String,
    pub finished_unix: u64,
    pub secs: u64,
}

impl State {
    pub fn load(p: &Path) -> Result<Self, String> {
        match std::fs::read_to_string(p) {
            Ok(s) => serde_json::from_str(&s).map_err(|e| format!("{}: {e}", p.display())),
            Err(e) if e.kind() == std::io::ErrorKind::NotFound => Ok(Self::default()),
            Err(e) => Err(format!("{}: {e}", p.display())),
        }
    }

    pub fn save(&self, p: &Path) -> Result<(), String> {
        let tmp = p.with_extension("json.tmp");
        let mut body = serde_json::to_string_pretty(self).map_err(|e| e.to_string())?;
        body.push('\n');
        std::fs::write(&tmp, body).map_err(|e| format!("{}: {e}", tmp.display()))?;
        std::fs::rename(&tmp, p).map_err(|e| format!("{}: {e}", p.display()))
    }

    pub fn done(&self, step: &str, key: &str) -> bool {
        self.steps.get(step).is_some_and(|r| r.key == key)
    }

    pub fn mark(&mut self, step: &str, key: &str, secs: u64) {
        self.steps
            .insert(step.into(), StepRecord { key: key.into(), finished_unix: now(), secs });
    }

    /// A new version invalidates every step.
    pub fn retarget(&mut self, channel: &str, version: &str) {
        if self.version != version {
            self.steps.clear();
        }
        channel.clone_into(&mut self.channel);
        version.clone_into(&mut self.version);
    }
}

pub fn now() -> u64 {
    std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).map_or(0, |d| d.as_secs())
}

/// Content key for idempotency (blake3 of the parts, 16 hex).
pub fn key(parts: &[&str]) -> String {
    let mut h = blake3::Hasher::new();
    for p in parts {
        h.update(p.as_bytes());
        h.update(&[0]);
    }
    h.finalize().to_hex()[..16].to_owned()
}

/// Exclusive run lock: `<state>.lock` holds our pid; a lock whose pid is gone is stale and taken.
pub struct Lock(PathBuf);

impl Lock {
    pub fn acquire(state: &Path) -> Result<Self, String> {
        let p = state.with_extension("lock");
        for _ in 0..2 {
            match std::fs::OpenOptions::new().write(true).create_new(true).open(&p) {
                Ok(mut f) => {
                    let _ = write!(f, "{}", std::process::id());
                    return Ok(Self(p));
                }
                Err(e) if e.kind() == std::io::ErrorKind::AlreadyExists => {
                    let pid = std::fs::read_to_string(&p).unwrap_or_default();
                    let pid = pid.trim();
                    if !pid.is_empty() && Path::new(&format!("/proc/{pid}")).exists() {
                        return Err(format!("another factory run holds {} (pid {pid})", p.display()));
                    }
                    let _ = std::fs::remove_file(&p);
                }
                Err(e) => return Err(format!("{}: {e}", p.display())),
            }
        }
        Err(format!("could not take {}", p.display()))
    }
}

impl Drop for Lock {
    fn drop(&mut self) {
        let _ = std::fs::remove_file(&self.0);
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn roundtrip_and_retarget() {
        let d = tempfile::tempdir().unwrap();
        let p = d.path().join("s.json");
        let mut s = State::load(&p).unwrap();
        s.retarget("stable", "157.0.8103.78");
        s.mark("sync", "k1", 3);
        s.save(&p).unwrap();
        let mut s2 = State::load(&p).unwrap();
        assert!(s2.done("sync", "k1"));
        assert!(!s2.done("sync", "k2"));
        s2.retarget("stable", "157.0.8103.78");
        assert!(s2.done("sync", "k1"));
        s2.retarget("stable", "157.0.8103.99");
        assert!(s2.steps.is_empty());
        assert_ne!(key(&["a", "b"]), key(&["ab"]));
    }

    #[test]
    fn lock_is_exclusive_and_stale_is_taken() {
        let d = tempfile::tempdir().unwrap();
        let p = d.path().join("s.json");
        let l = Lock::acquire(&p).unwrap();
        assert!(Lock::acquire(&p).is_err());
        drop(l);
        std::fs::write(p.with_extension("lock"), "999999999").unwrap();
        assert!(Lock::acquire(&p).is_ok());
    }
}
