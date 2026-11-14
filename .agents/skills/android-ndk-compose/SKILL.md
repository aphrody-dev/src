---
name: android-ndk-compose
description: Android NDK Pure C11/JNI/ANativeWindow/AChoreographer and Jetpack Compose Material 3 Expressive entry point in src. Use for any Android, NDK, JNI, ANativeActivity, Vulkan/WebGPU Android surface, Jetpack Compose, Wear OS, Android XR, Android TV, Android Auto/AAOS, LiteRT/ML Kit, or AGP 9 task; routes to the 36 mirrored android-* skills and Theme.kt + sys.h.
---

# Android NDK + Jetpack Compose Material 3 Expressive in src

`android/skills` (`v1.0.21`, commit `5815d27fda56`, Apache-2.0) is forked at `aphrody-labs/android-skills` (`third_party/forks.txt`), checked out in `third_party/android-skills`, tracked by `infra/upstream/stacks.d/google-labs.toml`, and mirrored into 36 `.agents/skills/android-*` skills via `bun packages/ai-os/src/google/absorb.ts skills --write`.

## Live-Verified Toolchain Baseline (2026-11-14)

| Layer                     | Upstream & Verified Version                                                                                  | Role in `src`                                                                                               |
| ------------------------- | ------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------- |
| Android Skills            | `android/skills` `v1.0.21` (`5815d27fda`, 2026-11-09) -> `aphrody-labs/android-skills`                       | 36 modular agent skills mirrored under `.agents/skills/android-*`                                           |
| Android NDK               | `android/ndk` `r30` (`master@83bbb5ac0d`)                                                                    | Clang `-std=gnu11` cross-compilation (`aarch64-linux-android35`, `x86_64-linux-android35`) of `libaysys.so` |
| Android Gradle Plugin     | `com.android.tools.build:gradle` `9.5.1` stable, `9.6.0-alpha03` preview                                     | Built-in Kotlin, R8 full mode, CMake/Prefab packaging (`android-agp-9-upgrade`)                             |
| Kotlin                    | `JetBrains/kotlin` `2.4.21` stable (2026-10-08), `2.5.0-RC` (2026-11-11)                                     | Compose compiler, `@CriticalNative` / `@FastNative` JNI bindings                                            |
| Jetpack Compose Material3 | `androidx.compose.material3:material3` `1.4.0` stable, `1.5.0-rc01` (`androidx-main@8bb0533894`, 2026-11-14) | Compose-first Material 3 Expressive (`MaterialExpressiveTheme`, `MotionScheme`, 35-shape morphing)          |
| Dawn / WebGPU Android     | `google/dawn` `v20261113.214538` (`main@12c86c40d4`)                                                         | Shared WGSL shaders on Vulkan `ANativeWindow` alongside browser WebGPU                                      |

## Architecture in `src`: Shared Tokens + Pure C ABI (`libaysys.so`)

1. **Single Token Source (`brand.toml` -> `Theme.kt` + `tokens.h` + `ndk_theme.h` + `ui.h`)**:
   - `packages/design/tokens/adapters/Theme.kt` (`package com.aphrody.design`, `object AphrodyTheme`) and `packages/design/tokens/adapters/ndk_theme.h` (`AY_NDK_ROLE_*`, 48 roles aligned 1:1 with `Theme.kt`, plus `AY_NDK_*_CLEAR_RGBA8888` and `ay_ndk_clear_color_t` for `VkClearColorValue` / `glClearColor`) are generated from `assets/brand/brand.toml` (seed `#135B82`, Material Color Utilities `0.4.0` vibrant) by `packages/design/src/adapters.ts`, alongside `packages/design/tokens/adapters/tokens.h`.
   - `src/include/uapi/ay/ui.h` and `src/ui/m3.c` expose the exact same color roles (`ay_ui_color_argb`, `ay_ui_argb_to_abgr`, `ay_ui_state_blend_argb`), M3 Expressive springs (`ay_ui_spring_init`, `ay_ui_spring_step`), and adaptive window classes (`ay_ui_window_class`, `ay_ui_compute_shell`) over the C ABI (`src/include/ay/sys.h`).

