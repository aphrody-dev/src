// SPDX-License-Identifier: Apache-2.0
//! `asset-test <root> [--type audio|svg|model|font|image|hdri] [--no-bevy]`: validates every manifest entry
//! of `assets/library` with the repo's own decoders and prints one JSON line per asset and validator.

use std::path::{Path, PathBuf};
use std::time::Instant;

use serde_json::json;

struct Entry {
    id: String,
    kind: String,
    path: PathBuf,
}

fn load_manifest(root: &Path) -> Vec<Entry> {
    let lib = root.join("assets").join("library");
    let store = std::env::var_os("ASSETS_STORE").map(PathBuf::from);
    let mut files: Vec<PathBuf> = std::fs::read_dir(&lib)
        .expect("assets/library")
        .filter_map(|e| e.ok().map(|e| e.path()))
        .filter(|p| {
            p.file_name().and_then(|n| n.to_str()).is_some_and(|n| n.starts_with("manifest") && n.ends_with(".toml"))
        })
        .collect();
    files.sort();
    let mut out = Vec::new();
    for f in files {
        let doc: toml::Table = std::fs::read_to_string(&f).expect("manifest").parse().expect("manifest parse");
        for e in doc.get("asset").and_then(|a| a.as_array()).into_iter().flatten() {
            let s = |k: &str| e.get(k)?.as_str().map(str::to_owned);
            let (Some(id), Some(kind), Some(path)) = (s("id"), s("kind"), s("path")) else { continue };
            let base = if s("storage").as_deref() == Some("remote") { store.clone().unwrap_or_else(|| lib.clone()) } else { lib.clone() };
            out.push(Entry { id, kind, path: base.join(path) });
        }
    }
    out
}

fn emit(e: &Entry, validator: &str, ms: f64, bytes: u64, res: Result<String, String>) {
    let (ok, detail) = match res {
        Ok(d) => (true, d),
        Err(d) => (false, d),
    };
    println!(
        "{}",
        json!({"id": e.id, "kind": e.kind, "validator": validator, "ok": ok, "ms": (ms * 1000.0).round() / 1000.0, "bytes": bytes, "detail": detail})
    );
}

fn timed(f: impl FnOnce() -> Result<String, String>) -> (f64, Result<String, String>) {
    let t = Instant::now();
    let r = std::panic::catch_unwind(std::panic::AssertUnwindSafe(f))
        .unwrap_or_else(|_| Err("panic".into()));
    (t.elapsed().as_secs_f64() * 1000.0, r)
}

fn audio(path: &Path) -> Result<String, String> {
    use tv_ffmpeg::ff;
    let src = path.to_string_lossy();
    let info = tv_ffmpeg::probe(&src).map_err(|e| e.to_string())?;
    let mut ictx = ff::format::input(path).map_err(|e| e.to_string())?;
    let (idx, params) = {
        let st = ictx.streams().best(ff::media::Type::Audio).ok_or("no audio stream")?;
        (st.index(), st.parameters())
    };
    let mut dec = ff::codec::context::Context::from_parameters(params)
        .map_err(|e| e.to_string())?
        .decoder()
        .audio()
        .map_err(|e| e.to_string())?;
    let mut frame = ff::frame::Audio::empty();
    let mut samples = 0usize;
    for (s, pkt) in ictx.packets() {
        if s.index() != idx {
            continue;
        }
        dec.send_packet(&pkt).map_err(|e| e.to_string())?;
        while dec.receive_frame(&mut frame).is_ok() {
            samples += frame.samples();
        }
    }
    dec.send_eof().map_err(|e| e.to_string())?;
    while dec.receive_frame(&mut frame).is_ok() {
        samples += frame.samples();
    }
    if samples == 0 {
        return Err("decoded 0 samples".into());
    }
    let a = info.streams.iter().find(|s| s.sample_rate.is_some());
    Ok(format!(
        "{} {} samples, {} Hz, {} ch, libavcodec {}",
        info.format,
        samples,
        a.and_then(|s| s.sample_rate).unwrap_or(0),
        a.and_then(|s| s.channels).unwrap_or(0),
        tv_ffmpeg::libavcodec_version()
    ))
}

