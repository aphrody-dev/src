//! Zero-dependency SMBIOS parser (DMTF DSP0134 3.x), in the spirit of `dmidecode`.
//!
//! Input is the raw structure table: Windows `GetSystemFirmwareTable('RSMB')` minus its 8-byte
//! `RawSMBIOSData` header, Linux `/sys/firmware/dmi/tables/DMI`. Every structure is
//! `type:u8 len:u8 handle:u16`, `len - 4` formatted bytes, then a string set of NUL-terminated
//! strings closed by an extra NUL. String fields are 1-based indexes into that set (0 = none).

use serde::Serialize;

#[derive(Debug, Clone, Copy)]
pub struct Structure<'a> {
    pub kind: u8,
    pub handle: u16,
    formatted: &'a [u8],
    strings: &'a [u8],
}

impl<'a> Structure<'a> {
    /// Byte at `offset` from the start of the structure (header included), as in the spec tables.
    pub fn u8(&self, offset: usize) -> Option<u8> {
        self.formatted.get(offset).copied()
    }
    pub fn u16(&self, offset: usize) -> Option<u16> {
        Some(u16::from_le_bytes(self.formatted.get(offset..offset + 2)?.try_into().ok()?))
    }
    pub fn u32(&self, offset: usize) -> Option<u32> {
        Some(u32::from_le_bytes(self.formatted.get(offset..offset + 4)?.try_into().ok()?))
    }
    pub fn u64(&self, offset: usize) -> Option<u64> {
        Some(u64::from_le_bytes(self.formatted.get(offset..offset + 8)?.try_into().ok()?))
    }
    pub fn bytes(&self, offset: usize, len: usize) -> Option<&'a [u8]> {
        self.formatted.get(offset..offset + len)
    }
    /// String referenced by the index byte at `offset`; empty when absent.
    pub fn string(&self, offset: usize) -> String {
        let Some(index) = self.u8(offset).filter(|i| *i != 0) else { return String::new() };
        self.strings
            .split(|b| *b == 0)
            .nth(usize::from(index) - 1)
            .map(|s| String::from_utf8_lossy(s).trim().to_string())
            .unwrap_or_default()
    }
}

/// Iterates the structures of a raw table, stopping at type 127 or at the first malformed entry.
pub fn structures(table: &[u8]) -> impl Iterator<Item = Structure<'_>> {
    let mut rest = table;
    std::iter::from_fn(move || {
        if rest.len() < 4 {
            return None;
        }
        let kind = rest[0];
        let len = usize::from(rest[1]);
        if len < 4 || rest.len() < len {
            return None;
        }
        let handle = u16::from_le_bytes([rest[2], rest[3]]);
        let formatted = &rest[..len];
        // The string set ends at the first double NUL after the formatted area.
        let tail = &rest[len..];
        let end = tail.windows(2).position(|w| w == [0, 0])? + 2;
        let s = Structure { kind, handle, formatted, strings: &tail[..end] };
        rest = &tail[end..];
        (kind != 127).then_some(s)
    })
}

#[derive(Debug, Default, Serialize)]
pub struct Smbios {
    pub version: String,
    pub bios: Bios,
    pub system: System,
    pub baseboard: Baseboard,
    pub chassis: Chassis,
    pub processors: Vec<Processor>,
    pub memory_arrays: Vec<MemoryArray>,
    pub memory_devices: Vec<MemoryDevice>,
}

#[derive(Debug, Default, Serialize)]
pub struct Bios {
    pub vendor: String,
    pub version: String,
    pub release_date: String,
    pub release: Option<String>,
    pub embedded_controller: Option<String>,
    pub uefi_supported: bool,
    pub rom_size_kib: Option<u64>,
}

#[derive(Debug, Default, Serialize)]
pub struct System {
    pub manufacturer: String,
    pub product: String,
    pub version: String,
    pub family: String,
    pub sku: String,
    pub serial: String,
    pub uuid: String,
}

#[derive(Debug, Default, Serialize)]
pub struct Baseboard {
    pub manufacturer: String,
    pub product: String,
    pub version: String,
    pub serial: String,
}

#[derive(Debug, Default, Serialize)]
pub struct Chassis {
    pub manufacturer: String,
    pub kind: String,
}

#[derive(Debug, Serialize)]
pub struct Processor {
    pub socket: String,
    pub manufacturer: String,
    pub version: String,
    pub max_speed_mhz: Option<u16>,
    pub current_speed_mhz: Option<u16>,
    pub external_clock_mhz: Option<u16>,
    pub cores: Option<u16>,
    pub cores_enabled: Option<u16>,
    pub threads: Option<u16>,
}

