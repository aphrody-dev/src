//! `build-dist`: assemble the static web bundle (wasm, glue, WGSL, SEO and
//! agent-discovery files). Content is generated here so the bundle is
//! reproducible from the binary alone.

use aphrody_core::state::builtin_registry;
use std::path::{Path, PathBuf};
use std::process::Command;

pub const INDEX_TEMPLATE: &str = include_str!("../../../web/index.html");
pub const SHADER: &str = include_str!("../../aphrody-wasm/shaders/mica.wgsl");
pub const DOMAIN: &str = "https://aphrody.app";

pub struct Opts {
    pub root: PathBuf,
    pub out: PathBuf,
    pub skip_build: bool,
}

fn run(cmd: &mut Command, what: &str) -> Result<(), String> {
    let st = cmd.status().map_err(|e| format!("{what}: {e}"))?;
    if st.success() { Ok(()) } else { Err(format!("{what} failed with {st}")) }
}

/// Locate the cargo target directory honoring CARGO_TARGET_DIR.
pub fn target_dir(root: &Path) -> PathBuf {
    std::env::var_os("CARGO_TARGET_DIR").map(PathBuf::from).unwrap_or_else(|| root.join("target"))
}

fn build_wasm(root: &Path) -> Result<PathBuf, String> {
    let mut cmd = Command::new("cargo");
    cmd.current_dir(root).args(["build", "-p", "aphrody-wasm", "--target", "wasm32-unknown-unknown", "--profile", "wasm-release"]);
    if cfg!(windows) {
        // web-sys passes a command line too long for sccache on Windows; use the argfile wrapper.
        let exe = root.join("tools").join("bin").join("rustc_argfile.exe");
        if !exe.exists() {
            std::fs::create_dir_all(exe.parent().unwrap()).map_err(|e| e.to_string())?;
            run(Command::new("rustc").current_dir(root).args(["-O", "tools/rustc_argfile.rs", "-o"]).arg(&exe), "rustc wrapper")?;
        }
        cmd.env("RUSTC_WRAPPER", &exe);
    }
    run(&mut cmd, "cargo build (wasm32)")?;
    Ok(target_dir(root).join("wasm32-unknown-unknown").join("wasm-release").join("aphrody_app_wasm.wasm"))
}

pub fn short_hash(bytes: &[u8]) -> String {
    blake3::hash(bytes).to_hex()[..10].to_string()
}

pub fn robots_txt() -> String {
    let mut s = String::from("User-agent: *\nAllow: /\n\n");
    for bot in ["GPTBot", "ChatGPT-User", "OAI-SearchBot", "ClaudeBot", "Claude-User", "Google-Extended", "PerplexityBot", "Applebot-Extended", "CCBot"] {
        s.push_str(&format!("User-agent: {bot}\nAllow: /\n\n"));
    }
    s.push_str(&format!("Sitemap: {DOMAIN}/sitemap.xml\n"));
    s
}

pub fn sitemap_xml() -> String {
    let urls = ["/", "/llms.txt", "/.well-known/webmcp.json", "/releases/manifest.json"];
    let mut s = String::from("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">\n");
    for u in urls {
        s.push_str(&format!("  <url><loc>{DOMAIN}{u}</loc></url>\n"));
    }
    s.push_str("</urlset>\n");
    s
}

pub fn llms_txt() -> String {
    let reg = builtin_registry();
    let tools: String = reg.names().iter().map(|n| format!("- {n}\n")).collect();
    format!(
        "# Aphrody\n\n> Pure Rust tiling window shell rendered with WebGPU and WGSL. The same codebase builds for the browser (wasm32), Windows, static Linux musl and Android.\n\n\
## What it is\n\n- Wayland-style window manager model (wire framing, workspaces, dwindle, cosmic grid, niri scroll, floating layouts). This is a protocol and layout simulation, not a real compositor.\n\
- Fluid-style sequenced operations (SharedMap, SharedString, SharedCounter) with a total-order sequencer.\n\
- Content-addressed Blake3 block store with a path-based VFS and write-ahead log; OPFS in the browser.\n\
- WebMCP tools exposed through navigator.modelContext and an HTTP JSON-RPC endpoint.\n\n\
## Machine-readable endpoints\n\n- [WebMCP tool manifest]({DOMAIN}/.well-known/webmcp.json)\n- JSON-RPC 2.0 endpoint: {DOMAIN}/mcp (native host only)\n- [Releases]({DOMAIN}/releases/manifest.json)\n\n\
## Tools\n\n{tools}"
    )
}

pub fn manifest_webmanifest() -> String {
    serde_json::to_string_pretty(&serde_json::json!({
        "name": "Aphrody",
        "short_name": "Aphrody",
        "description": "Pure Rust tiling window shell on WebGPU",
        "start_url": "/",
        "scope": "/",
        "display": "standalone",
        "background_color": "#0F0F0F",
        "theme_color": "#0F0F0F",
        "icons": [
            {"src": "/icon.svg", "sizes": "any", "type": "image/svg+xml", "purpose": "any"},
            {"src": "/icon-192.png", "sizes": "192x192", "type": "image/png"},
            {"src": "/icon-512.png", "sizes": "512x512", "type": "image/png"},
            {"src": "/maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable"}
        ],
    }))
    .unwrap()
        + "\n"
}

/// Brand icon of aphrody.app, written to web/ by `ay brand build --deploy` (assets/brand).
pub fn icon_svg() -> &'static str {
    include_str!("../../../web/favicon.svg")
}

