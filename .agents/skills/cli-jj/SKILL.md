---
name: cli-jj
description: Use `jj` (jj 0.46.0): Jujutsu, a Git-compatible version control system.
---

# jj 0.46.0

Binary: `jj`. Declared in `tools.toml`; install or update with `ay up jj`.
Generated from the tool manual; do not edit. Regenerate with `just cli-skills`.

Subcommands: `abandon`, `absorb`, `arrange`, `bisect`, `bookmark`, `commit`, `config`, `converge`, `describe`, `diff`, `diffedit`, `duplicate`, `edit`, `evolog`, `file`, `fix`, `gerrit`, `git`, `interdiff`, `log`, `metaedit`, `new`, `next`, `operation`. Details: `jj <subcommand> --help`.

## `jj --help`

```text
Jujutsu (An experimental VCS)

To get started, see the tutorial at [`jj help -k tutorial`][tutorial].

[tutorial]: https://docs.jj-vcs.dev/latest/tutorial/

Usage: jj.exe [OPTIONS] <COMMAND>

Commands:
  abandon           Abandon a revision
  absorb            Move changes from a revision into the stack of mutable revisions
  arrange           Interactively arrange the commit graph
  bisect            Find a bad revision by bisection
  bookmark          Manage bookmarks [default alias: b]
  commit            Update the description and create a new change on top [default alias: ci]
  config            Manage config options
  converge          Converge divergent changes
  describe          Update the change description or other metadata [default alias: desc]
  diff              Compare file contents between two revisions
  diffedit          Touch up the content changes in a revision with a diff editor
  duplicate         Create new changes with the same content as existing ones
  edit              Sets the specified revision as the working-copy revision
  evolog            Show how a change has evolved over time [alias: evolution-log]
  file              File operations
  fix               Update files with formatting fixes or other changes
  gerrit            Interact with Gerrit Code Review
  git               Commands for working with Git remotes and the underlying Git repo
  help              Print this message or the help of the given subcommand(s)
  interdiff         Show differences between the diffs of two revisions
  log               Show revision history
  metaedit          Modify the metadata of a revision without changing its content
  new               Create a new, empty change and (by default) edit it in the working copy
  next              Move the working-copy commit to the child revision
  operation         Commands for working with the operation log [alias: op]
  parallelize       Parallelize revisions by making them siblings
  prev              Change the working copy revision relative to the parent revision
  rebase            Move revisions to different parent(s)
  redo              Redo the most recently undone operation
  resolve           Resolve conflicted files with an external merge tool
  restore           Restore paths from another revision
  revert            Apply the reverse of the given revision(s)
  root              Show the current workspace root directory (shortcut for `jj workspace root`)
  run               Run a command across a set of revisions.
  show              Show revision metadata and diff
  sign              Cryptographically sign a revision
  simplify-parents  Simplify parent edges for the specified revision(s)
  sparse            Manage which paths from the working-copy commit are present in the working copy
  split             Split a revision in two
  squash            Move changes from a revision into another revision
  status            Show high-level repo status [default alias: st]
  tag               Manage tags
  undo              Undo the last operation
  unsign            Drop a cryptographic signature
  util              Infrequently used commands such as for generating shell completions
  version           Display version information
  workspace         Commands for working with workspaces

Options:
  -h, --help
          Print help (see a summary with '-h')

  -V, --version
          Print version

Global Options:
  -R, --repository <REPOSITORY>
          Path to repository to operate on

          By default, Jujutsu searches for the closest .jj/ directory in an ancestor of the current
          working directory.
```
