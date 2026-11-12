//! Android NativeActivity / JNI C-ABI bridge around `aphrody-core`.
//! Exports zero-copy JSON-RPC WebMCP and layout state entrypoints callable from Kotlin/NDK.

use aphrody_core::layout::Rect;
use aphrody_core::state::{AppState, builtin_registry};
use aphrody_core::webmcp::ToolRegistry;
use std::ffi::{CStr, CString};
use std::os::raw::c_char;
use std::sync::{Mutex, OnceLock};

struct AndroidHost {
    state: Mutex<AppState>,
    registry: ToolRegistry<AppState>,
}

fn host() -> &'static AndroidHost {
    static INSTANCE: OnceLock<AndroidHost> = OnceLock::new();
    INSTANCE.get_or_init(|| AndroidHost {
        state: Mutex::new(AppState::in_memory(Rect::new(0.0, 0.0, 1080.0, 2400.0))),
        registry: builtin_registry(),
    })
}

/// Resize the Android surface viewport in physical pixels.
#[unsafe(no_mangle)]
pub extern "C" fn aphrody_android_resize(width: f32, height: f32) {
    if let Ok(mut st) = host().state.lock() {
        st.wm.output = Rect::new(0.0, 0.0, width.max(1.0), height.max(1.0));
    }
}

/// Dispatch a JSON-RPC 2.0 WebMCP request from Android JNI/NDK and return a heap C string
/// to be freed via `aphrody_android_string_free`.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn aphrody_android_rpc(json_utf8: *const c_char) -> *mut c_char {
    if json_utf8.is_null() {
        return std::ptr::null_mut();
    }
    let req = unsafe { CStr::from_ptr(json_utf8) }.to_string_lossy();
    let h = host();
    let reply = match h.state.lock() {
        Ok(mut st) => h
            .registry
            .handle_jsonrpc(&mut st, &req, "aphrody-android", aphrody_core::VERSION)
            .unwrap_or_else(|| "{}".to_string()),
        Err(_) => r#"{"jsonrpc":"2.0","id":null,"error":{"code":-32603,"message":"poisoned"}}"#.to_string(),
    };
    CString::new(reply).map(CString::into_raw).unwrap_or(std::ptr::null_mut())
}

/// Free a C string returned by `aphrody_android_rpc`.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn aphrody_android_string_free(ptr: *mut c_char) {
    if !ptr.is_null() {
        unsafe {
            let _ = CString::from_raw(ptr);
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn android_c_abi_roundtrip() {
        aphrody_android_resize(1440.0, 3120.0);
        let req = CString::new(r#"{"jsonrpc":"2.0","id":1,"method":"tools/list"}"#).unwrap();
        let out_ptr = unsafe { aphrody_android_rpc(req.as_ptr()) };
        assert!(!out_ptr.is_null());
        let out_str = unsafe { CStr::from_ptr(out_ptr) }.to_str().unwrap().to_string();
        unsafe { aphrody_android_string_free(out_ptr) };
        assert!(out_str.contains("aphrody_windows_list"));
    }
}
