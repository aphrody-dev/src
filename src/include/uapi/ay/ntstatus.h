/* SPDX-License-Identifier: MIT OR Apache-2.0 */
/*
 * sys/include/uapi/ay/ntstatus.h - Windows NT / ReactOS / Wine Executive & wineserver UAPI
 *
 * Canonical subsystem prefixes:
 *   - `Nt*` / `Rtl*` / `NTSTATUS` for NT Executive & ReactOS kernel compatibility
 *   - `wine_*` for wineserver protocol & PE/Unix thunk descriptors
 */
#ifndef _UAPI_AY_NTSTATUS_H
#define _UAPI_AY_NTSTATUS_H

#include "types.h"

typedef __s32 NTSTATUS;

#define STATUS_SUCCESS                ((NTSTATUS)0x00000000)
#define STATUS_PENDING                ((NTSTATUS)0x00000103)
#define STATUS_BUFFER_TOO_SMALL       ((NTSTATUS)0xC0000023u)
#define STATUS_OBJECT_NAME_NOT_FOUND  ((NTSTATUS)0xC0000034u)
#define STATUS_INVALID_PARAMETER      ((NTSTATUS)0xC000000Du)
#define STATUS_NOT_IMPLEMENTED        ((NTSTATUS)0xC0000002u)

#define NT_SUCCESS(st) (((NTSTATUS)(st)) >= 0)

/* NT Object Attributes flags (ReactOS / WDK ntdef.h) */
#define OBJ_INHERIT          0x00000002u
#define OBJ_CASE_INSENSITIVE 0x00000040u
#define OBJ_KERNEL_HANDLE    0x00000200u

/* Wine server protocol fixed 64-byte request/reply framing (wine/include/wine/server_protocol.h) */
#define WINE_SERVER_PROTOCOL_FIXED_SIZE 64u

struct nt_unicode_view {
	__u16 length_bytes;
	__u16 max_length_bytes;
	__u32 pad0;
	__u64 utf16_ptr;
};

struct wine_server_req_hdr {
	__s32 req_opcode;
	__u32 data_size;
	__u64 reply_max;
};

#endif /* _UAPI_AY_NTSTATUS_H */
