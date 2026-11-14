fn main() {
    let args: Vec<String> = std::env::args().skip(1).collect();
    std::process::exit(aphrody_omarchy::cli::run_omarchy_args(&args));
}
