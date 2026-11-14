//! Kernel flavors (`infra/linux/kernels.toml`) -> environment for `infra/linux/build/kernel.sh`.

use anyhow::{Context, Result, bail};
use regex::Regex;
use serde::Deserialize;
use std::collections::BTreeMap;
use std::fs;
use std::path::Path;

#[derive(Debug, Clone, Deserialize)]
struct RawFlavor {
    image: String,
    env: BTreeMap<String, String>,
}

#[derive(Debug, Clone, Deserialize)]
struct RawKernelsDoc {
    toolchain: BTreeMap<String, String>,
    image: BTreeMap<String, String>,
    flavor: BTreeMap<String, RawFlavor>,
}

#[derive(Debug, Clone)]
pub struct Flavor {
    pub name: String,
    pub image: String,
    pub env: BTreeMap<String, String>,
}

#[derive(Debug, Clone)]
pub struct KernelsConfig {
    pub toolchain: BTreeMap<String, String>,
    pub image: BTreeMap<String, String>,
    pub flavors: Vec<Flavor>,
}

/// Load kernel flavors from `infra/linux/kernels.toml`.
pub fn load_kernels(root: &Path) -> Result<KernelsConfig> {
    let path = root.join("infra").join("linux").join("kernels.toml");
    let raw = fs::read_to_string(&path)
        .with_context(|| format!("failed to read {}", path.display()))?;
    let doc: RawKernelsDoc = toml::from_str(&raw)
        .with_context(|| format!("failed to parse {}", path.display()))?;
    let flavors = doc
        .flavor
        .into_iter()
        .map(|(name, f)| Flavor {
            name,
            image: f.image,
            env: f.env,
        })
        .collect();
    Ok(KernelsConfig {
        toolchain: doc.toolchain,
        image: doc.image,
        flavors,
    })
}

/// Environment for `kernel.sh` on `host` (`fr1` or `ci`). Knob names and values are validated.
pub fn build_env(k: &KernelsConfig, flavor: &str, host: &str) -> Result<BTreeMap<String, String>> {
    let Some(f) = k.flavors.iter().find(|x| x.name == flavor) else {
        let names: Vec<_> = k.flavors.iter().map(|x| x.name.as_str()).collect();
        bail!("flavor '{}' unknown ({})", flavor, names.join(", "));
    };
    let Some(image) = k.image.get(&f.image) else {
        bail!("image '{}' missing from infra/linux/kernels.toml", f.image);
    };
    if !image.contains("@sha256:") {
        bail!("image '{}' is not pinned by digest", f.image);
    }

    let knob_re = Regex::new(r"^_[A-Za-z0-9_]+$").expect("valid knob regex");
    let val_re = Regex::new(r"^[A-Za-z0-9_./:-]*$").expect("valid value regex");
    let mut knobs = Vec::with_capacity(f.env.len());
    for (n, v) in &f.env {
        if !knob_re.is_match(n) || !val_re.is_match(v) {
            bail!("invalid kernel setting {n}={v}");
        }
        knobs.push(format!("{n}={v}"));
    }

    let llvm = k.toolchain.get(host).map(String::as_str).unwrap_or("");
    let llvm_dir = llvm
        .trim_end_matches('/')
        .strip_suffix("/bin")
        .unwrap_or(llvm)
        .to_string();

    let mut out = BTreeMap::new();
    out.insert("FLAVOR".to_string(), f.name.clone());
    out.insert("IMAGE".to_string(), image.clone());
    out.insert("HOST".to_string(), host.to_string());
    out.insert("LLVM_DIR".to_string(), llvm_dir);
    out.insert("KNOBS".to_string(), knobs.join(" "));
    Ok(out)
}

/// Render an environment map as single-quoted POSIX `KEY='VAL'` pairs.
pub fn shell_env(env: &BTreeMap<String, String>) -> String {
    env.iter()
        .map(|(k, v)| format!("{k}='{}'", v.replace('\'', "'\\''")))
        .collect::<Vec<_>>()
        .join(" ")
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn kernel_flavors_prd_and_unknown() {
        let root = Path::new(env!("CARGO_MANIFEST_DIR")).join("../..");
        let kernels = load_kernels(&root).expect("load kernels.toml");
        let env = build_env(&kernels, "prd", "fr1").expect("prd env");
        assert!(env["KNOBS"].contains("_processor_opt=zen4"));
        assert!(env["KNOBS"].contains("_use_llvm_lto=thin"));
        assert!(env["IMAGE"].contains("@sha256:"));
        assert!(env["LLVM_DIR"].ends_with("Release+Asserts"));
        assert_eq!(build_env(&kernels, "prd", "ci").unwrap()["LLVM_DIR"], "");
        assert!(build_env(&kernels, "nope", "ci").is_err());
    }
}
