// cpp/win32/main_win.cc: replaces _gen/bin/oils_for_unix.mycpp-main.cc.
// - argv comes from GetCommandLineW() as UTF-8 (see compat.cc)
// - argv[0] "C:\x\osh.exe" becomes "C:/x/osh" so the applet dispatch
//   (osh / ysh / oils-for-unix) works.

#include "mycpp/runtime.h"

extern "C" char** oils_utf8_argv(int* argc);

namespace oils_for_unix {
int main(List<BigStr*>* argv);
}

int main(int, char**) {
  mylib::InitCppOnly();  // Initializes gHeap

  int argc = 0;
  char** argv = oils_utf8_argv(&argc);

  auto* args = Alloc<List<BigStr*>>();
  StackRoot r(&args);
  for (int i = 0; i < argc; ++i) {
    args->append(StrFromC(argv[i]));
  }

  int status = oils_for_unix::main(args);

  gHeap.ProcessExit();

  return status;
}
