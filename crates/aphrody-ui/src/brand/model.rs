// SPDX-License-Identifier: Apache-2.0
//! `gen/model/<id>.glb`: the brand tile of `aphrody-brand-gpu` as a self-contained glTF 2.0 binary.
//!
//! - Geometry: EXT_meshopt_compression (vertex codec v0, index codec v1, the versions the glTF
//!   extension specifies), with the uncompressed size declared by a fallback buffer.
//! - Material: PBR metallic-roughness, glossy clear-coated plastic (KHR_materials_clearcoat); the
//!   base color is the full-bleed tile drawing in KTX2 (UASTC, zstd, mipmaps) under
//!   KHR_texture_basisu, encoded by KTX-Software `ktx create`.
//! Light it with `gen/env/*.ktx2` (CC0 studio HDRI).

use super::{Ctx, Error, Manifest, Result, full_bleed};
use aphrody_brand_gpu::{INDEX_COUNT, STRIDE, VERTEX_COUNT, bounds, tile};
use std::{ffi::OsStr, fs, path::Path, process::Command};

fn pad4(v: &mut Vec<u8>, byte: u8) {
    while v.len() % 4 != 0 {
        v.push(byte);
    }
}

fn meshopt_err(e: impl std::fmt::Debug) -> Error {
    Error::Render(format!("meshopt: {e:?}"))
}

/// GLB of the tile with `ktx2` as base color texture.
pub fn glb(name: &str, ktx2: &[u8]) -> Result<Vec<u8>> {
    let mesh = tile();
    let v = |i: usize, k: usize| mesh.vertices[i * STRIDE + k];
    let positions: Vec<[f32; 3]> = (0..VERTEX_COUNT).map(|i| [v(i, 0), v(i, 1), v(i, 2)]).collect();
    let normals: Vec<[f32; 3]> = (0..VERTEX_COUNT).map(|i| [v(i, 3), v(i, 4), v(i, 5)]).collect();
    let uvs: Vec<[f32; 2]> = (0..VERTEX_COUNT).map(|i| [v(i, 6), v(i, 7)]).collect();
    let indices: Vec<u32> = mesh.indices.iter().map(|&i| u32::from(i)).collect();

    let streams = [
        (meshopt::encode_vertex_buffer_level(&positions, 2, Some(0)).map_err(meshopt_err)?, 12usize, VERTEX_COUNT, "ATTRIBUTES"),
        (meshopt::encode_vertex_buffer_level(&normals, 2, Some(0)).map_err(meshopt_err)?, 12, VERTEX_COUNT, "ATTRIBUTES"),
        (meshopt::encode_vertex_buffer_level(&uvs, 2, Some(0)).map_err(meshopt_err)?, 8, VERTEX_COUNT, "ATTRIBUTES"),
        (meshopt::encode_index_buffer(&indices, VERTEX_COUNT).map_err(meshopt_err)?, 2, INDEX_COUNT, "TRIANGLES"),
    ];
    let mut bin = Vec::new();
    let mut views = Vec::new();
    let mut fallback = 0usize;
    for (i, (enc, stride, count, mode)) in streams.iter().enumerate() {
        let offset = bin.len();
        bin.extend_from_slice(enc);
        pad4(&mut bin, 0);
        let len = stride * count;
        let mut view = serde_json::json!({
            "buffer": 1,
            "byteOffset": fallback,
            "byteLength": len,
            "target": if i == 3 { 34963 } else { 34962 },
            "extensions": { "EXT_meshopt_compression": {
                "buffer": 0, "byteOffset": offset, "byteLength": enc.len(),
                "byteStride": stride, "count": count, "mode": mode,
            } },
        });
        if i < 3 {
            view["byteStride"] = (*stride).into();
        }
        views.push(view);
        fallback += len.next_multiple_of(4);
    }
    let image_offset = bin.len();
    bin.extend_from_slice(ktx2);
    pad4(&mut bin, 0);
    views.push(serde_json::json!({ "buffer": 0, "byteOffset": image_offset, "byteLength": ktx2.len() }));

    let (lo, hi) = bounds();
    let gltf = serde_json::json!({
        "asset": { "version": "2.0", "generator": "ay brand build (crates/aphrody-ui brand::model)", "copyright": "Aphrody brand artwork, MIT OR Apache-2.0" },
        "extensionsUsed": ["EXT_meshopt_compression", "KHR_materials_clearcoat", "KHR_texture_basisu"],
        "extensionsRequired": ["EXT_meshopt_compression", "KHR_texture_basisu"],
        "scene": 0,
        "scenes": [{ "nodes": [0] }],
        "nodes": [{ "mesh": 0, "name": name }],
        "meshes": [{ "name": name, "primitives": [{ "attributes": { "POSITION": 0, "NORMAL": 1, "TEXCOORD_0": 2 }, "indices": 3, "material": 0 }] }],
        "materials": [{
            "name": format!("{name}-tile"),
            "pbrMetallicRoughness": { "baseColorTexture": { "index": 0 }, "metallicFactor": 0.0, "roughnessFactor": 0.42 },
            "extensions": { "KHR_materials_clearcoat": { "clearcoatFactor": 0.65, "clearcoatRoughnessFactor": 0.06 } },
        }],
        "textures": [{ "sampler": 0, "extensions": { "KHR_texture_basisu": { "source": 0 } } }],
        "samplers": [{ "magFilter": 9729, "minFilter": 9987, "wrapS": 33071, "wrapT": 33071 }],
        "images": [{ "bufferView": 4, "mimeType": "image/ktx2" }],
        "accessors": [
            { "bufferView": 0, "componentType": 5126, "count": VERTEX_COUNT, "type": "VEC3", "min": lo, "max": hi },
            { "bufferView": 1, "componentType": 5126, "count": VERTEX_COUNT, "type": "VEC3" },
            { "bufferView": 2, "componentType": 5126, "count": VERTEX_COUNT, "type": "VEC2" },
            { "bufferView": 3, "componentType": 5123, "count": INDEX_COUNT, "type": "SCALAR" },
        ],
        "bufferViews": views,
        "buffers": [
            { "byteLength": bin.len() },
            { "byteLength": fallback, "extensions": { "EXT_meshopt_compression": { "fallback": true } } },
        ],
    });
    let mut json = serde_json::to_vec(&gltf).map_err(|e| Error::Render(e.to_string()))?;
    pad4(&mut json, b' ');
    let total = 12 + 8 + json.len() + 8 + bin.len();
    let mut out = Vec::with_capacity(total);
    out.extend_from_slice(&0x4654_6C67u32.to_le_bytes());
    out.extend_from_slice(&2u32.to_le_bytes());
    out.extend_from_slice(&(total as u32).to_le_bytes());
    out.extend_from_slice(&(json.len() as u32).to_le_bytes());
    out.extend_from_slice(&0x4E4F_534Au32.to_le_bytes());
    out.extend_from_slice(&json);
    out.extend_from_slice(&(bin.len() as u32).to_le_bytes());
    out.extend_from_slice(&0x004E_4942u32.to_le_bytes());
    out.extend_from_slice(&bin);
    Ok(out)
}

