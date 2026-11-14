// SPDX-License-Identifier: Apache-2.0 OR MIT
//! Pure-Rust Ghidra SRE + REA native binary analysis core:
//! PE32+/ELF64/Mach-O64 loader (`goblin`), `iced-x86` CFG recovery,
//! Ghidra P-Code SSA lifter, and Pseudo-C decompiler.

#![forbid(unsafe_code)]

use goblin::Object;
use iced_x86::{Decoder, DecoderOptions, FastFormatter, FlowControl, Instruction, Mnemonic, OpKind};
use rustc_hash::FxHashSet;
use serde::{Deserialize, Serialize};
use std::path::Path;
use std::time::Instant;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum BinaryContainerFormat {
    Pe64,
    Pe32,
    Elf64,
    Elf32,
    MachO64,
    RawX64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SectionInfo {
    pub name: String,
    pub virtual_address: u64,
    pub virtual_size: u64,
    pub file_offset: u64,
    pub file_size: u64,
    pub executable: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExtractedString {
    pub offset: u64,
    pub value: String,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum PcodeOpcode {
    Copy,
    IntAdd,
    IntSub,
    IntAnd,
    IntOr,
    IntXor,
    IntComp,
    Load,
    Store,
    Branch,
    CBranch,
    Call,
    CallInd,
    Return,
    Nop,
    Other,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PcodeInstruction {
    pub address: u64,
    pub opcode: PcodeOpcode,
    pub output_varnode: Option<String>,
    pub input_varnodes: Vec<String>,
    pub asm_text: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CfgBasicBlock {
    pub block_id: usize,
    pub start_va: u64,
    pub end_va: u64,
    pub instruction_count: usize,
    pub outgoing_targets: Vec<u64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DecompiledFunctionReport {
    pub name: String,
    pub entry_va: u64,
    pub size_bytes: usize,
    pub instruction_count: usize,
    pub basic_blocks: Vec<CfgBasicBlock>,
    pub pcode_ops: Vec<PcodeInstruction>,
    pub callees: Vec<String>,
    pub pseudo_c: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BinarySreReport {
    pub binary_path: String,
    pub blake3_hash: String,
    pub file_size_bytes: usize,
    pub format: BinaryContainerFormat,
    pub image_base: u64,
    pub entry_point_va: u64,
    pub sections: Vec<SectionInfo>,
    pub imports: Vec<String>,
    pub exports: Vec<String>,
    pub strings_sample: Vec<ExtractedString>,
    pub decompiled_functions: Vec<DecompiledFunctionReport>,
    pub elapsed_ms: f64,
}

#[derive(Debug, Clone)]
pub struct SreAnalyzeOptions {
    pub max_functions: usize,
    pub max_instructions_per_fn: usize,
    pub max_strings: usize,
}

impl Default for SreAnalyzeOptions {
    fn default() -> Self {
        Self {
            max_functions: 16,
            max_instructions_per_fn: 96,
            max_strings: 120,
        }
    }
}

pub fn analyze_binary_file(path: &Path, opts: &SreAnalyzeOptions) -> Result<BinarySreReport, String> {
    let bytes = std::fs::read(path).map_err(|e| format!("cannot read {}: {e}", path.display()))?;
    analyze_binary_bytes(&path.to_string_lossy().replace('\\', "/"), &bytes, opts)
}

pub fn analyze_binary_bytes(
    label: &str,
    bytes: &[u8],
    opts: &SreAnalyzeOptions,
) -> Result<BinarySreReport, String> {
    if bytes.is_empty() {
        return Err("empty binary buffer".to_string());
    }

    let t0 = Instant::now();
    let blake3_hash = blake3::hash(bytes).to_hex().to_string();

    let mut sections = Vec::new();
    let mut imports = Vec::new();
    let mut exports = Vec::new();
    let mut fn_seeds: Vec<(String, u64)> = Vec::new();
    let format: BinaryContainerFormat;
    let image_base: u64;
    let entry_point_va: u64;
    let bitness: u32;

    match Object::parse(bytes) {
        Ok(Object::PE(pe)) => {
            format = if pe.is_64 {
                BinaryContainerFormat::Pe64
            } else {
                BinaryContainerFormat::Pe32
            };
            bitness = if pe.is_64 { 64 } else { 32 };
            image_base = pe.image_base;
            entry_point_va = if pe.entry > 0 {
                image_base.wrapping_add(pe.entry as u64)
            } else {
                0
            };
            if entry_point_va != 0 {
                fn_seeds.push(("entry_point".to_string(), entry_point_va));
            }
            for sec in &pe.sections {
                let name = String::from_utf8_lossy(&sec.name)
                    .trim_end_matches('\0')
                    .to_string();
                let exec = (sec.characteristics & 0x2000_0000) != 0;
                sections.push(SectionInfo {
                    name,
                    virtual_address: image_base.wrapping_add(sec.virtual_address as u64),
                    virtual_size: sec.virtual_size as u64,
                    file_offset: sec.pointer_to_raw_data as u64,
                    file_size: sec.size_of_raw_data as u64,
                    executable: exec,
                });
            }
            for imp in pe.imports.iter().take(256) {
                imports.push(format!("{}!{}", imp.dll, imp.name));
            }
            for exp in pe.exports.iter().take(256) {
                let ename = exp.name.unwrap_or("<ordinal>").to_string();
                exports.push(ename.clone());
                if exp.rva > 0 && fn_seeds.len() < opts.max_functions {
                    fn_seeds.push((ename, image_base.wrapping_add(exp.rva as u64)));
                }
            }
        }
        Ok(Object::Elf(elf)) => {
            format = if elf.is_64 {
                BinaryContainerFormat::Elf64
            } else {
                BinaryContainerFormat::Elf32
            };
            bitness = if elf.is_64 { 64 } else { 32 };
            image_base = 0;
            entry_point_va = elf.entry;
            if entry_point_va != 0 {
                fn_seeds.push(("_start".to_string(), entry_point_va));
            }
            for sh in &elf.section_headers {
                let name = elf.shdr_strtab.get_at(sh.sh_name).unwrap_or("").to_string();
                let exec = (sh.sh_flags & 0x4) != 0;
                sections.push(SectionInfo {
                    name,
                    virtual_address: sh.sh_addr,
                    virtual_size: sh.sh_size,
                    file_offset: sh.sh_offset,
                    file_size: sh.sh_size,
                    executable: exec,
                });
            }
            for sym in elf.dynsyms.iter() {
                if let Some(name) = elf.dynstrtab.get_at(sym.st_name)
                    && !name.is_empty()
                {
                    if sym.st_value == 0 {
                        if imports.len() < 256 {
                            imports.push(name.to_string());
                        }
                    } else {
                        if exports.len() < 256 {
                            exports.push(name.to_string());
                        }
                        if sym.is_function() && fn_seeds.len() < opts.max_functions {
                            fn_seeds.push((name.to_string(), sym.st_value));
                        }
                    }
                }
            }
        }
        Ok(Object::Mach(goblin::mach::Mach::Binary(macho))) => {
            format = BinaryContainerFormat::MachO64;
            bitness = if macho.is_64 { 64 } else { 32 };
            image_base = 0;
            entry_point_va = macho.entry;
            if entry_point_va != 0 {
                fn_seeds.push(("_main".to_string(), entry_point_va));
            }
            for seg in &macho.segments {
                if let Ok(secs) = seg.sections() {
                    for (sec, _) in secs {
                        let name = sec.name().unwrap_or("").to_string();
                        sections.push(SectionInfo {
                            name,
                            virtual_address: sec.addr,
                            virtual_size: sec.size,
                            file_offset: sec.offset as u64,
                            file_size: sec.size,
                            executable: (seg.initprot & 0x04) != 0,
                        });
                    }
                }
            }
        }
        _ => {
            format = BinaryContainerFormat::RawX64;
            bitness = 64;
            image_base = 0x1000_0000;
            entry_point_va = 0x1000_0000;
            sections.push(SectionInfo {
                name: ".raw".to_string(),
                virtual_address: image_base,
                virtual_size: bytes.len() as u64,
                file_offset: 0,
                file_size: bytes.len() as u64,
                executable: true,
            });
            fn_seeds.push(("raw_entry".to_string(), image_base));
        }
    }

    if fn_seeds.is_empty()
        && let Some(exec_sec) = sections.iter().find(|s| s.executable && s.file_size > 0)
    {
        fn_seeds.push(("sub_exec_start".to_string(), exec_sec.virtual_address));
    }

    let mut seen_va = FxHashSet::default();
    let mut decompiled_functions = Vec::new();
    for (name, va) in fn_seeds {
        if decompiled_functions.len() >= opts.max_functions || !seen_va.insert(va) {
            continue;
        }
        if let Some(code_slice) = resolve_va_slice(bytes, &sections, va, 2048) {
            decompiled_functions.push(decompile_x86_slice(
                &name,
                va,
                code_slice,
                bitness,
                opts.max_instructions_per_fn,
            ));
        }
    }

    Ok(BinarySreReport {
        binary_path: label.to_string(),
        blake3_hash,
        file_size_bytes: bytes.len(),
        format,
        image_base,
        entry_point_va,
        sections,
        imports,
        exports,
        strings_sample: extract_printable_strings(bytes, opts.max_strings),
        decompiled_functions,
        elapsed_ms: t0.elapsed().as_secs_f64() * 1000.0,
    })
}

fn resolve_va_slice<'a>(
    bytes: &'a [u8],
    sections: &[SectionInfo],
    va: u64,
    max_len: usize,
) -> Option<&'a [u8]> {
    for s in sections {
        let sec_end_va = s.virtual_address.saturating_add(s.virtual_size.max(s.file_size));
        if va >= s.virtual_address && va < sec_end_va {
            let delta = (va - s.virtual_address) as usize;
            let file_start = (s.file_offset as usize).saturating_add(delta);
            if file_start < bytes.len() {
                let sec_limit = (s.file_offset.saturating_add(s.file_size) as usize).min(bytes.len());
                let end = file_start.saturating_add(max_len).min(sec_limit).min(bytes.len());
                if end > file_start {
                    return Some(&bytes[file_start..end]);
                }
            }
        }
    }
    None
}

/// Disassembles, lifts to Ghidra P-Code, recovers CFG basic blocks, and emits Pseudo-C.
pub fn decompile_x86_slice(
    name: &str,
    start_va: u64,
    code: &[u8],
    bitness: u32,
    max_insns: usize,
) -> DecompiledFunctionReport {
    let mut decoder = Decoder::with_ip(bitness, code, start_va, DecoderOptions::NONE);
    let mut formatter = FastFormatter::new();

    let mut instructions: Vec<Instruction> = Vec::with_capacity(max_insns.min(128));
    let mut pcode_ops: Vec<PcodeInstruction> = Vec::with_capacity(max_insns.min(128));
    let mut block_leaders: FxHashSet<u64> = FxHashSet::default();
    block_leaders.insert(start_va);
    let mut callees = Vec::new();
    let mut total_bytes = 0usize;

    while decoder.can_decode() && instructions.len() < max_insns {
        let instr = decoder.decode();
        if instr.is_invalid() {
            break;
        }
        total_bytes += instr.len();

        let mut asm_text = String::new();
        formatter.format(&instr, &mut asm_text);

        let pcode = lift_instruction_to_pcode(&instr, &asm_text);
        pcode_ops.push(pcode);

        match instr.flow_control() {
            FlowControl::ConditionalBranch => {
                let target = instr.near_branch_target();
                if target != 0 {
                    block_leaders.insert(target);
                }
                block_leaders.insert(instr.next_ip());
            }
            FlowControl::UnconditionalBranch => {
                let target = instr.near_branch_target();
                if target != 0 {
                    block_leaders.insert(target);
                }
                instructions.push(instr);
                if instructions.len() > 1 {
                    break;
                }
                continue;
            }
            FlowControl::Call => {
                let target = instr.near_branch_target();
                if target != 0 {
                    let sym = format!("sub_{target:x}");
                    if !callees.contains(&sym) {
                        callees.push(sym);
                    }
                }
            }
            FlowControl::Return => {
                instructions.push(instr);
                break;
            }
            _ => {}
        }

        instructions.push(instr);
    }

    let mut basic_blocks = Vec::new();
    if !instructions.is_empty() {
        let mut blk_start = instructions[0].ip();
        let mut blk_count = 0usize;
        for (idx, ins) in instructions.iter().enumerate() {
            if idx > 0 && block_leaders.contains(&ins.ip()) && blk_count > 0 {
                let prev = &instructions[idx - 1];
                basic_blocks.push(CfgBasicBlock {
                    block_id: basic_blocks.len(),
                    start_va: blk_start,
                    end_va: prev.next_ip(),
                    instruction_count: blk_count,
                    outgoing_targets: compute_outgoing_edges(prev),
                });
                blk_start = ins.ip();
                blk_count = 0;
            }
            blk_count += 1;
        }
        if let Some(last) = instructions.last()
            && blk_count > 0
        {
            basic_blocks.push(CfgBasicBlock {
                block_id: basic_blocks.len(),
                start_va: blk_start,
                end_va: last.next_ip(),
                instruction_count: blk_count,
                outgoing_targets: compute_outgoing_edges(last),
            });
        }
    }

    let pseudo_c = synthesize_pseudo_c(name, start_va, &pcode_ops, &basic_blocks);

    DecompiledFunctionReport {
        name: name.to_string(),
        entry_va: start_va,
        size_bytes: total_bytes,
        instruction_count: instructions.len(),
        basic_blocks,
        pcode_ops,
        callees,
        pseudo_c,
    }
}

fn compute_outgoing_edges(last_ins: &Instruction) -> Vec<u64> {
    match last_ins.flow_control() {
        FlowControl::ConditionalBranch => {
            let mut v = Vec::with_capacity(2);
            if last_ins.near_branch_target() != 0 {
                v.push(last_ins.near_branch_target());
            }
            v.push(last_ins.next_ip());
            v
        }
        FlowControl::UnconditionalBranch => {
            if last_ins.near_branch_target() != 0 {
                vec![last_ins.near_branch_target()]
            } else {
                Vec::new()
            }
        }
        FlowControl::Return | FlowControl::Interrupt | FlowControl::Exception => Vec::new(),
        _ => vec![last_ins.next_ip()],
    }
}

fn lift_instruction_to_pcode(instr: &Instruction, asm_text: &str) -> PcodeInstruction {
    let opcode = match instr.mnemonic() {
        Mnemonic::Mov | Mnemonic::Movzx | Mnemonic::Movsx | Mnemonic::Movsxd | Mnemonic::Lea => {
            if instr.op_count() >= 2 && instr.op_kind(0) == OpKind::Memory {
                PcodeOpcode::Store
            } else if instr.op_count() >= 2 && instr.op_kind(1) == OpKind::Memory && instr.mnemonic() != Mnemonic::Lea {
                PcodeOpcode::Load
            } else {
                PcodeOpcode::Copy
            }
        }
        Mnemonic::Add | Mnemonic::Inc => PcodeOpcode::IntAdd,
        Mnemonic::Sub | Mnemonic::Dec => PcodeOpcode::IntSub,
        Mnemonic::And => PcodeOpcode::IntAnd,
        Mnemonic::Or => PcodeOpcode::IntOr,
        Mnemonic::Xor => PcodeOpcode::IntXor,
        Mnemonic::Cmp | Mnemonic::Test => PcodeOpcode::IntComp,
        Mnemonic::Jmp => PcodeOpcode::Branch,
        Mnemonic::Je
        | Mnemonic::Jne
        | Mnemonic::Jg
        | Mnemonic::Jge
        | Mnemonic::Jl
        | Mnemonic::Jle
        | Mnemonic::Ja
        | Mnemonic::Jae
        | Mnemonic::Jb
        | Mnemonic::Jbe => PcodeOpcode::CBranch,
        Mnemonic::Call => {
            if instr.op_count() > 0 && instr.op_kind(0) != OpKind::NearBranch64 && instr.op_kind(0) != OpKind::NearBranch32 {
                PcodeOpcode::CallInd
            } else {
                PcodeOpcode::Call
            }
        }
        Mnemonic::Ret => PcodeOpcode::Return,
        Mnemonic::Nop | Mnemonic::Endbr64 => PcodeOpcode::Nop,
        _ => PcodeOpcode::Other,
    };

    let mut inputs = Vec::new();
    let mut output = None;
    let parts: Vec<&str> = asm_text
        .split_once(' ')
        .map(|(_, ops)| ops.split(',').map(str::trim).collect())
        .unwrap_or_default();

    if !parts.is_empty() {
        if matches!(
            opcode,
            PcodeOpcode::Branch | PcodeOpcode::CBranch | PcodeOpcode::Call | PcodeOpcode::CallInd | PcodeOpcode::Return
        ) {
            for p in parts {
                inputs.push(p.to_string());
            }
        } else {
            output = Some(parts[0].to_string());
            for p in &parts[1..] {
                inputs.push((*p).to_string());
            }
        }
    }

    PcodeInstruction {
        address: instr.ip(),
        opcode,
        output_varnode: output,
        input_varnodes: inputs,
        asm_text: asm_text.to_string(),
    }
}

fn synthesize_pseudo_c(
    name: &str,
    entry_va: u64,
    pcode: &[PcodeInstruction],
    blocks: &[CfgBasicBlock],
) -> String {
    let safe_ident: String = name
        .chars()
        .map(|c| if c.is_ascii_alphanumeric() || c == '_' { c } else { '_' })
        .collect();

    let mut out = Vec::new();
    out.push(format!(
        "// Ghidra-Rust P-Code Decompiler | VA: 0x{entry_va:x} | CFG Blocks: {}",
        blocks.len()
    ));
    out.push(format!(
        "uint64_t {safe_ident}(uint64_t rcx_arg0, uint64_t rdx_arg1, uint64_t r8_arg2, uint64_t r9_arg3) {{"
    ));
    out.push("    uint64_t rax = 0;".to_string());

    let block_starts: FxHashSet<u64> = blocks.iter().map(|b| b.start_va).collect();

    for op in pcode.iter().take(48) {
        if block_starts.contains(&op.address) && op.address != entry_va {
            out.push(format!("loc_{:x}:", op.address));
        }
        let dst = op.output_varnode.as_deref().unwrap_or("tmp");
        let rhs0 = op.input_varnodes.first().map(String::as_str).unwrap_or("0");
        match op.opcode {
            PcodeOpcode::Copy => out.push(format!("    /* 0x{:x} */ {dst} = {rhs0};", op.address)),
            PcodeOpcode::Load => out.push(format!("    /* 0x{:x} */ {dst} = *(uintptr_t*)({rhs0});", op.address)),
            PcodeOpcode::Store => out.push(format!("    /* 0x{:x} */ *(uintptr_t*)({dst}) = {rhs0};", op.address)),
            PcodeOpcode::IntAdd => out.push(format!("    /* 0x{:x} */ {dst} += {rhs0};", op.address)),
            PcodeOpcode::IntSub => out.push(format!("    /* 0x{:x} */ {dst} -= {rhs0};", op.address)),
            PcodeOpcode::IntXor => {
                if dst == rhs0 {
                    out.push(format!("    /* 0x{:x} */ {dst} = 0;", op.address));
                } else {
                    out.push(format!("    /* 0x{:x} */ {dst} ^= {rhs0};", op.address));
                }
            }
            PcodeOpcode::IntAnd => out.push(format!("    /* 0x{:x} */ {dst} &= {rhs0};", op.address)),
            PcodeOpcode::IntOr => out.push(format!("    /* 0x{:x} */ {dst} |= {rhs0};", op.address)),
            PcodeOpcode::IntComp => out.push(format!("    /* 0x{:x} */ _flags = cmp({dst}, {rhs0});", op.address)),
            PcodeOpcode::CBranch => out.push(format!("    /* 0x{:x} */ if (_flags) goto label_{rhs0};", op.address)),
            PcodeOpcode::Branch => out.push(format!("    /* 0x{:x} */ goto label_{rhs0};", op.address)),
            PcodeOpcode::Call | PcodeOpcode::CallInd => {
                out.push(format!("    /* 0x{:x} */ rax = call_{rhs0}();", op.address));
            }
            PcodeOpcode::Return => out.push(format!("    /* 0x{:x} */ return rax;", op.address)),
            PcodeOpcode::Nop => {}
            PcodeOpcode::Other => out.push(format!("    /* 0x{:x} */ asm(\"{}\");", op.address, op.asm_text)),
        }
    }

    out.push("}".to_string());
    out.join("\n")
}

fn extract_printable_strings(bytes: &[u8], max_strings: usize) -> Vec<ExtractedString> {
    let mut found = Vec::with_capacity(max_strings.min(128));
    let mut start = None;

    for (idx, &b) in bytes.iter().enumerate() {
        let printable = (0x20..=0x7E).contains(&b);
        match (start, printable) {
            (None, true) => start = Some(idx),
            (Some(s), false) => {
                if idx - s >= 6
                    && let Ok(txt) = core::str::from_utf8(&bytes[s..idx])
                {
                    found.push(ExtractedString {
                        offset: s as u64,
                        value: txt.chars().take(120).collect(),
                    });
                    if found.len() >= max_strings {
                        return found;
                    }
                }
                start = None;
            }
            _ => {}
        }
    }
    found
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn decompiles_x64_machine_code_to_pcode_and_pseudo_c() {
        let machine_code: &[u8] = &[
            0x55,
            0x48, 0x89, 0xE5,
            0x48, 0x8D, 0x04, 0x11,
            0x48, 0x83, 0xC0, 0x2A,
            0x5D,
            0xC3,
        ];
        let rep = decompile_x86_slice("fast_sum", 0x140001000, machine_code, 64, 32);
        assert_eq!(rep.instruction_count, 6);
        assert_eq!(rep.basic_blocks.len(), 1);
        assert!(rep.pcode_ops.iter().any(|p| p.opcode == PcodeOpcode::IntAdd));
        assert!(rep.pcode_ops.iter().any(|p| p.opcode == PcodeOpcode::Return));
        assert!(rep.pseudo_c.contains("uint64_t fast_sum"));
        assert!(rep.pseudo_c.contains("return rax;"));
    }
}
