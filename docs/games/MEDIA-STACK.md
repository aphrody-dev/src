# Media, 3D and codec libraries: sourced matrix (2026-11-13)

Source: `gh api repos/<owner>/<repo>` run on 2026-11-13 (stars, last push, SPDX). `NOASSERTION` means GitHub could not map the LICENSE file to one SPDX id (multi-license or custom): read the repository LICENSE before any redistribution. Tables are unsorted; stars are a popularity signal only, not a fit or quality measure.

## Applications (the monorepo import/export targets)

| Repo | License (SPDX) | Stars | Last push | Role |
| :--- | :--- | ---: | :--- | :--- |
| FFmpeg/FFmpeg | NOASSERTION | 67162 | 2026-11-13 | demux, decode, encode, filter, every codec |
| blender/blender | NOASSERTION | 21934 | 2026-11-12 | DCC, glTF/USD I/O |
| videolan/vlc | GPL-2.0 | 20440 | 2026-11-12 | player, libvlc |
| yt-dlp/yt-dlp | Unlicense | 207357 | 2026-11-04 | YouTube and site extraction (Python) |
| mltframework/mlt | LGPL-2.1 | 1875 | 2026-11-13 | video editing framework |
| GStreamer/gstreamer | NOASSERTION | 3371 | 2026-11-13 | pipeline framework |
| gpac/gpac | LGPL-2.1 | 3328 | 2026-11-12 | MP4/DASH/HLS packaging |

## 3D and scene formats

| Repo | License | Stars | Last push | Role |
| :--- | :--- | ---: | :--- | :--- |
| assimp/assimp | NOASSERTION | 13321 | 2026-11-12 | importer for many 3D formats (C++) |
| KhronosGroup/glTF | NOASSERTION | 7888 | 2026-11-12 | glTF/GLB specification |
| PixarAnimationStudios/OpenUSD | NOASSERTION | 7643 | 2026-11-11 | USD scene description (default branch `dev`) |
| google/draco | Apache-2.0 | 7551 | 2026-11-11 | mesh/point-cloud compression |
| KhronosGroup/KTX-Software | NOASSERTION | 1399 | 2026-11-10 | KTX2 / Basis Universal textures |
| KhronosGroup/glTF-Sample-Assets | (empty in the API response) | 1156 | 2026-11-12 | conformance test assets |
| gltf-rs/gltf | Apache-2.0 | 644 | 2026-05-11 | Rust glTF 2.0 loader (last push 6 months old) |

## Image

| Repo | License | Stars | Last push | Role |
| :--- | :--- | ---: | :--- | :--- |
| ImageMagick/ImageMagick | NOASSERTION | 17854 | 2026-11-13 | convert/edit CLI and library |
| mozilla/mozjpeg | NOASSERTION | 5747 | 2025-06-23 | JPEG encoder (stale: last push 2025-06) |
| libjpeg-turbo/libjpeg-turbo | NOASSERTION | 4468 | 2026-11-09 | JPEG codec |
| lovell/sharp | Apache-2.0 | 32843 | 2026-11-12 | Node image pipeline (libvips) |
| image-rs/image | Apache-2.0 | 5912 | 2026-11-11 | Rust image decode/encode |
| linebender/resvg | Apache-2.0 | 4187 | 2026-11-11 | SVG rendering (Rust) |
| strukturag/libheif | NOASSERTION | 2421 | 2026-10-26 | HEIF/AVIF |
| webmproject/libwebp | BSD-3-Clause | 2432 | 2026-11-12 | WebP |
| AOMediaCodec/libavif | NOASSERTION | 2228 | 2026-11-06 | AVIF |
| AcademySoftwareFoundation/OpenImageIO | Apache-2.0 | 2403 | 2026-11-13 | image I/O for VFX (EXR, etc.) |
| AcademySoftwareFoundation/OpenColorIO | BSD-3-Clause | 2142 | 2026-10-01 | color management |
| pnggroup/libpng | NOASSERTION | 1679 | 2026-11-11 | PNG (default branch `libpng18`) |

## Video and audio codecs

| Repo | License | Stars | Last push | Role |
| :--- | :--- | ---: | :--- | :--- |
| mackron/miniaudio | NOASSERTION | 7622 | 2026-11-13 | single-header audio playback/capture |
| libsdl-org/SDL | Zlib | 16983 | 2026-11-12 | window, input, audio, GPU layer for games |
| xiph/opus | NOASSERTION | 3377 | 2026-11-06 | Opus audio codec |
| pdeljanov/Symphonia | MPL-2.0 | 3482 | 2026-11-08 | Rust audio demux/decode |
| videolan/dav1d | BSD-2-Clause | 829 | 2026-11-12 | AV1 decoder |
| xiph/vorbis | BSD-3-Clause | 591 | 2026-08-04 | Vorbis codec |
| AOMediaCodec/SVT-AV1 | BSD-3-Clause-Clear | 118 | 2026-11-11 | AV1 encoder |

## Compiler infrastructure

| Repo | License | Stars | Last push | Role |
| :--- | :--- | ---: | :--- | :--- |
| llvm/llvm-project | NOASSERTION (Apache-2.0 with LLVM exceptions, to confirm in LICENSE.TXT) | 41423 | 2026-11-13 | clang, lld, LLVM IR; fork already tracked as aphrody-labs/llvm-project |
| tree-sitter/tree-sitter | MIT | 27461 | 2026-11-13 | incremental parser, C library with a stable C API |

## Import/export through LLVM and tree-sitter: what is and is not built

- Exists: tree-sitter code graph (`ay graph`, `crates/depot-graph` (crate present; execution of `ay graph` not re-run in this session)), LLVM shared toolchain docs (`docs/llvm/UNIFIED-TOOLCHAIN.md`), C ABI cdylib `crates/core-capi`.
- Not built: a root `C` folder that imports and exports every format of this matrix. Reasons: a new root directory must first be added to `ALLOWED_ROOT_PHYSICAL_DIRS` in `crates/archguard/src/constants.rs` and mirrored in `archguard.rules.json`; no per-format binding has been written or tested; no LLVM IR or tree-sitter extraction of FFmpeg, Blender or VLC has been run (no heavy build on the workstation, builds run on fr1).
- Next step, in order: (1) fork FFmpeg only via `gh-fork` and prove the extraction on it before forking the rest (Epic and Oodle/MSVC stay private); (2) run `just graph third_party/<name> <name>` (recipe `graph` exists in the justfile, line 75) on fr1 for FFmpeg first; (3) only then design the C ABI surface from the extracted public headers.
- Quality bar (Linux kernel, Chromium, Unreal) is a review standard, not a measurable gate yet; no metric is defined here.

## Not yet covered (gaps flagged by review, no data fetched)

- Video encoders (x264, x265, aom, rav1e), audio (FLAC, LAME, fdk-aac), fonts (FreeType, HarfBuzz, fontations), Rust 3D (wgpu, russimp, tobj), HDR/VFX (OpenEXR, libultrahdr), containers (Matroska). Add them with the same `gh api repos/<owner>/<repo>` readout.
- NOASSERTION licenses are unresolved: the real license per repository (for example FFmpeg LGPL/GPL depending on build options) must be read from each LICENSE file before any use.
- Unreal Engine is deliberately outside this matrix (Epic sources: `docs/epic/RESOURCES.md`).
