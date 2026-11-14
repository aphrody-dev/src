//! Unified Command Center CLI for Omarchy (`quattro`) + CachyOS + Arch/Linux/WSL2.
//!
//! Preserves 100% of native CachyOS hardware/kernel/package/WSL2 subcommands (`probe`, `linux`,
//! `pkg`, `patches`, `wsl`, `arch`, `pacman`, `makepkg`, `sched`, `wine-orchestrate`) while
//! exposing the official `omacom/omarchy` (`quattro`) Command Center UX (`omarchy`,
//! `omarchy commands [--all|--json|--markdown|--check]`, `omarchy theme ...`, `omarchy plugin ...`,
//! `omarchy font ...`, `omarchy manual ...`, `omarchy <group> [--help]`, and Linux script
//! delegation).

use crate::cachyos::kernel::{build_env, load_kernels, shell_env};
use crate::cachyos::patchsets::{live_status, load_patchsets, write_pins};
use crate::cachyos::recipe::{
    Format, formats_of, generate, load_distros, load_recipes, matrix,
};
use crate::registry::{OmarchyCommandRegistry, OmarchyManualIndex};
use crate::themes::install_theme_from_dir;
use crate::{
    AetherThemeRegistry, CachyOsConfigGenerator, ColorsToml, OmarchyDoctorReport,
    OmarchyPluginEngine, ProtonWineOrchestrator, SovereignPackageEngine, SovereignWslBuilder,
    SystemHardwareProfile,
};
use anyhow::{Context, Result, bail};
use clap::{Args, Parser, Subcommand};
use std::collections::BTreeMap;
use std::fs;
use std::path::{Path, PathBuf};
use std::process::Command;

pub const LINUX_STACKS: &[&str] = &[
    "linux-cachyos",
    "cachyos-pkgbuilds",
    "kernel-patches",
    "liquorix",
    "scx",
];

pub const OMARHCY_DEFAULT_FONTS: &[(&str, &str)] = &[
    ("JetBrainsMono Nerd Font", "Default monospace & shell font"),
    ("Cascadia Mono", "Curated Nerd Font (Windows/IntelligentTerminal default)"),
    ("Meslo LG Mono", "Curated Nerd Font"),
    ("Fira Code", "Curated Nerd Font with programming ligatures"),
    ("Victor Mono", "Curated Nerd Font with cursive italics"),
    ("Bitstream Vera Sans Mono", "Curated Nerd Font"),
    ("Iosevka Nerd Font", "Curated condensed monospace font"),
];

#[derive(Parser, Debug)]
#[command(
    name = "omarchy",
    version,
    about = "Unified Omarchy + CachyOS + Arch/Linux/WSL2 Command Center",
    disable_help_flag = true
)]
pub struct OmarchyCli {
    #[command(subcommand)]
    pub command: OmarchyCommand,
}

#[derive(Subcommand, Debug)]
pub enum OmarchyCommand {
    /// Probe native CPU, GPU, and memory hardware
    Probe {
        #[arg(long)]
        json: bool,
    },
    /// Generate CachyOS pacman.conf
    Pacman {
        #[arg(short, long)]
        output: Option<PathBuf>,
    },
    /// Generate CachyOS makepkg.conf
    Makepkg {
        #[arg(short, long)]
        output: Option<PathBuf>,
    },
    /// Generate scx_lavd and BORE scheduler profile
    Sched {
        #[arg(short, long)]
        output: Option<PathBuf>,
    },
    /// Configure and inspect Proton-CachyOS / Wine / EAC / BattlEye runtime
    WineOrchestrate {
        #[arg(long)]
        export_sh: bool,
    },
    /// Omarchy + Aether theme engine (list, set, export, install, tpl)
    #[command(alias = "theme")]
    Themes {
        #[command(subcommand)]
        command: ThemesCommand,
    },
    /// Omarchy shell plugins, validator, and marketplace index
    #[command(alias = "plugin")]
    Plugins {
        #[command(subcommand)]
        command: PluginsCommand,
    },
    /// CachyOS + WSL2 Linux 7.4 kernel patch series & kconfig synthesizer
    Patches {
        #[command(subcommand)]
        command: PatchesCommand,
    },
    /// Native WSL2 distribution bundle builder & launcher
    Wsl {
        #[command(subcommand)]
        command: WslCommand,
    },
    /// Arch Linux GitLab devtools/pkgctl + CachyOS v3 + Omarchy repository manifest
    Arch {
        #[command(subcommand)]
        command: ArchCommand,
    },
    /// Full diagnostic check across Omarchy, CachyOS, Arch GitLab, Linux 7.4, and WSL2
    #[command(alias = "debug")]
    Doctor {
        #[arg(long)]
        json: bool,
    },
    /// Unified status report
    Status,
    /// Linux kernel patchsets, flavors, and remote/CI kernel builds (`ay linux`)
    Linux(LinuxArgs),
    /// Multi-distro package recipes (`ay pkg`)
    Pkg(PkgArgs),
}

#[derive(Subcommand, Debug)]
pub enum ThemesCommand {
    /// List all registered Aether/Omarchy themes
    List {
        #[arg(long)]
        json: bool,
    },
    /// Set the active Omarchy theme (writes current theme bundle)
    Set {
        theme_name: String,
        #[arg(long)]
        out: Option<PathBuf>,
    },
    /// Compile and export a theme into 6 desktop/web outputs
    Export {
        theme_name: String,
        #[arg(long)]
        out: Option<PathBuf>,
    },
    /// Install a local theme directory (validates name and sanitizes git theme files)
    Install {
        src_dir: PathBuf,
        #[arg(long)]
        name: Option<String>,
        #[arg(long)]
        dest: Option<PathBuf>,
    },
    /// Render an Omarchy `.tpl` template using a theme's colors
    Tpl {
        theme_name: String,
        template: PathBuf,
    },
}

