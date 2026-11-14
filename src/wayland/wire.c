/* SPDX-License-Identifier: MIT OR Apache-2.0 */
/*
 * sys/wayland/wire.c - Freedesktop Wayland 1.26.0 Wire Framing & Codec
 */
#include "../include/ay/sys.h"

static void put_u32_le(__u8 *p, __u32 v)
{
	p[0] = (__u8)(v & 0xffu);
	p[1] = (__u8)((v >> 8) & 0xffu);
	p[2] = (__u8)((v >> 16) & 0xffu);
	p[3] = (__u8)((v >> 24) & 0xffu);
}

static __u32 get_u32_le(const __u8 *p)
{
	return (__u32)p[0] |
	       ((__u32)p[1] << 8) |
	       ((__u32)p[2] << 16) |
	       ((__u32)p[3] << 24);
}

AY_API __u32 wl_pack_size_opcode(__u32 size_bytes, __u16 opcode)
{
	return ((size_bytes & 0xffffu) << 16) | (__u32)opcode;
}

AY_API __u16 wl_hdr_size(__u32 size_opcode)
{
	return (__u16)((size_opcode >> 16) & 0xffffu);
}

AY_API __u16 wl_hdr_opcode(__u32 size_opcode)
{
	return (__u16)(size_opcode & 0xffffu);
}

AY_API wl_fixed_t wl_fixed_from_int(__s32 v)
{
	return (wl_fixed_t)((__u32)v << 8);
}

AY_API __s32 wl_fixed_to_int(wl_fixed_t f)
{
	return f / 256;
}

AY_API __s32 wl_wire_encode(__u8 *dst, __usize cap, __u32 object_id, __u16 opcode,
			    const __u32 *payload_words, __u32 word_count)
{
	__u32 total_bytes;
	__u32 i;

	if (!dst || object_id == 0u)
		return AY_EINVAL;
	if (word_count > 0u && !payload_words)
		return AY_EINVAL;
	if (word_count > ((0xffffu - WL_HEADER_BYTES) / 4u))
		return AY_EINVAL;

	total_bytes = WL_HEADER_BYTES + (word_count * 4u);
	if ((__usize)total_bytes > cap)
		return AY_ENOSPC;

	put_u32_le(dst + 0, object_id);
	put_u32_le(dst + 4, wl_pack_size_opcode(total_bytes, opcode));

	for (i = 0u; i < word_count; i++)
		put_u32_le(dst + 8u + (i * 4u), payload_words[i]);

	return (__s32)total_bytes;
}

AY_API __s32 wl_wire_decode_hdr(const __u8 *src, __usize len, __u32 *out_object_id,
				__u16 *out_opcode, __u16 *out_size)
{
	__u32 obj;
	__u32 sz_op;
	__u16 sz;

	if (!src || !out_object_id || !out_opcode || !out_size)
		return AY_EINVAL;
	if (len < WL_HEADER_BYTES)
		return AY_EAGAIN;

	obj = get_u32_le(src + 0);
	sz_op = get_u32_le(src + 4);
	sz = wl_hdr_size(sz_op);

	if (obj == 0u || sz < WL_HEADER_BYTES || (sz & 3u) != 0u)
		return AY_EPROTO;
	if (len < (__usize)sz)
		return AY_EAGAIN;

	*out_object_id = obj;
	*out_opcode = wl_hdr_opcode(sz_op);
	*out_size = sz;
	return AY_OK;
}

AY_API __s32 wl_wire_put_string(__u8 *dst, __usize cap, const char *str, __usize str_len)
{
	__u32 wire_str_len;
	__u32 padded_bytes;
	__u32 total;
	__usize i;

	if (!dst || (!str && str_len > 0u))
		return AY_EINVAL;

	wire_str_len = (__u32)str_len + 1u;
	padded_bytes = WL_ALIGN4(wire_str_len);
	total = 4u + padded_bytes;

	if ((__usize)total > cap)
		return AY_ENOSPC;

	put_u32_le(dst, wire_str_len);
	for (i = 0u; i < str_len; i++)
		dst[4u + i] = (__u8)str[i];
	for (i = str_len; i < (__usize)padded_bytes; i++)
		dst[4u + i] = 0u;

	return (__s32)total;
}
