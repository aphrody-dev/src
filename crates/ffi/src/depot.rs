use std::os::raw::c_char;
use std::path::Path;
use serde_json::json;

use aphrody_core::apply_helix_rope_edits;
use aphrody_core_capi::cabi::{c_str, free_c_string, into_c_string, json_err, json_ok, raw_slice};
use depot_core::{GixEngine, JustEngine, detect_content};
use depot_forge::GitHubClient;
use depot_graph::{GraphQuery, QueryOptions, build_graph_for_dir};
use depot_ingest::{DigestFormat, IngestConfig, ingest_codebase};
use depot_migrate::MigrateEngine;
use depot_re::{ReEngine, transcode_lua52_bytecode};

pub const DEPOT_ABI_VERSION: u32 = 20261111;

#[unsafe(no_mangle)]
pub extern "C" fn depot_abi_version() -> u32 {
    DEPOT_ABI_VERSION
}

#[unsafe(no_mangle)]
pub extern "C" fn depot_free_string(ptr: *mut c_char) {
    // SAFETY: `ptr` is null or was produced by `into_c_string` in this library.
    unsafe { free_c_string(ptr) };
}

#[unsafe(no_mangle)]
pub extern "C" fn depot_gix_status_json(path_ptr: *const c_char) -> *mut c_char {
    // SAFETY: caller passes a NUL-terminated string valid for the call.
    let p_str = unsafe { c_str(path_ptr) };
    let path = if p_str.is_empty() { Path::new(".") } else { Path::new(p_str) };

    match GixEngine::inspect(path, 10) {
        Ok(telemetry) => json_ok(&telemetry),
        Err(e) => json_err(e),
    }
}

#[unsafe(no_mangle)]
pub extern "C" fn depot_just_recipes_json(justfile_path_ptr: *const c_char) -> *mut c_char {
    // SAFETY: caller passes a NUL-terminated string valid for the call.
    let p_str = unsafe { c_str(justfile_path_ptr) };
    let path = if p_str.is_empty() { Path::new("justfile") } else { Path::new(p_str) };

    match JustEngine::parse_file(path) {
        Ok(spec) => json_ok(&spec),
        Err(e) => json_err(e),
    }
}

#[unsafe(no_mangle)]
pub extern "C" fn depot_ingest_json(
    root_dir_ptr: *const c_char,
    max_tokens: u32,
    outline_only: bool,
) -> *mut c_char {
    // SAFETY: caller passes a NUL-terminated string valid for the call.
    let r_str = unsafe { c_str(root_dir_ptr) };
    let path = if r_str.is_empty() { Path::new(".") } else { Path::new(r_str) };

    let mut config = IngestConfig::default();
    if max_tokens > 0 {
        config.max_tokens = Some(max_tokens as usize);
    }
    config.outline_only = outline_only;
    config.format = DigestFormat::Json;

    let (digest, stats) = ingest_codebase(path, &config);
    into_c_string(
        json!({
            "stats": stats,
            "digest": digest
        })
        .to_string(),
    )
}

#[unsafe(no_mangle)]
pub extern "C" fn depot_graph_query_json(
    graph_dir_ptr: *const c_char,
    term_ptr: *const c_char,
    dfs: bool,
    max_tokens: u32,
) -> *mut c_char {
    // SAFETY: caller passes NUL-terminated strings valid for the call.
    let g_str = unsafe { c_str(graph_dir_ptr) };
    let path = if g_str.is_empty() { Path::new(".") } else { Path::new(g_str) };
    let term = unsafe { c_str(term_ptr) };

    let graph = build_graph_for_dir(path, &[]);
    let opts = QueryOptions {
        dfs,
        max_tokens: if max_tokens == 0 { 2000 } else { max_tokens as usize },
        max_depth: 3,
    };

    let context = GraphQuery::query(&graph, term, &opts);
    into_c_string(
        json!({
            "term": term,
            "mode": if dfs { "dfs" } else { "bfs" },
            "context": context
        })
        .to_string(),
    )
}

