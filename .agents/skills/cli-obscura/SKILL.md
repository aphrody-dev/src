---
name: cli-obscura
description: Use `obscura` (obscura 0.2.7): Obscura - A lightweight headless browser for web scraping and automation
---

# obscura 0.2.7

Binary: `obscura`. Declared in `tools.toml`; install or update with `ay up obscura`.
Generated from the tool manual; do not edit. Regenerate with `just cli-skills`.

Subcommands: `serve`, `fetch`, `scrape`, `mcp`. Details: `obscura <subcommand> --help`.

## `obscura --help`

```text
Obscura - A lightweight headless browser for web scraping and automation

Usage: obscura.exe [OPTIONS] [COMMAND]

Commands:
  serve
  fetch
  scrape
  mcp
  help    Print this message or the help of the given subcommand(s)

Options:
  -v, --verbose
  -p, --port <PORT>                [default: 9222]
      --proxy <PROXY>
      --stealth                    Enable stealth mode (consistent browser fingerprint, and with the `steal...
      --obey-robots                Respect robots.txt before navigating to an HTTP(S) URL. Global: applies ...
      --user-agent <USER_AGENT>    Override the User-Agent sent with every request. Global: applies to fetc...
      --storage-dir <STORAGE_DIR>
      --allow-private-network      Permit fetches to loopback, RFC1918, and link-local addresses. Default i...
      --v8-flags <FLAGS>           Pass raw flags to V8, in the same form V8/Chromium/Node accept (e.g. `"-...
  -h, --help                       Print help
  -V, --version                    Print version
```
