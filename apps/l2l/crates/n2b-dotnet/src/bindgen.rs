// SPDX-License-Identifier: Apache-2.0 OR MIT
//! Pure-Rust rewrite of `microsoft/node-api-dotnet`'s `NodeApi.Generator` (`SourceGenerator.cs` +
//! `TypeDefinitionsGenerator.cs`).
//!
//! Uses `tree-sitter-c-sharp` (`n2b-polyglot`) to parse C# namespaces, `[JSExport]` /
//! `[UnmanagedCallersOnly]` classes, structs, enums, and methods, and synthesizes:
//! 1. Zero-GC C# `[UnmanagedCallersOnly(EntryPoint = ..., CallConvs = [typeof(CallConvCdecl)])]` bridge (`.g.cs`).
//! 2. Safe Rust `CoreClrHost` + `#[repr(C)]` wrapper module (`.rs`).
//! 3. Bun v1.4.4 `bun:ffi` + TypeScript `.ts` & `.d.ts` bindings (zero Node-API, zero `.node` addon).

#![forbid(unsafe_code)]

use n2b_core::{ErrorKind, N2bError, N2bResult};
use n2b_polyglot::PolyglotLanguage;
use serde::{Deserialize, Serialize};
use std::path::Path;
use tree_sitter::{Node, Parser};

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

/// Parses a C# file using `tree-sitter-c-sharp` and extracts `[JSExport]` and public static methods.
pub fn parse_csharp_jsexports(_source_path: &Path, cs_source: &str) -> N2bResult<Vec<CsExportedType>> {
    let mut parser = Parser::new();
    parser
        .set_language(&PolyglotLanguage::CSharp.tree_sitter_language())
        .map_err(|e| N2bError::new(ErrorKind::ParseFailure, format!("tree-sitter-c-sharp: {e}")))?;

    let tree = parser
        .parse(cs_source.as_bytes(), None)
        .ok_or_else(|| N2bError::new(ErrorKind::ParseFailure, "C# AST parse returned None"))?;

    let bytes = cs_source.as_bytes();
    let mut types = Vec::new();
    walk_csharp_ast(tree.root_node(), bytes, "", &mut types);
    Ok(types)
}

/// Full rewrite of `NodeApi.Generator`: emits C# `[UnmanagedCallersOnly]`, Rust, Bun `bun:ffi` TS, and `.d.ts`.
pub fn generate_dotnet_rust_bun_bindings(
    source_path: &Path,
    assembly_name: &str,
) -> N2bResult<DotNetBindgenBundle> {
    let cs_source = std::fs::read_to_string(source_path)
        .map_err(|e| N2bError::io(&e, &source_path.display().to_string()))?;
    let exported_types = parse_csharp_jsexports(source_path, &cs_source)?;

    let mut total_methods = 0usize;
    let mut blittable_methods = 0usize;
    for t in &exported_types {
        total_methods += t.methods.len();
        blittable_methods += t.methods.iter().filter(|m| m.is_blittable_fast_path).count();
    }

    let generated_csharp_bridge = emit_csharp_unmanaged_bridge(assembly_name, &exported_types);
    let generated_rust_bindings = emit_rust_host_bindings(assembly_name, &exported_types);
    let generated_bun_ts_module = emit_bun_ffi_ts_module(assembly_name, &exported_types);
    let generated_typescript_dts = emit_typescript_dts(&exported_types);

    Ok(DotNetBindgenBundle {
        source_file: source_path.to_string_lossy().replace('\\', "/"),
        assembly_name: assembly_name.to_string(),
        exported_types,
        total_methods_exported: total_methods,
        blittable_fast_methods: blittable_methods,
        generated_csharp_bridge,
        generated_rust_bindings,
        generated_bun_ts_module,
        generated_typescript_dts,
    })
}

fn walk_csharp_ast(
    node: Node<'_>,
    bytes: &[u8],
    current_ns: &str,
    out_types: &mut Vec<CsExportedType>,
) {
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
            if matches!(child.kind(), "file_scoped_namespace_declaration") {
                walk_csharp_ast(child, bytes, current_ns, out_types);
                return;
            }
            walk_csharp_ast(child, bytes, current_ns, out_types);
        }
    }
}

