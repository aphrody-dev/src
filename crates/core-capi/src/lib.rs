//! C ABI over `aphrody-core`, shipped as `aphrody_core_capi.dll` / `libaphrody_core_capi.so`.
//!
//! Contract (mirrored by `packages/core/src/ffi.ts` and `include/aphrody_core.h`):
//! - Strings in are NUL-terminated UTF-8; strings out are NUL-terminated UTF-8 JSON owned by
//!   the library and released with [`core_free`].
//! - Errors come back as `{"error": "..."}` JSON; null only when the output holds a NUL byte.
//! - Build with the shared LLVM toolchain (docs/llvm/UNIFIED-TOOLCHAIN.md) for cross-language LTO.

use aphrody_core::{SupportedLanguage, TreeSitterEngine, hash, index};
use std::ffi::{CStr, CString, c_char};
use std::path::{Path, PathBuf};

/// Bumped on any signature change.
pub const CORE_ABI_VERSION: u32 = 1;

/// Per-file callback for [`core_index_each`]: one `IndexedFile` JSON, borrowed for the call.
pub type CoreFileCallback = extern "C" fn(file_json: *const c_char);

fn arg<'a>(p: *const c_char) -> &'a str {
    if p.is_null() {
        return "";
    }
    // SAFETY: caller passes a NUL-terminated string valid for the duration of the call.
    unsafe { CStr::from_ptr(p) }.to_str().unwrap_or("")
}

fn out(s: String) -> *mut c_char {
    CString::new(s).map(CString::into_raw).unwrap_or(std::ptr::null_mut())
}

fn err(msg: impl std::fmt::Display) -> *mut c_char {
    out(serde_json::json!({ "error": msg.to_string() }).to_string())
}

#[unsafe(no_mangle)]
pub extern "C" fn core_abi_version() -> u32 {
    CORE_ABI_VERSION
}

/// Release a string returned by any `core_*` function. Null is a no-op.
#[unsafe(no_mangle)]
pub extern "C" fn core_free(p: *mut c_char) {
    if !p.is_null() {
        // SAFETY: `p` was produced by `CString::into_raw` in this library.
        drop(unsafe { CString::from_raw(p) });
    }
}

/// Comma-separated tree-sitter grammars compiled in.
#[unsafe(no_mangle)]
pub extern "C" fn core_languages() -> *mut c_char {
    out(SupportedLanguage::ALL.iter().map(|l| l.name()).collect::<Vec<_>>().join(","))
}

/// Parse `content` (grammar picked from `path`) into an `AstFileSummary` JSON.
#[unsafe(no_mangle)]
pub extern "C" fn core_parse_json(path: *const c_char, content: *const c_char) -> *mut c_char {
    let path = arg(path);
    match TreeSitterEngine::parse_file(Path::new(path), arg(content)) {
        Some(summary) => out(serde_json::to_string(&summary).unwrap_or_default()),
        None => err(format!("unsupported language or parse failure: {path}")),
    }
}

/// Run a tree-sitter S-expression query; `path` only selects the grammar.
#[unsafe(no_mangle)]
pub extern "C" fn core_query_json(
    path: *const c_char,
    content: *const c_char,
    query: *const c_char,
) -> *mut c_char {
    let Some(lang) = TreeSitterEngine::detect_language(Path::new(arg(path))) else {
        return err("unsupported language");
    };
    match TreeSitterEngine::query_sexpr(lang, arg(content), arg(query)) {
        Ok(caps) => out(serde_json::to_string(&caps).unwrap_or_default()),
        Err(e) => err(e),
    }
}

/// BLAKE3 of `len` bytes at `data`, written as 64 hex chars + NUL into `out65`. 0 on success.
#[unsafe(no_mangle)]
pub extern "C" fn core_blake3_hex(data: *const u8, len: usize, out65: *mut u8) -> i32 {
    if out65.is_null() || (data.is_null() && len != 0) {
        return -1;
    }
    let bytes = if len == 0 {
        &[][..]
    } else {
        // SAFETY: caller guarantees `data` points to `len` readable bytes.
        unsafe { std::slice::from_raw_parts(data, len) }
    };
    let hex = hash::blake3_hex(bytes);
    // SAFETY: caller guarantees `out65` has 65 writable bytes.
    unsafe {
        std::ptr::copy_nonoverlapping(hex.as_ptr(), out65, 64);
        *out65.add(64) = 0;
    }
    0
}