#[derive(Subcommand, Debug)]
pub enum PluginsCommand {
    /// List built-in Omarchy shell plugins and search the community marketplace
    List {
        #[arg(long)]
        query: Option<String>,
        #[arg(long, default_value_t = 25)]
        limit: usize,
        #[arg(long)]
        json: bool,
    },
    /// Validate an Omarchy shell plugin directory against schemaVersion 1 rules
    Validate { dir: PathBuf },
    /// Scaffold a new Omarchy Quickshell plugin directory and manifest.json
    Scaffold {
        plugin_id: String,
        #[arg(long, default_value = "Aphrody Plugin")]
        name: String,
        #[arg(long, default_value = "bar-widget")]
        kind: String,
        #[arg(long)]
        out: PathBuf,
    },
}

#[derive(Subcommand, Debug)]
pub enum PatchesCommand {
    /// List CachyOS + WSL2 kernel patches for the target Linux kernel series
    List {
        #[arg(long, default_value = "7.4")]
        kernel: String,
        #[arg(long)]
        json: bool,
    },
    /// Generate quilt/git patch series, build script, WSL2 .config fragment, and .wslconfig
    GenerateSeries {
        #[arg(long, default_value = "7.4")]
        kernel: String,
        #[arg(long, default_value = "target/wsl/patches")]
        out: PathBuf,
    },
}

#[derive(Subcommand, Debug)]
pub enum WslCommand {
    /// Generate complete native WSL2 rootfs configuration bundle
    GenerateBundle {
        #[arg(long, default_value = "target/wsl/bundle")]
        out: PathBuf,
        #[arg(long)]
        json: bool,
    },
    /// Inspect or launch native WSL2 distribution installation (dry-run when .wsl image absent)
    Install {
        #[arg(long, default_value = "target/wsl/aphrody-omarchy.wsl")]
        image: PathBuf,
        #[arg(long)]
        install_dir: Option<PathBuf>,
        #[arg(long)]
        execute: bool,
        #[arg(long)]
        json: bool,
    },
}

#[derive(Subcommand, Debug)]
pub enum ArchCommand {
    /// Generate unified Arch GitLab + CachyOS v3 + Omarchy repository manifest
    GitlabSyncManifest {
        #[arg(long)]
        out: Option<PathBuf>,
    },
}

#[derive(Args, Debug)]
pub struct LinuxArgs {
    #[command(subcommand)]
    pub command: LinuxCommand,
}

#[derive(Subcommand, Debug)]
pub enum LinuxCommand {
    /// Live upstream versions vs pins (infra/linux/patchsets.toml)
    Status {
        #[arg(long)]
        json: bool,
        #[arg(long)]
        group: Option<String>,
        #[arg(long)]
        record: bool,
    },
    /// Update pins (--write) and replay upstream stacks (`ay upstream sync`)
    Sync {
        #[arg(long)]
        write: bool,
        #[arg(long)]
        push: bool,
    },
    /// Manage Linux patch stacks via packages/upstream
    Patch {
        #[arg(trailing_var_arg = true, allow_hyphen_values = true)]
        args: Vec<String>,
    },
    /// List kernel flavors from infra/linux/kernels.toml
    Flavors,
    /// Build kernel flavor on fr1 (preemptible) or CI (never on workstation or prd)
    Build {
        flavor: String,
        #[arg(long, default_value = "fr1")]
        host: String,
        #[arg(long)]
        run: bool,
        #[arg(long)]
        env: bool,
    },
}

#[derive(Args, Debug)]
pub struct PkgArgs {
    #[command(subcommand)]
    pub command: PkgCommand,
}

#[derive(Subcommand, Debug)]
pub enum PkgCommand {
    /// List package recipes and supported targets
    List,
    /// Print recipe x distro CI matrix
    Matrix {
        #[arg(long)]
        json: bool,
        #[arg(long)]
        all: bool,
    },
    /// Generate PKGBUILD, debian/, APKBUILD, ebuild, Android.bp, nix, Dockerfile
    Gen {
        #[arg(default_value = "all")]
        recipe: String,
        #[arg(long)]
        target: Option<String>,
        #[arg(long)]
        out: Option<PathBuf>,
    },
    /// Build and install-test a recipe in its distro container (Linux / CI only)
    Build {
        recipe: String,
        #[arg(long)]
        distro: String,
        #[arg(long)]
        out: Option<PathBuf>,
    },
    /// Validate all recipes in an isolated temporary directory
    Check,
}

#[derive(Parser, Debug)]
#[command(name = "ay linux", about = "Linux kernel patchsets, flavors, and off-host builds")]
struct StandaloneLinuxCli {
    #[command(subcommand)]
    command: LinuxCommand,
}

#[derive(Parser, Debug)]
#[command(name = "ay pkg", about = "Unified multi-distro package recipes (infra/pkg)")]
struct StandalonePkgCli {
    #[command(subcommand)]
    command: PkgCommand,
}

pub fn repo_root() -> PathBuf {
    if let Some(root) = std::env::var_os("SRC_ROOT").filter(|v| !v.is_empty()) {
        return PathBuf::from(root);
    }
    let cwd = std::env::current_dir().unwrap_or_else(|_| PathBuf::from("."));
    cwd.ancestors()
        .find(|d| d.join("identity.toml").is_file() || d.join("src.lock.json").is_file())
        .map(PathBuf::from)
        .unwrap_or(cwd)
}

fn default_wsl_install_dir() -> PathBuf {
    std::env::var_os("LOCALAPPDATA")
        .map(PathBuf::from)
        .unwrap_or_else(std::env::temp_dir)
        .join("aphrody-omarchy")
}

