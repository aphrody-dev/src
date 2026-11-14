// SPDX-License-Identifier: Apache-2.0 OR MIT
//! `n2b-polyglot`: Unified fusion of:
//! - **Tree-Sitter** incremental AST grammars (C, C++, Rust, TypeScript, TSX, JavaScript, Java,
//!   Python, Lua, C#, Go, JSON, HTML, CSS, Bash)
//! - **Google Magika** content signature & feature detection (`n2b_core::detect_content`)
//! - **Helix Editor** `ropey::Rope` incremental zero-copy text transaction engine
//! - **Native C11 + C++20 FFI Kernels** (`polyglot_accel.c` & `cpp_demangle_bridge.cpp`)

#![forbid(unsafe_op_in_unsafe_fn)]

use n2b_core::{ContentCategory, ErrorKind, N2bError, N2bResult, detect_content};
use ropey::Rope;
use serde::{Deserialize, Serialize};
use std::path::Path;
use tree_sitter::{Language, Node, Parser};
use zerocopy::{FromBytes, Immutable, IntoBytes, KnownLayout};

#[derive(
    Debug, Clone, Copy, Default, FromBytes, IntoBytes, Immutable, KnownLayout, Serialize, Deserialize,
)]
#[repr(C)]
pub struct NativeMetrics {
    pub line_count: u64,
    pub brace_open_count: u64,
    pub brace_close_count: u64,
    pub semicolon_count: u64,
    pub fnv1a_hash64: u64,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum CppAbiClass {
    PlainOrC,
    ItaniumCpp,
    MsvcCpp,
    RustMangled,
    UnrealEngineReflection,
}

unsafe extern "C" {
    fn n2b_scan_c_metrics(buf: *const u8, len: usize, out: *mut NativeMetrics);
    fn n2b_classify_cpp_abi(ptr: *const u8, len: usize) -> u32;
}

/// Invokes the fused C11 structural kernel (`polyglot_accel.c`).
#[inline]
pub fn compute_native_c_metrics(bytes: &[u8]) -> NativeMetrics {
    let mut out = NativeMetrics::default();
    // SAFETY: `bytes.as_ptr()` is valid for `bytes.len()` reads (or empty slice with len 0),
    // and `&mut out` points to an initialized `#[repr(C)]` `NativeMetrics` struct on the stack.
    unsafe {
        n2b_scan_c_metrics(bytes.as_ptr(), bytes.len(), &mut out);
    }
    out
}

/// Invokes the fused C++20 symbol/Unreal classifier (`cpp_demangle_bridge.cpp`).
#[inline]
pub fn classify_cpp_or_unreal_abi(bytes: &[u8]) -> CppAbiClass {
    // SAFETY: `bytes.as_ptr()` is valid for `bytes.len()` read-only bytes across the synchronous C++ call.
    let code = unsafe { n2b_classify_cpp_abi(bytes.as_ptr(), bytes.len()) };
    match code {
        1 => CppAbiClass::ItaniumCpp,
        2 => CppAbiClass::MsvcCpp,
        3 => CppAbiClass::RustMangled,
        4 => CppAbiClass::UnrealEngineReflection,
        _ => CppAbiClass::PlainOrC,
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum PolyglotLanguage {
    Rust,
    TypeScript,
    Tsx,
    JavaScript,
    C,
    Cpp,
    CSharp,
    Java,
    Python,
    Lua,
    Go,
    Json,
    Html,
    Css,
    Bash,
}

impl PolyglotLanguage {
    pub fn from_path_and_bytes(path: &Path, sample: &[u8]) -> Option<Self> {
        let ext = path
            .extension()
            .and_then(|e| e.to_str())
            .unwrap_or("")
            .to_ascii_lowercase();
        if ext == "tsx" {
            return Some(Self::Tsx);
        }
        let sig = detect_content(path, sample);
        match sig.category {
            ContentCategory::Rust => Some(Self::Rust),
            ContentCategory::TypeScript => Some(Self::TypeScript),
            ContentCategory::JavaScript => Some(Self::JavaScript),
            ContentCategory::C => Some(Self::C),
            ContentCategory::Cpp => Some(Self::Cpp),
            ContentCategory::CSharp => Some(Self::CSharp),
            ContentCategory::Java => Some(Self::Java),
            ContentCategory::Python => Some(Self::Python),
            ContentCategory::Lua => Some(Self::Lua),
            ContentCategory::Go => Some(Self::Go),
            ContentCategory::Json => Some(Self::Json),
            ContentCategory::Html => Some(Self::Html),
            ContentCategory::Css => Some(Self::Css),
            ContentCategory::Shell => Some(Self::Bash),
            _ => None,
        }
    }

    pub fn tree_sitter_language(self) -> Language {
        match self {
            Self::Rust => tree_sitter_rust::LANGUAGE.into(),
            Self::TypeScript => tree_sitter_typescript::LANGUAGE_TYPESCRIPT.into(),
            Self::Tsx => tree_sitter_typescript::LANGUAGE_TSX.into(),
            Self::JavaScript => tree_sitter_javascript::LANGUAGE.into(),
            Self::C => tree_sitter_c::LANGUAGE.into(),
            Self::Cpp => tree_sitter_cpp::LANGUAGE.into(),
            Self::CSharp => tree_sitter_c_sharp::LANGUAGE.into(),
            Self::Java => tree_sitter_java::LANGUAGE.into(),
            Self::Python => tree_sitter_python::LANGUAGE.into(),
            Self::Lua => tree_sitter_lua::LANGUAGE.into(),
            Self::Go => tree_sitter_go::LANGUAGE.into(),
            Self::Json => tree_sitter_json::LANGUAGE.into(),
            Self::Html => tree_sitter_html::LANGUAGE.into(),
            Self::Css => tree_sitter_css::LANGUAGE.into(),
            Self::Bash => tree_sitter_bash::LANGUAGE.into(),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AstSymbol {
    pub kind: String,
    pub name: String,
    pub start_line: usize,
    pub end_line: usize,
    pub byte_range: (usize, usize),
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PolyglotFileAst {
    pub language: PolyglotLanguage,
    pub root_kind: String,
    pub total_ast_nodes: usize,
    pub has_syntax_errors: bool,
    pub abi_class: CppAbiClass,
    pub native_metrics: NativeMetrics,
    pub rope_chars: usize,
    pub rope_lines: usize,
    pub symbols: Vec<AstSymbol>,
    pub imports: Vec<String>,
}

/// Parses a source buffer using Tree-Sitter + Helix Rope + Magika + C/C++ native metrics.
pub fn parse_polyglot_source(path: &Path, source: &[u8]) -> N2bResult<PolyglotFileAst> {
    let lang = PolyglotLanguage::from_path_and_bytes(path, source).ok_or_else(|| {
        N2bError::new(
            ErrorKind::ParseFailure,
            format!("no Tree-Sitter grammar registered for {}", path.display()),
        )
    })?;

    let mut parser = Parser::new();
    parser
        .set_language(&lang.tree_sitter_language())
        .map_err(|e| N2bError::new(ErrorKind::ParseFailure, format!("language init: {e}")))?;

    let tree = parser.parse(source, None).ok_or_else(|| {
        N2bError::new(
            ErrorKind::ParseFailure,
            format!("Tree-Sitter parse returned None for {}", path.display()),
        )
    })?;

    let text_str = core::str::from_utf8(source).unwrap_or("");
    let rope = Rope::from_str(text_str);

    let root = tree.root_node();
    let mut total_ast_nodes = 0usize;
    let mut symbols = Vec::new();
    let mut imports = Vec::new();

    collect_ast_facts(root, source, &mut total_ast_nodes, &mut symbols, &mut imports);

    let native_metrics = compute_native_c_metrics(source);
    let abi_class = classify_cpp_or_unreal_abi(source);

    Ok(PolyglotFileAst {
        language: lang,
        root_kind: root.kind().to_string(),
        total_ast_nodes,
        has_syntax_errors: root.has_error(),
        abi_class,
        native_metrics,
        rope_chars: rope.len_chars(),
        rope_lines: rope.len_lines(),
        symbols,
        imports,
    })
}

fn collect_ast_facts(
    node: Node<'_>,
    source: &[u8],
    total_nodes: &mut usize,
    symbols: &mut Vec<AstSymbol>,
    imports: &mut Vec<String>,
) {
    *total_nodes += 1;
    let kind = node.kind();

    // Symbol extraction across Rust, TS/JS, C/C++, Java, Python, Lua, C#, Go
    if matches!(
        kind,
        "function_item"
            | "struct_item"
            | "enum_item"
            | "impl_item"
            | "trait_item"
            | "function_declaration"
            | "class_declaration"
            | "method_definition"
            | "interface_declaration"
            | "type_alias_declaration"
            | "function_definition"
            | "class_specifier"
            | "struct_specifier"
            | "method_declaration"
            | "class_definition"
    ) {
        let name = node
            .child_by_field_name("name")
            .or_else(|| node.child_by_field_name("declarator"))
            .and_then(|n| n.utf8_text(source).ok())
            .map(|s| s.lines().next().unwrap_or("").trim().to_string())
            .unwrap_or_else(|| "<anonymous>".to_string());

        if symbols.len() < 512 {
            symbols.push(AstSymbol {
                kind: kind.to_string(),
                name,
                start_line: node.start_position().row + 1,
                end_line: node.end_position().row + 1,
                byte_range: (node.start_byte(), node.end_byte()),
            });
        }
    }

    // Import / require / include extraction for Node->Bun and C++ dependency graphs
    if matches!(
        kind,
        "import_statement"
            | "use_declaration"
            | "preproc_include"
            | "import_declaration"
            | "import_from_statement"
    ) && imports.len() < 512
        && let Ok(txt) = node.utf8_text(source)
    {
        imports.push(txt.lines().next().unwrap_or("").trim().to_string());
    } else if kind == "call_expression"
        && imports.len() < 512
        && let Some(func) = node.child_by_field_name("function")
        && let Ok(fn_name) = func.utf8_text(source)
        && matches!(fn_name, "require" | "import")
        && let Ok(full) = node.utf8_text(source)
    {
        imports.push(full.lines().next().unwrap_or("").trim().to_string());
    }

    let mut cursor = node.walk();
    for child in node.children(&mut cursor) {
        collect_ast_facts(child, source, total_nodes, symbols, imports);
    }
}

/// Helix-style Rope byte-accurate transactional span replacement (`helix-core` pattern).
/// Applies non-overlapping `(start_byte, end_byte, replacement)` edits in reverse byte order
/// so all Tree-Sitter byte offsets remain 100% valid in a single O(k log N) pass.
pub fn apply_helix_rope_edits(source: &str, mut edits: Vec<(usize, usize, String)>) -> String {
    if edits.is_empty() {
        return source.to_string();
    }
    edits.sort_by_key(|a| std::cmp::Reverse(a.0));
    let mut rope = Rope::from_str(source);
    let mut last_start = usize::MAX;
    for (start_byte, end_byte, replacement) in edits {
        if end_byte > last_start || start_byte > end_byte || end_byte > rope.len_bytes() {
            continue;
        }
        let start_char = rope.byte_to_char(start_byte);
        let end_char = rope.byte_to_char(end_byte);
        rope.remove(start_char..end_char);
        rope.insert(start_char, &replacement);
        last_start = start_byte;
    }
    rope.to_string()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn polyglot_parses_rust_cpp_ts_lua_java_python() {
        let cases: &[(&str, &[u8])] = &[
            ("lib.rs", b"pub struct Engine { pub id: u64 }\npub fn run() -> u64 { 42 }\n"),
            ("actor.cpp", b"namespace ue58 { class AHeroActor { public: void Tick(float dt); }; }\n"),
            ("index.ts", b"import fs from 'fs';\nexport function boot(): number { return 1; }\n"),
            ("script.lua", b"local function greet(x) return x + 1 end\n"),
            ("Main.java", b"import java.util.List;\npublic class Main { public static void main(String[] a) {} }\n"),
            ("tool.py", b"import os\ndef analyze(path: str) -> int:\n    return len(path)\n"),
        ];

        for (name, src) in cases {
            let ast = parse_polyglot_source(Path::new(name), src).expect("parse ok");
            assert!(!ast.has_syntax_errors, "syntax error in {name}");
            assert!(ast.total_ast_nodes > 3);
        }

        let ue = classify_cpp_or_unreal_abi(b"UCLASS(MinimalAPI) class UMyObj : public UObject { GENERATED_BODY() };");
        assert_eq!(ue, CppAbiClass::UnrealEngineReflection);
    }

    #[test]
    fn helix_rope_transactional_edits_preserve_offsets() {
        let src = "const fs = require('fs');\nconst path = require('path');\n";
        let out = apply_helix_rope_edits(
            src,
            vec![
                (19, 23, "'node:fs'".to_string()),
                (47, 53, "'node:path'".to_string()),
            ],
        );
        assert_eq!(out, "const fs = require('node:fs');\nconst path = require('node:path');\n");
    }
}
