// cpp/win32/oils_win.cc: Windows translation unit for the generated shell.
//
// It #includes the generated _gen/bin/oils_for_unix.mycpp.cc so that the
// replacement for fork() has full access to the process::* classes.
//
// Strategy (no fork() on Windows):
//   - ExternalThunk     -> CreateProcessW (async; real pid; waitpid() works).
//   - _HereDocWriterThunk -> write the body into the pipe directly.
//   - SubProgramThunk / BuiltinThunk (subshells, $(...), non-last pipeline
//     parts that are builtins/functions, background `{ ...; } &`) run
//     IN-PROCESS and synchronously: std fds are dup2()'d according to the
//     ChildStateChange list, the thunk runs, posix::_exit() throws
//     OilsInProcExit, fds/cwd/variables/options/traps are restored.  A fake
//     pid with the exit status is registered for waitpid().

// Redirect the single fork() call site (Process::StartProcess).
#define fork() fork_win(this)
#include "_gen/bin/oils_for_unix.mycpp.cc"
#undef fork

#include <direct.h>
#include <io.h>
#include <process.h>
#include <windows.h>

#include <atomic>
#include <string>

#include <vector>

extern "C" int oils_spawn(const char* argv0_path, char* const argv[],
                          char* const envp[], const int fds[3]);
extern "C" int oils_register_finished(int exit_code);
extern int gOilsInProcDepth;