fn default_omarchy_config_dir() -> PathBuf {
    if let Some(xdg) = std::env::var_os("XDG_CONFIG_HOME").filter(|v| !v.is_empty()) {
        return PathBuf::from(xdg).join("omarchy");
    }
    let home = std::env::var_os("HOME")
        .or_else(|| std::env::var_os("USERPROFILE"))
        .map(PathBuf::from)
        .unwrap_or_else(std::env::temp_dir);
    home.join(".config").join("omarchy")
}

fn write_out(
    dir: &Path,
    files: &BTreeMap<String, Vec<u8>>,
    modes: &BTreeMap<String, u32>,
) -> Result<()> {
    let _ = fs::remove_dir_all(dir);
    for (rel, content) in files {
        let full = dir.join(rel);
        if let Some(parent) = full.parent() {
            fs::create_dir_all(parent)?;
        }
        fs::write(&full, content)?;
        #[cfg(unix)]
        if let Some(&m) = modes.get(rel) {
            use std::os::unix::fs::PermissionsExt;
            fs::set_permissions(&full, fs::Permissions::from_mode(m))?;
        }
        #[cfg(not(unix))]
        let _ = modes;
    }
    Ok(())
}

fn gen_all(
    root: &Path,
    name: &str,
    targets: Option<&[Format]>,
    out: &Path,
) -> Result<Vec<String>> {
    let all = load_recipes(root)?;
    let selected: Vec<_> = all
        .into_iter()
        .filter(|r| name == "all" || r.name == name)
        .collect();
    if selected.is_empty() {
        bail!("recipe '{name}' not found in infra/pkg/recipes");
    }
    let distros = load_distros(root)?;
    let mut done = Vec::new();
    for r in selected {
        for f in formats_of(&r) {
            if let Some(allowed) = targets
                && !allowed.contains(&f)
            {
                continue;
            }
            let d = distros.iter().find(|x| x.format == f);
            let g = generate(root, &r, f, d)?;
            write_out(&out.join(&r.name).join(f.as_str()), &g.files, &g.modes)?;
            done.push(format!("{}/{}", r.name, f.as_str()));
        }
    }
    Ok(done)
}

fn run_upstream_bun(root: &Path, args: &[String]) -> Result<i32> {
    let bun = std::env::var_os("AY_BUN").unwrap_or_else(|| "bun".into());
    let cli = root.join("packages").join("upstream").join("src").join("cli.ts");
    let status = Command::new(bun)
        .arg(cli)
        .args(args)
        .env("SRC_ROOT", root)
        .status()
        .context("failed to execute bun packages/upstream/src/cli.ts")?;
    Ok(status.code().unwrap_or(1))
}

fn find_theme<'a>(registry: &'a AetherThemeRegistry, query: &str) -> Result<&'a ColorsToml> {
    if let Ok(t) = registry.get(query) {
        return Ok(t);
    }
    let normalized = query.trim().to_ascii_lowercase().replace(' ', "-");
    registry
        .get(&normalized)
        .map_err(|e| anyhow::anyhow!("{e}"))
}

pub fn handle_themes(cmd: ThemesCommand) -> Result<()> {
    let registry = AetherThemeRegistry::new();
    match cmd {
        ThemesCommand::List { json } => {
            let list = registry.list();
            if json {
                println!("{}", serde_json::to_string_pretty(&list)?);
            } else {
                println!("=== Omarchy + Aether Theme Registry (Total: {}) ===", list.len());
                for t in list {
                    println!(
                        "{:<20} [{:<5}] bg={} fg={} accent={} ({})",
                        t.name, t.mode, t.background, t.foreground, t.accent, t.source_kind
                    );
                }
            }
        }
        ThemesCommand::Set { theme_name, out } => {
            let theme = find_theme(&registry, &theme_name)?;
            let target_dir = out.unwrap_or_else(|| default_omarchy_config_dir().join("current").join("theme"));
            let written = theme.export_to_dir(&target_dir)?;
            fs::write(target_dir.join("theme.name"), format!("{}\n", theme.name))?;
            println!(
                "Applied Omarchy theme '{}' into {} ({} files)",
                theme.name,
                target_dir.display(),
                written.len() + 1
            );
        }
        ThemesCommand::Export { theme_name, out } => {
            let theme = find_theme(&registry, &theme_name)?;
            if let Some(out_dir) = out {
                let written = theme.export_to_dir(&out_dir)?;
                println!(
                    "Exported theme '{}' ({} files) into {}",
                    theme.name,
                    written.len(),
                    out_dir.display()
                );
                for p in written {
                    println!("  - {}", p.display());
                }
            } else {
                println!("{}", serde_json::to_string_pretty(&theme.compile_all())?);
            }
        }
        ThemesCommand::Install {
            src_dir,
            name,
            dest,
        } => {
            let dest_root = dest.unwrap_or_else(|| default_omarchy_config_dir().join("themes"));
            let (installed_dir, stripped) =
                install_theme_from_dir(&src_dir, &dest_root, name.as_deref())?;
            println!("Installed theme into {}", installed_dir.display());
            if !stripped.is_empty() {
                println!(
                    "Sanitized {} denied third-party file(s):",
                    stripped.len()
                );
                for p in stripped {
                    println!("  - {}", p.display());
                }
            }
        }
        ThemesCommand::Tpl {
            theme_name,
            template,
        } => {
            let theme = find_theme(&registry, &theme_name)?;
            let raw = fs::read_to_string(&template)
                .with_context(|| format!("failed to read template {}", template.display()))?;
            print!("{}", theme.render_template(&raw));
        }
    }
    Ok(())
}

