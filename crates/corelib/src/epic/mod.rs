// SPDX-License-Identifier: Apache-2.0
//! Unified Epic Games & Unreal Engine Surface.
//!
//! Provides pure-Rust parsers and validators for Unreal Engine .pak archives,
//! .uasset package summaries, and Epic Games Store (EGS) binary manifests.

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

        // In Unreal Engine PAKs, the magic 0x5A6F12E1 is located near the end of the footer.
        // We search backwards from the end within the trailing 256 bytes.
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

        // Format v8/v9/v11 relative structure around magic:
        // Prior to magic: EncryptionKeyGuid (16 bytes), is_encrypted (1 byte)
        // At magic: magic (4 bytes), version (4 bytes), index_offset (8 bytes), index_size (8 bytes)
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

        // Name, export, and import counts
        let mut name_count = 0;
        let mut name_offset = 0;
        let mut export_count = 0;
        let mut export_offset = 0;
        let mut import_count = 0;
        let mut import_offset = 0;

        if buffer.len() >= 64 {
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
    /// Parse EGS `.manifest` header
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
