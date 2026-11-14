//! End-to-end install/compile tests on synthetic projects.

use std::fs;
use std::path::Path;
use std::process::Command;

use aphrody_apm::compile::compile;
use aphrody_apm::install::InstallOptions;
use aphrody_apm::install::install;
use aphrody_apm::lockfile::LockFile;

fn write(root: &Path, rel: &str, content: &str) {
    let p = root.join(rel);
    fs::create_dir_all(p.parent().unwrap()).unwrap();
    fs::write(p, content).unwrap();
}

fn sample_package(root: &Path, dir: &str) {
    write(
        root,
        &format!("{dir}/apm.yml"),
        "name: lib\nversion: 1.2.0\nlicense: MIT\n",
    );
    write(
        root,
        &format!("{dir}/.apm/instructions/python.instructions.md"),
        "---\napplyTo: \"**/*.py\"\n---\n\n# Python\nUse ruff.\n",
    );
    write(
        root,
        &format!("{dir}/.apm/instructions/general.instructions.md"),
        "# General\nBe kind.\n",
    );
    write(
        root,
        &format!("{dir}/.apm/prompts/review.prompt.md"),
        "---\ndescription: Review\ninput: [file]\n---\n\nReview ${input:file}.\n",
    );
    write(
        root,
        &format!("{dir}/.apm/prompts/nightly.prompt.md"),
        "---\ninterval: daily\n---\n\nRun.\n",
    );
    write(
        root,
        &format!("{dir}/.apm/agents/helper.agent.md"),
        "---\ndescription: Helper\n---\n\nHelp.\n",
    );
    write(
        root,
        &format!("{dir}/.apm/agents/notes/readme.md"),
        "---\ntitle: Notes\n---\n\nNot an agent.\n",
    );
    write(
        root,
        &format!("{dir}/.apm/skills/my-skill/SKILL.md"),
        "---\nname: my-skill\n---\n\nSee [ref](assets/ref.md) and [agent](../../agents/helper.agent.md).\n",
    );
    write(
        root,
        &format!("{dir}/.apm/skills/my-skill/assets/ref.md"),
        "ref\n",
    );
}

#[test]
fn install_claude_and_copilot_layout() {
    let t = tempfile::tempdir().unwrap();
    let root = t.path();
    sample_package(root, "pkgs/lib");
    write(
        root,
        "apm.yml",
        "name: app\nversion: 0.1.0\ntargets: [claude, copilot]\ndependencies:\n  apm:\n    - ./pkgs/lib\n",
    );
    let r = install(root, &InstallOptions::default()).unwrap();
    assert_eq!(r.targets, vec!["claude", "copilot"]);

    // Copilot: verbatim copies under .github, skills under .agents/skills.
    for f in [
        ".github/instructions/python.instructions.md",
        ".github/prompts/review.prompt.md",
        ".github/agents/helper.agent.md",
        ".agents/skills/my-skill/SKILL.md",
        ".agents/skills/my-skill/assets/ref.md",
    ] {
        assert!(root.join(f).is_file(), "{f}");
    }
    // Workflow-shape prompts and non-agent markdown are not deployed.
    assert!(!root.join(".github/prompts/nightly.prompt.md").exists());
    assert!(!root.join(".github/agents/readme.agent.md").exists());

    // Claude: rules with paths:, commands, agents, skills under .claude.
    assert_eq!(
        fs::read_to_string(root.join(".claude/rules/python.md")).unwrap(),
        "---\npaths:\n  - \"**/*.py\"\n---\n\n# Python\nUse ruff.\n"
    );
    assert_eq!(
        fs::read_to_string(root.join(".claude/rules/general.md")).unwrap(),
        "# General\nBe kind.\n"
    );
    assert_eq!(
        fs::read_to_string(root.join(".claude/commands/review.md")).unwrap(),
        "---\nargument-hint: <file>\narguments:\n- file\ndescription: Review\n---\n\nReview $file."
    );
    assert!(root.join(".claude/agents/helper.md").is_file());
    let skill = fs::read_to_string(root.join(".claude/skills/my-skill/SKILL.md")).unwrap();
    assert!(
        skill.contains("[ref](assets/ref.md)"),
        "in-bundle link unchanged"
    );
    assert!(
        skill.contains("[agent](../../../apm_modules/_local/lib/.apm/agents/helper.agent.md)"),
        "{skill}"
    );

    let lock = LockFile::read(&root.join("apm.lock.yaml"))
        .unwrap()
        .unwrap();
    let d = lock.get_dependency("./pkgs/lib").unwrap();
    assert_eq!(d.str("repo_url"), Some("_local/lib"));
    assert_eq!(d.str("version"), Some("1.2.0"));
    assert_eq!(d.str("package_type"), Some("apm_package"));
    assert_eq!(d.str("declared_license"), Some("MIT"));
    let files = d.deployed_files();
    assert!(
        files.contains(&".claude/skills/my-skill".to_owned())
            && files.contains(&".agents/skills/my-skill".to_owned())
    );
    let rows = lock.deployments.unwrap();
    assert!(
        rows.iter()
            .any(|r| r.value == ".agents/skills/my-skill/SKILL.md"
                && r.target == "copilot"
                && r.owners == vec!["./pkgs/lib"])
    );

    // Removing the dependency cleans its deployed files on the next install.
    write(
        root,
        "apm.yml",
        "name: app\nversion: 0.1.0\ntargets: [claude, copilot]\n",
    );
    let r = install(root, &InstallOptions::default()).unwrap();
    assert!(!r.removed.is_empty());
    assert!(!root.join(".claude/rules/python.md").exists());
    assert!(!root.join(".agents/skills/my-skill").exists());
}

