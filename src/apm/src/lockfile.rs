//! `apm.lock.yaml`, a port of `apm_cli/deps/lockfile.py` (`LockedDependency.to_dict`,
//! `LockFile.to_yaml` / `from_yaml`) and the deployment ledger rows of
//! `core/deployment_ledger.py`.
//!
//! Entries are stored as ordered key/value maps; emission applies upstream's
//! field order, omission of falsy fields, sorting and the forward-compat rule
//! that unknown keys are replayed last.

use std::path::Path;

use anyhow::Context;
use anyhow::Result;
use anyhow::bail;
use indexmap::IndexMap;

use crate::yaml::Value;
use crate::yaml::{self};

/// Emission order of `LockedDependency.to_dict`.
pub const DEP_FIELD_ORDER: &[&str] = &[
    "repo_url",
    "materialization_repo_url",
    "alias",
    "name",
    "host",
    "host_type",
    "port",
    "registry_prefix",
    "resolved_commit",
    "resolved_ref",
    "version",
    "virtual_path",
    "is_virtual",
    "depth",
    "resolved_by",
    "package_type",
    "deployed_files",
    "deployed_file_hashes",
    "source",
    "local_path",
    "declaring_parent",
    "anchored_local_path",
    "content_hash",
    "is_dev",
    "discovered_via",
    "marketplace_plugin_name",
    "source_url",
    "source_digest",
    "is_insecure",
    "allow_insecure",
    "skill_subset",
    "target_subset",
    "resolved_url",
    "resolved_hash",
    "constraint",
    "resolved_tag",
    "resolved_at",
    "declared_license",
    "extensions",
    "exec_status",
    "replacement",
];

/// Keys consumed by `from_dict` that are never re-emitted.
const DEP_LEGACY_KEYS: &[&str] = &["deployed_skills"];

/// A resolved dependency entry.
#[derive(Debug, Clone, Default, PartialEq)]
pub struct LockedDependency {
    pub fields: IndexMap<String, Value>,
}

fn truthy(v: &Value) -> bool {
    match v {
        Value::Null => false,
        Value::Bool(b) => *b,
        Value::Int(i) => *i != 0,
        Value::Float(f) => *f != 0.0,
        Value::Str(s) | Value::Timestamp(s) => !s.is_empty(),
        Value::Seq(s) => !s.is_empty(),
        Value::Map(m) => !m.is_empty(),
    }
}

fn sorted_str_seq(v: &Value, dedupe: bool) -> Value {
    let mut items: Vec<Value> = v.as_seq().map(<[Value]>::to_vec).unwrap_or_default();
    if dedupe {
        let mut seen = Vec::new();
        items.retain(|i| {
            if seen.contains(i) {
                false
            } else {
                seen.push(i.clone());
                true
            }
        });
    }
    items.sort_by_key(|a| a.to_plain_string());
    Value::Seq(items)
}

fn sorted_map(v: &Value) -> Value {
    let mut m = v.as_map().cloned().unwrap_or_default();
    m.sort_keys();
    Value::Map(m)
}

impl LockedDependency {
    pub fn get(&self, k: &str) -> Option<&Value> {
        self.fields.get(k)
    }
    pub fn str(&self, k: &str) -> Option<&str> {
        self.fields.get(k).and_then(Value::as_str)
    }
    pub fn set(&mut self, k: &str, v: Value) {
        self.fields.insert(k.to_owned(), v);
    }
    pub fn set_str(&mut self, k: &str, v: impl Into<String>) {
        self.set(k, Value::Str(v.into()));
    }
    pub fn repo_url(&self) -> &str {
        self.str("repo_url").unwrap_or("")
    }
    pub fn depth(&self) -> i64 {
        match self.get("depth") {
            Some(Value::Int(i)) => *i,
            _ => 1,
        }
    }
    pub fn deployed_files(&self) -> Vec<String> {
        self.get("deployed_files")
            .and_then(Value::as_seq)
            .map(|s| s.iter().filter_map(Value::to_plain_string).collect())
            .unwrap_or_default()
    }

