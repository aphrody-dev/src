# Graph Report - docs

## Corpus Check

- **Nodes:** 7689 · **Edges:** 7009 · **Communities:** 735
- **Extraction Engine:** 100% Native Tree-Sitter AST & Justfile Integration

## God Nodes (Most connected abstractions)

1. `aphrody.app.lighthouse.json` [file] - 562 connections (proofs/sites-2026-11-13/before/aphrody.app.lighthouse.json:L1)
2. `aphrody.com.lighthouse.json` [file] - 560 connections (proofs/sites-2026-11-13/before/aphrody.com.lighthouse.json:L1)
3. `yolo.aphrody.app.lighthouse.json` [file] - 554 connections (proofs/sites-2026-11-13/before/yolo.aphrody.app.lighthouse.json:L1)
4. `aphrody.com.lighthouse.json` [file] - 542 connections (proofs/sites-2026-11-13/after/aphrody.com.lighthouse.json:L1)
5. `rosegriffon.fr.lighthouse.json` [file] - 542 connections (proofs/sites-2026-11-13/after/rosegriffon.fr.lighthouse.json:L1)
6. `rosegriffon.fr.lighthouse.json` [file] - 542 connections (proofs/sites-2026-11-13/before/rosegriffon.fr.lighthouse.json:L1)
7. `aphrody.app.lighthouse.json` [file] - 541 connections (proofs/sites-2026-11-13/after/aphrody.app.lighthouse.json:L1)
8. `yolo.aphrody.app.lighthouse.json` [file] - 541 connections (proofs/sites-2026-11-13/after/yolo.aphrody.app.lighthouse.json:L1)
9. `material-3.json` [file] - 522 connections (design/specs/components/material-3.json:L1)
10. `cdn.rosegriffon.fr.lighthouse.json` [file] - 484 connections (proofs/sites-2026-11-13/before/cdn.rosegriffon.fr.lighthouse.json:L1)
11. `material-3.json` [file] - 183 connections (design/specs/tokens/material-3.json:L1)
12. `main.json` [file] - 163 connections (bench/main.json:L1)

## Key Structural Connections

- `matrix.json` --[defines]--> `page` (Extracted)
- `matrix.json` --[defines]--> `locale` (Extracted)
- `matrix.json` --[defines]--> `width` (Extracted)
- `matrix.json` --[defines]--> `file` (Extracted)
- `matrix.json` --[defines]--> `font` (Extracted)
- `matrix.json` --[defines]--> `lang` (Extracted)
- `matrix.json` --[defines]--> `over` (Extracted)
- `matrix.json` --[defines]--> `raw` (Extracted)
- `matrix.json` --[defines]--> `canon` (Extracted)
- `matrix.json` --[defines]--> `hl` (Extracted)
- `matrix.json` --[defines]--> `h1` (Extracted)
- `matrix.json` --[defines]--> `len` (Extracted)
- `awesome_posix_linux_2026_catalog.json` --[defines]--> `generated_at` (Extracted)
- `awesome_posix_linux_2026_catalog.json` --[defines]--> `engine` (Extracted)
- `awesome_posix_linux_2026_catalog.json` --[defines]--> `gix_version` (Extracted)
- `awesome_posix_linux_2026_catalog.json` --[defines]--> `gitingest_integration` (Extracted)
- `awesome_posix_linux_2026_catalog.json` --[defines]--> `kernel_variants_2026` (Extracted)
- `awesome_posix_linux_2026_catalog.json` --[defines]--> `name` (Extracted)
- `awesome_posix_linux_2026_catalog.json` --[defines]--> `upstream_basis` (Extracted)
- `awesome_posix_linux_2026_catalog.json` --[defines]--> `primary_patches` (Extracted)

## Architecture Diagram (Mermaid Preview)

```mermaid
flowchart TD
    file_IDENTITY_md["IDENTITY.md"]
    file_AGY_SESSIONS_CONTINUOUS_REVIEW_md["AGY_SESSIONS_CONTINUOUS_REVIEW.md"]
    file_DEPS_MINIMIZE_md["DEPS-MINIMIZE.md"]
    file_tv_enquete_rust_c_gcc_llvm_ffmpeg_mdx["enquete-rust-c-gcc-llvm-ffmpeg.mdx"]
    file_tv_plan_ecosysteme_c_rust_mdx["plan-ecosysteme-c-rust.mdx"]
    file_tv_ffmpeg_analyse_mdx["ffmpeg-analyse.mdx"]
    file_tv_remplacant_ffmpeg_rust_mdx["remplacant-ffmpeg-rust.mdx"]
    file_tv_environnement_mdx["environnement.mdx"]
    file_specs_APHRODY_DESIGN_CAHIER_DES_CHARGES_md["APHRODY_DESIGN_CAHIER_DES_CHARGES.md"]
    file_WAYLAND_md["WAYLAND.md"]
    file_deps_POLICY_md["POLICY.md"]
    file_deps_DEDUP_md["DEDUP.md"]
    file_PHILOSOPHY_md["PHILOSOPHY.md"]
    file_llvm_CROSS_COMPILE_md["CROSS-COMPILE.md"]
    file_llvm_ECOSYSTEM_md["ECOSYSTEM.md"]
    file_llvm_UNIFIED_TOOLCHAIN_md["UNIFIED-TOOLCHAIN.md"]
    file_llvm_BEST_PRACTICES_md["BEST-PRACTICES.md"]
    file_llvm_CHROMIUM_157_TOOLCHAIN_md["CHROMIUM-157-TOOLCHAIN.md"]
    file_llvm_ROADMAP_md["ROADMAP.md"]
    file_llvm_TOOLCHAIN_FORKS_md["TOOLCHAIN-FORKS.md"]
    file_llvm_C_ABI_2026_md["C-ABI-2026.md"]
    file_llvm_AY_AS_LLVM_md["AY-AS-LLVM.md"]
    file_CHROMIUM_FACTORY_md["CHROMIUM-FACTORY.md"]
    file_patches_series["series"]
    file_lfs_logs_bunlfs_logs_log_boot_debian_log["boot-debian.log"]
    file_lfs_logs_bunlfs_logs_log_uutils_log["uutils.log"]
    file_lfs_logs_bunlfs_logs_log_rootfs_log["rootfs.log"]
    file_lfs_logs_bunlfs_logs_log_boot_arch_log["boot-arch.log"]
    file_lfs_logs_bunlfs_logs_log_qemu_bun_log["qemu-bun.log"]
    file_lfs_logs_bunlfs_logs_log_compare_tsv["compare.tsv"]
    file_lfs_logs_bunlfs_logs_log_boot_fedora_log["boot-fedora.log"]
    file_lfs_logs_bunlfs_logs_log_qemu_preinit_kvm_log["qemu-preinit-kvm.log"]
    file_lfs_logs_bunlfs_logs_log_boot_compare_tsv["boot-compare.tsv"]
    file_lfs_logs_bunlfs_logs_log_compare_log["compare.log"]
    file_lfs_logs_bunlfs_logs_log_qemu_preinit_tcg_log["qemu-preinit-tcg.log"]

```
