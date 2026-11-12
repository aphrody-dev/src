# labs CMake toolchain (Linux), loaded through VCPKG_CHAINLOAD_TOOLCHAIN_FILE.
# Replaces vcpkg scripts/toolchains/linux.cmake, so it must honour the VCPKG_* flag variables.
include_guard(GLOBAL)
set(CMAKE_SYSTEM_NAME Linux)
set(CMAKE_SYSTEM_PROCESSOR x86_64)
# Same triple as rustc, otherwise lld warns "Linking two modules of different target triples" in cross-language LTO.
set(CMAKE_C_COMPILER_TARGET   x86_64-unknown-linux-gnu)
set(CMAKE_CXX_COMPILER_TARGET x86_64-unknown-linux-gnu)

# Lookup: $LLVM_ROOT (Chromium 157 toolchain from R2, see third_party/toolchain-157.toml), then apt.llvm.org 23.
if(DEFINED ENV{LLVM_ROOT})
  set(_llvm "$ENV{LLVM_ROOT}")
else()
  set(_llvm "/usr/lib/llvm-23/bin")
endif()
set(CMAKE_C_COMPILER   "${_llvm}/clang")
set(CMAKE_CXX_COMPILER "${_llvm}/clang++")
set(CMAKE_AR           "${_llvm}/llvm-ar"     CACHE FILEPATH "" FORCE)
set(CMAKE_RANLIB       "${_llvm}/llvm-ranlib" CACHE FILEPATH "" FORCE)
set(CMAKE_NM           "${_llvm}/llvm-nm"     CACHE FILEPATH "" FORCE)
set(CMAKE_LINKER_TYPE LLD)

# LABS_LTO=off disables ThinLTO (to debug a misbehaving port).
set(_lto "-flto=thin")
if("$ENV{LABS_LTO}" STREQUAL "off")
  set(_lto "")
endif()

set(CMAKE_POSITION_INDEPENDENT_CODE ON)
set(CMAKE_C_FLAGS_INIT   "-fPIC ${_lto} ${VCPKG_C_FLAGS}")
set(CMAKE_CXX_FLAGS_INIT "-fPIC ${_lto} ${VCPKG_CXX_FLAGS}")
set(CMAKE_C_FLAGS_DEBUG_INIT     "${VCPKG_C_FLAGS_DEBUG}")
set(CMAKE_CXX_FLAGS_DEBUG_INIT   "${VCPKG_CXX_FLAGS_DEBUG}")
set(CMAKE_C_FLAGS_RELEASE_INIT   "${VCPKG_C_FLAGS_RELEASE}")
set(CMAKE_CXX_FLAGS_RELEASE_INIT "${VCPKG_CXX_FLAGS_RELEASE}")
foreach(_k EXE SHARED MODULE)
  set(CMAKE_${_k}_LINKER_FLAGS_INIT "-fuse-ld=lld ${_lto} ${VCPKG_LINKER_FLAGS}")
endforeach()
