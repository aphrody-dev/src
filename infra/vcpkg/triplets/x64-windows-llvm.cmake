# labs triplet: Windows x64, shared LLVM toolchain (clang-cl + lld-link + llvm-lib), ThinLTO.
# [NV] untested: no Windows build allowed yet.
# Docs: https://learn.microsoft.com/vcpkg/users/triplets (VCPKG_CHAINLOAD_TOOLCHAIN_FILE)
set(VCPKG_TARGET_ARCHITECTURE x64)
set(VCPKG_CRT_LINKAGE dynamic)
set(VCPKG_LIBRARY_LINKAGE static)
set(VCPKG_CHAINLOAD_TOOLCHAIN_FILE "${CMAKE_CURRENT_LIST_DIR}/../toolchains/windows-llvm.cmake")
set(VCPKG_ENV_PASSTHROUGH LLVM_ROOT LABS_LTO)
