---
name: cli-dist
description: Use `dist` (dist 0.34.0): Professional packaging and distribution for ambitious developers.
---

# dist 0.34.0

Binary: `dist`. Declared in `tools.toml`; install or update with `ay up dist`.
Generated from the tool manual; do not edit. Regenerate with `just cli-skills`.

Subcommands: `build`, `init`, `migrate`, `generate`, `linkage`, `manifest`, `plan`, `host`, `selfupdate`. Details: `dist <subcommand> --help`.

## `dist --help`

```text
Professional packaging and distribution for ambitious developers.

See 'init', 'build' and 'plan' for the 3 most important subcommands.

Usage: dist [OPTIONS]
       dist <COMMAND>

Commands:
  build       Build artifacts
  init        Setup or update dist
  migrate     Migrate to the latest configuration variant
  generate    Generate one or more pieces of configuration
  linkage     Report on the dynamic libraries used by the built artifacts
  manifest    Generate the final build manifest without running any builds
  plan        Get a plan of what to build (and check project status)
  host        Host artifacts
  selfupdate  Performs a self-update, if a new version is available, and then 'init'
  help        Print this message or the help of the given subcommand(s)

Options:
  -h, --help
          Print help (see a summary with '-h')

  -V, --version
          Print version

GLOBAL OPTIONS:
  -v, --verbose <VERBOSE>
          How verbose logging should be (log level)

          [default: warn]
          [possible values: off, error, warn, info, debug, trace]

  -o, --output-format <OUTPUT_FORMAT>
          The format of the output

          [default: human]
          [possible values: human, json]

      --no-local-paths
          Strip local paths from output (e.g. in the dist manifest json)

          This is useful for generating a clean "full" manifest as follows:

          `dist manifest --artifacts=all --output-format=json --no-local-paths`

  -t, --target <TARGET>
          Target triples we want to build

          If left unspecified we will use the values in [workspace.metadata.dist], except for `dist init` w...

  -i, --installer <INSTALLER>
          Installers we want to build

          If left unspecified we will use the values in [workspace.metadata.dist]. `dist init` will persist...

          Possible values:
          - shell:      Generates a shell script that fetches/installs the right build
          - powershell: Generates a powershell script that fetches/installs the right build
          - npm:        Generates an npm project that fetches the right build to your node_modules
          - homebrew:   Generates a Homebrew formula
          - msi:        Generates an msi for each windows platform

  -c, --ci <CI>
          CI we want to support

          If left unspecified we will use the value in [workspace.metadata.dist]. `dist init` will persist ...

          Possible values:
          - github: Generate github CI that uploads to github releases
```
