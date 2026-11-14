// SPDX-License-Identifier: Apache-2.0 OR MIT
//! LLVM + Rust + Bun AOT/LTO compiler & IR analyzer (`clang`/`clang++`, `lld-link`, `rustc --emit=llvm-ir`, `bun:ffi`).

#![forbid(unsafe_code)]

use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Path, PathBuf};
use std::process::Command;
use std::time::Instant;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LlvmToolchainStatus {
    pub llvm_vendor_submodule: String,
    pub clang_path: Option<String>,
    pub clang_version: String,
    pub lld_link_path: Option<String>,
    pub llvm_objdump_path: Option<String>,
    pub llvm_nm_path: Option<String>,
    pub rustc_version: String,
    pub bun_version: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LlvmIrFunctionSummary {
    pub name: String,
    pub instruction_count: usize,
    pub basic_block_count: usize,
    pub has_vector_simd: bool,
    pub attributes: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LlvmIrAnalysisReport {
    pub source_file: String,
    pub target_triple: String,
    pub data_layout: String,
    pub total_functions: usize,
    pub total_ir_instructions: usize,
    pub simd_vectorized_functions: usize,
    pub functions: Vec<LlvmIrFunctionSummary>,
    pub generated_bun_ffi_dts: String,
    pub elapsed_ms: f64,
}

fn find_llvm_tool(exe_name: &str) -> Option<PathBuf> {
    let default_win = PathBuf::from(r"C:\Program Files\LLVM\bin").join(exe_name);
    if default_win.exists() {
        return Some(default_win);
    }
    if let Ok(path_var) = std::env::var("PATH") {
        for dir in std::env::split_paths(&path_var) {
            let candidate = dir.join(exe_name);
            if candidate.exists() {
                return Some(candidate);
            }
        }
    }
    None
}

fn cmd_first_line(program: &Path, args: &[&str]) -> String {
    Command::new(program)
        .args(args)
        .output()
        .ok()
        .and_then(|o| String::from_utf8(o.stdout).ok())
        .and_then(|s| s.lines().next().map(|l| l.trim().to_string()))
        .unwrap_or_else(|| "unavailable".to_string())
}

pub fn probe_llvm_rust_bun_toolchain(vendor_llvm_dir: &Path) -> LlvmToolchainStatus {
    let clang = find_llvm_tool("clang.exe").or_else(|| find_llvm_tool("clang"));
    let lld_link = find_llvm_tool("lld-link.exe").or_else(|| find_llvm_tool("ld.lld"));
    let objdump = find_llvm_tool("llvm-objdump.exe").or_else(|| find_llvm_tool("llvm-objdump"));
    let nm = find_llvm_tool("llvm-nm.exe").or_else(|| find_llvm_tool("llvm-nm"));

    let clang_version = clang
        .as_deref()
        .map(|p| cmd_first_line(p, &["--version"]))
        .unwrap_or_else(|| "unavailable".to_string());

    let rustc_version = Command::new("rustc")
        .arg("--version")
        .output()
        .ok()
        .and_then(|o| String::from_utf8(o.stdout).ok())
        .map(|s| s.trim().to_string())
        .unwrap_or_else(|| "unavailable".to_string());

    let bun_version = Command::new("bun")
        .arg("--version")
        .output()
        .ok()
        .and_then(|o| String::from_utf8(o.stdout).ok())
        .map(|s| s.trim().to_string())
        .unwrap_or_else(|| "unavailable".to_string());

    LlvmToolchainStatus {
        llvm_vendor_submodule: vendor_llvm_dir.to_string_lossy().replace('\\', "/"),
        clang_path: clang.map(|p| p.to_string_lossy().replace('\\', "/")),
        clang_version,
        lld_link_path: lld_link.map(|p| p.to_string_lossy().replace('\\', "/")),
        llvm_objdump_path: objdump.map(|p| p.to_string_lossy().replace('\\', "/")),
        llvm_nm_path: nm.map(|p| p.to_string_lossy().replace('\\', "/")),
        rustc_version,
        bun_version,
    }
}

/// Compiles C, C++, or Rust source to `-O3 -mavx2` LLVM IR (`.ll`) and parses functions/SIMD/FFI.
pub fn compile_and_analyze_llvm_ir(source_path: &Path, out_ll_path: Option<&Path>) -> Result<LlvmIrAnalysisReport, String> {
    if !source_path.exists() {
        return Err(format!("LLVM input file not found: {}", source_path.display()));
    }

    let t0 = Instant::now();
    let ext = source_path
        .extension()
        .and_then(|e| e.to_str())
        .unwrap_or("")
        .to_ascii_lowercase();

    let ir_text = if ext == "ll" {
        fs::read_to_string(source_path).map_err(|e| format!("read {}: {e}", source_path.display()))?
    } else {
        let tmp_ll = out_ll_path
            .map(PathBuf::from)
            .unwrap_or_else(|| std::env::temp_dir().join("depot_emitted.ll"));

        if ext == "rs" {
            let out = Command::new("rustc")
                .args([
                    "--edition=2024",
                    "--crate-type=cdylib",
                    "-C",
                    "opt-level=3",
                    "-C",
                    "target-cpu=x86-64-v3",
                    "-C",
                    "panic=abort",
                    "--emit=llvm-ir",
                    "-o",
                ])
                .arg(&tmp_ll)
                .arg(source_path)
                .output()
                .map_err(|e| format!("rustc: {e}"))?;
            if !out.status.success() {
                return Err(format!("rustc --emit=llvm-ir failed: {}", String::from_utf8_lossy(&out.stderr)));
            }
        } else if matches!(ext.as_str(), "c" | "cc" | "cpp" | "cxx") {
            let clang_exe = if ext == "c" {
                find_llvm_tool("clang.exe").or_else(|| find_llvm_tool("clang"))
            } else {
                find_llvm_tool("clang++.exe").or_else(|| find_llvm_tool("clang++"))
            }
            .ok_or_else(|| "clang not found on host".to_string())?;

            let mut cmd = Command::new(clang_exe);
            cmd.args(["-S", "-emit-llvm", "-O3", "-mavx2", "-mfma"]);
            if ext != "c" {
                cmd.arg("-std=c++23");
            }
            cmd.arg(source_path).arg("-o").arg(&tmp_ll);
            let out = cmd.output().map_err(|e| format!("clang: {e}"))?;
            if !out.status.success() {
                return Err(format!("clang -emit-llvm failed: {}", String::from_utf8_lossy(&out.stderr)));
            }
        } else {
            return Err(format!("unsupported source extension for LLVM IR pipeline: .{ext}"));
        }

        fs::read_to_string(&tmp_ll).map_err(|e| format!("read {}: {e}", tmp_ll.display()))?
    };

    let mut report = parse_llvm_ir_text(&ir_text, &source_path.to_string_lossy().replace('\\', "/"));
    report.elapsed_ms = t0.elapsed().as_secs_f64() * 1000.0;
    Ok(report)
}

/// Parses textual LLVM IR (`.ll`) capturing module layout, functions, blocks, SIMD, and `bun:ffi` stubs.
pub fn parse_llvm_ir_text(ir_text: &str, source_label: &str) -> LlvmIrAnalysisReport {
    let mut target_triple = String::new();
    let mut data_layout = String::new();
    let mut functions = Vec::new();
    let mut total_ir_instructions = 0usize;
    let mut current_fn: Option<LlvmIrFunctionSummary> = None;

    for raw_line in ir_text.lines() {
        let line = raw_line.trim();
        if line.is_empty() || line.starts_with(';') {
            continue;
        }
        if let Some(rest) = line.strip_prefix("target triple = ") {
            target_triple = rest.trim_matches('"').to_string();
            continue;
        }
        if let Some(rest) = line.strip_prefix("target datalayout = ") {
            data_layout = rest.trim_matches('"').to_string();
            continue;
        }
        if line.starts_with("define ") {
            if let Some(prev) = current_fn.take() {
                functions.push(prev);
            }
            let fn_name = extract_llvm_symbol_name(line);
            let mut attrs = Vec::new();
            for marker in ["nounwind", "WillReturn", "willreturn", "alwaysinline", "noinline", "cold"] {
                if line.contains(marker) {
                    attrs.push(marker.to_string());
                }
            }
            current_fn = Some(LlvmIrFunctionSummary {
                name: fn_name,
                instruction_count: 0,
                basic_block_count: 0,
                has_vector_simd: false,
                attributes: attrs,
            });
            continue;
        }
        if line == "}" {
            if let Some(mut done) = current_fn.take() {
                if done.basic_block_count == 0 && done.instruction_count > 0 {
                    done.basic_block_count = 1;
                }
                functions.push(done);
            }
            continue;
        }
        if let Some(ref mut f) = current_fn {
            if line.ends_with(':') && !line.contains(' ') {
                f.basic_block_count += 1;
            } else {
                f.instruction_count += 1;
                total_ir_instructions += 1;
                if (line.contains('<') && line.contains(" x ") && line.contains('>'))
                    || line.contains("llvm.fma.")
                    || line.contains("llvm.x86.avx2")
                {
                    f.has_vector_simd = true;
                }
            }
        }
    }

    if let Some(last) = current_fn.take() {
        functions.push(last);
    }

    let simd_vectorized_functions = functions.iter().filter(|f| f.has_vector_simd).count();
    let generated_bun_ffi_dts = render_bun_ffi_stub(&functions);

    LlvmIrAnalysisReport {
        source_file: source_label.to_string(),
        target_triple,
        data_layout,
        total_functions: functions.len(),
        total_ir_instructions,
        simd_vectorized_functions,
        functions,
        generated_bun_ffi_dts,
        elapsed_ms: 0.0,
    }
}

fn extract_llvm_symbol_name(define_line: &str) -> String {
    if let Some(at_pos) = define_line.find('@') {
        let after = &define_line[at_pos + 1..];
        if let Some(open_paren) = after.find('(') {
            return after[..open_paren].trim_matches('"').to_string();
        }
    }
    "<unknown_fn>".to_string()
}

fn render_bun_ffi_stub(functions: &[LlvmIrFunctionSummary]) -> String {
    let mut lines = vec![
        "// Auto-generated by depot-migrate::llvm (Bun C-ABI FFI Bridge)".to_string(),
        "import { dlopen, FFIType, suffix } from \"bun:ffi\";".to_string(),
        String::new(),
        "export function openNativeKernel(libBasePath: string) {".to_string(),
        "  return dlopen(`${libBasePath}.${suffix}`, {".to_string(),
    ];
    for f in functions.iter().take(32) {
        if !f.name.starts_with("_ZN") {
            lines.push(format!(
                "    \"{}\": {{ args: [FFIType.ptr, FFIType.u64], returns: FFIType.u64 }},",
                f.name
            ));
        }
    }
    lines.push("  });".to_string());
    lines.push("}".to_string());
    lines.join("\n")
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parses_llvm_ir_and_detects_avx2_vectors() {
        let sample_ir = r#"
target datalayout = "e-m:w-p270:32:32-p271:32:32-i64:64-f80:128-n8:16:32:64-S128"
target triple = "x86_64-pc-windows-msvc"

define dso_local noundef i64 @tick_simd(ptr nocapture readonly %0, i64 %1) unnamed_addr #0 nounwind willreturn {
start:
  %2 = load <8 x float>, ptr %0, align 32
  %3 = fadd <8 x float> %2, %2
  br label %exit
exit:
  ret i64 %1
}
"#;
        let rep = parse_llvm_ir_text(sample_ir, "kernel.rs");
        assert_eq!(rep.target_triple, "x86_64-pc-windows-msvc");
        assert_eq!(rep.total_functions, 1);
        assert_eq!(rep.simd_vectorized_functions, 1);
        assert_eq!(rep.functions[0].name, "tick_simd");
        assert_eq!(rep.functions[0].basic_block_count, 2);
        assert!(rep.generated_bun_ffi_dts.contains("tick_simd"));
    }
}
