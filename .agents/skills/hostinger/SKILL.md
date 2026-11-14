---
name: hostinger
description: "Manage Hostinger resources (VPS list/start/stop/restart, snapshots, backups, firewall rules, DNS zones and DNS snapshots, domains, subscriptions) through the Hostinger public API at https://developers.hostinger.com with the HOSTINGER_API_TOKEN bearer token, the hostinger-api MCP server, or the hostinger CLI."
---

# Hostinger API

Endpoints below were checked against the Hostinger OpenAPI spec (no local copy in the repository). Re-check the spec before using a new route.

## Credentials

- Key name: `HOSTINGER_API_TOKEN`. Sources: `.env`, Windows user env,
  `/etc/aphrody/hostinger.env` on vps/cdn/prd, GitHub Actions secret, gcloud
  Secret Manager `hostinger-api-token`, Cloudflare Secrets Store
  `default-secrets-store`.
- Never put the value on a command line (no `curl -H`, no `xh -a`): call the API from Bun code (below), which reads it from the environment.

## Calling the API

Base URL `https://developers.hostinger.com`, header `Authorization: Bearer $HOSTINGER_API_TOKEN`.

```ts
const res = await fetch(
  "https://developers.hostinger.com/api/vps/v1/virtual-machines",
  {
    headers: { Authorization: `Bearer ${Bun.env.HOSTINGER_API_TOKEN}` },
  },
);
```

## Host mapping

Only `prd` (72.60.186.43, `srv2116886.hstgr.cloud`) is a Hostinger VM: id `2116886`
(`hostinger_id` in `apps/rosegriffon/infra/hosts.toml`). `vps` and `cdn` are not on Hostinger.

## VPS

| Method | Path                                                                         |
| ------ | ---------------------------------------------------------------------------- |
| GET    | `/api/vps/v1/virtual-machines`                                               |
| GET    | `/api/vps/v1/virtual-machines/{virtualMachineId}`                            |
| POST   | `/api/vps/v1/virtual-machines/{virtualMachineId}/start` / `stop` / `restart` |
| GET    | `/api/vps/v1/virtual-machines/{virtualMachineId}/metrics`                    |
| GET    | `/api/vps/v1/virtual-machines/{virtualMachineId}/actions`                    |
| GET    | `/api/vps/v1/virtual-machines/{virtualMachineId}/backups`                    |

## Snapshots (one per VM)

| Method            | Path                                                               |
| ----------------- | ------------------------------------------------------------------ |
| GET, POST, DELETE | `/api/vps/v1/virtual-machines/{virtualMachineId}/snapshot`         |
| POST              | `/api/vps/v1/virtual-machines/{virtualMachineId}/snapshot/restore` |

Creating a snapshot overwrites the existing one.

## Firewall

| Method      | Path                                                              |
| ----------- | ----------------------------------------------------------------- |
| GET, POST   | `/api/vps/v1/firewall`                                            |
| GET, DELETE | `/api/vps/v1/firewall/{firewallId}`                               |
| POST        | `/api/vps/v1/firewall/{firewallId}/rules`                         |
| PUT, DELETE | `/api/vps/v1/firewall/{firewallId}/rules/{ruleId}`                |
| POST        | `/api/vps/v1/firewall/{firewallId}/activate/{virtualMachineId}`   |
| POST        | `/api/vps/v1/firewall/{firewallId}/deactivate/{virtualMachineId}` |
| POST        | `/api/vps/v1/firewall/{firewallId}/sync/{virtualMachineId}`       |

Keep an SSH allow rule before activating a firewall on prd.

## DNS and domains

| Method           | Path                                                  |
| ---------------- | ----------------------------------------------------- |
| GET, PUT, DELETE | `/api/dns/v1/zones/{domain}`                          |
| GET              | `/api/dns/v1/snapshots/{domain}`                      |
| GET              | `/api/dns/v1/snapshots/{domain}/{snapshotId}`         |
| POST             | `/api/dns/v1/snapshots/{domain}/{snapshotId}/restore` |
| GET              | `/api/domains/v1/portfolio`                           |
| GET              | `/api/billing/v1/subscriptions`                       |

Our public zones are on Cloudflare; Hostinger DNS only matters for domains still delegated to Hostinger.

## Tooling

- MCP: the token server `hostinger-api` is declared `state = "absent"` in `infra/agents/toolchain.toml` (not installed); upstream is `hostinger/api-mcp-server` on GitHub. Skill `cli-hostinger-api-mcp` covers it.
- CLI: `hostinger/api-cli` on GitHub (Go; `go build` gives `hostinger`); not installed on the PC.
- SDK: `hostinger/api-typescript-sdk`. Upstream skills: `hostinger/hostinger-agent-skills`.
