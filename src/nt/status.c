/* SPDX-License-Identifier: MIT OR Apache-2.0 */
/*
 * sys/nt/status.c - ReactOS / Windows NT Executive NTSTATUS <-> Linux -errno bijection
 */
#include "../include/ay/sys.h"

AY_API NTSTATUS nt_errno_to_ntstatus(__s32 neg_errno)
{
	switch (neg_errno) {
	case AY_OK:
		return STATUS_SUCCESS;
	case AY_ENOENT:
		return STATUS_OBJECT_NAME_NOT_FOUND;
	case AY_EAGAIN:
		return STATUS_PENDING;
	case AY_EINVAL:
	case AY_EPROTO:
		return STATUS_INVALID_PARAMETER;
	case AY_ENOSPC:
		return STATUS_BUFFER_TOO_SMALL;
	case AY_ENOTSUP:
	default:
		return STATUS_NOT_IMPLEMENTED;
	}
}

AY_API __s32 nt_status_to_errno(NTSTATUS status)
{
	if (NT_SUCCESS(status))
		return (status == STATUS_PENDING) ? AY_EAGAIN : AY_OK;

	switch (status) {
	case STATUS_OBJECT_NAME_NOT_FOUND:
		return AY_ENOENT;
	case STATUS_BUFFER_TOO_SMALL:
		return AY_ENOSPC;
	case STATUS_INVALID_PARAMETER:
		return AY_EINVAL;
	case STATUS_NOT_IMPLEMENTED:
	default:
		return AY_ENOTSUP;
	}
}
