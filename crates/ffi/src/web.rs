//! Boq wire format from `corelib::web` over the C ABI (`aphrody_*` symbols). The adblock engine
//! has its own library, `crates/adblock-capi` (`aphrody_adblock_*`).
//!
//! Every function returns a framed buffer that the caller releases with
//! `aphrody_chromium_buf_free`:
//! ```text
//! [u64 payload length, little endian][u8 status: 0 ok, 1 error][UTF-8 payload]
//! ```

use corelib::boq_parse_envelopes;

const FFI_HEADER_LEN: usize = 9;

fn ffi_pack_buffer(status: u8, payload: &[u8]) -> *mut u8 {
    let mut out = Vec::with_capacity(FFI_HEADER_LEN + payload.len());
    out.extend_from_slice(&(payload.len() as u64).to_le_bytes());
    out.push(status);
    out.extend_from_slice(payload);
    let mut boxed = out.into_boxed_slice();
    let ptr = boxed.as_mut_ptr();
    std::mem::forget(boxed);
    ptr
}

unsafe fn ffi_slice<'a>(ptr: *const u8, len: usize) -> &'a [u8] {
    if ptr.is_null() || len == 0 {
        &[]
    } else {
        unsafe { std::slice::from_raw_parts(ptr, len) }
    }
}

/// Free a framed buffer returned by any `aphrody_*` C-ABI function.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn aphrody_chromium_buf_free(ptr: *mut u8) {
    if ptr.is_null() {
        return;
    }
    unsafe {
        let mut len_bytes = [0u8; 8];
        std::ptr::copy_nonoverlapping(ptr, len_bytes.as_mut_ptr(), 8);
        let total = FFI_HEADER_LEN + u64::from_le_bytes(len_bytes) as usize;
        drop(Box::from_raw(std::ptr::slice_from_raw_parts_mut(ptr, total)));
    }
}

/// Parse a Google Boq `batchexecute` response over C-ABI and return JSON array of envelopes.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn aphrody_boq_parse(raw_ptr: *const u8, raw_len: usize) -> *mut u8 {
    let bytes = unsafe { ffi_slice(raw_ptr, raw_len) };
    let Ok(text) = std::str::from_utf8(bytes) else {
        return ffi_pack_buffer(1, b"boq input must be valid UTF-8");
    };
    let envelopes = boq_parse_envelopes(text);
    let serialized = serde_json::to_vec(&envelopes).unwrap_or_else(|_| b"[]".to_vec());
    ffi_pack_buffer(0, &serialized)
}

#[cfg(test)]
mod tests {
    use super::*;

    /// Unpack a framed buffer, then free it through the exported destructor.
    fn take(ptr: *mut u8) -> (u8, String) {
        assert!(!ptr.is_null());
        unsafe {
            let mut len_bytes = [0u8; 8];
            std::ptr::copy_nonoverlapping(ptr, len_bytes.as_mut_ptr(), 8);
            let len = u64::from_le_bytes(len_bytes) as usize;
            let status = *ptr.add(8);
            let payload = std::slice::from_raw_parts(ptr.add(FFI_HEADER_LEN), len);
            let text = String::from_utf8(payload.to_vec()).unwrap();
            aphrody_chromium_buf_free(ptr);
            (status, text)
        }
    }

    #[test]
    fn boq_parse_rejects_invalid_utf8_and_accepts_empty_input() {
        let bad = [0xffu8, 0xfe];
        assert_eq!(take(unsafe { aphrody_boq_parse(bad.as_ptr(), bad.len()) }).0, 1);
        let (status, json) = take(unsafe { aphrody_boq_parse(std::ptr::null(), 0) });
        assert_eq!(status, 0);
        assert_eq!(json, "[]");
        unsafe { aphrody_chromium_buf_free(std::ptr::null_mut()) };
    }
}
