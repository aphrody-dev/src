use iced_x86::{Decoder, DecoderOptions, Formatter as _, Instruction, IntelFormatter};
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use thiserror::Error;

// ---------------------------------------------------------------------------
// Error type
// ---------------------------------------------------------------------------

/// All errors returned by [`triage`] and helpers.
#[derive(Debug, Error)]
pub enum ReError {
    /// `goblin` rejected the bytes — typically a truncated header or
    /// internally inconsistent offsets. The format may still be detected
    /// by magic but section/import/export tables are unreliable.
    #[error("goblin parse error: {0}")]
    Parse(String),
}

impl From<goblin::error::Error> for ReError {
    fn from(e: goblin::error::Error) -> Self {
        Self::Parse(e.to_string())
    }
}

// ---------------------------------------------------------------------------
// DTOs
// ---------------------------------------------------------------------------

/// Detected binary format. Stable JSON serialisation: lowercase variants.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum Format {
    /// 32-bit Windows Portable Executable.
    Pe32,
    /// 64-bit Windows Portable Executable.
    Pe64,
    /// 32-bit ELF (Linux / *BSD / etc.).
    Elf32,
    /// 64-bit ELF.
    Elf64,
    /// 32-bit Mach-O executable or object.
    Macho32,
    /// 64-bit Mach-O executable or object.
    Macho64,
    /// Universal Mach-O container with multiple architecture slices.
    MachoUniversal,
    /// Bytes did not match any known magic.
    Unknown,
}

impl Format {
    /// Human-readable name (`"PE32+"`, `"ELF64"`, …). Used in CLI output.
    #[must_use]
    pub fn display_name(self) -> &'static str {
        match self {
            Self::Pe32 => "PE32",
            Self::Pe64 => "PE32+",
            Self::Elf32 => "ELF32",
            Self::Elf64 => "ELF64",
            Self::Macho32 => "Mach-O 32",
            Self::Macho64 => "Mach-O 64",
            Self::MachoUniversal => "Mach-O universal",
            Self::Unknown => "Unknown",
        }
    }
}

/// One section row in the [`TriageReport`].
///
/// Entropy is the standard Shannon entropy of the section bytes, expressed
/// in bits per byte (i.e. in `[0.0, 8.0]`). High entropy (≥ 7.0) is a
/// strong indicator of compression or encryption (packed binaries, e.g.
/// UPX, almost always exceed 7.5 on their `.text` section).
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Section {
    /// Section name as embedded in the binary (e.g. `".text"`, `".rdata"`).
    pub name: String,
    /// Virtual address (PE) / virtual address (ELF) of the section.
    pub vaddr: u64,
    /// Raw size on disk in bytes.
    pub size: u64,
    /// Shannon entropy of the section bytes, in bits/byte. `None` if the
    /// section has no on-disk content (e.g. `.bss` in ELF).
    pub entropy: Option<f64>,
}

/// Final triage report. Self-describing JSON via `serde`.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TriageReport {
    /// Detected format. Always populated — `Format::Unknown` if no magic
    /// matched.
    pub format: Format,
    /// Total input size in bytes.
    pub size: usize,
    /// SHA-256 hex digest of the entire input. Always populated, even for
    /// `Format::Unknown`.
    pub sha256: String,
    /// Architecture string when available (`"x86_64"`, `"aarch64"`,
    /// `"i386"`, …). `None` for `Format::Unknown`.
    pub arch: Option<String>,
    /// Entry-point virtual address. `None` for `Format::Unknown`.
    pub entry_point: Option<u64>,
    /// Sections found in the binary (PE/ELF). Empty for `Format::Unknown`.
    pub sections: Vec<Section>,
    /// Names of imported symbols (PE/ELF). Empty for `Format::Unknown`.
    pub imports: Vec<String>,
    /// Names of exported symbols (PE/ELF). Empty for `Format::Unknown`.
    pub exports: Vec<String>,
    /// Linked libraries: PE import directory DLL names, ELF `DT_NEEDED`.
    #[serde(default)]
    pub libraries: Vec<String>,
    /// PE Windows subsystem (`"console"`, `"gui"`, `"native"`, `"efi_application"`, …).
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub subsystem: Option<String>,
    /// Sample of ASCII + UTF-16 strings discovered (capped at
    /// [`STRINGS_SAMPLE_LIMIT`] entries, each ≥ [`STRINGS_MIN_LEN`]).
    pub strings_sample: Vec<String>,
    /// Architecture slices for universal Mach-O containers and thin Mach-O images.
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub architecture_slices: Vec<ArchitectureSlice>,
}

/// One validated architecture slice in a thin or universal Mach-O image.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ArchitectureSlice {
    /// CPU architecture name (`x86_64`, `aarch64`, `i386`, or a stable numeric label).
    pub arch: String,
    /// CPU bitness when the selected slice's Mach-O header is available.
    pub bits: Option<u8>,
    /// Byte offset of this slice inside the original input.
    pub offset: u64,
    /// Byte length of this slice.
    pub size: u64,
    /// Slice entry point, when the image has one.
    pub entry_point: Option<u64>,
}

/// Minimum length (in characters) for a string to appear in the sample.
pub const STRINGS_MIN_LEN: usize = 6;

/// Maximum number of strings included in [`TriageReport::strings_sample`].
/// Keeps the JSON report bounded for downstream consumers.
pub const STRINGS_SAMPLE_LIMIT: usize = 64;

/// Default maximum number of instructions returned by [`disasm`].
/// Callers may pass a smaller `limit`; values larger than this are honoured
/// but the default CLI surface caps at this constant.
pub const DISASM_LIMIT: usize = 256;

// ---------------------------------------------------------------------------
// Disassembly types
// ---------------------------------------------------------------------------

/// One decoded x86-64 instruction as returned by [`disasm`].
///
/// All fields are serializable to JSON. The `text` field contains the full
/// Intel-syntax disassembly line produced by `iced-x86`'s `IntelFormatter`
/// (e.g. `"mov rbp,rsp"`). `mnemonic` is the bare mnemonic extracted from
/// that line (everything before the first space or tab), convenient for
/// filtering without reparsing `text`.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DisasmInsn {
    /// Byte offset of this instruction from the start of the input slice.
    pub offset: u64,
    /// Virtual address of this instruction (`rip` base + `offset`).
    pub address: u64,
    /// Lowercase hex encoding of the raw instruction bytes (e.g. `"4889e5"`).
    pub bytes_hex: String,
    /// Bare mnemonic (e.g. `"mov"`, `"call"`, `"nop"`).
    pub mnemonic: String,
    /// Full Intel-syntax disassembly line (e.g. `"mov rbp,rsp"`).
    pub text: String,
}

// ---------------------------------------------------------------------------
// Disassembly public API
// ---------------------------------------------------------------------------

