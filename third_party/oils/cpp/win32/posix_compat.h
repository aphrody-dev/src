// cpp/win32/posix_compat.h: minimal POSIX surface for building Oils natively
// on Windows (clang-cl / UCRT, no MSYS/Cygwin/MinGW).
//
// Force-included into every translation unit (-FI).  Only the subset of POSIX
// that cpp/, mycpp/ and the generated code actually use is declared here.
// Implementations live in cpp/win32/compat.cc.

#ifndef OILS_WIN32_POSIX_COMPAT_H
#define OILS_WIN32_POSIX_COMPAT_H

#ifdef _WIN32

// Pull in every UCRT header that declares a name we touch, BEFORE we define
// any macro, so include guards protect them afterwards.
#include <direct.h>
#include <errno.h>
#include <fcntl.h>
#include <io.h>
#include <limits.h>
#include <locale.h>
#include <process.h>
#include <signal.h>
#include <stddef.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/stat.h>
#include <sys/types.h>
#include <time.h>
#include <wchar.h>

// C++ headers that glibc/libstdc++ pull in transitively but MSVC's STL doesn't.
#ifdef __cplusplus
#include <algorithm>
#include <functional>
#include <map>
#include <regex>
#include <string>
#include <vector>
#include <new>
#include <utility>
#endif

