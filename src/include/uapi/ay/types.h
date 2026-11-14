/* SPDX-License-Identifier: MIT OR Apache-2.0 */
/*
 * sys/include/uapi/ay/types.h - Fixed-width C11/GNU11 ABI types (LP64 / LLP64 / WASM32 invariant)
 *
 * Follows Linux uapi/asm-generic/int-ll64.h: never expose ambiguous `long` or `_Bool` across ABI.
 */
#ifndef _UAPI_AY_TYPES_H
#define _UAPI_AY_TYPES_H

#if defined(__wasm__) && !defined(__STDC_HOSTED__)
typedef signed char        __s8;
typedef unsigned char      __u8;
typedef signed short       __s16;
typedef unsigned short     __u16;
typedef signed int         __s32;
typedef unsigned int       __u32;
typedef signed long long   __s64;
typedef unsigned long long __u64;
typedef unsigned long      __usize;
#else
#include <stddef.h>
#include <stdint.h>
typedef int8_t             __s8;
typedef uint8_t            __u8;
typedef int16_t            __s16;
typedef uint16_t           __u16;
typedef int32_t            __s32;
typedef uint32_t           __u32;
typedef int64_t            __s64;
typedef uint64_t           __u64;
typedef size_t             __usize;
#endif

#if defined(_WIN32)
#define AY_API __declspec(dllexport)
#else
#define AY_API __attribute__((visibility("default")))
#endif

#if defined(__wasm__)
#define AY_WASM(sym) __attribute__((export_name(sym)))
#else
#define AY_WASM(sym)
#endif

#define AY_SYS_ABI_VERSION 1u

#endif /* _UAPI_AY_TYPES_H */
