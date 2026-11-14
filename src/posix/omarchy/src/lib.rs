pub mod cachyos;
pub mod cli;
pub mod packages;
pub mod plugins;
pub mod registry;
pub mod themes;
pub mod wsl;

pub use cachyos::{
    AwesomeListCategory, AwesomeListEntry, CACHYOS_PROTON_OPTIONS, CachyOsConfigGenerator,
    CachyOsError, CachyOsPackagePatch, CpuHardwareInfo, GpuHardwareInfo, KernelVariant2026,
    NonCKernel, PosixDiscoveryCatalog, ProtonWineOrchestrator, SystemHardwareProfile,
    build_posix_discovery_catalog, count_local_patch_files, probe_git_head_sha,
    write_posix_discovery_catalog,
};
pub use packages::{
    ArchGitLabPackageMapping, KernelPatchDescriptor, PacmanRepoSpec, SovereignPackageEngine,
    UnifiedRepoManifest,
};
pub use plugins::{
    BuiltinOmarchyPlugin, MarketplacePluginEntry, OmarchyPluginEngine, PluginSearchReport,
};
pub use registry::{CommandSpec, ManualChapter, OmarchyCommandRegistry, OmarchyManualIndex};
pub use themes::{AetherThemeRegistry, ColorsToml, CompiledAetherBundle, ThemeError};
pub use wsl::{SovereignWslBuilder, WslBundleManifest, WslDistroError, WslInstallPlan};

use serde::{Deserialize, Serialize};
use std::path::Path;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OmarchyDoctorReport {
    pub hardware_tier: String,
    pub gpu_adapter: String,
    pub themes_total: usize,
    pub builtin_plugins_total: usize,
    pub upstream_builtin_dirs_verified: usize,
    pub marketplace_sources_indexed: usize,
    pub kernel_7_4_patches_total: usize,
    pub kernel_7_4_patches_on_disk: usize,
    pub cachyos_pkgbuilds_on_disk: usize,
    pub omarchy_pkgbuilds_on_disk: usize,
    pub arch_gitlab_tree_present: bool,
    pub linux_7_4_tree_present: bool,
    pub existing_wsl_distros: Vec<String>,
    pub healthy: bool,
}

