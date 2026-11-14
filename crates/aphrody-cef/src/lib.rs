//! Core CEF abstractions replicating `tauri-apps/cef-rs` (`cef`, `sys`, `osr`, `download-cef`)
//! unified with `aphrody-v8` (`crates/aphrody-v8`) for the Aphrody monorepo.

use aphrody_v8::{IsolateParams, resolve_v8_lib};
use serde::{Deserialize, Serialize};
use std::ffi::{CStr, CString, c_char};
use std::path::PathBuf;

pub const CEF_ABI_VERSION: u32 = 1;
pub const CEF_TARGET_API: &str = "136.0.0";

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CefSettings {
    pub no_sandbox: bool,
    pub windowless_rendering_enabled: bool,
    pub remote_debugging_port: u16,
    pub cache_path: Option<String>,
    pub user_agent: Option<String>,
    pub v8_params: IsolateParams,
}

impl Default for CefSettings {
    fn default() -> Self {
        Self {
            no_sandbox: false,
            windowless_rendering_enabled: true,
            remote_debugging_port: 0,
            cache_path: None,
            user_agent: None,
            v8_params: IsolateParams::default(),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WindowInfo {
    pub windowless_rendering_enabled: bool,
    pub width: u32,
    pub height: u32,
    pub device_scale_factor: f32,
    pub title: String,
}

impl Default for WindowInfo {
    fn default() -> Self {
        Self {
            windowless_rendering_enabled: true,
            width: 1280,
            height: 720,
            device_scale_factor: 1.0,
            title: "Aphrody CEF".into(),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BrowserSettings {
    pub windowless_frame_rate: u32,
    pub javascript: bool,
    pub webgl: bool,
    pub background_color: u32,
}

impl Default for BrowserSettings {
    fn default() -> Self {
        Self {
            windowless_frame_rate: 60,
            javascript: true,
            webgl: true,
            background_color: 0xFF000000,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProcessMessage {
    pub name: String,
    pub args_json: String,
}

pub trait LifeSpanHandler {
    fn on_after_created(&mut self, browser_id: i32);
    fn on_before_close(&mut self, browser_id: i32);
}

pub trait LoadHandler {
    fn on_loading_state_change(&mut self, is_loading: bool, can_go_back: bool, can_go_forward: bool);
    fn on_load_end(&mut self, http_status_code: i32);
}

pub trait RenderHandler {
    fn view_rect(&self) -> (u32, u32);
    fn on_paint(&mut self, width: u32, height: u32, rgba_bgra: &[u8]);
}

pub struct CefApp {
    pub settings: CefSettings,
    pub v8_flags: Vec<String>,
}

impl CefApp {
    pub fn new(settings: CefSettings) -> Result<Self, String> {
        let v8_flags = settings.v8_params.to_v8_flags()?;
        Ok(Self { settings, v8_flags })
    }

    pub fn launch_args(&self, url: &str) -> Vec<String> {
        let mut args = Vec::new();
        if self.settings.remote_debugging_port > 0 {
            args.push(format!("--remote-debugging-port={}", self.settings.remote_debugging_port));
        }
        if let Some(ua) = &self.settings.user_agent {
            args.push(format!("--user-agent={ua}"));
        }
        if !self.v8_flags.is_empty() {
            args.push(format!("--js-flags={}", self.v8_flags.join(" ")));
        }
        args.push(url.to_string());
        args
    }
}

pub fn resolve_cef_dir() -> Option<PathBuf> {
    if let Ok(d) = std::env::var("CEF_PATH") {
        let pb = PathBuf::from(d);
        if pb.exists() {
            return Some(pb);
        }
    }
    let root = std::env::var_os("SRC_ROOT")
        .map(PathBuf::from)
        .unwrap_or_else(|| PathBuf::from("C:/src"));
    let candidates = [
        root.join("third_party/chromium/cef"),
        root.join("third_party/cef"),
        root.join("packages/browser/native"),
    ];
    candidates.into_iter().find(|p| p.exists())
}

// --- C ABI Exports ---

fn out_cstr(s: String) -> *mut c_char {
    CString::new(s).map(CString::into_raw).unwrap_or(std::ptr::null_mut())
}

#[unsafe(no_mangle)]
pub extern "C" fn cef_abi_version() -> u32 {
    CEF_ABI_VERSION
}

#[unsafe(no_mangle)]
pub extern "C" fn cef_free(p: *mut c_char) {
    if !p.is_null() {
        drop(unsafe { CString::from_raw(p) });
    }
}

#[unsafe(no_mangle)]
pub extern "C" fn cef_capabilities_json() -> *mut c_char {
    out_cstr(
        serde_json::json!({
            "abi": CEF_ABI_VERSION,
            "cefApi": CEF_TARGET_API,
            "resolvedCef": resolve_cef_dir().map(|p| p.to_string_lossy().into_owned()),
            "resolvedV8": resolve_v8_lib().map(|p| p.to_string_lossy().into_owned()),
            "features": ["osr", "lifespan", "load", "render_handler", "process_message", "aphrody_v8"]
        })
        .to_string(),
    )
}

#[unsafe(no_mangle)]
pub extern "C" fn cef_build_args_json(url: *const c_char, settings_json: *const c_char) -> *mut c_char {
    let url_s = if url.is_null() {
        "about:blank"
    } else {
        unsafe { CStr::from_ptr(url) }.to_str().unwrap_or("about:blank")
    };
    let raw = if settings_json.is_null() {
        "{}"
    } else {
        unsafe { CStr::from_ptr(settings_json) }.to_str().unwrap_or("{}")
    };
    let parsed = if raw.trim().is_empty() || raw.trim() == "{}" {
        Ok(CefSettings::default())
    } else {
        serde_json::from_str::<CefSettings>(raw).map_err(|e| e.to_string())
    };
    match parsed.and_then(CefApp::new) {
        Ok(app) => out_cstr(serde_json::json!({ "ok": true, "args": app.launch_args(url_s) }).to_string()),
        Err(err) => out_cstr(serde_json::json!({ "ok": false, "error": err }).to_string()),
    }
}
