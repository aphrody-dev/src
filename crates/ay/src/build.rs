//! `ay build`: drive cargo for the root workspace with cross-compilation presets.
//!
//! Each preset names a target triple, which crates it builds, and which native tools it needs
//! beyond the Rust standard library (a C cross compiler or linker). Before cargo runs, `ay`
//! checks `rustup target list --installed` and the native tools and says what is missing.

use clap::Args;
use std::ffi::OsString;
use std::path::{Path, PathBuf};
use std::process::Command;

/// Crates that only build for Windows targets (unconditional `windows`/`windows-sys` use).
pub const WINDOWS_ONLY: &[&str] =
    &["stack-bench", "dx12-winui-core", "smithay-wayland-wire", "cosmic-compat", "wslg-cli"];

#[derive(Debug, Clone, Copy, PartialEq)]
pub enum Scope {
    /// `--workspace`, minus the Windows-only crates when the target is not Windows.
    Workspace,
    /// Only these packages (`-p`).
    Packages(&'static [&'static str]),
}

#[derive(Debug, Clone, Copy, PartialEq)]
pub enum Native {
    /// Pure Rust targets whose linker ships with rustup (rust-lld).
    None,
    /// MSVC `link.exe` (Windows host) or `lld-link`.
    Msvc,
    /// A musl cross C compiler, `<arch>-linux-musl-gcc`.
    MuslGcc(&'static str),
    /// The Android NDK clang for this arch.
    AndroidNdk(&'static str),
}

#[derive(Debug, Clone, Copy, PartialEq)]
pub struct Preset {
    pub name: &'static str,
    pub triple: &'static str,
    pub scope: Scope,
    pub native: Native,
}

pub const PRESETS: &[Preset] = &[
    Preset { name: "linux-musl", triple: "x86_64-unknown-linux-musl", scope: Scope::Workspace, native: Native::MuslGcc("x86_64") },
    Preset { name: "linux-musl-arm64", triple: "aarch64-unknown-linux-musl", scope: Scope::Workspace, native: Native::MuslGcc("aarch64") },
    Preset { name: "windows-msvc", triple: "x86_64-pc-windows-msvc", scope: Scope::Workspace, native: Native::Msvc },
    Preset { name: "wasm32", triple: "wasm32-unknown-unknown", scope: Scope::Packages(&["gamescope-web-wasm"]), native: Native::None },
    Preset { name: "android-arm64", triple: "aarch64-linux-android", scope: Scope::Workspace, native: Native::AndroidNdk("aarch64") },
];

/// Look a preset up by name or triple.
pub fn find_preset(key: &str) -> Option<&'static Preset> {
    PRESETS.iter().find(|p| p.name == key || p.triple == key)
}

#[derive(Args, Debug, PartialEq)]
pub struct BuildArgs {
    /// Preset name or target triple; repeat for several targets (see --list)
    #[arg(long = "target", short = 't')]
    pub targets: Vec<String>,
    /// Print presets with Rust target and native toolchain status, then exit
    #[arg(long)]
    pub list: bool,
    /// Build with the release profile (fat LTO)
    #[arg(long, short = 'r')]
    pub release: bool,
    /// Print the cargo commands without running them
    #[arg(long)]
    pub dry_run: bool,
    /// Extra cargo arguments after `--` (e.g. `-- -p ffi`); `-p` replaces the preset's crates
    #[arg(last = true)]
    pub cargo_args: Vec<String>,
}

/// What is installed on this machine, gathered once.
#[derive(Debug, Default)]
pub struct Toolchain {
    /// `None` when rustup is not available.
    pub installed_targets: Option<Vec<String>>,
}

impl Toolchain {
    pub fn probe() -> Self {
        let installed_targets = Command::new("rustup")
            .args(["target", "list", "--installed"])
            .output()
            .ok()
            .filter(|o| o.status.success())
            .map(|o| String::from_utf8_lossy(&o.stdout).lines().map(|l| l.trim().to_string()).collect());
        Self { installed_targets }
    }

