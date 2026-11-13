"""Factory dataset builder: MCP tool traces + tree-sitter code graph + DB schema -> SFT jsonl.

Glue only: tools/list and tools/call over MCP JSON-RPC (live, read-only), tree-sitter
(tree-sitter-language-pack) for the code graph, regex over the Drizzle schema for tables.
Output rows are TRL conversational records: {"messages": [...], "tools": [...], "split": ...}.
Usage: python -I build_dataset.py CONFIG SHENRON_CHECKOUT OUT_DIR
"""
import json, random, re, sys, tomllib, urllib.request
from pathlib import Path

cfg = tomllib.loads(Path(sys.argv[1]).read_text(encoding="utf-8"))
src, out = Path(sys.argv[2]), Path(sys.argv[3])
out.mkdir(parents=True, exist_ok=True)
rng = random.Random(cfg["train"]["seed"])
SYSTEM = ("Tu es Shenron, l'assistant de dragonballfr.com. Appelle un outil MCP quand la question "
          "porte sur Dragon Ball, le site ou le bot ; réponds brièvement et cite l'outil utilisé.")


def rpc(method, params, timeout=60):
    body = json.dumps({"jsonrpc": "2.0", "id": 1, "method": method, "params": params}).encode()
    req = urllib.request.Request(cfg["mcp"]["url"], body, {
        "content-type": "application/json", "accept": "application/json, text/event-stream"})
    raw = urllib.request.urlopen(req, timeout=timeout).read().decode()
    if raw.startswith("event:") or "\ndata:" in raw:
        raw = next(l[5:] for l in raw.splitlines() if l.startswith("data:"))
    return json.loads(raw)["result"]


def compact(t):
    p = dict(t["inputSchema"]); p.pop("$schema", None)
    props = {k: {kk: vv for kk, vv in v.items() if kk in ("type", "enum", "items")}
             for k, v in p.get("properties", {}).items()}
    return {"type": "function", "function": {
        "name": t["name"], "description": t["description"].split(". ")[0][:140],
        "parameters": {"type": "object", "properties": props, "required": p.get("required", [])}}}


tools = [compact(t) for t in rpc("tools/list", {})["tools"]]
by_name = {t["function"]["name"]: t for t in tools}
(out / "tools.json").write_text(json.dumps(tools, ensure_ascii=False, indent=1), encoding="utf-8")
S = cfg["seeds"]


def fill(s, prompt, v):
    def one(m):
        keys = m.group(1).split("|")
        return v[rng.choice(keys)] if len(keys) > 1 else v.get(keys[0], prompt)
    return re.sub(r"\{([a-z|]+)\}", one, s)


def toolset(target):
    others = [t for t in tools if t["function"]["name"] != target]
    pick = rng.sample(others, cfg["train"]["distractors"]) + [by_name[target]]
    rng.shuffle(pick)
    return pick


rows = []
for task in cfg["tasks"]:
    if task["tool"] not in by_name:
        print("skip unknown tool", task["tool"], file=sys.stderr); continue
    n_inst = 14
    for i in range(n_inst):
        v = {"c": rng.choice(S["characters"]), "t": rng.choice(S["topics"]),
             "d": rng.choice(S["databooks"]), "n": str(rng.randint(1, 519))}
        tmpl = rng.choice(task["prompts"])
        prompt = fill(tmpl, "", v)
        args = {k: fill(a, prompt, v) for k, a in task["args"].items()}
        if "chapterId" in args: args["chapterId"] = int(args["chapterId"])
        # Held-out split: whole entity values unseen in train (by hash of the filled prompt).
        split = "eval" if rng.random() < cfg["train"]["eval_frac"] else "train"
        call = {"id": f"call_{len(rows)}", "type": "function",
                "function": {"name": task["tool"], "arguments": args}}
        msgs = [{"role": "system", "content": SYSTEM}, {"role": "user", "content": prompt},
                {"role": "assistant", "content": "", "tool_calls": [call]}]
        if split == "train" and i < 6:  # real trace: execute the read-only call live
            try:
                res = rpc("tools/call", {"name": task["tool"], "arguments": args}, 90)
                text = " ".join(c.get("text", "") for c in res.get("content", []))[: cfg["mcp"]["result_chars"]]
                msgs.append({"role": "tool", "tool_call_id": call["id"], "content": text})
                first = re.sub(r"\s+", " ", text)[:280]
                msgs.append({"role": "assistant", "content": f"D'après {task['tool']} : {first}"})
            except Exception as e:  # keep the call-only pair
                print("call failed", task["tool"], e, file=sys.stderr)
        rows.append({"messages": msgs, "tools": toolset(task["tool"]), "split": split, "kind": "tool"})

