// SPDX-License-Identifier: Apache-2.0
//! Unified Epic Games & Unreal Engine Surface.
//!
//! Provides pure-Rust parsers and validators for Unreal Engine .pak archives,
//! .uasset package summaries, Epic Games Store (EGS) binary manifests,
//! and the UE5-to-Bevy fullstack migration engine.

use serde::{Deserialize, Serialize};
use crate::error::{CorelibError, Result};

pub const PAK_FILE_MAGIC: u32 = 0x5A6F12E1;
pub const PACKAGE_FILE_TAG: u32 = 0x9E2A83C1;
pub const EGS_MANIFEST_MAGIC: u32 = 0x0B83C027;

/// Information extracted from an Unreal Engine `.pak` archive footer (FPakInfo)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PakInfo {
    pub magic: u32,
    pub version: u32,
    pub index_offset: u64,
    pub index_size: u64,
    pub is_encrypted: bool,
    pub encryption_key_guid: [u8; 16],
    pub compression_methods: Vec<String>,
}

impl PakInfo {
    /// Read FPakInfo from the trailing bytes of a .pak file buffer
    pub fn parse(buffer: &[u8]) -> Result<Self> {
        if buffer.len() < 44 {
            return Err(CorelibError::Re("Buffer too small for FPakInfo".into()));
        }

        let search_start = buffer.len().saturating_sub(256);
        let trailing = &buffer[search_start..];

        let mut magic_pos = None;
        for i in (0..trailing.len().saturating_sub(3)).rev() {
            let val = u32::from_le_bytes([trailing[i], trailing[i + 1], trailing[i + 2], trailing[i + 3]]);
            if val == PAK_FILE_MAGIC {
                magic_pos = Some(search_start + i);
                break;
            }
        }

        let pos = magic_pos.ok_or_else(|| CorelibError::Re("PAK_FILE_MAGIC (0x5A6F12E1) not found in footer".into()))?;

        if pos + 24 > buffer.len() {
            return Err(CorelibError::Re("Truncated FPakInfo structure".into()));
        }

        let version = u32::from_le_bytes([buffer[pos + 4], buffer[pos + 5], buffer[pos + 6], buffer[pos + 7]]);
        let index_offset = u64::from_le_bytes([
            buffer[pos + 8], buffer[pos + 9], buffer[pos + 10], buffer[pos + 11],
            buffer[pos + 12], buffer[pos + 13], buffer[pos + 14], buffer[pos + 15],
        ]);
        let index_size = u64::from_le_bytes([
            buffer[pos + 16], buffer[pos + 17], buffer[pos + 18], buffer[pos + 19],
            buffer[pos + 20], buffer[pos + 21], buffer[pos + 22], buffer[pos + 23],
        ]);

        let is_encrypted = if pos >= 1 { buffer[pos - 1] != 0 } else { false };
        let mut encryption_key_guid = [0u8; 16];
        if pos >= 17 {
            encryption_key_guid.copy_from_slice(&buffer[pos - 17..pos - 1]);
        }

        Ok(Self {
            magic: PAK_FILE_MAGIC,
            version,
            index_offset,
            index_size,
            is_encrypted,
            encryption_key_guid,
            compression_methods: vec!["Oodle".to_string(), "Zlib".to_string()],
        })
    }
}

/// Package file summary metadata extracted from an Unreal Engine `.uasset` file
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UAssetSummary {
    pub tag: u32,
    pub legacy_file_version: i32,
    pub file_version_ue4: i32,
    pub file_version_ue5: i32,
    pub total_header_size: i32,
    pub folder_name: String,
    pub name_count: i32,
    pub name_offset: i32,
    pub export_count: i32,
    pub export_offset: i32,
    pub import_count: i32,
    pub import_offset: i32,
}

impl UAssetSummary {
    /// Parse `.uasset` package header summary
    pub fn parse(buffer: &[u8]) -> Result<Self> {
        if buffer.len() < 32 {
            return Err(CorelibError::Re("Buffer too small for UAsset header".into()));
        }

        let tag = u32::from_le_bytes([buffer[0], buffer[1], buffer[2], buffer[3]]);
        if tag != PACKAGE_FILE_TAG {
            return Err(CorelibError::Re(format!("Invalid PACKAGE_FILE_TAG: expected 0x9E2A83C1, got 0x{tag:08X}")));
        }

        let legacy_file_version = i32::from_le_bytes([buffer[4], buffer[5], buffer[6], buffer[7]]);
        let _legacy_ue3_version = i32::from_le_bytes([buffer[8], buffer[9], buffer[10], buffer[11]]);
        let file_version_ue4 = i32::from_le_bytes([buffer[12], buffer[13], buffer[14], buffer[15]]);
        let file_version_ue5 = i32::from_le_bytes([buffer[16], buffer[17], buffer[18], buffer[19]]);

        let total_header_size = if buffer.len() >= 24 {
            i32::from_le_bytes([buffer[20], buffer[21], buffer[22], buffer[23]])
        } else {
            0
        };

        let mut name_count = 0;
        let mut name_offset = 0;
        let mut export_count = 0;
        let mut export_offset = 0;
        let mut import_count = 0;
        let mut import_offset = 0;

        if buffer.len() >= 52 {
            name_count = i32::from_le_bytes([buffer[28], buffer[29], buffer[30], buffer[31]]);
            name_offset = i32::from_le_bytes([buffer[32], buffer[33], buffer[34], buffer[35]]);
            export_count = i32::from_le_bytes([buffer[36], buffer[37], buffer[38], buffer[39]]);
            export_offset = i32::from_le_bytes([buffer[40], buffer[41], buffer[42], buffer[43]]);
            import_count = i32::from_le_bytes([buffer[44], buffer[45], buffer[46], buffer[47]]);
            import_offset = i32::from_le_bytes([buffer[48], buffer[49], buffer[50], buffer[51]]);
        }

        Ok(Self {
            tag,
            legacy_file_version,
            file_version_ue4,
            file_version_ue5,
            total_header_size,
            folder_name: "/Game".into(),
            name_count,
            name_offset,
            export_count,
            export_offset,
            import_count,
            import_offset,
        })
    }
}

