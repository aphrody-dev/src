/* SPDX-License-Identifier: MIT OR Apache-2.0 */
/*
 * sys/include/uapi/ay/drm.h - Linux 7.4-rc2 DRM/KMS (uapi/drm/drm_mode.h) & Mesa 26.3 GBM/EGL/D3D12
 *
 * Canonical subsystem prefix: `drm_*` / `mesa_*` (mirrors torvalds/linux & mesa/mesa).
 */
#ifndef _UAPI_AY_DRM_H
#define _UAPI_AY_DRM_H

#include "types.h"

#define DRM_FOURCC(a, b, c, d) \
	((__u32)(a) | ((__u32)(b) << 8) | ((__u32)(c) << 16) | ((__u32)(d) << 24))

#define DRM_FORMAT_XRGB8888    DRM_FOURCC('X', 'R', '2', '4') /* 0x34325258 */
#define DRM_FORMAT_ARGB8888    DRM_FOURCC('A', 'R', '2', '4') /* 0x34325241 */
#define DRM_FORMAT_ABGR8888    DRM_FOURCC('A', 'B', '2', '4') /* 0x34324241 */
#define DRM_FORMAT_XBGR2101010 DRM_FOURCC('X', 'B', '3', '0')

#define DRM_FORMAT_MOD_LINEAR  0ULL
#define DRM_FORMAT_MOD_INVALID 0x00ffffffffffffffULL
#define DRM_MODE_FB_MODIFIERS  (1u << 1)

/* EGL_EXT_platform_base enums (Mesa docs/egl.rst + docs/drivers/d3d12.rst) */
#define EGL_PLATFORM_X11_KHR         0x31D5u
#define EGL_PLATFORM_GBM_KHR         0x31D7u
#define EGL_PLATFORM_WAYLAND_KHR     0x31D8u
#define EGL_PLATFORM_SURFACELESS_MESA 0x31DDu
#define EGL_PLATFORM_D3D12_MESA      0x31FDu

struct drm_mode_fb_cmd2 {
	__u32 fb_id;
	__u32 width;
	__u32 height;
	__u32 pixel_format;
	__u32 flags;
	__u32 handles[4];
	__u32 pitches[4];
	__u32 offsets[4];
	__u64 modifier[4];
};

struct drm_dmabuf_export {
	__u32 width;
	__u32 height;
	__u32 fourcc;
	__u32 plane_count;
	__u64 modifier;
	__s32 prime_fds[4];
	__u32 strides[4];
	__u32 offsets[4];
	__u64 nt_shared_handle; /* DXGI / NT shared handle for Gallium D3D12 / Wine / WSLg */
	__u32 egl_platform;
	__u32 pad0;
};

#endif /* _UAPI_AY_DRM_H */
