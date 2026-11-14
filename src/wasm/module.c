// SPDX-License-Identifier: MIT OR Apache-2.0
/*
 * src/wasm/module.c - Zero-allocation WebAssembly 3.0 binary parser, LEB128 codec & SIMD128 kernels
 */
#include "../include/ay/sys.h"

#if defined(__wasm_simd128__)
#include <wasm_simd128.h>
#endif

AY_API __s32 wasm_uleb128_decode(const __u8 *src, __usize cap, __u64 *out_val, __u32 *out_len)
{
	__u64 result = 0;
	__u32 shift = 0;
	__usize i = 0;

	if (!src || !out_val || !out_len || cap == 0)
		return AY_EINVAL;

	while (i < cap && i < 10u) {
		__u8 byte = src[i++];
		result |= ((__u64)(byte & 0x7fu)) << shift;
		if ((byte & 0x80u) == 0) {
			*out_val = result;
			*out_len = (__u32)i;
			return AY_OK;
		}
		shift += 7u;
	}

	return AY_EPROTO;
}

AY_API __s32 wasm_inspect_module(const __u8 *bytes, __usize len, struct wasm_module_info *out_info)
{
	__u32 magic;
	__u32 ver;
	__usize pos;

	if (!bytes || !out_info || len < 8u)
		return AY_EINVAL;

	for (__usize i = 0; i < sizeof(*out_info); ++i)
		((__u8 *)out_info)[i] = 0;

	magic = (__u32)bytes[0] | ((__u32)bytes[1] << 8) |
		((__u32)bytes[2] << 16) | ((__u32)bytes[3] << 24);
	ver = (__u32)bytes[4] | ((__u32)bytes[5] << 8) |
	      ((__u32)bytes[6] << 16) | ((__u32)bytes[7] << 24);

	out_info->magic = magic;
	out_info->version = ver;
	out_info->total_bytes = (__u32)len;

	if (magic != WASM_BINARY_MAGIC || ver != WASM_BINARY_VERSION)
		return AY_EPROTO;

	pos = 8u;
	while (pos < len) {
		__u8 sec_id = bytes[pos++];
		__u64 sec_size = 0;
		__u32 leb_len = 0;
		__s32 rc;

		if (sec_id > 31u)
			return AY_EPROTO;

		rc = wasm_uleb128_decode(bytes + pos, len - pos, &sec_size, &leb_len);
		if (rc != AY_OK)
			return rc;

		pos += leb_len;
		if (sec_size > (len - pos))
			return AY_EPROTO;

		out_info->section_count++;
		out_info->section_mask |= (1u << sec_id);
		if (sec_id == WASM_SEC_CUSTOM)
			out_info->custom_section_count++;
		else if (sec_id == WASM_SEC_CODE)
			out_info->code_bytes += (__u32)sec_size;
		else if (sec_id == WASM_SEC_EXPORT)
			out_info->export_section_bytes += (__u32)sec_size;

		pos += (__usize)sec_size;
	}

	return AY_OK;
}

AY_API __s32 wasm_simd_dot_i32(const __s32 *a, const __s32 *b, __usize count, __s64 *out_sum)
{
	__s64 acc = 0;
	__usize i = 0;

	if (!a || !b || !out_sum)
		return AY_EINVAL;

#if defined(__wasm_simd128__)
	v128_t vacc = wasm_i64x2_splat(0);
	for (; i + 4u <= count; i += 4u) {
		v128_t va = wasm_v128_load(&a[i]);
		v128_t vb = wasm_v128_load(&b[i]);
		v128_t prod = wasm_i32x4_mul(va, vb);
		vacc = wasm_i64x2_add(vacc, wasm_i64x2_extend_low_i32x4(prod));
		vacc = wasm_i64x2_add(vacc, wasm_i64x2_extend_high_i32x4(prod));
	}
	acc = wasm_i64x2_extract_lane(vacc, 0) + wasm_i64x2_extract_lane(vacc, 1);
#endif

	for (; i < count; ++i)
		acc += (__s64)a[i] * (__s64)b[i];

	*out_sum = acc;
	return AY_OK;
}
