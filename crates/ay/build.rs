// SPDX-License-Identifier: Apache-2.0
//! Embeds the brand icon (`ay.ico`, written by `ay brand build --deploy` from assets/brand) and the
//! version resource into ay.exe. Non-fatal: without a resource compiler the build only warns.

fn main() {
    println!("cargo:rerun-if-changed=ay.ico");
    if std::env::var("CARGO_CFG_TARGET_OS").as_deref() != Ok("windows") || !std::path::Path::new("ay.ico").is_file() {
        return;
    }
    let mut res = winresource::WindowsResource::new();
    res.set_icon("ay.ico");
    if let Err(e) = res.compile() {
        println!("cargo:warning=ay.ico not embedded: {e}");
    }
}
