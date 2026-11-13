// Windows variant of third_party/bun/.github/native/fixtures/shell.ts: the same three Bun Shell
// pipelines (a pipe, a directory listing, builtins), with paths that exist on Windows.
import { $ } from "bun";
for (let i = 0; i < 50; i++) {
  await $`echo hello | cat`.quiet();
  await $`ls .`.quiet();
  await $`basename /a/b/c.txt; dirname /a/b/c.txt; seq 1 100`.quiet();
}