    pub fn has_target(&self, triple: &str) -> Option<bool> {
        self.installed_targets.as_ref().map(|t| t.iter().any(|x| x == triple))
    }
}

/// Result of looking for the native tools a preset needs.
#[derive(Debug, PartialEq)]
pub struct NativeStatus {
    pub ok: bool,
    pub detail: String,
    /// Environment for cargo / cc (linker and C compiler paths) when found.
    pub env: Vec<(String, OsString)>,
}

fn which(program: &str) -> Option<PathBuf> {
    let exts: Vec<String> = if cfg!(windows) {
        std::env::var("PATHEXT")
            .unwrap_or_else(|_| ".EXE;.CMD;.BAT".into())
            .split(';')
            .map(|e| e.to_ascii_lowercase())
            .collect()
    } else {
        vec![String::new()]
    };
    std::env::split_paths(&std::env::var_os("PATH")?).find_map(|dir| {
        exts.iter().map(|ext| dir.join(format!("{program}{ext}"))).find(|p| p.is_file())
    })
}

fn env_key(triple: &str) -> String {
    triple.to_ascii_uppercase().replace('-', "_")
}

/// NDK clang for `arch`: `$ANDROID_NDK_HOME` or `$ANDROID_NDK_ROOT`, API `$AY_ANDROID_API` (24).
fn android_clang(arch: &str) -> Option<PathBuf> {
    let ndk = ["ANDROID_NDK_HOME", "ANDROID_NDK_ROOT"]
        .iter()
        .find_map(|k| std::env::var_os(k).filter(|v| !v.is_empty()))?;
    let api = std::env::var("AY_ANDROID_API").unwrap_or_else(|_| "24".into());
    let host = if cfg!(windows) {
        "windows-x86_64"
    } else if cfg!(target_os = "macos") {
        "darwin-x86_64"
    } else {
        "linux-x86_64"
    };
    let suffix = if cfg!(windows) { ".cmd" } else { "" };
    let bin = Path::new(&ndk).join("toolchains").join("llvm").join("prebuilt").join(host).join("bin");
    let clang = bin.join(format!("{arch}-linux-android{api}-clang{suffix}"));
    clang.is_file().then_some(clang)
}

pub fn native_status(preset: &Preset) -> NativeStatus {
    let key = env_key(preset.triple);
    let linker_var = format!("CARGO_TARGET_{key}_LINKER");
    if let Some(linker) = std::env::var_os(&linker_var).filter(|v| !v.is_empty()) {
        return NativeStatus { ok: true, detail: format!("{linker_var}={}", linker.to_string_lossy()), env: Vec::new() };
    }
    match preset.native {
        Native::None => NativeStatus { ok: true, detail: "rust-lld (bundled)".into(), env: Vec::new() },
        Native::Msvc => {
            let msvc = cfg!(windows) && (std::env::var_os("VCINSTALLDIR").is_some() || which("cl").is_some());
            if msvc {
                NativeStatus { ok: true, detail: "MSVC link.exe".into(), env: Vec::new() }
            } else if let Some(lld) = which("lld-link") {
                NativeStatus { ok: true, detail: format!("lld-link ({}); needs Windows SDK libs", lld.display()), env: Vec::new() }
            } else {
                NativeStatus { ok: false, detail: "no MSVC link.exe or lld-link on PATH".into(), env: Vec::new() }
            }
        }
        Native::MuslGcc(arch) => {
            let gcc = format!("{arch}-linux-musl-gcc");
            let native_host = cfg!(target_os = "linux") && std::env::consts::ARCH == arch;
            if let Some(cc) = which(&gcc) {
                let cc_var = format!("CC_{}", preset.triple.replace('-', "_"));
                NativeStatus {
                    ok: true,
                    detail: format!("{gcc} ({})", cc.display()),
                    env: vec![(linker_var, cc.clone().into_os_string()), (cc_var, cc.into_os_string())],
                }
            } else if native_host && which("musl-gcc").is_some() {
                NativeStatus { ok: true, detail: "musl-gcc".into(), env: Vec::new() }
            } else {
                NativeStatus {
                    ok: false,
                    detail: format!("{gcc} not on PATH (C crates such as tree-sitter grammars need it; or set {linker_var})"),
                    env: Vec::new(),
                }
            }
        }
        Native::AndroidNdk(arch) => match android_clang(arch) {
            Some(clang) => {
                let triple_us = preset.triple.replace('-', "_");
                let mut env = vec![
                    (linker_var, clang.clone().into_os_string()),
                    (format!("CC_{triple_us}"), clang.clone().into_os_string()),
                ];
                if let Some(ar) = clang.parent().map(|d| d.join(format!("llvm-ar{}", std::env::consts::EXE_SUFFIX))) {
                    env.push((format!("AR_{triple_us}"), ar.into_os_string()));
                }
                NativeStatus { ok: true, detail: format!("NDK clang ({})", clang.display()), env }
            }
            None => NativeStatus {
                ok: false,
                detail: "Android NDK clang not found (set ANDROID_NDK_HOME; API from AY_ANDROID_API, default 24)".into(),
                env: Vec::new(),
            },
        },
    }
}

fn targets_windows(triple: &str) -> bool {
    triple.contains("-windows-")
}

/// The cargo argument list for one preset (without the program name).
pub fn cargo_args(preset: &Preset, release: bool, extra: &[String]) -> Vec<String> {
    let mut args = vec!["build".to_string(), "--target".into(), preset.triple.into()];
    if release {
        args.push("--release".into());
    }
    let picks_packages = extra.iter().any(|a| a == "-p" || a == "--package" || a.starts_with("--package="));
    if !picks_packages {
        match preset.scope {
            Scope::Packages(pkgs) => {
                for p in pkgs {
                    args.push("-p".into());
                    args.push((*p).into());
                }
            }
            Scope::Workspace => {
                args.push("--workspace".into());
                if !targets_windows(preset.triple) {
                    for p in WINDOWS_ONLY {
                        args.push("--exclude".into());
                        args.push((*p).into());
                    }
                }
            }
        }
    }
    args.extend(extra.iter().cloned());
    args
}

fn status_word(ok: Option<bool>) -> &'static str {
    match ok {
        Some(true) => "yes",
        Some(false) => "MISSING",
        None => "unknown",
    }
}

