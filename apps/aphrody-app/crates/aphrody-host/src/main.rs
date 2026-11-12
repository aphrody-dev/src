mod dist;
mod http;
mod tui;

use aphrody_core::layout::{LayoutKind, Rect};
use aphrody_core::state::{AppState, builtin_registry};
use aphrody_core::store::FileStorage;
use serde_json::json;
use std::path::PathBuf;
use std::sync::Arc;
use std::time::Instant;

const HELP: &str = "\
aphrody-app v0.1.0 (Pure Rust 2024 | WASM + WebGPU WGSL + Wayland WM + Fluid CRDT + OPFS/VFS + WebMCP)

Usage:
  aphrody-app serve [--addr 127.0.0.1:4321] [--dist ./dist] [--data ./var/aphrody.vfs]
  aphrody-app tui [--layout dwindle|cosmic_grid|niri_scroll|floating] [--windows 4] [--width 80] [--height 24] [--no-color]
  aphrody-app build-dist [--root .] [--out ./dist] [--skip-build]
  aphrody-app doctor
  aphrody-app bench
  aphrody-app version | --version
";

fn flag_val(args: &[String], flag: &str) -> Option<String> {
    for (i, a) in args.iter().enumerate() {
        if a == flag {
            return args.get(i + 1).cloned();
        }
        if let Some(rest) = a.strip_prefix(&format!("{flag}=")) {
            return Some(rest.to_string());
        }
    }
    None
}

fn run() -> Result<(), String> {
    let args: Vec<String> = std::env::args().skip(1).collect();
    let sub = args.first().map(String::as_str).unwrap_or("help");

    match sub {
        "help" | "--help" | "-h" => {
            print!("{HELP}");
            Ok(())
        }
        "version" | "--version" | "-v" => {
            println!("aphrody-app {}", aphrody_core::VERSION);
            Ok(())
        }
        "tui" => {
            let layout_str = flag_val(&args, "--layout").unwrap_or_else(|| "dwindle".into());
            let layout = LayoutKind::parse(&layout_str).ok_or_else(|| format!("unknown layout: {layout_str}"))?;
            let windows: usize = flag_val(&args, "--windows").and_then(|v| v.parse().ok()).unwrap_or(4);
            let width: usize = flag_val(&args, "--width").and_then(|v| v.parse().ok()).unwrap_or(88);
            let height: usize = flag_val(&args, "--height").and_then(|v| v.parse().ok()).unwrap_or(24);
            let color = !args.iter().any(|a| a == "--no-color");
            let mut wm = tui::demo_wm(layout, windows);
            print!("{}", tui::render(&mut wm, &tui::Options { width, height, color }));
            Ok(())
        }
        "build-dist" => {
            let root = flag_val(&args, "--root").map(PathBuf::from).unwrap_or_else(|| PathBuf::from("."));
            let out = flag_val(&args, "--out").map(PathBuf::from).unwrap_or_else(|| root.join("dist"));
            let skip_build = args.iter().any(|a| a == "--skip-build");
            let t0 = Instant::now();
            let files = dist::build(&dist::Opts { root, out: out.clone(), skip_build })?;
            let total: usize = files.iter().map(|(_, sz)| *sz).sum();
            println!("aphrody-app dist built in {:.1}ms -> {} ({} files, {} bytes)", t0.elapsed().as_secs_f64() * 1000.0, out.display(), files.len(), total);
            for (rel, sz) in files {
                println!("  {:<28} {:>9} B", rel, sz);
            }
            Ok(())
        }
        "serve" => {
            let addr = flag_val(&args, "--addr").unwrap_or_else(|| "127.0.0.1:4321".into());
            let dist_dir = flag_val(&args, "--dist").map(PathBuf::from).unwrap_or_else(|| PathBuf::from("dist"));
            let state = if let Some(data_path) = flag_val(&args, "--data") {
                let p = PathBuf::from(data_path);
                if let Some(parent) = p.parent() {
                    let _ = std::fs::create_dir_all(parent);
                }
                let fs = FileStorage::open(&p).map_err(|e| e.to_string())?;
                AppState::new(Rect::new(0.0, 0.0, 1920.0, 1080.0), Box::new(fs))?
            } else {
                AppState::in_memory(Rect::new(0.0, 0.0, 1920.0, 1080.0))
            };
            let shared = Arc::new(http::Shared::new(state, dist_dir.clone()));
            http::serve(&addr, shared, |bound| {
                println!("aphrody-app listening on http://{bound} (dist={})", dist_dir.display());
            })
            .map_err(|e| e.to_string())
        }
        "doctor" => {
            let reg = builtin_registry();
            let report = json!({
                "app": "aphrody-app",
                "version": aphrody_core::VERSION,
                "os": std::env::consts::OS,
                "arch": std::env::consts::ARCH,
                "webmcp_tools_count": reg.names().len(),
                "webmcp_tools": reg.names(),
                "layouts": LayoutKind::ALL.iter().map(|k| k.name()).collect::<Vec<_>>(),
            });
            println!("{}", serde_json::to_string_pretty(&report).unwrap());
            Ok(())
        }
        "bench" => {
            let mut st = AppState::in_memory(Rect::new(0.0, 0.0, 3840.0, 2160.0));
            for i in 0..16 {
                st.wm.add_window(&format!("Win-{i}"), "org.aphrody.bench");
            }
            let t_wm = Instant::now();
            let iters_wm = 10_000u64;
            for _ in 0..iters_wm {
                std::hint::black_box(st.wm.arrange());
            }
            let wm_ns = t_wm.elapsed().as_nanos() as f64 / iters_wm as f64;

            let t_crdt = Instant::now();
            let iters_crdt = 10_000u64;
            for _ in 0..iters_crdt {
                let op = st.replica.counter_add("bench", 1);
                let _ = st.commit(op);
            }
            let crdt_ns = t_crdt.elapsed().as_nanos() as f64 / iters_crdt as f64;

            let payload = vec![0x42u8; 4096];
            let t_vfs = Instant::now();
            let iters_vfs = 2_000u64;
            for i in 0..iters_vfs {
                let _ = st.vfs.write(&format!("/bench/f_{}.bin", i % 32), &payload);
            }
            let vfs_us = t_vfs.elapsed().as_secs_f64() * 1_000_000.0 / iters_vfs as f64;

            let out = json!({
                "wm_arrange_16_windows_ns": (wm_ns * 100.0).round() / 100.0,
                "fluid_sequenced_op_ns": (crdt_ns * 100.0).round() / 100.0,
                "blake3_vfs_4kb_write_us": (vfs_us * 100.0).round() / 100.0,
            });
            println!("{}", serde_json::to_string_pretty(&out).unwrap());
            Ok(())
        }
        other => Err(format!("unknown subcommand '{other}'\n\n{HELP}")),
    }
}

fn main() {
    if let Err(e) = run() {
        eprintln!("error: {e}");
        std::process::exit(1);
    }
}
