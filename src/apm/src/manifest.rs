//! `apm.yml` model, a port of the parsing rules in `apm_cli/models/apm_package.py`.

use std::path::Path;

use anyhow::Context;
use anyhow::Result;
use anyhow::bail;
use indexmap::IndexMap;

use crate::reference::DependencyReference;
use crate::yaml::Value;
use crate::yaml::{self};

/// Target names accepted by upstream (`core/target_catalog.py`); only some are deployable here.
pub const KNOWN_TARGET_NAMES: &[&str] = &[
    "agent-skills",
    "antigravity",
    "agy",
    "claude",
    "codex",
    "copilot",
    "vscode",
    "agents",
    "copilot-app",
    "copilot-cowork",
    "cursor",
    "gemini",
    "kiro",
    "opencode",
    "windsurf",
    "all",
];

/// Normalize a target alias to its canonical name.
pub fn normalize_target(name: &str) -> Result<String> {
    let n = name.trim().to_ascii_lowercase();
    let c = match n.as_str() {
        "vscode" | "agents" => "copilot",
        "agy" => "antigravity",
        other if KNOWN_TARGET_NAMES.contains(&other) => other,
        _ => bail!(
            "Unknown target '{name}'. Known targets: {}",
            KNOWN_TARGET_NAMES.join(", ")
        ),
    };
    Ok(c.to_owned())
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum Includes {
    Auto,
    Paths(Vec<String>),
}

#[derive(Debug, Clone)]
pub struct Manifest {
    pub name: String,
    pub version: String,
    pub description: Option<String>,
    pub author: Option<String>,
    pub license: Option<String>,
    pub package_type: Option<String>,
    pub includes: Option<Includes>,
    /// Canonical target names from `targets:` / `target:` (CSV allowed).
    pub targets: Vec<String>,
    pub apm: Vec<DependencyReference>,
    pub mcp: Vec<Value>,
    pub dev_apm: Vec<DependencyReference>,
    pub scripts: IndexMap<String, String>,
    /// Full document, kept so re-serialization preserves unknown / `x-*` keys.
    pub raw: IndexMap<String, Value>,
}

fn parse_targets(v: &Value) -> Result<Vec<String>> {
    let items: Vec<String> = match v {
        Value::Null => vec![],
        Value::Str(s) => s
            .split(',')
            .map(str::trim)
            .filter(|s| !s.is_empty())
            .map(str::to_owned)
            .collect(),
        Value::Seq(items) => items
            .iter()
            .map(|i| {
                i.as_str()
                    .map(str::to_owned)
                    .context("target entries must be strings")
            })
            .collect::<Result<_>>()?,
        _ => bail!("'targets' must be a string or a list of strings"),
    };
    let mut out = Vec::new();
    for t in items {
        let c = normalize_target(&t)?;
        if !out.contains(&c) {
            out.push(c);
        }
    }
    Ok(out)
}

fn parse_dep_block(
    v: Option<&Value>,
    label: &str,
) -> Result<(Vec<DependencyReference>, Vec<Value>)> {
    let Some(v) = v else {
        return Ok((vec![], vec![]));
    };
    if matches!(v, Value::Null) {
        return Ok((vec![], vec![]));
    }
    let Value::Map(m) = v else {
        bail!(
            "Invalid '{label}': expected a mapping with 'apm:' and/or 'mcp:' keys. Use the structured format:\n  {label}:\n    apm:\n      - owner/repo"
        )
    };
    let mut apm = Vec::new();
    match m.get("apm") {
        None | Some(Value::Null) => {}
        Some(Value::Seq(items)) => {
            for item in items {
                apm.push(DependencyReference::from_value(item)?);
            }
        }
        Some(_) => bail!("'{label}.apm' must be a list"),
    }
    let mcp = match m.get("mcp") {
        None | Some(Value::Null) => vec![],
        Some(Value::Seq(items)) => items.clone(),
        Some(_) => bail!("'{label}.mcp' must be a list"),
    };
    Ok((apm, mcp))
}

impl Manifest {
    pub fn parse(text: &str) -> Result<Self> {
        let doc = yaml::parse(text)?;
        let Value::Map(data) = doc else {
            bail!("apm.yml must be a mapping")
        };
        for key in ["name", "version"] {
            match data.get(key) {
                None => bail!("Missing required field '{key}' in apm.yml"),
                Some(Value::Str(s)) if !s.trim().is_empty() => {}
                Some(_) => bail!("Invalid apm.yml identity: '{key}' must be a non-empty string"),
            }
        }
        let s = |k: &str| data.get(k).and_then(Value::to_plain_string);
        let includes = match data.get("includes") {
            None | Some(Value::Null) => None,
            Some(Value::Str(s)) if s == "auto" => Some(Includes::Auto),
            Some(Value::Seq(items)) if items.iter().all(|i| matches!(i, Value::Str(_))) => {
                Some(Includes::Paths(
                    items
                        .iter()
                        .filter_map(|i| i.as_str().map(str::to_owned))
                        .collect(),
                ))
            }
            Some(_) => bail!("'includes' must be 'auto' or a list of strings"),
        };
        if data.contains_key("targets") && data.contains_key("target") {
            bail!("apm.yml declares both 'target' and 'targets'; keep only 'targets'");
        }
        let targets = match data.get("targets").or_else(|| data.get("target")) {
            Some(v) => parse_targets(v)?,
            None => vec![],
        };
        let (apm, mcp) = parse_dep_block(data.get("dependencies"), "dependencies")?;
        let (dev_apm, _) = parse_dep_block(data.get("devDependencies"), "devDependencies")?;
        let mut scripts = IndexMap::new();
        if let Some(Value::Map(m)) = data.get("scripts") {
            for (k, v) in m {
                scripts.insert(k.clone(), v.to_plain_string().unwrap_or_default());
            }
        }
        Ok(Self {
            name: s("name").unwrap_or_default(),
            version: s("version").unwrap_or_default(),
            description: s("description"),
            author: s("author"),
            license: s("license"),
            package_type: s("type"),
            includes,
            targets,
            apm,
            mcp,
            dev_apm,
            scripts,
            raw: data,
        })
    }

    pub fn load(path: &Path) -> Result<Self> {
        let text =
            std::fs::read_to_string(path).with_context(|| format!("reading {}", path.display()))?;
        Self::parse(&text).with_context(|| format!("parsing {}", path.display()))
    }

    /// Re-serialize the document (`yaml_to_str`, insertion order, comments dropped like upstream).
    pub fn to_yaml(&self) -> String {
        yaml::to_string(&Value::Map(self.raw.clone()))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn rejects_bad_identity() {
        assert!(Manifest::parse("version: 1.0.0\n").is_err());
        assert!(
            Manifest::parse("name: x\nversion: 1.0\n").is_err(),
            "float version is not a string"
        );
        assert!(Manifest::parse("name: ''\nversion: 1.0.0\n").is_err());
        assert!(Manifest::parse("name: x\nversion: '1.0'\n").is_ok());
    }

    #[test]
    fn targets_csv_and_aliases() {
        let m = Manifest::parse("name: x\nversion: 1.0.0\ntarget: 'claude, vscode'\n").unwrap();
        assert_eq!(m.targets, vec!["claude", "copilot"]);
        assert!(Manifest::parse("name: x\nversion: 1.0.0\ntargets: [nope]\n").is_err());
        assert!(
            Manifest::parse("name: x\nversion: 1.0.0\ntarget: claude\ntargets: [claude]\n")
                .is_err()
        );
    }

    #[test]
    fn dependencies_must_be_structured() {
        assert!(Manifest::parse("name: x\nversion: 1.0.0\ndependencies:\n- owner/repo\n").is_err());
        let m = Manifest::parse("name: x\nversion: 1.0.0\ndevDependencies:\n  apm: [owner/dev]\n")
            .unwrap();
        assert_eq!(m.dev_apm[0].repo_url, "owner/dev");
    }

    #[test]
    fn includes_validation() {
        assert_eq!(
            Manifest::parse("name: x\nversion: 1.0.0\nincludes: auto\n")
                .unwrap()
                .includes,
            Some(Includes::Auto)
        );
        assert!(Manifest::parse("name: x\nversion: 1.0.0\nincludes: everything\n").is_err());
    }
}
