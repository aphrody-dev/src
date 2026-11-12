//! Fleet nodes from `deploy.toml` (`[nodes.<name>]` with `ssh_alias`) and target resolution:
//! `all`, a comma list, node names or ssh aliases.

use std::collections::BTreeMap;
use std::path::Path;

use anyhow::{Context, Result, bail};
use serde::Deserialize;

/// Production first: the order `all` and `check` use.
pub const DEFAULT_ORDER: &[&str] = &["usa", "fr1", "fr2"];

#[derive(Debug, Clone, PartialEq, Eq, Deserialize)]
pub struct Node {
    #[serde(skip)]
    pub name: String,
    pub ssh_alias: String,
    #[serde(default)]
    pub ssh_user: Option<String>,
    #[serde(default)]
    pub public_ip: Option<String>,
    #[serde(default)]
    pub mesh_ip: Option<String>,
    #[serde(default)]
    pub role: Option<String>,
    #[serde(default)]
    pub provider: Option<String>,
}

#[derive(Deserialize)]
struct DeployToml {
    #[serde(default)]
    nodes: BTreeMap<String, Node>,
}

/// Parse the `[nodes.*]` tables; nodes listed in [`DEFAULT_ORDER`] come first, others follow by name.
pub fn parse_nodes(text: &str) -> Result<Vec<Node>> {
    let doc: DeployToml = toml::from_str(text).context("deploy.toml")?;
    let mut nodes: Vec<Node> = doc
        .nodes
        .into_iter()
        .map(|(name, n)| Node { name, ..n })
        .collect();
    nodes.sort_by_key(|n| {
        (
            DEFAULT_ORDER
                .iter()
                .position(|o| *o == n.name)
                .unwrap_or(usize::MAX),
            n.name.clone(),
        )
    });
    Ok(nodes)
}

/// Load nodes from `<root>/deploy.toml`; a missing file means no fleet.
pub fn load_nodes(root: &Path) -> Result<Vec<Node>> {
    let path = root.join("deploy.toml");
    match std::fs::read_to_string(&path) {
        Ok(text) => parse_nodes(&text).with_context(|| path.display().to_string()),
        Err(e) if e.kind() == std::io::ErrorKind::NotFound => Ok(Vec::new()),
        Err(e) => Err(e).with_context(|| path.display().to_string()),
    }
}

/// One connection target: the label printed in prefixes and tables, and the ssh alias to dial.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Target {
    pub label: String,
    pub alias: String,
    pub node: Option<String>,
}

/// Resolve `all`, `a,b`, node names (-> their ssh_alias) or anything else (used as an ssh host).
pub fn resolve_targets(spec: &str, nodes: &[Node]) -> Result<Vec<Target>> {
    let mut out: Vec<Target> = Vec::new();
    for item in spec.split(',').map(str::trim).filter(|s| !s.is_empty()) {
        let batch: Vec<Target> = if item.eq_ignore_ascii_case("all") {
            if nodes.is_empty() {
                bail!("`all` needs [nodes.*] in deploy.toml (none found)");
            }
            nodes.iter().map(node_target).collect()
        } else if let Some(n) = nodes.iter().find(|n| n.name.eq_ignore_ascii_case(item)) {
            vec![node_target(n)]
        } else if let Some(n) = nodes
            .iter()
            .find(|n| n.ssh_alias.eq_ignore_ascii_case(item))
        {
            vec![node_target(n)]
        } else {
            vec![Target {
                label: item.to_string(),
                alias: item.to_string(),
                node: None,
            }]
        };
        for t in batch {
            if !out.iter().any(|o| o.alias.eq_ignore_ascii_case(&t.alias)) {
                out.push(t);
            }
        }
    }
    if out.is_empty() {
        bail!("no host given");
    }
    Ok(out)
}

fn node_target(n: &Node) -> Target {
    Target {
        label: n.name.clone(),
        alias: n.ssh_alias.clone(),
        node: Some(n.name.clone()),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    const DEPLOY: &str = r#"
[project]
name = "x"

[nodes.fr1]
public_ip = "51.77.147.152"
ssh_alias = "vps"
ssh_user = "ubuntu"

[nodes.fr2]
ssh_alias = "cdn"

[nodes.usa]
ssh_alias = "prd"
ssh_user = "root"
role = "production"
"#;

    fn nodes() -> Vec<Node> {
        parse_nodes(DEPLOY).unwrap()
    }

    fn aliases(t: &[Target]) -> Vec<&str> {
        t.iter().map(|t| t.alias.as_str()).collect()
    }

    #[test]
    fn production_first_order() {
        let names: Vec<String> = nodes().into_iter().map(|n| n.name).collect();
        assert_eq!(names, ["usa", "fr1", "fr2"]);
    }

    #[test]
    fn all_names_aliases_and_lists() {
        let n = nodes();
        assert_eq!(
            aliases(&resolve_targets("all", &n).unwrap()),
            ["prd", "vps", "cdn"]
        );
        assert_eq!(aliases(&resolve_targets("fr1", &n).unwrap()), ["vps"]);
        let t = resolve_targets("cdn", &n).unwrap();
        assert_eq!((t[0].label.as_str(), t[0].alias.as_str()), ("fr2", "cdn"));
        assert_eq!(
            aliases(&resolve_targets("fr2,usa,prd", &n).unwrap()),
            ["cdn", "prd"]
        );
        let t = resolve_targets("github.com", &n).unwrap();
        assert_eq!(
            (t[0].label.as_str(), t[0].node.as_deref()),
            ("github.com", None)
        );
        assert!(resolve_targets(" , ", &n).is_err());
        assert!(resolve_targets("all", &[]).is_err());
    }
}
