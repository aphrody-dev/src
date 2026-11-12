// cpp/win32/compat.cc: Win32 implementation of the POSIX subset declared in
// cpp/win32/posix_compat.h.  Native Windows only (UCRT + kernel32/advapi32).
//
// Design notes:
// - All strings are UTF-8.  The executable embeds a manifest with
//   activeCodePage=UTF-8, so the CRT "A" functions are UTF-8 too; we still use
//   the W APIs for process creation and the environment.
// - Child processes: CreateProcessW with an explicit inherited-handle list
//   (PROC_THREAD_ATTRIBUTE_HANDLE_LIST) so pipe ends never leak into children.
//   Every child is put in a kill-on-close job object.
// - waitpid() keeps a table pid -> HANDLE.  "Fake" pids are used for
//   sub-programs that ran in-process (see cpp/win32/process_win.inc).
// - Paths: "/c/foo" -> "C:/foo".  $PATH is exposed to the shell in POSIX form
//   ("/c/Windows:/c/x") and converted back for children.

#define WIN32_LEAN_AND_MEAN
#define NOMINMAX
#include <windows.h>
#include <winioctl.h>
#include <crtdbg.h>

#include <algorithm>
#include <map>
#include <regex>
#include <string>
#include <vector>

#include "cpp/win32/posix_compat.h"

// --------------------------------------------------------------------------
// UTF-8 <-> UTF-16
// --------------------------------------------------------------------------

static std::wstring W(const char* s, int n = -1) {
  if (!s) return std::wstring();
  if (n < 0) n = (int)strlen(s);
  if (n == 0) return std::wstring();
  int m = MultiByteToWideChar(CP_UTF8, 0, s, n, nullptr, 0);
  std::wstring w(m, L'\0');
  MultiByteToWideChar(CP_UTF8, 0, s, n, &w[0], m);
  return w;
}
static std::wstring W(const std::string& s) {
  return W(s.data(), (int)s.size());
}

static std::string U(const wchar_t* w, int n = -1) {
  if (!w) return std::string();
  if (n < 0) n = (int)wcslen(w);
  if (n == 0) return std::string();
  int m = WideCharToMultiByte(CP_UTF8, 0, w, n, nullptr, 0, nullptr, nullptr);
  std::string s(m, '\0');
  WideCharToMultiByte(CP_UTF8, 0, w, n, &s[0], m, nullptr, nullptr);
  return s;
}

static int ErrnoFromWin(DWORD e) {
  switch (e) {
  case ERROR_FILE_NOT_FOUND:
  case ERROR_PATH_NOT_FOUND:
  case ERROR_INVALID_NAME:
  case ERROR_BAD_PATHNAME:
    return ENOENT;
  case ERROR_ACCESS_DENIED:
    return EACCES;
  case ERROR_BAD_EXE_FORMAT:
  case ERROR_EXE_MACHINE_TYPE_MISMATCH:
    return ENOEXEC;
  case ERROR_INVALID_HANDLE:
    return EBADF;
  case ERROR_NOT_ENOUGH_MEMORY:
  case ERROR_OUTOFMEMORY:
    return ENOMEM;
  case ERROR_BROKEN_PIPE:
  case ERROR_NO_DATA:
    return EPIPE;
  default:
    return EINVAL;
  }
}

// --------------------------------------------------------------------------
// Paths
// --------------------------------------------------------------------------

