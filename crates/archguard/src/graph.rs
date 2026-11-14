use crate::constants::normalize_rel;
use crate::models::{ArchFinding, Severity};
use serde::{Deserialize, Serialize};
use std::collections::{BTreeMap, BTreeSet};
use std::fs;
use std::path::Path;

#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Serialize, Deserialize)]
pub enum MonorepoLayer {
    Layer0Kernel = 0,
    Layer1Systems = 1,
    Layer2Packages = 2,
    Layer3AppsAndTools = 3,
}

impl MonorepoLayer {
    pub fn name(&self) -> &'static str {
        match self {
            MonorepoLayer::Layer0Kernel => "Layer 0: Native Kernel & Primitives",
            MonorepoLayer::Layer1Systems => "Layer 1: Systems & Infra Foundations",
            MonorepoLayer::Layer2Packages => "Layer 2: Sovereign Polyglot Packages",
            MonorepoLayer::Layer3AppsAndTools => "Layer 3: User Applications & Tools",
        }
    }

    pub fn level(&self) -> u8 {
        *self as u8
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GraphNode {
    pub id: String,
    pub label: String,
    pub path: String,
    pub layer: MonorepoLayer,
    pub dependencies: BTreeSet<String>,
    pub dependents: BTreeSet<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GodNodeMetric {
    pub id: String,
    pub in_degree: usize,
    pub out_degree: usize,
    pub score: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MonorepoGraph {
    pub nodes: BTreeMap<String, GraphNode>,
    pub edges: Vec<(String, String)>,
    pub cycles: Vec<Vec<String>>,
    pub god_nodes: Vec<GodNodeMetric>,
}

impl MonorepoGraph {
    pub fn new() -> Self {
        Self {
            nodes: BTreeMap::new(),
            edges: Vec::new(),
            cycles: Vec::new(),
            god_nodes: Vec::new(),
        }
    }

    pub fn add_node(&mut self, id: String, label: String, path: String, layer: MonorepoLayer) {
        self.nodes.entry(id.clone()).or_insert_with(|| GraphNode {
            id,
            label,
            path,
            layer,
            dependencies: BTreeSet::new(),
            dependents: BTreeSet::new(),
        });
    }

    pub fn add_edge(&mut self, from: &str, to: &str) {
        if from == to || !self.nodes.contains_key(from) || !self.nodes.contains_key(to) {
            return;
        }
        if let Some(src) = self.nodes.get_mut(from) {
            src.dependencies.insert(to.to_string());
        }
        if let Some(dst) = self.nodes.get_mut(to) {
            dst.dependents.insert(from.to_string());
        }
        let edge = (from.to_string(), to.to_string());
        if !self.edges.contains(&edge) {
            self.edges.push(edge);
        }
    }

    pub fn compute_metrics_and_cycles(&mut self) {
        // Compute God Nodes (central hubs by in-degree)
        let mut metrics = Vec::new();
        for (id, node) in &self.nodes {
            let in_d = node.dependents.len();
            let out_d = node.dependencies.len();
            let score = (in_d * 2) + out_d;
            metrics.push(GodNodeMetric {
                id: id.clone(),
                in_degree: in_d,
                out_degree: out_d,
                score,
            });
        }
        metrics.sort_by(|a, b| b.score.cmp(&a.score).then_with(|| a.id.cmp(&b.id)));
        self.god_nodes = metrics;

        // DFS cycle detection (white=unvisited, gray=in-stack, black=done)
        let mut visited: BTreeMap<String, u8> = BTreeMap::new();
        let mut path = Vec::new();
        let mut cycles = Vec::new();

        for node_id in self.nodes.keys() {
            if visited.get(node_id).copied().unwrap_or(0) == 0 {
                dfs_detect_cycles(node_id, &self.nodes, &mut visited, &mut path, &mut cycles);
            }
        }
        cycles.sort();
        cycles.dedup();
        self.cycles = cycles;
    }

    pub fn to_mermaid(&self) -> String {
        let mut out = String::new();
        out.push_str("```mermaid\nflowchart TD\n");

        // Group by layers
        let layers = [
            MonorepoLayer::Layer3AppsAndTools,
            MonorepoLayer::Layer2Packages,
            MonorepoLayer::Layer1Systems,
            MonorepoLayer::Layer0Kernel,
        ];

        for layer in layers {
            let layer_nodes: Vec<_> = self.nodes.values().filter(|n| n.layer == layer).collect();
            if layer_nodes.is_empty() {
                continue;
            }
            let sub_id = format!("Layer_{}", layer.level());
            out.push_str(&format!("  subgraph {}[\"{}\"]\n", sub_id, layer.name()));
            for node in layer_nodes {
                let sanitized_id = sanitize_mermaid_id(&node.id);
                out.push_str(&format!("    {}[\"{}\"]\n", sanitized_id, node.label));
            }
            out.push_str("  end\n\n");
        }

        // Edges
        for (src, dst) in &self.edges {
            let s_id = sanitize_mermaid_id(src);
            let d_id = sanitize_mermaid_id(dst);
            out.push_str(&format!("  {} --> {}\n", s_id, d_id));
        }

        out.push_str("```\n");
        out
    }

    pub fn to_dot(&self) -> String {
        let mut out = String::new();
        out.push_str("digraph MonorepoArchitecture {\n");
        out.push_str("  rankdir=\"BT\";\n");
        out.push_str("  node [shape=box, style=\"rounded,filled\", fillcolor=\"#f9f9f9\"];\n\n");

        for (id, node) in &self.nodes {
            out.push_str(&format!(
                "  \"{}\" [label=\"{}\\n({})\"];\n",
                id,
                node.label,
                node.layer.name()
            ));
        }
        out.push('\n');

        for (src, dst) in &self.edges {
            out.push_str(&format!("  \"{}\" -> \"{}\";\n", src, dst));
        }

        out.push_str("}\n");
        out
    }

    pub fn to_json(&self) -> String {
        serde_json::to_string_pretty(self).unwrap_or_else(|_| "{}".into())
    }
}

fn sanitize_mermaid_id(raw: &str) -> String {
    raw.replace(['@', '/', '-', '.', ':'], "_")
}

fn dfs_detect_cycles(
    curr: &str,
    nodes: &BTreeMap<String, GraphNode>,
    visited: &mut BTreeMap<String, u8>,
    path: &mut Vec<String>,
    cycles: &mut Vec<Vec<String>>,
) {
    visited.insert(curr.to_string(), 1); // 1 = gray (visiting)
    path.push(curr.to_string());

    if let Some(node) = nodes.get(curr) {
        for next in &node.dependencies {
            let state = visited.get(next).copied().unwrap_or(0);
            if state == 1 {
                // Cycle found
                if let Some(pos) = path.iter().position(|x| x == next) {
                    let mut cycle: Vec<String> = path[pos..].to_vec();
                    cycle.push(next.to_string());
                    cycles.push(cycle);
                }
            } else if state == 0 {
                dfs_detect_cycles(next, nodes, visited, path, cycles);
            }
        }
    }

    path.pop();
    visited.insert(curr.to_string(), 2); // 2 = black (done)
}

pub fn build_monorepo_graph(root: &Path) -> MonorepoGraph {
    let mut graph = MonorepoGraph::new();

    // 1. Discover nodes across domains
    // Crates
    let crates_dir = root.join("crates");
    if let Ok(entries) = fs::read_dir(&crates_dir) {
        for e in entries.flatten() {
            let p = e.path();
            if p.is_dir() {
                let name = p.file_name().and_then(|n| n.to_str()).unwrap_or("");
                if !name.starts_with('.') {
                    let id = format!("crates/{}", name);
                    let layer = if matches!(name, "unix" | "taffy") {
                        MonorepoLayer::Layer0Kernel
                    } else {
                        MonorepoLayer::Layer1Systems
                    };
                    graph.add_node(id, name.to_string(), normalize_rel(root, &p), layer);
                }
            }
        }
    }

    // Infra
    let infra_dir = root.join("infra");
    if infra_dir.is_dir() {
        graph.add_node(
            "infra".to_string(),
            "infra".to_string(),
            normalize_rel(root, &infra_dir),
            MonorepoLayer::Layer1Systems,
        );
        let mesh_vn = infra_dir.join("mesh-vn");
        if mesh_vn.is_dir() {
            graph.add_node(
                "infra/mesh-vn".to_string(),
                "mesh-vn".to_string(),
                normalize_rel(root, &mesh_vn),
                MonorepoLayer::Layer1Systems,
            );
        }
    }

    // Packages
    let pkgs_dir = root.join("packages");
    let mut pkg_name_to_id: BTreeMap<String, String> = BTreeMap::new();
    if let Ok(entries) = fs::read_dir(&pkgs_dir) {
        for e in entries.flatten() {
            let p = e.path();
            if p.is_dir() {
                let dir_name = p.file_name().and_then(|n| n.to_str()).unwrap_or("");
                if !dir_name.starts_with('.') {
                    let id = format!("packages/{}", dir_name);
                    let mut label = dir_name.to_string();
                    let pkg_json = p.join("package.json");
                    if let Ok(content) = fs::read_to_string(&pkg_json) {
                        if let Ok(val) = serde_json::from_str::<serde_json::Value>(&content) {
                            if let Some(pkg_name) = val.get("name").and_then(|n| n.as_str()) {
                                label = pkg_name.to_string();
                                pkg_name_to_id.insert(pkg_name.to_string(), id.clone());
                            }
                        }
                    }
                    graph.add_node(
                        id,
                        label,
                        normalize_rel(root, &p),
                        MonorepoLayer::Layer2Packages,
                    );
                }
            }
        }
    }

    // Apps
    let apps_dir = root.join("apps");
    if let Ok(entries) = fs::read_dir(&apps_dir) {
        for e in entries.flatten() {
            let p = e.path();
            if p.is_dir() {
                let name = p.file_name().and_then(|n| n.to_str()).unwrap_or("");
                if !name.starts_with('.') {
                    let id = format!("apps/{}", name);
                    graph.add_node(
                        id,
                        name.to_string(),
                        normalize_rel(root, &p),
                        MonorepoLayer::Layer3AppsAndTools,
                    );
                }
            }
        }
    }

    // Tools
    let tools_dir = root.join("tools");
    if let Ok(entries) = fs::read_dir(&tools_dir) {
        for e in entries.flatten() {
            let p = e.path();
            if p.is_dir() {
                let name = p.file_name().and_then(|n| n.to_str()).unwrap_or("");
                if !name.starts_with('.') {
                    let id = format!("tools/{}", name);
                    graph.add_node(
                        id,
                        name.to_string(),
                        normalize_rel(root, &p),
                        MonorepoLayer::Layer3AppsAndTools,
                    );
                }
            }
        }
    }

    // 2. Discover dependency edges
    let mut discovered_edges: Vec<(String, String)> = Vec::new();
    let node_paths: Vec<(String, String)> = graph
        .nodes
        .iter()
        .map(|(id, n)| (id.clone(), n.path.clone()))
        .collect();

    for (id, node_path) in &node_paths {
        if id.starts_with("packages/")
            || id.starts_with("apps/")
            || id.starts_with("tools/")
            || id.starts_with("infra/")
        {
            let pkg_json = root.join(node_path).join("package.json");
            if let Ok(content) = fs::read_to_string(&pkg_json) {
                if let Ok(val) = serde_json::from_str::<serde_json::Value>(&content) {
                    for dep_key in ["dependencies", "devDependencies"] {
                        if let Some(deps_map) = val.get(dep_key).and_then(|d| d.as_object()) {
                            for dep_name in deps_map.keys() {
                                if let Some(target_id) = pkg_name_to_id.get(dep_name) {
                                    discovered_edges.push((id.clone(), target_id.clone()));
                                }
                            }
                        }
                    }
                }
            }
        }

        // From Cargo.toml path dependencies
        let cargo_toml = root.join(node_path).join("Cargo.toml");
        if let Ok(content) = fs::read_to_string(&cargo_toml) {
            for line in content.lines() {
                let trimmed = line.trim();
                if trimmed.contains("path =") {
                    // Extract relative path inside path = "..."
                    if let Some(start) = trimmed.find('"') {
                        if let Some(end) = trimmed[start + 1..].find('"') {
                            let rel_sub = &trimmed[start + 1..start + 1 + end];
                            let candidate_path = root
                                .join(node_path)
                                .join(rel_sub)
                                .canonicalize()
                                .unwrap_or_else(|_| root.join(node_path).join(rel_sub));
                            let norm_target = normalize_rel(root, &candidate_path);
                            // Find matching node
                            for (target_id, target_node) in &graph.nodes {
                                if target_node.path == norm_target {
                                    discovered_edges.push((id.clone(), target_id.clone()));
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    for (src, dst) in discovered_edges {
        graph.add_edge(&src, &dst);
    }

    graph.compute_metrics_and_cycles();
    graph
}

/// Rule ARCH-017: Layer boundary validation & cycle prevention
pub fn check_layer_boundaries_and_cycles(graph: &MonorepoGraph) -> Vec<ArchFinding> {
    let mut findings = Vec::new();

    // 1. Layer Monotonicity: Lower layers must NOT depend on higher layers
    for (src_id, dst_id) in &graph.edges {
        let src_node = graph.nodes.get(src_id);
        let dst_node = graph.nodes.get(dst_id);
        if let (Some(src), Some(dst)) = (src_node, dst_node) {
            if src.layer.level() < dst.layer.level() {
                findings.push(ArchFinding {
                    rule_id: "ARCH-017".into(),
                    category: "graph-acyclic-boundaries".into(),
                    severity: Severity::Error,
                    path: src.path.clone(),
                    line: None,
                    message: format!(
                        "Illegal upward dependency: `{}` ({}) depends on `{}` ({})",
                        src.id,
                        src.layer.name(),
                        dst.id,
                        dst.layer.name()
                    ),
                    remediation: format!(
                        "Extract shared contracts or primitives into a lower layer (e.g. `crates/` or `packages/`) so `{}` does not depend on `{}`.",
                        src.id, dst.id
                    ),
                });
            }
        }
    }

    // 2. Cyclic Dependencies Detection
    for cycle in &graph.cycles {
        let cycle_str = cycle.join(" -> ");
        let entry_path = graph
            .nodes
            .get(&cycle[0])
            .map(|n| n.path.clone())
            .unwrap_or_else(|| cycle[0].clone());

        findings.push(ArchFinding {
            rule_id: "ARCH-017".into(),
            category: "graph-acyclic-boundaries".into(),
            severity: Severity::Error,
            path: entry_path,
            line: None,
            message: format!("Cyclic dependency detected: {cycle_str}"),
            remediation: "Break the cycle by introducing an interface boundary or moving shared types to a common lower-layer package.".into(),
        });
    }

    findings
}
