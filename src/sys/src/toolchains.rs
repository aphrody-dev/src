use serde::Serialize;
use std::process::{Command, Stdio};

#[derive(Debug, Serialize)]
pub struct Tool {
    pub name: &'static str,
    pub version: String,
}

/// Toolchains the monorepo builds with, and how each reports its version.
const TOOLS: &[(&str, &[&str])] = &[
    ("rustc", &["--version"]),
    ("cargo", &["--version"]),
    ("bun", &["--version"]),
    ("node", &["--version"]),
    ("go", &["version"]),
    ("just", &["--version"]),
    ("git", &["--version"]),
    ("clang", &["--version"]),
    ("cl", &[]),
    ("gcc", &["--version"]),
    ("zig", &["version"]),
    ("cmake", &["--version"]),
    ("ninja", &["--version"]),
    ("python3", &["--version"]),
    ("python", &["--version"]),
    ("dotnet", &["--version"]),
    ("java", &["--version"]),
    ("docker", &["--version"]),
    ("podman", &["--version"]),
    ("kubectl", &["version", "--client"]),
    ("wsl", &["--version"]),
    ("nvidia-smi", &["--query-gpu=name,driver_version,memory.total", "--format=csv,noheader"]),
];

pub fn probe() -> Vec<Tool> {
    TOOLS
        .iter()
        .filter_map(|(name, args)| version(name, args).map(|version| Tool { name, version }))
        .collect()
}

fn version(name: &str, args: &[&str]) -> Option<String> {
    let out = Command::new(name).args(args).stdin(Stdio::null()).output().ok()?;
    // `cl` prints its banner (with the version) to stderr and usage to stdout; everything else
    // must exit 0, which rejects stubs such as the Microsoft Store `python3` alias.
    if !out.status.success() && name != "cl" {
        return None;
    }
    let raw = if name == "cl" || out.stdout.is_empty() { out.stderr } else { out.stdout };
    // `wsl --version` prints UTF-16LE.
    let text = decode(&raw);
    let line = text
        .lines()
        .map(str::trim)
        .find(|l| !l.is_empty() && l.chars().any(|c| c.is_ascii_digit()))?;
    Some(line.chars().take(120).collect())
}

fn decode(raw: &[u8]) -> String {
    let utf16 = raw.len() >= 2 && raw.len() % 2 == 0 && raw.iter().skip(1).step_by(2).filter(|b| **b == 0).count() * 2 > raw.len() / 2;
    if utf16 {
        let units: Vec<u16> = raw.as_chunks::<2>().0.iter().map(|c| u16::from_le_bytes(*c)).collect();
        String::from_utf16_lossy(&units).replace('\u{feff}', "")
    } else {
        String::from_utf8_lossy(raw).into_owned()
    }
}

#[cfg(test)]
mod tests {
    use super::decode;

    #[test]
    fn decodes_utf16le_and_utf8() {
        let utf16: Vec<u8> = "WSL 3.0".encode_utf16().flat_map(|u| u.to_le_bytes()).collect();
        assert_eq!(decode(&utf16), "WSL 3.0");
        assert_eq!(decode(b"rustc 1.101.0"), "rustc 1.101.0");
    }
}
