# Codebase Digest: gamescope

- Files analyzed: 233
- Total lines: 34783
- Total size: 1.15 MB
- Git branch: `master`
- Git HEAD commit: `865a71c4 (steamcompmgr: read the client's size hint flags)`
- Digest mode: `AST-Smart Outline`

## Directory Structure

```text
gamescope/
├── LICENSE (74 lines, 4.5 KB, ~1.1k tokens)
├── README.md (99 lines, 5.6 KB, ~1.5k tokens)
├── default_extras_install.sh (1 lines, 34 B, ~10 tokens)
├── layer/
│   ├── VkLayer_FROG_gamescope_wsi.cpp (124 lines, 6.7 KB, ~1.7k tokens)
│   ├── VkLayer_FROG_gamescope_wsi.json.in (20 lines, 633 B, ~161 tokens)
│   ├── meson.build (27 lines, 1.2 KB, ~298 tokens)
│   ├── present_timing.hpp (20 lines, 1.2 KB, ~289 tokens)
│   ├── vulkan_operators.hpp (14 lines, 740 B, ~211 tokens)
│   └── xcb_helpers.hpp (20 lines, 1.5 KB, ~381 tokens)
├── looks/
│   ├── cb_deut_g22.cube (1332 lines, 39.0 KB, ~11.9k tokens)
│   ├── cb_deut_pq.cube (4914 lines, 144.0 KB, ~44.0k tokens)
│   ├── cb_prot_g22.cube (1332 lines, 39.0 KB, ~11.9k tokens)
│   ├── cb_prot_pq.cube (4914 lines, 144.0 KB, ~44.0k tokens)
│   ├── cb_trit_g22.cube (1332 lines, 39.0 KB, ~11.9k tokens)
│   ├── cb_trit_pq.cube (4914 lines, 144.0 KB, ~44.0k tokens)
│   ├── grayscale_g22.cube (127 lines, 3.3 KB, ~1.1k tokens)
│   ├── grayscale_pq.cube (127 lines, 3.3 KB, ~1.1k tokens)
│   ├── invertbrightness_g22.cube (1333 lines, 35.1 KB, ~11.4k tokens)
│   ├── invertbrightness_pq.cube (1333 lines, 35.1 KB, ~11.4k tokens)
│   ├── invertcolors_g22.cube (127 lines, 3.3 KB, ~1.1k tokens)
│   └── invertcolors_pq.cube (1333 lines, 35.1 KB, ~11.4k tokens)
├── meson.build (124 lines, 3.5 KB, ~980 tokens)
├── meson_options.txt (12 lines, 1.2 KB, ~311 tokens)
├── protocol/
│   ├── color-management-v1.xml (1631 lines, 73.1 KB, ~17.5k tokens)
│   ├── frog-color-management-v1.xml (356 lines, 15.7 KB, ~3.9k tokens)
│   ├── gamescope-action-binding.xml (85 lines, 3.5 KB, ~929 tokens)
│   ├── gamescope-control.xml (159 lines, 7.9 KB, ~2.2k tokens)
│   ├── gamescope-input-method.xml (214 lines, 8.7 KB, ~2.2k tokens)
│   ├── gamescope-limiter.xml (52 lines, 2.4 KB, ~582 tokens)
│   ├── gamescope-pipewire.xml (45 lines, 2.0 KB, ~480 tokens)
│   ├── gamescope-private.xml (47 lines, 1.9 KB, ~498 tokens)
│   ├── gamescope-reshade.xml (68 lines, 2.9 KB, ~743 tokens)
│   ├── gamescope-swapchain.xml (267 lines, 14.9 KB, ~3.7k tokens)
│   ├── gamescope-xwayland.xml (55 lines, 2.5 KB, ~609 tokens)
│   ├── meson.build (85 lines, 2.6 KB, ~729 tokens)
│   ├── wlr-layer-shell-unstable-v1.xml (390 lines, 18.0 KB, ~4.4k tokens)
│   └── xdg-toplevel-icon-v1.xml (199 lines, 9.0 KB, ~2.2k tokens)
├── scripts/
│   ├── 00-gamescope/
│   │   ├── common/
│   │   │   ├── inspect.lua (19 lines, 846 B, ~241 tokens)
│   │   │   ├── modegen.lua (7 lines, 479 B, ~131 tokens)
│   │   │   └── util.lua (6 lines, 199 B, ~62 tokens)
│   │   └── displays/
│   │       ├── asus.rogally.lcd.lua (1 lines, 35 B, ~11 tokens)
│   │       ├── asus.rogallyx20.oled.lua (1 lines, 35 B, ~11 tokens)
│   │       ├── deckhd.steamdeck.deckhd-lcd.lua (1 lines, 35 B, ~11 tokens)
│   │       ├── gpd.win4.lcd.lua (1 lines, 35 B, ~11 tokens)
│   │       ├── lenovo.legiongo.lcd.lua (1 lines, 35 B, ~11 tokens)
│   │       ├── lenovo.legiongo2.oled.lua (1 lines, 35 B, ~11 tokens)
│   │       ├── lenovo.legiongos.lcd.lua (1 lines, 35 B, ~11 tokens)
│   │       ├── onexplayer.f1.oled.lua (1 lines, 35 B, ~11 tokens)
│   │       ├── valve.steamdeck.lcd.lua (1 lines, 35 B, ~11 tokens)
│   │       ├── valve.steamdeck.oled.lua (1 lines, 36 B, ~11 tokens)
│   │       └── zotac.zone.oled.lua (1 lines, 35 B, ~11 tokens)
│   └── README.md (75 lines, 2.6 KB, ~676 tokens)
├── src/
│   ├── Apps/
│   │   ├── gamescope_hotkey_example.cpp (23 lines, 1.1 KB, ~298 tokens)
│   │   ├── gamescope_type.c (28 lines, 1.1 KB, ~304 tokens)
│   │   ├── gamescopectl.cpp (30 lines, 1.9 KB, ~484 tokens)
│   │   ├── gamescopereaper.cpp (16 lines, 444 B, ~142 tokens)
│   │   └── gamescopestream.cpp (87 lines, 2.8 KB, ~789 tokens)
│   ├── Backends/
│   │   ├── DRMBackend.cpp (329 lines, 17.1 KB, ~4.4k tokens)
│   │   ├── DeferredBackend.h (22 lines, 1.3 KB, ~339 tokens)
│   │   ├── HeadlessBackend.cpp (53 lines, 3.5 KB, ~878 tokens)
│   │   ├── OpenVRBackend.cpp (175 lines, 10.1 KB, ~2.6k tokens)
│   │   ├── SDLBackend.cpp (87 lines, 5.2 KB, ~1.4k tokens)
│   │   └── WaylandBackend.cpp (268 lines, 21.3 KB, ~5.1k tokens)
│   ├── BufferMemo.cpp (10 lines, 638 B, ~165 tokens)
│   ├── BufferMemo.h (11 lines, 318 B, ~90 tokens)
│   ├── GamescopeVersion.h.in (6 lines, 107 B, ~27 tokens)
│   ├── InputEmulation.cpp (12 lines, 457 B, ~128 tokens)
│   ├── InputEmulation.h (5 lines, 149 B, ~45 tokens)
│   ├── LibInputHandler.cpp (15 lines, 472 B, ~144 tokens)
│   ├── LibInputHandler.h (7 lines, 206 B, ~60 tokens)
│   ├── Ratio.h (14 lines, 531 B, ~153 tokens)
│   ├── Script/
│   │   ├── Script.cpp (21 lines, 1.3 KB, ~355 tokens)
│   │   └── Script.h (10 lines, 274 B, ~84 tokens)
│   ├── Timeline.cpp (25 lines, 1.4 KB, ~377 tokens)
│   ├── Timeline.h (9 lines, 268 B, ~74 tokens)
│   ├── Utils/
│   │   ├── Algorithm.h (17 lines, 1011 B, ~292 tokens)
│   │   ├── CommitQueue.h (7 lines, 208 B, ~59 tokens)
│   │   ├── Defer.h (3 lines, 86 B, ~25 tokens)
│   │   ├── Dict.h (9 lines, 290 B, ~84 tokens)
│   │   ├── DirHelpers.cpp (9 lines, 285 B, ~90 tokens)
│   │   ├── DirHelpers.h (3 lines, 85 B, ~25 tokens)
│   │   ├── NonCopyable.h (3 lines, 95 B, ~27 tokens)
│   │   ├── Parsers.h (8 lines, 224 B, ~67 tokens)
│   │   ├── PresentTiming.h (13 lines, 1004 B, ~241 tokens)
│   │   ├── Process.cpp (67 lines, 2.5 KB, ~731 tokens)
│   │   ├── Process.h (8 lines, 200 B, ~61 tokens)
│   │   ├── String.h (4 lines, 109 B, ~32 tokens)
│   │   ├── TempFiles.cpp (16 lines, 615 B, ~178 tokens)
│   │   ├── TempFiles.h (4 lines, 105 B, ~31 tokens)
│   │   ├── VBlankSchedule.h (10 lines, 537 B, ~132 tokens)
│   │   ├── Version.cpp (6 lines, 163 B, ~51 tokens)
│   │   └── Version.h (2 lines, 64 B, ~19 tokens)
│   ├── WaylandServer/
│   │   ├── GamescopeActionBinding.h (32 lines, 1.4 KB, ~366 tokens)
│   │   ├── GamescopeLimiter.h (11 lines, 464 B, ~123 tokens)
│   │   ├── LinuxDrmSyncobj.h (18 lines, 933 B, ~226 tokens)
│   │   ├── Reshade.h (14 lines, 587 B, ~157 tokens)
│   │   ├── SwapchainTiming.h (6 lines, 203 B, ~56 tokens)
│   │   ├── WaylandDecls.h (2 lines, 81 B, ~23 tokens)
│   │   ├── WaylandProtocol.h (4 lines, 130 B, ~37 tokens)
│   │   ├── WaylandResource.h (11 lines, 534 B, ~148 tokens)
│   │   └── WaylandServerLegacy.h (25 lines, 788 B, ~213 tokens)
│   ├── backend.cpp (23 lines, 1.1 KB, ~303 tokens)
│   ├── backend.h (66 lines, 3.1 KB, ~792 tokens)
│   ├── backends.h (2 lines, 66 B, ~19 tokens)
│   ├── color_bench.cpp (20 lines, 1.3 KB, ~335 tokens)
│   ├── color_helpers.cpp (45 lines, 3.3 KB, ~913 tokens)
│   ├── color_helpers.h (43 lines, 1.9 KB, ~538 tokens)
│   ├── color_helpers_impl.h (5 lines, 166 B, ~46 tokens)
│   ├── color_tests.cpp (7 lines, 237 B, ~72 tokens)
│   ├── commit.cpp (17 lines, 832 B, ~227 tokens)
│   ├── commit.h (14 lines, 456 B, ~122 tokens)
│   ├── convar.cpp (10 lines, 458 B, ~131 tokens)
│   ├── convar.h (19 lines, 674 B, ~198 tokens)
│   ├── convar_script.cpp (9 lines, 447 B, ~129 tokens)
│   ├── drm_include.h (10 lines, 272 B, ~86 tokens)
│   ├── edid.cpp (22 lines, 1.1 KB, ~311 tokens)
│   ├── edid.h (7 lines, 182 B, ~52 tokens)
│   ├── focus_placement.h (4 lines, 211 B, ~57 tokens)
│   ├── gamescope_shared.h (5 lines, 201 B, ~52 tokens)
│   ├── gpuvis_trace_utils.h (79 lines, 4.2 KB, ~1.1k tokens)
│   ├── hdmi.h (6 lines, 198 B, ~53 tokens)
│   ├── ime.cpp (144 lines, 6.5 KB, ~1.6k tokens)
│   ├── ime.hpp (8 lines, 279 B, ~72 tokens)
│   ├── layer_defines.h (5 lines, 147 B, ~41 tokens)
│   ├── log.cpp (27 lines, 1.4 KB, ~412 tokens)
│   ├── log.hpp (9 lines, 245 B, ~69 tokens)
│   ├── logind_sleep.cpp (24 lines, 897 B, ~243 tokens)
│   ├── main.cpp (55 lines, 2.1 KB, ~594 tokens)
│   ├── main.hpp (15 lines, 873 B, ~204 tokens)
│   ├── mangoapp.cpp (31 lines, 1.3 KB, ~348 tokens)
│   ├── mangoapp_config.h (7 lines, 337 B, ~87 tokens)
│   ├── mangoapp_control.h (9 lines, 373 B, ~95 tokens)
│   ├── meson.build (240 lines, 8.0 KB, ~2.2k tokens)
│   ├── messagey.h (19 lines, 732 B, ~205 tokens)
│   ├── mode_list_file.cpp (8 lines, 300 B, ~88 tokens)
│   ├── mode_list_file.h (9 lines, 280 B, ~81 tokens)
│   ├── modegen.cpp (4 lines, 253 B, ~65 tokens)
│   ├── modegen.hpp (7 lines, 176 B, ~56 tokens)
│   ├── pipewire.cpp (111 lines, 4.1 KB, ~1.1k tokens)
│   ├── pipewire.hpp (21 lines, 637 B, ~173 tokens)
│   ├── pipewire_gamescope.hpp (7 lines, 218 B, ~63 tokens)
│   ├── rc.h (16 lines, 553 B, ~162 tokens)
│   ├── refresh_rate.h (11 lines, 619 B, ~151 tokens)
│   ├── rendervulkan.cpp (224 lines, 15.2 KB, ~3.8k tokens)
│   ├── rendervulkan.hpp (155 lines, 6.3 KB, ~1.7k tokens)
│   ├── reshade_effect_manager.cpp (102 lines, 6.4 KB, ~1.6k tokens)
│   ├── reshade_effect_manager.hpp (14 lines, 565 B, ~150 tokens)
│   ├── sdlscancodetable.hpp (3 lines, 175 B, ~43 tokens)
│   ├── shaders/
│   │   ├── NVIDIAImageScaling/
│   │   │   ├── NIS/
│   │   │   │   ├── NIS_Config.h (11 lines, 420 B, ~110 tokens)
│   │   │   │   ├── NIS_Main.glsl (99 lines, 3.1 KB, ~860 tokens)
│   │   │   │   ├── NIS_Main.hlsl (111 lines, 3.3 KB, ~921 tokens)
│   │   │   │   └── NIS_Scaler.h (16 lines, 1.0 KB, ~296 tokens)
│   │   │   ├── README.md (436 lines, 16.0 KB, ~4.0k tokens)
│   │   │   └── licence.txt (20 lines, 1.2 KB, ~292 tokens)
│   │   ├── alphamode.h (4 lines, 277 B, ~71 tokens)
│   │   ├── blit_push_data.h (2 lines, 63 B, ~19 tokens)
│   │   ├── blur.h (3 lines, 260 B, ~65 tokens)
│   │   ├── colorimetry.h (35 lines, 1.8 KB, ~479 tokens)
│   │   ├── composite.h (17 lines, 1.1 KB, ~292 tokens)
│   │   ├── cs_composite_blit.comp (50 lines, 1.4 KB, ~378 tokens)
│   │   ├── cs_composite_blur.comp (51 lines, 1.5 KB, ~384 tokens)
│   │   ├── cs_composite_blur_cond.comp (68 lines, 2.1 KB, ~544 tokens)
│   │   ├── cs_composite_rcas.comp (121 lines, 3.4 KB, ~882 tokens)
│   │   ├── cs_composite_rcas_1px.comp (111 lines, 3.1 KB, ~794 tokens)
│   │   ├── cs_easu.comp (62 lines, 1.4 KB, ~417 tokens)
│   │   ├── cs_easu_fp16.comp (63 lines, 1.6 KB, ~440 tokens)
│   │   ├── cs_gaussian_blur_horizontal.comp (65 lines, 1.7 KB, ~449 tokens)
│   │   ├── cs_nis.comp (5 lines, 80 B, ~21 tokens)
│   │   ├── cs_nis_fp16.comp (8 lines, 183 B, ~40 tokens)
│   │   ├── cs_nis_hdr_linear.comp (7 lines, 122 B, ~29 tokens)
│   │   ├── cs_nis_hdr_linear_fp16.comp (9 lines, 224 B, ~48 tokens)
│   │   ├── cs_rgb_to_nv12.comp (75 lines, 2.1 KB, ~616 tokens)
│   │   ├── cs_sgsr.comp (34 lines, 754 B, ~207 tokens)
│   │   ├── descriptor_set.h (4 lines, 170 B, ~46 tokens)
│   │   ├── descriptor_set_constants.h (1 lines, 35 B, ~11 tokens)
│   │   ├── ffx_a.h (966 lines, 35.5 KB, ~11.3k tokens)
│   │   ├── ffx_fsr1.h (32 lines, 1.5 KB, ~448 tokens)
│   │   ├── heatmap.h (9 lines, 583 B, ~148 tokens)
│   │   ├── nis.h (5 lines, 168 B, ~49 tokens)
│   │   ├── sgsr1.h (6 lines, 456 B, ~121 tokens)
│   │   └── shaderfilter.h (2 lines, 88 B, ~24 tokens)
│   ├── steamcompmgr.cpp (380 lines, 18.1 KB, ~4.8k tokens)
│   ├── steamcompmgr.hpp (36 lines, 1.1 KB, ~316 tokens)
│   ├── steamcompmgr_shared.hpp (55 lines, 2.1 KB, ~553 tokens)
│   ├── vblankmanager.cpp (41 lines, 1.9 KB, ~510 tokens)
│   ├── vblankmanager.hpp (6 lines, 200 B, ~56 tokens)
│   ├── vrclient_detect.h (10 lines, 370 B, ~102 tokens)
│   ├── vulkan_include.h (2 lines, 67 B, ~20 tokens)
│   ├── waitable.h (38 lines, 1.2 KB, ~371 tokens)
│   ├── win32_styles.h (1 lines, 35 B, ~11 tokens)
│   ├── wlr_begin.hpp (2 lines, 68 B, ~21 tokens)
│   ├── wlr_end.hpp (1 lines, 34 B, ~10 tokens)
│   ├── wlserver.cpp (524 lines, 27.7 KB, ~6.8k tokens)
│   ├── wlserver.hpp (112 lines, 3.4 KB, ~891 tokens)
│   ├── x11cursor.cpp (7 lines, 240 B, ~72 tokens)
│   └── xwayland_ctx.hpp (27 lines, 868 B, ~252 tokens)
├── subprojects/
│   ├── glm.wrap (8 lines, 153 B, ~41 tokens)
│   ├── packagefiles/
│   │   └── glm/
│   │       └── meson.build (7 lines, 180 B, ~52 tokens)
│   └── stb.wrap (8 lines, 155 B, ~40 tokens)
├── tests/
│   ├── meson.build (43 lines, 2.6 KB, ~669 tokens)
│   ├── reaper_test_helper.cpp (6 lines, 142 B, ~48 tokens)
│   ├── test_color_helpers.cpp (6 lines, 286 B, ~79 tokens)
│   ├── test_convar.cpp (4 lines, 125 B, ~38 tokens)
│   ├── test_focus_placement.cpp (3 lines, 106 B, ~30 tokens)
│   ├── test_mangoapp_config.cpp (3 lines, 106 B, ~30 tokens)
│   ├── test_mangoapp_control.cpp (5 lines, 322 B, ~80 tokens)
│   ├── test_mode_list.cpp (3 lines, 105 B, ~30 tokens)
│   ├── test_present_timing.cpp (10 lines, 451 B, ~114 tokens)
│   ├── test_present_timing_layer.cpp (49 lines, 3.1 KB, ~761 tokens)
│   ├── test_present_timing_schedule.cpp (3 lines, 111 B, ~32 tokens)
│   ├── test_process.cpp (15 lines, 502 B, ~152 tokens)
│   ├── test_swapchain_wire.cpp (10 lines, 409 B, ~117 tokens)
│   ├── test_upscale.cpp (3 lines, 97 B, ~29 tokens)
│   ├── test_utils_commit_queue.cpp (8 lines, 338 B, ~96 tokens)
│   ├── test_utils_parsers.cpp (6 lines, 215 B, ~59 tokens)
│   ├── test_utils_string.cpp (5 lines, 146 B, ~43 tokens)
│   ├── test_utils_vblank_schedule.cpp (4 lines, 207 B, ~55 tokens)
│   ├── test_vrclient_detect.cpp (8 lines, 255 B, ~74 tokens)
│   └── wayland_test_server.hpp (35 lines, 1.4 KB, ~392 tokens)
├── thirdparty/
│   └── sol/
│       ├── config.hpp (1 lines, 35 B, ~11 tokens)
│       └── forward.hpp (68 lines, 2.0 KB, ~537 tokens)
└── tools/
    ├── build_and_install_on_steamos_device_local.sh (1 lines, 35 B, ~11 tokens)
    ├── build_and_install_on_steamos_device_remote.sh (1 lines, 34 B, ~10 tokens)
    ├── build_on_steamos_device_local.sh (1 lines, 35 B, ~11 tokens)
    ├── clean_steamos_device_remote.sh (1 lines, 35 B, ~11 tokens)
    ├── copy_to_steamos_device_rsync.sh (1 lines, 35 B, ~11 tokens)
    ├── reset_to_system_gamescope_local.sh (1 lines, 35 B, ~11 tokens)
    ├── reset_to_system_gamescope_remote.sh (1 lines, 34 B, ~10 tokens)
    ├── steamos_common_local.sh (1 lines, 35 B, ~11 tokens)
    ├── steamos_common_remote.sh (1 lines, 35 B, ~11 tokens)
    ├── steamos_password_helpers.sh (4 lines, 102 B, ~34 tokens)
    ├── steamos_sessionctl_local.sh (1 lines, 35 B, ~11 tokens)
    └── steamos_sessionctl_remote.sh (1 lines, 35 B, ~11 tokens)
```

## Source Files

================================================
FILE: README.md
================================================
## gamescope: the micro-compositor formerly known as steamcompmgr

In an embedded session usecase, gamescope does the same thing as steamcompmgr, but with less extra copies and latency:

 - It's getting game frames through Wayland by way of Xwayland, so there's no copy within X itself before it gets the frame.
 - It can use DRM/KMS to directly flip game frames to the screen, even when stretching or when notifications are up, removing another copy.
 - When it does need to composite with the GPU, it does so with async Vulkan compute, meaning you get to see your frame quick even if the game already has the GPU busy with the next frame.

It also runs on top of a regular desktop, the 'nested' usecase steamcompmgr didn't support.

 - Because the game is running in its own personal Xwayland sandbox desktop, it can't interfere with your desktop and your desktop can't interfere with it.
 - You can spoof a virtual screen with a desired resolution and refresh rate as the only thing the game sees, and control/resize the output as needed. This can be useful in exotic display configurations like ultrawide or multi-monitor setups that involve rotation.

It runs on Mesa + AMD or Intel, and could be made to run on other Mesa/DRM drivers with minimal work. AMD requires Mesa 20.3+, Intel requires Mesa 21.2+. For NVIDIA's proprietary driver, version 515.43.04+ is required (make sure the `nvidia-drm.modeset=1` kernel parameter is set).

If running RadeonSI clients with older cards (GFX8 and below), currently have to set `R600_DEBUG=nodcc`, or corruption will be observed until the stack picks up DRM modifiers support.

## Building

Dependent first (**Debian/Debian-based**):
```
apt install meson ninja-build pkg-config cmake libpipewire-0.3-dev hwdata libx11-dev libwayland-dev libvulkan-dev wayland-protocols libx11-xcb-dev libxdamage-dev libxcomposite-dev libxcursor-dev libxxf86vm-dev libxtst-dev libxres-dev libxmu-dev libxkbcommon-dev libcap-dev libsdl2-dev libavif-dev libpixman-1-dev liblcms2-dev libseat-dev libinput-dev xwayland libxcb-composite0-dev libxcb-ewmh-dev libxcb-icccm4-dev libxcb-res0-dev glslang-tools libluajit-5.1-dev libcatch2-dev
```

Build with:

```
git submodule update --init
meson setup build/
ninja -C build/
build/src/gamescope -- <game>
```

Install with:

```
meson install -C build/ --skip-subprojects
```

## Keyboard shortcuts

* **Super + F** : Toggle fullscreen
* **Super + N** : Toggle nearest neighbour filtering
* **Super + U** : Toggle FSR upscaling
* **Super + Y** : Toggle NIS upscaling
* **Super + I** : Increase FSR sharpness by 1
* **Super + O** : Decrease FSR sharpness by 1
* **Super + S** : Take screenshot (currently goes to `/tmp/gamescope_$DATE.png`)
* **Super + G** : Toggle keyboard grab

## Examples

On any X11 or Wayland desktop, you can set the Steam launch arguments of your game as follows:

```sh
# Upscale a 720p game to 1440p with integer scaling
gamescope -h 720 -H 1440 -S integer -- %command%

# Limit a vsynced game to 30 FPS
gamescope -r 30 -- %command%

# Run the game at 1080p, but scale output to a fullscreen 3440×1440 pillarboxed ultrawide window
gamescope -w 1920 -h 1080 -W 3440 -H 1440 -b -- %command%
```

## Options

See `gamescope --help` for a full list of options.

* `-W`, `-H`: set the resolution used by gamescope. Resizing the gamescope window will update these settings. Ignored in embedded mode. If `-H` is specified but `-W` isn't, a 16:9 aspect ratio is assumed. Defaults to 1280×720.
* `-w`, `-h`: set the resolution used by the game. If `-h` is specified but `-w` isn't, a 16:9 aspect ratio is assumed. Defaults to the values specified in `-W` and `-H`.
* `-r`: set a frame-rate limit for the game. Specified in frames per second. Defaults to unlimited.
* `-o`: set a frame-rate limit for the game when unfocused. Specified in frames per second. Defaults to unlimited.
* `-F fsr`: use AMD FidelityFX™ Super Resolution 1.0 for upscaling
* `-F nis`: use NVIDIA Image Scaling v1.0.3 for upscaling
* `-F sgsr`: use Snapdragon™ Game Super Resolution 1 with RCAS sharpening for upscaling
* `-S integer`: use integer scaling.
* `-S stretch`: use stretch scaling, the game will fill the window. (e.g. 4:3 to 16:9)
* `-b`: create a border-less window.
* `-f`: create a full-screen window.

## Reshade support

Gamescope supports a subset of Reshade effects/shaders using the `--reshade-effect [path]` and `--reshade-technique-idx [idx]` command line parameters.

This provides an easy way to do shader effects (ie. CRT shader, film grain, debugging HDR with histograms, etc) on top of whatever is being displayed in Gamescope without having to hook into the underlying process.

Uniform/shader options can be modified programmatically via the `gamescope-reshade` wayland interface. Otherwise, they will just use their initializer values.

Using Reshade effects will increase latency as there will be work performed on the general gfx + compute queue as opposed to only using the realtime async compute queue which can run in tandem with the game's gfx work.

Using Reshade effects is **highly discouraged** for doing simple transformations which can be achieved with LUTs/CTMs which are possible to do in the DC (Display Core) on AMDGPU at scanout time, or with the current regular async compute composite path.
The looks system where you can specify your own 3D LUTs would be a better alternative for such transformations.

Pull requests for improving Reshade compatibility support are appreciated.

## Status of Gamescope Packages

[![Packaging status](https://repology.org/badge/vertical-allrepos/gamescope.svg?exclude_unsupported=1)](https://repology.org/project/gamescope/versions)


================================================
FILE: scripts/README.md
================================================
# Gamescope Script/Config Files

## ⚠️ Health Warning ⚠️

Gamescope scripting/configuration is currently experimental and subject to change massively.

Scripts and configs working between revisions is not guaranteed to work, it should at least not crash... probably.

## The Basics

Gamescope uses Lua for it's configuration and scripting system.

Scripts ending in `.lua` are executed recursively in alphabetical order from the following directories:
 - `/usr/share/gamescope`
 - `/etc/gamescope`
 - `$XDG_CONFIG_DIR/gamescope`

You can develop easily without overriding your installation by setting `script_use_local_scripts` which will eliminate `/usr/share/gamescope` and `/etc/gamescope` from being read, and instead read from `../config` of where Gamescope is run instead of those.

When errors are encountered, it will simply output that to the terminal. There is no visual indicator of this currently.

Things should mostly fail-safe, unless you actually made an egregious mistake in your config like setting the refresh rate to 0 or the colorimetry to all 0, 0 or something.

# Making modifications as a user

If you wish to make modifications that will persist as a user, simply make a new `.lua` file in `$XDG_CONFIG_DIR/gamescope` which is usually `$HOME/.config/gamescope` with what you want to change.

For example, to make the Steam Deck LCD use spec colorimetry instead of the measured colorimetry you could create the following file `~/.config/gamescope/my_deck_lcd_colorimetry.lua` with the following contents:

```lua
local steamdeck_lcd_colorimetry_spec = {
    r = { x = 0.602, y = 0.355 },
    g = { x = 0.340, y = 0.574 },
    b = { x = 0.164, y = 0.121 },
    w = { x = 0.3070, y = 0.3220 }
}

gamescope.config.known_displays.steamdeck_lcd.colorimetry = steamdeck_lcd_colorimetry_spec
```

and it would override that.

You could also place this in `/etc/gamescope` if you really want it to apply to all users/system-wide, but that would need root privelages.

# Features

Being able to set known displays (`gamescope.config.known_displays`)

The ability to set convars.

Hooks

# Examples

A script that will enable composite debug and force composition on and off every 60 frames.

```lua
my_counter = 0

gamescope.convars.composite_debug.value = 3

gamescope.hook("OnPostPaint", function()
    my_counter = my_counter + 1

    if my_counter > 60 then
        gamescope.convars.composite_force.value = not gamescope.convars.composite_force.value
        my_counter = 0
        warn("Changed composite_force to "..tostring(gamescope.convars.composite_force.value)..".")
    end
end)
```

# Hot Reloading?

Coming soon...


================================================
FILE: src/shaders/NVIDIAImageScaling/README.md
================================================
# NVIDIA Image Scaling SDK v1.0.3

The MIT License(MIT)

Copyright(c) 2022 NVIDIA CORPORATION & AFFILIATES. All rights reserved.

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files(the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and / or sell copies of
the Software, and to permit persons to whom the Software is furnished to do so,
subject to the following conditions :

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.



## Introduction

The NVIDIA Image Scaling SDK provides a single spatial scaling and sharpening algorithm
for cross-platform support. The scaling algorithm uses a 6-tap scaling filter combined
with 4 directional scaling and adaptive sharpening filters, which creates nice smooth images
and sharp edges. In addition, the SDK provides a state-of-the-art adaptive directional sharpening algorithm for use in
applications where no scaling is required.\
The directional scaling and sharpening algorithm is named NVScaler while the adaptive-directional-sharpening-only
algorithm is named NVSharpen. Both algorithms are provided as compute shaders and
developers are free to integrate them in their applications. Note that if you integrate NVScaler, you
should NOT integrate NVSharpen, as NVScaler already includes a sharpening pass



## Pipeline Placement

The call into the NVIDIA Image Scaling shaders must occur during the post-processing phase after tone-mapping.
Applying the scaling in linear HDR in-game color-space may result in a sharpening effect that is
either not visible or too strong. Since sharpening algorithms can enhance noisy or grainy regions, it is recommended
that certain effects such as film grain should occur after NVScaler or NVSharpen. Low-pass filters such as motion blur or
light bloom are recommended to be applied before NVScaler or NVSharpen to avoid sharpening attenuation.



## Color Space and Ranges

NVIDIA Image Scaling shaders can process color textures stored as either LDR or HDR with the following
restrictions:

1) LDR
   - The range of color values must be in the [0, 1] range
   - The input color texture must be in display-referred color-space after tone mapping and OETF (gamma-correction)
     has been applied
2) HDR PQ
   - The range of color values must be in the [0, 1] range
   - The input color texture must be in display-referred color-space after tone mapping with Rec.2020 PQ OETF applied
3) HDR Linear
   - The recommended range of color values is [0, 12.5], where luminance value (as per BT. 709) of
     1.0 maps to brightness value of 80nits (sRGB peak) and 12.5 maps to 1000nits
   - The input color texture may have luminance values that are either linear and scene-referred or
     linear and display-referred (after tone mapping)

If the input color texture sent to NVScaler/NVSharpen is in HDR format set NIS_HDR_MODE define to either NIS_HDR_MODE_LINEAR (1) or NIS_HDR_MODE_PQ (2).



## Supported Texture Formats

### Input and output formats:

Input and output formats are expected to be in the rages defined in previous section and should be
specified using non-integer data types such as DXGI_FORMAT_R8G8B8A8_UNORM or DXGI_FORMAT_NV12.

