/* SPDX-License-Identifier: MIT OR Apache-2.0 */
/*
 * src/ui/vterm.c - Pure C11 / WASM32 Zero-Alloc Virtual Terminal Core (v2)
 *
 * Implements fast span-batched ECMA-48 / VT220+ / xterm-256color / truecolor,
 * O(1) row-ring grid + 1024-row circular scrollback, Kitty keyboard protocol,
 * synchronized output (?2026), OSC 7/8/10/11/52/133, and 20-byte WebGPU cell
 * packing with shared palettes from `src/ui/shell_kit.c`.
 */
#include "../include/ay/sys.h"

enum {
	VT_GROUND = 0,
	VT_ESC = 1,
	VT_CSI = 2,
	VT_OSC = 3,
	VT_ESC_HASH = 4,
	VT_ESC_CHARSET = 5,
	VT_DCS_SKIP = 6,
};

#define VT_COL_MASK 0x00FFFFFFu

static __u32 vt_min_u32(__u32 a, __u32 b)
{
	return a < b ? a : b;
}

static __u32 vt_max_u32(__u32 a, __u32 b)
{
	return a > b ? a : b;
}

static __s32 vt_clamp_s32(__s32 v, __s32 lo, __s32 hi)
{
	if (v < lo)
		return lo;
	if (v > hi)
		return hi;
	return v;
}

static void vt_mark_dirty(struct ay_vterm_state *vt, __u32 row)
{
	if (row < 96u)
		vt->dirty_rows[row >> 5u] |= 1u << (row & 31u);
}

static void vt_mark_all_dirty(struct ay_vterm_state *vt)
{
	vt->dirty_rows[0] = 0xFFFFFFFFu;
	vt->dirty_rows[1] = 0xFFFFFFFFu;
	vt->dirty_rows[2] = 0xFFFFFFFFu;
}

static __u16 *vt_row_idx(struct ay_vterm_state *vt)
{
	return vt->alt_screen ? vt->alt_row_idx : vt->main_row_idx;
}

static __u16 *vt_row_len_arr(struct ay_vterm_state *vt)
{
	return vt->alt_screen ? vt->alt_row_len : vt->main_row_len;
}

static __u8 *vt_row_wrap_arr(struct ay_vterm_state *vt)
{
	return vt->alt_screen ? vt->alt_row_wrapped : vt->main_row_wrapped;
}

static struct ay_vterm_cell *vt_grid_mut(struct ay_vterm_state *vt)
{
	return vt->alt_screen ? vt->alt_cells : vt->main_cells;
}

static const struct ay_vterm_cell *vt_grid_const(const struct ay_vterm_state *vt)
{
	return vt->alt_screen ? vt->alt_cells : vt->main_cells;
}

static void vt_queue_reply(struct ay_vterm_state *vt, const void *data, __u32 len)
{
	const __u8 *p = (const __u8 *)data;
	__u32 i;

	if (len == 0u || vt->reply_len + len > AY_VTERM_REPLY_CAP)
		return;
	for (i = 0u; i < len; i++)
		vt->reply_buf[vt->reply_len++] = p[i];
}

static __u32 vt_fmt_u32(char *dst, __u32 val)
{
	char tmp[12];
	__u32 n = 0u;
	__u32 i;

	if (val == 0u) {
		dst[0] = '0';
		return 1u;
	}
	while (val > 0u) {
		tmp[n++] = (char)('0' + (val % 10u));
		val /= 10u;
	}
	for (i = 0u; i < n; i++)
		dst[i] = tmp[n - 1u - i];
	return n;
}

static void vt_fmt_hex4(char *dst, __u8 byte_val)
{
	static const char hex[] = "0123456789abcdef";
	char h = hex[(byte_val >> 4u) & 0xFu];
	char l = hex[byte_val & 0xFu];
	dst[0] = h;
	dst[1] = l;
	dst[2] = h;
	dst[3] = l;
}

static void vt_fill_cells(struct ay_vterm_cell *dst, __u32 n, __u32 bg)
{
	__u32 i;
	struct ay_vterm_cell blank = { .cp = ' ', .fg = 0u, .bg = bg, .flags = 0u };

	for (i = 0u; i < n; i++)
		dst[i] = blank;
}

static void vt_clear_row(struct ay_vterm_state *vt, __u32 row, __u32 start, __u32 end)
{
	__u16 *ridx = vt_row_idx(vt);
	__u16 *rlen = vt_row_len_arr(vt);
	__u8 *rwrap = vt_row_wrap_arr(vt);
	struct ay_vterm_cell *base = vt_grid_mut(vt);
	__u32 phys;
	__u32 cols = vt->cols;
	__u32 prev_len;

	if (row >= vt->rows)
		return;
	if (end > cols)
		end = cols;
	if (start >= end)
		return;
	phys = ridx[row];
	prev_len = rlen[phys];
	if (vt->cur_bg == 0u) {
		__u32 clear_end = vt_min_u32(end, prev_len);
		if (clear_end > start) {
			vt_fill_cells(&base[phys * AY_VTERM_MAX_COLS + start], clear_end - start, 0u);
		}
		if (end >= prev_len) {
			if (start <= prev_len)
				rlen[phys] = (__u16)start;
		}
	} else {
		vt_fill_cells(&base[phys * AY_VTERM_MAX_COLS + start], end - start, vt->cur_bg);
		if (end > rlen[phys])
			rlen[phys] = (__u16)end;
	}
	if (end >= cols)
		rwrap[phys] = 0u;
	vt_mark_dirty(vt, row);
}

static void vt_clear_evicted_phys(struct ay_vterm_state *vt, __u32 phys)
{
	__u16 *rlen = vt_row_len_arr(vt);
	__u8 *rwrap = vt_row_wrap_arr(vt);
	struct ay_vterm_cell *row_cells = &vt_grid_mut(vt)[phys * AY_VTERM_MAX_COLS];
	__u32 prev_len = rlen[phys];

	if (vt->cur_bg == 0u) {
		if (prev_len > 0u)
			vt_fill_cells(row_cells, prev_len, 0u);
		rlen[phys] = 0u;
	} else {
		vt_fill_cells(row_cells, vt->cols, vt->cur_bg);
		rlen[phys] = vt->cols;
	}
	rwrap[phys] = 0u;
}

static void vt_clear_screen_all(struct ay_vterm_state *vt)
{
	__u32 r;
	for (r = 0u; r < vt->rows; r++)
		vt_clear_row(vt, r, 0u, vt->cols);
}

static __u32 vt_xterm256_argb(__u32 idx, const struct ay_term_palette *pal)
{
	static const __u8 ramp[6] = { 0u, 95u, 135u, 175u, 215u, 255u };
	__u32 r, g, b, v;

	if (idx < 16u)
		return pal->ansi[idx];
	if (idx < 232u) {
		__u32 c = idx - 16u;
		r = ramp[c / 36u];
		g = ramp[(c / 6u) % 6u];
		b = ramp[c % 6u];
		return 0xFF000000u | (r << 16u) | (g << 8u) | b;
	}
	v = 8u + (idx - 232u) * 10u;
	return 0xFF000000u | (v << 16u) | (v << 8u) | v;
}

static __u32 vt_rgb_argb(__u32 r, __u32 g, __u32 b)
{
	return 0xFF000000u | ((r & 0xFFu) << 16u) | ((g & 0xFFu) << 8u) | (b & 0xFFu);
}

static void vt_push_sb_row(struct ay_vterm_state *vt, __u32 phys)
{
	__u32 slot = vt->sb_head;
	__u32 copy_w = vt_min_u32(vt->main_row_len[phys], vt->cols);

	if (copy_w > 0u) {
		__builtin_memcpy(&vt->sb_cells[slot * AY_VTERM_MAX_COLS],
				 &vt->main_cells[phys * AY_VTERM_MAX_COLS],
				 copy_w * sizeof(struct ay_vterm_cell));
	}
	vt->sb_row_len[slot] = (__u16)copy_w;
	vt->sb_row_wrapped[slot] = vt->main_row_wrapped[phys];
	vt->sb_head = (slot + 1u) & (AY_VTERM_SCROLLBACK_ROWS - 1u);
	if (vt->sb_len < AY_VTERM_SCROLLBACK_ROWS)
		vt->sb_len++;
	if (vt->view_offset > 0u && vt->view_offset < vt->sb_len)
		vt->view_offset++;
	vt->main_scroll_seq++;
}

static void vt_scroll_up_region(struct ay_vterm_state *vt, __u32 top, __u32 bottom, __u32 count)
{
	__u16 *ridx = vt_row_idx(vt);
	__u32 region_h;
	__u32 step;
	__u32 k;
	__u32 r;

	if (top >= bottom || bottom >= vt->rows || count == 0u)
		return;
	region_h = bottom - top + 1u;
	step = vt_min_u32(count, region_h);

	for (k = 0u; k < step; k++) {
		__u16 evicted = ridx[top];
		if (!vt->alt_screen && top == 0u)
			vt_push_sb_row(vt, evicted);
		for (r = top; r < bottom; r++)
			ridx[r] = ridx[r + 1u];
		ridx[bottom] = evicted;
		vt_clear_evicted_phys(vt, evicted);
		vt->scroll_count++;
	}
	for (r = top; r <= bottom; r++)
		vt_mark_dirty(vt, r);
}

static void vt_scroll_down_region(struct ay_vterm_state *vt, __u32 top, __u32 bottom, __u32 count)
{
	__u16 *ridx = vt_row_idx(vt);
	__u32 region_h;
	__u32 step;
	__u32 k;
	__u32 r;

	if (top >= bottom || bottom >= vt->rows || count == 0u)
		return;
	region_h = bottom - top + 1u;
	step = vt_min_u32(count, region_h);

	for (k = 0u; k < step; k++) {
		__u16 recycled = ridx[bottom];
		for (r = bottom; r > top; r--)
			ridx[r] = ridx[r - 1u];
		ridx[top] = recycled;
		vt_clear_evicted_phys(vt, recycled);
	}
	for (r = top; r <= bottom; r++)
		vt_mark_dirty(vt, r);
}

static void vt_linefeed(struct ay_vterm_state *vt)
{
	if (vt->cursor_y == vt->scroll_bottom) {
		vt_scroll_up_region(vt, vt->scroll_top, vt->scroll_bottom, 1u);
	} else if (vt->cursor_y + 1u < vt->rows) {
		vt->cursor_y++;
	}
}

static __u8 vt_wcwidth(__u32 cp)
{
	if (cp < 0x20u || (cp >= 0x7Fu && cp < 0xA0u))
		return 0u;
	if (cp >= 0x0300u && cp <= 0x036Fu)
		return 0u;
	if (cp >= 0xFE00u && cp <= 0xFE0Fu)
		return 0u;
	if (cp == 0x200Du)
		return 0u;
	/* Box Drawing, Block Elements, Geometric/Dingbats, Powerline/Nerd Font PUA = 1 cell */
	if ((cp >= 0x2500u && cp <= 0x27FFu) || (cp >= 0xE000u && cp <= 0xF8FFu))
		return 1u;
	if ((cp >= 0x1100u && cp <= 0x115Fu) || (cp >= 0x2E80u && cp <= 0x9FFFu) ||
	    (cp >= 0xAC00u && cp <= 0xD7AFu) || (cp >= 0xF900u && cp <= 0xFAFFu) ||
	    (cp >= 0xFF00u && cp <= 0xFF60u) || (cp >= 0xFFE0u && cp <= 0xFFE6u) ||
	    (cp >= 0x1F300u && cp <= 0x1FAFFu))
		return 2u;
	return 1u;
}