namespace {

using runtime_asdl::Cell;

// Saved shell state for an in-process "subshell".
struct SavedState {
  List<Dict<BigStr*, Cell*>*>* frames = nullptr;     // copies
  List<Dict<BigStr*, Cell*>*>* frame_ptrs = nullptr;  // originals
  List<bool>* opts = nullptr;
  Dict<BigStr*, runtime_asdl::trap_action_t*>* hooks = nullptr;
  Dict<int, runtime_asdl::trap_action_t*>* traps = nullptr;
  Dict<BigStr*, value_asdl::value_t*>* funcs = nullptr;
  List<int>* last_status = nullptr;
  BigStr* pwd = nullptr;
};

void Save(cmd_eval::CommandEvaluator* ev, trap_osh::TrapState* ts,
          SavedState* s) {
  state::Mem* mem = ev->mem;
  s->frames = Alloc<List<Dict<BigStr*, Cell*>*>>();
  s->frame_ptrs = Alloc<List<Dict<BigStr*, Cell*>*>>();
  for (ListIter<Dict<BigStr*, Cell*>*> it(mem->var_stack); !it.Done();
       it.Next()) {
    Dict<BigStr*, Cell*>* orig = it.Value();
    Dict<BigStr*, Cell*>* copy = Alloc<Dict<BigStr*, Cell*>>();
    StackRoot r0(&orig);
    StackRoot r1(&copy);
    s->frame_ptrs->append(orig);
    s->frames->append(copy);
    for (DictIter<BigStr*, Cell*> d(orig); !d.Done(); d.Next()) {
      Cell* c = d.Value();
      BigStr* k = d.Key();
      StackRoot r2(&c);
      StackRoot r3(&k);
      Cell* c2 = Alloc<Cell>(c->exported, c->readonly, c->nameref, c->val);
      copy->set(k, c2);
    }
  }
  s->opts = Alloc<List<bool>>();
  s->opts->extend(ev->mutable_opts->opt0_array);
  s->hooks = Alloc<Dict<BigStr*, runtime_asdl::trap_action_t*>>();
  for (DictIter<BigStr*, runtime_asdl::trap_action_t*> d(ts->hooks); !d.Done();
       d.Next()) {
    s->hooks->set(d.Key(), d.Value());
  }
  s->traps = Alloc<Dict<int, runtime_asdl::trap_action_t*>>();
  for (DictIter<int, runtime_asdl::trap_action_t*> d(ts->traps); !d.Done();
       d.Next()) {
    s->traps->set(d.Key(), d.Value());
  }
  s->funcs = Alloc<Dict<BigStr*, value_asdl::value_t*>>();
  for (DictIter<BigStr*, value_asdl::value_t*> d(ev->procs->sh_funcs);
       !d.Done(); d.Next()) {
    s->funcs->set(d.Key(), d.Value());
  }
  s->last_status = Alloc<List<int>>();
  s->last_status->extend(mem->last_status);
  s->pwd = mem->pwd;
}

void Restore(cmd_eval::CommandEvaluator* ev, trap_osh::TrapState* ts,
             SavedState* s) {
  state::Mem* mem = ev->mem;
  int n = len(s->frame_ptrs);
  for (int i = 0; i < n; ++i) {
    Dict<BigStr*, Cell*>* orig = s->frame_ptrs->at(i);
    orig->clear();
    for (DictIter<BigStr*, Cell*> d(s->frames->at(i)); !d.Done(); d.Next()) {
      orig->set(d.Key(), d.Value());
    }
  }
  List<bool>* o = ev->mutable_opts->opt0_array;
  for (int i = 0; i < len(o) && i < len(s->opts); ++i) {
    o->set(i, s->opts->at(i));
  }
  ts->hooks->clear();
  for (DictIter<BigStr*, runtime_asdl::trap_action_t*> d(s->hooks); !d.Done();
       d.Next()) {
    ts->hooks->set(d.Key(), d.Value());
  }
  ts->traps->clear();
  for (DictIter<int, runtime_asdl::trap_action_t*> d(s->traps); !d.Done();
       d.Next()) {
    ts->traps->set(d.Key(), d.Value());
  }
  ev->procs->sh_funcs->clear();
  for (DictIter<BigStr*, value_asdl::value_t*> d(s->funcs); !d.Done();
       d.Next()) {
    ev->procs->sh_funcs->set(d.Key(), d.Value());
  }
  mem->last_status->clear();
  mem->last_status->extend(s->last_status);
  mem->pwd = s->pwd;
}

void StdFdsFor(process::Process* p, int fds[3]) {
  fds[0] = 0;
  fds[1] = 1;
  fds[2] = 2;
  for (ListIter<process::ChildStateChange*> it(p->state_changes); !it.Done();
       it.Next()) {
    process::ChildStateChange* st = it.Value();
    if (auto* a = dynamic_cast<process::StdinFromPipe*>(st)) {
      fds[0] = a->r;
    } else if (auto* b = dynamic_cast<process::StdoutToPipe*>(st)) {
      fds[1] = b->w;
    } else if (auto* c = dynamic_cast<process::StderrToPipe*>(st)) {
      fds[2] = c->w;
    }
    // SetPgid: no process groups on Windows (job object instead).
  }
}

int StartExternal(process::ExternalThunk* ext, const int fds[3]) {
  std::vector<char*> argv;
  for (ListIter<BigStr*> it(ext->cmd_val->argv); !it.Done(); it.Next()) {
    argv.push_back(it.Value()->data_);
  }
  argv.push_back(nullptr);
  std::vector<std::string> env_store;
  for (DictIter<BigStr*, BigStr*> it(ext->environ); !it.Done(); it.Next()) {
    env_store.push_back(std::string(it.Key()->data_, len(it.Key())) + "=" +
                        std::string(it.Value()->data_, len(it.Value())));
  }
  std::vector<char*> envp;
  for (auto& s : env_store) envp.push_back(const_cast<char*>(s.c_str()));
  envp.push_back(nullptr);

  mylib::Stdout()->flush();
  fflush(nullptr);
  int pid = oils_spawn(ext->argv0_path->data_, argv.data(), envp.data(), fds);
  if (pid < 0) {
    int e = errno;
    fprintf(stderr, "osh: Can't execute '%s': %s\n", ext->argv0_path->data_,
            strerror(e));
    return oils_register_finished(e == EACCES || e == ENOEXEC ? 126 : 127);
  }
  return pid;
}

// Output pump for in-process children writing into a pipe.
//
// The in-process child runs to completion before the reader starts, so a
// plain pipe deadlocks once its buffer (kPipeBuffer, 16 MiB) is full.  The
// child writes into a private pipe instead; a thread drains it into memory
// while the child runs (phase 1), then, once RunInProcess() returns, flushes
// the buffer into the real pipe and copies through until EOF (phase 2, also
// covers `a | ext | b` where ext keeps writing).  Memory is capped at
// kPumpMax: beyond it the pump stops reading and the child blocks, as before.
struct OutPump {
  int src = -1;  // read end of the private pipe
  int dst = -1;  // dup of the real pipe write end (closed by the thread)
  std::atomic<bool> streaming{false};
  HANDLE thread = nullptr;
};

static const size_t kPumpMax = size_t(1) << 30;  // 1 GiB

unsigned __stdcall PumpMain(void* arg) {
  auto* pp = static_cast<OutPump*>(arg);
  std::string buf;
  bool dst_ok = true;
  char chunk[64 * 1024];
  auto put = [&](const char* d, size_t n) {
    while (dst_ok && n > 0) {
      int w = _write(pp->dst, d, static_cast<unsigned>(n > (1u << 30) ? (1u << 30) : n));
      if (w <= 0) {
        dst_ok = false;  // reader gone (EPIPE): keep draining, discard
        break;
      }
      d += w;
      n -= static_cast<size_t>(w);
    }
  };
  for (;;) {
    if (!pp->streaming.load() && buf.size() >= kPumpMax) {
      while (!pp->streaming.load()) Sleep(1);
    }
    int r = _read(pp->src, chunk, sizeof chunk);
    if (r <= 0) break;
    if (pp->streaming.load()) {
      if (!buf.empty()) {
        put(buf.data(), buf.size());
        std::string().swap(buf);
      }
      put(chunk, static_cast<size_t>(r));
    } else {
      buf.append(chunk, static_cast<size_t>(r));
    }
  }
  while (!pp->streaming.load()) Sleep(1);
  if (!buf.empty()) put(buf.data(), buf.size());
  _close(pp->src);
  _close(pp->dst);
  delete pp;
  return 0;
}

bool IsPipeFd(int fd) {
  intptr_t h = _get_osfhandle(fd);
  return h != -1 && GetFileType(reinterpret_cast<HANDLE>(h)) == FILE_TYPE_PIPE;
}

// Returns a pump whose private write end replaces `fd` for the child, or
// nullptr if `fd` is not a pipe.  *child_fd receives the private write end.
OutPump* StartPump(int fd, int* child_fd) {
  if (!IsPipeFd(fd)) return nullptr;
  int pfd[2];
  if (_pipe(pfd, 1u << 20, _O_BINARY | _O_NOINHERIT) != 0) return nullptr;
  auto* pp = new OutPump;
  pp->src = pfd[0];
  pp->dst = _dup(fd);
  if (pp->dst < 0) {
    _close(pfd[0]);
    _close(pfd[1]);
    delete pp;
    return nullptr;
  }
  // _dup() makes an inheritable handle; the pump's copy must not leak into
  // spawned externals or the reader would never see EOF.
  SetHandleInformation(reinterpret_cast<HANDLE>(_get_osfhandle(pp->dst)),
                       HANDLE_FLAG_INHERIT, 0);
  uintptr_t t = _beginthreadex(nullptr, 0, PumpMain, pp, 0, nullptr);
  if (t == 0) {
    _close(pfd[0]);
    _close(pfd[1]);
    _close(pp->dst);
    delete pp;
    return nullptr;
  }
  pp->thread = reinterpret_cast<HANDLE>(t);
  *child_fd = pfd[1];
  return pp;
}

int RunInProcess(process::Process* p, const int fds_in[3]) {
  // stdout/stderr pipes get a pump (2>&1 shares the stdout one).
  int fds[3] = {fds_in[0], fds_in[1], fds_in[2]};
  OutPump* pumps[3] = {nullptr, nullptr, nullptr};
  int pump_w[3] = {-1, -1, -1};
  if (!getenv("OILS_WIN_NO_PUMP")) {
    for (int i = 1; i < 3; ++i) {
      if (fds[i] == i) continue;
      if (i == 2 && fds_in[2] == fds_in[1] && pumps[1]) {
        fds[2] = pump_w[1];
        continue;
      }
      int w;
      if (OutPump* pp = StartPump(fds[i], &w)) {
        pumps[i] = pp;
        pump_w[i] = w;
        fds[i] = w;
      }
    }
  }
  process::Thunk* thunk = p->thunk;
  auto* sub = dynamic_cast<process::SubProgramThunk*>(thunk);

  mylib::Stdout()->flush();
  fflush(nullptr);

  int saved[3];
  for (int i = 0; i < 3; ++i) {
    saved[i] = (fds[i] != i) ? _dup(i) : -1;
  }
  for (int i = 0; i < 3; ++i) {
    if (fds[i] != i) _dup2(fds[i], i);
  }
  // A forked child would close the write end of its input pipe.  We can't
  // close the parent's fd (Process::MaybeClosePipe() closes it later), so
  // point it at NUL instead: the pipe sees EOF once earlier writers finish.
  for (ListIter<process::ChildStateChange*> it(p->state_changes); !it.Done();
       it.Next()) {
    if (auto* a = dynamic_cast<process::StdinFromPipe*>(it.Value())) {
      int nul = _open("NUL", _O_RDWR | _O_BINARY | _O_NOINHERIT);
      if (nul >= 0) {
        _dup2(nul, a->w);
        _close(nul);
      }
    }
  }
  wchar_t* cwd = _wgetcwd(nullptr, 0);

  SavedState st;
  StackRoot r0(&st.frames);
  StackRoot r1(&st.frame_ptrs);
  StackRoot r2(&st.opts);
  StackRoot r3(&st.hooks);
  StackRoot r4(&st.traps);
  StackRoot r5(&st.funcs);
  StackRoot r6(&st.last_status);
  StackRoot r7(&st.pwd);
  if (sub) Save(sub->cmd_ev, sub->trap_state, &st);

  int status = 0;
  int real_pid = -1;
  ++gOilsInProcDepth;
  try {
    thunk->Run();  // always ends in posix::_exit() or an exec
  } catch (OilsInProcExit& e) {
    status = e.status;
  } catch (OilsInProcExec& e) {
    real_pid = e.pid;  // e.g. `a | ext | b`: ext runs concurrently
  }
  --gOilsInProcDepth;

  mylib::Stdout()->flush();
  fflush(nullptr);

  if (sub) Restore(sub->cmd_ev, sub->trap_state, &st);
  if (cwd) {
    _wchdir(cwd);
    free(cwd);
  }

  for (int i = 0; i < 3; ++i) {
    if (saved[i] >= 0) {
      _dup2(saved[i], i);
      _close(saved[i]);
    }
  }
  for (int i = 1; i < 3; ++i) {
    if (!pumps[i]) continue;
    _close(pump_w[i]);  // EOF once async externals (if any) exit too
    HANDLE t = pumps[i]->thread;
    pumps[i]->streaming.store(true);  // pump owns and frees itself now
    CloseHandle(t);
  }
  return real_pid > 0 ? real_pid : oils_register_finished(status);
}

}  // namespace

namespace posix {

int fork_win(void* vp) {
  auto* p = static_cast<process::Process*>(vp);
  int fds[3];
  StdFdsFor(p, fds);
  static bool trace = getenv("OILS_WIN_TRACE") != nullptr;
  if (trace) {
    fprintf(stderr, "[win] start %s fds=%d,%d,%d\n",
            p->thunk->UserString()->data_, fds[0], fds[1], fds[2]);
  }

  if (auto* ext = dynamic_cast<process::ExternalThunk*>(p->thunk)) {
    return StartExternal(ext, fds);
  }
  if (auto* hd = dynamic_cast<process::_HereDocWriterThunk*>(p->thunk)) {
    // The parent closes write_fd right after StartProcess(); don't close it.
    posix::write(hd->w, hd->body_str);
    return oils_register_finished(0);
  }
  return RunInProcess(p, fds);
}

}  // namespace posix