pub fn handle_plugins(cmd: PluginsCommand) -> Result<()> {
    let engine = OmarchyPluginEngine::new();
    match cmd {
        PluginsCommand::List { query, limit, json } => {
            let report = engine.search(query.as_deref(), limit)?;
            if json {
                println!("{}", serde_json::to_string_pretty(&report)?);
            } else {
                println!(
                    "=== Omarchy Shell Plugins (Built-in: {}, Marketplace Sources: {}) ===",
                    report.builtin_count, report.marketplace_source_count
                );
                for b in &report.builtin_matches {
                    println!(
                        "  {:<22} [{:<13}] {} - {}",
                        b.id, b.kind, b.entry_point, b.description
                    );
                }
                for m in &report.marketplace_matches {
                    println!("  {:<32} [{:<14}] {}", m.id, m.category, m.repo);
                }
            }
        }
        PluginsCommand::Validate { dir } => {
            OmarchyPluginEngine::validate_plugin_dir(&dir)
                .map_err(|e| anyhow::anyhow!("{e}"))?;
            println!("Plugin valid: {}", dir.display());
        }
        PluginsCommand::Scaffold {
            plugin_id,
            name,
            kind,
            out,
        } => {
            let files = OmarchyPluginEngine::scaffold_plugin(&out, &plugin_id, &name, &kind)?;
            println!("Scaffolded plugin '{}' into {}:", plugin_id, out.display());
            for f in files {
                println!("  - {}", f.display());
            }
        }
    }
    Ok(())
}

pub fn handle_patches(cmd: PatchesCommand) -> Result<()> {
    let engine = SovereignPackageEngine::new();
    match cmd {
        PatchesCommand::List { kernel, json } => {
            let patches = engine.list_kernel_patches(&kernel);
            if json {
                println!("{}", serde_json::to_string_pretty(&patches)?);
            } else {
                for p in &patches {
                    println!(
                        "  {:02}. [{:<10}] {:<44} disk={} ({} bytes)",
                        p.order, p.subsystem, p.relative_path, p.present_on_disk, p.byte_size
                    );
                }
            }
        }
        PatchesCommand::GenerateSeries { kernel, out } => {
            let files = engine.generate_patch_series_bundle(&kernel, &out)?;
            for f in files {
                println!("  - {}", f.display());
            }
        }
    }
    Ok(())
}

pub fn handle_wsl(cmd: WslCommand) -> Result<()> {
    let builder = SovereignWslBuilder::new();
    match cmd {
        WslCommand::GenerateBundle { out, json } => {
            let manifest = builder.emit_bundle(&out)?;
            if json {
                println!("{}", serde_json::to_string_pretty(&manifest)?);
            } else {
                println!("Generated WSL2 bundle '{}' into {}", manifest.distro_name, manifest.out_dir);
                for f in &manifest.generated_files {
                    println!("  - {f}");
                }
            }
        }
        WslCommand::Install {
            image,
            install_dir,
            execute,
            json,
        } => {
            let dir = install_dir.unwrap_or_else(default_wsl_install_dir);
            let plan = builder.plan_or_launch_wsl(&image, &dir, execute)?;
            if json {
                println!("{}", serde_json::to_string_pretty(&plan)?);
            } else {
                println!("Distro Name: {}", plan.distro_name);
                println!("Image Path:  {} (exists: {})", plan.image_path, plan.image_exists_on_disk);
                println!("Command:     {}", plan.wsl_exe_command);
            }
        }
    }
    Ok(())
}

pub fn handle_arch(cmd: ArchCommand) -> Result<()> {
    let engine = SovereignPackageEngine::new();
    match cmd {
        ArchCommand::GitlabSyncManifest { out } => {
            let serialized = serde_json::to_string_pretty(&engine.generate_arch_gitlab_manifest())?;
            if let Some(path) = out {
                if let Some(parent) = path.parent() {
                    fs::create_dir_all(parent)?;
                }
                fs::write(&path, &serialized)?;
            } else {
                println!("{serialized}");
            }
        }
    }
    Ok(())
}

pub fn handle_doctor(json: bool) -> Result<()> {
    let report = OmarchyDoctorReport::run();
    if json {
        println!("{}", serde_json::to_string_pretty(&report)?);
    } else {
        println!("Hardware Tier: {}", report.hardware_tier);
        println!("GPU Adapter:   {}", report.gpu_adapter);
        println!("Aether Themes: {}", report.themes_total);
        println!(
            "Plugins:       {} (upstream verified: {}, marketplace: {})",
            report.builtin_plugins_total,
            report.upstream_builtin_dirs_verified,
            report.marketplace_sources_indexed
        );
        println!(
            "Linux 7.4:     {}/{} patches on disk",
            report.kernel_7_4_patches_on_disk, report.kernel_7_4_patches_total
        );
        println!(
            "Status:        {}",
            if report.healthy { "HEALTHY" } else { "DEGRADED" }
        );
    }
    Ok(())
}

