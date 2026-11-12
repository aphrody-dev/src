// cpp/win32/tools/asdl_empty_bases.cc
//
// Applies the asdl/gen_cpp.py OILS_EMPTY_BASES change to pre-generated ASDL
// headers from a release tarball (which predate it):
//
//   class Token : public loc_t, public word_t ... {
//   ->
//   class OILS_EMPTY_BASES Token : public loc_t, public word_t ... {
//
// Usage: asdl_empty_bases IN.h OUT.h

#include <stdio.h>

#include <fstream>
#include <iterator>
#include <sstream>
#include <string>

int main(int argc, char** argv) {
  if (argc != 3) {
    fprintf(stderr, "usage: asdl_empty_bases IN OUT\n");
    return 2;
  }
  std::ifstream in(argv[1], std::ios::binary);
  if (!in) {
    fprintf(stderr, "can't read %s\n", argv[1]);
    return 1;
  }
  std::string s((std::istreambuf_iterator<char>(in)),
                std::istreambuf_iterator<char>());
  std::string out;
  int patched = 0;
  size_t i = 0;
  while (i < s.size()) {
    bool line_start = (i == 0 || s[i - 1] == '\n');
    if (line_start && s.compare(i, 6, "class ") == 0) {
      size_t brace = s.find_first_of("{;", i);
      if (brace != std::string::npos && s[brace] == '{') {
        std::string head = s.substr(i, brace - i);
        size_t colon = head.find(" : public ");
        if (colon != std::string::npos &&
            head.find(',', colon) != std::string::npos &&
            head.find("OILS_EMPTY_BASES") == std::string::npos) {
          out += "class OILS_EMPTY_BASES ";
          i += 6;
          ++patched;
          continue;
        }
      }
    }
    out += s[i++];
  }
  std::ofstream o(argv[2], std::ios::binary);
  o << out;
  fprintf(stderr, "%s: %d classes patched\n", argv[1], patched);
  return 0;
}
