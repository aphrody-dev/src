// SPDX-License-Identifier: Apache-2.0 OR MIT
use std::path::Path;
use depot_core::StyleExt;
use depot_migrate::{
    MigrateEngine, compile_and_analyze_llvm_ir, probe_dotnet_environment,
    probe_llvm_rust_bun_toolchain,
};

pub fn execute_migrate(root: &Path, dry_run: bool, llvm: bool, dotnet: bool) -> Result<(), String> {
    if dotnet {
        let rep = probe_dotnet_environment()?;
        println!("{}", serde_json::to_string_pretty(&rep).unwrap_or_default());
        return Ok(());
    }
    if llvm {
        if root.is_file() {
            let rep = compile_and_analyze_llvm_ir(root, None)?;
            println!("{}", serde_json::to_string_pretty(&rep).unwrap_or_default());
        } else {
            let status = probe_llvm_rust_bun_toolchain(&root.join("third_party/llvm-project"));
            println!("{}", serde_json::to_string_pretty(&status).unwrap_or_default());
        }
        return Ok(());
    }

    println!("{}", format!("--- Depot Migrate Engine: {} ---", root.display()).cyan().bold());
    if dry_run {
        println!("{}", "[DRY RUN] No files will be modified on disk".yellow().bold());
    }

    let rep = MigrateEngine::run(root, dry_run)?;

    println!("  Detected Archetype: {}", rep.archetype.as_str().green().bold());
    println!("  Target Stack: {}", rep.target_stack.cyan());
    println!("  Files scanned: {}", rep.files_scanned);
    println!("  Files modified: {}", rep.files_modified.to_string().green().bold());
    println!("  Total AST rewrites: {}", rep.total_edits.to_string().yellow().bold());
    if !rep.legacy_deps_removed.is_empty() {
        println!("  Purged legacy packages: {}", rep.legacy_deps_removed.join(", ").red());
    }

    Ok(())
}
