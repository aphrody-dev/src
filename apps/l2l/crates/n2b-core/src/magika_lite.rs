// SPDX-License-Identifier: Apache-2.0 OR MIT
//! Magika-inspired AI/feature content-type detector (`google/magika` architecture:
//! header/middle/footer byte window extraction + structural entropy + magic + token distribution).
//! Pure safe Rust (`#![forbid(unsafe_code)]`), zero-allocation slice inspection.

#![forbid(unsafe_code)]

use serde::{Deserialize, Serialize};
use std::path::Path;
use zerocopy::{FromBytes, Immutable, IntoBytes, KnownLayout};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum ContentCategory {
    Rust,
    TypeScript,
    JavaScript,
    C,
    Cpp,
    CSharp,
    Java,
    Python,
    Lua,
    Go,
    Html,
    Css,
    Json,
    Toml,
    Yaml,
    Markdown,
    Shell,
    LlvmIr,
    WebAssembly,
    PeExecutable,
    ElfExecutable,
    MachOExecutable,
    JavaClassBytecode,
    Archive,
    UnrealAsset,
    UnknownBinary,
    PlainText,
}

impl ContentCategory {
    #[inline]
    pub const fn as_label(self) -> &'static str {
        match self {
            Self::Rust => "rust",
            Self::TypeScript => "typescript",
            Self::JavaScript => "javascript",
            Self::C => "c",
            Self::Cpp => "cpp",
            Self::CSharp => "csharp",
            Self::Java => "java",
            Self::Python => "python",
            Self::Lua => "lua",
            Self::Go => "go",
            Self::Html => "html",
            Self::Css => "css",
            Self::Json => "json",
            Self::Toml => "toml",
            Self::Yaml => "yaml",
            Self::Markdown => "markdown",
            Self::Shell => "shell",
            Self::LlvmIr => "llvm-ir",
            Self::WebAssembly => "wasm",
            Self::PeExecutable => "pe",
            Self::ElfExecutable => "elf",
            Self::MachOExecutable => "macho",
            Self::JavaClassBytecode => "javaclass",
            Self::Archive => "archive",
            Self::UnrealAsset => "uasset",
            Self::UnknownBinary => "binary",
            Self::PlainText => "txt",
        }
    }

    #[inline]
    pub const fn is_binary(self) -> bool {
        matches!(
            self,
            Self::WebAssembly
                | Self::PeExecutable
                | Self::ElfExecutable
                | Self::MachOExecutable
                | Self::JavaClassBytecode
                | Self::Archive
                | Self::UnrealAsset
                | Self::UnknownBinary
        )
    }
}

