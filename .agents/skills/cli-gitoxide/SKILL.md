---
name: cli-gitoxide
description: Use `gix` (gitoxide 0.61.0): The git underworld
---

# gitoxide 0.61.0

Binary: `gix`. Declared in `tools.toml`; install or update with `ay up gitoxide`.
Generated from the tool manual; do not edit. Regenerate with `just cli-skills`.

Subcommands: `archive`, `branch`, `clean`, `commit-graph`, `odb`, `fsck`, `tree`, `commit`, `tag`, `verify`, `revision`, `credential`, `fetch`, `clone`, `mailmap`, `remote`, `attributes`, `exclude`, `index`, `submodule`, `cat`, `is-clean`, `is-changed`, `config-tree`. Details: `gix <subcommand> --help`.

## `gix --help`

```text
The git underworld

Usage: gix.exe [OPTIONS] <COMMAND>

Commands:
  archive       Subcommands for creating worktree archives
  branch        Interact with branches [aliases: branches]
  clean         Remove untracked files from the working tree
  commit-graph  Subcommands for interacting with commit-graph files
  odb           Interact with the object database
  fsck          Check for missing objects
  tree          Interact with tree objects
  commit        Interact with commit objects
  tag           Interact with tag objects [aliases: tags]
  verify        Verify the integrity of the entire repository
  revision      Query and obtain information about revisions [aliases: rev, r]
  credential    A program just like `git credential`
  fetch         Fetch data from remotes and store it in the repository
  clone         Clone a repository into a new directory
  mailmap       Interact with the mailmap
  remote        Interact with the remote hosts [aliases: remotes]
  attributes    Interact with the attribute files like .gitattributes [aliases: attrs]
  exclude       Interact with the exclude files like .gitignore
  index         Interact with a worktree index like .git/index
  submodule     Interact with submodules
  cat           Show whatever object is at the given spec
  is-clean      Check for changes in the repository, treating this as an error
  is-changed    Check for changes in the repository, treating their absence as an error
  config-tree   Show which git configuration values are used or planned
  status        Compute repository status similar to `git status`
  dirwalk       Run only the repository directory walk
  config        Print all entries in a configuration file or access other sub-commands
  merge-base    A command for calculating all merge-bases
  merge         Perform merges of various kinds
  env           Print paths relevant to the Git installation
  editor        Open paths in the editor selected by Git's precedence rules
  diff          Print all changes between two objects
  log           List all commits in a repository, optionally limited to those that change a given path
  tix           Interactively browse commits and their graph [aliases: tui, interactive, i]
  worktree      Commands for handling worktrees
  free          Subcommands that need no Git repository to run [aliases: no-repo]
  blame         Blame lines in a file
  completions   Generate shell completions to stdout or a directory [aliases: generate-completions, shell-c...
  help          Print this message or the help of the given subcommand(s)

Options:
  -r, --repository <REPOSITORY>
          The repository to access

          [default: .]

  -c, --config <CONFIG>
          Add these values to the configuration in the form of `key=value` or `key`.

          For example, if `key` is `core.abbrev`, set configuration like `[core] abbrev = key`, or `remote....

      --threads <THREADS>
          The amount of threads to use for some operations.

          If unset, or the value is 0, there is no limit and all logical cores can be used.

  -v, --verbose
          Display verbose messages and progress information

  -t, --trace...
          Display tracing output; repeat for more detail and a flat format.

          Once is forest-formatted at `info`, twice is forest-formatted at `debug`, three times is flat at ...

      --no-verbose
```