static void vt_set_cell(struct ay_vterm_state *vt, __u32 row, __u32 col, __u32 cp, __u32 fg,
			__u32 bg, __u32 flags)
{
	__u16 *ridx = vt_row_idx(vt);
	__u16 *rlen = vt_row_len_arr(vt);
	__u32 phys = ridx[row];
	struct ay_vterm_cell *line = &vt_grid_mut(vt)[phys * AY_VTERM_MAX_COLS];

	line[col].cp = cp;
	line[col].fg = fg;
	line[col].bg = bg;
	line[col].flags = flags;
	if (col + 1u > rlen[phys])
		rlen[phys] = (__u16)(col + 1u);
}

static void vt_insert_chars_in_row(struct ay_vterm_state *vt, __u32 row, __u32 x, __u32 n)
{
	__u16 *ridx = vt_row_idx(vt);
	__u16 *rlen = vt_row_len_arr(vt);
	__u32 phys = ridx[row];
	struct ay_vterm_cell *line = &vt_grid_mut(vt)[phys * AY_VTERM_MAX_COLS];
	__u32 cols = vt->cols;
	__s32 k;

	if (n == 0u || x >= cols)
		return;
	n = vt_min_u32(n, cols - x);
	for (k = (__s32)cols - 1; k >= (__s32)(x + n); k--)
		line[k] = line[k - (__s32)n];
	vt_fill_cells(&line[x], n, vt->cur_bg);
	rlen[phys] = (__u16)vt_min_u32(cols, vt_max_u32(rlen[phys] + n, x + n));
	vt_mark_dirty(vt, row);
}

static void vt_put_cp(struct ay_vterm_state *vt, __u32 cp)
{
	__u8 width = vt_wcwidth(cp);
	__u8 wide = width == 2u ? 1u : 0u;
	__u16 *ridx = vt_row_idx(vt);
	__u8 *rwrap = vt_row_wrap_arr(vt);
	__u32 col;
	__u32 row;

	if (width == 0u)
		return;
	vt->last_cp = cp;
	if (vt->pending_wrap) {
		if (vt->auto_wrap) {
			rwrap[ridx[vt->cursor_y]] = 1u;
			vt->cursor_x = 0u;
			vt->pending_wrap = 0u;
			vt_linefeed(vt);
		} else {
			vt->cursor_x = vt->cols > 0u ? (__u16)(vt->cols - 1u) : 0u;
			vt->pending_wrap = 0u;
		}
	}
	if (wide && vt->cursor_x + 1u >= vt->cols && vt->cols > 1u) {
		if (vt->auto_wrap) {
			rwrap[ridx[vt->cursor_y]] = 1u;
			vt->cursor_x = 0u;
			vt_linefeed(vt);
		} else {
			return;
		}
	}
	col = vt->cursor_x;
	row = vt->cursor_y;
	if (col >= vt->cols || row >= vt->rows)
		return;

	if (vt->insert_mode)
		vt_insert_chars_in_row(vt, row, col, wide ? 2u : 1u);

	/* Clear broken wide pair if overwriting either half */
	{
		__u32 phys = ridx[row];
		struct ay_vterm_cell *line = &vt_grid_mut(vt)[phys * AY_VTERM_MAX_COLS];
		if ((line[col].flags & AY_VTERM_FLAG_CONT) && col > 0u) {
			line[col - 1u].cp = ' ';
			line[col - 1u].flags &= ~(AY_VTERM_FLAG_WIDE | AY_VTERM_FLAG_CONT);
		} else if ((line[col].flags & AY_VTERM_FLAG_WIDE) && col + 1u < vt->cols) {
			line[col + 1u].cp = ' ';
			line[col + 1u].flags &= ~(AY_VTERM_FLAG_WIDE | AY_VTERM_FLAG_CONT);
		}
	}

	vt_set_cell(vt, row, col, cp, vt->cur_fg, vt->cur_bg,
		    vt->cur_flags | (wide ? AY_VTERM_FLAG_WIDE : 0u));
	if (wide && col + 1u < vt->cols) {
		vt_set_cell(vt, row, col + 1u, 0u, vt->cur_fg, vt->cur_bg,
			    vt->cur_flags | AY_VTERM_FLAG_CONT);
		if (col + 2u >= vt->cols) {
			vt->cursor_x = (__u16)(vt->cols - 1u);
			vt->pending_wrap = 1u;
		} else {
			vt->cursor_x = (__u16)(col + 2u);
		}
	} else {
		if (col + 1u >= vt->cols) {
			vt->cursor_x = (__u16)(vt->cols - 1u);
			vt->pending_wrap = 1u;
		} else {
			vt->cursor_x = (__u16)(col + 1u);
		}
	}
	vt_mark_dirty(vt, row);
}

static __u32 vt_param(const struct ay_vterm_state *vt, __u32 idx, __u32 def)
{
	if (idx >= vt->csi_nparams || !vt->csi_has_param[idx])
		return def;
	return vt->csi_params[idx] == 0u ? def : vt->csi_params[idx];
}

static __u32 vt_param_raw(const struct ay_vterm_state *vt, __u32 idx, __u32 def)
{
	if (idx >= vt->csi_nparams || !vt->csi_has_param[idx])
		return def;
	return vt->csi_params[idx];
}

static void vt_handle_sgr(struct ay_vterm_state *vt)
{
	__u32 i = 0u;
	__u32 n = vt->csi_nparams == 0u ? 1u : vt->csi_nparams;

	if (vt->csi_nparams == 0u) {
		vt->cur_fg = 0u;
		vt->cur_bg = 0u;
		vt->cur_flags &= (AY_VTERM_FLAG_LINK | AY_VTERM_FLAG_LINK_SLOT_MASK);
		return;
	}

	while (i < n) {
		__u32 p = vt->csi_has_param[i] ? vt->csi_params[i] : 0u;

		/* Handle subparameters on same code: e.g. 4:3, 38:2::R:G:B, 38:5:idx, 58:2:... */
		if ((p == 38u || p == 48u || p == 58u) && i + 1u < n) {
			__u32 is_colon = (vt->csi_colon_mask >> (i + 1u)) & 1u;
			__u32 kind = vt->csi_has_param[i + 1u] ? vt->csi_params[i + 1u] : 0u;
			__u32 sub_end = i + 1u;
			if (is_colon) {
				while (sub_end + 1u < n && ((vt->csi_colon_mask >> (sub_end + 1u)) & 1u))
					sub_end++;
			}
			if (kind == 5u && i + 2u < n) {
				__u32 cidx = vt->csi_params[i + 2u] & 0xFFu;
				__u32 col = vt_xterm256_argb(cidx, &vt->palette);
				if (p == 38u)
					vt->cur_fg = col;
				else if (p == 48u)
					vt->cur_bg = col;
				i = is_colon ? (sub_end + 1u) : (i + 3u);
				continue;
			}
			if (kind == 2u) {
				__u32 off = 2u;
				/* Support both 38:2:cs:R:G:B (5+ subs or empty cs) and 38:2:R:G:B */
				if (is_colon) {
					__u32 sub_count = sub_end - i;
					if (sub_count >= 5u || (i + 2u < n && !vt->csi_has_param[i + 2u]))
						off = 3u;
				}
				if (i + off + 2u < n) {
					__u32 r = vt->csi_params[i + off];
					__u32 g = vt->csi_params[i + off + 1u];
					__u32 b = vt->csi_params[i + off + 2u];
					__u32 col = vt_rgb_argb(r, g, b);
					if (p == 38u)
						vt->cur_fg = col;
					else if (p == 48u)
						vt->cur_bg = col;
					i = is_colon ? (sub_end + 1u) : (i + off + 3u);
					continue;
				}
			}
			if (is_colon) {
				i = sub_end + 1u;
				continue;
			}
		}

		/* SGR 4:x underline subparameter */
		if (p == 4u && i + 1u < n && ((vt->csi_colon_mask >> (i + 1u)) & 1u)) {
			__u32 sub = vt->csi_has_param[i + 1u] ? vt->csi_params[i + 1u] : 1u;
			vt->cur_flags &= ~(AY_VTERM_FLAG_UNDERLINE | AY_VTERM_FLAG_UL_STYLE_MASK);
			if (sub >= 1u && sub <= 5u)
				vt->cur_flags |= AY_VTERM_FLAG_UNDERLINE | (sub << AY_VTERM_FLAG_UL_STYLE_SHIFT);
			i += 2u;
			while (i < n && ((vt->csi_colon_mask >> i) & 1u))
				i++;
			continue;
		}

		/* Skip any unrecognized colon subparams belonging to current param */
		if (p == 0u) {
			vt->cur_fg = 0u;
			vt->cur_bg = 0u;
			vt->cur_flags &= (AY_VTERM_FLAG_LINK | AY_VTERM_FLAG_LINK_SLOT_MASK);
		} else if (p == 1u) {
			vt->cur_flags |= AY_VTERM_FLAG_BOLD;
		} else if (p == 2u) {
			vt->cur_flags |= AY_VTERM_FLAG_DIM;
		} else if (p == 3u) {
			vt->cur_flags |= AY_VTERM_FLAG_ITALIC;
		} else if (p == 4u) {
			vt->cur_flags = (vt->cur_flags & ~AY_VTERM_FLAG_UL_STYLE_MASK) |
					AY_VTERM_FLAG_UNDERLINE |
					(AY_VTERM_UL_SINGLE << AY_VTERM_FLAG_UL_STYLE_SHIFT);
		} else if (p == 5u || p == 6u) {
			vt->cur_flags |= AY_VTERM_FLAG_BLINK;
		} else if (p == 7u) {
			vt->cur_flags |= AY_VTERM_FLAG_REVERSE;
		} else if (p == 8u) {
			vt->cur_flags |= AY_VTERM_FLAG_HIDDEN;
		} else if (p == 9u) {
			vt->cur_flags |= AY_VTERM_FLAG_STRIKE;
		} else if (p == 21u) {
			vt->cur_flags = (vt->cur_flags & ~AY_VTERM_FLAG_UL_STYLE_MASK) |
					AY_VTERM_FLAG_UNDERLINE |
					(AY_VTERM_UL_DOUBLE << AY_VTERM_FLAG_UL_STYLE_SHIFT);
		} else if (p == 22u) {
			vt->cur_flags &= ~(AY_VTERM_FLAG_BOLD | AY_VTERM_FLAG_DIM);
		} else if (p == 23u) {
			vt->cur_flags &= ~AY_VTERM_FLAG_ITALIC;
		} else if (p == 24u) {
			vt->cur_flags &= ~(AY_VTERM_FLAG_UNDERLINE | AY_VTERM_FLAG_UL_STYLE_MASK);
		} else if (p == 25u) {
			vt->cur_flags &= ~AY_VTERM_FLAG_BLINK;
		} else if (p == 27u) {
			vt->cur_flags &= ~AY_VTERM_FLAG_REVERSE;
		} else if (p == 28u) {
			vt->cur_flags &= ~AY_VTERM_FLAG_HIDDEN;
		} else if (p == 29u) {
			vt->cur_flags &= ~AY_VTERM_FLAG_STRIKE;
		} else if (p >= 30u && p <= 37u) {
			vt->cur_fg = vt->palette.ansi[p - 30u];
		} else if (p == 39u) {
			vt->cur_fg = 0u;
		} else if (p >= 40u && p <= 47u) {
			vt->cur_bg = vt->palette.ansi[p - 40u];
		} else if (p == 49u) {
			vt->cur_bg = 0u;
		} else if (p == 53u) {
			vt->cur_flags |= AY_VTERM_FLAG_OVERLINE;
		} else if (p == 55u) {
			vt->cur_flags &= ~AY_VTERM_FLAG_OVERLINE;
		} else if (p == 59u) {
			/* default underline color */
		} else if (p >= 90u && p <= 97u) {
			vt->cur_fg = vt->palette.ansi[8u + (p - 90u)];
		} else if (p >= 100u && p <= 107u) {
			vt->cur_bg = vt->palette.ansi[8u + (p - 100u)];
		}
		i++;
		while (i < n && ((vt->csi_colon_mask >> i) & 1u))
			i++;
	}
}

