/* SPDX-License-Identifier: MIT OR Apache-2.0 */
/*
 * src/include/uapi/ay/shell.h - Pure C ABI definitions for Terminal Palettes & 2026 Shell/CLI/TUI Index
 *
 * Fixed-width LP64 / LLP64 / WASM32 invariant structures (zero pointers inside structs).
 */
#ifndef _UAPI_AY_SHELL_H
#define _UAPI_AY_SHELL_H

#include "types.h"

#define AY_SHELL_ABI_VERSION 1u

enum ay_shell_category {
	AY_SHELL_CAT_SHELL    = 0,
	AY_SHELL_CAT_PROMPT   = 1,
	AY_SHELL_CAT_TERMINAL = 2,
	AY_SHELL_CAT_CLI      = 3,
	AY_SHELL_CAT_TUI      = 4,
	AY_SHELL_CAT_FONT     = 5,
	AY_SHELL_CAT_THEME    = 6,
	AY_SHELL_CAT_ICON     = 7,
	AY_SHELL_CAT_COUNT    = 8,
};

enum ay_shell_source {
	AY_SHELL_SRC_BUILTIN    = 0,
	AY_SHELL_SRC_TOOLS_TOML = 1,
	AY_SHELL_SRC_CARGO      = 2,
	AY_SHELL_SRC_NERD_FONTS = 3,
	AY_SHELL_SRC_PKG_MGR    = 4,
	AY_SHELL_SRC_THEME_PACK = 5,
};

#define AY_SHELL_PLAT_WIN   (1u << 0)
#define AY_SHELL_PLAT_LINUX (1u << 1)
#define AY_SHELL_PLAT_MACOS (1u << 2)
#define AY_SHELL_PLAT_ALL   (AY_SHELL_PLAT_WIN | AY_SHELL_PLAT_LINUX | AY_SHELL_PLAT_MACOS)

enum ay_shell_field {
	AY_SHELL_FIELD_SLUG    = 0,
	AY_SHELL_FIELD_NAME    = 1,
	AY_SHELL_FIELD_VERSION = 2,
	AY_SHELL_FIELD_REPO    = 3,
	AY_SHELL_FIELD_DOCS    = 4,
	AY_SHELL_FIELD_CONFIG  = 5,
	AY_SHELL_FIELD_BINARY  = 6,
	AY_SHELL_FIELD_COUNT   = 7,
};

enum ay_term_sgr_flags {
	AY_SGR_BOLD      = 1u << 0,
	AY_SGR_DIM       = 1u << 1,
	AY_SGR_ITALIC    = 1u << 2,
	AY_SGR_UNDERLINE = 1u << 3,
	AY_SGR_HAS_FG    = 1u << 4,
	AY_SGR_HAS_BG    = 1u << 5,
};

enum ay_term_palette_slot {
	AY_TERM_SLOT_ANSI0        = 0,
	AY_TERM_SLOT_ANSI15       = 15,
	AY_TERM_SLOT_BG           = 16,
	AY_TERM_SLOT_FG           = 17,
	AY_TERM_SLOT_CURSOR_BG    = 18,
	AY_TERM_SLOT_CURSOR_FG    = 19,
	AY_TERM_SLOT_SELECTION_BG = 20,
	AY_TERM_SLOT_SELECTION_FG = 21,
	AY_TERM_SLOT_ACCENT       = 22,
	AY_TERM_SLOT_IS_DARK      = 23,
	AY_TERM_SLOT_COUNT        = 24,
};

struct ay_term_palette {
	__u32 bg;
	__u32 fg;
	__u32 cursor_bg;
	__u32 cursor_fg;
	__u32 selection_bg;
	__u32 selection_fg;
	__u32 accent;
	__u32 is_dark;
	__u32 ansi[16];
};

struct ay_shell_entry_meta {
	__u32 id;
	__u32 category;
	__u32 source;
	__u32 platforms;
	__u64 slug_fnv1a;
};

#endif /* _UAPI_AY_SHELL_H */
