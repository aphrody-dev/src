import { runAll } from "./niu-e2e";
import { runDiff } from "./diff";
async function main(): Promise<void> {
  const rs = await runAll();
  const d = await runDiff();
  const bad = rs.filter((r) => !r.ok).length;
  const same = d.filter((r) => r.same).length;
  console.log(
    `e2e ${rs.length - bad}/${rs.length}  diffcorpus ${same}/${d.length}`,
  );
  process.exit(bad || same / d.length < 0.85 ? 1 : 0);
}
main();
