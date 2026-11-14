---
name: cli-oha
description: Use `oha` (oha 1.17.0): HTTP load generator with a terminal UI.
---

# oha 1.17.0

Binary: `oha`. Declared in `tools.toml`; install or update with `ay up oha`.
Generated from the tool manual; do not edit. Regenerate with `just cli-skills`.

## `oha --help`

```text
Ohayou(), HTTP load generator, inspired by rakyll/hey with tui animation.

Usage: oha.exe [OPTIONS] [URL]

Arguments:
  [URL]  Target URL or file with multiple URLs.

Options:
  -n <N_REQUESTS>
          Number of requests to run. Accepts plain numbers or suffixes: k = 1,000, m = 1,000,000 (e.g. 10k,...
  -c <N_CONNECTIONS>
          Number of connections to run concurrently. You may should increase limit to number of open files ...
  -p <N_HTTP2_PARALLEL>
          Number of parallel requests to send on HTTP/2. `oha` will run c * p concurrent workers in total. ...
  -z <DURATION>
          Duration of application to send requests.
          On HTTP/1, When the duration is reached, ongoing requests are aborted and counted as "aborted due...
          You can change this behavior with `-w` option.
          Currently, on HTTP/2, When the duration is reached, ongoing requests are waited. `-w` option is i...
          Examples: -z 10s -z 3m.
  -w, --wait-ongoing-requests-after-deadline
          When the duration is reached, ongoing requests are waited
  -q <QUERY_PER_SECOND>
          Rate limit for all, in queries per second (QPS)
      --burst-delay <BURST_DURATION>
          Introduce delay between a predefined number of requests.
          Note: If qps is specified, burst will be ignored
      --burst-rate <BURST_REQUESTS>
          Rates of requests for burst. Default is 1
          Note: If qps is specified, burst will be ignored
      --rand-regex-url
          Generate URL by rand_regex crate but dot is disabled for each query e.g. http://127.0.0.1/[a-z][a...
      --urls-from-file
          Read the URLs to query from a file
      --max-repeat <MAX_REPEAT>
          A parameter for the '--rand-regex-url'. The max_repeat parameter gives the maximum extra repeat c...
      --dump-urls <DUMP_URLS>
          Dump target Urls <DUMP_URLS> times to debug --rand-regex-url
      --latency-correction
          Correct latency to avoid coordinated omission problem. It's ignored if neither -q nor --burst-del...
      --no-tui
          No realtime tui
      --fps <FPS>
          Frame per second for tui. [default: 16]
  -m, --method <METHOD>
          HTTP method [default: GET]
  -H <HEADERS>
          Custom HTTP header. Examples: -H "foo: bar"
      --proxy-header <PROXY_HEADERS>
          Custom Proxy HTTP header. Examples: --proxy-header "foo: bar"
  -t <TIMEOUT>
          Timeout for each request. Default to infinite.
      --connect-timeout <CONNECT_TIMEOUT>
          Timeout for establishing a new connection. Default to 5s. [default: 5s]
  -A <ACCEPT_HEADER>
          HTTP Accept Header.
  -d <BODY_STRING>
          HTTP request body.
  -D <BODY_PATH>
          HTTP request body from file.
  -Z <BODY_PATH_LINES>
          HTTP request body from file line by line.
  -F, --form <FORM>
          Specify HTTP multipart POST data (curl compatible). Examples: -F 'name=value' -F 'file=@path/to/f...
  -T <CONTENT_TYPE>
          Content-Type.
  -a <BASIC_AUTH>
          Basic authentication (username:password), or AWS credentials (access_key:secret_key)
      --aws-session <AWS_SESSION>
          AWS session token
```
