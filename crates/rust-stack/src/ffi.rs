use crate::auth::{issue_hs256_jwt, verify_hs256_jwt};
use crate::shadcn_rs::render_card_fast;

pub const RS_ERR_NULL_PTR: i32 = -1;
pub const RS_ERR_BUFFER_TOO_SMALL: i32 = -2;
pub const RS_ERR_UTF8: i32 = -3;
pub const RS_ERR_AUTH: i32 = -4;

#[inline]
unsafe fn slice_from_raw<'a>(ptr: *const u8, len: usize) -> Option<&'a [u8]> {
    if len == 0 {
        return Some(&[]);
    }
    if ptr.is_null() {
        return None;
    }
    // SAFETY: Caller guarantees `[ptr, ptr + len)` is valid for reads when non-null and len > 0.
    Some(unsafe { std::slice::from_raw_parts(ptr, len) })
}

#[inline]
unsafe fn write_out_buffer(bytes: &[u8], out_ptr: *mut u8, out_cap: usize) -> i32 {
    if out_ptr.is_null() {
        return RS_ERR_NULL_PTR;
    }
    if bytes.len() > out_cap || bytes.len() > i32::MAX as usize {
        return RS_ERR_BUFFER_TOO_SMALL;
    }
    if !bytes.is_empty() {
        // SAFETY: `out_ptr` is non-null and `out_cap >= bytes.len()`.
        unsafe {
            std::ptr::copy_nonoverlapping(bytes.as_ptr(), out_ptr, bytes.len());
        }
    }
    if bytes.len() < out_cap {
        // Null-terminate opportunistically when capacity permits without counting NUL in byte length.
        unsafe {
            *out_ptr.add(bytes.len()) = 0;
        }
    }
    bytes.len() as i32
}

#[unsafe(no_mangle)]
pub extern "C" fn rs_abi_version() -> u32 {
    1
}

#[unsafe(no_mangle)]
pub extern "C" fn rs_blake3_hex(
    input_ptr: *const u8,
    input_len: usize,
    out_ptr: *mut u8,
    out_cap: usize,
) -> i32 {
    let Some(input) = (unsafe { slice_from_raw(input_ptr, input_len) }) else {
        return RS_ERR_NULL_PTR;
    };
    let hex_digest = blake3::hash(input).to_hex();
    unsafe { write_out_buffer(hex_digest.as_bytes(), out_ptr, out_cap) }
}

#[unsafe(no_mangle)]
pub extern "C" fn rs_auth_issue_jwt(
    subject_ptr: *const u8,
    subject_len: usize,
    secret_ptr: *const u8,
    secret_len: usize,
    ttl_secs: u64,
    out_ptr: *mut u8,
    out_cap: usize,
) -> i32 {
    let Some(subject_bytes) = (unsafe { slice_from_raw(subject_ptr, subject_len) }) else {
        return RS_ERR_NULL_PTR;
    };
    let Some(secret_bytes) = (unsafe { slice_from_raw(secret_ptr, secret_len) }) else {
        return RS_ERR_NULL_PTR;
    };
    let Ok(subject) = std::str::from_utf8(subject_bytes) else {
        return RS_ERR_UTF8;
    };
    let Ok(token) = issue_hs256_jwt(subject, secret_bytes, ttl_secs, None) else {
        return RS_ERR_AUTH;
    };
    unsafe { write_out_buffer(token.as_bytes(), out_ptr, out_cap) }
}

#[unsafe(no_mangle)]
pub extern "C" fn rs_auth_verify_jwt(
    token_ptr: *const u8,
    token_len: usize,
    secret_ptr: *const u8,
    secret_len: usize,
) -> i32 {
    let Some(token_bytes) = (unsafe { slice_from_raw(token_ptr, token_len) }) else {
        return RS_ERR_NULL_PTR;
    };
    let Some(secret_bytes) = (unsafe { slice_from_raw(secret_ptr, secret_len) }) else {
        return RS_ERR_NULL_PTR;
    };
    let Ok(token) = std::str::from_utf8(token_bytes) else {
        return RS_ERR_UTF8;
    };
    match verify_hs256_jwt(token, secret_bytes) {
        Ok(_) => 1,
        Err(_) => 0,
    }
}

#[unsafe(no_mangle)]
pub extern "C" fn rs_ui_render_card(
    title_ptr: *const u8,
    title_len: usize,
    body_ptr: *const u8,
    body_len: usize,
    out_ptr: *mut u8,
    out_cap: usize,
) -> i32 {
    let Some(title_bytes) = (unsafe { slice_from_raw(title_ptr, title_len) }) else {
        return RS_ERR_NULL_PTR;
    };
    let Some(body_bytes) = (unsafe { slice_from_raw(body_ptr, body_len) }) else {
        return RS_ERR_NULL_PTR;
    };
    let Ok(title) = std::str::from_utf8(title_bytes) else {
        return RS_ERR_UTF8;
    };
    let Ok(body) = std::str::from_utf8(body_bytes) else {
        return RS_ERR_UTF8;
    };
    let html = render_card_fast(title, body);
    unsafe { write_out_buffer(html.as_bytes(), out_ptr, out_cap) }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn ffi_abi_roundtrip_and_bounds_safety() {
        assert_eq!(rs_abi_version(), 1);

        let msg = b"linus-torvalds-grade-ffi";
        let mut hex_out = [0u8; 64];
        let written = rs_blake3_hex(msg.as_ptr(), msg.len(), hex_out.as_mut_ptr(), hex_out.len());
        assert_eq!(written, 64);
        assert_eq!(
            std::str::from_utf8(&hex_out).unwrap(),
            blake3::hash(msg).to_hex().as_str()
        );

        // Buffer too small guard
        let mut tiny = [0u8; 16];
        assert_eq!(
            rs_blake3_hex(msg.as_ptr(), msg.len(), tiny.as_mut_ptr(), tiny.len()),
            RS_ERR_BUFFER_TOO_SMALL
        );

        // JWT issue + verify
        let subj = b"usr_root";
        let secret = b"0123456789abcdef0123456789abcdef";
        let mut jwt_buf = [0u8; 512];
        let jwt_len = rs_auth_issue_jwt(
            subj.as_ptr(),
            subj.len(),
            secret.as_ptr(),
            secret.len(),
            3600,
            jwt_buf.as_mut_ptr(),
            jwt_buf.len(),
        );
        assert!(jwt_len > 40);
        let valid = rs_auth_verify_jwt(
            jwt_buf.as_ptr(),
            jwt_len as usize,
            secret.as_ptr(),
            secret.len(),
        );
        assert_eq!(valid, 1);

        let wrong_secret = b"wrong-secret-key-000000000000000";
        assert_eq!(
            rs_auth_verify_jwt(
                jwt_buf.as_ptr(),
                jwt_len as usize,
                wrong_secret.as_ptr(),
                wrong_secret.len()
            ),
            0
        );

        // Card SSR via C-ABI
        let title = b"FFI Card";
        let body = b"Zero-copy <safe> output";
        let mut html_buf = [0u8; 512];
        let html_len = rs_ui_render_card(
            title.as_ptr(),
            title.len(),
            body.as_ptr(),
            body.len(),
            html_buf.as_mut_ptr(),
            html_buf.len(),
        );
        assert!(html_len > 30);
        let rendered = std::str::from_utf8(&html_buf[..html_len as usize]).unwrap();
        assert!(rendered.contains("FFI Card"));
        assert!(rendered.contains("&lt;safe&gt;"));
    }
}
