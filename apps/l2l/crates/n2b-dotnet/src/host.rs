// SPDX-License-Identifier: Apache-2.0 OR MIT
//! Direct in-process CoreCLR (`hostfxr`) loader and `[UnmanagedCallersOnly]` dispatcher.
//! Rewrites `NodeApi.DotNetHost` (`ManagedHost.cs` + native `hostfxr` C++ bootstrap) in Pure Rust.

use n2b_core::{ErrorKind, N2bError, N2bResult};
use parking_lot::Mutex;
use rustc_hash::FxHashMap;
use serde::{Deserialize, Serialize};
use std::ffi::c_void;
use std::path::{Path, PathBuf};
use std::sync::OnceLock;
use std::time::Instant;

#[cfg(windows)]
use windows_sys::Win32::System::LibraryLoader::{GetProcAddress, LoadLibraryW};

/// `hostfxr_delegate_type::hdt_load_assembly_and_get_function_pointer` = 5 (`hostfxr.h`).
const HDT_LOAD_ASSEMBLY_AND_GET_FUNCTION_POINTER: i32 = 5;

/// `UNMANAGEDCALLERSONLY_METHOD` = `(const char_t*)-1` (`coreclr_delegates.h`).
const UNMANAGED_CALLERS_ONLY_SENTINEL: usize = usize::MAX;

type HostfxrHandle = *mut c_void;

#[cfg(windows)]
type CharT = u16;
#[cfg(not(windows))]
type CharT = u8;

type HostfxrInitializeForRuntimeConfigFn = unsafe extern "C" fn(
    runtime_config_path: *const CharT,
    parameters: *const c_void,
    host_context_handle: *mut HostfxrHandle,
) -> i32;

type HostfxrGetRuntimeDelegateFn = unsafe extern "C" fn(
    host_context_handle: HostfxrHandle,
    delegate_type: i32,
    delegate: *mut *mut c_void,
) -> i32;

type HostfxrCloseFn = unsafe extern "C" fn(host_context_handle: HostfxrHandle) -> i32;

#[cfg(windows)]
type LoadAssemblyAndGetFunctionPointerFn = unsafe extern "system" fn(
    assembly_path: *const CharT,
    type_name: *const CharT,
    method_name: *const CharT,
    delegate_type_name: *const CharT,
    reserved: *mut c_void,
    delegate: *mut *mut c_void,
) -> i32;

#[cfg(not(windows))]
type LoadAssemblyAndGetFunctionPointerFn = unsafe extern "C" fn(
    assembly_path: *const CharT,
    type_name: *const CharT,
    method_name: *const CharT,
    delegate_type_name: *const CharT,
    reserved: *mut c_void,
    delegate: *mut *mut c_void,
) -> i32;

/// UTF-8 JSON envelope signature for universal `[UnmanagedCallersOnly]` methods:
/// `int Method(byte* reqPtr, int reqLen, byte* respBuf, int respCap)` -> bytes written (or negative on error).
pub type UnmanagedJsonCallFn = unsafe extern "C" fn(
    req_ptr: *const u8,
    req_len: i32,
    resp_buf: *mut u8,
    resp_cap: i32,
) -> i32;

/// Zero-GC scalar `[UnmanagedCallersOnly]` signature (`long Method(long a, long b)`).
pub type UnmanagedScalarI64PairFn = unsafe extern "C" fn(a: i64, b: i64) -> i64;

/// Zero-copy SIMD/span `[UnmanagedCallersOnly]` signature (`double Method(double* ptr, int len)`).
pub type UnmanagedF64SpanFn = unsafe extern "C" fn(ptr: *const f64, len: i32) -> f64;

