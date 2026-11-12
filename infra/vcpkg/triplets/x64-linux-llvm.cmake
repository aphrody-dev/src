# labs triplet: Linux x64, shared LLVM toolchain (clang + lld + llvm-ar), ThinLTO.
# Usage: vcpkg install <port>:x64-linux-llvm --overlay-triplets=infra/vcpkg/triplets
# Docs: https://learn.microsoft.com/vcpkg/users/triplets (VCPKG_CHAINLOAD_TOOLCHAIN_FILE)
set(VCPKG_TARGET_ARCHITECTURE x64)
set(VCPKG_CRT_LINKAGE dynamic)
set(VCPKG_LIBRARY_LINKAGE static)
set(VCPKG_CMAKE_SYSTEM_NAME Linux)
set(VCPKG_CHAINLOAD_TOOLCHAIN_FILE "${CMAKE_CURRENT_LIST_DIR}/../toolchains/linux-llvm.cmake")
# LLVM_ROOT: bin dir of the toolchain (Chromium 157 from R2, else apt.llvm.org).
set(VCPKG_ENV_PASSTHROUGH LLVM_ROOT LABS_LTO)