static void vt_switch_alt(struct ay_vterm_state *vt, __u8 enable, __u8 save_cursor)
{
	if (enable && !vt->alt_screen) {
		if (save_cursor) {
			vt->alt_saved_x = vt->cursor_x;
			vt->alt_saved_y = vt->cursor_y;
		}
		vt->alt_screen = 1u;
		vt->view_offset = 0u;
		vt->cursor_x = 0u;
		vt->cursor_y = 0u;
		vt->pending_wrap = 0u;
		vt->scroll_top = 0u;
		vt->scroll_bottom = vt->rows > 0u ? (__u16)(vt->rows - 1u) : 0u;
		vt_clear_screen_all(vt);
	} else if (!enable && vt->alt_screen) {
		vt->alt_screen = 0u;
		vt->scroll_top = 0u;
		vt->scroll_bottom = vt->rows > 0u ? (__u16)(vt->rows - 1u) : 0u;
		vt->pending_wrap = 0u;
		if (save_cursor) {
			vt->cursor_x = (__u16)vt_min_u32(vt->alt_saved_x, vt->cols > 0u ? vt->cols - 1u : 0u);
			vt->cursor_y = (__u16)vt_min_u32(vt->alt_saved_y, vt->rows > 0u ? vt->rows - 1u : 0u);
		}
		vt_mark_all_dirty(vt);
	}
}

static void vt_set_dec_private(struct ay_vterm_state *vt, __u32 mode, __u8 set)
{
	switch (mode) {
	case 1u:
		vt->app_cursor = set;
		break;
	case 6u:
		vt->origin_mode = set;
		vt->cursor_x = 0u;
		vt->cursor_y = set ? vt->scroll_top : 0u;
		vt->pending_wrap = 0u;
		break;
	case 7u:
		vt->auto_wrap = set;
		break;
	case 9u:
		vt->mouse_mode = set ? AY_VTERM_MOUSE_X10 : AY_VTERM_MOUSE_NONE;
		break;
	case 25u:
		vt->cursor_visible = set;
		break;
	case 47u:
	case 1047u:
		vt_switch_alt(vt, set, 0u);
		break;
	case 1000u:
		vt->mouse_mode = set ? AY_VTERM_MOUSE_NORMAL : AY_VTERM_MOUSE_NONE;
		break;
	case 1002u:
		vt->mouse_mode = set ? AY_VTERM_MOUSE_BUTTON : AY_VTERM_MOUSE_NONE;
		break;
	case 1003u:
		vt->mouse_mode = set ? AY_VTERM_MOUSE_ANY : AY_VTERM_MOUSE_NONE;
		break;
	case 1004u:
		vt->focus_events = set;
		break;
	case 1005u:
		if (set)
			vt->mouse_format = AY_VTERM_MOUSE_FMT_UTF8;
		else if (vt->mouse_format == AY_VTERM_MOUSE_FMT_UTF8)
			vt->mouse_format = AY_VTERM_MOUSE_FMT_X10;
		break;
	case 1006u:
		if (set)
			vt->mouse_format = AY_VTERM_MOUSE_FMT_SGR;
		else if (vt->mouse_format == AY_VTERM_MOUSE_FMT_SGR)
			vt->mouse_format = AY_VTERM_MOUSE_FMT_X10;
		break;
	case 1016u:
		if (set)
			vt->mouse_format = AY_VTERM_MOUSE_FMT_SGR_PIXEL;
		else if (vt->mouse_format == AY_VTERM_MOUSE_FMT_SGR_PIXEL)
			vt->mouse_format = AY_VTERM_MOUSE_FMT_X10;
		break;
	case 1048u:
		if (set) {
			vt->alt_saved_x = vt->cursor_x;
			vt->alt_saved_y = vt->cursor_y;
		} else {
			vt->cursor_x = (__u16)vt_min_u32(vt->alt_saved_x, vt->cols - 1u);
			vt->cursor_y = (__u16)vt_min_u32(vt->alt_saved_y, vt->rows - 1u);
		}
		break;
	case 1049u:
		vt_switch_alt(vt, set, 1u);
		break;
	case 2004u:
		vt->bracketed_paste = set;
		break;
	case 2026u:
		vt->sync_output = set;
		break;
	default:
		break;
	}
}

static __u32 vt_query_dec_private(const struct ay_vterm_state *vt, __u32 mode)
{
	/* DECRQM status: 1=set, 2=reset, 0=not recognized */
	switch (mode) {
	case 1u:
		return vt->app_cursor ? 1u : 2u;
	case 6u:
		return vt->origin_mode ? 1u : 2u;
	case 7u:
		return vt->auto_wrap ? 1u : 2u;
	case 25u:
		return vt->cursor_visible ? 1u : 2u;
	case 1000u:
		return vt->mouse_mode == AY_VTERM_MOUSE_NORMAL ? 1u : 2u;
	case 1002u:
		return vt->mouse_mode == AY_VTERM_MOUSE_BUTTON ? 1u : 2u;
	case 1003u:
		return vt->mouse_mode == AY_VTERM_MOUSE_ANY ? 1u : 2u;
	case 1004u:
		return vt->focus_events ? 1u : 2u;
	case 1006u:
		return vt->mouse_format == AY_VTERM_MOUSE_FMT_SGR ? 1u : 2u;
	case 1016u:
		return vt->mouse_format == AY_VTERM_MOUSE_FMT_SGR_PIXEL ? 1u : 2u;
	case 1049u:
		return vt->alt_screen ? 1u : 2u;
	case 2004u:
		return vt->bracketed_paste ? 1u : 2u;
	case 2026u:
		return vt->sync_output ? 1u : 2u;
	default:
		return 0u;
	}
}

static void vt_save_cursor(struct ay_vterm_state *vt)
{
	vt->saved_x = vt->cursor_x;
	vt->saved_y = vt->cursor_y;
	vt->saved_fg = vt->cur_fg;
	vt->saved_bg = vt->cur_bg;
	vt->saved_flags = vt->cur_flags;
}

static void vt_restore_cursor(struct ay_vterm_state *vt)
{
	vt->cursor_x = (__u16)vt_min_u32(vt->saved_x, vt->cols > 0u ? vt->cols - 1u : 0u);
	vt->cursor_y = (__u16)vt_min_u32(vt->saved_y, vt->rows > 0u ? vt->rows - 1u : 0u);
	vt->cur_fg = vt->saved_fg;
	vt->cur_bg = vt->saved_bg;
	vt->cur_flags = vt->saved_flags;
	vt->pending_wrap = 0u;
}

static __u32 vt_current_kitty_flags(const struct ay_vterm_state *vt)
{
	__u8 sp = vt->alt_screen ? vt->alt_kitty_sp : vt->kitty_sp;
	const __u32 *st = vt->alt_screen ? vt->alt_kitty_stack : vt->kitty_stack;
	return sp > 0u ? st[sp - 1u] : 0u;
}

static void vt_handle_kitty_u(struct ay_vterm_state *vt)
{
	__u32 *st = vt->alt_screen ? vt->alt_kitty_stack : vt->kitty_stack;
	__u8 *sp = vt->alt_screen ? &vt->alt_kitty_sp : &vt->kitty_sp;

	if (vt->csi_private == '?') {
		char buf[32];
		__u32 len = 0u;
		buf[len++] = '\x1b';
		buf[len++] = '[';
		buf[len++] = '?';
		len += vt_fmt_u32(buf + len, vt_current_kitty_flags(vt));
		buf[len++] = 'u';
		vt_queue_reply(vt, buf, len);
		return;
	}
	if (vt->csi_private == '>') {
		__u32 flags = vt_param_raw(vt, 0u, 0u);
		if (*sp < AY_VTERM_KITTY_STACK) {
			st[*sp] = flags;
			(*sp)++;
		} else {
			__u32 j;
			for (j = 0u; j + 1u < AY_VTERM_KITTY_STACK; j++)
				st[j] = st[j + 1u];
			st[AY_VTERM_KITTY_STACK - 1u] = flags;
		}
		return;
	}
	if (vt->csi_private == '<') {
		__u32 n = vt_param(vt, 0u, 1u);
		if (n >= *sp)
			*sp = 0u;
		else
			*sp = (__u8)(*sp - n);
		return;
	}
	if (vt->csi_private == '=') {
		__u32 flags = vt_param_raw(vt, 0u, 0u);
		__u32 mode = vt_param_raw(vt, 1u, 1u);
		__u32 cur = vt_current_kitty_flags(vt);
		__u32 next = cur;
		if (mode == 1u)
			next = flags;
		else if (mode == 2u)
			next = cur | flags;
		else if (mode == 3u)
			next = cur & ~flags;
		if (*sp == 0u)
			*sp = 1u;
		st[*sp - 1u] = next;
		return;
	}
	/* Legacy CSI u = restore cursor */
	vt_restore_cursor(vt);
}