### Coefficients formats:

The scaler coefficients and USM coefficients format should be specified using float4 type such as
DXGI_FORMAT_R32G32B32A32_FLOAT or DXGI_FORMAT_R16G16B16A16_FLOAT.
The coefficients are included in NIS_Config.h file:

fp32 format: coef_scaler, coef_USM

fp16 format: coef_scaler_fp16, coef_USM_fp16


### Resource States, Buffers, and Sampler:

The game or application calling NVIDIA Image Scaling SDK shaders must ensure that the textures are in
the correct state.

- Input color textures must be in pixel shader read state. Shader Resource View (SRV) in DirectX
- The output texture must be in read/write state. Unordered Access View (UAV) in DirectX
- The coefficients texture for NVScaler must be in read state. Shader Resource View (SRV) in DirectX
- The configuration variables must be passed as constant buffer. Constant Buffer View (CBV) in DirectX
- The sampler for texture pixel sampling must use linear filter interpolation and clamp to edge addressing mode



## Adding NVIDIA Image Scaling SDK to a Project

Include NIS_Scaler.h directly in your application or alternative use the provided NIS_Main.hlsl or NIS_Main.glsl shader files.
Use NIS_Config.h to get the ideal shader dispatch values for your platform, to configure the algorithm constant
values (NVScalerUpdateConfig, and NVSharpenUpdateConfig), and to access the algorithm coefficients (coef_scale, coef_USM, coef_scale_fp16, coef_USM_fp16).

- Device\
  NIS_Scaler.h    : HLSL shader file\
  NIS_Main.hlsl   : Main HLSL shader example (can be replaced by your own) \
  NIS_Main.glsl   : Main GLSL shader example (can ge replaced by your own)

- Host Configuration\
  NIS_Config.h    : Configuration structure


### Defines:

**NIS_SCALER**: default (**1**) NVScaler, (0) fast NVSharpen only, no upscaling\
**NIS_HDR_MODE**: default(**0**) disabled, (1) Linear, (2) PQ\
**NIS_BLOCK_WIDTH**: pixels per block width. Use GetOptimalBlockWidth query for your platform\
**NIS_BLOCK_HEIGHT**: pixels per block height. Use GetOptimalBlockHeight query for your platform\
**NIS_THREAD_GROUP_SIZE**: number of threads per group. Use GetOptimalThreadGroupSize query for your platform\
**NIS_USE_HALF_PRECISION**: default(**0**) disabled, (1) enable half pression computation\
**NIS_HLSL**: default (**1**) enabled, (0) disabled\
**NIS_HLSL_6_2**: default (**0**) HLSL v5, (1) HLSL v6.2 forces NIS_HLSL=1\
**NIS_GLSL**: default (**0**) disabled, (1) enabled\
**NIS_VIEWPORT_SUPPORT**: default(**0**) disabled, (1) enable input/output viewport support\
**NIS_NV12_SUPPORT**: default(**0**) disabled, (1) enable NV12 input\
**NIS_CLAMP_OUTPUT**: default(**0**) disabled, (1) enable output clamp


*Default NVScaler shader constants:*

[**NIS_BLOCK_WIDTH**, **NIS_BLOCK_HEIGHT**, **NIS_THREAD_GROUP_SIZE**] = [32, 24, 256]

*Default NVSharpen shader constants:*

[**NIS_BLOCK_WIDTH**, **NIS_BLOCK_HEIGHT**, **NIS_THREAD_GROUP_SIZE**] = [32, 32, 256]


*Defines for HLSL with DXC bindings:*

**NIS_DXC**: (0) disabled, (1) enable HLSL DXC Vulkan support

## Optimal shader settings

To get optimal performance of NVScaler and NVSharpen for current and future hardware, it is recommended that the following API is used to obtain the values for NIS_BLOCK_WIDTH, NIS_BLOCK_HEIGHT, and NIS_THREAD_GROUP_SIZE. These values can be used to compile permutations of NVScaler and NVSharpen offline.

```
enum class NISGPUArchitecture : uint32_t
{
    NVIDIA_Generic = 0,
    AMD_Generic = 1,
    Intel_Generic = 2,
    NVIDIA_Generic_fp16 = 3,
};
```

```
struct NISOptimizer
{
    bool isUpscaling;
    NISGPUArchitecture gpuArch;

    NISOptimizer(bool isUpscaling = true,
                 NISGPUArchitecture gpuArch = NISGPUArchitecture::NVIDIA_Generic);
    uint32_t GetOptimalBlockWidth();
    uint32_t GetOptimalBlockHeight();
    uint32_t GetOptimalThreadGroupSize();
};
```



## HDR shader settings

Use the following enum values for setting NIS_HDR_MODE

```
enum class NISHDRMode : uint32_t
{
    None = 0,
    Linear = 1,
    PQ = 2
};
```



## Integration of NVScaler
The integration instructions in this section can be applied with minimal changes to your own DX11, DX12, or Vulkan application, using HLSL or GLSL.

### Compile the NIS_Main.hlsl shader

NIS_SCALER should be set to 1, and the isUpscaling argument should set to true.

```
bool isUpscaling = true;
// Note: NISOptimizer is optional and these values can be cached offline
NISOptimizer opt(isUpscaling, NISGPUArchitecture::NVIDIA_Generic);
uint32_t blockWidth = opt.GetOptimalBlockWidth();
uint32_t blockHeight = opt.GetOptimalBlockHeight();
uint32_t threadGroupSize = opt.GetOptimalThreadGroupSize();

Defines defines;
defines.add("NIS_SCALER", isUpscaling);
defines.add("NIS_HDR_MODE", hdrMode);
defines.add("NIS_BLOCK_WIDTH", blockWidth);
defines.add("NIS_BLOCK_HEIGHT", blockHeight);
defines.add("NIS_THREAD_GROUP_SIZE", threadGroupSize);
NVScalerCS = CompileComputeShader(device, "NIS_Main.hlsl”, &defines);
```

### Create NVIDIA Image Scaling SDK configuration constant buffer

```
struct NISConfig
{
    float kDetectRatio;
    float kDetectThres;
    float kMinContrastRatio;
    float kRatioNorm;
    ...
};

NISConfig config;
createConstBuffer(&config, &csBuffer);
```

### Create SRV textures for the scaler and USM phase coefficients

```
const int rowPitch = kFilterSize * sizeof(float);  // use for fp32: float, fp16: uint16_t
const int coeffSize = rowPitch * kPhaseCount;

// Since we are using RGBA format the texture width = kFilterSize / 4
createTexture2D(kFilterSize / 4, kPhaseCount, DXGI_FORMAT_R32G32B32A32_FLOAT, D3D11_USAGE_DEFAULT, coef_scaler, rowPitch, coeffSize, &scalerTex);
createTexture2D(kFilterSize / 4, kPhaseCount, DXGI_FORMAT_R32G32B32A32_FLOAT, D3D11_USAGE_DEFAULT, coef_usm, rowPitch, coeffSize, &usmTex);

createSRV(scalerTex.Get(), DXGI_FORMAT_R32G32B32A32_FLOAT, &scalerSRV);
createSRV(usmTex.Get(), DXGI_FORMAT_R32G32B32A32_FLOAT, &usmSRV);
```

### Create Sampler

```
createLinearClampSampler(&linearClampSampler);
```

### Update NVIDIA Image Scaling SDK NVScaler configuration and constant buffer

Use the following API call to update the NVIDIA Image Scaling SDK configuration

```
void NVScalerUpdateConfig(NISConfig& config,
    float sharpness,
    uint32_t inputViewportOriginX, uint32_t inputViewportOriginY,
    uint32_t inputViewportWidth, uint32_t inputViewportHeight,
    uint32_t inputTextureWidth, uint32_t inputTextureHeight,
    uint32_t outputViewportOriginX, uint32_t outputViewportOriginY,
    uint32_t outputViewportWidth, uint32_t outputViewportHeight,
    uint32_t outputTextureWidth, uint32_t outputTextureHeight,
    NISHDRMode hdrMode = NISHDRMode::None
);
```

Update the constant buffer whenever the input size, sharpness, or scale changes

```
NVScalerUpdateConfig(m_config, sharpness,
                0, 0, inputWidth, inputHeight, inputWidth, inputHeight,
                0, 0, outputWidth, outputHeight, outputWidth, outputHeight,
                NISHDRMode::None);

updateConstBuffer(&config, csBuffer.Get());
```

### A simple DX11 NVScaler dispatch example

```
context->CSSetShaderResources(0, 1, input); // SRV
context->CSSetShaderResource (1, 1, scalerSRV.GetAddressOf());
context->CSSetShaderResource (2, 1, usmSRV.GetAddressOf());
context->CSSetUnorderedAccessViews(0, 1, output, nullptr);
context->CSSetSamplers(0, 1, linearClampSampler.GetAddressOf());
context->CSSetConstantBuffers(0, 1, csBuffer.GetAddressOf());
context->CSSetShader(NVScalerCS.Get(), nullptr, 0);

context->Dispatch(UINT(std::ceil(outputWidth / float(blockWidth))),
                  UINT(std::ceil(outputHeight / float(blockHeight))), 1);
```



## Integration of NVSharpen

If your application requires upscaling and sharpening do not use NVSharpen use NVScaler instead. Since NVScaler performs both operations, upscaling and sharpening, in one step, it performs faster and produces better image quality.

### Compile the NIS_Main.hlsl shader

NIS_SCALER should be set to 0 and the optimizer isUpscaling argument should be set to false.

```
bool isUpscaling = false;
// Note: NISOptimizer is optional and these values can be cached offline
NISOptimizer opt(isUpscaling, NISGPUArchitecture::NVIDIA_Generic);
uint32_t blockWidth = opt.GetOptimalBlockWidth();
uint32_t blockHeight = opt.GetOptimalBlockHeight();
uint32_t threadGroupSize = opt.GetOptimalThreadGroupSize();

Defines defines;
defines.add("NIS_DIRSCALER", isUpscaling);
defines.add("NIS_HDR_MODE", hdrMode);
defines.add("NIS_BLOCK_WIDTH", blockWidth);
defines.add("NIS_BLOCK_HEIGHT", blockHeight);
defines.add("NIS_THREAD_GROUP_SIZE", threadGroupSize);
NVSharpenCS = CompileComputeShader(device, "NIS_Main.hlsl”, &defines);
```

### Create NVIDIA Image Scaling SDK NVSharpen configuration constant buffer

```
struct NISConfig
{
    float kDetectRatio;
    float kDetectThres;
    float kMinContrastRatio;
    float kRatioNorm;
    ...
};

NISConfig config;
createConstBuffer(&config, &csBuffer);
```

### Create Sampler

```
createLinearClampSampler(&linearClampSampler);
```

### Update NVIDIA Image Scaling SDK NVSharpen configuration and constant buffer

Use the following API call to update the NVIDIA Image Scaling SDK configuration. Since NVSharpen is a sharpening algorithm only the sharpness and input size are required. For upscaling with sharpening use NVScaler since it performs both operations at the same time.

```
void NVSharpenUpdateConfig(NISConfig& config, float sharpness,
    uint32_t inputViewportOriginX, uint32_t inputViewportOriginY,
    uint32_t inputViewportWidth, uint32_t inputViewportHeight,
    uint32_t inputTextureWidth, uint32_t inputTextureHeight,
    uint32_t outputViewportOriginX, uint32_t outputViewportOriginY,
    NISHDRMode hdrMode = NISHDRMode::None
);

```

Update the constant buffer whenever the input size or sharpness changes.

```
NVSharpenUpdateConfig(m_config, sharpness,
                      0, 0, inputWidth, inputHeight, inputWidth, inputHeight,
                      0, 0, NISHDRMode::None);

updateConstBuffer(&config, csBuffer.Get());
```

### A simple DX11 NVSharpen dispatch example

```
context->CSSetShaderResources(0, 1, input);
context->CSSetUnorderedAccessViews(0, 1, output, nullptr);
context->CSSetSamplers(0, 1, linearClampSampler.GetAddressOf());
context->CSSetConstantBuffers(0, 1, csBuffer.GetAddressOf());
context->CSSetShader(NVSharpenCS.Get(), nullptr, 0);

context->Dispatch(UINT(std::ceil(outputWidth / float(blockWidth))),
                  UINT(std::ceil(outputHeight / float(blockHeight))), 1);
```
###	Streamline Nvidia Image Scaling Plug-in Integration
Streamline is an open-source solution that facilitates the integration of the latest NVIDIA and other independent hardware vendors super resolution technologies into applications and games.
For a high-level overview of NIVIDA Streamline, visit NVIDIA Developer Streamline page https://developer.nvidia.com/rtx/streamline. \
The Streamline SDK can be found here NVIDIA Streamline Github Page https://github.com/NVIDIAGameWorks/Streamline. \
For Streamline NIS plug-in integration instructions and documentation, see the Streamline NIS Programming Guide https://github.com/NVIDIAGameWorks/Streamline/blob/main/docs/ProgrammingGuideNIS.md


## Samples

### Dependencies

- Visual Studio 2019 : https://visualstudio.microsoft.com/downloads/
- Windows 10 SDK : https://developer.microsoft.com/en-us/windows/downloads/windows-10-sdk
- CMake 3.16 : https://cmake.org/download/

for building the Vulkan sample:
- Vulkan SDK 1.2.189.2 : https://vulkan.lunarg.com/

### Build

For the DirectX11 and DirectX12 samples use the following:

```
$> cd samples
$> mkdir build
$> cd build
$> cmake ..
```

For building the Vulkan sample add the following command line option:

```
$> cmake .. -DNIS_VK_SAMPLE=ON
```

For building the NV12 sample add the following command line option

```
$> cmake .. -DNIS_NV12_SAMPLE=ON
```

For building the Streamline sample, first checkout and build the NVIDA Streamline SDK. Specify your Visual Studio version (default vs2017)

```
$> cd samples\third_party
$> setup_streamline.bat vs2019
```

After the Streamline build process is completed then add the following command line option to the cmake command. Note that you can also build other samples by concatenating command line options

```
$> cd samples
$> cmake .. -DNIS_SL_SAMPLE=ON
```

Open the solution with Visual Studio 2019. Right-click the sample project and select "Set as Startup Project" before building the project. For Linux, only the VK sample will be generated.

================================================
FILE: LICENSE
================================================
BSD 2-Clause License

Copyright (c) 2013-2022, Valve Corporation
Copyright (c) 2022, NVIDIA CORPORATION
All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this
   list of conditions and the following disclaimer.

2. Redistributions in binary form must reproduce the above copyright notice,
   this list of conditions and the following disclaimer in the documentation
   and/or other materials provided with the distribution.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

========================================================

Tetrahedal 3D LUT code from OpenColorIO

Licensed under BSD 3-Clause "New" or "Revised" License:

Copyright Contributors to the OpenColorIO Project.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are
met:

* Redistributions of source code must retain the above copyright
  notice, this list of conditions and the following disclaimer.
* Redistributions in binary form must reproduce the above copyright
  notice, this list of conditions and the following disclaimer in the
  documentation and/or other materials provided with the distribution.
* Neither the name of the copyright holder nor the names of its
  contributors may be used to endorse or promote products derived from
  this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
"AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

========================================================

Reshade effects compiler from Reshade

Copyright 2014 Patrick Mours. All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

    Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
    Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.
    Neither the name of the copyright holder nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.



================================================
FILE: default_extras_install.sh
================================================
// [OUTLINE - 0 symbols, 8 lines]


================================================
FILE: layer/VkLayer_FROG_gamescope_wsi.cpp
================================================
// [OUTLINE - 95 symbols, 2341 lines]
// import "vkroots.h"
// import "xcb_helpers.hpp"
// import "vulkan_operators.hpp"
// import "present_timing.hpp"
// import "gamescope-swapchain-client-protocol.h"
// import "gamescope-limiter-client-protocol.h"
// import "../src/color_helpers.h"
// import "../src/layer_defines.h"
// import "../src/Utils/Defer.h"
// import <atomic>
// import <cerrno>
// import <charconv>
// import <cstdio>
// import <cstring>
// import <memory>
// import <utility>
// import <tuple>
// import <vector>
// import <algorithm>
// import <functional>
// import <unordered_map>
// import <optional>
// import <poll.h>
// import <sys/stat.h>
// import <time.h>
// import <fcntl.h>
// import <unistd.h>
// import "../src/messagey.h"
// L43-L45: static uint64_t timespecToNanos(struct timespec& spec)
// L43: struct timespec
// L47-L51: [[maybe_unused]] static uint64_t getTimeMonotonic()
// L53-L55: static bool contains(const std::vector<const char *> vec, std::string_view lookupValue)
// L59-L90: static int waylandPumpEvents(wl_display *display, wl_event_queue *queue, wl_event_queue *globalsQueue)
// L94-L108: class ChainRemoval
// L97-L100: explicit ChainRemoval(U *root, bool remove = true)
// L101-L104: ~ChainRemoval()
// L111-L185: class PresentInfoSlice
// L113-L152: PresentInfoSlice(const VkPresentInfoKHR &source, uint32_t index, VkResult *result)
// L154: PresentInfoSlice(const PresentInfoSlice &) = delete;
// L155: PresentInfoSlice &operator=(const PresentInfoSlice &) = delete;
// L162-L169: T &append(const VkBaseInStructure *entry)
// L172-L179: void slice(const VkBaseInStructure *entry, uint32_t index, Array T::*array)
// L187-L193: uint32_t clientAppId()
// L195-L197: static const char* gamescopeWaylandSocket()
// L199-L204: static bool isAppInfoGamescope(const VkApplicationInfo *appInfo)
// L206-L245: static bool isRunningUnderGamescope()
// L231: struct stat
// L248-L259: std::optional<T> parseEnv(const char *envName)
// L262-L271: std::optional<bool> parseEnv(const char *envName)
// L273-L294: static uint32_t getMinImageCount()
// L296-L307: static bool getEnsureMinImageCount()
// L313-L352: static char *
// L354-L381: std::string_view getExecutableName()
// L383-L443: static GamescopeLayerClient::Flags defaultLayerClientFlags(const VkApplicationInfo *pApplicationInfo, uint32_t appid)
// L447-L455: struct GamescopeLimiterState
// L448-L451: ~GamescopeLimiterState()
// L467-L494: static uint32_t gamescopeFrameLimiterFileOverride()
// L496-L529: struct GamescopeWaylandObjects
// L504-L524: static GamescopeWaylandObjects get(wl_display *display)
// L526: bool valid() const
// L553-L558: static bool gamescopeIsForcingFifo(const GamescopeWaylandObjects& waylandObjects)
// L560-L566: struct GamescopeInstanceData
// L569-L702: struct GamescopeSurfaceData
// L585-L588: bool isWayland() const
// L590-L592: bool frameLimiterAware() const
// L594-L597: bool shouldExposeHDR() const
// L599-L701: bool canBypassXWayland(bool hdrColorspace = false)
// L705-L725: struct GamescopeSwapchainData
// L797-L812: static VkResult enumerateValues(Function function, std::vector<T> &values, Args... args)
// L817-L819: static bool hasExtension(const std::vector<VkExtensionProperties> &extensions, std::string_view name)
// L821-L839: static bool presentTimingSupported(const vkroots::VkPhysicalDeviceDispatch &dispatch,
// L844-L882: static VkResult calibratePresentTimestamps(Next next, VkDevice device, uint32_t count,
// L884-L1491: class VkInstanceOverrides
// L886-L970: static VkResult CreateInstance(
// L972-L985: static void DestroyInstance(
// L987-L1021: static VkResult CreateDevice(
// L1023-L1034: static VkBool32 GetPhysicalDeviceXcbPresentationSupportKHR(
// L1036-L1047: static VkBool32 GetPhysicalDeviceXlibPresentationSupportKHR(
// L1049-L1060: static VkResult CreateXcbSurfaceKHR(
// L1062-L1073: static VkResult CreateXlibSurfaceKHR(
// L1075-L1114: static VkResult CreateWaylandSurfaceKHR(
// L1129-L1155: static VkResult GetPhysicalDeviceSurfaceFormatsKHR(
// L1157-L1184: static VkResult GetPhysicalDeviceSurfaceFormats2KHR(
// L1186-L1209: static VkResult GetPhysicalDeviceSurfaceCapabilitiesKHR(
// L1211-L1263: static VkResult GetPhysicalDeviceSurfaceCapabilities2KHR(
// L1265-L1278: static void GetPhysicalDeviceFeatures2(
// L1280-L1285: static void GetPhysicalDeviceFeatures2KHR(
// L1287-L1303: static VkResult GetPhysicalDeviceSurfacePresentModesKHR(
// L1305-L1320: static void DestroySurfaceKHR(
// L1322-L1350: static VkResult EnumerateDeviceExtensionProperties(
// L1353-L1358: static VkResult GetPhysicalDeviceCalibrateableTimeDomainsKHR(
// L1360-L1365: static VkResult GetPhysicalDeviceCalibrateableTimeDomainsEXT(
// L1368-L1380: static VkResult CalibrateableTimeDomains(
// L1383-L1471: static VkResult CreateGamescopeSurface(
// L1473-L1481: static void DumpGamescopeSurfaceState(GamescopeInstanceData * instance, GamescopeSurfaceData * surface)
// L1477: struct wl_proxy
// L1483-L1489: static VkBool32 GetPhysicalDeviceGamescopePresentationSupport(
// L1493-L2285: class VkDeviceOverrides
// L1495-L1501: static void DestroyDevice(
// L1503-L1516: static void DestroySwapchainKHR(
// L1518-L1724: static VkResult CreateSwapchainKHR(
// L1726-L1744: static VkResult AcquireNextImageKHR(
// L1746-L1757: static VkResult AcquireNextImage2KHR(
// L1761-L1763: static VkResult AfterSubmission(VkResult result)
// L1767-L1814: static VkResult PresentWithoutImage(
// L1816-L1831: static VkResult MergePresentResults(VkResult previous, VkResult current)
// L1834-L1836: static bool CanSplit(const VkPresentInfoKHR &info)
// L1838-L1879: static VkResult PresentSwapchains(const vkroots::VkQueueDispatch &dispatch, VkQueue queue,
// L1881-L2136: static VkResult QueuePresentKHR(
// L2138-L2176: static void SetHdrMetadataEXT(
// L2178-L2185: static VkResult SetSwapchainPresentTimingQueueSizeEXT(
// L2187-L2197: static VkResult GetSwapchainTimingPropertiesEXT(
// L2199-L2207: static VkResult GetSwapchainTimeDomainPropertiesEXT(
// L2209-L2219: static VkResult GetPastPresentationTimingEXT(
// L2221-L2226: static VkResult GetCalibratedTimestampsKHR(
// L2228-L2233: static VkResult GetCalibratedTimestampsEXT(
// L2235-L2261: static VkResult GetPastPresentationTimingGOOGLE(
// L2263-L2283: static VkResult GetRefreshCycleDurationGOOGLE(
// L2287-L2300: static PFN_vkVoidFunction VKAPI_CALL getDeviceProcAddr(VkDevice device, const char *name)
// L2302-L2305: static bool isCalibrationDomainQuery(const char *name)
// L2309-L2322: static PFN_vkVoidFunction VKAPI_CALL getInstanceProcAddr(VkInstance instance, const char *name)
// L2324-L2329: static PFN_vkVoidFunction VKAPI_CALL getPhysicalDeviceProcAddr(VkInstance instance, const char *name)
// L2332-L2341: VK_LAYER_EXPORT VKAPI_ATTR VkResult VKAPI_CALL vkNegotiateLoaderLayerInterfaceVersion(VkNegotiateLayerInterface *interface)


================================================
FILE: layer/VkLayer_FROG_gamescope_wsi.json.in
================================================
{
    "file_format_version" : "1.0.0",
    "layer" : {
      "name": "VK_LAYER_FROG_gamescope_wsi_@family@",
      "type": "GLOBAL",
      "api_version": "1.3.221",
      "library_path": "@lib_dir@/libVkLayer_FROG_gamescope_wsi_@family@.so",
      "implementation_version": "1",
      "description": "Gamescope WSI (XWayland Bypass) Layer (@family@)",
      "functions": {
         "vkNegotiateLoaderLayerInterfaceVersion": "vkNegotiateLoaderLayerInterfaceVersion"
      },
      "enable_environment": {
        "ENABLE_GAMESCOPE_WSI": "1"
      },
      "disable_environment": {
        "DISABLE_GAMESCOPE_WSI": "1"
      }
    }
}


================================================
FILE: layer/meson.build
================================================
vkroots_dep = dependency('vkroots')
if not cppc.compiles('''
  #include <vulkan/vulkan.h>
  #if !defined(VK_EXT_PRESENT_TIMING_SPEC_VERSION) || VK_EXT_PRESENT_TIMING_SPEC_VERSION < 3
  #error Vulkan headers with VK_EXT_present_timing revision 3 are required
  #endif
''', dependencies: vulkan_dep, name: 'VK_EXT_present_timing revision 3')
  error('The Gamescope WSI layer requires Vulkan-Headers 1.4.335 or newer')
endif
dep_xcb = dependency('xcb')
dep_x11_xcb = dependency('x11-xcb')
wayland_client = dependency('wayland-client')

gamescope_wsi_layer = shared_library('VkLayer_FROG_gamescope_wsi_' + host_machine.cpu_family(), 'VkLayer_FROG_gamescope_wsi.cpp', protocols_client_src,
  dependencies     : [ vkroots_dep, vulkan_dep, dep_xcb, dep_x11, dep_x11_xcb, glm_dep, wayland_client ],
  install          : true )

out_lib_dir = join_paths(prefix, lib_dir)

configure_file(
    input         : 'VkLayer_FROG_gamescope_wsi.json.in',
    output        : 'VkLayer_FROG_gamescope_wsi.' + host_machine.cpu_family() + '.json',
    configuration : {'family' : host_machine.cpu_family(), 'lib_dir' : out_lib_dir },
    install       : true,
    install_dir   : join_paths(data_dir, 'vulkan', 'implicit_layer.d'),
    install_tag   : 'runtime'
)

================================================
FILE: layer/present_timing.hpp
================================================
// [OUTLINE - 13 symbols, 197 lines]
// import <vulkan/vulkan.h>
// import <algorithm>
// import <array>
// import <cstdint>
// import <optional>
// import <vector>
// L14-L195: class PresentTimingQueue
// L16-L22: VkResult setSize(uint32_t size)
// L24-L29: uint64_t nextSerial()
// L31-L33: bool hasSlot() const
// L35-L47: std::optional<uint64_t> reserve(uint64_t presentId, uint64_t targetTime, VkPresentStageFlagsEXT stageQueries)
// L49-L56: void complete(uint64_t serial, uint64_t queueEnd, uint64_t requestDequeued, uint64_t pixelOut)
// L58-L65: void setTimingProperties(uint64_t refreshDuration, uint64_t refreshInterval)
// L67-L73: VkResult getTimingProperties(VkSwapchainTimingPropertiesEXT *properties, uint64_t *counter) const
// L75-L93: VkResult getTimeDomainProperties(VkSwapchainTimeDomainPropertiesEXT *properties, uint64_t *counter) const
// L95-L140: VkResult getPast(const VkPastPresentationTimingInfoEXT *info, VkPastPresentationTimingPropertiesEXT *properties)
// L154-L161: struct Entry
// L163-L172: uint32_t availableCount(bool outOfOrder) const
// L175-L186: uint32_t writeStages(const Entry &entry, VkPresentStageTimeEXT *outputs, uint32_t capacity)


================================================
FILE: layer/vulkan_operators.hpp
================================================
// [OUTLINE - 12 symbols, 90 lines]
// import <vulkan/vulkan_core.h>
// L5-L13: inline bool operator == (
// L16-L20: inline bool operator != (
// L23-L30: inline bool operator == (
// L33-L37: inline bool operator != (
// L40-L44: inline bool operator == (VkExtent3D a, VkExtent3D b)
// L47-L51: inline bool operator != (VkExtent3D a, VkExtent3D b)
// L54-L57: inline bool operator == (VkExtent2D a, VkExtent2D b)
// L60-L63: inline bool operator != (VkExtent2D a, VkExtent2D b)
// L66-L70: inline bool operator == (VkOffset3D a, VkOffset3D b)
// L73-L77: inline bool operator != (VkOffset3D a, VkOffset3D b)
// L80-L83: inline bool operator == (VkOffset2D a, VkOffset2D b)
// L86-L89: inline bool operator != (VkOffset2D a, VkOffset2D b)


================================================
FILE: layer/xcb_helpers.hpp
================================================
// [OUTLINE - 15 symbols, 214 lines]
// import <X11/Xlib-xcb.h>
// import <xcb/composite.h>
// import <cstdio>
// import <optional>
// L10-L15: struct ReplyDeleter
// L12-L14: void operator()(T* ptr) const
// L20-L29: static std::optional<xcb_atom_t> getAtom(xcb_connection_t* connection, std::string_view name)
// L32-L51: static std::optional<T> getPropertyValue(xcb_connection_t* connection, xcb_atom_t atom)
// L54-L60: static std::optional<T> getPropertyValue(xcb_connection_t* connection, std::string_view name)
// L63-L83: static std::optional<T> getPropertyValue(xcb_connection_t* connection, xcb_window_t window, std::string_view name)
// L85-L95: static std::optional<xcb_window_t> getParentWindow(xcb_connection_t* connection, xcb_window_t window)
// L97-L105: static bool isOverrideRedirect(xcb_connection_t* connection, xcb_window_t window)
// L107-L115: static bool hasProperty(xcb_connection_t* connection, xcb_window_t window, xcb_atom_t atom)
// L117-L132: static std::optional<xcb_window_t> getToplevelWindow(xcb_connection_t* connection, xcb_window_t window)
// L134-L148: static std::optional<VkRect2D> getWindowRect(xcb_connection_t* connection, xcb_window_t window)
// L150-L158: static VkRect2D clip(VkRect2D parent, VkRect2D child)
// L160-L165: static VkExtent2D max(VkExtent2D a, VkExtent2D b)
// L167-L205: static std::optional<VkExtent2D> getLargestObscuringChildWindowSize(xcb_connection_t* connection, xcb_window_t window)
// L209-L214: inline int32_t iabs(int32_t a)


