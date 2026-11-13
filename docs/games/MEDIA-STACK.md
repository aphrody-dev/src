# Media, 3D, codec and engine upstreams: tracking matrix (2026-11-13)

This file records the state of upstream projects. It does not choose them: codec and container choices are in `docs/tv/plan-ecosysteme-c-rust.mdx`, the UI stack in `docs/ui/STACK.md`, the plan in [PLAN.md](PLAN.md).

- Source of every row: `gh api repos/<owner>/<repo>` (SPDX id, stars, last push) and `gh api repos/<owner>/<repo>/contents` (license file names), run on 2026-11-13. Tables are not sorted; stars are a popularity signal only.
- "Policy" is a mechanical mapping of the SPDX id reported by GitHub onto `docs/ARCHITECTURE.md` lines 405 to 411 and `deny.toml`, not a legal review: `allowed` when the id is in the allow-list, `refused` for GPL, LGPL and AGPL as a linked dependency (such a tool can only run as an external process), `review` when GitHub reports `NOASSERTION`, nothing, or an id outside the allow-list. License files are named so the review can start from them.

## Applications and frameworks

| Repo                | SPDX (GitHub) | License files                                                              | Policy                                                                     |  Stars | Last push  | Role                          |
| :------------------ | :------------ | :------------------------------------------------------------------------- | :------------------------------------------------------------------------- | -----: | :--------- | :---------------------------- |
| FFmpeg/FFmpeg       | NOASSERTION   | COPYING.GPLv2, COPYING.GPLv3, COPYING.LGPLv2.1, COPYING.LGPLv3, LICENSE.md | reviewed exception: dynamic linking through `ffmpeg-next`, LGPL build only |  67162 | 2026-11-13 | demux, decode, encode, filter |
| blender/blender     | NOASSERTION   | COPYING                                                                    | review                                                                     |  21934 | 2026-11-12 | DCC, glTF and USD I/O         |
| videolan/vlc        | GPL-2.0       |                                                                            | refused                                                                    |  20440 | 2026-11-12 | player, libvlc                |
| yt-dlp/yt-dlp       | Unlicense     |                                                                            | allowed (Python CLI, external process)                                     | 207357 | 2026-11-04 | site extraction               |
| mltframework/mlt    | LGPL-2.1      |                                                                            | refused                                                                    |   1875 | 2026-11-13 | video editing framework       |
| GStreamer/gstreamer | NOASSERTION   | LICENSE                                                                    | review                                                                     |   3371 | 2026-11-13 | pipeline framework            |
| gpac/gpac           | LGPL-2.1      |                                                                            | refused                                                                    |   3328 | 2026-11-12 | MP4, DASH and HLS packaging   |
| libvips/libvips     | LGPL-2.1      |                                                                            | refused                                                                    |  11803 | 2026-11-12 | image processing library      |

## 3D and scene formats

| Repo                            | SPDX (GitHub) | License files                        | Policy  | Stars | Last push  | Role                                         |
| :------------------------------ | :------------ | :----------------------------------- | :------ | ----: | :--------- | :------------------------------------------- |
| assimp/assimp                   | NOASSERTION   | LICENSE                              | review  | 13321 | 2026-11-12 | importer for many 3D formats (C++)           |
| KhronosGroup/glTF               | NOASSERTION   | COPYING.adoc, LICENSE.adoc, LICENSES | review  |  7888 | 2026-11-12 | glTF and GLB specification                   |
| PixarAnimationStudios/OpenUSD   | NOASSERTION   | LICENSE.txt, NOTICE.txt              | review  |  7643 | 2026-11-11 | USD scene description (default branch `dev`) |
| google/draco                    | Apache-2.0    |                                      | allowed |  7551 | 2026-11-11 | mesh and point-cloud compression             |
| KhronosGroup/KTX-Software       | NOASSERTION   | LICENSE.md, LICENSES, NOTICE.md      | review  |  1399 | 2026-11-10 | KTX2 textures                                |
| KhronosGroup/glTF-Sample-Assets | none reported | not read                             | review  |  1156 | 2026-11-12 | sample assets                                |
| gltf-rs/gltf                    | Apache-2.0    |                                      | allowed |   644 | 2026-05-11 | Rust glTF 2.0 loader                         |

## Image, fonts and text

