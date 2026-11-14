---
name: cli-yq
description: Use `yq` (yq 4.54.3): Portable command-line processor for YAML, JSON, TOML and XML.
---

# yq 4.54.3

Binary: `yq`. Declared in `tools.toml`; install or update with `ay up yq`.
Generated from the tool manual; do not edit. Regenerate with `just cli-skills`.

Subcommands: `completion`, `eval`, `eval-all`. Details: `yq <subcommand> --help`.

## `yq --help`

```text
yq is a portable command-line data file processor (https://github.com/mikefarah/yq/)
See https://mikefarah.gitbook.io/yq/ for detailed documentation and examples.

Usage:
  yq [flags]
  yq [command]

Examples:

# yq tries to auto-detect the file format based off the extension, and defaults to YAML if it's unknown (or...
# Use the '-p/--input-format' flag to specify a format type.
cat file.xml | yq -p xml

# read the "stuff" node from "myfile.yml"
yq '.stuff' < myfile.yml

# update myfile.yml in place
yq -i '.stuff = "foo"' myfile.yml

# print contents of sample.json as idiomatic YAML
yq -P -oy sample.json

Available Commands:
  completion  Generate the autocompletion script for the specified shell
  eval        (default) Apply the expression to each document in each yaml file in sequence
  eval-all    Loads _all_ yaml documents of _all_ yaml files and runs expression once
  help        Help about any command

Flags:
  -C, --colors                                     force print with colors
      --csv-auto-parse                             parse CSV YAML/JSON values (default true)
      --csv-separator char                         CSV Separator character (default ,)
      --debug-node-info                            debug node info
  -e, --exit-status                                set exit status if there are no matches or null or false...
      --expression string                          forcibly set the expression argument. Useful when yq arg...
      --from-file string                           Load expression from specified file.
  -f, --front-matter string                        (extract|process) first input as yaml front-matter. Extr...
      --header-preprocess                          Slurp any header comments and separators before processi...
  -h, --help                                       help for yq
  -I, --indent int                                 sets indent level for output (default 2)
      --ini-key-value-delimiters string            sequence of delimiters used to separate keys and values ...
      --ini-preserve-quotes                        preserve surrounding quotes on INI values during round-trip
  -i, --inplace                                    update the file in place of first file given.
  -p, --input-format string                        [auto|a|yaml|y|kyaml|ky|json|j|props|p|csv|c|tsv|t|xml|x...
      --lua-globals                                output keys as top-level global variables
      --lua-prefix string                          prefix (default "return ")
      --lua-suffix string                          suffix (default ";\n")
      --lua-unquoted                               output unquoted string keys (e.g. {foo="bar"})
  -M, --no-colors                                  force print with no colors
  -N, --no-doc                                     Don't print document separators (---)
  -0, --nul-output                                 Use NUL char to separate values. If unwrap scalar is als...
  -n, --null-input                                 Don't read input, simply evaluate the expression given. ...
  -o, --output-format string                       [auto|a|yaml|y|kyaml|ky|json|j|props|p|csv|c|tsv|t|xml|x...
  -P, --prettyPrint                                pretty print, shorthand for '... style = ""'
      --properties-array-brackets                  use [x] in array paths (e.g. for SpringBoot)
      --properties-separator string                separator to use between keys and values (default " = ")
      --security-allow-write-any-path              Allow split-exp to write to paths outside the current di...
      --security-disable-env-ops                   Disable env related operations.
      --security-disable-file-ops                  Disable file related operations (e.g. load)
      --security-enable-system-operator            Enable system operator to allow execution of external co...
      --security-force-never-escape-shell-output   UNSAFE: with -o=shell -r, never quote or escape values (...
      --shell-key-separator string                 separator for shell variable key paths (default "_")
  -s, --split-exp string                           print each result (or doc) into a file named (exp). [exp...
      --split-exp-file string                      Use a file to specify the split-exp expression.
      --string-interpolation                       Toggles strings interpolation of \(exp) (default true)
      --tsv-auto-parse                             parse TSV YAML/JSON values (default true)
  -r, --unwrapScalar                               unwrap scalar, print the value with no quotes, colours o...
  -v, --verbose                                    verbose mode
  -V, --version                                    Print version information and quit
      --xml-attribute-prefix string                prefix for xml attributes (default "+@")
```