fn svg(bytes: &[u8]) -> Result<String, String> {
    let tree = resvg::usvg::Tree::from_data(bytes, &resvg::usvg::Options::default()).map_err(|e| e.to_string())?;
    let size = tree.size();
    let (w, h) = ((size.width().ceil() as u32).clamp(1, 4096), (size.height().ceil() as u32).clamp(1, 4096));
    let mut pm = resvg::tiny_skia::Pixmap::new(w, h).ok_or("pixmap alloc")?;
    resvg::render(&tree, resvg::tiny_skia::Transform::identity(), &mut pm.as_mut());
    let lit = pm.data().chunks_exact(4).filter(|p| p[3] != 0).count();
    if lit == 0 {
        return Err("rendered fully transparent".into());
    }
    Ok(format!("resvg {w}x{h}, {lit} painted px"))
}

fn craft(bytes: &[u8]) -> Result<String, String> {
    if craft_svg::sniff::is_svg(bytes) || craft_svg::sniff::is_svgz(bytes) {
        return Ok("craft-svg: svg signature".into());
    }
    if craft_webp::is_webp(bytes) {
        let i = craft_webp::scan(bytes, 4096).ok_or("webp: no canvas")?;
        return Ok(format!("craft-webp {}x{} {} frames", i.width, i.height, i.frames.len().max(1)));
    }
    if bytes.starts_with(&[0x76, 0x2f, 0x31, 0x01]) {
        let p = craft_exr::decode::parts(bytes, &craft_exr::decode::Limits::default()).map_err(|e| e.to_string())?;
        return Ok(format!("craft-exr {} parts", p.len()));
    }
    Err("unknown format".into())
}

fn glb(path: &Path) -> Result<String, String> {
    let (doc, buffers, images) = gltf::import(path).map_err(|e| e.to_string())?;
    let prims: usize = doc.meshes().map(|m| m.primitives().count()).sum();
    for m in doc.meshes() {
        for p in m.primitives() {
            let r = p.reader(|b| Some(&buffers[b.index()]));
            let n = r.read_positions().ok_or("primitive without POSITION")?.count();
            if n == 0 {
                return Err("empty primitive".into());
            }
        }
    }
    Ok(format!(
        "gltf crate: {} meshes, {} primitives, {} materials, {} images decoded, {} nodes",
        doc.meshes().count(),
        prims,
        doc.materials().count(),
        images.len(),
        doc.nodes().count()
    ))
}

fn font(bytes: &[u8]) -> Result<String, String> {
    let f = ttf_parser::Face::parse(bytes, 0).map_err(|e| e.to_string())?;
    if f.number_of_glyphs() == 0 {
        return Err("no glyphs".into());
    }
    Ok(format!("{} glyphs, {} units/em", f.number_of_glyphs(), f.units_per_em()))
}

#[cfg(feature = "bevy-load")]
mod bevy_load {
    use bevy::asset::{AssetPlugin, AssetMetaCheck, LoadState};
    use bevy::gltf::Gltf;
    use bevy::prelude::*;
    use bevy::render::{RenderPlugin, settings::{RenderCreation, WgpuSettings}};
    use std::path::Path;

    /// One headless app (no GPU, no window) that loads each GLB through `bevy_gltf` and waits for the result.
    pub fn app(lib: &Path) -> App {
        let mut app = App::new();
        app.add_plugins(
            DefaultPlugins
                .set(AssetPlugin {
                    file_path: lib.to_string_lossy().into_owned(),
                    meta_check: AssetMetaCheck::Never,
                    ..default()
                })
                .set(RenderPlugin {
                    render_creation: RenderCreation::Automatic(Box::new(WgpuSettings { backends: None, ..default() })),
                    ..default()
                }),
        );
        app.finish();
        app.cleanup();
        app
    }

