# Codebase Digest: docs

- Files analyzed: 734
- Total lines: 145143
- Total size: 11.21 MB
- Git branch: `main`
- Git HEAD commit: `272c544f (docker: ship vendor icons, wallpaper thumbs and crates/game/assets to the bun-build stage (aphrody, r2-site, api-gateway images))`
- Digest mode: `AST-Smart Outline`

## Directory Structure

```text
docs/
├── AGY_SESSIONS_CONTINUOUS_REVIEW.md (44 lines, 5.1 KB, ~1.4k tokens)
├── AI_AGENT_SURFACE_MAP.md (75 lines, 4.0 KB, ~1.1k tokens)
├── ALPHABET.md (57 lines, 7.4 KB, ~2.0k tokens)
├── ARCHGUARD.md (125 lines, 7.0 KB, ~1.9k tokens)
├── ARCHITECTURE-ROOT.md (85 lines, 11.6 KB, ~3.1k tokens)
├── ARCHITECTURE.md (427 lines, 65.8 KB, ~16.9k tokens)
├── AY_LOW_LEVEL.md (55 lines, 7.4 KB, ~1.9k tokens)
├── AY_MIGRATION.md (497 lines, 107.0 KB, ~25.0k tokens)
├── AY_ON_BUN.md (94 lines, 7.6 KB, ~2.1k tokens)
├── AY_RUNTIMES.md (52 lines, 12.8 KB, ~2.9k tokens)
├── BUILD_SPEED.md (140 lines, 10.0 KB, ~2.7k tokens)
├── CHROMIUM-FACTORY.md (197 lines, 34.3 KB, ~9.0k tokens)
├── COMPAT-WINDOWS-LINUX.md (57 lines, 14.4 KB, ~3.2k tokens)
├── CONFORMANCE.md (65 lines, 14.5 KB, ~3.6k tokens)
├── CONSOLIDATION_PLAN.md (97 lines, 15.2 KB, ~4.1k tokens)
├── DEPOT_ARCHITECTURE.md (203 lines, 12.0 KB, ~3.2k tokens)
├── DEPOT_TOOLS_RUST.md (230 lines, 53.6 KB, ~12.1k tokens)
├── DEPS-MINIMIZE.md (98 lines, 8.7 KB, ~2.3k tokens)
├── DESIGN_SYSTEM.md (10 lines, 1.8 KB, ~515 tokens)
├── ECOSYSTEM-VERCEL-MICROSOFT.md (25 lines, 5.3 KB, ~1.4k tokens)
├── ECOSYSTEM_CHOICES.md (275 lines, 66.2 KB, ~17.0k tokens)
├── ENGINE-DECISION.md (159 lines, 14.2 KB, ~4.0k tokens)
├── GITHUB_ORG_CLEANUP.md (55 lines, 4.2 KB, ~1.0k tokens)
├── IDENTITY.md (60 lines, 4.6 KB, ~1.3k tokens)
├── INFRA_MATRIX.md (108 lines, 15.0 KB, ~4.1k tokens)
├── INSTALL_UPDATE.md (247 lines, 20.3 KB, ~5.6k tokens)
├── MICROSOFT_RUST.md (31 lines, 4.4 KB, ~1.1k tokens)
├── MODERN_WEB_GUIDELINES.md (102 lines, 5.3 KB, ~1.5k tokens)
├── MONOREPO_ATLAS.md (453 lines, 346.9 KB, ~59.9k tokens)
├── NAMING.md (66 lines, 34.2 KB, ~6.4k tokens)
├── PHILOSOPHY.md (76 lines, 19.7 KB, ~5.3k tokens)
├── PLUGIN.md (49 lines, 5.3 KB, ~1.3k tokens)
├── PUBLISH-AUDIT.md (109 lines, 17.6 KB, ~4.4k tokens)
├── REGISTRY_AND_REPO_AUDIT.md (92 lines, 8.5 KB, ~2.6k tokens)
├── REVIEW-2026-11-12.md (27 lines, 2.9 KB, ~776 tokens)
├── RUST_STACK.md (37 lines, 7.2 KB, ~1.5k tokens)
├── SCIENTIFIC-RIGOR.md (17 lines, 1.7 KB, ~446 tokens)
├── SESSION-LEDGER-2026-11-12.md (61 lines, 11.8 KB, ~2.6k tokens)
├── SESSION-LEDGER-2026-11-13.md (55 lines, 8.1 KB, ~2.0k tokens)
├── STACK-ROADMAP.md (323 lines, 21.2 KB, ~6.1k tokens)
├── TOOLCHAIN_UPSTREAM_LEVERS.md (172 lines, 66.3 KB, ~16.3k tokens)
├── UNIX.md (83 lines, 5.6 KB, ~1.6k tokens)
├── VCS_FORGE_MATRIX.md (143 lines, 30.0 KB, ~7.3k tokens)
├── VERSIONING.md (55 lines, 8.8 KB, ~2.4k tokens)
├── WAYLAND.md (67 lines, 3.6 KB, ~948 tokens)
├── WEB-ECOSYSTEM.md (227 lines, 38.3 KB, ~9.9k tokens)
├── WINDOWS_UNIX_TOOLCHAIN.md (115 lines, 9.6 KB, ~2.6k tokens)
├── WORKSTATION_INVENTORY.md (435 lines, 67.9 KB, ~16.4k tokens)
├── agents/
│   ├── AGENT-FIRST.md (174 lines, 23.0 KB, ~6.3k tokens)
│   └── WINDOWS-NATIVE-PORT.md (43 lines, 7.5 KB, ~1.9k tokens)
├── ai/
│   └── DISTRIBUTED-INFERENCE.md (171 lines, 29.5 KB, ~7.6k tokens)
├── ay/
│   └── MIGRATION.md (216 lines, 23.0 KB, ~6.3k tokens)
├── bench/
│   ├── REPORT.md (255 lines, 38.1 KB, ~9.9k tokens)
│   ├── driver-compat.json (144 lines, 3.8 KB, ~1.3k tokens)
│   ├── embed.json (3062 lines, 81.0 KB, ~27.9k tokens)
│   ├── lighthouse-cef.json (19 lines, 547 B, ~190 tokens)
│   ├── lighthouse.json (366 lines, 12.0 KB, ~4.2k tokens)
│   └── pw-chromium.json (634 lines, 17.2 KB, ~5.9k tokens)
├── bun/
│   ├── AOT-LTO-FFI-2026.md (71 lines, 11.2 KB, ~3.0k tokens)
│   ├── COMPARISON.md (85 lines, 8.1 KB, ~2.4k tokens)
│   ├── CONSOLIDATION.md (97 lines, 18.5 KB, ~4.8k tokens)
│   └── NATIVE-BINARY.md (66 lines, 8.4 KB, ~2.3k tokens)
├── compat/
│   ├── DEDUP-2026-11-12.md (82 lines, 19.7 KB, ~4.6k tokens)
│   ├── ECOSYSTEM.md (81 lines, 11.0 KB, ~3.0k tokens)
│   ├── MSYS-MONOREPO.md (9 lines, 1.1 KB, ~338 tokens)
│   ├── PLAN.md (42 lines, 6.5 KB, ~1.7k tokens)
│   ├── PROOF.md (29 lines, 3.9 KB, ~976 tokens)
│   └── TARGETS.md (54 lines, 8.5 KB, ~2.2k tokens)
├── core/
│   └── grammars.patch (29 lines, 1.4 KB, ~462 tokens)
├── deps/
│   ├── DEDUP.md (38 lines, 6.1 KB, ~1.7k tokens)
│   └── POLICY.md (118 lines, 16.1 KB, ~4.1k tokens)
├── design/
│   ├── DESIGN.md (90 lines, 3.9 KB, ~1.1k tokens)
│   ├── FIGMA.md (26 lines, 2.3 KB, ~733 tokens)
│   ├── README.md (21 lines, 2.3 KB, ~646 tokens)
│   ├── REFERENCES.md (17 lines, 2.1 KB, ~600 tokens)
│   ├── index/
│   │   ├── design.google.json (900 lines, 41.2 KB, ~14.0k tokens)
│   │   ├── developer.chrome.com.json (756 lines, 39.1 KB, ~13.6k tokens)
│   │   ├── m3.material.io.json (1145 lines, 51.6 KB, ~17.7k tokens)
│   │   ├── material.io.json (761 lines, 36.3 KB, ~12.1k tokens)
│   │   ├── vercel.com.json (598 lines, 26.7 KB, ~9.5k tokens)
│   │   └── web.dev.json (1075 lines, 50.1 KB, ~17.9k tokens)
│   ├── sources.toml (84 lines, 4.4 KB, ~1.3k tokens)
│   └── specs/
│       ├── a11y/
│       │   ├── material-3.json (167 lines, 12.6 KB, ~3.7k tokens)
│       │   ├── material-3.md (52 lines, 10.1 KB, ~2.6k tokens)
│       │   ├── web.json (262 lines, 16.7 KB, ~5.4k tokens)
│       │   └── web.md (79 lines, 20.8 KB, ~5.2k tokens)
│       ├── components/
│       │   ├── geist.json (454 lines, 21.9 KB, ~7.2k tokens)
│       │   ├── geist.md (582 lines, 27.5 KB, ~6.9k tokens)
│       │   ├── material-3.json (1485 lines, 83.1 KB, ~26.2k tokens)
│       │   └── material-3.md (1569 lines, 108.9 KB, ~28.5k tokens)
│       ├── gpu-wasm/
│       │   ├── webgpu-wasm.json (225 lines, 15.9 KB, ~5.0k tokens)
│       │   └── webgpu-wasm.md (86 lines, 21.4 KB, ~5.5k tokens)
│       ├── motion/
│       │   ├── material-3.json (241 lines, 12.0 KB, ~4.0k tokens)
│       │   └── material-3.md (86 lines, 9.0 KB, ~2.5k tokens)
│       ├── perf/
│       │   ├── core-web-vitals.json (296 lines, 18.6 KB, ~5.8k tokens)
│       │   ├── core-web-vitals.md (86 lines, 27.9 KB, ~6.3k tokens)
│       │   ├── vercel-frontend.json (156 lines, 9.7 KB, ~3.0k tokens)
│       │   └── vercel-frontend.md (49 lines, 14.8 KB, ~3.3k tokens)
│       ├── principles/
│       │   ├── google-design.json (334 lines, 24.4 KB, ~7.2k tokens)
│       │   └── google-design.md (156 lines, 20.5 KB, ~5.5k tokens)
│       ├── seo/
│       │   ├── web.json (120 lines, 8.5 KB, ~2.7k tokens)
│       │   └── web.md (53 lines, 10.6 KB, ~2.7k tokens)
│       ├── spec.schema.json (77 lines, 2.3 KB, ~835 tokens)
│       └── tokens/
│           ├── geist.json (245 lines, 14.5 KB, ~4.5k tokens)
│           ├── geist.md (89 lines, 28.9 KB, ~6.2k tokens)
│           ├── material-3.json (1832 lines, 60.1 KB, ~20.8k tokens)
│           └── material-3.md (265 lines, 29.6 KB, ~7.5k tokens)
├── epic/
│   ├── FREE-ASSETS.md (72 lines, 4.4 KB, ~1.2k tokens)
│   ├── RESOURCES.md (86 lines, 13.5 KB, ~3.6k tokens)
│   ├── TRACKING.md (8 lines, 937 B, ~258 tokens)
│   └── snapshot.json (1238 lines, 44.6 KB, ~14.6k tokens)
├── games/
│   ├── ARTCRAFT.md (111 lines, 16.0 KB, ~4.3k tokens)
│   ├── ASSET-TESTS.md (43 lines, 2.1 KB, ~630 tokens)
│   ├── BROWSER-OS.md (68 lines, 7.9 KB, ~2.2k tokens)
│   ├── FEATURE-MATRIX.md (59 lines, 20.3 KB, ~4.5k tokens)
│   ├── MEDIA-STACK.md (98 lines, 15.9 KB, ~3.9k tokens)
│   ├── MERGE-APHRODY.md (65 lines, 14.3 KB, ~3.4k tokens)
│   ├── MULTIPLAYER.md (28 lines, 2.8 KB, ~714 tokens)
│   ├── PARITY.md (40 lines, 5.2 KB, ~1.3k tokens)
│   ├── PLAN.md (83 lines, 20.7 KB, ~5.4k tokens)
│   └── PLATFORM-EQUIV.md (49 lines, 11.7 KB, ~2.7k tokens)
├── gaming/
│   └── OWNERSHIP.md (78 lines, 19.1 KB, ~4.3k tokens)
├── gnu/
│   ├── DISTROS.md (264 lines, 50.4 KB, ~11.1k tokens)
│   ├── INDEX.md (63 lines, 6.8 KB, ~1.6k tokens)
│   ├── MODERN.md (56 lines, 12.4 KB, ~2.7k tokens)
│   ├── PACKAGES.md (542 lines, 185.3 KB, ~44.6k tokens)
│   ├── PHILOSOPHY.md (57 lines, 7.2 KB, ~1.8k tokens)
│   ├── PLAN.md (49 lines, 7.7 KB, ~1.9k tokens)
│   └── gnu-packages.json (12239 lines, 444.7 KB, ~147.9k tokens)
├── i18n/
│   ├── README.md (32 lines, 1.8 KB, ~539 tokens)
│   ├── es/
│   │   ├── AGENTS.md (25 lines, 1.2 KB, ~327 tokens)
│   │   ├── PLAN.md (70 lines, 8.5 KB, ~2.3k tokens)
│   │   └── README.md (48 lines, 3.6 KB, ~1.1k tokens)
│   ├── fr/
│   │   ├── AGENTS.md (40 lines, 4.0 KB, ~1.1k tokens)
│   │   ├── PLAN.md (70 lines, 12.8 KB, ~3.3k tokens)
│   │   └── README.md (64 lines, 6.8 KB, ~1.9k tokens)
│   ├── ja/
│   │   ├── AGENTS.md (40 lines, 4.6 KB, ~1.0k tokens)
│   │   ├── PLAN.md (70 lines, 15.9 KB, ~3.6k tokens)
│   │   └── README.md (62 lines, 6.8 KB, ~1.7k tokens)
│   └── zh-CN/
│       ├── AGENTS.md (40 lines, 3.7 KB, ~964 tokens)
│       ├── PLAN.md (71 lines, 16.8 KB, ~3.9k tokens)
│       └── README.md (64 lines, 7.3 KB, ~2.0k tokens)
├── infra/
│   ├── AGENT-TOOLCHAIN.md (67 lines, 9.1 KB, ~2.5k tokens)
│   ├── AUDIT-2026-11-13.md (24 lines, 3.3 KB, ~842 tokens)
│   ├── AUTH-ECOSYSTEM.md (184 lines, 44.7 KB, ~10.5k tokens)
│   ├── AUTH.md (82 lines, 24.2 KB, ~5.7k tokens)
│   ├── CLEANUP-2026-11-12.md (26 lines, 2.8 KB, ~832 tokens)
│   ├── CLOUDFLARE-ONE.md (93 lines, 17.1 KB, ~4.5k tokens)
│   ├── CLUSTER.md (146 lines, 12.9 KB, ~3.5k tokens)
│   ├── DEPLOY.md (84 lines, 12.5 KB, ~3.3k tokens)
│   ├── FLEET.md (123 lines, 13.6 KB, ~4.0k tokens)
│   ├── FR1-CHROMIUM-HOST.md (69 lines, 16.5 KB, ~4.1k tokens)
│   ├── FR2-CLOUDFLARE.md (321 lines, 99.7 KB, ~23.7k tokens)
│   ├── GCP-BILLING.md (98 lines, 20.2 KB, ~4.9k tokens)
│   ├── GITHUB-APP.md (113 lines, 21.7 KB, ~5.2k tokens)
│   ├── GLOBAL-STACK.md (32 lines, 5.2 KB, ~1.5k tokens)
│   ├── HOSTING-POLICY.md (78 lines, 13.3 KB, ~3.3k tokens)
│   ├── IDENTITY-CONSOLIDATION.md (96 lines, 17.5 KB, ~4.8k tokens)
│   ├── INCIDENT-2026-11-12-prd-aphrody.md (635 lines, 106.7 KB, ~25.9k tokens)
│   ├── MIGRATION-VERCEL-CF.md (65 lines, 13.0 KB, ~3.2k tokens)
│   ├── NPM.md (83 lines, 11.9 KB, ~3.0k tokens)
│   ├── PROD-MAP.md (74 lines, 8.9 KB, ~2.6k tokens)
│   ├── RESILIENCE.md (94 lines, 13.7 KB, ~3.7k tokens)
│   ├── RUNNERS.md (35 lines, 4.6 KB, ~1.3k tokens)
│   ├── UPSTREAM-STACK.md (103 lines, 27.2 KB, ~6.3k tokens)
│   ├── VAULT.md (229 lines, 27.9 KB, ~7.6k tokens)
│   ├── VPS-PURGE-2026-11-13.md (29 lines, 3.4 KB, ~982 tokens)
│   └── resilience/
│       ├── 2026-11-13T0311Z-fr2.txt (27 lines, 2.6 KB, ~733 tokens)
│       ├── 2026-11-13T0331Z-prd.txt (30 lines, 2.7 KB, ~760 tokens)
│       ├── 2026-11-13T0357Z-fr1.txt (14 lines, 1.4 KB, ~388 tokens)
│       └── 2026-11-13T0445Z-prd-failover.txt (41 lines, 3.9 KB, ~1.0k tokens)
├── lfs/
│   └── logs/
│       └── bunlfs-logs/
│           └── log/
│               ├── boot-alpine.log (411 lines, 32.2 KB, ~9.0k tokens)
│               ├── boot-arch.log (368 lines, 32.0 KB, ~10.3k tokens)
│               ├── boot-compare.tsv (7 lines, 354 B, ~101 tokens)
│               ├── boot-debian.log (796 lines, 67.0 KB, ~19.5k tokens)
│               ├── boot-fedora.log (1118 lines, 100.3 KB, ~29.4k tokens)
│               ├── boot-ubuntu.log (805 lines, 68.0 KB, ~19.8k tokens)
│               ├── compare.log (7 lines, 285 B, ~82 tokens)
│               ├── compare.tsv (8 lines, 671 B, ~197 tokens)
│               ├── fetch.log (3 lines, 67 B, ~27 tokens)
│               ├── host-image.txt (9 lines, 239 B, ~76 tokens)
│               ├── image.log (0 lines, 0 B, ~0 tokens)
│               ├── kernel.log (4128 lines, 152.9 KB, ~43.6k tokens)
│               ├── preinit.log (0 lines, 0 B, ~0 tokens)
│               ├── qemu-bun-tcg.log (494 lines, 37.0 KB, ~10.1k tokens)
│               ├── qemu-bun.log (494 lines, 37.0 KB, ~10.1k tokens)
│               ├── qemu-preinit-kvm.log (479 lines, 36.0 KB, ~9.8k tokens)
│               ├── qemu-preinit-tcg.log (470 lines, 35.1 KB, ~9.6k tokens)
│               ├── qemu-preinit.log (479 lines, 36.0 KB, ~9.8k tokens)
│               ├── rootfs.log (0 lines, 0 B, ~0 tokens)
│               └── uutils.log (586 lines, 21.1 KB, ~6.1k tokens)
├── linux/
│   ├── ANDROID-CHROMIUMOS.md (35 lines, 3.2 KB, ~870 tokens)
│   ├── CROSS-WINDOWS.md (16 lines, 2.4 KB, ~743 tokens)
│   ├── GPU.md (38 lines, 4.6 KB, ~1.2k tokens)
│   ├── OWNERSHIP.md (85 lines, 17.4 KB, ~3.9k tokens)
│   └── PATCHSETS.md (61 lines, 8.8 KB, ~2.4k tokens)
├── linux-kernel-story/
│   ├── awesome_posix_linux_2026_catalog.json (152 lines, 8.6 KB, ~2.5k tokens)
│   └── mdx/
│       ├── 01-linux-genesis-80386-minix-1991.mdx (303 lines, 14.0 KB, ~4.0k tokens)
│       ├── 02-tanenbaum-torvalds-microkernel-debate-1992.mdx (173 lines, 9.2 KB, ~2.8k tokens)
│       ├── 03-birth-of-git-14-days-2005.mdx (172 lines, 10.4 KB, ~2.9k tokens)
│       ├── 04-kernel-org-infrastructure-and-governance.mdx (101 lines, 6.1 KB, ~1.6k tokens)
│       ├── 05-development-model-merge-window-rc-cycles.mdx (130 lines, 6.4 KB, ~1.8k tokens)
│       ├── 06-golden-rule-never-break-userspace.mdx (108 lines, 6.8 KB, ~1.9k tokens)
│       ├── 07-subsystems-vfs-memory-management-schedulers.mdx (161 lines, 10.0 KB, ~3.0k tokens)
│       ├── 08-concurrency-bkl-spinlocks-rcu.mdx (104 lines, 6.9 KB, ~1.9k tokens)
│       ├── 09-modern-revolutions-ebpf-iouring-rust.mdx (166 lines, 8.4 KB, ~2.4k tokens)
│       ├── 10-chronology-torvalds-milestones-1991-2026.mdx (84 lines, 8.1 KB, ~2.1k tokens)
│       ├── 11-comparative-study-linux-vs-aphrody.mdx (221 lines, 15.7 KB, ~4.3k tokens)
│       ├── 12-linux-2026-variants-non-c-kernels-discovery.mdx (133 lines, 9.5 KB, ~2.8k tokens)
│       ├── 13-upstream-live-releases-git-and-distro-deployments.mdx (103 lines, 10.6 KB, ~3.1k tokens)
│       └── index.mdx (73 lines, 8.5 KB, ~2.3k tokens)
├── llvm/
│   ├── AY-AS-LLVM.md (124 lines, 12.3 KB, ~3.2k tokens)
│   ├── BEST-PRACTICES.md (41 lines, 7.2 KB, ~1.8k tokens)
│   ├── C-ABI-2026.md (45 lines, 9.3 KB, ~2.3k tokens)
│   ├── CHROMIUM-157-TOOLCHAIN.md (69 lines, 4.8 KB, ~1.4k tokens)
│   ├── CROSS-COMPILE.md (54 lines, 8.4 KB, ~2.3k tokens)
│   ├── ECOSYSTEM.md (98 lines, 16.4 KB, ~4.0k tokens)
│   ├── ROADMAP.md (18 lines, 3.5 KB, ~915 tokens)
│   ├── TOOLCHAIN-FORKS.md (33 lines, 3.5 KB, ~974 tokens)
│   └── UNIFIED-TOOLCHAIN.md (94 lines, 13.7 KB, ~3.6k tokens)
├── lore/
│   ├── README.md (45 lines, 1.7 KB, ~441 tokens)
│   ├── assets/
│   │   ├── css/
│   │   │   └── lore-docs.css (1 lines, 36 B, ~11 tokens)
│   │   ├── fonts/
│   │   │   ├── README.md (20 lines, 711 B, ~203 tokens)
│   │   │   ├── inter_v3.019.license (92 lines, 4.3 KB, ~1.1k tokens)
│   │   │   └── recursive-mono_v1.085.license (93 lines, 4.3 KB, ~1.1k tokens)
│   │   └── hooks/
│   │       ├── adr_meta.py (4 lines, 131 B, ~39 tokens)
│   │       ├── content_tabs.py (10 lines, 404 B, ~124 tokens)
│   │       └── test_content_tabs.py (20 lines, 1019 B, ~248 tokens)
│   ├── developing/
│   │   ├── README.md (18 lines, 1.1 KB, ~320 tokens)
│   │   ├── code-standards/
│   │   │   ├── README.md (24 lines, 1.8 KB, ~476 tokens)
│   │   │   ├── async-futures.md (208 lines, 10.9 KB, ~3.0k tokens)
│   │   │   ├── code-review.md (111 lines, 10.2 KB, ~2.7k tokens)
│   │   │   ├── comments.md (59 lines, 3.2 KB, ~808 tokens)
│   │   │   ├── engineering-principles.md (27 lines, 1.3 KB, ~331 tokens)
│   │   │   ├── errors.md (367 lines, 20.9 KB, ~5.6k tokens)
│   │   │   ├── logging.md (137 lines, 4.3 KB, ~1.2k tokens)
│   │   │   ├── tasks.md (82 lines, 4.6 KB, ~1.2k tokens)
│   │   │   └── testing.md (602 lines, 31.9 KB, ~8.6k tokens)
│   │   ├── decisions/
│   │   │   ├── 00001-fast-cdc.md (83 lines, 2.6 KB, ~690 tokens)
│   │   │   ├── 00002-branch-tracking-in-mutable-store.md (39 lines, 2.7 KB, ~644 tokens)
│   │   │   ├── 00003-auth-tokens-for-sub-repos.md (95 lines, 5.0 KB, ~1.2k tokens)
│   │   │   ├── 00004-s3-storage-options.md (83 lines, 3.7 KB, ~929 tokens)
│   │   │   ├── 00005-web-framework.md (93 lines, 4.1 KB, ~1.1k tokens)
│   │   │   ├── 00006-s3-storage-options-reconsidered.md (83 lines, 3.8 KB, ~945 tokens)
│   │   │   ├── 00007-aws-mutable-store-options.md (142 lines, 6.2 KB, ~1.6k tokens)
│   │   │   ├── 00008-aws-store-fragment-associations.md (91 lines, 4.3 KB, ~1.1k tokens)
│   │   │   ├── 00009-lore-library-js-bindings.md (87 lines, 6.9 KB, ~1.7k tokens)
│   │   │   ├── 00010-fragment-max-size.md (200 lines, 11.0 KB, ~2.9k tokens)
│   │   │   ├── 00011-lore-cli-frontend.md (122 lines, 4.8 KB, ~1.3k tokens)
│   │   │   ├── 00012-log-dispatch.md (80 lines, 3.6 KB, ~878 tokens)
│   │   │   ├── 00013-plugin-dependency-strategy.md (193 lines, 9.1 KB, ~2.4k tokens)
│   │   │   ├── 00014-anchor-tracking-in-mutable-store.md (74 lines, 5.6 KB, ~1.3k tokens)
│   │   │   ├── 00015-log-crate-separation.md (121 lines, 5.7 KB, ~1.4k tokens)
│   │   │   ├── 00016-compression-algorithm-selection.md (109 lines, 5.0 KB, ~1.3k tokens)
│   │   │   ├── 00017-ffi-error-detail-on-complete-event.md (93 lines, 6.4 KB, ~1.6k tokens)
│   │   │   ├── 00018-external-instance-directory-registry.md (88 lines, 5.1 KB, ~1.3k tokens)
│   │   │   ├── 00019-portable-arm-build-with-neoverse-512tvb-opt-in.md (109 lines, 5.2 KB, ~1.4k tokens)
│   │   │   ├── 00020-fragment-metadata-on-s3-objects.md (286 lines, 18.7 KB, ~4.6k tokens)
│   │   │   ├── 00020-storage-per-item-error-detail.md (55 lines, 5.8 KB, ~1.5k tokens)
│   │   │   ├── 00021-view-independent-merges-and-subtree-grafting.md (74 lines, 10.5 KB, ~2.7k tokens)
│   │   │   ├── 00022-service-ipc-bitcode.md (68 lines, 3.8 KB, ~958 tokens)
│   │   │   ├── 00023-data-verification-and-trust.md (167 lines, 10.9 KB, ~2.7k tokens)
│   │   │   ├── 00024-store-locks-held-per-span-contain-the-repository-lock.md (97 lines, 26.0 KB, ~6.3k tokens)
│   │   │   ├── 00025-service-version-compatibility.md (55 lines, 2.9 KB, ~716 tokens)
│   │   │   ├── 00026-concurrent-read-only-instance-operations.md (92 lines, 11.3 KB, ~2.8k tokens)
│   │   │   ├── 00027-ignore-filter-applies-to-untracked-paths-only.md (195 lines, 21.6 KB, ~5.5k tokens)
│   │   │   ├── 00028-state-node-operations-behind-one-write-boundary.md (92 lines, 11.9 KB, ~2.9k tokens)
│   │   │   ├── 00029-instance-local-modified-time-records.md (66 lines, 3.9 KB, ~999 tokens)
│   │   │   ├── 00030-exclusive-repository-lock-holders.md (82 lines, 3.8 KB, ~972 tokens)
│   │   │   ├── README.md (12 lines, 618 B, ~159 tokens)
│   │   │   └── adr-template.md (86 lines, 2.9 KB, ~791 tokens)
│   │   ├── doc-standards/
│   │   │   ├── README.md (66 lines, 5.6 KB, ~1.5k tokens)
│   │   │   ├── canon/
│   │   │   │   ├── doc-types.md (637 lines, 39.8 KB, ~10.6k tokens)
│   │   │   │   ├── format.md (384 lines, 20.2 KB, ~5.4k tokens)
│   │   │   │   └── language.md (305 lines, 24.2 KB, ~6.2k tokens)
│   │   │   ├── operational/
│   │   │   │   ├── accessibility-and-media.md (93 lines, 4.6 KB, ~1.2k tokens)
│   │   │   │   ├── filenames.md (40 lines, 2.4 KB, ~687 tokens)
│   │   │   │   ├── glossary-conventions.md (190 lines, 7.6 KB, ~2.1k tokens)
│   │   │   │   └── review-checklist.md (101 lines, 8.3 KB, ~2.3k tokens)
│   │   │   ├── tools/
│   │   │   │   ├── README.md (270 lines, 21.5 KB, ~5.7k tokens)
│   │   │   │   ├── lychee/
│   │   │   │   │   └── lychee.toml (100 lines, 3.8 KB, ~1.2k tokens)
│   │   │   │   └── vale/
│   │   │   │       └── styles/
│   │   │   │           ├── Lore/
│   │   │   │           │   ├── AMPM.yml (9 lines, 288 B, ~102 tokens)
│   │   │   │           │   ├── Accessibility.yml (30 lines, 657 B, ~174 tokens)
│   │   │   │           │   ├── Acronyms.yml (64 lines, 795 B, ~255 tokens)
│   │   │   │           │   ├── Adverbs.yml (272 lines, 3.8 KB, ~950 tokens)
│   │   │   │           │   ├── AlertTypes.yml (13 lines, 518 B, ~147 tokens)
│   │   │   │           │   ├── AmericanSpelling.yml (37 lines, 1.0 KB, ~252 tokens)
│   │   │   │           │   ├── AndOr.yml (12 lines, 414 B, ~123 tokens)
│   │   │   │           │   ├── Auto.yml (11 lines, 253 B, ~78 tokens)
│   │   │   │           │   ├── Avoid.yml (14 lines, 342 B, ~102 tokens)
│   │   │   │           │   ├── BlackWhiteList.yml (17 lines, 497 B, ~129 tokens)
│   │   │   │           │   ├── Boolean.yml (13 lines, 432 B, ~122 tokens)
│   │   │   │           │   ├── ClickOn.yml (14 lines, 408 B, ~116 tokens)
│   │   │   │           │   ├── Contractions.yml (50 lines, 891 B, ~330 tokens)
│   │   │   │           │   ├── Dashes.yml (13 lines, 289 B, ~90 tokens)
│   │   │   │           │   ├── DateFormat.yml (8 lines, 393 B, ~143 tokens)
│   │   │   │           │   ├── DateNumbers.yml (40 lines, 788 B, ~241 tokens)
│   │   │   │           │   ├── DateOrder.yml (8 lines, 240 B, ~82 tokens)
│   │   │   │           │   ├── Difficulty.yml (38 lines, 2.2 KB, ~628 tokens)
│   │   │   │           │   ├── Dropdown.yml (13 lines, 353 B, ~101 tokens)
│   │   │   │           │   ├── Ellipses.yml (9 lines, 210 B, ~63 tokens)
│   │   │   │           │   ├── FirstPerson.yml (16 lines, 319 B, ~115 tokens)
│   │   │   │           │   ├── Foreign.yml (13 lines, 368 B, ~132 tokens)
│   │   │   │           │   ├── Gender.yml (8 lines, 234 B, ~69 tokens)
│   │   │   │           │   ├── GenderBias.yml (42 lines, 1.3 KB, ~451 tokens)
│   │   │   │           │   ├── GeneralURL.yml (11 lines, 246 B, ~70 tokens)
│   │   │   │           │   ├── GitIsmFlagged.yml (22 lines, 929 B, ~250 tokens)
│   │   │   │           │   ├── GitIsmSubstitutions.yml (17 lines, 527 B, ~151 tokens)
│   │   │   │           │   ├── HeadingAcronyms.yml (7 lines, 237 B, ~72 tokens)
│   │   │   │           │   ├── HeadingColons.yml (8 lines, 182 B, ~57 tokens)
│   │   │   │           │   ├── HeadingPunctuation.yml (13 lines, 270 B, ~82 tokens)
│   │   │   │           │   ├── Headings.yml (42 lines, 590 B, ~162 tokens)
│   │   │   │           │   ├── HyphenLy.yml (10 lines, 419 B, ~116 tokens)
│   │   │   │           │   ├── Hyphens.yml (14 lines, 286 B, ~90 tokens)
│   │   │   │           │   ├── LatinAbbrev.yml (19 lines, 578 B, ~169 tokens)
│   │   │   │           │   ├── LinkText.yml (15 lines, 443 B, ~134 tokens)
│   │   │   │           │   ├── MkDocsAdmonitions.yml (11 lines, 552 B, ~159 tokens)
│   │   │   │           │   ├── MkDocsTabs.yml (12 lines, 516 B, ~156 tokens)
│   │   │   │           │   ├── NativeCode.yml (12 lines, 356 B, ~102 tokens)
│   │   │   │           │   ├── Negative.yml (13 lines, 273 B, ~88 tokens)
│   │   │   │           │   ├── Ordinal.yml (13 lines, 234 B, ~68 tokens)
│   │   │   │           │   ├── OxfordComma.yml (8 lines, 233 B, ~79 tokens)
│   │   │   │           │   ├── Passive.yml (183 lines, 1.9 KB, ~552 tokens)
│   │   │   │           │   ├── Percentages.yml (7 lines, 183 B, ~58 tokens)
│   │   │   │           │   ├── PerforceIsmFlagged.yml (23 lines, 757 B, ~204 tokens)
│   │   │   │           │   ├── PerforceIsmSubstitutions.yml (17 lines, 566 B, ~162 tokens)
│   │   │   │           │   ├── PermissionVerbs.yml (14 lines, 674 B, ~187 tokens)
│   │   │   │           │   ├── Plurals.yml (7 lines, 229 B, ~75 tokens)
│   │   │   │           │   ├── ProductNaming.yml (12 lines, 647 B, ~172 tokens)
│   │   │   │           │   ├── Quotes.yml (7 lines, 219 B, ~67 tokens)
│   │   │   │           │   ├── RangeTime.yml (13 lines, 272 B, ~94 tokens)
│   │   │   │           │   ├── Semicolon.yml (8 lines, 199 B, ~56 tokens)
│   │   │   │           │   ├── SentenceLength.yml (6 lines, 132 B, ~39 tokens)
│   │   │   │           │   ├── Spacing.yml (8 lines, 213 B, ~76 tokens)
│   │   │   │           │   ├── Spelling.yml (27 lines, 1.1 KB, ~388 tokens)
│   │   │   │           │   ├── Suspended.yml (7 lines, 216 B, ~65 tokens)
│   │   │   │           │   ├── Terms.yml (42 lines, 1.1 KB, ~328 tokens)
│   │   │   │           │   ├── URLFormat.yml (9 lines, 284 B, ~82 tokens)
│   │   │   │           │   ├── Units.yml (16 lines, 372 B, ~124 tokens)
│   │   │   │           │   ├── Vocab.yml (25 lines, 381 B, ~110 tokens)
│   │   │   │           │   ├── VsAbbrev.yml (13 lines, 398 B, ~123 tokens)
│   │   │   │           │   ├── We.yml (11 lines, 263 B, ~81 tokens)
│   │   │   │           │   ├── Wordiness.yml (127 lines, 3.6 KB, ~937 tokens)
│   │   │   │           │   └── meta.json (8 lines, 525 B, ~151 tokens)
│   │   │   │           └── config/
│   │   │   │               └── vocabularies/
│   │   │   │                   └── Lore/
│   │   │   │                       └── accept.txt (135 lines, 2.1 KB, ~570 tokens)
│   │   │   └── writing-a-doc.md (105 lines, 7.1 KB, ~2.0k tokens)
│   │   └── internals/
│   │       ├── README.md (19 lines, 1.1 KB, ~304 tokens)
│   │       ├── file-io-engine.md (240 lines, 39.4 KB, ~9.8k tokens)
│   │       ├── parallel-path-staging.md (230 lines, 16.6 KB, ~4.5k tokens)
│   │       └── state-node-architecture.md (247 lines, 41.9 KB, ~10.6k tokens)
│   ├── explanation/
│   │   ├── README.md (18 lines, 876 B, ~228 tokens)
│   │   ├── explanation-template.md (24 lines, 569 B, ~168 tokens)
│   │   └── system-design.md (3120 lines, 187.3 KB, ~46.2k tokens)
│   ├── faq.md (97 lines, 10.9 KB, ~2.6k tokens)
│   ├── glossary.md (412 lines, 17.5 KB, ~4.5k tokens)
│   ├── how-to/
│   │   ├── README.md (23 lines, 1.6 KB, ~441 tokens)
│   │   ├── deploy-local-lore-server.md (349 lines, 10.2 KB, ~3.0k tokens)
│   │   ├── how-to-template.md (43 lines, 691 B, ~219 tokens)
│   │   ├── install-lore-cli.md (191 lines, 5.6 KB, ~1.6k tokens)
│   │   ├── run-a-machine-server-for-containers.md (183 lines, 9.7 KB, ~2.6k tokens)
│   │   ├── run-parallel-instances-over-a-shared-store.md (282 lines, 12.2 KB, ~3.4k tokens)
│   │   ├── use-virtual-clones-on-linux.md (88 lines, 5.0 KB, ~1.4k tokens)
│   │   └── write-view-filters-and-ignore-files.md (297 lines, 13.9 KB, ~4.0k tokens)
│   ├── proposals/
│   │   ├── 2026-04-27-lore-enhancement-proposals.md (131 lines, 14.0 KB, ~3.5k tokens)
│   │   ├── 2026-05-03-modified-file-tracking.md (322 lines, 19.9 KB, ~4.9k tokens)
│   │   ├── 2026-05-14-low-level-revision-api.md (365 lines, 48.8 KB, ~12.0k tokens)
│   │   ├── 2026-06-19-successor-locks-unmergeable-files.md (445 lines, 78.3 KB, ~19.3k tokens)
│   │   ├── 2026-07-24-tokio-runtime-split-and-async-io.md (200 lines, 40.2 KB, ~9.9k tokens)
│   │   ├── 2026-08-02-resolved-storage-operations.md (207 lines, 25.1 KB, ~6.1k tokens)
│   │   ├── 2026-08-03-fragment-metadata-on-the-s3-object.md (736 lines, 47.0 KB, ~11.6k tokens)
│   │   ├── 2026-08-04-unify-store-existence-and-metadata.md (790 lines, 49.8 KB, ~12.4k tokens)
│   │   ├── 2026-08-18-configurable-public-service-mounting.md (320 lines, 14.6 KB, ~3.7k tokens)
│   │   ├── 2026-08-20-oidc-oauth2-authentication.md (1642 lines, 134.2 KB, ~33.8k tokens)
│   │   ├── 2026-09-23-per-line-attribution-audit-api.md (264 lines, 20.9 KB, ~5.2k tokens)
│   │   ├── 2026-10-12-machine-level-lore-server-for-containers.md (451 lines, 73.1 KB, ~19.8k tokens)
│   │   ├── 2026-10-19-instance-move-and-delete.md (504 lines, 37.5 KB, ~9.4k tokens)
│   │   ├── 2026-10-23-low-level-revision-graph-api.md (815 lines, 140.0 KB, ~35.8k tokens)
│   │   ├── 2026-10-29-swfs-through-the-filesystem-provider.md (298 lines, 49.7 KB, ~12.6k tokens)
│   │   ├── 2026-10-31-copy-on-write-instance-clone.md (514 lines, 36.7 KB, ~9.6k tokens)
│   │   ├── 2026-11-03-instance-ignore-rules.md (183 lines, 9.8 KB, ~2.6k tokens)
│   │   ├── 2026-11-03-instance-local-modified-time-records.md (266 lines, 17.6 KB, ~4.6k tokens)
│   │   ├── 2026-11-06-peer-read-fan-out.md (551 lines, 37.9 KB, ~9.8k tokens)
│   │   ├── README.md (129 lines, 8.9 KB, ~2.3k tokens)
│   │   └── lep-template.md (100 lines, 1.7 KB, ~518 tokens)
│   ├── reference/
│   │   ├── README.md (20 lines, 1.2 KB, ~327 tokens)
│   │   ├── lore-cli-commands.md (2775 lines, 88.4 KB, ~25.5k tokens)
│   │   ├── lore-cli-config.md (284 lines, 27.7 KB, ~7.7k tokens)
│   │   ├── lore-server-config.md (819 lines, 118.2 KB, ~28.8k tokens)
│   │   └── reference-template.md (68 lines, 1.4 KB, ~458 tokens)
│   ├── release-notes/
│   │   ├── README.md (56 lines, 3.1 KB, ~806 tokens)
│   │   ├── _template.md (19 lines, 1.0 KB, ~282 tokens)
│   │   ├── a-read-that-follows-another-stores-what-it-caches.md (12 lines, 703 B, ~172 tokens)
│   │   ├── a-write-to-one-store-never-follows-another-stores.md (9 lines, 493 B, ~122 tokens)
│   │   ├── ancestry-walk-fixes.md (35 lines, 2.6 KB, ~647 tokens)
│   │   ├── archive-keys-are-read-only.md (11 lines, 595 B, ~146 tokens)
│   │   ├── auth-file-store-and-payload-cache-settings.md (13 lines, 910 B, ~241 tokens)
│   │   ├── auth-store-choice-and-config-errors.md (14 lines, 987 B, ~257 tokens)
│   │   ├── branch-create-over-pinned-link-commits.md (12 lines, 812 B, ~203 tokens)
│   │   ├── branch-create-reports-invalid-arguments.md (10 lines, 599 B, ~157 tokens)
│   │   ├── branch-name-writes-claim-atomically.md (57 lines, 4.7 KB, ~1.2k tokens)
│   │   ├── case-renames-keep-moves-and-links-once.md (34 lines, 2.9 KB, ~752 tokens)
│   │   ├── client-credentials-scopes.md (10 lines, 520 B, ~130 tokens)
│   │   ├── clone-missing-root-file-not-found.md (7 lines, 344 B, ~95 tokens)
│   │   ├── commit-leaves-out-unstaged-dirty-moves.md (42 lines, 3.7 KB, ~957 tokens)
│   │   ├── composite-store-reads-once.md (7 lines, 249 B, ~63 tokens)
│   │   ├── composite-store-round-robin-read-replicas.md (12 lines, 718 B, ~175 tokens)
│   │   ├── content-endpoints-serve-byte-ranges.md (10 lines, 538 B, ~139 tokens)
│   │   ├── dead-session-not-authenticated.md (11 lines, 623 B, ~157 tokens)
│   │   ├── dynamodb-swaps-read-and-delete.md (9 lines, 435 B, ~112 tokens)
│   │   ├── failed-connections-close.md (8 lines, 385 B, ~97 tokens)
│   │   ├── fast-flush-writes-the-store-index-in-place.md (9 lines, 579 B, ~147 tokens)
│   │   ├── fast-forward-merge-hashes-merged-directories.md (9 lines, 472 B, ~116 tokens)
│   │   ├── file-dependencies-refused-inside-links.md (12 lines, 871 B, ~230 tokens)
│   │   ├── file-metadata-inside-links.md (8 lines, 380 B, ~103 tokens)
│   │   ├── force-stage-walks-directories.md (9 lines, 593 B, ~151 tokens)
│   │   ├── forced-create-keeps-fuse-clones.md (8 lines, 383 B, ~99 tokens)
│   │   ├── forced-dirty-keeps-what-the-view-excludes.md (8 lines, 376 B, ~98 tokens)
│   │   ├── forced-stage-past-the-view-commits.md (34 lines, 2.5 KB, ~644 tokens)
│   │   ├── fuse-same-size-edit-after-switch.md (6 lines, 187 B, ~54 tokens)
│   │   ├── global-config-keeps-unknown-keys.md (7 lines, 304 B, ~80 tokens)
│   │   ├── history-walks-refuse-blobs-that-are-not-states.md (26 lines, 1.9 KB, ~476 tokens)
│   │   ├── instance-clone.md (24 lines, 2.0 KB, ~512 tokens)
│   │   ├── instance-delete-begin-event-drops-dry-run.md (10 lines, 606 B, ~150 tokens)
│   │   ├── instance-delete-frees-the-path-early.md (12 lines, 953 B, ~233 tokens)
│   │   ├── instance-ignore-rules.md (8 lines, 482 B, ~128 tokens)
│   │   ├── instance-local-modified-time-records.md (9 lines, 588 B, ~146 tokens)
│   │   ├── instance-move-creates-missing-parents.md (8 lines, 455 B, ~113 tokens)
│   │   ├── instance-move-refuses-nested-targets.md (8 lines, 407 B, ~102 tokens)
│   │   ├── layer-push-error-names-layer.md (6 lines, 246 B, ~65 tokens)
│   │   ├── link-merge-refuses-local-edits.md (8 lines, 469 B, ~118 tokens)
│   │   ├── link-pushes-run-concurrently-once.md (12 lines, 867 B, ~216 tokens)
│   │   ├── link-update-refuses-local-changes-only.md (7 lines, 300 B, ~76 tokens)
│   │   ├── lock-and-file-info-reach-tracked-ignored-files.md (14 lines, 1.0 KB, ~269 tokens)
│   │   ├── lore-unix-remotes.md (14 lines, 889 B, ~218 tokens)
│   │   ├── merge-and-switch-replace-file-with-folder.md (10 lines, 621 B, ~162 tokens)
│   │   ├── merge-carries-the-removal-of-a-link.md (13 lines, 966 B, ~243 tokens)
│   │   ├── merge-under-a-view-keeps-links-and-type-changes.md (14 lines, 873 B, ~223 tokens)
│   │   ├── merges-keep-mode-changes.md (26 lines, 2.2 KB, ~566 tokens)
│   │   ├── metadata-set-binary-accepts-an-empty-file.md (6 lines, 253 B, ~67 tokens)
│   │   ├── move-keeps-a-local-edit-at-its-source.md (8 lines, 450 B, ~121 tokens)
│   │   ├── moves-marks-and-c-api-calls-keep-trees-consistent.md (66 lines, 5.9 KB, ~1.5k tokens)
│   │   ├── mutable-store-plugins-meet-the-swap-contract.md (13 lines, 768 B, ~197 tokens)
│   │   ├── mutable-stores-remove-zeroed-keys.md (15 lines, 1018 B, ~255 tokens)
│   │   ├── network-threads-follow-storage-connections.md (13 lines, 872 B, ~212 tokens)
│   │   ├── no-crt-for-swfs.md (5 lines, 122 B, ~34 tokens)
│   │   ├── obliterate-content-the-remote-lacks.md (9 lines, 420 B, ~104 tokens)
│   │   ├── obliterate-refuses-paths-inside-links.md (7 lines, 310 B, ~80 tokens)
│   │   ├── only-a-create-restores-an-archived-branch.md (20 lines, 1.4 KB, ~368 tokens)
│   │   ├── purge-keeps-case-variants.md (7 lines, 287 B, ~78 tokens)
│   │   ├── push-events-interleave.md (10 lines, 632 B, ~156 tokens)
│   │   ├── push-fails-on-unreadable-link-list.md (6 lines, 200 B, ~55 tokens)
│   │   ├── quic-request-failures-log-target.md (8 lines, 402 B, ~103 tokens)
│   │   ├── read-only-branch-metadata-from-remote.md (8 lines, 343 B, ~88 tokens)
│   │   ├── refused-case-renames-keep-the-file.md (11 lines, 639 B, ~162 tokens)
│   │   ├── refused-instance-moves-report-invalid-arguments.md (10 lines, 642 B, ~160 tokens)
│   │   ├── refused-storage-requests-report-the-refusal.md (17 lines, 1.1 KB, ~288 tokens)
│   │   ├── refused-sync-releases-repository.md (7 lines, 305 B, ~76 tokens)
│   │   ├── reinclusion-below-a-later-exclusion.md (8 lines, 471 B, ~145 tokens)
│   │   ├── remote-refusal-reaches-the-command.md (36 lines, 3.1 KB, ~798 tokens)
│   │   ├── remote-store-miss-is-not-found.md (6 lines, 211 B, ~56 tokens)
│   │   ├── remote-store-trusts-upstream.md (13 lines, 882 B, ~222 tokens)
│   │   ├── replicated-store-spreads-requests-over-several-connections.md (11 lines, 812 B, ~190 tokens)
│   │   ├── reset-discards-replaced-dirty-add.md (7 lines, 310 B, ~83 tokens)
│   │   ├── reset-refuses-paths-inside-links.md (10 lines, 601 B, ~153 tokens)
│   │   ├── reset-refuses-staged-files-in-links.md (6 lines, 238 B, ~65 tokens)
│   │   ├── resolve-reaches-into-folder-mounted-links.md (16 lines, 1.2 KB, ~301 tokens)
│   │   ├── resolve-refuses-link-mount-type-change.md (14 lines, 1.0 KB, ~266 tokens)
│   │   ├── revision-diff-link-partitions-for-every-caller.md (8 lines, 445 B, ~115 tokens)
│   │   ├── revision-diff-merged-ancestor.md (8 lines, 442 B, ~117 tokens)
│   │   ├── revision-tree-attributes-entries.md (17 lines, 1.1 KB, ~268 tokens)
│   │   ├── revision-tree-fails-on-a-refused-linked-subtree.md (8 lines, 316 B, ~79 tokens)
│   │   ├── scoped-diff-status-enter-links.md (18 lines, 1.3 KB, ~337 tokens)
│   │   ├── separate-token-exchange-issuer-keys.md (10 lines, 546 B, ~137 tokens)
│   │   ├── server-serves-containers-over-sockets.md (18 lines, 1.3 KB, ~320 tokens)
│   │   ├── server-sizes-threads-before-runtime.md (9 lines, 423 B, ~108 tokens)
│   │   ├── server-spreads-eviction-index-writes.md (10 lines, 622 B, ~151 tokens)
│   │   ├── server-upstream-connections.md (8 lines, 342 B, ~87 tokens)
│   │   ├── service-closes-idle-connections.md (8 lines, 388 B, ~101 tokens)
│   │   ├── service-start-without-a-named-executable.md (7 lines, 352 B, ~88 tokens)
│   │   ├── stage-move-refuses-links.md (9 lines, 575 B, ~152 tokens)
│   │   ├── status-after-killed-merge-commit.md (8 lines, 367 B, ~96 tokens)
│   │   ├── swfs-callback-errors-logged.md (6 lines, 226 B, ~60 tokens)
│   │   ├── swfs-keeps-the-content-it-commits.md (11 lines, 722 B, ~177 tokens)
│   │   ├── swfs-refuses-mounts-it-cannot-hold.md (12 lines, 784 B, ~191 tokens)
│   │   ├── swfs-sync-restores-removed-files.md (7 lines, 295 B, ~81 tokens)
│   │   ├── sync-drops-stale-dirty-markers.md (10 lines, 624 B, ~159 tokens)
│   │   ├── unauthenticated-reports-not-authenticated.md (49 lines, 4.0 KB, ~1.0k tokens)
│   │   ├── unstage-discards-replacing-add.md (7 lines, 353 B, ~93 tokens)
│   │   ├── unstage-restores-a-removed-link.md (5 lines, 252 B, ~66 tokens)
│   │   ├── virtual-clone-prefetch-starts-before-its-ignore-file-read.md (7 lines, 267 B, ~71 tokens)
│   │   ├── virtual-clones-always-use-a-shared-store.md (10 lines, 584 B, ~148 tokens)
│   │   └── virtual-clones-on-linux.md (59 lines, 5.5 KB, ~1.4k tokens)
│   ├── release-notes.md (1273 lines, 133.9 KB, ~33.5k tokens)
│   ├── roadmap.md (111 lines, 12.3 KB, ~3.1k tokens)
│   └── tutorials/
│       ├── README.md (18 lines, 1.4 KB, ~370 tokens)
│       ├── getting-started-with-lore-for-unreal-editor.md (187 lines, 7.9 KB, ~2.1k tokens)
│       ├── quickstart.md (503 lines, 16.1 KB, ~4.6k tokens)
│       ├── run-commands-through-the-service.md (226 lines, 8.3 KB, ~2.3k tokens)
│       ├── tutorial-template.md (68 lines, 1.2 KB, ~364 tokens)
│       └── work-in-a-virtual-clone.md (320 lines, 10.8 KB, ~2.9k tokens)
├── net/
│   └── NETWORK-STACK.md (43 lines, 6.8 KB, ~1.8k tokens)
├── packaging/
│   ├── CONTAINERS.md (48 lines, 5.5 KB, ~1.4k tokens)
│   ├── KERNELS.md (62 lines, 10.3 KB, ~2.6k tokens)
│   ├── OURS.md (27 lines, 5.2 KB, ~1.2k tokens)
│   ├── PACKAGE-MANAGERS.md (43 lines, 7.6 KB, ~1.9k tokens)
│   ├── RECOMMENDATION.md (44 lines, 4.1 KB, ~1.2k tokens)
│   └── UNIFIED.md (43 lines, 5.2 KB, ~1.3k tokens)
├── patches/
│   └── series (4 lines, 252 B, ~74 tokens)
├── product/
│   └── UNIFIED-STACK.md (248 lines, 25.5 KB, ~7.8k tokens)
├── profile/
│   ├── CV.md (61 lines, 4.0 KB, ~1.1k tokens)
│   ├── cv.ts (2 lines, 55 B, ~17 tokens)
│   ├── github/
│   │   └── aphrody-dev/
│   │       └── README.md (55 lines, 6.0 KB, ~2.0k tokens)
│   ├── projects.ts (3 lines, 71 B, ~23 tokens)
│   ├── stats.json (33 lines, 1.4 KB, ~479 tokens)
│   └── stats.ts (5 lines, 115 B, ~37 tokens)
├── proofs/
│   ├── ai-os-interop-2026-11-13.md (59 lines, 19.9 KB, ~4.6k tokens)
│   ├── ay-steam-2026-11-13.md (43 lines, 5.1 KB, ~1.4k tokens)
│   ├── fleet-resilience-2026-11-13.md (86 lines, 15.8 KB, ~4.0k tokens)
│   └── sites-2026-11-13/
│       ├── README.md (41 lines, 3.8 KB, ~1.0k tokens)
│       ├── after/
│       │   ├── aphrody.app.lighthouse.html (1 lines, 38 B, ~11 tokens)
│       │   ├── aphrody.app.lighthouse.json (3053 lines, 142.8 KB, ~44.8k tokens)
│       │   ├── aphrody.com.lighthouse.html (1 lines, 38 B, ~11 tokens)
│       │   ├── aphrody.com.lighthouse.json (3144 lines, 146.1 KB, ~45.9k tokens)
│       │   ├── rosegriffon.fr.lighthouse.html (1 lines, 38 B, ~11 tokens)
│       │   ├── rosegriffon.fr.lighthouse.json (3614 lines, 162.6 KB, ~51.4k tokens)
│       │   ├── yolo.aphrody.app.lighthouse.html (1 lines, 38 B, ~11 tokens)
│       │   └── yolo.aphrody.app.lighthouse.json (2746 lines, 132.6 KB, ~41.3k tokens)
│       └── before/
│           ├── aphrody.app.lighthouse.html (1 lines, 38 B, ~11 tokens)
│           ├── aphrody.app.lighthouse.json (3231 lines, 151.1 KB, ~47.7k tokens)
│           ├── aphrody.com.lighthouse.html (1 lines, 38 B, ~11 tokens)
│           ├── aphrody.com.lighthouse.json (3575 lines, 165.5 KB, ~52.8k tokens)
│           ├── cdn.rosegriffon.fr.lighthouse.json (2640 lines, 395.1 KB, ~118.2k tokens)
│           ├── rosegriffon.fr.lighthouse.html (1 lines, 38 B, ~11 tokens)
│           ├── rosegriffon.fr.lighthouse.json (3614 lines, 162.6 KB, ~51.4k tokens)
│           ├── yolo.aphrody.app.lighthouse.html (1 lines, 38 B, ~11 tokens)
│           └── yolo.aphrody.app.lighthouse.json (2775 lines, 133.7 KB, ~41.7k tokens)
├── publish/
│   ├── BLOCKED.md (49 lines, 3.4 KB, ~932 tokens)
│   ├── CRATES.md (50 lines, 6.8 KB, ~2.0k tokens)
│   ├── NPM.md (40 lines, 4.2 KB, ~1.2k tokens)
│   ├── STATUS.md (35 lines, 7.2 KB, ~1.7k tokens)
│   ├── labs-publish-fields.patch (1206 lines, 52.9 KB, ~15.1k tokens)
│   └── src-publish-fields.patch (2080 lines, 82.3 KB, ~24.4k tokens)
├── reference/
│   ├── bun-ffi.md (31 lines, 2.7 KB, ~862 tokens)
│   ├── llvm-toolchain.md (17 lines, 692 B, ~208 tokens)
│   └── tree-sitter.md (36 lines, 2.6 KB, ~826 tokens)
├── replica/
│   ├── ARCHITECTURE.md (131 lines, 20.1 KB, ~5.3k tokens)
│   ├── FEATURE-MATRIX.md (100 lines, 17.7 KB, ~3.9k tokens)
│   ├── MIGRATION.md (34 lines, 4.7 KB, ~1.4k tokens)
│   └── recon/
│       ├── cloudflare.md (429 lines, 81.3 KB, ~18.5k tokens)
│       ├── estate.md (150 lines, 36.6 KB, ~9.5k tokens)
│       ├── google.md (127 lines, 24.8 KB, ~5.5k tokens)
│       └── vercel.md (186 lines, 25.2 KB, ~6.7k tokens)
├── research/
│   ├── EDITORS-AGENTS-MATRIX.md (98 lines, 9.2 KB, ~2.6k tokens)
│   ├── RUST_6_ORGS_FUSION_INVENTORY.md (661 lines, 299.1 KB, ~63.7k tokens)
│   ├── VERCEL_CHROMIUM_BUN_TAILWIND_SHADCN_NEXT_RUST_BLUEPRINT.md (289 lines, 84.3 KB, ~22.6k tokens)
│   ├── bun-v1-4-4-full-rust-architecture-bun-serve-bun-sql-bun-sqlite-bun-ffi-w.md (133 lines, 19.7 KB, ~5.4k tokens)
│   ├── dioxus-blitz-stylo-taffy-vello-parley-kurbo-wgpu-gpui-gpui-component-ser.md (117 lines, 18.7 KB, ~5.1k tokens)
│   ├── editors-agents.json (750 lines, 18.0 KB, ~6.8k tokens)
│   └── linux-7-4-kernel-releases-git-architecture-and-distribution-packaging.md (90 lines, 11.3 KB, ~3.1k tokens)
├── reviews/
│   ├── CHECKLISTS.md (136 lines, 23.4 KB, ~6.8k tokens)
│   ├── INDEX.md (42 lines, 24.2 KB, ~5.8k tokens)
│   ├── PROOF-2026-11-13.md (39 lines, 5.4 KB, ~1.5k tokens)
│   ├── README.md (52 lines, 6.0 KB, ~1.6k tokens)
│   ├── auto/
│   │   ├── 06aff7834491.md (78 lines, 10.8 KB, ~3.0k tokens)
│   │   ├── 093a2f97653d.md (92 lines, 7.7 KB, ~2.3k tokens)
│   │   ├── 09892760e727.md (39 lines, 1.9 KB, ~524 tokens)
│   │   ├── 0b9de8b32c2e.md (32 lines, 4.8 KB, ~1.3k tokens)
│   │   ├── 0e860f7a33e1.md (77 lines, 6.4 KB, ~1.8k tokens)
│   │   ├── 106a36256fd7.md (44 lines, 3.4 KB, ~909 tokens)
│   │   ├── 1379528b95a5.md (31 lines, 3.1 KB, ~839 tokens)
│   │   ├── 1854fb001f82.md (84 lines, 7.2 KB, ~2.0k tokens)
│   │   ├── 1874960433c0.md (21 lines, 2.7 KB, ~711 tokens)
│   │   ├── 2449640b2896.md (67 lines, 5.1 KB, ~1.4k tokens)
│   │   ├── 28f5e1d5ce24.md (42 lines, 3.9 KB, ~1.1k tokens)
│   │   ├── 2b1a28fe4a44.md (40 lines, 3.0 KB, ~834 tokens)
│   │   ├── 2ca6e06292b5.md (28 lines, 2.3 KB, ~643 tokens)
│   │   ├── 2cf0fc9b2470.md (38 lines, 5.3 KB, ~1.5k tokens)
│   │   ├── 315061860114.md (76 lines, 6.1 KB, ~1.7k tokens)
│   │   ├── 332fe1f835d2.md (30 lines, 3.9 KB, ~1.0k tokens)
│   │   ├── 335691ee5f7c.md (55 lines, 3.3 KB, ~882 tokens)
│   │   ├── 33bd92cb6a36.md (49 lines, 4.5 KB, ~1.2k tokens)
│   │   ├── 399e66e79037.md (36 lines, 2.9 KB, ~831 tokens)
│   │   ├── 3a8fe5145c83.md (127 lines, 9.6 KB, ~2.7k tokens)
│   │   ├── 3f9b37ba8618.md (72 lines, 5.8 KB, ~1.6k tokens)
│   │   ├── 4d8457aa1cec.md (32 lines, 3.3 KB, ~935 tokens)
│   │   ├── 4fa51945a406.md (40 lines, 5.9 KB, ~1.6k tokens)
│   │   ├── 4ffaff662d65.md (36 lines, 2.9 KB, ~781 tokens)
│   │   ├── 556419dd18a4.md (34 lines, 4.2 KB, ~1.1k tokens)
│   │   ├── 57a7ba24017c.md (21 lines, 3.1 KB, ~837 tokens)
│   │   ├── 5b45924f5126.md (83 lines, 7.3 KB, ~2.1k tokens)
│   │   ├── 60c30389aab6.md (56 lines, 3.3 KB, ~901 tokens)
│   │   ├── 62debc1249b3.md (61 lines, 7.4 KB, ~2.1k tokens)
│   │   ├── 6797a38b56a8.md (80 lines, 5.4 KB, ~1.4k tokens)
│   │   ├── 67a1bda996ef.md (33 lines, 4.5 KB, ~1.2k tokens)
│   │   ├── 6a4719b79657.md (84 lines, 7.0 KB, ~1.9k tokens)
│   │   ├── 6fbba4e35805.md (94 lines, 6.9 KB, ~1.9k tokens)
│   │   ├── 7ca2c693e6a0.md (18 lines, 2.5 KB, ~687 tokens)
│   │   ├── 7edbc4175f3a.md (26 lines, 4.0 KB, ~1.1k tokens)
│   │   ├── 81af97da6204.md (24 lines, 2.2 KB, ~611 tokens)
│   │   ├── 82e46253668b.md (53 lines, 5.4 KB, ~1.4k tokens)
│   │   ├── 8a56fe8bd140.md (32 lines, 5.1 KB, ~1.3k tokens)
│   │   ├── 8af39010dba4.md (26 lines, 3.9 KB, ~1.0k tokens)
│   │   ├── 9494bfe15b1c.md (46 lines, 4.6 KB, ~1.3k tokens)
│   │   ├── 96ba165ced58.md (70 lines, 7.4 KB, ~2.1k tokens)
│   │   ├── 97724e263a6a.md (18 lines, 2.7 KB, ~737 tokens)
│   │   ├── 9c7b2809ec2e.md (46 lines, 5.0 KB, ~1.4k tokens)
│   │   ├── 9d048e7cd01f.md (20 lines, 2.4 KB, ~647 tokens)
│   │   ├── 9f5240b8f1f6.md (115 lines, 7.6 KB, ~2.1k tokens)
│   │   ├── a4ee6cb0aac9.md (22 lines, 4.6 KB, ~1.3k tokens)
│   │   ├── a63bc29b674a.md (35 lines, 5.1 KB, ~1.5k tokens)
│   │   ├── aa7134dc7307.md (26 lines, 1.8 KB, ~493 tokens)
│   │   ├── aa7536e7eaa4.md (27 lines, 2.2 KB, ~615 tokens)
│   │   ├── ac64808ad2b3.md (47 lines, 4.6 KB, ~1.2k tokens)
│   │   ├── ad0eca921e22.md (54 lines, 4.1 KB, ~1.1k tokens)
│   │   ├── ad4e511a154a.md (25 lines, 4.3 KB, ~1.1k tokens)
│   │   ├── ae7bde973904.md (107 lines, 8.0 KB, ~2.1k tokens)
│   │   ├── b20c410dc9c9.md (69 lines, 5.1 KB, ~1.5k tokens)
│   │   ├── b2d86ae0dc90.md (26 lines, 4.0 KB, ~1.1k tokens)
│   │   ├── b6deca793b28.md (51 lines, 4.9 KB, ~1.3k tokens)
│   │   ├── b9b49b2deadd.md (29 lines, 2.8 KB, ~740 tokens)
│   │   ├── bc693de2c321.md (39 lines, 3.7 KB, ~965 tokens)
│   │   ├── be625f9405e7.md (25 lines, 3.4 KB, ~949 tokens)
│   │   ├── c7bb9bf228bd.md (20 lines, 2.7 KB, ~738 tokens)
│   │   ├── c82942abbac2.md (37 lines, 3.1 KB, ~870 tokens)
│   │   ├── c8d7c8bf9698.md (31 lines, 3.8 KB, ~994 tokens)
│   │   ├── d158d27aefe1.md (39 lines, 5.7 KB, ~1.6k tokens)
│   │   ├── d48af2ba9da7.md (38 lines, 2.6 KB, ~697 tokens)
│   │   ├── d72fb9f13347.md (64 lines, 4.6 KB, ~1.3k tokens)
│   │   ├── dece87e0dadc.md (29 lines, 3.0 KB, ~799 tokens)
│   │   ├── e13ccbc6d3b9.md (30 lines, 4.4 KB, ~1.1k tokens)
│   │   ├── e8ae3a2b7e6f.md (29 lines, 5.6 KB, ~1.5k tokens)
│   │   ├── ea2364169f01.md (23 lines, 1.8 KB, ~463 tokens)
│   │   ├── eb824acd854f.md (84 lines, 6.0 KB, ~1.7k tokens)
│   │   ├── f0b5fdd691af.md (31 lines, 3.3 KB, ~882 tokens)
│   │   ├── f21e7927b2f8.md (43 lines, 3.2 KB, ~922 tokens)
│   │   ├── f2c17b18d409.md (103 lines, 9.6 KB, ~2.7k tokens)
│   │   ├── f71400f79e99.md (76 lines, 7.9 KB, ~2.2k tokens)
│   │   ├── f88eb7e0dd95.md (85 lines, 6.0 KB, ~1.7k tokens)
│   │   └── f8cd391dcea6.md (51 lines, 4.2 KB, ~1.1k tokens)
│   ├── claude-2026-11-13-ai-os-review-t2.md (39 lines, 9.7 KB, ~2.5k tokens)
│   ├── claude-2026-11-13-ai-os-review.md (52 lines, 18.8 KB, ~4.6k tokens)
│   ├── consistency-2026-11-13.md (58 lines, 14.1 KB, ~3.1k tokens)
│   ├── facts-2026-11-13.md (138 lines, 54.4 KB, ~11.8k tokens)
│   ├── gemini-2026-11-12-agent-architecture-fusion.md (365 lines, 26.1 KB, ~7.0k tokens)
│   ├── gemini-2026-11-12-agent-context-ts.md (578 lines, 26.5 KB, ~7.9k tokens)
│   ├── gemini-2026-11-12-architecture-root.md (158 lines, 12.4 KB, ~3.4k tokens)
│   ├── gemini-2026-11-12-cloudflare-one.md (159 lines, 10.5 KB, ~2.8k tokens)
│   ├── gemini-2026-11-12-ecosystem-toml.md (189 lines, 9.9 KB, ~2.8k tokens)
│   ├── gemini-2026-11-12-editors-agents-matrix.md (153 lines, 11.7 KB, ~3.2k tokens)
│   ├── gemini-2026-11-12-philosophy-architecture.md (66 lines, 10.5 KB, ~2.7k tokens)
│   ├── gemini-2026-11-12-targets.md (178 lines, 17.7 KB, ~4.9k tokens)
│   ├── gemini-2026-11-13-agent-first.md (17 lines, 6.9 KB, ~1.7k tokens)
│   ├── gemini-2026-11-13-ai-os-review-t2.md (50 lines, 13.6 KB, ~3.4k tokens)
│   ├── gemini-2026-11-13-ai-os-review.md (55 lines, 19.5 KB, ~4.7k tokens)
│   ├── gemini-2026-11-13-ai-os.md (239 lines, 20.2 KB, ~5.4k tokens)
│   ├── gemini-2026-11-13-anonymat.md (79 lines, 9.5 KB, ~2.4k tokens)
│   ├── gemini-2026-11-13-aphrody-app-runtime.md (33 lines, 3.9 KB, ~998 tokens)
│   ├── gemini-2026-11-13-aphrody-app.md (18 lines, 3.5 KB, ~814 tokens)
│   ├── gemini-2026-11-13-aphrody-nhitl.md (36 lines, 7.9 KB, ~1.9k tokens)
│   ├── gemini-2026-11-13-aphrody-ui.md (20 lines, 4.8 KB, ~1.1k tokens)
│   ├── gemini-2026-11-13-ay-migration.md (17 lines, 3.9 KB, ~939 tokens)
│   ├── gemini-2026-11-13-brand.md (30 lines, 5.5 KB, ~1.3k tokens)
│   ├── gemini-2026-11-13-epic-resources.md (3 lines, 387 B, ~96 tokens)
│   ├── gemini-2026-11-13-fleet-resilience.md (16 lines, 3.6 KB, ~961 tokens)
│   ├── gemini-2026-11-13-fr2-cloudflare.md (221 lines, 21.0 KB, ~5.4k tokens)
│   ├── gemini-2026-11-13-gaming.md (17 lines, 1.9 KB, ~495 tokens)
│   ├── gemini-2026-11-13-github-app.md (106 lines, 39.0 KB, ~8.3k tokens)
│   ├── gemini-2026-11-13-google-labs.md (20 lines, 1.6 KB, ~443 tokens)
│   ├── gemini-2026-11-13-media-stack.md (3 lines, 344 B, ~88 tokens)
│   ├── gemini-2026-11-13-merge.md (77 lines, 8.4 KB, ~2.2k tokens)
│   ├── gemini-2026-11-13-nhitl.md (9 lines, 1.6 KB, ~460 tokens)
│   ├── gemini-2026-11-13-npm-publish.md (19 lines, 3.2 KB, ~768 tokens)
│   ├── gemini-2026-11-13-orch.md (38 lines, 9.4 KB, ~2.1k tokens)
│   ├── gemini-2026-11-13-relay-oauth.md (30 lines, 6.0 KB, ~1.4k tokens)
│   ├── gemini-2026-11-13-root-identity.md (44 lines, 6.2 KB, ~1.6k tokens)
│   ├── gemini-2026-11-13-terminal.md (22 lines, 4.9 KB, ~1.1k tokens)
│   ├── gemini-2026-11-13-ui-system.md (26 lines, 4.8 KB, ~1.1k tokens)
│   ├── gemini-2026-11-13-unixwin.md (23 lines, 6.3 KB, ~1.4k tokens)
│   ├── gemini-2026-11-13-upstream-stack.md (23 lines, 3.8 KB, ~931 tokens)
│   ├── gemini-2026-11-13-upstream.md (15 lines, 1.4 KB, ~380 tokens)
│   ├── gemini-2026-11-13-versioning.md (51 lines, 8.6 KB, ~2.1k tokens)
│   ├── judge-2026-11-13-ai-os-review-t2.md (72 lines, 17.9 KB, ~4.3k tokens)
│   ├── judge-2026-11-13-ai-os-review.md (96 lines, 24.0 KB, ~5.4k tokens)
│   ├── judge-2026-11-13-aphrody-nhitl.md (13 lines, 8.2 KB, ~2.1k tokens)
│   ├── judge-2026-11-13-apps-aphrody.md (16 lines, 6.5 KB, ~1.7k tokens)
│   ├── judge-2026-11-13-chromium-bun.md (16 lines, 7.2 KB, ~1.9k tokens)
│   ├── judge-2026-11-13-ci.md (15 lines, 6.0 KB, ~1.6k tokens)
│   ├── judge-2026-11-13-env-kit.md (15 lines, 6.2 KB, ~1.7k tokens)
│   ├── judge-2026-11-13-justfile.md (14 lines, 6.0 KB, ~1.7k tokens)
│   ├── linux-2026-11-13-gemini.md (37 lines, 6.7 KB, ~1.7k tokens)
│   ├── proof/
│   │   ├── ay-doctor.txt (24 lines, 1.1 KB, ~337 tokens)
│   │   ├── gamescope-info.txt (59 lines, 1.9 KB, ~604 tokens)
│   │   └── matrix.json (541 lines, 14.1 KB, ~5.4k tokens)
│   ├── ui-ecosystem-2026-11-13-gemini.md (21 lines, 1.6 KB, ~440 tokens)
│   ├── ui-skills-absorb-2026-11-13-gemini.md (30 lines, 3.0 KB, ~811 tokens)
│   └── vault-2026-11-13-gemini.md (185 lines, 24.9 KB, ~6.4k tokens)
├── shell/
│   ├── CLAUDE-NT.md (68 lines, 9.2 KB, ~2.4k tokens)
│   ├── INDEX.md (42 lines, 7.4 KB, ~1.7k tokens)
│   ├── MATRIX.md (115 lines, 20.0 KB, ~5.4k tokens)
│   ├── PLAN.md (60 lines, 7.4 KB, ~1.9k tokens)
│   ├── ROADMAP.md (14 lines, 2.9 KB, ~766 tokens)
│   ├── SETUP.md (74 lines, 11.7 KB, ~3.2k tokens)
│   ├── bash-setup.md (67 lines, 15.5 KB, ~3.8k tokens)
│   ├── ecosystem-links.md (17 lines, 3.2 KB, ~824 tokens)
│   ├── modern-shells.md (67 lines, 13.0 KB, ~3.0k tokens)
│   ├── oils-windows.md (90 lines, 11.2 KB, ~3.2k tokens)
│   ├── posix-family.md (54 lines, 22.1 KB, ~5.1k tokens)
│   ├── pwsh-setup.md (73 lines, 17.1 KB, ~4.2k tokens)
│   ├── rust-bash-reimpl.md (81 lines, 12.2 KB, ~2.8k tokens)
│   ├── startup-bash.json (3845 lines, 106.5 KB, ~36.7k tokens)
│   ├── startup-linux.json (226 lines, 6.9 KB, ~2.5k tokens)
│   ├── startup.json (1190 lines, 32.0 KB, ~11.2k tokens)
│   ├── userland.md (74 lines, 8.9 KB, ~2.5k tokens)
│   ├── vectors.json (421 lines, 13.3 KB, ~4.8k tokens)
│   └── windows-native.md (109 lines, 23.7 KB, ~5.9k tokens)
├── specs/
│   └── APHRODY_DESIGN_CAHIER_DES_CHARGES.md (94 lines, 9.0 KB, ~2.8k tokens)
├── terminal/
│   └── ARCHITECTURE.md (66 lines, 8.9 KB, ~2.4k tokens)
├── tooling/
│   └── AI-TOOLING-AUDIT.md (56 lines, 20.0 KB, ~3.9k tokens)
├── tv/
│   ├── enquete-rust-c-gcc-llvm-ffmpeg.mdx (93 lines, 7.8 KB, ~2.2k tokens)
│   ├── environnement.mdx (42 lines, 3.2 KB, ~832 tokens)
│   ├── ffmpeg-analyse.mdx (121 lines, 6.9 KB, ~1.9k tokens)
│   ├── plan-ecosysteme-c-rust.mdx (163 lines, 21.1 KB, ~4.9k tokens)
│   └── remplacant-ffmpeg-rust.mdx (120 lines, 16.7 KB, ~4.0k tokens)
├── ui/
│   ├── ECOSYSTEM-AUDIT.md (109 lines, 37.5 KB, ~8.5k tokens)
│   ├── IMMERSIVE.md (15 lines, 1.9 KB, ~501 tokens)
│   ├── INVENTORY.md (110 lines, 30.3 KB, ~7.0k tokens)
│   └── STACK.md (105 lines, 24.2 KB, ~6.4k tokens)
├── unixwin/
│   ├── BUILD.md (37 lines, 5.0 KB, ~1.3k tokens)
│   ├── DEDUP.md (31 lines, 15.7 KB, ~3.4k tokens)
│   ├── DEPS.md (31 lines, 9.4 KB, ~2.3k tokens)
│   ├── LEARNINGS.md (65 lines, 14.3 KB, ~3.8k tokens)
│   ├── README.md (43 lines, 7.2 KB, ~1.8k tokens)
│   └── SITE.md (90 lines, 10.3 KB, ~2.9k tokens)
└── upstream/
    └── STRATEGY.md (116 lines, 18.7 KB, ~5.0k tokens)
```

