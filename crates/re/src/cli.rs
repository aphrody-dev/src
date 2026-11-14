// SPDX-License-Identifier: Apache-2.0 OR MIT
//! CLI entrypoints for `ay re` (binary triage, Ghidra P-Code/Pseudo-C, MinGW CRT filter,
//! and Lua 5.2 bytecode disassembly/transcoding).

use std::path::{Path, PathBuf};

use crate::{
    LuaPrototypeAudit, ReEngine, SreAnalyzeOptions, analyze_binary_file, audit_lua52_bytecode,
    transcode_lua52_bytecode,
};

const USAGE: &str = "Usage:
  ay re [--ghidra] [--json] <binary>
  ay re lua disasm <file.luac> [--json]
  ay re lua transcode <input.luac> -o <output.luac> [--arch wasm32|x64]";

/// Run `ay re <args...>` and return a process exit code.
pub fn run(args: &[String]) -> i32 {
    if args.is_empty() || matches!(args[0].as_str(), "-h" | "--help" | "help") {
        println!("{USAGE}");
        return 0;
    }

    if args[0] == "lua" {
        return match run_lua_sub(&args[1..]) {
            Ok(()) => 0,
            Err(e) => {
                eprintln!("[ERROR] {e}");
                1
            }
        };
    }

    let mut ghidra = false;
    let mut json = false;
    let mut binary: Option<PathBuf> = None;

    for arg in args {
        match arg.as_str() {
            "--ghidra" => ghidra = true,
            "--json" | "-j" => json = true,
            "-h" | "--help" => {
                println!("{USAGE}");
                return 0;
            }
            s if s.starts_with('-') => {
                eprintln!("ay re: unknown option '{s}'\n{USAGE}");
                return 2;
            }
            path => {
                if binary.is_some() {
                    eprintln!("ay re: unexpected argument '{path}'\n{USAGE}");
                    return 2;
                }
                binary = Some(PathBuf::from(path));
            }
        }
    }

    let Some(path) = binary else {
        eprintln!("ay re: missing <binary>\n{USAGE}");
        return 2;
    };

    match execute_re(&path, ghidra, json) {
        Ok(()) => 0,
        Err(e) => {
            eprintln!("[ERROR] {e}");
            1
        }
    }
}

fn run_lua_sub(args: &[String]) -> Result<(), String> {
    let Some((sub, rest)) = args.split_first() else {
        return Err(USAGE.to_string());
    };
    match sub.as_str() {
        "disasm" => {
            let mut json = false;
            let mut file: Option<PathBuf> = None;
            for arg in rest {
                match arg.as_str() {
                    "--json" | "-j" => json = true,
                    s if !s.starts_with('-') && file.is_none() => file = Some(PathBuf::from(s)),
                    other => return Err(format!("unknown argument for `ay re lua disasm`: {other}")),
                }
            }
            let file = file.ok_or_else(|| "missing <file.luac>".to_string())?;
            run_lua_disasm(&file, json)
        }
        "transcode" => {
            let mut input: Option<PathBuf> = None;
            let mut output: Option<PathBuf> = None;
            let mut arch = "wasm32".to_string();
            let mut i = 0;
            while i < rest.len() {
                match rest[i].as_str() {
                    "-o" | "--output" => {
                        i += 1;
                        output = rest.get(i).map(PathBuf::from);
                    }
                    "-a" | "--arch" => {
                        i += 1;
                        arch = rest.get(i).cloned().unwrap_or_else(|| "wasm32".to_string());
                    }
                    s if !s.starts_with('-') && input.is_none() => input = Some(PathBuf::from(s)),
                    other => return Err(format!("unknown argument for `ay re lua transcode`: {other}")),
                }
                i += 1;
            }
            let input = input.ok_or_else(|| "missing <input.luac>".to_string())?;
            let output = output.ok_or_else(|| "missing -o <output.luac>".to_string())?;
            run_lua_transcode(&input, &output, &arch)
        }
        other => Err(format!("unknown `ay re lua` subcommand '{other}'")),
    }
}

