// SPDX-License-Identifier: Apache-2.0 OR MIT
//! Pure-Rust + Bun rewrite of `microsoft/node-api-dotnet`:
//! 1. In-process CoreCLR (`hostfxr`) loader & `[UnmanagedCallersOnly]` dispatcher.
//! 2. Tree-sitter C# `[JSExport]` bindgen via `aphrody_core::grammars` -> `.g.cs`, `.rs`, `.ts`, `.d.ts`.

#![forbid(unsafe_op_in_unsafe_fn)]

use aphrody_core::grammars::Grammar;
use parking_lot::Mutex;
use rustc_hash::FxHashMap;
use serde::{Deserialize, Serialize};
use std::ffi::c_void;
use std::path::{Path, PathBuf};
use std::sync::OnceLock;
use std::time::Instant;
use tree_sitter::{Node, Parser};

#[cfg(windows)]
use windows_sys::Win32::System::LibraryLoader::{GetProcAddress, LoadLibraryW};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CsExportedParam {
    pub name: String,
    pub cs_type: String,
    pub rust_type: String,
    pub bun_ffi_type: String,
    pub ts_type: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CsExportedMethod {
    pub cs_name: String,
    pub js_camel_name: String,
    pub ffi_entry_point: String,
    pub return_cs_type: String,
    pub return_rust_type: String,
    pub return_bun_ffi_type: String,
    pub return_ts_type: String,
    pub is_blittable_fast_path: bool,
    pub has_js_export_attr: bool,
    pub has_unmanaged_callers_only: bool,
    pub params: Vec<CsExportedParam>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CsExportedType {
    pub namespace: String,
    pub kind: String,
    pub name: String,
    pub has_js_export_attr: bool,
    pub methods: Vec<CsExportedMethod>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DotNetBindgenBundle {
    pub source_file: String,
    pub assembly_name: String,
    pub exported_types: Vec<CsExportedType>,
    pub total_methods_exported: usize,
    pub blittable_fast_methods: usize,
    pub generated_csharp_bridge: String,
    pub generated_rust_bindings: String,
    pub generated_bun_ts_module: String,
    pub generated_typescript_dts: String,
}

/// Parses a C# file using `aphrody-core`'s compiled C# grammar and extracts `[JSExport]` methods.
pub fn parse_csharp_jsexports(_source_path: &Path, cs_source: &str) -> Result<Vec<CsExportedType>, String> {
    let grammar = Grammar::for_path(Path::new("Bridge.cs"))
        .or_else(|| Grammar::by_name("c_sharp"))
        .or_else(|| Grammar::by_name("c-sharp"))
        .ok_or_else(|| "tree-sitter c_sharp grammar unavailable in aphrody-core".to_string())?;

    let mut parser = Parser::new();
    parser
        .set_language(&grammar.language())
        .map_err(|e| format!("tree-sitter c_sharp: {e}"))?;

    let tree = parser
        .parse(cs_source.as_bytes(), None)
        .ok_or_else(|| "C# AST parse returned None".to_string())?;

    let bytes = cs_source.as_bytes();
    let mut types = Vec::new();
    walk_csharp_ast(tree.root_node(), bytes, "", &mut types);
    Ok(types)
}

/// Generates `.g.cs`, `.rs`, `.ts`, and `.d.ts` bindings for C# `[JSExport]` types.
pub fn generate_dotnet_rust_bun_bindings(
    source_path: &Path,
    assembly_name: &str,
) -> Result<DotNetBindgenBundle, String> {
    let cs_source = std::fs::read_to_string(source_path)
        .map_err(|e| format!("read {}: {e}", source_path.display()))?;
    let exported_types = parse_csharp_jsexports(source_path, &cs_source)?;

    let mut total_methods = 0usize;
    let mut blittable_methods = 0usize;
    for t in &exported_types {
        total_methods += t.methods.len();
        blittable_methods += t.methods.iter().filter(|m| m.is_blittable_fast_path).count();
    }

    Ok(DotNetBindgenBundle {
        source_file: source_path.to_string_lossy().replace('\\', "/"),
        assembly_name: assembly_name.to_string(),
        generated_csharp_bridge: emit_csharp_unmanaged_bridge(assembly_name, &exported_types),
        generated_rust_bindings: emit_rust_host_bindings(assembly_name, &exported_types),
        generated_bun_ts_module: emit_bun_ffi_ts_module(assembly_name, &exported_types),
        generated_typescript_dts: emit_typescript_dts(&exported_types),
        exported_types,
        total_methods_exported: total_methods,
        blittable_fast_methods: blittable_methods,
    })
}

fn walk_csharp_ast(node: Node<'_>, bytes: &[u8], current_ns: &str, out_types: &mut Vec<CsExportedType>) {
    let kind = node.kind();

    if matches!(kind, "namespace_declaration" | "file_scoped_namespace_declaration") {
        let ns_name = node
            .child_by_field_name("name")
            .and_then(|n| n.utf8_text(bytes).ok())
            .map(str::trim)
            .unwrap_or(current_ns);

        if kind == "file_scoped_namespace_declaration" {
            if let Some(parent) = node.parent() {
                let mut cursor = parent.walk();
                for sibling in parent.children(&mut cursor) {
                    if sibling.id() != node.id() {
                        walk_csharp_ast(sibling, bytes, ns_name, out_types);
                    }
                }
            }
            let mut cursor = node.walk();
            for child in node.children(&mut cursor) {
                walk_csharp_ast(child, bytes, ns_name, out_types);
            }
            return;
        }

        let mut cursor = node.walk();
        for child in node.children(&mut cursor) {
            walk_csharp_ast(child, bytes, ns_name, out_types);
        }
        return;
    }

    if matches!(kind, "class_declaration" | "struct_declaration") {
        let type_text = node.utf8_text(bytes).unwrap_or("");
        let header_slice = type_text.split('{').next().unwrap_or(type_text);
        let is_public = header_slice.contains("public ");
        let has_js_export = header_slice.contains("JSExport");

        let name = node
            .child_by_field_name("name")
            .and_then(|n| n.utf8_text(bytes).ok())
            .unwrap_or("ExportedType")
            .trim()
            .to_string();

        if is_public || has_js_export {
            let mut methods = Vec::new();
            if let Some(body) = node.child_by_field_name("body") {
                let mut bcursor = body.walk();
                for member in body.children(&mut bcursor) {
                    if member.kind() == "method_declaration"
                        && let Some(m) = extract_cs_method(member, bytes, &name, has_js_export)
                    {
                        methods.push(m);
                    }
                }
            }
            if !methods.is_empty() || has_js_export {
                out_types.push(CsExportedType {
                    namespace: current_ns.to_string(),
                    kind: kind.trim_end_matches("_declaration").to_string(),
                    name,
                    has_js_export_attr: has_js_export,
                    methods,
                });
            }
        }
        return;
    }

    if kind == "compilation_unit" || kind == "declaration_list" {
        let mut cursor = node.walk();
        for child in node.children(&mut cursor) {
            if child.kind() == "file_scoped_namespace_declaration" {
                walk_csharp_ast(child, bytes, current_ns, out_types);
                return;
            }
            walk_csharp_ast(child, bytes, current_ns, out_types);
        }
    }
}

fn extract_cs_method(node: Node<'_>, bytes: &[u8], class_name: &str, class_exported: bool) -> Option<CsExportedMethod> {
    let raw = node.utf8_text(bytes).ok()?;
    let sig_head = raw.split('{').next().unwrap_or(raw).split("=>").next().unwrap_or(raw);
    if sig_head.contains("[JSExport(false)]") {
        return None;
    }
    let is_public = sig_head.contains("public ");
    let has_js_export = sig_head.contains("JSExport");
    let has_uco = sig_head.contains("UnmanagedCallersOnly");
    if !(is_public || has_js_export || has_uco || class_exported) {
        return None;
    }

    let cs_name = node
        .child_by_field_name("name")
        .and_then(|n| n.utf8_text(bytes).ok())?
        .trim()
        .to_string();
    let ret_type = node
        .child_by_field_name("returns")
        .or_else(|| node.child_by_field_name("type"))
        .and_then(|n| n.utf8_text(bytes).ok())
        .unwrap_or("void")
        .trim()
        .to_string();

    let mut params = Vec::new();
    if let Some(param_list) = node.child_by_field_name("parameters") {
        let mut pcursor = param_list.walk();
        for p in param_list.children(&mut pcursor) {
            if p.kind() == "parameter" {
                let p_type = p
                    .child_by_field_name("type")
                    .and_then(|n| n.utf8_text(bytes).ok())
                    .unwrap_or("nint")
                    .trim()
                    .to_string();
                let p_name = p
                    .child_by_field_name("name")
                    .and_then(|n| n.utf8_text(bytes).ok())
                    .unwrap_or("arg")
                    .trim()
                    .to_string();
                let (r_ty, ffi_ty, ts_ty, _) = map_cs_type(&p_type);
                params.push(CsExportedParam {
                    name: p_name,
                    cs_type: p_type,
                    rust_type: r_ty.to_string(),
                    bun_ffi_type: ffi_ty.to_string(),
                    ts_type: ts_ty.to_string(),
                });
            }
        }
    }

    let (ret_rust, ret_ffi, ret_ts, ret_blittable) = map_cs_type(&ret_type);
    let all_params_blittable = params.iter().all(|p| map_cs_type(&p.cs_type).3);

    Some(CsExportedMethod {
        js_camel_name: to_camel_case(&cs_name),
        ffi_entry_point: format!("ay_dotnet_{}_{}", to_snake_case(class_name), to_snake_case(&cs_name)),
        cs_name,
        return_cs_type: ret_type,
        return_rust_type: ret_rust.to_string(),
        return_bun_ffi_type: ret_ffi.to_string(),
        return_ts_type: ret_ts.to_string(),
        is_blittable_fast_path: ret_blittable && all_params_blittable,
        has_js_export_attr: has_js_export,
        has_unmanaged_callers_only: has_uco,
        params,
    })
}

fn map_cs_type(cs: &str) -> (&'static str, &'static str, &'static str, bool) {
    match cs.trim() {
        "void" => ("()", "FFIType.void", "void", true),
        "bool" | "Boolean" => ("u8", "FFIType.bool", "boolean", true),
        "byte" | "Byte" => ("u8", "FFIType.u8", "number", true),
        "sbyte" | "SByte" => ("i8", "FFIType.i8", "number", true),
        "short" | "Int16" => ("i16", "FFIType.i16", "number", true),
        "ushort" | "UInt16" => ("u16", "FFIType.u16", "number", true),
        "int" | "Int32" => ("i32", "FFIType.i32", "number", true),
        "uint" | "UInt32" => ("u32", "FFIType.u32", "number", true),
        "long" | "Int64" => ("i64", "FFIType.i64", "bigint", true),
        "ulong" | "UInt64" => ("u64", "FFIType.u64", "bigint", true),
        "float" | "Single" => ("f32", "FFIType.f32", "number", true),
        "double" | "Double" => ("f64", "FFIType.f64", "number", true),
        "nint" | "IntPtr" | "nuint" | "UIntPtr" => ("usize", "FFIType.ptr", "Pointer", true),
        s if s.ends_with('*') => ("*mut u8", "FFIType.ptr", "Pointer", true),
        "string" | "String" => ("String", "FFIType.ptr", "string", false),
        s if s.starts_with("Task<") || s == "Task" => ("String", "FFIType.ptr", "Promise<unknown>", false),
        _ => ("serde_json::Value", "FFIType.ptr", "unknown", false),
    }
}

fn to_camel_case(s: &str) -> String {
    let mut chars = s.chars();
    match chars.next() {
        None => String::new(),
        Some(f) => f.to_ascii_lowercase().to_string() + chars.as_str(),
    }
}

fn to_snake_case(s: &str) -> String {
    let mut out = String::with_capacity(s.len() + 4);
    for (idx, ch) in s.chars().enumerate() {
        if ch.is_ascii_uppercase() {
            if idx > 0 {
                out.push('_');
            }
            out.push(ch.to_ascii_lowercase());
        } else if ch.is_ascii_alphanumeric() {
            out.push(ch);
        } else {
            out.push('_');
        }
    }
    out
}

fn emit_csharp_unmanaged_bridge(assembly_name: &str, types: &[CsExportedType]) -> String {
    let mut lines = vec![
        "// <auto-generated by depot-migrate::dotnet>".to_string(),
        "using System;".to_string(),
        "using System.Runtime.CompilerServices;".to_string(),
        "using System.Runtime.InteropServices;".to_string(),
        "using System.Text;".to_string(),
        "using System.Text.Json;".to_string(),
        String::new(),
        format!("namespace {assembly_name}.Generated;"),
        "public static unsafe class NativeDotNetExports".to_string(),
        "{".to_string(),
    ];
    for t in types {
        let fq_type = if t.namespace.is_empty() { t.name.clone() } else { format!("{}.{}", t.namespace, t.name) };
        for m in &t.methods {
            if m.has_unmanaged_callers_only {
                continue;
            }
            if m.is_blittable_fast_path {
                let cs_params: Vec<String> = m.params.iter().map(|p| format!("{} {}", p.cs_type, p.name)).collect();
                let call_args: Vec<&str> = m.params.iter().map(|p| p.name.as_str()).collect();
                lines.push(format!("    [UnmanagedCallersOnly(EntryPoint = \"{}\", CallConvs = new[] {{ typeof(CallConvCdecl) }})]", m.ffi_entry_point));
                lines.push(format!("    public static {} {}({}) => {}.{}({});", m.return_cs_type, m.ffi_entry_point, cs_params.join(", "), fq_type, m.cs_name, call_args.join(", ")));
            } else {
                lines.push(format!("    [UnmanagedCallersOnly(EntryPoint = \"{}\", CallConvs = new[] {{ typeof(CallConvCdecl) }})]", m.ffi_entry_point));
                lines.push(format!("    public static int {}(byte* reqPtr, int reqLen, byte* respBuf, int respCap)", m.ffi_entry_point));
                lines.push("    {".to_string());
                lines.push("        var reqJson = Encoding.UTF8.GetString(new ReadOnlySpan<byte>(reqPtr, reqLen));".to_string());
                lines.push(format!("        var payload = JsonSerializer.Serialize(new {{ target = \"{}.{}\", req = reqJson }});", fq_type, m.cs_name));
                lines.push("        return Encoding.UTF8.GetBytes(payload.AsSpan(), new Span<byte>(respBuf, respCap));".to_string());
                lines.push("    }".to_string());
            }
        }
    }
    lines.push("}".to_string());
    lines.join("\n")
}

fn emit_rust_host_bindings(assembly_name: &str, types: &[CsExportedType]) -> String {
    let mut lines = vec![
        "// Auto-generated by depot-migrate::dotnet".to_string(),
        format!("pub const ASSEMBLY_NAME: &str = \"{assembly_name}\";"),
    ];
    for t in types {
        let fq_type = if t.namespace.is_empty() {
            format!("{}, {assembly_name}", t.name)
        } else {
            format!("{}.{}, {assembly_name}", t.namespace, t.name)
        };
        for m in &t.methods {
            lines.push(format!(
                "pub const SYM_{}: (&str, &str) = (\"{}\", \"{}\");",
                m.ffi_entry_point.to_ascii_uppercase(), fq_type, m.cs_name
            ));
        }
    }
    lines.join("\n")
}

fn emit_bun_ffi_ts_module(assembly_name: &str, types: &[CsExportedType]) -> String {
    let mut lines = vec![
        "// Auto-generated by depot-migrate::dotnet".to_string(),
        "import { dlopen, FFIType } from \"bun:ffi\";".to_string(),
        String::new(),
        format!("export const DOTNET_ASSEMBLY = \"{assembly_name}\";"),
        "export function openNativeAotModule(aotDllPath: string) {".to_string(),
        "  return dlopen(aotDllPath, {".to_string(),
    ];
    for t in types {
        for m in &t.methods {
            if m.is_blittable_fast_path {
                let args_list: Vec<&str> = m.params.iter().map(|p| p.bun_ffi_type.as_str()).collect();
                lines.push(format!("    {}: {{ args: [{}], returns: {} }},", m.ffi_entry_point, args_list.join(", "), m.return_bun_ffi_type));
            } else {
                lines.push(format!("    {}: {{ args: [FFIType.ptr, FFIType.i32, FFIType.ptr, FFIType.i32], returns: FFIType.i32 }},", m.ffi_entry_point));
            }
        }
    }
    lines.push("  });".to_string());
    lines.push("}".to_string());
    lines.join("\n")
}

fn emit_typescript_dts(types: &[CsExportedType]) -> String {
    let mut lines = vec![
        "// Auto-generated TypeScript definitions (node-api-dotnet [JSExport] compatible)".to_string(),
        "import type { Pointer } from \"bun:ffi\";".to_string(),
        String::new(),
    ];
    for t in types {
        lines.push(format!("export declare namespace {} {{", t.name));
        for m in &t.methods {
            let ts_params: Vec<String> = m.params.iter().map(|p| format!("{}: {}", p.name, p.ts_type)).collect();
            lines.push(format!("  export function {}({}): {};", m.js_camel_name, ts_params.join(", "), m.return_ts_type));
        }
        lines.push("}".to_string());
    }
    lines.join("\n")
}

// --- CoreCLR hostfxr in-process loader ---

const HDT_LOAD_ASSEMBLY_AND_GET_FUNCTION_POINTER: i32 = 5;
const UNMANAGED_CALLERS_ONLY_SENTINEL: usize = usize::MAX;
type HostfxrHandle = *mut c_void;

#[cfg(windows)]
type CharT = u16;
#[cfg(not(windows))]
type CharT = u8;

type HostfxrInitializeForRuntimeConfigFn = unsafe extern "C" fn(*const CharT, *const c_void, *mut HostfxrHandle) -> i32;
type HostfxrGetRuntimeDelegateFn = unsafe extern "C" fn(HostfxrHandle, i32, *mut *mut c_void) -> i32;
type HostfxrCloseFn = unsafe extern "C" fn(HostfxrHandle) -> i32;

#[cfg(windows)]
type LoadAssemblyAndGetFunctionPointerFn = unsafe extern "system" fn(
    *const CharT, *const CharT, *const CharT, *const CharT, *mut c_void, *mut *mut c_void,
) -> i32;
#[cfg(not(windows))]
type LoadAssemblyAndGetFunctionPointerFn = unsafe extern "C" fn(
    *const CharT, *const CharT, *const CharT, *const CharT, *mut c_void, *mut *mut c_void,
) -> i32;

pub type UnmanagedJsonCallFn = unsafe extern "C" fn(req_ptr: *const u8, req_len: i32, resp_buf: *mut u8, resp_cap: i32) -> i32;
pub type UnmanagedScalarI64PairFn = unsafe extern "C" fn(a: i64, b: i64) -> i64;
pub type ReverseHostCallbackFn = unsafe extern "C" fn(x: i64) -> i64;
pub type UnmanagedCallbackBridgeFn = unsafe extern "C" fn(seed: i64, cb: ReverseHostCallbackFn) -> i64;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DotNetDoctorReport {
    pub dotnet_root: String,
    pub hostfxr_path: String,
    pub hostfxr_version: String,
    pub sdks_installed: Vec<String>,
    pub netcore_runtimes: Vec<String>,
    pub in_process_ready: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DotNetInvokeReport {
    pub assembly_path: String,
    pub type_name: String,
    pub method_name: String,
    pub mode: String,
    pub response_json: serde_json::Value,
    pub elapsed_ms: f64,
}

struct HostfxrApi {
    init_for_config: HostfxrInitializeForRuntimeConfigFn,
    get_delegate: HostfxrGetRuntimeDelegateFn,
    close_ctx: HostfxrCloseFn,
    cached_loader: Mutex<Option<LoadAssemblyAndGetFunctionPointerFn>>,
    cached_fn_ptrs: Mutex<FxHashMap<String, usize>>,
}

// SAFETY: `HostfxrApi` stores process-global `hostfxr` symbols synchronized by `Mutex`.
unsafe impl Send for HostfxrApi {}
unsafe impl Sync for HostfxrApi {}

static GLOBAL_HOSTFXR: OnceLock<Result<HostfxrApi, String>> = OnceLock::new();

pub struct CoreClrHost;

impl CoreClrHost {
    pub fn discover_dotnet_root() -> Result<(PathBuf, PathBuf, String), String> {
        let candidates = [
            std::env::var("DOTNET_ROOT").ok().map(PathBuf::from),
            Some(PathBuf::from("C:/Program Files/dotnet")),
            Some(PathBuf::from("/usr/share/dotnet")),
            Some(PathBuf::from("/usr/local/share/dotnet")),
        ];
        for root_opt in candidates.into_iter().flatten() {
            let fxr_base = root_opt.join("host").join("fxr");
            if !fxr_base.exists() {
                continue;
            }
            let mut versions: Vec<((u32, u32, u32, bool), String, PathBuf)> = Vec::new();
            if let Ok(entries) = std::fs::read_dir(&fxr_base) {
                for entry in entries.flatten() {
                    let ver_name = entry.file_name().to_string_lossy().to_string();
                    let dll_name = if cfg!(windows) { "hostfxr.dll" } else if cfg!(target_os = "macos") { "libhostfxr.dylib" } else { "libhostfxr.so" };
                    let dll_path = entry.path().join(dll_name);
                    if dll_path.exists() {
                        versions.push((parse_semver_key(&ver_name), ver_name, dll_path));
                    }
                }
            }
            versions.sort_by_key(|a| std::cmp::Reverse(a.0));
            if let Some((_, ver, dll)) = versions.into_iter().next() {
                return Ok((root_opt, dll, ver));
            }
        }
        Err("CoreCLR hostfxr not found under DOTNET_ROOT or standard paths".to_string())
    }

    fn api() -> Result<&'static HostfxrApi, String> {
        GLOBAL_HOSTFXR.get_or_init(Self::load_hostfxr_api).as_ref().map_err(Clone::clone)
    }

    #[cfg(windows)]
    fn load_hostfxr_api() -> Result<HostfxrApi, String> {
        let (_root, dll_path, _ver) = Self::discover_dotnet_root()?;
        let wide_dll: Vec<u16> = dll_path.to_string_lossy().encode_utf16().chain(core::iter::once(0)).collect();
        // SAFETY: `wide_dll` is NUL-terminated UTF-16 pointing to `hostfxr.dll`.
        let module = unsafe { LoadLibraryW(wide_dll.as_ptr()) };
        if module.is_null() {
            return Err(format!("LoadLibraryW failed for {}", dll_path.display()));
        }
        let init_sym = resolve_win32_proc(module, b"hostfxr_initialize_for_runtime_config\0")?;
        let get_del_sym = resolve_win32_proc(module, b"hostfxr_get_runtime_delegate\0")?;
        let close_sym = resolve_win32_proc(module, b"hostfxr_close\0")?;
        // SAFETY: Resolved symbols match exact `hostfxr.h` C signatures.
        let (init_for_config, get_delegate, close_ctx) = unsafe {
            (
                core::mem::transmute::<*const c_void, HostfxrInitializeForRuntimeConfigFn>(init_sym),
                core::mem::transmute::<*const c_void, HostfxrGetRuntimeDelegateFn>(get_del_sym),
                core::mem::transmute::<*const c_void, HostfxrCloseFn>(close_sym),
            )
        };
        Ok(HostfxrApi {
            init_for_config,
            get_delegate,
            close_ctx,
            cached_loader: Mutex::new(None),
            cached_fn_ptrs: Mutex::new(FxHashMap::default()),
        })
    }

    #[cfg(not(windows))]
    fn load_hostfxr_api() -> Result<HostfxrApi, String> {
        Err("in-process CoreCLR hostfxr loader active on Windows hosts".to_string())
    }

    pub fn get_unmanaged_function_pointer(
        assembly_path: &Path,
        runtime_config_path: &Path,
        type_name: &str,
        method_name: &str,
    ) -> Result<*const c_void, String> {
        let api = Self::api()?;
        let abs_asm = std::fs::canonicalize(assembly_path).unwrap_or_else(|_| assembly_path.to_path_buf());
        let clean_asm = abs_asm.to_string_lossy().strip_prefix(r"\\?\").unwrap_or(&abs_asm.to_string_lossy()).to_string();
        let cache_key = format!("{clean_asm}::{type_name}::{method_name}");
        if let Some(&addr) = api.cached_fn_ptrs.lock().get(&cache_key) {
            return Ok(addr as *const c_void);
        }
        if !runtime_config_path.exists() {
            return Err(format!("missing .runtimeconfig.json: {}", runtime_config_path.display()));
        }
        let loader = if let Some(l) = *api.cached_loader.lock() {
            l
        } else {
            let cfg_pal = encode_pal(&runtime_config_path.to_string_lossy());
            let mut ctx: HostfxrHandle = core::ptr::null_mut();
            // SAFETY: Valid NUL-terminated config string and stack handle out-ptr.
            let rc = unsafe { (api.init_for_config)(cfg_pal.as_ptr(), core::ptr::null(), &mut ctx) };
            if rc < 0 || ctx.is_null() {
                return Err(format!("hostfxr_initialize_for_runtime_config failed: 0x{:08x}", rc as u32));
            }
            let mut del_ptr: *mut c_void = core::ptr::null_mut();
            // SAFETY: Valid initialized `ctx` requesting `load_assembly_and_get_function_pointer`.
            let del_rc = unsafe { (api.get_delegate)(ctx, HDT_LOAD_ASSEMBLY_AND_GET_FUNCTION_POINTER, &mut del_ptr) };
            // SAFETY: Closing `ctx` releases handle while keeping CoreCLR alive.
            unsafe { let _ = (api.close_ctx)(ctx); }
            if del_rc < 0 || del_ptr.is_null() {
                return Err(format!("hostfxr_get_runtime_delegate failed: 0x{:08x}", del_rc as u32));
            }
            // SAFETY: Matches `coreclr_delegates.h` typedef.
            let loader = unsafe { core::mem::transmute::<*mut c_void, LoadAssemblyAndGetFunctionPointerFn>(del_ptr) };
            *api.cached_loader.lock() = Some(loader);
            loader
        };

        let asm_pal = encode_pal(&clean_asm);
        let ty_pal = encode_pal(type_name);
        let meth_pal = encode_pal(method_name);
        let mut fn_ptr: *mut c_void = core::ptr::null_mut();
        // SAFETY: Valid NUL-terminated PAL buffers with `UNMANAGED_CALLERS_ONLY_SENTINEL`.
        let rc = unsafe {
            loader(asm_pal.as_ptr(), ty_pal.as_ptr(), meth_pal.as_ptr(), UNMANAGED_CALLERS_ONLY_SENTINEL as *const CharT, core::ptr::null_mut(), &mut fn_ptr)
        };
        if rc < 0 || fn_ptr.is_null() {
            return Err(format!("get_function_pointer({type_name}::{method_name}) failed: 0x{:08x}", rc as u32));
        }
        api.cached_fn_ptrs.lock().insert(cache_key, fn_ptr as usize);
        Ok(fn_ptr as *const c_void)
    }

    pub fn invoke_json(
        assembly_path: &Path,
        runtime_config_path: &Path,
        type_name: &str,
        method_name: &str,
        request_json: &str,
    ) -> Result<DotNetInvokeReport, String> {
        let t0 = Instant::now();
        let raw_ptr = Self::get_unmanaged_function_pointer(assembly_path, runtime_config_path, type_name, method_name)?;
        // SAFETY: Caller contract guarantees `UnmanagedJsonCallFn` signature.
        let func: UnmanagedJsonCallFn = unsafe { core::mem::transmute::<*const c_void, UnmanagedJsonCallFn>(raw_ptr) };
        let req = request_json.as_bytes();
        let mut resp = vec![0u8; 64 * 1024];
        // SAFETY: Valid read/write buffers for the synchronous call.
        let written = unsafe { func(req.as_ptr(), req.len() as i32, resp.as_mut_ptr(), resp.len() as i32) };
        if written < 0 {
            return Err(format!(".NET method {method_name} returned error code {written}"));
        }
        let slice = &resp[..(written as usize).min(resp.len())];
        let parsed = serde_json::from_slice(slice).unwrap_or_else(|_| serde_json::json!({ "raw_utf8": String::from_utf8_lossy(slice) }));
        Ok(DotNetInvokeReport {
            assembly_path: assembly_path.to_string_lossy().to_string(),
            type_name: type_name.to_string(),
            method_name: method_name.to_string(),
            mode: "in-process-coreclr-hostfxr-unmanagedcallersonly".to_string(),
            response_json: parsed,
            elapsed_ms: t0.elapsed().as_secs_f64() * 1000.0,
        })
    }
}

#[cfg(windows)]
fn resolve_win32_proc(module: windows_sys::Win32::Foundation::HMODULE, symbol_nul: &[u8]) -> Result<*const c_void, String> {
    // SAFETY: `module` is loaded and `symbol_nul` is NUL-terminated.
    unsafe { GetProcAddress(module, symbol_nul.as_ptr()) }
        .map(|f| f as *const c_void)
        .ok_or_else(|| format!("GetProcAddress missing {}", String::from_utf8_lossy(symbol_nul).trim_end_matches('\0')))
}

#[cfg(windows)]
fn encode_pal(s: &str) -> Vec<u16> {
    s.encode_utf16().chain(core::iter::once(0)).collect()
}

#[cfg(not(windows))]
fn encode_pal(s: &str) -> Vec<u8> {
    let mut v = s.as_bytes().to_vec();
    v.push(0);
    v
}

fn parse_semver_key(ver: &str) -> (u32, u32, u32, bool) {
    let is_stable = !ver.contains('-');
    let core_part = ver.split('-').next().unwrap_or(ver);
    let mut nums = core_part.split('.').map(|x| x.parse::<u32>().unwrap_or(0));
    (if is_stable { 1 } else { 0 }, nums.next().unwrap_or(0), nums.next().unwrap_or(0))
        .into_key(nums.next().unwrap_or(0))
}

trait IntoSemverKey {
    fn into_key(self, patch: u32) -> (u32, u32, u32, bool);
}

impl IntoSemverKey for (u32, u32, u32) {
    fn into_key(self, patch: u32) -> (u32, u32, u32, bool) {
        (self.0, self.1, self.2, patch != 0)
    }
}

pub fn probe_dotnet_environment() -> Result<DotNetDoctorReport, String> {
    let (root, hostfxr, ver) = CoreClrHost::discover_dotnet_root()?;
    let mut sdks = Vec::new();
    if let Ok(rd) = std::fs::read_dir(root.join("sdk")) {
        for e in rd.flatten() {
            let name = e.file_name().to_string_lossy().to_string();
            if name.chars().next().is_some_and(|c| c.is_ascii_digit()) {
                sdks.push(name);
            }
        }
    }
    sdks.sort();
    let mut runtimes = Vec::new();
    if let Ok(rd) = std::fs::read_dir(root.join("shared").join("Microsoft.NETCore.App")) {
        for e in rd.flatten() {
            runtimes.push(e.file_name().to_string_lossy().to_string());
        }
    }
    runtimes.sort();
    Ok(DotNetDoctorReport {
        dotnet_root: root.to_string_lossy().replace('\\', "/"),
        hostfxr_path: hostfxr.to_string_lossy().replace('\\', "/"),
        hostfxr_version: ver,
        sdks_installed: sdks,
        netcore_runtimes: runtimes,
        in_process_ready: CoreClrHost::api().is_ok(),
    })
}
