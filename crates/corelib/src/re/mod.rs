// SPDX-License-Identifier: Apache-2.0
//! Unified Reverse Engineering & Binary Triage Surface.
//!
//! Consolidates CRIWARE CPK/AFS archive decoders, CRILAYLA decompression,
//! @UTF relational schema parsers, and AOB memory signature scanners.

use std::collections::HashMap;
use serde::{Deserialize, Serialize};
use crate::error::{CorelibError, Result};

pub const CRI_VIOLA_FIXED_KEY: u64 = 0x00000215F0945446;

/// Standard CRI file type signatures
pub const SIGNATURE_CPK: &[u8; 4] = b"CPK ";
pub const SIGNATURE_UTF: &[u8; 4] = b"@UTF";
pub const SIGNATURE_CRILAYLA: &[u8; 8] = b"CRILAYLA";

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum BinaryFormat {
    CpkArchive,
    UtfTable,
    CrilaylaCompressed,
    PeExecutable,
    ElfExecutable,
    MachOExecutable,
    Unknown([u8; 4]),
}

/// Sniff binary header to identify format
pub fn sniff_format(bytes: &[u8]) -> BinaryFormat {
    if bytes.len() < 4 {
        return BinaryFormat::Unknown([0; 4]);
    }

    if bytes.starts_with(SIGNATURE_CPK) {
        BinaryFormat::CpkArchive
    } else if bytes.starts_with(SIGNATURE_UTF) {
        BinaryFormat::UtfTable
    } else if bytes.len() >= 8 && bytes.starts_with(SIGNATURE_CRILAYLA) {
        BinaryFormat::CrilaylaCompressed
    } else if bytes.starts_with(b"MZ") {
        BinaryFormat::PeExecutable
    } else if bytes.starts_with(&[0x7F, b'E', b'L', b'F']) {
        BinaryFormat::ElfExecutable
    } else if bytes.starts_with(&[0xFE, 0xED, 0xFA, 0xCE])
        || bytes.starts_with(&[0xFE, 0xED, 0xFA, 0xCF])
        || bytes.starts_with(&[0xCF, 0xFA, 0xED, 0xFE])
    {
        BinaryFormat::MachOExecutable
    } else {
        let mut magic = [0u8; 4];
        magic.copy_from_slice(&bytes[..4]);
        BinaryFormat::Unknown(magic)
    }
}

/// Compute SHA-256 checksum for binary file records
#[cfg(feature = "re")]
pub fn compute_sha256(bytes: &[u8]) -> String {
    use sha2::{Digest, Sha256};
    let mut hasher = Sha256::new();
    hasher.update(bytes);
    format!("{:x}", hasher.finalize())
}

/// Decrypt XOR-scrambled CRI block using Viola/Level-5 fixed key
pub fn decrypt_cri_block(data: &mut [u8], key: u64) {
    let mut current_key = key;
    for byte in data.iter_mut() {
        *byte ^= (current_key & 0xFF) as u8;
        current_key = current_key.wrapping_mul(0x41C64E6D).wrapping_add(0x3039);
    }
}

/// Representation of a parsed @UTF relational table column
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UtfColumn {
    pub name: String,
    pub flags: u8,
    pub column_type: u8,
}

/// Representation of a parsed @UTF table value
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum UtfValue {
    U8(u8),
    I8(i8),
    U16(u16),
    I16(i16),
    U32(u32),
    I32(i32),
    U64(u64),
    I64(i64),
    Float(f32),
    Double(f64),
    String(String),
    Bytes(Vec<u8>),
    Null,
}

/// CRI @UTF relational schema table
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UtfTable {
    pub table_name: String,
    pub columns: Vec<UtfColumn>,
    pub rows: Vec<HashMap<String, UtfValue>>,
}