/// Disassemble up to `limit` x86-64 instructions from `bytes`.
///
/// `rip` is the virtual address of the first byte (used for RIP-relative
/// operand display and as the base for the `address` field of each
/// [`DisasmInsn`]). Pass `0` if the absolute address is unknown.
///
/// Uses `iced-x86`'s `IntelFormatter` with default options (no decorators,
/// uppercase mnemonics off). Stops at `limit` instructions, at the end of
/// the slice, or at the first invalid/incomplete encoding — whichever comes
/// first. Never panics on arbitrary input.
///
/// # Examples
///
/// ```
/// use aphrody_re::disasm;
///
/// // `mov rbp, rsp` — 3-byte encoding: REX.W + 0x89 /5
/// let insns = disasm(&[0x48, 0x89, 0xE5], 0x1000, 8);
/// assert_eq!(insns.len(), 1);
/// assert_eq!(insns[0].mnemonic, "mov");
/// assert_eq!(insns[0].address, 0x1000);
/// assert_eq!(insns[0].bytes_hex, "4889e5");
/// ```
#[must_use]
pub fn disasm(bytes: &[u8], rip: u64, limit: usize) -> Vec<DisasmInsn> {
    // `limit` is always respected exactly. `DISASM_LIMIT` is the default used
    // by the CLI when no `--limit` flag is given; the library itself does not
    // enforce a hard cap above the caller's request.
    let cap = limit;
    let mut out = Vec::with_capacity(cap.min(64));

    let mut decoder = Decoder::with_ip(64, bytes, rip, DecoderOptions::NONE);
    let mut formatter = IntelFormatter::new();
    // Suppress "db" invalid-byte fallback mnemonics — stop on first invalid.
    let mut insn = Instruction::default();
    let mut text_buf = String::with_capacity(64);

    while decoder.can_decode() && out.len() < cap {
        decoder.decode_out(&mut insn);

        // iced-x86 emits `db XX` for invalid byte sequences. We stop rather
        // than emit a misleading "instruction" because the remaining bytes
        // are uninterpretable as code.
        if insn.is_invalid() {
            break;
        }

        let offset = insn.ip().wrapping_sub(rip);
        let address = insn.ip();
        let len = insn.len();
        let start = offset as usize;
        let raw = bytes.get(start..start.saturating_add(len)).unwrap_or(&[]);
        let bytes_hex = hex::encode(raw);

        text_buf.clear();
        formatter.format(&insn, &mut text_buf);

        // Extract mnemonic: everything before the first ASCII whitespace.
        let mnemonic = text_buf
            .split_once(|c: char| c.is_ascii_whitespace())
            .map_or(text_buf.as_str(), |(m, _)| m)
            .to_owned();

        out.push(DisasmInsn {
            offset,
            address,
            bytes_hex,
            mnemonic,
            text: text_buf.clone(),
        });
    }

    out
}

// ---------------------------------------------------------------------------
// Public API (triage)
// ---------------------------------------------------------------------------

/// Triage a binary blob.
///
/// Returns a fully-populated [`TriageReport`]. **Never panics** on garbage
/// input — bytes that don't match any known magic produce
/// `Format::Unknown` with `size`, `sha256`, and `strings_sample` still
/// populated (the rest empty).
///
/// # Errors
///
/// Returns [`ReError::Parse`] only when `goblin` rejects a binary that
/// looked valid by magic but had internally inconsistent offsets. Truly
/// arbitrary garbage falls into the `Format::Unknown` path with `Ok`.
pub fn triage(bytes: &[u8]) -> Result<TriageReport, ReError> {
    triage_bounded(bytes, STRINGS_SAMPLE_LIMIT)
}

/// Triage a binary blob with a configurable strings-sample limit.
///
/// `strings_limit = 0` suppresses string extraction entirely (fastest path for
/// large sidecars when string content is not required). For the default
/// behaviour use [`triage`] which passes [`STRINGS_SAMPLE_LIMIT`].
///
/// Never panics. Returns [`ReError::Parse`] only on internally inconsistent
/// binary headers.
pub fn triage_bounded(bytes: &[u8], strings_limit: usize) -> Result<TriageReport, ReError> {
    let size = bytes.len();
    let sha256 = hex::encode(Sha256::digest(bytes));
    let strings_sample = if strings_limit > 0 {
        extract_strings(bytes, STRINGS_MIN_LEN, strings_limit)
    } else {
        Vec::new()
    };

    // `goblin::Object` requires the `te` feature which is intentionally
    // off in the workspace pin (Terse Executable is niche). We dispatch by
    // hand on the magic bytes and call the format-specific parsers
    // directly — saves enabling a dead feature and gives us explicit
    // control over the fallback path.
    match detect_magic(bytes) {
        MagicHit::Pe => match goblin::pe::PE::parse(bytes) {
            Ok(pe) => Ok(triage_pe(pe, bytes, size, sha256, strings_sample)),
            Err(_) => Ok(unknown_report(size, sha256, strings_sample)),
        },
        MagicHit::Elf => match goblin::elf::Elf::parse(bytes) {
            Ok(elf) => Ok(triage_elf(&elf, bytes, size, sha256, strings_sample)),
            Err(_) => Ok(unknown_report(size, sha256, strings_sample)),
        },
        MagicHit::Macho => Ok(triage_macho(bytes, size, sha256, strings_sample)),
        MagicHit::None => Ok(unknown_report(size, sha256, strings_sample)),
    }
}

enum MagicHit {
    Pe,
    Elf,
    Macho,
    None,
}

fn detect_magic(bytes: &[u8]) -> MagicHit {
    // ELF: 0x7F 'E' 'L' 'F'
    if bytes.len() >= 4 && &bytes[..4] == b"\x7FELF" {
        return MagicHit::Elf;
    }
    // PE: 'M' 'Z' DOS stub. Strict check skips short MZ-only files which
    // goblin would reject anyway.
    if bytes.len() >= 64 && &bytes[..2] == b"MZ" {
        return MagicHit::Pe;
    }
    if matches!(
        bytes.get(..4),
        Some(
            [0xfe, 0xed, 0xfa, 0xce]
                | [0xce, 0xfa, 0xed, 0xfe]
                | [0xfe, 0xed, 0xfa, 0xcf]
                | [0xcf, 0xfa, 0xed, 0xfe]
                | [0xca, 0xfe, 0xba, 0xbe]
                | [0xbe, 0xba, 0xfe, 0xca]
        )
    ) {
        return MagicHit::Macho;
    }
    MagicHit::None
}

fn unknown_report(size: usize, sha256: String, strings_sample: Vec<String>) -> TriageReport {
    TriageReport {
        format: Format::Unknown,
        size,
        sha256,
        arch: None,
        entry_point: None,
        sections: Vec::new(),
        imports: Vec::new(),
        exports: Vec::new(),
        libraries: Vec::new(),
        subsystem: None,
        strings_sample,
        architecture_slices: Vec::new(),
    }
}

// ---------------------------------------------------------------------------
// Format-specific helpers
// ---------------------------------------------------------------------------

