// SPDX-License-Identifier: Apache-2.0 OR MIT
//! `n2b`: Sovereign Pure-Rust Node-to-Bun, Polyglot AST, LLVM IR, and Ghidra-Rust SRE CLI.
//! Uses Google `argh` zero-bloat argument parsing (`Rust-for-Chromium` / `depot` standard).

#![forbid(unsafe_code)]

use argh::FromArgs;
use n2b_core::sys::query_host_hardware;
use n2b_core::{MonorepoWalker, RipgrepEngine, ScanOptions};
use n2b_dotnet::{CoreClrHost, generate_dotnet_rust_bun_bindings, probe_dotnet_environment};
use n2b_ghidra::{SreAnalyzeOptions, analyze_binary_file};
use n2b_llvm::{compile_and_analyze_llvm_ir, probe_llvm_rust_bun_toolchain};
use n2b_migrate::{MigrateOptions, migrate_repository};
use n2b_mingw_rea::{
    analyze_pe_mingw_rea, probe_mingw_rea_environment, synthesize_proxy_hook_dll,
};
use n2b_polyglot::parse_polyglot_source;
use std::fs;
use std::io::Write;
use std::path::{Path, PathBuf};

/// n2b: Sovereign Rust + Bun Monorepo Transformer, Polyglot AST Engine, LLVM AOT & Ghidra-Rust SRE
#[derive(FromArgs, Debug)]
struct TopLevel {
    #[argh(subcommand)]
    cmd: SubCommand,
}

#[derive(FromArgs, Debug)]
#[argh(subcommand)]
enum SubCommand {
    Doctor(DoctorCmd),
    Scan(ScanCmd),
    Search(SearchCmd),
    Ast(AstCmd),
    Migrate(MigrateCmd),
    Llvm(LlvmCmd),
    Ghidra(GhidraCmd),
    Dotnet(DotnetCmd),
    Mingw(MingwCmd),
}

/// Inspect host hardware, LLVM/Rust/Bun toolchains, and read-only vendor submodules
#[derive(FromArgs, Debug)]
#[argh(subcommand, name = "doctor")]
struct DoctorCmd {
    /// root of n2b workspace (defaults to C:\src\n2b)
    #[argh(option, default = "String::from(\"C:/src/n2b\")")]
    root: String,
    /// emit JSON output
    #[argh(switch)]
    json: bool,
}

/// Scan a giant monorepo in parallel using Magika content signatures + ignore walker
#[derive(FromArgs, Debug)]
#[argh(subcommand, name = "scan")]
struct ScanCmd {
    /// target repository or directory path
    #[argh(positional)]
    path: String,
    /// maximum files to scan
    #[argh(option, default = "250000")]
    max_files: usize,
    /// compute blake3 digests for sample files
    #[argh(switch)]
    blake3: bool,
    /// emit JSON output
    #[argh(switch)]
    json: bool,
}

/// Search a monorepo using embedded BurntSushi ripgrep SIMD engine
#[derive(FromArgs, Debug)]
#[argh(subcommand, name = "search")]
struct SearchCmd {
    /// regex pattern to search
    #[argh(positional)]
    pattern: String,
    /// target directory path
    #[argh(positional)]
    path: String,
    /// maximum hits to return
    #[argh(option, default = "100")]
    max_hits: usize,
    /// emit JSON output
    #[argh(switch)]
    json: bool,
}

/// Parse any C, C++, Rust, TS, JS, Java, Python, Lua, C#, Go file with Tree-Sitter + Helix Rope + Magika
#[derive(FromArgs, Debug)]
#[argh(subcommand, name = "ast")]
struct AstCmd {
    /// source file path
    #[argh(positional)]
    file: String,
    /// emit JSON output
    #[argh(switch)]
    json: bool,
}

/// Transform an old-school Node/V8/Electron/VSCode/Discord/TS/UE project into Bun + Rust AOT/LTO
#[derive(FromArgs, Debug)]
#[argh(subcommand, name = "migrate")]
struct MigrateCmd {
    /// source repository path
    #[argh(positional)]
    source: String,
    /// optional output directory for transformed files (required when source is inside vendor/)
    #[argh(option)]
    out_dir: Option<String>,
    /// apply rewrites on disk (omit for read-only audit / dry-run)
    #[argh(switch)]
    apply: bool,
    /// maximum files to inspect
    #[argh(option, default = "50000")]
    max_files: usize,
    /// emit JSON output
    #[argh(switch)]
    json: bool,
}

