// cpp/win32/fanos_win.cc: FANOS (fd passing over Unix sockets, used by the
// "headless" mode) is not available on Windows.  [stub]
#include "cpp/fanos.h"

namespace fanos {

void send(int sock_fd, BigStr* blob) {
  (void)sock_fd;
  (void)blob;
  throw Alloc<IOError>(ENOSYS);
}

BigStr* recv(int sock_fd, List<int>* fd_out) {
  (void)sock_fd;
  (void)fd_out;
  throw Alloc<IOError>(ENOSYS);
}

}  // namespace fanos