fn triage_pe(
    pe: goblin::pe::PE<'_>,
    bytes: &[u8],
    size: usize,
    sha256: String,
    strings_sample: Vec<String>,
) -> TriageReport {
    let format = if pe.is_64 { Format::Pe64 } else { Format::Pe32 };
    let arch = Some(pe_machine_name(pe.header.coff_header.machine));
    let entry_point = Some(pe.entry as u64);
    let libraries = pe.libraries.iter().map(|l| (*l).to_owned()).collect();
    let subsystem = pe
        .header
        .optional_header
        .map(|oh| pe_subsystem_name(oh.windows_fields.subsystem));

    let sections = pe
        .sections
        .iter()
        .map(|s| Section {
            name: s.name().unwrap_or("<bad-utf8>").to_owned(),
            vaddr: u64::from(s.virtual_address),
            size: u64::from(s.size_of_raw_data),
            entropy: section_entropy(s.data(bytes).ok().flatten().as_deref()),
        })
        .collect();

    let imports = pe.imports.iter().map(|i| i.name.to_string()).collect();
    let exports = pe
        .exports
        .iter()
        .filter_map(|e| e.name.map(|n| n.to_owned()))
        .collect();

    TriageReport {
        format,
        size,
        sha256,
        arch,
        entry_point,
        sections,
        imports,
        exports,
        libraries,
        subsystem,
        strings_sample,
        architecture_slices: Vec::new(),
    }
}

fn pe_machine_name(machine: u16) -> String {
    use goblin::pe::header;
    match machine {
        header::COFF_MACHINE_X86_64 => "x86_64".to_owned(),
        header::COFF_MACHINE_X86 => "i386".to_owned(),
        header::COFF_MACHINE_ARM64 => "aarch64".to_owned(),
        header::COFF_MACHINE_ARMNT => "arm".to_owned(),
        other => format!("IMAGE_FILE_MACHINE_{other:#06x}"),
    }
}

fn pe_subsystem_name(subsystem: u16) -> String {
    match subsystem {
        1 => "native".to_owned(),
        2 => "gui".to_owned(),
        3 => "console".to_owned(),
        5 => "os2_console".to_owned(),
        7 => "posix_console".to_owned(),
        9 => "windows_ce_gui".to_owned(),
        10 => "efi_application".to_owned(),
        11 => "efi_boot_service_driver".to_owned(),
        12 => "efi_runtime_driver".to_owned(),
        13 => "efi_rom".to_owned(),
        14 => "xbox".to_owned(),
        16 => "windows_boot_application".to_owned(),
        other => format!("unknown_{other}"),
    }
}

fn triage_elf(
    elf: &goblin::elf::Elf<'_>,
    bytes: &[u8],
    size: usize,
    sha256: String,
    strings_sample: Vec<String>,
) -> TriageReport {
    let format = if elf.is_64 {
        Format::Elf64
    } else {
        Format::Elf32
    };
    let arch = Some(elf_arch_name(elf.header.e_machine));
    let entry_point = Some(elf.entry);

    let sections = elf
        .section_headers
        .iter()
        .map(|sh| {
            let name = elf
                .shdr_strtab
                .get_at(sh.sh_name)
                .unwrap_or("<bad-strtab>")
                .to_owned();
            let offset = sh.sh_offset as usize;
            let len = sh.sh_size as usize;
            let entropy = bytes
                .get(offset..offset.saturating_add(len))
                .filter(|s| !s.is_empty())
                .map(shannon_entropy);
            Section {
                name,
                vaddr: sh.sh_addr,
                size: sh.sh_size,
                entropy,
            }
        })
        .collect();

    let imports = elf
        .dynsyms
        .iter()
        .filter(|s| s.is_import())
        .filter_map(|s| {
            elf.dynstrtab
                .get_at(s.st_name)
                .map(std::borrow::ToOwned::to_owned)
        })
        .collect();

    let exports = elf
        .dynsyms
        .iter()
        .filter(|s| !s.is_import() && s.st_name != 0)
        .filter_map(|s| {
            elf.dynstrtab
                .get_at(s.st_name)
                .map(std::borrow::ToOwned::to_owned)
        })
        .collect();
    let libraries = elf.libraries.iter().map(|l| (*l).to_owned()).collect();

    TriageReport {
        format,
        size,
        sha256,
        arch,
        entry_point,
        sections,
        imports,
        exports,
        libraries,
        subsystem: None,
        strings_sample,
        architecture_slices: Vec::new(),
    }
}

fn elf_arch_name(e_machine: u16) -> String {
    use goblin::elf::header;
    match e_machine {
        header::EM_X86_64 => "x86_64".to_owned(),
        header::EM_386 => "i386".to_owned(),
        header::EM_AARCH64 => "aarch64".to_owned(),
        header::EM_ARM => "arm".to_owned(),
        header::EM_RISCV => "riscv".to_owned(),
        header::EM_PPC64 => "ppc64".to_owned(),
        other => format!("EM_{other}"),
    }
}

/// Parse a thin Mach-O image or aggregate the executable slices of a universal
/// Mach-O container. Goblin validates load-command and slice bounds before any
/// section bytes are used.
fn triage_macho(
    bytes: &[u8],
    size: usize,
    sha256: String,
    strings_sample: Vec<String>,
) -> TriageReport {
    use goblin::mach::{Mach, SingleArch};

    let parsed = match Mach::parse(bytes) {
        Ok(parsed) => parsed,
        Err(_) => return unknown_report(size, sha256, strings_sample),
    };
    match parsed {
        Mach::Binary(macho) => {
            let arch = macho_arch_name(macho.header.cputype);
            let image = triage_macho_image(&macho);
            TriageReport {
                format: if macho.is_64 {
                    Format::Macho64
                } else {
                    Format::Macho32
                },
                size,
                sha256,
                arch: Some(arch.clone()),
                entry_point: (macho.entry != 0).then_some(macho.entry),
                sections: image.sections,
                imports: image.imports,
                exports: image.exports,
                libraries: image.libraries,
                subsystem: None,
                strings_sample,
                architecture_slices: vec![ArchitectureSlice {
                    arch,
                    bits: Some(if macho.is_64 { 64 } else { 32 }),
                    offset: 0,
                    size: size as u64,
                    entry_point: (macho.entry != 0).then_some(macho.entry),
                }],
            }
        }
        Mach::Fat(fat) => {
            // Read the complete architecture table before iterating: an untrusted
            // count must not turn a short file into billions of iterator steps.
            let Ok(arches) = fat.arches() else {
                return unknown_report(size, sha256, strings_sample);
            };
            let Some(table_end) = arches.len().checked_mul(20).and_then(|n| n.checked_add(8))
            else {
                return unknown_report(size, sha256, strings_sample);
            };
            let mut slices = Vec::new();
            let mut sections = Vec::new();
            let mut imports = Vec::new();
            let mut exports = Vec::new();
            let mut libraries = Vec::new();

            let mut ranges = Vec::new();
            for fat_arch in &arches {
                let offset = fat_arch.offset as usize;
                let slice_size = fat_arch.size as usize;
                let Some(end) = offset.checked_add(slice_size) else {
                    return unknown_report(size, sha256, strings_sample);
                };
                if offset < table_end || slice_size == 0 || end > bytes.len() {
                    return unknown_report(size, sha256, strings_sample);
                }
                ranges.push((offset, end));
            }
            ranges.sort_unstable();
            if ranges.windows(2).any(|pair| pair[1].0 < pair[0].1) {
                return unknown_report(size, sha256, strings_sample);
            }
            for (index, fat_arch) in arches.iter().enumerate() {
                let offset = fat_arch.offset as usize;
                let slice_size = fat_arch.size as usize;
                let Ok(SingleArch::MachO(macho)) = fat.get(index) else {
                    return unknown_report(size, sha256, strings_sample);
                };
                if macho.header.cputype != fat_arch.cputype {
                    return unknown_report(size, sha256, strings_sample);
                }
                let arch_name = macho_arch_name(macho.header.cputype);
                let entry_point = (macho.entry != 0).then_some(macho.entry);
                let image = triage_macho_image(&macho);
                sections.extend(image.sections);
                imports.extend(image.imports);
                exports.extend(image.exports);
                libraries.extend(image.libraries);
                slices.push(ArchitectureSlice {
                    arch: arch_name,
                    bits: Some(if macho.is_64 { 64 } else { 32 }),
                    offset: offset as u64,
                    size: slice_size as u64,
                    entry_point,
                });
            }

            // Malformed containers and fat archives with no executable slices
            // should not be advertised as a successfully parsed universal image.
            if slices.is_empty() {
                return unknown_report(size, sha256, strings_sample);
            }
            sections.sort_by(|a, b| a.name.cmp(&b.name).then(a.vaddr.cmp(&b.vaddr)));
            sections.dedup_by(|a, b| a.name == b.name && a.vaddr == b.vaddr && a.size == b.size);
            imports.sort();
            imports.dedup();
            exports.sort();
            exports.dedup();
            libraries.sort();
            libraries.dedup();
            let arch = slices
                .iter()
                .map(|s| s.arch.as_str())
                .collect::<Vec<_>>()
                .join(", ");
            TriageReport {
                format: Format::MachoUniversal,
                size,
                sha256,
                arch: Some(arch),
                entry_point: slices.iter().find_map(|slice| slice.entry_point),
                sections,
                imports,
                exports,
                libraries,
                subsystem: None,
                strings_sample,
                architecture_slices: slices,
            }
        }
    }
}

