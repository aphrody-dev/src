// Tissu d'inférence : lecture de infra/ai/fabric.toml, ordre de -ts (nœuds RPC puis CUDA0), arguments du coordinateur
// (jamais d'écoute hors boucle locale), ligne ssh (valeurs citées), port fermé. Aucun hôte distant contacté.
import { expect, test } from "bun:test";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

process.env.AGENT_HOME = mkdtempSync(join(tmpdir(), "ai-os-fabric-"));
const { coordinatorArgs, loadFabric, reachable, remoteLine, tensorSplit } =
  await import("../../src/fabric/index.ts");

const f = loadFabric();

test("fabric.toml : coordinateur local, nœuds liés à WireGuard, binaires épinglés", () => {
  expect(f.coordinator.host).toBe("127.0.0.1");
  expect(f.release.tag).toMatch(/^b\d+$/);
  for (const n of f.node.filter((x) => x.os === "linux")) {
    expect(n.bind).toMatch(/^10\.200\.7[78]\./);
    expect(n.memory_max).toBeTruthy();
    expect(n.cpu_quota).toBeTruthy();
  }
  const prd = f.node.find((n) => n.id === "prd")!;
  expect(prd.gate).toBe("prd");
  expect(prd.heavy_lock).toBe("/var/lock/aphrody-heavy.lock");
  expect(f.node.find((n) => n.id === "fr1")!.gate).toBe("no-build");
});

test("-ts : nœuds RPC dans l'ordre admis, puis l'appareil local ; vide si une part manque", () => {
  expect(tensorSplit(f, ["fr1"])).toEqual([1, 7]);
  expect(tensorSplit(f, ["fr1", "prd"])).toEqual([1, 1, 7]);
  expect(tensorSplit(f, [])).toEqual([]);
  expect(tensorSplit(f, ["gpu2"])).toEqual([]);
});

test("arguments du coordinateur", () => {
  const a = coordinatorArgs(f, "m.gguf", ["10.200.77.1:50052"], [1, 7]);
  expect(a.slice(a.indexOf("--host"), a.indexOf("--host") + 2)).toEqual([
    "--host",
    "127.0.0.1",
  ]);
  expect(a).toContain("--rpc");
  expect(a[a.indexOf("-ts") + 1]).toBe("1,7");
  expect(coordinatorArgs(f, "m.gguf", [])).not.toContain("--rpc");
});

test("ligne ssh : valeurs entre apostrophes, sudo -n hors root", () => {
  const l = remoteLine({ PRIO: "http://x/'; rm -rf /", PORT: "50052" }, "up");
  expect(l).toContain(`PRIO='http://x/'\\''; rm -rf /'`);
  expect(l).toContain(`sudo -n`);
  expect(l.endsWith(`node.sh 'up'`)).toBe(true);
});

test("port fermé : non joignable, sans exception", async () => {
  expect(await reachable("127.0.0.1", 1, 1000)).toBe(false);
  expect(await reachable("", 50052)).toBe(false);
});
