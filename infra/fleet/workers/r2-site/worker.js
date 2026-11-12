// Generic static site served from R2. Config only via bindings/vars:
//   BUCKET (R2 binding), PREFIX (key prefix, e.g. "sites/<host>"), SERVICE (health name), SPA ("1" = fallback to /index.html)
// Optional <PREFIX>/_headers (Netlify/CF Pages syntax, "*" wildcard) is applied in order, later rules win.
const SEC = {
  "x-content-type-options": "nosniff",
  "strict-transport-security": "max-age=63072000",
  "referrer-policy": "strict-origin-when-cross-origin",
};
const K = (k) => k.replace(/^\//, ""); // PREFIX "" = bucket root
const RULES = new Map();
async function rules(env, base) {
  if (RULES.has(base)) return RULES.get(base);
  const obj = await env.BUCKET.get(K(base + "/_headers"));
  const out = [];
  if (obj) for (const line of (await obj.text()).split("\n")) {
    if (!line.trim() || line.trim().startsWith("#")) continue;
    if (!/^\s/.test(line)) {
      const glob = line.trim().replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*");
      out.push({ re: new RegExp("^" + glob + "$"), h: [] });
      continue;
    }
    const i = line.indexOf(":");
    if (i > 0 && out.length) out[out.length - 1].h.push([line.slice(0, i).trim(), line.slice(i + 1).trim()]);
  }
  RULES.set(base, out);
  return out;
}
async function fetchKey(env, key, req) {
  return env.BUCKET.get(K(key), { range: req.headers, onlyIf: req.headers });
}
export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    if (req.method !== "GET" && req.method !== "HEAD") return new Response("method not allowed", { status: 405 });
    if (url.pathname === "/health")
      return Response.json({ status: "ok", service: env.SERVICE || "r2-site" }, { headers: SEC });
    const base = (env.PREFIX || "").replace(/\/$/, "");
    let path = decodeURIComponent(url.pathname);
    if (path.endsWith("/")) path += "index.html";
    let obj = await fetchKey(env, base + path, req);
    if (!obj && !path.split("/").pop().includes(".")) obj = await fetchKey(env, base + path + "/index.html", req);
    let status = 200;
    if (!obj && env.SPA === "1") obj = await fetchKey(env, base + "/index.html", req);
    if (!obj) { obj = await env.BUCKET.get(K(base + "/404.html")); status = 404; if (!obj) return new Response("not found", { status, headers: SEC }); }
    const h = new Headers(SEC);
    obj.writeHttpMetadata(h);
    for (const r of await rules(env, base)) if (r.re.test(url.pathname)) for (const [k, v] of r.h) h.set(k, v);
    h.set("etag", obj.httpEtag);
    h.set("accept-ranges", "bytes");
    if (!("body" in obj)) return new Response(null, { status: 304, headers: h });
    if (obj.range && req.headers.has("range")) {
      const { offset = 0, length } = obj.range;
      h.set("content-range", `bytes ${offset}-${offset + length - 1}/${obj.size}`);
      status = 206;
    }
    if (!h.has("cache-control")) h.set("cache-control", path.endsWith(".html") ? "public, max-age=60" : "public, max-age=3600");
    return new Response(req.method === "HEAD" ? null : obj.body, { status, headers: h });
  },
};