================================================
FILE: looks/cb_deut_g22.cube
================================================
LUT_3D_SIZE 11
0.0000000 0.0000000 0.0000000
0.1165109 0.0000000 0.1016032
0.2330217 0.0000000 0.2032064
0.3495326 0.0000000 0.3048096
0.4660435 0.0000000 0.4064128
0.5825543 0.0000000 0.5080159
0.6990651 0.0000000 0.6096192
0.8155760 0.0000000 0.7112224
0.9320868 0.0000000 0.8128255
1.0000000 0.0000000 0.9144288
1.0000000 0.0000000 1.0000000
0.0000000 0.1086566 0.0000000
0.1000000 0.1000000 0.0000367
0.2263248 0.0560333 0.1817551
0.3454581 0.0000000 0.2921366
0.4631680 0.0000000 0.3975468
0.5803575 0.0000000 0.5012677
0.6973014 0.0000000 0.6042114
0.8141108 0.0000000 0.7067348
0.9308388 0.0000000 0.8090061
1.0000000 0.0000000 0.9111148
1.0000000 0.0000000 1.0000000
0.0000000 0.2173132 0.0000000
0.0000000 0.2136881 0.0000000
0.2000000 0.2000000 0.0002648
0.3303101 0.1713228 0.2398439
0.4526497 0.1120665 0.3635101
0.5723767 0.0000000 0.4760546
0.6909162 0.0000000 0.5842732
0.8088169 0.0000000 0.6903126
0.9263359 0.0000000 0.7950935
1.0000000 0.0000000 0.8990809
1.0000000 0.0000000 1.0000000
0.0000000 0.3259698 0.0000000
0.0000000 0.3237546 0.0000000
0.1354885 0.3156366 0.0000000
0.3000000 0.3000000 0.0004973
0.4324811 0.2745847 0.2880579
0.5573269 0.2349098 0.4248908
0.6789745 0.1680999 0.5452651
0.7989628 0.0000000 0.6587923
0.9179781 0.0000000 0.7686915
1.0000000 0.0000000 0.8764097
1.0000000 0.0000000 0.9827075
0.0000000 0.4346264 0.0000000
0.0000000 0.4330609 0.0000000
0.0000000 0.4273762 0.0000000
0.2461532 0.4166684 0.0000000
0.3999999 0.4000000 0.0000000
0.5338508 0.3760501 0.3303309
0.6606202 0.3426456 0.4796878
0.7839397 0.2955859 0.6079267
0.9052992 0.2241333 0.7270201
1.0000000 0.0426700 0.8411093
1.0000000 0.0000000 0.9521091
0.0000000 0.5432830 0.0000000
0.0000000 0.5420862 0.0000000
0.0000000 0.5377577 0.0000000
0.1341351 0.5296792 0.0000000
0.3502722 0.5173077 0.0000000
0.4999999 0.5000000 0.0001475
0.6347952 0.4768860 0.3685136
0.7630686 0.4466768 0.5297265
0.8878166 0.4072754 0.6656660
1.0000000 0.3547940 0.7903649
1.0000000 0.2801666 0.9087750
0.0000000 0.6519396 0.0000000
0.0000000 0.6509784 0.0000000
0.0000000 0.6475092 0.0000000
0.0000000 0.6410643 0.0000000
0.2709775 0.6312732 0.0000000
0.4524912 0.6177431 0.0000000
0.5999999 0.6000000 0.0000000
0.7354861 0.5774269 0.4036530
0.8649621 0.5491692 0.5761159
0.9909304 0.5139683 0.7195320
1.0000000 0.4698195 0.8497819
0.0000000 0.7605962 0.0000000
0.0000000 0.7597975 0.0000000
0.0000000 0.7569183 0.0000000
0.0000000 0.7515838 0.0000000
0.0823279 0.7435161 0.0000000
0.3847365 0.7324423 0.0000000
0.5538846 0.7180584 0.0000000
0.7000002 0.6999999 0.0009191
0.8360135 0.6778058 0.4364107
0.9664710 0.6508673 0.6195893
1.0000000 0.6183450 0.7702458
0.0000000 0.8692528 0.0000000
0.0000000 0.8685725 0.0000000
0.0000000 0.8661218 0.0000000
0.0000000 0.8615888 0.0000000
0.0000000 0.8547524 0.0000000
0.2784097 0.8454069 0.0000000
0.4923066 0.8333367 0.0000000
0.6548423 0.8182976 0.0000000
0.7999998 0.8000001 0.0000000
0.9364296 0.7780861 0.4672372
1.0000000 0.7521002 0.6606621
0.0000000 0.9779094 0.0000000
0.0000000 0.9773189 0.0000000
0.0000000 0.9751925 0.0000000
0.0000000 0.9712638 0.0000000
0.0000000 0.9653495 0.0000000
0.0000000 0.9572862 0.0000000
0.4064654 0.9469098 0.0000000
0.5971560 0.9340433 0.0000000
0.7555407 0.9184855 0.0000000
0.8999999 0.9000001 0.0000000
1.0000000 0.8783016 0.4964551
0.0000000 1.0000000 0.0000000
0.0000000 1.0000000 0.0000000
0.0000000 1.0000000 0.0000000
0.0000000 1.0000000 0.0000000
0.0000000 1.0000000 0.0000000
0.0000000 1.0000000 0.0000000
0.2682699 1.0000000 0.0000000
0.5217223 1.0000000 0.0000000
0.7005442 1.0000000 0.0000000
0.8560739 1.0000000 0.0000000
0.9999998 1.0000000 0.0000000
0.0000000 0.0000463 0.1000000
0.1165109 0.0000000 0.1381388
0.2330217 0.0000000 0.2216114
0.3495326 0.0000000 0.3164739
0.4660434 0.0000000 0.4147590
0.5825543 0.0000000 0.5144317
0.6990651 0.0000000 0.6147869
0.8155759 0.0000000 0.7155236
0.9320868 0.0000000 0.8164933
1.0000000 0.0000000 0.9176151
1.0000000 0.0000000 1.0000000
0.0000000 0.1086566 0.0000000
0.1000000 0.1000000 0.1000000
0.2263248 0.0560333 0.2025138
0.3454581 0.0000000 0.3043844
0.4631680 0.0000000 0.4061118
0.5803575 0.0000000 0.5077857
0.6973014 0.0000000 0.6094342
0.8141107 0.0000000 0.7110686
0.9308388 0.0000000 0.8126946
1.0000000 0.0000000 0.9143150
1.0000000 0.0000000 1.0000000
0.0000000 0.2173132 0.0000000
0.0000000 0.2136881 0.0000000
0.2000000 0.2000000 0.1000000
0.3303102 0.1713227 0.2551641
0.4526497 0.1120665 0.3730201
0.5723767 0.0000000 0.4829826
0.6909162 0.0000000 0.5897084
0.8088169 0.0000000 0.6947697
0.9263359 0.0000000 0.7988592
1.0000000 0.0000000 0.9023322
1.0000000 0.0000000 1.0000000
0.0000000 0.3259698 0.0000000
0.0000000 0.3237545 0.0000000
0.1354887 0.3156366 0.0000000
0.3000000 0.3000000 0.1000004
0.4324811 0.2745847 0.3005046
0.5573269 0.2349098 0.4328123
0.6789744 0.1680999 0.5511649
0.7989628 0.0000000 0.6635044
0.9179781 0.0000000 0.7726120
1.0000000 0.0000000 0.8797620
1.0000000 0.0000000 0.9856308
0.0000000 0.4346265 0.0000000
0.0000000 0.4330609 0.0000000
0.0000000 0.4273762 0.0000000
0.2461531 0.4166684 0.0000000
0.3999999 0.4000001 0.0999996
0.5338508 0.3760502 0.3409605
0.6606202 0.3426456 0.4865538
0.7839397 0.2955859 0.6131114
0.9052991 0.2241333 0.7312102
1.0000000 0.0426693 0.8446304
1.0000000 0.0000000 0.9551454
0.0000000 0.5432830 0.0000000
0.0000000 0.5420863 0.0000000
0.0000000 0.5377578 0.0000000
0.1341347 0.5296792 0.0000000
0.3502722 0.5173077 0.0000000
0.4999999 0.5000000 0.1000000
0.6347952 0.4768860 0.3778731
0.7630686 0.4466769 0.5358318
0.8878165 0.4072753 0.6703203
1.0000000 0.3547940 0.7941574
1.0000000 0.2801668 0.9119850
0.0000000 0.6519396 0.0000000
0.0000000 0.6509785 0.0000000
0.0000000 0.6475092 0.0000000
0.0000000 0.6410643 0.0000000
0.2709774 0.6312732 0.0000000
0.4524911 0.6177431 0.0000000
0.5999998 0.6000000 0.1000000
0.7354861 0.5774270 0.4120662
0.8649621 0.5491692 0.5816426
0.9909305 0.5139683 0.7237741
1.0000000 0.4698194 0.8532599
0.0000000 0.7605962 0.0000000
0.0000000 0.7597975 0.0000000
0.0000000 0.7569183 0.0000000
0.0000000 0.7515838 0.0000000
0.0823270 0.7435161 0.0000000
0.3847364 0.7324423 0.0000000
0.5538847 0.7180584 0.0000000
0.7000000 0.6999999 0.1000016
0.8360136 0.6778058 0.4440868
0.9664710 0.6508673 0.6246588
1.0000000 0.6183451 0.7741569
0.0000000 0.8692528 0.0000000
0.0000000 0.8685726 0.0000000
0.0000000 0.8661218 0.0000000
0.0000000 0.8615889 0.0000000
0.0000000 0.8547524 0.0000000
0.2784093 0.8454070 0.0000000
0.4923064 0.8333368 0.0000000
0.6548420 0.8182977 0.0000000
0.7999999 0.8000001 0.1000000
0.9364295 0.7780861 0.4743194
1.0000000 0.7521002 0.6653580
0.0000000 0.9779095 0.0000000
0.0000000 0.9773189 0.0000000
0.0000000 0.9751925 0.0000000
0.0000000 0.9712638 0.0000000
0.0000000 0.9653494 0.0000000
0.0000000 0.9572862 0.0000000
0.4064654 0.9469098 0.0000000
0.5971559 0.9340432 0.0000000
0.7555407 0.9184855 0.0000000
0.9000000 0.9000001 0.0999999
1.0000000 0.8783017 0.5030479
0.0000000 1.0000000 0.0000000
0.0000000 1.0000000 0.0000000
0.0000000 1.0000000 0.0000000
0.0000000 1.0000000 0.0000000
0.0000000 1.0000000 0.0000000
0.0000000 1.0000000 0.0000000
0.2682702 1.0000000 0.0000000
0.5217218 1.0000000 0.0000000
0.7005443 1.0000000 0.0000000
0.8560738 1.0000000 0.0000000
0.9999997 1.0000000 0.0999968
0.0000000 0.0000785 0.2000000
0.1165109 0.0000000 0.2193584
0.2330217 0.0000000 0.2762776
0.3495326 0.0000000 0.3546892
0.4660434 0.0000000 0.4432229
0.5825543 0.0000000 0.5367402
0.6990651 0.0000000 0.6329478
0.8155760 0.0000000 0.7307357
0.9320868 0.0000000 0.8295180
1.0000000 0.0000000 0.9289613
1.0000000 0.0000000 1.0000000
0.0000000 0.1086566 0.1780795
0.1000000 0.1000000 0.2000000
0.2263248 0.0560333 0.2619273
0.3454581 0.0000000 0.3442007
0.4631680 0.0000000 0.4352515
0.5803575 0.0000000 0.5304287
0.6973014 0.0000000 0.6277806
0.8141107 0.0000000 0.7263926
0.9308388 0.0000000 0.8257911
1.0000000 0.0000000 0.9257097
1.0000000 0.0000000 1.0000000
0.0000000 0.2173132 0.0000000
0.0000000 0.2136881 0.0939637
0.2000000 0.2000000 0.2000000
0.3303101 0.1713228 0.3028496
0.4526496 0.1120666 0.4050275
0.5723767 0.0000000 0.5069569
0.6909162 0.0000000 0.6087686
0.8088169 0.0000000 0.7105156
0.9263359 0.0000000 0.8122236
1.0000000 0.0000000 0.9139062
1.0000000 0.0000000 1.0000000
0.0000000 0.3259698 0.0000000
0.0000000 0.3237546 0.0000000
0.1354884 0.3156366 0.0000000
0.3000000 0.3000000 0.2000000
0.4324810 0.2745847 0.3408592
0.5573268 0.2349099 0.4599509
0.6789744 0.1680999 0.5717737
0.7989628 0.0000000 0.6801214
0.9179782 0.0000000 0.7865125
1.0000000 0.0000000 0.8916879
1.0000000 0.0000000 0.9960551
0.0000000 0.4346264 0.0000000
0.0000000 0.4330609 0.0000000
0.0000000 0.4273762 0.0000000
0.2461532 0.4166684 0.0000000
0.3999999 0.4000001 0.1999998
0.5338508 0.3760501 0.3762520
0.6606202 0.3426456 0.5103281
0.7839397 0.2955858 0.6313301
0.9052992 0.2241331 0.7460402
1.0000000 0.0426687 0.8571447
1.0000000 0.0000000 0.9659653
0.0000000 0.5432830 0.0000000
0.0000000 0.5420862 0.0000000
0.0000000 0.5377577 0.0000000
0.1341353 0.5296792 0.0000000
0.3502723 0.5173076 0.0000000
0.4999999 0.4999999 0.2000003
0.6347952 0.4768860 0.4094298
0.7630686 0.4466768 0.5571211
0.8878166 0.4072754 0.6867400
1.0000000 0.3547941 0.8076150
1.0000000 0.2801669 0.9234141
0.0000000 0.6519396 0.0000000
0.0000000 0.6509784 0.0000000
0.0000000 0.6475092 0.0000000
0.0000000 0.6410643 0.0000000
0.2709778 0.6312732 0.0000000
0.4524912 0.6177431 0.0000000
0.5999999 0.6000000 0.2000000
0.7354861 0.5774269 0.4407376
0.8649620 0.5491693 0.6010091
0.9909304 0.5139684 0.7387829
1.0000000 0.4698195 0.8656247
0.0000000 0.7605962 0.0000000
0.0000000 0.7597976 0.0000000
0.0000000 0.7569183 0.0000000
0.0000000 0.7515839 0.0000000
0.0823274 0.7435162 0.0000000
0.3847363 0.7324423 0.0000000
0.5538846 0.7180585 0.0000000
0.7000000 0.7000000 0.2000007
0.8360135 0.6778058 0.4704519
0.9664710 0.6508673 0.6424860
1.0000000 0.6183452 0.7880245
0.0000000 0.8692529 0.0000000
0.0000000 0.8685726 0.0000000
0.0000000 0.8661218 0.0000000
0.0000000 0.8615889 0.0000000
0.0000000 0.8547525 0.0000000
0.2784101 0.8454069 0.0000000
0.4923063 0.8333368 0.0000000
0.6548423 0.8182976 0.0000000
0.7999998 0.8000001 0.1999986
0.9364296 0.7780861 0.4987925
1.0000000 0.7521002 0.6819212
0.0000000 0.9779094 0.0000000
0.0000000 0.9773189 0.0000000
0.0000000 0.9751925 0.0000000
0.0000000 0.9712638 0.0000000
0.0000000 0.9653494 0.0000000
0.0000000 0.9572862 0.0000000
0.4064653 0.9469098 0.0000000
0.5971560 0.9340433 0.0000000
0.7555405 0.9184856 0.0000000
0.8999999 0.9000001 0.2000000
1.0000000 0.8783017 0.5259349
0.0000000 1.0000000 0.0000000
0.0000000 1.0000000 0.0000000
0.0000000 1.0000000 0.0000000
0.0000000 1.0000000 0.0000000
0.0000000 1.0000000 0.0000000
0.0000000 1.0000000 0.0000000
0.2682698 1.0000000 0.0000000
0.5217223 1.0000000 0.0000000
0.7005442 1.0000000 0.0000000
0.8560738 1.0000000 0.0000000
0.9999996 1.0000000 0.1999987
0.0000000 0.0001076 0.3000000
0.1165109 0.0000000 0.3122928
0.2330217 0.0000000 0.3523357
0.3495326 0.0000000 0.4144164
0.4660435 0.0000000 0.4905517
0.5825543 0.0000000 0.5751265
0.6990651 0.0000000 0.6648344
0.8155760 0.0000000 0.7577847
0.9320868 0.0000000 0.8528712
1.0000000 0.0000000 0.9494216
1.0000000 0.0000000 1.0000000
0.0000000 0.1086566 0.2870708
0.1000000 0.1000000 0.3000000
0.2263248 0.0560333 0.3417602
0.3454581 0.0000000 0.4057605
0.4631680 0.0000000 0.4835095
0.5803575 0.0000000 0.5693230
0.6973014 0.0000000 0.6599655
0.8141108 0.0000000 0.7536279
0.9308388 0.0000000 0.8492669
1.0000000 0.0000000 0.9462544
1.0000000 0.0000000 1.0000000
0.0000000 0.2173132 0.2333881
0.0000000 0.2136881 0.2497236
0.2000000 0.2000000 0.3000000
0.3303101 0.1713228 0.3726309
0.4526497 0.1120665 0.4571115
0.5723768 0.0000000 0.5478480
0.6909163 0.0000000 0.6420957
0.8088170 0.0000000 0.7384528
0.9263359 0.0000000 0.8361561
1.0000000 0.0000000 0.9347620
1.0000000 0.0000000 1.0000000
0.0000000 0.3259698 0.0000000
0.0000000 0.3237546 0.0814283
0.1354885 0.3156366 0.1952712
0.3000001 0.3000000 0.3000001
0.4324811 0.2745846 0.4030226
0.5573269 0.2349098 0.5054272
0.6789745 0.1680998 0.6075413
0.7989628 0.0000000 0.7094964
0.9179782 0.0000000 0.8113557
1.0000000 0.0000000 0.9131528
1.0000000 0.0000000 1.0000000
0.0000000 0.4346264 0.0000000
0.0000000 0.4330609 0.0000000
0.0000000 0.4273762 0.0000000
0.2461535 0.4166683 0.0980909
0.4000000 0.4000000 0.3000000
0.5338508 0.3760502 0.4324867
0.6606202 0.3426456 0.5509213
0.7839396 0.2955859 0.6633095
0.9052992 0.2241333 0.7724497
1.0000000 0.0426699 0.8796231
1.0000000 0.0000000 0.9855096
0.0000000 0.5432830 0.0000000
0.0000000 0.5420863 0.0000000
0.0000000 0.5377578 0.0000000
0.1341351 0.5296792 0.0000000
0.3502722 0.5173077 0.0000000
0.4999999 0.5000000 0.3000000
0.6347951 0.4768861 0.4609244
0.7630686 0.4466769 0.5939444
0.8878167 0.4072753 0.7157908
1.0000000 0.3547940 0.8317062
1.0000000 0.2801666 0.9440187
0.0000000 0.6519396 0.0000000
0.0000000 0.6509784 0.0000000
0.0000000 0.6475092 0.0000000
0.0000000 0.6410643 0.0000000
0.2709772 0.6312732 0.0000000
0.4524913 0.6177431 0.0000000
0.5999999 0.6000000 0.3000000
0.7354863 0.5774269 0.4883530
0.8649621 0.5491692 0.6348233
0.9909305 0.5139683 0.7654923
1.0000000 0.4698195 0.8878466
0.0000000 0.7605962 0.0000000
0.0000000 0.7597976 0.0000000
0.0000000 0.7569183 0.0000000
0.0000000 0.7515839 0.0000000
0.0823278 0.7435161 0.0000000
0.3847363 0.7324423 0.0000000
0.5538849 0.7180584 0.0000000
0.7000000 0.7000000 0.3000004
0.8360136 0.6778058 0.5148284
0.9664709 0.6508674 0.6738343
1.0000000 0.6183451 0.8128126
0.0000000 0.8692528 0.0000000
0.0000000 0.8685726 0.0000000
0.0000000 0.8661218 0.0000000
0.0000000 0.8615888 0.0000000
0.0000000 0.8547524 0.0000000
0.2784089 0.8454070 0.0000000
0.4923067 0.8333367 0.0000000
0.6548422 0.8182976 0.0000000
0.7999999 0.8000001 0.2999992
0.9364297 0.7780860 0.5404207
1.0000000 0.7521002 0.7112074
0.0000000 0.9779094 0.0000000
0.0000000 0.9773189 0.0000000
0.0000000 0.9751925 0.0000000
0.0000000 0.9712638 0.0000000
0.0000000 0.9653494 0.0000000
0.0000000 0.9572862 0.0000000
0.4064654 0.9469098 0.0000000
0.5971563 0.9340432 0.0000000
0.7555408 0.9184855 0.0000000
0.8999997 0.9000001 0.2999992
1.0000000 0.8783017 0.5651981
0.0000000 1.0000000 0.0000000
0.0000000 1.0000000 0.0000000
0.0000000 1.0000000 0.0000000
0.0000000 1.0000000 0.0000000
0.0000000 1.0000000 0.0000000
0.0000000 1.0000000 0.0000000
0.2682696 1.0000000 0.0000000
0.5217221 1.0000000 0.0000000
0.7005445 1.0000000 0.0000000
0.8560737 1.0000000 0.0000000
0.9999996 1.0000000 0.2999992
0.0000000 0.0001475 0.4000000
0.1165109 0.0000000 0.4088023
0.2330217 0.0000000 0.4387169
0.3495326 0.0000000 0.4881680
0.4660434 0.0000000 0.5525553
0.5825543 0.0000000 0.6274050
0.6990651 0.0000000 0.7093784
0.8155760 0.0000000 0.7962191
0.9320868 0.0000000 0.8864458
1.0000000 0.0000000 0.9790839
1.0000000 0.0000000 1.0000000
0.0000000 0.1086566 0.3909589
0.0999999 0.1000001 0.4000000
0.2263248 0.0560333 0.4306451
0.3454581 0.0000000 0.4810839
0.4631679 0.0000000 0.5464626
0.5803575 0.0000000 0.6221824
0.6973014 0.0000000 0.7048767
0.8141108 0.0000000 0.7923033
0.9308388 0.0000000 0.8830055
1.0000000 0.0000000 0.9760318
1.0000000 0.0000000 1.0000000
0.0000000 0.2173132 0.3561589
0.0000000 0.2136881 0.3662392
0.2000000 0.2000000 0.4000000
0.3303101 0.1713228 0.4545157
0.4526496 0.1120666 0.5238547
0.5723768 0.0000000 0.6029580
0.6909162 0.0000000 0.6884013
0.8088170 0.0000000 0.7780309
0.9263359 0.0000000 0.8705031
1.0000000 0.0000000 0.9649642
1.0000000 0.0000000 1.0000000
0.0000000 0.3259698 0.2782576
0.0000000 0.3237546 0.2916552
0.1354883 0.3156366 0.3346539
0.3000000 0.3000000 0.4000000
0.4324810 0.2745847 0.4788548
0.5573268 0.2349098 0.5655036
0.6789745 0.1680998 0.6567703
0.7989628 0.0000000 0.7509051
0.9179782 0.0000000 0.8469090
1.0000000 0.0000000 0.9441842
1.0000000 0.0000000 1.0000000
0.0000000 0.4346264 0.0000000
0.0000000 0.4330609 0.0564117
0.0000000 0.4273762 0.1879272
0.2461532 0.4166684 0.2956745
0.4000000 0.4000000 0.4000002
0.5338508 0.3760501 0.5031279
0.6606203 0.3426456 0.6056991
0.7839397 0.2955858 0.7079681
0.9052993 0.2241331 0.8100551
1.0000000 0.0426679 0.9120246
1.0000000 0.0000000 1.0000000
0.0000000 0.5432830 0.0000000
0.0000000 0.5420862 0.0000000
0.0000000 0.5377577 0.0000000
0.1341352 0.5296792 0.0000000
0.3502721 0.5173077 0.2461420
0.5000001 0.5000000 0.4000002
0.6347953 0.4768860 0.5270967
0.7630687 0.4466768 0.6444138
0.8878167 0.4072752 0.7567891
1.0000000 0.3547938 0.8662645
1.0000000 0.2801665 0.9738780
0.0000000 0.6519396 0.0000000
0.0000000 0.6509784 0.0000000
0.0000000 0.6475090 0.0000000
0.0000000 0.6410642 0.0000000
0.2709777 0.6312732 0.0000000
0.4524913 0.6177430 0.1763675
0.6000000 0.6000000 0.4000003
0.7354863 0.5774268 0.5506504
0.8649622 0.5491692 0.6817185
0.9909306 0.5139682 0.8034869
1.0000000 0.4698194 0.9199021
0.0000000 0.7605961 0.0000000
0.0000000 0.7597975 0.0000000
0.0000000 0.7569183 0.0000000
0.0000000 0.7515838 0.0000000
0.0823289 0.7435160 0.0000000
0.3847366 0.7324423 0.0000000
0.5538848 0.7180584 0.0000000
0.7000003 0.6999999 0.4000006
0.8360139 0.6778058 0.5737395
0.9664710 0.6508673 0.7177135
1.0000000 0.6183450 0.8482930
0.0000000 0.8692528 0.0000000
0.0000000 0.8685725 0.0000000
0.0000000 0.8661217 0.0000000
0.0000000 0.8615889 0.0000000
0.0000000 0.8547524 0.0000000
0.2784094 0.8454069 0.0000000
0.4923064 0.8333367 0.0000000
0.6548424 0.8182976 0.0000000
0.7999998 0.8000001 0.3999994
0.9364298 0.7780860 0.5963480
1.0000000 0.7521002 0.7525039
0.0000000 0.9779094 0.0000000
0.0000000 0.9773189 0.0000000
0.0000000 0.9751925 0.0000000
0.0000000 0.9712638 0.0000000
0.0000000 0.9653494 0.0000000
0.0000000 0.9572862 0.0000000
0.4064658 0.9469098 0.0000000
0.5971565 0.9340432 0.0000000
0.7555409 0.9184855 0.0000000
0.8999999 0.9000001 0.4000000
1.0000000 0.8783016 0.6184776
0.0000000 1.0000000 0.0000000
0.0000000 1.0000000 0.0000000
0.0000000 1.0000000 0.0000000
0.0000000 1.0000000 0.0000000
0.0000000 1.0000000 0.0000000
0.0000000 1.0000000 0.0000000
0.2682702 1.0000000 0.0000000
0.5217221 1.0000000 0.0000000
0.7005447 1.0000000 0.0000000
0.8560739 1.0000000 0.0000000
0.9999997 1.0000000 0.3999994
0.0000000 0.0002021 0.5000000
0.1165108 0.0000000 0.5067685
0.2330218 0.0000000 0.5302503
0.3495326 0.0000000 0.5704861
0.4660434 0.0000000 0.6250086
0.5825543 0.0000000 0.6906940
0.6990652 0.0000000 0.7647197
0.8155760 0.0000000 0.8448743
0.9320868 0.0000000 0.9295345
1.0000000 0.0000000 1.0000000
1.0000000 0.0000000 1.0000000
0.0000000 0.1086566 0.4931197
0.1000000 0.1000000 0.5000000
0.2263248 0.0560335 0.5238447
0.3454581 0.0000000 0.5646253
0.4631679 0.0000000 0.6197616
0.5803575 0.0000000 0.6860448
0.6973013 0.0000000 0.7606084
0.8141108 0.0000000 0.8412289
0.9308389 0.0000000 0.9262853
1.0000000 0.0000000 1.0000000
1.0000000 0.0000000 1.0000000
0.0000000 0.2173132 0.4673757
0.0000000 0.2136881 0.4747057
0.2000000 0.2000000 0.5000000
0.3303101 0.1713228 0.5429263
0.4526497 0.1120666 0.6004438
0.5723767 0.0000000 0.6690101
0.6909162 0.0000000 0.7456040
0.8088170 0.0000000 0.8279648
0.9263359 0.0000000 0.9144907
1.0000000 0.0000000 1.0000000
1.0000000 0.0000000 1.0000000
0.0000000 0.3259698 0.4149114
0.0000000 0.3237546 0.4233439
0.1354886 0.3156366 0.4521166
0.3000000 0.3000000 0.5000000
0.4324810 0.2745846 0.5627874
0.5573268 0.2349098 0.6362140
0.6789744 0.1680998 0.7169954
0.7989628 0.0000000 0.8028597
0.9179782 0.0000000 0.8922901
1.0000000 0.0000000 0.9842750
1.0000000 0.0000000 1.0000000
0.0000000 0.4346264 0.3166847
0.0000000 0.4330609 0.3282351
0.0000000 0.4273762 0.3662240
0.2461533 0.4166684 0.4259259
0.3999999 0.4000001 0.5000000
0.5338508 0.3760501 0.5829593
0.6606203 0.3426456 0.6714312
0.7839398 0.2955858 0.7634311
0.9052991 0.2241333 0.8577759
1.0000000 0.0426693 0.9537373
1.0000000 0.0000000 1.0000000
0.0000000 0.5432830 0.0000000
0.0000000 0.5420862 0.0000000
0.0000000 0.5377577 0.1774173
0.1341353 0.5296792 0.2897050
0.3502723 0.5173077 0.3958710
0.5000001 0.5000000 0.5000000
0.6347953 0.4768860 0.6031988
0.7630686 0.4466769 0.7058959
0.8878166 0.4072753 0.8082931
1.0000000 0.3547939 0.9104968
1.0000000 0.2801667 1.0000000
0.0000000 0.6519397 0.0000000
0.0000000 0.6509784 0.0000000
0.0000000 0.6475092 0.0000000
0.0000000 0.6410643 0.0000000
0.2709769 0.6312732 0.1649634
0.4524912 0.6177430 0.3611822
0.5999999 0.6000000 0.5000000
0.7354863 0.5774269 0.6233664
0.8649621 0.5491692 0.7395374
0.9909305 0.5139682 0.8516474
1.0000000 0.4698194 0.9612070
0.0000000 0.7605962 0.0000000
0.0000000 0.7597975 0.0000000
0.0000000 0.7569183 0.0000000
0.0000000 0.7515838 0.0000000
0.0823288 0.7435161 0.0000000
0.3847364 0.7324423 0.0000000
0.5538847 0.7180584 0.3203672
0.7000002 0.6999999 0.5000004
0.8360137 0.6778057 0.6433778
0.9664711 0.6508673 0.7723448
1.0000000 0.6183451 0.8935902
0.0000000 0.8692528 0.0000000
0.0000000 0.8685726 0.0000000
0.0000000 0.8661218 0.0000000
0.0000000 0.8615889 0.0000000
0.0000000 0.8547525 0.0000000
0.2784100 0.8454069 0.0000000
0.4923061 0.8333368 0.0000000
0.6548420 0.8182977 0.2703988
0.7999997 0.8000001 0.4999996
0.9364296 0.7780862 0.6631829
1.0000000 0.7521002 0.8043351
0.0000000 0.9779096 0.0000000
0.0000000 0.9773189 0.0000000
0.0000000 0.9751925 0.0000000
0.0000000 0.9712638 0.0000000
0.0000000 0.9653494 0.0000000
0.0000000 0.9572862 0.0000000
0.4064654 0.9469098 0.0000000
0.5971559 0.9340433 0.0000000
0.7555403 0.9184856 0.2035808
0.8999997 0.9000002 0.4999996
1.0000000 0.8783017 0.6827518
0.0000000 1.0000000 0.0000000
0.0000000 1.0000000 0.0000000
0.0000000 1.0000000 0.0000000
0.0000000 1.0000000 0.0000000
0.0000000 1.0000000 0.0000000
0.0000000 1.0000000 0.0000000
0.2682696 1.0000000 0.0000000
0.5217219 1.0000000 0.0000000
0.7005445 1.0000000 0.0000000
0.8560737 1.0000000 0.0752988
0.9999996 1.0000000 0.4999991
0.0002021 0.0001475 0.6000000
0.1165108 0.0000000 0.6054529
0.2330218 0.0000000 0.6245856
0.3495327 0.0000000 0.6580753
0.4660435 0.0000000 0.7046714
0.5825543 0.0000000 0.7623166
0.6990651 0.0000000 0.8288328
0.8155761 0.0000000 0.9022855
0.9320869 0.0000000 0.9811034
1.0000000 0.0000000 1.0000000
1.0000000 0.0000000 1.0000000
0.0000000 0.1086566 0.5944870
0.1000000 0.0999999 0.6000000
0.2263248 0.0560333 0.6193345
0.3454581 0.0000000 0.6531458
0.4631679 0.0000000 0.7001334
0.5803575 0.0000000 0.7581897
0.6973014 0.0000000 0.8251022
0.8141108 0.0000000 0.8989179
0.9308389 0.0000000 0.9780588
1.0000000 0.0000000 1.0000000
1.0000000 0.0000000 1.0000000
0.0000000 0.2173132 0.5741416
0.0000000 0.2136881 0.5798874
0.2000001 0.2000000 0.6000001
0.3303101 0.1713229 0.6350448
0.4526496 0.1120666 0.6835204
0.5723767 0.0000000 0.7431266
0.6909162 0.0000000 0.8115208
0.8088169 0.0000000 0.8866845
0.9263360 0.0000000 0.9670190
1.0000000 0.0000000 1.0000000
1.0000000 0.0000000 1.0000000
0.0000000 0.3259698 0.5342383
0.0000000 0.3237546 0.5404965
0.1354886 0.3156366 0.5623077
0.3000000 0.3000000 0.6000001
0.4324811 0.2745847 0.6516035
0.5573269 0.2349098 0.7143983
0.6789745 0.1680997 0.7857821
0.7989629 0.0000000 0.8636217
0.9179781 0.0000000 0.9462933
1.0000000 0.0000000 1.0000000
1.0000000 0.0000000 1.0000000
0.0000000 0.4346265 0.4667760
0.0000000 0.4330609 0.4741171
0.0000000 0.4273763 0.4994469
0.2461532 0.4166684 0.5424253
0.4000000 0.4000000 0.6000000
0.5338508 0.3760501 0.6686203
0.6606203 0.3426456 0.7452618
0.7839397 0.2955858 0.8276631
0.9052991 0.2241334 0.9142230
1.0000000 0.0426711 1.0000000
1.0000000 0.0000000 1.0000000
0.0000000 0.5432830 0.3505589
0.0000000 0.5420862 0.3608268
0.0000000 0.5377577 0.3951389
0.1341359 0.5296792 0.4503532
0.3502724 0.5173076 0.5203494
0.5000001 0.4999999 0.6000001
0.6347952 0.4768861 0.6858801
0.7630686 0.4466768 0.7758554
0.8878165 0.4072753 0.8686025
1.0000000 0.3547940 0.9632850
1.0000000 0.2801667 1.0000000
0.0000000 0.6519396 0.0000000
0.0000000 0.6509784 0.0000000
0.0000000 0.6475091 0.1628570
0.0000000 0.6410643 0.2818913
0.2709775 0.6312732 0.3905425
0.4524912 0.6177431 0.4959867
0.5999999 0.6000000 0.6000000
0.7354861 0.5774270 0.7032498
0.8649620 0.5491692 0.8060451
0.9909304 0.5139683 0.9085488
1.0000000 0.4698194 1.0000000
0.0000000 0.7605962 0.0000000
0.0000000 0.7597976 0.0000000
0.0000000 0.7569183 0.0000000
0.0000000 0.7515839 0.0000000
0.0823273 0.7435161 0.0000000
0.3847363 0.7324423 0.3134646
0.5538847 0.7180584 0.4690971
0.7000000 0.7000000 0.6000002
0.8360137 0.6778058 0.7206414
0.9664709 0.6508673 0.8357622
1.0000000 0.6183452 0.9475048
0.0000000 0.8692528 0.0000000
0.0000000 0.8685726 0.0000000
0.0000000 0.8661218 0.0000000
0.0000000 0.8615889 0.0000000
0.0000000 0.8547525 0.0000000
0.2784099 0.8454070 0.0000000
0.4923061 0.8333368 0.1961800
0.6548418 0.8182977 0.4392718
0.7999997 0.8000001 0.5999997
0.9364295 0.7780862 0.7379953
1.0000000 0.7521003 0.8649735
0.0000000 0.9779096 0.0000000
0.0000000 0.9773190 0.0000000
0.0000000 0.9751925 0.0000000
0.0000000 0.9712638 0.0000000
0.0000000 0.9653495 0.0000000
0.0000000 0.9572864 0.0000000
0.4064651 0.9469098 0.0000000
0.5971558 0.9340433 0.0000000
0.7555406 0.9184855 0.4058675
0.9000000 0.9000002 0.5999997
1.0000000 0.8783017 0.7552705
0.0000000 1.0000000 0.0000000
0.0000000 1.0000000 0.0000000
0.0000000 1.0000000 0.0000000
0.0000000 1.0000000 0.0000000
0.0000000 1.0000000 0.0000000
0.0000000 1.0000000 0.0000000
0.2682695 1.0000000 0.0000000
0.5217219 1.0000000 0.0000000
0.7005441 1.0000000 0.0000000
0.8560737 1.0000000 0.3678444
0.9999998 1.0000000 0.5999997
0.0002021 0.0000000 0.7000000
0.1165110 0.0000000 0.7045391
0.2330217 0.0000000 0.7205738
0.3495326 0.0000000 0.7490193
0.4660434 0.0000000 0.7893094
0.5825543 0.0000000 0.8401299
0.6990652 0.0000000 0.8998787
0.8155760 0.0000000 0.9669716
0.9320868 0.0000000 1.0000000
1.0000000 0.0000000 1.0000000
1.0000000 0.0000000 1.0000000
0.0000000 0.1086566 0.6954253
0.1000000 0.1000000 0.7000000
0.2263249 0.0560331 0.7161565
0.3454581 0.0000000 0.7448038
0.4631680 0.0000000 0.7853522
0.5803575 0.0000000 0.8364596
0.6973013 0.0000000 0.8965001
0.8141107 0.0000000 0.9638734
0.9308388 0.0000000 1.0000000
1.0000000 0.0000000 1.0000000
1.0000000 0.0000000 1.0000000
0.0000000 0.2173132 0.6786736
0.0000000 0.2136881 0.6833831
0.2000000 0.2000000 0.7000000
0.3303102 0.1713227 0.7294078
0.4526497 0.1120665 0.7709252
0.5723768 0.0000000 0.8231032
0.6909162 0.0000000 0.8842267
0.8088169 0.0000000 0.9526359
0.9263359 0.0000000 1.0000000
1.0000000 0.0000000 1.0000000
1.0000000 0.0000000 1.0000000
0.0000000 0.3259698 0.6464680
0.0000000 0.3237546 0.6514581
0.1354886 0.3156366 0.6690292
0.3000000 0.3000000 0.7000000
0.4324811 0.2745846 0.7434868
0.5573267 0.2349099 0.7978137
0.6789743 0.1681001 0.8610843
0.7989628 0.0000000 0.9315248
0.9179782 0.0000000 1.0000000
1.0000000 0.0000000 1.0000000
1.0000000 0.0000000 1.0000000
0.0000000 0.4346264 0.5943246
0.0000000 0.4330609 0.5998394
0.0000000 0.4273762 0.6191798
0.2461531 0.4166684 0.6530008
0.3999999 0.4000000 0.7000000
0.5338507 0.3760502 0.7580684
0.6606203 0.3426456 0.8249926
0.7839397 0.2955858 0.8988190
0.9052993 0.2241330 0.9779696
1.0000000 0.0426699 1.0000000
1.0000000 0.0000000 1.0000000
0.0000000 0.5432830 0.5136018
0.0000000 0.5420863 0.5201586
0.0000000 0.5377578 0.5429507
0.1341353 0.5296792 0.5821438
0.3502720 0.5173078 0.6354796
0.5000001 0.4999999 0.7000000
0.6347953 0.4768860 0.7729686
0.7630687 0.4466767 0.8522027
0.8878166 0.4072753 0.9360756
1.0000000 0.3547938 1.0000000
1.0000000 0.2801665 1.0000000
0.0000000 0.6519396 0.3809541
0.0000000 0.6509784 0.3902735
0.0000000 0.6475092 0.4217631
0.0000000 0.6410642 0.4733287
0.2709773 0.6312732 0.5398229
0.4524914 0.6177430 0.6165105
0.6000000 0.6000000 0.7000000
0.7354864 0.5774269 0.7880690
0.8649622 0.5491692 0.8792903
0.9909306 0.5139682 0.9727390
1.0000000 0.4698194 1.0000000
0.0000000 0.7605961 0.0000000
0.0000000 0.7597975 0.0000000
0.0000000 0.7569183 0.1426098
0.0000000 0.7515838 0.2719758
0.0823283 0.7435161 0.3839110
0.3847366 0.7324422 0.4910303
0.5538847 0.7180584 0.5960637
0.7000003 0.6999998 0.7000003
0.8360138 0.6778057 0.8032881
0.9664710 0.6508673 0.9061621
1.0000000 0.6183451 1.0000000
0.0000000 0.8692529 0.0000000
0.0000000 0.8685725 0.0000000
0.0000000 0.8661218 0.0000000
0.0000000 0.8615889 0.0000000
0.0000000 0.8547525 0.0000000
0.2784098 0.8454069 0.2510144
0.4923063 0.8333368 0.4335262
0.6548420 0.8182977 0.5740528
0.7999997 0.8000001 0.7000000
0.9364296 0.7780861 0.8185681
1.0000000 0.7521002 0.9327597
0.0000000 0.9779095 0.0000000
0.0000000 0.9773189 0.0000000
0.0000000 0.9751925 0.0000000
0.0000000 0.9712638 0.0000000
0.0000000 0.9653494 0.0000000
0.0000000 0.9572862 0.0000000
0.4064653 0.9469098 0.0000000
0.5971560 0.9340433 0.3627332
0.7555407 0.9184855 0.5503371
0.8999999 0.9000001 0.7000000
1.0000000 0.8783017 0.8338665
0.0000000 1.0000000 0.0000000
0.0000000 1.0000000 0.0000000
0.0000000 1.0000000 0.0000000
0.0000000 1.0000000 0.0000000
0.0000000 1.0000000 0.0000000
0.0000000 1.0000000 0.0000000
0.2682700 1.0000000 0.0000000
0.5217223 1.0000000 0.0000000
0.7005443 1.0000000 0.2664951
0.8560738 1.0000000 0.5247119
0.9999997 1.0000000 0.6999996
0.0000000 0.0002021 0.8000000
0.1165109 0.0000000 0.8038708
0.2330217 0.0000000 0.8176046
0.3495326 0.0000000 0.8421850
0.4660434 0.0000000 0.8774337
0.5825542 0.0000000 0.9225333
0.6990651 0.0000000 0.9763359
0.8155760 0.0000000 1.0000000
0.9320868 0.0000000 1.0000000
1.0000000 0.0000000 1.0000000
1.0000000 0.0000000 1.0000000
0.0000000 0.1086567 0.7961065
0.0999999 0.1000000 0.8000000
0.2263248 0.0560334 0.8138121
0.3454582 0.0000000 0.8385255
0.4631679 0.0000000 0.8739507
0.5803574 0.0000000 0.9192545
0.6973014 0.0000000 0.9732735
0.8141107 0.0000000 1.0000000
0.9308388 0.0000000 1.0000000
1.0000000 0.0000000 1.0000000
1.0000000 0.0000000 1.0000000
0.0000000 0.2173132 0.7819178
0.0000000 0.2136881 0.7858957
0.1999997 0.2000001 0.8000000
0.3303101 0.1713228 0.8252093
0.4526495 0.1120667 0.8612902
0.5723767 0.0000000 0.9073501
0.6909163 0.0000000 0.9621679
0.8088170 0.0000000 1.0000000
0.9263359 0.0000000 1.0000000
1.0000000 0.0000000 1.0000000
1.0000000 0.0000000 1.0000000
0.0000000 0.3259698 0.7549600
0.0000000 0.3237546 0.7591079
0.1354883 0.3156367 0.7737992
0.3000000 0.3000000 0.8000000
0.4324810 0.2745847 0.8373834
0.5573269 0.2349098 0.8849337
0.6789745 0.1680998 0.9413134
0.7989628 0.0000000 1.0000000
0.9179781 0.0000000 1.0000000
1.0000000 0.0000000 1.0000000
1.0000000 0.0000000 1.0000000
0.0000000 0.4346265 0.7123177
0.0000000 0.4330609 0.7167634
0.0000000 0.4273763 0.7324783
0.2461532 0.4166684 0.7603925
0.3999999 0.4000000 0.8000000
0.5338508 0.3760501 0.8500594
0.6606202 0.3426456 0.9090314
0.7839397 0.2955858 0.9753752
0.9052992 0.2241333 1.0000000
1.0000000 0.0426684 1.0000000
1.0000000 0.0000000 1.0000000
0.0000000 0.5432830 0.6492793
0.0000000 0.5420862 0.6542436
0.0000000 0.5377578 0.6717276
0.1341352 0.5296792 0.7025564
0.3502721 0.5173077 0.7458655
0.4999999 0.5000001 0.8000000
0.6347952 0.4768860 0.8630798
0.7630686 0.4466769 0.9333408
0.8878165 0.4072754 1.0000000
1.0000000 0.3547941 1.0000000
1.0000000 0.2801667 1.0000000
0.0000000 0.6519396 0.5565150
0.0000000 0.6509785 0.5624773
0.0000000 0.6475092 0.5833105
0.0000000 0.6410643 0.6194857
0.2709773 0.6312732 0.6693079
0.4524912 0.6177431 0.7302982
0.5999998 0.6000001 0.7999999
0.7354863 0.5774269 0.8763415
0.8649620 0.5491692 0.9577097
0.9909304 0.5139683 1.0000000
1.0000000 0.4698194 1.0000000
0.0000000 0.7605962 0.4085523
0.0000000 0.7597975 0.4171387
0.0000000 0.7569183 0.4463889
0.0000000 0.7515839 0.4949320
0.0823270 0.7435161 0.5583963
0.3847362 0.7324423 0.6324280
0.5538846 0.7180585 0.7137181
0.7000000 0.7000000 0.8000001
0.8360136 0.6778058 0.8897718
0.9664711 0.6508672 0.9820376
1.0000000 0.6183451 1.0000000
0.0000000 0.8692528 0.0000000
0.0000000 0.8685726 0.0000000
0.0000000 0.8661218 0.1128230
0.0000000 0.8615890 0.2596078
0.0000000 0.8547525 0.3758542
0.2784100 0.8454069 0.4850657
0.4923062 0.8333368 0.5913492
0.6548423 0.8182977 0.6961182
0.7999997 0.8000001 0.7999997
0.9364297 0.7780861 0.9033180
1.0000000 0.7521002 1.0000000
0.0000000 0.9779095 0.0000000
0.0000000 0.9773189 0.0000000
0.0000000 0.9751925 0.0000000
0.0000000 0.9712638 0.0000000
0.0000000 0.9653494 0.0000000
0.0000000 0.9572862 0.1530814
0.4064651 0.9469099 0.3918693
0.5971561 0.9340432 0.5451443
0.7555404 0.9184856 0.6774662
0.9000000 0.9000001 0.8000000
1.0000000 0.8783017 0.9169399
0.0000000 1.0000000 0.0000000
0.0000000 1.0000000 0.0000000
0.0000000 1.0000000 0.0000000
0.0000000 1.0000000 0.0000000
0.0000000 1.0000000 0.0000000
0.0000000 1.0000000 0.0000000
0.2682697 1.0000000 0.0000000
0.5217225 1.0000000 0.2538064
0.7005444 1.0000000 0.4922841
0.8560736 1.0000000 0.6577085
0.9999997 1.0000000 0.7999998
0.0002021 0.0000000 0.9000000
0.1165109 0.0000000 0.9033629
0.2330218 0.0000000 0.9153296
0.3495326 0.0000000 0.9368785
0.4660434 0.0000000 0.9680536
0.5825543 0.0000000 1.0000000
0.6990651 0.0000000 1.0000000
0.8155760 0.0000000 1.0000000
0.9320869 0.0000000 1.0000000
1.0000000 0.0000000 1.0000000
1.0000000 0.0000000 1.0000000
0.0000000 0.1086566 0.8966220
0.1000002 0.0999999 0.9000001
0.2263249 0.0560329 0.9120196
0.3454581 0.0000000 0.9336600
0.4631680 0.0000000 0.9649596
0.5803575 0.0000000 1.0000000
0.6973013 0.0000000 1.0000000
0.8141107 0.0000000 1.0000000
0.9308388 0.0000000 1.0000000
1.0000000 0.0000000 1.0000000
1.0000000 0.0000000 1.0000000
0.0000000 0.2173132 0.8843507
0.0000000 0.2136881 0.8877847
0.2000000 0.2000000 0.9000000
0.3303103 0.1713227 0.9219788
0.4526497 0.1120665 0.9537375
0.5723768 0.0000000 0.9947446
0.6909162 0.0000000 1.0000000
0.8088170 0.0000000 1.0000000
0.9263359 0.0000000 1.0000000
1.0000000 0.0000000 1.0000000
1.0000000 0.0000000 1.0000000
0.0000000 0.3259698 0.8612124
0.0000000 0.3237546 0.8647569
0.1354890 0.3156366 0.8773576
0.3000001 0.3000000 0.9000002
0.4324811 0.2745847 0.9326562
0.5573268 0.2349098 0.9747258
0.6789745 0.1680999 1.0000000
0.7989627 0.0000000 1.0000000
0.9179782 0.0000000 1.0000000
1.0000000 0.0000000 1.0000000
1.0000000 0.0000000 1.0000000
0.0000000 0.4346264 0.8251275
0.0000000 0.4330609 0.8288580
0.0000000 0.4273762 0.8421050
0.2461532 0.4166684 0.8658559
0.3999998 0.4000001 0.9000000
0.5338508 0.3760501 0.9438158
0.6606201 0.3426457 0.9962505
0.7839396 0.2955860 1.0000000
0.9052992 0.2241333 1.0000000
1.0000000 0.0426684 1.0000000
1.0000000 0.0000000 1.0000000
0.0000000 0.5432830 0.7731143
0.0000000 0.5420863 0.7771463
0.0000000 0.5377577 0.7914377
0.1341352 0.5296792 0.8169635
0.3502724 0.5173076 0.8534614
0.5000000 0.5000000 0.9000000
0.6347954 0.4768859 0.9553215
0.7630686 0.4466769 1.0000000
0.8878166 0.4072754 1.0000000
1.0000000 0.3547938 1.0000000
1.0000000 0.2801666 1.0000000
0.0000000 0.6519396 0.7001642
0.0000000 0.6509784 0.7047020
0.0000000 0.6475092 0.7207323
0.0000000 0.6410643 0.7491707
0.2709771 0.6312732 0.7894515
0.4524914 0.6177430 0.8402618
0.5999998 0.6000000 0.9000000
0.7354863 0.5774269 0.9670832
0.8649622 0.5491692 1.0000000
0.9909305 0.5139683 1.0000000
1.0000000 0.4698194 1.0000000
0.0000000 0.7605962 0.5962628
0.0000000 0.7597975 0.6017563
0.0000000 0.7569183 0.6210253
0.0000000 0.7515838 0.6547326
0.0823292 0.7435161 0.7015934
0.3847362 0.7324422 0.7595170
0.5538846 0.7180585 0.8263015
0.7000002 0.6999999 0.9000003
0.8360137 0.6778057 0.9790372
0.9664711 0.6508672 1.0000000
1.0000000 0.6183451 1.0000000
0.0000000 0.8692529 0.4338179
0.0000000 0.8685725 0.4418206
0.0000000 0.8661218 0.4692491
0.0000000 0.8615889 0.5152494
0.0000000 0.8547524 0.5760728
0.2784100 0.8454069 0.6477190
0.4923062 0.8333367 0.7269878
0.6548423 0.8182977 0.8115999
0.7999997 0.8000001 0.8999999
0.9364297 0.7780861 0.9911355
1.0000000 0.7521002 1.0000000
0.0000000 0.9779094 0.0000000
0.0000000 0.9773189 0.0000000
0.0000000 0.9751925 0.0562655
0.0000000 0.9712638 0.2442852
0.0000000 0.9653494 0.3662246
0.0000000 0.9572862 0.4780220
0.4064655 0.9469098 0.5858134
0.5971561 0.9340433 0.6915744
0.7555404 0.9184856 0.7961583
0.9000000 0.9000001 0.9000000
1.0000000 0.8783017 1.0000000
0.0000000 1.0000000 0.0000000
0.0000000 1.0000000 0.0000000
0.0000000 1.0000000 0.0000000
0.0000000 1.0000000 0.0000000
0.0000000 1.0000000 0.0000000
0.0000000 1.0000000 0.0000000
0.2682702 1.0000000 0.3415659
0.5217225 1.0000000 0.5127274
0.7005444 1.0000000 0.6528425
0.8560736 1.0000000 0.7799676
0.9999997 1.0000000 0.8999999
0.0000000 0.0002769 1.0000000
0.1165107 0.0000000 1.0000000
0.2330218 0.0000000 1.0000000
0.3495325 0.0000000 1.0000000
0.4660434 0.0000000 1.0000000
0.5825542 0.0000000 1.0000000
0.6990651 0.0000000 1.0000000
0.8155760 0.0000000 1.0000000
0.9320868 0.0000000 1.0000000
1.0000000 0.0000000 1.0000000
1.0000000 0.0000000 1.0000000
0.0000000 0.1086568 0.9970245
0.1000000 0.1000001 0.9999999
0.2263248 0.0560336 1.0000000
0.3454581 0.0000000 1.0000000
0.4631680 0.0000000 1.0000000
0.5803576 0.0000000 1.0000000
0.6973013 0.0000000 1.0000000
0.8141107 0.0000000 1.0000000
0.9308389 0.0000000 1.0000000
1.0000000 0.0000000 1.0000000
1.0000000 0.0000000 1.0000000
0.0000000 0.2173132 0.9862394
0.0000000 0.2136882 0.9892538
0.1999999 0.2000000 0.9999999
0.3303101 0.1713228 1.0000000
0.4526497 0.1120663 1.0000000
0.5723767 0.0000000 1.0000000
0.6909162 0.0000000 1.0000000
0.8088169 0.0000000 1.0000000
0.9263359 0.0000000 1.0000000
1.0000000 0.0000000 1.0000000
1.0000000 0.0000000 1.0000000
0.0000000 0.3259698 0.9660087
0.0000000 0.3237546 0.9690987
0.1354883 0.3156367 0.9801103
0.2999998 0.3000001 1.0000000
0.4324810 0.2745848 1.0000000
0.5573269 0.2349098 1.0000000
0.6789745 0.1680999 1.0000000
0.7989628 0.0000000 1.0000000
0.9179782 0.0000000 1.0000000
1.0000000 0.0000000 1.0000000
1.0000000 0.0000000 1.0000000
0.0000000 0.4346264 0.9347514
0.0000000 0.4330610 0.9379653
0.0000000 0.4273763 0.9494112
0.2461534 0.4166684 0.9700574
0.4000000 0.4000001 1.0000000
0.5338508 0.3760501 1.0000000
0.6606203 0.3426456 1.0000000
0.7839396 0.2955860 1.0000000
0.9052992 0.2241333 1.0000000
1.0000000 0.0426684 1.0000000
1.0000000 0.0000000 1.0000000
0.0000000 0.5432830 0.8903973
0.0000000 0.5420862 0.8938036
0.0000000 0.5377578 0.9059216
0.1341347 0.5296792 0.9277325
0.3502720 0.5173078 0.9592636
0.4999999 0.5000000 1.0000000
0.6347953 0.4768859 1.0000000
0.7630686 0.4466768 1.0000000
0.8878167 0.4072754 1.0000000
1.0000000 0.3547938 1.0000000
1.0000000 0.2801666 1.0000000
0.0000000 0.6519396 0.8298230
0.0000000 0.6509784 0.8335283
0.0000000 0.6475092 0.8466879
0.0000000 0.6410643 0.8702893
0.2709771 0.6312732 0.9042334
0.4524913 0.6177431 0.9478154
0.6000000 0.6000000 1.0000000
0.7354861 0.5774270 1.0000000
0.8649622 0.5491692 1.0000000
0.9909304 0.5139682 1.0000000
1.0000000 0.4698195 1.0000000
0.0000000 0.7605962 0.7477104
0.0000000 0.7597975 0.7519065
0.0000000 0.7569183 0.7667632
0.0000000 0.7515839 0.7932422
0.0823284 0.7435161 0.8309891
0.3847365 0.7324423 0.8789527
0.5538847 0.7180584 0.9357624
0.7000003 0.6999999 1.0000000
0.8360136 0.6778058 1.0000000
0.9664709 0.6508673 1.0000000
1.0000000 0.6183451 1.0000000
0.0000000 0.8692527 0.6333696
0.0000000 0.8685725 0.6384826
0.0000000 0.8661217 0.6564704
0.0000000 0.8615888 0.6881179
0.0000000 0.8547525 0.7324478
0.2784093 0.8454070 0.7876837
0.4923061 0.8333368 0.8518518
0.6548417 0.8182978 0.9231320
0.7999999 0.8000001 1.0000000
0.9364296 0.7780861 1.0000000
1.0000000 0.7521002 1.0000000
0.0000000 0.9779094 0.4570864
0.0000000 0.9773189 0.4646110
0.0000000 0.9751925 0.4905285
0.0000000 0.9712638 0.5343626
0.0000000 0.9653495 0.5928695
0.0000000 0.9572862 0.6623679
0.4064650 0.9469100 0.7397794
0.5971556 0.9340433 0.8228335
0.7555407 0.9184855 0.9099396
0.8999999 0.9000001 1.0000000
1.0000000 0.8783017 1.0000000
0.0000000 1.0000000 0.0000000
0.0000000 1.0000000 0.0000000
0.0000000 1.0000000 0.0000000
0.0000000 1.0000000 0.2252243
0.0000000 1.0000000 0.3548338
0.0000000 1.0000000 0.4698172
0.2682702 1.0000000 0.5794100
0.5217218 1.0000000 0.6863377
0.7005443 1.0000000 0.7917418
0.8560736 1.0000000 0.8961900
0.9999999 1.0000000 1.0000000


