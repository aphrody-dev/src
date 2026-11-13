//! `ay agents`: the ai-os orchestrator (`packages/ai-os/src/cli.ts orch`), run in place by bun
//! from `packages/ai-os`, as `just orch` does. `ay agents run <workflow.json>`, `ay agents plan
//! "<goal>"`, `ay agents lifecycle --task ...`; see packages/ai-os/docs/ORCHESTRATOR.md.

use std::process::Command;

/// `--help`/`-h`/`help` alone become no argument: ai-os `orch` prints its usage then (its parser
/// rejects `--help`).
pub fn argv(args: &[String]) -> Vec<String> {
    let rest: &[String] = if is_help(args) { &[] } else { args };
    ["src/cli.ts".to_string(), "orch".to_string()].into_iter().chain(rest.iter().cloned()).collect()
}

fn is_help(args: &[String]) -> bool {
    matches!(args, [a] if a == "--help" || a == "-h" || a == "help")
}

pub fn run(args: &[String]) -> i32 {
    let root = crate::repo_root();
    let dir = root.join("packages").join("ai-os");
    if !dir.join("src").join("cli.ts").is_file() {
        eprintln!("ay agents: {} not found (set SRC_ROOT to the monorepo root)", dir.display());
        return 127;
    }
    let code = crate::status_of(Command::new(crate::exec::locate("bun")).arg("run").args(argv(args)).current_dir(&dir).env("SRC_ROOT", &root));
    // The usage printed for --help is a success, whatever exit code `orch` gives a bare call.
    if is_help(args) && code != 127 { 0 } else { code }
}

#[cfg(test)]
mod tests {
    #[test]
    fn orch_argv() {
        assert_eq!(super::argv(&["plan".into(), "goal".into()]), ["src/cli.ts", "orch", "plan", "goal"]);
        assert_eq!(super::argv(&["--help".into()]), ["src/cli.ts", "orch"]);
        assert_eq!(super::argv(&["run".into(), "--help".into()]), ["src/cli.ts", "orch", "run", "--help"]);
    }
}
