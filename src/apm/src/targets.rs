//! Target profiles (subset of `apm_cli/integration/targets.py::KNOWN_TARGETS`).

use std::path::Path;

/// How a primitive lands in a target.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct Mapping {
    /// Root override (`deploy_root`), e.g. Copilot skills go to `.agents/`.
    pub deploy_root: Option<&'static str>,
    pub subdir: &'static str,
    pub extension: &'static str,
    pub format: &'static str,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct Target {
    pub name: &'static str,
    pub root_dir: &'static str,
    pub auto_create: bool,
    pub detect_by_dir: bool,
    pub instructions: Option<Mapping>,
    pub prompts: Option<Mapping>,
    pub commands: Option<Mapping>,
    pub agents: Option<Mapping>,
    pub skills: Option<Mapping>,
    /// File produced by `apm compile` for this target's compile family.
    pub compile_output: Option<&'static str>,
}

const fn m(
    deploy_root: Option<&'static str>,
    subdir: &'static str,
    extension: &'static str,
    format: &'static str,
) -> Option<Mapping> {
    Some(Mapping {
        deploy_root,
        subdir,
        extension,
        format,
    })
}

pub const CLAUDE: Target = Target {
    name: "claude",
    root_dir: ".claude",
    auto_create: false,
    detect_by_dir: true,
    instructions: m(None, "rules", ".md", "claude_rules"),
    prompts: None,
    commands: m(None, "commands", ".md", "claude_command"),
    agents: m(None, "agents", ".md", "claude_agent"),
    skills: m(None, "skills", "/SKILL.md", "skill_standard"),
    compile_output: Some("CLAUDE.md"),
};

pub const COPILOT: Target = Target {
    name: "copilot",
    root_dir: ".github",
    auto_create: true,
    detect_by_dir: true,
    instructions: m(
        None,
        "instructions",
        ".instructions.md",
        "github_instructions",
    ),
    prompts: m(None, "prompts", ".prompt.md", "github_prompt"),
    commands: None,
    agents: m(None, "agents", ".agent.md", "github_agent"),
    skills: m(Some(".agents"), "skills", "/SKILL.md", "skill_standard"),
    compile_output: Some("AGENTS.md"),
};

pub const AGENT_SKILLS: Target = Target {
    name: "agent-skills",
    root_dir: ".agents",
    auto_create: true,
    detect_by_dir: false,
    instructions: None,
    prompts: None,
    commands: None,
    agents: None,
    skills: m(None, "skills", "/SKILL.md", "skill_standard"),
    compile_output: None,
};

/// Deployable targets in `KNOWN_TARGETS` iteration order.
pub const SUPPORTED: [Target; 3] = [AGENT_SKILLS, CLAUDE, COPILOT];

pub fn by_name(name: &str) -> Option<Target> {
    SUPPORTED.iter().copied().find(|t| t.name == name)
}

/// `active_targets`: explicit list, else directory detection, else `[copilot]`.
/// Returns (deployable targets, names this port cannot deploy).
pub fn active_targets(project_root: &Path, explicit: &[String]) -> (Vec<Target>, Vec<String>) {
    let mut out = Vec::new();
    let mut unsupported = Vec::new();
    if !explicit.is_empty() {
        for name in explicit {
            if name == "all" {
                return (vec![CLAUDE, COPILOT], unsupported);
            }
            match by_name(name) {
                Some(t) if !out.contains(&t) => out.push(t),
                Some(_) => {}
                None => unsupported.push(name.clone()),
            }
        }
        return (out, unsupported);
    }
    let detected: Vec<Target> = SUPPORTED
        .iter()
        .copied()
        .filter(|t| t.detect_by_dir && project_root.join(t.root_dir).is_dir())
        .collect();
    if detected.is_empty() {
        (vec![COPILOT], unsupported)
    } else {
        (detected, unsupported)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn detection_and_fallback() {
        let t = tempfile::tempdir().unwrap();
        assert_eq!(active_targets(t.path(), &[]).0, vec![COPILOT]);
        std::fs::create_dir(t.path().join(".claude")).unwrap();
        assert_eq!(active_targets(t.path(), &[]).0, vec![CLAUDE]);
        std::fs::create_dir(t.path().join(".github")).unwrap();
        assert_eq!(active_targets(t.path(), &[]).0, vec![CLAUDE, COPILOT]);
        let (ts, un) = active_targets(t.path(), &["copilot".into(), "cursor".into()]);
        assert_eq!(ts, vec![COPILOT]);
        assert_eq!(un, vec!["cursor"]);
    }
}