pub fn handle_linux(root: &Path, cmd: LinuxCommand) -> Result<i32> {
    match cmd {
        LinuxCommand::Status {
            json,
            group,
            record,
        } => {
            let all = load_patchsets(root)?;
            let filtered: Vec<_> = all
                .into_iter()
                .filter(|p| group.as_deref().is_none_or(|g| p.group == g))
                .collect();
            let live = live_status(&filtered);
            if json {
                println!("{}", serde_json::to_string_pretty(&live)?);
            } else {
                for p in &live {
                    let mark = match p.state {
                        "ok" => "=",
                        "behind" => "->",
                        "excluded" => "x",
                        _ => "!",
                    };
                    let right = p
                        .error
                        .as_deref()
                        .or(if p.state == "excluded" {
                            p.spec.excluded.as_deref()
                        } else {
                            None
                        })
                        .or(p.latest.as_deref())
                        .unwrap_or("?");
                    println!(
                        "{:<11} {:<26} {:<14} {:<2} {}",
                        p.spec.group,
                        p.spec.name,
                        if p.spec.pinned.is_empty() {
                            "-"
                        } else {
                            &p.spec.pinned
                        },
                        mark,
                        right
                    );
                }
            }
            if record {
                let path = root.join("var").join("linux").join("status.json");
                if let Some(parent) = path.parent() {
                    fs::create_dir_all(parent)?;
                }
                let payload = serde_json::json!({
                    "at": "recorded",
                    "live": live,
                });
                fs::write(&path, format!("{}\n", serde_json::to_string_pretty(&payload)?))?;
            }
            Ok(i32::from(live.iter().any(|p| p.state == "error")))
        }
        LinuxCommand::Sync { write, push } => {
            let live = live_status(&load_patchsets(root)?);
            let moved: Vec<(String, String)> = live
                .into_iter()
                .filter(|p| p.state == "behind")
                .filter_map(|p| Some((p.spec.name, p.latest?)))
                .collect();
            for (name, latest) in &moved {
                println!("{name} -> {latest}");
            }
            if write {
                let n = write_pins(root, &moved)?;
                println!("{n} pin(s) updated in infra/linux/patchsets.toml");
            }
            let mut up_args = vec!["sync".to_string(), LINUX_STACKS.join(",")];
            if push {
                up_args.push("--push".to_string());
            }
            run_upstream_bun(root, &up_args)
        }
        LinuxCommand::Patch { args } => {
            let sub = args.first().map(String::as_str).unwrap_or("status");
            let rest = args.get(1..).unwrap_or(&[]);
            let mut up_args = vec![sub.to_string()];
            if sub == "status" {
                if rest.is_empty() {
                    up_args.extend(LINUX_STACKS.iter().map(|s| (*s).to_string()));
                } else {
                    up_args.extend(rest.iter().cloned());
                }
            } else if rest.is_empty() {
                up_args.push(LINUX_STACKS.join(","));
            } else {
                up_args.extend(rest.iter().cloned());
            }
            run_upstream_bun(root, &up_args)
        }
        LinuxCommand::Flavors => {
            let cfg = load_kernels(root)?;
            for f in cfg.flavors {
                let knobs: Vec<_> = f.env.iter().map(|(k, v)| format!("{k}={v}")).collect();
                println!("{:<14} {}", f.name, knobs.join(" "));
            }
            Ok(0)
        }
        LinuxCommand::Build {
            flavor,
            host,
            run,
            env,
        } => {
            if host != "fr1" && host != "ci" {
                bail!("--host fr1 | ci (never workstation or prd)");
            }
            let cfg = load_kernels(root)?;
            let vars = build_env(&cfg, &flavor, &host)?;
            if env {
                for (k, v) in vars {
                    println!("{k}={v}");
                }
                return Ok(0);
            }
            if host == "ci" {
                let args = [
                    "workflow",
                    "run",
                    "linux-kernel.yml",
                    "-R",
                    "aphrody-labs/src",
                    "-f",
                    &format!("flavor={flavor}"),
                ];
                println!("gh {}", args.join(" "));
                if !run {
                    return Ok(0);
                }
                let st = Command::new("gh").args(args).status()?;
                return Ok(st.code().unwrap_or(1));
            }
            let script_path = root.join("infra").join("linux").join("build").join("kernel.sh");
            let script = fs::read(&script_path)?;
            let remote = format!(
                "f=$(mktemp -t aphrody-kernel.XXXXXX) && cat > \"$f\" && {} systemd-run --user --collect --unit=aphrody-kernel-{flavor} --nice=19 -p IOSchedulingClass=idle -E FLAVOR -E IMAGE -E HOST -E LLVM_DIR -E KNOBS sh \"$f\"",
                shell_env(&vars)
            );
            println!("ssh vps \"{remote}\" < infra/linux/build/kernel.sh");
            if !run {
                return Ok(0);
            }
            use std::io::Write;
            let mut child = Command::new("ssh")
                .args(["vps", &remote])
                .stdin(std::process::Stdio::piped())
                .spawn()?;
            if let Some(mut stdin) = child.stdin.take() {
                stdin.write_all(&script)?;
            }
            let st = child.wait()?;
            Ok(st.code().unwrap_or(1))
        }
    }
}

pub fn handle_pkg(root: &Path, cmd: PkgCommand) -> Result<i32> {
    match cmd {
        PkgCommand::List => {
            for r in load_recipes(root)? {
                let fmts: Vec<_> = formats_of(&r).into_iter().map(Format::as_str).collect();
                println!(
                    "{:<22} {}-{}  {}",
                    r.name,
                    r.version,
                    r.release,
                    fmts.join(" ")
                );
            }
            Ok(0)
        }
        PkgCommand::Matrix { json, all } => {
            let recipes = load_recipes(root)?;
            let distros = load_distros(root)?;
            let m = matrix(&recipes, &distros, !all);
            if json {
                println!("{}", serde_json::to_string(&serde_json::json!({ "include": m }))?);
            } else {
                for x in m {
                    println!(
                        "{:<22} {:<9} {}",
                        x.recipe,
                        x.distro,
                        x.format.as_str()
                    );
                }
            }
            Ok(0)
        }
        PkgCommand::Gen {
            recipe,
            target,
            out,
        } => {
            let parsed_targets = if let Some(t) = target {
                let mut v = Vec::new();
                for part in t.split(',') {
                    v.push(Format::parse(part)?);
                }
                Some(v)
            } else {
                None
            };
            let out_dir = out.unwrap_or_else(|| root.join("var").join("pkg"));
            for item in gen_all(root, &recipe, parsed_targets.as_deref(), &out_dir)? {
                println!("{item} -> {}", out_dir.join(&item).display());
            }
            Ok(0)
        }
        PkgCommand::Build {
            recipe,
            distro,
            out,
        } => {
            if cfg!(not(target_os = "linux")) {
                bail!("ay pkg build runs on Linux / CI only, never on workstation");
            }
            let distros = load_distros(root)?;
            let Some(d) = distros.into_iter().find(|x| x.name == distro) else {
                bail!("distro '{distro}' missing from infra/pkg/distros.toml");
            };
            let recipes = load_recipes(root)?;
            let Some(r) = recipes.into_iter().find(|x| x.name == recipe) else {
                bail!("recipe '{recipe}' not found");
            };
            let dir = out.unwrap_or_else(|| root.join("var").join("pkg").join(&recipe).join(&d.name));
            let g = generate(root, &r, d.format, Some(&d))?;
            write_out(&dir, &g.files, &g.modes)?;
            let st = if d.format == Format::Docker || d.image.is_none() {
                Command::new("sh").arg(dir.join("build.sh")).status()?
            } else {
                let img = d.image.as_deref().unwrap_or("");
                let vol = format!("{}:/w", dir.display());
                Command::new("docker")
                    .args(["run", "--rm", "-v", &vol, img, "sh", "/w/build.sh"])
                    .status()?
            };
            Ok(st.code().unwrap_or(1))
        }
        PkgCommand::Check => {
            let out = std::env::temp_dir().join(format!("ay-pkg-check-{}", std::process::id()));
            let res = gen_all(root, "all", None, &out);
            let _ = fs::remove_dir_all(&out);
            let done = res?;
            println!("{} outputs generated: {}", done.len(), done.join(" "));
            Ok(0)
        }
    }
}

