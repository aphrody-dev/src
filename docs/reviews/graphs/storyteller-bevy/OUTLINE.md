# Codebase Digest: storyteller-bevy

- Files analyzed: 340
- Total lines: 5102
- Total size: 196.4 KB
- Digest mode: `AST-Smart Outline`

## Directory Structure

```text
storyteller-bevy/
├── Cargo.toml (23 lines, 337 B, ~110 tokens)
├── Dockerfile (1 lines, 35 B, ~11 tokens)
├── README.md (37 lines, 1.1 KB, ~304 tokens)
├── ci-image-gen.sh (1 lines, 35 B, ~11 tokens)
├── ci.sh (1 lines, 35 B, ~11 tokens)
├── editor.ron (8 lines, 918 B, ~256 tokens)
├── netlify.toml (10 lines, 649 B, ~197 tokens)
├── nx.json (35 lines, 951 B, ~333 tokens)
├── package.json (50 lines, 1.6 KB, ~657 tokens)
├── rust-toolchain.toml (2 lines, 31 B, ~9 tokens)
├── rustfmt.toml (0 lines, 0 B, ~0 tokens)
├── studio/
│   ├── Cargo.toml (99 lines, 2.0 KB, ~669 tokens)
│   ├── assets/
│   │   ├── desync.scn.ron (936 lines, 54.4 KB, ~15.2k tokens)
│   │   └── textures/
│   │       ├── 21-renewal-wire-wall-clockmini_basecolor.png.meta (11 lines, 249 B, ~62 tokens)
│   │       ├── 21-renewal-wire-wall-clockmini_normal.png.meta (11 lines, 249 B, ~62 tokens)
│   │       ├── 21-renewal-wire-wall-clockmini_occlusionroughnessmetallic.png.meta (11 lines, 249 B, ~62 tokens)
│   │       ├── 230510_b_basecolor.png.meta (11 lines, 249 B, ~62 tokens)
│   │       ├── 230510_b_normal.png.meta (11 lines, 249 B, ~62 tokens)
│   │       ├── 230510_b_occlusionroughnessmetallic.png.meta (11 lines, 249 B, ~62 tokens)
│   │       ├── 3d66_su_1587004247754_0012.png.meta (11 lines, 249 B, ~62 tokens)
│   │       ├── archisketch_108285_frame_basecolor.png.meta (11 lines, 249 B, ~62 tokens)
│   │       ├── archisketch_108285_frame_normal.png.meta (11 lines, 249 B, ~62 tokens)
│   │       ├── archisketch_108285_frame_occlusionroughnessmetallic.png.meta (11 lines, 249 B, ~62 tokens)
│   │       ├── archisketch_122724_frame_yellow_basecolor.png.meta (11 lines, 249 B, ~62 tokens)
│   │       ├── archisketch_122724_frame_yellow_normal.png.meta (11 lines, 249 B, ~62 tokens)
│   │       ├── archisketch_122724_frame_yellow_occlusionroughnessmetallic.png.meta (11 lines, 249 B, ~62 tokens)
│   │       ├── archisketch_13135_frame_silver_basecolor.png.meta (11 lines, 249 B, ~62 tokens)
│   │       ├── archisketch_13135_frame_silver_normal.png.meta (11 lines, 249 B, ~62 tokens)
│   │       ├── archisketch_13135_frame_silver_occlusionroughnessmetallic.png.meta (11 lines, 249 B, ~62 tokens)
│   │       ├── archisketch_15261_frame_cocoa_basecolor.png.meta (11 lines, 249 B, ~62 tokens)
│   │       ├── archisketch_15261_frame_cocoa_normal.png.meta (11 lines, 249 B, ~62 tokens)
│   │       ├── archisketch_15261_frame_cocoa_occlusionroughnessmetallic.png.meta (11 lines, 249 B, ~62 tokens)
│   │       ├── archisketch_205878_frame_basecolor.png.meta (11 lines, 249 B, ~62 tokens)
│   │       ├── archisketch_205878_frame_normal.png.meta (11 lines, 249 B, ~62 tokens)
│   │       ├── archisketch_205878_frame_occlusionroughnessmetallic.png.meta (11 lines, 249 B, ~62 tokens)
│   │       ├── archisketch_277887_frame_navy_basecolor.png.meta (11 lines, 249 B, ~62 tokens)
│   │       ├── archisketch_277887_frame_navy_normal.png.meta (11 lines, 249 B, ~62 tokens)
│   │       ├── archisketch_277887_frame_navy_occlusionroughnessmetallic.png.meta (11 lines, 249 B, ~62 tokens)
│   │       ├── archisketch_280038_frame_black_basecolor.png.meta (11 lines, 249 B, ~62 tokens)
│   │       ├── archisketch_280038_frame_black_normal.png.meta (11 lines, 249 B, ~62 tokens)
│   │       ├── archisketch_280038_frame_black_occlusionroughnessmetallic.png.meta (11 lines, 249 B, ~62 tokens)
│   │       ├── archisketch_285734_frame_black_basecolor.png.meta (11 lines, 249 B, ~62 tokens)
│   │       ├── archisketch_285734_frame_black_normal.png.meta (11 lines, 249 B, ~62 tokens)
│   │       ├── archisketch_285734_frame_black_occlusionroughnessmetallic.png.meta (11 lines, 249 B, ~62 tokens)
│   │       ├── archisketch_302398_frame-_brown__basecolor.png.meta (11 lines, 249 B, ~62 tokens)
│   │       ├── archisketch_302398_frame-_brown__normal.png.meta (11 lines, 249 B, ~62 tokens)
│   │       ├── archisketch_302398_frame-_brown__occlusionroughnessmetallic.png.meta (11 lines, 249 B, ~62 tokens)
│   │       ├── archisketch_349037_frame_red_basecolor.png.meta (11 lines, 249 B, ~62 tokens)
│   │       ├── archisketch_349037_frame_red_normal.png.meta (11 lines, 249 B, ~62 tokens)
│   │       ├── archisketch_349037_frame_red_occlusionroughnessmetallic.png.meta (11 lines, 249 B, ~62 tokens)
│   │       ├── archisketch_349875_frame_132x230_butterfly-fold_basecolor.png.meta (11 lines, 249 B, ~62 tokens)
│   │       ├── archisketch_349875_frame_132x230_butterfly-fold_normal.png.meta (11 lines, 249 B, ~62 tokens)
│   │       ├── archisketch_349875_frame_132x230_butterfly-fold_occlusionroughnessmetallic.png.meta (11 lines, 249 B, ~62 tokens)
│   │       ├── archisketch_391610_frame_wall-mountedtype_basecolor.png.meta (11 lines, 249 B, ~62 tokens)
│   │       ├── archisketch_391610_frame_wall-mountedtype_normal.png.meta (11 lines, 249 B, ~62 tokens)
│   │       ├── archisketch_391610_frame_wall-mountedtype_occlusionroughnessmetallic.png.meta (11 lines, 249 B, ~62 tokens)
│   │       ├── archisketch_46250_frame_basecolor.png.meta (11 lines, 249 B, ~62 tokens)
│   │       ├── archisketch_46250_frame_normal.png.meta (11 lines, 249 B, ~62 tokens)
│   │       ├── archisketch_46250_frame_occlusionroughnessmetallic.png.meta (11 lines, 249 B, ~62 tokens)
│   │       ├── archisketch_465810_frame_b1_extra-large__basecolor.png.meta (11 lines, 249 B, ~62 tokens)
│   │       ├── archisketch_465810_frame_b1_extra-large__normal.png.meta (11 lines, 249 B, ~62 tokens)
│   │       ├── archisketch_465810_frame_b1_extra-large__occlusionroughnessmetallic.png.meta (11 lines, 249 B, ~62 tokens)
│   │       ├── archisketch_56099_frame_basecolor.png.meta (11 lines, 249 B, ~62 tokens)
│   │       ├── archisketch_56099_frame_normal.png.meta (11 lines, 249 B, ~62 tokens)
│   │       ├── archisketch_56099_frame_occlusionroughnessmetallic.png.meta (11 lines, 249 B, ~62 tokens)
│   │       ├── archisketch_71718_frame_red_basecolor.png.meta (11 lines, 249 B, ~62 tokens)
│   │       ├── archisketch_71718_frame_red_normal.png.meta (11 lines, 249 B, ~62 tokens)
│   │       ├── archisketch_71718_frame_red_occlusionroughnessmetallic.png.meta (11 lines, 249 B, ~62 tokens)
│   │       ├── basehumanfemaleskin.png.meta (11 lines, 249 B, ~62 tokens)
│   │       ├── black-vase-_black__basecolor.png.meta (11 lines, 249 B, ~62 tokens)
│   │       ├── black-vase-_black__normal.png.meta (11 lines, 249 B, ~62 tokens)
│   │       ├── black-vase-_black__occlusionroughnessmetallic.png.meta (11 lines, 249 B, ~62 tokens)
│   │       ├── color_0a0a0a.png.meta (11 lines, 249 B, ~62 tokens)
│   │       ├── color_1b1b1b.png.meta (11 lines, 249 B, ~62 tokens)
│   │       ├── diffusetexture_w181_0.png.meta (11 lines, 249 B, ~62 tokens)
│   │       ├── diffusetexture_w184_0.png.meta (11 lines, 249 B, ~62 tokens)
│   │       ├── documents_basecolor.png.meta (11 lines, 249 B, ~62 tokens)
│   │       ├── documents_normal.png.meta (11 lines, 249 B, ~62 tokens)
│   │       ├── documents_occlusionroughnessmetallic.png.meta (11 lines, 249 B, ~62 tokens)
│   │       ├── flower-color1_basecolor.png.meta (11 lines, 249 B, ~62 tokens)
│   │       ├── flower-color1_normal.png.meta (11 lines, 249 B, ~62 tokens)
│   │       ├── flower-color1_occlusionroughnessmetallic.png.meta (11 lines, 249 B, ~62 tokens)
│   │       ├── flower-color2_basecolor.png.meta (11 lines, 249 B, ~62 tokens)
│   │       ├── flower-color2_normal.png.meta (11 lines, 249 B, ~62 tokens)
│   │       ├── flower-color2_occlusionroughnessmetallic.png.meta (11 lines, 249 B, ~62 tokens)
│   │       ├── hektar-_black__basecolor.png.meta (11 lines, 249 B, ~62 tokens)
│   │       ├── hektar-_black__emissive.png.meta (11 lines, 249 B, ~62 tokens)
│   │       ├── hektar-_black__normal.png.meta (11 lines, 249 B, ~62 tokens)
│   │       ├── hektar-_black__occlusionroughnessmetallic.png.meta (11 lines, 249 B, ~62 tokens)
│   │       ├── map__2138274789_falloff.png.meta (11 lines, 249 B, ~62 tokens)
│   │       ├── map__3_gradient_ramp_0.png.meta (11 lines, 249 B, ~62 tokens)
│   │       ├── map__4727_mix.png.meta (11 lines, 249 B, ~62 tokens)
│   │       ├── mask.png.meta (11 lines, 249 B, ~62 tokens)
│   │       ├── mokin_basecolor.png.meta (11 lines, 249 B, ~62 tokens)
│   │       ├── mokin_normal.png.meta (11 lines, 249 B, ~62 tokens)
│   │       ├── mokin_occlusionroughnessmetallic.png.meta (11 lines, 249 B, ~62 tokens)
│   │       ├── none_basecolor.png.meta (11 lines, 249 B, ~62 tokens)
│   │       ├── none_normal.png.meta (11 lines, 249 B, ~62 tokens)
│   │       ├── none_occlusionroughnessmetallic.png.meta (11 lines, 249 B, ~62 tokens)
│   │       ├── sh__014e_0.png.meta (11 lines, 249 B, ~62 tokens)
│   │       ├── sh__049.png.meta (11 lines, 249 B, ~62 tokens)
│   │       ├── standard-us-power-outlet.png.meta (11 lines, 249 B, ~62 tokens)
│   │       ├── tcom_parquet_m.png.meta (11 lines, 249 B, ~62 tokens)
│   │       ├── texture-1.png.meta (11 lines, 249 B, ~62 tokens)
│   │       └── texture.png.meta (11 lines, 249 B, ~62 tokens)
│   ├── editor.ron (7 lines, 609 B, ~165 tokens)
│   ├── package.json (7 lines, 209 B, ~76 tokens)
│   ├── project.json (44 lines, 1.3 KB, ~463 tokens)
│   ├── scripts/
│   │   ├── build-web.mjs (9 lines, 220 B, ~69 tokens)
│   │   ├── copy-assets.mjs (8 lines, 194 B, ~59 tokens)
│   │   ├── handle-error.mjs (3 lines, 71 B, ~21 tokens)
│   │   └── run.mjs (6 lines, 196 B, ~54 tokens)
│   └── src/
│       ├── anim/
│       │   ├── mod.rs (16 lines, 547 B, ~150 tokens)
│       │   ├── retargeting.rs (13 lines, 409 B, ~118 tokens)
│       │   └── timeline_animation.rs (75 lines, 3.1 KB, ~870 tokens)
│       ├── bvh/
│       │   ├── error.rs (10 lines, 401 B, ~133 tokens)
│       │   ├── loader.rs (6 lines, 165 B, ~54 tokens)
│       │   └── mod.rs (26 lines, 1.0 KB, ~304 tokens)
│       ├── camera_controller.rs (25 lines, 1.0 KB, ~289 tokens)
│       ├── change_tracking.rs (15 lines, 470 B, ~134 tokens)
│       ├── debug.rs (30 lines, 1.1 KB, ~319 tokens)
│       ├── design_system.rs (3 lines, 75 B, ~23 tokens)
│       ├── headless.rs (15 lines, 469 B, ~125 tokens)
│       ├── hierarchy.rs (5 lines, 296 B, ~87 tokens)
│       ├── input.rs (24 lines, 959 B, ~264 tokens)
│       ├── inspector/
│       │   ├── mod.rs (5 lines, 123 B, ~38 tokens)
│       │   └── wasm.rs (17 lines, 695 B, ~199 tokens)
│       ├── interaction/
│       │   ├── gizmos/
│       │   │   ├── camera.rs (8 lines, 237 B, ~66 tokens)
│       │   │   ├── combo.rs (7 lines, 193 B, ~51 tokens)
│       │   │   ├── common.rs (12 lines, 441 B, ~121 tokens)
│       │   │   ├── material.rs (6 lines, 220 B, ~66 tokens)
│       │   │   ├── mod.rs (21 lines, 625 B, ~181 tokens)
│       │   │   ├── resources.rs (7 lines, 207 B, ~61 tokens)
│       │   │   ├── rotation.rs (19 lines, 638 B, ~176 tokens)
│       │   │   ├── scale.rs (12 lines, 358 B, ~103 tokens)
│       │   │   └── translation.rs (12 lines, 392 B, ~107 tokens)
│       │   ├── mod.rs (9 lines, 256 B, ~75 tokens)
│       │   ├── selection.rs (27 lines, 961 B, ~259 tokens)
│       │   └── transformation.rs (22 lines, 758 B, ~219 tokens)
│       ├── lib.rs (45 lines, 1.3 KB, ~385 tokens)
│       ├── main-headless.rs (13 lines, 611 B, ~178 tokens)
│       ├── main.rs (6 lines, 134 B, ~41 tokens)
│       ├── material/
│       │   ├── mod.rs (11 lines, 281 B, ~81 tokens)
│       │   └── short_material.rs (7 lines, 191 B, ~56 tokens)
│       ├── math/
│       │   ├── float_comparison.rs (14 lines, 681 B, ~203 tokens)
│       │   ├── geo.rs (12 lines, 455 B, ~143 tokens)
│       │   ├── internal.rs (9 lines, 287 B, ~97 tokens)
│       │   ├── interp/
│       │   │   ├── ecs.rs (19 lines, 788 B, ~230 tokens)
│       │   │   ├── mod.rs (7 lines, 162 B, ~52 tokens)
│       │   │   └── traits.rs (24 lines, 814 B, ~257 tokens)
│       │   ├── matrix.rs (12 lines, 536 B, ~158 tokens)
│       │   └── mod.rs (13 lines, 321 B, ~95 tokens)
│       ├── mixamo.rs (14 lines, 503 B, ~142 tokens)
│       ├── path.rs (5 lines, 211 B, ~65 tokens)
│       ├── persistance/
│       │   └── mod.rs (17 lines, 570 B, ~161 tokens)
│       ├── remote/
│       │   ├── mod.rs (7 lines, 186 B, ~57 tokens)
│       │   ├── reader.rs (29 lines, 1.1 KB, ~326 tokens)
│       │   └── response.rs (8 lines, 307 B, ~79 tokens)
│       ├── scene/
│       │   ├── mod.rs (38 lines, 1.3 KB, ~377 tokens)
│       │   └── wasm.rs (12 lines, 506 B, ~139 tokens)
│       ├── screenshot.rs (27 lines, 1.0 KB, ~301 tokens)
│       ├── skybox.rs (17 lines, 581 B, ~169 tokens)
│       ├── ui/
│       │   ├── blocking.rs (11 lines, 406 B, ~110 tokens)
│       │   ├── fps.rs (9 lines, 283 B, ~85 tokens)
│       │   ├── inspector.rs (42 lines, 2.0 KB, ~532 tokens)
│       │   └── mod.rs (8 lines, 206 B, ~65 tokens)
│       ├── viewport.rs (22 lines, 807 B, ~234 tokens)
│       ├── wasm/
│       │   ├── conv.rs (22 lines, 952 B, ~294 tokens)
│       │   ├── init.rs (11 lines, 643 B, ~175 tokens)
│       │   ├── mod.rs (13 lines, 317 B, ~96 tokens)
│       │   ├── screenshot.rs (18 lines, 625 B, ~179 tokens)
│       │   └── util.rs (12 lines, 419 B, ~128 tokens)
│       └── world_grid.rs (11 lines, 381 B, ~108 tokens)
├── studio-bvh/
│   ├── Cargo.toml (14 lines, 239 B, ~78 tokens)
│   ├── LICENSE (18 lines, 1.0 KB, ~249 tokens)
│   ├── project.json (22 lines, 642 B, ~225 tokens)
│   └── src/
│       ├── errors.rs (38 lines, 1.9 KB, ~604 tokens)
│       ├── frame_cursor.rs (29 lines, 1.6 KB, ~521 tokens)
│       ├── frame_iter.rs (41 lines, 2.0 KB, ~688 tokens)
│       ├── joint.rs (73 lines, 4.0 KB, ~1.3k tokens)
│       ├── joint_cursor.rs (9 lines, 374 B, ~120 tokens)
│       ├── lib.rs (66 lines, 3.3 KB, ~1.1k tokens)
│       ├── macros.rs (16 lines, 732 B, ~212 tokens)
│       ├── parse.rs (12 lines, 362 B, ~104 tokens)
│       └── write.rs (30 lines, 1.5 KB, ~462 tokens)
├── studio-frontend/
│   ├── README.md (20 lines, 653 B, ~182 tokens)
│   ├── index.html (1 lines, 35 B, ~11 tokens)
│   ├── project.json (46 lines, 1.5 KB, ~514 tokens)
│   ├── src/
│   │   ├── app/
│   │   │   ├── anim-editor.element.scss (1 lines, 36 B, ~11 tokens)
│   │   │   ├── anim-editor.element.ts (34 lines, 1.3 KB, ~366 tokens)
│   │   │   ├── anim-timeline-controller.element.scss (1 lines, 34 B, ~10 tokens)
│   │   │   ├── anim-timeline-controller.element.ts (27 lines, 1.1 KB, ~313 tokens)
│   │   │   ├── anim-timeline-controls.element.scss (1 lines, 35 B, ~11 tokens)
│   │   │   ├── anim-timeline-controls.element.ts (9 lines, 406 B, ~110 tokens)
│   │   │   ├── anim-timeline.element.scss (1 lines, 36 B, ~11 tokens)
│   │   │   ├── anim-timeline.element.ts (37 lines, 1.5 KB, ~443 tokens)
│   │   │   ├── api/
│   │   │   │   ├── EnqueueEngineCompositing.ts (4 lines, 166 B, ~40 tokens)
│   │   │   │   ├── MakeMultipartRequest.ts (1 lines, 35 B, ~11 tokens)
│   │   │   │   ├── MakeRequest.ts (4 lines, 203 B, ~53 tokens)
│   │   │   │   └── VideoStylePreview.ts (3 lines, 113 B, ~29 tokens)
│   │   │   ├── app.element.scss (1 lines, 36 B, ~11 tokens)
│   │   │   ├── app.element.ts (38 lines, 1.5 KB, ~418 tokens)
│   │   │   ├── bubble-select.element.scss (1 lines, 35 B, ~11 tokens)
│   │   │   ├── bubble-select.element.ts (10 lines, 426 B, ~121 tokens)
│   │   │   ├── file-menu.element.scss (1 lines, 34 B, ~10 tokens)
│   │   │   ├── file-menu.element.ts (13 lines, 476 B, ~133 tokens)
│   │   │   ├── help.element.scss (1 lines, 35 B, ~11 tokens)
│   │   │   ├── help.element.ts (11 lines, 389 B, ~108 tokens)
│   │   │   ├── inspector-tabs/
│   │   │   │   ├── style-tab.scss (1 lines, 34 B, ~10 tokens)
│   │   │   │   └── style-tab.ts (11 lines, 335 B, ~95 tokens)
│   │   │   ├── inspector.ts (11 lines, 371 B, ~107 tokens)
│   │   │   ├── studio-viewport.element.scss (1 lines, 36 B, ~11 tokens)
│   │   │   ├── studio-viewport.element.ts (26 lines, 1.0 KB, ~287 tokens)
│   │   │   ├── style-select.element.scss (1 lines, 35 B, ~11 tokens)
│   │   │   ├── style-select.element.ts (10 lines, 424 B, ~120 tokens)
│   │   │   ├── tabs.element.scss (1 lines, 35 B, ~11 tokens)
│   │   │   ├── tabs.element.ts (5 lines, 155 B, ~45 tokens)
│   │   │   ├── temp-video-preview.element.scss (1 lines, 36 B, ~11 tokens)
│   │   │   ├── temp-video-preview.element.ts (20 lines, 821 B, ~224 tokens)
│   │   │   └── util.ts (3 lines, 126 B, ~36 tokens)
│   │   ├── main.ts (2 lines, 62 B, ~20 tokens)
│   │   └── styles.scss (1 lines, 35 B, ~11 tokens)
│   ├── tsconfig.app.json (7 lines, 209 B, ~75 tokens)
│   ├── tsconfig.json (27 lines, 901 B, ~280 tokens)
│   ├── typings/
│   │   ├── scss.d.ts (1 lines, 34 B, ~10 tokens)
│   │   └── svg.d.ts (1 lines, 34 B, ~10 tokens)
│   └── vite.config.ts (7 lines, 242 B, ~73 tokens)
├── studio-ui/
│   ├── README.md (12 lines, 295 B, ~80 tokens)
│   ├── package.json (10 lines, 323 B, ~123 tokens)
│   ├── project.json (21 lines, 652 B, ~229 tokens)
│   ├── src/
│   │   ├── index.ts (1 lines, 34 B, ~10 tokens)
│   │   └── lib/
│   │       ├── button.element.scss (1 lines, 35 B, ~11 tokens)
│   │       ├── button.element.ts (12 lines, 466 B, ~129 tokens)
│   │       ├── dialog/
│   │       │   ├── dialog-base.element.scss (1 lines, 35 B, ~11 tokens)
│   │       │   ├── dialog-base.element.ts (16 lines, 638 B, ~176 tokens)
│   │       │   ├── dialog-footer.element.scss (1 lines, 35 B, ~11 tokens)
│   │       │   ├── dialog-footer.element.ts (5 lines, 179 B, ~50 tokens)
│   │       │   ├── dialog-header.element.scss (1 lines, 35 B, ~11 tokens)
│   │       │   ├── dialog-header.element.ts (9 lines, 304 B, ~86 tokens)
│   │       │   ├── dialog.element.ts (17 lines, 666 B, ~188 tokens)
│   │       │   └── index.ts (5 lines, 161 B, ~48 tokens)
│   │       ├── forms/
│   │       │   ├── form-field-base.element.ts (13 lines, 377 B, ~114 tokens)
│   │       │   ├── index.ts (1 lines, 34 B, ~10 tokens)
│   │       │   ├── radio/
│   │       │   │   ├── index.ts (3 lines, 92 B, ~28 tokens)
│   │       │   │   ├── radio-group.element.scss (1 lines, 34 B, ~10 tokens)
│   │       │   │   ├── radio-group.element.ts (13 lines, 515 B, ~145 tokens)
│   │       │   │   ├── radio.element.scss (1 lines, 35 B, ~11 tokens)
│   │       │   │   └── radio.element.ts (6 lines, 239 B, ~66 tokens)
│   │       │   ├── scalar-field.element.scss (1 lines, 35 B, ~11 tokens)
│   │       │   ├── scalar-field.element.ts (18 lines, 871 B, ~238 tokens)
│   │       │   ├── select/
│   │       │   │   ├── index.ts (3 lines, 88 B, ~27 tokens)
│   │       │   │   ├── listbox.element.scss (1 lines, 34 B, ~10 tokens)
│   │       │   │   ├── listbox.element.ts (5 lines, 168 B, ~47 tokens)
│   │       │   │   ├── option.element.scss (1 lines, 35 B, ~11 tokens)
│   │       │   │   ├── option.element.ts (6 lines, 241 B, ~67 tokens)
│   │       │   │   ├── select.element.scss (1 lines, 35 B, ~11 tokens)
│   │       │   │   └── select.element.ts (19 lines, 718 B, ~208 tokens)
│   │       │   ├── text-field.element.scss (1 lines, 35 B, ~11 tokens)
│   │       │   └── text-field.element.ts (11 lines, 475 B, ~131 tokens)
│   │       ├── icon.element.scss (1 lines, 35 B, ~11 tokens)
│   │       ├── icon.element.ts (59 lines, 3.6 KB, ~1.1k tokens)
│   │       ├── menu.element.scss (1 lines, 35 B, ~11 tokens)
│   │       ├── menu.element.ts (20 lines, 828 B, ~229 tokens)
│   │       ├── overlay-provider.element.scss (1 lines, 34 B, ~10 tokens)
│   │       ├── overlay-provider.element.ts (19 lines, 770 B, ~213 tokens)
│   │       ├── progress.element.scss (1 lines, 35 B, ~11 tokens)
│   │       ├── progress.element.ts (7 lines, 287 B, ~79 tokens)
│   │       ├── tabs.element.ts (4 lines, 118 B, ~34 tokens)
│   │       ├── toolbar-group.element.scss (1 lines, 34 B, ~10 tokens)
│   │       ├── toolbar.element.scss (1 lines, 35 B, ~11 tokens)
│   │       ├── toolbar.element.ts (7 lines, 272 B, ~74 tokens)
│   │       ├── tree.element.scss (1 lines, 35 B, ~11 tokens)
│   │       └── tree.element.ts (14 lines, 513 B, ~143 tokens)
│   ├── tsconfig.json (17 lines, 581 B, ~178 tokens)
│   ├── tsconfig.lib.json (8 lines, 313 B, ~118 tokens)
│   ├── tsconfig.spec.json (6 lines, 186 B, ~67 tokens)
│   └── vite.config.ts (7 lines, 208 B, ~63 tokens)
├── studio-web/
│   ├── README.md (11 lines, 236 B, ~72 tokens)
│   ├── package.json (11 lines, 348 B, ~134 tokens)
│   ├── project.json (21 lines, 656 B, ~230 tokens)
│   ├── src/
│   │   ├── index.ts (1 lines, 35 B, ~11 tokens)
│   │   └── lib/
│   │       ├── add-to-scene-menu.element.ts (9 lines, 306 B, ~84 tokens)
│   │       ├── asset-import-dialog.element.scss (1 lines, 35 B, ~11 tokens)
│   │       ├── asset-import-dialog.element.ts (19 lines, 816 B, ~221 tokens)
│   │       ├── canvas-provider.element.scss (1 lines, 34 B, ~10 tokens)
│   │       ├── canvas-provider.element.ts (20 lines, 800 B, ~214 tokens)
│   │       ├── iframe-messaging-bridge.element.ts (11 lines, 439 B, ~117 tokens)
│   │       ├── inspector/
│   │       │   ├── entity-inspector.element.scss (1 lines, 35 B, ~11 tokens)
│   │       │   ├── entity-inspector.element.ts (12 lines, 443 B, ~123 tokens)
│   │       │   ├── inspector.types.ts (13 lines, 485 B, ~132 tokens)
│   │       │   ├── material-inspector.element.scss (1 lines, 35 B, ~11 tokens)
│   │       │   ├── material-inspector.element.ts (19 lines, 814 B, ~224 tokens)
│   │       │   ├── name-inspector.element.scss (1 lines, 34 B, ~10 tokens)
│   │       │   ├── name-inspector.element.ts (9 lines, 371 B, ~101 tokens)
│   │       │   ├── quat-inspector.element.scss (1 lines, 35 B, ~11 tokens)
│   │       │   ├── quat-inspector.element.ts (15 lines, 659 B, ~180 tokens)
│   │       │   ├── transform-inspector.element.scss (1 lines, 35 B, ~11 tokens)
│   │       │   └── transform-inspector.element.ts (11 lines, 394 B, ~109 tokens)
│   │       ├── loading.element.scss (1 lines, 35 B, ~11 tokens)
│   │       ├── loading.element.ts (10 lines, 349 B, ~96 tokens)
│   │       ├── media-library-dialog.element.scss (1 lines, 36 B, ~11 tokens)
│   │       ├── media-library-dialog.element.ts (41 lines, 1.6 KB, ~460 tokens)
│   │       ├── save-scene.ts (3 lines, 97 B, ~28 tokens)
│   │       ├── scene-data-provider.element.ts (35 lines, 1.4 KB, ~380 tokens)
│   │       ├── scene-hierarchy.element.scss (1 lines, 35 B, ~11 tokens)
│   │       ├── scene-hierarchy.element.ts (9 lines, 325 B, ~89 tokens)
│   │       ├── storyteller-api.ts (68 lines, 3.5 KB, ~926 tokens)
│   │       ├── studio.element.scss (1 lines, 35 B, ~11 tokens)
│   │       ├── studio.element.ts (14 lines, 529 B, ~148 tokens)
│   │       ├── transform-toolbar.element.scss (1 lines, 35 B, ~11 tokens)
│   │       ├── transform-toolbar.element.ts (14 lines, 502 B, ~141 tokens)
│   │       └── url-params.ts (14 lines, 425 B, ~123 tokens)
│   ├── tsconfig.json (17 lines, 581 B, ~178 tokens)
│   ├── tsconfig.lib.json (8 lines, 313 B, ~118 tokens)
│   ├── tsconfig.spec.json (6 lines, 186 B, ~67 tokens)
│   └── vite.config.ts (7 lines, 208 B, ~63 tokens)
├── test_headless_mode.sh (1 lines, 35 B, ~11 tokens)
├── tsconfig.base.json (46 lines, 3.0 KB, ~989 tokens)
├── utility/
│   ├── README.md (11 lines, 227 B, ~67 tokens)
│   ├── package.json (7 lines, 213 B, ~79 tokens)
│   ├── project.json (18 lines, 556 B, ~193 tokens)
│   ├── src/
│   │   ├── index.ts (1 lines, 34 B, ~10 tokens)
│   │   └── lib/
│   │       ├── array.ts (4 lines, 233 B, ~73 tokens)
│   │       ├── assert.ts (2 lines, 119 B, ~33 tokens)
│   │       ├── exists.ts (2 lines, 115 B, ~36 tokens)
│   │       ├── match.ts (8 lines, 370 B, ~107 tokens)
│   │       └── types.ts (9 lines, 467 B, ~152 tokens)
│   ├── tsconfig.json (15 lines, 513 B, ~159 tokens)
│   ├── tsconfig.lib.json (8 lines, 313 B, ~118 tokens)
│   ├── tsconfig.spec.json (6 lines, 186 B, ~67 tokens)
│   └── vite.config.ts (5 lines, 148 B, ~45 tokens)
└── vite-multiple-assets/
    ├── README.md (5 lines, 275 B, ~71 tokens)
    ├── package.json (5 lines, 166 B, ~59 tokens)
    ├── project.json (7 lines, 255 B, ~86 tokens)
    ├── src/
    │   ├── index.ts (7 lines, 259 B, ~73 tokens)
    │   └── lib/
    │       ├── build.ts (5 lines, 221 B, ~61 tokens)
    │       └── server.ts (7 lines, 246 B, ~71 tokens)
    ├── tsconfig.json (15 lines, 487 B, ~156 tokens)
    ├── tsconfig.lib.json (8 lines, 313 B, ~118 tokens)
    └── tsconfig.spec.json (6 lines, 186 B, ~67 tokens)
```

