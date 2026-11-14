---
name: cli-cloudflared
description: Use `cloudflared` (cloudflared 2026.10.7): cloudflared - Cloudflare's command-line tool and agent
---

# cloudflared 2026.10.7

Binary: `cloudflared`. Declared in `tools.toml`; install or update with `ay up cloudflared`.
Generated from the tool manual; do not edit. Regenerate with `just cli-skills`.

Subcommands: `update`, `version`, `proxy-dns`, `tail`, `service`, `access`, `tunnel`. Details: `cloudflared <subcommand> --help`.

## `cloudflared --help`

```text
NAME:
   cloudflared - Cloudflare's command-line tool and agent

USAGE:
   cloudflared [global options] [command] [command options]

VERSION:
   2026.10.7 (built 2026-10-30T09:43 UTC)

DESCRIPTION:
   cloudflared connects your machine or user identity to Cloudflare's global network.
     You can use it to authenticate a session to reach an API behind Access, route web traffic to this mach...
     and configure access control.

     See https://developers.cloudflare.com/cloudflare-one/connections/connect-apps for more in-depth docume...

COMMANDS:
   update     Update the agent if a new version exists
   version    Print the version
   proxy-dns  dns-proxy feature is no longer supported
   tail       Stream logs from a remote cloudflared
   service    Manages the cloudflared Windows service
   help, h    Shows a list of commands or help for one command
   Access:
     access, forward  access <subcommand>
   Tunnel:
     tunnel  Use Cloudflare Tunnel to expose private services to the Internet or to Cloudflare connected pr...

GLOBAL OPTIONS:
   --output value                               Output format for the logs (default, json) (default: "defau...
   --proxy-dns                                  (default: false)
   --proxy-dns-port value                       (default: 0)
   --proxy-dns-address value
   --proxy-dns-upstream value                   (accepts multiple inputs)
   --proxy-dns-max-upstream-conns value         (default: 0)
   --proxy-dns-bootstrap value                  (accepts multiple inputs)
   --credentials-file value, --cred-file value  Filepath at which to read/write the tunnel credentials [%TU...
   --region value                               Cloudflare Edge region to connect to. Omit or set to empty ...
   --edge-ip-version value                      Cloudflare Edge IP address version to connect with. {4, 6, ...
   --edge-bind-address value                    Bind to IP address for outgoing connections to Cloudflare E...
   --label value                                Use this option to give a meaningful label to a specific co...
   --post-quantum, --pq                         When given creates an experimental post-quantum secure tunn...
   --management-diagnostics                     Enables the in-depth diagnostic routes to be made available...
   --overwrite-dns, -f                          Overwrites existing DNS records with this hostname (default...
   --help, -h                                   show help (default: false)
   --version, -v, -V                            Print the version (default: false)

COPYRIGHT:
   (c) 2026 Cloudflare Inc.
   Your installation of cloudflared software constitutes a symbol of your signature indicating that you accept
   the terms of the Apache License Version 2.0 (https://developers.cloudflare.com/cloudflare-one/connection...
   Terms (https://www.cloudflare.com/terms/) and Privacy Policy (https://www.cloudflare.com/privacypolicy/).
```