/// Compile C/C++/Rust to LLVM IR (-O3 AVX2) and synthesize Bun FFI bindings
#[derive(FromArgs, Debug)]
#[argh(subcommand, name = "llvm")]
struct LlvmCmd {
    /// source (.c, .cpp, .rs) or textual IR (.ll) path
    #[argh(positional)]
    source: String,
    /// optional path to save emitted .ll file
    #[argh(option)]
    out_ll: Option<String>,
    /// emit JSON output
    #[argh(switch)]
    json: bool,
}

/// Run Pure-Rust Ghidra SRE + REA headless binary decompiler (PE/ELF/Mach-O -> CFG + P-Code + Pseudo-C)
#[derive(FromArgs, Debug)]
#[argh(subcommand, name = "ghidra")]
struct GhidraCmd {
    /// binary file path (.exe, .dll, .so, .dylib, .node)
    #[argh(positional)]
    binary: String,
    /// maximum functions to decompile
    #[argh(option, default = "8")]
    max_functions: usize,
    /// emit JSON output (headless REA MCP mode)
    #[argh(switch)]
    json: bool,
}

/// Full Rust + Bun rewrite of microsoft/node-api-dotnet (CoreCLR hostfxr + [JSExport] bindgen + C-ABI)
#[derive(FromArgs, Debug)]
#[argh(subcommand, name = "dotnet")]
struct DotnetCmd {
    /// action: doctor | bindgen | invoke | bench
    #[argh(positional)]
    action: String,
    /// target C# source file (for bindgen) or .NET .dll assembly path (for invoke/bench)
    #[argh(option)]
    target: Option<String>,
    /// optional .runtimeconfig.json path (auto-inferred alongside .dll if omitted)
    #[argh(option)]
    runtime_config: Option<String>,
    /// assembly-qualified type name (e.g. "Sovereign.DotNet.SovereignBridge, SovereignDotNetDemo")
    #[argh(option, default = "String::from(\"Sovereign.DotNet.SovereignBridge, SovereignDotNetDemo\")")]
    type_name: String,
    /// static [UnmanagedCallersOnly] method name
    #[argh(option, default = "String::from(\"ExecuteEnvelope\")")]
    method: String,
    /// UTF-8 JSON payload for invoke
    #[argh(option, default = "String::from(\"{\\\"caller\\\":\\\"n2b-cli\\\",\\\"value\\\":21}\")")]
    payload: String,
    /// emit JSON output
    #[argh(switch)]
    json: bool,
}

/// Sovereign mingw-w64 fork (`forks/mingw-w64-rea`) automation & REA binary optimization
#[derive(FromArgs, Debug)]
#[argh(subcommand, name = "mingw")]
struct MingwCmd {
    /// action: doctor | audit | proxy-dll
    #[argh(positional)]
    action: String,
    /// target PE64 .dll or .exe binary
    #[argh(option)]
    binary: Option<String>,
    /// output directory for synthesized .def, .lib, shim.c, and proxy .dll
    #[argh(option)]
    out_dir: Option<String>,
    /// n2b workspace root (defaults to C:/src/n2b)
    #[argh(option, default = "String::from(\"C:/src/n2b\")")]
    root: String,
    /// emit JSON output
    #[argh(switch)]
    json: bool,
}

fn main() {
    let top: TopLevel = argh::from_env();
    if let Err(err) = dispatch(top.cmd) {
        let _ = writeln!(std::io::stderr(), "n2b error: {err}");
        std::process::exit(1);
    }
}

