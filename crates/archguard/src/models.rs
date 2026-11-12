use serde::{Deserialize, Serialize};
use std::collections::BTreeMap;
use std::path::PathBuf;

pub const VERSION: &str = env!("CARGO_PKG_VERSION");

#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum Severity {
    Error,
    Warning,
}

impl Severity {
    pub fn as_str(&self) -> &'static str {
        match self {
            Severity::Error => "ERROR",
            Severity::Warning => "WARN",
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct ArchFinding {
    pub rule_id: String,
    pub category: String,
    pub severity: Severity,
    pub path: String,
    pub line: Option<usize>,
    pub message: String,
    pub remediation: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RuleSpec {
    pub id: &'static str,
    pub category: &'static str,
    pub default_severity: Severity,
    pub summary: &'static str,
}

#[derive(Debug, Clone)]
pub struct AuditConfig {
    pub root: PathBuf,
    pub strict: bool,
    pub only_rule: Option<String>,
    pub check_docs_emojis: bool,
}

impl Default for AuditConfig {
    fn default() -> Self {
        Self {
            root: PathBuf::from(if cfg!(windows) { r"C:\src" } else { "/src" }),
            strict: false,
            only_rule: None,
            check_docs_emojis: true,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AuditReport {
    pub tool: String,
    pub version: String,
    pub root: String,
    pub clean: bool,
    pub strict: bool,
    pub scanned_files: usize,
    pub error_count: usize,
    pub warning_count: usize,
    pub duration_ms: f64,
    pub report_blake3: String,
    pub by_rule: BTreeMap<String, usize>,
    pub findings: Vec<ArchFinding>,
}