#[unsafe(no_mangle)]
pub extern "C" fn depot_forge_repo_json(
    owner_ptr: *const c_char,
    repo_ptr: *const c_char,
) -> *mut c_char {
    // SAFETY: caller passes NUL-terminated strings valid for the call.
    let owner = unsafe { c_str(owner_ptr) };
    let repo = unsafe { c_str(repo_ptr) };

    let client = GitHubClient::from_vault();
    match client.get_repo(owner, repo) {
        Ok(r) => json_ok(&r),
        Err(e) => json_err(e),
    }
}

#[unsafe(no_mangle)]
pub extern "C" fn depot_magika_detect_json(
    path_ptr: *const c_char,
    bytes_ptr: *const u8,
    bytes_len: usize,
) -> *mut c_char {
    // SAFETY: caller passes a NUL-terminated string and `bytes_len` readable bytes.
    let p_str = unsafe { c_str(path_ptr) };
    let path = Path::new(p_str);
    let slice = unsafe { raw_slice(bytes_ptr, bytes_len) };

    let sig = detect_content(path, slice);
    json_ok(&sig)
}

#[unsafe(no_mangle)]
pub extern "C" fn depot_helix_rope_edit(
    source_ptr: *const c_char,
    edits_json_ptr: *const c_char,
) -> *mut c_char {
    // SAFETY: caller passes NUL-terminated strings valid for the call.
    let source = unsafe { c_str(source_ptr) };
    let edits_str = unsafe { c_str(edits_json_ptr) };

    // Parse array of [start_byte, end_byte, replacement]
    let parsed: Result<Vec<(usize, usize, String)>, _> = serde_json::from_str(edits_str);
    match parsed {
        Ok(edits) => into_c_string(apply_helix_rope_edits(source, edits)),
        Err(e) => into_c_string(format!("Error: {e}")),
    }
}

#[unsafe(no_mangle)]
pub extern "C" fn depot_migrate_run_json(root_dir_ptr: *const c_char, dry_run: bool) -> *mut c_char {
    // SAFETY: caller passes a NUL-terminated string valid for the call.
    let r_str = unsafe { c_str(root_dir_ptr) };
    let path = if r_str.is_empty() { Path::new(".") } else { Path::new(r_str) };

    match MigrateEngine::run(path, dry_run) {
        Ok(rep) => json_ok(&rep),
        Err(e) => json_err(e),
    }
}

#[unsafe(no_mangle)]
pub extern "C" fn depot_re_audit_json(path_ptr: *const c_char) -> *mut c_char {
    // SAFETY: caller passes a NUL-terminated string valid for the call.
    let p_str = unsafe { c_str(path_ptr) };
    let path = Path::new(p_str);

    match ReEngine::audit_file(path) {
        Ok(audit) => json_ok(&audit),
        Err(e) => into_c_string(json!({ "error": e, "path": p_str }).to_string()),
    }
}

#[unsafe(no_mangle)]
pub extern "C" fn depot_re_audit_bytes_json(
    label_ptr: *const c_char,
    bytes_ptr: *const u8,
    bytes_len: usize,
) -> *mut c_char {
    // SAFETY: caller passes a NUL-terminated string and `bytes_len` readable bytes.
    let label = unsafe { c_str(label_ptr) };
    let slice = unsafe { raw_slice(bytes_ptr, bytes_len) };
    if slice.is_empty() {
        return into_c_string(json!({ "error": "empty bytecode buffer", "path": label }).to_string());
    }

    match ReEngine::audit_bytes(slice, label) {
        Ok(audit) => json_ok(&audit),
        Err(e) => into_c_string(json!({ "error": e, "path": label }).to_string()),
    }
}

