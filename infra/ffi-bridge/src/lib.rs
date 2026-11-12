//! Direct Rust -> Go 1.27 (`infra_go.dll`) Native FFI Bridge.
//! Uses `windows-sys` (`LoadLibraryA` / `GetProcAddress`) on Windows x64 to invoke
//! `GoInfraVersion`, `GoDetectProjectJSON`, `GoSignR2S3v4AuthHeader`, and `GoComputeOciDigest`.

use std::ffi::{CString, c_char, c_int, c_uchar};
use std::path::{Path, PathBuf};

#[cfg(windows)]
use windows_sys::Win32::Foundation::{FreeLibrary, HMODULE};
#[cfg(windows)]
use windows_sys::Win32::System::LibraryLoader::{GetProcAddress, LoadLibraryA};

type FnGoInfraVersion = unsafe extern "C" fn() -> i32;
type FnGoDetectProjectJSON =
    unsafe extern "C" fn(path_ptr: *const c_char, out_buf: *mut c_char, out_cap: c_int) -> c_int;
type FnGoSignR2S3v4AuthHeader = unsafe extern "C" fn(
    method: *const c_char,
    url_str: *const c_char,
    access_key: *const c_char,
    secret_key: *const c_char,
    region: *const c_char,
    payload_hash: *const c_char,
    iso_date: *const c_char,
    out_buf: *mut c_char,
    out_cap: c_int,
) -> c_int;
type FnGoComputeOciDigest = unsafe extern "C" fn(
    data_ptr: *const c_uchar,
    data_len: c_int,
    out_buf: *mut c_char,
    out_cap: c_int,
) -> c_int;

pub struct GoInfraLibrary {
    #[cfg(windows)]
    #[allow(dead_code)]
    handle: HMODULE,
    fn_version: FnGoInfraVersion,
    fn_detect: FnGoDetectProjectJSON,
    fn_sign_r2: FnGoSignR2S3v4AuthHeader,
    fn_oci_digest: FnGoComputeOciDigest,
}

// Note: Go runtime background threads inside a `-buildmode=c-shared` DLL on Windows must not be unloaded
// abruptly while goroutines settle, so `Drop` intentionally avoids `FreeLibrary` unless explicitly requested.
impl Drop for GoInfraLibrary {
    fn drop(&mut self) {
        #[cfg(windows)]
        let _ = FreeLibrary;
    }
}

pub fn default_infra_dll_path() -> PathBuf {
    if let Ok(home) = std::env::var("USERPROFILE") {
        return Path::new(&home).join(".local").join("bin").join("infra_go.dll");
    }
    PathBuf::from(r"C:\Users\aphro\.local\bin\infra_go.dll")
}

impl GoInfraLibrary {
    #[cfg(windows)]
    pub fn load(dll_path: &Path) -> Result<Self, String> {
        let path_str = dll_path
            .to_str()
            .ok_or_else(|| "invalid UTF-8 DLL path".to_string())?;
        let c_path = CString::new(path_str).map_err(|e| e.to_string())?;

        unsafe {
            let handle = LoadLibraryA(c_path.as_ptr() as *const u8);
            if handle.is_null() {
                return Err(format!("LoadLibraryA failed for {}", path_str));
            }

            let fn_version: FnGoInfraVersion =
                std::mem::transmute(resolve_sym(handle, b"GoInfraVersion\0")?);
            let fn_detect: FnGoDetectProjectJSON =
                std::mem::transmute(resolve_sym(handle, b"GoDetectProjectJSON\0")?);
            let fn_sign_r2: FnGoSignR2S3v4AuthHeader =
                std::mem::transmute(resolve_sym(handle, b"GoSignR2S3v4AuthHeader\0")?);
            let fn_oci_digest: FnGoComputeOciDigest =
                std::mem::transmute(resolve_sym(handle, b"GoComputeOciDigest\0")?);

            Ok(Self {
                handle,
                fn_version,
                fn_detect,
                fn_sign_r2,
                fn_oci_digest,
            })
        }
    }

    pub fn version(&self) -> i32 {
        unsafe { (self.fn_version)() }
    }

    pub fn detect_project_json(&self, dir_or_target: &str) -> Result<String, String> {
        let c_dir = CString::new(dir_or_target).map_err(|e| e.to_string())?;
        let mut buf = vec![0u8; 8192];
        let written = unsafe {
            (self.fn_detect)(
                c_dir.as_ptr(),
                buf.as_mut_ptr() as *mut c_char,
                buf.len() as c_int,
            )
        };
        if written <= 0 {
            return Err(format!("GoDetectProjectJSON returned {}", written));
        }
        String::from_utf8(buf[..(written as usize)].to_vec()).map_err(|e| e.to_string())
    }

