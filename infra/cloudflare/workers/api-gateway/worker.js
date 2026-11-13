// api.aphrody.com gateway (stateless). Catalogue from R2 (BUCKET, CATALOGUE prefix), /v1/downloads/* from R2 (DOWNLOADS prefix).
// Every other /v1/<service>/ answers 503 problem+json: its backend on prd no longer exists (2026-11-12) and has to be rebuilt.
const SERVICES = ["a2a", "bunos", "chat", "downloads", "fonts", "site", "store", "webos"];
const CORS = { "access-control-allow-origin": "*", "access-control-allow-methods": "GET, HEAD, OPTIONS", "access-control-allow-headers": "*" };
const HDR = { ...CORS, "x-content-type-options": "nosniff", "strict-transport-security": "max-age=63072000" };
const problem = (status, title, detail) =>
  new Response(JSON.stringify({ type: "about:blank", title, status, detail }), { status, headers: { ...HDR, "content-type": "application/problem+json" } });
async function serve(env, key, req, type) {
  const obj = await env.BUCKET.get(key, { range: req.headers, onlyIf: req.headers });
  if (!obj) return null;
  const h = new Headers(HDR);
  obj.writeHttpMetadata(h);
  if (type) h.set("content-type", type);
  h.set("etag", obj.httpEtag);
  h.set("accept-ranges", "bytes");
  if (!h.has("cache-control")) h.set("cache-control", "public, max-age=300");
  if (!("body" in obj)) return new Response(null, { status: 304, headers: h });
  let status = 200;
  if (obj.range && req.headers.has("range")) {
    const { offset = 0, length } = obj.range;
    h.set("content-range", `bytes ${offset}-${offset + length - 1}/${obj.size}`);
    status = 206;
  }
  return new Response(req.method === "HEAD" ? null : obj.body, { status, headers: h });
}
export default {
  async fetch(req, env) {
    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
    if (req.method !== "GET" && req.method !== "HEAD") return problem(405, "Method Not Allowed", "GET and HEAD only");
    const p = new URL(req.url).pathname;
    if (p === "/v1/health") return Response.json({ status: "ok", service: "gateway", version: "1" }, { headers: HDR });
    const cat = env.CATALOGUE.replace(/\/$/, "");
    const json = "application/json";
    if (p === "/" || p === "/v1" || p === "/v1/") return (await serve(env, cat + "/index.json", req, json)) || problem(404, "Not Found", "catalogue missing");
    if (p === "/v1/openapi.json") return (await serve(env, cat + "/openapi.json", req, json)) || problem(404, "Not Found", "openapi missing");
    const m = p.match(/^\/v1\/openapi\/([a-z0-9-]+\.json)$/);
    if (m) return (await serve(env, cat + "/" + m[1], req, json)) || problem(404, "Not Found", "unknown document");
    const s = p.match(/^\/v1\/([a-z0-9]+)\/(.*)$/);
    if (s && s[1] === "downloads") {
      const rest = decodeURIComponent(s[2]);
      if (rest.includes("..")) return problem(400, "Bad Request", "invalid path");
      return (await serve(env, env.DOWNLOADS.replace(/\/$/, "") + "/" + (rest || "manifest.json"), req)) || problem(404, "Not Found", "no such artifact");
    }
    if (s && SERVICES.includes(s[1])) return problem(503, "Service Unavailable", `/v1/${s[1]}/ backend is not deployed`);
    return problem(404, "Not Found", "See https://api.aphrody.com/v1/ for the API catalogue");
  },
};
