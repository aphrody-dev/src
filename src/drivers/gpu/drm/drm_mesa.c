/* SPDX-License-Identifier: MIT OR Apache-2.0 */
/*
 * sys/drivers/gpu/drm/drm_mesa.c - Linux 7.4-rc2 DRM/KMS & Mesa 26.3 GBM/EGL 1.5/D3D12
 */
#include "../../../include/ay/sys.h"

static __u32 drm_bpp_for_fourcc(__u32 fourcc)
{
	switch (fourcc) {
	case DRM_FORMAT_XRGB8888:
	case DRM_FORMAT_ARGB8888:
	case DRM_FORMAT_ABGR8888:
	case DRM_FORMAT_XBGR2101010:
		return 4u;
	default:
		return 0u;
	}
}

AY_API __s32 drm_fb_cmd2_init(struct drm_mode_fb_cmd2 *cmd, __u32 width, __u32 height,
			      __u32 fourcc, __u64 modifier, __u32 gem_handle)
{
	__u32 bpp;
	__u32 stride;
	int i;

	if (!cmd || width == 0u || height == 0u || gem_handle == 0u)
		return AY_EINVAL;

	bpp = drm_bpp_for_fourcc(fourcc);
	if (bpp == 0u)
		return AY_EINVAL;

	/* 64-byte pitch alignment matching Mesa GBM / Intel / AMD / NVIDIA scanout */
	stride = ((width * bpp) + 63u) & ~63u;

	cmd->fb_id = 0u;
	cmd->width = width;
	cmd->height = height;
	cmd->pixel_format = fourcc;
	cmd->flags = (modifier != DRM_FORMAT_MOD_INVALID) ? DRM_MODE_FB_MODIFIERS : 0u;

	for (i = 0; i < 4; i++) {
		cmd->handles[i] = 0u;
		cmd->pitches[i] = 0u;
		cmd->offsets[i] = 0u;
		cmd->modifier[i] = 0ULL;
	}

	cmd->handles[0] = gem_handle;
	cmd->pitches[0] = stride;
	cmd->offsets[0] = 0u;
	cmd->modifier[0] = (modifier != DRM_FORMAT_MOD_INVALID) ? modifier : 0ULL;
	return AY_OK;
}

AY_API __s32 mesa_select_egl_platform(__u32 host_os, __u32 has_wayland_fd, __u32 has_drm_fd)
{
	if (host_os == 1u)
		return (__s32)EGL_PLATFORM_D3D12_MESA;
	if (host_os == 0u) {
		if (has_wayland_fd)
			return (__s32)EGL_PLATFORM_WAYLAND_KHR;
		if (has_drm_fd)
			return (__s32)EGL_PLATFORM_GBM_KHR;
		return (__s32)EGL_PLATFORM_SURFACELESS_MESA;
	}
	return (__s32)EGL_PLATFORM_SURFACELESS_MESA;
}

AY_API __s32 drm_dmabuf_validate(const struct drm_dmabuf_export *exp)
{
	__u32 bpp;
	__u32 i;

	if (!exp || exp->width == 0u || exp->height == 0u)
		return AY_EINVAL;
	if (exp->plane_count == 0u || exp->plane_count > 4u)
		return AY_EINVAL;
	if (exp->modifier == DRM_FORMAT_MOD_INVALID)
		return AY_EINVAL;

	bpp = drm_bpp_for_fourcc(exp->fourcc);
	if (bpp == 0u)
		return AY_EINVAL;

	for (i = 0u; i < exp->plane_count; i++) {
		if (i == 0u && exp->strides[0] < exp->width * bpp)
			return AY_EINVAL;
		if (exp->prime_fds[i] < 0 && exp->nt_shared_handle == 0ULL)
			return AY_EINVAL;
	}
	return AY_OK;
}