pub fn handle_omarchy_command(root: &Path, command: OmarchyCommand) -> Result<i32> {
    match command {
        OmarchyCommand::Probe { json } => {
            let profile = SystemHardwareProfile::probe();
            if json {
                println!("{}", serde_json::to_string_pretty(&profile)?);
            } else {
                println!("CPU:  {} ({})", profile.cpu.brand, profile.cpu.architecture_level);
                println!("GPU:  {} ({})", profile.gpu.name, profile.gpu.architecture);
                println!("RAM:  {} GB {}", profile.ram_gb, profile.ram_technology);
            }
            Ok(0)
        }
        OmarchyCommand::Pacman { output } => {
            let conf = CachyOsConfigGenerator::generate_pacman_conf(&SystemHardwareProfile::probe());
            if let Some(p) = output {
                fs::write(&p, &conf)?;
            } else {
                print!("{conf}");
            }
            Ok(0)
        }
        OmarchyCommand::Makepkg { output } => {
            let conf = CachyOsConfigGenerator::generate_makepkg_conf(&SystemHardwareProfile::probe());
            if let Some(p) = output {
                fs::write(&p, &conf)?;
            } else {
                print!("{conf}");
            }
            Ok(0)
        }
        OmarchyCommand::Sched { output } => {
            let conf = CachyOsConfigGenerator::generate_scheduler_profile();
            if let Some(p) = output {
                fs::write(&p, &conf)?;
            } else {
                print!("{conf}");
            }
            Ok(0)
        }
        OmarchyCommand::WineOrchestrate { export_sh } => {
            let orch = ProtonWineOrchestrator::new();
            if export_sh {
                print!("{}", orch.export_environment_script());
            } else {
                println!("Proton-CachyOS env vars: {}", orch.env_vars.len());
                println!("NTSYNC: {}", orch.ntsync_device_available);
                println!("EAC dispatch: {}", orch.verify_anticheat_compatibility());
            }
            Ok(0)
        }
        OmarchyCommand::Themes { command } => {
            handle_themes(command)?;
            Ok(0)
        }
        OmarchyCommand::Plugins { command } => {
            handle_plugins(command)?;
            Ok(0)
        }
        OmarchyCommand::Patches { command } => {
            handle_patches(command)?;
            Ok(0)
        }
        OmarchyCommand::Wsl { command } => {
            handle_wsl(command)?;
            Ok(0)
        }
        OmarchyCommand::Arch { command } => {
            handle_arch(command)?;
            Ok(0)
        }
        OmarchyCommand::Doctor { json } => {
            handle_doctor(json)?;
            Ok(0)
        }
        OmarchyCommand::Status => {
            let profile = SystemHardwareProfile::probe();
            let orch = ProtonWineOrchestrator::new();
            let doc = OmarchyDoctorReport::run();
            println!("CPU/GPU: {} | {}", profile.cpu.brand, profile.gpu.name);
            println!(
                "Omarchy: {} themes, {} plugins, {} marketplace",
                doc.themes_total, doc.builtin_plugins_total, doc.marketplace_sources_indexed
            );
            println!("Proton:  {} env vars", orch.env_vars.len());
            Ok(0)
        }
        OmarchyCommand::Linux(a) => handle_linux(root, a.command),
        OmarchyCommand::Pkg(a) => handle_pkg(root, a.command),
    }
}

fn has_help_flag(tokens: &[String]) -> bool {
    for t in tokens {
        if t == "--" {
            break;
        }
        if t == "--help" || t == "-h" {
            return true;
        }
    }
    false
}

fn has_json_flag(tokens: &[String]) -> bool {
    for t in tokens {
        if t == "--" {
            break;
        }
        if t == "--json" {
            return true;
        }
    }
    false
}

fn handle_commands_subcommand(root: &Path, rest: &[String]) -> i32 {
    let mut include_all = false;
    let mut json = false;
    let mut markdown = false;
    let mut check = false;

    for arg in rest {
        match arg.as_str() {
            "--all" => include_all = true,
            "--json" => json = true,
            "--markdown" => markdown = true,
            "--check" => check = true,
            "--help" | "-h" => {
                println!(
                    "Usage:\n  omarchy commands [--all] [--json] [--markdown] [--check]\n\n\
                     List commands known to the Omarchy command center."
                );
                return 0;
            }
            other => {
                eprintln!("Unknown option for omarchy commands: {other}");
                return 2;
            }
        }
    }

    let reg = OmarchyCommandRegistry::scan_default(root);
    if check {
        match reg.show_commands_check() {
            Ok(msg) => {
                println!("{msg}");
                0
            }
            Err(errs) => {
                for err in errs {
                    eprintln!("{err}");
                }
                1
            }
        }
    } else if json {
        println!("{}", serde_json::to_string_pretty(&reg.show_commands_json(include_all)).unwrap_or_default());
        0
    } else if markdown {
        print!("{}", reg.show_commands_markdown(include_all));
        0
    } else {
        print!("{}", reg.show_commands(include_all));
        0
    }
}