struct MachoImageParts {
    sections: Vec<Section>,
    imports: Vec<String>,
    exports: Vec<String>,
    libraries: Vec<String>,
}

fn triage_macho_image(macho: &goblin::mach::MachO<'_>) -> MachoImageParts {
    let mut sections = Vec::new();
    for segment in &macho.segments {
        if let Ok(segment_name) = segment.name()
            && let Ok(segment_sections) = segment.sections()
        {
            for (section, data) in segment_sections {
                let section_name = section.name().unwrap_or("<bad-name>");
                let bytes: &[u8] = data;
                sections.push(Section {
                    name: format!("{segment_name},{section_name}"),
                    vaddr: section.addr,
                    size: section.size,
                    entropy: section_entropy(bytes.get(..section.size as usize)),
                });
            }
        }
    }
    let mut imports = macho
        .imports()
        .unwrap_or_default()
        .into_iter()
        .map(|symbol| symbol.name.to_owned())
        .collect::<Vec<_>>();
    let mut exports = macho
        .exports()
        .unwrap_or_default()
        .into_iter()
        .map(|symbol| symbol.name)
        .collect::<Vec<_>>();
    let mut libraries = macho
        .libs
        .iter()
        .map(|name| (*name).to_owned())
        .collect::<Vec<_>>();
    imports.sort();
    imports.dedup();
    exports.sort();
    exports.dedup();
    libraries.sort();
    libraries.dedup();
    MachoImageParts {
        sections,
        imports,
        exports,
        libraries,
    }
}

fn macho_arch_name(cputype: u32) -> String {
    use goblin::mach::constants::cputype;
    match cputype {
        cputype::CPU_TYPE_X86 => "i386".to_owned(),
        cputype::CPU_TYPE_X86_64 => "x86_64".to_owned(),
        cputype::CPU_TYPE_ARM => "arm".to_owned(),
        cputype::CPU_TYPE_ARM64 => "aarch64".to_owned(),
        cputype::CPU_TYPE_POWERPC => "ppc".to_owned(),
        cputype::CPU_TYPE_POWERPC64 => "ppc64".to_owned(),
        other => format!("CPU_TYPE_{other:#010x}"),
    }
}

// ---------------------------------------------------------------------------
// Entropy + strings
// ---------------------------------------------------------------------------

fn section_entropy(data: Option<&[u8]>) -> Option<f64> {
    data.filter(|d| !d.is_empty()).map(shannon_entropy)
}

/// Standard Shannon entropy in bits/byte. Range `[0.0, 8.0]`.
#[must_use]
pub fn shannon_entropy(data: &[u8]) -> f64 {
    let mut counts = [0u64; 256];
    for &b in data {
        counts[b as usize] += 1;
    }
    let len = data.len() as f64;
    counts
        .iter()
        .filter(|&&c| c > 0)
        .map(|&c| {
            let p = c as f64 / len;
            -p * p.log2()
        })
        .sum()
}

/// Multi-digest result compatible with the `binary_hash_multi` tool.
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct MultiHash {
    pub success: bool,
    pub path: String,
    pub size: u64,
    pub md5: String,
    pub sha1: String,
    pub sha256: String,
}

/// Computes MD5, SHA-1 and SHA-256 in one bounded streaming pass.
pub fn hash_file(path: &std::path::Path) -> std::io::Result<MultiHash> {
    use std::io::{BufReader, Read};

    use md5::{Digest, Md5};
    use sha1::Sha1;
    use sha2::Sha256;

    let file = std::fs::File::open(path)?;
    let mut reader = BufReader::new(file);
    let mut md5 = Md5::new();
    let mut sha1 = Sha1::new();
    let mut sha256 = Sha256::new();
    let mut buffer = [0_u8; 1024 * 1024];
    let mut size = 0_u64;
    loop {
        let read = reader.read(&mut buffer)?;
        if read == 0 {
            break;
        }
        md5.update(&buffer[..read]);
        sha1.update(&buffer[..read]);
        sha256.update(&buffer[..read]);
        size += read as u64;
    }
    Ok(MultiHash {
        success: true,
        path: path.display().to_string(),
        size,
        md5: hex::encode(md5.finalize()),
        sha1: hex::encode(sha1.finalize()),
        sha256: hex::encode(sha256.finalize()),
    })
}

