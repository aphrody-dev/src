/* SPDX-License-Identifier: MIT OR Apache-2.0 */
/*
 * src/include/uapi/ay/vterm.h - Pure C11 / WASM32 Zero-Alloc Virtual Terminal ABI (v2)
 *
 * Designed for dual execution:
 *   1. Native Windows/Linux FFI (`aysys.dll` / `libaysys.so`) for daemon PTY shadow grids & MCP/ACP reading.
 *   2. Freestanding WASM32 SIMD128 (`aysys.wasm`) for 120Hz WebGPU instanced quad rendering in browser.
 *
 * Fixed-width LP64 / LLP64 / WASM32 invariant ABI (zero pointers inside structs).
 */
#ifndef _UAPI_AY_VTERM_H
#define _UAPI_AY_VTERM_H

#include "shell.h"
#include "types.h"

#define AY_VTERM_ABI_VERSION     2u

#define AY_VTERM_MAX_COLS        240u
#define AY_VTERM_MAX_ROWS        80u
#define AY_VTERM_MAX_CELLS       (AY_VTERM_MAX_COLS * AY_VTERM_MAX_ROWS)
#define AY_VTERM_SCROLLBACK_ROWS 1024u
#define AY_VTERM_SCROLLBACK_CELLS (AY_VTERM_SCROLLBACK_ROWS * AY_VTERM_MAX_COLS)
#define AY_VTERM_MAX_BLOCKS      32u
#define AY_VTERM_OSC_CAP         512u
#define AY_VTERM_TITLE_CAP       128u
#define AY_VTERM_CMD_CAP         128u
#define AY_VTERM_CSI_PARAMS      16u
#define AY_VTERM_REPLY_CAP       512u
#define AY_VTERM_CWD_CAP         256u
#define AY_VTERM_CLIP_CAP        1024u
#define AY_VTERM_MAX_LINKS       16u
#define AY_VTERM_LINK_CAP        256u
#define AY_VTERM_KITTY_STACK     8u

enum ay_vterm_cell_flags {
	AY_VTERM_FLAG_BOLD           = 1u << 0,
	AY_VTERM_FLAG_DIM            = 1u << 1,
	AY_VTERM_FLAG_ITALIC         = 1u << 2,
	AY_VTERM_FLAG_UNDERLINE      = 1u << 3,
	AY_VTERM_FLAG_BLINK          = 1u << 4,
	AY_VTERM_FLAG_REVERSE        = 1u << 5,
	AY_VTERM_FLAG_HIDDEN         = 1u << 6,
	AY_VTERM_FLAG_STRIKE         = 1u << 7,
	AY_VTERM_FLAG_WIDE           = 1u << 8,
	AY_VTERM_FLAG_CONT           = 1u << 9,
	AY_VTERM_FLAG_LINK           = 1u << 10,
	AY_VTERM_FLAG_PROMPT         = 1u << 11,
	AY_VTERM_FLAG_ERROR          = 1u << 12,
	AY_VTERM_FLAG_UL_STYLE_SHIFT = 13u,
	AY_VTERM_FLAG_UL_STYLE_MASK  = 0x7u << 13,
	AY_VTERM_FLAG_OVERLINE       = 1u << 16,
	AY_VTERM_FLAG_LINK_SLOT_SHIFT = 18u,
	AY_VTERM_FLAG_LINK_SLOT_MASK  = 0xFu << 18,
};

enum ay_vterm_ul_style {
	AY_VTERM_UL_NONE   = 0u,
	AY_VTERM_UL_SINGLE = 1u,
	AY_VTERM_UL_DOUBLE = 2u,
	AY_VTERM_UL_CURLY  = 3u,
	AY_VTERM_UL_DOTTED = 4u,
	AY_VTERM_UL_DASHED = 5u,
};

enum ay_vterm_cursor_style {
	AY_VTERM_CURSOR_BLOCK_BLINK = 1u,
	AY_VTERM_CURSOR_BLOCK       = 2u,
	AY_VTERM_CURSOR_UNDER_BLINK = 3u,
	AY_VTERM_CURSOR_UNDER       = 4u,
	AY_VTERM_CURSOR_BAR_BLINK   = 5u,
	AY_VTERM_CURSOR_BAR         = 6u,
};