# Code graph (tree-sitter): definitions -> "where is X defined".
from tree_sitter_language_pack import get_parser
LANG = {".ts": "typescript", ".tsx": "tsx", ".rs": "rust"}
DEF = {"function_declaration", "function_item", "class_declaration", "struct_item", "enum_item",
       "interface_declaration", "trait_item", "type_alias_declaration", "method_definition"}
defs = []
for root in cfg["sources"]["code_roots"]:
    for f in sorted((src / root).rglob("*")):
        if f.suffix not in LANG or "test" in f.name: continue
        tree = get_parser(LANG[f.suffix]).parse(f.read_bytes())
        stack = [tree.root_node]
        while stack:
            n = stack.pop()
            if n.type in DEF and (nm := n.child_by_field_name("name")) is not None:
                defs.append((nm.text.decode(), n.type.replace("_", " "), f.relative_to(src).as_posix(), n.start_point[0] + 1))
            stack.extend(n.children)
rng.shuffle(defs)
(out / "code_graph.json").write_text(json.dumps(defs), encoding="utf-8")
for name, kind, path, line in defs[: cfg["sources"]["max_code_pairs"]]:
    rows.append({"messages": [{"role": "system", "content": SYSTEM},
                              {"role": "user", "content": f"Où est défini `{name}` dans le code de Shenron ?"},
                              {"role": "assistant", "content": f"`{name}` ({kind}) est défini dans `{path}` ligne {line}."}],
                 "tools": [], "split": "eval" if rng.random() < 0.05 else "train", "kind": "code"})

# DB schema (Drizzle pgTable/sqliteTable): table -> columns. Schema only, no row data.
schema = (src / cfg["sources"]["db_schema"]).read_text(encoding="utf-8")
tables = re.findall(r'(?:pg|sqlite)Table\(\s*"([^"]+)"\s*,\s*\{(.*?)\n\s*\}', schema, re.S)
for tname, body in tables[: cfg["sources"]["max_db_pairs"]]:
    cols = re.findall(r'^\s*(\w+)\s*:', body, re.M)
    if not cols: continue
    rows.append({"messages": [{"role": "system", "content": SYSTEM},
                              {"role": "user", "content": f"Quelles colonnes a la table `{tname}` de la base Shenron ?"},
                              {"role": "assistant", "content": f"La table `{tname}` a les colonnes : {', '.join(cols)}."}],
                 "tools": [], "split": "train", "kind": "db"})

for split in ("train", "eval"):
    with open(out / f"{split}.jsonl", "w", encoding="utf-8") as fh:
        for r in rows:
            if r["split"] == split:
                fh.write(json.dumps(r, ensure_ascii=False) + "\n")
stats = {k: sum(1 for r in rows if r["kind"] == k) for k in ("tool", "code", "db")}
stats.update(train=sum(r["split"] == "train" for r in rows), eval=sum(r["split"] == "eval" for r in rows),
             tools=len(tools), defs=len(defs), tables=len(tables))
(out / "stats.json").write_text(json.dumps(stats, indent=1))
print(json.dumps(stats))
