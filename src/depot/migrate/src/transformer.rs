// SPDX-License-Identifier: Apache-2.0 OR MIT
//! AST-guided transformer using Tree-Sitter and Helix Rope transactional editing.

use aphrody_core::{RopeSession, SupportedLanguage};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TransformFinding {
    pub rule_id: String,
    pub start_byte: usize,
    pub end_byte: usize,
    pub original: String,
    pub replacement: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TransformResult {
    pub findings: Vec<TransformFinding>,
    pub transformed_code: String,
    pub edits_count: usize,
}

const NODE_BUILTINS: &[&str] = &[
    "assert",
    "async_hooks",
    "buffer",
    "child_process",
    "cluster",
    "console",
    "constants",
    "crypto",
    "dgram",
    "diagnostics_channel",
    "dns",
    "domain",
    "events",
    "fs",
    "fs/promises",
    "http",
    "http2",
    "https",
    "inspector",
    "module",
    "net",
    "os",
    "path",
    "path/posix",
    "path/win32",
    "perf_hooks",
    "process",
    "punycode",
    "querystring",
    "readline",
    "repl",
    "stream",
    "stream/promises",
    "string_decoder",
    "sys",
    "timers",
    "timers/promises",
    "tls",
    "trace_events",
    "tty",
    "url",
    "util",
    "v8",
    "vm",
    "wasi",
    "worker_threads",
    "zlib",
];

fn map_module_specifier(spec: &str) -> Option<(&'static str, String)> {
    if spec == "sqlite3" || spec == "better-sqlite3" {
        return Some(("BUN-SQLITE", "bun:sqlite".to_string()));
    }
    if spec == "node-api-dotnet" {
        return Some(("BUN-DOTNET-BRIDGE", "@aphrody/core".to_string()));
    }
    if !spec.starts_with("node:") && NODE_BUILTINS.contains(&spec) {
        return Some(("BUN-MODERNIZE", format!("node:{spec}")));
    }
    None
}

fn push_string_spec_finding(node: tree_sitter::Node<'_>, source: &str, findings: &mut Vec<TransformFinding>) {
    let raw = match source.get(node.start_byte()..node.end_byte()) {
        Some(s) => s,
        None => return,
    };
    if raw.len() < 2 {
        return;
    }
    let quote = raw.as_bytes()[0];
    if (quote != b'\'' && quote != b'"' && quote != b'`') || raw.as_bytes()[raw.len() - 1] != quote {
        return;
    }
    let inner_start = node.start_byte() + 1;
    let inner_end = node.end_byte() - 1;
    let spec = &source[inner_start..inner_end];
    if let Some((rule_id, replacement)) = map_module_specifier(spec) {
        findings.push(TransformFinding {
            rule_id: rule_id.to_string(),
            start_byte: inner_start,
            end_byte: inner_end,
            original: spec.to_string(),
            replacement,
        });
    }
}

fn collect_js_ts_findings(language: SupportedLanguage, source: &str, findings: &mut Vec<TransformFinding>) {
    if let Some(rest) = source.strip_prefix("#!/usr/bin/env node") {
        if rest.is_empty() || rest.starts_with('\n') || rest.starts_with("\r\n") || rest.starts_with(' ') {
            findings.push(TransformFinding {
                rule_id: "BUN-SHEBANG".to_string(),
                start_byte: 0,
                end_byte: "#!/usr/bin/env node".len(),
                original: "#!/usr/bin/env node".to_string(),
                replacement: "#!/usr/bin/env bun".to_string(),
            });
        }
    }

    let mut parser = tree_sitter::Parser::new();
    let ts_lang = language.tree_sitter_language();
    if parser.set_language(&ts_lang).is_err() {
        return;
    }
    let Some(tree) = parser.parse(source, None) else {
        return;
    };

    let mut stack = vec![tree.root_node()];
    while let Some(node) = stack.pop() {
        match node.kind() {
            "import_statement" | "export_statement" => {
                if let Some(src_node) = node.child_by_field_name("source") {
                    if src_node.kind() == "string" {
                        push_string_spec_finding(src_node, source, findings);
                    }
                }
            }
            "call_expression" => {
                let is_mod_call = node.child_by_field_name("function").is_some_and(|fn_node| {
                    let kind = fn_node.kind();
                    if kind == "import" {
                        return true;
                    }
                    kind == "identifier"
                        && source.get(fn_node.start_byte()..fn_node.end_byte()) == Some("require")
                });
                if is_mod_call {
                    if let Some(args) = node.child_by_field_name("arguments") {
                        let mut cursor = args.walk();
                        for child in args.named_children(&mut cursor) {
                            if child.kind() == "string" {
                                push_string_spec_finding(child, source, findings);
                                break;
                            }
                        }
                    }
                }
            }
            _ => {}
        }

        let mut cursor = node.walk();
        for child in node.named_children(&mut cursor) {
            stack.push(child);
        }
    }

    findings.sort_by_key(|f| (f.start_byte, f.end_byte));
    findings.dedup_by(|a, b| a.start_byte == b.start_byte && a.end_byte == b.end_byte);
}

/// Scans source text for legacy Node or Lua 5.1 patterns and rewrites them using Helix Rope reverse-order edits.
pub fn transform_source(language: SupportedLanguage, source: &str) -> TransformResult {
    let mut findings = Vec::new();

    if language == SupportedLanguage::Lua {
        let lua_rules = [
            ("LUA52-BIT32", "bit.band(", "bit32.band("),
            ("LUA52-BIT32", "bit.bor(", "bit32.bor("),
            ("LUA52-BIT32", "bit.bxor(", "bit32.bxor("),
            ("LUA52-BIT32", "bit.bnot(", "bit32.bnot("),
            ("LUA52-BIT32", "bit.lshift(", "bit32.lshift("),
            ("LUA52-BIT32", "bit.rshift(", "bit32.rshift("),
            ("LUA52-BIT32", "bit.arshift(", "bit32.arshift("),
            ("LUA52-MATH-LOG10", "math.log10(", "math.log("),
            ("LUA52-LOADSTRING", "loadstring(", "load("),
        ];

        for &(rule_id, legacy, rep) in &lua_rules {
            let mut offset = 0;
            while let Some(pos) = source[offset..].find(legacy) {
                let start = offset + pos;
                let end = start + legacy.len();
                let prev_ok = start == 0 || {
                    let b = source.as_bytes()[start - 1];
                    !b.is_ascii_alphanumeric() && b != b'_' && b != b'.'
                };
                if prev_ok {
                    findings.push(TransformFinding {
                        rule_id: rule_id.to_string(),
                        start_byte: start,
                        end_byte: end,
                        original: legacy.to_string(),
                        replacement: rep.to_string(),
                    });
                }
                offset = end;
            }
        }

        // Global unpack( -> table.unpack( (only when not preceded by `.`, `:`, or identifier char)
        let legacy_unpack = "unpack(";
        let mut offset = 0;
        while let Some(pos) = source[offset..].find(legacy_unpack) {
            let start = offset + pos;
            let end = start + legacy_unpack.len();
            let prev_ok = start == 0 || {
                let b = source.as_bytes()[start - 1];
                !b.is_ascii_alphanumeric() && b != b'_' && b != b'.' && b != b':'
            };
            if prev_ok {
                findings.push(TransformFinding {
                    rule_id: "LUA52-TABLE-UNPACK".to_string(),
                    start_byte: start,
                    end_byte: end,
                    original: legacy_unpack.to_string(),
                    replacement: "table.unpack(".to_string(),
                });
            }
            offset = end;
        }
    } else if matches!(
        language,
        SupportedLanguage::TypeScript | SupportedLanguage::Tsx | SupportedLanguage::JavaScript
    ) {
        collect_js_ts_findings(language, source, &mut findings);
    }

    if findings.is_empty() {
        return TransformResult {
            findings: Vec::new(),
            transformed_code: source.to_string(),
            edits_count: 0,
        };
    }

    let mut session = RopeSession::new(source);
    for f in &findings {
        session.stage_replace(f.start_byte, f.end_byte, &f.replacement);
    }

    let count = findings.len();
    let transformed = session.commit();

    TransformResult {
        findings,
        transformed_code: transformed,
        edits_count: count,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_transformer_modernize() {
        let code = "const fs = require('fs');\nconst db = require('sqlite3');";
        let res = transform_source(SupportedLanguage::JavaScript, code);
        assert_eq!(res.edits_count, 2);
        assert!(res.transformed_code.contains("require('node:fs')"));
        assert!(res.transformed_code.contains("require('bun:sqlite')"));
    }

    #[test]
    fn test_transformer_esm_and_shebang() {
        let code = "#!/usr/bin/env node\nimport fs from 'fs';\nexport { join } from \"path\";\nconst dotnet = await import('node-api-dotnet');\n";
        let res = transform_source(SupportedLanguage::TypeScript, code);
        assert_eq!(res.edits_count, 4);
        assert!(res.transformed_code.starts_with("#!/usr/bin/env bun\n"));
        assert!(res.transformed_code.contains("from 'node:fs'"));
        assert!(res.transformed_code.contains("from \"node:path\""));
        assert!(res.transformed_code.contains("import('@aphrody/core')"));
    }

    #[test]
    fn test_lua52_migration() {
        let code = "local a, b = unpack(items)\nlocal mask = bit.band(flags, 0xFF)\nlocal ok = table.unpack(other)\n";
        let res = transform_source(SupportedLanguage::Lua, code);
        assert_eq!(res.edits_count, 2);
        assert!(res.transformed_code.contains("local a, b = table.unpack(items)"));
        assert!(res.transformed_code.contains("local mask = bit32.band(flags, 0xFF)"));
        assert!(res.transformed_code.contains("local ok = table.unpack(other)"));
    }
}