    /// `get_unique_key` (subset: local, host-qualified remote, virtual).
    pub fn unique_key(&self) -> String {
        if self.str("source") == Some("local")
            && let Some(lp) = self.str("local_path")
        {
            return match self.str("anchored_local_path") {
                Some(a) => format!("local:{a}"),
                None => lp.to_owned(),
            };
        }
        let mut key = match self.str("host") {
            Some(h)
                if h != crate::reference::DEFAULT_HOST && self.str("registry_prefix").is_none() =>
            {
                format!("{h}/{}", self.repo_url())
            }
            _ => self.repo_url().to_owned(),
        };
        if let Some(v) = self.str("virtual_path") {
            key.push('/');
            key.push_str(v);
        }
        key
    }

    pub fn from_value(v: &Value) -> Result<Self> {
        let Value::Map(m) = v else {
            bail!("lockfile dependency entries must be mappings")
        };
        if m.get("repo_url").and_then(Value::as_str).is_none() {
            bail!("lockfile dependency entry is missing 'repo_url'");
        }
        let mut fields = m.clone();
        // Legacy migration: deployed_skills -> deployed_files.
        if let Some(Value::Seq(skills)) = m.get("deployed_skills")
            && !m.get("deployed_files").is_some_and(truthy)
        {
            let mut files = Vec::new();
            for s in skills.iter().filter_map(Value::to_plain_string) {
                files.push(Value::Str(format!(".github/skills/{s}/")));
                files.push(Value::Str(format!(".claude/skills/{s}/")));
            }
            fields.insert("deployed_files".into(), Value::Seq(files));
        }
        Ok(Self { fields })
    }

    /// `LockedDependency.to_dict()`.
    pub fn to_value(&self) -> Value {
        let mut out = IndexMap::new();
        for &k in DEP_FIELD_ORDER {
            let Some(v) = self.fields.get(k) else {
                continue;
            };
            let emit = match k {
                "repo_url" => true,
                "alias" | "name" => !matches!(v, Value::Null),
                "depth" => !matches!(v, Value::Int(1)),
                _ => truthy(v),
            };
            if !emit {
                continue;
            }
            let v = match k {
                "deployed_files" => sorted_str_seq(v, true),
                "skill_subset" | "target_subset" => sorted_str_seq(v, false),
                "deployed_file_hashes" => sorted_map(v),
                "is_virtual" | "is_dev" | "is_insecure" | "allow_insecure" => Value::Bool(true),
                _ => v.clone(),
            };
            out.insert(k.to_owned(), v);
        }
        for (k, v) in &self.fields {
            if !DEP_FIELD_ORDER.contains(&k.as_str()) && !DEP_LEGACY_KEYS.contains(&k.as_str()) {
                out.entry(k.clone()).or_insert_with(|| v.clone());
            }
        }
        Value::Map(out)
    }
}

/// One `deployments:` ledger row.
#[derive(Debug, Clone, PartialEq)]
pub struct DeploymentRow {
    pub kind: String,
    pub target: String,
    pub value: String,
    pub runtime: Option<String>,
    pub scope: String,
    pub owners: Vec<String>,
    pub active_owner: String,
    pub content_hash: Option<String>,
}

impl DeploymentRow {
    pub fn key(&self) -> String {
        format!(
            "{}|{}|{}|{}",
            self.target,
            self.runtime.as_deref().unwrap_or(""),
            self.scope,
            self.value
        )
    }
    fn to_value(&self) -> Value {
        let opt = |o: &Option<String>| o.clone().map_or(Value::Null, Value::Str);
        Value::Map(IndexMap::from([
            ("kind".into(), Value::str(&self.kind)),
            ("target".into(), Value::str(&self.target)),
            ("value".into(), Value::str(&self.value)),
            ("runtime".into(), opt(&self.runtime)),
            ("scope".into(), Value::str(&self.scope)),
            (
                "owners".into(),
                Value::Seq(self.owners.iter().map(Value::str).collect()),
            ),
            ("active_owner".into(), Value::str(&self.active_owner)),
            ("content_hash".into(), opt(&self.content_hash)),
        ]))
    }
    fn from_value(v: &Value) -> Result<Self> {
        let s = |k: &str| v.get(k).and_then(Value::to_plain_string);
        Ok(Self {
            kind: s("kind").context("deployment row missing 'kind'")?,
            target: s("target").context("deployment row missing 'target'")?,
            value: s("value").context("deployment row missing 'value'")?,
            runtime: s("runtime"),
            scope: s("scope").unwrap_or_else(|| "project".into()),
            owners: v
                .get("owners")
                .and_then(Value::as_seq)
                .map(|o| o.iter().filter_map(Value::to_plain_string).collect())
                .unwrap_or_default(),
            active_owner: s("active_owner").unwrap_or_default(),
            content_hash: s("content_hash"),
        })
    }
}

