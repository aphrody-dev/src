//! C ABI of the HAL, shipped as `dx12_hal.dll` (replaces infra/winnt-sdk's `native_nt_gpu.dll`).
//!
//! Contract (mirrored by `packages/ffi-bridge/src/dx12-hal.ts`):
//! - Resolve [`dx12_hal_abi_version`] alone first and refuse a different version.
//! - Strings out are NUL-terminated UTF-8 JSON owned by the library, released with [`dx12_hal_free`].
//! - Errors come back as `{"error": "..."}` JSON.

use crate::adapter::{list_adapters, AdapterInfo};
use crate::device::Dx12Context;
use std::ffi::{c_char, CString};

/// Bumped on any incompatible signature change.
pub const DX12_HAL_ABI_VERSION: u32 = 1;

fn out(s: String) -> *mut c_char {
    CString::new(s).map(CString::into_raw).unwrap_or(std::ptr::null_mut())
}

fn err(msg: impl std::fmt::Display) -> *mut c_char {
    out(serde_json::json!({ "error": msg.to_string() }).to_string())
}

fn adapter_json(a: &AdapterInfo) -> serde_json::Value {
    serde_json::json!({
        "index": a.index,
        "name": a.name,
        "vendor_id": a.vendor_id,
        "device_id": a.device_id,
        "sub_sys_id": a.sub_sys_id,
        "revision": a.revision,
        "dedicated_video_memory": a.dedicated_video_memory,
        "dedicated_system_memory": a.dedicated_system_memory,
        "shared_system_memory": a.shared_system_memory,
        "luid": a.luid_u64(),
        "is_hardware": a.is_hardware,
    })
}

#[unsafe(no_mangle)]
pub extern "C" fn dx12_hal_abi_version() -> u32 {
    DX12_HAL_ABI_VERSION
}

/// Release a string returned by any `dx12_hal_*` function. Null is a no-op.
///
/// # Safety
/// `p` must come from a `dx12_hal_*` function and be released once.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn dx12_hal_free(p: *mut c_char) {
    if !p.is_null() {
        // SAFETY: `p` was produced by `CString::into_raw` in this module.
        drop(unsafe { CString::from_raw(p) });
    }
}

/// DXGI adapters in high-performance order: `[{"name", "vendor_id", ..., "is_hardware"}]`.
#[unsafe(no_mangle)]
pub extern "C" fn dx12_hal_adapters_json() -> *mut c_char {
    match list_adapters() {
        Ok(all) => out(serde_json::Value::Array(all.iter().map(|(_, a)| adapter_json(a)).collect()).to_string()),
        Err(e) => err(e),
    }
}

/// D3D12 device on the high-performance adapter: `{"adapter": {...}, "feature_level", "raytracing_tier", ...}`.
#[unsafe(no_mangle)]
pub extern "C" fn dx12_hal_device_json() -> *mut c_char {
    match Dx12Context::new() {
        Ok(ctx) => {
            let f = &ctx.ultimate_features;
            out(serde_json::json!({
                "adapter": adapter_json(&ctx.adapter_info),
                "feature_level": f.feature_level,
                "raytracing_tier": f.raytracing_tier,
                "mesh_shader_tier": f.mesh_shader_tier,
                "variable_shading_rate_tier": f.variable_shading_rate_tier,
                "sampler_feedback_tier": f.sampler_feedback_tier,
                "wave_ops": f.wave_ops,
                "wave_lane_count_min": f.wave_lane_count_min,
                "wave_lane_count_max": f.wave_lane_count_max,
            })
            .to_string())
        }
        Err(e) => err(e),
    }
}