static void vt_handle_csi(struct ay_vterm_state *vt, __u8 final)
{
	__u32 n = vt_param(vt, 0u, 1u);
	__u32 p0_raw = vt_param_raw(vt, 0u, 0u);

	if (vt->csi_private == '?' && (final == 'h' || final == 'l')) {
		__u32 i;
		__u8 set = final == 'h' ? 1u : 0u;
		for (i = 0u; i < vt->csi_nparams; i++) {
			if (vt->csi_has_param[i])
				vt_set_dec_private(vt, vt->csi_params[i], set);
		}
		return;
	}
	if (vt->csi_private == '?' && vt->csi_inter == '$' && final == 'p') {
		char buf[40];
		__u32 len = 0u;
		__u32 mode = vt_param_raw(vt, 0u, 0u);
		__u32 st = vt_query_dec_private(vt, mode);
		buf[len++] = '\x1b';
		buf[len++] = '[';
		buf[len++] = '?';
		len += vt_fmt_u32(buf + len, mode);
		buf[len++] = ';';
		len += vt_fmt_u32(buf + len, st);
		buf[len++] = '$';
		buf[len++] = 'y';
		vt_queue_reply(vt, buf, len);
		return;
	}
	if (vt->csi_inter == ' ' && final == 'q') {
		__u32 st = vt_param_raw(vt, 0u, 1u);
		vt->cursor_style = (__u8)(st >= 1u && st <= 6u ? st : AY_VTERM_CURSOR_BLOCK);
		return;
	}
	if (vt->csi_private == '>' && final == 'c') {
		static const char da2[] = "\x1b[>1;100;0c";
		vt_queue_reply(vt, da2, 11u);
		return;
	}

	switch (final) {
	case 'c':
		if (vt->csi_private == 0u && p0_raw == 0u) {
			static const char da1[] = "\x1b[?62;1;4;6;22;52c";
			vt_queue_reply(vt, da1, 18u);
		}
		break;
	case 'n':
		if (vt->csi_private == 0u) {
			if (p0_raw == 5u) {
				vt_queue_reply(vt, "\x1b[0n", 4u);
			} else if (p0_raw == 6u) {
				char buf[32];
				__u32 len = 0u;
				__u32 r = (__u32)vt->cursor_y + 1u;
				if (vt->origin_mode && r > vt->scroll_top)
					r -= vt->scroll_top;
				buf[len++] = '\x1b';
				buf[len++] = '[';
				len += vt_fmt_u32(buf + len, r);
				buf[len++] = ';';
				len += vt_fmt_u32(buf + len, (__u32)vt->cursor_x + 1u);
				buf[len++] = 'R';
				vt_queue_reply(vt, buf, len);
			}
		}
		break;
	case 't':
		if (vt->csi_private == 0u && (p0_raw == 14u || p0_raw == 18u)) {
			char buf[32];
			__u32 len = 0u;
			buf[len++] = '\x1b';
			buf[len++] = '[';
			buf[len++] = '8';
			buf[len++] = ';';
			len += vt_fmt_u32(buf + len, vt->rows);
			buf[len++] = ';';
			len += vt_fmt_u32(buf + len, vt->cols);
			buf[len++] = 't';
			vt_queue_reply(vt, buf, len);
		}
		break;
	case 'u':
		vt_handle_kitty_u(vt);
		break;
	case 'm':
		if (vt->csi_private == 0u)
			vt_handle_sgr(vt);
		break;
	case 'h':
	case 'l':
		if (vt->csi_private == 0u) {
			__u8 set = final == 'h' ? 1u : 0u;
			__u32 i;
			for (i = 0u; i < vt->csi_nparams; i++) {
				if (!vt->csi_has_param[i])
					continue;
				if (vt->csi_params[i] == 4u)
					vt->insert_mode = set;
				else if (vt->csi_params[i] == 20u)
					vt->newline_mode = set;
			}
		}
		break;
	case 'A':
		vt->pending_wrap = 0u;
		{
			__s32 top = vt->cursor_y >= vt->scroll_top ? (__s32)vt->scroll_top : 0;
			vt->cursor_y = (__u16)vt_clamp_s32((__s32)vt->cursor_y - (__s32)n, top, (__s32)vt->rows - 1);
		}
		break;
	case 'B':
	case 'e':
		vt->pending_wrap = 0u;
		{
			__s32 bot = vt->cursor_y <= vt->scroll_bottom ? (__s32)vt->scroll_bottom : (__s32)vt->rows - 1;
			vt->cursor_y = (__u16)vt_clamp_s32((__s32)vt->cursor_y + (__s32)n, 0, bot);
		}
		break;
	case 'C':
	case 'a':
		vt->pending_wrap = 0u;
		vt->cursor_x = (__u16)vt_clamp_s32((__s32)vt->cursor_x + (__s32)n, 0, (__s32)vt->cols - 1);
		break;
	case 'D':
		vt->pending_wrap = 0u;
		vt->cursor_x = (__u16)vt_clamp_s32((__s32)vt->cursor_x - (__s32)n, 0, (__s32)vt->cols - 1);
		break;
	case 'E':
		vt->pending_wrap = 0u;
		vt->cursor_y = (__u16)vt_clamp_s32((__s32)vt->cursor_y + (__s32)n, 0, (__s32)vt->rows - 1);
		vt->cursor_x = 0u;
		break;
	case 'F':
		vt->pending_wrap = 0u;
		vt->cursor_y = (__u16)vt_clamp_s32((__s32)vt->cursor_y - (__s32)n, 0, (__s32)vt->rows - 1);
		vt->cursor_x = 0u;
		break;
	case 'G':
	case '`':
		vt->pending_wrap = 0u;
		vt->cursor_x = (__u16)vt_clamp_s32((__s32)vt_param(vt, 0u, 1u) - 1, 0, (__s32)vt->cols - 1);
		break;
	case 'd':
		vt->pending_wrap = 0u;
		vt->cursor_y = (__u16)vt_clamp_s32((__s32)vt_param(vt, 0u, 1u) - 1, 0, (__s32)vt->rows - 1);
		break;
	case 'H':
	case 'f':
		vt->pending_wrap = 0u;
		{
			__s32 row = (__s32)vt_param(vt, 0u, 1u) - 1;
			__s32 col = (__s32)vt_param(vt, 1u, 1u) - 1;
			__s32 lo_r = vt->origin_mode ? (__s32)vt->scroll_top : 0;
			__s32 hi_r = vt->origin_mode ? (__s32)vt->scroll_bottom : (__s32)vt->rows - 1;
			vt->cursor_y = (__u16)vt_clamp_s32(lo_r + row, lo_r, hi_r);
			vt->cursor_x = (__u16)vt_clamp_s32(col, 0, (__s32)vt->cols - 1);
		}
		break;
	case 'J':
		vt->pending_wrap = 0u;
		if (p0_raw == 0u) {
			__u32 r;
			vt_clear_row(vt, vt->cursor_y, vt->cursor_x, vt->cols);
			for (r = vt->cursor_y + 1u; r < vt->rows; r++)
				vt_clear_row(vt, r, 0u, vt->cols);
		} else if (p0_raw == 1u) {
			__u32 r;
			for (r = 0u; r < vt->cursor_y; r++)
				vt_clear_row(vt, r, 0u, vt->cols);
			vt_clear_row(vt, vt->cursor_y, 0u, vt->cursor_x + 1u);
		} else if (p0_raw == 2u || p0_raw == 3u) {
			if (p0_raw == 3u && !vt->alt_screen) {
				vt->sb_head = 0u;
				vt->sb_len = 0u;
				vt->view_offset = 0u;
			}
			vt_clear_screen_all(vt);
		}
		break;
	case 'K':
		vt->pending_wrap = 0u;
		if (p0_raw == 0u)
			vt_clear_row(vt, vt->cursor_y, vt->cursor_x, vt->cols);
		else if (p0_raw == 1u)
			vt_clear_row(vt, vt->cursor_y, 0u, vt->cursor_x + 1u);
		else if (p0_raw == 2u)
			vt_clear_row(vt, vt->cursor_y, 0u, vt->cols);
		break;
	case 'X':
		vt->pending_wrap = 0u;
		vt_clear_row(vt, vt->cursor_y, vt->cursor_x, vt_min_u32(vt->cursor_x + n, vt->cols));
		break;
	case 'L':
		if (vt->cursor_y >= vt->scroll_top && vt->cursor_y <= vt->scroll_bottom)
			vt_scroll_down_region(vt, vt->cursor_y, vt->scroll_bottom, n);
		break;
	case 'M':
		if (vt->cursor_y >= vt->scroll_top && vt->cursor_y <= vt->scroll_bottom)
			vt_scroll_up_region(vt, vt->cursor_y, vt->scroll_bottom, n);
		break;
	case 'S':
		vt_scroll_up_region(vt, vt->scroll_top, vt->scroll_bottom, n);
		break;
	case 'T':
		vt_scroll_down_region(vt, vt->scroll_top, vt->scroll_bottom, n);
		break;
	case '@':
		vt_insert_chars_in_row(vt, vt->cursor_y, vt->cursor_x, n);
		break;
	case 'P':
		{
			__u32 row = vt->cursor_y;
			__u16 *ridx = vt_row_idx(vt);
			__u16 *rlen = vt_row_len_arr(vt);
			__u32 phys = ridx[row];
			struct ay_vterm_cell *line = &vt_grid_mut(vt)[phys * AY_VTERM_MAX_COLS];
			__u32 x;
			__u32 del = vt_min_u32(n, vt->cols - vt->cursor_x);
			for (x = vt->cursor_x; x + del < vt->cols; x++)
				line[x] = line[x + del];
			vt_fill_cells(&line[vt->cols - del], del, vt->cur_bg);
			if (vt->cur_bg == 0u) {
				if (rlen[phys] > vt->cursor_x)
					rlen[phys] = rlen[phys] > del ? (__u16)(rlen[phys] - del) : vt->cursor_x;
			} else {
				rlen[phys] = vt->cols;
			}
			vt_mark_dirty(vt, row);
		}
		break;
	case 'b':
		if (vt->last_cp >= 0x20u) {
			__u32 k;
			__u32 rep = vt_min_u32(n, vt->cols);
			for (k = 0u; k < rep; k++)
				vt_put_cp(vt, vt->last_cp);
		}
		break;
	case 'Z':
		vt->pending_wrap = 0u;
		{
			__u32 k;
			for (k = 0u; k < n && vt->cursor_x > 0u; k++)
				vt->cursor_x = (__u16)((vt->cursor_x - 1u) & ~7u);
		}
		break;
	case 'r':
		if (vt->csi_private == 0u) {
			__u32 top = vt_param(vt, 0u, 1u) - 1u;
			__u32 bot = vt_param(vt, 1u, vt->rows) - 1u;
			if (top < bot && bot < vt->rows) {
				vt->scroll_top = (__u16)top;
				vt->scroll_bottom = (__u16)bot;
			} else {
				vt->scroll_top = 0u;
				vt->scroll_bottom = vt->rows > 0u ? (__u16)(vt->rows - 1u) : 0u;
			}
			vt->cursor_x = 0u;
			vt->cursor_y = vt->origin_mode ? vt->scroll_top : 0u;
			vt->pending_wrap = 0u;
		}
		break;
	case 's':
		if (vt->csi_private == 0u)
			vt_save_cursor(vt);
		break;
	default:
		break;
	}
}

static __u32 vt_parse_dec(const char *s, __u32 len, __s32 *out)
{
	__u32 i = 0u;
	__s32 sign = 1;
	__s32 val = 0;
	__u32 any = 0u;

	if (i < len && s[i] == '-') {
		sign = -1;
		i++;
	}
	while (i < len && s[i] >= '0' && s[i] <= '9') {
		val = val * 10 + (s[i] - '0');
		i++;
		any = 1u;
	}
	*out = any ? sign * val : 0;
	return any;
}

static const struct ay_vterm_cell *vt_abs_row_cells(const struct ay_vterm_state *vt, __u32 abs_r,
						    __u32 *out_len)
{
	__u32 cur_base = vt->main_scroll_seq;

	if (abs_r >= cur_base) {
		__u32 sr = abs_r - cur_base;
		if (sr < vt->rows) {
			__u32 phys = vt->main_row_idx[sr];
			*out_len = vt->main_row_len[phys];
			return &vt->main_cells[phys * AY_VTERM_MAX_COLS];
		}
		*out_len = 0u;
		return 0;
	}
	{
		__u32 age = cur_base - abs_r; /* 1 = most recent pushed row */
		if (age <= vt->sb_len) {
			__u32 slot = (vt->sb_head + AY_VTERM_SCROLLBACK_ROWS - age) &
				     (AY_VTERM_SCROLLBACK_ROWS - 1u);
			*out_len = vt->sb_row_len[slot];
			return &vt->sb_cells[slot * AY_VTERM_MAX_COLS];
		}
	}
	*out_len = 0u;
	return 0;
}

static void vt_capture_command(struct ay_vterm_state *vt, __s32 slot, __u32 cmd_abs,
			       __u32 start_col)
{
	struct ay_vterm_block *b = &vt->blocks[slot];
	__u32 end_abs = vt->main_scroll_seq + vt->cursor_y;
	__u32 abs_r;
	__u32 out = 0u;

	b->cmd_len = 0u;
	b->command[0] = '\0';

	if (end_abs < cmd_abs)
		end_abs = cmd_abs;
	if (end_abs - cmd_abs > 4u)
		end_abs = cmd_abs + 4u;

	for (abs_r = cmd_abs; abs_r <= end_abs && out + 1u < AY_VTERM_CMD_CAP; abs_r++) {
		__u32 rlen = 0u;
		const struct ay_vterm_cell *row = vt_abs_row_cells(vt, abs_r, &rlen);
		__u32 end_c;
		__u32 c0;
		__u32 c;
		if (!row)
			continue;
		end_c = vt_min_u32(rlen, vt->cols);
		c0 = (abs_r == cmd_abs) ? start_col : 0u;
		while (end_c > c0 && (row[end_c - 1u].cp == ' ' || row[end_c - 1u].cp == 0u))
			end_c--;
		if (end_c <= c0)
			continue;
		if (out > 0u && out + 1u < AY_VTERM_CMD_CAP)
			b->command[out++] = ' ';
		for (c = c0; c < end_c && out + 1u < AY_VTERM_CMD_CAP; c++) {
			__u32 cp = row[c].cp;
			if (cp == 0u)
				continue;
			if (cp < 0x80u) {
				b->command[out++] = (char)cp;
			} else if (cp < 0x800u && out + 2u < AY_VTERM_CMD_CAP) {
				b->command[out++] = (char)(0xC0u | (cp >> 6u));
				b->command[out++] = (char)(0x80u | (cp & 0x3Fu));
			} else if (cp < 0x10000u && out + 3u < AY_VTERM_CMD_CAP) {
				b->command[out++] = (char)(0xE0u | (cp >> 12u));
				b->command[out++] = (char)(0x80u | ((cp >> 6u) & 0x3Fu));
				b->command[out++] = (char)(0x80u | (cp & 0x3Fu));
			}
		}
	}
	b->command[out] = '\0';
	b->cmd_len = out;
}