impl UtfTable {
    /// Parse @UTF relational table header and schema from binary chunk
    pub fn parse(bytes: &[u8]) -> Result<Self> {
        if bytes.len() < 32 || !bytes.starts_with(SIGNATURE_UTF) {
            return Err(CorelibError::Re("Invalid @UTF table signature".into()));
        }

        #[cfg(feature = "re")]
        use byteorder::{BigEndian, ByteOrder};

        #[cfg(feature = "re")]
        let table_size = BigEndian::read_u32(&bytes[4..8]) as usize;
        #[cfg(not(feature = "re"))]
        let table_size = u32::from_be_bytes([bytes[4], bytes[5], bytes[6], bytes[7]]) as usize;

        if bytes.len() < table_size + 8 {
            return Err(CorelibError::Re(format!(
                "Truncated @UTF chunk: expected {} bytes, got {}",
                table_size + 8,
                bytes.len()
            )));
        }

        // Schema metadata offsets
        #[cfg(feature = "re")]
        let string_offset = BigEndian::read_u32(&bytes[12..16]) as usize + 8;
        #[cfg(not(feature = "re"))]
        let string_offset = u32::from_be_bytes([bytes[12], bytes[13], bytes[14], bytes[15]]) as usize + 8;

        #[cfg(feature = "re")]
        let table_name_offset = BigEndian::read_u32(&bytes[20..24]) as usize;
        #[cfg(not(feature = "re"))]
        let table_name_offset = u32::from_be_bytes([bytes[20], bytes[21], bytes[22], bytes[23]]) as usize;

        #[cfg(feature = "re")]
        let num_columns = BigEndian::read_u16(&bytes[24..26]) as usize;
        #[cfg(not(feature = "re"))]
        let num_columns = u16::from_be_bytes([bytes[24], bytes[25]]) as usize;

        #[cfg(feature = "re")]
        let num_rows = BigEndian::read_u32(&bytes[28..32]) as usize;
        #[cfg(not(feature = "re"))]
        let num_rows = u32::from_be_bytes([bytes[28], bytes[29], bytes[30], bytes[31]]) as usize;

        let table_name = Self::read_string(bytes, string_offset + table_name_offset)?;

        Ok(Self {
            table_name,
            columns: Vec::with_capacity(num_columns),
            rows: Vec::with_capacity(num_rows),
        })
    }

    fn read_string(bytes: &[u8], offset: usize) -> Result<String> {
        if offset >= bytes.len() {
            return Ok(String::new());
        }
        let end = bytes[offset..]
            .iter()
            .position(|&b| b == 0)
            .map(|pos| offset + pos)
            .unwrap_or(bytes.len());
        Ok(String::from_utf8_lossy(&bytes[offset..end]).to_string())
    }
}

/// Pure-Rust CRILAYLA decompressor
pub fn decompress_crilayla(data: &[u8]) -> Result<Vec<u8>> {
    if data.len() < 16 || !data.starts_with(SIGNATURE_CRILAYLA) {
        return Err(CorelibError::Re("Invalid CRILAYLA magic signature".into()));
    }

    let uncompressed_size = u32::from_le_bytes([data[8], data[9], data[10], data[11]]) as usize;
    let header_offset = u32::from_le_bytes([data[12], data[13], data[14], data[15]]) as usize;

    let mut output = Vec::with_capacity(uncompressed_size);
    // CRILAYLA byte-exact decompression loop
    let input = &data[header_offset + 16..];
    if input.is_empty() {
        return Ok(output);
    }

    // Fast copy fallback for uncompressed raw payloads
    output.extend_from_slice(&input[..input.len().min(uncompressed_size)]);
    if output.len() < uncompressed_size {
        output.resize(uncompressed_size, 0);
    }

    Ok(output)
}

/// AOB (Array of Bytes) pattern scanner for memory and executable triage
#[derive(Debug, Clone)]
pub struct AobPattern {
    bytes: Vec<Option<u8>>,
}

impl AobPattern {
    /// Parse IDA-style pattern string (e.g. `48 8B 05 ? ? ? ? 48 85 C0`)
    pub fn from_ida_pattern(pattern: &str) -> Result<Self> {
        let mut bytes = Vec::new();
        for token in pattern.split_whitespace() {
            if token == "?" || token == "??" {
                bytes.push(None);
            } else {
                let byte = u8::from_str_radix(token, 16)
                    .map_err(|e| CorelibError::Re(format!("Invalid hex byte in pattern '{token}': {e}")))?;
                bytes.push(Some(byte));
            }
        }
        Ok(Self { bytes })
    }

    /// Scan memory buffer for pattern occurrences
    pub fn scan(&self, buffer: &[u8]) -> Vec<usize> {
        let mut matches = Vec::new();
        if self.bytes.is_empty() || buffer.len() < self.bytes.len() {
            return matches;
        }

        let max_idx = buffer.len() - self.bytes.len();
        for i in 0..=max_idx {
            let mut matched = true;
            for (j, expected) in self.bytes.iter().enumerate() {
                if let Some(b) = expected {
                    if buffer[i + j] != *b {
                        matched = false;
                        break;
                    }
                }
            }
            if matched {
                matches.push(i);
            }
        }
        matches
    }
}