fn print_list(tc: &Toolchain) {
    println!("{:<18} {:<28} {:<10} NATIVE TOOLCHAIN", "PRESET", "TRIPLE", "RUST STD");
    for p in PRESETS {
        let native = native_status(p);
        let mark = if native.ok { "ok" } else { "MISSING" };
        println!("{:<18} {:<28} {:<10} {mark}: {}", p.name, p.triple, status_word(tc.has_target(p.triple)), native.detail);
    }
    if tc.installed_targets.is_none() {
        println!("\nrustup not found: cannot list installed targets.");
    }
}

pub fn run(args: BuildArgs) -> i32 {
    let tc = Toolchain::probe();
    if args.list {
        print_list(&tc);
        return 0;
    }
    if args.targets.is_empty() {
        let mut cmd = Command::new("cargo");
        cmd.arg("build").arg("--workspace").args(args.release.then_some("--release")).args(&args.cargo_args);
        cmd.current_dir(crate::repo_root());
        if args.dry_run {
            println!("{cmd:?}");
            return 0;
        }
        return crate::status_of(&mut cmd);
    }

    let mut presets = Vec::new();
    for key in &args.targets {
        match find_preset(key) {
            Some(p) => presets.push(p),
            None => {
                let names: Vec<&str> = PRESETS.iter().map(|p| p.name).collect();
                eprintln!("ay build: unknown target `{key}`; presets: {} (or their triples)", names.join(", "));
                return 2;
            }
        }
    }

    // Report every missing piece before running anything.
    let mut missing = Vec::new();
    for p in &presets {
        if tc.has_target(p.triple) == Some(false) {
            missing.push(format!("{} ({}): Rust std not installed; run `rustup target add {}`", p.name, p.triple, p.triple));
        }
    }
    if !missing.is_empty() {
        for m in &missing {
            eprintln!("ay build: {m}");
        }
        return 1;
    }

    let mut failed = Vec::new();
    for p in presets {
        let native = native_status(p);
        if !native.ok {
            eprintln!("ay build: warning: {} ({}): {}", p.name, p.triple, native.detail);
        }
        let mut cmd = Command::new("cargo");
        cmd.args(cargo_args(p, args.release, &args.cargo_args)).current_dir(crate::repo_root());
        cmd.envs(native.env.iter().map(|(k, v)| (k.as_str(), v.as_os_str())));
        if p.triple.starts_with("wasm32") {
            // sccache fails on the long web-sys command line (os error 206 on Windows).
            cmd.env("RUSTC_WRAPPER", "");
        }
        if native.ok {
            println!("ay build: {} ({}) via {}", p.name, p.triple, native.detail);
        }
        if args.dry_run {
            println!("{cmd:?}");
            continue;
        }
        if crate::status_of(&mut cmd) != 0 {
            failed.push(p.name);
        }
    }
    if failed.is_empty() {
        0
    } else {
        eprintln!("ay build: failed: {}", failed.join(", "));
        1
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn presets_resolve_by_name_and_triple() {
        assert_eq!(find_preset("wasm32").unwrap().triple, "wasm32-unknown-unknown");
        assert_eq!(find_preset("aarch64-linux-android").unwrap().name, "android-arm64");
        assert!(find_preset("sparc-sun-solaris").is_none());
        let triples: Vec<&str> = PRESETS.iter().map(|p| p.triple).collect();
        for t in [
            "x86_64-unknown-linux-musl",
            "aarch64-unknown-linux-musl",
            "x86_64-pc-windows-msvc",
            "wasm32-unknown-unknown",
            "aarch64-linux-android",
        ] {
            assert!(triples.contains(&t), "missing preset for {t}");
        }
    }

    #[test]
    fn non_windows_targets_exclude_windows_only_crates() {
        let args = cargo_args(find_preset("linux-musl").unwrap(), true, &[]);
        assert_eq!(&args[..4], ["build", "--target", "x86_64-unknown-linux-musl", "--release"]);
        assert!(args.contains(&"--workspace".to_string()));
        for p in WINDOWS_ONLY {
            assert!(args.windows(2).any(|w| w[0] == "--exclude" && w[1] == *p), "{p} not excluded");
        }
        let win = cargo_args(find_preset("windows-msvc").unwrap(), false, &[]);
        assert!(!win.contains(&"--exclude".to_string()));
    }

    #[test]
    fn explicit_packages_replace_the_preset_scope() {
        let args = cargo_args(find_preset("wasm32").unwrap(), false, &["-p".into(), "ffi".into()]);
        assert_eq!(args, ["build", "--target", "wasm32-unknown-unknown", "-p", "ffi"]);
        let default = cargo_args(find_preset("wasm32").unwrap(), false, &[]);
        assert_eq!(default, ["build", "--target", "wasm32-unknown-unknown", "-p", "gamescope-web-wasm"]);
    }

    #[test]
    fn missing_rust_target_is_reported() {
        let tc = Toolchain { installed_targets: Some(vec!["x86_64-pc-windows-msvc".into()]) };
        assert_eq!(tc.has_target("x86_64-pc-windows-msvc"), Some(true));
        assert_eq!(tc.has_target("wasm32-unknown-unknown"), Some(false));
        assert_eq!(Toolchain::default().has_target("wasm32-unknown-unknown"), None);
    }

    #[test]
    fn wasm_needs_no_native_toolchain() {
        assert!(native_status(find_preset("wasm32").unwrap()).ok);
    }
}