static void vt_handle_osc133(struct ay_vterm_state *vt, const char *p, __u32 len)
{
	char kind;
	__u32 abs_now = vt->main_scroll_seq + vt->cursor_y;

	if (len == 0u)
		return;
	kind = p[0];
	if (kind == 'A') {
		__u32 slot;
		struct ay_vterm_block *b;

		if (vt->block_count < AY_VTERM_MAX_BLOCKS) {
			slot = (vt->block_head + vt->block_count) % AY_VTERM_MAX_BLOCKS;
			vt->block_count++;
		} else {
			slot = vt->block_head;
			vt->block_head = (vt->block_head + 1u) % AY_VTERM_MAX_BLOCKS;
		}
		vt->active_block_idx = (__s32)slot;
		b = &vt->blocks[slot];
		__builtin_memset(b, 0, sizeof(*b));
		b->id = ++vt->next_block_id;
		b->state = AY_VTERM_BLOCK_PROMPT;
		vt->block_start_abs[slot] = abs_now;
		vt->block_cmd_abs[slot] = abs_now;
		vt->block_out_abs[slot] = abs_now;
		vt->block_end_abs[slot] = abs_now;
		vt->block_cmd_col[slot] = vt->cursor_x;
	} else if (kind == 'B' && vt->active_block_idx >= 0) {
		__u32 slot = (__u32)vt->active_block_idx;
		vt->blocks[slot].state = AY_VTERM_BLOCK_INPUT;
		vt->block_cmd_abs[slot] = abs_now;
		vt->block_out_abs[slot] = abs_now;
		vt->block_cmd_col[slot] = vt->cursor_x;
	} else if (kind == 'C' && vt->active_block_idx >= 0) {
		__u32 slot = (__u32)vt->active_block_idx;
		vt->blocks[slot].state = AY_VTERM_BLOCK_RUNNING;
		vt->block_out_abs[slot] = abs_now;
		vt_capture_command(vt, (__s32)slot, vt->block_cmd_abs[slot], vt->block_cmd_col[slot]);
	} else if (kind == 'D' && vt->active_block_idx >= 0) {
		__u32 slot = (__u32)vt->active_block_idx;
		struct ay_vterm_block *b = &vt->blocks[slot];
		__s32 code = 0;

		if (len >= 3u && p[1] == ';')
			(void)vt_parse_dec(p + 2u, len - 2u, &code);
		b->exit_code = code;
		b->state = AY_VTERM_BLOCK_DONE;
		vt->block_end_abs[slot] = abs_now;
		vt->last_exit_code = code;
		if (code != 0) {
			__u32 start_sr = vt->block_out_abs[slot] > vt->main_scroll_seq
						 ? vt->block_out_abs[slot] - vt->main_scroll_seq
						 : 0u;
			__u32 end_sr = abs_now > vt->main_scroll_seq
					       ? vt_min_u32(abs_now - vt->main_scroll_seq, vt->rows - 1u)
					       : 0u;
			__u32 r;
			vt->failed_count++;
			if (!vt->alt_screen) {
				for (r = start_sr; r <= end_sr && r < vt->rows; r++) {
					__u32 phys = vt->main_row_idx[r];
					__u32 c;
					__u32 clim = vt_min_u32(vt->main_row_len[phys], vt->cols);
					struct ay_vterm_cell *line =
						&vt->main_cells[phys * AY_VTERM_MAX_COLS];
					for (c = 0u; c < clim; c++)
						line[c].flags |= AY_VTERM_FLAG_ERROR;
					vt_mark_dirty(vt, r);
				}
			}
		}
		vt->active_block_idx = -1;
	}
}

static __s32 vt_b64_val(char ch)
{
	if (ch >= 'A' && ch <= 'Z')
		return ch - 'A';
	if (ch >= 'a' && ch <= 'z')
		return 26 + (ch - 'a');
	if (ch >= '0' && ch <= '9')
		return 52 + (ch - '0');
	if (ch == '+')
		return 62;
	if (ch == '/')
		return 63;
	return -1;
}

static __u32 vt_b64_decode(const char *src, __u32 src_len, char *dst, __u32 dst_cap)
{
	__u32 acc = 0u;
	__u32 bits = 0u;
	__u32 out = 0u;
	__u32 i;

	for (i = 0u; i < src_len && out + 1u < dst_cap; i++) {
		__s32 v = vt_b64_val(src[i]);
		if (v < 0)
			continue;
		acc = (acc << 6u) | (__u32)v;
		bits += 6u;
		if (bits >= 8u) {
			bits -= 8u;
			dst[out++] = (char)((acc >> bits) & 0xFFu);
		}
	}
	dst[out] = '\0';
	return out;
}

static void vt_handle_osc(struct ay_vterm_state *vt)
{
	const char *s = vt->osc_buf;
	__u32 len = vt->osc_len;
	__u32 code = 0u;
	__u32 i = 0u;

	while (i < len && s[i] >= '0' && s[i] <= '9') {
		code = code * 10u + (__u32)(s[i] - '0');
		i++;
	}
	if (i >= len || s[i] != ';')
		return;
	i++;
	if (code == 0u || code == 2u) {
		__u32 n = vt_min_u32(len - i, AY_VTERM_TITLE_CAP - 1u);
		__u32 k;
		for (k = 0u; k < n; k++)
			vt->title[k] = s[i + k];
		vt->title[n] = '\0';
		vt->title_len = n;
		vt->title_dirty = 1u;
	} else if (code == 7u) {
		__u32 n = vt_min_u32(len - i, AY_VTERM_CWD_CAP - 1u);
		__u32 k;
		for (k = 0u; k < n; k++)
			vt->cwd[k] = s[i + k];
		vt->cwd[n] = '\0';
		vt->cwd_len = n;
		vt->cwd_dirty = 1u;
	} else if (code == 8u) {
		__u32 k = i;
		while (k < len && s[k] != ';')
			k++;
		if (k < len && s[k] == ';') {
			k++;
			if (k < len) {
				__u8 slot = (__u8)((vt->next_link_slot % (AY_VTERM_MAX_LINKS - 1u)) + 1u);
				__u32 ulen = vt_min_u32(len - k, AY_VTERM_LINK_CAP - 1u);
				__u32 j;
				vt->next_link_slot++;
				for (j = 0u; j < ulen; j++)
					vt->links[slot][j] = s[k + j];
				vt->links[slot][ulen] = '\0';
				vt->link_lens[slot] = (__u16)ulen;
				vt->in_link = 1u;
				vt->cur_link_slot = slot;
				vt->cur_flags = (vt->cur_flags & ~AY_VTERM_FLAG_LINK_SLOT_MASK) |
						AY_VTERM_FLAG_LINK |
						((__u32)slot << AY_VTERM_FLAG_LINK_SLOT_SHIFT);
			} else {
				vt->in_link = 0u;
				vt->cur_link_slot = 0u;
				vt->cur_flags &= ~(AY_VTERM_FLAG_LINK | AY_VTERM_FLAG_LINK_SLOT_MASK);
			}
		}
	} else if ((code == 10u || code == 11u) && i < len && s[i] == '?') {
		__u32 argb = (code == 10u) ? vt->palette.fg : vt->palette.bg;
		char resp[32];
		__u32 n = 0u;
		resp[n++] = '\x1b';
		resp[n++] = ']';
		resp[n++] = '1';
		resp[n++] = (code == 10u) ? '0' : '1';
		resp[n++] = ';';
		resp[n++] = 'r';
		resp[n++] = 'g';
		resp[n++] = 'b';
		resp[n++] = ':';
		vt_fmt_hex4(resp + n, (__u8)((argb >> 16u) & 0xFFu));
		n += 4u;
		resp[n++] = '/';
		vt_fmt_hex4(resp + n, (__u8)((argb >> 8u) & 0xFFu));
		n += 4u;
		resp[n++] = '/';
		vt_fmt_hex4(resp + n, (__u8)(argb & 0xFFu));
		n += 4u;
		resp[n++] = '\x1b';
		resp[n++] = '\\';
		vt_queue_reply(vt, resp, n);
	} else if (code == 52u) {
		__u32 k = i;
		while (k < len && s[k] != ';')
			k++;
		if (k < len && s[k] == ';') {
			k++;
			if (k < len && s[k] != '?') {
				vt->clip_len = vt_b64_decode(s + k, len - k, vt->clip_buf, AY_VTERM_CLIP_CAP);
				vt->clip_dirty = 1u;
			}
		}
	} else if (code == 133u) {
		vt_handle_osc133(vt, s + i, len - i);
	}
}