fn dispatch(cmd: SubCommand) -> n2b_core::N2bResult<()> {
    let mut stdout = std::io::stdout().lock();

    match cmd {
        SubCommand::Doctor(c) => {
            let root = PathBuf::from(&c.root);
            let hw = query_host_hardware();
            let llvm = probe_llvm_rust_bun_toolchain(&root.join("vendor").join("llvm-project"));
            let lock_path = root.join("vendor").join("vendor-lock.json");
            let vendor_count = fs::read_to_string(&lock_path)
                .ok()
                .and_then(|s| serde_json::from_str::<serde_json::Value>(&s).ok())
                .and_then(|v| v.get("totalSubmodules").and_then(|n| n.as_u64()))
                .unwrap_or(0);

            let report = serde_json::json!({
                "tool": "n2b",
                "version": env!("CARGO_PKG_VERSION"),
                "conventions": ["rust-for-chromium", "rust-in-bun", "rust-in-linux"],
                "hardware": hw,
                "toolchains": llvm,
                "vendor_submodules_locked": vendor_count,
                "vendor_read_only": true,
            });

            if c.json {
                writeln!(stdout, "{}", serde_json::to_string_pretty(&report)?)?;
            } else {
                writeln!(
                    stdout,
                    "n2b v{} | CPUs={} RAM={}MB | Bun={} | Clang={}",
                    env!("CARGO_PKG_VERSION"),
                    hw.logical_cpus,
                    hw.total_ram_mb,
                    llvm.bun_version,
                    llvm.clang_version
                )?;
                writeln!(
                    stdout,
                    "Vendor Submodules (Read-Only): {} locked at {}",
                    vendor_count,
                    lock_path.display()
                )?;
            }
        }
        SubCommand::Scan(c) => {
            let opts = ScanOptions {
                max_files: c.max_files,
                compute_blake3: c.blake3,
                respect_gitignore: true,
                include_binaries: true,
            };
            let rep = MonorepoWalker::scan(Path::new(&c.path), &opts)?;
            if c.json {
                writeln!(stdout, "{}", serde_json::to_string_pretty(&rep)?)?;
            } else {
                writeln!(
                    stdout,
                    "[n2b:scan] {} | {} files ({:.2} MB) in {:.2} ms ({:.0} files/sec)",
                    rep.root_path,
                    rep.total_files,
                    (rep.total_bytes as f64) / (1024.0 * 1024.0),
                    rep.elapsed_ms,
                    rep.files_per_sec
                )?;
                for (cat, count) in rep.category_counts.iter().take(12) {
                    writeln!(stdout, "  {cat:<16} {count:>8} files")?;
                }
            }
        }
        SubCommand::Search(c) => {
            let engine = RipgrepEngine {
                max_hits: c.max_hits,
                respect_gitignore: true,
            };
            let stats = engine.search_monorepo(Path::new(&c.path), &c.pattern)?;
            if c.json {
                writeln!(stdout, "{}", serde_json::to_string_pretty(&stats)?)?;
            } else {
                writeln!(
                    stdout,
                    "[n2b:search] pattern=`{}` | {} matches across {} files in {:.2} ms",
                    stats.pattern, stats.total_matches, stats.files_searched, stats.elapsed_ms
                )?;
                for hit in stats.hits.iter().take(25) {
                    writeln!(stdout, "  {}:{}: {}", hit.path, hit.line_number, hit.line_preview)?;
                }
            }
        }
        SubCommand::Ast(c) => {
            let p = Path::new(&c.file);
            let bytes = fs::read(p)?;
            let ast = parse_polyglot_source(p, &bytes)?;
            if c.json {
                writeln!(stdout, "{}", serde_json::to_string_pretty(&ast)?)?;
            } else {
                writeln!(
                    stdout,
                    "[n2b:ast] {:?} | nodes={} lines={} abi={:?} symbols={} imports={}",
                    ast.language,
                    ast.total_ast_nodes,
                    ast.rope_lines,
                    ast.abi_class,
                    ast.symbols.len(),
                    ast.imports.len()
                )?;
                for sym in ast.symbols.iter().take(20) {
                    writeln!(
                        stdout,
                        "  [{}] {} (L{}-L{})",
                        sym.kind, sym.name, sym.start_line, sym.end_line
                    )?;
                }
            }
        }
        SubCommand::Migrate(c) => {
            let opts = MigrateOptions {
                dry_run: !c.apply,
                max_files: c.max_files,
                out_dir: c.out_dir.map(PathBuf::from),
            };
            let rep = migrate_repository(Path::new(&c.source), &opts)?;
            if c.json {
                writeln!(stdout, "{}", serde_json::to_string_pretty(&rep)?)?;
            } else {
                writeln!(
                    stdout,
                    "[n2b:migrate] archetype={} | target=`{}` | dry_run={}",
                    rep.archetype.as_str(),
                    rep.target_stack,
                    rep.dry_run
                )?;
                writeln!(
                    stdout,
                    "  inspected={} rewritten={} ast_edits={} purged_deps={} elapsed={:.2}ms",
                    rep.files_inspected,
                    rep.files_rewritten,
                    rep.total_ast_rewrites,
                    rep.legacy_deps_purged.len(),
                    rep.elapsed_ms
                )?;
                for f in &rep.findings {
                    writeln!(
                        stdout,
                        "  [{}] {}x : {} -> {}",
                        f.rule_id, f.occurrences, f.legacy_construct, f.sovereign_replacement
                    )?;
                }
            }
        }
        SubCommand::Llvm(c) => {
            let out_ll = c.out_ll.as_deref().map(Path::new);
            let rep = compile_and_analyze_llvm_ir(Path::new(&c.source), out_ll)?;
            if c.json {
                writeln!(stdout, "{}", serde_json::to_string_pretty(&rep)?)?;
            } else {
                writeln!(
                    stdout,
                    "[n2b:llvm] {} | triple={} | functions={} ir_insns={} simd_fns={} ({:.2}ms)",
                    rep.source_file,
                    rep.target_triple,
                    rep.total_functions,
                    rep.total_ir_instructions,
                    rep.simd_vectorized_functions,
                    rep.elapsed_ms
                )?;
                writeln!(stdout, "\n{}", rep.generated_bun_ffi_dts)?;
            }
        }
        SubCommand::Ghidra(c) => {
            let opts = SreAnalyzeOptions {
                max_functions: c.max_functions,
                ..SreAnalyzeOptions::default()
            };
            let rep = analyze_binary_file(Path::new(&c.binary), &opts)?;
            if c.json {
                writeln!(stdout, "{}", serde_json::to_string_pretty(&rep)?)?;
            } else {
                writeln!(
                    stdout,
                    "[n2b:ghidra] {} | format={:?} base=0x{:x} entry=0x{:x} sections={} imports={} exports={} ({:.2}ms)",
                    rep.binary_path,
                    rep.format,
                    rep.image_base,
                    rep.entry_point_va,
                    rep.sections.len(),
                    rep.imports.len(),
                    rep.exports.len(),
                    rep.elapsed_ms
                )?;
                for f in &rep.decompiled_functions {
                    writeln!(stdout, "\n{}", f.pseudo_c)?;
                }
            }
        }
        SubCommand::Dotnet(c) => match c.action.as_str() {
            "doctor" => {
                let rep = probe_dotnet_environment()?;
                if c.json {
                    writeln!(stdout, "{}", serde_json::to_string_pretty(&rep)?)?;
                } else {
                    writeln!(
                        stdout,
                        "[n2b:dotnet] hostfxr={} ({}) | sdks={:?} | ready={}",
                        rep.hostfxr_version,
                        rep.hostfxr_path,
                        rep.sdks_installed,
                        rep.in_process_ready
                    )?;
                }
            }
            "bindgen" => {
                let src_path = PathBuf::from(c.target.as_deref().unwrap_or(
                    "C:/src/n2b/dotnet/SovereignDotNetDemo/SovereignBridge.cs",
                ));
                let asm_name = src_path
                    .file_stem()
                    .and_then(|s| s.to_str())
                    .unwrap_or("SovereignModule");
                let rep = generate_dotnet_rust_bun_bindings(&src_path, asm_name)?;
                if c.json {
                    writeln!(stdout, "{}", serde_json::to_string_pretty(&rep)?)?;
                } else {
                    writeln!(
                        stdout,
                        "[n2b:dotnet:bindgen] {} | types={} methods={} fast_blittable={}",
                        rep.source_file,
                        rep.exported_types.len(),
                        rep.total_methods_exported,
                        rep.blittable_fast_methods
                    )?;
                    writeln!(stdout, "\n{}", rep.generated_typescript_dts)?;
                }
            }
            "invoke" | "bench" => {
                let dll_path = PathBuf::from(c.target.as_deref().unwrap_or(
                    "C:/src/n2b/dotnet/SovereignDotNetDemo/bin/Release/net10.0/SovereignDotNetDemo.dll",
                ));
                let cfg_path = c
                    .runtime_config
                    .as_deref()
                    .map(PathBuf::from)
                    .unwrap_or_else(|| dll_path.with_extension("runtimeconfig.json"));
                let mut rep = CoreClrHost::invoke_json(
                    &dll_path,
                    &cfg_path,
                    &c.type_name,
                    &c.method,
                    &c.payload,
                )?;
                if c.action == "bench" {
                    let (_val, ops_sec) = CoreClrHost::invoke_scalar_i64_pair(
                        &dll_path,
                        &cfg_path,
                        &c.type_name,
                        "ScalarFusedMultiplyAdd",
                        7,
                        6,
                        500_000,
                    )?;
                    rep.scalar_benchmark_ops_per_sec = Some(ops_sec);
                }
                if c.json {
                    writeln!(stdout, "{}", serde_json::to_string_pretty(&rep)?)?;
                } else {
                    writeln!(
                        stdout,
                        "[n2b:dotnet:{}] {}::{} ({:.2}ms) -> {}",
                        c.action, rep.type_name, rep.method_name, rep.elapsed_ms, rep.response_json
                    )?;
                    if let Some(ops) = rep.scalar_benchmark_ops_per_sec {
                        writeln!(
                            stdout,
                            "  Zero-GC C-ABI Scalar Throughput: {:.2} million calls/sec",
                            ops / 1_000_000.0
                        )?;
                    }
                }
            }
            other => {
                return Err(n2b_core::N2bError::new(
                    n2b_core::ErrorKind::InvalidConfig,
                    format!("unknown dotnet action `{other}`; expected doctor | bindgen | invoke | bench"),
                ));
            }
        },
        SubCommand::Mingw(c) => match c.action.as_str() {
            "doctor" => {
                let rep = probe_mingw_rea_environment(Path::new(&c.root))?;
                if c.json {
                    writeln!(stdout, "{}", serde_json::to_string_pretty(&rep)?)?;
                } else {
                    writeln!(
                        stdout,
                        "[n2b:mingw] fork={} ({}@{}) | ready={}",
                        rep.rea_fork_path, rep.rea_fork_branch, rep.rea_fork_head_sha, rep.toolchain_ready
                    )?;
                }
            }
            "audit" => {
                let bin = PathBuf::from(
                    c.binary
                        .as_deref()
                        .unwrap_or("C:/src/n2b/target/release/n2b_ffi.dll"),
                );
                let rep = analyze_pe_mingw_rea(&bin, 16)?;
                if c.json {
                    writeln!(stdout, "{}", serde_json::to_string_pretty(&rep)?)?;
                } else {
                    writeln!(
                        stdout,
                        "[n2b:mingw:audit] {} | attribution={} beacon={} clean_fns={} crt_filtered={}",
                        rep.binary_path,
                        rep.toolchain_attribution,
                        rep.has_rea_beacon,
                        rep.clean_payload_functions.len(),
                        rep.crt_boilerplate_filtered.len()
                    )?;
                }
            }
            "proxy-dll" => {
                let bin = PathBuf::from(
                    c.binary
                        .as_deref()
                        .unwrap_or("C:/src/n2b/migrations/ue58-sovereign/rust-kernel/target/release/ue58_rust_kernel.dll"),
                );
                let out = PathBuf::from(
                    c.out_dir
                        .as_deref()
                        .unwrap_or("C:/src/n2b/target/mingw-rea-proxy"),
                );
                let rep = synthesize_proxy_hook_dll(Path::new(&c.root), &bin, &out)?;
                if c.json {
                    writeln!(stdout, "{}", serde_json::to_string_pretty(&rep)?)?;
                } else {
                    writeln!(
                        stdout,
                        "[n2b:mingw:proxy-dll] {} -> {} ({} bytes, {} hooks, beacon={:?}, {:.2}ms)",
                        rep.source_dll,
                        rep.compiled_proxy_dll_path,
                        rep.compiled_proxy_dll_size_bytes,
                        rep.exported_symbol_count,
                        rep.rea_audit.rea_beacon_tag,
                        rep.elapsed_ms
                    )?;
                }
            }
            other => {
                return Err(n2b_core::N2bError::new(
                    n2b_core::ErrorKind::InvalidConfig,
                    format!("unknown mingw action `{other}`; expected doctor | audit | proxy-dll"),
                ));
            }
        },
    }

    Ok(())
}
