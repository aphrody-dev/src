/* SPDX-License-Identifier: MIT OR Apache-2.0 */
/*
 * sys/arch/x86/entry_64.S - Pure x86_64 AT&T/GAS Assembly (Clang -fintegrated-as)
 *
 * Follows torvalds/linux arch/x86/entry/ conventions:
 *   - Windows x64 ABI: rcx, rdx, r8, r9 -> rax
 *   - System V AMD64 ABI: rdi, rsi, rdx, rcx, r8, r9 -> rax
 *   - Linux raw syscall ABI: rax=nr, rdi, rsi, rdx, r10, r8, r9 -> syscall
 */

#if defined(__x86_64__) || defined(_M_X64)
	.text

/* __u64 ay_arch_rdtsc(void) */
	.globl	ay_arch_rdtsc
	.p2align	4, 0x90
ay_arch_rdtsc:
	lfence
	rdtsc
	shlq	$32, %rdx
	orq	%rdx, %rax
	retq

/* __u64 ay_arch_fnv1a64(const __u8 *data, __usize len) */
	.globl	ay_arch_fnv1a64
	.p2align	4, 0x90
ay_arch_fnv1a64:
#if defined(_WIN32)
	movq	%rcx, %r8
	movq	%rdx, %r9
#else
	movq	%rdi, %r8
	movq	%rsi, %r9
#endif
	movabsq	$0xcbf29ce484222325, %rax
	movabsq	$0x00000100000001b3, %r10
	testq	%r8, %r8
	je	.Lfnv_done
	testq	%r9, %r9
	je	.Lfnv_done
	.p2align	4, 0x90
.Lfnv_loop:
	movzbq	(%r8), %rcx
	xorq	%rcx, %rax
	imulq	%r10, %rax
	incq	%r8
	decq	%r9
	jne	.Lfnv_loop
.Lfnv_done:
	retq

#if defined(__linux__)
/* __s64 ay_arch_syscall6(__s64 nr, __s64 a0, __s64 a1, __s64 a2, __s64 a3, __s64 a4, __s64 a5) */
	.globl	ay_arch_syscall6
	.p2align	4, 0x90
ay_arch_syscall6:
	movq	%rdi, %rax
	movq	%rsi, %rdi
	movq	%rdx, %rsi
	movq	%rcx, %rdx
	movq	%r8, %r10
	movq	%r9, %r8
	movq	8(%rsp), %r9
	syscall
	retq
#endif

#if defined(_WIN32)
	.data
	.globl	_fltused
	.p2align	2, 0x0
_fltused:
	.long	1
#endif

#endif /* __x86_64__ */