| Repo                                  | SPDX (GitHub) | License files        | Policy                                                                  | Stars | Last push  | Role                             |
| :------------------------------------ | :------------ | :------------------- | :---------------------------------------------------------------------- | ----: | :--------- | :------------------------------- |
| ImageMagick/ImageMagick               | NOASSERTION   | LICENSE, NOTICE      | review                                                                  | 17854 | 2026-11-13 | convert and edit CLI and library |
| mozilla/mozjpeg                       | NOASSERTION   | LICENSE.md           | review                                                                  |  5747 | 2025-06-23 | JPEG encoder                     |
| libjpeg-turbo/libjpeg-turbo           | NOASSERTION   | LICENSE.md           | review                                                                  |  4468 | 2026-11-09 | JPEG codec                       |
| lovell/sharp                          | Apache-2.0    |                      | allowed, but an npm native addon (the repository prefers Bun built-ins) | 32843 | 2026-11-12 | Node image pipeline              |
| image-rs/image                        | Apache-2.0    |                      | allowed; pinned 0.25.10 in the workspace                                |  5912 | 2026-11-11 | Rust image decode and encode     |
| linebender/resvg                      | Apache-2.0    |                      | allowed; `aphrody-ui` uses 0.50.0                                       |  4187 | 2026-11-11 | SVG rendering (Rust)             |
| strukturag/libheif                    | NOASSERTION   | COPYING              | review                                                                  |  2421 | 2026-10-26 | HEIF and AVIF                    |
| webmproject/libwebp                   | BSD-3-Clause  |                      | allowed                                                                 |  2432 | 2026-11-12 | WebP                             |
| AOMediaCodec/libavif                  | NOASSERTION   | LICENSE              | review                                                                  |  2228 | 2026-11-06 | AVIF                             |
| AcademySoftwareFoundation/OpenImageIO | Apache-2.0    |                      | allowed                                                                 |  2403 | 2026-11-13 | image I/O for VFX                |
| AcademySoftwareFoundation/OpenColorIO | BSD-3-Clause  |                      | allowed                                                                 |  2142 | 2026-10-01 | color management                 |
| AcademySoftwareFoundation/openexr     | BSD-3-Clause  |                      | allowed                                                                 |  1883 | 2026-11-13 | EXR                              |
| pnggroup/libpng                       | NOASSERTION   | LICENSE.md, LICENSES | review                                                                  |  1679 | 2026-11-11 | PNG (default branch `libpng18`)  |
| google/libultrahdr                    | NOASSERTION   | not read             | review                                                                  |   356 | 2026-11-12 | gain-map HDR images              |
| harfbuzz/harfbuzz                     | NOASSERTION   | not read             | review                                                                  |  6222 | 2026-11-13 | text shaping                     |
| freetype/freetype                     | NOASSERTION   | not read             | review                                                                  |   929 | 2026-11-11 | font rasterizer                  |
| googlefonts/fontations                | Apache-2.0    |                      | allowed                                                                 |   854 | 2026-11-12 | Rust font stack                  |

## Audio and video codecs, containers

| Repo                     | SPDX (GitHub)        | License files                    | Policy                                             | Stars | Last push  | Role                                         |
| :----------------------- | :------------------- | :------------------------------- | :------------------------------------------------- | ----: | :--------- | :------------------------------------------- |
| libsdl-org/SDL           | Zlib                 |                                  | allowed                                            | 16983 | 2026-11-12 | window, input, audio and GPU layer           |
| mackron/miniaudio        | NOASSERTION          | LICENSE                          | review                                             |  7622 | 2026-11-13 | single-header audio I/O                      |
| xiph/rav1e               | BSD-2-Clause         |                                  | allowed                                            |  4165 | 2026-11-06 | AV1 encoder (Rust)                           |
| RustAudio/cpal           | Apache-2.0           |                                  | allowed                                            |  4020 | 2026-11-11 | Rust audio I/O                               |
| pdeljanov/Symphonia      | MPL-2.0              |                                  | allowed as an unmodified registry dependency       |  3482 | 2026-11-08 | Rust audio demux and decode                  |
| xiph/opus                | NOASSERTION          | COPYING, LICENSE_PLEASE_READ.txt | review                                             |  3377 | 2026-11-06 | Opus codec                                   |
| xiph/flac                | GFDL-1.3 as reported | not read                         | review (the reported id is outside the allow-list) |  2477 | 2026-10-28 | FLAC codec                                   |
| videolan/dav1d           | BSD-2-Clause         |                                  | allowed                                            |   829 | 2026-11-12 | AV1 decoder                                  |
| videolan/x265            | GPL-2.0              |                                  | refused                                            |   814 | 2023-09-11 | HEVC encoder (GitHub mirror, last push 2023) |
| xiph/vorbis              | BSD-3-Clause         |                                  | allowed                                            |   591 | 2026-08-04 | Vorbis codec                                 |
| Matroska-Org/libmatroska | LGPL-2.1             |                                  | refused                                            |   367 | 2026-10-27 | Matroska container                           |
| mirror/x264              | GPL-2.0              |                                  | refused                                            |   351 | 2024-09-25 | H.264 encoder (GitHub mirror)                |
| AOMediaCodec/SVT-AV1     | BSD-3-Clause-Clear   |                                  | review (the id is outside the allow-list)          |   118 | 2026-11-11 | AV1 encoder                                  |