pub fn execute_re(binary_path: &Path, ghidra: bool, output_json: bool) -> Result<(), String> {
    if ghidra {
        let rep = analyze_binary_file(binary_path, &SreAnalyzeOptions::default())?;
        if output_json {
            println!("{}", serde_json::to_string_pretty(&rep).unwrap_or_default());
        } else {
            println!("--- Aphrody Ghidra-Rust SRE: {} ---", binary_path.display());
            println!(
                "  Format: {:?} | Functions: {} | Strings: {}",
                rep.format,
                rep.decompiled_functions.len(),
                rep.strings_sample.len()
            );
            for f in rep.decompiled_functions.iter().take(4) {
                println!(
                    "  fn {} @ 0x{:X} ({} insns, {} blocks)",
                    f.name,
                    f.entry_va,
                    f.instruction_count,
                    f.basic_blocks.len()
                );
                println!("{}", f.pseudo_c);
            }
        }
        return Ok(());
    }

    let audit = ReEngine::audit_file(binary_path)?;
    if output_json {
        println!("{}", serde_json::to_string_pretty(&audit).unwrap_or_default());
        return Ok(());
    }

    println!("--- Aphrody RE Engine: {} ---", binary_path.display());
    if audit.is_lua_bytecode {
        if let Some(lua) = &audit.lua_bytecode {
            println!("  Binary Type: Lua 5.2 Compiled Bytecode");
            println!(
                "  Version: {} (official: {}, endian: {})",
                lua.header.version,
                lua.header.is_official_format,
                if lua.header.is_little_endian { "little" } else { "big" }
            );
            println!(
                "  Prototypes: {} | Total Instructions: {}",
                lua.total_prototypes, lua.total_instructions
            );
            print_lua_proto(&lua.main_prototype, "main", 0);
        }
        return Ok(());
    }

    if let Some(format) = &audit.format {
        println!("  Format: {} (64-bit: {})", format.format, format.is_64_bit);
        println!("  Entry point: 0x{:X}", format.entry_point);
        println!("  Sections: {} found", format.sections.len());
        for s in format.sections.iter().take(6) {
            println!("    {:12} addr: 0x{:08X} size: {:>8} bytes", s.name, s.virtual_address, s.size);
        }
        println!("  Exports: {} | Imports: {}", format.exports.len(), format.imports.len());
        println!("  REA Markers: dwarf={} rea_sig={}", format.has_dwarf_debug, format.has_rea_marker);
    }

    if let Some(noise) = &audit.noise_filter {
        println!(
            "  MinGW CRT Filter: total={} noise={} payload={} ({:.1}%)",
            noise.total_symbols,
            noise.noise_symbols_count,
            noise.payload_symbols_count,
            noise.noise_reduction_ratio * 100.0
        );
    }

    if !audit.entry_disassembly.is_empty() {
        println!("--- Entry Point Disassembly (iced-x86) ---");
        for instr in audit.entry_disassembly.iter().take(8) {
            println!("    0x{:08X}: {}", instr.ip, instr.formatted);
        }
    }

    Ok(())
}

pub fn run_lua_disasm(file: &Path, output_json: bool) -> Result<(), String> {
    let bytes = std::fs::read(file).map_err(|e| format!("cannot read {}: {e}", file.display()))?;
    let audit = audit_lua52_bytecode(&bytes)?;
    if output_json {
        println!("{}", serde_json::to_string_pretty(&audit).unwrap_or_default());
        return Ok(());
    }
    println!("--- Lua 5.2 Bytecode Disassembly: {} ---", file.display());
    println!(
        "  Header: Lua {} | endian={} | int={}B | size_t={}B | instr={}B | num={}B",
        audit.header.version,
        if audit.header.is_little_endian { "LE" } else { "BE" },
        audit.header.size_int,
        audit.header.size_size_t,
        audit.header.size_instruction,
        audit.header.size_lua_number
    );
    print_lua_proto(&audit.main_prototype, "main", 0);
    Ok(())
}

fn print_lua_proto(proto: &LuaPrototypeAudit, label: &str, depth: usize) {
    let pad = "  ".repeat(depth + 1);
    println!(
        "{pad}Prototype [{label}] lines {}..{} (params={}, stack={}, consts={})",
        proto.line_defined,
        proto.last_line_defined,
        proto.num_params,
        proto.max_stack_size,
        proto.constants.len()
    );
    for instr in &proto.instructions {
        println!("{pad}  [{:04}] {:10} {}", instr.pc, instr.opcode, instr.formatted);
    }
    for (idx, child) in proto.sub_prototypes.iter().enumerate() {
        print_lua_proto(child, &format!("{label}.{idx}"), depth + 1);
    }
}

pub fn run_lua_transcode(input: &Path, output: &Path, arch: &str) -> Result<(), String> {
    let (target_int, target_sizet) = match arch.to_ascii_lowercase().as_str() {
        "wasm32" | "x86" | "arm32" | "32" => (4u8, 4u8),
        "x64" | "x86_64" | "aarch64" | "64" => (4u8, 8u8),
        other => return Err(format!("unsupported target arch '{other}' (expected wasm32 or x64)")),
    };
    let bytes = std::fs::read(input).map_err(|e| format!("cannot read {}: {e}", input.display()))?;
    let transcoded = transcode_lua52_bytecode(&bytes, target_int, target_sizet)?;
    if let Some(parent) = output.parent()
        && !parent.as_os_str().is_empty()
    {
        std::fs::create_dir_all(parent).map_err(|e| format!("cannot create {}: {e}", parent.display()))?;
    }
    std::fs::write(output, &transcoded).map_err(|e| format!("cannot write {}: {e}", output.display()))?;
    println!(
        "[OK] Transcoded {} ({} B) -> {} ({} B, int={}B, size_t={}B [{arch}])",
        input.display(),
        bytes.len(),
        output.display(),
        transcoded.len(),
        target_int,
        target_sizet
    );
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn help_exits_zero() {
        assert_eq!(run(&["--help".into()]), 0);
        assert_eq!(run(&[]), 0);
    }
}
