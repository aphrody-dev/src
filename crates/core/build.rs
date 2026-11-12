//! Data-driven grammar registry.
//!
//! Reads `third_party/ECOSYSTEM.toml` (any table/array entry with `path` and a `kind` containing
//! "tree-sitter" or "grammar"); when absent, falls back to every `third_party/tree-sitter-*` clone.
//! For each grammar declared in the clone's `tree-sitter.json`, compiles `src/parser.c`
//! (+ `src/scanner.c`) with the C compiler from `CC` (the shared LLVM clang) and emits
//! `OUT_DIR/grammars.rs`: one `Grammar` entry with file types and the embedded `tags.scm`.
//! Exported C symbols are renamed `aphrody_grammar_<name>*` so they never clash with the
//! crates.io grammars linked for the dedicated extractors.
//! Override the manifest with `APHRODY_GRAMMARS_MANIFEST`; disable with `APHRODY_GRAMMARS=0`.

use std::fmt::Write as _;
use std::path::{Path, PathBuf};

const SCANNER_FNS: [&str; 5] = [
    "external_scanner_create",
    "external_scanner_destroy",
    "external_scanner_scan",
    "external_scanner_serialize",
    "external_scanner_deserialize",
];

fn main() {
    let manifest_dir = PathBuf::from(std::env::var("CARGO_MANIFEST_DIR").unwrap());
    let src_root = manifest_dir.join("../..");
    let out = PathBuf::from(std::env::var("OUT_DIR").unwrap()).join("grammars.rs");
    println!("cargo:rerun-if-env-changed=APHRODY_GRAMMARS");
    println!("cargo:rerun-if-env-changed=APHRODY_GRAMMARS_MANIFEST");

    let mut code = String::from("pub static GRAMMARS: &[Grammar] = &[\n");
    let mut decls = String::new();
    if std::env::var("APHRODY_GRAMMARS").as_deref() != Ok("0") {
        let manifest = std::env::var("APHRODY_GRAMMARS_MANIFEST")
            .map(PathBuf::from)
            .unwrap_or_else(|_| src_root.join("third_party/ECOSYSTEM.toml"));
        println!("cargo:rerun-if-changed={}", manifest.display());
        let mut seen = std::collections::BTreeSet::new();
        for repo in grammar_repos(&src_root, &manifest) {
            for g in grammars_in(&repo) {
                if !seen.insert(g.name.clone()) {
                    continue;
                }
                match compile(&g) {
                    Ok(()) => emit(&g, &mut decls, &mut code),
                    Err(e) => println!("cargo:warning=grammar {} skipped: {e}", g.name),
                }
            }
        }
    }
    code.push_str("];\n");
    let body = format!("unsafe extern \"C\" {{\n{decls}}}\n{code}");
    std::fs::write(out, body).unwrap();
}

fn grammar_repos(src_root: &Path, manifest: &Path) -> Vec<PathBuf> {
    if let Ok(text) = std::fs::read_to_string(manifest) {
        let value: toml::Value = match text.parse() {
            Ok(v) => v,
            Err(e) => {
                println!("cargo:warning={} unreadable: {e}", manifest.display());
                return Vec::new();
            }
        };
        let mut repos = Vec::new();
        collect_entries(&value, &mut |path, kind| {
            let k = kind.to_ascii_lowercase();
            if k.contains("tree-sitter") || k.contains("grammar") {
                repos.push(src_root.join(path));
            }
        });
        return repos;
    }
    let mut repos: Vec<PathBuf> = std::fs::read_dir(src_root.join("third_party"))
        .into_iter()
        .flatten()
        .flatten()
        .map(|e| e.path())
        .filter(|p| p.file_name().and_then(|n| n.to_str()).is_some_and(|n| n.starts_with("tree-sitter-")))
        .collect();
    repos.sort();
    repos
}

fn collect_entries(v: &toml::Value, f: &mut impl FnMut(&str, &str)) {
    match v {
        toml::Value::Table(t) => {
            if let (Some(p), Some(k)) = (t.get("path").and_then(|x| x.as_str()), t.get("kind").and_then(|x| x.as_str())) {
                f(p, k);
            }
            for child in t.values() {
                collect_entries(child, f);
            }
        }
        toml::Value::Array(a) => a.iter().for_each(|c| collect_entries(c, f)),
        _ => {}
    }
}

struct GrammarSrc {
    name: String,
    ident: String,
    src: PathBuf,
    file_types: Vec<String>,
    tags: Option<PathBuf>,
}

fn grammars_in(repo: &Path) -> Vec<GrammarSrc> {
    let meta = repo.join("tree-sitter.json");
    println!("cargo:rerun-if-changed={}", meta.display());
    let Ok(text) = std::fs::read_to_string(&meta) else { return Vec::new() };
    let Ok(json) = serde_json::from_str::<serde_json::Value>(&text) else { return Vec::new() };
    let strs = |v: Option<&serde_json::Value>| -> Vec<String> {
        match v {
            Some(serde_json::Value::String(s)) => vec![s.clone()],
            Some(serde_json::Value::Array(a)) => a.iter().filter_map(|x| x.as_str().map(String::from)).collect(),
            _ => Vec::new(),
        }
    };
    json["grammars"]
        .as_array()
        .into_iter()
        .flatten()
        .filter_map(|g| {
            let name = g["name"].as_str()?.to_string();
            let dir = repo.join(g["path"].as_str().unwrap_or("."));
            let src = dir.join("src");
            if !src.join("parser.c").is_file() {
                return None;
            }
            let tags = strs(g.get("tags"))
                .into_iter()
                .map(|t| repo.join(t))
                .chain([dir.join("queries/tags.scm")])
                .find(|p| p.is_file());
            Some(GrammarSrc {
                ident: name.replace(['-', '.'], "_"),
                name,
                src,
                file_types: strs(g.get("file-types")),
                tags,
            })
        })
        .collect()
}

fn compile(g: &GrammarSrc) -> Result<(), String> {
    if g.src.join("scanner.cc").is_file() {
        return Err("C++ scanner (scanner.cc) unsupported".into());
    }
    let mut b = cc::Build::new();
    b.include(&g.src).warnings(false).cargo_warnings(false).file(g.src.join("parser.c"));
    if g.src.join("scanner.c").is_file() {
        b.file(g.src.join("scanner.c"));
    }
    let base = format!("tree_sitter_{}", g.ident);
    b.define(&base, Some(format!("aphrody_grammar_{}", g.ident).as_str()));
    for f in SCANNER_FNS {
        b.define(&format!("{base}_{f}"), Some(format!("aphrody_grammar_{}_{f}", g.ident).as_str()));
    }
    println!("cargo:rerun-if-changed={}", g.src.join("parser.c").display());
    b.try_compile(&format!("aphrody_grammar_{}", g.ident)).map_err(|e| e.to_string())
}

fn emit(g: &GrammarSrc, decls: &mut String, code: &mut String) {
    let _ = writeln!(decls, "    fn aphrody_grammar_{}() -> *const ();", g.ident);
    let tags = match &g.tags {
        Some(p) => format!("Some(include_str!({:?}))", p.display().to_string()),
        None => "None".into(),
    };
    let _ = writeln!(
        code,
        "    Grammar {{ name: {:?}, file_types: &{:?}, raw: aphrody_grammar_{}, tags: {tags} }},",
        g.name, g.file_types, g.ident
    );
}
