// SPDX-License-Identifier: Apache-2.0 OR MIT
//! Zero-overhead C-ABI exports (`n2b_ffi.dll` / `libn2b_ffi.so`) so Bun (`bun:ffi`),
//! Python (`uv` ctypes), Java 25 Panama FFM, and `.NET 10/11` can invoke `n2b` in-process.

#![forbid(unsafe_op_in_unsafe_fn)]

use n2b_core::{MonorepoWalker, ScanOptions};
use n2b_dotnet::{
    CoreClrHost, generate_dotnet_rust_bun_bindings, probe_dotnet_environment,
};
use n2b_ghidra::{SreAnalyzeOptions, analyze_binary_file};
use n2b_mingw_rea::analyze_pe_mingw_rea;
use std::ffi::{CStr, CString, c_void};
use std::os::raw::c_char;
use std::path::Path;

#[unsafe(no_mangle)]
pub extern "C" fn n2b_abi_version() -> u32 {
    0x0001_0000
}

fn cstr_to_str<'a>(ptr: *const c_char) -> Option<&'a str> {
    if ptr.is_null() {
        return None;
    }
    // SAFETY: Caller guarantees `ptr` is a valid NUL-terminated C string for the duration of the call.
    unsafe { CStr::from_ptr(ptr) }.to_str().ok()
}

fn into_heap_c_json(payload: String) -> *mut c_char {
    CString::new(payload)
        .map(CString::into_raw)
        .unwrap_or(core::ptr::null_mut())
}

/// Scans a directory path in-process and returns a heap-allocated NUL-terminated JSON string.
/// Caller frees the returned pointer via `n2b_free_string`.
///
/// # Safety
/// `root_utf8` must be a valid NUL-terminated C string pointer.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn n2b_scan_json(root_utf8: *const c_char, max_files: usize) -> *mut c_char {
    let Some(path_str) = cstr_to_str(root_utf8) else {
        return core::ptr::null_mut();
    };

    let opts = ScanOptions {
        max_files: max_files.max(1),
        compute_blake3: false,
        respect_gitignore: true,
        include_binaries: true,
    };

    let payload = match MonorepoWalker::scan(Path::new(path_str), &opts) {
        Ok(rep) => serde_json::to_string(&rep).unwrap_or_else(|_| "{}".to_string()),
        Err(e) => serde_json::json!({ "error": e.to_string() }).to_string(),
    };
    into_heap_c_json(payload)
}

/// Decompiles a PE/ELF/Mach-O binary in-process and returns a NUL-terminated JSON string.
///
/// # Safety
/// `binary_utf8` must be a valid NUL-terminated C string pointer.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn n2b_ghidra_decompile_json(
    binary_utf8: *const c_char,
    max_functions: usize,
) -> *mut c_char {
    let Some(path_str) = cstr_to_str(binary_utf8) else {
        return core::ptr::null_mut();
    };

    let opts = SreAnalyzeOptions {
        max_functions: max_functions.max(1),
        ..SreAnalyzeOptions::default()
    };

    let payload = match analyze_binary_file(Path::new(path_str), &opts) {
        Ok(rep) => serde_json::to_string(&rep).unwrap_or_else(|_| "{}".to_string()),
        Err(e) => serde_json::json!({ "error": e.to_string() }).to_string(),
    };
    into_heap_c_json(payload)
}

/// Returns CoreCLR (`hostfxr.dll`) SDK/Runtime discovery JSON in-process.
#[unsafe(no_mangle)]
pub extern "C" fn n2b_dotnet_doctor_json() -> *mut c_char {
    let payload = match probe_dotnet_environment() {
        Ok(rep) => serde_json::to_string(&rep).unwrap_or_else(|_| "{}".to_string()),
        Err(e) => serde_json::json!({ "error": e.to_string() }).to_string(),
    };
    into_heap_c_json(payload)
}

