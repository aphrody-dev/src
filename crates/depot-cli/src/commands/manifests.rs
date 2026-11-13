use std::fs;
use std::path::Path;
use depot_core::{EcosystemManifests, StyleExt};

pub fn run_maintainer_lookup(root: &Path, target_path: &str) -> Result<(), String> {
    let maint_file = root.join("MAINTAINERS");
    let raw = fs::read_to_string(&maint_file)
        .map_err(|e| format!("Failed to read {}: {}", maint_file.display(), e))?;
    let subsystems = EcosystemManifests::parse_kernel_maintainers(&raw);
    let matches = EcosystemManifests::lookup_maintainers_for_path(&subsystems, target_path);

    if matches.is_empty() {
        println!("No maintainer entry matched '{}'.", target_path);
        return Ok(());
    }

    for sub in matches {
        println!("{} [{}]", sub.title.cyan().bold(), sub.status.green());
        for m in &sub.maintainers {
            println!("  M: {}", m);
        }
        for t in &sub.trees {
            println!("  T: {}", t);
        }
    }
    Ok(())
}
