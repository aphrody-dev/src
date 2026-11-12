// cpp/win32/tools/line_patch.cc
//
// Minimal, dependency-free line patcher for generated sources (used instead
// of patch(1)/sed so the Windows build needs only clang).
//
// Patch file format (cpp/win32/*.lpatch):
//   # comment
//   - exact old line
//   + replacement line
// Each "-" line must occur exactly once in the input, and is replaced by the
// "+" line that follows it.
//
// Usage: line_patch IN OUT PATCHFILE

#include <stdio.h>

#include <fstream>
#include <string>
#include <vector>

static bool ReadLines(const char* path, std::vector<std::string>* out) {
  std::ifstream f(path, std::ios::binary);
  if (!f) return false;
  std::string line;
  while (std::getline(f, line)) {
    if (!line.empty() && line.back() == '\r') line.pop_back();
    out->push_back(line);
  }
  return true;
}

int main(int argc, char** argv) {
  if (argc != 4) {
    fprintf(stderr, "usage: line_patch IN OUT PATCHFILE\n");
    return 2;
  }
  std::vector<std::string> src, patch;
  if (!ReadLines(argv[1], &src) || !ReadLines(argv[3], &patch)) {
    fprintf(stderr, "line_patch: can't read input\n");
    return 1;
  }
  int applied = 0;
  for (size_t i = 0; i < patch.size(); ++i) {
    const std::string& p = patch[i];
    if (p.size() < 2 || p[0] != '-' || p[1] != ' ') continue;
    if (i + 1 >= patch.size() || patch[i + 1].compare(0, 2, "+ ") != 0) {
      fprintf(stderr, "line_patch: '-' without '+' at line %zu\n", i + 1);
      return 1;
    }
    std::string old_line = p.substr(2);
    std::string new_line = patch[i + 1].substr(2);
    int hits = 0;
    size_t at = 0;
    for (size_t k = 0; k < src.size(); ++k) {
      if (src[k] == old_line) {
        ++hits;
        at = k;
      }
    }
    if (hits != 1) {
      fprintf(stderr, "line_patch: %d matches for: %s\n", hits,
              old_line.c_str());
      return 1;
    }
    src[at] = new_line;
    ++applied;
  }
  std::ofstream o(argv[2], std::ios::binary);
  for (auto& l : src) o << l << '\n';
  fprintf(stderr, "%s: %d line patches applied\n", argv[1], applied);
  return 0;
}