#ifdef __cplusplus
extern "C" {
#endif

// ---- types ----------------------------------------------------------------
typedef int pid_t;
typedef int uid_t;
typedef int gid_t;
typedef int mode_t;
typedef long long ssize_t;
typedef long suseconds_t;

#ifndef PATH_MAX
#define PATH_MAX 4096
#endif

#define STDIN_FILENO 0
#define STDOUT_FILENO 1
#define STDERR_FILENO 2

// ---- environ --------------------------------------------------------------
#undef environ
extern char** environ;  // UTF-8, maintained by compat.cc

// ---- unistd.h -------------------------------------------------------------
#define F_OK 0
#define W_OK 2
#define R_OK 4
#define X_OK 1  // UCRT access() rejects 1; oils_access handles it

int oils_access(const char* path, int mode);
#define access oils_access

int pipe(int fds[2]);
pid_t getppid(void);
uid_t getuid(void);
uid_t geteuid(void);
gid_t getegid(void);
int setpgid(pid_t pid, pid_t pgid);
pid_t getpgid(pid_t pid);
int tcsetpgrp(int fd, pid_t pgid);
pid_t tcgetpgrp(int fd);
int gethostname(char* name, size_t len);
long sysconf(int name);
#define _SC_CLK_TCK 2
int setenv(const char* name, const char* value, int overwrite);
int unsetenv(const char* name);
char* realpath(const char* path, char* resolved);
int oils_execve(const char* path, char* const argv[], char* const envp[]);
#define execve oils_execve

// posix::_exit() must not kill the shell when a "child" runs in-process.
void oils_exit_hook(int status);

// ---- fcntl.h --------------------------------------------------------------
#define F_DUPFD 0
#define F_GETFD 1
#define F_SETFD 2
#define F_GETFL 3
#define F_SETFL 4
#define FD_CLOEXEC 1
#ifndef O_CLOEXEC
#define O_CLOEXEC _O_NOINHERIT
#endif
#define O_NONBLOCK 0
#define O_NOCTTY 0
#define O_DIRECTORY 0
#define O_NOFOLLOW 0
int fcntl(int fd, int cmd, ...);
int oils_open(const char* path, int flags, ...);
#define open oils_open

// ---- sys/stat.h -----------------------------------------------------------
#ifndef S_IFIFO
#define S_IFIFO _S_IFIFO
#endif
#define S_IFLNK 0xA000
#define S_IFSOCK 0xC000
#define S_IFBLK 0x6000
#define S_ISUID 0
#define S_ISGID 0
#define S_ISVTX 0
#define S_ISDIR(m) (((m) & S_IFMT) == S_IFDIR)
#define S_ISREG(m) (((m) & S_IFMT) == S_IFREG)
#define S_ISCHR(m) (((m) & S_IFMT) == S_IFCHR)
#define S_ISFIFO(m) (((m) & S_IFMT) == _S_IFIFO)
#define S_ISLNK(m) 0
#define S_ISBLK(m) 0
#define S_ISSOCK(m) 0
#define lstat stat
int oils_stat(const char* path, struct stat* st);
// 2 args -> oils_stat(); 1 arg (mylib::stat(BigStr*)) left alone.
#define OILS_EXPAND(x) x
#define OILS_STAT_PICK(a, b, NAME, ...) NAME
#define stat(...) \
  OILS_EXPAND(OILS_STAT_PICK(__VA_ARGS__, oils_stat, stat))(__VA_ARGS__)

// path-translating / console-aware replacements of UCRT names
int oils_chdir(const char* path);
#define chdir oils_chdir
char* oils_getcwd(char* buf, size_t n);
#define getcwd oils_getcwd
int oils_unlink(const char* path);
#define unlink oils_unlink
int oils_isatty(int fd);
#define isatty oils_isatty

#define HAVE_GLOB_PERIOD 1
#define HAVE_FNM_EXTMATCH 1

// ---- signal.h -------------------------------------------------------------
// UCRT: SIGINT 2, SIGILL 4, SIGFPE 8, SIGSEGV 11, SIGTERM 15, SIGBREAK 21,
// SIGABRT 22.  The rest are shell-internal numbers (traps, kill -l).
#define SIGHUP 1
#define SIGQUIT 3
#define SIGTRAP 5
#define SIGBUS 7
#define SIGKILL 9
#define SIGUSR1 10
#define SIGUSR2 12
#define SIGPIPE 13
#define SIGALRM 14
#define SIGCHLD 17
#define SIGCONT 18
#define SIGSTOP 19
#define SIGTSTP 20
#define SIGURG 23
#define SIGXCPU 24
#define SIGXFSZ 25
#define SIGVTALRM 26
#define SIGPROF 27
#define SIGWINCH 28
#define SIGTTIN 29
#define SIGTTOU 30
#define SIGSYS 31
#undef NSIG
#define NSIG 32

typedef unsigned int sigset_t;
struct sigaction {
  void (*sa_handler)(int);
  sigset_t sa_mask;
  int sa_flags;
};
#define SA_RESTART 0
int sigaction(int sig, const struct sigaction* act, struct sigaction* old);
int sigemptyset(sigset_t* s);
int sigaddset(sigset_t* s, int sig);
int sigprocmask(int how, const sigset_t* s, sigset_t* old);
#define SIG_BLOCK 0
#define SIG_UNBLOCK 1
#define SIG_SETMASK 2
int kill(pid_t pid, int sig);
int killpg(pid_t pgid, int sig);
char* strsignal(int sig);

// ---- sys/wait.h -----------------------------------------------------------
#define WNOHANG 1
#define WUNTRACED 2
#define WIFEXITED(s) (((s) & 0x7f) == 0)
#define WEXITSTATUS(s) (((s) >> 8) & 0xff)
#define WIFSIGNALED(s) ((((s) & 0x7f) != 0) && (((s) & 0x7f) != 0x7f))
#define WTERMSIG(s) ((s) & 0x7f)
#define WIFSTOPPED(s) (((s) & 0xff) == 0x7f)
#define WSTOPSIG(s) WEXITSTATUS(s)
#define WCOREDUMP(s) 0
pid_t waitpid(pid_t pid, int* status, int options);

// ---- sys/time.h, sys/times.h, sys/resource.h ------------------------------
struct oils_timeval {
  long long tv_sec;
  long tv_usec;
};
#define timeval oils_timeval
int gettimeofday(struct timeval* tv, void* tz);

int nanosleep(const struct timespec* req, struct timespec* rem);

struct tms {
  clock_t tms_utime;
  clock_t tms_stime;
  clock_t tms_cutime;
  clock_t tms_cstime;
};
clock_t times(struct tms* t);

typedef unsigned long long rlim_t;
struct rlimit {
  rlim_t rlim_cur;
  rlim_t rlim_max;
};
#define RLIM_INFINITY (~0ULL)
#define RLIMIT_CPU 0
#define RLIMIT_FSIZE 1
#define RLIMIT_DATA 2
#define RLIMIT_STACK 3
#define RLIMIT_CORE 4
#define RLIMIT_NOFILE 7
#define RLIMIT_AS 9
int getrlimit(int res, struct rlimit* r);
int setrlimit(int res, const struct rlimit* r);
struct rusage {
  struct timeval ru_utime;
  struct timeval ru_stime;
  long ru_maxrss;
};
#define RUSAGE_SELF 0
#define RUSAGE_CHILDREN -1
int getrusage(int who, struct rusage* r);

// ---- sys/select.h (only stdin readiness) ----------------------------------
#ifndef FD_SETSIZE
#define FD_SETSIZE 64
#endif
typedef struct {
  unsigned long long bits;
} fd_set;
#define FD_ZERO(s) ((s)->bits = 0)
#define FD_SET(fd, s) ((s)->bits |= (1ULL << (fd)))
#define FD_CLR(fd, s) ((s)->bits &= ~(1ULL << (fd)))
#define FD_ISSET(fd, s) (((s)->bits >> (fd)) & 1ULL)
int select(int n, fd_set* r, fd_set* w, fd_set* e, struct timeval* t);

// ---- sys/utsname.h --------------------------------------------------------
struct utsname {
  char sysname[65];
  char nodename[65];
  char release[65];
  char version[65];
  char machine[65];
};
int uname(struct utsname* u);

// ---- sys/ioctl.h ----------------------------------------------------------
struct winsize {
  unsigned short ws_row;
  unsigned short ws_col;
  unsigned short ws_xpixel;
  unsigned short ws_ypixel;
};
#define TIOCGWINSZ 0x5413
int ioctl(int fd, unsigned long req, ...);

// ---- termios.h ------------------------------------------------------------
typedef unsigned int tcflag_t;
struct termios {
  tcflag_t c_iflag, c_oflag, c_cflag, c_lflag;
  unsigned char c_cc[32];
};
#define ICANON 0x2
#define ECHO 0x8
#define TCSANOW 0
int tcgetattr(int fd, struct termios* t);
int tcsetattr(int fd, int act, const struct termios* t);

// ---- pwd.h ----------------------------------------------------------------
struct passwd {
  char* pw_name;
  char* pw_passwd;
  uid_t pw_uid;
  gid_t pw_gid;
  char* pw_gecos;
  char* pw_dir;
  char* pw_shell;
};
struct passwd* getpwuid(uid_t uid);
struct passwd* getpwnam(const char* name);

// ---- langinfo.h -----------------------------------------------------------
#define CODESET 14
char* nl_langinfo(int item);

// ---- wchar ----------------------------------------------------------------
int wcswidth(const wchar_t* s, size_t n);

// ---- fnmatch.h ------------------------------------------------------------
#define FNM_NOMATCH 1
#define FNM_NOESCAPE 0x01
#define FNM_PATHNAME 0x02
#define FNM_PERIOD 0x04
#define FNM_CASEFOLD 0x10
#define FNM_EXTMATCH 0x20
int fnmatch(const char* pat, const char* str, int flags);

// ---- glob.h ---------------------------------------------------------------
typedef struct {
  size_t gl_pathc;
  char** gl_pathv;
  size_t gl_offs;
} glob_t;
#define GLOB_ERR 0x01
#define GLOB_MARK 0x02
#define GLOB_NOSORT 0x04
#define GLOB_NOCHECK 0x10
#define GLOB_NOESCAPE 0x40
#define GLOB_PERIOD 0x80
#define GLOB_NOSPACE 1
#define GLOB_ABORTED 2
#define GLOB_NOMATCH 3
int glob(const char* pat, int flags, int (*errfunc)(const char*, int),
         glob_t* g);
void globfree(glob_t* g);

// ---- regex.h (POSIX ERE via std::regex) ------------------------------------
typedef struct {
  void* impl;
  size_t re_nsub;
} regex_t;
typedef long long regoff_t;
typedef struct {
  regoff_t rm_so;
  regoff_t rm_eo;
} regmatch_t;
#define REG_EXTENDED 1
#define REG_ICASE 2
#define REG_NOSUB 4
#define REG_NEWLINE 8
#define REG_NOTBOL 1
#define REG_NOTEOL 2
#define REG_NOMATCH 1
int regcomp(regex_t* r, const char* pat, int cflags);
int regexec(const regex_t* r, const char* s, size_t n, regmatch_t* m,
            int eflags);
void regfree(regex_t* r);
size_t regerror(int code, const regex_t* r, char* buf, size_t n);

// ---- dirent.h -------------------------------------------------------------
struct dirent {
  char d_name[1024];
};
typedef struct oils_DIR DIR;
DIR* opendir(const char* path);
struct dirent* readdir(DIR* d);
int closedir(DIR* d);

// ---- stdio extensions -----------------------------------------------------
int dprintf(int fd, const char* fmt, ...);
ssize_t getline(char** line, size_t* cap, FILE* f);

// ---- misc POSIX constants / functions ------------------------------------
#define _POSIX_HOST_NAME_MAX 255
#define AT_FDCWD -100
#define AT_EACCESS 0x200
int faccessat(int dirfd, const char* path, int mode, int flags);
#define CLOCK_REALTIME 0
#define CLOCK_MONOTONIC 1
typedef int clockid_t;
int clock_gettime(clockid_t id, struct timespec* ts);

// ---- path translation -----------------------------------------------------
// "/c/x/y" -> "C:/x/y"; anything else unchanged.  Returns malloc'd string.
char* oils_win_path(const char* p);
// "C:/x", "C:\x", "\\server\share" are absolute too.
int oils_win_isabs(const char* p);
// Same volume serial + file index (st_ino is always 0 on Windows).
int oils_same_file(const char* a, const char* b);

#ifdef __cplusplus
}  // extern "C"
#endif

// The in-process "child" exit used instead of fork()+_exit().
#ifdef __cplusplus
struct OilsInProcExit {
  int status;
};
// exec of an external from an in-process "child": the child is now that
// process (async); the fake child becomes the real pid.
struct OilsInProcExec {
  int pid;
};
#endif

#endif  // _WIN32
#endif  // OILS_WIN32_POSIX_COMPAT_H