static void vt_process_byte(struct ay_vterm_state *vt, __u8 b)
{
	if (vt->utf8_need > 0u) {
		if ((b & 0xC0u) == 0x80u) {
			vt->utf8_cp = (vt->utf8_cp << 6u) | (b & 0x3Fu);
			vt->utf8_need--;
			if (vt->utf8_need == 0u) {
				__u32 cp = vt->utf8_cp;
				if (cp < vt->utf8_min || cp > 0x10FFFFu || (cp >= 0xD800u && cp <= 0xDFFFu))
					cp = 0xFFFDu;
				vt_put_cp(vt, cp);
			}
			return;
		}
		vt->utf8_need = 0u;
	}

	if (vt->esc_state == VT_OSC) {
		if (b == 0x07u) {
			vt_handle_osc(vt);
			vt->esc_state = VT_GROUND;
			vt->osc_esc_pending = 0u;
			return;
		}
		if (vt->osc_esc_pending) {
			vt->osc_esc_pending = 0u;
			if (b == '\\') {
				vt_handle_osc(vt);
				vt->esc_state = VT_GROUND;
				return;
			}
		}
		if (b == 0x1Bu) {
			vt->osc_esc_pending = 1u;
			return;
		}
		if (b == 0x9Cu) {
			vt_handle_osc(vt);
			vt->esc_state = VT_GROUND;
			return;
		}
		if (vt->osc_len + 1u < AY_VTERM_OSC_CAP)
			vt->osc_buf[vt->osc_len++] = (char)b;
		return;
	}

	if (vt->esc_state == VT_DCS_SKIP) {
		if (b == 0x07u || b == 0x9Cu) {
			vt->esc_state = VT_GROUND;
			vt->osc_esc_pending = 0u;
			return;
		}
		if (vt->osc_esc_pending && b == '\\') {
			vt->esc_state = VT_GROUND;
			vt->osc_esc_pending = 0u;
			return;
		}
		vt->osc_esc_pending = (b == 0x1Bu) ? 1u : 0u;
		return;
	}

	if (vt->esc_state == VT_ESC) {
		if (b == '[') {
			vt->esc_state = VT_CSI;
			vt->csi_private = 0u;
			vt->csi_inter = 0u;
			vt->csi_nparams = 0u;
			vt->csi_colon_mask = 0u;
			__builtin_memset(vt->csi_params, 0, sizeof(vt->csi_params));
			__builtin_memset(vt->csi_has_param, 0, sizeof(vt->csi_has_param));
		} else if (b == ']') {
			vt->esc_state = VT_OSC;
			vt->osc_len = 0u;
			vt->osc_esc_pending = 0u;
		} else if (b == 'P' || b == '_' || b == '^' || b == 'X') {
			vt->esc_state = VT_DCS_SKIP;
			vt->osc_esc_pending = 0u;
		} else if (b == '(' || b == ')' || b == '*' || b == '+') {
			vt->esc_state = VT_ESC_CHARSET;
		} else if (b == '#') {
			vt->esc_state = VT_ESC_HASH;
		} else if (b == '7') {
			vt_save_cursor(vt);
			vt->esc_state = VT_GROUND;
		} else if (b == '8') {
			vt_restore_cursor(vt);
			vt->esc_state = VT_GROUND;
		} else if (b == 'D') {
			vt->pending_wrap = 0u;
			vt_linefeed(vt);
			vt->esc_state = VT_GROUND;
		} else if (b == 'M') {
			vt->pending_wrap = 0u;
			if (vt->cursor_y == vt->scroll_top)
				vt_scroll_down_region(vt, vt->scroll_top, vt->scroll_bottom, 1u);
			else if (vt->cursor_y > 0u)
				vt->cursor_y--;
			vt->esc_state = VT_GROUND;
		} else if (b == 'E') {
			vt->cursor_x = 0u;
			vt->pending_wrap = 0u;
			vt_linefeed(vt);
			vt->esc_state = VT_GROUND;
		} else if (b == 'c') {
			__u32 c = vt->cols;
			__u32 r = vt->rows;
			__u32 t = vt->theme_idx;
			ay_vterm_init(vt, c, r, t);
		} else {
			vt->esc_state = VT_GROUND;
		}
		return;
	}

	if (vt->esc_state == VT_ESC_CHARSET || vt->esc_state == VT_ESC_HASH) {
		vt->esc_state = VT_GROUND;
		return;
	}

	if (vt->esc_state == VT_CSI) {
		if (b == '?' || b == '>' || b == '=' || b == '<') {
			if (vt->csi_nparams == 0u && !vt->csi_has_param[0])
				vt->csi_private = b;
			return;
		}
		if (b >= '0' && b <= '9') {
			__u32 idx = vt->csi_nparams == 0u ? 0u : vt->csi_nparams - 1u;
			if (vt->csi_nparams == 0u)
				vt->csi_nparams = 1u;
			if (idx < AY_VTERM_CSI_PARAMS) {
				vt->csi_params[idx] = vt->csi_params[idx] * 10u + (__u32)(b - '0');
				vt->csi_has_param[idx] = 1u;
			}
			return;
		}
		if (b == ';' || b == ':') {
			if (vt->csi_nparams == 0u)
				vt->csi_nparams = 1u;
			if (vt->csi_nparams < AY_VTERM_CSI_PARAMS) {
				if (b == ':')
					vt->csi_colon_mask |= 1u << vt->csi_nparams;
				vt->csi_nparams++;
			}
			return;
		}
		if (b >= 0x20u && b <= 0x2Fu) {
			vt->csi_inter = b;
			return;
		}
		if (b >= 0x40u && b <= 0x7Eu) {
			vt_handle_csi(vt, b);
			vt->esc_state = VT_GROUND;
			return;
		}
		if (b == 0x1Bu) {
			vt->esc_state = VT_ESC;
			return;
		}
		if (b < 0x20u) {
			if (b == '\n' || b == '\x0b' || b == '\x0c')
				vt_linefeed(vt);
			else if (b == '\r')
				vt->cursor_x = 0u;
			else if (b == '\b' && vt->cursor_x > 0u)
				vt->cursor_x--;
			return;
		}
		vt->esc_state = VT_GROUND;
		return;
	}

	/* VT_GROUND */
	if (b == 0x1Bu) {
		vt->esc_state = VT_ESC;
		return;
	}
	if (b == 0x9Bu) {
		vt->esc_state = VT_CSI;
		vt->csi_private = 0u;
		vt->csi_inter = 0u;
		vt->csi_nparams = 0u;
		vt->csi_colon_mask = 0u;
		__builtin_memset(vt->csi_params, 0, sizeof(vt->csi_params));
		__builtin_memset(vt->csi_has_param, 0, sizeof(vt->csi_has_param));
		return;
	}
	if (b == 0x9Du) {
		vt->esc_state = VT_OSC;
		vt->osc_len = 0u;
		vt->osc_esc_pending = 0u;
		return;
	}
	if (b == '\r') {
		vt->cursor_x = 0u;
		vt->pending_wrap = 0u;
		return;
	}
	if (b == '\n' || b == '\x0b' || b == '\x0c') {
		vt->pending_wrap = 0u;
		if (vt->newline_mode)
			vt->cursor_x = 0u;
		vt_linefeed(vt);
		return;
	}
	if (b == '\b') {
		vt->pending_wrap = 0u;
		if (vt->cursor_x > 0u)
			vt->cursor_x--;
		return;
	}
	if (b == '\t') {
		__u32 next_tab = (vt->cursor_x + 8u) & ~7u;
		vt->pending_wrap = 0u;
		vt->cursor_x = (__u16)vt_min_u32(next_tab, vt->cols > 0u ? vt->cols - 1u : 0u);
		return;
	}
	if (b < 0x20u || b == 0x7Fu)
		return;
	if (b < 0x80u) {
		vt_put_cp(vt, b);
		return;
	}
	if ((b & 0xE0u) == 0xC0u) {
		vt->utf8_cp = b & 0x1Fu;
		vt->utf8_need = 1u;
		vt->utf8_min = 0x80u;
	} else if ((b & 0xF0u) == 0xE0u) {
		vt->utf8_cp = b & 0x0Fu;
		vt->utf8_need = 2u;
		vt->utf8_min = 0x800u;
	} else if ((b & 0xF8u) == 0xF0u) {
		vt->utf8_cp = b & 0x07u;
		vt->utf8_need = 3u;
		vt->utf8_min = 0x10000u;
	} else {
		vt_put_cp(vt, 0xFFFDu);
	}
}

__u32 ay_vterm_abi_version(void)
{
	return AY_VTERM_ABI_VERSION;
}

__u32 ay_vterm_state_bytes(void)
{
	return (__u32)sizeof(struct ay_vterm_state);
}

__s32 ay_vterm_init(struct ay_vterm_state *vt, __u32 cols, __u32 rows, __u32 theme_idx)
{
	__u32 max_t;
	__u32 i;
	__usize hdr_bytes;

	if (!vt)
		return -AY_EINVAL;
	if (cols == 0u || cols > AY_VTERM_MAX_COLS || rows == 0u || rows > AY_VTERM_MAX_ROWS)
		return -AY_EINVAL;

	hdr_bytes = (__usize)((const __u8 *)&vt->sb_cells[0] - (const __u8 *)vt);
	__builtin_memset(vt, 0, hdr_bytes);

	max_t = ay_term_theme_count();
	if (theme_idx >= max_t)
		theme_idx = 0u;
	vt->theme_idx = theme_idx;
	ay_term_palette_get(theme_idx, &vt->palette);

	vt->cols = (__u16)cols;
	vt->rows = (__u16)rows;
	vt->scroll_bottom = (__u16)(rows - 1u);
	vt->cursor_visible = 1u;
	vt->cursor_style = AY_VTERM_CURSOR_BAR;
	vt->auto_wrap = 1u;
	vt->active_block_idx = -1;

	for (i = 0u; i < AY_VTERM_MAX_ROWS; i++) {
		vt->main_row_idx[i] = (__u16)i;
		vt->alt_row_idx[i] = (__u16)i;
	}
	vt_fill_cells(vt->main_cells, AY_VTERM_MAX_CELLS, 0u);
	vt_fill_cells(vt->alt_cells, AY_VTERM_MAX_CELLS, 0u);
	vt_mark_all_dirty(vt);
	return 0;
}

__s32 ay_vterm_set_theme(struct ay_vterm_state *vt, __u32 theme_idx)
{
	if (!vt || theme_idx >= ay_term_theme_count())
		return -AY_EINVAL;
	vt->theme_idx = theme_idx;
	ay_term_palette_get(theme_idx, &vt->palette);
	vt_mark_all_dirty(vt);
	return 0;
}

static void vt_compact_rows(struct ay_vterm_cell *cells, __u16 *ridx, __u16 *rlen, __u8 *rwrap,
			    __u32 rows)
{
	__u16 next_len[AY_VTERM_MAX_ROWS];
	__u8 next_wrap[AY_VTERM_MAX_ROWS];
	__u8 visited[AY_VTERM_MAX_ROWS];
	__u32 r;

	/* Fast path if identity order already */
	for (r = 0u; r < rows; r++) {
		if (ridx[r] != r)
			break;
	}
	if (r == rows)
		return;

	__builtin_memset(visited, 0, AY_VTERM_MAX_ROWS);
	for (r = 0u; r < rows; r++) {
		next_len[r] = rlen[ridx[r]];
		next_wrap[r] = rwrap[ridx[r]];
	}
	/* Re-order cycles in-place using 16-byte element swap (zero large stack frames -> no __chkstk). */
	for (r = 0u; r < rows; r++) {
		__u32 cur = r;
		if (visited[cur] || ridx[cur] == cur) {
			visited[cur] = 1u;
			continue;
		}
		while (!visited[cur]) {
			__u32 src = ridx[cur];
			visited[cur] = 1u;
			if (src == r)
				break;
			{
				__u32 c;
				struct ay_vterm_cell *dst_row = &cells[cur * AY_VTERM_MAX_COLS];
				struct ay_vterm_cell *src_row = &cells[src * AY_VTERM_MAX_COLS];
				for (c = 0u; c < AY_VTERM_MAX_COLS; c++) {
					struct ay_vterm_cell t = dst_row[c];
					dst_row[c] = src_row[c];
					src_row[c] = t;
				}
			}
			/* Track where original slot r ended up */
			ridx[cur] = (__u16)src;
			cur = src;
		}
	}
	for (r = 0u; r < rows; r++) {
		ridx[r] = (__u16)r;
		rlen[r] = next_len[r];
		rwrap[r] = next_wrap[r];
	}
}

