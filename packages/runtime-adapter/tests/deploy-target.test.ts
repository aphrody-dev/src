import { expect, test } from "bun:test";
import { join } from "node:path";
import { cronToCalendar, render } from "../../../scripts/deploy-target";

const toml = Bun.TOML.parse(await Bun.file(join(import.meta.dir, "../../../deploy.toml")).text()) as Record<string, any>;

test("downloads renders for all three targets from deploy.toml", () => {
  const cf = render("downloads", "cf", toml)["cloudflare.config.ts"]!;
  expect(cf).toContain('bindings.r2({ name: "aphrody-dist" })');
  expect(cf).toContain('"downloads.aphrody.com"');
  const v = render("downloads", "vercel", toml);
  expect(JSON.parse(v["vercel.json"]!).bunVersion).toBe("1.4.x");
  const vps = render("downloads", "vps", toml);
  const usa = toml.nodes.usa.mesh_ip;
  expect(vps["downloads.conf"]).toContain(`proxy_pass http://${usa}:8797`);
  expect(vps["downloads.service"]).toContain("Environment=STORAGE=s3");
  for (const f of Object.values({ ...vps, ...v })) expect(f).not.toMatch(/SECRET_ACCESS_KEY=|CRON_SECRET=/);
});

test("commercial apps are refused on Vercel Hobby", () => {
  expect(() => render("aphrody", "vercel", toml)).toThrow(/commercial/);
});

test("wrangler projects keep their wrangler config", () => {
  expect(render("aphrody", "cf", toml)["README.txt"]).toContain("wrangler");
});

test("cron -> OnCalendar", () => {
  expect(cronToCalendar("17 4 * * *")).toBe("*-*-* 04:17:00");
  expect(cronToCalendar("0 */6 * * 1")).toBe("Mon *-*-* 00/6:00:00");
});