/// Legacy prefix -> target attribution (`_LEGACY_TARGET_PREFIXES`).
pub fn legacy_target_for(path: &str) -> &'static str {
    const P: &[(&str, &str)] = &[
        (".copilot/", "copilot"),
        (".github/", "copilot"),
        (".claude/", "claude"),
        (".cursor/", "cursor"),
        (".windsurf/", "windsurf"),
        (".kiro/", "kiro"),
        (".gemini/", "gemini"),
        (".codex/", "codex"),
        (".opencode/", "opencode"),
    ];
    P.iter()
        .find(|(p, _)| path.starts_with(p))
        .map_or("legacy", |(_, t)| t)
}

#[derive(Debug, Clone, PartialEq)]
pub struct LockFile {
    pub lockfile_version: String,
    pub generated_at: Option<Value>,
    pub apm_version: Option<String>,
    pub dependencies: Vec<LockedDependency>,
    /// `None` when absent; synthesized from deployed files at write time.
    pub deployments: Option<Vec<DeploymentRow>>,
    /// MCP/LSP and other optional top-level sections, kept verbatim (`mcp_servers`, `mcp_configs`, ...).
    pub sections: IndexMap<String, Value>,
    pub local_deployed_files: Vec<String>,
    pub local_deployed_file_hashes: IndexMap<String, String>,
    pub replacements: Option<Value>,
}

impl Default for LockFile {
    fn default() -> Self {
        Self {
            lockfile_version: "1".into(),
            generated_at: None,
            apm_version: None,
            dependencies: vec![],
            deployments: None,
            sections: IndexMap::new(),
            local_deployed_files: vec![],
            local_deployed_file_hashes: IndexMap::new(),
            replacements: None,
        }
    }
}

/// Optional sections in emission order with their normalization.
const SECTION_ORDER: &[&str] = &[
    "mcp_servers",
    "mcp_configs",
    "mcp_omissions",
    "mcp_target_servers",
    "mcp_config_provenance",
    "lsp_servers",
    "lsp_configs",
    "lsp_target_servers",
    "lsp_config_provenance",
];

pub const SUPPORTED_VERSIONS: &[&str] = &["1", "2", "3"];

impl LockFile {
    pub fn from_yaml(text: &str) -> Result<Self> {
        if text
            .lines()
            .any(|l| l.starts_with("<<<<<<<") || l.starts_with(">>>>>>>"))
        {
            bail!(
                "apm.lock.yaml contains merge-conflict markers; resolve them or restore it from version control"
            );
        }
        let doc = yaml::parse(text)?;
        let Value::Map(data) = doc else {
            bail!("apm.lock.yaml must be a mapping")
        };
        let version = data
            .get("lockfile_version")
            .and_then(Value::to_plain_string)
            .unwrap_or_else(|| "1".into());
        if !SUPPORTED_VERSIONS.contains(&version.as_str()) {
            bail!("Unsupported lockfile_version '{version}'");
        }
        let mut lock = Self {
            lockfile_version: version,
            generated_at: data.get("generated_at").cloned(),
            apm_version: data.get("apm_version").and_then(Value::to_plain_string),
            ..Self::default()
        };
        if let Some(Value::Seq(deps)) = data.get("dependencies") {
            for d in deps {
                lock.add_dependency(LockedDependency::from_value(d)?);
            }
        }
        if let Some(rows) = data.get("deployments") {
            let Value::Seq(rows) = rows else {
                bail!("'deployments' must be a list")
            };
            lock.deployments = Some(
                rows.iter()
                    .map(DeploymentRow::from_value)
                    .collect::<Result<_>>()?,
            );
        }
        for &k in SECTION_ORDER {
            if let Some(v) = data.get(k) {
                lock.sections.insert(k.to_owned(), v.clone());
            }
        }
        if let Some(Value::Seq(files)) = data.get("local_deployed_files") {
            lock.local_deployed_files = files.iter().filter_map(Value::to_plain_string).collect();
        }
        if let Some(Value::Map(h)) = data.get("local_deployed_file_hashes") {
            lock.local_deployed_file_hashes = h
                .iter()
                .filter_map(|(k, v)| Some((k.clone(), v.to_plain_string()?)))
                .collect();
        }
        if let Some(r) = data.get("replacements") {
            if !matches!(r, Value::Seq(_)) {
                bail!("'replacements' must be a list");
            }
            lock.replacements = Some(r.clone());
        }
        Ok(lock)
    }