fn split_includes(s: &str) -> Vec<PathBuf> {
    s.split(['\n', ';']).filter(|p| !p.is_empty()).map(PathBuf::from).collect()
}

/// Index `root` restricted to `includes` (`;`-separated, may be empty).
/// `follow_ignore != 0` honours .gitignore. Returns the full `Index` JSON.
#[unsafe(no_mangle)]
pub extern "C" fn core_index_json(
    root: *const c_char,
    includes: *const c_char,
    follow_ignore: i32,
) -> *mut c_char {
    let idx = index::build(Path::new(arg(root)), &split_includes(arg(includes)), follow_ignore != 0);
    out(serde_json::to_string(&idx).unwrap_or_default())
}

/// Same walk as [`core_index_json`] but streams each file to `cb` on the calling thread
/// and returns only the `IndexStats` JSON.
#[unsafe(no_mangle)]
pub extern "C" fn core_index_each(
    root: *const c_char,
    includes: *const c_char,
    follow_ignore: i32,
    cb: Option<CoreFileCallback>,
) -> *mut c_char {
    let Some(cb) = cb else { return err("null callback") };
    let idx = index::build(Path::new(arg(root)), &split_includes(arg(includes)), follow_ignore != 0);
    for f in &idx.files {
        if let Ok(c) = CString::new(serde_json::to_string(f).unwrap_or_default()) {
            cb(c.as_ptr());
        }
    }
    out(serde_json::to_string(&idx.stats).unwrap_or_default())
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::sync::atomic::{AtomicUsize, Ordering};

    fn take(p: *mut c_char) -> String {
        assert!(!p.is_null());
        let s = unsafe { CStr::from_ptr(p) }.to_str().unwrap().to_owned();
        core_free(p);
        s
    }

    #[test]
    fn parse_rust_and_lua() {
        let p = CString::new("src/t.rs").unwrap();
        let c = CString::new("pub struct TestFFI;\n").unwrap();
        assert!(take(core_parse_json(p.as_ptr(), c.as_ptr())).contains("TestFFI"));
        let p = CString::new("script.lua").unwrap();
        let c = CString::new("local function calc() goto done ::done:: return 1 end\n").unwrap();
        assert!(take(core_parse_json(p.as_ptr(), c.as_ptr())).contains("calc"));
    }

    #[test]
    fn unsupported_is_error_json() {
        let p = CString::new("x.unknown").unwrap();
        assert!(take(core_parse_json(p.as_ptr(), c"".as_ptr())).contains("\"error\""));
    }

    #[test]
    fn languages_lists_all() {
        assert_eq!(take(core_languages()).split(',').count(), SupportedLanguage::ALL.len());
    }

    #[test]
    fn blake3_matches_core() {
        let mut buf = [0u8; 65];
        assert_eq!(core_blake3_hex(b"abc".as_ptr(), 3, buf.as_mut_ptr()), 0);
        assert_eq!(&buf[..64], hash::blake3_hex(b"abc").as_bytes());
        assert_eq!(buf[64], 0);
    }

    static SEEN: AtomicUsize = AtomicUsize::new(0);
    extern "C" fn count(_: *const c_char) {
        SEEN.fetch_add(1, Ordering::Relaxed);
    }

    #[test]
    fn index_each_streams_files() {
        let root = CString::new(env!("CARGO_MANIFEST_DIR")).unwrap();
        let inc = CString::new("src").unwrap();
        let stats = take(core_index_each(root.as_ptr(), inc.as_ptr(), 1, Some(count)));
        assert!(stats.contains("\"parsed\":1"), "{stats}");
        assert_eq!(SEEN.load(Ordering::Relaxed), 1);
    }
}