#[derive(Debug, Serialize)]
pub struct MemoryArray {
    pub max_capacity_bytes: Option<u64>,
    pub slots: Option<u16>,
    pub ecc: String,
}

#[derive(Debug, Serialize)]
pub struct MemoryDevice {
    pub locator: String,
    pub bank: String,
    pub size_bytes: u64,
    pub kind: String,
    pub form_factor: String,
    pub speed_mts: Option<u32>,
    pub configured_speed_mts: Option<u32>,
    pub configured_voltage_mv: Option<u16>,
    pub data_width: Option<u16>,
    pub rank: Option<u8>,
    pub manufacturer: String,
    pub part_number: String,
    pub serial: String,
}

pub fn decode(version: (u8, u8), table: &[u8]) -> Smbios {
    let mut out = Smbios { version: format!("{}.{}", version.0, version.1), ..Default::default() };
    for s in structures(table) {
        match s.kind {
            0 => out.bios = bios(&s),
            1 => out.system = system(&s),
            2 if out.baseboard.manufacturer.is_empty() => {
                out.baseboard = Baseboard { manufacturer: s.string(4), product: s.string(5), version: s.string(6), serial: s.string(7) };
            }
            3 if out.chassis.manufacturer.is_empty() => {
                out.chassis = Chassis { manufacturer: s.string(4), kind: chassis_kind(s.u8(5).unwrap_or(2) & 0x7f).to_string() };
            }
            4 => out.processors.push(processor(&s)),
            16 => out.memory_arrays.push(memory_array(&s)),
            17 => {
                if let Some(d) = memory_device(&s) {
                    out.memory_devices.push(d);
                }
            }
            _ => {}
        }
    }
    out
}

fn bios(s: &Structure) -> Bios {
    let release = match (s.u8(0x14), s.u8(0x15)) {
        (Some(a), Some(b)) if a != 0xff => Some(format!("{a}.{b}")),
        _ => None,
    };
    let embedded_controller = match (s.u8(0x16), s.u8(0x17)) {
        (Some(a), Some(b)) if a != 0xff => Some(format!("{a}.{b}")),
        _ => None,
    };
    // ROM size: 64 KiB * (n + 1); 0xFF means the extended field at 0x18 (bits 15:14 = unit).
    let rom_size_kib = match s.u8(0x09) {
        Some(0xff) => s.u16(0x18).map(|v| {
            let n = u64::from(v & 0x3fff);
            if v >> 14 == 1 { n * 1024 * 1024 } else { n * 1024 }
        }),
        Some(n) => Some(64 * (u64::from(n) + 1)),
        None => None,
    };
    Bios {
        vendor: s.string(4),
        version: s.string(5),
        release_date: s.string(8),
        release,
        embedded_controller,
        // Characteristics extension byte 2, bit 3: UEFI specification supported.
        uefi_supported: s.u8(0x13).is_some_and(|b| b & 0x08 != 0),
        rom_size_kib,
    }
}

fn system(s: &Structure) -> System {
    System {
        manufacturer: s.string(4),
        product: s.string(5),
        version: s.string(6),
        serial: s.string(7),
        uuid: s.bytes(8, 16).map(uuid).unwrap_or_default(),
        sku: s.string(0x19),
        family: s.string(0x1a),
    }
}

/// SMBIOS 2.6+ stores the first three UUID fields little-endian (DSP0134 7.2.1).
fn uuid(b: &[u8]) -> String {
    if b.iter().all(|x| *x == 0) || b.iter().all(|x| *x == 0xff) {
        return String::new();
    }
    format!(
        "{:02x}{:02x}{:02x}{:02x}-{:02x}{:02x}-{:02x}{:02x}-{:02x}{:02x}-{:02x}{:02x}{:02x}{:02x}{:02x}{:02x}",
        b[3], b[2], b[1], b[0], b[5], b[4], b[7], b[6], b[8], b[9], b[10], b[11], b[12], b[13], b[14], b[15]
    )
}

fn processor(s: &Structure) -> Processor {
    let speed = |o| s.u16(o).filter(|v| *v != 0);
    // 0xFF in the byte fields means "see the 16-bit field" (SMBIOS 3.0+).
    let count = |byte_off, word_off| match s.u8(byte_off) {
        Some(0xff) => s.u16(word_off),
        Some(0) | None => None,
        Some(n) => Some(u16::from(n)),
    };
    Processor {
        socket: s.string(4),
        manufacturer: s.string(7),
        version: s.string(0x10),
        external_clock_mhz: speed(0x12),
        max_speed_mhz: speed(0x14),
        current_speed_mhz: speed(0x16),
        cores: count(0x23, 0x2a),
        cores_enabled: count(0x24, 0x2c),
        threads: count(0x25, 0x2e),
    }
}