__s32 ay_vterm_resize(struct ay_vterm_state *vt, __u32 cols, __u32 rows)
{
	__u32 old_rows;
	__u32 r;

	if (!vt)
		return -AY_EINVAL;
	if (cols == 0u || cols > AY_VTERM_MAX_COLS || rows == 0u || rows > AY_VTERM_MAX_ROWS)
		return -AY_EINVAL;

	old_rows = vt->rows;
	if (!vt->alt_screen && rows < old_rows && vt->cursor_y >= rows) {
		__u32 push = (__u32)vt->cursor_y + 1u - rows;
		vt_scroll_up_region(vt, 0u, old_rows - 1u, push);
		vt->cursor_y = (__u16)(rows - 1u);
	}
	vt_compact_rows(vt->main_cells, vt->main_row_idx, vt->main_row_len, vt->main_row_wrapped,
			vt_max_u32(old_rows, rows));
	vt_compact_rows(vt->alt_cells, vt->alt_row_idx, vt->alt_row_len, vt->alt_row_wrapped,
			vt_max_u32(old_rows, rows));

	for (r = old_rows; r < rows; r++) {
		vt_fill_cells(&vt->main_cells[r * AY_VTERM_MAX_COLS], cols, 0u);
		vt->main_row_len[r] = 0u;
		vt->main_row_wrapped[r] = 0u;
		vt_fill_cells(&vt->alt_cells[r * AY_VTERM_MAX_COLS], cols, 0u);
		vt->alt_row_len[r] = 0u;
		vt->alt_row_wrapped[r] = 0u;
	}
	if (cols > vt->cols) {
		for (r = 0u; r < rows; r++) {
			if (vt->main_row_len[r] < cols)
				vt_fill_cells(&vt->main_cells[r * AY_VTERM_MAX_COLS + vt->cols],
					      cols - vt->cols, 0u);
			if (vt->alt_row_len[r] < cols)
				vt_fill_cells(&vt->alt_cells[r * AY_VTERM_MAX_COLS + vt->cols],
					      cols - vt->cols, 0u);
		}
	} else if (cols < vt->cols) {
		for (r = 0u; r < rows; r++) {
			if (vt->main_row_len[r] > cols) {
				vt_fill_cells(&vt->main_cells[r * AY_VTERM_MAX_COLS + cols],
					      vt->main_row_len[r] - cols, 0u);
				vt->main_row_len[r] = (__u16)cols;
			}
			if (vt->alt_row_len[r] > cols) {
				vt_fill_cells(&vt->alt_cells[r * AY_VTERM_MAX_COLS + cols],
					      vt->alt_row_len[r] - cols, 0u);
				vt->alt_row_len[r] = (__u16)cols;
			}
		}
	}

	vt->cols = (__u16)cols;
	vt->rows = (__u16)rows;
	vt->scroll_top = 0u;
	vt->scroll_bottom = (__u16)(rows - 1u);
	vt->cursor_x = (__u16)vt_min_u32(vt->cursor_x, cols - 1u);
	vt->cursor_y = (__u16)vt_min_u32(vt->cursor_y, rows - 1u);
	vt->pending_wrap = 0u;
	vt_mark_all_dirty(vt);
	return 0;
}

__s32 ay_vterm_feed(struct ay_vterm_state *vt, const __u8 *bytes, __usize len)
{
	__usize i = 0u;
	__u16 *ridx;
	__u16 *rlen;
	__u8 *rwrap;
	struct ay_vterm_cell *base;

	if (!vt || (!bytes && len > 0u))
		return -AY_EINVAL;

	vt->feed_bytes += (__u32)len;
	ridx = vt_row_idx(vt);
	rlen = vt_row_len_arr(vt);
	rwrap = vt_row_wrap_arr(vt);
	base = vt_grid_mut(vt);

	while (i < len) {
		if (vt->esc_state == VT_GROUND && vt->utf8_need == 0u && !vt->insert_mode) {
			/* Fast ASCII printable span */
			if (bytes[i] >= 0x20u && bytes[i] <= 0x7Eu) {
				if (vt->pending_wrap) {
					if (vt->auto_wrap) {
						rwrap[ridx[vt->cursor_y]] = 1u;
						vt->cursor_x = 0u;
						vt->pending_wrap = 0u;
						vt_linefeed(vt);
					} else {
						vt->cursor_x = vt->cols > 0u ? (__u16)(vt->cols - 1u) : 0u;
						vt->pending_wrap = 0u;
					}
				}
				{
					__u32 avail = (__u32)vt->cols - (__u32)vt->cursor_x;
					__u32 phys = ridx[vt->cursor_y];
					struct ay_vterm_cell *dst =
						&base[phys * AY_VTERM_MAX_COLS + vt->cursor_x];
					const __u32 fg = vt->cur_fg;
					const __u32 bg = vt->cur_bg;
					const __u32 fl = vt->cur_flags;
					__u32 k = 0u;
					while (k < avail && (i + k) < len) {
						__u8 ch = bytes[i + k];
						if (ch < 0x20u || ch > 0x7Eu)
							break;
						dst[k].cp = ch;
						dst[k].fg = fg;
						dst[k].bg = bg;
						dst[k].flags = fl;
						k++;
					}
					if (k > 0u) {
						__u32 new_x = (__u32)vt->cursor_x + k;
						vt->last_cp = bytes[i + k - 1u];
						if (new_x > rlen[phys])
							rlen[phys] = (__u16)new_x;
						vt_mark_dirty(vt, vt->cursor_y);
						i += k;
						if (new_x >= vt->cols) {
							vt->cursor_x = (__u16)(vt->cols - 1u);
							vt->pending_wrap = 1u;
						} else {
							vt->cursor_x = (__u16)new_x;
						}
						continue;
					}
				}
			}
			/* Fast CRLF / LF / CR / ESC-[ CSI entry */
			{
				__u8 b = bytes[i];
				if (b == '\r') {
					vt->cursor_x = 0u;
					vt->pending_wrap = 0u;
					i++;
					if (i < len && bytes[i] == '\n') {
						vt_linefeed(vt);
						i++;
					}
					continue;
				}
				if (b == '\n') {
					vt->pending_wrap = 0u;
					if (vt->newline_mode)
						vt->cursor_x = 0u;
					vt_linefeed(vt);
					i++;
					continue;
				}
				if (b == 0x1Bu && i + 1u < len && bytes[i + 1u] == '[') {
					vt->esc_state = VT_CSI;
					vt->csi_private = 0u;
					vt->csi_inter = 0u;
					vt->csi_nparams = 0u;
					vt->csi_colon_mask = 0u;
					__builtin_memset(vt->csi_params, 0, sizeof(vt->csi_params));
					__builtin_memset(vt->csi_has_param, 0, sizeof(vt->csi_has_param));
					i += 2u;
					/* Parse CSI inline as long as bytes stay inside buffer */
					while (i < len && vt->esc_state == VT_CSI) {
						__u8 cb = bytes[i++];
						if (cb >= '0' && cb <= '9') {
							__u32 idx = vt->csi_nparams == 0u ? 0u : vt->csi_nparams - 1u;
							if (vt->csi_nparams == 0u)
								vt->csi_nparams = 1u;
							if (idx < AY_VTERM_CSI_PARAMS) {
								vt->csi_params[idx] = vt->csi_params[idx] * 10u + (__u32)(cb - '0');
								vt->csi_has_param[idx] = 1u;
							}
						} else if (cb == ';' || cb == ':') {
							if (vt->csi_nparams == 0u)
								vt->csi_nparams = 1u;
							if (vt->csi_nparams < AY_VTERM_CSI_PARAMS) {
								if (cb == ':')
									vt->csi_colon_mask |= 1u << vt->csi_nparams;
								vt->csi_nparams++;
							}
						} else if (cb >= 0x40u && cb <= 0x7Eu) {
							vt_handle_csi(vt, cb);
							vt->esc_state = VT_GROUND;
							/* Refresh cached screen pointers in case ?1049h/l switched grids! */
							ridx = vt_row_idx(vt);
							rlen = vt_row_len_arr(vt);
							rwrap = vt_row_wrap_arr(vt);
							base = vt_grid_mut(vt);
							break;
						} else if (cb == '?' || cb == '>' || cb == '=' || cb == '<') {
							if (vt->csi_nparams == 0u && !vt->csi_has_param[0])
								vt->csi_private = cb;
						} else if (cb >= 0x20u && cb <= 0x2Fu) {
							vt->csi_inter = cb;
						} else {
							/* Unwind back one byte so standard handler deals with ESC/control */
							i--;
							vt_process_byte(vt, bytes[i++]);
							break;
						}
					}
					continue;
				}
			}
		}

		vt_process_byte(vt, bytes[i++]);
		/* Screen could have switched via CSI ?1049h/l or ESC c */
		ridx = vt_row_idx(vt);
		rlen = vt_row_len_arr(vt);
		rwrap = vt_row_wrap_arr(vt);
		base = vt_grid_mut(vt);
	}
	return 0;
}

__s32 ay_vterm_reset_dirty(struct ay_vterm_state *vt)
{
	if (!vt)
		return -AY_EINVAL;
	vt->dirty_rows[0] = 0u;
	vt->dirty_rows[1] = 0u;
	vt->dirty_rows[2] = 0u;
	vt->title_dirty = 0u;
	vt->cwd_dirty = 0u;
	return 0;
}

__s32 ay_vterm_get_meta(const struct ay_vterm_state *vt, struct ay_vterm_meta *out)
{
	__u32 k;

	if (!vt || !out)
		return -AY_EINVAL;
	__builtin_memset(out, 0, sizeof(*out));
	out->abi_version = AY_VTERM_ABI_VERSION;
	out->cols = vt->cols;
	out->rows = vt->rows;
	out->cursor_x = vt->cursor_x;
	out->cursor_y = vt->cursor_y;
	out->cursor_visible = vt->cursor_visible;
	out->cursor_style = vt->cursor_style;
	out->alt_screen = vt->alt_screen;
	out->bracketed_paste = vt->bracketed_paste;
	out->app_cursor = vt->app_cursor;
	out->mouse_mode = vt->mouse_mode;
	out->mouse_format = vt->mouse_format;
	out->title_dirty = vt->title_dirty;
	out->theme_idx = vt->theme_idx;
	out->scroll_count = vt->scroll_count;
	out->feed_bytes = vt->feed_bytes;
	out->block_count = vt->block_count;
	out->failed_count = vt->failed_count;
	out->last_exit_code = vt->last_exit_code;
	out->dirty_rows[0] = vt->dirty_rows[0];
	out->dirty_rows[1] = vt->dirty_rows[1];
	out->dirty_rows[2] = vt->dirty_rows[2];
	out->title_len = vt->title_len;
	for (k = 0u; k < vt->title_len && k + 1u < AY_VTERM_TITLE_CAP; k++)
		out->title[k] = vt->title[k];
	out->scrollback_len = vt->sb_len;
	out->view_offset = vt->alt_screen ? 0u : vt->view_offset;
	out->reply_pending = vt->reply_len;
	out->kitty_flags = vt_current_kitty_flags(vt);
	out->sync_output = vt->sync_output;
	out->focus_events = vt->focus_events;
	out->cwd_dirty = vt->cwd_dirty;
	out->clip_dirty = vt->clip_dirty;
	out->cwd_len = vt->cwd_len;
	for (k = 0u; k < vt->cwd_len && k + 1u < AY_VTERM_CWD_CAP; k++)
		out->cwd[k] = vt->cwd[k];
	return 0;
}

static __u16 vt_abs_to_screen_row(const struct ay_vterm_state *vt, __u32 abs_row)
{
	if (abs_row <= vt->main_scroll_seq)
		return 0u;
	return (__u16)vt_min_u32(abs_row - vt->main_scroll_seq, vt->rows > 0u ? vt->rows - 1u : 0u);
}

__s32 ay_vterm_get_block(const struct ay_vterm_state *vt, __u32 idx, struct ay_vterm_block *out)
{
	__u32 slot;

	if (!vt || !out || idx >= vt->block_count)
		return -AY_EINVAL;
	slot = (vt->block_head + idx) % AY_VTERM_MAX_BLOCKS;
	*out = vt->blocks[slot];
	out->start_row = vt_abs_to_screen_row(vt, vt->block_start_abs[slot]);
	out->cmd_row = vt_abs_to_screen_row(vt, vt->block_cmd_abs[slot]);
	out->out_row = vt_abs_to_screen_row(vt, vt->block_out_abs[slot]);
	out->end_row = vt_abs_to_screen_row(vt, vt->block_end_abs[slot]);
	return 0;
}

