---
name: cli-hostinger-api-mcp
description: Use `hostinger-api-mcp` (hostinger-api-mcp 3.38.3): MCP server exposing the Hostinger API.
---

# hostinger-api-mcp 3.38.3

Binary: `hostinger-api-mcp`. Declared in `tools.toml`; install or update with `ay up hostinger-api-mcp`.
Generated from the tool manual; do not edit. Regenerate with `just cli-skills`.

## `hostinger-api-mcp --help`

```text
      hostinger-api-mcp
      Usage: hostinger-api-mcp [options]
      Options:
        --http               Use HTTP streaming transport (requires HOSTINGER_API_TOKEN env var)
        --stdio              Use standard input/output transport (default)
        --host <host>        Host to bind to (default: 127.0.0.1)
        --port <port>        Port to bind to (default: 8100)
        --login              Run OAuth sign-in flow and exit
        --logout             Revoke stored OAuth credentials and exit
        --version, -v        Show version number
        --help               Show this help message
      Environment Variables:
        HOSTINGER_API_TOKEN  Hostinger API token (overrides OAuth when set)
        API_TOKEN            Deprecated alias for HOSTINGER_API_TOKEN (will be removed in a future version)
        OAUTH_ISSUER         OAuth server base URL (default: https://auth.hostinger.com)
        DEBUG                Enable debug logging (true/false)
```
