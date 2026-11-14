// SPDX-License-Identifier: Apache-2.0 OR MIT
//! MinGW-w64 CRT noise filter + PE64 `.def` / `llvm-dlltool` / proxy DLL synthesizer.
//! Reuses `crate::rea::MINGW_CRT_NOISE_SYMBOLS` and `crate::ghidra` (single source of truth).

#![forbid(unsafe_code)]

use crate::ghidra::{DecompiledFunctionReport, SreAnalyzeOptions, analyze_binary_bytes};
use crate::rea::MINGW_CRT_NOISE_SYMBOLS;
use goblin::Object;
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;
use std::process::Command;
use std::time::Instant;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MingwReaDoctorReport {
    pub mingw_fork_path: String,
    pub mingw_fork_present: bool,
    pub rea_intrinsics_header: String,
    pub clang_path: String,
    pub llvm_dlltool_path: String,
    pub lld_link_path: String,
    pub toolchain_ready: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MingwReaBinaryAudit {
    pub binary_path: String,
    pub toolchain_attribution: String,
    pub has_rea_beacon: bool,
    pub rea_beacon_tag: Option<String>,
    pub has_dwarf_sections: bool,
    pub has_mingw_pseudo_reloc_markers: bool,
    pub total_exports: usize,
    pub crt_boilerplate_filtered: Vec<String>,
    pub clean_payload_functions: Vec<DecompiledFunctionReport>,
    pub noise_reduction_ratio: f64,
    pub elapsed_ms: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProxyDllSynthesisReport {
    pub source_dll: String,
    pub exported_symbol_count: usize,
    pub generated_def_path: String,
    pub generated_import_lib_path: String,
    pub generated_shim_c_path: String,
    pub compiled_proxy_dll_path: String,
    pub compiled_proxy_dll_size_bytes: u64,
    pub rea_audit: MingwReaBinaryAudit,
    pub elapsed_ms: f64,
}

/// Checks MinGW-w64 REA headers and LLVM PE tools (`clang`, `llvm-dlltool`, `lld-link`).
pub fn probe_mingw_rea_environment(repo_root: &Path) -> Result<MingwReaDoctorReport, String> {
    let fork_dir = ["third_party/mingw-w64-rea", "third_party/mingw-w64"]
        .iter()
        .map(|p| repo_root.join(p))
        .find(|p| p.exists())
        .unwrap_or_else(|| repo_root.join("third_party/mingw-w64-rea"));
    let intrinsics_hdr = fork_dir
        .join("mingw-w64-headers")
        .join("include")
        .join("rea_mingw_intrinsics.h");

    let clang = resolve_tool(&["C:/Program Files/LLVM/bin/clang.exe", "clang"]);
    let dlltool = resolve_tool(&["C:/Program Files/LLVM/bin/llvm-dlltool.exe", "llvm-dlltool"]);
    let lld_link = resolve_tool(&["C:/Program Files/LLVM/bin/lld-link.exe", "lld-link"]);

    let ready = fork_dir.exists() && Path::new(&clang).exists() && Path::new(&dlltool).exists();

    Ok(MingwReaDoctorReport {
        mingw_fork_path: fork_dir.to_string_lossy().replace('\\', "/"),
        mingw_fork_present: fork_dir.exists(),
        rea_intrinsics_header: intrinsics_hdr.to_string_lossy().replace('\\', "/"),
        clang_path: clang.replace('\\', "/"),
        llvm_dlltool_path: dlltool.replace('\\', "/"),
        lld_link_path: lld_link.replace('\\', "/"),
        toolchain_ready: ready,
    })
}

/// Runs `crate::ghidra` + MinGW-w64 CRT signature stripping and `.rea_sig` / pseudo-reloc attribution.
pub fn analyze_pe_mingw_rea(binary_path: &Path, max_functions: usize) -> Result<MingwReaBinaryAudit, String> {
    let t0 = Instant::now();
    let bytes = fs::read(binary_path).map_err(|e| format!("cannot read {}: {e}", binary_path.display()))?;

    let sre = analyze_binary_bytes(
        &binary_path.to_string_lossy().replace('\\', "/"),
        &bytes,
        &SreAnalyzeOptions {
            max_functions: max_functions.max(16),
            max_instructions_per_fn: 96,
            max_strings: 200,
        },
    )?;

    let has_rea_section = sre.sections.iter().any(|s| s.name == ".rea_sig");
    let beacon_str = extract_rea_beacon(&bytes);
    let has_dwarf = sre
        .sections
        .iter()
        .any(|s| s.name.starts_with(".debug") || s.name == ".eh_frame" || s.name.starts_with('/'));

    let has_pseudo_reloc = sre.strings_sample.iter().any(|s| {
        s.value.contains(" Mingw-w64 runtime failure")
            || s.value.contains("pseudo relocation")
            || s.value.contains("_pei386_runtime_relocator")
    }) || bytes
        .windows(b"Mingw-w64".len())
        .any(|w| w.eq_ignore_ascii_case(b"Mingw-w64"));

    let attribution = if has_rea_section || beacon_str.is_some() {
        "mingw-w64-rea-fork"
    } else if has_pseudo_reloc || has_dwarf {
        "mingw-w64-gcc-or-clang-gnu"
    } else {
        "msvc-or-rust-lld-pe64"
    };

    let mut filtered_noise = Vec::new();
    let mut clean_payload = Vec::new();
    for f in sre.decompiled_functions {
        if is_mingw_crt_or_thunk(&f) {
            filtered_noise.push(f.name);
        } else {
            clean_payload.push(f);
        }
    }

    let total_seen = filtered_noise.len() + clean_payload.len();
    let ratio = if total_seen > 0 {
        (filtered_noise.len() as f64) / (total_seen as f64)
    } else {
        0.0
    };

    Ok(MingwReaBinaryAudit {
        binary_path: sre.binary_path,
        toolchain_attribution: attribution.to_string(),
        has_rea_beacon: has_rea_section || beacon_str.is_some(),
        rea_beacon_tag: beacon_str,
        has_dwarf_sections: has_dwarf,
        has_mingw_pseudo_reloc_markers: has_pseudo_reloc,
        total_exports: sre.exports.len(),
        crt_boilerplate_filtered: filtered_noise,
        clean_payload_functions: clean_payload,
        noise_reduction_ratio: ratio,
        elapsed_ms: t0.elapsed().as_secs_f64() * 1000.0,
    })
}

/// Extracts PE64 `.dll` exports into `.def`, `.lib` (`llvm-dlltool`), and a freestanding C proxy DLL.
pub fn synthesize_proxy_hook_dll(
    repo_root: &Path,
    source_dll: &Path,
    out_dir: &Path,
) -> Result<ProxyDllSynthesisReport, String> {
    let t0 = Instant::now();
    let bytes = fs::read(source_dll).map_err(|e| format!("cannot read {}: {e}", source_dll.display()))?;

    let mut export_names = Vec::new();
    match Object::parse(&bytes) {
        Ok(Object::PE(pe)) => {
            for exp in &pe.exports {
                if let Some(name) = exp.name
                    && !name.is_empty()
                    && name.chars().all(|c| c.is_ascii_alphanumeric() || c == '_')
                {
                    export_names.push(name.to_string());
                }
            }
        }
        _ => return Err(format!("{} is not a valid PE DLL", source_dll.display())),
    }

    fs::create_dir_all(out_dir).map_err(|e| format!("mkdir {}: {e}", out_dir.display()))?;

    let stem = source_dll.file_stem().and_then(|s| s.to_str()).unwrap_or("target");
    let proxy_stem = format!("{stem}_rea_proxy");

    let def_path = out_dir.join(format!("{proxy_stem}.def"));
    let mut def_lines = vec![
        format!("LIBRARY \"{proxy_stem}.dll\""),
        "EXPORTS".to_string(),
        "  rea_record_hook_invocation".to_string(),
        "  rea_query_attach_count".to_string(),
    ];
    for exp in &export_names {
        def_lines.push(format!("  rea_hook_{exp}"));
    }
    fs::write(&def_path, def_lines.join("\n") + "\n")
        .map_err(|e| format!("write {}: {e}", def_path.display()))?;

    let import_lib_path = out_dir.join(format!("{proxy_stem}.lib"));
    let dlltool = resolve_tool(&["C:/Program Files/LLVM/bin/llvm-dlltool.exe", "llvm-dlltool"]);
    let dt_status = Command::new(&dlltool)
        .args(["-m", "i386:x86-64", "-d", &def_path.to_string_lossy(), "-l", &import_lib_path.to_string_lossy()])
        .output()
        .map_err(|e| format!("llvm-dlltool: {e}"))?;
    if !dt_status.status.success() {
        return Err(format!("llvm-dlltool failed: {}", String::from_utf8_lossy(&dt_status.stderr)));
    }

    let fork_root = repo_root.join("third_party").join("mingw-w64-rea");
    let fork_inc = fork_root.join("mingw-w64-headers").join("include");
    let fork_crt_c = fork_root.join("mingw-w64-crt").join("rea").join("rea_pe_minimal_crt.c");

    let shim_c_path = out_dir.join(format!("{proxy_stem}_shim.c"));
    let mut c_lines = vec![
        "/* Auto-generated by aphrody-re::mingw */".to_string(),
        "#include <stdint.h>".to_string(),
        "#define REA_EXPORT __declspec(dllexport)".to_string(),
        String::new(),
        "extern void rea_record_hook_invocation(uint64_t arg0, uint64_t arg1);".to_string(),
        String::new(),
    ];
    if !fork_crt_c.exists() {
        c_lines.push("void rea_record_hook_invocation(uint64_t a, uint64_t b) { (void)a; (void)b; }".to_string());
    }
    for (idx, exp) in export_names.iter().enumerate() {
        c_lines.push(format!("REA_EXPORT uint64_t rea_hook_{exp}(uint64_t rcx0, uint64_t rdx1) {{"));
        c_lines.push("  rea_record_hook_invocation(rcx0, rdx1);".to_string());
        c_lines.push(format!("  return (rcx0 ^ rdx1) + 0x{:04x}ULL;", (idx + 1) * 0x11));
        c_lines.push("}".to_string());
    }
    fs::write(&shim_c_path, c_lines.join("\n") + "\n")
        .map_err(|e| format!("write {}: {e}", shim_c_path.display()))?;

    let out_dll_path = out_dir.join(format!("{proxy_stem}.dll"));
    let clang = resolve_tool(&["C:/Program Files/LLVM/bin/clang.exe", "clang"]);
    let mut args = vec![
        "--target=x86_64-pc-windows-msvc".to_string(),
        "-O2".to_string(),
        "-mno-stack-arg-probe".to_string(),
        "-fno-builtin".to_string(),
        "-shared".to_string(),
        "-fuse-ld=lld".to_string(),
    ];
    if fork_inc.exists() {
        args.push(format!("-I{}", fork_inc.to_string_lossy()));
    }
    if fork_crt_c.exists() {
        args.push(fork_crt_c.to_string_lossy().to_string());
    }
    args.extend([
        shim_c_path.to_string_lossy().to_string(),
        "-o".to_string(),
        out_dll_path.to_string_lossy().to_string(),
        "-Wl,/NODEFAULTLIB".to_string(),
        "-Wl,/NOENTRY".to_string(),
        "-Wl,/OPT:REF".to_string(),
    ]);

    let cc_out = Command::new(&clang).args(&args).output().map_err(|e| format!("clang proxy dll: {e}"))?;
    if !cc_out.status.success() {
        return Err(format!("clang PE64 proxy failed: {}", String::from_utf8_lossy(&cc_out.stderr)));
    }

    let dll_size = fs::metadata(&out_dll_path).map(|m| m.len()).unwrap_or(0);
    let rea_audit = analyze_pe_mingw_rea(&out_dll_path, 24)?;

    Ok(ProxyDllSynthesisReport {
        source_dll: source_dll.to_string_lossy().replace('\\', "/"),
        exported_symbol_count: export_names.len(),
        generated_def_path: def_path.to_string_lossy().replace('\\', "/"),
        generated_import_lib_path: import_lib_path.to_string_lossy().replace('\\', "/"),
        generated_shim_c_path: shim_c_path.to_string_lossy().replace('\\', "/"),
        compiled_proxy_dll_path: out_dll_path.to_string_lossy().replace('\\', "/"),
        compiled_proxy_dll_size_bytes: dll_size,
        rea_audit,
        elapsed_ms: t0.elapsed().as_secs_f64() * 1000.0,
    })
}

pub fn is_mingw_crt_or_thunk(fn_rep: &DecompiledFunctionReport) -> bool {
    let trimmed = fn_rep.name.trim_start_matches('_');
    if MINGW_CRT_NOISE_SYMBOLS.iter().any(|&sym| {
        sym == fn_rep.name || sym.trim_start_matches('_') == trimmed
    }) {
        return true;
    }
    fn_rep.instruction_count == 1
        && fn_rep
            .pcode_ops
            .first()
            .is_some_and(|op| op.asm_text.starts_with("jmp "))
}

fn extract_rea_beacon(bytes: &[u8]) -> Option<String> {
    let needle = b"REA_MINGW64_OPT::";
    let pos = bytes.windows(needle.len()).position(|w| w == needle)?;
    let start = pos + needle.len();
    let end = bytes[start..]
        .iter()
        .position(|&b| b == 0 || !(0x20..=0x7E).contains(&b))
        .map(|len| start + len)
        .unwrap_or(bytes.len());
    core::str::from_utf8(&bytes[start..end]).ok().map(ToString::to_string)
}

fn resolve_tool(candidates: &[&str]) -> String {
    for &c in candidates {
        if Path::new(c).exists() {
            return c.to_string();
        }
    }
    candidates.last().copied().unwrap_or("").to_string()
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::ghidra::decompile_x86_slice;

    #[test]
    fn recognizes_mingw_crt_startup_and_iat_thunks() {
        let crt_fn = decompile_x86_slice("__tmainCRTStartup", 0x140001000, &[0x55, 0x5D, 0xC3], 64, 16);
        assert!(is_mingw_crt_or_thunk(&crt_fn));

        let iat_thunk = decompile_x86_slice("sub_iat", 0x140001040, &[0xFF, 0x25, 0x00, 0x20, 0x00, 0x00], 64, 16);
        assert!(is_mingw_crt_or_thunk(&iat_thunk));

        let user_fn = decompile_x86_slice("rea_hook_compute", 0x140001080, &[0x48, 0x89, 0xC8, 0xC3], 64, 16);
        assert!(!is_mingw_crt_or_thunk(&user_fn));
    }
}
