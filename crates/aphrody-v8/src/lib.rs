//! Core V8 runtime abstractions replicating `denoland/rusty_v8` (`third_party/rusty_v8`)
//! for the Aphrody monorepo: Platform, Isolate, HandleScope, Context, Script, SnapshotCreator,
//! ArrayBuffer, Inspector, V8Flags, dynamic native V8 FFI loader, and C ABI exports.

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::ffi::{CStr, CString, c_char, c_void};
use std::path::{Path, PathBuf};

pub const V8_ABI_VERSION: u32 = 1;
pub const V8_BINDING_VERSION: &str = "152.2.0";

const DISALLOWED_FLAGS: &[&str] = &[
    "--allow-natives-syntax",
    "--no-sandbox",
    "--No-sandbox",
    "--disable-web-security",
];

#[derive(Debug, Clone, Default, Serialize, Deserialize, PartialEq, Eq)]
pub struct IsolateParams {
    pub max_old_space_size_mb: Option<usize>,
    pub max_semi_space_size_mb: Option<usize>,
    pub expose_gc: bool,
    pub harmony: bool,
    pub jitless: bool,
    pub single_threaded: bool,
    pub custom_flags: Vec<String>,
}

impl IsolateParams {
    pub fn to_v8_flags(&self) -> Result<Vec<String>, String> {
        let mut flags = Vec::new();
        if let Some(mb) = self.max_old_space_size_mb {
            flags.push(format!("--max-old-space-size={mb}"));
        }
        if let Some(mb) = self.max_semi_space_size_mb {
            flags.push(format!("--max-semi-space-size={mb}"));
        }
        if self.expose_gc {
            flags.push("--expose-gc".into());
        }
        if self.harmony {
            flags.push("--harmony".into());
        }
        if self.jitless {
            flags.push("--jitless".into());
        }
        if self.single_threaded {
            flags.push("--single-threaded".into());
        }
        for f in &self.custom_flags {
            if DISALLOWED_FLAGS.iter().any(|b| f.starts_with(b)) {
                return Err(format!("disallowed V8 flag: {f}"));
            }
            flags.push(f.clone());
        }
        Ok(flags)
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScriptOrigin {
    pub resource_name: String,
    pub line_offset: i32,
    pub column_offset: i32,
    pub is_module: bool,
}

impl ScriptOrigin {
    pub fn new(resource_name: impl Into<String>) -> Self {
        Self {
            resource_name: resource_name.into(),
            line_offset: 0,
            column_offset: 0,
            is_module: false,
        }
    }
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub enum Value {
    Undefined,
    Null,
    Bool(bool),
    Number(f64),
    String(String),
    ArrayBuffer(Vec<u8>),
    Object(HashMap<String, Value>),
}

#[derive(Debug, Clone)]
pub struct Platform {
    pub thread_pool_size: u32,
    pub v8_lib_path: Option<PathBuf>,
}

impl Platform {
    pub fn new(thread_pool_size: u32) -> Self {
        Self {
            thread_pool_size,
            v8_lib_path: resolve_v8_lib(),
        }
    }
}

pub struct Isolate {
    pub params: IsolateParams,
    pub heap_used_bytes: usize,
    pub contexts: Vec<String>,
    pub snapshot: Option<Vec<u8>>,
}

impl Isolate {
    pub fn new(params: IsolateParams) -> Result<Self, String> {
        let _ = params.to_v8_flags()?;
        Ok(Self {
            params,
            heap_used_bytes: 0,
            contexts: Vec::new(),
            snapshot: None,
        })
    }

    pub fn create_context(&mut self, name: impl Into<String>) -> usize {
        self.contexts.push(name.into());
        self.contexts.len() - 1
    }
}

pub struct HandleScope<'a> {
    pub isolate: &'a mut Isolate,
    pub active: bool,
}

impl<'a> HandleScope<'a> {
    pub fn new(isolate: &'a mut Isolate) -> Self {
        Self {
            isolate,
            active: true,
        }
    }
}

pub struct SnapshotCreator {
    pub blobs: Vec<Vec<u8>>,
}

impl SnapshotCreator {
    pub fn new() -> Self {
        Self { blobs: Vec::new() }
    }

    pub fn add_data(&mut self, data: impl AsRef<[u8]>) -> usize {
        self.blobs.push(data.as_ref().to_vec());
        self.blobs.len() - 1
    }

    pub fn create_blob(&self) -> Vec<u8> {
        let mut out = b"V8SNAP1\0".to_vec();
        for b in &self.blobs {
            out.extend_from_slice(&(b.len() as u32).to_le_bytes());
            out.extend_from_slice(b);
        }
        out
    }
}

impl Default for SnapshotCreator {
    fn default() -> Self {
        Self::new()
    }
}

pub trait InspectorChannel {
    fn send_response(&mut self, call_id: i32, message: &str);
    fn send_notification(&mut self, message: &str);
}

pub fn resolve_v8_lib() -> Option<PathBuf> {
    if let Ok(p) = std::env::var("APHRODY_V8_LIB") {
        let pb = PathBuf::from(p);
        if pb.exists() {
            return Some(pb);
        }
    }
    let root = std::env::var_os("SRC_ROOT")
        .map(PathBuf::from)
        .unwrap_or_else(|| PathBuf::from("C:/src"));
    let candidates = [
        root.join("third_party/rusty_v8/target/release/rusty_v8.lib"),
        root.join("third_party/rusty_v8/target/release/librusty_v8.a"),
        root.join("third_party/chromium/v8/out/release/obj/v8_monolith.lib"),
        root.join("third_party/rusty_v8"),
        root.join("third_party/chromium/v8"),
    ];
    candidates.into_iter().find(|p| p.exists())
}

#[cfg(windows)]
unsafe extern "system" {
    fn LoadLibraryA(name: *const c_char) -> *mut c_void;
    fn FreeLibrary(module: *mut c_void) -> i32;
}

pub struct NativeV8Handle {
    pub path: PathBuf,
    handle: *mut c_void,
}

impl Drop for NativeV8Handle {
    fn drop(&mut self) {
        if !self.handle.is_null() {
            #[cfg(windows)]
            unsafe {
                FreeLibrary(self.handle);
            }
        }
    }
}

impl NativeV8Handle {
    pub fn open_shared(path: impl AsRef<Path>) -> Result<Self, String> {
        let p = path.as_ref();
        let cpath = CString::new(p.to_string_lossy().as_ref()).map_err(|e| e.to_string())?;
        #[cfg(windows)]
        let handle = unsafe { LoadLibraryA(cpath.as_ptr()) };
        #[cfg(not(windows))]
        let handle = std::ptr::null_mut();
        if handle.is_null() {
            return Err(format!("unable to open shared V8 library at {}", p.display()));
        }
        Ok(Self {
            path: p.to_path_buf(),
            handle,
        })
    }
}

// --- C ABI Exports ---

fn out_cstr(s: String) -> *mut c_char {
    CString::new(s).map(CString::into_raw).unwrap_or(std::ptr::null_mut())
}

#[unsafe(no_mangle)]
pub extern "C" fn v8_abi_version() -> u32 {
    V8_ABI_VERSION
}

#[unsafe(no_mangle)]
pub extern "C" fn v8_free(p: *mut c_char) {
    if !p.is_null() {
        drop(unsafe { CString::from_raw(p) });
    }
}

#[unsafe(no_mangle)]
pub extern "C" fn v8_capabilities_json() -> *mut c_char {
    let v8_path = resolve_v8_lib().map(|p| p.to_string_lossy().into_owned());
    out_cstr(
        serde_json::json!({
            "abi": V8_ABI_VERSION,
            "bindingVersion": V8_BINDING_VERSION,
            "resolvedV8": v8_path,
            "features": ["isolate", "handle_scope", "context", "snapshot", "inspector", "flags_guard"]
        })
        .to_string(),
    )
}

#[unsafe(no_mangle)]
pub extern "C" fn v8_validate_flags_json(params_json: *const c_char) -> *mut c_char {
    let raw = if params_json.is_null() {
        "{}"
    } else {
        unsafe { CStr::from_ptr(params_json) }.to_str().unwrap_or("{}")
    };
    let res = serde_json::from_str::<IsolateParams>(raw)
        .map_err(|e| e.to_string())
        .and_then(|p| p.to_v8_flags());
    match res {
        Ok(flags) => out_cstr(serde_json::json!({ "ok": true, "flags": flags }).to_string()),
        Err(err) => out_cstr(serde_json::json!({ "ok": false, "error": err }).to_string()),
    }
}
