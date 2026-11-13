// Kernel boot proof, PID 1 of a one-file initramfs (model: bun-LFS preinit, third_party/lfs/bun/init/preinit.c).
// Freestanding x86_64 (no libc): mounts the API filesystems, prints the uname of the running kernel and a
// boot marker on the console, then powers the VM off. infra/linux/build/boot.sh checks both lines.
// Build: clang -static -nostdlib -ffreestanding -fno-stack-protector -O2 -fuse-ld=lld -o init init.c
typedef __INTPTR_TYPE__ sptr;
typedef __SIZE_TYPE__ usize;

static sptr sys6(sptr n, sptr a, sptr b, sptr c, sptr d, sptr e) {
  sptr r;
  register sptr r10 __asm__("r10") = d;
  register sptr r8 __asm__("r8") = e;
  __asm__ volatile("syscall" : "=a"(r) : "a"(n), "D"(a), "S"(b), "d"(c), "r"(r10), "r"(r8) : "rcx", "r11", "memory");
  return r;
}

enum { SYS_write = 1, SYS_open = 2, SYS_pause = 34, SYS_uname = 63, SYS_mkdir = 83, SYS_mount = 165, SYS_sync = 162, SYS_reboot = 169 };

static sptr out = 1;

static void put(const char *s) {
  usize n = 0;
  while (s[n]) n++;
  sys6(SYS_write, out, (sptr)s, (sptr)n, 0, 0);
}

static void mnt(const char *src, const char *dst, const char *fs) {
  sys6(SYS_mkdir, (sptr)dst, 0755, 0, 0, 0);
  sys6(SYS_mount, (sptr)src, (sptr)dst, (sptr)fs, 0, 0);
}

struct utsname { char sysname[65], nodename[65], release[65], version[65], machine[65], domainname[65]; };

__attribute__((force_align_arg_pointer, noreturn)) void _start(void) {
  mnt("devtmpfs", "/dev", "devtmpfs");
  mnt("proc", "/proc", "proc");
  mnt("sysfs", "/sys", "sysfs");
  // A one-file initramfs has no /dev/console node, so PID 1 starts without fds: open it from devtmpfs.
  sptr fd = sys6(SYS_open, (sptr)"/dev/console", 1 /* O_WRONLY */, 0, 0, 0);
  if (fd >= 0) out = fd;
  static struct utsname u;
  if (sys6(SYS_uname, (sptr)&u, 0, 0, 0, 0) == 0) {
    put("APHRODY-UNAME ");
    put(u.sysname); put(" "); put(u.release); put(" "); put(u.machine); put(" | "); put(u.version); put("\n");
    put("APHRODY-BOOT-OK\n");
  } else {
    put("APHRODY-BOOT-FAIL uname\n");
  }
  sys6(SYS_sync, 0, 0, 0, 0, 0);
  // reboot(LINUX_REBOOT_MAGIC1, LINUX_REBOOT_MAGIC2, LINUX_REBOOT_CMD_POWER_OFF)
  sys6(SYS_reboot, (sptr)0xfee1deadu, 672274793, (sptr)0x4321fedcu, 0, 0);
  for (;;) sys6(SYS_pause, 0, 0, 0, 0, 0); // PID 1 must not exit
}
