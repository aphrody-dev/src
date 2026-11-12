# labs CMake toolchain (Windows), loaded through VCPKG_CHAINLOAD_TOOLCHAIN_FILE.
# [NV] untested. Replaces vcpkg scripts/toolchains/windows.cmake.
include_guard(GLOBAL)
set(CMAKE_SYSTEM_NAME Windows)
set(CMAKE_SYSTEM_PROCESSOR AMD64)
set(CMAKE_C_COMPILER_TARGET   x86_64-pc-windows-msvc)
set(CMAKE_CXX_COMPILER_TARGET x86_64-pc-windows-msvc)

# Lookup: $LLVM_ROOT (Chromium 157 toolchain from R2), then a system LLVM install.
if(DEFINED ENV{LLVM_ROOT})
  file(TO_CMAKE_PATH "$ENV{LLVM_ROOT}" _llvm)
else()
  set(_llvm "C:/Program Files/LLVM/bin")
endif()
set(CMAKE_C_COMPILER   "${_llvm}/clang-cl.exe")
set(CMAKE_CXX_COMPILER "${_llvm}/clang-cl.exe")
set(CMAKE_LINKER       "${_llvm}/lld-link.exe" CACHE FILEPATH "" FORCE)
set(CMAKE_AR           "${_llvm}/llvm-lib.exe" CACHE FILEPATH "" FORCE)
set(CMAKE_RC_COMPILER  "${_llvm}/llvm-rc.exe"  CACHE FILEPATH "" FORCE)
set(CMAKE_MT           "${_llvm}/llvm-mt.exe"  CACHE FILEPATH "" FORCE)
set(CMAKE_LINKER_TYPE LLD)

set(_lto "-flto=thin")
if("$ENV{LABS_LTO}" STREQUAL "off")
  set(_lto "")
endif()

# Dynamic CRT, matches VCPKG_CRT_LINKAGE dynamic.
set(CMAKE_MSVC_RUNTIME_LIBRARY "MultiThreaded$<$<CONFIG:Debug>:Debug>DLL")
set(CMAKE_C_FLAGS_INIT   "/DWIN32 /D_WINDOWS /utf-8 ${_lto} ${VCPKG_C_FLAGS}")
set(CMAKE_CXX_FLAGS_INIT "/DWIN32 /D_WINDOWS /utf-8 /EHsc ${_lto} ${VCPKG_CXX_FLAGS}")
set(CMAKE_C_FLAGS_RELEASE_INIT   "/O2 /DNDEBUG ${VCPKG_C_FLAGS_RELEASE}")
set(CMAKE_CXX_FLAGS_RELEASE_INIT "/O2 /DNDEBUG ${VCPKG_CXX_FLAGS_RELEASE}")
set(CMAKE_C_FLAGS_DEBUG_INIT     "/Od /Z7 ${VCPKG_C_FLAGS_DEBUG}")
set(CMAKE_CXX_FLAGS_DEBUG_INIT   "/Od /Z7 ${VCPKG_CXX_FLAGS_DEBUG}")
foreach(_k EXE SHARED MODULE)
  set(CMAKE_${_k}_LINKER_FLAGS_INIT "${VCPKG_LINKER_FLAGS}")
endforeach()
