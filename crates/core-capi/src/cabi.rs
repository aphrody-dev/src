//! Shared C ABI primitives for Aphrody native libraries (`core-capi`, `ffi`, `adblock-capi`).
//!
//! Conventions:
//! - `aphrody_abi_version()` / `<ns>_abi_version()` returns [`APHRODY_ABI_VERSION`].
//! - NUL-terminated UTF-8 strings returned by value are owned by the library and released with
//!   `aphrody_free` (or `<ns>_free` / `core_free` / `depot_free_string`).
//! - Framed binary/JSON buffers use `[u64 len LE][u8 status][payload]` and are released with
//!   [`free_framed`].

use serde::Serialize;
use std::ffi::{CStr, CString, c_char};

/// Unified C ABI version shared across Aphrody C ABI crates.
pub const APHRODY_ABI_VERSION: u32 = 1;

/// Framed-buffer status: success.
pub const ABI_STATUS_OK: u8 = 0;

/// Framed-buffer status: error.
pub const ABI_STATUS_ERR: u8 = 1;

/// Integer return code: invalid argument / null pointer.
pub const ABI_STATUS_INVALID_ARG: i32 = -1;

/// Byte length of the framed buffer header: 8-byte LE length + 1-byte status.
pub const FRAMED_HEADER_LEN: usize = 9;

/// Borrowed byte slice passed across the C ABI.
#[repr(C)]
#[derive(Debug, Clone, Copy)]
pub struct AphrodySlice {
    pub ptr: *const u8,
    pub len: usize,
}

/// Standard integer status codes for C ABI functions returning `int32_t`.
#[repr(i32)]
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum AphrodyStatus {
    Ok = 0,
    Err = 1,
    InvalidArg = -1,
}

/// Borrow a NUL-terminated UTF-8 C string, returning `""` on null or invalid UTF-8.
///
/// # Safety
/// `ptr` must be null or point to a valid NUL-terminated string for lifetime `'a`.
pub unsafe fn c_str<'a>(ptr: *const c_char) -> &'a str {
    if ptr.is_null() {
        return "";
    }
    // SAFETY: caller guarantees `ptr` is NUL-terminated and valid for `'a`.
    unsafe { CStr::from_ptr(ptr) }.to_str().unwrap_or("")
}

/// Convert a Rust `String` into an owned NUL-terminated `*mut c_char`.
/// Returns null if `s` contains an interior NUL byte.
pub fn into_c_string(s: String) -> *mut c_char {
    CString::new(s)
        .map(CString::into_raw)
        .unwrap_or(std::ptr::null_mut())
}

/// Serialize `val` as JSON into an owned `*mut c_char`.
pub fn json_ok<T: Serialize>(val: &T) -> *mut c_char {
    into_c_string(serde_json::to_string(val).unwrap_or_default())
}

/// Format an error message as `{"error":"..."}` JSON into an owned `*mut c_char`.
pub fn json_err(msg: impl std::fmt::Display) -> *mut c_char {
    into_c_string(serde_json::json!({ "error": msg.to_string() }).to_string())
}

/// Release a `*mut c_char` previously allocated by [`into_c_string`]. Null is a no-op.
///
/// # Safety
/// `ptr` must be null or a pointer returned by [`into_c_string`] and not yet freed.
pub unsafe fn free_c_string(ptr: *mut c_char) {
    if !ptr.is_null() {
        // SAFETY: `ptr` was produced by `CString::into_raw` in this library.
        drop(unsafe { CString::from_raw(ptr) });
    }
}

/// Borrow a `(ptr, len)` byte buffer as `&[u8]`, returning `&[]` when null or empty.
///
/// # Safety
/// If `ptr` is non-null and `len > 0`, `ptr` must point to `len` readable bytes for `'a`.
pub unsafe fn raw_slice<'a>(ptr: *const u8, len: usize) -> &'a [u8] {
    if ptr.is_null() || len == 0 {
        &[]
    } else {
        // SAFETY: caller guarantees `ptr` points to `len` readable bytes for `'a`.
        unsafe { std::slice::from_raw_parts(ptr, len) }
    }
}

/// Borrow a `(ptr, len)` UTF-8 byte buffer as `&str`, returning `None` on invalid UTF-8.
///
/// # Safety
/// If `ptr` is non-null and `len > 0`, `ptr` must point to `len` readable bytes for `'a`.
pub unsafe fn utf8_slice<'a>(ptr: *const u8, len: usize) -> Option<&'a str> {
    // SAFETY: same preconditions as `raw_slice`.
    std::str::from_utf8(unsafe { raw_slice(ptr, len) }).ok()
}

/// Allocate a framed buffer `[u64 len LE][u8 status][payload]` owned by the caller.
/// Release with [`free_framed`].
pub fn pack_framed(status: u8, payload: &[u8]) -> *mut u8 {
    let mut out = Vec::with_capacity(FRAMED_HEADER_LEN + payload.len());
    out.extend_from_slice(&(payload.len() as u64).to_le_bytes());
    out.push(status);
    out.extend_from_slice(payload);
    Box::into_raw(out.into_boxed_slice()).cast::<u8>()
}

/// Release a framed buffer allocated by [`pack_framed`]. Null is a no-op.
///
/// # Safety
/// `ptr` must be null or a pointer returned by [`pack_framed`] and not yet freed.
pub unsafe fn free_framed(ptr: *mut u8) {
    if ptr.is_null() {
        return;
    }
    // SAFETY: `ptr` was allocated by `pack_framed` with an 8-byte LE payload length header.
    unsafe {
        let mut len_bytes = [0u8; 8];
        std::ptr::copy_nonoverlapping(ptr, len_bytes.as_mut_ptr(), 8);
        let total = FRAMED_HEADER_LEN + u64::from_le_bytes(len_bytes) as usize;
        drop(Box::from_raw(std::ptr::slice_from_raw_parts_mut(ptr, total)));
    }
}
