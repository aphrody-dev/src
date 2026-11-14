---
name: cli-agent-browser
description: Use `agent-browser` (agent-browser 0.43.0): agent-browser - fast browser automation CLI for AI agents
---

# agent-browser 0.43.0

Binary: `agent-browser`. Declared in `tools.toml`; install or update with `ay up agent-browser`.
Generated from the tool manual; do not edit. Regenerate with `just cli-skills`.

## `agent-browser --help`

```text
agent-browser - fast browser automation CLI for AI agents

Usage: agent-browser <command> [args] [options]

Unknown commands exit with status 1, including when help is requested.

Start here (for AI agents):
  agent-browser skills get core

  Skills ship with the CLI (always version-matched) and include workflow
  patterns, ref/selector usage, and copy-paste examples. Prefer this over
  guessing commands from flag docs alone. The core guide routes to its
  references for detail; --full prints all of them at once. Specialized
  skills cover Electron apps, Slack, exploratory testing, protected Vercel
  deployments, and cloud browser providers.

  skills [list]                List available skills
  skills get core              Core usage guide (overview + common patterns)
  skills get core --full       Include full command reference and templates
  skills get core --ref <ref>  Load one reference, e.g. --ref commands
  skills get <name>            Load a specialized skill (electron, slack, ...)
  skills path [name]           Print skill directory path

Core Commands:
  open <url>                 Navigate to URL
  read [url]                 Fetch agent-readable text
  click <sel>                Click element (or @ref)
  dblclick <sel>             Double-click element
  type <sel> <text>          Type into element
  fill <sel> <text>          Clear and fill
  press <key>                Press key (Enter, Tab, Control+a)
  keyboard type <text>       Type text with real keystrokes (no selector)
  keyboard inserttext <text> Insert text without key events
  hover <sel>                Hover element
  focus <sel>                Focus element
  check <sel>                Check checkbox
  uncheck <sel>              Uncheck checkbox
  select <sel> <val...>      Select dropdown by value or visible label
  drag <src> <dst>           Drag and drop
  upload <sel> <files...>    Upload files
  download <sel> <path>      Download file by clicking element
  scroll <dir> [px]          Scroll (up/down/left/right)
  scrollintoview <sel>       Scroll element into view
  wait <sel|ms>              Wait for element or time
  screenshot [path]          Take screenshot
  pdf <path>                 Save as PDF
  snapshot                   Accessibility tree with refs (for AI)
  eval <js>                  Run JavaScript
  connect <port|url>         Connect to browser via CDP
  close [--all]              Close browser (--all closes every session)

Navigation:
  back                       Go back
  forward                    Go forward
  reload                     Reload page

Get Info:  agent-browser get <what> [selector]
  text, html, value, attr <name>, title, url, count, box, styles, cdp-url

Check State:  agent-browser is <what> <selector>
  visible, enabled, checked

Find Elements:  agent-browser find <locator> <value> <action> [text]
  role, text, label, placeholder, alt, title, testid, first, last, nth

Mouse:  agent-browser mouse <action> [args]
  move <x> <y>, down [btn], up [btn], wheel <dy> [dx]

Browser Settings:  agent-browser set <setting> [value]
  viewport <w> <h>, device <name>, geo <lat> <lng>
```