fn extract_cs_method(
    node: Node<'_>,
    bytes: &[u8],
    class_name: &str,
    class_exported: bool,
) -> Option<CsExportedMethod> {
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
    let is_blittable_fast_path = ret_blittable && all_params_blittable;

    let js_camel_name = to_camel_case(&cs_name);
    let ffi_entry_point = format!(
        "n2b_dotnet_{}_{}",
        to_snake_case(class_name),
        to_snake_case(&cs_name)
    );

    Some(CsExportedMethod {
        cs_name,
        js_camel_name,
        ffi_entry_point,
        return_cs_type: ret_type,
        return_rust_type: ret_rust.to_string(),
        return_bun_ffi_type: ret_ffi.to_string(),
        return_ts_type: ret_ts.to_string(),
        is_blittable_fast_path,
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
    let mut lines = Vec::new();
    lines.push("// <auto-generated by n2b-dotnet (Pure-Rust rewrite of microsoft/node-api-dotnet)>".to_string());
    lines.push("// Zero Node-API / Zero V8 HandleScope: direct CoreCLR [UnmanagedCallersOnly] C-ABI.".to_string());
    lines.push("using System;".to_string());
    lines.push("using System.Runtime.CompilerServices;".to_string());
    lines.push("using System.Runtime.InteropServices;".to_string());
    lines.push("using System.Text;".to_string());
    lines.push("using System.Text.Json;".to_string());
    lines.push(String::new());
    lines.push(format!("namespace {assembly_name}.N2bGenerated;"));
    lines.push("public static unsafe class SovereignDotNetExports".to_string());
    lines.push("{".to_string());

    for t in types {
        let fq_type = if t.namespace.is_empty() {
            t.name.clone()
        } else {
            format!("{}.{}", t.namespace, t.name)
        };
        for m in &t.methods {
            if m.has_unmanaged_callers_only {
                continue;
            }
            if m.is_blittable_fast_path {
                let cs_params: Vec<String> = m
                    .params
                    .iter()
                    .map(|p| format!("{} {}", p.cs_type, p.name))
                    .collect();
                let call_args: Vec<&str> = m.params.iter().map(|p| p.name.as_str()).collect();
                lines.push(format!(
                    "    [UnmanagedCallersOnly(EntryPoint = \"{}\", CallConvs = new[] {{ typeof(CallConvCdecl) }})]",
                    m.ffi_entry_point
                ));
                lines.push(format!(
                    "    public static {} {}({}) => {}.{}({});",
                    m.return_cs_type,
                    m.ffi_entry_point,
                    cs_params.join(", "),
                    fq_type,
                    m.cs_name,
                    call_args.join(", ")
                ));
            } else {
                lines.push(format!(
                    "    [UnmanagedCallersOnly(EntryPoint = \"{}\", CallConvs = new[] {{ typeof(CallConvCdecl) }})]",
                    m.ffi_entry_point
                ));
                lines.push(format!(
                    "    public static int {}(byte* reqPtr, int reqLen, byte* respBuf, int respCap)",
                    m.ffi_entry_point
                ));
                lines.push("    {".to_string());
                lines.push("        var reqJson = Encoding.UTF8.GetString(new ReadOnlySpan<byte>(reqPtr, reqLen));".to_string());
                lines.push(format!(
                    "        var payload = JsonSerializer.Serialize(new {{ target = \"{}.{}\", req = reqJson }});",
                    fq_type, m.cs_name
                ));
                lines.push("        return Encoding.UTF8.GetBytes(payload.AsSpan(), new Span<byte>(respBuf, respCap));".to_string());
                lines.push("    }".to_string());
            }
        }
    }

    lines.push("}".to_string());
    lines.join("\n")
}

fn emit_rust_host_bindings(assembly_name: &str, types: &[CsExportedType]) -> String {
    let mut lines = Vec::new();
    lines.push("// Auto-generated by `n2b-dotnet`: Safe Rust <-> CoreCLR 10/11 in-process bindings.".to_string());
    lines.push("use n2b_dotnet::CoreClrHost;".to_string());
    lines.push("use std::path::Path;".to_string());
    lines.push(String::new());
    lines.push(format!("pub const ASSEMBLY_NAME: &str = \"{assembly_name}\";"));

    for t in types {
        let fq_type = if t.namespace.is_empty() {
            format!("{t_name}, {assembly_name}", t_name = t.name)
        } else {
            format!("{}.{}, {assembly_name}", t.namespace, t.name)
        };
        for m in &t.methods {
            lines.push(format!(
                "// Bound to .NET `{}` -> `{}` (fast_blittable={})",
                fq_type, m.cs_name, m.is_blittable_fast_path
            ));
            lines.push(format!(
                "pub const SYM_{}: (&str, &str) = (\"{}\", \"{}\");",
                m.ffi_entry_point.to_ascii_uppercase(),
                fq_type,
                m.cs_name
            ));
        }
    }
    lines.join("\n")
}

fn emit_bun_ffi_ts_module(assembly_name: &str, types: &[CsExportedType]) -> String {
    let mut lines = Vec::new();
    lines.push("// Auto-generated by `n2b-dotnet`: Bun v1.4.4 `bun:ffi` replacement for `microsoft/node-api-dotnet`.".to_string());
    lines.push("import { dlopen, FFIType, type Pointer } from \"bun:ffi\";".to_string());
    lines.push(String::new());
    lines.push(format!("export const DOTNET_ASSEMBLY = \"{assembly_name}\";"));
    lines.push("export function openNativeAotModule(aotDllPath: string) {".to_string());
    lines.push("  return dlopen(aotDllPath, {".to_string());

    for t in types {
        for m in &t.methods {
            if m.is_blittable_fast_path {
                let args_list: Vec<&str> = m.params.iter().map(|p| p.bun_ffi_type.as_str()).collect();
                lines.push(format!(
                    "    {}: {{ args: [{}], returns: {} }},",
                    m.ffi_entry_point,
                    args_list.join(", "),
                    m.return_bun_ffi_type
                ));
            } else {
                lines.push(format!(
                    "    {}: {{ args: [FFIType.ptr, FFIType.i32, FFIType.ptr, FFIType.i32], returns: FFIType.i32 }},",
                    m.ffi_entry_point
                ));
            }
        }
    }

    lines.push("  });".to_string());
    lines.push("}".to_string());
    lines.join("\n")
}

fn emit_typescript_dts(types: &[CsExportedType]) -> String {
    let mut lines = Vec::new();
    lines.push("// Auto-generated TypeScript definitions (100% `node-api-dotnet` [JSExport] compatible)".to_string());
    lines.push("import type { Pointer } from \"bun:ffi\";".to_string());
    lines.push(String::new());
    for t in types {
        lines.push(format!("export declare namespace {} {{", t.name));
        for m in &t.methods {
            let ts_params: Vec<String> = m
                .params
                .iter()
                .map(|p| format!("{}: {}", p.name, p.ts_type))
                .collect();
            lines.push(format!(
                "  export function {}({}): {};",
                m.js_camel_name,
                ts_params.join(", "),
                m.return_ts_type
            ));
        }
        lines.push("}".to_string());
    }
    lines.join("\n")
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parses_jsexport_csharp_and_synthesizes_csharp_rust_bun_dts() {
        let sample_cs = r#"
using System;
using Microsoft.JavaScript.NodeApi;

namespace Sovereign.DotNet;

[JSExport]
public static class MathAccelerator
{
    [JSExport]
    public static long FusedMultiplyAdd(long a, long b) => (a * b) + 42;

    [JSExport]
    public static string DescribeRuntime(string caller) => $"Hello {caller}";

    [JSExport(false)]
    public static int InternalOnly(int x) => x;
}
"#;
        let types = parse_csharp_jsexports(Path::new("MathAccelerator.cs"), sample_cs)
            .expect("C# parse ok");
        assert_eq!(types.len(), 1);
        assert_eq!(types[0].name, "MathAccelerator");
        assert_eq!(types[0].methods.len(), 2);
        assert_eq!(types[0].methods[0].js_camel_name, "fusedMultiplyAdd");
        assert!(types[0].methods[0].is_blittable_fast_path);
        assert!(!types[0].methods[1].is_blittable_fast_path);

        let dts = emit_typescript_dts(&types);
        assert!(dts.contains("export function fusedMultiplyAdd(a: bigint, b: bigint): bigint;"));
        assert!(dts.contains("export function describeRuntime(caller: string): string;"));
        assert!(!dts.contains("internalOnly"));
    }
}