pub fn headers_file() -> String {
    "/*\n  Cross-Origin-Opener-Policy: same-origin\n  Cross-Origin-Embedder-Policy: require-corp\n  Cross-Origin-Resource-Policy: same-origin\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n\
/*.wasm\n  Content-Type: application/wasm\n  Cache-Control: public, max-age=31536000, immutable\n\
/*.js\n  Content-Type: text/javascript; charset=utf-8\n  Cache-Control: public, max-age=31536000, immutable\n\
/*.wgsl\n  Content-Type: text/plain; charset=utf-8\n  Cache-Control: public, max-age=31536000, immutable\n\
/index.html\n  Cache-Control: no-cache\n\
/\n  Cache-Control: no-cache\n\
/.well-known/webmcp.json\n  Content-Type: application/json\n  Access-Control-Allow-Origin: *\n  Cache-Control: public, max-age=300\n\
/manifest.webmanifest\n  Content-Type: application/manifest+json\n"
        .to_string()
}

fn write(out: &Path, rel: &str, bytes: &[u8]) -> Result<(), String> {
    let p = out.join(rel);
    std::fs::create_dir_all(p.parent().unwrap()).map_err(|e| e.to_string())?;
    std::fs::write(&p, bytes).map_err(|e| format!("{}: {e}", p.display()))
}

