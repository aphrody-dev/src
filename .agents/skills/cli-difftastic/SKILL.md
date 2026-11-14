---
name: cli-difftastic
description: Use `difft` (difftastic 0.72.0): A structural diff that understands syntax.
---

# difftastic 0.72.0

Binary: `difft`. Declared in `tools.toml`; install or update with `ay up difftastic`.
Generated from the tool manual; do not edit. Regenerate with `just cli-skills`.

## `difft --help`

```text
A structural diff that understands syntax.

Usage: difft [OPTIONS] OLD-PATH NEW-PATH

Options:
      --background <BACKGROUND>
          Set the background brightness. Difftastic will prefer brighter colours on dark
          backgrounds.

          [env: DFT_BACKGROUND=]
          [default: dark]
          [possible values: dark, light]

      --byte-limit <LIMIT>
          Use a line-oriented diff if either input file exceeds this size.

          [env: DFT_BYTE_LIMIT=]
          [default: 1000000]

  -c, --context <LINES>
          The number of contextual lines to show around changed lines.

          [env: DFT_CONTEXT=]
          [default: 3]

      --check-only
          Report whether there are any changes, but don't calculate them. Much faster.

          [env: DFT_CHECK_ONLY=]

      --color <WHEN>
          When to use color output.

          [env: DFT_COLOR=]
          [default: auto]
          [possible values: always, auto, never]

      --display <MODE>
          Display mode for showing results.

          side-by-side: Display the before file and the after file in two separate columns, with
          line numbers aligned according to unchanged content. If a change is exclusively additions
          or exclusively removals, use a single column.

          side-by-side-show-both: The same as side-by-side, but always uses two columns.

          inline: A single column display, closer to traditional diff display.

          json: Output the results as a machine-readable JSON array with an element per file.

          [env: DFT_DISPLAY=]
          [default: side-by-side]
          [possible values: side-by-side, side-by-side-show-both, inline, json]

      --exit-code
          Set the exit code to 1 if there are syntactic changes in any files. For files where there
          is no detected language (e.g. unsupported language or binary files), sets the exit code if
          there are any byte changes.

          [env: DFT_EXIT_CODE=]

      --graph-limit <LIMIT>
          Use a line-oriented diff if the internal graph exceeds this number of vertices. This limit
          controls the worst case runtime and memory usage for difftastic.

          Higher values will allow difftastic to perform a structural diff in more cases. Higher
          values will also increase the time before difftastic gives up on structural diffing, and
          increase peak memory usage.

          [env: DFT_GRAPH_LIMIT=]
```