================================================
FILE: looks/cb_deut_pq.cube
================================================
LUT_3D_SIZE 17
0.0000007 0.0000007 0.0000007
0.0718908 0.0000007 0.0634295
0.1407264 0.0000007 0.1265746
0.2081351 0.0000007 0.1895831
0.2745637 0.0000007 0.2524948
0.3402386 0.0000007 0.3153278
0.4053014 0.0000007 0.3781040
0.4698416 0.0000007 0.4408211
0.5339330 0.0000007 0.5034938
0.5976252 0.0000007 0.5661316
0.6609555 0.0000007 0.6287217
0.7239629 0.0000007 0.6912861
0.7866691 0.0000007 0.7538142
0.8491035 0.0000007 0.8163127
0.9112872 0.0000007 0.8787901
0.9732211 0.0000007 0.9412358
1.0000000 0.0000007 1.0000000
0.0000007 0.0674726 0.0000007
0.0625000 0.0625000 0.0000007
0.1383231 0.0086580 0.1183795
0.2072072 0.0000007 0.1864783
0.2741456 0.0000007 0.2510872
0.3400312 0.0000007 0.3146308
0.4051973 0.0000007 0.3777408
0.4697859 0.0000007 0.4406244
0.5339002 0.0000007 0.5033864
0.5976082 0.0000007 0.5660673
0.6609462 0.0000007 0.6286890
0.7239595 0.0000007 0.6912665
0.7866691 0.0000007 0.7538035
0.8491035 0.0000007 0.8163050
0.9112872 0.0000007 0.8787901
0.9732211 0.0000007 0.9412358
1.0000000 0.0000007 1.0000000
0.0000007 0.1333780 0.0000007
0.0000007 0.1320369 0.0000007
0.1249998 0.1249998 0.0000007
0.2024936 0.0990892 0.1690202
0.2720606 0.0000007 0.2438339
0.3390138 0.0000007 0.3111361
0.4046661 0.0000007 0.3759317
0.4695007 0.0000007 0.4396504
0.5337459 0.0000007 0.5028498
0.5975178 0.0000007 0.5657645
0.6608993 0.0000007 0.6285197
0.7239321 0.0000007 0.6911718
0.7866505 0.0000007 0.7537502
0.8490914 0.0000007 0.8162780
0.9112787 0.0000007 0.8787694
0.9732211 0.0000007 0.9412181
1.0000000 0.0000007 1.0000000
0.0000007 0.1985382 0.0000007
0.0000007 0.1980122 0.0000007
0.0423759 0.1953852 0.0000007
0.1875007 0.1875007 0.0000007
0.2659411 0.1653642 0.2193468
0.3360979 0.0298742 0.3005804
0.4031779 0.0000007 0.3706860
0.4687038 0.0000007 0.4368740
0.5333037 0.0000007 0.5013312
0.5972747 0.0000007 0.5649163
0.6607589 0.0000007 0.6280414
0.7238570 0.0000007 0.6908978
0.7866098 0.0000007 0.7535938
0.8490714 0.0000007 0.8161896
0.9112701 0.0000007 0.8787239
0.9732119 0.0000007 0.9411959
1.0000000 0.0000007 1.0000000
0.0000007 0.2631797 0.0000007
0.0000007 0.2629395 0.0000007
0.0000007 0.2617582 0.0000007
0.1329523 0.2583594 0.0000007
0.2500004 0.2500015 0.0002356
0.3290423 0.2295101 0.2703825
0.3996531 0.1622194 0.3574611
0.4668416 0.0000007 0.4302047
0.5322941 0.0000007 0.4977550
0.5967128 0.0000007 0.5629462
0.6604437 0.0000007 0.6269320
0.7236726 0.0000007 0.6902750
0.7865059 0.0000007 0.7532420
0.8490115 0.0000007 0.8159897
0.9112358 0.0000007 0.8786081
0.9731982 0.0000007 0.9411340
1.0000000 0.0000007 1.0000000
0.0000007 0.3274168 0.0000007
0.0000007 0.3272982 0.0000007
0.0000007 0.3267153 0.0000007
0.0000007 0.3250640 0.0000007
0.2023286 0.3211561 0.0000007
0.3124984 0.3124999 0.0000007
0.3919464 0.2929149 0.3225371
0.4628842 0.2383338 0.4148256
0.5301600 0.0000007 0.4899386
0.5955341 0.0000007 0.5587326
0.6597794 0.0000007 0.6245980
0.7233039 0.0000007 0.6889660
0.7863020 0.0000007 0.7525070
0.8488916 0.0000007 0.8155784
0.9111715 0.0000007 0.8783807
0.9731570 0.0000007 0.9410056
1.0000000 0.0000007 1.0000000
0.0000007 0.3913299 0.0000007
0.0000007 0.3912704 0.0000007
0.0000007 0.3909635 0.0000007
0.0000007 0.3901110 0.0000007
0.0000007 0.3881105 0.0000007
0.2681066 0.3838566 0.0000007
0.3749991 0.3749991 0.0000007
0.4547165 0.3559716 0.3759889
0.5258798 0.3073042 0.4728517
0.5932060 0.0000007 0.5500392
0.6584871 0.0000007 0.6199145
0.7225738 0.0000007 0.6863748
0.7858908 0.0000007 0.7510532
0.8486637 0.0000007 0.8147680
0.9110472 0.0000007 0.8779260
0.9730930 0.0000007 0.9407578
1.0000000 0.0000007 1.0000000
0.0000007 0.4549583 0.0000007
0.0000007 0.4549238 0.0000007
0.0000007 0.4547619 0.0000007
0.0000007 0.4543001 0.0000007
0.0000007 0.4532361 0.0000007
0.0000007 0.4509955 0.0000007
0.3324882 0.4464898 0.0000007
0.4375011 0.4375011 0.0000007
0.5173995 0.4188227 0.4308223
0.5887104 0.3734108 0.5316439
0.6560246 0.0000007 0.6105733
0.7212078 0.0000007 0.6813533
0.7851205 0.0000007 0.7482952
0.8482362 0.0000007 0.8132339
0.9108029 0.0000007 0.8770916
0.9729558 0.0000007 0.9402889
1.0000000 0.0000007 1.0000000
0.0000007 0.5183418 0.0000007
0.0000007 0.5183222 0.0000007
0.0000007 0.5182313 0.0000007
0.0000007 0.5179784 0.0000007
0.0000007 0.5173970 0.0000007
0.0000007 0.5161725 0.0000007
0.0000007 0.5137491 0.0000007
0.3961343 0.5090759 0.0000007
0.4999972 0.4999972 0.0001165
0.5800230 0.4815372 0.4870752
0.6513917 0.4379958 0.5912168
0.7186598 0.0000007 0.6715837
0.7837080 0.0000007 0.7430789
0.8474496 0.0000007 0.8103841
0.9103745 0.0000007 0.8755158
0.9727225 0.0000007 0.9394403
1.0000000 0.0000007 1.0000000
0.0000007 0.5815125 0.0000007
0.0000007 0.5815042 0.0000007
0.0000007 0.5814547 0.0000007
0.0000007 0.5813144 0.0000007
0.0000007 0.5809817 0.0000007
0.0000007 0.5803058 0.0000007
0.0000007 0.5789700 0.0000007
0.0000007 0.5764248 0.0000007
0.4593347 0.5716353 0.0000007
0.5625013 0.5625013 0.0001694
0.6425776 0.5441685 0.5447254
0.7139608 0.5016212 0.6515948
0.7811298 0.2779564 0.7330754
0.8460300 0.0000007 0.8050972
0.9095824 0.0000007 0.8726643
0.9722882 0.0000007 0.9378906
1.0000000 0.0000007 1.0000000
0.0000007 0.6444844 0.0000007
0.0000007 0.6444844 0.0000007
0.0000007 0.6444509 0.0000007
0.0000007 0.6443717 0.0000007
0.0000007 0.6441891 0.0000007
0.0000007 0.6438056 0.0000007
0.0000007 0.6430575 0.0000007
0.0000007 0.6416460 0.0000007
0.2563538 0.6390222 0.0000007
0.5222496 0.6341599 0.0000007
0.6249967 0.6249967 0.0002490
0.7050963 0.6067191 0.6037708
0.7764121 0.5645393 0.7127622
0.8434600 0.3629519 0.7950413
0.9081797 0.0000007 0.8674174
0.9715251 0.0000007 0.9351025
1.0000000 0.0000007 1.0000000
0.0000007 0.7072830 0.0000007
0.0000007 0.7072830 0.0000007
0.0000007 0.7072696 0.0000007
0.0000007 0.7072229 0.0000007
0.0000007 0.7071161 0.0000007
0.0000007 0.7069025 0.0000007
0.0000007 0.7064822 0.0000007
0.0000007 0.7056890 0.0000007
0.0000007 0.7042248 0.0000007
0.3456196 0.7015604 0.0000007
0.5849317 0.6966758 0.0000007
0.6875004 0.6875004 0.0003694
0.7675710 0.6692214 0.6641575
0.8387775 0.6268995 0.7746935
0.9056577 0.4260822 0.8574770
0.9701605 0.0000007 0.9299880
1.0000000 0.0000007 0.9977046
0.0000007 0.7699198 0.0000007
0.0000007 0.7699162 0.0000007
0.0000007 0.7699089 0.0000007
0.0000007 0.7698835 0.0000007
0.0000007 0.7698254 0.0000007
0.0000007 0.7697020 0.0000007
0.0000007 0.7694662 0.0000007
0.0000007 0.7690164 0.0000007
0.0000007 0.7681937 0.0000007
0.0000007 0.7667137 0.0000007
0.4180929 0.7640429 0.0000007
0.6474362 0.7591621 0.0000007
0.7499983 0.7499983 0.0000007
0.8300054 0.7316552 0.7258408
0.9010627 0.6887156 0.8373486
0.9677143 0.4733949 0.9203179
1.0000000 0.0000007 0.9928166
0.0000007 0.8323977 0.0000007
0.0000007 0.8323977 0.0000007
0.0000007 0.8323938 0.0000007
0.0000007 0.8323820 0.0000007
0.0000007 0.8323467 0.0000007
0.0000007 0.8322762 0.0000007
0.0000007 0.8321429 0.0000007
0.0000007 0.8318921 0.0000007
0.0000007 0.8314337 0.0000007
0.0000007 0.8306077 0.0000007
0.0000007 0.8291301 0.0000007
0.4824975 0.8264745 0.0000007
0.7097745 0.8216335 0.0000007
0.8124946 0.8124985 0.0000007
0.8924159 0.7940340 0.7887856
0.9632522 0.7500196 0.9006684
1.0000000 0.4970498 0.9835553
0.0000007 0.8947541 0.0000007
0.0000007 0.8947456 0.0000007
0.0000007 0.8947499 0.0000007
0.0000007 0.8947330 0.0000007
0.0000007 0.8947162 0.0000007
0.0000007 0.8946783 0.0000007
0.0000007 0.8946067 0.0000007
0.0000007 0.8944594 0.0000007
0.0000007 0.8942111 0.0000007
0.0000007 0.8937567 0.0000007
0.0000007 0.8929327 0.0000007
0.0000007 0.8914798 0.0000007
0.5407208 0.8888614 0.0000007
0.7719408 0.8840924 0.0000007
0.8750090 0.8750008 0.0000007
0.9547794 0.8563795 0.8528664
1.0000000 0.8107393 0.9646164
0.0000007 0.9569592 0.0000007
0.0000007 0.9569592 0.0000007
0.0000007 0.9569502 0.0000007
0.0000007 0.9569502 0.0000007
0.0000007 0.9569412 0.0000007
0.0000007 0.9569188 0.0000007
0.0000007 0.9568782 0.0000007
0.0000007 0.9568018 0.0000007
0.0000007 0.9566623 0.0000007
0.0000007 0.9564105 0.0000007
0.0000007 0.9559563 0.0000007
0.0000007 0.9551700 0.0000007
0.0000007 0.9537563 0.0000007
0.5926394 0.9512122 0.0000007
0.8339714 0.9465226 0.0000007
0.9374982 0.9374982 0.0000007
1.0000000 0.9186482 0.9180693
0.0000007 1.0000000 0.0000007
0.0000007 1.0000000 0.0000007
0.0000007 1.0000000 0.0000007
0.0000007 1.0000000 0.0000007
0.0000007 1.0000000 0.0000007
0.0000007 1.0000000 0.0000007
0.0000007 1.0000000 0.0000007
0.0000007 1.0000000 0.0000007
0.0000007 1.0000000 0.0000007
0.0000007 1.0000000 0.0000007
0.0000007 1.0000000 0.0000007
0.0000007 1.0000000 0.0000007
0.0000007 1.0000000 0.0000007
0.0000007 1.0000000 0.0000007
0.6355943 1.0000000 0.0000007
0.8958032 1.0000000 0.0000007
1.0000000 1.0000000 0.0028123
0.0000007 0.0000109 0.0625000
0.0718908 0.0000007 0.0836242
0.1407264 0.0000007 0.1335601
0.2081351 0.0000007 0.1924635
0.2745637 0.0000007 0.2538314
0.3402386 0.0000007 0.3159977
0.4053014 0.0000007 0.3784568
0.4698416 0.0000007 0.4410137
0.5339330 0.0000007 0.5036012
0.5976252 0.0000007 0.5661905
0.6609555 0.0000007 0.6287574
0.7239629 0.0000007 0.6913056
0.7866691 0.0000007 0.7538248
0.8491035 0.0000007 0.8163204
0.9112872 0.0000007 0.8787984
0.9732211 0.0000007 0.9412358
1.0000000 0.0000007 1.0000000
0.0000007 0.0674726 0.0000007
0.0625000 0.0625000 0.0625000
0.1383231 0.0086580 0.1263099
0.2072072 0.0000007 0.1894785
0.2741456 0.0000007 0.2524453
0.3400312 0.0000007 0.3153037
0.4051973 0.0000007 0.3780896
0.4697859 0.0000007 0.4408127
0.5339002 0.0000007 0.5034890
0.5976082 0.0000007 0.5661262
0.6609462 0.0000007 0.6287217
0.7239595 0.0000007 0.6912861
0.7866691 0.0000007 0.7538142
0.8490995 0.0000007 0.8163088
0.9112872 0.0000007 0.8787901
0.9732211 0.0000007 0.9412358
1.0000000 0.0000007 1.0000000
0.0000007 0.1333780 0.0000007
0.0000007 0.1320369 0.0000007
0.1249998 0.1249998 0.0625000
0.2024936 0.0990892 0.1728076
0.2720606 0.0000007 0.2453140
0.3390138 0.0000007 0.3118359
0.4046661 0.0000007 0.3762914
0.4695007 0.0000007 0.4398446
0.5337459 0.0000007 0.5029547
0.5975178 0.0000007 0.5658235
0.6608993 0.0000007 0.6285523
0.7239321 0.0000007 0.6911914
0.7866505 0.0000007 0.7537609
0.8490914 0.0000007 0.8162819
0.9112787 0.0000007 0.8787777
0.9732211 0.0000007 0.9412181
1.0000000 0.0000007 1.0000000
0.0000007 0.1985382 0.0000007
0.0000007 0.1980122 0.0000007
0.0423759 0.1953861 0.0000007
0.1875007 0.1875007 0.0624997
0.2659411 0.1653642 0.2213280
0.3360979 0.0298743 0.3013631
0.4031779 0.0000007 0.3710690
0.4687038 0.0000007 0.4370733
0.5333037 0.0000007 0.5014381
0.5972747 0.0000007 0.5649831
0.6607589 0.0000007 0.6280771
0.7238570 0.0000007 0.6909173
0.7866098 0.0000007 0.7536080
0.8490714 0.0000007 0.8161935
0.9112701 0.0000007 0.8787322
0.9732119 0.0000007 0.9412004
1.0000000 0.0000007 1.0000000
0.0000007 0.2631797 0.0000007
0.0000007 0.2629395 0.0000007
0.0000007 0.2617582 0.0000007
0.1329530 0.2583594 0.0000007
0.2500004 0.2500015 0.0625015
0.3290423 0.2295101 0.2714737
0.3996531 0.1622194 0.3578936
0.4668416 0.0000007 0.4304112
0.5322915 0.0000007 0.4978659
0.5967128 0.0000007 0.5630075
0.6604437 0.0000007 0.6269706
0.7236726 0.0000007 0.6902945
0.7865059 0.0000007 0.7532526
0.8490115 0.0000007 0.8159974
0.9112358 0.0000007 0.8786164
0.9731982 0.0000007 0.9411340
1.0000000 0.0000007 1.0000000
0.0000007 0.3274168 0.0000007
0.0000007 0.3272982 0.0000007
0.0000007 0.3267153 0.0000007
0.0000007 0.3250640 0.0000007
0.2023286 0.3211561 0.0000007
0.3124999 0.3124999 0.0624982
0.3919464 0.2929149 0.3231574
0.4628842 0.2383338 0.4150701
0.5301600 0.0000007 0.4900571
0.5955341 0.0000007 0.5587988
0.6597794 0.0000007 0.6246364
0.7233039 0.0000007 0.6889855
0.7863020 0.0000007 0.7525176
0.8488916 0.0000007 0.8155822
0.9111715 0.0000007 0.8783807
0.9731570 0.0000007 0.9410145
1.0000000 0.0000007 1.0000000
0.0000007 0.3913299 0.0000007
0.0000007 0.3912704 0.0000007
0.0000007 0.3909635 0.0000007
0.0000007 0.3901073 0.0000007
0.0000007 0.3881105 0.0000007
0.2681066 0.3838566 0.0000007
0.3749991 0.3750027 0.0625037
0.4547165 0.3559716 0.3763451
0.5258848 0.3073042 0.4729908
0.5932060 0.0000007 0.5501096
0.6584871 0.0000007 0.6199496
0.7225738 0.0000007 0.6863943
0.7858908 0.0000007 0.7510674
0.8486637 0.0000007 0.8147718
0.9110472 0.0000007 0.8779260
0.9730839 0.0000007 0.9407578
1.0000000 0.0000007 1.0000000
0.0000007 0.4549583 0.0000007
0.0000007 0.4549238 0.0000007
0.0000007 0.4547619 0.0000007
0.0000007 0.4543001 0.0000007
0.0000007 0.4532361 0.0000007
0.0000007 0.4509955 0.0000007
0.3324882 0.4464898 0.0000007
0.4375011 0.4375011 0.0624854
0.5174019 0.4188147 0.4310331
0.5887104 0.3734108 0.5317220
0.6560246 0.0000007 0.6106137
0.7212078 0.0000007 0.6813758
0.7851205 0.0000007 0.7483022
0.8482362 0.0000007 0.8132415
0.9108029 0.0000007 0.8770916
0.9729558 0.0000007 0.9402978
1.0000000 0.0000007 1.0000000
0.0000007 0.5183418 0.0000007
0.0000007 0.5183222 0.0000007
0.0000007 0.5182313 0.0000007
0.0000007 0.5179784 0.0000007
0.0000007 0.5173970 0.0000007
0.0000007 0.5161725 0.0000007
0.0000007 0.5137540 0.0000007
0.3961343 0.5090759 0.0000007
0.4999972 0.4999972 0.0625146
0.5800230 0.4815372 0.4871954
0.6513917 0.4379937 0.5912644
0.7186598 0.0000007 0.6716059
0.7837080 0.0000007 0.7430929
0.8474496 0.0000007 0.8103917
0.9103745 0.0000007 0.8755240
0.9727225 0.0000007 0.9394403
1.0000000 0.0000007 1.0000000
0.0000007 0.5815125 0.0000007
0.0000007 0.5815042 0.0000007
0.0000007 0.5814520 0.0000007
0.0000007 0.5813144 0.0000007
0.0000007 0.5809872 0.0000007
0.0000007 0.5803058 0.0000007
0.0000007 0.5789700 0.0000007
0.0000007 0.5764275 0.0000007
0.4593347 0.5716353 0.0000007
0.5625013 0.5625013 0.0625006
0.6425776 0.5441685 0.5447950
0.7139608 0.5016212 0.6516225
0.7811298 0.2779564 0.7330927
0.8460300 0.0000007 0.8051010
0.9095824 0.0000007 0.8726725
0.9722973 0.0000007 0.9378995
1.0000000 0.0000007 1.0000000
0.0000007 0.6444844 0.0000007
0.0000007 0.6444844 0.0000007
0.0000007 0.6444509 0.0000007
0.0000007 0.6443717 0.0000007
0.0000007 0.6441891 0.0000007
0.0000007 0.6438056 0.0000007
0.0000007 0.6430575 0.0000007
0.0000007 0.6416460 0.0000007
0.2563550 0.6390222 0.0000007
0.5222496 0.6341599 0.0000007
0.6250026 0.6249967 0.0625009
0.7050996 0.6067191 0.6038136
0.7764121 0.5645393 0.7127824
0.8434600 0.3629519 0.7950526
0.9081882 0.0000007 0.8674092
0.9715251 0.0000007 0.9351113
1.0000000 0.0000007 1.0000000
0.0000007 0.7072830 0.0000007
0.0000007 0.7072830 0.0000007
0.0000007 0.7072696 0.0000007
0.0000007 0.7072229 0.0000007
0.0000007 0.7071161 0.0000007
0.0000007 0.7069025 0.0000007
0.0000007 0.7064822 0.0000007
0.0000007 0.7056823 0.0000007
0.0000007 0.7042248 0.0000007
0.3456180 0.7015604 0.0000007
0.5849317 0.6966758 0.0000007
0.6875004 0.6875004 0.0625591
0.7675710 0.6692214 0.6641794
0.8387775 0.6268995 0.7747045
0.9056577 0.4260822 0.8574770
0.9701605 0.0000007 0.9299968
1.0000000 0.0000007 0.9977046
0.0000007 0.7699198 0.0000007
0.0000007 0.7699198 0.0000007
0.0000007 0.7699089 0.0000007
0.0000007 0.7698835 0.0000007
0.0000007 0.7698254 0.0000007
0.0000007 0.7697020 0.0000007
0.0000007 0.7694662 0.0000007
0.0000007 0.7690164 0.0000007
0.0000007 0.7681937 0.0000007
0.0000007 0.7667137 0.0000007
0.4180929 0.7640429 0.0000007
0.6474362 0.7591621 0.0000007
0.7499983 0.7499983 0.0624991
0.8300093 0.7316552 0.7258545
0.9010627 0.6887156 0.8373565
0.9677143 0.4733994 0.9203179
1.0000000 0.0000007 0.9928260
0.0000007 0.8323977 0.0000007
0.0000007 0.8323977 0.0000007
0.0000007 0.8323938 0.0000007
0.0000007 0.8323820 0.0000007
0.0000007 0.8323428 0.0000007
0.0000007 0.8322762 0.0000007
0.0000007 0.8321429 0.0000007
0.0000007 0.8318921 0.0000007
0.0000007 0.8314337 0.0000007
0.0000007 0.8306077 0.0000007
0.0000007 0.8291301 0.0000007
0.4824929 0.8264745 0.0000007
0.7097778 0.8216335 0.0000007
0.8124946 0.8124985 0.0624991
0.8924159 0.7940340 0.7887893
0.9632522 0.7500125 0.9006768
1.0000000 0.4970498 0.9835553
0.0000007 0.8947541 0.0000007
0.0000007 0.8947541 0.0000007
0.0000007 0.8947499 0.0000007
0.0000007 0.8947330 0.0000007
0.0000007 0.8947162 0.0000007
0.0000007 0.8946783 0.0000007
0.0000007 0.8946067 0.0000007
0.0000007 0.8944678 0.0000007
0.0000007 0.8942111 0.0000007
0.0000007 0.8937567 0.0000007
0.0000007 0.8929327 0.0000007
0.0000007 0.8914798 0.0000007
0.5407208 0.8888614 0.0000007
0.7719408 0.8840924 0.0000007
0.8750090 0.8750008 0.0624991
0.9547794 0.8563795 0.8528664
1.0000000 0.8107393 0.9646164
0.0000007 0.9569592 0.0000007
0.0000007 0.9569592 0.0000007
0.0000007 0.9569502 0.0000007
0.0000007 0.9569502 0.0000007
0.0000007 0.9569412 0.0000007
0.0000007 0.9569188 0.0000007
0.0000007 0.9568782 0.0000007
0.0000007 0.9568018 0.0000007
0.0000007 0.9566623 0.0000007
0.0000007 0.9564105 0.0000007
0.0000007 0.9559563 0.0000007
0.0000007 0.9551700 0.0000007
0.0000007 0.9537563 0.0000007
0.5926338 0.9512122 0.0000007
0.8339714 0.9465226 0.0000007
0.9374982 0.9374982 0.0634094
1.0000000 0.9186482 0.9180693
0.0000007 1.0000000 0.0000007
0.0000007 1.0000000 0.0000007
0.0000007 1.0000000 0.0000007
0.0000007 1.0000000 0.0000007
0.0000007 1.0000000 0.0000007
0.0000007 1.0000000 0.0000007
0.0000007 1.0000000 0.0000007
0.0000007 1.0000000 0.0000007
0.0000007 1.0000000 0.0000007
0.0000007 1.0000000 0.0000007
0.0000007 1.0000000 0.0000007
0.0000007 1.0000000 0.0000007
0.0000007 1.0000000 0.0000007
0.0000007 1.0000000 0.0000007
0.6355943 1.0000000 0.0000007
0.8957947 1.0000000 0.0000007
1.0000000 1.0000000 0.0643072
0.0000007 0.0000129 0.1249998
0.0718908 0.0000007 0.1323965
0.1407264 0.0000007 0.1598364
0.2081351 0.0000007 0.2052032
0.2745637 0.0000007 0.2601018
0.3402386 0.0000007 0.3192067
0.4053014 0.0000007 0.3801585
0.4698416 0.0000007 0.4419403
0.5339330 0.0000007 0.5041147
0.5976252 0.0000007 0.5664774
0.6609555 0.0000007 0.6289238
0.7239629 0.0000007 0.6913970
0.7866691 0.0000007 0.7538782
0.8491035 0.0000007 0.8163473
0.9112872 0.0000007 0.8788149
0.9732211 0.0000007 0.9412446
1.0000000 0.0000007 1.0000000
0.0000007 0.0674726 0.1165700
0.0625000 0.0625000 0.1249998
0.1383231 0.0086581 0.1550832
0.2072072 0.0000007 0.2026811
0.2741456 0.0000007 0.2588143
0.3400312 0.0000007 0.3185377
0.4051973 0.0000007 0.3797970
0.4697859 0.0000007 0.4417410
0.5339002 0.0000007 0.5040072
0.5976082 0.0000007 0.5664184
0.6609462 0.0000007 0.6288852
0.7239595 0.0000007 0.6913775
0.7866691 0.0000007 0.7538639
0.8491035 0.0000007 0.8163396
0.9112872 0.0000007 0.8788149
0.9732211 0.0000007 0.9412446
1.0000000 0.0000007 1.0000000
0.0000007 0.1333780 0.0000007
0.0000007 0.1320369 0.0575970
0.1249998 0.1249998 0.1249998
0.2024926 0.0990883 0.1889617
0.2720606 0.0000007 0.2522088
0.3390138 0.0000007 0.3151880
0.4046661 0.0000007 0.3780267
0.4695007 0.0000007 0.4407814
0.5337459 0.0000007 0.5034723
0.5975178 0.0000007 0.5661182
0.6608931 0.0000007 0.6287158
0.7239321 0.0000007 0.6912795
0.7866505 0.0000007 0.7538142
0.8490914 0.0000007 0.8163127
0.9112872 0.0000007 0.8787984
0.9732211 0.0000007 0.9412269
1.0000000 0.0000007 1.0000000
0.0000007 0.1985382 0.0000007
0.0000007 0.1980122 0.0000007
0.0423759 0.1953852 0.0000007
0.1875007 0.1875007 0.1249986
0.2659411 0.1653642 0.2303964
0.3360979 0.0298742 0.3051043
0.4031779 0.0000007 0.3728958
0.4687038 0.0000007 0.4380353
0.5333037 0.0000007 0.5019614
0.5972747 0.0000007 0.5652720
0.6607589 0.0000007 0.6282374
0.7238570 0.0000007 0.6910152
0.7866098 0.0000007 0.7536578
0.8490714 0.0000007 0.8162242
0.9112701 0.0000007 0.8787404
0.9732119 0.0000007 0.9412092
1.0000000 0.0000007 1.0000000
0.0000007 0.2631797 0.0000007
0.0000007 0.2629395 0.0000007
0.0000007 0.2617582 0.0000007
0.1329517 0.2583594 0.0000007
0.2500004 0.2500015 0.1250004
0.3290423 0.2295101 0.2766345
0.3996531 0.1622194 0.3599836
0.4668416 0.0000007 0.4314448
0.5322941 0.0000007 0.4984067
0.5967128 0.0000007 0.5633034
0.6604437 0.0000007 0.6271336
0.7236726 0.0000007 0.6903858
0.7865059 0.0000007 0.7533024
0.8490115 0.0000007 0.8160242
0.9112444 0.0000007 0.8786371
0.9731982 0.0000007 0.9411428
1.0000000 0.0000007 1.0000000
0.0000007 0.3274168 0.0000007
0.0000007 0.3272982 0.0000007
0.0000007 0.3267153 0.0000007
0.0000007 0.3250640 0.0000007
0.2023296 0.3211561 0.0000007
0.3124999 0.3124999 0.1249992
0.3919464 0.2929149 0.3261364
0.4628842 0.2383350 0.4162632
0.5301600 0.0000007 0.4906431
0.5955341 0.0000007 0.5591058
0.6597794 0.0000007 0.6248077
0.7233039 0.0000007 0.6890831
0.7863020 0.0000007 0.7525709
0.8488916 0.0000007 0.8156091
0.9111629 0.0000007 0.8784013
0.9731570 0.0000007 0.9410145
1.0000000 0.0000007 1.0000000
0.0000007 0.3913299 0.0000007
0.0000007 0.3912704 0.0000007
0.0000007 0.3909635 0.0000007
0.0000007 0.3901110 0.0000007
0.0000007 0.3881105 0.0000007
0.2681066 0.3838566 0.0000007
0.3749991 0.3750027 0.1250016
0.4547165 0.3559716 0.3780860
0.5258848 0.3073057 0.4736802
0.5932060 0.0000007 0.5504457
0.6584871 0.0000007 0.6201285
0.7225738 0.0000007 0.6864883
0.7858908 0.0000007 0.7511240
0.8486637 0.0000007 0.8148025
0.9110472 0.0000007 0.8779466
0.9730930 0.0000007 0.9407666
1.0000000 0.0000007 1.0000000
0.0000007 0.4549583 0.0000007
0.0000007 0.4549238 0.0000007
0.0000007 0.4547619 0.0000007
0.0000007 0.4543001 0.0000007
0.0000007 0.4532361 0.0000007
0.0000007 0.4509955 0.0000007
0.3324882 0.4464898 0.0000007
0.4375011 0.4374969 0.1249974
0.5173995 0.4188227 0.4320498
0.5887104 0.3734108 0.5321201
0.6560246 0.0000007 0.6108072
0.7212078 0.0000007 0.6814788
0.7851205 0.0000007 0.7483658
0.8482362 0.0000007 0.8132721
0.9108029 0.0000007 0.8770998
0.9729558 0.0000007 0.9403066
1.0000000 0.0000007 1.0000000
0.0000007 0.5183418 0.0000007
0.0000007 0.5183247 0.0000007
0.0000007 0.5182313 0.0000007
0.0000007 0.5179784 0.0000007
0.0000007 0.5173970 0.0000007
0.0000007 0.5161725 0.0000007
0.0000007 0.5137491 0.0000007
0.3961343 0.5090759 0.0000007
0.4999972 0.4999972 0.1250010
0.5800202 0.4815372 0.4877988
0.6513917 0.4379937 0.5914966
0.7186598 0.0000007 0.6717201
0.7837080 0.0000007 0.7431490
0.8474496 0.0000007 0.8104261
0.9103745 0.0000007 0.8755364
0.9727225 0.0000007 0.9394491
1.0000000 0.0000007 1.0000000
0.0000007 0.5815125 0.0000007
0.0000007 0.5815042 0.0000007
0.0000007 0.5814520 0.0000007
0.0000007 0.5813144 0.0000007
0.0000007 0.5809872 0.0000007
0.0000007 0.5803058 0.0000007
0.0000007 0.5789700 0.0000007
0.0000007 0.5764275 0.0000007
0.4593347 0.5716353 0.0000007
0.5625013 0.5625013 0.1249998
0.6425776 0.5441685 0.5451512
0.7139608 0.5016212 0.6517580
0.7811298 0.2779564 0.7331550
0.8460300 0.0000007 0.8051390
0.9095824 0.0000007 0.8726807
0.9722973 0.0000007 0.9379083
1.0000000 0.0000007 1.0000000
0.0000007 0.6444844 0.0000007
0.0000007 0.6444844 0.0000007
0.0000007 0.6444509 0.0000007
0.0000007 0.6443717 0.0000007
0.0000007 0.6441891 0.0000007
0.0000007 0.6438056 0.0000007
0.0000007 0.6430575 0.0000007
0.0000007 0.6416460 0.0000007
0.2563550 0.6390222 0.0000007
0.5222496 0.6341659 0.0000007
0.6249967 0.6249967 0.1250004
0.7050996 0.6067191 0.6040193
0.7764121 0.5645393 0.7128598
0.8434600 0.3629519 0.7950901
0.9081797 0.0000007 0.8674296
0.9715251 0.0000007 0.9351113
1.0000000 0.0000007 1.0000000
0.0000007 0.7072830 0.0000007
0.0000007 0.7072830 0.0000007
0.0000007 0.7072696 0.0000007
0.0000007 0.7072229 0.0000007
0.0000007 0.7071161 0.0000007
0.0000007 0.7069025 0.0000007
0.0000007 0.7064822 0.0000007
0.0000007 0.7056890 0.0000007
0.0000007 0.7042248 0.0000007
0.3456180 0.7015604 0.0000007
0.5849317 0.6966758 0.0000007
0.6875004 0.6875004 0.1249835
0.7675710 0.6692151 0.6643018
0.8387775 0.6268995 0.7747447
0.9056577 0.4260822 0.8575053
0.9701696 0.0000007 0.9299968
1.0000000 0.0000007 0.9977093
0.0000007 0.7699198 0.0000007
0.0000007 0.7699198 0.0000007
0.0000007 0.7699089 0.0000007
0.0000007 0.7698835 0.0000007
0.0000007 0.7698254 0.0000007
0.0000007 0.7697020 0.0000007
0.0000007 0.7694662 0.0000007
0.0000007 0.7690127 0.0000007
0.0000007 0.7681937 0.0000007
0.0000007 0.7667137 0.0000007
0.4180890 0.7640429 0.0000007
0.6474392 0.7591621 0.0000007
0.7499983 0.7499983 0.1249998
0.8300093 0.7316552 0.7259230
0.9010627 0.6887156 0.8373841
0.9677143 0.4733994 0.9203353
1.0000000 0.0000007 0.9928260
0.0000007 0.8323977 0.0000007
0.0000007 0.8323977 0.0000007
0.0000007 0.8323938 0.0000007
0.0000007 0.8323820 0.0000007
0.0000007 0.8323467 0.0000007
0.0000007 0.8322762 0.0000007
0.0000007 0.8321429 0.0000007
0.0000007 0.8318921 0.0000007
0.0000007 0.8314337 0.0000007
0.0000007 0.8306077 0.0000007
0.0000007 0.8291301 0.0000007
0.4824929 0.8264745 0.0000007
0.7097745 0.8216335 0.0000007
0.8124946 0.8124985 0.1249986
0.8924159 0.7940340 0.7888339
0.9632612 0.7500196 0.9006896
1.0000000 0.4970498 0.9835599
0.0000007 0.8947541 0.0000007
0.0000007 0.8947456 0.0000007
0.0000007 0.8947499 0.0000007
0.0000007 0.8947330 0.0000007
0.0000007 0.8947162 0.0000007
0.0000007 0.8946783 0.0000007
0.0000007 0.8946067 0.0000007
0.0000007 0.8944678 0.0000007
0.0000007 0.8942111 0.0000007
0.0000007 0.8937567 0.0000007
0.0000007 0.8929327 0.0000007
0.0000007 0.8914798 0.0000007
0.5407157 0.8888614 0.0000007
0.7719408 0.8840924 0.0000007
0.8750090 0.8750008 0.1249974
0.9547794 0.8563795 0.8528824
1.0000000 0.8107393 0.9646254
0.0000007 0.9569592 0.0000007
0.0000007 0.9569502 0.0000007
0.0000007 0.9569502 0.0000007
0.0000007 0.9569502 0.0000007
0.0000007 0.9569322 0.0000007
0.0000007 0.9569188 0.0000007
0.0000007 0.9568782 0.0000007
0.0000007 0.9568018 0.0000007
0.0000007 0.9566623 0.0000007
0.0000007 0.9564105 0.0000007
0.0000007 0.9559563 0.0000007
0.0000007 0.9551700 0.0000007
0.0000007 0.9537563 0.0000007
0.5926338 0.9512122 0.0000007
0.8339714 0.9465226 0.0000007
0.9374982 0.9374982 0.1252654
1.0000000 0.9186482 0.9180779
0.0000007 1.0000000 0.0000007
0.0000007 1.0000000 0.0000007
0.0000007 1.0000000 0.0000007
0.0000007 1.0000000 0.0000007
0.0000007 1.0000000 0.0000007
0.0000007 1.0000000 0.0000007
0.0000007 1.0000000 0.0000007
0.0000007 1.0000000 0.0000007
0.0000007 1.0000000 0.0000007
0.0000007 1.0000000 0.0000007
0.0000007 1.0000000 0.0000007
0.0000007 1.0000000 0.0000007
0.0000007 1.0000000 0.0000007
0.0000007 1.0000000 0.0000007
0.6355943 1.0000000 0.0000007
0.8957947 1.0000000 0.0000007
1.0000000 1.0000000 0.1250076
0.0000007 0.0000223 0.1875007
0.0718908 0.0000007 0.1905638
0.1407264 0.0000007 0.2040219
0.2081351 0.0000007 0.2327679
0.2745637 0.0000007 0.2756018
0.3402386 0.0000007 0.3276604
0.4053014 0.0000007 0.3847780
0.4698416 0.0000007 0.4444931
0.5339330 0.0000007 0.5055434
0.5976252 0.0000007 0.5672851
0.6609555 0.0000007 0.6293818
0.7239629 0.0000007 0.6916583
0.7866691 0.0000007 0.7540240
0.8491035 0.0000007 0.8164358
0.9112872 0.0000007 0.8788563
0.9732211 0.0000007 0.9412712
1.0000000 0.0000007 1.0000000
0.0000007 0.0674726 0.1843066
0.0625000 0.0625000 0.1875007
0.1383231 0.0086577 0.2014601
0.2072072 0.0000007 0.2309862
0.2741456 0.0000007 0.2745230
0.3400312 0.0000007 0.3270487
0.4051973 0.0000007 0.3844395
0.4697859 0.0000007 0.4443052
0.5339002 0.0000007 0.5054380
0.5976082 0.0000007 0.5672260
0.6609462 0.0000007 0.6293461
0.7239595 0.0000007 0.6916386
0.7866691 0.0000007 0.7540133
0.8490995 0.0000007 0.8164242
0.9112872 0.0000007 0.8788563
0.9732211 0.0000007 0.9412712
1.0000000 0.0000007 1.0000000
0.0000007 0.1333793 0.1662458
0.0000007 0.1320369 0.1703160
0.1249998 0.1249998 0.1875007
0.2024936 0.0990892 0.2216452
0.2720606 0.0000007 0.2690383
0.3390138 0.0000007 0.3239903
0.4046661 0.0000007 0.3827498
0.4695007 0.0000007 0.4433654
0.5337459 0.0000007 0.5049136
0.5975178 0.0000007 0.5669307
0.6608993 0.0000007 0.6291736
0.7239321 0.0000007 0.6915407
0.7866505 0.0000007 0.7539564
0.8490914 0.0000007 0.8163934
0.9112787 0.0000007 0.8788356
0.9732211 0.0000007 0.9412535
1.0000000 0.0000007 1.0000000
0.0000007 0.1985382 0.0000007
0.0000007 0.1980122 0.0386154
0.0423763 0.1953852 0.1211653
0.1875007 0.1875007 0.1875007
0.2659411 0.1653642 0.2515463
0.3360979 0.0298749 0.3148575
0.4031779 0.0000007 0.3778558
0.4687038 0.0000007 0.4406851
0.5333037 0.0000007 0.5034222
0.5972747 0.0000007 0.5660887
0.6607589 0.0000007 0.6287009
0.7238570 0.0000007 0.6912730
0.7866098 0.0000007 0.7538071
0.8490714 0.0000007 0.8163088
0.9112701 0.0000007 0.8787901
0.9732119 0.0000007 0.9412269
1.0000000 0.0000007 1.0000000
0.0000007 0.2631797 0.0000007
0.0000007 0.2629395 0.0000007
0.0000007 0.2617582 0.0000007
0.1329530 0.2583594 0.0000007
0.2500004 0.2500015 0.1875007
0.3290423 0.2295101 0.2896916
0.3996531 0.1622194 0.3656118
0.4668416 0.0000007 0.4342593
0.5322915 0.0000007 0.4999166
0.5967128 0.0000007 0.5641333
0.6604437 0.0000007 0.6275992
0.7236726 0.0000007 0.6906499
0.7865059 0.0000007 0.7534552
0.8490115 0.0000007 0.8161088
0.9112358 0.0000007 0.8786743
0.9731982 0.0000007 0.9411694
1.0000000 0.0000007 1.0000000
0.0000007 0.3274168 0.0000007
0.0000007 0.3272982 0.0000007
0.0000007 0.3267153 0.0000007
0.0000007 0.3250640 0.0000007
0.2023286 0.3211561 0.0000007
0.3124999 0.3124999 0.1875007
0.3919427 0.2929149 0.3340223
0.4628842 0.2383338 0.4195257
0.5301600 0.0000007 0.4922581
0.5955341 0.0000007 0.5599719
0.6597794 0.0000007 0.6252804
0.7233039 0.0000007 0.6893467
0.7863020 0.0000007 0.7527199
0.8488916 0.0000007 0.8156975
0.9111715 0.0000007 0.8784385
0.9731570 0.0000007 0.9410410
1.0000000 0.0000007 1.0000000
0.0000007 0.3913299 0.0000007
0.0000007 0.3912704 0.0000007
0.0000007 0.3909635 0.0000007
0.0000007 0.3901073 0.0000007
0.0000007 0.3881178 0.0000007
0.2681066 0.3838566 0.0000007
0.3749991 0.3749991 0.1875007
0.4547209 0.3559716 0.3828008
0.5258798 0.3073057 0.4755738
0.5932060 0.0000007 0.5513769
0.6584871 0.0000007 0.6206271
0.7225738 0.0000007 0.6867639
0.7858908 0.0000007 0.7512729
0.8486637 0.0000007 0.8148870
0.9110472 0.0000007 0.8780004
0.9730930 0.0000007 0.9408020
1.0000000 0.0000007 1.0000000
0.0000007 0.4549562 0.0000007
0.0000007 0.4549238 0.0000007
0.0000007 0.4547619 0.0000007
0.0000007 0.4543001 0.0000007
0.0000007 0.4532361 0.0000007
0.0000007 0.4509955 0.0000007
0.3324882 0.4464898 0.0000007
0.4375011 0.4374969 0.1874998
0.5173995 0.4188227 0.4348558
0.5887104 0.3734072 0.5332254
0.6560246 0.0000007 0.6113447
0.7212078 0.0000007 0.6817620
0.7851205 0.0000007 0.7485176
0.8482362 0.0000007 0.8133565
0.9108029 0.0000007 0.8771494
0.9729558 0.0000007 0.9403243
1.0000000 0.0000007 1.0000000
0.0000007 0.5183418 0.0000007
0.0000007 0.5183247 0.0000007
0.0000007 0.5182313 0.0000007
0.0000007 0.5179784 0.0000007
0.0000007 0.5173970 0.0000007
0.0000007 0.5161725 0.0000007
0.0000007 0.5137540 0.0000007
0.3961343 0.5090759 0.0000007
0.4999972 0.4999972 0.1875034
0.5800230 0.4815372 0.4894603
0.6513917 0.4379937 0.5921378
0.7186598 0.0000007 0.6720343
0.7837080 0.0000007 0.7433138
0.8474496 0.0000007 0.8105139
0.9103745 0.0000007 0.8755900
0.9727225 0.0000007 0.9394800
1.0000000 0.0000007 1.0000000
0.0000007 0.5815125 0.0000007
0.0000007 0.5815042 0.0000007
0.0000007 0.5814520 0.0000007
0.0000007 0.5813144 0.0000007
0.0000007 0.5809817 0.0000007
0.0000007 0.5803058 0.0000007
0.0000007 0.5789700 0.0000007
0.0000007 0.5764248 0.0000007
0.4593347 0.5716353 0.0000007
0.5625013 0.5625013 0.1874962
0.6425776 0.5441685 0.5461305
0.7139608 0.5016212 0.6521308
0.7811298 0.2779564 0.7333279
0.8460300 0.0000007 0.8052300
0.9095824 0.0000007 0.8727382
0.9722882 0.0000007 0.9379348
1.0000000 0.0000007 1.0000000
0.0000007 0.6444844 0.0000007
0.0000007 0.6444844 0.0000007
0.0000007 0.6444509 0.0000007
0.0000007 0.6443717 0.0000007
0.0000007 0.6441891 0.0000007
0.0000007 0.6438056 0.0000007
0.0000007 0.6430575 0.0000007
0.0000007 0.6416460 0.0000007
0.2563514 0.6390222 0.0000007
0.5222545 0.6341599 0.0000007
0.6250026 0.6249967 0.1875007
0.7050996 0.6067191 0.6045938
0.7764121 0.5645393 0.7130718
0.8434600 0.3629554 0.7951875
0.9081797 0.0000007 0.8674868
0.9715251 0.0000007 0.9351465
1.0000000 0.0000007 1.0000000
0.0000007 0.7072830 0.0000007
0.0000007 0.7072830 0.0000007
0.0000007 0.7072696 0.0000007
0.0000007 0.7072229 0.0000007
0.0000007 0.7071161 0.0000007
0.0000007 0.7069025 0.0000007
0.0000007 0.7064822 0.0000007
0.0000007 0.7056823 0.0000007
0.0000007 0.7042248 0.0000007
0.3456196 0.7015604 0.0000007
0.5849317 0.6966758 0.0000007
0.6875004 0.6875004 0.1875070
0.7675710 0.6692214 0.6646345
0.8387775 0.6268995 0.7748689
0.9056577 0.4260843 0.8575618
0.9701696 0.0000007 0.9300318
1.0000000 0.0000007 0.9977280
0.0000007 0.7699198 0.0000007
0.0000007 0.7699198 0.0000007
0.0000007 0.7699089 0.0000007
0.0000007 0.7698835 0.0000007
0.0000007 0.7698254 0.0000007
0.0000007 0.7697020 0.0000007
0.0000007 0.7694625 0.0000007
0.0000007 0.7690164 0.0000007
0.0000007 0.7681937 0.0000007
0.0000007 0.7667137 0.0000007
0.4180929 0.7640429 0.0000007
0.6474423 0.7591621 0.0000007
0.7499983 0.7499983 0.1875142
0.8300054 0.7316587 0.7261149
0.9010627 0.6887156 0.8374512
0.9677234 0.4733949 0.9203613
1.0000000 0.0000007 0.9928400
0.0000007 0.8323977 0.0000007
0.0000007 0.8323977 0.0000007
0.0000007 0.8323938 0.0000007
0.0000007 0.8323820 0.0000007
0.0000007 0.8323467 0.0000007
0.0000007 0.8322762 0.0000007
0.0000007 0.8321429 0.0000007
0.0000007 0.8318921 0.0000007
0.0000007 0.8314337 0.0000007
0.0000007 0.8306077 0.0000007
0.0000007 0.8291301 0.0000007
0.4824975 0.8264745 0.0000007
0.7097745 0.8216335 0.0000007
0.8124946 0.8124985 0.1874989
0.8924159 0.7940378 0.7889380
0.9632612 0.7500196 0.9007235
1.0000000 0.4970498 0.9835784
0.0000007 0.8947541 0.0000007
0.0000007 0.8947456 0.0000007
0.0000007 0.8947499 0.0000007
0.0000007 0.8947330 0.0000007
0.0000007 0.8947162 0.0000007
0.0000007 0.8946783 0.0000007
0.0000007 0.8946067 0.0000007
0.0000007 0.8944678 0.0000007
0.0000007 0.8942111 0.0000007
0.0000007 0.8937567 0.0000007
0.0000007 0.8929327 0.0000007
0.0000007 0.8914798 0.0000007
0.5407208 0.8888614 0.0000007
0.7719408 0.8840924 0.0000007
0.8750090 0.8750008 0.1874476
0.9547794 0.8563876 0.8529466
1.0000000 0.8107393 0.9646390
0.0000007 0.9569592 0.0000007
0.0000007 0.9569592 0.0000007
0.0000007 0.9569502 0.0000007
0.0000007 0.9569502 0.0000007
0.0000007 0.9569412 0.0000007
0.0000007 0.9569188 0.0000007
0.0000007 0.9568782 0.0000007
0.0000007 0.9568018 0.0000007
0.0000007 0.9566623 0.0000007
0.0000007 0.9564105 0.0000007
0.0000007 0.9559563 0.0000007
0.0000007 0.9551700 0.0000007
0.0000007 0.9537563 0.0000007
0.5926338 0.9512122 0.0000007
0.8339714 0.9465226 0.0000007
0.9374982 0.9374982 0.1874989
1.0000000 0.9186482 0.9181125
0.0000007 1.0000000 0.0000007
0.0000007 1.0000000 0.0000007
0.0000007 1.0000000 0.0000007
0.0000007 1.0000000 0.0000007
0.0000007 1.0000000 0.0000007
0.0000007 1.0000000 0.0000007
0.0000007 1.0000000 0.0000007
0.0000007 1.0000000 0.0000007
0.0000007 1.0000000 0.0000007
0.0000007 1.0000000 0.0000007
0.0000007 1.0000000 0.0000007
0.0000007 1.0000000 0.0000007
0.0000007 1.0000000 0.0000007
0.0000007 1.0000000 0.0000007
0.6355943 1.0000000 0.0000007
0.8958032 1.0000000 0.0000007
1.0000000 1.0000000 0.1877196
0.0000007 0.0000300 0.2500004
0.0718908 0.0000007 0.2514260
0.1407264 0.0000007 0.2580866
0.2081351 0.0000007 0.2744286
0.2745637 0.0000007 0.3034987
0.3402386 0.0000007 0.3446562
0.4053014 0.0000007 0.3946603
0.4698416 0.0000007 0.4501420
0.5339330 0.0000007 0.5087623
0.5976252 0.0000007 0.5691193
0.6609555 0.0000007 0.6304270
0.7239629 0.0000007 0.6922561
0.7866691 0.0000007 0.7543654
0.8491035 0.0000007 0.8166242
0.9112872 0.0000007 0.8789680
0.9732211 0.0000007 0.9413288
1.0000000 0.0000007 1.0000000
0.0000007 0.0674723 0.2485517
0.0625000 0.0625000 0.2500004
0.1383231 0.0086583 0.2567696
0.2072072 0.0000007 0.2733361
0.2741456 0.0000007 0.3027062
0.3400312 0.0000007 0.3441428
0.4051973 0.0000007 0.3943489
0.4697859 0.0000007 0.4499647
0.5339002 0.0000007 0.5086538
0.5976082 0.0000007 0.5690600
0.6609462 0.0000007 0.6303912
0.7239595 0.0000007 0.6922365
0.7866691 0.0000007 0.7543548
0.8490995 0.0000007 0.8166165
0.9112872 0.0000007 0.8789597
0.9732211 0.0000007 0.9413288
1.0000000 0.0000007 1.0000000
0.0000007 0.1333780 0.2410695
0.0000007 0.1320369 0.2426503
0.1249998 0.1249998 0.2500004
0.2024936 0.0990902 0.2677763
0.2720606 0.0000007 0.2987230
0.3390138 0.0000007 0.3415931
0.4046661 0.0000007 0.3928216
0.4695007 0.0000007 0.4490748
0.5337459 0.0000007 0.5081477
0.5975178 0.0000007 0.5687665
0.6608931 0.0000007 0.6302214
0.7239321 0.0000007 0.6921417
0.7866505 0.0000007 0.7542979
0.8490914 0.0000007 0.8165858
0.9112787 0.0000007 0.8789473
0.9732211 0.0000007 0.9413199
1.0000000 0.0000007 1.0000000
0.0000007 0.1985382 0.2156030
0.0000007 0.1980122 0.2177500
0.0423761 0.1953861 0.2275209
0.1875007 0.1875007 0.2500004
0.2659411 0.1653642 0.2865389
0.3360979 0.0298742 0.3340605
0.4031779 0.0000007 0.3884059
0.4687038 0.0000007 0.4465406
0.5333037 0.0000007 0.5066998
0.5972747 0.0000007 0.5679433
0.6607589 0.0000007 0.6297568
0.7238570 0.0000007 0.6918706
0.7866098 0.0000007 0.7541484
0.8490714 0.0000007 0.8165011
0.9112701 0.0000007 0.8788935
0.9732119 0.0000007 0.9412889
1.0000000 0.0000007 1.0000000
0.0000007 0.2631797 0.0000007
0.0000007 0.2629395 0.0000007
0.0000007 0.2617582 0.1112719
0.1329523 0.2583594 0.1840254
0.2500004 0.2500015 0.2500004
0.3290423 0.2295101 0.3140956
0.3996531 0.1622194 0.3774605
0.4668416 0.0000007 0.4404780
0.5322941 0.0000007 0.5033029
0.5967128 0.0000007 0.5660217
0.6604437 0.0000007 0.6286623
0.7236726 0.0000007 0.6912534
0.7865059 0.0000007 0.7537964
0.8490115 0.0000007 0.8163011
0.9112358 0.0000007 0.8787901
0.9731982 0.0000007 0.9412269
1.0000000 0.0000007 1.0000000
0.0000007 0.3274168 0.0000007
0.0000007 0.3272982 0.0000007
0.0000007 0.3267153 0.0000007
0.0000007 0.3250640 0.0000007
0.2023286 0.3211561 0.0000007
0.3124999 0.3124999 0.2500004
0.3919464 0.2929149 0.3500178
0.4628842 0.2383350 0.4266514
0.5301600 0.0000007 0.4958940
0.5955312 0.0000007 0.5619291
0.6597794 0.0000007 0.6263663
0.7233039 0.0000007 0.6899557
0.7863020 0.0000007 0.7530608
0.8488916 0.0000007 0.8158858
0.9111715 0.0000007 0.8785543
0.9731570 0.0000007 0.9410986
1.0000000 0.0000007 1.0000000
0.0000007 0.3913299 0.0000007
0.0000007 0.3912704 0.0000007
0.0000007 0.3909635 0.0000007
0.0000007 0.3901110 0.0000007
0.0000007 0.3881105 0.0000007
0.2681066 0.3838566 0.0000007
0.3749991 0.3750027 0.2500015
0.4547165 0.3559716 0.3928702
0.5258798 0.3073057 0.4798113
0.5932060 0.0000007 0.5534957
0.6584871 0.0000007 0.6217549
0.7225738 0.0000007 0.6873835
0.7858908 0.0000007 0.7516237
0.8486637 0.0000007 0.8150790
0.9110472 0.0000007 0.8781161
0.9730930 0.0000007 0.9408551
1.0000000 0.0000007 1.0000000
0.0000007 0.4549583 0.0000007
0.0000007 0.4549238 0.0000007
0.0000007 0.4547619 0.0000007
0.0000007 0.4543001 0.0000007
0.0000007 0.4532361 0.0000007
0.0000007 0.4509955 0.0000007
0.3324882 0.4464855 0.0000007
0.4375011 0.4374969 0.2499992
0.5173995 0.4188227 0.4410326
0.5887104 0.3734072 0.5357192
0.6560246 0.0000007 0.6125774
0.7212078 0.0000007 0.6824159
0.7851205 0.0000007 0.7488742
0.8482362 0.0000007 0.8135519
0.9108029 0.0000007 0.8772526
0.9729558 0.0000007 0.9403951
1.0000000 0.0000007 1.0000000
0.0000007 0.5183418 0.0000007
0.0000007 0.5183222 0.0000007
0.0000007 0.5182313 0.0000007
0.0000007 0.5179784 0.0000007
0.0000007 0.5173970 0.0000007
0.0000007 0.5161725 0.0000007
0.0000007 0.5137491 0.0000007
0.3961343 0.5090759 0.0000007
0.4999972 0.4999972 0.2500004
0.5800202 0.4815372 0.4931903
0.6513917 0.4379958 0.5935990
0.7186598 0.0000007 0.6727424
0.7837080 0.0000007 0.7436891
0.8474496 0.0000007 0.8107164
0.9103659 0.0000007 0.8757054
0.9727225 0.0000007 0.9395419
1.0000000 0.0000007 1.0000000
0.0000007 0.5815125 0.0000007
0.0000007 0.5815042 0.0000007
0.0000007 0.5814520 0.0000007
0.0000007 0.5813144 0.0000007
0.0000007 0.5809872 0.0000007
0.0000007 0.5803030 0.0000007
0.0000007 0.5789700 0.0000007
0.0000007 0.5764275 0.0000007
0.4593347 0.5716353 0.0000007
0.5625013 0.5625013 0.2499992
0.6425776 0.5441685 0.5483514
0.7139608 0.5016212 0.6529849
0.7811298 0.2779564 0.7337398
0.8460300 0.0000007 0.8054426
0.9095824 0.0000007 0.8728533
0.9722882 0.0000007 0.9380009
1.0000000 0.0000007 1.0000000
0.0000007 0.6444844 0.0000007
0.0000007 0.6444844 0.0000007
0.0000007 0.6444509 0.0000007
0.0000007 0.6443717 0.0000007
0.0000007 0.6441891 0.0000007
0.0000007 0.6438056 0.0000007
0.0000007 0.6430575 0.0000007
0.0000007 0.6416460 0.0000007
0.2563526 0.6390222 0.0000007
0.5222496 0.6341659 0.0000007
0.6249967 0.6250026 0.2500039
0.7050963 0.6067191 0.6059019
0.7764121 0.5645393 0.7135633
0.8434600 0.3629519 0.7954236
0.9081797 0.0000007 0.8676093
0.9715251 0.0000007 0.9352037
1.0000000 0.0000007 1.0000000
0.0000007 0.7072830 0.0000007
0.0000007 0.7072830 0.0000007
0.0000007 0.7072696 0.0000007
0.0000007 0.7072229 0.0000007
0.0000007 0.7071161 0.0000007
0.0000007 0.7069025 0.0000007
0.0000007 0.7064822 0.0000007
0.0000007 0.7056823 0.0000007
0.0000007 0.7042248 0.0000007
0.3456180 0.7015604 0.0000007
0.5849317 0.6966758 0.0000007
0.6875004 0.6875004 0.2500039
0.7675710 0.6692214 0.6653948
0.8387775 0.6268995 0.7751466
0.9056577 0.4260822 0.8576910
0.9701605 0.0000007 0.9300931
1.0000000 0.0000007 0.9977561
0.0000007 0.7699198 0.0000007
0.0000007 0.7699198 0.0000007
0.0000007 0.7699089 0.0000007
0.0000007 0.7698835 0.0000007
0.0000007 0.7698254 0.0000007
0.0000007 0.7697020 0.0000007
0.0000007 0.7694662 0.0000007
0.0000007 0.7690164 0.0000007
0.0000007 0.7681937 0.0000007
0.0000007 0.7667137 0.0000007
0.4180890 0.7640429 0.0000007
0.6474362 0.7591621 0.0000007
0.7499983 0.7499983 0.2500051
0.8300093 0.7316552 0.7265536
0.9010627 0.6887156 0.8376090
0.9677143 0.4733994 0.9204392
1.0000000 0.0000007 0.9928773
0.0000007 0.8323977 0.0000007
0.0000007 0.8323977 0.0000007
0.0000007 0.8323938 0.0000007
0.0000007 0.8323820 0.0000007
0.0000007 0.8323467 0.0000007
0.0000007 0.8322762 0.0000007
0.0000007 0.8321429 0.0000007
0.0000007 0.8318921 0.0000007
0.0000007 0.8314337 0.0000007
0.0000007 0.8306077 0.0000007
0.0000007 0.8291301 0.0000007
0.4824975 0.8264745 0.0000007
0.7097778 0.8216335 0.0000007
0.8124946 0.8124985 0.2500004
0.8924159 0.7940340 0.7891872
0.9632612 0.7500125 0.9008167
1.0000000 0.4970498 0.9836246
0.0000007 0.8947541 0.0000007
0.0000007 0.8947456 0.0000007
0.0000007 0.8947499 0.0000007
0.0000007 0.8947330 0.0000007
0.0000007 0.8947162 0.0000007
0.0000007 0.8946783 0.0000007
0.0000007 0.8946067 0.0000007
0.0000007 0.8944594 0.0000007
0.0000007 0.8942111 0.0000007
0.0000007 0.8937567 0.0000007
0.0000007 0.8929327 0.0000007
0.0000007 0.8914798 0.0000007
0.5407208 0.8888698 0.0000007
0.7719408 0.8840924 0.0000007
0.8750008 0.8750008 0.2500231
0.9547704 0.8563795 0.8530833
1.0000000 0.8107393 0.9646889
0.0000007 0.9569502 0.0000007
0.0000007 0.9569502 0.0000007
0.0000007 0.9569502 0.0000007
0.0000007 0.9569502 0.0000007
0.0000007 0.9569412 0.0000007
0.0000007 0.9569188 0.0000007
0.0000007 0.9568782 0.0000007
0.0000007 0.9568018 0.0000007
0.0000007 0.9566623 0.0000007
0.0000007 0.9564105 0.0000007
0.0000007 0.9559563 0.0000007
0.0000007 0.9551700 0.0000007
0.0000007 0.9537563 0.0000007
0.5926338 0.9512122 0.0000007
0.8339714 0.9465226 0.0000007
0.9374982 0.9374982 0.2499992
1.0000000 0.9186482 0.9181859
0.0000007 1.0000000 0.0000007
0.0000007 1.0000000 0.0000007
0.0000007 1.0000000 0.0000007
0.0000007 1.0000000 0.0000007
0.0000007 1.0000000 0.0000007
0.0000007 1.0000000 0.0000007
0.0000007 1.0000000 0.0000007
0.0000007 1.0000000 0.0000007
0.0000007 1.0000000 0.0000007
0.0000007 1.0000000 0.0000007
0.0000007 1.0000000 0.0000007
0.0000007 1.0000000 0.0000007
0.0000007 1.0000000 0.0000007
0.0000007 1.0000000 0.0000007
0.6355943 1.0000000 0.0000007
0.8957947 1.0000000 0.0000007
1.0000000 1.0000000 0.2499059
0.0000007 0.0000701 0.3124999
0.0718908 0.0000007 0.3132116
0.1407264 0.0000007 0.3166327
0.2081351 0.0000007 0.3256037
0.2745637 0.0000007 0.3434975
0.3402386 0.0000007 0.3725660
0.4053014 0.0000007 0.4125098
0.4698416 0.0000007 0.4609639
0.5339330 0.0000007 0.5151364
0.5976252 0.0000007 0.5728242
0.6609555 0.0000007 0.6325613
0.7239629 0.0000007 0.6934861
0.7866691 0.0000007 0.7550666
0.8491035 0.0000007 0.8170207
0.9112872 0.0000007 0.8791956
0.9732211 0.0000007 0.9414483
1.0000000 0.0000007 1.0000000
0.0000007 0.0674726 0.3117808
0.0624997 0.0625003 0.3124999
0.1383231 0.0086594 0.3159434
0.2072072 0.0000007 0.3249803
0.2741456 0.0000007 0.3429808
0.3400312 0.0000007 0.3721796
0.4051973 0.0000007 0.4122491
0.4697859 0.0000007 0.4607976
0.5339002 0.0000007 0.5150387
0.5976082 0.0000007 0.5727700
0.6609462 0.0000007 0.6325284
0.7239595 0.0000007 0.6934665
0.7866691 0.0000007 0.7550524
0.8491035 0.0000007 0.8170091
0.9112872 0.0000007 0.8791873
0.9732211 0.0000007 0.9414572
1.0000000 0.0000007 1.0000000
0.0000007 0.1333793 0.3081747
0.0000007 0.1320356 0.3089209
0.1249998 0.1249998 0.3124999
0.2024936 0.0990892 0.3218535
0.2720606 0.0000007 0.3403991
0.3390138 0.0000007 0.3702682
0.4046661 0.0000007 0.4109698
0.4695007 0.0000007 0.4599957
0.5337459 0.0000007 0.5145581
0.5975178 0.0000007 0.5724854
0.6608993 0.0000007 0.6323670
0.7239321 0.0000007 0.6933683
0.7866505 0.0000007 0.7550026
0.8490914 0.0000007 0.8169822
0.9112787 0.0000007 0.8791583
0.9732211 0.0000007 0.9414394
1.0000000 0.0000007 1.0000000
0.0000007 0.1985382 0.2972554
0.0000007 0.1980122 0.2980950
0.0423763 0.1953852 0.3021059
0.1875007 0.1875007 0.3124999
0.2659411 0.1653642 0.3327672
0.3360979 0.0298746 0.3647080
0.4031703 0.0000007 0.4072848
0.4687038 0.0000007 0.4577178
0.5333037 0.0000007 0.5131943
0.5972747 0.0000007 0.5716894
0.6607589 0.0000007 0.6319038
0.7238570 0.0000007 0.6930999
0.7866098 0.0000007 0.7548494
0.8490714 0.0000007 0.8168936
0.9112701 0.0000007 0.8791211
0.9732119 0.0000007 0.9414085
1.0000000 0.0000007 1.0000000
0.0000007 0.2631797 0.2656998
0.0000007 0.2629395 0.2668909
0.0000007 0.2617582 0.2725042
0.1329523 0.2583594 0.2865813
0.2500004 0.2500004 0.3124999
0.3290423 0.2295101 0.3505951
0.3996531 0.1622194 0.3982893
0.4668416 0.0000007 0.4522797
0.5322915 0.0000007 0.5100009
0.5967128 0.0000007 0.5698308
0.6604437 0.0000007 0.6308324
0.7236726 0.0000007 0.6924915
0.7865059 0.0000007 0.7545006
0.8490115 0.0000007 0.8167012
0.9112444 0.0000007 0.8790053
0.9731982 0.0000007 0.9413465
1.0000000 0.0000007 1.0000000
0.0000007 0.3274168 0.0000007
0.0000007 0.3272982 0.0000007
0.0000007 0.3267153 0.0823283
0.0000007 0.3250640 0.1762539
0.2023286 0.3211561 0.2467039
0.3124999 0.3124999 0.3124999
0.3919464 0.2929149 0.3766299
0.4628842 0.2383338 0.4400285
0.5301600 0.0000007 0.5030572
0.5955341 0.0000007 0.5658824
0.6597794 0.0000007 0.6285880
0.7233039 0.0000007 0.6912077
0.7863020 0.0000007 0.7537680
0.8488916 0.0000007 0.8162896
0.9111629 0.0000007 0.8787777
0.9731570 0.0000007 0.9412181
1.0000000 0.0000007 1.0000000
0.0000007 0.3913299 0.0000007
0.0000007 0.3912704 0.0000007
0.0000007 0.3909635 0.0000007
0.0000007 0.3901110 0.0000007
0.0000007 0.3881105 0.0000007
0.2681066 0.3838566 0.0000007
0.3749991 0.3750027 0.3124999
0.4547165 0.3559716 0.4110069
0.5258798 0.3073042 0.4880880
0.5932060 0.0000007 0.5577601
0.6584871 0.0000007 0.6240696
0.7225738 0.0000007 0.6886700
0.7858908 0.0000007 0.7523366
0.8486637 0.0000007 0.8154823
0.9110472 0.0000007 0.8783352
0.9730930 0.0000007 0.9409791
1.0000000 0.0000007 1.0000000
0.0000007 0.4549562 0.0000007
0.0000007 0.4549238 0.0000007
0.0000007 0.4547619 0.0000007
0.0000007 0.4543001 0.0000007
0.0000007 0.4532361 0.0000007
0.0000007 0.4509955 0.0000007
0.3324866 0.4464898 0.0000007
0.4375011 0.4374969 0.3124999
0.5173995 0.4188227 0.4527824
0.5887104 0.3734072 0.5407259
0.6560246 0.0000007 0.6150882
0.7212078 0.0000007 0.6837513
0.7851205 0.0000007 0.7496093
0.8482362 0.0000007 0.8139583
0.9108029 0.0000007 0.8774797
0.9729558 0.0000007 0.9405145
1.0000000 0.0000007 1.0000000
0.0000007 0.5183418 0.0000007
0.0000007 0.5183247 0.0000007
0.0000007 0.5182313 0.0000007
0.0000007 0.5179784 0.0000007
0.0000007 0.5173970 0.0000007
0.0000007 0.5161725 0.0000007
0.0000007 0.5137540 0.0000007
0.3961343 0.5090759 0.0000007
0.4999972 0.4999972 0.3124999
0.5800202 0.4815372 0.5005261
0.6513917 0.4379937 0.5965745
0.7186598 0.0000007 0.6742057
0.7837080 0.0000007 0.7444577
0.8474496 0.0000007 0.8111328
0.9103745 0.0000007 0.8759322
0.9727225 0.0000007 0.9396611
1.0000000 0.0000007 1.0000000
0.0000007 0.5815125 0.0000007
0.0000007 0.5815042 0.0000007
0.0000007 0.5814547 0.0000007
0.0000007 0.5813144 0.0000007
0.0000007 0.5809817 0.0000007
0.0000007 0.5803058 0.0000007
0.0000007 0.5789700 0.0000007
0.0000007 0.5764248 0.0000007
0.4593347 0.5716353 0.0000007
0.5625013 0.5625013 0.3124999
0.6425776 0.5441685 0.5528174
0.7139608 0.5016212 0.6547303
0.7811298 0.2779564 0.7345884
0.8460300 0.0000007 0.8058792
0.9095824 0.0000007 0.8730834
0.9722882 0.0000007 0.9381201
1.0000000 0.0000007 1.0000000
0.0000007 0.6444844 0.0000007
0.0000007 0.6444844 0.0000007
0.0000007 0.6444509 0.0000007
0.0000007 0.6443717 0.0000007
0.0000007 0.6441891 0.0000007
0.0000007 0.6438056 0.0000007
0.0000007 0.6430575 0.0000007
0.0000007 0.6416460 0.0000007
0.2563550 0.6390222 0.0000007
0.5222496 0.6341659 0.0000007
0.6249967 0.6249967 0.3124999
0.7050963 0.6067191 0.6085669
0.7764121 0.5645393 0.7145777
0.8434600 0.3629536 0.7958999
0.9081797 0.0000007 0.8678545
0.9715251 0.0000007 0.9353356
1.0000000 0.0000007 1.0000000
0.0000007 0.7072830 0.0000007
0.0000007 0.7072830 0.0000007
0.0000007 0.7072696 0.0000007
0.0000007 0.7072229 0.0000007
0.0000007 0.7071161 0.0000007
0.0000007 0.7069025 0.0000007
0.0000007 0.7064822 0.0000007
0.0000007 0.7056890 0.0000007
0.0000007 0.7042248 0.0000007
0.3456180 0.7015604 0.0000007
0.5849344 0.6966758 0.0000007
0.6875004 0.6875004 0.3124984
0.7675710 0.6692214 0.6669524
0.8387775 0.6268995 0.7757242
0.9056577 0.4260822 0.8579657
0.9701605 0.0000007 0.9302287
1.0000000 0.0000007 0.9978265
0.0000007 0.7699198 0.0000007
0.0000007 0.7699198 0.0000007
0.0000007 0.7699089 0.0000007
0.0000007 0.7698835 0.0000007
0.0000007 0.7698254 0.0000007
0.0000007 0.7697020 0.0000007
0.0000007 0.7694662 0.0000007
0.0000007 0.7690127 0.0000007
0.0000007 0.7681937 0.0000007
0.0000007 0.7667137 0.0000007
0.4180890 0.7640429 0.0000007
0.6474362 0.7591621 0.0000007
0.7499983 0.7499983 0.3125014
0.8300054 0.7316552 0.7274523
0.9010627 0.6887156 0.8379365
0.9677143 0.4733994 0.9205821
1.0000000 0.0000007 0.9929473
0.0000007 0.8323977 0.0000007
0.0000007 0.8323977 0.0000007
0.0000007 0.8323938 0.0000007
0.0000007 0.8323820 0.0000007
0.0000007 0.8323467 0.0000007
0.0000007 0.8322762 0.0000007
0.0000007 0.8321429 0.0000007
0.0000007 0.8318921 0.0000007
0.0000007 0.8314337 0.0000007
0.0000007 0.8306077 0.0000007
0.0000007 0.8291301 0.0000007
0.4824975 0.8264745 0.0000007
0.7097745 0.8216335 0.0000007
0.8124946 0.8124985 0.3124999
0.8924159 0.7940340 0.7896933
0.9632612 0.7500125 0.9009905
1.0000000 0.4970498 0.9836940
0.0000007 0.8947541 0.0000007
0.0000007 0.8947541 0.0000007
0.0000007 0.8947499 0.0000007
0.0000007 0.8947330 0.0000007
0.0000007 0.8947162 0.0000007
0.0000007 0.8946783 0.0000007
0.0000007 0.8946067 0.0000007
0.0000007 0.8944678 0.0000007
0.0000007 0.8942111 0.0000007
0.0000007 0.8937567 0.0000007
0.0000007 0.8929327 0.0000007
0.0000007 0.8914798 0.0000007
0.5407208 0.8888614 0.0000007
0.7719408 0.8840924 0.0000007
0.8750090 0.8750008 0.3124984
0.9547704 0.8563795 0.8533645
1.0000000 0.8107393 0.9647887
0.0000007 0.9569592 0.0000007
0.0000007 0.9569592 0.0000007
0.0000007 0.9569502 0.0000007
0.0000007 0.9569502 0.0000007
0.0000007 0.9569412 0.0000007
0.0000007 0.9569188 0.0000007
0.0000007 0.9568782 0.0000007
0.0000007 0.9568018 0.0000007
0.0000007 0.9566623 0.0000007
0.0000007 0.9564105 0.0000007
0.0000007 0.9559563 0.0000007
0.0000007 0.9551700 0.0000007
0.0000007 0.9537563 0.0000007
0.5926338 0.9512122 0.0000007
0.8339714 0.9465226 0.0000007
0.9374982 0.9374982 0.3124984
1.0000000 0.9186482 0.9183457
0.0000007 1.0000000 0.0000007
0.0000007 1.0000000 0.0000007
0.0000007 1.0000000 0.0000007
0.0000007 1.0000000 0.0000007
0.0000007 1.0000000 0.0000007
0.0000007 1.0000000 0.0000007
0.0000007 1.0000000 0.0000007
0.0000007 1.0000000 0.0000007
0.0000007 1.0000000 0.0000007
0.0000007 1.0000000 0.0000007
0.0000007 1.0000000 0.0000007
0.0000007 1.0000000 0.0000007
0.0000007 1.0000000 0.0000007
0.0000007 1.0000000 0.0000007
0.6355943 1.0000000 0.0000007
0.8957947 1.0000000 0.0000007
1.0000000 1.0000000 0.3125476
0.0000007 0.0000812 0.3749991
0.0718908 0.0000007 0.3753722
0.1407264 0.0000007 0.3771912
0.2081351 0.0000007 0.3821149
0.2745637 0.0000007 0.3925863
0.3402386 0.0000007 0.4113684
0.4053014 0.0000007 0.4402981
0.4698461 0.0000007 0.4793040
0.5339330 0.0000007 0.5265679
0.5976252 0.0000007 0.5797020
0.6609555 0.0000007 0.6366075
0.7239629 0.0000007 0.6958311
0.7866691 0.0000007 0.7564139
0.8491035 0.0000007 0.8177871
0.9112872 0.0000007 0.8796136
0.9732211 0.0000007 0.9416963
1.0000000 0.0000007 1.0000000
0.0000007 0.0674726 0.3746264
0.0625003 0.0625003 0.3749991
0.1383231 0.0086581 0.3768199
0.2072072 0.0000007 0.3817642
0.2741456 0.0000007 0.3922746
0.3400312 0.0000007 0.4111046
0.4051973 0.0000007 0.4401016
0.4697859 0.0000007 0.4791676
0.5339002 0.0000007 0.5264782
0.5976082 0.0000007 0.5796471
0.6609462 0.0000007 0.6365805
0.7239595 0.0000007 0.6958113
0.7866691 0.0000007 0.7564068
0.8491035 0.0000007 0.8177755
0.9112872 0.0000007 0.8796136
0.9732211 0.0000007 0.9416874
1.0000000 0.0000007 1.0000000
0.0000007 0.1333793 0.3727593
0.0000007 0.1320356 0.3731408
0.1250004 0.1249998 0.3750027
0.2024936 0.0990883 0.3800319
0.2720606 0.0000007 0.3907144
0.3390138 0.0000007 0.4098073
0.4046661 0.0000007 0.4391246
0.4695007 0.0000007 0.4784907
0.5337459 0.0000007 0.5260493
0.5975178 0.0000007 0.5793811
0.6608993 0.0000007 0.6364210
0.7239321 0.0000007 0.6957194
0.7866505 0.0000007 0.7563497
0.8490914 0.0000007 0.8177485
0.9112787 0.0000007 0.8796012
0.9732211 0.0000007 0.9416785
1.0000000 0.0000007 1.0000000
0.0000007 0.1985382 0.3673387
0.0000007 0.1980122 0.3677463
0.0423757 0.1953861 0.3697065
0.1875007 0.1875007 0.3749991
0.2659411 0.1653642 0.3862045
0.3360979 0.0298752 0.4060862
0.4031779 0.0000007 0.4363329
0.4686994 0.0000007 0.4765789
0.5333037 0.0000007 0.5248219
0.5972747 0.0000007 0.5786358
0.6607589 0.0000007 0.6359790
0.7238570 0.0000007 0.6954600
0.7866098 0.0000007 0.7561963
0.8490714 0.0000007 0.8176637
0.9112701 0.0000007 0.8795474
0.9732119 0.0000007 0.9416520
1.0000000 0.0000007 1.0000000
0.0000007 0.2631797 0.3536267
0.0000007 0.2629395 0.3540900
0.0000007 0.2617582 0.3563395
0.1329523 0.2583594 0.3623770
0.2500004 0.2500015 0.3749991
0.3290423 0.2295101 0.3969790
0.3996531 0.1622194 0.4296227
0.4668416 0.0000007 0.4720537
0.5322941 0.0000007 0.5219552
0.5967128 0.0000007 0.5768914
0.6604437 0.0000007 0.6349458
0.7236726 0.0000007 0.6948626
0.7865059 0.0000007 0.7558576
0.8490115 0.0000007 0.8174673
0.9112358 0.0000007 0.8794315
0.9731982 0.0000007 0.9415944
1.0000000 0.0000007 1.0000000
0.0000007 0.3274168 0.3169756
0.0000007 0.3272982 0.3176565
0.0000007 0.3267153 0.3209220
0.0000007 0.3250640 0.3295131
0.2023286 0.3211561 0.3467557
0.3124999 0.3124999 0.3750027
0.3919427 0.2929149 0.4141559
0.4628842 0.2383338 0.4620020
0.5301600 0.0000007 0.5157642
0.5955341 0.0000007 0.5731958
0.6597794 0.0000007 0.6327766
0.7233039 0.0000007 0.6936040
0.7863020 0.0000007 0.7551343
0.8488916 0.0000007 0.8170553
0.9111629 0.0000007 0.8792121
0.9731570 0.0000007 0.9414572
1.0000000 0.0000007 1.0000000
0.0000007 0.3913299 0.0000007
0.0000007 0.3912704 0.0000007
0.0000007 0.3909635 0.0000007
0.0000007 0.3901110 0.1581827
0.0000007 0.3881105 0.2398935
0.2681066 0.3838566 0.3093072
0.3749991 0.3750027 0.3749991
0.4547165 0.3559716 0.4391559
0.5258798 0.3073042 0.5025733
0.5932060 0.0000007 0.5656146
0.6584871 0.0000007 0.6284335
0.7225738 0.0000007 0.6911229
0.7858908 0.0000007 0.7537217
0.8486637 0.0000007 0.8162588
0.9110472 0.0000007 0.8787694
0.9730930 0.0000007 0.9412181
1.0000000 0.0000007 1.0000000
0.0000007 0.4549583 0.0000007
0.0000007 0.4549238 0.0000007
0.0000007 0.4547619 0.0000007
0.0000007 0.4543001 0.0000007
0.0000007 0.4532361 0.0000007
0.0000007 0.4509955 0.0000007
0.3324882 0.4464898 0.0000007
0.4374969 0.4375011 0.3749991
0.5173995 0.4188227 0.4724705
0.5887104 0.3734072 0.5498543
0.6560246 0.0000007 0.6198148
0.7212078 0.0000007 0.6863198
0.7851205 0.0000007 0.7510284
0.8482362 0.0000007 0.8147488
0.9108029 0.0000007 0.8779260
0.9729558 0.0000007 0.9407578
1.0000000 0.0000007 1.0000000
0.0000007 0.5183418 0.0000007
0.0000007 0.5183222 0.0000007
0.0000007 0.5182313 0.0000007
0.0000007 0.5179784 0.0000007
0.0000007 0.5173970 0.0000007
0.0000007 0.5161725 0.0000007
0.0000007 0.5137540 0.0000007
0.3961343 0.5090759 0.0000007
0.4999972 0.4999972 0.3750027
0.5800202 0.4815372 0.5135179
0.6513917 0.4379937 0.6021453
0.7186598 0.0000007 0.6769976
0.7837080 0.0000007 0.7459411
0.8474496 0.0000007 0.8119435
0.9103745 0.0000007 0.8763694
0.9727225 0.0000007 0.9399087
1.0000000 0.0000007 1.0000000
0.0000007 0.5815125 0.0000007
0.0000007 0.5815042 0.0000007
0.0000007 0.5814520 0.0000007
0.0000007 0.5813144 0.0000007
0.0000007 0.5809872 0.0000007
0.0000007 0.5803058 0.0000007
0.0000007 0.5789700 0.0000007
0.0000007 0.5764248 0.0000007
0.4593347 0.5716353 0.0000007
0.5625013 0.5625013 0.3749991
0.6425776 0.5441685 0.5610174
0.7139608 0.5016212 0.6580517
0.7811298 0.2779564 0.7362121
0.8460300 0.0000007 0.8067303
0.9095824 0.0000007 0.8735397
0.9722882 0.0000007 0.9383716
1.0000000 0.0000007 1.0000000
0.0000007 0.6444844 0.0000007
0.0000007 0.6444844 0.0000007
0.0000007 0.6444509 0.0000007
0.0000007 0.6443717 0.0000007
0.0000007 0.6441891 0.0000007
0.0000007 0.6438056 0.0000007
0.0000007 0.6430575 0.0000007
0.0000007 0.6416460 0.0000007
0.2563538 0.6390222 0.0000007
0.5222545 0.6341599 0.0000007
0.6249967 0.6249967 0.3749991
0.7050996 0.6067191 0.6135747
0.7764121 0.5645393 0.7165195
0.8434600 0.3629554 0.7968307
0.9081797 0.0000007 0.8683245
0.9715251 0.0000007 0.9355820
1.0000000 0.0000007 1.0000000
0.0000007 0.7072830 0.0000007
0.0000007 0.7072830 0.0000007
0.0000007 0.7072696 0.0000007
0.0000007 0.7072229 0.0000007
0.0000007 0.7071161 0.0000007
0.0000007 0.7069025 0.0000007
0.0000007 0.7064822 0.0000007
0.0000007 0.7056890 0.0000007
0.0000007 0.7042248 0.0000007
0.3456213 0.7015604 0.0000007
0.5849317 0.6966758 0.0000007
0.6875004 0.6875004 0.3749991
0.7675710 0.6692214 0.6699330
0.8387775 0.6268995 0.7768405
0.9056577 0.4260822 0.8584749
0.9701605 0.0000007 0.9304912
1.0000000 0.0000007 0.9979625
0.0000007 0.7699198 0.0000007
0.0000007 0.7699162 0.0000007
0.0000007 0.7699089 0.0000007
0.0000007 0.7698835 0.0000007
0.0000007 0.7698254 0.0000007
0.0000007 0.7697020 0.0000007
0.0000007 0.7694662 0.0000007
0.0000007 0.7690164 0.0000007
0.0000007 0.7681937 0.0000007
0.0000007 0.7667137 0.0000007
0.4180890 0.7640429 0.0000007
0.6474362 0.7591621 0.0000007
0.7500018 0.7499983 0.3750009
0.8300054 0.7316587 0.7291774
0.9010627 0.6887156 0.8385642
0.9677143 0.4733994 0.9208723
1.0000000 0.0000007 0.9930966
0.0000007 0.8323977 0.0000007
0.0000007 0.8323977 0.0000007
0.0000007 0.8323938 0.0000007
0.0000007 0.8323820 0.0000007
0.0000007 0.8323467 0.0000007
0.0000007 0.8322762 0.0000007
0.0000007 0.8321429 0.0000007
0.0000007 0.8318921 0.0000007
0.0000007 0.8314337 0.0000007
0.0000007 0.8306077 0.0000007
0.0000007 0.8291301 0.0000007
0.4824975 0.8264745 0.0000007
0.7097778 0.8216335 0.0000007
0.8124985 0.8124985 0.3749991
0.8924159 0.7940378 0.7906765
0.9632612 0.7500196 0.9013425
1.0000000 0.4970545 0.9838605
0.0000007 0.8947541 0.0000007
0.0000007 0.8947541 0.0000007
0.0000007 0.8947499 0.0000007
0.0000007 0.8947330 0.0000007
0.0000007 0.8947162 0.0000007
0.0000007 0.8946783 0.0000007
0.0000007 0.8946067 0.0000007
0.0000007 0.8944678 0.0000007
0.0000007 0.8942111 0.0000007
0.0000007 0.8937567 0.0000007
0.0000007 0.8929327 0.0000007
0.0000007 0.8914798 0.0000007
0.5407208 0.8888614 0.0000007
0.7719408 0.8840924 0.0000007
0.8750090 0.8750008 0.3750027
0.9547704 0.8563876 0.8539112
1.0000000 0.8107393 0.9649747
0.0000007 0.9569592 0.0000007
0.0000007 0.9569502 0.0000007
0.0000007 0.9569502 0.0000007
0.0000007 0.9569502 0.0000007
0.0000007 0.9569322 0.0000007
0.0000007 0.9569188 0.0000007
0.0000007 0.9568782 0.0000007
0.0000007 0.9568018 0.0000007
0.0000007 0.9566623 0.0000007
0.0000007 0.9564105 0.0000007
0.0000007 0.9559563 0.0000007
0.0000007 0.9551700 0.0000007
0.0000007 0.9537563 0.0000007
0.5926394 0.9512122 0.0000007
0.8339714 0.9465226 0.0000007
0.9374982 0.9374982 0.3750027
1.0000000 0.9186482 0.9186353
0.0000007 1.0000000 0.0000007
0.0000007 1.0000000 0.0000007
0.0000007 1.0000000 0.0000007
0.0000007 1.0000000 0.0000007
0.0000007 1.0000000 0.0000007
0.0000007 1.0000000 0.0000007
0.0000007 1.0000000 0.0000007
0.0000007 1.0000000 0.0000007
0.0000007 1.0000000 0.0000007
0.0000007 1.0000000 0.0000007
0.0000007 1.0000000 0.0000007
0.0000007 1.0000000 0.0000007
0.0000007 1.0000000 0.0000007
0.0000007 1.0000000 0.0000007
0.6355943 1.0000000 0.0000007
0.8958032 1.0000000 0.0000007
1.0000000 1.0000000 0.3750277
0.0001165 0.0001165 0.4374969
0.0718908 0.0000007 0.4377027
0.1407264 0.0000007 0.4386911
0.2081351 0.0000007 0.4414181
0.2745637 0.0000007 0.4474340
0.3402386 0.0000007 0.4588968
0.4053014 0.0000007 0.4781753
0.4698461 0.0000007 0.5069112
0.5339330 0.0000007 0.5451667
0.5976252 0.0000007 0.5915050
0.6609555 0.0000007 0.6438056
0.7239629 0.0000007 0.7000948
0.7866691 0.0000007 0.7588937
0.8491035 0.0000007 0.8192061
0.9112872 0.0000007 0.8804214
0.9732211 0.0000007 0.9421348
1.0000000 0.0000007 1.0000000
0.0000007 0.0674726 0.4372934
0.0624997 0.0625006 0.4374969
0.1383231 0.0086581 0.4384932
0.2072072 0.0000007 0.4412232
0.2741456 0.0000007 0.4472493
0.3400328 0.0000007 0.4587291
0.4051973 0.0000007 0.4780370
0.4697859 0.0000007 0.5068031
0.5339002 0.0000007 0.5450892
0.5976082 0.0000007 0.5914574
0.6609462 0.0000007 0.6437752
0.7239595 0.0000007 0.7000816
0.7866691 0.0000007 0.7588829
0.8491035 0.0000007 0.8191984
0.9112872 0.0000007 0.8804131
0.9732211 0.0000007 0.9421304
1.0000000 0.0000007 1.0000000
0.0000007 0.1333793 0.4362935
0.0000007 0.1320369 0.4364987
0.1250004 0.1249998 0.4374969
0.2024936 0.0990892 0.4402563
0.2720606 0.0000007 0.4463392
0.3390138 0.0000007 0.4579112
0.4046661 0.0000007 0.4773549
0.4695007 0.0000007 0.5062796
0.5337459 0.0000007 0.5447280
0.5975178 0.0000007 0.5912168
0.6608993 0.0000007 0.6436261
0.7239321 0.0000007 0.6999891
0.7866505 0.0000007 0.7588292
0.8490914 0.0000007 0.8191714
0.9112787 0.0000007 0.8803965
0.9732211 0.0000007 0.9421215
1.0000000 0.0000007 1.0000000
0.0000007 0.1985382 0.4334269
0.0000007 0.1980122 0.4336369
0.0423776 0.1953852 0.4346637
0.1875007 0.1875007 0.4374969
0.2659399 0.1653642 0.4437360
0.3360979 0.0298736 0.4555850
0.4031779 0.0000007 0.4754249
0.4687038 0.0000007 0.5048106
0.5333037 0.0000007 0.5436971
0.5972747 0.0000007 0.5905460
0.6607589 0.0000007 0.6432095
0.7238570 0.0000007 0.6997380
0.7866098 0.0000007 0.7586861
0.8490714 0.0000007 0.8190826
0.9112701 0.0000007 0.8803468
0.9732119 0.0000007 0.9420949
1.0000000 0.0000007 1.0000000
0.0000007 0.2631797 0.4265176
0.0000007 0.2629395 0.4267406
0.0000007 0.2617582 0.4278407
0.1329523 0.2583594 0.4308693
0.2500004 0.2500015 0.4374969
0.3290423 0.2295101 0.4500373
0.3996531 0.1622194 0.4708436
0.4668416 0.0000007 0.5013525
0.5322915 0.0000007 0.5412973
0.5967128 0.0000007 0.5889834
0.6604437 0.0000007 0.6422436
0.7236726 0.0000007 0.6991602
0.7865059 0.0000007 0.7583498
0.8490115 0.0000007 0.8188897
0.9112358 0.0000007 0.8802350
0.9731982 0.0000007 0.9420373
1.0000000 0.0000007 1.0000000
0.0000007 0.3274168 0.4105325
0.0000007 0.3272982 0.4108038
0.0000007 0.3267153 0.4120807
0.0000007 0.3250640 0.4155952
0.2023286 0.3211561 0.4232477
0.3124999 0.3124999 0.4374969
0.3919464 0.2929149 0.4606730
0.4628842 0.2383350 0.4938034
0.5301600 0.0000007 0.5361406
0.5955341 0.0000007 0.5856794
0.6597794 0.0000007 0.6402162
0.7233039 0.0000007 0.6979564
0.7863020 0.0000007 0.7576420
0.8488916 0.0000007 0.8184847
0.9111715 0.0000007 0.8800154
0.9731570 0.0000007 0.9419089
1.0000000 0.0000007 1.0000000
0.0000007 0.3913299 0.3696220
0.0000007 0.3912704 0.3700180
0.0000007 0.3909672 0.3719335
0.0000007 0.3901110 0.3771141
0.0000007 0.3881105 0.3880920
0.2681066 0.3838566 0.4076450
0.3749991 0.3750027 0.4374969
0.4547165 0.3559716 0.4773776
0.5258848 0.3073042 0.5253345
0.5932060 0.0000007 0.5789426
0.6584871 0.0000007 0.6361594
0.7225738 0.0000007 0.6955683
0.7858908 0.0000007 0.7562605
0.8486637 0.0000007 0.8176984
0.9110472 0.0000007 0.8795723
0.9730930 0.0000007 0.9416697
1.0000000 0.0000007 1.0000000
0.0000007 0.4549583 0.0000007
0.0000007 0.4549238 0.0000007
0.0000007 0.4547619 0.0000007
0.0000007 0.4543001 0.0991804
0.0000007 0.4532361 0.2254407
0.0000007 0.4509955 0.3030284
0.3324866 0.4464898 0.3718751
0.4375011 0.4375011 0.4374969
0.5173995 0.4188147 0.5016688
0.5887104 0.3734072 0.5651088
0.6560246 0.0000007 0.6281454
0.7212078 0.0000007 0.6909598
0.7851205 0.0000007 0.7536293
0.8482362 0.0000007 0.8162088
0.9108029 0.0000007 0.8787322
0.9729558 0.0000007 0.9412004
1.0000000 0.0000007 1.0000000
0.0000007 0.5183418 0.0000007
0.0000007 0.5183247 0.0000007
0.0000007 0.5182338 0.0000007
0.0000007 0.5179784 0.0000007
0.0000007 0.5173970 0.0000007
0.0000007 0.5161725 0.0000007
0.0000007 0.5137491 0.0000007
0.3961305 0.5090759 0.2197675
0.4999996 0.4999972 0.4375011
0.5800230 0.4815372 0.5342771
0.6513917 0.4379958 0.6118681
0.7186598 0.0000007 0.6820390
0.7837080 0.0000007 0.7486659
0.8474496 0.0000007 0.8134407
0.9103745 0.0000007 0.8771948
0.9727225 0.0000007 0.9403597
1.0000000 0.0000007 1.0000000
0.0000007 0.5815125 0.0000007
0.0000007 0.5815042 0.0000007
0.0000007 0.5814547 0.0000007
0.0000007 0.5813144 0.0000007
0.0000007 0.5809817 0.0000007
0.0000007 0.5803058 0.0000007
0.0000007 0.5789700 0.0000007
0.0000007 0.5764248 0.0000007
0.4593347 0.5716353 0.0000007
0.5625013 0.5625013 0.4374969
0.6425776 0.5441685 0.5748829
0.7139608 0.5016212 0.6640100
0.7811298 0.2779564 0.7391807
0.8460300 0.0000007 0.8083018
0.9095824 0.0000007 0.8743914
0.9722973 0.0000007 0.9388307
1.0000000 0.0000007 1.0000000
0.0000007 0.6444844 0.0000007
0.0000007 0.6444844 0.0000007
0.0000007 0.6444509 0.0000007
0.0000007 0.6443717 0.0000007
0.0000007 0.6441891 0.0000007
0.0000007 0.6438056 0.0000007
0.0000007 0.6430575 0.0000007
0.0000007 0.6416460 0.0000007
0.2563514 0.6390222 0.0000007
0.5222545 0.6341599 0.0000007
0.6249967 0.6249967 0.4374969
0.7050996 0.6067191 0.6223783
0.7764121 0.5645393 0.7200652
0.8434600 0.3629536 0.7985526
0.9081797 0.0000007 0.8692202
0.9715251 0.0000007 0.9360574
1.0000000 0.0000007 1.0000000
0.0000007 0.7072830 0.0000007
0.0000007 0.7072830 0.0000007
0.0000007 0.7072696 0.0000007
0.0000007 0.7072229 0.0000007
0.0000007 0.7071161 0.0000007
0.0000007 0.7069025 0.0000007
0.0000007 0.7064822 0.0000007
0.0000007 0.7056823 0.0000007
0.0000007 0.7042248 0.0000007
0.3456180 0.7015604 0.0000007
0.5849317 0.6966758 0.0000007
0.6875004 0.6875004 0.4374969
0.7675710 0.6692214 0.6752955
0.8387775 0.6268995 0.7789052
0.9056577 0.4260822 0.8594536
0.9701605 0.0000007 0.9309859
1.0000000 0.0000007 0.9982158
0.0000007 0.7699198 0.0000007
0.0000007 0.7699198 0.0000007
0.0000007 0.7699089 0.0000007
0.0000007 0.7698835 0.0000007
0.0000007 0.7698254 0.0000007
0.0000007 0.7697020 0.0000007
0.0000007 0.7694662 0.0000007
0.0000007 0.7690164 0.0000007
0.0000007 0.7681937 0.0000007
0.0000007 0.7667137 0.0000007
0.4180890 0.7640429 0.0000007
0.6474362 0.7591621 0.0000007
0.7499983 0.7499983 0.4375011
0.8300093 0.7316552 0.7323495
0.9010627 0.6887156 0.8397381
0.9677143 0.4733994 0.9214097
1.0000000 0.0000007 0.9933581
0.0000007 0.8323977 0.0000007
0.0000007 0.8323977 0.0000007
0.0000007 0.8323938 0.0000007
0.0000007 0.8323820 0.0000007
0.0000007 0.8323467 0.0000007
0.0000007 0.8322762 0.0000007
0.0000007 0.8321429 0.0000007
0.0000007 0.8318921 0.0000007
0.0000007 0.8314337 0.0000007
0.0000007 0.8306077 0.0000007
0.0000007 0.8291301 0.0000007
0.4824975 0.8264745 0.0000007
0.7097745 0.8216335 0.0000007
0.8124946 0.8124985 0.4374969
0.8924159 0.7940340 0.7924973
0.9632612 0.7500196 0.9019917
1.0000000 0.4970498 0.9841518
0.0000007 0.8947541 0.0000007
0.0000007 0.8947541 0.0000007
0.0000007 0.8947499 0.0000007
0.0000007 0.8947330 0.0000007
0.0000007 0.8947162 0.0000007
0.0000007 0.8946783 0.0000007
0.0000007 0.8946067 0.0000007
0.0000007 0.8944678 0.0000007
0.0000007 0.8942111 0.0000007
0.0000007 0.8937567 0.0000007
0.0000007 0.8929327 0.0000007
0.0000007 0.8914798 0.0000007
0.5407157 0.8888614 0.0000007
0.7719408 0.8840924 0.0000007
0.8750090 0.8750008 0.4374969
0.9547704 0.8563795 0.8549250
1.0000000 0.8107393 0.9653332
0.0000007 0.9569592 0.0000007
0.0000007 0.9569592 0.0000007
0.0000007 0.9569502 0.0000007
0.0000007 0.9569502 0.0000007
0.0000007 0.9569412 0.0000007
0.0000007 0.9569188 0.0000007
0.0000007 0.9568782 0.0000007
0.0000007 0.9568018 0.0000007
0.0000007 0.9566623 0.0000007
0.0000007 0.9564059 0.0000007
0.0000007 0.9559563 0.0000007
0.0000007 0.9551700 0.0000007
0.0000007 0.9537563 0.0000007
0.5926338 0.9512122 0.0000007
0.8339714 0.9465226 0.0000007
0.9374982 0.9374982 0.4375011
1.0000000 0.9186482 0.9191930
0.0000007 1.0000000 0.0000007
0.0000007 1.0000000 0.0000007
0.0000007 1.0000000 0.0000007
0.0000007 1.0000000 0.0000007
0.0000007 1.0000000 0.0000007
0.0000007 1.0000000 0.0000007
0.0000007 1.0000000 0.0000007
0.0000007 1.0000000 0.0000007
0.0000007 1.0000000 0.0000007
0.0000007 1.0000000 0.0000007
0.0000007 1.0000000 0.0000007
0.0000007 1.0000000 0.0000007
0.0000007 1.0000000 0.0000007
0.0000007 1.0000000 0.0000007
0.6355943 1.0000000 0.0000007
0.8958032 1.0000000 0.0000007
1.0000000 1.0000000 0.4375156
0.0000007 0.0001694 0.4999972
0.0718894 0.0000007 0.5001110
0.1407264 0.0000007 0.5006590
0.2081351 0.0000007 0.5021899
0.2745650 0.0000007 0.5056225
0.3402386 0.0000007 0.5124068
0.4053014 0.0000007 0.5245112
0.4698461 0.0000007 0.5440499
0.5339330 0.0000007 0.5725532
0.5976252 0.0000007 0.6102038
0.6609555 0.0000007 0.6558108
0.7239629 0.0000007 0.7074633
0.7866691 0.0000007 0.7632687
0.8491035 0.0000007 0.8217419
0.9112872 0.0000007 0.8818564
0.9732211 0.0000007 0.9429371
1.0000000 0.0000007 1.0000000
0.0000007 0.0674730 0.4998834
0.0624991 0.0625009 0.4999972
0.1383231 0.0086645 0.5005498
0.2072072 0.0000007 0.5020780
0.2741456 0.0000007 0.5055147
0.3400312 0.0000007 0.5123097
0.4051973 0.0000007 0.5244218
0.4697859 0.0000007 0.5439778
0.5339002 0.0000007 0.5724963
0.5976082 0.0000007 0.6101634
0.6609462 0.0000007 0.6557829
0.7239595 0.0000007 0.7074499
0.7866691 0.0000007 0.7632579
0.8490995 0.0000007 0.8217341
0.9112872 0.0000007 0.8818564
0.9732211 0.0000007 0.9429371
1.0000000 0.0000007 1.0000000
0.0000007 0.1333793 0.4993315
0.0000007 0.1320369 0.4994476
0.1249992 0.1249992 0.4999972
0.2024936 0.0990902 0.5015380
0.2720606 0.0000007 0.5049925
0.3390138 0.0000007 0.5118170
0.4046661 0.0000007 0.5239797
0.4695007 0.0000007 0.5436069
0.5337459 0.0000007 0.5722145
0.5975178 0.0000007 0.6099643
0.6608993 0.0000007 0.6556528
0.7239287 0.0000007 0.7073631
0.7866505 0.0000007 0.7632111
0.8490914 0.0000007 0.8217032
0.9112787 0.0000007 0.8818399
0.9732211 0.0000007 0.9429283
1.0000000 0.0000007 1.0000000
0.0000007 0.1985382 0.4977621
0.0000007 0.1980122 0.4978754
0.0423751 0.1953861 0.4984351
0.1875007 0.1874998 0.4999972
0.2659411 0.1653650 0.5035009
0.3360979 0.0298744 0.5104168
0.4031703 0.0000007 0.5227299
0.4686994 0.0000007 0.5425678
0.5333037 0.0000007 0.5714135
0.5972747 0.0000007 0.6093992
0.6607589 0.0000007 0.6552719
0.7238570 0.0000007 0.7071294
0.7866098 0.0000007 0.7630672
0.8490714 0.0000007 0.8216258
0.9112701 0.0000007 0.8817900
0.9732119 0.0000007 0.9429017
1.0000000 0.0000007 1.0000000
0.0000007 0.2631797 0.4940587
0.0000007 0.2629395 0.4941806
0.0000007 0.2617582 0.4947597
0.1329530 0.2583594 0.4963786
0.2500015 0.2500004 0.4999972
0.3290423 0.2295101 0.5071347
0.3996531 0.1622202 0.5198079
0.4668416 0.0000007 0.5401372
0.5322915 0.0000007 0.5695531
0.5967128 0.0000007 0.6080836
0.6604437 0.0000007 0.6544118
0.7236726 0.0000007 0.7065923
0.7865059 0.0000007 0.7627434
0.8490115 0.0000007 0.8214361
0.9112358 0.0000007 0.8816780
0.9731982 0.0000007 0.9428396
1.0000000 0.0000007 1.0000000
0.0000007 0.3274168 0.4859585
0.0000007 0.3272982 0.4860899
0.0000007 0.3267153 0.4867173
0.0000007 0.3250640 0.4884585
0.2023286 0.3211561 0.4923492
0.3124999 0.3124999 0.4999972
0.3919464 0.2929149 0.5134887
0.4628842 0.2383338 0.5349280
0.5301600 0.0000007 0.5655959
0.5955312 0.0000007 0.6053119
0.6597794 0.0000007 0.6525962
0.7233039 0.0000007 0.7054625
0.7863020 0.0000007 0.7620711
0.8488916 0.0000007 0.8210415
0.9111715 0.0000007 0.8814539
0.9731570 0.0000007 0.9427154
1.0000000 0.0000007 1.0000000
0.0000007 0.3913299 0.4681682
0.0000007 0.3912704 0.4683192
0.0000007 0.3909672 0.4690642
0.0000007 0.3901110 0.4711095
0.0000007 0.3881105 0.4756776
0.2681079 0.3838566 0.4845638
0.3749991 0.3749991 0.4999972
0.4547165 0.3559716 0.5239921
0.5258798 0.3073057 0.5574486
0.5932060 0.0000007 0.5997037
0.6584871 0.0000007 0.6489800
0.7225738 0.0000007 0.7032349
0.7858908 0.0000007 0.7607462
0.8486637 0.0000007 0.8202721
0.9110472 0.0000007 0.8810267
0.9730839 0.0000007 0.9424672
1.0000000 0.0000007 1.0000000
0.0000007 0.4549583 0.4237466
0.0000007 0.4549238 0.4239782
0.0000007 0.4547619 0.4251097
0.0000007 0.4543001 0.4282128
0.0000007 0.4532361 0.4350107
0.0000007 0.4509955 0.4478293
0.3324866 0.4464855 0.4690375
0.4375011 0.4374969 0.4999972
0.5173995 0.4188227 0.5403599
0.5887104 0.3734108 0.5883846
0.6560246 0.0000007 0.6418734
0.7212078 0.0000007 0.6989390
0.7851205 0.0000007 0.7582175
0.8482362 0.0000007 0.8188164
0.9108029 0.0000007 0.8801976
0.9729558 0.0000007 0.9420108
1.0000000 0.0000007 1.0000000
0.0000007 0.5183418 0.0000007
0.0000007 0.5183222 0.0000007
0.0000007 0.5182313 0.0000007
0.0000007 0.5179784 0.0000007
0.0000007 0.5173970 0.1897679
0.0000007 0.5161725 0.2903645
0.0000007 0.5137540 0.3659165
0.3961305 0.5090759 0.4344161
0.4999972 0.4999972 0.4999972
0.5800230 0.4815372 0.5641840
0.6513917 0.4379937 0.6276230
0.7186598 0.0000007 0.6906629
0.7837080 0.0000007 0.7534623
0.8474496 0.0000007 0.8161165
0.9103745 0.0000007 0.8786826
0.9727225 0.0000007 0.9411694
1.0000000 0.0000007 1.0000000
0.0000007 0.5815125 0.0000007
0.0000007 0.5815042 0.0000007
0.0000007 0.5814520 0.0000007
0.0000007 0.5813144 0.0000007
0.0000007 0.5809872 0.0000007
0.0000007 0.5803058 0.0000007
0.0000007 0.5789700 0.0000007
0.0000007 0.5764248 0.0000007
0.4593347 0.5716353 0.3090713
0.5625013 0.5625013 0.4999972
0.6425776 0.5441685 0.5963572
0.7139608 0.5016212 0.6740974
0.7811298 0.2779564 0.7444015
0.8460300 0.0000007 0.8111061
0.9095824 0.0000007 0.8759033
0.9722973 0.0000007 0.9396523
1.0000000 0.0000007 1.0000000
0.0000007 0.6444844 0.0000007
0.0000007 0.6444844 0.0000007
0.0000007 0.6444509 0.0000007
0.0000007 0.6443717 0.0000007
0.0000007 0.6441891 0.0000007
0.0000007 0.6438056 0.0000007
0.0000007 0.6430575 0.0000007
0.0000007 0.6416460 0.0000007
0.2563538 0.6390222 0.0000007
0.5222496 0.6341659 0.0000007
0.6249967 0.6249967 0.4999972
0.7050996 0.6067191 0.6367881
0.7764121 0.5645393 0.7262485
0.8434600 0.3629536 0.8016180
0.9081882 0.0000007 0.8708217
0.9715251 0.0000007 0.9369075
1.0000000 0.0000007 1.0000000
0.0000007 0.7072830 0.0000007
0.0000007 0.7072830 0.0000007
0.0000007 0.7072696 0.0000007
0.0000007 0.7072229 0.0000007
0.0000007 0.7071161 0.0000007
0.0000007 0.7069025 0.0000007
0.0000007 0.7064822 0.0000007
0.0000007 0.7056823 0.0000007
0.0000007 0.7042248 0.0000007
0.3456196 0.7015604 0.0000007
0.5849317 0.6966758 0.0000007
0.6875004 0.6875004 0.4999972
0.7675710 0.6692214 0.6844426
0.8387775 0.6268995 0.7825599
0.9056577 0.4260822 0.8612077
0.9701696 0.0000007 0.9318841
1.0000000 0.0000007 0.9986850
0.0000007 0.7699198 0.0000007
0.0000007 0.7699198 0.0000007
0.0000007 0.7699089 0.0000007
0.0000007 0.7698835 0.0000007
0.0000007 0.7698254 0.0000007
0.0000007 0.7697020 0.0000007
0.0000007 0.7694662 0.0000007
0.0000007 0.7690127 0.0000007
0.0000007 0.7681937 0.0000007
0.0000007 0.7667137 0.0000007
0.4180890 0.7640429 0.0000007
0.6474362 0.7591621 0.0000007
0.7499983 0.7499983 0.4999972
0.8300054 0.7316587 0.7378951
0.9010627 0.6887156 0.8418408
0.9677143 0.4733994 0.9223941
1.0000000 0.0000007 0.9938437
0.0000007 0.8323977 0.0000007
0.0000007 0.8323977 0.0000007
0.0000007 0.8323938 0.0000007
0.0000007 0.8323820 0.0000007
0.0000007 0.8323467 0.0000007
0.0000007 0.8322762 0.0000007
0.0000007 0.8321429 0.0000007
0.0000007 0.8318921 0.0000007
0.0000007 0.8314337 0.0000007
0.0000007 0.8306077 0.0000007
0.0000007 0.8291301 0.0000007
0.4824929 0.8264745 0.0000007
0.7097745 0.8216335 0.0000007
0.8124946 0.8124985 0.4999972
0.8924159 0.7940378 0.7957274
0.9632612 0.7500196 0.9031724
1.0000000 0.4970498 0.9846793
0.0000007 0.8947541 0.0000007
0.0000007 0.8947456 0.0000007
0.0000007 0.8947499 0.0000007
0.0000007 0.8947330 0.0000007
0.0000007 0.8947162 0.0000007
0.0000007 0.8946699 0.0000007
0.0000007 0.8946067 0.0000007
0.0000007 0.8944594 0.0000007
0.0000007 0.8942111 0.0000007
0.0000007 0.8937567 0.0000007
0.0000007 0.8929327 0.0000007
0.0000007 0.8914798 0.0000007
0.5407157 0.8888698 0.0000007
0.7719408 0.8840924 0.0000007
0.8750090 0.8750008 0.4999972
0.9547704 0.8563795 0.8567587
1.0000000 0.8107393 0.9659778
0.0000007 0.9569592 0.0000007
0.0000007 0.9569592 0.0000007
0.0000007 0.9569502 0.0000007
0.0000007 0.9569502 0.0000007
0.0000007 0.9569412 0.0000007
0.0000007 0.9569188 0.0000007
0.0000007 0.9568782 0.0000007
0.0000007 0.9568018 0.0000007
0.0000007 0.9566623 0.0000007
0.0000007 0.9564105 0.0000007
0.0000007 0.9559563 0.0000007
0.0000007 0.9551700 0.0000007
0.0000007 0.9537563 0.0000007
0.5926394 0.9512122 0.0000007
0.8339714 0.9465226 0.0000007
0.9374982 0.9374982 0.4999972
1.0000000 0.9186482 0.9201838
0.0000007 1.0000000 0.0000007
0.0000007 1.0000000 0.0000007
0.0000007 1.0000000 0.0000007
0.0000007 1.0000000 0.0000007
0.0000007 1.0000000 0.0000007
0.0000007 1.0000000 0.0000007
0.0000007 1.0000000 0.0000007
0.0000007 1.0000000 0.0000007
0.0000007 1.0000000 0.0000007
0.0000007 1.0000000 0.0000007
0.0000007 1.0000000 0.0000007
0.0000007 1.0000000 0.0000007
0.0000007 1.0000000 0.0000007
0.0000007 1.0000000 0.0000007
0.6355943 1.0000000 0.0000007
0.8957947 1.0000000 0.0000007
1.0000000 1.0000000 0.4999996
0.0000007 0.0001694 0.5625013
0.0718898 0.0000007 0.5625599
0.1407251 0.0000007 0.5628742
0.2081351 0.0000007 0.5637382
0.2745650 0.0000007 0.5657003
0.3402402 0.0000007 0.5696555
0.4053014 0.0000007 0.5769652
0.4698461 0.0000007 0.5894601
0.5339330 0.0000007 0.6091025
0.5976252 0.0000007 0.6373602
0.6609555 0.0000007 0.6745051
0.7239629 0.0000007 0.7195387
0.7866691 0.0000007 0.7706971
0.8491035 0.0000007 0.8261397
0.9112872 0.0000007 0.8843921
0.9732211 0.0000007 0.9443573
1.0000000 0.0000007 1.0000000
0.0000007 0.0674726 0.5624374
0.0624991 0.0625000 0.5625013
0.1383231 0.0086696 0.5628076
0.2072072 0.0000007 0.5636742
0.2741443 0.0000007 0.5656360
0.3400328 0.0000007 0.5695935
0.4051935 0.0000007 0.5769133
0.4697859 0.0000007 0.5894127
0.5338976 0.0000007 0.6090621
0.5976082 0.0000007 0.6373271
0.6609462 0.0000007 0.6744795
0.7239595 0.0000007 0.7195251
0.7866691 0.0000007 0.7706861
0.8491035 0.0000007 0.8261358
0.9112872 0.0000007 0.8843837
0.9732211 0.0000007 0.9443573
1.0000000 0.0000007 1.0000000
0.0000007 0.1333793 0.5621260
0.0000007 0.1320369 0.5621899
0.1249998 0.1249998 0.5625013
0.2024936 0.0990892 0.5633674
0.2720606 0.0000007 0.5653335
0.3390138 0.0000007 0.5693024
0.4046661 0.0000007 0.5766376
0.4695007 0.0000007 0.5891674
0.5337459 0.0000007 0.6088577
0.5975178 0.0000007 0.6371704
0.6608993 0.0000007 0.6743649
0.7239321 0.0000007 0.7194470
0.7866505 0.0000007 0.7706353
0.8490914 0.0000007 0.8261086
0.9112787 0.0000007 0.8843671
0.9732211 0.0000007 0.9443439
1.0000000 0.0000007 1.0000000
0.0000007 0.1985382 0.5612485
0.0000007 0.1980122 0.5613123
0.0423726 0.1953861 0.5616259
0.1875007 0.1874998 0.5625013
0.2659411 0.1653658 0.5644805
0.3360979 0.0298765 0.5684839
0.4031703 0.0000007 0.5758740
0.4687038 0.0000007 0.5884848
0.5333037 0.0000007 0.6082850
0.5972747 0.0000007 0.6367219
0.6607589 0.0000007 0.6740528
0.7238570 0.0000007 0.7192366
0.7866098 0.0000007 0.7705081
0.8490714 0.0000007 0.8260269
0.9112701 0.0000007 0.8843213
0.9732119 0.0000007 0.9443173
1.0000000 0.0000007 1.0000000
0.0000007 0.2631797 0.5592063
0.0000007 0.2629395 0.5592698
0.0000007 0.2617582 0.5595903
0.1329523 0.2583594 0.5604812
0.2500004 0.2500004 0.5625013
0.3290423 0.2295101 0.5665712
0.3996531 0.1622194 0.5740889
0.4668416 0.0000007 0.5868944
0.5322915 0.0000007 0.6069602
0.5967128 0.0000007 0.6357055
0.6604437 0.0000007 0.6733210
0.7236726 0.0000007 0.7187513
0.7865059 0.0000007 0.7702030
0.8490115 0.0000007 0.8258479
0.9112358 0.0000007 0.8842173
0.9731982 0.0000007 0.9442596
1.0000000 0.0000007 1.0000000
0.0000007 0.3274168 0.5548470
0.0000007 0.3272982 0.5549127
0.0000007 0.3267153 0.5552491
0.0000007 0.3250640 0.5561726
0.2023286 0.3211561 0.5582752
0.3124999 0.3124999 0.5625013
0.3919464 0.2929149 0.5702896
0.4628842 0.2383350 0.5835246
0.5301600 0.0000007 0.6041592
0.5955341 0.0000007 0.6335517
0.6597794 0.0000007 0.6717930
0.7233039 0.0000007 0.7177413
0.7863020 0.0000007 0.7695714
0.8488916 0.0000007 0.8254667
0.9111715 0.0000007 0.8840008
0.9731570 0.0000007 0.9441397
1.0000000 0.0000007 1.0000000
0.0000007 0.3913299 0.5458229
0.0000007 0.3912704 0.5458978
0.0000007 0.3909635 0.5462573
0.0000007 0.3901073 0.5472645
0.0000007 0.3881105 0.5495394
0.2681066 0.3838566 0.5541120
0.3749991 0.3750027 0.5625013
0.4547209 0.3559716 0.5766485
0.5258848 0.3073042 0.5984965
0.5932060 0.0000007 0.6292361
0.6584871 0.0000007 0.6687601
0.7225738 0.0000007 0.7157523
0.7858908 0.0000007 0.7683350
0.8486637 0.0000007 0.8247282
0.9110472 0.0000007 0.8835766
0.9730930 0.0000007 0.9438999
1.0000000 0.0000007 1.0000000
0.0000007 0.4549562 0.5266278
0.0000007 0.4549238 0.5267177
0.0000007 0.4547619 0.5271446
0.0000007 0.4543001 0.5283447
0.0000007 0.4532361 0.5310473
0.0000007 0.4509955 0.5364454
0.3324866 0.4464898 0.5462443
0.4375011 0.4375011 0.5625013
0.5173995 0.4188227 0.5870388
0.5887104 0.3734072 0.6206828
0.6560246 0.0000007 0.6628504
0.7212078 0.0000007 0.7119284
0.7851205 0.0000007 0.7659801
0.8482362 0.0000007 0.8233345
0.9108029 0.0000007 0.8827701
0.9729558 0.0000007 0.9434517
1.0000000 0.0000007 1.0000000
0.0000007 0.5183418 0.4793972
0.0000007 0.5183247 0.4795360
0.0000007 0.5182338 0.4801984
0.0000007 0.5179784 0.4820468
0.0000007 0.5173970 0.4861775
0.0000007 0.5161725 0.4942626
0.0000007 0.5137491 0.5084441
0.3961343 0.5090759 0.5308084
0.4999972 0.4999972 0.5625013
0.5800230 0.4815372 0.6031657
0.6513917 0.4379958 0.6512070
0.7186598 0.0000007 0.7046005
0.7837080 0.0000007 0.7615573
0.8474496 0.0000007 0.8207398
0.9103745 0.0000007 0.8812921
0.9727225 0.0000007 0.9426224
1.0000000 0.0000007 1.0000000
0.0000007 0.5815125 0.0000007
0.0000007 0.5815042 0.0000007
0.0000007 0.5814520 0.0000007
0.0000007 0.5813144 0.0000007
0.0000007 0.5809817 0.0000007
0.0000007 0.5803058 0.2620136
0.0000007 0.5789700 0.3542638
0.0000007 0.5764248 0.4286605
0.4593347 0.5716353 0.4969414
0.5625013 0.5625013 0.5625013
0.6425776 0.5441685 0.6266891
0.7139608 0.5016212 0.6901381
0.7811298 0.2779564 0.7531603
0.8460300 0.0000007 0.8159435
0.9095824 0.0000007 0.8785874
0.9722973 0.0000007 0.9411163
1.0000000 0.0000007 1.0000000
0.0000007 0.6444844 0.0000007
0.0000007 0.6444844 0.0000007
0.0000007 0.6444509 0.0000007
0.0000007 0.6443717 0.0000007
0.0000007 0.6441891 0.0000007
0.0000007 0.6438056 0.0000007
0.0000007 0.6430575 0.0000007
0.0000007 0.6416460 0.0000007
0.2563526 0.6390222 0.0000007
0.5222496 0.6341659 0.3833493
0.6249967 0.6249967 0.5625013
0.7050996 0.6067191 0.6586676
0.7764121 0.5645393 0.7365143
0.8434600 0.3629519 0.8068900
0.9081882 0.0000007 0.8736261
0.9715251 0.0000007 0.9384113
1.0000000 0.0000007 1.0000000
0.0000007 0.7072830 0.0000007
0.0000007 0.7072830 0.0000007
0.0000007 0.7072696 0.0000007
0.0000007 0.7072229 0.0000007
0.0000007 0.7071161 0.0000007
0.0000007 0.7069025 0.0000007
0.0000007 0.7064822 0.0000007
0.0000007 0.7056890 0.0000007
0.0000007 0.7042248 0.0000007
0.3456196 0.7015604 0.0000007
0.5849317 0.6966758 0.0000007
0.6875004 0.6875004 0.5625013
0.7675710 0.6692214 0.6991403
0.8387775 0.6268995 0.7888153
0.9056577 0.4260802 0.8642785
0.9701696 0.0000007 0.9334634
1.0000000 0.0000007 0.9995114
0.0000007 0.7699198 0.0000007
0.0000007 0.7699162 0.0000007
0.0000007 0.7699089 0.0000007
0.0000007 0.7698835 0.0000007
0.0000007 0.7698254 0.0000007
0.0000007 0.7697020 0.0000007
0.0000007 0.7694625 0.0000007
0.0000007 0.7690164 0.0000007
0.0000007 0.7681937 0.0000007
0.0000007 0.7667137 0.0000007
0.4180890 0.7640429 0.0000007
0.6474362 0.7591621 0.0000007
0.7499983 0.7499983 0.5625013
0.8300093 0.7316587 0.7471701
0.9010627 0.6887156 0.8455042
0.9677143 0.4733994 0.9241270
1.0000000 0.0000007 0.9947175
0.0000007 0.8323977 0.0000007
0.0000007 0.8323977 0.0000007
0.0000007 0.8323938 0.0000007
0.0000007 0.8323820 0.0000007
0.0000007 0.8323467 0.0000007
0.0000007 0.8322762 0.0000007
0.0000007 0.8321429 0.0000007
0.0000007 0.8318921 0.0000007
0.0000007 0.8314337 0.0000007
0.0000007 0.8306077 0.0000007
0.0000007 0.8291301 0.0000007
0.4824952 0.8264745 0.0000007
0.7097745 0.8216335 0.0000007
0.8124946 0.8124985 0.5625013
0.8924159 0.7940378 0.8012933
0.9632612 0.7500196 0.9052487
1.0000000 0.4970498 0.9856379
0.0000007 0.8947541 0.0000007
0.0000007 0.8947456 0.0000007
0.0000007 0.8947499 0.0000007
0.0000007 0.8947330 0.0000007
0.0000007 0.8947162 0.0000007
0.0000007 0.8946699 0.0000007
0.0000007 0.8946067 0.0000007
0.0000007 0.8944678 0.0000007
0.0000007 0.8942111 0.0000007
0.0000007 0.8937567 0.0000007
0.0000007 0.8929327 0.0000007
0.0000007 0.8914798 0.0000007
0.5407208 0.8888614 0.0000007
0.7719408 0.8840924 0.0000007
0.8750090 0.8750008 0.5625013
0.9547704 0.8563795 0.8599516
1.0000000 0.8107393 0.9671139
0.0000007 0.9569592 0.0000007
0.0000007 0.9569502 0.0000007
0.0000007 0.9569502 0.0000007
0.0000007 0.9569502 0.0000007
0.0000007 0.9569412 0.0000007
0.0000007 0.9569188 0.0000007
0.0000007 0.9568782 0.0000007
0.0000007 0.9568018 0.0000007
0.0000007 0.9566623 0.0000007
0.0000007 0.9564105 0.0000007
0.0000007 0.9559563 0.0000007
0.0000007 0.9551700 0.0000007
0.0000007 0.9537563 0.0000007
0.5926338 0.9512122 0.0000007
0.8339714 0.9465226 0.0000007
0.9374982 0.9374982 0.5625013
1.0000000 0.9186482 0.9219559
0.0000007 1.0000000 0.0000007
0.0000007 1.0000000 0.0000007
0.0000007 1.0000000 0.0000007
0.0000007 1.0000000 0.0000007
0.0000007 1.0000000 0.0000007
0.0000007 1.0000000 0.0000007
0.0000007 1.0000000 0.0000007
0.0000007 1.0000000 0.0000007
0.0000007 1.0000000 0.0000007
0.0000007 1.0000000 0.0000007
0.0000007 1.0000000 0.0000007
0.0000007 1.0000000 0.0000007
0.0000007 1.0000000 0.0000007
0.0000007 1.0000000 0.0000007
0.6355973 1.0000000 0.0000007
0.8958032 1.0000000 0.0000007
1.0000000 1.0000000 0.5625066
0.0000007 0.0002490 0.6249967
0.0718898 0.0000007 0.6250322
0.1407264 0.0000007 0.6252065
0.2081351 0.0000007 0.6257004
0.2745650 0.0000007 0.6268224
0.3402386 0.0000007 0.6291052
0.4053014 0.0000007 0.6334290
0.4698416 0.0000007 0.6410791
0.5339330 0.0000007 0.6537783
0.5976252 0.0000007 0.6734101
0.6609555 0.0000007 0.7014015
0.7239629 0.0000007 0.7381283
0.7866691 0.0000007 0.7827149
0.8491035 0.0000007 0.8335198
0.9112872 0.0000007 0.8887317
0.9732211 0.0000007 0.9468342
1.0000000 0.0000007 1.0000000
0.0000007 0.0674749 0.6249642
0.0624979 0.0625031 0.6249967
0.1383218 0.0086797 0.6251740
0.2072072 0.0000007 0.6256707
0.2741443 0.0000007 0.6267839
0.3400328 0.0000007 0.6290725
0.4051935 0.0000007 0.6333930
0.4697859 0.0000007 0.6410458
0.5339002 0.0000007 0.6537566
0.5976082 0.0000007 0.6733878
0.6609462 0.0000007 0.7013816
0.7239595 0.0000007 0.7381179
0.7866691 0.0000007 0.7827112
0.8491035 0.0000007 0.8335081
0.9112872 0.0000007 0.8887317
0.9732211 0.0000007 0.9468253
1.0000000 0.0000007 1.0000000
0.0000007 0.1333786 0.6247870
0.0000007 0.1320375 0.6248224
0.1249992 0.1250004 0.6249967
0.2024917 0.0990911 0.6254904
0.2720606 0.0000007 0.6266121
0.3390138 0.0000007 0.6289001
0.4046699 0.0000007 0.6332344
0.4695007 0.0000007 0.6408944
0.5337459 0.0000007 0.6536207
0.5975178 0.0000007 0.6732733
0.6608993 0.0000007 0.7012956
0.7239321 0.0000007 0.7380552
0.7866505 0.0000007 0.7826669
0.8490914 0.0000007 0.8334845
0.9112787 0.0000007 0.8887108
0.9732211 0.0000007 0.9468164
1.0000000 0.0000007 1.0000000
0.0000007 0.1985392 0.6242939
0.0000007 0.1980122 0.6243322
0.0423745 0.1953861 0.6245035
0.1875007 0.1874998 0.6249967
0.2659399 0.1653658 0.6261294
0.3360979 0.0298849 0.6284275
0.4031779 0.0000007 0.6327736
0.4687038 0.0000007 0.6404674
0.5333037 0.0000007 0.6532410
0.5972747 0.0000007 0.6729586
0.6607589 0.0000007 0.7010506
0.7238570 0.0000007 0.7378742
0.7866098 0.0000007 0.7825525
0.8490714 0.0000007 0.8334138
0.9112701 0.0000007 0.8886731
0.9732119 0.0000007 0.9467897
1.0000000 0.0000007 1.0000000
0.0000007 0.2631797 0.6231439
0.0000007 0.2629408 0.6231852
0.0000007 0.2617582 0.6233619
0.1329523 0.2583594 0.6238602
0.2500015 0.2500004 0.6249967
0.3290423 0.2295101 0.6273234
0.3996531 0.1622202 0.6317097
0.4668416 0.0000007 0.6394753
0.5322915 0.0000007 0.6523588
0.5967128 0.0000007 0.6722184
0.6604437 0.0000007 0.7004783
0.7236726 0.0000007 0.7374670
0.7865059 0.0000007 0.7822759
0.8490115 0.0000007 0.8332411
0.9112358 0.0000007 0.8885644
0.9731982 0.0000007 0.9467318
1.0000000 0.0000007 1.0000000
0.0000007 0.3274168 0.6207327
0.0000007 0.3272982 0.6207709
0.0000007 0.3267153 0.6209499
0.0000007 0.3250640 0.6214581
0.2023286 0.3211561 0.6226285
0.3124999 0.3124999 0.6249967
0.3919464 0.2929149 0.6294801
0.4628842 0.2383338 0.6373994
0.5301600 0.0000007 0.6505089
0.5955312 0.0000007 0.6706802
0.6597794 0.0000007 0.6992888
0.7233039 0.0000007 0.7366186
0.7863020 0.0000007 0.7817156
0.8488916 0.0000007 0.8328879
0.9111715 0.0000007 0.8883511
0.9731570 0.0000007 0.9466116
1.0000000 0.0000007 1.0000000
0.0000007 0.3913299 0.6158740
0.0000007 0.3912704 0.6159148
0.0000007 0.3909635 0.6161041
0.0000007 0.3901073 0.6166374
0.0000007 0.3881178 0.6178544
0.2681066 0.3838566 0.6203279
0.3749991 0.3749991 0.6249967
0.4547209 0.3559716 0.6332374
0.5258848 0.3073042 0.6468185
0.5932060 0.0000007 0.6676112
0.6584871 0.0000007 0.6969258
0.7225738 0.0000007 0.7349420
0.7858908 0.0000007 0.7806071
0.8486637 0.0000007 0.8322017
0.9110472 0.0000007 0.8879498
0.9730930 0.0000007 0.9463757
1.0000000 0.0000007 1.0000000
0.0000007 0.4549562 0.6061684
0.0000007 0.4549238 0.6062115
0.0000007 0.4547619 0.6064237
0.0000007 0.4543001 0.6070033
0.0000007 0.4532361 0.6083281
0.0000007 0.4509955 0.6110268
0.3324866 0.4464898 0.6160982
0.4375011 0.4375011 0.6250026
0.5173995 0.4188227 0.6395721
0.5887104 0.3734108 0.6616428
0.6560246 0.0000007 0.6923803
0.7212078 0.0000007 0.7317382
0.7851205 0.0000007 0.7785050
0.8482362 0.0000007 0.8308934
0.9108029 0.0000007 0.8871729
0.9729558 0.0000007 0.9459397
1.0000000 0.0000007 1.0000000
0.0000007 0.5183418 0.5859427
0.0000007 0.5183247 0.5859926
0.0000007 0.5182313 0.5862450
0.0000007 0.5179784 0.5869443
0.0000007 0.5173970 0.5885350
0.0000007 0.5161725 0.5917569
0.0000007 0.5137540 0.5977694
0.3961305 0.5090759 0.6082130
0.4999972 0.4999972 0.6249967
0.5800230 0.4815372 0.6498576
0.6513917 0.4379958 0.6835738
0.7186598 0.0000007 0.7256491
0.7837080 0.0000007 0.7745694
0.8474496 0.0000007 0.8284859
0.9103745 0.0000007 0.8857543
0.9727134 0.0000007 0.9451303
1.0000000 0.0000007 1.0000000
0.0000007 0.5815125 0.5365521
0.0000007 0.5815042 0.5366360
0.0000007 0.5814520 0.5370250
0.0000007 0.5813144 0.5381225
0.0000007 0.5809872 0.5405954
0.0000007 0.5803058 0.5455464
0.0000007 0.5789700 0.5545923
0.0000007 0.5764248 0.5697284
0.4593347 0.5716353 0.5928581
0.5625013 0.5625013 0.6250026
0.6425776 0.5441685 0.6658161
0.7139608 0.5016212 0.7138361
0.7811298 0.2779564 0.7671512
0.8460300 0.0000007 0.8240213
0.9095824 0.0000007 0.8831566
0.9722882 0.0000007 0.9436647
1.0000000 0.0000007 1.0000000
0.0000007 0.6444844 0.0000007
0.0000007 0.6444844 0.0000007
0.0000007 0.6444509 0.0000007
0.0000007 0.6443717 0.0000007
0.0000007 0.6441891 0.0000007
0.0000007 0.6438056 0.1574705
0.0000007 0.6430575 0.3294220
0.0000007 0.6416460 0.4175985
0.2563526 0.6390222 0.4913043
0.5222545 0.6341659 0.5594632
0.6249967 0.6249967 0.6249967
0.7050963 0.6067191 0.6891905
0.7764121 0.5645393 0.7526277
0.8434600 0.3629519 0.8156437
0.9081797 0.0000007 0.8784178
0.9715251 0.0000007 0.9410233
1.0000000 0.0000007 1.0000000
0.0000007 0.7072830 0.0000007
0.0000007 0.7072830 0.0000007
0.0000007 0.7072696 0.0000007
0.0000007 0.7072229 0.0000007
0.0000007 0.7071161 0.0000007
0.0000007 0.7069025 0.0000007
0.0000007 0.7064822 0.0000007
0.0000007 0.7056890 0.0000007
0.0000007 0.7042248 0.0000007
0.3456213 0.7015604 0.0000007
0.5849344 0.6966758 0.4512696
0.6875004 0.6875004 0.6250026
0.7675710 0.6692214 0.7211568
0.8387775 0.6268995 0.7990872
0.9056577 0.4260802 0.8694985
0.9701696 0.0000007 0.9362027
1.0000000 0.0000007 1.0000000
0.0000007 0.7699198 0.0000007
0.0000007 0.7699198 0.0000007
0.0000007 0.7699089 0.0000007
0.0000007 0.7698835 0.0000007
0.0000007 0.7698254 0.0000007
0.0000007 0.7697020 0.0000007
0.0000007 0.7694662 0.0000007
0.0000007 0.7690164 0.0000007
0.0000007 0.7681937 0.0000007
0.0000007 0.7667137 0.0000007
0.4180929 0.7640429 0.0000007
0.6474362 0.7591621 0.0000007
0.7499983 0.7499983 0.6249967
0.8300054 0.7316587 0.7618914
0.9010627 0.6887156 0.8516985
0.9677234 0.4733994 0.9271184
1.0000000 0.0000007 0.9962381
0.0000007 0.8323977 0.0000007
0.0000007 0.8323977 0.0000007
0.0000007 0.8323938 0.0000007
0.0000007 0.8323820 0.0000007
0.0000007 0.8323467 0.0000007
0.0000007 0.8322762 0.0000007
0.0000007 0.8321429 0.0000007
0.0000007 0.8318921 0.0000007
0.0000007 0.8314337 0.0000007
0.0000007 0.8306077 0.0000007
0.0000007 0.8291301 0.0000007
0.4824975 0.8264745 0.0000007
0.7097745 0.8216335 0.0000007
0.8124985 0.8124985 0.6249967
0.8924159 0.7940378 0.8104948
0.9632612 0.7500196 0.9088166
1.0000000 0.4970498 0.9872885
0.0000007 0.8947541 0.0000007
0.0000007 0.8947456 0.0000007
0.0000007 0.8947499 0.0000007
0.0000007 0.8947330 0.0000007
0.0000007 0.8947246 0.0000007
0.0000007 0.8946699 0.0000007
0.0000007 0.8946067 0.0000007
0.0000007 0.8944594 0.0000007
0.0000007 0.8942111 0.0000007
0.0000007 0.8937567 0.0000007
0.0000007 0.8929327 0.0000007
0.0000007 0.8914798 0.0000007
0.5407208 0.8888614 0.0000007
0.7719408 0.8840924 0.0000007
0.8750090 0.8750008 0.6249967
0.9547704 0.8563795 0.8653901
1.0000000 0.8107393 0.9690938
0.0000007 0.9569592 0.0000007
0.0000007 0.9569592 0.0000007
0.0000007 0.9569502 0.0000007
0.0000007 0.9569502 0.0000007
0.0000007 0.9569412 0.0000007
0.0000007 0.9569188 0.0000007
0.0000007 0.9568782 0.0000007
0.0000007 0.9568018 0.0000007
0.0000007 0.9566623 0.0000007
0.0000007 0.9564105 0.0000007
0.0000007 0.9559563 0.0000007
0.0000007 0.9551700 0.0000007
0.0000007 0.9537563 0.0000007
0.5926366 0.9512122 0.0000007
0.8339714 0.9465226 0.0000007
0.9374982 0.9374982 0.6250026
1.0000000 0.9186482 0.9250187
0.0000007 1.0000000 0.0000007
0.0000007 1.0000000 0.0000007
0.0000007 1.0000000 0.0000007
0.0000007 1.0000000 0.0000007
0.0000007 1.0000000 0.0000007
0.0000007 1.0000000 0.0000007
0.0000007 1.0000000 0.0000007
0.0000007 1.0000000 0.0000007
0.0000007 1.0000000 0.0000007
0.0000007 1.0000000 0.0000007
0.0000007 1.0000000 0.0000007
0.0000007 1.0000000 0.0000007
0.0000007 1.0000000 0.0000007
0.0000007 1.0000000 0.0000007
0.6355943 1.0000000 0.0000007
0.8958032 1.0000000 0.0000007
1.0000000 1.0000000 0.6250026
0.0000007 0.0000007 0.6875004
0.0718911 0.0000007 0.6875198
0.1407264 0.0000007 0.6876205
0.2081361 0.0000007 0.6879030
0.2745637 0.0000007 0.6885400
0.3402386 0.0000007 0.6898514
0.4053014 0.0000007 0.6923673
0.4698416 0.0000007 0.6969193
0.5339330 0.0000007 0.7047569
0.5976252 0.0000007 0.7175245
0.6609555 0.0000007 0.7370461
0.7239629 0.0000007 0.7647747
0.7866691 0.0000007 0.8011460
0.8491035 0.0000007 0.8454047
0.9112872 0.0000007 0.89596

[... truncated by token budget ...]