## Source Files

================================================
FILE: ARCHITECTURE.md
================================================

# Architecture de src

Document de référence unique. Remplace `docs/ROOT-ARCHITECTURE.md` et `docs/CORE.md` (fusionnés ici, 2026-11-12). Les principes et leurs sources sont dans [PHILOSOPHY.md](PHILOSOPHY.md). L'architecture interne de l'IA reste dans `packages/ai-os/docs/ARCHITECTURE.md` (paquet `@aphrody/ai-os`, fusionné à plat depuis aphrody-labs/agent le 2026-11-13) et se range entièrement en L4/L5 ci-dessous.

## 1. Modèle en couches

Inspiré de NT (HAL sous l'Executive, sous les sous-systèmes) et des components Chromium (base en bas, embedders en haut).

| Couche        | Rôle (analogue)                                                                    | Contenu actuel                                                                                                                                                                                                                                                                                                                                                                                                     |
| ------------- | ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| L0 toolchain  | compilateurs, pins (LLVM partagé, rustc nightly, bun 1.4.4)                        | `rust-toolchain.toml`, `tools/`, `third_party/` (hors graphe first-party)                                                                                                                                                                                                                                                                                                                                          |
| L1 base       | `//base` : primitives portables, sans `cfg(target_os)` ni windows-rs, sans service | `crates/core`, `depot-core`, `depot-cas`, `lore-base`, `lore-io`, `lore-error-set(-macro)`, `lore-macro`, `aphrody-design-shared`, `aphrody-design-tokens`, `gamescope-core`, `tv-core`, `tv-i18n`                                                                                                                                                                                                                 |
| L2 plateforme | HAL : Windows, Linux, Cloudflare, Vercel, réseau, C ABI de base                    | `sys`, `net`, `core-capi`, `dx12-hal` (D3D12, DirectComposition, C ABI `dx12_hal_*`), `unix-*`, `remote`, `lore-credential`, `lore-fuse`, `steam-depot`, `gamescope-wgsl`, `smithay-wayland-wire`, `hypr-tiler`, `cosmic-compat`, `tv-ffmpeg` (FFmpeg libav* en liaison dynamique) ; `packages/core` (bun:ffi sur core-capi), `ffi-bridge` (bun:ffi sur dx12-hal), `net`, `machine`, `runtime-adapter` ; `infra/*` |
| L3 services   | Executive : VCS, build, design, web                                                | `crates/*` par défaut : `lore*` (stockage, révision, transport, serveur, backends aws/hashicorp), `depot-*` (gclient, cipd, vpython, re, graph...), `xtask`, `up`, `rt`, `archguard`, `corelib`, `factory`, `conformance`, `bench`, `next`, `react`, `ui`, design ; C ABI de services `ffi`, `lore-capi` ; `packages/*` par défaut                                                                                 |
| L4 agent      | sous-système agent                                                                 | `packages/ai-os` (core, llm, relay, research, gateway, tui ; ses sous-dossiers sont des sous-couches), `crates/agent-context`, `crates/agent-py`, `crates/ring3-agent`, `plugins/`                                                                                                                                                                                                                                 |
| L5 surfaces   | embedders (`//chrome`)                                                             | CLIs : `ay` (dont `ay conformance`, ex-`aphrody-cli`), `depot-cli`, `lore-client`, `gamescope-cli`, `wslg-cli`, `tv-cli` ; `ai-os` (CLI `src/cli.ts`, gateway, tui) ; `apps/*` (dont `apps/nt`)                                                                                                                                                                                                                    |

La liste exacte vient de `just checkdeps --graph` ; ce tableau est un résumé.

## 2. Directions autorisées (appliquées)

- Vers le bas : toujours permis.
- Latéral (même couche) : permis, cycles interdits.
- Vers le haut : interdit. Seul `!chemin` (dette ticketée, avertissement) le tolère ; `+chemin` ne sert qu'à relever un `-` plus large et ne franchit jamais une couche vers le haut.
- `-chemin` interdit une arête même descendante.
- Unité sans couche : erreur.
- Les cycles sont cherchés sur tout le graphe (toutes couches) ; un cycle n'est rétrogradé en avertissement que si l'une de ses arêtes porte un `!`.
- Les `[dev-dependencies]` (tests, benches) sont exemptées ; `[dependencies]` et `[build-dependencies]` comptent.

Placement des C ABI : une C ABI de base va en L2 (frontière plateforme : `core-capi`, et `packages/core` qui la charge) ; une C ABI de service reste dans la couche du service exposé (`ffi`, `lore-capi` en L3), donc utilisable par L4. L5 est réservé aux binaires et surfaces finales.

Arêtes invisibles dans les manifestes (bun:ffi `dlopen`, pyo3) : déclarées par `use chemin` dans le `DEPS.rules` du consommateur (`packages/core` : `use crates/core-capi`) ; elles entrent dans les couches, les cycles et `just affected`.

Mise en application :

- `DEPS.rules` par répertoire (`layer = N`, `+`, `!`, `-`, `use`), hérité vers le bas ; format maison adapté de `buildtools/checkdeps` de Chromium (préfixes et héritage repris, `layer` et `use` ajoutés). Les lignes `sous/dossier: directive` d'un parent couvrent les sous-modules où src n'écrit pas (`agent/`, `apps/*` ; règles dans `/DEPS.rules`).
- Arêtes lues dans les manifestes : dépendances `path` / `workspace = true` de Cargo, `@aphrody/*` / `workspace:` / `file:` de package.json.
- Gate : `bun scripts/checkdeps.ts` (`just checkdeps`, étape CI « Layered dependency gate », inclus dans `just check`). Archguard ARCH-017 garde les frontières de domaine (voir checkdeps-002).
- Propriété : `MAINTAINERS` (format kernel, M: = agent ou skill propriétaire), `just maintainer <chemin>`.

## 3. Graphe de tâches

Choix : `just` + bun workspaces + cargo, sans turbo (raisons : PHILOSOPHY.md §6).

- `just affected [ref]` : unités modifiées depuis `ref` plus dépendants transitifs (équivalent de `turbo --filter=...[ref]`).
- `just test-affected [ref]` : `cargo test -p` sur les crates touchées, `bun test` sur les packages touchés, `uv run pytest` sur les unités Python touchées. Les `apps/*` gardent leurs propres gates (`apps/nt` : .NET 11 / C++23 dans `.github/workflows/nt.yml`, déclenché par ses chemins) ; test-affected ne les relance pas.
- `just check` : `bun fmt --check`, `cargo fmt --check`, `bun check -b` (typecheck TS), checkdeps, archguard. La compilation (`cargo check`/`cargo test`) tourne en CI sur runner, pas sur le poste (règle : pas de build local).
- Cache : sccache local pour cargo. Cache distant R2 : taskgraph-001.

## 4. Racine du dépôt

```
Cargo.toml Cargo.lock   un seul workspace ; [workspace.dependencies] = une version par crate
package.json bun.lock   workspaces bun
rust-toolchain.toml     nightly épinglée ; tools.toml : pins des binaires L0 (`ay up`)
deny.toml               politique cargo-deny (licences, bans, sources ; §11)
identity.toml           identité du produit, source unique (§6) ; marque aussi la racine
src.lock.json           seul pin des dépôts externes ; DEPS et .gitmodules en sont dérivés (pin-001)
DEPS .gitmodules        dérivés (`ay manifests`, gate `ay manifests --check`), jamais édités à la main
DEPS.rules              racine des règles de couches (checkdeps)
dist-workspace.toml     configuration cargo-dist (lue à la racine du workspace par dist)
justfile                point d'entrée unique
MAINTAINERS             propriétaires par sous-système (format kernel, édité à la main)
README.md AGENTS.md CLAUDE.md GEMINI.md LICENSE-* .env.example .gitignore .gitattributes .graphifyignore
.github/ .cargo/ .agents/ .claude/
crates/ packages/ apps/ third_party/ infra/ tools/ docs/ scripts/ conformance/ licenses/ plugins/
```

Rangés le 2026-11-13 : `deploy.toml` -> `infra/deploy.toml` (flotte, hébergement, auth) ; `cloudbuild.yaml` -> `infra/gcloud/` ; `.gitlab-ci.yml` -> `infra/gitlab/gitlab-ci.yml` (chemin à déclarer côté GitLab, infra/gitlab/README.md) ; `flake.nix` -> `infra/nix/` ; `install.ps1`/`install.sh` -> `scripts/` (amorce de dix lignes vers `ay up --bootstrap`) ; `deploy.ps1`/`deploy.sh` supprimés (doublons de `just deploy` = `ay deploy`) ; `.repo/` supprimé (manifeste `repo` jamais consommé). Dockerfile, compose.yaml et .dockerignore -> `infra/docker/` (Dockerfile.dockerignore, docker-bake.hcl ; agent conteneurs). Locaux et ignorés, jamais suivis : `.env`, `var/`, `graphify-out/`, `target/`, `node_modules/`. CI de référence : `.github/workflows` ; GitLab et Cloud Build sont des miroirs optionnels.

`apps/` et `third_party/` sont exclus du workspace Cargo (`[workspace] exclude`). `apps/` = produits déployables, sous-modules épinglés par DEPS (rosegriffon, shenron, r2b, auto) ou arbres fusionnés (`apps/nt`, ex-`aphrody-labs/nt`, CI `.github/workflows/nt.yml`), avec leurs propres gates : checkdeps n'inspecte que leur unité racine, pas leur intérieur. `third_party/` = upstream, une copie par projet, verrouillée dans `src.lock.json`, sans patch local : un correctif vit dans un fork `aphrody-labs` épinglé par commit (§11).

## 5. Bibliothèque commune (core)

| Pilier      | Où                                    | Rôle                                                                                                                                                                          |
| ----------- | ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| tree-sitter | `crates/core` (`aphrody-core`, L1)    | parse multi-langage, symboles/appels/imports, requêtes, index, BLAKE3                                                                                                         |
| LLVM        | `crates/core-capi` (cdylib, L2)       | C ABI `core_*`, construite en release avec rustc + clang sur le LLVM partagé ; la LTO inter-langages s'arrête à la cdylib (Rust + C de tree-sitter), jamais à travers bun:ffi |
| bun:ffi     | `packages/core` (`@aphrody/core`, L2) | `dlopen` typé, `CString` + `core_free`, `JSCallback`, store `bun:sqlite`                                                                                                      |

C ABI (`core_abi_version() == 1`) : `core_free`, `core_languages`, `core_parse_json`, `core_query_json`, `core_blake3_hex`, `core_index_json`, `core_index_each`. Sorties JSON, erreurs `{"error": ...}`. En-tête : `cbindgen --config crates/core-capi/cbindgen.toml crates/core-capi -o crates/core-capi/include/aphrody_core.h`. On ajoute des symboles sans en casser ; un changement incompatible incrémente `core_abi_version`. `@aphrody/core` ouvre la bibliothèque en deux temps : résoudre `core_abi_version` seul, refuser si la version diffère, puis seulement lier le reste de la table (TICKET abi-001 si ce n'est pas encore le cas).

Ce que `crates/core` n'est pas : `crates/corelib` (`aphrody-corelib`, L3 depuis le 2026-11-13 : il tire wgpu et sert des produits, donc ni L1 ni L2) n'est pas une seconde bibliothèque commune mais le support des produits shenron/rosegriffon (GPU wgpu, formats RE CRI/UTF/AOB, horloge d'émulation, formats Epic, format Boq, filtrage réseau). Ses parties génériques sont des enveloppes de bibliothèques amont : le filtrage réseau passe par `adblock` (Brave adblock-rust 0.13.5, MPL-2.0) depuis le 2026-11-13, le moteur maison est supprimé. Aucune fonction n'existe dans les deux crates ; `crates/ffi` (C ABI de services, L3) expose `corelib::web`.

Distribution : `dlopen` ne charge pas une bibliothèque depuis la mémoire d'un exécutable `bun build --compile` ; la cdylib est donc livrée à côté du binaire ou extraite vers un cache disque vérifié par BLAKE3 (pas de `/tmp` noexec). Le binaire `ay` (Rust) lie `crates/core` statiquement et n'a pas ce problème.

Grammaires : 13 avec extracteur dédié ; les autres découvertes par `crates/core/build.rs` (`third_party/ECOSYSTEM.toml` ou `third_party/tree-sitter-*`, symboles `aphrody_grammar_<nom>*`). `APHRODY_GRAMMARS=0` désactive. Index : `bun packages/core/src/cli.ts index [root]` vers `var/index/core.db` (cible : `XDG_CACHE_HOME` / `%LOCALAPPDATA%`, var/ devant quitter la racine). Les préfixes `aphrody_*`/`APHRODY_*` des symboles C et variables sont des noms figés hors `just identity apply` : TICKET identity-001 (les neutraliser en `core_*`/`SRC_*`).

## 6. Identité renommable et multiplateforme

- Une source : `identity.toml` (product, cli, naming : scope npm et préfixes, orgs, domains, products.*). `just identity apply` (`bun scripts/identity.ts apply`) réécrit les champs copiés (Cargo.toml `[workspace.package]`, nom et `[[bin]]` de crates/ay, `package.json#name` et clés `@scope/` des dépendances) ; `just identity check` garde `just check` et la CI. Lecteurs directs : crates/xtask (vars DEPS), packages/forge (valeurs par défaut des forges), tout paquet via `import identity from "<racine>/identity.toml"`. Les configurations d'hôte (nginx, mail, DNS) restent littérales : elles décrivent l'état déployé.
- Aucun nom de produit ni chemin absolu en dur : `env!("CARGO_PKG_NAME")`, racine détectée par `identity.toml` (ARCHITECTURE-ROOT.md invariant 6) ou `SRC_ROOT`, `XDG_*`, `%LOCALAPPDATA%`.
- Chaque binaire compile et teste sur windows-msvc et linux-gnu ; scripts .sh/.ps1 remplacés par des recettes just. Exceptions par nature, en `cfg(windows)` : `dx12-hal` (D3D12, DirectComposition ; vide sur Linux) et l'hôte `wslg-cli` (DispatcherQueue WinUI 3 dans `wslg_cli::host` ; sur Linux, les binaires sortent en erreur). `smithay-wayland-wire` et `cosmic-compat` compilent et testent sur Linux ; seuls le transport Hyper-V et le mappage D3D12 des dmabufs sont `cfg(windows)`. dx12-001 soldé le 2026-11-13.

## 7. Règles de fusion (sans régression)

1. Geler : snapshot Lore + commit ; compter les tests des deux côtés.
2. Workspace unique, une version par dépendance.
3. Déplacer crate par crate, test après chaque déplacement, `just checkdeps` vert à chaque commit.
4. Vendor et lockfiles uniques.
5. Mêmes nombres de tests ou plus.

## 8. Dette connue (tickets)

| Ticket        | Constat                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | Correction                                                                                                                                                                                       |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| checkdeps-001 | soldé le 2026-11-13 : l'entrée CLI est `packages/ai-os/src/cli.ts`, hors de `src/core` ; ai-os est une seule unité L4                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | —                                                                                                                                                                                                |
| checkdeps-002 | ARCH-017 d'archguard double checkdeps pour les couches mais porte aussi les frontières de domaine                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | traduire ces frontières en règles `-` (ex. L3 services système sans `dx12-hal`/`steam-depot`, agent sans `next`/`react`) avant de retirer ARCH-017 et d'appeler checkdeps depuis `ay arch check` |
| checkdeps-003 | `apps/rosegriffon` : cycle `rg-db` <-> `rg-types`, vu par un passage manuel de checkdeps à profondeur 3 (hors gate src)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | à corriger dans le dépôt rosegriffon, par son propre gate                                                                                                                                        |
| checkdeps-004 | soldé le 2026-11-13 : chaque `pyproject.toml` à `[project]` est une unité `uv` (arêtes `[tool.uv.sources]`) ; `just test-affected` lance `uv run pytest` sur les unités touchées. `apps/nt` n'a aucune arête de build vers `crates/*` ou `infra/*` (aucune référence dans ses .csproj, CMake ou TS), rien à déclarer                                                                                                                                                                                                                                                                                                                                                      | —                                                                                                                                                                                                |
| nt-001        | soldé le 2026-11-13 : la DLL GPU partagée est la crate L2 `crates/dx12-hal` (cdylib `dx12_hal.dll`, C ABI `dx12_hal_*` en Rust sur windows-rs, à la place de `native_nt_gpu` en C++) ; sa liaison bun:ffi `packages/ffi-bridge/src/dx12-hal.ts` (paquet L2, `use crates/dx12-hal`) sert `unix-distro.ts` (hors produit, reste dans le paquet) et `apps/nt` (`/api/gpu` de `sdk/tools/host/server.ts`, dépendance `file:` vue par checkdeps) ; `infra/winnt-sdk` supprimé (l'hôte .NET cède la place à la coque WinUI 3 de `apps/nt`, la DispatcherQueue à `wslg_cli::host`) ; `infra/ffi-bridge` devenu `packages/ffi-bridge` (ARCH-006 n'admet plus que `infra/mesh-vn`) | —                                                                                                                                                                                                |
| dx12-001      | soldé le 2026-11-13 : `crates/dx12-winui-core` scindé ; `crates/dx12-hal` (L2, `cfg(windows)`, vide sur Linux) garde D3D12, fences, textures partagées par handle NT, DirectComposition et une C ABI `dx12_hal_*` (cdylib `dx12_hal.dll`, JSON, `dx12_hal_abi_version() == 1`) ; la DispatcherQueue WinUI 3 part dans l'hôte `wslg-cli` (L5, `wslg_cli::host`)                                                                                                                                                                                                                                                                                                            | —                                                                                                                                                                                                |
| pin-001       | soldé le 2026-11-13 : `src.lock.json` est le seul pin des dépôts ; `ay manifests` en dérive DEPS et .gitmodules, `ay manifests --check` signale toute dérive (fichier ou gitlink différent du verrou) ; `.repo/` et la génération de MAINTAINERS retirés ; les crates restent épinglées par Cargo.lock (vendored-sources = copie hors ligne de Cargo.lock, pas un second pin)                                                                                                                                                                                                                                                                                             | dérive restante signalée par le gate : `apps/rosegriffon` (gitlink ff692b5 vs verrou f5d61f9) à résoudre par `ay lock` côté propriétaire du produit                                              |
| toolchain-001 | cranelift (dev) incompatible avec la LTO LLVM et limité sur windows-msvc                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | cranelift seulement en dev hors cdylib ; trancher clang-cl vs cl.exe (conflit ouvert)                                                                                                            |
| taskgraph-001 | cache distant R2 pour sccache non configuré                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | backend S3 de sccache vers R2 sur les runners, après lecture de la doc sccache                                                                                                                   |

## Annexe A : architecture produit web (labs v0, ex-ROOT-ARCHITECTURE.md)

Chemins d'origine : `crates/cli` de labs est devenu `ay conformance` (crates/conformance) ; `vendor/` est devenu des forks `aphrody-labs` épinglés par commit (§11).

Status: v0 architecture. Implemented: conformance harness skeleton, Lore absorbed. Versions read from crates.io on 2026-11-12.

### 1. Scope

Aphrody Labs (`aphrody-labs/labs`, private) is the lab of Aphrody, as Vercel Labs is to Vercel (`aphrody-dev` is the main org). Goal: a self-hosted replacement for Vercel, Vercel Labs, Epic Games and Unreal Engine, built on their open-source projects, with every paid or hosted-only feature replaced by a self-hosted one.

- Shell (Windows, Claude Code): see [docs/shell/INDEX.md](shell/INDEX.md).
- Compatibility target on the web side: `vercel/vercel` (CLI, builders, Build Output API v3) and Next.js. Our stack on top: Tailwind v4 engine, shadcn registry, Base UI components, Blitz/vello renderer.
- Compatibility target on the web side: `vercel/vercel` (CLI, builders, Build Output API v3) and Next.js.
- Version control: Lore (`EpicGames/lore`, MIT), vendored from the fork `aphrody-labs/lore` into `third_party/lore`. Git is not used.
- Product focus from day one: WebAssembly and WebGPU first-class (wgpu, wasmtime, binaryen), the whole modern front stack (TypeScript, Tailwind, shadcn, Base UI, React, Svelte, Solid, Vue, vanilla, Electron, Fluent UI) and its Rust equivalents (GPUI, gpui-component, Tauri v3, Taffy, Leptos, Axum). Embedding targets: CEF (cef-rs, Chromium 156), Tauri v3, Electron 43 (Chromium 150); the Chromium 160 checkout is only a source for third_party, LLVM, docs and UI. See ENGINE-DECISION.md.
- Epic side: Unreal Engine through the private fork `aphrody-labs/UnrealEngine` (EULA: private, licensees only, never in a public repository). Followed upstreams: lore and its SDKs, zen, PixelStreamingInfrastructure, raddebugger, UnrealEngine.

Decisions:

- JS engine: V8 built from source at the `v8_revision` of the Chromium checkout in `C:src` (today V8 16.0.25, commit `e4e354fb`), through the fork `aphrody-labs/rusty_v8`; `deno_core` from the fork `aphrody-labs/deno` (`libs/core`; `denoland/deno_core` is archived). No WebKit/JavaScriptCore. Fallbacks: `boa_engine`, then `rquickjs`. See [ENGINE-DECISION.md](ENGINE-DECISION.md).
- Renderer: Blitz (stylo + taffy + parley + vello) behind the `render` feature, off by default. Chromium `headless_shell` (local checkout) is the out-of-process oracle for layout and the Google web platform, never linked into the binary (Blink is LGPL).
- Toolchain: oxc + rolldown + lightningcss. swc is not used.
- Tailwind: port `packages/tailwindcss` to Rust, use the MIT Oxide scanner, and diff the output against upstream snapshots.
- Components: shadcn registry schema and Base UI.
- Lore is absorbed as workspace members (`crates/lore*`), its patched crates live in `vendor/`. `scripts/absorb-lore.sh` re-syncs from `aphrody-labs/lore`.
- Upstream-first: nightly toolchain, dependencies tracked at their latest upstream release.
- Bun is studied only (license NOASSERTION: MIT plus statically linked LGPL-2 JavaScriptCore). Ideas may be ported; code may not.
- MPL-2.0 crates are used without modification.

### 2. Layers

```
+--------------------------------------------------------------------------------------+
|                               aphrody (single binary, crates/cli)                     |
|  dev | build | serve | deploy | test | install | add | render | run | x (conformance)|
+--------------------------------------------------------------------------------------+
| L6 Product      | next (App Router)  | registry (shadcn schema) | deploy (BOA v3,    |
|                 | rsc (Flight)       | components (Base UI)     |  adapters, OCI)    |
+-----------------+--------------------+--------------------------+--------------------+
| L5 CSS          | tailwind (engine port)  <- tailwind-oxide (scanner)   | css (lightningcss)|
+-----------------+-------------------------------------------------------+------------+
| L4 Toolchain    | transpile (oxc) | bundle (rolldown) | resolve (oxc_resolver) |       |
|                 | pm (install, lockfile, registry client) | test (runner, expect) |       |
+-----------------+--------------------------------------------------------------------+
| L3 Runtime      | runtime (deno_core host, module loader, snapshot)                  |
|                 | node (node:* builtins) | webapi (fetch, streams, URL)   | bunapi |
+-----------------+--------------------------------------------------------------------+
| L2 Engine       | js (trait)  ->  v8 (native)  |  boa (wasm32, fallback)  | quickjs     |
+-----------------+--------------------------------------------------------------------+
| L1 Platform     | io (tokio, fs, process, watch) | net (hyper, axum, rustls, quinn/h3) |
|                 | renderer (blitz-dom/html/paint, stylo, taffy, parley, vello, wgpu) |
+--------------------------------------------------------------------------------------+
| L0 Base         | base (errors, paths, interned strings, hashing, tracing setup)     |
+--------------------------------------------------------------------------------------+
| Lore (VCS)      | crates/lore* (absorbed from aphrody-labs/lore), vendor/ patches    |
+--------------------------------------------------------------------------------------+
```

Rules:

- A layer depends only on the layers below it. `cli` is the only crate that depends on everything.
- L1 to L5 hold no framework-specific knowledge. Next.js semantics live only in `next` and `rsc`.
- `renderer` is independent of the JS engine at v0. It renders HTML and CSS that the server produced.

### 3. Crate map

One root workspace (`Cargo.toml`, `resolver = "3"`, `edition = "2024"`). Members are flat at `crates/<dir>`. Package names are `aphrody-<dir>`, except the binary, which is `aphrody`. The owner already publishes about 190 older `aphrody-*` crates; directory names were chosen so that no new package reuses one of them (`renderer`, `js` and `webapi` instead of the taken `aphrody-render`, `aphrody-engine` and `aphrody-web`). Check each new name on crates.io before adding a crate. Every external version is pinned once in `[workspace.dependencies]`, and members use `dep.workspace = true`.

| Dir              | Package                  | Layer | Responsibility                                                                                                         | Key deps                                                                                           | Bun subsystem studied (lines, from targets survey)            |
| ---------------- | ------------------------ | ----- | ---------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| `cli`            | `aphrody`                | top   | argument parsing, command dispatch                                                                                     | clap                                                                                               | `runtime` cli parts                                           |
| `base`           | `aphrody-base`           | L0    | error types, path utils, string interning, tracing init                                                                | tracing                                                                                            | `bun_core` 33150, `paths` 7258                                |
| `io`             | `aphrody-io`             | L1    | async fs, process spawn, file watching, shell                                                                          | tokio, notify, ignore                                                                              | `io` 11797, `spawn` 4696, `watcher` 2568, `shell_parser` 5873 |
| `net`            | `aphrody-net`            | L1    | HTTP/1.1, HTTP/2, HTTP/3 server and client, TLS, WebSocket                                                             | hyper, hyper-util, axum, tower, rustls, reqwest, quinn, h3                                         | `http` 18740, `uws` 1701                                      |
| `renderer`       | `aphrody-renderer`       | L1    | headless and windowed HTML/CSS rendering, screenshots, WPT reftests                                                    | blitz-dom, blitz-html, blitz-paint, anyrender, stylo, taffy, parley, vello, vello_cpu, wgpu, winit | none (Bun has no renderer)                                    |
| `js`             | `aphrody-js`             | L2    | `Engine` trait: realms, modules, microtasks, host ops; backends `v8`, `boa`, `quickjs` (features)                      | v8, boa_engine, rquickjs                                                                           | `jsc` 55638 (C++ heavy)                                       |
| `runtime`        | `aphrody-runtime`        | L3    | deno_core JsRuntime host, ESM and CJS loader, startup snapshot, event loop, permissions                                | deno_core                                                                                          | `runtime` 363594, `event_loop` 2619                           |
| `webapi`         | `aphrody-webapi`         | L3    | fetch, Request/Response, streams, URL, TextEncoder, WebCrypto, timers, WebSocket                                       | net, runtime                                                                                       | `http_jsc` 6417                                               |
| `node`           | `aphrody-node`           | L3    | `node:*` builtins (fs, path, buffer, stream, http, crypto, child_process, worker_threads, async_hooks)                 | io, net, runtime                                                                                   | `node_path` 3059                                              |
| `bunapi`         | `aphrody-bunapi`         | L3    | Bun-compatible globals (`Bun.serve`, `Bun.file`, `Bun.spawn`, `bun:test` surface) for the Bun suite                    | runtime, net, io                                                                                   | `runtime` (API surface)                                       |
| `transpile`      | `aphrody-transpile`      | L4    | parse, transform (TS, JSX, decorators, React Refresh), codegen, minify, source maps                                    | oxc                                                                                                | `js_parser` 51577, `js_printer` 9641, `sourcemap` 4712        |
| `resolve`        | `aphrody-resolve`        | L4    | Node/ESM resolution, `exports`/`imports`, tsconfig paths, conditions                                                   | oxc_resolver                                                                                       | `resolver` 19793                                              |
| `bundle`         | `aphrody-bundle`         | L4    | graph build, code splitting, server/client/edge environments, HMR graph                                                | rolldown, transpile, resolve, css                                                                  | `bundler` 61628                                               |
| `pm`             | `aphrody-pm`             | L4    | npm registry client, semver, lockfile (reads `bun.lock`, `package-lock.json`, `pnpm-lock.yaml`), tarball cache, linker | net, io, sha2, zstd                                                                                | `install` 106179, `semver` 4211, `tar` 4721                   |
| `test`           | `aphrody-test`           | L4    | test runner, `expect`, snapshots, mocks, Jest/Vitest/bun:test surface                                                  | runtime                                                                                            | `runtime` test runner parts                                   |
| `css`            | `aphrody-css`            | L5    | CSS parse, transform, minify, CSS modules, bundling                                                                    | lightningcss                                                                                       | `css` 61193                                                   |
| `tailwind-oxide` | `aphrody-tailwind-oxide` | L5    | candidate scanner (upstream `crates/oxide`, MIT, upstream code with notice kept)                                       | ignore                                                                                             | none                                                          |
| `tailwind`       | `aphrody-tailwind`       | L5    | Tailwind v4 compiler (section 7)                                                                                       | css, tailwind-oxide                                                                                | none                                                          |
| `rsc`            | `aphrody-rsc`            | L6    | Flight wire format, client/server reference manifests, server action ids                                               | bundle                                                                                             | none                                                          |
| `next`           | `aphrody-next`           | L6    | App Router: route tree, layouts, metadata, caching, middleware/proxy, server actions, image and font                   | rsc, bundle, runtime, net                                                                          | `router` 1772                                                 |
| `registry`       | `aphrody-registry`       | L6    | shadcn-schema registry client and server, `components.json`, `add`                                                     | net, serde_json                                                                                    | none                                                          |
| `deploy`         | `aphrody-deploy`         | L6    | Build Output API v3 writer, `serve` for it, OCI image, provider adapters                                               | bundle, net                                                                                        | `standalone_graph` 7889 (single-file exe idea)                |
| `conformance`    | `aphrody-conformance`    | tool  | fetch pinned upstreams, run the 11 suites, emit JSON results                                                           | io, net                                                                                            | none                                                          |

Bun line counts give a rough idea of scope. They are not a design input: Bun's crates mirror a Zig-to-Rust port, and this codebase does not follow its structure.

### 4. Pinned v0 dependency set

All versions are pinned exactly (`=x.y.z`) in the root `Cargo.toml`. License and MSRV come from crates.io version metadata.

| Crate                             | Version           | License                                                | rust-version | Role                                                                   |
| --------------------------------- | ----------------- | ------------------------------------------------------ | ------------ | ---------------------------------------------------------------------- |
| deno_core                         | 0.413.0           | MIT                                                    | n/a          | JS runtime host (ops, module loader, snapshots)                        |
| v8                                | 152.2.0           | MIT (bindings; V8 is BSD-3-Clause, ICU is Unicode-3.0) | n/a          | V8 engine                                                              |
| boa_engine                        | 0.22.0            | Unlicense OR MIT                                       | 1.91.0       | pure-Rust engine for wasm32 and fallback                               |
| rquickjs                          | 0.14.0            | MIT (QuickJS: MIT)                                     | 1.87         | small-footprint fallback                                               |
| oxc                               | 0.158.0           | MIT                                                    | **1.97.0**   | parser, transformer, codegen, minifier                                 |
| oxc_resolver                      | 11.24.3           | MIT                                                    | 1.95.0       | module resolution                                                      |
| rolldown                          | 1.3.2             | MIT                                                    | n/a          | bundler core                                                           |
| lightningcss                      | 1.0.0-alpha.72    | MPL-2.0                                                | n/a          | CSS engine (unmodified)                                                |
| blitz-dom                         | 0.2.4             | MIT OR Apache-2.0                                      | 1.86.0       | DOM and style integration                                              |
| blitz-html                        | 0.2.0             | MIT OR Apache-2.0                                      | 1.86.0       | HTML to DOM                                                            |
| blitz-paint                       | 0.2.1             | MIT OR Apache-2.0                                      | 1.86.0       | painting                                                               |
| anyrender                         | 0.14.0            | MIT OR Apache-2.0                                      | n/a          | render backend abstraction                                             |
| stylo                             | 0.24.0            | MPL-2.0                                                | n/a          | CSS cascade and computed style (unmodified)                            |
| selectors                         | 0.43.0            | MPL-2.0                                                | n/a          | selector matching (unmodified)                                         |
| cssparser                         | 0.38.0            | MPL-2.0                                                | 1.85         | CSS tokenizer (unmodified)                                             |
| html5ever                         | 0.40.1            | MIT OR Apache-2.0                                      | 1.85         | HTML parser                                                            |
| taffy                             | 0.15.1            | MIT                                                    | 1.71         | block, flex and grid layout                                            |
| parley                            | 0.12.0            | Apache-2.0 OR MIT                                      | 1.88         | text layout                                                            |
| fontique                          | 0.13.0            | Apache-2.0 OR MIT                                      | 1.88         | font enumeration and fallback                                          |
| vello                             | 0.12.0            | Apache-2.0 OR MIT                                      | 1.89         | GPU 2D rendering                                                       |
| vello_cpu                         | 0.4.0             | Apache-2.0 OR MIT                                      | 1.89         | CPU rasterizer for deterministic headless screenshots and WPT reftests |
| wgpu                              | 30.0.1            | MIT OR Apache-2.0                                      | 1.87.0       | GPU API (Vulkan, Metal, DX12, WebGPU)                                  |
| winit                             | 0.30.13           | Apache-2.0                                             | 1.70.0       | windowing (preview window only)                                        |
| tokio                             | 1.54.1            | MIT                                                    | 1.85         | async runtime                                                          |
| hyper                             | 1.12.0            | MIT                                                    | 1.63         | HTTP/1 and HTTP/2                                                      |
| hyper-util                        | 0.1.21            | MIT                                                    | 1.85         | hyper glue                                                             |
| axum                              | 0.8.9             | MIT                                                    | 1.80         | internal dev-server routes                                             |
| tower                             | 0.5.3             | MIT                                                    | 1.64.0       | middleware                                                             |
| rustls                            | 0.23.46           | Apache-2.0 OR ISC OR MIT                               | 1.71         | TLS                                                                    |
| reqwest                           | 0.13.5            | MIT OR Apache-2.0                                      | 1.85.0       | outbound HTTP (registry, deploy APIs)                                  |
| quinn                             | 0.11.12           | MIT OR Apache-2.0                                      | 1.85         | QUIC                                                                   |
| h3                                | 0.0.8             | MIT                                                    | 1.70         | HTTP/3 (experimental)                                                  |
| url                               | 2.5.8             | MIT OR Apache-2.0                                      | 1.63         | WHATWG URL                                                             |
| bytes                             | 1.12.1            | MIT                                                    | 1.57         | buffers                                                                |
| tracing                           | 0.1.44            | MIT                                                    | 1.65.0       | diagnostics                                                            |
| clap                              | 4.6.7             | MIT OR Apache-2.0                                      | 1.85         | CLI                                                                    |
| serde / serde_json                | 1.0.229 / 1.0.154 | MIT OR Apache-2.0                                      | 1.56 / 1.71  | serialization                                                          |
| toml                              | 1.2.1             | MIT OR Apache-2.0                                      | 1.85         | config files                                                           |
| sha2                              | 0.11.1            | MIT OR Apache-2.0                                      | 1.88         | integrity hashes                                                       |
| zstd                              | 0.14.3            | BSD-3-Clause (links C libzstd, BSD)                    | 1.64         | cache compression                                                      |
| ignore                            | 0.4.34            | Unlicense OR MIT                                       | 1.88         | gitignore-aware walking                                                |
| notify                            | 8.2.2             | CC0-1.0                                                | 1.88         | file watching                                                          |
| servo (optional, feature `servo`) | 0.8.0             | MPL-2.0                                                | 1.88.0       | full engine backend; off by default                                    |

Not used, with the reason:

- swc_core 84.0.3: overlaps with oxc.
- rspack_core 0.103.2: webpack API surface is not a goal.
- tailwind-rs, railwind, tailwind-css: stale (last releases 2022 to 2023 per `crates.tsv`) and not v4.
- webrender 0.70.1: Blitz uses vello.
- nova_vm 1.0.0: too young (2003 downloads).

Maintenance note: the `denoland/deno_core` GitHub repo is archived (archived=true, last push 2026-02-27). The crate is still published from the Deno monorepo (0.413.0, 2026-10-21). The `js` trait keeps a switch to `boa` or `rquickjs` cheap if publishing stops.

MSRV: the workspace declares `rust-version = "1.97"` because `oxc 0.158.0` declares `rust-version = "1.97.0"`. `rust-toolchain.toml` pins 1.99.1, the current stable on 2026-11-12. CI also runs a 1.97 check job, and the MSRV moves only when a pinned dependency requires it.

### 5. Data flows

#### 5.1 `aphrody dev`

```
fs watcher (io/notify) --changed paths--> module graph (bundle, incremental)
      |                                         |
      |                       +-----------------+------------------+
      |                       v                 v                  v
      |               server env (RSC)   client env (browser)  edge env
      |                transpile/oxc      transpile + React Refresh
      |                       |                 |
      |                       v                 v
      |              runtime (V8 isolate)   dev HTTP server (net) --HMR WebSocket--> browser
      |               renders Flight + HTML   serves /_next/static/* from memory
      v
tailwind scanner (oxide) --candidates--> tailwind compiler --> css (lightningcss) --> HMR CSS update
```

- One process, with a tokio multi-thread runtime for I/O. JS executes on dedicated isolate threads: one server isolate per environment, plus a worker pool for parallel route rendering.
- Modules are transpiled lazily, on first request, and cached by content hash in `.aphrody/cache` (zstd).
- HMR has two paths: client modules use React Refresh boundaries, and server modules invalidate the Flight payload, which the client refetches with `router.refresh()` semantics.

#### 5.2 `aphrody build`

```
next.config.* (evaluated in runtime) --> route discovery (app/, pages/)
  --> bundle: 3 environments (server-rsc, server-ssr, client) + edge, code splitting
  --> rsc: client-reference manifest, server-action manifest
  --> tailwind + css: one CSS file per layout chunk, minified
  --> prerender: execute static routes in runtime --> HTML + .rsc payloads
  --> deploy: write .vercel/output (Build Output API v3) + .next-compatible manifests
```

- `build` is deterministic: the same inputs and lockfile produce byte-identical output. CI checks this with a two-build hash comparison.
- `build --target <vercel|node|static|oci>` selects the output adapter. The default is `vercel`, which is BOA v3.

#### 5.3 `aphrody serve`

```
.vercel/output/config.json --routes--> router (net, matches BOA v3 route phases)
   |-- static/            served from disk/mmap, immutable cache headers
   |-- functions/*.func   loaded into runtime isolates (pooled), handler per route
   |-- *.prerender-config ISR: stale-while-revalidate with an on-disk cache
```

- `serve` runs the same artifact Vercel would run, so local and remote behavior match. This is also how the Build Output v3 suite runs in CI without network access.

#### 5.4 `aphrody deploy`

```
build --target vercel  -->  .vercel/output
  --> provider = vercel: POST files and the deployment through the Vercel REST API (token from env), same contract as `vercel deploy --prebuilt`
  --> provider = oci:    single static binary + output dir --> OCI image (no Dockerfile needed)
  --> provider = static: static/ only (routes that need functions are rejected at build time)
```

- Credentials are read only from the environment or the OS keychain, never from the repo.

### 6. Next.js App Router and RSC/Flight design

Next.js-compatible means that an existing project runs unmodified with `aphrody dev` and `aphrody build`. A `next` bin shim lets the upstream Next.js test harness drive it.

What stays JavaScript: React, react-dom and the `next/*` client and server runtime modules come from npm (MIT) and execute in V8. Their behavior is not reimplemented. What becomes Rust is everything Next.js normally does in its Node-side build and server: config loading, route-tree building, bundling (Turbopack/webpack roles), manifests, the server request pipeline, the cache, and static generation.

Components:

1. **Route tree** (`next`). It scans `app/` for `page`, `layout`, `template`, `loading`, `error`, `not-found`, `route`, `default`, parallel `@slot`, intercepting `(..)` and groups `(group)`, and `pages/` for legacy routes. It produces the same route manifests (`app-paths-manifest.json`, `routes-manifest.json`, `prerender-manifest.json`, `middleware-manifest.json`) because the Next.js runtime and the deploy adapter read them.
2. **Environments** (`bundle`). Each environment is a separate rolldown build with its own conditions: `react-server` for RSC, `node`/`edge` for SSR, and `browser` for the client. Directives (`"use client"`, `"use server"`, `"use cache"`) are detected in the oxc AST:
   - `"use client"` modules are replaced in the RSC graph by client-reference stubs (`registerClientReference(id, export)`).
   - `"use server"` functions are replaced in the client graph by `createServerReference(actionId)`. The action id is a stable hash of module path plus export name, salted per build.
3. **Flight** (`rsc`). Rust does not encode Flight. Encoding happens in V8 with React's own `react-server-dom` server build, which keeps the format identical to the upstream React version. Rust supplies three things: (a) the client-reference manifest in the shape that `react-server-dom-webpack` and `react-server-dom-turbopack` expect (`id`, `chunks`, `name`); (b) the module loading shim (`__webpack_require__`/`__turbopack_require__` equivalents) mapped onto aphrody chunks; (c) a streaming bridge that moves Flight chunks from the RSC isolate to the SSR isolate and the HTTP response without copying (`bytes::Bytes` over a channel). The `rsc` crate also includes a Flight decoder for tests and inspection.
4. **Request pipeline** (`next` + `net`): proxy/middleware (edge env), then route match, then RSC render (Flight), then SSR (HTML from Flight, `renderToReadableStream`), then streaming response. Navigation requests that carry an `RSC: 1` header skip SSR. Partial prerendering is supported: the static shell is generated at build time and dynamic holes are filled at request time over the same stream.
5. **Server actions**: a POST with `Next-Action: <id>` is looked up in the server-action manifest, then the arguments are decoded with React's `decodeReply` in V8. Return values and revalidation are serialized as Flight.
6. **Caching**: `fetch` cache, `"use cache"`, `cacheTag`/`cacheLife`, `revalidatePath`/`revalidateTag`. The storage interface is pluggable: memory for `dev`, disk for `serve`, and the provider for `deploy`. The semantics follow the pinned Next.js version, which the e2e suite verifies.
7. **Next.js modules served natively**: `next/image` (optimizer on Rust image codecs, chosen in M4), `next/font` (font fetch and subsetting at build time via fontique/skrifa), `next/og` (rendered by `renderer`).

Version policy: one Next.js minor line at a time, pinned in the conformance lock. The `next` package version in a user project must match that supported line; on a mismatch, `aphrody` warns.

### 7. Tailwind CSS v4 engine design

The goal is byte-identical CSS to `tailwindcss` v4 at the pinned upstream commit, for the same input CSS and sources.

```
input.css --(lightningcss parse)--> AST --(at-rule pass)--> DesignSystem
   @import "tailwindcss" | @theme | @source | @utility | @variant | @custom-variant | @plugin | @config | @apply
sources --(tailwind-oxide scanner)--> candidate strings
candidates --(candidate parser)--> {variants[], utility, value, modifier, important}
   --(DesignSystem.compile)--> rules --(sort: layer, variant order, property order)--> CSS AST
   --(lightningcss: nesting, vendor prefixes, @property, color-mix fallbacks, minify)--> output.css
```

- **Port scope**: `packages/tailwindcss/src` (MIT) is ported module by module: `design-system`, `candidate`, `utilities`, `variants`, `theme`, `compile`, `apply`, `at-import`, `css-functions`, `property-order`, `sort`. Each Rust module records the upstream file and commit it was ported from, which keeps later re-syncs mechanical.
- **Scanner**: upstream `crates/oxide` (package `tailwindcss-oxide`, MIT, edition 2021, verified at commit `b08bf83a`) is used as a git dependency pinned to the conformance commit. If its dependency tree blocks that, it is vendored into `crates/tailwind-oxide` with the upstream MIT license and a NOTICE file. Its tests run unchanged (suite 4).
- **JS plugins and `@config`**: legacy `tailwind.config.js` and `@plugin` modules run in the aphrody runtime through a small plugin API bridge (`addUtilities`, `matchUtilities`, `addVariant`, `theme()`). Pure-CSS configs never start an isolate.
- **Integration points**: the `bundle` CSS pipeline (automatic for `@import "tailwindcss"`), `aphrody tailwind` (CLI-compatible with `@tailwindcss/cli` flags), and a PostCSS-compatible entry for the integration suite.
- **Verification**: the upstream `*.test.ts` files mostly use `toMatchInlineSnapshot` around `compile()` or `run()`. A one-time extractor (in `conformance`) converts each case into a `{input css, candidates, expected css}` fixture at the pinned commit. Rust tests diff against those fixtures (suite 5).

### 8. Component registry design

- **Schema**: the shadcn registry schemas are the compatibility contract: `registry.json` and `registry-item.json`, which exist at `shadcn-ui/ui@dd41d19e:apps/v4/public/schema/`. The `registry` crate models them with serde using `deny_unknown_fields` off and `$schema` preserved, and it validates every document against the upstream JSON Schema in tests.
- **Item types**: `registry:ui`, `registry:component`, `registry:block`, `registry:lib`, `registry:hook`, `registry:page`, `registry:file`, `registry:style`, `registry:theme`, `registry:item`, with `files`, `dependencies`, `devDependencies`, `registryDependencies`, `cssVars`, `css`, `envVars`, `docs`, `meta`.
- **Client**: `aphrody add <item | url | @namespace/item>` reads `components.json` (style, aliases, `tailwind.css`, `iconLibrary`, `registries`). It resolves `registryDependencies` transitively, rewrites import aliases, merges `cssVars`/`css` into the Tailwind v4 CSS entry (`@theme inline`, `:root`, `.dark`), and installs npm dependencies through `pm`. Its observable result must equal `shadcn add` on the same project, which is checked by snapshotting the file tree.
- **Server**: `aphrody registry build` turns a `registry.json` into the static `r/<name>.json` items. The output is servable by `aphrody serve` or any static host.
- **Components**: components ship as TSX source (the shadcn model), not as Rust widgets. The first-party set is built on Base UI primitives (`@base-ui/react` 1.9.0 at `mui/base-ui@5aacdbb7`, MIT), so the Base UI test suite (suite 7) is the behavioral oracle for interaction and accessibility under the aphrody runtime and test runner.

### 9. Deploy output (Build Output API v3)

```
.vercel/output/
  config.json                    { "version": 3, "routes": [...], "images": {...}, "overrides": {...}, "cache": [...], "framework": {...} }
  static/                        public assets, prerendered HTML and .rsc payloads
  functions/<path>.func/
    .vc-config.json              { "runtime": "nodejs<NN>.x", "handler": "...", "launcherType": "Nodejs", "supportsResponseStreaming": true }
                                 or { "runtime": "edge", "entrypoint": "..." }
    <bundled handler + chunks>
  functions/<path>.prerender-config.json   { "expiration", "group", "bypassToken", "fallback", "allowQuery" }
```

- Function bundles are plain ESM/CJS that runs on Vercel's Node and Edge runtimes, so deploying needs no custom runtime. The same bundles run on the aphrody runtime under `aphrody serve`. One artifact serves both.
- Route phases (`filesystem`, `handle: miss`, `rewrite`, `hit`, `error`) are generated from `routes-manifest.json`, following the order of the upstream Next.js deployment adapter (`packages/next/src/build/adapter/`, verified at `vercel/next.js@3642b242`).
- An `oci` adapter packages the `serve` binary with `.vercel/output` into one image, for self-hosting.

### 10. Targets

| Target                            | Engine                 | Notes                                                                                                                                                    |
| --------------------------------- | ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| x86_64-pc-windows-msvc            | v8                     | prebuilt rusty_v8 static lib                                                                                                                             |
| x86_64/aarch64-unknown-linux-gnu  | v8                     | prebuilt rusty_v8 static lib                                                                                                                             |
| x86_64/aarch64-unknown-linux-musl | v8 from source, or boa | no prebuilt rusty_v8 musl archive is assumed; CI builds V8 with `V8_FROM_SOURCE=1` and caches the result. Fallback artifact uses `--features engine-boa` |
| aarch64/x86_64-apple-darwin       | v8                     | prebuilt rusty_v8 static lib                                                                                                                             |
| wasm32-unknown-unknown            | boa                    | toolchain crates (transpile, css, tailwind, rsc, registry) plus a boa-backed runtime subset; renderer via wgpu WebGPU. No V8, no net server              |

`cargo check --workspace` runs on `x86_64-unknown-linux-gnu` (prd) and `x86_64-pc-windows-msvc` (CI); the Windows-host crates of the WSLg stack are empty on Linux (see §6).

### 11. Politique de licences

- **Licence du projet** : MIT OR Apache-2.0.
- **Licences de dépendances admises** : MIT, Apache-2.0 (y compris WITH LLVM-exception), BSD-2-Clause, BSD-3-Clause, ISC, Zlib, Unicode-3.0, CC0-1.0, Unlicense, et MPL-2.0 selon la règle suivante (liste exécutable : `deny.toml`).
- **MPL-2.0** (lightningcss, stylo, selectors, cssparser, servo, adblock) : dépendances de registre utilisées sans modification. Aucun fichier MPL n'est copié, patché ni vendorisé ; un correctif part en amont et le pin monte. Une entrée `[patch]` visant une crate MPL est interdite.
- **Patchs** : `third_party/` ne reçoit aucune modification locale et il n'y a plus de `third_party/patches/` (2026-11-13). Une crate de registre corrigée passe par un fork `aphrody-labs` épinglé par commit dans `[patch.crates-io]` (`git` + `rev`, imposé par `deny.toml` `required-git-spec = "rev"` ; aujourd'hui quinn-proto et glob-match). Jamais sur une crate MPL. `docs/patches/series` n'indexe que des patchs suivis dans l'arbre.
- **Refusées** : GPL, LGPL, AGPL (toutes versions), SSPL, BUSL et autres licences non OSI, ainsi que tout code dont GitHub rapporte la licence NOASSERTION, sauf revue manuelle consignée ici.
- **Exception revue (2026-11-13)** : `ffmpeg-next` / `ffmpeg-sys-next` (WTFPL, permissive) admises crate par crate dans `deny.toml` `[licenses] exceptions`. FFmpeg libav* (LGPL-2.1+) est lié dynamiquement depuis le système ou vcpkg, jamais vendorisé : `crates/tv-*` restent MIT OR Apache-2.0 (LGPL-2.1 §6). Le test `tv-ffmpeg` `ffmpeg_build_is_lgpl` (`cargo test -p tv-ffmpeg -- --ignored`, obligatoire avant toute distribution) échoue si la libavutil chargée annonce `--enable-gpl`, `--enable-nonfree` ou `--enable-version3` (LGPL-3.0), ou une licence autre que « LGPL version 2.1 ». Aucune crate `tv-*` n'est distribuée aujourd'hui (cargo-dist ne publie que `ay`, seul paquet `[package.metadata.dist] dist = true`) ; ce test devient une étape bloquante du job de release le jour où une crate `tv-*` y entre. Constat du 2026-11-13 : le FFmpeg d'Arch sur prd (2:9.0.2-2) est construit avec `--enable-gpl` ; un binaire `tv-*` lié à lui n'est pas distribuable sous MIT OR Apache-2.0, la distribution doit lier un FFmpeg LGPL (port vcpkg `ffmpeg` sans la feature `gpl`, triplets de `infra/vcpkg`). Seules les crates `tv-*` dépendent de `tv-ffmpeg` : `-crates/tv-ffmpeg` dans `/DEPS.rules` (donc crates, packages, plugins et apps), relevé par `+` dans `crates/tv-cli`.
- **Étude seulement** : Bun (`oven-sh/bun`, licence GitHub NOASSERTION ; son `LICENSE.md` au commit `43850629` : Bun MIT mais JavaScriptCore/WebKit LGPL-2 liés statiquement). Lecture et description des idées permises ; copie, traduction ligne à ligne et vendorisation interdites. Idem Zed/GPUI (NOASSERTION).
- **Suites de test comme oracles** : récupérées aux commits épinglés dans `conformance/upstream/` (ignoré) et exécutées là ; jamais commitées, leurs licences (Test262, WPT, Bun) n'entrent pas dans l'arbre.
- **Application** : `cargo-deny` (`deny.toml`) avec `licenses`, `bans` (pas d'`openssl-sys` : TLS sur rustls) et `sources` (crates.io, forks git `aphrody-dev` et `aphrody-labs` épinglés par `rev`) en CI avant main.

### 12. Décisions transverses

- **Erreurs** : `thiserror` dans les bibliothèques, un seul rendu de diagnostics façon `miette` dans les CLIs.
- **Concurrence** : tokio pour les E/S ; le JS tourne sur des threads d'isolat, jamais sur les workers tokio ; le travail CPU (parse, bundle, scan) va dans des pools rayon.
- **Cache** : `<cache OS>/aphrody/<kind>/<blake3>` (`XDG_CACHE_HOME`, `%LOCALAPPDATA%`), compressé zstd et adressé par contenu, partagé par `dev`, `build` et `test`.
- **Télémétrie** : aucune.

================================================
FILE: design/README.md
================================================

# docs/design : sources de design de référence

Sources, licences et mode (`sources.toml`, vérifié en ligne le 2026-11-13) ; outil `bun scripts/design-mirror.ts index|mirror|check` (sur fr1, robots.txt respecté, débit limité).

| Site                                                  | Licence constatée                       | Mode                     | URLs indexées |
| ----------------------------------------------------- | --------------------------------------- | ------------------------ | ------------- |
| m3.material.io                                        | conditions Google, aucune licence libre | index + specs réécrites  | 375           |
| material.io                                           | conditions Google, aucune licence libre | index + specs réécrites  | 370           |
| design.google                                         | conditions Google                       | index + specs réécrites  | 296           |
| vercel.com (geist, docs front, produits)              | Vercel Terms, propriétaire              | index + specs réécrites  | 195           |
| web.dev (a11y, perf, CWV, SEO, wasm)                  | CC BY 4.0 / Apache 2.0                  | miroir texte (348 pages) | 354           |
| developer.chrome.com (Lighthouse, CrUX, WebGPU, wasm) | CC BY 4.0 / Apache 2.0                  | miroir texte (245 pages) | 248           |

- `index/<site>.json` : URLs, sections, lastmod, licence et preuve.
- `../../third_party/design-mirror/<site>/` : markdown, en-tête url/date/sha256/licence, `MANIFEST.json`.
- `specs/<domaine>/<source>.{md,json}` : règles normatives réécrites (schéma `specs/spec.schema.json`, 441 règles) :
  tokens (material-3, geist), components (material-3 : 36, geist : 75), motion (material-3), a11y (material-3, web), seo (web), perf (core-web-vitals, vercel-frontend), gpu-wasm (webgpu-wasm), principles (google-design).
- Skills : `.agents/skills/{material-3,google-design,vercel-geist,web-a11y-seo-cwv,webgpu-wasm-ui}` (plugin aphrody-skills, `just agents-sync`).
- Recherche : `ai-os brain design` indexe specs, index et miroir dans le Context store (`~/.agent/memory.sqlite`, scope `design`) ; `ai-os brain absorb` l'inclut.

Cible UI de src inchangée : `packages/design` et la skill ui-system ; ces specs servent de référence et de contrôle.

================================================
FILE: i18n/README.md
================================================

# Internationalization

English is the source language. Supported locales: `en`, `fr`, `zh-CN`, `ja`, `es`.

## Catalogs

One set of flat JSON catalogs, `packages/i18n/locales/<locale>.json` (key to message), read by both runtimes:

- TypeScript: `@aphrody/i18n` (`packages/i18n`, Bun, no npm dependency). `createTranslator(catalogs, locale).t(key, args)`, `negotiate(acceptLanguage)`.
- Rust: `crates/aphrody-i18n` embeds the same files with `include_str!`. `I18n::new(locale).t_args(key, args)`, `negotiate(header)`.
- `crates/tv-i18n` (Fluent, 16 languages, media domain) is unchanged and independent.

A key missing in a locale falls back to its base language, then to `en`, then to the key itself.

## Message syntax (ICU subset)

`{name}`, `{n, number}`, `{n, plural, =0 {..} one {..} other {..}}` with `#` as the count, `{g, select, a {..} other {..}}`, nesting. `'{'` and `'}'` quote braces, `''` is an apostrophe. `plural` and `select` require an `other` case. Plural categories: Intl.PluralRules in TypeScript, hand-coded CLDR rules for the five locales in Rust (en and es: one = 1; fr: one = 0 or 1; zh-CN and ja: other). Numbers print without grouping in Rust, so shared test values stay below 1000.

## Commands

```sh
bun run packages/i18n/src/cli.ts check                 # missing/extra keys, placeholder and syntax parity against en; exit 1 on drift
bun run packages/i18n/src/cli.ts extract <paths...>    # t("key") call sites; unknown and unused keys against en
bun test packages/i18n
cargo test -p aphrody-i18n                              # on fr1 or CI
```

`packages/i18n/tests/fixtures/format.json` holds shared cases run by both the Bun and the Rust tests.

## Translated documents

Short versions (about half the length) of `README.md`, `AGENTS.md` and `docs/games/PLAN.md`: `fr/`, `zh-CN/`, `ja/`, `es/`. The English files stay authoritative.

================================================
FILE: i18n/es/README.md
================================================

[Original en inglés](../../../README.md)

# src

Monorepo de Aphrody. El contrato para colaboradores y agentes está en [AGENTS.md](../../../AGENTS.md) y [CLAUDE.md](../../../CLAUDE.md); la arquitectura en [docs/ARCHITECTURE.md](../../ARCHITECTURE.md) y la hoja de ruta en [docs/STACK-ROADMAP.md](../../STACK-ROADMAP.md).

## Estructura

| Directorio     | Contenido                                                                                                                                                                                             |
| :------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/`        | `aphrody`, `aphrody-app`, `auto`, `l2l`, `nt`, `r2-site`, `r2b`, `unixwin`, `yolo`, y los sitios comunitarios `rosegriffon` y `shenron`. `auto`, `r2b`, `rosegriffon` y `shenron` son submódulos git. |
| `packages/`    | Paquetes Bun `@aphrody/*`: `ai-os` (el único producto de IA), `core`, `design`, `forge`, `gaming`, `wck` y otros.                                                                                     |
| `crates/`      | Crates Rust 2024 en un workspace plano: `ay` (la CLI del repositorio), `archguard`, `xtask`, `depot-*`, `lore*`, `aphrody-ui`, `core`, `tv-*`, `gamescope-*` y otros.                                 |
| `infra/`       | Configuración de flota y despliegue ensamblada con herramientas upstream.                                                                                                                             |
| `third_party/` | Copias upstream y forks de aphrody-labs, fijados en `src.lock.json`; sin modificaciones locales.                                                                                                      |

## Pines y licencias

- `src.lock.json` es el único pin; `DEPS` y `.gitmodules` se derivan con `ay manifests`. `MAINTAINERS` es manual.
- El código propio es MIT OR Apache-2.0. La política de dependencias está en `deny.toml`.

## Comandos

Rust se compila en CI o en el host de compilación, no en la estación de trabajo.

```sh
just doctor          # diagnóstico de la toolchain
just arch-check      # puerta de arquitectura
just lock            # fija el checkout en src.lock.json y deriva DEPS y .gitmodules
just manifests-check # manifiestos derivados coherentes con src.lock.json
just graph <path> <name>   # grafo de código en graphify-out/<name>
just deploy          # docker compose pull + up --wait
just verify-all      # arquitectura, doctor, suites de Bun y ci.yml para Rust
```

## Dónde leer

| Tema                                        | Documento                                             |
| :------------------------------------------ | :---------------------------------------------------- |
| Diseño e interfaz                           | [docs/DESIGN_SYSTEM.md](../../DESIGN_SYSTEM.md)       |
| Medios (`crates/tv-*`)                      | [docs/tv](../../tv)                                   |
| Juegos y Steam                              | [docs/gaming/OWNERSHIP.md](../../gaming/OWNERSHIP.md) |
| Juegos y suite creativa (plan, sin empezar) | [docs/games/PLAN.md](../../games/PLAN.md)             |
| Despliegue                                  | [docs/infra/DEPLOY.md](../../infra/DEPLOY.md)         |

## Labs (fusionado el 2026-11-12)

Aphrody Labs: plataforma autoalojada; su antiguo binario es ahora `ay conformance`. Incluye `crates/conformance`, `crates/lore*` (Lore VCS, MIT), `crates/apm`, `infra/chromium-factory` y el plugin `plugins/labs`. Recetas: `just lab-build`, `just lab-dev`, `just lab-conformance`.

================================================
FILE: i18n/fr/README.md
================================================

[English source](../../../README.md)

# src

Monorepo d'Aphrody. Le contrat des contributeurs et des agents est [AGENTS.md](../../../AGENTS.md) et [CLAUDE.md](../../../CLAUDE.md) ; l'architecture cible est dans [docs/ARCHITECTURE.md](../../ARCHITECTURE.md), la feuille de route dans [docs/STACK-ROADMAP.md](../../STACK-ROADMAP.md).

## Organisation

| Répertoire                                                                        | Contenu                                                                                                                                                                                                                                                  |
| :-------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/`                                                                           | `aphrody`, `aphrody-app`, `auto`, `l2l`, `nt`, `r2-site`, `r2b`, `unixwin`, `yolo`, et deux sites communautaires maintenus par Aphrody, `rosegriffon` et `shenron`. `auto`, `r2b`, `rosegriffon` et `shenron` sont des sous-modules git.                 |
| `packages/`                                                                       | Paquets Bun `@aphrody/*` : `ai-os` (le seul produit d'IA), `core`, `deploy`, `design`, `env-kit`, `ffi-bridge`, `forge`, `gaming`, `wck` et d'autres.                                                                                                    |
| `crates/`                                                                         | Crates Rust 2024 dans un seul workspace Cargo à plat : `ay` (la CLI du dépôt), `archguard`, `xtask`, `depot-*`, `lore*`, `aphrody-ui`, `core`, `core-capi`, `ffi`, `rust-stack`, `tv-*`, `gamescope-*`, `steam-depot`, `conformance`, `apm` et d'autres. |
| `infra/`                                                                          | Configuration de flotte et de déploiement assemblée à partir d'outils upstream (`docker`, `cluster`, `cloudflare`, `fleet`, `mesh-vn`, `chromium-factory` et d'autres).                                                                                  |
| `third_party/`                                                                    | Checkouts upstream et forks aphrody-labs, épinglés dans `src.lock.json` ; liste des forks dans `third_party/forks.txt`. Aucune modification locale.                                                                                                      |
| `docs/`, `assets/`, `conformance/`, `licenses/`, `plugins/`, `scripts/`, `tools/` | Documentation, ressources de marque, suites de conformité, textes de licences, plugins Claude Code (`labs`, `aphrody-nhitl`), scripts et outillage.                                                                                                      |

## Épinglage et licences

- `src.lock.json` est l'unique épinglage ; `DEPS` et `.gitmodules` en sont dérivés par `ay manifests`. `MAINTAINERS` est tenu à la main.
- Le code first-party est sous MIT OR Apache-2.0 (`LICENSE-MIT`, `LICENSE-APACHE`). La politique de dépendances est dans `deny.toml` et `docs/ARCHITECTURE.md`.

## Commandes

Rust se compile en CI ou sur l'hôte de build, pas sur le poste de travail.

```sh
just doctor          # diagnostic de la toolchain
just arch-check      # garde d'architecture (ay arch check --strict pour la forme stricte)
just lock            # verrouille le checkout dans src.lock.json, puis dérive DEPS et .gitmodules
just manifests-check # manifestes dérivés et gitlinks conformes à src.lock.json
just env-doctor      # vérifie le coffre .env masqué et l'authentification des éditeurs
just graph <path> <name>   # graphe de code tree-sitter dans graphify-out/<name>
just deploy          # docker compose pull + up --wait sur un hôte
just verify-all      # garde d'architecture, doctor, suites Bun, puis ci.yml pour Rust
```

## Où lire

| Sujet                                      | Document                                                                 |
| :----------------------------------------- | :----------------------------------------------------------------------- |
| Design system et UI                        | `docs/DESIGN_SYSTEM.md`, `docs/ui/STACK.md`, `packages/design/DESIGN.md` |
| Média (`crates/tv-*`)                      | `docs/tv`                                                                |
| Jeux vidéo et Steam                        | `docs/gaming/OWNERSHIP.md`                                               |
| Epic Games et Unreal Engine                | `docs/epic/RESOURCES.md`, `docs/epic/TRACKING.md`                        |
| Jeux et suite créative (plan, non démarré) | `docs/games/PLAN.md`                                                     |
| Déploiement                                | `docs/infra/DEPLOY.md`                                                   |
| Journaux de session                        | `docs/SESSION-LEDGER-2026-11-13.md`                                      |

## Labs (fusionné le 2026-11-12)

Aphrody Labs : travail de plateforme auto-hébergée ; son ancien binaire est désormais `ay conformance`.

| Chemin                                                                         | Contenu                                                                          |
| :----------------------------------------------------------------------------- | :------------------------------------------------------------------------------- |
| `crates/conformance`, `conformance/`                                           | suites de conformité épinglées, CLI `ay conformance`                             |
| `crates/lore*`, `licenses/lore`, `tools/lore`                                  | Lore VCS, absorbé (MIT)                                                          |
| `crates/apm`                                                                   | crate APM                                                                        |
| `[patch.crates-io]`                                                            | crates patchées, forks aphrody-labs épinglés par `rev` (quinn-proto, glob-match) |
| `third_party/oils`, `third_party/{vendor.lock,chrome-channels.toml,forks.txt}` | fork oils et épinglages                                                          |
| `infra/chromium-factory`                                                       | usine de build Chromium                                                          |
| `plugins/labs`                                                                 | plugin Claude Code `labs` (`docs/PLUGIN.md`)                                     |

Recettes : `just lab-build`, `just lab-dev`, `just lab-conformance`.

================================================
FILE: i18n/ja/README.md
================================================

[English source](../../../README.md)

# src

Aphrody のモノレポです。コントリビューターとエージェント向けの規約は [AGENTS.md](../../../AGENTS.md) と [CLAUDE.md](../../../CLAUDE.md)、目標アーキテクチャは [docs/ARCHITECTURE.md](../../ARCHITECTURE.md)、ロードマップは [docs/STACK-ROADMAP.md](../../STACK-ROADMAP.md) にあります。

## 構成

| ディレクトリ                                                                      | 内容                                                                                                                                                                                                                                                        |
| :-------------------------------------------------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/`                                                                           | `aphrody`、`aphrody-app`、`auto`、`l2l`、`nt`、`r2-site`、`r2b`、`unixwin`、`yolo`。Aphrody が保守するコミュニティサイト `rosegriffon` と `shenron` も含みます。git サブモジュールは `auto`、`r2b`、`rosegriffon`、`shenron` です。                         |
| `packages/`                                                                       | Bun の `@aphrody/*` パッケージ群。`ai-os`(唯一の AI プロダクト)、`core`、`deploy`、`design`、`env-kit`、`ffi-bridge`、`forge`、`gaming`、`wck` など。                                                                                                       |
| `crates/`                                                                         | 単一のフラットな Cargo ワークスペースにある Rust 2024 クレート群。`ay`(リポジトリ CLI)、`archguard`、`xtask`、`depot-*`、`lore*`、`aphrody-ui`、`core`、`core-capi`、`ffi`、`rust-stack`、`tv-*`、`gamescope-*`、`steam-depot`、`conformance`、`apm` など。 |
| `infra/`                                                                          | アップストリームのツールを組み合わせたフリートとデプロイの設定(`docker`、`cluster`、`cloudflare`、`fleet`、`mesh-vn`、`chromium-factory` など)。                                                                                                            |
| `third_party/`                                                                    | アップストリームのチェックアウトと aphrody-labs のフォーク。`src.lock.json` で固定し、フォーク一覧は `third_party/forks.txt` にあります。ローカルでは変更しません。                                                                                         |
| `docs/`、`assets/`、`conformance/`、`licenses/`、`plugins/`、`scripts/`、`tools/` | ドキュメント、ブランドアセット、適合性スイート、ライセンス文書、Claude Code プラグイン(`labs`、`aphrody-nhitl`)、スクリプト、ツール類。                                                                                                                     |

## ピンとライセンス

- ピンは `src.lock.json` のみです。`DEPS` と `.gitmodules` は `ay manifests` がここから生成します。`MAINTAINERS` は手作業で管理します。
- 自社コードのライセンスは MIT OR Apache-2.0 です(`LICENSE-MIT`、`LICENSE-APACHE`)。依存関係のポリシーは `deny.toml` と `docs/ARCHITECTURE.md` にあります。

## コマンド

Rust のコンパイルは CI かビルドホストで行い、ワークステーションでは行いません。

```sh
just doctor          # toolchain doctor
just arch-check      # architecture gate (ay arch check --strict for the strict form)
just lock            # lock the checkout in src.lock.json, then derive DEPS and .gitmodules
just manifests-check # derived manifests and gitlinks match src.lock.json
just env-doctor      # check the masked .env vault and editor auth wiring
just graph <path> <name>   # tree-sitter code graph into graphify-out/<name>
just deploy          # docker compose pull + up --wait on a host
just verify-all      # architecture gate, doctor, Bun suites, then ci.yml for Rust
```

## 参照先

| トピック                                         | ドキュメント                                                             |
| :----------------------------------------------- | :----------------------------------------------------------------------- |
| デザインシステムと UI                            | `docs/DESIGN_SYSTEM.md`、`docs/ui/STACK.md`、`packages/design/DESIGN.md` |
| メディア(`crates/tv-*`)                          | `docs/tv`                                                                |
| ゲームと Steam                                   | `docs/gaming/OWNERSHIP.md`                                               |
| Epic Games と Unreal Engine                      | `docs/epic/RESOURCES.md`、`docs/epic/TRACKING.md`                        |
| ゲームとクリエイティブスイート(計画段階、未着手) | `docs/games/PLAN.md`                                                     |
| デプロイ                                         | `docs/infra/DEPLOY.md`                                                   |

## Labs(2026-11-12 に統合)

Aphrody Labs はセルフホスト型プラットフォームの作業です。旧バイナリは現在 `ay conformance` になっています。

| パス                                          | 内容                                                                                |
| :-------------------------------------------- | :---------------------------------------------------------------------------------- |
| `crates/conformance`、`conformance/`          | 固定済みの適合性スイート、CLI `ay conformance`                                      |
| `crates/lore*`、`licenses/lore`、`tools/lore` | Lore VCS(MIT、取り込み済み)                                                         |
| `crates/apm`                                  | APM クレート                                                                        |
| `[patch.crates-io]`                           | `rev` で固定した aphrody-labs フォークのパッチ済みクレート(quinn-proto、glob-match) |
| `infra/chromium-factory`                      | Chromium ビルドファクトリー                                                         |
| `plugins/labs`                                | Claude Code プラグイン `labs`                                                       |

レシピ: `just lab-build`、`just lab-dev`、`just lab-conformance`。

================================================
FILE: i18n/zh-CN/README.md
================================================

[English source](../../../README.md)

# src

Aphrody 的单体仓库（monorepo）。贡献者与代理的约定见 [AGENTS.md](../../../AGENTS.md) 和 [CLAUDE.md](../../../CLAUDE.md)；目标架构见 [docs/ARCHITECTURE.md](../../ARCHITECTURE.md)，路线图见 [docs/STACK-ROADMAP.md](../../STACK-ROADMAP.md)。品牌、令牌与图标位于 [assets/brand](../../../assets/brand)（`ay brand build`），设计系统见 [packages/design](../../../packages/design/DESIGN.md)。

## 目录结构

| 目录                                                                              | 内容                                                                                                                                                                                                                              |
| :-------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`apps/`](../../../apps)                                                          | `aphrody`、`aphrody-app`、`auto`、`l2l`、`nt`、`r2-site`、`r2b`、`unixwin`、`yolo`，以及由 Aphrody 维护的两个社区站点 `rosegriffon` 和 `shenron`。`auto`、`r2b`、`rosegriffon`、`shenron` 是 git 子模块。                         |
| [`packages/`](../../../packages)                                                  | Bun `@aphrody/*` 包：`ai-os`（唯一的 AI 产品）、`core`、`deploy`、`design`、`env-kit`、`ffi-bridge`、`forge`、`gaming`、`wck` 等。                                                                                                |
| [`crates/`](../../../crates)                                                      | Rust 2024 crate，同属一个扁平的 Cargo 工作区：`ay`（仓库 CLI）、`archguard`、`xtask`、`depot-*`、`lore*`、`aphrody-ui`、`core`、`core-capi`、`ffi`、`rust-stack`、`tv-*`、`gamescope-*`、`steam-depot`、`conformance`、`apm` 等。 |
| [`infra/`](../../../infra)                                                        | 由上游工具组装的集群与部署配置（`docker`、`cluster`、`cloudflare`、`fleet`、`mesh-vn`、`chromium-factory` 等）。                                                                                                                  |
| [`third_party/`](../../../third_party)                                            | 上游检出与 aphrody-labs 分叉，由 [`src.lock.json`](../../../src.lock.json) 固定；分叉清单见 [`third_party/forks.txt`](../../../third_party/forks.txt)。不做本地修改。                                                             |
| `docs/`、`assets/`、`conformance/`、`licenses/`、`plugins/`、`scripts/`、`tools/` | 文档、品牌资源、一致性测试套件、许可证文本、Claude Code 插件（`labs`、`aphrody-nhitl`）、脚本与工具。                                                                                                                             |

## 锁定与许可证

- `src.lock.json` 是唯一的版本锁定来源；[`DEPS`](../../../DEPS) 与 [`.gitmodules`](../../../.gitmodules) 由 `ay manifests` 派生。[`MAINTAINERS`](../../../MAINTAINERS) 手工维护。
- 自有代码采用 MIT OR Apache-2.0（[LICENSE-MIT](../../../LICENSE-MIT)、[LICENSE-APACHE](../../../LICENSE-APACHE)）。依赖策略见 `deny.toml` 和 [docs/ARCHITECTURE.md](../../ARCHITECTURE.md)。

## 常用命令

Rust 在 CI 或构建主机上编译，不在工作站上编译。

```sh
just doctor          # 工具链诊断
just arch-check      # 架构检查（严格模式用 ay arch check --strict）
just lock            # 将检出锁定到 src.lock.json，并派生 DEPS 与 .gitmodules
just manifests-check # 派生清单与 gitlink 是否与 src.lock.json 一致
just env-doctor      # 检查脱敏的 .env 保险库与编辑器认证配置
just graph <path> <name>   # 生成 tree-sitter 代码图到 graphify-out/<name>
just deploy          # 在主机上执行 docker compose pull + up --wait
just verify-all      # 架构检查、doctor、Bun 测试，然后运行 Rust 的 ci.yml
```

## 延伸阅读

| 主题                                 | 文档                                                                                                                                                    |
| :----------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 设计系统与 UI                        | [docs/DESIGN_SYSTEM.md](../../DESIGN_SYSTEM.md)、[docs/ui/STACK.md](../../ui/STACK.md)、[packages/design/DESIGN.md](../../../packages/design/DESIGN.md) |
| 媒体（`crates/tv-*`）                | [docs/tv](../../tv)                                                                                                                                     |
| 游戏与 Steam                         | [docs/gaming/OWNERSHIP.md](../../gaming/OWNERSHIP.md)                                                                                                   |
| Epic Games 与 Unreal Engine 资料     | [docs/epic/RESOURCES.md](../../epic/RESOURCES.md)、[docs/epic/TRACKING.md](../../epic/TRACKING.md)                                                      |
| 游戏与创作套件（仅有计划，尚未开始） | [docs/games/PLAN.md](../../games/PLAN.md)                                                                                                               |
| 部署                                 | [docs/infra/DEPLOY.md](../../infra/DEPLOY.md)                                                                                                           |
| 会话记录                             | [docs/SESSION-LEDGER-2026-11-13.md](../../SESSION-LEDGER-2026-11-13.md)                                                                                 |

## Labs（2026-11-12 合并）

Aphrody Labs：自托管平台相关工作，其原二进制现为 `ay conformance`。

| 路径                                          | 内容                                                                   |
| :-------------------------------------------- | :--------------------------------------------------------------------- |
| `crates/conformance`、`conformance/`          | 固定版本的一致性套件，CLI 为 `ay conformance`                          |
| `crates/lore*`、`licenses/lore`、`tools/lore` | Lore VCS，已吸收（MIT）                                                |
| `crates/apm`                                  | APM crate                                                              |
| `[patch.crates-io]`                           | 以 `rev` 固定的 aphrody-labs 分叉补丁 crate（quinn-proto、glob-match） |
| `third_party/oils`                            | oils 分叉及其固定版本                                                  |
| `infra/chromium-factory`                      | Chromium 构建工厂                                                      |
| `plugins/labs`                                | Claude Code 插件 `labs`（[docs/PLUGIN.md](../../PLUGIN.md)）           |

相关命令：`just lab-build`、`just lab-dev`、`just lab-conformance`。

================================================
FILE: lore/README.md
================================================

# Lore documentation

Welcome to the Lore documentation. The pages below cover everything from your first install through the internal design, organized into a consistent structure that helps you find what you need.

## Get started

- [Quickstart](tutorials/quickstart.md) — create your first Lore repository.
- [System design](explanation/system-design.md) — how and why Lore works the way it does.
- [FAQ](faq.md) — answers to common questions.

## Working with Lore

Documentation for installing, using, and understanding Lore.

<div class="card-grid" markdown="1">

- [Tutorials](tutorials/README.md)

  Guided walkthroughs to learn by doing.

- [How-To guides](how-to/README.md)

  Goal-driven directions for getting things done.

- [Reference](reference/README.md)

  Authoritative descriptions of commands, file formats, and protocols.

- [Explanation](explanation/README.md)

  Why Lore works the way it does.

</div>

New here? The [FAQ](faq.md) answers the common questions, and the [roadmap](roadmap.md) shows where Lore is headed next.

## Working on Lore

Documentation for contributors and maintainers. These pages cover Lore's internals, the conventions its code follows, and the reasoning behind major design decisions.

- [Developing](developing/README.md). Contributor and maintainer docs.
  - [Internals](developing/internals/README.md). Implementation-detail reference.
  - [Code standards](developing/code-standards/README.md). Coding conventions.
  - [Documentation standards](developing/doc-standards/README.md). Documentation house style and Lore overrides.
  - [Architectural decision records](developing/decisions/README.md). Engineering decisions and the reasoning behind them.

================================================
FILE: lore/assets/fonts/README.md
================================================

# Bundled fonts

The font binaries in this directory are licensed under the
SIL Open Font License, Version 1.1 (OFL-1.1):

- **Inter** — Copyright © 2020 The Inter Project Authors
  (<https://github.com/rsms/inter>).
- **Recursive Mono** — Copyright 2019 The Recursive Project
  Authors (<https://github.com/arrowtype/recursive>).

The full OFL-1.1 text, with each font's copyright notice,
lives beside the binaries in this directory:

- `inter_v3.019.license`
- `recursive-mono_v1.085.license`

The OFL-1.1 license name, copyright, and license URL
(`http://scripts.sil.org/OFL`) are also embedded in each
woff2's `name` table — inspect with any font tool
(e.g. `fontTools`, `otfinfo`, macOS Font Book).

================================================
FILE: lore/developing/README.md
================================================

# Developing

Documentation for working _on_ Lore, not _with_ it.

## What this folder is

Contributor and maintainer docs, organized by purpose. Four subfolders: `internals/` for implementation-detail reference (byte layouts, struct formats, serialization specs), `code-standards/` for coding conventions, `doc-standards/` for the documentation house style, and `decisions/` for architectural decision records.

## Suggested starting points

- **Writing a Lore doc?** Start at [`doc-standards/writing-a-doc.md`](doc-standards/writing-a-doc.md).
- **Reviewing or self-validating a doc?** Open [`doc-standards/operational/review-checklist.md`](doc-standards/operational/review-checklist.md).
- **Looking for a coding convention?** See [`code-standards/`](code-standards/README.md).
- **Reviewing a code change?** Follow [`code-standards/code-review.md`](code-standards/code-review.md).
- **Looking for a past architectural decision?** See [`decisions/`](decisions/README.md).
- **Looking for implementation detail (byte layouts, internal protocols)?** See [`internals/`](internals/README.md).

See [docs/README.md](../README.md) for the full docs structure.

================================================
FILE: lore/developing/code-standards/README.md
================================================

# Code standards

Coding conventions governing how Lore source is written.

## What this folder is

Per-language, per-area conventions for error handling, logging, task spawning, testing, comments, and similar concerns. Each page is a Code-Standard doc — imperative rules paired with rationale, code examples, and reference tables.

## The standards

- [Engineering principles](engineering-principles.md). The values every rule in this folder follows from: performance, correctness by construction, simplicity, determinism, fault isolation, and observability.
- [Error handling](errors.md). Discrete `#[ffi_code]` types, per-module `#[error_set]` enums, forwarding between sets, FFI code allocation, and the no-`unwrap` rule.
- [Logging](logging.md). `tracing` for server and tool code, Lore macros for library code, and when to use each log level.
- [Task spawning](tasks.md). The `lore_spawn!` macros that keep `LORE_CONTEXT` propagating across async and blocking tasks.
- [Async futures](async-futures.md). What a future holds across its awaits, when to box, how to spawn, and how future sizes are tested and measured.
- [Testing](testing.md). Unit tests in each crate's `tests/unit/`, the `test-util` feature for what they cannot reach, async and smoke test patterns, and the test-independence rules that keep them isolated.
- [Comments and documentation](comments.md). Rust doc-comment expectations and when a code comment earns its place.
- [Code review](code-review.md). How to review a change: the guidance to review against, irreversible changes to escalate, performance issues to look for, and how to report findings.

## Suggested starting points

- **Writing a new Code Standard page?** Start at the [doc-standards walkthrough](../doc-standards/writing-a-doc.md).

See [docs/README.md](../README.md) for the full docs structure.

================================================
FILE: lore/developing/decisions/README.md
================================================

# Architectural decision records

Documents describing the various architectural decisions that have been made during the course of Lore development and the reasoning behind them.

ADRs are append-only and numbered sequentially. Filename pattern: `NNNNN-<slug>.md`. Required structure: Status, Context, Decision, Consequences.

## Suggested starting points

- **Documenting a new Architectural Decision?** Start at the [doc-standards walkthrough](../doc-standards/writing-a-doc.md).
- [ADR template](adr-template.md). Copy this when starting a new ADR.

See [docs/README.md](../README.md) for the full docs structure.

================================================
FILE: lore/developing/doc-standards/README.md
================================================

# Documentation standards

The house style for every Markdown doc in the Lore project. Use this folder when you're writing a new doc, reviewing one, or bringing an existing page into compliance.

## Start here

**Writing or contributing a doc?** Walk through [`writing-a-doc.md`](writing-a-doc.md) — a 10-minute on-ramp covering the rules that bind a small contribution, with depth pointers into the canon for substantial work. Items not in the on-ramp are maintainer concerns on second-pass review.

**Reviewing or self-validating a doc?** Open [`operational/review-checklist.md`](operational/review-checklist.md). Each item links back to the rule it enforces, so a failed check tells you exactly where to look.

## Reference

The walkthrough and the review checklist cite these by topic. Read them when something sends you here, or use them as lookup when you have a specific question.

### Canon

- [`canon/doc-types.md`](canon/doc-types.md). All seven Lore doc types — four user-facing (Tutorial, How-To, Reference, Explanation), three contributor (Internals, ADR, Code-Standard) — plus Landing pages.
- [`canon/language.md`](canon/language.md). Voice, mood, contractions, pronouns, word choice, branding, and link conventions.
- [`canon/format.md`](canon/format.md). Headings, lists, tables, bold/italic/code, callouts, and key combinations.

### Operational

- [`operational/filenames.md`](operational/filenames.md). Filename conventions and SEO basics.
- [`operational/accessibility-and-media.md`](operational/accessibility-and-media.md). Alt text, color, screen-reader pass, diagrams, and image conventions.
- [`operational/review-checklist.md`](operational/review-checklist.md). Pre-publish gating checklist (includes the open-source posture rules).
- [`operational/glossary-conventions.md`](operational/glossary-conventions.md). Rules for adding terms to the project glossary at `docs/glossary.md`.

### Tooling

- [`tools/README.md`](tools/README.md). The three linters — Vale (prose), markdownlint (structure), lychee (links) — with invocation, rules, and install. Tool configs live next to the README under `tools/vale/` and `tools/lychee/`.

## Authority

When two rules conflict, the higher entry wins. The [Microsoft Writing Style Guide](https://learn.microsoft.com/en-us/style-guide/welcome/) informed the foundation of these standards and is a useful reference for grammar, punctuation, and mechanics not addressed explicitly here. Lore also adds its own rules for vocabulary, product naming, and project-specific conventions. Where Lore style choices differ from the guide, they're documented at their topical homes with rationale.

1. [`canon/doc-types.md`](canon/doc-types.md). Doc-type definitions for both type families.
2. [`canon/language.md`](canon/language.md) and [`canon/format.md`](canon/format.md). Voice, language, structure, format.
3. [`operational/`](operational/). Pre-publish mechanics.

## Scope

These standards govern Lore's documentation house style.

**About Lore.** Lore is an open-source, distributed version control system built for binary-first workloads at scale.

**Audiences.** Lore docs serve developers running the `lore` CLI, integrators embedding Lore through the Rust API, the C API, or a language SDK, operators running Lore Server, and contributors working on the source. The user-facing folders (`tutorials/`, `how-to/`, `reference/`, `explanation/`) cover the first three; the contributor folders (`developing/internals/`, `developing/decisions/`, `developing/code-standards/`) cover the last.

**Repository conventions.**

- Lore docs live in `docs/` at the repository root and render through a static-site build configured at the project level.
- The top-level `README.md` is the entry point on the GitHub project page; everything else is in `docs/`.
- Lore is contributed to by a multi-organization community. A reader on the public internet must be able to follow every Tutorial and How-To end-to-end. The full open-source posture rules live in [`operational/review-checklist.md`](operational/review-checklist.md).

## Out of scope

These standards don't govern:

- **Per-crate `README.md` files** (such as `lore-server/README.md`).
- **Rust doc comments** (`///` in `.rs` files).
- **Brand- or product-specific style rules** that apply to other products outside Lore. Lore is its own product; rules tied to other products in any sponsor organization's portfolio don't apply unless a Lore doc directly references the product (rare, and discouraged by the evergreen rule in [`canon/language.md`](canon/language.md#third-party-brands)).
- **Consumer-facing content rules** (game-rating tone framings, marketing voice, in-game flavor text). Lore is a developer-and-operator product.
- **Authoring-tool-specific guidance** (proprietary excerpt macros, scheduled publishing, vendor-specific callout types, pagetree navigation, tool-managed metadata fields). Lore docs use plain Markdown idioms portable across static-site generators.
- **Sponsor-organization marketing or branding rules.** These standards cover Lore project conventions, not any sponsor organization's internal voice, marketing language, or brand guidelines.
- **Heavy media production rules** (per-page header, social, and thumbnail meta images; video recording specs; GIF authoring; design-tool templates; screenshot editing for product UI). Lore docs are text-first; code-first; the few rules that apply (lowercase filenames, no text baked into images, image on its own line beneath supporting prose) are in [`operational/accessibility-and-media.md`](operational/accessibility-and-media.md).

See [`docs/README.md`](../../README.md) for the full docs structure.

================================================
FILE: lore/developing/doc-standards/tools/README.md
================================================

---

title: Doc-standards tools
description: The three linters that maintain Lore documentation quality — Vale (prose), markdownlint (structure), lychee (links) — with usage, install, and rule details.
---

# Doc-standards tools

Three linters maintain Lore documentation quality. The tool configs live next to this README under `tools/<tool>/` so editor plugins discover them without configuration; this file documents how to invoke each tool, what it catches, and how to install it.

| Tool                                             | What it catches                                                                               | Config location                                |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| [Vale](#vale-prose-linting)                      | Prose: banned phrases, Git-isms, link text, product naming, sentence-case headings, and more. | `.vale.ini` (repo root) + `tools/vale/styles/` |
| [markdownlint](#markdownlint-structural-linting) | Structure: heading hierarchy, fence-tag presence, list rules, table mechanics.                | `.markdownlint-cli2.jsonc` (repo root)         |
| [lychee](#lychee-link-integrity)                 | Links: every internal and external link in the docs resolves.                                 | `tools/lychee/lychee.toml`                     |

## Run all three

The recommended pre-publish invocation:

```bash
bash scripts/docs-lint.sh
```

The script runs Vale, markdownlint-cli2, and lychee in sequence with the canonical arguments, prints a section per tool, continues through all three even when one fails (so you see every finding), and prints a summary at the end.

Behavior on missing linters:

- **Some missing.** The script warns on stderr for each missing linter, runs the others, and exits based on findings — the missing linters don't by themselves cause a non-zero exit. Useful for partial-install community contributors.
- **All missing.** The script exits non-zero (code 2) — a run with no signal isn't a clean check, and CI must catch a broken image.

Exit codes: `0` if every linter that ran was clean; `1` if a linter reported findings and none errored; `2` if a linter errored (couldn't run to completion) or no linter is installed locally. The end-of-run summary labels each tool `passed`, `FINDINGS`, `ERRORED`, or `missing` so a crash is never mistaken for a clean pass.

If you want to invoke a tool directly — for a scoped scan, alternate args, or to debug — see the per-tool sections below.

## Vale prose linting

[Vale](https://vale.sh/) is a syntax-aware prose linter. The Lore Vale config uses a single `Lore` style package authored in this repo, incorporating rules derived from the Microsoft Writing Style Guide alongside Lore-specific rules. Two style-guide rules are disabled because Lore diverges from them; each divergence is documented at its topical home in [`canon/format.md`](../canon/format.md) (em-dash spacing) and [`canon/language.md`](../canon/language.md) (project-voice "we").

### Recommended invocation

```bash
vale --glob='!*-template.md' docs/
```

Auto-discovers `.vale.ini` at the repo root. The `--glob` exclusion skips `*-template.md` scaffolding — the same files lychee excludes (see [Scope](#scope)). A root `README.md` joins the target set once it exists.

> [!TIP]
> Use `bash scripts/docs-lint.sh` as the standard pre-publish command. The script automatically expands the target set when additional doc trees are present.

### What it catches

**Lore package**: Lore-specific rules plus ~30 rules derived from the Microsoft Writing Style Guide, covering capitalization (sentence-case headings), gender-neutral language, Oxford comma, hyphenation, weasel words, passive-voice flags, and wordiness. Two style-guide rules are disabled as documented divergences: `Lore.Dashes`, `Lore.We`. Each rule's `link:` field points to the canonical prose section, so a writer hitting a finding clicks through to the rule's home.

| Rule                            | Catches                                                                                                                                                                             | Severity | Documented in                                                                                      |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | -------------------------------------------------------------------------------------------------- |
| `Lore.Difficulty`               | Difficulty-claim register: `Just <verb>` / `simply <verb>` imperative softeners, `easily <verb>` / `easily <X>-able` passive ease claims, `all you have to do is`, bare `obviously` | warning  | [`language.md` § Difficulty descriptors](../canon/language.md#difficulty-descriptors)              |
| `Lore.PermissionVerbs`          | `allows you`, `lets you`, `permits the user`, `enables users`                                                                                                                       | warning  | [`language.md` § Permission verbs](../canon/language.md#permission-verbs)                          |
| `Lore.LinkText`                 | `[click here]`, `[here]`, `[this]`, `[read more]`, `[link]` as link text                                                                                                            | error    | [`language.md` § Link text](../canon/language.md#link-text)                                        |
| `Lore.Dropdown`                 | `drop-down`, `drop down` → `dropdown`                                                                                                                                               | warning  | [`language.md` § Other terms to avoid](../canon/language.md#other-terms-to-avoid)                  |
| `Lore.ClickOn`                  | `click on`, `right-click on`, `double-click on` → drop the trailing `on`                                                                                                            | warning  | [`language.md` § Action verbs](../canon/language.md#action-verbs)                                  |
| `Lore.AndOr`                    | `and/or`, `either/or` (rewrite to `and` or `or`)                                                                                                                                    | warning  | [`language.md` § Other terms to avoid](../canon/language.md#other-terms-to-avoid)                  |
| `Lore.Boolean`                  | lowercase `boolean` / `booleans` → `Boolean` / `Booleans`                                                                                                                           | warning  | [`language.md` § Other terms to avoid](../canon/language.md#other-terms-to-avoid)                  |
| `Lore.VsAbbrev`                 | `VS`, `vs.`, `VS.` → `vs` (lowercase, no period)                                                                                                                                    | warning  | [`language.md` § Other terms to avoid](../canon/language.md#other-terms-to-avoid)                  |
| `Lore.HyphenLy`                 | hyphenated `-ly` adverb compounds (`fully-qualified`)                                                                                                                               | warning  | [`format.md` § Hyphenation](../canon/format.md#hyphenation)                                        |
| `Lore.GitIsmSubstitutions`      | `HEAD` → `latest`, `working copy` → `working tree`, `git index` → `stage`, `git pull`/`git fetch` → `lore sync`                                                                     | warning  | [`language.md` § Lore vocabulary, not Git-isms](../canon/language.md#lore-vocabulary-not-git-isms) |
| `Lore.GitIsmFlagged`            | `detached HEAD`, `git stash`/`stashed`/`stashing`, `refspec`, `reflog`, `submodule` (needs writer judgment — no analog or multiple analogs depending on intent)                     | warning  | [`language.md` § Lore vocabulary, not Git-isms](../canon/language.md#lore-vocabulary-not-git-isms) |
| `Lore.PerforceIsmSubstitutions` | `changelist` → `revision`, `p4 integrate` → `lore branch merge`, `p4 sync` → `lore sync`, `p4 submit` → `lore commit`, `p4 revert` → `lore reset`                                   | warning  | [`language.md` § Lore vocabulary, not Git-isms](../canon/language.md#lore-vocabulary-not-git-isms) |
| `Lore.PerforceIsmFlagged`       | `depot`, `depot path`, `shelve`/`unshelve`, `p4 client`, `p4 stream` (no Lore analog)                                                                                               | warning  | [`language.md` § Lore vocabulary, not Git-isms](../canon/language.md#lore-vocabulary-not-git-isms) |
| `Lore.MkDocsAdmonitions`        | `!!! note`, `!!! tip`, `!!! warning` (legacy MkDocs syntax)                                                                                                                         | error    | [`format.md` § Callouts and admonitions](../canon/format.md#callouts-and-admonitions)              |
| `Lore.MkDocsTabs`               | Raw pymdownx tab syntax (`=== "..."`, `/// tab \|`) instead of the comment-delimited tab convention                                                                                 | error    | [`format.md` § Content tabs](../canon/format.md#content-tabs)                                      |
| `Lore.AlertTypes`               | Non-GFM alert types: `> [!INFO]`, `> [!DANGER]` (the five GFM-native types — `NOTE`, `TIP`, `IMPORTANT`, `WARNING`, `CAUTION` — are all allowed)                                    | warning  | [`format.md` § Callouts and admonitions](../canon/format.md#callouts-and-admonitions)              |
| `Lore.ProductNaming`            | `the Lore tool`, `the Lore CLI`                                                                                                                                                     | warning  | [`language.md` § Lore product naming](../canon/language.md#lore-product-naming)                    |
| `Lore.AmericanSpelling`         | `cancelling`, `colour`, `defence`, `whilst`, `backwards`, `towards`, +14 others                                                                                                     | warning  | [`language.md`](../canon/language.md)                                                              |
| `Lore.BlackWhiteList`           | `blacklist` → `denylist`, `whitelist` → `allowlist`                                                                                                                                 | error    | [`language.md` § Other terms to avoid](../canon/language.md#other-terms-to-avoid)                  |
| `Lore.NativeCode`               | `native code` → `unmanaged code`                                                                                                                                                    | warning  | [`language.md` § Other terms to avoid](../canon/language.md#other-terms-to-avoid)                  |
| `Lore.LatinAbbrev`              | `i.e.`, `e.g.`, `etc.`, `cf.`, `n.b.`                                                                                                                                               | warning  | [`language.md` § No Latin abbreviations](../canon/language.md#no-latin-abbreviations)              |

The link paths in each rule's YAML are repo-relative. They render as clickable paths in editor plugins. Once the doc site is live, batch-substitute to absolute URLs.

### Scope

Vale lints prose only. The config excludes:

- **Code spans** (` `inline` `) and inline code formatting (`tt`).
- **Code blocks** (` ``` ` fenced or indented).
- **YAML frontmatter** at the top of every doc.

A code block containing `simply` doesn't fire `Lore.Difficulty`, and frontmatter values don't get linted.

**Template files** (`*-template.md`) are skipped too, but at the invocation level (the `--glob` flag above) rather than by `.vale.ini`: their placeholder and boilerplate content (`{title of option 1}`, illustrative `e.g.`, MADR section headings) isn't authored prose. lychee excludes the same files.

### Severity

`MinAlertLevel = warning` surfaces both errors and warnings; suggestions are quiet by default. Each `Lore.*` rule sets its own `level:` based on how Lore weighs the underlying rule.

### Project vocabulary

Vale's bundled English wordlist is conservative — it flags morphologically derived words (`reframed`, `relitigating`, `deduplicated`, `lowercased`), plurals of compound nouns (`hostnames`), and domain jargon (`lede`, `frontmatter`, `ADRs`) that Lore docs use intentionally.

The Lore project vocabulary lives at `tools/vale/styles/config/vocabularies/Lore/accept.txt` (one term per line). `.vale.ini` loads it via the `Vocab = Lore` directive. To accept a new technical term, add it to that file and re-run Vale; no code changes elsewhere.

Add a term only when it's a real word the docs use intentionally. If you find yourself adding misspellings, fix the prose instead.

### Install

```bash
brew install vale
```

Or download a release binary from <https://github.com/errata-ai/vale/releases>. Verify:

```bash
vale --version
```

## markdownlint structural linting

[markdownlint-cli2](https://github.com/DavidAnson/markdownlint-cli2) catches structural issues in Markdown — heading hierarchy, fence-tag presence, list ordering, table structure, multiple H1s, and similar mechanics.

### Recommended invocation

```bash
markdownlint-cli2 "docs/**/*.md" "README.md"
```

Auto-discovers `.markdownlint-cli2.jsonc` at the repo root. No `--config` flag needed.

> [!TIP]
> Use `bash scripts/docs-lint.sh` as the standard pre-publish command. The script automatically expands the target set when additional doc trees are present.

### What it catches

The config enables markdownlint's full default ruleset. The most useful rules for Lore docs:

| Rule    | Catches                                           |
| ------- | ------------------------------------------------- |
| `MD001` | Heading levels skip (H2 → H4 with no H3).         |
| `MD003` | Mixed heading styles (Setext vs ATX).             |
| `MD009` | Trailing whitespace.                              |
| `MD012` | Multiple consecutive blank lines.                 |
| `MD022` | Headings not surrounded by blank lines.           |
| `MD025` | More than one H1 in a page.                       |
| `MD031` | Fenced code blocks not surrounded by blank lines. |
| `MD034` | Bare URLs that should be Markdown links.          |
| `MD040` | Code fences without a language tag.               |
| `MD046` | Indented code blocks (use fenced).                |
| `MD048` | Inconsistent fence style.                         |
| `MD056` | Tables with mismatched column counts.             |

Full rule list: <https://github.com/DavidAnson/markdownlint/blob/main/doc/Rules.md>.

### Rule choices

The Lore config disables two rules and tweaks two. Every other rule is at its default.

| Rule                               | Setting                  | Why                                                                                                                                                                                                                                                                                                    |
| ---------------------------------- | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `MD013` (line length)              | disabled                 | Lore docs don't enforce a hard wrap. Prose wraps for the reader's editor.                                                                                                                                                                                                                              |
| `MD033` (no inline HTML)           | disabled                 | Templates use HTML comments (`<!-- delete after copying -->`). Lore docs author no other inline HTML.                                                                                                                                                                                                  |
| `MD024` (no duplicate headings)    | `siblings_only: true`    | Type templates legitimately repeat H3s ("Definition," "When to Use It") across H2 sections. Duplicates within the same H2 still fail.                                                                                                                                                                  |
| `MD025` (single top-level heading) | `front_matter_title: ""` | The Lore standards require a body H1 that matches frontmatter `title`. markdownlint's default counts the frontmatter title as a heading and flags the body H1 as a duplicate. Disabling the frontmatter scan keeps the rule enforcing "one body H1 per page" without false-firing on the matched pair. |

### Install

```bash
brew install markdownlint-cli2
```

Linux, Windows, or any environment without Homebrew:

```bash
npm install -g markdownlint-cli2
```

Verify:

```bash
markdownlint-cli2 --version
```

### Output

By default, markdownlint-cli2 prints a human-readable list of findings: file, line, rule, message. The exit code is non-zero if any rule fires.

For tooling integrations:

```bash
markdownlint-cli2 --output-format json "docs/**/*.md"
```

## Lychee link integrity

[Lychee](https://github.com/lycheeverse/lychee) validates that every link in the Lore documentation resolves: internal relative paths, anchors, and external URLs.

### Recommended invocation

To check the whole documentation tree:

```bash
lychee --config docs/developing/doc-standards/tools/lychee/lychee.toml docs/
```

This is the **only invocation that catches every kind of breakage**, including links broken by moving or renaming a file. Use it when you've moved a doc, renamed a page, restructured a folder, or want to know whether the docs are clean.

> [!TIP]
> Use `bash scripts/docs-lint.sh` as the standard pre-publish command. The script automatically expands the target set when additional doc trees are present.

### How lychee scans

Lychee is a one-way scanner. It reads the inputs you give it, extracts every link in those files, and verifies each one resolves. It has no reverse index — no concept of "what links to this file?"

That means:

- A scan of a single file catches only _outgoing_ breakage from that file. If you renamed `docs/explanation/old-name.md` to `new-name.md`, scanning only `new-name.md` won't tell you that `docs/tutorials/foo.md` still links to the old path.
- To catch breakage from moves and renames (by far the most common cause of broken links), scan the whole tree. This is what the recommended invocation above does.

If you only want to check the links _outgoing from_ a doc you're currently editing, see [Advanced: scoped scans](#advanced-scoped-scans). Be aware of what it doesn't cover.

### Output

By default, lychee prints a human-readable summary. To produce machine-parseable output (useful for tooling integrations):

```bash
lychee --config docs/developing/doc-standards/tools/lychee/lychee.toml \
       --format json --output - docs/
```

The cache lives at `.lycheecache` in the repo root and persists between runs. The first whole-tree pass is ~1–2 minutes against the current doc set; subsequent passes return in seconds when the cache is warm.

### No internal-domain allowlist

Lore docs under `docs/` are public-facing. The `exclude` list in `lychee.toml` does **not** include internal-org hostnames (sponsor-org GitHub Enterprise, internal wikis, internal infrastructure subdomains). An internal link appearing under `docs/` is a failure by design — replace it with a public link or remove it before merge.

The `exclude` list only carries non-org-revealing entries: `localhost`/loopback (tutorials reference these intentionally), `google.com` (canon samples), and the access-gated Unreal Engine source repository on GitHub, which returns 404 until the reader links their Epic Games and GitHub accounts. Internal doc trees not present in the public repository are handled automatically by `scripts/docs-lint.sh`.

### Advanced scoped scans

If you only want to validate the outgoing links of a single file you've recently edited, and you accept that no backlinks elsewhere will be checked:

```bash
lychee --config docs/developing/doc-standards/tools/lychee/lychee.toml docs/path/to/your-doc.md
```

It doesn't catch breakage from _other_ docs whose links may now be stale. Don't use it as a standalone before-merge check.

### Install

Lychee isn't vendored. Install it with one of:

```bash
brew install lychee
cargo install lychee
```

Then verify:

```bash
lychee --version
```

If link-checking moves into CI, set the `GITHUB_TOKEN` environment variable so the GitHub API isn't rate-limited; lychee picks it up automatically.

## Adding a tool

When adding a new linter:

1. Create `tools/<tool>/` for the tool's config (and any auxiliary files).
2. Add a section to this README following the same shape: recommended invocation, what it catches, install, scope/config notes.
3. Update the table at the top of this file.
4. If automation consumes the tool, document the integration point alongside that automation.

================================================
FILE: lore/developing/internals/README.md
================================================

# Internals

Implementation-detail reference: how Lore is built under the hood.

## What this folder is

Precise technical descriptions of Lore's source: byte layouts, struct formats, serialization specs, internal protocols. Austere, authoritative, descriptive only. No instruction or explanation; just how the machinery is built.

## What you'll find here

- [File I/O engine](file-io-engine.md) — the `lore-io` driver, buffer ownership, syscall pool, and the plan for replacing `std::fs` and `tokio::fs`.
- [Parallel path staging](parallel-path-staging.md) — how `lore stage` normalizes a target set, pre-creates the directories targets share, and fans the walks out.
- [State node architecture](state-node-architecture.md) — how a `State` holds its revision tree in node blocks, and how the node operations change it under concurrent writers: the tiers, the block locks, the checks under them, saving, and sweeping detached slots.

## Suggested starting points

- **Writing a new Internals page?** Start at the [doc-standards walkthrough](../doc-standards/writing-a-doc.md).

See [docs/README.md](../../README.md) for the full docs structure.

================================================
FILE: lore/explanation/README.md
================================================

# Explanation

Conceptual writing about why Lore works the way it does.

## What this folder is

Explanation is the _why_ of Lore. These pages make connections, give context, and dig into the choices and history behind the design. They're about understanding, not about getting a task done.

## What you'll find here

- [System design](system-design.md) — the rationale, goals, and full architecture of Lore in one document: why Lore exists and the problems it solves, the revision graph and content-addressed storage, and the on-disk formats and protocols.

## Suggested starting points

- **Writing a new Explanation page?** Start at the [doc-standards walkthrough](../developing/doc-standards/writing-a-doc.md).
- [Explanation template](explanation-template.md). Copy this when starting a new Explanation.

See [docs/README.md](../README.md) for the full docs structure.

================================================
FILE: lore/how-to/README.md
================================================

# How-To guides

Goal-driven directions for getting a specific task done.

## What this folder is

How-To guides are directions. Each one walks through a specific problem or toward a particular result. They assume you're already familiar with the basics. If you're still learning, start with tutorials.

## Guides

- [Install the Lore CLI](install-lore-cli.md) — get the `lore` binary onto your PATH and ready to use.
- [Deploy a local Lore Server](deploy-local-lore-server.md) — stand up a single-host Lore Server you can push to and clone from.
- [Run parallel instances over a shared store](run-parallel-instances-over-a-shared-store.md) — Lore's equivalent of worktrees: keep many working trees of a repository over one store, and move, prune, and remove them.
- [Use virtual clones on Linux](use-virtual-clones-on-linux.md) — clone a repository as a FUSE mount the Lore service serves, get your clones back after the service stops, and move and remove them.
- [Run a machine server for containers](run-a-machine-server-for-containers.md) — serve the containers of a build machine from one Lore server and one content cache, each container through a socket of its own.
- [Write view filters and ignore files](write-view-filters-and-ignore-files.md) — choose what reaches your working tree and what you can commit, with one rule syntax.

## Suggested starting points

- **Writing a new How-To?** Start at the [doc-standards walkthrough](../developing/doc-standards/writing-a-doc.md).
- [How-To template](how-to-template.md) — copy this when starting a new How-To guide.

See [docs/README.md](../README.md) for the full docs structure.

================================================
FILE: lore/proposals/README.md
================================================

# Lore Enhancement Proposals

This directory holds **Lore Enhancement Proposals (LEPs)** — public-facing
proposals for changes to the Lore wire protocol, on-disk
format, public APIs (CLI, capi, JS bindings), and cross-cutting features. LEPs are where the design is debated; ADRs in
[`../developing/decisions/`](../developing/decisions/README.md) record narrow architecture
decisions after they are made.

## Lifecycle

LEPs use a three-state lifecycle:

- **Draft** — being authored or under review.
- **Accepted** — approved; its implementation may be merged.
- **Rejected** — evaluated and not pursued. Rejected LEPs stay in-tree as historical record.

An accepted LEP changes through an amendment: a review that edits the LEP in place, discussed in public like a new LEP. The LEP stays `Accepted`, and the amendment sets `updated` to the date it merges. To reverse an accepted decision rather than refine it, write a new LEP that sets `replaces`.

Filenames follow the `YYYY-MM-DD-kebab-name.md` convention.

## How to write an LEP

Copy [`lep-template.md`](lep-template.md) to `YYYY-MM-DD-<your-slug>.md` in this directory and fill each section, using the rules below as a guide. Open it for review when you're ready — reviewers will look for the same things.

### Throughout the proposal

These apply across every section.

- **Active voice.** Write "this proposal rejects approach X", not "approach X was rejected"; "Lore writes the new version", not "the new version is written by Lore". Past-participle adjectives ("the upgraded client", "the proposed design") are fine.
- **Public citations.** LEPs are public. Support every factual claim either with a public link (RFC, code path in the Lore tree, a public ADR, an upstream project doc) or by capturing the relevant detail inline. Internal-only resources (internal code reviews, JIRA tickets, Slack threads, internal wikis) can't be shared externally and shouldn't be included in the LEP — they don't substitute for support in the body.
- **Discussion link.** The `discussion` frontmatter field is optional. When set, it links to a public discussion of the proposal, such as a public pull request or issue. Leave it out rather than link an internal review or thread.
- **Ground every claim.** If you can't back something up with research, prior discussion, or the proposal itself, leave it out rather than filling space.
- **One decision per proposal.** Propose one change that can be accepted on its own. When parts of a proposal have their own goals, risks, and compatibility surface, write a proposal for each, so that accepting one doesn't decide the others. A change to an accepted proposal is an amendment to it, as [Lifecycle](#lifecycle) describes.
- **Lore terms.** Use the terms the [glossary](../glossary.md) defines, in the sense it defines them. Don't give a defined term a second meaning.

### Summary

- One paragraph.
- Written for a reader unfamiliar with the area.

### Motivation

- Describe the problem this solves and why it matters now: the incident, limitation, user need, or external pressure that prompted the proposal.
- Stay on the problem. Save the solution for Proposed Design.

### Goals / Non-Goals

- Goals are the outcomes you want this proposal to achieve. Each one should be addressed in Proposed Design.
- Non-Goals are adjacent problems explicitly out of scope. They're useful when scope creep comes up during review.
- Skip toothless Non-Goals — items so obvious nobody would expect them.

### Proposed Design

- Aim for the level of detail that makes the case for your Goals. Implementation detail belongs in a downstream spec.
- State the properties the design guarantees: what it does, what it refuses, and what holds after a failure. Leave out how the implementation achieves them: the names of functions, types, and files that aren't a compatibility surface, constants such as shard counts and buffer sizes, which struct owns which state, and the order of steps inside a command. A constant that an on-disk or wire format fixes belongs in [Compatibility](#compatibility).
- For each Goal, point to the part of the design that addresses it. If a Goal has no matching design, either move it to Non-Goals or extend the design.
- Every problem you raised in Motivation should be addressed somewhere here. Design content that traces back to neither a Motivation problem nor a Goal is probably over-scoped.

### Compatibility

If your proposal touches an external surface, answer the questions below. Use `N/A` when a sub-section doesn't apply (a short reason after the dash helps reviewers but isn't required). Add custom sub-sections for any other compatibility surface your proposal touches (configuration formats, environment variables, third-party library APIs, plugin interfaces).

- **Wire format** — Can a v(N-1) peer decode messages produced by v(N)? Can v(N) decode v(N-1)? What changes in serialization, framing, compression, or byte layout?
- **Client/server protocols** — What new or changed RPCs, request/response shapes, message types, or authentication flows does this introduce? What does an old client see when it talks to a new server, and vice versa?
- **On-disk format** — Can an upgraded Lore read existing repositories? Can a downgraded Lore read data written by the new version? What fragment-flag, index, or schema changes apply?
- **CLI and public API** — What changes in `lore` subcommand syntax, exit codes, output format, or the surface of `lore-capi` / JS bindings? What breaks for existing scripts and integrations?

When a sub-section isn't `N/A`, be concrete — specific bits, specific commands, specific protocol fields. Vague answers like "there will be some impact" don't give reviewers much to work with.

### Non-Functional Considerations

For each property below, answer the question. If your proposal preserves the property, say so in a line. If it changes the property, name the impact and how the design handles it. Add custom sub-sections for any other non-functional concern (latency, throughput, durability, ordering guarantees, backpressure, error budgets).

- **Concurrency** — How does the proposal behave under concurrent reads, writes, commits, syncs, and merges?
- **Memory** — Does the proposal require buffering data proportional to repository or file size, or does it preserve Lore's streaming and sparse-data-structure model?
- **Statelessness** — Does the proposal introduce process- or library-level state that survives across operations?
- **Determinism** — Do the same inputs continue to produce the same outputs, including history?

### Migration Plan

- Needed when any Compatibility sub-section flags a breaking change.
- Name the transition phases (e.g. dark launch, early transition, late transition).
- For each phase, describe the read/write compatibility matrix and the tooling, flags, telemetry, and operational guidance users will need.
- Cover rollback: what observable signal triggers it, and what state is recoverable.
- If no breaking changes are involved, write `N/A — no breaking changes, no migration required.`

### Security Considerations

- Whether this changes the trust model.
- Whether a malicious peer or crafted repository can abuse the new behavior.
- Whether any new data is integrity- or confidentiality-sensitive.
- If your proposal has no security implications, say so and explain why — bare `N/A` isn't enough.

### Privacy Considerations

- What new user data, identifiers, file paths, or metadata become visible to other parties — server operators, peers, telemetry pipelines, logs.
- Whether the change affects the ability to delete, redact, or expire data.
- If your proposal has no privacy implications, say so and explain why — bare `N/A` isn't enough.

### Risks and Assumptions

Use two sub-headed lists.

- **Assumptions** — premises that, if wrong, would invalidate the proposal. Each carries an `*invalidated if:*` clause.
- **Risks** — things that could go wrong even if the assumptions hold. Each carries a `*mitigation:*` clause (or explicit acceptance).
- Keep these specific to your proposal. Generic risks like "this could have unexpected interactions" or "performance might be worse" don't add much.

### Drawbacks

- Real costs of this approach.
- Not premises that could be wrong (those are Assumptions). Not failure modes (those are Risks).
- One sentence each.
- Skip generic hedges like "more code to maintain" or "may require documentation updates".

### Alternatives Considered

- At least two alternatives, each with a concrete reason for rejection.
- Include the status quo if it's relevant.
- "This would be harder" isn't a reason — be specific about what makes the chosen approach better.

### Prior Art

- How other systems (Git, Mercurial, Perforce, Jujutsu, Pijul, Sapling, etc.) handle this problem, what's worth borrowing, and what's worth avoiding.
- Optional — leave the section out if no precedent applies.

### Unresolved Questions

- Open questions to resolve during review.
- Empty (or down to follow-up tickets) by the time the LEP is `Accepted`.

================================================
FILE: lore/reference/README.md
================================================

# Reference

Authoritative, lookup-oriented descriptions of Lore's commands, file formats, and protocols.

## What this folder is

Reference is the technical description of the machinery and how to operate it. Austere, neutral, factual. No instruction or explanation embedded; if you want to learn, the tutorials folder is the place, and if you want the why, see explanation.

## Reference pages

- [Lore CLI command reference](lore-cli-commands.md) — every `lore` command, subcommand, argument, and flag, generated from `lore --markdown-help`.
- [Lore CLI configuration reference](lore-cli-config.md) — every field in the per-repository `config.toml` and user-level `cli.toml`, with each field's type, default, and on-disk location.
- [Lore Server configuration reference](lore-server-config.md) — every `loreserver` CLI flag, config-file layer, and settings field, including the AWS, DynamoDB, Consul, and hook plugin backends.

## Suggested starting points

- **Writing a new Reference page?** Start at the [doc-standards walkthrough](../developing/doc-standards/writing-a-doc.md).
- [Reference template](reference-template.md). Copy this when starting a new Reference.

See [docs/README.md](../README.md) for the full docs structure.

================================================
FILE: lore/release-notes/README.md
================================================

# Unreleased release notes

Each change adds one note here instead of editing `docs/release-notes.md`, so changes never
conflict over the same lines. When a release is cut, the release tooling collects the notes into
its section of `docs/release-notes.md` and deletes them.

## When to add a note

Add a note for every change to what Lore does, for anyone who runs the client, operates a server,
or builds on its API or data. That includes changes that aren't visible on the command line:
server behaviour, authentication and authorization, replication and storage, the protocol, the
revision data structures such as the merkle tree, performance and resource use, logging and
telemetry, and configuration. A refactor counts when it changes observable behaviour, timing,
errors or resource use.

Skip the note only when the change touches nothing that ships: tests, CI, build scripts and
developer tooling, documentation other than release notes, formatting, or a refactor that leaves
behaviour, output and stored data exactly as they were.

## Adding a note

Copy [`_template.md`](_template.md) to `docs/release-notes/<summary>.md`:

- Name it after what changed, in a few lowercase words joined by hyphens, such as
  `sync-keeps-view-escapes.md`. Don't name it after a branch, a ticket or a person.
- Set `type`. The release puts the note under the matching heading.
- Write the bullets as they should read in the release notes, each as
  ``- `code-area`: description``, where the code area is the crate or component that changed,
  such as `lore-server`. Continuation
  lines are indented by two spaces, and there are no blank lines between bullets. Remove the
  template's comments.
- Describe the effect that a user, an operator or an integrator sees: the command, the behaviour,
  the result. Leave out crate-internal functions and types, byte sizes and mechanics.

Later work on the same change edits the same note.

## Types

- `breaking`: something built, scripted or stored against an earlier release stops working, or
  needs a migration. That covers the public C API (`lore.h`, its events and error codes); CLI
  commands, flags, output and exit codes; the wire protocol (protobuf definitions and the QUIC
  format); the format of stored data (the immutable store, `.lore/` files, metadata); server
  configuration; and limits or defaults that existing data depends on, such as chunking and
  compression. The code-review standard's
  [Irreversible changes](../developing/code-standards/code-review.md#irreversible-changes) lists
  the same classes. Say what a user, operator or integrator has to do.
- `feature`: a new capability, such as a command, flag, C API function, RPC or configuration
  option.
- `improvement`: existing behaviour is faster, uses less, scales further or is clearer, on the
  client or the server, including storage, replication and data structures.
- `fix`: something that was wrong now works. Start with "Fixed" and describe the symptom.

## Entries from before note files

Entries written into the `## Nightly` section of `docs/release-notes.md` before these notes existed
stay where they are: the next release turns that section into its own and adds the notes to it.

================================================
FILE: lore/tutorials/README.md
================================================

# Tutorials

Guided walkthroughs for your first hands-on experience with Lore.

## What this folder is

Tutorials are lessons. They teach by doing. You'll work through realistic examples and pick up skill along the way. Tutorials aren't the place for the why or for full lookup tables; they're learning-oriented.

## Suggested starting points

- **New to Lore?** Start with the [quickstart](quickstart.md) — download the binaries, start a local server, and run the full core loop end-to-end.
- **Using Unreal Editor?** Follow [Getting started with Lore for Unreal Editor](getting-started-with-lore-for-unreal-editor.md) to connect a project and submit an asset.
- **Commands feeling slow to start?** Work through [running commands through the background service](run-commands-through-the-service.md) — turn the service on, watch a command be carried out by it, and override that for one command.
- **Cloning large trees on Linux?** Work through [working in a virtual clone](work-in-a-virtual-clone.md) — clone without writing files, then edit, commit, sync, switch branches, reset and merge as in an ordinary working tree.
- **Writing a new Tutorial?** Start at the [doc-standards walkthrough](../developing/doc-standards/writing-a-doc.md).
- [Tutorial template](tutorial-template.md). Copy this when starting a new Tutorial.

See [docs/README.md](../README.md) for the full docs structure.

================================================
FILE: profile/github/aphrody-dev/README.md
================================================

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://cdn.aphrody.com/brand/v1/logo/aphrody-dev-wordmark-dark.svg">
  <img alt="Aphrody Dev" src="https://cdn.aphrody.com/brand/v1/logo/aphrody-dev-wordmark-light.svg" height="56">
</picture>

I build systems software in Rust and Bun and maintain the [aphrody-labs](https://github.com/aphrody-labs)
monorepo, [aphrody-labs/src](https://github.com/aphrody-labs/src). Upstream first: fixes go to the
projects they belong to.

### Upstream pull requests

| Project                                   | Pull request                                                                                                                                              | State |
| :---------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------- | :---- |
| oven-sh/bun                               | [#48787](https://github.com/oven-sh/bun/pull/48787) build: pass the .bind.ts schema list to the codegen scripts in a file                                 | open  |
| oven-sh/bun                               | [#48786](https://github.com/oven-sh/bun/pull/48786) docs: sizes Bun.gzipSync and Bun.deflateSync give for the utils examples                              | open  |
| oven-sh/bun                               | [#48784](https://github.com/oven-sh/bun/pull/48784) build: xwin 0.10.0, which reads the current Visual Studio manifest                                    | open  |
| agentclientprotocol/agent-client-protocol | [#2804](https://github.com/agentclientprotocol/agent-client-protocol/pull/2804) docs(protocol): mark availableCommands as required in slash commands page | open  |
| a2aproject/A2A                            | [#2452](https://github.com/a2aproject/A2A/pull/2452) docs(spec): add required messageId to Message examples                                               | open  |

<sub>State as of 2026-11-13 (<code>docs/profile/stats.json</code>).</sub>

### Projects

<!-- projects:start (generated by docs/profile/projects.ts) -->
<table>
<tr>
<td width="33%" valign="top"><a href="https://github.com/aphrody-labs/src/tree/main/crates/ay"><img src="https://cdn.aphrody.com/brand/v1/icons/ay/icon.svg" width="40" height="40" alt=""></a><br><b><a href="https://github.com/aphrody-labs/src/tree/main/crates/ay">ay</a></b><br><sub>One multicall CLI for the monorepo</sub></td>
<td width="33%" valign="top"><a href="https://github.com/aphrody-labs/src/tree/main/apps/nt"><img src="https://cdn.aphrody.com/brand/v1/icons/nt/icon.svg" width="40" height="40" alt=""></a><br><b><a href="https://github.com/aphrody-labs/src/tree/main/apps/nt">nt</a></b><br><sub>This machine's Windows NT, rendered entirely by the GPU</sub></td>
<td width="33%" valign="top"><a href="https://github.com/aphrody-labs/src/tree/main/packages/ai-os"><img src="https://cdn.aphrody.com/brand/v1/icons/ai-os/icon.svg" width="40" height="40" alt=""></a><br><b><a href="https://github.com/aphrody-labs/src/tree/main/packages/ai-os">ai-os</a></b><br><sub>Agent core, model bridge, relay and TUI in one Bun package</sub></td>
</tr>
<tr>
<td width="33%" valign="top"><a href="https://github.com/aphrody-labs/src/tree/main/packages/ai-os/src/relay"><img src="https://cdn.aphrody.com/brand/v1/icons/relay/icon.svg" width="40" height="40" alt=""></a><br><b><a href="https://github.com/aphrody-labs/src/tree/main/packages/ai-os/src/relay">relay</a></b><br><sub>MCP, A2A and ACP relay of ai-os</sub></td>
<td width="33%" valign="top"><a href="https://github.com/aphrody-labs/src/tree/main/apps/unixwin"><img src="https://cdn.aphrody.com/brand/v1/icons/unixwin/icon.svg" width="40" height="40" alt=""></a><br><b><a href="https://github.com/aphrody-labs/src/tree/main/apps/unixwin">unixwin</a></b><br><sub>Native Windows bash and coreutils in Rust</sub></td>
<td width="33%" valign="top"><a href="https://github.com/aphrody-labs/src/tree/main/apps/aphrody"><img src="https://cdn.aphrody.com/brand/v1/icons/aphrody/icon.svg" width="40" height="40" alt=""></a><br><b><a href="https://github.com/aphrody-labs/src/tree/main/apps/aphrody">aphrody.com</a></b><br><sub>Brand homepage</sub></td>
</tr>
<tr>
<td width="33%" valign="top"><a href="https://github.com/aphrody-labs/src/tree/main/apps/aphrody-app"><img src="https://cdn.aphrody.com/brand/v1/icons/aphrody-app/icon.svg" width="40" height="40" alt=""></a><br><b><a href="https://github.com/aphrody-labs/src/tree/main/apps/aphrody-app">aphrody.app</a></b><br><sub>Rust WebGPU tiling desktop shell</sub></td>
<td width="33%" valign="top"><a href="https://github.com/aphrody-labs/src/tree/main/apps/yolo"><img src="https://cdn.aphrody.com/brand/v1/icons/yolo/icon.svg" width="40" height="40" alt=""></a><br><b><a href="https://github.com/aphrody-labs/src/tree/main/apps/yolo">yolo</a></b><br><sub>Bun fullstack framework with a Material 3 stack</sub></td>
<td width="33%" valign="top"><a href="https://github.com/aphrody-labs/shenron"><img src="https://cdn.aphrody.com/brand/v1/icons/shenron/icon.svg" width="40" height="40" alt=""></a><br><b><a href="https://github.com/aphrody-labs/shenron">Shenron</a></b><br><sub>dragonballfr.com: site, Discord bot, translation pipeline</sub></td>
</tr>
<tr>
<td width="33%" valign="top"><a href="https://github.com/aphrody-labs/rosegriffon"><img src="https://cdn.aphrody.com/brand/v1/icons/rosegriffon/icon.svg" width="40" height="40" alt=""></a><br><b><a href="https://github.com/aphrody-labs/rosegriffon">Rose Griffon</a></b><br><sub>rosegriffon.fr: website, Discord bots, unified API</sub></td>
</tr>
</table>
<!-- projects:end -->

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://cdn.aphrody.com/brand/v1/profile/stats-aphrody-dev-dark.svg">
  <img alt="aphrody-dev upstream wo

[... truncated by token budget ...]