## Engine, GPU and compiler infrastructure

| Repo                    | SPDX (GitHub) | License files | Policy                                                                                                              | Stars | Last push  | Role                                                                                                           |
| :---------------------- | :------------ | :------------ | :------------------------------------------------------------------------------------------------------------------ | ----: | :--------- | :------------------------------------------------------------------------------------------------------------- |
| bevyengine/bevy         | Apache-2.0    |               | allowed; pinned 0.20 (latest release v0.20.1)                                                                       | 49719 | 2026-11-13 | game engine                                                                                                    |
| emilk/egui              | Apache-2.0    |               | allowed; UI framework accepted since the owner amendment of 2026-11-13                                              | 32255 | 2026-11-12 | immediate-mode UI                                                                                              |
| gfx-rs/wgpu             | Apache-2.0    |               | allowed; pinned 30.0.1                                                                                              | 18529 | 2026-11-12 | GPU abstraction                                                                                                |
| rust-windowing/winit    | Apache-2.0    |               | allowed; pinned 0.31.0-beta.4                                                                                       |  6266 | 2026-11-11 | windowing                                                                                                      |
| linebender/vello        | Apache-2.0    |               | allowed                                                                                                             |  4493 | 2026-11-12 | 2D renderer                                                                                                    |
| llvm/llvm-project       | NOASSERTION   | LICENSE.TXT   | review of the file; `Apache-2.0 WITH LLVM-exception` is in the allow-list; fork `aphrody-labs/llvm-project` tracked | 41423 | 2026-11-13 | clang, lld, LLVM IR                                                                                            |
| tree-sitter/tree-sitter | MIT           |               | allowed; pinned 0.27                                                                                                | 27461 | 2026-11-13 | incremental parser; runtime in plain C, interface in `tree_sitter/api.h` (Context7 `/tree-sitter/tree-sitter`) |

## What src already has for import and export

- Media: `crates/tv-core`, `crates/tv-ffmpeg` (wrapper over `ffmpeg-next` 9.1.0, dynamic libav*), `crates/tv-cli`, `crates/tv-i18n`; plan in `docs/tv`.
- Parsing and C ABI: `crates/core` (tree-sitter grammars, BLAKE3, index), `crates/core-capi` (`include/aphrody_core.h`), Bun binding `packages/core/src/ffi.ts`.
- Code graph: `ay graph build` ran on `third_party/ffmpeg/libavutil` on 2026-11-13 and wrote `graphify-out/ffmpeg-libavutil` (5055 nodes, 11345 edges, 198 communities). No other library has been graphed.
- Checkouts: `third_party/ffmpeg` at `46d13a83`, `third_party/artcraft` at `83aad5eb`.
- Candidate format layer, not adopted: `storytold/craft-libs`, 114 Rust crates under Apache-2.0 ([ARTCRAFT.md](ARTCRAFT.md)).

## Not built

- No root directory that imports and exports every format; PLAN.md, conflict 4, explains why none is planned.
- No LLVM IR extraction of FFmpeg, Blender or VLC, and no binding beyond `tv-ffmpeg`.
- Rows marked `review` have had no license review; nothing in them may be linked or vendored before one is recorded in `docs/ARCHITECTURE.md`.
- Conflict to settle: `docs/tv` lists x264 and x265, which are GPL and refused by the policy above.