#[test]
fn claude_target_requires_dir_unless_explicit() {
    let t = tempfile::tempdir().unwrap();
    let root = t.path();
    sample_package(root, "pkgs/lib");
    write(
        root,
        "apm.yml",
        "name: app\nversion: 0.1.0\ndependencies:\n  apm: [./pkgs/lib]\n",
    );
    let r = install(root, &InstallOptions::default()).unwrap();
    assert_eq!(r.targets, vec!["copilot"], "fallback target");
    assert!(!root.join(".claude").exists());
    let r = install(
        root,
        &InstallOptions {
            targets: vec!["claude".into()],
            ..Default::default()
        },
    )
    .unwrap();
    assert_eq!(r.targets, vec!["claude"]);
    assert!(root.join(".claude/rules/python.md").is_file());
}

#[test]
fn transitive_local_dependencies_are_anchored() {
    let t = tempfile::tempdir().unwrap();
    let root = t.path();
    write(
        root,
        "pkgs/a/apm.yml",
        "name: a\nversion: 1.0.0\ndependencies:\n  apm:\n    - ../b\n",
    );
    write(root, "pkgs/b/apm.yml", "name: b\nversion: 2.0.0\n");
    write(root, "pkgs/b/SKILL.md", "---\nname: b\n---\nB\n");
    write(
        root,
        "apm.yml",
        "name: app\nversion: 0.1.0\ndependencies:\n  apm: [./pkgs/a]\n",
    );
    install(root, &InstallOptions::default()).unwrap();
    let lock = LockFile::read(&root.join("apm.lock.yaml"))
        .unwrap()
        .unwrap();
    let b = lock.get_dependency("local:pkgs/b").unwrap();
    assert_eq!(b.depth(), 2);
    assert_eq!(b.str("resolved_by"), Some("_local/a"));
    assert_eq!(b.str("declaring_parent"), Some("./pkgs/a"));
    assert_eq!(b.str("local_path"), Some("../b"));
    assert_eq!(b.str("package_type"), Some("hybrid"));
    assert!(root.join(".agents/skills/b/SKILL.md").is_file());
    assert!(
        root.join(".agents/skills/b/apm.yml").is_file(),
        "root skill package copies apm.yml like upstream"
    );
}

fn git_ok() -> bool {
    Command::new("git")
        .arg("--version")
        .output()
        .is_ok_and(|o| o.status.success())
}

fn git(dir: &Path, args: &[&str]) {
    let st = Command::new("git")
        .args(args)
        .current_dir(dir)
        .env("GIT_AUTHOR_NAME", "t")
        .env("GIT_AUTHOR_EMAIL", "t@t")
        .env("GIT_COMMITTER_NAME", "t")
        .env("GIT_COMMITTER_EMAIL", "t@t")
        .status()
        .unwrap();
    assert!(st.success(), "git {args:?}");
}

