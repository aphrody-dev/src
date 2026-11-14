---
name: cli-ollama
description: Use `ollama` (ollama 0.40.16): Large language model runner
---

# ollama 0.40.16

Binary: `ollama`. Declared in `tools.toml`; install or update with `ay up ollama`.
Generated from the tool manual; do not edit. Regenerate with `just cli-skills`.

Subcommands: `serve`, `create`, `show`, `run`, `stop`, `pull`, `push`, `signin`, `signout`, `list`, `ps`, `cp`, `rm`, `launch`. Details: `ollama <subcommand> --help`.

## `ollama --help`

```text
Large language model runner

Usage:
  ollama [flags]
  ollama [command]

Available Commands:
  serve        Start Ollama
  create       Create a model
  show         Show information for a model
  run          Run a model
  stop         Stop a running model
  pull         Pull a model from a registry
  push         Push a model to a registry
  signin       Sign in to ollama.com
  signout      Sign out from ollama.com
  list         List models
  ps           List running models
  cp           Copy a model
  rm           Remove a model
  launch       Launch the Ollama menu or an integration
  help         Help about any command

Flags:
  -h, --help         help for ollama
      --nowordwrap   Don't wrap words to the next line automatically
      --verbose      Show timings for response
  -v, --version      Show version information

Use "ollama [command] --help" for more information about a command.
```
