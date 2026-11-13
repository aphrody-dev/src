//! `ay agents`: the ai-os orchestrator (`packages/ai-os/src/cli.ts orch`), run in place by bun
//! from `packages/ai-os`, as `just orch` does. `ay agents run <workflow.json>`, `ay agents plan
//! "<goal>"`, `ay agents lifecycle --task ...`; see packages/ai-os/docs/ORCHESTRATOR.md.

use std::process::Command;

pub fn argv(args: &[String]) -> Vec<String> {
    ["src/cli.ts".to_string(), "orch".to_string()].into_iter().chain(args.iter().cloned()).collect()
}

pub fn run(args: &[String]) -> i32 {
    let root = crate::repo_root();
    let dir = root.join("packages").join("ai-os");
    if !dir.join("src").join("cli.ts").is_file() {
        eprintln!("ay agents: {} not found (set SRC_ROOT to the monorepo root)", dir.display());
        return 127;
    }
    crate::status_of(Command::new(crate::exec::locate("bun")).arg("run").args(argv(args)).current_dir(&dir).env("SRC_ROOT", &root))
}

#[cfg(test)]
mod tests {
    #[test]
    fn orch_argv() {
        assert_eq!(super::argv(&["plan".into(), "goal".into()]), ["src/cli.ts", "orch", "plan", "goal"]);
    }
}
