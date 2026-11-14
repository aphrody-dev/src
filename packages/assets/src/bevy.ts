// Official Bevy Asset Management conventions (https://bevy.org/assets/ & bevy_asset 0.20):
//   - Canonical `assets/` directory layout (brand/, icons/, textures/, models/, audio/, ui/, fonts/, themes/)
//   - RON `.meta` sidecar format (AssetMeta v1.0) paired 1:1 with assets
//   - Web deployment guard: missing `*.meta` requests MUST NOT be masked by 200 OK SPA fallbacks
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, extname, join, relative } from "node:path";

export type BevyLoaderSpec = {
  loader: string;
  settings: string;
};

const LOADER_BY_EXT: Record<string, BevyLoaderSpec> = {
  ".png": {
    loader: "bevy_image::image_loader::ImageLoader",
    settings:
      "(\n            format: FromExtension,\n            is_srgb: true,\n            sampler: Default,\n            asset_usage: (bits: 3),\n        )",
  },
  ".webp": {
    loader: "bevy_image::image_loader::ImageLoader",
    settings:
      "(\n            format: FromExtension,\n            is_srgb: true,\n            sampler: Default,\n            asset_usage: (bits: 3),\n        )",
  },
  ".ktx2": {
    loader: "bevy_image::image_loader::ImageLoader",
    settings:
      "(\n            format: FromExtension,\n            is_srgb: true,\n            sampler: Default,\n            asset_usage: (bits: 3),\n        )",
  },
  ".hdr": {
    loader: "bevy_image::image_loader::ImageLoader",
    settings:
      "(\n            format: FromExtension,\n            is_srgb: false,\n            sampler: Default,\n            asset_usage: (bits: 3),\n        )",
  },
  ".exr": {
    loader: "bevy_image::image_loader::ImageLoader",
    settings:
      "(\n            format: FromExtension,\n            is_srgb: false,\n            sampler: Default,\n            asset_usage: (bits: 3),\n        )",
  },
  ".glb": {
    loader: "bevy_gltf::loader::GltfLoader",
    settings:
      "(\n            load_meshes: (bits: 3),\n            load_materials: (bits: 3),\n            load_cameras: true,\n            load_lights: true,\n            include_source: false,\n        )",
  },
  ".gltf": {
    loader: "bevy_gltf::loader::GltfLoader",
    settings:
      "(\n            load_meshes: (bits: 3),\n            load_materials: (bits: 3),\n            load_cameras: true,\n            load_lights: true,\n            include_source: false,\n        )",
  },
  ".ttf": {
    loader: "bevy_text::font_loader::FontLoader",
    settings: "()",
  },
  ".otf": {
    loader: "bevy_text::font_loader::FontLoader",
    settings: "()",
  },
  ".woff2": {
    loader: "bevy_text::font_loader::FontLoader",
    settings: "()",
  },
  ".svg": {
    loader: "bevy_svg::loader::SvgAssetLoader",
    settings: "(\n            ignore_text: false,\n        )",
  },
  ".ogg": {
    loader: "bevy_audio::audio_source::AudioLoader",
    settings: "()",
  },
  ".wav": {
    loader: "bevy_audio::audio_source::AudioLoader",
    settings: "()",
  },
};

export function bevyLoaderFor(filePath: string): BevyLoaderSpec | null {
  return LOADER_BY_EXT[extname(filePath).toLowerCase()] ?? null;
}

/** Formats a compliant Bevy 0.20 `.meta` RON sidecar (`AssetMeta<L>` v1.0). */
export function renderBevyMeta(
  filePath: string,
  opts?: { pixelArt?: boolean },
): string | null {
  let spec = bevyLoaderFor(filePath);
  if (!spec) return null;
  let settings = spec.settings;
  if (opts?.pixelArt && spec.loader.endsWith("ImageLoader")) {
    settings = settings.replace("sampler: Default", "sampler: Nearest");
  }
  return `(\n    meta_format_version: "1.0",\n    asset: Load(\n        loader: "${spec.loader}",\n        settings: ${settings},\n    ),\n)\n`;
}

/** Validates a `.meta` RON file against Bevy `AssetMeta` v1.0 requirements. */
export function checkBevyMeta(ronText: string, assetPath: string): string[] {
  const errs: string[] = [];
  if (!/meta_format_version:\s*"1\.0"/.test(ronText)) {
    errs.push(`${assetPath}.meta: missing meta_format_version: "1.0"`);
  }
  if (!/asset:\s*Load\s*\(/.test(ronText)) {
    errs.push(`${assetPath}.meta: missing asset: Load(...) block`);
  }
  if (!/loader:\s*"bevy_[a-z0-9_:]+::[A-Za-z0-9_]+"/.test(ronText)) {
    errs.push(`${assetPath}.meta: missing qualified bevy loader path`);
  }
  if (!/settings:\s*\(/.test(ronText)) {
    errs.push(`${assetPath}.meta: missing settings: (...) tuple`);
  }
  return errs;
}

const SKIP_DIRS = new Set([
  "node_modules",
  ".git",
  "target",
  "dist",
  "gen-cache",
  "captures",
]);

export function walkBevyAssets(assetsRoot: string): string[] {
  const out: string[] = [];
  if (!existsSync(assetsRoot)) return out;
  const walk = (d: string) => {
    for (const name of readdirSync(d)) {
      if (SKIP_DIRS.has(name)) continue;
      const full = join(d, name);
      const st = statSync(full);
      if (st.isDirectory()) walk(full);
      else if (!name.endsWith(".meta") && bevyLoaderFor(full)) out.push(full);
    }
  };
  walk(assetsRoot);
  return out.sort();
}

/** Ensures every loadable Bevy asset under `assetsRoot` has a valid adjacent `.meta` RON sidecar. */
export function syncBevyMeta(
  assetsRoot: string,
  opts: { write?: boolean; pixelArtPattern?: RegExp } = {},
): { checked: number; written: number; errors: string[] } {
  const files = walkBevyAssets(assetsRoot);
  const errors: string[] = [];
  let written = 0;
  for (const abs of files) {
    const rel = relative(assetsRoot, abs).replaceAll("\\", "/");
    const metaPath = `${abs}.meta`;
    if (!existsSync(metaPath)) {
      if (opts.write) {
        const ron = renderBevyMeta(abs, {
          pixelArt: opts.pixelArtPattern?.test(rel) ?? false,
        });
        if (ron) {
          mkdirSync(dirname(metaPath), { recursive: true });
          writeFileSync(metaPath, ron);
          written++;
          continue;
        }
      }
      errors.push(`${rel}: missing Bevy sidecar ${rel}.meta`);
      continue;
    }
    const text = readFileSync(metaPath, "utf8");
    errors.push(...checkBevyMeta(text, rel));
  }
  return { checked: files.length, written, errors };
}
