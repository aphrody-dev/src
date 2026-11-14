// SPDX-License-Identifier: Apache-2.0 OR MIT
// Fused C++20 ABI classifier for C++ / MSVC / Itanium / Unreal Engine UHT symbol mangling & macros

#include <cstddef>
#include <cstdint>
#include <cstring>

extern "C" {

// Classifies a symbol or source snippet:
// 0 = Plain C / Unmangled
// 1 = Itanium C++ ABI (_Z...)
// 2 = MSVC C++ ABI (?...)
// 3 = Rust v0 / Legacy Mangled (_RNv... / _ZN...)
// 4 = Unreal Engine Reflection Macro (UCLASS / UFUNCTION / UPROPERTY / GENERATED_BODY)
uint32_t n2b_classify_cpp_abi(const uint8_t* ptr, size_t len) {
    if (ptr == nullptr || len == 0) {
        return 0;
    }
    if (len >= 4 && ptr[0] == '_' && ptr[1] == 'R' && ptr[2] == 'N') {
        return 3;
    }
    if (len >= 3 && ptr[0] == '_' && ptr[1] == 'Z') {
        if (ptr[2] == 'N' && len > 12) {
            // Check for Rust hash suffix 17h...E
            for (size_t i = 3; i + 4 < len; ++i) {
                if (ptr[i] == '1' && ptr[i + 1] == '7' && ptr[i + 2] == 'h') {
                    return 3;
                }
            }
        }
        return 1;
    }
    if (ptr[0] == '?') {
        return 2;
    }
    // Scan for Unreal Engine 5.8 reflection markers
    const char* markers[] = {"UCLASS(", "UFUNCTION(", "UPROPERTY(", "USTRUCT(", "GENERATED_BODY()"};
    for (const char* m : markers) {
        size_t mlen = std::strlen(m);
        if (len >= mlen) {
            for (size_t i = 0; i + mlen <= len; ++i) {
                if (std::memcmp(ptr + i, m, mlen) == 0) {
                    return 4;
                }
            }
        }
    }
    return 0;
}

} // extern "C"
