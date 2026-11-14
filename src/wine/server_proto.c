/* SPDX-License-Identifier: MIT OR Apache-2.0 */
/*
 * sys/wine/server_proto.c - Wine 64-byte fixed server request framing (wine/server/request.h)
 */
#include "../include/ay/sys.h"

static void put_u32_le(__u8 *p, __u32 v)
{
	p[0] = (__u8)(v & 0xffu);
	p[1] = (__u8)((v >> 8) & 0xffu);
	p[2] = (__u8)((v >> 16) & 0xffu);
	p[3] = (__u8)((v >> 24) & 0xffu);
}

static void put_u64_le(__u8 *p, __u64 v)
{
	put_u32_le(p + 0, (__u32)(v & 0xffffffffULL));
	put_u32_le(p + 4, (__u32)((v >> 32) & 0xffffffffULL));
}

AY_API __s32 wine_pack_server_req(__u8 *dst64, __s32 req_opcode, const __u8 *inline_payload,
				  __u32 inline_len, __u64 reply_max)
{
	__u32 max_inline = WINE_SERVER_PROTOCOL_FIXED_SIZE - 16u;
	__u32 i;

	if (!dst64 || req_opcode < 0)
		return AY_EINVAL;
	if (inline_len > max_inline)
		return AY_ENOSPC;
	if (inline_len > 0u && !inline_payload)
		return AY_EINVAL;

	for (i = 0u; i < WINE_SERVER_PROTOCOL_FIXED_SIZE; i++)
		dst64[i] = 0u;

	put_u32_le(dst64 + 0, (__u32)req_opcode);
	put_u32_le(dst64 + 4, inline_len);
	put_u64_le(dst64 + 8, reply_max);

	for (i = 0u; i < inline_len; i++)
		dst64[16u + i] = inline_payload[i];

	return (__s32)WINE_SERVER_PROTOCOL_FIXED_SIZE;
}
