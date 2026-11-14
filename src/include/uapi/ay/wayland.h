/* SPDX-License-Identifier: MIT OR Apache-2.0 */
/*
 * sys/include/uapi/ay/wayland.h - Freedesktop Wayland 1.26 Wire & X11 XCB 1.17 / XWayland 26.0.99 XWM
 *
 * Canonical subsystem prefixes: `wl_*`, `xcb_*`, `xwm_*`.
 */
#ifndef _UAPI_AY_WAYLAND_H
#define _UAPI_AY_WAYLAND_H

#include "types.h"

#define WL_ALIGN4(n)    (((__u32)(n) + 3u) & ~3u)
#define WL_HEADER_BYTES 8u
#define WL_MAX_FDS      8u

typedef __s32 wl_fixed_t;

struct wl_wire_hdr {
	__u32 object_id;
	__u32 size_opcode;
};

/* Core Wayland 1.26 object IDs & opcodes */
#define WL_DISPLAY_OBJECT_ID    1u
#define WL_DISPLAY_SYNC         0u
#define WL_DISPLAY_GET_REGISTRY 1u
#define WL_REGISTRY_BIND        0u
#define WL_SURFACE_DESTROY      0u
#define WL_SURFACE_ATTACH       1u
#define WL_SURFACE_DAMAGE       2u
#define WL_SURFACE_FRAME        3u
#define WL_SURFACE_COMMIT       6u

/* X11 Core / XCB 1.17 + Rootless XWayland 26.0.99 XWM */
#define XCB_SETUP_LSB             0x6Cu
#define XCB_PROTOCOL_MAJOR        11u
#define XCB_PROTOCOL_MINOR        0u
#define XCB_EVENT_CLIENT_MESSAGE  33u
#define XCB_SUBSTRUCTURE_REDIRECT (1u << 20)
#define XWM_MAX_WINDOWS           128u

struct xcb_setup_req {
	__u8  byte_order;
	__u8  pad0;
	__u16 protocol_major;
	__u16 protocol_minor;
	__u16 auth_proto_name_len;
	__u16 auth_proto_data_len;
	__u16 pad1;
};

struct xcb_client_message_event {
	__u8  response_type;
	__u8  format;
	__u16 sequence;
	__u32 window;
	__u32 type; /* atom("WL_SURFACE_ID") */
	__u32 data32[5];
};

struct xwm_window_slot {
	__u32 active;
	__u32 x11_window;
	__u32 wl_surface_id;
	__s16 x;
	__s16 y;
	__u16 width;
	__u16 height;
};

struct xwm_context {
	__u32                  wl_surface_id_atom;
	__u32                  paired_count;
	struct xwm_window_slot slots[XWM_MAX_WINDOWS];
};

/* Compositor dynamic tiling modes */
#define WL_TILE_DWINDLE      0u
#define WL_TILE_MASTER_STACK 1u
#define WL_TILE_MONOCLE      2u

struct wl_box {
	__u32 id;
	__u32 x;
	__u32 y;
	__u32 w;
	__u32 h;
};

#endif /* _UAPI_AY_WAYLAND_H */