    pub fn load(app: &mut App, rel: &str) -> Result<String, String> {
        let h: Handle<Gltf> = app.world().resource::<AssetServer>().load(rel.to_owned());
        for _ in 0..20_000 {
            app.update();
            let st = app.world().resource::<AssetServer>().get_load_state(&h);
            match st {
                Some(LoadState::Loaded) => {
                    let g = app.world().resource::<Assets<Gltf>>().get(&h).ok_or("loaded but absent")?;
                    return Ok(format!("bevy_gltf: {} meshes, {} materials, {} scenes", g.meshes.len(), g.materials.len(), g.scenes.len()));
                }
                Some(LoadState::Failed(e)) => return Err(e.to_string()),
                _ => std::thread::sleep(std::time::Duration::from_millis(1)),
            }
        }
        Err("timeout".into())
    }
}

fn main() {
    let args: Vec<String> = std::env::args().skip(1).collect();
    let root = PathBuf::from(args.first().cloned().unwrap_or_else(|| ".".into()));
    let only = args.iter().position(|a| a == "--type").and_then(|i| args.get(i + 1)).cloned();
    let no_bevy = args.iter().any(|a| a == "--no-bevy");
    let entries = load_manifest(&root);
    let lib = root.join("assets").join("library");
    #[cfg(feature = "bevy-load")]
    let mut bevy_app = None;

    for e in &entries {
        let ext = e.path.extension().and_then(|x| x.to_str()).unwrap_or("").to_ascii_lowercase();
        let class = match (e.kind.as_str(), ext.as_str()) {
            (_, "ogg" | "wav" | "mp3" | "flac" | "mp4" | "webm" | "mkv") => "audio",
            (_, "svg") => "svg",
            (_, "glb" | "gltf") => "model",
            (_, "ttf" | "otf") => "font",
            (_, "webp" | "exr" | "psd" | "tif" | "tiff" | "heif" | "heic") => "craft",
            _ => continue,
        };
        if only.as_deref().is_some_and(|o| o != class && !(o == "image" && class == "craft")) {
            continue;
        }
        let Ok(bytes) = std::fs::read(&e.path) else {
            // Remote entries not fetched are reported by the TS runner as skipped.
            continue;
        };
        let n = bytes.len() as u64;
        match class {
            "audio" => {
                let (ms, r) = timed(|| audio(&e.path));
                emit(e, "tv-ffmpeg", ms, n, r);
            }
            "svg" => {
                let (ms, r) = timed(|| svg(&bytes));
                emit(e, "resvg", ms, n, r);
                let (ms, r) = timed(|| craft(&bytes));
                emit(e, "craft-formats", ms, n, r);
            }
            "craft" => {
                let (ms, r) = timed(|| craft(&bytes));
                emit(e, "craft-formats", ms, n, r);
            }
            "font" => {
                let (ms, r) = timed(|| font(&bytes));
                emit(e, "ttf-parser", ms, n, r);
            }
            "model" => {
                let (ms, r) = timed(|| glb(&e.path));
                emit(e, "gltf-crate", ms, n, r);
                #[cfg(feature = "bevy-load")]
                if let (false, Ok(rel)) = (no_bevy, e.path.strip_prefix(&lib)) {
                    let rel = rel.to_string_lossy().replace('\\', "/");
                    let app = bevy_app.get_or_insert_with(|| bevy_load::app(&lib));
                    let (ms, r) = timed(|| bevy_load::load(app, &rel));
                    emit(e, "bevy-headless", ms, n, r);
                }
                #[cfg(not(feature = "bevy-load"))]
                let _ = (&no_bevy, &lib);
            }
            _ => {}
        }
    }
}
