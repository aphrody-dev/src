//! Thin driver: all logic lives in the library (`aphrody_factory::tool_main`), so `ay factory` can
//! reuse it unchanged (docs/llvm/AY-AS-LLVM.md).

fn main() -> std::process::ExitCode {
    let args: Vec<std::ffi::OsString> = std::env::args_os().skip(1).collect();
    let code = aphrody_factory::tool_main(&args);
    std::process::ExitCode::from(u8::try_from(code).unwrap_or(1))
}
