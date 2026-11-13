// headersHelper des serveurs MCP HTTP de infra/agents/toolchain.toml : lit chaque secret dans le coffre env-kit
// et imprime l'objet JSON des en-têtes sur stdout, que Claude Code lit seul (jamais écrit dans settings ni argv).
// Usage (posé par toolchain.ts) : bun packages/machine/src/mcp-headers.ts <En-tête>=<NOM_DU_SECRET> ...
import { secretGet } from "../../env-kit/src/secret-store.ts";

const headers: Record<string, string> = {};
for (const pair of process.argv.slice(2)) {
  const i = pair.indexOf("=");
  const [header, name] = [pair.slice(0, i), pair.slice(i + 1)];
  const v = secretGet(name);
  if (!v) {
    console.error(`mcp-headers : ${name} absent du coffre env-kit`);
    process.exit(1);
  }
  headers[header] = v;
}
process.stdout.write(JSON.stringify(headers));