enum ay_vterm_mouse_proto {
	AY_VTERM_MOUSE_NONE   = 0u,
	AY_VTERM_MOUSE_X10    = 1u, /* CSI ? 9 h */
	AY_VTERM_MOUSE_NORMAL = 2u, /* CSI ? 1000 h */
	AY_VTERM_MOUSE_BUTTON = 3u, /* CSI ? 1002 h */
	AY_VTERM_MOUSE_ANY    = 4u, /* CSI ? 1003 h */
};

enum ay_vterm_mouse_format {
	AY_VTERM_MOUSE_FMT_X10       = 0u,
	AY_VTERM_MOUSE_FMT_UTF8      = 1u, /* CSI ? 1005 h */
	AY_VTERM_MOUSE_FMT_SGR       = 2u, /* CSI ? 1006 h */
	AY_VTERM_MOUSE_FMT_SGR_PIXEL = 3u, /* CSI ? 1016 h */
};

enum ay_vterm_block_state {
	AY_VTERM_BLOCK_EMPTY   = 0u,
	AY_VTERM_BLOCK_PROMPT  = 1u,
	AY_VTERM_BLOCK_INPUT   = 2u,
	AY_VTERM_BLOCK_RUNNING = 3u,
	AY_VTERM_BLOCK_DONE    = 4u,
};

struct ay_vterm_cell {
	__u32 cp;
	__u32 fg;
	__u32 bg;
	__u32 flags;
};

/* Packed 20-byte cell layout matching WGSL storage buffer stride (5 x u32). */
struct ay_vterm_gpu_cell {
	__u32 cp;
	__u32 fg_abgr;
	__u32 bg_abgr;
	__u32 flags;
	__u16 col;
	__u16 row;
};

/* Fixed 152-byte OSC 133 semantic command block record. */
struct ay_vterm_block {
	__u32 id;
	__u16 start_row;
	__u16 cmd_row;
	__u16 out_row;
	__u16 end_row;
	__s32 exit_code;
	__u32 state;
	__u32 cmd_len;
	char  command[AY_VTERM_CMD_CAP];
};

/* Fixed-layout 468-byte metadata snapshot (ABI v2; offsets 0..187 match v1). */
struct ay_vterm_meta {
	__u32 abi_version;     /* 0 */
	__u16 cols;            /* 4 */
	__u16 rows;            /* 6 */
	__u16 cursor_x;        /* 8 */
	__u16 cursor_y;        /* 10 */
	__u8  cursor_visible;  /* 12 */
	__u8  cursor_style;    /* 13 */
	__u8  alt_screen;      /* 14 */
	__u8  bracketed_paste; /* 15 */
	__u8  app_cursor;      /* 16 */
	__u8  mouse_mode;      /* 17 (ay_vterm_mouse_proto) */
	__u8  title_dirty;     /* 18 */
	__u8  mouse_format;    /* 19 (ay_vterm_mouse_format) */
	__u32 theme_idx;       /* 20 */
	__u32 scroll_count;    /* 24 */
	__u32 feed_bytes;      /* 28 */
	__u32 block_count;     /* 32 */
	__u32 failed_count;    /* 36 */
	__s32 last_exit_code;  /* 40 */
	__u32 dirty_rows[3];   /* 44..55 */
	__u32 title_len;       /* 56 */
	char  title[AY_VTERM_TITLE_CAP]; /* 60..187 */
	/* v2 additions */
	__u32 scrollback_len;  /* 188 */
	__u32 view_offset;     /* 192 */
	__u32 reply_pending;   /* 196 */
	__u32 kitty_flags;     /* 200 */
	__u8  sync_output;     /* 204 */
	__u8  focus_events;    /* 205 */
	__u8  cwd_dirty;       /* 206 */
	__u8  clip_dirty;      /* 207 */
	__u32 cwd_len;         /* 208 */
	char  cwd[AY_VTERM_CWD_CAP]; /* 212..467 */
};

