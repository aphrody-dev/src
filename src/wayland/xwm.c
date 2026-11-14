/* SPDX-License-Identifier: MIT OR Apache-2.0 */
/*
 * sys/wayland/xwm.c - Freedesktop X11 (XCB 1.17 Async) & Rootless XWayland 26.0.99 XWM
 */
#include "../include/ay/sys.h"

AY_API __s32 xcb_build_setup_req(struct xcb_setup_req *out_req)
{
	if (!out_req)
		return AY_EINVAL;

	out_req->byte_order = XCB_SETUP_LSB;
	out_req->pad0 = 0u;
	out_req->protocol_major = XCB_PROTOCOL_MAJOR;
	out_req->protocol_minor = XCB_PROTOCOL_MINOR;
	out_req->auth_proto_name_len = 0u;
	out_req->auth_proto_data_len = 0u;
	out_req->pad1 = 0u;
	return AY_OK;
}

AY_API void xwm_context_init(struct xwm_context *ctx, __u32 wl_surface_id_atom)
{
	__u32 i;

	if (!ctx)
		return;
	ctx->wl_surface_id_atom = wl_surface_id_atom;
	ctx->paired_count = 0u;
	for (i = 0u; i < XWM_MAX_WINDOWS; i++) {
		ctx->slots[i].active = 0u;
		ctx->slots[i].x11_window = 0u;
		ctx->slots[i].wl_surface_id = 0u;
		ctx->slots[i].x = 0;
		ctx->slots[i].y = 0;
		ctx->slots[i].width = 0u;
		ctx->slots[i].height = 0u;
	}
}

AY_API __s32 xwm_handle_client_message(struct xwm_context *ctx,
				       const struct xcb_client_message_event *ev)
{
	__u32 ev_type;
	__u32 surface_id;
	__u32 i;
	__s32 free_idx = -1;

	if (!ctx || !ev)
		return AY_EINVAL;

	ev_type = (__u32)(ev->response_type & 0x7fu);
	if (ev_type != XCB_EVENT_CLIENT_MESSAGE || ev->format != 32u)
		return AY_EPROTO;
	if (ev->type != ctx->wl_surface_id_atom)
		return AY_ENOENT;

	surface_id = ev->data32[0];
	if (ev->window == 0u || surface_id == 0u)
		return AY_EINVAL;

	for (i = 0u; i < XWM_MAX_WINDOWS; i++) {
		if (ctx->slots[i].active && ctx->slots[i].x11_window == ev->window) {
			ctx->slots[i].wl_surface_id = surface_id;
			return AY_OK;
		}
		if (!ctx->slots[i].active && free_idx < 0)
			free_idx = (__s32)i;
	}

	if (free_idx < 0)
		return AY_ENOSPC;

	ctx->slots[free_idx].active = 1u;
	ctx->slots[free_idx].x11_window = ev->window;
	ctx->slots[free_idx].wl_surface_id = surface_id;
	ctx->paired_count++;
	return AY_OK;
}

AY_API __u32 xwm_lookup_wl_surface(const struct xwm_context *ctx, __u32 x11_window)
{
	__u32 i;

	if (!ctx || x11_window == 0u)
		return 0u;

	for (i = 0u; i < XWM_MAX_WINDOWS; i++) {
		if (ctx->slots[i].active && ctx->slots[i].x11_window == x11_window)
			return ctx->slots[i].wl_surface_id;
	}
	return 0u;
}

AY_API __s32 xwm_unmap_window(struct xwm_context *ctx, __u32 x11_window)
{
	__u32 i;

	if (!ctx || x11_window == 0u)
		return AY_EINVAL;

	for (i = 0u; i < XWM_MAX_WINDOWS; i++) {
		if (ctx->slots[i].active && ctx->slots[i].x11_window == x11_window) {
			ctx->slots[i].active = 0u;
			ctx->slots[i].x11_window = 0u;
			ctx->slots[i].wl_surface_id = 0u;
			if (ctx->paired_count > 0u)
				ctx->paired_count--;
			return AY_OK;
		}
	}
	return AY_ENOENT;
}
