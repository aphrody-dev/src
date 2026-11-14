/* SPDX-License-Identifier: MIT OR Apache-2.0 */
/*
 * src/include/ay/sys.h - Master Public C ABI Header for C:\src\src (`libaysys` / `aysys.dll` / `aysys.wasm`)
 *
 * Subsystems preserve canonical upstream C namespaces (`drm_*`, `mesa_*`, `wl_*`, `xcb_*`, `xwm_*`,
 * `nt_*`, `wine_*`, `wasm_*`) while `ay_*` serves cross-subsystem CPU/ASM glue.
 */
#ifndef _AY_SYS_H
#define _AY_SYS_H

#ifdef __cplusplus
extern "C" {
#endif

#include "../uapi/ay/types.h"
#include "../uapi/ay/errno.h"
#include "../uapi/ay/drm.h"
#include "../uapi/ay/wayland.h"
#include "../uapi/ay/ntstatus.h"
#include "../uapi/ay/wasm.h"
#include "../uapi/ay/ui.h"
#include "../uapi/ay/shell.h"
#include "../uapi/ay/vterm.h"

#define AY_ARCH_UNKNOWN 0u
#define AY_ARCH_X86_64  1u
#define AY_ARCH_AARCH64 2u
#define AY_ARCH_WASM32  3u

struct ay_cpu_caps {
	__u32 arch_id;
	__u32 has_sse42;
	__u32 has_avx2;
	__u32 has_avx512f;
	__u64 tsc_sample;
};

/* arch/ + kernel/ */
AY_API __u32 ay_sys_abi_version(void) AY_WASM("ay_sys_abi_version");
AY_API __u64 ay_rdtsc(void) AY_WASM("ay_rdtsc");
AY_API __u64 ay_fnv1a64(const __u8 *data, __usize len) AY_WASM("ay_fnv1a64");
AY_API __s32 ay_cpu_probe(struct ay_cpu_caps *out_caps) AY_WASM("ay_cpu_probe");
AY_API __s64 ay_syscall6(__s64 nr, __s64 a0, __s64 a1, __s64 a2, __s64 a3, __s64 a4, __s64 a5);

/* drivers/gpu/drm/ (Linux 7.4-rc2 KMS + Mesa 26.3 GBM/EGL/D3D12) */
AY_API __s32 drm_fb_cmd2_init(struct drm_mode_fb_cmd2 *cmd, __u32 width, __u32 height,
			      __u32 fourcc, __u64 modifier, __u32 gem_handle) AY_WASM("drm_fb_cmd2_init");
AY_API __s32 mesa_select_egl_platform(__u32 host_os, __u32 has_wayland_fd,
				      __u32 has_drm_fd) AY_WASM("mesa_select_egl_platform");
AY_API __s32 drm_dmabuf_validate(const struct drm_dmabuf_export *exp) AY_WASM("drm_dmabuf_validate");

/* wayland/ (Freedesktop Wayland 1.26 wire, XCB 1.17 & Rootless XWayland 26.0.99 XWM, dynamic tiler) */
AY_API __u32      wl_pack_size_opcode(__u32 size_bytes, __u16 opcode) AY_WASM("wl_pack_size_opcode");
AY_API __u16      wl_hdr_size(__u32 size_opcode) AY_WASM("wl_hdr_size");
AY_API __u16      wl_hdr_opcode(__u32 size_opcode) AY_WASM("wl_hdr_opcode");
AY_API wl_fixed_t wl_fixed_from_int(__s32 v) AY_WASM("wl_fixed_from_int");
AY_API __s32      wl_fixed_to_int(wl_fixed_t f) AY_WASM("wl_fixed_to_int");
AY_API __s32      wl_wire_encode(__u8 *dst, __usize cap, __u32 object_id, __u16 opcode,
				 const __u32 *payload_words, __u32 word_count) AY_WASM("wl_wire_encode");
AY_API __s32      wl_wire_decode_hdr(const __u8 *src, __usize len, __u32 *out_object_id,
				     __u16 *out_opcode, __u16 *out_size) AY_WASM("wl_wire_decode_hdr");
AY_API __s32      wl_wire_put_string(__u8 *dst, __usize cap, const char *str,
				     __usize str_len) AY_WASM("wl_wire_put_string");

AY_API __s32 xcb_build_setup_req(struct xcb_setup_req *out_req) AY_WASM("xcb_build_setup_req");
AY_API void  xwm_context_init(struct xwm_context *ctx, __u32 wl_surface_id_atom) AY_WASM("xwm_context_init");
AY_API __s32 xwm_handle_client_message(struct xwm_context *ctx,
				       const struct xcb_client_message_event *ev) AY_WASM("xwm_handle_client_message");
AY_API __u32 xwm_lookup_wl_surface(const struct xwm_context *ctx,
				   __u32 x11_window) AY_WASM("xwm_lookup_wl_surface");
AY_API __s32 xwm_unmap_window(struct xwm_context *ctx, __u32 x11_window) AY_WASM("xwm_unmap_window");

AY_API __s32 wl_tile_compute(__u32 mode, __u32 out_w, __u32 out_h, __u32 gap_px,
			     __u32 master_permille, const __u32 *surface_ids, __u32 count,
			     struct wl_box *out_boxes) AY_WASM("wl_tile_compute");
AY_API __s32 wl_damage_union(const struct wl_box *a, const struct wl_box *b,
			     struct wl_box *out_merged) AY_WASM("wl_damage_union");

/* nt/ + wine/ (ReactOS / NT Executive NTSTATUS <-> Linux -errno & wineserver framing) */
AY_API NTSTATUS nt_errno_to_ntstatus(__s32 neg_errno) AY_WASM("nt_errno_to_ntstatus");
AY_API __s32    nt_status_to_errno(NTSTATUS status) AY_WASM("nt_status_to_errno");
AY_API __s32    wine_pack_server_req(__u8 *dst64, __s32 req_opcode, const __u8 *inline_payload,
				     __u32 inline_len, __u64 reply_max) AY_WASM("wine_pack_server_req");

/* wasm/ (WebAssembly 3.0 binary inspector, ULEB128 decoder & SIMD128 dot-product kernel) */
AY_API __s32 wasm_uleb128_decode(const __u8 *src, __usize cap, __u64 *out_val,
				 __u32 *out_len) AY_WASM("wasm_uleb128_decode");
AY_API __s32 wasm_inspect_module(const __u8 *bytes, __usize len,
				 struct wasm_module_info *out_info) AY_WASM("wasm_inspect_module");
AY_API __s32 wasm_simd_dot_i32(const __s32 *a, const __s32 *b, __usize count,
			       __s64 *out_sum) AY_WASM("wasm_simd_dot_i32");

/* ui/ (Material 3 Expressive colors, spring motion, adaptive shell & zero-alloc SSR HTML) */
AY_API __u32 ay_ui_color_argb(__u32 theme_mode, __u32 role_id) AY_WASM("ay_ui_color_argb");
AY_API __u32 ay_ui_argb_to_abgr(__u32 argb) AY_WASM("ay_ui_argb_to_abgr");
AY_API __u32 ay_ui_state_blend_argb(__u32 base_argb, __u32 content_argb,
				    __u32 opacity_permille) AY_WASM("ay_ui_state_blend_argb");
AY_API __s32 ay_ui_spring_init(struct ay_ui_spring_state *st, __u32 preset_id,
			       float initial, float target) AY_WASM("ay_ui_spring_init");
AY_API __s32 ay_ui_spring_step(struct ay_ui_spring_state *st,
			       float dt_sec) AY_WASM("ay_ui_spring_step");
AY_API __u32 ay_ui_window_class(__u32 width_dp) AY_WASM("ay_ui_window_class");
AY_API __s32 ay_ui_compute_shell(__u32 width_dp, __u32 height_dp,
				 struct ay_ui_adaptive_shell *out_shell) AY_WASM("ay_ui_compute_shell");
AY_API __s32 ay_ui_emit_m3_card_html(char *dst, __usize cap,
				     const char *title, __usize title_len,
				     const char *body, __usize body_len,
				     const char *cta_label, __usize cta_len,
				     const char *cta_href, __usize href_len) AY_WASM("ay_ui_emit_m3_card_html");

/* ui/shell_kit.c (Terminal Palettes, SGR Truecolor Formatter & Binary-Search 2026 Shell/CLI/TUI Catalog) */
AY_API __u32 ay_shell_abi_version(void) AY_WASM("ay_shell_abi_version");
AY_API __u32 ay_term_theme_count(void) AY_WASM("ay_term_theme_count");
AY_API __s32 ay_term_theme_slug(__u32 theme_idx, char *dst, __usize cap) AY_WASM("ay_term_theme_slug");
AY_API __s32 ay_term_theme_name(__u32 theme_idx, char *dst, __usize cap) AY_WASM("ay_term_theme_name");
AY_API __s32 ay_term_theme_find(const char *slug, __usize len) AY_WASM("ay_term_theme_find");
AY_API __s32 ay_term_palette_get(__u32 theme_idx, struct ay_term_palette *out) AY_WASM("ay_term_palette_get");
AY_API __u32 ay_term_palette_argb(__u32 theme_idx, __u32 slot) AY_WASM("ay_term_palette_argb");
AY_API __s32 ay_term_format_sgr(__u32 fg_argb, __u32 bg_argb, __u32 attrs, char *dst,
				__usize cap) AY_WASM("ay_term_format_sgr");
AY_API __s32 ay_term_format_hex(__u32 argb, char *dst, __usize cap) AY_WASM("ay_term_format_hex");
AY_API __u32 ay_shell_index_count(void) AY_WASM("ay_shell_index_count");
AY_API __s32 ay_shell_index_meta(__u32 idx, struct ay_shell_entry_meta *out) AY_WASM("ay_shell_index_meta");
AY_API __s32 ay_shell_index_field(__u32 idx, __u32 field_id, char *dst, __usize cap) AY_WASM("ay_shell_index_field");
AY_API __s32 ay_shell_index_find(const char *slug, __usize len) AY_WASM("ay_shell_index_find");
AY_API __s32 ay_shell_index_match(__u32 idx, const char *query, __usize len) AY_WASM("ay_shell_index_match");

/* ui/vterm.c (Pure C11 / WASM32 Zero-Alloc Virtual Terminal, ECMA-48 + OSC-133 + Scrollback + GPU Cell Packer) */
AY_API __u32 ay_vterm_abi_version(void) AY_WASM("ay_vterm_abi_version");
AY_API __u32 ay_vterm_state_bytes(void) AY_WASM("ay_vterm_state_bytes");
AY_API __s32 ay_vterm_init(struct ay_vterm_state *vt, __u32 cols, __u32 rows, __u32 theme_idx) AY_WASM("ay_vterm_init");
AY_API __s32 ay_vterm_set_theme(struct ay_vterm_state *vt, __u32 theme_idx) AY_WASM("ay_vterm_set_theme");
AY_API __s32 ay_vterm_resize(struct ay_vterm_state *vt, __u32 cols, __u32 rows) AY_WASM("ay_vterm_resize");
AY_API __s32 ay_vterm_feed(struct ay_vterm_state *vt, const __u8 *bytes, __usize len) AY_WASM("ay_vterm_feed");
AY_API __s32 ay_vterm_reset_dirty(struct ay_vterm_state *vt) AY_WASM("ay_vterm_reset_dirty");
AY_API __s32 ay_vterm_get_meta(const struct ay_vterm_state *vt, struct ay_vterm_meta *out) AY_WASM("ay_vterm_get_meta");
AY_API __s32 ay_vterm_get_block(const struct ay_vterm_state *vt, __u32 idx, struct ay_vterm_block *out) AY_WASM("ay_vterm_get_block");
AY_API __s32 ay_vterm_pack_gpu_cells(const struct ay_vterm_state *vt,
				     struct ay_vterm_gpu_cell *out_cells,
				     __u32 max_cells) AY_WASM("ay_vterm_pack_gpu_cells");
AY_API __s32 ay_vterm_copy_row_text(const struct ay_vterm_state *vt, __u32 row, char *dst, __usize cap) AY_WASM("ay_vterm_copy_row_text");
AY_API __s32 ay_vterm_copy_text(const struct ay_vterm_state *vt, char *dst, __usize cap) AY_WASM("ay_vterm_copy_text");
AY_API __s32 ay_vterm_drain_replies(struct ay_vterm_state *vt, __u8 *dst, __usize cap) AY_WASM("ay_vterm_drain_replies");
AY_API __s32 ay_vterm_scroll_lines(struct ay_vterm_state *vt, __s32 delta) AY_WASM("ay_vterm_scroll_lines");
AY_API __s32 ay_vterm_set_scroll(struct ay_vterm_state *vt, __u32 offset) AY_WASM("ay_vterm_set_scroll");
AY_API __s32 ay_vterm_get_link(const struct ay_vterm_state *vt, __u32 slot, char *dst, __usize cap) AY_WASM("ay_vterm_get_link");
AY_API __s32 ay_vterm_drain_clipboard(struct ay_vterm_state *vt, char *dst, __usize cap) AY_WASM("ay_vterm_drain_clipboard");
AY_API __s32 ay_vterm_copy_scrollback_text(const struct ay_vterm_state *vt, __u32 start_oldest,
					   __u32 row_count, char *dst, __usize cap) AY_WASM("ay_vterm_copy_scrollback_text");

#ifdef __cplusplus
}
#endif

#endif /* _AY_SYS_H */
