fn main() {
    // Started as a tool shim (`llama-cli.exe` + `llama-cli.shim`, written by `ay up`).
    if let Some(code) = up::shim::run_if_shim() {
        std::process::exit(code);
    }
    let args: Vec<String> = std::env::args().skip(1).collect();
    std::process::exit(ay::run(&args));
}