fn handle_font_subcommand(root: &Path, rest: &[String]) -> i32 {
    if rest.is_empty() || matches!(rest.first().map(String::as_str), Some("--help" | "-h")) {
        let reg = OmarchyCommandRegistry::scan_default(root);
        if let Some(help) = reg.show_group_help("font", false) {
            print!("{help}");
        }
        return 0;
    }
    match rest[0].as_str() {
        "list" => {
            let json = rest[1..].iter().any(|a| a == "--json");
            if json {
                let items: Vec<_> = OMARHCY_DEFAULT_FONTS
                    .iter()
                    .map(|(name, note)| serde_json::json!({ "name": name, "note": note }))
                    .collect();
                println!(
                    "{}",
                    serde_json::to_string_pretty(&serde_json::json!({ "fonts": items }))
                        .unwrap_or_default()
                );
            } else {
                for (name, note) in OMARHCY_DEFAULT_FONTS {
                    println!("  {:<28} {}", name, note);
                }
            }
            0
        }
        "cjk" => {
            let variant = rest.get(1).map(String::as_str).unwrap_or("default");
            if !matches!(variant, "jp" | "kr" | "sc" | "tc" | "hk" | "default") {
                eprintln!("Usage: omarchy font cjk <jp|kr|sc|tc|hk|default>");
                return 2;
            }
            let reg = OmarchyCommandRegistry::scan_default(root);
            if let Some(spec) = reg.commands.get("omarchy-font-cjk") {
                return exec_or_explain_linux_script(&spec.binary_path, &spec.binary, &spec.summary, &[variant.to_string()]);
            }
            println!("font cjk preset: {variant}");
            0
        }
        _ => dispatch_registry_fallback(root, &once_prefixed("font", rest)),
    }
}

fn handle_manual_subcommand(root: &Path, rest: &[String]) -> i32 {
    let idx = OmarchyManualIndex::scan(root);
    let sub = rest.first().map(String::as_str).unwrap_or("list");
    match sub {
        "--help" | "-h" => {
            println!(
                "Usage:\n  omarchy manual list [--json]\n  omarchy manual show <chapter-number-or-slug>"
            );
            0
        }
        "list" => {
            let json = rest.iter().any(|a| a == "--json");
            if json {
                println!("{}", serde_json::to_string_pretty(&idx.chapters).unwrap_or_default());
            } else {
                println!(
                    "=== Omarchy Manual Chapters ({} total in {}) ===",
                    idx.chapters.len(),
                    idx.manual_dir.display()
                );
                for c in &idx.chapters {
                    println!("  {:<3} {:<30} {}", c.number, c.slug, c.title);
                }
            }
            0
        }
        "show" => {
            let Some(query) = rest.get(1) else {
                eprintln!("Usage: omarchy manual show <chapter-number-or-slug>");
                return 2;
            };
            let Some(ch) = idx.find(query) else {
                eprintln!("Manual chapter not found: {query}");
                return 1;
            };
            match fs::read_to_string(&ch.path) {
                Ok(raw) => {
                    print!("{raw}");
                    0
                }
                Err(e) => {
                    eprintln!("omarchy manual: {e}");
                    1
                }
            }
        }
        other => {
            if let Some(ch) = idx.find(other)
                && let Ok(raw) = fs::read_to_string(&ch.path)
            {
                print!("{raw}");
                return 0;
            }
            eprintln!("Unknown manual subcommand or chapter: {other}");
            2
        }
    }
}

fn once_prefixed(head: &str, rest: &[String]) -> Vec<String> {
    std::iter::once(head.to_string())
        .chain(rest.iter().cloned())
        .collect()
}

fn exec_or_explain_linux_script(
    script_path: &Path,
    binary: &str,
    summary: &str,
    args: &[String],
) -> i32 {
    #[cfg(target_os = "linux")]
    {
        match Command::new(script_path).args(args).status() {
            Ok(st) => st.code().unwrap_or(1),
            Err(e) => {
                eprintln!("omarchy: failed to run {binary}: {e}");
                1
            }
        }
    }
    #[cfg(not(target_os = "linux"))]
    {
        let _ = (script_path, args);
        eprintln!("{binary}: requires Linux/WSL2 host runtime ({summary})");
        1
    }
}

fn dispatch_registry_fallback(root: &Path, args: &[String]) -> i32 {
    let reg = OmarchyCommandRegistry::scan_default(root);

    if let Some(m) = reg.resolve_route(args) {
        let rest = &args[m.consumed_words..];
        if has_help_flag(rest) {
            if has_json_flag(rest) {
                if let Some(val) = reg.show_command_json(&m.key) {
                    println!("{}", serde_json::to_string_pretty(&val).unwrap_or_default());
                }
            } else if let Some(help) = reg.show_command_help(&m.key) {
                print!("{help}");
            }
            return 0;
        }
        if rest.is_empty() && reg.command_requires_args(&m.key) {
            if m.consumed_words == 1 && reg.group_exists(&args[0]) {
                if let Some(help) = reg.show_group_help(&args[0], false) {
                    print!("{help}");
                    return 0;
                }
            }
            if let Some(help) = reg.show_command_help(&m.key) {
                print!("{help}");
                return 0;
            }
        }
        if let Some(spec) = reg.commands.get(&m.key) {
            return exec_or_explain_linux_script(&spec.binary_path, &spec.binary, &spec.summary, rest);
        }
    }

    if args.len() == 1 || (args.len() >= 2 && matches!(args[1].as_str(), "--help" | "-h")) {
        let include_all = args.iter().any(|a| a == "--all");
        if let Some(help) = reg.show_group_help(&args[0], include_all) {
            print!("{help}");
            return 0;
        }
    }

    eprintln!("Unknown Omarchy command: omarchy {}", args.join(" "));
    if let Some(sug) = args.first().and_then(|f| reg.suggest(f)) {
        eprintln!("Did you mean: omarchy {sug} ?");
    }
    eprintln!("Run 'omarchy commands --all' to discover available commands.");
    127
}

