# Asset tests

Run 2026-11-13 by `ay assets test --recursive --strict` (packages/assets/src/test.ts) merged with `asset-test` (test/assets) run on fr1 (`ssh vps`, /srv/build/assets, `iteration` profile, Bevy 0.20.1, resvg 0.50, gltf 1.4.1, craft-libs rev a9949872, tv-ffmpeg over the distro FFmpeg 8.1.2 build, libavcodec 62.28.102).

Validators: Bun.Image (decode and re-encode), Khronos glTF-Validator 2.0.0-dev.3.10 (Apache-2.0, checked with `gh api`), gltf crate, headless Bevy `bevy_gltf` load (no GPU), tv-ffmpeg full audio decode, resvg render plus craft-svg signature, Radiance header check, sha256 against the manifest. `ttf-parser` is wired for fonts but ran on no file on fr1.

Limits, stated plainly:

- The Rust stage ran on the 137 entries of the committed manifest.toml (22 GLB, 37 OGG, 56 SVG). Remote pack entries (fonts, HDRIs, textures, models of the other manifests) were only checked locally by sha256 and Bun-side validators, and only for the files already fetched; skipped rows are files not fetched, not passes.
- The FFmpeg used is the fr1 distro build (`--enable-gpl`), not the LGPL third_party/ffmpeg build; that build is not compiled here yet.
- Images: Bun.Image only; craft-formats has no JPEG/PNG decoder.

- date: 2026-11-13
- manifest_entries: 8180
- bun: 1.4.5

| type  | checks | pass | fail | skipped | decode ms (sum) | bytes      |
| ----- | ------ | ---- | ---- | ------- | --------------- | ---------- |
| audio | 74     | 74   | 0    | 0       | 221.2           | 839366     |
| font  | 748    | 748  | 0    | 0       | 66.4            | 154791584  |
| hdri  | 722    | 642  | 0    | 80      | 217.2           | 1045075922 |
| image | 6128   | 18   | 0    | 6110    | 38.8            | 8618208    |
| model | 337    | 88   | 0    | 249     | 1207.1          | 2763712    |
| svg   | 168    | 168  | 0    | 0       | 5.2             | 78909      |

No failures.

## Validators

| validator              | checks | mean ms |
| ---------------------- | ------ | ------- |
| Bun.Image              | 9      | 4.108   |
| bevy-headless          | 22     | 44.555  |
| craft-formats          | 56     | 0.001   |
| gltf-crate             | 22     | 4.463   |
| khronos-gltf-validator | 22     | 5.828   |
| present                | 6439   | 0.000   |
| radiance-header        | 321    | 0.017   |
| resvg                  | 56     | 0.085   |
| sha256                 | 1193   | 0.236   |
| tv-ffmpeg              | 37     | 5.967   |

Per-asset rows are in report.json (more than 300 checks).
