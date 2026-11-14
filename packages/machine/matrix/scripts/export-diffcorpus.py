import ast, glob, json, sys
out = []
for f in sorted(glob.glob(sys.argv[1] + "/cases/*.py")):
    t = ast.parse(open(f, encoding="utf8").read())
    for n in t.body:
        if isinstance(n, ast.Assign) and getattr(n.targets[0], "id", "") == "CASES":
            for c in ast.literal_eval(n.value):
                out.append({"id": c[0], "domain": c[1], "script": c[2]})
json.dump(out, open(sys.argv[2], "w", encoding="utf8"), ensure_ascii=False)
print(len(out))