static bool IsAlpha(char c) {
  return (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z');
}

// "/c" or "/c/..." -> "C:/..."
static std::string ToWinPath(const char* p) {
  std::string s(p ? p : "");
  if (s.size() >= 2 && s[0] == '/' && IsAlpha(s[1]) &&
      (s.size() == 2 || s[2] == '/')) {
    std::string r;
    r += (char)toupper(s[1]);
    r += ':';
    r += (s.size() == 2) ? std::string("/") : s.substr(2);
    return r;
  }
  if (s == "/dev/null") return "NUL";
  if (s == "/dev/tty") return "CON";
  if (s == "/tmp" || s.compare(0, 5, "/tmp/") == 0) {
    wchar_t buf[MAX_PATH + 1];
    DWORD n = GetTempPathW(MAX_PATH, buf);
    std::string t = U(buf, n);
    std::replace(t.begin(), t.end(), '\\', '/');
    while (!t.empty() && t.back() == '/') t.pop_back();
    return t + s.substr(4);
  }
  return s;
}

// "C:\x\y" -> "/c/x/y"
static std::string ToPosixPath(const std::string& p) {
  std::string s = p;
  std::replace(s.begin(), s.end(), '\\', '/');
  if (s.size() >= 2 && IsAlpha(s[0]) && s[1] == ':') {
    std::string r = "/";
    r += (char)tolower(s[0]);
    r += s.substr(2);
    return r;
  }
  return s;
}

extern "C" char* oils_win_path(const char* p) {
  return _strdup(ToWinPath(p).c_str());
}

// PATH "C:\a;D:\b" -> "/c/a:/d/b"
static std::string PathListToPosix(const std::string& v) {
  std::string out;
  size_t start = 0;
  while (start <= v.size()) {
    size_t semi = v.find(';', start);
    if (semi == std::string::npos) semi = v.size();
    std::string item = v.substr(start, semi - start);
    if (!item.empty()) {
      if (!out.empty()) out += ':';
      out += ToPosixPath(item);
    }
    start = semi + 1;
  }
  return out;
}

// "/c/a:/d/b" -> "C:\a;D:\b"   (leaves an already-Windows list untouched)
static std::string PathListToWin(const std::string& v) {
  if (v.find(';') != std::string::npos) return v;
  if (v.size() >= 2 && IsAlpha(v[0]) && v[1] == ':') return v;
  std::string out;
  size_t start = 0;
  while (start <= v.size()) {
    size_t c = v.find(':', start);
    if (c == std::string::npos) c = v.size();
    std::string item = v.substr(start, c - start);
    if (!item.empty()) {
      if (!out.empty()) out += ';';
      std::string w = ToWinPath(item.c_str());
      std::replace(w.begin(), w.end(), '/', '\\');
      out += w;
    }
    start = c + 1;
  }
  return out;
}

static bool FileExistsW(const std::wstring& p, bool* is_dir = nullptr) {
  DWORD a = GetFileAttributesW(p.c_str());
  if (a == INVALID_FILE_ATTRIBUTES) return false;
  if (is_dir) *is_dir = (a & FILE_ATTRIBUTE_DIRECTORY) != 0;
  return true;
}

static std::vector<std::string> PathExts() {
  std::vector<std::string> v;
  const char* pe = getenv("PATHEXT");
  std::string s = pe ? pe : ".COM;.EXE;.BAT;.CMD";
  size_t start = 0;
  while (start < s.size()) {
    size_t semi = s.find(';', start);
    if (semi == std::string::npos) semi = s.size();
    if (semi > start) v.push_back(s.substr(start, semi - start));
    start = semi + 1;
  }
  return v;
}

static bool HasExt(const std::string& p) {
  size_t slash = p.find_last_of("/\\");
  size_t dot = p.find_last_of('.');
  return dot != std::string::npos && (slash == std::string::npos || dot > slash);
}

// Resolve a program path: exact file, else try PATHEXT suffixes.
static bool ResolveProgram(const std::string& path, std::string* out) {
  std::string w = ToWinPath(path.c_str());
  bool dir = false;
  if (FileExistsW(W(w), &dir) && !dir) {
    *out = w;
    return true;
  }
  if (!HasExt(w)) {
    for (auto& e : PathExts()) {
      std::string c = w + e;
      if (FileExistsW(W(c), &dir) && !dir) {
        *out = c;
        return true;
      }
    }
  }
  return false;
}

// Search $PATH (POSIX form, as seen by the shell) for a bare name.
static bool SearchPath(const std::string& name, std::string* out) {
  if (name.find('/') != std::string::npos ||
      name.find('\\') != std::string::npos) {
    return ResolveProgram(name, out);
  }
  const char* p = getenv("PATH");
  std::string list = p ? PathListToPosix(PathListToWin(p)) : "";
  size_t start = 0;
  while (start <= list.size()) {
    size_t c = list.find(':', start);
    if (c == std::string::npos) c = list.size();
    std::string dir = list.substr(start, c - start);
    if (!dir.empty() && ResolveProgram(dir + "/" + name, out)) return true;
    start = c + 1;
  }
  return false;
}

extern "C" int oils_access(const char* path, int mode) {
  std::string w = ToWinPath(path);
  std::wstring ww = W(w);
  DWORD a = GetFileAttributesW(ww.c_str());
  if (a == INVALID_FILE_ATTRIBUTES) {
    if ((mode & X_OK) && !HasExt(w)) {
      std::string r;
      if (ResolveProgram(w, &r)) return 0;
    }
    errno = ENOENT;
    return -1;
  }
  if ((mode & W_OK) && (a & FILE_ATTRIBUTE_READONLY) &&
      !(a & FILE_ATTRIBUTE_DIRECTORY)) {
    errno = EACCES;
    return -1;
  }
  if ((mode & X_OK) && !(a & FILE_ATTRIBUTE_DIRECTORY)) {
    // Executable if it has a PATHEXT suffix or starts with "#!" / "MZ".
    std::string upper = w;
    for (auto& ch : upper) ch = (char)toupper((unsigned char)ch);
    for (auto& e : PathExts()) {
      std::string ue = e;
      for (auto& ch : ue) ch = (char)toupper((unsigned char)ch);
      if (upper.size() >= ue.size() &&
          upper.compare(upper.size() - ue.size(), ue.size(), ue) == 0) {
        return 0;
      }
    }
    FILE* f = _wfopen(ww.c_str(), L"rb");
    if (f) {
      char b[2] = {0, 0};
      size_t n = fread(b, 1, 2, f);
      fclose(f);
      if (n == 2 && ((b[0] == '#' && b[1] == '!') ||
                     (b[0] == 'M' && b[1] == 'Z'))) {
        return 0;
      }
    }
    errno = EACCES;
    return -1;
  }
  return 0;
}

extern "C" int oils_open(const char* path, int flags, ...) {
  int perms = 0666;
  if (flags & O_CREAT) {
    va_list ap;
    va_start(ap, flags);
    perms = va_arg(ap, int);
    va_end(ap);
  }
  std::wstring w = W(ToWinPath(path));
  int pm = 0;
  if (perms & 0400) pm |= _S_IREAD;
  if (perms & 0200) pm |= _S_IWRITE;
  if (pm == 0) pm = _S_IREAD | _S_IWRITE;
  int fd = -1;
  errno_t e = _wsopen_s(&fd, w.c_str(), flags | _O_BINARY | _O_NOINHERIT,
                        _SH_DENYNO, pm);
  if (e != 0) {
    // Opening a directory read-only: emulate with NUL so callers can stat
    bool dir = false;
    if (FileExistsW(w, &dir) && dir) errno = EISDIR;
    return -1;
  }
  return fd;
}

extern "C" int oils_stat(const char* path, struct stat* st) {
  std::wstring w = W(ToWinPath(path));
  // _wstat64i32 rejects trailing slashes on non-root dirs
  while (w.size() > 3 && (w.back() == L'/' || w.back() == L'\\')) w.pop_back();
  struct _stat64i32 s;
  if (_wstat64i32(w.c_str(), &s) != 0) {
    // Like Cygwin: "foo" resolves to "foo.exe" (PATHEXT) so that $PATH
    // lookup, `type` and `command -v` work with extension-less names.
    std::string r;
    std::string wp = ToWinPath(path);
    if (HasExt(wp) || !ResolveProgram(wp, &r)) return -1;
    if (_wstat64i32(W(r).c_str(), &s) != 0) return -1;
  }
  memcpy(st, &s, sizeof(s));
  return 0;
}

extern "C" int oils_chdir(const char* path) {
  std::wstring w = W(ToWinPath(path));
  if (!SetCurrentDirectoryW(w.c_str())) {
    errno = ErrnoFromWin(GetLastError());
    return -1;
  }
  return 0;
}

extern "C" char* oils_getcwd(char* buf, size_t n) {
  wchar_t w[32768];
  DWORD m = GetCurrentDirectoryW(32768, w);
  if (m == 0) {
    errno = ENOENT;
    return nullptr;
  }
  std::string s = U(w, (int)m);
  std::replace(s.begin(), s.end(), '\\', '/');
  if (s.size() + 1 > n) {
    errno = ERANGE;
    return nullptr;
  }
  memcpy(buf, s.c_str(), s.size() + 1);
  return buf;
}

extern "C" int oils_unlink(const char* path) {
  std::wstring w = W(ToWinPath(path));
  if (!DeleteFileW(w.c_str())) {
    errno = ErrnoFromWin(GetLastError());
    return -1;
  }
  return 0;
}

extern "C" int oils_isatty(int fd) {
  intptr_t h = _get_osfhandle(fd);
  if (h == -1) return 0;
  DWORD mode;
  return GetConsoleMode((HANDLE)h, &mode) ? 1 : 0;
}

extern "C" char* realpath(const char* path, char* resolved) {
  std::wstring w = W(ToWinPath(path));
  wchar_t buf[32768];
  DWORD n = GetFullPathNameW(w.c_str(), 32768, buf, nullptr);
  if (n == 0 || !FileExistsW(buf)) {
    errno = ENOENT;
    return nullptr;
  }
  std::string s = U(buf, (int)n);
  std::replace(s.begin(), s.end(), '\\', '/');
  if (!resolved) return _strdup(s.c_str());
  strncpy(resolved, s.c_str(), PATH_MAX - 1);
  resolved[PATH_MAX - 1] = 0;
  return resolved;
}

// --------------------------------------------------------------------------
// environ (UTF-8 mirror of the process environment)
// --------------------------------------------------------------------------

char** environ = nullptr;
static std::vector<std::string>* gEnvStore;

static void RebuildEnviron() {
  static std::vector<char*>* ptrs = new std::vector<char*>();
  ptrs->clear();
  for (auto& s : *gEnvStore) ptrs->push_back(const_cast<char*>(s.c_str()));
  ptrs->push_back(nullptr);
  environ = ptrs->data();
}

static void InitEnviron() {
  gEnvStore = new std::vector<std::string>();
  wchar_t* block = GetEnvironmentStringsW();
  for (wchar_t* p = block; *p; p += wcslen(p) + 1) {
    if (*p == L'=') continue;  // "=C:=C:\..." drive cwd entries
    std::string kv = U(p);
    size_t eq = kv.find('=');
    if (eq == std::string::npos) continue;
    std::string k = kv.substr(0, eq);
    std::string v = kv.substr(eq + 1);
    std::string uk = k;
    for (auto& ch : uk) ch = (char)toupper((unsigned char)ch);
    if (uk == "PATH") {
      k = "PATH";
      v = PathListToPosix(v);
    }
    gEnvStore->push_back(k + "=" + v);
  }
  FreeEnvironmentStringsW(block);
  auto has = [](const char* name) {
    size_t n = strlen(name);
    for (auto& s : *gEnvStore)
      if (s.compare(0, n, name) == 0 && s[n] == '=') return true;
    return false;
  };
  if (!has("HOME")) {
    const char* up = getenv("USERPROFILE");
    if (up) gEnvStore->push_back(std::string("HOME=") + ToPosixPath(up));
  }
  RebuildEnviron();
}

extern "C" int setenv(const char* name, const char* value, int overwrite) {
  std::string k = name;
  std::string v = value;
  size_t n = k.size();
  for (auto& s : *gEnvStore) {
    if (s.compare(0, n, k) == 0 && s[n] == '=') {
      if (!overwrite) return 0;
      s = k + "=" + v;
      RebuildEnviron();
      return 0;
    }
  }
  gEnvStore->push_back(k + "=" + v);
  RebuildEnviron();
  return 0;
}

extern "C" int unsetenv(const char* name) {
  size_t n = strlen(name);
  gEnvStore->erase(std::remove_if(gEnvStore->begin(), gEnvStore->end(),
                                  [&](const std::string& s) {
                                    return s.compare(0, n, name) == 0 &&
                                           s[n] == '=';
                                  }),
                   gEnvStore->end());
  RebuildEnviron();
  return 0;
}

// --------------------------------------------------------------------------
// Startup
// --------------------------------------------------------------------------

static HANDLE gJob = nullptr;
static std::string gSelfExe;

static void InitWin32() {
  _set_fmode(_O_BINARY);
  _setmode(0, _O_BINARY);
  _setmode(1, _O_BINARY);
  _setmode(2, _O_BINARY);
  SetConsoleOutputCP(CP_UTF8);
  SetConsoleCP(CP_UTF8);
  // Enable VT sequences for prompts / colors when attached to a console.
  HANDLE out = GetStdHandle(STD_OUTPUT_HANDLE);
  DWORD mode;
  if (GetConsoleMode(out, &mode)) {
    SetConsoleMode(out, mode | ENABLE_VIRTUAL_TERMINAL_PROCESSING);
  }
  // POSIX semantics: bad fds give EBADF, not a fast-fail crash.
  _set_invalid_parameter_handler([](const wchar_t* expr, const wchar_t* fn,
                                    const wchar_t*, unsigned, uintptr_t) {
    if (getenv("OILS_WIN_TRACE")) {
      fprintf(stderr, "[win] CRT invalid parameter %ls in %ls\n",
              expr ? expr : L"?", fn ? fn : L"?");
    }
  });
  _CrtSetReportMode(_CRT_ASSERT, 0);
  if (getenv("OILS_WIN_TRACE")) {
    std::set_terminate([] {
      fprintf(stderr, "[win] std::terminate\n");
      abort();
    });
  }
  wchar_t self[32768];
  DWORD n = GetModuleFileNameW(nullptr, self, 32768);
  gSelfExe = U(self, (int)n);
  InitEnviron();

  gJob = CreateJobObjectW(nullptr, nullptr);
  if (gJob) {
    JOBOBJECT_EXTENDED_LIMIT_INFORMATION info = {};
    info.BasicLimitInformation.LimitFlags =
        JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE | JOB_OBJECT_LIMIT_BREAKAWAY_OK;
    SetInformationJobObject(gJob, JobObjectExtendedLimitInformation, &info,
                            sizeof(info));
  }
}

namespace {
struct Win32Init {
  Win32Init() {
    InitWin32();
  }
};
// init_seg(lib) would be stricter; a normal static is enough since the
// generated code reads environ only from main().
Win32Init gWin32Init;
}  // namespace

// --------------------------------------------------------------------------
// Process table
// --------------------------------------------------------------------------

struct Child {
  HANDLE h;      // nullptr for in-process (already finished)
  int status;    // POSIX-encoded wait status when finished
  bool done;
};
static std::map<int, Child>* gChildren = new std::map<int, Child>();
static int gNextFakePid = (1 << 30) + 1;

extern "C" int oils_register_finished(int exit_code) {
  int pid = gNextFakePid;
  gNextFakePid += 2;
  (*gChildren)[pid] = Child{nullptr, (exit_code & 0xff) << 8, true};
  return pid;
}

static int EncodeExit(DWORD code) {
  // Windows exit codes are 32-bit; NTSTATUS crash codes map to "signals".
  if (code >= 0xC0000000u) {
    if (code == 0xC000013Au) return SIGINT;  // STATUS_CONTROL_C_EXIT
    return SIGSEGV;
  }
  return (int)((code & 0xff) << 8);
}

static int Reap(std::map<int, Child>::iterator it, int* status) {
  int pid = it->first;
  if (status) *status = it->second.status;
  if (it->second.h) CloseHandle(it->second.h);
  gChildren->erase(it);
  return pid;
}

extern "C" pid_t waitpid(pid_t pid, int* status, int options) {
  for (;;) {
    // Finished entries first.
    for (auto it = gChildren->begin(); it != gChildren->end(); ++it) {
      if ((pid == -1 || pid == it->first) && it->second.done) {
        return Reap(it, status);
      }
    }
    std::vector<HANDLE> hs;
    std::vector<int> pids;
    for (auto& kv : *gChildren) {
      if ((pid == -1 || pid == kv.first) && !kv.second.done && kv.second.h) {
        hs.push_back(kv.second.h);
        pids.push_back(kv.first);
      }
    }
    if (hs.empty()) {
      errno = ECHILD;
      return -1;
    }
    if (hs.size() > MAXIMUM_WAIT_OBJECTS) hs.resize(MAXIMUM_WAIT_OBJECTS);
    DWORD timeout = (options & WNOHANG) ? 0 : INFINITE;
    DWORD r = WaitForMultipleObjects((DWORD)hs.size(), hs.data(), FALSE,
                                     timeout);
    if (r == WAIT_TIMEOUT) return 0;
    if (r >= WAIT_OBJECT_0 && r < WAIT_OBJECT_0 + hs.size()) {
      int p = pids[r - WAIT_OBJECT_0];
      auto it = gChildren->find(p);
      DWORD code = 0;
      GetExitCodeProcess(it->second.h, &code);
      it->second.status = EncodeExit(code);
      it->second.done = true;
      return Reap(it, status);
    }
    errno = EINTR;
    return -1;
  }
}

// --------------------------------------------------------------------------
// Spawning
// --------------------------------------------------------------------------

// Quote one argument per the MSVCRT / CommandLineToArgvW rules.
static void AppendQuoted(std::wstring& cmd, const std::wstring& arg) {
  if (!arg.empty() && arg.find_first_of(L" \t\n\v\"") == std::wstring::npos) {
    cmd += arg;
    return;
  }
  cmd += L'"';
  for (size_t i = 0;; ++i) {
    size_t nbs = 0;
    while (i < arg.size() && arg[i] == L'\\') {
      ++i;
      ++nbs;
    }
    if (i == arg.size()) {
      cmd.append(nbs * 2, L'\\');
      break;
    } else if (arg[i] == L'"') {
      cmd.append(nbs * 2 + 1, L'\\');
      cmd += L'"';
    } else {
      cmd.append(nbs, L'\\');
      cmd += arg[i];
    }
  }
  cmd += L'"';
}

static bool IEndsWith(const std::string& s, const char* suf) {
  size_t n = strlen(suf);
  if (s.size() < n) return false;
  return _stricmp(s.c_str() + s.size() - n, suf) == 0;
}

// If `path` is a "#!" script, rewrite argv to run its interpreter.  sh / bash
// / osh shebangs run this executable.
static bool RewriteShebang(const std::string& path,
                           std::vector<std::string>* argv) {
  FILE* f = _wfopen(W(path).c_str(), L"rb");
  if (!f) return false;
  char line[512] = {0};
  if (!fgets(line, sizeof(line), f)) {
    fclose(f);
    return false;
  }
  fclose(f);
  if (line[0] != '#' || line[1] != '!') return false;
  std::string l(line + 2);
  while (!l.empty() && (l.back() == '\n' || l.back() == '\r' || l.back() == ' '))
    l.pop_back();
  size_t b = l.find_first_not_of(" \t");
  if (b == std::string::npos) return false;
  l = l.substr(b);
  std::vector<std::string> parts;
  size_t s = 0;
  while (s < l.size()) {
    size_t e = l.find_first_of(" \t", s);
    if (e == std::string::npos) e = l.size();
    if (e > s) parts.push_back(l.substr(s, e - s));
    s = e + 1;
  }
  if (parts.empty()) return false;
  std::string interp = parts[0];
  size_t slash = interp.find_last_of('/');
  std::string base = slash == std::string::npos ? interp : interp.substr(slash + 1);
  parts.erase(parts.begin());
  if (base == "env" && !parts.empty()) {
    base = parts[0];
    parts.erase(parts.begin());
  }
  std::vector<std::string> nv;
  if (base == "sh" || base == "bash" || base == "osh" || base == "oils-for-unix") {
    nv.push_back(gSelfExe);
  } else {
    std::string r;
    if (!SearchPath(base, &r)) return false;
    nv.push_back(r);
  }
  for (auto& p : parts) nv.push_back(p);
  nv.push_back(path);
  for (size_t i = 1; i < argv->size(); ++i) nv.push_back((*argv)[i]);
  *argv = nv;
  return true;
}

static std::wstring BuildEnvBlock(char* const envp[]) {
  std::vector<std::wstring> vars;
  for (char* const* e = envp; e && *e; ++e) {
    std::string kv = *e;
    size_t eq = kv.find('=');
    if (eq != std::string::npos && kv.compare(0, eq, "PATH") == 0) {
      kv = "PATH=" + PathListToWin(kv.substr(eq + 1));
    }
    vars.push_back(W(kv));
  }
  // Keep SystemRoot etc. if the shell dropped them: Windows programs break
  // without SYSTEMROOT.
  std::sort(vars.begin(), vars.end(), [](const std::wstring& a,
                                          const std::wstring& b) {
    return _wcsicmp(a.c_str(), b.c_str()) < 0;
  });
  std::wstring block;
  for (auto& v : vars) {
    block += v;
    block += L'\0';
  }
  block += L'\0';
  return block;
}

// Returns pid > 0, or -1 with errno set.  fds[0..2] are CRT fds for the
// child's stdin/stdout/stderr.
extern "C" int oils_spawn(const char* argv0_path, char* const argv[],
                          char* const envp[], const int fds[3]) {
  std::vector<std::string> args;
  for (char* const* a = argv; *a; ++a) args.push_back(*a);
  if (args.empty()) args.push_back(argv0_path);

  std::string prog;
  if (!ResolveProgram(argv0_path, &prog) && !SearchPath(argv0_path, &prog)) {
    errno = ENOENT;
    return -1;
  }
  bool is_batch = IEndsWith(prog, ".bat") || IEndsWith(prog, ".cmd");
  if (!is_batch && !IEndsWith(prog, ".exe") && !IEndsWith(prog, ".com")) {
    if (!RewriteShebang(prog, &args)) {
      errno = ENOEXEC;
      return -1;
    }
    prog = args[0];
  } else {
    args[0] = prog;  // argv[0] as Windows path
  }

  std::wstring cmd;
  std::wstring app;
  if (is_batch) {
    // cmd.exe /d /s /c ""prog" args"   (BatBadBut: escape-hostile chars are
    // passed through cmd's own parser; documented limitation)
    wchar_t comspec[MAX_PATH];
    if (!GetEnvironmentVariableW(L"ComSpec", comspec, MAX_PATH))
      wcscpy(comspec, L"C:\\Windows\\System32\\cmd.exe");
    app = comspec;
    cmd = L"cmd.exe /d /s /c \"";
    std::string p = prog;
    std::replace(p.begin(), p.end(), '/', '\\');
    AppendQuoted(cmd, W(p));
    for (size_t i = 1; i < args.size(); ++i) {
      cmd += L' ';
      AppendQuoted(cmd, W(args[i]));
    }
    cmd += L"\"";
  } else {
    std::string p = prog;
    std::replace(p.begin(), p.end(), '/', '\\');
    app = W(p);
    for (size_t i = 0; i < args.size(); ++i) {
      if (i) cmd += L' ';
      std::string a = args[i];
      if (i == 0) std::replace(a.begin(), a.end(), '/', '\\');
      AppendQuoted(cmd, W(a));
    }
  }

  // Inheritable duplicates of exactly the three std handles.
  HANDLE inh[3] = {nullptr, nullptr, nullptr};
  HANDLE self = GetCurrentProcess();
  for (int i = 0; i < 3; ++i) {
    intptr_t h = _get_osfhandle(fds[i]);
    if (h == -1 || h == -2) {
      HANDLE nul = CreateFileW(L"NUL", GENERIC_READ | GENERIC_WRITE,
                               FILE_SHARE_READ | FILE_SHARE_WRITE, nullptr,
                               OPEN_EXISTING, 0, nullptr);
      h = (intptr_t)nul;
      DuplicateHandle(self, nul, self, &inh[i], 0, TRUE,
                      DUPLICATE_SAME_ACCESS | DUPLICATE_CLOSE_SOURCE);
    } else {
      DuplicateHandle(self, (HANDLE)h, self, &inh[i], 0, TRUE,
                      DUPLICATE_SAME_ACCESS);
    }
  }

  SIZE_T attr_size = 0;
  InitializeProcThreadAttributeList(nullptr, 1, 0, &attr_size);
  std::vector<char> attr_buf(attr_size);
  auto* attrs = reinterpret_cast<LPPROC_THREAD_ATTRIBUTE_LIST>(attr_buf.data());
  InitializeProcThreadAttributeList(attrs, 1, 0, &attr_size);
  UpdateProcThreadAttribute(attrs, 0, PROC_THREAD_ATTRIBUTE_HANDLE_LIST, inh,
                            sizeof(inh), nullptr, nullptr);

  STARTUPINFOEXW si = {};
  si.StartupInfo.cb = sizeof(si);
  si.StartupInfo.dwFlags = STARTF_USESTDHANDLES;
  si.StartupInfo.hStdInput = inh[0];
  si.StartupInfo.hStdOutput = inh[1];
  si.StartupInfo.hStdError = inh[2];
  si.lpAttributeList = attrs;

  std::wstring env = BuildEnvBlock(envp);
  PROCESS_INFORMATION pi = {};
  std::vector<wchar_t> cmdbuf(cmd.begin(), cmd.end());
  cmdbuf.push_back(0);
  BOOL ok = CreateProcessW(app.c_str(), cmdbuf.data(), nullptr, nullptr, TRUE,
                           CREATE_UNICODE_ENVIRONMENT |
                               EXTENDED_STARTUPINFO_PRESENT | CREATE_SUSPENDED,
                           (void*)env.c_str(), nullptr, &si.StartupInfo, &pi);
  DWORD err = GetLastError();
  DeleteProcThreadAttributeList(attrs);
  for (int i = 0; i < 3; ++i) CloseHandle(inh[i]);
  if (!ok) {
    errno = ErrnoFromWin(err);
    return -1;
  }
  if (gJob) AssignProcessToJobObject(gJob, pi.hProcess);
  ResumeThread(pi.hThread);
  CloseHandle(pi.hThread);
  int pid = (int)pi.dwProcessId;
  (*gChildren)[pid] = Child{pi.hProcess, 0, false};
  return pid;
}

// --------------------------------------------------------------------------
// _exit / execve
// --------------------------------------------------------------------------

int gOilsInProcDepth = 0;

extern "C" void oils_exit_hook(int status) {
  if (getenv("OILS_WIN_TRACE"))
    fprintf(stderr, "[win] exit_hook %d depth=%d\n", status, gOilsInProcDepth);
  if (gOilsInProcDepth > 0) {
    throw OilsInProcExit{status};
  }
  fflush(nullptr);
  _exit(status);
}

// No exec on Windows: spawn, wait, then "exit" with the child's status.
extern "C" int oils_execve(const char* path, char* const argv[],
                           char* const envp[]) {
  fflush(nullptr);
  int fds[3] = {0, 1, 2};
  int pid = oils_spawn(path, argv, envp, fds);
  if (pid < 0) return -1;
  if (gOilsInProcDepth > 0) {
    throw OilsInProcExec{pid};  // don't wait: the pipeline stays concurrent
  }
  int status = 0;
  waitpid(pid, &status, 0);
  int code = WIFEXITED(status) ? WEXITSTATUS(status) : 128 + WTERMSIG(status);
  oils_exit_hook(code);
  return 0;
}

// --------------------------------------------------------------------------
// pipes, fds
// --------------------------------------------------------------------------

// Large buffer: in-process writers (builtins/functions in a pipeline,
// $(...)) run to completion before the reader starts.
static const unsigned kPipeBuffer = 16u << 20;

extern "C" int pipe(int fds[2]) {
  return _pipe(fds, kPipeBuffer, _O_BINARY | _O_NOINHERIT);
}

extern "C" int fcntl(int fd, int cmd, ...) {
  va_list ap;
  va_start(ap, cmd);
  int arg = va_arg(ap, int);
  va_end(ap);
  if (_get_osfhandle(fd) == -1) {
    errno = EBADF;
    return -1;
  }
  switch (cmd) {
  case F_DUPFD: {
    for (int t = arg < 0 ? 0 : arg; t < 8192; ++t) {
      if (_get_osfhandle(t) == -1) {
        errno = 0;
        if (_dup2(fd, t) == 0) return t;
        return -1;
      }
    }
    errno = EMFILE;
    return -1;
  }
  case F_GETFD:
    return FD_CLOEXEC;  // CRT fds from oils_open/pipe are non-inheritable
  case F_SETFD:
  case F_SETFL:
    return 0;
  case F_GETFL:
    return 0;
  }
  errno = EINVAL;
  return -1;
}

// --------------------------------------------------------------------------
// identity, misc
// --------------------------------------------------------------------------

extern "C" pid_t getppid(void) {
  return 1;  // [stub]
}
extern "C" uid_t getuid(void) {
  return 1000;
}
extern "C" uid_t geteuid(void) {
  return 1000;
}
extern "C" gid_t getegid(void) {
  return 1000;
}
extern "C" int setpgid(pid_t, pid_t) {
  return 0;
}
extern "C" pid_t getpgid(pid_t pid) {
  return pid == 0 ? _getpid() : pid;
}
extern "C" int tcsetpgrp(int, pid_t) {
  return 0;
}
extern "C" pid_t tcgetpgrp(int) {
  return _getpid();
}

extern "C" int gethostname(char* name, size_t len) {
  wchar_t buf[256];
  DWORD n = 256;
  if (!GetComputerNameExW(ComputerNameDnsHostname, buf, &n)) return -1;
  std::string s = U(buf, (int)n);
  strncpy(name, s.c_str(), len);
  if (len) name[len - 1] = 0;
  return 0;
}

extern "C" long sysconf(int name) {
  return name == _SC_CLK_TCK ? 100 : -1;
}

static struct passwd gPw;
static std::string gPwName, gPwDir;
static struct passwd* FillPw() {
  wchar_t buf[256];
  DWORD n = 256;
  gPwName = GetUserNameW(buf, &n) ? U(buf) : std::string("user");
  const char* up = getenv("USERPROFILE");
  gPwDir = up ? ToPosixPath(up) : std::string("/");
  gPw.pw_name = const_cast<char*>(gPwName.c_str());
  gPw.pw_passwd = const_cast<char*>("x");
  gPw.pw_uid = 1000;
  gPw.pw_gid = 1000;
  gPw.pw_gecos = gPw.pw_name;
  gPw.pw_dir = const_cast<char*>(gPwDir.c_str());
  gPw.pw_shell = const_cast<char*>(gSelfExe.c_str());
  return &gPw;
}
extern "C" struct passwd* getpwuid(uid_t) {
  return FillPw();
}
extern "C" struct passwd* getpwnam(const char* name) {
  struct passwd* p = FillPw();
  return _stricmp(name, p->pw_name) == 0 ? p : nullptr;
}

extern "C" char* nl_langinfo(int) {
  return const_cast<char*>("UTF-8");
}

extern "C" int wcswidth(const wchar_t* s, size_t n) {
  int w = 0;
  for (size_t i = 0; i < n && s[i]; ++i) {
    wchar_t c = s[i];
    if (c < 0x20 || (c >= 0x7f && c < 0xa0)) return -1;
    if (c >= 0xDC00 && c <= 0xDFFF) continue;  // low surrogate
    // East Asian wide ranges (rough)
    if ((c >= 0x1100 && c <= 0x115F) || (c >= 0x2E80 && c <= 0xA4CF) ||
        (c >= 0xAC00 && c <= 0xD7A3) || (c >= 0xF900 && c <= 0xFAFF) ||
        (c >= 0xFF00 && c <= 0xFF60) || (c >= 0xFFE0 && c <= 0xFFE6)) {
      w += 2;
    } else if (c >= 0xD800 && c <= 0xDBFF) {
      w += 2;  // astral: mostly emoji
    } else {
      w += 1;
    }
  }
  return w;
}

extern "C" int uname(struct utsname* u) {
  memset(u, 0, sizeof(*u));
  strcpy(u->sysname, "Windows_NT");
  gethostname(u->nodename, sizeof(u->nodename));
  typedef LONG(WINAPI * RtlGetVersionFn)(OSVERSIONINFOW*);
  OSVERSIONINFOW vi = {sizeof(vi)};
  auto fn = (RtlGetVersionFn)(void*)GetProcAddress(
      GetModuleHandleW(L"ntdll.dll"), "RtlGetVersion");
  if (fn) fn(&vi);
  snprintf(u->release, sizeof(u->release), "%lu.%lu.%lu", vi.dwMajorVersion,
           vi.dwMinorVersion, vi.dwBuildNumber);
  strcpy(u->version, "native");
  strcpy(u->machine, "x86_64");
  return 0;
}

extern "C" int gettimeofday(struct timeval* tv, void*) {
  FILETIME ft;
  GetSystemTimePreciseAsFileTime(&ft);
  unsigned long long t =
      ((unsigned long long)ft.dwHighDateTime << 32) | ft.dwLowDateTime;
  t -= 116444736000000000ULL;  // 1601 -> 1970
  tv->tv_sec = (long long)(t / 10000000ULL);
  tv->tv_usec = (long)((t % 10000000ULL) / 10);
  return 0;
}

extern "C" int nanosleep(const struct timespec* req, struct timespec* rem) {
  DWORD ms = (DWORD)(req->tv_sec * 1000 + req->tv_nsec / 1000000);
  Sleep(ms);
  if (rem) {
    rem->tv_sec = 0;
    rem->tv_nsec = 0;
  }
  return 0;
}

static clock_t FtTicks(FILETIME ft) {
  unsigned long long t =
      ((unsigned long long)ft.dwHighDateTime << 32) | ft.dwLowDateTime;
  return (clock_t)(t / 100000ULL);  // 100ns -> 1/100 s
}

extern "C" clock_t times(struct tms* t) {
  FILETIME c, e, k, u;
  GetProcessTimes(GetCurrentProcess(), &c, &e, &k, &u);
  t->tms_utime = FtTicks(u);
  t->tms_stime = FtTicks(k);
  t->tms_cutime = 0;
  t->tms_cstime = 0;
  if (gJob) {
    JOBOBJECT_BASIC_ACCOUNTING_INFORMATION ai;
    if (QueryInformationJobObject(gJob, JobObjectBasicAccountingInformation,
                                  &ai, sizeof(ai), nullptr)) {
      t->tms_cutime = (clock_t)(ai.TotalUserTime.QuadPart / 100000);
      t->tms_cstime = (clock_t)(ai.TotalKernelTime.QuadPart / 100000);
    }
  }
  return (clock_t)(GetTickCount64() / 10);
}

extern "C" int getrusage(int who, struct rusage* r) {
  memset(r, 0, sizeof(*r));
  unsigned long long u = 0, k = 0;
  if (who == RUSAGE_SELF) {
    FILETIME c, e, kf, uf;
    GetProcessTimes(GetCurrentProcess(), &c, &e, &kf, &uf);
    u = ((unsigned long long)uf.dwHighDateTime << 32) | uf.dwLowDateTime;
    k = ((unsigned long long)kf.dwHighDateTime << 32) | kf.dwLowDateTime;
  } else if (gJob) {
    JOBOBJECT_BASIC_ACCOUNTING_INFORMATION ai;
    if (QueryInformationJobObject(gJob, JobObjectBasicAccountingInformation,
                                  &ai, sizeof(ai), nullptr)) {
      u = ai.TotalUserTime.QuadPart;
      k = ai.TotalKernelTime.QuadPart;
    }
  }
  r->ru_utime.tv_sec = (long long)(u / 10000000ULL);
  r->ru_utime.tv_usec = (long)((u % 10000000ULL) / 10);
  r->ru_stime.tv_sec = (long long)(k / 10000000ULL);
  r->ru_stime.tv_usec = (long)((k % 10000000ULL) / 10);
  return 0;
}

extern "C" int getrlimit(int res, struct rlimit* r) {
  r->rlim_cur = r->rlim_max = RLIM_INFINITY;
  if (res == RLIMIT_NOFILE) r->rlim_cur = r->rlim_max = 8192;
  return 0;
}
extern "C" int setrlimit(int, const struct rlimit*) {
  return 0;  // [stub] could map to job object limits
}

extern "C" int ioctl(int fd, unsigned long req, ...) {
  if (req != TIOCGWINSZ) {
    errno = EINVAL;
    return -1;
  }
  va_list ap;
  va_start(ap, req);
  struct winsize* w = va_arg(ap, struct winsize*);
  va_end(ap);
  CONSOLE_SCREEN_BUFFER_INFO info;
  HANDLE h = (HANDLE)_get_osfhandle(fd);
  if (!GetConsoleScreenBufferInfo(h, &info)) {
    errno = ENOTTY;
    return -1;
  }
  w->ws_col = (unsigned short)(info.srWindow.Right - info.srWindow.Left + 1);
  w->ws_row = (unsigned short)(info.srWindow.Bottom - info.srWindow.Top + 1);
  w->ws_xpixel = w->ws_ypixel = 0;
  return 0;
}

extern "C" int tcgetattr(int fd, struct termios* t) {
  memset(t, 0, sizeof(*t));
  DWORD mode;
  if (!GetConsoleMode((HANDLE)_get_osfhandle(fd), &mode)) {
    errno = ENOTTY;
    return -1;
  }
  if (mode & ENABLE_LINE_INPUT) t->c_lflag |= ICANON;
  if (mode & ENABLE_ECHO_INPUT) t->c_lflag |= ECHO;
  return 0;
}

extern "C" int tcsetattr(int fd, int, const struct termios* t) {
  HANDLE h = (HANDLE)_get_osfhandle(fd);
  DWORD mode;
  if (!GetConsoleMode(h, &mode)) {
    errno = ENOTTY;
    return -1;
  }
  mode &= ~(ENABLE_LINE_INPUT | ENABLE_ECHO_INPUT);
  if (t->c_lflag & ICANON) mode |= ENABLE_LINE_INPUT;
  if (t->c_lflag & ECHO) mode |= ENABLE_ECHO_INPUT;
  SetConsoleMode(h, mode);
  return 0;
}

// select(): readability of fds only (used by `read -t` and InputAvailable).
extern "C" int select(int, fd_set* r, fd_set* w, fd_set* e, struct timeval* t) {
  DWORD timeout = t ? (DWORD)(t->tv_sec * 1000 + t->tv_usec / 1000) : INFINITE;
  if (!r) {
    Sleep(timeout == INFINITE ? 0 : timeout);
    return 0;
  }
  ULONGLONG start = GetTickCount64();
  for (;;) {
    int ready = 0;
    fd_set out;
    FD_ZERO(&out);
    for (int fd = 0; fd < 64; ++fd) {
      if (!FD_ISSET(fd, r)) continue;
      HANDLE h = (HANDLE)_get_osfhandle(fd);
      DWORD type = GetFileType(h);
      bool ok = false;
      if (type == FILE_TYPE_PIPE) {
        DWORD avail = 0;
        if (!PeekNamedPipe(h, nullptr, 0, nullptr, &avail, nullptr) || avail)
          ok = true;  // data or EOF/broken
      } else if (type == FILE_TYPE_CHAR) {
        DWORD mode;
        if (GetConsoleMode(h, &mode)) {
          ok = WaitForSingleObject(h, 0) == WAIT_OBJECT_0;
        } else {
          ok = true;
        }
      } else {
        ok = true;  // regular files are always readable
      }
      if (ok) {
        FD_SET(fd, &out);
        ++ready;
      }
    }
    if (ready || (timeout != INFINITE && GetTickCount64() - start >= timeout)) {
      *r = out;
      if (w) FD_ZERO(w);
      if (e) FD_ZERO(e);
      return ready;
    }
    Sleep(5);
  }
}

// --------------------------------------------------------------------------
// signals
// --------------------------------------------------------------------------

typedef void (*SigHandler)(int);
static SigHandler gHandlers[NSIG];

static BOOL WINAPI CtrlHandler(DWORD type) {
  int sig = (type == CTRL_C_EVENT) ? SIGINT
            : (type == CTRL_BREAK_EVENT) ? SIGINT
            : SIGHUP;
  SigHandler h = gHandlers[sig];
  if (h && h != SIG_DFL && h != SIG_IGN) {
    h(sig);
    return TRUE;
  }
  if (h == SIG_IGN) return TRUE;
  return FALSE;
}

extern "C" int sigaction(int sig, const struct sigaction* act,
                         struct sigaction* old) {
  if (sig <= 0 || sig >= NSIG) {
    errno = EINVAL;
    return -1;
  }
  if (old) {
    old->sa_handler = gHandlers[sig];
    old->sa_mask = 0;
    old->sa_flags = 0;
  }
  if (act) {
    static bool installed = false;
    gHandlers[sig] = act->sa_handler;
    if (!installed && (sig == SIGINT || sig == SIGHUP)) {
      SetConsoleCtrlHandler(CtrlHandler, TRUE);
      installed = true;
    }
    if (sig == SIGTERM || sig == SIGABRT) signal(sig, act->sa_handler);
  }
  return 0;
}
extern "C" int sigemptyset(sigset_t* s) {
  *s = 0;
  return 0;
}
extern "C" int sigaddset(sigset_t* s, int sig) {
  *s |= 1u << sig;
  return 0;
}
extern "C" int sigprocmask(int, const sigset_t*, sigset_t* old) {
  if (old) *old = 0;
  return 0;
}

extern "C" int kill(pid_t pid, int sig) {
  if (pid == _getpid() || pid == 0) {
    SigHandler h = (sig > 0 && sig < NSIG) ? gHandlers[sig] : nullptr;
    if (sig == 0) return 0;
    if (h && h != SIG_DFL && h != SIG_IGN) {
      h(sig);
      return 0;
    }
    if (h == SIG_IGN) return 0;
    fflush(nullptr);
    ExitProcess(128 + sig);
  }
  auto it = gChildren->find(pid);
  HANDLE h = nullptr;
  bool close_it = false;
  if (it != gChildren->end()) {
    if (it->second.done || !it->second.h) return 0;
    h = it->second.h;
  } else {
    h = OpenProcess(PROCESS_TERMINATE | SYNCHRONIZE, FALSE, (DWORD)pid);
    if (!h) {
      errno = ESRCH;
      return -1;
    }
    close_it = true;
  }
  if (sig != 0 && sig != SIGCONT) TerminateProcess(h, 128 + sig);
  if (close_it) CloseHandle(h);
  return 0;
}
extern "C" int killpg(pid_t pgid, int sig) {
  return kill(pgid, sig);
}

extern "C" char* strsignal(int sig) {
  static char buf[32];
  snprintf(buf, sizeof(buf), "Signal %d", sig);
  return buf;
}

// --------------------------------------------------------------------------
// dirent
// --------------------------------------------------------------------------

struct oils_DIR {
  HANDLE h;
  WIN32_FIND_DATAW fd;
  bool first;
  struct dirent ent;
};

extern "C" DIR* opendir(const char* path) {
  std::string p = ToWinPath(path);
  if (p.empty()) p = ".";
  if (p.back() != '/' && p.back() != '\\') p += '/';
  p += '*';
  auto* d = new oils_DIR();
  d->h = FindFirstFileExW(W(p).c_str(), FindExInfoBasic, &d->fd,
                          FindExSearchNameMatch, nullptr,
                          FIND_FIRST_EX_LARGE_FETCH);
  if (d->h == INVALID_HANDLE_VALUE) {
    errno = ErrnoFromWin(GetLastError());
    delete d;
    return nullptr;
  }
  d->first = true;
  return d;
}

extern "C" struct dirent* readdir(DIR* d) {
  if (!d->first) {
    if (!FindNextFileW(d->h, &d->fd)) return nullptr;
  }
  d->first = false;
  std::string n = U(d->fd.cFileName);
  strncpy(d->ent.d_name, n.c_str(), sizeof(d->ent.d_name) - 1);
  d->ent.d_name[sizeof(d->ent.d_name) - 1] = 0;
  return &d->ent;
}

extern "C" int closedir(DIR* d) {
  FindClose(d->h);
  delete d;
  return 0;
}

// --------------------------------------------------------------------------
// fnmatch (with bash extglob), glob
// --------------------------------------------------------------------------

static char Fold(char c, int flags) {
  return (flags & FNM_CASEFOLD) ? (char)tolower((unsigned char)c) : c;
}

// Decode one UTF-8 code point length.
static int U8Len(const char* s) {
  unsigned char c = (unsigned char)*s;
  if (c < 0x80) return 1;
  if ((c >> 5) == 6) return 2;
  if ((c >> 4) == 14) return 3;
  if ((c >> 3) == 30) return 4;
  return 1;
}

static bool ClassMatch(const std::string& cls, unsigned char c) {
  if (cls == "alpha") return isalpha(c);
  if (cls == "digit") return isdigit(c);
  if (cls == "alnum") return isalnum(c);
  if (cls == "upper") return isupper(c);
  if (cls == "lower") return islower(c);
  if (cls == "space") return isspace(c);
  if (cls == "blank") return c == ' ' || c == '\t';
  if (cls == "punct") return ispunct(c);
  if (cls == "print") return isprint(c);
  if (cls == "graph") return isgraph(c);
  if (cls == "cntrl") return iscntrl(c);
  if (cls == "xdigit") return isxdigit(c);
  return false;
}

// Parse bracket expression at p (p points after '[').  Returns pointer after
// ']' or nullptr if malformed; *matched set.
static const char* Bracket(const char* p, const char* s, int slen, int flags,
                           bool* matched) {
  bool neg = false;
  if (*p == '!' || *p == '^') {
    neg = true;
    ++p;
  }
  bool ok = false;
  bool first = true;
  unsigned char c = (unsigned char)Fold(*s, flags);
  (void)slen;
  while (*p && (first || *p != ']')) {
    first = false;
    if (p[0] == '[' && p[1] == ':') {
      const char* e = strstr(p + 2, ":]");
      if (!e) return nullptr;
      if (ClassMatch(std::string(p + 2, e - p - 2), c)) ok = true;
      p = e + 2;
      continue;
    }
    unsigned char lo;
    if (*p == '\\' && !(flags & FNM_NOESCAPE) && p[1]) {
      ++p;
    }
    lo = (unsigned char)Fold(*p, flags);
    ++p;
    if (p[0] == '-' && p[1] && p[1] != ']') {
      ++p;
      if (*p == '\\' && !(flags & FNM_NOESCAPE) && p[1]) ++p;
      unsigned char hi = (unsigned char)Fold(*p, flags);
      ++p;
      if (c >= lo && c <= hi) ok = true;
    } else if (c == lo) {
      ok = true;
    }
  }
  if (*p != ']') return nullptr;
  *matched = ok != neg;
  return p + 1;
}

static bool Match(const char* p, const char* pe, const char* s, const char* se,
                  int flags, bool at_start);

// Split "a|b|c" (top level) of an extglob group [b, e).
static std::vector<std::pair<const char*, const char*>> SplitAlts(
    const char* b, const char* e) {
  std::vector<std::pair<const char*, const char*>> out;
  int depth = 0;
  const char* start = b;
  for (const char* q = b; q < e; ++q) {
    if (*q == '\\' && q + 1 < e) {
      ++q;
      continue;
    }
    if (*q == '(') ++depth;
    if (*q == ')') --depth;
    if (*q == '|' && depth == 0) {
      out.push_back({start, q});
      start = q + 1;
    }
  }
  out.push_back({start, e});
  return out;
}

static const char* GroupEnd(const char* p, const char* pe) {
  // p points at '('
  int depth = 0;
  for (const char* q = p; q < pe; ++q) {
    if (*q == '\\' && q + 1 < pe) {
      ++q;
      continue;
    }
    if (*q == '(') ++depth;
    if (*q == ')') {
      if (--depth == 0) return q;
    }
  }
  return nullptr;
}

static bool MatchAnyAlt(const std::vector<std::pair<const char*, const char*>>& alts,
                        const char* s, const char* se, int flags) {
  for (auto& a : alts)
    if (Match(a.first, a.second, s, se, flags, false)) return true;
  return false;
}

// Match s[0..k) against (alts)+ i.e. one or more repetitions.
static bool MatchRepeat(const std::vector<std::pair<const char*, const char*>>& alts,
                        const char* s, const char* se, int flags) {
  if (s == se) return false;
  if (MatchAnyAlt(alts, s, se, flags)) return true;
  for (const char* m = s + 1; m < se; ++m) {
    if (MatchAnyAlt(alts, s, m, flags) && MatchRepeat(alts, m, se, flags))
      return true;
  }
  return false;
}

static bool Match(const char* p, const char* pe, const char* s, const char* se,
                  int flags, bool at_start) {
  while (p < pe) {
    char pc = *p;
    // extglob
    if ((flags & FNM_EXTMATCH) && p + 1 < pe && p[1] == '(' &&
        (pc == '@' || pc == '*' || pc == '+' || pc == '?' || pc == '!')) {
      const char* ge = GroupEnd(p + 1, pe);
      if (ge) {
        auto alts = SplitAlts(p + 2, ge);
        const char* rest = ge + 1;
        for (const char* m = s; m <= se; ++m) {
          bool head = false;
          switch (pc) {
          case '@':
            head = MatchAnyAlt(alts, s, m, flags);
            break;
          case '?':
            head = (m == s) || MatchAnyAlt(alts, s, m, flags);
            break;
          case '+':
            head = MatchRepeat(alts, s, m, flags);
            break;
          case '*':
            head = (m == s) || MatchRepeat(alts, s, m, flags);
            break;
          case '!':
            head = !MatchAnyAlt(alts, s, m, flags);
            break;
          }
          if (head && Match(rest, pe, m, se, flags, false)) return true;
        }
        return false;
      }
    }
    if (s < se && *s == '.' && at_start && (flags & FNM_PERIOD) &&
        pc != '.') {
      return false;
    }
    switch (pc) {
    case '?':
      if (s >= se) return false;
      if ((flags & FNM_PATHNAME) && *s == '/') return false;
      s += U8Len(s);
      ++p;
      break;
    case '*': {
      while (p < pe && *p == '*') ++p;
      if (p == pe) {
        if (flags & FNM_PATHNAME) return memchr(s, '/', se - s) == nullptr;
        return true;
      }
      for (const char* m = s; m <= se; ++m) {
        if (Match(p, pe, m, se, flags, false)) return true;
        if (m < se && (flags & FNM_PATHNAME) && *m == '/') break;
      }
      return false;
    }
    case '[': {
      if (s >= se) return false;
      bool matched = false;
      const char* np = Bracket(p + 1, s, (int)(se - s), flags, &matched);
      if (!np) {  // literal '['
        if (*s != '[') return false;
        ++s;
        ++p;
        break;
      }
      if (!matched) return false;
      s += U8Len(s);
      p = np;
      break;
    }
    case '\\':
      if (!(flags & FNM_NOESCAPE) && p + 1 < pe) ++p;
      // fallthrough
    default:
      if (s >= se || Fold(*p, flags) != Fold(*s, flags)) return false;
      ++p;
      ++s;
    }
    at_start = (flags & FNM_PATHNAME) && s[-1] == '/';
  }
  return s == se;
}

extern "C" int fnmatch(const char* pat, const char* str, int flags) {
  bool ok = Match(pat, pat + strlen(pat), str, str + strlen(str), flags, true);
  return ok ? 0 : FNM_NOMATCH;
}

static bool HasMeta(const std::string& s) {
  for (size_t i = 0; i < s.size(); ++i) {
    char c = s[i];
    if (c == '\\') {
      ++i;
      continue;
    }
    if (c == '*' || c == '?' || c == '[') return true;
  }
  return false;
}

static std::string Unescape(const std::string& s) {
  std::string r;
  for (size_t i = 0; i < s.size(); ++i) {
    if (s[i] == '\\' && i + 1 < s.size()) ++i;
    r += s[i];
  }
  return r;
}

static void GlobRec(const std::string& prefix,
                    const std::vector<std::string>& comps, size_t idx,
                    int flags, std::vector<std::string>* out) {
  if (idx == comps.size()) {
    out->push_back(prefix);
    return;
  }
  const std::string& c = comps[idx];
  bool last = idx + 1 == comps.size();
  std::string sep = (prefix.empty() || prefix.back() == '/') ? "" : "/";
  if (!HasMeta(c)) {
    std::string next = prefix + sep + Unescape(c);
    bool dir = false;
    if (FileExistsW(W(ToWinPath(next.c_str())), &dir) && (last || dir)) {
      GlobRec(next, comps, idx + 1, flags, out);
    }
    return;
  }
  DIR* d = opendir(prefix.empty() ? "." : prefix.c_str());
  if (!d) return;
  std::vector<std::string> names;
  while (struct dirent* e = readdir(d)) {
    std::string n = e->d_name;
    if (n == "." || n == "..") {
      if (c[0] != '.') continue;
    }
    int fl = FNM_EXTMATCH | ((flags & GLOB_NOESCAPE) ? FNM_NOESCAPE : 0);
    if (!(flags & GLOB_PERIOD)) fl |= FNM_PERIOD;
    if (fnmatch(c.c_str(), n.c_str(), fl) == 0) names.push_back(n);
  }
  closedir(d);
  std::sort(names.begin(), names.end());
  for (auto& n : names) {
    std::string next = prefix + sep + n;
    if (!last) {
      bool dir = false;
      if (!FileExistsW(W(ToWinPath(next.c_str())), &dir) || !dir) continue;
    }
    GlobRec(next, comps, idx + 1, flags, out);
  }
}

extern "C" int glob(const char* pat, int flags, int (*)(const char*, int),
                    glob_t* g) {
  std::string p = pat;
  std::string prefix;
  size_t i = 0;
  if (!p.empty() && p[0] == '/') {
    prefix = "/";
    i = 1;
  } else if (p.size() >= 2 && IsAlpha(p[0]) && p[1] == ':') {
    prefix = p.substr(0, 2) + "/";
    i = (p.size() > 2 && (p[2] == '/' || p[2] == '\\')) ? 3 : 2;
  }
  std::vector<std::string> comps;
  while (i <= p.size()) {
    size_t s = p.find('/', i);
    if (s == std::string::npos) s = p.size();
    if (s > i) comps.push_back(p.substr(i, s - i));
    i = s + 1;
  }
  std::vector<std::string> out;
  if (prefix == "/" && !comps.empty() && comps[0].size() == 1 &&
      IsAlpha(comps[0][0])) {
    // "/c/..." : keep POSIX form in results
  }
  GlobRec(prefix, comps, 0, flags, &out);
  g->gl_pathc = out.size();
  g->gl_offs = 0;
  g->gl_pathv = (char**)calloc(out.size() + 1, sizeof(char*));
  for (size_t k = 0; k < out.size(); ++k) g->gl_pathv[k] = _strdup(out[k].c_str());
  if (out.empty()) return GLOB_NOMATCH;
  return 0;
}

extern "C" void globfree(glob_t* g) {
  for (size_t k = 0; k < g->gl_pathc; ++k) free(g->gl_pathv[k]);
  free(g->gl_pathv);
  g->gl_pathv = nullptr;
  g->gl_pathc = 0;
}

// --------------------------------------------------------------------------
// regex: POSIX ERE through std::regex::extended
// --------------------------------------------------------------------------

struct RegexImpl {
  std::regex re;
  int cflags;
};

extern "C" int regcomp(regex_t* r, const char* pat, int cflags) {
  auto f = std::regex::extended;
  if (cflags & REG_ICASE) f |= std::regex::icase;
  if (cflags & REG_NOSUB) f |= std::regex::nosubs;
  if (cflags & REG_NEWLINE) f |= std::regex::multiline;
  try {
    auto* impl = new RegexImpl{std::regex(pat, f), cflags};
    r->impl = impl;
    r->re_nsub = impl->re.mark_count();
    return 0;
  } catch (const std::regex_error&) {
    r->impl = nullptr;
    return 2;  // REG_BADPAT
  }
}

extern "C" int regexec(const regex_t* r, const char* s, size_t n,
                       regmatch_t* m, int eflags) {
  auto* impl = static_cast<RegexImpl*>(r->impl);
  if (!impl) return REG_NOMATCH;
  std::cmatch cm;
  auto mf = std::regex_constants::match_default;
  if (eflags & REG_NOTBOL) mf |= std::regex_constants::match_not_bol;
  if (eflags & REG_NOTEOL) mf |= std::regex_constants::match_not_eol;
  bool ok = false;
  try {
    ok = std::regex_search(s, cm, impl->re, mf);
  } catch (const std::regex_error&) {
    return REG_NOMATCH;
  }
  if (!ok) return REG_NOMATCH;
  if (!(impl->cflags & REG_NOSUB)) {
    for (size_t i = 0; i < n; ++i) {
      if (i < cm.size() && cm[i].matched) {
        m[i].rm_so = cm.position(i);
        m[i].rm_eo = cm.position(i) + cm.length(i);
      } else {
        m[i].rm_so = m[i].rm_eo = -1;
      }
    }
  }
  return 0;
}

extern "C" void regfree(regex_t* r) {
  delete static_cast<RegexImpl*>(r->impl);
  r->impl = nullptr;
}

extern "C" size_t regerror(int, const regex_t*, char* buf, size_t n) {
  const char* msg = "invalid regular expression";
  if (n) {
    strncpy(buf, msg, n);
    buf[n - 1] = 0;
  }
  return strlen(msg) + 1;
}

// --------------------------------------------------------------------------
// stdio extensions
// --------------------------------------------------------------------------

extern "C" int dprintf(int fd, const char* fmt, ...) {
  char buf[4096];
  va_list ap;
  va_start(ap, fmt);
  int n = vsnprintf(buf, sizeof(buf), fmt, ap);
  va_end(ap);
  if (n < 0) return n;
  if (n >= (int)sizeof(buf)) n = sizeof(buf) - 1;
  return _write(fd, buf, n);
}

extern "C" ssize_t getline(char** line, size_t* cap, FILE* f) {
  if (!*line || *cap == 0) {
    *cap = 128;
    *line = (char*)malloc(*cap);
  }
  size_t n = 0;
  int c;
  while ((c = fgetc(f)) != EOF) {
    if (n + 2 > *cap) {
      *cap *= 2;
      *line = (char*)realloc(*line, *cap);
    }
    (*line)[n++] = (char)c;
    if (c == '\n') break;
  }
  if (n == 0) return -1;
  (*line)[n] = 0;
  return (ssize_t)n;
}

extern "C" int faccessat(int, const char* path, int mode, int) {
  return oils_access(path, mode);
}

extern "C" int clock_gettime(clockid_t id, struct timespec* ts) {
  if (id == CLOCK_MONOTONIC) {
    LARGE_INTEGER f, c;
    QueryPerformanceFrequency(&f);
    QueryPerformanceCounter(&c);
    ts->tv_sec = (time_t)(c.QuadPart / f.QuadPart);
    ts->tv_nsec = (long)((c.QuadPart % f.QuadPart) * 1000000000LL / f.QuadPart);
    return 0;
  }
  return timespec_get(ts, TIME_UTC) ? 0 : -1;
}

// --------------------------------------------------------------------------
// argv
// --------------------------------------------------------------------------

#include <shellapi.h>

extern "C" char** oils_utf8_argv(int* argc) {
  int n = 0;
  wchar_t** wargv = CommandLineToArgvW(GetCommandLineW(), &n);
  char** out = (char**)calloc(n + 1, sizeof(char*));
  for (int i = 0; i < n; ++i) {
    std::string a = U(wargv[i]);
    if (i == 0) {
      std::replace(a.begin(), a.end(), '\\', '/');
      if (IEndsWith(a, ".exe")) a.resize(a.size() - 4);
    }
    out[i] = _strdup(a.c_str());
  }
  LocalFree(wargv);
  *argc = n;
  return out;
}

// --------------------------------------------------------------------------
// path predicates
// --------------------------------------------------------------------------

extern "C" int oils_win_isabs(const char* p) {
  if (!p) return 0;
  if (IsAlpha(p[0]) && p[1] == ':' && (p[2] == '/' || p[2] == 0x5c)) return 1;
  if (p[0] == 0x5c && p[1] == 0x5c) return 1;
  return 0;
}

static bool FileId(const char* path, BY_HANDLE_FILE_INFORMATION* info) {
  HANDLE h = CreateFileW(W(ToWinPath(path)).c_str(), 0,
                         FILE_SHARE_READ | FILE_SHARE_WRITE | FILE_SHARE_DELETE,
                         nullptr, OPEN_EXISTING, FILE_FLAG_BACKUP_SEMANTICS,
                         nullptr);
  if (h == INVALID_HANDLE_VALUE) return false;
  BOOL ok = GetFileInformationByHandle(h, info);
  CloseHandle(h);
  return ok != 0;
}

extern "C" int oils_same_file(const char* a, const char* b) {
  BY_HANDLE_FILE_INFORMATION x, y;
  if (!FileId(a, &x) || !FileId(b, &y)) return 0;
  return x.dwVolumeSerialNumber == y.dwVolumeSerialNumber &&
         x.nFileIndexHigh == y.nFileIndexHigh &&
         x.nFileIndexLow == y.nFileIndexLow;
}
