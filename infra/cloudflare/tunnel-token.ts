#!/usr/bin/env bun
// Print a tunnel's connector token on stdout, for piping straight into systemd-creds on the host (never to a file/log).
//   bun infra/cloudflare/tunnel-token.ts <name> | ssh <host> 'sudo systemd-creds encrypt --name=cloudflared-<name> - /etc/credstore.encrypted/cloudflared-<name>'
import { api, cfg, tunnelId } from "./lib.ts";

const name = Bun.argv[2] ?? "";
const id = await tunnelId(name);
if (!id) throw new Error(`unknown tunnel ${name}`);
if (process.stdout.isTTY) throw new Error("refusing to print a tunnel token to a terminal: pipe it into systemd-creds");
process.stdout.write(await api<string>("GET", `/accounts/${cfg.account}/cfd_tunnel/${id}/token`));
