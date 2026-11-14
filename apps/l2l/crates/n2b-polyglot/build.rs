// SPDX-License-Identifier: Apache-2.0 OR MIT
//! Compiles fused native C11 and C++20 acceleration kernels (`native/polyglot_accel.c`
//! and `native/cpp_demangle_bridge.cpp`) directly into `libn2b_polyglot.rlib` with full LTO/O2.

fn main() {
    println!("cargo:rerun-if-changed=native/polyglot_accel.c");
    println!("cargo:rerun-if-changed=native/cpp_demangle_bridge.cpp");

    cc::Build::new()
        .file("native/polyglot_accel.c")
        .opt_level(3)
        .compile("n2b_polyglot_c");

    cc::Build::new()
        .cpp(true)
        .std("c++20")
        .file("native/cpp_demangle_bridge.cpp")
        .opt_level(3)
        .compile("n2b_polyglot_cpp");
}
