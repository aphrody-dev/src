// ai-os fabric : tissu d'inférence distribué (infra/ai/fabric.toml). Sorties JSON sur stdout.
//   ai-os fabric up [--only fr1,prd] [--split 1,7] [--local] [--no-warm]  admet les nœuds, démarre rpc-server puis le coordinateur
//   ai-os fabric status                                        coordinateur, nœuds (condition, charge, plafonds systemd)
//   ai-os fabric warm [--only fr1]                            nœuds : GGUF local vérifié, cache de tenseurs rempli
//   ai-os fabric down                                          arrête le coordinateur et les rpc-server
//   ai-os fabric bench [--tokens N] [prompt]                   une génération réelle, tokens/s
//   ai-os fabric node <id>                                     nœud Windows : rpc-server au premier plan
import { parseArgs } from "node:util";
import { bench, down, serveNode, status, up, warm } from "./index";

const { positionals, values } = parseArgs({
  args: Bun.argv.slice(2),
  allowPositionals: true,
  options: {
    only: { type: "string" },
    split: { type: "string" },
    local: { type: "boolean" },
    "no-warm": { type: "boolean" },
    tokens: { type: "string" },
  },
});
const [cmd, ...rest] = positionals;
const print = (x: unknown) => console.log(JSON.stringify(x, null, 2));
const list = (s?: string) => (s ? s.split(",").filter(Boolean) : undefined);

switch (cmd ?? "status") {
  case "up": {
    const r = await up({
      only: list(values.only),
      split: list(values.split)?.map(Number),
      local: values.local,
      noWarm: values["no-warm"],
    });
    print(r);
    process.exit(r.ok ? 0 : 1);
  }
  case "status":
    print(await status());
    break;
  case "warm":
    print(await warm(list(values.only)));
    break;
  case "down":
    print(await down());
    break;
  case "bench":
    print(
      await bench(
        rest.join(" ") || "Explain how a CPU cache works, in detail.",
        Number(values.tokens ?? 128),
      ),
    );
    break;
  case "node":
    process.exit(await serveNode(rest[0] ?? ""));
  default:
    console.error("usage : ai-os fabric up|status|down|bench|node <id>");
    process.exit(64);
}
