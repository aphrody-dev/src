---
name: cli-bottom
description: Use `btm` (bottom 0.15.0): Cross-platform terminal system and process monitor.
---

# bottom 0.15.0

Binary: `btm`. Declared in `tools.toml`; install or update with `ay up bottom`.
Generated from the tool manual; do not edit. Regenerate with `just cli-skills`.

## `btm --help`

```text
bottom 0.15.0

A customizable cross-platform graphical process/system monitor for the terminal. Supports Linux,
macOS, and Windows.

Usage: btm [OPTIONS]

General Options:
      --autohide_time
          Automatically hides the time scale in graphs after being shown for a brief moment when
          zoomed in/out. If time is disabled using --hide_time then this will have no effect.

  -b, --basic
          Hides graphs and uses a more basic look, largely inspired by htop's design.

  -C, --config_location <PATH>
          Sets the location of the config file. Expects a config file in the TOML format. If it
          doesn't exist, a default config file is created at the path. If no path is provided, the
          default config location will be used.

  -t, --default_time_value <TIME>
          Default time value for graphs. Either a number in milliseconds or a 'human duration' (e.g.
          60s, 10m). Defaults to 60s, must be at least 30s.

      --default_widget_count <N>
          Sets the N'th selected widget type to use as the default widget. Requires
          'default_widget_type' to also be set, and defaults to 1.

          This reads from left to right, top to bottom. For example, suppose we have a layout that
          looks like:
          +-------------------+-----------------------+
          |      CPU (1)      |        CPU (2)        |
          +---------+---------+-------------+---------+
          | Process | CPU (3) | Temperature | CPU (4) |
          +---------+---------+-------------+---------+

          And we set our default widget type to 'CPU'. If we set '--default_widget_count 1', then it
          would use the CPU (1) as the default widget. If we set '--default_widget_count 3', it
          would use CPU (3) as the default instead.

      --default_widget_type <WIDGET>
          Sets which widget type to use as the default widget. For the default layout, this defaults
          to the 'process' widget. For a custom layout, it defaults to the first widget it sees.

          For example, suppose we have a layout that looks like:
          +-------------------+-----------------------+
          |      CPU (1)      |        CPU (2)        |
          +---------+---------+-------------+---------+
          | Process | CPU (3) | Temperature | CPU (4) |
          +---------+---------+-------------+---------+

          Then, setting '--default_widget_type temperature' will make the temperature widget
          selected by default.

          [possible values: cpu, mem, net, network, proc, process, processes, temp, temperature,
          disk, batt, battery]

      --disable_click
          Disables mouse clicks from interacting with bottom.

      --disable_keys
          Disables keyboard shortcuts from interacting with bottom. Note this includes keyboard
          shortcuts to quit bottom.

  -m, --dot_marker
          Uses a dot marker for graphs as opposed to the default braille marker.

  -e, --expanded
          Expand the default widget upon starting the app. This flag has no effect in basic mode
          (--basic).
```
