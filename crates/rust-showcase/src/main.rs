// SPDX-License-Identifier: Apache-2.0
//! Entrypoint for the native Desktop `rust-showcase-desktop` binary.

#[cfg(not(target_arch = "wasm32"))]
fn main() {
    let args: Vec<String> = std::env::args().skip(1).collect();
    if args.iter().any(|a| a == "--snapshot-json") {
        let state = rust_showcase::state::ShowcaseState::new("desktop");
        let snap = state.snapshot();
        println!(
            "{}",
            serde_json::to_string_pretty(&snap).expect("snapshot serialization")
        );
        return;
    }
    rust_showcase::desktop::run_desktop();
}

#[cfg(target_arch = "wasm32")]
fn main() {}