fn memory_array(s: &Structure) -> MemoryArray {
    let max_capacity_bytes = match s.u32(0x07) {
        Some(0x8000_0000) => s.u64(0x0f),
        Some(kib) => Some(u64::from(kib) * 1024),
        None => None,
    };
    let ecc = match s.u8(0x06) {
        Some(3) => "none",
        Some(4) => "parity",
        Some(5) => "single-bit",
        Some(6) => "multi-bit",
        Some(7) => "crc",
        _ => "unknown",
    };
    MemoryArray { max_capacity_bytes, slots: s.u16(0x0d), ecc: ecc.to_string() }
}

fn memory_device(s: &Structure) -> Option<MemoryDevice> {
    // Size: 0 = empty slot, 0xFFFF = unknown, 0x7FFF = extended size (MiB) at 0x1C,
    // bit 15 set = value in KiB, otherwise MiB.
    let size_bytes = match s.u16(0x0c)? {
        0 => return None,
        0xffff => 0,
        0x7fff => u64::from(s.u32(0x1c).unwrap_or(0) & 0x7fff_ffff) << 20,
        v if v & 0x8000 != 0 => u64::from(v & 0x7fff) << 10,
        v => u64::from(v) << 20,
    };
    let speed = |short, ext| match s.u16(short) {
        Some(0) | None => None,
        Some(0xffff) => s.u32(ext),
        Some(v) => Some(u32::from(v)),
    };
    let width = |o| s.u16(o).filter(|w| *w != 0 && *w != 0xffff);
    Some(MemoryDevice {
        locator: s.string(0x10),
        bank: s.string(0x11),
        size_bytes,
        kind: memory_kind(s.u8(0x12).unwrap_or(2)).to_string(),
        form_factor: form_factor(s.u8(0x0e).unwrap_or(2)).to_string(),
        speed_mts: speed(0x15, 0x54),
        configured_speed_mts: speed(0x20, 0x58),
        configured_voltage_mv: s.u16(0x26).filter(|v| *v != 0),
        data_width: width(0x0a),
        rank: s.u8(0x1b).map(|a| a & 0x0f).filter(|r| *r != 0),
        manufacturer: s.string(0x17),
        serial: s.string(0x18),
        part_number: s.string(0x1a),
    })
}

/// DSP0134 7.18.2 Memory Device Type.
fn memory_kind(v: u8) -> &'static str {
    match v {
        0x0f => "SDRAM",
        0x12 => "DDR",
        0x13 => "DDR2",
        0x18 => "DDR3",
        0x1a => "DDR4",
        0x1b => "LPDDR",
        0x1c => "LPDDR2",
        0x1d => "LPDDR3",
        0x1e => "LPDDR4",
        0x1f => "Logical non-volatile",
        0x20 => "HBM",
        0x21 => "HBM2",
        0x22 => "DDR5",
        0x23 => "LPDDR5",
        0x24 => "HBM3",
        0x25 => "MRDIMM",
        0x26 => "DDR6",
        0x27 => "LPDDR6",
        0x01 => "Other",
        _ => "Unknown",
    }
}

/// DSP0134 7.18.1 Memory Device Form Factor.
fn form_factor(v: u8) -> &'static str {
    match v {
        0x09 => "DIMM",
        0x0d => "SODIMM",
        0x0f => "FB-DIMM",
        0x10 => "Die",
        0x11 => "CAMM",
        0x0b => "Row of chips",
        0x0c => "RIMM",
        0x01 => "Other",
        _ => "Unknown",
    }
}

