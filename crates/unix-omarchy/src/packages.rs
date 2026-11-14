use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Path, PathBuf};
use thiserror::Error;

const KERNEL_FRAGMENT: &str = include_str!("../../../infra/wsl-distro/kernel/wsl2-cachyos-omarchy-7.4.config");
const KERNEL_BUILD_SCRIPT: &str = include_str!("../../../infra/wsl-distro/kernel/build-kernel.sh");
const WSLCONFIG_TEMPLATE: &str = include_str!("../../../packages/machine/wsl/wslconfig");

#[derive(Error, Debug)]
pub enum PackageEngineError {
    #[error("Package engine I/O error: {0}")]
    Io(#[from] std::io::Error),
    #[error("JSON serialization error: {0}")]
    Json(#[from] serde_json::Error),
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
pub struct PacmanRepoSpec {
    pub name: &'static str,
    pub tier: &'static str,
    pub upstream_url: &'static str,
    pub mirror_include: &'static str,
    pub sig_level: &'static str,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct KernelPatchDescriptor {
    pub order: usize,
    pub kernel_series: String,
    pub relative_path: String,
    pub subsystem: String,
    pub summary: String,
    pub present_on_disk: bool,
    pub byte_size: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ArchGitLabPackageMapping {
    pub pkgbase: String,
    pub arch_gitlab_url: String,
    pub cachyos_pkgbuild_override: Option<String>,
    pub omarchy_pkgbuild_override: Option<String>,
    pub chroot_build_cmd: String,
    pub target_repo: String,
}

#[derive(Debug, Clone, Serialize)]
pub struct UnifiedRepoManifest {
    pub distro_id: String,
    pub kernel_target: String,
    pub arch_tier: String,
    pub repositories: Vec<PacmanRepoSpec>,
    pub cachyos_pkgbuilds_count: usize,
    pub omarchy_pkgbuilds_count: usize,
    pub core_packages: Vec<ArchGitLabPackageMapping>,
    pub devtools_chroot_workflow: Vec<String>,
}

pub struct SovereignPackageEngine {
    pub cachyos_patches_root: PathBuf,
    pub cachyos_pkgbuilds_root: PathBuf,
    pub omarchy_pkgbuilds_root: PathBuf,
    pub archlinux_root: PathBuf,
    pub linux_tree_root: PathBuf,
}

impl Default for SovereignPackageEngine {
    fn default() -> Self {
        Self::new()
    }
}

impl SovereignPackageEngine {
    pub fn new() -> Self {
        // Repo-relative (works on Windows and Linux checkouts alike).
        let third_party = Path::new(env!("CARGO_MANIFEST_DIR")).join("../../third_party");
        Self {
            cachyos_patches_root: third_party.join("kernel-patches"),
            cachyos_pkgbuilds_root: third_party.join("CachyOS-PKGBUILDS"),
            omarchy_pkgbuilds_root: third_party.join("omarchy-pkgs").join("pkgbuilds"),
            archlinux_root: third_party.join("archlinux"),
            linux_tree_root: third_party.join("linux"),
        }
    }

    pub fn repositories() -> Vec<PacmanRepoSpec> {
        vec![
            PacmanRepoSpec {
                name: "cachyos-v3",
                tier: "x86-64-v3 (AVX2/FMA3/BMI2)",
                upstream_url: "https://github.com/CachyOS/CachyOS-PKGBUILDS",
                mirror_include: "Include = /etc/pacman.d/cachyos-v3-mirrorlist",
                sig_level: "Required DatabaseOptional",
            },
            PacmanRepoSpec {
                name: "cachyos-core-v3",
                tier: "x86-64-v3 (AVX2/FMA3/BMI2)",
                upstream_url: "https://github.com/CachyOS/CachyOS-PKGBUILDS",
                mirror_include: "Include = /etc/pacman.d/cachyos-v3-mirrorlist",
                sig_level: "Required DatabaseOptional",
            },
            PacmanRepoSpec {
                name: "cachyos-extra-v3",
                tier: "x86-64-v3 (AVX2/FMA3/BMI2)",
                upstream_url: "https://github.com/CachyOS/CachyOS-PKGBUILDS",
                mirror_include: "Include = /etc/pacman.d/cachyos-v3-mirrorlist",
                sig_level: "Required DatabaseOptional",
            },
            PacmanRepoSpec {
                name: "cachyos",
                tier: "x86-64-generic",
                upstream_url: "https://github.com/CachyOS/CachyOS-PKGBUILDS",
                mirror_include: "Include = /etc/pacman.d/cachyos-mirrorlist",
                sig_level: "Required DatabaseOptional",
            },
            PacmanRepoSpec {
                name: "omarchy",
                tier: "x86-64-omarchy-quattro",
                upstream_url: "https://github.com/omacom/omarchy-pkgs",
                mirror_include: "Server = https://pkgs.omarchy.org/stable/$arch",
                sig_level: "Optional TrustAll",
            },
            PacmanRepoSpec {
                name: "core",
                tier: "archlinux-gitlab",
                upstream_url: "https://gitlab.archlinux.org/archlinux/packaging/packages",
                mirror_include: "Include = /etc/pacman.d/mirrorlist",
                sig_level: "Required DatabaseOptional",
            },
            PacmanRepoSpec {
                name: "extra",
                tier: "archlinux-gitlab",
                upstream_url: "https://gitlab.archlinux.org/archlinux/packaging/packages",
                mirror_include: "Include = /etc/pacman.d/mirrorlist",
                sig_level: "Required DatabaseOptional",
            },
            PacmanRepoSpec {
                name: "multilib",
                tier: "archlinux-gitlab",
                upstream_url: "https://gitlab.archlinux.org/archlinux/packaging/packages",
                mirror_include: "Include = /etc/pacman.d/mirrorlist",
                sig_level: "Required DatabaseOptional",
            },
        ]
    }

    /// CachyOS patches applied on top of the CachyOS/linux release tree by
    /// infra/wsl-distro/kernel/build-kernel.sh (the tree already carries the base CachyOS patches; BORE and
    /// Project C are alternatives, NVIDIA patches target the out-of-tree module, not the kernel).
    pub fn list_kernel_patches(&self, kernel_series: &str) -> Vec<KernelPatchDescriptor> {
        let series_dir = self.cachyos_patches_root.join(kernel_series);
        let canonical_patches = [(
            "sched/0001-bore-cachy.patch",
            "sched",
            "Burst-Oriented Response Enhancer (BORE) interactive CPU scheduler",
        )];

        canonical_patches
            .iter()
            .enumerate()
            .map(|(idx, (rel, subsys, summary))| {
                let full_path = rel.split('/').fold(series_dir.clone(), |p, c| p.join(c));
                let meta = fs::metadata(&full_path).ok();
                KernelPatchDescriptor {
                    order: idx + 1,
                    kernel_series: kernel_series.to_string(),
                    relative_path: (*rel).to_string(),
                    subsystem: (*subsys).to_string(),
                    summary: (*summary).to_string(),
                    present_on_disk: meta.is_some(),
                    byte_size: meta.map(|m| m.len()).unwrap_or(0),
                }
            })
            .collect()
    }

    /// Kernel config fragment merged over Microsoft's config-wsl (single source: infra/wsl-distro/kernel).
    pub fn generate_wsl2_kernel_config_fragment(&self) -> String {
        KERNEL_FRAGMENT.to_string()
    }

    pub fn generate_patch_series_bundle(
        &self,
        kernel_series: &str,
        out_dir: &Path,
    ) -> Result<Vec<PathBuf>, PackageEngineError> {
        fs::create_dir_all(out_dir)?;
        let patches = self.list_kernel_patches(kernel_series);

        let mut series_txt = format!("# Linux {kernel_series} CachyOS patches for the aphrody WSL 2 kernel\n");
        for p in &patches {
            series_txt.push_str(&format!("{}\n", p.relative_path));
        }
        let series_path = out_dir.join("series");
        fs::write(&series_path, &series_txt)?;

        let build_path = out_dir.join("build-kernel.sh");
        fs::write(&build_path, KERNEL_BUILD_SCRIPT)?;

        let kconfig_path = out_dir.join("wsl2-cachyos-omarchy-7.4.config");
        fs::write(&kconfig_path, self.generate_wsl2_kernel_config_fragment())?;

        let wslconfig_path = out_dir.join(".wslconfig");
        fs::write(&wslconfig_path, WSLCONFIG_TEMPLATE)?;

        Ok(vec![series_path, build_path, kconfig_path, wslconfig_path])
    }

    pub fn count_dir_entries(dir: &Path) -> usize {
        if !dir.is_dir() {
            return 0;
        }
        fs::read_dir(dir)
            .map(|rd| {
                rd.flatten()
                    .filter(|e| {
                        e.path().is_dir()
                            && !e
                                .file_name()
                                .to_string_lossy()
                                .starts_with('.')
                    })
                    .count()
            })
            .unwrap_or(0)
    }

    pub fn generate_arch_gitlab_manifest(&self) -> UnifiedRepoManifest {
        let cachyos_count = Self::count_dir_entries(&self.cachyos_pkgbuilds_root);
        let omarchy_count = Self::count_dir_entries(&self.omarchy_pkgbuilds_root);

        let core_specs = [
            (
                "linux",
                Some("linux-cachyos"),
                None,
                "cachyos-core-v3",
            ),
            (
                "pacman",
                Some("pacman"),
                None,
                "cachyos-core-v3",
            ),
            (
                "devtools",
                Some("devtools"),
                None,
                "cachyos-extra-v3",
            ),
            (
                "mkinitcpio",
                None,
                None,
                "core",
            ),
            (
                "archinstall",
                None,
                None,
                "extra",
            ),
            (
                "hyprland",
                Some("cachyos-hyprland-settings"),
                Some("hyprland"),
                "omarchy",
            ),
            (
                "cosmic-session",
                None,
                None,
                "extra",
            ),
            (
                "mesa",
                Some("mesa"),
                None,
                "cachyos-v3",
            ),
            (
                "quickshell",
                Some("quickshell-git"),
                Some("omarchy-shell"),
                "omarchy",
            ),
            (
                "aether",
                None,
                Some("aether"),
                "omarchy",
            ),
            (
                "ghostty",
                None,
                Some("ghostty"),
                "omarchy",
            ),
            (
                "scx-scheds",
                Some("scx"),
                None,
                "cachyos-v3",
            ),
            (
                "ananicy-cpp",
                Some("cachyos-ananicy-rules"),
                None,
                "cachyos-v3",
            ),
            (
                "wine",
                Some("wine-cachyos"),
                None,
                "cachyos-v3",
            ),
        ];

        let core_packages = core_specs
            .into_iter()
            .map(|(pkg, cachy, oma, repo)| ArchGitLabPackageMapping {
                pkgbase: pkg.to_string(),
                arch_gitlab_url: format!(
                    "https://gitlab.archlinux.org/archlinux/packaging/packages/{}",
                    pkg
                ),
                cachyos_pkgbuild_override: cachy.map(|s| format!("CachyOS-PKGBUILDS/{}", s)),
                omarchy_pkgbuild_override: oma.map(|s| format!("omarchy-pkgs/pkgbuilds/{}", s)),
                chroot_build_cmd: format!("pkgctl build --repo {} --arch x86_64_v3 {}", repo, pkg),
                target_repo: repo.to_string(),
            })
            .collect();

        let devtools_chroot_workflow = vec![
            "pkgctl repo clone --protocol=https linux hyprland cosmic-session pacman devtools"
                .to_string(),
            "cachy-chroot /var/lib/archbuild/cachyos-v3-x86_64/root pacman -Syu --noconfirm"
                .to_string(),
            "extra-x86_64-build -r /var/lib/archbuild/cachyos-v3 -- -m -C /etc/makepkg-raptorlake.conf"
                .to_string(),
            "repo-add -s -v /srv/repo/aphrody-omarchy/x86_64_v3/aphrody-omarchy.db.tar.zst *.pkg.tar.zst"
                .to_string(),
        ];

        UnifiedRepoManifest {
            distro_id: "aphrody-omarchy-cachyos-wsl2".to_string(),
            kernel_target: "7.4.0-rc2-cachyos-omarchy-wsl2".to_string(),
            arch_tier: "x86-64-v3 (Raptor Lake AVX2/FMA3/BMI2)".to_string(),
            repositories: Self::repositories(),
            cachyos_pkgbuilds_count: cachyos_count,
            omarchy_pkgbuilds_count: omarchy_count,
            core_packages,
            devtools_chroot_workflow,
        }
    }
}
