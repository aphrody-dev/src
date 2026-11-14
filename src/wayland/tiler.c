/* SPDX-License-Identifier: MIT OR Apache-2.0 */
/*
 * sys/wayland/tiler.c - Pure C Dynamic Tiling (Dwindle / Master-Stack / Monocle) & Damage Union
 */
#include "../include/ay/sys.h"

static __u32 clamp_u32(__u32 v, __u32 lo, __u32 hi)
{
	if (v < lo)
		return lo;
	if (v > hi)
		return hi;
	return v;
}

static __u32 sat_sub(__u32 a, __u32 b)
{
	return (a > b) ? (a - b) : 1u;
}

AY_API __s32 wl_tile_compute(__u32 mode, __u32 out_w, __u32 out_h, __u32 gap_px,
			     __u32 master_permille, const __u32 *surface_ids, __u32 count,
			     struct wl_box *out_boxes)
{
	__u32 ratio;
	__u32 inner_x;
	__u32 inner_y;
	__u32 inner_w;
	__u32 inner_h;
	__u32 i;

	if (!out_boxes || out_w == 0u || out_h == 0u)
		return AY_EINVAL;
	if (count == 0u)
		return 0;
	if (!surface_ids)
		return AY_EINVAL;

	ratio = clamp_u32(master_permille, 200u, 800u);
	inner_x = gap_px;
	inner_y = gap_px;
	inner_w = sat_sub(out_w, gap_px * 2u);
	inner_h = sat_sub(out_h, gap_px * 2u);

	if (mode == WL_TILE_MONOCLE || count == 1u) {
		for (i = 0u; i < count; i++) {
			out_boxes[i].id = surface_ids[i];
			out_boxes[i].x = inner_x;
			out_boxes[i].y = inner_y;
			out_boxes[i].w = inner_w;
			out_boxes[i].h = inner_h;
		}
		return (__s32)count;
	}

	if (mode == WL_TILE_MASTER_STACK) {
		__u32 master_w = (inner_w * ratio) / 1000u;
		__u32 stack_x = inner_x + master_w + gap_px;
		__u32 stack_w = sat_sub(inner_w, master_w + gap_px);
		__u32 stack_n = count - 1u;
		__u32 total_vgap = gap_px * (stack_n - 1u);
		__u32 slot_h = sat_sub(inner_h, total_vgap) / stack_n;

		out_boxes[0].id = surface_ids[0];
		out_boxes[0].x = inner_x;
		out_boxes[0].y = inner_y;
		out_boxes[0].w = master_w;
		out_boxes[0].h = inner_h;

		for (i = 1u; i < count; i++) {
			__u32 idx = i - 1u;
			__u32 sy = inner_y + idx * (slot_h + gap_px);
			__u32 sh = (i + 1u == count) ?
				     sat_sub(inner_y + inner_h, sy) : slot_h;

			out_boxes[i].id = surface_ids[i];
			out_boxes[i].x = stack_x;
			out_boxes[i].y = sy;
			out_boxes[i].w = stack_w;
			out_boxes[i].h = sh;
		}
		return (__s32)count;
	}

	{
		__u32 rx = inner_x;
		__u32 ry = inner_y;
		__u32 rw = inner_w;
		__u32 rh = inner_h;

		for (i = 0u; i < count; i++) {
			if (i + 1u == count) {
				out_boxes[i].id = surface_ids[i];
				out_boxes[i].x = rx;
				out_boxes[i].y = ry;
				out_boxes[i].w = rw;
				out_boxes[i].h = rh;
			} else if ((i & 1u) == 0u) {
				__u32 split_r = (i == 0u) ? ratio : 500u;
				__u32 lw = (sat_sub(rw, gap_px) * split_r) / 1000u;

				out_boxes[i].id = surface_ids[i];
				out_boxes[i].x = rx;
				out_boxes[i].y = ry;
				out_boxes[i].w = lw;
				out_boxes[i].h = rh;

				rx = rx + lw + gap_px;
				rw = sat_sub(rw, lw + gap_px);
			} else {
				__u32 th = sat_sub(rh, gap_px) / 2u;

				out_boxes[i].id = surface_ids[i];
				out_boxes[i].x = rx;
				out_boxes[i].y = ry;
				out_boxes[i].w = rw;
				out_boxes[i].h = th;

				ry = ry + th + gap_px;
				rh = sat_sub(rh, th + gap_px);
			}
		}
	}
	return (__s32)count;
}

AY_API __s32 wl_damage_union(const struct wl_box *a, const struct wl_box *b,
			     struct wl_box *out_merged)
{
	__u32 ax2, ay2, bx2, by2, mx1, my1, mx2, my2;

	if (!a || !b || !out_merged)
		return AY_EINVAL;

	if (a->w == 0u || a->h == 0u) {
		*out_merged = *b;
		return AY_OK;
	}
	if (b->w == 0u || b->h == 0u) {
		*out_merged = *a;
		return AY_OK;
	}

	ax2 = a->x + a->w;
	ay2 = a->y + a->h;
	bx2 = b->x + b->w;
	by2 = b->y + b->h;

	mx1 = (a->x < b->x) ? a->x : b->x;
	my1 = (a->y < b->y) ? a->y : b->y;
	mx2 = (ax2 > bx2) ? ax2 : bx2;
	my2 = (ay2 > by2) ? ay2 : by2;

	out_merged->id = a->id;
	out_merged->x = mx1;
	out_merged->y = my1;
	out_merged->w = mx2 - mx1;
	out_merged->h = my2 - my1;
	return AY_OK;
}
