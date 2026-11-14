---
name: cli-xh
description: Use `xh` (xh 0.26.3): xh is a friendly and fast tool for sending HTTP requests
---

# xh 0.26.3

Binary: `xh`. Declared in `tools.toml`; install or update with `ay up xh`.
Generated from the tool manual; do not edit. Regenerate with `just cli-skills`.

## `xh --help`

```text
xh is a friendly and fast tool for sending HTTP requests

Usage: xh.exe [OPTIONS] <[METHOD] URL> [REQUEST_ITEM]...

Arguments:
  <[METHOD] URL>     The request URL, preceded by an optional HTTP method
  [REQUEST_ITEM]...  Optional key-value pairs to be included in the request.

Options:
  -j, --json
          (default) Serialize data items from the command line as a JSON object
  -f, --form
          Serialize data items from the command line as form fields
      --multipart
          Like --form, but force a multipart/form-data request even without files
      --raw <RAW>
          Pass raw request data without extra processing
      --pretty <STYLE>
          Controls output processing [possible values: all, colors, format, none]
      --format-options <FORMAT_OPTIONS>
          Set output formatting options
  -s, --style <THEME>
          Output coloring style [possible values: auto, solarized, monokai, fruity]
      --response-charset <ENCODING>
          Override the response encoding for terminal display purposes
      --response-mime <MIME_TYPE>
          Override the response mime type for coloring and formatting for the terminal
  -p, --print <FORMAT>
          String specifying what the output should contain
  -h, --headers
          Print only the response headers. Shortcut for --print=h
  -b, --body
          Print only the response body. Shortcut for --print=b
  -m, --meta
          Print only the response metadata. Shortcut for --print=m
  -v, --verbose...
          Print the whole request as well as the response
      --debug
          Print full error stack traces and debug log messages
      --all
          Show any intermediary requests/responses while following redirects with --follow
  -P, --history-print <FORMAT>
          The same as --print but applies only to intermediary requests/responses
  -q, --quiet...
          Do not print to stdout or stderr
  -S, --stream
          Always stream the response body
  -x, --compress...
          Content compressed (encoded) with Deflate algorithm
  -o, --output <FILE>
          Save output to FILE instead of stdout
  -d, --download
          Download the body to a file instead of printing it
  -c, --continue
          Resume an interrupted download. Requires --download and --output
      --session <FILE>
          Create, or reuse and update a session
      --session-read-only <FILE>
          Create or read a session without updating it from the request/response exchange
  -A, --auth-type <AUTH_TYPE>
          Specify the auth mechanism [possible values: basic, bearer, digest]
  -a, --auth <USER[:PASS] | TOKEN>
          Authenticate as USER with PASS (-A basic|digest) or with TOKEN (-A bearer)
      --ignore-netrc
          Do not use credentials from .netrc
      --offline
          Construct HTTP requests without sending them anywhere
      --check-status
          (default) Exit with an error status code if the server replies with an error
  -F, --follow
```
