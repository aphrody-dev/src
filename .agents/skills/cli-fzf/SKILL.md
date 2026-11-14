---
name: cli-fzf
description: Use `fzf` (fzf 0.75.0): fzf is an interactive filter program for any kind of list.
---

# fzf 0.75.0

Binary: `fzf`. Declared in `tools.toml`; install or update with `ay up fzf`.
Generated from the tool manual; do not edit. Regenerate with `just cli-skills`.

## `fzf --help`

```text
fzf is an interactive filter program for any kind of list.

It implements a "fuzzy" matching algorithm, so you can quickly type in patterns
with omitted characters and still get the results you want.

Project URL: https://github.com/junegunn/fzf

* See man page for more information: fzf --man

Usage: fzf [options]

  SEARCH
    -e, --exact              Enable exact-match
    +x, --no-extended        Disable extended-search mode
    -i, --ignore-case        Case-insensitive match
    +i, --no-ignore-case     Case-sensitive match
        --smart-case         Smart-case match (default)
    --scheme=SCHEME          Scoring scheme [default|path|history]
    -n, --nth=N[,..]         Comma-separated list of field index expressions
                             for limiting search scope. Each can be a non-zero
                             integer or a range expression ([BEGIN]..[END]).
    --with-nth=N[,..]        Transform the presentation of each line using
                             field index expressions
    --accept-nth=N[,..]      Define which fields to print on accept
    -d, --delimiter=STR      Field delimiter regex (default: AWK-style)
    +s, --no-sort            Do not sort the result
    --literal                Do not normalize latin script letters
    --tail=NUM               Maximum number of items to keep in memory
    --disabled               Do not perform search
    --tiebreak=CRI[,..]      Comma-separated list of sort criteria to apply
                             when the scores are tied
                             [length|chunk|pathname|begin|end|index] (default: length)

  INPUT/OUTPUT
    --read0                  Read input delimited by ASCII NUL characters
    --print0                 Print output delimited by ASCII NUL characters
    --ansi                   Enable processing of ANSI color codes
    --sync                   Synchronous search for multi-staged filtering

  GLOBAL STYLE
    --style=PRESET           Apply a style preset [default|minimal|full[:BORDER_STYLE]
    --color=COLSPEC          Base scheme (dark|light|base16|bw) and/or custom colors
    --no-color               Disable colors
    --no-bold                Do not use bold text

  DISPLAY MODE
    --height=[~][-]HEIGHT[%] Display fzf window below the cursor with the given
                             height instead of using fullscreen.
                             A negative value is calculated as the terminal height
                             minus the given value.
                             If prefixed with '~', fzf will determine the height
                             according to the input size.
    --min-height=HEIGHT[+]   Minimum height when --height is given as a percentage.
                             Add '+' to automatically increase the value
                             according to the other layout options (default: 10+).
    --popup[=OPTS]           Start fzf in a floating pane (requires tmux 3.3+ or Zellij 0.44+)
                             [center|top|bottom|left|right][,SIZE[%]][,SIZE[%]]
                             [,border-native] (default: center,50%)
    --tmux[=OPTS]            Alias for --popup

  LAYOUT
    --layout=LAYOUT          Choose layout: [default|reverse|reverse-list]
    --margin=MARGIN          Screen margin (TRBL | TB,RL | T,RL,B | T,R,B,L)
    --padding=PADDING        Padding inside border (TRBL | TB,RL | T,RL,B | T,R,B,L)
    --border[=STYLE]         Draw border around the finder
                             [rounded|sharp|bold|block|thinblock|double|dashed|horizontal|vertical|
                              top|bottom|left|right|line|none] (default: rounded)
    --border-label=LABEL     Label to print on the border
    --border-label-pos=COL   Position of the border label
                             [POSITIVE_INTEGER: columns from left|
```