/// Callback signature allowing .NET to invoke Rust / Bun JS callbacks synchronously in-process.
pub type ReverseHostCallbackFn = unsafe extern "C" fn(x: i64) -> i64;
pub type UnmanagedCallbackBridgeFn =
    unsafe extern "C" fn(seed: i64, cb: ReverseHostCallbackFn) -> i64;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DotNetDoctorReport {
    pub dotnet_root: String,
    pub hostfxr_path: String,
    pub hostfxr_version: String,
    pub sdks_installed: Vec<String>,
    pub netcore_runtimes: Vec<String>,
    pub in_process_ready: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DotNetInvokeReport {
    pub assembly_path: String,
    pub type_name: String,
    pub method_name: String,
    pub mode: String,
    pub response_json: serde_json::Value,
    pub scalar_benchmark_ops_per_sec: Option<f64>,
    pub elapsed_ms: f64,
}

struct HostfxrApi {
    hostfxr_path: PathBuf,
    init_for_config: HostfxrInitializeForRuntimeConfigFn,
    get_delegate: HostfxrGetRuntimeDelegateFn,
    close_ctx: HostfxrCloseFn,
    cached_loader: Mutex<Option<LoadAssemblyAndGetFunctionPointerFn>>,
    cached_fn_ptrs: Mutex<FxHashMap<String, usize>>,
}

// SAFETY: `HostfxrApi` holds immutable OS DLL function pointers resolved once from `hostfxr.dll`
// and synchronizes mutable delegate/symbol caches behind `parking_lot::Mutex`.
unsafe impl Send for HostfxrApi {}
// SAFETY: All interior state access is serialized via `parking_lot::Mutex`, and CoreCLR's
// `load_assembly_and_get_function_pointer` delegate is thread-safe per CoreCLR hosting spec.
unsafe impl Sync for HostfxrApi {}

static GLOBAL_HOSTFXR: OnceLock<Result<HostfxrApi, N2bError>> = OnceLock::new();

pub struct CoreClrHost;

impl CoreClrHost {
    /// Discovers the highest installed `hostfxr.dll` (`10.0.*` / `11.0.*`) without touching `System32`.
    pub fn discover_dotnet_root() -> N2bResult<(PathBuf, PathBuf, String)> {
        let candidates = [
            std::env::var("DOTNET_ROOT").ok().map(PathBuf::from),
            Some(PathBuf::from("C:/Program Files/dotnet")),
            Some(PathBuf::from("/usr/share/dotnet")),
            Some(PathBuf::from("/usr/local/share/dotnet")),
        ];

        for root_opt in candidates.into_iter().flatten() {
            let fxr_base = root_opt.join("host").join("fxr");
            if !fxr_base.exists() {
                continue;
            }
            struct FxrCandidate {
                key: (u32, u32, u32, bool),
                ver: String,
                dll: PathBuf,
            }
            let mut versions: Vec<FxrCandidate> = Vec::new();
            if let Ok(entries) = std::fs::read_dir(&fxr_base) {
                for entry in entries.flatten() {
                    let ver_name = entry.file_name().to_string_lossy().to_string();
                    let dll_name = if cfg!(windows) {
                        "hostfxr.dll"
                    } else if cfg!(target_os = "macos") {
                        "libhostfxr.dylib"
                    } else {
                        "libhostfxr.so"
                    };
                    let dll_path = entry.path().join(dll_name);
                    if dll_path.exists() {
                        let key = parse_semver_key(&ver_name);
                        versions.push(FxrCandidate {
                            key,
                            ver: ver_name,
                            dll: dll_path,
                        });
                    }
                }
            }
            // Prefer stable releases (e.g. 10.0.14) first, or highest version
            versions.sort_by_key(|a| std::cmp::Reverse(a.key));
            if let Some(best) = versions.into_iter().next() {
                return Ok((root_opt, best.dll, best.ver));
            }
        }

        Err(N2bError::new(
            ErrorKind::InvalidConfig,
            "CoreCLR hostfxr not found under DOTNET_ROOT or C:/Program Files/dotnet",
        ))
    }

    fn api() -> N2bResult<&'static HostfxrApi> {
        GLOBAL_HOSTFXR
            .get_or_init(Self::load_hostfxr_api)
            .as_ref()
            .map_err(Clone::clone)
    }

    #[cfg(windows)]
    fn load_hostfxr_api() -> N2bResult<HostfxrApi> {
        let (_root, dll_path, _ver) = Self::discover_dotnet_root()?;
        let wide_dll = encode_pal_string(&dll_path.to_string_lossy());

        // SAFETY: `wide_dll` is a valid NUL-terminated UTF-16 path to `hostfxr.dll`.
        let module = unsafe { LoadLibraryW(wide_dll.as_ptr()) };
        if module.is_null() {
            return Err(N2bError::new(
                ErrorKind::SubprocessFailed,
                format!("LoadLibraryW failed for {}", dll_path.display()),
            ));
        }

        let init_sym = resolve_win32_proc(module, b"hostfxr_initialize_for_runtime_config\0")?;
        let get_del_sym = resolve_win32_proc(module, b"hostfxr_get_runtime_delegate\0")?;
        let close_sym = resolve_win32_proc(module, b"hostfxr_close\0")?;

        // SAFETY: Symbol addresses were resolved from official Microsoft `hostfxr.dll` exports
        // matching the exact `extern "C"` typedefs in `hostfxr.h`.
        let (init_for_config, get_delegate, close_ctx) = unsafe {
            (
                core::mem::transmute::<*const c_void, HostfxrInitializeForRuntimeConfigFn>(init_sym),
                core::mem::transmute::<*const c_void, HostfxrGetRuntimeDelegateFn>(get_del_sym),
                core::mem::transmute::<*const c_void, HostfxrCloseFn>(close_sym),
            )
        };

        Ok(HostfxrApi {
            hostfxr_path: dll_path,
            init_for_config,
            get_delegate,
            close_ctx,
            cached_loader: Mutex::new(None),
            cached_fn_ptrs: Mutex::new(FxHashMap::default()),
        })
    }

    #[cfg(not(windows))]
    fn load_hostfxr_api() -> N2bResult<HostfxrApi> {
        Err(N2bError::new(
            ErrorKind::UnsupportedArchitecture,
            "Non-Windows dlopen path not active on Windows NT host",
        ))
    }

    fn ensure_loader(
        api: &HostfxrApi,
        runtime_config_path: &Path,
    ) -> N2bResult<LoadAssemblyAndGetFunctionPointerFn> {
        if let Some(loader) = *api.cached_loader.lock() {
            return Ok(loader);
        }

        if !runtime_config_path.exists() {
            return Err(N2bError::new(
                ErrorKind::InvalidPath,
                format!("missing .runtimeconfig.json: {}", runtime_config_path.display()),
            ));
        }

        let cfg_pal = encode_pal_string(&runtime_config_path.to_string_lossy());
        let mut ctx_handle: HostfxrHandle = core::ptr::null_mut();

        // SAFETY: `cfg_pal` is NUL-terminated UTF-16, `parameters` is optional NULL, and `ctx_handle`
        // is a valid stack out-pointer. Status codes 0 (`Success`), 1 (`Success_HostAlreadyInitialized`),
        // and 2 (`Success_DifferentRuntimeProperties`) all denote valid initialized CoreCLR contexts.
        let rc = unsafe {
            (api.init_for_config)(cfg_pal.as_ptr(), core::ptr::null(), &mut ctx_handle)
        };
        if rc < 0 || ctx_handle.is_null() {
            return Err(N2bError::new(
                ErrorKind::SubprocessFailed,
                format!("hostfxr_initialize_for_runtime_config failed with 0x{:08x}", rc as u32),
            ));
        }

        let mut delegate_ptr: *mut c_void = core::ptr::null_mut();
        // SAFETY: `ctx_handle` was initialized above; `HDT_LOAD_ASSEMBLY_AND_GET_FUNCTION_POINTER` (5)
        // populates `delegate_ptr` with a `load_assembly_and_get_function_pointer_fn`.
        let del_rc = unsafe {
            (api.get_delegate)(
                ctx_handle,
                HDT_LOAD_ASSEMBLY_AND_GET_FUNCTION_POINTER,
                &mut delegate_ptr,
            )
        };
        // SAFETY: Closing `ctx_handle` after retrieving the runtime delegate is recommended by `hostfxr.h`
        // and keeps the loaded CoreCLR runtime active for the lifetime of the process.
        unsafe {
            let _ = (api.close_ctx)(ctx_handle);
        }

        if del_rc < 0 || delegate_ptr.is_null() {
            return Err(N2bError::new(
                ErrorKind::SubprocessFailed,
                format!("hostfxr_get_runtime_delegate failed with 0x{:08x}", del_rc as u32),
            ));
        }

        // SAFETY: `delegate_ptr` matches `load_assembly_and_get_function_pointer_fn` (`__stdcall` on Win64).
        let loader: LoadAssemblyAndGetFunctionPointerFn =
            unsafe { core::mem::transmute::<*mut c_void, LoadAssemblyAndGetFunctionPointerFn>(delegate_ptr) };

        let mut guard = api.cached_loader.lock();
        *guard = Some(loader);
        Ok(loader)
    }

    /// Resolves a raw `[UnmanagedCallersOnly]` function pointer from a `.NET` assembly in-process.
    pub fn get_unmanaged_function_pointer(
        assembly_path: &Path,
        runtime_config_path: &Path,
        type_name: &str,
        method_name: &str,
    ) -> N2bResult<*const c_void> {
        let api = Self::api()?;
        let abs_asm = std::fs::canonicalize(assembly_path)
            .unwrap_or_else(|_| assembly_path.to_path_buf());
        let clean_asm_str = strip_verbatim_prefix(&abs_asm.to_string_lossy());
        let cache_key = format!("{clean_asm_str}::{type_name}::{method_name}");

        if let Some(&addr) = api.cached_fn_ptrs.lock().get(&cache_key) {
            return Ok(addr as *const c_void);
        }

        let loader = Self::ensure_loader(api, runtime_config_path)?;
        let asm_pal = encode_pal_string(&clean_asm_str);
        let type_pal = encode_pal_string(type_name);
        let method_pal = encode_pal_string(method_name);
        let mut fn_ptr: *mut c_void = core::ptr::null_mut();

        // SAFETY: All string pointers are NUL-terminated UTF-16 buffers outliving the call,
        // `UNMANAGED_CALLERS_ONLY_SENTINEL` (`usize::MAX as *const CharT`) instructs CoreCLR to
        // bind `[UnmanagedCallersOnly]` directly without delegate wrapper allocation.
        let rc = unsafe {
            loader(
                asm_pal.as_ptr(),
                type_pal.as_ptr(),
                method_pal.as_ptr(),
                UNMANAGED_CALLERS_ONLY_SENTINEL as *const CharT,
                core::ptr::null_mut(),
                &mut fn_ptr,
            )
        };

        if rc < 0 || fn_ptr.is_null() {
            let _ = &api.hostfxr_path;
            return Err(N2bError::new(
                ErrorKind::SubprocessFailed,
                format!(
                    "load_assembly_and_get_function_pointer({type_name}::{method_name}) failed: 0x{:08x}",
                    rc as u32
                ),
            ));
        }

        api.cached_fn_ptrs.lock().insert(cache_key, fn_ptr as usize);
        Ok(fn_ptr as *const c_void)
    }

    /// Invokes a `[UnmanagedCallersOnly]` UTF-8 JSON endpoint in-process (zero V8 / zero Node-API).
    pub fn invoke_json(
        assembly_path: &Path,
        runtime_config_path: &Path,
        type_name: &str,
        method_name: &str,
        request_json: &str,
    ) -> N2bResult<DotNetInvokeReport> {
        let t0 = Instant::now();
        let raw_ptr = Self::get_unmanaged_function_pointer(
            assembly_path,
            runtime_config_path,
            type_name,
            method_name,
        )?;

        // SAFETY: Caller / generator contract guarantees `method_name` has signature
        // `int(byte* reqPtr, int reqLen, byte* respBuf, int respCap)` with `CallConvCdecl` / C ABI.
        let func: UnmanagedJsonCallFn =
            unsafe { core::mem::transmute::<*const c_void, UnmanagedJsonCallFn>(raw_ptr) };

        let req_bytes = request_json.as_bytes();
        let mut resp_buf = vec![0u8; 64 * 1024];

        // SAFETY: `req_bytes` is valid for `req_bytes.len()` reads and `resp_buf` is valid for
        // `resp_buf.len()` mutable byte writes during the synchronous CoreCLR call.
        let written = unsafe {
            func(
                req_bytes.as_ptr(),
                req_bytes.len() as i32,
                resp_buf.as_mut_ptr(),
                resp_buf.len() as i32,
            )
        };

        if written < 0 {
            return Err(N2bError::new(
                ErrorKind::SubprocessFailed,
                format!(".NET method {method_name} returned error code {written}"),
            ));
        }

        let slice = &resp_buf[..(written as usize).min(resp_buf.len())];
        let parsed: serde_json::Value = serde_json::from_slice(slice).unwrap_or_else(|_| {
            serde_json::json!({ "raw_utf8": String::from_utf8_lossy(slice) })
        });

        Ok(DotNetInvokeReport {
            assembly_path: strip_verbatim_prefix(&assembly_path.to_string_lossy()),
            type_name: type_name.to_string(),
            method_name: method_name.to_string(),
            mode: "in-process-coreclr-hostfxr-unmanagedcallersonly".to_string(),
            response_json: parsed,
            scalar_benchmark_ops_per_sec: None,
            elapsed_ms: t0.elapsed().as_secs_f64() * 1000.0,
        })
    }

    /// Invokes a zero-GC scalar `i64(i64, i64)` method and optionally benchmarks million-ops/sec throughput.
    pub fn invoke_scalar_i64_pair(
        assembly_path: &Path,
        runtime_config_path: &Path,
        type_name: &str,
        method_name: &str,
        a: i64,
        b: i64,
        bench_iterations: usize,
    ) -> N2bResult<(i64, f64)> {
        let raw_ptr = Self::get_unmanaged_function_pointer(
            assembly_path,
            runtime_config_path,
            type_name,
            method_name,
        )?;
        // SAFETY: Method has `[UnmanagedCallersOnly(CallConvs = [typeof(CallConvCdecl)])]` `(long, long) -> long`.
        let func: UnmanagedScalarI64PairFn =
            unsafe { core::mem::transmute::<*const c_void, UnmanagedScalarI64PairFn>(raw_ptr) };

        // SAFETY: Pure register-only C-ABI call into CoreCLR JIT/TieredPGO code.
        let single_result = unsafe { func(a, b) };

        let iters = bench_iterations.max(1);
        let t0 = Instant::now();
        let mut acc = 0i64;
        for i in 0..iters {
            // SAFETY: Register-only C-ABI call.
            let v = unsafe { func(a.wrapping_add(i as i64), b) };
            acc ^= v;
        }
        std::hint::black_box(acc);
        let secs = t0.elapsed().as_secs_f64().max(1e-9);
        let ops_per_sec = (iters as f64) / secs;
        Ok((single_result, ops_per_sec))
    }

    /// Demonstrates bidirectional `.NET <-> Rust` callback invocation in-process (replacing `JSCallback`).
    pub fn invoke_with_rust_callback(
        assembly_path: &Path,
        runtime_config_path: &Path,
        type_name: &str,
        method_name: &str,
        seed: i64,
        cb: ReverseHostCallbackFn,
    ) -> N2bResult<i64> {
        let raw_ptr = Self::get_unmanaged_function_pointer(
            assembly_path,
            runtime_config_path,
            type_name,
            method_name,
        )?;
        // SAFETY: Method accepts `(long seed, delegate* unmanaged[Cdecl]<long, long> cb) -> long`.
        let func: UnmanagedCallbackBridgeFn =
            unsafe { core::mem::transmute::<*const c_void, UnmanagedCallbackBridgeFn>(raw_ptr) };
        // SAFETY: `cb` is a valid `extern "C"` Rust function pointer valid for `'static`.
        let out = unsafe { func(seed, cb) };
        Ok(out)
    }
}

