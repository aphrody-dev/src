// headersHelper du serveur MCP « relay » de Claude Code (infra/agents/toolchain.toml, headers_helper) : imprime
// l'en-tête Authorization portant le jeton local du relais (fichier privé de l'utilisateur), jamais écrit dans
// ~/.claude.json ni dans argv. Sans consentement OAuth interactif : le relais accepte son jeton fixe en local.
import { relayToken } from "../../ai-os/src/relay/server.ts";

// Écriture attendue avant la sortie : un process.exit() immédiat peut tronquer un tube sous Windows.
await Bun.write(
  Bun.stdout,
  JSON.stringify({ Authorization: `Bearer ${await relayToken()}` }),
);
process.exitCode = 0;