/// Resolves a raw `[UnmanagedCallersOnly]` C-ABI function pointer from a `.NET` assembly in-process!
/// Bun (`bun:ffi`) can bind this pointer directly via `dlopen` / `CFunction` for > 50M calls/sec.
///
/// # Safety
/// All four string pointers must be valid NUL-terminated UTF-8 strings.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn n2b_dotnet_get_fn_ptr(
    assembly_utf8: *const c_char,
    runtime_config_utf8: *const c_char,
    type_name_utf8: *const c_char,
    method_name_utf8: *const c_char,
) -> *const c_void {
    let (Some(asm), Some(cfg), Some(ty), Some(meth)) = (
        cstr_to_str(assembly_utf8),
        cstr_to_str(runtime_config_utf8),
        cstr_to_str(type_name_utf8),
        cstr_to_str(method_name_utf8),
    ) else {
        return core::ptr::null();
    };

    CoreClrHost::get_unmanaged_function_pointer(Path::new(asm), Path::new(cfg), ty, meth)
        .unwrap_or(core::ptr::null())
}

/// Invokes a `.NET` `[UnmanagedCallersOnly]` UTF-8 JSON envelope method in-process.
///
/// # Safety
/// All five string pointers must be valid NUL-terminated UTF-8 strings.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn n2b_dotnet_invoke_json(
    assembly_utf8: *const c_char,
    runtime_config_utf8: *const c_char,
    type_name_utf8: *const c_char,
    method_name_utf8: *const c_char,
    request_json_utf8: *const c_char,
) -> *mut c_char {
    let (Some(asm), Some(cfg), Some(ty), Some(meth), Some(req)) = (
        cstr_to_str(assembly_utf8),
        cstr_to_str(runtime_config_utf8),
        cstr_to_str(type_name_utf8),
        cstr_to_str(method_name_utf8),
        cstr_to_str(request_json_utf8),
    ) else {
        return core::ptr::null_mut();
    };

    let payload = match CoreClrHost::invoke_json(Path::new(asm), Path::new(cfg), ty, meth, req) {
        Ok(rep) => serde_json::to_string(&rep).unwrap_or_else(|_| "{}".to_string()),
        Err(e) => serde_json::json!({ "error": e.to_string() }).to_string(),
    };
    into_heap_c_json(payload)
}

/// Runs `n2b-dotnet` C# `[JSExport]` -> C# + Rust + Bun `bun:ffi` + `.d.ts` source generator in-process.
///
/// # Safety
/// Both string pointers must be valid NUL-terminated UTF-8 strings.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn n2b_dotnet_bindgen_json(
    cs_file_utf8: *const c_char,
    assembly_name_utf8: *const c_char,
) -> *mut c_char {
    let (Some(cs_file), Some(asm_name)) = (
        cstr_to_str(cs_file_utf8),
        cstr_to_str(assembly_name_utf8),
    ) else {
        return core::ptr::null_mut();
    };

    let payload = match generate_dotnet_rust_bun_bindings(Path::new(cs_file), asm_name) {
        Ok(rep) => serde_json::to_string(&rep).unwrap_or_else(|_| "{}".to_string()),
        Err(e) => serde_json::json!({ "error": e.to_string() }).to_string(),
    };
    into_heap_c_json(payload)
}

/// Runs MinGW-w64 REA binary audit + CRT startup stripper in-process.
///
/// # Safety
/// `binary_utf8` must be a valid NUL-terminated UTF-8 string.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn n2b_mingw_rea_audit_json(
    binary_utf8: *const c_char,
    max_functions: usize,
) -> *mut c_char {
    let Some(bin_str) = cstr_to_str(binary_utf8) else {
        return core::ptr::null_mut();
    };

    let payload = match analyze_pe_mingw_rea(Path::new(bin_str), max_functions.max(8)) {
        Ok(rep) => serde_json::to_string(&rep).unwrap_or_else(|_| "{}".to_string()),
        Err(e) => serde_json::json!({ "error": e.to_string() }).to_string(),
    };
    into_heap_c_json(payload)
}

/// Frees a JSON string previously allocated by an `n2b_*_json` export.
///
/// # Safety
/// `ptr` must have been returned by an `n2b_*_json` export and must not be freed twice.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn n2b_free_string(ptr: *mut c_char) {
    if !ptr.is_null() {
        // SAFETY: `ptr` was allocated via `CString::into_raw` in this library.
        unsafe {
            drop(CString::from_raw(ptr));
        }
    }
}