#[derive(Debug, Clone, Serialize)]
pub struct BinaryString {
    pub offset: u64,
    pub encoding: &'static str,
    pub length: usize,
    pub value: String,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ExtractedStrings {
    pub success: bool,
    pub path: String,
    pub strings: Vec<BinaryString>,
    pub count: usize,
    pub capped: bool,
}

/// Extracts printable ASCII and UTF-16LE runs using the frozen WinClean DTO.
pub fn extract_strings_file(
    path: &std::path::Path,
    min_length: Option<usize>,
    max_results: Option<usize>,
) -> std::io::Result<ExtractedStrings> {
    let bytes = std::fs::read(path)?;
    let min_length = min_length.unwrap_or(4).clamp(2, 256);
    let max_results = max_results.unwrap_or(1000).clamp(1, 50_000);
    let mut strings = Vec::with_capacity(max_results.min(4096));

    let mut start = None;
    for (index, &byte) in bytes.iter().enumerate() {
        if (0x20..0x7f).contains(&byte) {
            start.get_or_insert(index);
        } else if let Some(begin) = start.take()
            && index - begin >= min_length
        {
            strings.push(BinaryString {
                offset: begin as u64,
                encoding: "ascii",
                length: index - begin,
                value: String::from_utf8_lossy(&bytes[begin..index]).into_owned(),
            });
            if strings.len() >= max_results {
                return Ok(ExtractedStrings {
                    success: true,
                    path: path.display().to_string(),
                    count: strings.len(),
                    capped: true,
                    strings,
                });
            }
        }
    }
    if let Some(begin) = start
        && bytes.len() - begin >= min_length
    {
        strings.push(BinaryString {
            offset: begin as u64,
            encoding: "ascii",
            length: bytes.len() - begin,
            value: String::from_utf8_lossy(&bytes[begin..]).into_owned(),
        });
    }

    let mut index = 0;
    let mut start = None;
    while index + 1 < bytes.len() && strings.len() < max_results {
        let printable = bytes[index + 1] == 0 && (0x20..0x7f).contains(&bytes[index]);
        if printable {
            start.get_or_insert(index);
        } else if let Some(begin) = start.take() {
            let length = (index - begin) / 2;
            if length >= min_length {
                let value: String = bytes[begin..index]
                    .as_chunks::<2>()
                    .0
                    .iter()
                    .map(|pair| pair[0] as char)
                    .collect();
                strings.push(BinaryString {
                    offset: begin as u64,
                    encoding: "utf16",
                    length,
                    value,
                });
            }
        }
        index += 2;
    }
    if let Some(begin) = start
        && (index - begin) / 2 >= min_length
        && strings.len() < max_results
    {
        strings.push(BinaryString {
            offset: begin as u64,
            encoding: "utf16",
            length: (index - begin) / 2,
            value: bytes[begin..index]
                .as_chunks::<2>()
                .0
                .iter()
                .map(|pair| pair[0] as char)
                .collect(),
        });
    }

    Ok(ExtractedStrings {
        success: true,
        path: path.display().to_string(),
        count: strings.len(),
        capped: strings.len() >= max_results,
        strings,
    })
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct XorResult {
    pub success: bool,
    pub input: String,
    pub output: String,
    pub key_len: usize,
    pub bytes: u64,
    pub sha256: String,
}

/// Applies a repeating XOR key while streaming input to the requested output.
pub fn xor_file(
    input: &std::path::Path,
    output: &std::path::Path,
    key_hex: &str,
) -> std::io::Result<XorResult> {
    use std::io::{BufReader, Read, Write};

    use sha2::{Digest, Sha256};

    let clean: String = key_hex.chars().filter(|c| *c != ' ' && *c != '-').collect();
    if clean.is_empty() || !clean.len().is_multiple_of(2) {
        return Err(std::io::Error::new(
            std::io::ErrorKind::InvalidInput,
            "invalid keyHex.",
        ));
    }
    let mut key = Vec::with_capacity(clean.len() / 2);
    for pair in clean.as_bytes().as_chunks::<2>().0 {
        let text = std::str::from_utf8(pair).map_err(|_| {
            std::io::Error::new(std::io::ErrorKind::InvalidInput, "invalid keyHex.")
        })?;
        key.push(u8::from_str_radix(text, 16).map_err(|_| {
            std::io::Error::new(std::io::ErrorKind::InvalidInput, "invalid keyHex.")
        })?);
    }
    if let Some(parent) = output.parent() {
        std::fs::create_dir_all(parent)?;
    }
    let mut input_reader = BufReader::new(std::fs::File::open(input)?);
    let mut writer = std::fs::File::create(output)?;
    let mut digest = Sha256::new();
    let mut buffer = [0_u8; 1024 * 1024];
    let mut index = 0_usize;
    let mut bytes = 0_u64;
    loop {
        let count = input_reader.read(&mut buffer)?;
        if count == 0 {
            break;
        }
        for byte in &mut buffer[..count] {
            *byte ^= key[index];
            index = (index + 1) % key.len();
        }
        writer.write_all(&buffer[..count])?;
        digest.update(&buffer[..count]);
        bytes += count as u64;
    }
    writer.flush()?;
    Ok(XorResult {
        success: true,
        input: input.display().to_string(),
        output: output.display().to_string(),
        key_len: key.len(),
        bytes,
        sha256: hex::encode(digest.finalize()),
    })
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AesCtrResult {
    pub success: bool,
    pub input: String,
    pub output: String,
    pub key_bits: usize,
    pub bytes: u64,
    pub sha256: String,
}

/// AES-128/256 in big-endian counter mode, matching the legacy tool contract.
pub fn aes_ctr_file(
    input: &std::path::Path,
    output: &std::path::Path,
    key_hex: &str,
    iv_hex: &str,
) -> std::io::Result<AesCtrResult> {
    use std::io::{BufReader, Read, Write};

    use aes::{
        Aes128, Aes256, Block,
        cipher::{BlockCipherEncrypt, KeyInit},
    };
    use sha2::{Digest, Sha256};

    fn parse_hex(value: &str) -> std::io::Result<Vec<u8>> {
        let clean: String = value.chars().filter(|c| *c != ' ' && *c != '-').collect();
        if clean.is_empty() || !clean.len().is_multiple_of(2) {
            return Err(std::io::Error::new(
                std::io::ErrorKind::InvalidInput,
                "invalid hex.",
            ));
        }
        clean
            .as_bytes()
            .as_chunks::<2>()
            .0
            .iter()
            .map(|pair| {
                let text = std::str::from_utf8(pair).map_err(|_| {
                    std::io::Error::new(std::io::ErrorKind::InvalidInput, "invalid hex.")
                })?;
                u8::from_str_radix(text, 16).map_err(|_| {
                    std::io::Error::new(std::io::ErrorKind::InvalidInput, "invalid hex.")
                })
            })
            .collect()
    }

    let key = parse_hex(key_hex)?;
    if key.len() != 16 && key.len() != 32 {
        return Err(std::io::Error::new(
            std::io::ErrorKind::InvalidInput,
            "key must be 16 or 32 bytes.",
        ));
    }
    let iv = parse_hex(iv_hex)?;
    if iv.len() != 16 {
        return Err(std::io::Error::new(
            std::io::ErrorKind::InvalidInput,
            "iv must be 16 bytes.",
        ));
    }
    if let Some(parent) = output.parent() {
        std::fs::create_dir_all(parent)?;
    }
    let mut reader = BufReader::new(std::fs::File::open(input)?);
    let mut writer = std::fs::File::create(output)?;
    let mut digest = Sha256::new();
    let mut counter = [0_u8; 16];
    counter.copy_from_slice(&iv);
    let mut buffer = [0_u8; 1024 * 1024];
    let mut bytes = 0_u64;
    loop {
        let count = reader.read(&mut buffer)?;
        if count == 0 {
            break;
        }
        for chunk in buffer[..count].chunks_mut(16) {
            let mut block = Block::from(counter);
            if key.len() == 16 {
                Aes128::new_from_slice(&key)
                    .expect("validated AES-128 key")
                    .encrypt_block(&mut block);
            } else {
                Aes256::new_from_slice(&key)
                    .expect("validated AES-256 key")
                    .encrypt_block(&mut block);
            }
            for (value, mask) in chunk.iter_mut().zip(block.iter()) {
                *value ^= mask;
            }
            for index in (0..16).rev() {
                counter[index] = counter[index].wrapping_add(1);
                if counter[index] != 0 {
                    break;
                }
            }
        }
        writer.write_all(&buffer[..count])?;
        digest.update(&buffer[..count]);
        bytes += count as u64;
    }
    writer.flush()?;
    Ok(AesCtrResult {
        success: true,
        input: input.display().to_string(),
        output: output.display().to_string(),
        key_bits: key.len() * 8,
        bytes,
        sha256: hex::encode(digest.finalize()),
    })
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SectionDumpResult {
    pub success: bool,
    pub path: String,
    pub section: String,
    pub offset: String,
    pub size: u32,
    pub output: String,
    pub sha256: String,
}

/// Copies one raw PE section to a file and fingerprints the result.
pub fn section_dump_file(
    input: &std::path::Path,
    section_name: &str,
    output_path: Option<&std::path::Path>,
) -> std::io::Result<SectionDumpResult> {
    use sha2::{Digest, Sha256};

    let bytes = std::fs::read(input)?;
    let invalid = || std::io::Error::new(std::io::ErrorKind::InvalidData, "not a PE file.");
    if bytes.len() < 0x40 || &bytes[..2] != b"MZ" {
        return Err(invalid());
    }
    let pe_offset = u32::from_le_bytes(bytes[0x3c..0x40].try_into().expect("four bytes")) as usize;
    if pe_offset.checked_add(24).is_none()
        || pe_offset + 24 > bytes.len()
        || &bytes[pe_offset..pe_offset + 4] != b"PE\0\0"
    {
        return Err(invalid());
    }
    let sections = u16::from_le_bytes(
        bytes[pe_offset + 6..pe_offset + 8]
            .try_into()
            .expect("two bytes"),
    ) as usize;
    let optional_size = u16::from_le_bytes(
        bytes[pe_offset + 20..pe_offset + 22]
            .try_into()
            .expect("two bytes"),
    ) as usize;
    let table = pe_offset
        .checked_add(24)
        .and_then(|value| value.checked_add(optional_size))
        .ok_or_else(invalid)?;
    let mut found = None;
    for index in 0..sections {
        let base = table
            .checked_add(index.checked_mul(40).ok_or_else(invalid)?)
            .ok_or_else(invalid)?;
        if base + 40 > bytes.len() {
            return Err(invalid());
        }
        let name_end = bytes[base..base + 8]
            .iter()
            .position(|byte| *byte == 0)
            .unwrap_or(8);
        let name = String::from_utf8_lossy(&bytes[base..base + name_end]);
        if name == section_name {
            let raw_size =
                u32::from_le_bytes(bytes[base + 16..base + 20].try_into().expect("four bytes"));
            let raw_offset =
                u32::from_le_bytes(bytes[base + 20..base + 24].try_into().expect("four bytes"));
            found = Some((name.into_owned(), raw_offset, raw_size));
            break;
        }
    }
    let (section, raw_offset, raw_size) = found.ok_or_else(|| {
        std::io::Error::new(
            std::io::ErrorKind::NotFound,
            format!("section '{section_name}' not found."),
        )
    })?;
    let end = (raw_offset as u64)
        .checked_add(raw_size as u64)
        .ok_or_else(invalid)?;
    if end > bytes.len() as u64 {
        return Err(invalid());
    }
    let destination = output_path
        .map(std::path::Path::to_path_buf)
        .unwrap_or_else(|| {
            std::env::temp_dir().join(format!(
                "{}_{}.bin",
                input
                    .file_stem()
                    .and_then(|value| value.to_str())
                    .unwrap_or("section"),
                section.trim_start_matches('.')
            ))
        });
    if let Some(parent) = destination.parent() {
        std::fs::create_dir_all(parent)?;
    }
    let data = &bytes[raw_offset as usize..end as usize];
    std::fs::write(&destination, data)?;
    Ok(SectionDumpResult {
        success: true,
        path: input.display().to_string(),
        section,
        offset: format!("0x{raw_offset:X}"),
        size: raw_size,
        output: destination.display().to_string(),
        sha256: hex::encode(Sha256::digest(data)),
    })
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PeSection {
    pub name: String,
    pub virt_size: u32,
    pub virt_addr: String,
    pub raw_size: u32,
    pub raw_ptr: String,
    pub flags: String,
    pub exec: bool,
    pub write: bool,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PeHeader {
    pub success: bool,
    pub path: String,
    pub machine: String,
    pub is64bit: bool,
    pub image_base: String,
    pub entry_rva: String,
    pub timestamp: u32,
    pub characteristics: String,
    pub subsystem: u16,
    pub subsystem_name: String,
    pub section_count: u16,
    pub sections: Vec<PeSection>,
}

/// Parses the compatibility PE/COFF header DTO without a platform API.
pub fn parse_pe_header_file(path: &std::path::Path) -> std::io::Result<PeHeader> {
    let bytes = std::fs::read(path)?;
    let invalid = || std::io::Error::new(std::io::ErrorKind::InvalidData, "invalid PE header");
    let get = |offset: usize, size: usize| bytes.get(offset..offset + size).ok_or_else(invalid);
    if bytes.len() < 0x40 || &bytes[..2] != b"MZ" {
        return Err(invalid());
    }
    let pe = u32::from_le_bytes(get(0x3c, 4)?.try_into().expect("four bytes")) as usize;
    if pe + 24 > bytes.len() || &bytes[pe..pe + 4] != b"PE\0\0" {
        return Err(invalid());
    }
    let machine_code = u16::from_le_bytes(get(pe + 4, 2)?.try_into().expect("two bytes"));
    let section_count = u16::from_le_bytes(get(pe + 6, 2)?.try_into().expect("two bytes"));
    let timestamp = u32::from_le_bytes(get(pe + 8, 4)?.try_into().expect("four bytes"));
    let optional_size =
        u16::from_le_bytes(get(pe + 20, 2)?.try_into().expect("two bytes")) as usize;
    let characteristics_code = u16::from_le_bytes(get(pe + 22, 2)?.try_into().expect("two bytes"));
    let optional = pe + 24;
    let magic = u16::from_le_bytes(get(optional, 2)?.try_into().expect("two bytes"));
    let is64bit = magic == 0x20b;
    let entry = u32::from_le_bytes(get(optional + 16, 4)?.try_into().expect("four bytes"));
    let image_base = if is64bit {
        u64::from_le_bytes(get(optional + 24, 8)?.try_into().expect("eight bytes"))
    } else {
        u32::from_le_bytes(get(optional + 28, 4)?.try_into().expect("four bytes")) as u64
    };
    let subsystem = u16::from_le_bytes(get(optional + 68, 2)?.try_into().expect("two bytes"));
    let table = optional.checked_add(optional_size).ok_or_else(invalid)?;
    let mut sections = Vec::with_capacity(section_count.min(96) as usize);
    for index in 0..section_count.min(96) as usize {
        let base = table
            .checked_add(index.checked_mul(40).ok_or_else(invalid)?)
            .ok_or_else(invalid)?;
        let row = get(base, 40)?;
        let name_end = row[..8].iter().position(|byte| *byte == 0).unwrap_or(8);
        let name = String::from_utf8_lossy(&row[..name_end]).into_owned();
        let virt_size = u32::from_le_bytes(row[8..12].try_into().expect("four bytes"));
        let virt_addr = u32::from_le_bytes(row[12..16].try_into().expect("four bytes"));
        let raw_size = u32::from_le_bytes(row[16..20].try_into().expect("four bytes"));
        let raw_ptr = u32::from_le_bytes(row[20..24].try_into().expect("four bytes"));
        let flags = u32::from_le_bytes(row[36..40].try_into().expect("four bytes"));
        sections.push(PeSection {
            name,
            virt_size,
            virt_addr: format!("0x{virt_addr:X}"),
            raw_size,
            raw_ptr: format!("0x{raw_ptr:X}"),
            flags: format!("0x{flags:08X}"),
            exec: flags & 0x2000_0000 != 0,
            write: flags & 0x8000_0000 != 0,
        });
    }
    let machine = match machine_code {
        0x14c => "x86".to_owned(),
        0x8664 => "x64".to_owned(),
        0x1c0 => "arm".to_owned(),
        0xaa64 => "arm64".to_owned(),
        0x200 => "ia64".to_owned(),
        code => format!("0x{code:04X}"),
    };
    let subsystem_name = match subsystem {
        1 => "native",
        2 => "windows-gui",
        3 => "windows-console",
        5 => "os2",
        7 => "posix",
        9 => "wince-gui",
        10 => "efi-app",
        11 => "efi-boot-driver",
        12 => "efi-runtime-driver",
        13 => "efi-rom",
        14 => "xbox",
        16 => "boot",
        _ => "unknown",
    }
    .to_owned();
    Ok(PeHeader {
        success: true,
        path: path.display().to_string(),
        machine,
        is64bit,
        image_base: format!("0x{image_base:X}"),
        entry_rva: format!("0x{entry:X}"),
        timestamp,
        characteristics: format!("0x{characteristics_code:04X}"),
        subsystem,
        subsystem_name,
        section_count,
        sections,
    })
}

/// Compatibility DTO for the WinClean `analyze_pe` tool.
#[derive(Debug, Clone, Serialize)]
pub struct PeAnalysis {
    pub success: bool,
    #[serde(rename = "file_name")]
    pub file_name: String,
    #[serde(rename = "is_64bit")]
    pub is_64bit: bool,
    #[serde(rename = "is_dll")]
    pub is_dll: bool,
    #[serde(rename = "is_signed")]
    pub is_signed: bool,
    #[serde(rename = "machine_type")]
    pub machine_type: String,
    #[serde(rename = "image_base")]
    pub image_base: String,
    #[serde(rename = "extracted_strings")]
    pub extracted_strings: Vec<String>,
    #[serde(rename = "entry_point_asm")]
    pub entry_point_asm: Vec<String>,
    pub sections: Vec<PeAnalysisSection>,
    pub imports: Vec<PeAnalysisImport>,
    #[serde(rename = "recovered_symbols")]
    pub recovered_symbols: Vec<PeAnalysisSymbol>,
}

#[derive(Debug, Clone, Serialize)]
pub struct PeAnalysisSection {
    pub name: String,
    #[serde(rename = "virtual_size")]
    pub virtual_size: u32,
    #[serde(rename = "raw_size")]
    pub raw_size: u32,
    pub characteristics: String,
    pub entropy: Option<f64>,
}

#[derive(Debug, Clone, Serialize)]
pub struct PeAnalysisImport {
    #[serde(rename = "dll_name")]
    pub dll_name: String,
    pub functions: Vec<String>,
}

#[derive(Debug, Clone, Serialize)]
pub struct PeAnalysisSymbol {
    pub address: String,
    pub name: String,
    pub source: String,
}

/// Passive PE analysis using the canonical `bun-re` parser.
pub fn analyze_pe_file(path: &std::path::Path) -> std::io::Result<PeAnalysis> {
    let bytes = std::fs::read(path)?;
    let header = parse_pe_header_file(path)?;
    let triage = triage(&bytes)
        .map_err(|error| std::io::Error::new(std::io::ErrorKind::InvalidData, error.to_string()))?;
    let pe = goblin::pe::PE::parse(&bytes)
        .map_err(|error| std::io::Error::new(std::io::ErrorKind::InvalidData, error.to_string()))?;

    let sections = pe
        .sections
        .iter()
        .zip(triage.sections.iter())
        .map(|(section, parsed)| PeAnalysisSection {
            name: section.name().unwrap_or("<bad-utf8>").to_owned(),
            virtual_size: section.virtual_size,
            raw_size: section.size_of_raw_data,
            characteristics: format!("0x{:08X}", section.characteristics),
            entropy: parsed.entropy,
        })
        .collect();

    let mut imports = std::collections::BTreeMap::<String, Vec<String>>::new();
    for import in &pe.imports {
        imports
            .entry(import.dll.to_owned())
            .or_default()
            .push(import.name.to_string());
    }
    let imports = imports
        .into_iter()
        .map(|(dll_name, mut functions)| {
            functions.sort_unstable();
            functions.dedup();
            PeAnalysisImport {
                dll_name,
                functions,
            }
        })
        .collect();

    let recovered_symbols = pe
        .exports
        .iter()
        .filter_map(|export| {
            export.name.map(|name| PeAnalysisSymbol {
                address: format!("0x{:X}", export.rva),
                name: name.to_owned(),
                source: "ExportTable".to_owned(),
            })
        })
        .collect();

    Ok(PeAnalysis {
        success: true,
        file_name: path
            .file_name()
            .and_then(|name| name.to_str())
            .unwrap_or_default()
            .to_owned(),
        is_64bit: header.is64bit,
        is_dll: u16::from_str_radix(header.characteristics.trim_start_matches("0x"), 16)
            .map(|value| value & 0x2000 != 0)
            .unwrap_or(false),
        // Authenticode verification belongs to the Windows trust provider; this
        // passive parser never claims a signature without validating it.
        is_signed: false,
        machine_type: header.machine,
        image_base: header.image_base,
        extracted_strings: triage.strings_sample,
        entry_point_asm: Vec::new(),
        sections,
        imports,
        recovered_symbols,
    })
}

/// Compatibility summary for the WinClean `binary_list_cpk` tool.
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CpkListSummary {
    pub success: bool,
    pub path: String,
    pub size: u64,
    pub has_cpk_magic: bool,
    pub toc_markers: usize,
    pub itoc_markers: usize,
    pub etoc_markers: usize,
    pub note: String,
}

/// Inspect a CPK header and count TOC markers without loading the archive.
pub fn list_cpk_file(
    path: &std::path::Path,
    _max_entries: usize,
) -> std::io::Result<CpkListSummary> {
    let mut file = std::fs::File::open(path)?;
    let size = file.metadata()?.len();
    let mut header = vec![0_u8; size.min(65_536) as usize];
    use std::io::Read;
    let read = file.read(&mut header)?;
    header.truncate(read);
    let has_cpk_magic = header.starts_with(b"CPK ");
    let count = |magic: &[u8; 4]| {
        header
            .windows(4)
            .filter(|window| *window == magic.as_slice())
            .count()
    };
    Ok(CpkListSummary {
        success: true,
        path: path.display().to_string(),
        size,
        has_cpk_magic,
        toc_markers: count(b"TOC "),
        itoc_markers: count(b"ITOC"),
        etoc_markers: count(b"ETOC"),
        note: "Header markers only. Use binary_hash_multi for content verification.".to_owned(),
    })
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AobScanResult {
    pub success: bool,
    pub path: String,
    pub pattern: String,
    pub match_count: usize,
    pub matches: Vec<u64>,
}

/// Scans a file with an IDA-style byte pattern (`?`/`??` wildcards).
pub fn aob_scan_file(
    path: &std::path::Path,
    pattern: &str,
    max_matches: Option<usize>,
) -> std::io::Result<AobScanResult> {
    let mut values = Vec::new();
    for token in pattern.split_whitespace() {
        if token == "?" || token == "??" {
            values.push(None);
        } else if token.len() == 2 {
            values.push(Some(u8::from_str_radix(token, 16).map_err(|_| {
                std::io::Error::new(std::io::ErrorKind::InvalidInput, "invalid AOB pattern")
            })?));
        } else {
            return Err(std::io::Error::new(
                std::io::ErrorKind::InvalidInput,
                "invalid AOB pattern",
            ));
        }
    }
    if values.is_empty() {
        return Err(std::io::Error::new(
            std::io::ErrorKind::InvalidInput,
            "pattern has no bytes",
        ));
    }
    let data = std::fs::read(path)?;
    let limit = max_matches.unwrap_or(50).clamp(1, 1000);
    let mut matches = Vec::with_capacity(limit.min(64));
    if values.len() <= data.len() {
        for offset in 0..=data.len() - values.len() {
            if values
                .iter()
                .enumerate()
                .all(|(index, value)| value.is_none_or(|expected| data[offset + index] == expected))
            {
                matches.push(offset as u64);
                if matches.len() >= limit {
                    break;
                }
            }
        }
    }
    Ok(AobScanResult {
        success: true,
        path: path.display().to_string(),
        pattern: pattern.to_owned(),
        match_count: matches.len(),
        matches,
    })
}

/// Entropy sampling result compatible with the `binary_entropy_map` tool.
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct EntropyMap {
    /// Input file path, preserved verbatim for compatibility.
    pub path: String,
    /// Input length in bytes.
    pub size: u64,
    /// Clamped sample block size.
    pub block_size: usize,
    /// Number of source blocks between retained samples.
    pub sample_step: usize,
    /// Shannon entropy for every retained block.
    pub entropy: Vec<f64>,
    /// Number of retained samples.
    pub samples: usize,
    /// Largest observed entropy.
    pub max: f64,
    /// Smallest observed entropy.
    pub min: f64,
    /// Mean observed entropy.
    pub avg: f64,
}

/// Samples a file in bounded blocks and returns Shannon entropy values.
///
/// `block_size` follows the frozen compatibility contract: omitted values use
/// 4096, values below 256 clamp upward, and values above 1 MiB clamp downward.
pub fn entropy_map_file(
    path: &std::path::Path,
    block_size: Option<usize>,
) -> std::io::Result<EntropyMap> {
    use std::io::{BufReader, Read};

    let block_size = block_size.unwrap_or(4096).clamp(256, 1024 * 1024);
    let file = std::fs::File::open(path)?;
    let size = file.metadata()?.len();
    let total_blocks = size.div_ceil(block_size as u64);
    let sample_step =
        usize::try_from((total_blocks / total_blocks.clamp(1, 4096)).max(1)).unwrap_or(usize::MAX);
    let mut reader = BufReader::new(file);
    let mut block = vec![0_u8; block_size];
    let mut entropy = Vec::with_capacity(usize::try_from(total_blocks.min(4096)).unwrap_or(4096));
    let mut block_index = 0_usize;
    loop {
        let count = reader.read(&mut block)?;
        if count == 0 {
            break;
        }
        if block_index.is_multiple_of(sample_step) {
            entropy.push(shannon_entropy(&block[..count]));
        }
        block_index += 1;
    }
    let samples = entropy.len();
    let max = entropy.iter().copied().reduce(f64::max).unwrap_or(0.0);
    let min = entropy.iter().copied().reduce(f64::min).unwrap_or(0.0);
    let avg = if samples == 0 {
        0.0
    } else {
        entropy.iter().sum::<f64>() / samples as f64
    };
    Ok(EntropyMap {
        path: path.display().to_string(),
        size,
        block_size,
        sample_step,
        entropy,
        samples,
        max,
        min,
        avg,
    })
}

/// Extract ASCII + UTF-16LE strings of length `>= min_len` (in chars).
/// Returns at most `limit` strings, in order of first appearance, with
/// duplicates collapsed.
#[must_use]
pub fn extract_strings(bytes: &[u8], min_len: usize, limit: usize) -> Vec<String> {
    let mut out = Vec::with_capacity(limit);
    let mut seen: std::collections::HashSet<String> =
        std::collections::HashSet::with_capacity(limit);

    // ASCII pass: contiguous runs of 0x20..=0x7E.
    let mut start: Option<usize> = None;
    for (i, &b) in bytes.iter().enumerate() {
        let printable = (0x20..=0x7E).contains(&b);
        match (printable, start) {
            (true, None) => start = Some(i),
            (false, Some(s)) => {
                let len = i - s;
                if len >= min_len
                    && let Ok(text) = std::str::from_utf8(&bytes[s..i])
                {
                    push_unique(&mut out, &mut seen, text.to_owned(), limit);
                    if out.len() >= limit {
                        return out;
                    }
                }
                start = None;
            }
            _ => {}
        }
    }
    if let Some(s) = start {
        let len = bytes.len() - s;
        if len >= min_len
            && let Ok(text) = std::str::from_utf8(&bytes[s..])
        {
            push_unique(&mut out, &mut seen, text.to_owned(), limit);
        }
    }

    // UTF-16LE pass: pairs of (printable_ascii, 0x00).
    if out.len() < limit {
        let mut buf = String::with_capacity(64);
        let mut i = 0;
        while i + 1 < bytes.len() && out.len() < limit {
            let lo = bytes[i];
            let hi = bytes[i + 1];
            if hi == 0 && (0x20..=0x7E).contains(&lo) {
                buf.push(lo as char);
            } else {
                if buf.len() >= min_len {
                    push_unique(&mut out, &mut seen, std::mem::take(&mut buf), limit);
                }
                buf.clear();
            }
            i += 2;
        }
        if buf.len() >= min_len {
            push_unique(&mut out, &mut seen, buf, limit);
        }
    }

    out
}

fn push_unique(
    out: &mut Vec<String>,
    seen: &mut std::collections::HashSet<String>,
    s: String,
    limit: usize,
) {
    if out.len() >= limit {
        return;
    }
    if seen.insert(s.clone()) {
        out.push(s);
    }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