    pub fn read(path: &Path) -> Result<Option<Self>> {
        if !path.exists() {
            return Ok(None);
        }
        let text = std::fs::read_to_string(path)?;
        Ok(Some(
            Self::from_yaml(&text).with_context(|| format!("parsing {}", path.display()))?,
        ))
    }

    /// `add_dependency`: replaces an entry with the same unique key.
    pub fn add_dependency(&mut self, dep: LockedDependency) {
        let key = dep.unique_key();
        if let Some(existing) = self.dependencies.iter_mut().find(|d| d.unique_key() == key) {
            *existing = dep;
        } else {
            self.dependencies.push(dep);
        }
    }

    pub fn get_dependency(&self, key: &str) -> Option<&LockedDependency> {
        self.dependencies.iter().find(|d| d.unique_key() == key)
    }

    /// Dependencies sorted by `(depth, repo_url)` (`get_all_dependencies`).
    pub fn sorted_dependencies(&self) -> Vec<&LockedDependency> {
        let mut v: Vec<&LockedDependency> = self.dependencies.iter().collect();
        v.sort_by(|a, b| (a.depth(), a.repo_url()).cmp(&(b.depth(), b.repo_url())));
        v
    }

    fn required_version(&self) -> &'static str {
        if self.replacements.is_some()
            || self
                .dependencies
                .iter()
                .any(|d| d.get("replacement").is_some_and(truthy))
        {
            return "3";
        }
        let v2 = self.dependencies.iter().any(|d| {
            d.str("source") == Some("registry")
                || ["constraint", "resolved_tag", "resolved_at"]
                    .iter()
                    .any(|k| d.get(k).is_some_and(truthy))
        });
        if v2 { "2" } else { "1" }
    }

    /// Synthesize ledger rows from legacy views (`DeploymentLedgerCodec.from_lockfile`).
    pub fn synthesize_deployments(&self) -> Vec<DeploymentRow> {
        let mut rows: IndexMap<String, DeploymentRow> = IndexMap::new();
        let mut add = |owner: &str, files: &[String], hashes: &dyn Fn(&str) -> Option<String>| {
            for value in files {
                let target = legacy_target_for(value).to_owned();
                let scope = if value.starts_with(".copilot/") {
                    "user"
                } else {
                    "project"
                };
                let mut row = DeploymentRow {
                    kind: "project-relative".into(),
                    target,
                    value: value.clone(),
                    runtime: None,
                    scope: scope.into(),
                    owners: vec![],
                    active_owner: owner.into(),
                    content_hash: None,
                };
                let key = row.key();
                let prior = rows.shift_remove(&key);
                let mut owners = prior.as_ref().map(|p| p.owners.clone()).unwrap_or_default();
                owners.retain(|o| o != owner);
                owners.push(owner.into());
                row.owners = owners;
                row.content_hash = hashes(value).or_else(|| prior.and_then(|p| p.content_hash));
                rows.insert(key, row);
            }
        };
        for d in &self.dependencies {
            let h = d.get("deployed_file_hashes").cloned();
            add(&d.unique_key(), &d.deployed_files(), &|p| {
                h.as_ref()
                    .and_then(|h| h.get(p))
                    .and_then(Value::to_plain_string)
            });
        }
        let lh = self.local_deployed_file_hashes.clone();
        add(".", &self.local_deployed_files, &|p| lh.get(p).cloned());
        let mut out: Vec<DeploymentRow> = rows.into_values().collect();
        out.sort_by_key(DeploymentRow::key);
        out
    }

    /// `LockFile.to_yaml()`.
    pub fn to_yaml(&mut self) -> String {
        self.lockfile_version = self.required_version().into();
        let mut data = IndexMap::new();
        data.insert(
            "lockfile_version".into(),
            Value::str(&self.lockfile_version),
        );
        if let Some(g) = &self.generated_at
            && !matches!(g, Value::Null)
        {
            data.insert("generated_at".into(), g.clone());
        }
        if let Some(v) = self.apm_version.as_ref().filter(|v| !v.is_empty()) {
            data.insert("apm_version".into(), Value::str(v));
        }
        data.insert(
            "dependencies".into(),
            Value::Seq(
                self.sorted_dependencies()
                    .iter()
                    .map(|d| d.to_value())
                    .collect(),
            ),
        );
        let mut rows = match &self.deployments {
            Some(r) => r.clone(),
            None => self.synthesize_deployments(),
        };
        rows.sort_by_key(DeploymentRow::key);
        data.insert(
            "deployments".into(),
            Value::Seq(rows.iter().map(DeploymentRow::to_value).collect()),
        );
        for &k in SECTION_ORDER {
            let Some(v) = self.sections.get(k) else {
                continue;
            };
            let present_ok = k == "mcp_target_servers";
            if !truthy(v) && !present_ok {
                continue;
            }
            let v = match (k, v) {
                ("mcp_servers" | "lsp_servers", v) => sorted_str_seq(v, false),
                ("mcp_target_servers" | "lsp_target_servers", Value::Map(m)) => {
                    let mut m: IndexMap<String, Value> = m
                        .iter()
                        .map(|(t, s)| (t.clone(), sorted_str_seq(s, false)))
                        .collect();
                    m.sort_keys();
                    Value::Map(m)
                }
                (_, Value::Map(_)) => sorted_map(v),
                (_, v) => v.clone(),
            };
            data.insert(k.to_owned(), v);
        }
        if !self.local_deployed_files.is_empty() {
            let mut f = self.local_deployed_files.clone();
            f.sort();
            data.insert(
                "local_deployed_files".into(),
                Value::Seq(f.into_iter().map(Value::Str).collect()),
            );
        }
        if !self.local_deployed_file_hashes.is_empty() {
            let mut h = self.local_deployed_file_hashes.clone();
            h.sort_keys();
            data.insert(
                "local_deployed_file_hashes".into(),
                Value::Map(h.into_iter().map(|(k, v)| (k, Value::Str(v))).collect()),
            );
        }
        if let Some(r) = &self.replacements {
            data.insert("replacements".into(), r.clone());
        }
        yaml::to_string(&Value::Map(data))
    }

    /// Write with LF line endings (upstream `write_text_lf`).
    pub fn write(&mut self, path: &Path) -> Result<()> {
        let text = self.to_yaml();
        std::fs::write(path, text).with_context(|| format!("writing {}", path.display()))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn new_lockfile_omits_generated_at() {
        // req-lk-005
        let y = LockFile::default().to_yaml();
        assert!(!y.contains("generated_at:"));
        assert_eq!(
            y,
            "lockfile_version: '1'\ndependencies: []\ndeployments: []\n"
        );
    }

    #[test]
    fn dependency_to_dict_order_and_omissions() {
        let mut d = LockedDependency::default();
        d.set_str("source", "local");
        d.set_str("repo_url", "_local/x");
        d.set("depth", Value::Int(1));
        d.set("is_dev", Value::Bool(false));
        d.set(
            "deployed_files",
            Value::Seq(vec![Value::str("b"), Value::str("a"), Value::str("a")]),
        );
        d.set("zz_future", Value::str("kept"));
        d.set_str("local_path", "./x");
        let v = yaml::to_string(&d.to_value());
        assert_eq!(
            v,
            "repo_url: _local/x\ndeployed_files:\n- a\n- b\nsource: local\nlocal_path: ./x\nzz_future: kept\n"
        );
    }

    #[test]
    fn version_is_content_driven() {
        let mut l = LockFile::default();
        let mut d = LockedDependency::default();
        d.set_str("repo_url", "o/r");
        d.set_str("constraint", "^1.0.0");
        l.add_dependency(d);
        assert!(l.to_yaml().starts_with("lockfile_version: '2'\n"));
    }

    #[test]
    fn rejects_conflict_markers_and_unknown_version() {
        assert!(LockFile::from_yaml("<<<<<<< HEAD\nlockfile_version: '1'\n").is_err());
        assert!(LockFile::from_yaml("lockfile_version: '9'\n").is_err());
    }
}