/// DSP0134 7.4.1 System Enclosure or Chassis Types.
fn chassis_kind(v: u8) -> &'static str {
    match v {
        0x03 => "Desktop",
        0x04 => "Low profile desktop",
        0x05 => "Pizza box",
        0x06 => "Mini tower",
        0x07 => "Tower",
        0x08 => "Portable",
        0x09 => "Laptop",
        0x0a => "Notebook",
        0x0b => "Hand held",
        0x0c => "Docking station",
        0x0d => "All in one",
        0x0e => "Sub notebook",
        0x11 => "Main server chassis",
        0x17 => "Rack mount chassis",
        0x18 => "Sealed-case PC",
        0x1c => "Blade",
        0x1e => "Tablet",
        0x1f => "Convertible",
        0x20 => "Detachable",
        0x21 => "IoT gateway",
        0x22 => "Embedded PC",
        0x23 => "Mini PC",
        0x24 => "Stick PC",
        0x01 => "Other",
        _ => "Unknown",
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    /// Builds one structure: header, formatted body (after the 4-byte header), strings.
    fn entry(kind: u8, body: &[u8], strings: &[&str]) -> Vec<u8> {
        let mut v = vec![kind, (body.len() + 4) as u8, 0x01, 0x00];
        v.extend_from_slice(body);
        if strings.is_empty() {
            v.extend_from_slice(&[0, 0]);
        } else {
            for s in strings {
                v.extend_from_slice(s.as_bytes());
                v.push(0);
            }
            v.push(0);
        }
        v
    }

    #[test]
    fn decodes_bios_system_and_ddr5_dimm() {
        // Type 0: vendor=1 version=2 start seg(2) date=3 rom=0x3F (4 MiB) chars(8) ext1 ext2(UEFI) rel 5.32
        let mut t0 = vec![1, 2, 0, 0xf0, 3, 0x3f];
        t0.extend_from_slice(&[0; 8]);
        t0.extend_from_slice(&[0x00, 0x08, 5, 32, 0xff, 0xff]);
        // Type 17: 0x0C size 16384 MiB, 0x0E DIMM, 0x10 loc=1 bank=2, 0x12 DDR5, 0x15 speed 5800, 0x17 mfr=3, 0x1A part=4, 0x20 conf 5600
        let mut t17 = vec![0u8; 0x28 - 4];
        let put16 = |b: &mut Vec<u8>, off: usize, v: u16| b[off - 4..off - 2].copy_from_slice(&v.to_le_bytes());
        put16(&mut t17, 0x0a, 64);
        put16(&mut t17, 0x0c, 16384);
        t17[0x0e - 4] = 0x09;
        t17[0x10 - 4] = 1;
        t17[0x11 - 4] = 2;
        t17[0x12 - 4] = 0x22;
        put16(&mut t17, 0x15, 5800);
        t17[0x17 - 4] = 3;
        t17[0x1a - 4] = 4;
        t17[0x1b - 4] = 0x01;
        put16(&mut t17, 0x20, 5600);
        let empty_slot = { let mut b = vec![0u8; 0x28 - 4]; b[0x12 - 4] = 0x02; b };

        let mut table = entry(0, &t0, &["AMI", "G35CA.329", "04/27/2026"]);
        table.extend(entry(17, &t17, &["DIMM1", "BANK 0", "Samsung", "M323R2GA3BB0-CQKOL"]));
        table.extend(entry(17, &empty_slot, &[]));
        table.extend(entry(127, &[], &[]));

        let s = decode((3, 7), &table);
        assert_eq!(s.version, "3.7");
        assert_eq!(s.bios.vendor, "AMI");
        assert_eq!(s.bios.version, "G35CA.329");
        assert_eq!(s.bios.release_date, "04/27/2026");
        assert_eq!(s.bios.release.as_deref(), Some("5.32"));
        assert!(s.bios.uefi_supported);
        assert_eq!(s.bios.rom_size_kib, Some(4096));
        assert_eq!(s.memory_devices.len(), 1, "empty slot skipped");
        let d = &s.memory_devices[0];
        assert_eq!(d.size_bytes, 16 << 30);
        assert_eq!(d.kind, "DDR5");
        assert_eq!(d.form_factor, "DIMM");
        assert_eq!(d.speed_mts, Some(5800));
        assert_eq!(d.configured_speed_mts, Some(5600));
        assert_eq!(d.manufacturer, "Samsung");
        assert_eq!(d.part_number, "M323R2GA3BB0-CQKOL");
        assert_eq!(d.rank, Some(1));
    }

    #[test]
    fn stops_on_truncated_tables() {
        assert_eq!(structures(&[0, 30, 0]).count(), 0);
        assert_eq!(structures(&[1, 4, 0, 0, b'x']).count(), 0, "no string terminator");
    }

    #[test]
    fn uuid_byte_order() {
        let b = [0x33, 0x22, 0x11, 0x00, 0x55, 0x44, 0x77, 0x66, 0x88, 0x99, 0xaa, 0xbb, 0xcc, 0xdd, 0xee, 0xff];
        assert_eq!(uuid(&b), "00112233-4455-6677-8899-aabbccddeeff");
        assert_eq!(uuid(&[0; 16]), "");
    }
}