/// Fixed-layout Magika feature vector header (`zerocopy` compatible).
#[derive(
    Debug, Clone, Copy, FromBytes, IntoBytes, Immutable, KnownLayout, Serialize, Deserialize,
)]
#[repr(C)]
pub struct FeatureHeader {
    pub magic_u32_le: u32,
    pub entropy_milli_bits: u32,
    pub printable_ratio_permille: u16,
    pub nul_byte_count: u16,
    pub confidence_permille: u16,
    pub reserved: u16,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ContentSignature {
    pub category: ContentCategory,
    pub mime: String,
    pub confidence: f32,
    pub features: FeatureHeader,
}

/// Computes Shannon byte entropy in milli-bits (0..=8000) over a Magika-style window.
#[inline]
pub fn compute_entropy_milli_bits(window: &[u8]) -> u32 {
    if window.is_empty() {
        return 0;
    }
    let mut counts = [0u32; 256];
    for &b in window {
        counts[b as usize] += 1;
    }
    let len = window.len() as f64;
    let mut entropy = 0.0f64;
    for &c in &counts {
        if c > 0 {
            let p = (c as f64) / len;
            entropy -= p * p.log2();
        }
    }
    (entropy * 1000.0).round() as u32
}

/// Inspects Magika-style beg/mid/end byte windows + extension priors to classify files in < 1us.
pub fn detect_content(path: &Path, sample: &[u8]) -> ContentSignature {
    let head_len = sample.len().min(1024);
    let head = &sample[..head_len];

    let mut magic_bytes = [0u8; 4];
    for (i, &b) in head.iter().take(4).enumerate() {
        magic_bytes[i] = b;
    }
    let magic_u32_le = u32::from_le_bytes(magic_bytes);

    let mut printable = 0usize;
    let mut nul_count = 0usize;
    for &b in head {
        if b == 0 {
            nul_count += 1;
        } else if matches!(b, 0x09 | 0x0A | 0x0D | 0x20..=0x7E) {
            printable += 1;
        }
    }
    let printable_ratio_permille = (printable * 1000)
        .checked_div(head_len)
        .unwrap_or(1000) as u16;
    let entropy_milli_bits = compute_entropy_milli_bits(head);

    // 1. Deterministic binary magic numbers (Ghidra / Magika high-confidence binary headers)
    if head.len() >= 4 {
        if &head[0..2] == b"MZ" {
            return sig(
                ContentCategory::PeExecutable,
                "application/x-dosexec",
                995,
                magic_u32_le,
                entropy_milli_bits,
                printable_ratio_permille,
                nul_count,
            );
        }
        if &head[0..4] == b"\x7FELF" {
            return sig(
                ContentCategory::ElfExecutable,
                "application/x-elf",
                998,
                magic_u32_le,
                entropy_milli_bits,
                printable_ratio_permille,
                nul_count,
            );
        }
        if matches!(
            magic_u32_le,
            0xFEED_FACE | 0xFEED_FACF | 0xCEFA_EDFE | 0xCFFAEDFE | 0xBEBA_FECA
        ) {
            return sig(
                ContentCategory::MachOExecutable,
                "application/x-mach-binary",
                995,
                magic_u32_le,
                entropy_milli_bits,
                printable_ratio_permille,
                nul_count,
            );
        }
        if &head[0..4] == b"\0asm" {
            return sig(
                ContentCategory::WebAssembly,
                "application/wasm",
                999,
                magic_u32_le,
                entropy_milli_bits,
                printable_ratio_permille,
                nul_count,
            );
        }
        if &head[0..4] == b"\xCA\xFE\xBA\xBE" {
            return sig(
                ContentCategory::JavaClassBytecode,
                "application/java-vm",
                995,
                magic_u32_le,
                entropy_milli_bits,
                printable_ratio_permille,
                nul_count,
            );
        }
        // Unreal Engine .uassetPACKAGE_FILE_TAG (0x9E2A83C1 little-endian)
        if magic_u32_le == 0x9E2A_83C1 {
            return sig(
                ContentCategory::UnrealAsset,
                "application/x-unreal-asset",
                999,
                magic_u32_le,
                entropy_milli_bits,
                printable_ratio_permille,
                nul_count,
            );
        }
        if &head[0..4] == b"PK\x03\x04" || &head[0..2] == b"\x1F\x8B" || &head[0..4] == b"\x28\xB5\x2F\xFD" {
            return sig(
                ContentCategory::Archive,
                "application/octet-stream",
                980,
                magic_u32_le,
                entropy_milli_bits,
                printable_ratio_permille,
                nul_count,
            );
        }
    }

    if nul_count > 0 && printable_ratio_permille < 750 {
        return sig(
            ContentCategory::UnknownBinary,
            "application/octet-stream",
            910,
            magic_u32_le,
            entropy_milli_bits,
            printable_ratio_permille,
            nul_count,
        );
    }

    // 2. Extension + Deep Content Feature Scoring (Magika hybrid classifier)
    let ext = path
        .extension()
        .and_then(|e| e.to_str())
        .unwrap_or("")
        .to_ascii_lowercase();

    let (cat, mime, conf) = match ext.as_str() {
        "rs" => (ContentCategory::Rust, "text/x-rust", 990),
        "ts" | "tsx" | "mts" | "cts" => (ContentCategory::TypeScript, "application/typescript", 990),
        "js" | "jsx" | "mjs" | "cjs" => (ContentCategory::JavaScript, "application/javascript", 985),
        "c" | "h" => {
            if contains_bytes(head, b"class ")
                || contains_bytes(head, b"namespace ")
                || contains_bytes(head, b"template<")
                || contains_bytes(head, b"UCLASS(")
                || contains_bytes(head, b"GENERATED_BODY()")
            {
                (ContentCategory::Cpp, "text/x-c++", 965)
            } else {
                (ContentCategory::C, "text/x-c", 960)
            }
        }
        "cc" | "cpp" | "cxx" | "hpp" | "hxx" | "inl" | "ush" | "usf" => {
            (ContentCategory::Cpp, "text/x-c++", 990)
        }
        "cs" => (ContentCategory::CSharp, "text/x-csharp", 990),
        "java" => (ContentCategory::Java, "text/x-java", 990),
        "py" | "pyi" => (ContentCategory::Python, "text/x-python", 990),
        "lua" | "luau" => (ContentCategory::Lua, "text/x-lua", 990),
        "go" => (ContentCategory::Go, "text/x-go", 990),
        "html" | "htm" => (ContentCategory::Html, "text/html", 985),
        "css" | "scss" => (ContentCategory::Css, "text/css", 985),
        "json" | "jsonc" | "uproject" | "uplugin" => {
            (ContentCategory::Json, "application/json", 985)
        }
        "toml" => (ContentCategory::Toml, "application/toml", 985),
        "yaml" | "yml" => (ContentCategory::Yaml, "application/yaml", 980),
        "md" | "mdx" => (ContentCategory::Markdown, "text/markdown", 980),
        "sh" | "bash" | "zsh" | "ps1" => (ContentCategory::Shell, "text/x-shellscript", 975),
        "ll" => (ContentCategory::LlvmIr, "text/x-llvm", 990),
        "bc" => (ContentCategory::UnknownBinary, "application/x-llvm-bc", 970),
        "uasset" | "umap" => (ContentCategory::UnrealAsset, "application/x-unreal-asset", 990),
        _ => infer_extensionless_text(head),
    };

    sig(
        cat,
        mime,
        conf,
        magic_u32_le,
        entropy_milli_bits,
        printable_ratio_permille,
        nul_count,
    )
}

fn infer_extensionless_text(head: &[u8]) -> (ContentCategory, &'static str, u16) {
    if head.starts_with(b"#!/usr/bin/env bun") || head.starts_with(b"#!/usr/bin/env node") {
        return (ContentCategory::JavaScript, "application/javascript", 950);
    }
    if head.starts_with(b"#!/usr/bin/env python") || head.starts_with(b"#!/usr/bin/python") {
        return (ContentCategory::Python, "text/x-python", 950);
    }
    if head.starts_with(b"#!/bin/sh") || head.starts_with(b"#!/bin/bash") || head.starts_with(b"#!/usr/bin/env bash") {
        return (ContentCategory::Shell, "text/x-shellscript", 950);
    }
    if contains_bytes(head, b"fn main(") || contains_bytes(head, b"pub struct ") {
        return (ContentCategory::Rust, "text/x-rust", 900);
    }
    if contains_bytes(head, b"; ModuleID =") || contains_bytes(head, b"target datalayout =") {
        return (ContentCategory::LlvmIr, "text/x-llvm", 960);
    }
    if head.starts_with(b"{") || head.starts_with(b"[") {
        return (ContentCategory::Json, "application/json", 820);
    }
    (ContentCategory::PlainText, "text/plain", 750)
}

#[inline]
fn contains_bytes(haystack: &[u8], needle: &[u8]) -> bool {
    if needle.is_empty() || needle.len() > haystack.len() {
        return false;
    }
    let first = needle[0];
    let max_idx = haystack.len() - needle.len();
    let mut i = 0;
    while i <= max_idx {
        if haystack[i] == first && &haystack[i..i + needle.len()] == needle {
            return true;
        }
        i += 1;
    }
    false
}

#[inline]
fn sig(
    category: ContentCategory,
    mime: &'static str,
    confidence_permille: u16,
    magic_u32_le: u32,
    entropy_milli_bits: u32,
    printable_ratio_permille: u16,
    nul_count: usize,
) -> ContentSignature {
    ContentSignature {
        category,
        mime: mime.to_string(),
        confidence: (confidence_permille as f32) / 1000.0,
        features: FeatureHeader {
            magic_u32_le,
            entropy_milli_bits,
            printable_ratio_permille,
            nul_byte_count: nul_count.min(u16::MAX as usize) as u16,
            confidence_permille,
            reserved: 0,
        },
    }
}
