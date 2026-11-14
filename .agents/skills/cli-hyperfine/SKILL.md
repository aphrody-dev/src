---
name: cli-hyperfine
description: Use `hyperfine` (hyperfine 2.0.0): A command-line benchmarking tool.
---

# hyperfine 2.0.0

Binary: `hyperfine`. Declared in `tools.toml`; install or update with `ay up hyperfine`.
Generated from the tool manual; do not edit. Regenerate with `just cli-skills`.

## `hyperfine --help`

```text
A command-line benchmarking tool.

Usage: hyperfine.exe [OPTIONS] <command>...

Arguments:
  <command>...
          The command to benchmark. This can be the name of an executable, a
          command line like "grep -i todo" or a shell command like "sleep 0.5 &&
          echo test". The latter requires a shell, which can be enabled via '-S'
          or '--shell=...'. If multiple commands are given, hyperfine will show
          a comparison with the first command as the reference.

Options:
      --metrics <PRESET|METRIC[:UNIT],>
          Performance metrics to measure, in order.

          This is either a preset name, or a comma-separated list of metrics
          with optional units. CSV exports all selected metrics; markup exports
          use the first metric. JSON always includes all collected metrics.

          Presets (use one on its own):
            default  Wall-clock time and peak RSS
            time     Wall-clock, CPU, user, and system time
            all      All available metrics

          Presets use automatic units.

          Metrics and optional units:
            Time: time_wall_clock, time_cpu, time_user, time_system
              Units: ns, us, ms, s, min, h
            Memory: memory_peak_resident
              Units: B, kB, MB, GB, TB, KiB, MiB, GiB, TiB
            Counters: cpu_cycles, instructions, cache_references,
              cache_misses, branch_misses
              Units: count, k (thousand), M (million), B (billion)

          Examples:
            --metrics time_cpu,instructions
            --metrics memory_peak_resident:MiB,time_wall_clock:ms
            --metrics time
  -w, --warmup <NUM>
          Perform NUM warmup runs before the actual benchmark. This can be used
          to fill (disk) caches for I/O-heavy programs.
  -m, --min-runs <NUM>
          Perform at least NUM runs for each command (default: 10).
  -M, --max-runs <NUM>
          Perform at most NUM runs for each command. By default, there is no
          limit.
  -r, --runs <NUM>
          Perform exactly NUM runs for each command. If this option is not
          specified, hyperfine automatically determines the number of runs.
      --env <ASSIGNMENTS>
          Set environment variables for benchmark commands and their respective
          setup, prepare, conclude, and cleanup commands. Assignments are
          space-separated and support shell-style quoting, but no shell
          expansion:

            hyperfine \
              --env 'OMP_NUM_THREADS=8 CFLAGS="-O3 -march=native"' \
              'my_command'

          Specify once for all commands or once per benchmark command:

            hyperfine \
              --env 'OMP_NUM_THREADS=8' './benchmark-cpp' \
              --env 'RAYON_NUM_THREADS=8' './benchmark-rust'

          Use an empty --env='' for no overrides. Values can contain parameter
          placeholders. For example, the following benchmarks 'my_command' with
          OMP_NUM_THREADS ranging from 1 to 8:
```