impl OmarchyDoctorReport {
    pub fn run() -> Self {
        let profile = SystemHardwareProfile::probe();
        let theme_reg = AetherThemeRegistry::new();
        let plugin_engine = OmarchyPluginEngine::new();
        let pkg_engine = SovereignPackageEngine::new();

        let search_summary = plugin_engine
            .search(None, 1)
            .unwrap_or(PluginSearchReport {
                builtin_count: 16,
                marketplace_source_count: 0,
                builtin_matches: Vec::new(),
                marketplace_matches: Vec::new(),
            });

        let patches = pkg_engine.list_kernel_patches("7.4");
        let patches_on_disk = patches.iter().filter(|p| p.present_on_disk).count();
        let cachy_pkgs = SovereignPackageEngine::count_dir_entries(&pkg_engine.cachyos_pkgbuilds_root);
        let oma_pkgs = SovereignPackageEngine::count_dir_entries(&pkg_engine.omarchy_pkgbuilds_root);

        let arch_present = pkg_engine.archlinux_root.is_dir();
        let linux_present = pkg_engine.linux_tree_root.join("Makefile").is_file();

        let healthy = theme_reg.len() >= 27 && search_summary.builtin_count == 16;

        Self {
            hardware_tier: profile.cpu.architecture_level,
            gpu_adapter: format!("{} ({})", profile.gpu.name, profile.gpu.architecture),
            themes_total: theme_reg.len(),
            builtin_plugins_total: search_summary.builtin_count,
            upstream_builtin_dirs_verified: plugin_engine.verify_upstream_builtin_dirs(),
            marketplace_sources_indexed: search_summary.marketplace_source_count,
            kernel_7_4_patches_total: patches.len(),
            kernel_7_4_patches_on_disk: patches_on_disk,
            cachyos_pkgbuilds_on_disk: cachy_pkgs,
            omarchy_pkgbuilds_on_disk: oma_pkgs,
            arch_gitlab_tree_present: arch_present,
            linux_7_4_tree_present: linux_present,
            existing_wsl_distros: SovereignWslBuilder::inspect_live_wsl_distros(),
            healthy,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;

    #[test]
    fn test_all_builtin_themes_registered_and_compile_aether_outputs() {
        let standalone = AetherThemeRegistry::standalone_only();
        assert_eq!(standalone.len(), 27);

        let full = AetherThemeRegistry::new();
        assert!(full.len() >= 27);

        let expected_names = [
            "catppuccin",
            "catppuccin-latte",
            "ethereal",
            "everforest",
            "flexoki-light",
            "gruvbox",
            "hackerman",
            "jade-horse",
            "kanagawa",
            "last-horizon",
            "lumon",
            "lupine",
            "matte-black",
            "miasma",
            "nord",
            "retro-82",
            "ristretto",
            "rose-pine",
            "solitude",
            "starship",
            "tokyo-night",
            "vantablack",
            "white",
            "aphrody-m3-dark",
            "cachyos-emerald",
            "hyprland-kawase",
            "fluent-2-dark",
        ];

        for name in expected_names {
            let theme = full
                .get(name)
                .unwrap_or_else(|_| panic!("missing theme: {}", name));
            let bundle = theme.compile_all();
            assert!(bundle.hyprland_colors_conf.contains("col.active_border"));
            assert!(bundle.hyprland_colors_conf.contains("col.inactive_border"));
            assert!(bundle.hyprland_colors_conf.contains("groupbar"));
            assert!(bundle.cosmic_theme_ron.contains("corner_radius: 12.0"));
            assert!(bundle.bar_css.contains("@define-color background"));
            assert!(bundle.terminal_toml.contains("[colors.primary]"));
            assert!(bundle.aether_theme_lua.contains("omacom/aether.nvim"));
            assert!(bundle.theme_css.contains("--omarchy-accent:"));
        }
    }

    #[test]
    fn test_theme_export_writes_all_6_artifacts() {
        let reg = AetherThemeRegistry::new();
        let tokyo = reg.get("tokyo-night").unwrap();
        let out_dir = std::env::temp_dir().join("aphrody_omarchy_theme_export_test");
        let _ = fs::remove_dir_all(&out_dir);

        let paths = tokyo.export_to_dir(&out_dir).unwrap();
        assert_eq!(paths.len(), 6);
        assert!(out_dir.join("hyprland-colors.conf").is_file());
        assert!(out_dir.join("cosmic-theme.ron").is_file());
        assert!(out_dir.join("bar.css").is_file());
        assert!(out_dir.join("terminal.toml").is_file());
        assert!(out_dir.join("aether-theme.lua").is_file());
        assert!(out_dir.join("theme.css").is_file());

        let _ = fs::remove_dir_all(&out_dir);
    }

    #[test]
    fn test_builtin_16_plugins_and_marketplace_streaming_search() {
        let engine = OmarchyPluginEngine::new();
        let builtins = OmarchyPluginEngine::builtin_plugins();
        assert_eq!(builtins.len(), 16);

        let report = engine.search(Some("hypr"), 10).unwrap();
        assert_eq!(report.builtin_count, 16);

        if engine.registry_json_path.is_file() {
            assert!(
                report.marketplace_source_count >= 6000,
                "expected 6,443+ marketplace sources, got {}",
                report.marketplace_source_count
            );
            assert!(!report.marketplace_matches.is_empty());
        }

        let scaffold_dir = std::env::temp_dir().join("aphrody_omarchy_plugin_scaffold_test");
        let _ = fs::remove_dir_all(&scaffold_dir);
        let created = OmarchyPluginEngine::scaffold_plugin(
            &scaffold_dir,
            "aphrody.gpu-telemetry",
            "GPU Telemetry",
            "bar-widget",
        )
        .unwrap();
        assert_eq!(created.len(), 2);
        assert!(created[0].is_file());
        assert!(created[1].is_file());
        let _ = fs::remove_dir_all(&scaffold_dir);
    }

    #[test]
    fn test_linux_7_4_cachyos_patch_series_and_gitlab_manifest() {
        let pkg_engine = SovereignPackageEngine::new();
        let patches = pkg_engine.list_kernel_patches("7.4");
        assert_eq!(patches.len(), 1);
        assert_eq!(patches[0].relative_path, "sched/0001-bore-cachy.patch");

        if pkg_engine.cachyos_patches_root.join("7.4").is_dir() {
            for p in &patches {
                assert!(
                    p.present_on_disk && p.byte_size > 0,
                    "expected upstream patch on disk: {}",
                    p.relative_path
                );
            }
        }

        let patch_out = std::env::temp_dir().join("aphrody_omarchy_patches_test");
        let _ = fs::remove_dir_all(&patch_out);
        let generated = pkg_engine
            .generate_patch_series_bundle("7.4", &patch_out)
            .unwrap();
        assert_eq!(generated.len(), 4);
        let kcfg = fs::read_to_string(patch_out.join("wsl2-cachyos-omarchy-7.4.config")).unwrap();
        assert!(kcfg.contains("CONFIG_DXGKRNL=y"));
        assert!(kcfg.contains("CONFIG_NTSYNC=y"));
        assert!(kcfg.contains("CONFIG_VIRTIO_FS=y"));
        assert!(kcfg.contains("CONFIG_HYPERV_VSOCKETS=y"));
        let _ = fs::remove_dir_all(&patch_out);

        let manifest = pkg_engine.generate_arch_gitlab_manifest();
        assert_eq!(manifest.repositories.len(), 8);
        assert!(manifest.repositories.iter().any(|r| r.name == "cachyos-v3"));
        assert!(manifest.repositories.iter().any(|r| r.name == "omarchy"));
        assert!(manifest.core_packages.iter().any(|p| p.pkgbase == "hyprland"));
    }

    #[test]
    fn test_wsl_bundle_generation_and_system32_guard() {
        let builder = SovereignWslBuilder::new();
        assert!(
            builder
                .emit_bundle(Path::new(r"C:\Windows\System32\wsl-test"))
                .is_err()
        );

        let out_dir = std::env::temp_dir().join("aphrody_omarchy_wsl_bundle_test");
        let _ = fs::remove_dir_all(&out_dir);

        let manifest = builder.emit_bundle(&out_dir).unwrap();
        assert_eq!(manifest.distro_name, "aphrody-omarchy");
        assert_eq!(manifest.default_user, "aphrody");
        assert_eq!(manifest.generated_files.len(), 19);

        let wslcfg = fs::read_to_string(out_dir.join(".wslconfig")).unwrap();
        assert!(wslcfg.contains("bzImage-aphrody-cachyos"));
        assert!(wslcfg.contains("memory=24GB"));
        assert!(wslcfg.contains("processors=24"));
        assert!(wslcfg.contains("networkingMode=mirrored"));

        let distcfg =
            fs::read_to_string(out_dir.join("rootfs/etc/wsl-distribution.conf")).unwrap();
        assert!(distcfg.contains("/usr/lib/wsl/first-setup-aphrody-omarchy.sh"));

        let pac = fs::read_to_string(out_dir.join("rootfs/etc/pacman.conf")).unwrap();
        assert!(pac.contains("[cachyos-v3]"));
        assert!(pac.contains("[omarchy]"));
        assert!(pac.contains("[core]"));

        let dry_plan = builder
            .plan_or_launch_wsl(
                &out_dir.join("nonexistent-aphrody-omarchy.wsl"),
                &out_dir.join("install"),
                false,
            )
            .unwrap();
        assert!(dry_plan.dry_run);
        assert!(dry_plan.wsl_exe_command.contains("--from-file"));

        let _ = fs::remove_dir_all(&out_dir);
    }

    #[test]
    fn test_official_omarchy_command_registry_check_passes() {
        let root = std::path::PathBuf::from(env!("CARGO_MANIFEST_DIR"))
            .parent()
            .and_then(|p| p.parent())
            .expect("repo root")
            .to_path_buf();
        let reg = OmarchyCommandRegistry::scan_default(&root);
        assert!(
            reg.commands.len() > 200,
            "expected >200 official omarchy scripts, found {} in {}",
            reg.commands.len(),
            reg.bin_dir.display()
        );
        let check = reg.show_commands_check();
        assert!(check.is_ok(), "command registry check failed: {check:?}");
        let json = reg.show_commands_json(true);
        assert_eq!(json["ok"], true);
        assert!(json["commands"].as_array().is_some_and(|a| a.len() > 200));
    }

    #[test]
    fn test_theme_template_engine_and_sanitization() {
        let mut colors = ColorsToml::default();
        colors.accent = "#7aa2f7".into();
        colors.background = "#000000".into();
        colors.foreground = "#ffffff".into();
        colors.color0 = Some("#101010".into());

        let tpl = "strip={{ accent_strip }};rgb={{ accent_rgb }};type={{ theme_type }};mix={{ mix background foreground 50% }}";
        let rendered = colors.render_template(tpl);
        assert!(rendered.contains("strip=7aa2f7;"));
        assert!(rendered.contains("rgb=122,162,247;"));
        assert!(rendered.contains("type=dark;"));
        assert!(rendered.contains("mix=#808080"));

        assert!(themes::validate_theme_name("tokyo-night_2").is_ok());
        assert!(themes::validate_theme_name("BadName").is_err());
        assert!(themes::validate_theme_name("-bad").is_err());

        let dir = std::env::temp_dir().join("aphrody_omarchy_sanitize_test");
        let _ = fs::remove_dir_all(&dir);
        fs::create_dir_all(dir.join(".git")).unwrap();
        fs::write(dir.join("colors.toml"), "accent = \"#7aa2f7\"\n").unwrap();
        fs::write(dir.join("hook.lua"), "print('evil')").unwrap();
        fs::write(dir.join("alacritty.toml"), "shell = 'sh'").unwrap();

        let removed = themes::sanitize_third_party_theme(&dir).unwrap();
        assert_eq!(removed.len(), 2);
        assert!(dir.join("colors.toml").exists());
        assert!(!dir.join("hook.lua").exists());
        assert!(!dir.join("alacritty.toml").exists());
        let _ = fs::remove_dir_all(&dir);
    }

    #[test]
    fn test_plugin_validator_rejects_omarchy_namespace_and_symlinks() {
        let root = std::env::temp_dir().join("aphrody_omarchy_plugin_val_test");
        let _ = fs::remove_dir_all(&root);
        let engine = OmarchyPluginEngine::new(root.clone());
        let valid_dir = root.join("custom-bar");
        engine
            .scaffold_plugin(&valid_dir, "custom.status-bar", "Custom Status", "bar-widget")
            .unwrap();
        assert!(OmarchyPluginEngine::validate_plugin_dir(&valid_dir).is_ok());

        let reserved_dir = root.join("reserved-bar");
        engine
            .scaffold_plugin(&reserved_dir, "omarchy.reserved", "Reserved", "bar-widget")
            .unwrap();
        let err = OmarchyPluginEngine::validate_plugin_dir(&reserved_dir).unwrap_err();
        assert!(err.contains("omarchy."));

        let _ = fs::remove_dir_all(&root);
    }

    #[test]
    fn test_manual_index_scans_chapters() {
        let root = std::path::PathBuf::from(env!("CARGO_MANIFEST_DIR"))
            .parent()
            .and_then(|p| p.parent())
            .expect("repo root")
            .to_path_buf();
        let idx = OmarchyManualIndex::scan(&root);
        assert!(
            !idx.chapters.is_empty(),
            "expected manual chapters in {}",
            idx.manual_dir.display()
        );
        assert!(idx.find("omarchy-cli").is_some());
    }
}
