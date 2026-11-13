// Duplicate-request ratio from nginx logs (stdin). Usage:
//   ... access.log | bun infra/cluster/dedup.ts combined [window_s]   -> before: share of requests repeating
//        (same method+path) within window_s seconds, i.e. what an origin receives without coalescing.
//   ... aphrody-cluster.log | bun infra/cluster/dedup.ts cluster      -> after: share served without an origin fetch.
const mode = Bun.argv[2] ?? "combined";
const win = Number(Bun.argv[3] ?? 1);
const mon: Record<string, number> = {
  Jan: 0,
  Feb: 1,
  Mar: 2,
  Apr: 3,
  May: 4,
  Jun: 5,
  Jul: 6,
  Aug: 7,
  Sep: 8,
  Oct: 9,
  Nov: 10,
  Dec: 11,
};
let total = 0,
  dup = 0,
  originFetch = 0;
const last = new Map<string, number>();
const status: Record<string, number> = {};
let rest = "";
for await (const chunk of Bun.stdin
  .stream()
  .pipeThrough(new TextDecoderStream())) {
  const lines = (rest + chunk).split("\n");
  rest = lines.pop() ?? "";
  for (const line of lines) {
    if (mode === "combined") {
      const m =
        /\[(\d+)\/(\w+)\/(\d+):(\d+):(\d+):(\d+) [^\]]+\] "(\w+) ([^ ?"]+)/.exec(
          line,
        );
      if (!m) continue;
      const t = Date.UTC(+m[3], mon[m[2]], +m[1], +m[4], +m[5], +m[6]) / 1000;
      const k = `${m[7]} ${m[8]}`;
      total++;
      const p = last.get(k);
      if (p !== undefined && t - p <= win) dup++;
      last.set(k, t);
    } else {
      const f = line.split(" ");
      if (f.length < 9 || f[8] === "-") continue; // no X-Cluster-Entry = health check, not traffic
      total++;
      const cs = f[6];
      status[cs] = (status[cs] ?? 0) + 1;
      if (!["HIT", "UPDATING", "STALE", "REVALIDATED"].includes(cs))
        originFetch++;
    }
  }
}
const pct = (a: number) => (total ? ((100 * a) / total).toFixed(2) : "0") + "%";
if (mode === "combined")
  console.log(
    JSON.stringify({
      mode,
      window_s: win,
      total,
      duplicates: dup,
      duplicate_ratio: pct(dup),
      distinct_keys: last.size,
    }),
  );
else
  console.log(
    JSON.stringify({
      mode,
      total,
      origin_fetches: originFetch,
      served_without_origin: pct(total - originFetch),
      by_cache_status: status,
    }),
  );
