---
name: cli-fastfetch
description: Use `fastfetch` (fastfetch 2.71.0): Fastfetch is a neofetch-like tool for fetching system information and displaying them in a pretty way
---

# fastfetch 2.71.0

Binary: `fastfetch`. Declared in `tools.toml`; install or update with `ay up fastfetch`.
Generated from the tool manual; do not edit. Regenerate with `just cli-skills`.

## `fastfetch --help`

```text
Fastfetch is a neofetch-like tool for fetching system information and displaying them in a pretty way

Usage: fastfetch <?options>

Informative options:
  -h, --help <?command>: Show this help message or help for a specific command
  -v, --version: Show the full Fastfetch version
      --version-raw: Show the raw version string (major.minor.patch)
      --list-config-paths: List search paths for config files
      --list-data-paths: List search paths for presets and logos
      --list-logos: List available logos
      --list-modules: List available modules
      --list-presets: List available presets
      --list-features: List the supported features that fastfetch was compiled with
      --print-logos: Show available logos
      --print-structure: Show the default structure
      --format <enum>: Set the output format
  -j, --json <?bool>: Enable or disable JSON output
      --dynamic-interval <num>: Keep Fastfetch running and refresh the output every <num> milliseconds
  -w, --watch <?num>: Alias of dynamic-interval, but the value is in seconds instead of milliseconds. If no...

Config options:
  -c, --config <config>: Specify the config file or preset to load
      --gen-config <?path>: Interactively generate a config file at the specified path

General options:
      --thread <?bool>: Use separate threads for HTTP requests
      --wmi-timeout <num>: Set the timeout (ms) for WMI queries
      --processing-timeout <num>: Set the timeout (ms) when waiting for child processes
      --ds-force-drm <?enum>: Specify whether display detection should use DRM only
      --detect-version <?bool>: Specify whether to detect and display versions for terminal, shell, editor,...

Logo options:
  -l, --logo <logo>: Set the logo source. Use "none" to disable logo output
      --logo-type <enum>: Set the type of logo specified by "--logo"
      --logo-spin-speed-per-frame <num>: Set how far the spin logo turns per drawn frame, in degrees
      --logo-spin-speed-per-round <num>: Set how many seconds one revolution of the spin logo takes
      --logo-spin-tilt <num>: Set the camera tilt of the spin logo, in degrees
      --logo-spin-angle <num>: Set the rotation of the first spin logo frame, in degrees
      --logo-width <num>: Set the width of the logo (in characters) if it is an image
      --logo-height <num>: Set the height of the logo (in characters) if it is an image
      --logo-preserve-aspect-ratio <?bool>: Specify whether the logo should fill the specified width and he...
      --logo-color-[1-9] <color>: Override a color in the logo
      --logo-padding <num>: Set the padding on the left and right sides of the logo
      --logo-padding-left <num>: Set the padding on the left side of the logo
      --logo-padding-right <num>: Set the padding on the right side of the logo
      --logo-padding-top <num>: Set the padding at the top of the logo
      --logo-padding-bottom <num>: Set the padding at the bottom of the logo
      --logo-print-remaining <?bool>: Specify whether to print remaining logo lines when the logo is taller...
      --logo-position <enum>: Set the display position of the logo
      --logo-cache <?enum>: Specify how the image logo cache is used
      --logo-animation-frame <?num>: Select which frame of an animated image logo to render
      --file <path>: Short for --logo-type file --logo <path>
      --file-raw <path>: Short for --logo-type file-raw --logo <path>
      --data <data>: Short for --logo-type data --logo <data>
      --data-raw <data>: Short for --logo-type data-raw --logo <data>
      --raw <path>: Short for --logo-type raw --logo <path>
      --sixel <path>: Short for --logo-type sixel --logo <path>
      --kitty <path>: Short for --logo-type kitty --logo <path>
      --kitty-direct <path>: Short for --logo-type kitty-direct --logo <path>
      --kitty-icat <path>: Short for --logo-type kitty-icat --logo <path>
      --iterm <path>: Short for --logo-type iterm --logo <path>
      --chafa <path>: Short for --logo-type chafa --logo <path>
      --chafa-fg-only <?bool>: Produce character-cell output using foreground colors only
      --chafa-symbols <str>: Specify character symbols to employ in final output
      --chafa-canvas-mode <enum>: Determine how colors are used in the output
      --chafa-color-space <enum>: Set the color space used for quantization
      --chafa-dither-mode <enum>: Set the output dithering mode (no effect with 24-bit color)

Display options:
```