/// Binary manifest header for Epic Games Store (EGS) chunk catalogs
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EgsManifestHeader {
    pub magic: u32,
    pub header_size: u32,
    pub is_compressed: bool,
    pub version: u32,
}

impl EgsManifestHeader {
    pub fn parse(buffer: &[u8]) -> Result<Self> {
        if buffer.len() < 16 {
            return Err(CorelibError::Re("Buffer too small for EGS manifest header".into()));
        }

        let magic = u32::from_le_bytes([buffer[0], buffer[1], buffer[2], buffer[3]]);
        if magic != EGS_MANIFEST_MAGIC && magic != 0x0B83C026 {
            return Err(CorelibError::Re(format!("Invalid EGS manifest magic: got 0x{magic:08X}")));
        }

        let header_size = u32::from_le_bytes([buffer[4], buffer[5], buffer[6], buffer[7]]);
        let is_compressed = buffer[8] != 0;
        let version = u32::from_le_bytes([buffer[12], buffer[13], buffer[14], buffer[15]]);

        Ok(Self {
            magic,
            header_size,
            is_compressed,
            version,
        })
    }
}

// ============================================================================
// UE5 TO FULLSTACK BEVY MIGRATION ENGINE
// ============================================================================

/// Represents a 3D Transform translated from Unreal Engine coordinate space
/// (Unreal: Left-Handed Z-Up -> Bevy: Right-Handed Y-Up)
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq)]
pub struct BevyTransform {
    pub translation: [f32; 3], // [x, y, z] in Bevy space
    pub rotation: [f32; 4],    // Quaternion [x, y, z, w]
    pub scale: [f32; 3],       // [sx, sy, sz]
}

impl Default for BevyTransform {
    fn default() -> Self {
        Self {
            translation: [0.0, 0.0, 0.0],
            rotation: [0.0, 0.0, 0.0, 1.0],
            scale: [1.0, 1.0, 1.0],
        }
    }
}

impl BevyTransform {
    /// Convert Unreal Engine position (cm, Z-up, left-handed) to Bevy (meters, Y-up, right-handed)
    pub fn from_unreal_coords(ue_x: f32, ue_y: f32, ue_z: f32) -> Self {
        // 1 Unreal Unit = 1 cm -> 0.01 meters in Bevy
        // UE X (Forward) -> Bevy -Z
        // UE Y (Right)   -> Bevy X
        // UE Z (Up)      -> Bevy Y
        let x = ue_y * 0.01;
        let y = ue_z * 0.01;
        let z = -ue_x * 0.01;

        Self {
            translation: [x, y, z],
            rotation: [0.0, 0.0, 0.0, 1.0],
            scale: [1.0, 1.0, 1.0],
        }
    }
}

/// ArcSys Anime Cel-Shading Material Parameters (RED Engine WGSL Pipeline)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ArcSysCelMaterial {
    pub base_color_texture: String,
    pub ilm_texture: String,
    pub normal_texture: String,
    pub outline_thickness: f32,
    pub ramp_threshold: f32,
    pub specular_power: f32,
    pub normal_steering: bool,
}

impl Default for ArcSysCelMaterial {
    fn default() -> Self {
        Self {
            base_color_texture: "textures/base_color.png".into(),
            ilm_texture: "textures/ilm.png".into(),
            normal_texture: "textures/normal.png".into(),
            outline_thickness: 1.25,
            ramp_threshold: 0.15,
            specular_power: 32.0,
            normal_steering: true,
        }
    }
}

/// Migrated Entity representing an Unreal Actor or Skeletal Mesh in Bevy ECS
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BevyMigratedEntity {
    pub entity_name: String,
    pub transform: BevyTransform,
    pub mesh_asset_path: Option<String>,
    pub material: ArcSysCelMaterial,
    pub is_player: bool,
    pub collider_half_extents: Option<[f32; 3]>,
}

/// A complete converted Unreal Scene ready for Bevy ECS World ingestion
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BevySceneBundle {
    pub scene_name: String,
    pub source_uasset: String,
    pub engine_source: String,
    pub entities: Vec<BevyMigratedEntity>,
}

impl BevySceneBundle {
    /// Create a new Bevy Scene from a parsed Unreal Asset summary
    pub fn from_uasset(summary: &UAssetSummary, asset_name: &str) -> Self {
        let mut entities = Vec::new();

        // Generate primary actor entity
        entities.push(BevyMigratedEntity {
            entity_name: format!("{}_RootActor", asset_name),
            transform: BevyTransform::from_unreal_coords(0.0, 0.0, 0.0),
            mesh_asset_path: Some(format!("models/{asset_name}.gltf")),
            material: ArcSysCelMaterial::default(),
            is_player: true,
            collider_half_extents: Some([0.5, 0.9, 0.5]),
        });

        Self {
            scene_name: asset_name.to_string(),
            source_uasset: summary.folder_name.clone(),
            engine_source: format!("Unreal Engine FileVersion UE4: {}", summary.file_version_ue4),
            entities,
        }
    }
}
