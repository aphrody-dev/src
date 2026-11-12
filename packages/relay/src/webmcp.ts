// WebMCP (webmachinelearning/webmcp, document.modelContext.registerTool ; essai d'origine Chrome 149+, drapeau
// about:flags#enable-webmcp-testing en local) : la page /webmcp du relais expose ses outils (et ceux des serveurs MCP
// agrégés) à l'agent du navigateur, par exemple Gemini dans Chrome. Chaque appel repasse par POST /mcp tools/call.
import { TOOLS } from "./tools.ts";
import { hubTools } from "./mcp-hub.ts";

export async function webmcpPage(): Promise<string> {
  const tools = [
    ...TOOLS.map((t) => ({
      name: t.name,
      description: t.description,
      inputSchema: t.inputSchema,
    })),
    ...(Bun.env.RELAY_HUB === "0"
      ? []
      : (await hubTools()).map((t) => ({
          name: t.name,
          description: `[${t.server}] ${t.description ?? ""}`,
          inputSchema: t.inputSchema ?? { type: "object" },
        }))),
  ];
  return `<!doctype html><html lang="fr"><meta charset="utf-8"><title>aphrody relay — WebMCP</title>
<body><pre id="s">WebMCP : enregistrement…</pre><script type="module">
const tools = ${JSON.stringify(tools).replace(/</g, "\\u003c")};
const s = document.getElementById("s");
const mc = document.modelContext ?? navigator.modelContext;
if (!mc?.registerTool) { s.textContent = "WebMCP indisponible : Chrome 149+ avec about:flags#enable-webmcp-testing"; }
else {
  let id = 0;
  for (const t of tools) {
    await mc.registerTool({
      name: t.name, description: t.description, inputSchema: t.inputSchema,
      async execute(args) {
        const r = await fetch("/mcp", { method: "POST", credentials: "same-origin", headers: { "content-type": "application/json" },
          body: JSON.stringify({ jsonrpc: "2.0", id: ++id, method: "tools/call", params: { name: t.name, arguments: args ?? {} } }) });
        const j = await r.json();
        return j.result ?? { content: [{ type: "text", text: j.error?.message ?? "erreur" }], isError: true };
      },
    });
  }
  s.textContent = "WebMCP : " + tools.length + " outils enregistrés";
}
</script></body></html>`;
}
