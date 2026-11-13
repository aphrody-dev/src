// SPDX-License-Identifier: Apache-2.0
//! `aphrody-brand` (run as `ay brand`): build | banner <id> [--plain] | check-ico <file>.

use aphrody_ui::brand::{BuildOptions, build, ico_sides};
use std::{path::PathBuf, process::ExitCode};

const USAGE: &str = "usage: ay brand build [--root <dir>] [--deploy]\n       ay brand banner <id> [--plain]\n       ay brand check-ico <file>";

fn repo_root() -> PathBuf {
    if let Some(r) = std::env::var_os("SRC_ROOT").filter(|v| !v.is_empty()) {
        return PathBuf::from(r);
    }
    let mut dir = std::env::current_dir().unwrap_or_default();
    loop {
        if dir.join("assets").join("brand").join("brand.toml").is_file() {
            return dir;
        }
        if !dir.pop() {
            return std::env::current_dir().unwrap_or_default();
        }
    }
}

fn main() -> ExitCode {
    let args: Vec<String> = std::env::args().skip(1).collect();
    match args.first().map(String::as_str) {
        Some("build") => {
            let mut opts = BuildOptions { root: repo_root(), deploy: false };
            let mut it = args[1..].iter();
            while let Some(a) = it.next() {
                match a.as_str() {
                    "--deploy" => opts.deploy = true,
                    "--root" => opts.root = it.next().map(PathBuf::from).unwrap_or_default(),
                    other => {
                        eprintln!("ay brand: unknown argument {other}\n{USAGE}");
                        return ExitCode::from(2);
                    }
                }
            }
            match build(&opts) {
                Ok(r) => {
                    let bytes: u64 = r.files.iter().map(|f| f.1).sum();
                    println!("ay brand: {} files, {} KiB in assets/brand/gen", r.files.len(), bytes / 1024);
                    for d in &r.deployed {
                        println!("deployed {d}");
                    }
                    for w in &r.warnings {
                        eprintln!("warning: {w}");
                    }
                    ExitCode::SUCCESS
                }
                Err(e) => {
                    eprintln!("ay brand: {e}");
                    ExitCode::FAILURE
                }
            }
        }
        Some("banner") => {
            let Some(id) = args.get(1) else {
                eprintln!("{USAGE}");
                return ExitCode::from(2);
            };
            let plain = args.iter().any(|a| a == "--plain") || std::env::var_os("NO_COLOR").is_some();
            let ext = if plain { "txt" } else { "ansi" };
            let path = repo_root().join("assets/brand/gen/banner").join(format!("{id}.{ext}"));
            match std::fs::read_to_string(&path) {
                Ok(s) => {
                    print!("{s}");
                    ExitCode::SUCCESS
                }
                Err(e) => {
                    eprintln!("ay brand: {}: {e}", path.display());
                    ExitCode::FAILURE
                }
            }
        }
        Some("check-ico") => {
            let Some(f) = args.get(1) else {
                eprintln!("{USAGE}");
                return ExitCode::from(2);
            };
            match std::fs::read(f) {
                Ok(b) if !ico_sides(&b).is_empty() => {
                    println!("{f}: {:?}", ico_sides(&b));
                    ExitCode::SUCCESS
                }
                Ok(_) => {
                    eprintln!("{f}: not an icon");
                    ExitCode::FAILURE
                }
                Err(e) => {
                    eprintln!("{f}: {e}");
                    ExitCode::FAILURE
                }
            }
        }
        _ => {
            eprintln!("{USAGE}");
            ExitCode::from(2)
        }
    }
}