## Source Files

================================================
FILE: README.md
================================================
# Storyteller Studio

## Installing dependencies
* [Install Rust](https://www.rust-lang.org/tools/install)
* [Install Node.js LTS](https://nodejs.org/en)
* Run `npm ci`

## Building / Running / Testing stuff
This repo is managed by [Nx](https://nx.dev), a polyglot build system and
monorepo framework written in TypeScript. After installing dependencies, dev
tasks can be run through the Nx CLI:
```sh
npx nx <command> <project> [options]
# OR
npx nx run <project>:<command> [options]
```

For example, to compile the Bevy app to WebAssembly and serve it via the web
frontend project, run:
```
npx nx serve studio-frontend
```

You'll need to install the wasm compiler for Rust: 
```
rustup target add wasm32-unknown-unknown
```

Projects are located in directories at the workspace root. The list of commands
supported by a given project can be found under the `target` property of its
`project.json` file, which defines the Nx configuration for that project.

The full list of options for a given command can be discovered by passing the
`--help` flag:
```
npx nx <command> <project> --help
```


================================================
FILE: studio-frontend/README.md
================================================
# studio-frontend

This is the primary microfrontend to be embedded in the [Storyteller.ai
website](https://fakeyou.com/studio).

### Running

The project can be served locally using the `serve` target:
```sh
npx nx serve studio-frontend
```

### Configuring application startup

After running the `serve` command above, the web app can be viewed in the
browser at `http://localhost:4200` and configured through a set of URL
parameters which are documented [here](../studio-web/src/lib/url-params.ts).

For example, to load the bundled `sample-room.gltf` scene in `StudioMode.Editor`,
visit: http://localhost:4200/?mode=studio&objectId=sample-room.gltf


================================================
FILE: studio-ui/README.md
================================================
# studio-ui

This is a UI/component library that can be easily shared between multiple
Storyteller Studio frontend applications.

## Building

Run `nx build studio-ui` to build the library.

## Running unit tests

Run `nx test studio-ui` to execute the unit tests via [Jest](https://jestjs.io).


================================================
FILE: studio-web/README.md
================================================
# studio-web

This library was generated with [Nx](https://nx.dev).

## Building

Run `nx build studio-web` to build the library.

## Running unit tests

Run `nx test studio-web` to execute the unit tests via [Jest](https://jestjs.io).


================================================
FILE: utility/README.md
================================================
# utility

This library was generated with [Nx](https://nx.dev).

## Building

Run `nx build utility` to build the library.

## Running unit tests

Run `nx test utility` to execute the unit tests via [Jest](https://jestjs.io).


================================================
FILE: vite-multiple-assets/README.md
================================================
# vite-multiple-assets

This is a simple Vite plugin forked from [`vite-multiple-assets`](https://github.com/nguyenbatranvan/vite-multiple-assets)
and extended to provide MIME types for additional filetypes not commonly used on
the web, but needed for a Bevy 3D application.


================================================
FILE: Cargo.toml
================================================
[workspace]
resolver = "2"
members = [
    "./studio",
    "./studio-bvh",
]

[workspace.dependencies]
anyhow = "1.0.75"

[workspace.dependencies.bevy]
version = "0.13.2"
features = ["tonemapping_luts"]

[profile.dev-custom]
inherits = "dev"
opt-level = 1

[profile.dev-custom.package."*"]
opt-level = 3

[profile.release]
opt-level = 3


================================================
FILE: package.json
================================================
// [OUTLINE - 49 symbols, 54 lines]
// L2: "name": "@storyteller/source"
// L3: "version": "0.0.0"
// L4: "license": "MIT"
// L5-L7: "scripts":
// L6: "link-packages": "node ./scripts/link-packages.cjs"
// L8: "private": true
// L9-L44: "devDependencies":
// L10: "@nx/js": "16.9.1"
// L11: "@nx/react": "16.9.1"
// L12: "@nx/vite": "16.9.1"
// L13: "@nx/web": "16.9.1"
// L14: "@nx/workspace": "16.9.1"
// L15: "@nxrs/cargo": "^0.4.0"
// L16: "@swc/core": "~1.3.85"
// L17: "@testing-library/react": "14.0.0"
// L18: "@types/lodash": "^4.14.199"
// L19: "@types/node": "18.14.2"
// L20: "@types/react": "18.2.14"
// L21: "@types/react-dom": "18.2.6"
// L22: "@types/uuid": "^9.0.8"
// L23: "@types/which": "^3.0.2"
// L24: "@vitejs/plugin-react": "~4.0.0"
// L25: "@vitest/coverage-c8": "~0.32.0"
// L26: "@vitest/ui": "~0.32.0"
// L27: "chalk": "^5.3.0"
// L28: "glob": "^10.3.10"
// L29: "jsdom": "~22.1.0"
// L30: "nx": "16.9.1"
// L31: "prettier": "^2.6.2"
// L32: "rimraf": "^5.0.5"
// L33: "sass": "^1.68.0"
// L34: "swc-loader": "0.1.15"
// L35: "typescript": "~5.1.3"
// L36: "vite": "~4.3.9"
// L37: "vite-plugin-dts": "~2.3.0"
// L38: "vite-plugin-top-level-await": "^1.3.1"
// L39: "vite-plugin-wasm": "^3.2.2"
// L40: "vite-plugin-web-components-hmr": "^0.1.3"
// L41: "vitest": "~0.32.0"
// L42: "which": "^4.0.0"
// L43: "idb": "8.0.0"
// L45-L53: "dependencies":
// L46: "@fortawesome/fontawesome-pro": "^6.4.2"
// L47: "axios": "^1.6.7"
// L48: "lit": "^2.8.0"
// L49: "lodash": "^4.17.21"
// L50: "react": "18.2.0"
// L51: "react-dom": "18.2.0"
// L52: "tslib": "^2.3.0"


================================================
FILE: studio/Cargo.toml
================================================
[package]
name = "studio"
version = "0.1.0"
edition = "2021"

[lib]
name = "studio"
crate-type = ["cdylib", "rlib"]
path = "src/lib.rs"

[[bin]]
name = "studio-standalone"
path = "src/main.rs"

[[bin]]
name = "studio-headless"
required-features = ["headless"]
path = "src/main-headless.rs"

[dependencies]
bevy-inspector-egui = "0.23.0"
bevy_mod_raycast = "0.17.0"
bevy_rapier3d = "0.25.0"
bevy_mod_outline = "0.7.0"
bevy_web_asset = "0.8.0"
bitflags = "2.4.0"
console_error_panic_hook = { version = "0.1.7", optional = true }
itertools = "0.12.1"
js-sys = { version = "0.3.65", optional = true }
parking_lot = "0.12.1"
serde = "1.0.192"
serde-wasm-bindgen = { version = "0.6.1", optional = true }
serde_json = "1.0.108"
studio-bvh = { path = "../studio-bvh" }
wasm-bindgen = "0.2"
web-sys = { version = "0.3", optional = true, features = [
	"CustomEvent",
	"CustomEventInit",
	"Document",
	"HtmlElement",
	"Window",
	"Location",
	"WorkerGlobalScope"
] }
clap = { version = "4.4.18", features = ["derive"] }
futures-intrusive = "0.5.0"
wgpu = "0.19.3"
futures-lite = "2.2.0"
futures = "0.3.30"
image = "0.25.0"
bytemuck = "1.14.1"

space_editor = {git = "https://github.com/rewin123/space_editor", rev = "daeaef70e4eb3ce1f945e296383a9eb2f31900b3"}
anyhow.workspace = true
serde_repr = "0.1.18"

async-compat = "0.2"
uuid = { version = "1", features = ["v4", "serde"]}
indexed_db_futures = { version = "0.4", optional = true}
wasm-bindgen-futures = { version = "0.4", optional = true}
dashmap = "5"
once_cell = "1"
bevy_tweening = "0.10.0"

[dependencies.reqwest]
version = "0.12.2"
features = [
	"default",
	"json",
	"stream",
]

[features]
wasm = [
	"dep:console_error_panic_hook",
	"dep:js-sys",
	"dep:serde-wasm-bindgen",
	"dep:web-sys",
	"dep:indexed_db_futures",
	"dep:wasm-bindgen-futures",
	"bevy_rapier3d/wasm-bindgen",
]
desktop = []
headless = []

[dependencies.bevy]
workspace = true

[dependencies.bevy_mod_picking]
version = "0.18.0"
default-features = false
features = [
	"backend_bevy_ui",
	"backend_rapier",
	"backend_raycast",
	"backend_sprite",
	"debug",
	"selection",
]


================================================
FILE: studio/package.json
================================================
// [OUTLINE - 6 symbols, 16 lines]
// L2: "name": "@storyteller/studio"
// L3: "version": "0.0.1"
// L4-L9: "files": [
// L10: "module": "studio.js"
// L11: "types": "studio.d.ts"
// L12-L15: "sideEffects": [


================================================
FILE: studio-bvh/Cargo.toml
================================================
[package]
name = "studio-bvh"
version = "0.1.0"
edition = "2021"
authors = [
	"George Burton <burtonageo@gmail.com>",
	"Storyteller.ai",
]

[dependencies] # TODO: Update dependencies
bstr = "0.2"
lexical = "5.2"
nom = "6"
smallvec = "1.5"


================================================
FILE: studio-ui/package.json
================================================
// [OUTLINE - 9 symbols, 12 lines]
// L2: "name": "@storyteller/studio-ui"
// L3: "version": "0.0.1"
// L4-L8: "dependencies":
// L5: "@storyteller/framework": "0.0.1"
// L6: "@storyteller/studio": "0.0.1"
// L7: "lit": "^2.8.0"
// L9: "main": "./index.js"
// L10: "module": "./index.mjs"
// L11: "typings": "./index.d.ts"


================================================
FILE: studio-web/package.json
================================================
// [OUTLINE - 10 symbols, 13 lines]
// L2: "name": "@storyteller/studio-web"
// L3: "version": "0.0.1"
// L4-L9: "dependencies":
// L5: "@storyteller/framework": "0.0.1"
// L6: "@storyteller/studio": "0.0.1"
// L7: "lit": "^2.8.0"
// L8: "idb": "8.0.0"
// L10: "main": "./index.js"
// L11: "module": "./index.mjs"
// L12: "typings": "./index.d.ts"


================================================
FILE: utility/package.json
================================================
// [OUTLINE - 6 symbols, 8 lines]
// L2: "name": "@storyteller/utility"
// L3: "version": "0.0.1"
// L4: "dependencies":
// L5: "main": "./index.js"
// L6: "module": "./index.mjs"
// L7: "typings": "./index.d.ts"


================================================
FILE: vite-multiple-assets/package.json
================================================
// [OUTLINE - 4 symbols, 6 lines]
// L2: "name": "@storyteller/vite-multiple-assets"
// L3: "version": "0.0.1"
// L4: "dependencies":
// L5: "main": "./src/index.js"


================================================
FILE: studio/src/lib.rs
================================================
// [OUTLINE - 35 symbols, 248 lines]
// import bevy
// import bevy_mod_picking
// import bevy_web_asset
// import scene
// import serde_repr
// import wasm_bindgen
// import crate
// import crate
// import space_editor
// L13: mod anim;
// L14: mod bvh;
// L15: mod camera_controller;
// L16: mod change_tracking;
// L17: mod debug;
// L18: mod design_system;
// L20: pub mod headless;
// L21: mod hierarchy;
// L22: mod input;
// L23: mod inspector;
// L24: mod interaction;
// L25: pub mod material;
// L26: pub mod math;
// L27: mod mixamo;
// L28: mod path;
// L29: mod persistance;
// L30: mod remote;
// L31: pub mod scene;
// L33: pub mod screenshot;
// L34: mod skybox;
// L35: mod ui;
// L36: pub mod viewport;
// L37: mod world_grid;
// L60: mod wasm;
// L63: pub(crate) struct MainCamera;
// L72-L76: pub enum StudioMode
// L78-L80: pub(crate) fn is_editor(r_studio_mode: Res<StudioMode>) -> bool
// L84: pub struct CommonPlugins;
// L86-L100: fn build(self) -> PluginGroupBuilder
// L105: struct EditorPlugins;
// L107-L109: fn build(self) -> PluginGroupBuilder
// L113-L126: pub enum InitParams
// L129-L144: pub enum InitAsset
// L146-L196: pub fn start(init: InitParams, mode: StudioMode, window_config: Option<Window>) -> App
// L198-L248: fn init_from_asset(app: &mut App, asset: InitAsset, skybox_id: String)


================================================
FILE: studio/src/main.rs
================================================
// [OUTLINE - 2 symbols, 43 lines]
// import bevy
// import clap
// import studio
// L14-L17: struct StudioArgs
// L19-L43: fn main()


================================================
FILE: studio-bvh/src/lib.rs
================================================
// [OUTLINE - 58 symbols, 956 lines]
// import crate
// import bstr
// import std
// import crate
// import crate
// import joint
// import macros
// L181: mod macros;
// L183: pub mod errors;
// L185: pub mod write;
// L187: mod frame_cursor;
// L188: mod frame_iter;
// L189: pub mod joint;
// L190: mod parse;
// L212-L218: pub mod frames
// L224-L227: struct CachedEnumerate<I>
// L231-L236: fn new(iter: Enumerate<I>) -> Self
// L239-L241: fn last_enumerator(&self) -> Option<usize>
// L247-L251: fn next(&mut self) -> Option<Self::Item>
// L254-L256: fn size_hint(&self) -> (usize, Option<usize>)
// L262-L280: pub(crate) fn next_non_empty_line(&mut self) -> Option<<Self as Iterator>::Item>
// L285-L287: pub fn from_reader<R: BufReadExt>(data: R) -> Result<Bvh, LoadError>
// L317-L319: pub fn from_bytes<B: AsRef<[u8]>>(bytes: B) -> Result<Bvh, LoadError>
// L349-L351: pub fn from_str(string: &str) -> Result<Bvh, LoadError>
// L358-L368: pub struct Bvh
// L373-L380: pub const fn new() -> Self
// L410-L412: pub fn from_bytes<B: AsRef<[u8]>>(bytes: B) -> Result<Self, LoadError>
// L416-L430: pub fn from_reader<R: BufReadExt>(mut reader: R) -> Result<Self, LoadError>
// L418-L427: fn from_reader_(reader: &mut dyn BufReadExt) -> Result<Bvh, LoadError>
// L456-L458: pub fn write_to<W: Write>(&self, writer: &mut W) -> io::Result<()>
// L472-L474: pub fn to_string(&self) -> Vec<u8>
// L506-L515: pub fn root_joint(&self) -> Option<Joint<'_>>
// L519-L521: pub fn joints(&self) -> Joints<'_>
// L525-L527: pub fn joints_mut(&mut self) -> JointsMut<'_>
// L545-L553: pub fn frames(&self) -> Frames<'_>
// L571-L579: pub fn frames_mut(&mut self) -> FramesMut<'_>
// L611-L613: pub fn extract_frames(&mut self) -> Vec<f32>
// L618-L620: pub fn num_frames(&self) -> usize
// L624-L626: pub const fn num_channels(&self) -> usize
// L649-L651: pub const fn frame_time(&self) -> &Duration
// L672-L674: pub fn set_frame_time(&mut self, new_frame_time: Duration)
// L678-L680: pub fn frame_cursor(&mut self) -> FrameCursor<'_>
// L683-L692: pub fn get_joint(&self, index: usize) -> Option<Joint<'_>>
// L697-L699: fn default() -> Self
// L705-L707: fn from_str(string: &str) -> Result<Self, Self::Err>
// L713-L715: fn try_from(string: &'_ str) -> Result<Self, Self::Error>
// L721-L723: fn try_from(string: &'_ BStr) -> Result<Self, Self::Error>
// L729-L731: fn try_from(bytes: &'_ [u8]) -> Result<Self, Self::Error>
// L737-L742: pub struct Channel
// L746-L751: const fn new(channel_type: ChannelType, motion_index: usize) -> Self
// L755-L757: pub const fn channel_type(&self) -> ChannelType
// L761-L763: pub const fn motion_index(&self) -> usize
// L768-L781: pub enum ChannelType
// L799-L815: pub fn from_bytes<B>(s: &B) -> Result<Self, ParseChannelError>
// L828-L833: pub const fn is_rotation(&self) -> bool
// L846-L848: pub const fn is_position(&self) -> bool
// L860-L866: pub const fn axis(&self) -> Axis
// L870-L880: pub const fn as_str(&self) -> &'static str
// L886-L888: fn try_from(string: &[u8]) -> Result<Self, Self::Error>
// L894-L896: fn try_from(string: &str) -> Result<Self, Self::Error>
// L902-L904: fn from_str(s: &str) -> Result<Self, Self::Err>
// L909-L911: fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result
// L916-L923: pub enum Axis
// L937-L943: pub fn vector(&self) -> Offset
// L948-L955: fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result


================================================
FILE: studio-ui/src/index.ts
================================================
// [OUTLINE - 0 symbols, 8 lines]


================================================
FILE: studio-ui/src/lib/dialog/index.ts
================================================
// [OUTLINE - 0 symbols, 9 lines]
// import ./dialog-base.element
// import ./dialog-footer.element
// import ./dialog-header.element
// import ./dialog.element


================================================
FILE: studio-ui/src/lib/forms/index.ts
================================================
// [OUTLINE - 0 symbols, 4 lines]


================================================
FILE: studio-ui/src/lib/forms/radio/index.ts
================================================
// [OUTLINE - 0 symbols, 5 lines]
// import ./radio-group.element
// import ./radio.element


================================================
FILE: studio-ui/src/lib/forms/select/index.ts
================================================
// [OUTLINE - 0 symbols, 5 lines]
// import ./select.element
// import ./option.element


================================================
FILE: studio-web/src/index.ts
================================================
// [OUTLINE - 0 symbols, 15 lines]


================================================
FILE: utility/src/index.ts
================================================
// [OUTLINE - 0 symbols, 5 lines]


================================================
FILE: vite-multiple-assets/src/index.ts
================================================
// [OUTLINE - 3 symbols, 16 lines]
// import vite
// import ./lib/server
// import ./lib/build
// L6-L16: function DynamicPublicDirectory(assets: string[]): PluginOption
// L8-L10: configureServer(server: ViteDevServer)
// L11-L13: async writeBundle(options)


================================================
FILE: Dockerfile
================================================
// [OUTLINE - 0 symbols, 57 lines]


================================================
FILE: ci-image-gen.sh
================================================
// [OUTLINE - 0 symbols, 16 lines]


================================================
FILE: ci.sh
================================================
// [OUTLINE - 0 symbols, 16 lines]


================================================
FILE: editor.ron
================================================
{
    "space_editor_core::hotkeys::HotkeySet<space_editor_ui::tools::gizmo::GizmoHotkey>": "{\"space_editor_core::hotkeys::HotkeySet<space_editor_ui::tools::gizmo::GizmoHotkey>\":(bindings:{Clone:[AltLeft],Rotate:[KeyR],Multiple:[ShiftLeft],Delete:[KeyX],Translate:[KeyG],Scale:[KeyS]},name:\"GizmoHotkey\")}",
    "space_persistence::PersistenceSettings": "{\"space_persistence::PersistenceSettings\":(load_on_startup:true,save_on_close:true)}",
    "space_undo::ChangeChainSettings": "{\"space_undo::ChangeChainSettings\":(max_change_chain_size:200)}",
    "space_editor_ui::settings::GameModeSettings": "{\"space_editor_ui::settings::GameModeSettings\":(mode:Game3D)}",
    "space_editor_ui::sizing::Sizing": "{\"space_editor_ui::sizing::Sizing\":(icon:Regular,gizmos:Gizmos,text:14.0)}",
    "space_editor_ui::settings::NewWindowSettings": "{\"space_editor_ui::settings::NewWindowSettings\":(new_tab:SameNode)}",
}

================================================
FILE: netlify.toml
================================================
[[headers]]
  for = "/*"
  [headers.values]
    # NB: This is potentially dangerous, but I don't think we have much other choice:
    Access-Control-Allow-Origin = "*"

    # https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/frame-ancestors
    # NB: The *.netlify.app is dangerous.
    Content-Security-Policy = "frame-ancestors 'self' https://fakeyou.com https://*.fakeyou.com https://storyteller.ai https://*.storyteller.ai https://*.netlify.app http://*.fakeyou.com:7000 http://*.fakeyou.com:7001 http://*.fakeyou.com:7002 http://*.storyteller.ai:7000 http://*.storyteller.ai:7001 http://*.storyteller.ai:7002;"



================================================
FILE: nx.json
================================================
// [OUTLINE - 34 symbols, 71 lines]
// L2-L4: "plugins": [
// L5-L16: "namedInputs":
// L6-L9: "default": [
// L10-L14: "production": [
// L15: "sharedGlobals": []
// L17-L33: "targetDefaults":
// L18-L26: "build":
// L19-L21: "dependsOn": [
// L22-L25: "inputs": [
// L27-L32: "test":
// L28-L31: "inputs": [
// L34-L47: "tasksRunnerOptions":
// L35-L46: "default":
// L36: "runner": "nx/tasks-runners/default"
// L37-L45: "options":
// L38: "useDaemonProcess": false
// L39-L44: "cacheableOperations": [
// L48-L70: "generators":
// L49-L54: "@nx/web:application":
// L50: "style": "scss"
// L51: "linter": "none"
// L52: "unitTestRunner": "none"
// L53: "e2eTestRunner": "none"
// L55-L69: "@nx/react":
// L56-L61: "application":
// L57: "style": "scss"
// L58: "linter": "none"
// L59: "bundler": "vite"
// L60: "babel": true
// L62-L64: "component":
// L63: "style": "scss"
// L65-L68: "library":
// L66: "style": "scss"
// L67: "linter": "none"


================================================
FILE: rust-toolchain.toml
================================================
[toolchain]
channel = "stable"


================================================
FILE: rustfmt.toml
================================================


================================================
FILE: studio/assets/desync.scn.ron
================================================
(
  resources: {},
  entities: {
    9: (
      components: {
        "bevy_transform::components::transform::Transform": (
          translation: (
            x: 0.0,
            y: 0.0,
            z: 0.0,
          ),
          rotation: (
            x: -0.27984813,
            y: 0.36470518,
            z: 0.11591689,
            w: 0.88047624,
          ),
          scale: (
            x: 1.0,
            y: 1.0,
            z: 1.0,
          ),
        ),
        "bevy_core::name::Name": (
          hash: 4042927597982576294,
          name: "Directional Light",
        ),
        "bevy_render::view::visibility::Visibility": Inherited,
        "bevy_pbr::light::DirectionalLight": (
          color: Rgba(
            red: 1.0,
            green: 1.0,
            blue: 1.0,
            alpha: 1.0,
          ),
          illuminance: 20000.0,
          shadows_enabled: false,
          shadow_depth_bias: 0.02,
          shadow_normal_bias: 1.8,
        ),
        "studio::anim::timeline_animation::AnimationTarget": Uuid("57217c56-d86b-441f-a0b6-a471dfe1d463"),
      },
    ),
    10: (
      components: {
        "bevy_transform::components::transform::Transform": (
          translation: (
            x: 0.0,
            y: 23.715185,
            z: 0.0000007320094,
          ),
          rotation: (
            x: 0.70710677,
            y: 0.0,
            z: 0.0,
            w: 0.7071067,
          ),
          scale: (
            x: 0.01,
            y: 0.010000001,
            z: 0.010000001,
          ),
        ),
        "bevy_render::view::visibility::Visibility": Inherited,
        "studio::anim::timeline_animation::TransformKeyframe": (
          incoming_easing: Linear,
          affect_translation: true,
          affect_rotation: true,
          affect_scale: true,
        ),
        "studio::anim::timeline_animation::Keyframe": (
          target: Uuid("2c3faa37-9320-4bc7-825f-75b745477901"),
          time: 1.1854,
        ),
      },
    ),
    11: (
      components: {
        "bevy_transform::components::transform::Transform": (
          translation: (
            x: 0.0,
            y: 27.426285,
            z: 0.00000051081065,
          ),
          rotation: (
            x: 0.7071068,
            y: 0.0,
            z: 0.0,
            w: 0.70710677,
          ),
          scale: (
            x: 0.01,
            y: 0.010000001,
            z: 0.010000001,
          ),
        ),
        "bevy_render::view::visibility::Visibility": Inherited,
        "studio::anim::timeline_animation::TransformKeyframe": (
          incoming_easing: Linear,
          affect_translation: true,
          affect_rotation: true,
          affect_scale: true,
        ),
        "studio::anim::timeline_animation::Keyframe": (
          target: Uuid("2c3faa37-9320-4bc7-825f-75b745477901"),
          time: 3.0443585,
        ),
      },
    ),
    12: (
      components: {
        "bevy_transform::components::transform::Transform": (
          translation: (
            x: -5.861992,
            y: 16.39393,
            z: -44.6979,
          ),
          rotation: (
            x: 0.70710677,
            y: 0.0,
            z: 0.0,
            w: 0.7071067,
          ),
          scale: (
            x: 0.01,
            y: 0.010000001,
            z: 0.010000001,
          ),
        ),
        "bevy_render::view::visibility::Visibility": Inherited,
        "studio::anim::timeline_animation::TransformKeyframe": (
          incoming_easing: Linear,
          affect_translation: true,
          affect_rotation: true,
          affect_scale: true,
        ),
        "studio::anim::timeline_animation::Keyframe": (
          target: Uuid("34f59412-5a7b-44e9-aaa3-3e74840121c9"),
          time: 0.0,
        ),
      },
    ),
    13: (
      components: {
        "bevy_transform::components::transform::Transform": (
          translation: (
            x: -1.6321859,
            y: 16.393932,
            z: -46.45551,
          ),
          rotation: (
            x: 0.70710677,
            y: 0.0,
            z: 0.0,
            w: 0.7071067,
          ),
          scale: (
            x: 0.01,
            y: 0.010000001,
            z: 0.010000001,
          ),
        ),
        "bevy_render::view::visibility::Visibility": Inherited,
        "studio::anim::timeline_animation::TransformKeyframe": (
          incoming_easing: Linear,
          affect_translation: true,
          affect_rotation: true,
          affect_scale: true,
        ),
        "studio::anim::timeline_animation::Keyframe": (
          target: Uuid("34f59412-5a7b-44e9-aaa3-3e74840121c9"),
          time: 1.6179003,
        ),
      },
    ),
    14: (
      components: {
        "bevy_transform::components::transform::Transform": (
          translation: (
            x: 0.90487814,
            y: 19.255144,
            z: -44.125862,
          ),
          rotation: (
            x: 0.7071068,
            y: 0.0,
            z: 0.0,
            w: 0.70710677,
          ),
          scale: (
            x: 0.01,
            y: 0.010000001,
            z: 0.010000001,
          ),
        ),
        "bevy_render::view::visibility::Visibility": Inherited,
        "studio::anim::timeline_animation::TransformKeyframe": (
          incoming_easing: Linear,
          affect_translation: true,
          affect_rotation: true,
          affect_scale: true,
        ),
        "studio::anim::timeline_animation::Keyframe": (
          target: Uuid("34f59412-5a7b-44e9-aaa3-3e74840121c9"),
          time: 3.0603817,
        ),
      },
    ),
    15: (
      components: {
        "bevy_transform::components::transform::Transform": (
          translation: (
            x: -9.611355,
            y: 20.93744,
            z: -28.69173,
          ),
          rotation: (
            x: 0.0,
            y: 0.0,
            z: 0.0,
            w: 1.0,
          ),
          scale: (
            x: 0.122251,
            y: 0.122251,
            z: 8.75498,
          ),
        ),
        "bevy_render::view::visibility::Visibility": Inherited,
        "studio::anim::timeline_animation::TransformKeyframe": (
          incoming_easing: Linear,
          affect_translation: true,
          affect_rotation: true,
          affect_scale: true,
        ),
        "studio::anim::timeline_animation::Keyframe": (
          target: Uuid("2b76e191-e079-417a-9369-2443f21f3ce5"),
          time: 0.0,
        ),
      },
    ),
    16: (
      components: {
        "bevy_transform::components::transform::Transform": (
          translation: (
            x: -9.611355,
            y: 20.93744,
            z: 19.342052,
          ),
          rotation: (
            x: 0.0,
            y: 0.0,
            z: 0.0,
            w: 1.0,
          ),
          scale: (
            x: 0.122251,
            y: 0.122251,
            z: 8.75498,
          ),
        ),
        "bevy_render::view::visibility::Visibility": Inherited,
        "studio::anim::timeline_animation::TransformKeyframe": (
          incoming_easing: Linear,
          affect_translation: true,
          affect_rotation: true,
          affect_scale: true,
        ),
        "studio::anim::timeline_animation::Keyframe": (
          target: Uuid("2b76e191-e079-417a-9369-2443f21f3ce5"),
          time: 0.967,
        ),
      },
    ),
    17: (
      components: {
        "bevy_transform::components::transform::Transform": (
          translation: (
            x: -9.611355,
            y: 11.742281,
            z: -28.69173,
          ),
          rotation: (
            x: 0.0,
            y: 0.0,
            z: 0.0,
            w: 1.0,
          ),
          scale: (
            x: 0.122251,
            y: 0.122251,
            z: 8.75498,
          ),
        ),
        "bevy_render::view::visibility::Visibility": Inherited,
        "studio::anim::timeline_animation::TransformKeyframe": (
          incoming_easing: Linear,
          affect_translation: true,
          affect_rotation: true,
          affect_scale: true,
        ),
        "studio::anim::timeline_animation::Keyframe": (
          target: Uuid("408b5d7e-9456-4d81-a08e-feebba2ce1c4"),
          time: 0.0,
        ),
      },
    ),
    18: (
      components: {
        "bevy_transform::components::transform::Transform": (
          translation: (
            x: -9.611355,
            y: 11.742281,
            z: 13.85043,
          ),
          rotation: (
            x: 0.0,
            y: 0.0,
            z: 0.0,
            w: 1.0,
          ),
          scale: (
            x: 0.122251,
            y: 0.122251,
            z: 8.75498,
          ),
        ),
        "bevy_render::view::visibility::Visibility": Inherited,
        "studio::anim::timeline_animation::TransformKeyframe": (
          incoming_easing: Linear,
          affect_translation: true,
          affect_rotation: true,
          affect_scale: true,
        ),
        "studio::anim::timeline_animation::Keyframe": (
          target: Uuid("408b5d7e-9456-4d81-a08e-feebba2ce1c4"),
          time: 0.97205836,
        ),
      },
    ),
    19: (
      components: {
        "bevy_transform::components::transform::Transform": (
          translation: (
            x: -2.1474366,
            y: 20.93744,
            z: -28.69173,
          ),
          rotation: (
            x: 0.0,
            y: 0.0,
            z: 0.0,
            w: 1.0,
          ),
          scale: (
            x: 0.122251,
            y: 0.122251,
            z: 8.75498,
          ),
        ),
        "bevy_render::view::visibility::Visibility": Inherited,
        "studio::anim::timeline_animation::TransformKeyframe": (
          incoming_easing: Linear,
          affect_translation: true,
          affect_rotation: true,
          affect_scale: true,
        ),
        "studio::anim::timeline_animation::Keyframe": (
          target: Uuid("38601448-b10c-43ec-91de-367e51c06daf"),
          time: 0.0,
        ),
      },
    ),
    20: (
      components: {
        "bevy_transform::components::transform::Transform": (
          translation: (
            x: -2.1474366,
            y: 20.93744,
            z: 18.621094,
          ),
          rotation: (
            x: 0.0,
            y: 0.0,
            z: 0.0,
            w: 1.0,
          ),
          scale: (
            x: 0.122251,
            y: 0.122251,
            z: 8.75498,
          ),
        ),
        "bevy_render::view::visibility::Visibility": Inherited,
        "studio::anim::timeline_animation::TransformKeyframe": (
          incoming_easing: Linear,
          affect_translation: true,
          affect_rotation: true,
          affect_scale: true,
        ),
        "studio::anim::timeline_animation::Keyframe": (
          target: Uuid("38601448-b10c-43ec-91de-367e51c06daf"),
          time: 1.0002003,
        ),
      },
    ),
    21: (
      components: {
        "bevy_transform::components::transform::Transform": (
          translation: (
            x: -2.1474366,
            y: 11.742281,
            z: -28.69173,
          ),
          rotation: (
            x: 0.0,
            y: 0.0,
            z: 0.0,
            w: 1.0,
          ),
          scale: (
            x: 0.122251,
            y: 0.122251,
            z: 8.75498,
          ),
        ),
        "bevy_render::view::visibility::Visibility": Inherited,
        "studio::anim::timeline_animation::TransformKeyframe": (
          incoming_easing: Linear,
          affect_translation: true,
          affect_rotation: true,
          affect_scale: true,
        ),
        "studio::anim::timeline_animation::Keyframe": (
          target: Uuid("8c5f79d4-6093-4372-9d2c-722353c76013"),
          time: 0.0,
        ),
      },
    ),
    22: (
      components: {
        "bevy_transform::components::transform::Transform": (
          translation: (
            x: -2.1474366,
            y: 11.742281,
            z: 22.233124,
          ),
          rotation: (
            x: 0.0,
            y: 0.0,
            z: 0.0,
            w: 1.0,
          ),
          scale: (
            x: 0.122251,
            y: 0.122251,
            z: 8.75498,
          ),
        ),
        "bevy_render::view::visibility::Visibility": Inherited,
        "studio::anim::timeline_animation::TransformKeyframe": (
          incoming_easing: Linear,
          affect_translation: true,
          affect_rotation: true,
          affect_scale: true,
        ),
        "studio::anim::timeline_animation::Keyframe": (
          target: Uuid("8c5f79d4-6093-4372-9d2c-722353c76013"),
          time: 0.98274034,
        ),
      },
    ),
    23: (
      components: {
        "bevy_transform::components::transform::Transform": (
          translation: (
            x: -6.1651826,
            y: 28.684336,
            z: 21.026539,
          ),
          rotation: (
            x: 0.0,
            y: 0.0,
            z: 0.0,
            w: 1.0,
          ),
          scale: (
            x: 0.122251,
            y: 0.122251,
            z: 8.75498,
          ),
        ),
        "bevy_render::view::visibility::Visibility": Inherited,
        "studio::anim::timeline_animation::TransformKeyframe": (
          incoming_easing: Linear,
          affect_translation: true,
          affect_rotation: true,
          affect_scale: true,
        ),
        "studio::anim::timeline_animation::Keyframe": (
          target: Uuid("b1db578c-b426-414c-bc95-f701f1b9ca41"),
          time: 0.0,
        ),
      },
    ),
    24: (
      components: {
        "bevy_transform::components::transform::Transform": (
          translation: (
            x: -6.1651826,
            y: 28.684336,
            z: 34.293587,
          ),
          rotation: (
            x: 0.0,
            y: 0.0,
            z: 0.0,
            w: 1.0,
          ),
          scale: (
            x: 0.122251,
            y: 0.122251,
            z: 8.75498,
          ),
        ),
        "bevy_render::view::visibility::Visibility": Inherited,
        "studio::anim::timeline_animation::TransformKeyframe": (
          incoming_easing: Linear,
          affect_translation: true,
          affect_rotation: true,
          affect_scale: true,
        ),
        "studio::anim::timeline_animation::Keyframe": (
          target: Uuid("b1db578c-b426-414c-bc95-f701f1b9ca41"),
          time: 0.7156913,
        ),
      },
    ),
    25: (
      components: {
        "bevy_transform::components::transform::Transform": (
          translation: (
            x: -6.1651826,
            y: 26.61894,
            z: 22.791157,
          ),
          rotation: (
            x: 0.0,
            y: 0.0,
            z: 0.0,
            w: 1.0,
          ),
          scale: (
            x: 0.122251,
            y: 0.122251,
            z: 8.75498,
          ),
        ),
        "bevy_render::view::visibility::Visibility": Inherited,
        "studio::anim::timeline_animation::TransformKeyframe": (
          incoming_easing: Linear,
          affect_translation: true,
          affect_rotation: true,
          affect_scale: true,
        ),
        "studio::anim::timeline_animation::Keyframe": (
          target: Uuid("f7567e27-bb0b-4ac7-a840-3c043b8d2ec2"),
          time: 0.0,
        ),
      },
    ),
    26: (
      components: {
        "bevy_transform::components::transform::Transform": (
          translation: (
            x: -6.1651826,
            y: 26.61894,
            z: 38.36416,
          ),
          rotation: (
            x: 0.0,
            y: 0.0,
            z: 0.0,
            w: 1.0,
          ),
          scale: (
            x: 0.122251,
            y: 0.122251,
            z: 8.75498,
          ),
        ),
        "bevy_render::view::visibility::Visibility": Inherited,
        "studio::anim::timeline_animation::TransformKeyframe": (
          incoming_easing: Linear,
          affect_translation: true,
          affect_rotation: true,
          affect_scale: true,
        ),
        "studio::anim::timeline_animation::Keyframe": (
          target: Uuid("f7567e27-bb0b-4ac7-a840-3c043b8d2ec2"),
          time: 0.70500934,
        ),
      },
    ),
    27: (
      components: {
        "bevy_transform::components::transform::Transform": (
          translation: (
            x: 6.205474,
            y: 28.684336,
            z: 21.026539,
          ),
          rotation: (
            x: 0.0,
            y: 0.0,
            z: 0.0,
            w: 1.0,
          ),
          scale: (
            x: 0.122251,
            y: 0.122251,
            z: 8.75498,
          ),
        ),
        "bevy_render::view::visibility::Visibility": Inherited,
        "studio::anim::timeline_animation::TransformKeyframe": (
          incoming_easing: Linear,
          affect_translation: true,
          affect_rotation: true,
          affect_scale: true,
        ),
        "studio::anim::timeline_animation::Keyframe": (
          target: Uuid("48006f09-9f10-477f-8308-02343f34a8c9"),
          time: 0.0,
        ),
      },
    ),
    28: (
      components: {
        "bevy_transform::components::transform::Transform": (
          translation: (
            x: 6.205474,
            y: 26.61894,
            z: 22.791157,
          ),
          rotation: (
            x: 0.0,
            y: 0.0,
            z: 0.0,
            w: 1.0,
          ),
          scale: (
            x: 0.122251,
            y: 0.122251,
            z: 8.75498,
          ),
        ),
        "bevy_render::view::visibility::Visibility": Inherited,
        "studio::anim::timeline_animation::TransformKeyframe": (
          incoming_easing: Linear,
          affect_translation: true,
          affect_rotation: true,
          affect_scale: true,
        ),
        "studio::anim::timeline_animation::Keyframe": (
          target: Uuid("5e2e70d9-5b6d-495b-998d-6a1f6dc2f964"),
          time: 0.0,
        ),
      },
    ),
    29: (
      components: {
        "bevy_transform::components::transform::Transform": (
          translation: (
            x: 6.205474,
            y: 26.61894,
            z: 37.461624,
          ),
          rotation: (
            x: 0.0,
            y: 0.0,
            z: 0.0,
            w: 1.0,
          ),
          scale: (
            x: 0.122251,
            y: 0.122251,
            z: 8.75498,
          ),
        ),
        "bevy_render::view::visibility::Visibility": Inherited,
        "studio::anim::timeline_animation::TransformKeyframe": (
          incoming_easing: Linear,
          affect_translation: true,
          affect_rotation: true,
          affect_scale: true,
        ),
        "studio::anim::timeline_animation::Keyframe": (
          target: Uuid("5e2e70d9-5b6d-495b-998d-6a1f6dc2f964"),
          time: 0.71035033,
        ),
      },
    ),
    30: (
      components: {
        "bevy_transform::components::transform::Transform": (
          translation: (
            x: 6.205474,
            y: 28.684336,
            z: 34.863163,
          ),
          rotation: (
            x: 0.0,
            y: 0.0,
            z: 0.0,
            w: 1.0,
          ),
          scale: (
            x: 0.122251,
            y: 0.122251,
            z: 8.75498,
          ),
        ),
        "bevy_render::view::visibility::Visibility": Inherited,
        "studio::anim::timeline_animation::TransformKeyframe": (
          incoming_easing: Linear,
          affect_translation: true,
          affect_rotation: true,
          affect_scale: true,
        ),
        "studio::anim::timeline_animation::Keyframe": (
          target: Uuid("48006f09-9f10-477f-8308-02343f34a8c9"),
          time: 0.71035033,
        ),
      },
    ),
    31: (
      components: {
        "space_prefab::sub_scene::CollapsedSubScene": ("(\n  resources: {},\n  entities: {\n    31: (\n      components: {\n        \"space_prefab::sub_scene::ChildPath\": ([]),\n        \"bevy_transform::components::transform::Transform\": (\n          translation: (\n            x: 0.0,\n            y: 0.0,\n            z: 0.0,\n          ),\n          rotation: (\n            x: 0.0,\n            y: 0.0,\n            z: 0.0,\n            w: 1.0,\n          ),\n          scale: (\n            x: 1.0,\n            y: 1.0,\n            z: 1.0,\n          ),\n        ),\n        \"bevy_core::name::Name\": (\n          hash: 6313511421271274664,\n          name: \"Scene\",\n        ),\n        \"bevy_render::view::visibility::Visibility\": Inherited,\n        \"space_prefab::component::GltfPrefab\": (\n          path: \"desync.glb\",\n          scene: \"Scene0\",\n        ),\n      },\n    ),\n    36: (\n      components: {\n        \"space_prefab::sub_scene::ChildPath\": ([\n          0,\n        ]),\n        \"bevy_transform::components::transform::Transform\": (\n          translation: (\n            x: 0.0,\n            y: 0.0,\n            z: 0.0,\n          ),\n          rotation: (\n            x: 0.0,\n            y: 0.0,\n            z: 0.0,\n            w: 1.0,\n          ),\n          scale: (\n            x: 1.0,\n            y: 1.0,\n            z: 1.0,\n          ),\n        ),\n        \"bevy_render::view::visibility::Visibility\": Inherited,\n        \"space_prefab::save::ChildrenPrefab\": ([\n          37,\n          38,\n          39,\n          40,\n          41,\n          42,\n          43,\n          44,\n          45,\n          46,\n          47,\n          48,\n          49,\n          50,\n          51,\n          52,\n          53,\n          54,\n        ]),\n      },\n    ),\n    37: (\n      components: {\n        \"space_prefab::sub_scene::ChildPath\": ([\n          0,\n          0,\n        ]),\n        \"bevy_transform::components::transform::Transform\": (\n          translation: (\n            x: 0.0,\n            y: -0.25713548,\n            z: -4.3361616,\n          ),\n          rotation: (\n            x: 0.0,\n            y: 0.0,\n            z: 0.0,\n            w: 1.0,\n          ),\n          scale: (\n            x: 1.0,\n            y: 1.0,\n            z: 1.0,\n          ),\n        ),\n        \"bevy_core::name::Name\": (\n          hash: 17930118900081507113,\n          name: \"empty.026\",\n        ),\n        \"bevy_render::view::visibility::Visibility\": Inherited,\n      },\n    ),\n    38: (\n      components: {\n        \"space_prefab::sub_scene::ChildPath\": ([\n          0,\n          1,\n        ]),\n        \"bevy_transform::components::transform::Transform\": (\n          translation: (\n            x: 0.0,\n            y: -0.45699087,\n            z: -4.3361616,\n          ),\n          rotation: (\n            x: 0.0,\n            y: 0.0,\n            z: 0.0,\n            w: 1.0,\n          ),\n          scale: (\n            x: 1.0,\n            y: 1.0,\n            z: 1.0,\n          ),\n        ),\n        \"bevy_core::name::Name\": (\n          hash: 2932322132067973075,\n          name: \"empty.027\",\n        ),\n        \"bevy_render::view::visibility::Visibility\": Inherited,\n      },\n    ),\n    39: (\n      components: {\n        \"space_prefab::sub_scene::ChildPath\": ([\n          0,\n          2,\n        ]),\n        \"bevy_transform::components::transform::Transform\": (\n          translation: (\n            x: 0.0,\n            y: 0.0,\n            z: 0.0,\n          ),\n          rotation: (\n            x: 0.0,\n            y: 0.0,\n            z: 0.0,\n            w: 1.0,\n          ),\n          scale: (\n            x: 1.0,\n            y: 1.0,\n            z: 1.0,\n          ),\n        ),\n        \"bevy_core::name::Name\": (\n          hash: 13395407226770374147,\n          name: \"empty.028\",\n        ),\n        \"bevy_render::view::visibility::Visibility\": Inherited,\n      },\n    ),\n    40: (\n      components: {\n        \"space_prefab::sub_scene::ChildPath\": ([\n          0,\n          3,\n        ]),\n        \"bevy_transform::components::transform::Transform\": (\n          translation: (\n            x: 0.0,\n            y: 0.0,\n            z: 0.0,\n          ),\n          rotation: (\n            x: 0.0,\n            y: 0.0,\n            z: 0.0,\n            w: 1.0,\n          ),\n          scale: (\n            x: 1.0,\n            y: 1.0,\n            z: 1.0,\n          ),\n        ),\n        \"bevy_core::name::Name\": (\n          hash: 15213343571318681368,\n          name: \"empty.029\",\n        ),\n        \"bevy_render::view::visibility::Visibility\": Inherited,\n      },\n    ),\n    41: (\n      components: {\n        \"space_prefab::sub_scene::ChildPath\": ([\n          0,\n          4,\n        ]),\n        \"bevy_transform::components::transform::Transform\": (\n          translation: (\n            x: 0.0,\n            y: -0.55585074,\n            z: -4.3361616,\n          ),\n          rotation: (\n            x: 0.0,\n            y: 0.0,\n            z: 0.0,\n            w: 1.0,\n          ),\n          scale: (\n            x: 1.0,\n            y: 1.0,\n            z: 1.0,\n          ),\n        ),\n        \"bevy_core::name::Name\": (\n          hash: 6637236937475434455,\n          name: \"empty.030\",\n        ),\n        \"bevy_render::view::visibility::Visibility\": Inherited,\n      },\n    ),\n    42: (\n      components: {\n        \"space_prefab::sub_scene::ChildPath\": ([\n          0,\n          5,\n        ]),\n        \"bevy_transform::components::transform::Transform\": (\n          translation: (\n            x: 0.0,\n            y: 0.0,\n            z: 0.0,\n          ),\n          rotation: (\n            x: 0.0,\n            y: 0.0,\n            z: 0.0,\n            w: 1.0,\n          ),\n          scale: (\n            x: 1.0,\n            y: 1.0,\n            z: 1.0,\n          ),\n        ),\n        \"bevy_core::name::Name\": (\n          hash: 2359233632329934770,\n          name: \"empty.031\",\n        ),\n        \"bevy_render::view::visibility::Visibility\": Inherited,\n      },\n    ),\n    43: (\n      components: {\n        \"space_prefab::sub_scene::ChildPath\": ([\n          0,\n          6,\n        ]),\n        \"bevy_transform::components::transform::Transform\": (\n          translation: (\n            x: 37.414967,\n            y: 61.1213,\n            z: 112.0113,\n          ),\n          rotation: (\n            x: -0.30626115,\n            y: 0.43745646,\n            z: -0.16405046,\n            w: 0.8294115,\n          ),\n          scale: (\n            x: 2.0169291,\n            y: 2.016929,\n            z: 2.016929,\n          ),\n        ),\n        \"bevy_core::name::Name\": (\n          hash: 1734594374362272207,\n          name: \"Sun\",\n        ),\n        \"bevy_render::view::visibility::Visibility\": Inherited,\n        \"space_prefab::save::ChildrenPrefab\": ([\n          55,\n        ]),\n      },\n    ),\n    44: (\n      components: {\n        \"space_prefab::sub_scene::ChildPath\": ([\n          0,\n          7,\n        ]),\n        \"bevy_transform::components::transform::Transform\": (\n          translation: (\n            x: 0.0,\n            y: 27.426285,\n            z: 0.00000051081065,\n          ),\n          rotation: (\n            x: 0.7071068,\n            y: 0.0,\n            z: 0.0,\n            w: 0.70710677,\n          ),\n          scale: (\n            x: 0.01,\n            y: 0.010000001,\n            z: 0.010000001,\n          ),\n        ),\n        \"bevy_core::name::Name\": (\n          hash: 5100648900209823736,\n          name: \"StarFighterA.001\",\n        ),\n        \"bevy_render::view::visibility::Visibility\": Inherited,\n        \"space_prefab::save::ChildrenPrefab\": ([\n          56,\n        ]),\n        \"studio::scene::SceneElement\": Mesh,\n        \"studio::anim::timeline_animation::AnimationTarget\": Uuid(\"2c3faa37-9320-4bc7-825f-75b745477901\"),\n      },\n    ),\n    45: (\n      components: {\n        \"space_prefab::sub_scene::ChildPath\": ([\n          0,\n          8,\n        ]),\n        \"bevy_transform::components::transform::Transform\": (\n          translation: (\n            x: -6.1651826,\n            y: 28.684336,\n            z: 21.026539,\n          ),\n          rotation: (\n            x: 0.0,\n            y: 0.0,\n            z: 0.0,\n            w: 1.0,\n          ),\n          scale: (\n            x: 0.122251,\n            y: 0.122251,\n            z: 8.75498,\n          ),\n        ),\n        \"bevy_core::name::Name\": (\n          hash: 2356508911138325861,\n          name: \"LaserA\",\n        ),\n        \"bevy_render::view::visibility::Visibility\": Inherited,\n        \"space_prefab::save::ChildrenPrefab\": ([\n          57,\n        ]),\n        \"studio::scene::SceneElement\": Mesh,\n        \"studio::anim::timeline_animation::AnimationTarget\": Uuid(\"b1db578c-b426-414c-bc95-f701f1b9ca41\"),\n      },\n    ),\n    46: (\n      components: {\n        \"space_prefab::sub_scene::ChildPath\": ([\n          0,\n          9,\n        ]),\n        \"bevy_transform::components::transform::Transform\": (\n          translation: (\n            x: -9.611355,\n            y: 20.93744,\n            z: -28.69173,\n          ),\n          rotation: (\n            x: 0.0,\n            y: 0.0,\n            z: 0.0,\n            w: 1.0,\n          ),\n          scale: (\n            x: 0.122251,\n            y: 0.122251,\n            z: 8.75498,\n          ),\n        ),\n        \"bevy_core::name::Name\": (\n          hash: 3771605970233175782,\n          name: \"LaserA.001\",\n        ),\n        \"bevy_render::view::visibility::Visibility\": Inherited,\n        \"space_prefab::save::ChildrenPrefab\": ([\n          58,\n        ]),\n        \"studio::scene::SceneElement\": Mesh,\n        \"studio::anim::timeline_animation::AnimationTarget\": Uuid(\"2b76e191-e079-417a-9369-2443f21f3ce5\"),\n      },\n    ),\n    47: (\n      components: {\n        \"space_prefab::sub_scene::ChildPath\": ([\n          0,\n          10,\n        ]),\n        \"bevy_transform::components::transform::Transform\": (\n          translation: (\n            x: -9.611355,\n            y: 11.742281,\n            z: -28.69173,\n          ),\n          rotation: (\n            x: 0.0,\n            y: 0.0,\n            z: 0.0,\n            w: 1.0,\n          ),\n          scale: (\n            x: 0.122251,\n            y: 0.122251,\n            z: 8.75498,\n          ),\n        ),\n        \"bevy_core::name::Name\": (\n          hash: 9811213967899955357,\n          name: \"LaserA.002\",\n        ),\n        \"bevy_render::view::visibility::Visibility\": Inherited,\n        \"space_prefab::save::ChildrenPrefab\": ([\n          59,\n        ]),\n        \"studio::scene::SceneElement\": Mesh,\n        \"studio::anim::timeline_animation::AnimationTarget\": Uuid(\"408b5d7e-9456-4d81-a08e-feebba2ce1c4\"),\n      },\n    ),\n    48: (\n      components: {\n        \"space_prefab::sub_scene::ChildPath\": ([\n          0,\n          11,\n        ]),\n        \"bevy_transform::components::transform::Transform\": (\n          translation: (\n            x: -2.1474366,\n            y: 20.93744,\n            z: -28.69173,\n          ),\n          rotation: (\n            x: 0.0,\n            y: 0.0,\n            z: 0.0,\n            w: 1.0,\n          ),\n          scale: (\n            x: 0.122251,\n            y: 0.122251,\n            z: 8.75498,\n          ),\n        ),\n        \"bevy_core::name::Name\": (\n          hash: 4239528607526478068,\n          name: \"LaserA.003\",\n        ),\n        \"bevy_render::view::visibility::Visibility\": Inherited,\n        \"space_prefab::save::ChildrenPrefab\": ([\n          60,\n        ]),\n        \"studio::scene::SceneElement\": Mesh,\n        \"studio::anim::timeline_animation::AnimationTarget\": Uuid(\"38601448-b10c-43ec-91de-367e51c06daf\"),\n      },\n    ),\n    49: (\n      components: {\n        \"space_prefab::sub_scene::ChildPath\": ([\n          0,\n          12,\n        ]),\n        \"bevy_transform::components::transform::Transform\": (\n          translation: (\n            x: -2.1474366,\n            y: 11.742281,\n            z: -28.69173,\n          ),\n          rotation: (\n            x: 0.0,\n            y: 0.0,\n            z: 0.0,\n            w: 1.0,\n          ),\n          scale: (\n            x: 0.122251,\n            y: 0.122251,\n            z: 8.75498,\n          ),\n        ),\n        \"bevy_core::name::Name\": (\n          hash: 17360688022630626399,\n          name: \"LaserA.004\",\n        ),\n        \"bevy_render::view::visibility::Visibility\": Inherited,\n        \"space_prefab::save::ChildrenPrefab\": ([\n          61,\n        ]),\n        \"studio::scene::SceneElement\": Mesh,\n        \"studio::anim::timeline_animation::AnimationTarget\": Uuid(\"8c5f79d4-6093-4372-9d2c-722353c76013\"),\n      },\n    ),\n    50: (\n      components: {\n        \"space_prefab::sub_scene::ChildPath\": ([\n          0,\n          13,\n        ]),\n        \"bevy_transform::components::transform::Transform\": (\n          translation: (\n            x: 6.205474,\n            y: 28.684336,\n            z: 34.863163,\n          ),\n          rotation: (\n            x: 0.0,\n            y: 0.0,\n            z: 0.0,\n            w: 1.0,\n          ),\n          scale: (\n            x: 0.122251,\n            y: 0.122251,\n            z: 8.75498,\n          ),\n        ),\n        \"bevy_core::name::Name\": (\n          hash: 2771954425045718751,\n          name: \"LaserA.005\",\n        ),\n        \"bevy_render::view::visibility::Visibility\": Inherited,\n        \"space_prefab::save::ChildrenPrefab\": ([\n          62,\n        ]),\n        \"studio::scene::SceneElement\": Mesh,\n        \"studio::anim::timeline_animation::AnimationTarget\": Uuid(\"48006f09-9f10-477f-8308-02343f34a8c9\"),\n      },\n    ),\n    51: (\n      components: {\n        \"space_prefab::sub_scene::ChildPath\": ([\n          0,\n          14,\n        ]),\n        \"bevy_transform::components::transform::Transform\": (\n          translation: (\n            x: -6.1651826,\n            y: 26.61894,\n            z: 22.791157,\n          ),\n          rotation: (\n            x: 0.0,\n            y: 0.0,\n            z: 0.0,\n            w: 1.0,\n          ),\n          scale: (\n            x: 0.122251,\n            y: 0.122251,\n            z: 8.75498,\n          ),\n        ),\n        \"bevy_core::name::Name\": (\n          hash: 17690120629478967177,\n          name: \"LaserA.006\",\n        ),\n        \"bevy_render::view::visibility::Visibility\": Inherited,\n        \"space_prefab::save::ChildrenPrefab\": ([\n          63,\n        ]),\n        \"studio::scene::SceneElement\": Mesh,\n        \"studio::anim::timeline_animation::AnimationTarget\": Uuid(\"f7567e27-bb0b-4ac7-a840-3c043b8d2ec2\"),\n      },\n    ),\n    52: (\n      components: {\n        \"space_prefab::sub_scene::ChildPath\": ([\n          0,\n          15,\n        ]),\n        \"bevy_transform::components::transform::Transform\": (\n          translation: (\n            x: 6.205474,\n            y: 26.61894,\n            z: 22.791157,\n          ),\n          rotation: (\n            x: 0.0,\n            y: 0.0,\n            z: 0.0,\n            w: 1.0,\n          ),\n          scale: (\n            x: 0.122251,\n            y: 0.122251,\n            z: 8.75498,\n          ),\n        ),\n        \"bevy_core::name::Name\": (\n          hash: 16845800620004850392,\n          name: \"LaserA.007\",\n        ),\n        \"bevy_render::view::visibility::Visibility\": Inherited,\n        \"space_prefab::save::ChildrenPrefab\": ([\n          64,\n        ]),\n        \"studio::scene::SceneElement\": Mesh,\n        \"studio::anim::timeline_animation::AnimationTarget\": Uuid(\"5e2e70d9-5b6d-495b-998d-6a1f6dc2f964\"),\n      },\n    ),\n    53: (\n      components: {\n        \"space_prefab::sub_scene::ChildPath\": ([\n          0,\n          16,\n        ]),\n        \"bevy_transform::components::transform::Transform\": (\n          translation: (\n            x: 0.0,\n            y: 7.8028564,\n            z: -77.33632,\n          ),\n          rotation: (\n            x: 0.0,\n            y: 0.0,\n            z: 0.0,\n            w: 1.0,\n          ),\n          scale: (\n            x: 1.0,\n            y: 1.0,\n            z: 1.0,\n          ),\n        ),\n        \"bevy_core::name::Name\": (\n          hash: 4339032300311916617,\n          name: \"Trench_merged\",\n        ),\n        \"bevy_render::view::visibility::Visibility\": Inherited,\n        \"space_prefab::save::ChildrenPrefab\": ([\n          65,\n        ]),\n        \"studio::scene::SceneElement\": Mesh,\n        \"studio::anim::timeline_animation::AnimationTarget\": Uuid(\"4499fa6b-3ebd-410c-bee7-72d373e1aabb\"),\n      },\n    ),\n    54: (\n      components: {\n        \"space_prefab::sub_scene::ChildPath\": ([\n          0,\n          17,\n        ]),\n        \"bevy_transform::components::transform::Transform\": (\n          translation: (\n            x: 0.90368176,\n            y: 19.253796,\n            z: -44.12696,\n          ),\n          rotation: (\n            x: 0.7071068,\n            y: 0.0,\n            z: 0.0,\n            w: 0.70710677,\n          ),\n          scale: (\n            x: 0.01,\n            y: 0.010000001,\n            z: 0.010000001,\n          ),\n        ),\n        \"bevy_core::name::Name\": (\n          hash: 14408680411555793288,\n          name: \"StarFighterB\",\n        ),\n        \"bevy_render::view::visibility::Visibility\": Inherited,\n        \"space_prefab::save::ChildrenPrefab\": ([\n          66,\n        ]),\n        \"studio::scene::SceneElement\": Mesh,\n        \"studio::anim::timeline_animation::AnimationTarget\": Uuid(\"34f59412-5a7b-44e9-aaa3-3e74840121c9\"),\n      },\n    ),\n    55: (\n      components: {\n        \"space_prefab::sub_scene::ChildPath\": ([\n          0,\n          6,\n          0,\n        ]),\n        \"bevy_transform::components::transform::Transform\": (\n          translation: (\n            x: 0.0,\n            y: 0.0,\n            z: 0.0,\n          ),\n          rotation: (\n            x: 0.0,\n            y: 0.0,\n            z: 0.0,\n            w: 1.0,\n          ),\n          scale: (\n            x: 1.0,\n            y: 1.0,\n            z: 1.0,\n          ),\n        ),\n        \"bevy_core::name::Name\": (\n          hash: 1734594374362272207,\n          name: \"Sun\",\n        ),\n        \"bevy_render::view::visibility::Visibility\": Inherited,\n        \"bevy_pbr::light::DirectionalLight\": (\n          color: Rgba(\n            red: 1.0,\n            green: 1.0,\n            blue: 1.0,\n            alpha: 1.0,\n          ),\n          illuminance: 34150.0,\n          shadows_enabled: false,\n          shadow_depth_bias: 0.02,\n          shadow_normal_bias: 1.8,\n        ),\n      },\n    ),\n    56: (\n      components: {\n        \"space_prefab::sub_scene::ChildPath\": ([\n          0,\n          7,\n          0,\n        ]),\n        \"bevy_transform::components::transform::Transform\": (\n          translation: (\n            x: 0.0,\n            y: 0.0,\n            z: 0.0,\n          ),\n          rotation: (\n            x: 0.0,\n            y: 0.0,\n            z: 0.0,\n            w: 1.0,\n          ),\n          scale: (\n            x: 1.0,\n            y: 1.0,\n            z: 1.0,\n          ),\n        ),\n        \"bevy_core::name::Name\": (\n          hash: 9518542504113058593,\n          name: \"StarFighterA\",\n        ),\n        \"bevy_render::view::visibility::Visibility\": Inherited,\n        \"studio::ui::inspector::ShortMaterial\": (\n          base_color: RgbaLinear(\n            red: 1.0,\n            green: 1.0,\n            blue: 1.0,\n            alpha: 1.0,\n          ),\n          perceptual_roughness: 0.09210527,\n          metallic: 0.0,\n          reflectance: 0.5,\n        ),\n      },\n    ),\n    57: (\n      components: {\n        \"space_prefab::sub_scene::ChildPath\": ([\n          0,\n          8,\n          0,\n        ]),\n        \"bevy_transform::components::transform::Transform\": (\n          translation: (\n            x: 0.0,\n            y: 0.0,\n            z: 0.0,\n          ),\n          rotation: (\n            x: 0.0,\n            y: 0.0,\n            z: 0.0,\n            w: 1.0,\n          ),\n          scale: (\n            x: 1.0,\n            y: 1.0,\n            z: 1.0,\n          ),\n        ),\n        \"bevy_core::name::Name\": (\n          hash: 516045924745151091,\n          name: \"Cube.305\",\n        ),\n        \"bevy_render::view::visibility::Visibility\": Inherited,\n        \"studio::ui::inspector::ShortMaterial\": (\n          base_color: RgbaLinear(\n            red: 0.0,\n            green: 0.0,\n            blue: 0.0,\n            alpha: 1.0,\n          ),\n          perceptual_roughness: 0.5,\n          metallic: 0.0,\n          reflectance: 0.5,\n        ),\n      },\n    ),\n    58: (\n      components: {\n        \"space_prefab::sub_scene::ChildPath\": ([\n          0,\n          9,\n          0,\n        ]),\n        \"bevy_transform::components::transform::Transform\": (\n          translation: (\n            x: 0.0,\n            y: 0.0,\n            z: 0.0,\n          ),\n          rotation: (\n            x: 0.0,\n            y: 0.0,\n            z: 0.0,\n            w: 1.0,\n          ),\n          scale: (\n            x: 1.0,\n            y: 1.0,\n            z: 1.0,\n          ),\n        ),\n        \"bevy_core::name::Name\": (\n          hash: 11455141375658386197,\n          name: \"Cube.306\",\n        ),\n        \"bevy_render::view::visibility::Visibility\": Inherited,\n        \"studio::ui::inspector::ShortMaterial\": (\n          base_color: RgbaLinear(\n            red: 1.0,\n            green: 0.24252349,\n            blue: 0.26523626,\n            alpha: 1.0,\n          ),\n          perceptual_roughness: 0.5,\n          metallic: 0.0,\n          reflectance: 0.5,\n        ),\n      },\n    ),\n    59: (\n      components: {\n        \"space_prefab::sub_scene::ChildPath\": ([\n          0,\n          10,\n          0,\n        ]),\n        \"bevy_transform::components::transform::Transform\": (\n          translation: (\n            x: 0.0,\n            y: 0.0,\n            z: 0.0,\n          ),\n          rotation: (\n            x: 0.0,\n            y: 0.0,\n            z: 0.0,\n            w: 1.0,\n          ),\n          scale: (\n            x: 1.0,\n            y: 1.0,\n            z: 1.0,\n          ),\n        ),\n        \"bevy_core::name::Name\": (\n          hash: 7710930313815418106,\n          name: \"Cube.307\",\n        ),\n        \"bevy_render::view::visibility::Visibility\": Inherited,\n        \"studio::ui::inspector::ShortMaterial\": (\n          base_color: RgbaLinear(\n            red: 1.0,\n            green: 0.24252349,\n            blue: 0.26523626,\n            alpha: 1.0,\n          ),\n          perceptual_roughness: 0.5,\n          metallic: 0.0,\n          reflectance: 0.5,\n        ),\n      },\n    ),\n    60: (\n      components: {\n        \"space_prefab::sub_scene::ChildPath\": ([\n          0,\n          11,\n          0,\n        ]),\n        \"bevy_transform::components::transform::Transform\": (\n          translation: (\n            x: 0.0,\n            y: 0.0,\n            z: 0.0,\n          ),\n          rotation: (\n            x: 0.0,\n            y: 0.0,\n            z: 0.0,\n            w: 1.0,\n          ),\n          scale: (\n            x: 1.0,\n            y: 1.0,\n            z: 1.0,\n          ),\n        ),\n        \"bevy_core::name::Name\": (\n          hash: 2006570935111361085,\n          name: \"Cube.308\",\n        ),\n        \"bevy_render::view::visibility::Visibility\": Inherited,\n        \"studio::ui::inspector::ShortMaterial\": (\n          base_color: RgbaLinear(\n            red: 1.0,\n            green: 0.24252349,\n            blue: 0.26523626,\n            alpha: 1.0,\n          ),\n          perceptual_roughness: 0.5,\n          metallic: 0.0,\n          reflectance: 0.5,\n        ),\n      },\n    ),\n    61: (\n      components: {\n        \"space_prefab::sub_scene::ChildPath\": ([\n          0,\n          12,\n          0,\n        ]),\n        \"bevy_transform::components::transform::Transform\": (\n          translation: (\n            x: 0.0,\n            y: 0.0,\n            z: 0.0,\n          ),\n          rotation: (\n            x: 0.0,\n            y: 0.0,\n            z: 0.0,\n            w: 1.0,\n          ),\n          scale: (\n            x: 1.0,\n            y: 1.0,\n            z: 1.0,\n          ),\n        ),\n        \"bevy_core::name::Name\": (\n          hash: 18402460489604278594,\n          name: \"Cube.309\",\n        ),\n        \"bevy_render::view::visibility::Visibility\": Inherited,\n        \"studio::ui::inspector::ShortMaterial\": (\n          base_color: RgbaLinear(\n            red: 1.0,\n            green: 0.24252349,\n            blue: 0.26523626,\n            alpha: 1.0,\n          ),\n          perceptual_roughness: 0.5,\n          metallic: 0.0,\n          reflectance: 0.5,\n        ),\n      },\n    ),\n    62: (\n      components: {\n        \"space_prefab::sub_scene::ChildPath\": ([\n          0,\n          13,\n          0,\n        ]),\n        \"bevy_transform::components::transform::Transform\": (\n          translation: (\n            x: 0.0,\n            y: 0.0,\n            z: 0.0,\n          ),\n          rotation: (\n            x: 0.0,\n            y: 0.0,\n            z: 0.0,\n            w: 1.0,\n          ),\n          scale: (\n            x: 1.0,\n            y: 1.0,\n            z: 1.0,\n          ),\n        ),\n        \"bevy_core::name::Name\": (\n          hash: 11261500935898758914,\n          name: \"Cube.310\",\n        ),\n        \"bevy_render::view::visibility::Visibility\": Inherited,\n        \"studio::ui::inspector::ShortMaterial\": (\n          base_color: RgbaLinear(\n            red: 0.0,\n            green: 0.0,\n            blue: 0.0,\n            alpha: 1.0,\n          ),\n          perceptual_roughness: 0.5,\n          metallic: 0.0,\n          reflectance: 0.5,\n        ),\n      },\n    ),\n    63: (\n      components: {\n        \"space_prefab::sub_scene::ChildPath\": ([\n          0,\n          14,\n          0,\n        ]),\n        \"bevy_transform::components::transform::Transform\": (\n          translation: (\n            x: 0.0,\n            y: 0.0,\n            z: 0.0,\n          ),\n          rotation: (\n            x: 0.0,\n            y: 0.0,\n            z: 0.0,\n            w: 1.0,\n          ),\n          scale: (\n            x: 1.0,\n            y: 1.0,\n            z: 1.0,\n          ),\n        ),\n        \"bevy_core::name::Name\": (\n          hash: 12965872175589560571,\n          name: \"Cube.311\",\n        ),\n        \"bevy_render::view::visibility::Visibility\": Inherited,\n        \"studio::ui::inspector::ShortMaterial\": (\n          base_color: RgbaLinear(\n            red: 0.0,\n            green: 0.0,\n            blue: 0.0,\n            alpha: 1.0,\n          ),\n          perceptual_roughness: 0.5,\n          metallic: 0.0,\n          reflectance: 0.5,\n        ),\n      },\n    ),\n    64: (\n      components: {\n        \"space_prefab::sub_scene::ChildPath\": ([\n          0,\n          15,\n          0,\n        ]),\n        \"bevy_transform::components::transform::Transform\": (\n          translation: (\n            x: 0.0,\n            y: 0.0,\n            z: 0.0,\n          ),\n          rotation: (\n            x: 0.0,\n            y: 0.0,\n            z: 0.0,\n            w: 1.0,\n          ),\n          scale: (\n            x: 1.0,\n            y: 1.0,\n            z: 1.0,\n          ),\n        ),\n        \"bevy_core::name::Name\": (\n          hash: 12943195592201606100,\n          name: \"Cube.312\",\n        ),\n        \"bevy_render::view::visibility::Visibility\": Inherited,\n        \"studio::ui::inspector::ShortMaterial\": (\n          base_color: RgbaLinear(\n            red: 0.0,\n            green: 0.0,\n            blue: 0.0,\n            alpha: 1.0,\n          ),\n          perceptual_roughness: 0.5,\n          metallic: 0.0,\n          reflectance: 0.5,\n        ),\n      },\n    ),\n    65: (\n      components: {\n        \"space_prefab::sub_scene::ChildPath\": ([\n          0,\n          16,\n          0,\n        ]),\n        \"bevy_transform::components::transform::Transform\": (\n          translation: (\n            x: 0.0,\n            y: 0.0,\n            z: 0.0,\n          ),\n          rotation: (\n            x: 0.0,\n            y: 0.0,\n            z: 0.0,\n            w: 1.0,\n          ),\n          scale: (\n            x: 1.0,\n            y: 1.0,\n            z: 1.0,\n          ),\n        ),\n        \"bevy_core::name::Name\": (\n          hash: 14833676912841048273,\n          name: \"Cube.215\",\n        ),\n        \"bevy_render::view::visibility::Visibility\": Inherited,\n        \"studio::ui::inspector::ShortMaterial\": (\n          base_color: RgbaLinear(\n            red: 1.0,\n            green: 1.0,\n            blue: 1.0,\n            alpha: 1.0,\n          ),\n          perceptual_roughness: 0.46721607,\n          metallic: 0.0,\n          reflectance: 0.5,\n        ),\n      },\n    ),\n    66: (\n      components: {\n        \"space_prefab::sub_scene::ChildPath\": ([\n          0,\n          17,\n          0,\n        ]),\n        \"bevy_transform::components::transform::Transform\": (\n          translation: (\n            x: 0.0,\n            y: 0.0,\n            z: 0.0,\n          ),\n          rotation: (\n            x: 0.0,\n            y: 0.0,\n            z: 0.0,\n            w: 1.0,\n          ),\n          scale: (\n            x: 1.0,\n            y: 1.0,\n            z: 1.0,\n          ),\n        ),\n        \"bevy_core::name::Name\": (\n          hash: 14408680411555793288,\n          name: \"StarFighterB\",\n        ),\n        \"bevy_render::view::visibility::Visibility\": Inherited,\n        \"studio::ui::inspector::ShortMaterial\": (\n          base_color: RgbaLinear(\n            red: 1.0,\n            green: 1.0,\n            blue: 1.0,\n            alpha: 1.0,\n          ),\n          perceptual_roughness: 1.0,\n          metallic: 0.0,\n          reflectance: 0.5,\n        ),\n      },\n    ),\n  },\n)"),
        "space_prefab::sub_scene::ChildPath": ([]),
        "bevy_transform::components::transform::Transform": (
          translation: (
            x: 0.0,
            y: 0.0,
            z: 0.0,
          ),
          rotation: (
            x: 0.0,
            y: 0.0,
            z: 0.0,
            w: 1.0,
          ),
          scale: (
            x: 1.0,
            y: 1.0,
            z: 1.0,
          ),
        ),
        "bevy_core::name::Name": (
          hash: 6313511421271274664,
          name: "Scene",
        ),
        "bevy_render::view::visibility::Visibility": Inherited,
        "space_prefab::component::GltfPrefab": (
          path: "desync.glb",
          scene: "Scene0",
        ),
      },
    ),
    32: (
      components: {
        "bevy_transform::components::transform::Transform": (
          translation: (
            x: 0.0,
            y: 27.808878,
            z: 0.0,
          ),
          rotation: (
            x: 0.70710677,
            y: 0.0,
            z: 0.0,
            w: 0.7071067,
          ),
          scale: (
            x: 0.01,
            y: 0.010000001,
            z: 0.010000001,
          ),
        ),
        "bevy_render::view::visibility::Visibility": Inherited,
        "studio::anim::timeline_animation::TransformKeyframe": (
          incoming_easing: Linear,
          affect_translation: true,
          affect_rotation: true,
          affect_scale: true,
        ),
        "studio::anim::timeline_animation::Keyframe": (
          target: Uuid("2c3faa37-9320-4bc7-825f-75b745477901"),
          time: 0.0,
        ),
      },
    ),
    33: (
      components: {
        "bevy_transform::components::transform::Transform": (
          translation: (
            x: -26.600437,
            y: 57.639946,
            z: 45.259254,
          ),
          rotation: (
            x: -0.323544,
            y: -0.2166858,
            z: -0.07637838,
            w: 0.91789585,
          ),
          scale: (
            x: 1.0,
            y: 1.0,
            z: 1.0,
          ),
        ),
        "bevy_render::view::visibility::Visibility": Inherited,
        "studio::anim::timeline_animation::TransformKeyframe": (
          incoming_easing: Linear,
          affect_translation: true,
          affect_rotation: true,
          affect_scale: true,
        ),
        "studio::anim::timeline_animation::Keyframe": (
          target: MainCamera,
          time: 0.0,
        ),
      },
    ),
    34: (
      components: {
        "bevy_transform::components::transform::Transform": (
          translation: (
            x: 0.0,
            y: 7.8028564,
            z: -77.33632,
          ),
          rotation: (
            x: 0.0,
            y: 0.0,
            z: 0.0,
            w: 1.0,
          ),
          scale: (
            x: 1.0,
            y: 1.0,
            z: 1.0,
          ),
        ),
        "bevy_render::view::visibility::Visibility": Inherited,
        "studio::anim::timeline_animation::TransformKeyframe": (
          incoming_easing: Linear,
          affect_translation: true,
          affect_rotation: true,
          affect_scale: true,
        ),
        "studio::anim::timeline_animation::Keyframe": (
          target: Uuid("4499fa6b-3ebd-410c-bee7-72d373e1aabb"),
          time: 0.0,
        ),
      },
    ),
    35: (
      components: {
        "bevy_transform::components::transform::Transform": (
          translation: (
            x: 0.0,
            y: 7.8028564,
            z: -297.5813,
          ),
          rotation: (
            x: 0.0,
            y: 0.0,
            z: 0.0,
            w: 1.0,
          ),
          scale: (
            x: 1.0,
            y: 1.0,
            z: 1.0,
          ),
        ),
        "bevy_render::view::visibility::Visibility": Inherited,
        "studio::anim::timeline_animation::TransformKeyframe": (
          incoming_easing: Linear,
          affect_translation: true,
          affect_rotation: true,
          affect_scale: true,
        ),
        "studio::anim::timeline_animation::Keyframe": (
          target: Uuid("4499fa6b-3ebd-410c-bee7-72d373e1aabb"),
          time: 3.037852,
        ),
      },
    ),
    4294967303: (
      components: {
        "bevy_transform::components::transform::Transform": (
          translation: (
            x: -7.1710815,
            y: 43.12783,
            z: 30.99612,
          ),
          rotation: (
            x: -0.29587442,
            y: -0.08895508,
            z: -0.02768518,
            w: 0.9506726,
          ),
          scale: (
            x: 1.0,
            y: 1.0,
            z: 1.0,
          ),
        ),
        "bevy_render::view::visibility::Visibility": Inherited,
        "studio::anim::timeline_animation::TransformKeyframe": (
          incoming_easing: Linear,
          affect_translation: true,
          affect_rotation: true,
          affect_scale: true,
        ),
        "studio::anim::timeline_animation::Keyframe": (
          target: MainCamera,
          time: 3.0597014,
        ),
      },
    ),
  },
)

================================================
FILE: studio/assets/textures/21-renewal-wire-wall-clockmini_basecolor.png.meta
================================================
(
    meta_format_version: "1.0",
    asset: Load(
        loader: "bevy_render::texture::image_loader::ImageLoader",
        settings: (
            format: FromExtension,
            is_srgb: true,
            sampler: Default,
        ),
    ),
)

================================================
FILE: studio/assets/textures/21-renewal-wire-wall-clockmini_normal.png.meta
================================================
(
    meta_format_version: "1.0",
    asset: Load(
        loader: "bevy_render::texture::image_loader::ImageLoader",
        settings: (
            format: FromExtension,
            is_srgb: true,
            sampler: Default,
        ),
    ),
)

================================================
FILE: studio/assets/textures/21-renewal-wire-wall-clockmini_occlusionroughnessmetallic.png.meta
================================================
(
    meta_format_version: "1.0",
    asset: Load(
        loader: "bevy_render::texture::image_loader::ImageLoader",
        settings: (
            format: FromExtension,
            is_srgb: true,
            sampler: Default,
        ),
    ),
)

================================================
FILE: studio/assets/textures/230510_b_basecolor.png.meta
================================================
(
    meta_format_version: "1.0",
    asset: Load(
        loader: "bevy_render::texture::image_loader::ImageLoader",
        settings: (
            format: FromExtension,
            is_srgb: true,
            sampler: Default,
        ),
    ),
)

================================================
FILE: studio/assets/textures/230510_b_normal.png.meta
================================================
(
    meta_format_version: "1.0",
    asset: Load(
        loader: "bevy_render::texture::image_loader::ImageLoader",
        settings: (
            format: FromExtension,
            is_srgb: true,
            sampler: Default,
        ),
    ),
)

================================================
FILE: studio/assets/textures/230510_b_occlusionroughnessmetallic.png.meta
================================================
(
    meta_format_version: "1.0",
    asset: Load(
        loader: "bevy_render::texture::image_loader::ImageLoader",
        settings: (
            format: FromExtension,
            is_srgb: true,
            sampler: Default,
        ),
    ),
)

================================================
FILE: studio/assets/textures/3d66_su_1587004247754_0012.png.meta
================================================
(
    meta_format_version: "1.0",
    asset: Load(
        loader: "bevy_render::texture::image_loader::ImageLoader",
        settings: (
            format: FromExtension,
            is_srgb: true,
            sampler: Default,
        ),
    ),
)

================================================
FILE: studio/assets/textures/archisketch_108285_frame_basecolor.png.meta
================================================
(
    meta_format_version: "1.0",
    asset: Load(
        loader: "bevy_render::texture::image_loader::ImageLoader",
        settings: (
            format: FromExtension,
            is_srgb: true,
            sampler: Default,
        ),
    ),
)

================================================
FILE: studio/assets/textures/archisketch_108285_frame_normal.png.meta
================================================
(
    meta_format_version: "1.0",
    asset: Load(
        loader: "bevy_render::texture::image_loader::ImageLoader",
        settings: (
            format: FromExtension,
            is_srgb: true,
            sampler: Default,
        ),
    ),
)

================================================
FILE: studio/assets/textures/archisketch_108285_frame_occlusionroughnessmetallic.png.meta
================================================
(
    meta_format_version: "1.0",
    asset: Load(
        loader: "bevy_render::texture::image_loader::ImageLoader",
        settings: (
            format: FromExtension,
            is_srgb: true,
            sampler: Default,
        ),
    ),
)

================================================
FILE: studio/assets/textures/archisketch_122724_frame_yellow_basecolor.png.meta
================================================
(
    meta_format_version: "1.0",
    asset: Load(
        loader: "bevy_render::texture::image_loader::ImageLoader",
        settings: (
            format: FromExtension,
            is_srgb: true,
            sampler: Default,
        ),
    ),
)

================================================
FILE: studio/assets/textures/archisketch_122724_frame_yellow_normal.png.meta
================================================
(
    meta_format_version: "1.0",
    asset: Load(
        loader: "bevy_render::texture::image_loader::ImageLoader",
        settings: (
            format: FromExtension,
            is_srgb: true,
            sampler: Default,
        ),
    ),
)

================================================
FILE: studio/assets/textures/archisketch_122724_frame_yellow_occlusionroughnessmetallic.png.meta
================================================
(
    meta_format_version: "1.0",
    asset: Load(
        loader: "bevy_render::texture::image_loader::ImageLoader",
        settings: (
            format: FromExtension,
            is_srgb: true,
            sampler: Default,
        ),
    ),
)

================================================
FILE: studio/assets/textures/archisketch_13135_frame_silver_basecolor.png.meta
================================================
(
    meta_format_version: "1.0",
    asset: Load(
        loader: "bevy_render::texture::image_loader::ImageLoader",
        settings: (
            format: FromExtension,
            is_srgb: true,
            sampler: Default,
        ),
    ),
)

================================================
FILE: studio/assets/textures/archisketch_13135_frame_silver_normal.png.meta
================================================
(
    meta_format_version: "1.0",
    asset: Load(
        loader: "bevy_render::texture::image_loader::ImageLoader",
        settings: (
            format: FromExtension,
            is_srgb: true,
            sampler: Default,
        ),
    ),
)

================================================
FILE: studio/assets/textures/archisketch_13135_frame_silver_occlusionroughnessmetallic.png.meta
================================================
(
    meta_format_version: "1.0",
    asset: Load(
        loader: "bevy_render::texture::image_loader::ImageLoader",
        settings: (
            format: FromExtension,
            is_srgb: true,
            sampler: Default,
        ),
    ),
)

================================================
FILE: studio/assets/textures/archisketch_15261_frame_cocoa_basecolor.png.meta
================================================
(
    meta_format_version: "1.0",
    asset: Load(
        loader: "bevy_render::texture::image_loader::ImageLoader",
        settings: (
            format: FromExtension,
            is_srgb: true,
            sampler: Default,
        ),
    ),
)

================================================
FILE: studio/assets/textures/archisketch_15261_frame_cocoa_normal.png.meta
================================================
(
    meta_format_version: "1.0",
    asset: Load(
        loader: "bevy_render::texture::image_loader::ImageLoader",
        settings: (
            format: FromExtension,
            is_srgb: true,
            sampler: Default,
        ),
    ),
)

================================================
FILE: studio/assets/textures/archisketch_15261_frame_cocoa_occlusionroughnessmetallic.png.meta
================================================
(
    meta_format_version: "1.0",
    asset: Load(
        loader: "bevy_render::texture::image_loader::ImageLoader",
        settings: (
            format: FromExtension,
            is_srgb: true,
            sampler: Default,
        ),
    ),
)

================================================
FILE: studio/assets/textures/archisketch_205878_frame_basecolor.png.meta
================================================
(
    meta_format_version: "1.0",
    asset: Load(
        loader: "bevy_render::texture::image_loader::ImageLoader",
        settings: (
            format: FromExtension,
            is_srgb: true,
            sampler: Default,
        ),
    ),
)

================================================
FILE: studio/assets/textures/archisketch_205878_frame_normal.png.meta
================================================
(
    meta_format_version: "1.0",
    asset: Load(
        loader: "bevy_render::texture::image_loader::ImageLoader",
        settings: (
            format: FromExtension,
            is_srgb: true,
            sampler: Default,
        ),
    ),
)

================================================
FILE: studio/assets/textures/archisketch_205878_frame_occlusionroughnessmetallic.png.meta
================================================
(
    meta_format_version: "1.0",
    asset: Load(
        loader: "bevy_render::texture::image_loader::ImageLoader",
        settings: (
            format: FromExtension,
            is_srgb: true,
            sampler: Default,
        ),
    ),
)

================================================
FILE: studio/assets/textures/archisketch_277887_frame_navy_basecolor.png.meta
================================================
(
    meta_format_version: "1.0",
    asset: Load(
        loader: "bevy_render::texture::image_loader::ImageLoader",
        settings: (
            format: FromExtension,
            is_srgb: true,
            sampler: Default,
        ),
    ),
)

================================================
FILE: studio/assets/textures/archisketch_277887_frame_navy_normal.png.meta
================================================
(
    meta_format_version: "1.0",
    asset: Load(
        loader: "bevy_render::texture::image_loader::ImageLoader",
        settings: (
            format: FromExtension,
            is_srgb: true,
            sampler: Default,
        ),
    ),
)

================================================
FILE: studio/assets/textures/archisketch_277887_frame_navy_occlusionroughnessmetallic.png.meta
================================================
(
    meta_format_version: "1.0",
    asset: Load(
        loader: "bevy_render::texture::image_loader::ImageLoader",
        settings: (
            format: FromExtension,
            is_srgb: true,
            sampler: Default,
        ),
    ),
)

================================================
FILE: studio/assets/textures/archisketch_280038_frame_black_basecolor.png.meta
================================================
(
    meta_format_version: "1.0",
    asset: Load(
        loader: "bevy_render::texture::image_loader::ImageLoader",
        settings: (
            format: FromExtension,
            is_srgb: true,
            sampler: Default,
        ),
    ),
)

================================================
FILE: studio/assets/textures/archisketch_280038_frame_black_normal.png.meta
================================================
(
    meta_format_version: "1.0",
    asset: Load(
        loader: "bevy_render::texture::image_loader::ImageLoader",
        settings: (
            format: FromExtension,
            is_srgb: true,
            sampler: Default,
        ),
    ),
)

================================================
FILE: studio/assets/textures/archisketch_280038_frame_black_occlusionroughnessmetallic.png.meta
================================================
(
    meta_format_version: "1.0",
    asset: Load(
        loader: "bevy_render::texture::image_loader::ImageLoader",
        settings: (
            format: FromExtension,
            is_srgb: true,
            sampler: Default,
        ),
    ),
)

================================================
FILE: studio/assets/textures/archisketch_285734_frame_black_basecolor.png.meta
================================================
(
    meta_format_version: "1.0",
    asset: Load(
        loader: "bevy_render::texture::image_loader::ImageLoader",
        settings: (
            format: FromExtension,
            is_srgb: true,
            sampler: Default,
        ),
    ),
)

================================================
FILE: studio/assets/textures/archisketch_285734_frame_black_normal.png.meta
================================================
(
    meta_format_version: "1.0",
    asset: Load(
        loader: "bevy_render::texture::image_loader::ImageLoader",
        settings: (
            format: FromExtension,
            is_srgb: true,
            sampler: Default,
        ),
    ),
)

================================================
FILE: studio/assets/textures/archisketch_285734_frame_black_occlusionroughnessmetallic.png.meta
================================================
(
    meta_format_version: "1.0",
    asset: Load(
        loader: "bevy_render::texture::image_loader::ImageLoader",
        settings: (
            format: FromExtension,
            is_srgb: true,
            sampler: Default,
        ),
    ),
)

================================================
FILE: studio/assets/textures/archisketch_302398_frame-_brown__basecolor.png.meta
================================================
(
    meta_format_version: "1.0",
    asset: Load(
        loader: "bevy_render::texture::image_loader::ImageLoader",
        settings: (
            format: FromExtension,
            is_srgb: true,
            sampler: Default,
        ),
    ),
)

================================================
FILE: studio/assets/textures/archisketch_302398_frame-_brown__normal.png.meta
================================================
(
    meta_format_version: "1.0",
    asset: Load(
        loader: "bevy_render::texture::image_loader::ImageLoader",
        settings: (
            format: FromExtension,
            is_srgb: true,
            sampler: Default,
        ),
    ),
)

================================================
FILE: studio/assets/textures/archisketch_302398_frame-_brown__occlusionroughnessmetallic.png.meta
================================================
(
    meta_format_version: "1.0",
    asset: Load(
        loader: "bevy_render::texture::image_loader::ImageLoader",
        settings: (
            format: FromExtension,
            is_srgb: true,
            sampler: Default,
        ),
    ),
)

================================================
FILE: studio/assets/textures/archisketch_349037_frame_red_basecolor.png.meta
================================================
(
    meta_format_version: "1.0",
    asset: Load(
        loader: "bevy_render::texture::image_loader::ImageLoader",
        settings: (
            format: FromExtension,
            is_srgb: true,
            sampler: Default,
        ),
    ),
)

================================================
FILE: studio/assets/textures/archisketch_349037_frame_red_normal.png.meta
================================================
(
    meta_format_version: "1.0",
    asset: Load(
        loader: "bevy_render::texture::image_loader::ImageLoader",
        settings: (
            format: FromExtension,
            is_srgb: true,
            sampler: Default,
        ),
    ),
)

================================================
FILE: studio/assets/textures/archisketch_349037_frame_red_occlusionroughnessmetallic.png.meta
================================================
(
    meta_format_version: "1.0",
    asset: Load(
        loader: "bevy_render::texture::image_loader::ImageLoader",
        settings: (
            format: FromExtension,
            is_srgb: true,
            sampler: Default,
        ),
    ),
)

================================================
FILE: studio/assets/textures/archisketch_349875_frame_132x230_butterfly-fold_basecolor.png.meta
================================================
(
    meta_format_version: "1.0",
    asset: Load(
        loader: "bevy_render::texture::image_loader::ImageLoader",
        settings: (
            format: FromExtension,
            is_srgb: true,
            sampler: Default,
        ),
    ),
)

================================================
FILE: studio/assets/textures/archisketch_349875_frame_132x230_butterfly-fold_normal.png.meta
================================================
(
    meta_format_version: "1.0",
    asset: Load(
        loader: "bevy_render::texture::image_loader::ImageLoader",
        settings: (
            format: FromExtension,
            is_srgb: true,
            sampler: Default,
        ),
    ),
)

================================================
FILE: studio/assets/textures/archisketch_349875_frame_132x230_butterfly-fold_occlusionroughnessmetallic.png.meta
================================================
(
    meta_format_version: "1.0",
    asset: Load(
        loader: "bevy_render::texture::image_loader::ImageLoader",
        settings: (
            format: FromExtension,
            is_srgb: true,
            sampler: Default,
        ),
    ),
)

================================================
FILE: studio/assets/textures/archisketch_391610_frame_wall-mountedtype_basecolor.png.meta
================================================
(
    meta_format_version: "1.0",
    asset: Load(
        loader: "bevy_render::texture::image_loader::ImageLoader",
        settings: (
            format: FromExtension,
            is_srgb: true,
            sampler: Default,
        ),
    ),
)

================================================
FILE: studio/assets/textures/archisketch_391610_frame_wall-mountedtype_normal.png.meta
================================================
(
    meta_format_version: "1.0",
    asset: Load(
        loader: "bevy_render::texture::image_loader::ImageLoader",
        settings: (
            format: FromExtension,
            is_srgb: true,
            sampler: Default,
        ),
    ),
)

================================================
FILE: studio/assets/textures/archisketch_391610_frame_wall-mountedtype_occlusionroughnessmetallic.png.meta
================================================
(
    meta_format_version: "1.0",
    asset: Load(
        loader: "bevy_render::texture::image_loader::ImageLoader",
        settings: (
            format: FromExtension,
            is_srgb: true,
            sampler: Default,
        ),
    ),
)

================================================
FILE: studio/assets/textures/archisketch_46250_frame_basecolor.png.meta
================================================
(
    meta_format_version: "1.0",
    asset: Load(
        loader: "bevy_render::texture::image_loader::ImageLoader",
        settings: (
            format: FromExtension,
            is_srgb: true,
            sampler: Default,
        ),
    ),
)

================================================
FILE: studio/assets/textures/archisketch_46250_frame_normal.png.meta
================================================
(
    meta_format_version: "1.0",
    asset: Load(
        loader: "bevy_render::texture::image_loader::ImageLoader",
        settings: (
            format: FromExtension,
            is_srgb: true,
            sampler: Default,
        ),
    ),
)

================================================
FILE: studio/assets/textures/archisketch_46250_frame_occlusionroughnessmetallic.png.meta
================================================
(
    meta_format_version: "1.0",
    asset: Load(
        loader: "bevy_render::texture::image_loader::ImageLoader",
        settings: (
            format: FromExtension,
            is_srgb: true,
            sampler: Default,
        ),
    ),
)

================================================
FILE: studio/assets/textures/archisketch_465810_frame_b1_extra-large__basecolor.png.meta
================================================
(
    meta_format_version: "1.0",
    asset: Load(
        loader: "bevy_render::texture::image_loader::ImageLoader",
        settings: (
            format: FromExtension,
            is_srgb: true,
            sampler: Default,
        ),
    ),
)

================================================
FILE: studio/assets/textures/archisketch_465810_frame_b1_extra-large__normal.png.meta
================================================
(
    meta_format_version: "1.0",
    asset: Load(
        loader: "bevy_render::texture::image_loader::ImageLoader",
        settings: (
            format: FromExtension,
            is_srgb: true,
            sampler: Default,
        ),
    ),
)

================================================
FILE: studio/assets/textures/archisketch_465810_frame_b1_extra-large__occlusionroughnessmetallic.png.meta
================================================
(
    meta_format_version: "1.0",
    asset: Load(
        loader: "bevy_render::texture::image_loader::ImageLoader",
        settings: (
            format: FromExtension,
            is_srgb: true,
            sampler: Default,
        ),
    ),
)

================================================
FILE: studio/assets/textures/archisketch_56099_frame_basecolor.png.meta
================================================
(
    meta_format_version: "1.0",
    asset: Load(
        loader: "bevy_render::texture::image_loader::ImageLoader",
        settings: (
            format: FromExtension,
            is_srgb: true,
            sampler: Default,
        ),
    ),
)

================================================
FILE: studio/assets/textures/archisketch_56099_frame_normal.png.meta
================================================
(
    meta_format_version: "1.0",
    asset: Load(
        loader: "bevy_render::texture::image_loader::ImageLoader",
        settings: (
            format: FromExtension,
            is_srgb: true,
            sampler: Default,
        ),
    ),
)

================================================
FILE: studio/assets/textures/archisketch_56099_frame_occlusionroughnessmetallic.png.meta
================================================
(
    meta_format_version: "1.0",
    asset: Load(
        loader: "bevy_render::texture::image_loader::ImageLoader",
        settings: (
            format: FromExtension,
            is_srgb: true,
            sampler: Default,
        ),
    ),
)

================================================
FILE: studio/assets/textures/archisketch_71718_frame_red_basecolor.png.meta
================================================
(
    meta_format_version: "1.0",
    asset: Load(
        loader: "bevy_render::texture::image_loader::ImageLoader",
        settings: (
            format: FromExtension,
            is_srgb: true,
            sampler: Default,
        ),
    ),
)

================================================
FILE: studio/assets/textures/archisketch_71718_frame_red_normal.png.meta
================================================
(
    meta_format_version: "1.0",
    asset: Load(
        loader: "bevy_render::texture::image_loader::ImageLoader",
        settings: (
            format: FromExtension,
            is_srgb: true,
            sampler: Default,
        ),
    ),
)

================================================
FILE: studio/assets/textures/archisketch_71718_frame_red_occlusionroughnessmetallic.png.meta
================================================
(
    meta_format_version: "1.0",
    asset: Load(
        loader: "bevy_render::texture::image_loader::ImageLoader",
        settings: (
            format: FromExtension,
            is_srgb: true,
            sampler: Default,
        ),
    ),
)

================================================
FILE: studio/assets/textures/basehumanfemaleskin.png.meta
================================================
(
    meta_format_version: "1.0",
    asset: Load(
        loader: "bevy_render::texture::image_loader::ImageLoader",
        settings: (
            format: FromExtension,
            is_srgb: true,
            sampler: Default,
        ),
    ),
)

================================================
FILE: studio/assets/textures/black-vase-_black__basecolor.png.meta
================================================
(
    meta_format_version: "1.0",
    asset: Load(
        loader: "bevy_render::texture::image_loader::ImageLoader",
        settings: (
            format: FromExtension,
            is_srgb: true,
            sampler: Default,
        ),
    ),
)

================================================
FILE: studio/assets/textures/black-vase-_black__normal.png.meta
================================================
(
    meta_format_version: "1.0",
    asset: Load(
        loader: "bevy_render::texture::image_loader::ImageLoader",
        settings: (
            format: FromExtension,
            is_srgb: true,
            sampler: Default,
        ),
    ),
)

================================================
FILE: studio/assets/textures/black-vase-_black__occlusionroughnessmetallic.png.meta
================================================
(
    meta_format_version: "1.0",
    asset: Load(
        loader: "bevy_render::texture::image_loader::ImageLoader",
        settings: (
            format: FromExtension,
            is_srgb: true,
            sampler: Default,
        ),
    ),
)

================================================
FILE: studio/assets/textures/color_0a0a0a.png.meta
================================================
(
    meta_format_version: "1.0",
    asset: Load(
        loader: "bevy_render::texture::image_loader::ImageLoader",
        settings: (
            format: FromExtension,
            is_srgb: true,
            sampler: Default,
        ),
    ),
)

================================================
FILE: studio/assets/textures/color_1b1b1b.png.meta
================================================
(
    meta_format_version: "1.0",
    asset: Load(
        loader: "bevy_render::texture::image_loader::ImageLoader",
        settings: (
            format: FromExtension,
            is_srgb: true,
            sampler: Default,
        ),
    ),
)

================================================
FILE: studio/assets/textures/diffusetexture_w181_0.png.meta
================================================
(
    meta_format_version: "1.0",
    asset: Load(
        loader: "bevy_render::texture::image_loader::ImageLoader",
        settings: (
            format: FromExtension,
            is_srgb: true,
            sampler: Default,
        ),
    ),
)

================================================
FILE: studio/assets/textures/diffusetexture_w184_0.png.meta
================================================
(
    meta_format_version: "1.0",
    asset: Load(
        loader: "bevy_render::texture::image_loader::ImageLoader",
        settings: (
            format: FromExtension,
            is_srgb: true,
            sampler: Default,
        ),
    ),
)

================================================
FILE: studio/assets/textures/documents_basecolor.png.meta
================================================
(
    meta_format_version: "1.0",
    asset: Load(
        loader: "bevy_render::texture::image_loader::ImageLoader",
        settings: (
            format: FromExtension,
            is_srgb: true,
            sampler: Default,
        ),
    ),
)

================================================
FILE: studio/assets/textures/documents_normal.png.meta
================================================
(
    meta_format_version: "1.0",
    asset: Load(
        loader: "bevy_render::texture::image_loader::ImageLoader",
        settings: (
            format: FromExtension,
            is_srgb: true,
            sampler: Default,
        ),
    ),
)

================================================
FILE: studio/assets/textures/documents_occlusionroughnessmetallic.png.meta
================================================
(
    meta_format_version: "1.0",
    asset: Load(
        loader: "bevy_render::texture::image_loader::ImageLoader",
        settings: (
            format: FromExtension,
            is_srgb: true,
            sampler: Default,
        ),
    ),
)

================================================
FILE: studio/assets/textures/flower-color1_basecolor.png.meta
================================================
(
    meta_format_version: "1.0",
    asset: Load(
        loader: "bevy_render::texture::image_loader::ImageLoader",
        settings: (
            format: FromExtension,
            is_srgb: true,
            sampler: Default,
        ),
    ),
)

================================================
FILE: studio/assets/textures/flower-color1_normal.png.meta
================================================
(
    meta_format_version: "1.0",
    asset: Load(
        loader: "bevy_render::texture::image_loader::ImageLoader",
        settings: (
            format: FromExtension,
            is_srgb: true,
            sampler: Default,
        ),
    ),
)

================================================
FILE: studio/assets/textures/flower-color1_occlusionroughnessmetallic.png.meta
================================================
(
    meta_format_version: "1.0",
    asset: Load(
        loader: "bevy_render::texture::image_loader::ImageLoader",
        settings: (
            format: FromExtension,
            is_srgb: true,
            sampler: Default,
        ),
    ),
)

================================================
FILE: studio/assets/textures/flower-color2_basecolor.png.meta
================================================
(
    meta_format_version: "1.0",
    asset: Load(
        loader: "bevy_render::texture::image_loader::ImageLoader",
        settings: (
            format: FromExtension,
            is_srgb: true,
            sampler: Default,
        ),
    ),
)

================================================
FILE: studio/assets/textures/flower-color2_normal.png.meta
================================================
(
    meta_format_version: "1.0",
    asset: Load(
        loader: "bevy_render::texture::image_loader::ImageLoader",
        settings: (
            format: FromExtension,
            is_srgb: true,
            sampler: Default,
        ),
    ),
)

================================================
FILE: studio/assets/textures/flower-color2_occlusionroughnessmetallic.png.meta
================================================
(
    meta_format_version: "1.0",
    asset: Load(
        loader: "bevy_render::texture::image_loader::ImageLoader",
        settings: (
            format: FromExtension,
            is_srgb: true,
            sampler: Default,
        ),
    ),
)

================================================
FILE: studio/assets/textures/hektar-_black__basecolor.png.meta
================================================
(
    meta_format_version: "1.0",
    asset: Load(
        loader: "bevy_render::texture::image_loader::ImageLoader",
        settings: (
            format: FromExtension,
            is_srgb: true,
            sampler: Default,
        ),
    ),
)

================================================
FILE: studio/assets/textures/hektar-_black__emissive.png.meta
================================================
(
    meta_format_version: "1.0",
    asset: Load(
        loader: "bevy_render::texture::image_loader::ImageLoader",
        settings: (
            format: FromExtension,
            is_srgb: true,
            sampler: Default,
        ),
    ),
)

================================================
FILE: studio/assets/textures/hektar-_black__normal.png.meta
================================================
(
    meta_format_version: "1.0",
    asset: Load(
        loader: "bevy_render::texture::image_loader::ImageLoader",
        settings: (
            format: FromExtension,
            is_srgb: true,
            sampler: Default,
        ),
    ),
)

================================================
FILE: studio/assets/textures/hektar-_black__occlusionroughnessmetallic.png.meta
================================================
(
    meta_format_version: "1.0",
    asset: Load(
        loader: "bevy_render::texture::image_loader::ImageLoader",
        settings: (
            format: FromExtension,
            is_srgb: true,
            sampler: Default,
        ),
    ),
)

================================================
FILE: studio/assets/textures/map__2138274789_falloff.png.meta
================================================
(
    meta_format_version: "1.0",
    asset: Load(
        loader: "bevy_render::texture::image_loader::ImageLoader",
        settings: (
            format: FromExtension,
            is_srgb: true,
            sampler: Default,
        ),
    ),
)

================================================
FILE: studio/assets/textures/map__3_gradient_ramp_0.png.meta
================================================
(
    meta_format_version: "1.0",
    asset: Load(
        loader: "bevy_render::texture::image_loader::ImageLoader",
        settings: (
            format: FromExtension,
            is_srgb: true,
            sampler: Default,
        ),
    ),
)

================================================
FILE: studio/assets/textures/map__4727_mix.png.meta
================================================
(
    meta_format_version: "1.0",
    asset: Load(
        loader: "bevy_render::texture::image_loader::ImageLoader",
        settings: (
            format: FromExtension,
            is_srgb: true,
            sampler: Default,
        ),
    ),
)

================================================
FILE: studio/assets/textures/mask.png.meta
================================================
(
    meta_format_version: "1.0",
    asset: Load(
        loader: "bevy_render::texture::image_loader::ImageLoader",
        settings: (
            format: FromExtension,
            is_srgb: true,
            sampler: Default,
        ),
    ),
)

================================================
FILE: studio/assets/textures/mokin_basecolor.png.meta
================================================
(
    meta_format_version: "1.0",
    asset: Load(
        loader: "bevy_render::texture::image_loader::ImageLoader",
        settings: (
            format: FromExtension,
            is_srgb: true,
            sampler: Default,
        ),
    ),
)

================================================
FILE: studio/assets/textures/mokin_normal.png.meta
================================================
(
    meta_format_version: "1.0",
    asset: Load(
        loader: "bevy_render::texture::image_loader::ImageLoader",
        settings: (
            format: FromExtension,
            is_srgb: true,
            sampler: Default,
        ),
    ),
)

================================================
FILE: studio/assets/textures/mokin_occlusionroughnessmetallic.png.meta
================================================
(
    meta_format_version: "1.0",
    asset: Load(
        loader: "bevy_render::texture::image_loader::ImageLoader",
        settings: (
            format: FromExtension,
            is_srgb: true,
            sampler: Default,
        ),
    ),
)

================================================
FILE: studio/assets/textures/none_basecolor.png.meta
================================================
(
    meta_format_version: "1.0",
    asset: Load(
        loader: "bevy_render::texture::image_loader::ImageLoader",
        settings: (
            format: FromExtension,
            is_srgb: true,
            sampler: Default,
        ),
    ),
)

================================================
FILE: studio/assets/textures/none_normal.png.meta
================================================
(
    meta_format_version: "1.0",
    asset: Load(
        loader: "bevy_render::texture::image_loader::ImageLoader",
        settings: (
            format: FromExtension,
            is_srgb: true,
            sampler: Default,
        ),
    ),
)

================================================
FILE: studio/assets/textures/none_occlusionroughnessmetallic.png.meta
================================================
(
    meta_format_version: "1.0",
    asset: Load(
        loader: "bevy_render::texture::image_loader::ImageLoader",
        settings: (
            format: FromExtension,
            is_srgb: true,
            sampler: Default,
        ),
    ),
)

================================================
FILE: studio/assets/textures/sh__014e_0.png.meta
================================================
(
    meta_format_version: "1.0",
    asset: Load(
        loader: "bevy_render::texture::image_loader::ImageLoader",
        settings: (
            format: FromExtension,
            is_srgb: true,
            sampler: Default,
        ),
    ),
)

================================================
FILE: studio/assets/textures/sh__049.png.meta
================================================
(
    meta_format_version: "1.0",
    asset: Load(
        loader: "bevy_render::texture::image_loader::ImageLoader",
        settings: (
            format: FromExtension,
            is_srgb: true,
            sampler: Default,
        ),
    ),
)

================================================
FILE: studio/assets/textures/standard-us-power-outlet.png.meta
================================================
(
    meta_format_version: "1.0",
    asset: Load(
        loader: "bevy_render::texture::image_loader::ImageLoader",
        settings: (
            format: FromExtension,
            is_srgb: true,
            sampler: Default,
        ),
    ),
)

================================================
FILE: studio/assets/textures/tcom_parquet_m.png.meta
================================================
(
    meta_format_version: "1.0",
    asset: Load(
        loader: "bevy_render::texture::image_loader::ImageLoader",
        settings: (
            format: FromExtension,
            is_srgb: true,
            sampler: Default,
        ),
    ),
)

================================================
FILE: studio/assets/textures/texture-1.png.meta
================================================
(
    meta_format_version: "1.0",
    asset: Load(
        loader: "bevy_render::texture::image_loader::ImageLoader",
        settings: (
            format: FromExtension,
            is_srgb: true,
            sampler: Default,
        ),
    ),
)

================================================
FILE: studio/assets/textures/texture.png.meta
================================================
(
    meta_format_version: "1.0",
    asset: Load(
        loader: "bevy_render::texture::image_loader::ImageLoader",
        settings: (
            format: FromExtension,
            is_srgb: true,
            sampler: Default,
        ),
    ),
)

================================================
FILE: studio/editor.ron
================================================
{
    "space_undo::ChangeChainSettings": "{\"space_undo::ChangeChainSettings\":(max_change_chain_size:200)}",
    "space_editor_ui::settings::NewWindowSettings": "{\"space_editor_ui::settings::NewWindowSettings\":(new_tab:SameNode)}",
    "space_editor_ui::settings::GameModeSettings": "{\"space_editor_ui::settings::GameModeSettings\":(mode:Game3D)}",
    "space_persistence::PersistenceSettings": "{\"space_persistence::PersistenceSettings\":(load_on_startup:true,save_on_close:true)}",
    "space_editor_ui::sizing::Sizing": "{\"space_editor_ui::sizing::Sizing\":(icon:Regular,gizmos:Gizmos,text:14.0)}",
}

================================================
FILE: studio/project.json
================================================
// [OUTLINE - 43 symbols, 61 lines]
// L2: "name": "studio"
// L3: "$schema": "../node_modules/nx/schemas/project-schema.json"
// L4: "projectType": "application"
// L5: "sourceRoot": "./studio/src"
// L6-L8: "namedInputs":
// L7: "assets": ["
// L9-L59: "targets":
// L10-L25: "build":
// L11: "executor": "@nxrs/cargo:build"
// L12: "inputs": ["assets"]
// L13-L15: "options":
// L14: "release": false
// L16-L24: "configurations":
// L17-L20: "headless" :
// L18: "release" : true
// L19: "bin": "studio-headless"
// L21-L23: "production":
// L22: "release": true
// L26-L33: "build:web":
// L27: "executor": "nx:run-commands"
// L28: "inputs": ["assets"]
// L29-L32: "options":
// L30: "command": "node scripts/build-web.mjs --features=wasm"
// L31: "cwd": "studio"
// L34-L40: "dev":
// L35: "executor": "@nxrs/cargo:run"
// L36-L39: "options":
// L37: "profile": "dev-custom"
// L38: "bin": "studio-standalone"
// L41-L46: "headless":
// L42: "executor": "nx:run-commands"
// L43-L45: "options":
// L44: "command": "cargo run -p studio --bin studio-headless --"
// L47-L50: "test":
// L48: "executor": "@nxrs/cargo:test"
// L49: "options":
// L51-L58: "lint":
// L52: "executor": "@nxrs/cargo:clippy"
// L53-L57: "options":
// L54: "fix": false
// L55: "failOnWarnings": true
// L56: "noDeps": true
// L60: "tags": []


================================================
FILE: studio/scripts/build-web.mjs
================================================
// [OUTLINE - 1 symbols, 77 lines]
// import node:fs
// import node:url
// import node:path
// import rimraf
// import ./copy-assets.mjs
// import ./handle-error.mjs
// import ./run.mjs
// L12-L75: async function main()


================================================
FILE: studio/scripts/copy-assets.mjs
================================================
// [OUTLINE - 2 symbols, 95 lines]
// import chalk
// import glob
// import node:fs
// import node:path
// import node:url
// L7-L68: async function main()
// L74-L95: function handleError(err)


================================================
FILE: studio/scripts/handle-error.mjs
================================================
// [OUTLINE - 0 symbols, 33 lines]
// import chalk
// import node:util


================================================
FILE: studio/scripts/run.mjs
================================================
// [OUTLINE - 2 symbols, 60 lines]
// import chalk
// import node:child_process
// import which
// L12-L28: function run(command, args, options)
// L33-L60: async function wasmBindgenCliVersion()


================================================
FILE: studio/src/anim/mod.rs
================================================
// [OUTLINE - 11 symbols, 146 lines]
// import bevy
// import space_editor
// import crate
// import retargeting
// L12: mod retargeting;
// L13: pub mod timeline_animation;
// L15: pub struct AnimPlugin;
// L17-L37: fn build(&self, app: &mut App)
// L42: pub struct Skeleton;
// L46: pub struct SkeletalJoint(pub Color);
// L50: pub struct ProcessedSkinnedMesh;
// L54: pub struct BindPoseLocal(pub Transform);
// L58: pub struct BindPoseGlobal(pub Affine3A);
// L62: pub struct InvBindPose(pub Affine3A);
// L64-L146: fn process_skinned_meshes(


================================================
FILE: studio/src/anim/retargeting.rs
================================================
// [OUTLINE - 8 symbols, 427 lines]
// import bevy
// import space_editor
// import crate
// import super
// L8: pub(super) struct RetargetingPlugin;
// L10-L17: fn build(&self, app: &mut App)
// L22: pub struct RetargetSource;
// L26: pub struct SkeletonHeight(f32);
// L28-L196: fn copy_pose(
// L198-L226: fn compute_skeleton_height(
// L230-L232: pub struct RetargetMap
// L418-L426: fn default() -> Self


================================================
FILE: studio/src/anim/timeline_animation.rs
================================================
// [OUTLINE - 61 symbols, 1482 lines]
// import std
// import bevy
// import bevy_tweening
// import itertools
// import serde
// import space_editor
// import crate
// import super
// import bevy
// import serde
// import wasm_bindgen
// import crate
// import super
// L21: pub struct TimelinePlugin;
// L24-L88: fn build(&self, app: &mut App)
// L95-L100: pub enum TimelineInteractionEvent
// L104-L121: pub enum KeyframeInteractionEvent
// L125-L129: pub struct GlobalSeekTime
// L132-L136: pub enum KeyingMode
// L139-L143: pub enum EaseType
// L147-L152: pub struct TransformKeyframe
// L155-L162: fn default() -> Self
// L167-L170: pub struct Keyframe
// L174: pub struct KeyframeOrder(u32);
// L177-L179: fn partial_cmp(&self, other: &Self) -> Option<std::cmp::Ordering>
// L183-L188: fn default() -> Self
// L193-L200: pub struct TimedAnimationClipAsset
// L203-L207: pub struct TimedAnimationClipDuration
// L210-L223: enum RetargetedClipReference
// L228-L233: pub enum ClipRetargeting
// L236-L242: fn partial_cmp(&self, other: &Self) -> Option<std::cmp::Ordering>
// L246-L254: fn default() -> Self
// L262-L267: pub enum AnimationTarget
// L270-L272: pub fn new() -> Self
// L276-L282: fn to_string(&self) -> String
// L286-L288: fn from(val: AnimationTarget) -> Self
// L294-L296: fn try_from(value: &str) -> Result<Self, Self::Error>
// L302-L310: fn from_str(s: &str) -> Result<Self, Self::Err>
// L313-L338: fn process_timeline_events(
// L340-L358: fn update_tick(
// L360-L458: fn process_keyframe_events(
// L460-L474: fn process_auto_key(
// L476-L653: fn generate_transform_animation(
// L655: struct ComponentTarget<'a, T: Component>(&'a mut T);
// L658-L660: fn new(target: Mut<'a, T>) -> Self
// L664-L666: fn target_mut(&mut self) -> &mut T
// L669-L695: pub fn timeline_bound_component_animator_system<T: Component>(
// L698-L702: struct TimedAnimationClipLens
// L705-L714: fn lerp(&mut self, target: &mut AnimationPlayer, ratio: f32)
// L717-L871: fn generate_clip_animation(
// L873-L901: pub fn update_timed_animation_clip_duration(
// L903-L1002: fn retarget_timed_animation_clip(
// L1004-L1050: fn rebuild_entity_path(
// L1053-L1482: mod wasm
// L1075-L1077: pub fn seek_time(timestamp: f32)
// L1080-L1082: pub fn play()
// L1085-L1087: pub fn pause()
// L1090-L1092: pub fn toggle_auto_key()
// L1095-L1103: pub fn record_keyframe(entities: Vec<String>)
// L1106-L1121: pub fn insert_clip(
// L1124-L1132: pub fn move_keyframe_time(entity: String, time: f32)
// L1135-L1140: pub fn add_entity_track(entity: String)
// L1142-L1149: pub(super) fn update_global_seek_time(
// L1151-L1159: pub(super) fn update_keyframe_interaction(
// L1235-L1239: struct AddedAnimationTargetRecordItem
// L1242-L1245: struct UpdatedAnimationTargetsEvent
// L1248-L1250: struct UpdateKeyingMode
// L1253-L1260: struct TimedAnimationClipInfo
// L1264-L1272: struct TransformKeframeInfo
// L1275-L1278: struct UpdateKeyframes
// L1280-L1356: pub(super) fn notify_updated_animation_targets(
// L1358-L1438: pub(super) fn notify_keyframe_changes(
// L1440-L1457: pub(super) fn notify_seek_time_changes(
// L1459-L1481: pub(super) fn notify_keying_mode_changed(


================================================
FILE: studio/src/bvh/error.rs
================================================
// [OUTLINE - 6 symbols, 38 lines]
// import core
// import anyhow
// import bevy
// L7: pub struct Error(pub anyhow::Error);
// L10-L12: fn from(value: anyhow::Error) -> Self
// L15-L17: pub trait Anyhow<T>
// L23-L25: fn anyhow(self) -> anyhow::Result<T>
// L29-L31: fn source(&self) -> Option<&(dyn std::error::Error + 'static)>
// L35-L37: fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result


================================================
FILE: studio/src/bvh/loader.rs
================================================
// [OUTLINE - 3 symbols, 37 lines]
// import bevy
// import super
// L12: pub struct BvhLoader;
// L19-L32: fn load<'a>(
// L34-L36: fn extensions(&self) -> &[&str]


================================================
FILE: studio/src/bvh/mod.rs
================================================
// [OUTLINE - 20 symbols, 340 lines]
// import bevy
// import space_editor
// import studio_bvh
// import crate
// import self
// L27: mod error;
// L28: mod loader;
// L38: pub struct BvhPlugin;
// L41-L59: fn build(&self, app: &mut App)
// L64: pub struct TestBvh(pub Handle<Bvh>);
// L67-L83: fn spawn_test_bvh(
// L90: pub struct Bvh(studio_bvh::Bvh);
// L97-L104: pub struct BvhAnim
// L107-L121: fn compute_inverse_bindposes(
// L123-L160: pub fn animate_bvh(
// L162-L226: fn lerp_frames<T: QueryFilter>(
// L236: pub struct BvhAnimCompleteEvent;
// L243: pub struct BvhJoint(usize);
// L247-L252: pub struct JointQuery
// L258-L262: pub trait CommandsSpawnBvhExt
// L265-L269: fn spawn_bvh(&mut self, asset: &Handle<Bvh>) -> Entity
// L271-L275: fn spawn_bvh_with_transform(&mut self, asset: &Handle<Bvh>, transform: Transform) -> Entity
// L278: pub struct SpawnBvhCommand(Entity, Handle<Bvh>, Transform);
// L281-L314: fn apply(self, world: &mut World)
// L321-L340: fn spawn_bvh_recursive(world: &mut World, entity: &Entity, joint: studio_bvh::Joint)


================================================
FILE: studio/src/camera_controller.rs
================================================
// [OUTLINE - 19 symbols, 375 lines]
// import std
// import bevy
// import crate
// import bevy
// import CameraMotion
// L17: pub struct CameraControllerPlugin;
// L20: pub struct CameraMotionSystem;
// L23-L36: fn build(&self, app: &mut App)
// L40-L59: fn sync_camera_viewport(
// L62-L66: pub struct CameraController
// L69-L75: fn default() -> Self
// L79-L82: pub struct CameraControllerBundle
// L85-L94: pub fn new(focus: Vec3, position: Vec3) -> Self
// L97-L142: fn camera_control_kinematic(
// L144-L179: fn process_physical_inputs(
// L181-L244: fn process_focus_inputs(
// L246-L258: fn camera_control_physical(
// L260-L270: fn interp_camera_focus(
// L273-L276: fn capture_pointer(window: &mut Window)
// L279-L282: fn release_pointer(window: &mut Window)
// L285-L319: fn do_orbit(
// L322-L349: fn do_pan(
// L352-L356: fn do_zoom(win: &Window, delta: f32, xform: &mut Transform, controller: &mut CameraController)
// L359-L375: fn do_rotate(win: &Window, delta: Vec2, xform: &mut Transform, controller: &mut CameraController)


================================================
FILE: studio/src/change_tracking.rs
================================================
// [OUTLINE - 8 symbols, 92 lines]
// import bevy
// import crate
// import bevy
// import wasm_bindgen
// import crate
// import super
// L5: pub struct ChangeTrackingPlugin;
// L8-L23: fn build(&self, app: &mut App)
// L27: pub struct ChangeTracker;
// L29-L36: fn send_change_events<T: Component>(
// L38-L45: fn track_scene_elements(
// L48: pub struct EntityChangedEvent(pub Entity);
// L51-L92: mod wasm
// L73-L91: pub(super) fn send_change_events<T: Component>(


================================================
FILE: studio/src/debug.rs
================================================
// [OUTLINE - 17 symbols, 280 lines]
// import std
// import bevy
// import bevy_inspector_egui
// import bevy_mod_picking
// import space_editor
// import space_editor
// import crate
// import crate
// import super
// import bevy
// import serde_json
// import wasm_bindgen
// L24: pub struct DebugMode(bool);
// L27-L30: pub struct DebugPoint
// L32: pub struct DebugPlugin;
// L34-L109: fn build(&self, app: &mut App)
// L112-L119: fn toggle_debug_mode(mut input: EventReader<InputAction>, mut r_debug: ResMut<DebugMode>)
// L121-L129: fn update_editor_ui_mode(
// L131-L139: fn update_debug_picking_mode(
// L141-L143: pub fn is_debug_mode(r_debug: Res<DebugMode>) -> bool
// L145-L153: fn update_gizmo_line_thickness(
// L155-L166: fn draw_world_axes(mut gizmos: Gizmos, q: Query<&CameraController>)
// L168-L183: fn draw_debug_points(
// L185-L211: fn draw_skeletal_joints(
// L215-L220: pub fn write_mat3(w: &mut impl fmt::Write, m: &Mat3) -> fmt::Result
// L223-L229: pub fn print_mat3(m: &Mat3, label: impl fmt::Display) -> fmt::Result
// L231-L238: fn sync_editor_camera(
// L241-L280: mod wasm
// L263-L279: pub fn notify_debug_mode_toggle(


================================================
FILE: studio/src/design_system.rs
================================================
// [OUTLINE - 1 symbols, 15 lines]
// import bevy
// L3: pub struct Color;


================================================
FILE: studio/src/headless.rs
================================================
// [OUTLINE - 8 symbols, 252 lines]
// import std
// import bevy
// import bevy_web_asset
// import space_editor
// import wgpu
// import crate
// L24-L29: pub enum HeadlessMode
// L32-L37: pub enum CameraMotion
// L39-L149: pub fn start_headless(
// L152-L158: pub struct HeadlessSettings
// L161-L173: fn default() -> Self
// L176-L189: fn check_for_bvh_capture_complete(
// L191-L211: fn check_for_mixamo_capture_complete(
// L214-L252: fn start_timeline_animation(


================================================
FILE: studio/src/hierarchy.rs
================================================
// [OUTLINE - 3 symbols, 96 lines]
// import bevy
// L11-L16: pub(crate) fn find_parent(target: Entity, q_parents: &Query<Option<&Parent>>) -> Option<Entity>
// L27-L84: pub(crate) fn nearest_common_ancestor(
// L86-L96: fn find_depth(target: Entity, q_parents: &Query<Option<&Parent>>) -> usize


================================================
FILE: studio/src/input.rs
================================================
// [OUTLINE - 19 symbols, 437 lines]
// import bevy
// import space_editor
// import crate
// import KeyCode
// L11: pub struct StudioInputSystem;
// L13: pub struct StudioInputPlugin;
// L15-L47: fn build(&self, app: &mut App)
// L52-L115: fn log_input_actions(
// L118: pub struct InputAction(pub Lifecycle, pub Action);
// L121-L125: pub enum Lifecycle
// L128-L132: pub enum Action
// L135-L141: pub enum CameraMotion
// L143-L145: fn from(value: CameraMotion) -> Self
// L149-L156: pub enum Selection
// L158-L160: fn from(value: Selection) -> Self
// L165-L186: fn translate_selection_events(
// L188-L199: fn translate_debug_toggle(
// L201-L304: fn translate_dcc_camera_events(
// L306-L399: fn translate_fps_camera_events(
// L402: pub struct LastFrameMouseDelta(pub Vec2);
// L405-L407: fn get(&self) -> Vec2
// L410-L418: fn read_mouse_delta(
// L421-L437: fn send_undo_event(mut events: EventWriter<UndoRedo>, keyboard: Res<ButtonInput<KeyCode>>)


================================================
FILE: studio/src/inspector/mod.rs
================================================
// [OUTLINE - 3 symbols, 20 lines]
// import bevy
// L4: mod wasm;
// L6: pub struct InspectorPlugin;
// L9-L19: fn build(


================================================
FILE: studio/src/inspector/wasm.rs
================================================
// [OUTLINE - 11 symbols, 241 lines]
// import std
// import bevy
// import serde
// import wasm_bindgen
// import crate
// L62-L69: pub(super) struct SceneObject
// L71-L77: struct SceneObjectBuilder
// L80-L88: fn new(id: Entity) -> Self
// L89-L100: fn finish(self) -> SceneObject
// L101-L104: fn with_name(mut self, name: String) -> Self
// L105-L108: fn with_type(mut self, type_: SceneElement) -> Self
// L109-L112: fn with_children(mut self, children: Vec<Entity>) -> Self
// L113-L116: fn with_parent(mut self, parent: Entity) -> Self
// L120-L122: fn build(id: Entity) -> SceneObjectBuilder
// L125-L202: pub(super) fn notify_entity_spawn_changes(
// L204-L241: fn build_scene_object(


================================================
FILE: studio/src/interaction/gizmos/camera.rs
================================================
// [OUTLINE - 3 symbols, 51 lines]
// import bevy
// import space_editor
// import crate
// import super
// L9: pub struct GizmoCamera;
// L11-L36: pub(super) fn spawn_gizmo_camera(
// L38-L51: pub(super) fn sync_gizmo_and_main_cameras(


================================================
FILE: studio/src/interaction/gizmos/combo.rs
================================================
// [OUTLINE - 1 symbols, 167 lines]
// import bevy
// import bevy_mod_picking
// import crate
// import super
// import super
// L14-L167: pub(super) fn spawn_combo_translation_rotation_gizmo(


================================================
FILE: studio/src/interaction/gizmos/common.rs
================================================
// [OUTLINE - 7 symbols, 89 lines]
// import bevy
// import bevy_mod_picking
// import crate
// import super
// L9-L12: pub struct TransformGizmo
// L15-L19: pub(super) struct TransformGizmoBundle
// L22: pub(super) struct InitialTransform(pub GlobalTransform);
// L25-L67: pub fn new(
// L70-L77: pub(super) fn on_gizmo_element_hover(
// L79-L86: pub(super) fn on_gizmo_element_unhover(
// L89: pub(super) struct InitialHitPoint(pub Vec3);


================================================
FILE: studio/src/interaction/gizmos/material.rs
================================================
// [OUTLINE - 4 symbols, 31 lines]
// import bevy
// L7-L12: pub struct GizmoMaterial
// L15-L20: fn from(color: Color) -> Self
// L24-L26: fn fragment_shader() -> ShaderRef
// L28-L30: fn alpha_mode(&self) -> AlphaMode


================================================
FILE: studio/src/interaction/gizmos/mod.rs
================================================
// [OUTLINE - 15 symbols, 213 lines]
// import bevy
// import crate
// import self
// import common
// import super
// L19: pub mod camera;
// L20: mod combo;
// L21: mod common;
// L22: mod material;
// L23: mod resources;
// L24: mod rotation;
// L25: mod scale;
// L26: mod translation;
// L39: pub struct GizmoPlugin;
// L42-L80: fn build(&self, app: &mut App)
// L83-L87: fn despawn_existing_gizmo(mut cmd: Commands, q_gizmos: Query<Entity, With<TransformGizmo>>)
// L89-L158: fn spawn_gizmo(
// L160-L181: fn sync_gizmo_transform(
// L183-L195: fn update_target_global_trasform(
// L197-L213: fn normalize_gizmo_scale(


================================================
FILE: studio/src/interaction/gizmos/resources.rs
================================================
// [OUTLINE - 3 symbols, 144 lines]
// import bevy
// import crate
// import super
// L9-L19: pub(super) struct GizmoMeshes
// L23-L39: pub(super) struct GizmoMats
// L42-L144: pub(super) fn init_resources(


================================================
FILE: studio/src/interaction/gizmos/rotation.rs
================================================
// [OUTLINE - 10 symbols, 413 lines]
// import bevy
// import bevy_mod_picking
// import bevy_mod_raycast
// import crate
// import super
// import super
// import RotationWidget
// import std
// L22-L26: pub(super) enum RotationWidget
// L29: pub(super) struct LastHitPoint(pub Vec3);
// L32-L35: pub(super) struct LastRotation
// L38-L127: pub(super) fn spawn_rotation_gizmo(
// L129-L155: pub(super) fn update_ss_ring_rotation(
// L157-L164: fn on_trackball_hover(
// L166-L173: fn on_trackball_unhover(
// L175-L204: pub(super) fn on_rotation_start(
// L206-L220: pub(super) fn on_rotation_end(
// L222-L413: pub(super) fn on_rotate(


================================================
FILE: studio/src/interaction/gizmos/scale.rs
================================================
// [OUTLINE - 5 symbols, 342 lines]
// import bevy
// import bevy_mod_picking
// import crate
// import super
// import super
// import ScaleWidget
// L12-L16: pub(super) enum ScaleWidget
// L19-L197: pub(super) fn spawn_scale_gizmo(
// L199-L213: pub(super) fn on_scale_start(
// L215-L223: pub(super) fn on_scale_end(
// L225-L342: pub(super) fn on_scale(


================================================
FILE: studio/src/interaction/gizmos/translation.rs
================================================
// [OUTLINE - 5 symbols, 313 lines]
// import bevy
// import bevy_mod_picking
// import crate
// import super
// import super
// import TranslationWidget
// L12-L16: pub(super) enum TranslationWidget
// L19-L197: pub(super) fn spawn_translation_gizmo(
// L199-L210: pub(super) fn on_translation_start(
// L212-L220: pub(super) fn on_translation_end(
// L222-L313: pub(super) fn on_translate(


================================================
FILE: studio/src/interaction/mod.rs
================================================
// [OUTLINE - 5 symbols, 15 lines]
// import bevy
// import selection
// import transformation
// L3: pub mod gizmos;
// L4: pub mod selection;
// L5: pub mod transformation;
// L10: pub struct InteractionPlugin;
// L12-L14: fn build(&self, app: &mut App)


================================================
FILE: studio/src/interaction/selection.rs
================================================
// [OUTLINE - 16 symbols, 297 lines]
// import std
// import bevy
// import bevy_mod_outline
// import bevy_mod_picking
// import space_editor
// import crate
// import bevy
// import wasm_bindgen
// import super
// import crate
// L15: pub struct SelectionPlugin;
// L17-L53: fn build(&self, app: &mut App)
// L58: pub struct Selectable;
// L61: pub struct Selection(Entity);
// L63-L101: fn propagate_space_editor_to_studio(
// L103-L121: fn tag_scene_elements(
// L123-L149: fn update_selection(
// L151-L167: fn nearest_selectable_parent(
// L170: pub struct MarkedForDeletion;
// L172-L192: fn process_delete_inputs(
// L194-L198: fn finalize_delete(mut cmd: Commands, q: Query<Entity, With<MarkedForDeletion>>)
// L200-L245: fn draw_selection_outline(
// L248-L297: mod wasm
// L276-L282: pub(super) fn notify_entity_selection_change(
// L287-L290: pub fn select(entity: &str)
// L292-L296: pub(super) fn update_selection_from_frontend(mut cmd: Commands)


================================================
FILE: studio/src/interaction/transformation.rs
================================================
// [OUTLINE - 12 symbols, 132 lines]
// import core
// import bevy
// import bitflags
// import wasm_bindgen
// import super
// import bevy
// import wasm_bindgen
// import crate
// import super
// L9: pub struct TransformationPlugin;
// L12-L17: fn build(&self, app: &mut App)
// L21-L24: pub struct TransformMode
// L27-L32: fn default() -> Self
// L37-L41: pub enum TransformSpace
// L53-L83: fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result
// L87-L132: mod wasm
// L97-L101: pub enum JsTransformType
// L104-L106: fn from(value: u8) -> Self
// L113-L115: pub fn set_transform_type(flags: u8)
// L118-L120: pub fn set_transform_space(space: TransformSpace)
// L122-L131: pub(super) fn update_transform_mode(mut xform_mode: ResMut<TransformMode>)


================================================
FILE: studio/src/main-headless.rs
================================================
// [OUTLINE - 9 symbols, 272 lines]
// import bevy
// import clap
// import studio
// L16-L19: struct StudioArgs
// L22-L66: enum Subcommands
// L69: struct CommonArgs
// L71-L178: fn main()
// L180-L211: pub(crate) fn update_camera_motion(
// L213-L221: fn zoom_camera(main_cam_transform: &mut Transform, time: &Time<()>, speed: f32)
// L223-L231: fn pan_camera(main_cam_transform: &mut Transform, time: &Time<()>, speed: f32)
// L233-L243: fn orbit_camera(main_cam_transform: &mut Mut<'_, Transform>, time: &Res<'_, Time>, speed: f32)
// L249-L272: fn extent3d_parser(input: &str) -> Result<Extent3d, String>


================================================
FILE: studio/src/material/mod.rs
================================================
// [OUTLINE - 4 symbols, 37 lines]
// import crate
// import bevy
// import bevy
// import bevy
// import bevy
// import space_editor
// L8: pub mod short_material;
// L10: pub struct MaterialPlugin;
// L12-L17: fn build(&self, app: &mut App)
// L20-L37: fn apply_short_materials(


================================================
FILE: studio/src/material/short_material.rs
================================================
// [OUTLINE - 2 symbols, 25 lines]
// import bevy
// import bevy
// import bevy
// import bevy
// L9-L14: pub struct ShortMaterial
// L17-L24: pub fn new(material: &StandardMaterial) -> Self


================================================
FILE: studio/src/math/float_comparison.rs
================================================
// [OUTLINE - 11 symbols, 98 lines]
// import bevy
// import super
// L7-L19: pub trait NearlyEq<Rhs, Tolerance = Rhs>
// L11-L16: fn nearly_eq(self, rhs: Rhs) -> bool
// L25-L27: fn nearly_eq_within(self, rhs: f32, tolerance: f32) -> bool
// L34-L36: fn nearly_eq_within(self, rhs: f64, tolerance: f64) -> bool
// L42-L46: fn nearly_eq_within(self, rhs: Vec3, tolerance: f32) -> bool
// L51-L53: fn zero() -> Self
// L59-L63: fn nearly_eq_within(self, rhs: DVec3, tolerance: f64) -> bool
// L68-L70: fn zero() -> Self
// L73-L85: pub trait NearlyZero<Tolerance = Self>
// L77-L82: fn nearly_zero(self) -> bool
// L95-L97: fn nearly_zero_within(self, tolerance: Tolerance) -> bool


================================================
FILE: studio/src/math/geo.rs
================================================
// [OUTLINE - 9 symbols, 165 lines]
// import bevy
// import std
// L10-L14: pub struct Cone
// L17-L56: fn from(c: Cone) -> Self
// L59-L61: pub struct Plane2Sided
// L64-L66: fn default() -> Self
// L70-L115: fn from(p: Plane2Sided) -> Self
// L118-L122: pub trait Extrema
// L127-L141: fn extrema(&self) -> Self::Output
// L144-L149: pub trait Combinable
// L155-L164: fn combine<'a>(elements: impl Iterator<Item = Self::IterItem<'a>>) -> Self::Output


================================================
FILE: studio/src/math/internal.rs
================================================
// [OUTLINE - 8 symbols, 34 lines]
// L4: pub(super) trait Zero
// L5: fn zero() -> Self
// L6: fn zero() -> Self
// L8: pub(super) trait One
// L9: fn one() -> Self
// L10: fn one() -> Self
// L12-L14: pub(super) trait Clamp
// L21-L33: fn clamp(mut self, min: Self, max: Self) -> Self


================================================
FILE: studio/src/math/interp/ecs.rs
================================================
// [OUTLINE - 14 symbols, 132 lines]
// import bevy
// import space_editor
// import crate
// import super
// L8: pub struct InterpolationPlugin;
// L11: pub struct InterpolationSystem;
// L14-L20: fn build(&self, app: &mut App)
// L25: pub struct Interp(pub f32);
// L27-L35: pub struct Interpolation<T>
// L42-L45: fn tick(&mut self, dt: f32) -> &mut Self
// L47-L62: pub fn current(&self) -> T
// L70-L77: fn default() -> Self
// L81-L85: pub struct InterpVelocity
// L89: pub struct Velocity(pub Vec3);
// L92-L96: pub struct InterpPosition
// L98-L105: fn interp_velocity(time: Res<Time>, mut q_interp: Query<(&mut Velocity, &mut InterpVelocity)>)
// L107-L114: fn interp_position(time: Res<Time>, mut q_interp: Query<&mut InterpPosition>)
// L116-L132: fn cleanup_finished_interps(


================================================
FILE: studio/src/math/interp/mod.rs
================================================
// [OUTLINE - 4 symbols, 22 lines]
// import ecs
// import traits
// L6: mod ecs;
// L7: mod traits;
// L10-L16: pub enum Easing
// L19-L21: fn default() -> Self


================================================
FILE: studio/src/math/interp/traits.rs
================================================
// [OUTLINE - 14 symbols, 188 lines]
// import std
// import bevy
// import crate
// import std
// import std
// import std
// import std
// import std
// import std
// L10-L13: pub trait Lerp<Operand>
// L15-L29: pub trait InvLerp<T: Sized>
// L31-L49: pub trait Remap<T: Sized>
// L51-L88: pub trait CurveSin
// L99-L101: fn lerp(self, a: Operand, b: Operand) -> Operand
// L114-L121: fn inv_lerp(self, a: T, b: T) -> T
// L128-L136: fn inv_lerp(self, a: Vec3, b: Vec3) -> f32
// L145-L147: fn remap(self, from: (Self, Self), to: (Self, Self)) -> Self
// L151-L155: fn curve_sin(self) -> Self
// L157-L161: fn curve_sin_in(self) -> Self
// L163-L167: fn curve_sin_out(self) -> Self
// L171-L175: fn curve_sin(self) -> Self
// L177-L181: fn curve_sin_in(self) -> Self
// L183-L187: fn curve_sin_out(self) -> Self


================================================
FILE: studio/src/math/matrix.rs
================================================
// [OUTLINE - 10 symbols, 102 lines]
// import bevy
// L6-L13: pub trait MatrixExtras
// L15-L20: pub trait VecExtras
// L24-L37: fn decompose_scale(&self) -> Mat3A
// L40-L52: fn decompose_scale_rotation(&self) -> (Mat3A, Mat3A)
// L55-L69: fn orthonormalize(&self) -> Self
// L74-L76: fn decompose_scale(&self) -> Self
// L79-L82: fn decompose_scale_rotation(&self) -> (Mat3, Mat3)
// L85-L87: fn orthonormalize(&self) -> Self
// L92-L94: fn from_scale_mat(matrix: Mat3A) -> Self
// L99-L101: fn from_scale_mat(matrix: Mat3A) -> Self


================================================
FILE: studio/src/math/mod.rs
================================================
// [OUTLINE - 7 symbols, 22 lines]
// import bevy
// import float_comparison
// import geo
// import interp
// import matrix
// L3: mod float_comparison;
// L4: pub mod geo;
// L5: mod internal;
// L6: pub mod interp;
// L7: pub mod matrix;
// L14-L16: pub trait IsNonUniform
// L19-L21: fn is_non_uniform(&self) -> bool


================================================
FILE: studio/src/mixamo.rs
================================================
// [OUTLINE - 11 symbols, 137 lines]
// import bevy
// import crate
// L5: pub struct MixamoPlugin;
// L7-L21: fn build(&self, app: &mut App)
// L26-L31: pub enum MixamoState
// L34: pub struct MixamoImport(pub Handle<Gltf>);
// L37: pub struct MixamoImportEvent(pub String);
// L40: pub struct MixamoScene(pub InstanceId);
// L42-L51: fn import_mixamo_scene(
// L53-L71: fn tick_mixamo_import(
// L73-L94: fn spawn_mixamo_scene(
// L96-L104: fn tick_scene_spawning(
// L106-L137: fn start_mixamo_anim(


================================================
FILE: studio/src/path.rs
================================================
// [OUTLINE - 3 symbols, 40 lines]
// import std
// L3-L7: pub trait PathExtras
// L10-L14: fn ext_file_prefix(&self) -> Option<&OsStr>
// L18-L40: fn split_file_at_dot(file: &OsStr) -> (&OsStr, Option<&OsStr>)


================================================
FILE: studio/src/persistance/mod.rs
================================================
// [OUTLINE - 9 symbols, 122 lines]
// import bevy
// import space_editor
// import crate
// import bevy
// import space_editor
// import wasm_bindgen
// import crate
// L6: pub struct PersistancePlugin;
// L9-L29: fn build(&self, app: &mut App)
// L33: pub struct DebugPersistanceTab
// L36-L56: fn ui(
// L58-L60: fn title(&self) -> bevy_inspector_egui::egui::WidgetText
// L64-L122: mod wasm
// L74-L76: pub fn save_scene()
// L78-L82: pub(super) fn forward_save_scene_events(mut ew_editor_events: EventWriter<EditorEvent>)
// L98-L121: pub(super) fn on_scene_saved(


================================================
FILE: studio/src/remote/mod.rs
================================================
// [OUTLINE - 4 symbols, 22 lines]
// import bevy
// import self
// L8: mod reader;
// L9: mod response;
// L11: pub struct RemoteAssetPlugin;
// L14-L21: fn build(&self, app: &mut App)


================================================
FILE: studio/src/remote/reader.rs
================================================
// [OUTLINE - 15 symbols, 297 lines]
// import std
// import bevy
// import reqwest
// import super
// import crate
// import std
// import bevy
// import dashmap
// import futures
// import js_sys
// import once_cell
// import wasm_bindgen
// import web_sys
// L14: pub struct RemoteAssetReader;
// L20-L80: async fn load<'a>(&'a self, path: &'a Path) -> Result<Box<Reader<'a>>, AssetReaderError>
// L83-L106: async fn load_local<'a>(&'a self, path: &'a Path) -> Result<Box<Reader<'a>>, AssetReaderError>
// L110-L136: fn read<'a>(
// L138-L144: fn read_meta<'a>(
// L146-L152: fn read_directory<'a>(
// L154-L157: fn is_directory<'a>(&'a self, _: &'a Path) -> BoxedFuture<'a, Result<bool, AssetReaderError>>
// L160-L162: trait IntoError<Output>
// L165-L170: fn into(self) -> AssetReaderError
// L174-L297: mod wasm
// L205-L211: pub fn requested_file_failed(token: String, error: JsValue)
// L215-L222: pub fn requested_file_received(token: String, file: Uint8Array)
// L224-L227: pub enum LoadLocalFromIdb
// L230-L234: pub fn new(file: impl ToString) -> Self
// L243-L295: fn poll(


================================================
FILE: studio/src/remote/response.rs
================================================
// [OUTLINE - 6 symbols, 107 lines]
// import serde
// L6-L9: pub struct GetMediaFileSuccessResponse
// L12-L54: pub struct MediaFileInfo
// L57-L70: pub struct GetMediaFileModelInfo
// L73-L93: pub struct UserDetailsLight
// L96-L99: pub struct DefaultAvatarInfo
// L102-L107: pub struct SimpleEntityStats


================================================
FILE: studio/src/scene/mod.rs
================================================
// [OUTLINE - 27 symbols, 647 lines]
// import bevy
// import serde_repr
// import space_editor
// import wasm_bindgen
// import crate
// import crate
// import crate
// import bevy
// import bevy
// import wgpu
// L36: mod wasm;
// L38: pub struct ScenePlugin;
// L41: pub struct SceneSpawnerSystem;
// L44-L114: fn build(&self, app: &mut App)
// L118: pub struct SkyboxHolder(pub Option<Skybox>);
// L120-L132: fn attach_skybox(
// L134-L150: fn minimal_scene_setup(mut cmd: Commands)
// L154-L159: pub enum SceneState
// L162-L166: pub struct ActiveScene
// L169-L171: pub struct LoadingQueue
// L173-L224: fn check_loading(
// L226-L234: fn auto_add_handle<T: Asset>(
// L254: pub struct LoadLibraryObjectEvent(pub String);
// L263: pub struct LoadSceneEvent(pub String);
// L268-L271: pub struct ImportSceneEvent
// L284-L292: pub enum SceneElement
// L295-L297: pub struct SceneData
// L300: pub struct SceneRoot;
// L303-L346: fn initialize(mut cmd: Commands)
// L349-L396: fn initialize(
// L398-L412: fn init_object_loading(mut cmd: Commands, mut er: EventReader<LoadLibraryObjectEvent>)
// L414-L440: fn init_scene_import(
// L442-L452: fn init_scene_loading(
// L454-L479: fn tag_scene_elements(
// L481-L537: fn autoplay_animations(
// L539-L640: fn frame_scene_in_view(
// L643-L647: fn start_capture(mut captures: Query<&mut ScreenCapture, Added<ScreenCapture>>)


================================================
FILE: studio/src/scene/wasm.rs
================================================
// [OUTLINE - 6 symbols, 111 lines]
// import bevy
// import serde
// import wasm_bindgen
// import super
// import crate
// L18-L21: struct AssetImport
// L28-L32: pub fn spawn_asset(asset: JsValue) -> Result<(), JsValue>
// L39-L43: pub fn spawn_assets(assets: JsValue) -> Result<(), JsValue>
// L45-L51: pub(super) fn handle_spawn_asset_messages(mut ew_import_scene: EventWriter<ImportSceneEvent>)
// L67-L75: pub(super) fn notify_state_changes(
// L91-L111: pub(super) fn notify_loading_queue_changes(


================================================
FILE: studio/src/screenshot.rs
================================================
// [OUTLINE - 20 symbols, 338 lines]
// import bevy
// import bytemuck
// import image
// import std
// import wgpu
// import crate
// L30: pub struct ScreenShotPlugin;
// L33-L69: fn build(&self, app: &mut App)
// L77-L83: pub struct ScreenCapture
// L86-L94: pub fn from_out(output_dir: &str) -> Self
// L96-L99: pub fn with_max_frames(mut self, max_frames: u32) -> Self
// L101-L104: pub fn capture_depth(mut self) -> Self
// L106-L108: pub fn is_capturing(&self) -> bool
// L110-L112: pub fn stop_capturing(&mut self)
// L114-L116: pub fn start_capturing(&mut self)
// L118-L120: pub fn should_capture(&self) -> bool
// L122-L124: pub fn frames_captured(&self) -> u32
// L126-L128: pub fn max_frames(&self) -> u32
// L131-L152: fn update_screen_capture_on_extract_step(
// L155-L172: fn extract_screen_capture_components(
// L179-L184: struct ScreenCaptureBuffers
// L188-L218: fn prepare_screen_capture_buffers(
// L225: struct ScreenCaptureNode;
// L236-L256: fn run(
// L265-L316: fn save_buffer_to_file(
// L318-L338: fn save_buffer<P: Pixel + PixelWithColorType>(


================================================
FILE: studio/src/skybox.rs
================================================
// [OUTLINE - 10 symbols, 153 lines]
// import bevy
// import crate
// import bevy
// import wasm_bindgen
// import crate
// import super
// L5: pub struct SkyboxPlugin;
// L8-L21: fn build(&self, app: &mut App)
// L25: pub struct SkyboxId(pub String);
// L28-L32: struct SkyboxAssets
// L34-L57: fn load_skybox(mut cmd: Commands, _assets: Res<AssetServer>, id: Res<SkyboxId>)
// L59-L81: fn skybox_assets_loaded(
// L83-L114: fn spawn_skybox(
// L133-L153: mod wasm
// L144-L146: pub fn set_skybox(id: &str)
// L148-L152: pub(super) fn set_skybox_from_frontend(mut cmd: Commands)


================================================
FILE: studio/src/ui/blocking.rs
================================================
// [OUTLINE - 5 symbols, 76 lines]
// import std
// import bevy
// import space_editor
// import wasm_bindgen
// import crate
// L15: pub struct UiBlockingPlugin;
// L18-L20: fn build(&self, app: &mut App)
// L23-L59: fn read_command_system(mut commands: Commands, mut change_event: EventWriter<NewChange>)
// L63-L68: pub enum BlockingCommand
// L73-L76: pub fn dispatch_command(command: BlockingCommand)


================================================
FILE: studio/src/ui/fps.rs
================================================
// [OUTLINE - 6 symbols, 78 lines]
// import bevy
// import crate
// L8: pub(super) struct FpsCounterPlugin;
// L11-L19: fn build(&self, app: &mut App)
// L23: struct FramerateCounter;
// L25-L50: fn layout(mut cmd: Commands)
// L52-L66: fn update(
// L68-L78: fn update_visibility(


================================================
FILE: studio/src/ui/inspector.rs
================================================
// [OUTLINE - 33 symbols, 804 lines]
// import std
// import bevy
// import serde
// import serde_json
// import space_editor
// import wasm_bindgen
// import crate
// import crate
// L29: pub struct InspectorPlugin;
// L32-L139: fn build(&self, app: &mut App)
// L142-L152: fn create_short_materials(
// L155-L169: struct InspectGetters
// L171-L174: trait AppInspectable
// L177-L209: fn register_inspect<T: Component + Reflect + GetTypeRegistration>(&mut self)
// L211-L229: fn register_asset_inspect<T: Asset + Reflect + GetTypeRegistration>(&mut self)
// L233: pub struct TestInspectorTab
// L236-L249: fn ui(
// L251-L253: fn title(&self) -> bevy_inspector_egui::egui::WidgetText
// L257-L262: pub enum InspectorSystem
// L265-L267: pub struct UpdateInspect<T>
// L270: pub struct UpdateEntityDescription;
// L273-L277: fn default() -> Self
// L281-L286: struct Rgba
// L288-L444: fn update_field_by_ui(world: &mut World) -> Result<(), String>
// L396-L401: struct JsonQuat
// L447-L449: pub struct EntityDescription
// L451-L455: fn update_inspect_by_select_change<T: Component + Reflect + GetTypeRegistration>(
// L457-L464: fn update_inspect_by_remove<T: Component + Reflect + GetTypeRegistration>(
// L466-L476: fn update_inspect_by_change<T: Component + Reflect + GetTypeRegistration>(
// L478-L510: fn auto_serialize_system<T: Component + Reflect + GetTypeRegistration>(
// L512-L532: fn notify_asset_change_system<T: Asset>(
// L534-L582: fn auto_serialize_asset<T: Asset + Reflect + GetTypeRegistration>(
// L584-L640: fn serialize_standart_materal(
// L642-L676: fn update_description(
// L679-L696: fn find_handle_in_self_or_children<T: Asset>(
// L700-L704: pub struct UpdateField
// L728-L733: pub(super) fn notify_changed(q_window: &Window, msg: String)
// L738-L743: pub fn update_component_field(msg: JsValue) -> Result<(), JsValue>
// L755-L759: pub enum RotationAxis
// L762-L764: pub fn rotate_local_transform(axis: RotationAxis, theta: f32)
// L766-L804: fn update_local_rotation_by_ui(


================================================
FILE: studio/src/ui/mod.rs
================================================
// [OUTLINE - 5 symbols, 25 lines]
// import bevy
// import self
// L5: mod fps;
// L8: mod blocking;
// L11: pub mod inspector;
// L13: pub struct UiLayerPlugin;
// L16-L24: fn build(&self, app: &mut App)


================================================
FILE: studio/src/viewport.rs
================================================
// [OUTLINE - 13 symbols, 114 lines]
// import core
// import bevy
// import serde
// import wasm_bindgen
// import bevy
// import wasm_bindgen
// import crate
// import super
// L9-L12: pub struct ViewportSize
// L17-L19: pub fn new(width: f32, height: f32) -> Self
// L23-L25: fn default() -> Self
// L29-L31: fn from(value: ViewportSize) -> Self
// L35-L40: fn from(value: WindowResolution) -> Self
// L44-L46: fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result
// L50-L114: pub mod wasm
// L64-L66: pub fn resize(viewport_size: ViewportSize)
// L68: pub struct ViewportPlugin;
// L71-L76: fn build(&self, app: &mut App)
// L80: struct ViewportResizeEvent(ViewportSize);
// L82-L103: fn sync_window_to_viewport(
// L105-L113: fn dispatch_resize_events(mut events: EventWriter<ViewportResizeEvent>)


================================================
FILE: studio/src/wasm/conv.rs
================================================
// [OUTLINE - 17 symbols, 189 lines]
// import bevy
// import serde
// import serde_wasm_bindgen
// import wasm_bindgen
// L34-L36: pub trait AsJsValue
// L38-L40: pub trait AsJson
// L43-L48: fn as_json(&self) -> JsonValue
// L52-L57: fn as_json(&self) -> JsonValue
// L61-L70: fn as_json(&self) -> JsonValue
// L74-L85: fn as_json(&self) -> JsonValue
// L89-L91: fn as_json(&self) -> JsonValue
// L98-L102: fn as_js(&self) -> Result<JsValue, String>
// L109-L111: fn as_js(&self) -> Result<JsValue, String>
// L115-L117: fn as_js(&self) -> Result<JsValue, String>
// L121-L123: fn as_js(&self) -> Result<JsValue, String>
// L127-L129: fn as_js(&self) -> Result<JsValue, String>
// L136-L141: fn as_js(&self) -> Result<JsValue, String>
// L145-L147: fn as_js(&self) -> Result<JsValue, String>
// L151-L153: fn as_js(&self) -> Result<JsValue, String>
// L158-L162: pub trait FromStr: Sized
// L167-L188: fn from_str(s: &str) -> Result<Self, Self::Err>


================================================
FILE: studio/src/wasm/init.rs
================================================
// [OUTLINE - 6 symbols, 155 lines]
// import bevy
// import serde
// import wasm_bindgen
// import crate
// L26-L36: struct WasmInitOptions
// L39-L61: pub fn init_from_library(object_id: String, options: JsValue) -> Result<(), JsValue>
// L64-L86: pub fn init_from_bvh(anim_path: String, options: JsValue) -> Result<(), JsValue>
// L89-L111: pub fn init_from_mixamo(anim_path: String, options: JsValue) -> Result<(), JsValue>
// L114-L136: pub fn init_from_scene_import(scene_path: String, options: JsValue) -> Result<(), JsValue>
// L139-L155: pub fn init_from_storyteller_scene(scene_path: String, options: JsValue) -> Result<(), JsValue>


================================================
FILE: studio/src/wasm/mod.rs
================================================
// [OUTLINE - 6 symbols, 34 lines]
// import std
// import parking_lot
// import wasm_bindgen
// import conv
// import screenshot
// import pub(crate) use util
// L6: mod conv;
// L7: mod init;
// L8: mod screenshot;
// L9: mod util;
// L22-L28: pub fn is_initialized() -> bool
// L30-L34: pub(crate) fn initialize()


================================================
FILE: studio/src/wasm/screenshot.rs
================================================
// [OUTLINE - 12 symbols, 211 lines]
// import bevy
// import image
// import wasm_bindgen
// import crate
// import super
// L23: pub struct ScreenshotPlugin;
// L26-L40: fn build(&self, app: &mut App)
// L44: pub struct ScreenshotRequestedEvent;
// L48-L52: pub struct Screenshot
// L56-L60: struct ScreenshotNative
// L63-L69: fn from(value: ScreenshotNative) -> Self
// L75-L77: pub fn data(&self) -> js_sys::Uint8Array
// L81-L83: fn as_js(&self) -> Result<JsValue, String>
// L87-L90: pub fn request_screenshot()
// L92-L110: fn prepare_screenshot(
// L112-L169: fn take_screenshots(
// L185-L211: fn send_screenshots(


================================================
FILE: studio/src/wasm/util.rs
================================================
// [OUTLINE - 6 symbols, 85 lines]
// import std
// import bevy
// import parking_lot
// import web_sys
// import super
// L11-L17: pub(crate) trait StaticBuffer<T>
// L23-L25: fn inner(&self) -> &Self::Inner
// L28-L33: fn write_message(&self, value: T)
// L36-L39: fn take_message(&self) -> Option<T>
// L42-L65: pub(crate) fn dispatch_to_js(
// L67-L85: fn try_get_canvas(window: &Window) -> Result<Element, String>


================================================
FILE: studio/src/world_grid.rs
================================================
// [OUTLINE - 8 symbols, 80 lines]
// import bevy
// import crate
// L9: pub struct WorldGridPlugin;
// L12-L16: fn build(&self, app: &mut App)
// L20: pub struct WorldGridPlane;
// L23: struct ProceduralGridMaterial
// L26-L28: fn fragment_shader() -> ShaderRef
// L30-L32: fn alpha_mode(&self) -> AlphaMode
// L35-L68: fn spawn_world_grid(
// L70-L80: fn move_plane_with_camera(


================================================
FILE: studio-bvh/LICENSE
================================================
Copyright 2019-2020 George Burton

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
the Software, and to permit persons to whom the Software is furnished to do so,
subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.


================================================
FILE: studio-bvh/project.json
================================================
// [OUTLINE - 21 symbols, 31 lines]
// L2: "name": "studio-bvh"
// L3: "$schema": "../node_modules/nx/schemas/project-schema.json"
// L4: "projectType": "library"
// L5: "sourceRoot": "./studio-bvh/src"
// L6-L29: "targets":
// L7-L16: "build":
// L8: "executor": "@nxrs/cargo:build"
// L9-L10: "options":
// L11-L15: "configurations":
// L12-L14: "production":
// L13: "release": true
// L17-L20: "test":
// L18: "executor": "@nxrs/cargo:test"
// L19: "options":
// L21-L28: "lint":
// L22: "executor": "@nxrs/cargo:clippy"
// L23-L27: "options":
// L24: "fix": false
// L25: "failOnWarnings": true
// L26: "noDeps": true
// L30: "tags": []


================================================
FILE: studio-bvh/src/errors.rs
================================================
// [AST-Smart Truncation: Full content exceeds budget, outline shown below]
// [OUTLINE - 0 symbols, 38 lines]
