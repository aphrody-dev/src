fn main() {
    let target = std::env::var("TARGET").unwrap_or_default();
    println!("cargo:rustc-env=SYS_BUILD_TARGET={target}");
}
