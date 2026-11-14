/* SPDX-License-Identifier: MIT OR Apache-2.0 */
/*
 * sys/kernel/sys.c - Architecture probe, TSC, FNV-1a, freestanding mem*, and Linux 7.4-rc2 syscall6
 */
#include "../include/ay/sys.h"

#if !defined(__linux__) && !defined(__wasi__)
void *memset(void *dst, int c, __usize n)
{
	__u8 *p = (__u8 *)dst;
	__usize i;

	for (i = 0u; i < n; i++)
		p[i] = (__u8)c;
	return dst;
}

void *memcpy(void *dst, const void *src, __usize n)
{
	__u8 *d = (__u8 *)dst;
	const __u8 *s = (const __u8 *)src;
	__usize i;

	for (i = 0u; i < n; i++)
		d[i] = s[i];
	return dst;
}

void *memmove(void *dst, const void *src, __usize n)
{
	__u8 *d = (__u8 *)dst;
	const __u8 *s = (const __u8 *)src;
	__usize i;

	if (d == s || n == 0u)
		return dst;
	if (d < s) {
		for (i = 0u; i < n; i++)
			d[i] = s[i];
	} else {
		for (i = n; i > 0u; i--)
			d[i - 1u] = s[i - 1u];
	}
	return dst;
}
#endif

#if defined(__x86_64__) || defined(_M_X64)
extern __u64 ay_arch_rdtsc(void);
extern __u64 ay_arch_fnv1a64(const __u8 *data, __usize len);
#if defined(__linux__)
extern __s64 ay_arch_syscall6(__s64 nr, __s64 a0, __s64 a1, __s64 a2,
			      __s64 a3, __s64 a4, __s64 a5);
#endif
#endif

AY_API __u32 ay_sys_abi_version(void)
{
	return AY_SYS_ABI_VERSION;
}

AY_API __u64 ay_rdtsc(void)
{
#if defined(__x86_64__) || defined(_M_X64)
	return ay_arch_rdtsc();
#elif defined(__aarch64__)
	__u64 cnt = 0ULL;
	__asm__ volatile("mrs %0, cntvct_el0" : "=r"(cnt));
	return cnt;
#else
	return 0ULL;
#endif
}

AY_API __u64 ay_fnv1a64(const __u8 *data, __usize len)
{
#if defined(__x86_64__) || defined(_M_X64)
	return ay_arch_fnv1a64(data, len);
#else
	__u64 h = 0xcbf29ce484222325ULL;
	__usize i;

	if (!data)
		return h;
	for (i = 0u; i < len; i++) {
		h ^= (__u64)data[i];
		h *= 0x00000100000001b3ULL;
	}
	return h;
#endif
}

AY_API __s32 ay_cpu_probe(struct ay_cpu_caps *out_caps)
{
	if (!out_caps)
		return AY_EINVAL;

	out_caps->arch_id = AY_ARCH_UNKNOWN;
	out_caps->has_sse42 = 0u;
	out_caps->has_avx2 = 0u;
	out_caps->has_avx512f = 0u;
	out_caps->tsc_sample = ay_rdtsc();

#if defined(__x86_64__) || defined(_M_X64)
	{
		__u32 eax, ebx, ecx, edx;

		out_caps->arch_id = AY_ARCH_X86_64;
		eax = 1u;
		ecx = 0u;
		__asm__ volatile("cpuid"
				 : "+a"(eax), "=b"(ebx), "+c"(ecx), "=d"(edx));
		out_caps->has_sse42 = (ecx >> 20) & 1u;

		eax = 7u;
		ecx = 0u;
		__asm__ volatile("cpuid"
				 : "+a"(eax), "=b"(ebx), "+c"(ecx), "=d"(edx));
		out_caps->has_avx2 = (ebx >> 5) & 1u;
		out_caps->has_avx512f = (ebx >> 16) & 1u;
	}
#elif defined(__aarch64__)
	out_caps->arch_id = AY_ARCH_AARCH64;
#elif defined(__wasm__)
	out_caps->arch_id = AY_ARCH_WASM32;
#endif
	return AY_OK;
}

AY_API __s64 ay_syscall6(__s64 nr, __s64 a0, __s64 a1, __s64 a2, __s64 a3, __s64 a4, __s64 a5)
{
#if defined(__linux__) && (defined(__x86_64__) || defined(_M_X64))
	return ay_arch_syscall6(nr, a0, a1, a2, a3, a4, a5);
#elif defined(__linux__) && defined(__aarch64__)
	register __s64 x8 __asm__("x8") = nr;
	register __s64 x0 __asm__("x0") = a0;
	register __s64 x1 __asm__("x1") = a1;
	register __s64 x2 __asm__("x2") = a2;
	register __s64 x3 __asm__("x3") = a3;
	register __s64 x4 __asm__("x4") = a4;
	register __s64 x5 __asm__("x5") = a5;

	__asm__ volatile("svc #0"
			 : "+r"(x0)
			 : "r"(x8), "r"(x1), "r"(x2), "r"(x3), "r"(x4), "r"(x5)
			 : "memory", "cc");
	return x0;
#else
	(void)nr;
	(void)a0;
	(void)a1;
	(void)a2;
	(void)a3;
	(void)a4;
	(void)a5;
	return AY_ENOTSUP;
#endif
}