fn dispatch_parsed<T: Parser>(args: &[String], prog: &str, f: impl FnOnce(T) -> Result<i32>) -> i32 {
    let argv = std::iter::once(prog.to_string()).chain(args.iter().cloned());
    let parsed = match T::try_parse_from(argv) {
        Ok(c) => c,
        Err(e) => {
            let code = if e.use_stderr() { 2 } else { 0 };
            let _ = e.print();
            return code;
        }
    };
    match f(parsed) {
        Ok(code) => code,
        Err(e) => {
            eprintln!("{prog}: {e}");
            1
        }
    }
}

/// Entrypoint for standalone `omarchy` and `ay omarchy`.
pub fn run_omarchy_args(args: &[String]) -> i32 {
    let root = repo_root();
    if args.is_empty() || matches!(args[0].as_str(), "--help" | "-h") {
        let reg = OmarchyCommandRegistry::scan_default(&root);
        print!("{}", reg.show_main_help());
        return 0;
    }

    let first = args[0].as_str();
    let rest = &args[1..];

    match first {
        "help" => {
            if rest.is_empty() {
                let reg = OmarchyCommandRegistry::scan_default(&root);
                print!("{}", reg.show_main_help());
                0
            } else {
                let mut forwarded = rest.to_vec();
                forwarded.push("--help".to_string());
                dispatch_registry_fallback(&root, &forwarded)
            }
        }
        "commands" => handle_commands_subcommand(&root, rest),
        "manual" => handle_manual_subcommand(&root, rest),
        "font" => handle_font_subcommand(&root, rest),
        "hw" => {
            if matches!(rest.first().map(String::as_str), Some("--help" | "-h")) {
                return dispatch_registry_fallback(&root, args);
            }
            if rest.is_empty() || rest[0] == "probe" || rest[0] == "--json" {
                let json = rest.iter().any(|a| a == "--json");
                return match handle_omarchy_command(&root, OmarchyCommand::Probe { json }) {
                    Ok(code) => code,
                    Err(e) => {
                        eprintln!("omarchy hw: {e}");
                        1
                    }
                };
            }
            dispatch_registry_fallback(&root, args)
        }
        "games" => {
            if rest.is_empty() || matches!(rest.first().map(String::as_str), Some("--help" | "-h")) {
                return dispatch_registry_fallback(&root, &once_prefixed("games", &["--help".into()]));
            }
            if rest[0] == "proton" || rest[0] == "wine-orchestrate" {
                let export_sh = rest.iter().any(|a| a == "--export-sh");
                return match handle_omarchy_command(
                    &root,
                    OmarchyCommand::WineOrchestrate { export_sh },
                ) {
                    Ok(code) => code,
                    Err(e) => {
                        eprintln!("omarchy games: {e}");
                        1
                    }
                };
            }
            dispatch_registry_fallback(&root, args)
        }
        "kernel" => {
            if rest.is_empty() || matches!(rest.first().map(String::as_str), Some("--help" | "-h")) {
                return dispatch_registry_fallback(&root, &once_prefixed("kernel", &["--help".into()]));
            }
            match rest[0].as_str() {
                "status" | "sync" | "patch" | "flavors" | "build" => run_linux_args(rest),
                "sched" => dispatch_parsed::<OmarchyCli>(rest, "omarchy kernel", |c| {
                    handle_omarchy_command(&root, c.command)
                }),
                "patches" => dispatch_parsed::<OmarchyCli>(rest, "omarchy kernel", |c| {
                    handle_omarchy_command(&root, c.command)
                }),
                _ => dispatch_registry_fallback(&root, args),
            }
        }
        "pkg" if rest.first().is_some_and(|s| matches!(s.as_str(), "pacman" | "makepkg")) => {
            dispatch_parsed::<OmarchyCli>(rest, "omarchy pkg", |c| {
                handle_omarchy_command(&root, c.command)
            })
        }
        "logout" | "reboot" | "shutdown" => {
            dispatch_registry_fallback(&root, &once_prefixed("system", args))
        }
        "theme" | "themes" | "plugin" | "plugins" if rest.is_empty() => {
            let group = first.trim_end_matches('s');
            dispatch_registry_fallback(&root, &[group.to_string(), "--help".to_string()])
        }
        "probe" | "pacman" | "makepkg" | "sched" | "wine-orchestrate" | "theme" | "themes"
        | "plugin" | "plugins" | "patches" | "wsl" | "arch" | "doctor" | "debug" | "status"
        | "linux" | "pkg" => {
            if (first == "debug" || first == "doctor" || first == "status") && has_help_flag(rest) {
                return dispatch_registry_fallback(&root, args);
            }
            if first == "theme" && rest.first().is_some_and(|s| s == "name") {
                return dispatch_registry_fallback(&root, args);
            }
            dispatch_parsed::<OmarchyCli>(args, "omarchy", |c| {
                handle_omarchy_command(&root, c.command)
            })
        }
        _ => dispatch_registry_fallback(&root, args),
    }
}

/// Entrypoint for `ay linux ...`.
pub fn run_linux_args(args: &[String]) -> i32 {
    let root = repo_root();
    dispatch_parsed::<StandaloneLinuxCli>(args, "ay linux", |c| handle_linux(&root, c.command))
}

/// Entrypoint for `ay pkg ...`.
pub fn run_pkg_args(args: &[String]) -> i32 {
    let root = repo_root();
    dispatch_parsed::<StandalonePkgCli>(args, "ay pkg", |c| handle_pkg(&root, c.command))
}