#[cfg(windows)]
fn resolve_win32_proc(
    module: windows_sys::Win32::Foundation::HMODULE,
    symbol_nul: &[u8],
) -> N2bResult<*const c_void> {
    // SAFETY: `module` is a loaded HMODULE and `symbol_nul` is a NUL-terminated ASCII export name.
    let proc_opt = unsafe { GetProcAddress(module, symbol_nul.as_ptr()) };
    match proc_opt {
        Some(f) => Ok(f as *const c_void),
        None => Err(N2bError::new(
            ErrorKind::SubprocessFailed,
            format!(
                "GetProcAddress missing symbol {}",
                String::from_utf8_lossy(symbol_nul).trim_end_matches('\0')
            ),
        )),
    }
}

#[cfg(windows)]
fn encode_pal_string(s: &str) -> Vec<u16> {
    s.encode_utf16().chain(core::iter::once(0)).collect()
}

#[cfg(not(windows))]
fn encode_pal_string(s: &str) -> Vec<u8> {
    let mut v = s.as_bytes().to_vec();
    v.push(0);
    v
}

fn strip_verbatim_prefix(p: &str) -> String {
    p.strip_prefix(r"\\?\").unwrap_or(p).to_string()
}

fn parse_semver_key(ver: &str) -> (u32, u32, u32, bool) {
    let is_stable = !ver.contains('-');
    let core_part = ver.split('-').next().unwrap_or(ver);
    let mut nums = core_part.split('.').map(|x| x.parse::<u32>().unwrap_or(0));
    let major = nums.next().unwrap_or(0);
    let minor = nums.next().unwrap_or(0);
    let patch = nums.next().unwrap_or(0);
    // Prefer stable builds first (`is_stable = true` > `false`), or highest stable major (e.g., 10.0.14)
    (if is_stable { 1 } else { 0 }, major, minor, patch != 0)
}

/// Inspects installed `.NET` SDKs, `Microsoft.NETCore.App` runtimes, and `hostfxr.dll` readiness.
pub fn probe_dotnet_environment() -> N2bResult<DotNetDoctorReport> {
    let (root, hostfxr, ver) = CoreClrHost::discover_dotnet_root()?;
    let mut sdks = Vec::new();
    if let Ok(rd) = std::fs::read_dir(root.join("sdk")) {
        for e in rd.flatten() {
            let name = e.file_name().to_string_lossy().to_string();
            if name.chars().next().is_some_and(|c| c.is_ascii_digit()) {
                sdks.push(name);
            }
        }
    }
    sdks.sort();

    let mut runtimes = Vec::new();
    if let Ok(rd) = std::fs::read_dir(root.join("shared").join("Microsoft.NETCore.App")) {
        for e in rd.flatten() {
            runtimes.push(e.file_name().to_string_lossy().to_string());
        }
    }
    runtimes.sort();

    let in_process_ready = CoreClrHost::api().is_ok();

    Ok(DotNetDoctorReport {
        dotnet_root: root.to_string_lossy().replace('\\', "/"),
        hostfxr_path: hostfxr.to_string_lossy().replace('\\', "/"),
        hostfxr_version: ver,
        sdks_installed: sdks,
        netcore_runtimes: runtimes,
        in_process_ready,
    })
}