static const struct ay_vterm_cell *vt_visible_row(const struct ay_vterm_state *vt, __u32 vis_row,
						  __u32 *out_row_len)
{
	__u32 offset = vt->alt_screen ? 0u : vt_min_u32(vt->view_offset, vt->sb_len);

	if (vis_row >= vt->rows) {
		*out_row_len = 0u;
		return 0;
	}
	if (offset == 0u || vt->alt_screen) {
		__u32 phys = (vt->alt_screen ? vt->alt_row_idx : vt->main_row_idx)[vis_row];
		*out_row_len = (vt->alt_screen ? vt->alt_row_len : vt->main_row_len)[phys];
		return &vt_grid_const(vt)[phys * AY_VTERM_MAX_COLS];
	}
	{
		__u32 top_combined = vt->sb_len - offset;
		__u32 idx = top_combined + vis_row;
		if (idx < vt->sb_len) {
			__u32 oldest = (vt->sb_head + AY_VTERM_SCROLLBACK_ROWS - vt->sb_len) &
				       (AY_VTERM_SCROLLBACK_ROWS - 1u);
			__u32 slot = (oldest + idx) & (AY_VTERM_SCROLLBACK_ROWS - 1u);
			*out_row_len = vt->sb_row_len[slot];
			return &vt->sb_cells[slot * AY_VTERM_MAX_COLS];
		}
		{
			__u32 sr = idx - vt->sb_len;
			__u32 phys = vt->main_row_idx[sr];
			*out_row_len = vt->main_row_len[phys];
			return &vt->main_cells[phys * AY_VTERM_MAX_COLS];
		}
	}
}

__s32 ay_vterm_pack_gpu_cells(const struct ay_vterm_state *vt, struct ay_vterm_gpu_cell *out_cells,
			      __u32 max_cells)
{
	__u32 rows;
	__u32 cols;
	__u32 def_fg_abgr;
	__u32 def_bg_abgr;
	__u32 n = 0u;
	__u32 r;

	if (!vt || !out_cells)
		return -AY_EINVAL;
	rows = vt->rows;
	cols = vt->cols;
	if (rows * cols > max_cells)
		return -AY_EINVAL;

	def_fg_abgr = ay_ui_argb_to_abgr(vt->palette.fg);
	def_bg_abgr = ay_ui_argb_to_abgr(vt->palette.bg);

	for (r = 0u; r < rows; r++) {
		__u32 rlen = 0u;
		const struct ay_vterm_cell *row_cells = vt_visible_row(vt, r, &rlen);
		__u32 valid_w = vt_min_u32(rlen, cols);
		__u32 c;

		if (!row_cells)
			valid_w = 0u;

		for (c = 0u; c < valid_w; c++) {
			const struct ay_vterm_cell *src = &row_cells[c];
			__u32 fl = src->flags;
			__u32 cp = src->cp;
			__u32 fg_abgr = src->fg != 0u ? ay_ui_argb_to_abgr(src->fg) : def_fg_abgr;
			__u32 bg_abgr = src->bg != 0u ? ay_ui_argb_to_abgr(src->bg) : def_bg_abgr;

			if (fl & AY_VTERM_FLAG_REVERSE) {
				__u32 tmp = fg_abgr;
				fg_abgr = bg_abgr;
				bg_abgr = tmp;
			}
			if (fl & AY_VTERM_FLAG_DIM) {
				fg_abgr = (fg_abgr & 0xFF000000u) | ((fg_abgr >> 1u) & 0x007F7F7Fu);
			}
			if (fl & AY_VTERM_FLAG_HIDDEN)
				fg_abgr = bg_abgr;

			out_cells[n].cp = cp;
			out_cells[n].fg_abgr = fg_abgr;
			out_cells[n].bg_abgr = bg_abgr;
			out_cells[n].flags = fl;
			out_cells[n].col = (__u16)c;
			out_cells[n].row = (__u16)r;
			n++;
		}
		for (c = valid_w; c < cols; c++) {
			out_cells[n].cp = ' ';
			out_cells[n].fg_abgr = def_fg_abgr;
			out_cells[n].bg_abgr = def_bg_abgr;
			out_cells[n].flags = 0u;
			out_cells[n].col = (__u16)c;
			out_cells[n].row = (__u16)r;
			n++;
		}
	}
	return (__s32)n;
}

static __s32 vt_encode_row_utf8(const struct ay_vterm_cell *row_cells, __u32 end_c, char *dst,
				__usize cap)
{
	__usize out = 0u;
	__u32 c;

	while (end_c > 0u && (row_cells[end_c - 1u].cp == ' ' || row_cells[end_c - 1u].cp == 0u))
		end_c--;
	for (c = 0u; c < end_c; c++) {
		__u32 cp = row_cells[c].cp;
		if (cp == 0u)
			continue;
		if (cp < 0x80u) {
			if (out + 1u > cap)
				break;
			dst[out++] = (char)cp;
		} else if (cp < 0x800u) {
			if (out + 2u > cap)
				break;
			dst[out++] = (char)(0xC0u | (cp >> 6u));
			dst[out++] = (char)(0x80u | (cp & 0x3Fu));
		} else if (cp < 0x10000u) {
			if (out + 3u > cap)
				break;
			dst[out++] = (char)(0xE0u | (cp >> 12u));
			dst[out++] = (char)(0x80u | ((cp >> 6u) & 0x3Fu));
			dst[out++] = (char)(0x80u | (cp & 0x3Fu));
		} else {
			if (out + 4u > cap)
				break;
			dst[out++] = (char)(0xF0u | (cp >> 18u));
			dst[out++] = (char)(0x80u | ((cp >> 12u) & 0x3Fu));
			dst[out++] = (char)(0x80u | ((cp >> 6u) & 0x3Fu));
			dst[out++] = (char)(0x80u | (cp & 0x3Fu));
		}
	}
	return (__s32)out;
}

__s32 ay_vterm_copy_row_text(const struct ay_vterm_state *vt, __u32 row, char *dst, __usize cap)
{
	__u32 rlen = 0u;
	const struct ay_vterm_cell *line;

	if (!vt || !dst || row >= vt->rows || cap == 0u)
		return -AY_EINVAL;
	line = vt_visible_row(vt, row, &rlen);
	if (!line)
		return 0;
	return vt_encode_row_utf8(line, vt_min_u32(rlen, vt->cols), dst, cap);
}

__s32 ay_vterm_copy_text(const struct ay_vterm_state *vt, char *dst, __usize cap)
{
	__u32 last_nonempty = 0u;
	__u32 any_nonempty = 0u;
	__usize out = 0u;
	__u32 r;

	if (!vt || !dst || cap == 0u)
		return -AY_EINVAL;

	for (r = 0u; r < vt->rows; r++) {
		__u32 rlen = 0u;
		const struct ay_vterm_cell *line = vt_visible_row(vt, r, &rlen);
		__u32 end_c = line ? vt_min_u32(rlen, vt->cols) : 0u;
		while (end_c > 0u && (line[end_c - 1u].cp == ' ' || line[end_c - 1u].cp == 0u))
			end_c--;
		if (end_c > 0u) {
			last_nonempty = r;
			any_nonempty = 1u;
		}
	}
	if (!any_nonempty)
		return 0;

	for (r = 0u; r <= last_nonempty; r++) {
		__s32 n;
		if (r > 0u) {
			if (out + 1u > cap)
				break;
			dst[out++] = '\n';
		}
		n = ay_vterm_copy_row_text(vt, r, dst + out, cap - out);
		if (n < 0)
			return n;
		out += (__usize)n;
	}
	return (__s32)out;
}

__s32 ay_vterm_drain_replies(struct ay_vterm_state *vt, __u8 *dst, __usize cap)
{
	__u32 n;
	__u32 i;

	if (!vt || (!dst && cap > 0u))
		return -AY_EINVAL;
	n = vt_min_u32(vt->reply_len, (__u32)cap);
	for (i = 0u; i < n; i++)
		dst[i] = vt->reply_buf[i];
	if (n < vt->reply_len) {
		__u32 rem = vt->reply_len - n;
		for (i = 0u; i < rem; i++)
			vt->reply_buf[i] = vt->reply_buf[n + i];
		vt->reply_len = rem;
	} else {
		vt->reply_len = 0u;
	}
	return (__s32)n;
}

__s32 ay_vterm_set_scroll(struct ay_vterm_state *vt, __u32 offset)
{
	if (!vt)
		return -AY_EINVAL;
	if (vt->alt_screen) {
		vt->view_offset = 0u;
		return 0;
	}
	vt->view_offset = vt_min_u32(offset, vt->sb_len);
	vt_mark_all_dirty(vt);
	return (__s32)vt->view_offset;
}

__s32 ay_vterm_scroll_lines(struct ay_vterm_state *vt, __s32 delta)
{
	__s32 next;

	if (!vt)
		return -AY_EINVAL;
	if (vt->alt_screen) {
		vt->view_offset = 0u;
		return 0;
	}
	next = vt_clamp_s32((__s32)vt->view_offset + delta, 0, (__s32)vt->sb_len);
	vt->view_offset = (__u32)next;
	vt_mark_all_dirty(vt);
	return next;
}

__s32 ay_vterm_get_link(const struct ay_vterm_state *vt, __u32 slot, char *dst, __usize cap)
{
	__u32 n;
	__u32 i;

	if (!vt || !dst || slot == 0u || slot >= AY_VTERM_MAX_LINKS)
		return -AY_EINVAL;
	n = vt_min_u32(vt->link_lens[slot], (__u32)cap);
	for (i = 0u; i < n; i++)
		dst[i] = vt->links[slot][i];
	return (__s32)n;
}

__s32 ay_vterm_drain_clipboard(struct ay_vterm_state *vt, char *dst, __usize cap)
{
	__u32 n;
	__u32 i;

	if (!vt || (!dst && cap > 0u))
		return -AY_EINVAL;
	if (!vt->clip_dirty)
		return 0;
	n = vt_min_u32(vt->clip_len, (__u32)cap);
	for (i = 0u; i < n; i++)
		dst[i] = vt->clip_buf[i];
	vt->clip_dirty = 0u;
	vt->clip_len = 0u;
	return (__s32)n;
}

__s32 ay_vterm_copy_scrollback_text(const struct ay_vterm_state *vt, __u32 start_oldest,
				    __u32 row_count, char *dst, __usize cap)
{
	__u32 total;
	__u32 end;
	__usize out = 0u;
	__u32 r;
	__u32 oldest;

	if (!vt || !dst || cap == 0u)
		return -AY_EINVAL;
	total = vt->sb_len + vt->rows;
	if (start_oldest >= total)
		return 0;
	end = vt_min_u32(total, start_oldest + row_count);
	oldest = (vt->sb_head + AY_VTERM_SCROLLBACK_ROWS - vt->sb_len) &
		 (AY_VTERM_SCROLLBACK_ROWS - 1u);

	for (r = start_oldest; r < end; r++) {
		const struct ay_vterm_cell *line;
		__u32 rlen;
		__s32 n;
		if (r > start_oldest) {
			if (out + 1u > cap)
				break;
			dst[out++] = '\n';
		}
		if (r < vt->sb_len) {
			__u32 slot = (oldest + r) & (AY_VTERM_SCROLLBACK_ROWS - 1u);
			line = &vt->sb_cells[slot * AY_VTERM_MAX_COLS];
			rlen = vt->sb_row_len[slot];
		} else {
			__u32 sr = r - vt->sb_len;
			__u32 phys = vt->main_row_idx[sr];
			line = &vt->main_cells[phys * AY_VTERM_MAX_COLS];
			rlen = vt->main_row_len[phys];
		}
		n = vt_encode_row_utf8(line, vt_min_u32(rlen, vt->cols), dst + out, cap - out);
		if (n < 0)
			return n;
		out += (__usize)n;
	}
	return (__s32)out;
}