    pub fn compute_oci_digest(&self, data: &[u8]) -> Result<String, String> {
        let mut buf = vec![0u8; 128];
        let ptr = if data.is_empty() {
            std::ptr::null()
        } else {
            data.as_ptr()
        };
        let written = unsafe {
            (self.fn_oci_digest)(
                ptr,
                data.len() as c_int,
                buf.as_mut_ptr() as *mut c_char,
                buf.len() as c_int,
            )
        };
        if written <= 0 {
            return Err(format!("GoComputeOciDigest returned {}", written));
        }
        String::from_utf8(buf[..(written as usize)].to_vec()).map_err(|e| e.to_string())
    }

    pub fn sign_r2_s3v4(
        &self,
        method: &str,
        url_str: &str,
        access_key: &str,
        secret_key: &str,
        region: &str,
        payload_hash: &str,
        iso_date: &str,
    ) -> Result<String, String> {
        let c_m = CString::new(method).map_err(|e| e.to_string())?;
        let c_u = CString::new(url_str).map_err(|e| e.to_string())?;
        let c_ak = CString::new(access_key).map_err(|e| e.to_string())?;
        let c_sk = CString::new(secret_key).map_err(|e| e.to_string())?;
        let c_reg = CString::new(region).map_err(|e| e.to_string())?;
        let c_ph = CString::new(payload_hash).map_err(|e| e.to_string())?;
        let c_dt = CString::new(iso_date).map_err(|e| e.to_string())?;
        let mut buf = vec![0u8; 2048];

        let written = unsafe {
            (self.fn_sign_r2)(
                c_m.as_ptr(),
                c_u.as_ptr(),
                c_ak.as_ptr(),
                c_sk.as_ptr(),
                c_reg.as_ptr(),
                c_ph.as_ptr(),
                c_dt.as_ptr(),
                buf.as_mut_ptr() as *mut c_char,
                buf.len() as c_int,
            )
        };
        if written <= 0 {
            return Err(format!("GoSignR2S3v4AuthHeader returned {}", written));
        }
        String::from_utf8(buf[..(written as usize)].to_vec()).map_err(|e| e.to_string())
    }
}

#[cfg(windows)]
unsafe fn resolve_sym(handle: HMODULE, sym_nul: &[u8]) -> Result<*const (), String> {
    let proc = unsafe { GetProcAddress(handle, sym_nul.as_ptr()) };
    match proc {
        Some(f) => Ok(f as *const ()),
        None => Err(format!(
            "GetProcAddress failed for {}",
            String::from_utf8_lossy(sym_nul)
        )),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_rust_to_go_direct_ffi_interop() {
        let dll = default_infra_dll_path();
        assert!(dll.exists(), "infra_go.dll must exist at {:?}", dll);

        let go = GoInfraLibrary::load(&dll).expect("load infra_go.dll");
        assert_eq!(go.version(), 127);

        // 1. GoDetectProjectJSON from Rust
        let json = go
            .detect_project_json(r"C:\src\crates\ring3-agent")
            .expect("detect ring3-agent");
        assert!(json.contains("\"runtime\":\"rust-daemon\""), "json={}", json);
        assert!(json.contains("\"name\":\"ring3-agent\""), "json={}", json);

        // 2. Host System32 guard enforced across Rust -> Go boundary
        assert!(go.detect_project_json(r"C:\Windows\System32").is_err());

        // 3. GoComputeOciDigest over known "abc" SHA-256 vector
        let digest = go.compute_oci_digest(b"abc").expect("compute oci digest");
        assert_eq!(
            digest,
            "sha256:ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad"
        );

        // 4. GoSignR2S3v4AuthHeader from Rust
        let auth = go
            .sign_r2_s3v4(
                "PUT",
                "https://ca22c1a51a145f919b54afa18d936516.r2.cloudflarestorage.com/aphrody-assets/bundle.tar",
                "AKIA_RUST",
                "SECRET_RUST",
                "auto",
                "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
                "20261110T220000Z",
            )
            .expect("sign r2 s3v4");
        assert!(auth.starts_with("AWS4-HMAC-SHA256 Credential=AKIA_RUST/20261110/auto/s3/aws4_request"));
    }
}