pub(super) fn models(cx: &mut Ctx<'_>, m: &Manifest, tmp: &Path) -> Result<()> {
    let Some(model) = &m.model else { return Ok(()) };
    for id in &model.ids {
        let drawing = cx.drawings.get(id).cloned().ok_or_else(|| Error::Manifest(format!("model {id}: no drawing")))?;
        let png = tmp.join(format!("{id}-basecolor.png"));
        fs::write(&png, cx.svg.png(&full_bleed(&drawing), 1024, 1024)?).map_err(|e| Error::Io(png.clone(), e))?;
        let ktx2 = tmp.join(format!("{id}-basecolor.ktx2"));
        let out = Command::new("ktx")
            .args([
                OsStr::new("create"), OsStr::new("--testrun"), OsStr::new("--format"), OsStr::new("R8G8B8A8_SRGB"),
                OsStr::new("--encode"), OsStr::new("uastc"), OsStr::new("--uastc-quality"), OsStr::new("2"),
                OsStr::new("--zstd"), OsStr::new("18"), OsStr::new("--generate-mipmap"), OsStr::new("--threads"), OsStr::new("1"),
                png.as_os_str(), ktx2.as_os_str(),
            ])
            .output()
            .map_err(|e| Error::Tool(format!("ktx: {e}")))?;
        if !out.status.success() {
            return Err(Error::Tool(format!("ktx create: {}", String::from_utf8_lossy(&out.stderr).trim())));
        }
        let tex = fs::read(&ktx2).map_err(|e| Error::Io(ktx2.clone(), e))?;
        cx.put(&format!("model/{id}.glb"), glb(id, &tex)?)?;
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn glb_layout() {
        let g = glb("t", b"KTX2").unwrap();
        assert_eq!(&g[0..4], b"glTF");
        assert_eq!(u32::from_le_bytes(g[8..12].try_into().unwrap()) as usize, g.len());
        let jlen = u32::from_le_bytes(g[12..16].try_into().unwrap()) as usize;
        let json: serde_json::Value = serde_json::from_slice(&g[20..20 + jlen]).unwrap();
        assert_eq!(json["accessors"][3]["count"], INDEX_COUNT);
        assert_eq!(json["bufferViews"].as_array().unwrap().len(), 5);
        assert_eq!(&g[20 + jlen + 4..20 + jlen + 8], b"BIN\0");
        // Deterministic.
        assert_eq!(g, glb("t", b"KTX2").unwrap());
    }
}