struct ay_vterm_state {
	struct ay_vterm_cell   main_cells[AY_VTERM_MAX_CELLS];
	struct ay_vterm_cell   alt_cells[AY_VTERM_MAX_CELLS];
	struct ay_vterm_block  blocks[AY_VTERM_MAX_BLOCKS];
	struct ay_term_palette palette;
	__u16 main_row_idx[AY_VTERM_MAX_ROWS];
	__u16 alt_row_idx[AY_VTERM_MAX_ROWS];
	__u16 main_row_len[AY_VTERM_MAX_ROWS];
	__u16 alt_row_len[AY_VTERM_MAX_ROWS];
	__u8  main_row_wrapped[AY_VTERM_MAX_ROWS];
	__u8  alt_row_wrapped[AY_VTERM_MAX_ROWS];
	__u16 sb_row_len[AY_VTERM_SCROLLBACK_ROWS];
	__u8  sb_row_wrapped[AY_VTERM_SCROLLBACK_ROWS];
	__u32 block_start_abs[AY_VTERM_MAX_BLOCKS];
	__u32 block_cmd_abs[AY_VTERM_MAX_BLOCKS];
	__u32 block_out_abs[AY_VTERM_MAX_BLOCKS];
	__u32 block_end_abs[AY_VTERM_MAX_BLOCKS];
	__u32 block_cmd_col[AY_VTERM_MAX_BLOCKS];
	__u32 theme_idx;
	__u16 cols;
	__u16 rows;
	__u16 cursor_x;
	__u16 cursor_y;
	__u16 saved_x;
	__u16 saved_y;
	__u16 alt_saved_x;
	__u16 alt_saved_y;
	__u16 scroll_top;
	__u16 scroll_bottom;
	__u32 cur_fg;
	__u32 cur_bg;
	__u32 cur_flags;
	__u32 saved_fg;
	__u32 saved_bg;
	__u32 saved_flags;
	__u32 last_cp;
	__u8  pending_wrap;
	__u8  cursor_visible;
	__u8  cursor_style;
	__u8  alt_screen;
	__u8  bracketed_paste;
	__u8  app_cursor;
	__u8  mouse_mode;
	__u8  mouse_format;
	__u8  sync_output;
	__u8  focus_events;
	__u8  origin_mode;
	__u8  auto_wrap;
	__u8  insert_mode;
	__u8  newline_mode;
	__u8  in_link;
	__u8  cur_link_slot;
	__u8  next_link_slot;
	__u8  title_dirty;
	__u8  cwd_dirty;
	__u8  clip_dirty;
	__u8  esc_state;
	__u8  csi_private;
	__u8  csi_inter;
	__u8  utf8_need;
	__u32 utf8_cp;
	__u32 utf8_min;
	__u32 csi_params[AY_VTERM_CSI_PARAMS];
	__u8  csi_has_param[AY_VTERM_CSI_PARAMS];
	__u32 csi_colon_mask;
	__u32 csi_nparams;
	__u32 osc_len;
	__u32 osc_esc_pending;
	char  osc_buf[AY_VTERM_OSC_CAP];
	__u32 title_len;
	char  title[AY_VTERM_TITLE_CAP];
	__u32 cwd_len;
	char  cwd[AY_VTERM_CWD_CAP];
	__u32 clip_len;
	char  clip_buf[AY_VTERM_CLIP_CAP];
	__u32 reply_len;
	__u8  reply_buf[AY_VTERM_REPLY_CAP];
	__u16 link_lens[AY_VTERM_MAX_LINKS];
	char  links[AY_VTERM_MAX_LINKS][AY_VTERM_LINK_CAP];
	__u32 kitty_stack[AY_VTERM_KITTY_STACK];
	__u32 alt_kitty_stack[AY_VTERM_KITTY_STACK];
	__u8  kitty_sp;
	__u8  alt_kitty_sp;
	__u32 scroll_count;
	__u32 main_scroll_seq;
	__u32 feed_bytes;
	__u32 sb_head;
	__u32 sb_len;
	__u32 view_offset;
	__u32 next_block_id;
	__u32 block_head;
	__u32 block_count;
	__u32 failed_count;
	__s32 last_exit_code;
	__s32 active_block_idx;
	__u32 dirty_rows[3];
	/* Kept last so ay_vterm_init only zeroes fixed state header before sb_cells. */
	struct ay_vterm_cell sb_cells[AY_VTERM_SCROLLBACK_CELLS];
};

#endif /* _UAPI_AY_VTERM_H */