#[unsafe(no_mangle)]
pub extern "C" fn depot_lua52_transcode_hex(
    bytes_ptr: *const u8,
    bytes_len: usize,
    target_int: u8,
    target_sizet: u8,
) -> *mut c_char {
    // SAFETY: caller guarantees `bytes_ptr` points to `bytes_len` readable bytes.
    let slice = unsafe { raw_slice(bytes_ptr, bytes_len) };
    if slice.is_empty() {
        return json_err("empty Lua 5.2 bytecode buffer");
    }

    match transcode_lua52_bytecode(slice, target_int, target_sizet) {
        Ok(out) => {
            let mut hex = String::with_capacity(out.len() * 2);
            for b in &out {
                use std::fmt::Write;
                let _ = write!(&mut hex, "{b:02x}");
            }
            into_c_string(
                json!({
                    "ok": true,
                    "byte_length": out.len(),
                    "target_size_int": target_int,
                    "target_size_size_t": target_sizet,
                    "hex": hex,
                })
                .to_string(),
            )
        }
        Err(e) => into_c_string(json!({ "ok": false, "error": e }).to_string()),
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::ffi::{CStr, CString};

    #[test]
    fn test_abi_version() {
        assert_eq!(depot_abi_version(), DEPOT_ABI_VERSION);
    }

    #[test]
    fn test_helix_rope_ffi() {
        let code = CString::new("fn hello() { return 1; }").unwrap();
        let edits = CString::new(r#"[[3, 8, "world"], [20, 21, "42"]]"#).unwrap();

        let res_ptr = depot_helix_rope_edit(code.as_ptr(), edits.as_ptr());
        assert!(!res_ptr.is_null());
        let res_str = unsafe { CStr::from_ptr(res_ptr).to_str().unwrap() };
        assert_eq!(res_str, "fn world() { return 42; }");
        depot_free_string(res_ptr);
    }

    #[test]
    fn test_magika_detect_ffi() {
        let path = CString::new("index.ts").unwrap();
        let sample = b"export const x: number = 42;";
        let res_ptr = depot_magika_detect_json(path.as_ptr(), sample.as_ptr(), sample.len());
        assert!(!res_ptr.is_null());
        let res_str = unsafe { CStr::from_ptr(res_ptr).to_str().unwrap() };
        assert!(res_str.contains("typescript"));
        depot_free_string(res_ptr);
    }

    #[test]
    fn test_lua52_ffi_pipeline() {
        // 1. Magika LuaBytecode detection
        let luac_path = CString::new("quest.lua.bin").unwrap();
        let mut chunk = Vec::new();
        chunk.extend_from_slice(b"\x1bLua\x52\x00");
        chunk.extend_from_slice(&[1, 4, 8, 4, 8, 0]);
        chunk.extend_from_slice(b"\x19\x93\r\n\x1a\n");
        chunk.extend_from_slice(&0u32.to_le_bytes());
        chunk.extend_from_slice(&0u32.to_le_bytes());
        chunk.extend_from_slice(&[0, 1, 2]);
        let ret_instr = 31u32 | (1u32 << 23);
        chunk.extend_from_slice(&1u32.to_le_bytes());
        chunk.extend_from_slice(&ret_instr.to_le_bytes());
        chunk.extend_from_slice(&0u32.to_le_bytes()); // constants
        chunk.extend_from_slice(&0u32.to_le_bytes()); // protos
        chunk.extend_from_slice(&1u32.to_le_bytes()); // upvalues
        chunk.extend_from_slice(&[1, 0]);
        chunk.extend_from_slice(&0u64.to_le_bytes()); // source = nil
        chunk.extend_from_slice(&0u32.to_le_bytes()); // lineinfo
        chunk.extend_from_slice(&0u32.to_le_bytes()); // locals
        chunk.extend_from_slice(&0u32.to_le_bytes()); // upval names

        let magika_ptr = depot_magika_detect_json(luac_path.as_ptr(), chunk.as_ptr(), chunk.len());
        let magika_str = unsafe { CStr::from_ptr(magika_ptr).to_str().unwrap() };
        assert!(magika_str.contains("LuaBytecode"));
        depot_free_string(magika_ptr);

        // 2. RE audit bytes FFI
        let audit_ptr = depot_re_audit_bytes_json(luac_path.as_ptr(), chunk.as_ptr(), chunk.len());
        let audit_str = unsafe { CStr::from_ptr(audit_ptr).to_str().unwrap() };
        assert!(audit_str.contains("\"is_lua_bytecode\":true"));
        assert!(audit_str.contains("RETURN"));
        depot_free_string(audit_ptr);

        // 3. Lua 5.2 x64 -> wasm32 transcode FFI
        let trans_ptr = depot_lua52_transcode_hex(chunk.as_ptr(), chunk.len(), 4, 4);
        let trans_str = unsafe { CStr::from_ptr(trans_ptr).to_str().unwrap() };
        assert!(trans_str.contains("\"ok\":true"));
        depot_free_string(trans_ptr);
    }
}