#[test]
fn git_dependency_is_locked_to_commit() {
    if !git_ok() {
        eprintln!("skipping: git not available");
        return;
    }
    let t = tempfile::tempdir().unwrap();
    let repo = t.path().join("remote");
    sample_package(t.path(), "remote");
    git(&repo, &["init", "-q", "-b", "main"]);
    git(&repo, &["add", "-A"]);
    git(&repo, &["commit", "-q", "-m", "v1"]);
    git(&repo, &["tag", "v1"]);
    let url = format!(
        "file:///{}",
        repo.to_string_lossy()
            .replace('\\', "/")
            .trim_start_matches('/')
    );

    let root = t.path().join("app");
    write(
        &root,
        "apm.yml",
        &format!(
            "name: app\nversion: 0.1.0\ndependencies:\n  apm:\n    - git: {url}\n      ref: v1\n"
        ),
    );
    // `file://` URLs are not https/ssh; use object form with an explicit git URL.
    let r = install(&root, &InstallOptions::default());
    let r = match r {
        Ok(r) => r,
        Err(e) => panic!("{e:#}"),
    };
    assert_eq!(r.packages.len(), 1);
    let lock = LockFile::read(&root.join("apm.lock.yaml"))
        .unwrap()
        .unwrap();
    let d = &lock.dependencies[0];
    let commit = d.str("resolved_commit").unwrap().to_owned();
    assert_eq!(commit.len(), 40);
    assert_eq!(d.str("resolved_ref"), Some("v1"));
    assert!(
        root.join(".github/instructions/python.instructions.md")
            .is_file()
    );

    // New upstream commit on the tag's branch: locked install keeps the old commit.
    write(&repo, ".apm/instructions/extra.instructions.md", "extra\n");
    git(&repo, &["add", "-A"]);
    git(&repo, &["commit", "-q", "-m", "v2"]);
    git(&repo, &["tag", "-f", "v1"]);
    install(&root, &InstallOptions::default()).unwrap();
    let again = LockFile::read(&root.join("apm.lock.yaml"))
        .unwrap()
        .unwrap();
    assert_eq!(
        again.dependencies[0].str("resolved_commit"),
        Some(commit.as_str())
    );
    assert!(
        !root
            .join(".github/instructions/extra.instructions.md")
            .exists()
    );
    install(
        &root,
        &InstallOptions {
            update: true,
            ..Default::default()
        },
    )
    .unwrap();
    let updated = LockFile::read(&root.join("apm.lock.yaml"))
        .unwrap()
        .unwrap();
    assert_ne!(
        updated.dependencies[0].str("resolved_commit"),
        Some(commit.as_str())
    );
    assert!(
        root.join(".github/instructions/extra.instructions.md")
            .is_file()
    );
}

#[test]
fn compile_writes_agents_and_claude_md() {
    let t = tempfile::tempdir().unwrap();
    let root = t.path();
    sample_package(root, ".");
    write(
        root,
        "apm.yml",
        "name: app\nversion: 0.1.0\ntargets: [copilot, claude]\n",
    );
    let files = compile(root, &[]).unwrap();
    assert_eq!(files.len(), 2);
    let agents = fs::read_to_string(root.join("AGENTS.md")).unwrap();
    assert!(agents.starts_with(
        "# AGENTS.md\n<!-- Generated by APM CLI from .apm/ primitives -->\n<!-- Build ID: "
    ));
    assert!(agents.contains("## Files matching `**/*.py`"));
    assert!(agents.contains("<!-- Source: .apm/instructions/general.instructions.md -->"));
    let claude = fs::read_to_string(root.join("CLAUDE.md")).unwrap();
    assert!(claude.starts_with("# CLAUDE.md\n<!-- Generated by APM CLI -->\n<!-- Build ID: "));
    assert!(
        claude.contains("## Project Standards\n\n### Global Instructions\n\n# General\nBe kind.\n")
    );
    // Deterministic.
    compile(root, &[]).unwrap();
    assert_eq!(agents, fs::read_to_string(root.join("AGENTS.md")).unwrap());
}
