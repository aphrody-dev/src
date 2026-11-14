/* SPDX-License-Identifier: MIT OR Apache-2.0 */
#ifndef _UAPI_AY_WASM_H
#define _UAPI_AY_WASM_H

#include "types.h"

/* WebAssembly 3.0 Binary Format Magic (`\0asm`) & Version (`1`) */
#define WASM_BINARY_MAGIC   0x6d736100u
#define WASM_BINARY_VERSION 0x00000001u

/* WebAssembly Section IDs (WebAssembly/spec binary format) */
#define WASM_SEC_CUSTOM    0u
#define WASM_SEC_TYPE      1u
#define WASM_SEC_IMPORT    2u
#define WASM_SEC_FUNCTION  3u
#define WASM_SEC_TABLE     4u
#define WASM_SEC_MEMORY    5u
#define WASM_SEC_GLOBAL    6u
#define WASM_SEC_EXPORT    7u
#define WASM_SEC_START     8u
#define WASM_SEC_ELEMENT   9u
#define WASM_SEC_CODE      10u
#define WASM_SEC_DATA      11u
#define WASM_SEC_DATACOUNT 12u
#define WASM_SEC_TAG       13u

/* WASI Preview 1/2 Errno Subset (WebAssembly/wasi-libc) */
#define WASI_ESUCCESS 0u
#define WASI_EBADF    8u
#define WASI_EINVAL   28u
#define WASI_ENOENT   44u
#define WASI_ENOSYS   52u

/* WASI `ciovec_t` (32-bit linear memory pointer + byte length) */
struct wasi_ciovec32 {
	__u32 buf_offset;
	__u32 buf_len;
};

/* Binary Module Summary returned by `wasm_inspect_module` */
struct wasm_module_info {
	__u32 magic;
	__u32 version;
	__u32 section_mask;
	__u32 section_count;
	__u32 custom_section_count;
	__u32 code_bytes;
	__u32 export_section_bytes;
	__u32 total_bytes;
};

#endif /* _UAPI_AY_WASM_H */