/// Build the dist directory. Returns a list of (relative path, size).
pub fn build(o: &Opts) -> Result<Vec<(String, usize)>, String> {
    let wasm_path = if o.skip_build {
        target_dir(&o.root).join("wasm32-unknown-unknown").join("wasm-release").join("aphrody_app_wasm.wasm")
    } else {
        build_wasm(&o.root)?
    };
    if !wasm_path.exists() {
        return Err(format!("missing {} (build the wasm crate first)", wasm_path.display()));
    }
    let tmp = std::env::temp_dir().join(format!("aphrody-bindgen-{}", std::process::id()));
    let _ = std::fs::remove_dir_all(&tmp);
    run(
        Command::new("wasm-bindgen").args(["--target", "web", "--no-typescript", "--out-name", "aphrody_app_wasm", "--out-dir"]).arg(&tmp).arg(&wasm_path),
        "wasm-bindgen",
    )?;
    let mut wasm = std::fs::read(tmp.join("aphrody_app_wasm_bg.wasm")).map_err(|e| e.to_string())?;
    let mut js = std::fs::read_to_string(tmp.join("aphrody_app_wasm.js")).map_err(|e| e.to_string())?;
    js = js.replace("aphrody_app_wasm_bg.wasm", "aphrody_app_wasm.wasm");
    // Optional size optimization when binaryen is installed.
    let opt_in = tmp.join("in.wasm");
    let opt_out = tmp.join("out.wasm");
    if std::fs::write(&opt_in, &wasm).is_ok()
        && Command::new("wasm-opt").args(["-Oz", "--enable-bulk-memory", "--enable-sign-ext", "--enable-nontrapping-float-to-int", "--enable-reference-types", "-o"]).arg(&opt_out).arg(&opt_in).status().map(|s| s.success()).unwrap_or(false)
    {
        if let Ok(b) = std::fs::read(&opt_out) {
            wasm = b;
        }
    }
    let _ = std::fs::remove_dir_all(&tmp);
    if wasm.len() < 8 || &wasm[..4] != b"\0asm" {
        return Err("produced file is not a WebAssembly binary".into());
    }
    let v = short_hash(&[wasm.as_slice(), js.as_bytes()].concat());
    let index = INDEX_TEMPLATE.replace("/aphrody_app_wasm.js'", &format!("/aphrody_app_wasm.js?v={v}'")).replace("/aphrody_app_wasm.wasm'", &format!("/aphrody_app_wasm.wasm?v={v}'")).replace("href=\"/aphrody_app_wasm.js\"", &format!("href=\"/aphrody_app_wasm.js?v={v}\""));
    let reg = builtin_registry();
    let webmcp = serde_json::to_string_pretty(&reg.well_known("aphrody-app", "Window manager, VFS and shared document tools for Aphrody", "/mcp")).unwrap() + "\n";
    if o.out.exists() {
        // Only remove generated content, never anything outside the chosen dist directory.
        for e in std::fs::read_dir(&o.out).map_err(|e| e.to_string())?.flatten() {
            if e.file_name() != "native" && e.file_name() != "releases" {
                let p = e.path();
                let _ = if p.is_dir() { std::fs::remove_dir_all(&p) } else { std::fs::remove_file(&p) };
            }
        }
    }
    let files: Vec<(&str, Vec<u8>)> = vec![
        ("index.html", index.into_bytes()),
        ("aphrody_app_wasm.js", js.into_bytes()),
        ("aphrody_app_wasm.wasm", wasm),
        ("mica.wgsl", SHADER.as_bytes().to_vec()),
        ("robots.txt", robots_txt().into_bytes()),
        ("sitemap.xml", sitemap_xml().into_bytes()),
        ("llms.txt", llms_txt().into_bytes()),
        (".well-known/webmcp.json", webmcp.into_bytes()),
        ("manifest.webmanifest", manifest_webmanifest().into_bytes()),
        ("icon.svg", icon_svg().as_bytes().to_vec()),
        ("favicon.ico", include_bytes!("../../../web/favicon.ico").to_vec()),
        ("apple-touch-icon.png", include_bytes!("../../../web/apple-touch-icon.png").to_vec()),
        ("icon-192.png", include_bytes!("../../../web/icon-192.png").to_vec()),
        ("icon-512.png", include_bytes!("../../../web/icon-512.png").to_vec()),
        ("maskable-512.png", include_bytes!("../../../web/maskable-512.png").to_vec()),
        ("og-image.png", include_bytes!("../../../web/og-image.png").to_vec()),
        ("_headers", headers_file().into_bytes()),
    ];
    let mut report = Vec::new();
    for (rel, bytes) in files {
        write(&o.out, rel, &bytes)?;
        report.push((rel.to_string(), bytes.len()));
    }
    Ok(report)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn static_files_are_well_formed() {
        assert!(robots_txt().contains("Sitemap: https://aphrody.app/sitemap.xml"));
        assert!(sitemap_xml().contains("<loc>https://aphrody.app/</loc>"));
        let l = llms_txt();
        assert!(l.starts_with("# Aphrody") && l.contains("aphrody_windows_list"));
        let m: serde_json::Value = serde_json::from_str(&manifest_webmanifest()).unwrap();
        assert_eq!(m["theme_color"], "#0F0F0F");
        let h = headers_file();
        assert!(h.contains("Cross-Origin-Opener-Policy: same-origin") && h.contains("Cross-Origin-Embedder-Policy: require-corp"));
        assert!(h.contains("application/wasm") && h.contains("immutable"));
        assert!(INDEX_TEMPLATE.contains("/aphrody_app_wasm.js'") && SHADER.contains("@fragment"));
    }

    #[test]
    fn no_emoji_or_non_ascii_in_generated_text() {
        for s in [robots_txt(), sitemap_xml(), llms_txt(), headers_file(), manifest_webmanifest(), INDEX_TEMPLATE.to_string(), SHADER.to_string()] {
            assert!(s.is_ascii());
        }
    }
}