2. **Pure Native Path (`ANativeActivity` + `ANativeWindow` + `AChoreographer`)**:
   - Lifecycle & assets: `<android/native_activity.h>` (`ANativeActivity`) and `<android/asset_manager.h>` (`AAssetManager_open` for WGSL shaders, variable fonts, and static bundles).
   - Vsync-locked spring physics: `<android/choreographer.h>` (`AChoreographer_getInstance()` + `AChoreographer_postFrameCallback64`) computes `dt_sec` from the hardware vsync timestamp (60/90/120 Hz) and steps `ay_ui_spring_step(&spring, dt_sec)` without allocation.
   - Surface presentation: Vulkan (`VK_KHR_android_surface` on `ANativeWindow*`), Dawn WebGPU (`wgpuSurfaceDescriptorFromAndroidNativeWindow`), or CPU fallback (`ANativeWindow_lock` writing `WINDOW_FORMAT_RGBA_8888` words converted via `ay_ui_argb_to_abgr`).

3. **Hybrid Jetpack Compose + JNI Path**:
   - Load `System.loadLibrary("aysys")` once.
   - Bind scalar pure functions (`ay_ui_color_argb`, `ay_ui_argb_to_abgr`, `ay_ui_state_blend_argb`, `ay_ui_window_class`) with `@JvmStatic external` (and `@CriticalNative` where no object references cross JNI) and pass `ByteBuffer.allocateDirect` for `struct ay_ui_spring_state`, `struct ay_ui_adaptive_shell`, or `ay_ui_emit_m3_card_html`.
   - Wrap screens in `MaterialExpressiveTheme(colorScheme = AphrodyTheme.dark, shapes = AphrodyTheme.shapes, typography = AphrodyTheme.typography, motionScheme = MotionScheme.expressive())`, enabling edge-to-edge (`android-edge-to-edge`) and adaptive Navigation 3 scenes (`android-adaptive`, `android-navigation-3`).
   - Heavy Android/Gradle/NDK builds run in CI or on `fr1`, never on the local workstation.

## Mirrored Skills (`bun packages/ai-os/src/google/absorb.ts skills --write`, do not edit)

- **Jetpack Compose & Material 3**: `android-adaptive`, `android-jetpack-compose-performance`, `android-migrate-xml-views-to-jetpack-compose`, `android-ink-app-builder`, `android-ink-custom-brush-builder`
- **Navigation & System UI**: `android-navigation-3`, `android-navigation-event`, `android-edge-to-edge`, `android-glance-appwidget-updates-and-memory`, `android-glance-canonical-layouts`
- **Form Factors (Wear, TV, XR, Cars)**: `android-wear-compose-m3`, `android-wear-widgets`, `android-leanback-to-compose-tv-migration`, `android-display-glasses-with-jetpack-compose-glimmer`, `android-projected-hardware`, `android-for-cars-parked-apps`
- **On-Device AI (LiteRT & ML Kit)**: `android-appfunctions`, `android-litert-lm`, `android-litert-runtime`, `android-ml-kit-genai-prompt-api`, `android-mlkit-agent-api`
- **Camera & Media**: `android-camerax`, `android-media3-cast-integration`
- **Identity, Security & Play**: `android-restore-credentials`, `android-verified-email`, `android-intent-security`, `android-permissions-security`, `android-engage-sdk-integration`, `android-play-billing-library-version-upgrade`, `android-play-policy-insights`
- **Build, Tooling, Performance & Testing**: `android-agp-9-upgrade`, `android-cli`, `android-anr-audit-and-fix`, `android-r8-analyzer`, `android-profiler`, `android-testing-setup`

## Neighbouring Specs & Skills

- `docs/native/PURE-C-WASM-UI-2026.md`: canonical Pure C11 + Assembler + WebAssembly 3.0 + WebGPU + WASI + 18-target UI interoperability specification.
- `docs/ui/STACK.md` & `docs/ui/ECOSYSTEM-AUDIT.md`: monorepo UI targets and token adapter rules.
- `rea-ghidra-sre`: Android APK/DEX/JNI reverse engineering (`inspect_android_package`, `inspect_android_jni_bindings`).
