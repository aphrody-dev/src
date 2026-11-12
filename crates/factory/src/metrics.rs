//! `siso_metrics.json` (one JSON object per line) → build summary. Keys verified on siso v1.6.5
//! (fr1, 2026-11-12): `step_id`, `action`, `is_local`, `cached`, `no_exec`, `err`, `exec_nanos`,
//! `utime_nanos`, `stime_nanos`, `max_rss`, `start_nanos`, `action_end_nanos`.

use std::collections::BTreeMap;

use serde::{Deserialize, Serialize};

#[derive(Debug, Default, Clone, Serialize, Deserialize, PartialEq)]
pub struct Summary {
    pub steps: u64,
    pub local: u64,
    pub remote: u64,
    pub cached: u64,
    pub no_exec: u64,
    pub errors: u64,
    pub wall_s: u64,
    pub cpu_s: u64,
    pub max_rss_mb: u64,
    /// action → (count, exec seconds), heaviest first in `top()`.
    pub by_action: BTreeMap<String, (u64, u64)>,
}

#[derive(Deserialize)]
struct Line {
    step_id: Option<String>,
    #[serde(default)]
    action: String,
    #[serde(default)]
    is_local: bool,
    #[serde(default)]
    cached: bool,
    #[serde(default)]
    no_exec: bool,
    err: Option<serde_json::Value>,
    #[serde(default)]
    exec_nanos: u64,
    #[serde(default)]
    utime_nanos: u64,
    #[serde(default)]
    stime_nanos: u64,
    #[serde(default)]
    max_rss: u64,
    #[serde(default)]
    start_nanos: u64,
    #[serde(default)]
    action_end_nanos: u64,
}

impl Summary {
    pub fn parse(src: &str) -> Self {
        let mut s = Self::default();
        let (mut first, mut last) = (u64::MAX, 0);
        for l in src.lines().filter_map(|l| serde_json::from_str::<Line>(l).ok()) {
            if l.step_id.is_none() {
                continue;
            }
            s.steps += 1;
            if l.no_exec {
                s.no_exec += 1;
            } else if l.cached {
                s.cached += 1;
            } else if l.is_local {
                s.local += 1;
            } else {
                s.remote += 1;
            }
            s.errors += u64::from(l.err.is_some());
            s.cpu_s += (l.utime_nanos + l.stime_nanos) / 1_000_000_000;
            s.max_rss_mb = s.max_rss_mb.max(l.max_rss / 1_000_000);
            first = first.min(l.start_nanos);
            last = last.max(l.action_end_nanos);
            // Generated GN actions (`__dir_target___toolchain__rule`) are the Python class.
            let k = if l.action.starts_with("__") { "gn_action".into() } else { l.action };
            let e = s.by_action.entry(k).or_default();
            e.0 += 1;
            e.1 += l.exec_nanos / 1_000_000_000;
        }
        s.wall_s = last.saturating_sub(if first == u64::MAX { 0 } else { first }) / 1_000_000_000;
        s
    }

    /// Cache hit rate over executed (non no-exec) steps, in percent.
    pub fn cache_rate(&self) -> f64 {
        let ex = self.steps - self.no_exec;
        if ex == 0 { 0.0 } else { self.cached as f64 * 100.0 / ex as f64 }
    }

    pub fn top(&self, n: usize) -> Vec<(&str, u64, u64)> {
        let mut v: Vec<_> = self.by_action.iter().map(|(k, (c, e))| (k.as_str(), *c, *e)).collect();
        v.sort_by_key(|a| std::cmp::Reverse(a.2));
        v.truncate(n);
        v
    }
}

impl std::fmt::Display for Summary {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(
            f,
            "steps={} local={} remote={} cached={} ({:.1}%) no_exec={} errors={} wall={}s cpu={}s max_rss={}MB",
            self.steps,
            self.local,
            self.remote,
            self.cached,
            self.cache_rate(),
            self.no_exec,
            self.errors,
            self.wall_s,
            self.cpu_s,
            self.max_rss_mb
        )?;
        for (a, c, e) in self.top(5) {
            write!(f, "\n  {a}: n={c} exec={e}s")?;
        }
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn summarizes_siso_lines() {
        let src = r#"{"build_id":"x","duration_nanos":5}
{"step_id":"a","action":"cxx","is_local":true,"exec_nanos":4000000000,"utime_nanos":3000000000,"stime_nanos":0,"max_rss":2971000000,"start_nanos":0,"action_end_nanos":10000000000}
{"step_id":"b","action":"cxx","cached":true,"start_nanos":1,"action_end_nanos":2}
{"step_id":"c","action":"__base_x___build_toolchain_linux_clang_x64__rule","exec_nanos":1000000000,"start_nanos":1,"action_end_nanos":3}
{"step_id":"d","action":"copy","no_exec":true}
{"step_id":"e","action":"cxx","is_local":true,"err":"spawn helper: EOF"}
not json"#;
        let s = Summary::parse(src);
        assert_eq!((s.steps, s.local, s.remote, s.cached, s.no_exec, s.errors), (5, 2, 1, 1, 1, 1));
        assert_eq!((s.wall_s, s.cpu_s, s.max_rss_mb), (10, 3, 2971));
        assert_eq!(s.by_action["gn_action"], (1, 1));
        assert_eq!(s.top(1)[0].0, "cxx");
        assert!((s.cache_rate() - 25.0).abs() < 1e-9);
    }
}
